import express from "express";
const router = express.Router();
import userController from "./user.controller.js";
import { createUserSchema } from "./user.validator.js";
import { validate } from "../../shared/middlewares/validation.middleware.js";

// Public routes
// router.post("/", validate(createUserSchema), userController.createUser);

router.post("/signup", userController.createUser);

export default router;
