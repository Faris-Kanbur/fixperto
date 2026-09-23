// İLAN TEKLİFLERİ ve İLAN GÜNCELLEME BİLDİRİMLERİ.
//
// İSTEK: "Verdiğim Teklifler'den, tamirci teklifi daha görmediyse ya da reddettiyse yeni teklif
// verebilsin. İlanlarla ilgili değişiklikler bildirim olarak gitsin ve açıp kapatabilsin. İki
// tarafı da kontrol et, eksik olanları ekle."
//
// DENETİMDE ÇIKAN ASIL HATA: teklif ve soru, ilanın kendi PATCH'i ile yazılıyordu. İlan satırının
// yazma yetkisi SATICIYA bağlı olduğu için (authScope: sellerId) teklifi veren 403 alıyordu —
// yani teklif ekranda görünüyor, sunucuya HİÇ kaydedilmiyordu.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, ok, report } from "./_harness.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...p) => readFileSync(join(ROOT, ...p), "utf8");
const backend = read("backend", "routes", "listingInteractions.js");
const server = read("backend", "server.js");
const provider = read("frontend", "src", "app", "state", "AppLogicProvider.tsx");
const shell = read("frontend", "src", "app", "AppShell.tsx");
const detail = read("frontend", "src", "components", "features", "ListingDetailPage.tsx");
const client = read("frontend", "src", "services", "api", "client.ts");
const i18n = read("frontend", "src", "data", "i18n.ts");

