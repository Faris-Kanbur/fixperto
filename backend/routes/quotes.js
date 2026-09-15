import { Router } from "express";
import { db } from "../db/db.js";
import { hydrate, hydrateAll, dehydrate } from "../db/hydrate.js";
import { resolveActor } from "../utils/auth.js";

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

// GÜVENLİK DÜZELTMESİ (gerçek oturum sistemi): quote_requests kişisel arıza açıklaması/fotoğraf
// içerdiği için artık girişsiz erişime tamamen kapalı. Sahibi (ownerId eşleşen) kendi isteklerini,
// davet edilen bir tamirci (kendi id'si mechanicIds içinde geçen) o isteği, admin ise hepsini görür.
// mechanicIds bir JSON TEXT sütunu olduğu için (gerçek bir FK/ilişki değil) SQL WHERE ile
// filtrelenemiyor — tüm satırlar çekilip JS tarafında filtreleniyor (bu tablo büyük veri hacmine
// sahip değil, kabul edilebilir).
function requestVisibleTo(row, actor) {
  if (!actor) return false;
  if (actor.role === "admin") return true;
  if (actor.role === "owner") return row.ownerId === actor.id;
  if (actor.role === "mechanic") {
    try { return (JSON.parse(row.mechanicIds || "[]")).includes(actor.id); } catch { return false; }
  }
  return false;
}

quoteRequestsRouter.get("/", (req, res) => {
  const actor = resolveActor(req);
  if (!actor) return res.status(401).json({ error: "Bu veriye erişmek için giriş yapmanız gerekiyor." });
  const rows = db.prepare(`SELECT * FROM quote_requests`).all().filter((r) => requestVisibleTo(r, actor));
  res.json(hydrateAll("quote_requests", rows));
});

