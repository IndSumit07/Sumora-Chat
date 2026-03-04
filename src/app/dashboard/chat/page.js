"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import ButtonSpinner from "@/components/ui/ButtonSpinner";

// New Unique Dashboard Components
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import ConversationList from "@/components/dashboard/ConversationList";
import ChatWindow from "@/components/dashboard/ChatWindow";

export default function ChatDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dm"); // 'dm', 'group', 'server'

  // Resizing logic
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const isResizing = useRef(false);

  const startResizing = useCallback((e) => {
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

    // Sidebar icons are 84px wide
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
      {/* Minimal Nav Sidebar */}
      <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Inbox / Conversation Explorer */}
      <ConversationList activeTab={activeTab} width={sidebarWidth} />

      {/* Resize Handle */}
      <div
        onMouseDown={startResizing}
        className="w-1.5 h-full cursor-col-resize hover:bg-foreground/10 active:bg-foreground/20 transition-colors z-50 shrink-0 -ml-0.75"
      />

      {/* Main Premium Chat Canvas */}
      <ChatWindow activeTab={activeTab} />
    </main>
  );
}
