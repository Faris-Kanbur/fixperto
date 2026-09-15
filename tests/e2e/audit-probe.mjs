/**
 * DENETİM SONDASI — RAPORLAR, İDDİA ETMEZ.
 * ================================================================================================
 * Bu dosya bir TEST DEĞİL, bir KEŞİF ARACI. Fark önemli: test "şu doğru olmalı" der ve kırmızı
 * yanar; sonda "şunu denedim, sonuç şu" der ve bir bulgu listesi üretir. Denetimin ilk aşamasında
 * ihtiyaç duyulan ikincisi — neyin kırık olduğunu henüz bilmiyorum.
 *
 * Bulgular tespit edildikten ve DÜZELTİLDİKTEN sonra, kalıcı olanları normal test takımlarına
 * iddia olarak taşınıyor (regresyon koruması). Sonda kendisi `tests/run.mjs` tarafından
 * çalıştırılmıyor (adı `.e2e.mjs` değil) — çünkü işi geçmek/kalmak değil, bilgi üretmek.
 *
 * SALDIRGAN GİBİ DÜŞÜNME KURALI: her istek doğrudan HTTP ile atılıyor, ön yüz hiç kullanılmıyor.
 * Ön yüzde düğmenin gizli olması bir koruma değil; burada test edilen şey SUNUCUNUN kendisi.
 */
import { startServer, stopServer, api, BASE, row, rows, db, createUser, adminToken, skipIfUnsupported } from "./harness.mjs";

if (skipIfUnsupported("denetim sondası")) process.exit(0);

const findings = [];
const note = (sev, area, title, detail) => findings.push({ sev, area, title, detail });
const CRIT = "KRİTİK", HIGH = "YÜKSEK", MED = "ORTA", LOW = "DÜŞÜK", OK = "temiz";

