import { Router } from "express";
import { db } from "../db/db.js";
import { extractBearerToken, isAdminToken } from "../utils/auth.js";

// admin.js'teki requireAdminAuth ile aynı kontrol — oradaki fonksiyon o dosyaya özel (export
// edilmemiş), bu yüzden paylaşılan iki yardımcıdan aynısını kuruyoruz.
function requireAdmin(req, res, next) {
  if (!isAdminToken(extractBearerToken(req))) {
    return res.status(401).json({ error: "Bu işlem için admin girişi gerekiyor." });
  }
  next();
}

const router = Router();

// slug: başlıktan üretilen, insan-okur ve URL-güvenli kalıcı adres parçası.
// Türkçe karakterler ASCII karşılığına çevriliyor — aksi halde "fren-balatası" gibi bir slug
// tarayıcıda yüzde-kodlanıp ("balatas%C4%B1") hem çirkin hem paylaşması zor bir bağlantı olurdu.
const TR_MAP = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", Ç: "c", Ğ: "g", İ: "i", I: "i", Ö: "o", Ş: "s", Ü: "u" };
export function slugify(title) {
  return String(title || "")
    .split("").map((ch) => TR_MAP[ch] ?? ch).join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "yazi";
}

// Aynı slug varsa sonuna -2, -3 ... ekleyerek benzersizleştir (UNIQUE kısıtı hata fırlatmasın).
function uniqueSlug(base, ignoreId = null) {
  let slug = base, n = 1;
  for (;;) {
    const row = db.prepare("SELECT id FROM blog_posts WHERE slug = ?").get(slug);
    if (!row || row.id === ignoreId) return slug;
    slug = `${base}-${++n}`;
  }
}

const parseTags = (row) => ({ ...row, tags: (() => { try { return JSON.parse(row.tags ?? "[]") ?? []; } catch { return []; } })() });

// ---- HERKESE AÇIK: yalnızca YAYINLANMIŞ yazılar -------------------------------------------------
// Taslaklar hiçbir koşulda buradan dönmüyor; yönetici listesi ayrı uçta (/admin/all).
router.get("/", (req, res) => {
  const rows = db.prepare(
    `SELECT id, slug, title, excerpt, coverPhoto, tags, author, lang, publishedAt, views, relatedServiceKey
       FROM blog_posts WHERE status = 'published' ORDER BY publishedAt DESC, id DESC`
  ).all();
  res.json(rows.map(parseTags));
});

router.get("/admin/all", requireAdmin, (req, res) => {
  res.json(db.prepare("SELECT * FROM blog_posts ORDER BY COALESCE(publishedAt, createdAt) DESC, id DESC").all().map(parseTags));
});

router.get("/:slug", (req, res) => {
  const row = db.prepare("SELECT * FROM blog_posts WHERE slug = ? AND status = 'published'").get(req.params.slug);
  if (!row) return res.status(404).json({ error: "Yazı bulunamadı." });
  // Görüntülenme sayacı: okuma isteğini yavaşlatmaması için yanıttan sonra değil, ucuz tek
  // UPDATE ile burada artırılıyor. Hata olursa okuma yine de başarılı sayılıyor.
  try { db.prepare("UPDATE blog_posts SET views = COALESCE(views, 0) + 1 WHERE id = ?").run(row.id); } catch { /* sayaç kritik değil */ }
  res.json(parseTags(row));
});

// ---- YÖNETİCİ: yazma ---------------------------------------------------------------------------
const writable = ["title", "excerpt", "body", "coverPhoto", "author", "lang", "status", "relatedServiceKey"];

router.post("/", requireAdmin, (req, res) => {
  const title = String(req.body?.title || "").trim();
  if (!title) return res.status(400).json({ error: "Başlık zorunlu." });
  const now = new Date().toISOString();
  const status = req.body?.status === "published" ? "published" : "draft";
  const info = db.prepare(
    `INSERT INTO blog_posts (slug, title, excerpt, body, coverPhoto, tags, author, lang, status, publishedAt, views, relatedServiceKey, createdAt)
     VALUES (@slug, @title, @excerpt, @body, @coverPhoto, @tags, @author, @lang, @status, @publishedAt, 0, @relatedServiceKey, @createdAt)`
  ).run({
    slug: uniqueSlug(slugify(req.body?.slug || title)),
    title,
    excerpt: String(req.body?.excerpt || ""),
    body: String(req.body?.body || ""),
    coverPhoto: req.body?.coverPhoto || null,
    tags: JSON.stringify(Array.isArray(req.body?.tags) ? req.body.tags : []),
    author: String(req.body?.author || "Fixperto"),
    lang: String(req.body?.lang || "tr"),
    relatedServiceKey: req.body?.relatedServiceKey || null,
    status,
    publishedAt: status === "published" ? now : null,
    createdAt: now,
  });
  res.status(201).json(parseTags(db.prepare("SELECT * FROM blog_posts WHERE id = ?").get(info.lastInsertRowid)));
});

router.patch("/:id", requireAdmin, (req, res) => {
  const existing = db.prepare("SELECT * FROM blog_posts WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Yazı bulunamadı." });

  const patch = {};
  for (const f of writable) if (f in (req.body || {})) patch[f] = req.body[f];
  if ("tags" in (req.body || {})) patch.tags = JSON.stringify(Array.isArray(req.body.tags) ? req.body.tags : []);
  // Başlık değişse bile slug KENDİLİĞİNDEN değişmiyor: yayınlanmış bir yazının adresi değişirse
  // paylaşılmış her bağlantı kırılır ve arama motorundaki sıralaması sıfırlanır. Slug ancak
  // açıkça gönderilirse güncelleniyor.
  if (req.body?.slug) patch.slug = uniqueSlug(slugify(req.body.slug), existing.id);
  // Taslaktan yayına ilk geçişte yayın tarihi damgalanıyor; sonraki düzenlemeler tarihi bozmuyor.
  if (patch.status === "published" && !existing.publishedAt) patch.publishedAt = new Date().toISOString();
  if (patch.status === "draft") patch.publishedAt = null;

  const keys = Object.keys(patch);
  if (keys.length === 0) return res.json(parseTags(existing));
  db.prepare(`UPDATE blog_posts SET ${keys.map((k) => `${k} = @${k}`).join(", ")} WHERE id = @id`).run({ ...patch, id: existing.id });
  res.json(parseTags(db.prepare("SELECT * FROM blog_posts WHERE id = ?").get(existing.id)));
});

router.delete("/:id", requireAdmin, (req, res) => {
  db.prepare("DELETE FROM blog_posts WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

export default router;
