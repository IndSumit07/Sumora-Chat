"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function ButtonSpinner() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
        >
            <Loader2 className="animate-spin" size={16} />
            <span>Processing...</span>
        </motion.div>
    );
}
