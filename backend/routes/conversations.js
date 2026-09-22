import { Router } from "express";
import { db } from "../db/db.js";
import { hydrate, hydrateAll, dehydrate } from "../db/hydrate.js";
import { resolveActor } from "../utils/auth.js";

// GÜVENLİK DÜZELTMESİ (sohbet akışı denetiminde bulundu): conversations daha önce generic
// makeCrudRouter kullanıyordu — bu, `messages` alanının PATCH ile TAMAMEN SERBEST bir JSON dizisi
// olarak yazılabildiği anlamına geliyordu: hiçbir doğrulama yoktu. Somut riskler:
// (1) Mesaj sahteciliği — `sender` alanı "owner"/"mechanic" dışında herhangi bir değer olabilirdi
//     ve içerik/boyut hiç sınırlanmadığı için karşı tarafın hiç söylemediği sözler bir sohbete
//     enjekte edilebilirdi (backend'de gerçek bir oturum olmadığı için "bu mesajı gerçekten kim
//     yazdı" zaten bilinmiyor, ama en azından mesaj ŞEKLİNİN geçerli olması burada garanti ediliyor).
// (2) `mechanicId` de genel PATCH'in bir parçası olduğu için bir sohbeti başka bir tamirciye ait
//     gösterecek şekilde yeniden atamak mümkündü (bkz. quotes.js'teki aynı sınıf düzeltme).
// (3) Boyut sınırı yoktu (5mb'lık genel body limitine kadar) — tek bir PATCH ile devasa bir
//     `messages` dizisi veya çok büyük bir `image` data URI'si yazılabilirdi.
// Bu router, generic CRUD'un GET/DELETE davranışını aynen korurken POST/PATCH'e bu doğrulamaları
// ekliyor. GÜNCELLEME (gerçek oturum sistemi): artık backend/utils/auth.js üzerinden gerçek bir
// oturum katmanı var — aşağıdaki her uç nokta artık "bu isteği gerçekten bu sohbetin bir tarafı mı
// gönderdi" sorusunu da (mecanicId eşleşen tamirci ya da giriş yapmış owner/admin) cevaplıyor,
// veri şeklinin geçerliliğinin yanı sıra.
const MAX_MESSAGE_TEXT_LEN = 4000;
/**
 * SOHBET BOYUT TAVANLARI — performans denetiminde bulundu.
 * ------------------------------------------------------------------------------------------------
 * Eski değerler: görsel başına 6.000.000 karakter (~4,5 MB) × sohbet başına 2000 mesaj.
 * Çarpımı hesaplamak yeterliydi: TEK BİR SOHBET SATIRI YASAL OLARAK 12 GB'A KADAR BÜYÜYEBİLİYORDU.
 * Ve mesajlar tek bir JSON sütununda tutulduğu için her yeni mesaj bu satırı BAŞTAN OKUYUP BAŞTAN
 * YAZIYOR: 100 MB'lık bir sohbette "merhaba" yazmak 100 MB okuma + 100 MB yazma demek.
 *
 * Yeni sınırlar birbirini tamamlıyor:
 *   - Görsel başına 2 MB: istemci zaten 1600px/q0.78'e indiriyor (tipik 200-500 KB), yani meşru
 *     yüklemenin ~4 katı. Sıkıştırmayı atlayan istemciyi bile kabul ediyor.
 *   - Mesaj SAYISI 2000: değişmedi, uzun yazışmalar bozulmasın.
 *   - Sohbet TOPLAM BOYUTU 40 MB: asıl koruma bu. Sayı sınırı tek başına yetmiyordu çünkü sorun
 *     mesaj sayısı değil, mesajların BOYUTU. 40 MB, yüzlerce fotoğraflı bir yazışmayı bile kaldırır
 *     ama satırın gigabaytlara çıkmasını engeller.
 */
const MAX_MESSAGE_IMAGE_LEN = 2_700_000;       // ~2 MB ikili karşılık (base64 %33 şişirir)
const MAX_MESSAGES_PER_CONVERSATION = 2000;
const MAX_CONVERSATION_TOTAL_LEN = 40 * 1024 * 1024;
const VALID_SENDERS = new Set(["owner", "mechanic"]);

