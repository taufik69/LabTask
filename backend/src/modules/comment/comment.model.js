import mongoose from "mongoose";

// same shape as post.model.js's imageSchema — kept as its own local
// definition so the comment module doesn't need to import post module internals
const imageSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "processing", "uploaded", "failed"],
      default: "pending",
    },
    localPath: { type: String, default: "" },
    tries: { type: Number, default: 0 },
    lastError: { type: String, default: "" },
  },
  { _id: false },
);

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, maxlength: 2000, trim: true },
    image: { type: imageSchema },
    // null = top-level comment, else = reply
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    likeCount: { type: Number, default: 0, min: 0 },
    replyCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

// text OR image — at least ekta thakte hobe (same rule as post.model.js)
commentSchema.pre("validate", function (next) {
  if (!this.text && !this.image?.url) {
    return next(new Error("Comment must have text or image"));
  }
  next();
});

// post er comments/replies fetch — sob core query ei index e cover
commentSchema.index({ post: 1, parent: 1, createdAt: 1 });

const Comment =
  mongoose.models.Comment || mongoose.model("Comment", commentSchema);

export default Comment;
