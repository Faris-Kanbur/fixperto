/**
 * TARAYICI UYUMLULUĞU — STATİK DENETİM.
 * ================================================================================================
 * DÜRÜST SINIR, EN BAŞTA: bu takım tarayıcı ÇALIŞTIRMIYOR. Bu ortamda paketleyici ikilileri
 * çalışmıyor ve tarayıcı da yok; "beş tarayıcıda denedim" demek yanlış olurdu. Bunun yerine
 * yaptığı şey şu: kodun kullandığı her tarayıcı API'sini ve düzen varsayımını, BİLİNEN uyumluluk
 * tuzaklarına karşı tarıyor. Bulduğu şeyler gerçek — tarayıcıda denenmiş değil, ama kaynağı
 * belgelenmiş davranışlar.
 *
 * PRATİKTE ÜÇ MOTOR VAR (2026 pazar payları):
 *   - Blink   → Chrome (~%69) + Edge (~%5) + Samsung Internet (~%2)  ≈ %78. Aynı motor, aynı
 *               davranış; Chrome'da çalışan Edge ve Samsung'da da çalışır.
 *   - WebKit  → Safari (~%16). RİSK BURADA YOĞUNLAŞIYOR: hem masaüstünde hem iPhone/iPad'de tek
 *               izin verilen motor, ve özellik desteği diğerlerinin arkasından geliyor.
 *   - Gecko   → Firefox (~%3).
 * Bu yüzden aşağıdaki kuralların çoğu Safari kaynaklı. "Chrome'da çalışıyor" bir uyumluluk
 * kanıtı değil; Chrome'da çalışması pazarın %78'ini, Safari'de çalışması kalan riski kapatır.
 *
 * Bir kural eklerken SEBEBİNİ yaz: hangi tarayıcı, hangi sürüm, kullanıcı ne görür.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...p) => readFileSync(join(ROOT, ...p), "utf8");

let passed = 0;
const failures = [];
const ok = (v, name) => { if (v) passed++; else failures.push(name); };
const eq = (a, b, name) => ok(JSON.stringify(a) === JSON.stringify(b), `${name} — beklenen ${JSON.stringify(b)}, gelen ${JSON.stringify(a)}`);

// --- Kaynakları topla (el kitabı ve sözlük SALT METİN, taramaya girmez) ---------------------------
const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (/\.tsx?$/.test(e.name) && !/[/\\]data[/\\](handbook|i18n)\.ts$/.test(full)) files.push(full);
  }
})(join(ROOT, "frontend", "src"));
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
const code = stripComments(files.map((f) => readFileSync(f, "utf8")).join("\n"));
const css = read("frontend", "src", "index.css");
const html = read("frontend", "index.html");

// ================================================================ 1) ÇOK YENİ JS API'LERİ
/**
 * Bu listenin hepsi "yeni tarayıcıda var, sahadaki tarayıcıda yok" kategorisinde. Kullanılırsa
 * kullanıcı BEYAZ EKRAN görür (React ağacı düşer), çünkü hata çizim sırasında oluşur.
 * Her biri için hangi tarayıcının hangi sürümünde geldiği yazılı.
 */
