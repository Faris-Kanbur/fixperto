import crypto from "node:crypto";
import { deviceFingerprint } from "./deviceFingerprint.js";
import bcrypt from "bcryptjs";
import { db } from "../db/db.js";
import { looksHashed } from "./passwordFormat.js";

// GÜVENLİK: uygulamanın önceki hâlinde owner/mechanic için gerçek bir oturum/kimlik doğrulama
// katmanı yoktu (bkz. REFACTOR_REPORT.md bölüm 9 madde 2, ve bu oturumdaki önceki güvenlik
// düzeltmeleri) — "giriş" sadece decoratifti, backend hiçbir isteğin gerçekten kimden geldiğini
// bilmiyordu. Bu dosya, admin paneli için zaten kurulmuş olan token deseni (bkz.
// backend/routes/admin.js) owner/mechanic'e genişletilmiş hâlidir: rastgele, tahmin edilemez bir
// token üretilir.
//
// OTURUMLAR NEDEN ARTIK VERİTABANINDA:
// Önceki hâlde token'lar yalnızca sunucu belleğindeydi. Gerekçesi "çalınmış token süresiz geçerli
// kalmasın" idi, ama sonucu şu oldu: sunucunun HER yeniden başlayışında herkes sessizce çıkış
// yapmış oluyordu. Geliştirmede `node --watch` her dosya kaydında yeniden başlattığı için bu
// dakikada bir yaşanıyordu; canlıda da her dağıtım (deploy) tüm kullanıcıları atacaktı. Üstelik
// arayüz bunu fark etmiyor, kullanıcı "giriş yapmış" görünürken her isteği 401 alıyordu.
//
// Çözüm token'ın KENDİSİNİ değil, SHA-256 ÖZETİNİ saklamak. Veritabanı sızsa bile özetlerden
// kullanılabilir token üretilemez (şifrelerde bcrypt kullanmamızla aynı mantık; burada bcrypt
// gereksiz çünkü token zaten 256 bitlik rastgele bir değer, sözlük saldırısına açık değil).
// 7 günlük ömür aynen duruyor, yani "süresiz geçerli token" endişesi TTL ile karşılanıyor.
const BCRYPT_ROUNDS = 10;

export async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain, hash) {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}

export { looksHashed };

// Kayıt sırasında kullanıcıya e-posta ile gönderilecek otomatik şifre. Karışık büyük/küçük harf +
// rakam, karışıklığa yol açabilecek karakterler (0/O, 1/l/I) çıkarılmış.
const PASSWORD_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
export function generateRandomPassword(length = 10) {
  let out = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) out += PASSWORD_CHARS[bytes[i] % PASSWORD_CHARS.length];
  return out;
}

export function generateOtp() {
  // 6 haneli, baştan sıfır olabilir (ör. "004821") — string olarak tutuluyor.
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    tokenHash TEXT PRIMARY KEY,
    userId    INTEGER NOT NULL,
    role      TEXT NOT NULL,
    createdAt INTEGER NOT NULL
  );

  /**
   * TANINAN TARAYICILAR — "yeni cihazdan giriş" bildirimi için.
   * ----------------------------------------------------------------------------------------------
   * Ham User-Agent metni SAKLANMIYOR; yalnızca insan okuyabilir etiket ("Chrome · macOS") ve onun
   * karması. Gerekçe bkz. utils/deviceFingerprint.js.
   * lastIpHash: ham IP DEĞİL, tuzlu karması (aynı desen: owners.signupIpHash). Kullanıcıya hiç
   * gösterilmiyor; yalnızca "giriş farklı bir ağdan mı geldi" sorusunu cevaplamak için. Coğrafi
   * konum YOK: bir geo-IP servisine sormak, kullanıcıların IP'lerini üçüncü bir tarafa göndermek
   * demektir ve bu, bildirimin sağladığı faydadan büyük bir gizlilik bedeli olurdu.
   */
  CREATE TABLE IF NOT EXISTS user_devices (
    userId      INTEGER NOT NULL,
    role        TEXT NOT NULL,
    deviceHash  TEXT NOT NULL,
    label       TEXT NOT NULL,
    firstSeenAt INTEGER NOT NULL,
    lastSeenAt  INTEGER NOT NULL,
    lastIpHash  TEXT,
    loginCount  INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (userId, role, deviceHash)
  );
