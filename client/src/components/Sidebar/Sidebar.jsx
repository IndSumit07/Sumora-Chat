import { MessageSquare, Users, UserPlus, Bell, Search, Menu, X, LogOut, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { useNotificationStore } from '../../store/notificationStore.js';
import { SIDEBAR_TABS, MODAL_TYPES } from '../../utils/constants.js';
import Avatar from '../ui/Avatar.jsx';
import Badge from '../ui/Badge.jsx';
import ChatList from './ChatList.jsx';
import GroupList from './GroupList.jsx';
import FriendList from './FriendList.jsx';
import NotificationList from './NotificationList.jsx';
import authApi from '../../api/auth.api.js';

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { 
    sidebarTab, setSidebarTab, isMobileSidebarOpen, 
    toggleMobileSidebar, openModal, searchQuery, setSearchQuery 
  } = useUIStore();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      logout();
      navigate('/login');
    }
  };

  const tabs = [
    { id: SIDEBAR_TABS.CHATS, icon: MessageSquare, label: 'Chats' },
    { id: SIDEBAR_TABS.GROUPS, icon: Users, label: 'Groups' },
    { id: SIDEBAR_TABS.FRIENDS, icon: UserPlus, label: 'Friends' },
    { id: SIDEBAR_TABS.NOTIFICATIONS, icon: Bell, label: 'Alerts', badge: unreadCount },
  ];

  return (
    <div className="flex flex-col h-full w-full md:w-sidebar flex-shrink-0 bg-bg-sidebar relative">
      {/* Mobile Close Button */}
      {isMobileSidebarOpen && (
        <button 
          onClick={toggleMobileSidebar}
          className="md:hidden absolute top-4 right-4 z-50 text-text-muted hover:text-text-primary bg-bg-elevated rounded-full p-2"
        >
          <X size={20} />
        </button>
      )}

      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar 
              src={user?.avatar} 
              name={user?.fullName} 
              size="md" 
              className="cursor-pointer"
              onClick={() => openModal(MODAL_TYPES.PROFILE)}
            />
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-text-primary truncate">{user?.fullName}</h2>
              <p className="text-xs text-accent">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => navigate('/settings')}
              className="btn-icon" 
              title="Settings"
            >
              <Settings size={18} />
            </button>
            <button 
              onClick={handleLogout}
              className="btn-icon hover:text-danger" 
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-elevated border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/30 placeholder:text-text-muted transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = sidebarTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSidebarTab(tab.id)}
              className={`
                flex-1 flex flex-col items-center justify-center py-3 gap-1 relative transition-colors
                ${isActive ? 'text-accent' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'}
              `}
            >
              <div className="relative">
                <Icon size={20} />
                {tab.badge > 0 && (
                  <Badge count={tab.badge} className="absolute -top-1.5 -right-2 scale-75" />
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Dynamic Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {sidebarTab === SIDEBAR_TABS.CHATS && <ChatList />}
        {sidebarTab === SIDEBAR_TABS.GROUPS && <GroupList />}
        {sidebarTab === SIDEBAR_TABS.FRIENDS && <FriendList />}
        {sidebarTab === SIDEBAR_TABS.NOTIFICATIONS && <NotificationList />}
      </div>
    </div>
  );
}
