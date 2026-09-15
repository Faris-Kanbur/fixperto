// GEZİNME — tarayıcı geri/ileri tuşları (AppLogicProvider'daki history yığınının kopyası).
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, ok, report } from "./_harness.mjs";

const SRC_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "frontend", "src");

function makeApp(initial) {
  let state = { ...initial };
  const stack = []; let index = 0; const hist = []; let hIndex = -1;
  const key = () => JSON.stringify(state);
  const effect = () => {
    if (stack.length === 0) { stack.push({ ...state }); index = 0; hist.push({ fx: 0 }); hIndex = 0; return; }
    if (JSON.stringify(stack[index]) === key()) return;   // idempotent: aynı yere tekrar tıklama
    const next = index + 1;
    stack.splice(next, stack.length - next, { ...state }); index = next;
    hist.splice(hIndex + 1, hist.length - hIndex - 1, { fx: next }); hIndex = hist.length - 1;
  };
  const pop = (d) => { const ni = hIndex + d; if (ni < 0 || ni >= hist.length) return "SITE_DISI"; hIndex = ni; index = hist[ni].fx; state = { ...stack[index] }; return "OK"; };
  effect();
  return { go: (p) => { state = { ...state, ...p }; effect(); }, back: () => pop(-1), fwd: () => pop(1), get: () => state, len: () => stack.length };
}

const base = { screen: "mechanicDashboard", mechTab: "requests", mechProfileTab: "settings", mechListingsSubTab: "cars", mechActiveConvoId: null };
const ownerBase = { screen: "ownerProfilePage", ownerProfileTab: "info", ownerSettingsTab: "settings" };

// Sekme gezinme + geri
let a = makeApp(base);
a.go({ mechTab: "market" }); a.go({ mechListingsSubTab: "jobs" });
eq(a.back(), "OK", "alt sekme geçmişe yazılıyor");
eq(a.get().mechListingsSubTab, "cars", "geri → Araçlarım alt sekmesi");
eq(a.back(), "OK", "geri: ana sekme");
eq(a.get().mechTab, "requests", "geri → Randevular");
eq(a.back(), "SITE_DISI", "ilk girdide geri = siteden çık (tek basış)");

// İleri
a = makeApp(base);
a.go({ mechTab: "analytics" }); a.back();
eq(a.fwd(), "OK", "ileri basılabiliyor");
eq(a.get().mechTab, "analytics", "ileri → Analiz");

// Geri bas → SONRA yeni dal: eski ileri girdileri geçersizleşmeli
a = makeApp(base);
a.go({ mechTab: "market" }); a.go({ mechTab: "favorites" }); a.back(); a.go({ mechTab: "messages" });
eq(a.get().mechTab, "messages", "geri sonrası yeni gezinme kaydediliyor");
eq(a.fwd(), "SITE_DISI", "eski ileri girdisi silindi");
eq(a.back(), "OK", "geri hâlâ çalışıyor");
eq(a.get().mechTab, "market", "geri → market");

// Sohbet: telefonda listeden sohbete gir, geri → LİSTEYE dön (sekmeden çıkma)
a = makeApp(base);
a.go({ mechTab: "messages" }); a.go({ mechActiveConvoId: 12 });
eq(a.back(), "OK", "sohbetten geri");
eq(a.get().mechActiveConvoId, null, "geri → sohbet listesi");
eq(a.get().mechTab, "messages", "hâlâ Mesajlar sekmesindeyiz");

// Profil/Teklifler pano sekmesi ↔ ayrı Ayarlar ekranı
a = makeApp(base);
a.go({ mechTab: "profile" }); a.go({ mechTab: "offers" }); a.go({ screen: "mechProfilePage" });
eq(a.get().screen, "mechProfilePage", "dişli → Ayarlar ekranı");
a.back(); eq(a.get().mechTab, "offers", "geri → Teklifler sekmesi");
a.back(); eq(a.get().mechTab, "profile", "geri → Profil sekmesi");

// Aynı sekmeye tekrar tıklamak geçmişi şişirmemeli
a = makeApp(base);
a.go({ mechTab: "market" }); const n = a.len(); a.go({ mechTab: "market" });
eq(a.len(), n, "aynı sekmeye tekrar tıklamak geçmişi şişirmiyor");

