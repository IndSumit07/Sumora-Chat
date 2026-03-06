"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Check, X, UserCheck, Loader2, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { acceptFriendRequest, rejectFriendRequest } from "@/lib/friends";
import { useCrypto } from "@/providers/CryptoProvider";

// ─── Individual Request Row ───────────────────────────────────────────────────

function RequestRow({ request, onAction }) {
    const [loading, setLoading] = useState(null); // "accept" | "reject" | null

    const handle = async (action) => {
        setLoading(action);
        try {
            if (action === "accept") await acceptFriendRequest(request.id);
            else await rejectFriendRequest(request.id);
            onAction(request.id, action);
        } catch (err) {
            console.error("Friend request action failed:", err.message);
        } finally {
            setLoading(null);
        }
    };

    const profile = request.requester_profile;

    return (
        <div className="flex items-center gap-4 px-5 py-4 hover:bg-[#F8F9FA] transition-all border-b border-[#F0F0F0] last:border-0">
            {/* Avatar */}
            <div className="w-11 h-11 rounded-full overflow-hidden border border-gray-200 shrink-0 bg-gray-100">
                {profile?.avatar_url ? (
                    <img
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[16px] font-black text-gray-400">
                        {profile?.full_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-[14px] font-black text-black truncate">
                    {profile?.full_name ?? "Unknown User"}
                </p>
                <p className="text-[12px] text-[#AAAAAA] font-semibold">
                    Sent you a friend request
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => handle("reject")}
                    disabled={!!loading}
                    aria-label="Reject friend request"
                    className="p-2 rounded-xl text-[#888888] hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-40"
                >
                    {loading === "reject" ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <X size={16} />
                    )}
                </button>
                <button
                    onClick={() => handle("accept")}
                    disabled={!!loading}
                    aria-label="Accept friend request"
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#22C55E] text-white text-[12px] font-bold rounded-xl hover:bg-[#16A34A] active:scale-95 transition-all disabled:opacity-40"
                >
                    {loading === "accept" ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <Check size={14} />
                    )}
                    Accept
                </button>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FriendRequests() {
    const { userId } = useCrypto();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = useCallback(async () => {
        if (!userId) return;
        const supabase = createClient();

        const { data, error } = await supabase
            .from("friendships")
            .select(`
        id,
        requester_id,
        created_at,
        requester_profile:profiles!friendships_requester_id_fkey(
          id, full_name, avatar_url
        )
      `)
            .eq("addressee_id", userId)
            .eq("status", "pending")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("fetchRequests error:", error.message);
        } else {
            setRequests(data ?? []);
        }
        setLoading(false);
    }, [userId]);

    useEffect(() => {
        if (!userId) return;
        fetchRequests();

        const supabase = createClient();

        // Realtime: live new friend requests
        const channel = supabase
            .channel(`friend_requests:${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "friendships",
                    filter: `addressee_id=eq.${userId}`,
                },
                async (payload) => {
                    // Fetch requester profile for the new row
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("id, full_name, avatar_url")
                        .eq("id", payload.new.requester_id)
                        .maybeSingle();

                    setRequests((prev) => [
                        { ...payload.new, requester_profile: profile },
                        ...prev,
                    ]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, fetchRequests]);

    // Remove actioned requests from local state
    const handleAction = (friendshipId) => {
        setRequests((prev) => prev.filter((r) => r.id !== friendshipId));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 size={22} className="animate-spin text-[#BBBBBB]" />
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-[#BBBBBB]">
                <UserCheck size={32} />
                <p className="text-[14px] font-bold">No pending friend requests</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-[#EEEEEE] overflow-hidden bg-white">
            <div className="px-5 py-3 border-b border-[#F0F0F0] flex items-center gap-2">
                <Users size={15} className="text-[#888888]" />
                <span className="text-[13px] font-black text-black/60 uppercase tracking-wider">
                    Pending Requests
                </span>
                <span className="ml-auto w-5 h-5 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center">
                    {requests.length}
                </span>
            </div>
            {requests.map((r) => (
                <RequestRow key={r.id} request={r} onAction={handleAction} />
            ))}
        </div>
    );
}
