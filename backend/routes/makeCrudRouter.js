import { Router } from "express";
import { asyncRoute } from "../utils/asyncRoute.js";
import { validateMediaBody, bodyCarriesMedia } from "../utils/mediaValidation.js";
import { makeRateLimiter } from "../utils/rateLimiter.js";
import { rateLimitKey } from "../utils/clientIp.js";
import { db } from "../db/db.js";
import { hydrate, hydrateAll, dehydrate } from "../db/hydrate.js";
import { hashPassword, resolveActor, destroyUserSessions } from "../utils/auth.js";

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
/**
 * YALNIZCA ADMIN'İN YAZABİLECEĞİ SÜTUNLAR.
 * ---------------------------------------------------------------------------------------------
 * GÜVENLİK AÇIĞI (bu denetimde bulundu — KİTLESEL ATAMA / MASS ASSIGNMENT):
 * PATCH gövdesindeki her alan doğrudan SQL UPDATE'e yazılıyordu. Sahiplik kontrolü "bu satır senin
 * mi" sorusunu cevaplıyor, ama "bu SÜTUNU değiştirmeye hakkın var mı" sorusunu kimse sormuyordu.
 * Somut sonuçlar:
 *   - Bir tamirci kendi satırına `verified: 1` yazıp sitede "doğrulanmış tamirci" rozetiyle
 *     görünebiliyordu. Oysa doğrulama, belge inceleyen yöneticinin verdiği bir güven işareti
 *     (bkz. admin paneli grantVerification) — kendi kendine verilebiliyorsa hiçbir anlamı kalmaz.
 *   - Yönetici tarafından ASKIYA ALINMIŞ bir kullanıcı kendi satırına `status: "active"` yazıp
 *     askıyı kaldırabiliyordu.
 *   - Sayaç/ölçüm sütunları (shareCount, vehicleCount, apptCount, avgResponseMinutes, distance)
 *     elle şişirilebiliyordu.
 * Bu sütunlar artık admin dışındaki hiç kimsenin yazmasına izin verilmeden gövdeden DÜŞÜRÜLÜYOR
 * (isteği reddetmiyoruz: aynı PATCH'in meşru alanları — ad, adres, telefon — işlenmeye devam etsin).
 *
 * DÜRÜST SINIR: rating/reviews/reviewList burada YOK, çünkü yorum bırakan araç sahibi bu üç alanı
 * meşru olarak yazıyor (bkz. sharedWrite). Yani puan hâlâ istemcinin hesapladığı bir değer; gerçek
 * çözümü yorumları ayrı bir tabloya taşıyıp puanı sunucuda hesaplamak, o ayrı bir iş.
 */
/**
 * HESAP-KRİTİK ALANLAR — genel profil güncellemesiyle DEĞİŞTİRİLEMEZ.
 * ---------------------------------------------------------------------------------------------
 * AÇIK (bu denetimde bulundu): e-posta, kullanıcının kendi PATCH'i ile serbestçe değiştirilebiliyordu.
 * Ama e-posta şifre sıfırlamanın gittiği adrestir: onu değiştirmek hesabın kalıcı kontrolünü
 * devretmektir. Yalnızca oturum token'ı olan biri (çalınmış bir token, ödünç alınmış bir cihaz)
 * e-postayı değiştirip gerçek sahibi hesabından kalıcı olarak dışarıda bırakabilirdi.
 * Bu alanlar artık yalnızca mevcut ŞİFRE sorulan özel uçlardan değişiyor:
 * POST /api/auth/change-email ve POST /api/auth/change-password.
 * Admin için de kapalı: yöneticinin kullanıcı e-postasını sessizce değiştirmesi, hesabı ele
 * geçirmesiyle aynı şey olurdu (şifre sıfırlama bağlantısı ona gider).
 */
const ACCOUNT_CRITICAL_FIELDS = {
  owners: ["email", "password"],
  mechanics: ["email", "password"],
};

const ADMIN_ONLY_FIELDS = {
  // reviewList/reviews/rating: yorum akışının TEK yazma yolu reviewsRouter (puanı sunucu hesaplar).
  // applicants: başvuruların tek yazma yolu jobApplicationsRouter. Genel PATCH'ten yazılabilseydi
  // tamirci kendi ilanındaki başvuruları topluca silebilir, aday da durumunu değiştirebilirdi.
  mechanics: ["verified", "verificationDocs", "shareCount", "avgResponseMinutes", "distance", "reviewList", "reviews", "rating"],
  job_listings: ["applicants"],
  owners: ["status", "vehicleCount", "apptCount"],
  listings: ["shareCount"],
  job_listings: ["shareCount"],
};

