# Like / Comment / Reply Backend — কিভাবে বানানো হয়েছে

এই ডকুমেন্টে ধাপে ধাপে বোঝানো হয়েছে Like, Comment আর Reply — এই তিনটা
ফিচারের backend কিভাবে develop করা হয়েছে, কেন এভাবে করা হয়েছে, আর কোন
ফাইলে কী আছে।

## সবচেয়ে গুরুত্বপূর্ণ ground rule

**`backend/src/modules/post/` এর কোনো ফাইল touch করা হয়নি।** Post module
আগে থেকেই ready ছিল, তাই Like আর Comment মডিউল দুটোকেই **self-contained**
রাখা হয়েছে — মানে এরা post module-এর repository/service import না করে,
দরকার হলে সরাসরি `Post` model (`post.model.js`) read/update করে। এই
প্যাটার্নটা পুরো ডকুমেন্ট জুড়ে বার বার দেখবেন।

```
backend/src/modules/
├── post/       ← touch করা হয়নি (আগে থেকেই ready)
├── like/       ← নতুন
└── comment/    ← নতুন (comment + reply দুটোই এখানে, আলাদা module লাগেনি)
```

---

## ১. Like module

### ফাইল স্ট্রাকচার (post module-এর মতোই প্যাটার্ন)

```
like/
├── like.model.js       (আগে থেকেই ছিল)
├── like.repository.js  (raw DB queries)
├── like.service.js     (business logic)
├── like.dto.js          (response shape)
├── like.controller.js  (HTTP handler)
└── like.routes.js      (route definition)
```

### মডেল (আগে থেকেই ছিল)

`Like` একটা **polymorphic** document — মানে একই `Like` collection দিয়ে
Post আর Comment দুটোই "like" করা যায়, `targetType` ফিল্ড দিয়ে আলাদা করা
হয় (`targetType: "Post" | "Comment"`, `targetId` দিয়ে আসল ডকুমেন্ট)।

```js
// like.model.js
{ user, targetType: "Post"|"Comment", targetId }
```

`{ user, targetType, targetId }` এর উপর একটা **unique index** আছে — এর
মানে একই ইউজার একই জিনিস দুইবার like করতে পারবে না, এটা DB লেভেলেই
guaranteed (duplicate insert করলে MongoDB নিজেই error দেবে)।

### `like.repository.js` — শুধু raw queries

- `create` / `delete` / `exists` — একটা like insert, delete, বা আছে
  কিনা check করা
- `findByTarget` — কোনো post/comment-এ কারা কারা like করেছে, cursor
  pagination সহ
- `findLikedTargetIds` — একসাথে অনেকগুলো post/comment-এর মধ্যে viewer
  কোনগুলো like করেছে, সেটা **এক query তে** বের করা (feed-এ N+1 query
  এড়ানোর জন্য)

### `like.service.js` — আসল লজিক: `targetResolvers` প্যাটার্ন

এখানেই সবচেয়ে গুরুত্বপূর্ণ ডিজাইন ডিসিশন: Like module কে Post আর Comment
দুটোর জন্যই কাজ করাতে হবে, কিন্তু Like module কে post/comment module-এর
repository import করানো যাবে না (self-contained থাকতে হবে)। সমাধান —
একটা **registry**:

```js
const targetResolvers = {
  Post: {
    findById: (id) => Post.findById(id),
    incrementLikeCount: (id, delta, session) => Post.findByIdAndUpdate(...),
  },
  Comment: {
    findById: (id) => Comment.findById(id),
    incrementLikeCount: (id, delta, session) => Comment.findByIdAndUpdate(...),
  },
};
```

`ToggleLike(userId, targetType, targetId)` কল হলে এই registry থেকে সঠিক
resolver বের করে সেটা দিয়ে কাজ করে — Post model বা Comment model কোনটাই
সরাসরি import না করে module-level কাপলিং ছাড়াই কাজ চলে যায়। নতুন কোনো
likeable জিনিস (ধরুন ভবিষ্যতে Story) আসলে শুধু এই registry-তে একটা এন্ট্রি
যোগ করলেই হবে, বাকি কোড অপরিবর্তিত থাকবে।

### Toggle লজিক — MongoDB transaction দিয়ে

Like করা মানে দুইটা আলাদা write:
1. `Like` collection-এ একটা document create/delete
2. Target (Post/Comment)-এর denormalized `likeCount` +1/-1

