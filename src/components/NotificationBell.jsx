"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck, UserPlus, X } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useCrypto } from "@/providers/CryptoProvider";
import { acceptFriendRequest, rejectFriendRequest } from "@/lib/friends";

// ─── Timestamp Formatter ─────────────────────────────────────────────────────

function formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "yesterday";
    return `${diffDays}d ago`;
}

// ─── Notification Item ────────────────────────────────────────────────────────

function NotificationItem({ notif, onMarkRead, onAction }) {
    const isFriendRequest = notif.type === "friend_request";
    const [acting, setActing] = useState(null);

    const handleFriendAction = async (action) => {
        if (!notif.data?.friendship_id) return;
        setActing(action);
        try {
            if (action === "accept") {
                await acceptFriendRequest(notif.data.friendship_id);
            } else {
                await rejectFriendRequest(notif.data.friendship_id);
            }
            onMarkRead(notif.id);
            if (onAction) onAction(notif.id, action);
        } catch (err) {
            console.error("Notification friend action failed:", err.message);
        } finally {
            setActing(null);
        }
    };

    return (
        <div
            onClick={() => !notif.is_read && onMarkRead(notif.id)}
            className={`flex gap-3 px-4 py-3.5 cursor-pointer transition-all hover:bg-[#F8F9FA] border-b border-[#F5F5F5] last:border-0
        ${!notif.is_read ? "bg-[#F0FDF4] border-l-2 border-l-[#22C55E]" : ""}`}
        >
            {/* Icon */}
            <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0
          ${isFriendRequest ? "bg-[#DCFCE7] text-[#16A34A]" : "bg-[#F3F4F6] text-[#6B7280]"}`}
            >
                {isFriendRequest ? <UserPlus size={16} /> : <Bell size={16} />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-black leading-snug">{notif.title}</p>
                {notif.body && (
                    <p className="text-[12px] text-[#888888] font-medium mt-0.5 line-clamp-2">
                        {notif.body}
                    </p>
                )}
                <p className="text-[11px] text-[#BBBBBB] font-semibold mt-1">
                    {formatTime(notif.created_at)}
                </p>

                {/* Inline Accept/Reject for friend request notifications */}
                {isFriendRequest && !notif.is_read && (
                    <div className="flex items-center gap-2 mt-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleFriendAction("reject"); }}
                            disabled={!!acting}
                            className="px-3 py-1.5 text-[11px] font-bold text-[#888888] bg-gray-100 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-40"
                        >
                            {acting === "reject" ? "…" : "Decline"}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleFriendAction("accept"); }}
                            disabled={!!acting}
                            className="px-3 py-1.5 text-[11px] font-bold text-white bg-[#22C55E] rounded-lg hover:bg-[#16A34A] transition-all disabled:opacity-40"
                        >
                            {acting === "accept" ? "…" : "Accept"}
                        </button>
                    </div>
                )}
            </div>

            {/* Unread dot */}
            {!notif.is_read && (
                <div className="w-2 h-2 rounded-full bg-[#22C55E] shrink-0 mt-1.5" />
            )}
        </div>
    );
}

// ─── Main Bell Component ──────────────────────────────────────────────────────

export default function NotificationBell() {
    const { userId } = useCrypto();
    const { notifications, unreadCount, markRead, markAllRead } =
        useNotifications(userId);
    const [open, setOpen] = useState(false);
    const panelRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    return (
        <div ref={panelRef} className="relative">
            {/* Bell Button */}
            <button
                id="notification-bell"
                onClick={() => setOpen((v) => !v)}
                className="relative w-12 h-12 flex items-center justify-center rounded-2xl text-foreground/30 hover:text-foreground hover:bg-foreground/5 transition-all"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-md">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div className="absolute right-0 top-12 w-[360px] bg-white rounded-2xl shadow-2xl border border-[#EEEEEE] z-[500] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F0F0]">
                        <span className="text-[15px] font-black text-black">
                            Notifications
                            {unreadCount > 0 && (
                                <span className="ml-2 text-[12px] font-bold text-[#22C55E]">
                                    {unreadCount} new
                                </span>
                            )}
                        </span>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="flex items-center gap-1.5 text-[12px] font-bold text-[#888888] hover:text-black transition-all"
                                >
                                    <CheckCheck size={14} />
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1 text-[#BBBBBB] hover:text-black transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[420px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-[#BBBBBB]">
                                <Bell size={28} />
                                <p className="text-[13px] font-bold">All caught up!</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <NotificationItem
                                    key={n.id}
                                    notif={n}
                                    onMarkRead={markRead}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