// Tablonun GERÇEK sütunları. Gövdeden gelen tanınmayan anahtarlar (yazım hatası, eski istemci,
// kasıtlı deneme, JSON'daki "__proto__" gibi tuhaf isimler) SQL'e hiç ulaşmadan eleniyor — aksi
// halde sorgu sözdizimi hatasıyla 500 dönüyordu.
const columnsOf = (table) => {
  try { return new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name)); }
  catch { return null; }
};

/**
 * MEDYA TAŞIYAN YAZMALARA HIZ SINIRI (performans denetiminde bulundu).
 * ------------------------------------------------------------------------------------------------
 * Boyut tavanı tek bir isteğin ne kadar veri yazabileceğini sınırlıyor; bu sınırlayıcı ise KAÇ
 * istek atılabileceğini. İkisi birlikte gerekli: tavan 2 MB olsa da dakikada 500 istek atan bir
 * betik hâlâ gigabaytlar yazabilir. Sınır YALNIZCA gövdesinde gömülü görsel olan yazmalara
 * uygulanıyor — sıradan profil/ilan düzenlemeleri (metin alanları) hiç etkilenmiyor, yani mevcut
 * kullanım deneyimi bozulmuyor.
 *
 * Dakikada 30: gerçek bir kullanıcı ilan verirken 15 galeri fotoğrafını tek istekte gönderiyor.
 * 30, meşru kullanımın çok üstünde; otomatik doldurmanın çok altında.
 */
