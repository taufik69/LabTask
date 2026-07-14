import { asyncHandler } from "../../shared/utils/asyncHandler.util.js";
import { ApiResponse } from "../../shared/utils/response.util.js";
import { StatusCodes } from "../../shared/constants/statusCodes.constant.js";
import commentService from "./comment.service.js";
import { CommentDTO } from "./comment.dto.js";
import { LikeDTO } from "../like/like.dto.js";

class CommentController {
  createComment = asyncHandler(async (req, res) => {
    const comment = await commentService.CreateComment(
      req.user._id,
      req.params.postId,
      req.body.text,
      req.file,
    );
    return ApiResponse.success(
      res,
      StatusCodes.CREATED,
      "Comment created successfully",
      CommentDTO.toResponse(comment),
    );
  });

  getComments = asyncHandler(async (req, res) => {
    const { cursor, limit = 10 } = req.query;
    const { comments, nextCursor, hasMore, likedCommentIds } =
      await commentService.GetComments(req.params.postId, req.user?._id, { cursor, limit });

    return ApiResponse.success(res, StatusCodes.OK, "Comments fetched successfully", {
      comments: CommentDTO.toListResponse(comments, likedCommentIds),
      nextCursor,
      hasMore,
    });
  });

  createReply = asyncHandler(async (req, res) => {
    const reply = await commentService.CreateReply(
      req.user._id,
      req.params.id,
      req.body.text,
      req.file,
    );
    return ApiResponse.success(
      res,
      StatusCodes.CREATED,
      "Reply created successfully",
      CommentDTO.toResponse(reply),
    );
  });

  getReplies = asyncHandler(async (req, res) => {
    const { cursor, limit = 10 } = req.query;
    const { replies, nextCursor, hasMore, likedCommentIds } =
      await commentService.GetReplies(req.params.id, req.user?._id, { cursor, limit });

    return ApiResponse.success(res, StatusCodes.OK, "Replies fetched successfully", {
      replies: CommentDTO.toListResponse(replies, likedCommentIds),
      nextCursor,
      hasMore,
    });
  });

  toggleCommentLike = asyncHandler(async (req, res) => {
    const { liked } = await commentService.ToggleCommentLike(req.user._id, req.params.id);
    return ApiResponse.success(
      res,
      StatusCodes.OK,
      liked ? "Comment liked" : "Comment unliked",
      { liked },
    );
  });

  getCommentLikers = asyncHandler(async (req, res) => {
    const { cursor, limit = 10 } = req.query;
    const { likes, nextCursor, hasMore } = await commentService.GetCommentLikers(
      req.params.id,
      { cursor, limit },
    );

    return ApiResponse.success(res, StatusCodes.OK, "Likers fetched successfully", {
      likers: LikeDTO.toLikersListResponse(likes),
      nextCursor,
      hasMore,
    });
  });
}

export default new CommentController();
