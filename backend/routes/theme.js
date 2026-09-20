import { Router } from "express";
import { db } from "../db/db.js";
import { isAdminToken, extractBearerToken } from "../utils/auth.js";

// Site-geneli aktif renk paleti. GET herkese açık — her ziyaretçinin tarayıcısı sayfa
// yüklenirken hangi paleti uygulayacağını bilmeli. PATCH sadece admin girişiyle.
const KNOWN_PALETTES = ["default", "trust", "industrial", "performance", "european", "minimal"];
const SETTING_KEY = "activePalette";

const router = Router();

router.get("/", (req, res) => {
  const row = db.prepare("SELECT value FROM site_settings WHERE key = ?").get(SETTING_KEY);
  res.json({ palette: row ? row.value : "default" });
});

router.patch("/", (req, res) => {
  const token = extractBearerToken(req);
  if (!isAdminToken(token)) {
    return res.status(401).json({ error: "Bu işlem için admin girişi gerekiyor." });
  }
  const { palette } = req.body || {};
  if (typeof palette !== "string" || !KNOWN_PALETTES.includes(palette)) {
    return res.status(400).json({ error: `Geçersiz palet. Beklenen: ${KNOWN_PALETTES.join(", ")}` });
  }
  db.prepare(
    "INSERT INTO site_settings (key, value, updatedAt) VALUES (?, ?, datetime('now')) " +
    "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt"
  ).run(SETTING_KEY, palette);
  res.json({ ok: true, palette });
});

export default router;
