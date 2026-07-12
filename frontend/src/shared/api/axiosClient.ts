import axios from "axios";
import { env } from "@/shared/config/env.config";
import { StatusCodes } from "@/shared/constants/statusCodes.constant";

const axiosClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === StatusCodes.UNAUTHORIZED) {
      // hook for centralized auth handling (e.g. redirect to login)
    }
    return Promise.reject(error);
  }
);

export { axiosClient };
