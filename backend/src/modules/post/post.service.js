import postRepository from "./post.repository.js";
import likeRepository from "../like/like.repository.js";
import { AppError } from "../../shared/utils/error.utils.js";
import { StatusCodes } from "../../shared/constants/statusCodes.constant.js";
import { imageQueue } from "../../queues/image.queue.js";
import { encodeCursor, decodeCursor } from "../../shared/utils/cursor.util.js";

class PostService {
  CreatePost = async (authorId, body, file) => {
    if (!body.text?.trim() && !file) {
      throw new AppError("Post must have text or image", StatusCodes.BAD_REQUEST);
    }

    const postData = {
      author: authorId,
      text: body.text,
      visibility: body.visibility || "public",
    };

    if (file) {
      postData.image = { status: "pending", localPath: file.path };
    }

    const post = await postRepository.create(postData);

    if (file) {
      await imageQueue.add("upload", {
        postId: post._id.toString(),
        localFilePath: file.path,
      });
    }

    return postRepository.findById(post._id);
  };

  GetFeed = async (viewerId, { cursor, limit = 10 } = {}) => {
    const { posts, hasMore } = await postRepository.findFeed({
      viewerId,
      cursor: decodeCursor(cursor),
      limit: Number(limit),
    });

    const nextCursor =
      hasMore && posts.length ? encodeCursor(posts[posts.length - 1]) : null;

    const likedPostIds = new Set(
      await likeRepository.findLikedTargetIds({
        user: viewerId,
        targetType: "Post",
        targetIds: posts.map((post) => post._id),
      }),
    );

    return { posts, nextCursor, hasMore, likedPostIds };
  };

  GetPostById = async (postId, viewerId) => {
    const post = await postRepository.findById(postId);
    if (!post) {
      throw new AppError("Post not found", StatusCodes.NOT_FOUND);
    }

    const isOwner = viewerId && String(post.author._id) === String(viewerId);
    if (post.visibility === "private" && !isOwner) {
      throw new AppError("Post not found", StatusCodes.NOT_FOUND);
    }

    return post;
  };
}

export default new PostService();
