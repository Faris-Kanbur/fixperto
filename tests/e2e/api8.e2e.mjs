/**
 * İKİNCİ (ADVERSARIAL) DENETİMİN REGRESYON TAKIMI.
 * ================================================================================================
 * Buradaki her kontrol, ikinci denetimde GERÇEKTEN ÖLÇÜLMÜŞ bir açığa karşılık geliyor — hiçbiri
 * "olsa iyi olur" değil. Sıra, bulguların ciddiyetine göre.
 *
 * BU TAKIMIN KENDİSİNE KONAN KURAL: bir yazma reddedildiyse SADECE durum kodunu değil, VERİTABANI
 * DURUMUNU da kontrol ediyoruz. Sebebi somut: 403 dönen bir uç, dönmeden ÖNCE bir şey yazmış
 * olabilir (kısmi mutasyon) ve yalnızca status'e bakan bir test bunu asla görmez. "Reddedildi"
 * demek "hiçbir şey değişmedi" demek zorunda.
 */
import {
  startServer, stopServer, api, row, rows, createUser, login, adminToken, skipIfUnsupported, db,
} from "./harness.mjs";
import { eq, ok, report, stripComments } from "../_harness.mjs";

if (skipIfUnsupported("uçtan uca ikinci denetim")) process.exit(0);

