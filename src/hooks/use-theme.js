import { useContext } from "react";
import { ThemeCtx } from "@/providers/ThemeProvider";

export const useTheme = () => useContext(ThemeCtx);
