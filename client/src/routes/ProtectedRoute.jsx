import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useEffect } from 'react';
import { useSocketStore } from '../store/socketStore.js';
import { initSocketListeners } from '../socket/socketClient.js';

const ProtectedRoute = () => {
  const { user, accessToken } = useAuthStore();
  const { socket, connect } = useSocketStore();

  useEffect(() => {
    if (user && accessToken && !socket) {
      const s = connect(accessToken);
      initSocketListeners(s);
    }
  }, [user, accessToken, socket, connect]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
