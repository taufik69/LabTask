import Joi from "joi";

const imageSchema = Joi.object({
  url: Joi.string().trim().uri().allow(""),
  publicId: Joi.string().trim().allow(""),
  status: Joi.string()
    .valid("pending", "processing", "uploaded", "failed")
    .messages({
      "any.only":
        "Status must be one of pending, processing, uploaded, failed",
    }),
  localPath: Joi.string().trim().allow(""),
  tries: Joi.number().min(0),
  lastError: Joi.string().trim().allow(""),
});

const createPostSchema = Joi.object({
  text: Joi.string().trim().max(5000).messages({
    "string.max": "Post text must be at most 5000 characters",
  }),
  image: imageSchema,
  visibility: Joi.string().valid("public", "private").messages({
    "any.only": "Visibility must be either public or private",
  }),
})
  .or("text", "image")
  .messages({
    "object.missing": "Post must have text or image",
  });

const updatePostSchema = Joi.object({
  text: Joi.string().trim().max(5000).messages({
    "string.max": "Post text must be at most 5000 characters",
  }),
  image: imageSchema,
  visibility: Joi.string().valid("public", "private").messages({
    "any.only": "Visibility must be either public or private",
  }),
});

export { createPostSchema, updatePostSchema };
