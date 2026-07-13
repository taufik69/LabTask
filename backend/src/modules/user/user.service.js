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

  Login = async (credentials) => {
    const { email, password } = credentials;

    const user = await userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw new AppError("Invalid email or password", StatusCodes.UNAUTHORIZED);
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", StatusCodes.UNAUTHORIZED);
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();

    return { user, accessToken, refreshToken };
  };

  getUserById = async (id) => {};
}

export default new UserService();
