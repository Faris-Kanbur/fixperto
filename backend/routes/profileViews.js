import { Router } from "express";
import crypto from "node:crypto";
import { db } from "../db/db.js";
import { clientIp, rateLimitKey } from "../utils/clientIp.js";
import { makeRateLimiter, resolveActor } from "../utils/auth.js";

/**
 * KİM HANGİ HEDEFİN İSTATİSTİĞİNİ GÖREBİLİR (ikinci denetimde eklendi).
 * ================================================================================================
 * BULUNAN SORUN: önceki denetim, parametresiz `/stats` çağrısını (platform toplamı) admin'e
 * kapatmıştı ve gerekçesini yazmıştı: "rakipler dâhil herkes sitenin gerçek trafik ve dönüşüm
 * verisini tek istekle çekebiliyordu". Ama HEDEF BAZLI yol (`?targetType=mechanic&targetId=5`) ve
 * hele `/stats/bulk` (tek istekte 200 hedef) kimlik doğrulaması olmadan açık kalmıştı — yorumda
 * "kullanıcıların kendi analiz ekranları için açık kalmaya devam ediyor" yazıyordu ama kodda
 * "kendi" diye bir kontrol yoktu. Ölçüldü: girişsiz bir istek başka bir tamircinin toplam
 * görüntülenme, dönüşüm ve AYLIK kırılımını 200 ile aldı; bulk ile 200 rakip tek istekte.
 *
 * Yani toplu kapı kilitlenmiş, tek tek girilen kapı açık bırakılmıştı — ve bulk ucu o kapıdan
 * toplu geçmeyi tekrar mümkün kılıyordu, yani düzeltmeyi fiilen geri alıyordu.
 *
 * KURAL: bir hedefin dönüşüm hunisi o hedefin SAHİBİNİN (ve yöneticinin) işletme verisidir.
 */
function ownsTarget(actor, targetType, targetId) {
  if (!actor) return false;
  if (actor.role === "admin") return true;
  const id = String(targetId);
  if (targetType === "mechanic") return actor.role === "mechanic" && String(actor.id) === id;
  if (targetType === "listing") {
    const l = db.prepare(`SELECT sellerId, sellerType FROM listings WHERE id = ?`).get(targetId);
    return !!l && String(l.sellerId) === String(actor.id) && (l.sellerType || "owner") === actor.role;
  }
  if (targetType === "job") {
    const j = db.prepare(`SELECT mechanicId FROM job_listings WHERE id = ?`).get(targetId);
    return !!j && actor.role === "mechanic" && String(j.mechanicId) === String(actor.id);
  }
  return false;
}

// Tamirci profili / araç ilanı görüntülenme takibi. Her açılışta bir satır eklenir; bir randevu/
// dönüşüm gerçekleşirse o satır "converted" olarak işaretlenir (bkz. AppLogicProvider.tsx).
// GET /stats iki modda çalışır: ?targetType&targetId verilirse TEK bir hedef için (tamircinin kendi
// Analiz sekmesinde ya da ilan sahibinin kendi ilanında görmesi için); hiç parametre verilmezse
// TÜM platform için toplu (admin panel "Sayfa Ziyaretleri" bölümü).
const router = Router();

// GÜVENLİK DÜZELTMESİ (bu denetimde bulundu — KİMLİKSİZ SINIRSIZ YAZMA):
// Bu uç noktalar kimlik doğrulaması ve hız sınırı olmadan açıktı. İki somut sonucu vardı:
// (1) bir tamircinin görüntülenme/paylaşım sayaçları bir betikle şişirilebilir, "en çok bakılan
//     tamirci" gibi ekranlar anlamsızlaşırdı; (2) tabloya sınırsız satır yazdırılarak diskin
//     dolması sağlanabilirdi. Kimlik zorunlu KILINAMIYOR (girişsiz ziyaretçinin görüntülenmesi de
//     sayılmalı), bu yüzden IP başına dakikalık bir tavan konuyor — gerçek bir ziyaretçi dakikada
//     120 profil açmaz, betik açar.
const writeLimiter = makeRateLimiter({ maxAttempts: 120, lockoutMs: 5 * 60 * 1000, windowMs: 60 * 1000 });
const limitWrites = (req, res, next) => {
  const ip = rateLimitKey(req);
  if (writeLimiter.check(ip).blocked) return res.status(429).json({ error: "Çok fazla istek. Lütfen birkaç dakika sonra tekrar deneyin." });
  writeLimiter.registerFailure(ip);
  next();
};

