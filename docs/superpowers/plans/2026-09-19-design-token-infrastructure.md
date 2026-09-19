# Design Token Infrastructure (Wave 1 of Fixperto Redesign) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a semantic CSS-custom-property design-token system (primary, secondary, accent, background, surface, surface-elevated, text-primary, text-secondary, text-muted, border, success, warning, error, info, cta, focus, plus primary-hover/primary-active) wired into Tailwind, with **zero visible change** to the running app — proving the plumbing works before any palette-switching feature is built on top of it in Wave 2.

**Architecture:** New `frontend/src/styles/tokens.css` defines `:root` (light) and `.dark-scope` (dark) values as plain hex CSS custom properties. `tailwind.config.js` maps semantic color names (`bg-primary`, `text-text-secondary`, etc.) to `var(--color-*)`. The existing `.dark-scope` override block in `AppShell.tsx` (currently ~40 hardcoded `!important` hex rules) has its semantically-mappable rules repointed at the same variables, so light and dark share one source of truth. Rules with no clean 1:1 semantic mapping (tint/badge shades, gradient-suppression rules, the input-specific background) are deliberately left untouched — out of scope for this wave, called out explicitly so nobody mistakes the omission for an oversight.

**Tech Stack:** Tailwind CSS 3.4 (`theme.extend.colors`), plain CSS custom properties (no RGB-triplet/opacity-modifier pattern — see Task 1 rationale), existing Node-native test runner (`tests/*.test.mjs` + `tests/run.mjs`), Playwright MCP for before/after visual verification.

**Spec:** User's original brief (Turkish) requesting a full professional automotive design-system redesign with 6+ color palettes and an admin palette picker. This plan implements only the foundational token infrastructure (their Phase 3–4, scoped down); palettes + admin picker are a separate follow-up plan (Wave 2) once this lands clean.

## Global Constraints

- Do not touch: `backend/utils/auth.js`, `backend/utils/rateLimiter.js`, `backend/utils/clientIp.js`, `backend/hydrate.js` (or equivalent hydrate module), `frontend/src/data/i18n.ts` content (structure only, no copy changes), `frontend/src/data/handbook.ts`, any DB schema/column — per `REFACTOR_REPORT.md` / `PERFORMANS-RAPORU.md` explicit "don't touch" list.
- Every task must end with `node tests/run.mjs` (repo root) reporting **0 failures** before moving to the next task. This is the canonical full-suite command (tsc + backend syntax + 37 static rule suites + 10 e2e suites + endpoint inventory) and currently passes at 2776 tests; `frontend && npm test` (12 tests) must also stay green.
- No new dependency installs. No changes to `frontend/vite.config.js`, `postcss.config.js`, or any backend file.
- This wave must produce **zero visible pixel difference** in the running app, light or dark mode. Every task that changes a rendered value must be immediately verified against the original with a Playwright screenshot, not just a passing test.
- Work happens in the isolated worktree at `/Users/fariskanbur/fixperto/.claude/worktrees/design-system-redesign` (branch `worktree-design-system-redesign`), already set up with `npm install` done in both `frontend/` and `backend/`, baseline verified at 2776+12 tests passing.

---

## File Structure

- **Create:** `frontend/src/styles/tokens.css` — the token definitions (`:root` + `.dark-scope`).
- **Modify:** `frontend/src/index.css` — add one `@import` line for the new tokens file.
- **Modify:** `frontend/tailwind.config.js` — add `theme.extend.colors` mapping 18 semantic names to `var(--color-*)`.
- **Modify:** `frontend/src/app/AppShell.tsx` — repoint 11 dark-mode override lines (~300-370 region) at token variables instead of hardcoded hex; fix one focus-ring gap at the chat-screen language `<select>` (~line 2942).
- **Create:** `tests/design-tokens.test.mjs` — new static-analysis test (same style as the other `tests/*.test.mjs` files) asserting the token file defines all 18 variables in both scopes, that `tailwind.config.js` maps all 18, and that the literal hex values match the documented golden table below (catches any future accidental value drift).

## Token Value Table (reference for every task below — do not deviate)

