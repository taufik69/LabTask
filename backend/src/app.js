import express from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import userRoute from "./modules/user/user.routes.js";
import { notFound } from "./shared/middlewares/notFound.middleware.js";
import { globalErrorHandler } from "./shared/utils/globalErrorHandler.util.js";
import { apiLimiter } from "./shared/middlewares/rateLimiter.middleware.js";
import { StatusCodes } from "./shared/constants/statusCodes.constant.js";
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Rate limiting
app.use("/api/", apiLimiter);

// Health check
app.get("/health", (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1/auth", userRoute);

// 404 handler
app.use(notFound);

// Global error handler
app.use(globalErrorHandler);
export { app };
