"use client";

import { useTheme } from "@/hooks/use-theme";
import { DARK, LIGHT } from "@/components/home/HeroSection";
import React from "react";

const TESTIMONIALS = [
    { handle: "@orlandopedro_", text: "Love @sumora custom domains\n\nmakes the auth so much better", avatar: "OP", color: "#3B82F6" },
    { handle: "@sdusteric", text: "Loving #Sumora MCP. Claude Code would not only plan what data we should save but also figure out a migration script by checking what the schema looks like on", avatar: "SD", color: "#6366F1" },
    { handle: "@adm_lawson", text: "Love sumora edge functions. Cursor+Sumora+MCP+Docker desktop is all I need", avatar: "AL", color: "#EC4899" },
    { handle: "@gokul_i", text: "First time running @sumora in local. It just works. Very good DX imo.", avatar: "GI", color: "#FBBF24" },
    { handle: "@dadooos_", text: "Run sumora locally and just wow speed! This is insane.", avatar: "DD", color: "#8B5CF6" },
    { handle: "@xthemadgeniusx", text: "Lately been using Sumora over AWS/ GCP for products to save on costs and rapid builds(Vibe Code) that do not need all the Infra and the hefty costs that come with AWS/ GCP out the door. Great solution overall.", avatar: "MG", color: "#10B981" },
    { handle: "@pontusab", text: "I love everything about Sumora.", avatar: "PA", color: "#3B82F6" },
    { handle: "@viratt_mank", text: "Sumora has been a game changer for my weekend projects.", avatar: "VM", color: "#6366F1" },
    { handle: "@nerdburn", text: "It's fun, feels lightweight, and really quick to spin up user auth and a few tables. Almost too easy! Highly recommend.", avatar: "NB", color: "#6C63FF" },
    { handle: "@patrickc", text: "Very impressed by @sumora's growth. For new startups, they seem to have gone from \"promising\" to \"standard\" in remarkably short order.", avatar: "PC", color: "#F59E0B" },
    { handle: "@TyranBache", text: "Really impressed with @sumora's Assistant.\n\nIt has helped me troubleshoot and solve complex Configuration issues on Pinger.", avatar: "TB", color: "#6C63FF" },
    { handle: "@adeelibr", text: "@sumora shout out, their MCP is awesome. It's helping me create better row securities and telling me best practices for setting up a sumora app", avatar: "AD", color: "#EC4899" }
];

const Icons = {
    Discord: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.055 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.62.874-1.275 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
    ),
    XLogo: ({ size = 13 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    )
};

function TestimonialCard({ item, c, isDark }) {
    return (
        <div style={{
            width: 330,
            padding: 24,
            borderRadius: 16,
            border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
            backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            flexShrink: 0,
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ position: "relative" }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: "50%",
                        backgroundColor: item.color, color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, fontWeight: 700
                    }}>
                        {item.avatar}
                    </div>
                    <div style={{
                        position: "absolute", top: -4, left: -4,
                        width: 16, height: 16, borderRadius: "50%",
                        backgroundColor: isDark ? "#000" : "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: `2px solid ${isDark ? "#141413" : "#F6F2E9"}`,
                        color: isDark ? "#fff" : "#000"
                    }}>
                        <Icons.XLogo size={8} />
                    </div>
                </div>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: c.textPrimary }}>{item.handle}</span>
            </div>
            <p style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: c.textSub,
                margin: 0,
                whiteSpace: "pre-wrap" // Allows new lines like in the screenshot
            }}>
                {item.text}
            </p>
        </div>
    );
}

function TestimonialColumn({ column, c, isDark }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "max-content" }}>
            {column.map((item, i) => (
                <TestimonialCard key={`${item.handle}-${i}`} item={item} c={c} isDark={isDark} />
            ))}
        </div>
    );
}

function ScrollingGrid({ columns, c, isDark, speed = "55s" }) {
    // Array length 4 will work perfectly with translateX(-50%)
    const track = Array.from({ length: 4 }, () => columns).flat();

    return (
        <div
            style={{
                overflow: "hidden",
                width: "100%",
                height: 580, // Restored sufficient boundary for vertical fade calculation
                padding: "8px 0"
            }}
        >
            <div
                className="marquee-track"
                style={{
                    display: "flex",
                    gap: 16,
                    width: "max-content",
                    animation: `marquee-scroll ${speed} linear infinite`,
                    willChange: "transform",
                    transform: "translateZ(0)",
                }}
            >
                {track.map((col, i) => (
                    <TestimonialColumn key={`col-${i}`} column={col} c={c} isDark={isDark} />
                ))}
            </div>
        </div>
    );
}

export default function Testimonials() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const c = isDark ? DARK : LIGHT;

    // Split into varying length columns for masonry effect
    const columns = [
        [TESTIMONIALS[0], TESTIMONIALS[1]],
        [TESTIMONIALS[2], TESTIMONIALS[3], TESTIMONIALS[4]],
        [TESTIMONIALS[5], TESTIMONIALS[6], TESTIMONIALS[7]],
        [TESTIMONIALS[8], TESTIMONIALS[9], TESTIMONIALS[10], TESTIMONIALS[11]]
    ];

    return (
        <section className="hide-scrollbars" style={{
            padding: "80px 0 0",
            height: 780, // Fixed section height, cropping anything beyond
            backgroundColor: "var(--bg-primary)",
            overflow: "hidden",
            marginBottom: 100
        }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 50, padding: "0 24px" }}>
                <h2 style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "clamp(2rem, 4vw, 2.75rem)",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    color: "var(--fg-primary)",
                    marginTop: 0,
                    marginBottom: 12
                }}>
                    Join the community
                </h2>
                <p style={{
                    fontSize: 16,
                    color: "var(--fg-secondary)",
                    maxWidth: 500,
                    margin: "0 auto 24px"
                }}>
                    Discover what our community has to say about their Sumora experience.
                </p>

                <a href="https://discord.com" target="_blank" rel="noopener noreferrer"
                    style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "8px 16px", borderRadius: 8,
                        backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                        color: "var(--fg-primary)",
                        fontSize: 12.5, fontWeight: 500,
                        textDecoration: "none", cursor: "pointer",
                        transition: "background-color 0.2s ease"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"; }}
                >
                    <Icons.Discord />
                    Join us on Discord
                </a>
            </div>

            {/* Scrolling Area Container - Group hover will pause the track! */}
            <div className="testimonial-marquee-group" style={{
                display: "flex",
                width: "100%",
                WebkitMaskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
                maskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
                paddingBottom: 40 // Allow adequate fade travel space
            }}>
                <div style={{
                    width: "100%",
                    WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)",
                    maskImage: "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)"
                }}>
                    <ScrollingGrid columns={columns} c={c} isDark={isDark} />
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .testimonial-marquee-group:hover .marquee-track {
                    animation-play-state: paused !important;
                }
                .hide-scrollbars {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .hide-scrollbars::-webkit-scrollbar {
                    display: none;
                }
            `}} />
        </section>
    );
}
