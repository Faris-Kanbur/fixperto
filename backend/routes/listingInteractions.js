import { Router } from "express";
import { db } from "../db/db.js";
import { hydrate } from "../db/hydrate.js";
import { makeRateLimiter, resolveActor } from "../utils/auth.js";

/**
 * İLANA TEKLİF VERME ve SORU SORMA — alıcı tarafının yazma yolu.
 * ---------------------------------------------------------------------------------------------
 * GERÇEK HATA (bu işin denetiminde bulundu): teklif ve soru, istemciden doğrudan
 * `PATCH /api/listings/:id` ile ilanın `offers` / `messages` dizisine yazılıyordu. Ama ilanların
 * yazma yetkisi SATICIYA bağlı (authScope: sellerId) — yani teklifi veren kişi satıcı olmadığı
 * için istek 403 dönüyordu: teklif ekranda görünüyor, sunucuya HİÇ kaydedilmiyordu. Sayfa
 * yenilenince kayboluyordu. (Aynı sınıf hata sohbet mesajlarında da vardı, bkz. conversations.js.)
 *
 * Ayrıca dizinin tamamını istemciye yazdırmak iki şeyi daha mümkün kılıyordu: (1) teklifi
 * BAŞKASININ ağzından vermek (from/buyerId alanları serbestti), (2) satıcının kabul/ret
 * kararını istemciden değiştirmek. Artık teklif/soru ekleme ayrı bir uç noktada ve kimlik
 * oturumdan damgalanıyor; ekleme sunucudaki GÜNCEL diziye yapılıyor (eşzamanlı teklifler
 * birbirini ezmiyor).
 *
 * TEKRAR TEKLİF KURALI (kullanıcı isteği): "tamirci teklifi daha görmediyse ya da reddettiyse
 * yeni teklif verebilsin". Kural sunucuda:
 *   - Bekleyen ve HENÜZ GÖRÜLMEMİŞ teklif → tutar yerinde güncellenir (yeni satır açılmaz).
 *   - Bekleyen ve GÖRÜLMÜŞ teklif → yeni teklif YOK. Satıcı teklifi görmüş, yanıt bekliyor;
 *     bu sırada arka arkaya teklif göndermek pazarlık değil, spam olur.
 *   - REDDEDİLMİŞ teklif → yeni teklif serbest; eski kayıt "replaced" olarak işaretlenir ki
 *     listede tek güncel satır kalsın.
 *   - KABUL EDİLMİŞ teklif → yeni teklif YOK; iş bitmiştir.
 */
export const listingInteractionsRouter = Router();

const MAX_OFFER_AMOUNT = 100_000_000;
const MAX_OFFERS_PER_BUYER = 10;      // aynı ilanda bir alıcının toplam teklif geçmişi
const MAX_QUESTION_LEN = 1000;
const MAX_MESSAGES_PER_LISTING = 500;

// Teklif/soru yazma: IP başına dakikalık tavan. Gerçek bir alıcı dakikada 20 teklif yazmaz.
const writeLimiter = makeRateLimiter({ maxAttempts: 20, lockoutMs: 5 * 60 * 1000, windowMs: 60 * 1000 });

