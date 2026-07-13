import { AxiosError } from "axios";
import type { ApiErrorResponse } from "@/shared/types/api.types";

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof AxiosError) {
    return (
      (error as AxiosError<ApiErrorResponse>).response?.data?.message ??
      fallback
    );
  }
  return fallback;
};

export { getApiErrorMessage };
