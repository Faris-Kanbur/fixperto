import { Router } from "express";
import { db } from "../db/db.js";
import { hydrate, dehydrate } from "../db/hydrate.js";
import { resolveActor, makeRateLimiter } from "../utils/auth.js";
import { rateLimitKey } from "../utils/clientIp.js";

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
 * GET hâlâ jenerik CRUD'da (orada sahiplik kontrolü doğru ve yeterli). DELETE ise AŞAĞIDA, bu
 * dosyada — başlangıçta jenerik CRUD'daydı, ayrı bir denetimde durum-makinesi bypass'ı olarak
 * bulunup buraya taşındı (bkz. aşağıdaki DELETE handler'ının üstündeki not).
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
  "date", "time", "dateISO",      // yeniden planlama — dateISO neden burada: aşağıdaki not
  "reviewed",          // yorumunu yazdığında işaretlenir (yalnızca false→true, aşağıda)
]);
/**
 * `dateISO` NEDEN AYRICA YAZILABİLİR (randevu fonksiyonlarının tam denetiminde bulundu):
 * `date`/`time` kullanıcıya gösterilen serbest metin ("26 Eylül" / "14:00"); `dateISO` ise gerçek,
 * sıralanabilir tarih — takvime ekleme (.ics indirme), tamirci analiz sekmesindeki tarih aralığı
 * süzgeci VE doğrulanmış servis geçmişindeki `serviceDate` (bkz. routes/vehicleHistory.js) hep
 * bunu okuyor. `dateISO` bu beyaz listede YOKKEN yeniden planlama yalnızca `date`/`time`'ı
 * gönderiyordu — kayıt veritabanında YENİ günü gösteriyordu ama `dateISO` hep İLK rezervasyonun
 * tarihinde donuk kalıyordu. Somut sonucu: rastgele bir güne ertelenmiş bir randevunun .ics dosyası
 * hâlâ ESKİ günü indiriyor (kullanıcı yanlış günde takvim hatırlatması alıyor), tamamlanınca
 * yazılan servis geçmişi kaydı de ESKİ tarihi taşıyordu — bu uygulamanın "en güçlü güven sinyali"
 * olarak tanımlanan alanda (bkz. vehicleHistory.js) yanlış tarih. `date`/`time` zaten ikisi de
 * yazılabilir ve kendileri de doğrulanmadan (serbest metin) kabul ediliyor; `dateISO`'yu aynı
 * güvenle aynı role açmak yeni bir yetki açmıyor, yalnızca üç ayrı yerdeki tutarsızlığı kapatıyor.
 */
