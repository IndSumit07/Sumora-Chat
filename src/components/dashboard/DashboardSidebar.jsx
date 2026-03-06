"use client";

import React from "react";
import {
    MessageSquare,
    Users2,
    Settings,
    LogOut,
    Sun,
    Moon,
    Zap,
    PlaySquare,
    Star,
    ArrowDownUp,
    Clock,
    Cloud,
    Trash2,
    Info,
    Plus
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import NotificationBell from "@/components/NotificationBell";

// ─── Nav Icon ─────────────────────────────────────────────────────────────────

const NavIcon = ({ icon: Icon, active, onClick, label, badge, customActiveBg }) => (
    <button
        onClick={onClick}
        title={label}
        className={`relative w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-300 group ${active
            ? customActiveBg || "bg-foreground text-background shadow-lg"
            : "text-foreground/40 hover:text-foreground hover:bg-foreground/5 shadow-none"
            }`}
    >
        <Icon size={22} strokeWidth={active ? 2.5 : 2} />
        {badge && (
            <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-background rounded-full" />
        )}
        {/* Tooltip */}
        <div className="absolute left-full ml-4 px-3 py-2 rounded-xl bg-foreground text-background text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 pointer-events-none whitespace-nowrap z-50">
            {label}
        </div>
    </button>
);

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function DashboardSidebar({ activeTab, setActiveTab, onTabChange }) {
    const { user, signOut } = useAuth();
    const { theme, toggle } = useTheme();

    // Accept either prop name (setActiveTab from page.js, onTabChange for resilience)
    const changeTab = setActiveTab ?? onTabChange ?? (() => { });

    return (
        <aside className="w-[72px] flex flex-col items-center py-6 bg-background border-r border-border h-full shrink-0 z-50">
            {/* Logo */}
            <div className="mb-8 text-emerald-500">
                <Zap size={26} strokeWidth={2.5} fill="currentColor" />
            </div>

            {/* Top Navigation */}
            <div className="flex flex-col gap-4">
                <NavIcon
                    icon={MessageSquare}
                    label="Chats"
                    active={activeTab === "dm"}
                    onClick={() => changeTab("dm")}
                    customActiveBg="bg-black dark:bg-white text-emerald-500 shadow-xl shadow-black/10"
                />
                <NavIcon
                    icon={Users2}
                    label="Friends"
                    active={activeTab === "friends"}
                    onClick={() => changeTab("friends")}
                />
                <NavIcon icon={PlaySquare} label="Media" active={false} />
                <NavIcon icon={Star} label="Favourites" active={false} />
                <NavIcon icon={ArrowDownUp} label="Transfers" active={false} />
                <NavIcon icon={Clock} label="History" active={false} />
                <NavIcon icon={Cloud} label="Cloud" active={false} />
                <NavIcon icon={Trash2} label="Trash" active={false} />
                <NavIcon icon={Info} label="Info" active={false} />
            </div>

            <div className="mt-auto flex flex-col gap-3 items-center">
                <button
                    onClick={toggle}
                    className="relative w-11 h-11 flex items-center justify-center rounded-2xl text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all group"
                >
                    {theme === "light" ? <Moon size={22} /> : <Sun size={22} />}
                    <div className="absolute left-full ml-4 px-3 py-2 rounded-xl bg-foreground text-background text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 pointer-events-none whitespace-nowrap z-50">
                        {theme === "light" ? "Dark Mode" : "Light Mode"}
                    </div>
                </button>

                <NavIcon icon={Settings} label="Settings" active={false} />

                <button
                    onClick={() => signOut()}
                    className="relative w-11 h-11 flex items-center justify-center rounded-2xl text-red-500/50 hover:text-red-500 hover:bg-red-500/5 transition-all group"
                >
                    <LogOut size={22} />
                    <div className="absolute left-full ml-4 px-3 py-2 rounded-xl bg-foreground text-background text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 pointer-events-none whitespace-nowrap z-50">
                        Sign Out
                    </div>
                </button>

                <button className="w-10 h-10 mt-2 flex items-center justify-center rounded-xl bg-foreground/5 text-foreground hover:bg-foreground hover:text-background transition-all hover:rotate-90">
                    <Plus size={20} />
                </button>
            </div>
        </aside>
    );
}
