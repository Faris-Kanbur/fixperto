/**
 * ALAN DOĞRULAMA — "kabul edilebilir" değil, "MANTIKLI" veri.
 * ---------------------------------------------------------------------------------------------
 * YAŞANAN HATA (kullanıcı bildirdi): sigorta bitiş tarihine 2099 yazıldı ve sistem kabul etti.
 * Sebep, doğrulamanın yalnızca "bu metin bir tarihe çevrilebiliyor mu" sorusunu sormasıydı
 * (isValidDateStr). 2099-01-01 geçerli bir tarihtir — ama geçerli bir SİGORTA tarihi değildir.
 * Aynı boşluk her sayısal alanda vardı: 9.000.000 km, 1899 model yıl, 50.000 beygir, 99 kapı…
 * Hepsi sessizce kaydediliyordu; sonra listeler, filtreler ve hatırlatmalar bu saçma değerlerin
 * üzerine kuruluyordu.
 *
 * TASARIM: her alanın kendi ANLAMINA göre bir aralığı var ve kural TEK YERDE tanımlı. Aynı alan
 * birden çok formda geçiyor (araç ekle / araç düzenle / ilan ver / ilan düzenle); kuralı her
 * formda tekrar yazmak, er geç birinin unutulması demekti.
 *
 * DÜRÜST SINIR: bu doğrulama İSTEMCİ tarafında. Kötü niyetli biri API'ye doğrudan istek atarak
 * saçma değer yazabilir; asıl kalkan backend'de olmalı. Burada amaç, kazayla yanlış veri
 * girilmesini önlemek ve kullanıcıya anında anlaşılır bir uyarı vermek.
 */

export const CURRENT_YEAR = new Date().getFullYear();

/** Tarih metni gerçekten o tarih mi (2026-02-30 gibi kaymaları da yakalar). */
function parseDate(str) {
  if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(String(str))) return null;
  const [y, mo, d] = String(str).split("-").map(Number);
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() + 1 !== mo || date.getDate() !== d) return null;
  return date;
}

const startOfToday = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
const yearsFromToday = (n) => { const t = startOfToday(); return new Date(t.getFullYear() + n, t.getMonth(), t.getDate()); };

/**
 * Alan kuralları. Her kural { labelKey, check(value) } döndürür:
 *   null  → sorun yok
 *   { key, params } → i18n mesaj anahtarı + parametreler
 *
 * Aralıklar keyfi değil: her biri gerçek dünyadaki uç değere göre seçildi ve yorumda gerekçesi var.
 */
