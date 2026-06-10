import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import groupApi from '../../api/group.api.js';
import uploadApi from '../../api/upload.api.js';
import Modal from '../ui/Modal.jsx';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import Avatar from '../ui/Avatar.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { useChatStore } from '../../store/chatStore.js';
import toast from 'react-hot-toast';
import { Camera, Users } from 'lucide-react';

export default function CreateGroupModal({ isOpen, onClose }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { addGroup, setActiveGroup } = useChatStore();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      let avatarUrl = '';
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const uploadRes = await uploadApi.uploadGroupAvatar(formData);
        avatarUrl = uploadRes.data.data.url;
      }

      const createRes = await groupApi.createGroup({
        name: name.trim(),
        description: description.trim(),
        avatar: avatarUrl,
        members: [user._id], // Self is added by backend, but explicit is fine
      });

      return createRes.data.data.group;
    },
    onSuccess: (group) => {
      toast.success('Group created successfully!');
      addGroup(group);
      queryClient.invalidateQueries(['groups']);
      onClose();
      setActiveGroup(group._id);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create group');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    createGroupMutation.mutate();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Group" size="md">
      <form onSubmit={handleSubmit} className="p-6">
        <div className="flex flex-col items-center mb-6">
          <div className="relative group">
            <Avatar 
              src={avatarPreview} 
              name={name || 'Group'} 
              size="2xl" 
              className="border-4 border-bg-elevated shadow-xl"
            />
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <Camera className="text-white" size={24} />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <p className="text-xs text-text-muted mt-2">Optional group icon</p>
        </div>

        <div className="space-y-4">
          <Input
            label="Group Name"
            placeholder="E.g., Weekend Getaway 🌴"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={Users}
            autoFocus
            required
            maxLength={50}
          />

          <Input
            label="Description (Optional)"
            placeholder="What is this group about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
          />
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            loading={createGroupMutation.isPending}
            disabled={!name.trim()}
          >
            Create Group
          </Button>
        </div>
      </form>
    </Modal>
  );
}
