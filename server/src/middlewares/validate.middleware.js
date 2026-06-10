import { validationErrorResponse } from '../utils/apiResponse.js';

/**
 * Zod validation middleware factory.
 * Usage: validate(zodSchema) — validates req.body
 * Usage: validate(zodSchema, 'params') — validates req.params
 * Usage: validate(zodSchema, 'query') — validates req.query
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'body' ? req.body : source === 'params' ? req.params : req.query;
    const result = schema.safeParse(data);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return validationErrorResponse(res, errors);
    }

    // Replace source with parsed (and transformed) data
    if (source === 'body') req.body = result.data;
    else if (source === 'params') req.params = result.data;
    else req.query = result.data;

    next();
  };
};

export default validate;