// Yalnızca gerçekten var olan hedef türleri — serbest metin kabul etmek tabloyu çöple doldurmanın
// ve istatistik gruplarını uydurmanın yoluydu.
const TARGET_TYPES = new Set(["mechanic", "listing", "job"]);

router.post("/", limitWrites, (req, res) => {
  const { targetType, targetId } = req.body || {};
  if (!targetType || !targetId) return res.status(400).json({ error: "targetType ve targetId zorunludur." });
  if (!TARGET_TYPES.has(String(targetType))) return res.status(400).json({ error: "Geçersiz targetType." });
  // Dönüşüm damgası için tek kullanımlık jeton (bkz. /:id/convert yorumu).
  const convertToken = crypto.randomBytes(16).toString("hex");
  const info = db.prepare(`INSERT INTO profile_views (targetType, targetId, convertToken) VALUES (?, ?, ?)`)
    .run(targetType, targetId, convertToken);
  res.status(201).json(db.prepare(`SELECT * FROM profile_views WHERE id = ?`).get(info.lastInsertRowid));
});

/**
 * GÜVENLİK DÜZELTMESİ (ikinci denetimde ÖLÇÜLDÜ) — KİMLİKSİZ IDOR YAZMA.
 * ------------------------------------------------------------------------------------------------
 * Bu uç, HERHANGİ bir `profile_views` satırını `converted = 1` yapıyordu: kimlik doğrulaması yok,
 * sahiplik kontrolü yok, ve id ARDIŞIK TAMSAYI. Ölçüldü: girişsiz bir istekle id=1 dönüşüm olarak
 * damgalandı. Yani tabloyu 1'den başlayarak dolaşan bir betik, platformdaki HER görüntülenmeyi
 * dönüşüme çevirip tamircilerin "Analiz" sekmesindeki dönüşüm oranını ve yönetici panelindeki
 * "en çok dönüşen" listelerini tamamen anlamsızlaştırabiliyordu.
 *
 * NEDEN "kimlik zorunlu" yapmıyoruz: dönüşüm, girişsiz bir ziyaretçinin de yapabileceği bir eylem
 * (profili açıp sohbet başlatmak). Bunun yerine, damganın YALNIZCA görüntülemeyi yapan tarayıcının
 * kendi satırını işaretleyebilmesini sağlıyoruz: POST /api/profile-views artık satırla birlikte
 * tek kullanımlık bir `convertToken` üretiyor ve dönüşüm o token'la yapılıyor. Token'ı yalnızca
 * görüntülemeyi kaydeden istemci görüyor; id bilmek artık yetmiyor.
 *
 * Ayrıca damga TEK YÖNLÜ ve TEK SEFERLİK: aynı satır iki kez dönüşüm sayılamıyor (sayaç şişirme).
 */
router.post("/:id/convert", limitWrites, (req, res) => {
  const viewRow = db.prepare(`SELECT id, converted, convertToken FROM profile_views WHERE id = ?`).get(req.params.id);
  if (!viewRow) return res.status(404).json({ error: "Görüntülenme kaydı bulunamadı." });

  const given = String(req.body?.convertToken || "");
  const actor = resolveActor(req);
  const isAdmin = actor?.role === "admin";
  // Token yoksa (eski kayıtlar) yalnızca yönetici işaretleyebilir — sessizce açık bırakmak,
  // düzeltmeyi hiç yapmamakla aynı şey olurdu.
  if (!isAdmin && (!viewRow.convertToken || given !== viewRow.convertToken)) {
    return res.status(403).json({ error: "Bu görüntülenme kaydını işaretleme yetkiniz yok." });
  }
  if (Number(viewRow.converted) === 1) {
    // Zaten dönüşmüş: hata değil ama İKİNCİ KEZ SAYILMIYOR.
    return res.json({ ...db.prepare(`SELECT * FROM profile_views WHERE id = ?`).get(viewRow.id), alreadyConverted: true });
  }
  db.prepare(`UPDATE profile_views SET converted = 1 WHERE id = ?`).run(viewRow.id);
  res.json(db.prepare(`SELECT * FROM profile_views WHERE id = ?`).get(viewRow.id));
});

