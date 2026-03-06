"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import ButtonSpinner from "@/components/ui/ButtonSpinner";
import { useCrypto } from "@/providers/CryptoProvider";
import { usePresence } from "@/hooks/usePresence";

// Dashboard components
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import ConversationList from "@/components/dashboard/ConversationList";
import ChatWindow from "@/components/dashboard/ChatWindow";

export default function ChatDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { userId } = useCrypto();

  // Activate global presence tracking — writes is_online to profiles
  usePresence(userId);

  const [activeTab, setActiveTab] = useState("chat"); // 'chat' | 'media'

  // Selected conversation — { id, otherProfile }
  const [selectedConv, setSelectedConv] = useState(null);

  // Resizable sidebar
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const isResizing = useRef(false);

  const startResizing = useCallback(() => {
    isResizing.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResizing);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing.current) return;
    const newWidth = e.clientX - 84;
    if (newWidth >= 280 && newWidth <= 500) {
      setSidebarWidth(newWidth);
    }
  }, []);

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", stopResizing);
    };
  }, [handleMouseMove, stopResizing]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <ButtonSpinner />
      </div>
    );
  }

  return (
    <main className="flex h-screen bg-background overflow-hidden text-foreground antialiased font-sans">
      {/* Icon Sidebar */}
      <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <ConversationList
        activeTab={activeTab}
        width={sidebarWidth}
        selectedConvId={selectedConv?.id ?? null}
        onSelectConversation={setSelectedConv}
        onTabChange={setActiveTab}
      />

      {/* Resize Handle */}
      <div
        onMouseDown={startResizing}
        className="w-1.5 h-full cursor-col-resize hover:bg-foreground/10 active:bg-foreground/20 transition-colors z-50 shrink-0"
      />

      {/* Main Chat Window */}
      <ChatWindow
        conversationId={selectedConv?.id ?? null}
        otherProfile={selectedConv?.otherProfile ?? null}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </main>
  );
}
