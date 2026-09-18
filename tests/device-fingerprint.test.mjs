/**
 * YENİ CİHAZ/TARAYICI TESPİTİ — saf mantık testi.
 * ================================================================================================
 * Kullanıcının sorusu: "bazı servisler 'hesabınıza yeni bir cihazdan giriş yapıldı' maili atıyor,
 * bunu nasıl tespit ediyorlar, bizde de yapabilir miyiz?"
 *
 * Cevap: istekteki iki şeyden — `User-Agent` başlığı ve IP. Burada birinci kısmın (UA'dan tarayıcı
 * ve işletim sistemi çıkarma) DOĞRU çalıştığı ölçülüyor. UA ayrıştırma sessizce yanlış olabilecek
 * bir iş: sıralama hatası yüzünden her Edge kullanıcısını "Chrome" göstermek çok kolay ve bunun
 * belirtisi yok — kullanıcı sadece yanlış bilgi görür.
 *
 * Uçtan uca davranış (kayıt, bildirim, tavanlar, IDOR) ayrıca api10.e2e.mjs'te gerçek sunucuya
 * karşı ölçülüyor.
 */
import { describeDevice, deviceFingerprint } from "../backend/utils/deviceFingerprint.js";
import { eq, ok, report } from "./_harness.mjs";

// --- 1) GERÇEK UA METİNLERİ -------------------------------------------------------------------
// Hepsi gerçek tarayıcıların ürettiği biçimler. Kritik nokta: modern tarayıcıların UA'sı geriye
// dönük uyumluluk için BİRBİRİNİN adını taşıyor (Edge "Chrome" da der, Chrome "Safari" de der).
// Sıralama yanlış olsa aşağıdaki ilk üç satır yanlış tarayıcı gösterirdi.
{
  const cases = [
    // [UA, beklenen etiket, ne sınıyor]
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
      "Edge · Windows", "Edge, 'Chrome' ve 'Safari' de içerdiği hâlde Edge olarak tanınıyor"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Chrome · macOS", "Chrome, 'Safari' de içerdiği hâlde Chrome olarak tanınıyor"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
      "Safari · macOS", "gerçek Safari doğru tanınıyor"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
      "Safari · iPhone", "iPhone, 'Mac OS X' de içerdiği hâlde iPhone olarak tanınıyor"],
    ["Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
      "Chrome · Android", "Android, 'Linux' de içerdiği hâlde Android olarak tanınıyor"],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
      "Firefox · Windows", "Firefox"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1",
      "Chrome · iPhone", "iOS'taki Chrome (CriOS)"],
    ["Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0",
      "Opera · Linux", "Opera, 'Chrome' da içerdiği hâlde Opera olarak tanınıyor"],
    ["Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Chrome · ChromeOS", "ChromeOS, 'Linux' içermediği hâlde CrOS ile tanınıyor"],
  ];
  for (const [ua, expected, what] of cases) eq(describeDevice(ua), expected, what);
}

// --- 2) BOZUK / EKSİK / KÖTÜ NİYETLİ UA -------------------------------------------------------
// UA istemciden gelen bir METİN. Boş, çöp ya da kasıtlı olarak tuhaf olabilir; hiçbirinde
// çökmemeli ve kullanıcıya boş bir satır göstermemeli.
{
  eq(describeDevice(""), "Bilinmeyen tarayıcı", "boş UA anlamlı bir etikete düşüyor");
  eq(describeDevice(undefined), "Bilinmeyen tarayıcı", "eksik başlık çökmüyor");
  eq(describeDevice(null), "Bilinmeyen tarayıcı", "null çökmüyor");
  eq(describeDevice("curl/8.4.0"), "Bilinmeyen tarayıcı", "tarayıcı olmayan istemci");
  eq(describeDevice("\\u0000<script>alert(1)</script>"), "Bilinmeyen tarayıcı", "çöp/enjeksiyon denemesi düz metin kalıyor");
  // Sadece platform bilinen durum: etiket yarım ama anlamlı.
  eq(describeDevice("Mozilla/5.0 (Windows NT 10.0)"), "Windows", "yalnızca platform bilinince o gösteriliyor");
  // Uzunluk sınırı: UA istemciden geliyor, sınırsız metin saklanmamalı.
  const huge = "Mozilla/5.0 (Windows NT 10.0) Chrome/1 " + "x".repeat(50_000);
  eq(describeDevice(huge), "Chrome · Windows", "çok uzun UA kesiliyor ama doğru ayrıştırılıyor");
}