// Tamirci galeri paneli (toplu ilan yönetimi): tek tek her ilan için ayrı bir GET /stats isteği
// atmak yerine (10-20 ilanlık bir galeride N+1 istek sorunu olurdu), tüm ilan id'lerini tek
// istekte alıp targetId -> { totalViews, viewsInRange, conversions, conversionsInRange } haritası
// dönüyoruz. Tek hedefli /stats ile aynı `days` opsiyonel aralık mantığını paylaşır.
//
// GÜVENLİK NOTU (bu özelliğin denetiminde eklendi): 200 id'lik bir istek tek başına ~400 SQLite
// sorgusu tetikleyebiliyor — tekil /stats'a göre aynı veriyi toplamak artık 200 kat daha ucuz.
// Diğer profil-görüntülenme uç noktalarında hiç IP başı hız sınırı yoktu (bu özellik öncesinde de
// yoktu, o kısma dokunulmadı) ama bulk uç noktası bunu somut bir kötüye kullanım/DoS aracına
// çevirdiği için (art arda spam edilerek), en azından bu yeni uç noktaya backend/utils/auth.js'teki
// paylaşılan hız sınırlayıcı (login/OTP'de kullanılanla aynı desen) uygulandı.
const bulkStatsLimiter = makeRateLimiter({ maxAttempts: 30, lockoutMs: 5 * 60 * 1000 });
router.get("/stats/bulk", (req, res) => {
  const ip = rateLimitKey(req);
  if (bulkStatsLimiter.check(ip).blocked) {
    return res.status(429).json({ error: "Çok fazla istek. Lütfen birkaç dakika sonra tekrar deneyin." });
  }
  bulkStatsLimiter.registerFailure(ip);
  const { targetType, targetIds, days } = req.query;
  if (!targetType || !targetIds) return res.status(400).json({ error: "targetType ve targetIds zorunludur." });
  const ids = String(targetIds).split(",").map((s) => s.trim()).filter(Boolean).slice(0, 200);
  if (ids.length === 0) return res.json({});
  /**
   * SAHİPLİK HER ID İÇİN AYRI AYRI KONTROL EDİLİYOR (bkz. dosya başındaki ownsTarget yorumu).
   * Yetkisiz id'ler SESSİZCE ATILMIYOR, istek tamamen reddediliyor: sessiz filtreleme, çağıranın
   * eksik veriyi tam sanmasına yol açar (bu takımın başka yerlerinde de aynı ilke).
   */
  const actor = resolveActor(req);
  const forbidden = ids.filter((id) => !ownsTarget(actor, String(targetType), id));
  if (forbidden.length > 0) {
    return res.status(403).json({ error: "Bu hedeflerin istatistiklerine erişim yetkiniz yok.", targetIds: forbidden });
  }
  const daysNum = parseInt(days, 10);
  const hasRange = Number.isFinite(daysNum) && daysNum > 0;
  const cutoff = hasRange ? new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ") : null;
  const result = {};
  const totalStmt = db.prepare(`SELECT COUNT(*) n, COALESCE(SUM(converted), 0) c FROM profile_views WHERE targetType = ? AND targetId = ?`);
  const rangeStmt = hasRange ? db.prepare(`SELECT COUNT(*) n, COALESCE(SUM(converted), 0) c FROM profile_views WHERE targetType = ? AND targetId = ? AND createdAt >= ?`) : null;
  for (const id of ids) {
    const totals = totalStmt.get(targetType, id);
    const inRange = hasRange ? rangeStmt.get(targetType, id, cutoff) : null;
    result[id] = {
      totalViews: totals.n, conversions: totals.c,
      viewsInRange: inRange ? inRange.n : null, conversionsInRange: inRange ? inRange.c : null,
    };
  }
  res.json(result);
});