function validateMessages(messages) {
  if (!Array.isArray(messages)) return "messages bir dizi olmalıdır.";
  if (messages.length > MAX_MESSAGES_PER_CONVERSATION) return `Bir sohbette en fazla ${MAX_MESSAGES_PER_CONVERSATION} mesaj olabilir.`;
  for (const m of messages) {
    if (!m || typeof m !== "object") return "Geçersiz mesaj formatı.";
    if (!VALID_SENDERS.has(m.sender)) return "Mesaj göndereni 'owner' veya 'mechanic' olmalıdır.";
    if (m.text !== undefined && m.text !== null && typeof m.text !== "string") return "Mesaj metni bir metin (string) olmalıdır.";
    if (typeof m.text === "string" && m.text.length > MAX_MESSAGE_TEXT_LEN) return `Mesaj metni en fazla ${MAX_MESSAGE_TEXT_LEN} karakter olabilir.`;
    if (m.image !== undefined && m.image !== null) {
      if (typeof m.image !== "string") return "Mesaj görseli bir metin (data URI) olmalıdır.";
      if (m.image.length > MAX_MESSAGE_IMAGE_LEN) return "Mesaj görseli çok büyük.";
    }
    if (!m.text && !m.image) return "Bir mesajın metni veya görseli olmalıdır.";
    /**
     * SVG REDDİ: `data:image/svg+xml` script taşıyabiliyor. Sohbet görselleri `<img src>` ile
     * basıldığı için orada çalışmaz, ama veriyi DEPOLAMAYA almamak daha sağlam — yarın yeni bir
     * gösterim yolu (ör. "yeni sekmede aç") eklendiği an açık oluşurdu.
     */
    if (typeof m.image === "string" && m.image.startsWith("data:") && !/^data:image\/(jpeg|jpg|png|webp|gif|avif);base64,/i.test(m.image)) {
      return "Yalnızca JPEG, PNG, WebP, GIF ya da AVIF görsel gönderebilirsiniz.";
    }
  }
  /**
   * TOPLAM BOYUT. Mesaj sayısı sınırı tek başına yetmiyor: 2000 mesaj × büyük görsel = gigabaytlar.
   * Ölçülen değer üzerinden karar verildi (bkz. PERFORMANS-RAPORU.md).
   */
  const totalLen = messages.reduce((sum, m) => sum + (m?.image?.length || 0) + (m?.text?.length || 0), 0);
  if (totalLen > MAX_CONVERSATION_TOTAL_LEN) {
    return "Bu sohbet boyut sınırına ulaştı. Yeni görsel göndermek için eski mesajları silin.";
  }
  return null;
}

const IMMUTABLE_CONVERSATION_FIELDS = ["mechanicId", "ownerId", "peerOwnerId"];

// GÜVENLİK DÜZELTMESİ (tam site denetiminde bulundu): burada eskiden "giriş yapmış HERHANGİ bir
// owner tüm sohbetleri görebilir" kuralı vardı — çünkü conversations tablosunda araç sahibi tarafını
// gösteren bir sütun yoktu ve uygulama tek bir "aktif" araç sahibi varsayımıyla tasarlanmıştı. Gerçek
// kayıt/giriş sistemi eklendikten sonra bu varsayım geçersiz: siteye kaydolan HERKES owner olabildiği
// için, kaydolan herhangi biri diğer tüm araç sahiplerinin tamircilerle yaptığı özel yazışmaları
// okuyabiliyor, hatta değiştirip silebiliyordu. Artık conversations.ownerId sütunu var (bkz.
// backend/db/db.js ensureColumn + backfill) ve sohbet yalnızca İKİ GERÇEK TARAFINA (o araç sahibi ve
// o tamirci) ve admin'e görünüyor.
function convoVisibleTo(row, actor) {
  if (!actor) return false;
  if (actor.role === "admin") return true;
  // owner-owner sohbette (bkz. peerOwnerId) satırın İKİ tarafı da owner rolünde — kişi ya
  // sohbeti başlatan (ownerId) ya da karşı taraf (peerOwnerId) olabilir.
  if (actor.role === "owner") return row.ownerId === actor.id || row.peerOwnerId === actor.id;
  if (actor.role === "mechanic") return row.mechanicId === actor.id;
  return false;
}

export const conversationsRouter = Router();

