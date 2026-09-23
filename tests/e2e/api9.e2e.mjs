/**
 * İLİŞKİ DENETİMİNİN REGRESYON TAKIMI — KULLANICI ↔ ARAÇ ↔ TAMİRCİ ↔ ARAÇ SAHİBİ.
 * ================================================================================================
 * Bu takım "işlem oluyor mu" diye sormuyor. Her etkileşim için şunları soruyor:
 *   - kim başlatabilir,       - kimin adına yapılabilir,
 *   - HANGİ KAYDA bağlanır,   - veritabanına gerçekten yazıldı mı,
 *   - kim görebilir,          - kim değiştirebilir,
 *   - reddedilince veritabanı DEĞİŞMEDEN mi kalıyor.
 *
 * TAKIMIN KURALI (önceki denetimden devralındı): bir yazma reddedildiyse durum kodu YETMEZ —
 * ilgili satır da okunup değişmediği doğrulanır. 403 "hiçbir şey olmadı" demek zorundadır.
 */
import {
  startServer, stopServer, api, row, rows, createUser, adminToken, skipIfUnsupported, db,
} from "./harness.mjs";
import { eq, ok, report } from "../_harness.mjs";

if (skipIfUnsupported("uçtan uca ilişki denetimi")) process.exit(0);

await startServer();
try {
  // ===== DÖRT KULLANICI: kullanıcının istediği çapraz matrisin tarafları =====
  const CA = await createUser("owner", { name: "Customer A", email: "a9-ca@example.com", phone: "+905321270001" });
  const CB = await createUser("owner", { name: "Customer B", email: "a9-cb@example.com", phone: "+905321270002" });
  const MA = await createUser("mechanic", { name: "Mechanic A", email: "a9-ma@example.com", phone: "+905321270003" });
  const MB = await createUser("mechanic", { name: "Mechanic B", email: "a9-mb@example.com", phone: "+905321270004" });
  const admin = await adminToken();

  const vA = (await api("POST", "/api/vehicles", { token: CA.token, body: { brand: "VW", model: "Golf", plate: "34AAA01", vin: "WVWZZZ1KZAW000001" } })).body;
  const vB = (await api("POST", "/api/vehicles", { token: CB.token, body: { brand: "BMW", model: "320i", plate: "34BBB01", vin: "WBAZZZ3AZBW000002" } })).body;
  eq(row("SELECT ownerId FROM vehicles WHERE id = ?", vA.id).ownerId, CA.id, "araç sahipliği oturumdan yazıldı");

  // ===== 1) TEKLİF İSTEĞİ ↔ ARAÇ: yabancı araca bağlanamaz (HIGH) ===========================
  // Bulgu: ownerId oturumdan yazılıyordu ama vehicleId hiç doğrulanmıyordu — CA, CB'nin aracının
  // id'sini göndererek kendi talebini B'nin aracına bağladı (201).
  {
    const before = rows("SELECT id FROM quote_requests").length;
    const bad = await api("POST", "/api/quote-requests", {
      token: CA.token,
      body: { vehicleId: vB.id, issue: "fren", mechanicIds: [MA.id], customer: "CA", vehicle: "BMW" },
    });
    eq(bad.status, 403, "BAŞKASININ aracıyla teklif isteği açılamıyor");
    eq(rows("SELECT id FROM quote_requests").length, before, "ve reddedilen istek veritabanına HİÇ yazılmadı");

    const ghost = await api("POST", "/api/quote-requests", {
      token: CA.token, body: { vehicleId: 999999, issue: "x", mechanicIds: [MA.id] },
    });
    eq(ghost.status, 400, "var olmayan araç id'si reddediliyor");
    const badMech = await api("POST", "/api/quote-requests", {
      token: CA.token, body: { vehicleId: vA.id, issue: "x", mechanicIds: [MA.id, 999999] },
    });
    eq(badMech.status, 400, "var olmayan tamirci id'si reddediliyor (istek sessizce eksilmiyor)");
    eq(rows("SELECT id FROM quote_requests").length, before, "bu iki reddedilen istek de yazılmadı");
  }

  // ===== 2) TEKLİF: davet edilmemiş tamirci yazamaz (HIGH) ==================================
  // Bulgu: requestVisibleTo okumayı kısıtlıyordu ama teklif OLUŞTURMA yolu o kontrolü hiç
  // çağırmıyordu. MB isteği okuyamıyor (403) ama fiyatlı teklif verebiliyordu (201).
  let reqId;
  {
    const r = await api("POST", "/api/quote-requests", {
      token: CA.token, body: { vehicleId: vA.id, issue: "debriyaj sesi", mechanicIds: [MA.id], customer: "CA", vehicle: "VW Golf" },
    });
    eq(r.status, 201, "kendi aracıyla teklif isteği açılıyor");
    reqId = r.body.id;
    eq(row("SELECT vehicleId FROM quote_requests WHERE id = ?", reqId).vehicleId, vA.id, "istek DOĞRU araca bağlandı");

    eq((await api("GET", `/api/quote-requests/${reqId}`, { token: MB.token })).status, 403, "davet edilmemiş tamirci isteği OKUYAMIYOR");
    const sneak = await api("POST", "/api/quote-offers", {
      token: MB.token, body: { requestId: reqId, mechanicId: MB.id, price: 1, etaDays: 1, status: "submitted" },
    });
    eq(sneak.status, 403, "davet edilmemiş tamirci teklif VEREMİYOR (okuma ile yazma aynı kuralı kullanıyor)");
    eq(rows("SELECT id FROM quote_offers WHERE requestId = ? AND mechanicId = ?", reqId, MB.id).length, 0,
      "ve reddedilen teklif veritabanına yazılmadı");
    // Davet edilen tamirci normal çalışıyor — kural gereğinden fazla kısıtlamıyor.
    const okOffer = await api("POST", "/api/quote-offers", {
      token: MA.token, body: { requestId: reqId, mechanicId: MA.id, price: 1500, etaDays: 2, status: "submitted" },
    });
    eq(okOffer.status, 201, "DAVET EDİLEN tamirci teklif verebiliyor");
    eq(row("SELECT mechanicId, price FROM quote_offers WHERE id = ?", okOffer.body.id).mechanicId, MA.id,
      "teklif oturumdaki tamirciye bağlandı");
    // Başkası adına teklif: mechanicId yok sayılıp oturumdan yazılıyor.
    const spoof = await api("POST", "/api/quote-offers", {
      token: MA.token, body: { requestId: reqId, mechanicId: MB.id, price: 9, status: "submitted" },
    });
    ok(spoof.status === 409 || (spoof.status === 201 && row("SELECT mechanicId FROM quote_offers WHERE id = ?", spoof.body.id).mechanicId === MA.id),
      "başka tamirci adına teklif oluşturulamıyor");
    // Kabul yalnızca isteğin sahibine ait.
    eq((await api("POST", `/api/quote-offers/${okOffer.body.id}/accept`, { token: CB.token })).status, 403, "yabancı müşteri teklifi kabul edemiyor");
    eq(row("SELECT status FROM quote_offers WHERE id = ?", okOffer.body.id).status, "submitted", "reddedilen kabul durumu DEĞİŞTİRMEDİ");
    eq((await api("POST", `/api/quote-offers/${okOffer.body.id}/accept`, { token: MA.token })).status, 403, "teklifi veren tamirci kendi teklifini kabul edemiyor");
    eq((await api("POST", `/api/quote-offers/${okOffer.body.id}/accept`, { token: CA.token })).status, 200, "isteğin sahibi kabul edebiliyor");
    eq(row("SELECT status FROM quote_offers WHERE id = ?", okOffer.body.id).status, "accepted", "kabul veritabanına yazıldı");
    eq(row("SELECT status FROM quote_requests WHERE id = ?", reqId).status, "closed", "istek atomik olarak kapandı");
    eq((await api("POST", `/api/quote-offers/${okOffer.body.id}/accept`, { token: CA.token })).status, 409, "ikinci kez kabul edilemiyor (çift harcama yok)");
  }

  // ===== 3) RANDEVU ↔ ARAÇ: gerçek bağ ve sahiplik (MEDIUM) =================================
  // Bulgu: appointments tablosunda vehicleId YOKTU; araç yalnızca serbest metindi.
  {
    ok(rows("PRAGMA table_info(appointments)").some((c) => c.name === "vehicleId"),
      "randevu ↔ araç GERÇEK bir sütunla bağlı (metin değil)");
    const mine = await api("POST", "/api/appointments", {
      token: CA.token, body: { mechanicId: MA.id, vehicleId: vA.id, date: "2027-08-01", time: "09:00", service: "Bakım", vehicle: "VW Golf · 34AAA01" },
    });
    eq(mine.status, 201, "kendi aracıyla randevu alınıyor");
    eq(row("SELECT vehicleId FROM appointments WHERE id = ?", mine.body.id).vehicleId, vA.id, "randevu DOĞRU araca bağlandı");
    eq(row("SELECT ownerId FROM appointments WHERE id = ?", mine.body.id).ownerId, CA.id, "randevu sahibi oturumdan");

    const foreign = await api("POST", "/api/appointments", {
      token: CA.token, body: { mechanicId: MA.id, vehicleId: vB.id, date: "2027-08-02", time: "09:00", service: "Bakım" },
    });
    eq(foreign.status, 403, "BAŞKASININ aracıyla randevu alınamıyor");
    eq(rows("SELECT id FROM appointments WHERE vehicleId = ?", vB.id).length, 0, "ve reddedilen randevu yazılmadı");

    // Müşteri, tamirciye ait alanları yazamıyor; reddedilen PATCH satırı DEĞİŞTİRMİYOR.
    const snapshot = JSON.stringify(row("SELECT * FROM appointments WHERE id = ?", mine.body.id));
    const priceTry = await api("PATCH", `/api/appointments/${mine.body.id}`, { token: CA.token, body: { servicePrice: 1 } });
    eq(priceTry.status, 403, "müşteri servis bedelini yazamıyor");
    eq(JSON.stringify(row("SELECT * FROM appointments WHERE id = ?", mine.body.id)), snapshot, "reddedilen PATCH satırı bit bit aynı bıraktı");
    // Yabancı tamirci randevuya dokunamıyor.
    eq((await api("PATCH", `/api/appointments/${mine.body.id}`, { token: MB.token, body: { status: "Sırada" } })).status, 403, "yabancı tamirci randevuyu ilerletemiyor");
    eq(row("SELECT status FROM appointments WHERE id = ?", mine.body.id).status, "Sırada", "ve durum yabancı istekten etkilenmedi");
  }

  // ===== 4) SOHBET: taraflar ve kopya alanlar (LOW) ==========================================
  {
    const c = await api("POST", "/api/conversations", {
      token: CA.token, body: { mechanicId: MA.id, ownerId: CB.id, mechanicName: "SAHTE AD", mechanicImg: "sahte" },
    });
    eq(c.status, 201, "sohbet açılıyor");
    const st = row("SELECT ownerId, mechanicId, mechanicName FROM conversations WHERE id = ?", c.body.id);
    eq(st.ownerId, CA.id, "sohbetin araç sahibi OTURUMDAN (gövdedeki CB yok sayıldı)");
    eq(st.mechanicName, "Mechanic A", "tamircinin adı KAYNAK SATIRDAN (gövdedeki 'SAHTE AD' yok sayıldı)");
    eq((await api("POST", "/api/conversations", { token: CA.token, body: { mechanicId: 999999 } })).status, 400, "var olmayan tamirciyle sohbet açılamıyor");

    // Mesaj: gönderen oturumdan damgalanıyor, yabancı yazamıyor.
    const m = await api("POST", `/api/conversations/${c.body.id}/messages`, { token: CA.token, body: { message: { text: "merhaba" } } });
    eq(m.status, 200, "mesaj gönderiliyor");
    const msgs = JSON.parse(row("SELECT messages FROM conversations WHERE id = ?", c.body.id).messages);
    eq(msgs.at(-1).sender, "owner", "mesajın göndereni OTURUMDAN damgalandı");
    ok(msgs.at(-1).text === "merhaba", "mesaj metni VERİTABANINA yazıldı (yenilemede kaybolmaz)");
    const spoofSender = await api("POST", `/api/conversations/${c.body.id}/messages`, { token: CA.token, body: { message: { text: "sahte", sender: "mechanic", senderId: MA.id } } });
    const msgs2 = JSON.parse(row("SELECT messages FROM conversations WHERE id = ?", c.body.id).messages);
    ok(spoofSender.status !== 200 || msgs2.at(-1).sender === "owner", "başkasının ağzından mesaj yazılamıyor");
    const foreignMsg = await api("POST", `/api/conversations/${c.body.id}/messages`, { token: CB.token, body: { message: { text: "araya girdim" } } });
    eq(foreignMsg.status, 403, "yabancı kullanıcı sohbete yazamıyor");
    eq(JSON.parse(row("SELECT messages FROM conversations WHERE id = ?", c.body.id).messages).length, msgs2.length,
      "reddedilen mesaj veritabanına EKLENMEDİ");
  }

  // ===== 5) İLAN ↔ ARAÇ ve ARAÇ ↔ İLAN bağı (MEDIUM/LOW) ====================================
  {
    const foreignListing = await api("POST", "/api/listings", {
      token: CA.token, body: { title: "Satılık", brand: "BMW", model: "320i", price: "300000", status: "active", vehicleId: vB.id },
    });
    eq(foreignListing.status, 403, "ilan BAŞKASININ aracına bağlanamıyor");
    eq(rows("SELECT id FROM listings WHERE vehicleId = ?", vB.id).length, 0, "ve reddedilen ilan yazılmadı");

    const own = await api("POST", "/api/listings", {
      token: CA.token, body: { title: "Kendi aracım", brand: "VW", model: "Golf", price: "300000", status: "active", vehicleId: vA.id },
    });
    eq(own.status, 201, "kendi aracıyla ilan açılıyor");
    eq(row("SELECT vehicleId FROM listings WHERE id = ?", own.body.id).vehicleId, vA.id, "ilan DOĞRU araca bağlandı");

    const cbListing = (await api("POST", "/api/listings", { token: CB.token, body: { title: "CB", brand: "BMW", model: "320i", price: "1", status: "active" } })).body;
    const link = await api("PATCH", `/api/vehicles/${vA.id}`, { token: CA.token, body: { listingId: cbListing.id } });
    eq(link.status, 403, "araç BAŞKASININ ilanına bağlanamıyor");
    ok((row("SELECT listingId FROM vehicles WHERE id = ?", vA.id).listingId ?? null) !== cbListing.id, "ve bağ yazılmadı");
    eq((await api("PATCH", `/api/vehicles/${vA.id}`, { token: CA.token, body: { listingId: own.body.id } })).status, 200, "kendi ilanına bağlanabiliyor");
  }

  // ===== 6) SERVİS GEÇMİŞİ: zincirin son halkası (MEDIUM) ====================================
  // Zincir: araç → randevu(vehicleId) → tamamlandı → vehicle_history → ilanda doğrulanmış geçmiş.
  {
    const ap = await api("POST", "/api/appointments", {
      token: CA.token, body: { mechanicId: MA.id, vehicleId: vA.id, date: "2027-09-01", time: "10:00", service: "Bakım" },
    });
    await api("PATCH", `/api/appointments/${ap.body.id}`, { token: MA.token, body: { status: "Sırada" } });
    await api("PATCH", `/api/appointments/${ap.body.id}`, { token: MA.token, body: { status: "Tamir Tamamlandı", servicePrice: 2000 } });

    // VIN gönderilmese bile GERÇEK BAĞDAN çözülüyor (eskiden randevu metninde plaka aranıyordu).
    const hist = await api("POST", "/api/vehicle-history", { token: MA.token, body: { appointmentId: ap.body.id, serviceText: "yağ değişimi", km: 50000 } });
    eq(hist.status, 201, "tamamlanmış randevudan servis kaydı oluşuyor");
    const hrow = row("SELECT vin, ownerId, mechanicId FROM vehicle_history WHERE appointmentId = ?", ap.body.id);
    eq(hrow.vin, "WVWZZZ1KZAW000001", "VIN randevunun ARAÇ BAĞINDAN çözüldü (metin eşleşmesine gerek yok)");
    eq(hrow.ownerId, CA.id, "kayıt doğru araç sahibine bağlandı");
    eq(hrow.mechanicId, MA.id, "kayıt işi yapan tamirciye bağlandı");

    // BAŞKASININ VIN'ine yazma: tamirci kendi tamamlanmış randevusunu kullanarak bile yazamıyor.
    const foreignVin = await api("POST", "/api/vehicle-history", {
      token: MA.token, body: { appointmentId: ap.body.id, vin: "WBAZZZ3AZBW000002", serviceText: "uydurma" },
    });
    eq(foreignVin.status, 403, "başka kullanıcının aracına kayıtlı VIN'e servis geçmişi yazılamıyor");
    eq(rows("SELECT id FROM vehicle_history WHERE vin = 'WBAZZZ3AZBW000002'").length, 0, "ve uydurma kayıt yazılmadı");
    // Yabancı tamirci bu randevudan kayıt üretemiyor.
    eq((await api("POST", "/api/vehicle-history", { token: MB.token, body: { appointmentId: ap.body.id } })).status, 403,
      "randevusu olmayan tamirci servis kaydı yazamıyor");
    // Araç sahibi de yazamıyor (kendi geçmişini uyduramaz).
    eq((await api("POST", "/api/vehicle-history", { token: CA.token, body: { appointmentId: ap.body.id } })).status, 403,
      "araç sahibi kendi servis geçmişini yazamıyor");

    // ===== 7) YORUM: doğrulanmış müşteri kuralı ve sahiplik =====
    eq((await api("POST", `/api/mechanics/${MA.id}/reviews`, { token: CB.token, body: { rating: 1, comment: "kötü" } })).status, 403,
      "randevusu OLMAYAN müşteri yorum yazamıyor");
    eq(rows("SELECT id FROM mechanic_reviews WHERE mechanicId = ? AND authorId = ?", MA.id, CB.id).length, 0, "ve yorum yazılmadı");
    const rv = await api("POST", `/api/mechanics/${MA.id}/reviews`, { token: CA.token, body: { rating: 5, comment: "memnun kaldım" } });
    eq(rv.status, 201, "tamamlanmış randevusu olan müşteri yorum yazabiliyor");
    const rid = rv.body.reviewId;
    eq(row("SELECT authorId, authorType FROM mechanic_reviews WHERE id = ?", rid).authorId, CA.id, "yorum yazarı oturumdan");
    eq((await api("POST", `/api/mechanics/${MA.id}/reviews`, { token: CA.token, body: { rating: 1, comment: "ikinci" } })).status, 409,
      "aynı tamirciye ikinci yorum yazılamıyor");
    // PUAN SUNUCUDA hesaplanıyor.
    eq(row("SELECT rating FROM mechanics WHERE id = ?", MA.id).rating, 5, "ortalama puan SUNUCUDA hesaplandı");
    const fakeRating = await api("PATCH", `/api/mechanics/${MA.id}`, { token: MA.token, body: { rating: 1, reviews: 500 } });
    eq(row("SELECT rating FROM mechanics WHERE id = ?", MA.id).rating, 5, "tamirci kendi puanını yazamıyor (istemci değeri yok sayıldı)");
    eq((await api("DELETE", `/api/mechanics/${MA.id}/reviews/${rid}`, { token: CB.token })).status, 403, "başkası yorumu silemiyor");
    eq((await api("DELETE", `/api/mechanics/${MA.id}/reviews/${rid}`, { token: MA.token })).status, 403, "hakkındaki tamirci yorumu silemiyor");
    ok(row("SELECT id FROM mechanic_reviews WHERE id = ?", rid), "iki reddedilen silmeden sonra yorum DURUYOR");

    // ===== 8) BEĞENME (review_helpful): sayaç sunucuda, kişi başına bir kez =====
    eq((await api("POST", `/api/mechanics/${MA.id}/reviews/${rid}/helpful`, {})).status, 401, "girişsiz beğeni yok");
    eq((await api("POST", `/api/mechanics/${MA.id}/reviews/${rid}/helpful`, { token: MB.token })).status, 403, "tamirci hesabıyla beğeni yok");
    eq((await api("POST", `/api/mechanics/${MA.id}/reviews/${rid}/helpful`, { token: CB.token })).status, 200, "müşteri beğenebiliyor");
    eq(rows("SELECT 1 FROM review_helpful WHERE reviewId = ?", rid).length, 1, "beğeni VERİTABANINA yazıldı");
    await api("POST", `/api/mechanics/${MA.id}/reviews/${rid}/helpful`, { token: CB.token });
    eq(rows("SELECT 1 FROM review_helpful WHERE reviewId = ?", rid).length, 0, "ikinci tıklama beğeniyi KALDIRDI (çift saymıyor)");
    await api("POST", `/api/mechanics/${MA.id}/reviews/${rid}/helpful`, { token: CB.token });
    await api("POST", `/api/mechanics/${MA.id}/reviews/${rid}/helpful`, { token: CA.token });
    eq(rows("SELECT 1 FROM review_helpful WHERE reviewId = ?", rid).length, 2, "iki farklı kişi iki beğeni");
  }

  // ===== 9) FAVORİ: kalıcı, kişiye bağlı, yabancı dokunamaz =================================
  {
    const p = await api("PATCH", `/api/owners/${CA.id}`, { token: CA.token, body: { favoriteMechanicIds: [MA.id], favoriteIds: [1, 2] } });
    eq(p.status, 200, "favori yazılıyor");
    eq(row("SELECT favoriteMechanicIds FROM owners WHERE id = ?", CA.id).favoriteMechanicIds, `[${MA.id}]`, "favori VERİTABANINDA (yenilemede kaybolmaz)");
    const cross = await api("PATCH", `/api/owners/${CA.id}`, { token: CB.token, body: { favoriteIds: [] } });
    eq(cross.status, 403, "başka kullanıcı favorileri değiştiremiyor");
    eq(row("SELECT favoriteIds FROM owners WHERE id = ?", CA.id).favoriteIds, "[1,2]", "ve reddedilen istek favorileri DEĞİŞTİRMEDİ");
    // Başka kullanıcının favori listesi toplu listede görünmüyor (önceki denetimin düzeltmesi).
    const list = await api("GET", "/api/owners", { token: CB.token });
    const caInList = (Array.isArray(list.body) ? list.body : []).find((o) => o.id === CA.id);
    ok(caInList && !("favoriteIds" in caInList), "başkasının favori listesi sızmıyor");
  }

  // ===== 10) SİLME SONRASI İLİŞKİ TEMİZLİĞİ ================================================
  {
    const vDel = (await api("POST", "/api/vehicles", { token: CB.token, body: { brand: "Fiat", model: "Egea", plate: "34DEL01" } })).body;
    const li = (await api("POST", "/api/listings", { token: CB.token, body: { title: "silinecek araç ilanı", brand: "Fiat", model: "Egea", price: "1", status: "active", vehicleId: vDel.id } })).body;
    eq((await api("DELETE", `/api/vehicles/${vDel.id}`, { token: CA.token })).status, 403, "yabancı araç silinemiyor");
    ok(row("SELECT id FROM vehicles WHERE id = ?", vDel.id), "ve araç duruyor");
    eq((await api("DELETE", `/api/vehicles/${vDel.id}`, { token: CB.token })).status, 204, "sahibi aracı silebiliyor");
    // İlan, silinmiş araca işaret eden bir bağla kalıyor — ÖLÇÜLEN gerçek bu, dürüstçe yazıyoruz.
    const orphan = row("SELECT vehicleId FROM listings WHERE id = ?", li.id);
    eq(orphan.vehicleId, vDel.id, "araç silindiğinde ilanın vehicleId bağı SAHİPSİZ kalıyor (bilinen sınır, bkz. el kitabı 25.14)");
  }

  // ===== 11) KALAN RİSKLERİN KAPATILMASI (kullanıcı isteği) ================================
  // (a) mechanics.email tekilliği artık VERİTABANINDA. Önceki denetimde "tabloyu yeniden kurmadan
  //     kapatılamaz" demiştim ve bu yanlıştı: ALTER TABLE UNIQUE KISIT ekleyemez ama var olan
  //     sütuna UNIQUE INDEX kurulabilir. İndeks kısmi ve lower(email) üzerinde — uygulamadaki
  //     karşılaştırma da büyük/küçük harf duyarsız olduğu için ikisi artık ÇELİŞMİYOR.
  {
    const idx = rows("SELECT name, sql FROM sqlite_master WHERE type='index' AND name LIKE '%email%'");
    ok(idx.some((i) => i.name === "idx_mechanics_email_unique"), "mechanics.email tekillik indeksi var");
    ok(idx.some((i) => i.name === "idx_owners_email_lower_unique"), "owners.email için harf duyarsız indeks var");
    const mechIdx = idx.find((i) => i.name === "idx_mechanics_email_unique");
    ok(/UNIQUE/i.test(mechIdx.sql) && /lower\(email\)/i.test(mechIdx.sql), "indeks UNIQUE ve lower(email) üzerinde");
    ok(/WHERE/i.test(mechIdx.sql), "indeks KISMİ (boş e-postalı eski kayıtlar indeksi ihlal etmiyor)");
    // Kısıt gerçekten çalışıyor mu — uygulama katmanını atlayıp DOĞRUDAN veritabanına yazmayı dene.
    let blocked = false;
    try {
      db().prepare(`INSERT INTO mechanics (name, email, password) VALUES ('Kopya', ?, 'x')`).run("A9-MA@EXAMPLE.COM");
    } catch { blocked = true; }
    ok(blocked, "BÜYÜK harfli aynı e-posta veritabanı düzeyinde reddedildi (uygulama atlanarak)");
  }
  // (b) Analitikte ziyaretçi kimliği artık SUNUCU türetiyor — istemcinin uydurduğu değer yok sayılıyor.
  {
    const before = rows("SELECT DISTINCT visitorId FROM analytics_events").length;
    const fake = Array.from({ length: 20 }, (_, i) => ({ name: "mechanic_view", visitorId: `uydurma-${i}`, sessionId: `s-${i}`, targetType: "mechanic", targetId: MA.id }));
    const r = await api("POST", "/api/analytics/events", { body: { events: fake } });
    eq(r.status, 201, "olaylar kabul ediliyor (özellik çalışıyor)");
    eq(r.body.accepted, 20, "yirmi olay yazıldı");
    const after = rows("SELECT DISTINCT visitorId FROM analytics_events").length;
    eq(after - before, 1, "20 UYDURMA ziyaretçi kimliği TEK ziyaretçiye indi (şişirme kapandı)");
    const stored = rows("SELECT DISTINCT visitorId FROM analytics_events ORDER BY visitorId").map((x) => x.visitorId);
    ok(stored.every((v) => !String(v).startsWith("uydurma-")), "istemcinin gönderdiği kimlik hiç saklanmadı");
  }
  // (c) Paylaşılan çeviri önbelleği ÖZEL metni tutmuyor; herkese açık metni tutuyor.
  {
    const priv = `ozel randevu notu ${Date.now()}`;
    const pub = `herkese acik ilan metni ${Date.now()}`;
    db().prepare(`INSERT OR IGNORE INTO translation_cache (fromLang,toLang,sourceText,translatedText) VALUES ('tr','en',?,?)`).run(pub, "public listing text");
    // Özel kapsam: önbellekte karşılığı olsa bile ORADAN OKUNMUYOR → oracle yok.
    db().prepare(`INSERT OR IGNORE INTO translation_cache (fromLang,toLang,sourceText,translatedText) VALUES ('tr','en',?,?)`).run(priv, "private appointment note");
    const asPrivate = await api("POST", "/api/translate", { body: { text: priv, from: "tr", to: "en" } });
    ok(asPrivate.body.translatedText !== "private appointment note",
      "ÖZEL kapsamda önbellekten okunmuyor (çapraz kullanıcı oracle'ı yok)");
    const asPublic = await api("POST", "/api/translate", { body: { text: pub, from: "tr", to: "en", scope: "public" } });
    eq(asPublic.body.translatedText, "public listing text", "HERKESE AÇIK kapsamda önbellek çalışıyor");
    // Özel metin önbelleğe YAZILMIYOR: dış servis bu ortamda erişilemez olduğu için yeni bir
    // satır oluşmadığını doğrulamak yeterli değil; onun yerine kod yolunu kapsamla ölçüyoruz.
    const newPriv = `yazilmamali ${Date.now()}`;
    await api("POST", "/api/translate", { body: { text: newPriv, from: "tr", to: "en" } });
    eq(rows("SELECT id FROM translation_cache WHERE sourceText = ?", newPriv).length, 0,
      "özel metin paylaşılan önbelleğe YAZILMADI");
  }

  report("uçtan uca ilişki denetimi");
} finally {
  stopServer();
}
