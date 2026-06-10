import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import { useAuthStore } from '../store/authStore.js';
import { lazy, Suspense } from 'react';
import { PageLoader } from '../components/ui/Spinner.jsx';

// Lazy-loaded pages for code splitting
const Login = lazy(() => import('../pages/Auth/Login.jsx'));
const Register = lazy(() => import('../pages/Auth/Register.jsx'));
const OTPVerify = lazy(() => import('../pages/Auth/OTPVerify.jsx'));
const ForgotPassword = lazy(() => import('../pages/Auth/ForgotPassword.jsx'));
const GoogleCallback = lazy(() => import('../pages/Auth/GoogleCallback.jsx'));
const ChatPage = lazy(() => import('../pages/Chat/ChatPage.jsx'));
const GroupChatPage = lazy(() => import('../pages/Chat/GroupChatPage.jsx'));
const ProfilePage = lazy(() => import('../pages/Profile/ProfilePage.jsx'));
const SettingsPage = lazy(() => import('../pages/Settings/SettingsPage.jsx'));

const AppRouter = () => {
  const { user } = useAuthStore();

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/" replace /> : <Register />}
          />
          <Route path="/verify-otp" element={<OTPVerify />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<ChatPage />} />
            <Route path="/chat/:conversationId" element={<ChatPage />} />
            <Route path="/group/:groupId" element={<GroupChatPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
