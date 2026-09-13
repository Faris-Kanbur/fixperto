/**
 * BİLEŞENLERİ GERÇEKTEN ÇİZEN TESTLER.
 * ------------------------------------------------------------------------------------------------
 * Buraya kadarki arayüz denetimi kaynak kodu okuyordu. Bu takım bileşenlerin KENDİ KODUNU
 * çalıştırıyor ve ürettiği HTML'e bakıyor: koşullar doğru dalı seçiyor mu, çeviri anahtarı
 * gerçekten sözlükte var mı, bileşen belirli girdilerde çöküyor mu.
 *
 * DÜRÜST SINIR: bu bir tarayıcı değil. Tıklama, odak, kaydırma, CSS ve portal yerleşimi burada
 * ölçülmüyor. Ölçülen şey ilk çizim.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { setAppState, missingKeys } from "./app-stub.mjs";

let passed = 0;
const failures = [];
const ok = (v, name) => { if (v) passed++; else failures.push(name); };
const eqJson = (a, b, name) => ok(JSON.stringify(a) === JSON.stringify(b), `${name} — beklenen ${JSON.stringify(b)}, gelen ${JSON.stringify(a)}`);
const has = (html, text, name) => ok(html.includes(text), `${name} — "${text}" çıktıda yok`);
const hasNot = (html, text, name) => ok(!html.includes(text), `${name} — "${text}" çıktıda OLMAMALIYDI`);

/** Bileşeni çiz; çökerse testi düşür ama diğerlerini çalıştırmaya devam et. */
function render(Component, props = {}, state = {}) {
  setAppState(state);
  try { return renderToStaticMarkup(createElement(Component, props)); }
  catch (err) { failures.push(`ÇİZİM ÇÖKTÜ: ${Component.name || "bileşen"} — ${err.message}`); return ""; }
}

const BASE = {
  lang: "tr", favoriteIds: [], favoriteMechanicIds: [], likedReviewIds: [], notifLog: [],
  mechanicsList: [], listings: [], careerPosts: [], blogPosts: [], savedSearches: [],
};

// ---------------------------------------------------------------- 1) Durum takibi
const { StatusTracker } = await import("../../frontend/src/components/features/StatusTracker.tsx");
const done = render(StatusTracker, { status: "Tamamlandı", autoAccepted: false }, BASE);
ok(done.length > 0, "StatusTracker çiziliyor");
const waiting = render(StatusTracker, { status: "Onay Bekliyor", autoAccepted: false }, BASE);
ok(waiting !== done, "farklı durum FARKLI çıktı üretiyor (koşullar gerçekten çalışıyor)");
// Otomatik kabul eden tamircide "onay bekleniyor" adımı olmamalı — bu bir mantık dalı, metin değil.
const auto = render(StatusTracker, { status: "Onaylandı", autoAccepted: true }, BASE);
ok(auto !== render(StatusTracker, { status: "Onaylandı", autoAccepted: false }, BASE),
  "otomatik kabul farklı bir adım listesi gösteriyor");

// ---------------------------------------------------------------- 2) İş ilanı kartı
const { JobCard } = await import("../../frontend/src/components/features/JobCard.tsx");
const JOB = { id: 1, title: "Usta Aranıyor", mechanicName: "Test Oto", location: "İzmir",
  employmentType: "Tam Zamanlı", experienceLevel: "1-3 Yıl", applicants: [], postedDate: "2026-01-01" };
const job = render(JobCard, { j: JOB }, BASE);
has(job, "Usta Aranıyor", "iş ilanı başlığı çiziliyor");
has(job, "İzmir", "konum çiziliyor");
has(job, "Tam Zamanlı", "çalışma türü Türkçe etiketle çiziliyor");

