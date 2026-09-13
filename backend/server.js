import express from "express";
import cors from "cors";
import { seedIfEmpty } from "./db/seed.js";
import { db } from "./db/db.js";
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
if (process.env.TRUST_PROXY === "true") app.set("trust proxy", 1);

// GÜVENLİK BAŞLIKLARI (site geneli denetimde eksik bulundu).
// Yeni bir bağımlılık (helmet) EKLEMİYORUZ: bu API yalnızca JSON döndürüyor, helmet'in başlıklarının
// büyük kısmı HTML sunan sunucular için. İhtiyaç duyulan dört başlık elle yazıldığında hem daha az
// bağımlılık hem de her başlığın NEDEN orada olduğu okunur oluyor.
app.disable("x-powered-by"); // "Express" bilgisini saldırgana bedavaya vermeyelim
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

app.get("/api/health", (req, res) => res.json({ ok: true, service: "fixperto-backend" }));

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
