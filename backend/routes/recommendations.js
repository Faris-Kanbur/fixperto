import { Router } from "express";
import { db } from "../db/db.js";
import { hydrate } from "../db/hydrate.js";
import { makeRateLimiter, resolveActor } from "../utils/auth.js";

/**
 * ÖNERİLER ("Senin İçin") — Netflix/Amazon mantığının bu pazar yerindeki dürüst karşılığı.
 * =================================================================================================
 * ARAŞTIRMA NOTU (kullanıcı istedi: "Netflix ne yapıyor, aynı mantığı bize ekleyelim").
 * Netflix tek bir algoritma değil, birkaç sinyalin harmanı kullanıyor:
 *   1) ÖRTÜK SİNYAL (implicit feedback): kimse puan vermez ama herkes izler. İzleme, atlama,
 *      duraklama gibi davranışlar açık puanlardan çok daha bol ve çok daha kullanışlı.
 *   2) İÇERİK TEMELLİ (content-based): izlenenin ÜST VERİSİNE benzeyenler — tür, oyuncu, yıl.
 *   3) İŞBİRLİKÇİ SÜZGEÇ (collaborative filtering): "sana benzeyenler şunu da izledi".
 *   4) AÇIKLAMA: "X izlediğin için" — öneri gerekçesiyle birlikte gösteriliyor.
 *
 * BİZDEKİ KARŞILIĞI ve NEDEN BÖYLE:
 *   1) Örtük sinyal bizde de tek gerçekçi kaynak: kimse "bu ilanı beğendim" düğmesine basmıyor,
 *      ama insanlar ilanlara bakıyor, arıyor, karşılaştırıyor, favoriliyor.
 *   2) İçerik temelli KISIM ANA MOTOR. Sebebi ölçek: Netflix'in milyonlarca kullanıcısı var, biz
 *      yeni bir pazar yeriyiz. Az kullanıcıyla işbirlikçi süzgeç "soğuk başlangıç" yüzünden
 *      saçmalar. Marka/yakıt/fiyat aralığı benzerliği ilk günden çalışır.
 *   3) İşbirlikçi kısım, Amazon'un ürün-ürün (item-to-item) yöntemiyle sınırlı: "bu ilana
 *      bakanlar şuna da baktı". Bu KULLANICI profili gerektirmiyor, ANONİM oturum akışından
 *      hesaplanıyor — yani izin vermeyen kullanıcı için de çalışır ve kimseyi profillemez.
 *   4) Her öneri GEREKÇESİYLE geliyor. Gerekçesiz öneri, kullanıcıya "seni izliyoruz ama neden
 *      bunu gösterdiğimizi söylemiyoruz" demektir; hem güveni bitirir hem GDPR şeffaflığına aykırı.
 *
 * RIZA — burası pazarlık konusu değil:
 *   - Kişisel profil YALNIZCA recsConsent = 1 iken yazılır. Kontrol SUNUCUDA; istemci "sakla"
 *     dese bile izin yoksa hiçbir şey yazılmaz.
 *   - İzin kapatıldığı an profil SİLİNİR (durdurmak yetmez; elde tutulan veri de işlemedir).
 *   - Kullanıcı profilini görebilir (GET /profile) ve silebilir (DELETE /profile).
 *   - İzin yokken öneriler yine gelir ama kişisel değildir: yakındaki/çok bakılan ilanlar ve
 *     ürün-ürün benzerliği. "İzin vermezsen hiçbir şey göremezsin" bir rıza değil, şantajdır.
 */
export const recommendationsRouter = Router();

// Sinyal yazma sık olur (her ilan görüntülemede); yine de bir uçtan sınırsız yazma kabul edilmez.
const signalLimiter = makeRateLimiter({ maxAttempts: 240, lockoutMs: 5 * 60 * 1000, windowMs: 60 * 1000 });

/**
 * Sinyal türlerinin ağırlığı. Fikir: bir şeye BAKMAK zayıf, KARŞILAŞTIRMAK orta, FAVORİLEMEK ya da
 * TEKLİF VERMEK güçlü niyet belirtir. Netflix'in "izlemeyi bitirdi > başlayıp bıraktı" ayrımının
 * bizdeki karşılığı bu.
 */
