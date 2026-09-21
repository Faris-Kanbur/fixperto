// One-off verifier: for every entry in the migration mapping, compute whether
// the Tailwind shade's real RGB equals the target token's RGB in tokens.css.
// Anything not EXACT gets flagged so it can be reviewed by hand rather than
// trusted on eyeballed arithmetic.
import { readFileSync } from "node:fs";

const TAILWIND_HEX = {
  "gray-50": "#f9fafb", "gray-100": "#f3f4f6", "gray-200": "#e5e7eb", "gray-300": "#d1d5db",
  "gray-400": "#9ca3af", "gray-500": "#6b7280", "gray-600": "#4b5563", "gray-700": "#374151",
  "gray-800": "#1f2937", "gray-900": "#111827", "gray-950": "#030712",
  "blue-50": "#eff6ff", "blue-100": "#dbeafe", "blue-200": "#bfdbfe", "blue-300": "#93c5fd",
  "blue-500": "#3b82f6", "blue-600": "#2563eb", "blue-700": "#1d4ed8", "blue-800": "#1e40af",
  "green-50": "#f0fdf4", "green-100": "#dcfce7", "green-500": "#22c55e", "green-600": "#16a34a",
  "emerald-50": "#ecfdf5", "emerald-500": "#10b981", "emerald-600": "#059669", "emerald-700": "#047857",
  "amber-50": "#fffbeb", "amber-100": "#fef3c7", "amber-500": "#f59e0b", "amber-600": "#d97706", "amber-700": "#b45309",
  "red-50": "#fef2f2", "red-100": "#fee2e2", "red-400": "#f87171", "red-500": "#ef4444", "red-600": "#dc2626",
};

function hexToTriplet(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

const css = readFileSync(new URL("../frontend/src/styles/tokens.css", import.meta.url), "utf8");
const rootBlock = css.match(/:root\s*\{([^}]*)\}/s)[1];
const tokenValues = {};
for (const m of rootBlock.matchAll(/--color-([a-z-]+):\s*([0-9 ]+);/g)) {
  tokenValues[m[1]] = m[2].trim();
}

const CANDIDATES = [
  ["gray-900", "fg"], ["gray-800", "fg-strong"], ["gray-700", "fg-strong"],
  ["gray-600", "fg-secondary"], ["gray-500", "fg-secondary"],
  ["gray-400", "fg-muted"], ["gray-300", "fg-muted"], ["gray-200", "fg-muted"],
  ["gray-50", "background"], ["gray-100", "surface-elevated"], ["gray-950", "secondary"],
  ["gray-900", "secondary"], ["gray-200", "border"], ["gray-400", "border"],
  ["blue-600", "primary"], ["blue-700", "primary-hover"], ["blue-800", "primary-active"],
  ["blue-500", "info"], ["blue-50", "primary-tint"],
  ["green-600", "success"], ["green-500", "success"], ["green-50", "success-tint"], ["green-100", "success-tint"],
  ["emerald-600", "success"], ["emerald-700", "success"], ["emerald-500", "success"], ["emerald-50", "success-tint"],
  ["amber-600", "warning"], ["amber-700", "warning"], ["amber-500", "warning"], ["amber-50", "warning-tint"], ["amber-100", "warning-tint"],
  ["red-600", "error"], ["red-500", "error"], ["red-400", "error"], ["red-50", "error-tint"], ["red-100", "error-tint"],
];

for (const [shade, token] of CANDIDATES) {
  const want = hexToTriplet(TAILWIND_HEX[shade]);
  const have = tokenValues[token];
  const exact = want === have;
  console.log(`${exact ? "OK   " : "DIFF "} ${shade.padEnd(12)} -> ${token.padEnd(16)} tailwind=${want.padEnd(13)} token=${have}`);
}
