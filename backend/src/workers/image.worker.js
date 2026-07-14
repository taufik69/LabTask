import { Worker } from "bullmq";
import { connection } from "../config/redis.config.js";
import { IMAGE_QUEUE_NAME } from "../queues/image.queue.js";
import { cloudinaryFileUpload } from "../config/cloudinary.config.js";
import Post from "../modules/post/post.model.js";
import Comment from "../modules/comment/comment.model.js";
import logger from "../config/logger.config.js";

// registry mapping an image-bearing target type to its model — mirrors the
// like module's targetResolvers pattern so any model with an `image`
// subdocument (post.model.js's imageSchema shape) can be processed here
const targetModels = {
  Post,
  Comment,
};

// post.service.js's CreatePost enqueues jobs shaped { postId, localFilePath }
// (untouched, pre-existing). Newer producers (e.g. comment.service.js) send
// { targetType, targetId, localFilePath }. Support both so the post module
// doesn't need to change.
const resolveTarget = (data) => {
  if (data.targetType && data.targetId) {
    return { targetType: data.targetType, targetId: data.targetId };
  }
  if (data.postId) {
    return { targetType: "Post", targetId: data.postId };
  }
  throw new Error("Image job is missing target information");
};

const processImageJob = async (job) => {
  const { targetType, targetId } = resolveTarget(job.data);
  const { localFilePath } = job.data;
  const Model = targetModels[targetType];
  if (!Model) {
    throw new Error(`Unsupported image target type: ${targetType}`);
  }

  await Model.findByIdAndUpdate(targetId, {
    "image.status": "processing",
  });

  const uploadResult = await cloudinaryFileUpload(localFilePath, {
    deleteAfter: false,
  });

  if (!uploadResult) {
    throw new Error("Cloudinary upload failed");
  }

  await Model.findByIdAndUpdate(targetId, {
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

  const { targetType, targetId } = resolveTarget(job.data);
  const Model = targetModels[targetType];
  if (!Model) return;

  const isLastAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);

  await Model.findByIdAndUpdate(targetId, {
    "image.tries": job.attemptsMade,
    "image.lastError": err.message,
    ...(isLastAttempt ? { "image.status": "failed" } : {}),
  });
});

export { imageWorker };
