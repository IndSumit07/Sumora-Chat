import { useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '../../store/chatStore.js';
import MessageBubble from './MessageBubble.jsx';
import { formatDateDivider } from '../../utils/formatters.js';
import { InlineLoader } from '../ui/Spinner.jsx';
import { isSameDay } from 'date-fns';

export default function MessageList({
  messages,
  currentUserId,
  conversationId,
  groupId,
  hasMore,
  onLoadMore,
  isLoadingMore,
  bottomRef,
  otherUser,
  isGroup = false,
}) {
  const containerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);

  // Maintain scroll position when loading more messages
  useEffect(() => {
    if (isLoadingMore) {
      prevScrollHeightRef.current = containerRef.current?.scrollHeight || 0;
    }
  }, [isLoadingMore]);

  useEffect(() => {
    if (!isLoadingMore && prevScrollHeightRef.current > 0) {
      const container = containerRef.current;
      if (container) {
        const newScrollHeight = container.scrollHeight;
        const diff = newScrollHeight - prevScrollHeightRef.current;
        container.scrollTop = diff;
        prevScrollHeightRef.current = 0;
      }
    }
  }, [messages.length, isLoadingMore]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    // Load more when scrolled within 200px of top
    if (container.scrollTop < 200 && hasMore && !isLoadingMore) {
      onLoadMore();
    }
  }, [hasMore, isLoadingMore, onLoadMore]);

  // Group messages by date for date dividers
  const groupedMessages = [];
  let lastDate = null;

  messages.forEach((msg, idx) => {
    const msgDate = new Date(msg.createdAt);
    if (!lastDate || !isSameDay(lastDate, msgDate)) {
      groupedMessages.push({ type: 'divider', date: msgDate, id: `divider-${idx}` });
      lastDate = msgDate;
    }
    groupedMessages.push({ type: 'message', data: msg });
  });

  const roomId = conversationId || groupId;
  const typingUsers = useChatStore((s) => s.typingUsers[roomId] || []);

  return (
    <div
      ref={containerRef}
      className="messages-container flex-1 px-4 py-2"
      onScroll={handleScroll}
    >
      {/* Load more indicator */}
      {isLoadingMore && (
        <div className="py-3">
          <InlineLoader text="Loading messages..." />
        </div>
      )}

      {/* Messages */}
      {groupedMessages.map((item) => {
        if (item.type === 'divider') {
          return (
            <div key={item.id} className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-2xs text-text-muted bg-bg-primary px-3 py-1 rounded-full border border-border/30">
                {formatDateDivider(item.date)}
              </span>
              <div className="flex-1 h-px bg-border/50" />
            </div>
          );
        }

        const msg = item.data;
        return (
          <MessageBubble
            key={msg._id}
            message={msg}
            isOwn={msg.sender?._id === currentUserId}
            isGroup={isGroup}
            conversationId={conversationId}
            groupId={groupId}
          />
        );
      })}

      {/* Typing indicators */}
      {typingUsers.length > 0 && (
        <div className="flex items-end gap-2 mb-2 animate-fade-in">
          <div className="bubble-received flex items-center gap-1 px-4 py-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-text-muted"
                style={{ animation: `typing 1.4s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
          {isGroup && (
            <span className="text-xs text-text-muted mb-2">
              {typingUsers[0]?.fullName || typingUsers[0]?.username}
            </span>
          )}
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} className="h-1" />
    </div>
  );
}
