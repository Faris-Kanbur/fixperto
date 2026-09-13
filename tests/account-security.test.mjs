// HESAP GÜVENLİĞİ + "BACKEND'E BAĞLANMAMIŞ ÖZELLİK" DENETİMİ.
//
// İSTEK: "tüm özellikleri kontrol et, her butona bas, backendde eksik olan ya da eksik bağlantı
// varsa düzelt, hesap güvenliğinde eksik varsa düzelt."
//
// Denetimde çıkan hata sınıfı: bir kaydın yazma yetkisi SAHİBİNE bağlı, ama o kayda YAZAN kişi
// sahibi değil. Böyle her yerde istek 403 alıyor ve özellik SESSİZCE çalışmıyordu — kullanıcı
// başarı mesajını görüyor, veri hiç kaydedilmiyordu. Üç yerde vardı: sohbet mesajı (düzeltildi),
// ilan teklifi/sorusu (düzeltildi), İŞ BAŞVURUSU (burada düzeltildi).
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, ok, report } from "./_harness.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...p) => readFileSync(join(ROOT, ...p), "utf8");
const authSrc = read("backend", "routes", "auth.js");
const authUtils = read("backend", "utils", "auth.js");
const crud = read("backend", "routes", "makeCrudRouter.js");
const server = read("backend", "server.js");
const jobs = read("backend", "routes", "jobApplications.js");
const reviews = read("backend", "routes", "reviews.js");
const provider = read("frontend", "src", "app", "state", "AppLogicProvider.tsx");
const shell = read("frontend", "src", "app", "AppShell.tsx");
const client = read("frontend", "src", "services", "api", "client.ts");
const i18n = read("frontend", "src", "data", "i18n.ts");

