"use client";

import { motion } from "framer-motion";
import { useTheme } from "./ThemeProvider";

/* ── inline SVG icons ─────────────────────────── */
function SunIcon() {
    return (
        <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
        >
            <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
            <line x1="12" y1="2" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
            <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
            <line x1="2" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="22" y2="12" />
            <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
            <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="currentColor"
        >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    );
}

/* ─────────────────────────────────────────────────
 *  Animated toggle:
 *  Light mode → track is dark (#141413), knob is cream (#F6F2E9), moon icon
 *  Dark  mode → track is cream (#F6F2E9), knob is dark (#141413), sun icon
 * ─────────────────────────────────────────────────*/
export default function ThemeToggle() {
    const { theme, toggle } = useTheme();
    const isDark = theme === "dark";

    // knob travel = track_width - 2*padding - knob_size = 52 - 6 - 22 = 24 px
    const TRAVEL = 24;

    return (
        <motion.button
            onClick={toggle}
            whileTap={{ scale: 0.88 }}
            whileHover={{ opacity: 0.88 }}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
                width: 52,
                height: 28,
                borderRadius: 14,
                padding: 3,
                cursor: "pointer",
                border: "none",
                outline: "none",
                backgroundColor: isDark ? "#F6F2E9" : "#141413",
                transition: "background-color 0.45s ease",
            }}
        >
            {/* ── Sun icon (shows in dark mode, left side of track) ── */}
            <motion.span
                aria-hidden="true"
                animate={{
                    opacity: isDark ? 1 : 0,
                    scale: isDark ? 1 : 0.3,
                    rotate: isDark ? 0 : -90,
                }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                style={{
                    position: "absolute",
                    left: 7,
                    top: "50%",
                    translateY: "-50%",
                    color: "#B8860B",
                    display: "flex",
                    alignItems: "center",
                    pointerEvents: "none",
                }}
            >
                <SunIcon />
            </motion.span>

            {/* ── Moon icon (shows in light mode, right side of track) ── */}
            <motion.span
                aria-hidden="true"
                animate={{
                    opacity: isDark ? 0 : 1,
                    scale: isDark ? 0.3 : 1,
                    rotate: isDark ? 90 : 0,
                }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    translateY: "-50%",
                    color: "#d4cfc6",
                    display: "flex",
                    alignItems: "center",
                    pointerEvents: "none",
                }}
            >
                <MoonIcon />
            </motion.span>

            {/* ── Sliding knob ── */}
            <motion.span
                aria-hidden="true"
                animate={{ x: isDark ? TRAVEL : 0 }}
                transition={{ type: "spring", stiffness: 560, damping: 28 }}
                style={{
                    position: "absolute",
                    top: 3,
                    left: 3,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    backgroundColor: isDark ? "#141413" : "#F6F2E9",
                    boxShadow: isDark
                        ? "0 1px 6px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.08)"
                        : "0 1px 6px rgba(0,0,0,0.25), 0 0 0 0.5px rgba(0,0,0,0.06)",
                    transition: "background-color 0.4s ease, box-shadow 0.4s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            />
        </motion.button>
    );
}
