import jwt from "jsonwebtoken";
import { AppError } from "../utils/error.utils.js";
import { StatusCodes } from "../constants/statusCodes.constant.js";

const extractToken = (req) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
};

const requireAuth = (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return next(
      new AppError("Access token is required", StatusCodes.UNAUTHORIZED),
    );
  }

  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = {
      _id: payload._id,
      email: payload.email,
      username: payload.username,
    };
    next();
  } catch {
    next(
      new AppError("Invalid or expired access token", StatusCodes.UNAUTHORIZED),
    );
  }
};

const optionalAuth = (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = {
      _id: payload._id,
      email: payload.email,
      username: payload.username,
    };
  } catch {
    // invalid/expired token on an optional route — treat as anonymous
    console.warn("Invalid or expired access token on optional route");
  }
  next();
};

export { requireAuth, optionalAuth };
