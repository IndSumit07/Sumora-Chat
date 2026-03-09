"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { decryptMessage, decryptConversationKey } from "@/lib/crypto";

/**
 * useConversations — fetches all conversations for the current user,
 * decrypts last message, counts unread, and subscribes to Realtime updates.
 * Optimised: uses batched queries to minimise round-trips.
 *
 * @param {string} userId
 * @returns {{ conversations: Array, loading: boolean, refetch: Function }}
 */
export function useConversations(userId) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();

    try {
      // ── 1. Get all conv IDs where I am a participant + my encrypted key ──
      const { data: myParticipants, error: partErr } = await supabase
        .from("conversation_participants")
        .select("conversation_id, encrypted_key")
        .eq("user_id", userId);

      if (partErr) throw partErr;
      if (!myParticipants?.length) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const convIds = myParticipants.map((p) => p.conversation_id);

      // ── 2. Batch-fetch: conversations + all participants + last messages ──
      const [convRes, allParticipantsRes, lastMsgsRes] = await Promise.all([
        supabase
          .from("conversations")
          .select("id, type, name, updated_at")
          .in("id", convIds)
          .order("updated_at", { ascending: false }),

        // All participants for these conversations (to find "other" user)
        supabase
          .from("conversation_participants")
          .select("conversation_id, user_id, encrypted_key")
          .in("conversation_id", convIds),

        // Last message per conversation using a sub-select hack via LIMIT
        // We fetch all messages and pick the last per conv in JS
        supabase
          .from("messages")
          .select(
            "id, conversation_id, encrypted_content, iv, sender_id, type, created_at, status",
          )
          .in("conversation_id", convIds)
          .order("created_at", { ascending: false }),
      ]);

      const convRows = convRes.data ?? [];
      const allParticipants = allParticipantsRes.data ?? [];
      const allMessages = lastMsgsRes.data ?? [];

      // ── 3. Determine "other" user IDs and batch-fetch profiles ──
      const otherUserIds = new Set();
      for (const conv of convRows) {
        const others = allParticipants.filter(
          (p) => p.conversation_id === conv.id && p.user_id !== userId,
        );
        others.forEach((o) => otherUserIds.add(o.user_id));
      }

      let profilesMap = {};
      if (otherUserIds.size > 0) {
        const otherIdsArr = [...otherUserIds];

        // Fetch profiles + custom contact names in parallel
        const [profilesRes, contactsRes] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              "id, full_name, avatar_url, public_key, is_online, last_seen",
            )
            .in("id", otherIdsArr),

          // Get custom names this user gave to their contacts
          supabase
            .from("contacts")
            .select("contact_user_id, contact_name")
            .eq("user_id", userId)
            .in("contact_user_id", otherIdsArr),
        ]);

        // Build a contactName lookup: { [other_user_id]: contact_name }
        const contactNameMap = {};
        for (const c of contactsRes.data ?? []) {
          if (c.contact_name)
            contactNameMap[c.contact_user_id] = c.contact_name;
        }

        for (const p of profilesRes.data ?? []) {
          profilesMap[p.id] = {
            ...p,
            // Prefer custom name, fall back to real profile name
            full_name: contactNameMap[p.id] || p.full_name,
          };
        }
      }

      // ── 4. Build last-message-per-conversation map ──
      const lastMsgMap = {};
      for (const msg of allMessages) {
        if (!lastMsgMap[msg.conversation_id]) {
          lastMsgMap[msg.conversation_id] = msg;
        }
      }

      // ── 5. Build myParticipants map for quick access ──
      const myPartMap = {};
      for (const p of myParticipants) {
        myPartMap[p.conversation_id] = p;
      }

      // ── 6. Assemble conversation objects in parallel ──
      const built = await Promise.all(
        convRows.map(async (conv) => {
          try {
            const myPart = myPartMap[conv.id];
            const others = allParticipants.filter(
              (p) => p.conversation_id === conv.id && p.user_id !== userId,
            );
            const otherPart = others[0];
            const otherProfile = otherPart
              ? (profilesMap[otherPart.user_id] ?? null)
              : null;

            const lastMsg = lastMsgMap[conv.id] ?? null;
            let lastMessageText = "";

            if (lastMsg && myPart?.encrypted_key && otherProfile?.public_key) {
              try {
                const convKey = await decryptConversationKey(
                  myPart.encrypted_key,
                  otherProfile.public_key,
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

            // Unread count — count messages not by me that have status != "read"
            // Approximate: count messages since the participant's last_read_at
            // Using get_unread_count RPC — fire and forget, don't block
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
            console.error("[useConversations] build error:", err.message);
            return null;
          }
        }),
      );

      setConversations(built.filter(Boolean));
    } catch (err) {
      console.error("[useConversations] fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    fetchConversations();

    const supabase = createClient();

    // Realtime: any message insert → refresh the conversation list
    const msgChannel = supabase
      .channel(`conv_list_msgs:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchConversations();
        },
      )
      .subscribe();

    // Realtime: conversation updated
    const convChannel = supabase
      .channel(`conv_list_convs:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
        },
        () => {
          fetchConversations();
        },
      )
      .subscribe();

    // Realtime: profile updates (avatar_url, online status)
    const profileChannel = supabase
      .channel(`conv_list_profiles:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        () => {
          fetchConversations();
        },
      )
      .subscribe();

    // Realtime: contact renamed → re-fetch to show updated custom name
    const contactsChannel = supabase
      .channel(`conv_list_contacts:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contacts",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchConversations();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(convChannel);
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(contactsChannel);
    };
  }, [userId, fetchConversations]);

  return { conversations, loading, refetch: fetchConversations };
}
