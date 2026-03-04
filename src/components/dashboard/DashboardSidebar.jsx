"use client";

import React from "react";
import {
    MessageCircle,
    Users2,
    CircleDashed,
    Settings,
    LogOut,
    Plus,
    Compass,
    Sun,
    Moon
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";

const NavIcon = ({ icon: Icon, active, onClick, label, badge }) => (
    <button
        onClick={onClick}
        className={`relative w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 group ${active
            ? 'bg-foreground text-background shadow-xl'
            : 'text-foreground/30 hover:text-foreground hover:bg-foreground/5'
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

export default function DashboardSidebar({ activeTab, setActiveTab }) {
    const { user, signOut } = useAuth();
    const { theme, toggle } = useTheme();

    return (
        <aside className="w-[84px] flex flex-col items-center py-6 bg-background border-r border-border h-full shrink-0 z-50">
            {/* User Profile / Status */}
            <div className="mb-10 relative group px-4">
                <div className="w-12 h-12 rounded-2xl bg-foreground/5 p-0.5 border border-border cursor-pointer transition-all hover:scale-105 active:scale-95">
                    <div className="w-full h-full bg-foreground flex items-center justify-center text-background font-black text-xs rounded-[14px] overflow-hidden">
                        {user?.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            user?.email?.charAt(0).toUpperCase()
                        )}
                    </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-background" />
            </div>

            {/* Top Navigation */}
            <div className="flex flex-col gap-3">
                <NavIcon
                    icon={MessageCircle}
                    label="Chats"
                    active={activeTab === 'dm'}
                    onClick={() => setActiveTab('dm')}
                    badge
                />
                <NavIcon
                    icon={Users2}
                    label="Communities"
                    active={activeTab === 'group'}
                    onClick={() => setActiveTab('group')}
                />
                <NavIcon
                    icon={Compass}
                    label="Explore"
                    active={activeTab === 'server'}
                    onClick={() => setActiveTab('server')}
                />
                <NavIcon
                    icon={CircleDashed}
                    label="Status"
                />
            </div>

            {/* Bottom Actions */}
            <div className="mt-auto flex flex-col gap-3">
                {/* Theme Toggle */}
                <button
                    onClick={toggle}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl text-foreground/30 hover:text-foreground hover:bg-foreground/5 transition-all group relative"
                >
                    {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
                    {/* Tooltip */}
                    <div className="absolute left-full ml-4 px-3 py-2 rounded-xl bg-foreground text-background text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 pointer-events-none whitespace-nowrap z-50">
                        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                    </div>
                </button>

                <button className="w-12 h-12 flex items-center justify-center rounded-2xl text-foreground/30 hover:text-foreground hover:bg-foreground/5 transition-all group relative">
                    <Plus size={22} />
                    <div className="absolute left-full ml-4 px-3 py-2 rounded-xl bg-foreground text-background text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 pointer-events-none whitespace-nowrap z-50">
                        New Chat
                    </div>
                </button>
                <button className="w-12 h-12 flex items-center justify-center rounded-2xl text-foreground/30 hover:text-foreground hover:bg-foreground/5 transition-all group relative">
                    <Settings size={22} />
                    <div className="absolute left-full ml-4 px-3 py-2 rounded-xl bg-foreground text-background text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 pointer-events-none whitespace-nowrap z-50">
                        Settings
                    </div>
                </button>
                <div className="w-8 h-px bg-border my-2" />
                <button
                    onClick={() => signOut()}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl text-red-500/50 hover:text-red-500 hover:bg-red-500/5 transition-all group relative"
                >
                    <LogOut size={22} />
                    <div className="absolute left-full ml-4 px-3 py-2 rounded-xl bg-foreground text-background text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 pointer-events-none whitespace-nowrap z-50">
                        Sign Out
                    </div>
                </button>
            </div>
        </aside>
    );
}

