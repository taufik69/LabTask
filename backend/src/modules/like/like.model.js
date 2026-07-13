import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetType: {
      type: String,
      enum: ["Post", "Comment"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetType", // polymorphic populate support
    },
  },
  { timestamps: true },
);

// ek user ekta target ekbaroi like korte pare (duplicate guard)
likeSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });
// "ke ke like koreche" — paginated, newest first
likeSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
// "amar liked posts" / feed e like-state bulk check
likeSchema.index({ user: 1, targetType: 1 });

const Like = mongoose.models.Like || mongoose.model("Like", likeSchema);

export default Like;
