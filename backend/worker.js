import "dotenv/config";
import { dbConnect } from "./src/config/database.config.js";
import { imageWorker } from "./src/workers/image.worker.js";
import logger from "./src/config/logger.config.js";

dbConnect()
  .then(() => {
    logger.info(`[image-worker] Listening on queue "image-upload"`);
  })
  .catch((err) => {
    logger.error("Error connecting to database", err);
    process.exit(1);
  });

process.on("SIGTERM", async () => {
  await imageWorker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await imageWorker.close();
  process.exit(0);
});
