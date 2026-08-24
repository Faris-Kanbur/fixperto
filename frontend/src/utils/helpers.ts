import { DAY_KEYS, DAY_LABELS, TODAY, LEGAL_TIRE_RULES, DICT_TR_EN, DICT_EN_TR, ADMIN_SLA_DAYS, FIXED_PRICE_KEYWORDS, VARIABLE_PRICE_KEYWORDS, PRICE_LEVEL_BREAKS, TR_ASCII_MAP } from "../data/constants.js";

export function jobStatusMeta(status) {
  return status === "closed" ? { label: "Kapatıldı", color: "bg-gray-400" } : { label: "Açık", color: "bg-green-500" };
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

export function formatHoursText(hours) {
  const groups = [];
  DAY_KEYS.forEach((k) => {
    const d = hours[k];
    const slots = getDaySlots(d);
    const lastEnd = slots.length ? slots[slots.length - 1] : d.end;
    groups.push(`${DAY_LABELS[k]}: ${d.open ? `${d.start}-${lastEnd}` : "Kapalı"}`);
  });
  return groups;
}

export function parseListingPrice(p) {
  if (!p) return 0;
  return Number(String(p).replace(/[^\d]/g, "")) || 0;
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
  const m = trimmed.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const startMin = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  const endMin = parseInt(m[3], 10) * 60 + parseInt(m[4], 10);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= startMin && nowMin <= endMin;
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
    const daysLeft = Math.round((effectiveDue - TODAY) / 86400000);
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
    const daysLeft = Math.round((due - TODAY) / 86400000);
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
  return typeof s === "string" && s.startsWith("blob:");
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
  return Math.max(0, Math.round((TODAY - new Date(tk.createdDate)) / 86400000));
}

export function ticketSlaBreached(tk) {
  if (tk.status === "resolved") return false;
  return ticketDaysOpen(tk) > (ADMIN_SLA_DAYS[tk.priority] || 5);
}
