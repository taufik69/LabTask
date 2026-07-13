import express from "express";
const _ = express.Router();
import userController from "./user.controller.js";
import { createUserSchema, loginUserSchema } from "./user.validator.js";
import { validate } from "../../shared/middlewares/validation.middleware.js";


_.post(
  "/registeruser",
  validate(createUserSchema),
  userController.registerUser
);
_.post("/login", validate(loginUserSchema), userController.login);
_.post("/refresh-token", userController.refreshToken);
_.post("/logout", userController.logout);

export default _;
