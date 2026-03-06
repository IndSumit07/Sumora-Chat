"use client";

import React, { useState, useMemo } from "react";
import { Search, UserPlus, Users, MessageSquare, Loader2 } from "lucide-react";
import { useCrypto } from "@/providers/CryptoProvider";
import { useConversations } from "@/hooks/useConversations";
import OnlineIndicator from "@/components/OnlineIndicator";
import AddFriend from "@/components/AddFriend";
import FriendRequests from "@/components/FriendRequests";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / 3600000;
    const diffDays = diffMs / 86400000;

    if (diffHours < 24) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (diffDays < 7) {
        return date.toLocaleDateString([], { weekday: "short" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

// ─── Conversation Row ─────────────────────────────────────────────────────────

function ConvRow({ conv, selected, onClick, myId }) {
    const profile = conv.otherProfile;
    const name = profile?.full_name ?? "Unknown";
    const initials = name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const lastText = conv.lastMessage?.text ?? "";
    const lastTime = conv.lastMessage?.time ? formatTime(conv.lastMessage.time) : "";
    const isUnread = conv.unreadCount > 0;
    const isSentByMe = conv.lastMessage?.senderId === myId;

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-150
        ${selected
                    ? "bg-[#22C55E]/10 border-l-[3px] border-[#22C55E]"
                    : "border-l-[3px] border-transparent hover:bg-[#F9FAFB]"
                }`}
        >
            {/* Avatar */}
            <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-[#22C55E]/20 to-[#16A34A]/30 flex items-center justify-center border border-[#E5E7EB]">
                    {profile?.avatar_url ? (
                        <img
                            src={profile.avatar_url}
                            alt={name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-[13px] font-black text-[#22C55E]">{initials}</span>
                    )}
                </div>
                {/* Online dot */}
                <div className="absolute -bottom-0.5 -right-0.5">
                    <OnlineIndicator userId={profile?.id} />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-[14px] truncate ${isUnread ? "font-black text-[#111827]" : "font-semibold text-[#374151]"}`}>
                        {name}
                    </span>
                    <span className={`text-[11px] shrink-0 ml-2 ${isUnread ? "text-[#22C55E] font-bold" : "text-[#9CA3AF] font-medium"}`}>
                        {lastTime}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <p className={`text-[12px] truncate ${isUnread ? "font-semibold text-[#374151]" : "text-[#9CA3AF] font-medium"}`}>
                        {isSentByMe && <span className="text-[#22C55E] mr-1">You:</span>}
                        {lastText || <span className="italic opacity-60">No messages yet</span>}
                    </p>
                    {isUnread && (
                        <div className="w-5 h-5 rounded-full bg-[#22C55E] text-white text-[10px] font-black flex items-center justify-center shrink-0 ml-2">
                            {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                        </div>
                    )}
                </div>
            </div>
        </button>
    );
}

// ─── Chats Tab ────────────────────────────────────────────────────────────────

function ChatsTab({ selectedConvId, onSelectConversation, userId }) {
    const [search, setSearch] = useState("");
    const { conversations, loading } = useConversations(userId);

    const filtered = useMemo(() => {
        if (!search.trim()) return conversations;
        const q = search.toLowerCase();
        return conversations.filter((c) =>
            c.otherProfile?.full_name?.toLowerCase().includes(q)
        );
    }, [conversations, search]);

    return (
        <>
            {/* Search */}
            <div className="px-4 py-3 border-b border-[#F3F4F6]">
                <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search conversations…"
                        className="w-full bg-[#F9FAFB] rounded-xl py-2.5 pl-9 pr-4 text-[13px] font-medium text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:ring-2 focus:ring-[#22C55E]/20 transition-all border border-[#E5E7EB] focus:border-[#22C55E]/40"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={22} className="animate-spin text-[#22C55E]" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 px-6 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-[#F0FDF4] flex items-center justify-center">
                            <MessageSquare size={22} className="text-[#22C55E]" />
                        </div>
                        <p className="text-[14px] font-bold text-[#374151]">
                            {search ? "No results" : "No conversations yet"}
                        </p>
                        <p className="text-[12px] text-[#9CA3AF] font-medium">
                            {search ? "Try a different name" : "Add a friend to start chatting"}
                        </p>
                    </div>
                ) : (
                    filtered.map((conv) => (
                        <ConvRow
                            key={conv.id}
                            conv={conv}
                            selected={conv.id === selectedConvId}
                            onClick={() => onSelectConversation(conv)}
                            myId={userId}
                        />
                    ))
                )}
            </div>
        </>
    );
}

// ─── Friends Tab ──────────────────────────────────────────────────────────────

function FriendsTab() {
    const [showAddFriend, setShowAddFriend] = useState(false);

    return (
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
            {/* Add Friend toggle */}
            <div className="rounded-2xl border border-[#E5E7EB] overflow-hidden bg-white">
                <button
                    onClick={() => setShowAddFriend((v) => !v)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#F9FAFB] transition-all"
                >
                    <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] flex items-center justify-center">
                        <UserPlus size={16} className="text-[#22C55E]" />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="text-[14px] font-black text-[#111827]">Add Friend</p>
                        <p className="text-[12px] text-[#9CA3AF] font-medium">Search by email address</p>
                    </div>
                    <span className="text-[11px] font-bold text-[#22C55E] bg-[#F0FDF4] px-2 py-1 rounded-lg">
                        {showAddFriend ? "Close" : "Open"}
                    </span>
                </button>
                {showAddFriend && (
                    <div className="border-t border-[#F3F4F6]">
                        <AddFriend />
                    </div>
                )}
            </div>

            {/* Pending Friend Requests */}
            <FriendRequests />
        </div>
    );
}

// ─── Unified Left Panel ───────────────────────────────────────────────────────

export default function LeftPanel({ activeTab, selectedConvId, onSelectConversation }) {
    const { userId } = useCrypto();

    return (
        <aside className="w-[320px] shrink-0 bg-white border-r border-[#E5E7EB] flex flex-col h-full overflow-hidden">
            {/* Panel Header */}
            <div className="px-5 py-4 border-b border-[#F3F4F6] shrink-0">
                <h2 className="text-[18px] font-black text-[#111827] tracking-tight">
                    {activeTab === "chats" ? "Messages" : "Friends"}
                </h2>
                <p className="text-[12px] text-[#9CA3AF] font-medium mt-0.5">
                    {activeTab === "chats" ? "Your conversations" : "Manage your connections"}
                </p>
            </div>

            {/* Tab Content */}
            {activeTab === "chats" ? (
                <ChatsTab
                    selectedConvId={selectedConvId}
                    onSelectConversation={onSelectConversation}
                    userId={userId}
                />
            ) : (
                <FriendsTab />
            )}
        </aside>
    );
}
