"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck, UserPlus, X } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useCrypto } from "@/providers/CryptoProvider";

function formatTime(isoString) {
    const date = new Date(isoString);
    const diffMins = Math.floor((Date.now() - date) / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffH = Math.floor(diffMins / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return `${Math.floor(diffH / 24)}d ago`;
}

function NotificationItem({ notif, onMarkRead }) {
    const isFriend = notif.type === "friend_request";
    return (
        <div
            onClick={() => !notif.is_read && onMarkRead(notif.id)}
            className={`flex gap-3 px-4 py-3.5 cursor-pointer transition-all hover:bg-foreground/5 border-b border-border/50 last:border-0
                ${!notif.is_read ? "bg-emerald-500/5" : ""}`}
        >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                ${isFriend ? "bg-emerald-500/10 text-emerald-500" : "bg-foreground/5 text-foreground/40"}`}>
                {isFriend ? <UserPlus size={14} /> : <Bell size={14} />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground leading-snug">{notif.title}</p>
                {notif.body && (
                    <p className="text-[12px] text-foreground/50 mt-0.5 line-clamp-2">{notif.body}</p>
                )}
                <p className="text-[11px] text-foreground/30 font-medium mt-1">{formatTime(notif.created_at)}</p>
            </div>
            {!notif.is_read && (
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
            )}
        </div>
    );
}

export default function NotificationBell() {
    const { userId } = useCrypto();
    const { notifications, unreadCount, markRead, markAllRead } = useNotifications(userId);
    const [open, setOpen] = useState(false);
    const panelRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
        };
        if (open) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    return (
        <div ref={panelRef} className="relative">
            <button
                id="notification-bell"
                onClick={() => setOpen((v) => !v)}
                className="relative w-11 h-11 flex items-center justify-center rounded-2xl text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                /* 
                  KEY FIX: "left-full ml-3" positions the panel to the RIGHT of the sidebar,
                  not above/below. On mobile we use a fixed position centered on screen.
                */
                <div className="hidden sm:block absolute left-full ml-3 top-1/2 -translate-y-1/2 w-[340px] bg-background border border-border rounded-2xl shadow-2xl shadow-black/10 z-[500] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
                        <span className="text-[14px] font-bold text-foreground">
                            Notifications
                            {unreadCount > 0 && (
                                <span className="ml-2 text-[12px] font-semibold text-emerald-500">{unreadCount} new</span>
                            )}
                        </span>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button onClick={markAllRead}
                                    className="text-[11px] font-semibold text-foreground/40 hover:text-foreground transition-colors flex items-center gap-1">
                                    <CheckCheck size={12} /> Mark all read
                                </button>
                            )}
                            <button onClick={() => setOpen(false)}
                                className="p-1 text-foreground/30 hover:text-foreground transition-colors rounded-lg hover:bg-foreground/5">
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-2 text-foreground/30">
                                <Bell size={24} />
                                <p className="text-[12px] font-semibold">All caught up!</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <NotificationItem key={n.id} notif={n} onMarkRead={markRead} />
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Mobile: full-screen overlay */}
            {open && (
                <div className="sm:hidden fixed inset-0 z-[500] flex flex-col">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
                    <div className="relative mt-auto bg-background rounded-t-3xl border-t border-border shadow-2xl max-h-[70vh] flex flex-col">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                            <span className="text-[15px] font-bold text-foreground">Notifications</span>
                            <button onClick={() => setOpen(false)} className="p-1.5 rounded-xl bg-foreground/5 text-foreground/60">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: "none" }}>
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-2 text-foreground/30">
                                    <Bell size={24} />
                                    <p className="text-[12px] font-semibold">All caught up!</p>
                                </div>
                            ) : notifications.map((n) => (
                                <NotificationItem key={n.id} notif={n} onMarkRead={markRead} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
