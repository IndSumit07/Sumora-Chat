"use client";

import { useState } from "react";
import { useTheme } from "./ThemeProvider";

const FEATURES = [
    {
        id: "ai",
        title: "Meet Sumora AI: Your personal agent for work.",
        desc: "Sumora AI isn't just any AI. It's AI that knows your team inside and out. It adapts to your style, finds what you need and helps to get work done faster.",
        link: "Learn more about Sumora AI"
    },
    {
        id: "search",
        title: "One search to rule them all.",
        desc: "Find any message, file, or decision instantly across all your channels and direct messages with lightning-fast semantic search.",
        link: "Explore Search"
    },
    {
        id: "crm",
        title: "Bring CRM data right to the conversation.",
        desc: "Connect your favorite tools like Jira, GitHub, and Salesforce. Get real-time updates and take action without ever leaving your chat.",
        link: "View Integrations"
    }
];

/* ── Inline Icons ── */
const Icons = {
    Search: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    Pencil: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    ),
    Doc: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 3.5L18.5 8H14V3.5z" />
        </svg>
    ),
    ArrowRight: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
        </svg>
    ),
    Sparkle: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
        </svg>
    )
};

export default function FeatureShowcase() {
    const [activeId, setActiveId] = useState("ai");
    const { theme } = useTheme();
    const isDark = theme === "dark";

    // Dynamic styles based on theme
    const activeColor = "#8B5CF6"; // Vibrant purple for active state
    const inactiveColor = "var(--fg-secondary)";

    // Mockup UI colors based on theme
    const mockTheme = {
        bgTop: isDark ? "#1E1B2E" : "#4A154B", // Purple top bar mimicking slack/saas
        bgSidebar: isDark ? "#121019" : "#350D36",
        bgMain: isDark ? "#1A1A1A" : "#F8F8F8",
        bgPanel: isDark ? "#242424" : "#FFFFFF",
        textPrimary: isDark ? "#E5E5E5" : "#1D1C1D",
        textSec: isDark ? "#9CA3AF" : "#616061",
        border: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        bubbleBg: isDark ? "#383838" : "#F2F2F2",
        cardBg: isDark ? "#2A2A2A" : "#FFFFFF",
    };

    return (
        <div style={{
            maxWidth: 1160,
            margin: "0 auto",
            padding: "80px 28px",
            display: "flex",
            flexDirection: "row",
            gap: 60,
            alignItems: "center",
            flexWrap: "wrap",
            fontFamily: "var(--font-heading), system-ui, sans-serif"
        }}>

            {/* ── LEFT: Accordion & Stats ── */}
            <div style={{ flex: "1 1 400px", display: "flex", flexDirection: "column", gap: 32 }}>

                {/* Accordion List */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                    {FEATURES.map((feat) => {
                        const isActive = activeId === feat.id;
                        return (
                            <div
                                key={feat.id}
                                onClick={() => setActiveId(feat.id)}
                                style={{
                                    borderLeft: `3px solid ${isActive ? activeColor : "transparent"}`,
                                    paddingLeft: 20,
                                    paddingTop: 8,
                                    paddingBottom: 8,
                                    marginBottom: 24,
                                    cursor: "pointer",
                                    position: "relative",
                                    transition: "all 0.3s ease"
                                }}
                            >
                                {/* Active subtle background highlight */}
                                {isActive && (
                                    <div style={{
                                        position: "absolute", inset: 0,
                                        background: `linear-gradient(to right, ${activeColor}15, transparent)`,
                                        zIndex: -1,
                                        borderRadius: "0 8px 8px 0"
                                    }} />
                                )}

                                <h3 style={{
                                    fontSize: isActive ? 24 : 20,
                                    fontWeight: 700,
                                    color: isActive ? activeColor : inactiveColor,
                                    margin: "0 0 10px 0",
                                    transition: "all 0.2s ease",
                                    lineHeight: 1.3
                                }}>
                                    {feat.title}
                                </h3>

                                {/* Collapsible content */}
                                <div style={{
                                    maxHeight: isActive ? 200 : 0,
                                    opacity: isActive ? 1 : 0,
                                    overflow: "hidden",
                                    transition: "all 0.3s ease",
                                }}>
                                    <p style={{
                                        fontSize: 15,
                                        lineHeight: 1.6,
                                        color: "var(--fg-secondary)",
                                        margin: "0 0 16px 0",
                                        fontFamily: "'Inter', sans-serif"
                                    }}>
                                        {feat.desc}
                                    </p>
                                    <div style={{
                                        display: "inline-flex", alignItems: "center", gap: 6,
                                        color: "#2D8CFF", fontSize: 14, fontWeight: 600,
                                        fontFamily: "'Inter', sans-serif"
                                    }}>
                                        {feat.link} <Icons.ArrowRight />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Big Statistic */}
                <div style={{ marginTop: 20 }}>
                    <div style={{
                        fontSize: "clamp(3.5rem, 6vw, 4.5rem)",
                        fontWeight: 800,
                        color: "var(--fg-primary)",
                        lineHeight: 1,
                        marginBottom: 10,
                        letterSpacing: "-0.04em"
                    }}>
                        97 mins
                    </div>
                    <div style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "var(--fg-primary)",
                        maxWidth: 240,
                        lineHeight: 1.4,
                        fontFamily: "'Inter', sans-serif"
                    }}>
                        Average time that users can save weekly with AI in Sumora¹
                    </div>
                </div>

            </div>

            {/* ── RIGHT: Graphic Mockup ── */}
            <div style={{ flex: "1.5 1 500px", position: "relative" }}>

                {/* Decorative background glow behind the mockup */}
                <div aria-hidden="true" style={{
                    position: "absolute",
                    top: "10%", right: "10%", width: "60%", height: "60%",
                    background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 60%)",
                    filter: "blur(60px)", pointerEvents: "none", zIndex: 0
                }} />

                {/* Main Glass/Shadow Wrapper for Graphic */}
                <div style={{
                    position: "relative",
                    zIndex: 2,
                    borderRadius: 12,
                    border: `1px solid ${isDark ? "rgb(255,255,255,0.08)" : "rgb(0,0,0,0.05)"}`,
                    overflow: "hidden",
                    display: "flex", flexDirection: "column",
                    height: 480,
                    backgroundColor: mockTheme.bgMain,
                    boxShadow: isDark
                        ? "0 30px 60px -10px rgba(0,0,0,0.5)"
                        : "0 30px 60px -10px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
                    fontFamily: "'Inter', system-ui, sans-serif"
                }}>

                    {/* Top Bar (Purple) */}
                    <div style={{
                        height: 40, backgroundColor: mockTheme.bgTop,
                        display: "flex", alignItems: "center", padding: "0 16px",
                        gap: 8, flexShrink: 0,
                    }}>
                        <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#FF5F56" }} />
                        <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#FFBD2E" }} />
                        <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#27C93F" }} />

                        {/* Search bar inside header */}
                        <div style={{
                            margin: "0 auto", width: 300, height: 24,
                            backgroundColor: "rgba(255,255,255,0.15)",
                            borderRadius: 6, display: "flex", alignItems: "center",
                            padding: "0 10px", color: "rgba(255,255,255,0.5)"
                        }}>
                            <Icons.Search />
                        </div>
                    </div>

                    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                        {/* Sidebar (Dark Purple) */}
                        <div style={{
                            width: 65, backgroundColor: mockTheme.bgSidebar,
                            display: "flex", flexDirection: "column", alignItems: "center",
                            paddingTop: 16, gap: 16
                        }}>
                            <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>S</div>
                            {/* Dummy lines matching icons */}
                            <div style={{ width: 24, height: 2, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2 }} />
                            <div style={{ width: 24, height: 2, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2 }} />
                            <div style={{ width: 24, height: 2, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2 }} />
                        </div>

                        {/* Middle Pane (Faded Chat view) */}
                        <div style={{
                            flex: 1, position: "relative",
                            borderRight: `1px solid ${mockTheme.border}`
                        }}>
                            {/* Skeleton chat content */}
                            <div style={{ padding: 20, opacity: 0.3, filter: "blur(1px)" }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: mockTheme.textPrimary, marginBottom: 16 }}># account-harmony-labs</div>
                                {[1, 2, 3].map(i => (
                                    <div key={i} style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 6, backgroundColor: mockTheme.border }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ width: 100, height: 10, borderRadius: 4, backgroundColor: mockTheme.border, marginBottom: 8 }} />
                                            <div style={{ width: "80%", height: 8, borderRadius: 4, backgroundColor: mockTheme.border, marginBottom: 6 }} />
                                            <div style={{ width: "60%", height: 8, borderRadius: 4, backgroundColor: mockTheme.border }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ── Floating Glowing Badges ── */}

                            {/* Search Badge (top left-ish) */}
                            <div style={{
                                position: "absolute", top: 60, left: 10,
                                backgroundColor: isDark ? "#2A2A2A" : "#FFFFFF",
                                padding: "12px 16px",
                                borderRadius: 12,
                                display: "flex", alignItems: "center", gap: 10,
                                boxShadow: "0 12px 30px -5px rgba(139,92,246,0.3)",
                                border: `1px solid ${isDark ? "rgba(139,92,246,0.2)" : "rgba(139,92,246,0.1)"}`,
                                zIndex: 10,
                                transform: "translateY(0px)",
                                animation: "float 6s ease-in-out infinite"
                            }}>
                                <span style={{ color: "#E879F9" }}><Icons.Search /></span>
                                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#C026D3" }}>Searching your latest<br />messages</span>
                            </div>

                            {/* Writing Badge (middle right-ish) */}
                            <div style={{
                                position: "absolute", top: 160, right: -20,
                                backgroundColor: isDark ? "#2A2A2A" : "#FFFFFF",
                                padding: "12px 16px",
                                borderRadius: 12,
                                display: "flex", alignItems: "center", gap: 8,
                                boxShadow: "0 12px 30px -5px rgba(236,72,153,0.3)",
                                border: `1px solid ${isDark ? "rgba(236,72,153,0.2)" : "rgba(236,72,153,0.1)"}`,
                                zIndex: 10,
                                animation: "float 6s ease-in-out infinite 2s" // 2s delay so they bob out of sync
                            }}>
                                <span style={{ color: "#EC4899" }}><Icons.Pencil /></span>
                                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#D1D5DB", color: "#EC4899" }}>Writing 1:1 meeting prep</span>
                            </div>

                        </div>

                        {/* Right Pane (Sumora AI Panel) */}
                        <div style={{
                            width: 280, backgroundColor: mockTheme.bgPanel,
                            display: "flex", flexDirection: "column",
                            zIndex: 11 // Needs to sit above the floats
                        }}>
                            {/* Panel Header */}
                            <div style={{
                                padding: "16px", borderBottom: `1px solid ${mockTheme.border}`,
                                display: "flex", alignItems: "center", gap: 8
                            }}>
                                <div style={{ color: "#8B5CF6" }}><Icons.Sparkle /></div>
                                <span style={{ fontSize: 14, fontWeight: 700, color: mockTheme.textPrimary }}>Sumora AI</span>
                            </div>

                            {/* Panel Body */}
                            <div style={{ flex: 1, padding: 16, overflowY: "hidden", display: "flex", flexDirection: "column", gap: 20 }}>

                                {/* User Message */}
                                <div style={{ display: "flex", gap: 8 }}>
                                    <div style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: "#3B82F6", flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700 }}>FH</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: mockTheme.textPrimary, marginBottom: 4 }}>Faisal Hasan</div>
                                        <div style={{ fontSize: 12, color: mockTheme.textSec, lineHeight: 1.5 }}>
                                            Help me prep for my 1:1 with my manager. Summarise recent conversations and wins.
                                        </div>
                                    </div>
                                </div>

                                {/* AI Message */}
                                <div style={{ display: "flex", gap: 8 }}>
                                    <div style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: "#8B5CF6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: '#fff', fontSize: 12 }}><Icons.Sparkle /></div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: mockTheme.textPrimary, marginBottom: 4 }}>Sumora AI</div>
                                        <div style={{ fontSize: 12, color: mockTheme.textSec, lineHeight: 1.5, marginBottom: 12 }}>
                                            Your canvas is ready! I've created a comprehensive 1:1 meeting prep based on your recent project activity.
                                        </div>

                                        {/* Canvas Card */}
                                        <div style={{
                                            padding: 12, borderRadius: 8,
                                            border: `1px solid ${mockTheme.border}`,
                                            backgroundColor: mockTheme.cardBg,
                                            display: "flex", alignItems: "center", gap: 10
                                        }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: "#2D8CFF", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <Icons.Doc />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 11.5, fontWeight: 600, color: mockTheme.textPrimary }}>1:1 meeting prep</div>
                                                <div style={{ fontSize: 10, color: mockTheme.textSec }}>Can edit</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Panel Input */}
                            <div style={{ padding: 16, borderTop: `1px solid ${mockTheme.border}` }}>
                                <div style={{
                                    border: `1px solid ${mockTheme.border}`, borderRadius: 8,
                                    padding: "8px 12px", display: "flex", justifyContent: "space-between"
                                }}>
                                    <span style={{ fontSize: 12, color: mockTheme.textSec }}>Message Sumora AI...</span>
                                    <Icons.ArrowRight />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Inline keyframes for the floating animations */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes float {
                        0%   { transform: translateY(0px); }
                        50%  { transform: translateY(-8px); }
                        100% { transform: translateY(0px); }
                    }
                `}} />
            </div>

        </div>
    );
}
