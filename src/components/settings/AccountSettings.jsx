"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User, Mail, Key, Shield, Trash2, Camera, ChevronRight, Check, AlertCircle, LogOut, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

// Components
import ButtonSpinner from "@/components/ui/ButtonSpinner";
import ConfirmationModal from "@/components/settings/ConfirmationModal";

export default function AccountSettings() {
    const { user, signOut } = useAuth();
    const router = useRouter();

    // Separate loading states
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loadingEmail, setLoadingEmail] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);

    // Modal State
    const [modal, setModal] = useState({ open: false, type: "" });
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
    const [newEmail, setNewEmail] = useState(user?.email || "");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordSetThisSession, setPasswordSetThisSession] = useState(false);

    const isGoogleUser = user?.app_metadata?.provider === "google" || user?.identities?.some(id => id.provider === "google");
    const hasPassword = user?.identities?.some(id => id.provider === "email") || passwordSetThisSession;

    if (!user) {
        if (typeof window !== "undefined") router.push("/sign-in");
        return null;
    }

    // Moving internal component definitions outside later...


    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoadingProfile(true);

        const { error } = await supabase.auth.updateUser({
            data: { full_name: fullName },
        });

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Profile updated successfully!");
        }
        setLoadingProfile(false);
    };

    const handleUpdateEmail = async (e) => {
        e.preventDefault();
        setLoadingEmail(true);

        const { error } = await supabase.auth.updateUser({ email: newEmail });

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Confirmation email sent to your new address!");
        }
        setLoadingEmail(false);
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        setLoadingPassword(true);

        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Password updated successfully!");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordSetThisSession(true);
        }
        setLoadingPassword(false);
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== "delete my account") {
            toast.error("Please type the confirmation text correctly.");
            return;
        }

        setLoadingDelete(true);

        try {
            // Call the custom RPC function we created to delete the user account
            const { error } = await supabase.rpc('delete_user');

            if (error) {
                console.error("Deletion error:", error);
                toast.error(error.message || "Failed to delete account. Please try again.");
                setLoadingDelete(false);
            } else {
                // Deletion successful - sign out and redirect
                await signOut();
                toast.success("Account deleted successfully.");
                setModal({ open: false, type: "" });
                router.push("/");
            }
        } catch (err) {
            console.error("Unexpected error during deletion:", err);
            toast.error("An unexpected error occurred.");
            setLoadingDelete(false);
        }
    };

    // Moving internal component definitions outside later...


    const sectionStyle = {
        backgroundColor: "var(--bg-secondary)",
        borderRadius: "20px",
        padding: "24px",
        border: "1px solid var(--border)",
        marginBottom: "24px",
    };

    const inputStyle = {
        width: "100%",
        padding: "12px 16px",
        borderRadius: "12px",
        backgroundColor: "var(--bg-primary)",
        border: "1px solid var(--border)",
        color: "var(--fg-primary)",
        fontSize: "14px",
        outline: "none",
        marginTop: "8px",
    };

    const labelStyle = {
        fontSize: "13px",
        fontWeight: "600",
        color: "var(--fg-secondary)",
    };

    const buttonStyle = {
        padding: "10px 20px",
        borderRadius: "10px",
        backgroundColor: "var(--fg-primary)",
        color: "var(--bg-primary)",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        border: "none",
        marginTop: "16px",
        transition: "opacity 0.2s ease",
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: "var(--fg-primary)" }}>Account Settings</h1>
                    <p style={{ color: "var(--fg-secondary)" }}>Manage your profile, email, and security preferences.</p>
                </div>
                <button
                    onClick={() => setModal({ open: true, type: "signout" })}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-red-500/10 text-red-500 border border-transparent hover:border-red-500/20"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>

            <AnimatePresence>
                {modal.open && (
                    <ConfirmationModal
                        modal={modal}
                        setModal={setModal}
                        deleteConfirmText={deleteConfirmText}
                        setDeleteConfirmText={setDeleteConfirmText}
                        handleDeleteAccount={handleDeleteAccount}
                        signOut={signOut}
                        loadingDelete={loadingDelete}
                    />
                )}
            </AnimatePresence>

            {/* Removed manual message AnimatePresence */}

            {/* Profile Section */}
            <div style={sectionStyle}>
                <div className="flex items-center gap-2 mb-6 text-indigo-500">
                    <User size={20} />
                    <h2 className="text-lg font-bold" style={{ color: "var(--fg-primary)" }}>Profile Details</h2>
                </div>
                <form onSubmit={handleUpdateProfile}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label style={labelStyle}>Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Your name"
                                style={inputStyle}
                            />
                        </div>
                    </div>
                    <button type="submit" disabled={loadingProfile} style={buttonStyle}>
                        {loadingProfile ? <ButtonSpinner /> : "Save Changes"}
                    </button>
                </form>
            </div>

            {/* Email Section */}
            <div style={sectionStyle}>
                <div className="flex items-center gap-2 mb-6 text-blue-500">
                    <Mail size={20} />
                    <h2 className="text-lg font-bold" style={{ color: "var(--fg-primary)" }}>Email Address</h2>
                </div>
                <p className="text-sm mb-4" style={{ color: "var(--fg-secondary)" }}>Current email: <span className="font-semibold" style={{ color: "var(--fg-primary)" }}>{user.email}</span></p>
                <form onSubmit={handleUpdateEmail}>
                    <div className="max-w-md">
                        <label style={labelStyle}>New Email Address</label>
                        <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="new@example.com"
                            style={inputStyle}
                        />
                    </div>
                    <button type="submit" disabled={loadingEmail} style={buttonStyle}>
                        {loadingEmail ? <ButtonSpinner /> : "Update Email"}
                    </button>
                </form>
            </div>

            {/* Security Section */}
            <div style={sectionStyle}>
                <div className="flex items-center gap-2 mb-6 text-amber-500">
                    <Key size={20} />
                    <h2 className="text-lg font-bold" style={{ color: "var(--fg-primary)" }}>
                        {isGoogleUser && !hasPassword ? "Set Up Password" : "Password & Security"}
                    </h2>
                </div>
                <form onSubmit={handleUpdatePassword}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label style={labelStyle}>{isGoogleUser && !hasPassword ? "New Password" : "Change Password"}</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                style={inputStyle}
                            />
                        </div>
                    </div>
                    <button type="submit" disabled={loadingPassword} style={buttonStyle}>
                        {loadingPassword ? <ButtonSpinner /> : (isGoogleUser && !hasPassword ? "Set Password" : "Update Password")}
                    </button>
                </form>
            </div>

            {/* Danger Zone */}
            <div style={{ ...sectionStyle, borderColor: "rgba(239, 68, 68, 0.2)", backgroundColor: "rgba(239, 68, 68, 0.02)" }}>
                <div className="flex items-center gap-2 mb-6 text-red-500">
                    <Trash2 size={20} />
                    <h2 className="text-lg font-bold">Danger Zone</h2>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-sm" style={{ color: "var(--fg-primary)" }}>Delete Account</h3>
                        <p className="text-xs" style={{ color: "var(--fg-secondary)" }}>Permanently remove your account and all associated data.</p>
                    </div>
                    <button
                        onClick={() => setModal({ open: true, type: "delete" })}
                        disabled={loadingDelete}
                        style={{ ...buttonStyle, backgroundColor: "#ef4444", color: "white", marginTop: 0 }}
                    >
                        {loadingDelete ? <ButtonSpinner /> : "Delete Account"}
                    </button>
                </div>
            </div>
        </div>
    );
}
