
// BLOG — slug üretimi, benzersizleştirme ve yayın görünürlüğü (backend/routes/blog.js mantığı).
import { eq, report } from "./_harness.mjs";

const TR_MAP = { ç:"c", ğ:"g", ı:"i", ö:"o", ş:"s", ü:"u", "Ç":"c", "Ğ":"g", "İ":"i", I:"i", "Ö":"o", "Ş":"s", "Ü":"u" };
const slugify = (title) => String(title || "")
  .split("").map((ch) => TR_MAP[ch] ?? ch).join("")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "yazi";

eq(slugify("Fren Balatası Ne Zaman Değişir? 5 Uyarı İşareti"), "fren-balatasi-ne-zaman-degisir-5-uyari-isareti", "Türkçe karakterler ASCII'ye çevriliyor");
eq(slugify("İkinci El — Araba: Alırken!"), "ikinci-el-araba-alirken", "noktalama tek tireye iniyor, baş/son tire yok");
eq(slugify("   "), "yazi", "boş başlıkta güvenli varsayılan");
eq(slugify("ÇÖĞÜŞI"), "cogusi", "büyük Türkçe harfler");

// Benzersizleştirme: aynı slug varsa -2, -3 ...
const uniqueSlug = (base, taken, ignoreId = null) => {
  let slug = base, n = 1;
  for (;;) {
    const hit = taken.find((r) => r.slug === slug);
    if (!hit || hit.id === ignoreId) return slug;
    slug = `${base}-${++n}`;
  }
};
const taken = [{ id: 1, slug: "bakim" }, { id: 2, slug: "bakim-2" }];
eq(uniqueSlug("bakim", taken), "bakim-3", "çakışan slug numaralanıyor");
eq(uniqueSlug("bakim", taken, 1), "bakim", "kendi kaydını düzenlerken slug korunuyor");
eq(uniqueSlug("yeni", taken), "yeni", "çakışma yoksa dokunulmuyor");

// Görünürlük: herkese açık listede YALNIZCA yayınlananlar
const posts = [
  { id: 1, slug: "a", status: "published" },
  { id: 2, slug: "b", status: "draft" },
  { id: 3, slug: "c", status: "published" },
];
const publicList = (all) => all.filter((p) => p.status === "published");
eq(publicList(posts).map((p) => p.id), [1, 3], "taslaklar herkese açık listede YOK");
eq(publicList(posts).find((p) => p.slug === "b") || null, null, "taslağa slug ile de erişilemiyor");

// Yayın tarihi: taslaktan yayına ilk geçişte damgalanır, sonraki düzenlemede DEĞİŞMEZ
const applyStatus = (existing, nextStatus, now) => {
  const patch = { status: nextStatus };
  if (nextStatus === "published" && !existing.publishedAt) patch.publishedAt = now;
  if (nextStatus === "draft") patch.publishedAt = null;
  return { ...existing, ...patch };
};
let post = { id: 9, status: "draft", publishedAt: null };
post = applyStatus(post, "published", "2026-01-01T10:00:00Z");
eq(post.publishedAt, "2026-01-01T10:00:00Z", "ilk yayında tarih damgalanıyor");
post = applyStatus(post, "published", "2026-06-01T10:00:00Z");
eq(post.publishedAt, "2026-01-01T10:00:00Z", "sonraki düzenleme yayın tarihini BOZMUYOR");
post = applyStatus(post, "draft", "2026-06-02T10:00:00Z");
eq(post.publishedAt, null, "taslağa alınınca yayın tarihi temizleniyor");

// Etiket ayrıştırma: boşlar ayıklanmalı ("a,,b" iki etiket)
const parseTags = (raw) => String(raw || "").split(",").map((x) => x.trim()).filter(Boolean);
eq(parseTags("fren, , bakım ,"), ["fren", "bakım"], "boş etiketler ayıklanıyor");
eq(parseTags(""), [], "boş girdi boş dizi");

