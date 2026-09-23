// TAM SİTE QA DENETİMİ (uçtan uca, gerçek çoklu hesapla) — beş bildirimin uçtan uca hiç
// çalışmadığını, VE randevu tamamlama akışının (Tamire Al / Tamamlandı) backend'de HİÇ ÇALIŞMADIĞINI
// (sessizce, her seferinde) ölçtü — ilki bir bekçi kalıbıydı, ikincisi ön yüz/arka yüz arasında
// bağımsız yazılmış bir durum sözlüğü eşitsizliğiydi. Bkz. el kitabı 22.7 "Uçtan uca canlı testte
// bulunanlar".
//
// ORTAK KÖK NEDEN: gerçek çoklu hesap oturumundan ÖNCEKİ bir varsayımdan kalma
// `if (hedef === MY_MECHANIC_ID)` bekçisi. confirmBooking/submitQuoteRequest/cancelOwnAppt/
// confirmReschedule/submitReview HEPSİ yalnızca ARAÇ SAHİBİ tarafından çağrılıyor — o oturumda
// MY_MECHANIC_ID her zaman null, yani bu koşul asla doğru olamıyordu ve tamirciye giden bildirim
// sessizce hiç ateşlenmiyordu. Bu test o bekçinin GERİ GELMEDİĞİNİ doğruluyor: her çağrının
// gövdesinde `MY_MECHANIC_ID` geçmemeli.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, ok, report, stripComments } from "./_harness.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const rawProvider = readFileSync(join(ROOT, "frontend", "src", "app", "state", "AppLogicProvider.tsx"), "utf8");
const provider = stripComments(rawProvider);

function bodyOf(startMarker, nextMarkers) {
  const start = provider.indexOf(startMarker);
  ok(start !== -1, `${startMarker} bulundu`);
  const ends = nextMarkers.map((m) => provider.indexOf(m, start + 1)).filter((i) => i !== -1);
  const end = ends.length ? Math.min(...ends) : provider.length;
  return provider.slice(start, end);
}

// Sınırlar, dosyadaki BİR SONRAKİ üst düzey `const fn = (...) => {` bildirimi — geniş bir sonraki
// bulunamayan-marker'a değil, doğrudan takip eden fonksiyona kadar kesiliyor (bkz. yukarıdaki
// fonksiyon listesi denetimi); aksi halde slice aradaki başka fonksiyonların içindeki alakasız
// MY_MECHANIC_ID kullanımlarını da yanlışlıkla kapsardı.

