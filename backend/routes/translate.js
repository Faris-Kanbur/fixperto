import { Router } from "express";
import { db } from "../db/db.js";

const router = Router();

// Sohbet mesajlarının gerçek zamanlı çevirisi. MyMemory (api.mymemory.translated.net) ücretsiz,
// API anahtarı gerektirmeyen bir çeviri servisi — demo/düşük hacimli kullanım için yeterli.
// Uygulamayı YAVAŞLATMAMASI için üç önlem var:
//   1) SQLite'ta kalıcı bir önbellek (translation_cache) — aynı metin/dil çifti bir daha ASLA
//      dış servise gitmez, sunucu yeniden başlasa bile.
//   2) Sıkı bir zaman aşımı (4sn) — dış servis yavaş/çökükse istek asılı kalmaz.
//   3) Hata/timeout durumunda 200 ile orijinal metni döner (frontend hiçbir zaman "çeviri
//      hatası" görmez, sadece sessizce orijinal metni gösterir).
const TRANSLATE_TIMEOUT_MS = 4000;
const SUPPORTED_LANGS = new Set(["tr", "en", "de"]);

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

router.post("/", async (req, res) => {
  const { text, from, to } = req.body || {};
  if (!text || !to) return res.status(400).json({ error: "text ve to zorunludur." });
  const fromLang = SUPPORTED_LANGS.has(from) ? from : "tr";
  const toLang = SUPPORTED_LANGS.has(to) ? to : "tr";
  if (fromLang === toLang || !text.trim()) return res.json({ translatedText: text });

  const cached = db.prepare(
    `SELECT translatedText FROM translation_cache WHERE fromLang = ? AND toLang = ? AND sourceText = ?`
  ).get(fromLang, toLang, text);
  if (cached) return res.json({ translatedText: cached.translatedText, cached: true });

  const translated = await fetchFromMyMemory(text, fromLang, toLang);
  if (!translated) {
    // Çeviri servisi ulaşılamaz/başarısız oldu — kullanıcı orijinal metni görmeye devam etsin,
    // hiçbir zaman hata ile karşılaşmasın. Önbelleğe YAZMIYORUZ ki servis geri geldiğinde tekrar
    // denensin.
    return res.json({ translatedText: text, fallback: true });
  }

  try {
    db.prepare(
      `INSERT OR IGNORE INTO translation_cache (fromLang, toLang, sourceText, translatedText) VALUES (?, ?, ?, ?)`
    ).run(fromLang, toLang, text, translated);
  } catch {
    // Önbelleğe yazma başarısız olsa bile çeviriyi kullanıcıya döndürmeye devam ediyoruz.
  }
  res.json({ translatedText: translated });
});

export default router;
