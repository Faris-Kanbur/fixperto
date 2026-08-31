import { Router } from "express";
import { db } from "../db/db.js";
import { createAdminSession, destroyAdminSession, isAdminToken, extractBearerToken } from "../utils/auth.js";

// Same demo admin credentials the single-file app used to hardcode client-side.
// In a real deployment these belong in env vars / a hashed-password users table,
// not in source — kept simple here to match the existing demo's scope.
const ADMIN_CREDENTIALS = {
  email: process.env.FIXPERTO_ADMIN_EMAIL || "admin@fixperto.com",
  password: process.env.FIXPERTO_ADMIN_PASSWORD || "Fixperto2026!",
};

// GÜVENLİK DÜZELTMESİ: /login gerçek kimlik bilgilerini doğruluyordu ama arkasındaki uç noktalar
// (aşağıdaki /stats, /change-log GET/POST/PATCH) hiçbir kimlik doğrulaması YAPMIYORDU — yani giriş
// yapmadan da herhangi biri bu verileri okuyabilir/yazabilirdi, /login sadece bir "kapı" gibi
// duruyordu. Şimdi başarılı girişte rastgele, tahmin edilemez bir token üretilip sunucu belleğinde
// tutuluyor (bkz. backend/utils/auth.js createAdminSession — owner/mechanic oturumlarıyla aynı
// paylaşılan modülde, böylece makeCrudRouter.js gibi diğer router'lar da "bu token admine mi ait"
// diye sorabiliyor); aşağıdaki admin-özel uç noktalar bu token'ı `Authorization: Bearer <token>`
// header'ında istiyor. Token'ı bilerek kalıcı bir DB tablosuna ya da dosyaya YAZMIYORUZ — sunucu
// yeniden başladığında tüm tokenlar geçersiz olur ve admin tekrar giriş yapar; bu, projenin zaten
// benimsediği "kalıcı oturum yok, localStorage'a token koyma" tercihiyle tutarlı (bkz.
// REFACTOR_REPORT.md bölüm 9 madde 3 — XSS'e karşı en güvenli yaklaşım).
function requireAdminAuth(req, res, next) {
  const token = extractBearerToken(req);
  if (!isAdminToken(token)) {
    return res.status(401).json({ error: "Bu işlem için admin girişi gerekiyor." });
  }
  next();
}

// GÜVENLİK DÜZELTMESİ: /login'de hiçbir deneme sınırı yoktu — env değişkenleri set edilmemiş bir
// dağıtımda varsayılan şifre (yukarıdaki ADMIN_CREDENTIALS fallback'i) devrede kalır ve sınırsız
// deneme ile kaba kuvvet (brute-force) saldırısına açık olurdu. Basit, bağımlılıksız bir IP başına
// sayaç: bir IP art arda 10 başarısız denemeden sonra 15 dakika kilitleniyor. Başarılı bir girişte
// o IP'nin sayacı sıfırlanır.
const LOGIN_MAX_ATTEMPTS = 10;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;
const loginAttempts = new Map(); // ip -> { count, lockedUntil }

function checkLoginRateLimit(ip) {
  const entry = loginAttempts.get(ip);
  if (!entry) return { blocked: false };
  if (entry.lockedUntil && entry.lockedUntil > Date.now()) return { blocked: true };
  if (entry.lockedUntil && entry.lockedUntil <= Date.now()) loginAttempts.delete(ip);
  return { blocked: false };
}

function registerLoginFailure(ip) {
  const entry = loginAttempts.get(ip) || { count: 0, lockedUntil: null };
  entry.count += 1;
  if (entry.count >= LOGIN_MAX_ATTEMPTS) entry.lockedUntil = Date.now() + LOGIN_LOCKOUT_MS;
  loginAttempts.set(ip, entry);
}

const router = Router();

router.post("/login", (req, res) => {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  if (checkLoginRateLimit(ip).blocked) {
    return res.status(429).json({ ok: false, error: "Çok fazla başarısız deneme. Lütfen birkaç dakika sonra tekrar deneyin." });
  }
  const { email, password } = req.body || {};
  if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
    loginAttempts.delete(ip);
    const token = createAdminSession();
    return res.json({ ok: true, token });
  }
  registerLoginFailure(ip);
  res.status(401).json({ ok: false, error: "Geçersiz e-posta veya şifre." });
});

router.post("/logout", (req, res) => {
  const token = extractBearerToken(req);
  if (token) destroyAdminSession(token);
  res.json({ ok: true });
});

router.get("/change-log", requireAdminAuth, (req, res) => {
  const rows = db.prepare(`SELECT * FROM admin_change_log ORDER BY id DESC LIMIT 200`).all();
  res.json(rows.map((r) => ({ ...r, reverted: !!r.reverted, before: r.before ? JSON.parse(r.before) : null, after: r.after ? JSON.parse(r.after) : null })));
});

router.post("/change-log", requireAdminAuth, (req, res) => {
  const { actor = "admin", action, entityType, entityId, before, after } = req.body || {};
  const stmt = db.prepare(`INSERT INTO admin_change_log (actor, action, entityType, entityId, before, after) VALUES (@actor,@action,@entityType,@entityId,@before,@after)`);
  const info = stmt.run({ actor, action, entityType, entityId: String(entityId ?? ""), before: before ? JSON.stringify(before) : null, after: after ? JSON.stringify(after) : null });
  res.status(201).json({ id: info.lastInsertRowid });
});

// "Geri Al" (undo) bir değişiklik geçmişi satırını kalıcı olarak "reverted" işaretler — bu sayede
// sayfa yenilendiğinde (ya da admin başka bir cihazdan girdiğinde) hangi değişikliklerin zaten
// geri alındığı kaybolmaz (bkz. AppLogicProvider.tsx revertAdminChange/-Group).
router.patch("/change-log/:id", requireAdminAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Geçersiz kayıt id'si." });
  const existing = db.prepare(`SELECT id FROM admin_change_log WHERE id = ?`).get(id);
  if (!existing) return res.status(404).json({ error: "Değişiklik geçmişi kaydı bulunamadı." });
  db.prepare(`UPDATE admin_change_log SET reverted = 1 WHERE id = ?`).run(id);
  const row = db.prepare(`SELECT * FROM admin_change_log WHERE id = ?`).get(id);
  res.json({ ...row, reverted: !!row.reverted, before: row.before ? JSON.parse(row.before) : null, after: row.after ? JSON.parse(row.after) : null });
});

router.get("/stats", requireAdminAuth, (req, res) => {
  const totalMechanics = db.prepare(`SELECT COUNT(*) n FROM mechanics`).get().n;
  const totalOwners = db.prepare(`SELECT COUNT(*) n FROM owners`).get().n;
  const totalAppointments = db.prepare(`SELECT COUNT(*) n FROM appointments`).get().n;
  const activeCarListings = db.prepare(`SELECT COUNT(*) n FROM listings WHERE status = 'active'`).get().n;
  const openTickets = db.prepare(`SELECT COUNT(*) n FROM support_tickets WHERE status != 'resolved'`).get().n;
  const avgRating = db.prepare(`SELECT AVG(rating) n FROM mechanics`).get().n;
  const totalReviews = db.prepare(`SELECT SUM(reviews) n FROM mechanics`).get().n;
  res.json({
    totalMechanics, totalOwners, totalAppointments, activeCarListings, openTickets,
    avgRating: avgRating ? Math.round(avgRating * 10) / 10 : 0,
    totalReviews: totalReviews || 0,
  });
});

export default router;
