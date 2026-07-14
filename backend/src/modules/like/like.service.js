import mongoose from "mongoose";
import likeRepository from "./like.repository.js";
import Post from "../post/post.model.js";
import Comment from "../comment/comment.model.js";
import { AppError } from "../../shared/utils/error.utils.js";
import { StatusCodes } from "../../shared/constants/statusCodes.constant.js";
import { encodeCursor, decodeCursor } from "../../shared/utils/cursor.util.js";

// registry mapping a likeable target type to how to look it up / update its
// denormalized likeCount. Reads the target model directly (rather than
// going through post.repository.js / comment.repository.js) so the like
// module stays self-contained and doesn't require touching those modules.
const targetResolvers = {
  Post: {
    findById: (id) => Post.findById(id),
    incrementLikeCount: (id, delta, session) =>
      Post.findByIdAndUpdate(id, { $inc: { likeCount: delta } }, { new: true, session }),
  },
  Comment: {
    findById: (id) => Comment.findById(id),
    incrementLikeCount: (id, delta, session) =>
      Comment.findByIdAndUpdate(id, { $inc: { likeCount: delta } }, { new: true, session }),
  },
};

class LikeService {
  ToggleLike = async (userId, targetType, targetId) => {
    const resolver = targetResolvers[targetType];
    if (!resolver) {
      throw new AppError("Invalid like target type", StatusCodes.BAD_REQUEST);
    }

    const target = await resolver.findById(targetId);
    if (!target) {
      throw new AppError(`${targetType} not found`, StatusCodes.NOT_FOUND);
    }

    const session = await mongoose.startSession();
    let liked;

    try {
      await session.withTransaction(async () => {
        const alreadyLiked = await likeRepository.exists(
          { user: userId, targetType, targetId },
          session,
        );

        if (alreadyLiked) {
          await likeRepository.delete({ user: userId, targetType, targetId }, session);
          await resolver.incrementLikeCount(targetId, -1, session);
          liked = false;
        } else {
          await likeRepository.create({ user: userId, targetType, targetId }, session);
          await resolver.incrementLikeCount(targetId, 1, session);
          liked = true;
        }
      });
    } finally {
      await session.endSession();
    }

    return { liked };
  };

  GetLikers = async (targetType, targetId, { cursor, limit = 10 } = {}) => {
    const resolver = targetResolvers[targetType];
    if (!resolver) {
      throw new AppError("Invalid like target type", StatusCodes.BAD_REQUEST);
    }

    const target = await resolver.findById(targetId);
    if (!target) {
      throw new AppError(`${targetType} not found`, StatusCodes.NOT_FOUND);
    }

    const { likes, hasMore } = await likeRepository.findByTarget({
      targetType,
      targetId,
      cursor: decodeCursor(cursor),
      limit: Number(limit),
    });

    const nextCursor = hasMore && likes.length ? encodeCursor(likes[likes.length - 1]) : null;

    return { likes, nextCursor, hasMore };
  };
}

export default new LikeService();