All values traced to either an existing Tailwind utility already used for that purpose in the app, or the exact hex already hardcoded in `AppShell.tsx`'s dark-mode block. Where the app currently has **no** dark-mode override for a class, the token's dark value is identical to its light value (that IS today's actual behavior — unstyled in dark mode).

| Token | Light hex | Dark hex | Source |
|---|---|---|---|
| `--color-primary` | `#2563eb` | `#2563eb` | Tailwind `blue-600`; no existing dark override on `.bg-blue-600`/`.text-blue-600` |
| `--color-primary-hover` | `#1d4ed8` | `#1d4ed8` | Tailwind `blue-700`, used in every `hover:bg-blue-700` |
| `--color-primary-active` | `#1e40af` | `#1e40af` | Tailwind `blue-800` — new token, not yet consumed anywhere (documented as unused-for-now) |
| `--color-secondary` | `#111827` | `#0d0d13` | Tailwind `gray-900` (e.g. the dark CTA banner bg); dark value from existing `.dark-scope .bg-gray-950, .bg-gray-900 { ... #0d0d13 }` rule |
| `--color-accent` | `#f59e0b` | `#f59e0b` | Tailwind `amber-500`; no existing override on the solid shade |
| `--color-background` | `#f9fafb` | `#121218` | Tailwind `gray-50` (page canvas); dark value from existing `.bg-gray-50` override |
| `--color-surface` | `#ffffff` | `#17171f` | white (cards/header); dark value from existing `.bg-white` override |
| `--color-surface-elevated` | `#f3f4f6` | `#20202b` | Tailwind `gray-100` (chip/progress-track backgrounds); dark value from existing `.bg-gray-100` override |
| `--color-text-primary` | `#111827` | `#e9e9f0` | Tailwind `gray-900`; dark value from existing `text-gray-900/800/700` bucket |
| `--color-text-secondary` | `#6b7280` | `#a3a3b8` | Tailwind `gray-500`; dark value from existing `text-gray-600/500` bucket |
| `--color-text-muted` | `#9ca3af` | `#71718c` | Tailwind `gray-400`; dark value from existing `text-gray-400/300` bucket |
| `--color-border` | `#e5e7eb` | `#2c2c3a` | Tailwind `gray-200`; dark value from existing `border-gray-100/200/300` bucket |
| `--color-success` | `#16a34a` | `#16a34a` | Tailwind `green-600`; no existing override on the solid shade |
| `--color-warning` | `#d97706` | `#d97706` | Tailwind `amber-600`; no existing override on the solid shade |
| `--color-error` | `#dc2626` | `#dc2626` | Tailwind `red-600`; no existing override on the solid shade |
| `--color-info` | `#3b82f6` | `#3b82f6` | Tailwind `blue-500`; no existing override on the solid shade |
| `--color-cta` | `#2563eb` | `#2563eb` | Aliases `primary` today — kept as a separate token so a future palette can diverge them |
| `--color-focus` | `#bfdbfe` | `#bfdbfe` | Tailwind `blue-200`, the most common existing `focus:ring-blue-200` value in the codebase |

**Explicitly out of scope for this wave** (left as literal hex, not converted): the tint/badge rules (`bg-red-50/100`, `bg-green-50/100`, `bg-amber-50/100`, `bg-blue-50` + their `border-*` pairs, `bg-emerald-50`, `bg-violet-50`, `bg-cyan-50`), the alpha rules (`bg-white/95`, `bg-white/90`, `bg-gray-50/70`, `bg-gray-50/50`), the gradient-suppression rules (`[class*="from-blue-50"]` etc.), the `bg-gray-200` solid-fill rule, and the dark input background (`#14141b`). None of these map 1:1 to the 18 requested semantic tokens; forcing a mapping now would mean inventing tokens the user didn't ask for. Revisit in the Badge/Card component wave.

---

### Task 1: Create the token CSS file

**Files:**
- Create: `frontend/src/styles/tokens.css`
- Test: manual (verified by Task 6's automated test + Task 7's visual check)

**Interfaces:**
- Produces: CSS custom properties `--color-primary`, `--color-primary-hover`, `--color-primary-active`, `--color-secondary`, `--color-accent`, `--color-background`, `--color-surface`, `--color-surface-elevated`, `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-border`, `--color-success`, `--color-warning`, `--color-error`, `--color-info`, `--color-cta`, `--color-focus`, readable from any CSS in the app once imported (Task 2).

- [ ] **Step 1: Write the file**

```css
/* frontend/src/styles/tokens.css
 *
 * Semantic design tokens. Values here are the DEFAULT ("Mevcut Mavi") palette —
 * they intentionally equal the app's current hardcoded colors, light and dark,
 * so introducing this file changes zero pixels. See the token table in
 * docs/superpowers/plans/2026-09-19-design-token-infrastructure.md for the
 * source of every value. Future palettes (Wave 2) will override these same
 * variable names under a data-attribute or class selector — nothing that
 * consumes var(--color-*) needs to change when that lands.
 */
:root {
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-primary-active: #1e40af;
  --color-secondary: #111827;
  --color-accent: #f59e0b;
  --color-background: #f9fafb;
  --color-surface: #ffffff;
  --color-surface-elevated: #f3f4f6;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-text-muted: #9ca3af;
  --color-border: #e5e7eb;
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-error: #dc2626;
  --color-info: #3b82f6;
  --color-cta: #2563eb;
  --color-focus: #bfdbfe;
}

.dark-scope {
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-primary-active: #1e40af;
  --color-secondary: #0d0d13;
  --color-accent: #f59e0b;
  --color-background: #121218;
  --color-surface: #17171f;
  --color-surface-elevated: #20202b;
  --color-text-primary: #e9e9f0;
  --color-text-secondary: #a3a3b8;
  --color-text-muted: #71718c;
  --color-border: #2c2c3a;
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-error: #dc2626;
  --color-info: #3b82f6;
  --color-cta: #2563eb;
  --color-focus: #bfdbfe;
}
```

- [ ] **Step 2: Sanity-check the file has no syntax errors**

Run: `node -e "require('fs').readFileSync('frontend/src/styles/tokens.css','utf8')"` from repo root — just confirms the file exists and is readable; real CSS validation happens when Vite builds it in Task 2.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/styles/tokens.css
git commit -m "feat: add semantic design token CSS variables (zero visual change)"
```

---

### Task 2: Import tokens.css into the build

**Files:**
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: `frontend/src/styles/tokens.css` (Task 1)
- Produces: token variables available globally once Vite processes `index.css` (already the app's single global stylesheet, imported by the entry point).

- [ ] **Step 1: Read the current file to find the right insertion point**

Run: `sed -n '1,10p' frontend/src/index.css` — it starts with `@tailwind base; @tailwind components; @tailwind utilities;` per the earlier audit. Add the import immediately after the `@tailwind base;` line so token custom properties are available before any component/utility layer references them, and so Tailwind's own CSS reset doesn't get a chance to run before the vars exist.

- [ ] **Step 2: Add the import**

Insert this line right after `@tailwind base;`:

```css
@import "./styles/tokens.css";
```

- [ ] **Step 3: Start the dev server and confirm it builds without errors**

Run (from `frontend/`): `npm run dev` in the background (`nohup npm run dev > /tmp/vite_dev.log 2>&1 & disown`), wait 2s, then `cat /tmp/vite_dev.log` — expect the normal Vite ready banner, no CSS import errors. If a server is already running from a prior session, it will hot-reload; check its log instead of starting a second one.

- [ ] **Step 4: Verify in the browser that nothing changed**

Use Playwright: navigate to `http://localhost:5173/`, take a full-page screenshot, and visually confirm it's pixel-identical to the pre-change homepage (colors, spacing, everything) — the tokens exist now but nothing consumes them yet, so this MUST be a no-op.

- [ ] **Step 5: Run the full test suite**

Run: `node tests/run.mjs` from repo root. Expect: unchanged pass count (2776), 0 failures.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat: import design tokens into global stylesheet"
```

---

### Task 3: Wire semantic color names into Tailwind

**Files:**
- Modify: `frontend/tailwind.config.js`

**Interfaces:**
- Consumes: the 18 CSS variables from `tokens.css` (Task 1/2).
- Produces: Tailwind utility classes `bg-primary`, `text-primary`, `border-primary`, `bg-primary-hover`, `bg-primary-active`, `bg-secondary`, `bg-accent`, `bg-background`, `bg-surface`, `bg-surface-elevated`, `text-text-primary`, `text-text-secondary`, `text-text-muted`, `border-border`, `bg-success`/`text-success`, `bg-warning`/`text-warning`, `bg-error`/`text-error`, `bg-info`/`text-info`, `bg-cta`, `ring-focus` — available for any component to use from this point forward (not retrofitted onto existing components in this wave; that's Wave 3+).

- [ ] **Step 1: Write the config change**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        "primary-active": "var(--color-primary-active)",
        secondary: "var(--color-secondary)",
        accent: "var(--color-accent)",
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        "surface-elevated": "var(--color-surface-elevated)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted": "var(--color-text-muted)",
        border: "var(--color-border)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        info: "var(--color-info)",
        cta: "var(--color-cta)",
        focus: "var(--color-focus)",
      },
    },
  },
  plugins: [],
};
```

Note: no RGB-triplet/`<alpha-value>` pattern — plain `var(--color-*)` values. This means `bg-primary/50`-style opacity modifiers won't work on these specific names (Tailwind needs the triplet format for that). Nothing in the current codebase uses opacity modifiers on brand colors today, so this is not a regression; documented as a known trade-off, upgradeable later if a real need appears.

- [ ] **Step 2: Confirm Tailwind picks up the new classes**

Run (from `frontend/`): `npx tailwindcss -i ./src/index.css -o /tmp/tw-check.css --content './index.html' --content './src/**/*.{js,jsx,ts,tsx}' 2>&1 | tail -20 && grep -c '\.bg-primary' /tmp/tw-check.css` — expect a non-zero count (Tailwind only generates a utility class if nothing in `content` currently uses it, so this may legitimately be 0 until Task 5 uses `ring-focus` — if so, instead directly grep the generated CSS for the `--tw-` custom property registration or just confirm `npm run build` succeeds in Step 3, which is the real signal).

- [ ] **Step 3: Full production build succeeds**

Run (from `frontend/`): `npm run build` — expect exit code 0, no Tailwind/PostCSS errors.

- [ ] **Step 4: Run the full test suite**

Run: `node tests/run.mjs` from repo root. Expect: 2776 passing, 0 failures (tsc included in this command will also catch any config typo).

- [ ] **Step 5: Commit**

```bash
git add frontend/tailwind.config.js
git commit -m "feat: map semantic color tokens into Tailwind theme"
```

---

### Task 4: Repoint the existing dark-mode override block at tokens

**Files:**
- Modify: `frontend/src/app/AppShell.tsx` (the `<style>` block starting at `.dark-scope { color-scheme: dark; }`, roughly lines 312-370 — confirm exact lines with `grep -n 'dark-scope { color-scheme' frontend/src/app/AppShell.tsx` before editing, since line numbers shift as the file is edited elsewhere)
- Test: `tests/fairness-and-data.test.mjs` (already asserts on this exact block — see Interfaces)

**Interfaces:**
- Consumes: `var(--color-*)` tokens from Task 1/3.
- Produces: nothing new consumed elsewhere; this task is a pure internal refactor of the dark-mode block. **Must preserve exactly:** the block's start marker string `.dark-scope { color-scheme: dark; }` and end marker `@keyframes micro-pop` (both are used verbatim by `tests/fairness-and-data.test.mjs` to slice out `darkBlock` for its assertions — do not rename or move these markers). Must also preserve the literal selector substrings `bg-white\/95`, `bg-white\/90`, `bg-gray-50\/70`, `text-gray-200`, `bg-emerald-50`, `bg-blue-50`, and `from-blue-50` somewhere in the block (that test greps for these exact substrings) — this task does not touch any of those rules (they're in the explicitly-out-of-scope list), so they remain untouched automatically.

