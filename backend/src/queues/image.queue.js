import { Queue } from "bullmq";
import { connection } from "../config/redis.config.js";

const IMAGE_QUEUE_NAME = "image-upload";

const imageQueue = new Queue(IMAGE_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 1000,
    removeOnFail: 2000,
  },
});

export { imageQueue, IMAGE_QUEUE_NAME };
