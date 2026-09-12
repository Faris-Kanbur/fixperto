// SABİT / DEĞİŞKEN FİYAT + "?" BİLGİ BALONCUĞU.
//
// YAŞANAN HATA (kullanıcı bildirdi): "Değişken"e tıklayınca "Sabit fiyat işaretlemeden önce bu
// hizmete bir fiyat girin." uyarısı çıkıyordu. Sebep: tek düğme vardı ve üzerinde MEVCUT durum
// yazıyordu — "Değişken" yazan düğmeye basmak aslında "sabite geçir" demekti. Fiyat vermek
// istemeyen tamirci, tam da istemediği şeyi yapmaya zorlanıyordu.
//
// Ayrıca "Değişken fiyat" ve "Diğer markalar" terimleri kullanıcıya hiçbir şey anlatmıyordu;
// ikisinin de yanına üstüne gelince açılan kısa bir açıklama balonu kondu.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, ok, report } from "./_harness.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const provider = read("frontend/src/app/state/AppLogicProvider.tsx");
const shell = read("frontend/src/app/AppShell.tsx");
const detail = read("frontend/src/components/features/MechDetailBody.tsx");
const infoTip = read("frontend/src/components/features/InfoTip.tsx");
const i18n = read("frontend/src/data/i18n.ts");

// --- 1) Mantık: hedef durumu alan fonksiyon ----------------------------------------------------
// Fonksiyonu kaynaktan çıkarıp gerçekten çalıştırıyoruz — "kod şöyle yazılmış" demek yetmez,
// DAVRANIŞIN doğru olduğunu görmek gerekir.
const fnStart = provider.indexOf("const setServiceFixed = (idx, fixed) => {");
ok(fnStart > 0, "setServiceFixed hedef durumu parametre olarak alıyor");
const fnSrc = provider.slice(fnStart, provider.indexOf("\n  };\n", fnStart) + 5);

function runToggle(service, target) {
  const toasts = [];
  const updates = [];
  const ctx = {
    myProfile: { services: [service] },
    setToast: (x) => toasts.push(x),
    updateService: (i, field, val) => updates.push([i, field, val]),
    t: (k) => k,
  };
  const fn = new Function("myProfile", "setToast", "updateService", "t",
    `${fnSrc} return setServiceFixed;`)(ctx.myProfile, ctx.setToast, ctx.updateService, ctx.t);
  fn(0, target);
  return { toasts, updates };
}

// ASIL VAKA: fiyatı olmayan bir hizmette "Değişken" seçmek serbest, uyarı YOK.
let r = runToggle({ name: "Kaporta", price: "", fixed: true }, false);
eq(r.toasts.length, 0, "fiyatsız hizmette Değişken seçmek uyarı çıkarmıyor");
eq(r.updates, [[0, "fixed", false]], "Değişken seçimi kaydediliyor");

// Zaten değişkense tekrar tıklamak da hiçbir uyarı üretmemeli.
r = runToggle({ name: "Kaporta", price: "", fixed: false }, false);
eq(r.toasts.length, 0, "zaten Değişken olan hizmette uyarı yok");
eq(r.updates.length, 0, "durum değişmediyse gereksiz kayıt yok");

// Sabit fiyat bir tutar gerektirir — uyarı YALNIZCA burada.
r = runToggle({ name: "Kaporta", price: "", fixed: false }, true);
eq(r.updates.length, 0, "fiyatsız hizmet Sabit yapılamıyor");
eq(r.toasts.length, 1, "Sabit seçilince uyarı çıkıyor");
ok(String(r.toasts[0].text).includes("fixedNeedsPriceToast"), "uyarı çevrilebilir anahtardan geliyor");

// Fiyat varsa Sabit serbest.
r = runToggle({ name: "Kaporta", price: "1200", fixed: false }, true);
eq(r.toasts.length, 0, "fiyatı olan hizmette Sabit uyarı çıkarmıyor");
eq(r.updates, [[0, "fixed", true]], "Sabit seçimi kaydediliyor");

// Eski tek-düğme davranışı geri gelmemeli.
eq(/toggleServiceFixed/.test(provider + shell), false, "eski tek düğmeli toggle kaldırıldı");
eq(/Sabit fiyat işaretlemeden önce/.test(provider), false, "eski sabit metin uyarı kaldırıldı");

// --- 2) Arayüz: iki AYRI seçenek ---------------------------------------------------------------
ok(/setServiceFixed\(i, true\)/.test(shell), "Sabit seçeneği ayrı düğme");
ok(/setServiceFixed\(i, false\)/.test(shell), "Değişken seçeneği ayrı düğme");
ok(/aria-pressed=\{!!s\.fixed\}/.test(shell), "seçili durum ekran okuyucuya bildiriliyor");
ok(/aria-pressed=\{!s\.fixed\}/.test(shell), "Değişken düğmesinin durumu da bildiriliyor");

