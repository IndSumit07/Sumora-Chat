import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, AtSign, MessageSquare } from 'lucide-react';
import authApi from '../../api/auth.api.js';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import toast from 'react-hot-toast';
import { PASSWORD_REGEX, GOOGLE_AUTH_URL } from '../../utils/constants.js';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const labels = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
    const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-accent'];
    return { strength: score, label: labels[score], color: colors[score] };
  };

  const passwordStrength = getPasswordStrength(form.password);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    else if (form.fullName.trim().length < 2) errs.fullName = 'Name must be at least 2 characters';

    if (!form.username.trim()) errs.username = 'Username is required';
    else if (!/^[a-z0-9_]{3,20}$/.test(form.username)) {
      errs.username = '3-20 chars: lowercase letters, numbers, underscores';
    }

    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Invalid email address';

    if (!form.password) errs.password = 'Password is required';
    else if (!PASSWORD_REGEX.test(form.password)) {
      errs.password = 'Min 8 chars with uppercase, lowercase, number, and symbol';
    }

    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await authApi.register({
        fullName: form.fullName.trim(),
        username: form.username.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      toast.success('OTP sent to your email!');
      navigate('/verify-otp', {
        state: { email: form.email.trim().toLowerCase(), purpose: 'register' },
      });
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      const details = err.response?.data?.details;

      if (details?.length > 0) {
        const fieldErrors = {};
        details.forEach((d) => {
          if (d.field) fieldErrors[d.field] = d.message;
        });
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <MessageSquare className="text-accent" size={24} />
          <span className="text-xl font-black gradient-text">Sumora Chat</span>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary">Create your account</h2>
          <p className="text-text-muted mt-1">Join thousands of users chatting securely</p>
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
          <span className="text-xs text-text-muted">or register with email</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            label="Full Name"
            placeholder="John Doe"
            value={form.fullName}
            onChange={handleChange}
            error={errors.fullName}
            leftIcon={User}
            autoComplete="name"
          />

          <Input
            id="username"
            name="username"
            type="text"
            label="Username"
            placeholder="johndoe"
            value={form.username}
            onChange={handleChange}
            error={errors.username}
            leftIcon={AtSign}
            autoComplete="username"
          />

          <Input
            id="email"
            name="email"
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            leftIcon={Mail}
            autoComplete="email"
          />

          <div>
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
              autoComplete="new-password"
            />
            {form.password && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i <= passwordStrength.strength ? passwordStrength.color : 'bg-border'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-2xs text-text-muted mt-1">{passwordStrength.label}</p>
              </div>
            )}
          </div>

          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="••••••••"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            leftIcon={Lock}
            autoComplete="new-password"
          />

          <Button type="submit" className="w-full mt-2" loading={loading}>
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-text-muted mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:text-accent-light font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
