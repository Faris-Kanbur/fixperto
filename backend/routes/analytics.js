import { Router } from "express";
import { db } from "../db/db.js";
import { makeRateLimiter, resolveActor } from "../utils/auth.js";

/**
 * ANALİTİK UÇLARI
 *
 * POST /api/analytics/events  → herkese açık (misafir de olay gönderir), hız sınırlı
 * GET  /api/analytics/*       → SADECE ADMIN. Toplu davranış verisi rekabet açısından hassastır
 *                                (hangi şehirde talep var, hangi tamirci ne kadar dönüştürüyor);
 *                                tamirciye kendi verisi ileride ayrı ve KENDİ id'siyle sınırlı bir
 *                                uçtan verilecek, bu uçlar platformun tamamını gördüğü için admin'e
 *                                kapalı kalmalı.
 *
 * GİZLİLİK: burada req.ip'ye SADECE hız sınırlama için bakılıyor; hiçbir sorguda saklanmıyor.
 */
const router = Router();

// Olayların yazılabilir olması gerekiyor ama bu uç kimlik doğrulaması istemiyor — bir betiğin
// veritabanını şişirmesini engellemek için IP başına dakikada makul bir tavan koyuyoruz.
// (Aynı desen: routes/auth.js login limiti, routes/profileViews.js bulk limiti.)
const eventLimiter = makeRateLimiter({ maxAttempts: 300, lockoutMs: 60 * 1000 });

// Sadece tanıdığımız olay adları kabul ediliyor. Serbest bırakılsaydı hem tablo çöple dolardı hem
// de panel sorguları anlamsız isimlerle kirlenirdi.
const ALLOWED_EVENTS = new Set([
  "page_view",            // herhangi bir ekranın açılması (ziyaret sayısının temeli)
  "session_start",        // yeni oturum (tekil ziyaretçi/oturum sayımı)
  "search_performed",     // arama yapıldı (meta: mode, query, city, service, resultCount)
  "search_zero_result",   // arama 0 sonuç döndü (ARZ AÇIĞI sinyali)
  "filter_applied",       // filtre kullanıldı (meta: mode, filterCount)
  "mechanic_view",        // tamirci profili görüntülendi
  "listing_view",         // araç ilanı görüntülendi
  "job_view",             // iş ilanı görüntülendi
  "contact_started",      // mesaj kutusu/sohbet açıldı
  "message_sent",         // mesaj gönderildi
  "quote_requested",      // çoklu fiyat teklifi istendi
  "offer_made",           // araca teklif verildi
  "appointment_started",  // randevu ekranına girildi
  "appointment_booked",   // randevu oluşturuldu
  "listing_created",      // ilan verildi
  "job_applied",          // iş ilanına başvuruldu
  "signup",               // kayıt olundu
  "login",                // giriş yapıldı
  "favorite_added",       // favoriye eklendi
  "compare_used",         // karşılaştırma açıldı
  "saved_search_created",  // arama kaydedildi
]);

const MAX_STR = 120;
const clip = (v) => (v == null ? null : String(v).slice(0, MAX_STR));

// meta içine kişisel veri sızmasın diye: yalnızca izin verilen anahtarlar, sınırlı uzunlukta.
const META_KEYS = new Set(["mode", "query", "city", "service", "brand", "resultCount", "filterCount", "step", "channel"]);
function sanitizeMeta(meta) {
  if (!meta || typeof meta !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(meta)) {
    if (!META_KEYS.has(k)) continue;
    if (typeof v === "number") out[k] = v;
    else if (typeof v === "string") out[k] = v.slice(0, MAX_STR);
  }
  return out;
}

router.post("/events", (req, res) => {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  if (eventLimiter.check(ip).blocked) return res.status(429).json({ error: "Çok fazla istek." });
  eventLimiter.registerFailure(ip);

  // Tek tek yerine toplu gönderim: istemci olayları biriktirip tek istekte yolluyor (bkz.
  // frontend analytics.ts) — her tıklamada ayrı HTTP isteği atmak hem yavaş hem gereksiz.
  const items = Array.isArray(req.body?.events) ? req.body.events.slice(0, 50) : [];
  if (items.length === 0) return res.status(400).json({ error: "events dizisi zorunludur." });

  const stmt = db.prepare(`
    INSERT INTO analytics_events (name, visitorId, sessionId, targetType, targetId, role, source, country, device, lang, meta)
    VALUES (@name, @visitorId, @sessionId, @targetType, @targetId, @role, @source, @country, @device, @lang, @meta)
  `);
  let accepted = 0;
  const insertMany = db.transaction((rows) => {
    for (const r of rows) {
      if (!ALLOWED_EVENTS.has(r.name)) continue; // bilinmeyen olay sessizce atılır
      stmt.run({
        name: r.name,
        visitorId: clip(r.visitorId),
        sessionId: clip(r.sessionId),
        targetType: clip(r.targetType),
        targetId: Number.isFinite(Number(r.targetId)) ? Number(r.targetId) : null,
        role: clip(r.role),
        source: clip(r.source),
        country: clip(r.country),
        device: clip(r.device),
        lang: clip(r.lang),
        meta: JSON.stringify(sanitizeMeta(r.meta)),
      });
      accepted++;
    }
  });
  insertMany(items);
  res.status(201).json({ accepted });
});

