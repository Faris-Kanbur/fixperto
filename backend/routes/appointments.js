import { Router } from "express";
import { db } from "../db/db.js";
import { hydrate, dehydrate } from "../db/hydrate.js";
import { resolveActor } from "../utils/auth.js";

/**
 * RANDEVULAR — ÖZEL ROUTER (tam uygulama denetiminde eklendi).
 * ================================================================================================
 * NEDEN JENERİK CRUD YETMEDİ:
 * Randevu satırı İKİ TARAFIN paylaştığı tek kayıt. Jenerik CRUD'un sahiplik modeli "bu satır senin
 * mi" sorusunu doğru cevaplıyor, ama randevuda asıl soru bu değil — asıl soru "bu ALANI sen
 * yazabilir misin". Denetimde ölçülen sonuç:
 *
 *   MÜŞTERİ kendi randevusunda şunları yazabiliyordu:
 *     status → "Tamamlandı"     (yapılmamış işi tamamlanmış gösterme)
 *     servicePrice → 1          (hizmet bedelini kendi belirleme)
 *     depositPaid → 99999       (ödenmemiş kaporayı ödenmiş gösterme)
 *     depositRefunded → true    (yapılmamış iadeyi yapılmış gösterme)
 *     noShow → true             (gelen müşteriyi "gelmedi" diye işaretleme / tamirciyi suçlama)
 *     autoAccepted → true       (tamircinin onayını atlamış gösterme)
 *     warrantyEndDate → 2099    (verilmemiş garantiyi uydurma)
 *     mechanicName → "X"        (kaydın hangi tamirciye ait göründüğünü değiştirme)
 *     ownerId / mechanicId      (randevuyu başka kişiye/tamirciye devretme)
 *
 * Bunların hiçbiri "sahiplik" ihlali değil — hepsi kendi satırında. O yüzden sahiplik kontrolü
 * bunları hiç görmedi. Doğru model ALAN BAZLI ve ROL BAZLI beyaz liste: bir rol yalnızca
 * kendisine ait KARARLARI yazabilir, karşı tarafın kararlarını yazamaz.
 *
 * NEDEN AYRI DOSYA VE CRUD'DAN ÖNCE: bu depodaki yerleşik desen (reviewsRouter,
 * listingInteractionsRouter, jobApplicationsRouter). Jenerik fabrikayı randevuya özel kurallarla
 * şişirmek diğer yedi tabloyu da riske atardı; ayrı router yalnızca bu tabloyu etkiliyor.
 * GET ve DELETE hâlâ jenerik CRUD'da (orada sahiplik kontrolü doğru ve yeterli).
 */

export const appointmentsRouter = Router();

/**
 * TABLONUN GERÇEK SÜTUNLARI — bilinmeyen anahtarları SQL'e hiç ulaştırmadan at.
 *
 * KENDİ HATAM: bu router'ı yazarken jenerik CRUD fabrikasının `sanitizeBody` adımını
 * tekrarlamayı atladım. Sonuç: gövdede tabloda olmayan bir alan varsa (mevcut istemci
 * `service: "Bakım"` gönderiyor, öyle bir sütun yok) INSERT sözdizimi hatası veriyor ve
 * kullanıcıya 500 "Internal server error" dönüyordu — yani randevu almak TAMAMEN kırıktı.
 * Fabrikanın çözdüğü bir sorunu yeni dosyada yeniden üretmek, ayrı router yazmanın bilinen
 * bedeli; o yüzden aynı korumayı burada da açıkça kuruyorum.
 */
const columnsOf = (table) => {
  try { return new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name)); }
  catch { return null; }
};
const APPOINTMENT_COLUMNS = columnsOf("appointments");
/** Bilinmeyen anahtarları ve `undefined` değerleri atar. */
function onlyRealColumns(body) {
  const out = {};
  for (const [k, v] of Object.entries(body || {})) {
    if (v === undefined) continue;
    if (APPOINTMENT_COLUMNS && !APPOINTMENT_COLUMNS.has(k)) continue;
    out[k] = v;
  }
  return out;
}

/**
 * KİM HANGİ ALANI YAZABİLİR — BEYAZ LİSTE (varsayılan RET).
 * Kara liste (yasaklıları say) yerine beyaz liste: yeni bir sütun eklendiğinde varsayılan olarak
 * KAPALI oluyor. Kara listede yeni sütun varsayılan olarak AÇIK olurdu ve bu denetimde bulunan
 * hatanın tam olarak sebebi buydu.
 */
