import { create } from 'zustand';
import { io } from 'socket.io-client';
import { useAuthStore } from './authStore.js';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export const useSocketStore = create((set, get) => ({
  socket: null,
  isConnected: false,
  connectionError: null,

  connect: (accessToken) => {
    const existing = get().socket;
    if (existing?.connected) return existing;

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
      timeout: 20000,
    });

    socket.on('connect', () => {
      console.info('[Socket] Connected:', socket.id);
      set({ isConnected: true, connectionError: null });
    });

    socket.on('disconnect', (reason) => {
      console.info('[Socket] Disconnected:', reason);
      set({ isConnected: false });
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      set({ isConnected: false, connectionError: err.message });
    });

    socket.on('reconnect', (attempt) => {
      console.info('[Socket] Reconnected after', attempt, 'attempts');
      set({ isConnected: true, connectionError: null });
    });

    set({ socket });
    return socket;
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  emit: (event, data, callback) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit(event, data, callback);
    }
  },

  on: (event, handler) => {
    const { socket } = get();
    socket?.on(event, handler);
  },

  off: (event, handler) => {
    const { socket } = get();
    socket?.off(event, handler);
  },
}));

export default useSocketStore;
