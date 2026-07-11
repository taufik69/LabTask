import { ApiResponse } from "../utils/response.util.js";

export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return ApiResponse.error(res, 400, "Validation failed", errors);
    }

    next();
  };
};
