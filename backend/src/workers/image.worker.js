import { Worker } from "bullmq";
import { connection } from "../config/redis.config.js";
import { IMAGE_QUEUE_NAME } from "../queues/image.queue.js";
import { cloudinaryFileUpload } from "../config/cloudinary.config.js";
import Post from "../modules/post/post.model.js";
import logger from "../config/logger.config.js";

const processImageJob = async (job) => {
  const { postId, localFilePath } = job.data;

  await Post.findByIdAndUpdate(postId, {
    "image.status": "processing",
  });

  const uploadResult = await cloudinaryFileUpload(localFilePath, {
    deleteAfter: false,
  });

  if (!uploadResult) {
    throw new Error("Cloudinary upload failed");
  }

  await Post.findByIdAndUpdate(postId, {
    "image.status": "uploaded",
    "image.url": uploadResult.optimizeUrl,
    "image.publicId": uploadResult.result.public_id,
    "image.lastError": "",
  });

  return uploadResult;
};

const imageWorker = new Worker(
  IMAGE_QUEUE_NAME,
  async (job) => processImageJob(job),
  { connection },
);

imageWorker.on("completed", (job) => {
  logger.info(`[image-worker] Job ${job.id} completed`);
});

imageWorker.on("failed", async (job, err) => {
  logger.error(`[image-worker] Job ${job?.id} failed: ${err.message}`);

  if (!job) return;

  const { postId } = job.data;
  const isLastAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);

  await Post.findByIdAndUpdate(postId, {
    "image.tries": job.attemptsMade,
    "image.lastError": err.message,
    ...(isLastAttempt ? { "image.status": "failed" } : {}),
  });
});

export { imageWorker };
