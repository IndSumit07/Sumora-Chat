"use client";

import { createContext, useContext, useLayoutEffect, useState } from "react";

const ThemeCtx = createContext({ theme: "light", toggle: () => { } });

export function ThemeProvider({ children }) {
    // Initialise from the data-theme the blocking <script> already applied
    const [theme, setTheme] = useState("light");

    useLayoutEffect(() => {
        const current =
            document.documentElement.getAttribute("data-theme") || "light";
        setTheme(current);
    }, []);

    const toggle = () => {
        const next = theme === "light" ? "dark" : "light";
        setTheme(next);
        document.documentElement.setAttribute("data-theme", next);
        try {
            localStorage.setItem("sumora-theme", next);
        } catch { }
    };

    return (
        <ThemeCtx.Provider value={{ theme, toggle }}>
            {children}
        </ThemeCtx.Provider>
    );
}

export const useTheme = () => useContext(ThemeCtx);
