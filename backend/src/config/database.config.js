import mongoose from "mongoose";
import logger from "./logger.config.js";

const dbConnect = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  logger.info("Database Connected");
};

const dbDisconnect = async () => {
  await mongoose.disconnect();
  logger.info("Database Disconnected");
};

export { dbConnect, dbDisconnect };
