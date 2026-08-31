import nodemailer from "nodemailer";

// GÜVENLİK/ÖZELLİK: gerçek e-posta ile kayıt doğrulaması ve giriş için tek seferlik kod (OTP)
// göndermek için kullanılıyor (bkz. backend/routes/auth.js). SMTP bilgisi ortam değişkenlerinden
// okunuyor (bkz. backend/.env.example) — böylece gerçek bir Gmail "Uygulama Şifresi" (App Password,
// normal Gmail şifresi DEĞİL) veya başka bir SMTP sağlayıcısı .env dosyasına eklenerek devreye
// alınabilir. Hiçbir SMTP bilgisi ayarlanmamışsa (yerel geliştirmede varsayılan durum), gerçek mail
// GÖNDERİLMEZ — bunun yerine gönderilecek içerik backend konsoluna yazılır ki sistem SMTP
// kurulmadan da uçtan uca test edilebilsin. Prodüksiyona alırken FIXPERTO_SMTP_* değişkenleri
// mutlaka gerçek bilgilerle doldurulmalı, aksi halde kullanıcılar otomatik şifrelerini/giriş
// kodlarını hiçbir zaman gerçekten alamaz.
const SMTP_HOST = process.env.FIXPERTO_SMTP_HOST;
const SMTP_PORT = Number(process.env.FIXPERTO_SMTP_PORT || 587);
const SMTP_USER = process.env.FIXPERTO_SMTP_USER;
const SMTP_PASS = process.env.FIXPERTO_SMTP_PASS;
const MAIL_FROM = process.env.FIXPERTO_MAIL_FROM || SMTP_USER || "Fixperto <no-reply@fixperto.local>";

const mailerConfigured = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter = null;
function getTransporter() {
  if (!mailerConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

// Gerçek mail gönderilemediğinde (SMTP ayarlanmamış VEYA gönderim sırasında hata) çağıran kod bunu
// bilmeli — sessizce "başarılı" dönüp kullanıcının asla gelmeyecek bir maili beklemesine yol
// açmamak için `sent: false` ile birlikte bir `devNote` döndürülüyor. Rotalar bu durumda isteği
// yine de başarıyla tamamlayabilir (demo/geliştirme akışını kilitlememek için) ama frontend'e
// "gerçekten gönderildi mi" bilgisini iletebilir.
export async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[mailer] SMTP yapılandırılmamış — gerçek mail gönderilmedi. Alıcı: ${to}\nKonu: ${subject}\n${text}`);
    return { sent: false, devNote: "SMTP yapılandırılmamış, içerik sunucu konsoluna yazıldı." };
  }
  try {
    await t.sendMail({ from: MAIL_FROM, to, subject, text, html });
    return { sent: true };
  } catch (err) {
    console.error(`[mailer] Mail gönderilemedi (${to}):`, err?.message || err);
    return { sent: false, devNote: "Mail gönderimi başarısız oldu, sunucu loglarına bakın." };
  }
}

export function isMailerConfigured() {
  return mailerConfigured;
}
