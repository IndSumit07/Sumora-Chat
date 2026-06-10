import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useSocketStore } from './socketStore.js';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,

      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => set({ accessToken }),

      login: (user, accessToken) => {
        set({ user, accessToken });
      },

      logout: () => {
        set({ user: null, accessToken: null });
        // Disconnect socket
        useSocketStore.getState().disconnect();
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      isAuthenticated: () => {
        const { user, accessToken } = get();
        return !!(user && accessToken);
      },
    }),
    {
      name: 'sumora-auth',
      storage: createJSONStorage(() => sessionStorage), // Session only — not localStorage
      partialize: (state) => ({
        // Only persist user, NOT accessToken (it's kept in memory for security)
        user: state.user,
      }),
    }
  )
);

export default useAuthStore;
