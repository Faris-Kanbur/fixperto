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
  "background", "surface", "surface-elevated", "text-primary", "text-secondary",
  "text-muted", "border", "success", "warning", "error", "info", "cta", "focus",
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
  ok(twConfig.includes(`var(--color-${name})`), `tailwind.config.js "${name}" tokenini eşliyor`);
}

// Golden-value check: bu değerler, uygulamanın BUGÜNKÜ (token'sız) davranışıyla
// birebir aynı olmalı — plandaki token tablosu bu değerleri belgeliyor.
const GOLDEN = {
  primary: "#2563eb", "primary-hover": "#1d4ed8", "primary-active": "#1e40af",
  secondary: "#111827", accent: "#f59e0b", background: "#f9fafb", surface: "#ffffff",
  "surface-elevated": "#f3f4f6", "text-primary": "#111827", "text-secondary": "#6b7280",
  "text-muted": "#9ca3af", border: "#e5e7eb", success: "#16a34a", warning: "#d97706",
  error: "#dc2626", info: "#3b82f6", cta: "#2563eb", focus: "#bfdbfe",
};
for (const [name, hex] of Object.entries(GOLDEN)) {
  ok(rootBlock.includes(`--color-${name}: ${hex};`), `:root --color-${name} değeri ${hex}`);
}
const GOLDEN_DARK = { ...GOLDEN, secondary: "#0d0d13", background: "#121218", surface: "#17171f",
  "surface-elevated": "#20202b", "text-primary": "#e9e9f0", "text-secondary": "#a3a3b8",
  "text-muted": "#71718c", border: "#2c2c3a" };
for (const [name, hex] of Object.entries(GOLDEN_DARK)) {
  ok(darkBlock.includes(`--color-${name}: ${hex};`), `.dark-scope --color-${name} değeri ${hex}`);
}

// --- BAĞLANTI KONTROLLERİ (nihai inceleme bulgusu): değer doğru olsa bile
// dosya gerçekten IMPORT edilmemişse veya AppShell hâlâ token KULLANMIYORSA
// sistem tarayıcıda etkisiz kalır. Yukarıdaki testler bunu YAKALAMAZ.
ok(indexCss.includes('@import "./styles/tokens.css";'), "index.css tokens.css'i import ediyor");

const shellDarkBlock = shell.slice(shell.indexOf(".dark-scope { color-scheme: dark; }"), shell.indexOf("@keyframes micro-pop"));
for (const name of ["surface", "background", "surface-elevated", "text-primary", "text-secondary", "text-muted", "border", "secondary"]) {
  ok(shellDarkBlock.includes(`var(--color-${name})`), `AppShell.tsx karanlık mod bloğu var(--color-${name}) kullanıyor`);
}

// --- A11Y DÜZELTMESİ KAPSANIYOR MU (nihai inceleme bulgusu): bu dalgadaki TEK
// davranış değiştiren satır (sohbet dil seçicisindeki focus ring) önceden hiç
// test edilmiyordu.
ok(shell.includes('className="bg-gray-100 text-gray-700 text-xs rounded-lg px-2 py-1 border-none outline-none focus:ring-2 focus:ring-focus"'), "sohbet dil seçicisinde focus:ring-focus var");

report("design tokens");