const OWNER_WRITABLE = new Set([
  // Müşterinin kendi kararları ve kendi anlattığı bilgiler.
  "status",            // yalnızca iptal — aşağıdaki durum makinesi sınırlıyor
  "issue", "issuePhotos", "vehicle", "customer", "historyShareConsent",
  "date", "time",      // yeniden planlama
  "reviewed",          // yorumunu yazdığında işaretlenir (yalnızca false→true, aşağıda)
]);
const MECHANIC_WRITABLE = new Set([
  // Tamircinin kendi kararları: işi kabul etmek, reddetmek, tamamlamak, gelmediğini bildirmek,
  // bedeli ve garantiyi belirlemek. Bedel tamircinin işi — müşterinin değil.
  "status", "servicePrice", "noShow", "warrantyEndDate", "date", "time",
]);
/**
 * HİÇ KİMSE (yönetici hariç) yazamaz:
 *   ownerId, mechanicId   → kaydın tarafları; oluşturulduktan sonra değişmemeli
 *   autoAccepted          → tamircinin politikasından SUNUCU türetiyor (aşağıya bakın)
 *   depositPaid, depositRefunded → para hareketi; bu uygulamada ödeme entegrasyonu YOK, yani
 *                           bu alanları yazabilen taraf olmamalı. Yönetici elle düzeltebilir.
 *   mechanicName, mechanicImg → kaydın oluşturulduğu andaki kopyalar
 *   createdAt
 */

/** Randevu durumları ve GEÇERLİ geçişler. Kaynak: ön yüzdeki gerçek akış (accept/reject/complete). */
const STATUS = {
  PENDING: "Onay Bekliyor",
  QUEUED: "Sırada",
  DONE: "Tamamlandı",
  REJECTED: "Reddedildi",
  CANCELLED: "İptal Edildi",
  NO_SHOW: "Gelmedi",
};
const ALL_STATUSES = new Set(Object.values(STATUS));

/**
 * DURUM MAKİNESİ — hangi rol hangi geçişi yapabilir.
 * Denetimde bulunan sorun: hiçbir geçiş kuralı yoktu, yani müşteri "Onay Bekliyor" bir randevuyu
 * doğrudan "Tamamlandı" yapabiliyordu. Tamamlanmış randevu ise DOĞRULANMIŞ SERVİS GEÇMİŞİNİN
 * ön koşulu (bkz. routes/vehicleHistory.js) — yani araç satarken güven uydurma yolu olurdu.
 * (O uç ayrıca "yalnızca işi yapan tamirci" kontrolü yapıyor ve saldırıyı orada da durdurdu;
 * ama iki savunma hattının ikisi de gerekli — birincisi burada.)
 */
const TRANSITIONS = {
  owner: {
    // Müşteri yalnızca İPTAL edebilir, ve yalnızca henüz başlamamış bir randevuyu.
    [STATUS.PENDING]: new Set([STATUS.CANCELLED]),
    [STATUS.QUEUED]: new Set([STATUS.CANCELLED]),
  },
  mechanic: {
    [STATUS.PENDING]: new Set([STATUS.QUEUED, STATUS.REJECTED, STATUS.CANCELLED]),
    [STATUS.QUEUED]: new Set([STATUS.DONE, STATUS.NO_SHOW, STATUS.CANCELLED, STATUS.REJECTED]),
  },
};

const isParty = (actor, row) => (
  (actor?.role === "owner" && row.ownerId === actor.id)
  || (actor?.role === "mechanic" && row.mechanicId === actor.id)
);

/**
 * POST /api/appointments — RANDEVU OLUŞTURMA.
 *
 * İKİ GERÇEK HATA BURADA DÜZELTİLİYOR:
 *
 * 1) "RANDEVULARI OTOMATİK KABUL ET" AYARI HİÇ ÇALIŞMIYORDU.
 *    Ayar tamircinin kendi ayarlar ekranında var, ama yalnızca istemci state'inde tutuluyordu
 *    (`useState(true)`) — sunucuya hiç yazılmıyordu. Daha kötüsü: randevu oluşturulurken
 *    `autoAccepted` değerini MÜŞTERİNİN tarayıcısı gönderiyordu ve orada varsayılan `true` idi.
 *    Yani tamirci "randevularımı ben onaylayacağım" dediğinde bu ayarın HİÇBİR ETKİSİ yoktu;
 *    her randevu otomatik onaylanmış olarak düşüyordu. Ayar bir kurgu olarak duruyordu.
 *    Artık karar SUNUCUDA, tamircinin kendi satırından okunuyor.
 *
 * 2) AYNI SAATE SINIRSIZ RANDEVU. Denetimde 10 eşzamanlı istek 10 kayıt üretti. Slot kontrolü
 *    yalnızca istemcideydi (bkz. bookableSlots) ve istemci kontrolü kontrol değildir.
 *    Artık tek bir işlem (transaction) içinde "bu tamirci + bu tarih + bu saat" dolu mu diye
 *    bakılıyor; SQLite tek yazıcılı olduğu için bu kontrol eşzamanlı isteklerde de doğru.
 */
