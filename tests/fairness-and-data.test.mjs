// REKABET KORUMASI (değerlendirmeler) + ÜRÜN VERİSİ (karşılaştırma) + KARANLIK MOD + KAYDIRMA.
//
// İSTEKLER:
//  - "Bir tamirci başka tamircinin yorumlarını beğenemesin, ona yorum yapamasın. Kullanıcı hesabı
//    açıp kendi maili/telefonuyla giriyorsa tespit edelim ki başkasını girip kötüleyemesin,
//    rekabete aykırı olmasın."
//  - "İnsanlar hangi arabaları kıyaslıyor, bunun datasını tutalım."
//  - "Karanlık modda her şeyin düzgün çalıştığından emin ol."
//  - "Profil tamamlanma listesinde eksik maddeye tıklayınca o bölüme kaydırsın."
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, ok, report } from "./_harness.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...p) => readFileSync(join(ROOT, ...p), "utf8");
const reviews = read("backend", "routes", "reviews.js");
const analytics = read("backend", "routes", "analytics.js");
const authUtils = read("backend", "utils", "auth.js");
const authRoute = read("backend", "routes", "auth.js");
const dbSrc = read("backend", "db", "db.js");
const provider = read("frontend", "src", "app", "state", "AppLogicProvider.tsx");
const shell = read("frontend", "src", "app", "AppShell.tsx");
const detail = read("frontend", "src", "components", "features", "MechDetailBody.tsx");
const i18n = read("frontend", "src", "data", "i18n.ts");

// --- 1) TAMİRCİ, RAKİBİNİ PUANLAYAMAZ/BEĞENEMEZ ------------------------------------------------
ok(/Tamirci hesabıyla değerlendirme yazılamaz/.test(reviews), "tamirci hesabı yorum yazamıyor");
ok(/Tamirci hesabıyla değerlendirme beğenilemez/.test(reviews), "tamirci hesabı 'faydalı' oyu veremiyor");
const helpfulBlock = reviews.slice(reviews.indexOf('reviewsRouter.post("/:id/reviews/:reviewId/helpful"'));
ok(/actor\.role === "mechanic"/.test(helpfulBlock), "beğeni kuralı sunucuda");
// İstemci tarafı da aynı kuralı uyguluyor (gereksiz istek atmamak ve doğru mesaj için).
const helpfulFn = provider.slice(provider.indexOf("const toggleReviewHelpful ="), provider.indexOf("const toggleReviewHelpful =") + 1600);
ok(/role === "mechanic" \|\| MY_MECHANIC_ID != null/.test(helpfulFn), "istemci de tamirciyi engelliyor");
ok(/mechanicCannotRateToast/.test(helpfulFn), "kullanıcıya nedeni söyleniyor");
// Eski "tamirciler de beğenebilir" davranışı geri gelmemeli.
eq(/Tamirciler de başka tamircilerin yorumlarına "faydalı" diyebilir/.test(provider), false, "eski izin veren kural kaldırıldı");

// --- 2) KENDİ İŞLETMESİNE YORUM: e-posta/telefon eşleşmesi -------------------------------------
// Tamirci "araç sahibi" hesabı açıp kendini övemesin / rakibini kötüleyemesin.
ok(/SELECT name, email, phone, signupIpHash FROM owners WHERE id = \?/.test(reviews), "yorumcunun iletişim bilgisi okunuyor");
ok(/FROM mechanics WHERE \(email IS NOT NULL AND lower\(email\) = \?\) OR \(phone IS NOT NULL AND phone != '' AND phone = \?\)/.test(reviews),
  "e-posta VEYA telefon işletme hesaplarıyla karşılaştırılıyor");
ok(/reason: "selfReview"/.test(reviews), "kendi işletmesine yorum kesin engelleniyor");
ok(/const flaggedCompetitor = !!linkedMechanic;/.test(reviews), "başka bir işletmeye bağlı hesap işaretleniyor");
ok(/flagReason: linkedMechanic \? "linkedMechanicAccount" : null/.test(reviews), "işaretin nedeni kaydediliyor");
/**
 * DEĞİŞEN KURAL (uçtan uca denetimde bulunan GERÇEK hata): "aynı ağdan kaydolmuş olmak" tek
 * başına yorumu işaretliyor ve işaretli yorumlar ortalamaya katılmadığı için tamircinin puanını
 * SIFIRLIYORDU. Ağ eşleşmesi kanıt değil: aynı ev, aynı ofis, aynı kafe, aynı mobil operatörün
 * CGNAT'ı, hatta aynı sunucu arkasındaki tüm kullanıcılar aynı IP'yi paylaşır. Yani dürüst bir
 * müşterinin yorumu, tamamen ilgisiz bir sebeple tamircinin puanını yok edebiliyordu — kötü
 * niyetli biri için de kolay bir sabotaj yolu. Artık ağ eşleşmesi yalnızca `sameNetworkSignal`
 * olarak KAYDEDİLİYOR (inceleme için duruyor) ama puanı etkilemiyor; puanı yalnızca gerçek bir
 * bağ (aynı e-posta/telefonla açılmış işletme hesabı) etkiliyor.
 */