// --- 3) Araç sahibi fiyatsız hizmeti GÖRÜYOR ---------------------------------------------------
// bookingServiceOptions tamircinin TÜM hizmetlerini basar; fiyatı boş olan elenmez.
const optStart = provider.indexOf("const bookingServiceOptions = useMemo(");
const optSrc = provider.slice(optStart, provider.indexOf("}, [", optStart));
ok(optStart > 0, "randevu hizmet listesi bulundu");
eq(/filter\([^)]*price/.test(optSrc), false, "fiyatı boş hizmet randevu listesinden elenmiyor");
ok(/\{s\.fixed \? t\("fixedPriceBadge"\) : t\("variableLabel"\)\}/.test(shell), "randevu listesinde fiyat türü rozeti var");

// --- 4) "?" ipucu: değişken fiyat ve diğer markalar --------------------------------------------
ok(/<InfoTip inline text=\{t\("variablePriceTip"\)\}/.test(shell), "değişken fiyat rozetinin yanında ipucu var");
ok(/InfoTip text=\{t\("variablePriceTip"\)\}/.test(shell), "tamircinin Sabit/Değişken seçiminde de ipucu var");
ok(/InfoTip text=\{t\("otherBrandsTip"\)\}/.test(detail), "Markaya göre fiyat başlığında ipucu var");

