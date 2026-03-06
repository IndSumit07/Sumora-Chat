"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Camera, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { v4 as uuidv4 } from "uuid";
import { createPortal } from "react-dom";

export default function ProfileSettingsModal({ onClose }) {
    const { user } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || "");
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploading(true);
        setErrorMsg("");
        setSuccess(false);

        try {
            const supabase = createClient();
            const ext = file.name.split(".").pop();
            const path = `${user.id}/${uuidv4()}.${ext}`;

            // Upload via storage
            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(path, file, {
                    contentType: file.type,
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: publicData } = supabase.storage
                .from("avatars")
                .getPublicUrl(path);

            const newUrl = publicData.publicUrl;

            // Update user metadata in Auth
            const { error: authError } = await supabase.auth.updateUser({
                data: { avatar_url: newUrl }
            });

            if (authError) throw authError;

            // Update profiles table
            const { error: profileError } = await supabase
                .from("profiles")
                .update({ avatar_url: newUrl })
                .eq("id", user.id);

            if (profileError) throw profileError;

            setAvatarUrl(newUrl);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to upload profile picture:", err);
            setErrorMsg(err.message || "Failed to upload picture.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    if (typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-[999] bg-black/40 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-background border border-border rounded-3xl p-8 max-w-[400px] w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-foreground/40 hover:text-foreground hover:bg-foreground/5 rounded-full transition-all"
                >
                    <X size={20} />
                </button>

                <div className="text-center mb-6">
                    <h3 className="text-2xl font-black text-foreground tracking-tight mb-2">Profile Settings</h3>
                    <p className="text-[14px] text-foreground/60 font-semibold">Update your profile picture.</p>
                </div>

                <div className="flex flex-col items-center gap-6 relative z-10 w-full">
                    {/* Avatar preview */}
                    <div className="relative group cursor-pointer w-32 h-32" onClick={() => !uploading && fileInputRef.current?.click()}>
                        <div className="w-full h-full rounded-[40px] overflow-hidden bg-foreground/5 border-2 border-border shadow-xl">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:opacity-50 transition-all duration-300" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center font-black text-foreground/30 text-5xl group-hover:opacity-50 transition-all duration-300">
                                    {user?.email?.charAt(0).toUpperCase() || "?"}
                                </div>
                            )}
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 rounded-[40px] bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <Camera size={28} className="text-white" />
                        </div>

                        {uploading && (
                            <div className="absolute inset-0 rounded-[40px] bg-background/80 flex items-center justify-center backdrop-blur-sm z-10">
                                <Loader2 size={32} className="animate-spin text-emerald-500" />
                            </div>
                        )}

                        {success && (
                            <div className="absolute inset-0 rounded-[40px] bg-emerald-500/90 flex items-center justify-center backdrop-blur-sm z-10 animate-in zoom-in duration-300">
                                <Check size={36} className="text-white" strokeWidth={3} />
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="text-center w-full bg-foreground/5 p-4 rounded-2xl">
                        <p className="text-foreground/90 font-bold text-[15px]">{user?.user_metadata?.full_name || 'My Contact Info'}</p>
                        <p className="text-foreground/50 font-semibold text-[13px]">{user?.email}</p>
                    </div>

                    {errorMsg && (
                        <p className="text-red-500 text-[12px] font-bold text-center bg-red-500/10 px-4 py-2 rounded-xl">{errorMsg}</p>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
