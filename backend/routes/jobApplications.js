import { Router } from "express";
import { db } from "../db/db.js";
import { clientIp, rateLimitKey } from "../utils/clientIp.js";
import { hydrate } from "../db/hydrate.js";
import { makeRateLimiter, resolveActor } from "../utils/auth.js";

/**
 * İŞ İLANINA BAŞVURU — adayın yazma yolu.
 * ---------------------------------------------------------------------------------------------
 * GERÇEK HATA (tam denetimde bulundu, teklif/soru ile AYNI sınıf): başvuru,
 * `PATCH /api/jobs/:id` ile ilanın `applicants` dizisine yazılıyordu. Ama iş ilanının yazma
 * yetkisi İLANI AÇAN TAMİRCİYE bağlı (authScope: mechanicId) — başvuran o tamirci olmadığı için
 * istek 403 dönüyordu. Sonuç: kullanıcı "Başvurunuz iletildi" mesajını görüyor, başvuru
 * veritabanına HİÇ yazılmıyor, tamirci hiçbir zaman görmüyordu. Sessiz ve tam bir kayıp.
 *
 * Ayrıca dizinin tamamı istemciden geldiği için bir aday, ilandaki DİĞER başvuruları silebilir
 * ya da kendi başvurusunun durumunu "kabul edildi" yapabilirdi. Artık:
 *   - Ekleme ayrı bir uç noktada; aday kimliği oturumdan damgalanıyor.
 *   - Ekleme sunucudaki GÜNCEL diziye yapılıyor (eşzamanlı başvurular birbirini ezmiyor).
 *   - Başvuru DURUMUNU (kabul/ret) yalnızca ilan sahibi tamirci değiştirebiliyor; o da genel
 *     PATCH ile değil, aşağıdaki özel uçtan — böylece diziyi topluca ezmesi de mümkün değil.
 */
export const jobApplicationsRouter = Router();

const MAX_APPLICANTS = 500;
const MAX_MESSAGE_LEN = 2000;
const MAX_CV_LEN = 6_000_000;   // ~4.5MB base64
const VALID_STATUS = new Set(["pending", "accepted", "rejected"]);

const writeLimiter = makeRateLimiter({ maxAttempts: 20, lockoutMs: 10 * 60 * 1000, windowMs: 10 * 60 * 1000 });

function limited(req, res) {
  const ip = rateLimitKey(req);
  if (writeLimiter.check(ip).blocked) {
    res.status(429).json({ error: "Çok fazla istek. Lütfen birkaç dakika sonra tekrar deneyin." });
    return true;
  }
  writeLimiter.registerFailure(ip);
  return false;
}

