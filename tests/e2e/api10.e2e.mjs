/**
 * YENİ CİHAZ/TARAYICI BİLDİRİMİ — GERÇEK SUNUCUYA KARŞI.
 * ================================================================================================
 * Saf mantık (UA ayrıştırma, parmak izi kararlılığı) tests/device-fingerprint.test.mjs'te ölçülüyor.
 * Burada ölçülen şey davranış: gerçek bir giriş akışında kayıt gerçekten oluşuyor mu, bildirim
 * DOĞRU anlarda mı gidiyor, ve en önemlisi — bu özellik bir güvenlik açığı açıyor mu.
 *
 * BİLDİRİM GİDİP GİTMEDİĞİNİ NASIL ÖLÇÜYORUZ: yönetici ölçümlerindeki `mail.queued` sayacıyla.
 * Her giriş zaten 1 e-posta kuyruğa alıyor (OTP kodu). Yani bir girişin deltası:
 *   1 → yalnızca OTP gitti, yeni cihaz bildirimi YOK
 *   2 → OTP + yeni cihaz bildirimi
 * Frontend'e ya da dönen mesaja bakmıyoruz; sayaç sunucunun kendi kaydı.
 */
import {
  startServer, stopServer, api, row, rows, createUser, adminToken, skipIfUnsupported,
} from "./harness.mjs";
import { eq, ok, report } from "../_harness.mjs";

if (skipIfUnsupported("uçtan uca yeni cihaz bildirimi")) process.exit(0);

