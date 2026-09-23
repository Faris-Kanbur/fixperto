/**
 * UÇTAN UCA — TAM UYGULAMA DENETİMİNİN REGRESYON TESTLERİ.
 * ================================================================================================
 * Bu takım, bağımsız bir denetimde BULUNAN ve DÜZELTİLEN 22 bulgunun geri gelmediğini doğruluyor.
 * Keşif aracı ayrı bir dosyada (tests/e2e/audit-probe.mjs — raporlar, iddia etmez); burası o
 * bulguların kalıcı koruması.
 *
 * YÖNTEM: her kontrol, ön yüzü hiç kullanmadan doğrudan HTTP ile saldırıyor ve sonucu
 * VERİTABANINDAN doğruluyor. Yanıt kodunu okumak yetmez — sunucu 200 dönüp alanı yok saymış
 * olabilir; tek güvenilir kanıt satırın kendisi. Aynı şekilde 403 dönmesi de yetmez: değerin
 * gerçekten yazılmadığını görmek gerekiyor.
 *
 * SIRALAMA: her bölüm "saldırı engellendi mi" ve "MEŞRU İŞ HÂLÂ ÇALIŞIYOR mu" sorularını BİRLİKTE
 * soruyor. Bir güvenlik kuralı meşru işi bozuyorsa o bir düzeltme değil, yeni bir hatadır —
 * bu denetimde tam olarak bu sınıftan iki regresyon üretip düzelttim (teklif "görüldü" akışı ve
 * randevu oluşturmada bilinmeyen sütun).
 */
import { startServer, stopServer, api, row, rows, db, createUser, adminToken, skipIfUnsupported } from "./harness.mjs";

if (skipIfUnsupported("e2e denetim regresyonu")) process.exit(0);

let passed = 0;
const failures = [];
const ok = (v, name) => { if (v) passed++; else failures.push(name); };
const eq = (got, want, name) => ok(String(got) === String(want), `${name} (beklenen: ${want}, gelen: ${got})`);