/**
 * SOHBET LİSTESİ — filtre JS'ten SQL'e taşındı (Faz 2, performans).
 * ------------------------------------------------------------------------------------------------
 * ÖNCE: `SELECT * FROM conversations` ile TÜM sohbetler okunuyor, sonra JS'te `convoVisibleTo`
 * ile süzülüyordu. Güvenlik açısından doğruydu (kimse başkasının sohbetini GÖRMÜYORDU) ama
 * maliyeti şuydu: mesajlar — gömülü base64 fotoğraflarıyla birlikte — conversations satırının
 * İÇİNDE duruyor. Yani "mesajlarım" ekranını açan her kullanıcı, veritabanındaki HERKESİN tüm
 * fotoğraflarını diskten okutup belleğe alıyor, sonra bunların %99'unu atıyordu. 1.000 sohbet ×
 * ortalama 2 MB = her istekte 2 GB okuma. Buradaki indeks (idx_conversations_owner/mechanic) tek
 * başına işe yaramazdı, çünkü sorguda WHERE cümlesi YOKTU — indeks eklemek ama sorguyu olduğu
 * gibi bırakmak tam olarak "körlemesine indeks eklemek" olurdu.
 *
 * SONRA: aynı kural SQL'de. Ve bu bir DAVRANIŞ DEĞİŞİKLİĞİ DEĞİL — üç rolün sonucu birebir aynı:
 *   admin    → convoVisibleTo `true` döndürüyordu       → WHERE yok (hepsi)
 *   owner    → `row.ownerId === actor.id`               → `WHERE ownerId = ?`
 *   mechanic → `row.mechanicId === actor.id`            → `WHERE mechanicId = ?`
 * NULL davranışı da aynı: JS'te `null === 5` false, SQL'de `NULL = 5` eşleşmiyor. Sahipsiz
 * (ownerId NULL) sohbetler önce de görünmüyordu, şimdi de görünmüyor.
 * `convoVisibleTo` KALDIRILMADI: tekil GET/PATCH yolları hâlâ onu kullanıyor, tek doğruluk
 * kaynağı olarak orada duruyor (bkz. tests — iki yolun aynı sonucu verdiği doğrulanıyor).
 */
conversationsRouter.get("/", (req, res) => {
  const actor = resolveActor(req);
  if (!actor) return res.status(401).json({ error: "Bu veriye erişmek için giriş yapmanız gerekiyor." });
  const rows = actor.role === "admin"
    ? db.prepare(`SELECT * FROM conversations`).all()
    : actor.role === "owner"
      // owner-owner sohbette actor.id ya ownerId ya da peerOwnerId sütununda olabilir (bkz.
      // convoVisibleTo'daki aynı kural).
      ? db.prepare(`SELECT * FROM conversations WHERE ownerId = ? OR peerOwnerId = ?`).all(actor.id, actor.id)
      : actor.role === "mechanic"
        ? db.prepare(`SELECT * FROM conversations WHERE mechanicId = ?`).all(actor.id)
        // Bilinmeyen rol: convoVisibleTo'nun son satırı da `return false` idi. Yeni bir rol
        // eklenirse sohbetler sessizce SIZMAK yerine sessizce GÖRÜNMEZ olsun — güvenli taraf.
        : [];
  res.json(hydrateAll("conversations", rows));
});

conversationsRouter.get("/:id", (req, res) => {
  const row = db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: "conversations not found" });
  const actor = resolveActor(req);
  if (!convoVisibleTo(row, actor)) {
    return res.status(actor ? 403 : 401).json(actor ? { error: "Bu kayda erişim yetkiniz yok." } : { error: "Bu veriye erişmek için giriş yapmanız gerekiyor." });
  }
  res.json(hydrate("conversations", row));
});

