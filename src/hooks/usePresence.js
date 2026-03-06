"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Manages global online presence via Supabase Presence channel.
 * Tracks current user as online, listens for others, then unregisters on unmount.
 *
 * @param {string|null} userId
 * @returns {{ onlineUsers: string[] }}  array of user_ids currently online
 */
export function usePresence(userId) {
  const [onlineUsers, setOnlineUsers] = useState([]);

  const markProfile = useCallback(
    async (isOnline) => {
      if (!userId) return;
      const supabase = createClient();
      await supabase
        .from("profiles")
        .update({
          is_online: isOnline,
          ...(isOnline ? {} : { last_seen: new Date().toISOString() }),
        })
        .eq("id", userId);
    },
    [userId],
  );

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    // Mark as online in DB
    markProfile(true);

    const channel = supabase.channel("online:global", {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        // Each key is a user_id; collect all online user IDs
        const ids = Object.keys(state);
        setOnlineUsers(ids);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: userId,
            online_at: Date.now(),
          });
        }
      });

    // On page unload — mark offline + untrack
    const handleBeforeUnload = async () => {
      markProfile(false);
      channel.untrack();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      markProfile(false);
      supabase.removeChannel(channel);
    };
  }, [userId, markProfile]);

  return { onlineUsers };
}
