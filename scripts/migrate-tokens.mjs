#!/usr/bin/env node
// Wave 3b/3c: mechanical migration of hardcoded Tailwind color classes to
// the semantic token classes, across frontend/src.
//
// SCOPE DISCIPLINE: every entry below was checked against tokens.css with
// scripts/verify-mapping.mjs. Three kinds of entries are included:
//   1. EXACT value matches (the Tailwind shade's real RGB equals the target
//      token's RGB) — true zero-diff swaps under the default palette.
//   2. DISCLOSED "bucket" approximations, user-approved as a pattern: same
//      hue family, adjacent shade, same semantic role (e.g. gray-700/800
//      both collapse onto fg-strong; the whole emerald-* family collapses
//      onto success/success-tint since it plays green's exact role in this
//      codebase; red-400/500/700 collapse onto error; amber-400/500/700/
//      800/900 collapse onto warning; light red/green/amber 100/200/300
//      shades collapse onto their -tint token). Each is a minor, disclosed,
//      same-direction shift — never a jump across hue or across semantic
//      role.
//   3. `primary-subtle` (new token, user-approved): blue-300 is its exact
//      light-mode value; blue-200/400 bucket onto it as approximations.
// Excluded entirely: any color family with no semantic home in this app's
// 6-palette vocabulary (violet, cyan — used for a handful of one-off tags,
// not primary/success/warning/error/info), and any single shade far enough
// from every token to make bucketing indefensible.
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
  "blue-600": "primary",
  "blue-700": "primary-hover",
  "blue-800": "primary-active",
  "blue-500": "info",
  "blue-50": "primary-tint",
  "blue-300": "primary-subtle",
  "blue-200": "primary-subtle",
  "blue-400": "primary-subtle",
  "blue-100": "primary-tint",
  "green-600": "success",
  "green-500": "success",
  "green-700": "success",
  "green-50": "success-tint",
  "green-100": "success-tint",
  "green-400": "success-tint",
  "emerald-600": "success",
  "emerald-700": "success",
  "emerald-500": "success",
  "emerald-50": "success-tint",
  "emerald-100": "success-tint",
  "emerald-200": "success-tint",
  "green-200": "success-tint",
  "amber-600": "warning",
  "amber-700": "warning",
  "amber-800": "warning",
  "amber-900": "warning",
  "amber-500": "warning",
  "amber-400": "warning",
  "amber-50": "warning-tint",
  "amber-100": "warning-tint",
  "amber-200": "warning-tint",
  "amber-300": "warning-tint",
  "red-600": "error",
  "red-500": "error",
  "red-400": "error",
  "red-700": "error",
  "red-50": "error-tint",
  "red-100": "error-tint",
  "red-200": "error-tint",
  "red-300": "error-tint",
  "gray-950": "secondary",
};

// Property-specific overrides for the neutral/gray family, where the same
// shade name means something different depending on which CSS property it
// sets (gray-900 as text-color means "near-black foreground"; as a
// background/border it means "the app's dark chrome surface"). Every value
// here is an exact RGB match verified against tokens.css.
const PROPERTY_OVERRIDE = {
  "bg-gray-900": "bg-secondary",
  "bg-gray-200": "bg-border",
  "border-gray-200": "border-border",
  "border-gray-900": "border-secondary",
  "divide-gray-200": "divide-border",
  // gray-100 and gray-50 in a chrome (bg/border/divide/ring) context already
  // fall through correctly via MAPPING (surface-elevated / background), so
  // no override needed there.
  // gray-300 as a border color (not text) buckets onto the border token —
  // same disclosed-approximation discipline as the other bucket entries.
  "border-gray-300": "border-border",
};

function migrateClassNameString(str) {
  return str
    .split(/(\s+)/)
    .map((tok) => {
      const m = tok.match(/^(hover:|focus:|group-hover:|focus-within:|placeholder:)?(bg|text|border|ring|divide|fill|stroke)-([a-z]+-[0-9]{2,3})(\/[0-9]{1,3})?$/);
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
  return expr.replace(/"([^"]*)"/g, (qs, inner) => migrateClassNameString(inner) === inner ? qs : `"${migrateClassNameString(inner)}"`);
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