conversationsRouter.post("/", (req, res) => {
  const actor = resolveActor(req);
  if (!actor) return res.status(401).json({ error: "Bu işlem için giriş yapmanız gerekiyor." });
  const body = dehydrate("conversations", req.body);
  // İKİ ARAÇ SAHİBİ ARASI SOHBET (ör. bir "Sahibinden" ilanı hakkında) — bkz. peerOwnerId şema
  // yorumu. Sadece bir owner bu türde sohbet başlatabilir; mechanicId bu satırlarda hiç yok.
  const isOwnerToOwner = body.peerOwnerId != null;
  if (isOwnerToOwner) {
    if (actor.role !== "owner") return res.status(403).json({ error: "Bu sohbet türünü yalnızca araç sahipleri başlatabilir." });
    if (Number(body.peerOwnerId) === actor.id) return res.status(400).json({ error: "Kendinizle sohbet başlatamazsınız." });
  } else if (!body.mechanicId) {
    return res.status(400).json({ error: "mechanicId zorunludur." });
  }
  // Sohbetin tarafları İSTEMCİDEN DEĞİL oturumdan yazılıyor: bir tamirci sadece kendi
  // mechanicId'siyle sohbet açabilir, bir araç sahibi de sohbeti ancak kendi adına açabilir
  // (başkasının adına sohbet oluşturup sonra o kişinin yazışmasıymış gibi gösteremez).
  if (!isOwnerToOwner && actor.role === "mechanic") {
    body.mechanicId = actor.id;
    // Tamirci bir araç sahibiyle sohbet başlatıyorsa (ör. bir "sahibinden" ilanı hakkında) karşı
    // tarafın kimliğini gövdede belirtir — ama bu değer doğrulanır: gerçekten var olan bir owner
    // kaydı olmalı, aksi halde sohbet sahipsiz kalır ve hiçbir araç sahibine görünmez.
    if (body.ownerId != null) {
      const target = db.prepare(`SELECT id FROM owners WHERE id = ?`).get(body.ownerId);
      if (!target) return res.status(400).json({ error: "Geçersiz ownerId." });
    }
  }
  if (actor.role === "owner") body.ownerId = actor.id;
  /**
   * KARŞI TARAFIN AD/GÖRSEL KOPYASI İSTEMCİDEN ALINMIYOR (ilişki denetiminde bulundu).
   * ---------------------------------------------------------------------------------------------
   * `mechanicName`, `mechanicImg` ve `mechanicLang` sohbet satırında tutulan KOPYALAR (liste
   * ekranını hızlandırmak için) — owner-owner sohbette de KARŞI ARAÇ SAHİBİNİN adı/fotoğrafı için
   * AYNI üç sütun yeniden kullanılıyor (yeni sütun eklemekten kaçınmak için; mechanicId NULL
   * olduğunda bu üç alanın "karşı taraf" anlamına geldiği burada ve şema yorumunda açıklanıyor).
   * Bu üç alan gövdeden olduğu gibi kaydediliyordu. Ölçüldü: `mechanicName: "SAHTE AD"` gönderildi
   * ve aynen kaydedildi.
   *
   * Tek başına ciddi değil ama gerçek bir tutarsızlık: sohbet listesinde karşı tarafın adı, gerçek
   * kayıttaki addan farklı görünebiliyor — yani kullanıcı KİMİNLE yazıştığını yanlış bilebilir
   * (birini başkası gibi göstermek, oltalama için yeterli bir zemin). Aynı sınıf hata bu denetimde
   * randevularda da vardı (mechanicName kopyası anonimleşmiyordu).
   * Kural: kopya alanın DEĞERİ her zaman kaynak satırdan okunur.
   */
  if (isOwnerToOwner) {
    const peerRow = db.prepare(`SELECT name, photo, lang FROM owners WHERE id = ?`).get(body.peerOwnerId);
    if (!peerRow) return res.status(400).json({ error: "Geçersiz peerOwnerId." });
    body.mechanicId = null;
    body.mechanicName = peerRow.name;
    body.mechanicImg = peerRow.photo || "";
    body.mechanicLang = peerRow.lang || "tr";
  } else {
    const mechRow = db.prepare(`SELECT name, img, lang FROM mechanics WHERE id = ?`).get(body.mechanicId);
    if (!mechRow) return res.status(400).json({ error: "Geçersiz mechanicId." });
    body.mechanicName = mechRow.name;
    body.mechanicImg = mechRow.img || "";
    body.mechanicLang = mechRow.lang || "tr";
  }
  if ("messages" in req.body) {
    const err = validateMessages(req.body.messages);
    if (err) return res.status(400).json({ error: err });
    // Sohbet AÇILIRKEN de gönderen damgalanıyor: aksi halde ilk mesajı karşı tarafın ağzından
    // yazmak, POST /:id/messages'taki kontrolü baştan atlatmanın kolay yolu olurdu.
    if (actor.role === "owner" || actor.role === "mechanic") {
      const langRow = actor.role === "owner"
        ? db.prepare(`SELECT lang FROM owners WHERE id = ?`).get(actor.id)
        : db.prepare(`SELECT lang FROM mechanics WHERE id = ?`).get(actor.id);
      const stampedInitial = (req.body.messages || []).map((m, i) => ({
        // senderId: owner-owner sohbette İKİ TARAF da role="owner" damgalanır, yani "bu mesaj
        // benim mi" sorusu artık role ile ayırt edilemez — bkz. POST /:id/messages'taki aynı not.
        ...m, id: i + 1, sender: actor.role, senderId: actor.id, lang: langRow?.lang || "tr",
      }));
      body.messages = JSON.stringify(stampedInitial);
    }
  }
  const cols = Object.keys(body);
  const stmt = db.prepare(`INSERT INTO conversations (${cols.join(",")}) VALUES (${cols.map((c) => `@${c}`).join(",")})`);
  const info = stmt.run(body);
  const created = db.prepare(`SELECT * FROM conversations WHERE rowid = ?`).get(info.lastInsertRowid);
  res.status(201).json(hydrate("conversations", created));
});

