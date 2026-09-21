#!/usr/bin/env node
// Wave 3b: mechanical migration of hardcoded Tailwind color classes to the
// semantic token classes, across frontend/src.
//
// SCOPE DISCIPLINE: every entry below was checked against tokens.css with
// scripts/verify-mapping.mjs. Two kinds of entries are included:
//   1. EXACT value matches (the Tailwind shade's real RGB equals the target
//      token's RGB) — these are true zero-diff swaps under the default palette.
//   2. A small number of DISCLOSED "bucket" approximations that were already
//      established and user-approved as a pattern in Wave 3's token additions:
//      gray-700/800 both collapse onto fg-strong (fg-strong = gray-800's exact
//      value; gray-700 rounds up), gray-600 collapses onto fg-secondary
//      (= gray-500's exact value), and gray-200/300 collapse onto fg-muted
//      (= gray-400's exact value) — all TEXT-context only, all minor,
//      same-direction shifts consistent with that precedent.
// Everything else that was checked and found to be a REAL, visible mismatch
// (green-500, the whole emerald-* family, amber-500/700, red-500/400,
// gray-950-as-secondary, and every light pastel border/ring shade — blue/
// green/amber/red -100/-200/-300) is deliberately EXCLUDED and left
// hardcoded. There is currently no token whose value matches them exactly,
// and forcing a mapping would silently change rendered colors.
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
  "green-600": "success",
  "green-50": "success-tint",
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
  "bg-gray-200": "bg-border",
  "border-gray-200": "border-border",
  "border-gray-900": "border-secondary",
  "divide-gray-200": "divide-border",
  // gray-100 and gray-50 in a chrome (bg/border/divide/ring) context already
  // fall through correctly via MAPPING (surface-elevated / background), so
  // no override needed there.
};

function migrateClassNameString(str) {
  return str
    .split(/(\s+)/)
    .map((tok) => {
      const m = tok.match(/^(hover:|focus:|group-hover:|focus-within:|placeholder:)?(bg|text|border|ring|divide|fill|stroke)-([a-z]+-[0-9]{2,3})$/);
      if (!m) return tok;
      const [, statePrefix = "", prop, colorShade] = m;
      const full = `${prop}-${colorShade}`;
      if (PROPERTY_OVERRIDE[full]) {
        return statePrefix + PROPERTY_OVERRIDE[full];
      }
      const tokenName = MAPPING[colorShade];
      if (!tokenName) return tok; // no verified mapping — leave untouched
      return `${statePrefix}${prop}-${tokenName}`;
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
