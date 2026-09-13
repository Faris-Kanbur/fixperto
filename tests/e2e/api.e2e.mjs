/**
 * UÇTAN UCA DENETİM — gerçek sunucu, gerçek SQLite, gerçek HTTP.
 * ---------------------------------------------------------------------------------------------
 * Her kontrol şu zincirin TAMAMINI doğruluyor:
 *   istek → kimlik → yetki → doğrulama → iş mantığı → VERİTABANI → yanıt.
 * "200 döndü" tek başına geçer not değil: yazma işlemlerinden sonra satırın gerçekten değiştiğini
 * (ya da değişMEdiğini) doğrudan veritabanından okuyoruz.
 */
import { startServer, stopServer, api, createUser, login, adminToken, row, rows , skipIfUnsupported } from "./harness.mjs";

let passed = 0;
const failures = [];
const eq = (actual, expected, name) => {
  if (JSON.stringify(actual) === JSON.stringify(expected)) passed++;
  else failures.push(`${name}\n    beklenen: ${JSON.stringify(expected)}\n    gelen   : ${JSON.stringify(actual)}`);
};
const ok = (v, name) => eq(!!v, true, name);
const section = (title) => { if (process.env.E2E_VERBOSE) console.log(`\n— ${title}`); };

if (skipIfUnsupported("uçtan uca")) process.exit(0);

