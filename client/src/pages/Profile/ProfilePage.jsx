import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import authApi from '../../api/auth.api.js';
import uploadApi from '../../api/upload.api.js';
import Avatar from '../../components/ui/Avatar.jsx';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { Camera, ArrowLeft, Mail, AtSign, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    bio: user?.bio || '',
  });
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar must be less than 5MB');
      return;
    }

    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadApi.uploadAvatar(formData);
      updateUser({ avatar: res.data.data.url });
      toast.success('Avatar updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Do nothing for now
  };

  return (
    <div className="layout-container bg-bg-primary">
      <div className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8 overflow-y-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="btn-icon">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-text-primary">Profile</h1>
        </div>

        <div className="bg-bg-sidebar border border-border rounded-2xl p-6 md:p-8 animate-fade-in-up">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8 pb-8 border-b border-border">
            <div className="relative group mb-4">
              <Avatar src={user?.avatar} name={user?.fullName} size="2xl" className="shadow-lg" />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
              >
                {avatarLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="text-white" size={24} />
                )}
              </button>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleAvatarChange} />
            </div>
            <h2 className="text-xl font-bold text-text-primary">{user?.fullName}</h2>
            <p className="text-text-muted mt-1">@{user?.username}</p>
          </div>

          {/* Details Section */}
          <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
            <div className="space-y-4">
              <Input
                label="Email"
                value={user?.email}
                leftIcon={Mail}
                disabled
                hint="Email address cannot be changed"
              />
              <Input
                label="Username"
                value={user?.username}
                leftIcon={AtSign}
                disabled
                hint="Username cannot be changed"
              />
            </div>

            <div className="pt-4 space-y-4 border-t border-border opacity-60">
              <Input
                name="fullName"
                label="Full Name"
                value={form.fullName}
                onChange={handleChange}
                leftIcon={User}
                disabled
                hint="Name changes coming soon"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">Bio</label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  className="input min-h-[100px] resize-none"
                  placeholder="Tell people about yourself..."
                  disabled
                />
              </div>
            </div>

            <Button type="button" className="w-full" disabled>
              Save Changes (Coming Soon)
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
