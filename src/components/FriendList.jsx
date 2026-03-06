"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MessageSquare, Loader2, Users } from "lucide-react";
import { getFriends } from "@/lib/friends";
import { getOrCreateDM } from "@/lib/conversations";

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
    }, [loadFriends]);

    const handleMessageFriend = async (friendId, friendProfile) => {
        setStartingChat(friendId);
        try {
            const convId = await getOrCreateDM(friendId);
            onSelectConversation({
                id: convId,
                otherProfile: friendProfile,
            });
        } catch (err) {
            console.error("Failed to start chat:", err);
            alert("Could not start chat. Ensure both users have logged in at least once to setup keys.");
        } finally {
            setStartingChat(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin text-foreground/30" />
            </div>
        );
    }

    if (friends.length === 0) {
        return (
            <div className="text-center py-8 opacity-50">
                <p className="text-[13px] font-bold">No friends yet</p>
                <p className="text-[11px] mt-1">Add friends by email to chat</p>
            </div>
        );
    }

    return (
        <div className="mt-6 flex flex-col gap-1">
            <h3 className="px-4 text-[11px] font-black uppercase text-foreground/30 mb-2 tracking-wider flex items-center gap-1.5">
                <Users size={12} />
                All Friends — {friends.length}
            </h3>
            {friends.map(({ friend }) => {
                if (!friend) return null;
                const isStarting = startingChat === friend.id;

                return (
                    <div
                        key={friend.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-foreground/5 cursor-pointer transition-all group rounded-xl mx-2"
                        onClick={() => handleMessageFriend(friend.id, friend)}
                    >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-foreground/10 border border-border">
                                {friend.avatar_url ? (
                                    <img src={friend.avatar_url} alt={friend.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-black text-foreground/30 text-[15px]">
                                        {friend.full_name?.charAt(0) ?? "?"}
                                    </div>
                                )}
                            </div>
                            {friend.is_online && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-bold text-foreground truncate">{friend.full_name}</p>
                            <p className="text-[11px] font-semibold text-foreground/40">{friend.is_online ? "Active Now" : "Offline"}</p>
                        </div>

                        {/* Action */}
                        <button
                            disabled={isStarting}
                            className="w-8 h-8 rounded-full bg-foreground/5 text-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-foreground hover:text-background disabled:opacity-50"
                        >
                            {isStarting ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
