import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import authApi from '../../api/auth.api.js';
import { PageLoader } from '../../components/ui/Spinner.jsx';
import toast from 'react-hot-toast';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Google authentication failed. Please try again.');
      navigate('/login');
      return;
    }

    if (!token) {
      toast.error('No authentication token received.');
      navigate('/login');
      return;
    }

    // Store access token, then fetch user profile
    const fetchUser = async () => {
      try {
        // Temporarily set the token so the API call can use it
        useAuthStore.getState().setAccessToken(token);

        const response = await authApi.getMe();
        const { user } = response.data.data;

        login(user, token);
        toast.success('Welcome to Sumora! 🎉');
        navigate('/');
      } catch (err) {
        toast.error('Failed to load profile. Please try again.');
        navigate('/login');
      }
    };

    fetchUser();
  }, [searchParams, navigate, login]);

  return <PageLoader />;
}
