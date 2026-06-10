import { MessageSquare, Users, UserPlus } from 'lucide-react';
import { useUIStore } from '../../store/uiStore.js';
import { MODAL_TYPES } from '../../utils/constants.js';

export default function EmptyChat() {
  const { openModal } = useUIStore();

  return (
    <div className="flex-1 flex items-center justify-center bg-bg-primary relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-accent-dark/5 rounded-full blur-3xl" />

      <div className="relative z-10 text-center px-8 max-w-md animate-fade-in-up">
        {/* Icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-24 h-24 bg-accent/10 border border-accent/20 rounded-3xl flex items-center justify-center shadow-glow-accent-sm">
            <MessageSquare className="text-accent" size={40} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-3">
          Welcome to Sumora Chat
        </h1>
        <p className="text-text-muted leading-relaxed mb-8">
          Send encrypted messages, share files, create groups, and stay connected with friends in real-time.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => openModal(MODAL_TYPES.ADD_FRIEND)}
            className="flex items-center gap-2 btn-primary"
          >
            <UserPlus size={16} />
            Add a Friend
          </button>
          <button
            onClick={() => openModal(MODAL_TYPES.CREATE_GROUP)}
            className="flex items-center gap-2 btn-secondary"
          >
            <Users size={16} />
            Create Group
          </button>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-4 text-center">
          {[
            { emoji: '🔒', label: 'Encrypted' },
            { emoji: '⚡', label: 'Real-time' },
            { emoji: '📁', label: 'File sharing' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2">
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-xs text-text-muted">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
