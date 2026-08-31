import { Router } from "express";
import crypto from "node:crypto";
import { db } from "../db/db.js";
import { hydrate } from "../db/hydrate.js";
import { sendMail, isMailerConfigured } from "../utils/mailer.js";
import {
  hashPassword, verifyPassword, generateRandomPassword, generateOtp,
  createSession, destroySession, requireSession, makeRateLimiter,
} from "../utils/auth.js";

// GÜVENLİK/ÖZELLİK: gerçek e-posta + şifre ile kayıt/giriş, e-posta ile gönderilen tek kullanımlık
// kodla (OTP) çifte doğrulama, ve gerçek oturum token'ı. Daha önce owner/mechanic "girişi" tamamen
// dekoratifti — chooseRole(r) sadece ekran değiştiriyordu, submitAuth login dalı hiçbir şifre
// doğrulaması yapmıyordu (bkz. bu oturumun başındaki güvenlik taraması). Bu router onun yerini alır:
//
// KAYIT (register): kullanıcı sadece e-posta+ad(+role'e özgü birkaç alan) girer, ŞİFREYİ KENDİSİ
// SEÇMEZ — backend rastgele, güçlü bir şifre üretip e-postasına gönderir. Bu, e-postanın gerçekten
// kullanıcıya ait olduğunun ilk doğrulamasıdır (o maili alamayan biri asla giriş yapamaz).
//
// GİRİŞ (login → verify-otp): e-posta+şifre doğrulandıktan SONRA, girişi tamamlamak için ayrıca
// e-postaya gönderilen 6 haneli bir kod istenir (çifte doğrulama / 2FA). Sadece doğru kod girilirse
// gerçek bir oturum token'ı verilir.
const ROLE_TABLES = { owner: "owners", mechanic: "mechanics" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const loginLimiter = makeRateLimiter({ maxAttempts: 10, lockoutMs: 15 * 60 * 1000 });
const otpLimiter = makeRateLimiter({ maxAttempts: OTP_MAX_ATTEMPTS, lockoutMs: 15 * 60 * 1000 });

// loginTicket -> { role, id, email, otp, expiresAt } — şifre doğrulandıktan sonra, OTP onaylanana
// kadar geçen KISA süreli ara adım. Gerçek oturum token'ı (createSession) sadece OTP doğrulanınca
// verilir — bu map'teki bir ticket TEK BAŞINA hiçbir korumalı uç noktaya erişim sağlamaz.
const pendingLogins = new Map();

function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function sanitizeUser(role, row) {
  const hydrated = hydrate(ROLE_TABLES[role], row);
  return { ...hydrated, role };
}

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  try {
    const { role, email, name } = req.body || {};
    if (!ROLE_TABLES[role]) return res.status(400).json({ error: "role 'owner' veya 'mechanic' olmalıdır." });
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanName = String(name || "").trim();
    if (!EMAIL_RE.test(cleanEmail)) return res.status(400).json({ error: "Geçerli bir e-posta adresi girin." });
    if (!cleanName) return res.status(400).json({ error: "Ad soyad zorunludur." });

    const table = ROLE_TABLES[role];
    const existing = db.prepare(`SELECT id FROM ${table} WHERE lower(email) = ?`).get(cleanEmail);
    if (existing) return res.status(409).json({ error: "Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı deneyin." });

    const plainPassword = generateRandomPassword();
    const hashed = await hashPassword(plainPassword);

    let created;
    if (role === "owner") {
      const stmt = db.prepare(`INSERT INTO owners (name, email, phone, city, joinDate, status, password) VALUES (@name, @email, @phone, @city, @joinDate, 'active', @password)`);
      const info = stmt.run({ name: cleanName, email: cleanEmail, phone: req.body.phone || null, city: req.body.city || null, joinDate: new Date().toISOString().slice(0, 10), password: hashed });
      created = db.prepare(`SELECT * FROM owners WHERE id = ?`).get(info.lastInsertRowid);
    } else {
      const stmt = db.prepare(`INSERT INTO mechanics (name, email, phone, specialty, lang, password) VALUES (@name, @email, @phone, @specialty, 'tr', @password)`);
      const info = stmt.run({ name: cleanName, email: cleanEmail, phone: req.body.phone || null, specialty: req.body.specialty || null, password: hashed });
      created = db.prepare(`SELECT * FROM mechanics WHERE id = ?`).get(info.lastInsertRowid);
    }

    const mailResult = await sendMail({
      to: cleanEmail,
      subject: "Fixperto — Hesabınız oluşturuldu",
      text: `Merhaba ${cleanName},\n\nFixperto hesabınız oluşturuldu. Giriş yapmak için kullanacağınız otomatik şifreniz:\n\n${plainPassword}\n\nGiriş yaptıktan sonra dilerseniz bu şifreyi Ayarlar'dan değiştirebilirsiniz.\n\nBu e-postayı siz talep etmediyseniz güvenle yok sayabilirsiniz.`,
      html: `<p>Merhaba ${cleanName},</p><p>Fixperto hesabınız oluşturuldu. Giriş yapmak için kullanacağınız otomatik şifreniz:</p><p style="font-size:20px;font-weight:bold;letter-spacing:1px">${plainPassword}</p><p>Giriş yaptıktan sonra dilerseniz bu şifreyi Ayarlar'dan değiştirebilirsiniz.</p><p style="color:#888;font-size:12px">Bu e-postayı siz talep etmediyseniz güvenle yok sayabilirsiniz.</p>`,
    });

    const response = { ok: true, id: created.id, email: cleanEmail, mailSent: mailResult.sent };
    // GELİŞTİRME KOLAYLIĞI: SMTP ayarlanmamışsa (gerçek mail hiç gönderilemiyorsa) üretilen şifreyi
    // yanıta da ekliyoruz ki backend'i localhost'ta çalıştıran biri gerçek bir e-posta sunucusu
    // kurmadan kayıt→giriş akışını uçtan uca test edebilsin. Prodüksiyonda (NODE_ENV=production)
    // bu asla yapılmaz — SMTP kurulmadan prodüksiyona çıkılırsa kullanıcı şifresini hiçbir zaman
    // öğrenemez ve bu KASITLIDIR (şifreyi API yanıtıyla döndürmek gerçek bir güvenlik açığı olurdu).
    if (!mailResult.sent && process.env.NODE_ENV !== "production") {
      response.devPassword = plainPassword;
      response.devNote = mailResult.devNote;
    }
    res.status(201).json(response);
  } catch (err) {
    console.error("[auth] register hatası:", err);
    res.status(500).json({ error: "Kayıt oluşturulamadı." });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const ip = clientIp(req);
    if (loginLimiter.check(ip).blocked) {
      return res.status(429).json({ error: "Çok fazla başarısız deneme. Lütfen birkaç dakika sonra tekrar deneyin." });
    }
    const { role, email, password } = req.body || {};
    if (!ROLE_TABLES[role]) return res.status(400).json({ error: "role 'owner' veya 'mechanic' olmalıdır." });
    const cleanEmail = String(email || "").trim().toLowerCase();
    const table = ROLE_TABLES[role];
    const row = db.prepare(`SELECT * FROM ${table} WHERE lower(email) = ?`).get(cleanEmail);
    const valid = row ? await verifyPassword(password, row.password) : false;
    if (!row || !valid) {
      loginLimiter.registerFailure(ip);
      return res.status(401).json({ error: "Geçersiz e-posta veya şifre." });
    }
    loginLimiter.reset(ip);

    // Şifre doğru — ama oturum HENÜZ verilmiyor. Çifte doğrulamanın ikinci adımı olarak e-postaya
    // 6 haneli bir kod gönderiliyor; gerçek oturum token'ı sadece bu kod doğrulanınca üretiliyor.
    const otp = generateOtp();
    const loginTicket = generateRandomTicket();
    pendingLogins.set(loginTicket, { role, id: row.id, email: cleanEmail, otp, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });

    const mailResult = await sendMail({
      to: cleanEmail,
      subject: "Fixperto — Giriş doğrulama kodunuz",
      text: `Giriş doğrulama kodunuz: ${otp}\n\nBu kod ${OTP_TTL_MS / 60000} dakika geçerlidir. Bu girişi siz yapmadıysanız şifrenizi değiştirin.`,
      html: `<p>Giriş doğrulama kodunuz:</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px">${otp}</p><p>Bu kod ${OTP_TTL_MS / 60000} dakika geçerlidir. Bu girişi siz yapmadıysanız şifrenizi değiştirin.</p>`,
    });

    const response = { ok: true, requiresOtp: true, loginTicket, mailSent: mailResult.sent };
    if (!mailResult.sent && process.env.NODE_ENV !== "production") {
      response.devOtp = otp;
      response.devNote = mailResult.devNote;
    }
    res.json(response);
  } catch (err) {
    console.error("[auth] login hatası:", err);
    res.status(500).json({ error: "Giriş yapılamadı." });
  }
});

