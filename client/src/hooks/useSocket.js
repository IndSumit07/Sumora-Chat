import { useEffect } from 'react';
import { useSocketStore } from '../store/socketStore.js';
import { useAuthStore } from '../store/authStore.js';
import { initSocketListeners } from '../socket/socketClient.js';

export const useSocket = () => {
  const { socket, connect, disconnect, isConnected, connectionError } = useSocketStore();
  const { accessToken, user } = useAuthStore();

  useEffect(() => {
    if (user && accessToken && !socket) {
      const s = connect(accessToken);
      initSocketListeners(s);
    }

    return () => {
      // Don't disconnect on re-render — only on unmount of root component
    };
  }, [user, accessToken]);

  const emit = (event, data, callback) => {
    if (socket?.connected) {
      socket.emit(event, data, callback);
    }
  };

  return { socket, isConnected, connectionError, emit };
};

export default useSocket;
