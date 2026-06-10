import { getRedisClient } from '../config/redis.js';
import { generateOTP } from '../utils/helpers.js';
import { OTP_TTL_SECONDS, OTP_DIGITS } from '../utils/constants.js';
import logger from '../config/logger.js';

/**
 * Generate and store OTP in Redis
 * @param {string} purpose - 'register' | 'reset' | 'delete' | 'change_password'
 * @param {string} identifier - email or userId
 * @param {number} ttl - TTL in seconds (default 10min)
 */
export const createOTP = async (purpose, identifier, ttl = OTP_TTL_SECONDS) => {
  const redis = getRedisClient();
  const otp = generateOTP(OTP_DIGITS);
  const key = `otp:${purpose}:${identifier.toLowerCase()}`;

  // Store OTP with attempt counter
  await redis.setex(key, ttl, JSON.stringify({ otp, attempts: 0, createdAt: Date.now() }));

  logger.info(`OTP created: purpose=${purpose}, identifier=${identifier}, ttl=${ttl}s`);
  return otp;
};

/**
 * Verify OTP from Redis
 * Returns: { valid: bool, reason: string | null }
 */
export const verifyOTP = async (purpose, identifier, submittedOtp) => {
  const redis = getRedisClient();
  const key = `otp:${purpose}:${identifier.toLowerCase()}`;

  const raw = await redis.get(key);
  if (!raw) {
    return { valid: false, reason: 'OTP has expired or does not exist' };
  }

  let stored;
  try {
    stored = JSON.parse(raw);
  } catch {
    await redis.del(key);
    return { valid: false, reason: 'Invalid OTP data' };
  }

  // Track failed attempts
  if (stored.attempts >= 5) {
    await redis.del(key);
    return { valid: false, reason: 'Too many failed attempts. Request a new OTP.' };
  }

  if (stored.otp !== submittedOtp.trim()) {
    // Increment attempt count
    stored.attempts++;
    const ttl = await redis.ttl(key);
    if (ttl > 0) {
      await redis.setex(key, ttl, JSON.stringify(stored));
    }
    return { valid: false, reason: `Invalid OTP. ${5 - stored.attempts} attempts remaining.` };
  }

  // Valid — delete OTP so it can't be reused
  await redis.del(key);
  logger.info(`OTP verified: purpose=${purpose}, identifier=${identifier}`);
  return { valid: true, reason: null };
};

/**
 * Delete an OTP key from Redis (e.g., on cancellation)
 */
export const deleteOTP = async (purpose, identifier) => {
  const redis = getRedisClient();
  const key = `otp:${purpose}:${identifier.toLowerCase()}`;
  await redis.del(key);
};

/**
 * Check if OTP exists (without verifying)
 */
export const otpExists = async (purpose, identifier) => {
  const redis = getRedisClient();
  const key = `otp:${purpose}:${identifier.toLowerCase()}`;
  const exists = await redis.exists(key);
  return exists === 1;
};

export default { createOTP, verifyOTP, deleteOTP, otpExists };
