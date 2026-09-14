import { Router } from "express";
import fs from "node:fs";
import { resolveActor } from "../utils/auth.js";
import { makeRateLimiter } from "../utils/rateLimiter.js";
import { rateLimitKey } from "../utils/clientIp.js";
import { storeDataUri, resolveMedia, MediaError, MEDIA_NAME_RE } from "../utils/mediaStore.js";
import { MEDIA_LIMITS } from "../utils/mediaValidation.js";

/**
 * MEDYA UÇLARI (Faz 4).
 * ================================================================================================
 * İKİ UÇ, İKİ FARKLI DÜNYA:
 *   POST /api/media   → yazma. Kimlik doğrulaması ZORUNLU, hız sınırlı, cache'lenmez.
 *   GET  /media/:name → okuma. Kimlik doğrulaması YOK, bir yıl `immutable` cache.
 *
 * Okumanın kimlik doğrulamasız olması bir gözden kaçma değil, bu işin BÜTÜN AMACI: kimlik
 * doğrulamalı bir yanıt cache'lenemez. Kapsam bu yüzden yalnızca HERKESE AÇIK görsellerle
 * sınırlı — gerekçesi ve neyin dışarıda bırakıldığı utils/mediaStore.js başında yazılı.
 *
 * MEVCUT SİSTEME ETKİSİ: SIFIR. Bu dosya yalnızca EKLİYOR. Veritabanındaki `data:` URI'ler
 * olduğu gibi kalıyor ve çalışmaya devam ediyor; `<img src>` hem `data:` hem `http(s):` kabul
 * ettiği için okuma yolunda tek satır değişmesi gerekmiyor. Yani bu uç bozulursa ya da hiç
 * kullanılmazsa site eskisi gibi çalışır.
 */

export const mediaRouter = Router();

/**
 * YAZMA HIZ SINIRI — İKİ KATMAN, VE BİRİNCİSİ KULLANICI BAŞINA.
 * ================================================================================================
 * NEDEN KULLANICI BAŞINA (bu testte fark edildi):
 * Projedeki diğer bütün sınırlar IP başına ve orada bu DOĞRU: giriş, OTP ve kayıt sınırlarının
 * işi kaba kuvvet denemesini durdurmak, saldırganın da kimliği yok — elimizdeki tek tutamak IP.
 * Burada durum farklı: yükleme KİMLİK DOĞRULAMALI, yani kimin yüklediğini biliyoruz. IP'ye
 * bakmak bu durumda yanlış kişiyi cezalandırıyor — aynı ofiste, aynı okulda ya da aynı mobil
 * operatörün NAT'ı arkasındaki kullanıcılar tek bir kotayı paylaşıyor. Biri 15 fotoğraflı bir
 * ilan yüklediğinde yanındaki masadaki kişi 429 alıyor. Kimliği bildiğimiz halde IP'ye bakmak,
 * elimizdeki daha iyi bilgiyi kullanmamak demek.
 *
 * NEDEN İKİNCİ KATMAN DA VAR:
 * Yalnızca kullanıcı başına sınır, çok hesap açıp kotayı çarpmaya açık kalırdı. Bu yüzden daha
 * GENİŞ bir IP tavanı da duruyor: aynı NAT arkasındaki birkaç gerçek kullanıcıyı rahat geçiriyor
 * ama 50 hesapla betik çalıştıran birini yakalıyor. Hesap açmanın kendi IP sınırı da var
 * (REGISTER_LIMIT_PER_HOUR), yani katmanlar birbirini tamamlıyor.
 *
 * SAYILAR: kullanıcı başına dakikada 20 (arayüz tek seferde en fazla 15 galeri fotoğrafı
 * gönderiyor, yani meşru en yüksek kullanımın üstünde), IP başına dakikada 60.
 * CRUD yolundaki sınırdan (dakikada 30) daha dar olmasının sebebi: orada bir istek bir SATIR
 * güncelliyor, burada her istek diske YENİ bir dosya yazıyor.
 */
