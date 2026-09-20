// tests/design-tokens.test.mjs
// KURAL: her semantic token hem :root hem .dark-scope altında tanımlı olmalı,
// ve tailwind.config.js her birini Tailwind renk adı olarak eşlemeli. Bu test
// Wave 2'deki palet-değiştirici bu dosyaları değiştirmeye başladığında bir
// tokenin yanlışlıkla silinmesini/eşleşmemesini yakalar.
//
// KAPSAM GENİŞLETİLDİ (nihai inceleme sonrası): önceki hâli yalnızca tokens.css
// ve tailwind.config.js'i okuyordu — token DEĞERLERİ doğrulanıyordu ama token
// SİSTEMİNİN gerçekten bağlı olduğu hiç sınanmıyordu. index.css'teki @import
// satırı silinse bile eski hâliyle bu test 90/90 yeşil kalırdı ve tüm sistem
// tarayıcıda sessizce devre dışı kalırdı. Şimdi index.css'in tokens.css'i
// import ettiği ve AppShell.tsx'in karanlık mod bloğunun gerçekten
// var(--color-*) kullandığı da doğrulanıyor.
//
// SERTLEŞTİRME (Wave 1 sonrası): token değerleri artık hex değil "R G B" üçlüsü
// (Tailwind'in opacity-modifier deseni: rgb(var(--color-x) / <alpha-value>)) —
// bg-surface/95 gibi kullanımları desteklemek için. text-primary/secondary/muted
// isimleri fg/fg-secondary/fg-muted'a taşındı: "primary" zaten marka rengi için
// .text-primary sınıfını ürettiğinden aynı isim iki farklı anlama geliyordu.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ok, report } from "./_harness.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...p) => readFileSync(join(ROOT, ...p), "utf8");
const tokens = read("frontend", "src", "styles", "tokens.css");
const twConfig = read("frontend", "tailwind.config.js");
const indexCss = read("frontend", "src", "index.css");
const shell = read("frontend", "src", "app", "AppShell.tsx");

const TOKEN_NAMES = [
  "primary", "primary-hover", "primary-active", "secondary", "accent",
  "background", "surface", "surface-elevated", "fg", "fg-secondary",
  "fg-muted", "border", "success", "warning", "error", "info", "cta", "focus",
];

// Seçicinin süslü-parantez GÖVDESİNİ döndürür (bir sonraki seçiciye/EOF'a değil,
// yalnızca kendi kapanış parantezine kadar) — Wave 2 bu dosyaya yeni palet
// blokları eklediğinde, o bloklar yanlışlıkla :root/.dark-scope'un bir parçası
// gibi okunmasın diye. Bu dosyada iç içe süslü parantez yok, basit indexOf yeterli.
const blockBody = (src, selector) => {
  const start = src.indexOf(selector);
  const openBrace = src.indexOf("{", start);
  const closeBrace = src.indexOf("}", openBrace);
  return src.slice(openBrace + 1, closeBrace);
};

const rootBlock = blockBody(tokens, ":root {");
const darkBlock = blockBody(tokens, ".dark-scope {");

for (const name of TOKEN_NAMES) {
  ok(rootBlock.includes(`--color-${name}:`), `:root --color-${name} tanımlı`);
  ok(darkBlock.includes(`--color-${name}:`), `.dark-scope --color-${name} tanımlı`);
  ok(twConfig.includes(`rgb(var(--color-${name}) / <alpha-value>)`), `tailwind.config.js "${name}" tokenini eşliyor`);
}

// Golden-value check: bu değerler, uygulamanın BUGÜNKÜ (token'sız) davranışıyla
// birebir aynı olmalı (focus hariç — bkz. not) — plandaki token tablosu bu
// değerleri belgeliyor.
const GOLDEN = {
  primary: "37 99 235", "primary-hover": "29 78 216", "primary-active": "30 64 175",
  secondary: "17 24 39", accent: "245 158 11", background: "249 250 251", surface: "255 255 255",
  "surface-elevated": "243 244 246", fg: "17 24 39", "fg-secondary": "107 114 128",
  "fg-muted": "156 163 175", border: "229 231 235", success: "22 163 74", warning: "217 119 6",
  error: "220 38 38", info: "59 130 246", cta: "37 99 235",
  // focus bilinçli olarak eski davranıştan (191 219 254 / #bfdbfe) FARKLI: o değer WCAG 1.4.11'in
  // metin-dışı odak göstergesi için istediği 3:1 kontrastın altındaydı. Merkezi token olduğu için
  // bunu yükseltmek tek satırla tüm sitedeki focus ring'leri düzeltiyor.
  focus: "59 130 246",
};
for (const [name, rgb] of Object.entries(GOLDEN)) {
  ok(rootBlock.includes(`--color-${name}: ${rgb};`), `:root --color-${name} değeri ${rgb}`);
}
const GOLDEN_DARK = { ...GOLDEN, secondary: "13 13 19", background: "18 18 24", surface: "23 23 31",
  "surface-elevated": "32 32 43", fg: "233 233 240", "fg-secondary": "163 163 184",
  "fg-muted": "113 113 140", border: "44 44 58" };
for (const [name, rgb] of Object.entries(GOLDEN_DARK)) {
  ok(darkBlock.includes(`--color-${name}: ${rgb};`), `.dark-scope --color-${name} değeri ${rgb}`);
}

// --- BAĞLANTI KONTROLLERİ (nihai inceleme bulgusu): değer doğru olsa bile
// dosya gerçekten IMPORT edilmemişse veya AppShell hâlâ token KULLANMIYORSA
// sistem tarayıcıda etkisiz kalır. Yukarıdaki testler bunu YAKALAMAZ.
ok(indexCss.includes('@import "./styles/tokens.css";'), "index.css tokens.css'i import ediyor");

const shellDarkBlock = shell.slice(shell.indexOf(".dark-scope { color-scheme: dark; }"), shell.indexOf("@keyframes micro-pop"));
for (const name of ["surface", "background", "surface-elevated", "fg", "fg-secondary", "fg-muted", "border", "secondary"]) {
  ok(shellDarkBlock.includes(`var(--color-${name})`), `AppShell.tsx karanlık mod bloğu var(--color-${name}) kullanıyor`);
}

// --- A11Y DÜZELTMESİ KAPSANIYOR MU (nihai inceleme bulgusu): bu dalgadaki TEK
// davranış değiştiren satır (sohbet dil seçicisindeki focus ring) önceden hiç
// test edilmiyordu.
ok(shell.includes('className="bg-gray-100 text-gray-700 text-xs rounded-lg px-2 py-1 border-none outline-none focus:ring-2 focus:ring-focus"'), "sohbet dil seçicisinde focus:ring-focus var");

report("design tokens");
