"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { User, Settings, LogOut, ChevronRight, LayoutDashboard } from "lucide-react";
import { toast } from "react-hot-toast";

export default function UserButton() {
    const { user, signOut } = useAuth();
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!user) return null;

    const initials = user.email ? user.email.charAt(0).toUpperCase() : "U";
    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || "User";

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 active:scale-95 border border-transparent hover:border-black/10 dark:hover:border-white/10"
                style={{
                    backgroundColor: "var(--fg-primary)",
                    color: "var(--bg-primary)",
                    fontSize: 14,
                    fontWeight: 700,
                }}
            >
                {initials}
            </button>

            {open && (
                <div
                    className="absolute right-0 mt-3 w-72 rounded-2xl overflow-hidden z-50 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{
                        backgroundColor: "var(--bg-primary)",
                        border: "1px solid var(--border)",
                        backdropFilter: "blur(20px)",
                    }}
                >
                    {/* Header */}
                    <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                                style={{ backgroundColor: "var(--bg-pill)", color: "var(--fg-primary)" }}
                            >
                                {initials}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-sm truncate max-w-[180px]" style={{ color: "var(--fg-primary)" }}>
                                    {fullName}
                                </span>
                                <span className="text-xs truncate max-w-[180px]" style={{ color: "var(--fg-secondary)" }}>
                                    {user.email}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-2 flex flex-col gap-1">
                        <button
                            onClick={() => {
                                setOpen(false);
                                router.push("/dashboard/chat");
                            }}
                            className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <LayoutDashboard size={18} style={{ color: "var(--fg-secondary)" }} />
                                <span className="text-sm font-medium" style={{ color: "var(--fg-primary)" }}>Dashboard</span>
                            </div>
                            <ChevronRight size={14} style={{ color: "var(--fg-muted)" }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>

                        <button
                            onClick={() => {
                                setOpen(false);
                                router.push("/settings/account");
                            }}
                            className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <User size={18} style={{ color: "var(--fg-secondary)" }} />
                                <span className="text-sm font-medium" style={{ color: "var(--fg-primary)" }}>Manage Account</span>
                            </div>
                            <ChevronRight size={14} style={{ color: "var(--fg-muted)" }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>

                        <button
                            onClick={() => {
                                setOpen(false);
                                router.push("/settings");
                            }}
                            className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <Settings size={18} style={{ color: "var(--fg-secondary)" }} />
                                <span className="text-sm font-medium" style={{ color: "var(--fg-primary)" }}>Settings</span>
                            </div>
                            <ChevronRight size={14} style={{ color: "var(--fg-muted)" }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="p-2 border-t" style={{ borderColor: "var(--border)" }}>
                        <button
                            onClick={() => {
                                setOpen(false);
                                signOut();
                                toast.success("Signed out successfully");
                                router.push("/");
                            }}
                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-colors group text-red-500"
                        >
                            <LogOut size={18} />
                            <span className="text-sm font-semibold">Sign out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
