import { ApiResponse } from "../utils/response.util.js";
import { StatusCodes } from "../constants/statusCodes.constant.js";

export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return ApiResponse.error(
        res,
        StatusCodes.BAD_REQUEST,
        "Validation failed",
        errors
      );
    }

    next();
  };
};
