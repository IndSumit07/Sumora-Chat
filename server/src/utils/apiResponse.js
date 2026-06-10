/**
 * Standardized API response utility
 * All responses follow: { success, data, message, meta, errors, code }
 */

export const successResponse = (res, { data = null, message = 'Success', statusCode = 200, meta = null }) => {
  const response = {
    success: true,
    message,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

export const createdResponse = (res, { data = null, message = 'Created successfully' }) => {
  return successResponse(res, { data, message, statusCode: 201 });
};

export const errorResponse = (res, { message = 'Internal Server Error', statusCode = 500, errors = [], code = 'INTERNAL_ERROR' }) => {
  const response = {
    success: false,
    message,
    code,
  };

  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

export const validationErrorResponse = (res, errors) => {
  return errorResponse(res, {
    message: 'Validation failed',
    statusCode: 400,
    errors,
    code: 'VALIDATION_ERROR',
  });
};

export const notFoundResponse = (res, message = 'Resource not found') => {
  return errorResponse(res, {
    message,
    statusCode: 404,
    code: 'NOT_FOUND',
  });
};

export const unauthorizedResponse = (res, message = 'Unauthorized') => {
  return errorResponse(res, {
    message,
    statusCode: 401,
    code: 'UNAUTHORIZED',
  });
};

export const forbiddenResponse = (res, message = 'Forbidden') => {
  return errorResponse(res, {
    message,
    statusCode: 403,
    code: 'FORBIDDEN',
  });
};

export const conflictResponse = (res, message = 'Resource already exists') => {
  return errorResponse(res, {
    message,
    statusCode: 409,
    code: 'CONFLICT',
  });
};

export const tooManyRequestsResponse = (res, retryAfter = 60) => {
  res.setHeader('Retry-After', retryAfter);
  return errorResponse(res, {
    message: 'Too many requests. Please try again later.',
    statusCode: 429,
    code: 'RATE_LIMIT_EXCEEDED',
    errors: [{ field: 'rate_limit', message: `Retry after ${retryAfter} seconds` }],
  });
};

export const paginatedResponse = (res, { data, message = 'Success', page, limit, total, cursor = null }) => {
  return successResponse(res, {
    data,
    message,
    meta: {
      page: page || null,
      limit,
      total,
      cursor,
      hasMore: cursor ? data.length === limit : total > (page - 1) * limit + data.length,
    },
  });
};
