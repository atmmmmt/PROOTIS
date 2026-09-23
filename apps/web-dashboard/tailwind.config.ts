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
          "violet-deep": "#4d00c7",
          "violet-soft": "#f1ebff",
          black: "#070707",
          ink: "#111111",
          paper: "#ffffff",
          canvas: "#f5f4f8",
          muted: "#f7f6f9",
          "muted-strong": "#eeecf3",
          line: "#e8e5ee",
          "line-strong": "#d7d2e1",
          "text-muted": "#6f6a79",
          "text-subtle": "#9c96a8"
        }
      },
      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "1rem" }],
        display: ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.025em" }],
        "display-lg": ["2.75rem", { lineHeight: "1.12", letterSpacing: "-0.035em" }]
      },
      borderRadius: {
        "2xl": "1.125rem",
        "3xl": "1.5rem"
      },
      boxShadow: {
        executive: "0 26px 90px rgba(20, 10, 35, 0.10)",
        card: "0 8px 30px rgba(18, 10, 32, 0.055), 0 1px 2px rgba(18,10,32,0.04)",
        "card-hover": "0 18px 50px rgba(18,10,32,0.11), 0 2px 8px rgba(99,0,255,0.05)",
        "violet-glow": "0 0 0 3px rgba(99,0,255,0.12), 0 8px 24px rgba(99,0,255,0.10)",
        premium: "0 30px 80px rgba(11,6,20,0.14), inset 0 1px 0 rgba(255,255,255,0.7)"
      },
      backgroundImage: {
        "hero-gradient": "radial-gradient(circle at 80% 15%, rgba(99,0,255,0.44), transparent 32%), radial-gradient(circle at 15% 85%, rgba(124,31,255,0.20), transparent 30%), linear-gradient(135deg, #08070a 0%, #130d1f 52%, #070707 100%)",
        "violet-gradient": "linear-gradient(135deg, #6300ff 0%, #7c1fff 55%, #9f62ff 100%)"
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.35s ease-out",
        "soft-pulse": "softPulse 3s ease-in-out infinite"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        softPulse: {
          "0%, 100%": { opacity: "0.7" },
          "50%": { opacity: "1" }
        }
      }
    }
  },
  plugins: []
} satisfies Config;
