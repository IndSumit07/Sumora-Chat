"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, UserPlus, Check, X, Loader2, AtSign } from "lucide-react";
import { searchUserByEmail, addContact } from "@/lib/friends";

// ─── User Preview Card (appears after search) ─────────────────────────────────

function UserPreviewCard({ user, onConfirm, onCancel, sending }) {
    const [name, setName] = useState(user.full_name || "");
    const inputRef = useRef(null);

    useEffect(() => {
        // Focus the name field once the card appears
        setTimeout(() => inputRef.current?.focus(), 50);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        const finalName = name.trim() || user.full_name || "Contact";
        onConfirm(finalName);
    };

    return (
        <form onSubmit={handleSubmit} className="mt-3 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="rounded-2xl border border-border bg-background overflow-hidden">
                {/* User info strip */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700 shrink-0">
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-zinc-500 dark:text-zinc-300 text-[15px]">
                                {user.full_name?.[0]?.toUpperCase() ?? "?"}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13.5px] font-semibold text-foreground truncate">{user.full_name || "Unknown"}</p>
                        <p className="text-[12px] text-foreground/40 truncate">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[11px] text-emerald-500 font-medium">Found</span>
                    </div>
                </div>

                {/* Custom name input */}
                <div className="px-4 py-3.5">
                    <label className="text-[11px] font-semibold text-foreground/40 uppercase tracking-wider mb-2 block">
                        Save as (Custom Name)
                    </label>
                    <input
                        ref={inputRef}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={user.full_name || "Enter a name…"}
                        className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl px-4 py-2.5 text-[14px] font-medium text-foreground placeholder:text-foreground/30 outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-500/30 transition-all"
                        maxLength={50}
                    />
                    <p className="text-[11px] text-foreground/30 mt-1.5">
                        This name is only visible to you
                    </p>
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={sending}
                        className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-foreground/60 hover:text-foreground bg-foreground/5 hover:bg-foreground/10 transition-all disabled:opacity-40"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={sending || !name.trim()}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-[13px] font-semibold rounded-xl shadow-sm shadow-emerald-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {sending ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <UserPlus size={14} />
                        )}
                        {sending ? "Saving…" : "Add Contact"}
                    </button>
                </div>
            </div>
        </form>
    );
}

// ─── Main AddFriend Component ─────────────────────────────────────────────────

export default function AddFriend() {
    const [email, setEmail] = useState("");
    const [searching, setSearching] = useState(false);
    const [foundUser, setFoundUser] = useState(null);
    const [sending, setSending] = useState(false);
    const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', msg }

    const clearFeedback = () => setTimeout(() => setFeedback(null), 4000);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;
        setSearching(true);
        setFoundUser(null);
        setFeedback(null);
        try {
            const user = await searchUserByEmail(email.trim().toLowerCase());
            if (!user) {
                setFeedback({ type: "error", msg: "No user found with that email address." });
                clearFeedback();
            } else {
                setFoundUser(user);
            }
        } catch (err) {
            setFeedback({ type: "error", msg: err.message || "Search failed." });
            clearFeedback();
        } finally {
            setSearching(false);
        }
    };

    const handleConfirmAdd = async (contactName) => {
        if (!foundUser) return;
        setSending(true);
        try {
            await addContact(foundUser.id, contactName);
            setFeedback({ type: "success", msg: `${contactName} added to contacts!` });
            setFoundUser(null);
            setEmail("");
            clearFeedback();
        } catch (err) {
            setFeedback({ type: "error", msg: err.message || "Could not add contact." });
            clearFeedback();
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Email search bar */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <AtSign
                        size={14}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none"
                    />
                    <input
                        id="add-friend-email"
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setFeedback(null); setFoundUser(null); }}
                        placeholder="Search by email address…"
                        className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl py-2.5 pl-9 pr-4 text-[13px] font-medium text-foreground placeholder:text-foreground/30 outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-500/30 transition-all"
                    />
                </div>
                <button
                    type="submit"
                    disabled={searching || !email.trim()}
                    className="px-4 py-2.5 bg-foreground text-background text-[13px] font-semibold rounded-xl hover:opacity-80 active:scale-95 transition-all disabled:opacity-30 flex items-center gap-1.5 shrink-0"
                >
                    {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    {searching ? "" : "Find"}
                </button>
            </form>

            {/* Feedback message */}
            {feedback && (
                <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[12px] font-medium animate-in fade-in duration-200
                    ${feedback.type === "success"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-500/10 text-red-500"
                    }`}>
                    {feedback.type === "success" ? <Check size={13} /> : <X size={13} />}
                    {feedback.msg}
                </div>
            )}

            {/* Found user preview */}
            {foundUser && (
                <UserPreviewCard
                    user={foundUser}
                    onConfirm={handleConfirmAdd}
                    onCancel={() => { setFoundUser(null); setEmail(""); }}
                    sending={sending}
                />
            )}
        </div>
    );
}
