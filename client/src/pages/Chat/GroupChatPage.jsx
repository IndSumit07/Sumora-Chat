import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useChatStore } from '../../store/chatStore.js';
import Sidebar from '../../components/Sidebar/Sidebar.jsx';
import GroupChatWindow from '../../components/Chat/GroupChatWindow.jsx';
import EmptyChat from '../../components/Chat/EmptyChat.jsx';
import { useQuery } from '@tanstack/react-query';
import groupApi from '../../api/group.api.js';
import { InlineLoader } from '../../components/ui/Spinner.jsx';
import { useUIStore } from '../../store/uiStore.js';

export default function GroupChatPage() {
  const { groupId } = useParams();
  const { setActiveGroup, setGroups, activeGroupId } = useChatStore();
  const { isMobileSidebarOpen } = useUIStore();

  const { data, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await groupApi.getGroups();
      const groups = response.data.data.groups;
      setGroups(groups);
      return groups;
    },
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    if (groupId) {
      setActiveGroup(groupId);
    }
  }, [groupId, setActiveGroup]);

  return (
    <div className="layout-container">
      <div className={`
        ${isMobileSidebarOpen ? 'flex' : 'hidden md:flex'}
        flex-col h-full bg-bg-sidebar border-r border-border
        w-full md:w-auto
      `}>
        <Sidebar />
      </div>

      <div className={`
        flex-1 flex flex-col h-full
        ${isMobileSidebarOpen ? 'hidden md:flex' : 'flex'}
      `}>
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <InlineLoader text="Loading group..." />
          </div>
        ) : activeGroupId ? (
          <GroupChatWindow groupId={activeGroupId} />
        ) : (
          <EmptyChat />
        )}
      </div>
    </div>
  );
}
