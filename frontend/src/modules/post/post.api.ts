import { axiosClient } from "@/shared/api/axiosClient";
import type { ApiSuccessResponse } from "@/shared/types/api.types";
import type { CreatePostPayload, FeedPage, Post } from "@/modules/post/post.types";

const createPost = async (payload: CreatePostPayload) => {
  const formData = new FormData();
  formData.append("text", payload.text);
  formData.append("visibility", payload.visibility);
  if (payload.image) {
    formData.append("image", payload.image);
  }

  const { data } = await axiosClient.post<ApiSuccessResponse<Post>>(
    "/posts",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.data;
};

const getFeed = async (cursor?: string | null) => {
  const { data } = await axiosClient.get<ApiSuccessResponse<FeedPage>>(
    "/posts",
    { params: cursor ? { cursor } : undefined }
  );
  return data.data;
};

export { createPost, getFeed };
