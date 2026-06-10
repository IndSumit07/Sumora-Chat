import logger from '../config/logger.js';
import { errorResponse } from '../utils/apiResponse.js';

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware — must be registered LAST in Express
 */
const errorHandler = (err, req, res, next) => {
  const requestId = req.requestId || 'unknown';

  // Handle AppError (operational errors)
  if (err.isOperational) {
    logger.warn({
      message: `Operational error: ${err.message}`,
      requestId,
      statusCode: err.statusCode,
      code: err.code,
      path: req.path,
      method: req.method,
    });

    return errorResponse(res, {
      message: err.message,
      statusCode: err.statusCode,
      code: err.code,
      errors: err.errors || [],
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    logger.warn({ message: 'Mongoose validation error', requestId, errors });

    return errorResponse(res, {
      message: 'Validation failed',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      errors,
    });
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue?.[field] || '';

    logger.warn({ message: 'Duplicate key error', requestId, field, value });

    return errorResponse(res, {
      message: `${field} '${value}' already exists`,
      statusCode: 409,
      code: 'CONFLICT',
      errors: [{ field, message: `${field} already taken` }],
    });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    logger.warn({ message: 'Mongoose cast error', requestId, path: err.path });

    return errorResponse(res, {
      message: `Invalid ${err.path}: ${err.value}`,
      statusCode: 400,
      code: 'INVALID_ID',
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, {
      message: 'Invalid token',
      statusCode: 401,
      code: 'INVALID_TOKEN',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, {
      message: 'Token expired',
      statusCode: 401,
      code: 'TOKEN_EXPIRED',
    });
  }

  // Handle SyntaxError (invalid JSON body)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(res, {
      message: 'Invalid JSON in request body',
      statusCode: 400,
      code: 'INVALID_JSON',
    });
  }

  // Unknown / programmer errors — log with full stack trace
  logger.error({
    message: `Unhandled error: ${err.message}`,
    requestId,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    userId: req.userId,
  });

  return errorResponse(res, {
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again.'
      : err.message,
    statusCode: 500,
    code: 'INTERNAL_ERROR',
  });
};

export default errorHandler;