`);

const hashToken = (token) => crypto.createHash("sha256").update(String(token)).digest("hex");

// GÜVENLİK DÜZELTMESİ (tam site denetiminde bulundu): oturumların hiçbir SÜRE SINIRI yoktu —
// `createdAt` yazılıyordu ama hiç okunmuyordu. Yani bir kez üretilen token, sunucu yeniden
// başlayana kadar (haftalar/aylar olabilir) geçerli kalıyordu; çalınmış bir token'ın kendi kendine
// geçersizleşmesi diye bir şey yoktu ve activeSessions map'i sınırsız büyüyordu. Artık her oturumun
// sabit bir ömrü var ve süresi dolmuş kayıtlar hem okuma anında hem de periyodik olarak temizleniyor.
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 gün

const insertSession = db.prepare("INSERT OR REPLACE INTO sessions (tokenHash, userId, role, createdAt) VALUES (?, ?, ?, ?)");
const selectSession = db.prepare("SELECT userId, role, createdAt FROM sessions WHERE tokenHash = ?");
const deleteSession = db.prepare("DELETE FROM sessions WHERE tokenHash = ?");
const deleteExpired = db.prepare("DELETE FROM sessions WHERE createdAt < ?");

/**
 * KAYIT AĞI KARMASI. Ham IP hiçbir yerde saklanmıyor; yalnızca tuzlanmış karması.
 * Tuz olmadan IP karmaları kolayca geri çözülür (IPv4 uzayı küçüktür, kaba kuvvetle taranabilir).
 * Tuz ortam değişkeninden gelir; ayarlanmamışsa süreç ömrü boyunca rastgele bir tuz kullanılır —
 * bu durumda yeniden başlatmadan sonra eşleşme yapılamaz, ki bu "yanlış eşleştirme"den iyidir.
 */
const IP_SALT = process.env.IP_HASH_SALT || crypto.randomBytes(16).toString("hex");
export function hashIp(ip) {
  const clean = String(ip || "").trim();
  if (!clean) return null;
  return crypto.createHash("sha256").update(`${IP_SALT}:${clean}`).digest("hex");
}

/**
 * ====== YENİ CİHAZ/TARAYICI GİRİŞİ: KAYIT + BİLDİRİM KARARI ======
 * ================================================================================================
 * Bu fonksiyon SADECE karar veriyor ve kaydı güncelliyor; e-postayı çağıran taraf gönderiyor
 * (routes/auth.js). Böylece posta bağımlılığı bu dosyaya girmiyor ve karar testte tek başına
 * ölçülebiliyor.
 *
 * NEREDE ÇAĞRILIYOR ve NEDEN ORADA: giriş AKIŞININ SONUNDA, yani OTP doğrulandıktan sonra
 * (createSession ile aynı yerde). Şifre adımında DEĞİL. İki sebep:
 *   1) O noktaya kadar giriş tamamlanmamıştır. Şifreyi bilip OTP'yi geçemeyen biri için "hesabınıza
 *      giriş yapıldı" demek YANLIŞ olurdu.
 *   2) KÖTÜYE KULLANIM: bildirim şifre adımına bağlanırsa, şifreyi bilen biri User-Agent'ı her
 *      istekte değiştirerek kurbana sınırsız "yeni cihaz" e-postası yağdırabilirdi. OTP şartı bunu
 *      baştan kapatıyor: saldırganın e-postaya da erişmesi gerekir ki o durumda zaten kaybedilmiş
 *      bir hesaptan bahsediyoruz. Aşağıdaki günlük tavan buna EK bir kat.
 *
 * DÖNÜŞ: { isNew, label } — `isNew` true ise çağıran taraf bildirim gönderiyor.
 */
const MAX_DEVICES_PER_USER = 20;          // tablo sınırsız büyümesin; en eski kayıt düşer
const MAX_NEW_DEVICE_MAILS_PER_DAY = 5;   // alarm yorgunluğuna ve posta kuyruğu şişmesine karşı

const selectDevice = db.prepare("SELECT deviceHash, loginCount FROM user_devices WHERE userId = ? AND role = ? AND deviceHash = ?");
const touchDevice = db.prepare("UPDATE user_devices SET lastSeenAt = ?, lastIpHash = ?, loginCount = loginCount + 1 WHERE userId = ? AND role = ? AND deviceHash = ?");
const addDevice = db.prepare("INSERT INTO user_devices (userId, role, deviceHash, label, firstSeenAt, lastSeenAt, lastIpHash) VALUES (?, ?, ?, ?, ?, ?, ?)");
const countDevices = db.prepare("SELECT COUNT(*) n FROM user_devices WHERE userId = ? AND role = ?");
const newDevicesToday = db.prepare("SELECT COUNT(*) n FROM user_devices WHERE userId = ? AND role = ? AND firstSeenAt > ?");
const dropOldestDevice = db.prepare(`
  DELETE FROM user_devices WHERE userId = ? AND role = ? AND deviceHash = (
    SELECT deviceHash FROM user_devices WHERE userId = ? AND role = ? ORDER BY lastSeenAt ASC LIMIT 1
  )`);

/**
 * Parmak izini BURADA üretiyoruz, çünkü tuz (IP_SALT) bu dosyada ve dışa açılmamalı: bir tuzun
 * tek işi gizli kalmak. deviceFingerprint saf bir fonksiyon, tuzu argüman olarak alıyor.
 */
export function deviceIdFor(userAgent) {
  return deviceFingerprint(userAgent, IP_SALT);
}

export function recordLoginDevice(id, role, { label, hash, ipHash }) {
  const now = Date.now();
  const known = selectDevice.get(id, role, hash);
  if (known) {
    touchDevice.run(now, ipHash ?? null, id, role, hash);
    return { isNew: false, label };
  }

  /**
   * İLK GİRİŞ BİLDİRİM ÜRETMİYOR.
   * Hesabı yeni açan kullanıcının ilk girişi tanımı gereği "yeni cihaz"dır; ona "hesabınıza yeni
   * bir cihazdan giriş yapıldı" demek hem anlamsız hem de ilk izlenimi bozan bir uyarı olurdu.
   * Kayıt yine tutuluyor (ikinci cihaz artık tespit edilebilsin diye), sadece e-posta yok.
   */
  const existing = countDevices.get(id, role).n;
  const isFirstEver = existing === 0;

  if (existing >= MAX_DEVICES_PER_USER) dropOldestDevice.run(id, role, id, role);
  addDevice.run(id, role, hash, label, now, now, ipHash ?? null);

  if (isFirstEver) return { isNew: false, label, firstEver: true };

  // Günlük tavan: bir kullanıcıya gönderilen yeni-cihaz bildirimi sayısı sınırlı.
  const since = now - 24 * 60 * 60 * 1000;
  const todays = newDevicesToday.get(id, role, since).n;
  if (todays > MAX_NEW_DEVICE_MAILS_PER_DAY) return { isNew: false, label, throttled: true };

  return { isNew: true, label };
}

/** Kullanıcının kendi cihaz listesi — yalnızca kendi oturumuyla okunuyor (bkz. routes/auth.js). */
export function listUserDevices(id, role) {
  return db.prepare(`
    SELECT label, firstSeenAt, lastSeenAt, loginCount
    FROM user_devices WHERE userId = ? AND role = ? ORDER BY lastSeenAt DESC
  `).all(id, role);
}

/** Hesap silindiğinde cihaz kaydı da gitmeli (bkz. routes/auth.js delete-account). */
export function deleteUserDevices(id, role) {
  return db.prepare("DELETE FROM user_devices WHERE userId = ? AND role = ?").run(id, role).changes;
}

export function createSession(id, role) {
  const token = generateToken();
  insertSession.run(hashToken(token), id, role, Date.now());
  return token;
}

export function getSession(token) {
  if (!token) return null;
  const tokenHash = hashToken(token);
  const row = selectSession.get(tokenHash);
  if (!row) return null;
  /**
   * SÜRE KONTROLÜ "KAPALI" TARAFA DÜŞMELİ (denetimde fark edildi).
   * ---------------------------------------------------------------------------------------------
   * `createdAt` epoch milisaniye olarak (INTEGER) saklanıyor. Ama SQLite gevşek tipli: eski bir
   * şema, elle yapılmış bir müdahale ya da hatalı bir göç oraya METİN yazabilir. O durumda
   * `Date.now() - row.createdAt` NaN olur ve `NaN > TTL` her zaman FALSE'tur — yani kontrol
   * sessizce GEÇER ve o oturum SONSUZA KADAR geçerli kalır. Hiçbir hata da görünmez.
   *
   * Bir güvenlik kontrolünün en kötü hâli, bozulduğunda hata vermek yerine izin vermesidir.
   * Bu yüzden değer önce SAYIYA çevriliyor; sayı değilse oturum geçersiz sayılıyor ve siliniyor.
   * Yanlış tarafta hata yapmanın bedeli "bir kullanıcı tekrar giriş yapar"; diğer tarafta bedeli
   * "çalınmış jeton sonsuza kadar çalışır".
   */
  const createdAt = Number(row.createdAt);
  if (!Number.isFinite(createdAt) || Date.now() - createdAt > SESSION_TTL_MS) {
    deleteSession.run(tokenHash);
    return null;
  }
  // Dönen nesne eskisiyle aynı biçimde: çağıranlar (requireSession, resolveActor) değişmedi.
  return { id: row.userId, role: row.role, createdAt };
}

// Süresi dolmuş oturumları periyodik olarak bellekten at (yukarıdaki tembel temizlik, bir daha hiç
// kullanılmayan token'ları temizlemez — bu da bellek sızıntısına dönerdi). unref() ile bu zamanlayıcı
// Node sürecinin kapanmasını engellemiyor.
const SESSION_SWEEP_MS = 60 * 60 * 1000; // saatte bir
const sweepTimer = setInterval(() => {
  deleteExpired.run(Date.now() - SESSION_TTL_MS);
}, SESSION_SWEEP_MS);
if (typeof sweepTimer.unref === "function") sweepTimer.unref();

export function destroySession(token) {
  if (token) deleteSession.run(hashToken(token));
}

/**
 * HESAP GÜVENLİĞİ: bir kullanıcının TÜM oturumlarını (isteğe bağlı olarak biri hariç) kapatır.
 * ---------------------------------------------------------------------------------------------
 * AÇIK (bu denetimde bulundu): şifre değiştirmek, o ana kadar açılmış diğer oturumları
 * etkilemiyordu. Hesabı ele geçirilmiş bir kullanıcı şifresini değiştirdiğinde saldırganın
 * elindeki token çalışmaya DEVAM ediyordu — yani şifre değiştirmek hiçbir şeyi kurtarmıyordu.
 * Şifre değişiminde ve "tüm cihazlardan çık" işleminde artık oturumlar gerçekten sonlandırılıyor.
 */
const deleteUserSessions = db.prepare("DELETE FROM sessions WHERE userId = ? AND role = ?");
const deleteOtherUserSessions = db.prepare("DELETE FROM sessions WHERE userId = ? AND role = ? AND tokenHash != ?");
export function destroyUserSessions(userId, role, keepToken = null) {
  if (userId == null || !role) return 0;
  const info = keepToken
    ? deleteOtherUserSessions.run(userId, role, hashToken(keepToken))
    : deleteUserSessions.run(userId, role);
  return info.changes;
}
/** Kullanıcının açık oturum sayısı — "başka cihazlarda açık oturumunuz var" bilgisi için. */
const countUserSessions = db.prepare("SELECT COUNT(*) n FROM sessions WHERE userId = ? AND role = ?");
export function userSessionCount(userId, role) {
  if (userId == null || !role) return 0;
  return countUserSessions.get(userId, role)?.n || 0;
}

export function extractBearerToken(req) {
  const header = req.headers.authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1] : null;
}

// Bir uç noktayı, geçerli bir owner VEYA mechanic oturumu ile korur (hangisine izin verildiği
// `roles` ile belirlenir). Başarılı olursa `req.session = { id, role }` set edilir.
export function requireSession(roles) {
  const allowed = new Set(roles);
  return (req, res, next) => {
    const token = extractBearerToken(req);
    const session = token ? getSession(token) : null;
    if (!session || !allowed.has(session.role)) {
      return res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." });
    }
    req.session = session;
    next();
  };
}

// Admin oturumları da (owner/mechanic'ten ayrı olarak) burada tutuluyor — böylece
// makeCrudRouter.js gibi paylaşılan modüller admin.js'e döngüsel import olmadan "bu token admine mi
// ait" diye sorabiliyor (bkz. resolveActor). admin.js artık kendi token Set'ini tutmuyor, bunları
// kullanıyor.
const activeAdminTokens = new Set();

export function createAdminSession() {
  const token = generateToken();
  activeAdminTokens.add(token);
  return token;
}

export function isAdminToken(token) {
  return !!token && activeAdminTokens.has(token);
}

export function destroyAdminSession(token) {
  activeAdminTokens.delete(token);
}

// Bir isteğin ARKASINDAKİ gerçek kimliği (admin mi, yoksa hangi owner/mechanic oturumu mu) tek bir
// yerden çözer. `{ role: "admin", id: null }` ya da `{ role: "owner"|"mechanic", id }` ya da (geçersiz/
// eksik token) `null` döner. Bu, ownerScoped kaynaklarda (bkz. makeCrudRouter.js authScope) "admin her
// zaman geçebilir, sahibi olmayan bir owner/mechanic geçemez" kuralını tek bir yerde uygulamayı
// sağlıyor.
export function resolveActor(req) {
  const token = extractBearerToken(req);
  if (!token) return null;
  if (isAdminToken(token)) return { role: "admin", id: null };
  const session = getSession(token);
  return session ? { role: session.role, id: session.id } : null;
}

// Basit, bağımlılıksız IP başına deneme sınırlayıcı — admin.js'teki ile aynı desen, login/OTP gibi
// kaba kuvvete açık uç noktalarda tekrar kullanılıyor.
/**
 * windowMs (opsiyonel): KAYAN PENCERE.
 * ---------------------------------------------------------------------------------------------
 * GERÇEK HATA DÜZELTMESİ (tam site denetiminde bulundu): sayaç hiç sıfırlanmıyordu. Giriş
 * denemeleri için bu doğru davranış (art arda 5 yanlış şifre = kilit), ama sayaç ömür boyu
 * biriktiği için ÇEVİRİ gibi normal ve sık kullanılan uç noktalarda yanlış sonuç veriyordu:
 * uzun bir oturumda sohbetleri gezen sıradan bir kullanıcı toplam 120 isteği aşınca 10 dakika
 * boyunca "çok fazla istek" duvarına çarpıyor, çeviri sessizce ölüyordu. windowMs verildiğinde
 * sayaç, iki istek arasında bu süre kadar boşluk olduğunda sıfırlanır — yani sınır "ömür boyu
 * 120" değil "N dakikada 120" anlamına gelir.
 */
/**
 * HIZ SINIRLAYICI AYRI BİR DOSYAYA TAŞINDI (utils/rateLimiter.js).
 * ------------------------------------------------------------------------------------------------
 * Sebep pratik ve öğretici: sınırlayıcının veritabanıyla HİÇBİR işi yok, ama bu dosyada durduğu
 * için onu test etmek isteyen her şey `db.js`i de yüklemek zorunda kalıyordu — yani derlenmiş
 * SQLite ikilisi olmayan bir ortamda sınırlayıcı test EDİLEMİYORDU. Bağımlılığı olmayan bir
 * mantığı bağımlı bir dosyada tutmak, onu test edilemez yapar.
 * Eski içe aktarmalar bozulmasın diye buradan yeniden dışa veriliyor.
 */
export { makeRateLimiter } from "./rateLimiter.js";
