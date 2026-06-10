import { Router } from 'express';
import passport from 'passport';
import {
  register,
  verifyRegister,
  login,
  googleCallback,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  changePassword,
  setPassword,
  deleteAccount,
  confirmDeleteAccount,
  refreshToken,
  logout,
  getMe,
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authLimiter, otpLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  registerSchema,
  verifyRegisterSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
  changePasswordSchema,
  setPasswordSchema,
  confirmDeleteSchema,
} from '../validators/auth.validator.js';

const router = Router();

// Public routes
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/verify-register', otpLimiter, validate(verifyRegisterSchema), verifyRegister);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', otpLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/verify-reset-otp', otpLimiter, validate(verifyResetOtpSchema), verifyResetOtp);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { session: false, scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleCallback
);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.post('/change-password', protect, validate(changePasswordSchema), changePassword);
router.post('/set-password', protect, validate(setPasswordSchema), setPassword);
router.delete('/delete-account', protect, deleteAccount);
router.post('/confirm-delete', protect, validate(confirmDeleteSchema), confirmDeleteAccount);

export default router;