conversationsRouter.patch("/:id", (req, res) => {
  const existing = db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: "conversations not found" });
  const actor = resolveActor(req);
  if (!convoVisibleTo(existing, actor)) {
    return res.status(actor ? 403 : 401).json(actor ? { error: "Bu sohbeti değiştirme yetkiniz yok." } : { error: "Bu işlem için giriş yapmanız gerekiyor." });
  }
  // GÜVENLİK AÇIĞI (bu denetimde bulundu — MESAJ SAHTECİLİĞİ ve KAYIP GÜNCELLEME):
  // PATCH, `messages` dizisinin TAMAMINI istemciden alıyordu. İki somut sonucu vardı:
  //   1) Sohbetin bir tarafı, KARŞI TARAFIN AĞZINDAN mesaj yazabiliyordu — dizideki her elemanın
  //      `sender` alanı serbestti. Bir araç sahibi "tamirci: tamiri ücretsiz yapacağım" diye bir
  //      satır ekleyip ekran görüntüsünü destek talebine delil olarak koyabilirdi.
  //   2) Dizi topluca ezildiği için, karşı taraf sen yazarken bir mesaj göndermişse onun mesajı
  //      SESSİZCE SİLİNİYORDU (son yazan kazanır).
  // Mesaj ekleme artık ayrı bir uç noktada (POST /:id/messages): gönderen kimliği oturumdan
  // damgalanıyor ve ekleme sunucuda mevcut dizinin SONUNA yapılıyor. Bu PATCH ise artık yalnızca
  // admin'in mesaj dizisine dokunmasına izin veriyor (moderasyon/silme).
  if ("messages" in req.body) {
    if (actor.role !== "admin") {
      return res.status(403).json({ error: "Mesajlar yalnızca mesaj gönderme uç noktasıyla eklenebilir." });
    }
    const err = validateMessages(req.body.messages);
    if (err) return res.status(400).json({ error: err });
  }
  const body = dehydrate("conversations", req.body);
  for (const f of IMMUTABLE_CONVERSATION_FIELDS) delete body[f];
  const cols = Object.keys(body).filter((c) => c !== "id");
  if (cols.length === 0) return res.json(hydrate("conversations", existing));
  const stmt = db.prepare(`UPDATE conversations SET ${cols.map((c) => `${c} = @${c}`).join(",")} WHERE id = @__id`);
  stmt.run({ ...body, __id: req.params.id });
  const updated = db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(req.params.id);
  res.json(hydrate("conversations", updated));
});

/**
 * MESAJ GÖNDERME — tek doğru yol.
 * ---------------------------------------------------------------------------------------------
 * Gövde: { messages: [{ text?, image?, isRejectionNotice? }], clearContextNote?: boolean }
 * En fazla 3 mesaj (ör. bağlam notu + asıl mesaj). Her mesajın `sender` ve `lang` alanı
 * İSTEMCİDEN DEĞİL oturumdan damgalanır — kimse karşı tarafın ağzından yazamaz. Ekleme sunucuda
 * okunan GÜNCEL diziye yapılır, böylece karşı tarafın bu sırada gönderdiği mesaj kaybolmaz.
 * Yanıt, sohbetin sunucudaki son hâlidir; istemci kendi yerel kopyasını buna göre tazeler.
 */