const MECHANIC_WRITABLE = new Set([
  // Tamircinin kendi kararları: işi kabul etmek, reddetmek, tamamlamak, gelmediğini bildirmek,
  // bedeli ve garantiyi belirlemek. Bedel tamircinin işi — müşterinin değil.
  "status", "servicePrice", "noShow", "warrantyEndDate", "date", "time", "dateISO",
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

/**
 * Randevu durumları ve GEÇERLİ geçişler. Kaynak: ön yüzdeki gerçek akış (accept/reject/complete).
 *
 * GERÇEK HATA (tam site QA denetiminde, uçtan uca canlı testte bulundu — bkz. el kitabı 22.7):
 * bu liste "Tamire Alındı" (ara durum, tamirci işe başladığında) ara durumunu HİÇ İÇERMİYORDU ve
 * DONE değeri ön yüzün gerçekten gönderdiği "Tamir Tamamlandı" yerine "Tamamlandı" idi (frontend/
 * data/constants.ts TRACK_STATUSES_AUTO ile burası BAĞIMSIZ yazılmış, iki taraf hiç eşleşmemiş).
 * Ölçülen sonuç: mechanic panelindeki "Tamire Al" ve "Tamamlandı (SMS gönderilir)" düğmeleri
 * gönderdiği PATCH'in İKİSİ DE `400 "Geçersiz randevu durumu"` ile reddediliyordu — sessizce,
 * çünkü ön yüz PATCH'i `persist()` ile ateşliyor ama başarısızlıkta iyimser (optimistic) yerel
 * durumu GERİ ALMIYOR: ekranda randevu "Tamamlandı" görünüyor, SMS simülasyonu bile çalışıyor,
 * ama veritabanındaki gerçek durum hiç değişmiyordu. Sayfa yenilenince randevu sessizce "Sırada"ya
 * dönüyordu. Bunun ikincil etkileri: vehicle-history kaydı (STATUS.DONE'a bakıyor) ve yorum yazma
 * hakkı (reviews.js, aynı sütuna bakıyor) da bu yüzden HİÇBİR ZAMAN gerçek bir randevu üzerinden
 * çalışamıyordu — ikisi de "yalnızca tamamlanmış randevular" derken sunucuda hiçbir randevu asla
 * o durumu gerçekten göremiyordu. `IN_REPAIR` eklendi, `DONE` ön yüzün gönderdiği değerle eşitlendi.
 */
const STATUS = {
  PENDING: "Onay Bekliyor",
  QUEUED: "Sırada",
  IN_REPAIR: "Tamire Alındı",
  DONE: "Tamir Tamamlandı",
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
    [STATUS.QUEUED]: new Set([STATUS.IN_REPAIR, STATUS.DONE, STATUS.NO_SHOW, STATUS.CANCELLED, STATUS.REJECTED]),
    // Ön yüzün gerçek akışı: "Tamire Al" → Tamire Alındı, sonra "Tamamlandı (SMS gönderilir)" →
    // Tamir Tamamlandı (bkz. AppShell.tsx satır ~3393). Bu ara adım hiç tanımlı değildi.
    [STATUS.IN_REPAIR]: new Set([STATUS.DONE]),
  },
};

const isParty = (actor, row) => (
  (actor?.role === "owner" && row.ownerId === actor.id)
  || (actor?.role === "mechanic" && row.mechanicId === actor.id)
);

/**
 * SLOT KİLİDİNİN KAPSADIĞI DURUMLAR — modül düzeyinde, POST ve PATCH'in İKİSİ de kullanıyor.
 * İptal/ret edilmiş randevular slotu MEŞGUL ETMİYOR — aksi halde bir kez iptal edilen saat
 * sonsuza kadar kapanırdı.
 */
const BLOCKING_STATUSES = [STATUS.PENDING, STATUS.QUEUED, STATUS.DONE];

/**
 * RANDEVU OLUŞTURMADA HIZ SINIRI — bu turda, bu dosyada başka hiç yoktu (denetimde bulundu).
 * ------------------------------------------------------------------------------------------------
 * Randevu satırı ücretsiz ve tek doğrulaması "geçerli bir tamirci + giriş yapmış bir hesap".
 * Sınırsız haldeyken kimliği doğrulanmış tek bir hesap:
 *   - bir tamircinin TÜM boş saatlerini otomatik olarak doldurup (her slota bir sahte randevu)
 *     hiçbir gerçek müşterinin randevu alamamasına yol açabilirdi (iş kesintisi — kullanıcılara
 *     zarar veren, parayla değil zamanla ölçülen bir DoS),
 *   - ya da basitçe binlerce çöp randevu üretip tamircinin panelini kullanılamaz hale getirebilirdi.
 * Gerçek bir müşteri bir oturumda birkaç randevu alır, onlarca değil.
 */
const CREATE_MAX = Number(process.env.APPOINTMENT_CREATE_LIMIT_PER_WINDOW) > 0 ? Number(process.env.APPOINTMENT_CREATE_LIMIT_PER_WINDOW) : 15;
const createLimiter = makeRateLimiter({ maxAttempts: CREATE_MAX, lockoutMs: 10 * 60 * 1000, windowMs: 10 * 60 * 1000 });

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
  if (actor.role !== "admin") {
    const key = rateLimitKey(req);
    if (createLimiter.check(key).blocked) {
      return res.status(429).json({ error: "Çok fazla randevu isteği. Lütfen birkaç dakika sonra tekrar deneyin." });
    }
    createLimiter.registerFailure(key);
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

  /**
   * ====== RANDEVU ↔ ARAÇ: ARTIK GERÇEK BİR BAĞ (ilişki denetiminde bulundu) ======
   * ---------------------------------------------------------------------------------------------
   * Randevuda aracı gösteren tek alan `vehicle` METNİ idi ("VW Golf · 34ABC01"). Yani hangi araç
   * kaydının servise girdiği veritabanında yazmıyordu — bkz. db.js'deki sütun yorumu. En somut
   * bedeli: doğrulanmış servis geçmişi (`vehicle_history`) VIN'i randevudan çözemiyor, randevu
   * METNİNİN İÇİNDE plaka arıyordu (`apptText.includes(v.plate)`).
   *
   * Artık `vehicleId` saklanıyor ve İKİ şey doğrulanıyor:
   *   1) araç gerçekten var,
   *   2) araç randevuyu açan kişiye ait — aksi halde biri başkasının aracı için randevu alıp o
   *      aracın kaydını (ve dolaylı olarak servis geçmişi zincirini) kendi işine bağlayabilirdi.
   * `vehicleId` GÖNDERİLMEZSE eski davranış aynen sürüyor (metin alanı yeterli): mevcut istemciyi
   * kırmamak için zorunlu KILINMADI, ama gönderildiğinde artık anlamı olan bir bağ.
   */
  if (body.vehicleId != null && body.vehicleId !== "") {
    const veh = db.prepare(`SELECT id, ownerId FROM vehicles WHERE id = ?`).get(body.vehicleId);
    if (!veh) return res.status(400).json({ error: "Seçilen araç bulunamadı." });
    if (actor.role !== "admin" && veh.ownerId !== body.ownerId) {
      return res.status(403).json({ error: "Bu araç size ait değil." });
    }
    body.vehicleId = veh.id;
  }

  const clean = onlyRealColumns(body);
  const cols = Object.keys(clean);
  if (cols.length === 0) return res.status(400).json({ error: "Kaydedilecek alan yok." });

  /**
   * SLOT KİLİDİ. `date` ve `time` serbest metin (ör. "4 Ocak" / "09:00") olduğu için veritabanı
   * düzeyinde UNIQUE indeks koymak mevcut verideki biçim çeşitliliğinde yanlış çakışmalar
   * üretebilirdi. Onun yerine kontrol tek bir işlem içinde: SQLite tek yazıcılı olduğu için
   * transaction sırası eşzamanlı isteklerde de garantili. (Durum listesi modül düzeyinde,
   * bkz. BLOCKING_STATUSES — PATCH/yeniden planlama da AYNI kilidi kullanıyor, aşağıya bakın.)
   */
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
         WHERE mechanicId = ? AND date = ? AND time = ? AND status IN (${BLOCKING_STATUSES.map(() => "?").join(",")})`
      ).get(mechanicId, clean.date, clean.time, ...BLOCKING_STATUSES);
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

  /**
   * SLOT KİLİDİ — YENİDEN PLANLAMADA DA (bu turda, kullanıcının "randevu alma akışını en ince
   * ayrıntısına kadar incele" isteğiyle canlıda ölçülerek bulundu).
   * -----------------------------------------------------------------------------------------
   * GERÇEK AÇIK: POST /api/appointments'taki slot kilidi (bkz. yukarısı, BLOCKING_STATUSES) yalnızca
   * randevu OLUŞTURULURKEN çalışıyordu. Hem OWNER_WRITABLE hem MECHANIC_WRITABLE `date`/`time`
   * içeriyor (yeniden planlama, bkz. AppShell.tsx confirmReschedule) ama bu PATCH yolunda AYNI
   * kontrol hiç yoktu. Ölçüldü: iki farklı araç sahibi, aynı tamirciye, aynı tarih+saate randevu
   * aldı (POST bunu doğru şekilde REDDETTİ — 409), ama SONRA ikinci randevuyu BİRİNCİNİN saatine
   * "yeniden planlama" ile taşımak sorunsuz 200 döndü ve veritabanında AYNI tamirci + AYNI tarih +
   * AYNI saatte İKİ randevu (ikisi de "Sırada") oluştu — tam olarak POST'un engellemek için var
   * olduğu durum, farklı bir HTTP yoluyla dolaşıldı (bkz. DELETE'teki aynı sınıf bulgunun yorumu:
   * "bir kaydı koruyan kural TEK BİR YAZMA YOLUNA konursa, diğer yollar sessiz bir bypass olur").
   * Düzeltme: `date`/`time` gerçekten DEĞİŞİYORSA aynı kilit burada da (aynı transaction içinde,
   * eşzamanlı isteklere karşı) çalıştırılıyor; kendi satırı (`id != ?`) hariç tutuluyor.
   */
  const nextDate = "date" in clean ? clean.date : existing.date;
  const nextTime = "time" in clean ? clean.time : existing.time;
  const dateOrTimeChanging = ("date" in clean && clean.date !== existing.date) || ("time" in clean && clean.time !== existing.time);

  try {
    const updateInTx = db.transaction(() => {
      if (dateOrTimeChanging && nextDate && nextTime) {
        const taken = db.prepare(
          `SELECT id FROM appointments
           WHERE mechanicId = ? AND date = ? AND time = ? AND status IN (${BLOCKING_STATUSES.map(() => "?").join(",")}) AND id != ?`
        ).get(existing.mechanicId, nextDate, nextTime, ...BLOCKING_STATUSES, existing.id);
        if (taken) return { conflict: true };
      }
      db.prepare(`UPDATE appointments SET ${cols.map((c) => `${c} = @${c}`).join(",")} WHERE id = @__id`)
        .run({ ...clean, __id: existing.id });
      return { ok: true };
    });
    const result = updateInTx();
    if (result.conflict) {
      return res.status(409).json({ error: "Seçtiğiniz saat dolu. Lütfen başka bir saat seçin." });
    }
  } catch (err) {
    console.error("[appointments] güncelleme hatası:", err?.message);
    return res.status(400).json({ error: "Randevu güncellenemedi." });
  }
  res.json(hydrate("appointments", db.prepare(`SELECT * FROM appointments WHERE id = ?`).get(existing.id)));
});

/**
 * DELETE /api/appointments/:id — İKİNCİ DENETİMDE BULUNAN AÇIK.
 * ================================================================================================
 * Bu router PATCH'e bir durum makinesi koyuyor: müşteri "Tamamlandı" bir randevuyu iptal EDEMİYOR
 * (409 alıyor). Ama DELETE bu router'da HİÇ YOKTU — istek arkadaki jenerik CRUD router'ına düşüyor
 * ve orada tek kontrol "bu satır senin mi" idi. Sonuç ÖLÇÜLDÜ:
 *
 *   PATCH {status:"İptal Edildi"}  → 409  "Bu geçiş yapılamaz: Tamamlandı → İptal Edildi."
 *   DELETE (aynı randevu, aynı kullanıcı) → 204, KAYIT SİLİNDİ.
 *
 * Yani durum makinesinin koruduğu her şey, tek bir farklı HTTP metoduyla dolaşılabiliyordu:
 *   - tamircinin TAMAMLANMIŞ iş ve ciro kaydı müşteri tarafından tek taraflı yok edilebiliyordu,
 *   - "Gelmedi" damgası (ölçüldü: o da 204 ile silindi) müşteri tarafından temizlenebiliyordu —
 *     yani randevuya gelmeyen kullanıcı kendi sicilini siliyordu,
 *   - tamamlanmış randevu aynı zamanda yorum yazma ve doğrulanmış servis geçmişi hakkının ön
 *     koşulu; kaydı silmek bağlı yorumu sahipsiz bırakıyordu.
 *
 * DERS (bu denetimin ana bulgusu): bir kaydı koruyan kural TEK BİR YAZMA YOLUNA konursa, o kayda
 * dokunan DİĞER yolların hepsi sessiz bir bypass olur. Kural kaydın kendisine ait olmalı.
 *
 * POLİTİKA: "Tamamlandı" ve "Gelmedi" birer İŞLETME KAYDI — taraflar silemez, yalnızca yönetici
 * (moderasyon, değişiklik günlüğüne yazılıyor). Diğer durumlar (Onay Bekliyor, Sırada, Reddedildi,
 * İptal Edildi) kendi listesini temizlemek isteyen taraf için silinebilir kalıyor.
 */
const UNDELETABLE = new Set([STATUS.DONE, STATUS.NO_SHOW]);

appointmentsRouter.delete("/:id", (req, res) => {
  const existing = db.prepare(`SELECT * FROM appointments WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: "appointments not found" });

  const actor = resolveActor(req);
  if (!actor) return res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." });
  if (actor.role !== "admin" && !isParty(actor, existing)) {
    return res.status(403).json({ error: "Bu randevuyu silme yetkiniz yok." });
  }
  if (actor.role !== "admin" && UNDELETABLE.has(existing.status)) {
    return res.status(409).json({
      error: `"${existing.status}" durumundaki bir randevu silinemez — bu kayıt her iki tarafın işlem geçmişidir.`,
    });
  }
  db.prepare(`DELETE FROM appointments WHERE id = ?`).run(existing.id);
  res.status(204).end();
});

export { STATUS as APPOINTMENT_STATUS };
export default appointmentsRouter;
