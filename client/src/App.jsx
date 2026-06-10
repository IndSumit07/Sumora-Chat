import { Toaster } from 'react-hot-toast';
import AppRouter from './routes/AppRouter.jsx';
import { useAuthStore } from './store/authStore.js';
import { useEffect, useState } from 'react';
import { initSocketListeners } from './socket/socketClient.js';
import { useSocketStore } from './store/socketStore.js';
import ModalRoot from './components/Modals/ModalRoot.jsx';
import authApi from './api/auth.api.js';
import { PageLoader } from './components/ui/Spinner.jsx';

function App() {
  const { user, accessToken, setAccessToken, logout } = useAuthStore();
  const { socket } = useSocketStore();
  // Track whether the initial session restoration attempt has completed
  const [sessionRestored, setSessionRestored] = useState(false);

  // On mount: if user exists in storage but no access token, try to restore session
  // via the httpOnly refresh token cookie
  useEffect(() => {
    const restoreSession = async () => {
      if (user && !accessToken) {
        try {
          const response = await authApi.refresh();
          const { accessToken: newToken } = response.data.data;
          setAccessToken(newToken);
        } catch {
          // Refresh token is expired or invalid — log the user out cleanly
          logout();
        }
      }
      setSessionRestored(true);
    };

    restoreSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    if (user && accessToken && socket) {
      initSocketListeners(socket);
    }
  }, [user, accessToken, socket]);

  // Don't render routes until we've attempted session restoration.
  // This prevents a flash of the login page for authenticated users.
  if (!sessionRestored) {
    return <PageLoader />;
  }

  return (
    <>
      <AppRouter />
      <ModalRoot />
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a2332',
            color: '#f1f5f9',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            padding: '12px 16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          },
          success: {
            iconTheme: { primary: '#25d366', secondary: '#0a0f14' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </>
  );
}

export default App;

