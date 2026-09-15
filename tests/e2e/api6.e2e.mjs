/**
 * UÇTAN UCA — İZLEME VE E-POSTA KUYRUĞU (Faz 5).
 * ================================================================================================
 * İKİ ŞEY ÖLÇÜLÜYOR:
 *
 * 1. ÖLÇÜM DOĞRU MU. Yanlış bir metrik, metriğin olmamasından daha kötüdür: insan ona bakıp
 *    karar verir. O yüzden burada "uç 200 döndü" demiyoruz; BİLİNEN sayıda istek atıp sayaçların
 *    o sayıya uyduğunu, bilerek 404/500 üretip doğru sınıfa yazıldığını doğruluyoruz.
 *
 * 2. ÖLÇÜM SIZDIRMIYOR MU. İzleme verisi hem işletme hem saldırı istihbaratıdır: hata oranı,
 *    yavaş uçlar, veritabanı boyutu. Bu yüzden yönetici arkasında olması ve dosya yolları gibi
 *    sunucu düzeni bilgisini içermemesi gerekiyor — ikisi de test ediliyor.
 *
 * E-POSTA tarafında ölçülen şey teslimat DEĞİL (SMTP yok), ŞU: istek e-postayı BEKLEMİYOR ve
 * kuyruk sınırsız büyümüyor.
 */
import { startServer, stopServer, api, BASE, createUser, adminToken, skipIfUnsupported } from "./harness.mjs";

if (skipIfUnsupported("e2e izleme")) process.exit(0);

let passed = 0;
const failures = [];
const ok = (v, name) => { if (v) passed++; else failures.push(name); };
const eq = (got, want, name) => ok(got === want, `${name} (beklenen: ${want}, gelen: ${got})`);

