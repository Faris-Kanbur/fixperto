/**
 * ÇİFT İKON — "başlığın yanında iki simge var" hatasının kalıcı çözümü.
 * ================================================================================================
 * BULUNAN HATA (kullanıcı ekran görüntüsüyle bildirdi): gezinme sekmelerinde her başlığın yanında
 * İKİ simge duruyordu — bir lucide ikonu ve etiket metninin içine gömülü bir emoji ("🔧 Tamirci
 * Ara" + <Wrench/>). İkisi aynı şeyi anlatıyor ve yan yana duruyorlardı.
 *
 * NEDEN GÖZDEN KAÇTI: emoji, çeviri dosyasındaki METNİN İÇİNDE. Bileşen kodunda `{tab.label}`
 * yazıyor, orada emoji görünmüyor. İki dosyaya ayrı ayrı bakan biri hiçbir şey fark etmiyor;
 * hata yalnızca ikisi BİRLEŞTİĞİNDE ekranda ortaya çıkıyor. Bu testin işi tam olarak o birleşimi
 * yapmak.
 *
 * KURAL: emoji yasak DEĞİL. Bir rozette ("⭐ Öne Çıkan") ya da bir bildirim metninde ("✅ Kaydedildi")
 * emoji tek başına simge görevi görüyor ve yerinde. Yasak olan İKİSİ BİRDEN: yanında lucide ikonu
 * olan bir etiketin içinde ayrıca emoji bulunması.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, ok, report, stripComments } from "./_harness.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "frontend", "src");

const files = [];
(function walk(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx|jsx)$/.test(e)) files.push(p);
  }
})(SRC);
const rel = (f) => relative(SRC, f);
/** Yorumlar çıkarılıyor: bu testin kendi açıklaması emoji ve ikon adları içeriyor. */
const read = (f) => stripComments(readFileSync(f, "utf8"));

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

// --- 1) ÇEVİRİ DOSYASINDAN EMOJİLİ ANAHTARLARI ÇIKAR ------------------------------------------
const i18n = readFileSync(join(SRC, "data", "i18n.ts"), "utf8");
const emojiKeys = new Set();
const allKeys = new Set();
for (const m of i18n.matchAll(/^ {2}([A-Za-z0-9_]+):\s*\{([^\n]*)\}/gm)) {
  allKeys.add(m[1]);
  if (EMOJI.test(m[2])) emojiKeys.add(m[1]);
}
ok(allKeys.size > 500, `çeviri anahtarları okundu (${allKeys.size})`);
ok(emojiKeys.size > 0, `emoji içeren anahtarlar var ve bu normal (${emojiKeys.size} adet)`);

// --- 2) LUCIDE İKONU + EMOJİLİ ETİKET AYNI DÜĞMEDE Mİ? ----------------------------------------
/**
 * Doğrudan kullanım: `<Wrench size={16} /> {t("findMechanic")}`.
 * `size={...}` şartı önemli — onsuz her büyük harfli JSX bileşeni (ör. `<Section>`) ikon sanılırdı.
 */
