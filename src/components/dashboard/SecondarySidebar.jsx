"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    Plus,
    Hash,
    FileEdit,
    AtSign,
    FileBox,
    ChevronRight,
    ChevronDown,
    CheckCircle2,
    Users,
    X,
    UserPlus,
    Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import FriendList from "@/components/FriendList";
import AddFriend from "@/components/AddFriend";
import FriendRequests from "@/components/FriendRequests";
import { searchUserByEmail, sendFriendRequest } from "@/lib/friends";

function MenuItem({ icon: Icon, label, count, active }) {
    return (
        <button
            className={`w-full flex items-center justify-between px-4 py-2 text-[13px] font-bold rounded-xl transition-all ${active
                ? "bg-foreground/5 text-foreground"
                : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                }`}
        >
            <div className="flex items-center gap-3">
                {Icon && <Icon size={16} className={active ? "text-foreground" : "text-foreground/50"} strokeWidth={2.5} />}
                <span>{label}</span>
            </div>
            {count && (
                <span className="text-[10px] text-foreground/40 font-black">{count}</span>
            )}
        </button>
    );
}

function CollapsibleSection({ title, defaultOpen = true, count, children }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="mb-1">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-2 py-2 text-[12px] font-black text-foreground/40 hover:text-foreground/70 transition-all uppercase tracking-wider"
            >
                <div className="flex items-center gap-1">
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span>{title}</span>
                </div>
                {count && <span>{count}</span>}
            </button>
            {isOpen && <div className="pl-4 mt-1 space-y-0.5">{children}</div>}
        </div>
    );
}

