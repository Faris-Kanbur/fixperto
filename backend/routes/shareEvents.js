import { Router } from "express";
import { db } from "../db/db.js";

// Paylaşım analitiği: her ShareButton eylemi ayrı bir satır (kendi refCode'u ile). Link o refCode'u
// taşıdığı için tıklama ve sonraki dönüşüm (sohbet/randevu/teklif/başvuru) aynı satıra atfedilebiliyor.
// Bkz. frontend/src/app/state/AppLogicProvider.tsx: recordShare, recordConversion, deep-link click efekti.
const router = Router();

router.post("/", (req, res) => {
  const { targetType, targetId, channel, refCode, sharedBy } = req.body || {};
  if (!targetType || !targetId || !channel || !refCode) {
    return res.status(400).json({ error: "targetType, targetId, channel ve refCode zorunludur." });
  }
  try {
    const stmt = db.prepare(
      `INSERT INTO share_events (targetType, targetId, channel, refCode, sharedBy) VALUES (@targetType,@targetId,@channel,@refCode,@sharedBy)`
    );
    const info = stmt.run({ targetType, targetId, channel, refCode, sharedBy: sharedBy || null });
    const created = db.prepare(`SELECT * FROM share_events WHERE id = ?`).get(info.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    // refCode UNIQUE çakışması gibi beklenmedik durumlarda paylaşımın kendisini bozmasın diye
    // sessizce 200 dönüyoruz — bu sadece analitik verisi, kritik bir işlem değil.
    res.status(200).json({ ok: false, error: err.message });
  }
});

router.post("/:refCode/click", (req, res) => {
  const info = db.prepare(`UPDATE share_events SET clickCount = clickCount + 1 WHERE refCode = ?`).run(req.params.refCode);
  if (info.changes === 0) return res.status(404).json({ error: "Paylaşım kaydı bulunamadı." });
  res.json(db.prepare(`SELECT * FROM share_events WHERE refCode = ?`).get(req.params.refCode));
});

router.post("/:refCode/convert", (req, res) => {
  const info = db.prepare(`UPDATE share_events SET conversionCount = conversionCount + 1 WHERE refCode = ?`).run(req.params.refCode);
  if (info.changes === 0) return res.status(404).json({ error: "Paylaşım kaydı bulunamadı." });
  res.json(db.prepare(`SELECT * FROM share_events WHERE refCode = ?`).get(req.params.refCode));
});

router.get("/stats", (req, res) => {
  const byChannel = db.prepare(
    `SELECT channel, COUNT(*) AS shares, SUM(clickCount) AS clicks, SUM(conversionCount) AS conversions FROM share_events GROUP BY channel ORDER BY shares DESC`
  ).all();
  const byTarget = db.prepare(
    `SELECT targetType, targetId, COUNT(*) AS shares, SUM(clickCount) AS clicks, SUM(conversionCount) AS conversions FROM share_events GROUP BY targetType, targetId ORDER BY shares DESC LIMIT 20`
  ).all();
  const totals = db.prepare(
    `SELECT COUNT(*) AS shares, COALESCE(SUM(clickCount), 0) AS clicks, COALESCE(SUM(conversionCount), 0) AS conversions FROM share_events`
  ).get();
  res.json({ totals, byChannel, byTarget });
});

export default router;
