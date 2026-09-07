
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

report("blog");
