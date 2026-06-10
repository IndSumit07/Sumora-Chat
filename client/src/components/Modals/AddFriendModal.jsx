import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import friendApi from '../../api/friend.api.js';
import Modal from '../ui/Modal.jsx';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import toast from 'react-hot-toast';
import { UserPlus, Search } from 'lucide-react';

export default function AddFriendModal({ isOpen, onClose }) {
  const [username, setUsername] = useState('');
  const queryClient = useQueryClient();

  const sendRequestMutation = useMutation({
    mutationFn: (data) => friendApi.sendRequest(data),
    onSuccess: () => {
      toast.success('Friend request sent!');
      queryClient.invalidateQueries(['friendRequests']);
      onClose();
      setUsername('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to send request');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    sendRequestMutation.mutate({ username: username.trim() });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Friend" size="sm">
      <div className="p-6">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center border border-accent/20">
            <UserPlus size={32} className="text-accent" />
          </div>
        </div>

        <p className="text-center text-sm text-text-muted mb-6">
          Enter your friend's exact username or email address to send a request.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            placeholder="Username or email..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            leftIcon={Search}
            autoFocus
          />

          <Button 
            type="submit" 
            className="w-full" 
            loading={sendRequestMutation.isPending}
            disabled={!username.trim()}
          >
            Send Request
          </Button>
        </form>
      </div>
    </Modal>
  );
}
