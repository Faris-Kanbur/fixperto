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

// ---------------------------------------------------------------- 5b) BOŞ SERVİS GEÇMİŞİ AÇIKLAMASI
/**
 * "Kayıt bulunamadı" tek başına yanıltıcıydı: alıcı bunu "geçmişi temiz" ya da tersine
 * "bakımsız araç" diye okuyabilir. İkisi de bizim veremeyeceğimiz bir yargı. Test, boş durumda
 * SEBEBİN ve "bu bir yargı değildir" uyarısının gerçekten basıldığını doğruluyor.
 */
const { VerifiedHistoryList } = await import("../../frontend/src/components/features/VehicleHistoryPanel.tsx");
const emptyHist = render(VerifiedHistoryList, { records: [], emptyText: "Kayıt yok" }, BASE);
has(emptyHist, "Kayıt yok", "boş geçmişte başlık basılıyor");
has(emptyHist, "Fixperto dışında", "boş geçmişin SEBEBİ açıklanıyor");
has(emptyHist, "bakımsız", "boş geçmiş bir yargı DEĞİL diye uyarılıyor");
// emptyText verilmediyse (bileşen bir liste içinde kullanılıyorsa) hiçbir şey basmamalı.
eqJson(render(VerifiedHistoryList, { records: [], emptyText: null }, BASE), "", "emptyText yoksa sessiz");
const fullHist = render(VerifiedHistoryList, { records: [{ id: 1, serviceText: "Yağ değişimi", serviceDate: "2026-01-02", mechanicName: "Test Oto" }] }, BASE);
has(fullHist, "Yağ değişimi", "kayıt varsa liste basılıyor");
hasNot(fullHist, "bakımsız", "kayıt varken boş durum açıklaması çıkmıyor");

// ---------------------------------------------------------------- 5c) EMOJİ SEÇİCİ
const { EmojiPicker } = await import("../../frontend/src/components/features/EmojiPicker.tsx");
const picker = render(EmojiPicker, { onPick: () => {} }, BASE);
has(picker, "<button", "emoji düğmesi gerçek bir düğme (klavyeyle erişilebilir)");
has(picker, "aria-expanded=\"false\"", "kapalı durumu ekran okuyucuya bildiriliyor");
hasNot(picker, "🚗", "panel kapalıyken emojiler DOM'a basılmıyor");

// ---------------------------------------------------------------- 5d) KAYITLI ARAMA DÜZENLEME
const { SavedSearchEditModal } = await import("../../frontend/src/components/features/SavedSearchEditModal.tsx");
eqJson(render(SavedSearchEditModal, {}, { ...BASE, editingSavedSearch: null }), "",
  "düzenlenen arama yokken pencere hiç çizilmiyor");

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

// ---------------------------------------------------------------- 6b) FİYATIN PİYASADAKİ YERİ
/**
 * Kullanıcı isteği: randevu alırken bu tamircinin fiyatının diğerlerine göre nerede durduğu
 * görünsün. İşlev SAF olduğu için burada gerçekten çağrılıp sonucu ölçülüyor.
 *
 * BU TESTİN ASIL DERDİ: karşılaştırmanın YAPILMADIĞI durumlar. Yanlış bir "çok iyi" etiketi
 * kullanıcıyı yanlış tamirciye gönderir ve tamirciye de haksızlık eder; hiç etiket göstermemek
 * her zaman daha iyidir. O yüzden testlerin yarısı "null dönüyor mu" diye soruyor.
 */
/**
 * Tohum verisini OKUYAN yardımcılar. Neden kaynak dosyayı ayrıştırıyorum: seed.js sunucu tarafı
 * bir modül ve better-sqlite3'e bağlı; burada içe alınamıyor. Ama karşılaştırmanın bugünkü veride
 * ne kadar çıktığı GERÇEK veriyle ölçülmeli — uydurma bir havuzla ölçmek, tam olarak kaçınmak
 * istediğim şey olurdu.
 */