// Araç sahibi: Ayarlar AYRI bir ekran (tamirci tarafındaki gibi) — sekme değil.
// Profil sekmesi → Ayarlar → Destek → geri geri geri zinciri bozulmamalı.
let o = makeApp(ownerBase);
o.go({ ownerProfileTab: "vehicles" });
o.go({ screen: "ownerSettings", ownerSettingsTab: "settings" });
eq(o.get().screen, "ownerSettings", "dişli → ayrı Ayarlar ekranı");
o.go({ ownerSettingsTab: "support" });
eq(o.back(), "OK", "destekten geri");
eq(o.get().ownerSettingsTab, "settings", "geri → Ayarlar");
eq(o.back(), "OK", "ayarlardan geri");
eq(o.get(), { screen: "ownerProfilePage", ownerProfileTab: "vehicles", ownerSettingsTab: "settings" }, "geri → profil, Araçlarım sekmesi korunuyor");
eq(o.back(), "OK", "bir daha geri");
eq(o.get().ownerProfileTab, "info", "geri → Bilgilerim");

// --- SAYFA YENİLEME: bulunulan ekran korunmalı --------------------------------------------
// Yaşanan hata: yönlendirici olmadığı için F5 kullanıcıyı HER ZAMAN ana sayfaya atıyordu.
// Aşağıdaki model helpers.ts readNavSession ile aynı kuralları uyguluyor.
const NAV_PUBLIC = ["landing", "owner", "detail", "listingDetail", "blog", "blogPost", "about"];
const NAV_AUTH = ["mechanicDashboard", "mechProfilePage", "mechBrowse", "ownerProfilePage", "ownerSettings"];
const restore = (snap, hasSession) => {
  if (!snap || typeof snap !== "object") return null;
  let screen = snap.screen;
  if (screen === "booking") screen = snap.selectedMechanicId != null ? "detail" : "landing";
  if (!NAV_PUBLIC.includes(screen) && !NAV_AUTH.includes(screen)) return null;
  if (NAV_AUTH.includes(screen) && !hasSession) return null;
  if (screen === "detail" && snap.selectedMechanicId == null) screen = "landing";
  if (screen === "listingDetail" && snap.listingPageId == null) screen = "landing";
  if (screen === "blogPost" && !snap.blogSlug) screen = "blog";
  const out = { ...snap, screen };
  if (!hasSession) { out.role = "owner"; if (out.ownerTab && out.ownerTab !== "search") out.ownerTab = "search"; }
  return out;
};

eq(restore({ screen: "detail", selectedMechanicId: 7 }, false).screen, "detail", "tamirci sayfası yenilemede korunuyor");
eq(restore({ screen: "blogPost", blogSlug: "jant-tamiri" }, false).screen, "blogPost", "blog yazısı korunuyor");
eq(restore({ screen: "mechanicDashboard" }, true).screen, "mechanicDashboard", "oturum varsa tamirci paneli korunuyor");
eq(restore({ screen: "mechanicDashboard" }, false), null, "oturum yoksa hesap ekranı geri yüklenmiyor");
eq(restore({ screen: "login" }, false), null, "yarım kalan giriş akışı geri yüklenmiyor");
eq(restore({ screen: "chat", activeConvoId: 3 }, true), null, "anlık ekran (sohbet) geri yüklenmiyor");
eq(restore({ screen: "adminDashboard" }, true), null, "yönetici paneli tahminle açılmıyor");
eq(restore({ screen: "booking", selectedMechanicId: 7 }, true).screen, "detail", "randevu formu → tamirci sayfası (seçimler saklanmıyor)");
eq(restore({ screen: "booking", selectedMechanicId: null }, true).screen, "landing", "tamircisiz randevu → ana sayfa");
eq(restore({ screen: "detail", selectedMechanicId: null }, false).screen, "landing", "kimliksiz detay → boş sayfa yerine ana sayfa");
eq(restore({ screen: "listingDetail", listingPageId: null }, false).screen, "landing", "kimliksiz ilan → ana sayfa");
eq(restore({ screen: "blogPost", blogSlug: null }, false).screen, "blog", "yazısız blogPost → blog listesi");
eq(restore({ screen: "owner", ownerTab: "appointments" }, false).ownerTab, "search", "misafirde hesap sekmesi aramaya düşüyor");
eq(restore({ screen: "owner", ownerTab: "appointments" }, true).ownerTab, "appointments", "oturum varsa sekme korunuyor");
eq(restore({ screen: "owner", role: "mechanic" }, false).role, "owner", "oturum yoksa rol misafire çekiliyor");
eq(restore(null, true), null, "kayıt yoksa null");
eq(restore("bozuk", true), null, "bozuk kayıt çökmüyor");
eq(restore({ screen: "hicboylebirekranyok" }, true), null, "bilinmeyen ekran adı reddediliyor");

