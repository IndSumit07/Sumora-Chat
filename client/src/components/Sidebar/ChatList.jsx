import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../../store/chatStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { formatConversationTime, truncate, getMessageStatusIcon } from '../../utils/formatters.js';
import { useOnlineStatusMap } from '../../hooks/useOnlineStatus.js';
import Avatar from '../ui/Avatar.jsx';
import Badge from '../ui/Badge.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { Check, CheckCheck, ImageIcon, Mic, File } from 'lucide-react';
import { MESSAGE_TYPES } from '../../utils/constants.js';

export default function ChatList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { conversations, activeConversationId, unreadCounts, typingUsers } = useChatStore();
  const { searchQuery, closeMobileSidebar } = useUIStore();

  const handleChatClick = (conversationId) => {
    navigate(`/chat/${conversationId}`);
    closeMobileSidebar();
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery) return true;
    return c.otherUser?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           c.otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const onlineStatuses = useOnlineStatusMap(
    filteredConversations.map(c => c.otherUser?._id).filter(Boolean)
  );

  const renderMessageContent = (msg, isTyping) => {
    if (isTyping) {
      return <span className="text-accent font-medium">typing...</span>;
    }

    if (!msg) return <span className="text-text-muted italic">No messages yet</span>;

    const prefix = msg.sender?._id === user?._id ? 'You: ' : '';

    switch (msg.type) {
      case MESSAGE_TYPES.IMAGE:
        return <span className="flex items-center gap-1"><ImageIcon size={12} /> {prefix}Photo</span>;
      case MESSAGE_TYPES.VOICE_NOTE:
        return <span className="flex items-center gap-1"><Mic size={12} /> {prefix}Voice Note</span>;
      case MESSAGE_TYPES.DOCUMENT:
        return <span className="flex items-center gap-1"><File size={12} /> {prefix}Document</span>;
      default:
        return `${prefix}${truncate(msg.content, 40)}`;
    }
  };

  const renderStatusIcon = (msg) => {
    const status = getMessageStatusIcon(msg, user?._id);
    if (!status) return null;
    
    if (status === 'read') return <CheckCheck size={14} className="text-accent" />;
    if (status === 'delivered') return <CheckCheck size={14} className="text-text-muted" />;
    return <Check size={14} className="text-text-muted" />;
  };

  if (conversations.length === 0) {
    return (
      <div className="empty-state">
        <div className="w-16 h-16 bg-bg-elevated rounded-full flex items-center justify-center text-3xl mb-4 shadow-elevated">
          💬
        </div>
        <h3 className="text-text-primary font-medium mb-1">No chats yet</h3>
        <p className="text-sm text-text-muted">Start a conversation from your friends list.</p>
      </div>
    );
  }

  if (filteredConversations.length === 0) {
    return (
      <div className="empty-state">
        <p className="text-sm text-text-muted">No chats found matching "{searchQuery}"</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      {filteredConversations.map((conv) => {
        const otherUser = conv.otherUser;
        const unreadCount = unreadCounts[conv._id] || 0;
        const isOnline = onlineStatuses[otherUser?._id];
        const isTyping = (typingUsers[conv._id] || []).length > 0;
        const isActive = activeConversationId === conv._id;

        return (
          <div
            key={conv._id}
            onClick={() => handleChatClick(conv._id)}
            className={`
              sidebar-item mx-2
              ${isActive ? 'sidebar-item-active' : ''}
            `}
          >
            <Avatar
              src={otherUser?.avatar}
              name={otherUser?.fullName}
              isOnline={isOnline}
              size="lg"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h3 className="text-sm font-semibold text-text-primary truncate pr-2">
                  {otherUser?.fullName}
                </h3>
                <span className={`text-[10px] flex-shrink-0 ${unreadCount > 0 ? 'text-accent font-medium' : 'text-text-muted'}`}>
                  {formatConversationTime(conv.lastMessageAt || conv.createdAt)}
                </span>
              </div>
              
              <div className="flex items-center justify-between gap-2">
                <div className={`text-xs truncate flex items-center gap-1 flex-1 ${unreadCount > 0 ? 'text-text-primary font-medium' : 'text-text-muted'}`}>
                  {conv.lastMessage && !isTyping && renderStatusIcon(conv.lastMessage)}
                  {renderMessageContent(conv.lastMessage, isTyping)}
                </div>
                {unreadCount > 0 && <Badge count={unreadCount} />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
