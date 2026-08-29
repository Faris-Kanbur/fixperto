import { Router } from "express";
import { db } from "../db/db.js";
import { hydrate, hydrateAll, dehydrate } from "../db/hydrate.js";

// Çoklu tamirci fiyat teklifi akışı (bkz. frontend/src/app/state/AppLogicProvider.tsx:
// submitQuoteRequest, submitQuoteOffer, acceptQuoteOffer) generic makeCrudRouter yerine bu özel
// router'ı kullanır. Sebep: bu akıştaki üç gerçek hata sadece istemci tarafında düzeltilebilecek
// türden değildi — (1) tamirci seçim limiti (bkz. MAX_QUOTE_MECHANICS) yalnızca istemcide
// uygulanıyordu, doğrudan API'ye istek atan biri sınırsız tamirciye teklif isteği açabilirdi;
// (2) bir teklif kabul edildiğinde "diğer tüm teklifleri lost yap + isteği kapat" işlemi önceden
// istemciden art arda gönderilen ayrı PATCH çağrılarıyla yapılıyordu (yarış durumuna açık, aynı
// isteğe iki teklif neredeyse aynı anda kabul edilirse ikisi de "accepted" kalabilirdi) — burada
// tek bir DB transaction'ında atomik yapılıyor; (3) kapanmış/iptal edilmiş bir isteğe yeni fiyat
// teklifi verilmesi ya da bir teklifin PATCH ile doğrudan "accepted" yapılması artık reddediliyor.
//
// Not: backend'de gerçek bir oturum/kimlik doğrulama katmanı yok (bkz. MY_OWNER_ID/MY_MECHANIC_ID
// sabitleri, REFACTOR_REPORT.md). Bu yüzden "yetkilendirme" burada kim-neyi-yapabilir değil,
// durum makinesinin (open → submitted → accepted/lost/declined, open → cancelled) yalnızca
// geçerli geçişlere izin vermesi ve bunun her zaman sunucuda (istemci atlanarak da) uygulanması
// anlamına geliyor.
const MAX_QUOTE_MECHANICS = 10; // bkz. frontend/src/data/constants.ts PREMIUM_QUOTE_MECH_LIMIT

export const quoteRequestsRouter = Router();
export const quoteOffersRouter = Router();

// --- quote_requests -----------------------------------------------------------------------

quoteRequestsRouter.get("/", (req, res) => {
  const rows = db.prepare(`SELECT * FROM quote_requests`).all();
  res.json(hydrateAll("quote_requests", rows));
});

quoteRequestsRouter.get("/:id", (req, res) => {
  const row = db.prepare(`SELECT * FROM quote_requests WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: "quote_requests not found" });
  res.json(hydrate("quote_requests", row));
});

quoteRequestsRouter.post("/", (req, res) => {
  const body = dehydrate("quote_requests", req.body);
  let mechanicIds;
  try { mechanicIds = JSON.parse(body.mechanicIds ?? "[]"); } catch { mechanicIds = null; }
  if (!Array.isArray(mechanicIds) || mechanicIds.length === 0) {
    return res.status(400).json({ error: "En az bir tamirci seçmelisiniz." });
  }
  if (mechanicIds.length > MAX_QUOTE_MECHANICS) {
    return res.status(400).json({ error: `En fazla ${MAX_QUOTE_MECHANICS} tamirciye teklif isteği gönderebilirsiniz.` });
  }
  if (!body.ownerId) return res.status(400).json({ error: "ownerId zorunludur." });
  // Yeni bir istek her zaman "open" başlar — istemci başka bir şey gönderse bile yok sayılır.
  body.status = "open";
  const cols = Object.keys(body);
  const stmt = db.prepare(`INSERT INTO quote_requests (${cols.join(",")}) VALUES (${cols.map((c) => `@${c}`).join(",")})`);
  const info = stmt.run(body);
  const created = db.prepare(`SELECT * FROM quote_requests WHERE rowid = ?`).get(info.lastInsertRowid);
  res.status(201).json(hydrate("quote_requests", created));
});

// Durum alanı buradan asla değiştirilemez — kapanış/iptal her zaman aşağıdaki /cancel ya da
// ilgili teklifin /accept uç noktasından, ilişkili tüm satırlarla birlikte atomik yapılmalı.
quoteRequestsRouter.patch("/:id", (req, res) => {
  const existing = db.prepare(`SELECT * FROM quote_requests WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: "quote_requests not found" });
  const body = dehydrate("quote_requests", req.body);
  if ("status" in body) {
    return res.status(400).json({ error: "Durum değişikliği için /cancel veya ilgili teklifin /accept uç noktasını kullanın." });
  }
  const cols = Object.keys(body).filter((c) => c !== "id");
  if (cols.length === 0) return res.json(hydrate("quote_requests", existing));
  const stmt = db.prepare(`UPDATE quote_requests SET ${cols.map((c) => `${c} = @${c}`).join(",")} WHERE id = @__id`);
  stmt.run({ ...body, __id: req.params.id });
  const updated = db.prepare(`SELECT * FROM quote_requests WHERE id = ?`).get(req.params.id);
  res.json(hydrate("quote_requests", updated));
});

