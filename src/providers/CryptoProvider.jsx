"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { generateKeyPair } from "@/lib/crypto";

const CryptoContext = createContext({ userId: null, isReady: false });

export function CryptoProvider({ children }) {
    const [userId, setUserId] = useState(null);
    const [isReady, setIsReady] = useState(false);

    // Prevent double-init (React Strict Mode fires effects twice in dev)
    const initializingRef = useRef(false);
    const initializedForRef = useRef(null); // tracks which userId has been initialized

    useEffect(() => {
        const supabase = createClient();

        const initCrypto = async (user) => {
            if (!user) {
                setUserId(null);
                setIsReady(false);
                initializingRef.current = false;
                initializedForRef.current = null;
                return;
            }

            // Skip if already initializing or already done for this user
            if (initializingRef.current || initializedForRef.current === user.id) {
                return;
            }

            initializingRef.current = true;

            try {
                setUserId(user.id);

                // Fetch existing public_key for this user
                const { data: profile, error } = await supabase
                    .from("profiles")
                    .select("public_key")
                    .eq("id", user.id)
                    .maybeSingle();

                if (error) throw error;

                if (!profile?.public_key) {
                    // No key on record — generate fresh ECDH key pair
                    const publicKeyBase64 = await generateKeyPair(user.id);

                    // Persist public key to profile (private key already saved to IndexedDB)
                    const { error: updateError } = await supabase
                        .from("profiles")
                        .update({ public_key: publicKeyBase64 })
                        .eq("id", user.id);

                    if (updateError) throw updateError;
                }

                initializedForRef.current = user.id;
            } catch (err) {
                // Ignore AbortErrors from Strict Mode double-mount teardown
                if (err?.name === "AbortError") return;
                console.error("[CryptoProvider] Key init failed:", err.message);
            } finally {
                initializingRef.current = false;
                setIsReady(true);
            }
        };

        // Sync on mount with current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            initCrypto(session?.user ?? null);
        });

        // Listen to auth state changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_IN") {
                await initCrypto(session.user);
            } else if (event === "SIGNED_OUT") {
                setUserId(null);
                setIsReady(false);
                initializingRef.current = false;
                initializedForRef.current = null;
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return (
        <CryptoContext.Provider value={{ userId, isReady }}>
            {children}
        </CryptoContext.Provider>
    );
}

/**
 * Hook to access crypto context.
 * @returns {{ userId: string|null, isReady: boolean }}
 */
export function useCrypto() {
    const ctx = useContext(CryptoContext);
    if (ctx === undefined) {
        throw new Error("useCrypto must be used inside <CryptoProvider>");
    }
    return ctx;
}
