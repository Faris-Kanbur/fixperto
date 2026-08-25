import { Router } from "express";
import { db } from "../db/db.js";

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

router.get("/stats", (req, res) => {
  const { targetType, targetId } = req.query;
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
    return res.json({ totalViews, viewsThisYear, conversions, conversionsThisYear, monthly });
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
