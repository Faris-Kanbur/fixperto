import { Router } from "express";
import { db } from "../db/db.js";
import { hydrateAll } from "../db/hydrate.js";
import { makeRateLimiter, resolveActor } from "../utils/auth.js";
import { rateLimitKey } from "../utils/clientIp.js";

/**
 * BİLDİRİMLER — daha önce hiç yoktu, tamamen istemci tarafında (bkz. el kitabı 15.1'in eski
 * mimari notu: "notifLog saf React state'i, sunucuda YOK"). Sonucu: bildirim sayfa yenilendiğinde
 * kayboluyordu, ikinci cihazda hiç görünmüyordu, ve hedefleme bir KİMLİĞE değil bir ROLE bağlıydı
 * (`notifyRole: "mechanic"`) — yani teknik olarak bir tamirci hesabı, başka bir tamirciye giden
 * bildirimi de (aynı sekmede kalsaydı) görebilirdi, çünkü "hangi tamirci" hiç ayrılmıyordu. Bu
 * router, her bildirime GERÇEK bir alıcı (recipientRole + recipientId) ve kalıcılık kazandırıyor.
 *
 * OKUNDU DURUMU BİLİNÇLİ OLARAK BURADA DEĞİL: ön yüzdeki "okunmadı" rozeti tek bir zaman damgasına
 * (panelin en son ne zaman açıldığı) dayanıyor, bildirim başına değil — bu, kullanıcı tarafında
 * saklanan bir GÖRÜNÜM tercihi, veri bütünlüğü gerektiren bir alan değil. Kaybolması (yeni cihazda
 * her şey "okunmadı" görünmesi) küçük bir kullanılabilirlik notu, bir hata değil; kalıcı kayıp
 * riski taşıyan asıl veri (bildirimin kendisi) burada zaten kalıcı.
 */
export const notificationsRouter = Router();

const VALID_ROLES = new Set(["owner", "mechanic"]);
const MAX_TITLE_LEN = 200;
const MAX_BODY_LEN = 1000;
const MAX_LIST = 40; // ön yüzdeki eski `.slice(0, 40)` kapasite kuralıyla aynı (bkz. handbook 15.1).

// Bir istekte kaç bildirim oluşturulabileceğinin tavanı — gerçek bir işlem (randevu, teklif,
// mesaj...) tek bir bildirim ya da bir avuç mekanik ID'si için birkaç bildirim üretir; onun
// dışında biri tek istekte binlerce sahte alıcı yazmaya çalışırsa reddedilir.
const MAX_RECIPIENTS_PER_CALL = 50;

// Bildirim yazma: IP + oturum başına dakikalık tavan. Gerçek bir kullanıcı dakikada onlarca
// randevu/teklif/mesaj olayı üretmez; bu, tek bir hesabın zil listesini spam'le doldurmasını
// (ya da başka birinin zil listesini şişirmesini) ucuz olmaktan çıkarıyor.
const writeLimiter = makeRateLimiter({ maxAttempts: 60, lockoutMs: 5 * 60 * 1000, windowMs: 60 * 1000 });

/**
 * GET / — çağıranın KENDİ bildirimleri.
 * `recipientId IS NULL` satırları da dönüyor: bunlar yöneticinin DUYURU'su, "bu roldeki
 * herkese" anlamına geliyor (bkz. POST altındaki yorum) — çağıranın kendi kimliğiyle eşleşen
 * satırlarla birlikte tek bir zaman sıralı listede geliyor.
 */
notificationsRouter.get("/", (req, res) => {
  const actor = resolveActor(req);
  if (!actor) return res.status(401).json({ error: "Bu veriye erişmek için giriş yapmanız gerekiyor." });
  if (!VALID_ROLES.has(actor.role)) return res.json([]); // admin'in kişisel bir bildirim kutusu yok.
  const rows = db.prepare(
    `SELECT * FROM notifications WHERE recipientRole = ? AND (recipientId = ? OR recipientId IS NULL) ORDER BY createdAt DESC, id DESC LIMIT ?`
  ).all(actor.role, actor.id, MAX_LIST);
  res.json(hydrateAll("notifications", rows));
});

