"use client";

import React from "react";
import { motion } from "framer-motion";
import { Trash2, LogOut, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ConfirmationModal({ modal, setModal, deleteConfirmText, setDeleteConfirmText, handleDeleteAccount, signOut, loadingDelete }) {
    const router = useRouter();
    const isDelete = modal.type === "delete";

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-6 backdrop-blur-md bg-black/40"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="w-full max-w-md rounded-3xl p-8 shadow-2xl relative overflow-hidden"
                style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border)" }}
            >
                <button
                    onClick={() => setModal({ open: false, type: "" })}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                    <X size={20} style={{ color: "var(--fg-secondary)" }} />
                </button>

                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${isDelete ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {isDelete ? <Trash2 size={28} /> : <LogOut size={28} />}
                </div>

                <h3 className="text-xl font-bold mb-2" style={{ color: "var(--fg-primary)" }}>
                    {isDelete ? "Delete Account" : "Sign Out"}
                </h3>
                <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--fg-secondary)" }}>
                    {isDelete
                        ? "This action is permanent and cannot be undone. All your data, chats, and settings will be permanently removed."
                        : "Are you sure you want to sign out of your account?"}
                </p>

                {isDelete && (
                    <div className="mb-6">
                        <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: "var(--fg-secondary)" }}>
                            Type <span className="text-red-500" style={{ userSelect: 'none' }}>delete my account</span> to confirm
                        </label>
                        <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="delete my account"
                            className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                            style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--fg-primary)" }}
                            autoFocus
                        />
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <button
                        onClick={isDelete ? handleDeleteAccount : async () => {
                            await signOut();
                            router.push("/");
                        }}
                        disabled={isDelete && deleteConfirmText !== "delete my account"}
                        className={`w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] ${isDelete
                            ? "bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            : "bg-foreground text-background hover:opacity-90"
                            }`}
                    >
                        {isDelete ? (loadingDelete ? "Deleting..." : "Confirm Deletion") : "Sign Out"}
                    </button>
                    <button
                        onClick={() => setModal({ open: false, type: "" })}
                        className="w-full py-4 rounded-2xl font-bold text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ color: "var(--fg-secondary)" }}
                    >
                        Cancel
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
