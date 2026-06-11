import { useCallback, useRef } from 'react';
import { useSocketStore } from '../store/socketStore.js';
import { TYPING_DEBOUNCE_MS } from '../utils/constants.js';

export const useTyping = (conversationId, groupId) => {
  const { socket } = useSocketStore();
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const sendTypingStop = useCallback(() => {
    if (!socket?.connected) return;
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit('typingStop', { conversationId, groupId });
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [socket, conversationId, groupId]);

  const sendTypingStart = useCallback(() => {
    if (!socket?.connected) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typingStart', { conversationId, groupId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop();
    }, TYPING_DEBOUNCE_MS);
  }, [socket, conversationId, groupId, sendTypingStop]);

  const handleInputChange = useCallback(() => {
    sendTypingStart();
  }, [sendTypingStart]);

  const handleBlur = useCallback(() => {
    sendTypingStop();
  }, [sendTypingStop]);

  return { handleInputChange, handleBlur, sendTypingStart, sendTypingStop };
};

export default useTyping;
