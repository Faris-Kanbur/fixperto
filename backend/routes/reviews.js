import { Router } from "express";
import { db } from "../db/db.js";
import { hydrate } from "../db/hydrate.js";
import { makeRateLimiter, resolveActor } from "../utils/auth.js";

/**
 * DEĞERLENDİRMELER — puanın gerçekten bir anlamı olması için.
 * ---------------------------------------------------------------------------------------------
 * GÜVENLİK AÇIĞI (tam denetimde bulundu): yorumlar tamirci satırındaki `reviewList` JSON dizisinde
 * duruyordu ve bu alan "sharedWrite" ile GİRİŞ YAPMIŞ HERKESE açıktı — çünkü yorum yazan kişi
 * tamircinin kendisi değil. Ama dizinin TAMAMI istemciden geldiği için, giriş yapmış herhangi biri:
 *   - bir tamircinin bütün olumsuz yorumlarını SİLEBİLİYOR,
 *   - başkasının ağzından yorum EKLEYEBİLİYOR,
 *   - `rating` ve `reviews` alanlarını doğrudan yazarak puanı 5,0 / yorum sayısını 500 yapabiliyordu.
 * Puan bu pazar yerinin en önemli güven sinyali; istemcinin hesapladığı ve herkesin
 * yazabildiği bir sayı olduğu sürece hiçbir şey ifade etmiyordu.
 *
 * ÇÖZÜM:
 *   - Yorum ekleme/silme/beğenme ayrı uçlarda; yazar kimliği OTURUMDAN damgalanıyor.
 *   - Bir kullanıcı bir tamirciye YALNIZCA BİR yorum bırakabiliyor ve bunu ancak o tamircide
 *     TAMAMLANMIŞ bir randevusu varsa yapabiliyor ("doğrulanmış müşteri" kuralı).
 *   - Yorumu yalnızca YAZARI silebiliyor; tamirci silemiyor (olumsuz yorumu yok edememeli),
 *     yalnızca YANITLAYABİLİYOR.
 *   - `rating` ve `reviews` artık istemciden hiç kabul edilmiyor: her değişiklikte SUNUCU
 *     listeden yeniden hesaplıyor.
 */
export const reviewsRouter = Router();

const MAX_COMMENT_LEN = 2000;
const MAX_REPLY_LEN = 2000;
const writeLimiter = makeRateLimiter({ maxAttempts: 30, lockoutMs: 10 * 60 * 1000, windowMs: 10 * 60 * 1000 });

const readList = (row) => { try { return JSON.parse(row.reviewList || "[]"); } catch { return []; } };

/** Puanı LİSTEDEN hesaplar ve satıra yazar — istemcinin gönderdiği bir sayıya asla güvenilmez. */
function saveList(mechanicId, list) {
  // İŞARETLİ (flagged) yorumlar ortalamaya GİRMEZ. Gerekçe aşağıda, competitorLink yorumunda.
  const rated = list.filter((r) => Number(r?.rating) > 0 && !r.flaggedCompetitor);
  const avg = rated.length ? Math.round((rated.reduce((sum, r) => sum + Number(r.rating), 0) / rated.length) * 10) / 10 : 0;
  db.prepare(`UPDATE mechanics SET reviewList = ?, reviews = ?, rating = ? WHERE id = ?`)
    .run(JSON.stringify(list), rated.length, avg, mechanicId);
  return db.prepare(`SELECT * FROM mechanics WHERE id = ?`).get(mechanicId);
}

