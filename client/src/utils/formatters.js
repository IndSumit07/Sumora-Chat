import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns';

/**
 * Format message timestamp for display in message bubble
 */
export const formatMessageTime = (date) => {
  return format(new Date(date), 'HH:mm');
};

/**
 * Format conversation list timestamp (today: time, yesterday: "Yesterday", week: day name, else date)
 */
export const formatConversationTime = (date) => {
  if (!date) return '';
  const d = new Date(date);

  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Yesterday';
  if (isThisWeek(d)) return format(d, 'EEEE'); // Monday, Tuesday...
  if (isThisYear(d)) return format(d, 'MMM d');
  return format(d, 'MM/dd/yy');
};

/**
 * Format last seen time
 */
export const formatLastSeen = (date) => {
  if (!date) return 'Long time ago';
  const d = new Date(date);

  if (isToday(d)) return `last seen today at ${format(d, 'HH:mm')}`;
  if (isYesterday(d)) return `last seen yesterday at ${format(d, 'HH:mm')}`;
  return `last seen ${format(d, 'MMM d')} at ${format(d, 'HH:mm')}`;
};

/**
 * Format relative time for notifications
 */
export const formatRelativeTime = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

/**
 * Format date divider in message list (Today, Yesterday, or full date)
 */
export const formatDateDivider = (date) => {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  if (isThisYear(d)) return format(d, 'MMMM d');
  return format(d, 'MMMM d, yyyy');
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

/**
 * Format audio duration (seconds -> MM:SS)
 */
export const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text, maxLength = 80) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

/**
 * Get initials from full name
 */
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};

/**
 * Get message status text
 */
export const getMessageStatusIcon = (message, currentUserId) => {
  if (message.sender?._id !== currentUserId) return null;
  if (message.readBy?.some((r) => r.user !== currentUserId && r.user)) return 'read';
  if (message.deliveredTo?.length > 0) return 'delivered';
  return 'sent';
};

/**
 * Get file type icon name based on mimeType
 */
export const getFileTypeIcon = (mimeType) => {
  if (!mimeType) return 'File';
  if (mimeType.includes('pdf')) return 'FileText';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'FileText';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'FileSpreadsheet';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'FilePresentation';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'FileArchive';
  if (mimeType.includes('audio')) return 'Music';
  if (mimeType.includes('video')) return 'Video';
  return 'File';
};

/**
 * Generate avatar color from string (deterministic)
 */
export const getAvatarColor = (str) => {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
    '#06b6d4', '#10b981', '#f59e0b', '#6366f1',
  ];
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};