// Gerçek tarayıcıların UA metinleri — testin taklit ettiği şey tam olarak bu.
const UA = {
  chromeMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  safariIphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
  edgeWin: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
  firefoxWin: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  chromeMacNewVersion: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

await startServer();
try {
  const admin = await adminToken();
  const queued = async () => (await api("GET", "/api/admin/metrics", { token: admin })).body.mail.queued;

  /**
   * Belirli bir tarayıcıdan giriş yapan yardımcı. Harness'in `login()`'i başlık göndermiyor;
   * bu özelliğin girdisi TAM OLARAK o başlık olduğu için kendi akışımızı yazıyoruz.
   * Dönüş: { token, mails } — mails o girişte kuyruğa giren e-posta sayısı.
   */
  async function loginWith(email, password, userAgent) {
    const before = await queued();
    const res = await api("POST", "/api/auth/login", { body: { email, password }, headers: { "User-Agent": userAgent } });
    if (res.status !== 200) throw new Error(`login → ${res.status} ${res.raw}`);
    const otp = await api("POST", "/api/auth/verify-otp", {
      body: { loginTicket: res.body.loginTicket, code: res.body.devOtp },
      headers: { "User-Agent": userAgent },
    });
    if (otp.status !== 200) throw new Error(`verify-otp → ${otp.status} ${otp.raw}`);
    return { token: otp.body.token, mails: (await queued()) - before };
  }

  // Kayıt + ilk giriş. createUser kendi girişini yapıyor, bu yüzden ilk cihaz zaten kaydedildi;
  // aşağıda o kaydın varlığını ve ona BİLDİRİM GİTMEDİĞİNİ ayrı bir kullanıcıyla ölçüyoruz.
  const reg = await api("POST", "/api/auth/register", {
    body: { role: "owner", name: "Cihaz A", email: "a10-a@example.com", phone: "+905321280001" },
  });
  eq(reg.status, 201, "kullanıcı kaydı oluştu");
  const pwA = reg.body.devPassword;
  const idA = row("SELECT id FROM owners WHERE lower(email) = ?", "a10-a@example.com").id;

  // ===== 1) İLK GİRİŞ: kayıt oluşuyor, BİLDİRİM GİTMİYOR =====================================
  // Hesabı yeni açan birinin ilk girişi tanımı gereği "yeni cihaz"dır. Ona "hesabınıza yeni bir
  // cihazdan giriş yapıldı" demek anlamsız bir korku mesajı olurdu.
  {
    eq(rows("SELECT * FROM user_devices WHERE userId = ? AND role = 'owner'", idA).length, 0,
      "girişten önce hiç cihaz kaydı yok");
    const a = await loginWith("a10-a@example.com", pwA, UA.chromeMac);
    ok(a.token, "ilk giriş başarılı");
    eq(a.mails, 1, "ilk girişte SADECE OTP e-postası gitti (yeni cihaz bildirimi YOK)");

    const devices = rows("SELECT * FROM user_devices WHERE userId = ? AND role = 'owner'", idA);
    eq(devices.length, 1, "cihaz yine de KAYDEDİLDİ (ikinci cihaz tespit edilebilsin diye)");
    eq(devices[0].label, "Chrome · macOS", "etiket UA'dan doğru çıkarıldı");
    eq(devices[0].loginCount, 1, "giriş sayacı 1");
    ok(devices[0].firstSeenAt > 0 && devices[0].lastSeenAt > 0, "ilk/son görülme zamanı yazıldı");
  }

  // ===== 2) AYNI TARAYICI TEKRAR: bildirim YOK, sayaç artıyor ================================
  // Bu, özelliği kullanılamaz hâle getirebilecek en olası hata: her girişte "yeni cihaz" demek.
  {
    const again = await loginWith("a10-a@example.com", pwA, UA.chromeMac);
    eq(again.mails, 1, "aynı tarayıcıdan ikinci giriş bildirim ÜRETMİYOR");
    const d = row("SELECT * FROM user_devices WHERE userId = ? AND role = 'owner'", idA);
    eq(d.loginCount, 2, "bilinen cihazın giriş sayacı arttı");
    eq(rows("SELECT * FROM user_devices WHERE userId = ?", idA).length, 1, "yeni satır AÇILMADI");
  }

  // ===== 3) TARAYICI SÜRÜM GÜNCELLEMESİ: yeni cihaz DEĞİL ====================================
  /**
   * Alarm yorgunluğunu önleyen karar. Tarayıcılar birkaç haftada bir kendini günceller; sürüm
   * parmak izine katılsaydı her güncellemede uyarı giderdi ve kullanıcı bir süre sonra hiçbirini
   * okumaz olurdu — gerçek olanı da dâhil.
   */
  {
    const upd = await loginWith("a10-a@example.com", pwA, UA.chromeMacNewVersion);
    eq(upd.mails, 1, "Chrome 120 → 131 güncellemesi bildirim ÜRETMİYOR");
    eq(rows("SELECT * FROM user_devices WHERE userId = ?", idA).length, 1, "yeni cihaz satırı açılmadı");
  }

  // ===== 4) GERÇEKTEN YENİ TARAYICI: bildirim GİDİYOR ========================================
  // Özelliğin asıl işi. Buraya kadar hep "gitmemeli" ölçtük; burada "gitmeli".
  {
    const iph = await loginWith("a10-a@example.com", pwA, UA.safariIphone);
    eq(iph.mails, 2, "farklı tarayıcı/sistem → OTP + YENİ CİHAZ bildirimi");
    const devices = rows("SELECT label FROM user_devices WHERE userId = ? ORDER BY label", idA);
    eq(devices.map((d) => d.label).join(" | "), "Chrome · macOS | Safari · iPhone",
      "iki cihaz da listede, doğru etiketlerle");

    // Aynı yeni tarayıcı ikinci kez: artık bilinen, tekrar bildirim yok.
    const iph2 = await loginWith("a10-a@example.com", pwA, UA.safariIphone);
    eq(iph2.mails, 1, "yeni cihaz bir kez bildiriliyor, her girişte değil");
  }

  // ===== 5) HAM VERİ SAKLANMIYOR: UA metni de, IP de =========================================
  /**
   * Bildirim için gereken şey "bu tarayıcı daha önce görüldü mü" sorusunun cevabı. Ham UA
   * (sürüm, derleme numarası, bazen cihaz modeli) ve ham IP bundan fazlası — amaç dışı veri.
   */
  {
    const all = rows("SELECT * FROM user_devices WHERE userId = ?", idA);
    const dump = JSON.stringify(all);
    ok(!dump.includes("Mozilla/5.0"), "ham User-Agent metni veritabanında YOK");
    ok(!dump.includes("AppleWebKit"), "UA'nın hiçbir parçası saklanmıyor");
    ok(!dump.includes("127.0.0.1") && !dump.includes("::1"), "ham IP adresi saklanmıyor");
    for (const d of all) {
      ok(/^[0-9a-f]{32}$/.test(d.deviceHash), "cihaz kimliği karma (geri çevrilemez)");
      ok(d.lastIpHash === null || /^[0-9a-f]+$/.test(d.lastIpHash), "IP yalnızca karma olarak tutuluyor");
    }
    // Şemada coğrafi konum alanı olmaması da bilinçli: konum çözmek kullanıcının IP'sini bir
    // üçüncü tarafa göndermek demekti.
    ok(!Object.keys(all[0]).some((k) => /city|country|geo|lat|lon|region/i.test(k)),
      "şemada konum alanı yok (IP üçüncü tarafa gönderilmiyor)");
  }

  // ===== 6) EN ÖNEMLİSİ: BU BİR KİMLİK DOĞRULAMA FAKTÖRÜ DEĞİL ===============================
  /**
   * Parmak izi tamamen istemcinin yazdığı bir başlıktan türüyor; `curl -H "User-Agent: ..."` ile
   * taklit edilebilir. Dolayısıyla "bu cihaz tanıdık, OTP'yi atla" gibi bir kısayol olsaydı,
   * güvenliği ARTIRMAK için eklenen özellik onu AZALTAN bir bypass'a dönüşürdü. Ölçüyoruz.
   */
  {
    // (a) Tanıdık cihazdan giriş bile OTP istiyor: /login doğrudan token DÖNMÜYOR.
    const res = await api("POST", "/api/auth/login", {
      body: { email: "a10-a@example.com", password: pwA },
      headers: { "User-Agent": UA.chromeMac },   // en tanıdık cihaz
    });
    eq(res.status, 200, "tanıdık cihazdan giriş isteği kabul edildi");
    ok(!res.body.token, "tanıdık cihaz olsa bile /login OTURUM JETONU DÖNDÜRMÜYOR");
    ok(res.body.loginTicket, "ikinci adım (OTP) yine şart");

    // (b) Yanlış OTP, tanıdık cihazdan da reddediliyor.
    const badCode = await api("POST", "/api/auth/verify-otp", {
      body: { loginTicket: res.body.loginTicket, code: "000000" },
      headers: { "User-Agent": UA.chromeMac },
    });
    ok(badCode.status >= 400, "tanıdık cihaz + yanlış kod → reddedildi (cihaz kodu geçersiz kılmıyor)");
    ok(!badCode.body?.token, "reddedilen denemede jeton üretilmedi");
  }

  // ===== 7) SAHTE UA GİRİŞİ ETKİLEMİYOR, SADECE ETİKETİ ======================================
  // UA taklit edilebilir; edildiğinde olan tek şey kullanıcıya gösterilen etiketin yanlış olması.
  // Yetki, oturum ya da OTP tarafında hiçbir sonucu yok. Sunucu da çökmüyor.
  /**
   * NOT (ölçerek öğrenildi): buraya ilk yazdığım payload bir NUL byte içeriyordu ve `fetch`
   * isteği GÖNDERMEDİ — "invalid header value". Yani kontrol karakterli bir UA sunucuya HTTP
   * üzerinden hiç ulaşamıyor; protokolün kendisi engelliyor. O durum yine de birim testinde
   * (tests/device-fingerprint.test.mjs) kapsanıyor; burada ağdan GEÇEBİLEN bir payload kullanıyoruz.
   */
  {
    const junk = await loginWith("a10-a@example.com", pwA, "<script>alert(1)</script>' OR 1=1 --");
    ok(junk.token, "çöp/enjeksiyon içeren UA ile giriş normal şekilde tamamlanıyor");
    const labels = rows("SELECT label FROM user_devices WHERE userId = ?", idA).map((d) => d.label);
    ok(labels.includes("Bilinmeyen tarayıcı"), "tanınmayan UA anlamlı bir etikete düşüyor");
    ok(!labels.some((l) => l.includes("<script>") || l.includes("OR 1=1")),
      "UA içeriği etikete OLDUĞU GİBİ geçmiyor (e-postaya/arayüze taşınmıyor)");
  }

  // ===== 8) GÜNLÜK TAVAN: bildirim bombardımanı yapılamıyor ==================================
  /**
   * Şifreyi bilen biri (ama OTP'yi bilmeyen) burayı bir taciz aracına çeviremez — çünkü kayıt
   * OTP'DEN SONRA yapılıyor. Yine de tavan var: hesabı gerçekten ele geçiren biri kurbanın
   * gelen kutusunu doldurarak GERÇEK uyarıyı gözden kaçırtamasın.
   */
  {
    const before = rows("SELECT * FROM user_devices WHERE userId = ?", idA).length;
    let notified = 0;
    for (let i = 0; i < 12; i++) {
      const r = await loginWith("a10-a@example.com", pwA, `Mozilla/5.0 (Windows NT 10.0) FakeBrowser${i}/1.0 Chrome/1.0`);
      if (r.mails > 1) notified++;
    }
    ok(notified > 0, "yeni cihazlar bildirildi");
    ok(notified <= 5, `günlük bildirim tavanı çalışıyor (12 yeni cihaz → ${notified} bildirim)`);

    // Cihaz listesi de sınırsız büyümüyor: en eski düşüyor.
    const after = rows("SELECT * FROM user_devices WHERE userId = ?", idA).length;
    ok(after <= 20, `cihaz listesi sınırlı (${before} → ${after}, tavan 20)`);
  }

  // ===== 9) LİSTE UCUNUN YETKİSİ: başkasının cihazları okunamıyor ============================
  const B = await createUser("owner", { name: "Cihaz B", email: "a10-b@example.com", phone: "+905321280002" });
  {
    const anon = await api("GET", "/api/auth/devices");
    eq(anon.status, 401, "oturumsuz cihaz listesi okunamıyor");

    const mine = await api("GET", "/api/auth/devices", { token: B.token });
    eq(mine.status, 200, "kullanıcı kendi cihaz listesini okuyabiliyor");
    eq(mine.body.devices.length, 1, "B yalnızca KENDİ cihazını görüyor (A'nın 20 cihazını değil)");

    /**
     * Uç `userId` parametresi ALMIYOR — kimlik oturumdan geliyor. Yine de deneyelim: parametreyi
     * uydurup başkasının verisini istemek (IDOR) bu projede daha önce birkaç yerde işe yaramıştı.
     */
    const idor = await api("GET", `/api/auth/devices?userId=${idA}&role=owner`, { token: B.token });
    eq(idor.status, 200, "parametre yok sayıldı, hata da vermedi");
    eq(idor.body.devices.length, 1, "parametreyle BAŞKASININ cihazları okunamadı");

    // Yanıt IP ya da konum taşımıyor: kullanıcının kendi listesi bile fazladan veri göstermiyor.
    const dump = JSON.stringify(mine.body);
    ok(!/ipHash|lastIp|city|country/i.test(dump), "cihaz listesi yanıtı IP/konum taşımıyor");
    eq(Object.keys(mine.body.devices[0]).sort().join(","), "firstSeenAt,label,lastSeenAt,loginCount",
      "yanıt yalnızca gerekli alanları içeriyor");
  }

  // ===== 10) ROLLER AYRI: aynı e-posta iki rolde olsa cihazlar karışmıyor ====================
  {
    const M = await createUser("mechanic", { name: "Cihaz M", email: "a10-m@example.com", phone: "+905321280003" });
    const md = await api("GET", "/api/auth/devices", { token: M.token });
    eq(md.body.devices.length, 1, "tamircinin kendi cihaz listesi ayrı");
    eq(rows("SELECT * FROM user_devices WHERE userId = ? AND role = 'mechanic'", M.id).length, 1,
      "kayıt role göre ayrılmış (id çakışması cihazları karıştırmıyor)");
  }

  // ===== 11) HESAP SİLİNİNCE CİHAZ KAYDI DA GİDİYOR =========================================
  /**
   * Bu projede tam olarak bu sınıf hata bir KRİTİK bulguya yol açmıştı: silinen kullanıcının
   * kayıtları kalıyor, SQLite id'yi yeniden kullanıyor ve yeni kullanıcı öncekinin verilerini
   * devralıyordu. Yeni tablo eklerken aynı hatayı tekrar etmediğimizi ölçüyoruz.
   */
  {
    const idB = B.id;
    eq(rows("SELECT * FROM user_devices WHERE userId = ? AND role = 'owner'", idB).length, 1,
      "silmeden önce B'nin cihaz kaydı var");
    const del = await api("POST", "/api/auth/delete-account", {
      token: B.token, body: { currentPassword: B.password },
    });
    eq(del.status, 200, "hesap silme başarılı");
    eq(rows("SELECT * FROM user_devices WHERE userId = ? AND role = 'owner'", idB).length, 0,
      "cihaz kayıtları da SİLİNDİ (yeni kullanıcı bu id'yi alırsa devralmıyor)");
  }
} finally {
  stopServer();
}

report("uçtan uca yeni cihaz bildirimi");
