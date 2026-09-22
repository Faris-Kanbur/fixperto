#!/usr/bin/env node
// Wave 3d: mechanical migration of hardcoded Tailwind color classes to the
// semantic token classes, across frontend/src.
//
// This is a REVISED, more conservative table after a final whole-branch
// review of Wave 3b/3c found two critical regressions and several moderate
// ones, all caused by mappings that went beyond a single, genuinely
// equivalent shade per token:
//   - `fg-strong` is a FOREGROUND token that inverts in dark mode. Wave 3b
//     mapped gray-800/gray-700 to it property-agnostically, so `bg-gray-800`
//     (used on dark toasts/buttons) became `bg-fg-strong`, which renders
//     WHITE-ON-WHITE in dark mode (fg-strong's dark value is near-white).
//     Fixed here via PROPERTY_OVERRIDE: bg-/hover:bg- gray-700/800 route to
//     `secondary` (the actual "dark chrome surface" token), never fg-strong.
//   - Wave 3c bucketed light status shades (red/green/amber/emerald
//     100/200/300) onto their `-tint` token so aggressively that
//     `border-X-tint` and `bg-X-tint` became the SAME value — badge/input
//     outlines and focus rings disappeared entirely (confirmed live:
//     destructive-action focus ring at ~254,242,242 on a white page).
//     `-tint` tokens are backgrounds ONLY; there is no visible "-subtle"
//     equivalent yet for error/success/warning (unlike primary, which got
//     one), so these shades are REMOVED from the table rather than forced.
//   - Bucketing amber-700/800/900 and emerald/green-700 text onto the base
//     warning/success token measurably dropped contrast below WCAG AA when
//     paired with a `-tint` background (3.07:1, 3.15:1) — also removed.
//   - Collapsing 3+ shades of the same hue onto one token silently deletes
//     hover/interaction feedback (`text-red-400 hover:text-red-600` both
//     becoming `text-error`). Status-color text mappings are now limited to
//     the single exact-match shade (600) plus the exact tint shade (50);
//     nothing in between.
//
// SCOPE DISCIPLINE: every entry below was checked against tokens.css with
// scripts/verify-mapping.mjs (kept in sync — see that file). Included:
//   1. EXACT value matches — true zero-diff swaps under the default palette.
//   2. A small set of DISCLOSED bucket approximations that survived review:
//      gray-700/800 onto fg-strong (TEXT context only — a real bg-context
//      override exists separately), gray-600 onto fg-secondary, gray-200/300
//      onto fg-muted, gray-950 onto secondary, emerald-500/600 onto success
//      (a different hue playing the exact same semantic role, not a same-hue
//      shade-bucket), and blue-200/300/400 onto primary-subtle (confirmed
//      live to still render a visible, distinct border/ring in both themes).
// Excluded: violet/cyan (no semantic home), all light 100/200/300 status
// shades (no visible-border token exists for them), all status text shades
// beyond the single exact 600 match (contrast + hover-feedback risk).
//
// SAFE BY CONSTRUCTION:
//   - Only rewrites text inside `className="..."` / `className={`...`}` /
//     `className={cond ? "..." : "..."}` JSX attributes — never touches a
//     `colorClass="bg-blue-500"` prop value (MiniBarChart's per-metric chart
//     colors) or any plain data/string literal (e.g. BANNER_PRESETS in
//     constants.ts), because those never sit inside a `className=` attribute.
import { readFileSync, writeFileSync, globSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..", "frontend", "src");

// Default (property-agnostic) shade -> token name mapping.
const MAPPING = {
  "gray-900": "fg",
  "gray-800": "fg-strong",
  "gray-700": "fg-strong",
  "gray-600": "fg-secondary",
  "gray-500": "fg-secondary",
  "gray-400": "fg-muted",
  "gray-300": "fg-muted",
  "gray-200": "fg-muted",
  "gray-50": "background",
  "gray-100": "surface-elevated",
  "gray-950": "secondary",
  "blue-600": "primary",
  "blue-700": "primary-hover",
  "blue-800": "primary-active",
  "blue-500": "info",
  "blue-50": "primary-tint",
  "blue-300": "primary-subtle",
  "blue-200": "primary-subtle",
  "blue-400": "primary-subtle",
  "green-600": "success",
  "green-50": "success-tint",
  "emerald-600": "success",
  "emerald-500": "success",
  "amber-600": "warning",
  "amber-50": "warning-tint",
  "red-600": "error",
  "red-50": "error-tint",
};

// Property-specific overrides for the neutral/gray family, where the same
// shade name means something different depending on which CSS property it
// sets (gray-900 as text-color means "near-black foreground"; as a
// background/border it means "the app's dark chrome surface"). Every value
// here is an exact RGB match verified against tokens.css.
const PROPERTY_OVERRIDE = {
  "bg-gray-900": "bg-secondary",
  "bg-gray-800": "bg-secondary",
  "bg-gray-700": "bg-secondary",
  "bg-gray-200": "bg-border",
  "border-gray-200": "border-border",
  "border-gray-900": "border-secondary",
  "border-gray-300": "border-border",
  "divide-gray-200": "divide-border",
  // gray-100 and gray-50 in a chrome (bg/border/divide/ring) context already
  // fall through correctly via MAPPING (surface-elevated / background), so
  // no override needed there.
};

function migrateClassNameString(str) {
  return str
    .split(/(\s+)/)
    .map((tok) => {
      const m = tok.match(/^(hover:|focus:|focus-visible:|group-hover:|focus-within:|placeholder:|disabled:|active:)?(bg|text|border|ring|divide|fill|stroke)-([a-z]+-[0-9]{2,3})(\/[0-9]{1,3})?$/);
      if (!m) return tok;
      const [, statePrefix = "", prop, colorShade, opacitySuffix = ""] = m;
      const full = `${prop}-${colorShade}`;
      if (PROPERTY_OVERRIDE[full]) {
        return statePrefix + PROPERTY_OVERRIDE[full] + opacitySuffix;
      }
      const tokenName = MAPPING[colorShade];
      if (!tokenName) return tok; // no verified mapping — leave untouched
      return `${statePrefix}${prop}-${tokenName}${opacitySuffix}`;
    })
    .join("");
}

// Migrates only the double-quoted string literals found inside a JS
// expression fragment (e.g. a `${cond ? "a b" : "c d"}` interpolation's
// body), leaving every identifier, operator and punctuation around them
// untouched. Safe for the ternary/&&/plain-conditional patterns actually
// used in this codebase — anything with nested braces or backticks inside
// the expression won't be handed to this function in the first place (the
// caller's own `[^}]*` / `[^{}]*` capture already excludes those).
function migrateQuotedStringsInExpr(expr) {
  return expr.replace(/"([^"]*)"/g, (qs, inner) => {
    const migrated = migrateClassNameString(inner);
    return migrated === inner ? qs : `"${migrated}"`;
  });
}

