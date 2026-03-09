"use client";

import React, { useState, useEffect } from "react";
import {
    MessageSquare,
    UserPlus,
    Settings,
    LogOut,
    Sun,
    Moon,
    Zap,
    PlaySquare,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import NotificationBell from "@/components/NotificationBell";
import ProfileSettingsModal from "./ProfileSettingsModal";
import { createClient } from "@/lib/supabase/client";

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
    const [showSettings, setShowSettings] = useState(false);
    const [profileAvatarUrl, setProfileAvatarUrl] = useState(
        user?.user_metadata?.avatar_url || ""
    );

    // Accept either prop name
    const changeTab = setActiveTab ?? onTabChange ?? (() => { });

    // Fetch avatar_url from profiles table (keeps in sync even after upload)
    useEffect(() => {
        if (!user?.id) return;
        const supabase = createClient();

        // Initial fetch
        supabase
            .from("profiles")
            .select("avatar_url")
            .eq("id", user.id)
            .maybeSingle()
            .then(({ data }) => {
                if (data?.avatar_url) setProfileAvatarUrl(data.avatar_url);
            });

        // Subscribe to profile updates (avatar changes propagate instantly)
        const channel = supabase
            .channel(`sidebar_profile:${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "profiles",
                    filter: `id=eq.${user.id}`,
                },
                (payload) => {
                    if (payload.new?.avatar_url) {
                        setProfileAvatarUrl(payload.new.avatar_url);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    // When modal closes, refresh the avatar
    const handleSettingsClose = () => {
        setShowSettings(false);
        if (!user?.id) return;
        const supabase = createClient();
        supabase
            .from("profiles")
            .select("avatar_url")
            .eq("id", user.id)
            .maybeSingle()
            .then(({ data }) => {
                if (data?.avatar_url) setProfileAvatarUrl(data.avatar_url);
            });
    };

    return (
        <aside className="hidden md:flex w-[72px] flex-col items-center py-6 bg-background border-r border-border h-full shrink-0 z-50">
            {/* Logo */}
            <div className="mb-8 text-emerald-500">
                <Zap size={26} strokeWidth={2.5} fill="currentColor" />
            </div>

            {/* Top Navigation */}
            <div className="flex flex-col gap-4">
                <NavIcon
                    icon={MessageSquare}
                    label="Chats"
                    active={activeTab === "chat"}
                    onClick={() => changeTab("chat")}
                    customActiveBg="bg-black dark:bg-white text-emerald-500 shadow-xl shadow-black/10"
                />
                <NavIcon
                    icon={PlaySquare}
                    label="Media"
                    active={activeTab === "media"}
                    onClick={() => changeTab("media")}
                />
                <NavIcon
                    icon={UserPlus}
                    label="Add Contact"
                    active={activeTab === "contacts"}
                    onClick={() => changeTab("contacts")}
                />
            </div>

            <div className="mt-auto flex flex-col gap-3 items-center">
                {/* Notifications */}
                <NotificationBell />

                {/* User Avatar — always reads fresh from DB */}
                <button
                    onClick={() => setShowSettings(true)}
                    title="Profile Settings"
                    className="w-11 h-11 rounded-3xl overflow-hidden bg-foreground/5 border border-border group relative mb-2 hover:scale-105 hover:border-emerald-500/40 transition-all ring-2 ring-transparent hover:ring-emerald-500/20"
                >
                    {profileAvatarUrl ? (
                        <img
                            src={profileAvatarUrl}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={() => setProfileAvatarUrl("")}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-foreground/30 text-[14px]">
                            {user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() ||
                                user?.email?.charAt(0).toUpperCase()}
                        </div>
                    )}
                    {/* Tooltip */}
                    <div className="absolute left-full ml-4 px-3 py-2 rounded-xl bg-foreground text-background text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 pointer-events-none whitespace-nowrap z-50">
                        Profile Settings
                    </div>
                </button>

                {/* Dark mode toggle */}
                <button
                    onClick={toggle}
                    className="relative w-11 h-11 flex items-center justify-center rounded-2xl text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all group"
                >
                    {theme === "light" ? <Moon size={22} /> : <Sun size={22} />}
                    <div className="absolute left-full ml-4 px-3 py-2 rounded-xl bg-foreground text-background text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 pointer-events-none whitespace-nowrap z-50">
                        {theme === "light" ? "Dark Mode" : "Light Mode"}
                    </div>
                </button>

                {/* Settings */}
                <NavIcon
                    icon={Settings}
                    label="Settings"
                    active={showSettings}
                    onClick={() => setShowSettings(true)}
                />

                {/* Sign out */}
                <button
                    onClick={() => signOut()}
                    className="relative w-11 h-11 flex items-center justify-center rounded-2xl text-red-500/50 hover:text-red-500 hover:bg-red-500/5 transition-all group mt-2"
                >
                    <LogOut size={22} />
                    <div className="absolute left-full ml-4 px-3 py-2 rounded-xl bg-foreground text-background text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 pointer-events-none whitespace-nowrap z-50">
                        Sign Out
                    </div>
                </button>
            </div>

            {showSettings && <ProfileSettingsModal onClose={handleSettingsClose} />}
        </aside>
    );
}