- [ ] **Step 1: Confirm current line numbers**

Run: `grep -n 'dark-scope { color-scheme\|@keyframes micro-pop' frontend/src/app/AppShell.tsx` — note the two line numbers as the edit boundary.

- [ ] **Step 2: Make the following 8 line-level replacements inside that block, and no others**

Using the Edit tool (exact-string replacement, each is independently unique in the file so no ambiguity):

Replacement 1 — surface:
```
OLD: .dark-scope .bg-white { background-color: #17171f !important; }
NEW: .dark-scope .bg-white { background-color: var(--color-surface) !important; }
```

Replacement 2 — background:
```
OLD: .dark-scope .bg-gray-50 { background-color: #121218 !important; }
NEW: .dark-scope .bg-gray-50 { background-color: var(--color-background) !important; }
```

Replacement 3 — surface-elevated:
```
OLD: .dark-scope .bg-gray-100 { background-color: #20202b !important; }
NEW: .dark-scope .bg-gray-100 { background-color: var(--color-surface-elevated) !important; }
```

Replacement 4 — text-primary:
```
OLD: .dark-scope .text-gray-900, .dark-scope .text-gray-800, .dark-scope .text-gray-700 { color: #e9e9f0 !important; }
NEW: .dark-scope .text-gray-900, .dark-scope .text-gray-800, .dark-scope .text-gray-700 { color: var(--color-text-primary) !important; }
```

