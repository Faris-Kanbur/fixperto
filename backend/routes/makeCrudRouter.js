import { Router } from "express";
import { db } from "../db/db.js";
import { hydrate, hydrateAll, dehydrate } from "../db/hydrate.js";
import { hashPassword, verifyPassword as bcryptVerify, resolveActor } from "../utils/auth.js";

// Generic REST CRUD router factory: GET /, GET /:id, POST /, PATCH /:id, DELETE /:id.
// Every Fixperto entity table (mechanics, listings, appointments, ...) follows the
// same simple id-keyed shape, so one factory covers all of them instead of hand
// writing near-identical Express handlers six times over.
//
// GERÇEK OTURUM SİSTEMİ: bu proje şimdiye kadar owner/mechanic için gerçek bir oturum katmanı
// olmadığını defalarca (REFACTOR_REPORT.md, bu oturumdaki güvenlik taramaları) belgeledi — her
// yazma isteği, gövdede kim gönderirse göndersin, olduğu gibi kabul ediliyordu. `authScope` bunu
// kapatıyor: bir kaynağı (ör. vehicles → ownerId alanı, owner rolü) belirli bir sahiplik alanına
// bağlar. Devreye alındığında:
//   - POST: geçerli bir oturum (roller `fields` içinde listelenenlerden biri) zorunlu; sahiplik
//     alanı İSTEMCİDEN DEĞİL, oturumdan (req session id) alınır — client hangi ownerId'yi
//     gönderirse göndersin görmezden gelinir, böylece biri başkası adına kayıt oluşturamaz.
//   - PATCH/DELETE: mevcut satırın sahiplik alanı oturumun kimliğiyle eşleşmiyorsa 403. Admin
//     token'ı her zaman geçer (yönetim paneli tüm kayıtları yönetebilmeli).
//   - GET (liste + tekil): `publicRead: false` ise oturumsuz erişim tamamen kapalı ve liste sonucu
//     sadece çağıranın kendi kayıtlarıyla sınırlanıyor (admin hepsini görür). `publicRead: true`
//     (varsayılan, mechanics/listings/jobs gibi pazar yeri verileri için) GET'leri değiştirmiyor —
//     bunlar zaten girişsiz gezinme için herkese açık kalmalı.
export function makeCrudRouter(table, {
  idColumn = "id",
  shareCountColumn = null,
  passwordVerify = false,
  authScope = null, // { fields: [{ field: "ownerId", role: "owner" }, ...], publicRead?: boolean, sharedWrite?: { fields: [...], roles: [...] } }
} = {}) {
  const router = Router();
  const scopeFields = authScope?.fields || [];
  const publicRead = authScope ? authScope.publicRead !== false : true;
  // GÜVENLİK DÜZELTMESİ (regresyon: "Beğeni kaydedilemedi: Bu işlem için yetkiniz yok."): mechanics
  // tablosundaki reviewList/reviews/rating alanları özel bir durum — bir tamircinin PROFİLİ sadece
  // o tamirci tarafından düzenlenebilmeli (self-only authScope, doğru), AMA yorumlar/beğeniler HER
  // ZAMAN başka kullanıcılar (araç sahipleri) tarafından yazılıyor: bir owner bir tamirciye yorum
  // bırakır, bir yorumu "faydalı" işaretler, ya da kendi yorumunu siler — bunların hepsi o tamircinin
  // SATIRINI günceller ama yazan kişi o tamirci değildir. Blanket self-only authScope eklendiğinde
  // (gerçek oturum sistemi) bu akış yanlışlıkla 403 ile kırıldı: local state iyimser (optimistic)
  // güncellendiği için sayaç ekranda hemen artıyordu ama backend isteği reddediliyor, kalıcı olmuyordu.
  // `sharedWrite` bu üç alan için (ve SADECE bu üç alan için — PATCH gövdesinde başka hiçbir alan
  // yoksa) sahiplik kontrolünü atlayıp sadece "geçerli bir owner/mechanic/admin oturumu var mı"
  // kontrolüne düşürüyor — profildeki diğer TÜM alanlar (iban, fiyat, adres, çalışma saatleri vb.)
  // hâlâ tamamen self-only kalıyor. Bu, önceki (authScope'tan ÖNCEKİ) davranışla aynı güven
  // seviyesinde ama artık en azından girişsiz kimse yazamıyor.
  const sharedWriteFields = new Set(authScope?.sharedWrite?.fields || []);
  const sharedWriteRoles = new Set(authScope?.sharedWrite?.roles || []);

  function matchingField(actor, row) {
    return scopeFields.find((f) => f.role === actor?.role && row[f.field] === actor.id);
  }

  function isSharedWrite(actor, bodyKeys) {
    if (sharedWriteFields.size === 0) return false;
    if (!sharedWriteRoles.has(actor?.role)) return false;
    if (bodyKeys.length === 0) return false;
    return bodyKeys.every((k) => sharedWriteFields.has(k));
  }

  router.get("/", (req, res) => {
    if (!authScope || publicRead) {
      const rows = db.prepare(`SELECT * FROM ${table}`).all();
      return res.json(hydrateAll(table, rows));
    }
    const actor = resolveActor(req);
    if (!actor) return res.status(401).json({ error: "Bu veriye erişmek için giriş yapmanız gerekiyor." });
    if (actor.role === "admin") {
      return res.json(hydrateAll(table, db.prepare(`SELECT * FROM ${table}`).all()));
    }
    const myFields = scopeFields.filter((f) => f.role === actor.role);
    if (myFields.length === 0) return res.json([]);
    const where = myFields.map((f) => `${f.field} = ?`).join(" OR ");
    const rows = db.prepare(`SELECT * FROM ${table} WHERE ${where}`).all(...myFields.map(() => actor.id));
    res.json(hydrateAll(table, rows));
  });

  router.get("/:id", (req, res) => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: `${table} not found` });
    if (authScope && !publicRead) {
      const actor = resolveActor(req);
      if (!actor) return res.status(401).json({ error: "Bu veriye erişmek için giriş yapmanız gerekiyor." });
      if (actor.role !== "admin" && !matchingField(actor, row)) {
        return res.status(403).json({ error: "Bu kayda erişim yetkiniz yok." });
      }
    }
    res.json(hydrate(table, row));
  });

  router.post("/", (req, res) => {
    let actor = null;
    if (authScope) {
      actor = resolveActor(req);
      if (!actor || (actor.role !== "admin" && !scopeFields.some((f) => f.role === actor.role))) {
        return res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." });
      }
    }
    const body = dehydrate(table, req.body);
    // GÜVENLİK: password bu genel (mass-assignment'a açık) yazma yolundan asla kabul edilmiyor —
    // yalnızca aşağıdaki özel /:id/set-password uç noktasından değiştirilebilir (bkz. o uç
    // noktanın yorumu). passwordVerify açık olmayan tablolarda (yani şifre sütunu olmayanlarda)
    // bu satırın hiçbir etkisi yok.
    if (passwordVerify) delete body.password;
    // Sahiplik alanı İSTEMCİDEN DEĞİL oturumdan geliyor — client `ownerId: 9999` gönderse bile
    // (başka bir kullanıcı adına kayıt oluşturmaya çalışsa bile) yok sayılır.
    if (actor && actor.role !== "admin") {
      for (const f of scopeFields) if (f.role === actor.role) body[f.field] = actor.id;
    }
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
    if (authScope) {
      const actor = resolveActor(req);
      if (!actor) return res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." });
      if (actor.role !== "admin" && !matchingField(actor, existing) && !isSharedWrite(actor, Object.keys(body))) {
        return res.status(403).json({ error: "Bu kaydı değiştirme yetkiniz yok." });
      }
    }
    if (passwordVerify) delete body.password;
    if (authScope) for (const f of scopeFields) delete body[f.field]; // sahiplik alanı PATCH ile devredilemez
    const cols = Object.keys(body).filter((c) => c !== idColumn);
    if (cols.length === 0) return res.json(hydrate(table, existing));
    const stmt = db.prepare(`UPDATE ${table} SET ${cols.map((c) => `${c} = @${c}`).join(",")} WHERE ${idColumn} = @__id`);
    stmt.run({ ...body, __id: req.params.id });
    const updated = db.prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`).get(req.params.id);
    res.json(hydrate(table, updated));
  });

  // GÜVENLİK DÜZELTMESİ (gerçek oturum sistemi): şifre artık düz metin karşılaştırma DEĞİL, bcrypt
  // hash karşılaştırmasıyla doğrulanıyor (bkz. backend/utils/auth.js, backend/db/db.js hash
  // migrasyonu). Ayrıca bu iki uç nokta artık TAMAMEN açık değil — ya kaydın kendi sahibinin geçerli
  // oturumu ya da geçerli bir admin token'ı gerekiyor. Önceden (bu oturumun daha önceki bir
  // düzeltmesinde) buraya hiç oturum kontrolü eklenmemişti çünkü henüz gerçek bir oturum sistemi
  // yoktu — artık var, o boşluk burada kapatılıyor.
  if (passwordVerify) {
    function requireSelfOrAdmin(req, res) {
      const actor = resolveActor(req);
      const selfRole = table === "owners" ? "owner" : "mechanic";
      if (!actor) { res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." }); return null; }
      if (actor.role === "admin") return actor;
      if (actor.role === selfRole && String(actor.id) === String(req.params.id)) return actor;
      res.status(403).json({ error: "Bu işlem için yetkiniz yok." });
      return null;
    }

    router.post("/:id/verify-password", async (req, res) => {
      if (!requireSelfOrAdmin(req, res)) return;
      const { password } = req.body || {};
      const row = db.prepare(`SELECT password FROM ${table} WHERE ${idColumn} = ?`).get(req.params.id);
      if (!row) return res.status(404).json({ error: `${table} not found` });
      const valid = typeof password === "string" && password.length > 0 && await bcryptVerify(password, row.password);
      res.json({ valid: !!valid });
    });

    router.post("/:id/set-password", async (req, res) => {
      if (!requireSelfOrAdmin(req, res)) return;
      const { password } = req.body || {};
      if (typeof password !== "string" || password.length < 6) {
        return res.status(400).json({ error: "Şifre en az 6 karakter olmalı." });
      }
      const existing = db.prepare(`SELECT ${idColumn} FROM ${table} WHERE ${idColumn} = ?`).get(req.params.id);
      if (!existing) return res.status(404).json({ error: `${table} not found` });
      const hashed = await hashPassword(password);
      db.prepare(`UPDATE ${table} SET password = ? WHERE ${idColumn} = ?`).run(hashed, req.params.id);
      res.json({ ok: true });
    });
  }

  router.delete("/:id", (req, res) => {
    if (authScope) {
      const existing = db.prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`).get(req.params.id);
      if (!existing) return res.status(404).json({ error: `${table} not found` });
      const actor = resolveActor(req);
      if (!actor) return res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." });
      if (actor.role !== "admin" && !matchingField(actor, existing)) {
        return res.status(403).json({ error: "Bu kaydı silme yetkiniz yok." });
      }
    }
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
