"use client";

import React, { useState, useMemo } from "react";
import { Search, ListFilter, CheckCheck, Loader2, UserPlus } from "lucide-react";
import { useCrypto } from "@/providers/CryptoProvider";
import { useConversations } from "@/hooks/useConversations";
import AddFriend from "@/components/AddFriend";
import FriendRequests from "@/components/FriendRequests";
import FriendList from "@/components/FriendList";

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

// ─── Chat List Item ────────────────────────────────────────

const ChatListItem = ({ title, lastMsg, time, active, unread, avatar, isOnline, onClick }) => (
    <div
        onClick={onClick}
        className={`relative flex items-center gap-4 px-4 py-4 cursor-pointer transition-all duration-300 mx-2 rounded-2xl mb-1
        ${active ? "bg-emerald-500/10" : "hover:bg-foreground/[0.02]"}`}
    >
        {/* Active side indicator */}
        {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-full" />
        )}

        <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-foreground/5 border border-border shadow-sm">
                {avatar ? (
                    <img src={avatar} alt={title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-foreground/20 text-xl">
                        {title?.charAt(0) ?? "?"}
                    </div>
                )}
            </div>
            {isOnline && (
                <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background shadow-sm" />
            )}
        </div>

        <div className="flex-1 min-w-0 border-b border-border/50 py-1">
            <div className="flex justify-between items-baseline mb-1">
                <h3 className={`text-[15px] font-bold truncate ${active ? "text-foreground" : "text-foreground/90"}`}>
                    {title}
                </h3>
                <span className={`text-[11px] font-bold ${unread ? "text-indigo-500" : "text-foreground/30"}`}>
                    {time}
                </span>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                    {!unread && lastMsg && <CheckCheck size={14} className="text-foreground/30 shrink-0" />}
                    <p className={`text-[13px] truncate ${unread ? "text-foreground font-bold" : "text-foreground/50"}`}>
                        {lastMsg}
                    </p>
                </div>
                {unread > 0 && (
                    <div className="min-w-[20px] h-5 rounded-full bg-foreground text-background text-[10px] font-black flex items-center justify-center px-1 shadow-md">
                        {unread}
                    </div>
                )}
            </div>
        </div>
    </div>
);

// ─── Chats Tab ────────────────────────────────────────────────────────────────

function ChatsTab({ selectedConvId, onSelectConversation, userId }) {
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const { conversations, loading } = useConversations(userId);

    const FilterBtn = ({ id, label }) => (
        <button
            onClick={() => setFilter(id)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${filter === id
                ? "bg-foreground text-background border-foreground"
                : "bg-foreground/5 text-foreground/50 border-transparent hover:bg-foreground/10"
                }`}
        >
            {label}
        </button>
    );

    const filtered = useMemo(() => {
        let list = conversations;
        // Search filter
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((c) => c.otherProfile?.full_name?.toLowerCase().includes(q));
        }
        // Unread filter
        if (filter === "unread") {
            list = list.filter((c) => c.unreadCount > 0);
        }
        return list;
    }, [conversations, search, filter]);

    return (
        <>
            {/* Header */}
            <div className="p-6 pb-2">
                <div className="flex items-center gap-2 mb-6">
                    <ListFilter size={20} className="text-foreground" />
                    <h2 className="text-xl font-black tracking-tight text-foreground">All</h2>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-foreground/30">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by chats and people"
                        className="w-full bg-foreground/5 border border-transparent rounded-full py-2.5 pl-11 pr-4 text-[13px] outline-none focus:bg-transparent focus:border-border transition-all placeholder:text-foreground/30 font-bold"
                    />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar py-1">
                    <FilterBtn id="all" label="All" />
                    <FilterBtn id="unread" label="Unread" />
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={22} className="animate-spin text-foreground/30" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 px-6 text-center opacity-40">
                        <p className="text-[14px] font-bold">
                            {search ? "No results" : "No conversations yet"}
                        </p>
                        <p className="text-[12px]">
                            {search ? "Try a different name" : "Add a friend to start chatting"}
                        </p>
                    </div>
                ) : (
                    filtered.map((conv) => (
                        <ChatListItem
                            key={conv.id}
                            title={conv.otherProfile?.full_name ?? "Unknown"}
                            lastMsg={conv.lastMessage?.text ?? ""}
                            time={conv.lastMessage?.time ? formatTime(conv.lastMessage.time) : ""}
                            active={conv.id === selectedConvId}
                            unread={conv.unreadCount}
                            avatar={conv.otherProfile?.avatar_url}
                            isOnline={conv.otherProfile?.is_online}
                            onClick={() => onSelectConversation(conv)}
                        />
                    ))
                )}
            </div>
        </>
    );
}
// ─── Main ConversationList ────────────────────────────────────────────────────

export default function ConversationList({ width = 380, selectedConvId, onSelectConversation }) {
    const { userId } = useCrypto();

    return (
        <aside
            style={{ width: `${width}px` }}
            className="flex flex-col bg-background h-full border-r border-border shrink-0 z-40"
        >
            <ChatsTab
                selectedConvId={selectedConvId}
                onSelectConversation={onSelectConversation}
                userId={userId}
            />
        </aside>
    );
}
