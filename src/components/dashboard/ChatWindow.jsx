"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    Phone,
    Video,
    Search,
    MoreVertical,
    Paperclip,
    Smile,
    Mic,
    SendHorizontal,
    Image,
    FileText,
    CheckCheck
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const MessageItem = ({ isMe, text, time, read }) => (
    <div className={`flex flex-col mb-4 ${isMe ? 'items-end' : 'items-start'}`}>
        <div className={`
            max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm text-[14.5px] leading-relaxed
            ${isMe
                ? 'bg-foreground text-background rounded-tr-none'
                : 'bg-background-secondary text-foreground rounded-tl-none border border-border/40'
            }
        `}>
            {text}
            <div className={`flex items-center gap-1 mt-1 justify-end ${isMe ? 'text-background/40' : 'text-foreground/30'}`}>
                <span className="text-[10px] font-bold uppercase">{time}</span>
                {isMe && <CheckCheck size={14} className={read ? 'text-blue-400' : ''} />}
            </div>
        </div>
    </div>
);

export default function ChatWindow({ activeTab }) {
    const { user } = useAuth();
    const [msg, setMsg] = useState("");
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, []);

    return (
        <section className="flex-1 flex flex-col bg-background/50 relative overflow-hidden h-full">
            {/* Unique Chat Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none pointer-fine:opacity-[0.02]" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, var(--fg-primary) 1.5px, transparent 0)`,
                backgroundSize: '32px 32px'
            }} />

            {/* Header */}
            <header className="h-20 flex items-center justify-between px-8 border-b border-border bg-background/80 backdrop-blur-xl z-20 shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-foreground/5 border border-border p-0.5 overflow-hidden">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" alt="Sarah" className="w-full h-full object-cover rounded-full" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black tracking-tighter text-foreground leading-none mb-1">Sarah Chen</h3>
                        <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest animate-pulse">Online Now</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2.5 text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-2xl transition-all"><Search size={22} /></button>
                    <button className="p-2.5 text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-2xl transition-all"><Video size={22} /></button>
                    <button className="p-2.5 text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-2xl transition-all"><Phone size={22} /></button>
                    <div className="w-px h-6 bg-border mx-2" />
                    <button className="p-2.5 text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-2xl transition-all"><MoreVertical size={22} /></button>
                </div>
            </header>

            {/* Chat Canvas */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-8 py-10 no-scrollbar relative z-10"
            >
                {/* Intro Section */}
                <div className="flex flex-col items-center mb-16 text-center">
                    <div className="w-24 h-24 rounded-[40px] bg-foreground/5 border border-border p-2 mb-4">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" alt="Sarah" className="w-full h-full object-cover rounded-[32px]" />
                    </div>
                    <h2 className="text-2xl font-black text-foreground mb-1">Sarah Chen</h2>
                    <p className="text-xs text-foreground/40 font-bold uppercase tracking-[0.2em] mb-6">Sumora Design Lead</p>
                    <div className="px-6 py-2 bg-foreground/5 border border-border rounded-full text-[11px] font-bold text-foreground/60">
                        🔒 End-to-end encrypted protocol
                    </div>
                </div>

                {/* Messages */}
                <MessageItem isMe={false} text="Hey! Hope everything is going great with the new Sumora UI." time="10:00" />
                <MessageItem isMe={false} text="I've attached the final SVG assets for the dashboard icons. Can you implement them today?" time="10:01" />
                <MessageItem isMe={true} text="Hey Sarah! Yes, I was just looking at the figma file. The design looks incredible as always." time="10:05" read />
                <MessageItem isMe={true} text="I'll have them integrated by the EOD Review. 🚀" time="10:05" read />
                <MessageItem isMe={false} text="Perfect! Let me know if you need any adjustments to the grid." time="10:08" />
            </div>

            {/* Input Bar */}
            <div className="p-6 pt-2 z-20">
                <div className="bg-background-secondary border border-border rounded-[28px] p-2 flex items-center gap-1 shadow-md focus-within:shadow-xl focus-within:border-foreground/20 transition-all duration-300">
                    <button className="shrink-0 p-3 text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-full transition-all">
                        <Smile size={24} />
                    </button>
                    <button className="shrink-0 p-3 text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-full transition-all">
                        <Paperclip size={24} />
                    </button>

                    <input
                        type="text"
                        value={msg}
                        onChange={(e) => setMsg(e.target.value)}
                        placeholder="Say something inspiring..."
                        className="flex-1 bg-transparent border-none outline-none py-3 px-4 text-[15.5px] text-foreground placeholder:text-foreground/30 font-medium"
                    />

                    {msg.trim() ? (
                        <button className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg rotate-0 hover:rotate-12">
                            <SendHorizontal size={22} strokeWidth={2.5} />
                        </button>
                    ) : (
                        <button className="w-12 h-12 text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-full flex items-center justify-center transition-all">
                            <Mic size={24} strokeWidth={2.5} />
                        </button>
                    )}
                </div>
                <div className="mt-3 flex items-center justify-center gap-4 opacity-30 select-none">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground">Sumora Secure Chat</span>
                </div>
            </div>
        </section>
    );
}