// --- 3) PARMAK İZİ: kararlı, tuza bağlı, ham UA'yı taşımıyor ---------------------------------
{
  const uaChrome = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  const a = deviceFingerprint(uaChrome, "tuz-1");
  const b = deviceFingerprint(uaChrome, "tuz-1");
  eq(a.hash, b.hash, "aynı tarayıcı + aynı tuz → aynı parmak izi (her girişte 'yeni cihaz' demiyor)");

  const otherSalt = deviceFingerprint(uaChrome, "tuz-2");
  ok(otherSalt.hash !== a.hash, "parmak izi tuza bağlı");

  const uaSafari = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15";
  ok(deviceFingerprint(uaSafari, "tuz-1").hash !== a.hash, "aynı makinede farklı tarayıcı → farklı parmak izi");

  /**
   * SÜRÜM NUMARASI PARMAK İZİNE GİRMİYOR — ve bu, alarm yorgunluğunu önleyen asıl karar.
   * Tarayıcılar birkaç haftada bir kendini günceller. Sürüm parmak izine katılsaydı, hiçbir şey
   * değişmediği hâlde HER GÜNCELLEMEDE "yeni cihazdan giriş" maili giderdi; her hafta gelen bir
   * uyarıyı kimse okumaz ve gerçek olanı da kaçırır.
   */
  const uaChromeNewer = uaChrome.replace("Chrome/120.0.0.0", "Chrome/131.0.0.0");
  eq(deviceFingerprint(uaChromeNewer, "tuz-1").hash, a.hash,
    "tarayıcı SÜRÜM güncellemesi 'yeni cihaz' saymıyor");

  // Ham UA saklanmıyor: parmak izi yalnızca etiket + karma taşıyor.
  eq(Object.keys(a).sort().join(","), "hash,label", "parmak izi ham UA metnini TAŞIMIYOR");
  ok(!a.hash.includes("Chrome") && a.hash.length === 32, "karma sabit uzunlukta ve içeriği sızdırmıyor");
}

// --- 4) BU BİR KİMLİK DOĞRULAMA FAKTÖRÜ DEĞİL -------------------------------------------------
/**
 * En önemli kontrol. Parmak izi TAMAMEN istemcinin yazdığı bir başlıktan türüyor; bir satır
 * `curl -H "User-Agent: ..."` ile taklit edilebilir. Dolayısıyla asla bir güvenlik kararında
 * kullanılmamalı — özellikle "bu cihaz tanıdık, OTP'yi atla" gibi. Öyle olsaydı, güvenliği
 * ARTIRMAK için eklenen özellik onu azaltan bir bypass'a dönüşürdü.
 * Kodun bunu yapmadığını ölçüyoruz: giriş akışında cihaz bilgisi hiçbir dallanmaya girmiyor.
 */
{
  const { readFileSync } = await import("node:fs");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const { stripComments } = await import("./_harness.mjs");
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
  const authRoute = stripComments(readFileSync(join(ROOT, "backend", "routes", "auth.js"), "utf8"));

  /**
   * Blok sınırlarını METİN ARAYARAK bulurken dikkat: `recordLoginDevice` dosyada İKİ kez geçiyor —
   * 12. satırdaki `import` satırında ve gerçek çağrıda. `indexOf` import'u buluyor, yani kesitler
   * yanlış yerden başlıyordu ve bu testin ilk hâli üç yanlış alarm üretti. Çağrıyı istiyoruz:
   * `lastIndexOf`. (Aynı tuzağa geri bildirim testlerinde de düşmüştük: bir metni aramak, onun
   * TEK kopyası olduğunu varsaymak demektir.)
   */
  const callAt = authRoute.lastIndexOf("recordLoginDevice(");
  ok(callAt > authRoute.indexOf("import"), "cihaz kaydı çağrısı bulundu (import satırı değil)");

  // OTP doğrulaması cihaz bilgisinden BAĞIMSIZ: kod karşılaştırması cihaz kaydından ÖNCE ve
  // hiçbir koşulda atlanmıyor.
  ok(authRoute.indexOf('String(code || "") !== pending.otp') < callAt,
    "OTP kontrolü cihaz kaydından ÖNCE — cihaz tanıdık olsa bile kod şart");
  ok(!/isNew\s*\?\s*[^:]*createSession|known.*skip.*otp/i.test(authRoute),
    "cihaz bilgisi oturum üretme kararını etkilemiyor");

  /**
   * Cihaz bloğu: `try {`den, onu kapatan `catch`in sonuna kadar. Girişi tamamlayan
   * `res.json({ ok: true, token ...})` satırı bu bloğun DIŞINDA ve sonrasında — kesiti oraya kadar
   * uzatmak, aşağıdaki "jeton yok" kontrolünün giriş yanıtındaki `token` kelimesini yakalamasına
   * yol açıyordu (ikinci yanlış alarm).
   */
  const blockStart = authRoute.lastIndexOf("try {", callAt);
  const blockEnd = authRoute.indexOf("}", authRoute.indexOf("console.error", blockStart));
  const deviceBlock = authRoute.slice(blockStart, blockEnd);
  ok(blockStart < callAt && blockEnd > callAt, "cihaz bloğunun sınırları doğru bulundu");
  ok(/^try \{/.test(deviceBlock) && /catch \(err\)/.test(deviceBlock),
    "cihaz kaydı/bildirimi hata verirse giriş yine tamamlanıyor (try/catch)");
  ok(authRoute.indexOf("res.json({ ok: true, token") > blockEnd,
    "giriş yanıtı cihaz bloğundan SONRA — kayıt patlasa bile kullanıcı giriş yapabiliyor");

  // E-postada bağlantı/jeton yok (kimlik avı ve hesap ele geçirme yüzeyi açmıyoruz).
  ok(/yeni bir tarayıcıdan giriş/.test(deviceBlock), "bildirim e-postası bu blokta üretiliyor");
  ok(!/https?:\/\//.test(deviceBlock), "yeni cihaz e-postasında BAĞLANTI yok");
  ok(!/\btoken\b|jeton=/i.test(deviceBlock), "yeni cihaz e-postasında jeton yok");
  // Ham UA e-postaya da girmiyor: yalnızca insan okunur etiket.
  ok(!/user-agent/i.test(deviceBlock.slice(deviceBlock.indexOf("queueMail"))),
    "e-posta metninde ham User-Agent yok, yalnızca etiket");
}

report("cihaz parmak izi");
