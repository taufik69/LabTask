# Project Documentation

A full-stack social feed application — users can register/login, create posts (with images), comment (with replies), and like posts/comments. Built as a monorepo with a Node/Express backend and a React (Vite + TypeScript) frontend.

## Tech Stack

**Backend**
- Node.js, Express 5, MongoDB (Mongoose)
- Redis (`ioredis`) for caching and as the BullMQ connection
- BullMQ for background job processing (image upload pipeline)
- Cloudinary for image storage
- JWT (access + refresh tokens) for auth, `bcrypt` for password hashing
- Joi for request validation, Winston for logging, Multer for multipart uploads
- `express-rate-limit` for abuse protection

**Frontend**
- React 19 + TypeScript, Vite
- TanStack React Query for server-state/caching
- React Router 7 for routing
- React Hook Form for forms
- Axios for HTTP, React Toastify for notifications, `react-error-boundary` for error handling

## Architecture

### Backend — modular, layered structure

Each domain (`user`, `post`, `comment`, `like`) lives under `backend/src/modules/<name>/` with a consistent set of files:

```
<name>.routes.js      -> Express route definitions
<name>.controller.js  -> HTTP layer (req/res), delegates to service
<name>.service.js     -> business logic
<name>.repository.js  -> data-access layer (Mongoose queries)
<name>.model.js       -> Mongoose schema
<name>.dto.js         -> response shaping
<name>.validator.js   -> Joi schemas (post/user/comment only)
```

This keeps controllers thin and business logic testable/independent of Express, and keeps raw Mongoose queries out of services.

### Polymorphic likes (single `like` module for posts and comments)

Rather than duplicating like logic per entity, `like.service.js` uses a small **target resolver registry**:

```js
const targetResolvers = {
  Post: { findById, incrementLikeCount },
  Comment: { findById, incrementLikeCount },
};
```

`ToggleLike` looks up the resolver for `targetType` and works generically. It reads the target models directly (not through `post.repository.js` / `comment.repository.js`) so the like module stays self-contained and doesn't require changes to the other modules when it's added. Like/unlike + the target's denormalized `likeCount` update happen inside a MongoDB transaction (`mongoose.startSession()` + `withTransaction`) so the count can never drift from the actual like rows.

The image worker (`image.worker.js`) mirrors this same registry pattern for image targets (`Post`, `Comment`), so any model with an `image` subdocument can be processed by one shared worker.

### Image uploads are asynchronous (BullMQ + Redis)

Uploading a post/comment image doesn't block the request:
1. Multer saves the file locally and the post/comment is created immediately with `image.status: "pending"`.
2. A job (`{ targetType, targetId, localFilePath }`) is pushed onto the `image-upload` BullMQ queue.
3. `image.worker.js` (run as a separate process via `npm run worker`) picks up the job, uploads to Cloudinary, and updates the document's `image.status` to `uploaded` (with the URL) or `failed`.

**Decisions/tradeoffs:**
- Jobs retry up to 5 times with exponential backoff. The local file is only deleted once a job **succeeds or exhausts all retries** — a retried job needs the file to still be on disk for the next attempt, so cleanup ownership was moved from the upload helper into the worker.
- The queue payload supports two shapes (`{ postId }` from the original post flow, `{ targetType, targetId }` from newer producers like comments) so the existing post module didn't need to change when comments gained image support.
- On successful upload or final failure for a `Post` image, the feed cache namespace is bumped (see below) so stale "pending" thumbnails don't linger in a cached feed page.

### Caching — namespace-versioned Redis keys

`cache.util.js` implements cache invalidation via a **version counter per namespace** instead of deleting individual keys:

```
key = "<namespace>:v<version>:<suffix>"
```

To invalidate everything under a namespace (e.g. after a new post is created), the code calls `bumpNsVersion(ns)`, which atomically increments `<ns>:v` in Redis. Every previously-cached key for that namespace instantly becomes unreachable (since it was built with the old version number) without needing to know or scan all the actual keys — old entries simply expire via their TTL. This avoids the need for `KEYS`/`SCAN` + bulk delete, which is safer and cheaper under load.

### Pagination — cursor-based, not offset-based

`cursor.util.js` encodes a cursor as `base64url("<createdAt-ISO>_<_id>")` and feed/comment queries use keyset pagination (`createdAt < cursor.createdAt OR (createdAt == cursor.createdAt AND _id < cursor._id)`) rather than `skip/limit`. This avoids the performance degradation and skipped/duplicated-row issues offset pagination has on a collection that's actively being inserted into (a live feed).

### Auth

- Access tokens are short-lived JWTs sent as `Authorization: Bearer <token>`; refresh tokens are set as an httpOnly cookie and used to mint new access tokens (`user.service.js`).
- `auth.middleware.js` exposes both `requireAuth` (rejects missing/invalid tokens) and `optionalAuth` (attaches `req.user` if a valid token is present, otherwise continues as anonymous) — used on routes like the feed where likes/ownership are only relevant if the caller is logged in.
- `authLimiter` (5 req / 15 min) is applied to login/register routes specifically; a more permissive `apiLimiter` (100 req / 15 min) applies elsewhere.

### Frontend — module-per-domain, mirroring the backend

`frontend/src/modules/<name>/` contains `*.api.ts` (Axios calls), `*.hooks.ts` (React Query hooks), `*.types.ts`, and a `components/` folder — same rationale as the backend: keep data-fetching, typing, and UI concerns separable.

**Key pieces:**
- **`ProtectedRoute.tsx`** — a simple client-side guard that checks for an access token in `localStorage` and redirects to `/login` if absent; actual authorization is still enforced server-side.
- **`useInfiniteScroll.ts`** — a small reusable hook wrapping `IntersectionObserver` against a sentinel element, used to drive React Query's `fetchNextPage` for the feed instead of a "Load more" button or scroll-position math.
- **`LazyImage.tsx`** — renders images with native `loading="lazy"` plus a blur-up transition (blurred until `onLoad` fires) to reduce layout jank on image-heavy feeds.
- **`PostCardSkeleton.tsx`** — skeleton placeholder shown while the feed's first page is loading, avoiding a blank-screen flash.
- **Error handling** — `react-error-boundary`'s `ErrorFallback.tsx` wraps the app for render-time errors; `getApiErrorMessage.ts` normalizes Axios/Joi error shapes into user-facing strings for toasts.
- **Caching** — React Query (`queryClient.ts`) is the single source of truth for server state (posts, comments), so manual client-side cache bookkeeping was avoided; cache invalidation on mutations (like, comment, create post) is done via query key invalidation rather than manual state patching.

## Repo Layout

```
backend/
  src/
    config/        # db, redis, cloudinary, logger, env
    modules/        # user, post, comment, like (routes/controller/service/repository/model)
    queues/         # BullMQ queue definitions
    workers/        # BullMQ worker processes (run separately via `npm run worker`)
    shared/          # middlewares, utils, constants shared across modules
frontend/
  src/
    modules/        # user, post, comment, like (api/hooks/types/components)
    routes/          # route table + ProtectedRoute
    shared/          # api client, hooks, components, utils shared across modules
```

## Running Locally

```bash
# backend (also requires MongoDB + Redis running, and a .env with DB/Redis/JWT/Cloudinary config)
cd backend && npm install
npm run dev       # API server
npm run worker    # image-processing worker (separate process)

# frontend
cd frontend && npm install
npm run dev
```
