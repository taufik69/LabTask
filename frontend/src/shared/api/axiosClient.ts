import axios, { type AxiosRequestConfig } from "axios";
import { env } from "@/shared/config/env.config";
import { StatusCodes } from "@/shared/constants/statusCodes.constant";
import type { ApiSuccessResponse } from "@/shared/types/api.types";

interface RetriableRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

const ACCESS_TOKEN_KEY = "accessToken";

const axiosClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
});

// interceptor to add the access token to the request headers
axiosClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// interceptor to handle refresh token logic when the access token expires
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/refresh-token") ||
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/registeruser");

    if (
      error.response?.status !== StatusCodes.UNAUTHORIZED ||
      !originalRequest ||
      isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      window.location.href = "/login";
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    try {
      const { data } = await axiosClient.post<
        ApiSuccessResponse<{ accessToken: string }>
      >("/auth/refresh-token");
      const newAccessToken = data.data.accessToken;

      localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${newAccessToken}`,
      };

      return axiosClient(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      window.location.href = "/login";
      return Promise.reject(refreshError);
    }
  }
);

export { axiosClient, ACCESS_TOKEN_KEY };