const ACTION_WEIGHT = { view: 1, search: 1.5, compare: 2.5, favorite: 4, offer: 6 };

/** Bir ilanın hangi özelliklerinden zevk sinyali çıkarıyoruz. Az ve anlaşılır tutuldu. */
const LISTING_FEATURES = ["brand", "fuelType", "transmission", "bodyType", "city"];
const KIND_WEIGHT = { brand: 3, bodyType: 2, fuelType: 1.5, transmission: 1, city: 2, priceBand: 2, service: 2, specialty: 1.5 };

/** Fiyat aralığı: tam fiyat değil BANT saklıyoruz — hem daha az veri hem daha iyi genelleme. */
const PRICE_BANDS = [0, 100_000, 250_000, 500_000, 1_000_000, 2_000_000, Infinity];
export function priceBandOf(raw) {
  const n = Number(String(raw ?? "").replace(/[^\d]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  for (let i = 0; i < PRICE_BANDS.length - 1; i++) {
    if (n >= PRICE_BANDS[i] && n < PRICE_BANDS[i + 1]) return `${PRICE_BANDS[i]}-${PRICE_BANDS[i + 1]}`;
  }
  return null;
}

const consentOf = (actor) => {
  if (!actor || (actor.role !== "owner" && actor.role !== "mechanic")) return false;
  const table = actor.role === "owner" ? "owners" : "mechanics";
  const row = db.prepare(`SELECT recsConsent FROM ${table} WHERE id = ?`).get(actor.id);
  return !!row?.recsConsent;
};

const upsertSignal = db.prepare(`
  INSERT INTO taste_signals (userId, role, kind, value, weight, updatedAt)
  VALUES (@userId, @role, @kind, @value, @weight, datetime('now'))
  ON CONFLICT(userId, role, kind, value) DO UPDATE SET
    weight = MIN(weight + @weight, 50),   -- üst sınır: bir markaya 200 kez bakmak profili ele geçirmesin
    updatedAt = datetime('now')`);

function addSignals(actor, pairs, actionWeight) {
  if (!pairs.length) return 0;
  const write = db.transaction(() => {
    for (const [kind, value] of pairs) {
      if (!value) continue;
      upsertSignal.run({
        userId: actor.id, role: actor.role, kind,
        value: String(value).slice(0, 60), weight: actionWeight * (KIND_WEIGHT[kind] || 1) / 3,
      });
    }
  });
  write();
  return pairs.length;
}

/**
 * SİNYAL KAYDI. İstemci "şuna baktım" der; NE saklanacağına sunucu karar verir.
 * İstemcinin gönderdiği özelliklere güvenmiyoruz: ilan kimliğinden kaydı kendimiz okuyoruz.
 * Aksi halde biri profiline istediği değerleri yazdırabilirdi (öneri sıralamasını manipüle etmek
 * ya da başka birinin profilini kirletmek için).
 */
recommendationsRouter.post("/signal", (req, res) => {
  const actor = resolveActor(req);
  if (!actor) return res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." });
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  if (signalLimiter.check(ip).blocked) return res.status(429).json({ error: "Çok fazla istek." });
  signalLimiter.registerFailure(ip);

  // İZİN YOKSA HİÇBİR ŞEY YAZILMAZ. Ve bunu istemciye açıkça söylüyoruz ki arayüz
  // "kişiselleştirme kapalı" durumunu doğru gösterebilsin.
  if (!consentOf(actor)) return res.json({ stored: false, reason: "noConsent" });

  const action = ACTION_WEIGHT[req.body?.action] ? req.body.action : "view";
  const weight = ACTION_WEIGHT[action];
  const pairs = [];

  const listingId = Number(req.body?.listingId);
  if (Number.isInteger(listingId) && listingId > 0) {
    const l = db.prepare(`SELECT brand, fuelType, transmission, bodyType, city, price FROM listings WHERE id = ?`).get(listingId);
    if (l) {
      for (const f of LISTING_FEATURES) pairs.push([f, l[f]]);
      pairs.push(["priceBand", priceBandOf(l.price)]);
    }
  }
  const mechanicId = Number(req.body?.mechanicId);
  if (Number.isInteger(mechanicId) && mechanicId > 0) {
    const m = db.prepare(`SELECT specialty, address FROM mechanics WHERE id = ?`).get(mechanicId);
    if (m?.specialty) for (const part of String(m.specialty).split(",")) pairs.push(["specialty", part.trim()]);
  }
  // Aramada kullanıcı ne aradığını KENDİ yazıyor; bu en açık niyet beyanı. Yine de yalnızca
  // bilinen alanları alıyoruz — serbest metin sorgusu saklanmıyor (kişisel bilgi içerebilir).
  if (req.body?.search && typeof req.body.search === "object") {
    const { brand, fuelType, transmission, bodyType, city, service } = req.body.search;
    for (const [k, v] of Object.entries({ brand, fuelType, transmission, bodyType, city, service })) {
      if (typeof v === "string" && v.trim()) pairs.push([k === "service" ? "service" : k, v.trim()]);
    }
  }

  const n = addSignals(actor, pairs, weight);
  res.json({ stored: n > 0, signals: n });
});

/** RIZA. Kapatmak yalnızca durdurmaz — birikmiş profili de siler. */
recommendationsRouter.post("/consent", (req, res) => {
  const actor = resolveActor(req);
  if (!actor) return res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." });
  if (actor.role !== "owner" && actor.role !== "mechanic") return res.status(403).json({ error: "Bu işlem için yetkiniz yok." });
  const enabled = req.body?.enabled === true;
  const table = actor.role === "owner" ? "owners" : "mechanics";
  let deleted = 0;
  db.transaction(() => {
    db.prepare(`UPDATE ${table} SET recsConsent = ?, recsConsentAt = ? WHERE id = ?`)
      .run(enabled ? 1 : 0, enabled ? new Date().toISOString() : null, actor.id);
    if (!enabled) {
      deleted = db.prepare(`DELETE FROM taste_signals WHERE userId = ? AND role = ?`).run(actor.id, actor.role).changes;
    }
  })();
  res.json({ enabled, deletedSignals: deleted });
});

/** "Hakkımda ne tutuyorsunuz?" — profilin tamamı, okunabilir hâlde. */
recommendationsRouter.get("/profile", (req, res) => {
  const actor = resolveActor(req);
  if (!actor) return res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." });
  const signals = db.prepare(
    `SELECT kind, value, ROUND(weight, 2) AS weight, updatedAt FROM taste_signals
     WHERE userId = ? AND role = ? ORDER BY weight DESC, kind`
  ).all(actor.id, actor.role);
  res.json({ consent: consentOf(actor), signals });
});

recommendationsRouter.delete("/profile", (req, res) => {
  const actor = resolveActor(req);
  if (!actor) return res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." });
  const deleted = db.prepare(`DELETE FROM taste_signals WHERE userId = ? AND role = ?`).run(actor.id, actor.role).changes;
  res.json({ deleted });
});

/**
 * ÜRÜN-ÜRÜN BENZERLİĞİ (Amazon item-to-item): "bu ilana bakanlar şuna da baktı".
 * Anonim oturum akışından hesaplanıyor — kullanıcıyı profillemiyor, bu yüzden izin gerektirmiyor.
 * Son 60 günle sınırlı: altı ay önce satılmış bir arabaya bakanların davranışı bugünü açıklamaz.
 */
function coViewed(listingIds, limit) {
  if (!listingIds.length) return [];
  const placeholders = listingIds.map(() => "?").join(",");
  return db.prepare(`
    SELECT b.targetId AS id, COUNT(DISTINCT b.sessionId) AS n
    FROM analytics_events a
    JOIN analytics_events b ON a.sessionId = b.sessionId AND b.name = 'listing_view'
    WHERE a.name = 'listing_view' AND a.targetId IN (${placeholders})
      AND b.targetId NOT IN (${placeholders})
      AND a.sessionId IS NOT NULL
      AND a.createdAt >= datetime('now', '-60 days')
    GROUP BY b.targetId
    HAVING n >= 2      -- tek bir kişinin gezintisi "benzerlik" değildir
    ORDER BY n DESC
    LIMIT ?`).all(...listingIds, ...listingIds, limit);
}

/** Zamanla unutma: bir ay önceki ilgi, dünkü kadar güçlü değil. */
const recencyFactor = (updatedAt) => {
  const days = Math.max(0, (Date.now() - new Date(`${updatedAt}Z`).getTime()) / 86_400_000);
  return Number.isFinite(days) ? 1 / (1 + days / 30) : 1;
};

recommendationsRouter.get("/", (req, res) => {
  const actor = resolveActor(req);
  const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 24);
  const hasConsent = consentOf(actor);
  const signals = hasConsent
    ? db.prepare(`SELECT kind, value, weight, updatedAt FROM taste_signals WHERE userId = ? AND role = ?`).all(actor.id, actor.role)
    : [];

  // Kendi ilanını sana önermek anlamsız; satılmış/kaldırılmış ilan da öyle.
  const candidates = db.prepare(
    `SELECT * FROM listings WHERE (status IS NULL OR status = 'active') AND (adminRemoved IS NULL OR adminRemoved = 0)
     AND (sellerId IS NULL OR sellerId != ? OR sellerType != ?)`
  ).all(actor?.id ?? -1, actor?.role ?? "");

  const byKind = new Map();
  for (const s of signals) {
    const key = `${s.kind}:${s.value}`;
    byKind.set(key, (byKind.get(key) || 0) + s.weight * recencyFactor(s.updatedAt));
  }

  const scored = candidates.map((l) => {
    let score = 0;
    let best = null;
    const attrs = [...LISTING_FEATURES.map((f) => [f, l[f]]), ["priceBand", priceBandOf(l.price)]];
    for (const [kind, value] of attrs) {
      if (!value) continue;
      const w = byKind.get(`${kind}:${value}`);
      if (!w) continue;
      score += w;
      if (!best || w > best.weight) best = { kind, value, weight: w };
    }
    return { listing: l, score, best };
  });

  let picked = [];
  if (hasConsent && scored.some((x) => x.score > 0)) {
    picked = scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, limit)
      .map((x) => ({ ...hydrate("listings", x.listing), recommendReason: { type: "taste", kind: x.best.kind, value: x.best.value } }));
  }

  /**
   * Kişisel profil yoksa ya da az sonuç verdiyse ürün-ürün benzerliğiyle tamamlıyoruz. Bu kısım
   * herkes için çalışıyor: yeni kullanıcı ilk günden boş ekran görmesin (soğuk başlangıç).
   */
  if (picked.length < limit) {
    const seedIds = hasConsent
      ? scored.filter((x) => x.score > 0).slice(0, 5).map((x) => x.listing.id)
      : (req.query.seed ? String(req.query.seed).split(",").map(Number).filter(Number.isInteger).slice(0, 5) : []);
    const already = new Set(picked.map((p) => p.id));
    if (seedIds.length) {
      for (const row of coViewed(seedIds, limit)) {
        if (already.has(row.id) || picked.length >= limit) continue;
        const l = candidates.find((c) => c.id === row.id);
        if (!l) continue;
        already.add(l.id);
        picked.push({ ...hydrate("listings", l), recommendReason: { type: "coViewed", count: row.n } });
      }
    }
    // Son çare: çok bakılan güncel ilanlar. Kişisel değil ama boş ekrandan iyi ve dürüstçe
    // "popüler" diye etiketleniyor — kullanıcı bunu kişiselleştirme sanmasın.
    if (picked.length < limit) {
      const popular = db.prepare(`
        SELECT targetId AS id, COUNT(*) n FROM analytics_events
        WHERE name = 'listing_view' AND createdAt >= datetime('now', '-30 days')
        GROUP BY targetId ORDER BY n DESC LIMIT 50`).all();
      const order = new Map(popular.map((p, i) => [p.id, i]));
      const rest = candidates
        .filter((c) => !already.has(c.id))
        .sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999) || (b.shareCount || 0) - (a.shareCount || 0));
      for (const l of rest) {
        if (picked.length >= limit) break;
        already.add(l.id);
        picked.push({ ...hydrate("listings", l), recommendReason: { type: "popular" } });
      }
    }
  }

  res.json({
    personalized: hasConsent && picked.some((p) => p.recommendReason?.type === "taste"),
    consent: hasConsent,
    listings: picked,
  });
});

export default recommendationsRouter;
