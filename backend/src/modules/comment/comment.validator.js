import Joi from "joi";

// image is uploaded as multipart/form-data (req.file via multer), not a
// JSON field, so it is not part of this body schema. The "text or image"
// requirement is enforced in comment.service.js against (body.text || file).
const createCommentSchema = Joi.object({
  text: Joi.string().trim().max(2000).allow("").messages({
    "string.max": "Comment text must be at most 2000 characters",
  }),
});

export { createCommentSchema };
