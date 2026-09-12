import { Router } from "express";
import { db } from "../db/db.js";
import { makeRateLimiter } from "../utils/auth.js";

const router = Router();

// Sohbet mesajlarının (ve randevu/not gibi diğer serbest metinlerin) gerçek zamanlı çevirisi.
// İki ücretsiz, API anahtarı gerektirmeyen servis art arda denenir:
//   1) Google Translate'in anahtarsız "gtx" uç noktası (birincil) — MyMemory'ye göre hem
//      belirgin şekilde daha hızlı hem de kısa/gündelik cümlelerde çok daha isabetli. Herhangi
//      bir günlük kota sınırı yok, bu yüzden "bazen çalışmıyor" sorununu da ortadan kaldırıyor.
//   2) MyMemory (yedek) — Google uç noktasına ağ erişimi yoksa veya başarısız olursa devreye
//      girer, böylece hiçbir ağ ortamında özellik tamamen ölü kalmıyor.
// Uygulamayı YAVAŞLATMAMASI için üç önlem var:
//   1) SQLite'ta kalıcı bir önbellek (translation_cache) — aynı metin/dil çifti bir daha ASLA
//      dış servise gitmez, sunucu yeniden başlasa bile.
//   2) Her servis için ayrı, sıkı bir zaman aşımı (3sn) — dış servis yavaş/çökükse istek asılı
//      kalmaz; en kötü senaryoda (Google tamamen erişilemezse) toplam bekleme ~6sn'yi geçmez.
//   3) Hata/timeout durumunda 200 ile orijinal metni döner (frontend hiçbir zaman "çeviri
//      hatası" görmez, sadece sessizce orijinal metni gösterir).
const TRANSLATE_TIMEOUT_MS = 3000;
const SUPPORTED_LANGS = new Set(["tr", "en", "de"]);

async function fetchFromGoogle(text, from, to) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TRANSLATE_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const body = await res.json();
    // Yanıt şekli: [[[çeviri, orijinal, ...], [çeviri, orijinal, ...], ...], ...] — her cümle
    // parçası ayrı bir alt-dizi olarak gelir, bunları sırayla birleştirip tek metin elde ediyoruz.
    const chunks = body?.[0];
    if (!Array.isArray(chunks) || chunks.length === 0) return null;
    const translated = chunks.map((c) => c?.[0] || "").join("");
    return translated.trim() || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFromMyMemory(text, from, to) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TRANSLATE_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const body = await res.json();
    const translated = body?.responseData?.translatedText;
    // MyMemory, servis kotası dolduğunda çeviri yerine bir uyarı metni ("MYMEMORY WARNING...")
    // döndürebiliyor — bunu gerçek çeviri sanıp göstermemek için basitçe filtreliyoruz.
    if (!translated || /^mymemory warning/i.test(translated)) return null;
    return translated;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function translateText(text, from, to) {
  const fromGoogle = await fetchFromGoogle(text, from, to);
  if (fromGoogle) return fromGoogle;
  return fetchFromMyMemory(text, from, to);
}

// GÜVENLİK DÜZELTMESİ (tam site denetiminde bulundu): bu uç nokta kimlik doğrulaması, uzunluk
// sınırı ve hız sınırı olmadan dışarıya açıktı — yani herkes siteyi ücretsiz bir çeviri proxy'si
// gibi kullanabilir (dış servislerin bizim IP'mizi kısıtlamasına yol açar) ve 5MB'a kadar metinleri
// translation_cache tablosuna yazdırarak veritabanını şişirebilirdi. Artık makul bir metin uzunluğu
// sınırı ve IP başına hız sınırı var. Uygulamanın kendi kullanımı (sohbet/ilan çevirisi) kısa
// metinlerle çalıştığı için bu sınırlar normal kullanımı etkilemiyor.
const MAX_TRANSLATE_TEXT_LEN = 5000;
// GERÇEK HATA DÜZELTMESİ: sınır hem çok dardı hem de ÖNBELLEKTEN karşılanan istekleri de sayıyordu.
// Sayaç ömür boyu biriktiği için (bkz. makeRateLimiter windowMs yorumu) sohbetleri gezen sıradan
// bir kullanıcı 120 mesajdan sonra 10 dakika boyunca çeviri alamıyordu — özellik "bazen çalışmıyor"
// görünüyordu. Artık: 5 dakikalık kayan pencere, yalnızca DIŞ SERVİSE giden istekler sayılıyor
// (önbellek isabetleri bedava) ve toplu uç nokta sayesinde istek sayısı zaten çok daha düşük.
const translateLimiter = makeRateLimiter({ maxAttempts: 200, lockoutMs: 5 * 60 * 1000, windowMs: 5 * 60 * 1000 });
const clientIp = (req) => req.ip || req.socket?.remoteAddress || "unknown";

const readCache = (from, to, text) => db.prepare(
  `SELECT translatedText FROM translation_cache WHERE fromLang = ? AND toLang = ? AND sourceText = ?`
).get(from, to, text)?.translatedText;

const writeCache = (from, to, text, translated) => {
  try {
    db.prepare(
      `INSERT OR IGNORE INTO translation_cache (fromLang, toLang, sourceText, translatedText) VALUES (?, ?, ?, ?)`
    ).run(from, to, text, translated);
  } catch {
    // Önbelleğe yazma başarısız olsa bile çeviriyi kullanıcıya döndürmeye devam ediyoruz.
  }
};