const userLimiter = makeRateLimiter({
  maxAttempts: Number(process.env.MEDIA_UPLOAD_LIMIT_PER_USER) || 20,
  lockoutMs: 15 * 60 * 1000,
  windowMs: 60 * 1000,
});
const ipLimiter = makeRateLimiter({
  maxAttempts: Number(process.env.MEDIA_UPLOAD_LIMIT_PER_IP) || 60,
  lockoutMs: 15 * 60 * 1000,
  windowMs: 60 * 1000,
});

/** Tavanlar tek kaynaktan (mediaValidation.js) — istemci, CRUD ve bu uç aynı sayıları kullanıyor. */
const MAX_BY_KIND = Object.assign(Object.create(null), {
  image: MEDIA_LIMITS.single,
  avatar: MEDIA_LIMITS.avatar,
});

/**
 * ADRESİN TABANI.
 * Ön yüz API'ye MUTLAK adresle bağlanıyor (VITE_API_URL, geliştirmede localhost:4000), yani
 * göreli bir `/media/...` adresi ön yüzün kendi kökenine çözülür ve 404 verir. Bu yüzden mutlak
 * adres dönüyoruz. Veritabanındaki diğer görsel değerleri de zaten mutlak (tohum verisindeki
 * https adresleri), yani biçim tutarlı kalıyor.
 *
 * DÜRÜST SINIR: mutlak adres saklamak, alan adı değişirse eski adreslerin kırılması demektir.
 * Kabul edilebilir bir bedel, çünkü düzeltmesi tek bir SQL UPDATE ... REPLACE(...) — ve
 * alternatifi (göreli yol saklamak) ham `src={...}` kullanan 14 çizim noktasının hepsine ön ek
 * eklemeyi gerektirirdi; biri atlanırsa kırık görsel oluşur ve bu daha sinsi bir hata olurdu.
 * PUBLIC_MEDIA_BASE verilirse (ör. CDN alan adı) o kullanılıyor.
 */
function mediaBase(req) {
  const configured = process.env.PUBLIC_MEDIA_BASE;
  if (configured) return String(configured).replace(/\/+$/, "");
  const proto = req.protocol;
  const host = req.get("host");
  return `${proto}://${host}`;
}

/**
 * POST /api/media — data URI gönder, kalıcı adres al.
 * Gövde: { data: "data:image/jpeg;base64,...", kind: "image" | "avatar" }
 */
mediaRouter.post("/", (req, res) => {
  const actor = resolveActor(req);
  // Anonim yükleme olsa bu uç bedava bir dosya barındırma servisine dönüşürdü.
  if (!actor) return res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." });

  // Rol de anahtarın içinde: owner #7 ile mechanic #7 farklı kişiler (bkz. makeCrudRouter).
  const userKey = `${actor.role}:${actor.id}`;
  const ipKey = rateLimitKey(req);
  if (userLimiter.check(userKey).blocked || ipLimiter.check(ipKey).blocked) {
    return res.status(429).json({ error: "Çok fazla görsel yüklemesi. Lütfen birkaç dakika sonra tekrar deneyin." });
  }

  const kind = req.body?.kind === "avatar" ? "avatar" : "image";
  const data = req.body?.data;
  if (typeof data !== "string" || !data.startsWith("data:")) {
    return res.status(400).json({ error: "Geçerli bir görsel gönderilmedi." });
  }

  // Sayaçlar her istekte artıyor, başarılı olsun olmasın: maliyet yalnızca diskte değil,
  // İŞLEMDE (çözme + imza + karma). Yalnızca başarılıları saymak, geçersiz gövdelerle aynı
  // işlemi bedavaya tekrarlatmaya izin verirdi.
  userLimiter.registerFailure(userKey);
  ipLimiter.registerFailure(ipKey);

  try {
    const stored = storeDataUri(data, { maxBytes: MAX_BY_KIND[kind] });
    return res.status(201).json({
      url: `${mediaBase(req)}/media/${stored.name}`,
      name: stored.name,
      bytes: stored.bytes,
      contentType: stored.contentType,
      // Aynı görsel daha önce yüklenmişse yeni dosya yazılmadı (içerik karması sayesinde).
      deduped: stored.deduped,
    });
  } catch (err) {
    if (err instanceof MediaError) return res.status(400).json({ error: err.message });
    // Diskin dolması ya da izin hatası: kullanıcıya suçu atmıyoruz, 500 doğru kod.
    console.error("[media] yazma hatası:", err?.message);
    return res.status(500).json({ error: "Görsel kaydedilemedi. Lütfen tekrar deneyin." });
  }
});

