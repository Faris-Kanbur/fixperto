// KARİYER — Fixperto'nun kendi iş ilanları: yetki, taslak/yayın ayrımı, tamirci ilanlarından ayrılık.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, ok, report } from "./_harness.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...p) => readFileSync(join(ROOT, ...p), "utf8");
const route = read("backend/routes/careers.js");

// --- YETKİ: okuma açık, yazma yalnızca yönetici -----------------------------------------------
for (const m of ["post", "patch", "delete"]) {
  const calls = [...route.matchAll(new RegExp(`router\\.${m}\\("([^"]+)",\\s*([A-Za-z]+)`, "g"))];
  ok(calls.length > 0, `${m.toUpperCase()} ucu tanımlı`);
  for (const c of calls) eq(c[2], "requireAdmin", `${m.toUpperCase()} ${c[1]} yönetici korumalı`);
}
ok(/router\.get\("\/admin\/all", requireAdmin/.test(route), "yönetici listesi korumalı");

// --- HERKESE AÇIK UÇ yalnızca YAYINLANMIŞ ilanları döndürmeli ---------------------------------
// Taslak bir ilanın sızması, yarım kalmış bir metnin siteye çıkması demekti.
const publicGet = route.slice(route.indexOf('router.get("/", '), route.indexOf('router.get("/admin/all"'));
ok(/status = 'published'/.test(publicGet), "herkese açık liste yalnızca yayınlananları döndürüyor");
eq(/SELECT \*/.test(publicGet), false, "herkese açık uçta SELECT * yok (alanlar açıkça sayılıyor)");

// --- YENİ İLAN TASLAK DOĞAR -------------------------------------------------------------------
ok(/status: req\.body\?\.status === "published" \? "published" : "draft"/.test(route),
  "yeni ilan varsayılan taslak (yarım ilan kazayla yayına çıkmasın)");

// --- YAZILABİLİR ALANLAR SINIRLI (mass assignment) --------------------------------------------
const writable = route.slice(route.indexOf("const writable = ["), route.indexOf("];", route.indexOf("const writable = [")));
eq(/\bid\b/.test(writable), false, "id yazılabilir alanlarda değil");
eq(/createdAt/.test(writable), false, "createdAt istemciden değiştirilemez");

// --- TAMİRCİ İŞ İLANLARINDAN AYRI ---------------------------------------------------------------
const db = read("backend/db/db.js");
ok(/CREATE TABLE IF NOT EXISTS career_posts/.test(db), "career_posts tablosu var");
ok(/CREATE TABLE IF NOT EXISTS job_listings/.test(db), "tamirci iş ilanları ayrı tabloda");
eq(route.includes("job_listings"), false, "kariyer rotası tamirci ilanları tablosuna dokunmuyor");

// --- SUNUCUYA BAĞLI MI --------------------------------------------------------------------------
const server = read("backend/server.js");
ok(/app\.use\("\/api\/careers", careersRouter\)/.test(server), "rota sunucuya bağlı");

// --- ARAYÜZ ------------------------------------------------------------------------------------
const page = read("frontend/src/components/features/CareersPage.tsx");
ok(/careersNoRolesTitle/.test(page), "açık pozisyon yokken sayfa boş kalmıyor");
ok(/mailto:/.test(page), "başvuru e-posta ile yapılıyor");
const shell = read("frontend/src/app/AppShell.tsx");
ok(/screen === "careers" && <CareersPage \/>/.test(shell), "kariyer ekranı bağlı");
ok(/key: "careers"/.test(shell), "yönetici panelinde Kariyer sekmesi var");
// Yenilemede geri yüklenebilir ekranlar arasında olmalı — herkese açık bir sayfa.
const helpers = read("frontend/src/utils/helpers.ts");
ok(/"careers"/.test(helpers.slice(helpers.indexOf("NAV_PUBLIC_SCREENS"), helpers.indexOf("NAV_AUTH_SCREENS"))),
  "kariyer sayfası sayfa yenilemede korunuyor");

// --- Yönetici çağrıları token'ı KENDİ ekliyor ---------------------------------------------------
// Çağıran her yerde adminAuthOpts() yazmayı unutmak, sessizce 401 alan bir ekran demekti.
const client = read("frontend/src/services/api/client.ts");
const careersApi = client.slice(client.indexOf("  careers: {"), client.indexOf("  careers: {") + 900);
for (const fn of ["adminList", "create", "update", "remove"]) {
  ok(new RegExp(`${fn}[\\s\\S]{0,200}adminAuthOpts\\(\\)`).test(careersApi), `${fn} admin token'ını ekliyor`);
}

report("kariyer");
