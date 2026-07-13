import express from "express";
const _ = express.Router();
import postController from "./post.controller.js";
import { createPostSchema } from "./post.validator.js";
import { validate } from "../../shared/middlewares/validation.middleware.js";
import { requireAuth, optionalAuth } from "../../shared/middlewares/auth.middleware.js";
import { uploadImage } from "../../shared/middlewares/upload.middleware.js";

_.post(
  "/",
  requireAuth,
  uploadImage.single("image"),
  validate(createPostSchema),
  postController.createPost,
);
_.get("/", optionalAuth, postController.getFeed);
_.get("/:id", optionalAuth, postController.getPostById);

export default _;
