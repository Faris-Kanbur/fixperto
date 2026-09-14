import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * MEDYA DEPOSU — İÇERİK KARMASI ADLI DOSYALAR.
 * ================================================================================================
 * NEDEN VAR (performans denetiminin ASIL bulgusu):
 * Fotoğraflar bugün veritabanının İÇİNDE, base64 metin olarak duruyor. Bunun ölçülen sonucu
 * 14,67 MB'lık tek bir JSON yanıtıydı. Ama asıl kısıt boyut değil, ŞU: kimlik doğrulamalı,
 * dinamik bir JSON yanıtının içine gömülü bir görsel CACHE'LENEMEZ. Ne tarayıcı önbelleği, ne
 * CDN, ne `immutable` — hiçbiri çalışmaz, çünkü görselin kendi adresi yok. "CDN ekleyelim"
 * demek bu mimaride işe yaramaz; cache'lenecek ayrı bir kaynak yoktur. Bu dosya o adresi
 * yaratıyor.
 *
 * NEDEN İÇERİK KARMASI (sha256) DOSYA ADI — üç sorunu birden çözüyor:
 *
 *   1. CACHE GEÇERSİZLEŞTİRME SORUNU HİÇ OLUŞMUYOR. Dosya adı içeriğin karması olduğu için
 *      içerik değişince ADRES de değişir. Yani `Cache-Control: immutable` ve bir yıllık süre
 *      DÜRÜSTÇE verilebilir: o adreste duran bayt dizisi asla değişmeyecek. Kullanıcı profil
 *      fotoğrafını değiştirdiğinde eski dosya cache'te kalsa bile kimse ona bakmaz, çünkü
 *      veritabanındaki adres artık yenisini gösteriyor.
 *
 *   2. YOL ATLAMA (path traversal) YAPISAL OLARAK İMKÂNSIZ. Kullanıcının verdiği dosya adı HİÇ
 *      KULLANILMIYOR — ne kaydederken ne sunarken. Ad, içerikten türetilen 32 onaltılık karakter.
 *      "../../etc/passwd" diye bir ad üretilemez çünkü ad kullanıcıdan gelmiyor. Bu, dosya adını
 *      temizlemeye (sanitize) çalışmaktan çok daha sağlam: temizleme atlanabilir, üretme atlanamaz.
 *
 *   3. TEKRARLANAN DOSYA BİR KEZ SAKLANIYOR. Aynı görseli iki kullanıcı yüklerse karma aynı
 *      olur, dosya bir kez yazılır. Bedava tekilleştirme.
 *
 * 32 ONALTILIK KARAKTER = 128 bit. Çakışma olasılığı bu ölçekte (milyarlarca dosyada bile)
 * yok sayılabilir; tam 64 karakter kullanmamanın sebebi yalnızca adresleri okunabilir tutmak.
 * Ayrıca 128 bit TAHMİN EDİLEMEZ olmayı da sağlıyor — adres sızmadığı sürece kimse rastgele
 * deneyerek bir dosya bulamaz.
 *
 * SADECE GÖRSEL — BELGELER KASITLI OLARAK BURADA DEĞİL:
 * Bu uçtan sunulan dosyalar KİMLİK DOĞRULAMASIZ okunabiliyor (cache'lenebilir olmanın koşulu bu).
 * Bugün herkese açık olan görseller için bu bir değişiklik DEĞİL: bir ilan fotoğrafı ya da
 * tamirci kapak görseli zaten anonim ziyaretçiye gönderiliyor. Ama CV, doğrulama belgesi, sohbet
 * fotoğrafı, arıza ve teklif fotoğrafı BÖYLE DEĞİL — onlar bugün yalnızca erişim denetimli JSON
 * içinde dönüyor. Onları tahmin edilemez ama herkese açık bir adrese taşımak bir GÜVENLİK
 * GERİLEMESİ olurdu: adres bir kez sızarsa (referrer başlığı, tarayıcı geçmişi, günlük, ekran
 * görüntüsü paylaşımı) kişisel veri kimlik doğrulaması olmadan okunur.
 * Bu yüzden kapsam bilinçli olarak DARALTILDI. Performans kazancının neredeyse tamamı zaten
 * herkese açık görsellerde: büyük liste yanıtlarını (/api/listings, /api/mechanics) şişiren
 * ve CDN'in cache'leyebileceği tek küme onlar. Özel görseller küçük, istek başına tek kayıt
 * döndüren uçlarda.
 * Özel medya için doğru çözüm ayrı bir iş: sahiplik denetimi yapan kimlik doğrulamalı bir uç
 * (cache'lenemez, CDN'e verilemez). Bugün gerekmiyor, çünkü oradaki yük ölçülebilir değil.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * DEPO KLASÖRÜ. Varsayılan olarak veritabanı dosyasının YANINDA: yedekleme ve taşıma açısından
 * ikisinin birlikte durması gerekiyor — veritabanı adresleri, klasör baytları tutuyor. Biri
 * yedeklenip diğeri yedeklenmezse sonuç, tamamı kaybolmaktan daha kötü: kırık görsellerle dolu
 * ama "çalışıyor" görünen bir site.
 */
export function mediaDir() {
  if (process.env.FIXPERTO_MEDIA_DIR) return process.env.FIXPERTO_MEDIA_DIR;
  const dbPath = process.env.FIXPERTO_DB_PATH || path.join(__dirname, "..", "db", "fixperto.sqlite");
  return path.join(path.dirname(dbPath), "media");
}

/** İzinli türler ve uzantıları. TEK YÖNLÜ eşleme: uzantı buradan gelir, kullanıcıdan gelmez. */
const EXT_BY_MIME = Object.assign(Object.create(null), {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
});

/**
 * SUNARKEN KULLANILAN Content-Type. Uzantıdan türetiliyor, dosyanın içinden ya da istekten DEĞİL.
 * `image/svg+xml` bu tabloda YOK — dolayısıyla SVG ne saklanabilir ne sunulabilir (script taşır).
 */
const MIME_BY_EXT = Object.assign(Object.create(null), {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
});

/** Sunulabilir dosya adı deseni. Bu desen dışındaki HİÇBİR şey diske dokunmuyor. */
export const MEDIA_NAME_RE = /^[0-9a-f]{32}\.(jpg|png|webp|gif|avif)$/;

/**
 * DOSYA SİSTEMİNDEKİ yol. Adres düz (`/media/<ad>`) ama disk PARÇALI: ilk iki karakter alt klasör
 * oluyor. Sebebi tek bir klasörde yüz binlerce dosya biriktiğinde dizin okumanın yavaşlaması
 * (ve `ls` gibi araçların kullanılamaz hâle gelmesi). Adresi parçalamamanın sebebi ise adresin
 * veritabanında SAKLANIYOR olması: disk düzenini değiştirmek istediğimizde kayıtlı adreslerin
 * değişmesi gerekmesin.
 */
function pathForName(name) {
  return path.join(mediaDir(), name.slice(0, 2), name);
}

/** Data URI'yi ikili veriye çevir. Geçersizse null — asla kısmi/çöp veri yazılmıyor. */
function decodeDataUri(dataUri) {
  const m = /^data:([a-z0-9/+.-]+);base64,(.*)$/is.exec(String(dataUri || ""));
  if (!m) return null;
  const mime = m[1].toLowerCase();
  const ext = EXT_BY_MIME[mime];
  if (!ext) return null;
  let buf;
  try { buf = Buffer.from(m[2], "base64"); } catch { return null; }
  if (!buf || buf.length === 0) return null;
  return { buf, ext, mime };
}

/**
 * İMZA (magic bytes) DENETİMİ.
 * NEDEN: MIME türü İSTEMCİDEN geliyor. `data:image/png;base64,<aslında bir HTML dosyası>` yazmak
 * hiçbir şey engellemiyor. Uzantıyı ve Content-Type'ı o yalana göre verirsek, `nosniff` olmayan
 * bir istemcide ya da dosyayı indirip açan birinde içerik farklı yorumlanabilir. Bu yüzden
 * baytların KENDİSİNE bakıyoruz: iddia edilen tür dosyanın gerçek imzasıyla uyuşmuyorsa reddediyoruz.
 * Bu, "kullanıcıdan gelen etikete güvenme" kuralının dosya içeriğine uygulanmış hâli.
 */
function sniff(buf) {
  const b = buf;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b.length >= 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (b.length >= 6 && b.toString("ascii", 0, 3) === "GIF") return "gif";
  // AVIF/HEIF: ISO-BMFF kutusu — 4..8 "ftyp", ardından marka.
  if (b.length >= 12 && b.toString("ascii", 4, 8) === "ftyp") {
    const brand = b.toString("ascii", 8, 12);
    if (/^(avif|avis|mif1|msf1)$/.test(brand)) return "avif";
  }
  return null;
}

export class MediaError extends Error {}

/**
 * BİR DATA URI'Yİ DEPOYA YAZ.
 * Dönüş: { name, bytes, contentType, deduped }.
 * Hata: MediaError (kullanıcıya gösterilebilir metinle).
 *
 * `maxBytes` çağırandan geliyor çünkü tavan kullanım yerine göre farklı (profil 1 MB, ilan 2 MB);
 * tavanların kendisi backend/utils/mediaValidation.js'te, tek kaynakta.
 */
export function storeDataUri(dataUri, { maxBytes }) {
  const decoded = decodeDataUri(dataUri);
  if (!decoded) {
    throw new MediaError("Yalnızca JPEG, PNG, WebP, GIF ya da AVIF görsel yükleyebilirsiniz (SVG kabul edilmiyor).");
  }
  const { buf, ext } = decoded;
  if (buf.length > maxBytes) {
    throw new MediaError(`Görsel çok büyük (${Math.round((buf.length / 1024 / 1024) * 10) / 10} MB). En fazla ${Math.round(maxBytes / 1024 / 1024)} MB olabilir.`);
  }
  const actual = sniff(buf);
  if (!actual) throw new MediaError("Dosya tanınmadı. Lütfen geçerli bir görsel seçin.");
  // jpg/jpeg aynı imza; onun dışında iddia ile gerçek uyuşmak zorunda.
  if (actual !== ext) {
    throw new MediaError("Dosya türü içeriğiyle uyuşmuyor. Lütfen geçerli bir görsel seçin.");
  }

  const hash = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 32);
  const name = `${hash}.${actual}`;
  const full = pathForName(name);
  let deduped = false;
  if (fs.existsSync(full)) {
    deduped = true;
  } else {
    fs.mkdirSync(path.dirname(full), { recursive: true });
    /**
     * ATOMİK YAZMA: önce geçici dosyaya, sonra yerine taşı. Sebebi şu — aynı görseli iki istek
     * aynı anda yazarsa ya da yazma yarıda kesilirse (süreç ölür, disk dolar), yerinde yazma
     * YARIM bir dosya bırakır. Yarım dosya `existsSync` denetimini geçer, yani o görsel
     * KALICI olarak bozuk kalır ve bir daha hiç düzelmez — içerik karması aynı olduğu için
     * yeniden yükleme de "zaten var" der. rename atomik olduğu için dosya ya tam ya hiç var.
     */
    const tmp = `${full}.${process.pid}.${crypto.randomBytes(6).toString("hex")}.tmp`;
    fs.writeFileSync(tmp, buf);
    fs.renameSync(tmp, full);
  }
  return { name, bytes: buf.length, contentType: MIME_BY_EXT[actual], deduped };
}

