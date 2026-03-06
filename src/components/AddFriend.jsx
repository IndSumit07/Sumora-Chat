"use client";

import React, { useState } from "react";
import { Search, UserPlus, Check, X, Loader2 } from "lucide-react";
import { searchUserByEmail, sendFriendRequest } from "@/lib/friends";

// ─── Toast (inline, no external dependency) ──────────────────────────────────

function Toast({ message, type, onDismiss }) {
    return (
        <div
            className={`fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-[14px] font-bold transition-all animate-in slide-in-from-bottom-4
        ${type === "success" ? "bg-[#22C55E]" : "bg-red-500"}`}
        >
            {type === "success" ? <Check size={16} /> : <X size={16} />}
            {message}
            <button onClick={onDismiss} className="ml-2 opacity-70 hover:opacity-100">
                <X size={14} />
            </button>
        </div>
    );
}

// ─── User Preview Card ────────────────────────────────────────────────────────

function UserPreviewCard({ user, onConfirm, onCancel, sending }) {
    return (
        <div className="mt-4 p-4 bg-[#F8F9FA] rounded-2xl border border-[#EEEEEE] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 shrink-0 bg-gray-100">
                {user.avatar_url ? (
                    <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[18px] font-black text-gray-400">
                        {user.full_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-[15px] font-black text-black truncate">
                    {user.full_name ?? "Unnamed User"}
                </p>
                <p className="text-[12px] text-[#888888] font-semibold truncate">
                    {user.email ?? ""}
                </p>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onCancel}
                    disabled={sending}
                    className="p-2.5 rounded-xl text-[#888888] hover:text-black hover:bg-gray-200 transition-all"
                >
                    <X size={16} />
                </button>
                <button
                    onClick={onConfirm}
                    disabled={sending}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white text-[13px] font-bold rounded-xl hover:bg-[#222] active:scale-95 transition-all disabled:opacity-50"
                >
                    {sending ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <UserPlus size={14} />
                    )}
                    {sending ? "Sending…" : "Add Friend"}
                </button>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AddFriend() {
    const [email, setEmail] = useState("");
    const [searching, setSearching] = useState(false);
    const [foundUser, setFoundUser] = useState(null);
    const [sending, setSending] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;

        setSearching(true);
        setFoundUser(null);

        try {
            const user = await searchUserByEmail(email.trim().toLowerCase());
            if (!user) {
                showToast("No user found with that email.", "error");
            } else {
                setFoundUser(user);
            }
        } catch (err) {
            showToast(err.message || "Search failed. Try again.", "error");
        } finally {
            setSearching(false);
        }
    };

    const handleSendRequest = async () => {
        if (!foundUser) return;
        setSending(true);

        try {
            await sendFriendRequest(foundUser.id);
            showToast(`Friend request sent to ${foundUser.full_name}!`, "success");
            setFoundUser(null);
            setEmail("");
        } catch (err) {
            showToast(err.message || "Could not send friend request.", "error");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="p-4">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BBBBBB]"
                    />
                    <input
                        id="add-friend-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Search by email address…"
                        className="w-full bg-[#F5F5F5] rounded-xl py-3 pl-10 pr-4 text-[14px] font-semibold text-black placeholder:text-[#BBBBBB] outline-none focus:ring-2 focus:ring-black/10 transition-all"
                    />
                </div>
                <button
                    type="submit"
                    disabled={searching || !email.trim()}
                    className="flex items-center gap-2 px-5 py-3 bg-black text-white text-[13px] font-bold rounded-xl hover:bg-[#222] active:scale-95 transition-all disabled:opacity-40"
                >
                    {searching ? (
                        <Loader2 size={15} className="animate-spin" />
                    ) : (
                        <Search size={15} />
                    )}
                    {searching ? "Searching…" : "Search"}
                </button>
            </form>

            {/* Preview Card */}
            {foundUser && (
                <UserPreviewCard
                    user={foundUser}
                    onConfirm={handleSendRequest}
                    onCancel={() => setFoundUser(null)}
                    sending={sending}
                />
            )}

            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onDismiss={() => setToast(null)}
                />
            )}
        </div>
    );
}
