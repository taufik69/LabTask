import { asyncHandler } from "../../shared/utils/asyncHandler.util.js";
import { ApiResponse } from "../../shared/utils/response.util.js";
import { StatusCodes } from "../../shared/constants/statusCodes.constant.js";
import userService from "./user.service.js";
import { UserDTO } from "./user.dto.js";

class UserController {
  registerUser = asyncHandler(async (req, res) => {
    const user = await userService.SignUp(req.body);
    return ApiResponse.success(
      res,
      StatusCodes.CREATED,
      "Registration successful",
      UserDTO.toResponse(user),
    );
  });

  login = asyncHandler(async (req, res) => {});

  refreshToken = asyncHandler(async (req, res) => {});

  logout = asyncHandler(async (req, res) => {});
}

export default new UserController();
