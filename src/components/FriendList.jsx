"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MessageSquare, Loader2, Users, Phone, Video } from "lucide-react";
import { getFriends } from "@/lib/friends";
import { getOrCreateDM } from "@/lib/conversations";
import { createClient } from "@/lib/supabase/client";

export default function FriendList({ onSelectConversation }) {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startingChat, setStartingChat] = useState(null);

    const loadFriends = useCallback(async () => {
        try {
            const list = await getFriends();
            setFriends(list);
        } catch (err) {
            console.error("Failed to load friends:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadFriends();

        const supabase = createClient();
        const channel = supabase.channel("friend-list-updates")
            .on("postgres_changes", { event: "*", schema: "public", table: "contacts" }, () => {
                loadFriends();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [loadFriends]);

    const handleMessageFriend = async (friendId, friendProfile) => {
        setStartingChat(friendId);
        try {
            const convId = await getOrCreateDM(friendId);
            onSelectConversation({ id: convId, otherProfile: friendProfile });
        } catch (err) {
            console.error("Failed to start chat:", err);
            alert("Could not start chat. Make sure both users have logged in at least once.");
        } finally {
            setStartingChat(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 size={18} className="animate-spin text-foreground/20" />
            </div>
        );
    }

    if (friends.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-2 px-4 text-center">
                <div className="w-10 h-10 rounded-2xl bg-foreground/5 flex items-center justify-center mb-1">
                    <Users size={18} className="text-foreground/20" />
                </div>
                <p className="text-[13px] font-medium text-foreground/40">No contacts yet</p>
                <p className="text-[11px] text-foreground/25">Add someone using their email above</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col px-2">
            {friends.map(({ friend }) => {
                if (!friend) return null;
                const isStarting = startingChat === friend.id;

                return (
                    <div
                        key={friend.id}
                        className="flex items-center gap-3 px-3 py-3 hover:bg-foreground/3 cursor-pointer transition-all rounded-xl group"
                        onClick={() => handleMessageFriend(friend.id, friend)}
                    >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700">
                                {friend.avatar_url ? (
                                    <img
                                        src={friend.avatar_url}
                                        alt={friend.full_name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.style.display = "none"; }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-semibold text-zinc-500 dark:text-zinc-300 text-[13px]">
                                        {friend.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                                    </div>
                                )}
                            </div>
                            {friend.is_online && (
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background" />
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-[13.5px] font-semibold text-foreground truncate leading-tight">
                                {friend.full_name}
                            </p>
                            <p className={`text-[11px] mt-0.5 font-medium ${friend.is_online ? "text-emerald-500" : "text-foreground/30"}`}>
                                {friend.is_online ? "Active now" : "Offline"}
                            </p>
                        </div>

                        {/* Message button */}
                        <button
                            disabled={isStarting}
                            onClick={(e) => { e.stopPropagation(); handleMessageFriend(friend.id, friend); }}
                            className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-40 shrink-0"
                            title="Send message"
                        >
                            {isStarting
                                ? <Loader2 size={13} className="animate-spin" />
                                : <MessageSquare size={13} />
                            }
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