// --- "Randevumu Görüntüle" AKTİF randevuları açmalı -------------------------------------------
// Yaşanan hata (kullanıcı bildirdi): ownerApptView kullanıcının en son baktığı sekmede kalıyordu.
// Bir kez "Geçmiş"e bakan kişi, yeni randevusunu almasının hemen ardından "Randevumu Görüntüle"ye
// basınca GEÇMİŞ randevular listesine düşüyor ve az önce aldığı randevuyu göremiyordu.
const shellSrc = readFileSync(join(SRC_DIR, "app", "AppShell.tsx"), "utf8");
/**
 * Onay artık ayrı bir EKRAN değil, sayfanın ortasında bir POPUP (kullanıcı isteği). Eski test
 * düğmeden geriye 400 karakter okuyup içinde `setOwnerApptView("active")` arıyordu; popup'ta
 * o çağrı ortak bir `goAppointments` yardımcısına taşındığı için pencere artık yetmiyordu.
 * Soru değişmedi — "Randevumu Görüntüle" AKTİF randevuları mı açıyor? — o yüzden test yardımcıyı
 * bulup onun içine bakıyor. (Yaşanan hata: bir kez "Geçmiş"e bakan kişi yeni randevusunu
 * almasının ardından bu düğmeye basınca GEÇMİŞ listesine düşüyor ve randevusunu göremiyordu.)
 */
const goAppointmentsFn = shellSrc.match(/const goAppointments = \(\) => \{[^}]*\}/)?.[0] || "";
ok(/setOwnerApptView\("active"\)/.test(goAppointmentsFn), "onay popup'ındaki buton aktif randevuları açıyor");
ok(/setBookingResult\(null\)/.test(goAppointmentsFn), "popup kapanıyor (açık kalıp arkada takılmıyor)");
// Düğme gerçekten o yardımcıyı çağırıyor mu — yardımcının doğru olması tek başına yetmez.
const btnLine = shellSrc.split("\n").find((l) => l.includes("viewMyAppointmentBtn")) || "";
ok(/onClick=\{goAppointments\}/.test(btnLine), "'Randevumu Görüntüle' düğmesi o yardımcıya bağlı");
const providerSrc2 = readFileSync(join(SRC_DIR, "app", "state", "AppLogicProvider.tsx"), "utf8");
const apptCase = providerSrc2.slice(providerSrc2.indexOf('case "appointment":'), providerSrc2.indexOf('case "quoteOwner"'));
ok(/setOwnerApptView\("active"\)/.test(apptCase), "randevu bildirimine tıklayınca da aktif sekme açılıyor");