Replacement 5 — text-secondary:
```
OLD: .dark-scope .text-gray-600, .dark-scope .text-gray-500 { color: #a3a3b8 !important; }
NEW: .dark-scope .text-gray-600, .dark-scope .text-gray-500 { color: var(--color-text-secondary) !important; }
```

Replacement 6 — text-muted:
```
OLD: .dark-scope .text-gray-400, .dark-scope .text-gray-300 { color: #71718c !important; }
NEW: .dark-scope .text-gray-400, .dark-scope .text-gray-300 { color: var(--color-text-muted) !important; }
```

Replacement 7 — border (two selectors share the same old value, replace both occurrences of the literal `#2c2c3a` within these two specific rules only — do NOT touch `#2c2c3a` if it appears inside the `input, select, textarea` rule, see Replacement 8):
```
OLD: .dark-scope .border-gray-100, .dark-scope .border-gray-200, .dark-scope .border-gray-300 { border-color: #2c2c3a !important; }
NEW: .dark-scope .border-gray-100, .dark-scope .border-gray-200, .dark-scope .border-gray-300 { border-color: var(--color-border) !important; }
```
```
OLD: .dark-scope .divide-gray-100 > * + * { border-color: #2c2c3a !important; }
NEW: .dark-scope .divide-gray-100 > * + * { border-color: var(--color-border) !important; }
```