function readFileSyncForSeed() {
  const { readFileSync: rf } = require_fs;
  return rf(seedPath, "utf8");
}
function parseSeedMechanics(src) {
  const out = [];
  let id = 100;
  for (const block of [...src.matchAll(/services:\s*(\[[^\n]*\])/g)].map((m) => m[1])) {
    const services = [];
    for (const m of block.matchAll(/\{\s*key:\s*"([a-z_]+)"[^}]*?price:\s*"([^"]*)"[^}]*?fixed:\s*(true|false)/g)) {
      services.push({ key: m[1], price: m[2], fixed: m[3] === "true" });
    }
    if (services.length > 0) out.push({ id: id++, services });
  }
  return out;
}
const require_fs = await import("node:fs");
const seedPath = (await import("node:path")).join(
  (await import("node:path")).dirname((await import("node:url")).fileURLToPath(import.meta.url)),
  "..", "..", "backend", "db", "seed.js",
);

const { comparePriceToMarket, medianOf, PRICE_COMPARE_MIN_SAMPLE } =
  await import("../../frontend/src/utils/helpers.ts");

// --- medyan: aykırı değere dayanıklı mı (ortalama yerine medyan seçmenin bütün sebebi) ---
eqJson(medianOf([300, 300, 300]), 300, "üç eşit fiyatın medyanı");
eqJson(medianOf([200, 300, 400]), 300, "tek sayıda elemanda ortadaki");
eqJson(medianOf([200, 300, 400, 500]), 350, "çift sayıda elemanda ortadaki ikisinin ortası");
/**
 * ORTALAMA vs MEDYAN — sayıyla gösteriyorum, çünkü bu kararın tamamı buna dayanıyor.
 * Üç tamirci 300₺ isterken dördüncüsü 5.000₺ yazarsa: ortalama 1.475₺, medyan 300₺.
 * Ortalamayla karşılaştırırsak 300₺'lik fiyat "piyasanın belirgin altında" görünür — oysa
 * piyasanın ortası hâlâ 300₺ ve o fiyat tam ortalama. Medyan bu bozulmayı yaşamıyor.
 */
{
  const withOutlier = [300, 300, 300, 5000];
  const mean = Math.round(withOutlier.reduce((a, b) => a + b, 0) / withOutlier.length);
  eqJson(mean, 1475, "tek aykırı değer ortalamayı 1475'e çekiyor");
  eqJson(medianOf(withOutlier), 300, "aynı veride medyan 300'de kalıyor (aykırı değere dayanıklı)");
}
eqJson(medianOf([]), null, "boş dizide medyan yok");
eqJson(medianOf([0, -5, 300]), 300, "sıfır ve negatif fiyatlar sayılmıyor");

// --- Yardımcı: tamirci havuzu kur ---
const shop = (id, key, price, extra = {}) => ({ id, services: [{ key, name: key, price, fixed: true, ...extra }] });
const compare = (myPrice, others, opts = {}) => comparePriceToMarket({
  serviceKey: "oil_change",
  service: { key: "oil_change", price: myPrice, fixed: true, ...(opts.myExtra || {}) },
  mechanics: others,
  excludeMechanicId: 1,
  brand: opts.brand || null,
});

// --- KARŞILAŞTIRMA YAPILMAYAN DURUMLAR (testlerin ağırlık merkezi) ---
{
  const pool = [shop(2, "oil_change", "300"), shop(3, "oil_change", "300"), shop(4, "oil_change", "300")];
  eqJson(comparePriceToMarket({ serviceKey: null, service: { price: "300", fixed: true }, mechanics: pool, excludeMechanicId: 1 }), null,
    "katalog anahtarı YOKSA karşılaştırma yok (serbest metin hizmet aynı işi mi anlatıyor bilinmiyor)");
  eqJson(compare("", pool)?.level ?? null, null, "kendi fiyatı yoksa karşılaştırma yok");
  eqJson(compare("300", pool, { myExtra: { fixed: false } })?.level ?? null, null,
    "kendi fiyatı DEĞİŞKENSE karşılaştırma yok (değişken fiyat, fiyat değildir)");
  // Örneklem eşiği: 2 tamirci yeterli değil.
  const two = [shop(2, "oil_change", "300"), shop(3, "oil_change", "300")];
  eqJson(compare("300", two).level, null, `${PRICE_COMPARE_MIN_SAMPLE}'ün altında örneklemde seviye YOK`);
  eqJson(compare("300", two).sampleSize, 2, "yetersiz örneklemde sayı yine bildiriliyor (sessizce kaybolmuyor)");
  // Havuzdaki DEĞİŞKEN fiyatlar örnekleme sayılmamalı.
  const mixed = [shop(2, "oil_change", "300"), shop(3, "oil_change", "300"), shop(4, "oil_change", "300", { fixed: false })];
  eqJson(compare("300", mixed).level, null, "havuzdaki değişken fiyatlı tamirci örnekleme SAYILMIYOR");
  // Başka hizmet veren tamirciler sayılmamalı.
  const otherService = [shop(2, "brake_pads", "300"), shop(3, "brake_pads", "300"), shop(4, "brake_pads", "300")];
  eqJson(compare("300", otherService).level, null, "farklı hizmet veren tamirciler havuza girmiyor");
  // Kendisi havuzdan çıkarılıyor: aksi halde her tamirci kendini de sayardı.
  const withSelf = [shop(1, "oil_change", "9999"), shop(2, "oil_change", "300"), shop(3, "oil_change", "300"), shop(4, "oil_change", "300")];
  eqJson(compare("300", withSelf).sampleSize, 3, "tamircinin KENDİSİ havuzdan çıkarılıyor");
  eqJson(compare("300", withSelf).median, 300, "kendi fiyatı medyanı etkilemiyor");
}