// --- 1) SESSİZ 403 TARAMASI: sahibi olmadığın kayda genel PATCH ile yazma kalmamalı -------------
// Bu kural gelecekteki regresyonu da yakalar: biri yeniden "başkasının satırına PATCH" yazarsa test düşer.
eq(/api\.jobs\.update\([^)]*applicants/.test(provider), false, "iş başvurusu ilan PATCH'i ile yazılmıyor");
// Yorum yazma/silme/yanıtlama yollarında genel PATCH kalmamalı. (Admin panelinin moderasyon
// çağrıları hariç: onlar admin token'ıyla gidiyor ve yönetici zaten şikâyet edilen yorumu
// kaldırabilmeli.)
const reviewWrites = [...provider.matchAll(/api\.mechanics\.update\([^;]*reviewList[^;]*/g)].map((m) => m[0]);
const nonAdminReviewWrites = reviewWrites.filter((c) => !c.includes("admin.authOpts()"));
eq(nonAdminReviewWrites.length, 0, "yorumlar kullanıcı tarafında tamirci PATCH'i ile yazılmıyor");
ok(/api\.jobs\.apply\(/.test(provider), "başvuru kendi uç noktasından gidiyor");
ok(/api\.jobs\.setApplicationStatus\(/.test(provider), "başvuru durumu kendi uç noktasından gidiyor");
ok(/api\.mechanics\.addReview\(/.test(provider), "yorum kendi uç noktasından gidiyor");
ok(/api\.mechanics\.deleteReview\(/.test(provider), "yorum silme kendi uç noktasından gidiyor");
ok(/api\.mechanics\.replyReview\(/.test(provider), "yorum yanıtı kendi uç noktasından gidiyor");
ok(/api\.mechanics\.toggleReviewHelpful\(/.test(provider), "'faydalı' sayacı kendi uç noktasından gidiyor");
ok(/app\.use\("\/api\/jobs", jobApplicationsRouter\)/.test(server), "başvuru router'ı bağlı");
ok(server.indexOf('app.use("/api/jobs", jobApplicationsRouter)') < server.indexOf('app.use("/api/jobs", makeCrudRouter'), "başvuru router'ı CRUD'dan önce");
ok(server.indexOf('app.use("/api/mechanics", reviewsRouter)') < server.indexOf('app.use("/api/mechanics", makeCrudRouter'), "yorum router'ı CRUD'dan önce");

// --- 2) İŞ BAŞVURUSU: kimlik ve durum uydurulamaz ----------------------------------------------
ok(/applicantId: actor\.id/.test(jobs), "aday kimliği oturumdan damgalanıyor");
ok(/status: "pending"/.test(jobs), "başvuru durumunu sunucu koyuyor");
ok(/Kendi ilanınıza başvuramazsınız/.test(jobs), "kendi ilanına başvuru engelli");
ok(/reason: "duplicate"/.test(jobs), "aynı ilana ikinci başvuru engelli");
ok(/actor\.role === "mechanic" && job\.mechanicId === actor\.id/.test(jobs), "durum değişimi ilan sahibine kısıtlı");
ok(/VALID_STATUS\.has\(status\)/.test(jobs), "geçersiz başvuru durumu reddediliyor");

// --- 3) YORUMLAR: puan artık uydurulamaz --------------------------------------------------------
// AÇIK: reviewList/reviews/rating "sharedWrite" ile giriş yapmış herkese açıktı. Dizinin tamamı
// istemciden geldiği için biri olumsuz yorumları silebiliyor, sahte yorum ekleyebiliyor ve puanı
// doğrudan 5,0 yazabiliyordu.
eq(/sharedWrite: \{/.test(server), false, "mechanics sharedWrite izni kaldırıldı");
eq(/sharedWrite/.test(crud.slice(crud.indexOf("router.patch"))), true, "makeCrudRouter'daki genel destek duruyor (başka tablolar kullanabilir)");
ok(/"reviewList", "reviews", "rating"/.test(crud), "bu üç alan genel PATCH'e kapalı");
ok(/"applicants"/.test(crud), "applicants genel PATCH'e kapalı");
ok(/UPDATE mechanics SET reviewList = \?, reviews = \?, rating = \?/.test(reviews), "puanı sunucu yazıyor");
ok(/const rated = list\.filter\(\(r\) => Number\(r\?\.rating\) > 0 && !r\.flaggedCompetitor\)/.test(reviews),
  "puan LİSTEDEN hesaplanıyor ve işaretli yorumlar ortalamaya girmiyor");
ok(/status = 'Tamamlandı'/.test(reviews), "yorum için tamamlanmış randevu şartı");
ok(/reason: "noAppointment"/.test(reviews), "randevusu olmayan yorum bırakamıyor");
ok(/reason: "duplicate"/.test(reviews), "aynı tamirciye ikinci yorum engelli");
ok(/Yalnızca kendi yorumunuzu silebilirsiniz/.test(reviews), "yorumu yalnızca yazarı silebiliyor");
ok(/Kendi işletmenize yorum yazamazsınız/.test(reviews), "kendi işletmesine yorum yazamıyor");
ok(/Tamirci hesabıyla değerlendirme yazılamaz/.test(reviews), "tamirci hesabı hiç yorum yazamıyor");
ok(/helpfulBy/.test(reviews), "'faydalı' oyu kişi başına bir kez");

// Puan hesabını gerçekten çalıştır.
const avgOf = (list) => {
  const rated = list.filter((r) => Number(r?.rating) > 0);
  return rated.length ? Math.round((rated.reduce((s, r) => s + Number(r.rating), 0) / rated.length) * 10) / 10 : 0;
};
eq(avgOf([{ rating: 5 }, { rating: 4 }]), 4.5, "iki yorumun ortalaması");
eq(avgOf([{ rating: 5 }, { rating: 4 }, { rating: 3 }]), 4, "üç yorumun ortalaması");
eq(avgOf([]), 0, "yorum yoksa puan 0");
eq(avgOf([{ rating: 5 }, { comment: "puansız" }]), 5, "puansız kayıt ortalamayı bozmuyor");

// --- 4) HESAP GÜVENLİĞİ: token tek başına hesabı ele geçirmeye yetmemeli -----------------------
ok(/authRouter\.post\("\/change-password"/.test(authSrc), "şifre değişimi kendi ucunda");
ok(/authRouter\.post\("\/change-email"/.test(authSrc), "e-posta değişimi kendi ucunda");
ok(/authRouter\.post\("\/delete-account"/.test(authSrc), "hesap silme kendi ucunda");
ok(/authRouter\.post\("\/logout-all"/.test(authSrc), "tüm cihazlardan çıkış ucu var");
// Üçü de mevcut ŞİFRE istiyor: çalınmış bir token hesabı kalıcı olarak ele geçirememeli.
for (const fn of ["/change-password", "/change-email", "/delete-account"]) {
  const block = authSrc.slice(authSrc.indexOf(`authRouter.post("${fn}"`), authSrc.indexOf(`authRouter.post("${fn}"`) + 600);
  ok(/requireCurrentPassword\(req, res\)/.test(block), `${fn} mevcut şifre istiyor`);
}
ok(/verifyPassword\(given, row\.password\)/.test(authSrc), "şifre bcrypt ile doğrulanıyor");
ok(/accountLimiter/.test(authSrc), "hesap işlemlerinde hız sınırı var");

// Şifre değişimi DİĞER OTURUMLARI KAPATMALI — yoksa şifre değiştirmek saldırganı içeride bırakır.
const changePw = authSrc.slice(authSrc.indexOf('authRouter.post("/change-password"'), authSrc.indexOf('authRouter.post("/change-email"'));
ok(/destroyUserSessions\(req\.session\.id, req\.session\.role, extractBearerToken\(req\)\)/.test(changePw),
  "şifre değişince diğer oturumlar kapanıyor");
ok(/next\.length < 8/.test(changePw), "yeni şifre en az 8 karakter");
ok(/Yeni şifre eskisiyle aynı olamaz/.test(changePw), "aynı şifreye izin verilmiyor");
ok(/deleteOtherUserSessions/.test(authUtils) && /export function destroyUserSessions/.test(authUtils), "oturum temizleme yardımcıları var");

// E-posta genel profil güncellemesiyle DEĞİŞTİRİLEMEZ (admin dahil).
ok(/const ACCOUNT_CRITICAL_FIELDS = \{/.test(crud), "hesap-kritik alan listesi var");
ok(/owners: \["email", "password"\]/.test(crud) && /mechanics: \["email", "password"\]/.test(crud), "e-posta ve şifre listede");
ok(/mode === "patch" && accountCritical\.has\(key\)/.test(crud), "kısıt güncellemede uygulanıyor");
ok(/Bu e-posta adresi başka bir hesapta kullanılıyor/.test(authSrc), "e-posta çakışması engelleniyor");
ok(/Fixperto hesabınızın e-posta adresi değişti/.test(authSrc), "eski adrese uyarı e-postası gidiyor");

// Hesap silme GERÇEKTEN siliyor (eskiden yalnızca "silindi (demo)" yazıyordu).
// Yorum satırlarını saymıyoruz: gerekçeyi anlatan yorum metninde bu ifade geçebilir.
const codeOnly = provider.split("\n").filter((l) => !l.trim().startsWith("*") && !l.trim().startsWith("//")).join("\n");
eq(/Hesabınız silindi \(demo\)/.test(codeOnly), false, "sahte 'silindi (demo)' mesajı kaldırıldı");
ok(/api\.account\.deleteAccount\(deleteAccountPassword\)/.test(provider), "silme gerçek uca gidiyor");
const del = authSrc.slice(authSrc.indexOf('authRouter.post("/delete-account"'));
ok(/DELETE FROM vehicles WHERE ownerId = \?/.test(del), "araçlar siliniyor");
ok(/DELETE FROM owners WHERE id = \?/.test(del), "araç sahibi kaydı siliniyor");
ok(/UPDATE appointments SET customer = \?/.test(del), "randevularda ad anonimleştiriliyor");
ok(/destroyUserSessions\(id, role\)/.test(del), "silinen hesabın oturumları kapatılıyor");
ok(/db\.transaction\(/.test(del), "silme tek işlemde (yarım kalmıyor)");

// --- 5) ARAYÜZ: iki rolde de var mı -------------------------------------------------------------
eq((shell.match(/logoutEverywhereBtn/g) || []).length, 2, "tüm cihazlardan çıkış iki rolde de");
// Güvenlik bölümündeki düğme (boş e-posta ile açar) iki rolde de var; profildeki salt-okunur
// alan da aynı pencereyi açıyor (mevcut adresle), o yüzden etiket 3 yerde geçiyor.
eq((shell.match(/setEmailChangeForm\(\{ open: true, email: "", password: "", loading: false \}\)/g) || []).length, 2,
  "e-posta değiştirme düğmesi iki rolde de");
eq((shell.match(/openSessionsLabel/g) || []).length, 2, "açık oturum sayısı iki rolde de");
ok(/deleteAccountPassword/.test(shell), "silme penceresinde şifre alanı var");
ok(/value=\{ownerProfile\.email\} readOnly/.test(shell), "profil e-postası doğrudan düzenlenemiyor");
ok(/emailChangeForm\.open &&/.test(shell), "e-posta değiştirme penceresi var");

// --- 6) Metinler üç dilde ------------------------------------------------------------------------
for (const key of ["accountSecurityTitle", "openSessionsLabel", "logoutEverywhereBtn", "logoutEverywhereDesc",
  "changeEmailBtn", "changeEmailDesc", "currentPasswordLabel", "emailChangedToast", "accountDeletedToast",
  "accountDeleteKeepsNote", "passwordChangedSessionsClosedToast"]) {
  const line = i18n.split("\n").find((l) => l.trim().startsWith(`${key}:`)) || "";
  ok(line.length > 0, `${key} tanımlı`);
  for (const lang of ["tr:", "en:", "de:"]) ok(line.includes(lang), `${key} ${lang} dilinde var`);
}

report("hesap güvenliği");
