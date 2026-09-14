/**
 * YÜKLEME ÖNCESİ MEDYA HAZIRLIĞI — TEK KAYNAK.
 * ================================================================================================
 * NEDEN BU DOSYA VAR:
 * Bu projede HTTP dosya yükleme yok; fotoğraf tarayıcıda base64'e çevrilip normal bir JSON alanı
 * gibi kaydediliyor. Dolayısıyla "dosyayı okuma" mantığı sekiz ayrı yerde, dört farklı biçimde
 * yazılmıştı ve üçü hatalıydı:
 *
 *   1. `URL.createObjectURL(file)` (arıza fotoğrafı, CV) — bu SEKMEYE ÖZEL geçici bir bellek
 *      referansı. Sunucuya `blob:http://.../uuid` diye kaydediliyor; sayfa yenilenince ya da
 *      karşı taraf (fotoğrafı görmesi gereken TAMİRCİ) açtığında ölü bir bağlantı. Aynı hata daha
 *      önce üç yerde düzeltilmişti, bu ikisi atlanmıştı. CV'de sonucu şu: aday CV'sini ekliyor,
 *      "başvuru gönderildi" yazısını görüyor, ama işvereni dosyayı HİÇ açamıyor.
 *   2. Ham `readAsDataURL` (sohbet, profil, kapak, çalışan, teklif fotoğrafı) — çalışıyor ama
 *      telefon kamerasından gelen 3-10 MB'lık dosyayı olduğu gibi saklıyor.
 *   3. Sıkıştırmalı yol (yalnızca ilan kapak + galeri) — doğru olan, ama 8 yoldan 2'sinde.
 *
 * Artık hepsi burada. Tek yerde olmasının asıl faydası şu: sınırlar SUNUCUDAKİ sınırlarla aynı
 * dosyada okunabiliyor (bkz. backend/utils/mediaValidation.js). İkisi ayrı yerlerde yaşarsa
 * kaçınılmaz olarak ayrışır ve kullanıcı sebebini anlamadığı bir 400 görür.
 */

/** Sunucu tavanları (backend/utils/mediaValidation.js ile AYNI olmalı; testte karşılaştırılıyor). */
export const SERVER_LIMITS = {
  image: 2 * 1024 * 1024,
  avatar: 1 * 1024 * 1024,
  document: 4 * 1024 * 1024,
};

/**
 * KULLANIM YERİNE GÖRE HEDEFLER.
 * Boyut, görüntünün EKRANDA kapladığı yere göre seçildi — "ne kadar küçültebiliriz" değil,
 * "kalite kaybı görünür hâle gelmeden ne kadar küçülür" sorusu.
 *   listing  1600px → ilan detayında tam genişlik galeri, büyütme/yakınlaştırma bekleniyor
 *   cover    1600px → tamirci profilinin üstündeki geniş bant
 *   chat     1280px → sohbette en fazla ~600px gösteriliyor; 1280 retina ekranda da net
 *   issue    1280px → arıza fotoğrafı: tamircinin hasarı görmesi gerek, ama küçük kartta açılıyor
 *   quote    1280px → aynı gerekçe
 *   avatar    512px → ekranda 40-120px. Yine de 512: bazı yerlerde 2x/3x ekranda büyük gösteriliyor.
 */
export const IMAGE_PRESETS = {
  listing: { maxDim: 1600, quality: 0.78, limit: SERVER_LIMITS.image },
  cover: { maxDim: 1600, quality: 0.78, limit: SERVER_LIMITS.image },
  chat: { maxDim: 1280, quality: 0.8, limit: SERVER_LIMITS.image },
  issue: { maxDim: 1280, quality: 0.8, limit: SERVER_LIMITS.image },
  quote: { maxDim: 1280, quality: 0.8, limit: SERVER_LIMITS.image },
  avatar: { maxDim: 512, quality: 0.82, limit: SERVER_LIMITS.avatar },
} as const;

export type ImagePresetName = keyof typeof IMAGE_PRESETS;

/** Base64 data URI'nin yaklaşık ikili boyutu (sunucudaki approxBytes ile aynı hesap). */
export const approxBytes = (dataUrl: string): number => Math.floor(String(dataUrl || "").length * 0.75);

