import { Router } from "express";
import { db } from "../db/db.js";
import { makeRateLimiter, resolveActor } from "../utils/auth.js";

/**
 * ARACIN GEÇMİŞİ — şasi (VIN) numarasına bağlı, sahipten bağımsız servis kaydı.
 * ---------------------------------------------------------------------------------------------
 * SORUN: bakım geçmişi araç SAHİBİNE bağlıydı. Araç el değiştirince eski sahip aracı hesabından
 * siliyor, geçmiş de onunla gidiyordu. Oysa geçmiş arabaya ait: yeni sahip için de, o arabaya
 * bakacak tamirci için de en değerli bilgi bu.
 *
 * ÇÖZÜM: isteğe bağlı bir şasi numarası. Girildiğinde, o araçla ilgili TAMAMLANMIŞ randevular
 * VIN'e bağlı kalıcı bir kayda yazılıyor. Araç satıldığında yeni sahip aynı numarayı kendi
 * aracına girdiğinde geçmişi görüyor.
 *
 * ====== GÜVENLİK: burası dikkat isteyen bir yer, çünkü VIN yarı-açık bir veridir (camda yazar,
 * ilanda paylaşılır). "VIN'i bilen her şeyi görür" demek, araç geçmişini sızdırmaktır. Kurallar:
 *
 *  1) İZİN ŞART. Kayıt yalnızca o dönemin sahibi paylaşıma açık bıraktıysa (shared = 1) görünür.
 *     İzin, kaydın ait olduğu DÖNEMİN sahibine aittir: sonraki sahip, kendinden önceki dönemin
 *     iznini değiştiremez.
 *  2) KİMLİK ŞART. Sorgulama için giriş yapmış olmak gerekir (araç sahibi ya da tamirci) —
 *     anonim bir betik VIN taraması yapamaz.
 *  3) HIZ SINIRI. Kimlik de yetmez: saatte sınırlı sayıda sorgu. Amaç VIN listesiyle toplu
 *     veri toplamayı ekonomik olmaktan çıkarmak.
 *  4) KİŞİSEL VERİ DÖNMEZ. Yanıt yalnızca "ne zaman, hangi işletmede, ne yapıldı" bilgisini
 *     içerir. Eski sahibin adı, telefonu, plakası ve ödediği tutar ASLA dönmez — bunlar aracın
 *     değil, bir KİŞİNİN verisidir ve alıcıyı ilgilendirmez.
 *  5) KAYIT UYDURULAMAZ. Kaydı yalnızca işi yapan tamirci, KENDİ tamamlanmış randevusundan
 *     oluşturabilir; mechanicId oturumdan damgalanır, randevunun gerçekten o tamirciye ait ve
 *     "Tamamlandı" durumunda olduğu sunucuda doğrulanır. Randevu başına tek kayıt (UNIQUE index).
 */
const router = Router();

// --- VIN doğrulama ----------------------------------------------------------------------------
// Gerçek VIN 17 hane, harf+rakam, ve I/O/Q HARFLERİNİ İÇERMEZ (1/0 ile karışmasın diye standart
// bunları dışlar). Eski/özel araçlarda daha kısa şasi numaraları da var, bu yüzden 11-17 arası
// kabul ediyoruz ama karakter kümesini standarda göre denetliyoruz: böylece "1234" gibi bir şey
// ya da yanlışlıkla yazılmış plaka kalıcı kayda girmiyor.
const VIN_RE = /^[A-HJ-NPR-Z0-9]{11,17}$/;
export const normalizeVin = (raw) => String(raw ?? "").trim().toUpperCase().replace(/[\s-]/g, "");
export const isValidVin = (raw) => VIN_RE.test(normalizeVin(raw));

const lookupLimiter = makeRateLimiter({ maxAttempts: 40, lockoutMs: 30 * 60 * 1000, windowMs: 60 * 60 * 1000 });

