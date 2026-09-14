/**
 * MEDYA ALANI DOĞRULAMA — SUNUCU TARAFI.
 * ================================================================================================
 * NEDEN VAR (performans denetiminde ölçüldü):
 * Bu projede dosya yükleme yok; fotoğraflar tarayıcıda base64 `data:` URI'sine çevrilip normal bir
 * JSON alanı gibi SQLite'ın TEXT sütununa yazılıyor. Jenerik CRUD fabrikası bu sütunlara yazarken
 * HİÇBİR boyut ya da tür kontrolü yapmıyordu. Tek sınır `express.json({limit:"5mb"})` idi.
 *
 * Bunun ölçülen sonucu: 10 ilan × 6 sıkıştırılmış fotoğraf = 14,67 MB'lık tek bir JSON yanıtı ve
 * 13,45 MB'lık veritabanı dosyası. 200.000 fotoğrafta tahmini ~45 GB tek SQLite dosyası.
 *
 * İki ayrı risk kapanıyor:
 *   1) DEPOLAMA TÜKENMESİ: bir hesap, betikle istek başına 5 MB yazarak veritabanını şişirebilirdi.
 *   2) SVG: `data:image/svg+xml` script taşıyabilir. `<img src>` içinde çalışmaz ama bağlantı
 *      olarak açılırsa çalışır. safeHref istemcide SVG'yi reddediyor (iyi) ama DEPOLAMAYA
 *      girmesini engelleyen hiçbir şey yoktu — yani veri zaten içerideyken yeni bir gösterim
 *      yolu eklendiği an açık oluşurdu. Kabul etmemek, göstermemekten daha sağlamdır.
 *
 * TASARIM İLKESİ — MEVCUT VERİYİ BOZMAMAK:
 * Bu alanlar bugün ÜÇ farklı biçim tutuyor ve üçü de meşru:
 *   - emoji ("🔧", "👩‍🦰")          → `mechanics.img`, yorum `avatar` alanları
 *   - https adresi                  → tohum verisindeki kapak/galeri fotoğrafları
 *   - data: URI                     → kullanıcı yüklemeleri
 * Doğrulama üçünü de kabul ediyor. Yalnızca ZARARLI ya da AŞIRI BÜYÜK olanı reddediyor.
 * Kısıt "reddetme" yönünde çalıştığı için mevcut hiçbir kayıt etkilenmiyor: eski satırlar okunmaya
 * devam ediyor, yalnızca YENİ yazmalar süzülüyor.
 */

/** Base64 bir data URI'nin yaklaşık ikili boyutu (base64 %33 şişirir). */
export const approxBytes = (dataUri) => Math.floor(String(dataUri || "").length * 0.75);

/**
 * BOYUT TAVANLARI — neden bu değerler:
 * İstemci ilan fotoğraflarını 1600px / JPEG q0.78'e indiriyor; bu tipik olarak 200-500 KB veriyor.
 * Tavanı 2 MB (ikili) yaptım: meşru bir yüklemenin 4 katı, yani sıkıştırmayı atlayan bir istemciyi
 * bile kabul ediyor ama 5 MB'lık ham telefon fotoğrafını reddediyor. Amaç kullanıcıyı engellemek
 * değil, sınırsız yazmayı engellemek.
 *
 * Profil ve avatar daha küçük: bu görseller ekranda 40-120px gösteriliyor, 2 MB'lık bir profil
 * fotoğrafının hiçbir karşılığı yok.
 */
const LIMITS = {
  single: 2 * 1024 * 1024,      // tek görsel (ikili karşılık)
  avatar: 1 * 1024 * 1024,      // profil / avatar — ekranda en fazla 120px
  document: 4 * 1024 * 1024,    // CV / doğrulama belgesi (PDF olabilir)
  arrayTotal: 12 * 1024 * 1024, // bir dizinin TOPLAMI (ör. 15 galeri fotoğrafı)
  arrayCount: 20,               // dizideki en fazla öğe
};

/** İzinli data URI türleri. SVG KASITLI OLARAK YOK — script taşıyabiliyor. */
const IMAGE_MIME = /^data:image\/(jpeg|jpg|png|webp|gif|avif);base64,/i;
/** Belge alanları PDF de kabul ediyor (CV yüklemesi PDF olarak geliyor). */
const DOC_MIME = /^data:(image\/(jpeg|jpg|png|webp|gif|avif)|application\/pdf);base64,/i;

/**
 * HANGİ SÜTUNLAR MEDYA?
 * Liste elle yazıldı çünkü "adında photo geçen her sütun" tahmini yanlış olurdu: `photo` sütunu
 * `mechanic_reviews`'da BOOLEAN (fotoğraf var mı), `listings`'te ise görselin kendisi.
 * `kind`: "image" | "avatar" | "document", `array`: değer bir JSON dizisi mi.
 */
