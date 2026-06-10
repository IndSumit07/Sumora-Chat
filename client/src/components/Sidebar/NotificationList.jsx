import { useNotifications } from '../../hooks/useNotifications.js';
import { useUIStore } from '../../store/uiStore.js';
import { formatRelativeTime } from '../../utils/formatters.js';
import Avatar from '../ui/Avatar.jsx';
import { Check, CheckCheck, Trash2, UserPlus, Users, Bell } from 'lucide-react';
import { InlineLoader } from '../ui/Spinner.jsx';

export default function NotificationList() {
  const { notifications, unreadCount, isLoading, markRead, deleteNotification, markAllRead } = useNotifications();
  const { searchQuery } = useUIStore();

  const filteredNotifications = notifications.filter((n) => {
    if (!searchQuery) return true;
    return n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           n.body.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getIcon = (type) => {
    switch (type) {
      case 'FRIEND_REQUEST': return <UserPlus size={16} className="text-blue-500" />;
      case 'FRIEND_ACCEPTED': return <CheckCheck size={16} className="text-accent" />;
      case 'ADDED_TO_GROUP': return <Users size={16} className="text-purple-500" />;
      default: return <Bell size={16} className="text-text-muted" />;
    }
  };

  if (isLoading && notifications.length === 0) {
    return <InlineLoader text="Loading notifications..." />;
  }

  return (
    <div className="py-2">
      <div className="px-4 mb-2 flex items-center justify-between">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
          Alerts 
          {unreadCount > 0 && (
            <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </h3>
        
        {unreadCount > 0 && (
          <button 
            onClick={() => markAllRead()}
            className="text-xs text-accent hover:text-accent-light font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="w-16 h-16 bg-bg-elevated rounded-full flex items-center justify-center text-3xl mb-4 shadow-elevated text-text-muted">
            <Bell size={32} />
          </div>
          <h3 className="text-text-primary font-medium mb-1">All caught up!</h3>
          <p className="text-sm text-text-muted">You have no new notifications.</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="empty-state">
          <p className="text-sm text-text-muted">No notifications matching "{searchQuery}"</p>
        </div>
      ) : (
        filteredNotifications.map((notif) => (
          <div
            key={notif._id}
            onClick={() => {
              if (!notif.isRead) markRead({ notificationIds: [notif._id] });
            }}
            className={`
              mx-2 p-3 rounded-xl mb-2 flex gap-3 relative group transition-colors cursor-pointer
              ${notif.isRead ? 'bg-transparent hover:bg-bg-hover' : 'bg-accent/5 border border-accent/20'}
            `}
          >
            {!notif.isRead && (
              <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-accent" />
            )}

            <div className="flex-shrink-0 mt-1 relative z-10 bg-bg-elevated w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
              {getIcon(notif.type)}
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <div className="text-sm font-semibold text-text-primary mb-0.5">
                {notif.title}
              </div>
              <div className="text-xs text-text-muted leading-relaxed line-clamp-2 mb-1">
                {notif.body}
              </div>
              <div className="text-[10px] text-text-muted/70 font-medium">
                {formatRelativeTime(notif.createdAt)}
              </div>
            </div>

            {/* Actions overlay on hover */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-bg-sidebar/90 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-border">
              {!notif.isRead && (
                <button 
                  onClick={(e) => { e.stopPropagation(); markRead({ notificationIds: [notif._id] }); }}
                  className="p-1.5 text-text-muted hover:text-accent rounded-md hover:bg-bg-hover"
                  title="Mark as read"
                >
                  <Check size={14} />
                </button>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id); }}
                className="p-1.5 text-text-muted hover:text-danger rounded-md hover:bg-bg-hover"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
