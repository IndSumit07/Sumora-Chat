import jwt from 'jsonwebtoken';
import { getRedisClient } from '../config/redis.js';
import { REFRESH_TOKEN_TTL_SECONDS } from '../utils/constants.js';
import logger from '../config/logger.js';

/**
 * Generate access token (short-lived)
 */
export const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId: userId.toString(), type: 'access' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
};

/**
 * Generate refresh token (long-lived)
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId: userId.toString(), type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

/**
 * Store refresh token in Redis
 */
export const storeRefreshToken = async (userId, refreshToken) => {
  const redis = getRedisClient();
  const key = `refreshToken:${userId.toString()}`;
  await redis.setex(key, REFRESH_TOKEN_TTL_SECONDS, refreshToken);
};

/**
 * Verify a refresh token — checks both JWT validity and Redis store
 * Implements refresh token reuse detection
 * @returns { userId, isReuse: bool }
 */
export const verifyRefreshToken = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new Error(`Invalid refresh token: ${err.message}`);
  }

  if (decoded.type !== 'refresh') {
    throw new Error('Token is not a refresh token');
  }

  const redis = getRedisClient();
  const key = `refreshToken:${decoded.userId}`;
  const stored = await redis.get(key);

  if (!stored) {
    // Token not found — could be expired or already rotated
    // Treat as potential reuse attack
    logger.warn(`Refresh token not in Redis for user ${decoded.userId} — possible reuse attack`);
    throw new Error('Refresh token has been revoked');
  }

  if (stored !== token) {
    // Token mismatch — DEFINITELY reuse attack
    // Invalidate all sessions for this user
    await redis.del(key);
    logger.warn(`Refresh token reuse detected for user ${decoded.userId} — invalidating all sessions`);
    throw new Error('Refresh token reuse detected. Please log in again.');
  }

  return { userId: decoded.userId };
};

/**
 * Rotate refresh token: delete old, generate new, store new
 * @returns { accessToken, refreshToken }
 */
export const rotateTokens = async (userId) => {
  const redis = getRedisClient();

  // Delete old refresh token
  await redis.del(`refreshToken:${userId.toString()}`);

  // Generate new pair
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);

  // Store new refresh token
  await storeRefreshToken(userId, refreshToken);

  return { accessToken, refreshToken };
};

/**
 * Invalidate all sessions for a user (delete refresh token from Redis)
 */
export const invalidateAllSessions = async (userId) => {
  const redis = getRedisClient();
  await redis.del(`refreshToken:${userId.toString()}`);
  logger.info(`All sessions invalidated for user ${userId}`);
};

/**
 * Verify JWT access token
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

/**
 * Generate a short-lived reset token JWT
 */
export const generateResetToken = (email) => {
  return jwt.sign(
    { email: email.toLowerCase(), type: 'reset', iat: Date.now() },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
};

/**
 * Verify reset token
 */
export const verifyResetToken = (token) => {
  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  if (decoded.type !== 'reset') throw new Error('Invalid reset token');
  return decoded;
};

/**
 * Set secure httpOnly cookie for refresh token
 */
export const setRefreshCookie = (res, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    // 'none' is required for cross-origin cookie sharing (Vercel frontend <-> EC2 backend)
    // 'none' requires secure: true, so in dev we fall back to 'lax'
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
    path: '/api/auth',
  });
};

/**
 * Clear refresh token cookie
 */
export const clearRefreshCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/auth',
  });
};

export default {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  verifyRefreshToken,
  rotateTokens,
  invalidateAllSessions,
  verifyAccessToken,
  generateResetToken,
  verifyResetToken,
  setRefreshCookie,
  clearRefreshCookie,
};