const MEDIA_FIELDS = {
  mechanics: {
    img: { kind: "avatar" },
    coverPhoto: { kind: "image" },
    verificationDocs: { kind: "document", array: true },
  },
  owners: {
    photo: { kind: "avatar" },
  },
  listings: {
    photo: { kind: "image" },
    photos: { kind: "image", array: true },
  },
  appointments: {
    issuePhotos: { kind: "image", array: true },
  },
  quote_requests: {
    photos: { kind: "image", array: true },
  },
  blog_posts: {
    coverPhoto: { kind: "image" },
  },
  career_posts: {
    coverPhoto: { kind: "image" },
  },
};

const limitFor = (kind) => (kind === "avatar" ? LIMITS.avatar : kind === "document" ? LIMITS.document : LIMITS.single);
const mimeFor = (kind) => (kind === "document" ? DOC_MIME : IMAGE_MIME);

/**
 * TEK BİR DEĞERİ DOĞRULA. Dönüş: hata metni ya da null.
 *
 * data: URI OLMAYAN değerler (emoji, https adresi, boş metin) uzunluk dışında denetlenmiyor —
 * onlar zaten veri taşımıyor, yalnızca işaret ediyor. Adres güvenliği istemcide safeHref ile
 * ayrıca süzülüyor (bkz. frontend/src/utils/helpers.ts).
 */
export function validateMediaValue(value, kind = "image") {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return "Görsel alanı metin olmalı.";

  if (!value.startsWith("data:")) {
    // Emoji, https adresi ya da kısa etiket. Sınırsız metin de kabul edilmemeli.
    if (value.length > 2048) return "Görsel adresi çok uzun.";
    return null;
  }
  if (!mimeFor(kind).test(value)) {
    // SVG ve diğer türler burada düşüyor. Mesaj, SEBEBİ söylüyor: kullanıcı neyin kabul
    // edildiğini bilmeden dosyayı değiştirmeyi deneyemez.
    return kind === "document"
      ? "Yalnızca JPEG, PNG, WebP, GIF ya da PDF yükleyebilirsiniz."
      : "Yalnızca JPEG, PNG, WebP, GIF ya da AVIF görsel yükleyebilirsiniz (SVG kabul edilmiyor).";
  }
  const bytes = approxBytes(value);
  const max = limitFor(kind);
  if (bytes > max) {
    return `Görsel çok büyük (${Math.round(bytes / 1024 / 1024 * 10) / 10} MB). En fazla ${Math.round(max / 1024 / 1024)} MB olabilir.`;
  }
  return null;
}

/**
 * BİR TABLONUN GÖVDESİNİ DOĞRULA — jenerik CRUD yazma yolundan çağrılıyor.
 * Gövdede o alan YOKSA hiç bakılmıyor: kısmi güncelleme (PATCH) bozulmasın.
 */
export function validateMediaBody(table, body) {
  const spec = MEDIA_FIELDS[table];
  if (!spec) return null;
  for (const [field, { kind, array }] of Object.entries(spec)) {
    if (!(field in body)) continue;
    const value = body[field];
    if (value == null) continue;

    if (array) {
      // dehydrate() diziyi JSON metnine çevirdiği için hem dizi hem metin gelebilir.
      let list = value;
      if (typeof value === "string") { try { list = JSON.parse(value); } catch { continue; } }
      if (!Array.isArray(list)) continue;
      if (list.length > LIMITS.arrayCount) return `${field}: en fazla ${LIMITS.arrayCount} görsel eklenebilir.`;
      let total = 0;
      for (const item of list) {
        // Dizi öğeleri ya düz metin (adres/data URI) ya da { url }/{ cvUrl } gibi nesne olabilir.
        const raw = typeof item === "string" ? item : (item?.url ?? item?.cvUrl ?? item?.dataUrl ?? null);
        if (raw == null) continue;
        const err = validateMediaValue(raw, kind);
        if (err) return `${field}: ${err}`;
        if (String(raw).startsWith("data:")) total += approxBytes(raw);
      }
      if (total > LIMITS.arrayTotal) {
        return `${field}: görsellerin toplamı çok büyük (${Math.round(total / 1024 / 1024)} MB). En fazla ${Math.round(LIMITS.arrayTotal / 1024 / 1024)} MB olabilir.`;
      }
      continue;
    }

    const err = validateMediaValue(value, kind);
    if (err) return `${field}: ${err}`;
  }
  return null;
}

/** Bir gövdede data: URI olarak gömülü medya var mı? (Hız sınırı yalnızca bunlara uygulanıyor.) */
export function bodyCarriesMedia(table, body) {
  const spec = MEDIA_FIELDS[table];
  if (!spec) return false;
  for (const field of Object.keys(spec)) {
    const value = body?.[field];
    if (typeof value === "string" && value.includes("data:")) return true;
    if (Array.isArray(value) && value.some((v) => typeof v === "string" && v.startsWith("data:"))) return true;
  }
  return false;
}

export const MEDIA_LIMITS = LIMITS;
export const MEDIA_FIELD_SPEC = MEDIA_FIELDS;