jobApplicationsRouter.post("/:id/applications", (req, res) => {
  const actor = resolveActor(req);
  if (!actor) return res.status(401).json({ error: "Başvurmak için giriş yapmanız gerekiyor." });
  if (actor.role !== "owner" && actor.role !== "mechanic") return res.status(403).json({ error: "Bu işlem için yetkiniz yok." });
  if (limited(req, res)) return;

  const job = db.prepare(`SELECT * FROM job_listings WHERE id = ?`).get(req.params.id);
  if (!job) return res.status(404).json({ error: "İlan bulunamadı." });
  /**
   * GERÇEK HATA (tam uygulama denetiminde bulundu) — İŞ BAŞVURUSU ÖZELLİĞİ TAMAMEN ÖLÜYDÜ.
   * ------------------------------------------------------------------------------------------------
   * Bu kontrol `job.status !== "open"` diyordu. Ama iş ilanı sözlüğünde "open" DİYE BİR DURUM YOK:
   *   - veritabanı varsayılanı        → 'active'   (db.js: status TEXT DEFAULT 'active')
   *   - ön yüz ilan oluştururken      → 'active'   (submitJobListing draft)
   *   - tohum verisindeki 3 ilan      → 'active'
   *   - tip tanımı                    → "active" | "closed"
   *   - arayüzdeki aç/kapa düğmesi    → 'active' ↔ 'closed'
   * Yani HER ilan 'active' olarak doğuyor ve bu kontrol HEPSİNİ reddediyordu: sitedeki hiç kimse
   * hiçbir iş ilanına başvuramıyordu. Üstelik hata mesajı YANILTICIYDI — "bu ilan artık başvuru
   * almıyor" diyerek adaya ilanın kapandığını düşündürüyordu, oysa özellik kırıktı.
   *
   * Düzeltmede AÇIK olanları saymak yerine KAPALI olanları sayıyorum. Sebebi: "hangi değerler
   * açıktır" listesi eksik kalırsa sonuç yine sessizce her şeyi reddetmek olur (bu hatanın ta
   * kendisi). Kapalı listesi eksik kalırsa en kötü sonuç kapanmış bir ilana başvuru gelmesi —
   * kıyaslanamaz biçimde daha az zararlı.
   */
  const CLOSED_JOB_STATUSES = new Set(["closed", "filled", "paused", "archived", "cancelled", "removed"]);
  if (job.status && CLOSED_JOB_STATUSES.has(String(job.status).toLowerCase())) {
    return res.status(400).json({ error: "Bu ilan artık başvuru almıyor.", reason: "closed" });
  }
  if (actor.role === "mechanic" && job.mechanicId === actor.id) {
    return res.status(403).json({ error: "Kendi ilanınıza başvuramazsınız." });
  }

  const applicants = JSON.parse(job.applicants || "[]");
  if (applicants.length >= MAX_APPLICANTS) return res.status(429).json({ error: "Bu ilan başvuru sınırına ulaştı." });
  // Aynı kişi aynı ilana iki kez başvuramaz: tamircinin listesinde aynı ad iki kez görünürse
  // hangisinin güncel olduğu belirsizleşir.
  if (applicants.some((a) => a.applicantId === actor.id && (a.applicantType || "owner") === actor.role)) {
    return res.status(409).json({ error: "Bu ilana zaten başvurdunuz.", reason: "duplicate" });
  }

  const str = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");
  const cvUrl = typeof req.body?.cvUrl === "string" && req.body.cvUrl.length <= MAX_CV_LEN ? req.body.cvUrl : null;
  const applicant = {
    id: applicants.reduce((max, a) => Math.max(max, Number(a?.id) || 0), 0) + 1,
    // Kimlik oturumdan: başkasının adına başvuru gönderilemez.
    applicantId: actor.id,
    applicantType: actor.role,
    name: str(req.body?.name, 120).trim(),
    phone: str(req.body?.phone, 32).trim(),
    email: str(req.body?.email, 160).trim(),
    address: str(req.body?.address, 300).trim(),
    message: str(req.body?.message, MAX_MESSAGE_LEN),
    lang: ["tr", "en", "de"].includes(req.body?.lang) ? req.body.lang : "tr",
    cvName: str(req.body?.cvName, 200) || null,
    cvUrl,
    // Durumu SUNUCU koyuyor: aday kendini "kabul edildi" olarak gönderemesin.
    status: "pending",
    date: new Date().toISOString(),
  };
  if (!applicant.name) return res.status(400).json({ error: "Ad soyad zorunludur." });

  const updated = [applicant, ...applicants];
  db.prepare(`UPDATE job_listings SET applicants = ? WHERE id = ?`).run(JSON.stringify(updated), req.params.id);
  const fresh = db.prepare(`SELECT * FROM job_listings WHERE id = ?`).get(req.params.id);
  res.status(201).json({ job: hydrate("job_listings", fresh), applicantId: applicant.id });
});

/** Başvuru durumunu değiştirme — yalnızca ilanı açan tamirci (ya da admin). */
jobApplicationsRouter.patch("/:id/applications/:applicantId", (req, res) => {
  const actor = resolveActor(req);
  if (!actor) return res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." });
  const job = db.prepare(`SELECT * FROM job_listings WHERE id = ?`).get(req.params.id);
  if (!job) return res.status(404).json({ error: "İlan bulunamadı." });
  if (actor.role !== "admin" && !(actor.role === "mechanic" && job.mechanicId === actor.id)) {
    return res.status(403).json({ error: "Bu ilanın başvurularını yönetme yetkiniz yok." });
  }
  const status = req.body?.status;
  if (!VALID_STATUS.has(status)) return res.status(400).json({ error: "Geçersiz başvuru durumu." });

  const applicants = JSON.parse(job.applicants || "[]");
  const target = applicants.find((a) => String(a.id) === String(req.params.applicantId));
  if (!target) return res.status(404).json({ error: "Başvuru bulunamadı." });
  const updated = applicants.map((a) => (a === target ? { ...a, status } : a));
  db.prepare(`UPDATE job_listings SET applicants = ? WHERE id = ?`).run(JSON.stringify(updated), req.params.id);
  const fresh = db.prepare(`SELECT * FROM job_listings WHERE id = ?`).get(req.params.id);
  res.json({ job: hydrate("job_listings", fresh) });
});

export default jobApplicationsRouter;