const mb = (bytes: number) => `${Math.round((bytes / 1024 / 1024) * 10) / 10} MB`;

/**
 * SAYDAMLIK KONTROLÜ.
 * PNG'yi JPEG'e çevirmek saydam bölgeleri SİYAH yapar. Tamirci logosu ya da kurumsal bir kapak
 * görseli saydam PNG olabiliyor; "%80 küçülttük" diyip logonun arkasını siyaha boyamak bir
 * iyileştirme değil, görünür bir bozulma olurdu. O yüzden PNG geldiğinde alfa kanalına BAKIYORUZ
 * ve saydamlık varsa PNG olarak bırakıyoruz (boyutlandırma yine uygulanıyor, o da kazanç sağlıyor).
 *
 * Maliyet: yeniden boyutlandırılmış tuvalde tek geçiş. En büyük hâlinde (1600px) ~2M piksel —
 * milisaniyeler. Orijinal 10 MP fotoğrafta yapılsaydı pahalı olurdu, o yüzden KÜÇÜLTMEDEN SONRA.
 */
function hasTransparency(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  try {
    const { data } = ctx.getImageData(0, 0, w, h);
    // 4. bayt alfa. Her pikseli okumak gerekmiyor: saydamlık genelde geniş bölgeler hâlinde olur,
    // o yüzden 4 pikselde bir örneklemek yeterli ve dört kat hızlı.
    for (let i = 3; i < data.length; i += 16) if (data[i] < 250) return true;
    return false;
  } catch {
    // Tuval "kirlenmişse" (farklı kökenli görsel) getImageData atar. O durumda güvenli varsayım
    // saydamlık VAR demek: kaybı olmayan tarafı seçiyoruz.
    return true;
  }
}

export type PreparedImage = {
  dataUrl: string;
  /** Sunucu tavanını aşıyor mu — aşıyorsa çağıran taraf kullanıcıya SEBEBİNİ söylemeli. */
  tooLarge: boolean;
  /** Kullanıcıya gösterilecek hazır mesaj (tooLarge ise dolu). */
  error: string | null;
  /** Ölçüm/test için: sıkıştırma gerçekten işe yaradı mı. */
  originalBytes: number;
  finalBytes: number;
};

/**
 * BİR GÖRSEL DOSYASINI YÜKLEMEYE HAZIRLA.
 *
 * Akış: dosya → data URI → <img> → tuvalde küçült → JPEG (ya da saydamsa PNG) → data URI.
 *
 * ÜÇ GÜVENLİ GERİ DÖNÜŞ NOKTASI (hiçbiri sessizce başarısız olmuyor):
 *   - Görsel ÇÖZÜLEMEZSE (bazı tarayıcılarda HEIC, ya da SVG): ham data URI dönüyor. Kullanıcının
 *     dosyası kaybolmuyor; SVG ise sunucu onu ZATEN reddediyor ve bu doğru davranış.
 *   - Tuval bağlamı yoksa: ham data URI.
 *   - Sıkıştırma dosyayı BÜYÜTTÜYSE (küçük ve zaten optimize edilmiş bir PNG'de olur): orijinali
 *     döndürüyoruz. "İyileştirme" adı altında büyütmek kabul edilemez.
 */
export function prepareImageForUpload(
  file: File,
  preset: ImagePresetName,
  onDone: (result: PreparedImage) => void,
): void {
  const { maxDim, quality, limit } = IMAGE_PRESETS[preset];
  const finish = (dataUrl: string, originalBytes: number) => {
    const finalBytes = approxBytes(dataUrl);
    const tooLarge = finalBytes > limit;
    onDone({
      dataUrl,
      tooLarge,
      // Mesaj SEBEBİ söylüyor: kullanıcı ne yapacağını bilmeden "hata oluştu" görmesin.
      error: tooLarge
        ? `Bu dosya çok büyük (${mb(finalBytes)}). En fazla ${mb(limit)} yükleyebilirsiniz. Daha küçük bir fotoğraf seçin.`
        : null,
      originalBytes,
      finalBytes,
    });
  };

  const reader = new FileReader();
  reader.onerror = () => onDone({
    dataUrl: "", tooLarge: false, error: "Dosya okunamadı. Lütfen tekrar deneyin.",
    originalBytes: 0, finalBytes: 0,
  });
  reader.onload = () => {
    if (typeof reader.result !== "string") return;
    const raw = reader.result;
    const originalBytes = approxBytes(raw);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { finish(raw, originalBytes); return; }
      ctx.drawImage(img, 0, 0, w, h);
      const keepPng = file.type === "image/png" && hasTransparency(ctx, w, h);
      const out = keepPng ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", quality);
      finish(approxBytes(out) < originalBytes ? out : raw, originalBytes);
    };
    img.onerror = () => finish(raw, originalBytes);
    img.src = raw;
  };
  reader.readAsDataURL(file);
}

