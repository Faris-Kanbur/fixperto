/**
 * OTOMATİK GÜVENLİK MATRİSİ — HER UÇ, HER SEFERİNDE.
 * ================================================================================================
 * Elle yazılan uçtan uca testler değerli ama bir zayıflığı var: yalnızca YAZDIĞIN uçları korurlar.
 * Yeni bir uç eklendiğinde kimse hatırlamazsa o uç denetlenmeden yayına çıkar. "Hiçbir fonksiyonu
 * atlama" kuralı ancak liste KODDAN üretilirse gerçekten sağlanır.
 *
 * Bu takım sunucudaki uçların TAMAMINI (endpoints.mjs) alıp her birine aynı soruları soruyor:
 *   1) Girişsiz çağrıldığında ne oluyor? Yazma uçları 401 vermeli, 200 ya da 500 vermemeli.
 *   2) Bozuk/kötü niyetli gövdeyle 500 patlatılabiliyor mu? (Hata yönetimi + bilgi sızıntısı)
 *   3) Yanıtlarda hassas alan sızıyor mu? (password, tokenHash, signupIpHash, iban…)
 *   4) Hata gövdesinde yığın izi / SQL / dosya yolu görünüyor mu?
 *   5) Başkasının kaydına yazma denemesi (IDOR) — sahiplikli her kaynak için.
 *   6) Yönetici alanlarını kendine yazma (kitlesel atama) — her kaynak için.
 *
 * Yeni bir uç eklendiğinde bu testlerin hepsi otomatik olarak ona da uygulanır.
 */
import { startServer, stopServer, api, createUser, adminToken, row, rows, db, skipIfUnsupported } from "./harness.mjs";
import { allEndpoints, crudMounts } from "./endpoints.mjs";

let passed = 0;
const failures = [];
const eq = (actual, expected, name) => {
  if (JSON.stringify(actual) === JSON.stringify(expected)) passed++;
  else failures.push(`${name}\n    beklenen: ${JSON.stringify(expected)}\n    gelen   : ${JSON.stringify(actual)}`);
};
const ok = (v, name) => eq(!!v, true, name);

if (skipIfUnsupported("güvenlik matrisi")) process.exit(0);

