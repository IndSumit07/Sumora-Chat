import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import GroupMessage from '../models/GroupMessage.js';
import { getRedisClient } from '../config/redis.js';
import { createOTP, verifyOTP } from '../services/otp.service.js';
import { queueEmail } from '../config/bullmq.js';
import { otpEmailTemplate } from '../services/email.service.js';
import {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  verifyRefreshToken,
  rotateTokens,
  invalidateAllSessions,
  generateResetToken,
  verifyResetToken,
  setRefreshCookie,
  clearRefreshCookie,
} from '../services/token.service.js';
import { deleteFile } from '../services/s3.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';
import {
  successResponse,
  createdResponse,
  errorResponse,
} from '../utils/apiResponse.js';
import {
  LOGIN_ATTEMPT_MAX,
  LOGIN_LOCK_DURATION_SECONDS,
  OTP_TTL_SECONDS,
} from '../utils/constants.js';
import logger from '../config/logger.js';

// ========================
// POST /api/auth/register
// ========================
export const register = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;

  // Check uniqueness
  const existing = await User.findOne({
    $or: [{ email }, { username }],
    isDeleted: { $ne: true },
  });

  if (existing) {
    const field = existing.email === email ? 'email' : 'username';
    throw new AppError(`${field} is already in use`, 409, 'CONFLICT', [
      { field, message: `${field} already taken` },
    ]);
  }

  // Generate OTP and queue email
  const otp = await createOTP('register', email);
  await queueEmail({
    to: email,
    subject: 'Verify your Sumora Chat account',
    html: otpEmailTemplate({ otp, purpose: 'register', expiryMinutes: 10 }),
  });

  // Temporarily store registration data in Redis (10min TTL)
  const redis = getRedisClient();
  await redis.setex(
    `register:pending:${email}`,
    OTP_TTL_SECONDS,
    JSON.stringify({ fullName, username, email, password })
  );

  return successResponse(res, {
    message: 'OTP sent to your email. Please verify to complete registration.',
    data: { email },
  });
});

// ==============================
// POST /api/auth/verify-register
// ==============================
export const verifyRegister = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const result = await verifyOTP('register', email, otp);
  if (!result.valid) {
    throw new AppError(result.reason, 400, 'INVALID_OTP');
  }

  const redis = getRedisClient();
  const pendingRaw = await redis.get(`register:pending:${email}`);
  if (!pendingRaw) {
    throw new AppError('Registration session expired. Please register again.', 400, 'SESSION_EXPIRED');
  }

  const pending = JSON.parse(pendingRaw);
  await redis.del(`register:pending:${email}`);

  // Double-check uniqueness (race condition protection)
  const existing = await User.findOne({
    $or: [{ email: pending.email }, { username: pending.username }],
    isDeleted: { $ne: true },
  });
  if (existing) {
    throw new AppError('Account already exists', 409, 'CONFLICT');
  }

  // Create user
  const user = await User.create({
    fullName: pending.fullName,
    username: pending.username,
    email: pending.email,
    password: pending.password,
    isVerified: true,
    hasPassword: true,
  });

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  await storeRefreshToken(user._id, refreshToken);
  setRefreshCookie(res, refreshToken);

  logger.info(`New user registered: ${email}`);

  return createdResponse(res, {
    message: 'Account created successfully',
    data: { accessToken, user: user.toSafeObject() },
  });
});

