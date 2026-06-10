// App-wide constants

export const OTP_TTL_SECONDS = 600; // 10 minutes
export const OTP_DIGITS = 6;
export const OTP_MAX_ATTEMPTS = 5;

export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
export const ACCESS_TOKEN_EXPIRES_IN = '15m';
export const REFRESH_TOKEN_EXPIRES_IN = '7d';

export const ONLINE_TTL_SECONDS = 300; // 5 minutes
export const HEARTBEAT_INTERVAL_MS = 120000; // 2 minutes (client sends heartbeat)
export const TYPING_TTL_SECONDS = 5;
export const TYPING_DEBOUNCE_MS = 3000;

export const LOGIN_ATTEMPT_MAX = 5;
export const LOGIN_LOCK_DURATION_SECONDS = 30 * 60; // 30 minutes

export const PASSWORD_RESET_TOKEN_TTL = '15m';
export const DELETE_ACCOUNT_OTP_TTL_SECONDS = 600;

export const MEMBER_ROLES = {
  ADMIN: 'admin',
  CO_ADMIN: 'co-admin',
  MEMBER: 'member',
};

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
  VOICE_NOTE: 'voiceNote',
  LOCATION: 'location',
};

export const NOTIFICATION_TYPES = {
  FRIEND_REQUEST: 'friendRequest',
  FRIEND_ACCEPTED: 'friendAccepted',
  GROUP_INVITE: 'groupInvite',
  GROUP_MESSAGE: 'groupMessage',
  MENTION: 'mention',
  MESSAGE_REACTION: 'messageReaction',
};

export const FRIEND_REQUEST_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

export const FILE_LIMITS = {
  IMAGE: 10 * 1024 * 1024,        // 10MB
  DOCUMENT: 50 * 1024 * 1024,     // 50MB
  AUDIO: 25 * 1024 * 1024,        // 25MB
  VIDEO: 100 * 1024 * 1024,       // 100MB
  AVATAR: 5 * 1024 * 1024,        // 5MB
};

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
];

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
];

export const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
  'audio/mp4',
  'audio/aac',
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
  'application/x-rar-compressed',
];

export const S3_FOLDERS = {
  AVATARS: 'avatars',
  CONVERSATIONS: 'conversations',
  GROUPS: 'groups',
  DOCUMENTS: 'documents',
  VOICE_NOTES: 'voice-notes',
};

export const PRESIGNED_URL_EXPIRY = 3600; // 1 hour

export const MESSAGES_PER_PAGE = 30;
export const CONVERSATIONS_PER_PAGE = 20;
export const NOTIFICATIONS_PER_PAGE = 50;
export const FRIENDS_PER_PAGE = 50;

export const DELETE_MESSAGE_TIME_LIMIT_HOURS = 24;

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_OTP: 'INVALID_OTP',
  OTP_EXPIRED: 'OTP_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  NOT_VERIFIED: 'NOT_VERIFIED',
};

export const SOCKET_EVENTS = {
  // Server emits
  NEW_MESSAGE: 'newMessage',
  NEW_GROUP_MESSAGE: 'newGroupMessage',
  MESSAGE_EDITED: 'messageEdited',
  MESSAGE_DELETED: 'messageDeleted',
  MESSAGE_REACTION: 'messageReaction',
  MESSAGES_READ: 'messagesRead',
  TYPING_START: 'typingStart',
  TYPING_STOP: 'typingStop',
  USER_ONLINE: 'userOnline',
  USER_OFFLINE: 'userOffline',
  FRIEND_REQUEST: 'friendRequest',
  FRIEND_REQUEST_ACCEPTED: 'friendRequestAccepted',
  ADDED_TO_GROUP: 'addedToGroup',
  MEMBER_ADDED: 'memberAdded',
  MEMBER_REMOVED: 'memberRemoved',
  GROUP_DELETED: 'groupDeleted',
  NOTIFICATION: 'notification',
  // Client emits
  SEND_MESSAGE: 'sendMessage',
  HEARTBEAT: 'heartbeat',
  JOIN_ROOM: 'joinRoom',
  LEAVE_ROOM: 'leaveRoom',
  MARK_READ: 'markRead',
};
