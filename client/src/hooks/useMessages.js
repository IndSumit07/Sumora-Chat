import { useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useChatStore } from '../store/chatStore.js';
import messageApi from '../api/message.api.js';
import groupApi from '../api/group.api.js';
import toast from 'react-hot-toast';

export const useMessages = ({ conversationId, groupId, limit = 30 }) => {
  const roomId = conversationId || groupId;
  const isGroup = !!groupId;
  const chatStore = useChatStore();
  const queryClient = useQueryClient();

  const fetchMessages = async ({ pageParam = null }) => {
    const params = { limit };
    if (pageParam) params.cursor = pageParam;

    const response = isGroup
      ? await groupApi.getMessages(groupId, params)
      : await messageApi.getMessages(conversationId, params);

    return response.data;
  };

  const query = useInfiniteQuery({
    queryKey: ['messages', roomId],
    queryFn: fetchMessages,
    getNextPageParam: (lastPage) => lastPage.meta?.cursor || undefined,
    enabled: !!roomId,
    staleTime: 0,
    // Refetch on mount so messages always load after navigation/refresh
    refetchOnMount: true,
  });

  const { data, isFetchingNextPage, hasNextPage, fetchNextPage } = query;

  // Sync query data → Zustand store whenever data changes.
  // This replaces the broken isFirstLoad pattern. Every time React Query
  // has data (fresh fetch, cache hit, or page append), we flatten all pages
  // and push them into the store.
  useEffect(() => {
    if (data) {
      const allMessages = data.pages
        .flatMap((p) => p.data?.messages || [])
        .reverse();
      const lastPage = data.pages[data.pages.length - 1];
      chatStore.setMessages(
        roomId,
        allMessages,
        lastPage.meta?.cursor,
        lastPage.meta?.hasMore
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, roomId]);

  const sendMessageMutation = useMutation({
    mutationFn: (messageData) => {
      if (isGroup) return groupApi.sendMessage(groupId, messageData);
      return messageApi.sendMessage(conversationId, messageData);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to send message');
    },
  });

  const editMessageMutation = useMutation({
    mutationFn: ({ messageId, content }) => messageApi.editMessage(messageId, { content }),
    onSuccess: (response, { messageId }) => {
      chatStore.updateMessage(roomId, messageId, response.data.data.message);
    },
    onError: () => toast.error('Failed to edit message'),
  });

  const deleteMessageMutation = useMutation({
    mutationFn: ({ messageId, deleteFor }) =>
      messageApi.deleteMessage(messageId, { deleteFor }),
    onSuccess: (_, { messageId, deleteFor }) => {
      if (deleteFor === 'everyone') {
        chatStore.deleteMessageFromState(roomId, messageId);
      }
    },
    onError: () => toast.error('Failed to delete message'),
  });

  const reactMutation = useMutation({
    mutationFn: ({ messageId, emoji }) => messageApi.reactToMessage(messageId, { emoji }),
    onSuccess: (response, { messageId }) => {
      chatStore.updateReactions(roomId, messageId, response.data.data.reactions);
    },
  });

  return {
    query,
    messages: chatStore.messages[roomId] || [],
    hasMore: chatStore.hasMore[roomId],
    // Expose infinite query pagination for parent components
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: query.isLoading,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    editMessage: editMessageMutation.mutate,
    deleteMessage: deleteMessageMutation.mutate,
    reactToMessage: reactMutation.mutate,
  };
};

export default useMessages;
