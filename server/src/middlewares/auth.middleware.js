import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { unauthorizedResponse, forbiddenResponse } from '../utils/apiResponse.js';
import logger from '../config/logger.js';

/**
 * Verifies JWT access token and attaches req.user
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse(res, 'Access token is missing or malformed');
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return unauthorizedResponse(res, 'Access token expired');
      }
      return unauthorizedResponse(res, 'Invalid access token');
    }

    const user = await User.findById(decoded.userId).select('-password').lean();

    if (!user) {
      return unauthorizedResponse(res, 'User not found');
    }

    if (user.isDeleted) {
      return unauthorizedResponse(res, 'Account has been deleted');
    }

    if (!user.isVerified) {
      return forbiddenResponse(res, 'Email not verified');
    }

    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (err) {
    logger.error(`Auth middleware error: ${err.message}`);
    return unauthorizedResponse(res, 'Authentication failed');
  }
};

/**
 * Optional auth — does not reject if no token, but attaches user if token present
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.userId).select('-password').lean();

    if (user && !user.isDeleted) {
      req.user = user;
      req.userId = user._id.toString();
    }
  } catch {
    // Silently ignore errors in optional auth
  }
  next();
};

export default protect;
