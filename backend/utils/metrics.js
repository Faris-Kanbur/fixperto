import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * BASİT İZLEME (Faz 5).
 * ================================================================================================
 * NEDEN VAR: bu uygulamada hiçbir izleme yoktu. Sonucu şu — bir uç yavaşlarsa ya da hata oranı
 * yükselirse bunu ancak bir kullanıcı şikâyet edince öğreniyoruz. Denetimin kendisi bile bunu
 * gösterdi: sohbet listesinin veritabanındaki TÜM fotoğrafları okuduğu aylardır doğruydu ve
 * kimse fark etmemişti, çünkü bakacak bir sayı yoktu.
 *
 * NEDEN PROMETHEUS / OPENTELEMETRY DEĞİL:
 * İkisi de doğru araçlar ama bir toplama altyapısı (scrape eden bir sunucu, saklama, panolar)
 * gerektiriyor. Bu projede o altyapı yok ve kurulması Faz 5'in kendisinden büyük bir iş. Burada
 * amaç "gözlemlenebilirlik platformu" değil; SORUNUN VARLIĞINI görebilmek. 100 satır, sıfır
 * bağımlılık, sıfık işletme maliyeti. Gerçek bir platform gerektiğinde bu sayılar oraya beslenir.
 *
 * NEDEN YÖNETİCİ ARKASINDA (herkese açık /api/health'e EKLENMEDİ):
 * Hata oranı, yavaş uçlar, veritabanı boyutu ve kayıt sayıları işletme ve saldırı istihbaratıdır.
 * "Şu uç yavaş ve 500 veriyor" bilgisi, nereye yükleneceğini arayan birine bedava ipucu olur.
 * /api/health kasıtlı olarak yalın kaldı: yük dengeleyicinin sorduğu soru "ayakta mısın", başka
 * bir şey değil.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const startedAt = Date.now();

/**
 * SÜRE KOVALARI (histogram yerine).
 * Tam bir histogram ya da p95 hesabı için bütün süreleri saklamak gerekir — sınırsız bellek.
 * Kovalar sabit yer kaplıyor ve sorulan soruya cevap veriyor: "istekler hangi aralıkta?"
 * Ortalama tek başına yeterli değil, çünkü 1000 hızlı istek 10 çok yavaş isteği gizler.
 */
const BUCKETS_MS = [5, 25, 100, 500, 2000, Infinity];
const bucketLabels = ["<5ms", "<25ms", "<100ms", "<500ms", "<2s", ">2s"];

const totals = {
  requests: 0,
  byClass: { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 },
  durationBuckets: new Array(BUCKETS_MS.length).fill(0),
  durationSumMs: 0,
  maxMs: 0,
};

/**
 * UÇ BAŞINA ÖZET — SINIRLI SAYIDA ANAHTAR.
 * Ham `req.path` kullanmak olmazdı: `/api/listings/1`, `/api/listings/2`... her kayıt için yeni
 * bir anahtar üretir ve harita sınırsız büyür (bu projede daha önce oturum ve hız sınırı
 * haritalarında düzeltilen aynı sınıf hata). Yol İKİ SEGMENTE indiriliyor: `/api/listings`.
 * Sayı da yine sınırlı: kaynak sayısı kadar, yani ~20.
 */
const MAX_ROUTES = 60;
const byRoute = new Map();

/**
 * `/api/listings/12/share` → `/api/listings`. Kimlikler ve alt yollar birleştiriliyor.
 *
 * İKİNCİ SEGMENT KOŞULLU: "ilk iki segmenti al" kuralı tek başına yetmiyor. `/media/<karma>.jpg`
 * iki segment ve ikincisi her dosyada farklı — yani her fotoğraf yeni bir anahtar üretirdi.
 * Üst sınır belleği korur ama kırılımı işe yaramaz hâle getirir (60 anahtarın 59'u tek bir
 * fotoğraf). Bu yüzden ikinci segment yalnızca KAYNAK ADI gibi görünüyorsa tutuluyor: harf ve
 * tire, nokta yok, tamamı rakam değil. `listings` tutulur; `900001` ve `a1b2....jpg` atılır.
 */
const RESOURCE_SEGMENT_RE = /^[a-z][a-z-]*$/i;

function routeKey(p) {
  const parts = String(p || "/").split("/").filter(Boolean);
  if (parts.length === 0) return "/";
  const out = [parts[0]];
  if (parts[1] && RESOURCE_SEGMENT_RE.test(parts[1])) out.push(parts[1]);
  return "/" + out.join("/");
}

function bucketFor(ms) {
  for (let i = 0; i < BUCKETS_MS.length; i++) if (ms < BUCKETS_MS[i]) return i;
  return BUCKETS_MS.length - 1;
}

/**
 * ÖLÇÜM ARA KATMANI. `res.on("finish")` kullanılıyor: yanıt gerçekten gönderildiğinde çalışıyor,
 * yani ölçülen süre kullanıcının beklediği süre. `res.json` sarmalamak yerine bunu seçmenin
 * sebebi, akış hâlinde gönderilen yanıtları (medya dosyaları) da kapsaması.
 */
export function measureRequests(req, res, next) {
  const started = process.hrtime.bigint();
  /**
   * YOL BURADA, ŞİMDİ YAKALANIYOR — `finish` içinde DEĞİL. Bu bir hata düzeltmesi:
   * Express, bir alt router'a girerken `req.url`i (ve ona bağlı `req.path`i) mount noktasına
   * GÖRE YENİDEN YAZIYOR. `/api/listings/900001` isteği `makeCrudRouter`ın içinde `/900001`
   * oluyor ve yanıt o sırada bittiği için `finish` dinleyicisi kırpılmış yolu görüyordu.
   * Sonuç: her kayıt kimliği ayrı bir anahtar üretiyordu — yani tam olarak engellemek istediğim
   * sınırsız harita büyümesi. Test 40 farklı kimlikle 46 anahtar sayarak bunu yakaladı.
   * `originalUrl` hiç değiştirilmiyor; sorgu dizesi de ayrıca atılıyor.
   */
  const pathAtEntry = String(req.originalUrl || req.url || "/").split("?")[0];
  res.on("finish", () => {
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    totals.requests++;
    totals.durationSumMs += ms;
    if (ms > totals.maxMs) totals.maxMs = ms;
    totals.durationBuckets[bucketFor(ms)]++;
    const cls = `${Math.floor(res.statusCode / 100)}xx`;
    if (totals.byClass[cls] !== undefined) totals.byClass[cls]++;

    const key = routeKey(pathAtEntry);
    let entry = byRoute.get(key);
    if (!entry) {
      // Harita doluysa yeni yol EKLENMİYOR (eskiyi atmak yerine): toplamlar yine doğru kalıyor,
      // yalnızca kırılım eksik olur. Sessiz bellek büyümesine yer yok.
      if (byRoute.size >= MAX_ROUTES) return;
      entry = { requests: 0, errors: 0, sumMs: 0, maxMs: 0 };
      byRoute.set(key, entry);
    }
    entry.requests++;
    entry.sumMs += ms;
    if (ms > entry.maxMs) entry.maxMs = ms;
    if (res.statusCode >= 500) entry.errors++;
  });
  next();
}

/** Veritabanı dosyasının (ve WAL'ın) boyutu. Yol DÖNDÜRÜLMÜYOR — sunucu düzeni sızmasın. */
function dbSize() {
  const dbPath = process.env.FIXPERTO_DB_PATH || path.join(__dirname, "..", "db", "fixperto.sqlite");
  let bytes = 0;
  for (const f of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
    try { bytes += fs.statSync(f).size; } catch { /* yok */ }
  }
  return bytes;
}

/**
 * TOPLANAN HER ŞEY. Yönetici ucu bunu döndürüyor (bkz. routes/admin.js).
 * Sayılar süreç başlangıcından beri toplam — sıfırlama yok, çünkü sıfırlanabilir bir sayaç
 * "kim sıfırladı, ne zaman" sorusunu doğurur ve buradaki amaç için gereksiz.
 */
export function snapshot() {
  const mem = process.memoryUsage();
  const routes = [...byRoute.entries()]
    .map(([path_, v]) => ({
      path: path_,
      requests: v.requests,
      errors: v.errors,
      avgMs: Math.round((v.sumMs / v.requests) * 100) / 100,
      maxMs: Math.round(v.maxMs * 100) / 100,
    }))
    // En yavaş uç en üstte: bakılacak ilk yer o.
    .sort((a, b) => b.avgMs - a.avgMs);

  return {
    uptimeSec: Math.round((Date.now() - startedAt) / 1000),
    requests: totals.requests,
    byClass: { ...totals.byClass },
    /**
     * HATA ORANI tek bir sayı olarak: bir eşik koymak isteyen (uyarı kuran) biri için en
     * kullanışlı biçim. 4xx AYRI tutuluyor — 404 ve 400 çoğu zaman istemci hatası, sunucu
     * arızası değil; ikisini tek orana katmak gerçek arızayı gizler.
     */
    serverErrorRate: totals.requests ? Math.round((totals.byClass["5xx"] / totals.requests) * 10000) / 10000 : 0,
    avgMs: totals.requests ? Math.round((totals.durationSumMs / totals.requests) * 100) / 100 : 0,
    maxMs: Math.round(totals.maxMs * 100) / 100,
    durations: Object.fromEntries(bucketLabels.map((l, i) => [l, totals.durationBuckets[i]])),
    routes,
    routesTruncated: byRoute.size >= MAX_ROUTES,
    dbBytes: dbSize(),
    memory: { rssBytes: mem.rss, heapUsedBytes: mem.heapUsed },
    nodeVersion: process.version,
  };
}
