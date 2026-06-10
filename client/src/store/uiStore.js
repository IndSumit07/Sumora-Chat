import { create } from 'zustand';

export const useUIStore = create((set) => ({
  // Sidebar
  sidebarTab: 'chats', // 'chats' | 'groups' | 'friends' | 'notifications'
  isMobileSidebarOpen: false,

  // Modal states
  activeModal: null, // 'createGroup' | 'addFriend' | 'profile' | 'groupInfo' | 'mediaPreview'
  modalData: null,

  // Media preview
  mediaPreview: null, // { url, type, name }

  // Info panel
  isInfoPanelOpen: false,

  // Search
  searchQuery: '',

  // Online users map (userId -> bool)
  onlineUsers: {},

  // Actions
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  toggleMobileSidebar: () => set((s) => ({ isMobileSidebarOpen: !s.isMobileSidebarOpen })),
  closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),

  openModal: (modal, data = null) => set({ activeModal: modal, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  openMediaPreview: (media) => set({ mediaPreview: media }),
  closeMediaPreview: () => set({ mediaPreview: null }),

  toggleInfoPanel: () => set((s) => ({ isInfoPanelOpen: !s.isInfoPanelOpen })),
  closeInfoPanel: () => set({ isInfoPanelOpen: false }),

  setSearchQuery: (q) => set({ searchQuery: q }),

  setUserOnline: (userId, isOnline) =>
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [userId]: isOnline },
    })),

  setOnlineUsers: (usersMap) =>
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, ...usersMap },
    })),

  isUserOnline: (userId) => (state) => state.onlineUsers[userId] === true,
}));

export default useUIStore;
