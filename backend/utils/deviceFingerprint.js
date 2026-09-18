import crypto from "node:crypto";

/**
 * YENİ CİHAZ TESPİTİ — ve NE OLMADIĞI.
 * ================================================================================================
 * "Hesabınıza yeni bir cihazdan giriş yapıldı" bildirimi için kullanılan parmak izi. Bu dosyanın en
 * önemli kısmı, ne YAPMADIĞINI söyleyen kısım:
 *
 * ====== BU BİR KİMLİK DOĞRULAMA FAKTÖRÜ DEĞİLDİR ======
 * Parmak izi tamamen `User-Agent` BAŞLIĞINDAN türetiliyor ve o başlık istemcinin yazdığı bir
 * metindir — bir satır `curl -H "User-Agent: ..."` ile istenen her şey yapılabilir. Dolayısıyla:
 *   - ASLA "bu cihaz tanıdık, OTP'yi atla" gibi bir karar için kullanılmıyor,
 *   - ASLA bir yetki kontrolünde kullanılmıyor,
 *   - yalnızca kullanıcıya BİLGİ vermek için kullanılıyor.
 * Aksi hâlde güvenliği ARTIRMAK için eklenen bir şey, onu azaltan bir bypass'a dönüşürdü. Bu
 * uygulamada girişin ikinci adımı (e-postaya gönderilen OTP) hiçbir koşulda atlanmıyor.
 *
 * ====== NE TESPİT EDİYOR, NE ETMİYOR (dürüst sınır) ======
 * Tespit edilen şey "yeni bir FİZİKSEL CİHAZ" değil, "daha önce görülmemiş bir TARAYICI + İŞLETİM
 * SİSTEMİ birleşimi". Yani:
 *   - Aynı bilgisayarda Chrome'dan sonra Safari'ye geçmek YENİ cihaz sayılır (aslında aynı cihaz).
 *   - Aynı tarayıcı sürümüne sahip BAŞKA bir bilgisayar yeni sayılMAZ (aslında farklı cihaz).
 * Bunu kesin yapmanın yolu kalıcı bir cihaz çerezi/jetonu yazmaktır; o ayrı bir iş (çerez yönetimi,
 * CSRF, "çerezi silince her giriş yeni cihaz" sorunu) ve şu anda yapılmıyor. Bildirim metni bu
 * yüzden "cihaz" değil "tarayıcı/işletim sistemi" dilinde yazılıyor — kullanıcıya olduğundan fazla
 * kesinlik iddia etmiyoruz.
 *
 * ====== SÜRÜM NUMARASI BİLEREK DIŞARIDA ======
 * "Chrome 120" yerine yalnızca "Chrome" saklanıyor. Sebebi pratik: tarayıcılar birkaç haftada bir
 * kendini güncelliyor ve sürümü parmak izine katmak, hiçbir şey değişmediği hâlde her güncellemede
 * "yeni cihaz" uyarısı göndermek demek olurdu. Alarm yorgunluğu, bildirimi işe yaramaz hâle
 * getiren şeydir: her hafta gelen bir uyarıyı kimse okumaz, gerçek olanı da kaçırır.
 */

/**
 * Tarayıcı tespiti — SIRA ÖNEMLİ.
 * Modern tarayıcıların hepsi geriye dönük uyumluluk için birbirinin adını taşıyor: Edge'in UA'sı
 * "Chrome" da içerir, Chrome'unki "Safari" da. Bu yüzden en ÖZEL olanı en başa koyuyoruz; genel
 * olanlar sona. Sıra bozulursa her Edge kullanıcısı "Chrome" görünür.
 */
const BROWSERS = [
  [/\bEdg(?:e|A|iOS)?\//i, "Edge"],
  [/\bOPR\/|\bOpera\//i, "Opera"],
  [/\bSamsungBrowser\//i, "Samsung Internet"],
  [/\bYaBrowser\//i, "Yandex"],
  [/\bFirefox\/|\bFxiOS\//i, "Firefox"],
  [/\bCriOS\//i, "Chrome"],          // iOS'taki Chrome
  [/\bChrome\//i, "Chrome"],
  [/\bSafari\//i, "Safari"],         // en sonda: yukarıdakilerin hepsi "Safari" de içeriyor
];

/**
 * İşletim sistemi tespiti — burada da sıra önemli.
 * "Android" UA'sı "Linux" da içerir; iPad/iPhone "Mac OS X" içerebilir. Özelden genele.
 */
const PLATFORMS = [
  [/\bAndroid\b/i, "Android"],
  [/\biPhone\b/i, "iPhone"],
  [/\biPad\b/i, "iPad"],
  [/\bWindows NT\b/i, "Windows"],
  [/\bMac OS X\b|\bMacintosh\b/i, "macOS"],
  [/\bCrOS\b/i, "ChromeOS"],
  [/\bLinux\b/i, "Linux"],
];

const firstMatch = (list, ua) => (list.find(([re]) => re.test(ua)) || [])[1] || null;

/**
 * UA metninden insan tarafından okunabilir bir etiket üretir.
 * Tanınmayan/boş UA için `null` DÖNMÜYOR, "Bilinmeyen tarayıcı" diyoruz: boş bir etiket, kullanıcıya
 * gösterilen e-postada boş bir satır bırakırdı ve "bir şey ters gitti" izlenimi verirdi.
 */
export function describeDevice(userAgent) {
  const ua = String(userAgent || "").slice(0, 400);   // uzunluk sınırı: UA istemciden geliyor
  const browser = firstMatch(BROWSERS, ua);
  const platform = firstMatch(PLATFORMS, ua);
  if (!browser && !platform) return "Bilinmeyen tarayıcı";
  if (browser && platform) return `${browser} · ${platform}`;
  return browser || platform;
}

/**
 * Parmak izi = etiketin karması. Ham UA metnini SAKLAMIYORUZ.
 * Neden: ham UA, tarayıcı sürümü/derleme numarası/bazen cihaz modeli gibi ayrıntılar taşıyor ve
 * bunlar bir kullanıcıyı tanımaya yardımcı olabilecek fazladan veri. Bize gereken şey "bu tarayıcı
 * daha önce görüldü mü" sorusunun cevabı; onun için etiket yeterli. Amaç dışı veri toplamıyoruz.
 *
 * Karma, sunucunun IP tuzunu kullanıyor (aynı desen: hashIp). Tuz olmadan aynı etiket her kurulumda
 * aynı karmayı üretirdi; tek başına zararsız ama tutarlılık için aynı yolu izliyoruz.
 */
export function deviceFingerprint(userAgent, salt) {
  const label = describeDevice(userAgent);
  return {
    label,
    hash: crypto.createHash("sha256").update(`${salt}:device:${label}`).digest("hex").slice(0, 32),
  };
}
