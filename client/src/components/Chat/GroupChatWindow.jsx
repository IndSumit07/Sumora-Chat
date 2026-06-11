import { useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useChatStore } from '../../store/chatStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { useMessages } from '../../hooks/useMessages.js';
import groupApi from '../../api/group.api.js';
import ChatHeader from './ChatHeader.jsx';
import MessageList from './MessageList.jsx';
import MessageInput from './MessageInput.jsx';
import { InlineLoader } from '../ui/Spinner.jsx';

export default function GroupChatWindow({ groupId }) {
  const { user } = useAuthStore();
  const { messages: allMessages } = useChatStore();
  const bottomRef = useRef(null);

  // Fetch group details
  const { data: groupData, isLoading: groupLoading } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const response = await groupApi.getGroup(groupId);
      return response.data.data.group;
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
  } = useMessages({ groupId });

  const roomMessages = allMessages[groupId] || [];

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  // Scroll to bottom on initial load
  const initialScrollDone = useRef(false);
  useEffect(() => {
    if (roomMessages.length > 0 && !initialScrollDone.current) {
      initialScrollDone.current = true;
      setTimeout(() => scrollToBottom('instant'), 50);
    }
  }, [roomMessages.length, scrollToBottom]);

  // Reset initial scroll flag when group changes
  useEffect(() => {
    initialScrollDone.current = false;
  }, [groupId]);

  // Scroll to bottom when own message arrives
  const prevMsgCount = useRef(roomMessages.length);
  useEffect(() => {
    if (roomMessages.length > prevMsgCount.current) {
      const lastMsg = roomMessages[roomMessages.length - 1];
      const isOwnMessage = lastMsg?.sender?._id === user?._id;
      if (isOwnMessage) {
        scrollToBottom('smooth');
      }
    }
    prevMsgCount.current = roomMessages.length;
  }, [roomMessages.length, user?._id, scrollToBottom]);

  const loadMoreMessages = useCallback(() => {
    if (!isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isFetchingNextPage, fetchNextPage]);

  if (groupLoading || messagesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-primary">
        <InlineLoader text="Loading group..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      <ChatHeader
        name={groupData?.name || 'Group Chat'}
        avatar={groupData?.avatar}
        groupId={groupId}
        isDM={false}
        memberCount={groupData?.members?.length || 0}
      />

      <MessageList
        messages={roomMessages}
        currentUserId={user?._id}
        groupId={groupId}
        hasMore={hasMore}
        onLoadMore={loadMoreMessages}
        isLoadingMore={isFetchingNextPage}
        bottomRef={bottomRef}
        isGroup={true}
      />

      <MessageInput
        groupId={groupId}
        sendMessage={sendMessage}
        isSending={isSending}
        onMessageSent={() => scrollToBottom('smooth')}
      />
    </div>
  );
}
