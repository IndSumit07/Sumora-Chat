import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, RefreshCw } from 'lucide-react';
import authApi from '../../api/auth.api.js';
import { useAuthStore } from '../../store/authStore.js';
import Button from '../../components/ui/Button.jsx';
import toast from 'react-hot-toast';

export default function OTPVerify() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const { email, purpose = 'register' } = location.state || {};
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) navigate('/register');
    inputRefs.current[0]?.focus();
  }, [email, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (digit && index === 5 && newOtp.every(Boolean)) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  };

  const handleVerify = async (otpCode) => {
    setLoading(true);
    try {
      if (purpose === 'register') {
        const response = await authApi.verifyRegister({ email, otp: otpCode });
        const { user, accessToken } = response.data.data;
        login(user, accessToken);
        toast.success('Account created! Welcome to Sumora 🎉');
        navigate('/');
      } else if (purpose === 'reset') {
        const response = await authApi.verifyResetOtp({ email, otp: otpCode });
        const { resetToken } = response.data.data;
        toast.success('OTP verified!');
        navigate('/reset-password', { state: { resetToken, email } });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }
    handleVerify(otpCode);
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setCountdown(60);
      toast.success('New OTP sent to your email');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch {
      toast.error('Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in-up text-center">
        <div className="flex items-center justify-center gap-2 mb-10">
          <MessageSquare className="text-accent" size={24} />
          <span className="text-xl font-black gradient-text">Sumora Chat</span>
        </div>

        <div className="w-16 h-16 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">📧</span>
        </div>

        <h2 className="text-2xl font-bold text-text-primary mb-2">Check your email</h2>
        <p className="text-text-muted mb-2">We sent a 6-digit code to</p>
        <p className="text-accent font-medium mb-8">{email}</p>

        <form onSubmit={handleSubmit}>
          <div className="flex gap-3 justify-center mb-8" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`otp-input ${digit ? 'filled' : ''}`}
                aria-label={`OTP digit ${i + 1}`}
              />
            ))}
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            Verify Code
          </Button>
        </form>

        <div className="mt-6">
          {countdown > 0 ? (
            <p className="text-sm text-text-muted">
              Resend code in <span className="text-accent font-medium">{countdown}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="flex items-center gap-2 text-sm text-accent hover:text-accent-light transition-colors mx-auto disabled:opacity-50"
            >
              <RefreshCw size={14} className={resendLoading ? 'animate-spin' : ''} />
              Resend code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
