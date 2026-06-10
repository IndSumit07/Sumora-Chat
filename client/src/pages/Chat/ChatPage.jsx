import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore } from '../../store/chatStore.js';
import { useUIStore } from '../../store/uiStore.js';
import Sidebar from '../../components/Sidebar/Sidebar.jsx';
import ChatWindow from '../../components/Chat/ChatWindow.jsx';
import EmptyChat from '../../components/Chat/EmptyChat.jsx';
import { useQuery } from '@tanstack/react-query';
import conversationApi from '../../api/conversation.api.js';
import { InlineLoader } from '../../components/ui/Spinner.jsx';

export default function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { setActiveConversation, setConversations, activeConversationId } = useChatStore();
  const { isMobileSidebarOpen } = useUIStore();

  // Fetch all conversations
  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await conversationApi.getConversations();
      const conversations = response.data.data.conversations;
      setConversations(conversations);
      return conversations;
    },
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    if (conversationId) {
      setActiveConversation(conversationId);
    }
  }, [conversationId, setActiveConversation]);

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <div
        className={`
          ${isMobileSidebarOpen ? 'flex' : 'hidden md:flex'}
          flex-col h-full bg-bg-sidebar border-r border-border
          ${activeConversationId ? 'md:flex' : 'flex'}
          w-full md:w-auto
        `}
      >
        <Sidebar />
      </div>

      {/* Chat Area */}
      <div className={`
        flex-1 flex flex-col h-full
        ${isMobileSidebarOpen ? 'hidden md:flex' : 'flex'}
      `}>
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <InlineLoader text="Loading conversations..." />
          </div>
        ) : activeConversationId ? (
          <ChatWindow conversationId={activeConversationId} />
        ) : (
          <EmptyChat />
        )}
      </div>
    </div>
  );
}
