"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "./ThemeProvider";

/* ─────────────── nav links ─────────────── */
const NAV_LINKS = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Blog", href: "#blog" },
    { label: "Docs", href: "#docs" },
];

/* ─────────────────────────────────────────────────
 *  SnakeBorder  ─  clockwise animated SVG path
 *
 *  • Uses stroke="currentColor" so it automatically
 *    follows var(--fg-primary) when the theme flips.
 *  • Grows from leading edge / shrinks from trailing
 *    edge continuously (classic dash-offset trick).
 * ─────────────────────────────────────────────────*/
function SnakeBorder({ containerRef }) {
    const svgRef = useRef(null);
    const pathRef = useRef(null);
    const rafRef = useRef(null);
    const startTimeRef = useRef(null);
    const perimeterRef = useRef(0);

    useEffect(() => {
        const container = containerRef.current;
        const svg = svgRef.current;
        const path = pathRef.current;
        if (!container || !svg || !path) return;

        const DURATION = 3800; // ms per revolution
        const SNAKE_FRACTION = 0.28; // 28 % of perimeter
        const PAD = 2;    // half stroke-width pad

        const buildPath = () => {
            const { width: W, height: H } = container.getBoundingClientRect();
            if (!W || !H) return;

            const R = H / 2; // pill border-radius
            const svgW = W + PAD * 2;
            const svgH = H + PAD * 2;

            svg.setAttribute("width", String(svgW));
            svg.setAttribute("height", String(svgH));
            svg.style.left = `-${PAD}px`;
            svg.style.top = `-${PAD}px`;

            const ox = PAD, oy = PAD;

            // Clockwise rounded-rect (pill) path
            const d = [
                `M ${ox + R},${oy}`,
                `L ${ox + W - R},${oy}`,
                `A ${R} ${R} 0 0 1 ${ox + W} ${oy + R}`,
                `L ${ox + W},${oy + H - R}`,
                `A ${R} ${R} 0 0 1 ${ox + W - R} ${oy + H}`,
                `L ${ox + R},${oy + H}`,
                `A ${R} ${R} 0 0 1 ${ox} ${oy + H - R}`,
                `L ${ox},${oy + R}`,
                `A ${R} ${R} 0 0 1 ${ox + R} ${oy}`,
                "Z",
            ].join(" ");

            path.setAttribute("d", d);

            const P = path.getTotalLength();
            perimeterRef.current = P;
            const snakeLen = P * SNAKE_FRACTION;

            path.setAttribute("stroke-dasharray", `${snakeLen} ${P - snakeLen}`);
        };

        const animate = (ts) => {
            if (!startTimeRef.current) startTimeRef.current = ts;
            const t = ((ts - startTimeRef.current) % DURATION) / DURATION;
            const P = perimeterRef.current;
            if (P > 0) path.setAttribute("stroke-dashoffset", String(-t * P));
            rafRef.current = requestAnimationFrame(animate);
        };

        const timer = setTimeout(() => {
            buildPath();
            rafRef.current = requestAnimationFrame(animate);
        }, 60);

        const ro = new ResizeObserver(buildPath);
        ro.observe(container);

        return () => {
            clearTimeout(timer);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            ro.disconnect();
        };
    }, [containerRef]);

    return (
        <svg
            ref={svgRef}
            aria-hidden="true"
            className="absolute pointer-events-none"
            style={{
                overflow: "visible",
                zIndex: 0,
                // currentColor = var(--fg-primary) inherited from body
                color: "var(--fg-primary)",
            }}
        >
            <path
                ref={pathRef}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/* ─────────────────────────────────────────────────
 *  Logo
 * ─────────────────────────────────────────────────*/
function SumoraLogo() {
    return (
        <Link href="/" className="flex items-center gap-2.5 select-none group">
            <span
                className="flex items-center justify-center w-8 h-8 rounded-[10px] flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                style={{ backgroundColor: "var(--fg-primary)" }}
                aria-hidden="true"
            >
                <svg
                    width="18" height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M9 1.5C4.86 1.5 1.5 4.63 1.5 8.5c0 1.9.77 3.62 2.02 4.87L2.5 16.5l3.5-.92A7.42 7.42 0 0 0 9 16c4.14 0 7.5-3.13 7.5-7S13.14 1.5 9 1.5Z"
                        fill="var(--bg-primary)"
                    />
                    <circle cx="6.5" cy="8.5" r="1" fill="var(--fg-primary)" />
                    <circle cx="9" cy="8.5" r="1" fill="var(--fg-primary)" />
                    <circle cx="11.5" cy="8.5" r="1" fill="var(--fg-primary)" />
                </svg>
            </span>

            <span
                className="text-xl font-bold tracking-tight"
                style={{
                    fontFamily: "var(--font-heading)",
                    color: "var(--fg-primary)",
                }}
            >
                Sumora
            </span>
        </Link>
    );
}

/* ─────────────────────────────────────────────────
 *  Hamburger
 * ─────────────────────────────────────────────────*/
function HamburgerIcon({ open }) {
    return (
        <span className="flex flex-col gap-[5px] w-5">
            <span
                className={`block h-[1.5px] origin-center transition-all duration-300 ease-in-out ${open ? "rotate-45 translate-y-[6.5px]" : ""
                    }`}
                style={{ backgroundColor: "var(--fg-primary)" }}
            />
            <span
                className={`block h-[1.5px] transition-all duration-300 ease-in-out ${open ? "opacity-0 scale-x-0" : ""
                    }`}
                style={{ backgroundColor: "var(--fg-primary)" }}
            />
            <span
                className={`block h-[1.5px] origin-center transition-all duration-300 ease-in-out ${open ? "-rotate-45 -translate-y-[6.5px]" : ""
                    }`}
                style={{ backgroundColor: "var(--fg-primary)" }}
            />
        </span>
    );
}

/* ─────────────────────────────────────────────────
 *  Main Navbar
 * ─────────────────────────────────────────────────*/
export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const navPillRef = useRef(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return (
        <>
            {/* ── Fixed bar ─────────────────────────────── */}
            <header
                role="banner"
                style={{
                    position: "fixed",
                    top: 0, left: 0, right: 0,
                    zIndex: 50,
                    backgroundColor: "var(--bg-surface)",
                    backdropFilter: "blur(14px)",
                    borderBottom: `1px solid var(--border)`,
                    boxShadow: scrolled ? "var(--shadow-md)" : "none",
                    transition:
                        "background-color 0.45s ease, box-shadow 0.35s ease, border-color 0.45s ease",
                }}
            >
                <nav
                    aria-label="Main navigation"
                    className="max-w-7xl mx-auto flex items-center justify-between h-[68px] px-5 md:px-8"
                >
                    {/* Logo */}
                    <SumoraLogo />

                    {/* Center pill — desktop */}
                    <div
                        ref={navPillRef}
                        className="relative hidden md:flex items-center gap-0.5 px-3 py-2"
                        style={{
                            borderRadius: "9999px",
                            overflow: "visible",
                            backgroundColor: "var(--bg-pill)",
                            border: "1px solid var(--border)",
                        }}
                    >
                        <SnakeBorder containerRef={navPillRef} />
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="relative z-10 px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200"
                                style={{
                                    color: "var(--fg-secondary)",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = "var(--fg-primary)";
                                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = "var(--fg-secondary)";
                                    e.currentTarget.style.backgroundColor = "transparent";
                                }}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right actions — desktop */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* Theme toggle */}
                        <ThemeToggle />

                        <Link
                            href="/sign-in"
                            id="nav-login"
                            className="text-sm font-medium transition-colors duration-200"
                            style={{ color: "var(--fg-secondary)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg-primary)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-secondary)")}
                        >
                            Log In
                        </Link>

                        <Link
                            href="/sign-up"
                            id="nav-get-started"
                            className="text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-200 active:scale-95"
                            style={{
                                backgroundColor: "var(--fg-primary)",
                                color: "var(--bg-primary)",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                        >
                            Get Started
                        </Link>
                    </div>

                    {/* Hamburger — mobile */}
                    <button
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={menuOpen}
                        aria-controls="mobile-menu"
                        onClick={() => setMenuOpen((v) => !v)}
                        className="md:hidden p-2.5 rounded-xl transition-colors duration-150"
                        style={{ backgroundColor: menuOpen ? "var(--bg-hover)" : "transparent" }}
                    >
                        <HamburgerIcon open={menuOpen} />
                    </button>
                </nav>
            </header>

            {/* ── Mobile menu ───────────────────────────── */}
            <div
                id="mobile-menu"
                role="dialog"
                aria-modal="false"
                aria-label="Mobile navigation"
                className={`fixed top-[68px] left-0 right-0 z-40 md:hidden transition-all duration-300 ease-out ${menuOpen
                        ? "opacity-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 -translate-y-3 pointer-events-none"
                    }`}
                style={{
                    backgroundColor: "var(--bg-primary)",
                    borderBottom: "1px solid var(--border)",
                    boxShadow: "var(--shadow-md)",
                }}
            >
                <div className="max-w-7xl mx-auto flex flex-col p-4 gap-1">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className="flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-colors duration-150"
                            style={{ color: "var(--fg-secondary)" }}
                            onClick={() => setMenuOpen(false)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                                e.currentTarget.style.color = "var(--fg-primary)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.color = "var(--fg-secondary)";
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}

                    <div
                        className="my-2 border-t"
                        style={{ borderColor: "var(--border)" }}
                    />

                    {/* Theme row in mobile menu */}
                    <div className="flex items-center justify-between px-4 py-3">
                        <span
                            className="text-sm font-medium"
                            style={{ color: "var(--fg-secondary)" }}
                        >
                            Appearance
                        </span>
                        <ThemeToggle />
                    </div>

                    <Link
                        href="/sign-in"
                        className="flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-colors duration-150"
                        style={{ color: "var(--fg-secondary)" }}
                        onClick={() => setMenuOpen(false)}
                    >
                        Log In
                    </Link>
                    <Link
                        href="/sign-up"
                        className="flex items-center justify-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-150 active:scale-[0.98]"
                        style={{
                            backgroundColor: "var(--fg-primary)",
                            color: "var(--bg-primary)",
                        }}
                        onClick={() => setMenuOpen(false)}
                    >
                        Get Started
                    </Link>
                </div>
            </div>

            {/* Spacer */}
            <div className="h-[68px]" aria-hidden="true" />
        </>
    );
}
