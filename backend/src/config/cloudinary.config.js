import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { env } from "./env.config.js";

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true,
});

/**
 * Uploads a file to Cloudinary.
 *
 * @param {string} localFilePath - Path to the local temp file.
 * @param {object} [options]
 * @param {boolean} [options.deleteAfter=true] - Delete local file after upload.
 *   Pass `false` when called from a BullMQ worker that manages its own cleanup
 *   across retries — the file must survive until the job succeeds or exhausts attempts.
 * @returns {Promise<{result: object, optimizeUrl: string}|null>}
 */
const cloudinaryFileUpload = async (
  localFilePath,
  { deleteAfter = true } = {},
) => {
  if (!localFilePath || !fs.existsSync(localFilePath)) return null;

  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    const optimizeUrl = cloudinary.url(result.public_id, {
      fetch_format: "auto",
      resource_type: "image",
      quality: "auto",
      transformation: [
        { width: 1024, crop: "limit" },
        { quality: "auto:low" },
        { fetch_format: "auto" },
      ],
    });

    if (deleteAfter) {
      fs.unlinkSync(localFilePath);
    }

    return { result, optimizeUrl };
  } catch (error) {
    console.error("Cloudinary Upload Error:", error.message);

    if (deleteAfter && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return null;
  }
};

/**
 * Deletes a file from Cloudinary by public ID
 * @param {string} publicId - Cloudinary public ID of the file to delete
 * @returns {Promise<Object|null>} - The deletion result or null on failure
 */
const deleteCloudinaryFile = async (publicId) => {
  if (!publicId) return null;

  try {
    const result = await cloudinary.api.delete_resources([publicId], {
      type: "upload",
      resource_type: "image",
    });
    console.log("Cloudinary Delete Result:", result);

    return result;
  } catch (error) {
    console.error("Cloudinary Delete Error:", error.message);
    return null;
  }
};

export { cloudinaryFileUpload, deleteCloudinaryFile };
