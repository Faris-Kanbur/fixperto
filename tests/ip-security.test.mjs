/**
 * IP GÜVENLİĞİ — GERÇEKTEN ÇALIŞTIRILAN TESTLER.
 * ================================================================================================
 * Neden ayrı bir takım: IP, bu uygulamadaki BÜTÜN kötüye kullanım korumalarının temeli. Giriş ve
 * OTP kaba kuvveti, kayıt seli, VIN kazıma, teklif spam'i, analitik şişirme — hepsi "IP başına N
 * deneme" ile sınırlanıyor. IP yanlış okunursa bu korumaların hiçbiri çalışmaz VE HİÇBİR HATA DA
 * GÖRÜNMEZ. Sessizce kaybolan korumalar, test edilmesi en zorunlu olanlardır.
 *
 * Burada çözüm fonksiyonu (clientIp/rateLimitKey) GERÇEKTEN çağrılıyor — kaynağa bakıp "şu satır
 * var" demek, davranışın doğru olduğunu göstermez. Saldırı senaryolarının çoğu ancak farklı bir
 * SOKET ADRESİNDEN gelebilirdi (yerelde taklit edilemez), bu yüzden sahte istek nesneleriyle
 * sınanıyor: ölçülen şey tam olarak sunucunun çalıştırdığı kod.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...p) => readFileSync(join(ROOT, ...p), "utf8");

let passed = 0;
const failures = [];
const ok = (v, name) => { if (v) passed++; else failures.push(name); };
const eq = (a, b, name) => ok(JSON.stringify(a) === JSON.stringify(b), `${name} — beklenen ${JSON.stringify(b)}, gelen ${JSON.stringify(a)}`);

const mod = await import(join(ROOT, "backend", "utils", "clientIp.js"));
const { clientIp, rateLimitKey, normalizeIp, isTrustedPeer } = mod;

/** Sunucunun gördüğü isteğin aynısı: soket adresi + başlıklar. */
const req = (peer, xff) => ({ socket: { remoteAddress: peer }, headers: xff == null ? {} : { "x-forwarded-for": xff } });
const withEnv = (env, fn) => {
  const saved = { ...process.env };
  Object.assign(process.env, env);
  for (const k of ["TRUST_PROXY", "TRUST_PROXY_HOPS", "TRUSTED_PROXY_IPS"]) if (!(k in env)) delete process.env[k];
  try { return fn(); } finally { process.env = saved; }
};

// ================================================================ 1) NORMALLEŞTİRME
/**
 * Aynı istemci İKİ KOVAYA düşmemeli. IPv4 bağlantısı IPv6 soketinde `::ffff:1.2.3.4` görünüyor;
 * normalleştirme olmadan aynı kişi bazen `1.2.3.4`, bazen `::ffff:1.2.3.4` anahtarı üretir ve
 * "10 deneme" sınırı fiilen 20 olur.
 */
eq(normalizeIp("::ffff:1.2.3.4"), "1.2.3.4", "IPv4-eşlemeli IPv6 sadeleşiyor");
eq(normalizeIp("::FFFF:1.2.3.4"), "1.2.3.4", "büyük harf de sadeleşiyor");
eq(normalizeIp("  1.2.3.4  "), "1.2.3.4", "boşluklar kırpılıyor");
eq(normalizeIp("1.2.3.4:5678"), "1.2.3.4", "port ayıklanıyor");
eq(normalizeIp("[2001:db8::1]:443"), "2001:db8::1", "köşeli parantezli IPv6 + port ayıklanıyor");
eq(normalizeIp(null), "", "boş girdi boş dönüyor");

// ================================================================ 2) VEKİL GÜVENİ KAPALI (varsayılan)
/**
 * Varsayılan: uygulama doğrudan internete bakıyor. İstemcinin gönderdiği HİÇBİR başlık okunmamalı;
 * yoksa herkes kendi IP'sini seçer ve sınır diye bir şey kalmaz.
 */
