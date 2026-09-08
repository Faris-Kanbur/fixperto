import { Router } from "express";
import { db } from "../db/db.js";
import { extractBearerToken, isAdminToken } from "../utils/auth.js";

/**
 * FIXPERTO'NUN KENDİ İŞ İLANLARI (Kariyer).
 * ---------------------------------------------------------------------------------------------
 * Tamircilerin açtığı iş ilanlarından (jobs tablosu) AYRI bir kavram: bunlar Fixperto ekibine
 * alım ilanları. Aynı tabloda tutmak, "kim işveren" sorusunu her sorguda ayırmayı gerektirirdi ve
 * tamirci ilanları listesine şirket ilanlarının karışma riskini taşırdı.
 *
 * Yetki: okuma herkese açık ama YALNIZCA yayınlanmış ilanlar; yazma yalnızca yönetici token'ıyla
 * (blog.js ile aynı desen).
 */
function requireAdmin(req, res, next) {
  if (!isAdminToken(extractBearerToken(req))) {
    return res.status(401).json({ error: "Bu işlem için admin girişi gerekiyor." });
  }
  next();
}

const router = Router();

// ---- HERKESE AÇIK ------------------------------------------------------------------------------
router.get("/", (req, res) => {
  const rows = db.prepare(
    `SELECT id, title, department, location, employmentType, summary, description, applyEmail, createdAt
       FROM career_posts WHERE status = 'published' ORDER BY createdAt DESC, id DESC`
  ).all();
  res.json(rows);
});

// ---- YÖNETİCİ ----------------------------------------------------------------------------------
router.get("/admin/all", requireAdmin, (req, res) => {
  res.json(db.prepare("SELECT * FROM career_posts ORDER BY createdAt DESC, id DESC").all());
});

const writable = ["title", "department", "location", "employmentType", "summary", "description", "applyEmail", "status"];

router.post("/", requireAdmin, (req, res) => {
  const title = String(req.body?.title || "").trim();
  if (!title) return res.status(400).json({ error: "Başlık zorunlu." });
  const now = new Date().toISOString();
  const info = db.prepare(`
    INSERT INTO career_posts (title, department, location, employmentType, summary, description, applyEmail, status, createdAt)
    VALUES (@title, @department, @location, @employmentType, @summary, @description, @applyEmail, @status, @createdAt)
  `).run({
    title,
    department: String(req.body?.department || "").trim(),
    location: String(req.body?.location || "").trim(),
    employmentType: String(req.body?.employmentType || "full_time"),
    summary: String(req.body?.summary || "").trim(),
    description: String(req.body?.description || "").trim(),
    applyEmail: String(req.body?.applyEmail || "kariyer@fixperto.com").trim(),
    // Yeni ilan varsayılan olarak TASLAK: yarım kalmış bir ilan kazayla yayına çıkmasın.
    status: req.body?.status === "published" ? "published" : "draft",
    createdAt: now,
  });
  res.status(201).json(db.prepare("SELECT * FROM career_posts WHERE id = ?").get(info.lastInsertRowid));
});

router.patch("/:id", requireAdmin, (req, res) => {
  const row = db.prepare("SELECT * FROM career_posts WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "İlan bulunamadı." });
  const patch = {};
  for (const f of writable) if (req.body?.[f] !== undefined) patch[f] = String(req.body[f] ?? "");
  if (Object.keys(patch).length === 0) return res.json(row);
  const sets = Object.keys(patch).map((f) => `${f} = @${f}`).join(", ");
  db.prepare(`UPDATE career_posts SET ${sets} WHERE id = @id`).run({ ...patch, id: row.id });
  res.json(db.prepare("SELECT * FROM career_posts WHERE id = ?").get(row.id));
});

router.delete("/:id", requireAdmin, (req, res) => {
  db.prepare("DELETE FROM career_posts WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

export default router;