// --- 1) Randevu onayı: tamirciye "Yeni randevu" bildirimi koşulsuz gidiyor --------------------
const confirmBookingSrc = bodyOf("const confirmBooking = async () => {", ["const goHome = ()"]);
ok(/fireNotification\(autoAccept \? "Yeni randevu/.test(confirmBookingSrc), "confirmBooking bildirimi hâlâ var");
eq(/MY_MECHANIC_ID/.test(confirmBookingSrc), false, "confirmBooking'de MY_MECHANIC_ID bekçisi YOK (regresyon koruması)");

// --- 2) Çoklu teklif isteği: tüm seçili tamircilere bildirim gidiyor ---------------------------
const submitQuoteSrc = bodyOf("const submitQuoteRequest = async () => {", ["const submitQuoteOffer = async"]);
ok(/fireNotification\("Yeni teklif isteği/.test(submitQuoteSrc), "submitQuoteRequest bildirimi hâlâ var");
eq(/MY_MECHANIC_ID/.test(submitQuoteSrc), false, "submitQuoteRequest'te MY_MECHANIC_ID bekçisi YOK (regresyon koruması)");

// --- 3) Randevu iptali: tamirciye haber gidiyor -------------------------------------------------
const cancelSrc = bodyOf("const cancelOwnAppt = (id) => {", ["const startReschedule = (a)"]);
ok(/fireNotification\("Randevu iptal edildi/.test(cancelSrc), "cancelOwnAppt bildirimi hâlâ var");
eq(/MY_MECHANIC_ID/.test(cancelSrc), false, "cancelOwnAppt'ta MY_MECHANIC_ID bekçisi YOK (regresyon koruması)");

// --- 4) Yeniden planlama: tamirciye haber gidiyor -----------------------------------------------
const rescheduleSrc = bodyOf("const confirmReschedule = () => {", ["const submitReview = ()"]);
ok(/fireNotification\(/.test(rescheduleSrc), "confirmReschedule bildirimi hâlâ var");
eq(/MY_MECHANIC_ID/.test(rescheduleSrc), false, "confirmReschedule'da MY_MECHANIC_ID bekçisi YOK (regresyon koruması)");

// --- 5) Yeni değerlendirme: tamirciye haber gidiyor ---------------------------------------------
const reviewSrc = bodyOf("const submitReview = () => {", ["const submitMechanicReply = ("]);
ok(/fireNotification\(/.test(reviewSrc), "submitReview bildirimi hâlâ var");
eq(/MY_MECHANIC_ID/.test(reviewSrc), false, "submitReview'da MY_MECHANIC_ID bekçisi YOK (regresyon koruması)");

// --- 6) advanceStatus: ÜÇ KATMANLI bir hata, üç ayrı teşhis, üç ayrı düzeltme -------------------
// Bu tek semptomun ("garanti tamamlama bazen 400 veriyor") arkasında SIRAYLA üç farklı gerçek hata
// çıktı — her biri bir öncekini düzeltince ortaya çıkan bir SONRAKİ katmandı, kod okuyarak değil
// canlı tarayıcıda adım adım console.log izleyerek bulundu (bkz. el kitabı 22.7):
//
// KATMAN 1 (ilk teşhis, YANLIŞ): advanceStatus'ün persist() çağrısı hiçbir şey DÖNDÜRMÜYORDU,
// completeApptWithWarranty de onu await etmeden vehicleHistory.record'u gönderiyordu. "Yarış
// durumu" sanıldı çünkü hata ARA SIRA görünüyordu. Await eklendi — zararsız, doğru bir iyileştirme
// ama TEK BAŞINA sorunu çözmedi.
//
// KATMAN 2 (gerçek ama TEK başına yetersiz): backend'in randevu durum makinesi (appointments.js)
// "Tamire Alındı" ara durumunu hiç tanımıyordu, DONE değeri de "Tamamlandı" idi — ön yüzün
// gerçekten gönderdiği "Tamir Tamamlandı" ile hiç eşleşmiyordu (bkz. 7. bölüm, backend düzeltmesi).
// Bu düzeltildikten SONRA bile canlı testte hata AYNEN devam etti — üçüncü katman ortaya çıktı.
//
// KATMAN 3 (asıl kök neden — canlı tarayıcıda console.log ile ÖLÇÜLDÜ, kod okuyarak bulunamazdı):
// advanceStatus, bir SONRAKİ durumu (`nextStatus`) setAppointments'ın GÜNCELLEYİCİ FONKSİYONU
// İÇİNDE dışarıdaki bir `let` değişkenine yan etki olarak yazıyor, updater çağrısından HEMEN SONRA
// o değişkeni okuyordu — "React updater'ı senkron çalıştırır" varsayımına dayanan, React 18'de
// GARANTİSİ OLMAYAN bir kalıp. Ölçülen: appointments dizisinde doğru satır (id eşleşiyor, status
// "Tamire Alındı") dururken bile `nextStatus` HER ZAMAN `null` kalıyordu — yani PATCH isteği ağa
// hiç ÇIKMIYORDU (sessizce, network sekmesinde bile görünmeden). Ekranda "tamamlandı" gösteriliyordu
// çünkü modal kapanıp SMS/garanti akışı devam ediyordu, ama durum sunucuya HİÇ yazılmamıştı.
// Düzeltme: bir sonraki durum artık setAppointments'tan TAMAMEN BAĞIMSIZ, mevcut `appointments`
// closure'ından DOĞRUDAN hesaplanıyor.
//
// DERS: "ara sıra oluyor" her zaman zamanlama demek değildir, ve bir düzeltme testleri geçirip
// canlıda hâlâ bozuksa bu KATMANLI bir hata olabileceğinin işaretidir — bir sonraki katmanı aramak
// için AYNI canlı gözlem yöntemine (bu kez daha ayrıntılı: ara değerleri console.log'la izlemek)
// geri dönmek gerekir.
const advanceStatusSrc = bodyOf("const advanceStatus = (id) => {", ["const completeApptWithWarranty = async"]);
eq(/let nextStatus = null/.test(advanceStatusSrc), false,
  "setAppointments içine yan etkiyle 'nextStatus' YAZMA kalıbı YOK (regresyon koruması — updater'ın senkron çalıştığını varsaymıyor)");
ok(/const current = appointments\.find\(a => a\.id === id\)/.test(advanceStatusSrc),
  "bir sonraki durum mevcut appointments closure'ından DOĞRUDAN okunuyor (regresyon koruması)");
ok(/return persist\(api\.appointments\.update\(id, \{ status: next \}\)/.test(advanceStatusSrc),
  "advanceStatus artık persist promise'ını DÖNDÜRÜYOR (regresyon koruması)");

const completeSrc = bodyOf("const completeApptWithWarranty = async (warrantyDays", ["const cancelOwnAppt = (id)"]);
ok(/await advanceStatus\(id\)/.test(completeSrc), "completeApptWithWarranty durum PATCH'ini AWAIT ediyor (regresyon koruması)");
// await'in vehicleHistory.record çağrısından ÖNCE olduğunu da doğrula (sıra önemli).
const awaitIdx = completeSrc.indexOf("await advanceStatus(id)");
const recordIdx = completeSrc.indexOf("api.vehicleHistory.record(");
ok(awaitIdx !== -1 && recordIdx !== -1 && awaitIdx < recordIdx, "await, geçmiş kaydından ÖNCE geliyor (sıra doğru)");

// --- 7) GERÇEK KÖK NEDEN: backend'in randevu durum makinesi ön yüzle AYNI SÖZLÜĞÜ kullanmalı ----
// Bu, canlı tarayıcı testinde (curl ile doğrudan API'ye istek atılarak) bulunan asıl hata: backend
// STATUS sözlüğü "Tamire Alındı"yı hiç tanımıyordu ve DONE="Tamamlandı" idi, ön yüz ise HER ZAMAN
// "Tamir Tamamlandı" gönderiyordu — iki taraf birbirinden bağımsız yazılmış, hiç eşleşmemişti.
const appointmentsBackend = readFileSync(join(ROOT, "backend", "routes", "appointments.js"), "utf8");
ok(/IN_REPAIR: "Tamire Alındı"/.test(appointmentsBackend), "backend 'Tamire Alındı' ara durumunu artık tanıyor (regresyon koruması)");
ok(/DONE: "Tamir Tamamlandı"/.test(appointmentsBackend), "backend DONE değeri ön yüzün gerçekten gönderdiğiyle EŞİT (regresyon koruması)");
ok(/\[STATUS\.QUEUED\]: new Set\(\[STATUS\.IN_REPAIR,/.test(appointmentsBackend), "Sırada → Tamire Alındı geçişi tanımlı");
ok(/\[STATUS\.IN_REPAIR\]: new Set\(\[STATUS\.DONE\]\)/.test(appointmentsBackend), "Tamire Alındı → Tamir Tamamlandı geçişi tanımlı");
ok(/export \{ STATUS as APPOINTMENT_STATUS \}/.test(appointmentsBackend),
  "STATUS dışa aktarılıyor — diğer dosyalar kendi kopyasını yazmasın (bkz. vehicleHistory.js, reviews.js)");

const vehicleHistoryBackend = readFileSync(join(ROOT, "backend", "routes", "vehicleHistory.js"), "utf8");
ok(/import \{ APPOINTMENT_STATUS \} from "\.\/appointments\.js"/.test(vehicleHistoryBackend),
  "vehicleHistory.js kendi 'Tamamlandı' kopyasını YAZMIYOR, appointments.js'ten alıyor");
ok(/appt\.status !== APPOINTMENT_STATUS\.DONE/.test(vehicleHistoryBackend), "geçmiş kaydı paylaşılan sabitle karşılaştırıyor");

const reviewsBackend = readFileSync(join(ROOT, "backend", "routes", "reviews.js"), "utf8");
ok(/import \{ APPOINTMENT_STATUS \} from "\.\/appointments\.js"/.test(reviewsBackend),
  "reviews.js kendi 'Tamamlandı' kopyasını YAZMIYOR, appointments.js'ten alıyor");
ok(/AND status = \? LIMIT 1/.test(reviewsBackend) && /APPOINTMENT_STATUS\.DONE\)/.test(reviewsBackend),
  "yorum hakkı kontrolü paylaşılan sabitle karşılaştırıyor");

report("Bildirim bekçisi regresyonu + randevu tamamlama (üç katmanlı hata: await, durum sözlüğü, setState closure)");