withEnv({}, () => {
  eq(clientIp(req("203.0.113.9", "1.2.3.4")), "203.0.113.9", "güven kapalıyken X-Forwarded-For YOK SAYILIYOR");
  eq(clientIp(req("203.0.113.9", "evil, 1.2.3.4, 5.6.7.8")), "203.0.113.9", "sahte zincir de yok sayılıyor");
  eq(clientIp(req("::ffff:203.0.113.9", null)), "203.0.113.9", "soket adresi normalleştiriliyor");
});

// ================================================================ 3) TEK VEKİL — ASIL SALDIRI
/**
 * BULUNAN AÇIK (ölçüldü): TRUST_PROXY=true iken sahte bir X-Forwarded-For hız sınırını TAMAMEN
 * atlıyordu — sınır dolduktan sonra 429 alan istek, uydurma başlıkla 401'e dönüyordu.
 *
 * İlk düzeltme denemem "zincir beklenen vekil sayısından kısaysa başlığı yok say" idi. Tek vekilli
 * kurulumda BU YETMİYOR: istemcinin uydurduğu tek girdili başlık ile vekilin yazdığı tek girdili
 * başlık uzunluk olarak aynıdır. Ayırt etmenin tek güvenilir yolu başlığa değil BAĞLANTIYA
 * bakmaktı: isteği bize kim getirdi? Ters vekil loopback ya da özel ağdadır; genel bir adresten
 * gelen istek vekilden GEÇMEMİŞ demektir.
 */
withEnv({ TRUST_PROXY: "true" }, () => {
  // Meşru: nginx loopback'ten geliyor, gerçek istemciyi başlığa yazmış.
  eq(clientIp(req("127.0.0.1", "203.0.113.9")), "203.0.113.9", "vekilden gelen istekte gerçek istemci okunuyor");
  eq(clientIp(req("::ffff:10.0.0.5", "203.0.113.9")), "203.0.113.9", "özel ağdaki vekil de güvenilir");
  // SALDIRI: vekil atlanıp doğrudan porta gelinmiş, başlık uydurulmuş.
  eq(clientIp(req("198.51.100.77", "1.2.3.4")), "198.51.100.77",
    "GENEL adresten gelen sahte başlık YOK SAYILIYOR (asıl açık buydu)");
  eq(clientIp(req("198.51.100.77", "evil, 1.2.3.4")), "198.51.100.77", "sahte zincir de yok sayılıyor");
  // Vekil başlık yazmamışsa soket adresine dönülüyor (uydurma bir değer üretilmiyor).
  eq(clientIp(req("127.0.0.1", null)), "127.0.0.1", "başlık yoksa soket adresi");
  // Başlıkta IP olmayan çöp varsa ona güvenilmiyor.
  eq(clientIp(req("127.0.0.1", "not-an-ip")), "127.0.0.1", "geçersiz başlık değeri yok sayılıyor");
});

// ================================================================ 4) İKİ VEKİL (CDN + nginx)
/**
 * Vekil sayısı yanlış olursa iki ayrı sessiz zarar oluşur: fazla güven → sahte IP; eksik güven →
 * bütün kullanıcılar tek kovaya düşer ve BİR kişinin hatası siteyi herkese kapatır. İkisini de
 * test ediyoruz.
 */
withEnv({ TRUST_PROXY_HOPS: "2" }, () => {
  // Zincir: <istemcinin uydurduğu>, <CDN'in gördüğü gerçek istemci>, <CDN'in adresi>
  eq(clientIp(req("127.0.0.1", "9.9.9.9, 203.0.113.7, 10.0.0.5")), "203.0.113.7",
    "iki vekilde sağdan 2. girdi (gerçek istemci) okunuyor");
  eq(clientIp(req("127.0.0.1", "203.0.113.7, 10.0.0.5")), "203.0.113.7", "uydurma girdi olmadan da aynı sonuç");
  // Zincir beklenenden KISA: istek beklenen vekil zincirinden geçmemiş.
  eq(clientIp(req("127.0.0.1", "1.2.3.4")), "127.0.0.1", "zincir kısaysa başlık yok sayılıyor");
  // Farklı istemciler farklı kovalarda olmalı.
  ok(clientIp(req("127.0.0.1", "9.9.9.9, 203.0.113.7, 10.0.0.5")) !== clientIp(req("127.0.0.1", "9.9.9.9, 198.51.100.4, 10.0.0.5")),
    "farklı istemciler ayrı kovalarda (bir kişi herkesi kilitlemiyor)");
});