export default function SecondarySidebar({ onSelectConversation }) {
    const { user } = useAuth();
    const [showAddContact, setShowAddContact] = useState(false);
    const [showRequests, setShowRequests] = useState(false);

    // Modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [emailInput, setEmailInput] = useState("");
    const [adding, setAdding] = useState(false);
    const [addedSuccess, setAddedSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleAddContact = async (e) => {
        e.preventDefault();
        if (!emailInput.trim()) return;
        setAdding(true);
        setErrorMsg("");
        setAddedSuccess(false);

        try {
            const foundUser = await searchUserByEmail(emailInput.trim().toLowerCase());
            if (!foundUser) {
                setErrorMsg("No user found with that email.");
                setAdding(false);
                return;
            }
            await sendFriendRequest(foundUser.id);
            setAddedSuccess(true);
            setTimeout(() => {
                setShowAddModal(false);
                setAddedSuccess(false);
                setEmailInput("");
                setAdding(false);
            }, 2500);
        } catch (err) {
            setErrorMsg(err.message || "Failed to add friend.");
            setAddedSuccess(false);
            setAdding(false);
        }
    };

    return (
        <aside className="w-[260px] bg-background border-r border-border h-full shrink-0 flex flex-col z-40 relative">
            {/* Header */}
            <div className="px-5 py-6 flex items-center justify-between z-50">
                <h2 className="text-xl font-black text-foreground tracking-tight">Inbox</h2>
                <div className="relative group">
                    <button className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center transition-all cursor-default group-hover:scale-105">
                        <Plus size={18} />
                    </button>
                    {/* Hover Dropdown Bridge */}
                    <div className="absolute right-0 top-full w-48 pt-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                        <div className="bg-background border border-border/80 shadow-2xl rounded-2xl p-1.5 flex flex-col gap-1 translate-y-1 group-hover:translate-y-0 transition-transform duration-200">
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-bold text-foreground/70 hover:text-foreground hover:bg-foreground/5 rounded-xl transition-all"
                            >
                                <Users size={16} />
                                Contacts
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-6 px-3">
                {/* User Profile Area */}
                <div className="mx-2 mb-6 px-3 py-2.5 bg-foreground/5 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-foreground/10 border border-border">
                        {user?.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-black text-foreground/30 text-[12px]">
                                {user?.email?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <span className="text-[14px] font-bold text-foreground truncate">
                        {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                    </span>
                </div>

                {/* Main Menu */}
                <div className="mb-6 space-y-0.5">
                    <MenuItem icon={Hash} label="Channels" />
                    <MenuItem icon={FileEdit} label="Drafts" />
                    <MenuItem icon={AtSign} label="Mentions" />
                    <MenuItem icon={FileBox} label="Files & Media" />
                </div>

                {/* Conversations Section */}
                <CollapsibleSection title="Conversations">
                    <MenuItem label="New" count="5" />
                    <MenuItem label="All" count="30" active />
                    <MenuItem label="Assigned" count="11" />
                    <MenuItem label="Favourites" count="9" />
                </CollapsibleSection>

                {/* Negotiations Section */}
                <CollapsibleSection title="Negotiations" count="20">
                    <MenuItem label="All" />
                    <MenuItem label="Urgent" />
                    <MenuItem label="Completed" />
                </CollapsibleSection>

                {/* Other Static Sections */}
                <div className="mt-2 mb-6">
                    <button className="w-full flex items-center justify-between px-2 py-2 text-[12px] font-black text-foreground/40 hover:text-foreground/70 transition-all uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                            <ChevronRight size={14} />
                            <span>Closed</span>
                        </div>
                        <span>145</span>
                    </button>
                    <button className="w-full flex items-center justify-between px-2 py-2 text-[12px] font-black text-foreground/40 hover:text-foreground/70 transition-all uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                            <ChevronRight size={14} />
                            <span>Archives</span>
                        </div>
                        <span>32</span>
                    </button>
                </div>

                {/* Contacts Section (Friend System) */}
                <div className="mt-6">
                    <div className="flex items-center justify-between px-2 mb-2">
                        <h3 className="text-[12px] font-black text-foreground/40 uppercase tracking-wider">Contacts</h3>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setShowRequests(!showRequests)}
                                className={`p-1.5 rounded-lg transition-all ${showRequests ? 'bg-foreground text-background' : 'text-foreground/40 hover:text-foreground hover:bg-foreground/5'}`}
                                title="Friend Requests"
                            >
                                <Users size={14} />
                            </button>
                        </div>
                    </div>

                    {showRequests && (
                        <div className="mb-4 bg-foreground/5 rounded-2xl p-2">
                            <FriendRequests />
                        </div>
                    )}

                    {showAddContact && (
                        <div className="mb-4 bg-foreground/5 rounded-2xl p-2">
                            <AddFriend />
                        </div>
                    )}

                    <div className="px-1 relative pb-10">
                        {/* We will render FriendList here, but we need it to look like simple contacts */}
                        <FriendList onSelectConversation={onSelectConversation} />
                    </div>

                    <button
                        onClick={() => setShowAddContact(!showAddContact)}
                        className="w-full mt-2 flex items-center gap-2 px-3 py-2 text-[12px] font-bold text-foreground/60 hover:text-foreground hover:bg-foreground/5 rounded-xl transition-all"
                    >
                        <Plus size={14} />
                        {showAddContact ? "Cancel" : "Add contacts"}
                    </button>
                </div>

            </div>

            {/* Beautiful Modal Overlay */}
            {showAddModal && typeof document !== "undefined" && createPortal(
                <div className="fixed inset-0 z-100 bg-black/40 dark:bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-background border border-border rounded-3xl p-8 max-w-[400px] w-full shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden">
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="absolute top-4 right-4 p-2 text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-full transition-all z-20"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-6 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                                <UserPlus size={24} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl font-black text-foreground tracking-tight mb-2">New Contact</h3>
                            <p className="text-[14px] text-foreground/60 font-semibold">Enter their email address to send a friend request.</p>
                        </div>

                        <form onSubmit={handleAddContact} className="relative z-10">
                            <div className="relative mb-4">
                                <AtSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
                                <input
                                    autoFocus
                                    type="email"
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    placeholder="friend@example.com"
                                    className="w-full bg-foreground/5 py-4 pl-12 pr-4 rounded-2xl text-[15px] font-bold text-foreground placeholder:text-foreground/30 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all border border-transparent focus:border-emerald-500/20"
                                    disabled={adding || addedSuccess}
                                />
                            </div>
                            {errorMsg && (
                                <p className="text-red-500 text-[12px] font-bold mb-4">{errorMsg}</p>
                            )}
                            <button
                                type="submit"
                                disabled={adding || !emailInput.trim() || addedSuccess}
                                className="w-full py-4 bg-foreground text-background font-bold text-[15px] rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-foreground/10"
                            >
                                {adding ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : addedSuccess ? (
                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                ) : (
                                    <UserPlus size={18} className="group-hover:translate-x-1 transition-transform" />
                                )}
                                {adding ? "Searching..." : addedSuccess ? "Request Sent!" : "Add Contact"}
                            </button>
                        </form>

                        {/* Success Popup overlay inside modal */}
                        {addedSuccess && (
                            <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-300">
                                <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6 animate-bounce">
                                    <CheckCircle2 size={40} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-2xl font-black text-foreground mb-2 text-center">Friend Added!</h3>
                                <p className="text-[15px] font-semibold text-foreground/50 text-center">A request has been sent to {emailInput}.</p>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </aside>
    );
}
