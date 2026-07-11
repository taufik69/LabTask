import { asyncHandler } from "../../shared/utils/asyncHandler.util.js";
import { ApiResponse } from "../../shared/utils/response.util.js";
import userService from "./user.service.js";
import { UserDTO } from "./user.dto.js";

class UserController {
  createUser = asyncHandler(async (req, res) => {
    const user = await userService.SignUp(req.body);
    ApiResponse.success(res, 201, "success", UserDTO.toResponse(user));
  });
}

export default new UserController();
