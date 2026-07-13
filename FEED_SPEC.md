# Feed Feature — Implementation Spec

Scope: functionality only, minimal UI. Build in the order below — each part
should be working and testable before starting the next.

## Visibility rule (applies everywhere posts are read)

A post is visible to a viewer if:
- `post.visibility === "public"`, OR
- `post.visibility === "private"` AND `post.author === viewer._id`

Every list/detail query for posts must apply this filter server-side. Never
trust a client-supplied "show private" flag.

## Cross-cutting prerequisite: auth middleware

`backend/src/shared/middlewares/auth.middleware.js` is currently an **empty
file**. Every part below needs it, so build it first, standalone:

- Reads `Authorization: Bearer <token>` header.
- Verifies with `process.env.ACCESS_TOKEN_SECRET` (same secret
  `user.model.js#generateAccessToken` signs with).
- On success: attaches `req.user = { _id, email, username }` (the JWT
  payload shape already used at `user.model.js:83-93`), calls `next()`.
- On missing/invalid/expired token: `401` via `ApiResponse.error`, using the
  existing `AppError` class so it flows through `globalErrorHandler.util.js`.
- Export both:
  - `requireAuth` — hard-fails if no valid token (create/like/comment routes).
  - `optionalAuth` — attaches `req.user` if a valid token is present,
    otherwise continues with `req.user = undefined` (needed for the feed
    route, since anonymous viewers can still see public posts, but
    like-state and private posts depend on knowing who's asking).

Verify standalone with curl against a throwaway protected route before
moving on — don't let this get entangled with Part 1's review.

---

## Part 1 — Posts (create + feed)

### Backend

Fill in the existing skeletons (`post.repository.js`, `post.service.js`,
`post.dto.js`, `post.controller.js`, `post.routes.js`) — do not restructure
them.

**`post.repository.js`**
- `create(data)`
- `findById(id)`
- `findFeed({ viewerId, page, limit })` — returns posts where
  `visibility: "public"` OR (`visibility: "private"` AND `author: viewerId`),
  sorted `createdAt: -1`, paginated. Use the existing
  `{ visibility: 1, createdAt: -1 }` index.
- `findByAuthor({ authorId, viewerId, page, limit })` — same visibility rule,
  scoped to one author (profile page use case, optional for this part).

**`post.service.js`**
- `CreatePost(authorId, body)` — if `body.image` present with a
  `localFilePath`, enqueue `imageQueue` (already built in
  `src/queues/image.queue.js`) instead of resolving the Cloudinary URL
  inline; save the post with `image.status: "pending"` first.
- `GetFeed(viewerId, { page, limit })` — calls repository, then bulk-attaches
  each viewer's like-state (depends on Part 2 — stub this as
  `isLikedByViewer: false` until Part 2 lands).

**`post.dto.js`**
- `PostDTO.toResponse(post, { isLikedByViewer })` → `{ id, author: {id,
  firstName, lastName, username}, text, image, visibility, likeCount,
  commentCount, isLikedByViewer, createdAt }`. Author must be `populate()`d
  in the repository query — never leak the full `User` document (no
  password/refreshToken).
- `PostDTO.toListResponse(posts, likedPostIds)`.

**`post.controller.js`** + **`post.routes.js`**
- `POST /api/v1/posts` — `requireAuth`, `validate(createPostSchema)`.
  `author` comes from `req.user._id`, never from the request body.
- `GET /api/v1/posts` — `optionalAuth`. Query params: `page`, `limit`.
  Returns feed via `ApiResponse.paginated`.
- `GET /api/v1/posts/:id` — `optionalAuth`. 404 if not found; 403 (or 404 —
  pick one, see note below) if private and viewer isn't the author.

> Note: for a private post the viewer isn't authorized to see, prefer
> returning `404` over `403` so you don't leak the post's existence to
> strangers. Decide once, apply consistently to posts/comments/replies.

Mount `postRoute` is already done in `app.js`.

### Frontend

- `modules/post/post.types.ts`, `post.api.ts` (`createPost`, `getFeed`),
  `post.hooks.ts` (`useCreatePost`, `useFeed` — `useInfiniteQuery` if you
  want pagination, plain `useQuery` is fine to start).
- Wire `FeedPage.tsx`: a create-post box (text + file input) above the list,
  and the list itself sorted newest-first (trust the backend order, don't
  re-sort client-side).
- Toasts on create success/error (same `getApiErrorMessage` pattern already
  used in Login/Registration).

### Done when
- Logged-in user posts text-only, image-only, and text+image.
- Feed shows newest first.
- A private post is visible to its author and invisible to every other
  logged-in user and to a logged-out visitor.
- Image posts show `status: "pending"` immediately, then flip to the
  uploaded Cloudinary URL after the worker finishes (`npm run worker` must
  be running).

---

## Part 2 — Likes (posts only, comments come later)

### Backend

Scaffold `modules/like/` the same way `post/` was scaffolded
(`like.repository.js`, `like.service.js`, `like.controller.js`,
`like.routes.js` — `like.model.js` already exists).

**`like.repository.js`**
- `create({ user, targetType, targetId })` — rely on the existing unique
  index `{ user, targetType, targetId }` to reject duplicates instead of a
  pre-check query.
- `delete({ user, targetType, targetId })`
- `exists({ user, targetType, targetId })`
- `findByTarget({ targetType, targetId, page, limit })` — populate `user`
  with `{ firstName, lastName, username }` only. This powers "who liked
  this".
- `findLikedTargetIds({ user, targetType, targetIds })` — one query, returns
  the subset of `targetIds` this user has liked. Used to bulk-annotate a
  feed page instead of N+1 queries.

