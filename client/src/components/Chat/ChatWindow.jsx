import { useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useChatStore } from '../../store/chatStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';
import { useMessages } from '../../hooks/useMessages.js';
import conversationApi from '../../api/conversation.api.js';
import ChatHeader from './ChatHeader.jsx';
import MessageList from './MessageList.jsx';
import MessageInput from './MessageInput.jsx';
import { InlineLoader } from '../ui/Spinner.jsx';

export default function ChatWindow({ conversationId }) {
  const { user } = useAuthStore();
  const { messages: roomMessages } = useChatStore();
  const bottomRef = useRef(null);

  // Fetch conversation details
  const { data: convData, isLoading: convLoading } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const response = await conversationApi.getConversation(conversationId);
      return response.data.data.conversation;
    },
    staleTime: 1000 * 60,
  });

  // Single source of truth for messages — no more dual query
  const {
    isLoading: messagesLoading,
    hasMore,
    fetchNextPage,
    isFetchingNextPage,
    sendMessage,
    isSending,
  } = useMessages({ conversationId });

  const currentMessages = roomMessages[conversationId] || [];

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  // Scroll to bottom on initial load
  const initialScrollDone = useRef(false);
  useEffect(() => {
    if (currentMessages.length > 0 && !initialScrollDone.current) {
      initialScrollDone.current = true;
      setTimeout(() => scrollToBottom('instant'), 50);
    }
  }, [currentMessages.length, scrollToBottom]);

  // Reset initial scroll flag when conversation changes
  useEffect(() => {
    initialScrollDone.current = false;
  }, [conversationId]);

  // Scroll to bottom when own message arrives
  const prevMsgCount = useRef(currentMessages.length);
  useEffect(() => {
    if (currentMessages.length > prevMsgCount.current) {
      const lastMsg = currentMessages[currentMessages.length - 1];
      const isOwnMessage = lastMsg?.sender?._id === user?._id;
      if (isOwnMessage) {
        scrollToBottom('smooth');
      }
    }
    prevMsgCount.current = currentMessages.length;
  }, [currentMessages.length, user?._id, scrollToBottom]);

  const otherUser = convData?.otherUser;
  const isOnline = useOnlineStatus(otherUser?._id);

  const loadMoreMessages = useCallback(() => {
    if (!isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isFetchingNextPage, fetchNextPage]);

  if (convLoading || messagesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-primary">
        <InlineLoader text="Loading conversation..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      <ChatHeader
        name={otherUser?.fullName || 'Unknown'}
        avatar={otherUser?.avatar}
        username={otherUser?.username}
        isOnline={isOnline}
        userId={otherUser?._id}
        conversationId={conversationId}
        isDM
      />

      <MessageList
        messages={currentMessages}
        currentUserId={user?._id}
        conversationId={conversationId}
        hasMore={hasMore}
        onLoadMore={loadMoreMessages}
        isLoadingMore={isFetchingNextPage}
        bottomRef={bottomRef}
        otherUser={otherUser}
      />

      <MessageInput
        conversationId={conversationId}
        sendMessage={sendMessage}
        isSending={isSending}
        onMessageSent={() => scrollToBottom('smooth')}
      />
    </div>
  );
}
