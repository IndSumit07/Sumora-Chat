"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const { error } = await supabase.auth.getSession();
      if (error) {
        console.error("Auth callback error:", error.message);
      }
      router.push("/dashboard/chat");
    };

    handleCallback();
  }, [router]);

  return (
    <div
      className="flex items-center justify-center min-vh-100"
      style={{ height: "100vh", backgroundColor: "var(--bg-primary)" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p style={{ color: "var(--fg-secondary)", fontSize: "14px" }}>
          Completing sign in...
        </p>
      </div>
    </div>
  );
}
