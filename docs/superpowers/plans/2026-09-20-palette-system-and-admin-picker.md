# Palette System & Admin Picker (Wave 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 new fully-designed, WCAG-verified color palettes on top of Wave 1's token infrastructure, a site-wide persisted "active palette" setting (backend-stored, so it applies to every visitor, not just the admin's browser), and an admin panel "Renk Paletleri" tab that lets an admin preview and activate any of the 6 palettes.

**Architecture:** Each new palette is a pair of CSS blocks in `tokens.css` — `[data-palette="<key>"]` (light) and `[data-palette="<key>"].dark-scope` (dark, a compound selector whose specificity (0,2,0) structurally out-ranks the plain `.dark-scope` default (0,1,0) and the plain `[data-palette="<key>"]` light rule, so correctness never depends on source order). The active palette is a single row in a new generic `site_settings` key-value table, read through a public `GET /api/theme` endpoint (every visitor's browser needs it on load) and written through an admin-gated `PATCH /api/theme`. The frontend fetches it once on load, stores it in `AppLogicProvider`, and renders it as a `data-palette` attribute on the same top-level wrapper `<div>` that already carries the `dark-scope` class.

**Tech Stack:** Same as Wave 1 (Tailwind 3.4 CSS custom properties), plus `better-sqlite3` for the new table and the existing Express admin-auth pattern (`requireAdminAuth` in `backend/routes/admin.js`) for the write endpoint.

**Spec:** User's original brief (Turkish) requesting 6-10 professional palette concepts with an admin picker that applies site-wide, consistently, with no leftover old colors anywhere. This plan implements the palette values already designed and WCAG-verified in this session (all primary colors ≥4.5:1 white-text contrast, all focus/UI colors ≥3:1) and previewed to the user in an artifact they approved. It also implements the `docs/superpowers/plans/2026-09-19-design-token-infrastructure.md` plan's deferred architecture question (the `:root`/`.dark-scope` specificity contract for a future palette selector), resolved here via the compound-selector approach described above.

## Global Constraints

- Do not touch: `backend/utils/auth.js`, `backend/utils/rateLimiter.js`, `backend/utils/clientIp.js`, `backend/hydrate.js`, `frontend/src/data/handbook.ts` content (only a static-suite-count digit may ever change, and only if a new static test file is added — none is in this plan), DB schema columns other than the one new table this plan adds.
- Every task must end with `node tests/run.mjs` (repo root) reporting **0 failures** before moving to the next task. Baseline at plan start: 2876 static+e2e tests + 12 frontend unit tests, all passing.
- No new npm dependencies. No changes to `vite.config.js`, `postcss.config.js`.
- Neutral tokens (`background`, `surface`, `surface-elevated`, `fg`, `fg-secondary`, `fg-muted`, `border`) and semantic status tokens (`success`, `warning`, `error`, `info`) are **identical across all 6 palettes** (a deliberate simplification made and disclosed to the user: only `primary`, `primary-hover`, `primary-active`, `secondary`, `accent`, `cta`, `focus` vary per palette). Do not invent per-palette neutral or status colors.
- All palette color values below are FINAL — they were computed and WCAG-verified (real luminance/contrast-ratio math, not eyeballing) earlier in this session, and previewed to the user in an artifact they approved. Do not alter any hex/RGB value while implementing; if a value looks wrong, stop and ask rather than "fixing" it.
- Work happens in the isolated worktree at `/Users/fariskanbur/fixperto/.claude/worktrees/palette-system` (branch `worktree-palette-system`), branched from Wave 1's merged main, `npm install` already done in both `frontend/` and `backend/`, baseline verified at 2876+12 tests passing.

---

## File Structure

- **Modify:** `frontend/src/styles/tokens.css` — append 5 palette block pairs (10 new CSS rule blocks).
- **Modify:** `backend/db/db.js` — add `site_settings` table (generic key-value, reusable for future settings).
- **Create:** `backend/routes/theme.js` — `GET /api/theme` (public) and `PATCH /api/theme` (admin-gated).
- **Modify:** `backend/server.js` — mount the new router.
- **Modify:** `frontend/src/services/api/client.ts` — add `api.theme.get()` / `api.theme.set()`.
- **Modify:** `frontend/src/data/i18n.ts` — add 12 new keys (6 palette names + 6 descriptions, tr/en/de each) plus 1 admin nav label key.
- **Create:** `frontend/src/data/palettes.ts` — `PALETTE_CATALOG` array (key, i18n key references, preview hex values). No logic, just data — keeps `constants.ts` from growing further.
- **Modify:** `frontend/src/app/state/AppLogicProvider.tsx` — add `activePalette` state, initial fetch, `setActivePalette` setter that calls the API and updates local state.
- **Modify:** `frontend/src/app/AppShell.tsx` — add `data-palette={activePalette}` to the wrapper div (line ~311); add `{ key: "appearance", label: t("adminAppearanceTabLabel"), icon: Palette }` to `adminNavItems` (~line 886); add `{adminTab === "appearance" && <AdminAppearancePanel />}` alongside the existing `careers`/`handbook` delegation blocks (~line 1530); add the import.
- **Create:** `frontend/src/components/features/AdminAppearancePanel.tsx` — renders `PALETTE_CATALOG` as cards with preview swatches and a "Kullan" / "Aktif" button, following `AdminCareersPanel.tsx`'s minimal-destructure pattern (`const { t, activePalette, setActivePalette, setToast } = useApp();`), not the giant 500-identifier pattern used elsewhere.
- **Create:** `tests/e2e/api11.e2e.mjs` — real HTTP tests against the live server + SQLite for the new endpoints (public GET, admin-gated PATCH, invalid-key rejection, persistence across a second GET).
- **Modify:** `tests/design-tokens.test.mjs` — extend to verify all 5 new palette blocks exist with the correct selector pattern and golden values.

## Palette Value Table (reference for every task below — do not deviate)

All values WCAG-verified earlier in this session (white-text-on-primary ≥4.5:1 for every palette except where noted; all focus/UI colors ≥3:1). `secondary`/`accent`/`cta`/`focus` for palettes not listed as having a "Dark override" row use the SAME value in both light and dark (matching Wave 1's established precedent for the default palette — no existing override means same value both modes).

| Palette | Token | Light RGB | Light hex | Dark RGB (if different) | Dark hex (if different) |
|---|---|---|---|---|---|
| **trust** (Güven Yeşili) | primary | 4 120 87 | #047857 | — | — |
| | primary-hover | 6 95 70 | #065f46 | | |
| | primary-active | 6 78 59 | #064e3b | | |
| | secondary | 17 24 39 | #111827 (= default) | | |
| | accent | 245 158 11 | #f59e0b (= default) | | |
| | cta | 4 120 87 | #047857 | | |
| | focus | 5 150 105 | #059669 | | |
| **industrial** (Endüstriyel Modern) | primary | 194 65 12 | #c2410c | — | — |
| | primary-hover | 154 52 18 | #9a3412 | | |
| | primary-active | 124 45 18 | #7c2d12 | | |
| | secondary | 30 41 59 | #1e293b | | |
| | accent | 100 116 139 | #64748b | | |
| | cta | 194 65 12 | #c2410c | | |
| | focus | 234 88 12 | #ea580c | | |
| **performance** (Gece Performansı) | primary | 14 116 144 | #0e7490 | — | — |
| | primary-hover | 21 94 117 | #155e75 | | |
| | primary-active | 22 78 99 | #164e63 | | |
| | secondary | 9 9 11 | #09090b | | |
| | accent | 220 38 38 | #dc2626 | | |
| | cta | 14 116 144 | #0e7490 | | |
| | focus | 8 145 178 | #0891b2 | | |
| **european** (Avrupa Otomotiv) | primary | 30 64 175 | #1e40af | 37 99 235 | #2563eb |
| | primary-hover | 30 58 138 | #1e3a8a | 29 78 216 | #1d4ed8 |
| | primary-active | 23 37 84 | #172554 | 30 64 175 | #1e40af |
| | secondary | 15 23 42 | #0f172a | — | — |
| | accent | 71 85 105 | #475569 | — | — |
| | cta | 30 64 175 | #1e40af | 37 99 235 | #2563eb |
| | focus | 59 130 246 | #3b82f6 | — | — |
| **minimal** (Minimal Prestij) | primary | 24 24 27 | #18181b | 161 98 7 | #a16207 |
| | primary-hover | 39 39 42 | #27272a | 133 77 14 | #854d0e |
| | primary-active | 9 9 11 | #09090b | 113 63 18 | #713f12 |
| | secondary | 63 63 70 | #3f3f46 | 24 24 27 †  | #18181b † |
| | accent | 161 98 7 | #a16207 | — | — |
| | cta | 24 24 27 | #18181b | 161 98 7 | #a16207 |
| | focus | 161 98 7 | #a16207 | — | — |

† **Post-implementation correction (final review, user-approved):** `minimal`'s dark-mode `secondary`
was originally planned with no override (same as light, `63 63 70` / #3f3f46). The final whole-branch
review found `AppShell.tsx`'s dark-mode block makes `secondary` a live, visible surface color
(`.dark-scope .bg-gray-900/950`, shipped in Wave 1) — on that surface, `#3f3f46` dropped muted text
to 2.21:1 contrast (WCAG fail). Darkened to `24 24 27`/#18181b (same hex as this palette's own light
primary) after showing the user the exact contrast numbers; verified live at ~11:1. See the SDD
ledger for this plan and commit `d9ebe9b` (worktree-palette-system) for the full record.

**Also found and fixed during final review (unrelated to the value above):** all 10 of `AppShell.tsx`'s
hand-written dark-mode CSS-in-JS declarations that reference `var(--color-*)` were using the BARE
variable (e.g. `color: var(--color-fg) !important;`) rather than wrapping it in `rgb(...)`. Since Wave 1's
RGB-triplet hardening pass, `--color-*` values are bare "R G B" triplets (not valid standalone CSS colors),
so every one of these declarations was invalid at computed-value time — dark-mode heading/body text
rendered pure black, and surface/border overrides silently no-op'd. This had already shipped to `main`
via the hardening pass and was undetected because the only regression test checked for the substring
`var(--color-x)`, which matched whether or not it was correctly wrapped. Fixed by wrapping all 10 as
`rgb(var(--color-x))`; the test now requires the wrapped form. See commit `d9ebe9b`.

The 6th palette (`default`) already exists from Wave 1 — this plan does not touch it.

---

### Task 1: Extend tokens.css with the 5 new palette blocks

**Files:**
- Modify: `frontend/src/styles/tokens.css`

**Interfaces:**
- Produces: `[data-palette="trust"]`, `[data-palette="trust"].dark-scope`, and the same pair for `industrial`, `performance`, `european`, `minimal` — 10 new CSS rule blocks, each defining only the 7 tokens that vary per palette (`primary`, `primary-hover`, `primary-active`, `secondary`, `accent`, `cta`, `focus`). Neutral/status tokens are NOT redefined in these blocks — they inherit from `:root`/`.dark-scope` as normal CSS custom property inheritance already provides.

- [ ] **Step 1: Read the current file to find the end of the `.dark-scope` block**

Run: `grep -n "^}" frontend/src/styles/tokens.css | tail -3` to confirm where the file currently ends (the closing brace of `.dark-scope`).

- [ ] **Step 2: Append this exact block to the end of the file**

```css

/* ===== PALET KONSEPTLERİ (Wave 2) =====
 * Her palet ÇİFT blok olarak tanımlanır: [data-palette="x"] (açık) ve
 * [data-palette="x"].dark-scope (karanlık, BİLEŞİK seçici). Bu bilinçli bir mimari karar
 * (bkz. docs/superpowers/plans/2026-09-19-design-token-infrastructure.md'nin ertelediği
 * özgüllük sorusu): [data-palette="x"] tek başına (0,1,0) özgüllüğünde, aynı elemente hem
 * .dark-scope hem [data-palette="x"] eşleştiğinde (karanlık moddayken) SADECE bileşik hâli
 * ([data-palette="x"].dark-scope, özgüllük 0,2,0) düz [data-palette="x"] kuralını KESİN olarak
 * ezer — kaynak sırasına bağımlı değildir. Nötr ve success/warning/error/info token'ları
 * BİLİNÇLİ olarak burada yeniden tanımlanmıyor: tüm paletlerde aynı kalıyorlar, :root/.dark-scope
 * üzerinden miras kalıyorlar.
 */

[data-palette="trust"] {
  --color-primary: 4 120 87;
  --color-primary-hover: 6 95 70;
  --color-primary-active: 6 78 59;
  --color-secondary: 17 24 39;
  --color-accent: 245 158 11;
  --color-cta: 4 120 87;
  --color-focus: 5 150 105;
}
[data-palette="trust"].dark-scope {
  --color-primary: 4 120 87;
  --color-primary-hover: 6 95 70;
  --color-primary-active: 6 78 59;
  --color-secondary: 17 24 39;
  --color-accent: 245 158 11;
  --color-cta: 4 120 87;
  --color-focus: 5 150 105;
}

[data-palette="industrial"] {
  --color-primary: 194 65 12;
  --color-primary-hover: 154 52 18;
  --color-primary-active: 124 45 18;
  --color-secondary: 30 41 59;
  --color-accent: 100 116 139;
  --color-cta: 194 65 12;
  --color-focus: 234 88 12;
}
[data-palette="industrial"].dark-scope {
  --color-primary: 194 65 12;
  --color-primary-hover: 154 52 18;
  --color-primary-active: 124 45 18;
  --color-secondary: 30 41 59;
  --color-accent: 100 116 139;
  --color-cta: 194 65 12;
  --color-focus: 234 88 12;
}

[data-palette="performance"] {
  --color-primary: 14 116 144;
  --color-primary-hover: 21 94 117;
  --color-primary-active: 22 78 99;
  --color-secondary: 9 9 11;
  --color-accent: 220 38 38;
  --color-cta: 14 116 144;
  --color-focus: 8 145 178;
}
[data-palette="performance"].dark-scope {
  --color-primary: 14 116 144;
  --color-primary-hover: 21 94 117;
  --color-primary-active: 22 78 99;
  --color-secondary: 9 9 11;
  --color-accent: 220 38 38;
  --color-cta: 14 116 144;
  --color-focus: 8 145 178;
}

[data-palette="european"] {
  --color-primary: 30 64 175;
  --color-primary-hover: 30 58 138;
  --color-primary-active: 23 37 84;
  --color-secondary: 15 23 42;
  --color-accent: 71 85 105;
  --color-cta: 30 64 175;
  --color-focus: 59 130 246;
}
[data-palette="european"].dark-scope {
  --color-primary: 37 99 235;
  --color-primary-hover: 29 78 216;
  --color-primary-active: 30 64 175;
  --color-secondary: 15 23 42;
  --color-accent: 71 85 105;
  --color-cta: 37 99 235;
  --color-focus: 59 130 246;
}

[data-palette="minimal"] {
  --color-primary: 24 24 27;
  --color-primary-hover: 39 39 42;
  --color-primary-active: 9 9 11;
  --color-secondary: 63 63 70;
  --color-accent: 161 98 7;
  --color-cta: 24 24 27;
  --color-focus: 161 98 7;
}
[data-palette="minimal"].dark-scope {
  --color-primary: 161 98 7;
  --color-primary-hover: 133 77 14;
  --color-primary-active: 113 63 18;
  --color-secondary: 63 63 70;
  --color-accent: 161 98 7;
  --color-cta: 161 98 7;
  --color-focus: 161 98 7;
}
```

- [ ] **Step 3: Verify the file is syntactically valid CSS**

Run (from `frontend/`): `npm run build` — expect exit 0.

- [ ] **Step 4: Run the full test suite**

Run: `node tests/run.mjs` from repo root. Expect: 2876 passing, 0 failures (nothing consumes `[data-palette]` yet, so this is a pure addition with zero behavioral effect — the existing `design-tokens.test.mjs` only checks `:root`/`.dark-scope`, unaffected).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/styles/tokens.css
git commit -m "feat: add 5 new palette CSS blocks (data-palette selectors)"
```

---

### Task 2: Backend — site_settings table + theme endpoints

**Files:**
- Modify: `backend/db/db.js`
- Create: `backend/routes/theme.js`
- Modify: `backend/server.js`

**Interfaces:**
- Produces: `GET /api/theme` → `{ palette: string }` (public, no auth — defaults to `"default"` if no row exists yet). `PATCH /api/theme` with body `{ palette: string }` → `{ ok: true, palette: string }` (requires `Authorization: Bearer <adminToken>`, uses the SAME `requireAdminAuth` pattern as `backend/routes/admin.js`). Rejects (400) any `palette` value not in the known set of 6 keys.

- [ ] **Step 1: Add the table**

Run `grep -n "CREATE TABLE IF NOT EXISTS translation_cache" backend/db/db.js` to confirm the exact current line, then use the Edit tool to insert this new table definition immediately before the closing `` `); `` that ends that `db.exec(...)` call (the block containing `translation_cache`):

```sql
-- Genel amaçlı anahtar-değer ayarlar tablosu. İlk kullanımı: aktif renk paleti (Wave 2), ama
-- gelecekte başka site-geneli ayarlar için de aynı tablo kullanılabilir — palet için özel bir
-- tablo açmak yerine.
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updatedAt TEXT DEFAULT (datetime('now'))
);
```

- [ ] **Step 2: Write the route file**

Create `backend/routes/theme.js`:

```js
import { Router } from "express";
import { db } from "../db/db.js";
import { isAdminToken, extractBearerToken } from "../utils/auth.js";

// Site-geneli aktif renk paleti. GET herkese açık — her ziyaretçinin tarayıcısı sayfa
// yüklenirken hangi paleti uygulayacağını bilmeli. PATCH sadece admin girişiyle.
const KNOWN_PALETTES = ["default", "trust", "industrial", "performance", "european", "minimal"];
const SETTING_KEY = "activePalette";

const router = Router();

router.get("/", (req, res) => {
  const row = db.prepare("SELECT value FROM site_settings WHERE key = ?").get(SETTING_KEY);
  res.json({ palette: row ? row.value : "default" });
});

router.patch("/", (req, res) => {
  const token = extractBearerToken(req);
  if (!isAdminToken(token)) {
    return res.status(401).json({ error: "Bu işlem için admin girişi gerekiyor." });
  }
  const { palette } = req.body || {};
  if (typeof palette !== "string" || !KNOWN_PALETTES.includes(palette)) {
    return res.status(400).json({ error: `Geçersiz palet. Beklenen: ${KNOWN_PALETTES.join(", ")}` });
  }
  db.prepare(
    "INSERT INTO site_settings (key, value, updatedAt) VALUES (?, ?, datetime('now')) " +
    "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt"
  ).run(SETTING_KEY, palette);
  res.json({ ok: true, palette });
});

export default router;
```

- [ ] **Step 3: Mount the router**

Find the exact line with `grep -n 'app.use("/api/admin", adminRouter)' backend/server.js` and add, right after it:

```js
app.use("/api/theme", themeRouter);
```

Add the import alongside the other route imports (find `import adminRouter from "./routes/admin.js";` and add right after it):

```js
import themeRouter from "./routes/theme.js";
```

- [ ] **Step 4: Manual smoke test**

Run the backend locally (`cd backend && npm run dev` backgrounded if not already running) and:
```bash
curl -s http://localhost:4000/api/theme
# expect: {"palette":"default"}
curl -s -X PATCH http://localhost:4000/api/theme -H "Content-Type: application/json" -d '{"palette":"trust"}'
# expect: 401 {"error":"Bu işlem için admin girişi gerekiyor."}
```

- [ ] **Step 5: Run the full test suite**

Run: `node tests/run.mjs` from repo root. Expect: 2876 passing, 0 failures (no existing test touches this table/route).

- [ ] **Step 6: Commit**

```bash
git add backend/db/db.js backend/routes/theme.js backend/server.js
git commit -m "feat: add site_settings table and /api/theme endpoints"
```

---

### Task 3: Real end-to-end test for the theme endpoints

**Files:**
- Create: `tests/e2e/api11.e2e.mjs`

**Interfaces:**
- Consumes: `startServer, stopServer, api, adminToken, skipIfUnsupported` from `tests/e2e/harness.mjs` (same harness every other `apiN.e2e.mjs` file uses), `eq, ok, report` from `tests/_harness.mjs`.

- [ ] **Step 1: Write the test**

```js
// tests/e2e/api11.e2e.mjs
// UÇTAN UCA: /api/theme — gerçek sunucu + gerçek SQLite üzerinden.
import { startServer, stopServer, api, adminToken, skipIfUnsupported } from "./harness.mjs";
import { eq, ok, report } from "../_harness.mjs";

if (skipIfUnsupported("uçtan uca tema/palet uç noktası")) process.exit(0);

await startServer();
try {
  // 1) GET herkese açık, satır yokken varsayılan "default" dönüyor.
  const initial = await api("GET", "/api/theme");
  eq(initial.status, 200, "GET /api/theme 200");
  eq(initial.body.palette, "default", "hiç ayarlanmamışken varsayılan palet 'default'");

  // 2) PATCH admin girişi olmadan reddediliyor.
  const noAuth = await api("PATCH", "/api/theme", { body: { palette: "trust" } });
  eq(noAuth.status, 401, "admin girişi olmadan PATCH 401");

  const admin = await adminToken();

  // 3) Geçersiz palet adı reddediliyor.
  const invalid = await api("PATCH", "/api/theme", { body: { palette: "not-a-real-palette" }, token: admin });
  eq(invalid.status, 400, "bilinmeyen palet adı 400");

  // 4) Admin girişiyle geçerli bir palet başarıyla ayarlanıyor ve GET bunu yansıtıyor.
  const setRes = await api("PATCH", "/api/theme", { body: { palette: "trust" }, token: admin });
  eq(setRes.status, 200, "geçerli palet + admin girişi 200");
  eq(setRes.body.palette, "trust", "PATCH yanıtı yeni paleti döndürüyor");

  const after = await api("GET", "/api/theme");
  eq(after.body.palette, "trust", "PATCH sonrası GET yeni paleti gösteriyor (kalıcı)");

  // 5) Farklı bir palete geçiş de kalıcı oluyor (tek satırlık upsert doğru çalışıyor).
  const setRes2 = await api("PATCH", "/api/theme", { body: { palette: "minimal" }, token: admin });
  eq(setRes2.status, 200, "ikinci palet değişikliği 200");
  const after2 = await api("GET", "/api/theme");
  eq(after2.body.palette, "minimal", "ikinci GET güncel paleti gösteriyor");

  report("tema/palet uç noktası (e2e)");
} finally {
  await stopServer();
}
```

- [ ] **Step 2: Run it directly**

Run: `node tests/e2e/api11.e2e.mjs` from repo root. Expect all assertions to pass.

- [ ] **Step 3: Run the full suite to confirm it's discovered and everything still passes**

Run: `node tests/run.mjs` from repo root. Expect the e2e count to go from 10 to 11 suites, total test count higher by however many assertions this file has (read the actual printed total).

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/api11.e2e.mjs
git commit -m "test: add e2e coverage for /api/theme endpoints"
```

---

### Task 4: Frontend API client + PALETTE_CATALOG data + i18n keys

**Files:**
- Modify: `frontend/src/services/api/client.ts`
- Modify: `frontend/src/data/i18n.ts`
- Create: `frontend/src/data/palettes.ts`

**Interfaces:**
- Produces: `api.theme.get(): Promise<{ palette: string }>`, `api.theme.set(palette: string): Promise<{ ok: true; palette: string }>`; `PALETTE_CATALOG: Array<{ key: string; nameKey: string; descKey: string; preview: { primary: string; secondary: string; accent: string; background: string; text: string; success: string; warning: string; error: string } }>`.

- [ ] **Step 1: Add the API client methods**

Find the `admin: {` block in `frontend/src/services/api/client.ts` (`grep -n "^  admin: {" frontend/src/services/api/client.ts`) and add a new top-level sibling key (same indentation level as `admin:`, `careers:`, etc. — find one such sibling with `grep -n "^  careers: {" frontend/src/services/api/client.ts` to match the exact pattern):

```ts
  theme: {
    get: (): Promise<{ palette: string }> => request("/api/theme"),
    set: (palette: string): Promise<{ ok: true; palette: string }> =>
      request("/api/theme", { method: "PATCH", body: JSON.stringify({ palette }), ...adminAuthOpts() }),
  },
```

- [ ] **Step 2: Add the 13 i18n keys**

In `frontend/src/data/i18n.ts`, add these entries anywhere alongside other simple key definitions (follow the file's existing flat-object format exactly):

```ts
  adminAppearanceTabLabel: { tr: "Renk Paletleri", en: "Color Palettes", de: "Farbpaletten" },
  paletteDefaultName: { tr: "Fixperto Klasik", en: "Fixperto Classic", de: "Fixperto Klassisch" },
  paletteDefaultDesc: { tr: "Mevcut varsayılan renk. Güvenilir, nötr, tanıdık mavi.", en: "The current default. Trustworthy, neutral, familiar blue.", de: "Der aktuelle Standard. Vertrauenswürdiges, neutrales, vertrautes Blau." },
  paletteTrustName: { tr: "Güven Yeşili", en: "Trust Green", de: "Vertrauensgrün" },
  paletteTrustDesc: { tr: "Avrupa araç muayene yeşilinin çağrışımı — \"kontrol edildi, güvenilir\" hissi.", en: "Evokes European vehicle-inspection green — a \"verified, reliable\" feel.", de: "Erinnert an europäisches TÜV-Grün — ein Gefühl von \"geprüft, zuverlässig\"." },
  paletteIndustrialName: { tr: "Endüstriyel Modern", en: "Industrial Modern", de: "Industriell Modern" },
  paletteIndustrialDesc: { tr: "Atölye/tamirhane estetiği: çelik gri zemin, turuncu vurgu.", en: "Workshop aesthetic: steel-gray base, orange accent.", de: "Werkstatt-Ästhetik: Stahlgrauer Grundton, orangefarbener Akzent." },
  palettePerformanceName: { tr: "Gece Performansı", en: "Dark Performance", de: "Dunkle Leistung" },
  palettePerformanceDesc: { tr: "Neredeyse siyah zemin, elektrik camgöbeği vurgu — performans/telemetri havası.", en: "Near-black base, electric cyan accent — a performance/telemetry feel.", de: "Fast schwarzer Grundton, elektrisches Cyan als Akzent — Performance-Gefühl." },
  paletteEuropeanName: { tr: "Avrupa Otomotiv", en: "European Automotive", de: "Europäisches Automotive" },
  paletteEuropeanDesc: { tr: "Koyu lacivert + gümüş — Alman premium otomotiv markalarının diline yakın.", en: "Deep navy + silver — close to the language of premium German automotive brands.", de: "Tiefes Marineblau + Silber — nah an der Sprache deutscher Premium-Automobilmarken." },
  paletteMinimalName: { tr: "Minimal Prestij", en: "Minimal Premium", de: "Minimal Premium" },
  paletteMinimalDesc: { tr: "Neredeyse tek renkli: siyah/beyaz + tek bir altın vurgu.", en: "Nearly monochrome: black/white plus a single gold accent.", de: "Fast einfarbig: Schwarz/Weiß plus ein einziger Goldakzent." },
```

- [ ] **Step 3: Write the catalog file**

Create `frontend/src/data/palettes.ts`:

```ts
// frontend/src/data/palettes.ts
// Admin "Renk Paletleri" panelinin okuduğu katalog. Sadece veri — mantık yok. Her `preview`
// değeri frontend/src/styles/tokens.css'teki GERÇEK token değerleriyle birebir aynı olmalı
// (bkz. docs/superpowers/plans/2026-09-20-palette-system-and-admin-picker.md'deki tablo).
export interface PaletteEntry {
  key: string;
  nameKey: string;
  descKey: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    success: string;
    warning: string;
    error: string;
  };
}

// Nötr (background/text) ve success/warning/error tüm paletlerde AYNI — bkz. plan, "Global
// Constraints". Tek satırda tanımlanıp her girişte yeniden kullanılıyor.
const SHARED_NEUTRAL_AND_STATUS = {
  background: "#f9fafb",
  text: "#111827",
  success: "#16a34a",
  warning: "#d97706",
  error: "#dc2626",
};

export const PALETTE_CATALOG: PaletteEntry[] = [
  { key: "default", nameKey: "paletteDefaultName", descKey: "paletteDefaultDesc",
    preview: { primary: "#2563eb", secondary: "#111827", accent: "#f59e0b", ...SHARED_NEUTRAL_AND_STATUS } },
  { key: "trust", nameKey: "paletteTrustName", descKey: "paletteTrustDesc",
    preview: { primary: "#047857", secondary: "#111827", accent: "#f59e0b", ...SHARED_NEUTRAL_AND_STATUS } },
  { key: "industrial", nameKey: "paletteIndustrialName", descKey: "paletteIndustrialDesc",
    preview: { primary: "#c2410c", secondary: "#1e293b", accent: "#64748b", ...SHARED_NEUTRAL_AND_STATUS } },
  { key: "performance", nameKey: "palettePerformanceName", descKey: "palettePerformanceDesc",
    preview: { primary: "#0e7490", secondary: "#09090b", accent: "#dc2626", ...SHARED_NEUTRAL_AND_STATUS } },
  { key: "european", nameKey: "paletteEuropeanName", descKey: "paletteEuropeanDesc",
    preview: { primary: "#1e40af", secondary: "#0f172a", accent: "#475569", ...SHARED_NEUTRAL_AND_STATUS } },
  { key: "minimal", nameKey: "paletteMinimalName", descKey: "paletteMinimalDesc",
    preview: { primary: "#18181b", secondary: "#3f3f46", accent: "#a16207", ...SHARED_NEUTRAL_AND_STATUS } },
];
```

- [ ] **Step 2: Typecheck**

Run (from `frontend/`): `npx tsc --noEmit`. Expect exit 0.

- [ ] **Step 3: Run the full test suite**

Run: `node tests/run.mjs` from repo root. Expect the same total as Task 3 ended with, 0 failures (this task adds no new tests, purely data/client additions not yet consumed by UI).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/services/api/client.ts frontend/src/data/i18n.ts frontend/src/data/palettes.ts
git commit -m "feat: add theme API client methods, PALETTE_CATALOG, and i18n keys"
```

---

### Task 5: Wire activePalette state into AppLogicProvider and AppShell

**Files:**
- Modify: `frontend/src/app/state/AppLogicProvider.tsx`
- Modify: `frontend/src/app/AppShell.tsx`

**Interfaces:**
- Consumes: `api.theme.get`, `api.theme.set` from Task 4.
- Produces: `activePalette: string` and `setActivePalette: (palette: string) => Promise<void>` exposed from `useApp()`, consumed by Task 6's admin panel and applied as a `data-palette` DOM attribute here.

- [ ] **Step 1: Add state + fetch effect to AppLogicProvider**

Find where `darkMode`/`setDarkMode` is declared (`grep -n "const \[darkMode, setDarkMode\]" frontend/src/app/state/AppLogicProvider.tsx`) and add immediately after it:

```ts
  // Site-geneli aktif renk paleti (Wave 2). darkMode'un aksine bu KALICI ve HERKES İÇİN
  // ortak — admin panelinden değiştirilince backend'e yazılıyor (site_settings tablosu) ve
  // her ziyaretçinin tarayıcısı sayfa yüklenirken bunu okuyor. "default" ile başlıyoruz ki
  // backend'e ulaşılamadığı an bile mevcut (Wave 1) görünüm bozulmadan kalsın.
  const [activePalette, setActivePaletteState] = useState("default");
  useEffect(() => {
    api.theme.get().then(({ palette }) => setActivePaletteState(palette)).catch(() => { /* sessizce varsayılanda kal */ });
  }, []);
  const setActivePalette = async (palette: string) => {
    await api.theme.set(palette);
    setActivePaletteState(palette);
  };
```

- [ ] **Step 2: Expose both from the context value**

Find the large object literal this hook returns (search for `darkMode, setDarkMode,` inside the final `return { ... }` of `useAppLogic`) and add `activePalette, setActivePalette,` immediately next to it.

- [ ] **Step 3: Apply the attribute in AppShell**

The current wrapper div (confirm the exact current line first: `grep -n "dark-scope bg-gray-950" frontend/src/app/AppShell.tsx`):

```
OLD: <div className={`min-h-screen flex justify-center relative ${darkMode ? "dark-scope bg-gray-950" : "bg-gray-50"}`}>
NEW: <div data-palette={activePalette} className={`min-h-screen flex justify-center relative ${darkMode ? "dark-scope bg-gray-950" : "bg-gray-50"}`}>
```

`activePalette` must already be destructured from `useApp()` in this component — confirm it's present in the giant destructure list at the top of the default-exported component function (if not already covered by an existing catch-all, add `activePalette,` to that list explicitly).

- [ ] **Step 4: Visual verification — zero diff when palette is "default"**

Start the dev server if not already running, navigate to the homepage with Playwright, screenshot, and confirm it's pixel-identical to before this task (the wrapper div now carries `data-palette="default"`, which matches no CSS rule since only `trust`/`industrial`/`performance`/`european`/`minimal` have blocks — `:root`/`.dark-scope` remain the only source of truth for the default palette, exactly as before).

- [ ] **Step 5: Manual verification that the new attribute is real**

Run in the browser console via Playwright `browser_evaluate`: confirm `document.querySelector('[data-palette]').getAttribute('data-palette')` returns `"default"` on load.

- [ ] **Step 6: Run the full test suite**

Run: `node tests/run.mjs` from repo root. Expect 0 failures, same total as before (no new assertions in this task).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/state/AppLogicProvider.tsx frontend/src/app/AppShell.tsx
git commit -m "feat: fetch and apply active palette as a data-palette attribute"
```

---

### Task 6: Admin "Renk Paletleri" panel

**Files:**
- Create: `frontend/src/components/features/AdminAppearancePanel.tsx`
- Modify: `frontend/src/app/AppShell.tsx`

**Interfaces:**
- Consumes: `PALETTE_CATALOG` (Task 4), `activePalette`/`setActivePalette` (Task 5), `t`/`setToast` (existing `useApp()`).

- [ ] **Step 1: Write the component**

Create `frontend/src/components/features/AdminAppearancePanel.tsx`:

```tsx
import { Check, Palette } from "lucide-react";
import { useState } from "react";
import { useApp } from "../../app/state/AppLogicProvider";
import { PALETTE_CATALOG } from "../../data/palettes";

/**
 * YÖNETİCİ — RENK PALETLERİ.
 * ---------------------------------------------------------------------------------------------
 * Admin burada 6 hazır paletten birini SİTE GENELİNDE aktif eder (kendi tarayıcısı değil —
 * backend'e yazılır, her ziyaretçi bunu görür). Değişiklik anında bu sayfanın kendisine de
 * uygulanır (activePalette state'i güncellenince data-palette attribute'u da güncellenir),
 * yani admin "Kullan"a bastığı anda kendi ekranında sonucu görür.
 *
 * AdminCareersPanel.tsx ile aynı minimal destructure deseni — bu component'in ihtiyacı
 * olmayan 500+ değişkeni içeri almıyor.
 */
export function AdminAppearancePanel() {
  const { t, activePalette, setActivePalette, setToast } = useApp();
  const [applying, setApplying] = useState<string | null>(null);

  const apply = async (key: string) => {
    if (key === activePalette || applying) return;
    setApplying(key);
    try {
      await setActivePalette(key);
      setToast({ type: "success", text: `✅ ${t("adminAppearanceTabLabel")}: ${t(PALETTE_CATALOG.find((p) => p.key === key)!.nameKey)}` });
    } catch (e: any) {
      setToast({ type: "info", text: `⚠️ ${e?.message || "Palet uygulanamadı."}` });
    } finally {
      setApplying(null);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2"><Palette size={20} className="text-blue-600" /> {t("adminAppearanceTabLabel")}</h1>
      <p className="text-sm text-gray-500 mb-6">Aktif edilen palet, sitedeki HERKES için anında geçerli olur.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PALETTE_CATALOG.map((p) => {
          const active = p.key === activePalette;
          return (
            <div key={p.key} className={`bg-white border rounded-2xl p-4 shadow-sm transition ${active ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-200"}`}>
              <div className="flex items-center gap-1.5 mb-3">
                {[p.preview.primary, p.preview.secondary, p.preview.accent, p.preview.background, p.preview.text, p.preview.success, p.preview.warning, p.preview.error].map((hex, i) => (
                  <div key={i} className="w-6 h-6 rounded-md border border-black/5 flex-shrink-0" style={{ backgroundColor: hex }} />
                ))}
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">{t(p.nameKey)}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4 min-h-[48px]">{t(p.descKey)}</p>
              <button
                onClick={() => apply(p.key)}
                disabled={active || applying === p.key}
                className={`w-full text-sm font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  active ? "bg-green-50 text-green-700 cursor-default" : "bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60"
                }`}
              >
                {active ? (<><Check size={15} /> Aktif</>) : applying === p.key ? "Uygulanıyor…" : "Kullan"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire it into AppShell**

Add the import (find `import { AdminCareersPanel } from "../components/features/AdminCareersPanel";` and add right after it):

```ts
import { AdminAppearancePanel } from "../components/features/AdminAppearancePanel";
```

Add to `adminNavItems` (find the exact current array literal via `grep -n "const adminNavItems = \[" frontend/src/app/AppShell.tsx`), inserting a new entry — place it right after the `"handbook"` entry, keeping every existing entry unchanged:

```
OLD (ends): ..., { key: "handbook", label: "El Kitabı", icon: BookOpen }];
NEW (ends): ..., { key: "handbook", label: "El Kitabı", icon: BookOpen }, { key: "appearance", label: t("adminAppearanceTabLabel"), icon: Palette }];
```

`Palette` must be imported from `lucide-react` in `AppShell.tsx` — check `grep -n "from \"lucide-react\"" frontend/src/app/AppShell.tsx` first; if `Palette` isn't already in that import list, add it.

Add the render block right after the existing `{adminTab === "careers" && <AdminCareersPanel />}` line:

```tsx
{adminTab === "appearance" && <AdminAppearancePanel />}
```

- [ ] **Step 3: Live verification**

Log into the admin panel (seeded credentials: `admin@fixperto.com` / `Fixperto2026!` via the `#admin` URL hash route, confirmed working in Wave 1's session), navigate to the new "Renk Paletleri" tab, and:
1. Screenshot the tab showing all 6 palette cards with swatches.
2. Click "Kullan" on the `trust` palette, confirm a success toast appears, confirm the card now shows "Aktif" with a green background, and confirm `document.querySelector('[data-palette]').getAttribute('data-palette')` is now `"trust"` (via `browser_evaluate`).
3. Navigate to the public homepage in the SAME session (or reload) and confirm the primary buttons are now the trust-green color, not blue — proving the site-wide application actually works, not just the admin's local state.
4. Switch back to `default` before finishing, so the app is left in its original state unless the user asked otherwise (leave a note in your report either way — do not silently leave a non-default palette active without flagging it).

- [ ] **Step 4: Run the full test suite**

Run: `node tests/run.mjs` from repo root. Expect 0 failures, same total.

- [ ] **Step 5: Typecheck and build**

Run (from `frontend/`): `npx tsc --noEmit` (expect exit 0) and `npm run build` (expect exit 0).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/features/AdminAppearancePanel.tsx frontend/src/app/AppShell.tsx
git commit -m "feat: add admin Renk Paletleri panel, wired to site-wide palette switching"
```

---

### Task 7: Regression test for the palette CSS blocks

**Files:**
- Modify: `tests/design-tokens.test.mjs`

**Interfaces:**
- Consumes: `frontend/src/styles/tokens.css` (already read in this file).

- [ ] **Step 1: Add the extension**

Append to the end of `tests/design-tokens.test.mjs`, before the final `report("design tokens");` call:

```js
// --- PALET BLOKLARI (Wave 2): her yeni paletin hem açık hem karanlık bileşik-seçici bloğu
// var mı, ve 7 değişken token'ı tanımlıyor mu — bkz. docs/superpowers/plans/
// 2026-09-20-palette-system-and-admin-picker.md'deki Palet Değer Tablosu.
const PALETTE_KEYS = ["trust", "industrial", "performance", "european", "minimal"];
const VARYING_TOKENS = ["primary", "primary-hover", "primary-active", "secondary", "accent", "cta", "focus"];
for (const key of PALETTE_KEYS) {
  const lightSelector = `[data-palette="${key}"] {`;
  const darkSelector = `[data-palette="${key}"].dark-scope {`;
  ok(tokens.includes(lightSelector), `tokens.css [data-palette="${key}"] (açık) bloğu var`);
  ok(tokens.includes(darkSelector), `tokens.css [data-palette="${key}"].dark-scope (karanlık, bileşik seçici) bloğu var`);
  const lightBlock = blockBody(tokens, lightSelector);
  const darkBlock2 = blockBody(tokens, darkSelector);
  for (const name of VARYING_TOKENS) {
    ok(lightBlock.includes(`--color-${name}:`), `[data-palette="${key}"] --color-${name} tanımlı`);
    ok(darkBlock2.includes(`--color-${name}:`), `[data-palette="${key}"].dark-scope --color-${name} tanımlı`);
  }
}
```

- [ ] **Step 2: Run it directly**

Run: `node --test tests/design-tokens.test.mjs`. Expect all assertions pass (the count will have grown substantially from 100 — 5 palettes × 2 modes × 7 tokens = 70 new `ok()` calls, plus 10 block-existence checks = 80 new assertions).

- [ ] **Step 3: Run the full suite**

Run: `node tests/run.mjs` from repo root. Expect 0 failures; read the new total.

- [ ] **Step 4: Commit**

```bash
git add tests/design-tokens.test.mjs
git commit -m "test: add regression coverage for the 5 new palette CSS blocks"
```

---

### Task 8: Final full regression + visual sign-off

**Files:** none (verification-only task, like Wave 1's Task 7)

- [ ] **Step 1: Full backend+frontend+e2e suite**

Run: `node tests/run.mjs` from repo root. Record the exact printed summary line.

- [ ] **Step 2: Frontend unit tests, typecheck, build**

Run (from `frontend/`): `npm test`, `npx tsc --noEmit`, `npm run build`. Record exact results.

- [ ] **Step 3: Playwright visual sweep across at least 3 palettes**

For each of `trust`, `performance`, `minimal` (a representative spread — one warm, one dark-mood, one monochrome): use the admin panel to activate it, then screenshot the public homepage (light mode) and, for one of the three, toggle an owner account's dark mode and screenshot that too. Confirm: primary buttons show the palette's color, no leftover default-blue anywhere in primary CTAs, text stays readable. Restore `default` as the active palette when done.

- [ ] **Step 4: Merge readiness note**

This branch (`worktree-palette-system`) is ready to merge into `main` (confirm with the user first, per repo norms) or to serve as the base for Wave 3 (shared Button/Card/Input/Modal primitives + broader component token migration).

---

## Self-Review

**1. Spec coverage:** Covers the user's Phase 4-5 requirements (6 total palettes including the existing default, each with primary/secondary/accent/background/text/success/warning/error previews, a "Kullan"/"Aktif Et" button) and Phase 3 (admin panel "Renk Paletleri" section, site-wide application via backend persistence rather than per-browser). Does NOT cover: migrating existing components' hardcoded `bg-blue-600` etc. to consume the new `bg-primary` Tailwind utilities (that's Wave 3 — this wave's palettes only visibly change anything once components actually reference the semantic token classes, which none do yet outside the admin panel itself and the two focus-ring fixes from the hardening pass). This is a known, deliberate scope boundary — the token/persistence/admin-UI infrastructure is now complete and correct, but the rest of the app's ~4,600 hardcoded color classes still need Wave 3's migration before switching the active palette produces a highly visible site-wide effect beyond the CTA banner's `bg-gray-900`-adjacent `secondary` uses and any future `bg-primary`/`bg-cta` adopters.

**2. Placeholder scan:** No TBD/TODO markers. Every CSS/route/component step has full literal content.

**3. Type consistency:** Token names in Task 1's CSS, Task 7's test, and the `VARYING_TOKENS` list are identical. `PALETTE_CATALOG` keys in Task 4 match the `KNOWN_PALETTES` array in Task 2's backend route and the CSS `[data-palette="x"]` selectors in Task 1, cross-checked against the single Palette Value Table above.