quoteRequestsRouter.get("/:id", (req, res) => {
  const row = db.prepare(`SELECT * FROM quote_requests WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: "quote_requests not found" });
  const actor = resolveActor(req);
  if (!requestVisibleTo(row, actor)) {
    return res.status(actor ? 403 : 401).json(actor ? { error: "Bu kayda erişim yetkiniz yok." } : { error: "Bu veriye erişmek için giriş yapmanız gerekiyor." });
  }
  res.json(hydrate("quote_requests", row));
});

quoteRequestsRouter.post("/", (req, res) => {
  const actor = resolveActor(req);
  if (!actor || (actor.role !== "admin" && actor.role !== "owner")) {
    return res.status(401).json({ error: "Teklif isteği oluşturmak için araç sahibi olarak giriş yapmanız gerekiyor." });
  }
  const body = dehydrate("quote_requests", req.body);
  let mechanicIds;
  try { mechanicIds = JSON.parse(body.mechanicIds ?? "[]"); } catch { mechanicIds = null; }
  if (!Array.isArray(mechanicIds) || mechanicIds.length === 0) {
    return res.status(400).json({ error: "En az bir tamirci seçmelisiniz." });
  }
  if (mechanicIds.length > MAX_QUOTE_MECHANICS) {
    return res.status(400).json({ error: `En fazla ${MAX_QUOTE_MECHANICS} tamirciye teklif isteği gönderebilirsiniz.` });
  }
  // GÜVENLİK: ownerId İSTEMCİDEN DEĞİL oturumdan alınıyor — bir owner artık başka bir owner adına
  // teklif isteği oluşturamaz (admin, gövdede belirtilen ownerId ile demo/test amaçlı oluşturabilir).
  body.ownerId = actor.role === "owner" ? actor.id : body.ownerId;
  if (!body.ownerId) return res.status(400).json({ error: "ownerId zorunludur." });
  /**
   * ====== İLİŞKİ BÜTÜNLÜĞÜ (ilişki denetiminde bulundu) ======
   * ---------------------------------------------------------------------------------------------
   * `ownerId` oturumdan yazılıyordu — doğru. Ama `vehicleId` İSTEMCİDEN geliyor ve hiç
   * doğrulanmıyordu. Ölçüldü: Customer A, Customer B'nin aracının id'sini göndererek kendi adına
   * teklif isteği açtı (201) ve istek satırı B'nin aracına bağlandı.
   *
   * Neden önemli: `vehicleId` bir YABANCI ANAHTAR, yani "bu iş şu araç için" demek. Yabancı bir
   * araca bağlanabiliyorsa:
   *   - araç sahibinin garajındaki bir kayıt, hiç izni olmayan birinin talebine iliştirilebiliyor,
   *   - tamircinin gördüğü "araç" ile veritabanındaki araç farklı kişilere ait olabiliyor,
   *   - servis geçmişi zinciri (randevu → vehicle_history → ilan) yanlış araca dayanabiliyor.
   * Kısacası ilişki tablosu doğru görünüyor ama YANLIŞ İKİ KAYDI birleştiriyor.
   *
   * Aynı gerekçe `mechanicIds` için de geçerli: var olmayan ya da silinmiş tamirci id'leri listeye
   * yazılabiliyordu; o zaman istek hiç kimseye ulaşmayan bir kayda dönüşüyor (müşteri "5 tamirciye
   * gönderdim" görüyor, gerçekte 2'sine gitmiş oluyor). Sessiz filtreleme YAPMIYORUZ — geçersiz
   * id varsa isteği reddediyoruz, çünkü sessizce eksiltmek müşteriye yanlış bilgi verir.
   */
  if (body.vehicleId != null && body.vehicleId !== "") {
    const veh = db.prepare(`SELECT id, ownerId FROM vehicles WHERE id = ?`).get(body.vehicleId);
    if (!veh) return res.status(400).json({ error: "Seçilen araç bulunamadı." });
    if (actor.role !== "admin" && veh.ownerId !== body.ownerId) {
      return res.status(403).json({ error: "Bu araç size ait değil." });
    }
  }
  const knownMechanics = db.prepare(
    `SELECT COUNT(*) n FROM mechanics WHERE id IN (${mechanicIds.map(() => "?").join(",")})`
  ).get(...mechanicIds).n;
  if (knownMechanics !== new Set(mechanicIds).size) {
    return res.status(400).json({ error: "Seçilen tamircilerden bazıları bulunamadı." });
  }
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
//
// GÜVENLİK DÜZELTMESİ (teklif akışı denetiminde bulundu): frontend bu uç noktayı hiç kullanmıyor
// (istek oluşturulduktan sonra ownerId/vehicleId/mechanicIds hiçbir ekrandan değiştirilmiyor), ama
// uç nokta genel PATCH olduğu için doğrudan çağrıldığında bu kimlik alanlarını da serbestçe
// yeniden yazmaya izin veriyordu — ör. bir isteğin ownerId'sini başka bir araç sahibine devretmek
// mümkündü. Artık oluşturulduktan sonra sabit kalması gereken alanlar (ownerId, vehicleId,
// mechanicIds) PATCH ile değiştirilemiyor.
const IMMUTABLE_REQUEST_FIELDS = ["ownerId", "vehicleId", "mechanicIds"];

// Sadece isteğin sahibi (ya da admin) düzenleyebilir/iptal edebilir/silebilir.
function requireOwnerOrAdmin(row, req, res) {
  const actor = resolveActor(req);
  if (!actor) { res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." }); return false; }
  if (actor.role === "admin") return true;
  if (actor.role === "owner" && row.ownerId === actor.id) return true;
  res.status(403).json({ error: "Bu işlem için yetkiniz yok." });
  return false;
}

quoteRequestsRouter.patch("/:id", (req, res) => {
  const existing = db.prepare(`SELECT * FROM quote_requests WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: "quote_requests not found" });
  if (!requireOwnerOrAdmin(existing, req, res)) return;
  const body = dehydrate("quote_requests", req.body);
  if ("status" in body) {
    return res.status(400).json({ error: "Durum değişikliği için /cancel veya ilgili teklifin /accept uç noktasını kullanın." });
  }
  for (const f of IMMUTABLE_REQUEST_FIELDS) delete body[f];
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
  const preCheck = db.prepare(`SELECT * FROM quote_requests WHERE id = ?`).get(requestId);
  if (!preCheck) return res.status(404).json({ error: "quote_requests not found" });
  if (!requireOwnerOrAdmin(preCheck, req, res)) return;
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
  const existing = db.prepare(`SELECT * FROM quote_requests WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: "quote_requests not found" });
  if (!requireOwnerOrAdmin(existing, req, res)) return;
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

// GÜVENLİK DÜZELTMESİ (gerçek oturum sistemi): bir teklifi görme yetkisi ya o teklifin ait olduğu
// tamirciye (mechanicId eşleşen) ya da o teklifin bağlı olduğu isteğin sahibi araç sahibine ait —
// başka bir owner/mechanic'in tekliflerini görememeli. requestId → quote_requests.ownerId join'i
// gerektiği için (mechanic tarafı zaten doğrudan mechanicId ile eşleşiyor) küçük bir yardımcı ile
// çözülüyor.
function offerVisibleTo(row, actor) {
  if (!actor) return false;
  if (actor.role === "admin") return true;
  if (actor.role === "mechanic") return row.mechanicId === actor.id;
  if (actor.role === "owner") {
    const parentReq = db.prepare(`SELECT ownerId FROM quote_requests WHERE id = ?`).get(row.requestId);
    return !!parentReq && parentReq.ownerId === actor.id;
  }
  return false;
}

quoteOffersRouter.get("/", (req, res) => {
  const actor = resolveActor(req);
  if (!actor) return res.status(401).json({ error: "Bu veriye erişmek için giriş yapmanız gerekiyor." });
  const rows = db.prepare(`SELECT * FROM quote_offers`).all().filter((r) => offerVisibleTo(r, actor));
  res.json(hydrateAll("quote_offers", rows));
});

quoteOffersRouter.get("/:id", (req, res) => {
  const row = db.prepare(`SELECT * FROM quote_offers WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: "quote_offers not found" });
  const actor = resolveActor(req);
  if (!offerVisibleTo(row, actor)) {
    return res.status(actor ? 403 : 401).json(actor ? { error: "Bu kayda erişim yetkiniz yok." } : { error: "Bu veriye erişmek için giriş yapmanız gerekiyor." });
  }
  res.json(hydrate("quote_offers", row));
});

