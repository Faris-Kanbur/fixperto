// GÜVENLİK — site geneli denetimde bulunan açıkların kapalı kaldığını doğrular.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, ok, report } from "./_harness.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...p) => readFileSync(join(ROOT, ...p), "utf8");

// --- safeHref: kullanıcı adresleri href'e girmeden önce denetlenmeli -------------------------
// AÇIK: ilan sahibinin girdiği "ekspertiz raporu linki" ve iş başvurusundaki CV bağlantısı
// doğrudan <a href> içine konuyordu. `javascript:` şemasıyla, o linke tıklayan HER ziyaretçinin
// tarayıcısında kod çalıştırılabilir ve oturum token'ı çalınabilirdi (depolanmış XSS).
const SAFE_SCHEMES = ["http:", "https:", "mailto:", "tel:"];
const SAFE_DATA = ["data:application/pdf", "data:image/png", "data:image/jpeg", "data:image/jpg", "data:image/webp", "data:image/gif"];
const safeHref = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.startsWith("data:")) return SAFE_DATA.some((p) => lower.startsWith(p)) ? raw : null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
    return SAFE_SCHEMES.includes(url.protocol) ? url.href : null;
  } catch { return null; }
};
eq(safeHref("javascript:alert(1)"), null, "javascript: şeması reddediliyor");
eq(safeHref("JaVaScRiPt:alert(1)"), null, "büyük/küçük harfle gizlenmiş javascript: de reddediliyor");
eq(safeHref("  javascript:alert(1)  "), null, "baştaki boşlukla kaçamıyor");
eq(safeHref("data:text/html,<script>alert(1)</script>"), null, "data:text/html reddediliyor");
eq(safeHref("vbscript:msgbox(1)"), null, "bilinmeyen şema varsayılan olarak reddediliyor (beyaz liste)");
eq(safeHref("file:///etc/passwd"), null, "file: reddediliyor");
ok(safeHref("https://ornek.com/rapor.pdf")?.startsWith("https://"), "https geçerli");
ok(safeHref("ornek.com/rapor.pdf")?.startsWith("https://"), "şemasız adres https'e tamamlanıyor");
ok(safeHref("data:application/pdf;base64,AAAA")?.startsWith("data:application/pdf"), "CV için pdf data URI geçerli");
eq(safeHref(""), null, "boş adres yok");
eq(safeHref(null), null, "null çökmüyor");

// Kaynak kodda kullanıcı adresi doğrudan href'e girmemeli.
for (const [file, label] of [["frontend/src/app/AppShell.tsx", "AppShell"], ["frontend/src/components/features/ListingDetailPage.tsx", "İlan sayfası"]]) {
  const src = read(file);
  eq(/href=\{(selectedListing\.inspectionReportUrl|l\.inspectionReportUrl|a\.cvUrl)\}/.test(src), false,
    `${label}: kullanıcı adresi denetimsiz href'e girmiyor`);
}

// --- Backend güvenlik başlıkları -------------------------------------------------------------
const server = read("backend/server.js");
for (const h of ["X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy"]) {
  ok(server.includes(h), `güvenlik başlığı var: ${h}`);
}
ok(/app\.disable\("x-powered-by"\)/.test(server), "x-powered-by kapalı");