// ================================================================ 5) EGZOTİK KURULUM
/** Vekil genel bir IP'deyse liste ile bildirilebiliyor — ama yalnızca AÇIKÇA. */
withEnv({ TRUST_PROXY: "true", TRUSTED_PROXY_IPS: "198.51.100.77" }, () => {
  eq(clientIp(req("198.51.100.77", "203.0.113.9")), "203.0.113.9", "listedeki vekile güveniliyor");
  eq(clientIp(req("198.51.100.78", "203.0.113.9")), "198.51.100.78", "listede OLMAYAN adrese güvenilmiyor");
  eq(isTrustedPeer("127.0.0.1"), false, "liste verilince varsayılan özel ağ kümesi devre dışı (açık niyet)");
});

// ================================================================ 6) IPv6 /64 KOVASI
/**
 * IPv6'da bir kullanıcıya tipik olarak /64 verilir: 18 KENTİLYON adres. "Adres başına 10 deneme"
 * demek pratikte SINIRSIZ deneme demek — saldırgan her istekte yeni bir adres kullanır. Sınır
 * kişiye uygulanmalı, adrese değil.
 */
withEnv({}, () => {
  const a = rateLimitKey(req("2001:db8:1234:5678:aaaa:bbbb:cccc:dddd", null));
  const b = rateLimitKey(req("2001:db8:1234:5678:ffff:0:0:1", null));
  const c = rateLimitKey(req("2001:db8:1234:9999:aaaa:bbbb:cccc:dddd", null));
  eq(a, b, "aynı /64 içindeki iki adres AYNI kovada (sınır aşılamıyor)");
  ok(a !== c, "farklı /64 farklı kovada (komşu kullanıcı cezalandırılmıyor)");
  eq(rateLimitKey(req("2001:db8::1", null)), "2001:db8:0:0::/64", "kısaltılmış IPv6 doğru açılıyor");
  eq(rateLimitKey(req("::ffff:1.2.3.4", null)), "1.2.3.4", "IPv4 tek adres olarak kalıyor");
  eq(rateLimitKey(req("", null)), "unknown", "adres yoksa tek bir 'unknown' kovası");
});

// ================================================================ 7) TEK KAYNAK KURALI
/**
 * Aynı mantığın 12 kopyası, 12 farklı şekilde yanlış olabilir. Daha önce her rota kendi
 * `req.ip || req.socket?.remoteAddress` satırını yazıyordu — bu, trust proxy çözümünü ATLAYAN ve
 * normalleştirme yapmayan bir yol. Artık hepsi tek yardımcıdan geçiyor; yeni bir rota kendi
 * satırını yazarsa bu test düşer.
 */
