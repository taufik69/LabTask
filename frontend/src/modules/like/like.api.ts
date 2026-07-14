import { axiosClient } from "@/shared/api/axiosClient";
import type { ApiSuccessResponse } from "@/shared/types/api.types";
import type { LikersPage, ToggleLikeResult } from "@/modules/like/like.types";

const togglePostLike = async (postId: string) => {
  const { data } = await axiosClient.post<ApiSuccessResponse<ToggleLikeResult>>(
    `/posts/${postId}/like`
  );
  return data.data;
};

const getPostLikers = async (postId: string, cursor?: string | null) => {
  const { data } = await axiosClient.get<ApiSuccessResponse<LikersPage>>(
    `/posts/${postId}/likes`,
    { params: cursor ? { cursor } : undefined }
  );
  return data.data;
};

const toggleCommentLike = async (commentId: string) => {
  const { data } = await axiosClient.post<ApiSuccessResponse<ToggleLikeResult>>(
    `/comments/${commentId}/like`
  );
  return data.data;
};

const getCommentLikers = async (commentId: string, cursor?: string | null) => {
  const { data } = await axiosClient.get<ApiSuccessResponse<LikersPage>>(
    `/comments/${commentId}/likes`,
    { params: cursor ? { cursor } : undefined }
  );
  return data.data;
};

export { togglePostLike, getPostLikers, toggleCommentLike, getCommentLikers };
