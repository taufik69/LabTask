import mongoose from "mongoose";

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

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, maxlength: 5000, trim: true },
    image: { type: imageSchema },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    // denormalized counters — feed read e count query lage na
    likeCount: { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

// text OR image — at least ekta thakte hobe
postSchema.pre("validate", function (next) {
  if (!this.text && !this.image?.url) {
    return next(new Error("Post must have text or image"));
  }
  next();
});

// ---- INDEXES (millions scale er core) ----
// public feed, newest first
postSchema.index({ visibility: 1, createdAt: -1 });
// user er own posts (private + public), profile page
postSchema.index({ author: 1, createdAt: -1 });

const Post = mongoose.models.Post || mongoose.model("Post", postSchema);

export default Post;