try {
  await startServer();
  const admin = await adminToken();
  const owner = await createUser("owner", { name: "Reg Sahip", email: "reg.owner@test.local", phone: "+905321110001" });
  const owner2 = await createUser("owner", { name: "Reg Sahip 2", email: "reg.owner2@test.local", phone: "+905321110002" });
  const mech = await createUser("mechanic", { name: "Reg Tamirci", email: "reg.mech@test.local", phone: "+905321110003" });
  const mech2 = await createUser("mechanic", { name: "Reg Tamirci 2", email: "reg.mech2@test.local", phone: "+905321110004" });

  // ============================================================ 1) GİZLİLİK: MÜŞTERİ LİSTESİ
  /**
   * BULGU (KRİTİK): `GET /api/owners` OTURUMSUZ 200 dönüyor ve her müşterinin AD, E-POSTA,
   * TELEFON, ADRESİNİ içeriyordu — tek istekle çekilebilen bir müşteri listesi.
   * İlginç ayrıntı: tekil kayıt (`/api/owners/1`) DOĞRU biçimde 404 veriyordu. Kapı kilitli,
   * pencere açıktı.
   */
  {
    const anon = await api("GET", "/api/owners");
    eq(anon.status, 200, "owners listesi hâlâ okunabiliyor (ön yüz açılışta çekiyor)");
    const first = Array.isArray(anon.body) ? anon.body[0] : null;
    ok(!!first, "listede kayıt var");
    for (const f of ["email", "phone", "address", "password", "signupIpHash", "savedSearches", "likedReviewIds"]) {
      eq(f in (first || {}), false, `OTURUMSUZ owners listesinde "${f}" YOK`);
    }
    // Meşru iş bozulmadı: ilandaki satıcı adı/şehri ve sohbetteki karşı tarafın dili için gerekli.
    for (const f of ["id", "name", "city", "lang"]) {
      eq(f in (first || {}), true, `owners listesinde "${f}" KORUNDU (ön yüz kullanıyor)`);
    }
    // Kullanıcı KENDİ kaydını tam görüyor.
    const self = await api("GET", `/api/owners/${owner.id}`, { token: owner.token });
    eq(self.status, 200, "kullanıcı kendi kaydını okuyabiliyor");
    eq(self.body?.email, "reg.owner@test.local", "kullanıcı kendi e-postasını görüyor");
    // Yönetici tam listeyi görüyor (kullanıcı dizini bozulmasın).
    const adminList = await api("GET", "/api/owners", { token: admin });
    const af = Array.isArray(adminList.body) ? adminList.body.find((o) => o.id === owner.id) : null;
    eq(af?.email, "reg.owner@test.local", "YÖNETİCİ listede e-postayı görüyor");
    // Tamirci listesinde de e-posta yok, ama TELEFON var (müşteri arayacak — kasıtlı).
    const mechs = await api("GET", "/api/mechanics");
    const mf = Array.isArray(mechs.body) ? mechs.body[0] : null;
    eq("email" in (mf || {}), false, "OTURUMSUZ tamirci listesinde e-posta YOK");
    eq("iban" in (mf || {}), false, "tamirci listesinde IBAN YOK");
  }

  // ============================================================ 2) İLAN: MODERASYON VE ÖNE ÇIKARMA
  {
    const lst = await api("POST", "/api/listings", {
      token: owner.token,
      body: { brand: "VW", model: "Golf", year: 2019, km: 50000, price: 300000, sellerType: "owner", status: "active" },
    });
    eq(lst.status, 201, "ilan oluşturuldu");
    const id = lst.body.id;

    /**
     * BULGU (KRİTİK): satıcı `adminRemoved: 0` yazarak yöneticinin KALDIRDIĞI ilanı geri
     * açabiliyordu — moderasyon kararını, kararın muhatabı iptal ediyordu.
     */
    db().prepare(`UPDATE listings SET adminRemoved = 1 WHERE id = ?`).run(id);
    await api("PATCH", `/api/listings/${id}`, { token: owner.token, body: { adminRemoved: 0 } });
    eq(row(`SELECT adminRemoved AS v FROM listings WHERE id = ?`, id).v, 1,
      "SATICI yöneticinin kaldırma kararını geri ALAMIYOR");
    // Yönetici geri açabiliyor (meşru yol).
    await api("PATCH", `/api/listings/${id}`, { token: admin, body: { adminRemoved: 0 } });
    eq(row(`SELECT adminRemoved AS v FROM listings WHERE id = ?`, id).v, 0, "YÖNETİCİ geri açabiliyor");

    /**
     * BULGU (YÜKSEK): `featured` jenerik PATCH'ten yazılabiliyordu — 49₺'lik öne çıkarma
     * bedavaya ve SÜRESİZ açılıyordu. Ayrıca arayüz "7 gün" diyordu ama süreyi takip eden
     * hiçbir şey yoktu.
     */
    await api("PATCH", `/api/listings/${id}`, { token: owner.token, body: { featured: 1 } });
    eq(row(`SELECT featured AS v FROM listings WHERE id = ?`, id).v, 0,
      "featured jenerik PATCH'ten YAZILAMIYOR");
    const feat = await api("POST", `/api/listings/${id}/feature`, { token: owner.token });
    eq(feat.status, 200, "sahibi özel uçtan öne çıkarabiliyor (meşru yol çalışıyor)");
    const fr = row(`SELECT featured, featuredUntil FROM listings WHERE id = ?`, id);
    eq(fr.featured, 1, "öne çıkarma açıldı");
    ok(!!fr.featuredUntil && new Date(fr.featuredUntil) > new Date(), `SÜRE yazıldı (${fr.featuredUntil})`);
    // Başkası öne çıkaramıyor.
    eq((await api("POST", `/api/listings/${id}/feature`, { token: owner2.token })).status, 403,
      "BAŞKASININ ilanı öne çıkarılamıyor");
    eq((await api("POST", `/api/listings/${id}/feature`)).status, 401, "oturumsuz öne çıkarılamıyor");

    /**
     * BULGU (YÜKSEK): satıcı `offers` dizisinin tamamını yeniden yazabiliyordu — uydurma teklif
     * ("ilgi var" izlenimi) ya da gelen teklifleri silme. Meşru iki işlem özel uçlara taşındı.
     */
    const off = await api("POST", `/api/listings/${id}/offers`, { token: owner2.token, body: { amount: "280000" } });
    eq(off.status, 201, "alıcı teklif verebiliyor");
    const offerId = JSON.parse(row(`SELECT offers FROM listings WHERE id = ?`, id).offers)[0].id;
    await api("PATCH", `/api/listings/${id}`, { token: owner.token, body: { offers: [{ id: 99, buyerName: "Hayalet", amount: "1" }] } });
    const offersNow = JSON.parse(row(`SELECT offers FROM listings WHERE id = ?`, id).offers);
    eq(offersNow.some((o) => o.buyerName === "Hayalet"), false, "SATICI uydurma teklif YAZAMIYOR");
    eq(offersNow.length, 1, "gelen teklif SİLİNEMEDİ");
    // Meşru: görüldü + yanıt.
    eq((await api("POST", `/api/listings/${id}/offers/seen`, { token: owner.token })).status, 200, "satıcı 'görüldü' işaretleyebiliyor");
    eq(JSON.parse(row(`SELECT offers FROM listings WHERE id = ?`, id).offers)[0].seen, 1 === 1 ? true : false, "görüldü yazıldı");
    // ALICI kendi teklifini kabul edemez (anlaşma uydurma).
    eq((await api("POST", `/api/listings/${id}/offers/${offerId}/respond`, { token: owner2.token, body: { status: "accepted" } })).status, 403,
      "ALICI kendi teklifini kabul EDEMİYOR");
    eq((await api("POST", `/api/listings/${id}/offers/${offerId}/respond`, { token: mech.token, body: { status: "accepted" } })).status, 403,
      "ilgisiz kullanıcı teklifi yanıtlayamıyor");
    // Satıcı yanıt verirken TUTARI değiştiremez.
    const amtBefore = JSON.parse(row(`SELECT offers FROM listings WHERE id = ?`, id).offers)[0].amount;
    await api("POST", `/api/listings/${id}/offers/${offerId}/respond`, { token: owner.token, body: { status: "rejected", amount: "1" } });
    eq(JSON.parse(row(`SELECT offers FROM listings WHERE id = ?`, id).offers)[0].amount, amtBefore,
      "satıcı yanıt verirken teklif TUTARINI değiştiremiyor");
    eq(JSON.parse(row(`SELECT offers FROM listings WHERE id = ?`, id).offers)[0].status, "rejected", "ret kaydedildi");
    // İkinci yanıt engelli.
    eq((await api("POST", `/api/listings/${id}/offers/${offerId}/respond`, { token: owner.token, body: { status: "accepted" } })).status, 409,
      "reddedilmiş teklif sonradan kabul edilemiyor");
  }

  // ============================================================ 3) İŞ İLANI: BAŞVURULAR
  /**
   * BULGU (YÜKSEK): `ADMIN_ONLY_FIELDS` içinde `job_listings` anahtarı İKİ KEZ tanımlıydı;
   * JavaScript ikinciyi geçerli sayıp `["applicants"]` korumasını SESSİZCE yok etti. Yani
   * yazılmış, yorumla gerekçelendirilmiş bir güvenlik kontrolü bir yazım hatasıyla ölmüştü.
   */
  {
    const job = await api("POST", "/api/jobs", { token: mech.token, body: { title: "Usta aranıyor", description: "d", salaryMin: 30000 } });
    eq(job.status, 201, "iş ilanı oluşturuldu");
    await api("PATCH", `/api/jobs/${job.body.id}`, { token: mech.token, body: { applicants: [{ id: 1, name: "Uydurma Aday" }] } });
    eq(String(row(`SELECT applicants AS v FROM job_listings WHERE id = ?`, job.body.id).v || "").includes("Uydurma"), false,
      "TAMİRCİ başvuru listesini uyduramıyor/silemiyor");
    await api("PATCH", `/api/jobs/${job.body.id}`, { token: mech.token, body: { shareCount: 5000 } });
    ok(row(`SELECT shareCount AS v FROM job_listings WHERE id = ?`, job.body.id).v !== 5000,
      "shareCount koruması da hâlâ yerinde (iki liste birleştirildi, biri diğerini ezmiyor)");
    /**
     * BULGU (YÜKSEK, işlevsel — kimse bildirmemişti): İŞ BAŞVURUSU ÖZELLİĞİ TAMAMEN ÖLÜYDÜ.
     * Sunucu `job.status !== "open"` diye bakıyordu ama iş ilanı sözlüğünde "open" yok:
     * veritabanı varsayılanı, ön yüzün gönderdiği değer, tohum verisi ve tip tanımı hepsi
     * "active". Yani her ilan doğduğu anda "başvuru almıyor" sayılıyordu ve aday YANILTICI bir
     * mesaj görüyordu ("bu ilan artık başvuru almıyor") — ilanın kapandığını sanıyordu.
     */
    const apply = await api("POST", `/api/jobs/${job.body.id}/applications`, {
      token: owner.token, body: { name: "Aday", email: "aday@test.local", phone: "+905321110009", message: "m" },
    });
    eq(apply.status, 201, "başvuru meşru uçtan yapılabiliyor");
    const stored = JSON.parse(row(`SELECT applicants AS v FROM job_listings WHERE id = ?`, job.body.id).v || "[]");
    eq(stored[0]?.applicantId, owner.id, "başvuranın kimliği OTURUMDAN yazıldı (e-posta eşlemesine gerek yok)");
    eq(stored[0]?.applicantType, "owner", "başvuranın rolü de oturumdan");
    // Düzeltme FAZLA GEVŞEK DEĞİL: ilan gerçekten kapatıldığında başvuru engelleniyor.
    await api("PATCH", `/api/jobs/${job.body.id}`, { token: mech.token, body: { status: "closed" } });
    const afterClose = await api("POST", `/api/jobs/${job.body.id}/applications`, {
      token: owner2.token, body: { name: "Geç Aday", email: "gec@test.local", phone: "+905321110010" },
    });
    eq(afterClose.status, 400, "KAPATILMIŞ ilana başvuru engelli");
    eq(afterClose.body?.reason, "closed", "sebep makine-okunur biçimde bildiriliyor");
    await api("PATCH", `/api/jobs/${job.body.id}`, { token: mech.token, body: { status: "active" } });
    // Tamirci de düzenleyemiyor (yukarıda denendi), ama ilanın BAŞLIĞINI değiştirebiliyor.
    const titleEdit = await api("PATCH", `/api/jobs/${job.body.id}`, { token: mech.token, body: { title: "Usta aranıyor (güncel)" } });
    eq(titleEdit.status, 200, "tamirci kendi ilanının başlığını düzenleyebiliyor (meşru iş)");
  }

  // ============================================================ 4) DESTEK TALEPLERİ
  /**
   * BULGU (ORTA): talebi AÇAN kişi `adminReplies` yazabiliyor ("Paranız iade edildi" diye
   * yönetici yanıtı uydurma), `refunded: 1` işaretleyebiliyor ve talebi "resolved" yapabiliyordu.
   * Bunlar destek EKİBİNİN kararları.
   */
  {
    const tk = await api("POST", "/api/tickets", { token: owner.token, body: { type: "payment", subject: "Kapora", message: "m", status: "open" } });
    eq(tk.status, 201, "destek talebi oluşturuldu");
    const id = tk.body.id;
    await api("PATCH", `/api/tickets/${id}`, { token: owner.token, body: { adminReplies: [{ by: "admin", text: "iade edildi" }] } });
    eq(String(row(`SELECT adminReplies AS v FROM support_tickets WHERE id = ?`, id).v || "").includes("iade edildi"), false,
      "KULLANICI yönetici yanıtı uyduramıyor");
    await api("PATCH", `/api/tickets/${id}`, { token: owner.token, body: { refunded: 1 } });
    ok(row(`SELECT refunded AS v FROM support_tickets WHERE id = ?`, id).v !== 1, "KULLANICI 'iade edildi' bayrağını yazamıyor");
    await api("PATCH", `/api/tickets/${id}`, { token: owner.token, body: { status: "resolved" } });
    ok(row(`SELECT status AS v FROM support_tickets WHERE id = ?`, id).v !== "resolved", "KULLANICI talebini 'çözüldü' yapamıyor");
    // Meşru: kullanıcı konuyu düzeltebiliyor, yönetici durumu değiştirebiliyor.
    eq((await api("PATCH", `/api/tickets/${id}`, { token: owner.token, body: { subject: "Kapora (düzeltme)" } })).status, 200,
      "kullanıcı kendi talebinin konusunu düzeltebiliyor");
    await api("PATCH", `/api/tickets/${id}`, { token: admin, body: { status: "resolved" } });
    eq(row(`SELECT status AS v FROM support_tickets WHERE id = ?`, id).v, "resolved", "YÖNETİCİ talebi çözüldü yapabiliyor");
  }

  // ============================================================ 5) RANDEVU: ALAN VE DURUM
  {
    const appt = await api("POST", "/api/appointments", {
      token: owner.token,
      body: { mechanicId: mech.id, vehicle: "VW Golf", date: "1 Mart", time: "10:00", issue: "Fren",
              // İstemcinin dayatmaya çalıştığı değerler — hepsi yok sayılmalı.
              status: "Tamamlandı", autoAccepted: 1, depositPaid: 5000, servicePrice: 1, noShow: 1,
              mechanicName: "Sahte Tamirci", ownerId: owner2.id },
    });
    eq(appt.status, 201, "randevu oluşturuldu");
    const id = appt.body.id;
    const r0 = row(`SELECT ownerId, status, depositPaid, noShow, mechanicName FROM appointments WHERE id = ?`, id);
    eq(r0.ownerId, owner.id, "ownerId OTURUMDAN yazıldı (istemcinin gönderdiği yok sayıldı)");
    ok(r0.status !== "Tamamlandı", `durum istemciden GELMEDİ, sunucu belirledi (${r0.status})`);
    eq(r0.depositPaid, 0, "MÜŞTERİ oluşturmada kapora yazamıyor");
    eq(r0.noShow, 0, "MÜŞTERİ oluşturmada 'gelmedi' yazamıyor");
    eq(r0.mechanicName, "Reg Tamirci", "tamirci adı SUNUCUDAN (istemcinin gönderdiği sahte ad yok sayıldı)");

    /**
     * BULGU (YÜKSEK, 9 alan): müşteri kendi randevusunda karşı tarafın kararlarını yazabiliyordu.
     * Hepsi tek tek deneniyor; her biri için 403 VE değerin değişmediği doğrulanıyor.
     */
    const forbid = async (field, value, label) => {
      const before = row(`SELECT ${field} AS v FROM appointments WHERE id = ?`, id).v;
      const res = await api("PATCH", `/api/appointments/${id}`, { token: owner.token, body: { [field]: value } });
      const after = row(`SELECT ${field} AS v FROM appointments WHERE id = ?`, id).v;
      ok(res.status === 403, `MÜŞTERİ ${field} yazmaya çalışınca 403 (${label}) — gelen ${res.status}`);
      eq(after, before, `${field} değeri DEĞİŞMEDİ`);
    };
    await forbid("servicePrice", 1, "hizmet bedelini kendi belirlemesi");
    await forbid("depositPaid", 99999, "ödenmemiş kaporayı ödenmiş göstermesi");
    await forbid("depositRefunded", 1, "yapılmamış iadeyi yapılmış göstermesi");
    await forbid("noShow", 1, "tamirciyi 'gelmedi' işaretlemesi");
    await forbid("autoAccepted", 1, "onayı atlamış göstermesi");
    await forbid("warrantyEndDate", "2099-01-01", "verilmemiş garantiyi uydurması");
    await forbid("mechanicName", "Başka Tamirci", "kaydın tamircisini değiştirmesi");
    await forbid("ownerId", owner2.id, "randevuyu başkasına devretmesi");
    await forbid("mechanicId", mech2.id, "randevuyu başka tamirciye atamasi");

    /**
     * DURUM MAKİNESİ: müşteri "Tamamlandı" yapamaz. Bu, DOĞRULANMIŞ SERVİS GEÇMİŞİNİN ön koşulu
     * olduğu için araç satarken güven uydurma zincirinin ilk halkası.
     */
    const toDone = await api("PATCH", `/api/appointments/${id}`, { token: owner.token, body: { status: "Tamir Tamamlandı" } });
    eq(toDone.status, 409, "MÜŞTERİ randevusunu 'Tamamlandı' yapamıyor");
    ok(row(`SELECT status AS v FROM appointments WHERE id = ?`, id).v !== "Tamir Tamamlandı", "durum değişmedi");
    for (const bad of ["Gelmedi", "Reddedildi"]) {
      const r = await api("PATCH", `/api/appointments/${id}`, { token: owner.token, body: { status: bad } });
      eq(r.status, 409, `MÜŞTERİ '${bad}' yapamıyor`);
    }
    eq((await api("PATCH", `/api/appointments/${id}`, { token: owner.token, body: { status: "Uydurma Durum" } })).status, 400,
      "tanımsız durum değeri reddediliyor");

    // MEŞRU İŞ: müşteri iptal edebiliyor, açıklamasını düzeltebiliyor.
    eq((await api("PATCH", `/api/appointments/${id}`, { token: owner.token, body: { issue: "Fren + yağ" } })).status, 200,
      "müşteri arıza açıklamasını düzeltebiliyor");
    // MEŞRU İŞ: tamirci tamamlayabiliyor, bedel ve garanti yazabiliyor.
    const byMech = await api("PATCH", `/api/appointments/${id}`, { token: mech.token, body: { servicePrice: 1500, warrantyEndDate: "2026-12-31" } });
    eq(byMech.status, 200, "TAMİRCİ bedel ve garanti yazabiliyor (kendi kararı)");
    eq(row(`SELECT servicePrice AS v FROM appointments WHERE id = ?`, id).v, 1500, "bedel kaydedildi");
    eq((await api("PATCH", `/api/appointments/${id}`, { token: mech.token, body: { status: "Tamir Tamamlandı" } })).status, 200,
      "TAMİRCİ randevuyu tamamlayabiliyor");
    // Tamirci de müşterinin alanını yazamıyor.
    eq((await api("PATCH", `/api/appointments/${id}`, { token: mech.token, body: { historyShareConsent: 0 } })).status, 403,
      "TAMİRCİ müşterinin paylaşım iznini değiştiremiyor");
    // Yorum işareti geri alınamıyor (tekrar tekrar yorum yolu kapalı).
    db().prepare(`UPDATE appointments SET reviewed = 1 WHERE id = ?`).run(id);
    eq((await api("PATCH", `/api/appointments/${id}`, { token: owner.token, body: { reviewed: false } })).status, 400,
      "yorum işareti GERİ ALINAMIYOR");
  }

  // ============================================================ 6) SLOT KİLİDİ (YARIŞ KOŞULU)
  /**
   * BULGU (YÜKSEK): aynı tamirciye aynı tarih+saat için 10 EŞZAMANLI istek 10 kayıt üretti.
   * Slot kontrolü yalnızca istemcideydi ve istemci kontrolü kontrol değildir.
   */
  {
    const payload = { mechanicId: mech2.id, vehicle: "V", date: "5 Mart", time: "09:00", issue: "yarış" };
    const res = await Promise.all(Array.from({ length: 10 }, () => api("POST", "/api/appointments", { token: owner.token, body: payload })));
    const created = res.filter((r) => r.status === 201).length;
    const conflicts = res.filter((r) => r.status === 409).length;
    const inDb = rows(`SELECT id FROM appointments WHERE mechanicId = ? AND date = '5 Mart' AND time = '09:00'`, mech2.id).length;
    eq(created, 1, "10 eşzamanlı istekten TAM BİRİ kabul edildi");
    eq(conflicts, 9, "diğer dokuzu 409 (saat dolu)");
    eq(inDb, 1, "veritabanında TEK kayıt");
    // İPTAL EDİLEN randevu slotu serbest bırakıyor — aksi halde bir kez iptal edilen saat
    // sonsuza kadar kapanırdı.
    const first = rows(`SELECT id FROM appointments WHERE mechanicId = ? AND date = '5 Mart' AND time = '09:00'`, mech2.id)[0].id;
    await api("PATCH", `/api/appointments/${first}`, { token: owner.token, body: { status: "İptal Edildi" } });
    const reBook = await api("POST", "/api/appointments", { token: owner2.token, body: payload });
    eq(reBook.status, 201, "iptal edilen saat yeniden alınabiliyor");
  }

  // ============================================================ 7) OTOMATİK KABUL AYARI
  /**
   * BULGU (YÜKSEK, business logic): "Randevuları otomatik kabul et" ayarı yalnızca istemci
   * state'indeydi ve randevu durumunu MÜŞTERİNİN tarayıcısı belirliyordu (varsayılan açık).
   * Yani tamircinin ayarının HİÇBİR etkisi yoktu — ayar bir kurguydu.
   */
  {
    const m = await createUser("mechanic", { name: "Onay Tamirci", email: "reg.auto@test.local", phone: "+905321110005" });
    // Varsayılan: açık → randevu "Sırada" düşüyor (bugünkü davranış korunuyor).
    const a1 = await api("POST", "/api/appointments", { token: owner.token, body: { mechanicId: m.id, date: "6 Mart", time: "11:00" } });
    eq(row(`SELECT status AS v FROM appointments WHERE id = ?`, a1.body.id).v, "Sırada", "varsayılan: otomatik kabul açık");
    eq(row(`SELECT autoAccepted AS v FROM appointments WHERE id = ?`, a1.body.id).v, 1, "autoAccepted 1");
    // Tamirci ayarı KAPATIYOR.
    eq((await api("PATCH", `/api/mechanics/${m.id}`, { token: m.token, body: { autoAcceptBookings: 0 } })).status, 200,
      "tamirci ayarı sunucuya yazabiliyor");
    const a2 = await api("POST", "/api/appointments", { token: owner.token, body: { mechanicId: m.id, date: "6 Mart", time: "12:00" } });
    eq(row(`SELECT status AS v FROM appointments WHERE id = ?`, a2.body.id).v, "Onay Bekliyor",
      "ayar KAPALIYKEN randevu onay bekliyor — ayar artık GERÇEKTEN çalışıyor");
    eq(row(`SELECT autoAccepted AS v FROM appointments WHERE id = ?`, a2.body.id).v, 0, "autoAccepted 0");
    // MÜŞTERİ bunu atlatamıyor: gövdede autoAccepted: 1 göndermek işe yaramıyor.
    const a3 = await api("POST", "/api/appointments", {
      token: owner.token, body: { mechanicId: m.id, date: "6 Mart", time: "13:00", autoAccepted: 1, status: "Sırada" },
    });
    eq(row(`SELECT status AS v FROM appointments WHERE id = ?`, a3.body.id).v, "Onay Bekliyor",
      "MÜŞTERİ tamircinin onay şartını ATLAYAMIYOR");
    // Başka tamirci bu ayarı değiştiremiyor.
    ok((await api("PATCH", `/api/mechanics/${m.id}`, { token: mech.token, body: { autoAcceptBookings: 1 } })).status >= 400,
      "başka tamirci bu ayarı değiştiremiyor");
  }

  // ============================================================ 8) KENDİ PROFİLİNDE KORUMALI ALANLAR
  {
    const probe = async (path, token, table, rowId, field, value, label) => {
      const before = row(`SELECT ${field} AS v FROM ${table} WHERE id = ?`, rowId).v;
      await api("PATCH", path, { token, body: { [field]: value } });
      eq(row(`SELECT ${field} AS v FROM ${table} WHERE id = ?`, rowId).v, before, `${label} (${field} değişmedi)`);
    };
    await probe(`/api/mechanics/${mech.id}`, mech.token, "mechanics", mech.id, "verified", 1, "TAMİRCİ kendini doğrulanmış yapamıyor");
    await probe(`/api/mechanics/${mech.id}`, mech.token, "mechanics", mech.id, "rating", 5, "TAMİRCİ puanını yazamıyor");
    await probe(`/api/mechanics/${mech.id}`, mech.token, "mechanics", mech.id, "reviews", 999, "TAMİRCİ yorum sayısını yazamıyor");
    await probe(`/api/owners/${owner.id}`, owner.token, "owners", owner.id, "status", "premium", "KULLANICI hesap durumunu yazamıyor");
    // Meşru: kendi adını, telefonunu değiştirebiliyor.
    eq((await api("PATCH", `/api/mechanics/${mech.id}`, { token: mech.token, body: { specialty: "Motor" } })).status, 200,
      "tamirci kendi uzmanlığını düzenleyebiliyor");
  }

  // ============================================================ 9) SAHTE DOĞRULANMIŞ SERVİS GEÇMİŞİ
  /**
   * İKİ SAVUNMA HATTI. Müşteri randevuyu tamamlanmış yapamıyor (durum makinesi) VE geçmiş kaydını
   * yalnızca işi yapan tamirci oluşturabiliyor. İkincisi denetim öncesinde de doğruydu; testte
   * ikisini birlikte tutuyoruz çünkü bu zincir araç satarken GÜVEN uyduruyor.
   */
  {
    const appt = await api("POST", "/api/appointments", {
      token: owner.token, body: { mechanicId: mech.id, vehicle: "BMW", date: "7 Mart", time: "14:00", issue: "Yağ" },
    });
    db().prepare(`UPDATE appointments SET status = 'Tamamlandı' WHERE id = ?`).run(appt.body.id);
    const hist = await api("POST", "/api/vehicle-history", {
      token: owner.token, body: { appointmentId: appt.body.id, vin: "WBA0000000000TEST", serviceText: "Uydurma", serviceDate: "2026-03-07" },
    });
    eq(hist.status, 403, "MÜŞTERİ doğrulanmış servis geçmişi OLUŞTURAMIYOR");
  }
} catch (e) {
  failures.push(`İSTİSNA: ${e.message}\n${e.stack?.split("\n").slice(1, 4).join("\n")}`);
} finally {
  stopServer();
}

if (failures.length === 0) {
  console.log(`OK e2e denetim regresyonu (${passed})`);
  process.exit(0);
}
console.log(`BAŞARISIZ e2e denetim regresyonu — ${failures.length}/${passed + failures.length}`);
for (const f of failures) console.log("  ✗ " + f);
process.exit(1);