// --- ANA SAYFA ÜST ÇUBUĞU: "Ara" düğmesi yerine panel + ayarlar ---------------------------------
// Yaşanan hata (kullanıcı bildirdi): giriş yapmış kullanıcıya ana sayfanın üst çubuğunda "Ara"
// (Suchen) yazan bir düğme çıkıyordu — adı boş olanlarda etiket olarak arama sekmesinin adı
// (navSearch) kullanılıyordu. Zaten arama kutusunun üstünde duran birine "Ara" demek anlamsızdı;
// asıl eksik olan kendi paneline ve ayarlarına dönebilmekti.
const landing = readFileSync(join(SRC_DIR, "components", "features", "LandingHome.tsx"), "utf8");
eq(/navSearch/.test(landing), false, "ana sayfa üst çubuğunda 'Ara' etiketi kalmadı");
ok(/onClick=\{goToMyPanel\}/.test(landing), "üst çubukta panele dönüş var");
ok(/onClick=\{goToMySettings\}/.test(landing), "üst çubukta ayarlar var");
ok(/aria-label=\{t\("settingsLabel"\)\}/.test(landing), "ayarlar düğmesinin erişilebilir adı var");
ok(/\{isAuthed \? \(/.test(landing), "bu iki yol yalnızca giriş yapmışlara gösteriliyor");

// Hedef ROLE göre değişiyor ve tek yerde duruyor — her üst çubukta yeniden yazılırsa biri
// er geç yanlış ekrana gider.
const panelFn = providerSrc2.slice(providerSrc2.indexOf("const goToMyPanel = () => {"), providerSrc2.indexOf("const goToMySettings"));
ok(panelFn.length > 0, "goToMyPanel tanımlı");
ok(/role === "mechanic"/.test(panelFn) && /setScreen\("mechanicDashboard"\)/.test(panelFn), "tamirci kendi paneline gidiyor");
ok(/setScreen\("owner"\)/.test(panelFn), "araç sahibi kendi panosuna gidiyor");
const setFn = providerSrc2.slice(providerSrc2.indexOf("const goToMySettings = () => {"), providerSrc2.indexOf("const goToMySettings = () => {") + 500);
ok(/setMechProfileTab\("settings"\)/.test(setFn), "tamirci ayarları doğru sekmeye gidiyor");
ok(/setScreen\("ownerSettings"\)/.test(setFn), "araç sahibi ayar ekranına gidiyor");
const i18nSrc = readFileSync(join(SRC_DIR, "data", "i18n.ts"), "utf8");
const panelLine = i18nSrc.split("\n").find((l) => l.trim().startsWith("backToPanelBtn:")) || "";
for (const lang of ["tr:", "en:", "de:"]) ok(panelLine.includes(lang), `panele dön etiketi ${lang} dilinde var`);

// --- ÖNİZLEMEDEN GERİ DÖNÜŞ -------------------------------------------------------------------
// Yaşanan hata (kullanıcı bildirdi): "önizleme"ye tıklayıp geri gelince alakasız bir ekran
// açılıyordu. Sebep: dönüş adresi SABİT "mechProfilePage" yazılmıştı, oysa düğme tamirci
// panelinin profil sekmesinde duruyor — kullanıcı hiç gitmediği bir sayfaya "geri" dönüyordu.
const providerSrc3 = readFileSync(join(SRC_DIR, "app", "state", "AppLogicProvider.tsx"), "utf8");
const previewFn = providerSrc3.slice(providerSrc3.indexOf("const previewMyProfile = () => {"), providerSrc3.indexOf("const tryAddService"));
eq(/openDetail\(myProfile, "mechProfilePage"\)/.test(previewFn), false, "sabit dönüş adresi kaldırıldı");
ok(/openDetail\(myProfile, screen\)/.test(previewFn), "dönüş adresi o an bulunulan ekran");
ok(/setDetailReturnTab\(/.test(previewFn), "dönüşte sekme de hatırlanıyor");
const detailBody = readFileSync(join(SRC_DIR, "components", "features", "MechDetailBody.tsx"), "utf8");
ok(/if \(detailReturnTab\?\.kind === "mechTab"\) setMechTab\(detailReturnTab\.value\)/.test(detailBody), "geri dönüşte panel sekmesi geri geliyor");
ok(/if \(detailReturnTab\?\.kind === "mechProfileTab"\) setMechProfileTab\(detailReturnTab\.value\)/.test(detailBody), "geri dönüşte profil sekmesi geri geliyor");

// --- KAYITLI ARAMA BİLDİRİMLERİ: sıklık ve iki rol ---------------------------------------------
ok(/const SAVED_SEARCH_INTERVALS = \{ instant: 0, daily: 24 \* 60 \* 60 \* 1000, weekly: 7 \* 24 \* 60 \* 60 \* 1000 \}/.test(providerSrc3),
  "anında/günlük/haftalık aralıkları tanımlı");
ok(/const setSavedSearchFrequency = \(id, frequency\)/.test(providerSrc3), "sıklık arama başına ayarlanabiliyor");
ok(/MY_OWNER_ID == null && MY_MECHANIC_ID == null/.test(providerSrc3), "bildirim iki rolde de çalışıyor");
ok(/pendingMatchIds/.test(providerSrc3), "beklemedeki eşleşmeler biriktiriliyor");
ok(/savedSearchMatchMany/.test(providerSrc3), "çoklu eşleşme tek özet bildirimde");
ok(/notifySavedSearches/.test(providerSrc3), "kendi bildirim ayarı var");

// Sıklık kararını çalıştır: süre dolmadan bildirim gitmemeli.
const DAY = 24 * 60 * 60 * 1000;
const dueNow = (freq, lastNotifiedAt, now) => {
  const interval = { instant: 0, daily: DAY, weekly: 7 * DAY }[freq] ?? 0;
  return interval === 0 || !lastNotifiedAt || (now - lastNotifiedAt) >= interval;
};
const T = 1_000_000_000_000;
eq(dueNow("instant", T - 1000, T), true, "anında her zaman gönderiliyor");
eq(dueNow("daily", T - 1000, T), false, "günlükte 1 saniye sonra gönderilmiyor");
eq(dueNow("daily", T - DAY, T), true, "günlükte 24 saat sonra gönderiliyor");
eq(dueNow("weekly", T - 3 * DAY, T), false, "haftalıkta 3 gün sonra gönderilmiyor");
eq(dueNow("weekly", T - 7 * DAY, T), true, "haftalıkta 7 gün sonra gönderiliyor");
eq(dueNow("daily", null, T), true, "hiç bildirim gitmediyse ilk seferde gönderiliyor");

const savedList = readFileSync(join(SRC_DIR, "components", "features", "SavedSearchList.tsx"), "utf8");
ok(/\["instant", "daily", "weekly", "off"\]\.map/.test(savedList), "dört seçenek de listede");
ok(/setSavedSearchFrequency\(s\.id, f\)/.test(savedList), "seçim kaydediliyor");
ok(/aria-pressed=\{freq === f\}/.test(savedList), "seçili sıklık ekran okuyucuya bildiriliyor");

report("gezinme");
