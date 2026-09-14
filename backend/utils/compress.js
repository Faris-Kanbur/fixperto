import zlib from "node:zlib";

/**
 * YANIT SIKIŞTIRMA — sıfır bağımlılıkla.
 * ================================================================================================
 * NEDEN: hiçbir yanıt sıkıştırılmıyordu. Bu API'nin döndürdüğü şey JSON, yani yüksek oranda
 * tekrarlı metin — gzip'te tipik olarak 5-10 kat küçülür. Bugünkü 15 KB'lık tamirci listesi bile
 * ~3 KB'a iner; ölçek büyüdükçe kazanç doğrusal artar.
 *
 * NEDEN `compression` PAKETİ DEĞİL: bu ortamda npm erişimi yok ve paket kurulu değil. Ama daha
 * önemli gerekçe şu: ihtiyaç duyulan şey 40 satır. Yeni bir bağımlılık, güncellenmesi ve güvenlik
 * takibi gereken yeni bir yüzey demek. Projenin geri kalanı da aynı ilkeyle yazılmış (helmet
 * yerine dört başlık elle yazılmış, bkz. server.js).
 *
 * DÜRÜST SINIR — BU GÖRSEL PROBLEMİNİ ÇÖZMEZ:
 * Base64 kodlanmış JPEG verisi ZATEN sıkıştırılmış bir görüntünün metin gösterimidir; gzip onu
 * %0-5 küçültür. Yani bu değişiklik meta veri yükünü düşürür, gömülü fotoğraf yükünü DÜŞÜRMEZ.
 * Fotoğraf sorununun çözümü ayrı (medya uçları, Faz 4). Burada bunu yazıyorum ki "sıkıştırma
 * ekledik, medya sorunu çözüldü" yanılgısı oluşmasın.
 *
 * GÜVENLİK NOTU — BREACH/CRIME:
 * Sıkıştırma + gizli veri + saldırgan kontrollü girdi bir arada olduğunda, yanıt BOYUTUNDAN gizli
 * veri sızdırma saldırıları (BREACH) teorik olarak mümkündür. Bu API'de ilgili koşul yok: oturum
 * jetonu Authorization BAŞLIĞINDA taşınıyor (başlıklar sıkıştırılmıyor), çerez kullanılmıyor ve
 * yanıt gövdesinde CSRF jetonu gibi bir sır yok. Yine de ihtiyatlı davranıp kimlik doğrulama
 * uçlarını (/api/auth/*) sıkıştırma dışında tutuyoruz — oradaki yanıtlar küçük, kazanç yok,
 * ve jeton/OTP gövdede geçiyor.
 */

const MIN_SIZE = 1024;                 // 1 KB altında sıkıştırma faydadan çok CPU harcar
const EXCLUDED = /^\/api\/auth\//;     // kimlik akışı: kazanç yok, ihtiyat var

/** İstemcinin kabul ettiği en iyi kodlamayı seç. Desteklenmiyorsa hiç sıkıştırma yapma. */
function pickEncoding(header) {
  const accept = String(header || "").toLowerCase();
  if (accept.includes("br")) return "br";
  if (accept.includes("gzip")) return "gzip";
  return null;
}

const compressors = {
  // Seviye 4-6 aralığı: CPU ile kazanç arasındaki makul denge. En yüksek seviye (9/11) JSON'da
  // birkaç yüzde daha kazandırıp CPU'yu katlıyor — istek başına ödenen bir bedel olduğu için hayır.
  br: (buf) => zlib.brotliCompressSync(buf, {
    params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buf.length },
  }),
  gzip: (buf) => zlib.gzipSync(buf, { level: 6 }),
};

/**
 * `res.json` ve `res.send` sarmalanıyor. Neden ara katman olarak akış (stream) yerine bu yol:
 * bu API'nin tüm yanıtları bellekte tek parça JSON; akış kurmak gereksiz karmaşıklık olurdu.
 * Hata durumunda sıkıştırmadan gönderiliyor — sıkıştırma bir iyileştirme, asla bir arıza sebebi
 * olmamalı.
 */
export function compressResponses(req, res, next) {
  const encoding = pickEncoding(req.headers["accept-encoding"]);
  if (!encoding || EXCLUDED.test(req.path)) return next();

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    try {
      const raw = Buffer.from(JSON.stringify(body), "utf8");
      if (raw.length < MIN_SIZE) return originalJson(body);
      const packed = compressors[encoding](raw);
      // Sıkıştırma büyüttüyse (küçük/rastgele veri) ham hâlini gönder.
      if (packed.length >= raw.length) return originalJson(body);
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Content-Encoding", encoding);
      // Ara vekiller aynı adrese farklı kodlamada yanıt vermesin.
      res.setHeader("Vary", "Accept-Encoding");
      res.setHeader("Content-Length", String(packed.length));
      return res.end(packed);
    } catch {
      return originalJson(body);   // sıkıştırma hiçbir zaman isteği düşürmemeli
    }
  };
  next();
}

export default compressResponses;
