import { axiosClient } from "@/shared/api/axiosClient";
import type { ApiSuccessResponse } from "@/shared/types/api.types";
import type { SignUpPayload, User } from "@/modules/user/user.types";

const signUp = async (payload: SignUpPayload) => {
  const { data } = await axiosClient.post<ApiSuccessResponse<User>>(
    "/auth/signup",
    payload
  );
  return data.data;
};

export { signUp };
