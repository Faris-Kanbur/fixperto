// ALAN DOĞRULAMA — "kabul edilebilir" değil "MANTIKLI" veri.
// Yaşanan hata (kullanıcı bildirdi): sigorta bitişine 2099 yazıldı, sistem kabul etti. Eski
// doğrulama yalnızca "bu metin bir tarihe çevrilebiliyor mu" diye soruyordu.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, ok, report } from "./_harness.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const YEAR = new Date().getFullYear();

// utils/validation.ts ile AYNI mantık.
const parseDate = (str) => {
  if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(String(str))) return null;
  const [y, mo, d] = String(str).split("-").map(Number);
  const date = new Date(y, mo - 1, d);
  return (date.getFullYear() === y && date.getMonth() + 1 === mo && date.getDate() === d) ? date : null;
};
const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
const yearsFrom = (n) => { const t = today(); return new Date(t.getFullYear() + n, t.getMonth(), t.getDate()); };
const toNumber = (v) => {
  const s = String(v ?? "").trim().replace(",", ".");
  if (s === "") return null;
  const n = Number(s.replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
};
const numRange = (min, max, key) => (v) => {
  const n = toNumber(v);
  if (n === null) return { key: "valNumber" };
  return (n < min || n > max) ? { key } : null;
};
const RULES = {
  pastDate: (v) => {
    const d = parseDate(v);
    if (!d) return { key: "valInvalidDate" };
    if (d > today()) return { key: "valDateNotFuture" };
    if (d.getFullYear() < 1950) return { key: "valDateTooOld" };
    return null;
  },
  policyEndDate: (v) => {
    const d = parseDate(v);
    if (!d) return { key: "valInvalidDate" };
    if (d > yearsFrom(3)) return { key: "valDateTooFar" };
    if (d < yearsFrom(-5)) return { key: "valDateTooOld" };
    return null;
  },
  year: numRange(1950, YEAR + 1, "valYearRange"),
  km: numRange(0, 1500000, "valRange"),
  price: numRange(1, 100000000, "valRange"),
  power: numRange(1, 2000, "valRange"),
  doorCount: numRange(2, 7, "valRange"),
  seatCount: numRange(1, 9, "valRange"),
  ownerCount: numRange(0, 30, "valRange"),
  fuelConsumption: numRange(1, 40, "valRange"),
  engineSize: (v) => {
    const n = toNumber(v);
    if (n === null) return { key: "valNumber" };
    if (n > 0 && n <= 10) return null;
    if (n >= 600 && n <= 10000) return null;
    return { key: "valEngineSize" };
  },
};
const bad = (rule, v) => RULES[rule](v) !== null;
const good = (rule, v) => RULES[rule](v) === null;

// --- KULLANICININ BİLDİRDİĞİ VAKA ------------------------------------------------------------
ok(bad("policyEndDate", "2099-01-01"), "sigorta bitişi 2099 REDDEDİLİYOR (bildirilen hata)");
ok(good("policyEndDate", `${YEAR + 1}-06-15`), "gelecek yıl biten poliçe geçerli");
ok(good("policyEndDate", `${YEAR - 1}-06-15`), "süresi geçmiş poliçe geçerli (gerçek bir durum)");
ok(bad("policyEndDate", `${YEAR - 9}-06-15`), "9 yıl önce bitmiş poliçe kayıt hatasıdır");

// --- Geçmiş tarihler --------------------------------------------------------------------------
ok(bad("pastDate", `${YEAR + 2}-01-01`), "son muayene gelecekte olamaz");
ok(bad("pastDate", "1900-01-01"), "1950 öncesi muayene reddediliyor");
ok(good("pastDate", `${YEAR - 1}-03-10`), "geçen yılki muayene geçerli");
ok(bad("pastDate", "2026-02-30"), "olmayan tarih (30 Şubat) reddediliyor");
ok(bad("pastDate", "abc"), "metin reddediliyor");
ok(bad("pastDate", "15/03/2024"), "beklenmeyen biçim reddediliyor");

// --- Sayılar ----------------------------------------------------------------------------------
ok(bad("year", "1899"), "1899 model reddediliyor");
ok(bad("year", String(YEAR + 5)), "5 yıl sonrasının modeli reddediliyor");
ok(good("year", String(YEAR + 1)), "gelecek model yılı geçerli (yeni araçlar erken çıkar)");
ok(bad("km", "9000000"), "9 milyon km reddediliyor");
ok(good("km", "185000"), "185.000 km geçerli");
ok(bad("km", "-5"), "negatif km reddediliyor");
ok(bad("price", "0"), "sıfır fiyatlı ilan reddediliyor");
ok(bad("power", "50000"), "50.000 beygir reddediliyor");
ok(good("power", "150"), "150 beygir geçerli");
ok(bad("doorCount", "99"), "99 kapı reddediliyor");
ok(good("doorCount", "5"), "5 kapı geçerli");
ok(bad("seatCount", "0"), "sıfır koltuk reddediliyor");
ok(bad("ownerCount", "500"), "500. el reddediliyor");
ok(good("ownerCount", "0"), "sıfır araç (0. el) geçerli");
ok(bad("fuelConsumption", "500"), "100 km'de 500 litre reddediliyor");
ok(good("engineSize", "1.6"), "1.6 litre geçerli");
ok(good("engineSize", "1600"), "1600 cc geçerli");
ok(bad("engineSize", "45"), "45 (ne litre ne cc) reddediliyor");
ok(bad("engineSize", "abc"), "sayı olmayan hacim reddediliyor");

// --- Boş değerler ZORUNLULUK değil: doğrulama sadece mantığa bakar ----------------------------
const validateFields = (values, mapping) => {
  for (const [field, rule] of Object.entries(mapping)) {
    const raw = values?.[field];
    if (raw === undefined || raw === null || String(raw).trim() === "" || String(raw).trim() === "—") continue;
    const p = RULES[rule](raw);
    if (p) return { field, ...p };
  }
  return null;
};
eq(validateFields({ year: "", km: "" }, { year: "year", km: "km" }), null, "boş alanlar mantık denetimini tetiklemiyor");
eq(validateFields({ year: "—" }, { year: "year" }), null, "'—' yer tutucusu atlanıyor (varsayılan yıl değeri)");
eq(validateFields({ year: "2020", km: "9000000" }, { year: "year", km: "km" })?.field, "km", "ilk sorunlu alan bildiriliyor");

// --- Kaynak kodda gerçekten bağlı mı ----------------------------------------------------------
const provider = readFileSync(join(ROOT, "frontend/src/app/state/AppLogicProvider.tsx"), "utf8");
ok(/validateFields\(newVehicle, VEHICLE_FIELD_RULES\)/.test(provider), "araç ekleme doğrulamadan geçiyor");
ok(/validateFields\(updates, VEHICLE_FIELD_RULES\)/.test(provider), "araç düzenleme doğrulamadan geçiyor");
ok(/validateFields\(sellForm, LISTING_FIELD_RULES\)/.test(provider), "ilan formu doğrulamadan geçiyor");
eq(/isValidDateStr\(newVehicle\./.test(provider), false, "eski yüzeysel tarih kontrolü araç eklemede kalmadı");

// Her kural için bir i18n alan adı olmalı — yoksa uyarıda "fieldXyz" ham anahtarı görünür.
const i18n = readFileSync(join(ROOT, "frontend/src/data/i18n.ts"), "utf8");
const validation = readFileSync(join(ROOT, "frontend/src/utils/validation.ts"), "utf8");
const mapped = new Set();
for (const block of validation.split("FIELD_RULES = {").slice(1)) {
  for (const m of block.matchAll(/^\s{2}(\w+):\s*"/gm)) mapped.add(m[1]);
}
const missingLabels = [...mapped].filter((f) => !i18n.includes(`field${f.charAt(0).toUpperCase()}${f.slice(1)}:`));
eq(missingLabels, [], "doğrulanan her alanın çeviri etiketi var");

report("doğrulama");
