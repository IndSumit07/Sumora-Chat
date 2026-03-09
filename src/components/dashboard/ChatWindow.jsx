"use client";

import React, {
    useState, useRef, useEffect, useCallback,
} from "react";
import dynamic from "next/dynamic";
import {
    Send, Paperclip, Smile, X, CornerUpLeft,
    FileText, Loader2, Phone, Video, MoreHorizontal,
    Trash2, MessageSquare, ChevronDown, Lock, ArrowLeft,
    Copy, Pencil, Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCrypto } from "@/providers/CryptoProvider";
import { decryptConversationKey, encryptMessage, decryptMessage } from "@/lib/crypto";
import { useTyping } from "@/hooks/useTyping";
import MessageTick from "@/components/MessageTick";
import { uploadMedia, getMediaMessageType, formatFileSize } from "@/lib/media";

const EmojiPicker = dynamic(
    () => import("@emoji-mart/react").then((m) => m.default),
    { ssr: false, loading: () => null }
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function groupByDate(messages) {
    const groups = [];
    let lastDate = null;
    for (const msg of messages) {
        const date = fmtDate(msg.created_at);
        if (date !== lastDate) {
            groups.push({ type: "date", label: date, key: `date-${date}-${msg.id}` });
            lastDate = date;
        }
        groups.push({ type: "msg", msg, key: msg.id });
    }
    return groups;
}

// ─── Media Renderer ───────────────────────────────────────────────────────────

function MediaContent({ msg, isMe }) {
    const [err, setErr] = useState(false);

    if ((msg.type === "image" || msg.type === "gif") && msg.media_url) {
        return err ? (
            <div className="w-52 h-36 rounded-2xl bg-white/10 flex items-center justify-center text-white/40">
                <FileText size={24} />
            </div>
        ) : (
            <img
                src={msg.media_url}
                alt="Image"
                className="max-w-[260px] max-h-[320px] rounded-2xl object-cover cursor-pointer hover:brightness-90 transition-all"
                onError={() => setErr(true)}
                onClick={() => window.open(msg.media_url, "_blank")}
            />
        );
    }
    if (msg.type === "video" && msg.media_url) {
        return (
            <video
                controls
                src={msg.media_url}
                className="max-w-[280px] rounded-2xl"
                style={{ maxHeight: 200 }}
            />
        );
    }
    if (msg.type === "audio" && msg.media_url) {
        return <audio controls src={msg.media_url} className="max-w-[220px] mt-1 accent-emerald-500" />;
    }
    if (msg.media_url) {
        const name = msg.file_name ?? msg.media_type ?? "File";
        const size = msg.file_size ?? msg.media_size ?? 0;
        return (
            <a
                href={msg.media_url}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border max-w-[240px] transition-all
                    ${isMe
                        ? "bg-white/10 border-white/10 hover:bg-white/20"
                        : "bg-zinc-50 border-zinc-100 hover:bg-zinc-100 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
                    }`}
            >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isMe ? "bg-white/10" : "bg-emerald-500/10"}`}>
                    <FileText size={17} className={isMe ? "text-white/70" : "text-emerald-500"} />
                </div>
                <div className="min-w-0">
                    <p className={`text-[13px] font-semibold truncate ${isMe ? "text-white" : "text-foreground"}`}>{name}</p>
                    {size > 0 && (
                        <p className={`text-[11px] mt-0.5 ${isMe ? "text-white/50" : "text-foreground/40"}`}>{formatFileSize(size)}</p>
                    )}
                </div>
            </a>
        );
    }
    return null;
}

// ─── Message Context Menu ──────────────────────────────────────────────────────

