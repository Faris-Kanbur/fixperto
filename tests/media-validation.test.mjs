/**
 * MEDYA DOĞRULAMA — BİRİM TESTLERİ.
 * ================================================================================================
 * Neden ayrı bir takım: bazı kuralları uçtan uca test etmek İMKÂNSIZ. Dizi TOPLAM boyut kuralını
 * gerçek istekle sınamak için 12 MB'lık bir gövde göndermek gerekiyor, ama o gövde daha
 * doğrulamaya gelmeden `express.json` 5 MB sınırına takılıp 413 dönüyor. Yani kural doğru ama
 * o yoldan gözlenemiyor. Doğrulayıcı saf bir işlev olduğu için burada doğrudan çağrılıyor.
 *
 * Bu takımın asıl işi "reddediyor mu" değil, ŞU: mevcut geçerli biçimleri reddetmiyor mu.
 * Kullanıcının isteği açıktı — çalışan sistemi bozma. Bir güvenlik kısıtı meşru veriyi
 * reddediyorsa o bir düzeltme değil, yeni bir hatadır.
 */
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const { validateMediaValue, validateMediaBody, bodyCarriesMedia, MEDIA_LIMITS } =
  await import(join(ROOT, "backend", "utils", "mediaValidation.js"));

let passed = 0;
const failures = [];
const ok = (v, name) => { if (v) passed++; else failures.push(name); };
const accepts = (value, kind, name) => ok(validateMediaValue(value, kind) === null, `KABUL: ${name}`);
const rejects = (value, kind, name) => ok(validateMediaValue(value, kind) !== null, `RET: ${name}`);

const img = (mime, kb) => `data:${mime};base64,` + "A".repeat(Math.round(kb * 1024 * 4 / 3));

// ================================================================ MEVCUT BİÇİMLER BOZULMADI
/**
 * Bu alanlar bugün ÜÇ biçim tutuyor ve üçü de meşru. Tohum verisinde emoji ve https adresi var,
 * kullanıcı yüklemelerinde data URI. Hiçbiri reddedilmemeli.
 */
accepts("🔧", "avatar", "emoji (mechanics.img — tohum verisi bu biçimde)");
accepts("👩‍🦰", "avatar", "birleşik emoji (yorum avatarları)");
accepts("https://loremflickr.com/800/600/car?lock=9", "image", "https adresi (tohum kapak fotoğrafı)");
accepts("", "image", "boş metin (fotoğrafı kaldır)");
accepts(null, "image", "null");
accepts(undefined, "image", "undefined");
accepts(img("image/jpeg", 300), "image", "300 KB JPEG (istemcinin ürettiği tipik boyut)");
accepts(img("image/png", 500), "image", "500 KB PNG");
accepts(img("image/webp", 200), "image", "WebP (gelecekte kullanılacak)");
accepts(img("image/gif", 100), "image", "GIF");
accepts(img("image/avif", 100), "image", "AVIF");
accepts(img("application/pdf", 1000), "document", "PDF (CV yüklemesi bu biçimde)");
accepts(img("image/jpeg", 900), "avatar", "900 KB profil fotoğrafı (avatar tavanı 1 MB)");

// ================================================================ ZARARLI OLAN REDDEDİLİYOR
/**
 * SVG script taşıyabiliyor. `<img src>` içinde çalışmaz — ama veriyi DEPOLAMAYA almamak daha
 * sağlam: yarın "yeni sekmede aç" gibi bir gösterim yolu eklendiği an açık oluşur. Kabul etmemek,
 * göstermemekten daha güçlü bir savunmadır.
 */
rejects("data:image/svg+xml;base64,PHN2Zy8+", "image", "SVG (script taşıyabilir)");
rejects("data:image/svg+xml;base64,PHN2Zy8+", "document", "SVG belge alanında da reddediliyor");
rejects("data:text/html;base64,PHNjcmlwdD4=", "image", "text/html");
rejects("data:application/javascript;base64,YWxlcnQ=", "image", "javascript");
rejects("data:application/pdf;base64,JVBERg==", "image", "PDF GÖRSEL alanında reddediliyor (tür ayrımı korunuyor)");
rejects("data:image/jpeg,notbase64", "image", "base64 olmayan data URI");
rejects(img("image/jpeg", 3000), "image", "3 MB görsel (tavan 2 MB)");
rejects(img("image/png", 1500), "avatar", "1,5 MB profil fotoğrafı (avatar tavanı 1 MB)");
rejects(img("application/pdf", 5000), "document", "5 MB belge (tavan 4 MB)");
rejects({ url: "x" }, "image", "nesne (metin değil)");
rejects("https://" + "a".repeat(3000), "image", "3000 karakterlik adres");