ok(/sameNetworkSignal: true/.test(reviews), "ağ eşleşmesi yine de kayda geçiyor (inceleme için)");
ok(/sameNetwork/.test(reviews) && !/flaggedCompetitor = !!linkedMechanic \|\| sameNetwork/.test(reviews),
  "ağ eşleşmesi hesaplanıyor ama işaretlemeye BAĞLANMIYOR");

// Karar tablosunu çalıştır: hangi durumda engel, hangisinde işaret?
const decide = ({ role, linkedMechanicId, reviewedId }) => {
  if (role === "mechanic") return "block-mechanic";
  if (linkedMechanicId && linkedMechanicId === reviewedId) return "block-self";
  if (linkedMechanicId) return "flag";
  return "ok";
};
eq(decide({ role: "mechanic" }), "block-mechanic", "tamirci hesabı engelli");
eq(decide({ role: "owner", linkedMechanicId: 5, reviewedId: 5 }), "block-self", "kendi işletmesi engelli");
eq(decide({ role: "owner", linkedMechanicId: 9, reviewedId: 5 }), "flag", "başka işletmeye bağlı hesap işaretli");
eq(decide({ role: "owner", sameNetwork: true, reviewedId: 5 }), "ok",
  "aynı ağdan açılmış hesap ARTIK işaretlenmiyor (paylaşımlı IP kanıt değil, puanı sıfırlıyordu)");
eq(decide({ role: "owner", reviewedId: 5 }), "ok", "sıradan müşteri serbest");

// İŞARETLİ YORUM PUANA GİRMEZ ama SİLİNMEZ: tamirci gerçekten müşteri olabilir.
ok(/!r\.flaggedCompetitor/.test(reviews), "işaretli yorum ortalamaya katılmıyor");
ok(/reviewFlaggedLabel/.test(detail), "işaret okuyucuya da gösteriliyor");
const avgOf = (list) => {
  const rated = list.filter((r) => Number(r?.rating) > 0 && !r.flaggedCompetitor);
  return rated.length ? Math.round((rated.reduce((s, r) => s + Number(r.rating), 0) / rated.length) * 10) / 10 : 0;
};
eq(avgOf([{ rating: 5 }, { rating: 1, flaggedCompetitor: true }]), 5, "rakip işaretli 1 yıldız ortalamayı düşürmüyor");
eq(avgOf([{ rating: 1, flaggedCompetitor: true }]), 0, "yalnızca işaretli yorum varsa puan oluşmuyor");

// --- 3) KAYIT AĞI KARMASI: ham IP saklanmıyor ---------------------------------------------------
ok(/export function hashIp\(ip\)/.test(authUtils), "IP karma fonksiyonu var");
ok(/IP_HASH_SALT/.test(authUtils), "karma tuzlanıyor (tuzsuz IP karması geri çözülür)");
ok(/createHash\("sha256"\)/.test(authUtils), "sha256 kullanılıyor");
ok(/"owners", "signupIpHash TEXT"/.test(dbSrc) && /"mechanics", "signupIpHash TEXT"/.test(dbSrc), "iki tabloda da sütun var");
ok(/signupIpHash: hashIp\(clientIp\(req\)\)/.test(authRoute), "kayıt sırasında karma yazılıyor");
eq(/signupIp TEXT/.test(dbSrc), false, "ham IP için sütun YOK");

