import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a random 6-digit OTP string
 */
export const generateOTP = (digits = 6) => {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return String(crypto.randomInt(min, max + 1)).padStart(digits, '0');
};

/**
 * Generate a UUID v4
 */
export const generateUUID = () => uuidv4();

/**
 * Generate a cryptographically secure random hex string
 */
export const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Encrypt text using AES-256-CBC
 * Returns: iv:encryptedHex
 */
export const encryptText = (text) => {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  if (key.length !== 32) throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex chars)');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt AES-256-CBC encrypted text
 */
export const decryptText = (encryptedText) => {
  try {
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return '[message unavailable]';
  }
};

/**
 * Sort two ObjectIds as strings to create a consistent compound key
 * Used for conversation deduplication
 */
export const sortedPair = (id1, id2) => {
  const s1 = id1.toString();
  const s2 = id2.toString();
  return s1 < s2 ? [s1, s2] : [s2, s1];
};

/**
 * Format file size in human-readable form
 */
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

/**
 * Truncate string to given length with ellipsis
 */
export const truncate = (str, maxLength = 100) => {
  if (!str) return '';
  return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
};

/**
 * Get file extension from original name
 */
export const getFileExtension = (fileName) => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};

/**
 * Generate S3 key for a file
 */
export const generateS3Key = (folder, userId, extension) => {
  return `${folder}/${userId}/${uuidv4()}.${extension}`;
};

/**
 * Sleep utility for delays
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Safe JSON parse - returns null on failure
 */
export const safeJsonParse = (str) => {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};

/**
 * Check if a value is a valid MongoDB ObjectId format
 */
export const isValidObjectId = (id) => {
  return /^[a-f\d]{24}$/i.test(String(id));
};

/**
 * Compute difference between two arrays
 */
export const arrayDiff = (arr1, arr2) => {
  const set2 = new Set(arr2.map(String));
  return arr1.filter((item) => !set2.has(String(item)));
};

/**
 * Paginate an array (for in-memory pagination)
 */
export const paginateArray = (arr, page = 1, limit = 20) => {
  const start = (page - 1) * limit;
  return arr.slice(start, start + limit);
};

/**
 * Deep merge two objects
 */
export const deepMerge = (target, source) => {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
};
