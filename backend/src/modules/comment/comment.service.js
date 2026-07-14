import commentRepository from "./comment.repository.js";
import Post from "../post/post.model.js";
import likeRepository from "../like/like.repository.js";
import likeService from "../like/like.service.js";
import { imageQueue } from "../../queues/image.queue.js";
import { AppError } from "../../shared/utils/error.utils.js";
import { StatusCodes } from "../../shared/constants/statusCodes.constant.js";
import { encodeCursor, decodeCursor } from "../../shared/utils/cursor.util.js";

// same "can this viewer see this post" rule post.service.js enforces —
// re-checked here (read-only, via the Post model) rather than importing
// post module internals, so the comment module stays self-contained
const assertPostVisible = async (postId, viewerId) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw new AppError("Post not found", StatusCodes.NOT_FOUND);
  }

  const isOwner = viewerId && String(post.author) === String(viewerId);
  if (post.visibility === "private" && !isOwner) {
    throw new AppError("Post not found", StatusCodes.NOT_FOUND);
  }

  return post;
};

class CommentService {
  CreateComment = async (authorId, postId, text, file) => {
    if (!text?.trim() && !file) {
      throw new AppError("Comment must have text or image", StatusCodes.BAD_REQUEST);
    }

    await assertPostVisible(postId, authorId);

    const commentData = {
      post: postId,
      author: authorId,
      text,
      parent: null,
    };

    if (file) {
      commentData.image = { status: "pending", localPath: file.path };
    }

    const comment = await commentRepository.create(commentData);

    if (file) {
      await imageQueue.add("upload", {
        targetType: "Comment",
        targetId: comment._id.toString(),
        localFilePath: file.path,
      });
    }

    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    return commentRepository.findById(comment._id);
  };

  GetComments = async (postId, viewerId, { cursor, limit = 10 } = {}) => {
    await assertPostVisible(postId, viewerId);

    const { comments, hasMore } = await commentRepository.findByPost({
      postId,
      cursor: decodeCursor(cursor),
      limit: Number(limit),
    });

    const nextCursor =
      hasMore && comments.length ? encodeCursor(comments[comments.length - 1]) : null;

    const likedCommentIds = new Set(
      await likeRepository.findLikedTargetIds({
        user: viewerId,
        targetType: "Comment",
        targetIds: comments.map((comment) => comment._id),
      }),
    );

    return { comments, nextCursor, hasMore, likedCommentIds };
  };

  CreateReply = async (authorId, parentId, text, file) => {
    if (!text?.trim() && !file) {
      throw new AppError("Reply must have text or image", StatusCodes.BAD_REQUEST);
    }

    const parent = await commentRepository.findById(parentId);
    if (!parent) {
      throw new AppError("Comment not found", StatusCodes.NOT_FOUND);
    }
    // flat one-level threading: a reply cannot itself be replied to
    if (parent.parent) {
      throw new AppError("Cannot reply to a reply", StatusCodes.BAD_REQUEST);
    }

    await assertPostVisible(parent.post, authorId);

    const replyData = {
      post: parent.post,
      author: authorId,
      text,
      parent: parentId,
    };

    if (file) {
      replyData.image = { status: "pending", localPath: file.path };
    }

    const reply = await commentRepository.create(replyData);

    if (file) {
      await imageQueue.add("upload", {
        targetType: "Comment",
        targetId: reply._id.toString(),
        localFilePath: file.path,
      });
    }

    await commentRepository.incrementReplyCount(parentId, 1);
    // a reply also counts toward the post's total "N comments"
    await Post.findByIdAndUpdate(parent.post, { $inc: { commentCount: 1 } });

    return commentRepository.findById(reply._id);
  };

  GetReplies = async (parentId, viewerId, { cursor, limit = 10 } = {}) => {
    const parent = await commentRepository.findById(parentId);
    if (!parent) {
      throw new AppError("Comment not found", StatusCodes.NOT_FOUND);
    }

    await assertPostVisible(parent.post, viewerId);

    const { replies, hasMore } = await commentRepository.findReplies({
      parentId,
      cursor: decodeCursor(cursor),
      limit: Number(limit),
    });

    const nextCursor =
      hasMore && replies.length ? encodeCursor(replies[replies.length - 1]) : null;

    const likedCommentIds = new Set(
      await likeRepository.findLikedTargetIds({
        user: viewerId,
        targetType: "Comment",
        targetIds: replies.map((reply) => reply._id),
      }),
    );

    return { replies, nextCursor, hasMore, likedCommentIds };
  };

  ToggleCommentLike = async (userId, commentId) => {
    return likeService.ToggleLike(userId, "Comment", commentId);
  };

  GetCommentLikers = async (commentId, { cursor, limit = 10 } = {}) => {
    return likeService.GetLikers("Comment", commentId, { cursor, limit });
  };
}

export default new CommentService();