// GÜVENLİK DÜZELTMESİ (teklif akışı denetiminde bulundu): bu dosyanın en üstündeki yorum, durum
// makinesinin (open → submitted → accepted/lost/declined) SADECE sunucuda ve HER ZAMAN uygulandığını
// söylüyor — ama bu, oluşturma (POST) uç noktası için doğru değildi. PATCH /:id "accepted" durumunu
// doğrudan yazmayı reddediyordu (bkz. yukarısı), fakat POST / hiçbir status kısıtı uygulamıyordu:
// istemciyi (ya da API'yi bilen herhangi birini) atlayıp doğrudan `POST /api/quote-offers`
// `{status:"accepted", requestId, mechanicId, price}` gönderen biri, /accept uç noktasının atomik
// transaction'ını (kardeş teklifleri "lost" yapma, isteği "closed" kapatma) TAMAMEN atlayarak
// sahte bir "kabul edilmiş teklif" satırı yaratabilirdi — durum makinesinin bütünlüğünü kökten
// bozan bir açık. Şimdi oluşturma sırasında yalnızca "pending" (henüz fiyat verilmemiş, tamirci
// tarafında bekleyen) ve "submitted" (otomatik demo teklifleri gibi baştan fiyatlı) kabul ediliyor;
// başka bir status gönderilirse reddediliyor. "submitted" olarak oluşturuluyorsa fiyat da (PATCH'teki
// gibi) pozitif bir sayı olmalı — aksi halde daha önce fiyat hiç doğrulanmadan kaydedilebiliyordu.
// NOT: yorumun eski hâli "otomatik demo teklifleri gibi baştan fiyatlı" diyordu. O demo davranışı
// KALDIRILDI (uydurma fiyat üretiyordu); "submitted" artık yalnızca teklifin sahibi tamirci
// tarafından, kendi oturumuyla oluşturulabiliyor.
const ALLOWED_OFFER_CREATE_STATUSES = new Set(["pending", "submitted"]);

