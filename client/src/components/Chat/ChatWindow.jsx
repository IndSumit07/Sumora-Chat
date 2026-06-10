import { useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useChatStore } from '../../store/chatStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';
import conversationApi from '../../api/conversation.api.js';
import ChatHeader from './ChatHeader.jsx';
import MessageList from './MessageList.jsx';
import MessageInput from './MessageInput.jsx';
import { InlineLoader } from '../ui/Spinner.jsx';
import messageApi from '../../api/message.api.js';

export default function ChatWindow({ conversationId }) {
  const { user } = useAuthStore();
  const { setMessages, hasMore, cursors, messages } = useChatStore();
  const bottomRef = useRef(null);
  const isFirstLoad = useRef(true);

  // Fetch conversation details
  const { data: convData, isLoading: convLoading } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const response = await conversationApi.getConversation(conversationId);
      return response.data.data.conversation;
    },
    staleTime: 1000 * 60,
  });

  // Fetch initial messages
  const { isLoading: messagesLoading, isFetchingNextPage, fetchNextPage } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam = null }) => {
      const params = { limit: 30 };
      if (pageParam) params.cursor = pageParam;
      const response = await messageApi.getMessages(conversationId, params);
      return response.data;
    },
    onSuccess: (data) => {
      if (isFirstLoad.current) {
        const msgs = (data?.data?.messages || []).reverse();
        setMessages(conversationId, msgs, data.meta?.cursor, data.meta?.hasMore);
        isFirstLoad.current = false;
        // Scroll to bottom on initial load
        setTimeout(() => scrollToBottom('instant'), 50);
      }
    },
    staleTime: 0,
  });

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  // Scroll to bottom when new message arrives
  const roomMessages = messages[conversationId] || [];
  const prevMsgCount = useRef(roomMessages.length);

  useEffect(() => {
    if (roomMessages.length > prevMsgCount.current) {
      const lastMsg = roomMessages[roomMessages.length - 1];
      const isOwnMessage = lastMsg?.sender?._id === user?._id;
      if (isOwnMessage) {
        scrollToBottom('smooth');
      }
      prevMsgCount.current = roomMessages.length;
    }
  }, [roomMessages.length, user?._id, scrollToBottom]);

  const otherUser = convData?.otherUser;
  const isOnline = useOnlineStatus(otherUser?._id);

  const loadMoreMessages = useCallback(async () => {
    const cursor = cursors[conversationId];
    if (!cursor || isFetchingNextPage) return;
    await fetchNextPage({ pageParam: cursor });
  }, [cursors, conversationId, isFetchingNextPage, fetchNextPage]);

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
        messages={roomMessages}
        currentUserId={user?._id}
        conversationId={conversationId}
        hasMore={hasMore[conversationId]}
        onLoadMore={loadMoreMessages}
        isLoadingMore={isFetchingNextPage}
        bottomRef={bottomRef}
        otherUser={otherUser}
      />

      <MessageInput
        conversationId={conversationId}
        onMessageSent={() => scrollToBottom('smooth')}
      />
    </div>
  );
}