Replacement 8 — input/select/textarea text + border only (leave the `#14141b` background exactly as-is — that's the deliberately-out-of-scope input-specific surface shade):
```
OLD: .dark-scope input, .dark-scope select, .dark-scope textarea { background-color: #14141b !important; color: #e9e9f0 !important; border-color: #2c2c3a !important; }
NEW: .dark-scope input, .dark-scope select, .dark-scope textarea { background-color: #14141b !important; color: var(--color-text-primary) !important; border-color: var(--color-border) !important; }
```

Replacement 9 — secondary:
```
OLD: .dark-scope .bg-gray-950, .dark-scope .bg-gray-900 { background-color: #0d0d13 !important; }
NEW: .dark-scope .bg-gray-950, .dark-scope .bg-gray-900 { background-color: var(--color-secondary) !important; }
```

- [ ] **Step 3: Run the specific test that asserts on this block**

Run: `node --test tests/fairness-and-data.test.mjs` (or however the harness runs a single file — check `tests/run.mjs` for the per-file invocation pattern first with `grep -n 'fairness-and-data' tests/run.mjs`). Expect: PASS, same as before (the block's markers and the untouched-rule substrings are all still present).

- [ ] **Step 4: Visual verification — light mode**

Playwright: navigate to `http://localhost:5173/`, screenshot. Compare against Task 2 Step 4's baseline screenshot — must be pixel-identical (light mode never touches `.dark-scope` rules at all, so this is a strong sanity check that nothing leaked).

- [ ] **Step 5: Visual verification — dark mode**

Playwright: toggle dark mode on (find the dark-mode toggle in owner or mechanic settings per the audit — `darkMode`/`setDarkMode` — or navigate directly if there's a query-param/URL way; otherwise click through Ayarlar → dark mode toggle), screenshot the same homepage-equivalent view. Compare colors visually against a dark-mode screenshot taken before this task's edits (take one now if you don't already have a pre-edit reference — if you already ran Task 3 Step 3's build before this task, temporarily `git stash` this task's uncommitted change, screenshot, `git stash pop`, then re-screenshot after, per the shared-stash safety rule: use a tagged `git stash push -u -m "wave1-task4-before"`, capture its SHA immediately, and restore with `git stash apply <sha>`, never bare `pop`). Must be pixel-identical.

- [ ] **Step 6: Full regression**

Run: `node tests/run.mjs` from repo root. Expect: 2776 passing, 0 failures.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/AppShell.tsx
git commit -m "refactor: repoint dark-mode overrides at design tokens (no visual change)"
```

---

### Task 5: Fix the real accessibility gap found in the audit

**Files:**
- Modify: `frontend/src/app/AppShell.tsx` (chat-screen language `<select>`, confirm current line with `grep -n 'ownerLang} onChange={(e) => setOwnerLang' frontend/src/app/AppShell.tsx` — was line 2942 at audit time)
- Test: new assertion in `tests/design-tokens.test.mjs` (Task 6) will also cover this, but do this fix first since it's independent and small.

**Interfaces:**
- Consumes: `ring-focus` Tailwind utility from Task 3.
- Produces: nothing consumed elsewhere.

- [ ] **Step 1: Make the fix**

```
OLD: className="bg-gray-100 text-gray-700 text-xs rounded-lg px-2 py-1 border-none outline-none"
NEW: className="bg-gray-100 text-gray-700 text-xs rounded-lg px-2 py-1 border-none outline-none focus:ring-2 focus:ring-focus"
```

This is the exact `<select value={ownerLang} onChange={(e) => setOwnerLang(e.target.value)} ...>` element on the chat screen — the only `outline-none` in the codebase found during the audit with zero focus-ring replacement (9 of the other 10 spot-checked already had one).

- [ ] **Step 2: Visual verification**

Playwright: navigate to the chat screen (requires being logged in as an owner with an active conversation — if no test data makes this reachable quickly, use `browser_evaluate` to Tab-focus the select via keyboard and screenshot, or inspect via `browser_snapshot` that the element now has the new classes applied). Confirm a visible blue ring appears on keyboard focus.

- [ ] **Step 3: Run the full test suite**

Run: `node tests/run.mjs`. Expect: 2776 passing, 0 failures (this element isn't asserted on by any existing test, so this should be a clean no-op for the suite).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/AppShell.tsx
git commit -m "fix: add missing focus ring to chat language selector"
```

---

### Task 6: Add a regression test for the token system itself

**Files:**
- Create: `tests/design-tokens.test.mjs`

**Interfaces:**
- Consumes: `frontend/src/styles/tokens.css`, `frontend/tailwind.config.js` (reads both as text, same pattern as every other `tests/*.test.mjs` file — see `tests/fairness-and-data.test.mjs` for the `readFileSync` + `join` + `_harness.mjs` pattern already in use).
- Produces: a permanent regression guard — if Wave 2's palette-switcher or any future edit accidentally drops a token, deletes the `.dark-scope` block, or breaks the Tailwind mapping, this test fails immediately.

- [ ] **Step 1: Write the test**

```js
// tests/design-tokens.test.mjs
// KURAL: her semantic token hem :root hem .dark-scope altında tanımlı olmalı,
// ve tailwind.config.js her birini Tailwind renk adı olarak eşlemeli. Bu test
// Wave 2'deki palet-değiştirici bu dosyaları değiştirmeye başladığında bir
// tokenin yanlışlıkla silinmesini/eşleşmemesini yakalar.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, ok, report } from "./_harness.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...p) => readFileSync(join(ROOT, ...p), "utf8");
const tokens = read("frontend", "src", "styles", "tokens.css");
const twConfig = read("frontend", "tailwind.config.js");

const TOKEN_NAMES = [
  "primary", "primary-hover", "primary-active", "secondary", "accent",
  "background", "surface", "surface-elevated", "text-primary", "text-secondary",
  "text-muted", "border", "success", "warning", "error", "info", "cta", "focus",
];

const rootBlock = tokens.slice(tokens.indexOf(":root {"), tokens.indexOf(".dark-scope {"));
const darkBlock = tokens.slice(tokens.indexOf(".dark-scope {"));

for (const name of TOKEN_NAMES) {
  ok(rootBlock.includes(`--color-${name}:`), `:root --color-${name} tanımlı`);
  ok(darkBlock.includes(`--color-${name}:`), `.dark-scope --color-${name} tanımlı`);
  ok(twConfig.includes(`var(--color-${name})`), `tailwind.config.js "${name}" tokenini eşliyor`);
}

// Golden-value check: bu değerler, uygulamanın BUGÜNKÜ (token'sız) davranışıyla
// birebir aynı olmalı — plandaki token tablosu bu değerleri belgeliyor.
const GOLDEN = {
  primary: "#2563eb", "primary-hover": "#1d4ed8", "primary-active": "#1e40af",
  secondary: "#111827", accent: "#f59e0b", background: "#f9fafb", surface: "#ffffff",
  "surface-elevated": "#f3f4f6", "text-primary": "#111827", "text-secondary": "#6b7280",
  "text-muted": "#9ca3af", border: "#e5e7eb", success: "#16a34a", warning: "#d97706",
  error: "#dc2626", info: "#3b82f6", cta: "#2563eb", focus: "#bfdbfe",
};
for (const [name, hex] of Object.entries(GOLDEN)) {
  ok(rootBlock.includes(`--color-${name}: ${hex};`), `:root --color-${name} değeri ${hex}`);
}
const GOLDEN_DARK = { ...GOLDEN, secondary: "#0d0d13", background: "#121218", surface: "#17171f",
  "surface-elevated": "#20202b", "text-primary": "#e9e9f0", "text-secondary": "#a3a3b8",
  "text-muted": "#71718c", border: "#2c2c3a" };
for (const [name, hex] of Object.entries(GOLDEN_DARK)) {
  ok(darkBlock.includes(`--color-${name}: ${hex};`), `.dark-scope --color-${name} değeri ${hex}`);
}

report("design tokens");
```

- [ ] **Step 2: Register the new test file with the runner**

Run: `grep -n 'test-altyapisi\|\.test\.mjs' tests/run.mjs | head -20` to see how static suites are discovered (likely a glob over `tests/*.test.mjs`, in which case no registration step is needed — confirm this before assuming; if `run.mjs` uses an explicit file list instead of a glob, add `"design-tokens.test.mjs"` to it).

- [ ] **Step 3: Run the new test directly**

Run: `node --test tests/design-tokens.test.mjs`. Expect: all `ok`/`eq` assertions pass.

- [ ] **Step 4: Run the full suite to confirm the new file is picked up and everything still passes**

Run: `node tests/run.mjs` from repo root. Expect: **2777 tests** now (2776 + this file's assertions counted as the harness counts them — confirm actual delta from the printed summary rather than assuming exactly +1), 0 failures.

- [ ] **Step 5: Commit**

```bash
git add tests/design-tokens.test.mjs
git commit -m "test: add regression guard for design token system"
```

---

### Task 7: Final full regression + visual sign-off

**Files:** none (verification-only task)

- [ ] **Step 1: Full backend+frontend+e2e suite**

Run: `node tests/run.mjs` from repo root. Record the exact printed summary line verbatim for the final report.

- [ ] **Step 2: Frontend unit tests**

Run (from `frontend/`): `npm test`. Record the exact `# pass`/`# fail` lines.

- [ ] **Step 3: Typecheck**

Run (from `frontend/`): `npx tsc --noEmit`. Expect: no output, exit 0.

- [ ] **Step 4: Production build**

Run (from `frontend/`): `npm run build`. Expect: exit 0.

- [ ] **Step 5: Playwright visual sweep**

Navigate and screenshot (full page) at minimum: homepage (`/`, light and dark), one admin dashboard tab, one mechanic dashboard tab. Compare each against the pre-Wave-1 equivalent screenshot captured earlier in this plan. Report any pixel difference found — there should be none; if there is one, stop and fix it before Step 6.

- [ ] **Step 6: Merge readiness note**

This branch (`worktree-design-system-redesign`) is now ready to merge into `main` (fast-forward or standard merge — confirm with the user before merging, per repo git-safety norms) or to serve as the base for Wave 2 (palette concepts + admin picker), which should branch from here rather than from `main` directly so it inherits the token plumbing.

---

## Self-Review

**1. Spec coverage:** This plan covers the user's Phase 4 "semantic design tokens" requirement in full for the 18 named tokens, and their Phase 7 accessibility requirement for the one concrete gap the audit found. It deliberately does NOT cover: the 6 color palette concepts, the admin "Renk Paletleri" panel, or any component-level migration away from literal Tailwind classes — those are separate follow-up plans (Wave 2, Wave 3+) per the Scope Check in the writing-plans skill, since this spec covers multiple independent subsystems.

**2. Placeholder scan:** No TBD/TODO markers. Every CSS/config/test step has full literal content, not descriptions of content.

**3. Type consistency:** Token variable names (`--color-primary` etc.) are identical across Task 1 (definition), Task 3 (Tailwind mapping), Task 4 (consumption), and Task 6 (test assertions) — cross-checked against the single Token Value Table above, which is the one source of truth every task step was copied from.
