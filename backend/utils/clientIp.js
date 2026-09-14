/**
 * İSTEMCİ IP ADRESİ — TEK DOĞRULUK KAYNAĞI.
 * ================================================================================================
 * Bu dosya neden var: IP, bu uygulamadaki BÜTÜN kötüye kullanım korumalarının temeli. Giriş ve OTP
 * kaba kuvveti, kayıt seli, VIN kazıma, teklif spam'i, analitik şişirme — hepsi "IP başına N
 * deneme" ile sınırlanıyor. IP yanlış okunursa bu korumaların hiçbiri çalışmaz ve hiçbir hata da
 * görünmez. Daha önce 12 ayrı dosyada `req.ip || req.socket?.remoteAddress` yazılıydı; aynı
 * mantığın 12 kopyası, 12 farklı şekilde yanlış olabilir demektir.
 *
 * DENETİMDE BULUNAN ÜÇ SORUN:
 *
 * 1) SAHTE X-Forwarded-For. `TRUST_PROXY=true` iken (el kitabının üretim için önerdiği ayar)
 *    istemcinin gönderdiği `X-Forwarded-For: 1.2.3.4` başlığı olduğu gibi kabul ediliyordu.
 *    Ölçtüm: sınır dolduktan sonra (429) sahte bir başlıkla istek 401'e dönüyordu — yani hız
 *    sınırı tamamen atlanıyordu. Saldırgan her isteğe rastgele bir IP yazar ve sınır diye bir şey
 *    kalmaz. Express'in kendi davranışı aslında doğru (en SAĞDAKİ girdiyi alır, onu da vekil
 *    yazar); açık, VEKİL YOKKEN ya da vekil sayısı yanlışken oluşuyor. Bu iki durum yapılandırma
 *    hatası — ama sessizce bütün korumaları kapattığı için uygulamanın kendini savunması gerekiyor:
 *    beklenen vekil sayısı kadar girdi YOKSA başlık hiç dikkate alınmıyor.
 *
 * 2) IPv6'DA SINIR ANLAMSIZ. IPv6'da bir kullanıcıya tipik olarak /64 blok verilir: 18 KENTİLYON
 *    adres. "Adres başına 10 deneme" demek, pratikte sınırsız deneme demek. Sınırlayıcı anahtarı
 *    artık IPv6 için /64 ÖNEKİNE indiriliyor — sınır kişiye, adrese değil.
 *
 * 3) AYNI İSTEMCİ İKİ KOVA. IPv4 bağlantısı IPv6 soketinde `::ffff:1.2.3.4` biçiminde görünüyor.
 *    Normalleştirme olmadan aynı istemci bazen `1.2.3.4`, bazen `::ffff:1.2.3.4` anahtarı üretip
 *    sınırı ikiye bölüyordu.
 */

const IPV4_RE = /^\d{1,3}(\.\d{1,3}){3}$/;

/** `::ffff:1.2.3.4` → `1.2.3.4`; köşeli parantez ve port ayıklanır; küçük harfe indirilir. */
export function normalizeIp(value) {
  let ip = String(value ?? "").trim().toLowerCase();
  if (!ip) return "";
  // "[2001:db8::1]:443" biçimi
  if (ip.startsWith("[")) ip = ip.slice(1, ip.indexOf("]") > 0 ? ip.indexOf("]") : undefined);
  // IPv4'te "1.2.3.4:5678"
  if (IPV4_RE.test(ip.split(":")[0]) && ip.includes(":")) ip = ip.split(":")[0];
  if (ip.startsWith("::ffff:")) {
    const tail = ip.slice(7);
    if (IPV4_RE.test(tail)) return tail;
  }
  return ip;
}

const isIp = (ip) => IPV4_RE.test(ip) || (ip.includes(":") && /^[0-9a-f:]+$/.test(ip));

/**
 * KARŞIMIZDAKİ GERÇEKTEN BİZİM VEKİLİMİZ Mİ? — asıl koruma bu.
 * ------------------------------------------------------------------------------------------------
 * Zincir uzunluğuna bakmak yetmiyor: tek vekil varsa, istemcinin uydurduğu tek girdili bir
 * `X-Forwarded-For` ile vekilin yazdığı tek girdili başlık uzunluk olarak AYNIDIR. Ölçtüm:
 * TRUST_PROXY=true iken tek sahte girdi hız sınırını yine atlıyordu.
 *
 * Ayırt etmenin tek güvenilir yolu, başlığa değil BAĞLANTIYA bakmak: isteği bize kim getirdi?
 * Ters vekil neredeyse her zaman ya loopback'te (127.0.0.1) ya özel bir ağdadır (10.x, 172.16-31.x,
 * 192.168.x, IPv6 fc00::/7). Soket adresi bu kümede DEĞİLSE istek vekilden geçmemiş demektir —
 * yani ya vekil atlanıp doğrudan porta gelinmiş ya da yapılandırma yanlış. O durumda başlık
 * tamamen yok sayılıyor ve gerçek soket adresi kullanılıyor.
 *
 * Egzotik kurulumlar (vekil ayrı bir genel IP'de) için TRUSTED_PROXY_IPS ile önek listesi
 * verilebilir. Liste verilmezse yukarıdaki özel ağ kümesi geçerli.
 */
const PRIVATE_PEER_RE = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1$|fc|fd|fe80:)/;
const trustedPeerPrefixes = () => String(process.env.TRUSTED_PROXY_IPS || "")
  .split(",").map((p) => p.trim().toLowerCase()).filter(Boolean);

