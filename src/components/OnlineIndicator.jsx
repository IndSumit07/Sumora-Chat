"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ─── Last Seen Formatter ──────────────────────────────────────────────────────

function formatLastSeen(isoString) {
    if (!isoString) return "offline";
    const date = new Date(isoString);
    const now = new Date();

    const sameDay = (a, b) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const timeStr = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    if (sameDay(date, now)) return `today at ${timeStr}`;
    if (sameDay(date, yesterday)) return `yesterday at ${timeStr}`;
    const dayName = date.toLocaleDateString([], { weekday: "short" });
    return `${dayName} at ${timeStr}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * Shows a green dot when the user is online, or last seen text when offline.
 * Reads is_online directly from profiles — no per-row Presence channel overhead.
 *
 * Props:
 *   userId       — UUID of the user to show status for
 *   showLastSeen — if true and user is offline, show last_seen timestamp
 *   className    — extra class for the wrapper
 */
export default function OnlineIndicator({ userId, showLastSeen = false, className = "" }) {
    const [status, setStatus] = useState({ is_online: false, last_seen: null });

    useEffect(() => {
        if (!userId) return;
        const supabase = createClient();

        // Initial fetch
        supabase
            .from("profiles")
            .select("is_online, last_seen")
            .eq("id", userId)
            .maybeSingle()
            .then(({ data }) => {
                if (data) setStatus({ is_online: data.is_online, last_seen: data.last_seen });
            });

        // Subscribe to UPDATE on this profile row for live status
        const channel = supabase
            .channel(`presence_status:${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "profiles",
                    filter: `id=eq.${userId}`,
                },
                (payload) => {
                    setStatus({
                        is_online: payload.new.is_online,
                        last_seen: payload.new.last_seen,
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    if (status.is_online) {
        return (
            <span className={`inline-flex items-center ${className}`}>
                <span
                    className="w-2.5 h-2.5 rounded-full bg-[#22C55E] shadow-sm shadow-green-400/50"
                    aria-label="Online"
                />
            </span>
        );
    }

    if (showLastSeen) {
        return (
            <span className={`text-[11px] text-[#9CA3AF] font-semibold ${className}`}>
                {status.last_seen ? `last seen ${formatLastSeen(status.last_seen)}` : "offline"}
            </span>
        );
    }

    return (
        <span className={`inline-flex items-center ${className}`}>
            <span
                className="w-2.5 h-2.5 rounded-full bg-[#D1D5DB]"
                aria-label="Offline"
            />
        </span>
    );
}