function actorContext(req, res) {
  const actor = resolveActor(req);
  if (!actor) { res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." }); return null; }
  if (actor.role !== "owner" && actor.role !== "mechanic") {
    res.status(403).json({ error: "Bu işlem için yetkiniz yok." }); return null;
  }
  const row = actor.role === "owner"
    ? db.prepare(`SELECT name, lang FROM owners WHERE id = ?`).get(actor.id)
    : db.prepare(`SELECT name, lang FROM mechanics WHERE id = ?`).get(actor.id);
  return { ...actor, name: row?.name || "Kullanıcı", lang: row?.lang || "tr" };
}

function limited(req, res) {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  if (writeLimiter.check(ip).blocked) {
    res.status(429).json({ error: "Çok fazla istek. Lütfen birkaç dakika sonra tekrar deneyin." });
    return true;
  }
  writeLimiter.registerFailure(ip);
  return false;
}

const isOwnListing = (listing, actor) => (
  listing.sellerId != null && listing.sellerId === actor.id
  && (listing.sellerType || "owner") === actor.role
);

const nextId = (rows) => rows.reduce((max, r) => Math.max(max, Number(r?.id) || 0), 0) + 1;

/** Alıcının bu ilandaki EN GÜNCEL teklifi (replaced olanlar sayılmaz). */
const myActiveOffer = (offers, actor) => offers.find((o) => (
  o.status !== "replaced"
  && (o.buyerId != null ? o.buyerId === actor.id : o.from === actor.name)
  && (o.buyerId == null || (o.buyerType || "owner") === actor.role)
));

listingInteractionsRouter.post("/:id/offers", (req, res) => {
  const actor = actorContext(req, res);
  if (!actor) return;
  if (limited(req, res)) return;

  const listing = db.prepare(`SELECT * FROM listings WHERE id = ?`).get(req.params.id);
  if (!listing) return res.status(404).json({ error: "İlan bulunamadı." });
  if (isOwnListing(listing, actor)) return res.status(403).json({ error: "Kendi ilanınıza teklif veremezsiniz." });
  if (listing.status && listing.status !== "active") return res.status(400).json({ error: "Bu ilan artık teklif almıyor." });

  const amountNum = Number(String(req.body?.amount ?? "").replace(/[^\d]/g, ""));
  if (!Number.isFinite(amountNum) || amountNum <= 0 || amountNum > MAX_OFFER_AMOUNT) {
    return res.status(400).json({ error: "Geçersiz teklif tutarı." });
  }
  const currency = ["₺", "€", "$"].includes(req.body?.currency) ? req.body.currency : "₺";

  const offers = JSON.parse(listing.offers || "[]");
  const mine = offers.filter((o) => (o.buyerId != null ? o.buyerId === actor.id : o.from === actor.name));
  if (mine.length >= MAX_OFFERS_PER_BUYER) {
    return res.status(429).json({ error: "Bu ilan için teklif sınırına ulaştınız." });
  }

  const active = myActiveOffer(offers, actor);
  let updated;
  if (active && active.status === "accepted") {
    return res.status(409).json({ error: "Teklifiniz kabul edildi; yeni teklif veremezsiniz.", reason: "accepted" });
  }
  if (active && active.status === "pending" && active.seen) {
    // Satıcı teklifi gördü ve henüz yanıtlamadı: yanıt beklenmeli.
    return res.status(409).json({ error: "Teklifiniz satıcıya iletildi ve görüldü. Satıcı yanıtlayana kadar yeni teklif veremezsiniz.", reason: "seen" });
  }
  if (active && active.status === "pending" && !active.seen) {
    // Henüz görülmemiş: yeni satır açmadan tutarı güncelliyoruz.
    updated = offers.map((o) => (o.id === active.id ? { ...o, amount: String(amountNum), currency } : o));
  } else {
    // Reddedilmiş (ya da hiç teklif yok): yeni teklif. Eski reddedilen kayıt "replaced" olur ki
    // listede tek güncel satır kalsın; geçmişi kaybetmiyoruz, sadece gizliyoruz.
    const replaced = active && active.status === "rejected"
      ? offers.map((o) => (o.id === active.id ? { ...o, status: "replaced" } : o))
      : offers;
    updated = [{
      id: nextId(offers),
      amount: String(amountNum),
      currency,
      from: actor.name,          // <- oturumdan, istemciden DEĞİL
      buyerId: actor.id,
      buyerType: actor.role,
      status: "pending",
      seen: false,
    }, ...replaced];
  }

  db.prepare(`UPDATE listings SET offers = ? WHERE id = ?`).run(JSON.stringify(updated), req.params.id);
  const fresh = db.prepare(`SELECT * FROM listings WHERE id = ?`).get(req.params.id);
  res.status(201).json({
    listing: hydrate("listings", fresh),
    replacedRejected: !!(active && active.status === "rejected"),
    updatedInPlace: !!(active && active.status === "pending" && !active.seen),
  });
});

/** İlana soru sorma. Gönderen kimliği ve dili yine oturumdan damgalanır. */
listingInteractionsRouter.post("/:id/messages", (req, res) => {
  const actor = actorContext(req, res);
  if (!actor) return;
  if (limited(req, res)) return;

  const listing = db.prepare(`SELECT * FROM listings WHERE id = ?`).get(req.params.id);
  if (!listing) return res.status(404).json({ error: "İlan bulunamadı." });
  const text = String(req.body?.text ?? "").trim();
  if (!text) return res.status(400).json({ error: "Mesaj boş olamaz." });
  if (text.length > MAX_QUESTION_LEN) return res.status(400).json({ error: "Mesaj çok uzun." });

  const messages = JSON.parse(listing.messages || "[]");
  if (messages.length >= MAX_MESSAGES_PER_LISTING) {
    return res.status(429).json({ error: "Bu ilandaki mesaj sınırına ulaşıldı." });
  }
  const updated = [{
    id: nextId(messages),
    text,
    from: actor.name,
    buyerId: actor.id,
    buyerType: actor.role,
    lang: actor.lang,
    // Satıcı kendi ilanına yazıyorsa bu bir CEVAPtır; alıcı yazıyorsa sorudur. Ayrımı sunucu
    // koyuyor, çünkü istemciye bırakılsa alıcı kendini "satıcı cevabı" gibi gösterebilirdi.
    isSellerReply: isOwnListing(listing, actor),
  }, ...messages];

  db.prepare(`UPDATE listings SET messages = ? WHERE id = ?`).run(JSON.stringify(updated), req.params.id);
  const fresh = db.prepare(`SELECT * FROM listings WHERE id = ?`).get(req.params.id);
  res.status(201).json({ listing: hydrate("listings", fresh) });
});

export default listingInteractionsRouter;
