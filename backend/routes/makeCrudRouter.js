import { Router } from "express";
import { db } from "../db/db.js";
import { hydrate, hydrateAll, dehydrate } from "../db/hydrate.js";

// Generic REST CRUD router factory: GET /, GET /:id, POST /, PATCH /:id, DELETE /:id.
// Every Fixperto entity table (mechanics, listings, appointments, ...) follows the
// same simple id-keyed shape, so one factory covers all of them instead of hand
// writing near-identical Express handlers six times over.
export function makeCrudRouter(table, { idColumn = "id", shareCountColumn = null } = {}) {
  const router = Router();

  router.get("/", (req, res) => {
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    res.json(hydrateAll(table, rows));
  });

  router.get("/:id", (req, res) => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: `${table} not found` });
    res.json(hydrate(table, row));
  });

  router.post("/", (req, res) => {
    const body = dehydrate(table, req.body);
    const cols = Object.keys(body);
    const stmt = db.prepare(`INSERT INTO ${table} (${cols.join(",")}) VALUES (${cols.map((c) => `@${c}`).join(",")})`);
    const info = stmt.run(body);
    const created = db.prepare(`SELECT * FROM ${table} WHERE rowid = ?`).get(info.lastInsertRowid);
    res.status(201).json(hydrate(table, created));
  });

  router.patch("/:id", (req, res) => {
    const existing = db.prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: `${table} not found` });
    const body = dehydrate(table, req.body);
    const cols = Object.keys(body).filter((c) => c !== idColumn);
    if (cols.length === 0) return res.json(hydrate(table, existing));
    const stmt = db.prepare(`UPDATE ${table} SET ${cols.map((c) => `${c} = @${c}`).join(",")} WHERE ${idColumn} = @__id`);
    stmt.run({ ...body, __id: req.params.id });
    const updated = db.prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`).get(req.params.id);
    res.json(hydrate(table, updated));
  });

  router.delete("/:id", (req, res) => {
    const info = db.prepare(`DELETE FROM ${table} WHERE ${idColumn} = ?`).run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: `${table} not found` });
    res.status(204).end();
  });

  // Paylaşım sayacı: ShareButton'a tıklanıp gerçek bir paylaşım eylemi (platforma gitme, link
  // kopyalama, native paylaşım) gerçekleştiğinde atomik olarak +1 yapar — read-then-write PATCH'e
  // göre eşzamanlı paylaşımlarda veri kaybını önler. Sadece bu sütunu opt-in eden kaynaklarda
  // (mechanics/listings/job_listings) etkin.
  if (shareCountColumn) {
    router.post("/:id/share", (req, res) => {
      const existing = db.prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`).get(req.params.id);
      if (!existing) return res.status(404).json({ error: `${table} not found` });
      db.prepare(`UPDATE ${table} SET ${shareCountColumn} = COALESCE(${shareCountColumn}, 0) + 1 WHERE ${idColumn} = ?`).run(req.params.id);
      const updated = db.prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`).get(req.params.id);
      res.json(hydrate(table, updated));
    });
  }

  return router;
}
