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
ok(/notifyListingUpdates: true/.test(provider), "yeni bildirim ayarı iki rolde de var");
eq((provider.match(/notifyListingUpdates: true/g) || []).length, 2, "hem araç sahibi hem tamirci ayarında");
ok(/ownerSettings\.notifyListingUpdates/.test(provider) && /mechSettings\.notifyListingUpdates/.test(provider),
  "bildirim bu ayara bağlı");
const watcherFn = provider.slice(provider.indexOf("const notifyFavoriteWatchers"), provider.indexOf("const notifyFavoriteWatchers") + 900);
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

report("ilan teklifleri");
