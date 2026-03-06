"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Manages notifications for the current user.
 * Fetches on mount, subscribes Realtime for live inserts.
 * @param {string} userId
 * @returns {{ notifications, unreadCount, markRead, markAllRead }}
 */
export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const calcUnread = (list) => list.filter((n) => !n.is_read).length;

  // ─── Initial Fetch ─────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[useNotifications] fetch error:", error.message);
      return;
    }

    const list = data ?? [];
    setNotifications(list);
    setUnreadCount(calcUnread(list));
  }, [userId]);

  // ─── Realtime Subscription & Mount ────────────────────────────────────────

  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    const supabase = createClient();

    const channel = supabase
      .channel(`notifs:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new;
          setNotifications((prev) => [newNotif, ...prev]);
          // Only increment if not already read (shouldn't be, but safe)
          if (!newNotif.is_read) {
            setUnreadCount((c) => c + 1);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const markRead = useCallback(async (id) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      console.error("[useNotifications] markRead error:", error.message);
      return;
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("[useNotifications] markAllRead error:", error.message);
      return;
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [userId]);

  return { notifications, unreadCount, markRead, markAllRead };
}
