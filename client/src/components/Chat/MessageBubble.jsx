import { useState, useRef, useCallback } from 'react';
import {
  Check, CheckCheck, Pencil, Trash2, MoreHorizontal,
  File, Download, Play, Pause, Image as ImageIcon, Mic
} from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import { formatMessageTime, formatFileSize, formatDuration } from '../../utils/formatters.js';
import { useChatStore } from '../../store/chatStore.js';
import { useAuthStore } from '../../store/authStore.js';
import messageApi from '../../api/message.api.js';
import groupApi from '../../api/group.api.js';
import { useUIStore } from '../../store/uiStore.js';
import { MODAL_TYPES, MESSAGE_TYPES } from '../../utils/constants.js';
import toast from 'react-hot-toast';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function MessageBubble({
  message,
  isOwn,
  isGroup = false,
  conversationId,
  groupId,
}) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const contextMenuRef = useRef(null);
  const { updateMessage, deleteMessageFromState, updateReactions } = useChatStore();
  const { user } = useAuthStore();
  const { openMediaPreview } = useUIStore();

  const roomId = conversationId || groupId;

  if (message.isDeleted) {
    return (
      <div className={`flex mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="px-4 py-2 rounded-2xl bg-bg-elevated border border-border max-w-xs">
          <p className="text-xs text-text-muted italic">🚫 This message was deleted</p>
        </div>
      </div>
    );
  }

  const handleReact = async (emoji) => {
    try {
      const api = isGroup ? groupApi : messageApi;
      // Use group message endpoint vs DM message endpoint
      const response = await messageApi.reactToMessage(message._id, { emoji });
      updateReactions(roomId, message._id, response.data.data.reactions);
    } catch {
      toast.error('Failed to react');
    }
    setShowReactions(false);
  };

  const handleDelete = async (deleteFor) => {
    try {
      await messageApi.deleteMessage(message._id, { deleteFor });
      if (deleteFor === 'everyone') {
        deleteMessageFromState(roomId, message._id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
    setShowContextMenu(false);
  };

  const handleImageClick = () => {
    if (message.fileUrl) {
      openMediaPreview({ url: message.fileUrl, type: 'image', name: message.fileName });
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const readStatus = () => {
    if (!isOwn) return null;
    const hasRead = message.readBy?.some((r) => r.user !== user?._id && r.user);
    return (
      <span className="text-text-muted ml-1">
        {hasRead ? (
          <CheckCheck size={12} className="text-accent" />
        ) : (
          <Check size={12} />
        )}
      </span>
    );
  };

  const renderContent = () => {
    switch (message.type) {
      case MESSAGE_TYPES.IMAGE:
        return (
          <div className="relative group">
            <img
              src={message.thumbnailUrl || message.fileUrl}
              alt={message.fileName || 'Image'}
              className="media-image"
              onClick={handleImageClick}
              onLoad={(e) => e.target.style.display = 'block'}
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center cursor-pointer"
              onClick={handleImageClick}
            >
              <ImageIcon size={24} className="text-white" />
            </div>
          </div>
        );

      case MESSAGE_TYPES.VOICE_NOTE:
        return (
          <div className="flex items-center gap-3 min-w-[180px]">
            <button
              onClick={toggleAudio}
              className="w-9 h-9 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-accent/30 transition-colors"
            >
              {isPlaying ? <Pause size={14} className="text-accent" /> : <Play size={14} className="text-accent" />}
            </button>
            {/* Waveform bars */}
            <div className="flex items-center gap-0.5 flex-1 h-8">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="waveform-bar"
                  style={{
                    height: `${20 + Math.sin(i * 0.8) * 12}px`,
                    animationDelay: isPlaying ? `${i * 0.07}s` : '0s',
                    animationPlayState: isPlaying ? 'running' : 'paused',
                  }}
                />
              ))}
            </div>
            <span className="text-2xs text-text-muted flex-shrink-0">
              {formatDuration(message.duration || 0)}
            </span>
            <audio
              ref={audioRef}
              src={message.fileUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </div>
        );

      case MESSAGE_TYPES.DOCUMENT:
        return (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-bg-primary/30 rounded-xl hover:bg-bg-primary/50 transition-colors min-w-[200px] max-w-xs"
          >
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <File size={18} className="text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary truncate">{message.fileName || 'Document'}</p>
              <p className="text-2xs text-text-muted">{formatFileSize(message.fileSize)}</p>
            </div>
            <Download size={16} className="text-text-muted flex-shrink-0" />
          </a>
        );

      default:
        return (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        );
    }
  };

  return (
    <div
      className={`flex mb-1 group ${isOwn ? 'justify-end' : 'justify-start'}`}
      onMouseLeave={() => setShowContextMenu(false)}
    >
      {/* Other user avatar (group) */}
      {!isOwn && isGroup && (
        <Avatar
          src={message.sender?.avatar}
          name={message.sender?.fullName}
          size="sm"
          className="mr-2 mt-auto mb-1 flex-shrink-0"
        />
      )}

      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%] gap-1`}>
        {/* Sender name in groups */}
        {!isOwn && isGroup && (
          <span className="text-2xs font-medium text-accent px-1">
            {message.sender?.fullName || message.sender?.username}
          </span>
        )}

        {/* Reply context */}
        {message.replyTo && !message.replyTo.isDeleted && (
          <div className={`px-3 py-1.5 rounded-lg border-l-2 border-accent/50 bg-black/20 text-xs text-text-muted max-w-full truncate ${isOwn ? 'mr-1' : 'ml-1'}`}>
            <span className="text-accent font-medium block text-2xs mb-0.5">
              {message.replyTo.sender?.fullName || 'Reply'}
            </span>
            {message.replyTo.content || `[${message.replyTo.type}]`}
          </div>
        )}

        {/* Bubble */}
        <div className="relative flex items-end gap-1">
          {/* Context menu trigger */}
          {!showContextMenu && (
            <button
              onClick={() => setShowContextMenu(true)}
              className={`opacity-0 group-hover:opacity-100 transition-opacity btn-icon w-6 h-6 flex-shrink-0
                ${isOwn ? 'order-first' : 'order-last'}`}
            >
              <MoreHorizontal size={14} />
            </button>
          )}

          <div
            className={`relative ${isOwn ? 'bubble-sent' : 'bubble-received'}`}
          >
            {renderContent()}

            {/* Reactions */}
            {message.reactions?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(
                  message.reactions.reduce((acc, r) => {
                    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([emoji, count]) => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className="flex items-center gap-1 bg-bg-primary/40 rounded-full px-2 py-0.5 text-xs hover:bg-bg-primary/60 transition-colors"
                  >
                    <span>{emoji}</span>
                    {count > 1 && <span className="text-text-muted">{count}</span>}
                  </button>
                ))}
              </div>
            )}

            {/* Timestamp + status */}
            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {message.isEdited && (
                <span className="text-2xs text-text-muted italic">edited</span>
              )}
              <span className="text-2xs text-text-muted opacity-70">
                {formatMessageTime(message.createdAt)}
              </span>
              {readStatus()}
            </div>
          </div>
        </div>

        {/* Emoji reaction picker */}
        {showReactions && (
          <div className={`flex gap-1 bg-bg-elevated border border-border rounded-2xl px-3 py-2 shadow-menu animate-scale-in z-10 ${isOwn ? 'self-end' : 'self-start'}`}>
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="text-xl hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Context menu */}
        {showContextMenu && (
          <div
            ref={contextMenuRef}
            className={`context-menu ${isOwn ? 'right-0' : 'left-0'}`}
          >
            <button
              className="context-menu-item w-full"
              onClick={() => { setShowReactions(true); setShowContextMenu(false); }}
            >
              <span>😊</span> React
            </button>
            {isOwn && message.type === MESSAGE_TYPES.TEXT && (
              <button
                className="context-menu-item w-full"
                onClick={() => {
                  // Trigger edit mode — bubble communicates via parent
                  setShowContextMenu(false);
                }}
              >
                <Pencil size={14} /> Edit
              </button>
            )}
            <button
              className="context-menu-item w-full"
              onClick={() => handleDelete('me')}
            >
              <Trash2 size={14} /> Delete for me
            </button>
            {isOwn && (
              <button
                className="context-menu-item w-full context-menu-item-danger"
                onClick={() => handleDelete('everyone')}
              >
                <Trash2 size={14} className="text-danger" /> Delete for everyone
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
