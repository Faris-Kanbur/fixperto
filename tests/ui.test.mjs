// UI / UX — gerçek kaynak dosyalar üzerinde statik kurallar.
// Buradaki kuralların HER BİRİ bu projede gerçekten yaşanmış bir hatadan doğdu; amaç aynı
// hatanın sessizce geri gelmemesi. tsc bu sınıfların hiçbirini yakalayamıyor.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, report } from "./_harness.mjs";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..", "frontend", "src");
const walk = (d) => readdirSync(d).flatMap(f => {
  const p = join(d, f);
  return statSync(p).isDirectory() ? walk(p) : (/\.tsx$/.test(f) ? [p] : []);
});
const files = walk(SRC).map(p => ({ p, rel: p.replace(SRC, "src"), lines: readFileSync(p, "utf8").split("\n") }));
const isComment = (l) => { const s = l.trim(); return s.startsWith("//") || s.startsWith("*") || s.startsWith("/*") || s.startsWith("{/*"); };

// --- KURAL 1: bandın üstüne binen kart (-mt-) konumlandırılmış olmalı --------------------------
// Yaşanan hata: üst degrade bant `relative` (içindeki düğmeler absolute), kart ise konumsuzdu.
// CSS boyama sırası kaynak sırasına değil konumlandırmaya bakar → bant, kartın tepesini kapattı
// ("Merhaba, <isim>" satırı kayboldu, avatar kesildi).
const overlapIssues = [];
for (const { rel, lines } of files) {
  lines.forEach((l, i) => {
    if (isComment(l) || !/-mt-(?:1[0-9]|[89])\b/.test(l)) return;
    const ctx = lines.slice(Math.max(0, i - 3), i + 1).join(" ");
    if (!/\b(relative|absolute|fixed|sticky)\b/.test(ctx)) overlapIssues.push(`${rel}:${i + 1}`);
  });
}
eq(overlapIssues, [], "bandın üstüne binen kart konumlandırılmış olmalı (yoksa bant kartı kapatır)");

// --- KURAL 2: katman sırası tutarlı olmalı -----------------------------------------------------
// Yaşanan hata: başlık kartı z-10 yapılınca, bildirim panelini taşıyan kapsayıcı da z-10 olduğu
// için (ve DOM'da önce geldiği için) panel kartın ARKASINDA açıldı.
const shell = files.find(f => f.rel.endsWith("AppShell.tsx")).lines.join("\n");
const zOf = (re) => { const m = shell.match(re); return m ? Number(m[1]) : null; };
const zCard = zOf(/max-w-7xl mx-auto px-5 md:px-8 relative z-(\d+)/);
const zNotif = zOf(/absolute top-4 right-4 md:right-8 z-(\d+) flex items-center gap-2/);
const zTabs = zOf(/sticky top-0 z-(\d+) bg-white\/90/);
eq([zCard !== null, zNotif !== null, zTabs !== null], [true, true, true], "katman sınıfları bulunabilmeli");
eq(zNotif > zCard, true, `bildirim kapsayıcısı (z-${zNotif}) başlık kartının (z-${zCard}) üstünde olmalı`);
eq(zNotif > zTabs, true, `bildirim kapsayıcısı (z-${zNotif}) yapışkan sekme çubuğunun (z-${zTabs}) üstünde olmalı`);
eq(zTabs > zCard, true, `yapışkan sekme çubuğu (z-${zTabs}) kartın (z-${zCard}) üstünde olmalı`);

// --- KURAL 3: yalnız ikonlu düğmelerin erişilebilir adı olmalı --------------------------------
// Ekran okuyucu için: içinde metin olmayan bir düğme aria-label ya da title taşımalı.
const iconBtnIssues = [];
for (const { rel, lines } of files) {
  lines.forEach((l, i) => {
    if (isComment(l)) return;
    for (const m of l.matchAll(/<button\b([^>]*)>(\s*<[A-Z]\w*\s+size=\{\d+\}[^>]*\/>\s*)<\/button>/g)) {
      if (!/aria-label=|title=/.test(m[1])) iconBtnIssues.push(`${rel}:${i + 1}`);
    }
  });
}
eq(iconBtnIssues, [], "yalnız ikonlu düğmelerde aria-label ya da title bulunmalı");

// --- KURAL 4: "tıklanabilir görünen" öğe klavyeyle de erişilebilir olmalı ----------------------
// Yalnızca YAZAR tıklanabilir GÖRÜNMESİNİ istediği öğeler (cursor-pointer) denetleniyor.
// Modal arka planı ve <button> içindeki dekoratif div'ler bilinçli olarak kapsam dışı: onlar
// zaten görsel olarak tıklanabilir görünmüyor ya da erişilebilir bir düğmenin parçası.
const clickableIssues = [];
for (const { rel, lines } of files) {
  lines.forEach((l, i) => {
    if (isComment(l)) return;
    // "=>" içindeki '>' etiketin sonu sanılıyordu (ok fonksiyonlu onClick'ler denetimden kaçıyordu).
    const safe = l.replaceAll("=>", "=\u00bb");
    for (const m of safe.matchAll(/<(div|span|p)\b([^>]*)>/g)) {
      const attrs = m[2];
      if (/data-a11y-exempt/.test(attrs)) continue;   // bilinçli istisna (gerekçesi kodda yazılı)
      if (!/\bonClick=/.test(attrs) || !/cursor-pointer/.test(attrs)) continue;
      if (!/role="button"/.test(attrs)) clickableIssues.push(`${rel}:${i + 1} <${m[1]}>`);
    }
  });
}
eq(clickableIssues, [], "tıklanabilir görünen öğe klavyeyle erişilebilir olmalı (role=\"button\" ya da <button>)");

report("ui");
