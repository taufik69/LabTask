import express from "express";
const _ = express.Router();
import likeController from "./like.controller.js";
import { requireAuth, optionalAuth } from "../../shared/middlewares/auth.middleware.js";

_.post("/:id/like", requireAuth, likeController.toggleLike);
_.get("/:id/likes", optionalAuth, likeController.getLikers);

export default _;
