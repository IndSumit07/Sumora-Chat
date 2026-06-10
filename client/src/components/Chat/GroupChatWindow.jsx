import { useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useChatStore } from '../../store/chatStore.js';
import { useAuthStore } from '../../store/authStore.js';
import groupApi from '../../api/group.api.js';
import ChatHeader from './ChatHeader.jsx';
import MessageList from './MessageList.jsx';
import MessageInput from './MessageInput.jsx';
import { InlineLoader } from '../ui/Spinner.jsx';

export default function GroupChatWindow({ groupId }) {
  const { user } = useAuthStore();
  const { setMessages, hasMore, cursors, messages } = useChatStore();
  const bottomRef = useRef(null);
  const isFirstLoad = useRef(true);

  // Fetch group details
  const { data: groupData, isLoading: groupLoading } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const response = await groupApi.getGroup(groupId);
      return response.data.data.group;
    },
    staleTime: 1000 * 60,
  });

  // Fetch initial group messages
  const { isLoading: messagesLoading, isFetchingNextPage, fetchNextPage } = useQuery({
    queryKey: ['groupMessages', groupId],
    queryFn: async ({ pageParam = null }) => {
      const params = { limit: 30 };
      if (pageParam) params.cursor = pageParam;
      const response = await groupApi.getMessages(groupId, params);
      return response.data;
    },
    onSuccess: (data) => {
      if (isFirstLoad.current) {
        const msgs = (data?.data?.messages || []).reverse();
        setMessages(groupId, msgs, data.meta?.cursor, data.meta?.hasMore);
        isFirstLoad.current = false;
        setTimeout(() => scrollToBottom('instant'), 50);
      }
    },
    staleTime: 0,
  });

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  const roomMessages = messages[groupId] || [];
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

  const loadMoreMessages = useCallback(async () => {
    const cursor = cursors[groupId];
    if (!cursor || isFetchingNextPage) return;
    await fetchNextPage({ pageParam: cursor });
  }, [cursors, groupId, isFetchingNextPage, fetchNextPage]);

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
        hasMore={hasMore[groupId]}
        onLoadMore={loadMoreMessages}
        isLoadingMore={isFetchingNextPage}
        bottomRef={bottomRef}
        isGroup={true}
      />

      <MessageInput
        groupId={groupId}
        onMessageSent={() => scrollToBottom('smooth')}
      />
    </div>
  );
}
