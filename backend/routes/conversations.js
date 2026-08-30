import { Router } from "express";
import { db } from "../db/db.js";
import { hydrate, hydrateAll, dehydrate } from "../db/hydrate.js";

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
// ekliyor. Not: backend'de hâlâ gerçek bir oturum/kimlik doğrulama katmanı yok (bkz.
// REFACTOR_REPORT.md) — bu yüzden "bu isteği gerçekten bu sohbetin bir tarafı mı gönderdi" sorusu
// burada da cevaplanamıyor; amaç sadece verinin ŞEKLİNİN her zaman geçerli kalmasını garanti etmek.
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

const IMMUTABLE_CONVERSATION_FIELDS = ["mechanicId"];

export const conversationsRouter = Router();

conversationsRouter.get("/", (req, res) => {
  const rows = db.prepare(`SELECT * FROM conversations`).all();
  res.json(hydrateAll("conversations", rows));
});

conversationsRouter.get("/:id", (req, res) => {
  const row = db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: "conversations not found" });
  res.json(hydrate("conversations", row));
});

conversationsRouter.post("/", (req, res) => {
  const body = dehydrate("conversations", req.body);
  if (!body.mechanicId) return res.status(400).json({ error: "mechanicId zorunludur." });
  if ("messages" in req.body) {
    const err = validateMessages(req.body.messages);
    if (err) return res.status(400).json({ error: err });
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
  if ("messages" in req.body) {
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

conversationsRouter.delete("/:id", (req, res) => {
  const info = db.prepare(`DELETE FROM conversations WHERE id = ?`).run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "conversations not found" });
  res.status(204).end();
});