export const FIELD_RULES = {
  // --- TARİHLER -------------------------------------------------------------------------------
  // Muayene/bakım GEÇMİŞTE olur. "Son muayene 2030" mantıksızdır; 1950 öncesi de bu sitede yok.
  pastDate: {
    check(v) {
      const d = parseDate(v);
      if (!d) return { key: "valInvalidDate" };
      if (d > startOfToday()) return { key: "valDateNotFuture" };
      if (d.getFullYear() < 1950) return { key: "valDateTooOld", params: { year: "1950" } };
      return null;
    },
  },
  // Sigorta/muayene BİTİŞİ ileri bir tarihtir ama poliçeler en fazla birkaç yıllıktır.
  // Geçmişe de izin veriyoruz (süresi dolmuş poliçe gerçek bir durum) ama 5 yıldan eskisi
  // artık bir kayıt hatasıdır. Üst sınır 3 yıl: 2099 gibi değerler böyle eleniyor.
  policyEndDate: {
    check(v) {
      const d = parseDate(v);
      if (!d) return { key: "valInvalidDate" };
      if (d > yearsFromToday(3)) return { key: "valDateTooFar", params: { years: "3" } };
      if (d < yearsFromToday(-5)) return { key: "valDateTooOld", params: { year: String(CURRENT_YEAR - 5) } };
      return null;
    },
  },
  // --- SAYILAR --------------------------------------------------------------------------------
  // 1950: sitede alım satımı yapılan en eski klasik araçlar için makul bir taban.
  // +1 yıl: yeni model yılı takvim yılından önce satışa çıkar (2026 model, 2025'te).
  year: { check: numRange(1950, CURRENT_YEAR + 1, "valYearRange") },
  // 1.500.000 km: ticari araçlarda bile uç değer. Üstü yazım hatasıdır.
  km: { check: numRange(0, 1_500_000, "valRange") },
  // Fiyat: 0 ya da negatif ilan olmaz; 100 milyon üstü de bu pazarda yazım hatasıdır.
  price: { check: numRange(1, 100_000_000, "valRange") },
  // Motor gücü (HP): en güçlü seri üretim araçlar ~2000 HP.
  power: { check: numRange(1, 2000, "valRange") },
  // Motor hacmi cc: 600cc (kei araç) – 8400cc (büyük V8). Litre olarak yazılmışsa (1.6) da kabul.
  engineSize: {
    check(v) {
      const n = toNumber(v);
      if (n === null) return { key: "valNumber" };
      if (n > 0 && n <= 10) return null;          // litre biçimi: 0.9 – 8.0
      if (n >= 600 && n <= 10_000) return null;   // cc biçimi
      return { key: "valEngineSize" };
    },
  },
  doorCount: { check: numRange(2, 7, "valRange") },
  seatCount: { check: numRange(1, 9, "valRange") },
  // Kaç el: 0 (sıfır araç) – 30. Üstü gerçekçi değil.
  ownerCount: { check: numRange(0, 30, "valRange") },
  // Yakıt tüketimi L/100km: 1 – 40 (ağır ticari/performans aracı bile 40'ı geçmez).
  fuelConsumption: { check: numRange(1, 40, "valRange") },
  co2Emission: { check: numRange(0, 600, "valRange") },
  batteryCapacity: { check: numRange(1, 300, "valRange") },
  rangeKm: { check: numRange(1, 1500, "valRange") },
  // Hizmet fiyatı: 0 olabilir (ücretsiz kontrol) ama 1 milyonu geçen tek hizmet yok.
  servicePrice: { check: numRange(0, 1_000_000, "valRange") },
  // Garanti: 0 gün (garantisiz) – 10 yıl.
  warrantyDays: { check: numRange(0, 3650, "valRange") },
};

function toNumber(v) {
  const s = String(v ?? "").trim().replace(",", ".");
  if (s === "") return null;
  const n = Number(s.replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function numRange(min, max, key) {
  return (v) => {
    const n = toNumber(v);
    if (n === null) return { key: "valNumber" };
    if (n < min || n > max) return { key, params: { min: String(min), max: String(max) } };
    return null;
  };
}

/**
 * Bir form nesnesini alan→kural eşlemesine göre doğrular.
 * BOŞ değerler atlanır: bu fonksiyon "zorunluluk" değil "mantıklılık" denetler; zorunlu alan
 * kontrolü çağıran tarafta kalıyor (ör. ilan verirken marka/model zorunlu).
 * İlk soruna ait { field, key, params } döner, yoksa null.
 */
export function validateFields(values: any, mapping: Record<string, string>) {
  for (const [field, ruleName] of Object.entries(mapping)) {
    const raw = values?.[field];
    if (raw === undefined || raw === null || String(raw).trim() === "" || String(raw).trim() === "—") continue;
    const rule = (FIELD_RULES as Record<string, { check: (v: any) => any }>)[ruleName];
    if (!rule) continue;
    const problem = rule.check(raw);
    if (problem) return { field, ...problem };
  }
  return null;
}

/** Araç formu (garaj + randevu ekranı + teklif modalı aynı alanları kullanıyor). */
export const VEHICLE_FIELD_RULES = {
  year: "year",
  lastInspection: "pastDate",
  lastMaintenance: "pastDate",
  insuranceEnd: "policyEndDate",
};

/** Araç ilanı formu. */
export const LISTING_FIELD_RULES = {
  year: "year",
  km: "km",
  price: "price",
  power: "power",
  engineSize: "engineSize",
  doorCount: "doorCount",
  seatCount: "seatCount",
  ownerCount: "ownerCount",
  fuelConsumption: "fuelConsumption",
  co2Emission: "co2Emission",
  batteryCapacity: "batteryCapacity",
  rangeKm: "rangeKm",
  firstReg: "pastDate",
};