const TOO_NEW = [
  [/\bObject\.groupBy\s*\(/, "Object.groupBy — Safari 17.4 / Firefox 119 öncesinde yok"],
  [/\bMap\.groupBy\s*\(/, "Map.groupBy — Safari 17.4 / Firefox 119 öncesinde yok"],
  [/\bPromise\.withResolvers\s*\(/, "Promise.withResolvers — Safari 17.4 / Firefox 121 öncesinde yok"],
  [/\.toSorted\s*\(/, "Array.toSorted — Safari 16 / Firefox 115 öncesinde yok"],
  [/\.toReversed\s*\(/, "Array.toReversed — Safari 16 / Firefox 115 öncesinde yok"],
  [/\.toSpliced\s*\(/, "Array.toSpliced — Safari 16 / Firefox 115 öncesinde yok"],
  [/\bstructuredClone\s*\(/, "structuredClone — Safari 15.4 öncesinde yok"],
  [/\bArray\.fromAsync\s*\(/, "Array.fromAsync — çok yeni, Safari 18.4"],
  [/\bAbortSignal\.timeout\s*\(/, "AbortSignal.timeout — Safari 15.4 öncesinde yok"],
  [/\bIntl\.DurationFormat\b/, "Intl.DurationFormat — Firefox'ta hâlâ yok"],
  [/\bnavigator\.userAgentData\b/, "userAgentData — yalnızca Blink; Safari ve Firefox'ta yok"],
  [/\bCSS\.registerProperty\b/, "CSS.registerProperty — Firefox 128 öncesinde yok"],
];
for (const [re, why] of TOO_NEW) eq(re.test(code), false, `kullanılmıyor: ${why}`);

/**
 * REGEX GERİYE BAKMA (lookbehind) — Safari'nin en meşhur tuzağı. Safari 16.4'ten (Mart 2023)
 * önce DESTEKLENMİYOR ve desteklenmediğinde regex'in kendisi SÖZDİZİMİ HATASI verir: dosya hiç
 * yüklenmez, uygulama komple açılmaz. iOS 15/16 kullanan cihazlar hâlâ sahada.
 */
eq(/\(\?<[=!]/.test(code), false, "regex geriye bakma (lookbehind) kullanılmıyor — eski Safari dosyayı hiç yüklemez");
// Regex `v` bayrağı da aynı sınıfta (Safari 17 öncesinde sözdizimi hatası).
eq(/\/[gimsuy]*v[gimsuy]*\s*[;,)\].]/.test(code) && /new RegExp\([^)]*"v"/.test(code), false, "regex v bayrağı kullanılmıyor");

// ================================================================ 2) VAROLMAYABİLECEK API'LER KORUNMALI
/**
 * Bu API'ler bazı tarayıcılarda HİÇ YOK ya da yalnızca güvenli bağlamda var. Korumasız
 * kullanıldığında hata, kullanıcının bastığı düğmenin sessizce hiçbir şey yapmaması demek —
 * en kötü hata türü, çünkü kullanıcı sebebini hiç öğrenmiyor.
 */
const GUARDED = [
  ["Notification", /typeof Notification === "undefined"/, "iOS Safari'de Notification HİÇ yok (masaüstü Safari'de var)"],
  ["navigator.clipboard", /navigator\.clipboard\?\.writeText/, "yalnızca güvenli bağlamda var — telefondan http://192.168.x.x ile YOK"],
  ["crypto.randomUUID", /try \{ return crypto\.randomUUID\(\)/, "Safari 15.4 öncesinde yok"],
  ["navigator.share", /navigator\.share/, "masaüstü Firefox'ta ve Chrome'un eski sürümlerinde yok"],
];
for (const [api, guard, why] of GUARDED) {
  if (!code.includes(api)) { passed++; continue; }   // hiç kullanılmıyorsa sorun yok
  ok(guard.test(code), `${api} korumalı kullanılıyor (${why})`);
}
// navigator.share özellik denetimiyle çağrılmalı.
if (code.includes("navigator.share")) {
  ok(/navigator\.share\b[\s\S]{0,200}?(typeof navigator\.share|navigator\.share\s*&&|!navigator\.share|canNativeShare)/.test(code)
     || /(typeof navigator\.share|navigator\.share\s*&&|!navigator\.share|canNativeShare)[\s\S]{0,400}?navigator\.share\(/.test(code),
    "navigator.share özellik denetimiyle çağrılıyor");
}

/**
 * DEPOLAMA — Safari'nin gizli gezinti modunda `localStorage.setItem` HATA FIRLATIR (kota 0).
 * Korumasız tek bir çağrı, gizli sekmede uygulamayı açılışta düşürür. Bu yüzden HER erişim
 * try/catch içinde olmalı; kod bunu tek bir yardımcıdan geçirerek yapıyor.
 */
const storageCalls = [...code.matchAll(/(localStorage|sessionStorage)\.(get|set|remove)Item/g)];
ok(storageCalls.length > 0, "depolama kullanımı taranıyor");
const storageFiles = files.filter((f) => /(localStorage|sessionStorage)\.(get|set|remove)Item/.test(readFileSync(f, "utf8")));
for (const f of storageFiles) {
  const src = readFileSync(f, "utf8");
  // Aynı dosyada try/catch ya da yardımcı sarmalayıcı olmalı.
  ok(/try\s*\{/.test(src), `${f.split("/").slice(-1)[0]}: depolama erişimi try/catch ile korunuyor (Safari gizli gezinti hata fırlatır)`);
}

// ================================================================ 3) TARİH AYRIŞTIRMA
/**
 * `new Date("2026-01-01 10:00")` — boşluklu biçim ISO DEĞİL. Chrome bunu kabul ediyor, Safari
 * "Invalid Date" döndürüyor. Sonuç: Chrome'da doğru çalışan tarih hesapları Safari'de NaN olup
 * "NaN.NaN.NaN" ya da boş ekran üretiyor. Bu, "Chrome'da çalışıyor" tuzağının klasik örneği.
 */
eq(/new Date\(\s*["'`][^"'`]*\d{4}-\d{2}-\d{2} \d{2}:/.test(code), false,
  "boşluklu tarih dizesi ayrıştırılmıyor (Safari'de Invalid Date verir)");
// `new Date("...")` yerine sayı/ISO kullanımı tercih edilmeli; en azından "/" ayıraçlı Amerikan
// biçimi (Safari'de belirsiz) kullanılmamalı.
eq(/new Date\(\s*["'`]\d{1,2}\/\d{1,2}\/\d{4}/.test(code), false, "eğik çizgili tarih biçimi ayrıştırılmıyor");

// ================================================================ 4) CSS ve DÜZEN
/**
 * iOS SAFARI'DE ALAN ODAKLANINCA SAYFA ZOOMLANIYOR: yazı tipi 16px'ten küçük bir input/select/
 * textarea odaklandığında Safari sayfayı yakınlaştırır ve GERİ ALMAZ. Bu projede alanların büyük
 * çoğunluğu Tailwind `text-sm` (14px) kullanıyor, yani telefonda neredeyse her form bunu
 * tetikliyordu. Düzeltme global bir CSS kuralı (bkz. index.css) — 213 sınıfı tek tek değiştirmek
 * yerine, çünkü tek tek değiştirmek birinin unutulması demektir.
 */
ok(/@media \(pointer: coarse\)/.test(css), "dokunmatik cihazlarda alan yazı tipi kuralı var");
ok(/font-size: 16px/.test(css), "dokunmatikte alanlar 16px (iOS zoom hatası kapalı)");

/**
 * ZOOM KAPATILMAMALI. Aynı hatanın internette en çok önerilen "çözümü" viewport'a
 * `maximum-scale=1, user-scalable=no` yazmak. Bu, az gören kullanıcıların yakınlaştırmasını da
 * engeller (WCAG 1.4.4). Bir erişilebilirlik özelliğini kapatarak düzen hatası gizlenmez.
 */
eq(/user-scalable\s*=\s*no/.test(html), false, "zoom KAPATILMAMIŞ (erişilebilirlik)");
eq(/maximum-scale\s*=\s*1/.test(html), false, "maximum-scale ile zoom kısıtlanmamış");
ok(/viewport-fit=cover/.test(html), "viewport-fit=cover var (çentikli telefonlarda güvenli alan değişkenleri dolu gelir)");
ok(/width=device-width/.test(html), "duyarlı görünüm penceresi tanımlı");

/**
 * iOS YATAY MODDA METNİ ŞİŞİRİYOR. `-webkit-text-size-adjust: 100%` olmadan Safari bazı metin
 * bloklarını kendiliğinden büyütüyor ve düzen taşıyor.
 */
ok(/-webkit-text-size-adjust/.test(css), "iOS yatay mod metin şişmesi kapalı");

/**
 * MOBİLDE 100vh ADRES ÇUBUĞUNU DA SAYIYOR → tam ekran öğe alttan kesiliyor. `dvh` tam bunun için
 * var ama eski tarayıcıda yok; bu yüzden vh ile yazıp @supports ile dvh'ye geçmek gerekiyor.
 */
const viewportUnits = [...code.matchAll(/100vh/g)].length;
if (viewportUnits > 0) {
  ok(/@supports \(height: 100dvh\)/.test(css), "100vh kullanılan yerde dvh yedeği var");
}
ok(/@supports \(height: 100dvh\)/.test(css), "dvh geçişi @supports ile korunuyor (eski tarayıcı bozulmuyor)");

/**
 * ÖN EKLER. `backdrop-filter` Safari'de `-webkit-` ön eki gerektiriyor; `line-clamp` da webkit
 * özellikleriyle çalışıyor. Bunları elle yazmak yerine autoprefixer yapıyor — ama autoprefixer
 * yapılandırmadan DÜŞERSE hiçbir hata çıkmaz, sadece Safari'de bulanıklık ve satır kırpma kaybolur.
 * Sessizce bozulan şeyler test edilmeli.
 */
const postcss = read("frontend", "postcss.config.js");
ok(/autoprefixer/.test(postcss), "autoprefixer yapılandırmada (Safari ön ekleri otomatik)");
ok(existsSync(join(ROOT, "frontend", "node_modules", "autoprefixer")), "autoprefixer gerçekten kurulu");

/**
 * `:has()` — Firefox 121 öncesinde yok. Kullanılıyorsa Firefox'ta düzen sessizce bozulur
 * (hata yok, sadece stil uygulanmaz). Şimdilik hiç kullanılmıyor; kullanılırsa bilinçli olsun.
 */
eq(/:has\(/.test(code) || /:has\(/.test(css), false, ":has() kullanılmıyor (Firefox 121 öncesinde yok)");

/**
 * ÇENTİKLİ TELEFONLARDA ALT ÇUBUK. Alt sekme çubuğu ana ekran çubuğunun altında kalıyordu.
 */
ok(/env\(safe-area-inset-bottom/.test(css), "güvenli alan boşluğu tanımlı");
ok(/pb-safe/.test(read("frontend", "src", "components", "features", "OwnerBottomNav.tsx")),
  "alt gezinme çubuğu güvenli alanı kullanıyor");

/**
 * KAYDIRMA ZİNCİRLENMESİ: pencere içi liste bitince tarayıcı kaydırmayı arkadaki sayfaya devrediyor.
 */
ok(/overscroll-behavior-y: contain/.test(css), "kaydırma zincirlenmesi kesiliyor");

// ================================================================ 5) DUYARLI TASARIM KAPSAMI
/**
 * DUYARLILIK TESTİ NEYE BAKMALI? İlk sürümde "her ana ekranda en az 3 kırılma noktası olsun"
 * diye saydım ve OwnerAppointmentsView'i (0 kırılma noktası) hata olarak işaretledi. Bakınca
 * gördüm ki o ekran tek sütunlu ve tamamen AKIŞKAN (flex-1, w-full, min-w-0, truncate) —
 * kırılma noktasına ihtiyacı yok. Yani ölçtüğüm şey duyarlılık değil, duyarlılığın bir vekiliydi;
 * vekil ölçütler yanlış alarm üretir ve sonunda görmezden gelinir.
 *
 * Bu yüzden artık GERÇEK TEHLİKELER aranıyor — küçük ekranda bozulmaya yol açan somut desenler:
 *   1) Telefon genişliğinden büyük SABİT genişlik (360px'lik ekranda yatay kaydırma yaratır).
 *   2) Kırılma noktası olmadan çok sütunlu ızgara (telefonda okunamayacak kadar sıkışır).
 * Birincisi kesin hata; ikincisi 2 sütuna kadar (rozet/istatistik ikilileri) makul olabildiği için
 * yalnızca 3+ sütunda hata sayılıyor.
 */
const layoutHazards = [];
for (const f of files) {
  const src = readFileSync(f, "utf8");
  const short = f.split(/[/\\]/).slice(-1)[0];
  // 1) Sabit genişlik: w-[400px] gibi. Tailwind'in w-96 (384px) sınırı makul kabul ediliyor.
  for (const m of src.matchAll(/\b(?:min-)?w-\[(\d{3,})px\]/g)) {
    if (Number(m[1]) > 380 && !/sm:|md:|lg:/.test(src.slice(Math.max(0, m.index - 40), m.index))) {
      layoutHazards.push(`${short}: sabit ${m[1]}px genişlik (telefonda yatay kaydırma)`);
    }
  }
  // 2) Kırılma noktasız çok sütunlu ızgara — İZİN LİSTESİYLE.
  //    Bu kuralın ilk sürümü "3+ sütun kırılma noktası olmadan" diye yazılmıştı ve altı yer
  //    işaretledi. Hepsine baktım, altısı da MEŞRUYDU: takvim 7 gün olmak ZORUNDA, emoji ızgarası
  //    296px'lik panelde 8×32px sığıyor, saat dilimleri kısa metin. Yani kural sütun SAYISINI
  //    ölçüyordu, oysa tehlike sütun GENİŞLİĞİ — ve o, kabın genişliğini bilmeden statik olarak
  //    hesaplanamaz. Onun için: bilinen meşru kullanımlar gerekçeleriyle listede; listede
  //    olmayan yeni bir çok sütunlu ızgara eklenirse test düşer ve bir insan karar verir.
  //    (Aynı desen PUBLIC_WRITE listesinde de kullanılıyor.)
  const DENSE_GRID_OK = new Map([
    ["BookingCalendar.tsx:7", "takvim — hafta 7 gündür, daraltılamaz"],
    ["BookingCalendar.tsx:4", "saat dilimleri; sm:6 xl:8 ile zaten genişliyor"],
    ["AppointmentCard.tsx:4", "kısa saat etiketleri (09:00), 360px'de sığıyor"],
    ["EmojiPicker.tsx:8", "8×32px = 256px, panel 296px"],
    ["ShareButton.tsx:4", "dört paylaşım simgesi, küçük menü"],
    ["AppShell.tsx:3", "kısa etiketli istatistik kutuları"],
  ]);
  for (const m of src.matchAll(/(?<!\w[:-])\bgrid-cols-([3-9]|1[0-2])\b/g)) {
    const key = `${short}:${m[1]}`;
    if (!DENSE_GRID_OK.has(key)) layoutHazards.push(`${key} — çok sütunlu ızgara, telefonda kontrol edilmeli`);
  }
}
eq([...new Set(layoutHazards)], [], "küçük ekranı bozan sabit genişlik / sıkışık ızgara yok");

/**
 * Yatay taşma tek başına hata değil ama TAŞMA OLABİLECEK yerde `overflow-x-auto` olmalı: aksi
 * halde içerik kesiliyor ve kullanıcı hiç göremiyor. Uygulamada yatay sekme şeritleri ve geniş
 * tablolar bu deseni kullanıyor; kullanımın sürdüğünü doğruluyoruz.
 */
ok((code.match(/overflow-x-auto/g) || []).length > 3, "taşabilecek şeritlerde yatay kaydırma açık");

/**
 * DOKUNMA HEDEFİ BOYUTU. Apple 44×44pt, Google 48×48dp öneriyor. Tailwind'de `p-2 -m-2` deseni
 * küçük simge düğmelerinin tıklama alanını büyütmek için kullanılıyor; simge düğmelerinin bu
 * desene ya da açık bir yükseklik sınıfına sahip olması gerekiyor. Tam ölçüm ancak tarayıcıda
 * yapılır — burada yalnızca desenin KULLANILDIĞINI doğruluyoruz.
 */
ok((code.match(/-m-1|-m-2|p-3 -m-3|min-h-\[4[0-9]px\]|h-1[0-2]\b/g) || []).length > 20,
  "küçük düğmelerde dokunma alanı büyütme deseni yaygın kullanılıyor");

// ================================================================ 6) KARANLIK MOD ve AZALTILMIŞ HAREKET
/**
 * Karanlık mod uygulamanın kendi sınıfıyla yönetiliyor (dark:). Sistem tercihine saygı, ayrı bir
 * konu; burada en azından dark: varyantının gerçekten kullanıldığını doğruluyoruz — yoksa
 * "karanlık mod var" iddiası boş olurdu.
 */
/**
 * Karanlık mod Tailwind'in `dark:` varyantıyla DEĞİL, `.dark-scope` kapsamı altında bir <style>
 * bloğuyla yapılıyor (mevcut 1000'den fazla açık-tema sınıfını tek tek değiştirmek yerine).
 * İlk yazdığım test `dark:` sayıyordu ve sıfır bulup düştü — yani testin kendisi uygulamanın
 * nasıl çalıştığını bilmiyordu. Doğru test, gerçek mekanizmayı denetlemeli.
 */
const shell = read("frontend", "src", "app", "AppShell.tsx");
ok(/\.dark-scope/.test(shell), "karanlık mod kapsamı (.dark-scope) tanımlı");
ok(/color-scheme: dark/.test(shell), "color-scheme: dark — tarayıcının kendi form denetimleri de koyu");
ok(/\.dark-scope input, \.dark-scope select, \.dark-scope textarea/.test(shell), "form alanları karanlık modda okunur");
/**
 * Firefox `::-webkit-scrollbar` kurallarını YOK SAYAR; karanlık modda kaydırma çubukları açık
 * kalıyordu. Standart karşılığı `scrollbar-color`.
 */
ok(/scrollbar-color:/.test(shell), "Firefox için scrollbar-color tanımlı (webkit kuralı orada çalışmaz)");

if (failures.length === 0) {
  console.log(`OK tarayıcı uyumluluğu (${passed})`);
  process.exit(0);
}
console.log(`BAŞARISIZ tarayıcı uyumluluğu — ${failures.length}/${passed + failures.length}`);
for (const f of failures) console.log("  ✗ " + f);
process.exit(1);
