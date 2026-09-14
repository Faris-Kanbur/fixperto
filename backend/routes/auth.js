import { Router } from "express";
import { clientIp, rateLimitKey } from "../utils/clientIp.js";
import { asyncRoute } from "../utils/asyncRoute.js";
import crypto from "node:crypto";
import { db, recomputeMechanicReviews } from "../db/db.js";
import { hydrate } from "../db/hydrate.js";
import { sendMail, isMailerConfigured } from "../utils/mailer.js";
import {
  hashPassword, verifyPassword, generateRandomPassword, generateOtp,
  createSession, destroySession, requireSession, makeRateLimiter,
  destroyUserSessions, userSessionCount, extractBearerToken, hashIp,
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

// Giriş ve OTP sınırları da birer OPS AYARI: kayıt sınırıyla aynı gerekçe (paylaşımlı IP arkasında
// gerçek kullanıcılar, ve otomatik testlerin kendi kimlik akışını doğrulayabilmesi). Varsayılanlar
// korumacı; ortam değişkeniyle yükseltilebilir. Sınırın KENDİSİ kapatılamıyor — 0 ya da negatif
// verilirse varsayılana düşülüyor, yani "sınırı kaldır" diye bir yapılandırma yok.
const LOGIN_MAX = Number(process.env.LOGIN_LIMIT_PER_WINDOW) > 0 ? Number(process.env.LOGIN_LIMIT_PER_WINDOW) : 10;
const loginLimiter = makeRateLimiter({ maxAttempts: LOGIN_MAX, lockoutMs: 15 * 60 * 1000 });
/**
 * OTP'de İKİ AYRI KORUMA VAR ve ayrı olmaları önemli:
 *   1) BİLET BAŞINA deneme (OTP_MAX_ATTEMPTS = 5, sabit): belirli bir giriş denemesindeki kodu
 *      kaba kuvvetle bulmayı engeller. Yalnızca o bileti etkiler, başka kullanıcıya dokunmaz.
 *   2) IP BAŞINA deneme (aşağıdaki sınırlayıcı): aynı çıkıştan gelen toplu denemeyi keser.
 * İkincisi bir OPS AYARI, çünkü paylaşımlı bir IP arkasında (ofis, CGNAT) bir kişinin denemesi
 * aynı çıkıştaki HERKESİ kilitler (bkz. TRUST_PROXY notu). Birincisi ayarlanabilir DEĞİL:
 * kodun kendisini korumak pazarlık konusu değil.
 */
const OTP_IP_MAX = Number(process.env.OTP_IP_LIMIT_PER_WINDOW) > 0 ? Number(process.env.OTP_IP_LIMIT_PER_WINDOW) : OTP_MAX_ATTEMPTS;
const otpLimiter = makeRateLimiter({ maxAttempts: OTP_IP_MAX, lockoutMs: 15 * 60 * 1000 });

/**
 * BEKLEYEN GİRİŞLER SINIRSIZ BÜYÜYEMEZ (denetimde bulundu).
 * ------------------------------------------------------------------------------------------------
 * `pendingLogins` bellek içi bir Map ve yalnızca SÜRESİ DOLAN kayıtları temizleyen bir süpürücüsü
 * var. Ama giriş sınırlayıcısı yalnızca BAŞARISIZ denemeleri sayıyor: geçerli şifreye sahip biri
 * (kendi hesabı bile olsa) art arda giriş çağırarak 10 dakika boyunca Map'i sınırsız şişirebilir.
 * Bu, kimlik doğrulaması gerektirmeyen ucuz bir bellek tüketme yolu. Üst sınır koyuyoruz: dolduğunda
 * EN ESKİ bekleyen giriş düşürülüyor — yeni girişleri reddetmek, saldırganın meşru kullanıcıları
 * kilitlemesine izin vermek olurdu.
 */
const MAX_PENDING_LOGINS = 5000;
// GÜVENLİK DÜZELTMESİ (tam site denetiminde bulundu): /register'da hiçbir hız sınırı yoktu — tek bir
// IP, script ile sınırsız sahte hesap açıp hem veritabanını şişirebilir hem de her kayıtta bir
// e-posta gönderttiği için SMTP hesabının spam olarak işaretlenmesine (mail itibarının yanmasına)
// yol açabilirdi. Giriş/OTP ile aynı paylaşılan sınırlayıcı deseni burada da uygulanıyor.
// Sınır bir OPS AYARI: gerçek bir ofis/aile aynı IP'nin arkasından birden çok hesap açabilir ve
// bu sayı dağıtıma göre değişir. Varsayılan korumacı; ortam değişkeniyle yükseltilebilir.
const REGISTER_MAX = Number(process.env.REGISTER_LIMIT_PER_HOUR) > 0 ? Number(process.env.REGISTER_LIMIT_PER_HOUR) : 5;
const registerLimiter = makeRateLimiter({ maxAttempts: REGISTER_MAX, lockoutMs: 60 * 60 * 1000, windowMs: 60 * 60 * 1000 });

// loginTicket -> { role, id, email, otp, expiresAt } — şifre doğrulandıktan sonra, OTP onaylanana
// kadar geçen KISA süreli ara adım. Gerçek oturum token'ı (createSession) sadece OTP doğrulanınca
// verilir — bu map'teki bir ticket TEK BAŞINA hiçbir korumalı uç noktaya erişim sağlamaz.
const pendingLogins = new Map();

// Süresi dolan (hiç doğrulanmayan) giriş biletleri, birileri o bileti tekrar denemedikçe map'te
// sonsuza kadar kalıyordu — hem bellek sızıntısı hem de gereksiz şekilde OTP kodlarını bellekte
// tutmak demekti. Periyodik olarak temizleniyor (unref: süreç kapanışını engellemez).
const PENDING_SWEEP_MS = 5 * 60 * 1000;
const pendingSweepTimer = setInterval(() => {
  const now = Date.now();
  for (const [ticket, pending] of pendingLogins) {
    if (now > pending.expiresAt) pendingLogins.delete(ticket);
  }
}, PENDING_SWEEP_MS);
if (typeof pendingSweepTimer.unref === "function") pendingSweepTimer.unref();



function sanitizeUser(role, row) {
  const hydrated = hydrate(ROLE_TABLES[role], row);
  return { ...hydrated, role };
}

export const authRouter = Router();

authRouter.post("/register", asyncRoute(async (req, res) => {
  try {
    const ip = rateLimitKey(req);
    if (registerLimiter.check(ip).blocked) {
      return res.status(429).json({ error: "Çok fazla kayıt denemesi. Lütfen daha sonra tekrar deneyin." });
    }
    registerLimiter.registerFailure(ip); // her kayıt denemesi (başarılı da olsa) sayaca yazılır
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
      const stmt = db.prepare(`INSERT INTO owners (name, email, phone, city, joinDate, status, password, signupIpHash) VALUES (@name, @email, @phone, @city, @joinDate, 'active', @password, @signupIpHash)`);
      const info = stmt.run({ signupIpHash: hashIp(clientIp(req)), name: cleanName, email: cleanEmail, phone: req.body.phone || null, city: req.body.city || null, joinDate: new Date().toISOString().slice(0, 10), password: hashed });
      created = db.prepare(`SELECT * FROM owners WHERE id = ?`).get(info.lastInsertRowid);
    } else {
      // GERÇEK HATA DÜZELTMESİ: yeni kaydolan tamircide rating/reviews/price/verified sütunları
      // NULL kalıyordu. Bu alanlar arayüzde doğrudan sayı olarak işleniyor (puan yıldızı, fiyat
      // seviyesi, `.toFixed()`), NULL gelince uygulama çöküyordu. Yeni bir işletme için doğru
      // başlangıç değeri sıfırdır — bunları açıkça 0 yazıyoruz.
      // distance/lat/lng bilerek NULL bırakılıyor: yeni tamircinin henüz adresi yok, mesafesi
      // GERÇEKTEN bilinmiyor. 0 yazmak "0 km uzaklıkta" gibi bir YALAN olurdu; arayüz bunu
      // "—" olarak gösteriyor (bkz. frontend helpers.ts formatDistance).
      const stmt = db.prepare(`INSERT INTO mechanics (name, email, phone, specialty, lang, password, rating, reviews, price, verified, shareCount, signupIpHash)
        VALUES (@name, @email, @phone, @specialty, 'tr', @password, 0, 0, 0, 0, 0, @signupIpHash)`);
      // GERÇEK HATA DÜZELTMESİ: `specialty` NULL kaydediliyordu. Arayüzdeki arama filtreleri bu
      // alanı metin olarak işliyor (m.specialty.toLowerCase()) ve tek bir NULL kayıt "Cannot read
      // properties of null" ile TÜM arama ekranlarını çökertiyordu — üstelik tamirci, araç ve iş
      // ilanı aramaları aynı sorgu state'ini paylaştığı için üçü birden. Metin alanları için NULL
      // yerine boş dize yazıyoruz (sayısal alanlar için aynı düzeltme yukarıda 0 ile yapılmıştı).
      const info = stmt.run({ signupIpHash: hashIp(clientIp(req)), name: cleanName, email: cleanEmail, phone: req.body.phone || "", specialty: req.body.specialty || "", password: hashed });
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
}));

authRouter.post("/login", asyncRoute(async (req, res) => {
  try {
    const ip = rateLimitKey(req);
    if (loginLimiter.check(ip).blocked) {
      return res.status(429).json({ error: "Çok fazla başarısız deneme. Lütfen birkaç dakika sonra tekrar deneyin." });
    }
    const { role, email, password } = req.body || {};
    const cleanEmail = String(email || "").trim().toLowerCase();
    // MİSAFİR GEZİNME / POPUP GİRİŞ: giriş ekranı artık "önce rolünü seç" adımından sonra gelmiyor
    // (rol seçim sayfası kaldırıldı, giriş bir popup) — bu yüzden `role` artık ZORUNLU DEĞİL.
    // Verilmezse hesap, e-postadan otomatik bulunuyor: önce araç sahipleri, sonra tamirciler
    // tablosunda aranıyor ve ŞİFRESİ EŞLEŞEN kayıt kullanılıyor. Böylece kullanıcı "ben tamirci
    // miyim, araç sahibi miyim" diye seçmek zorunda kalmıyor (Airbnb/benzeri siteler gibi tek giriş).
    const candidateRoles = ROLE_TABLES[role] ? [role] : ["owner", "mechanic"];
    let matchedRole = null;
    let row = null;
    for (const r of candidateRoles) {
      const candidate = db.prepare(`SELECT * FROM ${ROLE_TABLES[r]} WHERE lower(email) = ?`).get(cleanEmail);
      // eslint-disable-next-line no-await-in-loop
      if (candidate && await verifyPassword(password, candidate.password)) { matchedRole = r; row = candidate; break; }
    }
    if (!row) {
      loginLimiter.registerFailure(ip);
      return res.status(401).json({ error: "Geçersiz e-posta veya şifre." });
    }
    loginLimiter.reset(ip);

    // Şifre doğru — ama oturum HENÜZ verilmiyor. Çifte doğrulamanın ikinci adımı olarak e-postaya
    // 6 haneli bir kod gönderiliyor; gerçek oturum token'ı sadece bu kod doğrulanınca üretiliyor.
    const otp = generateOtp();
    const loginTicket = generateRandomTicket();
    if (pendingLogins.size >= MAX_PENDING_LOGINS) {
      // Map ekleme sırasını korur; ilk anahtar en eski bekleyen giriştir.
      const oldest = pendingLogins.keys().next().value;
      if (oldest !== undefined) pendingLogins.delete(oldest);
    }
    pendingLogins.set(loginTicket, { role: matchedRole, id: row.id, email: cleanEmail, otp, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });

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
}));

authRouter.post("/verify-otp", (req, res) => {
  const ip = rateLimitKey(req);
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

/**
 * ====== HESAP GÜVENLİĞİ UÇLARI ======
 * Üçü de AYNI kurala dayanıyor: hesabın kalıcı kontrolünü etkileyen bir işlem, oturum token'ının
 * varlığıyla YAPILAMAZ; mevcut ŞİFRE sorulur. Gerekçe: token çalınabilir (XSS, ödünç alınmış
 * cihaz, kopyalanmış localStorage). Token'ı olan biri şifreyi/e-postayı değiştirebilseydi ya da
 * hesabı silebilseydi, gerçek sahibi hesabından kalıcı olarak dışarıda kalırdı.
 */
const accountLimiter = makeRateLimiter({ maxAttempts: 10, lockoutMs: 15 * 60 * 1000, windowMs: 15 * 60 * 1000 });

async function requireCurrentPassword(req, res) {
  const ip = rateLimitKey(req);
  if (accountLimiter.check(ip).blocked) {
    res.status(429).json({ error: "Çok fazla deneme. Lütfen birkaç dakika sonra tekrar deneyin." });
    return null;
  }
  const table = ROLE_TABLES[req.session.role];
  const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.session.id);
  if (!row) { res.status(404).json({ error: "Kullanıcı bulunamadı." }); return null; }
  const given = req.body?.currentPassword;
  const okPass = typeof given === "string" && given.length > 0 && await verifyPassword(given, row.password);
  if (!okPass) {
    accountLimiter.registerFailure(ip);
    res.status(403).json({ error: "Mevcut şifreniz yanlış." });
    return null;
  }
  return row;
}

/** Açık oturum sayısı — "başka cihazlarda oturumunuz açık" bilgisini göstermek için. */
authRouter.get("/sessions", requireSession(["owner", "mechanic"]), (req, res) => {
  res.json({ count: userSessionCount(req.session.id, req.session.role) });
});

/**
 * TÜM CİHAZLARDAN ÇIKIŞ. Şifre istemiyoruz: bu işlem hesabı kaybettirmez, aksine güvenliği
 * ARTIRIR — "telefonumu kaybettim" diyen birinin önündeki engeli azaltmak doğru olan.
 * İsteği yapan oturum isterse ayakta kalır (keepCurrent), istemezse o da kapanır.
 */
authRouter.post("/logout-all", requireSession(["owner", "mechanic"]), (req, res) => {
  const keep = req.body?.keepCurrent === false ? null : extractBearerToken(req);
  const closed = destroyUserSessions(req.session.id, req.session.role, keep);
  res.json({ ok: true, closed });
});

/**
 * ŞİFRE DEĞİŞTİRME. Mevcut şifre zorunlu ve değişimden sonra DİĞER TÜM OTURUMLAR KAPANIR.
 * Eskiden bu iş genel /:id/set-password ucundan yapılıyordu ve yalnızca token istiyordu; üstelik
 * eski oturumlar açık kalıyordu — yani hesabı ele geçirilmiş biri şifresini değiştirse bile
 * saldırgan içeride kalmaya devam ediyordu.
 */
authRouter.post("/change-password", requireSession(["owner", "mechanic"]), asyncRoute(async (req, res) => {
  const row = await requireCurrentPassword(req, res);
  if (!row) return;
  const next = req.body?.newPassword;
  if (typeof next !== "string" || next.length < 8) {
    return res.status(400).json({ error: "Yeni şifre en az 8 karakter olmalı." });
  }
  if (next === req.body?.currentPassword) {
    return res.status(400).json({ error: "Yeni şifre eskisiyle aynı olamaz." });
  }
  const table = ROLE_TABLES[req.session.role];
  db.prepare(`UPDATE ${table} SET password = ? WHERE id = ?`).run(await hashPassword(next), req.session.id);
  const closed = destroyUserSessions(req.session.id, req.session.role, extractBearerToken(req));
  res.json({ ok: true, otherSessionsClosed: closed });
}));

/**
 * E-POSTA DEĞİŞTİRME. E-posta, şifre sıfırlamanın gittiği adrestir: onu değiştirmek hesabın
 * kontrolünü devretmektir. Bu yüzden genel profil güncellemesiyle (PATCH /api/owners/:id)
 * yapılamıyor — orada e-posta alanı düşürülüyor (bkz. makeCrudRouter ACCOUNT_CRITICAL_FIELDS) —
 * ve burada mevcut şifre isteniyor.
 */
authRouter.post("/change-email", requireSession(["owner", "mechanic"]), asyncRoute(async (req, res) => {
  const row = await requireCurrentPassword(req, res);
  if (!row) return;
  const email = String(req.body?.newEmail || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Geçersiz e-posta adresi." });
  const table = ROLE_TABLES[req.session.role];
  // Aynı e-posta başka bir hesapta kullanılıyorsa reddediyoruz: giriş e-posta ile yapılıyor,
  // çakışma olursa hangi hesaba gireceği belirsizleşir.
  for (const [role, tbl] of Object.entries(ROLE_TABLES)) {
    const clash = db.prepare(`SELECT id FROM ${tbl} WHERE lower(email) = ?`).get(email);
    if (clash && !(tbl === table && clash.id === req.session.id)) {
      return res.status(409).json({ error: "Bu e-posta adresi başka bir hesapta kullanılıyor." });
    }
  }
  db.prepare(`UPDATE ${table} SET email = ? WHERE id = ?`).run(email, req.session.id);
  // Eski adrese haber ver: e-posta değişimi hesap ele geçirmenin klasik adımıdır, gerçek sahibi
  // bunu öğrenmeli. Posta sunucusu yoksa sessizce geçiyoruz (uygulama akışı bozulmasın).
  if (isMailerConfigured() && row.email && row.email !== email) {
    sendMail({
      to: row.email,
      subject: "Fixperto hesabınızın e-posta adresi değişti",
      text: `Hesabınızın e-posta adresi ${email} olarak değiştirildi. Bu işlemi siz yapmadıysanız hemen bizimle iletişime geçin.`,
    }).catch(() => {});
  }
  res.json({ ok: true, email });
}));

/**
 * HESAP SİLME — gerçekten siliyor.
 * Eskiden bu düğme yalnızca "Hesabınız silindi (demo)" yazan bir bildirim gösteriyordu: hesap
 * duruyordu. Kullanıcıya verisinin silindiğini söyleyip saklamak, hem yanlış bilgi hem de veri
 * koruması (KVKK/GDPR "unutulma hakkı") açısından savunulamaz.
 *
 * NE SİLİNİR, NE KALIR: kişinin kendi kaydı, araçları, oturumları ve kayıtlı aramaları silinir.
 * Randevu/teklif/yorum gibi KARŞI TARAFIN da tarafı olduğu kayıtlar silinmez — bunlar tamircinin
 * işletme geçmişi ve tek taraflı yok edilemez — ama kişiyi tanımlayan alanları anonimleştirilir.
 */
authRouter.post("/delete-account", requireSession(["owner", "mechanic"]), asyncRoute(async (req, res) => {
  const row = await requireCurrentPassword(req, res);
  if (!row) return;
  const { id, role } = req.session;
  const anonName = "Silinmiş kullanıcı";
  const tx = db.transaction(() => {
    /**
     * KİŞİSEL PROFİL HER İKİ ROLDE DE SİLİNİR (otomatik güvenlik matrisinde bulundu).
     * ---------------------------------------------------------------------------------------------
     * Öneri profili (taste_signals) hesap silindikten sonra tabloda kalıyordu. Kullanıcı "hesabımı
     * sil" dediğinde kastettiği şey "verimi tutmayı bırak"tır; ana kaydı silip ondan türetilmiş
     * kişisel profili saklamak, silme talebini teknik bir kurnazlıkla boşa çıkarmaktır. Ayrıca
     * bu satırlar hiçbir işe de yaramaz: sahibi olmayan bir profilden öneri üretilmiyor.
     */
    db.prepare(`DELETE FROM taste_signals WHERE userId = ? AND role = ?`).run(id, role);

    if (role === "owner") {
      /**
       * GERÇEK HATA (otomatik güvenlik matrisinde bulundu): `appointments.ownerId` ve
       * `quote_requests.ownerId` owners(id)'ye YABANCI ANAHTARLA bağlı. Randevular bilerek
       * silinmiyor (tamircinin işletme geçmişi) ama bağ koparılmadığı için `DELETE FROM owners`
       * kısıt hatası veriyordu. Yani "hesabımı sil", HİÇ RANDEVU ALMIŞ her kullanıcıda
       * başarısızdı — ve async rota hatası olduğu için sunucuyu komple düşürüyordu.
       *
       * Doğru davranış zaten belgede yazılıydı: kaydı sakla, KİŞİYİ çıkar. Bu yüzden hem ad
       * anonimleştiriliyor hem BAĞ (ownerId) koparılıyor — ikisi bir arada olmazsa ya veri
       * silinmiş sayılmaz ya da silme hiç çalışmaz.
       */
      db.prepare(`UPDATE appointments SET customer = ?, ownerId = NULL WHERE ownerId = ?`).run(anonName, id);
      db.prepare(`UPDATE quote_requests SET ownerId = NULL WHERE ownerId = ?`).run(id);
      db.prepare(`UPDATE conversations SET ownerId = NULL WHERE ownerId = ?`).run(id);
      db.prepare(`DELETE FROM vehicles WHERE ownerId = ?`).run(id);
      /**
       * GERÇEK HATA (aynı tarama): araç sahibinin İLANLARI silmeden sonra "active" kalıyordu.
       * Tamirci kolunda bu düşünülmüş (aşağıda listings → 'removed') ama araç sahibi kolunda
       * atlanmış. Sonuç sessiz ve kötü: ilan yayında durur, alıcı teklif verir ve soru sorar,
       * karşı tarafta artık kimse yoktur. Satıcısı olmayan bir ilan pazar yerinde durmamalı.
       */
      db.prepare(`UPDATE listings SET status = 'removed' WHERE sellerId = ? AND (sellerType IS NULL OR sellerType = 'owner')`).run(id);
      /**
       * Yorumlar SİLİNMEZ — tamircinin işletme geçmişidir ve tek taraflı yok edilemez (randevu
       * kaydıyla aynı gerekçe). Ama yazarın ADI kişisel veridir: anonimleştiriliyor. Puan
       * önbelleği de yeniden hesaplanmıyor çünkü yorumun kendisi ve puanı yerinde kalıyor.
       */
      const touchedMechanics = db.prepare(
        `SELECT DISTINCT mechanicId FROM mechanic_reviews WHERE authorId = ? AND (authorType IS NULL OR authorType = 'owner')`
      ).all(id).map((r) => r.mechanicId);
      db.prepare(`UPDATE mechanic_reviews SET author = ? WHERE authorId = ? AND (authorType IS NULL OR authorType = 'owner')`).run(anonName, id);
      /**
       * ÖNBELLEĞİ DE TAZELEMEK ZORUNLU. Yorumlar tabloda ama `mechanics.reviewList` sütunu onların
       * JSON bir KOPYASI (okuma yollarını değiştirmemek için, bkz. db.js). Tabloyu anonimleştirip
       * kopyayı bırakmak, silinen kullanıcının GERÇEK ADINI her tamirci profilinde görünür
       * bırakırdı — yani anonimleştirme kâğıt üzerinde kalırdı. Bu tuzak, veriyi iki yerde
       * tutmanın bedeli; o yüzden tek yazma yolu her zaman recompute'tan geçiyor.
       */
      for (const mechanicId of touchedMechanics) recomputeMechanicReviews(mechanicId);
      db.prepare(`DELETE FROM owners WHERE id = ?`).run(id);
    } else {
      // Tamirci kaydı silinirse randevu/ilan geçmişi sahipsiz kalır; kaydı anonimleştirip
      // yayından kaldırıyoruz (profil aramada çıkmasın, iletişim bilgisi kalmasın).
      db.prepare(`UPDATE mechanics SET name = ?, email = ?, phone = NULL, address = NULL, iban = '', bankName = '', accountHolder = '', verified = 0, services = '[]', staff = '[]' WHERE id = ?`)
        .run(anonName, `deleted-${id}@fixperto.invalid`, id);
      db.prepare(`UPDATE listings SET status = 'removed' WHERE sellerId = ? AND sellerType = 'mechanic'`).run(id);
      db.prepare(`UPDATE job_listings SET status = 'closed' WHERE mechanicId = ?`).run(id);
    }
  });
  tx();
  destroyUserSessions(id, role);
  res.json({ ok: true });
}));

authRouter.get("/me", requireSession(["owner", "mechanic"]), (req, res) => {
  const table = ROLE_TABLES[req.session.role];
  const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.session.id);
  if (!row) return res.status(404).json({ error: "Kullanıcı bulunamadı." });
  res.json(sanitizeUser(req.session.role, row));
});

function generateRandomTicket() {
  return crypto.randomBytes(24).toString("hex");
}
