import { Router } from "express";
import { db } from "../db/db.js";
import { hydrate, hydrateAll, dehydrate } from "../db/hydrate.js";
import { resolveActor } from "../utils/auth.js";

// GÜVENLİK DÜZELTMESİ (sohbet akışı denetiminde bulundu): conversations daha önce generic
// makeCrudRouter kullanıyordu — bu, `messages` alanının PATCH ile TAMAMEN SERBEST bir JSON dizisi
// olarak yazılabildiği anlamına geliyordu: hiçbir doğrulama yoktu. Somut riskler:
// (1) Mesaj sahteciliği — `sender` alanı "owner"/"mechanic" dışında herhangi bir değer olabilirdi
//     ve içerik/boyut hiç sınırlanmadığı için karşı tarafın hiç söylemediği sözler bir sohbete
//     enjekte edilebilirdi (backend'de gerçek bir oturum olmadığı için "bu mesajı gerçekten kim
//     yazdı" zaten bilinmiyor, ama en azından mesaj ŞEKLİNİN geçerli olması burada garanti ediliyor).
// (2) `mechanicId` de genel PATCH'in bir parçası olduğu için bir sohbeti başka bir tamirciye ait
//     gösterecek şekilde yeniden atamak mümkündü (bkz. quotes.js'teki aynı sınıf düzeltme).
// (3) Boyut sınırı yoktu (5mb'lık genel body limitine kadar) — tek bir PATCH ile devasa bir
//     `messages` dizisi veya çok büyük bir `image` data URI'si yazılabilirdi.
// Bu router, generic CRUD'un GET/DELETE davranışını aynen korurken POST/PATCH'e bu doğrulamaları
// ekliyor. GÜNCELLEME (gerçek oturum sistemi): artık backend/utils/auth.js üzerinden gerçek bir
// oturum katmanı var — aşağıdaki her uç nokta artık "bu isteği gerçekten bu sohbetin bir tarafı mı
// gönderdi" sorusunu da (mecanicId eşleşen tamirci ya da giriş yapmış owner/admin) cevaplıyor,
// veri şeklinin geçerliliğinin yanı sıra.
const MAX_MESSAGE_TEXT_LEN = 4000;
const MAX_MESSAGE_IMAGE_LEN = 6_000_000; // ~4.5MB ikili veri karşılığı base64 (5mb body limitinin altında)
const MAX_MESSAGES_PER_CONVERSATION = 2000;
const VALID_SENDERS = new Set(["owner", "mechanic"]);

function validateMessages(messages) {
  if (!Array.isArray(messages)) return "messages bir dizi olmalıdır.";
  if (messages.length > MAX_MESSAGES_PER_CONVERSATION) return `Bir sohbette en fazla ${MAX_MESSAGES_PER_CONVERSATION} mesaj olabilir.`;
  for (const m of messages) {
    if (!m || typeof m !== "object") return "Geçersiz mesaj formatı.";
    if (!VALID_SENDERS.has(m.sender)) return "Mesaj göndereni 'owner' veya 'mechanic' olmalıdır.";
    if (m.text !== undefined && m.text !== null && typeof m.text !== "string") return "Mesaj metni bir metin (string) olmalıdır.";
    if (typeof m.text === "string" && m.text.length > MAX_MESSAGE_TEXT_LEN) return `Mesaj metni en fazla ${MAX_MESSAGE_TEXT_LEN} karakter olabilir.`;
    if (m.image !== undefined && m.image !== null) {
      if (typeof m.image !== "string") return "Mesaj görseli bir metin (data URI) olmalıdır.";
      if (m.image.length > MAX_MESSAGE_IMAGE_LEN) return "Mesaj görseli çok büyük.";
    }
    if (!m.text && !m.image) return "Bir mesajın metni veya görseli olmalıdır.";
  }
  return null;
}

const IMMUTABLE_CONVERSATION_FIELDS = ["mechanicId", "ownerId"];

// GÜVENLİK DÜZELTMESİ (tam site denetiminde bulundu): burada eskiden "giriş yapmış HERHANGİ bir
// owner tüm sohbetleri görebilir" kuralı vardı — çünkü conversations tablosunda araç sahibi tarafını
// gösteren bir sütun yoktu ve uygulama tek bir "aktif" araç sahibi varsayımıyla tasarlanmıştı. Gerçek
// kayıt/giriş sistemi eklendikten sonra bu varsayım geçersiz: siteye kaydolan HERKES owner olabildiği
// için, kaydolan herhangi biri diğer tüm araç sahiplerinin tamircilerle yaptığı özel yazışmaları
// okuyabiliyor, hatta değiştirip silebiliyordu. Artık conversations.ownerId sütunu var (bkz.
// backend/db/db.js ensureColumn + backfill) ve sohbet yalnızca İKİ GERÇEK TARAFINA (o araç sahibi ve
// o tamirci) ve admin'e görünüyor.
function convoVisibleTo(row, actor) {
  if (!actor) return false;
  if (actor.role === "admin") return true;
  if (actor.role === "owner") return row.ownerId === actor.id;
  if (actor.role === "mechanic") return row.mechanicId === actor.id;
  return false;
}

