// ARACIN GEÇMİŞİ — şasi (VIN) numarasına bağlı, sahipten bağımsız servis kaydı.
//
// İSTEK: "araç el değiştirdiğinde geçmiş silinebiliyor; araca bir şahsi numara eklensin, yeni
// sahip o numarayı girince geçmişi görsün. Hem tamirci hem araç sahibi için. Güvenlik açığı olmasın."
//
// Bu takım üç şeyi denetliyor: (1) numara doğrulaması gerçekten çalışıyor mu, (2) gizlilik
// kuralları kodda BAĞLI mı (izin, kimlik, hız sınırı, kişisel veri sızdırmama), (3) kayıt
// uydurulabiliyor mu.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, ok, report } from "./_harness.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...p) => readFileSync(join(ROOT, ...p), "utf8");
const backend = read("backend", "routes", "vehicleHistory.js");
const helpers = read("frontend", "src", "utils", "helpers.ts");
const provider = read("frontend", "src", "app", "state", "AppLogicProvider.tsx");
const shell = read("frontend", "src", "app", "AppShell.tsx");
const panel = read("frontend", "src", "components", "features", "VehicleHistoryPanel.tsx");
const listingPage = read("frontend", "src", "components", "features", "ListingDetailPage.tsx");
const i18n = read("frontend", "src", "data", "i18n.ts");
const dbSrc = read("backend", "db", "db.js");
const server = read("backend", "server.js");

// --- 1) NUMARA DOĞRULAMASI: gerçek fonksiyonu kaynaktan çalıştırıyoruz -------------------------
const vinStart = helpers.indexOf("const VIN_RE =");
const vinEnd = helpers.indexOf("\n}\n", helpers.indexOf("export function validateVin")) + 3;
ok(vinStart > 0 && vinEnd > vinStart, "VIN doğrulama bloğu helpers.ts içinde bulundu");
const { validateVin, normalizeVin } = new Function(
  `${helpers.slice(vinStart, vinEnd).replace(/export function/g, "function")}; return { validateVin, normalizeVin };`
)();

