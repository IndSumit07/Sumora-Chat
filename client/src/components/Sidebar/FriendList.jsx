import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '../../store/uiStore.js';
import { useOnlineStatusMap } from '../../hooks/useOnlineStatus.js';
import friendApi from '../../api/friend.api.js';
import conversationApi from '../../api/conversation.api.js';
import Avatar from '../ui/Avatar.jsx';
import Button from '../ui/Button.jsx';
import { UserPlus, MessageSquare, Check, X, Clock, Send, Inbox } from 'lucide-react';
import { MODAL_TYPES } from '../../utils/constants.js';
import { InlineLoader } from '../ui/Spinner.jsx';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function FriendList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { searchQuery, openModal, closeMobileSidebar } = useUIStore();
  // sub-tab: 'friends' | 'received' | 'sent'
  const [activeTab, setActiveTab] = useState('friends');

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const response = await friendApi.getFriends();
      return response.data.data.friends;
    },
  });

  // API returns { received: [...], sent: [...] }
  const { data: pendingData = { received: [], sent: [] }, isLoading: loadingRequests } = useQuery({
    queryKey: ['friendRequests'],
    queryFn: async () => {
      const response = await friendApi.getPendingRequests();
      return response.data.data;
    },
  });

  const received = pendingData.received || [];
  const sent = pendingData.sent || [];
  const totalPending = received.length + sent.length;

  const onlineStatuses = useOnlineStatusMap((friends ?? []).map(f => f._id));

  const acceptMutation = useMutation({
    mutationFn: (requestId) => friendApi.acceptRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries(['friends']);
      queryClient.invalidateQueries(['friendRequests']);
      toast.success('Friend request accepted! 🎉');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to accept'),
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId) => friendApi.rejectRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries(['friendRequests']);
      toast.success('Request declined');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to decline'),
  });

  const cancelMutation = useMutation({
    mutationFn: (requestId) => friendApi.cancelRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries(['friendRequests']);
      toast.success('Request cancelled');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to cancel'),
  });

  const startChatMutation = useMutation({
    mutationFn: (userId) => conversationApi.createOrGet({ userId }),
    onSuccess: (response) => {
      const conversationId = response.data.data.conversation._id;
      navigate(`/chat/${conversationId}`);
      closeMobileSidebar();
    },
  });

  const filteredFriends = friends.filter((f) => {
    if (!searchQuery) return true;
    return (
      f.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (loadingFriends || loadingRequests) {
    return <InlineLoader text="Loading..." />;
  }

  const subTabs = [
    { id: 'friends', label: 'Friends', count: friends.length },
    { id: 'received', label: 'Received', count: received.length },
    { id: 'sent', label: 'Sent', count: sent.length },
  ];

  return (
    <div className="py-2 flex flex-col h-full">
      {/* Add Friend Button */}
      <div className="px-4 mb-3">
        <button
          onClick={() => openModal(MODAL_TYPES.ADD_FRIEND)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-white font-medium hover:bg-accent-light active:scale-95 transition-all shadow-glow-accent-sm"
        >
          <UserPlus size={18} /> Add Friend
        </button>
      </div>

      {/* Sub-tabs: Friends / Received / Sent */}
      <div className="flex border-b border-border mx-4 mb-3">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors relative
              ${activeTab === tab.id ? 'text-accent' : 'text-text-muted hover:text-text-primary'}`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                  ${activeTab === tab.id ? 'bg-accent text-white' : 'bg-bg-elevated text-text-muted'}`}
              >
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">

        {/* ── RECEIVED REQUESTS TAB ── */}
        {activeTab === 'received' && (
          <div className="px-2">
            {received.length === 0 ? (
              <div className="empty-state">
                <div className="w-14 h-14 bg-bg-elevated rounded-full flex items-center justify-center mb-3">
                  <Inbox size={28} className="text-text-muted" />
                </div>
                <h3 className="text-text-primary font-medium mb-1 text-sm">No incoming requests</h3>
                <p className="text-xs text-text-muted">When someone sends you a request it'll appear here.</p>
              </div>
            ) : (
              received.map((req) => (
                <div key={req._id} className="p-3 bg-bg-elevated rounded-xl border border-border mb-2 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={req.sender?.avatar} name={req.sender?.fullName} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-text-primary truncate">{req.sender?.fullName}</div>
                      <div className="text-xs text-text-muted truncate">@{req.sender?.username}</div>
                      {req.message && (
                        <p className="text-xs text-text-muted mt-1 italic truncate">"{req.message}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="flex-1 py-1.5"
                      onClick={() => acceptMutation.mutate(req._id)}
                      loading={acceptMutation.isPending}
                    >
                      <Check size={14} className="mr-1" /> Accept
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 py-1.5 hover:text-danger hover:border-danger/50 hover:bg-danger/10"
                      onClick={() => rejectMutation.mutate(req._id)}
                      loading={rejectMutation.isPending}
                    >
                      <X size={14} className="mr-1" /> Decline
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── SENT REQUESTS TAB ── */}
        {activeTab === 'sent' && (
          <div className="px-2">
            {sent.length === 0 ? (
              <div className="empty-state">
                <div className="w-14 h-14 bg-bg-elevated rounded-full flex items-center justify-center mb-3">
                  <Send size={24} className="text-text-muted" />
                </div>
                <h3 className="text-text-primary font-medium mb-1 text-sm">No sent requests</h3>
                <p className="text-xs text-text-muted">Requests you send will appear here.</p>
              </div>
            ) : (
              sent.map((req) => (
                <div key={req._id} className="p-3 bg-bg-elevated rounded-xl border border-border mb-2 flex items-center gap-3">
                  <Avatar src={req.receiver?.avatar} name={req.receiver?.fullName} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-text-primary truncate">{req.receiver?.fullName}</div>
                    <div className="text-xs text-text-muted truncate">@{req.receiver?.username}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={10} className="text-yellow-500" />
                      <span className="text-[10px] text-yellow-500 font-medium">Pending</span>
                    </div>
                  </div>
                  <button
                    onClick={() => cancelMutation.mutate(req._id)}
                    disabled={cancelMutation.isPending}
                    className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                    title="Cancel request"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── FRIENDS TAB ── */}
        {activeTab === 'friends' && (
          <div>
            {/* Pending badge nudge */}
            {totalPending > 0 && (
              <button
                onClick={() => setActiveTab('received')}
                className="mx-4 mb-3 w-[calc(100%-2rem)] flex items-center gap-2 p-2.5 bg-accent/10 border border-accent/20 rounded-xl text-xs text-accent font-medium hover:bg-accent/20 transition-colors"
              >
                <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {totalPending}
                </span>
                pending friend request{totalPending > 1 ? 's' : ''} — tap to review
              </button>
            )}

            <div className="px-4 mb-2">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                All Friends — {friends.length}
              </h3>
            </div>

            {friends.length === 0 ? (
              <div className="empty-state">
                <div className="w-16 h-16 bg-bg-elevated rounded-full flex items-center justify-center text-3xl mb-4 shadow-elevated">
                  👋
                </div>
                <h3 className="text-text-primary font-medium mb-1">No friends yet</h3>
                <p className="text-sm text-text-muted">Find people by username to add them.</p>
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="empty-state">
                <p className="text-sm text-text-muted">No friends found matching "{searchQuery}"</p>
              </div>
            ) : (
              filteredFriends.map((friend) => (
                <div key={friend._id} className="sidebar-item mx-2 group">
                  <Avatar
                    src={friend.avatar}
                    name={friend.fullName}
                    isOnline={onlineStatuses[friend._id]}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-text-primary truncate">
                      {friend.fullName}
                    </div>
                    <div className="text-xs text-text-muted truncate flex items-center gap-1">
                      {onlineStatuses[friend._id] ? (
                        <span className="text-accent">Online</span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> Offline
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => startChatMutation.mutate(friend._id)}
                    disabled={startChatMutation.isPending}
                    className="btn-icon bg-bg-elevated opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Message"
                  >
                    <MessageSquare size={16} className="text-accent" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
