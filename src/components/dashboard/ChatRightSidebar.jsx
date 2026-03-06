"use client";

import React, { useState } from "react";
import {
    Phone,
    Edit2,
    Bell,
    MessageSquare,
    UserPlus,
    Settings,
    Flag,
    Ban
} from "lucide-react";
import OnlineIndicator from "@/components/OnlineIndicator";

export default function ChatRightSidebar({ otherProfile }) {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    if (!otherProfile) return null;

    return (
        <aside className="w-[300px] bg-background border-l border-border h-full shrink-0 flex flex-col z-40 overflow-y-auto no-scrollbar">
            {/* User Profile Header */}
            <div className="p-6 flex flex-col items-center border-b border-border/50">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-foreground/10 border-2 border-border mb-3 relative">
                    {otherProfile.avatar_url ? (
                        <img
                            src={otherProfile.avatar_url}
                            alt={otherProfile.full_name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-foreground/30 text-xl">
                            {otherProfile.full_name?.charAt(0) ?? "?"}
                        </div>
                    )}
                </div>
                <h3 className="text-lg font-black text-foreground">{otherProfile.full_name}</h3>
                <a href="#" className="flex items-center gap-1.5 text-[12px] font-bold text-foreground/50 hover:text-foreground mt-1">
                    <span className="w-4 h-4 rounded bg-amber-400 flex items-center justify-center text-white text-[10px]">T</span>
                    https://sumora.com/{otherProfile.full_name?.replace(/\s+/g, '').toLowerCase()}
                </a>

                {/* Actions */}
                <div className="flex gap-2 w-full mt-5">
                    <button className="flex-1 max-w-[48px] h-10 rounded-xl border border-emerald-500/30 text-emerald-500 flex items-center justify-center hover:bg-emerald-500/10 transition-all">
                        <Phone size={18} />
                    </button>
                    <button className="flex-1 max-w-[48px] h-10 rounded-xl border border-border text-foreground/60 flex items-center justify-center hover:bg-foreground/5 transition-all">
                        <Edit2 size={16} />
                    </button>
                    <button className="flex-1 h-10 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[13px] font-bold hover:opacity-90 transition-all">
                        Unsubscribe
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="p-6 border-b border-border/50 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-foreground/50 text-[13px] font-bold">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        </div>
                        Status:
                    </div>
                    <span className="text-[13px] font-bold text-emerald-500 flex items-center gap-1.5">
                        <OnlineIndicator userId={otherProfile.id} showLastSeen={false} /> Active
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-foreground/50 text-[13px] font-bold">
                        <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                            <span className="text-[10px]">◎</span>
                        </div>
                        Appeals:
                    </div>
                    <span className="text-[14px] font-bold text-foreground">2</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-foreground/50 text-[13px] font-bold">
                        <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                            <span className="text-[10px]">👁</span>
                        </div>
                        Last Contact
                    </div>
                    <span className="text-[14px] font-bold text-foreground">1hr ago</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-foreground/50 text-[13px] font-bold">
                        <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                            <span className="text-[10px]">👤</span>
                        </div>
                        Subscribed
                    </div>
                    <span className="text-[14px] font-bold text-foreground">9 Days ago</span>
                </div>
            </div>

            {/* Notifications Section */}
            <div className="p-6 border-b border-border/50">
                <h4 className="text-[13px] font-black tracking-wide text-foreground flex items-center gap-2 mb-4">
                    <Bell size={14} />
                    Notifications
                </h4>

                <div className="space-y-4">
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/40 shrink-0">
                            <span className="text-[12px]">↻</span>
                        </div>
                        <div>
                            <p className="text-[13px] font-bold text-foreground leading-none">5 Deals Pending</p>
                            <span className="text-[11px] font-semibold text-foreground/40">Just now</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                            <MessageSquare size={13} fill="currentColor" />
                        </div>
                        <div>
                            <p className="text-[13px] font-bold text-foreground leading-none">New Message</p>
                            <span className="text-[11px] font-semibold text-foreground/40">12 hours ago</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                            <UserPlus size={14} />
                        </div>
                        <div>
                            <p className="text-[13px] font-bold text-foreground leading-none">New user registered</p>
                            <span className="text-[11px] font-semibold text-foreground/40">59 minutes ago</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Settings */}
            <div className="p-6">
                <h4 className="text-[13px] font-black tracking-wide text-foreground flex items-center gap-2 mb-4">
                    <Settings size={14} />
                    User Settings
                </h4>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                <Bell size={14} fill="currentColor" />
                            </div>
                            <span className="text-[14px] font-bold text-foreground">Notifications</span>
                        </div>
                        {/* Custom Toggle */}
                        <button
                            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                            className={`w-10 h-6 rounded-full p-1 transition-all ${notificationsEnabled ? 'bg-emerald-500' : 'bg-foreground/20'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${notificationsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="flex items-center gap-3 cursor-pointer group">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                            <Flag size={14} />
                        </div>
                        <span className="text-[14px] font-bold text-foreground/70 group-hover:text-amber-500 transition-all">Report</span>
                    </div>

                    <div className="flex items-center gap-3 cursor-pointer group">
                        <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all">
                            <Ban size={14} />
                        </div>
                        <span className="text-[14px] font-bold text-foreground/70 group-hover:text-rose-500 transition-all">Block</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