// ---------------------------------------------------------------- 3) Bilgi baloncuğu (InfoTip)
// Kullanıcının bildirdiği hata buradaydı: "?" simgesine basınca çıkan metin bazen arkada kalıyordu.
// Çözüm portal + sabit konumlandırmaydı. Burada doğruladığımız şey: kapalıyken metin DOM'a hiç
// basılmıyor (yani arkada kalan bir kalıntı yok) ve tetikleyici erişilebilir bir düğme.
const { InfoTip } = await import("../../frontend/src/components/features/InfoTip.tsx");
const tip = render(InfoTip, { text: "GİZLİ AÇIKLAMA", label: "Bilgi" }, BASE);
has(tip, "<button", "InfoTip tetikleyicisi bir düğme (klavyeyle erişilebilir)");
hasNot(tip, "GİZLİ AÇIKLAMA", "kapalıyken açıklama metni DOM'a basılmıyor");
ok(/aria-label|aria-expanded/.test(tip), "tetikleyicinin erişilebilirlik bilgisi var");

// ---------------------------------------------------------------- 4) Sohbet balonu ve çeviri
const { ChatBubble } = await import("../../frontend/src/components/features/ChatBubble.tsx");
const mine = render(ChatBubble, { msg: { id: 1, text: "Merhaba", lang: "tr", from: "me" }, viewerLang: "tr", mine: true }, BASE);
has(mine, "Merhaba", "mesaj metni çiziliyor");
const foreign = render(ChatBubble, { msg: { id: 2, text: "Hello", lang: "en", from: "them" }, viewerLang: "tr", mine: false }, BASE);
ok(foreign !== mine, "karşı tarafın mesajı farklı çiziliyor");

// ---------------------------------------------------------------- 5) Boş/eksik veri dayanıklılığı
// Gerçek hataların çoğu "veri henüz gelmedi" ya da "alan boş" durumunda çıkıyor.
const { SkeletonCard } = await import("../../frontend/src/components/features/SkeletonCard.tsx");
ok(render(SkeletonCard, {}, BASE).length > 0, "yükleniyor iskeleti çiziliyor");
// GERÇEK HATA (bu testle bulundu): applicants null geldiğinde kart `j.applicants.length` ile
// çöküyordu. Tek bir bozuk kayıt bütün listeyi beyaz ekrana çeviriyordu.
ok(render(JobCard, { j: { id: 2, title: "", applicants: null } }, BASE) !== "", "applicants null iken kart ÇÖKMÜYOR");
ok(render(JobCard, { j: { id: 3 } }, BASE) !== "", "tamamen boş iş ilanı kaydı çökmüyor");
ok(render(StatusTracker, { status: undefined }, BASE) !== "" || failures.length === 0, "durumu olmayan takip çökmüyor");

// ---------------------------------------------------------------- 6) Dil gerçekten değişiyor mu
const trJob = render(JobCard, { j: JOB }, { ...BASE, lang: "tr" });
const deJob = render(JobCard, { j: JOB }, { ...BASE, lang: "de" });
ok(trJob !== deJob, "dil değişince çıktı GERÇEKTEN değişiyor (çeviri bağlı)");
has(deJob, "Vollzeit", "Almanca'da çalışma türü Almanca etiketle çiziliyor");
hasNot(deJob, "Tam Zamanlı", "Almanca çıktıda Türkçe etiket kalmıyor");

// ---------------------------------------------------------------- 6b) KISMİ EŞLEŞME PUANLAYICISI
/**
 * "Kriterlere uyan yok" ekranında gösterilen "bunlar ilgini çekebilir" listesinin kuralları.
 * Saf bir işlev olduğu için burada GERÇEKTEN çalıştırılıyor — regex ile kaynağa bakmak,
 * sıralamanın doğru olduğunu söylemez.
 */
