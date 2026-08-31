import crypto from "node:crypto";
import bcrypt from "bcryptjs";

// GÜVENLİK: uygulamanın önceki hâlinde owner/mechanic için gerçek bir oturum/kimlik doğrulama
// katmanı yoktu (bkz. REFACTOR_REPORT.md bölüm 9 madde 2, ve bu oturumdaki önceki güvenlik
// düzeltmeleri) — "giriş" sadece decoratifti, backend hiçbir isteğin gerçekten kimden geldiğini
// bilmiyordu. Bu dosya, admin paneli için zaten kurulmuş olan token deseni (bkz.
// backend/routes/admin.js) owner/mechanic'e genişletilmiş hâlidir: rastgele, tahmin edilemez bir
// token üretilip SADECE sunucu belleğinde tutulur (kalıcı depoya/DB'ye YAZILMAZ) — sunucu yeniden
// başladığında tüm oturumlar geçersiz olur, bu kasıtlı bir tercih (XSS ile çalınmış bir token'ın
// süresiz geçerli kalmaması).
const BCRYPT_ROUNDS = 10;

export async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain, hash) {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}

export function looksHashed(value) {
  return typeof value === "string" && /^\$2[aby]\$/.test(value);
}

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

// role -> Map<token, { id, role }>. Tek bir Map yeterli ama role'ü value içinde tutmak
// middleware'de "bu token hangi role için geçerli" kontrolünü basitleştiriyor.
const activeSessions = new Map(); // token -> { id, role, createdAt }

export function createSession(id, role) {
  const token = generateToken();
  activeSessions.set(token, { id, role, createdAt: Date.now() });
  return token;
}

export function getSession(token) {
  return activeSessions.get(token) || null;
}

export function destroySession(token) {
  activeSessions.delete(token);
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
