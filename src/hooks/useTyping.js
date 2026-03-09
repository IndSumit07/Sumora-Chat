"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Manages typing presence for a conversation.
 *
 * @param {string} conversationId
 * @param {string} userId  - current user's id
 * @returns {{ typingUsers: Array, sendTyping: Function }}
 *   typingUsers — array of profile objects currently typing (excluding me)
 *   sendTyping  — call on every keystroke
 */
export function useTyping(conversationId, userId) {
  const [typingUsers, setTypingUsers] = useState([]);
  const channelRef = useRef(null);
  const debounceRef = useRef(null);
  const lastSentRef = useRef(0);

  // Fetch profiles for typing users
  const resolveProfiles = useCallback(async (userIds) => {
    if (!userIds || userIds.length === 0) {
      setTypingUsers([]);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);
    setTypingUsers(data ?? []);
  }, []);

  useEffect(() => {
    if (!conversationId || !userId) return;

    const supabase = createClient();

    const channel = supabase.channel(`typing:${conversationId}`, {
      config: { presence: { key: userId } },
    });

    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        // Collect user_ids of anyone with typing: true, excluding myself
        const typingIds = Object.entries(state)
          .filter(([uid, presenceList]) => {
            if (uid === userId) return false;
            const latest = presenceList?.[presenceList.length - 1];
            return latest?.typing === true;
          })
          .map(([uid]) => uid);

        resolveProfiles(typingIds);
      })
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, userId, resolveProfiles]);

  /**
   * Call on keystroke. Throttles tracking to avoid network lag per keystroke.
   */
  const sendTyping = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;

    const now = Date.now();
    // Throttle the typing=true payload to once every 2 seconds
    if (now - lastSentRef.current > 2000) {
      channel.track({ user_id: userId, typing: true });
      lastSentRef.current = now;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      channel.track({ user_id: userId, typing: false });
      lastSentRef.current = 0; // reset
    }, 2500);
  }, [userId]);

  return { typingUsers, sendTyping };
}