// ====================
// POST /api/auth/login
// ====================
export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const redis = getRedisClient();

  const user = await User.findByEmailOrUsername(identifier);
  if (!user) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // Check if account is locked
  const lockKey = `loginLock:${user._id}`;
  const locked = await redis.get(lockKey);
  if (locked) {
    const ttl = await redis.ttl(lockKey);
    throw new AppError(
      `Account locked due to too many failed attempts. Try again in ${Math.ceil(ttl / 60)} minutes.`,
      403,
      'ACCOUNT_LOCKED'
    );
  }

  if (!user.isVerified) {
    throw new AppError('Email not verified. Please check your email for the OTP.', 403, 'NOT_VERIFIED');
  }

  if (user.isDeleted) {
    throw new AppError('Account not found', 404, 'NOT_FOUND');
  }

  if (!user.hasPassword || !user.password) {
    throw new AppError('This account uses Google Sign-In. Please log in with Google.', 400, 'GOOGLE_AUTH_ONLY');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    // Track failed attempts
    const attemptsKey = `loginAttempts:${user._id}`;
    const attempts = await redis.incr(attemptsKey);
    await redis.expire(attemptsKey, LOGIN_LOCK_DURATION_SECONDS);

    if (attempts >= LOGIN_ATTEMPT_MAX) {
      await redis.setex(lockKey, LOGIN_LOCK_DURATION_SECONDS, '1');
      await redis.del(attemptsKey);
      logger.warn(`Account locked after ${LOGIN_ATTEMPT_MAX} failed attempts: ${user.email}`);
      throw new AppError(
        `Account locked for 30 minutes due to too many failed attempts.`,
        403,
        'ACCOUNT_LOCKED'
      );
    }

    throw new AppError(
      `Invalid credentials. ${LOGIN_ATTEMPT_MAX - attempts} attempts remaining.`,
      401,
      'INVALID_CREDENTIALS'
    );
  }

  // Clear failed attempt counter on success
  await redis.del(`loginAttempts:${user._id}`);

  // Generate and rotate tokens
  const { accessToken, refreshToken } = await rotateTokens(user._id);
  setRefreshCookie(res, refreshToken);

  // Update lastSeen
  await User.findByIdAndUpdate(user._id, { lastSeen: new Date() });

  logger.info(`User logged in: ${user.email}`);

  return successResponse(res, {
    message: 'Login successful',
    data: { accessToken, user: user.toSafeObject() },
  });
});

// ===========================
// GET /api/auth/google/callback
// ===========================
export const googleCallback = asyncHandler(async (req, res) => {
  // req.user is set by passport
  const user = req.user;
  if (!user) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
  }

  const { accessToken, refreshToken } = await rotateTokens(user._id);
  setRefreshCookie(res, refreshToken);

  logger.info(`Google OAuth login: ${user.email}`);

  // Redirect to frontend with access token as query param
  // Frontend stores in memory, never localStorage
  return res.redirect(
    `${process.env.FRONTEND_URL}/auth/google/callback?token=${accessToken}`
  );
});

// ================================
// POST /api/auth/forgot-password
// ================================
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Don't reveal whether email exists
  const user = await User.findOne({ email: email.toLowerCase(), isDeleted: { $ne: true } });

  if (user) {
    const otp = await createOTP('reset', email);
    await queueEmail({
      to: email,
      subject: 'Reset your Sumora Chat password',
      html: otpEmailTemplate({ otp, purpose: 'reset', expiryMinutes: 10 }),
    });
    logger.info(`Password reset OTP sent to: ${email}`);
  }

  return successResponse(res, {
    message: 'If an account with that email exists, an OTP has been sent.',
    data: null,
  });
});

// ===================================
// POST /api/auth/verify-reset-otp
// ===================================
export const verifyResetOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const result = await verifyOTP('reset', email, otp);
  if (!result.valid) {
    throw new AppError(result.reason, 400, 'INVALID_OTP');
  }

  // Generate short-lived reset token
  const resetToken = generateResetToken(email);

  // Store reset token in Redis (15min TTL)
  const redis = getRedisClient();
  await redis.setex(`resetToken:${email}`, 15 * 60, resetToken);

  return successResponse(res, {
    message: 'OTP verified. Use the reset token to set a new password.',
    data: { resetToken },
  });
});

// ================================
// POST /api/auth/reset-password
// ================================
export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;

  let decoded;
  try {
    decoded = verifyResetToken(resetToken);
  } catch {
    throw new AppError('Invalid or expired reset token', 400, 'INVALID_TOKEN');
  }

  const redis = getRedisClient();
  const storedToken = await redis.get(`resetToken:${decoded.email}`);
  if (!storedToken || storedToken !== resetToken) {
    throw new AppError('Reset token has expired or already been used', 400, 'TOKEN_EXPIRED');
  }

  const user = await User.findOne({ email: decoded.email, isDeleted: { $ne: true } });
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  user.password = newPassword;
  user.hasPassword = true;
  await user.save();

  // Invalidate all sessions
  await invalidateAllSessions(user._id);
  await redis.del(`resetToken:${decoded.email}`);

  logger.info(`Password reset successful: ${decoded.email}`);

  return successResponse(res, { message: 'Password reset successful. Please log in.' });
});

