/**
 * SAYFA BAŞINA TEK GERİ TUŞU.
 * ================================================================================================
 * NEDEN BU TEST VAR: kullanıcı bu sorunu ÜÇ KEZ bildirdi. Üçüncüsünde ekran görüntüsü gönderdi —
 * üstte standart üst çubuğun geri oku, hemen altında kapak görselinin üstünde yüzen ikinci bir
 * geri oku. İlk iki bildirimde sorun BULUNDUĞU SAYFADA düzeltildi ve kardeş sayfalara bakılmadı;
 * hatta AppShell'de "iki tane geri tuşu vardı, tek üst çubuğa indirdik" diye yazılı bir yorum bile
 * var. Yani ders bir yerde öğrenilmiş, taşınmamış — bu oturumun en çok tekrarlayan bulgusu.
 *
 * Bir sayfada iki geri tuşu olması kozmetik bir kusur değil: ikisi FARKLI yerlere gidiyordu
 * (biri listeye, biri panoya) ve kullanıcı hangisinin nereye götürdüğünü bilemiyordu.
 *
 * BU TEST NEYİ ÖLÇÜYOR: her ekranda "geri" işlevi gören en fazla BİR öğe olmalı. Ölçüm kaynak
 * koddan; sayılan şeyler:
 *   - `PageTopBar` bileşeni bir `onBack` ile çağrılıyorsa → 1 geri tuşu,
 *   - kapak görselinin üstünde yüzen geri oku (`absolute top-* left-*` + geri ikonu/etiketi),
 *   - sayfa içi "‹ Geri" bağlantısı (geri etiketli düğme).
 *
 * NEYİ SAYMIYOR ve NEDEN:
 *   - Logo (`backToHomeBtn`): geri DEĞİL, ana sayfaya gider. Her sayfada bilerek var.
 *   - Takvim/galeri/karusel oklarında da `ChevronLeft` kullanılıyor; onlar gezinme değil, içerik
 *     ilerletme. Bu yüzden yalnızca GERİ ETİKETLİ ya da sol üstte YÜZEN düğmeler sayılıyor.
 *   - Tam ekran modaller (ilan/iş detayı kartı): üst çubuk kullanmıyorlar, tek kapatma okları var.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, ok, report, stripComments } from "./_harness.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "frontend", "src");
/**
 * YORUMLAR ÇIKARILIYOR. Bu testi yazarken tam olarak ölçmeye çalıştığı hatayı kendisi yaptı:
 * "ikinci yapışkan çubuk kaldırıldı" kontrolü, o çubuğun NEDEN kaldırıldığını anlatan yorumun
 * içindeki `sticky top-0 z-20` metnine takıldı. Bir düzeltmeyi belgelemek, kaldırılan kodu
 * alıntılamayı gerektiriyor; statik yoklama yalnızca KODA bakmalı (bkz. tests/_harness.mjs).
 */
const read = (...p) => stripComments(readFileSync(join(SRC, ...p), "utf8"));

/** JSX açılış etiketlerini süslü parantez derinliğine göre tarar (bkz. a11y.test.mjs gerekçesi). */
function openTags(src, name) {
  const out = [];
  let i = 0;
  for (;;) {
    i = src.indexOf(`<${name}`, i);
    if (i === -1) break;
    const nxt = src[i + name.length + 1];
    if (nxt && /[A-Za-z0-9\-_]/.test(nxt)) { i += 1; continue; }
    let j = i + 1, depth = 0, quote = null;
    while (j < src.length) {
      const c = src[j];
      if (quote) { if (c === quote && src[j - 1] !== "\\") quote = null; }
      else if (c === '"' || c === "'" || c === "`") quote = c;
      else if (c === "{") depth += 1;
      else if (c === "}") depth -= 1;
      else if (c === ">" && depth === 0) break;
      j += 1;
    }
    out.push({ text: src.slice(i, j + 1), line: src.slice(0, i).split("\n").length, end: j + 1 });
    i = j + 1;
  }
  return out;
}

/** Geri işlevi gören etiketler — logoyu ve karusel oklarını BİLEREK dışarıda bırakıyor. */
const BACK_LABELS = ['t("back")', 't("backToListBtn")', 't("a11yBack")', 't("backToDashboard")'];

let isFloatingBack; let inPageContext;

