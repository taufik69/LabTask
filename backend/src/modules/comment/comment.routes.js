import express from "express";
import commentController from "./comment.controller.js";
import { createCommentSchema } from "./comment.validator.js";
import { validate } from "../../shared/middlewares/validation.middleware.js";
import { requireAuth, optionalAuth } from "../../shared/middlewares/auth.middleware.js";
import { uploadImage } from "../../shared/middlewares/upload.middleware.js";

// mounted at /api/v1/posts — comments nested under their post
const commentRoute = express.Router();
commentRoute.post(
  "/:postId/comments",
  requireAuth,
  uploadImage.single("image"),
  validate(createCommentSchema),
  commentController.createComment,
);
commentRoute.get("/:postId/comments", optionalAuth, commentController.getComments);

// mounted at /api/v1/comments — comment-level actions (likes + replies)
const commentActionRoute = express.Router();
commentActionRoute.post("/:id/like", requireAuth, commentController.toggleCommentLike);
commentActionRoute.get("/:id/likes", optionalAuth, commentController.getCommentLikers);
commentActionRoute.post(
  "/:id/replies",
  requireAuth,
  uploadImage.single("image"),
  validate(createCommentSchema),
  commentController.createReply,
);
commentActionRoute.get("/:id/replies", optionalAuth, commentController.getReplies);

export { commentRoute, commentActionRoute };
