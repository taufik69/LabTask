import Joi from "joi";

const createUserSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required().messages({
    "string.empty": "First name is required",
    "string.min": "First name must be at least 2 characters",
    "string.max": "First name must be at most 50 characters",
    "any.required": "First name is required",
  }),
  lastName: Joi.string().trim().min(2).max(50).required().messages({
    "string.empty": "Last name is required",
    "string.min": "Last name must be at least 2 characters",
    "string.max": "Last name must be at most 50 characters",
    "any.required": "Last name is required",
  }),
  email: Joi.string().trim().lowercase().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Email must be a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),
});

const updateUserSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).optional().messages({
    "string.min": "First name must be at least 2 characters",
    "string.max": "First name must be at most 50 characters",
  }),
  lastName: Joi.string().trim().min(2).max(50).optional().messages({
    "string.min": "Last name must be at least 2 characters",
    "string.max": "Last name must be at most 50 characters",
  }),
  email: Joi.string().trim().lowercase().email().optional().messages({
    "string.email": "Email must be a valid email address",
  }),
  password: Joi.string().min(6).optional().messages({
    "string.min": "Password must be at least 6 characters",
  }),
});

export { createUserSchema, updateUserSchema };
