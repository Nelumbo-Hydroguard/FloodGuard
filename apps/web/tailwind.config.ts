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
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