appointmentsRouter.post("/", (req, res) => {
  const actor = resolveActor(req);
  if (!actor) return res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." });
  if (actor.role !== "owner" && actor.role !== "admin") {
    return res.status(403).json({ error: "Randevu yalnızca araç sahibi tarafından oluşturulabilir." });
  }
  const body = dehydrate("appointments", req.body || {});

  const mechanicId = Number(body.mechanicId);
  if (!Number.isInteger(mechanicId) || mechanicId <= 0) {
    return res.status(400).json({ error: "Geçerli bir tamirci seçilmedi." });
  }
  const mech = db.prepare(`SELECT id, name, img, autoAcceptBookings FROM mechanics WHERE id = ?`).get(mechanicId);
  if (!mech) return res.status(404).json({ error: "Tamirci bulunamadı." });

  // Sahiplik İSTEMCİDEN DEĞİL oturumdan (yönetici başkası adına oluşturabilir).
  if (actor.role === "owner") body.ownerId = actor.id;
  else if (body.ownerId == null) return res.status(400).json({ error: "ownerId zorunludur." });

  /**
   * KARARI SUNUCU VERİYOR. İstemcinin gönderdiği `status` ve `autoAccepted` YOK SAYILIYOR —
   * reddetmek yerine yok saymanın sebebi geriye dönük uyumluluk: mevcut istemci bu alanları
   * gönderiyor ve isteği 400 ile reddetmek randevu almayı tamamen kırardı.
   */
  const auto = mech.autoAcceptBookings == null ? 1 : Number(mech.autoAcceptBookings);
  body.autoAccepted = auto ? 1 : 0;
  body.status = auto ? STATUS.QUEUED : STATUS.PENDING;
  // Para ve karşı tarafın kararları oluşturmada da istemciden gelmiyor.
  body.servicePrice = Number(body.servicePrice) > 0 ? Number(body.servicePrice) : 0;
  body.depositPaid = 0;
  body.depositRefunded = 0;
  body.noShow = 0;
  body.reviewed = 0;
  body.warrantyEndDate = null;
  // Tamircinin adı/görseli kayıt anındaki kopyalar — istemcinin yazdığına güvenmiyoruz.
  body.mechanicName = mech.name;
  body.mechanicImg = mech.img;

  const clean = onlyRealColumns(body);
  const cols = Object.keys(clean);
  if (cols.length === 0) return res.status(400).json({ error: "Kaydedilecek alan yok." });

  /**
   * SLOT KİLİDİ. `date` ve `time` serbest metin (ör. "4 Ocak" / "09:00") olduğu için veritabanı
   * düzeyinde UNIQUE indeks koymak mevcut verideki biçim çeşitliliğinde yanlış çakışmalar
   * üretebilirdi. Onun yerine kontrol tek bir işlem içinde: SQLite tek yazıcılı olduğu için
   * transaction sırası eşzamanlı isteklerde de garantili.
   * İptal/ret edilmiş randevular slotu MEŞGUL ETMİYOR — aksi halde bir kez iptal edilen saat
   * sonsuza kadar kapanırdı.
   */
  const BLOCKING = [STATUS.PENDING, STATUS.QUEUED, STATUS.DONE];
  let insert;
  try {
    // `prepare` ÖNCE try içinde: sözdizimi hatası burada oluşuyor ve 500 değil 400 dönmeli.
    insert = db.prepare(`INSERT INTO appointments (${cols.join(",")}) VALUES (${cols.map((c) => `@${c}`).join(",")})`);
  } catch (err) {
    console.error("[appointments] sorgu hazırlanamadı:", err?.message);
    return res.status(400).json({ error: "Randevu kaydedilemedi. Lütfen bilgileri kontrol edin." });
  }
  const createInTx = db.transaction(() => {
    if (clean.date && clean.time) {
      const taken = db.prepare(
        `SELECT id FROM appointments
         WHERE mechanicId = ? AND date = ? AND time = ? AND status IN (${BLOCKING.map(() => "?").join(",")})`
      ).get(mechanicId, clean.date, clean.time, ...BLOCKING);
      if (taken) return { conflict: true };
    }
    const info = insert.run(clean);
    return { created: db.prepare(`SELECT * FROM appointments WHERE id = ?`).get(info.lastInsertRowid) };
  });

  let result;
  try { result = createInTx(); }
  catch (err) {
    console.error("[appointments] oluşturma hatası:", err?.message);
    return res.status(400).json({ error: "Randevu kaydedilemedi. Lütfen bilgileri kontrol edin." });
  }
  if (result.conflict) {
    return res.status(409).json({ error: "Seçtiğiniz saat siz onaylamadan önce dolmuş. Lütfen başka bir saat seçin." });
  }
  res.status(201).json(hydrate("appointments", result.created));
});