// Hizmet satırı bir <button>; iç içe düğme geçersiz HTML olurdu.
ok(/{!s\.fixed && <InfoTip inline/.test(shell), "düğme içindeki ipucu inline biçimde");
ok(/if \(inline\)/.test(infoTip), "InfoTip inline biçimi ayrı dallanıyor");
ok(/<span className=\{mark\} title=\{text\}/.test(infoTip), "inline biçim span basıyor, düğme değil");
ok(/aria-label=\{label\}/.test(infoTip), "ipucunun erişilebilir adı var");
ok(/onFocus=/.test(infoTip) && /onBlur=/.test(infoTip), "klavye odağıyla da açılıyor");
ok(/onClick=/.test(infoTip), "dokunmatik için tıklamayla da açılıyor");
ok(/role="tooltip"/.test(infoTip), "balon tooltip rolüyle işaretli");

// YAŞANAN HATA (kullanıcı bildirdi): "bazen yazının arkasında kalıyor, metin okunmuyor".
// Balon, absolute olarak komşu kapsayıcının içindeydi: overflow'lu her ata onu KIRPIYOR
// (randevu hizmet listesi max-h + overflow-y-auto, tamirci hizmet kutusu overflow-hidden) ve
// yeni bir yığın bağlamı açan her ata onu komşu metnin ARKASINDA bırakıyordu.
ok(/createPortal\(/.test(infoTip), "balon portalla body'ye basılıyor (overflow kırpması biter)");
ok(/document\.body,/.test(infoTip), "portalın hedefi body");
ok(/position: "fixed"/.test(infoTip), "balon ekran koordinatına sabitleniyor");
ok(/getBoundingClientRect\(\)/.test(infoTip), "konum '?' işaretinin gerçek yerinden hesaplanıyor");
ok(/z-\[95\]/.test(infoTip), "balon en üst katmanda");
eq(/absolute z-30 bottom-full/.test(infoTip), false, "eski absolute konumlandırma kaldırıldı");
// Metnin TAMAMI okunabilmeli: ekrandan taşmamalı, uzun kelime bölünmeli, satır kısıtı olmamalı.
ok(/Math\.min\(TIP_MAX_W, window\.innerWidth - EDGE \* 2\)/.test(infoTip), "genişlik dar ekrana uyduruluyor");
ok(/Math\.max\(EDGE, Math\.min\(left, window\.innerWidth - width - EDGE\)\)/.test(infoTip), "sağa/sola taşma ekran içine çekiliyor");
ok(/const below = r\.top < estH \+ TIP_GAP/.test(infoTip), "üstte yer yoksa balon alta açılıyor");
ok(/break-words/.test(infoTip), "uzun kelimeler bölünüyor");
eq(/line-clamp|truncate|max-h-/.test(infoTip), false, "balon metni kırpılmıyor");
// Fixed konum kaydırınca bayatlar; balon kapanmalı (iç kapsayıcı kaydırması dahil → capture).
ok(/addEventListener\("scroll", close, true\)/.test(infoTip), "kaydırınca balon kapanıyor");
ok(/addEventListener\("resize", close\)/.test(infoTip), "pencere boyutlanınca balon kapanıyor");
ok(/removeEventListener\("scroll", close, true\)/.test(infoTip), "dinleyiciler temizleniyor");
// Seçili (koyu zeminli) satırda da okunur kalmalı.
ok(/border-current/.test(infoTip), "'?' işareti rengini bulunduğu yerden alıyor");
// KURAL 8: bileşen modül düzeyinde tanımlı olmalı (render içinde değil).
ok(/^export function InfoTip/m.test(infoTip), "InfoTip modül düzeyinde tanımlı");

// --- 5) Metinler üç dilde ve anlamlı ------------------------------------------------------------
for (const key of ["variablePriceTip", "otherBrandsTip", "infoTipAria", "fixedNeedsPriceToast", "fixedLabelShort"]) {
  const line = i18n.split("\n").find((l) => l.trim().startsWith(`${key}:`)) || "";
  ok(line.length > 0, `${key} tanımlı`);
  for (const lang of ["tr:", "en:", "de:"]) ok(line.includes(lang), `${key} ${lang} dilinde var`);
}
// Balon metni gerçekten AÇIKLAMA olmalı, tek kelimelik etiket değil.
const tipLine = i18n.split("\n").find((l) => l.trim().startsWith("variablePriceTip:")) || "";
ok(tipLine.length > 300, "değişken fiyat açıklaması birkaç cümle");
// Kaldırılan ön ödeme özelliği hiçbir ipucunda anlatılmamalı (bkz. telefon takımı, 5. madde).
for (const key of ["variablePriceTip", "otherBrandsTip", "fixedPriceHelpTitle"]) {
  const line = i18n.split("\n").find((l) => l.trim().startsWith(`${key}:`)) || "";
  eq(/randevu alırken ödeyebilir|pay when booking|bei der Buchung bezahlen/i.test(line), false,
    `${key} kaldırılan ön ödemeden söz etmiyor`);
}

// Yeni hizmet ekleme formu da aynı desende — orada da tek düğme vardı.
ok(/setNewServiceForm\(f => \(\{ \.\.\.f, fixed: true, fixedTouched: true \}\)\)/.test(shell), "yeni hizmet formunda Sabit ayrı düğme");
ok(/setNewServiceForm\(f => \(\{ \.\.\.f, fixed: false, fixedTouched: true \}\)\)/.test(shell), "yeni hizmet formunda Değişken ayrı düğme");
eq(/fixed: !f\.fixed/.test(shell), false, "yeni hizmet formundaki tek düğmeli toggle kaldırıldı");
for (const key of ["fixedPricePrepayNote"]) {
  const line = i18n.split("\n").find((l) => l.trim().startsWith(`${key}:`)) || "";
  eq(/önceden ödeyebilir|pay in advance|im Voraus bezahlen/i.test(line), false, `${key} kaldırılan ön ödemeden söz etmiyor`);
}

// --- UZUN HİZMET LİSTESİ: "tümünü gör" sayfayı metrelerce uzatmıyor ----------------------------
// Yaşanan hata (kullanıcı bildirdi): 6 hizmet gösterilip "tümünü gör" deniyordu; 50 hizmeti olan
// bir tamircide liste olduğu gibi açılıyor, altındaki çalışma saatleri ve yorumlar erişilemez
// hâle geliyordu. Açık hâlde 10 satır görünüyor, gerisi kutunun KENDİ İÇİNDE kaydırılıyor.
ok(/const SERVICE_PREVIEW = 6;/.test(detail), "kapalı önizleme 6 hizmet");
ok(/const SERVICE_SCROLL_ROWS = 10;/.test(detail), "açık hâlde 10 satır tavanı var");
ok(/const servicesScroll = showAllServices && services\.length > SERVICE_SCROLL_ROWS;/.test(detail),
  "kaydırma yalnızca 10'dan fazla hizmet varken devreye giriyor");
ok(/maxHeight: SERVICE_SCROLL_ROWS \* SERVICE_ROW_PX/.test(detail), "yükseklik satır sayısından hesaplanıyor");
ok(/servicesScroll \? "overflow-y-auto" : "overflow-hidden"/.test(detail), "tavan aşılınca kutu kendi içinde kayıyor");
ok(/mechServicesScrollNote/.test(detail), "kaydırılabildiği kullanıcıya yazıyla da bildiriliyor");

// Sınır davranışı: 10 ve altı hizmette kaydırma kutusu AÇILMAMALI — gereksiz bir kutu, düz
// listeden daha kötüdür. Sabiti ve koşulu kaynaktan okuyup gerçekten çalıştırıyoruz.
const rowsConst = Number((detail.match(/const SERVICE_SCROLL_ROWS = (\d+);/) || [])[1]);
const condLine = detail.slice(detail.indexOf("const servicesScroll ="));
const scrollOn = new Function("showAllServices", "services", "SERVICE_SCROLL_ROWS",
  `${condLine.slice(0, condLine.indexOf("\n") + 1)} return servicesScroll;`);
const check = (n, open) => scrollOn(open, { length: n }, rowsConst);
eq(rowsConst, 10, "tavan 10 satır");
eq(check(10, true), false, "tam 10 hizmette kaydırma yok");
eq(check(11, true), true, "11 hizmette kaydırma var");
eq(check(50, false), false, "liste kapalıyken kaydırma yok");

const i18nScrollLine = i18n.split("\n").find((l) => l.trim().startsWith("mechServicesScrollNote:")) || "";
for (const lang of ["tr:", "en:", "de:"]) ok(i18nScrollLine.includes(lang), `kaydırma notu ${lang} dilinde var`);
ok(/\{shown\}/.test(i18nScrollLine) && /\{total\}/.test(i18nScrollLine), "notta görünen/toplam sayıları yer tutucudan geliyor");

report("hizmet fiyatı");
