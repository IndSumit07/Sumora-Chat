import { useUIStore } from '../store/uiStore.js';

export const useOnlineStatus = (userId) => {
  const onlineUsers = useUIStore((state) => state.onlineUsers);
  return userId ? onlineUsers[userId] === true : false;
};

export const useOnlineStatusMap = (userIds) => {
  const onlineUsers = useUIStore((state) => state.onlineUsers);
  const statusMap = {};
  for (const uid of (userIds ?? [])) {
    statusMap[uid] = onlineUsers[uid] === true;
  }
  return statusMap;
};

export default useOnlineStatus;
