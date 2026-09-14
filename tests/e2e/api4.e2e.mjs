/**
 * UÇTAN UCA — SORGU PLANLARI VE İNDEKSLER (Faz 2).
 * ================================================================================================
 * NEDEN BU TAKIM BÖYLE YAZILDI:
 * "İndeks eklendi" demek kolay: `sqlite_master`'da satır var mı diye bakan bir test yeşil yanar ve
 * hiçbir şey kanıtlamaz. İndeksin VAR OLMASI ile SQLite'ın onu KULLANMASI ayrı şeyler — sütun
 * sırası yanlışsa, sorguda sütuna bir işlev uygulanmışsa ya da karşılaştırma olumsuzsa (`!=`)
 * indeks orada durur ama plan yine tablo taramasıdır.
 *
 * Bu yüzden ölçüt indeksin varlığı değil, `EXPLAIN QUERY PLAN` çıktısı:
 *   `SCAN <tablo>`               → tablo baştan sona okunuyor (istemediğimiz)
 *   `SEARCH <tablo> USING INDEX` → indeksten gidiliyor (istediğimiz)
 *
 * Ve plan GERÇEK veritabanından okunuyor: harness'ın açtığı bu bağlantı, gerçek `db.js` tarafından
 * gerçek sürücüyle (senin makinende better-sqlite3) oluşturulmuş dosyanın kendisi. Yani test
 * "şemayı ben kurdum, indeks duruyor" demiyor; uygulamanın kurduğu şemaya bakıyor.
 *
 * İKİNCİ BÖLÜM — DAVRANIŞ AYNI KALDI MI:
 * Sohbet listesinin filtresi JS'ten SQL'e taşındı (routes/conversations.js). Bu bir hız
 * değişikliği; sonucun DEĞİŞMEMESİ gerekiyor. Performans değişikliğinin en sinsi hatası, gizlilik
 * kuralını farkında olmadan gevşetmektir: bir SQL WHERE cümlesi JS filtresinden bir satır FAZLA
 * döndürürse o bir performans iyileştirmesi değil, veri sızıntısıdır. O yüzden dört rolün de
 * gördüğü şey gerçek isteklerle tek tek doğrulanıyor.
 */
import { startServer, stopServer, api, db, rows, createUser, adminToken, skipIfUnsupported } from "./harness.mjs";

if (skipIfUnsupported("e2e sorgu planları")) process.exit(0);

let passed = 0;
const failures = [];
const ok = (v, name) => { if (v) passed++; else failures.push(name); };

/** Bir sorgunun planını oku ve indeks kullanıp kullanmadığını söyle. */
function plan(sql) {
  return rows(`EXPLAIN QUERY PLAN ${sql}`).map((r) => r.detail).join(" | ");
}
const usesIndex = (sql, name) => {
  const p = plan(sql);
  // Bilerek iki koşul: SEARCH var VE hiç SCAN yok. Birleşik sorgularda biri indeksten gidip
  // diğeri tarama olabilir; "SEARCH gördüm" deyip geçmek o durumu kaçırırdı.
  ok(/SEARCH/.test(p) && !/\bSCAN\b/.test(p), `plan indeks kullanıyor: ${name}\n            ${p}`);
};
const hasIndex = (name) =>
  rows(`SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?`, name).length === 1;

