import { Router } from "express";
import { db } from "../db/db.js";

// Same demo admin credentials the single-file app used to hardcode client-side.
// In a real deployment these belong in env vars / a hashed-password users table,
// not in source — kept simple here to match the existing demo's scope.
const ADMIN_CREDENTIALS = {
  email: process.env.FIXPERTO_ADMIN_EMAIL || "admin@fixperto.com",
  password: process.env.FIXPERTO_ADMIN_PASSWORD || "Fixperto2026!",
};

const router = Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
    return res.json({ ok: true });
  }
  res.status(401).json({ ok: false, error: "Geçersiz e-posta veya şifre." });
});

router.get("/change-log", (req, res) => {
  const rows = db.prepare(`SELECT * FROM admin_change_log ORDER BY id DESC LIMIT 200`).all();
  res.json(rows.map((r) => ({ ...r, before: r.before ? JSON.parse(r.before) : null, after: r.after ? JSON.parse(r.after) : null })));
});

router.post("/change-log", (req, res) => {
  const { actor = "admin", action, entityType, entityId, before, after } = req.body || {};
  const stmt = db.prepare(`INSERT INTO admin_change_log (actor, action, entityType, entityId, before, after) VALUES (@actor,@action,@entityType,@entityId,@before,@after)`);
  const info = stmt.run({ actor, action, entityType, entityId: String(entityId ?? ""), before: before ? JSON.stringify(before) : null, after: after ? JSON.stringify(after) : null });
  res.status(201).json({ id: info.lastInsertRowid });
});

router.get("/stats", (req, res) => {
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
