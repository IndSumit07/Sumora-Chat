export const TYPING_DEBOUNCE_MS = 3000;
export const HEARTBEAT_INTERVAL_MS = 120000;
export const MESSAGES_PER_PAGE = 30;

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
  VOICE_NOTE: 'voiceNote',
  LOCATION: 'location',
};

export const MEMBER_ROLES = {
  ADMIN: 'admin',
  CO_ADMIN: 'co-admin',
  MEMBER: 'member',
};

export const SIDEBAR_TABS = {
  CHATS: 'chats',
  GROUPS: 'groups',
  FRIENDS: 'friends',
  NOTIFICATIONS: 'notifications',
};

export const MODAL_TYPES = {
  CREATE_GROUP: 'createGroup',
  ADD_FRIEND: 'addFriend',
  PROFILE: 'profile',
  GROUP_INFO: 'groupInfo',
  MEDIA_PREVIEW: 'mediaPreview',
  EDIT_PROFILE: 'editProfile',
  GROUP_SETTINGS: 'groupSettings',
};

export const GOOGLE_AUTH_URL = `${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/google`;

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
