import Comment from "./comment.model.js";

const AUTHOR_FIELDS = "firstName lastName username";

class CommentRepository {
  create = async (data) => {
    return await Comment.create(data);
  };

  findById = async (id) => {
    return await Comment.findById(id).populate("author", AUTHOR_FIELDS);
  };

  findByPost = async ({ postId, cursor, limit = 10 }) => {
    const baseFilter = { post: postId, parent: null };
    const cursorFilter = cursor
      ? {
          $or: [
            { createdAt: { $gt: cursor.createdAt } },
            { createdAt: cursor.createdAt, _id: { $gt: cursor._id } },
          ],
        }
      : null;

    const filter = cursorFilter ? { $and: [baseFilter, cursorFilter] } : baseFilter;

    // oldest-first reads more naturally for a comment thread; fetch one
    // extra to know if there's a next page without a count query
    const comments = await Comment.find(filter)
      .sort({ createdAt: 1, _id: 1 })
      .limit(limit + 1)
      .populate("author", AUTHOR_FIELDS);

    const hasMore = comments.length > limit;
    return { comments: comments.slice(0, limit), hasMore };
  };

  findReplies = async ({ parentId, cursor, limit = 10 }) => {
    const baseFilter = { parent: parentId };
    const cursorFilter = cursor
      ? {
          $or: [
            { createdAt: { $gt: cursor.createdAt } },
            { createdAt: cursor.createdAt, _id: { $gt: cursor._id } },
          ],
        }
      : null;

    const filter = cursorFilter ? { $and: [baseFilter, cursorFilter] } : baseFilter;

    // oldest-first, same as top-level comments; fetch one extra to know
    // if there's a next page without a count query
    const replies = await Comment.find(filter)
      .sort({ createdAt: 1, _id: 1 })
      .limit(limit + 1)
      .populate("author", AUTHOR_FIELDS);

    const hasMore = replies.length > limit;
    return { replies: replies.slice(0, limit), hasMore };
  };

  incrementReplyCount = async (id, delta, session) => {
    return await Comment.findByIdAndUpdate(
      id,
      { $inc: { replyCount: delta } },
      { new: true, session },
    );
  };
}

export default new CommentRepository();
