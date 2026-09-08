import express from "express";
import cors from "cors";
import { seedIfEmpty } from "./db/seed.js";
import { db } from "./db/db.js";
import { makeCrudRouter } from "./routes/makeCrudRouter.js";
import adminRouter from "./routes/admin.js";
import shareEventsRouter from "./routes/shareEvents.js";
import profileViewsRouter from "./routes/profileViews.js";
import translateRouter from "./routes/translate.js";
import analyticsRouter from "./routes/analytics.js";
import blogRouter from "./routes/blog.js";
import { quoteRequestsRouter, quoteOffersRouter } from "./routes/quotes.js";
import { conversationsRouter } from "./routes/conversations.js";
import { authRouter } from "./routes/auth.js";

seedIfEmpty();

const app = express();

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
app.use(cors({
  origin(origin, callback) {
    // origin yok = tarayıcı dışı istek (curl, sunucudan sunucuya sağlık kontrolü vb.) — bunlara
    // zaten CORS uygulanmaz, engellemenin bir anlamı yok; sadece TARAYICI kaynaklı originleri
    // kısıtlıyoruz.
    if (!origin) return callback(null, true);
    if (allowedOrigins.length > 0) {
      return allowedOrigins.includes(origin) ? callback(null, true) : callback(new Error("CORS: origin izinli değil"));
    }
    if (LOCALHOST_ORIGIN_RE.test(origin)) return callback(null, true);
    callback(new Error("CORS: origin izinli değil"));
  },
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
app.use("/api/mechanics", makeCrudRouter("mechanics", {
  shareCountColumn: "shareCount", passwordVerify: true,
  // sharedWrite: reviewList/reviews/rating tek başına self-only olamaz — bir owner bir tamirciye
  // yorum bırakabilmeli, kendi yorumunu "faydalı" işaretleyebilmeli/silebilmeli (bkz.
  // makeCrudRouter.js üstündeki büyük yorum, "Beğeni kaydedilemedi" regresyonunun düzeltmesi).
  authScope: { fields: [{ field: "id", role: "mechanic" }], sharedWrite: { fields: ["reviewList", "reviews", "rating"], roles: ["owner", "mechanic"] } },
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
app.use("/api/analytics", analyticsRouter);
app.use("/api/blog", blogRouter);

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Fixperto backend listening on http://localhost:${PORT}`);
});
