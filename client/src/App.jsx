import { Toaster } from 'react-hot-toast';
import AppRouter from './routes/AppRouter.jsx';
import { useAuthStore } from './store/authStore.js';
import { useEffect } from 'react';
import { initSocketListeners } from './socket/socketClient.js';
import { useSocketStore } from './store/socketStore.js';
import ModalRoot from './components/Modals/ModalRoot.jsx';

function App() {
  const { user, accessToken } = useAuthStore();
  const { socket } = useSocketStore();

  useEffect(() => {
    if (user && accessToken && socket) {
      initSocketListeners(socket);
    }
  }, [user, accessToken, socket]);

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
