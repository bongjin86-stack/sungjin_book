import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F5F4F0",
        surface: "#FFFFFF",
        "sidebar-bg": "#F9F8F5",
        border: "#E5E3DC",
        "border-hover": "#C8C4BA",
        "text-primary": "#18181B",
        "text-secondary": "#6B6860",
        "text-muted": "#A8A49C",
        accent: "#1C4ED8",
        "accent-light": "#EFF4FF",
        "accent-hover": "#1741B6",
        purple: "#7C3AED",
        "purple-light": "#F3EEFF",
        green: "#16A34A",
        "green-light": "#F0FDF4",
      },
      borderRadius: {
        DEFAULT: "10px",
      },
      fontFamily: {
        sans: [
          "Apple SD Gothic Neo",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        serif: ["var(--font-noto-serif-kr)", "Georgia", "serif"],
      },
      spacing: {
        "sidebar-w": "260px",
        "header-h": "54px",
      },
    },
  },
  plugins: [],
};
export default config;