export const conversationsRouter = Router();

conversationsRouter.get("/", (req, res) => {
  const actor = resolveActor(req);
  if (!actor) return res.status(401).json({ error: "Bu veriye erişmek için giriş yapmanız gerekiyor." });
  const rows = db.prepare(`SELECT * FROM conversations`).all().filter((r) => convoVisibleTo(r, actor));
  res.json(hydrateAll("conversations", rows));
});

conversationsRouter.get("/:id", (req, res) => {
  const row = db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: "conversations not found" });
  const actor = resolveActor(req);
  if (!convoVisibleTo(row, actor)) {
    return res.status(actor ? 403 : 401).json(actor ? { error: "Bu kayda erişim yetkiniz yok." } : { error: "Bu veriye erişmek için giriş yapmanız gerekiyor." });
  }
  res.json(hydrate("conversations", row));
});

conversationsRouter.post("/", (req, res) => {
  const actor = resolveActor(req);
  if (!actor) return res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." });
  const body = dehydrate("conversations", req.body);
  if (!body.mechanicId) return res.status(400).json({ error: "mechanicId zorunludur." });
  // Sohbetin iki tarafı da İSTEMCİDEN DEĞİL oturumdan yazılıyor: bir tamirci sadece kendi
  // mechanicId'siyle sohbet açabilir, bir araç sahibi de sohbeti ancak kendi adına açabilir
  // (başkasının adına sohbet oluşturup sonra o kişinin yazışmasıymış gibi gösteremez).
  if (actor.role === "mechanic") {
    body.mechanicId = actor.id;
    // Tamirci bir araç sahibiyle sohbet başlatıyorsa (ör. bir "sahibinden" ilanı hakkında) karşı
    // tarafın kimliğini gövdede belirtir — ama bu değer doğrulanır: gerçekten var olan bir owner
    // kaydı olmalı, aksi halde sohbet sahipsiz kalır ve hiçbir araç sahibine görünmez.
    if (body.ownerId != null) {
      const target = db.prepare(`SELECT id FROM owners WHERE id = ?`).get(body.ownerId);
      if (!target) return res.status(400).json({ error: "Geçersiz ownerId." });
    }
  }
  if (actor.role === "owner") body.ownerId = actor.id;
  if ("messages" in req.body) {
    const err = validateMessages(req.body.messages);
    if (err) return res.status(400).json({ error: err });
    // Sohbet AÇILIRKEN de gönderen damgalanıyor: aksi halde ilk mesajı karşı tarafın ağzından
    // yazmak, POST /:id/messages'taki kontrolü baştan atlatmanın kolay yolu olurdu.
    if (actor.role === "owner" || actor.role === "mechanic") {
      const langRow = actor.role === "owner"
        ? db.prepare(`SELECT lang FROM owners WHERE id = ?`).get(actor.id)
        : db.prepare(`SELECT lang FROM mechanics WHERE id = ?`).get(actor.id);
      const stampedInitial = (req.body.messages || []).map((m, i) => ({
        ...m, id: i + 1, sender: actor.role, lang: langRow?.lang || "tr",
      }));
      body.messages = JSON.stringify(stampedInitial);
    }
  }
  const cols = Object.keys(body);
  const stmt = db.prepare(`INSERT INTO conversations (${cols.join(",")}) VALUES (${cols.map((c) => `@${c}`).join(",")})`);
  const info = stmt.run(body);
  const created = db.prepare(`SELECT * FROM conversations WHERE rowid = ?`).get(info.lastInsertRowid);
  res.status(201).json(hydrate("conversations", created));
});

conversationsRouter.patch("/:id", (req, res) => {
  const existing = db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: "conversations not found" });
  const actor = resolveActor(req);
  if (!convoVisibleTo(existing, actor)) {
    return res.status(actor ? 403 : 401).json(actor ? { error: "Bu sohbeti değiştirme yetkiniz yok." } : { error: "Bu işlem için giriş yapmanız gerekiyor." });
  }
  // GÜVENLİK AÇIĞI (bu denetimde bulundu — MESAJ SAHTECİLİĞİ ve KAYIP GÜNCELLEME):
  // PATCH, `messages` dizisinin TAMAMINI istemciden alıyordu. İki somut sonucu vardı:
  //   1) Sohbetin bir tarafı, KARŞI TARAFIN AĞZINDAN mesaj yazabiliyordu — dizideki her elemanın
  //      `sender` alanı serbestti. Bir araç sahibi "tamirci: tamiri ücretsiz yapacağım" diye bir
  //      satır ekleyip ekran görüntüsünü destek talebine delil olarak koyabilirdi.
  //   2) Dizi topluca ezildiği için, karşı taraf sen yazarken bir mesaj göndermişse onun mesajı
  //      SESSİZCE SİLİNİYORDU (son yazan kazanır).
  // Mesaj ekleme artık ayrı bir uç noktada (POST /:id/messages): gönderen kimliği oturumdan
  // damgalanıyor ve ekleme sunucuda mevcut dizinin SONUNA yapılıyor. Bu PATCH ise artık yalnızca
  // admin'in mesaj dizisine dokunmasına izin veriyor (moderasyon/silme).
  if ("messages" in req.body) {
    if (actor.role !== "admin") {
      return res.status(403).json({ error: "Mesajlar yalnızca mesaj gönderme uç noktasıyla eklenebilir." });
    }
    const err = validateMessages(req.body.messages);
    if (err) return res.status(400).json({ error: err });
  }
  const body = dehydrate("conversations", req.body);
  for (const f of IMMUTABLE_CONVERSATION_FIELDS) delete body[f];
  const cols = Object.keys(body).filter((c) => c !== "id");
  if (cols.length === 0) return res.json(hydrate("conversations", existing));
  const stmt = db.prepare(`UPDATE conversations SET ${cols.map((c) => `${c} = @${c}`).join(",")} WHERE id = @__id`);
  stmt.run({ ...body, __id: req.params.id });
  const updated = db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(req.params.id);
  res.json(hydrate("conversations", updated));
});

