import express from "express";
import cors from "cors";
import { seedIfEmpty } from "./db/seed.js";
import { db } from "./db/db.js";
import { trustedHops, logIpConfig } from "./utils/clientIp.js";
import { compressResponses } from "./utils/compress.js";
import { measureRequests } from "./utils/metrics.js";
import { makeCrudRouter } from "./routes/makeCrudRouter.js";
import adminRouter from "./routes/admin.js";
import shareEventsRouter from "./routes/shareEvents.js";
import profileViewsRouter from "./routes/profileViews.js";
import translateRouter from "./routes/translate.js";
import vehicleHistoryRouter from "./routes/vehicleHistory.js";
import listingInteractionsRouter from "./routes/listingInteractions.js";
import recommendationsRouter from "./routes/recommendations.js";
import jobApplicationsRouter from "./routes/jobApplications.js";
import reviewsRouter from "./routes/reviews.js";
import analyticsRouter from "./routes/analytics.js";
import blogRouter from "./routes/blog.js";
import careersRouter from "./routes/careers.js";
import { quoteRequestsRouter, quoteOffersRouter } from "./routes/quotes.js";
import { conversationsRouter } from "./routes/conversations.js";
import { mediaRouter, mediaFileRouter } from "./routes/media.js";
import { appointmentsRouter } from "./routes/appointments.js";
import { authRouter } from "./routes/auth.js";

seedIfEmpty();

const app = express();
/**
 * TERS VEKİL (reverse proxy) ARKASINDA IP.
 * ---------------------------------------------------------------------------------------------
 * DAĞITIM TUZAĞI (denetimde bulundu): uygulama bir vekilin (nginx, Cloudflare, Render…) arkasına
 * konduğunda req.ip ARTIK ziyaretçinin değil VEKİLİN adresi olur. O anda IP başına çalışan bütün
 * hız sınırlayıcılar (kayıt, giriş, OTP, çeviri, VIN sorgulama) tek bir kovaya düşer: ilk beş
 * kaydolan kişiden sonra SİTEYE KİMSE KAYDOLAMAZ. Tersi de tehlikeli: "trust proxy" gelişigüzel
 * açılırsa saldırgan X-Forwarded-For başlığını uydurup her istekte yeni bir kimlikmiş gibi
 * görünür ve sınırları tamamen atlar.
 * Bu yüzden BİLİNÇLİ bir anahtar: yalnızca gerçekten vekil arkasındaysanız TRUST_PROXY=true.
 */
/**
 * DENETİMDE ÖLÇÜLDÜ: `TRUST_PROXY=true` iken sahte bir `X-Forwarded-For` başlığıyla hız sınırı
 * TAMAMEN atlanıyordu (sınır dolduktan sonra 429 alan istek, uydurma bir başlıkla 401'e dönüyordu).
 * Express'in kendi davranışı doğru — en sağdaki girdiyi alır, onu da vekil yazar — ama vekil
 * YOKKEN ya da vekil sayısı yanlışken başlık tamamen saldırgan kontrolünde oluyor.
 *
 * Artık IP okuma tek bir yerde ve kendini savunuyor (bkz. utils/clientIp.js): beklenen vekil
 * sayısı kadar girdi yoksa başlık hiç dikkate alınmıyor. Express'in `trust proxy` ayarı da aynı
 * sayıdan besleniyor ki `req.ip` ile bizim hesabımız ayrışmasın.
 *
 * TRUST_PROXY_HOPS = önündeki vekil sayısı (CDN + nginx varsa 2). Eski TRUST_PROXY=true ayarı
 * 1 sayılıyor ki mevcut dağıtımlar bozulmasın.
 */
const TRUSTED_HOPS = trustedHops();
if (TRUSTED_HOPS > 0) app.set("trust proxy", TRUSTED_HOPS);
logIpConfig();

// GÜVENLİK BAŞLIKLARI (site geneli denetimde eksik bulundu).
// Yeni bir bağımlılık (helmet) EKLEMİYORUZ: bu API yalnızca JSON döndürüyor, helmet'in başlıklarının
// büyük kısmı HTML sunan sunucular için. İhtiyaç duyulan dört başlık elle yazıldığında hem daha az
// bağımlılık hem de her başlığın NEDEN orada olduğu okunur oluyor.
app.disable("x-powered-by"); // "Express" bilgisini saldırgana bedavaya vermeyelim

