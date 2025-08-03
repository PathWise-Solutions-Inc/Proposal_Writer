import Joi from 'joi';

export const rfpValidationSchemas = {
  upload: Joi.object({
    title: Joi.string().max(500).optional(),
    clientName: Joi.string().max(255).required(),
    dueDate: Joi.date().iso().min('now').optional(),
    description: Joi.string().max(2000).optional()
  })
};