function actorOf(req, res, roles = ["owner", "mechanic"]) {
  const actor = resolveActor(req);
  if (!actor) { res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." }); return null; }
  if (!roles.includes(actor.role) && actor.role !== "admin") {
    res.status(403).json({ error: "Bu işlem için yetkiniz yok." }); return null;
  }
  return actor;
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

/** Yorum bırakma — yalnızca o tamircide tamamlanmış randevusu olan kullanıcı. */
reviewsRouter.post("/:id/reviews", (req, res) => {
  const actor = actorOf(req, res, ["owner", "mechanic"]);
  if (!actor) return;
  if (limited(req, res)) return;
  const mech = db.prepare(`SELECT * FROM mechanics WHERE id = ?`).get(req.params.id);
  if (!mech) return res.status(404).json({ error: "Tamirci bulunamadı." });
  /**
   * ====== REKABETE AYKIRI DEĞERLENDİRME: NE ENGELLİYORUZ, NEYİ ENGELLEYEMİYORUZ ======
   * Bir tamircinin rakibinin puanını düşürmesi (ya da kendi puanını şişirmesi) bu pazar yerinin
   * en kolay kötüye kullanım yolu. Katman katman savunma:
   *
   * 1) TAMİRCİ HESABI YORUM YAZAMAZ. Yorum, MÜŞTERİ deneyimidir. Tamirci hesabıyla başka bir
   *    tamirciye yorum yazmak (ya da beğenmek) doğrudan rekabet aracıdır. Tamirci gerçekten
   *    müşteriyse zaten bir araç sahibi hesabı açar — ve o zaman aşağıdaki kurallar işler.
   * 2) DOĞRULANMIŞ MÜŞTERİ ŞARTI. Yorum, o tamircide TAMAMLANMIŞ bir randevu gerektirir. Sahte
   *    hesapla gelip yorum yazmak, önce gerçek bir randevu almayı ve tamamlamayı gerektirir.
   * 3) KENDİNE YORUM: araç sahibi hesabının e-postası ya da telefonu, yorum yazılan tamircinin
   *    iletişim bilgisiyle aynıysa bu aynı kişidir — kesin engel.
   * 4) RAKİP İŞARETİ: iletişim bilgisi BAŞKA bir tamirci hesabıyla eşleşiyorsa, yorum kaydedilir
   *    ama "işletme hesabına bağlı" olarak işaretlenir ve PUAN ORTALAMASINA KATILMAZ. Silmiyoruz,
   *    çünkü bir tamirci başka bir tamircinin gerçek müşterisi olabilir; ama sessizce puanı
   *    etkilemesine de izin vermiyoruz. İşaret hem yöneticiye hem okuyucuya görünür.
   *
   * DÜRÜST SINIR: farklı e-posta + farklı telefonla açılmış ikinci bir hesabı bu kontroller
   * yakalamaz. Onun için kayıt anındaki IP'nin karması ek bir ipucu olarak tutuluyor (aşağıda) —
   * ama IP paylaşımlı olabileceği için (aynı ev, aynı ofis, mobil operatör NAT) TEK BAŞINA engel
   * değil, yalnızca işaret sebebidir. Gerçek çözüm kimlik doğrulamadır ve bu ölçekte yoktur.
   */
  if (actor.role === "mechanic") {
    return res.status(403).json({ error: "Tamirci hesabıyla değerlendirme yazılamaz. Yorum, müşteri deneyimini anlatır.", reason: "mechanicRole" });
  }

  const rating = Number(req.body?.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Puan 1 ile 5 arasında olmalı." });
  }
  // DOĞRULANMIŞ MÜŞTERİ: yorumun arkasında gerçekten yapılmış bir iş olmalı. Bu kural olmadan
  // yorumlar, rakibin puanını düşürmek için açılan sahte hesaplarla doldurulabilirdi.
  const appt = db.prepare(
    `SELECT id FROM appointments WHERE mechanicId = ? AND ownerId = ? AND status = 'Tamamlandı' LIMIT 1`
  ).get(mech.id, actor.role === "owner" ? actor.id : -1);
  if (!appt && actor.role !== "admin") {
    return res.status(403).json({ error: "Yalnızca bu tamircide tamamlanmış randevusu olan kullanıcılar yorum bırakabilir.", reason: "noAppointment" });
  }

  const list = readList(mech);
  if (list.some((r) => r.authorId === actor.id && (r.authorType || "owner") === actor.role)) {
    return res.status(409).json({ error: "Bu tamirci için zaten bir yorumunuz var. Önce onu silin.", reason: "duplicate" });
  }
  const authorRow = db.prepare(`SELECT name, email, phone, signupIpHash FROM owners WHERE id = ?`).get(actor.id) || {};

  // (3) ve (4): iletişim bilgisi eşleşmesi. Telefon +E.164'e normalleştirilmiş olarak saklanıyor
  // (bkz. utils/helpers.ts validatePhone), bu yüzden karşılaştırma güvenilir.
  const email = String(authorRow.email || "").trim().toLowerCase();
  const phone = String(authorRow.phone || "").trim();
  const linkedMechanic = (email || phone)
    ? db.prepare(`SELECT id, name FROM mechanics WHERE (email IS NOT NULL AND lower(email) = ?) OR (phone IS NOT NULL AND phone != '' AND phone = ?)`).get(email, phone)
    : null;
  if (linkedMechanic && linkedMechanic.id === mech.id) {
    return res.status(403).json({ error: "Bu hesap, yorum yazmak istediğiniz işletmeyle aynı iletişim bilgilerine sahip. Kendi işletmenize yorum yazamazsınız.", reason: "selfReview" });
  }
  /**
   * AYNI AĞ: TEK BAŞINA PUANI ETKİLEMEZ (uçtan uca denetimde düzeltildi).
   * İlk sürümde aynı kayıt-IP karması da yorumu "puana katılmaz" yapıyordu. Gerçek çalıştırmada
   * görüldü ki bu çok kolay tetikleniyor: aynı evden, aynı ofisten ya da aynı mobil operatörün
   * NAT'ı arkasından kaydolan iki kişi (ki bu apartman/site ölçeğinde sıradan) birbirine yorum
   * yazamaz hâle geliyordu — dürüst müşterinin yorumu sessizce yok sayılıyordu. Yanlış pozitifin
   * bedeli, kaçırılan bir sahte yorumdan büyük. Artık ağ eşleşmesi yalnızca YÖNETİCİYE bir
   * inceleme ipucu olarak kaydediliyor; puanı yalnızca KESİN sinyal (aynı iletişim bilgisi)
   * etkiliyor.
   */
  const sameNetwork = !!(authorRow.signupIpHash && mech.signupIpHash && authorRow.signupIpHash === mech.signupIpHash);
  const flaggedCompetitor = !!linkedMechanic;

  const review = {
    id: list.reduce((max, r) => Math.max(max, Number(r?.id) || 0), 0) + 1,
    rating: Math.round(rating),
    comment: String(req.body?.comment ?? "").slice(0, MAX_COMMENT_LEN),
    author: authorRow?.name || "Kullanıcı",
    authorId: actor.id,
    authorType: actor.role,
    lang: ["tr", "en", "de"].includes(req.body?.lang) ? req.body.lang : "tr",
    date: new Date().toISOString(),
    helpful: 0,
    verified: true,          // arkasında tamamlanmış randevu var
    reply: null,
    // İşaretli yorum: kaydedilir, görünür, ama puana katılmaz (bkz. saveList).
    flaggedCompetitor,
    flagReason: linkedMechanic ? "linkedMechanicAccount" : null,
    // Yalnızca yönetici incelemesi için ipucu; puana etkisi YOK.
    ...(sameNetwork ? { sameNetworkSignal: true } : {}),
  };
  const updated = saveList(mech.id, [review, ...list]);
  res.status(201).json({ mechanic: hydrate("mechanics", updated), reviewId: review.id });
});

/** Yorumu silme — yalnızca YAZARI (ya da admin). Tamirci kendi hakkındaki yorumu silemez. */
reviewsRouter.delete("/:id/reviews/:reviewId", (req, res) => {
  const actor = actorOf(req, res);
  if (!actor) return;
  const mech = db.prepare(`SELECT * FROM mechanics WHERE id = ?`).get(req.params.id);
  if (!mech) return res.status(404).json({ error: "Tamirci bulunamadı." });
  const list = readList(mech);
  const target = list.find((r) => String(r.id) === String(req.params.reviewId));
  if (!target) return res.status(404).json({ error: "Yorum bulunamadı." });
  const isAuthor = target.authorId === actor.id && (target.authorType || "owner") === actor.role;
  if (!isAuthor && actor.role !== "admin") {
    return res.status(403).json({ error: "Yalnızca kendi yorumunuzu silebilirsiniz." });
  }
  const updated = saveList(mech.id, list.filter((r) => r !== target));
  res.json({ mechanic: hydrate("mechanics", updated) });
});

/** Tamircinin yoruma YANITI — yalnızca yorumun yazıldığı tamirci. Yorumun kendisine dokunamaz. */
reviewsRouter.post("/:id/reviews/:reviewId/reply", (req, res) => {
  const actor = actorOf(req, res, ["mechanic"]);
  if (!actor) return;
  const mech = db.prepare(`SELECT * FROM mechanics WHERE id = ?`).get(req.params.id);
  if (!mech) return res.status(404).json({ error: "Tamirci bulunamadı." });
  if (actor.role !== "admin" && actor.id !== mech.id) {
    return res.status(403).json({ error: "Yalnızca kendi profilinizdeki yorumları yanıtlayabilirsiniz." });
  }
  const text = String(req.body?.reply ?? "").slice(0, MAX_REPLY_LEN).trim();
  const list = readList(mech);
  const target = list.find((r) => String(r.id) === String(req.params.reviewId));
  if (!target) return res.status(404).json({ error: "Yorum bulunamadı." });
  const updated = saveList(mech.id, list.map((r) => (r === target ? { ...r, reply: text || null } : r)));
  res.json({ mechanic: hydrate("mechanics", updated) });
});

/** "Faydalı" işareti — kişi başına bir kez, sayacı SUNUCU tutar. */
reviewsRouter.post("/:id/reviews/:reviewId/helpful", (req, res) => {
  const actor = actorOf(req, res);
  if (!actor) return;
  // Yorum yazmak gibi, "faydalı" oyu da bir MÜŞTERİ sinyalidir. Tamirci hesabıyla başka bir
  // tamircinin yorumlarını öne çıkarmak/gizlemek rekabet aracı olurdu.
  if (actor.role === "mechanic") {
    return res.status(403).json({ error: "Tamirci hesabıyla değerlendirme beğenilemez.", reason: "mechanicRole" });
  }
  if (limited(req, res)) return;
  const mech = db.prepare(`SELECT * FROM mechanics WHERE id = ?`).get(req.params.id);
  if (!mech) return res.status(404).json({ error: "Tamirci bulunamadı." });
  const list = readList(mech);
  const target = list.find((r) => String(r.id) === String(req.params.reviewId));
  if (!target) return res.status(404).json({ error: "Yorum bulunamadı." });
  // Kimin beğendiğini kaydediyoruz: aksi halde aynı kişi sayacı istediği kadar artırabilirdi.
  const voters = Array.isArray(target.helpfulBy) ? target.helpfulBy : [];
  const key = `${actor.role}:${actor.id}`;
  const nextVoters = voters.includes(key) ? voters.filter((v) => v !== key) : [...voters, key];
  const updated = saveList(mech.id, list.map((r) => (
    r === target ? { ...r, helpfulBy: nextVoters, helpful: nextVoters.length } : r
  )));
  res.json({ mechanic: hydrate("mechanics", updated), liked: nextVoters.includes(key) });
});

export default reviewsRouter;