router.get("/stats", (req, res) => {
  const { targetType, targetId, days } = req.query;
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");

  if (targetType && targetId) {
    // Hedef bazlı istatistik SAHİBİNE ait (bkz. dosya başındaki ownsTarget yorumu).
    if (!ownsTarget(resolveActor(req), String(targetType), targetId)) {
      return res.status(403).json({ error: "Bu hedefin istatistiklerine erişim yetkiniz yok." });
    }
    const totalViews = db.prepare(`SELECT COUNT(*) n FROM profile_views WHERE targetType = ? AND targetId = ?`).get(targetType, targetId).n;
    const viewsThisYear = db.prepare(`SELECT COUNT(*) n FROM profile_views WHERE targetType = ? AND targetId = ? AND createdAt >= ?`).get(targetType, targetId, oneYearAgo).n;
    const conversions = db.prepare(`SELECT COUNT(*) n FROM profile_views WHERE targetType = ? AND targetId = ? AND converted = 1`).get(targetType, targetId).n;
    const conversionsThisYear = db.prepare(`SELECT COUNT(*) n FROM profile_views WHERE targetType = ? AND targetId = ? AND converted = 1 AND createdAt >= ?`).get(targetType, targetId, oneYearAgo).n;
    const monthly = db.prepare(
      `SELECT strftime('%Y-%m', createdAt) AS month, COUNT(*) AS views, SUM(converted) AS conversions
       FROM profile_views WHERE targetType = ? AND targetId = ? AND createdAt >= ? GROUP BY month ORDER BY month`
    ).all(targetType, targetId, oneYearAgo);
    // Tamircinin "Analiz" sekmesindeki zaman aralığı filtresi (son 24 saat/1 hafta/1 ay/6 ay) için:
    // istemci bir `days` parametresi gönderirse o pencereye göre de sayım döndürüyoruz — böylece
    // filtre değiştiğinde "Bu Yıl" sabit penceresine değil, seçilen aralığa göre sayı görünüyor.
    let viewsInRange = null;
    let conversionsInRange = null;
    const daysNum = parseInt(days, 10);
    if (Number.isFinite(daysNum) && daysNum > 0) {
      const cutoff = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");
      viewsInRange = db.prepare(`SELECT COUNT(*) n FROM profile_views WHERE targetType = ? AND targetId = ? AND createdAt >= ?`).get(targetType, targetId, cutoff).n;
      conversionsInRange = db.prepare(`SELECT COUNT(*) n FROM profile_views WHERE targetType = ? AND targetId = ? AND converted = 1 AND createdAt >= ?`).get(targetType, targetId, cutoff).n;
    }
    return res.json({ totalViews, viewsThisYear, conversions, conversionsThisYear, monthly, viewsInRange, conversionsInRange });
  }

  // GÜVENLİK DÜZELTMESİ (tam site denetiminde bulundu): parametresiz çağrıldığında bu uç nokta
  // platformun TAMAMINA ait görüntülenme/dönüşüm verisini ve en çok görüntülenen tamirci/ilan
  // listesini kimlik doğrulaması olmadan döndürüyordu. Bunu kullanan tek ekran admin panelinin
  // "Sayfa Ziyaretleri" bölümü; hedef bazlı (targetType+targetId) çağrılar ise kullanıcıların kendi
  // analiz ekranları için açık kalmaya devam ediyor.
  const actor = resolveActor(req);
  if (actor?.role !== "admin") {
    return res.status(403).json({ error: "Bu veriye erişim yetkiniz yok." });
  }
  const totals = db.prepare(`SELECT COUNT(*) AS views, COALESCE(SUM(converted), 0) AS conversions FROM profile_views`).get();
  const byTargetType = db.prepare(
    `SELECT targetType, COUNT(*) AS views, COALESCE(SUM(converted), 0) AS conversions FROM profile_views GROUP BY targetType`
  ).all();
  const topMechanics = db.prepare(
    `SELECT targetId, COUNT(*) AS views, COALESCE(SUM(converted), 0) AS conversions FROM profile_views WHERE targetType = 'mechanic' GROUP BY targetId ORDER BY views DESC LIMIT 10`
  ).all();
  const topListings = db.prepare(
    `SELECT targetId, COUNT(*) AS views, COALESCE(SUM(converted), 0) AS conversions FROM profile_views WHERE targetType = 'listing' GROUP BY targetId ORDER BY views DESC LIMIT 10`
  ).all();
  res.json({ totals, byTargetType, topMechanics, topListings });
});

export default router;
