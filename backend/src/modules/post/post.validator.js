import Joi from "joi";

// Note: image is uploaded as multipart/form-data (req.file via multer), not
// a JSON field, so it is not part of this body schema. The "text or image"
// requirement is enforced in post.service.js against (body.text || file).

const createPostSchema = Joi.object({
  text: Joi.string().trim().max(5000).allow("").messages({
    "string.max": "Post text must be at most 5000 characters",
  }),
  visibility: Joi.string().valid("public", "private").messages({
    "any.only": "Visibility must be either public or private",
  }),
});

const updatePostSchema = Joi.object({
  text: Joi.string().trim().max(5000).messages({
    "string.max": "Post text must be at most 5000 characters",
  }),
  visibility: Joi.string().valid("public", "private").messages({
    "any.only": "Visibility must be either public or private",
  }),
});

export { createPostSchema, updatePostSchema };