await startServer();
try {
  // ============================================================ KİMLİK / OTURUM
  section("Kayıt, giriş, OTP");
  const owner = await createUser("owner", { name: "Ayşe Yılmaz", email: "ayse@example.com", phone: "+905321234567" });
  const owner2 = await createUser("owner", { name: "Mehmet Kaya", email: "mehmet@example.com", phone: "+905321110022" });
  const mech = await createUser("mechanic", { name: "Usta Garaj", email: "usta@example.com", phone: "+905331234567" });
  const mech2 = await createUser("mechanic", { name: "Rakip Servis", email: "rakip@example.com", phone: "+905341234567" });
  ok(owner.id && mech.id, "kayıt + giriş + OTP zinciri gerçek token üretiyor");
  ok(row("SELECT id FROM owners WHERE id = ?", owner.id), "araç sahibi veritabanında");
  ok(row("SELECT id FROM mechanics WHERE id = ?", mech.id), "tamirci veritabanında");

  // Şifre veritabanında AÇIK METİN olmamalı.
  const pwRow = row("SELECT password FROM owners WHERE id = ?", owner.id);
  ok(pwRow.password !== owner.password && /^\$2[aby]\$/.test(pwRow.password), "şifre veritabanında bcrypt ile saklanıyor");
  const meRes = await api("GET", "/api/auth/me", { token: owner.token });
  eq(meRes.status, 200, "/me geçerli token ile 200");
  eq(meRes.body.password, undefined, "/me yanıtında şifre YOK");

  eq((await api("GET", "/api/auth/me")).status, 401, "/me tokensiz 401");
  eq((await api("GET", "/api/auth/me", { token: "sahte-token" })).status, 401, "/me sahte token 401");
  eq((await api("POST", "/api/auth/register", { body: { role: "owner", name: "X", email: "ayse@example.com" } })).status, 409,
    "aynı e-posta ile ikinci kayıt reddediliyor");
  eq((await api("POST", "/api/auth/register", { body: { role: "owner", name: "X", email: "gecersiz" } })).status, 400,
    "geçersiz e-posta reddediliyor");
  eq((await api("POST", "/api/auth/login", { body: { email: "ayse@example.com", password: "yanlis" } })).status, 401,
    "yanlış şifre 401");
  const badOtp = await api("POST", "/api/auth/login", { body: { email: owner.email, password: owner.password } });
  eq((await api("POST", "/api/auth/verify-otp", { body: { loginTicket: badOtp.body.loginTicket, code: "000000" } })).status, 400,
    "yanlış OTP kodu reddediliyor");

  // ============================================================ ARAÇ CRUD + IDOR
  section("Araçlar: CRUD ve yetki");
  const vCreate = await api("POST", "/api/vehicles", {
    token: owner.token,
    // ownerId İSTEMCİDEN gönderiliyor ve BAŞKASININ id'si — sunucu bunu yok saymalı.
    body: { ownerId: owner2.id, brand: "bmw", model: "320i", year: 2019, plate: "34ABC123", vin: "WBA3B5C50DF123456" },
  });
  eq(vCreate.status, 201, "araç oluşturuldu");
  const vehicleId = vCreate.body.id;
  const vDb = row("SELECT * FROM vehicles WHERE id = ?", vehicleId);
  eq(vDb.ownerId, owner.id, "sahiplik İSTEMCİDEN değil oturumdan yazılıyor (mass assignment engelli)");
  eq(vDb.plate, "34ABC123", "veri veritabanına doğru yazıldı");

  const listA = await api("GET", "/api/vehicles", { token: owner.token });
  eq(listA.body.some((v) => v.id === vehicleId), true, "sahibi kendi aracını listede görüyor");
  const listB = await api("GET", "/api/vehicles", { token: owner2.token });
  eq(listB.body.some((v) => v.id === vehicleId), false, "BAŞKA araç sahibi bu aracı listede GÖRMÜYOR");
  eq((await api("GET", `/api/vehicles/${vehicleId}`, { token: owner2.token })).status, 403, "tekil okuma IDOR'a kapalı");
  eq((await api("GET", `/api/vehicles/${vehicleId}`)).status, 401, "tokensiz okuma 401");

  eq((await api("PATCH", `/api/vehicles/${vehicleId}`, { token: owner2.token, body: { plate: "HACK" } })).status, 403,
    "başkasının aracı güncellenemiyor");
  eq(row("SELECT plate FROM vehicles WHERE id = ?", vehicleId).plate, "34ABC123", "reddedilen istek veritabanını DEĞİŞTİRMEDİ");
  const vPatch = await api("PATCH", `/api/vehicles/${vehicleId}`, { token: owner.token, body: { plate: "34XYZ999", ownerId: owner2.id } });
  eq(vPatch.status, 200, "sahibi kendi aracını güncelleyebiliyor");
  const vAfter = row("SELECT plate, ownerId FROM vehicles WHERE id = ?", vehicleId);
  eq(vAfter.plate, "34XYZ999", "güncelleme veritabanına yazıldı");
  eq(vAfter.ownerId, owner.id, "sahiplik PATCH ile devredilemiyor");
  eq((await api("GET", `/api/vehicles/${vehicleId}`, { token: owner.token })).body.plate, "34XYZ999",
    "yeniden okumada (refresh) yeni değer duruyor");

  // ============================================================ RANDEVU
  section("Randevu akışı");
  const apptRes = await api("POST", "/api/appointments", {
    token: owner.token,
    body: { ownerId: owner2.id, mechanicId: mech.id, customer: "Ayşe", vehicle: "BMW 320i (34XYZ999)", date: "1 Ocak", time: "10:00", status: "Onay Bekliyor" },
  });
  eq(apptRes.status, 201, "randevu oluşturuldu");
  const apptId = apptRes.body.id;
  eq(row("SELECT ownerId FROM appointments WHERE id = ?", apptId).ownerId, owner.id, "randevu sahibi oturumdan");
  eq((await api("GET", "/api/appointments", { token: mech.token })).body.some((a) => a.id === apptId), true,
    "randevunun tamircisi randevuyu görüyor");
  eq((await api("GET", "/api/appointments", { token: owner2.token })).body.some((a) => a.id === apptId), false,
    "ilgisiz araç sahibi randevuyu GÖRMÜYOR");
  eq((await api("PATCH", `/api/appointments/${apptId}`, { token: owner2.token, body: { status: "İptal Edildi" } })).status, 403,
    "ilgisiz kullanıcı randevu durumunu değiştiremiyor");
  eq((await api("PATCH", `/api/appointments/${apptId}`, { token: mech.token, body: { status: "Tamamlandı" } })).status, 200,
    "tamirci randevusunu tamamlayabiliyor");
  eq(row("SELECT status FROM appointments WHERE id = ?", apptId).status, "Tamamlandı", "durum veritabanında güncellendi");

  // ============================================================ DEĞERLENDİRME
  section("Değerlendirmeler ve rekabet koruması");
  const rNoAppt = await api("POST", `/api/mechanics/${mech2.id}/reviews`, { token: owner.token, body: { rating: 1, comment: "kötü" } });
  eq(rNoAppt.status, 403, "randevusu olmayan kullanıcı yorum yazamıyor");
  eq(rNoAppt.body.reason, "noAppointment", "reddin nedeni makine-okunur");
  eq(row("SELECT reviews FROM mechanics WHERE id = ?", mech2.id).reviews, 0, "reddedilen yorum veritabanına YAZILMADI");

  eq((await api("POST", `/api/mechanics/${mech.id}/reviews`, { token: owner.token, body: { rating: 9 } })).status, 400,
    "5'ten büyük puan reddediliyor");
  const rOk = await api("POST", `/api/mechanics/${mech.id}/reviews`, { token: owner.token, body: { rating: 4, comment: "Temiz iş" } });
  eq(rOk.status, 201, "tamamlanmış randevusu olan kullanıcı yorum yazabiliyor");
  const mechAfter = row("SELECT rating, reviews, reviewList FROM mechanics WHERE id = ?", mech.id);
  eq(mechAfter.reviews, 1, "yorum sayısı veritabanında arttı");
  eq(mechAfter.rating, 4, "PUANI SUNUCU hesapladı");
  const storedReview = JSON.parse(mechAfter.reviewList)[0];
  eq(storedReview.authorId, owner.id, "yorum yazarı oturumdan damgalandı");
  eq(storedReview.comment, "Temiz iş", "yorum metni doğru yazıldı");

  eq((await api("POST", `/api/mechanics/${mech.id}/reviews`, { token: owner.token, body: { rating: 5 } })).body.reason, "duplicate",
    "aynı tamirciye ikinci yorum engelli");
  // PUAN MANİPÜLASYONU: genel PATCH ile puan yazılamamalı.
  await api("PATCH", `/api/mechanics/${mech.id}`, { token: mech.token, body: { rating: 5, reviews: 999, verified: 1 } });
  const manip = row("SELECT rating, reviews, verified FROM mechanics WHERE id = ?", mech.id);
  eq([manip.rating, manip.reviews, manip.verified], [4, 1, 0], "puan/yorum sayısı/doğrulama rozeti PATCH ile değiştirilemiyor");

  eq((await api("POST", `/api/mechanics/${mech.id}/reviews`, { token: mech2.token, body: { rating: 1 } })).body.reason, "mechanicRole",
    "tamirci hesabı başka tamirciye yorum yazamıyor");
  const reviewId = storedReview.id;
  eq((await api("POST", `/api/mechanics/${mech.id}/reviews/${reviewId}/helpful`, { token: mech2.token })).status, 403,
    "tamirci hesabı yorum beğenemiyor");
  eq((await api("DELETE", `/api/mechanics/${mech.id}/reviews/${reviewId}`, { token: owner2.token })).status, 403,
    "başkasının yorumu silinemiyor");
  ok(JSON.parse(row("SELECT reviewList FROM mechanics WHERE id = ?", mech.id).reviewList).length === 1, "yorum hâlâ duruyor");
  eq((await api("POST", `/api/mechanics/${mech.id}/reviews/${reviewId}/helpful`, { token: owner2.token })).status, 200,
    "araç sahibi beğenebiliyor");
  eq(JSON.parse(row("SELECT reviewList FROM mechanics WHERE id = ?", mech.id).reviewList)[0].helpful, 1,
    "beğeni sayacı sunucuda tutuluyor");

  // ============================================================ İLAN / TEKLİF / SORU
  section("İlanlar, teklifler, sorular");
  const listing = await api("POST", "/api/listings", {
    token: owner.token,
    body: { sellerId: owner2.id, sellerType: "mechanic", brand: "Audi", model: "A4", year: 2018, km: 90000, price: "850.000₺" },
  });
  eq(listing.status, 201, "ilan oluşturuldu");
  const listingId = listing.body.id;
  const lDb = row("SELECT sellerId, sellerType FROM listings WHERE id = ?", listingId);
  eq([lDb.sellerId, lDb.sellerType], [owner.id, "owner"], "satıcı kimliği ve türü oturumdan (istemci 'mechanic' göndermişti)");

  eq((await api("POST", `/api/listings/${listingId}/offers`, { token: owner.token, body: { amount: "800000" } })).status, 403,
    "kendi ilanına teklif verilemiyor");
  const offer1 = await api("POST", `/api/listings/${listingId}/offers`, { token: owner2.token, body: { amount: "800000" } });
  eq(offer1.status, 201, "alıcı teklif verebiliyor");
  let offersDb = JSON.parse(row("SELECT offers FROM listings WHERE id = ?", listingId).offers);
  eq(offersDb.length, 1, "teklif VERİTABANINA yazıldı");
  eq([offersDb[0].buyerId, offersDb[0].status, offersDb[0].seen], [owner2.id, "pending", false], "teklif alanları doğru");

  await api("POST", `/api/listings/${listingId}/offers`, { token: owner2.token, body: { amount: "820000" } });
  offersDb = JSON.parse(row("SELECT offers FROM listings WHERE id = ?", listingId).offers);
  eq(offersDb.length, 1, "görülmemiş teklif YENİ SATIR açmıyor");
  eq(offersDb[0].amount, "820000", "görülmemiş teklifin tutarı güncellendi");

  // Satıcı teklifi gördü → yeni teklif engelli.
  await api("PATCH", `/api/listings/${listingId}`, { token: owner.token, body: { offers: offersDb.map((o) => ({ ...o, seen: true })) } });
  const blocked = await api("POST", `/api/listings/${listingId}/offers`, { token: owner2.token, body: { amount: "830000" } });
  eq([blocked.status, blocked.body.reason], [409, "seen"], "görülmüş teklif varken yeni teklif engelli");

  // Reddedildi → yeni teklif serbest, eskisi arşivleniyor.
  const rejected = JSON.parse(row("SELECT offers FROM listings WHERE id = ?", listingId).offers).map((o) => ({ ...o, status: "rejected" }));
  await api("PATCH", `/api/listings/${listingId}`, { token: owner.token, body: { offers: rejected } });
  eq((await api("POST", `/api/listings/${listingId}/offers`, { token: owner2.token, body: { amount: "840000" } })).status, 201,
    "reddedilen tekliften sonra yeni teklif serbest");
  offersDb = JSON.parse(row("SELECT offers FROM listings WHERE id = ?", listingId).offers);
  eq(offersDb.filter((o) => o.status === "replaced").length, 1, "eski reddedilen teklif arşivlendi");
  eq(offersDb.filter((o) => o.status === "pending").length, 1, "tek güncel teklif var");

  const q = await api("POST", `/api/listings/${listingId}/messages`, { token: owner2.token, body: { text: "Boyalı parça var mı?" } });
  eq(q.status, 201, "ilana soru sorulabiliyor");
  let msgsDb = JSON.parse(row("SELECT messages FROM listings WHERE id = ?", listingId).messages);
  eq([msgsDb[0].buyerId, msgsDb[0].isSellerReply], [owner2.id, false], "soru soranın kimliği oturumdan, satıcı cevabı DEĞİL");
  await api("POST", `/api/listings/${listingId}/messages`, { token: owner.token, body: { text: "Yok, orijinal." } });
  msgsDb = JSON.parse(row("SELECT messages FROM listings WHERE id = ?", listingId).messages);
  eq(msgsDb[0].isSellerReply, true, "satıcının cevabı SUNUCUDA işaretleniyor");

  eq((await api("PATCH", `/api/listings/${listingId}`, { token: owner2.token, body: { price: "1₺" } })).status, 403,
    "başkasının ilanı düzenlenemiyor");
  eq(row("SELECT price FROM listings WHERE id = ?", listingId).price, "850.000₺", "reddedilen düzenleme veritabanını değiştirmedi");
  await api("PATCH", `/api/listings/${listingId}`, { token: owner.token, body: { shareCount: 9999 } });
  eq(row("SELECT shareCount FROM listings WHERE id = ?", listingId).shareCount, 0, "sayaç alanı PATCH ile şişirilemiyor");

  // ============================================================ İŞ İLANI + BAŞVURU
  section("İş ilanı ve başvuru");
  const job = await api("POST", "/api/jobs", { token: mech.token, body: { title: "Usta aranıyor", mechanicId: mech2.id, status: "open" } });
  eq(job.status, 201, "iş ilanı oluşturuldu");
  const jobId = job.body.id;
  eq(row("SELECT mechanicId FROM job_listings WHERE id = ?", jobId).mechanicId, mech.id, "ilan sahibi oturumdan");

  const apply = await api("POST", `/api/jobs/${jobId}/applications`, {
    token: owner.token,
    body: { name: "Ayşe Yılmaz", phone: "+905321234567", email: "ayse@example.com", message: "Başvuruyorum", status: "accepted" },
  });
  eq(apply.status, 201, "iş başvurusu gönderildi");
  let apps = JSON.parse(row("SELECT applicants FROM job_listings WHERE id = ?", jobId).applicants);
  eq(apps.length, 1, "BAŞVURU GERÇEKTEN VERİTABANINA YAZILDI");
  eq([apps[0].applicantId, apps[0].status], [owner.id, "pending"], "aday kimliği ve durumu sunucudan (istemci 'accepted' göndermişti)");
  eq((await api("POST", `/api/jobs/${jobId}/applications`, { token: owner.token, body: { name: "Ayşe" } })).body.reason, "duplicate",
    "aynı ilana ikinci başvuru engelli");
  eq((await api("POST", `/api/jobs/${jobId}/applications`, { token: mech.token, body: { name: "Ben" } })).status, 403,
    "kendi ilanına başvuru engelli");
  eq((await api("PATCH", `/api/jobs/${jobId}/applications/${apps[0].id}`, { token: owner.token, body: { status: "accepted" } })).status, 403,
    "aday kendi başvurusunun durumunu değiştiremiyor");
  eq((await api("PATCH", `/api/jobs/${jobId}/applications/${apps[0].id}`, { token: mech.token, body: { status: "rejected" } })).status, 200,
    "ilan sahibi başvuru durumunu değiştirebiliyor");
  apps = JSON.parse(row("SELECT applicants FROM job_listings WHERE id = ?", jobId).applicants);
  eq(apps[0].status, "rejected", "başvuru durumu veritabanında güncellendi");

  // ============================================================ SOHBET
  section("Sohbet");
  const convo = await api("POST", "/api/conversations", { token: owner.token, body: { mechanicId: mech.id, messages: [{ sender: "mechanic", text: "sahte" }] } });
  eq(convo.status, 201, "sohbet oluşturuldu");
  const convoId = convo.body.id;
  const cDb = row("SELECT ownerId, mechanicId, messages FROM conversations WHERE id = ?", convoId);
  eq(cDb.ownerId, owner.id, "sohbetin araç sahibi tarafı oturumdan");
  eq(JSON.parse(cDb.messages)[0].sender, "owner", "sohbet açılışındaki mesaj GÖNDERENİ sunucu damgaladı (sahte 'mechanic' ezildi)");
  eq((await api("GET", `/api/conversations/${convoId}`, { token: owner2.token })).status, 403, "üçüncü kişi sohbeti okuyamıyor");
  const append = await api("POST", `/api/conversations/${convoId}/messages`, { token: mech.token, body: { messages: [{ text: "Merhaba" }] } });
  eq(append.status, 200, "tamirci sohbete mesaj ekleyebiliyor");
  const msgs = JSON.parse(row("SELECT messages FROM conversations WHERE id = ?", convoId).messages);
  eq(msgs[msgs.length - 1].sender, "mechanic", "eklenen mesajın göndereni oturumdan");
  eq((await api("PATCH", `/api/conversations/${convoId}`, { token: owner.token, body: { messages: [] } })).status, 403,
    "mesaj dizisi PATCH ile ezilemiyor");
  eq(JSON.parse(row("SELECT messages FROM conversations WHERE id = ?", convoId).messages).length, msgs.length,
    "reddedilen PATCH mesajları silmedi");
  eq((await api("POST", `/api/conversations/${convoId}/messages`, { token: owner2.token, body: { messages: [{ text: "x" }] } })).status, 403,
    "üçüncü kişi sohbete yazamıyor");

  // ============================================================ ARACIN GEÇMİŞİ (VIN)
  section("Araç geçmişi");
  const rec = await api("POST", "/api/vehicle-history", { token: mech.token, body: { appointmentId: apptId } });
  eq(rec.status, 201, "tamirci tamamlanmış randevudan geçmiş kaydı oluşturabiliyor");
  const hist = row("SELECT * FROM vehicle_history WHERE appointmentId = ?", apptId);
  eq(hist.vin, "WBA3B5C50DF123456", "VIN sunucuda plakadan eşleştirildi");
  eq([hist.ownerId, hist.mechanicId], [owner.id, mech.id], "kayıt tarafları doğru");
  eq((await api("POST", "/api/vehicle-history", { token: owner.token, body: { appointmentId: apptId } })).status, 403,
    "araç sahibi geçmiş kaydı oluşturamıyor");
  eq((await api("POST", "/api/vehicle-history", { token: mech2.token, body: { appointmentId: apptId, vin: "WBA3B5C50DF123456" } })).status, 403,
    "başka tamirci bu randevudan kayıt oluşturamıyor");
  eq((await api("POST", "/api/vehicle-history/lookup", { body: { vin: "WBA3B5C50DF123456" } })).status, 401,
    "VIN sorgulama girişsiz yapılamıyor");
  const lookup = await api("POST", "/api/vehicle-history/lookup", { token: owner2.token, body: { vin: "WBA3B5C50DF123456" } });
  eq(lookup.status, 200, "giriş yapmış kullanıcı sorgulayabiliyor");
  eq(lookup.body.records.length, 1, "paylaşıma açık kayıt dönüyor");
  eq(Object.keys(lookup.body.records[0]).some((k) => ["ownerId", "customer", "plate", "servicePrice"].includes(k)), false,
    "sorgulama yanıtında KİŞİSEL VERİ yok");
  eq((await api("POST", "/api/vehicle-history/lookup", { token: owner2.token, body: { vin: "1234" } })).status, 400,
    "geçersiz VIN reddediliyor");

  // ============================================================ HESAP GÜVENLİĞİ
  section("Hesap güvenliği");
  const victim = await createUser("owner", { name: "Kurban Test", email: "kurban@example.com", phone: "+905321230000" });
  const stolenToken = victim.token;                      // "çalınmış" oturum
  const freshToken = await login(victim.email, victim.password);   // ikinci cihaz
  eq((await api("POST", "/api/auth/change-password", { token: stolenToken, body: { newPassword: "yenisifre123" } })).status, 403,
    "mevcut şifre olmadan şifre değiştirilemiyor");
  eq((await api("POST", "/api/auth/change-email", { token: stolenToken, body: { newEmail: "saldirgan@example.com" } })).status, 403,
    "mevcut şifre olmadan e-posta değiştirilemiyor");
  eq(row("SELECT email FROM owners WHERE id = ?", victim.id).email, "kurban@example.com", "e-posta değişmedi");
  eq((await api("POST", "/api/auth/delete-account", { token: stolenToken, body: {} })).status, 403,
    "mevcut şifre olmadan hesap silinemiyor");
  ok(row("SELECT id FROM owners WHERE id = ?", victim.id), "hesap duruyor");
  eq((await api("PATCH", `/api/owners/${victim.id}`, { token: stolenToken, body: { email: "saldirgan@example.com" } })).status, 200,
    "genel profil güncellemesi çalışıyor");
  eq(row("SELECT email FROM owners WHERE id = ?", victim.id).email, "kurban@example.com",
    "ama E-POSTA genel güncellemeyle DEĞİŞMİYOR (hesap-kritik alan)");

  const pwChange = await api("POST", "/api/auth/change-password", { token: freshToken, body: { currentPassword: victim.password, newPassword: "cokGuvenliSifre1" } });
  eq(pwChange.status, 200, "doğru şifreyle değişim başarılı");
  ok(pwChange.body.otherSessionsClosed >= 1, "diğer oturumlar kapatıldı");
  eq((await api("GET", "/api/auth/me", { token: stolenToken })).status, 401, "ÇALINMIŞ TOKEN artık geçersiz");
  eq((await api("GET", "/api/auth/me", { token: freshToken })).status, 200, "işlemi yapan oturum ayakta");

  const delTarget = await createUser("owner", { name: "Silinecek", email: "silinecek@example.com", phone: "+905321239999" });
  await api("POST", "/api/vehicles", { token: delTarget.token, body: { brand: "Fiat", model: "Egea", plate: "06XYZ01" } });
  eq((await api("POST", "/api/auth/delete-account", { token: delTarget.token, body: { currentPassword: delTarget.password } })).status, 200,
    "doğru şifreyle hesap silindi");
  eq(row("SELECT id FROM owners WHERE id = ?", delTarget.id), undefined, "hesap satırı veritabanından SİLİNDİ");
  eq(rows("SELECT id FROM vehicles WHERE ownerId = ?", delTarget.id).length, 0, "araçları da silindi");
  eq(rows("SELECT tokenHash FROM sessions WHERE userId = ? AND role = 'owner'", delTarget.id).length, 0, "oturumları kapatıldı");
  eq((await api("GET", "/api/auth/me", { token: delTarget.token })).status, 401, "silinen hesabın token'ı geçersiz");

  // ============================================================ YÖNETİCİ
  section("Yönetici");
  eq((await api("POST", "/api/admin/login", { body: { email: "admin@fixperto.test", password: "yanlis" } })).status, 401, "yanlış admin şifresi 401");
  const admin = await adminToken();
  eq((await api("GET", "/api/admin/stats")).status, 401, "admin ucu tokensiz 401");
  eq((await api("GET", "/api/admin/stats", { token: owner.token })).status, 401, "kullanıcı token'ı admin ucunu AÇMIYOR");
  eq((await api("GET", "/api/admin/stats", { token: admin })).status, 200, "admin token'ı çalışıyor");
  eq((await api("GET", "/api/analytics/overview", { token: owner.token })).status, 403, "analitik kullanıcıya kapalı (kimlik var, yetki yok → 403)");
  eq((await api("GET", "/api/analytics/comparisons", { token: admin })).status, 200, "karşılaştırma verisi admin'e açık");

  // ============================================================ GİRDİ GÜVENLİĞİ
  section("Girdi güvenliği ve uç durumlar");
  const inj = await api("POST", "/api/vehicles", { token: owner.token, body: { brand: "'; DROP TABLE vehicles; --", model: "x", plate: "P1" } });
  eq(inj.status, 201, "SQL enjeksiyon denemesi normal veri gibi kabul edildi");
  ok(row("SELECT COUNT(*) n FROM vehicles").n >= 1, "vehicles tablosu DURUYOR (enjeksiyon çalışmadı)");
  eq(row("SELECT brand FROM vehicles WHERE id = ?", inj.body.id).brand, "'; DROP TABLE vehicles; --", "metin olduğu gibi saklandı");

  const xss = await api("POST", "/api/vehicles", { token: owner.token, body: { brand: "<script>alert(1)</script>", model: "m", plate: "P2" } });
  eq(row("SELECT brand FROM vehicles WHERE id = ?", xss.body.id).brand, "<script>alert(1)</script>",
    "XSS yükü kaçış yapılmadan SAKLANIYOR (React basarken kaçıyor; sunucu HTML üretmiyor)");

  const proto = await api("POST", "/api/vehicles", { token: owner.token, body: JSON.stringify({ brand: "P", model: "P", plate: "P3", "__proto__": { polluted: true } }) });
  eq(({}).polluted, undefined, "prototip kirlenmesi olmadı");
  ok([201, 400, 500].includes(proto.status), "__proto__ içeren gövde sunucuyu çökertmedi");

  eq((await api("GET", "/api/vehicles/../../etc/passwd", { token: owner.token })).status >= 400, true, "dizin geçişi denemesi reddediliyor");
  eq((await api("GET", "/api/vehicles/99999999", { token: owner.token })).status, 404, "olmayan kayıt 404");
  eq((await api("GET", "/api/vehicles/abc", { token: owner.token })).status, 404, "geçersiz id 404");

  const longText = "ç".repeat(50000);
  const longRes = await api("POST", `/api/listings/${listingId}/messages`, { token: owner2.token, body: { text: longText } });
  eq(longRes.status, 400, "çok uzun mesaj reddediliyor");
  const emoji = await api("POST", `/api/listings/${listingId}/messages`, { token: owner2.token, body: { text: "Süper 🚗 çalışıyor mu? ğüşiöç" } });
  eq(emoji.status, 201, "emoji ve Türkçe karakterler kabul ediliyor");
  eq(JSON.parse(row("SELECT messages FROM listings WHERE id = ?", listingId).messages)[0].text, "Süper 🚗 çalışıyor mu? ğüşiöç",
    "unicode veritabanına bozulmadan yazıldı");
  eq((await api("POST", `/api/listings/${listingId}/messages`, { token: owner2.token, body: { text: "   " } })).status, 400,
    "boşluktan ibaret mesaj reddediliyor");
  eq((await api("POST", `/api/listings/${listingId}/offers`, { token: owner2.token, body: { amount: -5 } })).status, 400,
    "negatif teklif reddediliyor");
  eq((await api("POST", `/api/listings/${listingId}/offers`, { token: owner2.token, body: { amount: 999999999999 } })).status, 400,
    "aşırı büyük teklif reddediliyor");
  eq((await api("POST", `/api/listings/${listingId}/offers`, { token: owner2.token, body: {} })).status, 400,
    "eksik alan reddediliyor");
  eq((await api("POST", "/api/vehicles", { token: owner.token, body: "bozuk-json" })).status >= 400, true,
    "bozuk JSON gövdesi reddediliyor");

  // Hata yanıtları iç bilgi sızdırmamalı.
  const err = await api("GET", "/api/vehicles/99999999", { token: owner.token });
  eq(/SQLITE|sqlite|stack|at Object|node_modules/.test(JSON.stringify(err.body)), false, "hata yanıtında yığın izi/SQL detayı yok");

  // ============================================================ ÇEVİRİ
  section("Çeviri");
  const tr = await api("POST", "/api/translate/batch", { body: { items: [{ id: "a", text: "Merhaba", from: "tr" }, { id: "b", text: "Merhaba", from: "tr" }], to: "de" } });
  eq(tr.status, 200, "toplu çeviri yanıt veriyor");
  ok(tr.body.results && "a" in tr.body.results && "b" in tr.body.results, "her istek için sonuç var");
  eq(tr.body.results.a, tr.body.results.b, "aynı metin aynı sonucu alıyor (tek çeviri, dağıtıldı)");
  eq((await api("POST", "/api/translate/batch", { body: { items: [], to: "de" } })).status, 400, "boş liste reddediliyor");
  eq((await api("POST", "/api/translate/batch", { body: { items: Array.from({ length: 100 }, (_, i) => ({ id: i, text: "x", from: "tr" })), to: "de" } })).status, 400,
    "60'tan fazla metin reddediliyor");

  // ============================================================ HERKESE AÇIK OKUMA
  section("Girişsiz erişim sınırları");
  eq((await api("GET", "/api/mechanics")).status, 200, "tamirci listesi girişsiz okunabiliyor (pazar yeri)");
  const publicMechs = (await api("GET", "/api/mechanics")).body;
  eq(publicMechs.some((m) => m.iban || m.password), false, "herkese açık listede IBAN/şifre YOK");
  eq((await api("GET", `/api/mechanics/${mech.id}`)).body.iban, undefined, "tekil tamirci yanıtında IBAN yok");
  eq((await api("GET", "/api/vehicles")).status, 401, "araçlar girişsiz okunamıyor");
  eq((await api("GET", "/api/appointments")).status, 401, "randevular girişsiz okunamıyor");
  eq((await api("GET", "/api/tickets")).status, 401, "destek talepleri girişsiz okunamıyor");
  eq((await api("GET", "/api/conversations")).status, 401, "sohbetler girişsiz okunamıyor");
  eq((await api("POST", "/api/broadcasts", { token: owner.token, body: { title: "sahte", body: "x" } })).status, 401,
    "duyuru oluşturmak yalnızca admin'e açık");
} finally {
  stopServer();
}

if (failures.length === 0) {
  console.log(`OK uçtan uca (${passed})`);
  process.exit(0);
}
console.log(`BAŞARISIZ uçtan uca — ${failures.length}/${passed + failures.length}`);
for (const f of failures) console.log("  ✗ " + f);
process.exit(1);
