import userRepository from "./user.repository.js";
import { AppError } from "../../shared/utils/error.utils.js";
import { StatusCodes } from "../../shared/constants/statusCodes.constant.js";

class UserService {
  SignUp = async (bodyData) => {
    const existingUser = await userRepository.findByEmail(bodyData.email);
    if (existingUser) {
      throw new AppError("User already exists", StatusCodes.BAD_REQUEST);
    }

    const user = await userRepository.create(bodyData);
    if (!user) {
      throw new AppError(
        "User creation failed",
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
    return user;
  };

  Login = async (credentials) => {};

  getUserById = async (id) => {};
}

export default new UserService();