/**
 * TEKLİF OLUŞTURMA — KİM NE OLUŞTURABİLİR.
 * ================================================================================================
 * GÜVENLİK AÇIĞI (kullanıcı bildirdi ve incelerken bunu buldum): bu uç, ARAÇ SAHİBİNİN
 * `status: "submitted"` ve İSTEDİĞİ FİYATLA, İSTEDİĞİ tamirci adına teklif oluşturmasına izin
 * veriyordu. Tek kontrol "bu senin isteğin mi" idi; teklifin ÜZERİNDEKİ tamircinin o teklifi
 * gerçekten verip vermediği hiç sorulmuyordu.
 *
 * Sonucu şu: bir müşteri, hiç konuşmadığı bir tamirci adına "500₺" diye bir teklif kaydedip
 * sonra onu KABUL edebilirdi. Karşı tarafta hiç kimse o fiyatı kabul etmemiş olurdu. PATCH yolu
 * doğru kilitlenmişti (fiyatı yalnızca o teklifin sahibi tamirci gönderebiliyor) ama OLUŞTURMA
 * yolu açık kalmıştı — yani kilit kapıdaydı, pencere açıktı.
 *
 * YENİ KURAL: FİYATLI bir teklifi (`submitted`) yalnızca O TAMİRCİ oluşturabilir.
 *   - tamirci  → kendi mechanicId'siyle, fiyatlı teklif oluşturabilir (mechanicId istemciden
 *                değil OTURUMDAN alınıyor, başkası adına oluşturulamaz)
 *   - araç sahibi → yalnızca KENDİ isteğinde, yalnızca `pending` (fiyatsız) yer tutucu satır
 *                oluşturabilir. Bu satır "şu tamirciden teklif istedim" kaydıdır, teklifin
 *                kendisi değil.
 *   - yönetici → fiyatlı teklif oluşturamaz. Bir tamircinin adına fiyat yazmak yönetim işi
 *                değil, veri uydurmaktır.
 *
 * Fiyat alanları araç sahibi tarafından gönderilse bile SİLİNİYOR (400 ile reddetmek yerine):
 * eski istemciler bu alanları gönderiyordu ve isteği tamamen reddetmek, teklif isteme akışını
 * çalışmaz hâle getirirdi. Değeri atmak hem güvenli hem geriye dönük uyumlu.
 */
