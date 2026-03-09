"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, Loader2, PlaySquare, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCrypto } from "@/providers/CryptoProvider";
import { useConversations } from "@/hooks/useConversations";
import AddFriend from "@/components/AddFriend";
import FriendList from "@/components/FriendList";
import { Users2, MessageSquarePlus, ArrowLeft } from "lucide-react";

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

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ─── Chat List Item ────────────────────────────────────────

const ChatListItem = ({ title, lastMsg, time, active, unread, avatar, isOnline, onClick }) => (
    <div
        onClick={onClick}
        className={`relative flex items-center gap-3 px-3 py-3 cursor-pointer transition-all rounded-xl mx-2 mb-0.5
        ${active
                ? "bg-emerald-500/8 dark:bg-emerald-500/10"
                : "hover:bg-foreground/5"
            }`}
    >
        {/* Avatar */}
        <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700">
                {avatar ? (
                    <img src={avatar} alt={title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-zinc-500 dark:text-zinc-300 text-[14px]">
                        {title?.charAt(0) ?? "?"}
                    </div>
                )}
            </div>
            {isOnline && (
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background" />
            )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline">
                <h3 className={`text-[13.5px] truncate leading-tight
                    ${unread > 0 ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>
                    {title}
                </h3>
                <span className={`text-[10.5px] shrink-0 ml-2 ${unread > 0 ? "text-emerald-500 font-semibold" : "text-foreground/30"}`}>
                    {time}
                </span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
                <p className={`text-[12px] truncate ${unread > 0 ? "text-foreground/70 font-medium" : "text-foreground/40"}`}>
                    {lastMsg || "No messages yet"}
                </p>
                {unread > 0 && (
                    <div className="ml-2 min-w-[18px] h-[18px] rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shrink-0">
                        {unread > 99 ? "99+" : unread}
                    </div>
                )}
            </div>
        </div>
    </div>
);

// ─── Media Tab ────────────────────────────────────────────────────────────────

function MediaTab({ userId }) {
    const [mediaItems, setMediaItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchMedia = async () => {
            const supabase = createClient();
            const { data: participants } = await supabase.from('conversation_participants').select('conversation_id').eq('user_id', userId);
            if (!participants?.length) {
                if (isMounted) setLoading(false);
                return;
            }
            const convIds = participants.map(p => p.conversation_id);

            const { data: messagesData } = await supabase.from('messages')
                .select('id, type, media_url, media_type, media_size, file_name, file_size, created_at, sender_id')
                .in('conversation_id', convIds)
                .neq('sender_id', userId)
                .neq('type', 'text')
                .not('media_url', 'is', null)
                .order('created_at', { ascending: false })
                .limit(100);

            if (messagesData && isMounted && messagesData.length > 0) {
                const uniqueSenders = [...new Set(messagesData.map(m => m.sender_id))];
                const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', uniqueSenders);
                const mapped = messagesData.map(m => ({
                    ...m,
                    // Use file_name if available, fall back to media_type-based name
                    displayName: m.file_name || (m.media_type ? `${m.type} file` : 'Unnamed file'),
                    displaySize: m.file_size ?? m.media_size ?? 0,
                    senderName: profiles?.find(p => p.id === m.sender_id)?.full_name || 'Unknown',
                    senderAvatar: profiles?.find(p => p.id === m.sender_id)?.avatar_url || null,
                }));
                setMediaItems(mapped);
            }
            if (isMounted) setLoading(false);
        };
        fetchMedia();
        return () => { isMounted = false; }
    }, [userId]);

    return (
        <div className="h-full overflow-y-auto no-scrollbar flex flex-col">
            <div className="p-6 pb-2 shrink-0">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                        <PlaySquare size={20} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-xl font-black tracking-tight text-foreground">Media</h2>
                </div>
                <p className="text-[13px] font-bold text-foreground/40 leading-relaxed mb-6">
                    Files, images, and documents received from your contacts.
                </p>
            </div>

            <div className="flex-1 px-4 pb-6">
                {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-foreground/30" /></div>
                ) : mediaItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center opacity-40">
                        <PlaySquare size={32} />
                        <p className="text-[14px] font-bold">No media received yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {mediaItems.map(item => (
                            <div key={item.id} className="flex gap-4 items-center hover:bg-foreground/5 p-3 rounded-2xl cursor-pointer transition-colors group">
                                {(item.type === 'image' || item.type === 'gif') ? (
                                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-border/50">
                                        <img src={item.media_url} alt="Media" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                ) : item.type === 'video' ? (
                                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-border/50 bg-black/5 flex items-center justify-center">
                                        <video src={item.media_url} className="w-full h-full object-cover" muted />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-foreground/5 flex flex-col items-center justify-center text-[10px] font-black text-foreground/50 border border-border/50 shrink-0 uppercase tracking-widest gap-1">
                                        <span className="text-lg">📄</span>
                                        <span>{item.type}</span>
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-bold text-foreground truncate">{item.displayName || item.file_name || 'Unnamed file'}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {item.senderAvatar ? (
                                            <img src={item.senderAvatar} alt={item.senderName} className="w-4 h-4 rounded-full object-cover" />
                                        ) : null}
                                        <p className="text-[12px] font-semibold text-foreground/50 truncate">From {item.senderName}</p>
                                    </div>
                                    {(item.displaySize > 0) && (
                                        <p className="text-[10px] font-black text-foreground/30 uppercase mt-1">
                                            {formatFileSize(item.displaySize)}
                                        </p>
                                    )}
                                </div>
                                {item.media_url && (
                                    <a
                                        href={item.media_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-xl bg-foreground/5 text-foreground/50 hover:text-foreground shrink-0"
                                        title="Open"
                                    >
                                        ↗
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Contacts/Chats Tab ────────────────────────────────────────────────────────

function ChatsTab({ selectedConvId, onSelectConversation, userId, onTabChange }) {
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const { conversations, loading } = useConversations(userId);

    const filtered = useMemo(() => {
        let list = conversations;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((c) => c.otherProfile?.full_name?.toLowerCase().includes(q));
        }
        if (filter === "unread") {
            list = list.filter((c) => c.unreadCount > 0);
        }
        return list;
    }, [conversations, search, filter]);

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-5 pb-3 shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[16px] font-bold text-foreground tracking-tight">Messages</h2>
                    <button
                        onClick={() => onTabChange("contacts")}
                        className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-500/30"
                        title="New Message"
                    >
                        <Plus size={16} />
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search…"
                        className="w-full bg-foreground/5 rounded-xl py-2.5 pl-9 pr-4 text-[13px] outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-foreground/30 font-medium border border-transparent focus:bg-background-secondary"
                    />
                </div>

                {/* Filter pills */}
                <div className="flex gap-2 mt-3">
                    {[{ id: "all", label: "All" }, { id: "unread", label: "Unread" }].map(({ id, label }) => (
                        <button key={id} onClick={() => setFilter(id)}
                            className={`px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all
                                ${filter === id
                                    ? "bg-foreground text-background"
                                    : "text-foreground/40 hover:text-foreground hover:bg-foreground/5"
                                }`}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto pb-4" style={{ scrollbarWidth: "none" }}>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 size={20} className="animate-spin text-foreground/20" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 opacity-40">
                        <MessageSquarePlus size={24} />
                        <p className="text-[13px] font-medium">
                            {search ? "No results found" : "No conversations yet"}
                        </p>
                    </div>
                ) : (
                    <div className="pt-1">
                        {filtered.map((conv) => (
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
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Contacts Tab ────────────────────────────────────────────────────────

function ContactsTab({ onSelectConversation, onTabChange }) {
    const handleSelectContact = (conv) => {
        onSelectConversation(conv);
        if (onTabChange) onTabChange("chat");
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-5 pb-4 border-b border-border/50 shrink-0">
                <div className="flex items-center gap-3 mb-5">
                    <button
                        onClick={() => onTabChange("chat")}
                        className="w-8 h-8 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-foreground/10 transition-all"
                    >
                        <ArrowLeft size={15} />
                    </button>
                    <div>
                        <h2 className="text-[15px] font-bold text-foreground leading-tight">Add Contact</h2>
                        <p className="text-[11px] text-foreground/40">Search by email address</p>
                    </div>
                </div>
                <AddFriend />
            </div>

            {/* Contact list */}
            <div className="flex-1 overflow-y-auto pb-6" style={{ scrollbarWidth: "none" }}>
                <div className="px-4 pt-4 pb-2">
                    <p className="text-[11px] font-semibold text-foreground/30 uppercase tracking-wider px-1 mb-2">
                        Your Contacts
                    </p>
                </div>
                <FriendList onSelectConversation={handleSelectContact} />
            </div>
        </div>
    );
}

// ─── Main ConversationList ────────────────────────────────────────────────────

export default function ConversationList({ activeTab, selectedConvId, onSelectConversation, onTabChange }) {
    const { userId } = useCrypto();

    return (
        <div className="flex flex-col bg-background h-full w-full">
            {activeTab === "chat" && (
                <ChatsTab
                    selectedConvId={selectedConvId}
                    onSelectConversation={onSelectConversation}
                    userId={userId}
                    onTabChange={onTabChange}
                />
            )}
            {activeTab === "media" && (
                <MediaTab userId={userId} />
            )}
            {activeTab === "contacts" && (
                <ContactsTab
                    onSelectConversation={onSelectConversation}
                    onTabChange={onTabChange}
                />
            )}
        </div>
    );
}