/**
 * ÖLÇÜM ARA KATMANI (Faz 5) — EN BAŞTA, bilerek.
 * Buradan önce hiçbir şey olmadığı için ölçülen süre kullanıcının GERÇEKTEN beklediği süre:
 * güvenlik başlıkları, CORS, gövde ayrıştırma, sıkıştırma — hepsi ölçümün içinde. Ara katmanı
 * rotalara yakın koymak, kendi ara katmanlarımızın maliyetini görünmez yapardı.
 * Toplanan sayılar yalnızca yönetici ucundan okunuyor (bkz. routes/admin.js metrics).
 */
app.use(measureRequests);
app.use((req, res, next) => {
  // Tarayıcı, Content-Type'ı tahmin etmeye çalışmasın. Bir kullanıcı içeriği yanlışlıkla
  // text/html gibi yorumlanırsa XSS'e dönüşebilir.
  res.setHeader("X-Content-Type-Options", "nosniff");
  // API yanıtları bir iframe içine gömülmemeli (clickjacking).
  res.setHeader("X-Frame-Options", "DENY");
  // Dış sitelere tam URL sızdırma.
  res.setHeader("Referrer-Policy", "no-referrer");
  // API'nin kamera/mikrofon/konum gibi güçlü özelliklere ihtiyacı yok.
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
// GÜVENLİK DÜZELTMESİ: `cors()` parametresiz kullanıldığında TÜM originlere izin verir — yani
// internetteki herhangi bir sitedeki JS, ziyaretçinin tarayıcısı üzerinden bu API'ye istek
// atabilirdi (CSRF benzeri bir risk, özellikle kimlik doğrulaması eklenen /api/admin gibi uç
// noktalarda). Artık izin verilen originler FIXPERTO_ALLOWED_ORIGINS ortam değişkeninden
// (virgülle ayrılmış liste) okunuyor. Ayarlanmamışsa, yerel geliştirmeyi KIRMAMAK için herhangi
// bir localhost/127.0.0.1 portuna (Vite farklı bir port seçmiş olsa bile, ör. 5173 doluysa 5174'e
// geçmesi gibi) izin veriliyor — bu hâlâ "internetteki herhangi bir site" riskini kapatıyor, sadece
// kendi makinenizden gelen istekleri serbest bırakıyor. Prodüksiyona alırken FIXPERTO_ALLOWED_ORIGINS
// mutlaka gerçek frontend domain'i ile set edilmeli (bkz. backend/.env.example) — set edildiğinde
// localhost fallback'i devre dışı kalır, sadece listedeki originlere izin verilir.
const LOCALHOST_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const allowedOrigins = (process.env.FIXPERTO_ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
/**
 * İZİNSİZ ORIGIN "HATA" DEĞİL, "İZİN YOK" DEMEKTİR (tarayıcı denetiminde bulundu).
 * ------------------------------------------------------------------------------------------------
 * Önceki hâlde izinsiz bir origin için `callback(new Error(...))` çağrılıyordu. cors paketi bu
 * hatayı Express'in hata ara katmanına veriyor, o da 500 "Internal server error" dönüyordu.
 * İki ayrı sorun:
 *   1) YANLIŞ CEVAP: sunucuda bozulan bir şey yok; istek sadece izinli değil. 500, izleme
 *      panellerinde gerçek arızalarla karışır ve "sunucu çöküyor" sanılır.
 *   2) UCUZ GÜNLÜK ŞİŞİRME: her izinsiz istek hata katmanından geçip `console.error(err)` ile tam
 *      yığın izini günlüğe yazıyordu. Herhangi bir sayfadaki JS, saniyede yüzlerce istekle
 *      sunucunun günlüğünü (ve diskini) bedava şişirebilirdi.
 *
 * Doğrusu: CORS başlığını EKLEMEMEK. Tarayıcı zaten başlık olmadan yanıtı JS'e vermez — koruma
 * başlığın YOKLUĞUNDAN gelir, sunucunun hata fırlatmasından değil. Böylece izinsiz origin sessizce
 * (ve ucuza) engelleniyor, tarayıcı isteği bloke ediyor, günlük temiz kalıyor.
 *
 * NOT: bu, tarayıcı DIŞI isteği (curl, betik) engellemez ve engellemesi de beklenmez — CORS
 * tarayıcı politikasıdır, kimlik doğrulama değildir. Yetki kontrolü her uçta ayrıca yapılıyor.
 */
const isAllowedOrigin = (origin) => {
  if (!origin) return true;   // tarayıcı dışı istek: CORS zaten uygulanmaz
  if (allowedOrigins.length > 0) return allowedOrigins.includes(origin);
  return LOCALHOST_ORIGIN_RE.test(origin);
};
app.use(cors({
  origin(origin, callback) {
    // İkinci argüman false → başlık eklenmez, hata da fırlatılmaz.
    callback(null, isAllowedOrigin(origin));
  },
  /**
   * GERÇEK HATA (tarayıcı denetiminde bulundu): `X-Total-Count` başlığı eklendi ama AÇIĞA
   * ÇIKARILMADI. Tarayıcı, çapraz kaynaklı bir yanıtta JS'e yalnızca güvenli liste başlıklarını
   * verir; `Access-Control-Expose-Headers` ile açıkça izin verilmeyen her başlık GİZLENİR.
   * Yani "kırpılma görülebilir olsun" diye eklenen başlık, ön yüz ile API'nin ayrı adreste
   * olduğu NORMAL dağıtımda hiç görünmüyordu.
   *
   * Bu hatanın sunucu-sunucu testlerde görünmemesi öğretici: test istemcisi tarayıcı değil,
   * CORS kuralları ona uygulanmıyor. O yüzden başlığın varlığını değil, AÇIĞA ÇIKARILDIĞINI
   * de ayrıca doğrulamak gerekiyor.
   */
  exposedHeaders: ["X-Total-Count"],
}));
app.use(express.json({ limit: "5mb" }));
/**
 * YANIT SIKIŞTIRMA — JSON yükünde 5-10x kazanç (bkz. utils/compress.js).
 * express.json'dan SONRA, rotalardan ÖNCE: gövdeyi ayrıştırmakla ilgisi yok, ama tüm rotaların
 * yanıtlarını sarmalaması gerekiyor. Kimlik uçları kasıtlı olarak kapsam dışında.
 * NOT: base64 gömülü fotoğraflar sıkışmaz (%0-5) — bu, medya sorununun çözümü DEĞİL.
 */
app.use(compressResponses);

/**
 * GÖVDE ÇOK BÜYÜKSE 413 DÖNMELİ, 500 DEĞİL (Faz 1 testleri bunu ortaya çıkardı).
 * ------------------------------------------------------------------------------------------------
 * `express.json({limit:"5mb"})` sınırı aşan bir gövdede `PayloadTooLargeError` fırlatıyor ve bu
 * hata genel hata katmanına düşüp "500 Internal server error" oluyordu. İki ayrı sorun:
 *   1) YANLIŞ CEVAP: sunucuda bozulan bir şey yok; istek fazla büyük. 500, istemciye "tekrar dene"
 *      dedirtiyor ve tekrar denemek hiçbir zaman işe yaramıyor.
 *   2) SESSİZ SEBEP: kullanıcı fotoğrafın çok büyük olduğunu öğrenemiyor, "kaydedilemedi" görüyor.
 * Artık 413 ve gerçek sebebi söyleyen bir mesaj dönüyor. Sınırın KENDİSİ de mesajda yazıyor ki
 * kullanıcı ne yapacağını bilsin.
 *
 * NOT: bu ara katman JSON ayrıştırıcıdan SONRA gelmeli — hatayı o üretiyor.
 */
app.use((err, req, res, next) => {
  if (err?.type === "entity.too.large" || err?.status === 413) {
    return res.status(413).json({ error: "Gönderilen veri çok büyük (en fazla 5 MB). Fotoğrafı küçültüp tekrar deneyin." });
  }
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Geçersiz JSON gövdesi." });
  }
  return next(err);
});

/**
 * SAĞLIK UCU — ve `instance` alanının NEDEN VAR OLDUĞU.
 * ================================================================================================
 * Uçtan uca test altyapısı sunucuyu kendi başlatıyor ve "ayakta mı" diye bu ucu yokluyordu. Ama
 * "bir sunucu yanıt veriyor" ile "BENİM başlattığım sunucu yanıt veriyor" aynı şey değil ve bu
 * fark gerçek bir soruna yol açtı (kullanıcının makinesinde ortaya çıktı):
 *
 *   Çökmüş bir önceki koşudan kalan sunucu süreci portu dinlemeye devam ediyor → harness yeni
 *   sunucuyu başlatıyor → yeni süreç EADDRINUSE ile ölüyor → ama /api/health YANIT VERİYOR
 *   (eski süreçten) → harness "hazır" deyip devam ediyor ve BÜTÜN testler BAYAT veritabanına
 *   karşı koşuyor. Belirtisi: ilk `createUser` 409 "bu e-posta zaten var" diyor, çünkü o kullanıcı
 *   önceki koşuda açılmış.
 *
 * Bunun en kötü tarafı testin patlaması değil: testlerin bayat bir sunucuya karşı GEÇEBİLMESİ.
 * Yani yeşil bir koşu, hiç çalıştırılmamış kodu doğruluyormuş gibi görünebilirdi.
 *
 * Çözüm: sunucu, kendisine verilen örnek kimliğini geri söylüyor. Harness kimliği üretip env ile
 * geçiyor ve yanıttaki değerin KENDİ ürettiği değer olduğunu doğruluyor. Üretimde bu değişken
 * tanımlı olmadığı için alan `null` dönüyor ve hiçbir şey değişmiyor.
 */
app.get("/api/health", (req, res) => res.json({
  ok: true,
  service: "fixperto-backend",
  instance: process.env.FIXPERTO_INSTANCE_ID || null,
}));

/**
 * MEDYA (Faz 4). İki uç, iki ayrı yerde bilerek:
 *   POST /api/media   → yazma, kimlik doğrulamalı, hız sınırlı
 *   GET  /media/:name → okuma, herkese açık, bir yıl `immutable` cache
 *
 * Okuma yolu `/api` ALTINDA DEĞİL: bir gün doğrudan nginx'e ya da CDN'e verilebilsin. Bugünkü
 * mimaride görseller kimlik doğrulamalı JSON'un içine gömülü olduğu için cache'lenmeleri
 * İMKÂNSIZ; bu iki uç o imkânı yaratıyor. Ayrıntılı gerekçe: backend/utils/mediaStore.js.
 *
 * SIKIŞTIRMA DIŞINDA TUTULMUYOR AMA GEREKMİYOR DA: compressResponses yalnızca res.json'ı
 * sarmalıyor, dosya akışına dokunmuyor. JPEG'i gzip'lemek boşa CPU olurdu — kendiliğinden
 * doğru davranış.
 */
app.use("/api/media", mediaRouter);
app.use("/media", mediaFileRouter);

// GERÇEK OTURUM SİSTEMİ: aşağıdaki authScope seçenekleri, bu oturumda eklenen gerçek owner/mechanic
// giriş sistemine (bkz. backend/routes/auth.js) bağlanıyor. Her kaynak, "kimin verisi" sorusunu artık
// istemciden gelen ownerId/mechanicId'ye güvenerek değil, doğrulanmış oturum kimliğinden cevaplıyor
// (bkz. makeCrudRouter.js üstündeki büyük yorum). vehicles/appointments/tickets tamamen özel veri
// olduğu için publicRead:false (girişsiz kimse göremez, sahibi ya da admin görür); mechanics/owners/
// listings/jobs pazar yeri gezinme deneyimi için okumada açık kalıyor (publicRead varsayılan true),
// sadece yazma (kayıt oluşturma/değiştirme/silme) artık gerçek sahiplik kontrolüne tabi.
// Yorumlar AYRI router'da ve CRUD'dan ÖNCE: puan artık istemcinin gönderdiği bir sayı değil,
// sunucunun yorum listesinden hesapladığı bir değer (bkz. routes/reviews.js).
app.use("/api/mechanics", reviewsRouter);
app.use("/api/mechanics", makeCrudRouter("mechanics", {
  shareCountColumn: "shareCount", passwordVerify: true,
  // sharedWrite KALDIRILDI (güvenlik denetimi): reviewList/reviews/rating alanları giriş yapmış
  // HERKESE açıktı — dizinin tamamı istemciden geldiği için biri tamircinin olumsuz yorumlarını
  // silebiliyor, başkasının ağzından yorum ekleyebiliyor ve puanı doğrudan 5,0 yazabiliyordu.
  // Bu üç alan artık yalnızca reviewsRouter üzerinden, sunucunun hesaplamasıyla değişiyor.
  authScope: { fields: [{ field: "id", role: "mechanic" }] },
}));
app.use("/api/owners", makeCrudRouter("owners", {
  passwordVerify: true,
  authScope: { fields: [{ field: "id", role: "owner" }] },
}));
app.use("/api/vehicles", makeCrudRouter("vehicles", {
  authScope: { fields: [{ field: "ownerId", role: "owner" }], publicRead: false },
}));
/**
 * RANDEVULAR: özel router CRUD'DAN ÖNCE (tam uygulama denetiminde eklendi).
 * Randevu satırı İKİ TARAFIN paylaştığı tek kayıt; sahiplik kontrolü "bu satır senin mi" sorusunu
 * doğru cevaplıyor ama randevuda asıl soru "bu ALANI sen yazabilir misin" — denetimde müşterinin
 * status/servicePrice/depositPaid/noShow/autoAccepted gibi karşı tarafa ait kararları yazabildiği
 * ÖLÇÜLDÜ. Özel router alan ve durum kontrolünü yapıyor; GET ve DELETE jenerik CRUD'da kalıyor.
 */
app.use("/api/appointments", appointmentsRouter);
app.use("/api/appointments", makeCrudRouter("appointments", {
  authScope: { fields: [{ field: "ownerId", role: "owner" }, { field: "mechanicId", role: "mechanic" }], publicRead: false },
}));
// GÜVENLİK DÜZELTMESİ (roller arası id çakışması — bkz. makeCrudRouter.js matchingField yorumu):
// owner #7 ile mechanic #7 farklı kişiler, ama ikisi de aynı `sellerId` sütununa yazıyor. Rolü
// ayıran `sellerType` sütunu da kontrole dâhil edilmezse bir araç sahibi, aynı id'ye sahip bir
// tamircinin ilanını düzenleyip silebiliyordu.
// Alıcı tarafının yazma yolu (teklif verme, soru sorma) AYRI bir router'da ve CRUD'dan ÖNCE
// bağlanıyor: ilanların genel yazma yetkisi satıcıya ait olduğu için bu istekler eskiden 403
// alıyor ve teklif sunucuya hiç kaydedilmiyordu (bkz. routes/listingInteractions.js).
app.use("/api/listings", listingInteractionsRouter);
// ÖNERİLER: kişisel profil YALNIZCA açık rıza varsa yazılır; rıza kapatılınca silinir
// (bkz. routes/recommendations.js — gerekçe ve Netflix/Amazon karşılaştırması orada).
app.use("/api/recommendations", recommendationsRouter);
app.use("/api/listings", makeCrudRouter("listings", {
  shareCountColumn: "shareCount",
  authScope: {
    fields: [
      { field: "sellerId", role: "owner", typeField: "sellerType", typeValue: "owner" },
      { field: "sellerId", role: "mechanic", typeField: "sellerType", typeValue: "mechanic" },
    ],
  },
}));
// Genel CRUD factory yerine özel router (bkz. backend/routes/conversations.js) — mesaj
// şeklinin/boyutunun ve sohbet kimliğinin (mechanicId) her zaman geçerli kalması için.
app.use("/api/conversations", conversationsRouter);
// Başvurular AYRI router'da ve CRUD'dan ÖNCE: iş ilanının yazma yetkisi ilanı açan tamirciye
// ait olduğu için başvurular eskiden 403 alıyor ve HİÇ kaydedilmiyordu (bkz. jobApplications.js).
app.use("/api/jobs", jobApplicationsRouter);
app.use("/api/jobs", makeCrudRouter("job_listings", {
  shareCountColumn: "shareCount",
  authScope: { fields: [{ field: "mechanicId", role: "mechanic" }] },
}));
// Aynı roller arası id çakışması riski destek taleplerinde daha da hassastı (kişisel şikâyet
// metinleri): owner #7, mechanic #7'nin taleplerini okuyabiliyor/değiştirebiliyordu.
app.use("/api/tickets", makeCrudRouter("support_tickets", {
  authScope: {
    fields: [
      { field: "fromId", role: "owner", typeField: "fromType", typeValue: "owner" },
      { field: "fromId", role: "mechanic", typeField: "fromType", typeValue: "mechanic" },
    ],
    publicRead: false,
  },
}));
// Genel CRUD factory yerine özel router (bkz. backend/routes/quotes.js) — limit doğrulama,
// atomik kabul/iptal/reddet geçişleri ve durum makinesi kuralları için.
app.use("/api/quote-requests", quoteRequestsRouter);
app.use("/api/quote-offers", quoteOffersRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/share-events", shareEventsRouter);
app.use("/api/profile-views", profileViewsRouter);
app.use("/api/translate", translateRouter);
// Aracın şasi numarasına bağlı, sahipten bağımsız servis geçmişi (bkz. routes/vehicleHistory.js).
app.use("/api/vehicle-history", vehicleHistoryRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/blog", blogRouter);
app.use("/api/careers", careersRouter);

// ---- sitemap.xml ------------------------------------------------------------------------------
// Arama motoru botları siteyi taramaya buradan başlar. Yayınlanmış her blog yazısı ve sabit
// sayfalar listeleniyor; taslaklar YOK (yayınlanmamış içerik indekslenmemeli).
// SITE_URL ayarlanmadıysa localhost kullanılıyor — gerçek alan adı .env'den gelmeli.
app.get("/sitemap.xml", (req, res) => {
  const base = (process.env.SITE_URL || "http://localhost:5173").replace(/\/$/, "");
  const esc = (u) => String(u).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  let posts = [];
  try { posts = db.prepare("SELECT slug, publishedAt FROM blog_posts WHERE status = 'published'").all(); } catch { posts = []; }
  const urls = [
    { loc: `${base}/`, priority: "1.0" },
    { loc: `${base}/blog`, priority: "0.8" },
    ...posts.map((p) => ({ loc: `${base}/blog/${p.slug}`, lastmod: p.publishedAt, priority: "0.7" })),
  ];
  res.type("application/xml").send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${esc(String(u.lastmod).slice(0, 10))}</lastmod>` : ""}<priority>${u.priority}</priority></url>`).join("\n") +
    `\n</urlset>\n`
  );
});

// robots.txt — botlara neyin taranabilir olduğunu ve sitemap'in yerini söyler.
// /api/ bilinçli olarak kapalı: JSON uçlarının arama sonuçlarında çıkmasının hiçbir faydası yok.
app.get("/robots.txt", (req, res) => {
  const base = (process.env.SITE_URL || "http://localhost:5173").replace(/\/$/, "");
  res.type("text/plain").send(`User-agent: *\nDisallow: /api/\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);
});
// GÜVENLİK DÜZELTMESİ (bu denetimde bulundu): authScope hiç verilmediği için POST/PATCH/DELETE
// TAMAMEN açıktı — giriş yapmamış herhangi biri, admin paneli hiç kullanmadan doğrudan API'ye
// istek atarak sahte "Fixperto Duyurusu" oluşturabilir/değiştirebilir/silebilirdi (frontend'de
// bunu tetikleyen tek yol admin panelindeki sendBroadcast olsa da, backend bunu hiç zorlamıyordu).
// fields: [] ile hiçbir owner/mechanic sahiplik alanı tanımlanmadığından POST/PATCH/DELETE artık
// sadece admin token'ı ile geçer; publicRead: true ile GET (bootstrap'ta tüm kullanıcılara duyuru
// göstermek için) herkese açık kalmaya devam ediyor.
app.use("/api/broadcasts", makeCrudRouter("broadcasts", {
  authScope: { fields: [], publicRead: true },
}));

app.use((req, res) => res.status(404).json({ error: "Not found" }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

/**
 * SON SAVUNMA HATTI — tek bir isteğin tüm hizmeti durdurmasını engeller.
 * ------------------------------------------------------------------------------------------------
 * Yukarıdaki ara katman Express'in gördüğü hataları yakalıyor. Ama yakalanmayan bir söz reddi
 * (unhandledRejection) ya da gerçekten beklenmeyen bir istisna Node 22'de SÜRECİ SONLANDIRIR.
 * Bu denetimde tam olarak bu yaşandı: "hesabımı sil" akışındaki bir veritabanı kısıt hatası
 * backend'i komple kapattı — yani giriş yapmış herhangi bir kullanıcı siteyi HERKES için
 * düşürebiliyordu. Asıl düzeltme hatanın kendisiydi (bkz. routes/auth.js) ve asenkron rotalar
 * artık sarmalanıyor (bkz. utils/asyncRoute.js); burası bir sonraki gözden kaçanı yakalıyor.
 *
 * Hatayı GİZLEMİYORUZ: sunucu günlüğüne tam hâliyle yazılıyor. Yalnızca "bir isteği kaybetmek"
 * ile "tüm siteyi kaybetmek" arasındaki farkı koruyoruz.
 */
process.on("unhandledRejection", (reason) => {
  console.error("YAKALANMAYAN SÖZ REDDİ (süreç ayakta tutuluyor):", reason);
});
process.on("uncaughtException", (err) => {
  console.error("YAKALANMAYAN İSTİSNA (süreç ayakta tutuluyor):", err);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Fixperto backend listening on http://localhost:${PORT}`);
});