const { scoreNearMisses } = await import("../../frontend/src/utils/helpers.ts");
const crit = (key, pred) => ({ key, label: key, value: key, test: pred });
const CARS = [
  { id: 1, brand: "BMW", fuelType: "Dizel", city: "İzmir" },   // 3/3 — tam eşleşme
  { id: 2, brand: "BMW", fuelType: "Dizel", city: "Bursa" },   // 2/3
  { id: 3, brand: "BMW", fuelType: "Benzin", city: "Ankara" }, // 1/3
  { id: 4, brand: "Fiat", fuelType: "Benzin", city: "Ankara" },// 0/3
];
const CRITERIA = [
  crit("brand", (x) => x.brand === "BMW"),
  crit("fuelType", (x) => x.fuelType === "Dizel"),
  crit("city", (x) => x.city === "İzmir"),
];
const nm = scoreNearMisses(CARS, CRITERIA);
eqJson(nm.items.map((x) => x.item.id), [2, 3], "yalnızca KISMİ eşleşenler, en çok tutan üstte");
eqJson(nm.criteriaCount, 3, "kriter sayısı bildiriliyor");
eqJson(nm.items[0].hit, 2, "tutan kriter sayısı doğru");
eqJson(nm.items[0].missed.map((m) => m.key), ["city"], "uymayan kriter adıyla veriliyor (kullanıcıya gösterilecek)");
eqJson(nm.items.some((x) => x.item.id === 1), false, "TAM eşleşen bu listede yok (o zaten normal sonuç)");
eqJson(nm.items.some((x) => x.item.id === 4), false, "hiçbir kriteri tutmayan gösterilmiyor (rastgele liste olurdu)");
// Tek kriter varsa "kısmen uydu" diye bir şey yoktur — o durumda doğru cevap "bu kriteri kaldır".
eqJson(scoreNearMisses(CARS, [CRITERIA[0]]).items.length, 0, "tek kriterde kısmi eşleşme gösterilmiyor");
eqJson(scoreNearMisses(CARS, []).items.length, 0, "kriter yokken boş dönüyor");
eqJson(scoreNearMisses(CARS, CRITERIA, 1).items.length, 1, "üst sınıra uyuluyor");
eqJson(scoreNearMisses(null, CRITERIA).items.length, 0, "bozuk girdide çökmüyor");

// ---------------------------------------------------------------- 7) TOPLU ÇİZİM TARAMASI
/**
 * Her bileşeni BOŞ veri ile bir kez çiziyoruz. Amaç doğruluk değil DAYANIKLILIK: React'te tek bir
 * bileşenin çizim sırasında atması bütün ağacı düşürür — kullanıcı beyaz ekran görür. "Veri henüz
 * gelmedi", "alan boş", "dizi null" durumları gerçek hayatta sürekli oluyor ve bu sınıf hatanın
 * ilki bu taramayla bulundu (JobCard, applicants null).
 *
 * Beklenen prop'u olmayan bileşenler doğal olarak farklı davranır; bu yüzden tek şart:
 * ÇÖKMEMEK. Çöken bileşen isimleriyle raporlanıyor.
 */
const { readdirSync, readFileSync } = await import("node:fs");
const { join, dirname } = await import("node:path");
const { fileURLToPath } = await import("node:url");
const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "frontend", "src", "components");

// Bağlamdan (useApp) gelen ve bileşenlerin DİZİ olarak kullandığı değerler. Taklit varsayılan
// olarak işlev döndürüyor; dizi bekleyen yerde bu "map is not a function" olurdu — o testin
// bulduğu bir hata değil, taklitte eksiklik olurdu.
const SWEEP_STATE = {
  ...BASE, compareListingIds: [], jobListings: [], myQuoteRequests: [], conversations: [],
  appointments: [], quoteOffers: [], notifications: [], services: [], staff: [], reviewList: [],
  filteredMechanics: [], filteredListings: [], testimonials: [], vehicles: [], smsLog: [],
  // Bağlamdan gelen VERİ ÜRETEN işlevler: taklit varsayılanı undefined döndürür, oysa bunlar
  // her zaman dizi döndürüyor.
  bookableSlots: () => [], isDayOpenForMechanic: () => true, searchGuidance: () => null,
  offerButtonState: () => ({ disabled: false, labelKey: "makeOffer" }), similarListings: () => [],
  // "Şu an seçili kayıt" değerleri: taklit bilinmeyen anahtarlar için işlev döndürüyor ve işlev
  // truthy'dir — açıkça null vermezsek bileşen "seçili sohbet/ilan var" dalına girer ve gerçekte
  // oluşmayacak bir çökme raporlanır. Taramanın sınandığı senaryo "hiçbir şey seçili değil".
  convo: null, activeConvo: null, toast: null, confirmDialog: null,
  // Detay sayfaları ancak bir kayıt seçiliyken çiziliyor; onlara BOŞ KAYIT veriyoruz — sınanan
  // senaryo "kayıt var ama alanları eksik", ki kısmi API yanıtında gerçekten olan budur.
  selectedMechanic: {}, selectedListing: {}, selectedJob: {}, selectedVehicle: {}, blogPost: {},
};

