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
  KnownDevices: "tarayıcı",
  SavedSearchList: "kayıtlı arama",
  TestimonialCarousel: "değerlendirme şeridi",
  CareersPage: "kariyer",
  AdminCareersPanel: "kariyer ilanları",
  InfoTip: "bilgi baloncuğu",
  VehicleHistoryPanel: "şasi",
  RecommendedListings: "öneri",
  SavedSearchEditModal: "kayıtlı arama",
  EmojiPicker: "emoji",
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

/**
 * SAYFA NUMARALARI SIRALI MI — yönetici panelinde okunan sıra bu.
 * ------------------------------------------------------------------------------------------------
 * GERÇEK HATA (kullanıcı sordu: "bunu panele ekledin mi"): bölüm 25'te sayfalar
 * 25.1 25.2 25.3 25.10 25.9 25.8 25.7 25.6 25.5 25.4 sırasıyla duruyordu. Sebebi basit ve
 * tekrar etmeye çok müsait: her yeni bölümü var olanın ÖNÜNE eklemişim, yani en yenisi en üstte
 * çıkmış. Belge panelde bu sırayla okunuyor, dolayısıyla 25.10'dan 25.4'e atlayan bir içindekiler
 * listesi görünüyordu — içerik doğru ama belge bozuk görünüyor, ki bu belgeye olan güveni bitirir.
 * Tarama bölüm 22 ve 23'te de aynı hatayı buldu (22.6 → 22.3, 23.3 → 23.2).
 *
 * Bu kontrol o hatanın bir daha oluşmasını engelliyor. Sayfa EKLEMEK kolay olsun diye numarasız
 * sayfalara karışmıyor; yalnızca "S.N" biçiminde numaralanmış sayfaların kendi bölümü içinde
 * artan sırada olmasını şart koşuyor.
 */
{
  const numbered = [...handbookSrc.matchAll(/title: "(\d+)\.(\d+)([^"]*)"/g)]
    .map((m) => ({ sec: Number(m[1]), page: Number(m[2]), title: `${m[1]}.${m[2]}` }));
  ok(numbered.length > 50, `numaralı el kitabı sayfası bulundu (${numbered.length})`);
  const outOfOrder = [];
  for (let i = 1; i < numbered.length; i++) {
    const a = numbered[i - 1], b = numbered[i];
    if (a.sec === b.sec && b.page < a.page) outOfOrder.push(`${a.title} → ${b.title}`);
  }
  ok(outOfOrder.length === 0,
    `sayfa numaraları bölüm içinde artan sırada (bozuk geçiş: ${outOfOrder.join(", ") || "yok"})`);
  // Aynı numaranın iki kez kullanılması da belgeyi bozar: hangisi doğru belli olmaz.
  const dupes = numbered.map((n) => n.title).filter((t, i, arr) => arr.indexOf(t) !== i);
  ok(dupes.length === 0, `aynı sayfa numarası iki kez kullanılmamış (tekrar: ${[...new Set(dupes)].join(", ") || "yok"})`);
}

// --- Panelde gerçekten bağlı mı ----------------------------------------------------------------
const shell = readFileSync(join(SRC, "app", "AppShell.tsx"), "utf8");
ok(/key: "handbook"/.test(shell), "yönetici panelinde El Kitabı sekmesi var");
/**
 * Faz 6'da panel `React.lazy` ile yükleniyor, yani kullanım yeri artık bir Suspense sınırının
 * içinde. Eski desen (`&& <HandbookPanel />` birebir) bu yüzden kırıldı. Sorulan soru değişmedi:
 * sekmeye basılınca panel çiziliyor mu? Bu yüzden desen İKİ PARÇAYA ayrıldı — sekme koşulu var,
 * ve panel o koşulun içinde çiziliyor.
 */
ok(/adminTab === "handbook" &&/.test(shell), "sekme koşulu var");
{
  const block = shell.match(/adminTab === "handbook" &&([\s\S]{0,900}?)\n {14}\)\}/)?.[1]
    || shell.match(/adminTab === "handbook" &&([\s\S]{0,900})/)?.[1] || "";
  ok(/<HandbookPanel \/>/.test(block), "sekme paneli render ediyor");
  ok(/<Suspense/.test(block), "lazy panel Suspense sınırı içinde (sınırsız lazy = beyaz ekran)");
}
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
const e2eFiles = readdirSync(join(ROOT, "tests", "e2e")).filter((f) => f.endsWith(".e2e.mjs"));
const statedMatch = handbookSrc.match(/(\d+) STATİK takım \+ (\d+) UÇTAN UCA takım/);
ok(statedMatch, "el kitabında statik ve uçtan uca takım sayıları yazıyor");
eq(Number(statedMatch?.[1]), suiteFiles.length, `belgedeki statik takım sayısı gerçekle uyuşuyor (${suiteFiles.length})`);
eq(Number(statedMatch?.[2]), e2eFiles.length, `belgedeki uçtan uca takım sayısı gerçekle uyuşuyor (${e2eFiles.length})`);
// Uçtan uca katmanın NE İŞE YARADIĞI da yazılı olmalı: sayı vermek, o katmanın neden var
// olduğunu anlatmadan, sonraki geliştiriciye "bunlar da ne" dedirtir.
ok(/gerçek Express sunucusunu/.test(handbookSrc) && /VERİTABANINDAN okuyarak/.test(handbookSrc),
  "uçtan uca katmanın ne yaptığı el kitabında açıklanmış");

report("el kitabı");