const mediaWriteLimiter = makeRateLimiter({ maxAttempts: 30, lockoutMs: 10 * 60 * 1000, windowMs: 60 * 1000 });

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
  const tableColumns = columnsOf(table);
  const adminOnly = new Set(ADMIN_ONLY_FIELDS[table] || []);
  const accountCritical = new Set(ACCOUNT_CRITICAL_FIELDS[table] || []);
  // Gövdeyi yazmadan önce süz: önce bilinmeyen sütunlar, sonra (admin değilse) korumalı sütunlar.
  // mode: "patch" | "create". Hesap-kritik alan kısıtı yalnızca GÜNCELLEMEDE geçerli — hesap
  // OLUŞTURMA zaten kendi uç noktasında (POST /api/auth/register) ve orada e-posta şart.
  /**
   * GERÇEK HATA (otomatik güvenlik matrisinde bulundu): metin bir sütuna DİZİ ya da NESNE
   * gönderildiğinde (ör. `{"name": ["a","b"]}`) SQLite sürücüsü "yalnızca sayı, metin, bigint,
   * buffer ve null bağlanabilir" diye bir TypeError atıyordu. Bu kısıt hatası olmadığı için
   * yukarıdaki 400 dönüşümüne yakalanmıyor ve kullanıcıya 500 "Internal server error" gidiyordu.
   * Yani yanlış TÜRDE bir alan göndermek her CRUD ucunda sunucu hatası üretebiliyordu — kötü
   * deneyim (istemci "tekrar dene" der, hiç işe yaramaz) ve gereksiz bir gürültü kaynağı.
   *
   * JSON sütunları dehydrate() tarafından zaten metne çevrildiği için, bu aşamadan sonra kalan
   * her nesne/dizi değeri TANIM OLARAK geçersizdir. Sessizce düşürmüyoruz: kullanıcı gönderdiği
   * alanın kaydedildiğini sanmasın diye açıkça 400 dönüyoruz.
   */
  const unbindableKeys = (body) => Object.keys(body).filter((k) => {
    const v = body[k];
    return v !== null && typeof v === "object";
  });

  const sanitizeBody = (body, actor, mode = "patch") => {
    for (const key of Object.keys(body)) {
      if (tableColumns && !tableColumns.has(key)) { delete body[key]; continue; }
      // Hesap-kritik alanlar HERKESE kapalı (admin dahil): yalnızca şifre soran özel uçlardan.
      if (mode === "patch" && accountCritical.has(key)) { delete body[key]; continue; }
      if (adminOnly.has(key) && actor?.role !== "admin") delete body[key];
    }
    return body;
  };

  // GÜVENLİK DÜZELTMESİ (tam site denetiminde bulundu — ROLLER ARASI ID ÇAKIŞMASI / IDOR):
  // owners.id ve mechanics.id AYRI tablolarda, ayrı sayaçlarla üretiliyor — yani owner #7 ile
  // mechanic #7 tamamen farklı iki kişi. listings (sellerId) ve support_tickets (fromId) gibi
  // tablolarda ise HER İKİ rol de AYNI sütuna yazıyor, rolü ayıran bilgi ayrı bir sütunda
  // (sellerType / fromType) duruyor. Bu kontrol eskiden sadece `row[field] === actor.id`
  // karşılaştırıyordu, rolü hiç hesaba katmıyordu: sonuç olarak owner #7, mechanic #7'nin
  // ilanını düzenleyebiliyor/silebiliyor ve mechanic #7'nin destek taleplerini (kişisel şikâyet
  // metinleri dâhil) okuyabiliyordu — tersi de geçerliydi. Artık böyle tablolarda authScope'a
  // bir ayırt edici (typeField/typeValue) veriliyor ve sahiplik ancak HEM id HEM de tür
  // eşleşiyorsa kabul ediliyor.
  function matchingField(actor, row) {
    return scopeFields.find((f) => (
      f.role === actor?.role
      && row[f.field] === actor.id
      && (!f.typeField || row[f.typeField] === f.typeValue)
    ));
  }

  function isSharedWrite(actor, bodyKeys) {
    if (sharedWriteFields.size === 0) return false;
    if (!sharedWriteRoles.has(actor?.role)) return false;
    if (bodyKeys.length === 0) return false;
    return bodyKeys.every((k) => sharedWriteFields.has(k));
  }

  /**
   * SAYFALAMA ve ÜST SINIR.
   * ---------------------------------------------------------------------------------------------
   * BULUNAN SORUN (otomatik denetim): liste uçları tablonun TAMAMINI döndürüyordu ve okuma
   * tarafında hiçbir sınır yoktu. Bugün zararsız (10 tamirci = 15 KB) ama ölçek büyüdüğünde
   * tek bir GET 15 MB'a çıkar ve bunu saniyede onlarca kez istemek serbesttir — hem bant
   * genişliği hem bellek açısından bedava bir yük bindirme yolu.
   *
   * NEDEN SESSİZCE KESMİYORUZ: bir listeyi habersiz kırpmak "veri kayboldu" sınıfı hataların
   * kaynağıdır — istemci 500 kaydın 500'ünü aldığını sanır. Bu yüzden:
   *   - `?limit` / `?offset` ile sayfalama İSTEĞE BAĞLI (mevcut istemci hiç değişmiyor),
   *   - varsayılan davranış bugünküyle aynı kalacak kadar yüksek bir GÜVENLİK TAVANI var,
   *   - her yanıtta `X-Total-Count` başlığı dönüyor; kırpılma olduysa GÖRÜLEBİLİR.
   * Okuma tarafındaki istek sayısı sınırı dağıtım katmanının işi (bkz. el kitabı TRUST_PROXY):
   * uygulama içinde IP başına okuma sınırı koymak, vekil arkasında tüm kullanıcıları tek sayaca
   * düşürüp siteyi herkese kapatma riskini doğuruyor.
   */
  const MAX_PAGE = 1000;
  const pageOf = (req) => {
    const limitRaw = Number(req.query?.limit);
    const offsetRaw = Number(req.query?.offset);
    const limit = Number.isInteger(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, MAX_PAGE) : MAX_PAGE;
    const offset = Number.isInteger(offsetRaw) && offsetRaw > 0 ? offsetRaw : 0;
    return { limit, offset };
  };
  const sendList = (res, req, rows, total, mapper) => {
    res.set("X-Total-Count", String(total));
    res.json(rows.map(mapper));
  };

  router.get("/", (req, res) => {
    const { limit, offset } = pageOf(req);
    if (!authScope || publicRead) {
      const total = db.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n;
      const rows = db.prepare(`SELECT * FROM ${table} LIMIT ? OFFSET ?`).all(limit, offset);
      /**
       * YÖNETİCİ TOPLU LİSTEDE DE TAM KAYDI GÖRÜR.
       * Önceden bu dal aktöre hiç bakmıyordu: herkese açık okuma varsa liste HER ZAMAN
       * filtrelenmiş dönüyordu. Yönetici panelinin okuduğu alanlar (ör. doğrulama belgeleri)
       * bu yüzden ya listede yoktu ya da — daha kötüsü — listeden gizlenmesin diye hiç
       * gizlenmiyordu. İkisi de yanlış: filtre herkese açık okuma İÇİN var, yönetici için değil.
       */
      const viewer = resolveActor(req);
      res.set("X-Total-Count", String(total));
      return res.json(viewer?.role === "admin" ? rows.map((r) => hydrate(table, r)) : hydrateAll(table, rows));
    }
    const actor = resolveActor(req);
    if (!actor) return res.status(401).json({ error: "Bu veriye erişmek için giriş yapmanız gerekiyor." });
    if (actor.role === "admin") {
      const total = db.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n;
      res.set("X-Total-Count", String(total));
      return res.json(hydrateAll(table, db.prepare(`SELECT * FROM ${table} LIMIT ? OFFSET ?`).all(limit, offset)));
    }
    const myFields = scopeFields.filter((f) => f.role === actor.role);
    if (myFields.length === 0) return res.json([]);
    // Roller arası id çakışması (bkz. matchingField yorumu): tür ayırt edicisi tanımlıysa liste
    // sorgusu da hem id'yi hem türü şart koşuyor — aksi halde owner #7, mechanic #7'nin
    // kayıtlarını listede görmeye devam ederdi.
    const where = myFields.map((f) => (f.typeField ? `(${f.field} = ? AND ${f.typeField} = ?)` : `${f.field} = ?`)).join(" OR ");
    const params = myFields.flatMap((f) => (f.typeField ? [actor.id, f.typeValue] : [actor.id]));
    const total = db.prepare(`SELECT COUNT(*) n FROM ${table} WHERE ${where}`).get(...params).n;
    const rows = db.prepare(`SELECT * FROM ${table} WHERE ${where} LIMIT ? OFFSET ?`).all(...params, limit, offset);
    res.set("X-Total-Count", String(total));
    res.json(hydrateAll(table, rows));
  });

  router.get("/:id", (req, res) => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: `${table} not found` });
    const actor = resolveActor(req);
    if (authScope && !publicRead) {
      if (!actor) return res.status(401).json({ error: "Bu veriye erişmek için giriş yapmanız gerekiyor." });
      if (actor.role !== "admin" && !matchingField(actor, row)) {
        return res.status(403).json({ error: "Bu kayda erişim yetkiniz yok." });
      }
    }
    // GÜVENLİK DÜZELTMESİ: hydrate.js'teki LIST_ONLY_SENSITIVE_FIELDS (mechanics için iban/
    // bankName/accountHolder) daha önce sadece TOPLU liste (GET /) ve /:id/share uç noktasında
    // filtreleniyordu — bu TEKİL GET /:id uç noktası ham hydrate() kullanıyordu, yani publicRead
    // açık kaynaklarda (mechanics gibi, girişsiz kimse erişebilir) herkes tek bir ID bilerek bu
    // uç noktadan tamircinin banka bilgilerini çekebiliyordu (toplu listeden kapatılan sızıntının
    // aynısı, ID bilinerek tek tek yeniden açılıyordu). Artık gerçek oturum sistemi var (bkz.
    // resolveActor) — bu hassas alanlar sadece kaydın SAHİBİNE ya da admin'e gösteriliyor,
    // başkasına (girişsiz ya da farklı bir kullanıcıya) her zaman toplu-liste seviyesinde
    // filtrelenmiş hâliyle dönüyor.
    const isSelfOrAdmin = !!actor && (actor.role === "admin" || !!matchingField(actor, row));
    res.json(isSelfOrAdmin ? hydrate(table, row) : hydrateAll(table, [row])[0]);
  });

  router.post("/", (req, res) => {
    let actor = null;
    if (authScope) {
      actor = resolveActor(req);
      if (!actor || (actor.role !== "admin" && !scopeFields.some((f) => f.role === actor.role))) {
        return res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." });
      }
    }
    const body = sanitizeBody(dehydrate(table, req.body), actor, "create");
    // GÜVENLİK: password bu genel (mass-assignment'a açık) yazma yolundan asla kabul edilmiyor —
    // yalnızca aşağıdaki özel /:id/set-password uç noktasından değiştirilebilir (bkz. o uç
    // noktanın yorumu). passwordVerify açık olmayan tablolarda (yani şifre sütunu olmayanlarda)
    // bu satırın hiçbir etkisi yok.
    if (passwordVerify) delete body.password;
    // Sahiplik alanı İSTEMCİDEN DEĞİL oturumdan geliyor — client `ownerId: 9999` gönderse bile
    // (başka bir kullanıcı adına kayıt oluşturmaya çalışsa bile) yok sayılır.
    if (actor && actor.role !== "admin") {
      // Tür ayırt edicisi de (sellerType/fromType) istemciden DEĞİL oturumdan yazılıyor — böylece
      // bir owner, kendini "sellerType: mechanic" gösteren bir ilan oluşturup yukarıdaki sahiplik
      // kontrolünü baştan yanıltamaz (bkz. matchingField yorumu).
      for (const f of scopeFields) {
        if (f.role !== actor.role) continue;
        body[f.field] = actor.id;
        if (f.typeField) body[f.typeField] = f.typeValue;
      }
    }
    /**
     * MEDYA DOĞRULAMASI — tür + boyut. Mevcut geçerli biçimler (emoji, https adresi) kabul
     * edilmeye devam ediyor; yalnızca zararlı (SVG) ya da aşırı büyük data URI reddediliyor.
     */
    const mediaErr = validateMediaBody(table, body);
    if (mediaErr) return res.status(400).json({ error: mediaErr });
    if (bodyCarriesMedia(table, body)) {
      const key = rateLimitKey(req);
      if (mediaWriteLimiter.check(key).blocked) {
        return res.status(429).json({ error: "Çok fazla görsel yüklemesi. Lütfen birkaç dakika sonra tekrar deneyin." });
      }
      mediaWriteLimiter.registerFailure(key);
    }
    const badTypes = unbindableKeys(body);
    if (badTypes.length) return res.status(400).json({ error: "Geçersiz alan değeri gönderildi.", fields: badTypes });
    const cols = Object.keys(body);
    if (cols.length === 0) return res.status(400).json({ error: "Kaydedilecek alan yok." });
    /**
     * GERÇEK HATA (uçtan uca denetimde bulundu): zorunlu bir sütun eksik gönderildiğinde SQLite
     * kısıt hatası fırlatıyor, genel hata yakalayıcı da bunu 500 "Internal server error" olarak
     * döndürüyordu. Kullanıcı hatası (eksik alan) sunucu hatası gibi görünüyordu: istemci "tekrar
     * dene" diyor, tekrar denemek hiçbir zaman işe yaramıyordu. Kısıt hataları artık 400 ve
     * ANLAŞILIR bir mesapla dönüyor — ama mesajda sütun adı/SQL detayı verilmiyor (iç yapıyı
     * sızdırmamak için).
     */
    let info;
    try {
      info = db.prepare(`INSERT INTO ${table} (${cols.join(",")}) VALUES (${cols.map((c) => `@${c}`).join(",")})`).run(body);
    } catch (err) {
      const msg = String(err?.message || "");
      if (/NOT NULL|UNIQUE|CHECK|FOREIGN KEY|constraint/i.test(msg)) {
        return res.status(400).json({
          error: /UNIQUE/i.test(msg) ? "Bu kayıt zaten var." : "Zorunlu alanlar eksik ya da geçersiz.",
        });
      }
      throw err;
    }
    const created = db.prepare(`SELECT * FROM ${table} WHERE rowid = ?`).get(info.lastInsertRowid);
    res.status(201).json(hydrate(table, created));
  });

  router.patch("/:id", (req, res) => {
    const existing = db.prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: `${table} not found` });
    const rawBody = dehydrate(table, req.body);
    // Korumalı sütunlar yetki kontrolünden ÖNCE düşürülüyor: aksi halde bir tamircinin
    // `{verified: 1}` PATCH'i sharedWrite/self kontrolünü geçip yazılabilirdi.
    const actorForBody = authScope ? resolveActor(req) : null;
    const body = sanitizeBody(rawBody, actorForBody);
    if (authScope) {
      const actor = actorForBody;
      if (!actor) return res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." });
      if (actor.role !== "admin" && !matchingField(actor, existing) && !isSharedWrite(actor, Object.keys(body))) {
        return res.status(403).json({ error: "Bu kaydı değiştirme yetkiniz yok." });
      }
    }
    if (passwordVerify) delete body.password;
    if (authScope) for (const f of scopeFields) delete body[f.field]; // sahiplik alanı PATCH ile devredilemez
    const mediaPatchErr = validateMediaBody(table, body);
    if (mediaPatchErr) return res.status(400).json({ error: mediaPatchErr });
    if (bodyCarriesMedia(table, body)) {
      const key = rateLimitKey(req);
      if (mediaWriteLimiter.check(key).blocked) {
        return res.status(429).json({ error: "Çok fazla görsel yüklemesi. Lütfen birkaç dakika sonra tekrar deneyin." });
      }
      mediaWriteLimiter.registerFailure(key);
    }
    const badPatchTypes = unbindableKeys(body);
    if (badPatchTypes.length) return res.status(400).json({ error: "Geçersiz alan değeri gönderildi.", fields: badPatchTypes });
    const cols = Object.keys(body).filter((c) => c !== idColumn);
    if (cols.length === 0) return res.json(hydrate(table, existing));
    try {
      db.prepare(`UPDATE ${table} SET ${cols.map((c) => `${c} = @${c}`).join(",")} WHERE ${idColumn} = @__id`)
        .run({ ...body, __id: req.params.id });
    } catch (err) {
      const msg = String(err?.message || "");
      if (/NOT NULL|UNIQUE|CHECK|FOREIGN KEY|constraint/i.test(msg)) {
        return res.status(400).json({ error: /UNIQUE/i.test(msg) ? "Bu değer zaten kullanılıyor." : "Geçersiz değer." });
      }
      throw err;
    }
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
    /**
     * GÜVENLİK DÜZELTMESİ (bu denetimde bulundu) — İKİ GERÇEK AÇIK kapatıldı.
     * -------------------------------------------------------------------------------------------
     * 1) `/:id/verify-password` KALDIRILDI. Uygulama onu artık hiç çağırmıyordu (şifre değişimi
     *    `POST /api/auth/change-password` üzerinden yapılıyor) ama uç açık duruyordu ve hız
     *    sınırı YOKTU: çalınmış bir oturum token'ı, hesabın DÜZ METİN şifresini deneme-yanılma
     *    ile bulabileceği bir "doğru mu?" kâhinine dönüşüyordu. Oturum token'ı normalde şifreyi
     *    ele vermez; bu uç veriyordu — üstelik insanlar şifrelerini başka sitelerde de kullanıyor.
     *
     * 2) `/:id/set-password` artık SADECE ADMIN. Önceden "kendisi ya da admin" idi; yani çalınmış
     *    bir token, MEVCUT ŞİFREYİ BİLMEDEN yeni şifre koyabiliyor ve gerçek sahibi hesabından
     *    kalıcı olarak kilitleyebiliyordu. Bu, `/api/auth/change-password` için özellikle konmuş
     *    iki korumayı (mevcut şifre zorunlu + diğer oturumları kapat) tamamen bypass ediyordu.
     *    Kullanıcının kendi şifresini değiştirme yolu tektir ve orasıdır.
     *
     * Admin sıfırlaması artık hedefin TÜM oturumlarını da kapatıyor: şifre sıfırlanmasının sebebi
     * genelde "hesap ele geçirildi"dir; saldırganın token'ı ayakta kalırsa sıfırlama işe yaramaz.
     */
    router.post("/:id/set-password", asyncRoute(async (req, res) => {
      const actor = resolveActor(req);
      if (!actor) return res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." });
      if (actor.role !== "admin") {
        return res.status(403).json({ error: "Kendi şifrenizi hesap ayarlarından değiştirebilirsiniz." });
      }
      const { password } = req.body || {};
      if (typeof password !== "string" || password.length < 6) {
        return res.status(400).json({ error: "Şifre en az 6 karakter olmalı." });
      }
      const existing = db.prepare(`SELECT ${idColumn} FROM ${table} WHERE ${idColumn} = ?`).get(req.params.id);
      if (!existing) return res.status(404).json({ error: `${table} not found` });
      const hashed = await hashPassword(password);
      db.prepare(`UPDATE ${table} SET password = ? WHERE ${idColumn} = ?`).run(hashed, req.params.id);
      const closed = destroyUserSessions(existing[idColumn], table === "owners" ? "owner" : "mechanic");
      res.json({ ok: true, sessionsClosed: closed });
    }));
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
