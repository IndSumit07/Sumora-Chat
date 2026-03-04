"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/use-theme";
import { DARK, LIGHT } from "@/components/home/HeroSection";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAuth } from "@/hooks/use-auth";
import ButtonSpinner from "@/components/ui/ButtonSpinner";

function SumoraLogo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 select-none group justify-center mb-10"
    >
      <span
        className="flex items-center justify-center w-8 h-8 rounded-[10px] shrink-0 transition-transform duration-200 group-hover:scale-105"
        style={{ backgroundColor: "var(--fg-primary)" }}
      >
        <svg
          width="18"
          height="18"
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
        className="text-2xl font-bold tracking-tight"
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

function AuthFeatures({ c, isDark }) {
  return (
    <div
      style={{ maxWidth: 440, padding: 40, position: "relative", zIndex: 10 }}
    >
      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "2.25rem",
          fontWeight: 800,
          color: "var(--fg-primary)",
          lineHeight: 1.1,
          marginBottom: 16,
        }}
      >
        Everything you need to connect.
      </h2>
      <p
        style={{
          fontSize: 15,
          color: c.textSub,
          marginBottom: 40,
          lineHeight: 1.6,
        }}
      >
        Experience a fast, minimal, and beautiful workspace designed to enhance
        your daily communication workflow.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {/* Feature 1 */}
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div
            style={{
              padding: 10,
              borderRadius: 12,
              backgroundColor: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.04)",
              color: "var(--fg-primary)",
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </div>
          <div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--fg-primary)",
                marginBottom: 4,
              }}
            >
              Lightning Fast
            </h3>
            <p style={{ fontSize: 13.5, color: c.textMuted, lineHeight: 1.5 }}>
              Real-time messaging with sub-millisecond latency. Always instantly
              in sync across devices.
            </p>
          </div>
        </div>

        {/* Feature 2 */}
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div
            style={{
              padding: 10,
              borderRadius: 12,
              backgroundColor: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.04)",
              color: "var(--fg-primary)",
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--fg-primary)",
                marginBottom: 4,
              }}
            >
              Secure by Default
            </h3>
            <p style={{ fontSize: 13.5, color: c.textMuted, lineHeight: 1.5 }}>
              End-to-end encryption ensures your conversations stay private
              between you and your team.
            </p>
          </div>
        </div>

        {/* Feature 3 */}
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div
            style={{
              padding: 10,
              borderRadius: 12,
              backgroundColor: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.04)",
              color: "var(--fg-primary)",
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--fg-primary)",
                marginBottom: 4,
              }}
            >
              AI-Powered Workflow
            </h3>
            <p style={{ fontSize: 13.5, color: c.textMuted, lineHeight: 1.5 }}>
              Built-in smart assistant helps you draft, search, and manage your
              communication seamlessly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const c = isDark ? DARK : LIGHT;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard/chat");
    }
  }, [user, authLoading, router]);

  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <ButtonSpinner />
      </div>
    );
  }

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success("Account created! Please check your email.");
      router.push("/dashboard/chat");
    }
  };

  const handleGoogleSignUp = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) toast.error(error.message);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-primary)",
        display: "flex",
        flexDirection: "row", // Enforce linear flow (left = dash, right = form)
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Decorators */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background:
            "linear-gradient(135deg, rgba(139,92,246,0.06) 0%, transparent 40%, rgba(236,72,153,0.04) 100%)",
        }}
      />

      {/* Left Side: Features Showcase (50%) */}
      <div
        className="hidden lg:flex"
        style={{
          flex: "1 1 50%",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
          position: "relative",
          overflow: "hidden",
          backgroundColor: isDark ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <AuthFeatures c={c} isDark={isDark} />
        </motion.div>
      </div>

      {/* Right Side: Form Container (50%) */}
      <div
        style={{
          flex: "1 1 50%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
          position: "relative",
          zIndex: 10,
          borderLeft: `1px solid ${c.border}`,
          backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)",
        }}
      >
        {/* Theme Toggle localized to form */}
        <div style={{ position: "absolute", top: 24, right: 24 }}>
          <ThemeToggle />
        </div>

        <div style={{ width: "100%", maxWidth: 420 }}>
          <SumoraLogo />

          <div
            style={{
              backgroundColor: isDark
                ? "rgba(255,255,255,0.02)"
                : "rgba(0,0,0,0.01)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
              borderRadius: 24,
              padding: "40px 32px",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow: c.shadow,
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <h1
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  color: "var(--fg-primary)",
                  margin: "0 0 8px 0",
                }}
              >
                Create an account
              </h1>
              <p
                style={{
                  fontSize: 14.5,
                  color: c.textMuted,
                  margin: 0,
                }}
              >
                Sign up to get started with Sumora.
              </p>
            </div>

            {/* OAuth Button */}
            <button
              onClick={handleGoogleSignUp}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                width: "100%",
                padding: "12px 0",
                borderRadius: 12,
                backgroundColor: "var(--bg-primary)",
                border: `1px solid ${c.borderStrong}`,
                color: "var(--fg-primary)",
                fontSize: 14.5,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--bg-primary)")
              }
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {loading ? <ButtonSpinner /> : "Sign up with Google"}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flex: 1, height: 1, backgroundColor: c.border }} />
              <span
                style={{ fontSize: 13, color: c.textMuted, fontWeight: 500 }}
              >
                or continue with
              </span>
              <div style={{ flex: 1, height: 1, backgroundColor: c.border }} />
            </div>

            {/* Removed inline error display */}

            {/* Email Form */}
            <form
              onSubmit={handleSignUp}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--fg-primary)",
                    paddingLeft: 4,
                  }}
                >
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jony Ive"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 12,
                    backgroundColor: c.inputBg,
                    border: `1px solid ${c.border}`,
                    color: "var(--fg-primary)",
                    fontSize: 14.5,
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "var(--fg-primary)")
                  }
                  onBlur={(e) => (e.currentTarget.style.borderColor = c.border)}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--fg-primary)",
                    paddingLeft: 4,
                  }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 12,
                    backgroundColor: c.inputBg,
                    border: `1px solid ${c.border}`,
                    color: "var(--fg-primary)",
                    fontSize: 14.5,
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "var(--fg-primary)")
                  }
                  onBlur={(e) => (e.currentTarget.style.borderColor = c.border)}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--fg-primary)",
                    paddingLeft: 4,
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 12,
                    backgroundColor: c.inputBg,
                    border: `1px solid ${c.border}`,
                    color: "var(--fg-primary)",
                    fontSize: 14.5,
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "var(--fg-primary)")
                  }
                  onBlur={(e) => (e.currentTarget.style.borderColor = c.border)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "13px 0",
                  borderRadius: 12,
                  backgroundColor: "var(--fg-primary)",
                  color: "var(--bg-primary)",
                  fontSize: 14.5,
                  fontWeight: 600,
                  marginTop: 8,
                  cursor: loading ? "not-allowed" : "pointer",
                  border: "none",
                  transition: "opacity 0.2s ease",
                  opacity: loading ? 0.7 : 1,
                }}
                onMouseEnter={(e) =>
                  !loading && (e.currentTarget.style.opacity = 0.9)
                }
                onMouseLeave={(e) =>
                  !loading && (e.currentTarget.style.opacity = 1)
                }
              >
                <ButtonSpinner />
              </button>
            </form>
          </div>

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <span style={{ fontSize: 14, color: c.textMuted }}>
              Already have an account?{" "}
              <Link
                href="/sign-in"
                style={{
                  color: "var(--fg-primary)",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Log in
              </Link>
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
