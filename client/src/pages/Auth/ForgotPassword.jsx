import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, MessageSquare } from 'lucide-react';
import authApi from '../../api/auth.api.js';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword({ email: email.trim().toLowerCase() });
      setSent(true);
      toast.success('OTP sent to your email!');
    } catch (err) {
      // Don't reveal if email exists
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigate('/verify-otp', {
      state: { email: email.trim().toLowerCase(), purpose: 'reset' },
    });
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="flex items-center gap-2 mb-10">
          <MessageSquare className="text-accent" size={24} />
          <span className="text-xl font-black gradient-text">Sumora Chat</span>
        </div>

        {!sent ? (
          <>
            <Link
              to="/login"
              className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
            >
              <ArrowLeft size={14} /> Back to login
            </Link>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-text-primary">Reset your password</h2>
              <p className="text-text-muted mt-1">
                Enter your email and we'll send you a verification code.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="email"
                name="email"
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={Mail}
                autoComplete="email"
              />

              <Button type="submit" className="w-full mt-2" loading={loading}>
                Send OTP
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">📬</span>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Check your email</h2>
            <p className="text-text-muted mb-2">
              If an account exists for <span className="text-accent">{email}</span>,
              we've sent a reset code.
            </p>
            <Button onClick={handleContinue} className="w-full mt-6">
              Enter OTP
            </Button>
            <button
              onClick={() => setSent(false)}
              className="mt-4 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