function MessageMenu({ msg, isMe, onCopy, onEdit, onDelete, onReply }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        onCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div
            className={`absolute top-1/2 -translate-y-1/2 z-30 flex items-center gap-0.5
                opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none group-hover:pointer-events-auto
                ${isMe ? "right-full mr-2" : "left-full ml-2"}`}
        >
            <div className="flex items-center gap-0.5 bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-lg px-1 py-1">
                {/* Reply */}
                <button
                    onClick={() => onReply?.(msg)}
                    title="Reply"
                    className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all"
                >
                    <CornerUpLeft size={14} />
                </button>

                {/* Copy — only for text messages */}
                {msg.type === "text" && msg._decryptedText && (
                    <button
                        onClick={handleCopy}
                        title="Copy"
                        className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all"
                    >
                        {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                )}

                {/* Edit — only my text messages */}
                {isMe && msg.type === "text" && (
                    <button
                        onClick={() => onEdit(msg)}
                        title="Edit"
                        className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all"
                    >
                        <Pencil size={14} />
                    </button>
                )}

                {/* Delete — only my messages */}
                {isMe && (
                    <button
                        onClick={() => onDelete(msg)}
                        title="Delete"
                        className="p-1.5 rounded-lg text-foreground/40 hover:text-red-500 hover:bg-red-500/5 transition-all"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function Bubble({ msg, myId, allMessages, onReply, onEdit, onDelete }) {
    const isMe = msg.sender_id === myId;
    const quoted = msg.reply_to_id ? allMessages.find((m) => m.id === msg.reply_to_id) : null;
    const isMedia = msg.type !== "text";
    const hasText = !!msg._decryptedText;

    const handleCopy = () => {
        if (msg._decryptedText) {
            navigator.clipboard.writeText(msg._decryptedText).catch(() => { });
        }
    };

    return (
        <div className={`flex items-end gap-2.5 mb-1 group ${isMe ? "flex-row-reverse" : "flex-row"}`}>
            {/* Other user avatar */}
            {!isMe && (
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 mb-0.5 bg-zinc-200 dark:bg-zinc-700">
                    {msg._senderProfile?.avatar_url ? (
                        <img src={msg._senderProfile.avatar_url} alt="" className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = "none"; }} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[11px] font-black text-zinc-500 dark:text-zinc-300">
                            {msg._senderProfile?.full_name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                    )}
                </div>
            )}

            <div className={`max-w-[65%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                {/* Reply context */}
                {quoted && (
                    <div className={`px-3 py-2 rounded-xl text-[13px] border-l-2 border-emerald-500 max-w-full
                        ${isMe ? "bg-emerald-700/40 text-white/70" : "bg-zinc-300/60 dark:bg-white/10 text-zinc-700 dark:text-zinc-300"}
                        `}>
                        <p className="truncate">{quoted._decryptedText || "📎 Media"}</p>
                    </div>
                )}

                {/* Main bubble */}
                <div className="relative">
                    {/* Hover action buttons */}
                    <MessageMenu
                        msg={msg}
                        isMe={isMe}
                        onCopy={handleCopy}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onReply={onReply}
                    />

                    {isMedia ? (
                        /* ── Media message — no bubble background ── */
                        <div className="flex flex-col gap-1.5">
                            <MediaContent msg={msg} isMe={isMe} />
                            {hasText && (
                                <p className={`text-[15px] leading-relaxed px-1 ${isMe ? "text-right" : "text-left"} text-foreground/80`}>
                                    {msg._decryptedText}
                                </p>
                            )}
                            <div className={`flex items-center gap-1 mt-0.5 ${isMe ? "justify-end" : "justify-start"}`}>
                                <span className="text-[11px] text-foreground/30 font-medium">{fmtTime(msg.created_at)}</span>
                                {isMe && <MessageTick status={msg.status ?? "sent"} />}
                            </div>
                        </div>
                    ) : (
                        /* ── Text bubble ── */
                        <div className={`px-5 py-3 rounded-2xl
                            ${isMe
                                ? "bg-emerald-600 text-white rounded-br-sm"
                                : "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-bl-sm"
                            }`}
                        >
                            {msg.status === "sending" ? (
                                <p className="text-[15px] font-medium leading-relaxed opacity-70">{msg._decryptedText}</p>
                            ) : (
                                <p className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap">{msg._decryptedText}</p>
                            )}
                            <div className={`flex items-center gap-1.5 mt-1.5 ${isMe ? "justify-end" : "justify-start"}`}>
                                {msg.is_edited && (
                                    <span className={`text-[10px] font-medium italic ${isMe ? "text-white/50" : "text-zinc-500 dark:text-zinc-400"}`}>
                                        edited
                                    </span>
                                )}
                                <span className={`text-[11px] font-medium ${isMe ? "text-white/60" : "text-zinc-500 dark:text-zinc-400"}`}>
                                    {fmtTime(msg.created_at)}
                                </span>
                                {isMe && <MessageTick status={msg.status ?? "sent"} />}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* My side spacer */}
            {isMe && <div className="w-1.5 shrink-0" />}
        </div>
    );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteModal({ onConfirm, onCancel, loading }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={onCancel}>
            <div
                className="bg-background border border-border rounded-2xl shadow-2xl p-6 w-[300px] flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                        <Trash2 size={20} className="text-red-500" />
                    </div>
                    <div>
                        <p className="text-[15px] font-bold text-foreground">Delete Message?</p>
                        <p className="text-[12px] text-foreground/40 mt-1">This action cannot be undone.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-foreground/5 text-foreground/70 text-[13px] font-semibold hover:bg-foreground/10 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator({ names }) {
    if (!names?.length) return null;
    return (
        <div className="flex items-center gap-2 px-4 py-2">
            <div className="flex gap-1 items-center">
                {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }} />
                ))}
            </div>
            <span className="text-[12px] text-foreground/40 font-medium">{names[0]} is typing…</span>
        </div>
    );
}

// ─── Date Divider ─────────────────────────────────────────────────────────────

function DateDivider({ label }) {
    return (
        <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-[11px] font-semibold text-foreground/30 bg-background px-2">{label}</span>
            <div className="flex-1 h-px bg-border/50" />
        </div>
    );
}

// ─── MAIN CHAT WINDOW ─────────────────────────────────────────────────────────

export default function ChatWindow({ conversationId, otherProfile, onBack }) {
    const { userId } = useCrypto();
    const convKeyRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [text, setText] = useState("");
    const [replyTo, setReplyTo] = useState(null);
    const [sending, setSending] = useState(false);
    const [showContactInfo, setShowContactInfo] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [emojiData, setEmojiData] = useState(null);
    const [showScrollBtn, setShowScrollBtn] = useState(false);

    // Edit state
    const [editingMsg, setEditingMsg] = useState(null); // the message being edited
    const [editText, setEditText] = useState("");
    const [saving, setSaving] = useState(false);

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const inputRef = useRef(null);
    const editInputRef = useRef(null);

    // Load emoji data lazily
    useEffect(() => {
        if (showEmojiPicker && !emojiData) {
            import("@emoji-mart/data").then((m) => setEmojiData(m.default ?? m));
        }
    }, [showEmojiPicker, emojiData]);

    // Close emoji on outside click
    useEffect(() => {
        const handler = (e) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
                setShowEmojiPicker(false);
            }
        };
        if (showEmojiPicker) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showEmojiPicker]);

    // Focus edit input when editing starts
    useEffect(() => {
        if (editingMsg) {
            setTimeout(() => editInputRef.current?.focus(), 50);
        }
    }, [editingMsg]);

    // Scroll-to-bottom button
    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 200);
    };

    const scrollToBottom = useCallback((smooth = false) => {
        if (scrollRef.current) {
            // Wait for paint frame so height is accurate
            setTimeout(() => {
                scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: smooth ? "smooth" : "auto" });
            }, 50);
        }
    }, []);

    useEffect(() => {
        if (messages.length > 0) scrollToBottom(true);
    }, [messages, scrollToBottom]);

    const { typingUsers, sendTyping } = useTyping(conversationId, userId);

    // ─── Decrypt ──────────────────────────────────────────────────────────────

    const decryptOneMsgSafe = useCallback(async (msgRow) => {
        if (!convKeyRef.current || msgRow.type !== "text") return { ...msgRow, _decryptedText: "" };
        if (!msgRow.encrypted_content || !msgRow.iv) return { ...msgRow, _decryptedText: "" };
        try {
            const plain = await decryptMessage(msgRow.encrypted_content, msgRow.iv, convKeyRef.current);
            return { ...msgRow, _decryptedText: plain };
        } catch {
            return { ...msgRow, _decryptedText: "🔒" };
        }
    }, []);

    // ─── Init ─────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!conversationId || !userId || !otherProfile) return;
        let gone = false;
        const supabase = createClient();
        const msgCh = supabase.channel(`convo_events:${conversationId}`);

        const init = async () => {
            setLoadingMessages(true);
            convKeyRef.current = null;
            setMessages([]);

            try {
                const { data: myPart } = await supabase
                    .from("conversation_participants")
                    .select("encrypted_key")
                    .eq("conversation_id", conversationId)
                    .eq("user_id", userId)
                    .maybeSingle();

                if (!myPart?.encrypted_key || !otherProfile?.public_key) {
                    setLoadingMessages(false);
                    return;
                }

                const ck = await decryptConversationKey(myPart.encrypted_key, otherProfile.public_key, userId);
                if (!gone) convKeyRef.current = ck; else return;

                const { data: raw } = await supabase
                    .from("messages")
                    .select("*")
                    .eq("conversation_id", conversationId)
                    .order("created_at", { ascending: false })
                    .limit(60);

                const ordered = (raw ?? []).reverse().map((m) => ({
                    ...m,
                    _senderProfile: m.sender_id !== userId ? otherProfile : null,
                }));
                const decrypted = await Promise.all(ordered.map(decryptOneMsgSafe));

                if (!gone) {
                    setMessages(decrypted);
                    setTimeout(() => scrollToBottom(false), 100); // hard scroll initially
                }

                await supabase.rpc("mark_conversation_read", { p_conversation_id: conversationId });
            } catch (e) {
                console.error("[ChatWindow] init:", e.message);
            } finally {
                if (!gone) setLoadingMessages(false);
            }

            // Bind single realtime channel
            msgCh
                .on("postgres_changes", {
                    event: "INSERT", schema: "public", table: "messages",
                    filter: `conversation_id=eq.${conversationId}`,
                }, async (p) => {
                    if (gone) return;
                    const nm = await decryptOneMsgSafe({
                        ...p.new,
                        _senderProfile: p.new.sender_id !== userId ? otherProfile : null,
                    });
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === nm.id)) return prev.map((m) => m.id === nm.id ? nm : m);
                        return [...prev, nm];
                    });
                })
                .on("postgres_changes", {
                    event: "UPDATE", schema: "public", table: "messages",
                    filter: `conversation_id=eq.${conversationId}`,
                }, async (p) => {
                    if (gone) return;
                    const updated = await decryptOneMsgSafe({
                        ...p.new,
                        _senderProfile: p.new.sender_id !== userId ? otherProfile : null,
                    });
                    setMessages((prev) => prev.map((m) => m.id === updated.id ? updated : m));
                })
                .on("postgres_changes", {
                    event: "DELETE", schema: "public", table: "messages",
                    filter: `conversation_id=eq.${conversationId}`,
                }, (p) => {
                    if (gone) return;
                    setMessages((prev) => prev.filter((m) => m.id !== p.old.id));
                })
                .subscribe();
        };

        init();
        return () => {
            gone = true;
            convKeyRef.current = null;
            supabase.removeChannel(msgCh);
        };
    }, [conversationId, userId, otherProfile, decryptOneMsgSafe, scrollToBottom]);

    // ─── Send ─────────────────────────────────────────────────────────────────

    const handleSend = useCallback(async () => {
        const trimmed = text.trim();
        if (!trimmed || !convKeyRef.current || sending) return;
        setSending(true);
        const supabase = createClient();
        const tempId = crypto.randomUUID();

        const optimistic = {
            id: tempId, conversation_id: conversationId, sender_id: userId,
            type: "text", status: "sending", created_at: new Date().toISOString(),
            reply_to_id: replyTo?.id ?? null, _decryptedText: trimmed,
        };
        setMessages((p) => [...p, optimistic]);
        const capturedReply = replyTo;
        setText(""); setReplyTo(null); setShowEmojiPicker(false);

        try {
            const { encryptedContent, iv } = await encryptMessage(trimmed, convKeyRef.current);
            const { data, error } = await supabase.from("messages")
                .insert({ id: tempId, conversation_id: conversationId, sender_id: userId, encrypted_content: encryptedContent, iv, type: "text", status: "sent", reply_to_id: capturedReply?.id ?? null })
                .select().single();
            if (error) throw error;
            const confirmed = await decryptOneMsgSafe({ ...data, _senderProfile: null });
            setMessages((p) => p.map((m) => m.id === tempId ? confirmed : m));
        } catch (e) {
            console.error("[ChatWindow] send:", e.message);
            setMessages((p) => p.filter((m) => m.id !== tempId));
        } finally {
            setSending(false);
        }
    }, [text, sending, conversationId, userId, replyTo, decryptOneMsgSafe]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
        if (e.key === "Escape") setShowEmojiPicker(false);
    };

    // ─── Emoji ────────────────────────────────────────────────────────────────

    const handleEmojiSelect = useCallback((emoji) => {
        setText((p) => p + (emoji.native ?? emoji.emoji ?? ""));
        setTimeout(() => inputRef.current?.focus(), 0);
    }, []);

    // ─── File Upload ──────────────────────────────────────────────────────────

    const handleFileSelect = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file || !convKeyRef.current) { e.target.value = ""; return; }

        const msgType = getMediaMessageType(file.type);
        const supabase = createClient();
        const tempId = crypto.randomUUID();

        const optimistic = {
            id: tempId, conversation_id: conversationId, sender_id: userId,
            type: msgType, status: "sending", created_at: new Date().toISOString(),
            _decryptedText: "", file_name: file.name, file_size: file.size,
            media_size: file.size, media_type: file.type,
            media_url: (msgType === "image" || msgType === "video" || msgType === "gif")
                ? URL.createObjectURL(file) : null,
            _senderProfile: null,
        };
        setMessages((p) => [...p, optimistic]);
        setSending(true);

        try {
            const { url, fileName, fileSize, mimeType } = await uploadMedia(file, conversationId);
            const { encryptedContent, iv } = await encryptMessage("", convKeyRef.current);
            const { data, error } = await supabase.from("messages")
                .insert({
                    id: tempId, conversation_id: conversationId, sender_id: userId,
                    encrypted_content: encryptedContent, iv, type: msgType, status: "sent",
                    media_url: url, file_name: fileName, file_size: fileSize,
                    media_type: mimeType, media_size: fileSize,
                })
                .select().single();
            if (error) throw error;
            const confirmed = await decryptOneMsgSafe({ ...data, _senderProfile: null });
            setMessages((p) => p.map((m) => m.id === tempId ? confirmed : m));
        } catch (e) {
            console.error("[ChatWindow] upload:", e.message);
            setMessages((p) => p.filter((m) => m.id !== tempId));
        } finally {
            setSending(false);
            e.target.value = "";
        }
    }, [conversationId, userId, decryptOneMsgSafe]);

    // ─── Edit Message ─────────────────────────────────────────────────────────

    const handleStartEdit = useCallback((msg) => {
        setEditingMsg(msg);
        setEditText(msg._decryptedText ?? "");
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditingMsg(null);
        setEditText("");
    }, []);

    const handleSaveEdit = useCallback(async () => {
        const trimmed = editText.trim();
        if (!trimmed || !convKeyRef.current || !editingMsg || saving) return;
        setSaving(true);
        try {
            const supabase = createClient();
            const { encryptedContent, iv } = await encryptMessage(trimmed, convKeyRef.current);
            const { data, error } = await supabase
                .from("messages")
                .update({ encrypted_content: encryptedContent, iv, is_edited: true })
                .eq("id", editingMsg.id)
                .eq("sender_id", userId)
                .select()
                .single();
            if (error) throw error;
            const updated = await decryptOneMsgSafe({
                ...data,
                _senderProfile: editingMsg._senderProfile,
            });
            setMessages((p) => p.map((m) => m.id === updated.id ? updated : m));
            setEditingMsg(null);
            setEditText("");
        } catch (e) {
            console.error("[ChatWindow] edit:", e.message);
        } finally {
            setSaving(false);
        }
    }, [editText, editingMsg, saving, userId, decryptOneMsgSafe]);

    const handleEditKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
        if (e.key === "Escape") handleCancelEdit();
    };

    // ─── Delete Message ───────────────────────────────────────────────────────

    const handleDeleteConfirm = useCallback(async () => {
        if (!deleteTarget || deleting) return;
        setDeleting(true);
        try {
            const supabase = createClient();

            // 1. Delete the physical file from storage if this is a media message
            if (deleteTarget.media_url) {
                try {
                    // media_url format: .../storage/v1/object/public/chat-media/conversationId/filename.ext
                    const parts = deleteTarget.media_url.split("/chat-media/");
                    if (parts.length === 2) {
                        const filePath = parts[1]; // "conversationId/filename.ext"
                        await supabase.storage.from("chat-media").remove([filePath]);
                    }
                } catch (err) {
                    console.error("[ChatWindow] storage delete:", err.message);
                }
            }

            // 2. Delete the record from the database
            const { error } = await supabase
                .from("messages")
                .delete()
                .eq("id", deleteTarget.id)
                .eq("sender_id", userId);

            if (error) throw error;

            // 3. Update the UI optimistically
            setMessages((p) => p.filter((m) => m.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch (e) {
            console.error("[ChatWindow] delete:", e.message);
        } finally {
            setDeleting(false);
        }
    }, [deleteTarget, deleting, userId]);

    // ─── Empty state ──────────────────────────────────────────────────────────

    if (!conversationId) {
        return (
            <section className="flex-1 flex flex-col items-center justify-center bg-background h-full gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <MessageSquare size={26} className="text-emerald-500" />
                </div>
                <div className="text-center">
                    <p className="text-[15px] font-semibold text-foreground/70">Select a conversation</p>
                    <p className="text-[12px] text-foreground/30 mt-1 flex items-center gap-1 justify-center">
                        <Lock size={10} /> End-to-end encrypted
                    </p>
                </div>
            </section>
        );
    }

    const grouped = groupByDate(messages);

    return (
        <div className="flex-1 flex h-full min-w-0 overflow-hidden">
            {/* Delete confirm modal */}
            {deleteTarget && (
                <DeleteModal
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                    loading={deleting}
                />
            )}

            <section className="flex-1 flex flex-col bg-background h-full relative overflow-hidden">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="h-[60px] px-5 flex items-center justify-between border-b border-border/60 shrink-0 bg-background/80 backdrop-blur-sm">
                    <div className="flex items-center gap-2 min-w-0">
                        {/* Mobile back button */}
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="sm:hidden p-2 -ml-1 rounded-xl text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-all shrink-0"
                            >
                                <ArrowLeft size={18} />
                            </button>
                        )}
                        <div
                            className="flex items-center gap-3 min-w-0 cursor-pointer"
                            onClick={() => setShowContactInfo(!showContactInfo)}
                        >
                            <div className="relative shrink-0">
                                <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700">
                                    {otherProfile?.avatar_url ? (
                                        <img src={otherProfile.avatar_url} alt="" className="w-full h-full object-cover"
                                            onError={(e) => { e.target.style.display = "none"; }} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-bold text-zinc-500 dark:text-zinc-300 text-[13px]">
                                            {otherProfile?.full_name?.charAt(0) ?? "?"}
                                        </div>
                                    )}
                                </div>
                                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background
                                ${otherProfile?.is_online ? "bg-emerald-500" : "bg-zinc-400"}`} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[14px] font-semibold text-foreground truncate leading-tight">
                                    {otherProfile?.full_name || "Contact"}
                                </p>
                                <p className={`text-[11px] font-medium ${otherProfile?.is_online ? "text-emerald-500" : "text-foreground/30"}`}>
                                    {otherProfile?.is_online ? "Active now" : "Offline"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 text-foreground/40 shrink-0">
                        <button className="p-2 rounded-xl hover:bg-foreground/5 hover:text-foreground transition-all" onClick={(e) => e.stopPropagation()}>
                            <Video size={18} />
                        </button>
                        <button className="p-2 rounded-xl hover:bg-foreground/5 hover:text-foreground transition-all" onClick={(e) => e.stopPropagation()}>
                            <Phone size={17} />
                        </button>
                        <button className="p-2 rounded-xl hover:bg-foreground/5 hover:text-foreground transition-all">
                            <MoreHorizontal size={18} />
                        </button>
                    </div>
                </div>

                {showContactInfo ? (
                    /* ── Contact Info ───────────────────────────────────────── */
                    <div className="flex-1 overflow-y-auto flex flex-col items-center py-10 px-6 bg-zinc-50 dark:bg-zinc-950">
                        <div className="w-full max-w-xs flex flex-col items-center gap-4">
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 shadow-xl">
                                {otherProfile?.avatar_url ? (
                                    <img src={otherProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-black text-zinc-400 text-4xl">
                                        {otherProfile?.full_name?.charAt(0) ?? "?"}
                                    </div>
                                )}
                            </div>
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-foreground">{otherProfile?.full_name}</h2>
                                <p className="text-[13px] text-foreground/40 mt-0.5">{otherProfile?.email || ""}</p>
                            </div>

                            <div className="flex gap-3">
                                {[
                                    { icon: MessageSquare, label: "Message", action: () => setShowContactInfo(false) },
                                    { icon: Phone, label: "Call", action: () => { } },
                                    { icon: Video, label: "Video", action: () => { } },
                                ].map(({ icon: Icon, label, action }) => (
                                    <button key={label} onClick={action}
                                        className="flex flex-col items-center gap-1.5 px-5 py-3 rounded-2xl bg-background border border-border hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all">
                                        <Icon size={18} className="text-emerald-500" />
                                        <span className="text-[11px] font-semibold text-foreground/60">{label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="w-full rounded-2xl bg-background border border-border divide-y divide-border overflow-hidden">
                                {["Block Contact", "Report", "Delete Chat"].map((label) => (
                                    <button key={label}
                                        className="w-full px-4 py-3 text-left text-[13px] font-medium text-red-500 hover:bg-red-500/5 transition-colors flex items-center justify-between">
                                        {label}
                                        <Trash2 size={14} className="opacity-40" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ── Messages Area ───────────────────────────────────── */}
                        <div
                            ref={scrollRef}
                            onScroll={handleScroll}
                            className="flex-1 overflow-y-auto px-5 pt-4 pb-2"
                            style={{ scrollbarWidth: "none" }}
                        >
                            {loadingMessages ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 size={22} className="animate-spin text-foreground/20" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                        <Send size={20} className="text-emerald-500" />
                                    </div>
                                    <p className="text-[13px] font-medium">Say hi to {otherProfile?.full_name?.split(" ")[0]}!</p>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    {grouped.map((item) =>
                                        item.type === "date"
                                            ? <DateDivider key={item.key} label={item.label} />
                                            : <Bubble
                                                key={item.key}
                                                msg={item.msg}
                                                myId={userId}
                                                allMessages={messages}
                                                onReply={setReplyTo}
                                                onEdit={handleStartEdit}
                                                onDelete={setDeleteTarget}
                                            />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Scroll-to-bottom pill */}
                        {showScrollBtn && (
                            <button
                                onClick={() => scrollToBottom(true)}
                                className="absolute bottom-24 right-5 p-2 bg-background border border-border rounded-full shadow-lg text-foreground/60 hover:text-foreground transition-all z-20"
                            >
                                <ChevronDown size={16} />
                            </button>
                        )}

                        {/* ── Typing ──────────────────────────────────────────── */}
                        <TypingIndicator names={typingUsers.map((u) => u.full_name?.split(" ")[0] ?? "Someone")} />

                        {/* ── Reply Bar ───────────────────────────────────────── */}
                        {replyTo && (
                            <div className="mx-4 mb-2 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-border rounded-2xl flex items-center gap-3">
                                <div className="w-0.5 h-8 bg-emerald-500 rounded-full shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-0.5">Replying</p>
                                    <p className="text-[12px] text-foreground/60 truncate">{replyTo._decryptedText || "📎 Media"}</p>
                                </div>
                                <button onClick={() => setReplyTo(null)} className="p-1 text-foreground/30 hover:text-foreground rounded-lg transition-colors">
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        {/* ── Edit Bar ────────────────────────────────────────── */}
                        {editingMsg && (
                            <div className="mx-4 mb-2 px-4 py-2.5 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex items-center gap-3">
                                <div className="w-0.5 h-8 bg-blue-500 rounded-full shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider mb-0.5">Editing message</p>
                                    <p className="text-[12px] text-foreground/40 truncate">{editingMsg._decryptedText}</p>
                                </div>
                                <button onClick={handleCancelEdit} className="p-1 text-foreground/30 hover:text-foreground rounded-lg transition-colors">
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        {/* ── Emoji Picker ────────────────────────────────────── */}
                        {showEmojiPicker && (
                            <div ref={emojiPickerRef}
                                className="absolute bottom-[76px] right-4 z-50 shadow-2xl rounded-2xl overflow-hidden border border-border">
                                {emojiData ? (
                                    <EmojiPicker
                                        data={emojiData} onEmojiSelect={handleEmojiSelect}
                                        theme="auto" previewPosition="none" skinTonePosition="none"
                                        maxFrequentRows={2} perLine={8} emojiSize={20} emojiButtonSize={30}
                                    />
                                ) : (
                                    <div className="p-5 bg-background">
                                        <Loader2 size={18} className="animate-spin text-foreground/30" />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Input Bar ───────────────────────────────────────── */}
                        <div className="px-4 pb-4 pt-2 shrink-0">
                            <div className="flex items-center gap-2 bg-foreground/5 dark:bg-foreground/10 rounded-2xl px-3 py-2 border border-transparent focus-within:border-emerald-500/30 focus-within:bg-background-secondary transition-all shadow-sm">
                                <input
                                    ref={editingMsg ? editInputRef : inputRef}
                                    id="chat-message-input"
                                    type="text"
                                    value={editingMsg ? editText : text}
                                    onChange={(e) => {
                                        if (editingMsg) setEditText(e.target.value);
                                        else { setText(e.target.value); sendTyping(); }
                                    }}
                                    onKeyDown={editingMsg ? handleEditKeyDown : handleKeyDown}
                                    placeholder={editingMsg ? "Edit message…" : "Message..."}
                                    className="flex-1 bg-transparent border-none outline-none py-2 px-2 text-[14px] font-medium text-foreground placeholder:text-foreground/30"
                                />

                                <div className="flex items-center gap-0.5 shrink-0">
                                    {editingMsg ? (
                                        /* Edit mode buttons */
                                        <>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="p-2 rounded-xl text-foreground/30 hover:text-foreground hover:bg-foreground/5 transition-all"
                                                title="Cancel edit"
                                            >
                                                <X size={17} />
                                            </button>
                                            <button
                                                onClick={handleSaveEdit}
                                                disabled={!editText.trim() || saving}
                                                className={`ml-1 w-9 h-9 rounded-xl flex items-center justify-center transition-all
                                                    ${editText.trim() && !saving
                                                        ? "bg-blue-500 text-white hover:bg-blue-600 shadow-sm shadow-blue-500/30 active:scale-95"
                                                        : "bg-foreground/5 text-foreground/20 cursor-not-allowed"
                                                    }`}
                                                title="Save edit"
                                            >
                                                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                                            </button>
                                        </>
                                    ) : (
                                        /* Normal send buttons */
                                        <>
                                            <button
                                                id="chat-emoji-btn"
                                                onClick={() => setShowEmojiPicker((p) => !p)}
                                                className={`p-2 rounded-xl transition-all ${showEmojiPicker ? "text-emerald-500 bg-emerald-500/10" : "text-foreground/30 hover:text-foreground hover:bg-foreground/5"}`}
                                            >
                                                <Smile size={18} />
                                            </button>
                                            <button
                                                id="chat-attach-btn"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-2 rounded-xl text-foreground/30 hover:text-foreground hover:bg-foreground/5 transition-all"
                                            >
                                                <Paperclip size={17} />
                                            </button>
                                            <input ref={fileInputRef} type="file" className="hidden"
                                                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                                                onChange={handleFileSelect} />

                                            <button
                                                id="chat-send-btn"
                                                onClick={handleSend}
                                                disabled={!text.trim() || sending}
                                                className={`ml-1 w-9 h-9 rounded-xl flex items-center justify-center transition-all
                                                    ${text.trim() && !sending
                                                        ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/30 active:scale-95"
                                                        : "bg-foreground/5 text-foreground/20 cursor-not-allowed"
                                                    }`}
                                            >
                                                {sending
                                                    ? <Loader2 size={15} className="animate-spin" />
                                                    : <Send size={15} className={text.trim() ? "" : ""} />
                                                }
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
