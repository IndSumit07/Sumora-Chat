import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { FILE_LIMITS, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, ALLOWED_AUDIO_TYPES, ALLOWED_DOCUMENT_TYPES } from '../utils/constants.js';
import { errorResponse } from '../utils/apiResponse.js';

// Use memory storage — files will be sent directly to S3
const storage = multer.memoryStorage();

const ALL_ALLOWED_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
  ...ALLOWED_AUDIO_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
];

const fileFilter = async (req, file, cb) => {
  // Preliminary MIME check
  if (!ALL_ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname), false);
  }
  cb(null, true);
};

const createUpload = (limits) => {
  return multer({
    storage,
    fileFilter,
    limits,
  });
};

// Avatar upload: 5MB max
export const uploadAvatar = createUpload({
  fileSize: FILE_LIMITS.AVATAR,
  files: 1,
}).single('avatar');

// Message file upload: up to 100MB (handles all types)
export const uploadMessageFile = createUpload({
  fileSize: FILE_LIMITS.VIDEO, // max is video = 100MB
  files: 1,
}).single('file');

// Group avatar: 5MB max
export const uploadGroupAvatar = createUpload({
  fileSize: FILE_LIMITS.AVATAR,
  files: 1,
}).single('avatar');

/**
 * Middleware to verify actual file type using magic bytes (file-type library)
 * Must run AFTER multer since we need the buffer
 */
export const verifyFileType = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const detected = await fileTypeFromBuffer(req.file.buffer);

    if (!detected) {
      // Plain text files won't be detected by magic bytes
      if (req.file.mimetype === 'text/plain') return next();
      return errorResponse(res, {
        message: 'Could not detect file type',
        statusCode: 400,
        code: 'INVALID_FILE_TYPE',
      });
    }

    if (!ALL_ALLOWED_TYPES.includes(detected.mime)) {
      return errorResponse(res, {
        message: `File type ${detected.mime} is not allowed`,
        statusCode: 400,
        code: 'INVALID_FILE_TYPE',
      });
    }

    // Override the MIME type with the detected one for accuracy
    req.file.mimetype = detected.mime;
    req.file.detectedType = detected;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Multer error handler middleware
 */
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, {
        message: 'File is too large',
        statusCode: 400,
        code: 'FILE_TOO_LARGE',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return errorResponse(res, {
        message: 'File type not allowed',
        statusCode: 400,
        code: 'INVALID_FILE_TYPE',
      });
    }
    return errorResponse(res, {
      message: err.message,
      statusCode: 400,
      code: 'UPLOAD_ERROR',
    });
  }
  next(err);
};