// ==================================
// POST /api/auth/change-password [Protected]
// ==================================
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, otp } = req.body;
  const user = await User.findById(req.userId).select('+password');
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  if (user.hasPassword) {
    if (!currentPassword) throw new AppError('Current password is required', 400, 'VALIDATION_ERROR');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new AppError('Current password is incorrect', 400, 'INVALID_PASSWORD');
  } else {
    // Google-only user — verify OTP
    if (!otp) throw new AppError('OTP is required for Google accounts', 400, 'VALIDATION_ERROR');
    const result = await verifyOTP('change_password', user.email, otp);
    if (!result.valid) throw new AppError(result.reason, 400, 'INVALID_OTP');
  }

  user.password = newPassword;
  user.hasPassword = true;
  await user.save();

  // Invalidate all OTHER sessions
  await invalidateAllSessions(user._id);

  // Issue new tokens for current session
  const { accessToken, refreshToken } = await rotateTokens(user._id);
  setRefreshCookie(res, refreshToken);

  return successResponse(res, {
    message: 'Password changed successfully',
    data: { accessToken },
  });
});

// ===================================
// POST /api/auth/set-password [Protected]
// ===================================
export const setPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  const user = await User.findById(req.userId);
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  if (user.hasPassword) {
    throw new AppError('Password already set. Use change-password instead.', 400, 'BAD_REQUEST');
  }

  user.password = newPassword;
  user.hasPassword = true;
  await user.save();

  return successResponse(res, { message: 'Password set successfully' });
});

// ================================
// DELETE /api/auth/delete-account [Protected]
// ================================
export const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  const otp = await createOTP('delete', user._id.toString());
  await queueEmail({
    to: user.email,
    subject: 'Confirm Sumora Chat account deletion',
    html: otpEmailTemplate({ otp, purpose: 'delete', expiryMinutes: 10 }),
  });

  return successResponse(res, {
    message: 'An OTP has been sent to your email to confirm account deletion.',
  });
});

// ===================================
// POST /api/auth/confirm-delete [Protected]
// ===================================
export const confirmDeleteAccount = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const user = await User.findById(req.userId);
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  const result = await verifyOTP('delete', user._id.toString(), otp);
  if (!result.valid) throw new AppError(result.reason, 400, 'INVALID_OTP');

  // Soft-delete user
  user.isDeleted = true;
  user.deletedAt = new Date();
  user.fullName = 'Deleted User';
  user.username = `deleted_${user._id}`;
  user.email = `deleted_${user._id}@deleted.com`;
  user.bio = '';
  user.phoneNumber = null;
  user.friends = [];
  user.blockedUsers = [];
  await user.save();

  // Delete avatar from S3
  if (user.avatarKey) {
    await deleteFile(user.avatarKey);
  }

  // Anonymize messages (do asynchronously)
  Promise.all([
    Message.updateMany({ sender: user._id }, { $set: { sender: null } }),
    GroupMessage.updateMany({ sender: user._id }, { $set: { sender: null } }),
  ]).catch((err) => logger.error(`Error anonymizing messages: ${err.message}`));

  // Invalidate all sessions
  await invalidateAllSessions(user._id);
  clearRefreshCookie(res);

  logger.info(`Account deleted: ${req.userId}`);

  return successResponse(res, { message: 'Account deleted successfully' });
});

// =======================
// POST /api/auth/refresh
// =======================
export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) throw new AppError('Refresh token not found', 401, 'UNAUTHORIZED');

  let userId;
  try {
    const result = await verifyRefreshToken(token);
    userId = result.userId;
  } catch (err) {
    clearRefreshCookie(res);
    throw new AppError(err.message, 401, 'INVALID_TOKEN');
  }

  const { accessToken, refreshToken: newRefreshToken } = await rotateTokens(userId);
  setRefreshCookie(res, newRefreshToken);

  return successResponse(res, {
    message: 'Token refreshed',
    data: { accessToken },
  });
});

// ========================
// POST /api/auth/logout [Protected]
// ========================
export const logout = asyncHandler(async (req, res) => {
  await invalidateAllSessions(req.userId);
  clearRefreshCookie(res);

  return successResponse(res, { message: 'Logged out successfully' });
});

// ======================
// GET /api/auth/me [Protected]
// ======================
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId).select('-password').lean();
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  const redis = getRedisClient();
  const unreadCount = await redis.get(`unread:${req.userId}`);

  return successResponse(res, {
    data: {
      user,
      unreadNotifications: parseInt(unreadCount) || 0,
    },
  });
});
