// RANDEVU TAKVİMİ — çalışma saatlerinin metinden okunması, geçmiş/dolu saatler, ay ızgarası.
// Bu takımdaki kuralların hepsi gerçek bir kusurdan doğdu: kendi hesabımız dışındaki tamircilere
// saatler sabit 09:00-18:00 üretiliyordu (kapalı günlere randevu verilebiliyordu) ve bugün için
// çoktan geçmiş saatler seçilebiliyordu.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, ok, report } from "./_harness.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

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

// --- ONAY ANINDA YENİDEN DOĞRULAMA ------------------------------------------------------------
// GERÇEK HATA (tam denetimde bulundu): seçim ile onay arasında dakikalar geçebiliyor (giriş kapısı
// açılıyor, kullanıcı sekmeyi bırakıp dönüyor). Buton yalnızca "seçimler dolu mu" diye bakıyordu:
// 13:55'te 14:00'ı seçip 14:30'da onaylayan kullanıcı GEÇMİŞE randevu alıyordu; bu arada aynı saati
// başkası kaptıysa iki randevu aynı saate düşüyordu.
const provider = readFileSync(join(ROOT, "frontend/src/app/state/AppLogicProvider.tsx"), "utf8");
const confirmSrc = provider.slice(provider.indexOf("const confirmBooking = async () =>"), provider.indexOf("const goHome ="));
ok(/const slotNow = bookableSlots\(selectedMechanic, selectedDate\)/.test(confirmSrc), "onay anında saat yeniden sorgulanıyor");
ok(/if \(!slotNow \|\| slotNow\.past \|\| slotNow\.taken\)/.test(confirmSrc), "geçmiş ya da dolu saat reddediliyor");
ok(/setSelectedTime\(null\)/.test(confirmSrc), "geçersiz saat seçimden düşürülüyor");
ok(/bookingSlotTakenToast/.test(confirmSrc) && /bookingSlotPastToast/.test(confirmSrc), "iki durum için ayrı açıklama var");
ok(/if \(!selectedDate \|\| !selectedTime \|\| !bookingService\)/.test(confirmSrc), "eksik seçimle randevu oluşturulamıyor");
// Kontrol, kayıt/analitik çağrılarından ÖNCE olmalı — yoksa reddedilen bir randevu "alındı" diye
// ölçülür ve sayaçlar şişer.
const guardIdx = confirmSrc.indexOf("const slotNow =");
const trackIdx = confirmSrc.indexOf('track("appointment_booked"');
ok(guardIdx > 0 && guardIdx < trackIdx, "doğrulama, ölçüm ve kayıttan önce yapılıyor");

// Davranış: aynı kuralı çalıştırıyoruz.
const guard = (slot) => !slot || slot.past || slot.taken;
eq(guard(undefined), true, "listede olmayan saat reddediliyor");
eq(guard({ time: "14:00", past: true, taken: false }), true, "geçmiş saat reddediliyor");
eq(guard({ time: "14:00", past: false, taken: true }), true, "dolu saat reddediliyor");
eq(guard({ time: "14:00", past: false, taken: false }), false, "uygun saat kabul ediliyor");

// ================================================================ RANDEVU SONUCU POPUP'I
/**
 * Kullanıcı isteği: randevu alındıktan sonra sayfanın ORTASINDA bir popup çıksın; otomatik
 * onaylandıysa onaylandığını, tamirci onayı bekleniyorsa "iletildi" dediğini yazsın.
 *
 * BU TESTİN ASIL DERDİ İKİ DURUMUN AYRI KALMASI. Onları aynı cümleyle geçmek bir tasarım
 * tercihi değil, kullanıcıyı yanıltmaktır: "onaylandı" sanıp gelmeyeceği bir saate gelen ya da
 * onay bekleyip beklemediğini bilmeyen biri çıkar. O yüzden iki metnin de var olduğu ve
 * `autoAccepted` değerine göre SEÇİLDİĞİ denetleniyor.
 */
const shell = readFileSync(join(ROOT, "frontend", "src", "app", "AppShell.tsx"), "utf8");
// `provider` yukarıda zaten okunmuş (satır ~110) — ikinci kez tanımlamıyoruz.
const i18nSrc = readFileSync(join(ROOT, "frontend", "src", "data", "i18n.ts"), "utf8");

// Eski AYRI EKRAN kaldırıldı: ulaşılamayan bir ekran bırakmak, kaldırmamaktan kötüdür.
const shellCode = shell.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
eq(/screen === "confirmed"/.test(shellCode), false, "ayrı onay EKRANI kaldırıldı (artık popup)");
eq(/setScreen\("confirmed"\)/.test(provider), false, "hiçbir yer artık o ekrana geçmiyor");

// Popup, sonucu SUNUCUDAN dönen kayıttan kuruyor: açıldığında form zaten temizlenmiş oluyor.
const resultCall = provider.match(/setBookingResult\(\{[\s\S]{0,400}?\}\);/)?.[0] || "";
ok(resultCall.length > 0, "randevu kaydedilince popup verisi kuruluyor");
ok(/autoAccepted: !!autoAccept/.test(resultCall), "otomatik onay durumu popup verisine yazılıyor");
for (const field of ["mechanicName", "vehicle", "date", "time"]) {
  ok(new RegExp(`${field}:`).test(resultCall), `popup verisinde ${field} var`);
}
ok(/created\./.test(resultCall), "değerler sunucudan dönen kayıttan alınıyor (istemci tahmininden değil)");

