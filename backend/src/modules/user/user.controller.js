import { asyncHandler } from "../../shared/utils/asyncHandler.util.js";
import { ApiResponse } from "../../shared/utils/response.util.js";
import { StatusCodes } from "../../shared/constants/statusCodes.constant.js";
import userService from "./user.service.js";
import { UserDTO } from "./user.dto.js";

class UserController {
  // register a new user
  registerUser = asyncHandler(async (req, res) => {
    const user = await userService.SignUp(req.body);
    return ApiResponse.success(
      res,
      StatusCodes.CREATED,
      "Registration successful",
      UserDTO.toResponse(user),
    );
  });
  // login a user and get client cookie
  login = asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await userService.Login(
      req.body,
    );

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return ApiResponse.success(res, StatusCodes.OK, "Login successful", {
      accessToken,
      user: UserDTO.toResponse(user),
    });
  });

  refreshToken = asyncHandler(async (req, res) => {
    const token =
      req.cookies?.refreshToken?.trim() ||
      req.headers["x-refresh-token"]?.trim();

    const accessToken = await userService.RefreshToken(token);

    ApiResponse.success(
      res,
      StatusCodes.OK,
      "Access token refreshed successfully",
      { accessToken },
    );
  });

  logout = asyncHandler(async (req, res) => {});
}

export default new UserController();