/**
 * GET /media/:name — dosyayı sun.
 *
 * `/api` ALTINDA DEĞİL, bilerek: bu yol bir gün doğrudan nginx'e ya da CDN'e verilebilsin.
 * O gün geldiğinde uygulamada değişecek tek şey PUBLIC_MEDIA_BASE olur.
 */
export const mediaFileRouter = Router();

mediaFileRouter.get("/:name", (req, res) => {
  const { name } = req.params;
  /**
   * TEK GÜVENLİK DENETİMİ BU DESEN ve yeterli olmasının sebebi, adın kullanıcıdan gelen bir
   * dosya adı DEĞİL, içerikten üretilmiş 32 onaltılık karakter olması. `..`, `/`, `%2e%2e`,
   * boş bayt — hiçbiri bu deseni geçemez. Dosya adını "temizlemeye" çalışan kodlar atlanabilir;
   * beklenen biçimi TANIMLAYAN kod atlanamaz.
   */
  if (!MEDIA_NAME_RE.test(String(name || ""))) {
    return res.status(404).json({ error: "Bulunamadı." });
  }
  const found = resolveMedia(name);
  if (!found) return res.status(404).json({ error: "Bulunamadı." });

  /**
   * BİR YIL, `immutable`. Bu ancak içerik karması adlandırma ile DÜRÜST bir söz: o adreste duran
   * baytlar asla değişmeyecek, çünkü değişirlerse adres de değişir. Sabit adlı bir dosyada aynı
   * başlığı vermek, kullanıcının bir yıl boyunca eski fotoğrafı görmesi anlamına gelirdi.
   */
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  // Tür UZANTIDAN, dosyanın içinden ya da istekten değil.
  res.setHeader("Content-Type", found.contentType);
  res.setHeader("Content-Length", String(found.size));
  /**
   * nosniff: tarayıcı Content-Type'ı tahminle değiştirmesin. Görsel olarak sunulan bir dosya
   * içeriği yüzünden HTML sanılıp çalıştırılmasın — imza denetimi zaten var, bu ikinci hat.
   */
  res.setHeader("X-Content-Type-Options", "nosniff");
  /**
   * Bu yanıt için CSP: dosya doğrudan açıldığında (adres çubuğuna yazılarak) hiçbir alt kaynak
   * yükleyememesi ve script çalıştıramaması gerekiyor. Görsel için hiçbir şey kaybetmiyoruz.
   */
  res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self'; sandbox");
  // CORS: görseller `<img>` ile yükleniyor, o CORS gerektirmiyor. Ama canvas/fetch ile okumak
  // isteyen bir yol olursa engellenmesin diye okumaya açık bırakıyoruz — içerik zaten herkese açık.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  const stream = fs.createReadStream(found.full);
  /**
   * Akış hatası (dosya okunurken silinmesi, disk hatası): başlıklar GİTMİŞ olabilir, o yüzden
   * durum kodu değiştirilemez. Yapılacak tek doğru şey bağlantıyı kapatmak — yarım bir görseli
   * "başarılı" diye bitirmek, tarayıcıda bozuk bir dosyanın cache'lenmesine yol açardı.
   */
  stream.on("error", () => { res.destroy(); });
  stream.pipe(res);
});

export default mediaRouter;
