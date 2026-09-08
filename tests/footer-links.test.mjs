// ALT BİLGİ (footer) BAĞLANTILARI — hedefleri anlamlı mı, sayfa doğru yere kayıyor mu.
//
// Bu takım, "bağlantı çalışıyor ama YANLIŞ yere götürüyor" hata sınıfı için. tsc bunu göremez:
// setScreen("about") her zaman derlenir, kullanıcı SSS beklerken Hakkımızda görür.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, ok, report } from "./_harness.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...p) => readFileSync(join(ROOT, ...p), "utf8");
const footer = read("frontend/src/components/features/SiteFooter.tsx");

// --- Vaat edilen içerik gerçekten var mı -------------------------------------------------------
// "Kariyer" ve "Basın" ikisi de Hakkımızda'ya gidiyordu; olmayan sayfayı vaat eden bağlantı,
// hiç bağlantı olmamasından kötüdür. "Basın" hâlâ yok, kaldırıldı. "Kariyer" ise GERÇEK bir
// sayfaya kavuştu; kural artık "bağlantı olmasın" değil, "kendi sayfasına gitsin".
eq(/footerPress/.test(footer), false, "olmayan Basın sayfasına bağlantı yok");
const careerBlock = footer.slice(footer.indexOf("footerCareers") - 200, footer.indexOf("footerCareers"));
ok(/setScreen\("careers"\)/.test(careerBlock), "Kariyer bağlantısı Kariyer sayfasını açıyor");
eq(/setScreen\("about"\)>\{t\("footerCareers"\)/.test(footer), false, "Kariyer artık Hakkımızda'ya gitmiyor");

// SSS gerçek bir SSS bölümüne gidiyor (düz Hakkımızda'ya değil).
ok(/setAboutSection\("faq"\)/.test(footer), "SSS bağlantısı SSS bölümünü hedefliyor");
const about = read("frontend/src/components/features/BlogPages.tsx");
ok(/id="about-faq"/.test(about), "Hakkımızda sayfasında SSS bölümü var");
ok(/scrollIntoView/.test(about), "SSS bölümüne kaydırılıyor");
const i18n = read("frontend/src/data/i18n.ts");
for (const n of [1, 2, 3, 4, 5, 6]) {
  ok(i18n.includes(`faqQ${n}:`) && i18n.includes(`faqA${n}:`), `SSS ${n}. soru ve cevabı tanımlı`);
}

// --- Eylem bağlantıları gerçekten o eylemi yapıyor mu ------------------------------------------
// "Aracımı sat" eskiden screen'i arama ekranına, sekmeyi ise yalnızca PROFİL sayfasında görünen
// bir sekmeye ayarlıyordu — yani hiçbir şey olmuyordu.
ok(/openSellForm\(null\)/.test(footer), "'Aracımı sat' ilan formunu açıyor");
eq(/setOwnerProfileTab\("market"\)/.test(footer), false, "görünmeyen sekmeye ayar yapan eski kod kalmadı");

// "İş ilanı ver" iş ilanlarına BAKMA ekranını açıyordu.
const postJobBlock = footer.slice(footer.indexOf("footerPostJob") - 420, footer.indexOf("footerPostJob"));
ok(/setMechListingsSubTab\("jobs"\)/.test(postJobBlock), "'İş ilanı ver' ilan verme ekranını açıyor");

// "Tamirci olarak katıl" giriş yapmış bir ARAÇ SAHİBİNİ tamirci paneline yolluyordu.
const signupBlock = footer.slice(footer.indexOf("footerMechanicSignup") - 400, footer.indexOf("footerMechanicSignup"));
ok(/role === "mechanic"/.test(signupBlock), "tamirci kontrolü var");
ok(/setRole\("mechanic"\); setScreen\("signup"\)/.test(signupBlock), "tamirci değilse kayıt ekranına gidiyor");

// --- Kaydırma: mod değişimi de sayfayı başa almalı ---------------------------------------------
// Alt bilgideki "Araç ara"/"İş ilanları" bağlantıları yalnızca ownerMode'u değiştirdiğinde sayfa
// başa alınmıyordu; kullanıcı alt bilgide kalıp "hiçbir şey olmadı" sanıyordu.
const provider = read("frontend/src/app/state/AppLogicProvider.tsx");
const scrollDeps = provider.slice(provider.indexOf("}, [screen, selectedMechanicId, listingPageId"));
const depsLine = scrollDeps.slice(0, scrollDeps.indexOf("]);") + 3);
for (const dep of ["ownerTab", "ownerMode", "mechTab", "mechListingsSubTab", "ownerProfileTab", "ownerSettingsTab"]) {
  ok(depsLine.includes(dep), `kaydırma sıfırlaması ${dep} değişiminde de çalışıyor`);
}

// --- Alt bilgideki her bağlantının bir eylemi olmalı -------------------------------------------
// Boş onClick ya da eylemsiz bir madde, kullanıcıya "burası bozuk" hissi verir.
const items = [...footer.matchAll(/<Item onClick=\{([^]*?)\}>/g)].map((m) => m[1].trim());
ok(items.length >= 10, `alt bilgide en az 10 bağlantı var (${items.length})`);
eq(items.filter((a) => a === "() => {}" || a === "() => null" || a === ""), [], "eylemsiz bağlantı yok");

report("alt bilgi bağlantıları");
