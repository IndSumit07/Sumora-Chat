import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import authApi from '../../api/auth.api.js';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import toast from 'react-hot-toast';
import { GOOGLE_AUTH_URL } from '../../utils/constants.js';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.identifier.trim()) errs.identifier = 'Email or username is required';
    if (!form.password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await authApi.login({
        identifier: form.identifier.trim(),
        password: form.password,
      });

      const { user, accessToken } = response.data.data;
      login(user, accessToken);
      toast.success('Welcome back! 👋');
      navigate('/');
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      const code = err.response?.data?.code;

      if (code === 'NOT_VERIFIED') {
        toast.error(message);
        navigate('/verify-otp', { state: { email: form.identifier, purpose: 'register' } });
        return;
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex w-1/2 bg-bg-secondary flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent-dark/10 rounded-full blur-3xl" />

        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center">
              <MessageSquare className="text-accent" size={28} />
            </div>
            <h1 className="text-3xl font-black gradient-text">Sumora</h1>
          </div>
          <p className="text-text-secondary text-lg max-w-sm leading-relaxed">
            Secure. Real-time. Beautiful. Connect with friends and groups through encrypted messaging.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4 text-left">
            {[
              { icon: '🔒', title: 'End-to-End Encrypted', desc: 'AES-256 message encryption' },
              { icon: '⚡', title: 'Real-time', desc: 'Instant message delivery' },
              { icon: '📁', title: 'File Sharing', desc: 'Images, documents, voice notes' },
              { icon: '👥', title: 'Group Chats', desc: 'Up to 500 members per group' },
            ].map((feature) => (
              <div key={feature.title} className="bg-bg-elevated border border-border rounded-xl p-4">
                <div className="text-2xl mb-2">{feature.icon}</div>
                <div className="text-sm font-semibold text-text-primary">{feature.title}</div>
                <div className="text-xs text-text-muted mt-0.5">{feature.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <MessageSquare className="text-accent" size={24} />
            <span className="text-xl font-black gradient-text">Sumora Chat</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary">Welcome back</h2>
            <p className="text-text-muted mt-1">Sign in to continue your conversations</p>
          </div>

          {/* Google OAuth */}
          <a
            href={GOOGLE_AUTH_URL}
            className="w-full flex items-center justify-center gap-3 bg-bg-elevated border border-border rounded-xl px-6 py-3 text-text-primary font-medium hover:bg-bg-hover transition-colors duration-200 mb-6"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted">or sign in with email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="identifier"
              name="identifier"
              type="text"
              label="Email or Username"
              placeholder="you@example.com or @username"
              value={form.identifier}
              onChange={handleChange}
              error={errors.identifier}
              leftIcon={Mail}
              autoComplete="username"
            />

            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              leftIcon={Lock}
              rightIcon={showPassword ? EyeOff : Eye}
              onRightIconClick={() => setShowPassword((v) => !v)}
              autoComplete="current-password"
            />

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-accent hover:text-accent-light transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              loading={loading}
              size="md"
            >
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-text-muted mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent hover:text-accent-light font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