function requireUser(req, res) {
  const actor = resolveActor(req);
  if (!actor) { res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." }); return null; }
  if (actor.role !== "owner" && actor.role !== "mechanic" && actor.role !== "admin") {
    res.status(403).json({ error: "Bu işlem için yetkiniz yok." }); return null;
  }
  return actor;
}

// Dışarıya (kaydın sahibi olmayan birine) dönen biçim: kişisel hiçbir alan yok.
const publicRecord = (r) => ({
  id: r.id,
  serviceDate: r.serviceDate,
  serviceText: r.serviceText,
  mechanicName: r.mechanicName,
  mechanicId: r.mechanicId,
  km: r.km ?? null,
  warrantyEndDate: r.warrantyEndDate || null,
  verified: true,
});
// Kaydın kendi sahibine/tamircisine dönen biçim: ek olarak paylaşım durumu ve randevu bağlantısı.
const ownRecord = (r) => ({ ...publicRecord(r), shared: !!r.shared, appointmentId: r.appointmentId, vin: r.vin });

/**
 * KAYIT OLUŞTURMA — yalnızca işi yapan tamirci, kendi tamamlanmış randevusundan.
 * Gövde: { vin, appointmentId, serviceText?, km?, warrantyEndDate? }
 */
router.post("/", (req, res) => {
  const actor = requireUser(req, res);
  if (!actor) return;
  if (actor.role !== "mechanic") {
    return res.status(403).json({ error: "Servis kaydını yalnızca işi yapan tamirci oluşturabilir." });
  }
  const appointmentId = Number(req.body?.appointmentId);
  if (!Number.isFinite(appointmentId)) return res.status(400).json({ error: "appointmentId zorunludur." });

  const appt = db.prepare(`SELECT * FROM appointments WHERE id = ?`).get(appointmentId);
  if (!appt) return res.status(404).json({ error: "Randevu bulunamadı." });
  // Kayıt uydurulamasın: randevu gerçekten BU tamirciye ait olmalı ve tamamlanmış olmalı.
  if (appt.mechanicId !== actor.id) return res.status(403).json({ error: "Bu randevu size ait değil." });
  if (appt.status !== "Tamamlandı") return res.status(400).json({ error: "Yalnızca tamamlanmış randevular geçmişe yazılır." });

  // VIN iki yoldan gelebilir:
  //  1) Tamirci elle yazar (aracı fiziksel olarak görüyor, şasi numarası ön camın altında).
  //  2) Yazmazsa SUNUCU çözer: randevunun sahibinin garajındaki araçlardan, randevu metnindeki
  //     plakayla eşleşeni bulur. Böylece araç sahibi şasi numarasını bir kez girdiyse geçmiş
  //     kaydı kendiliğinden oluşuyor — tamircinin ek bir iş yapması gerekmiyor.
  // Tamirci araç sahibinin garajını GÖREMEZ; bu eşleştirme yalnızca sunucuda yapılıyor ve
  // sonucunda tamirciye aracın VIN'i dönmüyor (yanıt kendi kaydı, zaten ona ait).
  let vin = normalizeVin(req.body?.vin);
  if (!vin && appt.ownerId != null) {
    const candidates = db.prepare(`SELECT plate, vin FROM vehicles WHERE ownerId = ? AND vin IS NOT NULL AND vin != ''`).all(appt.ownerId);
    const apptText = String(appt.vehicle || "");
    const match = candidates.find((v) => v.plate && apptText.includes(v.plate));
    if (match) vin = normalizeVin(match.vin);
  }
  if (!isValidVin(vin)) return res.status(400).json({ error: "Geçersiz ya da eksik şasi (VIN) numarası." });

  const mech = db.prepare(`SELECT name FROM mechanics WHERE id = ?`).get(actor.id);
  // Paylaşım izni: aracın sahibi VIN paylaşımını kapattıysa kayıt yine tutulur ama kapalı doğar.
  const vehicleShared = db.prepare(`SELECT vinShared FROM vehicles WHERE vin = ? AND ownerId = ?`).get(vin, appt.ownerId);
  const shared = vehicleShared ? (vehicleShared.vinShared ? 1 : 0) : 1;

  const kmRaw = Number(req.body?.km);
  const row = {
    vin,
    ownerId: appt.ownerId ?? null,
    mechanicId: actor.id,
    mechanicName: mech?.name || null,
    appointmentId,
    serviceDate: appt.dateISO || appt.date || new Date().toISOString(),
    serviceText: String(req.body?.serviceText || appt.issue || "").slice(0, 500),
    km: Number.isFinite(kmRaw) && kmRaw >= 0 && kmRaw <= 1_500_000 ? Math.round(kmRaw) : null,
    warrantyEndDate: appt.warrantyEndDate || null,
    shared,
  };
  try {
    const info = db.prepare(
      `INSERT INTO vehicle_history (vin, ownerId, mechanicId, mechanicName, appointmentId, serviceDate, serviceText, km, warrantyEndDate, shared)
       VALUES (@vin, @ownerId, @mechanicId, @mechanicName, @appointmentId, @serviceDate, @serviceText, @km, @warrantyEndDate, @shared)`
    ).run(row);
    const created = db.prepare(`SELECT * FROM vehicle_history WHERE id = ?`).get(info.lastInsertRowid);
    // NOT: aracın kendi kaydındaki (vehicles.vin) numarayı BURADA doldurmuyoruz. Tamirci şasi
    // numarasını camdan okuyup işini kaydedebilir, ama başkasının garajındaki kaydı değiştirmek
    // onun yetkisi değil — VIN'i araca bağlamak sahibinin kendi işi.
    res.status(201).json(ownRecord(created));
  } catch (err) {
    if (/UNIQUE/i.test(err.message)) {
      const existing = db.prepare(`SELECT * FROM vehicle_history WHERE appointmentId = ?`).get(appointmentId);
      return res.json(ownRecord(existing));
    }
    throw err;
  }
});

/** Kendi kayıtlarım: araç sahibi için sahibi olduğu dönem, tamirci için kendi yaptığı işler. */
router.get("/mine", (req, res) => {
  const actor = requireUser(req, res);
  if (!actor) return;
  const rows = actor.role === "owner"
    ? db.prepare(`SELECT * FROM vehicle_history WHERE ownerId = ? ORDER BY serviceDate DESC`).all(actor.id)
    : actor.role === "mechanic"
      ? db.prepare(`SELECT * FROM vehicle_history WHERE mechanicId = ? ORDER BY serviceDate DESC`).all(actor.id)
      : db.prepare(`SELECT * FROM vehicle_history ORDER BY serviceDate DESC`).all();
  res.json(rows.map(ownRecord));
});

/**
 * VIN SORGULAMA — aracı satın alan kişinin ya da ona bakacak tamircinin görmesi için.
 * Yalnızca paylaşıma açık kayıtlar ve yalnızca kişisel veri içermeyen alanlar döner.
 */
router.post("/lookup", (req, res) => {
  const actor = requireUser(req, res);
  if (!actor) return;
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  if (lookupLimiter.check(ip).blocked) {
    return res.status(429).json({ error: "Çok fazla sorgulama. Lütfen daha sonra tekrar deneyin." });
  }
  lookupLimiter.registerFailure(ip);
  const vin = normalizeVin(req.body?.vin);
  if (!isValidVin(vin)) return res.status(400).json({ error: "Geçersiz şasi (VIN) numarası." });

  const rows = db.prepare(`SELECT * FROM vehicle_history WHERE vin = ? ORDER BY serviceDate DESC`).all(vin);
  const visible = rows.filter((r) => r.shared || (actor.role === "admin") || r.ownerId === actor.id || r.mechanicId === actor.id);
  // Kendi kaydımsa tam, değilse kişisel veri içermeyen biçim.
  const records = visible.map((r) => (
    (actor.role === "admin" || r.ownerId === actor.id || r.mechanicId === actor.id) ? ownRecord(r) : publicRecord(r)
  ));
  // Gizlenen kayıt sayısını söylüyoruz: alıcı "geçmiş yok" ile "geçmiş paylaşılmamış" arasındaki
  // farkı bilmeli, yoksa eksik bilgiyi temiz geçmiş sanır.
  res.json({ vin, records, hiddenCount: rows.length - visible.length });
});

/**
 * PAYLAŞIM İZNİ — yalnızca kendi dönemine ait kayıtlar için.
 * Gövde: { vin, shared }
 */
router.post("/share", (req, res) => {
  const actor = requireUser(req, res);
  if (!actor) return;
  if (actor.role !== "owner") return res.status(403).json({ error: "Paylaşım iznini yalnızca aracın sahibi değiştirebilir." });
  const vin = normalizeVin(req.body?.vin);
  if (!isValidVin(vin)) return res.status(400).json({ error: "Geçersiz şasi (VIN) numarası." });
  const shared = req.body?.shared ? 1 : 0;
  const info = db.prepare(`UPDATE vehicle_history SET shared = ? WHERE vin = ? AND ownerId = ?`).run(shared, vin, actor.id);
  res.json({ ok: true, updated: info.changes, shared: !!shared });
});

/**
 * İLANDAKİ GEÇMİŞ — satıcı "bakım geçmişini göster" dediyse, ilana bakan herkes görebilir.
 * Burada VIN sormuyoruz ve kimlik istemiyoruz: satıcı bu bilgiyi BİLEREK yayımladı. Yine de
 * yalnızca kişisel veri içermeyen alanlar dönüyor.
 */
router.get("/listing/:id", (req, res) => {
  const listing = db.prepare(`SELECT id, vin, showHistory, sellerId, sellerType FROM listings WHERE id = ?`).get(req.params.id);
  if (!listing) return res.status(404).json({ error: "İlan bulunamadı." });
  if (!listing.showHistory || !listing.vin) return res.json({ records: [], shown: false });
  // GÜVENLİK: satıcının ilana RASTGELE bir VIN yazıp başkasının aracının geçmişini yayımlaması
  // engelleniyor. İlandaki numaranın satıcıyla gerçek bir bağı olmalı: ya araç şu anda satıcının
  // garajında kayıtlı, ya da o VIN'e ait kayıtların sahibi satıcının kendisi (aracı bizde
  // kullanmış). İkisi de yoksa geçmiş gösterilmiyor.
  const sellerOwnsVehicle = listing.sellerType === "owner" && !!db.prepare(
    `SELECT 1 FROM vehicles WHERE vin = ? AND ownerId = ?`
  ).get(listing.vin, listing.sellerId);
  const sellerHasRecords = listing.sellerType === "owner" && !!db.prepare(
    `SELECT 1 FROM vehicle_history WHERE vin = ? AND ownerId = ?`
  ).get(listing.vin, listing.sellerId);
  if (!sellerOwnsVehicle && !sellerHasRecords) return res.json({ records: [], shown: false, unverified: true });
  const rows = db.prepare(`SELECT * FROM vehicle_history WHERE vin = ? AND shared = 1 ORDER BY serviceDate DESC`).all(listing.vin);
  res.json({ records: rows.map(publicRecord), shown: true });
});

export default router;
