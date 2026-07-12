import { asyncHandler } from "../../shared/utils/asyncHandler.util.js";
import { ApiResponse } from "../../shared/utils/response.util.js";
import { StatusCodes } from "../../shared/constants/statusCodes.constant.js";
import userService from "./user.service.js";
import { UserDTO } from "./user.dto.js";

class UserController {
  createUser = asyncHandler(async (req, res) => {
    const user = await userService.SignUp(req.body);
    ApiResponse.success(
      res,
      StatusCodes.CREATED,
      "success",
      UserDTO.toResponse(user)
    );
  });
}

export default new UserController();