try {
  await startServer();
  const admin = await adminToken();
  const metrics = () => api("GET", "/api/admin/metrics", { token: admin });

  // ============================================================ YETKİ
  {
    const anon = await api("GET", "/api/admin/metrics");
    ok(anon.status === 401 || anon.status === 403, `oturumsuz ölçüm erişimi engellendi (${anon.status})`);
    const owner = await createUser("owner", { name: "Ölçüm Sahip", email: "metrik.owner@test.local" });
    const asOwner = await api("GET", "/api/admin/metrics", { token: owner.token });
    ok(asOwner.status === 401 || asOwner.status === 403,
      `normal kullanıcı ölçümleri GÖREMİYOR (${asOwner.status}) — bu veri saldırı istihbaratı da`);
  }

  // ============================================================ HERKESE AÇIK /api/health YALIN KALDI
  /**
   * Kolay hata: "izleme ekledik" deyip her şeyi /api/health'e koymak. Yük dengeleyicinin sorduğu
   * soru "ayakta mısın" — hata oranını ve veritabanı boyutunu anonim birine söylemek için sebep yok.
   */
  {
    const h = await api("GET", "/api/health");
    eq(h.status, 200, "sağlık ucu çalışıyor");
    const keys = Object.keys(h.body || {});
    ok(keys.length <= 3, `sağlık ucu yalın kaldı (${keys.join(", ")})`);
    for (const leaked of ["requests", "dbBytes", "routes", "serverErrorRate", "memory", "mail"]) {
      ok(!(leaked in (h.body || {})), `herkese açık sağlık ucunda "${leaked}" YOK`);
    }
  }

  // ============================================================ SAYAÇLAR GERÇEKTEN SAYIYOR MU
  {
    const before = (await metrics()).body;
    ok(Number.isInteger(before?.requests) && before.requests > 0, `istek sayacı çalışıyor (${before?.requests})`);

    // BİLİNEN sayıda istek: 7 tanesi 200, 3 tanesi 404.
    for (let i = 0; i < 7; i++) await api("GET", "/api/health");
    for (let i = 0; i < 3; i++) await api("GET", "/api/kesinlikle-boyle-bir-uc-yok");
    const after = (await metrics()).body;

    // +7 +3 +1 (arada attığımız metrics çağrısı da sayılıyor; bu doğru davranış).
    eq(after.requests - before.requests, 11, "istek sayısı BİLİNEN istek sayısına uyuyor");
    eq(after.byClass["2xx"] - before.byClass["2xx"], 8, "2xx sayacı doğru (7 health + 1 metrics)");
    eq(after.byClass["4xx"] - before.byClass["4xx"], 3, "4xx sayacı doğru (3 uydurma yol)");
    eq(after.byClass["5xx"] - before.byClass["5xx"], 0, "hiç 5xx üretilmedi");
    /**
     * 4xx AYRI TUTULUYOR ve bu bilinçli: 404/400 çoğu zaman istemci hatası, sunucu arızası değil.
     * İkisini tek "hata oranına" katmak, gerçek arızayı 404 gürültüsünün içinde gizlerdi.
     */
    eq(after.serverErrorRate, 0, "sunucu hata oranı 4xx'lerden etkilenmiyor");
  }

  // ============================================================ SÜRE ÖLÇÜMÜ ANLAMLI MI
  {
    const m = (await metrics()).body;
    ok(m.avgMs >= 0 && m.avgMs < 5000, `ortalama süre makul (${m.avgMs} ms)`);
    ok(m.maxMs >= m.avgMs, `en yavaş istek ortalamadan büyük ya da eşit (${m.maxMs} ≥ ${m.avgMs})`);
    const bucketTotal = Object.values(m.durations).reduce((a, b) => a + b, 0);
    eq(bucketTotal, m.requests, "süre kovalarının toplamı istek sayısına eşit (hiç istek kaybolmuyor)");
    ok(Object.keys(m.durations).length === 6, `altı süre kovası var (${Object.keys(m.durations).join(" ")})`);
    /**
     * Neden kova, neden p95 değil: gerçek bir yüzdelik için bütün süreleri saklamak gerekir —
     * sınırsız bellek. Ortalama tek başına yeterli değil, çünkü 1000 hızlı istek 10 çok yavaş
     * isteği gizler. Kovalar sabit yer kaplayıp sorulan soruya cevap veriyor.
     */
    ok(m.durations["<5ms"] + m.durations["<25ms"] > 0, "hızlı istekler hızlı kovada");
  }

  // ============================================================ UÇ KIRILIMI SINIRSIZ BÜYÜMÜYOR
  /**
   * Ham `req.path` ile anahtarlamak `/api/listings/1`, `/api/listings/2`... diye sınırsız harita
   * üretirdi — bu projede daha önce oturum ve hız sınırı haritalarında düzeltilen aynı sınıf hata.
   * Yol iki segmente indiriliyor. Aşağıda 40 farklı kimlikle istek atıp tek anahtar oluştuğunu
   * doğruluyoruz.
   */
  {
    const before = (await metrics()).body.routes.length;
    for (let i = 1; i <= 40; i++) await api("GET", `/api/listings/${900000 + i}`);
    const m = (await metrics()).body;
    const listingRoutes = m.routes.filter((r) => r.path === "/api/listings");
    eq(listingRoutes.length, 1, "40 farklı kimlik TEK yol anahtarına indi");
    ok(m.routes.length <= before + 2, `yol haritası şişmedi (${before} → ${m.routes.length})`);
    ok(m.routes.every((r) => !/\d{4,}/.test(r.path)), "hiçbir yol anahtarında kayıt kimliği yok");
    ok(m.routes.length < 60, `yol sayısı üst sınırın altında (${m.routes.length})`);
    eq(m.routesTruncated, false, "harita dolmadı, kırılım tam");
  }

  // ============================================================ MEDYA YOLU DA GRUPLANIYOR MU
  /**
   * `/media/<karma>.jpg` iki segment ve ikincisi HER DOSYADA FARKLI. "İlk iki segmenti al"
   * kuralı tek başına burada çöküyordu: her fotoğraf yeni bir anahtar. Üst sınır belleği korur
   * ama kırılımı işe yaramaz yapardı (60 anahtarın 59'u tek fotoğraf). Bu yüzden ikinci segment
   * yalnızca kaynak adı gibi görünüyorsa tutuluyor.
   */
  {
    const owner2 = await createUser("owner", { name: "Medya Ölçüm", email: "metrik.medya@test.local" });
    const png = "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFElEQVR4nGM8ISfHgA0wYRUdtBIA0MoBFD5jqJkAAAAASUVORK5CYII=";
    const up = await api("POST", "/api/media", { token: owner2.token, body: { data: `data:image/png;base64,${png}` } });
    ok(up.status === 201, `ölçüm için görsel yüklendi (${up.status})`);
    // Aynı dosyayı beş kez iste: beş ayrı anahtar OLUŞMAMALI.
    for (let i = 0; i < 5; i++) await fetch(up.body.url);
    // Var olmayan üç farklı dosya adı da aynı anahtara gitmeli.
    for (let i = 0; i < 3; i++) await fetch(`${BASE}/media/${String(i).repeat(32)}.jpg`);
    const m = (await metrics()).body;
    const mediaRoutes = m.routes.filter((r) => r.path.startsWith("/media"));
    eq(mediaRoutes.length, 1, "sekiz farklı medya adresi TEK anahtara indi");
    eq(mediaRoutes[0]?.path, "/media", "medya anahtarı dosya adı içermiyor");
    ok(mediaRoutes[0].requests >= 8, `medya istekleri sayıldı (${mediaRoutes[0].requests})`);
    ok(!m.routes.some((r) => /\./.test(r.path)), "hiçbir yol anahtarında dosya adı yok");
    // En yavaş uç en üstte: bakılacak ilk yer o olmalı.
    for (let i = 1; i < m.routes.length; i++) {
      ok(m.routes[i - 1].avgMs >= m.routes[i].avgMs, `yollar yavaştan hızlıya sıralı (${i})`);
    }
  }

  // ============================================================ 5xx GERÇEKTEN YAKALANIYOR MU
  /**
   * Hata oranı ölçmenin bütün anlamı bu: gerçek bir 500 sayaca yazılmalı. Kasıtlı 500 üretmek
   * için gövdede beklenmeyen bir tür gönderiyoruz; hangi uç olursa olsun sonuç 5xx ise sayılmalı.
   * Uç 400 ile korunuyorsa (ki doğrusu o) test bunu da kabul ediyor — burada ölçülen şey
   * SAYACIN DOĞRULUĞU, uygulamanın hata verip vermemesi değil.
   */
  {
    const before = (await metrics()).body;
    const bad = await api("POST", "/api/listings", { body: "{bozuk-json", headers: { "Content-Type": "application/json" } });
    const after = (await metrics()).body;
    const cls = `${Math.floor(bad.status / 100)}xx`;
    eq(after.byClass[cls] - before.byClass[cls], 1, `bozuk JSON isteği ${cls} sınıfına yazıldı (durum ${bad.status})`);
    ok(bad.status === 400, `bozuk JSON 400 alıyor, 500 DEĞİL (${bad.status})`);
  }

  // ============================================================ SIZINTI DENETİMİ
  /**
   * Ölçüm yanıtı sunucu DÜZENİNİ açığa vurmamalı: dosya yolları, veritabanı adresi, medya klasörü.
   * Boyut bilgisi işe yarar (klasör beklenmedik büyüyorsa görünsün), YOL bilgisi yaramaz.
   */
  {
    const m = (await metrics()).body;
    const raw = JSON.stringify(m);
    ok(!/\/sessions\/|\/Users\/|\/tmp\/|\/var\//.test(raw), "ölçüm yanıtında dosya sistemi yolu yok");
    ok(!/sqlite/i.test(raw), "veritabanı dosya adı yok");
    ok(!("dir" in (m.media || {})), "medya KLASÖR YOLU dönmüyor (yalnızca sayı ve boyut)");
    ok(Number.isInteger(m.dbBytes) && m.dbBytes > 0, `veritabanı boyutu ölçülüyor (${Math.round(m.dbBytes / 1024)} KB)`);
    ok(Number.isInteger(m.media?.files), "medya dosya sayısı var");
    ok(Number.isInteger(m.memory?.rssBytes) && m.memory.rssBytes > 0, "bellek kullanımı ölçülüyor");
    ok(typeof m.nodeVersion === "string", "Node sürümü bildiriliyor (yönetici için, herkese açık değil)");
    ok(Number.isInteger(m.uptimeSec), "çalışma süresi ölçülüyor");
  }

  // ============================================================ E-POSTA: İSTEK BEKLEMİYOR
  /**
   * Testte SMTP yapılandırılmamış, yani gerçek gönderim yok. O yüzden burada teslimat DEĞİL, şu
   * ölçülüyor: kayıt/giriş yanıtı e-posta işini bekliyor mu, ve kuyruk sayaçları doğru mu.
   * Gerçek gecikme ölçümü ayrı yapıldı (2 sn gecikmeli SMTP: kayıt yanıtı 2006 ms → ~5 ms).
   */
  {
    const before = (await metrics()).body.mail;
    ok(before.configured === false, "test ortamında SMTP yapılandırılmamış (beklenen)");
    const u = await createUser("owner", { name: "Posta", email: "metrik.posta@test.local" });
    ok(!!u.token, "kayıt + giriş akışı e-posta kuyruğuyla çalışmaya devam ediyor");
    const after = (await metrics()).body.mail;
    // Kayıt 1 + giriş 1 = en az 2 e-posta kuyruğa girdi.
    ok(after.queued - before.queued >= 2, `kayıt ve giriş e-postaları kuyruğa alındı (+${after.queued - before.queued})`);
    /**
     * `skipped` AYRI SAYILIYOR, `failed` DEĞİL. SMTP'nin yapılandırılmamış olması bilinen ve
     * kasıtlı bir durum; onu "başarısız" saymak geliştirme ortamında sayacı sürekli kırmızı
     * yapardı — ve SÜREKLİ KIRMIZI YANAN ÖLÇÜM, KİMSENİN BAKMADIĞI ÖLÇÜMDÜR. O zaman gerçek bir
     * SMTP arızası gürültünün içinde kaybolur. (Bu ayrım ilk hâlde yoktu, ölçüm yaparken çıktı.)
     */
    eq(after.failed, 0, "yapılandırılmamış SMTP 'başarısız' sayılmıyor");
    ok(after.skipped >= 2, `atlanan e-postalar ayrı sayılıyor (${after.skipped})`);
    eq(after.dropped, 0, "kuyruk taşmadı");
  }

  // ============================================================ E-POSTA: devOtp YOLU BOZULMADI
  /**
   * Bu en kritik geriye dönük uyumluluk kontrolü: SMTP yapılandırılmamışken giriş kodu yanıtta
   * dönmeye devam etmeli, yoksa geliştirme ve test akışının tamamı kırılır (harness bunu kullanıyor).
   */
  {
    const reg = await api("POST", "/api/auth/register", {
      body: { role: "owner", name: "Devotp", email: "metrik.devotp@test.local", phone: "+905321234567" },
    });
    eq(reg.status, 201, "kayıt 201");
    ok(typeof reg.body?.devPassword === "string", "SMTP yokken devPassword hâlâ dönüyor");
    eq(reg.body?.mailSent, false, "mailSent alanı korundu ve SMTP yoksa false");
    const login = await api("POST", "/api/auth/login", {
      body: { email: "metrik.devotp@test.local", password: reg.body.devPassword },
    });
    eq(login.status, 200, "giriş 200");
    ok(typeof login.body?.devOtp === "string", "SMTP yokken devOtp hâlâ dönüyor (test akışı korundu)");
    ok(typeof login.body?.devNote === "string", "devNote sebebi açıklıyor");
  }
} catch (e) {
  failures.push(`İSTİSNA: ${e.message}`);
} finally {
  stopServer();
}

if (failures.length === 0) {
  console.log(`OK e2e izleme ve e-posta kuyruğu (${passed})`);
  process.exit(0);
}
console.log(`BAŞARISIZ e2e izleme — ${failures.length}/${passed + failures.length}`);
for (const f of failures) console.log("  ✗ " + f);
process.exit(1);
