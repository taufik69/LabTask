import Like from "./like.model.js";

const LIKER_FIELDS = "firstName lastName username";

class LikeRepository {
  create = async ({ user, targetType, targetId }, session) => {
    const [like] = await Like.create([{ user, targetType, targetId }], { session });
    return like;
  };

  delete = async ({ user, targetType, targetId }, session) => {
    return await Like.findOneAndDelete({ user, targetType, targetId }, { session });
  };

  exists = async ({ user, targetType, targetId }, session) => {
    return await Like.exists({ user, targetType, targetId }).session(session ?? null);
  };

  findByTarget = async ({ targetType, targetId, cursor, limit = 10 }) => {
    const baseFilter = { targetType, targetId };
    const cursorFilter = cursor
      ? {
          $or: [
            { createdAt: { $lt: cursor.createdAt } },
            { createdAt: cursor.createdAt, _id: { $lt: cursor._id } },
          ],
        }
      : null;

    const filter = cursorFilter ? { $and: [baseFilter, cursorFilter] } : baseFilter;

    // fetch one extra to know if there's a next page without a count query
    const likes = await Like.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate("user", LIKER_FIELDS);

    const hasMore = likes.length > limit;
    return { likes: likes.slice(0, limit), hasMore };
  };

  findLikedTargetIds = async ({ user, targetType, targetIds }) => {
    if (!user || !targetIds?.length) return [];

    const likes = await Like.find({
      user,
      targetType,
      targetId: { $in: targetIds },
    }).select("targetId");

    return likes.map((like) => String(like.targetId));
  };
}

export default new LikeRepository();
