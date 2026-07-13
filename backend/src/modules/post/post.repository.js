import Post from "./post.model.js";

const AUTHOR_FIELDS = "firstName lastName username";

class PostRepository {
  create = async (data) => {
    return await Post.create(data);
  };

  findById = async (id) => {
    return await Post.findById(id).populate("author", AUTHOR_FIELDS);
  };

  updateById = async (id, data) => {
    return await Post.findByIdAndUpdate(id, data, { new: true });
  };

  findFeed = async ({ viewerId, cursor, limit = 10 }) => {
    const visibilityFilter = viewerId
      ? { $or: [{ visibility: "public" }, { visibility: "private", author: viewerId }] }
      : { visibility: "public" };

    const cursorFilter = cursor
      ? {
          $or: [
            { createdAt: { $lt: cursor.createdAt } },
            { createdAt: cursor.createdAt, _id: { $lt: cursor._id } },
          ],
        }
      : {};

    const filter = cursor
      ? { $and: [visibilityFilter, cursorFilter] }
      : visibilityFilter;

    // fetch one extra to know if there's a next page without a count query
    const posts = await Post.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate("author", AUTHOR_FIELDS);

    const hasMore = posts.length > limit;
    return { posts: posts.slice(0, limit), hasMore };
  };

  findByAuthor = async ({ authorId, viewerId, cursor, limit = 10 }) => {
    const isOwnProfile = viewerId && String(viewerId) === String(authorId);
    const visibilityFilter = isOwnProfile
      ? { author: authorId }
      : { author: authorId, visibility: "public" };

    const cursorFilter = cursor
      ? {
          $or: [
            { createdAt: { $lt: cursor.createdAt } },
            { createdAt: cursor.createdAt, _id: { $lt: cursor._id } },
          ],
        }
      : {};

    const filter = cursor
      ? { $and: [visibilityFilter, cursorFilter] }
      : visibilityFilter;

    const posts = await Post.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate("author", AUTHOR_FIELDS);

    const hasMore = posts.length > limit;
    return { posts: posts.slice(0, limit), hasMore };
  };
}

export default new PostRepository();