function backAffordances(block, label) {
  const found = [];
  // 1) PageTopBar'ın kendi geri oku
  for (const t of openTags(block, "PageTopBar")) {
    // Çok satırlı çağrıda `onBack` etiketin içinde olur; tek satırlıkta da.
    if (/onBack/.test(t.text)) found.push(`${label}:${t.line} PageTopBar(onBack)`);
  }
  // 2) Düğmeler: yüzen sol-üst oklar ve geri etiketli düğmeler
  for (const t of openTags(block, "button")) {
    const body = (block.slice(t.end).split("</button>")[0] || "").slice(0, 300);
    const floatingTopLeft = /absolute\s+top-\d/.test(t.text) && /left-\d/.test(t.text);
    const hasBackIcon = /<ChevronLeft/.test(body) || /m15 18-6-6 6-6/.test(body);
    const hasBackLabel = BACK_LABELS.some((l) => t.text.includes(l) || body.includes(l));
    if ((floatingTopLeft && hasBackIcon) || hasBackLabel) {
      found.push(`${label}:${t.line} ${hasBackLabel ? "geri etiketli düğme" : "yüzen sol-üst ok"}`);
    }
  }
  return found;
}

// --- 1) ÜST ÇUBUK + YÜZEN OK AYNI SAYFADA OLAMAZ ---------------------------------------------
/**
 * ÖNCE DAHA GENİŞ BİR KURAL DENEDİM VE ÇALIŞMADI — nedenini yazıyorum, çünkü bu testi sonra
 * genişletmek isteyen biri aynı duvara çarpacak.
 *
 * Denediğim: AppShell'i ekran bloklarına bölüp her blokta TÜM geri afordanslarını saymak.
 * Ölçtüm, üç "bulgu" verdi ve ÜÇÜ DE YANLIŞ ALARMDI:
 *   - `detail` bloğunda iki geri oku sayıldı; ikisi İKİ AYRI TAM EKRAN MODALIN (ilan kartı ve iş
 *     kartı) kapatma okuydu. Aynı anda ikisi asla görünmüyor.
 *   - `chat` bloğu `booking` ekranını YUTTU (blok sınırı yakalanamadı), iki üst çubuk sayıldı.
 *   - `mechProfilePage` dosyanın sonuna kadar uzadı ve arkasındaki bağımsız modalleri içine aldı.
 * Yani ölçüm, "aynı anda ekranda görünür mü" sorusunu cevaplayamıyor — JSX'i statik okuyarak
 * karşılıklı dışlayan dalları ayırt etmek güvenilir değil. Yeşile boyamak için eşik oynatmak
 * yerine kuralı, GERÇEKTEN belirlenebilir olana daralttım.
 *
 * DARALTILMIŞ KURAL: bir sayfa hem `PageTopBar` (kendi geri oku var) hem de SOL ÜSTTE YÜZEN bir
 * geri oku içeremez. Yüzen ok her zaman sayfanın görünür en üstüne sabitlenir; üst çubuk da
 * oradadır. Yani ikisi varsa ikisi de görünür — kullanıcının gönderdiği ekran görüntüsündeki
 * durumun tam tanımı bu. Karşılıklı dışlama ihtimali yok, tahmin yok.
 */
{
  /**
   * BAĞLAM AYRIMI: yüzen geri oku her zaman hata DEĞİL.
   * Tam ekran modaller (ilan kartı, iş kartı) üst çubuk kullanmıyor; onların tek geri/kapat oku
   * yüzen oktur ve bu doğru. İlk daraltılmış kuralım bunları da bulguladı — yani hâlâ yanlış
   * alarm veriyordu.
   * Ayırt edici: yüzen okun ÖNÜNDE en son ne geliyor? Bir `PageTopBar` ise ok bir SAYFAYA ait ve
   * o sayfada zaten üst çubuk var (çift geri). Bir tam ekran modal kabı (`fixed inset-0`) ise ok
   * MODALA ait ve tektir.
   */
  const shellRaw = read("app", "AppShell.tsx");
  isFloatingBack = (src, t) => {
    const body = (src.slice(t.end).split("</button>")[0] || "").slice(0, 300);
    const floatingTopLeft = /absolute\s+top-\d/.test(t.text) && /left-\d/.test(t.text);
    const back = /<ChevronLeft/.test(body) || /m15 18-6-6 6-6/.test(body)
      || /t\("back"\)/.test(t.text) || /t\("a11yBack"\)/.test(t.text);
    return floatingTopLeft && back;
  };
  inPageContext = (src, at) => src.lastIndexOf("<PageTopBar", at) > src.lastIndexOf("fixed inset-0", at);

  const floating = openTags(shellRaw, "button")
    .filter((t) => isFloatingBack(shellRaw, t) && inPageContext(shellRaw, t.start ?? t.end));
  const lines = floating.map((t) => `AppShell.tsx:${t.line}`);
  eq(floating.length, 0,
    `üst çubuklu bir sayfada yüzen geri oku yok${lines.length ? ` — ${lines.join(", ")}` : ""}`);
  // Ölçüm aracının GERÇEKTEN çalıştığını kanıtla: modal bağlamındaki okları saymıyor ama var
  // olduklarını görüyor. Aksi halde "0 bulgu" sonucu, aracın hiçbir şey görmemesinden de gelebilir.
  const allFloating = openTags(shellRaw, "button").filter((t) => isFloatingBack(shellRaw, t));
  ok(allFloating.length >= 2,
    `araç yüzen okları görüyor ama modal olanları doğru şekilde muaf tutuyor (${allFloating.length} yüzen ok, ${floating.length} bulgu)`);

  // Sayfa bileşenlerinde de aynı kural: PageTopBar varsa yüzen ok olamaz.
  for (const file of ["components/features/MechDetailBody.tsx", "components/features/ListingDetailPage.tsx",
    "components/features/BlogPages.tsx", "components/features/CareersPage.tsx"]) {
    const src = read(...file.split("/"));
    if (!/<PageTopBar/.test(src)) continue;
    const bad = openTags(src, "button").filter((t) => isFloatingBack(src, t) && inPageContext(src, t.start ?? t.end));
    eq(bad.length, 0, `${file.split("/").pop()}: üst çubuk varken yüzen geri oku yok`);
  }
}