// --- Oturum token'ı düz metin saklanmıyor ------------------------------------------------------
const auth = read("backend/utils/auth.js");
ok(/createHash\("sha256"\)/.test(auth), "oturum token'ları özet olarak saklanıyor");
eq(/INSERT OR REPLACE INTO sessions \(tokenHash/.test(auth), true, "tabloya token değil tokenHash yazılıyor");

// --- CORS her origine açık olmamalı -----------------------------------------------------------
eq(/app\.use\(cors\(\)\)/.test(server), false, "cors() parametresiz (herkese açık) kullanılmıyor");

// --- Yönetici uçları korumasız kalmamalı ------------------------------------------------------
const blog = read("backend/routes/blog.js");
for (const m of ["post", "patch", "delete"]) {
  const calls = [...blog.matchAll(new RegExp(`router\\.${m}\\("([^"]+)",\\s*([A-Za-z]+)`, "g"))];
  for (const c of calls) eq(c[2], "requireAdmin", `blog ${m.toUpperCase()} ${c[1]} admin korumalı`);
}

// --- dangerouslySetInnerHTML hiçbir yerde kullanılmamalı --------------------------------------
const walk = (d) => readdirSync(d).flatMap((f) => {
  const p = join(d, f);
  return statSync(p).isDirectory() ? walk(p) : (/\.(tsx|ts)$/.test(f) ? [p] : []);
});
const dangerous = walk(join(ROOT, "frontend", "src"))
  .filter((p) => /dangerouslySetInnerHTML=/.test(readFileSync(p, "utf8")));
eq(dangerous, [], "dangerouslySetInnerHTML kullanılmıyor");

// --- KİTLESEL ATAMA (MASS ASSIGNMENT): korumalı sütunlar --------------------------------------
// AÇIK (bu denetimde bulundu): PATCH gövdesindeki HER alan doğrudan UPDATE'e yazılıyordu.
// Sahiplik kontrolü "bu satır senin mi" diyordu ama "bu SÜTUNU değiştirebilir misin" diye kimse
// sormuyordu. Sonuç: bir tamirci kendi satırına verified:1 yazıp "doğrulanmış" rozetiyle
// görünebiliyor, askıya alınmış bir kullanıcı status:"active" yazıp askıyı kaldırabiliyordu.
const crudSrc = read("backend", "routes", "makeCrudRouter.js");
ok(/const ADMIN_ONLY_FIELDS = \{/.test(crudSrc), "korumalı sütun listesi var");
for (const f of ["verified", "status", "shareCount", "vehicleCount", "apptCount"]) {
  ok(new RegExp(`"${f}"`).test(crudSrc.slice(crudSrc.indexOf("ADMIN_ONLY_FIELDS"), crudSrc.indexOf("// Tablonun GERÇEK sütunları"))), `${f} korumalı`);
}
ok(/sanitizeBody\(dehydrate\(table, req\.body\), actor, "create"\)/.test(crudSrc), "POST gövdesi süzülüyor");
ok(/const body = sanitizeBody\(rawBody, actorForBody\);/.test(crudSrc), "PATCH gövdesi süzülüyor");
// Süzme yetki kontrolünden ÖNCE olmalı: sharedWrite yolu korumalı alanı içeri sızdırmasın.
const patchIdx = crudSrc.indexOf('router.patch("/:id"');
const sanitizeIdx = crudSrc.indexOf("sanitizeBody(rawBody", patchIdx);
const authIdx = crudSrc.indexOf("Bu kaydı değiştirme yetkiniz yok", patchIdx);
ok(sanitizeIdx > 0 && sanitizeIdx < authIdx, "korumalı sütunlar yetki kontrolünden önce düşürülüyor");
ok(/PRAGMA table_info/.test(crudSrc), "bilinmeyen sütunlar SQL'e ulaşmadan eleniyor");

// Süzme mantığını GERÇEKTEN çalıştır: yorum değil davranış denetleniyor.
const sanitize = (table, body, role) => {
  const ADMIN_ONLY = { mechanics: ["verified", "verificationDocs", "shareCount", "avgResponseMinutes", "distance"], owners: ["status", "vehicleCount", "apptCount"] };
  const columns = { mechanics: new Set(["id", "name", "verified", "rating", "price"]), owners: new Set(["id", "name", "status"]) };
  const adminOnly = new Set(ADMIN_ONLY[table] || []);
  const out = { ...body };
  for (const k of Object.keys(out)) {
    if (!columns[table].has(k)) { delete out[k]; continue; }
    if (adminOnly.has(k) && role !== "admin") delete out[k];
  }
  return out;
};
eq(sanitize("mechanics", { name: "Ali", verified: 1 }, "mechanic"), { name: "Ali" }, "tamirci kendine doğrulama rozeti veremiyor");
eq(sanitize("mechanics", { name: "Ali", verified: 1 }, "admin"), { name: "Ali", verified: 1 }, "admin rozeti verebiliyor");
eq(sanitize("owners", { name: "Ayşe", status: "active" }, "owner"), { name: "Ayşe" }, "askıya alınan kullanıcı kendini aktifleştiremiyor");
eq(sanitize("mechanics", { name: "Ali", bilinmeyen: 1, __proto__: 1 }, "mechanic"), { name: "Ali" }, "bilinmeyen sütunlar eleniyor");

// --- SOHBET: mesaj sahteciliği ve kayıp güncelleme --------------------------------------------
// AÇIK (bu denetimde bulundu): PATCH `messages` dizisinin TAMAMINI istemciden alıyordu. Bir taraf
// karşı tarafın ağzından mesaj yazabiliyor ("tamirci: ücretsiz yapacağım"), üstelik dizi topluca
// ezildiği için karşı tarafın aynı anda gönderdiği mesaj sessizce siliniyordu.
const convoSrc = read("backend", "routes", "conversations.js");
ok(/conversationsRouter\.post\("\/:id\/messages"/.test(convoSrc), "mesaj ekleme ayrı uç noktada");
ok(/sender: actor\.role,\s*\/\/ <- oturumdan/.test(convoSrc), "gönderen oturumdan damgalanıyor");
ok(/lang: senderLang/.test(convoSrc), "mesaj dili sunucudaki kayıttan geliyor");
ok(/const merged = \[\.\.\.existing, \.\.\.stamped\];/.test(convoSrc), "ekleme sunucudaki güncel dizinin sonuna yapılıyor");
ok(/Mesajlar yalnızca mesaj gönderme uç noktasıyla eklenebilir/.test(convoSrc), "PATCH ile mesaj dizisi yazılamıyor");
ok(/actor\.role !== "owner" && actor\.role !== "mechanic"/.test(convoSrc), "admin sohbetin tarafı gibi yazamıyor");
ok(/stampedInitial/.test(convoSrc), "sohbet açılırken de gönderen damgalanıyor");
// Frontend artık dizi ezen PATCH kullanmamalı.
const providerSec = read("frontend", "src", "app", "state", "AppLogicProvider.tsx");
eq(/conversations\.update\([^)]*messages/.test(providerSec), false, "istemci mesaj dizisini topluca göndermiyor");
ok(/conversations\.appendMessages\(/.test(providerSec), "istemci mesaj ekleme uç noktasını kullanıyor");

// --- HIZ SINIRI: sayaç sonsuza kadar birikmemeli ----------------------------------------------
// GERÇEK HATA: çeviri sınırı ömür boyu sayıyordu; uzun bir oturumda sıradan kullanıcı 120 isteği
// aşınca çeviri 10 dakika boyunca sessizce ölüyordu.
// Sınırlayıcı utils/rateLimiter.js'e taşındı (veritabanına bağlı olmadığı için her ortamda
// test edilebilsin diye); kurallar aynı, dosya değişti.
const authSrc = read("backend", "utils", "rateLimiter.js");
ok(/windowMs = null/.test(authSrc), "kayan pencere desteği var");
ok(/if \(windowMs && entry\.last && Date\.now\(\) - entry\.last > windowMs\) entry\.count = 0;/.test(authSrc), "pencere dışında sayaç sıfırlanıyor");
const translateSrc = read("backend", "routes", "translate.js");
ok(/windowMs: 5 \* 60 \* 1000/.test(translateSrc), "çeviri sınırı kayan pencere kullanıyor");
// Önbellekten karşılanan istek sayaca yazılmamalı.
const singleHandler = translateSrc.slice(translateSrc.indexOf('router.post("/", async'));
const cacheReturnIdx = singleHandler.indexOf("cached: true");
const registerIdx = singleHandler.indexOf("translateLimiter.registerFailure");
ok(cacheReturnIdx > 0 && registerIdx > cacheReturnIdx, "sayaç yalnızca dış servise giden istekleri sayıyor");

// --- KİMLİKSİZ SINIRSIZ YAZMA: analitik uç noktaları -------------------------------------------
// AÇIK: profil görüntülenme ve paylaşım kayıtları kimliksiz ve sınırsız yazılabiliyordu — sayaçlar
// bir betikle şişirilebilir, tablo sınırsız büyütülebilirdi.
for (const [file, name] of [["profileViews.js", "profil görüntülenme"], ["shareEvents.js", "paylaşım"]]) {
  const src = read("backend", "routes", file);
  ok(/const writeLimiter = makeRateLimiter\(\{ maxAttempts: 120, lockoutMs: 5 \* 60 \* 1000, windowMs: 60 \* 1000 \}\)/.test(src), `${name}: dakikalık tavan var`);
  const posts = [...src.matchAll(/router\.post\("([^"]+)",\s*([A-Za-z]+)/g)];
  ok(posts.length > 0, `${name}: POST uçları bulundu`);
  for (const m of posts) eq(m[2], "limitWrites", `${name}: POST ${m[1]} hız sınırlı`);
}

/**
 * --- TEK İSTEK TÜM SUNUCUYU DÜŞÜREMEZ ----------------------------------------------------------
 * BULUNAN AÇIK (otomatik güvenlik matrisi): Express 4, `async` bir rota işleyicisinin reddedilen
 * sözünü yakalamaz — hata Express'in hata ara katmanına hiç ulaşmaz, Node'un unhandledRejection
 * yoluna düşer ve Node 22 varsayılanında SÜREÇ SONLANIR. "Hesabımı sil" akışındaki bir veritabanı
 * kısıt hatası tam olarak bunu yaptı: backend komple kapandı. Yani giriş yapmış herhangi bir
 * kullanıcı, kendi hesabını silmeye çalışarak siteyi HERKES için düşürebiliyordu.
 *
 * Bu blok, düzeltmenin geri alınmasını engelliyor: yeni bir async işleyici sarmalanmadan eklenirse
 * test düşer. Sarmalayıcıyı hatırlamak bir insana bırakılamaz.
 */
const routeFiles = readdirSync(join(ROOT, "backend", "routes")).filter((f) => f.endsWith(".js"));
const unwrapped = [];
for (const f of routeFiles) {
  const src = read("backend", "routes", f);
  for (const m of src.matchAll(/\w+\.(?:get|post|patch|delete)\("([^"]*)"[^\n]*?(async \(req, res\))/g)) {
    const line = m[0];
    if (!line.includes("asyncRoute(")) unwrapped.push(`${f} ${m[1]}`);
  }
}
eq(unwrapped, [], "her async rota işleyicisi asyncRoute ile sarmalanmış (sarmasız olan süreci öldürür)");
ok(/Promise\.resolve\(handler\(req, res, next\)\)\.catch\(next\)/.test(read("backend", "utils", "asyncRoute.js")),
  "sarmalayıcı reddi Express'in hata katmanına veriyor");
// Son savunma: gözden kaçan bir hata bile süreci kapatmamalı.
const serverSrc = read("backend", "server.js");
ok(/process\.on\("unhandledRejection"/.test(serverSrc), "yakalanmayan söz reddi süreci kapatmıyor");
ok(/process\.on\("uncaughtException"/.test(serverSrc), "yakalanmayan istisna süreci kapatmıyor");
ok(/console\.error\("YAKALANMAYAN/.test(serverSrc), "hata gizlenmiyor, sunucu günlüğüne yazılıyor");

/**
 * --- HESAP SİLME: BAĞLAR KOPARILMADAN SİLİNEMEZ ------------------------------------------------
 * appointments/quote_requests/conversations owners(id)'ye yabancı anahtarla bağlı. Kayıtlar
 * bilerek silinmiyor (karşı tarafın işletme geçmişi) — ama bağ koparılmazsa silme hiç çalışmaz.
 * Ayrıca kişisel öneri profili de gitmeli: ana kaydı silip türetilmiş profili saklamak, silme
 * talebini teknik bir kurnazlıkla boşa çıkarmak olurdu.
 */
const authSrc2 = read("backend", "routes", "auth.js");
const deleteBlock = authSrc2.slice(authSrc2.indexOf('authRouter.post("/delete-account"'), authSrc2.indexOf('authRouter.get("/me"'));
ok(/UPDATE appointments SET customer = \?, ownerId = NULL/.test(deleteBlock), "randevu bağı koparılıyor (kayıt kalıyor, kişi çıkıyor)");
ok(/UPDATE quote_requests SET ownerId = NULL/.test(deleteBlock), "teklif talebi bağı koparılıyor");
ok(/DELETE FROM taste_signals WHERE userId = \? AND role = \?/.test(deleteBlock), "kişisel öneri profili siliniyor");
ok(/UPDATE listings SET status = 'removed' WHERE sellerId = \? AND \(sellerType IS NULL OR sellerType = 'owner'\)/.test(deleteBlock),
  "araç sahibinin ilanları yayından kalkıyor (sahipsiz ilan kalmıyor)");
ok(/recomputeMechanicReviews\(mechanicId\)/.test(deleteBlock),
  "yorum ÖNBELLEĞİ de tazeleniyor (yoksa silinen kullanıcının adı profilde kalırdı)");

/**
 * --- TARAYICI TARAFI: XSS HAVUZLARI, ADRESLER VE CSP -------------------------------------------
 * Oturum jetonu localStorage'da tutuluyor. Bu, sayfa yenilemesinde oturumun sürmesi için pratik
 * bir seçim ama bedeli şu: sayfaya SCRIPT sokabilen biri jetonu okuyup hesabı devralır. Yani
 * XSS burada "çirkin bir açık" değil, doğrudan HESAP DEVRİ demek. Bu blok üç katmanı da kontrol
 * ediyor: tehlikeli havuz yok, kullanıcı adresleri süzülüyor, ve derlenmiş çıktıda CSP var.
 */
const uiFiles = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) walk(full);
    // El kitabı ve sözlük SALT METİN: içerikleri ekrana basılan açıklamalar. "document.write
    // kullanmıyoruz" diye yazan bir cümle, tehlikeli havuz taramasında KULLANIM sayılıyordu —
    // yani kuralın gerekçesi kuralı düşürüyordu. Bu iki dosya taramanın dışında; ikisi de
    // çalıştırılabilir arayüz kodu değil.
    else if (/\.tsx?$/.test(e.name) && !/[/\\]data[/\\](handbook|i18n)\.ts$/.test(full)) uiFiles.push(full);
  }
})(join(ROOT, "frontend", "src"));
/**
 * Yorumlar AYIKLANIYOR: bu blokların çoğu "şunu neden kullanmıyoruz" diye açıklama içeriyor ve
 * ham metinde arama yapmak o açıklamaları "kullanım" sayıyordu. Bir kuralı, kuralın kendi
 * gerekçesiyle düşüren test yanlış alarmdır ve zamanla görmezden gelinir.
 */
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
const uiSrc = stripComments(uiFiles.map((f) => readFileSync(f, "utf8")).join("\n"));

// 1) Tehlikeli havuzlar: bunlar olmadan XSS için önce başka bir hata gerekir.
for (const [pattern, name] of [
  [/dangerouslySetInnerHTML\s*=/, "dangerouslySetInnerHTML"],
  [/\.innerHTML\s*=/, "innerHTML ataması"],
  [/insertAdjacentHTML/, "insertAdjacentHTML"],
  [/\beval\s*\(/, "eval()"],
  [/new Function\s*\(/, "new Function()"],
  [/document\.write/, "document.write"],
]) {
  eq(pattern.test(uiSrc), false, `arayüzde ${name} kullanılmıyor`);
}

// 2) Kullanıcının girdiği her adres süzgeçten geçmeli. `javascript:` bir href'e girerse tıklama
//    doğrudan script çalıştırır — ve o script localStorage'daki jetonu okur.
const helpersSrc = read("frontend", "src", "utils", "helpers.ts");
ok(/export function safeHref/.test(helpersSrc), "adres süzgeci (safeHref) var");
ok(/SAFE_LINK_SCHEMES = \["http:", "https:", "mailto:", "tel:"\]/.test(helpersSrc), "yalnızca zararsız şemalar geçiyor");
eq(/SAFE_DATA_PREFIXES[^\n]*text\/html/.test(helpersSrc), false, "data:text/html ASLA izinli değil");
// Kullanıcı verisinden gelen her href safeHref'ten geçmeli; sabit ve şablon (tel:/mailto:) hariç.
const rawHrefs = [...uiSrc.matchAll(/href=\{([^}]+)\}/g)].map((m) => m[1].trim())
  .filter((expr) => !/^["'`]/.test(expr) && !/^`(tel|mailto):/.test(expr) && !/safeHref\(/.test(expr));
// Kalanlar uygulamanın KENDİ ürettiği adresler (paylaşım bağlantısı, yol tarifi) — kullanıcı metni değil.
// Uygulamanın KENDİ ürettiği, şeması sabit adresler (paylaşım bağlantısı, harita yol tarifi)
// kullanıcı metni değil; onları safeHref'e sokmak da bir şey kazandırmaz.
const APP_BUILT = /^(href\b|mechanicDirectionsUrl\b|selectedMechanic\.lat)/;
eq(rawHrefs.filter((e) => !APP_BUILT.test(e)), [], "kullanıcıdan gelen tüm adresler safeHref'ten geçiyor");

// 3) Yeni sekmede açılan bağlantılar: rel olmadan açılan sekme, açan sayfayı yönlendirebilir.
// Etiket bazlı kontrol: `rel` başka bir SATIRDA olabiliyor, o yüzden <a ...> bloğunun tamamına
// bakıyoruz. Satır bazlı arama burada yanlış alarm veriyordu.
const anchorsWithBlank = [...uiSrc.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)].map((m) => m[0]);
const missingRel = anchorsWithBlank.filter((tag) => !/rel="[^"]*(noreferrer|noopener)/.test(tag));
eq(missingRel.map((t) => t.slice(0, 60)), [], "her yeni sekme bağlantısında rel var (ters sekme kaçırma kapalı)");
ok(anchorsWithBlank.length > 0, `yeni sekme bağlantıları taranıyor (${anchorsWithBlank.length})`);

// 4) CSP: derlenmiş çıktıya ekleniyor, geliştirme sunucusuna EKLENMİYOR (Vite satır içi script
//    enjekte ediyor; oraya da uygularsak npm run dev çalışmaz ve önlem ilk gün kapatılır).
const viteCfg = read("frontend", "vite.config.js");
ok(/Content-Security-Policy/.test(viteCfg), "üretim derlemesine CSP ekleniyor");
ok(/apply: "build"/.test(viteCfg), "CSP yalnızca derlemede (geliştirme sunucusu bozulmuyor)");
for (const directive of ["script-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'"]) {
  ok(viteCfg.includes(directive), `CSP: ${directive}`);
}
// frame-ancestors meta etiketinde YOK SAYILIR — oraya yazmak yanlış güven verirdi.
const cspBlock = viteCfg.slice(viteCfg.indexOf("const CSP = ["), viteCfg.indexOf("].join(\"; \")"));
eq(/frame-ancestors/.test(cspBlock), false, "frame-ancestors CSP'ye yazılmamış (meta etiketinde tarayıcı yok sayar)");

// 5) CORS reddi bir HATA değil: 500 dönmek hem yanlış cevap hem bedava günlük şişirme yoludur.
const serverCors = read("backend", "server.js");
eq(/callback\(new Error\("CORS/.test(serverCors), false, "izinsiz origin için hata FIRLATILMIYOR");
ok(/callback\(null, isAllowedOrigin\(origin\)\)/.test(serverCors), "izinsiz origin sessizce başlıksız bırakılıyor");

report("güvenlik");
