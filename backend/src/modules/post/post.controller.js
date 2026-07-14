import { asyncHandler } from "../../shared/utils/asyncHandler.util.js";
import { ApiResponse } from "../../shared/utils/response.util.js";
import { StatusCodes } from "../../shared/constants/statusCodes.constant.js";
import postService from "./post.service.js";
import { PostDTO } from "./post.dto.js";

class PostController {
  createPost = asyncHandler(async (req, res) => {
    const post = await postService.CreatePost(req.user._id, req.body, req.file);
    return ApiResponse.success(
      res,
      StatusCodes.CREATED,
      "Post created successfully",
      PostDTO.toResponse(post),
    );
  });

  getFeed = asyncHandler(async (req, res) => {
    const { cursor, limit = 10 } = req.query;
    const { posts, nextCursor, hasMore, likedPostIds } = await postService.GetFeed(
      req.user?._id,
      { cursor, limit },
    );

    return ApiResponse.success(res, StatusCodes.OK, "Feed fetched successfully", {
      posts: PostDTO.toListResponse(posts, likedPostIds),
      nextCursor,
      hasMore,
    });
  });

  getPostById = asyncHandler(async (req, res) => {
    const post = await postService.GetPostById(req.params.id, req.user?._id);
    return ApiResponse.success(
      res,
      StatusCodes.OK,
      "Post fetched successfully",
      PostDTO.toResponse(post),
    );
  });
}

export default new PostController();