try {
  await startServer();
  const admin = await adminToken();
  const owner = await createUser("owner", { name: "Denetim Sahip", email: "audit.owner@test.local" });
  const owner2 = await createUser("owner", { name: "Denetim Sahip 2", email: "audit.owner2@test.local" });
  const mech = await createUser("mechanic", { name: "Denetim Tamirci", email: "audit.mech@test.local" });
  const mech2 = await createUser("mechanic", { name: "Denetim Tamirci 2", email: "audit.mech2@test.local" });

  // ============================================================ 1) MASS ASSIGNMENT
  /**
   * Her tabloda "kullanıcının yazmaması gereken" sütunları TEK TEK deniyorum. Yöntem: kaydı
   * oluştur, sonra PATCH ile korumalı alanı yaz, sonra VERİTABANINDAN oku. Yanıta bakmak yetmez —
   * sunucu 200 dönüp alanı yok saymış da olabilir; tek güvenilir kanıt satırın kendisi.
   */
  const tryPatch = async (path, token, body) => api("PATCH", path, { token, body });

  // --- appointments: iki taraf da PATCH edebiliyor (authScope owner+mechanic) ---
  {
    const appt = await api("POST", "/api/appointments", {
      token: owner.token,
      body: { mechanicId: mech.id, mechanicName: "Denetim Tamirci", customer: "X", vehicle: "VW Golf",
              date: "1 Ocak", time: "10:00", status: "Onay Bekliyor", issue: "Fren", servicePrice: 1000 },
    });
    if (appt.status !== 201) { note(MED, "appointments", `randevu oluşturulamadı (${appt.status})`, appt.raw?.slice(0, 200)); }
    else {
      const id = appt.body.id;
      const probe = async (field, value, label) => {
        const before = row(`SELECT ${field} AS v FROM appointments WHERE id = ?`, id).v;
        await tryPatch(`/api/appointments/${id}`, owner.token, { [field]: value });
        const after = row(`SELECT ${field} AS v FROM appointments WHERE id = ?`, id).v;
        if (String(after) === String(value) && String(before) !== String(value)) {
          note(HIGH, "appointments", `MÜŞTERİ ${field} alanını yazabiliyor`, `${label} · ${before} → ${after}`);
        }
      };
      await probe("status", "Tamamlandı", "randevuyu kendi kendine TAMAMLANDI yapıyor");
      await probe("servicePrice", 1, "hizmet bedelini 1₺ yapıyor");
      await probe("depositPaid", 99999, "ödenmiş kapora uyduruyor");
      await probe("depositRefunded", 1, "iade edilmiş gösteriyor");
      await probe("noShow", 1, "tamirciyi 'gelmedi' işaretliyor");
      await probe("reviewed", 0, "yorum hakkını sıfırlıyor");
      await probe("autoAccepted", 1, "otomatik onaylanmış gösteriyor");
      await probe("warrantyEndDate", "2099-01-01", "garanti tarihi uyduruyor");
      await probe("mechanicName", "Başka Tamirci", "tamirci adını değiştiriyor");
      // Sahiplik alanını değiştirip başkasının randevusu yapabiliyor mu?
      await tryPatch(`/api/appointments/${id}`, owner.token, { ownerId: owner2.id });
      const movedOwner = row(`SELECT ownerId AS v FROM appointments WHERE id = ?`, id).v;
      if (movedOwner === owner2.id) note(HIGH, "appointments", "MÜŞTERİ randevuyu başka kullanıcıya devredebiliyor", `ownerId → ${movedOwner}`);
      await tryPatch(`/api/appointments/${id}`, owner.token, { mechanicId: mech2.id });
      const movedMech = row(`SELECT mechanicId AS v FROM appointments WHERE id = ?`, id).v;
      if (movedMech === mech2.id) note(HIGH, "appointments", "MÜŞTERİ randevuyu başka TAMİRCİYE atayabiliyor", `mechanicId → ${movedMech}`);
    }
  }

  // --- listings ---
  {
    const lst = await api("POST", "/api/listings", {
      token: owner.token,
      body: { brand: "VW", model: "Golf", year: 2019, km: 50000, price: 300000, sellerType: "owner", status: "active" },
    });
    if (lst.status !== 201) note(MED, "listings", `ilan oluşturulamadı (${lst.status})`, lst.raw?.slice(0, 200));
    else {
      const id = lst.body.id;
      const probe = async (field, value, sev, label) => {
        await tryPatch(`/api/listings/${id}`, owner.token, { [field]: value });
        const after = row(`SELECT ${field} AS v FROM listings WHERE id = ?`, id).v;
        if (String(after) === String(value)) note(sev, "listings", `SATICI ${field} alanını yazabiliyor`, `${label} · değer ${after}`);
      };
      await probe("featured", 1, HIGH, "ilanı ÜCRETSİZ öne çıkarıyor");
      await probe("shareCount", 9999, LOW, "paylaşım sayacını şişiriyor");
      // Önce admin kaldırsın, sonra satıcı geri alsın — moderasyonu iptal etme.
      db().prepare(`UPDATE listings SET adminRemoved = 1 WHERE id = ?`).run(id);
      await tryPatch(`/api/listings/${id}`, owner.token, { adminRemoved: 0 });
      if (row(`SELECT adminRemoved AS v FROM listings WHERE id = ?`, id).v === 0) {
        note(CRIT, "listings", "SATICI yöneticinin KALDIRDIĞI ilanı geri açabiliyor", "adminRemoved 1 → 0");
      }
      db().prepare(`UPDATE listings SET adminRemoved = 0 WHERE id = ?`).run(id);
      // offers/messages: alıcıların verileri. Satıcı bunları silebiliyor/uydurabiliyor mu?
      await tryPatch(`/api/listings/${id}`, owner.token, { offers: [{ id: 1, buyerName: "Hayalet", amount: 999999 }] });
      const offers = row(`SELECT offers AS v FROM listings WHERE id = ?`, id).v;
      if (String(offers).includes("Hayalet")) note(HIGH, "listings", "SATICI alıcı TEKLİFLERİNİ uydurabiliyor/silebiliyor", String(offers).slice(0, 120));
    }
  }

  // --- job_listings: applicants (tekrar eden anahtar yüzünden korumasız kaldığından şüpheliyim) ---
  {
    const job = await api("POST", "/api/jobs", {
      token: mech.token, body: { title: "Usta aranıyor", description: "d", salaryMin: 30000 },
    });
    if (job.status !== 201) note(MED, "job_listings", `iş ilanı oluşturulamadı (${job.status})`, job.raw?.slice(0, 200));
    else {
      const id = job.body.id;
      await tryPatch(`/api/jobs/${id}`, mech.token, { applicants: [{ id: 1, name: "Uydurma Aday", status: "pending" }] });
      const apps = row(`SELECT applicants AS v FROM job_listings WHERE id = ?`, id).v;
      if (String(apps).includes("Uydurma")) {
        note(HIGH, "job_listings", "TAMİRCİ başvuruları uydurabiliyor/silebiliyor", "ADMIN_ONLY_FIELDS'te job_listings anahtarı İKİ KEZ tanımlı, ilki eziliyor");
      }
      await tryPatch(`/api/jobs/${id}`, mech.token, { shareCount: 5000 });
      if (row(`SELECT shareCount AS v FROM job_listings WHERE id = ?`, id).v === 5000) {
        note(LOW, "job_listings", "TAMİRCİ paylaşım sayacını yazabiliyor", "shareCount");
      }
    }
  }

  // --- support_tickets ---
  {
    const tk = await api("POST", "/api/tickets", {
      token: owner.token, body: { type: "payment", subject: "Kapora", message: "m", status: "open" },
    });
    if (tk.status !== 201) note(MED, "support_tickets", `talep oluşturulamadı (${tk.status})`, tk.raw?.slice(0, 200));
    else {
      const id = tk.body.id;
      await tryPatch(`/api/tickets/${id}`, owner.token, { adminReplies: [{ by: "admin", text: "Paranız iade edildi" }] });
      const rep = row(`SELECT adminReplies AS v FROM support_tickets WHERE id = ?`, id).v;
      if (String(rep).includes("iade edildi")) note(MED, "support_tickets", "KULLANICI kendi talebine YÖNETİCİ YANITI uydurabiliyor", String(rep).slice(0, 100));
      await tryPatch(`/api/tickets/${id}`, owner.token, { refunded: 1 });
      if (row(`SELECT refunded AS v FROM support_tickets WHERE id = ?`, id).v === 1) {
        note(MED, "support_tickets", "KULLANICI 'iade edildi' bayrağını kendisi yazabiliyor", "refunded → 1");
      }
      await tryPatch(`/api/tickets/${id}`, owner.token, { status: "resolved", priority: "low" });
      const st = row(`SELECT status AS v FROM support_tickets WHERE id = ?`, id).v;
      if (st === "resolved") note(LOW, "support_tickets", "KULLANICI talebini 'çözüldü' yapabiliyor", "status → resolved");
    }
  }

  // --- broadcasts: fields: [] — kim yazabiliyor? ---
  {
    const bc = await api("POST", "/api/broadcasts", { token: owner.token, body: { audience: "all", message: "SAHTE DUYURU" } });
    if (bc.status === 201) note(CRIT, "broadcasts", "NORMAL KULLANICI platform duyurusu yayınlayabiliyor", `durum ${bc.status}`);
    const bcM = await api("POST", "/api/broadcasts", { token: mech.token, body: { audience: "all", message: "SAHTE DUYURU 2" } });
    if (bcM.status === 201) note(CRIT, "broadcasts", "TAMİRCİ platform duyurusu yayınlayabiliyor", `durum ${bcM.status}`);
    const bcA = await api("POST", "/api/broadcasts", { token: admin, body: { audience: "all", message: "Gerçek duyuru" } });
    if (bcA.status !== 201) note(MED, "broadcasts", `YÖNETİCİ duyuru yayınlayamıyor (${bcA.status})`, "meşru yol kırık olabilir");
  }

  // --- mechanics: kendi profilinde korumalı alanlar ---
  {
    const probe = async (field, value, sev, label) => {
      await tryPatch(`/api/mechanics/${mech.id}`, mech.token, { [field]: value });
      const after = row(`SELECT ${field} AS v FROM mechanics WHERE id = ?`, mech.id).v;
      if (String(after) === String(value)) note(sev, "mechanics", `TAMİRCİ ${field} alanını yazabiliyor`, `${label} · ${after}`);
    };
    await probe("verified", 1, CRIT, "kendini DOĞRULANMIŞ yapıyor");
    await probe("rating", 5, HIGH, "puanını 5 yapıyor");
    await probe("reviews", 999, HIGH, "yorum sayısını şişiriyor");
    await probe("shareCount", 9999, LOW, "paylaşım sayacı");
    await probe("avgResponseMinutes", 1, MED, "yanıt süresini 1 dk gösteriyor");
    await probe("distance", 0, LOW, "mesafeyi 0 gösteriyor");
  }

  // --- owners: kendi profilinde ---
  {
    const probe = async (field, value, sev, label) => {
      await tryPatch(`/api/owners/${owner.id}`, owner.token, { [field]: value });
      const after = row(`SELECT ${field} AS v FROM owners WHERE id = ?`, owner.id).v;
      if (String(after) === String(value)) note(sev, "owners", `KULLANICI ${field} alanını yazabiliyor`, `${label} · ${after}`);
    };
    await probe("status", "premium", MED, "hesap durumunu değiştiriyor");
    await probe("vehicleCount", 99, LOW, "araç sayacı");
  }

  // --- vehicles: sahiplik devri ---
  {
    const v = await api("POST", "/api/vehicles", { token: owner.token, body: { brand: "VW", model: "Polo", year: 2018, plate: "34 AU 001" } });
    if (v.status === 201) {
      await tryPatch(`/api/vehicles/${v.body.id}`, owner.token, { ownerId: owner2.id });
      if (row(`SELECT ownerId AS v FROM vehicles WHERE id = ?`, v.body.id).v === owner2.id) {
        note(MED, "vehicles", "KULLANICI aracını başka hesaba devredebiliyor (onay yok)", "ownerId değişti");
      }
    }
  }

  // ============================================================ 2) SAHTE DOĞRULANMIŞ SERVİS GEÇMİŞİ
  /**
   * EN CİDDİ ZİNCİR ŞÜPHESİ: randevu durumu müşteri tarafından yazılabiliyorsa, müşteri kendi
   * randevusunu "Tamamlandı" yapıp ardından DOĞRULANMIŞ servis geçmişi üretebilir. O geçmiş
   * ilanda alıcıya "platformda gerçekleşmiş iş" olarak gösteriliyor — yani araç satarken güven
   * uydurma yolu. Zinciri uçtan uca deniyorum.
   */
  {
    const veh = await api("POST", "/api/vehicles", {
      token: owner.token, body: { brand: "BMW", model: "320i", year: 2020, plate: "34 AU 002", vin: "WBA1234567890ABCD" },
    });
    const appt = await api("POST", "/api/appointments", {
      token: owner.token,
      body: { mechanicId: mech.id, mechanicName: "Denetim Tamirci", customer: "X", vehicle: "BMW 320i (34 AU 002)",
              date: "2 Ocak", time: "11:00", status: "Onay Bekliyor", issue: "Yağ" },
    });
    if (appt.status === 201) {
      await tryPatch(`/api/appointments/${appt.body.id}`, owner.token, { status: "Tamamlandı" });
      const st = row(`SELECT status AS v FROM appointments WHERE id = ?`, appt.body.id).v;
      const hist = await api("POST", "/api/vehicle-history", {
        token: owner.token,
        body: { appointmentId: appt.body.id, vin: "WBA1234567890ABCD", serviceText: "Uydurma yağ değişimi", serviceDate: "2026-01-02" },
      });
      if (hist.status === 201) {
        note(CRIT, "vehicle_history", "MÜŞTERİ kendi kendine DOĞRULANMIŞ servis geçmişi üretebiliyor",
          `randevu durumu müşteri tarafından "${st}" yapıldı, ardından geçmiş kaydı ${hist.status} ile oluştu`);
      } else {
        note(OK, "vehicle_history", `müşteri geçmiş kaydı oluşturamıyor (${hist.status})`, String(hist.body?.error || "").slice(0, 120));
      }
    }
  }

  // ============================================================ 3) IDOR / BAŞKASININ KAYDI
  {
    const otherAppt = await api("POST", "/api/appointments", {
      token: owner2.token,
      body: { mechanicId: mech.id, mechanicName: "X", customer: "Y", vehicle: "Z", date: "3 Ocak", time: "12:00", status: "Sırada", issue: "i" },
    });
    if (otherAppt.status === 201) {
      const readIt = await api("GET", `/api/appointments/${otherAppt.body.id}`, { token: owner.token });
      if (readIt.status === 200) note(HIGH, "IDOR", "başka kullanıcının randevusu OKUNABİLİYOR", `durum ${readIt.status}`);
      const patchIt = await tryPatch(`/api/appointments/${otherAppt.body.id}`, owner.token, { issue: "değiştirildi" });
      if (patchIt.status < 300) note(CRIT, "IDOR", "başka kullanıcının randevusu DEĞİŞTİRİLEBİLİYOR", `durum ${patchIt.status}`);
      const delIt = await api("DELETE", `/api/appointments/${otherAppt.body.id}`, { token: owner.token });
      if (delIt.status < 300) note(CRIT, "IDOR", "başka kullanıcının randevusu SİLİNEBİLİYOR", `durum ${delIt.status}`);
    }
  }

  // ============================================================ 4) YORUM AKIŞI
  {
    // Hiç randevusu olmayan bir kullanıcı yorum yazabiliyor mu, ve "doğrulanmış" rozeti alabiliyor mu?
    const rv = await api("POST", `/api/mechanics/${mech2.id}/reviews`, {
      token: owner2.token, body: { rating: 5, comment: "Hiç gitmedim ama harika", verified: true },
    });
    if (rv.status === 201 || rv.status === 200) {
      const stored = rows(`SELECT rating, verified, authorId FROM mechanic_reviews WHERE mechanicId = ?`, mech2.id).slice(-1)[0];
      note(stored?.verified ? HIGH : LOW, "reviews",
        `randevusu OLMAYAN kullanıcı yorum yazabiliyor (${rv.status})`,
        `verified=${stored?.verified} — doğrulanmış rozeti ${stored?.verified ? "UYDURULABİLİYOR" : "verilmiyor (doğru)"}`);
    }
    // Aynı kullanıcı ikinci yorumu yazabiliyor mu (tek yorum kuralı var mı)?
    const rv2 = await api("POST", `/api/mechanics/${mech2.id}/reviews`, { token: owner2.token, body: { rating: 1, comment: "İkinci yorum" } });
    if (rv2.status === 201 || rv2.status === 200) note(MED, "reviews", "aynı kullanıcı AYNI tamirciye ikinci yorum yazabiliyor", `durum ${rv2.status}`);
    // Puanı doğrudan yazabiliyor mu (10 üzerinden, negatif)?
    for (const bad of [0, -5, 99, 3.7, "5"]) {
      const r = await api("POST", `/api/mechanics/${mech.id}/reviews`, { token: owner.token, body: { rating: bad, comment: `sınır ${bad}` } });
      if (r.status === 201 || r.status === 200) {
        const last = rows(`SELECT rating FROM mechanic_reviews WHERE mechanicId = ? ORDER BY id DESC LIMIT 1`, mech.id)[0];
        note(MED, "reviews", `geçersiz puan kabul edildi: gönderilen ${JSON.stringify(bad)}`, `kaydedilen ${last?.rating}`);
      }
    }
  }

  // ============================================================ 5) MÜKERRER / YARIŞ
  {
    // Aynı randevu isteğini 10 kez EŞZAMANLI gönder: aynı saate 10 randevu oluşuyor mu?
    const payload = { mechanicId: mech.id, mechanicName: "M", customer: "C", vehicle: "V",
                      date: "4 Ocak", time: "09:00", status: "Sırada", issue: "yarış" };
    const res = await Promise.all(Array.from({ length: 10 }, () => api("POST", "/api/appointments", { token: owner.token, body: payload })));
    const created = res.filter((r) => r.status === 201).length;
    const same = rows(`SELECT COUNT(*) n FROM appointments WHERE mechanicId = ? AND date = '4 Ocak' AND time = '09:00'`, mech.id)[0].n;
    if (same > 1) note(HIGH, "race", "AYNI SAATE birden fazla randevu oluşabiliyor (slot kilidi yok)", `${created} istek 201, veritabanında ${same} kayıt`);
  }
  {
    // Aynı teklifi eşzamanlı kabul et: iki kez "accepted" olabiliyor mu?
    const qr = await api("POST", "/api/quote-requests", { token: owner.token, body: { issue: "yarış", mechanicIds: [mech.id, mech2.id], vehicle: "V", status: "open" } });
    if (qr.status === 201) {
      const o1 = await api("POST", "/api/quote-offers", { token: mech.token, body: { requestId: qr.body.id, mechanicId: mech.id, status: "submitted", price: 100 } });
      const o2 = await api("POST", "/api/quote-offers", { token: mech2.token, body: { requestId: qr.body.id, mechanicId: mech2.id, status: "submitted", price: 200 } });
      if (o1.status === 201 && o2.status === 201) {
        const accepts = await Promise.all([
          api("POST", `/api/quote-offers/${o1.body.id}/accept`, { token: owner.token }),
          api("POST", `/api/quote-offers/${o2.body.id}/accept`, { token: owner.token }),
        ]);
        const acceptedCount = rows(`SELECT COUNT(*) n FROM quote_offers WHERE requestId = ? AND status = 'accepted'`, qr.body.id)[0].n;
        if (acceptedCount > 1) note(HIGH, "race", "aynı istekte İKİ teklif birden kabul edilebiliyor", `kabul durumları: ${accepts.map((a) => a.status).join(",")} · veritabanı: ${acceptedCount}`);
      }
    }
  }

  // ============================================================ 6) VERİ SIZINTISI
  {
    // Herkese açık tamirci listesi hassas alan döndürüyor mu?
    const pub = await api("GET", "/api/mechanics");
    const first = Array.isArray(pub.body) ? pub.body[0] : null;
    for (const f of ["password", "iban", "bankName", "accountHolder", "signupIpHash", "verificationDocs", "email", "phone", "savedSearches", "favoriteIds"]) {
      if (first && f in first) note(f === "password" || f === "iban" || f === "signupIpHash" ? CRIT : MED,
        "leak", `herkese açık tamirci listesinde "${f}" alanı var`, JSON.stringify(first[f])?.slice(0, 80));
    }
    const pubO = await api("GET", "/api/owners");
    const firstO = Array.isArray(pubO.body) ? pubO.body[0] : null;
    if (firstO) {
      for (const f of ["password", "email", "phone", "address", "signupIpHash"]) {
        if (f in firstO) note(f === "password" || f === "signupIpHash" ? CRIT : MED, "leak", `owners listesinde "${f}" alanı var`, JSON.stringify(firstO[f])?.slice(0, 80));
      }
    } else if (pubO.status === 200) note(OK, "leak", "owners listesi boş/filtreli", `durum ${pubO.status}`);
    else note(OK, "leak", `owners listesi korumalı (${pubO.status})`, "");
  }

  // ============================================================ 7) SAYFALAMA / SORGU KÖTÜYE KULLANIMI
  {
    for (const q of ["?limit=-1", "?limit=999999999", "?limit=abc", "?offset=-5", "?limit=1e9", "?limit=0"]) {
      const r = await api("GET", `/api/mechanics${q}`);
      if (r.status >= 500) note(MED, "pagination", `sorgu parametresi 500 üretiyor: ${q}`, String(r.body?.error || "").slice(0, 80));
      else if (Array.isArray(r.body) && r.body.length > 1000) note(MED, "pagination", `üst sınır aşıldı: ${q}`, `${r.body.length} kayıt`);
    }
    // analytics günleri
    for (const q of ["?days=-1", "?days=999999", "?days=abc"]) {
      const r = await api("GET", `/api/analytics/summary${q}`, { token: admin });
      if (r.status >= 500) note(MED, "analytics", `days parametresi 500 üretiyor: ${q}`, "");
    }
  }

  // ============================================================ 8) HATA GÖVDELERİ SIZDIRIYOR MU
  {
    const probes = [
      ["GET", "/api/mechanics/'; DROP TABLE mechanics; --"],
      ["GET", "/api/mechanics/99999999999999999999"],
      ["GET", "/api/appointments/abc"],
      ["POST", "/api/listings"],
    ];
    for (const [m, p] of probes) {
      const r = await api(m, p, { token: owner.token, body: m === "POST" ? { brand: { nested: true } } : undefined });
      const text = String(r.raw || "");
      if (/at \/|\.js:\d+|SQLITE|sqlite|node:internal|Error:/.test(text)) {
        note(MED, "error-leak", `${m} ${p} yanıtı iç detay sızdırıyor`, text.slice(0, 160));
      }
      if (r.status >= 500) note(MED, "error-leak", `${m} ${p} → ${r.status}`, text.slice(0, 120));
    }
    // Tablo hâlâ duruyor mu (SQL enjeksiyonu)?
    const stillThere = rows(`SELECT COUNT(*) n FROM mechanics`)[0].n;
    if (stillThere === 0) note(CRIT, "sql", "mechanics tablosu BOŞ — enjeksiyon çalışmış olabilir", "");
  }

  // ============================================================ 9) OTURUM
  {
    const tmp = await createUser("owner", { name: "Oturum", email: "audit.session@test.local" });
    await api("POST", "/api/auth/logout", { token: tmp.token });
    const afterLogout = await api("GET", "/api/auth/me", { token: tmp.token });
    if (afterLogout.status === 200) note(CRIT, "auth", "ÇIKIŞTAN SONRA eski jeton hâlâ çalışıyor", `durum ${afterLogout.status}`);
    // Jeton kurcalama
    for (const bad of ["", "Bearer", "x".repeat(64), tmp.token + "a", tmp.token.slice(0, -1)]) {
      const r = await api("GET", "/api/auth/me", { token: bad });
      if (r.status === 200) note(CRIT, "auth", "GEÇERSİZ jetonla /me çalışıyor", `jeton: ${bad.slice(0, 20)}`);
    }
  }
  // ============================================================ 10) İKİNCİ TUR: YENİ UÇLAR
  /**
   * DÜZELTMELER YENİ YÜZEY AÇTI. Bir güvenlik düzeltmesinin başka bir açık üretmesi bu işin en
   * sık rastlanan tuzağı: eklediğim dört uç (teklif görüldü/yanıt, öne çıkar/kaldır) ve
   * randevu router'ı artık kendi yetki kontrollerini yapmak zorunda. Hepsini saldırgan gibi deniyorum.
   */
  {
    // Kurban ilan: owner'a ait.
    const victim = await api("POST", "/api/listings", {
      token: owner.token, body: { brand: "BMW", model: "X5", year: 2021, km: 20000, price: 900000, sellerType: "owner", status: "active" },
    });
    if (victim.status !== 201) note(MED, "yeni-uç", `ilan oluşturulamadı (${victim.status})`, victim.raw?.slice(0, 120));
    else {
      const lid = victim.body.id;
      // owner2 teklif veriyor (meşru).
      const off = await api("POST", `/api/listings/${lid}/offers`, { token: owner2.token, body: { amount: "850000" } });
      if (off.status !== 201) note(MED, "yeni-uç", `teklif verilemedi (${off.status})`, off.raw?.slice(0, 120));
      const offerId = JSON.parse(row(`SELECT offers FROM listings WHERE id = ?`, lid).offers)[0]?.id;

      // A) BAŞKASI teklifleri "görüldü" işaretleyebiliyor mu?
      const seenByOther = await api("POST", `/api/listings/${lid}/offers/seen`, { token: owner2.token });
      if (seenByOther.status < 400) note(HIGH, "yeni-uç", "İLAN SAHİBİ OLMAYAN teklifleri 'görüldü' işaretleyebiliyor", `durum ${seenByOther.status}`);
      const seenAnon = await api("POST", `/api/listings/${lid}/offers/seen`);
      if (seenAnon.status < 400) note(CRIT, "yeni-uç", "OTURUMSUZ 'görüldü' işaretlenebiliyor", `durum ${seenAnon.status}`);

      // B) BAŞKASI teklifi kabul/ret edebiliyor mu? (alıcı kendi teklifini kabul ederse anlaşma uydurur)
      const respByBuyer = await api("POST", `/api/listings/${lid}/offers/${offerId}/respond`, { token: owner2.token, body: { status: "accepted" } });
      if (respByBuyer.status < 400) note(CRIT, "yeni-uç", "ALICI KENDİ teklifini kabul edebiliyor", `durum ${respByBuyer.status}`);
      const respByMech = await api("POST", `/api/listings/${lid}/offers/${offerId}/respond`, { token: mech.token, body: { status: "accepted" } });
      if (respByMech.status < 400) note(HIGH, "yeni-uç", "İLGİSİZ tamirci teklifi yanıtlayabiliyor", `durum ${respByMech.status}`);
      // Geçersiz durum değeri
      const badStatus = await api("POST", `/api/listings/${lid}/offers/${offerId}/respond`, { token: owner.token, body: { status: "sold" } });
      if (badStatus.status < 400) note(MED, "yeni-uç", "geçersiz teklif yanıtı kabul edildi", `status=sold → ${badStatus.status}`);
      // Var olmayan teklif
      const noOffer = await api("POST", `/api/listings/${lid}/offers/99999/respond`, { token: owner.token, body: { status: "accepted" } });
      if (noOffer.status !== 404) note(LOW, "yeni-uç", `var olmayan teklif için 404 değil ${noOffer.status}`, "");
      // Meşru yanıt + ikinci yanıt engelli mi?
      const ok1 = await api("POST", `/api/listings/${lid}/offers/${offerId}/respond`, { token: owner.token, body: { status: "rejected" } });
      if (ok1.status !== 200) note(MED, "yeni-uç", `SATICI teklifi reddedemiyor (${ok1.status})`, ok1.raw?.slice(0, 120));
      const ok2 = await api("POST", `/api/listings/${lid}/offers/${offerId}/respond`, { token: owner.token, body: { status: "accepted" } });
      if (ok2.status < 400) note(HIGH, "yeni-uç", "reddedilmiş teklif sonradan KABUL edilebiliyor", `durum ${ok2.status}`);
      // Teklif TUTARI yanıt sırasında değiştirilebiliyor mu?
      const amountBefore = JSON.parse(row(`SELECT offers FROM listings WHERE id = ?`, lid).offers).find((o) => String(o.id) === String(offerId))?.amount;
      await api("POST", `/api/listings/${lid}/offers/${offerId}/respond`, { token: owner.token, body: { status: "rejected", amount: "1" } });
      const amountAfter = JSON.parse(row(`SELECT offers FROM listings WHERE id = ?`, lid).offers).find((o) => String(o.id) === String(offerId))?.amount;
      if (String(amountAfter) !== String(amountBefore)) note(HIGH, "yeni-uç", "SATICI yanıt verirken teklif TUTARINI değiştirebiliyor", `${amountBefore} → ${amountAfter}`);

      // C) BAŞKASININ ilanı öne çıkarılabiliyor mu?
      const featOther = await api("POST", `/api/listings/${lid}/feature`, { token: owner2.token });
      if (featOther.status < 400) note(HIGH, "yeni-uç", "BAŞKASININ ilanı öne çıkarılabiliyor", `durum ${featOther.status}`);
      const featAnon = await api("POST", `/api/listings/${lid}/feature`);
      if (featAnon.status < 400) note(CRIT, "yeni-uç", "OTURUMSUZ ilan öne çıkarılabiliyor", `durum ${featAnon.status}`);
      // Meşru: sahibi öne çıkarıyor, SÜRE yazılıyor mu?
      const feat = await api("POST", `/api/listings/${lid}/feature`, { token: owner.token });
      const fr = row(`SELECT featured, featuredUntil FROM listings WHERE id = ?`, lid);
      if (feat.status !== 200) note(MED, "yeni-uç", `sahibi ilanını öne çıkaramıyor (${feat.status})`, feat.raw?.slice(0, 120));
      else if (!fr.featuredUntil) note(HIGH, "yeni-uç", "öne çıkarma SÜRESİZ yazıldı (featuredUntil boş)", "7 gün sözü tutulmuyor");
      // featured hâlâ jenerik PATCH'ten yazılabiliyor mu?
      db().prepare(`UPDATE listings SET featured = 0, featuredUntil = NULL WHERE id = ?`).run(lid);
      await api("PATCH", `/api/listings/${lid}`, { token: owner.token, body: { featured: 1 } });
      if (row(`SELECT featured AS v FROM listings WHERE id = ?`, lid).v === 1) {
        note(HIGH, "yeni-uç", "featured hâlâ jenerik PATCH'ten yazılabiliyor", "süre atlanarak süresiz öne çıkma");
      }
      // SÜRE GERÇEKTEN DOLUYOR MU: geçmiş bir tarih yazıp temizliğin çalıştığını ölç.
      db().prepare(`UPDATE listings SET featured = 1, featuredUntil = ? WHERE id = ?`).run("2000-01-01T00:00:00.000Z", lid);
      const expired = await api("GET", `/api/listings/${lid}`);
      const stillFeatured = row(`SELECT featured AS v FROM listings WHERE id = ?`, lid).v;
      if (stillFeatured === 1) {
        note(LOW, "yeni-uç", "süresi geçmiş öne çıkarma HEMEN kapanmıyor (periyodik temizlik bekliyor)",
          `okuma anında değil, 10 dakikalık süpürücüyle kapanıyor — bilinçli ödünleşim (durum ${expired.status})`);
      }
    }
  }
  {
    // D) RANDEVU ROUTER'I
    const mechAppt = await api("POST", "/api/appointments", {
      token: mech.token, body: { mechanicId: mech.id, date: "9 Ocak", time: "08:00" },
    });
    if (mechAppt.status < 400) note(HIGH, "yeni-uç", "TAMİRCİ kendine randevu oluşturabiliyor", `durum ${mechAppt.status}`);
    const anonAppt = await api("POST", "/api/appointments", { body: { mechanicId: mech.id } });
    if (anonAppt.status < 400) note(CRIT, "yeni-uç", "OTURUMSUZ randevu oluşturulabiliyor", `durum ${anonAppt.status}`);
    // Başka kullanıcı adına randevu
    const forOther = await api("POST", "/api/appointments", {
      token: owner.token, body: { mechanicId: mech.id, ownerId: owner2.id, date: "9 Ocak", time: "09:30" },
    });
    if (forOther.status === 201) {
      const who = row(`SELECT ownerId AS v FROM appointments WHERE id = ?`, forOther.body.id).v;
      if (who === owner2.id) note(HIGH, "yeni-uç", "MÜŞTERİ başkası adına randevu oluşturabiliyor", `ownerId ${who}`);
    }
    // İstemcinin gönderdiği status/autoAccepted yok sayılıyor mu?
    const forced = await api("POST", "/api/appointments", {
      token: owner.token, body: { mechanicId: mech.id, date: "10 Ocak", time: "10:30", status: "Tamamlandı", autoAccepted: 1, depositPaid: 5000, servicePrice: 1 },
    });
    if (forced.status === 201) {
      const r = row(`SELECT status, depositPaid, servicePrice FROM appointments WHERE id = ?`, forced.body.id);
      if (r.status === "Tamamlandı") note(CRIT, "yeni-uç", "MÜŞTERİ randevuyu TAMAMLANMIŞ olarak oluşturabiliyor", `status ${r.status}`);
      if (Number(r.depositPaid) === 5000) note(HIGH, "yeni-uç", "MÜŞTERİ kapora tutarını oluşturmada yazabiliyor", `depositPaid ${r.depositPaid}`);
      // Geçersiz geçişler
      for (const [from, to] of [["Sırada", "Tamamlandı"], ["Sırada", "Gelmedi"], ["Sırada", "Reddedildi"]]) {
        db().prepare(`UPDATE appointments SET status = ? WHERE id = ?`).run(from, forced.body.id);
        const tr = await api("PATCH", `/api/appointments/${forced.body.id}`, { token: owner.token, body: { status: to } });
        if (tr.status < 400) note(HIGH, "yeni-uç", `MÜŞTERİ geçersiz geçiş yapabiliyor: ${from} → ${to}`, `durum ${tr.status}`);
      }
      // Yorum işareti geri alınabiliyor mu (tekrar tekrar yorum yolu)?
      db().prepare(`UPDATE appointments SET reviewed = 1, status = 'Tamamlandı' WHERE id = ?`).run(forced.body.id);
      const unrev = await api("PATCH", `/api/appointments/${forced.body.id}`, { token: owner.token, body: { reviewed: false } });
      if (unrev.status < 400 && row(`SELECT reviewed AS v FROM appointments WHERE id = ?`, forced.body.id).v === 0) {
        note(MED, "yeni-uç", "yorum işareti GERİ ALINABİLİYOR (tekrar yorum yolu)", `durum ${unrev.status}`);
      }
    }
  }
  {
    // E) GİZLİLİK DÜZELTMESİ MEŞRU İŞİ BOZDU MU?
    const own = await api("GET", `/api/owners/${owner.id}`, { token: owner.token });
    if (own.status !== 200) note(HIGH, "regresyon", `kullanıcı KENDİ kaydını okuyamıyor (${own.status})`, "gizlilik düzeltmesi fazla kesmiş olabilir");
    else if (!own.body?.email) note(HIGH, "regresyon", "kullanıcı kendi E-POSTASINI göremiyor", "tekil okuma da kesilmiş");
    const adminList = await api("GET", "/api/owners", { token: admin });
    const adminFirst = Array.isArray(adminList.body) ? adminList.body[0] : null;
    if (adminFirst && !("email" in adminFirst)) note(MED, "regresyon", "YÖNETİCİ kullanıcı listesinde e-posta göremiyor", "yönetici paneli kullanıcı dizini bozulur");
    const mechSelf = await api("GET", `/api/mechanics/${mech.id}`, { token: mech.token });
    if (mechSelf.status === 200 && !("iban" in (mechSelf.body || {}))) {
      note(MED, "regresyon", "tamirci kendi IBAN'ını göremiyor", "ayarlar ekranı boş açılır");
    }
  }

} catch (e) {
  note(MED, "sonda", "sonda istisna attı", `${e.message}\n${e.stack?.split("\n").slice(0, 3).join("\n")}`);
} finally {
  stopServer();
}

// ============================================================ RAPOR
const order = { [CRIT]: 0, [HIGH]: 1, [MED]: 2, [LOW]: 3, [OK]: 4 };
findings.sort((a, b) => order[a.sev] - order[b.sev]);
console.log(`\n=== DENETİM SONDASI: ${findings.length} bulgu ===\n`);
for (const f of findings) {
  console.log(`[${f.sev}] ${f.area} — ${f.title}`);
  if (f.detail) console.log(`        ${f.detail}`);
}
const counts = findings.reduce((a, f) => ({ ...a, [f.sev]: (a[f.sev] || 0) + 1 }), {});
console.log(`\nÖZET: ${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(" ")}`);
