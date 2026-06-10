import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '../../store/uiStore.js';
import { useOnlineStatusMap } from '../../hooks/useOnlineStatus.js';
import friendApi from '../../api/friend.api.js';
import conversationApi from '../../api/conversation.api.js';
import Avatar from '../ui/Avatar.jsx';
import Button from '../ui/Button.jsx';
import { UserPlus, MessageSquare, Check, X, Clock } from 'lucide-react';
import { MODAL_TYPES } from '../../utils/constants.js';
import { InlineLoader } from '../ui/Spinner.jsx';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function FriendList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { searchQuery, openModal, closeMobileSidebar } = useUIStore();

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const response = await friendApi.getFriends();
      return response.data.data.friends;
    },
  });

  const { data: pendingRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['friendRequests'],
    queryFn: async () => {
      const response = await friendApi.getPendingRequests();
      return response.data.data.requests;
    },
  });

  const onlineStatuses = useOnlineStatusMap(friends.map(f => f._id));

  const acceptMutation = useMutation({
    mutationFn: (requestId) => friendApi.acceptRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries(['friends']);
      queryClient.invalidateQueries(['friendRequests']);
      toast.success('Friend request accepted');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId) => friendApi.rejectRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries(['friendRequests']);
    },
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
    return f.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           f.username?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loadingFriends || loadingRequests) {
    return <InlineLoader text="Loading friends..." />;
  }

  return (
    <div className="py-2">
      {/* Add Friend Button */}
      <div className="px-4 mb-4">
        <button
          onClick={() => openModal(MODAL_TYPES.ADD_FRIEND)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-white font-medium hover:bg-accent-light active:scale-95 transition-all shadow-glow-accent-sm"
        >
          <UserPlus size={18} /> Add Friend
        </button>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && !searchQuery && (
        <div className="mb-6">
          <div className="px-4 mb-2 flex items-center gap-2">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Friend Requests
            </h3>
            <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {pendingRequests.length}
            </span>
          </div>
          
          {pendingRequests.map((req) => (
            <div key={req._id} className="mx-2 p-3 bg-bg-elevated rounded-xl border border-border mb-2 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Avatar src={req.sender.avatar} name={req.sender.fullName} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-text-primary truncate">{req.sender.fullName}</div>
                  <div className="text-xs text-text-muted truncate">@{req.sender.username}</div>
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
          ))}
        </div>
      )}

      {/* Friends List */}
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
          <p className="text-sm text-text-muted">Find people by username or email.</p>
        </div>
      ) : filteredFriends.length === 0 ? (
        <div className="empty-state">
          <p className="text-sm text-text-muted">No friends found matching "{searchQuery}"</p>
        </div>
      ) : (
        filteredFriends.map((friend) => (
          <div
            key={friend._id}
            className="sidebar-item mx-2 group"
          >
            <Avatar
              src={friend.avatar}
              name={friend.fullName}
              isOnline={onlineStatuses[friend._id]}
              size="md"
              className="cursor-pointer"
            />
            
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-text-primary truncate">
                {friend.fullName}
              </div>
              <div className="text-xs text-text-muted truncate flex items-center gap-1">
                {onlineStatuses[friend._id] ? (
                  <span className="text-accent">Online</span>
                ) : (
                  <span className="flex items-center gap-1"><Clock size={10} /> Offline</span>
                )}
              </div>
            </div>

            {/* Message Action (appears on hover or mobile) */}
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
  );
}
