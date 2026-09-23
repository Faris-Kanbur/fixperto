/**
 * İKİ ARAÇ SAHİBİ ARASI SOHBET (peerOwnerId) VE SOHBET SİLME — GERÇEK SUNUCUYA KARŞI.
 * ================================================================================================
 * Bu ikisi bu oturumda eklendi (bkz. el kitabı 3.6): "Sahibinden" bir ilana ilgilenen alıcı da bir
 * araç sahibi olabildiği için mevcut owner↔mechanic sohbet şeması (conversations.mechanicId) yetmedi
 * — conversations.peerOwnerId eklendi. Sohbet silme de yeni: hem araç sahibi hem tamirci tek tek ya
 * da toplu silebiliyor. api.e2e.mjs / api9.e2e.mjs owner↔mechanic sohbetini kapsıyor ama SIFIR
 * kapsama şu ikisinde vardı: owner↔owner sohbeti ve DELETE /api/conversations/:id. Bu takım onları
 * kapatıyor.
 */
import {
  startServer, stopServer, api, row, rows, createUser, skipIfUnsupported,
} from "./harness.mjs";
import { eq, ok, report } from "../_harness.mjs";

if (skipIfUnsupported("uçtan uca owner-owner sohbet ve sohbet silme")) process.exit(0);