/**
 * DİZİ TAVANLARI — sunucudaki arrayCount/arrayTotal ile aynı (mediaValidation.js).
 * Sunucu 20 öğe ve 12 MB toplam kabul ediyor; arayüz sayıyı 10'da tutuyor çünkü bir arıza
 * bildirimi ya da teklif isteği için 10 fotoğraf zaten fazlasıyla yeterli ve daha düşük sayı
 * kullanıcıyı tavana çarpmaktan koruyor.
 */
export const ARRAY_LIMITS = { count: 10, total: 12 * 1024 * 1024 };

/**
 * BİR FOTOĞRAF MEVCUT LİSTEYE SIĞAR MI?
 *
 * NEDEN GEREKLİ — BU KONTROL FAZ 3'ÜN KENDİ YAN ETKİSİ:
 * Arıza ve teklif fotoğraflarında hiç sayı sınırı YOKTU ve olması da gerekmiyordu: eski kod
 * `blob:` bağlantısı saklıyordu, yani her fotoğraf ~50 bayttı. Fotoğrafları GERÇEKTEN saklamaya
 * başlayınca her biri ~330 KB oldu. Sınır koymasaydım "düzeltme" yeni bir hata üretirdi:
 * kullanıcı 50 fotoğraf ekler, kaydetmeye basar ve randevu sunucudan 400 alıp sessizce kaybolur.
 * Bir hatayı düzeltirken doğurduğu yeni sınırı da düşünmek gerekiyor.
 */
export function canAppendImage(existing: string[], nextDataUrl: string): string | null {
  if (existing.length >= ARRAY_LIMITS.count) {
    return `En fazla ${ARRAY_LIMITS.count} fotoğraf ekleyebilirsiniz.`;
  }
  const total = existing.reduce((sum, v) => sum + approxBytes(v), 0) + approxBytes(nextDataUrl);
  if (total > ARRAY_LIMITS.total) {
    return `Fotoğrafların toplamı çok büyük (${mb(total)}). En fazla ${mb(ARRAY_LIMITS.total)} olabilir.`;
  }
  return null;
}

export type PreparedDocument = {
  dataUrl: string;
  name: string;
  tooLarge: boolean;
  error: string | null;
  bytes: number;
};

/**
 * BİR BELGEYİ (CV) YÜKLEMEYE HAZIRLA.
 *
 * Görsellerden ayrı bir işlev, çünkü buraya tuval UYGULANAMAZ: PDF'i tuvale çizip yeniden
 * kodlamak dosyayı bozar. Yani belge yolunda sıkıştırma yok — tek yapılabilen, tavanı AŞAN dosyayı
 * baştan reddedip kullanıcıya sebebini söylemek. Sessizce göndermek 400 döndürürdü ve aday
 * başvurusunun neden gitmediğini asla anlamazdı.
 */
export function prepareDocumentForUpload(
  file: File,
  onDone: (result: PreparedDocument) => void,
): void {
  const reader = new FileReader();
  reader.onerror = () => onDone({
    dataUrl: "", name: file.name, tooLarge: false,
    error: "Dosya okunamadı. Lütfen tekrar deneyin.", bytes: 0,
  });
  reader.onload = () => {
    if (typeof reader.result !== "string") return;
    const dataUrl = reader.result;
    const bytes = approxBytes(dataUrl);
    const tooLarge = bytes > SERVER_LIMITS.document;
    onDone({
      dataUrl, name: file.name, tooLarge, bytes,
      error: tooLarge
        ? `Bu dosya çok büyük (${mb(bytes)}). En fazla ${mb(SERVER_LIMITS.document)} yükleyebilirsiniz.`
        : null,
    });
  };
  reader.readAsDataURL(file);
}