// --------------------------- ADMIN OKUMA UÇLARI ---------------------------
function requireAdmin(req, res, next) {
  if (resolveActor(req)?.role !== "admin") return res.status(403).json({ error: "Yetkisiz." });
  next();
}

// Gün sayısını ISO tarihe çevirir. days verilmezse "tüm zamanlar" (null) döner.
function cutoffFor(days) {
  const n = parseInt(days, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 19).replace("T", " ");
}
// createdAt filtresini tek yerden üretiyoruz ki her sorguda elle tekrarlanmasın.
const since = (cutoff) => (cutoff ? " AND createdAt >= @cutoff" : "");

router.get("/overview", requireAdmin, (req, res) => {
  const cutoff = cutoffFor(req.query.days);
  const p = { cutoff };
  const one = (sql) => db.prepare(sql).get(p) || {};

  // Ziyaretçi/oturum: DISTINCT sayım. visitorId anonim olduğu için bu "kaç kişi" değil "kaç tarayıcı"
  // demektir — panelde de bu şekilde adlandırılıyor, abartılı bir iddiada bulunmuyoruz.
  const visitors = one(`SELECT COUNT(DISTINCT visitorId) n FROM analytics_events WHERE visitorId IS NOT NULL${since(cutoff)}`).n || 0;
  const sessions = one(`SELECT COUNT(DISTINCT sessionId) n FROM analytics_events WHERE sessionId IS NOT NULL${since(cutoff)}`).n || 0;
  const pageViews = one(`SELECT COUNT(*) n FROM analytics_events WHERE name = 'page_view'${since(cutoff)}`).n || 0;

  const countOf = (name) => one(`SELECT COUNT(*) n FROM analytics_events WHERE name = '${name}'${since(cutoff)}`).n || 0;
  const uniqOf = (name) => one(`SELECT COUNT(DISTINCT visitorId) n FROM analytics_events WHERE name = '${name}' AND visitorId IS NOT NULL${since(cutoff)}`).n || 0;

  // HUNİ: her adımda TEKİL ziyaretçi sayıyoruz. Ham olay sayısı kullanılsaydı, tek bir kullanıcının
  // 20 ilana bakması huniyi şişirir ve dönüşüm oranı anlamsızlaşırdı.
  // "Görüntüledi" adımı iki olayı kapsıyor (tamirci profili VEYA araç ilanı). Bunları ayrı ayrı
  // sayıp toplamak YANLIŞ olurdu: hem tamirciye hem ilana bakan tek bir ziyaretçi iki kez sayılır,
  // huni adımı üstteki adımdan büyük görünür ve dönüşüm oranı %100'ü aşardı. Tek sorguda IN ile
  // tekilleştiriyoruz.
  const viewersUnique = one(`
    SELECT COUNT(DISTINCT visitorId) n FROM analytics_events
    WHERE name IN ('mechanic_view', 'listing_view') AND visitorId IS NOT NULL${since(cutoff)}
  `).n || 0;
  const funnel = [
    { key: "visit", count: visitors },
    { key: "search", count: uniqOf("search_performed") },
    { key: "view", count: viewersUnique },
    { key: "contact", count: uniqOf("contact_started") },
    { key: "appointment", count: uniqOf("appointment_booked") },
  ];

  res.json({
    visitors, sessions, pageViews,
    newVisitors: one(`SELECT COUNT(*) n FROM (SELECT visitorId FROM analytics_events WHERE name='session_start'${since(cutoff)} GROUP BY visitorId HAVING COUNT(*) = 1)`).n || 0,
    returningVisitors: one(`SELECT COUNT(*) n FROM (SELECT visitorId FROM analytics_events WHERE name='session_start'${since(cutoff)} GROUP BY visitorId HAVING COUNT(*) > 1)`).n || 0,
    funnel,
    totals: {
      searches: countOf("search_performed"),
      zeroResults: countOf("search_zero_result"),
      mechanicViews: countOf("mechanic_view"),
      listingViews: countOf("listing_view"),
      contacts: countOf("contact_started"),
      quotes: countOf("quote_requested"),
      offers: countOf("offer_made"),
      appointments: countOf("appointment_booked"),
      signups: countOf("signup"),
      listingsCreated: countOf("listing_created"),
    },
  });
});

