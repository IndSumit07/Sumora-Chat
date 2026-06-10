import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient } from '../config/redis.js';
import { tooManyRequestsResponse } from '../utils/apiResponse.js';

const createLimiter = ({ windowMs, max, keyPrefix, message = 'Too many requests' }) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args) => getRedisClient().call(...args),
      prefix: `rl:${keyPrefix}:`,
    }),
    keyGenerator: (req) => {
      // Use IP + userId (if authenticated) for more granular limiting
      const ip = req.ip || req.connection.remoteAddress;
      const userId = req.userId || 'anonymous';
      return `${ip}:${userId}`;
    },
    handler: (req, res) => {
      const resetTime = req.rateLimit?.resetTime;
      const retryAfter = resetTime
        ? Math.ceil((resetTime - Date.now()) / 1000)
        : Math.ceil(windowMs / 1000);
      tooManyRequestsResponse(res, retryAfter);
    },
    skip: (req) => {
      // Skip rate limiting in test environment
      return process.env.NODE_ENV === 'test';
    },
  });
};

// Auth routes: 5 requests per 15 minutes per IP
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: 'auth',
  message: 'Too many auth attempts. Try again in 15 minutes.',
});

// OTP routes: 3 requests per 10 minutes
export const otpLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 3,
  keyPrefix: 'otp',
  message: 'Too many OTP requests. Try again in 10 minutes.',
});

// Message sending: 60 per minute per user
export const messageLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 60,
  keyPrefix: 'msg',
  message: 'Message rate limit exceeded.',
});

// File uploads: 20 per hour per user
export const uploadLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyPrefix: 'upload',
  message: 'Upload rate limit exceeded. Max 20 uploads per hour.',
});

// General API: 300 per minute per user
export const apiLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 300,
  keyPrefix: 'api',
  message: 'API rate limit exceeded.',
});

// Friend requests: 20 per hour per user
export const friendRequestLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyPrefix: 'friend',
  message: 'Too many friend requests. Try again later.',
});

export default {
  authLimiter,
  otpLimiter,
  messageLimiter,
  uploadLimiter,
  apiLimiter,
  friendRequestLimiter,
};
