import crypto from "node:crypto";
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
  if (Date.now() - row.createdAt > SESSION_TTL_MS) {
    deleteSession.run(tokenHash);
    return null;
  }
  // Dönen nesne eskisiyle aynı biçimde: çağıranlar (requireSession, resolveActor) değişmedi.
  return { id: row.userId, role: row.role, createdAt: row.createdAt };
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
export function makeRateLimiter({ maxAttempts, lockoutMs }) {
  const attempts = new Map(); // key -> { count, lockedUntil }
  return {
    check(key) {
      const entry = attempts.get(key);
      if (!entry) return { blocked: false };
      if (entry.lockedUntil && entry.lockedUntil > Date.now()) return { blocked: true };
      if (entry.lockedUntil && entry.lockedUntil <= Date.now()) attempts.delete(key);
      return { blocked: false };
    },
    registerFailure(key) {
      const entry = attempts.get(key) || { count: 0, lockedUntil: null };
      entry.count += 1;
      if (entry.count >= maxAttempts) entry.lockedUntil = Date.now() + lockoutMs;
      attempts.set(key, entry);
    },
    reset(key) {
      attempts.delete(key);
    },
  };
}