export function isTrustedPeer(socketIp) {
  const ip = normalizeIp(socketIp);
  if (!ip) return false;
  const custom = trustedPeerPrefixes();
  if (custom.length > 0) return custom.some((prefix) => ip === prefix || ip.startsWith(prefix));
  return PRIVATE_PEER_RE.test(ip);
}

/**
 * KAÇ VEKİL VAR? Varsayılan 0 = vekil yok, X-Forwarded-For hiç okunmaz.
 * `TRUST_PROXY_HOPS` sayı bekler (CDN + nginx varsa 2). Eski `TRUST_PROXY=true` ayarı 1 sayılıyor
 * ki mevcut dağıtımlar bozulmasın.
 */
export function trustedHops() {
  const explicit = Number(process.env.TRUST_PROXY_HOPS);
  if (Number.isInteger(explicit) && explicit >= 0) return explicit;
  return process.env.TRUST_PROXY === "true" ? 1 : 0;
}

/**
 * GERÇEK İSTEMCİ ADRESİ.
 *
 * Vekil güveni kapalıysa: yalnızca soket adresi. İstemcinin gönderdiği hiçbir başlık okunmaz.
 *
 * Açıkken: `X-Forwarded-For` sağdan sola okunur. Altyapının eklediği girdiler HER ZAMAN sağ uçta
 * olur; istemcinin uydurduğu değerler sola yığılır. Bu yüzden sağdan `hops` kadar sayıp o girdiyi
 * alıyoruz — soldaki uydurmalar hiç kullanılmıyor.
 *
 * KRİTİK KORUMA: beklenen vekil sayısı kadar girdi YOKSA başlık tamamen yok sayılır ve soket
 * adresine dönülür. Sebep: böyle bir istek beklenen vekil zincirinden GEÇMEMİŞ demektir (vekil
 * atlandı, doğrudan porta gelindi, ya da yapılandırma yanlış). O durumda başlığa güvenmek,
 * saldırgana IP'sini seçme hakkı vermek olur.
 */
export function clientIp(req) {
  const socketIp = normalizeIp(req.socket?.remoteAddress || req.connection?.remoteAddress || "");
  const hops = trustedHops();
  if (hops <= 0) return socketIp || "unknown";

  /**
   * Başlığı okumadan önce BAĞLANTIYI doğrula. Bu satır olmadan tek vekilli kurulumda sahte tek
   * girdili bir başlık ayırt edilemiyordu (ölçüldü: sınır atlanıyordu).
   */
  if (!isTrustedPeer(socketIp)) return socketIp || "unknown";

  const raw = req.headers?.["x-forwarded-for"];
  const chain = String(Array.isArray(raw) ? raw.join(",") : raw || "")
    .split(",")
    .map((p) => normalizeIp(p))
    .filter(Boolean);
  if (chain.length < hops) return socketIp || "unknown";      // beklenen zincir yok → başlığa güvenme
  const candidate = chain[chain.length - hops];
  return isIp(candidate) ? candidate : (socketIp || "unknown");
}

/**
 * HIZ SINIRI ANAHTARI — kişiyi hedefler, adresi değil.
 * IPv4: adresin kendisi. IPv6: /64 öneki, çünkü bir kullanıcıya genelde bütün /64 verilir ve
 * adres başına sınır koymak o kullanıcıyı hiç sınırlamamakla aynı şey.
 */
export function rateLimitKey(req) {
  const ip = clientIp(req);
  if (!ip || ip === "unknown") return "unknown";
  if (IPV4_RE.test(ip)) return ip;
  if (!ip.includes(":")) return ip;
  // IPv6: "::" kısaltmasını açıp ilk 4 grubu al (= /64).
  const [head, tail = ""] = ip.split("::");
  const headGroups = head ? head.split(":").filter(Boolean) : [];
  const tailGroups = tail ? tail.split(":").filter(Boolean) : [];
  const missing = Math.max(0, 8 - headGroups.length - tailGroups.length);
  const groups = [...headGroups, ...Array(missing).fill("0"), ...tailGroups];
  return `${groups.slice(0, 4).join(":")}::/64`;
}

/**
 * BAŞLANGIÇTA YAPILANDIRMAYI SÖYLE.
 * Yanlış vekil sayısı iki ayrı şekilde sessizce zarar veriyor: fazla güven → sahte IP ile sınır
 * atlanır; eksik güven → bütün kullanıcılar tek kovaya düşer ve bir kişinin hatası siteyi herkese
 * kapatır. İkisi de hiçbir hata üretmediği için, en azından açılışta ne yapıldığı yazılıyor.
 */
export function logIpConfig() {
  const hops = trustedHops();
  if (hops <= 0) {
    console.log("IP: vekil güveni KAPALI — X-Forwarded-For okunmuyor (uygulama doğrudan internete bakıyorsa doğrusu bu).");
  } else {
    const custom = trustedPeerPrefixes();
    console.log(`IP: ${hops} vekil güveniliyor. X-Forwarded-For sağdan ${hops}. girdi kullanılıyor; `
      + `zincir kısa gelirse ya da isteği getiren adres güvenilir vekil kümesinde değilse başlık yok sayılıyor `
      + `(${custom.length ? `TRUSTED_PROXY_IPS: ${custom.join(", ")}` : "varsayılan: loopback + özel ağlar"}).`);
  }
  if (!process.env.IP_HASH_SALT) {
    console.warn("UYARI: IP_HASH_SALT tanımsız — her açılışta rastgele üretiliyor. Kayıt IP karşılaştırması (aynı ağ sinyali) yeniden başlatmadan sonra çalışmaz.");
  }
}
