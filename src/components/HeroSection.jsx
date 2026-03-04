"use client";

import { useTheme } from "./ThemeProvider";
import FeatureShowcase from "./FeatureShowcase";

/* ══════════════════════════════════════════════════
   THEME COLOR MAP  — passed as `c` to every child
══════════════════════════════════════════════════ */
export const LIGHT = {
    cardBg: "#ffffff",
    headerBg: "#ffffff",
    sidebarBg: "#F7F6F3",
    convBg: "#F4F3F0",
    panelBg: "#F7F6F3",
    border: "#ECEAE5",
    borderLight: "#F0EEEB",
    textPrimary: "#18181b",
    textSub: "#4b5563",
    textMuted: "#9ca3af",
    textLabel: "#b0ae a8",
    inputBg: "#F0EDE8",
    iconBg: "#ECEAE5",
    iconColor: "#9ca3af",
    activeBg: "rgba(108,99,255,0.09)",
    activeText: "#5B54EE",
    hoverBg: "rgba(0,0,0,0.04)",
    msgName: "#111827",
    msgText: "#4b5563",
    timeTxt: "#9ca3af",
    divider: "#f3f4f6",
    unreadBg: "#6C63FF",
    sendBg: "#6C63FF",
    shadow: "none",
};

export const DARK = {
    cardBg: "#1C1C1A",
    headerBg: "#1C1C1A",
    sidebarBg: "#161614",
    convBg: "#181816",
    panelBg: "#181816",
    border: "rgba(246,242,233,0.08)",
    borderLight: "rgba(246,242,233,0.05)",
    textPrimary: "#E8E4D9",
    textSub: "#9B9790",
    textMuted: "#5A5750",
    textLabel: "#4A4840",
    inputBg: "rgba(246,242,233,0.06)",
    iconBg: "rgba(246,242,233,0.07)",
    iconColor: "#5A5750",
    activeBg: "rgba(108,99,255,0.16)",
    activeText: "#9490FF",
    hoverBg: "rgba(246,242,233,0.04)",
    msgName: "#DDD9CE",
    msgText: "#7A7670",
    timeTxt: "#4A4840",
    divider: "rgba(246,242,233,0.06)",
    unreadBg: "#6C63FF",
    sendBg: "#5B54EE",
    shadow: "none",
};

/* ══════════════════════════════════════════════════
   PRIMITIVE COMPONENTS
══════════════════════════════════════════════════ */
function Av({ initials, bg, size = 28 }) {
    return (
        <div style={{
            width: size, height: size, borderRadius: "50%",
            backgroundColor: bg, display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: size * 0.33, fontWeight: 700,
            color: "#fff", flexShrink: 0,
        }}>
            {initials}
        </div>
    );
}

function OnlineDot({ borderColor }) {
    return (
        <div style={{
            position: "absolute", bottom: -1, right: -1,
            width: 8, height: 8, borderRadius: "50%",
            backgroundColor: "#22C55E",
            border: `1.5px solid ${borderColor}`,
        }} />
    );
}

/* ── Clean SVG Icons ── */
const Icons = {
    Chat: () => (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    ),
    People: () => (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    Phone: () => (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 4.36 12 19.79 19.79 0 0 1 3.11 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.91A16 16 0 0 0 15 16.91l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 23 18z" />
        </svg>
    ),
    File: () => (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
        </svg>
    ),
    Settings: () => (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
    Search: () => (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    Bell: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    ),
    Plus: () => (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    Video: () => (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
    ),
    Emoji: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 13s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
    ),
    Attach: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
    ),
    ChevDown: () => (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    ),
    More: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="5" r="1" fill="currentColor" />
            <circle cx="12" cy="12" r="1" fill="currentColor" />
            <circle cx="12" cy="19" r="1" fill="currentColor" />
        </svg>
    ),
};

