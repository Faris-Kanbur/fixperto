// RANDEVU TAKVİMİ — çalışma saatlerinin metinden okunması, geçmiş/dolu saatler, ay ızgarası.
// Bu takımdaki kuralların hepsi gerçek bir kusurdan doğdu: kendi hesabımız dışındaki tamircilere
// saatler sabit 09:00-18:00 üretiliyordu (kapalı günlere randevu verilebiliyordu) ve bugün için
// çoktan geçmiş saatler seçilebiliyordu.
import { eq, report } from "./_harness.mjs";

const genSlots = (start, end) => {
  const slots = [];
  let [h, m] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  while (h < eh || (h === eh && m < em)) {
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += 30; if (m >= 60) { m = 0; h++; }
  }
  return slots;
};
// helpers.ts ile aynı mantık.
const slotsFromHoursLine = (line) => {
  const ranges = String(line ?? "").match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/g) || [];
  const out = [];
  for (const r of ranges) {
    const [start, end] = r.split("-").map((x) => x.trim());
    for (const s of genSlots(start, end)) if (!out.includes(s)) out.push(s);
  }
  return out.sort();
};
const slotsFromHoursText = (hoursText, date) => {
  if (!Array.isArray(hoursText) || hoursText.length === 0) return null;
  const line = hoursText[(date.getDay() + 6) % 7];
  if (line === undefined) return null;
  return slotsFromHoursLine(line);
};
const isSlotInPast = (date, slot, now = new Date(), leadMinutes = 60) => {
  if (!date || !slot) return false;
  const sameDay = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  if (date < new Date(now.getFullYear(), now.getMonth(), now.getDate())) return true;
  if (!sameDay) return false;
  const [h, m] = String(slot).split(":").map(Number);
  return h * 60 + m < now.getHours() * 60 + now.getMinutes() + leadMinutes;
};
const slotPeriod = (slot) => {
  const h = Number(String(slot).split(":")[0]);
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
};
const monthGrid = (year, month) => {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
  return cells;
};

// --- Çalışma saatleri metninden slot üretimi ---------------------------------------------------
const HOURS = ["Pzt: 09:00-18:00", "Sal: 09:00-18:00", "Çar: 09:00-18:00", "Per: 09:00-18:00",
  "Cum: 09:00-18:00", "Cmt: 09:00-14:00", "Paz: Kapalı"];
// 2026-09-07 Pazartesi, 2026-09-12 Cumartesi, 2026-09-13 Pazar.
const mon = new Date(2026, 8, 7), sat = new Date(2026, 8, 12), sun = new Date(2026, 8, 13);
eq(mon.getDay(), 1, "kontrol: 7 Eylül 2026 Pazartesi");
eq(slotsFromHoursText(HOURS, mon).length, 18, "Pazartesi 09:00-18:00 → 18 slot");
eq(slotsFromHoursText(HOURS, sat).length, 10, "Cumartesi 09:00-14:00 → 10 slot");
eq(slotsFromHoursText(HOURS, sun), [], "Pazar kapalı → hiç slot yok (ESKİ HATA: randevu verilebiliyordu)");
eq(slotsFromHoursText(HOURS, sat).at(-1), "13:30", "cumartesi son slot 13:30 (14:00'te kapanıyor)");
eq(slotsFromHoursText([], mon), null, "saat girilmemişse null → çağıran varsayılana düşer");
eq(slotsFromHoursText(null, mon), null, "hoursText yoksa null");
eq(slotsFromHoursLine("Pzt: 09:00-12:00, 13:00-18:00").includes("12:00"), false, "öğle arası slotları çıkarılıyor");
eq(slotsFromHoursLine("Pzt: 09:00-12:00, 13:00-18:00").length, 16, "iki aralıklı gün doğru sayıda");
eq(slotsFromHoursLine("Paz: Kapalı"), [], "'Kapalı' satırı boş liste");
eq(slotsFromHoursLine("bozuk metin"), [], "anlamsız metin çökmüyor");
eq(slotsFromHoursLine("Sun: 8:30-10:00"), ["08:30", "09:00", "09:30"], "tek haneli saat ve İngilizce etiket sorun değil (sıraya bakılıyor)");

// --- Geçmiş saatler ---------------------------------------------------------------------------
const now = new Date(2026, 8, 7, 14, 10); // Pazartesi 14:10
eq(isSlotInPast(mon, "09:00", now), true, "bugünün geçmiş saati seçilemez");
eq(isSlotInPast(mon, "14:30", now), true, "1 saatlik yol payı içindeki saat de kapalı");
eq(isSlotInPast(mon, "15:30", now), false, "yeterince ilerideki saat açık");
eq(isSlotInPast(new Date(2026, 8, 8), "09:00", now), false, "yarının sabahı geçmiş değil");
eq(isSlotInPast(new Date(2026, 8, 6), "23:30", now), true, "dünkü her saat geçmiş");
eq(isSlotInPast(null, "09:00", now), false, "tarih yoksa çökmüyor");

// --- Günün bölümleri --------------------------------------------------------------------------
eq(slotPeriod("08:30"), "morning", "08:30 sabah");
eq(slotPeriod("12:00"), "afternoon", "12:00 öğleden sonra");
eq(slotPeriod("17:00"), "evening", "17:00 akşam");

// --- Ay ızgarası ------------------------------------------------------------------------------
// Eylül 2026: 1'i Salı → önünde 1 boş hücre olmalı (Pazartesi başlangıçlı ızgara).
const grid = monthGrid(2026, 8);
eq(grid.length, 30 + 1, "Eylül 2026: 30 gün + 1 boş hücre");
eq(grid.filter(Boolean).length, 30, "Eylül 30 gün");
eq(grid[0], null, "ay Salı başlıyorsa ilk hücre boş");
eq(grid[1].getDate(), 1, "ilk gün doğru yere oturuyor");
// Şubat 2027: 1'i Pazartesi → hiç boş hücre yok, 28 gün.
const feb = monthGrid(2027, 1);
eq(feb[0].getDate(), 1, "Pazartesi başlayan ayda boş hücre yok");
eq(feb.length, 28, "Şubat 2027 28 gün");
// Artık yıl kontrolü.
eq(monthGrid(2028, 1).filter(Boolean).length, 29, "2028 artık yıl → Şubat 29 gün");

report("randevu takvimi");
