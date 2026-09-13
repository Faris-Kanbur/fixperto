/**
 * UÇTAN UCA DENETİM — 2. bölüm: kalan modüller, eşzamanlılık ve dağıtım güvenliği.
 * Aynı ilke: gerçek sunucu, gerçek SQLite, gerçek HTTP; sonuç veritabanından doğrulanıyor.
 */
import { startServer, stopServer, api, createUser, adminToken, row, rows, BASE } from "./harness.mjs";

let passed = 0;
const failures = [];
const eq = (actual, expected, name) => {
  if (JSON.stringify(actual) === JSON.stringify(expected)) passed++;
  else failures.push(`${name}\n    beklenen: ${JSON.stringify(expected)}\n    gelen   : ${JSON.stringify(actual)}`);
};
const ok = (v, name) => eq(!!v, true, name);

await startServer();
try {
  const owner = await createUser("owner", { name: "Zeynep", email: "zeynep@example.com", phone: "+905321230001" });
  const owner2 = await createUser("owner", { name: "Kerem", email: "kerem@example.com", phone: "+905321230002" });
  const mech = await createUser("mechanic", { name: "Anadolu Oto", email: "anadolu@example.com", phone: "+905331230003" });
  const admin = await adminToken();

  // ============================================================ DESTEK TALEPLERİ (özel veri)
  const ticket = await api("POST", "/api/tickets", {
    token: owner.token,
    body: { fromId: owner2.id, fromType: "mechanic", subject: "Sorun", description: "Açıklama", status: "open" },
  });
  eq(ticket.status, 201, "destek talebi oluşturuldu");
  const tDb = row("SELECT fromId, fromType FROM support_tickets WHERE id = ?", ticket.body.id);
  eq([tDb.fromId, tDb.fromType], [owner.id, "owner"], "talep sahibi ve türü oturumdan (istemci başkasını göndermişti)");
  eq((await api("GET", "/api/tickets", { token: owner2.token })).body.some((x) => x.id === ticket.body.id), false,
    "başka kullanıcı talebi listede görmüyor");
  eq((await api("GET", `/api/tickets/${ticket.body.id}`, { token: owner2.token })).status, 403, "talep tekil okumada da korunuyor");
  eq((await api("GET", `/api/tickets/${ticket.body.id}`, { token: admin })).status, 200, "yönetici talebi görebiliyor");

  // ROLLER ARASI ID ÇAKIŞMASI: owner #N ile mechanic #N farklı kişiler.
  const sameIdMech = rows("SELECT id FROM mechanics WHERE id = ?", owner.id);
  if (sameIdMech.length > 0) {
    eq((await api("GET", `/api/tickets/${ticket.body.id}`, { token: mech.token })).status, 403,
      "aynı id'ye sahip tamirci araç sahibinin talebini okuyamıyor");
  } else { passed++; }

  // ============================================================ ÇOKLU TEKLİF (quotes)
  const qr = await api("POST", "/api/quote-requests", {
    token: owner.token,
    body: { ownerId: owner2.id, issue: "Motor sesi", mechanicIds: [mech.id], vehicle: "BMW 320i", status: "open" },
  });
  eq(qr.status, 201, "fiyat teklifi isteği oluşturuldu");
  const qrId = qr.body.id;
  eq(row("SELECT ownerId FROM quote_requests WHERE id = ?", qrId).ownerId, owner.id, "istek sahibi oturumdan");
  eq((await api("GET", `/api/quote-requests/${qrId}`, { token: owner2.token })).status, 403, "ilgisiz kullanıcı isteği göremiyor");
  eq((await api("GET", `/api/quote-requests/${qrId}`, { token: mech.token })).status, 200, "davet edilen tamirci görebiliyor");
  const qo = await api("POST", "/api/quote-offers", { token: mech.token, body: { requestId: qrId, mechanicId: 99999, price: "2500", note: "Uygun" } });
  eq(qo.status, 201, "tamirci teklif verebiliyor");
  eq(row("SELECT mechanicId FROM quote_offers WHERE id = ?", qo.body.id).mechanicId, mech.id, "teklif veren kimliği oturumdan");
  eq((await api("POST", "/api/quote-offers", { token: owner2.token, body: { requestId: qrId, mechanicId: 12345, price: "1" } })).status, 403,
    "ilgisiz kullanıcı bu isteğe teklif veremiyor");

  // ============================================================ BLOG (herkese açık okuma / admin yazma)
  eq((await api("POST", "/api/blog", { token: owner.token, body: { title: "Sahte", slug: "sahte", status: "published" } })).status, 401,
    "blog yazısı kullanıcı tarafından oluşturulamıyor");
  const post = await api("POST", "/api/blog", { token: admin, body: { title: "Kış Bakımı", slug: "kis-bakimi", status: "published", body: "içerik" } });
  eq(post.status, 201, "yönetici blog yazısı oluşturabiliyor");
  const draft = await api("POST", "/api/blog", { token: admin, body: { title: "Taslak", slug: "taslak", status: "draft", body: "gizli" } });
  eq(draft.status, 201, "taslak oluşturuldu");
  const publicPosts = await api("GET", "/api/blog");
  eq(publicPosts.body.some((p) => p.slug === "kis-bakimi"), true, "yayınlanmış yazı herkese açık");
  eq(publicPosts.body.some((p) => p.slug === "taslak"), false, "TASLAK yazı herkese açık listede YOK");
  eq((await api("GET", "/api/blog/taslak")).status, 404, "taslak yazıya doğrudan erişilemiyor");
  eq((await api("GET", "/api/blog/kis-bakimi")).status, 200, "yayınlanmış yazı slug ile okunabiliyor");

  // ============================================================ KARİYER
  eq((await api("POST", "/api/careers", { token: mech.token, body: { title: "Sahte ilan" } })).status, 401,
    "kariyer ilanı kullanıcı tarafından oluşturulamıyor");
  const career = await api("POST", "/api/careers", { token: admin, body: { title: "Frontend", status: "published" } });
  eq(career.status, 201, "yönetici kariyer ilanı oluşturabiliyor");
  const careerDraft = await api("POST", "/api/careers", { token: admin, body: { title: "Gizli", status: "draft" } });
  eq(careerDraft.status, 201, "kariyer taslağı oluşturuldu");
  const publicCareers = await api("GET", "/api/careers");
  eq(publicCareers.body.some((c) => c.title === "Frontend"), true, "yayındaki ilan herkese açık");
  eq(publicCareers.body.some((c) => c.title === "Gizli"), false, "taslak kariyer ilanı herkese açık DEĞİL");

  // ============================================================ DUYURULAR
  eq((await api("POST", "/api/broadcasts", { token: mech.token, body: { title: "Sahte duyuru" } })).status, 401,
    "duyuru kullanıcı tarafından oluşturulamıyor");
  eq((await api("POST", "/api/broadcasts", { token: admin, body: { audience: "all", message: "Cumartesi bakım var" } })).status, 201,
    "yönetici duyuru oluşturabiliyor");
  ok(row("SELECT id FROM broadcasts WHERE message = ?", "Cumartesi bakım var"), "duyuru veritabanına yazıldı");
  // Zorunlu alan eksikse KULLANICI HATASI (400) dönmeli, sunucu hatası (500) değil.
  eq((await api("POST", "/api/broadcasts", { token: admin, body: { title: "eksik" } })).status, 400,
    "eksik zorunlu alan 400 dönüyor (500 değil)");
  eq((await api("GET", "/api/broadcasts")).status, 200, "duyurular herkese açık okunuyor");

  // ============================================================ EŞZAMANLILIK (kayıp güncelleme)
  // İki taraf AYNI ANDA mesaj gönderdiğinde ikisi de kaydedilmeli. Eski tasarımda dizinin tamamı
  // istemciden yazıldığı için son yazan kazanıyor, diğerinin mesajı SESSİZCE siliniyordu.
  const convo = await api("POST", "/api/conversations", { token: owner.token, body: { mechanicId: mech.id, messages: [] } });
  const convoId = convo.body.id;
  await Promise.all([
    api("POST", `/api/conversations/${convoId}/messages`, { token: owner.token, body: { messages: [{ text: "araç sahibi mesajı" }] } }),
    api("POST", `/api/conversations/${convoId}/messages`, { token: mech.token, body: { messages: [{ text: "tamirci mesajı" }] } }),
  ]);
  const convoMsgs = JSON.parse(row("SELECT messages FROM conversations WHERE id = ?", convoId).messages);
  eq(convoMsgs.length, 2, "EŞZAMANLI iki mesajın ikisi de kaydedildi (kayıp güncelleme yok)");
  eq(new Set(convoMsgs.map((m) => m.sender)).size, 2, "her iki taraf da doğru damgalandı");
  eq(new Set(convoMsgs.map((m) => m.id)).size, 2, "mesaj kimlikleri çakışmıyor");

  // Aynı senaryo tekliflerde: iki farklı alıcı aynı anda teklif verirse ikisi de durmalı.
  const listing = await api("POST", "/api/listings", { token: mech.token, body: { brand: "Opel", model: "Astra", year: 2015, km: 120000, price: "400.000₺" } });
  const listingId = listing.body.id;
  const owner3 = await createUser("owner", { name: "Deniz", email: "deniz@example.com", phone: "+905321230004" });
  await Promise.all([
    api("POST", `/api/listings/${listingId}/offers`, { token: owner.token, body: { amount: 390000 } }),
    api("POST", `/api/listings/${listingId}/offers`, { token: owner3.token, body: { amount: 395000 } }),
  ]);
  const offers = JSON.parse(row("SELECT offers FROM listings WHERE id = ?", listingId).offers);
  eq(offers.length, 2, "EŞZAMANLI iki teklifin ikisi de kaydedildi");
  eq(new Set(offers.map((o) => o.buyerId)).size, 2, "teklifler doğru alıcılara ait");

  // ============================================================ PAYLAŞIM / GÖRÜNTÜLENME
  const share = await api("POST", "/api/share-events", { body: { targetType: "listing", targetId: listingId, channel: "whatsapp", refCode: "abc123" } });
  eq(share.status, 201, "paylaşım olayı kaydedildi (girişsiz de olabilir)");
  ok(row("SELECT id FROM share_events WHERE refCode = ?", "abc123"), "paylaşım veritabanında");
  const pv = await api("POST", "/api/profile-views", { body: { targetType: "mechanic", targetId: mech.id } });
  eq(pv.status, 201, "profil görüntülenmesi kaydedildi");
  ok(row("SELECT id FROM profile_views WHERE targetType = 'mechanic' AND targetId = ?", mech.id), "görüntülenme veritabanında");
  eq((await api("GET", `/api/mechanics/${mech.id}/share`)).status >= 400, true, "paylaşım sayacı GET ile artırılamıyor (yanlış method)");
  const beforeShare = row("SELECT shareCount FROM mechanics WHERE id = ?", mech.id).shareCount;
  await api("POST", `/api/mechanics/${mech.id}/share`);
  eq(row("SELECT shareCount FROM mechanics WHERE id = ?", mech.id).shareCount, beforeShare + 1, "paylaşım sayacı atomik olarak arttı");

  // ============================================================ ANALİTİK OLAYLARI
  const ev = await api("POST", "/api/analytics/events", {
    body: { events: [
      { name: "compare_pair", meta: { pairA: "Audi A4", pairB: "BMW 320i" } },
      { name: "bilinmeyen_olay", meta: { x: 1 } },
      { name: "search_performed", meta: { query: "fren", sifre: "gizli-bilgi" } },
    ] },
  });
  eq(ev.status >= 200 && ev.status < 300, true, "analitik olayları kabul edildi");
  eq(rows("SELECT id FROM analytics_events WHERE name = 'bilinmeyen_olay'").length, 0, "izin listesinde olmayan olay YAZILMADI");
  const cmp = row("SELECT meta FROM analytics_events WHERE name = 'compare_pair'");
  ok(cmp && JSON.parse(cmp.meta).pairA === "Audi A4", "karşılaştırma çifti kaydedildi");
  const searchEv = row("SELECT meta FROM analytics_events WHERE name = 'search_performed'");
  eq(JSON.parse(searchEv.meta).sifre, undefined, "izin listesi dışındaki meta alanı SIZDIRILMADI");
  const cmpRes = await api("GET", "/api/analytics/comparisons", { token: admin });
  eq(cmpRes.status, 200, "karşılaştırma raporu çalışıyor");
  eq(cmpRes.body.pairs[0]?.a, "Audi A4", "rapor çifti doğru döndürüyor");
  eq((await api("GET", "/api/analytics/comparisons?days=30", { token: admin })).status, 200, "tarih aralıklı rapor da çalışıyor");
  eq((await api("GET", "/api/analytics/overview", { token: admin })).status, 200, "genel bakış aralıksız çalışıyor");
  eq((await api("GET", "/api/analytics/searches", { token: admin })).status, 200, "arama raporu aralıksız çalışıyor");

  // ============================================================ İLANDAKİ GEÇMİŞ
  const histListing = await api("POST", "/api/listings", { token: owner.token, body: { brand: "Ford", model: "Focus", year: 2016, km: 100000, price: "500.000₺", vin: "WBA3B5C50DF999999", showHistory: true } });
  const hl = await api("GET", `/api/vehicle-history/listing/${histListing.body.id}`);
  eq(hl.status, 200, "ilan geçmişi ucu çalışıyor");
  eq([hl.body.shown, hl.body.unverified], [false, true], "satıcının o VIN'e ait kaydı yoksa geçmiş gösterilmiyor");

  // ============================================================ GÜVENLİK BAŞLIKLARI / CORS / 404
  const headRes = await fetch(`${BASE}/api/health`);
  eq(headRes.headers.get("x-content-type-options"), "nosniff", "X-Content-Type-Options gönderiliyor");
  ok(headRes.headers.get("x-frame-options"), "X-Frame-Options gönderiliyor");
  eq(headRes.headers.get("x-powered-by"), null, "x-powered-by gizlenmiş");
  const corsRes = await fetch(`${BASE}/api/health`, { headers: { Origin: "https://kotu-site.example" } });
  eq(corsRes.headers.get("access-control-allow-origin"), null, "bilinmeyen origin'e CORS izni YOK");
  eq((await api("GET", "/api/olmayan-uc")).status, 404, "olmayan uç 404");
  eq((await api("GET", "/robots.txt")).status, 200, "robots.txt yayında");
  eq((await api("GET", "/sitemap.xml")).status, 200, "sitemap.xml yayında");
  ok(!/taslak/.test((await api("GET", "/sitemap.xml")).raw), "sitemap taslak yazıyı içermiyor");

  // ============================================================ ŞİFRE UÇLARI (bu denetimde bulundu)
  /**
   * AÇIK 1: `/:id/verify-password` hız sınırsız bir şifre kâhiniydi — çalınmış bir oturum
   * token'ı, hesabın DÜZ METİN şifresini deneme-yanılma ile bulabiliyordu. Uç kaldırıldı.
   * AÇIK 2: `/:id/set-password` "kendisi ya da admin"di — çalınmış token, MEVCUT ŞİFREYİ
   * BİLMEDEN şifreyi değiştirip gerçek sahibi kalıcı olarak dışarıda bırakabiliyordu; bu,
   * /api/auth/change-password'ün iki korumasını (mevcut şifre + diğer oturumları kapat)
   * tamamen bypass ediyordu. Uç artık yalnızca admin'e açık ve hedefin oturumlarını kapatıyor.
   */
  eq((await api("POST", `/api/owners/${owner.id}/verify-password`, { token: owner.token, body: { password: owner.password } })).status, 404,
    "verify-password ucu artık yok (şifre kâhini kaldırıldı)");
  eq((await api("POST", `/api/owners/${owner.id}/set-password`, { token: owner.token, body: { password: "yeni-sifre-123" } })).status, 403,
    "kullanıcı kendi şifresini set-password ile DEĞİŞTİREMEZ (mevcut şifre sorulmadan)");
  ok((await api("POST", "/api/auth/login", { body: { email: owner.email, password: owner.password } })).status === 200,
    "reddedilen set-password gerçekten yazmamış — eski şifre hâlâ geçerli");
  eq((await api("POST", `/api/owners/${owner.id}/set-password`, { token: owner2.token, body: { password: "yeni-sifre-123" } })).status, 403,
    "başka bir kullanıcı da set-password yapamaz (IDOR)");

  // Admin sıfırlaması çalışıyor VE hedefin tüm oturumlarını kapatıyor.
  const victim = await createUser("owner", { name: "Mağdur", email: "magdur@example.com", phone: "+905321230009" });
  eq((await api("GET", "/api/auth/me", { token: victim.token })).status, 200, "mağdurun oturumu sıfırlamadan önce geçerli");
  const reset = await api("POST", `/api/owners/${victim.id}/set-password`, { token: admin, body: { password: "admin-koydu-123" } });
  eq(reset.status, 200, "admin şifre sıfırlayabiliyor");
  ok(reset.body.sessionsClosed >= 1, "sıfırlama hedefin oturumlarını kapattı");
  eq((await api("GET", "/api/auth/me", { token: victim.token })).status, 401,
    "sıfırlamadan sonra ESKİ token ölü (ele geçirilmiş oturum ayakta kalmıyor)");
  eq(rows("SELECT tokenHash FROM sessions WHERE userId = ? AND role = 'owner'", victim.id).length, 0,
    "veritabanında da oturum kalmadı");
  ok((await api("POST", "/api/auth/login", { body: { email: victim.email, password: "admin-koydu-123" } })).status === 200,
    "yeni şifre gerçekten yazıldı");
  eq((await api("POST", `/api/owners/${victim.id}/set-password`, { token: admin, body: { password: "kisa" } })).status, 400,
    "kısa şifre reddediliyor");

  // ============================================================ HIZ SINIRI GERÇEKTEN ÇALIŞIYOR MU
  let blocked = false;
  for (let i = 0; i < 45; i++) {
    const r = await api("POST", "/api/vehicle-history/lookup", { token: owner.token, body: { vin: "WBA3B5C50DF12345" + (i % 10) } });
    if (r.status === 429) { blocked = true; break; }
  }
  eq(blocked, true, "VIN sorgulamada hız sınırı GERÇEKTEN devreye giriyor");
  // Sınır diğer kullanıcıyı/ucu kilitlememeli (aynı IP olsa da farklı sayaç).
  eq((await api("GET", "/api/auth/me", { token: owner.token })).status, 200, "hız sınırı diğer uçları etkilemiyor");
} finally {
  stopServer();
}

if (failures.length === 0) {
  console.log(`OK uçtan uca 2 (${passed})`);
  process.exit(0);
}
console.log(`BAŞARISIZ uçtan uca 2 — ${failures.length}/${passed + failures.length}`);
for (const f of failures) console.log("  ✗ " + f);
process.exit(1);
