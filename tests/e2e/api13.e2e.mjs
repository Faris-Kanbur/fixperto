/**
 * BİLDİRİMLER (notifications) — GERÇEK SUNUCUYA KARŞI.
 * ================================================================================================
 * Bu uç bu oturumda eklendi (bkz. el kitabı 15.1 "backend'e taşındı"): bildirim artık istemci
 * state'i değil, GERÇEK bir alıcıya (recipientRole + recipientId) bağlı kalıcı bir kayıt. Otomatik
 * güvenlik matrisi (api3.e2e.mjs) bu ucu genel hijyen için zaten tarıyor (401/500/hassas alan);
 * burada ucun KENDİ iş kuralları sınanıyor: IDOR (başkasının bildirimini görme), var olmayan
 * alıcıya yazma, duyuru (recipientId=NULL) yalnızca yönetici, çoklu alıcı tek çağrıda.
 */
import {
  startServer, stopServer, api, row, rows, createUser, adminToken, skipIfUnsupported,
} from "./harness.mjs";
import { eq, ok, report } from "../_harness.mjs";

if (skipIfUnsupported("uçtan uca bildirimler")) process.exit(0);

await startServer();
try {
  const O1 = await createUser("owner", { name: "Bildirim Owner Bir", email: "a13-o1@example.com", phone: "+905321290001" });
  const O2 = await createUser("owner", { name: "Bildirim Owner İki", email: "a13-o2@example.com", phone: "+905321290002" });
  const M1 = await createUser("mechanic", { name: "Bildirim Tamirci Bir", email: "a13-m1@example.com", phone: "+905321290003" });
  const M2 = await createUser("mechanic", { name: "Bildirim Tamirci İki", email: "a13-m2@example.com", phone: "+905321290004" });
  const admin = await adminToken();

  // ===== 1) TEMEL AKIŞ + IDOR ====================================================================
  {
    eq((await api("GET", "/api/notifications")).status, 401, "girişsiz liste okunamıyor");
    eq((await api("GET", "/api/notifications", { token: O1.token })).body.length, 0, "yeni hesabın bildirimi yok");

    const created = await api("POST", "/api/notifications", {
      token: M1.token,
      body: { recipients: [{ recipientRole: "owner", recipientId: O1.id }], title: "Yeni randevu", body: "Test", targetType: "appointment", targetId: 1 },
    });
    eq(created.status, 201, "tamirci bir araç sahibine bildirim oluşturabiliyor");
    eq(created.body.length, 1, "tek alıcı için tek kayıt döndü");
    const notifId = created.body[0].id;
    ok(row("SELECT id FROM notifications WHERE id = ?", notifId), "kayıt veritabanında");

    const forO1 = await api("GET", "/api/notifications", { token: O1.token });
    eq(forO1.status, 200, "alıcı kendi bildirimini okuyabiliyor");
    ok(forO1.body.some((n) => n.id === notifId), "bildirim listede");

    const forO2 = await api("GET", "/api/notifications", { token: O2.token });
    eq(forO2.body.some((n) => n.id === notifId), false, "İLGİSİZ araç sahibi BAŞKASININ bildirimini GÖREMİYOR (IDOR)");

    const forM1 = await api("GET", "/api/notifications", { token: M1.token });
    eq(forM1.body.some((n) => n.id === notifId), false, "gönderen tamirci de owner'a giden bildirimi kendi listesinde GÖRMÜYOR (rol farklı)");
  }

  // ===== 2) VALİDASYON ===========================================================================
  {
    const noRecipients = await api("POST", "/api/notifications", { token: M1.token, body: { recipients: [], title: "x", body: "y" } });
    eq(noRecipients.status, 400, "boş alıcı listesi reddediliyor");

    const badRole = await api("POST", "/api/notifications", { token: M1.token, body: { recipients: [{ recipientRole: "admin", recipientId: 1 }], title: "x", body: "y" } });
    eq(badRole.status, 400, "geçersiz alıcı rolü reddediliyor");

    const ghost = await api("POST", "/api/notifications", { token: M1.token, body: { recipients: [{ recipientRole: "owner", recipientId: 999999 }], title: "x", body: "y" } });
    eq(ghost.status, 400, "var olmayan alıcı reddediliyor");
    eq(rows("SELECT id FROM notifications WHERE recipientId = 999999").length, 0, "reddedilen istek hiçbir satır yazmadı");

    const noTitle = await api("POST", "/api/notifications", { token: M1.token, body: { recipients: [{ recipientRole: "owner", recipientId: O1.id }], title: "", body: "y" } });
    eq(noTitle.status, 400, "boş başlık reddediliyor");

    const tooLong = await api("POST", "/api/notifications", { token: M1.token, body: { recipients: [{ recipientRole: "owner", recipientId: O1.id }], title: "x".repeat(300), body: "y" } });
    eq(tooLong.status, 400, "aşırı uzun başlık reddediliyor");
  }

  // ===== 3) DUYURU (recipientId=NULL) YALNIZCA YÖNETİCİ ==========================================
  {
    const nonAdminBroadcast = await api("POST", "/api/notifications", {
      token: M1.token, body: { recipients: [{ recipientRole: "owner", recipientId: null }], title: "Duyuru", body: "Herkese" },
    });
    eq(nonAdminBroadcast.status, 403, "tamirci duyuru gönderemiyor");
    eq(rows("SELECT id FROM notifications WHERE recipientId IS NULL").length, 0, "reddedilen duyuru hiç yazılmadı");

    const adminBroadcast = await api("POST", "/api/notifications", {
      token: admin, body: { recipients: [{ recipientRole: "owner", recipientId: null }], title: "Duyuru", body: "Herkese" },
    });
    eq(adminBroadcast.status, 201, "yönetici duyuru gönderebiliyor");
    const broadcastId = adminBroadcast.body[0].id;

    const o1Sees = await api("GET", "/api/notifications", { token: O1.token });
    ok(o1Sees.body.some((n) => n.id === broadcastId), "owner O1 duyuruyu görüyor");
    const o2Sees = await api("GET", "/api/notifications", { token: O2.token });
    ok(o2Sees.body.some((n) => n.id === broadcastId), "owner O2 de aynı duyuruyu görüyor (roldeki HERKES)");
    const m1Sees = await api("GET", "/api/notifications", { token: M1.token });
    eq(m1Sees.body.some((n) => n.id === broadcastId), false, "mechanic rolüne gönderilmeyen duyuru tamircilerde GÖRÜNMÜYOR");
  }

  // ===== 4) ÇOKLU ALICI TEK ÇAĞRIDA ===============================================================
  {
    const multi = await api("POST", "/api/notifications", {
      token: O1.token,
      body: { recipients: [{ recipientRole: "mechanic", recipientId: M1.id }, { recipientRole: "mechanic", recipientId: M2.id }], title: "Yeni teklif isteği", body: "Test" },
    });
    eq(multi.status, 201, "çoklu alıcı tek istekte kabul ediliyor");
    eq(multi.body.length, 2, "iki ayrı kayıt oluştu");
    const forM1 = await api("GET", "/api/notifications", { token: M1.token });
    const forM2 = await api("GET", "/api/notifications", { token: M2.token });
    ok(forM1.body.some((n) => n.title === "Yeni teklif isteği"), "ilk alıcı bildirimi aldı");
    ok(forM2.body.some((n) => n.title === "Yeni teklif isteği"), "ikinci alıcı da AYRI olarak bildirimi aldı");
  }

  report("bildirimler (e2e)");
} finally {
  await stopServer();
}