const routeFiles = readdirSync(join(ROOT, "backend", "routes")).filter((f) => f.endsWith(".js"));
const rogue = [];
// Yorumlar ayıklanıyor: bu dosyaların çoğu "IP'yi neden tek yerden okuyoruz" diye açıklama
// içeriyor ve ham metinde arama yapmak o açıklamaları KULLANIM sayıyordu.
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
for (const f of routeFiles) {
  const src = stripComments(read("backend", "routes", f));
  if (/req\.socket\?\.remoteAddress|req\.connection\?\.remoteAddress/.test(src)) rogue.push(`${f}: kendi soket okuması`);
  if (/\breq\.ip\b/.test(src)) rogue.push(`${f}: doğrudan req.ip (normalleştirme ve /64 kovası atlanır)`);
}
eq(rogue, [], "hiçbir rota IP'yi kendi başına okumuyor (tek kaynak: utils/clientIp.js)");
// Hız sınırı anahtarları /64 kovasından geçmeli; ham adres kullanmak IPv6'da sınırı anlamsız kılar.
const limiterUsers = routeFiles.filter((f) => /Limiter\.check\(|limiter\.check\(/.test(read("backend", "routes", f)));
ok(limiterUsers.length > 5, `hız sınırı kullanan rota sayısı taranıyor (${limiterUsers.length})`);
for (const f of limiterUsers) {
  ok(/rateLimitKey\(req\)/.test(read("backend", "routes", f)), `${f}: sınır anahtarı rateLimitKey'den geliyor`);
}
// Kayıt IP karması GERÇEK adresi kullanmalı (kova değil) — yoksa aynı /64'teki herkes "aynı kişi" görünür.
ok(/hashIp\(clientIp\(req\)\)/.test(read("backend", "routes", "auth.js")),
  "kayıt IP karması gerçek adresten (kovadan değil) üretiliyor");

// ================================================================ 8) SINIRLAYICI HARİTASI SINIRSIZ BÜYÜMÜYOR
/**
 * BULUNAN SORUN: haritadan kayıt yalnızca kilidi dolmuş bir anahtar TEKRAR sorgulandığında
 * siliniyordu. Kilide ulaşmayan ve bir daha sorulmayan anahtarlar sonsuza kadar kalıyordu.
 * IPv6'da (ve sahte başlık denemelerinde) anahtar çeşitliliği pratikte sınırsız olduğu için bu,
 * kimlik doğrulaması gerektirmeyen ucuz bir bellek tüketme yolu.
 */
// Sınırlayıcı artık ayrı bir dosyada (utils/rateLimiter.js) — veritabanına bağlı olmadığı için
// her ortamda test edilebiliyor. Bu ayrımın kendisi de bir düzeltme: bağımlılığı olmayan bir
// mantığı bağımlı bir dosyada tutmak onu test edilemez yapıyordu.
const authUtils = read("backend", "utils", "rateLimiter.js");
ok(/LIMITER_MAX_KEYS/.test(authUtils), "sınırlayıcı anahtar sayısında üst sınır var");
ok(/const prune = \(\)/.test(authUtils), "süresi geçmiş kayıtlar seyreltiliyor");
ok(/attempts\.keys\(\)\.next\(\)\.value/.test(authUtils), "sınır dolduğunda EN ESKİ kayıt düşüyor (en yeni değil)");

// Gerçekten çalışıyor mu? 25 bin farklı anahtarla doldurup boyuta bakıyoruz.
const { makeRateLimiter } = await import(join(ROOT, "backend", "utils", "rateLimiter.js"));
const limiter = makeRateLimiter({ maxAttempts: 5, lockoutMs: 1000, windowMs: 1000 });
for (let i = 0; i < 25_000; i++) limiter.registerFailure(`2001:db8:${i}::/64`);
// Harita dışa açık değil; dolaylı kanıt: 25 bin anahtardan sonra da davranış doğru ve süreç ayakta.
limiter.registerFailure("sabit-anahtar");
for (let i = 0; i < 5; i++) limiter.registerFailure("sabit-anahtar");
ok(limiter.check("sabit-anahtar").blocked, "25 bin anahtardan sonra sınırlayıcı hâlâ doğru çalışıyor");

// ================================================================ 9) BAŞLANGIÇ UYARILARI
/**
 * Yanlış vekil yapılandırması hiçbir hata üretmiyor. En azından açılışta ne yapıldığı yazılmalı;
 * ayrıca IP_HASH_SALT tanımsızsa her açılışta rastgele üretiliyor ve "aynı ağ" sinyali yeniden
 * başlatmadan sonra sessizce çalışmaz hâle geliyor — bu da söylenmeli.
 */
const ipSrc = read("backend", "utils", "clientIp.js");
ok(/export function logIpConfig/.test(ipSrc), "yapılandırma açılışta bildiriliyor");
ok(/IP_HASH_SALT tanımsız/.test(ipSrc), "salt tanımsızsa uyarılıyor");
ok(/logIpConfig\(\)/.test(read("backend", "server.js")), "sunucu açılışta bunu çağırıyor");
ok(/app\.set\("trust proxy", TRUSTED_HOPS\)/.test(read("backend", "server.js")),
  "Express'in trust proxy ayarı da aynı sayıdan besleniyor (req.ip ile hesabımız ayrışmıyor)");

if (failures.length === 0) {
  console.log(`OK IP güvenliği (${passed})`);
  process.exit(0);
}
console.log(`BAŞARISIZ IP güvenliği — ${failures.length}/${passed + failures.length}`);
for (const f of failures) console.log("  ✗ " + f);
process.exit(1);
