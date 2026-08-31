import express from "express";
import cors from "cors";
import { seedIfEmpty } from "./db/seed.js";
import { makeCrudRouter } from "./routes/makeCrudRouter.js";
import adminRouter from "./routes/admin.js";
import shareEventsRouter from "./routes/shareEvents.js";
import profileViewsRouter from "./routes/profileViews.js";
import translateRouter from "./routes/translate.js";
import { quoteRequestsRouter, quoteOffersRouter } from "./routes/quotes.js";
import { conversationsRouter } from "./routes/conversations.js";
import { authRouter } from "./routes/auth.js";

seedIfEmpty();

const app = express();
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
app.use("/api/listings", makeCrudRouter("listings", {
  shareCountColumn: "shareCount",
  authScope: { fields: [{ field: "sellerId", role: "owner" }, { field: "sellerId", role: "mechanic" }] },
}));
// Genel CRUD factory yerine özel router (bkz. backend/routes/conversations.js) — mesaj
// şeklinin/boyutunun ve sohbet kimliğinin (mechanicId) her zaman geçerli kalması için.
app.use("/api/conversations", conversationsRouter);
app.use("/api/jobs", makeCrudRouter("job_listings", {
  shareCountColumn: "shareCount",
  authScope: { fields: [{ field: "mechanicId", role: "mechanic" }] },
}));
app.use("/api/tickets", makeCrudRouter("support_tickets", {
  authScope: { fields: [{ field: "fromId", role: "owner" }, { field: "fromId", role: "mechanic" }], publicRead: false },
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
