"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import ButtonSpinner from "@/components/ui/ButtonSpinner";
import { useCrypto } from "@/providers/CryptoProvider";
import { usePresence } from "@/hooks/usePresence";
import { MessageSquare, PlaySquare, UserPlus } from "lucide-react";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import ConversationList from "@/components/dashboard/ConversationList";
import ChatWindow from "@/components/dashboard/ChatWindow";

export default function ChatDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { userId } = useCrypto();

  usePresence(userId);

  const [activeTab, setActiveTab] = useState("chat");
  const [selectedConv, setSelectedConv] = useState(null);
  const [mobileView, setMobileView] = useState("list"); // 'list' | 'chat'
  const [isMobile, setIsMobile] = useState(false);

  // Track mobile breakpoint
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Resizable sidebar width (desktop only)
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const isResizing = useRef(false);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing.current) return;
    const newWidth = e.clientX - 72;
    if (newWidth >= 240 && newWidth <= 480) setSidebarWidth(newWidth);
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, [handleMouseMove]);

  const startResizing = useCallback(() => {
    isResizing.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResizing);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [handleMouseMove, stopResizing]);

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", stopResizing);
    };
  }, [handleMouseMove, stopResizing]);

  useEffect(() => {
    if (!loading && !user) router.push("/sign-in");
  }, [user, loading, router]);

  const handleSelectConversation = useCallback((conv) => {
    setSelectedConv(conv);
    setMobileView("chat");
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <ButtonSpinner />
      </div>
    );
  }

  // ── Visibility helpers ────────────────────────────────────────────────────
  // Desktop: both panels always visible
  // Mobile:  show only one panel based on mobileView
  const showList = !isMobile || mobileView === "list";
  const showChat = !isMobile || mobileView === "chat";

  return (
    <main className="flex h-dvh bg-background text-foreground antialiased font-sans overflow-hidden">
      {/* Icon Sidebar — hidden on mobile via DashboardSidebar itself */}
      <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* ── Conversation List Panel ─────────────────────────────────────── */}
      {showList && (
        <div
          style={{ width: isMobile ? "100%" : sidebarWidth }}
          className="h-full shrink-0 flex flex-col border-r border-border bg-background"
        >
          {/* pb-14 clears mobile bottom nav */}
          <div className="flex flex-col h-full pb-14 md:pb-0">
            <ConversationList
              activeTab={activeTab}
              selectedConvId={selectedConv?.id ?? null}
              onSelectConversation={handleSelectConversation}
              onTabChange={setActiveTab}
            />
          </div>
        </div>
      )}

      {/* Desktop resize handle */}
      {!isMobile && (
        <div
          onMouseDown={startResizing}
          className="w-0.5 h-full cursor-col-resize hover:bg-emerald-500/40 active:bg-emerald-500/60 transition-colors shrink-0"
        />
      )}

      {/* ── Chat Window Panel ───────────────────────────────────────────── */}
      {showChat && (
        <div className="flex-1 h-full min-w-0 flex flex-col">
          <ChatWindow
            conversationId={selectedConv?.id ?? null}
            otherProfile={selectedConv?.otherProfile ?? null}
            onBack={() => setMobileView("list")}
          />
        </div>
      )}

      {/* ── Mobile Bottom Navigation ────────────────────────────────────── */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 h-14 bg-background/95 backdrop-blur-md border-t border-border flex items-center justify-around z-50">
          {[
            { id: "chat", icon: MessageSquare, label: "Chats" },
            { id: "media", icon: PlaySquare, label: "Media" },
            { id: "contacts", icon: UserPlus, label: "Contacts" },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                setMobileView("list");
              }}
              className={`flex flex-col items-center gap-1 px-6 py-1.5 rounded-xl transition-all
                ${
                  activeTab === id
                    ? "text-emerald-500"
                    : "text-foreground/30 hover:text-foreground/60"
                }`}
            >
              <Icon size={20} strokeWidth={activeTab === id ? 2.5 : 2} />
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          ))}
        </nav>
      )}
    </main>
  );
}
