class UserDTO {
  static toResponse(user) {
    return {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  static toListResponse(users) {
    return users.map((user) => this.toResponse(user));
  }
}

export { UserDTO };
// postmodel
// import mongoose from "mongoose";

// const postSchema = new mongoose.Schema(
//   {
//     author: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     text: { type: String, maxlength: 5000, trim: true },
//     image: { type: String }, // Cloudinary/S3 URL — file DB te na
//     visibility: {
//       type: String,
//       enum: ["public", "private"],
//       default: "public",
//     },
//     // denormalized counters — feed read e count query lage na
//     likeCount: { type: Number, default: 0, min: 0 },
//     commentCount: { type: Number, default: 0, min: 0 },
//   },
//   { timestamps: true },
// );

// // text OR image — at least ekta thakte hobe
// postSchema.pre("validate", function (next) {
//   if (!this.text && !this.image) {
//     return next(new Error("Post must have text or image"));
//   }
//   next();
// });

// // ---- INDEXES (millions scale er core) ----
// // public feed, newest first
// postSchema.index({ visibility: 1, createdAt: -1 });
// // user er own posts (private + public), profile page
// postSchema.index({ author: 1, createdAt: -1 });

// const Post = mongoose.model("Post", postSchema);
// export default Post;
// comment.model.js

// import mongoose from "mongoose";

// const commentSchema = new mongoose.Schema(
//   {
//     post: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Post",
//       required: true,
//     },
//     author: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     text: { type: String, required: true, maxlength: 2000, trim: true },
//     // null = top-level comment, else = reply
//     parent: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Comment",
//       default: null,
//     },
//     likeCount: { type: Number, default: 0, min: 0 },
//     replyCount: { type: Number, default: 0, min: 0 },
//   },
//   { timestamps: true }
// );

// // post er comments/replies fetch — sob core query ei index e cover
// commentSchema.index({ post: 1, parent: 1, createdAt: 1 });

// const Comment = mongoose.model("Comment", commentSchema);
// export default Comment;

/** like model  */
// import mongoose from "mongoose";

// const likeSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     targetType: {
//       type: String,
//       enum: ["Post", "Comment"],
//       required: true,
//     },
//     targetId: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//       refPath: "targetType", // polymorphic populate support
//     },
//   },
//   { timestamps: true }
// );

// // ek user ekta target ekbaroi like korte pare (duplicate guard)
// likeSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });
// // "ke ke like koreche" — paginated, newest first
// likeSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
// // "amar liked posts" / feed e like-state bulk check
// likeSchema.index({ user: 1, targetType: 1 });

// const Like = mongoose.model("Like", likeSchema);
// export default Like;
