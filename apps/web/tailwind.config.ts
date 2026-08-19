import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Identidade FloodGuard — centro de operações GovTech: navy/petróleo
        // de fundo, teal para dado hidrológico, 4 cores fixas de risco
        // (mesmos 4 níveis do motor: seguro/atencao/alerta/critico).
        // Definidas como tokens em vez de slate-950/emerald-400 espalhados
        // pelo código — um único lugar pra mudar a paleta.
        navy: {
          950: "#040b14",
          900: "#081726",
          800: "#0d2038",
          700: "#15304d",
          600: "#1e4166",
        },
        accent: {
          DEFAULT: "#22d3ee",
          muted: "#0e7490",
        },
        risk: {
          safe: "#22c55e",
          attention: "#eab308",
          alert: "#f97316",
          critical: "#ef4444",
        },
      },
      fontFamily: {
        // Space Grotesk (display) dá caráter técnico aos títulos sem cair no
        // sans genérico; IBM Plex Sans/Mono é a superfamília institucional de
        // engenharia da IBM — registro certo pra GovTech e, por serem da mesma
        // família, número (mono) e rótulo (sans) alinham verticalmente.
        display: ['"Space Grotesk"', "system-ui", "sans-serif"],
        sans: ['"IBM Plex Sans"', "system-ui", "-apple-system", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        // Elevação em duas camadas: sombra projetada pra descolar do fundo +
        // linha interna clara no topo, que simula a luz batendo na borda
        // superior do painel. Sem a segunda o card fica chapado.
        panel: "0 18px 40px -24px rgba(0,0,0,0.95), inset 0 1px 0 0 rgba(255,255,255,0.05)",
        "panel-lg": "0 28px 60px -28px rgba(0,0,0,1), inset 0 1px 0 0 rgba(255,255,255,0.07)",
        "panel-hover": "0 26px 54px -26px rgba(0,0,0,1), inset 0 1px 0 0 rgba(255,255,255,0.09)",
      },
      keyframes: {
        "rise-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "rise-in": "rise-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
        breathe: "breathe 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
