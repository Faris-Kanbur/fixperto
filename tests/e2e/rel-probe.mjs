/** İLİŞKİ DENETİMİ SONDASI — raporlar, iddia etmez. run.mjs bunu çalıştırmaz. */
import { startServer, stopServer, api, row, rows, createUser, adminToken, skipIfUnsupported, db } from "./harness.mjs";
if (skipIfUnsupported("rel-probe")) process.exit(0);
const F = [];
const rep = (id, sev, t, d) => { F.push({ id, sev, t }); console.log(`\n!! ${sev} ${id} — ${t}\n   ${d}`); };
const pass = (id, t) => console.log(`   ok ${id} — ${t}`);

await startServer();
try {
  const CA = await createUser("owner", { name: "Customer A", email: "r-ca@x.com", phone: "+905321260001" });
  const CB = await createUser("owner", { name: "Customer B", email: "r-cb@x.com", phone: "+905321260002" });
  const MA = await createUser("mechanic", { name: "Mechanic A", email: "r-ma@x.com", phone: "+905321260003" });
  const MB = await createUser("mechanic", { name: "Mechanic B", email: "r-mb@x.com", phone: "+905321260004" });
  const admin = await adminToken();
  const vA = (await api("POST", "/api/vehicles", { token: CA.token, body: { brand: "VW", model: "Golf", plate: "34CA001", year: 2020 } })).body;
  const vB = (await api("POST", "/api/vehicles", { token: CB.token, body: { brand: "BMW", model: "320i", plate: "34CB001", year: 2019 } })).body;

  // ===== 1) TEKLİF İSTEĞİ: BAŞKASININ ARACIYLA =====
  {
    const r = await api("POST", "/api/quote-requests", { token: CA.token, body: { vehicleId: vB.id, issue: "fren", mechanicIds: [MA.id], customer: "Customer A", vehicle: "BMW 320i" } });
    if (r.status === 201) rep("R01", "HIGH", "Teklif isteği BAŞKASININ aracıyla oluşturulabiliyor",
      `CA, CB'nin aracı (id ${vB.id}) için istek açtı → ${r.status}; kayıtlı vehicleId=${row(`SELECT vehicleId FROM quote_requests WHERE id=?`, r.body.id)?.vehicleId} (araç sahibi ownerId=${row(`SELECT ownerId FROM vehicles WHERE id=?`, vB.id)?.ownerId}) → yabancı araç kimliği kendi talebine bağlanıyor`);
    else pass("R01", `başkasının aracıyla istek engellendi (${r.status})`);
  }

  // ===== 2) TEKLİF: DAVET EDİLMEMİŞ TAMİRCİ =====
  let reqId;
  {
    const r = await api("POST", "/api/quote-requests", { token: CA.token, body: { vehicleId: vA.id, issue: "debriyaj", mechanicIds: [MA.id], customer: "CA", vehicle: "VW Golf" } });
    reqId = r.body?.id;
    const readByMB = await api("GET", `/api/quote-requests/${reqId}`, { token: MB.token });
    const offerByMB = await api("POST", "/api/quote-offers", { token: MB.token, body: { requestId: reqId, mechanicId: MB.id, price: 1, etaDays: 1, status: "submitted" } });
    if (readByMB.status === 403 && offerByMB.status === 201) rep("R02", "HIGH", "Davet edilmemiş tamirci teklif VEREBİLİYOR (okuma kapalı, yazma açık)",
      `MB isteği OKUYAMIYOR (${readByMB.status}) ama teklif verdi (${offerByMB.status}, price=${row(`SELECT price FROM quote_offers WHERE id=?`, offerByMB.body?.id)?.price}) → müşteri hiç seçmediği tamirciden fiyat görüyor; ayrıca 404/403/409/201 farkı requestId numaralandırma kanalı`);
    else pass("R02", `davet edilmemiş tamirci teklifi (okuma ${readByMB.status}, yazma ${offerByMB.status})`);
  }

  // ===== 3) RANDEVU ↔ ARAÇ İLİŞKİSİ VAR MI =====
  {
    const cols = rows(`PRAGMA table_info(appointments)`).map(c => c.name);
    if (!cols.includes("vehicleId")) rep("R03", "MEDIUM", "Randevu ↔ Araç ilişkisi YOK — araç yalnızca serbest METİN",
      `appointments tablosunda vehicleId sütunu yok; araç "${"VW Golf"}" gibi bir metin olarak tutuluyor. Sonuç: (a) hangi GERÇEK aracın servise girdiği veritabanında belli değil, (b) araç silinse randevu bunu bilmiyor, (c) vehicle_history VIN'i randevudan TÜRETEMİYOR — plaka metin içinde aranıyor (routes/vehicleHistory.js), yani eşleşmezse VIN'i tamirci elle yazıyor. Sütunlar: ${cols.join(",")}`);
    else pass("R03", "randevu-araç ilişkisi var");
  }

  // ===== 4) İLAN: BAŞKASININ ARACIYLA =====
  {
    const r = await api("POST", "/api/listings", { token: CA.token, body: { title: "Satılık", brand: "BMW", model: "320i", price: "300000", status: "active", vehicleId: vB.id } });
    const stored = r.body?.id ? row(`SELECT vehicleId, sellerId FROM listings WHERE id=?`, r.body.id) : null;
    if (r.status === 201 && stored?.vehicleId === vB.id)
      rep("R04", "MEDIUM", "İlan BAŞKASININ aracına bağlanabiliyor", `CA, CB'nin aracıyla (id ${vB.id}) ilan açtı → sellerId=${stored.sellerId}, vehicleId=${stored.vehicleId}`);
    else pass("R04", `ilan-araç bağı (${r.status}, vehicleId=${stored?.vehicleId})`);
  }

  // ===== 5) ARAÇ: listingId ile yabancı ilana bağlama =====
  {
    const li = await api("POST", "/api/listings", { token: CB.token, body: { title: "CB ilanı", brand: "BMW", model: "320i", price: "1", status: "active" } });
    const r = await api("PATCH", `/api/vehicles/${vA.id}`, { token: CA.token, body: { listingId: li.body.id } });
    const stored = row(`SELECT listingId FROM vehicles WHERE id=?`, vA.id)?.listingId ?? null;
    if (li.body?.id && stored === li.body.id) rep("R05", "LOW", "Araç, BAŞKASININ ilanına bağlanabiliyor", `vehicles.listingId=${stored} ama o ilan CB'nin (sellerId=${row(`SELECT sellerId FROM listings WHERE id=?`, li.body.id)?.sellerId})`);
    else pass("R05", `araç-ilan bağı (${r.status}, listingId=${stored})`);
  }

  // ===== 6) SOHBET: başka owner adına / kopya alanlar =====
  {
    const c = await api("POST", "/api/conversations", { token: CA.token, body: { mechanicId: MA.id, ownerId: CB.id, mechanicName: "SAHTE AD", mechanicImg: "x" } });
    const st = c.body?.id ? row(`SELECT ownerId, mechanicName FROM conversations WHERE id=?`, c.body.id) : null;
    if (st?.ownerId === CB.id) rep("R06", "HIGH", "Sohbet BAŞKA owner adına açılabiliyor", `gövdede ownerId=${CB.id} gönderildi, kayıtlı ownerId=${st.ownerId}`);
    else if (st?.mechanicName === "SAHTE AD") rep("R06b", "LOW", "conversations.mechanicName istemciden yazılıyor", `kayıtlı mechanicName="${st.mechanicName}"`);
    else pass("R06", `sohbet sahipliği oturumdan (ownerId=${st?.ownerId}, ad="${st?.mechanicName}")`);
    // mesaj: gönderen kimliği
    const m = await api("POST", `/api/conversations/${c.body?.id}/messages`, { token: CA.token, body: { text: "merhaba", from: "mechanic", senderId: MA.id } });
    const msgs = JSON.parse((c.body?.id ? row(`SELECT messages FROM conversations WHERE id=?`, c.body.id)?.messages : null) || "[]");
    if (msgs.at(-1)?.from === "mechanic") rep("R07", "HIGH", "Mesajın GÖNDERENİ istemciden belirleniyor", `CA "from: mechanic" gönderdi, kayıtlı: ${JSON.stringify(msgs.at(-1))}`);
    else pass("R07", `mesaj göndereni oturumdan (${JSON.stringify(msgs.at(-1)?.from)}, ${m.status})`);
  }

  // ===== 7) FAVORİ: kalıcılık + çapraz =====
  {
    const p = await api("PATCH", `/api/owners/${CA.id}`, { token: CA.token, body: { favoriteIds: [1, 2], favoriteMechanicIds: [MA.id] } });
    const st = row(`SELECT favoriteIds, favoriteMechanicIds FROM owners WHERE id=?`, CA.id);
    const cross = await api("PATCH", `/api/owners/${CA.id}`, { token: CB.token, body: { favoriteIds: [] } });
    const after = row(`SELECT favoriteIds FROM owners WHERE id=?`, CA.id)?.favoriteIds;
    if (p.status !== 200 || st?.favoriteIds !== "[1,2]") rep("R08", "HIGH", "Favori veritabanına yazılmıyor", `PATCH ${p.status}, kayıtlı=${st?.favoriteIds}`);
    else if (cross.status === 200 && after === "[]") rep("R08b", "CRITICAL", "BAŞKA kullanıcı favorileri silebiliyor", `CB, CA'nın favorilerini sildi (${cross.status})`);
    else pass("R08", `favori kalıcı ve korumalı (yazıldı=${st?.favoriteIds}, çapraz ${cross.status}, sonra=${after})`);
  }

  // ===== 8) YORUM BEĞENME (review_helpful) =====
  {
    // CA'nın MA'da tamamlanmış randevusu olmalı
    const ap = await api("POST", "/api/appointments", { token: CA.token, body: { mechanicId: MA.id, ownerId: CA.id, vehicleId: vA.id, date: "2027-06-01", time: "09:00", service: "Bakım" } });
    await api("PATCH", `/api/appointments/${ap.body.id}`, { token: MA.token, body: { status: "Sırada" } });
    await api("PATCH", `/api/appointments/${ap.body.id}`, { token: MA.token, body: { status: "Tamamlandı" } });
    const rv = await api("POST", `/api/mechanics/${MA.id}/reviews`, { token: CA.token, body: { rating: 5, comment: "iyi" } });
    const rid = rv.body?.reviewId;
    const h1 = await api("POST", `/api/mechanics/${MA.id}/reviews/${rid}/helpful`, { token: CB.token });
    const h2 = await api("POST", `/api/mechanics/${MA.id}/reviews/${rid}/helpful`, { token: CB.token });
    const n = row(`SELECT COUNT(*) n FROM review_helpful WHERE reviewId=?`, rid).n;
    const anon = await api("POST", `/api/mechanics/${MA.id}/reviews/${rid}/helpful`, {});
    if (n !== 0) rep("R09", "MEDIUM", "Beğeni iki kez sayıldı", `${n} satır`);
    else pass("R09", `beğeni aç/kapa doğru (${h1.status}/${h2.status}, satır=${n}, girişsiz ${anon.status})`);
    // yorumu başkası silebilir mi
    const delOther = await api("DELETE", `/api/mechanics/${MA.id}/reviews/${rid}`, { token: CB.token });
    const delMech = await api("DELETE", `/api/mechanics/${MA.id}/reviews/${rid}`, { token: MA.token });
    pass("R10", `yorum silme: CB ${delOther.status}, hakkındaki tamirci ${delMech.status}, duruyor=${!!row(`SELECT id FROM mechanic_reviews WHERE id=?`, rid)}`);
    // yanıt: rate limit var mı, başka tamirci yanıtlayabilir mi
    const replyOther = await api("POST", `/api/mechanics/${MA.id}/reviews/${rid}/reply`, { token: MB.token, body: { reply: "sahte yanıt" } });
    pass("R11", `yorum yanıtı: MB ${replyOther.status}`);
  }

  // ===== 9) ARAÇ GEÇMİŞİ: başkasının aracı adına kayıt =====
  {
    const r = await api("POST", "/api/vehicle-history", { token: MA.token, body: { vin: "WVWZZZ1KZAW000001", ownerId: CB.id, mechanicId: MA.id, serviceDate: "2027-01-01", description: "uydurma" } });
    const st = r.body?.id ? row(`SELECT ownerId, mechanicId FROM vehicle_history WHERE id=?`, r.body.id) : null;
    pass("R12", `araç geçmişi kaydı: ${r.status}${st ? ` ownerId=${st.ownerId} mechanicId=${st.mechanicId}` : ""} ${JSON.stringify(r.body).slice(0,110)}`);
  }

  // ===== 10) DESTEK TALEBİ (report) çapraz okuma =====
  {
    const t = await api("POST", "/api/tickets", { token: CA.token, body: { type: "complaint", subject: "gizli", description: "GİZLİ METİN", createdDate: "2027-01-01" } });
    const readB = await api("GET", `/api/tickets/${t.body?.id ?? 0}`, { token: CB.token });
    const readM = await api("GET", `/api/tickets/${t.body?.id ?? 0}`, { token: MA.token });
    const list = await api("GET", "/api/tickets", { token: CB.token });
    pass("R13", `destek talebi: CB tekil ${readB.status}, MA tekil ${readM.status}, CB liste ${Array.isArray(list.body) ? list.body.length : list.status} kayıt`);
  }

  // ===== 11) BİLDİRİM: sunucu tarafında var mı =====
  {
    const t = rows(`SELECT name FROM sqlite_master WHERE type='table'`).map(r => r.name);
    const notif = t.filter(n => /notif|bildirim/i.test(n));
    if (notif.length === 0) rep("R14", "MEDIUM", "Sunucu tarafında BİLDİRİM YOK — bildirimler tamamen istemcide",
      `bildirim tablosu yok (tablolar: ${t.length}); yani "yeni mesajınız var" gibi bildirimler veritabanından üretilmiyor, cihaz/oturum arasında taşınmıyor ve kalıcı değil`);
    else pass("R14", `bildirim tabloları: ${notif.join(",")}`);
  }

  // ===== 12) ÇAPRAZ MATRİS: her entity × her yabancı kullanıcı =====
  console.log("\n--- ÇAPRAZ ERİŞİM MATRİSİ (yabancı kullanıcı → kayıt) ---");
  const apA = (await api("POST", "/api/appointments", { token: CA.token, body: { mechanicId: MA.id, ownerId: CA.id, vehicleId: vA.id, date: "2027-07-01", time: "09:00", service: "Bakım" } })).body;
  const convA = (await api("POST", "/api/conversations", { token: CA.token, body: { mechanicId: MA.id } })).body;
  const liA = (await api("POST", "/api/listings", { token: CA.token, body: { title: "CA ilan", brand: "VW", model: "Golf", price: "1", status: "active" } })).body;
  const targets = [
    ["vehicle", `/api/vehicles/${vA.id}`], ["appointment", `/api/appointments/${apA.id}`],
    ["conversation", `/api/conversations/${convA.id}`], ["quote-request", `/api/quote-requests/${reqId}`],
    ["ticket", `/api/tickets/1`], ["owner", `/api/owners/${CA.id}`], ["listing", `/api/listings/${liA.id}`],
  ];
  const actors = [["CB(owner)", CB.token], ["MB(mechanic)", MB.token], ["girişsiz", null]];
  for (const [name, path] of targets) {
    const line = [];
    for (const [an, tok] of actors) {
      const g = await api("GET", path, tok ? { token: tok } : {});
      const p = await api("PATCH", path, tok ? { token: tok, body: { status: "x" } } : { body: { status: "x" } });
      const d = await api("DELETE", path, tok ? { token: tok } : {});
      line.push(`${an}: G${g.status}/P${p.status}/D${d.status}`);
    }
    console.log(`  ${name.padEnd(14)} ${line.join("  |  ")}`);
  }

  console.log(`\n=========== SONDA: ${F.length} bulgu ===========`);
  for (const f of F) console.log(`  ${f.sev.padEnd(8)} ${f.id}  ${f.t}`);
} finally { stopServer(); }