// BLOG → FİLTRELENMİŞ USTA LİSTESİ: yazının hizmet anahtarı, tamirci filtresine doğru
// uygulanmalı ve önceki aramadan kalan filtreler TEMİZLENMELİ (aksi halde blogdan gelen
// okuyucu, farkında olmadığı bir mesafe/puan filtresi yüzünden boş liste görürdü).
const SERVICE_BY_KEY = { rim_repair: { tr: "Jant Onarımı", en: "Rim Refurbishment" }, ac_service: { tr: "Klima Bakımı", en: "A/C Service" } };
const EMPTY_MECH_FILTERS = { service: "", brand: "", minRating: 0, maxDistance: 999, priceTier: "all", verifiedOnly: false };
const openMechanicsForService = (key, prevFilters, city = null) => {
  const item = SERVICE_BY_KEY[key];
  if (!item) return { filters: prevFilters, screen: "owner", matched: false };
  return { filters: { ...EMPTY_MECH_FILTERS, service: item.tr }, locationQuery: city || "", screen: "owner", matched: true };
};
const dirty = { service: "Egzoz Değişimi", brand: "BMW", minRating: 4.5, maxDistance: 5, priceTier: "cheap", verifiedOnly: true };
const r = openMechanicsForService("rim_repair", dirty);
eq(r.filters.service, "Jant Onarımı", "hizmet filtresi katalogdaki Türkçe adla uygulanıyor");
eq(r.filters.brand, "", "önceki marka filtresi temizlendi");
eq(r.filters.maxDistance, 999, "önceki mesafe filtresi temizlendi");
eq(r.filters.minRating, 0, "önceki puan filtresi temizlendi");
eq(r.locationQuery, "", "şehir verilmediyse konum boş");
eq(openMechanicsForService("rim_repair", dirty, "İstanbul").locationQuery, "İstanbul", "şehir verilirse uygulanıyor");
eq(openMechanicsForService("olmayan_anahtar", dirty).matched, false, "bilinmeyen anahtar filtre uygulamıyor (çökmüyor)");

// Filtre eşleşmesi katalog anahtarı üzerinden üç dilde çalışmalı: tamirci hizmeti Türkçe
// eklemiş olsa da, arayüzü İngilizce olan ziyaretçi aynı ustayı bulmalı.
const terms = (s) => { const it = SERVICE_BY_KEY[s.key]; return (it ? [s.name, it.tr, it.en] : [s.name]).filter(Boolean).map(x => x.toLocaleLowerCase("tr-TR")); };
const matches = (services, wanted) => services.some(s => terms(s).includes(wanted.trim().toLocaleLowerCase("tr-TR")));
const mech = [{ key: "rim_repair", name: "Jant Onarımı" }];
eq(matches(mech, "Jant Onarımı"), true, "Türkçe filtre değeri eşleşiyor");
eq(matches(mech, "Rim Refurbishment"), true, "İngilizce karşılığı da eşleşiyor");
eq(matches(mech, "Klima Bakımı"), false, "ilgisiz hizmet eşleşmiyor");

// Seed içeriği ile hizmet kataloğu tutarlılığı — GERÇEK dosyalar okunuyor.
// Yanlış bir anahtar yazılırsa buton sessizce genel aramaya düşer; kullanıcı fark etmez.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const seedSrc = readFileSync(join(ROOT, "backend/db/blogSeed.js"), "utf8");
const catSrc = readFileSync(join(ROOT, "frontend/src/data/constants.ts"), "utf8");
const validKeys = new Set([...catSrc.matchAll(/\{ key: "([a-z_]+)", tr:/g)].map((m) => m[1]));
const usedKeys = [...seedSrc.matchAll(/relatedServiceKey: "([a-z_]+)"/g)].map((m) => m[1]);
eq(usedKeys.filter((k) => !validKeys.has(k)), [], "blog yazılarındaki hizmet anahtarları katalogda var");
const seedSlugs = [...seedSrc.matchAll(/slug: "([a-z0-9-]+)"/g)].map((m) => m[1]);
eq(seedSlugs.filter((x, i) => seedSlugs.indexOf(x) !== i), [], "başlangıç yazılarında tekrar eden slug yok");
eq(seedSlugs.length > 10, true, `başlangıç içeriği yeterli (${seedSlugs.length} yazı)`);
eq(seedSlugs.every((x) => /^[a-z0-9-]+$/.test(x)), true, "tüm slug'lar URL-güvenli");

report("blog");
