/**
 * UÇTAN UCA — MEDYA UÇLARI (Faz 4).
 * ================================================================================================
 * Bu takım GERÇEK dosyalarla çalışıyor: aşağıdaki base64 dizeleri gerçek, geçerli JPEG/PNG/GIF/
 * WebP dosyaları (8x8 piksel). Uydurma bayt dizileriyle test etmek imza (magic bytes) denetimini
 * hiç sınamazdı — oysa asıl soru şu: istemcinin İDDİA ettiği tür ile dosyanın GERÇEK türü
 * uyuşmadığında ne oluyor?
 *
 * ÖLÇÜLEN DÖRT ŞEY:
 *   1. Yazma yolu güvenli mi (kimlik doğrulama, hız sınırı, tür, boyut, imza yalanı).
 *   2. Okuma yolu güvenli mi (yol atlama, SVG, cache başlıkları, tür başlığı).
 *   3. Aynı içerik iki kez yüklenince tek dosya mı (içerik karması).
 *   4. MEVCUT SİSTEM BOZULMADI MI — data: URI'ler hâlâ kabul ediliyor ve okunuyor mu.
 *      Dördüncüsü en önemlisi: Faz 4 EKLEME olmalı, değiştirme değil.
 */
import { startServer, stopServer, api, BASE, rows, createUser, adminToken, skipIfUnsupported } from "./harness.mjs";

if (skipIfUnsupported("e2e medya uçları")) process.exit(0);

let passed = 0;
const failures = [];
const ok = (v, name) => { if (v) passed++; else failures.push(name); };

// GERÇEK dosyalar (8x8 piksel, PIL ile üretildi).
const REAL = {
  jpeg: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDkKKKK8U/TD//Z",
  png: "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFElEQVR4nGM8ISfHgA0wYRUdtBIA0MoBFD5jqJkAAAAASUVORK5CYII=",
  gif: "R0lGODdhCAAIAIEAAMgeHgAAAAAAAAAAACwAAAAACAAIAAAIDwABCBxIsKDBgwgTKkwYEAA7",
  webp: "UklGRjoAAABXRUJQVlA4IC4AAACwAQCdASoIAAgAAUAmJaACdLoABDAAAP7x3I/4DdfFtMv/vYL/3YL/3YL/WwAA",
};
const uri = (mime, b64) => `data:${mime};base64,${b64}`;

