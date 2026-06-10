import { ArrowLeft, Bell, Lock, Palette, HelpCircle, Trash2, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import Button from '../../components/ui/Button.jsx';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const settingsSections = [
    {
      title: 'Account',
      icon: <UserIcon size={20} className="text-blue-500" />,
      items: [
        { label: 'Edit Profile', action: () => navigate('/profile') },
        { label: 'Privacy', action: () => {} },
      ],
    },
    {
      title: 'Notifications',
      icon: <Bell size={20} className="text-yellow-500" />,
      items: [
        { label: 'Message Notifications', action: () => {} },
        { label: 'Sound Alerts', action: () => {} },
      ],
    },
    {
      title: 'Appearance',
      icon: <Palette size={20} className="text-purple-500" />,
      items: [
        { label: 'Theme (Dark)', action: () => {} },
        { label: 'Chat Wallpaper', action: () => {} },
      ],
    },
    {
      title: 'Security',
      icon: <Lock size={20} className="text-green-500" />,
      items: [
        { label: 'Two-Step Verification', action: () => {} },
        { label: 'Change Password', action: () => {} },
      ],
    },
    {
      title: 'Help',
      icon: <HelpCircle size={20} className="text-accent" />,
      items: [
        { label: 'FAQ', action: () => {} },
        { label: 'Contact Support', action: () => {} },
      ],
    },
  ];

  return (
    <div className="layout-container bg-bg-primary">
      <div className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8 overflow-y-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="btn-icon">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        </div>

        <div className="space-y-6 animate-fade-in-up">
          {settingsSections.map((section) => (
            <div key={section.title} className="bg-bg-sidebar border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-6 py-4 bg-bg-elevated border-b border-border">
                {section.icon}
                <h2 className="text-base font-semibold text-text-primary">{section.title}</h2>
              </div>
              <div className="divide-y divide-border">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-bg-hover transition-colors text-sm text-text-primary text-left"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Danger Zone */}
          <div className="bg-bg-sidebar border border-danger/30 rounded-2xl overflow-hidden shadow-sm mt-8">
            <div className="flex items-center gap-3 px-6 py-4 bg-danger/10 border-b border-danger/30">
              <ShieldAlert size={20} className="text-danger" />
              <h2 className="text-base font-semibold text-danger">Danger Zone</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-text-muted mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button variant="danger" className="w-full sm:w-auto">
                <Trash2 size={16} className="mr-2" /> Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple internal icon for Account section
function UserIcon({ size, className }) {
  return (
    <svg 
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" 
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
