import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger.js';

/**
 * Attach a unique request ID to every incoming request
 */
export const requestId = (req, res, next) => {
  const id = uuidv4();
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
};

/**
 * Morgan HTTP request logger — streams to Winston
 */
const morganStream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Combined format with request ID
morgan.token('requestId', (req) => req.requestId || '-');
morgan.token('userId', (req) => req.userId || 'anonymous');
morgan.token('body', (req) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    // Redact sensitive fields
    const body = { ...req.body };
    if (body.password) body.password = '[REDACTED]';
    if (body.currentPassword) body.currentPassword = '[REDACTED]';
    if (body.newPassword) body.newPassword = '[REDACTED]';
    if (body.otp) body.otp = '[REDACTED]';
    return JSON.stringify(body);
  }
  return '-';
});

const morganFormat =
  ':requestId :userId :method :url :status :res[content-length] - :response-time ms';

export const httpLogger = morgan(morganFormat, {
  stream: morganStream,
  skip: (req) => req.url === '/api/health', // Skip health check logs
});

export default httpLogger;
