import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { CryptoProvider } from "@/providers/CryptoProvider";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata = {
  title: "Sumora Chat — Modern Messaging",
  description:
    "A fast, minimal, and beautiful chat application inspired by WhatsApp.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        {/*
         * Blocking script — runs BEFORE React hydrates.
         * Reads localStorage and sets data-theme immediately,
         * preventing any flash of incorrect theme (FOUC).
         */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('sumora-theme') || 'light';
                document.documentElement.setAttribute('data-theme', t);
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${plusJakartaSans.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <CryptoProvider>
              {children}
              <Toaster
                position="bottom-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "var(--bg-surface)",
                    color: "var(--fg-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: "16px",
                    fontSize: "14px",
                    fontWeight: "500",
                    padding: "12px 20px",
                    boxShadow: "var(--shadow-lg)",
                  },
                  success: {
                    iconTheme: {
                      primary: "#10b981",
                      secondary: "#fff",
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: "#ef4444",
                      secondary: "#fff",
                    },
                  },
                }}
              />
            </CryptoProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
