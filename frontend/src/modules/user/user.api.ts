import { axiosClient, ACCESS_TOKEN_KEY } from "@/shared/api/axiosClient";
import type { ApiSuccessResponse } from "@/shared/types/api.types";
import type {
  SignUpPayload,
  LoginPayload,
  LoginResponse,
  User,
} from "@/modules/user/user.types";

const signUp = async (payload: SignUpPayload) => {
  const { data } = await axiosClient.post<ApiSuccessResponse<User>>(
    "/auth/registeruser",
    payload
  );
  return data.data;
};

const login = async (payload: LoginPayload) => {
  const { data } = await axiosClient.post<ApiSuccessResponse<LoginResponse>>(
    "/auth/login",
    payload
  );
  localStorage.setItem(ACCESS_TOKEN_KEY, data.data.accessToken);
  return data.data;
};

const logout = async () => {
  await axiosClient.post("/auth/logout");
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export { signUp, login, logout };