**`like.service.js`**
- `ToggleLike(userId, targetType, targetId)` — if `exists`, delete
  (unlike) and decrement the target's `likeCount`; else create and
  increment. Wrap the write + counter update in a
  [Mongo transaction](https://mongoosejs.com/docs/transactions.html) if
  your MongoDB deployment supports it (Atlas does); otherwise do
  best-effort sequential writes and note the race condition rather than
  silently ignoring it.
- Validate `targetType` maps to a real target (`Post` must exist via
  `postRepository.findById`, and — for the later comment part —
  `Comment` via `commentRepository.findById`) before writing the like.

**Routes** — mount under the owning resource, not a generic `/likes`:
- `POST /api/v1/posts/:id/like` — `requireAuth`, toggles.
- `GET /api/v1/posts/:id/likes` — `optionalAuth`, paginated list of likers
  (`{ id, firstName, lastName, username }[]`).

Update `post.service.js#GetFeed` to actually call
`like.repository.findLikedTargetIds` now, replacing the Part 1 stub.

### Frontend
- `post.hooks.ts`: `useToggleLike` — optimistic update (flip `isLikedByViewer`
  and `likeCount` immediately, roll back on error) so the button feels
  instant.
- Like button on each post reflects `isLikedByViewer` (filled vs outline).
- A small "N likes" affordance that opens a list of likers
  (`GET /posts/:id/likes`) — plain list is fine, no modal polish needed.

### Done when
- Liking/unliking a post updates the count and persists across reload.
- Two different logged-in users show correct independent like-state on the
  same post.
- "Who liked this" lists the right users.

---

## Part 3 — Comments (top-level only, no replies yet)

### Backend

Scaffold `modules/comment/` (`comment.repository.js`, `comment.service.js`,
`comment.dto.js`, `comment.controller.js`, `comment.routes.js`,
`comment.validator.js` — model already exists).

**`comment.repository.js`**
- `create({ post, author, text, parent: null })`
- `findByPost({ postId, page, limit })` — top-level only:
  filter `parent: null`, sort `createdAt: 1` (oldest-first reads more
  naturally for comment threads — confirm with product intent, but this is
  the common default), use the existing `{ post, parent, createdAt }` index.
- `findById(id)`
- `incrementCommentCount(postId, delta)` / reuse the same transaction
  pattern from Part 2 to keep `Post.commentCount` in sync.

**`comment.validator.js`**
- `createCommentSchema` — `{ text: required, max 2000 }` (matches
  `commentSchema.text` maxlength).

**Routes**
- `POST /api/v1/posts/:postId/comments` — `requireAuth`. Must check the
  target post's visibility rule first (can't comment on a private post you
  can't see).
- `GET /api/v1/posts/:postId/comments` — `optionalAuth`, paginated,
  `parent: null` only. Same visibility check as above.
- Reuse Part 2's like routes pattern for comments:
  `POST /api/v1/comments/:id/like`, `GET /api/v1/comments/:id/likes`
  (`targetType: "Comment"`).

**`comment.dto.js`**
- `CommentDTO.toResponse(comment, { isLikedByViewer })` → `{ id, post,
  author: {...}, text, replyCount, likeCount, isLikedByViewer, createdAt }`.

### Frontend
- `modules/comment/comment.types.ts`, `.api.ts`, `.hooks.ts`.
- Comment list under each post (collapsed by default is fine), a text input
  to add one, like button reusing the same optimistic-toggle pattern as
  Part 2.

### Done when
- Comments show under the correct post, oldest-first (or your chosen order —
  just be consistent).
- `Post.commentCount` stays accurate after adding comments.
- Comment likes work the same way post likes do.

---

## Part 4 — Replies

### Backend

No new model — `comment.model.js` already supports `parent`. Extend
`comment.service.js`/`comment.repository.js`:

- `create({ post, author, text, parent: <commentId> })` — reject if
  `parent`'s own `parent` is non-null (cap thread depth at one level: a
  reply cannot itself be replied to as a nested reply — flatten to
  comment → reply, not infinite nesting, unless you specifically want deeper
  threads).
- `findReplies({ parentId, page, limit })` — filter `parent: parentId`, sort
  `createdAt: 1`.
- Increment the **parent comment's** `replyCount` (not the post's
  `commentCount` — decide up front whether replies also count toward the
  post's total `commentCount`; recommend yes, since that's what "N comments"
  on a post usually means to a user).

**Routes**
- `POST /api/v1/comments/:id/replies` — `requireAuth`.
- `GET /api/v1/comments/:id/replies` — `optionalAuth`, paginated.

### Frontend
- Under each top-level comment, a collapsed "N replies" toggle that fetches
  and renders replies, with its own reply input.
- Replies reuse the same like button/hook — `targetType: "Comment"` works
  unchanged since a reply *is* a `Comment` document with `parent` set.

### Done when
- Replying to a comment nests correctly under it.
- Reply likes work.
- Post's total comment count (if you chose to include replies) matches
  actual comment+reply count.

---

## API surface summary (after all 4 parts)

```
POST   /api/v1/posts
GET    /api/v1/posts                 ?page&limit
GET    /api/v1/posts/:id
POST   /api/v1/posts/:id/like
GET    /api/v1/posts/:id/likes       ?page&limit

POST   /api/v1/posts/:postId/comments
GET    /api/v1/posts/:postId/comments ?page&limit
POST   /api/v1/comments/:id/like
GET    /api/v1/comments/:id/likes    ?page&limit

POST   /api/v1/comments/:id/replies
GET    /api/v1/comments/:id/replies  ?page&limit
```

## Explicitly out of scope (per requirements)

- Visual polish / responsive design beyond what already exists in the
  template pages.
- Editing/deleting posts, comments, replies (not requested — add only if
  asked).
- Notifications on like/comment.
