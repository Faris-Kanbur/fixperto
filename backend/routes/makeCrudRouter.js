import { Router } from "express";
import { db } from "../db/db.js";
import { hydrate, hydrateAll, dehydrate } from "../db/hydrate.js";

// Generic REST CRUD router factory: GET /, GET /:id, POST /, PATCH /:id, DELETE /:id.
// Every Fixperto entity table (mechanics, listings, appointments, ...) follows the
// same simple id-keyed shape, so one factory covers all of them instead of hand
// writing near-identical Express handlers six times over.
export function makeCrudRouter(table, { idColumn = "id", shareCountColumn = null, passwordVerify = false } = {}) {
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
    // GÜVENLİK: password bu genel (mass-assignment'a açık) yazma yolundan asla kabul edilmiyor —
    // yalnızca aşağıdaki özel /:id/set-password uç noktasından değiştirilebilir (bkz. o uç
    // noktanın yorumu). passwordVerify açık olmayan tablolarda (yani şifre sütunu olmayanlarda)
    // bu satırın hiçbir etkisi yok.
    if (passwordVerify) delete body.password;
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
    if (passwordVerify) delete body.password;
    const cols = Object.keys(body).filter((c) => c !== idColumn);
    if (cols.length === 0) return res.json(hydrate(table, existing));
    const stmt = db.prepare(`UPDATE ${table} SET ${cols.map((c) => `${c} = @${c}`).join(",")} WHERE ${idColumn} = @__id`);
    stmt.run({ ...body, __id: req.params.id });
    const updated = db.prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`).get(req.params.id);
    res.json(hydrate(table, updated));
  });

  // GÜVENLİK DÜZELTMESİ: şifre artık genel POST/PATCH üzerinden (yukarıda engellendi) değil,
  // sadece bu iki özel uç noktadan değişebiliyor. `verify-password` mevcut şifreyi doğrulamak
  // için var (kullanıcının kendi "şifre değiştir" formu) — şifrenin kendisini asla döndürmez,
  // sadece eşleşip eşleşmediğini (true/false) söyler. `set-password` gerçek yazma işlemini yapar;
  // bunu hem kendi şifresini değiştiren kullanıcı (önce verify-password ile doğrulandıktan sonra)
  // hem de admin paneli (kullanıcı adına sıfırlama, doğrulama gerektirmeden) çağırıyor — backend'de
  // gerçek bir oturum katmanı olmadığı için "bu isteği admin mi yoksa kullanıcının kendisi mi
  // gönderdi" ayrımı burada yapılamıyor (bkz. REFACTOR_REPORT.md bölüm 9 madde 2); bu akışın hangi
  // sırayla çağrılacağına (önce doğrula, sonra yaz) frontend karar veriyor — mevcut mimarideki
  // rol/yetki modeliyle aynı, sadece şifrenin ağ üzerinden düz metin olarak GERİ dönmesini
  // engelliyor.
  if (passwordVerify) {
    router.post("/:id/verify-password", (req, res) => {
      const { password } = req.body || {};
      const row = db.prepare(`SELECT password FROM ${table} WHERE ${idColumn} = ?`).get(req.params.id);
      if (!row) return res.status(404).json({ error: `${table} not found` });
      const stored = row.password ?? "demo1234";
      res.json({ valid: typeof password === "string" && password.length > 0 && password === stored });
    });

    router.post("/:id/set-password", (req, res) => {
      const { password } = req.body || {};
      if (typeof password !== "string" || password.length < 6) {
        return res.status(400).json({ error: "Şifre en az 6 karakter olmalı." });
      }
      const existing = db.prepare(`SELECT ${idColumn} FROM ${table} WHERE ${idColumn} = ?`).get(req.params.id);
      if (!existing) return res.status(404).json({ error: `${table} not found` });
      db.prepare(`UPDATE ${table} SET password = ? WHERE ${idColumn} = ?`).run(password, req.params.id);
      res.json({ ok: true });
    });
  }

  router.delete("/:id", (req, res) => {
    const info = db.prepare(`DELETE FROM ${table} WHERE ${idColumn} = ?`).run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: `${table} not found` });
    res.status(204).end();
  });

  // Paylaşım sayacı: ShareButton'a tıklanıp gerçek bir paylaşım eylemi (platforma gitme, link
  // kopyalama, native paylaşım) gerçekleştiğinde atomik olarak +1 yapar — read-then-write PATCH'e
  // göre eşzamanlı paylaşımlarda veri kaybını önler. Sadece bu sütunu opt-in eden kaynaklarda
  // (mechanics/listings/job_listings) etkin.
  //
  // GÜVENLİK DÜZELTMESİ (regresyon denetiminde bulundu): bu uç nokta, kimliği bilinen HERHANGİ bir
  // kaydı HERHANGİ bir ziyaretçi (giriş yapmamış biri dahil) tetikleyebiliyor — yani "kendi profilim"
  // değil, herkese açık bir eylem. Önceden hydrate() (tekil kayıt versiyonu) kullanıyordu, bu da
  // mechanics için iban/bankName/accountHolder'ı yanıta geri koyuyordu — toplu listeden kapattığımız
  // sızıntının aynısını bu uç nokta üzerinden tek tek (ID bilerek) yeniden açıyordu. hydrateAll ile
  // aynı alan temizliğini burada da uyguluyoruz (tek elemanlı liste olarak).
  if (shareCountColumn) {
    router.post("/:id/share", (req, res) => {
      const existing = db.prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`).get(req.params.id);
      if (!existing) return res.status(404).json({ error: `${table} not found` });
      db.prepare(`UPDATE ${table} SET ${shareCountColumn} = COALESCE(${shareCountColumn}, 0) + 1 WHERE ${idColumn} = ?`).run(req.params.id);
      const updated = db.prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`).get(req.params.id);
      res.json(hydrateAll(table, [updated])[0]);
    });
  }

  return router;
}
