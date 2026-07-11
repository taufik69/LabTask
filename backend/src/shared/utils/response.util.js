// ===== shared/utils/response.util.js =====
class ApiResponse {
  static success(res, statusCode, message, data) {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
    });
  }

  static error(res, statusCode, message, data) {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      data,
    });
  }

  static paginated(res, statusCode, message, data, page, limit, total) {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
}

export { ApiResponse };