// Kırılımlar: trafik kaynağı, ülke, cihaz, dil — hepsi aynı desende olduğu için tek uç.
router.get("/breakdown", requireAdmin, (req, res) => {
  const cutoff = cutoffFor(req.query.days);
  const FIELDS = { source: "source", country: "country", device: "device", lang: "lang" };
  const col = FIELDS[req.query.field];
  if (!col) return res.status(400).json({ error: "Geçersiz field." });
  // Kolon adı yukarıdaki beyaz listeden geliyor — kullanıcı girdisi doğrudan SQL'e girmiyor.
  //
  // ÖNEMLİ OKUMA NOTU: buradaki `visitors` bir BÖLÜŞÜM (partition) değil, "bu değerle en az bir olay
  // üretmiş tekil ziyaretçi" sayısıdır. Toplamları, genel ziyaretçi sayısından BÜYÜK olabilir:
  // aynı kişi gün içinde masaüstünden ve telefondan girerse hem "desktop" hem "mobile" altında
  // sayılır. `source` alanında bu neredeyse hiç olmaz (ilk dokunuş ziyaretçi başına sabitleniyor,
  // bkz. frontend analytics.ts getSource), ama `device` ve `country` için gerçekçi bir durumdur.
  // Bu yüzden panelde yüzde değil, mutlak sayı ve göreli çubuk gösteriliyor — yüzde göstermek
  // "toplam %100 etmiyor" şeklinde yanlış bir beklenti yaratırdı.
  const rows = db.prepare(`
    SELECT COALESCE(NULLIF(${col}, ''), 'bilinmiyor') label, COUNT(DISTINCT visitorId) visitors, COUNT(*) events
    FROM analytics_events WHERE 1=1${since(cutoff)}
    GROUP BY label ORDER BY visitors DESC LIMIT 20
  `).all({ cutoff });
  res.json(rows);
});

// Arama trendleri + SONUÇSUZ aramalar. İkincisi ürün için en değerli sinyal: talep var, arz yok.
router.get("/searches", requireAdmin, (req, res) => {
  const cutoff = cutoffFor(req.query.days);
  const topBy = (jsonKey, name) => db.prepare(`
    SELECT json_extract(meta, '$.${jsonKey}') label, COUNT(*) n
    FROM analytics_events
    WHERE name = '${name}' AND json_extract(meta, '$.${jsonKey}') IS NOT NULL
      AND TRIM(json_extract(meta, '$.${jsonKey}')) != ''${since(cutoff)}
    GROUP BY label ORDER BY n DESC LIMIT 15
  `).all({ cutoff });
  res.json({
    topQueries: topBy("query", "search_performed"),
    topCities: topBy("city", "search_performed"),
    topServices: topBy("service", "search_performed"),
    zeroResultQueries: topBy("query", "search_zero_result"),
    zeroResultCities: topBy("city", "search_zero_result"),
  });
});

// Günlük zaman serisi — panelde büyüme grafiği için.
router.get("/timeseries", requireAdmin, (req, res) => {
  const cutoff = cutoffFor(req.query.days || 30);
  const rows = db.prepare(`
    SELECT date(createdAt) day,
           COUNT(DISTINCT visitorId) visitors,
           SUM(CASE WHEN name = 'search_performed' THEN 1 ELSE 0 END) searches,
           SUM(CASE WHEN name = 'appointment_booked' THEN 1 ELSE 0 END) appointments
    FROM analytics_events WHERE 1=1${since(cutoff)}
    GROUP BY day ORDER BY day ASC LIMIT 180
  `).all({ cutoff });
  res.json(rows);
});

// En çok görüntülenen tamirci/ilanlar — hem admin için hem ileride tamirciye "sıralamadaki yerin".
router.get("/top-targets", requireAdmin, (req, res) => {
  const cutoff = cutoffFor(req.query.days);
  const eventName = req.query.targetType === "listing" ? "listing_view" : "mechanic_view";
  const rows = db.prepare(`
    SELECT targetId, COUNT(*) views, COUNT(DISTINCT visitorId) uniqueVisitors
    FROM analytics_events
    WHERE name = '${eventName}' AND targetId IS NOT NULL${since(cutoff)}
    GROUP BY targetId ORDER BY views DESC LIMIT 10
  `).all({ cutoff });
  res.json(rows);
});

