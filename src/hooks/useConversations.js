"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { decryptMessage, decryptConversationKey } from "@/lib/crypto";

/**
 * useConversations — fetches all conversations for the current user,
 * decrypts last message, counts unread, and subscribes to Realtime updates.
 *
 * @param {string} userId
 * @returns {{ conversations: Array, loading: boolean }}
 */
export function useConversations(userId) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const buildConversation = useCallback(async (supabase, conv, userId) => {
    try {
      // Fetch other participant (for DM: the person who isn't me)
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("user_id, encrypted_key")
        .eq("conversation_id", conv.id);

      const myParticipant = participants?.find((p) => p.user_id === userId);
      const otherParticipant = participants?.find((p) => p.user_id !== userId);

      let otherProfile = null;
      let senderPublicKey = null;

      if (otherParticipant) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, public_key, is_online, last_seen")
          .eq("id", otherParticipant.user_id)
          .maybeSingle();
        otherProfile = profile;
        senderPublicKey = profile?.public_key;
      }

      // Fetch last message
      const { data: lastMsgRows } = await supabase
        .from("messages")
        .select(
          "id, encrypted_content, iv, sender_id, type, created_at, status",
        )
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const lastMsg = lastMsgRows?.[0] ?? null;
      let lastMessageText = "";

      if (lastMsg && myParticipant?.encrypted_key && senderPublicKey) {
        try {
          const convKey = await decryptConversationKey(
            myParticipant.encrypted_key,
            senderPublicKey,
            userId,
          );
          if (
            lastMsg.type === "text" &&
            lastMsg.encrypted_content &&
            lastMsg.iv
          ) {
            lastMessageText = await decryptMessage(
              lastMsg.encrypted_content,
              lastMsg.iv,
              convKey,
            );
          } else {
            const typeLabel = {
              image: "📷 Image",
              audio: "🎵 Audio",
              document: "📄 Document",
            };
            lastMessageText = typeLabel[lastMsg.type] ?? "Message";
          }
        } catch {
          lastMessageText = "🔒 Encrypted message";
        }
      }

      // Unread count via RPC
      let unreadCount = 0;
      try {
        const { data: count } = await supabase.rpc("get_unread_count", {
          p_conversation_id: conv.id,
        });
        unreadCount = count ?? 0;
      } catch {
        unreadCount = 0;
      }

      return {
        id: conv.id,
        type: conv.type,
        name: conv.name,
        otherProfile,
        lastMessage: lastMsg
          ? {
              text: lastMessageText,
              time: lastMsg.created_at,
              status: lastMsg.status,
              senderId: lastMsg.sender_id,
            }
          : null,
        unreadCount,
        updatedAt: conv.updated_at,
      };
    } catch (err) {
      console.error("[useConversations] buildConversation error:", err.message);
      return null;
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();

    // Get all conversation IDs where I am a participant
    const { data: participantRows, error } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", userId);

    if (error) {
      console.error("[useConversations] fetch error:", error.message);
      setLoading(false);
      return;
    }

    const convIds = (participantRows ?? []).map((r) => r.conversation_id);
    if (convIds.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const { data: convRows } = await supabase
      .from("conversations")
      .select("id, type, name, updated_at")
      .in("id", convIds)
      .order("updated_at", { ascending: false });

    const built = await Promise.all(
      (convRows ?? []).map((c) => buildConversation(supabase, c, userId)),
    );

    setConversations(built.filter(Boolean));
    setLoading(false);
  }, [userId, buildConversation]);

  useEffect(() => {
    if (!userId) return;

    fetchConversations();

    const supabase = createClient();

    // Realtime: UPDATE on conversations table — refresh if one of mine changed
    const channel = supabase
      .channel(`conversations_list:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
        },
        async (payload) => {
          const updated = payload.new;
          // Re-build only this conversation for efficiency
          const refreshed = await buildConversation(supabase, updated, userId);
          if (!refreshed) return;

          setConversations((prev) => {
            const exists = prev.some((c) => c.id === refreshed.id);
            if (!exists) return [refreshed, ...prev];
            return prev
              .map((c) => (c.id === refreshed.id ? refreshed : c))
              .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchConversations, buildConversation]);

  return { conversations, loading };
}
