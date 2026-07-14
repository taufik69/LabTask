import { asyncHandler } from "../../shared/utils/asyncHandler.util.js";
import { ApiResponse } from "../../shared/utils/response.util.js";
import { StatusCodes } from "../../shared/constants/statusCodes.constant.js";
import likeService from "./like.service.js";
import { LikeDTO } from "./like.dto.js";

class LikeController {
  toggleLike = asyncHandler(async (req, res) => {
    const { liked } = await likeService.ToggleLike(req.user._id, "Post", req.params.id);
    return ApiResponse.success(
      res,
      StatusCodes.OK,
      liked ? "Post liked" : "Post unliked",
      { liked },
    );
  });

  getLikers = asyncHandler(async (req, res) => {
    const { cursor, limit = 10 } = req.query;
    const { likes, nextCursor, hasMore } = await likeService.GetLikers(
      "Post",
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

export default new LikeController();