দুইটা write আলাদাভাবে হলে race condition হতে পারে (দুই request একসাথে
আসলে count ভুল হয়ে যেতে পারে)। তাই `mongoose.startSession()` +
`session.withTransaction()` দিয়ে দুইটা write কে **atomic** করা হয়েছে —
হয় দুইটাই সফল হবে, নাহলে দুইটাই rollback হবে। যেহেতু এই প্রজেক্টের MongoDB
Atlas (replica set) — transaction সাপোর্ট করে, তাই এই approach নেওয়া
নিরাপদ।

```js
await session.withTransaction(async () => {
  const alreadyLiked = await likeRepository.exists(..., session);
  if (alreadyLiked) {
    // unlike
    await likeRepository.delete(..., session);
    await resolver.incrementLikeCount(targetId, -1, session);
  } else {
    // like
    await likeRepository.create(..., session);
    await resolver.incrementLikeCount(targetId, 1, session);
  }
});
```

### Routes — post module-এর style মেনেই

প্রথমে একটা reusable factory pattern দিয়ে শুরু করেছিলাম, কিন্তু আপনি
বলার পর `post.routes.js`-এর মতোই plain, direct style-এ rewrite করা
হয়েছে:

```js
// like.routes.js
_.post("/:id/like", requireAuth, likeController.toggleLike);
_.get("/:id/likes", optionalAuth, likeController.getLikers);
```

এই router-টা `app.js`-এ `postRoute`-এর মতোই `/api/v1/posts` prefix-এ
mount করা — ফলে URL হয়ে যায় `POST /api/v1/posts/:id/like`।

```js
// app.js
app.use("/api/v1/posts", postRoute);   // post module (untouched)
app.use("/api/v1/posts", likeRoute);   // like module — আলাদা router, একই prefix
```

দুইটা router একই prefix-এ mount করা যায় কারণ Express একাধিক router
chain করে দেখে — conflict হয় না যতক্ষণ path আলাদা।

---

## ২. Comment module

Comment আর Reply — দুটোর জন্য **আলাদা module লাগেনি**। কারণ
`comment.model.js`-এ আগে থেকেই একটা self-referencing `parent` field
ছিল:

```js
parent: { type: ObjectId, ref: "Comment", default: null }
```

- `parent: null` → top-level comment
- `parent: <commentId>` → সেই comment-এর reply

এই একই model আর একই repository/service/controller/routes ফাইল দিয়ে
comment আর reply দুটোই handle করা হয়েছে, শুধু আলাদা method/route দিয়ে।

### `comment.repository.js`

- `create` — comment বা reply দুটোর জন্যই ব্যবহার হয় (`parent` field
  দিয়ে পার্থক্য)
- `findByPost` — শুধু top-level comments (`parent: null`), oldest-first
  sort, cursor pagination
- `findReplies` — একটা নির্দিষ্ট comment-এর সব reply (`parent: parentId`)
- `incrementReplyCount` — parent comment-এর reply সংখ্যা বাড়ানো

### `comment.service.js` — visibility check নিজে করে