/**
 * PATCH /api/appointments/:id — ALAN VE DURUM KONTROLLÜ GÜNCELLEME.
 */
appointmentsRouter.patch("/:id", (req, res) => {
  const existing = db.prepare(`SELECT * FROM appointments WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: "appointments not found" });

  const actor = resolveActor(req);
  if (!actor) return res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." });
  if (actor.role !== "admin" && !isParty(actor, existing)) {
    return res.status(403).json({ error: "Bu randevuyu değiştirme yetkiniz yok." });
  }

  const body = dehydrate("appointments", req.body || {});
  // Yönetici bu kısıtların dışında: moderasyon ve elle düzeltme için tam yetki (değişiklik
  // günlüğü ayrıca tutuluyor, bkz. routes/admin.js).
  if (actor.role !== "admin") {
    const allowed = actor.role === "owner" ? OWNER_WRITABLE : MECHANIC_WRITABLE;
    /**
     * İZİNSİZ ALANLAR SESSİZCE DÜŞÜRÜLMÜYOR, 403 ile REDDEDİLİYOR.
     * Sessizce düşürmek "kaydettim" yanılgısı üretir — kullanıcı bir değer girer, arayüz onu
     * gösterir, sunucu yok sayar ve yenilemede kaybolur. Denetimde bulunan hataların bir kısmı
     * tam olarak bu sınıftandı. Açık ret, hatanın nerede olduğunu söylüyor.
     */
    const rejected = Object.keys(body).filter((k) => !allowed.has(k));
    if (rejected.length > 0) {
      return res.status(403).json({
        error: "Bu alanları değiştirme yetkiniz yok.",
        fields: rejected,
      });
    }
    if ("status" in body) {
      const next = String(body.status);
      if (!ALL_STATUSES.has(next)) return res.status(400).json({ error: "Geçersiz randevu durumu." });
      const allowedNext = TRANSITIONS[actor.role]?.[existing.status];
      if (!allowedNext || !allowedNext.has(next)) {
        return res.status(409).json({
          error: `Bu geçiş yapılamaz: "${existing.status}" → "${next}".`,
        });
      }
    }
    if ("reviewed" in body) {
      // Yorum işareti yalnızca BİR YÖNE gidebilir. Geri alınabilirse aynı randevu için tekrar
      // tekrar yorum yazma yolu açılırdı.
      if (!(Number(body.reviewed) === 1 || body.reviewed === true)) {
        return res.status(400).json({ error: "Yorum işareti geri alınamaz." });
      }
    }
    if ("servicePrice" in body) {
      const p = Number(body.servicePrice);
      if (!Number.isFinite(p) || p < 0) return res.status(400).json({ error: "Geçerli bir tutar girin." });
      body.servicePrice = p;
    }
  }

  const clean = onlyRealColumns(body);
  const cols = Object.keys(clean);
  if (cols.length === 0) return res.json(hydrate("appointments", existing));
  try {
    db.prepare(`UPDATE appointments SET ${cols.map((c) => `${c} = @${c}`).join(",")} WHERE id = @__id`)
      .run({ ...clean, __id: existing.id });
  } catch (err) {
    console.error("[appointments] güncelleme hatası:", err?.message);
    return res.status(400).json({ error: "Randevu güncellenemedi." });
  }
  res.json(hydrate("appointments", db.prepare(`SELECT * FROM appointments WHERE id = ?`).get(existing.id)));
});

export default appointmentsRouter;
