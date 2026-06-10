import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../../store/chatStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { formatConversationTime, truncate, getMessageStatusIcon } from '../../utils/formatters.js';
import Avatar from '../ui/Avatar.jsx';
import Badge from '../ui/Badge.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { Check, CheckCheck, ImageIcon, Mic, File, Plus } from 'lucide-react';
import { MESSAGE_TYPES, MODAL_TYPES } from '../../utils/constants.js';

export default function GroupList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { groups, activeGroupId, unreadCounts, typingUsers } = useChatStore();
  const { searchQuery, closeMobileSidebar, openModal } = useUIStore();

  const handleGroupClick = (groupId) => {
    navigate(`/group/${groupId}`);
    closeMobileSidebar();
  };

  const filteredGroups = groups.filter((g) => {
    if (!searchQuery) return true;
    return g.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderMessageContent = (msg, currentTypers) => {
    if (currentTypers && currentTypers.length > 0) {
      const names = currentTypers.slice(0, 2).map((u) => u.fullName || u.username).join(', ');
      return <span className="text-accent font-medium">{names} {currentTypers.length > 2 ? '...' : ''} typing...</span>;
    }

    if (!msg) return <span className="text-text-muted italic">No messages yet</span>;

    const senderName = msg.sender?._id === user?._id ? 'You' : (msg.sender?.fullName || msg.sender?.username || 'Unknown');
    const prefix = `${senderName}: `;

    switch (msg.type) {
      case MESSAGE_TYPES.IMAGE:
        return <span className="flex items-center gap-1"><ImageIcon size={12} /> {prefix}Photo</span>;
      case MESSAGE_TYPES.VOICE_NOTE:
        return <span className="flex items-center gap-1"><Mic size={12} /> {prefix}Voice Note</span>;
      case MESSAGE_TYPES.DOCUMENT:
        return <span className="flex items-center gap-1"><File size={12} /> {prefix}Document</span>;
      default:
        return `${prefix}${truncate(msg.content, 35)}`;
    }
  };

  const renderStatusIcon = (msg) => {
    const status = getMessageStatusIcon(msg, user?._id);
    if (!status) return null;
    if (status === 'read') return <CheckCheck size={14} className="text-accent" />;
    if (status === 'delivered') return <CheckCheck size={14} className="text-text-muted" />;
    return <Check size={14} className="text-text-muted" />;
  };

  return (
    <div className="py-2">
      {/* Create Group Button */}
      <div className="px-4 mb-2">
        <button
          onClick={() => openModal(MODAL_TYPES.CREATE_GROUP)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent/10 text-accent font-medium hover:bg-accent/20 transition-colors border border-accent/20 border-dashed"
        >
          <Plus size={18} /> Create New Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="empty-state">
          <div className="w-16 h-16 bg-bg-elevated rounded-full flex items-center justify-center text-3xl mb-4 shadow-elevated">
            👥
          </div>
          <h3 className="text-text-primary font-medium mb-1">No groups yet</h3>
          <p className="text-sm text-text-muted">Create a group to chat with multiple friends.</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="empty-state">
          <p className="text-sm text-text-muted">No groups found matching "{searchQuery}"</p>
        </div>
      ) : (
        filteredGroups.map((group) => {
          const unreadCount = unreadCounts[group._id] || 0;
          const currentTypers = typingUsers[group._id] || [];
          const isActive = activeGroupId === group._id;

          return (
            <div
              key={group._id}
              onClick={() => handleGroupClick(group._id)}
              className={`
                sidebar-item mx-2
                ${isActive ? 'sidebar-item-active' : ''}
              `}
            >
              <Avatar
                src={group.avatar}
                name={group.name}
                size="lg"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-sm font-semibold text-text-primary truncate pr-2">
                    {group.name}
                  </h3>
                  <span className={`text-[10px] flex-shrink-0 ${unreadCount > 0 ? 'text-accent font-medium' : 'text-text-muted'}`}>
                    {formatConversationTime(group.lastMessageAt || group.createdAt)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between gap-2">
                  <div className={`text-xs truncate flex items-center gap-1 flex-1 ${unreadCount > 0 ? 'text-text-primary font-medium' : 'text-text-muted'}`}>
                    {group.lastMessage && currentTypers.length === 0 && renderStatusIcon(group.lastMessage)}
                    {renderMessageContent(group.lastMessage, currentTypers)}
                  </div>
                  {unreadCount > 0 && <Badge count={unreadCount} />}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
