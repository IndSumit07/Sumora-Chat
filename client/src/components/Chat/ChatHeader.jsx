import { Phone, Video, MoreVertical, ArrowLeft, Info } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import { useUIStore } from '../../store/uiStore.js';
import { formatLastSeen } from '../../utils/formatters.js';
import { useChatStore } from '../../store/chatStore.js';

export default function ChatHeader({
  name,
  avatar,
  username,
  isOnline,
  userId,
  conversationId,
  groupId,
  isDM = true,
  memberCount,
  typingUsers = [],
}) {
  const { toggleInfoPanel, closeMobileSidebar, toggleMobileSidebar } = useUIStore();
  const { clearActive } = useChatStore();

  const roomId = conversationId || groupId;
  const currentTypers = useChatStore((s) => s.typingUsers[roomId] || []);

  const handleBack = () => {
    clearActive();
    toggleMobileSidebar();
  };

  const subtitle = () => {
    if (currentTypers.length > 0) {
      if (isDM) return 'typing...';
      const names = currentTypers.slice(0, 2).map((u) => u.fullName || u.username).join(', ');
      return `${names} ${currentTypers.length > 2 ? `and ${currentTypers.length - 2} more` : ''} typing...`;
    }

    if (isDM) {
      return isOnline ? 'Online' : 'Offline';
    }

    return `${memberCount || 0} members`;
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-bg-sidebar border-b border-border flex-shrink-0">
      {/* Back button (mobile) */}
      <button
        onClick={handleBack}
        className="md:hidden btn-icon flex-shrink-0 -ml-1"
        aria-label="Back"
      >
        <ArrowLeft size={20} />
      </button>

      {/* Avatar + name */}
      <div
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
        onClick={toggleInfoPanel}
      >
        <Avatar
          src={avatar}
          name={name}
          size="md"
          isOnline={isDM ? isOnline : undefined}
        />
        <div className="min-w-0">
          <div className="font-semibold text-text-primary truncate text-base leading-tight">
            {name}
          </div>
          <div
            className={`text-xs truncate transition-colors ${
              currentTypers.length > 0 ? 'text-accent animate-pulse' : 'text-text-muted'
            }`}
          >
            {subtitle()}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button className="btn-icon" aria-label="Voice call" title="Voice call">
          <Phone size={18} />
        </button>
        <button className="btn-icon" aria-label="Video call" title="Video call">
          <Video size={18} />
        </button>
        <button
          className="btn-icon"
          onClick={toggleInfoPanel}
          aria-label="Info"
          title="Conversation info"
        >
          <Info size={18} />
        </button>
      </div>
    </div>
  );
}
