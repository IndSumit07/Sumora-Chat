"use client";

import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
} from "react";
import {
    Send,
    Paperclip,
    Image as ImageIcon,
    Smile,
    X,
    CornerUpLeft,
    FileText,
    Loader2,
    Phone,
    Video,
    MoreHorizontal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCrypto } from "@/providers/CryptoProvider";
import { decryptConversationKey, encryptMessage, decryptMessage } from "@/lib/crypto";
import { useTyping } from "@/hooks/useTyping";
import MessageTick from "@/components/MessageTick";
import OnlineIndicator from "@/components/OnlineIndicator";
import { uploadMedia, getMediaMessageType, formatFileSize } from "@/lib/media";
import ChatRightSidebar from "./ChatRightSidebar";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMsgTime(isoString) {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

// ─── Reply Quote Bar ──────────────────────────────────────────────────────────

function ReplyBar({ replyTo, onCancel }) {
    return (
        <div className="flex items-center gap-3 px-5 py-3 bg-[#F0FDF4] border-l-4 border-[#22C55E] mx-4 mb-2 rounded-xl">
            <CornerUpLeft size={14} className="text-[#22C55E] shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-[#22C55E] uppercase tracking-wide mb-0.5">
                    Reply to
                </p>
                <p className="text-[13px] text-black/70 font-semibold truncate">
                    {replyTo._decryptedText ?? "Message"}
                </p>
            </div>
            <button
                onClick={onCancel}
                className="p-1 rounded-lg text-[#888] hover:text-black transition-all"
            >
                <X size={14} />
            </button>
        </div>
    );
}

// ─── Quoted Message Inside Bubble ─────────────────────────────────────────────

function QuotedMessage({ quoted }) {
    if (!quoted) return null;
    return (
        <div className="mb-2 px-3 py-2 bg-black/5 rounded-xl border-l-4 border-[#22C55E]/60">
            <p className="text-[11px] text-[#888] font-bold truncate">
                {quoted._decryptedText ?? "Message"}
            </p>
        </div>
    );
}

// ─── Media Renderer ───────────────────────────────────────────────────────────

function MediaContent({ msg }) {
    if (msg.type === "image" && msg.media_url) {
        return (
            <img
                src={msg.media_url}
                alt="Shared image"
                className="max-w-[240px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-all"
            />
        );
    }
    if (msg.type === "audio" && msg.media_url) {
        return (
            <audio controls src={msg.media_url} className="max-w-[240px]" />
        );
    }
    if (msg.type === "document" && msg.media_url) {
        return (
            <a
                href={msg.media_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 px-4 py-3 bg-white/60 rounded-xl border border-black/10 hover:bg-white/80 transition-all max-w-[240px]"
            >
                <FileText size={22} className="text-[#22C55E] shrink-0" />
                <div className="min-w-0">
                    <p className="text-[13px] font-bold text-black truncate">
                        {msg.file_name ?? "Document"}
                    </p>
                    {msg.file_size && (
                        <p className="text-[11px] text-[#888]">{formatFileSize(msg.file_size)}</p>
                    )}
                </div>
            </a>
        );
    }
    return null;
}

// ─── Typing Dots ──────────────────────────────────────────────────────────────

function TypingDots({ names }) {
    if (!names || names.length === 0) return null;
    const label = names.length === 1
        ? `${names[0]} is typing`
        : `${names.slice(0, 2).join(", ")} are typing`;

    return (
        <div className="flex items-center gap-2 px-8 py-1 text-[12px] text-[#888888] font-semibold">
            <span>{label}</span>
            <span className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                    <span
                        key={i}
                        className="w-1 h-1 rounded-full bg-[#888888] animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                    />
                ))}
            </span>
        </div>
    );
}

// ─── Single Message Bubble ────────────────────────────────────────────────────