// --- 2) Kendi başına sayfa olan bileşenler ----------------------------------------------------
// Bunların her biri tek bir sayfayı temsil ediyor, yani dosya = ölçüm birimi.
{
  const pageComponents = [
    ["components/features/MechDetailBody.tsx", "tamirci detayı"],
    ["components/features/ListingDetailPage.tsx", "ilan detay sayfası"],
    ["components/features/CareersPage.tsx", "kariyer sayfası"],
  ];
  for (const [file, label] of pageComponents) {
    const src = read(...file.split("/"));
    const bars = openTags(src, "PageTopBar").filter((t) => /onBack/.test(t.text));
    ok(bars.length <= 1, `${label}: tek üst çubuk (${bars.length})`);
  }
  // BlogPages tek dosyada ÜÇ sayfa barındırıyor (liste, yazı, hakkında) ve her birinin kendi
  // PageTopBar'ı var — yani dosya toplamı 3 çıkar ama bu doğru. Sayfa başına bakıyoruz.
  const blog = read("components", "features", "BlogPages.tsx");
  const blogBars = openTags(blog, "PageTopBar").length;
  ok(blogBars >= 3, `BlogPages'te sayfa başına bir üst çubuk (${blogBars} çubuk / 3 sayfa)`);
  const blogFloating = openTags(blog, "button").filter((t) => /absolute\s+top-\d/.test(t.text) && /left-\d/.test(t.text));
  eq(blogFloating.length, 0, "blog sayfalarında yüzen geri oku yok");
}

// --- 3) DÜZELTİLEN DÖRT SAYFA: tek tek doğrulama ---------------------------------------------
// Genel kural yukarıda; burada bu turda düzeltilen yerlerin gerçekten düzeldiğini ölçüyoruz,
// çünkü genel kural gelecekte gevşetilse bile bu dördü kırmızı yanmalı.
{
  const mech = read("components", "features", "MechDetailBody.tsx");
  ok(/<PageTopBar onBack=\{goBack\} \/>/.test(mech), "tamirci detayı: üst çubuk geri oku duruyor");
  ok(!/absolute top-4 left-4[^>]*>\s*<ChevronLeft/.test(mech), "tamirci detayı: kapaktaki yüzen geri oku KALDIRILDI");
  ok(/toggleFavoriteMechanic/.test(mech) && /ShareButton/.test(mech),
    "tamirci detayı: favori ve paylaş kapakta KALDI (onlar görsel eylemi, geri ise gezinme)");

  const listing = read("components", "features", "ListingDetailPage.tsx");
  ok(/onBack=\{closeListingPage\}/.test(listing), "ilan sayfası: üst çubuk geri oku duruyor");
  ok(/right=\{\(/.test(listing), "ilan sayfası: favori/paylaş üst çubuğun sağ yuvasına taşındı");
  ok(!/sticky top-0 z-20/.test(listing), "ilan sayfası: ÜST ÜSTE BİNEN ikinci yapışkan çubuk kaldırıldı");

  const shell = read("app", "AppShell.tsx");
  ok(/<PageTopBar onBack=\{\(\) => setScreen\("owner"\)\} \/>/.test(shell),
    "araç sahibi profil sayfası artık standart üst çubuğu kullanıyor (logo da görünür)");
  eq((shell.match(/absolute top-4 left-4 z-40/g) || []).length, 0,
    "araç sahibi profilindeki ve ayarlardaki yüzen geri okları kaldırıldı");
  // Dört sayfa da aynı deseni kullanıyor: bu sayı düşerse biri tekrar kendi çubuğunu yapmış olur.
  ok((shell.match(/<PageTopBar onBack=/g) || []).length >= 5,
    "profil/ayarlar/sohbet/randevu sayfalarının hepsi standart üst çubuğu kullanıyor");
}

report("tek geri tuşu");