try {
  await startServer();

  // ============================================================ İNDEKSLER GERÇEKTEN OLUŞTU MU
  for (const idx of [
    "idx_vehicles_owner", "idx_appointments_owner", "idx_appointments_mechanic",
    "idx_conversations_owner", "idx_conversations_mechanic", "idx_tickets_from",
    "idx_profile_views_target", "idx_quote_offers_request", "idx_vehicle_history_owner",
    "idx_listings_status",
  ]) ok(hasIndex(idx), `indeks oluştu: ${idx}`);

  // Faz 1 ve öncesinde var olanlar duruyor mu — yeni blok eskiyi ezmemiş olmalı.
  for (const idx of [
    "idx_vehicle_history_vin", "idx_vehicle_history_appt", "idx_blog_status_date",
    "idx_career_status", "idx_events_name_date", "idx_events_target", "idx_events_visitor",
    "idx_review_mechanic", "idx_review_one_per_author", "idx_taste_user",
  ]) ok(hasIndex(idx), `eski indeks korundu: ${idx}`);

  // ============================================================ PLANLAR: ARTIK TARAMA YOK
  /**
   * Buradaki her sorgu koddan BİREBİR alındı (bkz. yorumlardaki dosya/satır). Uydurma bir sorgunun
   * planını ölçmek, ölçmemekten daha kötüdür: yeşil yanar ama uygulamanın çalıştırdığı şeyi
   * temsil etmez.
   */
  usesIndex("SELECT * FROM vehicles WHERE ownerId = 1 LIMIT 100", "vehicles / ARAÇLARIM listesi");
  usesIndex("SELECT COUNT(*) n FROM vehicles WHERE ownerId = 1", "vehicles / X-Total-Count sayımı");
  usesIndex("SELECT * FROM appointments WHERE ownerId = 1 LIMIT 100", "appointments / sahibin listesi");
  usesIndex("SELECT * FROM appointments WHERE mechanicId = 1 LIMIT 100", "appointments / TAMİRCİNİN listesi");
  usesIndex("SELECT id FROM appointments WHERE mechanicId = 1 AND ownerId = 1 AND status = 'completed'",
    "appointments / yorum hakkı kontrolü (reviews.js)");
  usesIndex("SELECT * FROM conversations WHERE ownerId = 1", "conversations / sahibin sohbetleri");
  usesIndex("SELECT * FROM conversations WHERE mechanicId = 1", "conversations / tamircinin sohbetleri");
  usesIndex("SELECT * FROM support_tickets WHERE (fromId = 1 AND fromType = 'owner') LIMIT 100",
    "support_tickets / kendi taleplerim (bileşik)");
  usesIndex("SELECT COUNT(*) n, COALESCE(SUM(converted), 0) c FROM profile_views WHERE targetType = 'mechanic' AND targetId = 1",
    "profile_views / toplam görüntüleme");
  usesIndex("SELECT COUNT(*) n FROM profile_views WHERE targetType = 'mechanic' AND targetId = 1 AND createdAt >= '2026-01-01'",
    "profile_views / tarih aralığı (aralık sütunu en sonda)");
  usesIndex("SELECT * FROM quote_offers WHERE requestId = 1", "quote_offers / bir talebin teklifleri");
  usesIndex("SELECT * FROM vehicle_history WHERE ownerId = 1 ORDER BY serviceDate DESC",
    "vehicle_history / servis geçmişim");
  usesIndex("SELECT COUNT(*) n FROM listings WHERE status = 'active'", "listings / yönetici aktif ilan sayımı");
  usesIndex("SELECT * FROM vehicle_history WHERE vin = 'X'", "vehicle_history / VIN (eskiden beri var)");
  usesIndex("SELECT userId, role, createdAt FROM sessions WHERE tokenHash = 'x'",
    "sessions / her istekteki token araması (PRIMARY KEY)");

  /**
   * SIRALAMA DA İNDEKSTEN GELİYOR MU:
   * `idx_vehicle_history_owner` bilerek (ownerId, serviceDate DESC) — eğer yalnızca ownerId olsaydı
   * SQLite satırları bulur ama sonra ayrı bir sıralama adımı kurardı. Planda "USE TEMP B-TREE FOR
   * ORDER BY" görünmemesi, sıralamanın bedava geldiğini gösteriyor.
   */
  ok(!/TEMP B-TREE/.test(plan("SELECT * FROM vehicle_history WHERE ownerId = 1 ORDER BY serviceDate DESC")),
    "vehicle_history sıralaması indeksten geliyor (geçici sıralama ağacı kurulmuyor)");

  /**
   * KASITLI OLARAK EKLENMEYENLER — bu testler "eklemedik" kararını KAYIT ALTINA alıyor.
   * Biri yarın "şurada tarama var, indeks ekleyeyim" derse bu satırlar onu durdurmaz; ama kararın
   * bilinçli olduğunu ve neden alındığını gösterir (bkz. db.js Faz 2 bloğu).
   */
  ok(!hasIndex("idx_sessions_created"),
    "sessions(createdAt) eklenmedi — en sık YAZILAN yolu yavaşlatıp en seyrek okunan işi hızlandırırdı");
  ok(!hasIndex("idx_listings_seller"),
    "listings(sellerId) eklenmedi — ilan listesi filtresiz dönüyor, tek kullanıcısı hesap silme");

  // ============================================================ DAVRANIŞ AYNI MI (SOHBET LİSTESİ)
  /**
   * Filtre SQL'e taşındı. Bu bölüm sonucun değişmediğini gerçek isteklerle gösteriyor.
   * İki araç sahibi + bir tamirci kuruluyor; birinci sahip bir sohbet açıyor.
   */
  const owner1 = await createUser("owner", { name: "Plan Sahip 1", email: "plan.owner1@test.local" });
  const owner2 = await createUser("owner", { name: "Plan Sahip 2", email: "plan.owner2@test.local" });
  const mech = await createUser("mechanic", { name: "Plan Tamirci", email: "plan.mech@test.local" });

  const created = await api("POST", "/api/conversations", {
    token: owner1.token,
    body: { mechanicId: mech.id, mechanicName: "Plan Tamirci", messages: [{ sender: "owner", text: "Merhaba" }] },
  });
  ok(created.status === 201 || created.status === 200, `sohbet oluşturuldu (${created.status}) ${created.raw || ""}`);
  const convoId = created.body?.id;
  ok(Number.isInteger(convoId), "sohbet id'si döndü");

  // Sunucu ownerId'yi İSTEMCİDEN değil oturumdan alıyor; veritabanından doğrula.
  const stored = rows(`SELECT ownerId, mechanicId FROM conversations WHERE id = ?`, convoId)[0];
  ok(stored?.ownerId === owner1.id, "ownerId oturumdan yazıldı (istemciden değil)");
  ok(stored?.mechanicId === mech.id, "mechanicId doğru yazıldı");

  const listFor = async (token) => {
    const r = await api("GET", "/api/conversations", { token });
    return { status: r.status, ids: Array.isArray(r.body) ? r.body.map((c) => c.id) : null };
  };

  const l1 = await listFor(owner1.token);
  ok(l1.status === 200 && l1.ids.includes(convoId), "sahip kendi sohbetini GÖRÜYOR");

  const l2 = await listFor(owner2.token);
  ok(l2.status === 200 && !l2.ids.includes(convoId), "BAŞKA sahip o sohbeti GÖRMÜYOR (asıl gizlilik kuralı)");

  const lm = await listFor(mech.token);
  ok(lm.status === 200 && lm.ids.includes(convoId), "tamirci kendi sohbetini GÖRÜYOR");

  const la = await listFor(await adminToken());
  ok(la.status === 200 && la.ids.includes(convoId), "yönetici hepsini GÖRÜYOR (eski davranış korundu)");

  const anon = await api("GET", "/api/conversations");
  ok(anon.status === 401, `oturumsuz erişim 401 (${anon.status})`);

  /**
   * LİSTE ile TEKİL YOL AYNI CEVABI VERİYOR MU:
   * Liste artık SQL'den, tekil GET hâlâ JS'teki `convoVisibleTo`'dan karar veriyor. İkisinin
   * ayrışması en tehlikeli durum olurdu: listede görünmeyen ama id'si tahmin edilince okunabilen
   * bir sohbet. Bu yüzden iki yol karşılaştırılıyor.
   */
  const singleOwner2 = await api("GET", `/api/conversations/${convoId}`, { token: owner2.token });
  ok(singleOwner2.status === 403, `listede görünmeyen sohbet tekil yoldan da kapalı (${singleOwner2.status})`);
  const singleOwner1 = await api("GET", `/api/conversations/${convoId}`, { token: owner1.token });
  ok(singleOwner1.status === 200, `listede görünen sohbet tekil yoldan da açık (${singleOwner1.status})`);

  /**
   * SAHİPSİZ SOHBET (ownerId NULL) SIZMIYOR MU:
   * JS'te `null === 5` false; SQL'de `NULL = 5` eşleşmiyor. İkisi aynı sonucu veriyor ama bu
   * "aynı olduğunu varsaydığım" bir yer, o yüzden ölçüyorum. Eski kayıtlarda (ownerId sütunu
   * sonradan eklendi) NULL değerler olabilir.
   */
  db().prepare(`UPDATE conversations SET ownerId = NULL WHERE id = ?`).run(convoId);
  const orphan1 = await listFor(owner1.token);
  ok(!orphan1.ids.includes(convoId), "ownerId NULL olan sohbet hiçbir sahibe görünmüyor");
  const orphanAdmin = await listFor(await adminToken());
  ok(orphanAdmin.ids.includes(convoId), "sahipsiz sohbet yalnızca yöneticiye görünüyor");
  db().prepare(`UPDATE conversations SET ownerId = ? WHERE id = ?`).run(owner1.id, convoId);

  // ============================================================ İNDEKSLER YAZMAYI BOZMADI MI
  /**
   * Bir indeks yanlış tanımlanmışsa (ör. istemeden UNIQUE) yazma yolu bozulur. En görünür yerde
   * sınayalım: aynı sahip için iki araç, aynı duruma sahip iki ilan.
   */
  const v1 = await api("POST", "/api/vehicles", { token: owner1.token, body: { brand: "VW", model: "Golf", year: 2018, plate: "34 AA 001" } });
  const v2 = await api("POST", "/api/vehicles", { token: owner1.token, body: { brand: "VW", model: "Polo", year: 2019, plate: "34 AA 002" } });
  ok(v1.status === 201 && v2.status === 201, `aynı sahibe iki araç eklenebiliyor (${v1.status}/${v2.status})`);
  ok(rows(`SELECT id FROM vehicles WHERE ownerId = ?`, owner1.id).length >= 2, "iki araç da veritabanında");

  const myVehicles = await api("GET", "/api/vehicles", { token: owner1.token });
  ok(Array.isArray(myVehicles.body) && myVehicles.body.length >= 2, "araç listesi ikisini de döndürüyor");
  const otherVehicles = await api("GET", "/api/vehicles", { token: owner2.token });
  ok(Array.isArray(otherVehicles.body) && otherVehicles.body.length === 0,
    "başka sahip bu araçları görmüyor (indeksli sorgu kapsamı bozmadı)");

  // Profil görüntüleme: indeks eklenen tabloya yazma + indeksli okuma birlikte.
  const pv = await api("POST", "/api/profile-views", { body: { targetType: "mechanic", targetId: mech.id } });
  ok(pv.status === 201 || pv.status === 200, `profil görüntüleme kaydedildi (${pv.status})`);
  ok(rows(`SELECT id FROM profile_views WHERE targetType = 'mechanic' AND targetId = ?`, mech.id).length >= 1,
    "görüntüleme satırı indeksli sorguyla bulunuyor");

  // ============================================================ ÖLÇÜM: TARAMA GERÇEKTEN AZALDI MI
  /**
   * Plan çıktısı niyeti gösteriyor, bu ise İŞİ ölçüyor. `sqlite_stmt` sanal tablosu her sürücüde
   * yok, o yüzden ölçüm satır sayısıyla yapılıyor: indeksli sorgu, tablo büyürken sabit kalmalı.
   * Burada amaç bir hız iddiası değil — planın gerçek veriyle de indeksten gittiğini görmek.
   */
  const before = plan("SELECT * FROM conversations WHERE ownerId = 1");
  /**
   * Dolgu sohbetlerin sahibi NEGATİF id: gerçek kullanıcı id'leri tahmin edilemez olsun diye
   * rastgele üretiliyor (9007 gibi), dolayısıyla "9000 + i" gibi bir aralık gerçek bir kullanıcıya
   * ÇAKIŞABİLİR — ilk denemede tam olarak bu oldu ve test kendi verisini kendi kullanıcısına
   * yazdı. Negatif id hiçbir gerçek hesaba ait olamaz.
   */
  for (let i = 0; i < 30; i++) {
    db().prepare(`INSERT INTO conversations (ownerId, mechanicId, mechanicName, messages) VALUES (?, ?, ?, '[]')`)
      .run(-1000 - i, mech.id, "Dolgu");
  }
  const after = plan("SELECT * FROM conversations WHERE ownerId = 1");
  ok(before === after && /SEARCH/.test(after), "tablo büyüdükçe plan değişmiyor, indeks kullanılmaya devam ediyor");
  const stillMine = await listFor(owner1.token);
  ok(stillMine.ids.includes(convoId) && stillMine.ids.length === 1,
    `30 yabancı sohbet eklendikten sonra da yalnızca kendi sohbetim dönüyor (${stillMine.ids.length})`);
} catch (e) {
  failures.push(`İSTİSNA: ${e.message}`);
} finally {
  stopServer();
}

if (failures.length === 0) {
  console.log(`OK e2e sorgu planları ve indeksler (${passed})`);
  process.exit(0);
}
console.log(`BAŞARISIZ e2e sorgu planları — ${failures.length}/${passed + failures.length}`);
for (const f of failures) console.log("  ✗ " + f);
process.exit(1);
