interface ApiSuccessResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  data?: unknown;
}

interface PaginatedResponse<T> extends ApiSuccessResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type { ApiSuccessResponse, ApiErrorResponse, PaginatedResponse };