Post module-এর `GetPostById` এ যে rule আছে ("private post শুধু owner
দেখতে পারবে"), Comment module-এও সেই একই rule মানতে হবে — কারণ একটা
private post-এ অন্য কেউ comment/reply করতে পারবে না। কিন্তু post
module-এর কোড import করা যাবে না, তাই এই check-টা **আলাদাভাবে
duplicate** করা হয়েছে, সরাসরি `Post` model দিয়ে:

```js
const assertPostVisible = async (postId, viewerId) => {
  const post = await Post.findById(postId);
  if (!post) throw 404;
  const isOwner = viewerId && String(post.author) === String(viewerId);
  if (post.visibility === "private" && !isOwner) throw 404; // owner ছাড়া কেউ দেখবে না
  return post;
};
```

### `CreateComment` — কী কী হয় ধাপে ধাপে

1. `text` অথবা `file` — অন্তত একটা থাকতে হবে (validation)
2. Post visible কিনা check
3. Comment create হয় (image থাকলে `image.status: "pending"` দিয়ে)
4. Image থাকলে `imageQueue`-এ job পাঠানো হয় (নিচে বিস্তারিত)
5. `Post.commentCount` +1 করা হয় (সরাসরি `Post` model দিয়ে, post module
   touch না করে)

### `CreateReply` — comment-এর মতোই, কিন্তু দুইটা extra rule

1. যেই comment-এ reply করা হচ্ছে (`parent`), সেটা খুঁজে বের করা
2. **Depth cap**: যদি সেই parent comment-টা নিজেই একটা reply হয়
   (`parent.parent` non-null), তাহলে reject — মানে **এক লেভেলের বেশি
   nesting হবে না** (comment → reply, reply → reply আবার হবে না)
3. Reply create হলে দুই জায়গায় counter বাড়ে:
   - Parent comment-এর `replyCount` +1
   - Post-এর `commentCount` +1 (আপনি বলার পর এটা যোগ করা হয়েছে, যাতে
     "N comments" দেখলে reply-সহ মোট সংখ্যা বোঝা যায়)

### Routes — দুই ভাগে

Comment-এর দুই ধরনের route আছে — একটা post-এর নিচে nested (comment
তৈরি/লিস্ট), আরেকটা comment-কে নিজে target ধরে (like/reply):

```js
// commentRoute — mounted at /api/v1/posts
POST /api/v1/posts/:postId/comments
GET  /api/v1/posts/:postId/comments

// commentActionRoute — mounted at /api/v1/comments
POST /api/v1/comments/:id/like
GET  /api/v1/comments/:id/likes
POST /api/v1/comments/:id/replies
GET  /api/v1/comments/:id/replies
```

---

## ৩. প্রতিটা endpoint — layer by layer (Route → Controller → Service → Repository → Query)

এই সেকশনে প্রতিটা endpoint-এর জন্য চারটা layer আলাদা করে দেখানো হয়েছে:

- **Route**: কোন middleware চেইনে যায়, প্রতিটা middleware কী করে
- **Controller**: `req` থেকে কোন parameter বের করে, service-কে কী পাঠায়, response কীভাবে বানায়
- **Service**: exact business logic, ধাপে ধাপে
- **Repository**: MongoDB-তে exact কী query চলে, কেন

মনে রাখবেন প্রতিটা layer-এর দায়িত্ব আলাদা:
`Route` (কে ঢুকতে পারবে + raw input পার্স) → `Controller` (HTTP ↔ JS
translation, কোনো business logic নেই) → `Service` (আসল সিদ্ধান্ত/rule)
→ `Repository` (শুধু DB query, কোনো decision নেই)।

---

### 3.1 `POST /api/v1/posts/:id/like` — post like/unlike toggle

**Route** (`like.routes.js`)
```js
_.post("/:id/like", requireAuth, likeController.toggleLike);
```
- `requireAuth` middleware সবার আগে চলে — `Authorization: Bearer <token>`
  header থেকে JWT বের করে `ACCESS_TOKEN_SECRET` দিয়ে verify করে। ভ্যালিড
  হলে `req.user = { _id, email, username }` সেট করে `next()` কল করে;
  invalid/missing হলে সাথে সাথে `401` রিটার্ন করে দেয় — controller
  পর্যন্ত পৌঁছায়ই না।
- URL-এর `:id` অংশটা `req.params.id`-এ চলে যায় (এটা আসলে **post ID**)।

**Controller** (`like.controller.js#toggleLike`)
```js
toggleLike = asyncHandler(async (req, res) => {
  const { liked } = await likeService.ToggleLike(req.user._id, "Post", req.params.id);
  return ApiResponse.success(res, StatusCodes.OK, liked ? "Post liked" : "Post unliked", { liked });
});
```
- `req.user._id` → কে like করছে (JWT থেকে এসেছে, ক্লায়েন্ট নিজে পাঠাতে
  পারবে না, তাই spoof করা সম্ভব না)
- `"Post"` → হার্ডকোড করা `targetType`, কারণ এই route শুধু post-এর জন্যই
  mount করা হয়েছে
- `req.params.id` → কোন post
- `asyncHandler` একটা wrapper — service থেকে কোনো error `throw` হলে সেটা
  `catch` করে Express-এর `next(error)`-এ পাঠিয়ে দেয়, ফলে প্রতিটা
  controller method-এ আলাদা `try/catch` লিখতে হয় না
- Service যা রিটার্ন করে (`{ liked: true/false }`) সেটাই response-এর
  `data`-তে বসে যায়

**Service** (`like.service.js#ToggleLike`)
```js
ToggleLike = async (userId, targetType, targetId) => { ... }
```
প্যারামিটার: `userId` (কে), `targetType` ("Post"/"Comment"), `targetId`
(কোনটা)। ধাপে ধাপে:

1. `targetResolvers[targetType]` থেকে resolver বের করা — না পেলে `400
   Invalid like target type`
2. `resolver.findById(targetId)` — `Post.findById(targetId)` চলে; post
   না থাকলে `404 Post not found`
3. `mongoose.startSession()` দিয়ে একটা transaction session শুরু
4. Session-এর ভেতরে:
   - `likeRepository.exists({ user, targetType, targetId }, session)` —
     আগে থেকে like করা আছে কিনা check
   - **আগে থেকে like করা থাকলে (unlike)**: `likeRepository.delete(...)`
     + `resolver.incrementLikeCount(targetId, -1, session)`
   - **না থাকলে (like)**: `likeRepository.create(...)` +
     `resolver.incrementLikeCount(targetId, +1, session)`
5. Transaction commit হয়ে যায় (`withTransaction` সফল হলে auto-commit,
   কোনো ধাপে error হলে auto-rollback)
6. `{ liked: true/false }` রিটার্ন

**Repository** (`like.repository.js`)
- `exists({ user, targetType, targetId }, session)` →
  `Like.exists({ user, targetType, targetId }).session(session)` — এটা
  পুরো document না এনে শুধু `{_id}` বা `null` রিটার্ন করে, তাই হালকা query
- `create(...)` → `Like.create([{ user, targetType, targetId }], { session })`
  — array + session syntax এটাই mongoose transaction-এর ভেতরে
  document create করার নিয়ম। এখানে `{ user, targetType, targetId }`
  unique index-এর জন্যই duplicate like হওয়া সম্ভব না (DB level guarantee)
- `delete(...)` → `Like.findOneAndDelete({ user, targetType, targetId }, { session })`
- `resolver.incrementLikeCount` (এটা repository-তে না, `like.service.js`-এর
  `targetResolvers`-এ) → `Post.findByIdAndUpdate(id, { $inc: { likeCount: delta } }, { new: true, session })`
  — `$inc` অপারেটর atomic increment/decrement করে, race condition ছাড়াই

---

### 3.2 `GET /api/v1/posts/:id/likes` — কারা কারা like করেছে

**Route**
```js
_.get("/:id/likes", optionalAuth, likeController.getLikers);
```
- `optionalAuth` — token থাকলে `req.user` সেট করে, না থাকলে বা invalid
  হলেও **request block করে না**, শুধু `req.user` `undefined` থেকে যায়।
  কারণ likers list পাবলিক তথ্য — লগইন ছাড়াও দেখা যাবে।

**Controller**
```js
const { cursor, limit = 10 } = req.query;
const { likes, nextCursor, hasMore } = await likeService.GetLikers("Post", req.params.id, { cursor, limit });
```
- `req.query.cursor` — pagination cursor (string, optional; প্রথম
  request-এ থাকবে না)
- `req.query.limit` — কয়টা আনতে হবে (default 10)
- রেসপন্সে `LikeDTO.toLikersListResponse(likes)` দিয়ে raw mongoose
  document গুলোকে safe shape-এ (`{id, firstName, lastName, username}`)
  বদলানো হয় — এখানে `like.user`-এর ভেতরের password/refreshToken-এর মতো
  sensitive field leak হওয়ার কোনো সুযোগ নেই কারণ DTO explicitly শুধু ৪টা
  field pick করে

**Service** (`like.service.js#GetLikers`)
1. `targetResolvers["Post"]` থেকে resolver, তারপর `resolver.findById(targetId)`
   দিয়ে target আসলেই আছে কিনা check (না থাকলে `404`)
2. `decodeCursor(cursor)` — base64url string থেকে `{ createdAt, _id }`
   object বের করে (cursor.util.js, shared)
3. `likeRepository.findByTarget({ targetType, targetId, cursor, limit })`
   কল করে raw likes আনে
4. `hasMore` true হলে শেষ item দিয়ে `encodeCursor()` করে `nextCursor`
   বানায়, নাহলে `null`

**Repository** (`like.repository.js#findByTarget`)
```js
const baseFilter = { targetType, targetId };
const cursorFilter = cursor ? { $or: [
  { createdAt: { $lt: cursor.createdAt } },
  { createdAt: cursor.createdAt, _id: { $lt: cursor._id } },
] } : null;
const filter = cursorFilter ? { $and: [baseFilter, cursorFilter] } : baseFilter;

Like.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit + 1).populate("user", LIKER_FIELDS);
```
এইটা একটা **keyset pagination** (cursor pagination) প্যাটার্ন — `OFFSET`
ব্যবহার না করে "শেষ যেখানে ছিলে তার পরে থেকে" query করা হয়, যেটা বড়
collection-এ অনেক দ্রুত (offset বাড়লে MySQL/Mongo-তে `skip()` স্লো হয়ে
যায়, `keyset` তে হয় না)।

- `$or` দিয়ে দুইটা case কভার হয়: (ক) `createdAt` cursor-এর চেয়ে ছোট, অথবা
  (খ) `createdAt` একই কিন্তু `_id` ছোট — এই দ্বিতীয় শর্তটা লাগে কারণ দুইটা
  document-এর `createdAt` একই millisecond-এ হতে পারে, তখন শুধু
  `createdAt` দিয়ে sort করলে duplicate/skip হওয়ার bug হতে পারে। `_id` টাই
  breaker হিসেবে কাজ করে (MongoDB ObjectId মনোটোনিকালি বাড়ে)
- `.limit(limit + 1)` — চাওয়া সংখ্যার চেয়ে **১টা বেশি** আনা হয়, শুধু এইটা
  বোঝার জন্য যে আরও page আছে কিনা — আলাদা `count()` query লাগে না
  (`hasMore = likes.length > limit`, তারপর `.slice(0, limit)` দিয়ে extra
  item-টা বাদ দেওয়া হয়)
- `.populate("user", LIKER_FIELDS)` — `Like` document-এ শুধু `user`
  ObjectId থাকে, populate করে সেই ID থেকে User document-এর
  `firstName lastName username` field তিনটা জুড়ে দেয় (password ছাড়া,
  কারণ populate-এ explicit field list দেওয়া হয়েছে)

---

### 3.3 `POST /api/v1/posts/:postId/comments` — নতুন comment তৈরি

**Route**
```js
commentRoute.post("/:postId/comments", requireAuth, uploadImage.single("image"), validate(createCommentSchema), commentController.createComment);
```
চারটা middleware ক্রমান্বয়ে চলে:
1. `requireAuth` — লগইন বাধ্যতামূলক (comment করতে হলে identity লাগবে)
2. `uploadImage.single("image")` — Multer middleware; request যদি
   `multipart/form-data` হয়, `image` নামের field-টা file হিসেবে ধরে
   `backend/temp/`-এ ইউনিক নামে save করে, আর `req.file = { path, mimetype, size, ... }`
   সেট করে দেয়। Text-only comment হলে `req.file` `undefined` থেকে যায়
   (কোনো ভুল না)
3. `validate(createCommentSchema)` — Joi দিয়ে `req.body.text` চেক করে
   (max 2000 char; খালি string allow করা আছে যাতে image-only comment
   এখানে block না হয়ে যায়)
4. `commentController.createComment` — আসল handler

**Controller**
```js
const comment = await commentService.CreateComment(req.user._id, req.params.postId, req.body.text, req.file);
```
- `req.user._id` — author
- `req.params.postId` — কোন post-এ comment হচ্ছে
- `req.body.text` — Multer ব্যবহার করার পরেও `text` field
  `req.body`-তেই থাকে (multer multipart form-এর non-file fields
  `req.body`-তে parse করে দেয়)
- `req.file` — Multer-এর সেট করা object, অথবা `undefined`

**Service** (`comment.service.js#CreateComment`) — ৫টা ধাপ
1. **Validation**: `!text?.trim() && !file` হলে `400 Comment must have
   text or image` — এটা মডেলের `pre("validate")` hook-এর **আগেই** ধরা,
   দ্রুত fail করার জন্য (DB round-trip ছাড়াই)
2. `assertPostVisible(postId, authorId)` — এই ছোট helper function-টা
   `Post.findById(postId)` করে দেখে post টা exist করে কিনা, আর
   private হলে শুধু owner-ই comment করতে পারবে কিনা (এটা post module-এর
   কোড import না করে duplicate করা হয়েছে — উপরে "ground rule" সেকশনে
   বলা হয়েছে কেন)
3. `commentRepository.create(commentData)` — `commentData` object-এ
   `post, author, text, parent: null` থাকে, `file` থাকলে `image:
   {status: "pending", localPath: file.path}` যোগ হয়
4. `file` থাকলে `imageQueue.add("upload", { targetType: "Comment", targetId, localFilePath })`
   — BullMQ-তে job ছোঁড়া হয়, `await` করা হয় শুধু queue-তে ঢোকানো পর্যন্ত,
   আসল upload synchronously অপেক্ষা করা হয় না (তাই response দ্রুত ফেরত যায়)
5. `Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } })` —
   post-এর counter বাড়ানো (এখানে transaction ব্যবহার হয়নি, কারণ এটা শুধু
   একটা counter bump, race condition হলেও worst case count সামান্য ভুল
   হবে, কিন্তু ডেটা corrupt হবে না — like-এর মতো critical না)

শেষে `commentRepository.findById(comment._id)` কল করা হয় — কেন আবার
fetch করা? কারণ `create()` এর রিটার্ন করা document-এ `author` populate
করা থাকে না (raw ObjectId), কিন্তু response DTO-তে
`author.firstName/lastName` লাগবে, তাই populate সহ আবার আনা হচ্ছে।

**Repository**
- `create(data)` → `Comment.create(data)` — এখানেই model-এর
  `pre("validate")` hook (text-or-image rule) আবার চেক হয় mongoose-এর
  নিজের validation layer-এ, ডাবল সেফটি
- `findById(id)` → `Comment.findById(id).populate("author", AUTHOR_FIELDS)`

---

### 3.4 `GET /api/v1/posts/:postId/comments` — top-level comment লিস্ট

**Route**: `optionalAuth` (visitor-ও পাবলিক post-এর comment দেখতে পারবে)

**Controller**
```js
const { cursor, limit = 10 } = req.query;
const { comments, nextCursor, hasMore, likedCommentIds } = await commentService.GetComments(req.params.postId, req.user?._id, { cursor, limit });
```
`req.user?._id` — optional chaining, কারণ `optionalAuth`-এ `req.user`
না-ও থাকতে পারে (anonymous visitor)।

**Service** (`GetComments`)
1. `assertPostVisible` — private post হলে non-owner/anonymous-কে `404`
2. `commentRepository.findByPost({ postId, cursor: decodeCursor(cursor), limit })`
3. `likeRepository.findLikedTargetIds({ user: viewerId, targetType: "Comment", targetIds: comments.map(c => c._id) })`
   — **একটা মাত্র query**-তে viewer এই page-এর কোন কোন comment
   আগে থেকে like করে রেখেছে সেটা বের করে (প্রতিটা comment-এর জন্য আলাদা
   query করলে "N+1 query" সমস্যা হতো — ১০টা comment মানে ১০টা আলাদা
   `exists()` call, সেটা এড়ানো হয়েছে)
4. `likedCommentIds` একটা `Set` — `O(1)` লুকআপের জন্য (DTO তে
   `.has(commentId)` চেক হবে প্রতিটা comment-এর জন্য)

**Repository** (`findByPost`)
```js
Comment.find({ post: postId, parent: null, ...cursorFilter })
  .sort({ createdAt: 1, _id: 1 })
  .limit(limit + 1)
  .populate("author", AUTHOR_FIELDS);
```
- `parent: null` — এইটাই top-level vs reply আলাদা করার চাবি; reply
  (`parent` != null) এই list-এ আসবে না
- `sort({ createdAt: 1 })` — **oldest-first** (ascending), likes-এর
  উল্টো (likes newest-first)। কারণ comment thread স্বাভাবিকভাবে সময়ের
  ক্রমে পড়া হয়, আর likes list-এ সাম্প্রতিক likers আগে দেখানো
  logical
- Cursor logic এখানে `$gt` (greater than) ব্যবহার করে, likes-এর `$lt`
  এর উল্টো — কারণ ascending sort-এ "পরের page" মানে বড় `createdAt`

---

### 3.5 `POST /api/v1/comments/:id/like` এবং `GET /api/v1/comments/:id/likes`

গঠন একদম 3.1 আর 3.2-এর মতোই, শুধু পার্থক্য এই দুটো জায়গায়:

- Route mount হয়েছে `/api/v1/comments` prefix-এ (post-এর `/api/v1/posts`
  prefix-এর বদলে), তাই `req.params.id` এখানে **comment ID**
- Controller সরাসরি `likeService` কল না করে `commentService`-এর দুটো
  thin wrapper method কল করে:
  ```js
  // comment.service.js
  ToggleCommentLike = (userId, commentId) => likeService.ToggleLike(userId, "Comment", commentId);
  GetCommentLikers = (commentId, opts) => likeService.GetLikers("Comment", commentId, opts);
  ```
  এই wrapper দুটোর কাজ শুধু `targetType: "Comment"` হার্ডকোড করে দেওয়া,
  যাতে `comment.controller.js`-কে `like.service.js` বা `targetType`
  স্ট্রিং সম্পর্কে কিছু জানতে না হয় (encapsulation)
- এরপর ভেতরে গিয়ে `like.service.js#ToggleLike`/`GetLikers`-এর একই কোড
  চলে, শুধু `targetResolvers.Comment` resolver ব্যবহার হয় (`Comment.findById`,
  `Comment.findByIdAndUpdate` — 3.1-এ যেভাবে ব্যাখ্যা করা হয়েছে ঠিক
  সেভাবেই, শুধু model পাল্টে যায়)

---

### 3.6 `POST /api/v1/comments/:id/replies` — reply তৈরি

**Route**: গঠন 3.3-এর মতোই (`requireAuth` → `uploadImage.single("image")`
→ `validate` → `createReply`), শুধু `:postId` এর বদলে `:id` (parent
comment-এর ID), আর prefix `/api/v1/comments`।

**Controller**
```js
const reply = await commentService.CreateReply(req.user._id, req.params.id, req.body.text, req.file);
```
`req.params.id` এখানে **parent comment ID** (post ID না)।

**Service** (`CreateReply`) — `CreateComment`-এর মতোই কিন্তু দুইটা extra
ধাপ:

1. `!text?.trim() && !file` হলে `400`
2. `commentRepository.findById(parentId)` — parent comment খুঁজে বের
   করা; না পেলে `404 Comment not found`
3. **Depth guard**: `if (parent.parent) throw 400 "Cannot reply to a reply"`
   — মানে যেই comment-টাতে reply করা হচ্ছে, সেটা যদি নিজেই একটা reply
   হয় (তারও একটা `parent` থাকে), তাহলে reject। এইভাবে thread সবসময়
   `comment (parent: null) → reply (parent: commentId)` — দুই লেভেলের
   বেশি গভীর হয় না
4. `assertPostVisible(parent.post, authorId)` — reply যেই post-এর
   comment-এর নিচে হচ্ছে, সেই post visible কিনা (parent.post থেকে
   postId বের করা হয়, `req.params` থেকে না — কারণ route-এ postId নেই,
   শুধু comment id আছে)
5. `commentRepository.create({ post: parent.post, author, text, parent: parentId })`
   — লক্ষ্য করুন `post` field parent comment থেকে **copy** করা হয়েছে,
   এতে reply document নিজেই জানে সে কোন post-এর অংশ (আলাদা করে parent
   comment lookup না করেই GetReplies-এ visibility check করা যায়)
6. Image থাকলে queue job (3.3-এর মতোই)
7. দুইটা counter বাড়ে:
   - `commentRepository.incrementReplyCount(parentId, 1)` →
     `Comment.findByIdAndUpdate(parentId, { $inc: { replyCount: 1 } })`
   - `Post.findByIdAndUpdate(parent.post, { $inc: { commentCount: 1 } })`
     — reply হলেও post-এর মোট comment সংখ্যায় যোগ হয়

---

### 3.7 `GET /api/v1/comments/:id/replies` — reply লিস্ট

**Controller**: 3.4-এর হুবহু কাঠামো, শুধু `postId` এর বদলে parent
`commentId` (`req.params.id`)।

**Service** (`GetReplies`)
1. `commentRepository.findById(parentId)` — parent আছে কিনা
2. `assertPostVisible(parent.post, viewerId)`
3. `commentRepository.findReplies({ parentId, cursor, limit })`
4. `likeRepository.findLikedTargetIds({ targetType: "Comment", targetIds: replies.map(r => r._id) })`

**Repository** (`findReplies`) — `findByPost`-এর সাথে প্রায় identical,
শুধু filter `{ post: postId, parent: null }`-এর বদলে `{ parent:
parentId }` (এখানে `post` filter লাগে না, কারণ একটা নির্দিষ্ট
`parentId`-এর সব child সবসময় একই post-এর — parent যেই post-এর, reply-ও
সেই post-এর, কারণ create করার সময় `post: parent.post` কপি করা হয়েছিল)

---

## ৪. Image upload — Post আর Comment দুটোতেই, একই pipeline দিয়ে

Post module-এ আগে থেকেই একটা async image pipeline ছিল: Multer দিয়ে
temp disk-এ file রাখা → BullMQ queue-তে job পাঠানো → background
worker Cloudinary-তে upload করে DB আপডেট করে। Comment-এ image সাপোর্ট
যোগ করার সময় এই একই pipeline reuse করা হয়েছে, নতুন কিছু বানানো হয়নি।

সমস্যা ছিল: `image.worker.js` আগে হার্ডকোড করা ছিল শুধু `Post` model
আপডেট করার জন্য (`postId` ফিল্ড দিয়ে)। Comment image সাপোর্ট করতে
worker-টাকে generic করতে হয়েছে — Like module-এর `targetResolvers`
প্যাটার্নের মতোই একটা `targetModels` registry:

```js
const targetModels = { Post, Comment };
```

কিন্তু এখানে একটা backward-compatibility সমস্যা ছিল: post module
touch করা যাবে না, অথচ post-এর পুরনো কোড job পাঠায় `{ postId,
localFilePath }` shape-এ (নতুন shape হলো `{ targetType, targetId,
localFilePath }`)। সমাধান — worker দুই ধরনের shape-ই বুঝতে পারে:

```js
const resolveTarget = (data) => {
  if (data.targetType && data.targetId) return { targetType: data.targetType, targetId: data.targetId };
  if (data.postId) return { targetType: "Post", targetId: data.postId }; // পুরনো post jobs
  throw new Error("Image job is missing target information");
};
```

এভাবে **post.service.js-এর একটা লাইনও পরিবর্তন করতে হয়নি**, অথচ worker
এখন Post আর Comment দুটোরই image job process করতে পারে।

---

## ৫. পুরো request flow — একটা উদাহরণ

**একজন ইউজার একটা comment-এ image সহ reply দিচ্ছে:**

```
POST /api/v1/comments/:id/replies  (multipart/form-data: text + image)
        │
        ▼
comment.routes.js
  requireAuth          → JWT verify, req.user সেট
  uploadImage.single()  → Multer file টা temp disk-এ রাখে, req.file সেট
  validate(schema)      → text (যদি থাকে) 2000 char-এর মধ্যে কিনা
        │
        ▼
comment.controller.js#createReply
        │
        ▼
comment.service.js#CreateReply
  1. parent comment খুঁজে বের করা
  2. parent নিজেই reply কিনা check (হলে reject)
  3. Post visible কিনা check (Post model সরাসরি read করে)
  4. Comment.create() — parent: <id>, image.status: "pending"
  5. imageQueue.add() — background worker-এর জন্য job
  6. Comment.replyCount +1, Post.commentCount +1
        │
        ▼
রেসপন্স সাথে সাথেই ফেরত (image.status এখনো "pending")

── এদিকে ব্যাকগ্রাউন্ডে (worker.js প্রসেসে) ──
image.worker.js#processImageJob
  1. image.status → "processing"
  2. Cloudinary-তে upload
  3. image.status → "uploaded", url/publicId সেট
```

---

## ৬. যে ডিজাইন ডিসিশনগুলো ইচ্ছাকৃতভাবে নেওয়া হয়েছে

| ডিসিশন | কেন |
|---|---|
| Like/Comment module self-contained (post module import করে না) | আপনি explicit বলেছিলেন post module touch না করতে |
| Comment + Reply একই module | `comment.model.js`-এর `parent` field দিয়েই আগে থেকে reply সাপোর্ট করার মতো ডিজাইন ছিল, আলাদা model/module দরকার ছিল না |
| Like toggle-এ MongoDB transaction | দুইটা write (Like doc + likeCount) atomic রাখা দরকার race condition এড়াতে; Atlas replica set ব্যবহার করায় transaction সাপোর্টেড |
| `targetResolvers` / `targetModels` registry প্যাটার্ন | Like আর image worker দুটোকেই Post + Comment উভয়ের জন্য কাজ করাতে হয়েছে, কিন্তু কোনো মডিউলকে অন্য মডিউলের repository-তে সরাসরি নির্ভর করানো হয়নি |
| Reply depth 1 লেভেলে cap করা | Spec অনুযায়ী flat threading (comment → reply), infinite nesting না |
| Reply হলে post.commentCount-ও বাড়ে | আপনি কনফার্ম করার পর — যাতে "N comments" UI-তে reply সহ সঠিক সংখ্যা দেখায় |
| Image worker backward-compatible (`postId` shape এখনো সাপোর্ট করে) | post.service.js-এর existing job-enqueue কোড অপরিবর্তিত রাখতে |

---

## ৭. সম্পূর্ণ API সারাংশ

```
# Like
POST   /api/v1/posts/:id/like
GET    /api/v1/posts/:id/likes

# Comment
POST   /api/v1/posts/:postId/comments      (multipart: text? + image?)
GET    /api/v1/posts/:postId/comments

# Comment-level actions
POST   /api/v1/comments/:id/like
GET    /api/v1/comments/:id/likes
POST   /api/v1/comments/:id/replies        (multipart: text? + image?)
GET    /api/v1/comments/:id/replies
```