/**
 * POST / — bildirim oluştur. Gövde: { recipients: [{ recipientRole, recipientId }], title, body,
 * targetType?, targetId? } — TEK bir çağrıda BİRDEN FAZLA alıcıya aynı bildirim yazılabilir (ör.
 * çoklu teklif isteğinde her seçilen tamirciye), tek tek istek atmak yerine.
 *
 * recipientId NULL yalnızca YÖNETİCİNİN duyurusunda kabul edilir (bkz. sendBroadcast, admin
 * girişi zorunlu) — kişiye özel bir bildirim (randevu, mesaj, teklif...) her zaman GERÇEK VE VAR
 * OLAN bir owner/mechanic kaydını hedeflemeli; aksi halde "kimin zil listesine yazıldığı"
 * bilinmeyen, temizlenemeyen çöp satırlar birikir.
 */
notificationsRouter.post("/", (req, res) => {
  const actor = resolveActor(req);
  if (!actor) return res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." });

  const key = rateLimitKey(req);
  if (writeLimiter.check(key).blocked) {
    return res.status(429).json({ error: "Çok fazla bildirim isteği. Lütfen birkaç dakika sonra tekrar deneyin." });
  }

  const title = String(req.body?.title || "").trim();
  const body = String(req.body?.body || "").trim();
  if (!title || !body) return res.status(400).json({ error: "Bildirim başlığı ve metni zorunludur." });
  if (title.length > MAX_TITLE_LEN) return res.status(400).json({ error: `Başlık en fazla ${MAX_TITLE_LEN} karakter olabilir.` });
  if (body.length > MAX_BODY_LEN) return res.status(400).json({ error: `Bildirim metni en fazla ${MAX_BODY_LEN} karakter olabilir.` });

  const targetType = req.body?.targetType != null ? String(req.body.targetType) : null;
  const targetIdRaw = req.body?.targetId;
  const targetId = targetIdRaw != null && targetIdRaw !== "" ? Number(targetIdRaw) : null;
  if (targetIdRaw != null && targetIdRaw !== "" && !Number.isFinite(targetId)) {
    return res.status(400).json({ error: "Geçersiz hedef kimliği." });
  }

  const recipientsRaw = Array.isArray(req.body?.recipients) ? req.body.recipients : [];
  if (recipientsRaw.length === 0) return res.status(400).json({ error: "En az bir alıcı gerekli." });
  if (recipientsRaw.length > MAX_RECIPIENTS_PER_CALL) {
    return res.status(400).json({ error: `Tek istekte en fazla ${MAX_RECIPIENTS_PER_CALL} alıcıya bildirim gönderilebilir.` });
  }

  const insert = db.prepare(
    `INSERT INTO notifications (recipientRole, recipientId, title, body, targetType, targetId) VALUES (@recipientRole, @recipientId, @title, @body, @targetType, @targetId)`
  );
  const created = [];
  const tx = db.transaction((recipients) => {
    for (const r of recipients) {
      const recipientRole = r?.recipientRole;
      if (!VALID_ROLES.has(recipientRole)) throw { status: 400, error: `Geçersiz alıcı rolü: ${recipientRole}` };

      const isBroadcast = r?.recipientId == null;
      if (isBroadcast) {
        if (actor.role !== "admin") throw { status: 403, error: "Yalnızca yönetici tüm kullanıcılara duyuru gönderebilir." };
      } else {
        const recipientId = Number(r.recipientId);
        if (!Number.isFinite(recipientId)) throw { status: 400, error: "Geçersiz alıcı kimliği." };
        const table = recipientRole === "owner" ? "owners" : "mechanics";
        const exists = db.prepare(`SELECT id FROM ${table} WHERE id = ?`).get(recipientId);
        if (!exists) throw { status: 400, error: `Alıcı bulunamadı: ${recipientRole} #${recipientId}` };
      }

      const info = insert.run({
        recipientRole,
        recipientId: isBroadcast ? null : Number(r.recipientId),
        title, body, targetType, targetId,
      });
      created.push(info.lastInsertRowid);
    }
  });

  try {
    tx(recipientsRaw);
  } catch (err) {
    if (err && err.status) return res.status(err.status).json({ error: err.error });
    throw err;
  }

  const rows = db.prepare(`SELECT * FROM notifications WHERE id IN (${created.map(() => "?").join(",")})`).all(...created);
  res.status(201).json(hydrateAll("notifications", rows));
});

export default notificationsRouter;