/**
 * TOPLU ÇEVİRİ — "çeviri yavaş" şikâyetinin asıl çözümü.
 * ---------------------------------------------------------------------------------------------
 * Eskiden her mesaj için AYRI bir HTTP isteği atılıyordu. 20 mesajlık bir sohbet açıldığında
 * tarayıcı 20 istek kuyruğa koyuyor, üstelik tarayıcılar aynı sunucuya aynı anda ~6 bağlantı
 * açtığı için istekler sıraya giriyordu: son mesajın çevirisi ancak birkaç saniye sonra geliyordu.
 * Artık istemci hepsini TEK istekte gönderiyor; sunucu önbellekte olanları anında döndürüyor,
 * kalanları da kendi arasında PARALEL çeviriyor (tarayıcının bağlantı sınırı burada yok).
 * Ayrıca aynı metin sohbette birden çok geçiyorsa tek kez çevriliyor.
 */
const MAX_BATCH_ITEMS = 60;
const CONCURRENCY = 8;

router.post("/batch", async (req, res) => {
  const ip = clientIp(req);
  if (translateLimiter.check(ip).blocked) {
    return res.status(429).json({ error: "Çok fazla çeviri isteği. Lütfen birkaç dakika sonra tekrar deneyin." });
  }
  const { items, to } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "items zorunludur." });
  if (items.length > MAX_BATCH_ITEMS) return res.status(400).json({ error: "Tek seferde en fazla 60 metin çevrilebilir." });
  const toLang = SUPPORTED_LANGS.has(to) ? to : "tr";

  // Aynı (kaynak dil + metin) çifti birden çok kez geçebilir — tek kez çevirip hepsine dağıtıyoruz.
  const results = {};
  const pending = new Map(); // "from\u0000text" -> [id, ...]
  for (const item of items) {
    const id = item?.id;
    const text = item?.text;
    if (id === undefined || typeof text !== "string" || !text.trim()) continue;
    if (text.length > MAX_TRANSLATE_TEXT_LEN) { results[id] = text; continue; }
    const fromLang = SUPPORTED_LANGS.has(item.from) ? item.from : "tr";
    if (fromLang === toLang) { results[id] = text; continue; }
    const cached = readCache(fromLang, toLang, text);
    if (cached !== undefined) { results[id] = cached; continue; }
    const key = `${fromLang}\u0000${text}`;
    if (!pending.has(key)) pending.set(key, []);
    pending.get(key).push(id);
  }

  if (pending.size === 0) return res.json({ results, cached: true });

  // Dış servise gidiyoruz: hız sınırı sayacı SADECE burada işliyor.
  translateLimiter.registerFailure(ip);

  const keys = [...pending.keys()];
  const failed = [];
  let cursor = 0;
  const worker = async () => {
    while (cursor < keys.length) {
      const key = keys[cursor++];
      const sep = key.indexOf("\u0000");
      const fromLang = key.slice(0, sep);
      const text = key.slice(sep + 1);
      const translated = await translateText(text, fromLang, toLang);
      const ids = pending.get(key);
      if (translated) {
        writeCache(fromLang, toLang, text, translated);
        for (const id of ids) results[id] = translated;
      } else {
        // Servis ulaşılamadı: orijinali döndürüyoruz ama "fallback" diyoruz ki istemci bunu
        // kalıcı olarak önbelleğe almasın, servis geri gelince yeniden denesin.
        for (const id of ids) { results[id] = text; failed.push(id); }
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, keys.length) }, worker));
  res.json({ results, failed });
});

router.post("/", async (req, res) => {
  const ip = clientIp(req);
  if (translateLimiter.check(ip).blocked) {
    return res.status(429).json({ error: "Çok fazla çeviri isteği. Lütfen birkaç dakika sonra tekrar deneyin." });
  }
  const { text, from, to } = req.body || {};
  if (!text || !to) return res.status(400).json({ error: "text ve to zorunludur." });
  if (typeof text !== "string" || text.length > MAX_TRANSLATE_TEXT_LEN) {
    return res.status(400).json({ error: "Çevrilecek metin çok uzun." });
  }
  const fromLang = SUPPORTED_LANGS.has(from) ? from : "tr";
  const toLang = SUPPORTED_LANGS.has(to) ? to : "tr";
  if (fromLang === toLang || !text.trim()) return res.json({ translatedText: text });

  const cached = readCache(fromLang, toLang, text);
  if (cached !== undefined) return res.json({ translatedText: cached, cached: true });

  // Sayaç yalnızca DIŞ SERVİSE giden istekleri sayıyor (bkz. yukarıdaki yorum).
  translateLimiter.registerFailure(ip);
  const translated = await translateText(text, fromLang, toLang);
  if (!translated) {
    // Çeviri servisi ulaşılamaz/başarısız oldu — kullanıcı orijinal metni görmeye devam etsin,
    // hiçbir zaman hata ile karşılaşmasın. Önbelleğe YAZMIYORUZ ki servis geri geldiğinde tekrar
    // denensin.
    return res.json({ translatedText: text, fallback: true });
  }

  writeCache(fromLang, toLang, text, translated);
  res.json({ translatedText: translated });
});

export default router;