// --------------------------- TAMİRCİNİN KENDİ ANALİTİĞİ ---------------------------
/**
 * GET /api/analytics/my-mechanic
 *
 * GÜVENLİK — BU UCUN EN ÖNEMLİ ÖZELLİĞİ: hedef tamirci id'si İSTEKTEN ALINMIYOR (ne query, ne body).
 * Doğrudan oturum token'ından çözülen actor.id kullanılıyor. Aksi halde bir tamirci
 * ?mechanicId=<rakip> yazarak rakibinin dönüşüm verisini okuyabilirdi — bu, admin uçlarını
 * korumamızı tamamen anlamsız kılardı.
 *
 * Dönen veriler tamircinin KENDİ profiline ait; tek istisna "şehrindeki talep" bloğu, ki o da
 * kimseye ait olmayan toplu arama sayılarıdır (hangi tamircinin aradığı bilgisi taşımaz).
 */
router.get("/my-mechanic", (req, res) => {
  const actor = resolveActor(req);
  if (actor?.role !== "mechanic" || actor.id == null) return res.status(403).json({ error: "Yetkisiz." });
  const mechanicId = actor.id;
  const cutoff = cutoffFor(req.query.days);
  const p = { cutoff, mid: mechanicId };
  const one = (sql) => db.prepare(sql).get(p) || {};

  const mine = ` AND targetType = 'mechanic' AND targetId = @mid`;
  const views = one(`SELECT COUNT(*) n FROM analytics_events WHERE name='mechanic_view'${mine}${since(cutoff)}`).n || 0;
  const uniqueViewers = one(`SELECT COUNT(DISTINCT visitorId) n FROM analytics_events WHERE name='mechanic_view'${mine} AND visitorId IS NOT NULL${since(cutoff)}`).n || 0;
  const contacts = one(`SELECT COUNT(DISTINCT visitorId) n FROM analytics_events WHERE name='contact_started'${mine} AND visitorId IS NOT NULL${since(cutoff)}`).n || 0;
  const appointments = one(`SELECT COUNT(DISTINCT visitorId) n FROM analytics_events WHERE name='appointment_booked'${mine} AND visitorId IS NOT NULL${since(cutoff)}`).n || 0;

  // Tamircinin şehri: profilinden okunuyor (adres alanı serbest metin olduğu için basit eşleşme).
  // "Şehrindeki talep" bloğu bunun üzerine kuruluyor.
  const mech = db.prepare(`SELECT address FROM mechanics WHERE id = ?`).get(mechanicId) || {};

  // ŞEHRİNDEKİ TALEP: kullanıcıların bu tamircinin şehri için ne aradığı. Tamirciye satış argümanı
  // ("şehrinde ayda 80 kez kaporta aranıyor") ve ürün geliştirme sinyali. Kişi bazlı hiçbir veri yok.
  const cityDemand = db.prepare(`
    SELECT json_extract(meta, '$.service') label, COUNT(*) n
    FROM analytics_events
    WHERE name = 'search_performed'
      AND json_extract(meta, '$.service') IS NOT NULL
      AND TRIM(json_extract(meta, '$.service')) != ''${since(cutoff)}
    GROUP BY label ORDER BY n DESC LIMIT 8
  `).all({ cutoff });

  const series = db.prepare(`
    SELECT date(createdAt) day, COUNT(*) views
    FROM analytics_events
    WHERE name='mechanic_view' AND targetType='mechanic' AND targetId=@mid${since(cutoff)}
    GROUP BY day ORDER BY day ASC LIMIT 90
  `).all(p);

  const sources = db.prepare(`
    SELECT COALESCE(NULLIF(source, ''), 'bilinmiyor') label, COUNT(DISTINCT visitorId) visitors
    FROM analytics_events
    WHERE name='mechanic_view' AND targetType='mechanic' AND targetId=@mid${since(cutoff)}
    GROUP BY label ORDER BY visitors DESC LIMIT 6
  `).all(p);

  res.json({
    views, uniqueViewers, contacts, appointments,
    // Huni: profil görüntüleme → iletişim → randevu. Adımlar tekil ziyaretçi bazında.
    funnel: [
      { key: "view", count: uniqueViewers },
      { key: "contact", count: contacts },
      { key: "appointment", count: appointments },
    ],
    city: mech.address || null,
    cityDemand, series, sources,
  });
});

export default router;
