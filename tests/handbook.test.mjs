// EL KİTABI — panelde okunan belgelerin bütünlüğü ve GÜNCELLİĞİ.
//
// Bu takımın asıl işi ikincisi: belge yazmak kolay, GÜNCEL TUTMAK zordur. "Yeni özellik eklerken
// el kitabını da güncelle" kuralı yazıyla kalırsa birkaç hafta içinde unutulur. Bu yüzden kural
// teste bağlandı: components/features altındaki her bileşenin el kitabında bir karşılığı olmalı.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, ok, report } from "./_harness.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "frontend", "src");
const handbookSrc = readFileSync(join(SRC, "data", "handbook.ts"), "utf8");

// --- Yapı bütünlüğü ---------------------------------------------------------------------------
const sections = [...handbookSrc.matchAll(/^\s{4}id: "([a-z0-9-]+)",\n\s{4}title: "([^"]+)",\n\s{4}summary: "([^"]*)"/gm)]
  .map((m) => ({ id: m[1], title: m[2], summary: m[3] }));
const pages = [...handbookSrc.matchAll(/^\s{8}id: "([a-z0-9-]+)",\n\s{8}title: "([^"]+)",\n\s{8}body: `/gm)]
  .map((m) => ({ id: m[1], title: m[2] }));

ok(sections.length >= 20, `en az 20 bölüm var (${sections.length})`);
ok(pages.length >= 35, `en az 35 sayfa var (${pages.length})`);

const dupSections = sections.map((s) => s.id).filter((id, i, a) => a.indexOf(id) !== i);
eq(dupSections, [], "bölüm kimlikleri benzersiz");
const dupPages = pages.map((p) => p.id).filter((id, i, a) => a.indexOf(id) !== i);
eq(dupPages, [], "sayfa kimlikleri benzersiz (aynı kimlik yanlış sayfayı açardı)");
eq(sections.filter((s) => !s.summary.trim()).map((s) => s.id), [], "her bölümün özeti var");
// Başlıklar numaralı: kenar çubuğunda sıra bozulmasın ve konuşurken "3.2" diye atıfta bulunabilelim.
eq(pages.filter((p) => !/^\d+\.\d+ /.test(p.title)).map((p) => p.title), [], "her sayfa başlığı 'N.M ' ile numaralı");
eq(sections.filter((s) => !/^\d+\. /.test(s.title)).map((s) => s.title), [], "her bölüm başlığı 'N. ' ile numaralı");

// --- KAPSAM: her bileşen el kitabında geçmeli --------------------------------------------------
// Bu kuralın amacı belgeyi canlı tutmak. Yeni bir bileşen ekleyip el kitabına dokunmazsan test düşer.
const featureDir = join(SRC, "components", "features");
const components = readdirSync(featureDir).filter((f) => f.endsWith(".tsx")).map((f) => f.replace(".tsx", ""));
// Bir bileşen ya adıyla ya da anlattığı konu başlığıyla geçebilir; eşleme burada açıkça duruyor
// ki "hangi bileşen nerede anlatılıyor" sorusu da cevaplanmış olsun.
const COVERAGE = {
  AppointmentCard: "randevu", BlogPages: "blog", BookingCalendar: "takvim", BrandMark: "logo",
  BrandSelect: "marka", BrowseHome: "arama", ChatBubble: "mesaj", ComboBox: "süzülen",
  HandbookPanel: "el kitabı", JobCard: "iş ilanı", LandingHome: "ana sayfa", LangSwitch: "dil",
  ListingCard: "ilan", ListingDetailPage: "ilan", MapPanel: "mesafe", MechCard: "tamirci",
  MechDetailBody: "tamirci", NotifBell: "bildirim", OwnerAppointmentsView: "randevu",
  OwnerBottomNav: "sekme", OwnerChatsPanel: "mesaj", OwnerDesktopNav: "sekme",
  PhotoLightbox: "fotoğraf", ShareButton: "paylaş", SiteFooter: "alt bilgi",
  SkeletonCard: "boş durum", StatusTracker: "randevu", WelcomeTour: "karşılama",
  TranslatedText: "TranslatedText",
  SavedSearchList: "kayıtlı arama",
  TestimonialCarousel: "değerlendirme şeridi",
  CareersPage: "kariyer",
  AdminCareersPanel: "kariyer ilanları",
  InfoTip: "bilgi baloncuğu",
};
const lc = (v) => String(v ?? "").toLocaleLowerCase("tr-TR");
const bookLower = lc(handbookSrc);
const uncovered = components.filter((c) => {
  const topic = COVERAGE[c];
  if (!topic) return true;              // eşlemeye eklenmemiş yeni bileşen
  return !bookLower.includes(lc(topic)); // eşlenmiş ama el kitabında konusu yok
});
eq(uncovered, [], "her bileşenin el kitabında karşılığı var (yeni bileşen eklediysen COVERAGE'a ekle ve konuyu yaz)");