try {
  await startServer();
  const owner = await createUser("owner", { name: "Medya Sahip", email: "medya.owner@test.local" });

  const upload = (body, token = owner.token) => api("POST", "/api/media", { token, body });

  // ============================================================ YAZMA: KİMLİK DOĞRULAMA
  {
    const anon = await api("POST", "/api/media", { body: { data: uri("image/jpeg", REAL.jpeg) } });
    ok(anon.status === 401, `oturumsuz yükleme 401 (${anon.status}) — anonim olsa bedava dosya barındırma olurdu`);
  }

  // ============================================================ YAZMA: MUTLU YOL
  let firstUrl = null, firstName = null;
  {
    const r = await upload({ data: uri("image/jpeg", REAL.jpeg), kind: "image" });
    ok(r.status === 201, `JPEG yüklendi (${r.status}) ${r.status !== 201 ? r.raw : ""}`);
    ok(typeof r.body?.url === "string" && /\/media\/[0-9a-f]{32}\.jpg$/.test(r.body.url),
      `dönen adres içerik karması biçiminde: ${r.body?.url}`);
    ok(r.body?.contentType === "image/jpeg", `contentType image/jpeg (${r.body?.contentType})`);
    ok(r.body?.bytes > 0, "bayt sayısı bildirildi");
    ok(r.body?.deduped === false, "ilk yüklemede deduped=false");
    firstUrl = r.body?.url; firstName = r.body?.name;
  }
  // Dosya adı KULLANICIDAN gelmiyor: aynı içerik, farklı istek → aynı ad.
  {
    const r = await upload({ data: uri("image/jpeg", REAL.jpeg), kind: "image" });
    ok(r.status === 201 && r.body?.name === firstName,
      "aynı içerik aynı adı veriyor (içerik karması → bedava tekilleştirme)");
    ok(r.body?.deduped === true, "ikinci yüklemede deduped=true (yeni dosya YAZILMADI)");
  }
  // Diğer izinli türler
  for (const [mime, b64, ext] of [
    ["image/png", REAL.png, "png"],
    ["image/gif", REAL.gif, "gif"],
    ["image/webp", REAL.webp, "webp"],
  ]) {
    const r = await upload({ data: uri(mime, b64) });
    ok(r.status === 201 && r.body?.name?.endsWith(`.${ext}`), `${mime} kabul edildi → .${ext} (${r.status})`);
  }

  // ============================================================ YAZMA: REDDEDİLENLER
  const rejects = [
    ["SVG (script taşıyabilir)", uri("image/svg+xml", Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>").toString("base64"))],
    ["HTML", uri("text/html", Buffer.from("<h1>hi</h1>").toString("base64"))],
    ["PDF (görsel ucu belge kabul etmiyor)", uri("application/pdf", Buffer.from("%PDF-1.4 x").toString("base64"))],
    ["data: olmayan metin", "https://ornek.test/foto.jpg"],
    ["boş data URI", "data:image/jpeg;base64,"],
    ["bozuk base64 gövdesi", "data:image/jpeg;base64,!!!!"],
  ];
  for (const [label, data] of rejects) {
    const r = await upload({ data });
    ok(r.status === 400, `RET ${label} → 400 (${r.status})`);
    ok(typeof r.body?.error === "string" && r.body.error.length > 0, `RET ${label} sebebi yazılı`);
  }
  {
    const r = await upload({});
    ok(r.status === 400, `gövdesiz istek 400 (${r.status})`);
  }

  /**
   * İMZA YALANI — bu takımın en önemli tek kontrolü.
   * MIME türü İSTEMCİDEN geliyor. "data:image/png;base64,<aslında JPEG>" yazmak hiçbir şey
   * engellemiyor. Tür etiketine güvenip uzantıyı ve Content-Type'ı ona göre verirsek, dosya
   * indirilip açıldığında ya da nosniff'i olmayan bir istemcide içerik farklı yorumlanabilir.
   */
  {
    const r = await upload({ data: uri("image/png", REAL.jpeg) });
    ok(r.status === 400, `PNG diye etiketlenmiş JPEG reddedildi (${r.status})`);
    ok(/uyuşmuyor|tanınmadı/.test(r.body?.error || ""), "imza uyuşmazlığı sebebi anlaşılır");
  }
  {
    // Görsel MIME'ı ile gönderilmiş HTML: imza denetimi olmasa diske "resim" olarak yazılırdı.
    const r = await upload({ data: uri("image/jpeg", Buffer.from("<html><script>alert(1)</script>").toString("base64")) });
    ok(r.status === 400, `JPEG diye etiketlenmiş HTML reddedildi (${r.status})`);
  }

  // Boyut tavanı: kind'a göre farklı olmalı.
  {
    // 1,5 MB'lık gerçek bir JPEG üretmek yerine geçerli JPEG başlığına dolgu ekliyoruz:
    // imza denetimini geçer, boyut denetimine takılır — sınanmak istenen tam olarak bu sıra.
    const big = Buffer.concat([Buffer.from(REAL.jpeg, "base64"), Buffer.alloc(1_500_000, 0x20)]).toString("base64");
    const asAvatar = await upload({ data: uri("image/jpeg", big), kind: "avatar" });
    ok(asAvatar.status === 400, `1,5 MB dosya AVATAR olarak reddedildi (tavan 1 MB) — ${asAvatar.status}`);
    const asImage = await upload({ data: uri("image/jpeg", big), kind: "image" });
    ok(asImage.status === 201, `aynı dosya GÖRSEL olarak kabul edildi (tavan 2 MB) — ${asImage.status}`);
  }

  // ============================================================ OKUMA: DOSYA SUNULUYOR MU
  {
    const res = await fetch(firstUrl);
    ok(res.status === 200, `yüklenen dosya adresinden okunuyor (${res.status})`);
    ok(res.headers.get("content-type") === "image/jpeg", `Content-Type image/jpeg (${res.headers.get("content-type")})`);
    const cache = res.headers.get("cache-control") || "";
    ok(/immutable/.test(cache) && /max-age=31536000/.test(cache), `bir yıl immutable cache (${cache})`);
    ok(res.headers.get("x-content-type-options") === "nosniff", "nosniff var (tarayıcı türü tahminle değiştirmesin)");
    ok(/default-src 'none'/.test(res.headers.get("content-security-policy") || ""),
      "dosya yanıtında CSP default-src 'none'");
    const buf = Buffer.from(await res.arrayBuffer());
    ok(buf.length > 0 && buf[0] === 0xff && buf[1] === 0xd8, "gelen baytlar gerçekten JPEG (imza doğru)");
    ok(buf.equals(Buffer.from(REAL.jpeg, "base64")), "dosya BİREBİR yüklenen içerik (bozulma yok)");
  }
  // Kimlik doğrulaması olmadan okunabiliyor — cache'lenebilir olmanın koşulu bu, kasıtlı.
  {
    const res = await fetch(firstUrl, { headers: {} });
    ok(res.status === 200, "herkese açık okuma (cache'lenebilirliğin koşulu)");
  }

  // ============================================================ OKUMA: YOL ATLAMA
  /**
   * Ad kullanıcıdan gelen bir dosya adı DEĞİL, içerikten üretilmiş 32 onaltılık karakter. Bu
   * yüzden yol atlama "engellenmiyor", YAPISAL OLARAK imkânsız. Aşağıdakiler bunu ölçüyor.
   */
  const traversals = [
    "../../../etc/passwd",
    "..%2F..%2Fetc%2Fpasswd",
    "....//....//etc/passwd",
    "%2e%2e%2f%2e%2e%2fetc%2fpasswd",
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.svg",
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.html",
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.js",
    "ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ.jpg",   // onaltılık olmayan
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg",     // 30 karakter
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg", // 34 karakter
    "fixperto.sqlite",
    ".env",
  ];
  for (const name of traversals) {
    const res = await fetch(`${BASE}/media/${name}`);
    ok(res.status === 404, `yol atlama/geçersiz ad reddedildi: ${name} → ${res.status}`);
    const text = await res.text();
    ok(!/root:|PRAGMA|SQLite|PASSWORD/i.test(text), `${name} yanıtında sızıntı yok`);
  }
  {
    // Var olmayan ama BİÇİMİ DOĞRU ad: 404, ve gövdede dosya sistemi bilgisi olmamalı.
    const res = await fetch(`${BASE}/media/${"0".repeat(32)}.jpg`);
    ok(res.status === 404, `var olmayan geçerli ad 404 (${res.status})`);
    const text = await res.text();
    ok(!/\/sessions|\/Users|ENOENT|no such file/i.test(text), "404 gövdesi dosya yolu sızdırmıyor");
  }

  // ============================================================ HIZ SINIRI KULLANICI BAŞINA
  /**
   * BU BÖLÜM BİR TASARIM HATASINI ORTAYA ÇIKARDI.
   * İlk hâlde sınır yalnızca IP başınaydı — projedeki diğer sınırlarla tutarlı olduğu için.
   * Test 6. istekte kilitlendi, çünkü ÖNCEKİ adımlardaki yüklemeler aynı IP'den (127.0.0.1)
   * gelmişti ve kotayı tüketmişti. Bu bir test sorunu değil, gerçek kullanıcıların yaşayacağı
   * sorunun aynısı: aynı ofis, aynı okul, aynı mobil operatör NAT'ı arkasındaki kullanıcılar
   * tek kotayı paylaşır. Giriş/OTP sınırlarında IP DOĞRU tutamak (saldırganın kimliği yok), ama
   * yükleme kimlik doğrulamalı — kimin yüklediğini bildiğimiz halde IP'ye bakmak, elimizdeki
   * daha iyi bilgiyi kullanmamak olurdu. Sınır kullanıcı başına çevrildi; IP tavanı ise çok
   * hesap açıp kotayı çarpmaya karşı daha GENİŞ bir ikinci katman olarak kaldı.
   */
  {
    const heavy = await createUser("owner", { name: "Yük", email: "medya.yuk@test.local" });
    let blockedAt = null;
    for (let i = 0; i < 40; i++) {
      // Her istekte FARKLI içerik: tekilleştirme sayacı etkilemesin.
      const payload = Buffer.concat([Buffer.from(REAL.jpeg, "base64"), Buffer.from(`pad-${i}`)]).toString("base64");
      const r = await upload({ data: uri("image/jpeg", payload) }, heavy.token);
      if (r.status === 429) { blockedAt = i; break; }
    }
    ok(blockedAt !== null, `hız sınırı devreye girdi (${blockedAt}. istekte)`);
    ok(blockedAt >= 15, `sınır meşru kullanımı kesmiyor — 15 galeri fotoğrafı geçebildi (${blockedAt})`);

    // VE kilit o kullanıcıya özel: yanındaki masadaki kişi etkilenmemeli. Asıl mesele bu.
    const neighbour = await createUser("owner", { name: "Komşu", email: "medya.komsu@test.local" });
    const r = await upload({ data: uri("image/png", REAL.png) }, neighbour.token);
    ok(r.status === 201,
      `aynı IP'deki BAŞKA kullanıcı kilitlenmedi (${r.status}) — IP başına sınırın cezalandırdığı kişi tam olarak buydu`);
    // Kilitlenen kullanıcı gerçekten kilitli kalmalı (sınır işini yapıyor).
    const again = await upload({ data: uri("image/gif", REAL.gif) }, heavy.token);
    ok(again.status === 429, `sınıra takılan kullanıcı kilitli kalıyor (${again.status})`);
  }

  // ============================================================ MEVCUT SİSTEM BOZULDU MU
  /**
   * FAZ 4'ÜN EN ÖNEMLİ ŞARTI: bu bir EKLEME. Veritabanındaki `data:` URI'ler dokunulmadan
   * çalışmaya devam etmeli, çünkü tüm mevcut fotoğraflar o biçimde. Aşağıdaki üç kontrol
   * "yeni yol çalışıyor" değil, "ESKİ yol hâlâ çalışıyor" diyor.
   */
  {
    const dataUri = uri("image/jpeg", REAL.jpeg);
    const r = await api("POST", "/api/listings", {
      token: owner.token,
      body: { brand: "VW", model: "Golf", year: 2019, km: 50000, price: 300000, photo: dataUri, sellerType: "owner" },
    });
    ok(r.status === 201, `data: URI ile ilan hâlâ oluşturulabiliyor (${r.status}) ${r.status !== 201 ? r.raw : ""}`);
    const stored = rows(`SELECT photo FROM listings WHERE id = ?`, r.body?.id)[0];
    ok(stored?.photo === dataUri, "data: URI veritabanına BİREBİR yazıldı (dönüştürülmedi)");
    const back = await api("GET", `/api/listings/${r.body?.id}`);
    ok(back.body?.photo === dataUri, "okurken de aynı data: URI dönüyor");
  }
  {
    // Ve YENİ biçim de aynı alana yazılabiliyor: ikisi bir arada yaşıyor.
    const r = await api("POST", "/api/listings", {
      token: owner.token,
      body: { brand: "Opel", model: "Corsa", year: 2020, km: 30000, price: 350000, photo: firstUrl, sellerType: "owner" },
    });
    ok(r.status === 201, `/media/ adresi de aynı alana yazılabiliyor (${r.status})`);
    const stored = rows(`SELECT photo FROM listings WHERE id = ?`, r.body?.id)[0];
    ok(stored?.photo === firstUrl, "medya adresi veritabanına olduğu gibi yazıldı");
    // Ve bu satır artık kilobaytlar değil ~80 bayt.
    ok(String(stored?.photo).length < 200, `yeni biçim satırda ~${String(stored?.photo).length} bayt (base64 ise on binlerce)`);
  }
  {
    // Tohum verisindeki https adresleri ve emoji de bozulmadı.
    const seedMech = rows(`SELECT img, coverPhoto FROM mechanics WHERE img IS NOT NULL LIMIT 1`)[0];
    ok(!!seedMech, "tohum tamirci kaydı okunabiliyor");
    const me = await api("GET", "/api/mechanics");
    ok(Array.isArray(me.body) && me.body.length > 0, "tamirci listesi hâlâ dönüyor");
  }

  // ============================================================ YÖNETİCİ ÖLÇÜMÜ
  {
    const stats = await api("GET", "/api/admin/stats", { token: await adminToken() });
    ok(stats.status === 200, `yönetici istatistikleri (${stats.status})`);
    ok(Number.isInteger(stats.body?.mediaFiles) && stats.body.mediaFiles > 0,
      `medya dosya sayısı ölçülüyor (${stats.body?.mediaFiles})`);
    ok(Number.isInteger(stats.body?.mediaBytes) && stats.body.mediaBytes > 0,
      `medya klasör boyutu ölçülüyor (${stats.body?.mediaBytes} bayt)`);
    /**
     * Bu iki sayı SİLME olmadığı için var: bir karma yedi tablodan referans alınabiliyor ve tek
     * atlanan referans kalıcı kırık görsel demek. Ölçmek güvenli, silmek değil.
     */
    ok(!stats.body?.mediaDir, "yönetici yanıtı sunucudaki KLASÖR YOLUNU sızdırmıyor");
  }

  // ============================================================ ÖLÇÜM: YANIT NE KADAR KÜÇÜLDÜ
  {
    const listings = await api("GET", "/api/listings");
    ok(listings.status === 200, "ilan listesi dönüyor");
    const withData = JSON.stringify(listings.body).length;
    ok(withData > 0, `ilan listesi boyutu ölçüldü (${Math.round(withData / 1024)} KB)`);
  }
} catch (e) {
  failures.push(`İSTİSNA: ${e.message}`);
} finally {
  stopServer();
}

if (failures.length === 0) {
  console.log(`OK e2e medya uçları (${passed})`);
  process.exit(0);
}
console.log(`BAŞARISIZ e2e medya uçları — ${failures.length}/${passed + failures.length}`);
for (const f of failures) console.log("  ✗ " + f);
process.exit(1);