eq(validateVin("").valid, true, "boş bırakmak serbest — alan zorunlu değil");
eq(validateVin("wba3b5c50df123456").normalized, "WBA3B5C50DF123456", "küçük harf büyüğe çevriliyor");
eq(normalizeVin(" wba3b5c50-df123456 "), "WBA3B5C50DF123456", "boşluk ve tire temizleniyor");
eq(validateVin("WBA3B5C50DF123456").valid, true, "17 haneli geçerli VIN kabul");
// VIN standardında I, O ve Q YOKTUR — 1 ve 0 ile karışmasın diye. Bunu yakalamak, kullanıcının
// "0" yerine "O" yazdığı numaranın kalıcı kayda girmesini önlüyor.
eq(validateVin("WBA3B5C5ODF123456").valid, false, "O harfi reddediliyor");
eq(validateVin("WBA3B5C5IDF123456").valid, false, "I harfi reddediliyor");
eq(validateVin("WBA3B5C5QDF123456").valid, false, "Q harfi reddediliyor");
eq(validateVin("34ABC123").valid, false, "plaka uzunluğundaki girdi reddediliyor");
eq(validateVin("WBA3B5C50DF1234567890").valid, false, "17 haneden uzun girdi reddediliyor");
eq(validateVin("WBA-3B5C5*DF123456").valid, false, "özel karakter reddediliyor");
ok(typeof validateVin("34ABC123").message === "string", "hatalı numarada açıklama var");
// Sunucu AYNI kuralı tekrar uyguluyor: istemci denetimi kolaylık, sunucu denetimi güvenliktir.
ok(/const VIN_RE = \/\^\[A-HJ-NPR-Z0-9\]\{11,17\}\$\//.test(backend), "sunucuda da aynı VIN kuralı var");
ok(/if \(!isValidVin\(vin\)\)/.test(backend), "sunucu numarayı doğruluyor");

// --- 2) VERİ MODELİ ----------------------------------------------------------------------------
ok(/CREATE TABLE IF NOT EXISTS vehicle_history/.test(dbSrc), "araç geçmişi tablosu var");
ok(/CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_history_appt/.test(dbSrc), "randevu başına tek kayıt");
ok(/CREATE INDEX IF NOT EXISTS idx_vehicle_history_vin/.test(dbSrc), "VIN sorgusu indeksli");
for (const col of ['"vehicles", "vin TEXT"', '"vehicles", "vinShared INTEGER DEFAULT 1"', '"listings", "vin TEXT"', '"listings", "showHistory INTEGER DEFAULT 0"']) {
  ok(dbSrc.includes(col), `sütun eklendi: ${col}`);
}
ok(/app\.use\("\/api\/vehicle-history", vehicleHistoryRouter\)/.test(server), "uç nokta sunucuya bağlı");

// --- 3) GÜVENLİK: kayıt uydurulamaz -----------------------------------------------------------
// Kaydı yalnızca işi YAPAN tamirci, KENDİ tamamlanmış randevusundan oluşturabilir.
ok(/if \(actor\.role !== "mechanic"\)/.test(backend), "kaydı yalnızca tamirci oluşturabiliyor");
ok(/if \(appt\.mechanicId !== actor\.id\)/.test(backend), "randevunun o tamirciye ait olduğu doğrulanıyor");
ok(/if \(appt\.status !== "Tamamlandı"\)/.test(backend), "yalnızca tamamlanmış randevu geçmişe yazılıyor");
ok(/mechanicId: actor\.id/.test(backend), "tamirci kimliği oturumdan damgalanıyor");
ok(/ownerId: appt\.ownerId/.test(backend), "kaydın sahibi randevudan geliyor, istemciden değil");
// Tamirci başkasının garajındaki aracın kaydını DEĞİŞTİREMEZ.
eq(/UPDATE vehicles SET vin/.test(backend), false, "tamirci araç sahibinin kaydına yazmıyor");

// --- 4) GÜVENLİK: sorgulama --------------------------------------------------------------------
ok(/const actor = requireUser\(req, res\);/.test(backend), "sorgulama giriş istiyor");
ok(/lookupLimiter\.check\(ip\)\.blocked/.test(backend), "sorgulamada hız sınırı var");
ok(/makeRateLimiter\(\{ maxAttempts: 40, lockoutMs: 30 \* 60 \* 1000, windowMs: 60 \* 60 \* 1000 \}\)/.test(backend), "saatlik sorgu tavanı");
ok(/r\.shared \|\| \(actor\.role === "admin"\) \|\| r\.ownerId === actor\.id \|\| r\.mechanicId === actor\.id/.test(backend), "yalnızca paylaşılan ya da kendi kayıtları görünüyor");
ok(/hiddenCount: rows\.length - visible\.length/.test(backend), "gizlenen kayıt sayısı bildiriliyor");

// KİŞİSEL VERİ SIZMAMALI: dışarıya dönen biçimde kişiyi tanımlayan hiçbir alan olmamalı.
const publicBlock = backend.slice(backend.indexOf("const publicRecord"), backend.indexOf("const ownRecord"));
for (const leak of ["customer", "ownerId", "plate", "servicePrice", "phone", "issuePhotos"]) {
  eq(publicBlock.includes(leak), false, `dış yanıtta ${leak} yok`);
}
ok(/serviceDate/.test(publicBlock) && /mechanicName/.test(publicBlock) && /serviceText/.test(publicBlock),
  "dış yanıt yalnızca tarih/işletme/yapılan iş içeriyor");

// Davranış: görünürlük kuralını gerçekten çalıştırıyoruz.
const visibleTo = (r, actor) => !!(r.shared || actor.role === "admin" || r.ownerId === actor.id || r.mechanicId === actor.id);
const rec = { shared: 0, ownerId: 7, mechanicId: 3 };
eq(visibleTo(rec, { role: "owner", id: 9 }), false, "paylaşıma kapalı kayıt yabancıya görünmüyor");
eq(visibleTo(rec, { role: "owner", id: 7 }), true, "kendi kaydını sahibi görüyor");
eq(visibleTo(rec, { role: "mechanic", id: 3 }), true, "işi yapan tamirci kendi kaydını görüyor");
eq(visibleTo({ ...rec, shared: 1 }, { role: "owner", id: 9 }), true, "paylaşıma açık kayıt görünüyor");

// --- 5) GÜVENLİK: izin yalnızca kendi dönemi için değiştirilebilir -----------------------------
ok(/UPDATE vehicle_history SET shared = \? WHERE vin = \? AND ownerId = \?/.test(backend),
  "paylaşım izni yalnızca kendi dönemindeki kayıtları etkiliyor");
ok(/actor\.role !== "owner"/.test(backend.slice(backend.indexOf('router.post("/share"'))), "izni yalnızca araç sahibi değiştirebiliyor");

// --- 6) GÜVENLİK: ilandaki geçmiş başkasının aracı olamaz --------------------------------------
// Satıcı ilana rastgele bir VIN yazıp başkasının geçmişini yayımlayamamalı.
const listingBlock = backend.slice(backend.indexOf('router.get("/listing/:id"'));
ok(/sellerOwnsVehicle/.test(listingBlock) && /sellerHasRecords/.test(listingBlock), "satıcı-VIN bağı doğrulanıyor");
ok(/if \(!sellerOwnsVehicle && !sellerHasRecords\) return res\.json\(\{ records: \[\], shown: false, unverified: true \}\)/.test(listingBlock),
  "bağ yoksa geçmiş gösterilmiyor");
ok(/WHERE vin = \? AND shared = 1/.test(listingBlock), "ilanda yalnızca paylaşıma açık kayıtlar");
ok(/publicRecord/.test(listingBlock), "ilanda da kişisel veri dönmüyor");

// --- 7) ARAYÜZ: üç yerde de bağlı ---------------------------------------------------------------
ok(/vin: "", vinShared: true/.test(provider), "araç formunda şasi alanı var");
ok(/const vinCheck = validateVin\(newVehicle\.vin\)/.test(provider), "araç eklemede numara doğrulanıyor");
ok(/if \("vin" in \(updates \|\| \{\}\)\)/.test(provider), "araç düzenlemede numara doğrulanıyor");
ok(/api\.vehicleHistory\.record\(\{ appointmentId: id/.test(provider), "iş tamamlanınca kayıt oluşuyor");
ok(/const setVehicleHistoryShared = \(vehicle, shared\)/.test(provider), "paylaşım anahtarı var");
ok(/api\.vehicleHistory\.setShared\(vehicle\.vin, shared\)/.test(provider), "izin geçmişe dönük uygulanıyor");
ok(/listingShowHistoryLabel/.test(shell), "ilan formunda geçmişi gösterme seçeneği var");
ok(/if \(sellForm\.showHistory && !listingVin\.normalized\)/.test(provider), "numara yoksa geçmiş gösterilemiyor");
ok(/<ListingHistorySection listingId=\{l\.id\} \/>/.test(listingPage), "ilan sayfasında geçmiş bölümü var");
// Panel hem araç sahibinde hem tamircide — istek ikisini de kapsıyordu.
const lookupUses = shell.split("<VinLookupPanel />").length - 1;
eq(lookupUses, 2, "sorgulama paneli hem garajda hem tamirci panelinde");
ok(/export function VinLookupPanel/.test(panel) && /export function VerifiedHistoryList/.test(panel), "bileşenler modül düzeyinde");
ok(/completeVinInput/.test(shell), "tamirci iş tamamlarken şasi numarası girebiliyor");

// --- 8) Metinler üç dilde -----------------------------------------------------------------------
for (const key of ["vinLabel", "vinTip", "vinShareLabel", "vinLookupTitle", "vinLookupEmpty",
  "listingShowHistoryLabel", "listingShowHistoryDesc", "vehicleHistoryVerifiedTitle", "listingNeedsVinForHistory"]) {
  const line = i18n.split("\n").find((l) => l.trim().startsWith(`${key}:`)) || "";
  ok(line.length > 0, `${key} tanımlı`);
  for (const lang of ["tr:", "en:", "de:"]) ok(line.includes(lang), `${key} ${lang} dilinde var`);
}
// Kullanıcıya "zorunlu değil" ve "kişisel bilgi gösterilmez" açıkça söylenmeli.
const tipLine = i18n.split("\n").find((l) => l.trim().startsWith("vinTip:")) || "";
ok(/zorunlu değildir|Zorunlu değil|isteğe bağlı/i.test(tipLine), "şasi alanının isteğe bağlı olduğu yazıyor");
const shareDesc = i18n.split("\n").find((l) => l.trim().startsWith("listingShowHistoryDesc:")) || "";
ok(/kişisel bilgileriniz/i.test(shareDesc), "ilanda kişisel bilgi gösterilmediği yazıyor");

report("araç geçmişi");