/* ══════════════════════════════════════════════════
   SIDEBAR NAV ICON
══════════════════════════════════════════════════ */
function NavIcon({ Icon, label, active, c }) {
    return (
        <div title={label} style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 4, padding: "9px 6px", cursor: "default",
            borderRadius: 10, marginBottom: 2,
            backgroundColor: active ? c.activeBg : "transparent",
            color: active ? c.activeText : c.iconColor,
        }}>
            <Icon />
            <span style={{ fontSize: 7.5, fontWeight: active ? 700 : 500, color: "inherit" }}>{label}</span>
        </div>
    );
}

/* ══════════════════════════════════════════════════
   SECTION LABEL
══════════════════════════════════════════════════ */
function Label({ children, c }) {
    return (
        <div style={{
            fontSize: 8.5, fontWeight: 700,
            color: c.textMuted,
            textTransform: "uppercase", letterSpacing: "0.1em",
            marginBottom: 6, padding: "0 4px",
        }}>
            {children}
        </div>
    );
}

/* ══════════════════════════════════════════════════
   CONVERSATION ROW
══════════════════════════════════════════════════ */
function ConvRow({ av, bg, name, preview, time, unread, active, c }) {
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 9,
            padding: "8px 10px", borderRadius: 10,
            backgroundColor: active ? c.activeBg : "transparent",
            cursor: "default", marginBottom: 1,
        }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
                <Av initials={av} bg={bg} size={32} />
                <OnlineDot borderColor={active ? c.convBg : c.convBg} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                    <span style={{
                        fontSize: 11, fontWeight: 600,
                        color: active ? c.activeText : c.textPrimary,
                        overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                    }}>{name}</span>
                    <span style={{ fontSize: 8.5, color: c.textMuted, flexShrink: 0, marginLeft: 4 }}>{time}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{
                        fontSize: 10, color: c.textSub,
                        overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                    }}>{preview}</span>
                    {unread && (
                        <div style={{
                            flexShrink: 0, marginLeft: 4, width: 16, height: 16, borderRadius: "50%",
                            backgroundColor: c.unreadBg,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>{unread}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════
   CHAT MESSAGE
══════════════════════════════════════════════════ */
function Msg({ avatar, bg, name, time, text, c }) {
    return (
        <div style={{ display: "flex", gap: 11, marginBottom: 18 }}>
            <Av initials={avatar} bg={bg} size={32} />
            <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: c.msgName }}>{name}</span>
                    <span style={{ fontSize: 9.5, color: c.timeTxt }}>{time}</span>
                </div>
                <p style={{ fontSize: 12, color: c.msgText, lineHeight: 1.6, margin: 0 }}>{text}</p>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════
   MEMBER ROW
══════════════════════════════════════════════════ */
function MemRow({ initials, bg, name, role, c }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 11 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
                <Av initials={initials} bg={bg} size={26} />
                <OnlineDot borderColor={c.panelBg} />
            </div>
            <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: c.textPrimary, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{name}</div>
                {role && <div style={{ fontSize: 9, color: c.textMuted }}>{role}</div>}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════
   ICON BUTTON  (header toolbar)
══════════════════════════════════════════════════ */
function IconBtn({ children, c }) {
    return (
        <div style={{
            width: 30, height: 30, borderRadius: 8,
            backgroundColor: c.iconBg, color: c.iconColor,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "default", flexShrink: 0,
        }}>
            {children}
        </div>
    );
}

/* ══════════════════════════════════════════════════
   FULL DASHBOARD MOCKUP
══════════════════════════════════════════════════ */
export function DashboardMockup({ c }) {
    return (
        <div style={{
            width: "100%", borderRadius: 18,
            overflow: "hidden",
            boxShadow: c.shadow,
            backgroundColor: c.cardBg,
            display: "flex", flexDirection: "column",
            height: 500,
            fontFamily: "'Inter', system-ui, sans-serif",
        }}>

            {/* ══ GLOBAL APP HEADER ══ */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 18px", height: 52, flexShrink: 0,
                borderBottom: `1px solid ${c.border}`,
                backgroundColor: c.headerBg,
            }}>
                {/* Brand */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 64, flexShrink: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "#5B54EE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>S</span>
                    </div>
                </div>

                {/* Search */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 7, flex: 1,
                    maxWidth: 340, margin: "0 16px",
                    backgroundColor: c.inputBg,
                    borderRadius: 9, padding: "7px 12px",
                    border: `1px solid ${c.border}`,
                    color: c.textMuted,
                }}>
                    <Icons.Search />
                    <span style={{ fontSize: 11, color: c.textMuted }}>Search messages, channels…</span>
                </div>

                {/* Right controls */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <IconBtn c={c}><Icons.Bell /></IconBtn>
                    <IconBtn c={c}><Icons.Plus /></IconBtn>
                    <div style={{ width: 1, height: 20, backgroundColor: c.border, margin: "0 2px" }} />
                    <div style={{ position: "relative" }}>
                        <Av initials="AC" bg="#6C63FF" size={30} />
                        <OnlineDot borderColor={c.headerBg} />
                    </div>
                    <div>
                        <div style={{ fontSize: 10.5, fontWeight: 600, color: c.textPrimary, lineHeight: 1.2 }}>Alfredo C.</div>
                        <div style={{ fontSize: 8.5, color: c.textMuted }}>Online</div>
                    </div>
                    <div style={{ color: c.textMuted }}><Icons.ChevDown /></div>
                </div>
            </div>

            {/* ══ BODY ══ */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

                {/* ── ICON SIDEBAR (60px) ── */}
                <div style={{
                    width: 60, flexShrink: 0,
                    borderRight: `1px solid ${c.border}`,
                    backgroundColor: c.sidebarBg,
                    display: "flex", flexDirection: "column", alignItems: "center",
                    padding: "12px 6px",
                }}>
                    <NavIcon Icon={Icons.Chat} label="Chats" active c={c} />
                    <NavIcon Icon={Icons.People} label="Groups" c={c} />
                    <NavIcon Icon={Icons.Phone} label="Calls" c={c} />
                    <NavIcon Icon={Icons.File} label="Files" c={c} />
                    <div style={{ flex: 1 }} />
                    <NavIcon Icon={Icons.Settings} label="Settings" c={c} />
                </div>

                {/* ── CONVERSATION LIST (220px) ── */}
                <div style={{
                    width: 220, flexShrink: 0,
                    borderRight: `1px solid ${c.border}`,
                    backgroundColor: c.convBg,
                    display: "flex", flexDirection: "column",
                }}>
                    {/* Header */}
                    <div style={{ padding: "12px 12px 8px", borderBottom: `1px solid ${c.borderLight}` }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: c.textPrimary }}>Messages</span>
                            <div style={{ color: "#6C63FF" }}><Icons.Plus /></div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: c.inputBg, borderRadius: 8, padding: "6px 10px", color: c.textMuted }}>
                            <Icons.Search />
                            <span style={{ fontSize: 10.5, color: c.textMuted }}>Search…</span>
                        </div>
                    </div>

                    <div style={{ flex: 1, padding: "10px 6px", overflowY: "hidden" }}>
                        <Label c={c}>Channels</Label>
                        <ConvRow av="GN" bg="#6C63FF" name="# general" preview="Talan: all smooth" time="5:38" active c={c} />
                        <ConvRow av="DT" bg="#EC4899" name="# design-team" preview="New mockups uploaded" time="4:12" unread={3} c={c} />
                        <ConvRow av="DV" bg="#34D399" name="# dev-updates" preview="PR #42 is ready" time="3:00" c={c} />
                        <ConvRow av="AN" bg="#FBBF24" name="# announcements" preview="Team offsite Friday" time="Mon" c={c} />
                        <div style={{ marginTop: 10 }}>
                            <Label c={c}>Direct Messages</Label>
                        </div>
                        <ConvRow av="TK" bg="#8B5CF6" name="Tiana Korsgaard" preview="Thanks for the update!" time="2:58" unread={1} c={c} />
                        <ConvRow av="CD" bg="#FF7878" name="Corey Dies" preview="Seen the new figma?" time="Tue" c={c} />
                    </div>
                </div>

                {/* ── MAIN CHAT ── */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", backgroundColor: c.cardBg }}>
                    {/* Chat header */}
                    <div style={{
                        padding: "12px 18px", borderBottom: `1px solid ${c.border}`,
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 13.5, fontWeight: 700, color: c.textPrimary }}># general</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <div style={{ display: "flex" }}>
                                    {["#6C63FF", "#FF7878", "#34D399"].map((col, i) => (
                                        <div key={col} style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: col, border: `2px solid ${c.cardBg}`, marginLeft: i ? -5 : 0 }} />
                                    ))}
                                </div>
                                <span style={{ fontSize: 10, color: c.textMuted }}>9 Members</span>
                                <span style={{ fontSize: 10, color: "#22C55E", fontWeight: 600 }}>· 4 Online</span>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, color: c.iconColor }}>
                            <IconBtn c={c}><Icons.Search /></IconBtn>
                            <IconBtn c={c}><Icons.Video /></IconBtn>
                            <IconBtn c={c}><Icons.More /></IconBtn>
                        </div>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, padding: "18px 18px 0", overflowY: "hidden" }}>
                        <Msg avatar="TK" bg="#8B5CF6" name="Tiana Korsgaard" time="5:30 PM"
                            text="It's going well. We've made some good progress on the design and we're starting to work on the development phase."
                            c={c} />
                        <Msg avatar="CD" bg="#FF7878" name="Corey Dies" time="5:32 PM"
                            text="That's great to hear. Have you run into any issues or roadblocks so far?"
                            c={c} />
                        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 16px" }}>
                            <div style={{ flex: 1, height: 1, backgroundColor: c.divider }} />
                            <span style={{ fontSize: 9.5, color: c.textMuted }}>Today</span>
                            <div style={{ flex: 1, height: 1, backgroundColor: c.divider }} />
                        </div>
                        <Msg avatar="TR" bg="#34D399" name="Talan Rosser" time="5:38 PM"
                            text="Not really, everything has been going smoothly. We did have to make some changes to the initial plan, but we were able to adjust quickly."
                            c={c} />
                    </div>

                    {/* Message input */}
                    <div style={{
                        margin: "10px 16px 14px",
                        display: "flex", alignItems: "center", gap: 10,
                        backgroundColor: c.inputBg, borderRadius: 12, padding: "10px 14px",
                        border: `1px solid ${c.border}`,
                    }}>
                        <span style={{ fontSize: 11, color: c.textMuted, flex: 1 }}>Write a message…</span>
                        <div style={{ display: "flex", gap: 8, color: c.iconColor }}>
                            <Icons.Emoji /><Icons.Attach />
                        </div>
                        <div style={{ backgroundColor: c.sendBg, borderRadius: 8, padding: "5px 14px", cursor: "default" }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>Send</span>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT DETAIL PANEL (190px) ── */}
                <div style={{
                    width: 190, flexShrink: 0,
                    borderLeft: `1px solid ${c.border}`,
                    backgroundColor: c.panelBg,
                    display: "flex", flexDirection: "column",
                }}>
                    <div style={{ padding: "13px 14px", borderBottom: `1px solid ${c.borderLight}` }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: c.textPrimary }}>Detail Channels</span>
                    </div>

                    <div style={{ padding: "11px 14px", borderBottom: `1px solid ${c.borderLight}` }}>
                        <Label c={c}>Name Channel</Label>
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: c.textPrimary }}># general</span>
                    </div>

                    <div style={{ padding: "11px 14px", borderBottom: `1px solid ${c.borderLight}` }}>
                        <Label c={c}>About</Label>
                        <p style={{ fontSize: 10.5, color: c.textSub, lineHeight: 1.6, margin: 0 }}>
                            Team chat, announcements, and collaboration hub.
                        </p>
                    </div>

                    <div style={{ padding: "11px 14px", flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                            <Label c={c}>Member</Label>
                            <div style={{ color: "#6C63FF" }}><Icons.Plus /></div>
                        </div>
                        <MemRow initials="AL" bg="#6C63FF" name="Alfredo Carder" role="Owner" c={c} />
                        <MemRow initials="AP" bg="#FF7878" name="Alfredo Pr." c={c} />
                        <MemRow initials="TK" bg="#8B5CF6" name="Tiana K." c={c} />
                        <MemRow initials="CD" bg="#EC4899" name="Corey D." c={c} />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════
   MARQUEE STRIP — 5 integrations, SVG logos
══════════════════════════════════════════════════ */

const BRAND_PATHS = {
    whatsapp: "M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.966-.945 1.164-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375a9.869 9.869 0 0 1-1.516-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z",
    discord: "M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.055 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.62.874-1.275 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z",
    telegram: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z",
    slack: "M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z",
    zoom: "M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zM7.2 8.4A1.2 1.2 0 0 0 6 9.6v4.8A1.2 1.2 0 0 0 7.2 15.6h7.2a1.2 1.2 0 0 0 1.2-1.2v-.833l3.6 1.8V8.433L15.6 10.23V9.6A1.2 1.2 0 0 0 14.4 8.4H7.2z"
};

const INTEGRATIONS = [
    { name: "WhatsApp", bg: "#25D366", icon: "whatsapp" },
    { name: "Discord", bg: "#5865F2", icon: "discord" },
    { name: "Telegram", bg: "#26A5E4", icon: "telegram" },
    { name: "Slack", bg: "#4A154B", icon: "slack" },
    { name: "Zoom", bg: "#2D8CFF", icon: "zoom" }
];

function IntegrationChip({ name, bg, icon }) {
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 9,
            padding: "8px 18px 8px 8px",
            borderRadius: 12,
            border: "1px solid var(--border)",
            flexShrink: 0,
            userSelect: "none",
            pointerEvents: "none",
        }}>
            <div style={{
                width: 30, height: 30, borderRadius: 8,
                backgroundColor: bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
            }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true" style={{ display: "block" }}>
                    <path d={BRAND_PATHS[icon]} />
                </svg>
            </div>
            <span style={{
                fontSize: 13, fontWeight: 600,
                color: "var(--fg-primary)",
                whiteSpace: "nowrap", lineHeight: 1,
            }}>
                {name}
            </span>
        </div>
    );
}