const crashed = [];
let sweptComponents = 0;
for (const dir of ["features", "ui"]) {
  for (const file of readdirSync(join(UI_ROOT, dir)).filter((f) => f.endsWith(".tsx"))) {
    const src = readFileSync(join(UI_ROOT, dir, file), "utf8");
    const mod = await import(join(UI_ROOT, dir, file));
    for (const [name, Comp] of Object.entries(mod)) {
      if (typeof Comp !== "function" || !/^[A-Z]/.test(name)) continue;
      // Bileşenin BEKLEDİĞİ prop adlarını kaynaktan okuyup her birine BOŞ NESNE veriyoruz.
      // Sınanan senaryo: "kayıt var ama alanları boş" — API kısmi veri döndüğünde olan tam da bu.
      const sig = new RegExp(`(?:export )?(?:function|const) ${name}\\s*[=(]\\s*(?:\\()?\\{([^}]*)\\}`).exec(src);
      const props = {};
      for (const raw of (sig?.[1] || "").split(",")) {
        // VARSAYILANI OLAN prop'a (ör. `emptyText = null`) hiç dokunmuyoruz: bileşen o durumu
        // zaten düşünmüş, üstüne bir şey yazmak testin kendi kurduğu yapay bir hata olurdu.
        if (raw.includes("=")) continue;
        const key = raw.split(":")[0].trim();
        if (!key || !/^[a-zA-Z_$][\w$]*$/.test(key)) continue;
        // Prop'un TÜRÜNÜ adından tahmin ediyoruz. Amaç bileşeni kandırmak değil, "bu alan boş"
        // senaryosunu doğru şekilde kurmak: bir diziye {} vermek bileşenin hatası değil, testin
        // hatası olurdu.
        if (key === "children") props[key] = null;
        else if (/^(items|options|records|photos|list|rows|data|slots|tags|values)$/.test(key) || /s$/.test(key) && !/(status|address|progress)$/.test(key)) props[key] = [];
        else if (/^(date|day|selectedDate|month)$/i.test(key)) props[key] = new Date("2026-01-01");
        else if (/^(text|label|title|value|placeholder|name)$/.test(key)) props[key] = "";
        else props[key] = {};
      }
      sweptComponents++;
      setAppState(SWEEP_STATE);
      try { renderToStaticMarkup(createElement(Comp, props)); }
      catch (err) {
        // Yığın izinin İLK satırı hangi satırda çöktüğünü söylüyor; çıplak mesaj çoğu zaman
        // hatayı bulmaya yetmiyordu.
        const where = (err.stack || "").split("\n").find((l) => l.includes(".tsx:")) || "";
        crashed.push(`${dir}/${file}:${name} — ${err.message}${where ? `\n        ${where.trim()}` : ""}`);
      }
    }
  }
}
ok(sweptComponents > 40, `taramada yeterli bileşen var (${sweptComponents})`);
ok(crashed.length === 0, `boş veriyle çöken bileşenler:\n      ${crashed.join("\n      ")}`);

// ---------------------------------------------------------------- 7) Var olmayan çeviri anahtarı
ok(missingKeys.size === 0, `sözlükte olmayan çeviri anahtarı kullanılmış: ${[...missingKeys].join(", ")}`);

if (failures.length === 0) {
  console.log(`OK arayüz çizimi (${passed})`);
  process.exit(0);
}
console.log(`BAŞARISIZ arayüz çizimi — ${failures.length}/${passed + failures.length}`);
for (const f of failures) console.log("  ✗ " + f);
process.exit(1);