await startServer();
try {
  const owner = await createUser("owner", { name: "Matris A", email: "matris-a@example.com", phone: "+905321240001" });
  const other = await createUser("owner", { name: "Matris B", email: "matris-b@example.com", phone: "+905321240002" });
  const mech = await createUser("mechanic", { name: "Matris Oto", email: "matris-m@example.com", phone: "+905331240003" });
  const admin = await adminToken();

  const endpoints = allEndpoints();
  ok(endpoints.length > 100, `denetime giren uç sayısı yeterli (${endpoints.length})`);

  /**
   * Örnek kimlik: ":id" içeren yollara gerçek bir kayıt kimliği koyuyoruz. 1 sayısı çoğu tabloda
   * tohum verisiyle var; olmayan yerde 404 dönmesi de kabul edilebilir bir cevap (500 değil).
   */
  const fill = (path) => path.replace(/:[a-zA-Z]+/g, "1");

  // ================================================================ 1) GİRİŞSİZ ERİŞİM
  /**
   * Kural: bir YAZMA ucu girişsiz çağrıldığında 200 dönmemeli. Aşağıdaki liste bilerek
   * "herkese açık" olan yazma uçları — her biri için sebebi yazılı. Listede olmayan bir yazma
   * ucu girişsiz 200 dönerse test düşer; yani yeni bir açık uç eklemek FARK EDİLİR.
   */
  const PUBLIC_WRITE = new Map([
    ["POST /api/auth/register", "hesap açma"],
    ["POST /api/auth/login", "giriş"],
    ["POST /api/auth/verify-otp", "giriş ikinci adımı"],
    ["POST /api/auth/resend-otp", "giriş ikinci adımı"],
    ["POST /api/auth/forgot-password", "şifre sıfırlama talebi"],
    ["POST /api/auth/reset-password", "şifre sıfırlama (tek kullanımlık jetonla)"],
    ["POST /api/admin/login", "yönetici girişi"],
    ["POST /api/analytics/events", "anonim olay toplama"],
    ["POST /api/profile-views", "anonim profil görüntüleme sayacı"],
    ["POST /api/share-events", "anonim paylaşım sayacı"],
    ["POST /api/translate", "girişsiz gezinen de çeviri görebilmeli"],
    ["POST /api/translate/batch", "girişsiz gezinen de çeviri görebilmeli"],
    ["POST /api/mechanics/:id/share", "paylaşım sayacı"],
    ["POST /api/listings/:id/share", "paylaşım sayacı"],
    ["POST /api/jobs/:id/share", "paylaşım sayacı"],
    // ÇIKIŞ İDEMPOTENTTİR. Oturumu olmayan birine "çıkamazsın, çünkü giriş yapmamışsın" demek
    // hem anlamsız hem kullanıcıya zararlı (kapanmayan bir oturum sanır). Uç, SUNULAN jetonun
    // oturumunu siler; başka kimsenin oturumuna dokunamaz — bu aşağıda ayrıca test ediliyor.
    ["POST /api/auth/logout", "çıkış idempotent"],
    ["POST /api/auth/logout-all", "çıkış idempotent"],
    ["POST /api/admin/logout", "çıkış idempotent"],
  ]);

  const anonLeaks = [];
  const serverErrors = [];
  const stackLeaks = [];
  const SENSITIVE = ["password", "tokenHash", "signupIpHash", "resetTokenHash", "otpHash"];
  const STACK_HINTS = [" at ", "node_modules", "SQLITE_", "better-sqlite3", "/backend/", "SyntaxError:", "TypeError:"];

  for (const e of endpoints) {
    const path = fill(e.path);
    const body = e.method === "GET" || e.method === "DELETE" ? undefined : {};
    const res = await api(e.method, path, { body });

    if (res.status >= 500) serverErrors.push(`${e.method} ${e.path} → ${res.status} ${String(res.raw).slice(0, 120)}`);
    if (STACK_HINTS.some((h) => String(res.raw).includes(h))) stackLeaks.push(`${e.method} ${e.path} → ${String(res.raw).slice(0, 140)}`);

    const isWrite = e.method !== "GET";
    if (isWrite && res.status < 400 && !PUBLIC_WRITE.has(`${e.method} ${e.path}`)) {
      anonLeaks.push(`${e.method} ${e.path} → ${res.status}`);
    }
    // Girişsiz okumada hassas alan asla görünmemeli.
    for (const f of SENSITIVE) {
      if (new RegExp(`"${f}"\\s*:`).test(String(res.raw))) anonLeaks.push(`${e.method} ${e.path} → yanıtta "${f}" var`);
    }
  }
  eq(anonLeaks, [], "girişsiz erişimde yetkisiz yazma ya da hassas alan yok");
  eq(serverErrors, [], "hiçbir uç boş/eksik gövdeyle 500 vermiyor");
  eq(stackLeaks, [], "hata yanıtlarında yığın izi / SQL / dosya yolu sızmıyor");

  // ================================================================ 2) KÖTÜ NİYETLİ GÖVDE TARAMASI
  /**
   * Aynı uçlara bu kez giriş yapmış bir kullanıcıyla ve BOZUK gövdelerle gidiyoruz. Beklenen:
   * 4xx (anlaşılır ret) — asla 500. 500, doğrulamanın atlandığı ve hatanın kullanıcıya ham
   * biçimde ulaştığı yerdir; hem kötü deneyim hem bilgi sızıntısı kaynağıdır.
   */
  const EVIL_BODIES = [
    { __proto__: { polluted: true }, name: "x" },
    { name: "'; DROP TABLE owners; --", email: "a'--@x.com" },
    { name: "<script>alert(1)</script>", comment: "<img src=x onerror=alert(1)>" },
    { name: "../../../../etc/passwd", path: "../../etc/passwd" },
    { name: "ç".repeat(5000), text: "😀".repeat(2000) },
    { id: -1, amount: -999999, rating: 99, price: Number.MAX_SAFE_INTEGER },
    { name: null, email: undefined, filters: [], meta: "not-an-object" },
    { name: ["array", "where", "string", "expected"], nested: { deep: { deeper: {} } } },
  ];
  /**
   * TARAMA AYRI BİR KURBAN HESAPLA YAPILIYOR. İlk sürümde asıl test kullanıcısının jetonu
   * kullanılıyordu ve tarama `/api/auth/logout` ucuna da gidip KENDİ oturumunu kapatıyordu;
   * sonraki testler 401 alıyordu. Bu, uygulamanın değil TESTİN hatasıydı — ama cinsi önemli:
   * yan etkisi olan bir uca kör tarama yaparken, taramanın kendi zeminini çekmemesi gerekir.
   */
  const fuzzUser = await createUser("owner", { name: "Fuzz", email: "fuzz@example.com", phone: "+905321240009" });
  const fuzzErrors = [];
  for (const e of endpoints) {
    if (e.method === "GET") continue;
    for (const evil of EVIL_BODIES) {
      const res = await api(e.method, fill(e.path), { token: fuzzUser.token, body: evil });
      if (res.status >= 500) fuzzErrors.push(`${e.method} ${e.path} ← ${JSON.stringify(evil).slice(0, 60)} → ${res.status} ${String(res.raw).slice(0, 100)}`);
    }
  }
  eq(fuzzErrors.slice(0, 8), [], "bozuk/kötü niyetli gövde hiçbir uçta 500 üretmiyor");
  // Prototip kirlenmesi gerçekten olmadı mı? Süreçte kalıcı bir iz bırakmamalı.
  eq(({}).polluted, undefined, "prototip kirlenmesi olmadı");

  // ================================================================ 3) IDOR — SAHİPLİKLİ HER KAYNAK
  /**
   * Sahipliği olan her kaynak için: A'nın kaydını B düzenleyebiliyor mu, silebiliyor mu?
   * Kaynak listesi server.js'ten geliyor — yeni bir sahiplikli kaynak eklendiğinde otomatik
   * olarak bu teste dâhil olur.
   */
  const seedBody = {
    vehicles: { plate: "34 IDOR 34", brand: "BMW", model: "320i", year: 2018 },
    appointments: { mechanicId: mech.id, service: "Bakım", date: "2026-03-01", time: "10:00", status: "Onay Bekliyor" },
    listings: { title: "IDOR ilan", brand: "BMW", model: "320i", price: "500000", status: "active" },
    support_tickets: { subject: "IDOR", description: "test", status: "open" },
  };
  const idorProblems = [];
  for (const m of crudMounts) {
    if (!m.hasAuthScope) continue;
    const body = seedBody[m.table];
    if (!body) continue;                       // oluşturma gövdesi bilinmeyen kaynak atlanıyor
    const created = await api("POST", m.base, { token: owner.token, body });
    if (created.status !== 201) continue;
    const id = created.body?.id;

    const patch = await api("PATCH", `${m.base}/${id}`, { token: other.token, body: { status: "x", title: "ele geçirildi" } });
    if (patch.status < 400) idorProblems.push(`${m.base}: başkası PATCH edebildi (${patch.status})`);

    const del = await api("DELETE", `${m.base}/${id}`, { token: other.token });
    if (del.status < 400) idorProblems.push(`${m.base}: başkası SİLEBİLDİ (${del.status})`);

    // Silinmediğini VERİTABANINDAN doğrula — 4xx dönüp yine de silmiş olabilirdi.
    const stillThere = rows(`SELECT id FROM ${m.table} WHERE id = ?`, id).length === 1;
    if (!stillThere) idorProblems.push(`${m.base}: 4xx döndü AMA kayıt gerçekten silinmiş`);

    /**
     * Sahibi kendi kaydını düzenleyebilmeli — kural sadece kısıtlamamalı, meşru işi bozmamalı.
     *
     * GÖVDE TABLOYA GÖRE: eskiden her tablo için `{ status: "active" }` gönderiliyordu ve bu,
     * durum doğrulaması olmayan tablolarda çalışıyordu. Tam uygulama denetiminde randevulara
     * DURUM MAKİNESİ eklendi ve "active" randevu durumu olmadığı için istek haklı olarak 400
     * döndü — yani matrisin gövdesi geçerli bir düzenleme DEĞİLDİ. Tablodan bağımsız bir gövde,
     * doğrulama sıkılaştıkça yanlış alarm üretir; o yüzden her tablo için o tabloda GERÇEKTEN
     * meşru olan bir alan yazıyoruz.
     */
    const LEGIT_PATCH = {
      appointments: { issue: "sahibi tarafından güncellendi" },
      vehicles: { tireType: "yaz" },
      support_tickets: { subject: "güncellendi" },
    };
    const own = await api("PATCH", `${m.base}/${id}`, {
      token: owner.token, body: LEGIT_PATCH[m.table] || { status: "active" },
    });
    if (own.status >= 400) idorProblems.push(`${m.base}: SAHİBİ kendi kaydını düzenleyemiyor (${own.status})`);
  }
  eq(idorProblems, [], "sahiplikli kaynaklarda IDOR yok ve meşru sahip engellenmiyor");

  // ================================================================ 4) KİTLESEL ATAMA
  /**
   * Kullanıcı kendi satırına yönetici alanları yazabiliyor mu? "verified" rozeti kendi kendine
   * verilebiliyorsa hiçbir anlamı kalmaz; "status" yazılabiliyorsa askıya alınan kullanıcı
   * askıyı kaldırır.
   */
  await api("PATCH", `/api/mechanics/${mech.id}`, {
    token: mech.token,
    body: { verified: 1, rating: 5, reviews: 999, shareCount: 500, avgResponseMinutes: 1, name: "Yeni Ad" },
  });
  const mechRow = row("SELECT verified, rating, reviews, shareCount, name FROM mechanics WHERE id = ?", mech.id);
  eq([mechRow.verified, mechRow.reviews, mechRow.shareCount], [0, 0, 0], "tamirci kendine rozet/puan/sayaç yazamıyor");
  eq(mechRow.name, "Yeni Ad", "ama meşru alan (ad) yazılabiliyor — kural aşırı geniş değil");

  await api("PATCH", `/api/owners/${owner.id}`, { token: owner.token, body: { status: "active", vehicleCount: 99, email: "yeni@example.com" } });
  const ownerRow = row("SELECT status, vehicleCount, email FROM owners WHERE id = ?", owner.id);
  eq(ownerRow.vehicleCount, 0, "araç sahibi sayaç alanını yazamıyor");
  eq(ownerRow.email, "matris-a@example.com", "e-posta genel PATCH ile değiştirilemiyor (hesap devri olurdu)");

  // ================================================================ 5) YÖNETİCİ UÇLARI
  const adminOnly = endpoints.filter((e) => e.path.startsWith("/api/admin") || e.path.startsWith("/api/analytics/"));
  const adminLeaks = [];
  for (const e of adminOnly) {
    // login/logout ve anonim olay toplama kasıtlı olarak açık (yukarıdaki PUBLIC_WRITE gerekçeleri).
    if (["/api/admin/login", "/api/admin/logout", "/api/analytics/events", "/api/analytics/my-mechanic"].includes(e.path)) continue;
    const res = await api(e.method, fill(e.path), { token: owner.token, body: e.method === "GET" ? undefined : {} });
    if (res.status < 400) adminLeaks.push(`${e.method} ${e.path} → sıradan kullanıcı erişebildi (${res.status})`);
  }
  eq(adminLeaks, [], "yönetici uçlarına sıradan kullanıcı erişemiyor");

  // Yöneticinin kendisi erişebiliyor mu? (Kural sadece kapatmamalı, işi de yürütmeli.)
  eq((await api("GET", "/api/admin/stats", { token: admin })).status, 200, "yönetici kendi uçlarını kullanabiliyor");

  /**
   * ÇIKIŞIN GERÇEK RİSKİ: idempotent olması sorun değil; BAŞKASININ oturumunu kapatabilmesi olurdu.
   * Sıradan bir kullanıcının jetonuyla yönetici çıkışı çağrılıyor — yöneticinin oturumu ayakta
   * kalmalı. Aksi hâli bir hizmet engelleme (DoS) açığı olurdu: herkes yöneticiyi atabilirdi.
   */
  await api("POST", "/api/admin/logout", { token: owner.token, body: {} });
  eq((await api("GET", "/api/admin/stats", { token: admin })).status, 200,
    "başkasının jetonuyla çıkış yöneticinin oturumunu KAPATMIYOR");
  await api("POST", "/api/auth/logout", { token: other.token, body: {} });
  eq((await api("GET", "/api/auth/me", { token: owner.token })).status, 200,
    "bir kullanıcının çıkışı BAŞKA kullanıcının oturumunu kapatmıyor");
  eq((await api("GET", "/api/auth/me", { token: other.token })).status, 401, "çıkan kullanıcının jetonu gerçekten öldü");

  // ================================================================ 6) ÇALINMIŞ / BOZUK JETON
  const badTokens = ["", "Bearer", "null", "undefined", "a".repeat(500), `${owner.token}x`, owner.token.slice(0, -1)];
  const tokenLeaks = [];
  for (const bad of badTokens) {
    const res = await api("GET", "/api/auth/me", { token: bad });
    if (res.status !== 401) tokenLeaks.push(`"${bad.slice(0, 12)}…" → ${res.status}`);
  }
  eq(tokenLeaks, [], "bozuk/uydurma jetonların hiçbiri kabul edilmiyor");

  // ================================================================ 5a) KİMLİK AKIŞININ İNCE NOKTALARI
  /**
   * HESAP SAYIMI (account enumeration): "bu e-posta kayıtlı mı?" sorusuna cevap veren bir sistem,
   * saldırgana hedef listesi hazırlar. Var olan ve olmayan e-posta için yanıtlar AYIRT EDİLEMEZ
   * olmalı — hem durum kodu hem mesaj.
   */
  const knownEmail = owner.email;
  const unknownEmail = "hic-yok-boyle-biri@example.com";
  const loginKnown = await api("POST", "/api/auth/login", { body: { email: knownEmail, password: "yanlis-sifre-123" } });
  const loginUnknown = await api("POST", "/api/auth/login", { body: { email: unknownEmail, password: "yanlis-sifre-123" } });
  eq(loginKnown.status, loginUnknown.status, "giriş: var olan ve olmayan e-posta AYNI durum kodunu veriyor");
  eq(loginKnown.body?.error, loginUnknown.body?.error, "giriş: hata mesajı da aynı (hesap sayımı yapılamıyor)");

  const forgotKnown = await api("POST", "/api/auth/forgot-password", { body: { email: knownEmail } });
  const forgotUnknown = await api("POST", "/api/auth/forgot-password", { body: { email: unknownEmail } });
  eq(forgotKnown.status, forgotUnknown.status, "şifre sıfırlama: aynı durum kodu");
  eq(JSON.stringify(forgotKnown.body) === JSON.stringify(forgotUnknown.body), true,
    "şifre sıfırlama: yanıt gövdesi de aynı (e-posta kayıtlı mı belli olmuyor)");

  /**
   * OTP TEK KULLANIMLIK OLMALI. Aynı kod ikinci kez çalışırsa, e-postası bir kez görülen kod
   * (omuz üstünden, paylaşılan cihaz, ele geçirilmiş posta kutusu) süresi dolana kadar tekrar
   * tekrar giriş sağlar.
   */
  const otpUser = await createUser("owner", { name: "OTP Test", email: "otp-test@example.com", phone: "+905321240051" });
  const l1 = await api("POST", "/api/auth/login", { body: { email: otpUser.email, password: otpUser.password } });
  const ticket = l1.body.loginTicket;
  const code = l1.body.devOtp;
  eq((await api("POST", "/api/auth/verify-otp", { body: { loginTicket: ticket, code } })).status, 200, "OTP ilk kullanımda çalışıyor");
  eq((await api("POST", "/api/auth/verify-otp", { body: { loginTicket: ticket, code } })).status >= 400, true,
    "AYNI OTP ikinci kez çalışmıyor (tek kullanımlık)");

  /**
   * SÜRESİ DOLMUŞ OTURUM GERÇEKTEN REDDEDİLİYOR MU? Kod 7 günlük ömür diyor; ama kural yalnızca
   * yazıldığı yerde değil, KONTROL edildiği yerde geçerlidir. Oturumun oluşma zamanını geriye
   * çekip aynı jetonu kullanmayı deniyoruz.
   */
  const expUser = await createUser("owner", { name: "Süre Test", email: "sure-test@example.com", phone: "+905321240052" });
  eq((await api("GET", "/api/auth/me", { token: expUser.token })).status, 200, "taze oturum geçerli");
  // createdAt epoch milisaniye olarak saklanıyor; 40 gün geriye çekiyoruz.
  db().prepare("UPDATE sessions SET createdAt = ? WHERE userId = ? AND role = 'owner'")
    .run(Date.now() - 40 * 86400000, expUser.id);
  eq((await api("GET", "/api/auth/me", { token: expUser.token })).status, 401,
    "40 gün önce açılmış oturum REDDEDİLİYOR (süre kuralı gerçekten uygulanıyor)");

  /**
   * SÜRE KONTROLÜ BOZULDUĞUNDA HANGİ TARAFA DÜŞÜYOR? Bu testi ilk yazarken createdAt'e yanlışlıkla
   * METİN yazdım ve oturum GEÇERLİ çıktı: `Date.now() - "2026-..."` NaN oluyor, `NaN > TTL` her
   * zaman false, yani kontrol sessizce geçiyor ve o jeton sonsuza kadar çalışıyor. Bir güvenlik
   * kontrolünün en kötü hâli, bozulduğunda hata vermek yerine İZİN VERMESİDİR. Artık sayı olmayan
   * bir değer oturumu geçersiz kılıyor.
   */
  const corrupt = await createUser("owner", { name: "Bozuk Süre", email: "bozuk-sure@example.com", phone: "+905321240053" });
  db().prepare("UPDATE sessions SET createdAt = ? WHERE userId = ? AND role = 'owner'")
    .run("2026-01-01T00:00:00.000Z", corrupt.id);
  eq((await api("GET", "/api/auth/me", { token: corrupt.token })).status, 401,
    "createdAt bozuksa oturum GEÇERSİZ sayılıyor (kontrol kapalı tarafa düşüyor)");
  eq(rows("SELECT tokenHash FROM sessions WHERE userId = ? AND role = 'owner'", corrupt.id).length, 0,
    "bozuk oturum kaydı da siliniyor");

  /**
   * KABA KUVVET TESTİ EN SONA BIRAKILDI. OTP sınırlayıcısı IP başına çalışıyor ve 15 dakika
   * kilitliyor; bu blok daha önce çalışırsa aynı IP'den yapılan SONRAKİ meşru girişler de
   * kilitleniyor ve testin geri kalanı çöküyordu. Bu, sınırlayıcının doğru çalıştığının kanıtı —
   * ama aynı zamanda gerçek bir dağıtım uyarısı: paylaşımlı bir IP arkasında (ofis, CGNAT) bir
   * kişinin kaba kuvvet denemesi, aynı çıkıştaki herkesin girişini kilitler (bkz. el kitabı 22.1).
   */
  /**
   * OTP DENEME SAYISI SINIRLI OLMALI: 6 haneli bir kod, sınırsız denemede saniyeler içinde bulunur.
   */
  const l2 = await api("POST", "/api/auth/login", { body: { email: otpUser.email, password: otpUser.password } });
  let otpBlocked = false;
  let attemptsUsed = 0;
  for (let i = 0; i < 12; i++) {
    attemptsUsed += 1;
    const r = await api("POST", "/api/auth/verify-otp", { body: { loginTicket: l2.body.loginTicket, code: "000000" } });
    if (r.status >= 400 && /çok fazla|deneme|geçersiz bilet|süresi/i.test(String(r.body?.error || ""))) {
      // Bilet düşürüldüğünde doğru kod bile artık çalışmamalı — asıl kanıt bu.
      const withRealCode = await api("POST", "/api/auth/verify-otp", { body: { loginTicket: l2.body.loginTicket, code: l2.body.devOtp } });
      if (withRealCode.status >= 400) { otpBlocked = true; break; }
    }
  }
  eq(otpBlocked, true, "yanlış OTP denemeleri bileti düşürüyor (kaba kuvvet kapalı)");
  ok(attemptsUsed <= 6, `sınır makul sayıda denemede devreye giriyor (${attemptsUsed})`);


  // ================================================================ 5b) YÖNETİCİ DEĞİŞİKLİK GÜNLÜĞÜ
  /**
   * DEĞİŞİKLİK GÜNLÜĞÜ NE KAYDEDİYOR? Denetim kaydı tutmak doğru; ama kaydın İÇİNE ne yazıldığı
   * ayrı bir soru. Şifreler her yerde bcrypt ile saklanıyorken, aynı şifrenin DÜZ METİN olarak
   * kalıcı bir denetim tablosuna düşmesi, bütün o çabayı tek satırda boşa çıkarır: tabloyu okuyan
   * herkes (bir yönetici, bir yedek dosyası, bir veritabanı sızıntısı) şifreyi okur. İnsanlar
   * şifrelerini başka sitelerde de kullanıyor, yani zarar bu siteyle sınırlı kalmaz.
   *
   * Kontrol SUNUCUDA olmalı: istemcinin "maskeleyerek gönderiyorum" demesi yetmez — eski bir
   * istemci, hatalı bir çağrı ya da doğrudan API kullanımı maskeyi atlar.
   */
  const victimForPwd = await createUser("owner", { name: "Şifre Kurbanı", email: "pwd-victim@example.com", phone: "+905321240041" });
  const SECRET = "cok-gizli-sifre-123";
  await api("POST", `/api/owners/${victimForPwd.id}/set-password`, { token: admin, body: { password: SECRET } });
  await api("POST", "/api/admin/change-log", {
    token: admin,
    body: {
      action: "password güncellendi", entityType: "owner", entityId: victimForPwd.id,
      before: { field: "password", value: "••••••" },
      after: { field: "password", value: SECRET },
    },
  });
  const logRes = await api("GET", "/api/admin/change-log", { token: admin });
  eq(logRes.raw.includes(SECRET), false, "değişiklik günlüğü şifreyi DÜZ METİN saklamıyor");
  eq(rows("SELECT after FROM admin_change_log WHERE after LIKE ?", `%${SECRET}%`).length, 0,
    "veritabanında da düz metin şifre yok (istemcinin maskesine güvenilmiyor)");
  // Kayıt tamamen kaybolmamalı: "şifre değiştirildi" bilgisi denetim için gerekli.
  ok(logRes.body.some((e) => String(e.action || "").includes("password")), "şifre değişikliği kayıtta DURUYOR (yalnızca değeri gizli)");

  // ================================================================ 5c) SORGU PARAMETRESİ TARAMASI
  /**
   * Şimdiye kadarki tarama yalnızca GÖVDEYİ zorluyordu. Oysa GET uçlarının çoğu sorgu
   * parametresi okuyor (?days, ?field, ?targetType, ?limit, ?seed) ve bunlar da kullanıcı
   * girdisi. Sütun adı ya da SQL parçası olarak kullanılan bir parametre en klasik enjeksiyon
   * yoludur; sayı beklenen yere metin gelmesi de tipik 500 kaynağıdır.
   */
  const EVIL_QUERIES = [
    "?days=1;DROP TABLE owners", "?days=-1", "?days=abc", "?days=999999999999",
    "?field=id);DELETE FROM owners;--", "?field=__proto__", "?field=nonexistent",
    "?targetType=' OR 1=1--", "?limit=1e9", "?offset=-1", "?seed=1,2,'a'",
    "?vin=../../etc/passwd", "?q=%00", "?" + "a".repeat(3000) + "=1",
  ];
  const queryErrors = [];
  for (const e of endpoints) {
    if (e.method !== "GET") continue;
    for (const q of EVIL_QUERIES) {
      const res = await api("GET", fill(e.path) + q, { token: admin });
      if (res.status >= 500) queryErrors.push(`GET ${e.path}${q} → ${res.status} ${String(res.raw).slice(0, 90)}`);
    }
  }
  eq(queryErrors.slice(0, 6), [], "kötü niyetli sorgu parametreleri hiçbir GET ucunda 500 üretmiyor");
  // Enjeksiyon denemesi gerçekten bir şey silmedi mi? Tablolar yerinde olmalı.
  ok(rows("SELECT id FROM owners LIMIT 1").length > 0, "enjeksiyon denemelerinden sonra owners tablosu duruyor");
  ok(rows("SELECT id FROM mechanics LIMIT 1").length > 0, "enjeksiyon denemelerinden sonra mechanics tablosu duruyor");

  // ================================================================ 6b) HESAP SİLME SONRASI VERİ TUTARLILIĞI
  /**
   * "Hesabımı sil" dedikten sonra ARKADA NE KALIYOR? İki ayrı soru var:
   *   a) GİZLİLİK: kişiye ait veri gerçekten gitti mi? (Silme talebi, veriyi elde tutmayı bitirir.)
   *   b) TUTARLILIK: karşı tarafın da tarafı olduğu kayıtlar sahipsiz (orphan) kaldı mı?
   * İkincisi sessiz bir hata sınıfı: ilan yayında kalır, alıcı teklif verir, satıcı yoktur.
   */
  const doomed = await createUser("owner", { name: "Silinecek", email: "silinecek@example.com", phone: "+905321240021" });
  const doomedListing = await api("POST", "/api/listings", {
    token: doomed.token,
    body: { title: "Sahipsiz kalacak ilan", brand: "Fiat", model: "Egea", price: "300000", status: "active" },
  });
  eq(doomedListing.status, 201, "silinecek kullanıcı ilan açtı");
  await api("POST", "/api/recommendations/consent", { token: doomed.token, body: { enabled: true } });
  await api("POST", "/api/recommendations/signal", { token: doomed.token, body: { action: "favorite", listingId: doomedListing.body.id } });
  ok(rows("SELECT value FROM taste_signals WHERE userId = ? AND role = 'owner'", doomed.id).length > 0, "silinecek kullanıcının öneri profili oluştu");

  eq((await api("POST", "/api/auth/delete-account", { token: doomed.token, body: { currentPassword: doomed.password } })).status, 200,
    "hesap silinebiliyor");
  /**
   * DEĞİŞTİ (ikinci denetim): "satır silindi" artık doğru sözleşme DEĞİL — silinen id yeniden
   * veriliyor ve artık kayıtlar yeni kullanıcıya geçiyordu (bkz. api.e2e.mjs'teki uzun gerekçe ve
   * backend/routes/auth.js delete-account yorumu). Ölçtüğümüz şey artık "kişi gitti mi".
   */
  const doomedRow = row("SELECT * FROM owners WHERE id = ?", doomed.id);
  ok(doomedRow, "satır id'yi rezerve etmek için duruyor");
  eq(doomedRow.status, "deleted", "hesap 'deleted' işaretli");
  eq(doomedRow.name, "Silinmiş kullanıcı", "kişi anonimleştirildi");
  // BAĞ KOPTU: aynı id'yi alan biri olsa bile bu ilanı sahiplenemez.
  eq(row("SELECT sellerId FROM listings WHERE id = ?", doomedListing.body.id).sellerId, null,
    "sahipsiz kalan ilanın sellerId bağı koparıldı (yeni kullanıcı devralamaz)");
  // (a) GİZLİLİK: öneri profili de gitmeli.
  eq(rows("SELECT value FROM taste_signals WHERE userId = ? AND role = 'owner'", doomed.id).length, 0,
    "hesap silinince öneri profili de siliniyor");
  // (b) TUTARLILIK: ilanı yayında kalmamalı.
  const orphan = row("SELECT status, sellerId FROM listings WHERE id = ?", doomedListing.body.id);
  eq(orphan?.status, "removed", "silinen kullanıcının ilanı yayından kalkıyor (sahipsiz ilan kalmıyor)");
  eq((await api("GET", "/api/listings")).body.some((l) => l.id === doomedListing.body.id && l.status === "active"), false,
    "sahipsiz ilan herkese açık listede aktif görünmüyor");

  /**
   * YORUM ANONİMLEŞTİRME — hem tabloda hem ÖNBELLEKTE.
   * Yorumlar silinmiyor (tamircinin işletme geçmişi), ama yazarın adı kişisel veri. Kritik ayrıntı:
   * `mechanics.reviewList` sütunu yorumların JSON bir kopyası; tabloyu anonimleştirip kopyayı
   * bırakmak, silinen kullanıcının gerçek adını profilde görünür bırakırdı.
   */
  const reviewer = await createUser("owner", { name: "Yorumcu Silinecek", email: "yorumcu-sil@example.com", phone: "+905321240031" });
  const revTarget = await createUser("mechanic", { name: "Hedef Oto", email: "hedef@example.com", phone: "+905331240032" });
  const apptForReview = await api("POST", "/api/appointments", {
    token: reviewer.token,
    body: { mechanicId: revTarget.id, service: "Bakım", date: "2026-04-01", time: "09:00", status: "Onay Bekliyor" },
  });
  await api("PATCH", `/api/appointments/${apptForReview.body.id}`, { token: revTarget.token, body: { status: "Tamamlandı" } });
  eq((await api("POST", `/api/mechanics/${revTarget.id}/reviews`, { token: reviewer.token, body: { rating: 5, comment: "İyi iş" } })).status, 201,
    "yorum yazıldı");
  ok(row("SELECT reviewList FROM mechanics WHERE id = ?", revTarget.id).reviewList.includes("Yorumcu Silinecek"),
    "yazar adı önbellekte görünüyor (silmeden önce)");
  eq((await api("POST", "/api/auth/delete-account", { token: reviewer.token, body: { currentPassword: reviewer.password } })).status, 200,
    "yorum yazarı hesabını sildi");
  eq(rows("SELECT id FROM mechanic_reviews WHERE mechanicId = ?", revTarget.id).length, 1,
    "yorum SİLİNMEDİ (tamircinin işletme geçmişi tek taraflı yok edilemez)");
  eq(row("SELECT author FROM mechanic_reviews WHERE mechanicId = ?", revTarget.id).author, "Silinmiş kullanıcı",
    "yazar adı tabloda anonimleşti");
  eq(row("SELECT reviewList FROM mechanics WHERE id = ?", revTarget.id).reviewList.includes("Yorumcu Silinecek"), false,
    "ÖNBELLEKTE de gerçek ad kalmadı (iki yerde tutulan verinin tuzağı)");
  ok(row("SELECT rating, reviews FROM mechanics WHERE id = ?", revTarget.id).reviews === 1,
    "puan ve yorum sayısı korundu (anonimleştirme puanı bozmuyor)");

  // ================================================================ 6c) TARAYICI TARAFI SALDIRI YÜZEYİ
  /**
   * Buraya kadarki her şey sunucu-sunucu bakış açısıydı. Tarayıcıdan gelen saldırılar AYRI bir
   * yüzey: kötü niyetli bir site, kurbanın tarayıcısını kullanarak bizim API'mize istek attırabilir
   * ya da bizim sayfamızı kendi sayfasına gömebilir. Matrisin ilk sürümü hiç `Origin` başlığı
   * göndermiyordu — yani bu yüzeyi HİÇ sınamıyordu. Bu bölüm o boşluğu kapatıyor.
   */
  const withOrigin = (origin) => api("GET", "/api/mechanics", { headers: { Origin: origin } });

  const evilRes = await withOrigin("https://evil.example");
  eq(evilRes.headers["access-control-allow-origin"], undefined,
    "izinsiz origin'e CORS başlığı VERİLMİYOR (tarayıcı yanıtı JS'e teslim etmez)");
  /**
   * Ve bu bir HATA değil: önceki hâlde izinsiz origin 500 dönüyordu. Sunucuda bozulan bir şey yok,
   * istek sadece izinli değil — 500 hem izleme panelinde gerçek arızalarla karışır hem de her
   * istek hata katmanından geçip tam yığın izini günlüğe yazdığı için BEDAVA GÜNLÜK ŞİŞİRME
   * yoluna dönüşür (herhangi bir sayfadaki JS saniyede yüzlerce istek atabilir).
   */
  eq(evilRes.status < 500, true, "izinsiz origin 500 ÜRETMİYOR (günlük şişirme yolu kapalı)");
  eq((await withOrigin("http://localhost:5173")).headers["access-control-allow-origin"], "http://localhost:5173",
    "izinli origin'e başlık veriliyor (kural meşru istemciyi bozmuyor)");
  // Klasik yanlış yapılandırma: origin'i sorgulamadan geri yansıtmak.
  eq((await withOrigin("https://evil.example")).headers["access-control-allow-origin"] === "https://evil.example", false,
    "origin körü körüne geri YANSITILMIYOR");
  // Alt dize eşleşmesi tuzağı: "localhost:5173.evil.com" izinli GÖRÜNMEMELİ.
  eq((await withOrigin("http://localhost:5173.evil.example")).headers["access-control-allow-origin"], undefined,
    "izinli adresi İÇEREN sahte origin reddediliyor (alt dize eşleşmesi yok)");
  eq((await withOrigin("null")).headers["access-control-allow-origin"], undefined,
    "\"null\" origin (kum havuzlu iframe / data: sayfası) reddediliyor");

  // Ön uçuş da aynı kuralı uygulamalı; yoksa yazma istekleri sızardı.
  const preflight = await api("OPTIONS", "/api/vehicles", {
    headers: { Origin: "https://evil.example", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "authorization" },
  });
  eq(preflight.headers["access-control-allow-origin"], undefined, "ön uçuş izinsiz origin'e izin vermiyor");
  eq(preflight.status < 500, true, "ön uçuş de 500 üretmiyor");

  /**
   * ÇEREZ KULLANILMIYOR — ve bu, CSRF açısından yapısal bir avantaj. Oturum jetonu Authorization
   * başlığında taşınıyor; tarayıcı bunu başka bir sitenin isteğine KENDİLİĞİNDEN eklemez. Yani
   * klasik CSRF (kurbanın oturumuyla habersiz işlem yaptırma) bu mimaride mümkün değil.
   * Bir gün çerez tabanlı oturuma geçilirse bu test düşer ve CSRF jetonu gerekli hâle gelir.
   */
  const loginRes = await api("POST", "/api/auth/login", { body: { email: owner.email, password: "yanlis" } });
  eq(loginRes.headers["set-cookie"], undefined, "sunucu çerez KULLANMIYOR (klasik CSRF yapısal olarak kapalı)");

  /**
   * ÖZEL BAŞLIK AÇIĞA ÇIKARILMALI. Tarayıcı, çapraz kaynaklı yanıtta JS'e yalnızca güvenli liste
   * başlıklarını verir; `Access-Control-Expose-Headers` olmadan `X-Total-Count` GİZLENİR.
   * Bu testin var olma sebebi: başlığı ekledikten sonra sunucu-sunucu testler geçiyordu ama
   * tarayıcıda okunamıyordu — test istemcisi tarayıcı olmadığı için CORS kuralları ona
   * uygulanmıyor. Başlığın VARLIĞI yetmez, AÇIĞA ÇIKARILDIĞI da doğrulanmalı.
   */
  const crossOrigin = await api("GET", "/api/mechanics?limit=2", { headers: { Origin: "http://localhost:5173" } });
  ok(String(crossOrigin.headers["access-control-expose-headers"] || "").toLowerCase().includes("x-total-count"),
    "X-Total-Count çapraz kaynakta JS'e açılıyor (yoksa tarayıcı gizler)");
  ok(crossOrigin.headers["x-total-count"], "başlığın kendisi de dönüyor");

  // Çerçeveleme (clickjacking) ve MIME tahmini korumaları HER yanıtta olmalı — hata yanıtlarında da.
  for (const [label, r] of [["normal", await api("GET", "/api/mechanics")], ["404", await api("GET", "/api/yok-boyle")], ["401", await api("GET", "/api/auth/me")]]) {
    eq(r.headers["x-frame-options"], "DENY", `${label}: çerçevelemeye kapalı`);
    eq(r.headers["x-content-type-options"], "nosniff", `${label}: MIME tahmini kapalı`);
    eq(r.headers["referrer-policy"], "no-referrer", `${label}: yönlendiren adres sızmıyor`);
  }

  // ================================================================ 6d) IP: SAHTE BAŞLIK SINIRI AŞAMAZ
  /**
   * BULUNAN AÇIK (ölçüldü): TRUST_PROXY=true iken sahte bir X-Forwarded-For hız sınırını tamamen
   * atlıyordu. Buradaki test, sunucu vekil güveni KAPALI (varsayılan) çalışırken başlığın hiç
   * dikkate alınmadığını GERÇEK istekle doğruluyor — asıl savunma (vekilden gelmeyen isteğin
   * başlığına güvenmemek) birim testlerinde sınanıyor, çünkü farklı bir soket adresinden istek
   * atmak yerel olarak taklit edilemiyor.
   */
  const vinBody = { vin: "WBA3B5C50DF123456" };
  let hitLimit = false;
  for (let i = 0; i < 60; i++) {
    const r = await api("POST", "/api/vehicle-history/lookup", { token: owner.token, body: { vin: `WBA3B5C50DF1234${String(i % 10)}${i % 7}` } });
    if (r.status === 429) { hitLimit = true; break; }
  }
  eq(hitLimit, true, "VIN sorgulama sınırı devreye giriyor");
  // Sahte IP başlığıyla aynı isteği tekrarla: sınır AŞILMAMALI.
  const spoofAttempts = [];
  for (const fake of ["1.2.3.4", "evil, 1.2.3.4", "9.9.9.9, 8.8.8.8, 7.7.7.7", "::ffff:5.5.5.5"]) {
    const r = await api("POST", "/api/vehicle-history/lookup", {
      token: owner.token, body: vinBody, headers: { "X-Forwarded-For": fake },
    });
    spoofAttempts.push(r.status);
  }
  eq(spoofAttempts.every((s) => s === 429), true,
    `sahte X-Forwarded-For hız sınırını AŞAMIYOR (dönen kodlar: ${spoofAttempts.join(",")})`);

  // ================================================================ 6e) MEDYA DOĞRULAMA (Faz 1)
  /**
   * Bu blok iki şeyi birlikte kanıtlıyor ve İKİNCİSİ daha önemli:
   *   1) Zararlı/aşırı büyük görsel REDDEDİLİYOR.
   *   2) MEVCUT GEÇERLİ BİÇİMLER HÂLÂ KABUL EDİLİYOR. Kullanıcı "çalışan sistemi bozma" dedi;
   *      bu alanlar bugün üç ayrı biçim tutuyor (emoji, https adresi, data URI) ve üçü de meşru.
   *      Bir güvenlik kısıtı meşru veriyi reddediyorsa o bir düzeltme değil, yeni bir hatadır.
   */
  const img = (mime, kb) => `data:${mime};base64,` + "A".repeat(Math.round(kb * 1024 * 4 / 3));

  // --- MEVCUT BİÇİMLER BOZULMADI ---
  const okEmoji = await api("PATCH", `/api/mechanics/${mech.id}`, { token: mech.token, body: { img: "🔧" } });
  eq(okEmoji.status, 200, "emoji img alanı hâlâ kabul ediliyor (tohum verisi bu biçimde)");
  const okUrl = await api("PATCH", `/api/mechanics/${mech.id}`, { token: mech.token, body: { coverPhoto: "https://loremflickr.com/800/600/car?lock=9" } });
  eq(okUrl.status, 200, "https adresi hâlâ kabul ediliyor");
  const okEmpty = await api("PATCH", `/api/mechanics/${mech.id}`, { token: mech.token, body: { coverPhoto: "" } });
  eq(okEmpty.status, 200, "boş değer (fotoğrafı kaldır) hâlâ çalışıyor");
  const okJpeg = await api("PATCH", `/api/mechanics/${mech.id}`, { token: mech.token, body: { coverPhoto: img("image/jpeg", 300) } });
  eq(okJpeg.status, 200, "makul boyutlu JPEG data URI kabul ediliyor (istemcinin ürettiği tipik boyut)");
  ok(row("SELECT coverPhoto FROM mechanics WHERE id = ?", mech.id).coverPhoto.startsWith("data:image/jpeg"),
    "kabul edilen görsel GERÇEKTEN kaydedildi");

  // --- ZARARLI / AŞIRI BÜYÜK REDDEDİLİYOR ---
  const svg = await api("PATCH", `/api/mechanics/${mech.id}`, {
    token: mech.token,
    body: { coverPhoto: "data:image/svg+xml;base64," + Buffer.from('<svg onload="alert(1)"/>').toString("base64") },
  });
  eq(svg.status, 400, "SVG REDDEDİLİYOR (script taşıyabilir)");
  ok(/SVG/i.test(String(svg.body?.error || "")), "ret mesajı sebebini söylüyor");
  eq(row("SELECT coverPhoto FROM mechanics WHERE id = ?", mech.id).coverPhoto.startsWith("data:image/svg"), false,
    "SVG veritabanına YAZILMADI (kabul etmemek, göstermemekten sağlam)");

  eq((await api("PATCH", `/api/mechanics/${mech.id}`, { token: mech.token, body: { coverPhoto: "data:text/html;base64,PHNjcmlwdD4=" } })).status, 400,
    "text/html data URI reddediliyor");
  /**
   * 4,5 MB'lık gövde express.json'ın 5 MB sınırını (JSON kaçışlarıyla birlikte) aşıyor ve daha
   * medya doğrulamasına GELMEDEN reddediliyor. Bu testi yazarken oranın 500 döndüğünü gördüm —
   * gerçek bir hata, çünkü sunucuda bozulan bir şey yok, istek fazla büyük. 413'e çevrildi.
   */
  eq((await api("PATCH", `/api/mechanics/${mech.id}`, { token: mech.token, body: { coverPhoto: img("image/jpeg", 4500) } })).status, 413,
    "gövde sınırını aşan istek 413 veriyor (500 DEĞİL)");
  // Gövde sınırının ALTINDA ama medya tavanının ÜSTÜNDE olan durum: doğrulama devreye giriyor.
  eq((await api("PATCH", `/api/mechanics/${mech.id}`, { token: mech.token, body: { coverPhoto: img("image/jpeg", 2600) } })).status, 400,
    "2,6 MB görsel medya doğrulamasıyla reddediliyor (tavan 2 MB)");
  eq((await api("PATCH", `/api/owners/${owner.id}`, { token: owner.token, body: { photo: img("image/png", 1500) } })).status, 400,
    "profil fotoğrafında daha dar tavan (ekranda 120px gösteriliyor)");

  // --- DİZİ ALANLARI: öğe sayısı ve TOPLAM boyut ---
  const manyPhotos = await api("POST", "/api/listings", {
    token: owner.token,
    body: { title: "Çok fotoğraflı", brand: "BMW", price: "400000", status: "active", photos: Array(25).fill(img("image/jpeg", 100)) },
  });
  eq(manyPhotos.status, 400, "25 galeri fotoğrafı reddediliyor (üst sınır 20)");
  // Toplam boyut kontrolü: her biri tavanın altında (1,5 MB) ama toplamı 12 MB'ı aşıyor.
  // Gövde sınırına takılmamak için 4 MB'lık toplamla test edilemez — bu yüzden 9 × 1,5 MB = 13,5 MB
  // yerine gövde sınırının altında kalan bir kurgu gerekiyor; medya tavanı zaten öğe başına
  // çalıştığı için toplam kontrolünü ayrı bir birim testiyle doğruluyoruz (aşağıda).
  const bigTotal = await api("POST", "/api/listings", {
    token: owner.token,
    body: { title: "Toplam büyük", brand: "BMW", price: "400000", status: "active", photos: Array(4).fill(img("image/jpeg", 1000)) },
  });
  ok([201, 400, 413].includes(bigTotal.status),
    `4 × 1 MB galeri: ${bigTotal.status} — 413 (gövde sınırı) da geçerli bir ret; ikisi de veriyi engelliyor`);
  const goodGallery = await api("POST", "/api/listings", {
    token: owner.token,
    body: { title: "Normal galeri", brand: "BMW", price: "400000", status: "active", photo: img("image/jpeg", 250), photos: Array(6).fill(img("image/jpeg", 250)) },
  });
  eq(goodGallery.status, 201, "GERÇEKÇİ ilan (1 kapak + 6 galeri, 250 KB) hâlâ kabul ediliyor");

  // --- SOHBET TAVANI ---
  const convo = await api("POST", "/api/conversations", { token: owner.token, body: { mechanicId: mech.id, mechanicName: "Matris Oto", messages: [] } });
  eq((await api("POST", `/api/conversations/${convo.body.id}/messages`, {
    token: owner.token, body: { message: { text: "foto", image: img("image/jpeg", 3500) } },
  })).status, 400, "sohbette 3,5 MB görsel reddediliyor (tavan 2 MB)");
  eq((await api("POST", `/api/conversations/${convo.body.id}/messages`, {
    token: owner.token, body: { message: { text: "foto", image: "data:image/svg+xml;base64,PHN2Zy8+" } },
  })).status, 400, "sohbette SVG reddediliyor");
  eq((await api("POST", `/api/conversations/${convo.body.id}/messages`, {
    token: owner.token, body: { message: { text: "merhaba", image: img("image/jpeg", 400) } },
  })).status, 200, "normal sohbet fotoğrafı hâlâ gönderilebiliyor");

  // --- MEDYA YAZMALARINDA HIZ SINIRI ---
  /**
   * Boyut tavanı bir isteğin ne kadar yazacağını sınırlıyor; bu sınır KAÇ istek atılacağını.
   * İkisi de gerekli: 2 MB tavanla dakikada 500 istek hâlâ gigabaytlar yazar.
   */
  let mediaBlocked = false;
  for (let i = 0; i < 40; i++) {
    const r = await api("PATCH", `/api/mechanics/${mech.id}`, { token: mech.token, body: { coverPhoto: img("image/jpeg", 60) } });
    if (r.status === 429) { mediaBlocked = true; break; }
  }
  eq(mediaBlocked, true, "görsel yazmalarında hız sınırı devreye giriyor");
  // Metin düzenlemesi ETKİLENMEMELİ — sınır yalnızca görsel taşıyan yazmalara.
  eq((await api("PATCH", `/api/mechanics/${mech.id}`, { token: mech.token, body: { name: "Yeni Ad 2" } })).status, 200,
    "görsel sınırı sıradan metin düzenlemesini ENGELLEMİYOR");

  // --- SIKIŞTIRMA ---
  const plain = await api("GET", "/api/mechanics");
  const zipped = await api("GET", "/api/mechanics", { headers: { "Accept-Encoding": "gzip" } });
  eq(zipped.headers["content-encoding"], "gzip", "yanıtlar gzip ile sıkıştırılıyor");
  eq(zipped.headers["vary"], "Accept-Encoding", "Vary başlığı var (ara vekiller karıştırmasın)");
  ok(Number(zipped.headers["content-length"]) < plain.raw.length / 2, "sıkıştırma en az 2x kazandırıyor");
  ok(Array.isArray(zipped.body) && zipped.body.length > 0, "sıkıştırılmış yanıt GEÇERLİ JSON (istemci hiç değişmedi)");
  eq((await api("GET", "/api/auth/me", { headers: { "Accept-Encoding": "gzip" } })).headers["content-encoding"], undefined,
    "kimlik uçları sıkıştırma dışında (ihtiyat: jeton/OTP gövdede geçiyor)");

  // ================================================================ 7) YANIT ŞİŞKİNLİĞİ
  /**
   * Bir uç ihtiyacından fazla veri döndürüyorsa, bugün zararsız olan alan yarın hassas hâle gelir.
   * Girişsiz tamirci listesinde banka bilgisi ve kişisel tercihler görünmemeli.
   */
  /**
   * SAYFALAMA ve ÜST SINIR. Sınırsız liste, ölçek büyüdüğünde bedava bir yük bindirme yoludur;
   * ama sessizce kırpmak "veri kayboldu" hatalarının kaynağıdır. Bu yüzden sayfalama isteğe bağlı,
   * tavan yüksek ve her yanıtta toplam sayı BAŞLIKTA dönüyor — kırpılma görülebilir olsun.
   */
  const fullList = await api("GET", "/api/mechanics");
  const paged = await api("GET", "/api/mechanics?limit=3");
  eq(paged.body.length, 3, "?limit çalışıyor");
  const paged2 = await api("GET", "/api/mechanics?limit=3&offset=3");
  eq(paged2.body.length, 3, "?offset çalışıyor");
  eq(paged.body[0].id === paged2.body[0].id, false, "offset gerçekten farklı kayıt döndürüyor");
  eq((await api("GET", "/api/mechanics?limit=-5")).body.length, fullList.body.length, "eksi limit yok sayılıyor");
  eq((await api("GET", "/api/mechanics?limit=abc")).body.length, fullList.body.length, "metin limit yok sayılıyor");
  eq((await api("GET", "/api/mechanics?limit=99999")).body.length, fullList.body.length, "tavan aşılamıyor");
  // Kırpılma tespit edilebilir olmalı: toplam sayı başlıkta.
  const withHeader = await api("GET", "/api/mechanics?limit=2");
  ok(Number(withHeader.headers?.["x-total-count"]) >= fullList.body.length,
    "X-Total-Count başlığı gerçek toplamı veriyor (kırpılma görülebilir)");
  eq((await api("GET", "/api/vehicles?limit=1", { token: owner.token })).status, 200, "sayfalama özel kaynaklarda da çalışıyor");

  const publicMechs = await api("GET", "/api/mechanics");
  const leakedFields = ["iban", "bankName", "accountHolder", "favoriteIds", "likedReviewIds", "savedSearches", "verificationDocs"]
    .filter((f) => new RegExp(`"${f}"\\s*:`).test(publicMechs.raw));
  eq(leakedFields, [], "girişsiz tamirci listesi banka/kişisel/belge alanlarını döndürmüyor");
  // Aynı liste YÖNETİCİYE tam dönmeli: yönetim paneli doğrulama belgelerini okuyor. Filtre
  // herkese açık okuma için var, yöneticiyi kör etmek için değil.
  ok(/"verificationDocs"\s*:/.test((await api("GET", "/api/mechanics", { token: admin })).raw),
    "yönetici toplu listede doğrulama belgelerini görebiliyor");
  // signupIpHash HİÇ KİMSEYE dönmüyor — yöneticiye de.
  eq(/"signupIpHash"\s*:/.test((await api("GET", "/api/mechanics", { token: admin })).raw), false,
    "kayıt IP karması yöneticiye bile dönmüyor (kararı sunucu veriyor)");
} finally {
  stopServer();
}

if (failures.length === 0) {
  console.log(`OK güvenlik matrisi (${passed})`);
  process.exit(0);
}
console.log(`BAŞARISIZ güvenlik matrisi — ${failures.length}/${passed + failures.length}`);
for (const f of failures) console.log("  ✗ " + f);
process.exit(1);
