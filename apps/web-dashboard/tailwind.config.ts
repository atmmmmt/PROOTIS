import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        readex: ["Readex Pro", "Arial", "sans-serif"]
      },
      colors: {
        prootech: {
          violet: "#6300ff",
          "violet-light": "#7c1fff",
          "violet-soft": "#f0e8ff",
          black: "#070707",
          ink: "#111111",
          paper: "#ffffff",
          muted: "#f7f7f9",
          "muted-strong": "#f0eff4",
          line: "#e7e5eb",
          "line-strong": "#d4d2db",
          "text-muted": "#71717a",
          "text-subtle": "#a1a1aa"
        }
      },
      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "1rem" }],
        display: ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        "display-lg": ["2.75rem", { lineHeight: "1.15", letterSpacing: "-0.025em" }]
      },
      boxShadow: {
        executive: "0 20px 80px rgba(7, 7, 7, 0.08)",
        card: "0 1px 3px rgba(7,7,7,0.06), 0 1px 2px rgba(7,7,7,0.04)",
        "card-hover": "0 4px 12px rgba(7,7,7,0.10), 0 1px 3px rgba(7,7,7,0.06)",
        "violet-glow": "0 0 0 3px rgba(99,0,255,0.12)"
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #070707 0%, #1a0033 100%)",
        "violet-gradient": "linear-gradient(135deg, #6300ff 0%, #9040ff 100%)"
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.35s ease-out"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      }
    }
  },
  plugins: []
} satisfies Config;