// --- SEVİYELER: eşikler gerçekten ayırıyor mu ---
{
  const pool = [shop(2, "oil_change", "400"), shop(3, "oil_change", "400"), shop(4, "oil_change", "400")];
  const level = (p) => compare(String(p), pool).level;
  eqJson(compare("400", pool).median, 400, "medyan 400");
  eqJson(level(400), "average", "medyanla aynı fiyat: ortalama");
  eqJson(level(410), "average", "%2,5 üstü: hâlâ ortalama (olmayan farkı varmış gibi göstermiyoruz)");
  eqJson(level(390), "average", "%2,5 altı: hâlâ ortalama");
  eqJson(level(360), "good", "%10 altı: iyi");
  eqJson(level(300), "veryGood", "%25 altı: çok iyi");
  eqJson(level(440), "aboveAverage", "%10 üstü: ortalamanın üstünde");
  eqJson(level(600), "high", "%50 üstü: yüksek");
  // Sınır değerleri tam olarak nereye düşüyor — eşik kayarsa test söyler.
  eqJson(level(320), "veryGood", "tam %20 altı sınırı 'çok iyi' tarafında");
  eqJson(level(380), "good", "tam %5 altı sınırı 'iyi' tarafında");
  eqJson(level(420), "average", "tam %5 üstü sınırı 'ortalama' tarafında");
  /**
   * SINIR YÖNÜ: eşikler `<=` ile karşılaştırılıyor, yani sınır değeri ALT banda düşüyor.
   * İlk yazdığımda "tam %25 üstü yüksek olmalı" diye varsaymıştım ve test haklı olarak kırıldı.
   * Kodun davranışı tutarlı (0,8 → çok iyi, 0,95 → iyi, 1,05 → ortalama, 1,25 → üstünde) ve
   * kullanıcı lehine olan yön bu: sınırda olan bir fiyatı daha ağır etikete atmıyoruz.
   */
  eqJson(level(500), "aboveAverage", "tam %25 üstü sınırı ALT bantta ('üstünde', 'yüksek' değil)");
  eqJson(level(501), "high", "sınırın bir lira üstü 'yüksek'");
}

// --- MARKA FİYATI TUTARLI KULLANILIYOR MU ---
/**
 * Tamirciler marka başına farklı fiyat verebiliyor. Havuzda kimi tamircinin marka fiyatını,
 * kiminin taban fiyatını almak karşılaştırmayı anlamsız yapardı. Kural: HER tamirci için
 * "bu aracı getirsem bana ne yazar" değeri alınıyor.
 */
{
  const pool = [
    shop(2, "oil_change", "300", { brandPrices: { BMW: "900" } }),
    shop(3, "oil_change", "300", { brandPrices: { BMW: "900" } }),
    // Marka zammı OLMAYAN tamirci: BMW için de 300 yazar, o yüzden 300 sayılmalı.
    shop(4, "oil_change", "300"),
  ];
  const r = comparePriceToMarket({
    serviceKey: "oil_change",
    service: { key: "oil_change", price: "300", fixed: true, brandPrices: { BMW: "900" } },
    mechanics: pool, excludeMechanicId: 1, brand: "BMW",
  });
  eqJson(r.median, 900, "BMW karşılaştırmasında marka fiyatları kullanılıyor (medyan 900)");
  eqJson(r.level, "average", "BMW için 900 yazan tamirci ortalamada");
  // Marka verilmezse taban fiyatlar kullanılıyor.
  const base = comparePriceToMarket({
    serviceKey: "oil_change",
    service: { key: "oil_change", price: "300", fixed: true, brandPrices: { BMW: "900" } },
    mechanics: pool, excludeMechanicId: 1, brand: null,
  });
  eqJson(base.median, 300, "marka bilinmiyorsa taban fiyatlar karşılaştırılıyor");
}