function MarqueeStrip() {
    /* Create an array of exactly 40 items (5 integrations × 8 repeats).
       Since 50% of 40 is 20, the -50% CSS animation shift perfectly lines up
       with exactly 4 repeating sets of the 5 apps. Seamless pixel-perfect loop. */
    const track = Array.from({ length: 8 }, () => INTEGRATIONS).flat();

    return (
        <div
            aria-hidden="true"
            style={{
                position: "relative",
                overflow: "hidden",
                padding: "28px 0",
                pointerEvents: "none",
            }}
        >
            {/* Left gradient fade */}
            <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: 140,
                zIndex: 2, pointerEvents: "none",
                background: "linear-gradient(to right, var(--bg-primary) 0%, transparent 100%)",
            }} />

            {/* Right gradient fade */}
            <div style={{
                position: "absolute", right: 0, top: 0, bottom: 0, width: 140,
                zIndex: 2, pointerEvents: "none",
                background: "linear-gradient(to left, var(--bg-primary) 0%, transparent 100%)",
            }} />

            {/* Scrolling track */}
            <div style={{
                display: "flex",
                gap: 14,
                width: "max-content",
                animation: "marquee-scroll 32s linear infinite",
                willChange: "transform",
            }}>
                {track.map((item, i) => (
                    <IntegrationChip key={i} {...item} />
                ))}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════
   HERO SECTION