authRouter.post("/verify-otp", (req, res) => {
  const ip = clientIp(req);
  if (otpLimiter.check(ip).blocked) {
    return res.status(429).json({ error: "Çok fazla başarısız deneme. Lütfen birkaç dakika sonra tekrar deneyin." });
  }
  const { loginTicket, code } = req.body || {};
  const pending = loginTicket ? pendingLogins.get(loginTicket) : null;
  if (!pending) return res.status(400).json({ error: "Giriş oturumu bulunamadı, lütfen tekrar giriş yapın." });
  if (Date.now() > pending.expiresAt) {
    pendingLogins.delete(loginTicket);
    return res.status(400).json({ error: "Doğrulama kodunun süresi doldu, lütfen tekrar giriş yapın." });
  }
  if (String(code || "") !== pending.otp) {
    pending.attempts += 1;
    otpLimiter.registerFailure(ip);
    if (pending.attempts >= OTP_MAX_ATTEMPTS) {
      pendingLogins.delete(loginTicket);
      return res.status(400).json({ error: "Çok fazla hatalı kod denemesi, lütfen tekrar giriş yapın." });
    }
    return res.status(400).json({ error: "Kod hatalı." });
  }
  otpLimiter.reset(ip);
  pendingLogins.delete(loginTicket);
  const token = createSession(pending.id, pending.role);
  const table = ROLE_TABLES[pending.role];
  const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(pending.id);
  res.json({ ok: true, token, user: sanitizeUser(pending.role, row) });
});

authRouter.post("/logout", (req, res) => {
  const header = req.headers.authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (match) destroySession(match[1]);
  res.json({ ok: true });
});

authRouter.get("/me", requireSession(["owner", "mechanic"]), (req, res) => {
  const table = ROLE_TABLES[req.session.role];
  const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.session.id);
  if (!row) return res.status(404).json({ error: "Kullanıcı bulunamadı." });
  res.json(sanitizeUser(req.session.role, row));
});

function generateRandomTicket() {
  return crypto.randomBytes(24).toString("hex");
}