const MAX_APPEND_PER_CALL = 3;

conversationsRouter.post("/:id/messages", (req, res) => {
  const row = db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: "conversations not found" });
  const actor = resolveActor(req);
  if (!convoVisibleTo(row, actor)) {
    return res.status(actor ? 403 : 401).json(actor ? { error: "Bu sohbete mesaj gönderme yetkiniz yok." } : { error: "Bu işlem için giriş yapmanız gerekiyor." });
  }
  // Admin sohbetin bir TARAFI değildir; onun adına mesaj yazmak "sender" alanını anlamsız kılardı.
  if (actor.role !== "owner" && actor.role !== "mechanic") {
    return res.status(403).json({ error: "Bu sohbete yalnızca tarafları mesaj gönderebilir." });
  }
  const incoming = Array.isArray(req.body?.messages) ? req.body.messages : [req.body?.message].filter(Boolean);
  if (incoming.length === 0) return res.status(400).json({ error: "Gönderilecek mesaj yok." });
  if (incoming.length > MAX_APPEND_PER_CALL) return res.status(400).json({ error: "Tek seferde en fazla 3 mesaj gönderilebilir." });

  const langRow = actor.role === "owner"
    ? db.prepare(`SELECT lang FROM owners WHERE id = ?`).get(actor.id)
    : db.prepare(`SELECT lang FROM mechanics WHERE id = ?`).get(actor.id);
  const senderLang = langRow?.lang || "tr";

  const existing = JSON.parse(row.messages || "[]");
  // Mesaj kimliği sunucuda üretiliyor: iki taraf aynı anda yazdığında istemcilerin ürettiği
  // sayaçlar çakışabiliyordu (aynı id = React listesinde aynı key = yanlış eşleşen baloncuk).
  const baseId = existing.reduce((max, m) => Math.max(max, Number(m?.id) || 0), 0);

  const stamped = incoming.map((m, i) => ({
    id: baseId + i + 1,
    sender: actor.role,          // <- oturumdan, istemciden DEĞİL
    // senderId: owner-owner sohbette (bkz. peerOwnerId) satırın İKİ TARAFI da role="owner" olarak
    // damgalanıyor, yani "bu mesaj benim mi" artık role'den ayırt edilemiyor — frontend gerçek
    // kimliği (actor.id) bu alandan okuyor. Owner-tamirci sohbette rol tek başına yeterli olduğu
    // için mevcut davranış değişmiyor, bu alan sadece ek bir kesinlik sağlıyor.
    senderId: actor.id,
    lang: senderLang,            // <- gönderenin kayıtlı dili; çeviri bunu kullanıyor
    text: typeof m?.text === "string" ? m.text : undefined,
    image: typeof m?.image === "string" ? m.image : undefined,
    ...(m?.isRejectionNotice ? { isRejectionNotice: true } : {}),
  }));
  const merged = [...existing, ...stamped];
  const err = validateMessages(merged);
  if (err) return res.status(400).json({ error: err });

  const patch = req.body?.clearContextNote
    ? db.prepare(`UPDATE conversations SET messages = ?, pendingContextNote = NULL WHERE id = ?`)
    : db.prepare(`UPDATE conversations SET messages = ? WHERE id = ?`);
  patch.run(JSON.stringify(merged), req.params.id);
  const updated = db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(req.params.id);
  res.json(hydrate("conversations", updated));
});

conversationsRouter.delete("/:id", (req, res) => {
  const existing = db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: "conversations not found" });
  const actor = resolveActor(req);
  if (!convoVisibleTo(existing, actor)) {
    return res.status(actor ? 403 : 401).json(actor ? { error: "Bu sohbeti silme yetkiniz yok." } : { error: "Bu işlem için giriş yapmanız gerekiyor." });
  }
  const info = db.prepare(`DELETE FROM conversations WHERE id = ?`).run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "conversations not found" });
  res.status(204).end();
});