quoteOffersRouter.post("/", (req, res) => {
  const actor = resolveActor(req);
  if (!actor || (actor.role !== "admin" && actor.role !== "owner" && actor.role !== "mechanic")) {
    return res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." });
  }
  const body = dehydrate("quote_offers", req.body);
  if (!body.requestId || !body.mechanicId) {
    return res.status(400).json({ error: "requestId ve mechanicId zorunludur." });
  }
  const parentReq = db.prepare(`SELECT * FROM quote_requests WHERE id = ?`).get(body.requestId);
  if (!parentReq) return res.status(404).json({ error: "quote_requests not found" });
  if (actor.role === "owner" && parentReq.ownerId !== actor.id) {
    return res.status(403).json({ error: "Bu isteğe teklif ekleme yetkiniz yok." });
  }
  if (actor.role === "mechanic") body.mechanicId = actor.id; // kendi kimliğin dışında bir tamirci adına teklif oluşturulamaz
  /**
   * ====== DAVET KONTROLÜ: OKUMA KAPALIYDI, YAZMA AÇIKTI (ilişki denetiminde ÖLÇÜLDÜ) ======
   * ---------------------------------------------------------------------------------------------
   * `requestVisibleTo` (bu dosyanın başı) okumayı doğru kısıtlıyor: bir tamirci ancak kendi id'si
   * `mechanicIds` içinde geçiyorsa isteği görebiliyor. Ama BU uç o kontrolü hiç çağırmıyordu.
   * Ölçüldü: Mechanic B isteği `GET` ile OKUYAMADI (403) ama aynı isteğe fiyatlı teklif VERDİ
   * (201, price=1). Yani müşteri hiç seçmediği bir tamirciden fiyat görüyordu.
   *
   * İki ayrı zarar:
   *   1) İSTENMEYEN TEKLİF: teklif isteme özelliğinin tüm anlamı "ben bu 5 tamirciden fiyat
   *      istiyorum" demek. Davetsiz teklif, özelliği bir spam kanalına çeviriyor.
   *   2) NUMARALANDIRMA KANALI: yanıt kodları birbirinden ayırt edilebiliyordu (404 = istek yok,
   *      409 = var ama kapalı / zaten teklifim var, 201 = var ve açık). Yani okuma 403 verse bile
   *      bir tamirci, YAZMA yoluyla başka müşterilerin isteklerinin varlığını ve durumunu
   *      sayabiliyordu. Bu, "okuma kapalı" korumasını dolaylı olarak boşa çıkarıyor.
   *
   * Artık davet edilmemiş tamirci, isteğin var olup olmadığını bile öğrenemiyor: `requestVisibleTo`
   * ile aynı kaynağı kullanıyoruz, böylece kural iki yolda AYRI AYRI yazılmıyor — tek yerde duruyor.
   */
  if (!requestVisibleTo(parentReq, actor)) {
    return res.status(403).json({ error: "Bu isteğe teklif ekleme yetkiniz yok." });
  }
  let status = body.status || "pending";
  if (!ALLOWED_OFFER_CREATE_STATUSES.has(status)) {
    return res.status(400).json({ error: "Bir teklif yalnızca 'pending' veya 'submitted' durumuyla oluşturulabilir." });
  }
  /**
   * FİYATLI TEKLİFİ YALNIZCA O TAMİRCİ OLUŞTURABİLİR (bkz. yukarıdaki açıklama).
   * `isOwnerOfOffer` kontrolü mechanicId üzerinden: tamirci oturumunda mechanicId yukarıda
   * oturumdan yazıldığı için bu her zaman kendi kimliği oluyor. Diğer herkes için `pending`e
   * düşürülüyor ve fiyat bilgileri temizleniyor — böylece "teklif istendi" kaydı yine oluşuyor,
   * ama kimsenin vermediği bir fiyat sisteme girmiyor.
   */
  const isOfferOwner = actor.role === "mechanic" && body.mechanicId === actor.id;
  if (status === "submitted" && !isOfferOwner) {
    status = "pending";
  }
  body.status = status;
  if (status === "submitted") {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ error: "Fiyat verilmiş bir teklif için geçerli, pozitif bir fiyat zorunludur." });
    }
    body.price = price;
  } else {
    // `pending` bir teklif FİYAT TAŞIMAZ. etaDays ve note de tamircinin cevabının parçası —
    // biri bunları yer tutucu satıra yazarsa müşteri, verilmemiş bir söz görür.
    body.price = null;
    body.etaDays = null;
    body.note = null;
  }
  if (parentReq.status !== "open") {
    return res.status(409).json({ error: "Bu teklif isteği artık açık değil." });
  }
  const existingOffer = db.prepare(`SELECT id FROM quote_offers WHERE requestId = ? AND mechanicId = ?`).get(body.requestId, body.mechanicId);
  if (existingOffer) {
    return res.status(409).json({ error: "Bu tamirci için bu istekte zaten bir teklif kaydı var." });
  }
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
//
// GÜVENLİK DÜZELTMESİ (devamı, teklif akışı denetiminde bulundu): (1) fiyat hiçbir zaman
// doğrulanmıyordu — "submitted" durumuna geçerken negatif, sıfır veya sayı olmayan bir `price`
// gönderen biri bunu olduğu gibi kaydedebiliyordu. (2) requestId/mechanicId gibi kimlik alanları
// da genel PATCH'in bir parçası olduğu için, bir teklifi başka bir isteğe ya da başka bir tamirciye
// ait gösterecek şekilde yeniden atamak mümkündü (oluşturulduktan sonra bu alanlar değişmemeli).
// Artık her ikisi de engelleniyor.
const IMMUTABLE_OFFER_FIELDS = ["requestId", "mechanicId"];