/** Sunulacak dosyanın tam yolu ve türü. Ad desene uymuyorsa ya da dosya yoksa null. */
export function resolveMedia(name) {
  if (!MEDIA_NAME_RE.test(String(name || ""))) return null;
  const ext = String(name).split(".").pop();
  const full = pathForName(name);
  let stat;
  try { stat = fs.statSync(full); } catch { return null; }
  if (!stat.isFile()) return null;
  return { full, size: stat.size, contentType: MIME_BY_EXT[ext] };
}

/**
 * DEPO BOYUTU — yönetici istatistiklerine.
 * NEDEN ÖLÇÜM VAR AMA SİLME YOK: bir karma YEDİ ayrı tablodan referans alınabiliyor (ilan kapak,
 * ilan galerisi, tamirci avatarı, kapak, blog, kariyer, çalışan). Yetim dosyaları silmek için
 * hepsini taramak gerekir ve TEK bir atlanan referans, kullanıcının gördüğü kalıcı bir kırık
 * görsel demektir. Ölçmek güvenli, silmek değil. Bu yüzden burada yalnızca ölçüyoruz; klasör
 * beklenmedik biçimde büyürse görünür oluyor ve silme kararı ölçüme bakarak, elle veriliyor.
 * Yetim dosyanın maliyeti diskte birkaç yüz KB; yanlış silmenin maliyeti veri kaybı.
 */
export function mediaStats() {
  const dir = mediaDir();
  let files = 0, bytes = 0;
  const walk = (d) => {
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && !e.name.endsWith(".tmp")) {
        files++;
        try { bytes += fs.statSync(p).size; } catch { /* aynı anda silinmiş */ }
      }
    }
  };
  walk(dir);
  return { dir, files, bytes };
}