// ================================================================ DİZİ KURALLARI
/**
 * Bu kuralı uçtan uca test etmek imkânsız: 12 MB'lık bir gövde daha doğrulamaya gelmeden
 * express.json'ın 5 MB sınırına takılıp 413 dönüyor. Kural doğru ama o yoldan gözlenemiyor.
 */
const listing = (photos) => ({ photos });
ok(validateMediaBody("listings", listing(Array(6).fill(img("image/jpeg", 250)))) === null,
  "KABUL: 6 × 250 KB galeri (gerçekçi ilan)");
ok(validateMediaBody("listings", listing(Array(15).fill(img("image/jpeg", 300)))) === null,
  "KABUL: 15 × 300 KB = 4,5 MB (arayüzün izin verdiği en fazla galeri)");
ok(validateMediaBody("listings", listing(Array(25).fill(img("image/jpeg", 50)))) !== null,
  "RET: 25 öğe (üst sınır 20)");
ok(validateMediaBody("listings", listing(Array(10).fill(img("image/jpeg", 1500)))) !== null,
  "RET: 10 × 1,5 MB = 15 MB TOPLAM (her biri tavan altında ama toplamı değil)");
ok(validateMediaBody("listings", listing([img("image/svg+xml", 10)])) !== null, "RET: dizide SVG");
// Dizi JSON metni olarak da gelebiliyor (dehydrate sonrası).
ok(validateMediaBody("listings", { photos: JSON.stringify([img("image/svg+xml", 10)]) }) !== null,
  "RET: JSON metni hâlindeki dizide de SVG yakalanıyor");
// Nesne öğeleri (ör. { url }) de denetleniyor.
ok(validateMediaBody("mechanics", { verificationDocs: [{ url: "data:image/svg+xml;base64,PHN2Zy8+" }] }) !== null,
  "RET: nesne öğesinin içindeki SVG");

// ================================================================ KISMİ GÜNCELLEME BOZULMUYOR
/**
 * PATCH gövdesinde medya alanı YOKSA hiç bakılmamalı. Aksi halde "adını değiştir" isteği,
 * kayıtta duran eski bir değer yüzünden reddedilirdi — yani düzeltme, çalışan bir akışı bozardı.
 */
ok(validateMediaBody("mechanics", { name: "Yeni Ad" }) === null, "KABUL: medya alanı olmayan PATCH");
ok(validateMediaBody("mechanics", {}) === null, "KABUL: boş gövde");
ok(validateMediaBody("vehicles", { plate: "34 ABC 34" }) === null, "KABUL: medya alanı olmayan tablo");
ok(validateMediaBody("bilinmeyen_tablo", { photo: "data:image/svg+xml;base64,x" }) === null,
  "KABUL: listede olmayan tablo denetlenmiyor (yeni tablo eklenince bilinçli karar gerekiyor)");

// ================================================================ HIZ SINIRI TETİKLEME
/** Sınır YALNIZCA gömülü görsel taşıyan yazmalara uygulanmalı; metin düzenlemesi etkilenmemeli. */
ok(bodyCarriesMedia("mechanics", { coverPhoto: img("image/jpeg", 100) }) === true, "data URI hız sınırını tetikliyor");
ok(bodyCarriesMedia("mechanics", { coverPhoto: "https://example.com/a.jpg" }) === false, "https adresi tetiklemiyor");
ok(bodyCarriesMedia("mechanics", { name: "Ad" }) === false, "metin düzenlemesi tetiklemiyor");
ok(bodyCarriesMedia("listings", { photos: [img("image/jpeg", 50)] }) === true, "dizideki data URI tetikliyor");

// ================================================================ TAVANLAR MAKUL MU
/**
 * Sayıların kendisi de bir karar. Tavan meşru kullanımın altına inerse özellik bozulur; çok
 * yükseğe çıkarsa koruma anlamsızlaşır. İstemci 1600px/q0.78 ile tipik olarak 200-500 KB üretiyor.
 */
ok(MEDIA_LIMITS.single >= 4 * 500 * 1024, "tek görsel tavanı, tipik yüklemenin en az 4 katı");
ok(MEDIA_LIMITS.avatar < MEDIA_LIMITS.single, "profil tavanı daha dar (ekranda 120px gösteriliyor)");
ok(MEDIA_LIMITS.arrayTotal >= 15 * 500 * 1024, "galeri toplamı, 15 gerçekçi fotoğrafı kaldırıyor");
ok(MEDIA_LIMITS.arrayCount >= 15, "öğe sınırı, arayüzün izin verdiği 15 galeri fotoğrafını kaldırıyor");

if (failures.length === 0) {
  console.log(`OK medya doğrulama (${passed})`);
  process.exit(0);
}
console.log(`BAŞARISIZ medya doğrulama — ${failures.length}/${passed + failures.length}`);
for (const f of failures) console.log("  ✗ " + f);
process.exit(1);
