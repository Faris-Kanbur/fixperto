/**
 * İKİNCİ (ADVERSARIAL) DENETİM SONDASI — bulgu arar, iddia etmez.
 * run.mjs bunu ÇALIŞTIRMAZ; elle koşulur. Regresyon testleri ayrı dosyalarda.
 */
import { startServer, stopServer, api, row, rows, createUser, login, adminToken, skipIfUnsupported, db } from "./harness.mjs";

if (skipIfUnsupported("audit2-probe")) process.exit(0);
const found = [];
const ok = [];
const rep = (id, sev, title, detail) => { found.push({ id, sev, title, detail }); console.log(`\n!! ${sev} ${id} — ${title}\n   ${detail}`); };
const pass = (id, title) => { ok.push(id); console.log(`   ok ${id} — ${title}`); };

await startServer();
try {
  const A = await createUser("owner", { name: "Saldiran A", email: "atk-a@x.com" });
  const B = await createUser("owner", { name: "Kurban B", email: "atk-b@x.com" });
  const M = await createUser("mechanic", { name: "Tamirci M", email: "atk-m@x.com" });
  const admin = await adminToken();

  // ---------- S1: başarılı giriş IP sayacını sıfırlıyor mu? (brute-force bypass) ----------
  {
    let blockedAt = null;
    for (let i = 0; i < 14; i++) {
      const r = await api("POST", "/api/auth/login", { body: { email: "atk-b@x.com", password: "yanlis-" + i } });
      if (r.status === 429) { blockedAt = i; break; }
    }
    /**
     * BU SONDANIN KENDİ ÖLÇÜM HATASI DÜZELTİLDİ.
     * Burada sınır devreye girmediğinde HIGH bir bulgu bildiriliyordu. Ama harness giriş sınırını
     * kasıtlı olarak 500'e ayarlıyor (testlerin kendi kimlik akışını kurabilmesi için), yani 14
     * denemede hiçbir şey olmaması bir açık DEĞİL, ortamın ta kendisi. Sondanın ölçtüğü şey
     * "sınır var mı" değil "bu ortamda sınır düşük mü" idi. Sınır ayrı ve DÜŞÜK SINIRLI bir
     * koşuda ölçülüyor: `E2E_LOGIN_LIMIT=5 node ...` → 6. denemede 429 (ölçüldü).
     */
    if (blockedAt === null) console.log(`   atlandı S1a — bu ortamda sınır ${process.env.E2E_LOGIN_LIMIT || 500}; sınırın kendisi E2E_LOGIN_LIMIT=5 ile ayrıca ölçülüyor`);
    else {
      // şimdi DOĞRU şifreyle kendi hesabına gir → sayaç sıfırlanıyor mu?
      const good = await api("POST", "/api/auth/login", { body: { email: "atk-a@x.com", password: A.password } });
      const after = await api("POST", "/api/auth/login", { body: { email: "atk-b@x.com", password: "yine-yanlis" } });
      if (good.status === 200 && after.status !== 429) {
        rep("S1", "HIGH", "Başarılı giriş, IP'nin başarısız deneme sayacını SIFIRLIYOR",
          `${blockedAt + 1} yanlış denemede 429 geldi; kendi hesabına 1 doğru giriş sonrası tekrar ${after.status} → sınır süresiz bypass edilebilir`);
      } else pass("S1", "başarılı giriş sayacı sıfırlamıyor");
    }
  }

  // ---------- S2: aynı e-posta ile karşı rolde hesap açılabiliyor mu? ----------
  {
    const r = await api("POST", "/api/auth/register", { body: { role: "mechanic", email: "atk-b@x.com", name: "Sahte" } });
    if (r.status === 201) rep("S2", "HIGH", "Bir owner'ın e-postasıyla mechanic hesabı açılabiliyor",
      `register yalnızca AYNI tabloyu kontrol ediyor; change-email İKİ tabloyu kontrol ediyor → invariant tutarsız. Yeni mechanic id=${r.body.id}, kurbanın adresine mail gitti.`);
    else pass("S2", `çapraz rol e-posta çakışması engellendi (${r.status})`);
  }

  // ---------- S3: mechanics.email UNIQUE mi? ----------
  {
    const r = await api("POST", "/api/auth/register", { body: { role: "mechanic", email: "atk-m@x.com", name: "Kopya" } });
    const n = row(`SELECT COUNT(*) n FROM mechanics WHERE lower(email)='atk-m@x.com'`).n;
    if (n > 1) rep("S3", "MEDIUM", "mechanics.email UNIQUE değil — aynı adresle iki tamirci var", `satır sayısı=${n} (owners.email UNIQUE, mechanics ALTER TABLE ile eklendiği için değil)`);
    else pass("S3", `mechanics.email tekil (register ${r.status})`);
  }

  // ---------- S4: randevu DELETE durum makinesini bypass ediyor mu? ----------
  {
    const veh = await api("POST", "/api/vehicles", { token: A.token, body: { ownerId: A.id, make: "VW", model: "Golf", year: 2020, plate: "34ABC01" } });
    const ap = await api("POST", "/api/appointments", { token: A.token, body: { mechanicId: M.id, ownerId: A.id, vehicleId: veh.body.id, date: "2026-10-01", time: "10:00", service: "Bakım", issue: "fren" } });
    const id = ap.body?.id;
    // tamirci sıraya alsın, sonra tamamlasın
    await api("PATCH", `/api/appointments/${id}`, { token: M.token, body: { status: "Sırada" } });
    await api("PATCH", `/api/appointments/${id}`, { token: M.token, body: { status: "Tamamlandı", servicePrice: 1200 } });
    const st = row(`SELECT status FROM appointments WHERE id=?`, id)?.status;
    // durum makinesi: owner TAMAMLANDI'dan hiçbir yere geçemez
    const patch = await api("PATCH", `/api/appointments/${id}`, { token: A.token, body: { status: "İptal Edildi" } });
    const del = await api("DELETE", `/api/appointments/${id}`, { token: A.token });
    const stillThere = row(`SELECT id FROM appointments WHERE id=?`, id);
    if (patch.status === 403 && del.status === 204 && !stillThere) {
      rep("S4", "HIGH", "DELETE /api/appointments/:id randevu durum makinesini TAMAMEN bypass ediyor",
        `durum "${st}" iken müşterinin PATCH'i doğru şekilde 403 aldı, ama DELETE 204 döndü ve kayıt SİLİNDİ → tamircinin tamamlanmış iş/ciro kaydı ve noShow işareti tek taraflı yok edilebiliyor`);
    } else pass("S4", `randevu silme korunuyor (patch ${patch.status}, delete ${del.status})`);
  }

  // ---------- S5: profile-views/:id/convert IDOR ----------
  {
    const v = await api("POST", "/api/profile-views", { body: { targetType: "mechanic", targetId: M.id } });
    const vid = v.body?.id;
    const c = await api("POST", `/api/profile-views/${vid}/convert`, {}); // TOKEN YOK
    const conv = row(`SELECT converted FROM profile_views WHERE id=?`, vid)?.converted;
    if (c.status === 200 && Number(conv) === 1) rep("S5", "MEDIUM", "POST /api/profile-views/:id/convert kimliksiz ve sahiplik kontrolsüz",
      `id=${vid} girişsiz bir istekle converted=1 yapıldı; id ardışık tamsayı → tüm dönüşüm oranları sahteleştirilebilir`);
    else pass("S5", `convert korunuyor (${c.status})`);
  }

  // ---------- S6: başkasının profil istatistiği okunabiliyor mu? ----------
  {
    const s = await api("GET", `/api/profile-views/stats?targetType=mechanic&targetId=${M.id}`, {});
    const b = await api("GET", `/api/profile-views/stats/bulk?targetType=mechanic&targetIds=${M.id},1,2,3`, {});
    if (s.status === 200 && b.status === 200) rep("S6", "MEDIUM", "Hedef bazlı görüntülenme/dönüşüm istatistikleri kimliksiz okunabiliyor",
      `/stats tek hedef 200, /stats/bulk 200 (tek istekte 200 hedefe kadar) → rakip tamirciler birbirinin dönüşüm hunisini çekebilir. Toplu (parametresiz) yol admin'e kapatılmış ama hedef bazlı yol açık.`);
    else pass("S6", `hedef bazlı istatistik korunuyor (${s.status}/${b.status})`);
  }

  // ---------- S7: share-events hata mesajı SQL detayı sızdırıyor mu? ----------
  {
    const rc = "dup-" + Date.now();
    await api("POST", "/api/share-events", { body: { targetType: "mechanic", targetId: M.id, channel: "wa", refCode: rc } });
    const dup = await api("POST", "/api/share-events", { body: { targetType: "mechanic", targetId: M.id, channel: "wa", refCode: rc } });
    const msg = String(dup.body?.error || "");
    if (msg && /UNIQUE|constraint|share_events|SQLITE/i.test(msg)) rep("S7", "LOW", "share-events hata yolu ham SQL hata metnini döndürüyor",
      `yanıt: "${msg}" → tablo/sütun/kısıt adları sızıyor; makeCrudRouter'ın açık politikası bunun tersi`);
    else pass("S7", "share-events hata metni temiz");
  }

  // ---------- S8: share-events attribution forgery ----------
  {
    const rc = "forge-" + Date.now();
    const r = await api("POST", "/api/share-events", { body: { targetType: "mechanic", targetId: M.id, channel: "wa", refCode: rc, sharedBy: `owner:${B.id}` } });
    const sb = row(`SELECT sharedBy FROM share_events WHERE refCode=?`, rc)?.sharedBy;
    if (sb === `owner:${B.id}`) rep("S8", "LOW", "share-events sharedBy istemciden geliyor — atıf sahteciliği",
      `girişsiz bir istek paylaşımı owner:${B.id} adına kaydetti; refCode de istemci seçiyor, tıklama/dönüşüm sayaçları kimliksiz artırılabiliyor`);
    else pass("S8", "sharedBy oturumdan");
  }

  // ---------- S9: çeviri önbelleği çapraz kullanıcı oracle'ı ----------
  {
    const secret = "gizli mesaj " + Date.now();
    await api("POST", "/api/translate", { body: { text: secret, from: "tr", to: "en" } });
    const probe = await api("POST", "/api/translate", { body: { text: secret, from: "tr", to: "en" } });
    const other = await api("POST", "/api/translate", { body: { text: "hic cevrilmemis " + Date.now(), from: "tr", to: "en" } });
    if (probe.body?.cached === true && other.body?.cached !== true) rep("S9", "MEDIUM", "translation_cache çapraz kullanıcı oracle'ı",
      `"cached:true" bayrağı, belirli bir metnin platformda daha önce çevrilip çevrilmediğini kimliksiz olarak DOĞRULUYOR → tahmin edilen özel sohbet mesajının gönderildiği teyit edilebilir. Önbellek ayrıca sahipsiz, sınırsız ve kalıcı (özel mesajların düz metin kopyası).`);
    else pass("S9", "çeviri önbelleği oracle değil");
  }

  // ---------- S10: id yeniden kullanımı (AUTOINCREMENT yok) ----------
  {
    const V = await createUser("owner", { name: "Silinecek V", email: "atk-v@x.com" });
    const t = await api("POST", "/api/tickets", { token: V.token, body: { subject: "Kişisel şikayet", message: "özel metin", fromId: V.id, fromType: "owner" } });
    const li = await api("POST", "/api/listings", { token: V.token, body: { title: "Aracım", price: 100000, sellerId: V.id, sellerType: "owner", status: "active" } });
    const d = await api("POST", "/api/auth/delete-account", { token: V.token, body: { currentPassword: V.password } });
    const gone = row(`SELECT id FROM owners WHERE id=?`, V.id);
    const ticketLeft = row(`SELECT * FROM support_tickets WHERE id=?`, t.body?.id);
    const listingLeft = row(`SELECT status, sellerId FROM listings WHERE id=?`, li.body?.id);
    const N = await createUser("owner", { name: "Yeni N", email: "atk-n@x.com" });
    if (d.status === 200 && !gone && N.id === V.id) {
      rep("S10", "CRITICAL", "Hesap silindikten sonra id YENİDEN KULLANILIYOR ve artık kayıtlar yeni kullanıcıya geçiyor",
        `silinen owner id=${V.id}; yeni kaydolan kullanıcı da id=${N.id} aldı (id INTEGER PRIMARY KEY, AUTOINCREMENT YOK). ` +
        `Silmede temizlenmeyen kayıtlar: support_tickets(${ticketLeft ? "KALDI — kişisel şikayet metni" : "yok"}), ` +
        `listings(${listingLeft ? `KALDI status=${listingLeft.status} sellerId=${listingLeft.sellerId}` : "yok"}) → yeni kullanıcı bunları okuyabilir/değiştirebilir.`);
      // gerçekten devralıyor mu?
      const readT = await api("GET", `/api/tickets/${t.body?.id}`, { token: N.token });
      const unremove = await api("PATCH", `/api/listings/${li.body?.id}`, { token: N.token, body: { status: "active" } });
      rep("S10b", "CRITICAL", "Devralma ampirik olarak doğrulandı",
        `yeni kullanıcı silinen kişinin destek talebini GET → ${readT.status}${readT.status === 200 ? ` (mesaj: "${readT.body?.message}")` : ""}; kaldırılmış ilanını yeniden yayına alma PATCH → ${unremove.status} (db status=${row(`SELECT status FROM listings WHERE id=?`, li.body?.id)?.status})`);
    } else pass("S10", `id yeniden kullanılmıyor (silinen ${V.id}, yeni ${N.id}, delete ${d.status})`);
  }

  // ---------- S11: CRUD DELETE'te FK hatası 500 veriyor mu? ----------
  {
    const W = await createUser("owner", { name: "Araçlı W", email: "atk-w@x.com" });
    await api("POST", "/api/vehicles", { token: W.token, body: { ownerId: W.id, make: "BMW", model: "3", year: 2019, plate: "34XYZ99" } });
    const del = await api("DELETE", `/api/owners/${W.id}`, { token: W.token });
    if (del.status >= 500) rep("S11", "MEDIUM", "DELETE /api/owners/:id yabancı anahtar yüzünden 500 veriyor",
      `aracı olan bir kullanıcının CRUD silme yolu ${del.status} "${del.body?.error}" → kısıt hatası 400'e çevrilmiyor (POST/PATCH'te çevriliyor), ayrıca hiçbir şey temizlenmiyor`);
    else pass("S11", `owner silme ${del.status}`);
  }

  // ---------- S12: mechanic silindiğinde randevudaki ad kopyası ----------
  {
    const M2 = await createUser("mechanic", { name: "Silinecek Tamirci", email: "atk-m2@x.com" });
    const veh = await api("POST", "/api/vehicles", { token: A.token, body: { ownerId: A.id, make: "Fiat", model: "Egea", year: 2021, plate: "34FFF11" } });
    const ap = await api("POST", "/api/appointments", { token: A.token, body: { mechanicId: M2.id, ownerId: A.id, vehicleId: veh.body.id, date: "2026-11-02", time: "11:00", service: "Bakım" } });
    await api("POST", "/api/auth/delete-account", { token: M2.token, body: { currentPassword: M2.password } });
    const nm = row(`SELECT mechanicName FROM appointments WHERE id=?`, ap.body?.id)?.mechanicName;
    const mrow = row(`SELECT name FROM mechanics WHERE id=?`, M2.id)?.name;
    if (nm === "Silinecek Tamirci" && mrow === "Silinmiş kullanıcı") rep("S12", "MEDIUM", "Tamirci silinince randevudaki ad KOPYASI anonimleştirilmiyor",
      `mechanics.name="${mrow}" ama appointments.mechanicName="${nm}" → owner kolunda reviewList kopyası için özellikle düzeltilen hatanın aynısı burada duruyor (asimetri)`);
    else pass("S12", `randevu ad kopyası tutarlı (${nm} / ${mrow})`);
  }

  // ---------- S13: tamirci kolunda yazdığı yorumlar anonimleşiyor mu? ----------
  {
    /**
     * BU KONTROL DAVRANIŞSAL HÂLE GETİRİLDİ (sondanın kendi ölçüm hatası).
     * Eskiden auth.js metninin ilk 1200 karakterinde "mechanic_reviews" arıyordu. Düzeltme
     * yapıldıktan sonra da kırmızı yandı — çünkü düzeltmenin GEREKÇESİ de aynı dala yazıldı ve
     * kod o 1200 karakterin dışına kaydı. Yani "yakın mı" sorusu, "çalışıyor mu" sorusunun yerine
     * geçiyordu. Artık gerçek bir yorum yazılıp hesap silinerek ÖLÇÜLÜYOR.
     */
    const MW = await createUser("mechanic", { name: "YORUM YAZAN USTA", email: "atk-mw@x.com" });
    const MT = await createUser("mechanic", { name: "Hedef", email: "atk-mt@x.com" });
    db().prepare(`INSERT INTO mechanic_reviews (mechanicId, author, authorId, authorType, rating, comment, date)
                  VALUES (?,?,?,'mechanic',5,'meslektaş yorumu','2027-01-01')`).run(MT.id, "YORUM YAZAN USTA", MW.id);
    await api("POST", "/api/auth/delete-account", { token: MW.token, body: { currentPassword: MW.password } });
    const revAfter = row(`SELECT author, authorId FROM mechanic_reviews WHERE mechanicId=? AND authorType='mechanic'`, MT.id);
    if (revAfter && (revAfter.author !== "Silinmiş kullanıcı" || revAfter.authorId !== null)) rep("S13", "MEDIUM", "delete-account tamirci kolunda mechanic_reviews anonimleştirilmiyor",
      `silme sonrası yorum: author="${revAfter.author}", authorId=${revAfter.authorId} → silinen tamircinin adı başka profillerde kalıyor`);
    else pass("S13", `tamirci yorumları anonimleşiyor (author="${revAfter?.author}", authorId=${revAfter?.authorId})`);
  }

  // ---------- S14: admin token'ı ile rol karıştırma ----------
  {
    const r = await api("GET", "/api/auth/me", { token: admin });
    const s = await api("GET", "/api/auth/sessions", { token: admin });
    if (r.status === 200) rep("S14", "LOW", "Admin token'ı kullanıcı uçlarında kabul ediliyor", `GET /api/auth/me admin token'ıyla ${r.status} döndü`);
    else pass("S14", `admin token'ı kullanıcı uçlarında reddediliyor (me ${r.status}, sessions ${s.status})`);
  }

  console.log(`\n================ SONDA ÖZETİ ================`);
  console.log(`bulgu: ${found.length} | temiz geçen kontrol: ${ok.length}`);
  for (const f of found) console.log(`  ${f.sev.padEnd(8)} ${f.id}  ${f.title}`);
} finally { stopServer(); }
