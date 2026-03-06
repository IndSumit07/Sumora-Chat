"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, ListFilter, CheckCheck, Loader2, PlaySquare, Plus } from "lucide-react";
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
        className={`relative flex items-center gap-4 px-4 py-4 cursor-pointer transition-all duration-300 mx-2 rounded-2xl mb-1
        ${active ? "bg-emerald-500/10" : "hover:bg-foreground/[0.02]"}`}
    >
        {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-full" />}
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
            {isOnline && <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background shadow-sm" />}
        </div>
        <div className="flex-1 min-w-0 border-b border-border/50 py-1">
            <div className="flex justify-between items-baseline mb-1">
                <h3 className={`text-[15px] font-bold truncate ${active ? "text-foreground" : "text-foreground/90"}`}>{title}</h3>
                <span className={`text-[11px] font-bold ${unread ? "text-indigo-500" : "text-foreground/30"}`}>{time}</span>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                    {!unread && lastMsg && <CheckCheck size={14} className="text-foreground/30 shrink-0" />}
                    <p className={`text-[13px] truncate ${unread ? "text-foreground font-bold" : "text-foreground/50"}`}>{lastMsg}</p>
                </div>
                {unread > 0 && <div className="min-w-[20px] h-5 rounded-full bg-foreground text-background text-[10px] font-black flex items-center justify-center px-1 shadow-md">{unread}</div>}
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
                .select('id, type, media_url, file_name, file_size, created_at, sender_id')
                .in('conversation_id', convIds)
                .neq('sender_id', userId)
                .neq('type', 'text')
                .order('created_at', { ascending: false });

            if (messagesData && isMounted && messagesData.length > 0) {
                const uniqueSenders = [...new Set(messagesData.map(m => m.sender_id))];
                const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', uniqueSenders);
                const mapped = messagesData.map(m => ({
                    ...m,
                    senderName: profiles?.find(p => p.id === m.sender_id)?.full_name || 'Unknown'
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
                                {item.type === 'image' ? (
                                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-border/50">
                                        <img src={item.media_url} alt="Media" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-foreground/5 flex flex-col items-center justify-center text-[10px] font-black text-foreground/50 border border-border/50 shrink-0 uppercase tracking-widest">
                                        {item.type}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-bold text-foreground truncate">{item.file_name || 'Unnamed file'}</p>
                                    <p className="text-[12px] font-semibold text-foreground/50 truncate mt-0.5">From {item.senderName}</p>
                                    {item.file_size > 0 && (
                                        <p className="text-[10px] font-black text-foreground/30 uppercase mt-1">
                                            {formatFileSize(item.file_size)}
                                        </p>
                                    )}
                                </div>
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
            <div className="px-6 pt-6 pb-2 shrink-0">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black tracking-tight text-foreground">Inbox</h2>
                    <button
                        onClick={() => onTabChange("contacts")}
                        className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:bg-emerald-500/20 transition-all border border-emerald-500/10"
                        title="New Message"
                    >
                        <MessageSquarePlus size={20} />
                    </button>
                </div>

                <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-foreground/30">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search chats..."
                        className="w-full bg-foreground/5 border border-transparent rounded-full py-2.5 pl-11 pr-4 text-[13px] outline-none focus:bg-transparent focus:border-border transition-all placeholder:text-foreground/30 font-bold"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-6 flex flex-col">
                <div className="px-6 mt-2">
                    <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar py-1">
                        <FilterBtn id="all" label="Recent Chats" />
                        <FilterBtn id="unread" label="Unread" />
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 size={22} className="animate-spin text-foreground/30" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center opacity-40">
                            <p className="text-[13px] font-bold">
                                {search ? "No results" : "No recent conversations"}
                            </p>
                        </div>
                    ) : (
                        <div className="-mx-2">
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
            <div className="px-6 pt-6 pb-2 shrink-0">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => onTabChange("chat")}
                        className="w-9 h-9 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground hover:bg-foreground/10 transition-all"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <h2 className="text-xl font-black tracking-tight text-foreground">Address Book</h2>
                </div>

                <div className="mb-6 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-5 rounded-[24px] border border-emerald-500/10">
                        <h4 className="text-[14px] font-black text-emerald-600 dark:text-emerald-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                            Add New Contact
                        </h4>
                        <AddFriend />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-6 flex flex-col">
                <div className="px-6 mb-4">
                    <h3 className="text-[12px] font-bold text-foreground/40 uppercase tracking-widest px-2">Recent Contacts</h3>
                </div>
                <FriendList onSelectConversation={handleSelectContact} />
            </div>
        </div>
    );
}

// ─── Main ConversationList ────────────────────────────────────────────────────

export default function ConversationList({ activeTab, width = 380, selectedConvId, onSelectConversation, onTabChange }) {
    const { userId } = useCrypto();

    return (
        <aside
            style={{ width: `${width}px` }}
            className="flex flex-col bg-background h-full border-r border-border shrink-0 z-40 transition-all duration-300"
        >
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
        </aside>
    );
}
