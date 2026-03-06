"use client";

import React from "react";
import { Clock, Check, CheckCheck } from "lucide-react";

/**
 * Renders WhatsApp-style message delivery ticks.
 * Only call this component for YOUR OWN messages (sender_id === myId).
 *
 * Props:
 *   status: 'sending' | 'sent' | 'delivered' | 'read'
 */
export default function MessageTick({ status }) {
    if (status === "sending") {
        return (
            <span className="inline-flex items-center text-gray-400" title="Sending…">
                <Clock size={12} strokeWidth={2} />
            </span>
        );
    }

    if (status === "sent") {
        return (
            <span className="inline-flex items-center text-gray-400" title="Sent">
                <Check size={13} strokeWidth={2.5} />
            </span>
        );
    }

    if (status === "delivered") {
        return (
            <span className="inline-flex items-center text-gray-400" title="Delivered">
                <CheckCheck size={14} strokeWidth={2.5} />
            </span>
        );
    }

    if (status === "read") {
        return (
            <span
                className="inline-flex items-center text-black font-bold"
                title="Read"
            >
                <CheckCheck size={14} strokeWidth={3} />
            </span>
        );
    }

    return null;
}