// Araç sahibi hâlâ açık olan bir isteği tamamen geri çeker — henüz yanıtlanmamış (pending) ve
// fiyat verilmiş (submitted) tüm teklifler tek transaction'da "lost" olur.
quoteRequestsRouter.post("/:id/cancel", (req, res) => {
  const requestId = req.params.id;
  const result = db.transaction(() => {
    const reqRow = db.prepare(`SELECT * FROM quote_requests WHERE id = ?`).get(requestId);
    if (!reqRow) return { error: 404, msg: "quote_requests not found" };
    if (reqRow.status !== "open") return { error: 409, msg: "Bu istek zaten kapalı." };
    db.prepare(`UPDATE quote_requests SET status = 'cancelled' WHERE id = ?`).run(requestId);
    db.prepare(`UPDATE quote_offers SET status = 'lost' WHERE requestId = ? AND status IN ('pending','submitted')`).run(requestId);
    return { ok: true };
  })();
  if (result.error) return res.status(result.error).json({ error: result.msg });
  const updatedReq = hydrate("quote_requests", db.prepare(`SELECT * FROM quote_requests WHERE id = ?`).get(requestId));
  const updatedOffers = hydrateAll("quote_offers", db.prepare(`SELECT * FROM quote_offers WHERE requestId = ?`).all(requestId));
  res.json({ request: updatedReq, offers: updatedOffers });
});

quoteRequestsRouter.delete("/:id", (req, res) => {
  try {
    const info = db.prepare(`DELETE FROM quote_requests WHERE id = ?`).run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: "quote_requests not found" });
    res.status(204).end();
  } catch (err) {
    // FK kısıtlaması (bağlı quote_offers satırları) varsa ham SQLite hatası yerine anlaşılır mesaj.
    res.status(409).json({ error: "Bu istek, bağlı teklifler olduğu için silinemiyor." });
  }
});

// --- quote_offers --------------------------------------------------------------------------

quoteOffersRouter.get("/", (req, res) => {
  const rows = db.prepare(`SELECT * FROM quote_offers`).all();
  res.json(hydrateAll("quote_offers", rows));
});

quoteOffersRouter.get("/:id", (req, res) => {
  const row = db.prepare(`SELECT * FROM quote_offers WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: "quote_offers not found" });
  res.json(hydrate("quote_offers", row));
});

quoteOffersRouter.post("/", (req, res) => {
  const body = dehydrate("quote_offers", req.body);
  const cols = Object.keys(body);
  const stmt = db.prepare(`INSERT INTO quote_offers (${cols.join(",")}) VALUES (${cols.map((c) => `@${c}`).join(",")})`);
  const info = stmt.run(body);
  const created = db.prepare(`SELECT * FROM quote_offers WHERE rowid = ?`).get(info.lastInsertRowid);
  res.status(201).json(hydrate("quote_offers", created));
});

// Genel PATCH artık sadece tamirci fiyat teklifi gönderirken (pending -> submitted, bkz.
// submitQuoteOffer) kullanılabilir. GERÇEK HATA DÜZELTMESİ: önceden bu uç nokta hem kapanmış bir
// isteğe fiyat verilmesine hem de doğrudan status: "accepted" göndererek kabul akışının (ve
// diğer tekliflerin "lost" olarak işaretlenmesinin) tamamen atlanmasına izin veriyordu.
quoteOffersRouter.patch("/:id", (req, res) => {
  const existing = db.prepare(`SELECT * FROM quote_offers WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: "quote_offers not found" });
  const body = dehydrate("quote_offers", req.body);
  if ("status" in body) {
    if (body.status !== "submitted") {
      return res.status(400).json({ error: "Kabul için /accept, reddetmek için /decline uç noktasını kullanın." });
    }
    if (existing.status !== "pending") {
      return res.status(409).json({ error: "Bu teklife zaten yanıt verilmiş." });
    }
    const parentReq = db.prepare(`SELECT status FROM quote_requests WHERE id = ?`).get(existing.requestId);
    if (!parentReq || parentReq.status !== "open") {
      return res.status(409).json({ error: "Bu teklif isteği artık açık değil." });
    }
  }
  const cols = Object.keys(body).filter((c) => c !== "id");
  if (cols.length === 0) return res.json(hydrate("quote_offers", existing));
  const stmt = db.prepare(`UPDATE quote_offers SET ${cols.map((c) => `${c} = @${c}`).join(",")} WHERE id = @__id`);
  stmt.run({ ...body, __id: req.params.id });
  const updated = db.prepare(`SELECT * FROM quote_offers WHERE id = ?`).get(req.params.id);
  res.json(hydrate("quote_offers", updated));
});

