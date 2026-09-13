/**
 * SUNUCUDAKİ TÜM UÇLARIN TEK KAYNAKTAN LİSTESİ — metot + yol.
 * ================================================================================================
 * NEDEN AYRI BİR DOSYA: bu liste iki yerde kullanılıyor (envanter taraması ve otomatik güvenlik
 * matrisi). Listeyi elle iki yere yazmak, yeni bir uç eklendiğinde birinde unutulması demekti —
 * ve unutulan uç DENETLENMEYEN uçtur. "Hiçbir fonksiyonu atlama" kuralının teknik karşılığı bu:
 * liste kaynak koddan ÜRETİLİYOR, bir insan listesine güvenilmiyor.
 *
 * Saf bir modül: içe alınırken hiçbir şey yazdırmıyor, çıkmıyor, sunucu başlatmıyor.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (...p) => readFileSync(join(ROOT, ...p), "utf8");

const server = read("backend", "server.js");

/** makeCrudRouter ile kurulan kaynaklar ve seçenekleri (authScope, publicRead, admin-only alanlar). */
export const crudMounts = [...server.matchAll(/app\.use\("(\/api\/[^"]+)",\s*makeCrudRouter\("([^"]+)"([\s\S]*?)\}\)\);/g)]
  .map((m) => ({
    base: m[1],
    table: m[2],
    opts: m[3],
    hasAuthScope: /authScope:/.test(m[3]),
    publicRead: !/publicRead:\s*false/.test(m[3]),
    passwordVerify: /passwordVerify: true/.test(m[3]),
    shareCount: /shareCountColumn/.test(m[3]),
  }));

const ROUTER_FILE_BASE = {
  "auth.js": "/api/auth", "admin.js": "/api/admin", "analytics.js": "/api/analytics", "blog.js": "/api/blog",
  "careers.js": "/api/careers", "conversations.js": "/api/conversations", "profileViews.js": "/api/profile-views",
  "shareEvents.js": "/api/share-events", "translate.js": "/api/translate", "vehicleHistory.js": "/api/vehicle-history",
  "listingInteractions.js": "/api/listings", "jobApplications.js": "/api/jobs", "reviews.js": "/api/mechanics",
  "recommendations.js": "/api/recommendations",
};

/** [{ method, path, source }] — metotlar BÜYÜK harf, yollar ":id" biçiminde parametreli. */
export function allEndpoints() {
  const out = [];
  const push = (method, path, source) => out.push({ method: method.toUpperCase(), path: path.replace(/\/$/, "") || "/", source });

  for (const m of crudMounts) {
    push("GET", m.base, `crud(${m.table})`);
    push("POST", m.base, `crud(${m.table})`);
    push("GET", `${m.base}/:id`, `crud(${m.table})`);
    push("PATCH", `${m.base}/:id`, `crud(${m.table})`);
    push("DELETE", `${m.base}/:id`, `crud(${m.table})`);
    if (m.passwordVerify) push("POST", `${m.base}/:id/set-password`, `crud(${m.table})`);
    if (m.shareCount) push("POST", `${m.base}/:id/share`, `crud(${m.table})`);
  }
  for (const m of server.matchAll(/app\.(get|post|patch|delete)\("(\/api\/[^"]*)"/g)) push(m[1], m[2], "server.js");

  for (const file of readdirSync(join(ROOT, "backend", "routes")).filter((f) => f.endsWith(".js") && f !== "makeCrudRouter.js")) {
    const src = read("backend", "routes", file);
    if (file === "quotes.js") {
      for (const m of src.matchAll(/(quoteRequestsRouter|quoteOffersRouter)\.(get|post|patch|delete)\("([^"]*)"/g)) {
        const base = m[1] === "quoteRequestsRouter" ? "/api/quote-requests" : "/api/quote-offers";
        push(m[2], base + m[3], file);
      }
      continue;
    }
    const base = ROUTER_FILE_BASE[file];
    if (!base) continue;
    for (const m of src.matchAll(/\w+\.(get|post|patch|delete)\("([^"]*)"/g)) push(m[1], base + m[2], file);
  }
  // Aynı metot+yol iki kez çıkabilir (ör. hem server.js hem router); tekilleştir.
  const seen = new Set();
  return out.filter((e) => {
    const key = `${e.method} ${e.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Envanter taramasının kullandığı yalın yol listesi (metotsuz, tekil). */
export function endpointPaths() {
  return [...new Set(allEndpoints().map((e) => e.path))];
}
