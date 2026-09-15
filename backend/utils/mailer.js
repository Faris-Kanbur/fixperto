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
    /**
     * `skipped` AYRI BİR DURUM, hata DEĞİL (Faz 5'te ölçüm yaparken fark edildi).
     * İlk hâlde kuyruk bunu "failed" sayıyor ve her e-posta için hata günlüğü basıyordu. Sonucu:
     * geliştirme ortamında `failed` sayacı sürekli artıyor ve konsol hata mesajıyla doluyordu.
     * SÜREKLİ KIRMIZI YANAN BİR ÖLÇÜM, KİMSENİN BAKMADIĞI ÖLÇÜMDÜR — gerçek bir SMTP arızası
     * o gürültünün içinde kaybolurdu. "Yapılandırılmamış" bilinen ve kasıtlı bir durum; ayrı sayılıyor.
     */
    return { sent: false, skipped: true, devNote: "SMTP yapılandırılmamış, içerik sunucu konsoluna yazıldı." };
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

/**
 * E-POSTAYI İSTEK YOLUNDAN ÇIKARMA (Faz 5).
 * ================================================================================================
 * SORUN (denetimde ölçüldü): kayıt ve giriş uçları `await sendMail(...)` yapıyordu. SMTP sunucusu
 * yavaşladığında — ki bu dış bir servis, bizim denetimimizde değil — kullanıcının KAYIT ve GİRİŞ
 * yanıtı o kadar bekliyordu. Ölçüm aşağıda; 2 saniye gecikmeli bir SMTP'de giriş yanıtı 2 saniye
 * sürüyordu ve bu süre boyunca Node'un o isteği tutan bağlantısı da meşguldü.
 *
 * NEDEN GERÇEK BİR KUYRUK SİSTEMİ (Redis/BullMQ) DEĞİL:
 * Kuyruğa alınacak iş tek bir şey: e-posta göndermek. Yeni bir servis, yeni bir bağımlılık ve yeni
 * bir işletme yükü (Redis'in kendisi de ayakta durmalı) getirmek bu iş için karşılığı olmayan bir
 * karmaşıklık. Süreç içi sıralı bir kuyruk 40 satır ve ihtiyacı karşılıyor.
 *
 * DÜRÜST SINIR — BU KUYRUK SÜREÇ İÇİNDE:
 * Sunucu yeniden başlarsa bekleyen e-postalar KAYBOLUR. Bunun kabul edilebilir olmasının sebebi
 * kuyruğun tipik olarak boş olması ve bekleyen işin ömrünün saniyeler olması; ama kabul edilebilir
 * olması "yok" demek değil, o yüzden yazıyorum. Kalıcılık gerektiğinde doğru adım e-postaları bir
 * tabloya yazıp oradan işlemek olur — bugün gereksiz, çünkü kayıp olasılığı ölçülebilir değil.
 *
 * NEDEN SIRALI (tek seferde bir tane):
 * SMTP sağlayıcıları eşzamanlı bağlantı ve gönderim hızını sınırlıyor. Bekleyen 50 e-postayı
 * paralel göndermek, sağlayıcının hepsini reddetmesine yol açabilir — yani "hızlandırmak" için
 * yapılan şey teslimatı tamamen bozar.
 */
const QUEUE_MAX = Number(process.env.MAIL_QUEUE_MAX) || 500;
const RETRY_DELAY_MS = Number(process.env.MAIL_RETRY_DELAY_MS) || 5000;

const queue = [];
let working = false;
const counters = { queued: 0, sent: 0, skipped: 0, failed: 0, dropped: 0, retried: 0 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function drain() {
  if (working) return;
  working = true;
  try {
    while (queue.length > 0) {
      const job = queue.shift();
      const result = await sendMail(job.mail);
      if (result.sent) { counters.sent++; continue; }
      // SMTP hiç yapılandırılmamış: bilinen ve kasıtlı durum. Ne yeniden deneme ne hata günlüğü —
      // içerik zaten konsola yazıldı (bkz. sendMail içindeki `skipped` notu).
      if (result.skipped) { counters.skipped++; continue; }
      /**
       * BİR KEZ YENİDEN DENEME. Sebebi: SMTP hatalarının büyük kısmı geçici (bağlantı zaman
       * aşımı, anlık hız sınırı). Sonsuz deneme yapmıyoruz — kalıcı bir hata (yanlış şifre,
       * geçersiz alıcı) sonsuza kadar kuyruğu meşgul edip arkasındaki e-postaları bloke ederdi.
       * SMTP hiç yapılandırılmamışsa yeniden denemenin anlamı yok, o yüzden koşul içinde.
       */
      if (!job.retried && mailerConfigured) {
        job.retried = true;
        counters.retried++;
        queue.push(job);
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      counters.failed++;
      /**
       * BAŞARISIZLIK GÖRÜNÜR OLMAK ZORUNDA. Bu e-postalar şifre ve giriş kodu taşıyor: teslim
       * edilemeyen bir OTP, kullanıcının hesabına GİREMEMESİ demek. Sayaç yönetici ölçümlerinde
       * (bkz. routes/admin.js) okunuyor ki sessiz bir teslimat arızası fark edilsin.
       */
      console.error(`[mailer] kuyruktan gönderilemedi (${job.mail.to}): ${job.mail.subject}`);
    }
  } finally {
    working = false;
  }
}

/**
 * E-POSTAYI KUYRUĞA AL — ANINDA DÖNER.
 * Dönüş `{ queued: boolean }`: kuyruk doluysa false. Çağıran bunu bir hata olarak ele ALMIYOR,
 * çünkü kullanıcı açısından işlem (kayıt/giriş) başarılı; ama sayaç ve günlük kaydı düşülüyor.
 */
export function queueMail(mail) {
  counters.queued++;
  /**
   * SINIRLI KUYRUK. Sınırsız bir dizi, SMTP takıldığında bellek sızıntısına dönüşür — aynı sınıf
   * hata bu projede daha önce oturum ve hız sınırı haritalarında da düzeltildi. Sınıra gelindiğinde
   * EN ESKİSİ atılıyor: en eski OTP muhtemelen zaten süresi dolmuş, en yenisi hâlâ işe yarar.
   */
  if (queue.length >= QUEUE_MAX) {
    queue.shift();
    counters.dropped++;
    console.error(`[mailer] kuyruk dolu (${QUEUE_MAX}), en eski e-posta atıldı. SMTP takılmış olabilir.`);
  }
  queue.push({ mail, retried: false });
  // `void`: kasıtlı olarak beklenmiyor — isteğin bu işi beklememesi bu değişikliğin bütün amacı.
  void drain();
  return { queued: true };
}

/** Ölçüm için: kuyruk derinliği ve sayaçlar (bkz. Faz 5b izleme). */
export function mailMetrics() {
  return { configured: mailerConfigured, pending: queue.length, ...counters };
}
