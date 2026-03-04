"use client";

import { useState } from "react";
import { useTheme } from "./ThemeProvider";
import { DashboardMockup, LIGHT, DARK } from "./HeroSection";

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

    // Pass color map to imported mockup layout
    const c = isDark ? DARK : LIGHT;

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
            <div style={{ flex: "1.5 1 500px", position: "relative", height: 520 }}>

                {/* Decorative background glow behind the mockup */}
                <div aria-hidden="true" style={{
                    position: "absolute",
                    top: "10%", right: "10%", width: "60%", height: "60%",
                    background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 60%)",
                    filter: "blur(60px)", pointerEvents: "none", zIndex: 0
                }} />

                {/* Glass Border Wrapper bleeding out to the right */}
                <div style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: 1100, // Forces the component to bleed outside the grid container limits
                    zIndex: 2,
                    padding: 10,
                    borderRadius: 26,
                    background: "transparent",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}`,
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                }}>
                    <DashboardMockup c={c} />

                    {/* Layer the floating badges onto the Dashboard directly! */}
                    {/* Search Badge (top left-ish) */}
                    <div style={{
                        position: "absolute", top: 110, left: 160,
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
                        position: "absolute", top: 240, left: 320,
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
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#EC4899" }}>Writing 1:1 meeting prep</span>
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
