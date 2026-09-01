import { Router } from "express";
import { db } from "../db/db.js";
import { makeRateLimiter } from "../utils/auth.js";

// Tamirci profili / araç ilanı görüntülenme takibi. Her açılışta bir satır eklenir; bir randevu/
// dönüşüm gerçekleşirse o satır "converted" olarak işaretlenir (bkz. AppLogicProvider.tsx).
// GET /stats iki modda çalışır: ?targetType&targetId verilirse TEK bir hedef için (tamircinin kendi
// Analiz sekmesinde ya da ilan sahibinin kendi ilanında görmesi için); hiç parametre verilmezse
// TÜM platform için toplu (admin panel "Sayfa Ziyaretleri" bölümü).
const router = Router();

router.post("/", (req, res) => {
  const { targetType, targetId } = req.body || {};
  if (!targetType || !targetId) return res.status(400).json({ error: "targetType ve targetId zorunludur." });
  const info = db.prepare(`INSERT INTO profile_views (targetType, targetId) VALUES (?, ?)`).run(targetType, targetId);
  res.status(201).json(db.prepare(`SELECT * FROM profile_views WHERE id = ?`).get(info.lastInsertRowid));
});

router.post("/:id/convert", (req, res) => {
  const info = db.prepare(`UPDATE profile_views SET converted = 1 WHERE id = ?`).run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "Görüntülenme kaydı bulunamadı." });
  res.json(db.prepare(`SELECT * FROM profile_views WHERE id = ?`).get(req.params.id));
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
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  if (bulkStatsLimiter.check(ip).blocked) {
    return res.status(429).json({ error: "Çok fazla istek. Lütfen birkaç dakika sonra tekrar deneyin." });
  }
  bulkStatsLimiter.registerFailure(ip);
  const { targetType, targetIds, days } = req.query;
  if (!targetType || !targetIds) return res.status(400).json({ error: "targetType ve targetIds zorunludur." });
  const ids = String(targetIds).split(",").map((s) => s.trim()).filter(Boolean).slice(0, 200);
  if (ids.length === 0) return res.json({});
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