// Popup BAŞARIDAN SONRA kuruluyor: istek başarısız olursa sahte bir "onaylandı" gösterilmemeli.
const tryIdx = provider.indexOf("const created = await api.appointments.create(draft);");
const resultIdx = provider.indexOf("setBookingResult({");
ok(tryIdx > 0 && resultIdx > tryIdx, "popup ancak kayıt BAŞARILI olduktan sonra açılıyor");

// İki durum ayrı metinlerle.
const popup = shell.slice(shell.indexOf("{bookingResult && (() => {"), shell.indexOf("{showDayFullPrompt"));
ok(popup.length > 200, "popup bloğu bulundu");
ok(/const auto = bookingResult\.autoAccepted/.test(popup), "popup otomatik onay durumuna bakıyor");
for (const [key, which] of [
  ["appointmentConfirmedTitle", "onaylandı başlığı"],
  ["appointmentRequestSentTitle", "iletildi başlığı"],
  ["appointmentConfirmedBody", "onaylandı açıklaması"],
  ["appointmentRequestSentBody", "iletildi açıklaması"],
  ["appointmentPopupConfirmedBadge", "onaylandı rozeti"],
  ["appointmentPopupWaitingBadge", "onay bekliyor rozeti"],
]) {
  ok(popup.includes(key), `popup ${which} metnini kullanıyor`);
  ok(new RegExp(`\\b${key}:`).test(i18nSrc), `${key} çevirisi tanımlı`);
  const line = i18nSrc.split("\n").find((l) => l.trim().startsWith(`${key}:`)) || "";
  for (const lang of ["tr:", "en:", "de:"]) ok(line.includes(lang), `${key} ${lang} dilinde var`);
}
// Seçim gerçekten koşullu mu — iki metni yazıp hep aynısını göstermek mümkün olurdu.
ok(/auto \? t\("appointmentConfirmedTitle"\) : t\("appointmentRequestSentTitle"\)/.test(popup),
  "başlık otomatik onaya göre SEÇİLİYOR");
ok(/auto \? t\("appointmentConfirmedBody"\) : t\("appointmentRequestSentBody"\)/.test(popup),
  "açıklama otomatik onaya göre SEÇİLİYOR");
ok(/auto \? t\("appointmentPopupConfirmedBadge"\) : t\("appointmentPopupWaitingBadge"\)/.test(popup),
  "rozet otomatik onaya göre SEÇİLİYOR");

// "İletildi" metni gerçekten beklemeyi anlatıyor mu (kullanıcının istediği şey buydu).
const sentBody = i18nSrc.split("\n").find((l) => l.trim().startsWith("appointmentRequestSentBody:")) || "";
/**
 * İlk yazdığım kural şuydu: "metin 'onaylandı' İÇERMEMELİ ya da 'bekle' içermeli". Test kırmızı
 * yandı ve haklıydı — Türkçe metin "Onaylandığında bildirim alacaksınız" diyor, yani içinde
 * "Onaylandı" geçiyor ama GELECEK zaman kipinde, bir iddia olarak değil. Kural yanlış şeyi
 * ölçüyordu: kelime varlığına bakmak, cümlenin NE SÖYLEDİĞİNİ ölçmez.
 * Ayırt edici olan şu: onaylanan durumda "kesinleşti" deniyor, bekleyen durumda denmiyor.
 * Ve iki metin BİRBİRİNDEN FARKLI olmak zorunda — asıl kural bu.
 */
const confirmedBody = i18nSrc.split("\n").find((l) => l.trim().startsWith("appointmentConfirmedBody:")) || "";
ok(/iletildi/i.test(sentBody), "bekleyen durumda 'iletildi' deniyor (kullanıcının istediği kelime)");
eq(/iletildi/i.test(confirmedBody), false, "onaylanan durumda 'iletildi' DENMİYOR");
ok(/kesinleş/i.test(confirmedBody), "onaylanan durumda randevunun kesinleştiği söyleniyor");
eq(/kesinleş/i.test(sentBody), false, "bekleyen durumda kesinleştiği söylenMİYOR");
ok(sentBody.trim() !== confirmedBody.trim(), "iki durumun metni birbirinden FARKLI");

// ORTADA olmalı: kullanıcı "sayfamın ortasında" dedi.
ok(/flex items-center justify-center/.test(popup), "popup ekranın ortasında konumlanıyor");
ok(/fixed inset-0/.test(popup), "popup sayfanın üstünde (modal) duruyor");

/**
 * HİÇBİR ÇIKIŞ YOLU KULLANICIYI BOŞTA BIRAKMAMALI. Arkadaki sayfada form ZATEN temizlenmiş
 * durumda; popup'ı kapatıp orada bırakmak boş bir ekranda bırakmak olurdu. Üç yol da (düğme,
 * ikinci düğme, arka plana tıklama) bir yere götürüyor.
 */
ok(/onClick=\{goAppointments\}[\s\S]{0,200}stopPropagation/.test(popup)
  || popup.indexOf("onClick={goAppointments}") < popup.indexOf("stopPropagation"),
  "arka plana tıklamak da randevulara götürüyor (boş ekranda bırakmıyor)");
ok(/goHome\(\)/.test(popup), "ikinci düğme ana sayfaya götürüyor");
ok((popup.match(/setBookingResult\(null\)/g) || []).length >= 2, "her çıkış yolu popup'ı kapatıyor");

report("randevu takvimi");