await startServer();
try {
  const O1 = await createUser("owner", { name: "Satıcı Araç Sahibi", email: "a12-o1@example.com", phone: "+905321280001" });
  const O2 = await createUser("owner", { name: "Alıcı Araç Sahibi", email: "a12-o2@example.com", phone: "+905321280002" });
  const O3 = await createUser("owner", { name: "Üçüncü Kişi", email: "a12-o3@example.com", phone: "+905321280003" });
  const M1 = await createUser("mechanic", { name: "Tamirci Bir", email: "a12-m1@example.com", phone: "+905321280004" });

  // ===== 1) OWNER-OWNER SOHBET AÇILIŞI ==========================================================
  {
    const opened = await api("POST", "/api/conversations", { token: O2.token, body: { peerOwnerId: O1.id } });
    eq(opened.status, 201, "araç sahibi başka bir araç sahibiyle sohbet açabiliyor");
    const convoId = opened.body.id;
    const stored = row("SELECT ownerId, peerOwnerId, mechanicId, mechanicName FROM conversations WHERE id = ?", convoId);
    eq(stored.ownerId, O2.id, "sohbeti başlatan OTURUMDAN (ownerId)");
    eq(stored.peerOwnerId, O1.id, "karşı taraf gövdeden geldiği gibi kaydedildi");
    eq(stored.mechanicId, null, "owner-owner sohbette mechanicId NULL");
    eq(stored.mechanicName, "Satıcı Araç Sahibi", "karşı tarafın adı SUNUCUDA owners tablosundan okundu, istemciden değil");

    // Kimlik uydurulamaz: mechanicName/mechanicImg gövdeden gelse bile göz ardı edilir.
    const spoofed = await api("POST", "/api/conversations", {
      token: O3.token, body: { peerOwnerId: O1.id, mechanicName: "SAHTE AD", mechanicImg: "sahte.png" },
    });
    eq(spoofed.status, 201, "üçüncü kişi de sohbet açabiliyor");
    eq(row("SELECT mechanicName FROM conversations WHERE id = ?", spoofed.body.id).mechanicName, "Satıcı Araç Sahibi",
      "gövdedeki sahte ad YOK SAYILDI — karşı tarafın adı her zaman kaynak satırdan");

    // Kendinle sohbet açılamaz.
    const selfChat = await api("POST", "/api/conversations", { token: O1.token, body: { peerOwnerId: O1.id } });
    eq(selfChat.status, 400, "kendinle sohbet açılamıyor");

    // Var olmayan bir owner'a sohbet açılamaz.
    const badPeer = await api("POST", "/api/conversations", { token: O2.token, body: { peerOwnerId: 999999 } });
    eq(badPeer.status, 400, "var olmayan peerOwnerId reddediliyor");

    // Tamirci owner-owner sohbet açamaz — bu sohbet türü yalnızca araç sahiplerine ait.
    const mechTry = await api("POST", "/api/conversations", { token: M1.token, body: { peerOwnerId: O1.id } });
    eq(mechTry.status, 403, "tamirci owner-owner sohbet başlatamıyor");

    // ===== 2) GÖRÜNÜRLÜK: sohbetin İKİ TARAFI da görebiliyor, üçüncü kişi göremiyor ============
    eq((await api("GET", `/api/conversations/${convoId}`, { token: O2.token })).status, 200, "başlatan taraf (ownerId) görebiliyor");
    eq((await api("GET", `/api/conversations/${convoId}`, { token: O1.token })).status, 200, "karşı taraf (peerOwnerId) da görebiliyor");
    eq((await api("GET", `/api/conversations/${convoId}`, { token: O3.token })).status, 403, "üçüncü bir araç sahibi GÖREMİYOR");
    eq((await api("GET", `/api/conversations/${convoId}`, { token: M1.token })).status, 403, "ilgisiz bir tamirci de GÖREMİYOR");

    const listO1 = await api("GET", "/api/conversations", { token: O1.token });
    ok(listO1.body.some((c) => c.id === convoId), "peerOwnerId tarafı sohbeti LİSTEDE de görüyor (yalnızca tekil GET değil)");

    // ===== 3) MESAJ GÖNDERME: iki taraf da yazabiliyor, senderId gerçek kimliği taşıyor ========
    const msgFromO2 = await api("POST", `/api/conversations/${convoId}/messages`, { token: O2.token, body: { messages: [{ text: "Araç hâlâ satılık mı?" }] } });
    eq(msgFromO2.status, 200, "başlatan taraf mesaj gönderebiliyor");
    const msgFromO1 = await api("POST", `/api/conversations/${convoId}/messages`, { token: O1.token, body: { messages: [{ text: "Evet, satılık." }] } });
    eq(msgFromO1.status, 200, "karşı taraf da mesaj gönderebiliyor");
    const msgs = JSON.parse(row("SELECT messages FROM conversations WHERE id = ?", convoId).messages);
    eq(msgs.every((m) => m.sender === "owner"), true, "owner-owner sohbette İKİ TARAF da sender='owner' damgalanıyor");
    eq(msgs[0].senderId, O2.id, "ilk mesajın GERÇEK kimliği senderId'de (rolden ayırt edilemediği için)");
    eq(msgs[1].senderId, O1.id, "ikinci mesajın GERÇEK kimliği senderId'de");

    const foreignMsg = await api("POST", `/api/conversations/${convoId}/messages`, { token: O3.token, body: { messages: [{ text: "araya girdim" }] } });
    eq(foreignMsg.status, 403, "üçüncü kişi owner-owner sohbete yazamıyor");
  }

  // ===== 4) SOHBET SİLME: yalnızca gerçek taraflar (ya da admin) silebiliyor ====================
  {
    const opened = await api("POST", "/api/conversations", { token: M1.token, body: { mechanicId: M1.id, ownerId: O1.id } });
    eq(opened.status, 201, "owner-mechanic sohbet açılıyor (silme testi için)");
    const convoId = opened.body.id;

    // Yabancı biri silemez, kayıt veritabanında KALIR.
    const foreignDelete = await api("DELETE", `/api/conversations/${convoId}`, { token: O2.token });
    eq(foreignDelete.status, 403, "sohbetin tarafı olmayan biri silemiyor");
    ok(row("SELECT id FROM conversations WHERE id = ?", convoId), "reddedilen silme isteği satırı SİLMEDİ");

    // Girişsiz istek de silemez.
    eq((await api("DELETE", `/api/conversations/${convoId}`)).status, 401, "girişsiz silme isteği reddediliyor");

    // Gerçek taraflardan biri (tamirci) silebiliyor.
    const realDelete = await api("DELETE", `/api/conversations/${convoId}`, { token: M1.token });
    eq(realDelete.status, 204, "sohbetin gerçek tarafı silebiliyor");
    eq(row("SELECT id FROM conversations WHERE id = ?", convoId), undefined, "sohbet veritabanından GERÇEKTEN silindi");

    // Var olmayan / zaten silinmiş bir sohbeti tekrar silmek 404.
    eq((await api("DELETE", `/api/conversations/${convoId}`, { token: M1.token })).status, 404, "zaten silinmiş sohbeti tekrar silmek 404");
  }

  // ===== 5) SOHBET SİLME (owner-owner): peerOwnerId tarafı da silebiliyor ========================
  {
    const opened = await api("POST", "/api/conversations", { token: O2.token, body: { peerOwnerId: O1.id } });
    const convoId = opened.body.id;
    // peerOwnerId tarafı (sohbeti BAŞLATMAYAN taraf) da silebilmeli — convoVisibleTo iki yönlü.
    const delByPeer = await api("DELETE", `/api/conversations/${convoId}`, { token: O1.token });
    eq(delByPeer.status, 204, "owner-owner sohbette peerOwnerId tarafı da (başlatan değil, karşı taraf) silebiliyor");
    eq(row("SELECT id FROM conversations WHERE id = ?", convoId), undefined, "silinen owner-owner sohbet veritabanından kalktı");
  }

  report("owner-owner sohbet + sohbet silme (e2e)");
} finally {
  await stopServer();
}