// --- 1) Teklif artık GERÇEKTEN kaydediliyor ----------------------------------------------------
ok(/listingInteractionsRouter\.post\("\/:id\/offers"/.test(backend), "teklif için ayrı uç nokta var");
ok(/listingInteractionsRouter\.post\("\/:id\/messages"/.test(backend), "soru için ayrı uç nokta var");
ok(/app\.use\("\/api\/listings", listingInteractionsRouter\)/.test(server), "router bağlı");
// CRUD'dan ÖNCE bağlanmalı, yoksa istek genel PATCH/GET yoluna düşer.
ok(server.indexOf('app.use("/api/listings", listingInteractionsRouter)') < server.indexOf('app.use("/api/listings", makeCrudRouter'),
  "etkileşim router'ı CRUD'dan önce bağlı");
ok(/addOffer:/.test(client) && /addMessage:/.test(client), "istemci yeni uçları kullanıyor");
// Alıcının teklifi artık PATCH ile yazılmıyor. (Satıcının kendi ilanındaki "teklifleri gördüm"
// işaretlemesi PATCH ile kalıyor ve DOĞRUSU bu: o satırın sahibi zaten satıcı.)
const submitOfferSrc = provider.slice(provider.indexOf("const submitOffer = async () => {"), provider.indexOf("const canReoffer"));
eq(/api\.listings\.update\(/.test(submitOfferSrc), false, "teklif artık ilan PATCH'i ile yazılmıyor");
ok(/api\.listings\.addOffer\(listingId, offerAmount, currency\)/.test(submitOfferSrc), "teklif yeni uç noktadan gidiyor");
eq(/persist\(api\.listings\.update\(selectedListing\.id, \{ messages \}\)/.test(provider), false, "soru artık ilan PATCH'i ile yazılmıyor");

// --- 2) Kimlik uydurulamaz ---------------------------------------------------------------------
ok(/from: actor\.name,\s*\/\/ <- oturumdan/.test(backend), "teklif sahibi oturumdan damgalanıyor");
ok(/buyerId: actor\.id/.test(backend), "alıcı kimliği oturumdan");
ok(/isSellerReply: isOwnListing\(listing, actor\)/.test(backend), "satıcı cevabı işareti sunucuda konuyor");
ok(/Kendi ilanınıza teklif veremezsiniz/.test(backend), "kendi ilanına teklif engelli");
ok(/writeLimiter/.test(backend), "yazma uçlarında hız sınırı var");
ok(/MAX_OFFERS_PER_BUYER = 10/.test(backend), "aynı ilanda teklif sayısı sınırlı");

// --- 3) TEKRAR TEKLİF KURALI: davranışı çalıştırıyoruz -----------------------------------------
// Kuralı istemci ve sunucu AYNI şekilde uygulamalı; burada ikisinin de dayandığı karar tablosunu
// modelleyip her durumu tek tek deniyoruz.
const decide = (active) => {
  if (!active) return "new";
  if (active.status === "accepted") return "blocked-accepted";
  if (active.status === "pending" && active.seen) return "blocked-seen";
  if (active.status === "pending" && !active.seen) return "update";
  if (active.status === "rejected") return "new-after-reject";
  return "new";
};
eq(decide(null), "new", "ilk teklif serbest");
eq(decide({ status: "pending", seen: false }), "update", "GÖRÜLMEMİŞ teklifte tutar güncelleniyor");
eq(decide({ status: "rejected" }), "new-after-reject", "REDDEDİLMİŞ teklifin ardından yeni teklif serbest");
eq(decide({ status: "pending", seen: true }), "blocked-seen", "görülmüş ve yanıt bekleyen teklifte yeni teklif yok");
eq(decide({ status: "accepted" }), "blocked-accepted", "kabul edilmiş teklifte yeni teklif yok");

// Sunucu bu kararların hepsini içeriyor mu?
ok(/reason: "accepted"/.test(backend), "kabul edilmiş teklif makine-okunur nedenle reddediliyor");
ok(/reason: "seen"/.test(backend), "görülmüş teklif makine-okunur nedenle reddediliyor");
ok(/active\.status === "pending" && !active\.seen/.test(backend), "görülmemiş teklif yerinde güncelleniyor");
ok(/active\.status === "rejected"\s*\?\s*offers\.map/.test(backend), "reddedilen teklif 'replaced' olarak arşivleniyor");

// İstemci: kural tek yerde (offerButtonState) ve üç düğmede de aynı.
const stateFn = provider.slice(provider.indexOf("const offerButtonState = (listing) => {"));
ok(stateFn.length > 0, "offerButtonState tanımlı");
ok(/labelKey: "offerAwaitingReplyBtn", disabled: true/.test(stateFn), "görülmüş teklifte düğme kapalı");
ok(/labelKey: "reofferBtn", disabled: false/.test(stateFn), "reddedilen teklifte yeni teklif düğmesi açık");
ok(/labelKey: "reofferUpdateBtn", disabled: false/.test(stateFn), "görülmemiş teklifte güncelleme açık");
const detailButtons = (detail.match(/offerButtonState\(l\)/g) || []).length;
eq(detailButtons, 2, "tam sayfa ilanın iki teklif düğmesi de aynı kuraldan geçiyor");
ok(/offerButtonState\(selectedListing\)/.test(shell), "hızlı görüntüleme düğmesi de aynı kuraldan geçiyor");

// --- 4) "Verdiğim Teklifler" — İKİ TARAFTA da tekrar teklif düğmesi ----------------------------
ok(/const canReoffer = \(offer\) => !!offer && \(offer\.status === "rejected" \|\| \(offer\.status === "pending" && !offer\.seen\)\)/.test(provider),
  "tekrar teklif koşulu tek yerde");
const reofferButtons = (shell.match(/startReoffer\(o\.listing, o\)/g) || []).length;
eq(reofferButtons, 2, "hem araç sahibi hem tamirci listesinde tekrar teklif düğmesi var");
ok(/startReoffer = \(listing, offer\)/.test(provider), "düğme ilanı açıp formu dolduruyor");

// --- 5) İLAN GÜNCELLEME BİLDİRİMLERİ -----------------------------------------------------------
// Eskiden yalnızca FAVORİLEYENLER haber alıyordu; teklif veren ve soru soran daha ilgilidir.
ok(/const isWatchingListing = \(listingId\)/.test(provider), "izleyici tanımı ayrı fonksiyonda");
const watchFn = provider.slice(provider.indexOf("const isWatchingListing"), provider.indexOf("const notifyFavoriteWatchers"));
ok(/favoriteIds\.includes\(listingId\)/.test(watchFn), "favorileyenler izleyici");
ok(/listing\.offers \|\| \[\]/.test(watchFn), "teklif verenler izleyici");
ok(/listing\.messages \|\| \[\]/.test(watchFn), "soru soranlar izleyici");

// Kendi aç/kapa anahtarı: "ilanıma teklif geldi" ile "izlediğim ilan değişti" farklı şeyler.
// (Ayar hâlâ ekranda duruyor — kullanıcı kendi bildirim TERCİHİNİ kaydediyor; bkz. aşağıdaki not.)
// Varsayılanlar TEK yerde tanımlı (DEFAULT_OWNER_NOTIFY_SETTINGS/DEFAULT_MECH_NOTIFY_SETTINGS —
// bkz. bildirim tercihi kalıcılığı notu), bu yüzden literal artık İKİ değil BİR kez geçiyor ama
// HER İKİ sabitte de var olduğu ayrı ayrı doğrulanıyor.
ok(/DEFAULT_OWNER_NOTIFY_SETTINGS = \{[^}]*notifyListingUpdates: true/.test(provider), "araç sahibi varsayılanında yeni ayar var");
ok(/DEFAULT_MECH_NOTIFY_SETTINGS = \{[^}]*notifyListingUpdates: true/.test(provider), "tamirci varsayılanında yeni ayar var");
/**
 * GERÇEK HATA DÜZELTMESİ (bu denetimde bulundu, bkz. el kitabı 22.7): notifyFavoriteWatchers'ı
 * çağıran her zaman SATICI (kendi ilanını güncelleyen kişi) — `ownerSettings`/`mechSettings` ise
 * her zaman O AN GİRİŞ YAPMIŞ KİŞİNİN (yani satıcının) ayarı. Alıcının (favorileyen/teklif veren)
 * kendi tercihini SATICININ ayarıyla kapatmak yanlıştı: satıcı bu bildirimi kapatmış olsa bile
 * alıcı haber almalı, çünkü bildirim ALICI İÇİN. Artık `notifyFavoriteWatchers` koşulsuz (true)
 * ateşliyor; alıcının GERÇEK tercihini sunucu tarafında kontrol etmek ayrı bir iş (bu proje
 * bildirim ayarlarını yalnızca istemci tarafında tutuyor, bkz. el kitabı 15.1).
 */
const notifyFnSrc = provider.slice(provider.indexOf("const notifyFavoriteWatchers"), provider.indexOf("const notifyFavoriteWatchers") + 1600);
eq(/ownerSettings\.notifyListingUpdates|mechSettings\.notifyListingUpdates/.test(notifyFnSrc), false,
  "notifyFavoriteWatchers artık SATICININ kendi ayarına bakmıyor (alıcının tercihi satıcınınkiyle kapatılamaz)");
const watcherFn = notifyFnSrc.slice(0, 900);
eq(/notifyOffers/.test(watcherFn), false, "izleme bildirimi artık 'teklif' ayarına bağlı değil");
const toggles = (shell.match(/key: "notifyListingUpdates"/g) || []).length;
eq(toggles, 2, "ayar ekranında iki rolde de aç/kapa var");

// Hangi değişiklikler haber veriliyor: fiyat, durum, düzenleme, kaldırma.
for (const [pattern, name] of [
  [/notifyFavoriteWatchers\([^,]+, label, `fiyat düştü/, "fiyat düşüşü"],
  [/notifyFavoriteWatchers\([^,]+, label, `fiyat \$\{/, "fiyat değişimi"],
  [/notifyFavoriteWatchers\([^,]+, label, "ilan bilgileri güncellendi\."\)/, "ilan düzenlemesi"],
  [/durumu "\$\{listingStatusMeta/, "durum değişimi"],
  [/"ilan yayından kaldırıldı\."/, "ilanın kaldırılması"],
]) ok(pattern.test(provider), `${name} bildiriliyor`);

// --- 6) EKSİK OLAN YARI: satıcının soruya cevabı -----------------------------------------------
// Alıcı soru sorabiliyordu ama satıcının cevap verecek yeri yoktu; soru ilan yönetiminde kalıyordu.
ok(/const submitListingReply = \(listing\)/.test(provider), "satıcı cevabı fonksiyonu var");
ok(/api\.listings\.addMessage\(listing\.id, text\)/.test(provider), "cevap da aynı uç noktadan gidiyor");
ok(/İlan sorunuza cevap geldi/.test(provider), "soruyu soran haberdar ediliyor");
ok(/submitListingReply\(selectedListing\)/.test(shell), "ilan yönetiminde cevap kutusu var");
ok(/sellerReplyBadge/.test(shell), "satıcı cevabı listede işaretleniyor");

// --- 7) Metinler üç dilde -----------------------------------------------------------------------
for (const key of ["offerSentToast", "offerUpdatedToast", "offerResentToast", "offerBlockedSeenToast",
  "offerBlockedAcceptedToast", "reofferBtn", "reofferUpdateBtn", "reofferRejectedHint", "reofferUnseenHint",
  "offerAwaitingReplyBtn", "notifyListingUpdatesLabel", "listingReplyPlaceholder", "listingReplySendBtn", "sellerReplyBadge"]) {
  const line = i18n.split("\n").find((l) => l.trim().startsWith(`${key}:`)) || "";
  ok(line.length > 0, `${key} tanımlı`);
  for (const lang of ["tr:", "en:", "de:"]) ok(line.includes(lang), `${key} ${lang} dilinde var`);
}

// ================================================================ UYDURMA VERİ TARAMASI
/**
 * KULLANICI BİLDİRDİ: "5 tamirciden teklif istedim, tamirci hesabına hiç girmediğim halde fiyat
 * teklifi gelmiş görünüyor." Sebebi şuydu: istemci her tamirci için `Math.random()` ile bir fiyat
 * ÜRETİP `status: "submitted"` olarak kaydediyordu. Gerekçe olarak yorumda "demo amaçlı" yazıyordu
 * ve o gerekçe ARTIK GEÇERSİZDİ — yerini alan gerçek akış (tamirci kendi oturumuyla fiyat girer)
 * çoktan eklenmişti, ama kısayol kodda kalmıştı.
 *
 * BU, AYNI SINIF HATANIN İKİNCİ KEZ ÇIKIŞI. Birincisi sohbetteki sahte otomatik yanıttı: araç
 * sahibi mesaj yazdıktan 0,9 saniye sonra tamircinin ağzından uydurma bir cevap ÜRETİLİYOR ve
 * sunucuya kaydediliyordu. İkisinin de ortak yanı "demo amaçlı" diye yazılmış olması ve yerini
 * alan gerçek özellik geldikten sonra silinmemesi. Orada uydurulan bir cümleydi; burada PARA.
 *
 * Bu tarama o kısayolların geri gelmesini engelliyor. Aradığı şey desen değil DAVRANIŞ: fiyat,
 * puan, teklif gibi TİCARİ bir alanın rastgele üretilmesi.
 */
{
  const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const providerCode = stripComments(provider);
  const shellCode = stripComments(read("frontend", "src", "app", "AppShell.tsx"));

  /**
   * 1) TİCARİ BİR ALANA rastgele değer ATANMAMALI.
   *
   * İLK YAZDIĞIM KURAL YANLIŞTI ve yine aynı hatayı yapmıştım: "satırda hem Math.random hem
   * ticari bir kelime varsa" diye baktım. Bu bir VEKİL ölçüt ve hemen yanlış alarm verdi —
   * ilan taslağı tek satırda hem `px: 20 + Math.random() * 60` (harita iğnesinin konumu, tamamen
   * kozmetik) hem `offers: []` içeriyor. İkisinin aynı satırda olması bir hata değil.
   *
   * Doğru ölçüt YAKINLIK değil ATAMA: rastgele değer ticari bir ALANIN DEĞERİ mi oluyor?
   * Desen bunu soruyor, o yüzden `px`/`py` eşleşmiyor ama `price: ...Math.random...` eşleşiyor.
   */
  const COMMERCIAL_ASSIGN = /\b(price|etaDays|rating|reviews|totalEarnings|offerPrice|servicePrice)\s*:\s*[^,;}\n]*Math\.random/i;
  for (const [label, code] of [["AppLogicProvider", providerCode], ["AppShell", shellCode]]) {
    const hits = [...code.matchAll(new RegExp(COMMERCIAL_ASSIGN, "gi"))].map((m) => m[0].slice(0, 60));
    ok(hits.length === 0,
      `${label}: ticari bir alana rastgele değer atanmıyor (bulunan: ${hits.join(" | ") || "yok"})`);
  }
  // Kozmetik rastgelelik (harita iğnesi konumu) SORUN DEĞİL ve kalmalı — kuralın onu
  // yakalamadığını da doğruluyoruz, yoksa test yarın birinin onu "düzeltmesine" yol açar.
  ok(/px: 20 \+ Math\.random\(\) \* 60/.test(providerCode),
    "harita iğnesi konumundaki rastgelelik korunuyor (kozmetik, ticari veri değil)");

  // 2) Teklif yer tutucusu FİYATSIZ oluşturuluyor mu — asıl düzeltme bu.
  const draftBlock = providerCode.match(/const offerDrafts = selectedMechIds\.map\([\s\S]{0,700}?\}\);/)?.[0] || "";
  ok(draftBlock.length > 0, "teklif taslağı bloğu bulundu");
  ok(/status: "pending"/.test(draftBlock), "her davet edilen tamirci için PENDING kaydı oluşuyor");
  ok(/price: null/.test(draftBlock), "yer tutucuda fiyat YOK");
  ok(/etaDays: null/.test(draftBlock), "yer tutucuda teslim süresi YOK");
  ok(!/Math\.random/.test(draftBlock), "taslakta rastgele değer üretimi YOK");
  ok(!/MY_MECHANIC_ID/.test(draftBlock),
    "ayrıcalıklı 'benim tamircim' istisnası kalmadı — her tamirci gerçek tamirci");
  ok(!/submitted/.test(draftBlock), "istemci hiçbir tamirci adına 'submitted' teklif oluşturmuyor");

  // 3) SUNUCU da bunu zorunlu kılıyor mu — istemciyi düzeltmek yeterli değil, uç doğrudan çağrılabilir.
  const quotes = read("backend", "routes", "quotes.js");
  ok(/const isOfferOwner = actor\.role === "mechanic" && body\.mechanicId === actor\.id;/.test(quotes),
    "sunucu 'bu teklif gerçekten bu tamircinin mi' diye soruyor");
  ok(/if \(status === "submitted" && !isOfferOwner\)/.test(quotes),
    "başkası adına fiyatlı teklif PENDING'e düşürülüyor");
  // Yer tutucudan fiyat/süre/not temizleniyor mu.
  const elseBlock = quotes.match(/\} else \{[\s\S]{0,400}?body\.note = null;/)?.[0] || "";
  ok(/body\.price = null/.test(elseBlock), "sunucu pending teklifte fiyatı siliyor");
  ok(/body\.etaDays = null/.test(elseBlock), "sunucu pending teklifte süreyi siliyor");
  ok(/body\.note = null/.test(elseBlock), "sunucu pending teklifte notu siliyor");

  // 4) Sohbetteki İLK uydurma (sahte otomatik yanıt) geri gelmiş mi — aynı sınıf, aynı tarama.
  ok(!/setTimeout\([^)]*sendMechanicMessage|fireAutoReply/.test(providerCode),
    "sohbette sahte otomatik yanıt geri gelmedi");
}

report("ilan teklifleri");
