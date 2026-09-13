/**
 * FONKSİYON ENVANTERİ — arayüz ile sunucu arasındaki BOŞLUKLARI bulur.
 * ---------------------------------------------------------------------------------------------
 * İki yönlü tarama:
 *   1) İstemcinin çağırdığı her yol sunucuda GERÇEKTEN var mı? (yoksa: buton çalışmıyor / 404)
 *   2) Sunucudaki her uç istemcide kullanılıyor mu? (kullanılmıyorsa: ölü kod ya da arayüzden
 *      erişilemeyen bir özellik — ikisi de bilinmeli)
 * Statik tarama; uçtan uca testlerin yerine geçmez, onların göremediği boşluğu gösterir.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (...p) => readFileSync(join(ROOT, ...p), "utf8");

// --- 1) Sunucudaki uçlar -----------------------------------------------------------------------
const server = read("backend", "server.js");
const mounts = [...server.matchAll(/app\.use\("(\/api\/[^"]+)",\s*([A-Za-z]+)/g)].map((m) => ({ base: m[1], router: m[2] }));
const crudMounts = [...server.matchAll(/app\.use\("(\/api\/[^"]+)",\s*makeCrudRouter\("([^"]+)"([\s\S]*?)\}\)\);/g)]
  .map((m) => ({ base: m[1], table: m[2], opts: m[3] }));

const endpoints = [];
for (const { base, table, opts } of crudMounts) {
  for (const sub of ["", "/:id"]) endpoints.push({ path: base + sub, source: `crud(${table})` });
  // NOT: `/:id/verify-password` KALDIRILDI (hız sınırı olmayan şifre kâhiniydi, bkz.
  // makeCrudRouter.js). passwordVerify bayrağı artık yalnızca admin sıfırlama ucunu açıyor.
  if (/passwordVerify: true/.test(opts)) endpoints.push({ path: `${base}/:id/set-password`, source: `crud(${table})` });
  if (/shareCountColumn/.test(opts)) endpoints.push({ path: `${base}/:id/share`, source: `crud(${table})` });
}
// server.js'te doğrudan tanımlı uçlar (router dosyasında değil).
for (const m of server.matchAll(/app\.(get|post|patch|delete)\("(\/api\/[^"]*)"/g)) {
  endpoints.push({ path: m[2], source: "server.js" });
}
const fileToBase = {
  "auth.js": "/api/auth", "admin.js": "/api/admin", "analytics.js": "/api/analytics", "blog.js": "/api/blog",
  "careers.js": "/api/careers", "conversations.js": "/api/conversations", "profileViews.js": "/api/profile-views",
  "shareEvents.js": "/api/share-events", "translate.js": "/api/translate", "vehicleHistory.js": "/api/vehicle-history",
  "listingInteractions.js": "/api/listings", "jobApplications.js": "/api/jobs", "reviews.js": "/api/mechanics",
  "recommendations.js": "/api/recommendations",
};
for (const file of readdirSync(join(ROOT, "backend", "routes")).filter((f) => f.endsWith(".js") && f !== "makeCrudRouter.js")) {
  const base = fileToBase[file];
  if (!base && file !== "quotes.js") continue;
  const src = read("backend", "routes", file);
  if (file === "quotes.js") {
    for (const match of src.matchAll(/(quoteRequestsRouter|quoteOffersRouter)\.(get|post|patch|delete)\("([^"]*)"/g)) {
      const b = match[1] === "quoteRequestsRouter" ? "/api/quote-requests" : "/api/quote-offers";
      endpoints.push({ path: (b + match[3]).replace(/\/$/, "") || b, source: file });
    }
    continue;
  }
  for (const match of src.matchAll(/\w+\.(get|post|patch|delete)\("([^"]*)"/g)) {
    endpoints.push({ path: (base + match[2]).replace(/\/$/, "") || base, source: file });
  }
}

// --- 2) İstemcinin çağırdığı yollar ------------------------------------------------------------
const client = read("frontend", "src", "services", "api", "client.ts");
const calls = [];
/**
 * Genel yardımcıların (crud / withPasswordEndpoints) GÖVDESİ `/api/${resource}/...` biçiminde
 * yazılmış. Bu şablonları ham hâlde toplamak "/api/:id" gibi anlamsız yollar üretir; hepsini
 * her kaynak için açmak ise ters yönde gürültü yapar (crud("vehicles") yorum ucu tanımlamaz,
 * ama withPasswordEndpoints("mechanics") tanımlar). Bu yüzden İKİ yardımcının gövdesini AYRI
 * okuyup, her kaynağı YALNIZCA kendi yardımcısının ürettiği yollarla eşliyoruz.
 */