// --- Zorunlu konular ---------------------------------------------------------------------------
// Bunlar sitenin "nasıl çalışıyor" sorusunun cevabı; biri kaybolursa el kitabı işlevini yitirir.
// "Hiçbir şeyi atlama" kuralının somut hâli: sitenin her ana alanı el kitabında geçmeli.
// Bu liste bir kontrol listesidir — yeni bir alan eklenirse buraya da eklenir.
for (const topic of [
  // temel
  "oturum", "auth gate", "randevu", "marka bazlı fiyat", "doğrulama", "geri/ileri",
  "i18n", "safeHref", "analitik", "sitemap", "test", "bilinen sınır",
  // yönetici
  "yönetici panel", "destek talep", "değişiklik geçmişi", "geri alma",
  "panele nasıl girilir", "#admin", "shift + a",
  // kullanıcı araçları
  "bildirim", "hatırlatma", "favori", "kayıtlı arama", "karşılaştırma",
  "değerlendirme", "paylaşım",
  // hesap
  "ayarlar", "şifre değiştirme", "hesap silme", "çıkış",
  // teknik
  "hydrate", "göç", "tek kapı", "iyimser güncelleme",
  // yerel
  "konum", "harita", "kış lastiği",
]) {
  ok(bookLower.includes(lc(topic)), `el kitabı "${topic}" konusunu içeriyor`);
}

// --- Dürüstlük: bilinen sınırlar yazılmış olmalı ------------------------------------------------
// Yapılmamış işleri gizleyen bir belge, olmayan belgeden daha kötüdür.
for (const limit of ["slot kilidi yok", "backend doğrulaması", "httpOnly", "sunucu tarafı render"]) {
  ok(bookLower.includes(lc(limit)), `bilinen sınır belgelenmiş: ${limit}`);
}

// --- Panelde gerçekten bağlı mı ----------------------------------------------------------------
const shell = readFileSync(join(SRC, "app", "AppShell.tsx"), "utf8");
ok(/key: "handbook"/.test(shell), "yönetici panelinde El Kitabı sekmesi var");
ok(/adminTab === "handbook" && <HandbookPanel \/>/.test(shell), "sekme paneli render ediyor");
const panel = readFileSync(join(SRC, "components", "features", "HandbookPanel.tsx"), "utf8");
ok(/lc\(p\.body\)\.includes\(q\)/.test(panel), "arama gövdede de arıyor (sadece başlıkta değil)");
eq(/dangerouslySetInnerHTML/.test(panel), false, "el kitabı içeriği HTML olarak basılmıyor");

// Yönetici panelindeki her sekme el kitabında anılmalı.
const tabTopics = { dashboard: "genel bakış", users: "kullanıcı", tickets: "destek talep",
  analytics: "analitik", blog: "blog", history: "değişiklik geçmişi", handbook: "el kitabı", careers: "kariyer ilanları" };
const navLine = shell.split("\n").find((l) => l.includes("const adminNavItems"));
const tabKeys = [...(navLine || "").matchAll(/key: "(\w+)"/g)].map((m) => m[1]);
ok(tabKeys.length >= 6, "yönetici sekmeleri okunabildi");
const undocumentedTabs = tabKeys.filter((k) => !tabTopics[k] || !bookLower.includes(lc(tabTopics[k])));
eq(undocumentedTabs, [], "her yönetici sekmesi el kitabında anlatılıyor");

// Yönetici paneline giriş yolları KODDA da olmalı — belgede yazıp koda koymamak daha kötü.
const provider = readFileSync(join(SRC, "app", "state", "AppLogicProvider.tsx"), "utf8");
ok(/window\.location\.hash[\s\S]{0,80}#admin/.test(provider), "adres çubuğu (#admin) ile giriş kodda var");
ok(/e\.shiftKey && \(e\.key === "A" \|\| e\.key === "a"\)/.test(provider), "klavye kısayolu kodda var");
ok(/hashchange/.test(provider), "hash sonradan değişirse de yakalanıyor");

// Belgede yazan test takımı SAYISI gerçekle uyuşmalı — eskimiş bir sayı, belgeye olan güveni
// tümüyle bitirir ("burada 12 yazıyor ama 15 varsa başka neler eski?").
const suiteFiles = readdirSync(join(ROOT, "tests")).filter((f) => f.endsWith(".test.mjs"));
const statedMatch = handbookSrc.match(/(\d+) test takımı/);
ok(statedMatch, "el kitabında takım sayısı yazıyor");
eq(Number(statedMatch?.[1]), suiteFiles.length, `belgedeki takım sayısı gerçekle uyuşuyor (${suiteFiles.length})`);

report("el kitabı");