await startServer();
try {
  const A = await createUser("owner", { name: "Ayşe", email: "a8-a@example.com", phone: "+905321250001" });
  const B = await createUser("owner", { name: "Burak", email: "a8-b@example.com", phone: "+905321250002" });
  const M = await createUser("mechanic", { name: "Mehmet Usta", email: "a8-m@example.com", phone: "+905321250003" });
  const M2 = await createUser("mechanic", { name: "Rakip Usta", email: "a8-m2@example.com", phone: "+905321250004" });
  const admin = await adminToken();
  const veh = await api("POST", "/api/vehicles", { token: A.token, body: { brand: "VW", model: "Golf", plate: "34AA001" } });

  // ===== 1) RANDEVU: DELETE DURUM MAKİNESİNİ BYPASS EDEMEZ (HIGH) ==============================
  // Bulgu: PATCH "Tamamlandı → İptal Edildi" için 409 veriyordu ama DELETE aynı kaydı 204 ile
  // siliyordu. Yani kural tek bir yazma yoluna konmuştu, diğer yol sessiz bir bypass'tı.
  const mkAppt = async (time) => {
    const r = await api("POST", "/api/appointments", {
      token: A.token,
      body: { mechanicId: M.id, ownerId: A.id, vehicleId: veh.body.id, date: "2027-03-01", time, service: "Bakım", issue: "fren" },
    });
    return r.body.id;
  };
  const doneId = await mkAppt("09:00");
  await api("PATCH", `/api/appointments/${doneId}`, { token: M.token, body: { status: "Sırada" } });
  eq((await api("PATCH", `/api/appointments/${doneId}`, { token: M.token, body: { status: "Tamamlandı", servicePrice: 1500 } })).status, 200,
    "tamirci randevuyu tamamladı");
  eq(row("SELECT status FROM appointments WHERE id = ?", doneId).status, "Tamamlandı", "durum veritabanında Tamamlandı");
  const delDone = await api("DELETE", `/api/appointments/${doneId}`, { token: A.token });
  eq(delDone.status, 409, "TAMAMLANMIŞ randevu müşteri tarafından SİLİNEMİYOR");
  ok(row("SELECT id FROM appointments WHERE id = ?", doneId), "kayıt duruyor (tamircinin iş/ciro geçmişi)");
  eq(row("SELECT servicePrice FROM appointments WHERE id = ?", doneId).servicePrice, 1500, "tutar da duruyor (kısmi mutasyon yok)");

  const noShowId = await mkAppt("10:00");
  await api("PATCH", `/api/appointments/${noShowId}`, { token: M.token, body: { status: "Sırada" } });
  await api("PATCH", `/api/appointments/${noShowId}`, { token: M.token, body: { status: "Gelmedi", noShow: 1 } });
  eq((await api("DELETE", `/api/appointments/${noShowId}`, { token: A.token })).status, 409,
    "'Gelmedi' damgalı randevu müşteri tarafından SİLİNEMİYOR (kendi sicilini temizleyemez)");
  eq(Number(row("SELECT noShow FROM appointments WHERE id = ?", noShowId).noShow), 1, "noShow damgası duruyor");
  // Tamirci de silemiyor — kural role değil KAYDA ait.
  eq((await api("DELETE", `/api/appointments/${noShowId}`, { token: M.token })).status, 409,
    "tamirci de silemiyor (kural kayda ait, role değil)");
  // Ama henüz iş olmamış bir randevu silinebiliyor: kural gereğinden fazla kısıtlamıyor.
  const pendingId = await mkAppt("11:00");
  eq((await api("DELETE", `/api/appointments/${pendingId}`, { token: A.token })).status, 204,
    "onay bekleyen randevu silinebiliyor (kural gereğinden fazla kısıtlamıyor)");
  // Yabancı biri hiç silemiyor.
  const otherId = await mkAppt("12:00");
  eq((await api("DELETE", `/api/appointments/${otherId}`, { token: B.token })).status, 403, "taraf olmayan silemiyor");
  ok(row("SELECT id FROM appointments WHERE id = ?", otherId), "yabancı isteğinden sonra kayıt duruyor");
  eq((await api("DELETE", `/api/appointments/${otherId}`, {})).status, 401, "girişsiz silemiyor");
  // Yönetici moderasyon için silebiliyor (işletme kaydını ancak o düzeltebilir).
  eq((await api("DELETE", `/api/appointments/${doneId}`, { token: admin })).status, 204, "yönetici tamamlanmışı silebiliyor");

  // ===== 2) HESAP SİLME: ID YENİDEN KULLANILMIYOR, ARTIK KAYIT DEVRALINMIYOR (CRITICAL) ========
  // Bulgu: owners satırı siliniyordu; id AUTOINCREMENT'siz olduğu için boşalıyor ve sonraki
  // kaydolana veriliyordu. Silmede kopmayan bağlarla birlikte yeni kullanıcı silinen kişinin
  // destek talebini okuyabiliyor ve kaldırılmış ilanını yeniden yayına alabiliyordu.
  const V = await createUser("owner", { name: "Kurban", email: "a8-v@example.com", phone: "+905321250010" });
  const vTicket = await api("POST", "/api/tickets", {
    token: V.token,
    body: { type: "complaint", subject: "Özel şikâyet", description: "ÇOK GİZLİ METİN", createdDate: "2027-01-01" },
  });
  const vListing = await api("POST", "/api/listings", {
    token: V.token, body: { title: "Kurbanın aracı", brand: "Fiat", model: "Egea", price: "300000", status: "active" },
  });
  const vReview = await api("POST", `/api/mechanics/${M.id}/reviews`, { token: V.token, body: { rating: 5, text: "iyiydi" } });
  eq((await api("POST", "/api/auth/delete-account", { token: V.token, body: { currentPassword: V.password } })).status, 200,
    "kurban hesabını sildi");

  const vRow = row("SELECT * FROM owners WHERE id = ?", V.id);
  ok(vRow, "satır id'yi rezerve etmek için duruyor");
  eq(vRow.status, "deleted", "hesap 'deleted'");
  eq(vRow.name, "Silinmiş kullanıcı", "kişi anonimleştirildi");
  eq(row("SELECT description FROM support_tickets WHERE id = ?", vTicket.body.id).description,
    "(kullanıcı hesabını sildi, içerik kaldırıldı)", "destek talebinin METNİ kaldırıldı");
  eq(row("SELECT fromId FROM support_tickets WHERE id = ?", vTicket.body.id).fromId, null, "destek talebinin kişi bağı koptu");
  eq(row("SELECT sellerId FROM listings WHERE id = ?", vListing.body.id).sellerId, null, "ilanın satıcı bağı koptu");
  eq(row("SELECT status FROM listings WHERE id = ?", vListing.body.id).status, "removed", "ilan yayından kaldırıldı");

  // Şimdi yeni bir kullanıcı: id'yi devralmıyor, devralsa bile kayıtları sahiplenemiyor.
  const N = await createUser("owner", { name: "Yeni", email: "a8-n@example.com", phone: "+905321250011" });
  ok(N.id !== V.id, `silinen id (${V.id}) yeni kullanıcıya verilmedi (yeni id ${N.id})`);
  eq((await api("GET", `/api/tickets/${vTicket.body.id}`, { token: N.token })).status, 403,
    "yeni kullanıcı silinen kişinin destek talebini OKUYAMIYOR");
  const unremove = await api("PATCH", `/api/listings/${vListing.body.id}`, { token: N.token, body: { status: "active" } });
  ok(unremove.status === 403 || unremove.status === 401, "yeni kullanıcı kaldırılmış ilanı yayına ALAMIYOR");
  eq(row("SELECT status FROM listings WHERE id = ?", vListing.body.id).status, "removed",
    "ve ilan gerçekten 'removed' kaldı (403 döndü ama bir şey yazılmadı)");
  if (vReview.status === 201) {
    eq(row("SELECT authorId FROM mechanic_reviews WHERE id = ?", vReview.body?.id ?? -1)?.authorId ?? null, null,
      "yorumun yazar bağı koptu (yeni kullanıcı silemez/düzenleyemez)");
  }

  // ===== 3) TAMİRCİ SİLME: AD KOPYALARI DA ANONİMLEŞİYOR (MEDIUM) ==============================
  // Bulgu: mechanics.name anonimleşiyor ama appointments.mechanicName kopyası GERÇEK ADI
  // taşımaya devam ediyordu — owner kolundaki reviewList kopyası için özellikle düzeltilen
  // hatanın aynısı, tamirci kolunda duruyordu.
  const MD = await createUser("mechanic", { name: "Silinecek Usta", email: "a8-md@example.com", phone: "+905321250020" });
  const mdAppt = await api("POST", "/api/appointments", {
    token: A.token, body: { mechanicId: MD.id, ownerId: A.id, vehicleId: veh.body.id, date: "2027-04-01", time: "09:00", service: "Bakım" },
  });
  eq(row("SELECT mechanicName FROM appointments WHERE id = ?", mdAppt.body.id).mechanicName, "Silinecek Usta",
    "randevu tamircinin adının bir KOPYASINI tutuyor");
  eq((await api("POST", "/api/auth/delete-account", { token: MD.token, body: { currentPassword: MD.password } })).status, 200,
    "tamirci hesabını sildi");
  eq(row("SELECT name FROM mechanics WHERE id = ?", MD.id).name, "Silinmiş kullanıcı", "tamirci kaydı anonimleşti");
  eq(row("SELECT mechanicName FROM appointments WHERE id = ?", mdAppt.body.id).mechanicName, "Silinmiş kullanıcı",
    "RANDEVUDAKİ AD KOPYASI da anonimleşti (anonimleştirme kâğıt üzerinde kalmıyor)");

  // ===== 4) GİRİŞ: BAŞARILI GİRİŞ DE SAYILIYOR (HIGH) ==========================================
  // Bulgu: sınırlayıcı yalnızca başarısız denemeleri sayıyor ve başarıda sıfırlıyordu; geçerli
  // şifresi olan biri /login'i sınırsız çağırıp (ölçüldü: 40/40 başarılı) paylaşılan posta
  // kuyruğunu ve pendingLogins map'ini doldurarak HERKESİN girişini bozabiliyordu.
  // NOT: bu takımda sınır 500'e ayarlı (harness), bu yüzden burada SAYIMIN YAPILDIĞINI
  // doğruluyoruz; sınırın devreye girmesi ayrı, düşük sınırlı takımda ölçülüyor (aşağıdaki not).
  const src = (await import("node:fs")).readFileSync(new URL("../../backend/routes/auth.js", import.meta.url), "utf8");
  // stripComments İLK, dilimleme SONRA: aksi halde indeksler ham metne, dilim temizlenmiş metne
  // ait olur ve tamamen yanlış bir parça okunur. (Yorumları atlamak zorunlu — "bu satır KALDIRILDI"
  // diyen gerekçe, kaldırılan satırı alıntılamak durumunda; bkz. tests/_harness.mjs.)
  const code = stripComments(src);
  const loginBody = code.slice(code.indexOf('authRouter.post("/login"'), code.indexOf('authRouter.post("/verify-otp"'));
  ok(loginBody.length > 200, "giriş uç noktasının gövdesi bulundu (dilimleme doğru)");
  ok(!/loginLimiter\.reset\(ip\)/.test(loginBody), "başarılı girişte sayaç SIFIRLANMIYOR");
  ok((loginBody.match(/loginLimiter\.registerFailure\(ip\)/g) || []).length >= 2,
    "başarılı giriş de sayaca yazılıyor (yalnızca başarısızlar değil)");
  // Silinmiş hesapla giriş: davranışsal kontrol.
  eq((await api("POST", "/api/auth/login", { body: { email: "a8-v@example.com", password: V.password } })).status, 401,
    "silinmiş hesaba giriş yapılamıyor");

  // ===== 5) KAYIT: ÇAPRAZ ROL E-POSTA ÇAKIŞMASI (HIGH) =========================================
  // Bulgu: register yalnızca seçilen rolün tablosunu kontrol ediyordu; change-email İKİ tabloyu
  // kontrol ediyor. Aynı değişmez iki uçta farklı korunuyordu.
  eq((await api("POST", "/api/auth/register", { body: { role: "mechanic", email: "a8-a@example.com", name: "Sahte" } })).status, 409,
    "bir OWNER'ın e-postasıyla MECHANIC hesabı açılamıyor");
  eq((await api("POST", "/api/auth/register", { body: { role: "owner", email: "a8-m@example.com", name: "Sahte" } })).status, 409,
    "bir MECHANIC'in e-postasıyla OWNER hesabı açılamıyor");
  eq(rows("SELECT id FROM mechanics WHERE lower(email) = 'a8-a@example.com'").length, 0, "ve kayıt gerçekten oluşmadı");

  // ===== 6) PROFİL GÖRÜNTÜLENME: DÖNÜŞÜM DAMGASI IDOR DEĞİL (MEDIUM) ===========================
  // Bulgu: /:id/convert kimliksiz, sahiplik kontrolsüz ve id ardışık tamsayıydı.
  const view = await api("POST", "/api/profile-views", { body: { targetType: "mechanic", targetId: M.id } });
  eq(view.status, 201, "görüntülenme kaydedildi (girişsiz ziyaretçi de sayılmalı)");
  ok(view.body.convertToken, "kaydeden istemciye tek kullanımlık jeton verildi");
  eq((await api("POST", `/api/profile-views/${view.body.id}/convert`, { body: {} })).status, 403,
    "jeton OLMADAN dönüşüm damgalanamıyor");
  eq((await api("POST", `/api/profile-views/${view.body.id}/convert`, { body: { convertToken: "yanlis" } })).status, 403,
    "YANLIŞ jetonla damgalanamıyor");
  eq(Number(row("SELECT converted FROM profile_views WHERE id = ?", view.body.id).converted), 0,
    "iki reddedilen istekten sonra veritabanı DEĞİŞMEDİ");
  eq((await api("POST", `/api/profile-views/${view.body.id}/convert`, { body: { convertToken: view.body.convertToken } })).status, 200,
    "doğru jetonla damgalanıyor");
  eq(Number(row("SELECT converted FROM profile_views WHERE id = ?", view.body.id).converted), 1, "damga yazıldı");
  const twice = await api("POST", `/api/profile-views/${view.body.id}/convert`, { body: { convertToken: view.body.convertToken } });
  eq(twice.body.alreadyConverted, true, "aynı görüntülenme İKİ KEZ dönüşüm sayılmıyor");
  eq((await api("POST", "/api/profile-views", { body: { targetType: "uydurma", targetId: 1 } })).status, 400,
    "uydurma targetType reddediliyor");

  // ===== 7) PROFİL İSTATİSTİĞİ SAHİBİNE AİT (MEDIUM) ===========================================
  // Bulgu: toplu (parametresiz) yol admin'e kapatılmıştı ama hedef bazlı yol ve /stats/bulk
  // (tek istekte 200 hedef) kimliksiz açıktı — yani düzeltme fiilen geri alınmış oluyordu.
  eq((await api("GET", `/api/profile-views/stats?targetType=mechanic&targetId=${M.id}`, {})).status, 403,
    "girişsiz başka bir tamircinin istatistiğini okuyamıyor");
  eq((await api("GET", `/api/profile-views/stats?targetType=mechanic&targetId=${M.id}`, { token: M2.token })).status, 403,
    "RAKİP tamirci okuyamıyor");
  eq((await api("GET", `/api/profile-views/stats?targetType=mechanic&targetId=${M.id}`, { token: M.token })).status, 200,
    "tamirci KENDİ istatistiğini okuyabiliyor");
  eq((await api("GET", `/api/profile-views/stats?targetType=mechanic&targetId=${M.id}`, { token: admin })).status, 200,
    "yönetici okuyabiliyor");
  const bulkForeign = await api("GET", `/api/profile-views/stats/bulk?targetType=mechanic&targetIds=${M.id},${M2.id}`, { token: M.token });
  eq(bulkForeign.status, 403, "bulk: yetkisiz id VARSA istek tamamen reddediliyor (sessiz filtre yok)");
  ok(Array.isArray(bulkForeign.body.targetIds) && bulkForeign.body.targetIds.includes(String(M2.id)),
    "hangi id'lerin yetkisiz olduğu söyleniyor");
  eq((await api("GET", `/api/profile-views/stats/bulk?targetType=mechanic&targetIds=${M.id}`, { token: M.token })).status, 200,
    "bulk: kendi id'leriyle çalışıyor");

  // ===== 8) PAYLAŞIM OLAYI: ATIF SAHTECİLİĞİ ve SQL SIZINTISI (LOW) ============================
  const rc = `a8-ref-${Date.now()}`;
  const sh = await api("POST", "/api/share-events", { body: { targetType: "mechanic", targetId: M.id, channel: "wa", refCode: rc, sharedBy: `owner:${B.id}` } });
  eq(sh.status, 201, "girişsiz paylaşım kaydedilebiliyor (analitik)");
  eq(row("SELECT sharedBy FROM share_events WHERE refCode = ?", rc).sharedBy, null,
    "ama sharedBy İSTEMCİDEN alınmıyor — girişsiz paylaşım anonim (atıf sahteciliği yok)");
  const rc2 = `a8-ref2-${Date.now()}`;
  await api("POST", "/api/share-events", { token: A.token, body: { targetType: "mechanic", targetId: M.id, channel: "wa", refCode: rc2, sharedBy: `owner:${B.id}` } });
  eq(row("SELECT sharedBy FROM share_events WHERE refCode = ?", rc2).sharedBy, `owner:${A.id}`,
    "girişliyken atıf OTURUMDAN yazılıyor (gövdedeki yalan yok sayılıyor)");
  const dup = await api("POST", "/api/share-events", { body: { targetType: "mechanic", targetId: M.id, channel: "wa", refCode: rc } });
  ok(!/UNIQUE|constraint|share_events|SQLITE/i.test(String(dup.body?.error || "")),
    "çakışma hatası HAM SQL METNİNİ sızdırmıyor");

  // ===== 9) ANALİTİK OLAYI: ROL BEYAN EDİLEMİYOR (MEDIUM) ======================================
  // Bulgu: role alanı istemciden geliyordu; kimliksiz bir betik kendini "mechanic" ilan edip
  // yönetici panelinin tüm rol kırılımını uydurabiliyordu.
  const before = row("SELECT COUNT(*) n FROM analytics_events").n;
  await api("POST", "/api/analytics/events", { body: { events: [{ name: "mechanic_view", visitorId: "v1", targetType: "mechanic", targetId: M.id, role: "mechanic" }] } });
  eq(row("SELECT role FROM analytics_events ORDER BY id DESC LIMIT 1").role, "guest",
    "girişsiz olayın rolü 'guest' (istemcinin 'mechanic' beyanı yok sayıldı)");
  await api("POST", "/api/analytics/events", { token: M.token, body: { events: [{ name: "mechanic_view", visitorId: "v2", role: "owner" }] } });
  eq(row("SELECT role FROM analytics_events ORDER BY id DESC LIMIT 1").role, "mechanic",
    "girişli olayın rolü OTURUMDAN yazılıyor ('owner' beyanı yok sayıldı)");
  ok(row("SELECT COUNT(*) n FROM analytics_events").n > before, "olaylar yine de kaydediliyor (özellik çalışıyor)");

  // ===== 10) CRUD DELETE: KISIT HATASI 500 DEĞİL (MEDIUM) ======================================
  const W = await createUser("owner", { name: "Araçlı", email: "a8-w@example.com", phone: "+905321250030" });
  await api("POST", "/api/vehicles", { token: W.token, body: { brand: "BMW", model: "320i", plate: "34BB002" } });
  const delW = await api("DELETE", `/api/owners/${W.id}`, { token: W.token });
  eq(delW.status, 409, "bağlı kaydı olan silme isteği 409 (500 DEĞİL)");
  ok(!/Internal server error/i.test(String(delW.body?.error || "")), "kullanıcı hatası sunucu hatası gibi görünmüyor");
  ok(/hesap silme/i.test(String(delW.body?.error || "")), "mesaj doğru yolu söylüyor");
  ok(row("SELECT id FROM owners WHERE id = ?", W.id), "reddedilen silmeden sonra kayıt duruyor");

  // ===== 11) FAVORİ SAYACI: EŞLEŞME SIZMIYOR (önceki denetimin "kabul edilen riski") ===========
  await api("PATCH", `/api/owners/${A.id}`, { token: A.token, body: { favoriteIds: [vListing.body.id] } });
  const ownersList = await api("GET", "/api/owners", { token: B.token });
  const aInList = (Array.isArray(ownersList.body) ? ownersList.body : []).find((o) => o.id === A.id);
  ok(aInList, "owners listesi hâlâ çalışıyor (misafir açılışı kırılmadı)");
  ok(!("favoriteIds" in aInList), "başka kullanıcının favori İLAN LİSTESİ artık sızmıyor");
  for (const f of ["email", "phone", "address", "savedSearches", "favoriteMechanicIds", "likedReviewIds"]) {
    ok(!(f in aInList), `${f} de listede yok`);
  }
  const selfRead = await api("GET", `/api/owners/${A.id}`, { token: A.token });
  ok(Array.isArray(selfRead.body.favoriteIds) && selfRead.body.favoriteIds.includes(vListing.body.id),
    "kullanıcı KENDİ favorilerini görmeye devam ediyor");
  const counts = await api("GET", "/api/listings/favorite-counts", {});
  eq(counts.status, 200, "favori sayacı ucu çalışıyor");
  eq(counts.body[String(vListing.body.id)], 1, "sayaç DOĞRU (özellik korunuyor, eşleşme gizli)");
  // Sayaç ucu kişi bilgisi döndürmüyor — sadece sayı.
  ok(Object.values(counts.body).every((v) => typeof v === "number"), "sayaç yanıtı yalnızca sayı içeriyor");

  // ===== 12) ÇEVİRİ ÖNBELLEĞİ: ÇAPRAZ KULLANICI ORACLE'I KAPALI (MEDIUM) =======================
  // Bulgu: önbellek isabeti `cached:true` ile bildiriliyordu; önbellek sahipsiz olduğu için
  // "bu cümle bu sitede yazıldı mı" sorusu kimliksiz cevaplanabiliyordu.
  const secret = `gizli randevu notu ${Date.now()}`;
  db().prepare(`INSERT OR IGNORE INTO translation_cache (fromLang,toLang,sourceText,translatedText) VALUES ('tr','en',?,?)`)
    .run(secret, "secret appointment note");
  /**
   * BU KONTROL GENİŞLEDİ (kalan-riskler turunda): o zaman önbellek HER metni tutuyordu ve tek
   * düzeltme `cached` bayrağını kaldırmaktı. Artık kapsam ayrımı var — paylaşılan önbellek
   * yalnızca HERKESE AÇIK metni tutuyor. Yani iki ayrı şeyi doğrulamamız gerekiyor:
   *   (a) bayrak hâlâ yok (oracle sinyali kapalı),
   *   (b) ÖZEL kapsamda önbellekten hiç okunmuyor — yani oracle'ın kendisi de kapalı,
   *   (c) HERKESE AÇIK kapsamda önbellek çalışmaya devam ediyor (özellik bozulmadı).
   */
  const hit = await api("POST", "/api/translate", { body: { text: secret, from: "tr", to: "en", scope: "public" } });
  ok(!("cached" in (hit.body || {})), "önbellek isabeti istemciye BİLDİRİLMİYOR");
  eq(hit.body.translatedText, "secret appointment note", "HERKESE AÇIK kapsamda önbellek çalışıyor");
  const asPrivate = await api("POST", "/api/translate", { body: { text: secret, from: "tr", to: "en" } });
  ok(asPrivate.body.translatedText !== "secret appointment note",
    "ÖZEL kapsamda önbellekten OKUNMUYOR (oracle tamamen kapalı)");
  const batch = await api("POST", "/api/translate/batch", { body: { to: "en", items: [{ id: "x", text: secret, from: "tr", scope: "public" }] } });
  ok(!("cached" in (batch.body || {})), "toplu uçta da bayrak yok");
  eq(batch.body.results.x, "secret appointment note", "toplu uçta herkese açık önbellek çalışıyor");
  const batchPriv = await api("POST", "/api/translate/batch", { body: { to: "en", items: [{ id: "y", text: secret, from: "tr" }] } });
  ok(batchPriv.body.results.y !== "secret appointment note", "toplu uçta ÖZEL kapsam önbellekten okumuyor");

  report("uçtan uca ikinci denetim");
} finally {
  stopServer();
}
