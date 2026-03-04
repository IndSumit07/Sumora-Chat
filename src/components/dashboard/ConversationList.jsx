"use client";

import React, { useState } from "react";
import { Search, ListFilter, CheckCheck } from "lucide-react";

const ChatListItem = ({ title, status, lastMsg, time, active, unread, avatar }) => (
    <div className={`
        relative flex items-center gap-4 px-4 py-4 cursor-pointer transition-all duration-300
        ${active
            ? 'bg-foreground/4'
            : 'hover:bg-foreground/2'
        }
    `}>
        {/* Active side indicator */}
        {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-foreground rounded-r-full" />
        )}

        <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-foreground/5 border border-border shadow-sm">
                {avatar ? (
                    <img src={avatar} alt={title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-foreground/20 text-xl">
                        {title.charAt(0)}
                    </div>
                )}
            </div>
            {status === 'online' && (
                <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background shadow-sm" />
            )}
        </div>

        <div className="flex-1 min-w-0 border-b border-border/50 py-1">
            <div className="flex justify-between items-baseline mb-1">
                <h3 className={`text-[15px] font-bold truncate ${active ? 'text-foreground' : 'text-foreground/90'}`}>
                    {title}
                </h3>
                <span className={`text-[11px] font-bold ${unread ? 'text-indigo-500' : 'text-foreground/30'}`}>
                    {time}
                </span>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                    {!unread && lastMsg && <CheckCheck size={14} className="text-foreground/30 shrink-0" />}
                    <p className={`text-[13px] truncate ${unread ? 'text-foreground font-bold' : 'text-foreground/50'}`}>
                        {lastMsg}
                    </p>
                </div>
                {unread && (
                    <div className="min-w-[20px] h-5 rounded-full bg-foreground text-background text-[10px] font-black flex items-center justify-center px-1 shadow-md">
                        {unread}
                    </div>
                )}
            </div>
        </div>
    </div>
);

export default function ConversationList({ activeTab, width = 380 }) {
    const [filter, setFilter] = useState("all");

    const FilterBtn = ({ id, label }) => (
        <button
            onClick={() => setFilter(id)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${filter === id
                ? 'bg-foreground text-background border-foreground'
                : 'bg-foreground/5 text-foreground/50 border-transparent hover:bg-foreground/10'
                }`}
        >
            {label}
        </button>
    );

    return (
        <aside
            style={{ width: `${width}px` }}
            className="flex flex-col bg-background h-full border-r border-border shrink-0 z-40 shadow-sm"
        >
            {/* Header Area */}
            <div className="p-6 pb-2">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black tracking-tighter text-foreground">
                        Sumora
                    </h2>
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-xl transition-all">
                            <ListFilter size={20} />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-foreground/30">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search or start new chat"
                        className="w-full bg-foreground/5 border border-transparent rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:bg-transparent focus:border-border transition-all placeholder:text-foreground/30 font-medium"
                    />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar py-1">
                    <FilterBtn id="all" label="All" />
                    <FilterBtn id="unread" label="Unread" />
                    <FilterBtn id="groups" label="Groups" />
                    <FilterBtn id="personal" label="Private" />
                </div>
            </div>

            {/* Chats List */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {activeTab === 'dm' ? (
                    <>
                        <ChatListItem
                            title="Sarah Chen"
                            lastMsg="The new prototype is 🔥"
                            time="14:24"
                            unread="2"
                            status="online"
                            active
                            avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
                        />
                        <ChatListItem
                            title="Alex Rivera"
                            lastMsg="Can you check the PR?"
                            time="13:50"
                            avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
                        />
                        <ChatListItem
                            title="Marcus Wright"
                            lastMsg="See you tomorrow at the office!"
                            time="Yesterday"
                            avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus"
                        />
                        <ChatListItem
                            title="Emma Wilson"
                            lastMsg="I sent the assets"
                            time="Monday"
                            avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=Emma"
                        />
                    </>
                ) : activeTab === 'group' ? (
                    <>
                        <ChatListItem title="Design Team" lastMsg="Sarah: Moodboard is up" time="10:15" unread="5" />
                        <ChatListItem title="Frontend Hub" lastMsg="You: Updated tailwind config" time="09:24" />
                        <ChatListItem title="Project Alpha" lastMsg="Alex: Need help with DB" time="Yesterday" />
                    </>
                ) : (
                    <>
                        <ChatListItem title="#general" lastMsg="System: User joined" time="15:00" />
                        <ChatListItem title="#dev-logs" lastMsg="Bot: Deployment successful" time="12:45" />
                    </>
                )}
            </div>
        </aside>
    );
}
