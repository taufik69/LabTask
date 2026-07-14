import { axiosClient } from "@/shared/api/axiosClient";
import type { ApiSuccessResponse } from "@/shared/types/api.types";
import type {
  Comment,
  CommentsPage,
  RepliesPage,
  CreateCommentPayload,
} from "@/modules/comment/comment.types";

const buildFormData = (payload: CreateCommentPayload) => {
  const formData = new FormData();
  formData.append("text", payload.text);
  if (payload.image) {
    formData.append("image", payload.image);
  }
  return formData;
};

const createComment = async (postId: string, payload: CreateCommentPayload) => {
  const { data } = await axiosClient.post<ApiSuccessResponse<Comment>>(
    `/posts/${postId}/comments`,
    buildFormData(payload),
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.data;
};

const getComments = async (postId: string, cursor?: string | null) => {
  const { data } = await axiosClient.get<ApiSuccessResponse<CommentsPage>>(
    `/posts/${postId}/comments`,
    { params: cursor ? { cursor } : undefined }
  );
  return data.data;
};

const createReply = async (commentId: string, payload: CreateCommentPayload) => {
  const { data } = await axiosClient.post<ApiSuccessResponse<Comment>>(
    `/comments/${commentId}/replies`,
    buildFormData(payload),
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.data;
};

const getReplies = async (commentId: string, cursor?: string | null) => {
  const { data } = await axiosClient.get<ApiSuccessResponse<RepliesPage>>(
    `/comments/${commentId}/replies`,
    { params: cursor ? { cursor } : undefined }
  );
  return data.data;
};

export { createComment, getComments, createReply, getReplies };