quoteOffersRouter.patch("/:id", (req, res) => {
  const existing = db.prepare(`SELECT * FROM quote_offers WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: "quote_offers not found" });
  // GÜVENLİK DÜZELTMESİ (gerçek oturum sistemi): fiyat sadece o teklifin GERÇEK sahibi (mechanicId
  // eşleşen tamirci oturumu) tarafından gönderilebilir — önceden herhangi biri herhangi bir
  // tamircinin bekleyen teklifine fiyat girebiliyordu.
  const actor = resolveActor(req);
  if (!actor) return res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." });
  if (actor.role !== "admin" && !(actor.role === "mechanic" && existing.mechanicId === actor.id)) {
    return res.status(403).json({ error: "Bu teklifi değiştirme yetkiniz yok." });
  }
  const body = dehydrate("quote_offers", req.body);
  for (const f of IMMUTABLE_OFFER_FIELDS) delete body[f];
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
    const price = Number(body.price);
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ error: "Lütfen geçerli, pozitif bir fiyat girin." });
    }
    body.price = price;
    if ("etaDays" in body && body.etaDays !== null) {
      const eta = Number(body.etaDays);
      if (!Number.isFinite(eta) || eta <= 0) {
        return res.status(400).json({ error: "Geçerli bir teslim süresi (gün) girin." });
      }
      body.etaDays = Math.round(eta);
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
  // GÜVENLİK DÜZELTMESİ (gerçek oturum sistemi): sadece isteği açan araç sahibi bir teklifi kabul
  // edebilir — önceden herhangi biri herhangi bir teklifi kabul edip randevu akışını tetikleyebilirdi.
  const preOffer = db.prepare(`SELECT * FROM quote_offers WHERE id = ?`).get(offerId);
  if (!preOffer) return res.status(404).json({ error: "quote_offers not found" });
  const preReq = db.prepare(`SELECT ownerId FROM quote_requests WHERE id = ?`).get(preOffer.requestId);
  const actor = resolveActor(req);
  if (!actor) return res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." });
  if (actor.role !== "admin" && !(actor.role === "owner" && preReq && preReq.ownerId === actor.id)) {
    return res.status(403).json({ error: "Bu teklifi kabul etme yetkiniz yok." });
  }
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
  // GÜVENLİK DÜZELTMESİ (gerçek oturum sistemi): sadece o teklifin GERÇEK sahibi tamirci reddedebilir.
  const actor = resolveActor(req);
  if (!actor) return res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." });
  if (actor.role !== "admin" && !(actor.role === "mechanic" && offer.mechanicId === actor.id)) {
    return res.status(403).json({ error: "Bu teklifi reddetme yetkiniz yok." });
  }
  if (offer.status !== "pending") return res.status(409).json({ error: "Sadece yanıt bekleyen bir teklif reddedilebilir." });
  db.prepare(`UPDATE quote_offers SET status = 'declined' WHERE id = ?`).run(req.params.id);
  const updated = db.prepare(`SELECT * FROM quote_offers WHERE id = ?`).get(req.params.id);
  res.json(hydrate("quote_offers", updated));
});

quoteOffersRouter.delete("/:id", (req, res) => {
  const existing = db.prepare(`SELECT * FROM quote_offers WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: "quote_offers not found" });
  // GÜVENLİK DÜZELTMESİ (bu denetimde bulundu): burada `offerVisibleTo` kullanılıyordu, ama o
  // fonksiyon GÖRME yetkisi içindir — teklifin bağlı olduğu isteğin sahibi araç sahibini de "görebilir"
  // sayar, bu da bir owner'ın (frontend'de bu yola hiç UI olmasa da, API'yi doğrudan çağırarak) başka
  // bir tamircinin teklif satırını SİLEBİLMESİ anlamına geliyordu. Silme, PATCH ile aynı kurala tabi
  // olmalı: sadece o teklifin gerçek sahibi tamirci ya da admin.
  const actor = resolveActor(req);
  if (!actor) return res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." });
  if (actor.role !== "admin" && !(actor.role === "mechanic" && existing.mechanicId === actor.id)) {
    return res.status(403).json({ error: "Bu teklifi silme yetkiniz yok." });
  }
  try {
    const info = db.prepare(`DELETE FROM quote_offers WHERE id = ?`).run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: "quote_offers not found" });
    res.status(204).end();
  } catch (err) {
    res.status(409).json({ error: "Bu teklif silinemiyor." });
  }
});
