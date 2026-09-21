/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // rgb(var(--color-x) / <alpha-value>) deseni: Tailwind opacity-modifier
        // sözdizimini (örn. bg-surface/95) destekler — düz var() bunu desteklemez.
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        "primary-hover": "rgb(var(--color-primary-hover) / <alpha-value>)",
        "primary-active": "rgb(var(--color-primary-active) / <alpha-value>)",
        secondary: "rgb(var(--color-secondary) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        background: "rgb(var(--color-background) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-elevated": "rgb(var(--color-surface-elevated) / <alpha-value>)",
        fg: "rgb(var(--color-fg) / <alpha-value>)",
        "fg-secondary": "rgb(var(--color-fg-secondary) / <alpha-value>)",
        "fg-muted": "rgb(var(--color-fg-muted) / <alpha-value>)",
        "fg-strong": "rgb(var(--color-fg-strong) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        error: "rgb(var(--color-error) / <alpha-value>)",
        info: "rgb(var(--color-info) / <alpha-value>)",
        cta: "rgb(var(--color-cta) / <alpha-value>)",
        focus: "rgb(var(--color-focus) / <alpha-value>)",
        "primary-tint": "rgb(var(--color-primary-tint) / <alpha-value>)",
        "success-tint": "rgb(var(--color-success-tint) / <alpha-value>)",
        "warning-tint": "rgb(var(--color-warning-tint) / <alpha-value>)",
        "error-tint": "rgb(var(--color-error-tint) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};
