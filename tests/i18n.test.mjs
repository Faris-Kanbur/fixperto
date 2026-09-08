// i18n BÜTÜNLÜĞÜ — tsc'nin YAKALAYAMADIĞI bir hata sınıfı: t("olmayanAnahtar") sorunsuz derlenir,
// ekranda ise ham anahtar adı görünür. Bu takım gerçek kaynak dosyaları tarar.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, report } from "./_harness.mjs";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..", "frontend", "src");
const walk = (d) => readdirSync(d).flatMap(f => {
  const p = join(d, f);
  return statSync(p).isDirectory() ? walk(p) : (/\.(tsx|ts)$/.test(f) ? [p] : []);
});
const files = walk(SRC);
const i18nSrc = readFileSync(join(SRC, "data", "i18n.ts"), "utf8");

// --- Tanımlı anahtarlar ---
const defs = [...i18nSrc.matchAll(/^ {2}([a-zA-Z][\w]*): \{ tr:/gm)].map(m => m[1]);
const keys = new Set(defs);
const dupes = defs.filter((k, i) => defs.indexOf(k) !== i);
eq(dupes, [], "i18n: aynı anahtar iki kez tanımlanmamalı");

// --- Her anahtarda üç dil de dolu olmalı ---
const missingLang = [...i18nSrc.matchAll(/^ {2}([a-zA-Z][\w]*): \{ ([^\n]*)\},?$/gm)]
  .filter(m => !(/\btr:/.test(m[2]) && /\ben:/.test(m[2]) && /\bde:/.test(m[2])))
  .map(m => m[1]);
eq(missingLang, [], "i18n: her anahtarda tr/en/de bulunmalı");

// --- Kullanılan anahtarlar tanımlı olmalı (yalnızca sabit metinli çağrılar) ---
// Satır yorumları çıkarılıyor: yorum içindeki t("...") örnekleri gerçek kullanım değil.
const codeOf = (f) => readFileSync(f, "utf8").split("\n").filter(l => !l.trim().startsWith("//")).join("\n");
const used = new Map();
for (const f of files) {
  for (const m of codeOf(f).matchAll(/\bt\("([^"]+)"/g)) {
    if (!used.has(m[1])) used.set(m[1], f.replace(SRC, "src"));
  }
}
const undefinedKeys = [...used].filter(([k]) => !keys.has(k)).map(([k, f]) => `${k} (${f})`);
eq(undefinedKeys, [], "i18n: kullanılan her anahtar tanımlı olmalı");

// --- {değişken} yer tutucuları: çağrıda verilen isimlerle metindekiler uyuşmalı ---
// Argüman nesnesi iç içe süslü parantez ve fonksiyon çağrısı içerebiliyor (String(...), ternary),
// bu yüzden basit [^}]* yerine DENGELİ parantez taraması yapılıyor. Kısayol özellikler
// ({ currency }) de sayılıyor — aksi halde gerçekte verilmiş bir değişken "eksik" görünürdü.
const argsObjectAt = (src, i) => {
  let depth = 0;
  for (let k = i; k < src.length; k++) {
    if (src[k] === "{") depth++;
    else if (src[k] === "}") { depth--; if (depth === 0) return src.slice(i + 1, k); }
  }
  return "";
};
const placeholderMismatch = [];
for (const f of files) {
  const src = codeOf(f);
  for (const m of src.matchAll(/\bt\("([^"]+)",\s*(?=\{)/g)) {
    const key = m[1];
    if (!keys.has(key)) continue;
    const body = argsObjectAt(src, m.index + m[0].length);
    const given = new Set([
      ...[...body.matchAll(/(\w+)\s*:/g)].map(x => x[1]),
      ...[...body.matchAll(/(?:^|[,{])\s*(\w+)\s*(?=[,}]|$)/g)].map(x => x[1]),
    ]);
    const def = i18nSrc.match(new RegExp(`^ {2}${key}: \\{ tr: "([^"]*)"`, "m"));
    if (!def) continue;
    for (const n of new Set([...def[1].matchAll(/\{(\w+)\}/g)].map(x => x[1]))) {
      if (!given.has(n)) placeholderMismatch.push(`${key}: "{${n}}" verilmemiş (${f.replace(SRC, "src")})`);
    }
  }
}
eq(placeholderMismatch, [], "i18n: {yer tutucu} isimleri çağrılarla uyuşmalı");

// --- KARŞILAMA TURU: metinler i18n'de olmalı ---------------------------------------------------
// Yaşanan hata: ONBOARDING_SLIDES içindeki başlık/açıklama sabit Türkçe yazılıydı. Site
// İngilizce/Almanca'ya alınsa bile kullanıcının gördüğü İLK ekran Türkçe kalıyordu.
const constantsSrc = readFileSync(join(SRC, "data", "constants.ts"), "utf8");
const slidesBlock = constantsSrc.slice(
  constantsSrc.indexOf("export const ONBOARDING_SLIDES = ["),
  constantsSrc.indexOf("];", constantsSrc.indexOf("export const ONBOARDING_SLIDES = [")),
);
eq(/\btitle:\s*"/.test(slidesBlock), false, "slaytlarda sabit başlık metni yok");
eq(/\bdesc:\s*"/.test(slidesBlock), false, "slaytlarda sabit açıklama metni yok");
eq((slidesBlock.match(/titleKey:/g) || []).length, 3, "her slaytın titleKey'i var");
eq((slidesBlock.match(/descKey:/g) || []).length, 3, "her slaytın descKey'i var");

report("i18n");