// --- 4) KARŞILAŞTIRMA VERİSİ --------------------------------------------------------------------
ok(/"compare_pair"/.test(analytics), "karşılaştırma çifti olayı tanımlı");
ok(/"pairA", "pairB"/.test(analytics), "çift alanları meta izin listesinde");
ok(/router\.get\("\/comparisons", requireAdmin/.test(analytics), "yönetici uç noktası var ve korumalı");
ok(/GROUP BY a, b ORDER BY n DESC/.test(analytics), "en çok karşılaştırılan çiftler");
ok(/const trackComparePairs = \(ids\)/.test(provider), "istemci çiftleri üretiyor");
ok(/\[labels\[i\], labels\[j\]\]\.sort/.test(provider), "çift alfabetik sıralanıyor (A-B ile B-A aynı satır)");
ok(/const openCompareModal = \(\)/.test(provider), "ölçüm karşılaştırma AÇILDIĞINDA gönderiliyor");
ok(/openCompareModal/.test(shell), "düğme yeni fonksiyonu kullanıyor");
ok(/En Çok Karşılaştırılan Çiftler/.test(shell), "yönetici panelinde gösteriliyor");

// Çift üretimini çalıştır: 3 araçtan 3 çift, sıra fark etmemeli, aynı model tekrarı elenmeli.
const pairsOf = (labels) => {
  const out = [];
  for (let i = 0; i < labels.length; i++) {
    for (let j = i + 1; j < labels.length; j++) {
      const [a, b] = [labels[i], labels[j]].sort((x, y) => x.localeCompare(y, "tr"));
      if (a !== b) out.push(`${a}|${b}`);
    }
  }
  return out;
};
eq(pairsOf(["BMW 3", "Audi A4", "VW Golf"]).length, 3, "3 araç → 3 çift");
eq(pairsOf(["BMW 3", "Audi A4"])[0], "Audi A4|BMW 3", "çift alfabetik");
eq(pairsOf(["BMW 3", "BMW 3"]).length, 0, "aynı model çifti sayılmıyor");
eq(pairsOf(["BMW 3"]).length, 0, "tek araç karşılaştırma değildir");

// --- 5) PROFİL TAMAMLANMA: eksik maddeye tıkla, bölüme in --------------------------------------
ok(/const scrollToSection = \(elementId\)/.test(provider), "kaydırma yardımcısı var");
ok(/prefers-reduced-motion/.test(provider), "hareket azaltma tercihi gözetiliyor");
ok(/section-flash/.test(provider) && /section-flash/.test(shell), "hedef bölüm kısa süre vurgulanıyor");
for (const id of ["mech-sec-basic", "mech-sec-hours", "mech-sec-services", "mech-sec-brands", "mech-sec-payment", "mech-sec-cover"]) {
  ok(shell.includes(`id="${id}"`), `bölüm çapası var: ${id}`);
}
const checksBlock = shell.slice(shell.indexOf("const checks = ["), shell.indexOf("const done = checks.filter"));
eq((checksBlock.match(/target: "mech-sec-/g) || []).length, 9, "her maddenin hedef bölümü var");
ok(/onClick=\{\(\) => scrollToSection\(c\.target\)\}/.test(shell), "eksik madde tıklanabilir");
ok(/scroll-mt-24/.test(shell), "yapışkan başlık kaydırma hedefini kapatmıyor");

// --- 6) KARANLIK MOD: yarı saydam zeminler de kapsanmalı ---------------------------------------
// Kural ".bg-white" sınıfına bakıyordu; bg-white/95 ve bg-white/90 AYRI sınıflar olduğu için
// yapışkan üst çubuklar ve modal başlıkları karanlık modda BEYAZ kalıyordu.
const darkBlock = shell.slice(shell.indexOf(".dark-scope { color-scheme: dark; }"), shell.indexOf("@keyframes micro-pop"));
for (const rule of ["bg-white\\/95", "bg-white\\/90", "bg-gray-50\\/70", "text-gray-200", "bg-emerald-50", "bg-blue-50"]) {
  ok(darkBlock.includes(rule), `karanlık mod kuralı var: ${rule}`);
}
ok(/from-rose-50/.test(darkBlock) && /background-image: none/.test(darkBlock), "açık degrade bantlar karanlıkta kapatılıyor");
// Uygulamada kullanılan her yarı saydam beyaz zemin için bir kural olmalı.
const alphaWhites = [...new Set([...shell.matchAll(/bg-white\/(\d+)/g)].map((m) => m[1]))];
const uncovered = alphaWhites.filter((a) => Number(a) >= 80 && !darkBlock.includes(`bg-white\\/${a}`));
eq(uncovered, [], "opak sayılabilecek tüm beyaz zeminlerin karanlık karşılığı var");

// --- 7) Metinler üç dilde -----------------------------------------------------------------------
for (const key of ["mechanicCannotRateToast", "selfReviewBlockedToast", "reviewDuplicateToast", "reviewFlaggedLabel"]) {
  const line = i18n.split("\n").find((l) => l.trim().startsWith(`${key}:`)) || "";
  ok(line.length > 0, `${key} tanımlı`);
  for (const lang of ["tr:", "en:", "de:"]) ok(line.includes(lang), `${key} ${lang} dilinde var`);
}

report("rekabet ve veri");