// GERÇEK HATA DÜZELTMESİ: bir teklif kabul edildiğinde, önceden yalnızca status'ü "submitted" olan
// kardeş teklifler "lost" yapılıyordu — henüz fiyat vermemiş ("pending") tamirciler kabul sonrası
// da "yanıt bekleniyor" görünmeye devam ediyordu (isteğin zaten kapandığını hiç öğrenemiyorlardı).
// Şimdi pending + submitted TÜMÜ tek transaction'da lost olur, istek de aynı anda kapatılır.
quoteOffersRouter.post("/:id/accept", (req, res) => {
  const offerId = req.params.id;
  const result = db.transaction(() => {
    const offer = db.prepare(`SELECT * FROM quote_offers WHERE id = ?`).get(offerId);
    if (!offer) return { error: 404, msg: "quote_offers not found" };
    const reqRow = db.prepare(`SELECT * FROM quote_requests WHERE id = ?`).get(offer.requestId);
    if (!reqRow) return { error: 404, msg: "quote_requests not found" };
    // İdempotency / yarış durumu koruması: istek artık açık değilse (başka bir teklif zaten kabul
    // edilmiş ya da iptal edilmişse) burada duruyoruz — iki teklif aynı anda "accepted" olamaz.
    if (reqRow.status !== "open") return { error: 409, msg: "Bu teklif isteği artık açık değil." };
    if (offer.status !== "submitted") return { error: 409, msg: "Sadece fiyat verilmiş bir teklif kabul edilebilir." };
    db.prepare(`UPDATE quote_offers SET status = 'accepted' WHERE id = ?`).run(offerId);
    db.prepare(`UPDATE quote_offers SET status = 'lost' WHERE requestId = ? AND id != ? AND status IN ('pending','submitted')`).run(offer.requestId, offerId);
    db.prepare(`UPDATE quote_requests SET status = 'closed' WHERE id = ?`).run(offer.requestId);
    return { ok: true, requestId: offer.requestId };
  })();
  if (result.error) return res.status(result.error).json({ error: result.msg });
  const updatedReq = hydrate("quote_requests", db.prepare(`SELECT * FROM quote_requests WHERE id = ?`).get(result.requestId));
  const updatedOffers = hydrateAll("quote_offers", db.prepare(`SELECT * FROM quote_offers WHERE requestId = ?`).all(result.requestId));
  res.json({ request: updatedReq, offers: updatedOffers });
});

// Tamirci, henüz yanıt vermediği bir teklif isteğine katılmayacağını netleştirir. Önceden "Vazgeç"
// butonu yalnızca fiyat formunu kapatıyordu, teklif "pending" (yanıt bekleniyor) kalmaya devam
// ediyordu — araç sahibi tarafında da bu tamircinin gerçekten pas geçtiği hiç görünmüyordu.
quoteOffersRouter.post("/:id/decline", (req, res) => {
  const offer = db.prepare(`SELECT * FROM quote_offers WHERE id = ?`).get(req.params.id);
  if (!offer) return res.status(404).json({ error: "quote_offers not found" });
  if (offer.status !== "pending") return res.status(409).json({ error: "Sadece yanıt bekleyen bir teklif reddedilebilir." });
  db.prepare(`UPDATE quote_offers SET status = 'declined' WHERE id = ?`).run(req.params.id);
  const updated = db.prepare(`SELECT * FROM quote_offers WHERE id = ?`).get(req.params.id);
  res.json(hydrate("quote_offers", updated));
});

quoteOffersRouter.delete("/:id", (req, res) => {
  try {
    const info = db.prepare(`DELETE FROM quote_offers WHERE id = ?`).run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: "quote_offers not found" });
    res.status(204).end();
  } catch (err) {
    res.status(409).json({ error: "Bu teklif silinemiyor." });
  }
});