function MessageBubble({ msg, myId, allMessages }) {
    const isMe = msg.sender_id === myId;
    const quotedMsg = msg.reply_to_id
        ? allMessages.find((m) => m.id === msg.reply_to_id)
        : null;

    return (
        <div className={`flex gap-3 mb-5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
            {/* Avatar (only for others) */}
            {!isMe && (
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 mt-1 bg-gray-100 border border-gray-200">
                    {msg._senderProfile?.avatar_url ? (
                        <img
                            src={msg._senderProfile.avatar_url}
                            alt={msg._senderProfile.full_name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-[14px] font-black">
                            {msg._senderProfile?.full_name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                    )}
                </div>
            )}

            <div className={`max-w-[65%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                {/* Quoted message */}
                {quotedMsg && <QuotedMessage quoted={quotedMsg} />}

                {/* Bubble */}
                <div
                    className={`px-5 py-3.5 rounded-[20px] shadow-sm
            ${isMe
                            ? "bg-[#22C55E] text-white rounded-tr-[6px]"
                            : "bg-[#F5F5F5] text-black rounded-tl-[6px]"}`}
                >
                    {/* Media */}
                    {msg.type !== "text" && <MediaContent msg={msg} />}

                    {/* Text */}
                    {msg._decryptedText && (
                        <p className="text-[14px] font-semibold leading-relaxed whitespace-pre-wrap">
                            {msg._decryptedText}
                        </p>
                    )}

                    {/* Time + tick */}
                    <div className={`flex items-center gap-1.5 mt-1. text-right justify-end`}>
                        <span className={`text-[10px] font-semibold ${isMe ? "text-white/60" : "text-[#AAAAAA]"}`}>
                            {formatMsgTime(msg.created_at)}
                        </span>
                        {isMe && <MessageTick status={msg.status ?? "sent"} />}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── MAIN CHAT WINDOW ─────────────────────────────────────────────────────────

/**
 * ChatWindow
 * Props:
 *   conversationId  — string UUID of the conversation
 *   otherProfile    — { id, full_name, avatar_url, public_key }
 */
export default function ChatWindow({ conversationId, otherProfile }) {
    const { userId } = useCrypto();
    const convKeyRef = useRef(null);   // CryptoKey — NEVER put in state

    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [text, setText] = useState("");
    const [replyTo, setReplyTo] = useState(null);
    const [sending, setSending] = useState(false);

    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);

    // ─── Typing ───────────────────────────────────────────────────────────────

    const { typingUsers, sendTyping } = useTyping(conversationId, userId);
    const typingNames = typingUsers.map((u) => u.full_name?.split(" ")[0] ?? "Someone");

    // ─── Scroll to bottom ────────────────────────────────────────────────────

    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // ─── Decrypt a message row ───────────────────────────────────────────────

    const decryptOneMsgSafe = useCallback(async (msgRow) => {
        if (!convKeyRef.current) return { ...msgRow, _decryptedText: "" };
        if (msgRow.type !== "text" || !msgRow.encrypted_content || !msgRow.iv) {
            return { ...msgRow, _decryptedText: "" };
        }
        try {
            const plain = await decryptMessage(msgRow.encrypted_content, msgRow.iv, convKeyRef.current);
            // NOTE: We intentionally do NOT log `plain` (security rule)
            return { ...msgRow, _decryptedText: plain };
        } catch {
            return { ...msgRow, _decryptedText: "🔒" };
        }
    }, []);

    // ─── Mount: init key + load messages ────────────────────────────────────

    useEffect(() => {
        if (!conversationId || !userId || !otherProfile) return;

        let cleanedUp = false;
        let channels = [];

        const supabase = createClient();

        const init = async () => {
            setLoadingMessages(true);
            convKeyRef.current = null;

            try {
                // 1. Fetch MY participant row to get encrypted_key
                const { data: myParticipant } = await supabase
                    .from("conversation_participants")
                    .select("encrypted_key")
                    .eq("conversation_id", conversationId)
                    .eq("user_id", userId)
                    .maybeSingle();

                if (!myParticipant?.encrypted_key || !otherProfile?.public_key) {
                    setLoadingMessages(false);
                    return;
                }

                // 2. Decrypt conversation key — store in ref, NEVER state
                const ck = await decryptConversationKey(
                    myParticipant.encrypted_key,
                    otherProfile.public_key,
                    userId
                );
                if (!cleanedUp) convKeyRef.current = ck;
                else return;

                // 3. Fetch last 50 messages
                const { data: rawMsgs } = await supabase
                    .from("messages")
                    .select("*")
                    .eq("conversation_id", conversationId)
                    .order("created_at", { ascending: false })
                    .limit(50);

                const orderedRaw = (rawMsgs ?? []).reverse().map(m => ({
                    ...m,
                    _senderProfile: m.sender_id === userId ? null : otherProfile
                }));
                const decrypted = await Promise.all(orderedRaw.map(decryptOneMsgSafe));
                if (!cleanedUp) setMessages(decrypted);

                // 4. Mark conversation read
                await supabase.rpc("mark_conversation_read", {
                    p_conversation_id: conversationId,
                });
            } catch (err) {
                console.error("[ChatWindow] init error:", err.message);
            } finally {
                if (!cleanedUp) setLoadingMessages(false);
            }

            // ─── Realtime Subscriptions ──────────────────────────────────────────

            // A) New messages INSERT
            const msgChannel = supabase
                .channel(`messages:${conversationId}`)
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "messages",
                        filter: `conversation_id=eq.${conversationId}`,
                    },
                    async (payload) => {
                        if (cleanedUp) return;
                        const payloadMsg = {
                            ...payload.new,
                            _senderProfile: payload.new.sender_id === userId ? null : otherProfile
                        };
                        const newMsg = await decryptOneMsgSafe(payloadMsg);
                        setMessages((prev) => {
                            // Avoid duplicate if optimistic message is already there
                            const exists = prev.some(
                                (m) => m.id === newMsg.id || m._optimisticId === newMsg.id
                            );
                            if (exists) {
                                // Replace optimistic with real
                                return prev.map((m) =>
                                    m._optimisticId === newMsg.id ? newMsg : m
                                );
                            }
                            return [...prev, newMsg];
                        });
                    }
                )
                .subscribe();

            channels.push(msgChannel);

            // B) messages UPDATE → catch status changes (triggered by DB receipt trigger)
            const receiptChannel = supabase
                .channel(`msg_updates:${conversationId}`)
                .on(
                    "postgres_changes",
                    {
                        event: "UPDATE",
                        schema: "public",
                        table: "messages",
                        filter: `conversation_id=eq.${conversationId}`,
                    },
                    (payload) => {
                        if (cleanedUp) return;
                        const { id, status } = payload.new;
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === id ? { ...m, status } : m
                            )
                        );
                    }
                )
                .subscribe();

            channels.push(receiptChannel);
        };

        init();

        return () => {
            cleanedUp = true;
            convKeyRef.current = null;
            channels.forEach((ch) => supabase.removeChannel(ch));
            channels = [];
        };
    }, [conversationId, userId, otherProfile, decryptOneMsgSafe]);

    // ─── Send Message ────────────────────────────────────────────────────────

    const handleSend = useCallback(async () => {
        const trimmed = text.trim();
        if (!trimmed || !convKeyRef.current || sending) return;

        setSending(true);
        const supabase = createClient();
        const tempId = `optimistic_${Date.now()}`;

        // Optimistic UI
        const optimistic = {
            id: tempId,
            _optimisticId: tempId,
            conversation_id: conversationId,
            sender_id: userId,
            type: "text",
            status: "sending",
            created_at: new Date().toISOString(),
            reply_to_id: replyTo?.id ?? null,
            _decryptedText: trimmed,
        };

        setMessages((prev) => [...prev, optimistic]);
        const capturedReplyTo = replyTo;
        setText("");
        setReplyTo(null);

        try {
            const { encryptedContent, iv } = await encryptMessage(trimmed, convKeyRef.current);

            const { data, error } = await supabase
                .from("messages")
                .insert({
                    conversation_id: conversationId,
                    sender_id: userId,
                    encrypted_content: encryptedContent,
                    iv,
                    type: "text",
                    status: "sent",
                    reply_to_id: capturedReplyTo?.id ?? null,
                })
                .select()
                .single();

            if (error) throw error;

            // Replace optimistic with confirmed row
            const confirmed = await decryptOneMsgSafe(data);
            setMessages((prev) =>
                prev.map((m) => (m._optimisticId === tempId ? confirmed : m))
            );
        } catch (err) {
            console.error("[ChatWindow] send error:", err.message);
            // Remove optimistic on fail
            setMessages((prev) => prev.filter((m) => m._optimisticId !== tempId));
        } finally {
            setSending(false);
        }
    }, [text, sending, conversationId, userId, replyTo, decryptOneMsgSafe]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ─── Media Upload ────────────────────────────────────────────────────────

    const handleFileSelect = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file || !convKeyRef.current) return;

        const msgType = getMediaMessageType(file.type);
        const supabase = createClient();
        const tempId = `optimistic_media_${Date.now()}`;

        // Optimistic placeholder
        const optimistic = {
            id: tempId,
            _optimisticId: tempId,
            conversation_id: conversationId,
            sender_id: userId,
            type: msgType,
            status: "sending",
            created_at: new Date().toISOString(),
            _decryptedText: "",
            file_name: file.name,
            file_size: file.size,
            media_url: msgType === "image" ? URL.createObjectURL(file) : null,
        };

        setMessages((prev) => [...prev, optimistic]);

        try {
            const { url, fileName, fileSize } = await uploadMedia(file, conversationId);

            // Encrypt empty caption
            const { encryptedContent, iv } = await encryptMessage("", convKeyRef.current);

            const { data, error } = await supabase
                .from("messages")
                .insert({
                    conversation_id: conversationId,
                    sender_id: userId,
                    encrypted_content: encryptedContent,
                    iv,
                    type: msgType,
                    status: "sent",
                    media_url: url,
                    file_name: fileName,
                    file_size: fileSize,
                })
                .select()
                .single();

            if (error) throw error;

            setMessages((prev) =>
                prev.map((m) => (m._optimisticId === tempId ? { ...data, _decryptedText: "" } : m))
            );
        } catch (err) {
            console.error("[ChatWindow] media upload error:", err.message);
            setMessages((prev) => prev.filter((m) => m._optimisticId !== tempId));
        }

        // Reset file input
        e.target.value = "";
    }, [conversationId, userId]);

    // ─── Render ───────────────────────────────────────────────────────────────

    if (!conversationId) {
        return (
            <section className="flex-1 flex flex-col items-center justify-center bg-background text-foreground/30 gap-4 border-r border-border">
                <div className="w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center">
                    <Send size={28} className="text-foreground/20" />
                </div>
                <p className="text-[15px] font-bold">Select a conversation to start chatting</p>
                <p className="text-[13px] font-medium text-foreground/20">Your messages are end-to-end encrypted</p>
            </section>
        );
    }

    return (
        <div className="flex-1 flex h-full min-w-0">
            {/* Main Chat Area */}
            <section className="flex-1 flex flex-col bg-white dark:bg-black relative overflow-hidden border-r border-[#EEEEEE] dark:border-foreground/10 h-full">
                {/* ── Header ─────────────────────────────────────────────────── */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-[#F5F5F5] dark:border-foreground/10 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-foreground/5 rounded-xl text-[14px] font-bold">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                            New
                        </div>
                        <button className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-bold text-foreground/60 hover:text-foreground hover:bg-foreground/5 rounded-lg transition-all">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                            Move to Closed
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] font-bold text-amber-500">Not assigned</span>
                            <div className="flex -space-x-1 hover:space-x-1 transition-all cursor-pointer">
                                <button className="w-6 h-6 rounded-full bg-foreground/10 border-2 border-background flex items-center justify-center -ml-1 text-[10px] text-foreground hover:bg-foreground hover:text-background">+</button>
                                <button className="w-6 h-6 rounded-full bg-foreground/10 border-2 border-background flex items-center justify-center -ml-1">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                </button>
                                <button className="w-6 h-6 rounded-full bg-foreground/10 border-2 border-background flex items-center justify-center -ml-1">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7" y2="7" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Messages ───────────────────────────────────────────────── */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar"
                >
                    {loadingMessages ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 size={24} className="animate-spin text-[#BBBBBB]" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-[#BBBBBB] gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-[#F0FDF4] flex items-center justify-center">
                                <Send size={22} className="text-[#22C55E]" />
                            </div>
                            <p className="text-[14px] font-bold">
                                Say hi to {otherProfile?.full_name?.split(" ")[0] ?? "them"}!
                            </p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className="group relative"
                            >
                                <MessageBubble msg={msg} myId={userId} allMessages={messages} />

                                {/* Reply button on hover */}
                                <button
                                    onClick={() => setReplyTo(msg)}
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-white/80 shadow-sm text-[#888] hover:text-black"
                                    title="Reply"
                                >
                                    <CornerUpLeft size={13} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* ── Typing Indicator ───────────────────────────────────────── */}
                <TypingDots names={typingNames} />

                {/* ── Reply Bar ──────────────────────────────────────────────── */}
                {replyTo && (
                    <ReplyBar replyTo={replyTo} onCancel={() => setReplyTo(null)} />
                )}

                {/* ── Input ──────────────────────────────────────────────────── */}
                <div className="p-5 pt-3 border-t border-[#F5F5F5] dark:border-foreground/10 shrink-0">
                    <div className="relative group">
                        <div className="bg-[#F8F9FA] dark:bg-foreground/5 rounded-[22px] p-2 flex items-center gap-2 border border-transparent group-focus-within:border-foreground/10 transition-all shadow-sm">
                            {/* Text input */}
                            <input
                                id="chat-message-input"
                                type="text"
                                value={text}
                                onChange={(e) => {
                                    setText(e.target.value);
                                    sendTyping();
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your message..."
                                className="flex-1 bg-transparent border-none outline-none py-3 px-4 text-[14px] font-semibold text-foreground placeholder:text-foreground/40"
                            />

                            {/* Right icons */}
                            <div className="flex items-center gap-1 pr-1">
                                <button className="p-2 text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-full transition-all">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                </button>
                                <button className="p-2 text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-full transition-all">
                                    <Smile size={18} />
                                </button>
                                <button className="p-2 text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-full transition-all">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                                </button>
                                <button
                                    id="chat-attach-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-full transition-all"
                                    title="Attach file"
                                >
                                    <Paperclip size={18} />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                                <button
                                    id="chat-send-btn"
                                    onClick={handleSend}
                                    disabled={!text.trim() || sending}
                                    className="w-11 h-11 bg-black dark:bg-white text-white dark:text-black rounded-[16px] ml-1 flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {sending ? (
                                        <Loader2 size={17} className="animate-spin" />
                                    ) : (
                                        <Send size={17} />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Right details sidebar */}
            <ChatRightSidebar otherProfile={otherProfile} />
        </div>
    );
}