══════════════════════════════════════════════════ */
export default function HeroSection() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const c = isDark ? DARK : LIGHT;

    return (
        <section style={{ position: "relative", overflow: "hidden", backgroundColor: "var(--bg-primary)" }}>

            {/* Gradient — light */}
            <div aria-hidden="true" style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                opacity: isDark ? 0 : 1, transition: "opacity 0.5s ease",
                background: `
          radial-gradient(ellipse 110% 60% at 50% -10%,
            rgba(255,186,130,0.80) 0%, rgba(255,207,160,0.52) 30%,
            rgba(255,220,190,0.28) 55%, transparent 72%),
          radial-gradient(ellipse 65% 50% at 15% 55%,
            rgba(255,172,140,0.28) 0%, transparent 60%),
          radial-gradient(ellipse 65% 50% at 85% 55%,
            rgba(255,155,190,0.22) 0%, transparent 60%)`,
            }} />

            {/* Gradient — dark */}
            <div aria-hidden="true" style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                opacity: isDark ? 1 : 0, transition: "opacity 0.5s ease",
                background: `
          radial-gradient(ellipse 110% 60% at 50% -10%,
            rgba(110,45,14,0.85) 0%, rgba(65,28,9,0.55) 30%,
            rgba(35,18,8,0.22) 55%, transparent 72%),
          radial-gradient(ellipse 65% 50% at 15% 55%,
            rgba(130,55,22,0.20) 0%, transparent 60%),
          radial-gradient(ellipse 65% 50% at 85% 55%,
            rgba(110,30,70,0.15) 0%, transparent 60%)`,
            }} />

            {/* Dot grid */}
            <div aria-hidden="true" style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                opacity: isDark ? 0.05 : 0.035, transition: "opacity 0.5s ease",
                backgroundImage: "radial-gradient(circle, var(--fg-primary) 1px, transparent 1px)",
                backgroundSize: "30px 30px",
                WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, black 0%, transparent 70%)",
                maskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, black 0%, transparent 70%)",
            }} />

            {/* ── Hero Text ── */}
            <div style={{
                position: "relative", zIndex: 10,
                maxWidth: 660, margin: "0 auto",
                padding: "58px 24px 38px", textAlign: "center",
            }}>
                <div style={{ marginBottom: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg-secondary)" }}>
                        Unlock Conversational Power
                    </span>
                </div>

                <h1 style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "clamp(1.95rem, 4.8vw, 3.4rem)",
                    fontWeight: 800, lineHeight: 1.11,
                    letterSpacing: "-0.04em",
                    color: "var(--fg-primary)",
                    marginBottom: 18, marginTop: 0,
                }}>
                    Empower Your Conversations with Next‑Gen Messaging Dashboard
                </h1>

                <p style={{ fontSize: 15.5, color: "var(--fg-secondary)", maxWidth: 440, margin: "0 auto 32px", lineHeight: 1.7 }}>
                    Unlock seamless communication and streamline your messaging experience with our innovative dashboard solution.
                </p>

                <a href="/sign-up"
                    style={{
                        display: "inline-block", padding: "11px 38px", borderRadius: 9999,
                        border: "1.5px solid var(--fg-primary)", color: "var(--fg-primary)",
                        backgroundColor: "transparent", fontSize: 13.5, fontWeight: 600,
                        cursor: "pointer", textDecoration: "none",
                        transition: "background-color 0.2s ease, color 0.2s ease",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--fg-primary)"; e.currentTarget.style.color = "var(--bg-primary)"; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--fg-primary)"; }}
                >
                    Get Started
                </a>
            </div>

            {/* ── Dashboard ── */}
            <div style={{ position: "relative", zIndex: 10, maxWidth: 1160, margin: "0 auto", padding: "0 28px" }}>

                {/* Glass Border Wrapper */}
                <div style={{
                    padding: 10,
                    borderRadius: 26,
                    background: "transparent",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}`,
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    WebkitMaskImage: "linear-gradient(to bottom, black 65%, transparent 100%)",
                    maskImage: "linear-gradient(to bottom, black 65%, transparent 100%)",
                }}>
                    <DashboardMockup c={c} />
                </div>

            </div>

            {/* ── Marquee strip ── */}
            <div style={{ position: "relative", zIndex: 10, marginTop: 32 }}>
                <p style={{
                    textAlign: "center", fontSize: 12, fontWeight: 600,
                    letterSpacing: "0.16em", textTransform: "uppercase",
                    color: "var(--fg-secondary)", opacity: 0.6,
                    marginBottom: 20,
                }}>
                    Integrates with the tools your team already uses
                </p>
                <MarqueeStrip />
            </div>

            <div style={{ height: 48 }} />

            {/* ── Feature Showcase ── */}
            <FeatureShowcase />

        </section>
    );
}