// --- BOZUK GİRDİDE ÇÖKMÜYOR ---
eqJson(comparePriceToMarket({ serviceKey: "oil_change", service: null, mechanics: null, excludeMechanicId: 1 }), null, "null girdide çökmüyor");
eqJson(comparePriceToMarket({}), null, "boş nesnede çökmüyor");
{
  const broken = [null, undefined, { id: 2 }, { id: 3, services: null }, { id: 4, services: [null] }];
  eqJson(comparePriceToMarket({ serviceKey: "oil_change", service: { key: "oil_change", price: "300", fixed: true }, mechanics: broken, excludeMechanicId: 1 }).level, null,
    "bozuk tamirci kayıtları havuzu çökertmiyor");
}

// --- GERÇEK TOHUM VERİSİ: bugün kaç hizmette karşılaştırma ÇIKIYOR ---
/**
 * Dürüstlük kontrolü. Tohum verisinde 17 hizmet var ve yalnızca ikisinde üç ya da daha fazla
 * tamircinin fiyatı bulunuyor. Yani bugün 15 hizmette bu satır HİÇ GÖRÜNMEYECEK. Bu bir eksiklik
 * değil, doğru davranış — ve testte yazılı olması, ileride biri "neden çıkmıyor" diye sorduğunda
 * cevabın kayıtlı olması için.
 */
{
  const seedSrc = readFileSyncForSeed();
  const pool = parseSeedMechanics(seedSrc);
  eqJson(pool.length >= 8, true, `tohum verisinde ${pool.length} tamirci okundu`);
  const keys = [...new Set(pool.flatMap((m) => m.services.map((s) => s.key)))];
  const comparable = keys.filter((key) => {
    const subject = pool.find((m) => m.services.some((s) => s.key === key));
    const svc = subject.services.find((s) => s.key === key);
    return comparePriceToMarket({ serviceKey: key, service: svc, mechanics: pool, excludeMechanicId: subject.id })?.level != null;
  });
  eqJson(keys.length >= 15, true, `tohum verisinde ${keys.length} farklı hizmet var`);
  /**
   * BU SATIR BİR HATAMI DÜZELTİYOR. İlk ölçümümde "2 hizmette karşılaştırma çıkar" yazmıştım;
   * saydığım şey fiyat veren tamirci sayısıydı, oysa karşılaştırmada kişinin KENDİSİ havuza
   * girmiyor. En yoğun hizmette 3 tamirci var → kendisi çıkınca 2 kalıyor → eşiğin altında.
   * Yani BUGÜN hiçbir hizmette çıkmıyor. Testin bunu YAZILI tutması önemli: ileride biri
   * "neden hiç görünmüyor" diye sorduğunda cevap burada.
   */
  eqJson(comparable.length, 0,
    "bugünkü tohum verisinde hiçbir hizmette karşılaştırma çıkmıyor (kendisi hariç 3 tamirci yok) — doğru davranış");
  // Özelliğin ölü OLMADIĞI yukarıdaki sentetik havuzlarla kanıtlanıyor; burada ölçülen şey
  // gerçek verinin bugünkü yetersizliği, işlevin bozukluğu değil.
  {
    const enough = [...pool];
    const key = "oil_change";
    // Havuza iki tamirci daha ekleyince (yani gerçek platform biraz büyüyünce) çıkıyor mu?
    enough.push({ id: 900, services: [{ key, price: "300", fixed: true }] });
    enough.push({ id: 901, services: [{ key, price: "320", fixed: true }] });
    const subject = pool.find((m) => m.services.some((s) => s.key === key));
    const svc = subject.services.find((s) => s.key === key);
    const r = comparePriceToMarket({ serviceKey: key, service: svc, mechanics: enough, excludeMechanicId: subject.id });
    eqJson(r.level != null, true, `havuza iki tamirci eklenince karşılaştırma çıkıyor (${r.sampleSize} tamirci, medyan ${r.median})`);
  }
}

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