/**
 * MESAJ GÖNDERME — tek doğru yol.
 * ---------------------------------------------------------------------------------------------
 * Gövde: { messages: [{ text?, image?, isRejectionNotice? }], clearContextNote?: boolean }
 * En fazla 3 mesaj (ör. bağlam notu + asıl mesaj). Her mesajın `sender` ve `lang` alanı
 * İSTEMCİDEN DEĞİL oturumdan damgalanır — kimse karşı tarafın ağzından yazamaz. Ekleme sunucuda
 * okunan GÜNCEL diziye yapılır, böylece karşı tarafın bu sırada gönderdiği mesaj kaybolmaz.
 * Yanıt, sohbetin sunucudaki son hâlidir; istemci kendi yerel kopyasını buna göre tazeler.
 */
const MAX_APPEND_PER_CALL = 3;

conversationsRouter.post("/:id/messages", (req, res) => {
  const row = db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: "conversations not found" });
  const actor = resolveActor(req);
  if (!convoVisibleTo(row, actor)) {
    return res.status(actor ? 403 : 401).json(actor ? { error: "Bu sohbete mesaj gönderme yetkiniz yok." } : { error: "Bu işlem için giriş yapmanız gerekiyor." });
  }
  // Admin sohbetin bir TARAFI değildir; onun adına mesaj yazmak "sender" alanını anlamsız kılardı.
  if (actor.role !== "owner" && actor.role !== "mechanic") {
    return res.status(403).json({ error: "Bu sohbete yalnızca tarafları mesaj gönderebilir." });
  }
  const incoming = Array.isArray(req.body?.messages) ? req.body.messages : [req.body?.message].filter(Boolean);
  if (incoming.length === 0) return res.status(400).json({ error: "Gönderilecek mesaj yok." });
  if (incoming.length > MAX_APPEND_PER_CALL) return res.status(400).json({ error: "Tek seferde en fazla 3 mesaj gönderilebilir." });

  const langRow = actor.role === "owner"
    ? db.prepare(`SELECT lang FROM owners WHERE id = ?`).get(actor.id)
    : db.prepare(`SELECT lang FROM mechanics WHERE id = ?`).get(actor.id);
  const senderLang = langRow?.lang || "tr";

  const existing = JSON.parse(row.messages || "[]");
  // Mesaj kimliği sunucuda üretiliyor: iki taraf aynı anda yazdığında istemcilerin ürettiği
  // sayaçlar çakışabiliyordu (aynı id = React listesinde aynı key = yanlış eşleşen baloncuk).
  const baseId = existing.reduce((max, m) => Math.max(max, Number(m?.id) || 0), 0);

  const stamped = incoming.map((m, i) => ({
    id: baseId + i + 1,
    sender: actor.role,          // <- oturumdan, istemciden DEĞİL
    lang: senderLang,            // <- gönderenin kayıtlı dili; çeviri bunu kullanıyor
    text: typeof m?.text === "string" ? m.text : undefined,
    image: typeof m?.image === "string" ? m.image : undefined,
    ...(m?.isRejectionNotice ? { isRejectionNotice: true } : {}),
  }));
  const merged = [...existing, ...stamped];
  const err = validateMessages(merged);
  if (err) return res.status(400).json({ error: err });

  const patch = req.body?.clearContextNote
    ? db.prepare(`UPDATE conversations SET messages = ?, pendingContextNote = NULL WHERE id = ?`)
    : db.prepare(`UPDATE conversations SET messages = ? WHERE id = ?`);
  patch.run(JSON.stringify(merged), req.params.id);
  const updated = db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(req.params.id);
  res.json(hydrate("conversations", updated));
});

conversationsRouter.delete("/:id", (req, res) => {
  const existing = db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: "conversations not found" });
  const actor = resolveActor(req);
  if (!convoVisibleTo(existing, actor)) {
    return res.status(actor ? 403 : 401).json(actor ? { error: "Bu sohbeti silme yetkiniz yok." } : { error: "Bu işlem için giriş yapmanız gerekiyor." });
  }
  const info = db.prepare(`DELETE FROM conversations WHERE id = ?`).run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "conversations not found" });
  res.status(204).end();
});