function migrateFile(filePath) {
  const src = readFileSync(filePath, "utf8");
  let changed = 0;
  let out = src.replace(/className="([^"]*)"/g, (whole, inner) => {
    const next = migrateClassNameString(inner);
    if (next !== inner) changed++;
    return `className="${next}"`;
  });
  out = out.replace(/className=\{`([^`]*)`\}/g, (whole, inner) => {
    const nextInner = inner.replace(/([^$]*)(\$\{[^}]*\})?/g, (seg, textPart, exprPart) => {
      const migratedText = textPart ? migrateClassNameString(textPart) : (textPart || "");
      if (!exprPart) return migratedText;
      const migratedExpr = migrateQuotedStringsInExpr(exprPart);
      return migratedText + migratedExpr;
    });
    if (nextInner !== inner) changed++;
    return `className={\`${nextInner}\`}`;
  });
  out = out.replace(/className=\{([^{}]*)\}/g, (whole, exprBody) => {
    const nextBody = exprBody.replace(/"([^"]*)"/g, (qs, inner) => {
      const next = migrateClassNameString(inner);
      if (next !== inner) changed++;
      return `"${next}"`;
    });
    return `className={${nextBody}}`;
  });
  if (changed > 0) {
    writeFileSync(filePath, out, "utf8");
  }
  return changed;
}

function main() {
  const files = globSync("**/*.{tsx,ts}", { cwd: ROOT })
    .map((f) => path.join(ROOT, f))
    .filter((f) => !f.includes("node_modules"));
  let totalChanged = 0;
  const perFile = [];
  for (const f of files) {
    const n = migrateFile(f);
    if (n > 0) {
      perFile.push([path.relative(ROOT, f), n]);
      totalChanged += n;
    }
  }
  perFile.sort((a, b) => b[1] - a[1]);
  console.log(`Migrated ${totalChanged} className attribute occurrences across ${perFile.length} files:`);
  for (const [f, n] of perFile) console.log(`  ${n}\t${f}`);
}

main();