const direct = [];
for (const f of files) {
  read(f).split("\n").forEach((line, i) => {
    for (const m of line.matchAll(/<([A-Z][A-Za-z0-9]*)\s+size=\{?\d+[^>]*\/>[\s{"']*\}?\s*\{t\("([A-Za-z0-9_]+)"/g)) {
      if (emojiKeys.has(m[2])) direct.push(`${rel(f)}:${i + 1} <${m[1]}/> + t("${m[2]}")`);
    }
  });
}

/**
 * DOLAYLI KULLANIM — ilk ölçüm aracım tam olarak burayı KAÇIRDI.
 * Ekran görüntüsündeki asıl sekmeler şöyle yazılmış:
 *     {[{ label: t("findMechanic"), icon: Wrench }, ...].map(tab => <Icon .../>{tab.label})}
 * Etiket bir değişkenden geliyor, o yüzden yukarıdaki düz desen eşleşmiyor. Aracı kendi bulgusuna
 * göre düzeltmek yerine EŞİĞİ İNDİRMEK, hatayı "bulunamadı" diye kapatmak olurdu.
 * Burada: `label: t("...")` ile `icon:` aynı nesnede mi diye bakıyoruz.
 */
const indirect = [];
for (const f of files) {
  const src = read(f);
  for (const m of src.matchAll(/\{[^{}]*\blabel:\s*t\("([A-Za-z0-9_]+)"\)[^{}]*\bicon:\s*[A-Z][A-Za-z0-9]*[^{}]*\}/g)) {
    if (emojiKeys.has(m[1])) {
      const lineNo = src.slice(0, m.index).split("\n").length;
      indirect.push(`${rel(f)}:${lineNo} icon: ... + label: t("${m[1]}")`);
    }
  }
}

const all = [...direct, ...indirect];
eq(all, [],
  "hiçbir yerde lucide ikonu + emojili etiket birlikte yok (biri fazlalık: ya emojiyi etiketten çıkar ya ikonu kaldır)");

// Aracın gerçekten çalıştığını kanıtla: iki desen de en az bir eşleşme ÜRETEBİLİYOR olmalı.
// Yoksa "0 bulgu" sonucu, kuralın tutmasından değil regexin hiçbir şeyi görmemesinden gelebilirdi.
{
  let directPatternWorks = 0, indirectPatternWorks = 0;
  for (const f of files) {
    const src = read(f);
    directPatternWorks += [...src.matchAll(/<([A-Z][A-Za-z0-9]*)\s+size=\{?\d+[^>]*\/>[\s{"']*\}?\s*\{t\("([A-Za-z0-9_]+)"/g)].length;
    indirectPatternWorks += [...src.matchAll(/\{[^{}]*\blabel:\s*t\("([A-Za-z0-9_]+)"\)[^{}]*\bicon:\s*[A-Z][A-Za-z0-9]*[^{}]*\}/g)].length;
  }
  ok(directPatternWorks > 20, `düz desen çalışıyor: ${directPatternWorks} ikon+etiket eşleşmesi görüyor`);
  ok(indirectPatternWorks > 2, `dolaylı desen çalışıyor: ${indirectPatternWorks} nesne-tanımlı sekme görüyor`);
}

// --- 3) GEZİNME SEKMELERİNİN KENDİSİ ----------------------------------------------------------
// Ekran görüntüsündeki bölüm. Etiketlerinin emojisiz olduğunu ADIYLA sabitliyoruz ki bir gün
// biri "daha renkli olsun" diye emojiyi geri koyduğunda test sebebini söylesin.
{
  for (const key of ["findMechanic", "findCar", "jobListingsNavLabel", "multiQuoteBtn", "landingQuoteCta", "saveThisSearchBtn"]) {
    ok(allKeys.has(key), `${key} anahtarı var`);
    ok(!emojiKeys.has(key), `${key} emojisiz (yanında lucide ikonu duruyor)`);
  }
}

// --- 4) BÖLÜMÜN GÖRSEL TUTARLILIĞI ------------------------------------------------------------
/**
 * Kullanıcının ikinci isteği "daha profesyonel olsun"du. Ölçülebilir kısmı tutarlılık:
 * aynı satırdaki öğelerin aynı yazı ölçüsünde ve aynı kalınlıkta olması. Önceden sekmeler
 * `text-sm font-extrabold`, yanındaki teklif düğmesi `text-xs font-extrabold` idi — iki farklı
 * boy yan yana, bakınca "hizasız" hissi veren şey buydu.
 */
{
  const shell = read(join(SRC, "app", "AppShell.tsx"));
  const navBlocks = [...shell.matchAll(/\{\[\{ key: "mechanics", label: t\("findMechanic"\)[\s\S]{0,1200}?\}\)\}/g)];
  eq(navBlocks.length, 2, "gezinme sekmesi grubu iki yerde (araç sahibi + tamirci görünümü) ve ikisi de denetleniyor");

  for (const [i, b] of navBlocks.entries()) {
    const block = b[0];
    ok(/text-sm font-semibold/.test(block), `sekme ${i + 1}: metin ölçüsü/kalınlığı sakin (text-sm font-semibold)`);
    ok(!/font-extrabold/.test(block), `sekme ${i + 1}: font-extrabold kullanılmıyor`);
    ok(/aria-current=\{active \? "page" : undefined\}/.test(block),
      `sekme ${i + 1}: aktif sekme ekran okuyucuya da bildiriliyor (aria-current)`);
    ok(/size=\{16\}/.test(block), `sekme ${i + 1}: ikon boyutu 16`);
  }

  // Teklif düğmesi sekmelerle AYNI ölçüde: yan yana duran iki öğe farklı boyda olmamalı.
  const cta = /<button onClick=\{openQuoteModal\} className="flex items-center gap-2[^"]*"/.exec(shell);
  ok(cta, "masaüstü teklif düğmesi bulundu");
  ok(/text-sm font-semibold/.test(cta[0]), "teklif düğmesi sekmelerle aynı ölçüde (text-sm font-semibold)");
  ok(!/text-xs/.test(cta[0]), "teklif düğmesi artık sekmelerden küçük değil");
}

report("gezinme ikonları");