const bodyBetween = (from, to) => client.slice(client.indexOf(from), client.indexOf(to));
/** `metod: (...) => request(`/api/${resource}/...`)` → [{ method, suffix }] */
const entriesOf = (body) => [...body.matchAll(/(\w+):\s*\([^)]*\)[^=]*=>\s*\n?\s*request\(\s*`\/api\/\$\{resource\}([^`]*)`/g)]
  .map((m) => ({ method: m[1], suffix: m[2] }));
const crudEntries = entriesOf(bodyBetween("function crud<", "function withPasswordEndpoints<"));
// withPasswordEndpoints crud'u yayıyor (...crud<T>(resource)) → kendi yolları + crud yolları.
const pwEntries = [...crudEntries, ...entriesOf(bodyBetween("function withPasswordEndpoints<", "export const api"))];

/**
 * Genel fabrikanın ÜRETTİĞİ bir metodun var olması, uygulamanın onu ÇAĞIRDIĞI anlamına gelmez.
 * Örnek: withPasswordEndpoints("owners") teknik olarak `owners.addReview` üretir ama araç
 * sahiplerine yorum yazılmıyor; sunucuda da böyle bir uç yok. Bunu "buton var, uç yok" diye
 * raporlamak yanlış olur — o yüzden çekirdek CRUD dışındaki metodlar için arayüzde gerçek bir
 * kullanım arıyoruz. (list/get/create/update/remove adları çok genel, onlar hep var sayılır.)
 */
const CORE = new Set(["list", "get", "create", "update", "remove"]);
const uiSource = (function walk(dir) {
  let out = "";
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out += walk(p);
    else if (/\.tsx?$/.test(e.name) && !p.endsWith("client.ts")) out += readFileSync(p, "utf8");
  }
  return out;
})(join(ROOT, "frontend", "src"));
// Arayüzdeki çağrı biçimi her yerde `api.<kaynak>.<metod>(...)`; daha gevşek bir arama
// (yalnızca metod adı) aynı adı taşıyan yerel fonksiyonlara takılıp yanlış eşleşme üretiyordu.
const usedInUi = (resource, method) => CORE.has(method) || uiSource.includes(`api.${resource}.${method}`);

const expand = (resource, entries) => {
  for (const { method, suffix } of entries) if (usedInUi(resource, method)) calls.push(`/api/${resource}${suffix}`);
};
for (const m of client.matchAll(/\bcrud<[^>]*>\("([^"]+)"\)/g)) expand(m[1], crudEntries);
for (const m of client.matchAll(/withPasswordEndpoints<[^>]*>\("([^"]+)"\)/g)) expand(m[1], pwEntries);

// client.ts DIŞINDA kalan ham çağrılar: olay izleme (services/analytics.ts) sendBeacon/fetch
// kullanıyor, api nesnesinden geçmiyor. Sayılmazsa /api/analytics/events yanlışlıkla
// "istemci hiç çağırmıyor" diye raporlanıyordu.
for (const m of uiSource.matchAll(/`\$\{BASE_URL\}(\/api\/[^`]*)`/g)) calls.push(m[1]);

// Doğrudan yazılmış (yardımcı olmayan) çağrılar. Şablon içindeki `${...}` bloğu tırnak
// içerebildiği için ([^`]*) ile backtick'e kadar okuyoruz; `${resource}` olanlar yukarıda açıldı.
for (const m of client.matchAll(/request\(\s*(?:`([^`]*)`|"([^"]*)"|'([^']*)')/g)) {
  const p = m[1] ?? m[2] ?? m[3];
  if (p.startsWith("/api") && !p.includes("${resource}")) calls.push(p);
}

// `/api/x${days ? `?days=${days}` : ""}` gibi İÇ İÇE şablonlarda dış backtick iç backtick'te
// biter; geriye yarım kalan bir `${...` parçası kalır. Tam blokları :id yapıp yarım kalanı atıyoruz.
const norm = (p) => p
  .replace(/\$\{[^}]+\}/g, ":id")
  .replace(/\$\{[\s\S]*$/, "")
  .replace(/\?.*$/, "")
  .replace(/\s+$/, "")
  .replace(/\/$/, "");
const clientPaths = [...new Set(calls.map(norm))];
const serverPaths = [...new Set(endpoints.map((e) => norm(e.path)))];
const matches = (a, b) => new RegExp(`^${b.replace(/:[a-zA-Z]+/g, "[^/]+")}$`).test(a.replace(/:[a-zA-Z]+/g, "X"));

const orphanCalls = clientPaths.filter((c) => !serverPaths.some((s) => matches(c, s)));
const unusedEndpoints = serverPaths.filter((s) => !clientPaths.some((c) => matches(c, s)));

console.log(`Sunucu uçları: ${serverPaths.length}   İstemci yolları: ${clientPaths.length}`);
console.log("\n--- Sunucuda karşılığı OLMAYAN istemci çağrıları (buton var, uç yok) ---");
console.log(orphanCalls.length ? orphanCalls.map((p) => "  ✗ " + p).join("\n") : "  (yok)");
console.log("\n--- İstemcinin ÇAĞIRMADIĞI sunucu uçları ---");
console.log(unusedEndpoints.length ? unusedEndpoints.map((p) => "  · " + p).join("\n") : "  (yok)");

// Testin ANLAMI: "istemcinin bastığı her yolun sunucuda karşılığı var". Bu bozulursa bir buton
// sessizce 404 alıyor demektir — bu yüzden çıkış kodu veriyoruz ki tests/run.mjs yakalasın.
// (Kullanılmayan sunucu uçları bilgi amaçlı; tek başına hata değil.)
if (orphanCalls.length) { console.error("HATA: karşılığı olmayan istemci çağrısı var."); process.exit(1); }
console.log("\nOK envanter (istemci-sunucu eşleşmesi tam)");
