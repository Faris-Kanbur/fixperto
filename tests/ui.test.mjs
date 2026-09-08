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

// --- KURAL 5: iki sütunlu ekran dar kapsayıcıya hapsedilmemeli ---------------------------------
// Yaşanan hata: randevu ekranı `lg:grid-cols-[1fr_380px]` ile iki sütunlu tasarlandı ama kabuk
// onu `max-w-2xl` (672px) ile sınırlıyordu. Tailwind kırılımları KAPSAYICIYA değil VIEWPORT'a
// bakar — geniş ekranda `lg:` tetiklenip 672 pikselin içinde iki sütun açtı ve sol sütun
// okunamaz hâle geldi. Kural: iki sütunlu/yapışkan düzen kullanan ekran tam genişlikte olmalı.
const shellLine = shell.split("\n").find((l) => l.includes('shadow-xl flex flex-col')) || "";
const fullWidthScreens = new Set([...shellLine.matchAll(/screen === "(\w+)"/g)]
  .map((m) => m[1])
  .slice(0, shellLine.indexOf('max-w-none') > -1
    ? [...shellLine.matchAll(/screen === "(\w+)"/g)].filter((m) => m.index < shellLine.indexOf('max-w-none')).length
    : 0));
// Ekran bloklarını kabaca ayır: {screen === "X" && ... bir sonraki {screen === öncesine kadar
const blocks = [];
const re = /\{screen === "(\w+)" &&/g;
let m2, prev = null;
while ((m2 = re.exec(shell)) !== null) {
  if (prev) blocks.push({ name: prev.name, body: shell.slice(prev.idx, m2.index) });
  prev = { name: m2[1], idx: m2.index };
}
if (prev) blocks.push({ name: prev.name, body: shell.slice(prev.idx) });
const trapped = [];
for (const b of blocks) {
  const twoCol = /lg:grid-cols-\[|lg:sticky/.test(b.body);
  if (twoCol && !fullWidthScreens.has(b.name)) trapped.push(b.name);
}
eq([...new Set(trapped)], [], "iki sütunlu düzen kullanan ekranlar tam genişlikte olmalı (lg: viewport'a bakar)");

// --- KURAL 6: her kullanıcı ekranında logo bulunmalı ------------------------------------------
// Logo web'de kullanıcının en güvendiği kaçış yolu: "kaybolduysam logoya basar, başa dönerim".
// Bu kural olmadan yeni bir ekran eklendiğinde logo eklemeyi unutmak çok kolay — nitekim ilk
// turda 8 ekranda eksik kalmıştı. Yönetici ekranları kapsam dışı (ayrı bir uygulama bölümü).
const screenBlocks = [];
{
  const re2 = /\{screen === "(\w+)" &&|\{\(screen === "(\w+)" \|\| screen === "(\w+)"\)/g;
  // `{(screen === "login" || screen === "signup") &&` biçiminde İKİ ekran AYNI bloğu paylaşıyor;
  // ikisini de aynı gövdeye bağlamazsak ikincisi "logosuz" görünür (yanlış alarm).
  let mm, prev2 = null;
  while ((mm = re2.exec(shell)) !== null) {
    const names = mm[1] ? [mm[1]] : [mm[2], mm[3]].filter(Boolean);
    if (prev2) for (const n of prev2.names) screenBlocks.push({ name: n, body: shell.slice(prev2.idx, mm.index) });
    prev2 = { names, idx: mm.index };
  }
  if (prev2) for (const n of prev2.names) screenBlocks.push({ name: n, body: shell.slice(prev2.idx) });
}
// Alt bileşene devreden ekranlar: logo o bileşende aranıyor.
const DELEGATES = { LandingHome: "LandingHome.tsx", ListingDetailPage: "ListingDetailPage.tsx", BlogListPage: "BlogPages.tsx", BlogPostPage: "BlogPages.tsx", AboutPage: "BlogPages.tsx" };
const hasBrand = (text) => /BrandMark|PageTopBar|Fix<span/.test(text);
const componentSrc = {};
for (const f of files) componentSrc[f.rel.split("/").pop()] = f.lines.join("\n");
const noLogo = [];
const seenScreens = new Set();
for (const b of screenBlocks) {
  if (seenScreens.has(b.name) || b.name.startsWith("admin")) continue;
  seenScreens.add(b.name);
  let ok2 = hasBrand(b.body);
  if (!ok2) {
    for (const [comp, file] of Object.entries(DELEGATES)) {
      if (b.body.includes(`<${comp}`) && hasBrand(componentSrc[file] || "")) { ok2 = true; break; }
    }
  }
  if (!ok2) noLogo.push(b.name);
}
eq(noLogo, [], "her kullanıcı ekranında Fixperto logosu bulunmalı (ana sayfaya dönüş yolu)");

// --- KURAL 7: araç markası serbest metin kutusuyla girilmemeli --------------------------------
// Yaşanan hata: tamirci fiyatları MARKA anahtarıyla (CAR_BRANDS'ten seçerek) giriyor, araç sahibi
// ise markayı elle yazıyordu. "bmw" yazan kişi "BMW" anahtarıyla eşleşmiyor ve randevu ekranında
// kendi markasının fiyatını göremiyordu — bozukluk görünür değildi, sadece yanlış fiyat gösteriyordu.
// Kural: marka alanı BrandSelect (liste) üzerinden girilmeli.
const freeBrandInputs = [];
for (const f of files) {
  f.lines.forEach((line, i) => {
    if (isComment(line)) return;
    // <input ... value={X.brand} ...>  — modele bağlı serbest metin marka kutusu
    // Bilinçli istisna: yönetici paneli ham kaydı düzeltiyor (yanlış girilmiş markayı elle
    // temizlemek için serbest metin gerekli). İstisna açıkça işaretli olmalı ki sessizce yayılmasın.
    if (line.includes('data-brand-freetext="admin"')) return;
    if (/<input[^>]*value=\{[A-Za-z0-9_.]*\.brand\}/.test(line)) freeBrandInputs.push(`${f.rel}:${i + 1}`);
  });
}
eq(freeBrandInputs, [], "araç markası serbest metin değil, BrandSelect listesinden seçilmeli");

report("ui");
