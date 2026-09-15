/**
 * GÖRSEL YÜKLEME ÖZNİTELİKLERİ — lazy / eager / decoding.
 * ================================================================================================
 * ÖNCE DÜRÜST BİR TESPİT — RAPORDAKİ ÖNERİ KISMEN YANLIŞTI:
 *
 * Performans raporu "kalan 22 <img> etiketine loading=lazy + width/height ekle" diyordu.
 * Uygulamaya geçerken üç şey ortaya çıktı:
 *
 * 1) `width`/`height` ÖZNİTELİKLERİ BU PROJEDE GEREKSİZ. Onların işi düzen kaymasını (CLS)
 *    önlemek: tarayıcı görselin yerini o gelmeden ayırabilsin. Ama bu projedeki 35 etiketin
 *    34'ünde kutu ZATEN Tailwind ile sabit (`w-full h-full object-cover`, `w-12 h-12`,
 *    `w-full h-56 md:h-72`). Kutu sabitse öznitelik eklemek hiçbir şey değiştirmez; CSS ile
 *    çelişirse zarar verir. Kalan bir tanesinde (sohbet balonu) kutuyu üst öğe sınırlıyor.
 *    Yani buradaki doğru iş 35 etikete öznitelik eklemek DEĞİL, gerekmediğini ölçüp yazmaktı.
 *
 * 2) `loading="lazy"` BUGÜN NEREDEYSE HİÇBİR ŞEY KAZANDIRMIYOR. Sebebi mimari: fotoğraflar
 *    `data:` URI olarak JSON yanıtının İÇİNDE geliyor. Sayfa yüklendiğinde baytlar ZATEN gelmiş
 *    durumda; ertelenecek bir ağ isteği yok. Lazy yükleme ancak görsellerin kendi adresi
 *    olduğunda (Faz 4 — medya uçları) işe yarar. Şimdi tamamlanmasının sebebi o gün hazır
 *    olması; bugün için bir hız iddiası DEĞİL.
 *
 * 3) BUGÜN GERÇEKTEN İŞE YARAYAN ŞEY `decoding="async"`. Base64 gömülü bir fotoğrafın çözülmesi
 *    (decode) ana iş parçacığını meşgul ediyor; bu, veri zaten bellekte olduğu için lazy'nin
 *    çözemediği bir maliyet. `decoding="async"` çözmeyi ana iş parçacığından çıkarıyor. Bu yüzden
 *    35 etiketin HEPSİNE bu eklendi — 9'unda lazy vardı ama decoding yoktu, yani daha önce
 *    "lazy ekledik" denilen yerlerde bugün işe yarayan öznitelik eksikti.
 *
 * Bu takım kararları kayıt altına alıyor: hangi görsel lazy OLMALI, hangisi kesinlikle OLMAMALI.
 * İkinci kısım daha önemli — ilk ekran görselini lazy yapmak ölçülebilir bir GERİLEME olurdu.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "frontend", "src");

let passed = 0;
const failures = [];
const ok = (v, name) => { if (v) passed++; else failures.push(name); };

/**
 * <img ... > ETİKETİNİ DOĞRU AYIKLA.
 * İlk hâlde `/<img[^>]*>/` kullanıyordum ve YANLIŞTI: JSX'te `onError={() => setBroken(true)}`
 * gibi bir öznitelik içindeki `=>` işaretinin `>`'i etiketi erken bitiriyor, dolayısıyla
 * className hiç görünmüyordu. Sonuç: test üç görseli "kutusu serbest" diye yanlış işaretledi.
 * Doğrusu süslü parantez derinliğini saymak — `>` yalnızca derinlik 0'da etiketi bitirir.
 * (Kendi test aracımın hatası, uygulamanın değil; ama fark etmesem uygulamayı "düzeltmeye"
 * kalkardım.)
 */
function imgTags(text) {
  const out = [];
  const re = /<img\b/g;
  let m;
  while ((m = re.exec(text))) {
    let i = re.lastIndex, depth = 0;
    while (i < text.length) {
      const c = text[i];
      if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth === 0) break;
      i++;
    }
    out.push({ tag: text.slice(m.index, i + 1), line: text.slice(0, m.index).split("\n").length });
  }
  return out;
}

/** frontend/src altındaki TÜM .tsx dosyaları — yeni bir dosya eklenince denetimden kaçmasın. */
function allTsx(dir = SRC, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) allTsx(p, acc);
    else if (entry.name.endsWith(".tsx")) acc.push(p);
  }
  return acc;
}

const all = [];
for (const file of allTsx()) {
  const text = readFileSync(file, "utf8");
  const rel = file.slice(SRC.length + 1);
  for (const t of imgTags(text)) all.push({ ...t, file: rel });
}
ok(all.length >= 30, `taranan <img> etiketi sayısı makul (${all.length})`);
// Ayıklayıcının çalıştığını kanıtla: className görünmeyen etiket kalmamalı (eski hatanın belirtisi).
const noClass = all.filter((t) => !/className=/.test(t.tag));
ok(noClass.length === 0,
  `her etikette className görünüyor — ayıklayıcı etiketi erken kesmiyor (görünmeyen: ${noClass.map((t) => `${t.file}:${t.line}`).join(", ")})`);

const cls = (tag) => (tag.match(/className="([^"]*)"/) || [])[1] || (/className=\{/.test(tag) ? "<dinamik>" : "");
const lazy = (t) => /loading="lazy"/.test(t.tag);
/**
 * ETİKETİ İÇERİĞİNDEN BUL — SATIR NUMARASINDAN DEĞİL.
 * İlk hâlde her etiket `dosya:satır` ile aranıyordu ve BU KIRILGANDI: Faz 6'da AppShell'in
 * başına birkaç satır import eklendi, bütün numaralar kaydı ve testin 10 kontrolü birden
 * kırmızı yandı — oysa hiçbir görsel değişmemişti. Böyle bir test kurt masalı anlatır: her
 * ilgisiz değişiklikte bağırır, insan da bir süre sonra bakmayı bırakır.
 * Artık etiketler AYIRT EDİCİ İÇERİKLERİNDEN bulunuyor: hangi kaynağı gösterdikleri, hangi
 * sınıfları taşıdıkları. Bunlar bir satır eklenince değişmiyor; görselin kendisi değişince
 * değişiyor — yani test doğru şeye bağlı.
 */
const find = (file, ...needles) =>
  all.filter((t) => t.file === file && needles.every((n) => t.tag.includes(n)));
const one = (file, ...needles) => {
  const hits = find(file, ...needles);
  return hits.length === 1 ? hits[0] : null;
};

// ============================================================ 1) HEPSİNDE decoding VAR MI
/**
 * Listedeki tek "bugün ölçülebilir kazanç" iddiası bu. Bir etiket atlanırsa sessizce eski
 * davranışta kalır — nitekim ilk taramada tam olarak bu çıktı: lazy'si olan 9 etiketin
 * decoding'i yoktu.
 */
const noDecoding = all.filter((t) => !/decoding=/.test(t.tag));
ok(noDecoding.length === 0,
  `decoding özniteliği eksik etiket yok (eksik: ${noDecoding.map((t) => `${t.file}:${t.line}`).join(", ")})`);
ok(all.every((t) => /decoding="async"/.test(t.tag)), "decoding değeri her yerde async");

// ============================================================ 2) İLK EKRAN GÖRSELLERİ LAZY OLMAMALI
/**
 * EN ÖNEMLİ BÖLÜM. Lazy yükleme yanlış yerde bir iyileştirme değil, GERİLEMEDİR: kullanıcının
 * o an bakmak için tıkladığı fotoğrafı geciktirir. Her satır "bu görsel neden hemen yüklenmeli"
 * gerekçesiyle tutuluyor; ileride biri "tüm img'lere lazy ekleyelim" derse bu test durdurur.
 *
 * Dosya değil ETİKET bazında: aynı dosyada hem ana görsel (eager) hem küçük resim şeridi (lazy)
 * olabiliyor — ilk hâlde dosya bazında bakıyordum ve doğru kurulmuş bu ayrımı hata sanmıştı.
 */
const MUST_BE_EAGER = [
  ["components/features/PhotoLightbox.tsx", ["src={current}"], "ışık kutusunun ANA görseli — kullanıcı tam buna bakmak için tıkladı"],
  ["components/features/ListingDetailPage.tsx", ["photos[activeIdx], 1400"], "ilan detayının ana fotoğrafı — sayfanın konusu"],
  ["components/features/MechDetailBody.tsx", ["coverPhoto, 1600"], "tamirci profilinin kapak bandı — ilk ekran"],
  ["components/features/BlogPages.tsx", ["lead.coverPhoto"], "blog listesinin öne çıkan yazısı — en üstte"],
  ["components/features/BlogPages.tsx", ["blogPost.coverPhoto"], "blog yazısının kapak görseli — sayfanın konusu"],
  ["app/AppShell.tsx", ["activePhoto, 900"], "ilan modalının ana fotoğrafı"],
  ["app/AppShell.tsx", ["myProfile.coverPhoto, 700"], "tamircinin kendi kapak fotoğrafı — bölümün tepesi"],
  ["app/AppShell.tsx", ["sellForm.photo, 200"], "satış formundaki önizleme — kullanıcı fotoğrafı AZ ÖNCE seçti"],
];
for (const [file, needles, reason] of MUST_BE_EAGER) {
  const t = one(file, ...needles);
  ok(!!t, `${file} içinde ${needles.join("+")} etiketi TEK olarak bulundu`);
  if (t) ok(!lazy(t), `${file}:${t.line} lazy DEĞİL — ${reason}`);
}

/**
 * Başlıktaki ve profil sayfasındaki avatarlar: üçü de `src={ownerProfile.photo}` kullanıyor,
 * yani tek tek ayırt etmek yerine GRUP olarak denetleniyor. Hepsi ilk ekranda, hepsi eager.
 */
{
  const avatars = find("app/AppShell.tsx", "src={ownerProfile.photo}");
  ok(avatars.length >= 3, `profil fotoğrafı etiketleri bulundu (${avatars.length})`);
  ok(avatars.every((t) => !lazy(t)), "profil/avatar fotoğrafları lazy DEĞİL (ilk ekranda, hep görünür)");
  ok(avatars.every((t) => /decoding="async"/.test(t.tag)), "profil fotoğraflarında decoding=async var");
}

// ============================================================ 3) LİSTE GÖRSELLERİ LAZY OLMALI
/**
 * Ekranın altında kalan, kaydırılarak görülen görseller. Bugünkü kazanç sıfıra yakın (veri zaten
 * data: URI olarak geldi); Faz 4'te görsellerin kendi adresi olunca gerçek kazanca dönüşecek.
 */
/**
 * İĞNELER AYIRT EDİCİ OLMALI. İlk denemede küçük resim şeridi için `w-full h-full object-cover`
 * yazdım; o sınıf aynı dosyadaki ANA görselde de var, yani eşleşme iki etiketi birden yakaladı
 * ve test "ana görsel lazy değil" diye haklı biçimde kırmızı yandı. Artık her satır o etikete
 * ÖZGÜ bir şey gösteriyor (ör. küçük resmin kendi genişlik parametresi).
 */
const MUST_BE_LAZY = [
  ["components/features/AppointmentCard.tsx", ["w-12 h-12 rounded-lg object-cover"], "randevu kartındaki arıza fotoğrafı küçükleri"],
  ["components/features/ChatBubble.tsx", ["src={msg.image}"], "sohbet geçmişi — eski mesajlar ekran dışında"],
  ["components/features/MechCard.tsx", ["m.coverPhoto, 500"], "tamirci listesi kartının kapak görseli"],
  ["components/features/PhotoLightbox.tsx", ["imgThumb(p, 160)"], "ışık kutusunun küçük resim ŞERİDİ (ana görsel değil)"],
  ["components/features/ListingDetailPage.tsx", ["imgThumb(p, 200)"], "ilan galerisinin küçük resim şeridi"],
  ["components/features/BlogPages.tsx", ["p.coverPhoto, 500"], "blog liste kartları"],
  ["app/AppShell.tsx", ["cl.photo, 60"], "karşılaştırma çubuğundaki küçük avatarlar"],
  ["app/AppShell.tsx", ["cl.photo, 400"], "karşılaştırma listesindeki ilan kartları"],
  ["app/AppShell.tsx", ["s.emoji"], "ekip (çalışan) avatarları"],
];
for (const [file, needles, reason] of MUST_BE_LAZY) {
  const hits = find(file, ...needles);
  ok(hits.length >= 1, `${file} içinde ${needles.join("+")} etiketi bulundu`);
  ok(hits.every((t) => lazy(t)), `${file} lazy — ${reason}`);
}

/**
 * Randevu listesindeki arıza fotoğrafı küçükleri AppShell'de iki yerde geçiyor (araç sahibi ve
 * tamirci görünümü); ikisi de aynı sınıfları kullanıyor, o yüzden grup olarak denetleniyor.
 */
{
  const issueThumbs = find("app/AppShell.tsx", "issuePhotoAlt");
  ok(issueThumbs.length >= 2, `arıza fotoğrafı küçükleri bulundu (${issueThumbs.length})`);
  ok(issueThumbs.every((t) => lazy(t)), "arıza fotoğrafı küçükleri lazy (randevu listesi, ekran altı)");
}

// Oran kontrolü: çoğunluk lazy olmalı ama "hepsi lazy" de yanlış olurdu (ilk ekran görselleri var).
const lazyCount = all.filter(lazy).length;
ok(lazyCount >= 18, `liste/küçük görsellerin çoğu lazy (${lazyCount}/${all.length})`);
ok(lazyCount < all.length, "hepsi lazy DEĞİL — ilk ekran görselleri eager kaldı");

// ============================================================ 4) KUTU SABİT Mİ (CLS)
/**
 * width/height öznitelikleri eklenmedi; gerekçe dosya başında. Ama gerekçenin DOĞRU kalması
 * gerekiyor: biri yarın bir görselin Tailwind sınıflarını kaldırırsa kutu serbest kalır ve düzen
 * kayması geri gelir. O yüzden "kutu bir biçimde sabit" kuralı ölçülüyor.
 *
 * TEK KABUL EDİLEN İSTİSNA: sohbet balonundaki fotoğraf. Genişliği kendi sınıfında değil, üst
 * öğede sınırlı (`max-w-[75%]`), yüksekliği `max-h-40`. Yani kutu yine sınırlı, sadece sınır
 * başka yerde tanımlı. İstisnayı gizlemek yerine adını yazıyorum.
 */
/**
 * İSTİSNA DA İÇERİKLE tanımlı (satır numarasıyla değil, aynı kırılganlık sebebiyle).
 * Sohbet balonundaki fotoğrafın genişliği kendi sınıfında değil, üst öğede sınırlı.
 */
const isBoxException = (t) =>
  t.file === "components/features/ChatBubble.tsx" && t.tag.includes("src={msg.image}");
const fixedBox = (c) =>
  /\bh-\d|\bh-full|\bh-screen|aspect-|max-h-/.test(c) && /\bw-\d|\bw-full|\bw-screen|max-w-/.test(c);
const unconstrained = all.filter((t) => {
  const c = cls(t.tag);
  if (c === "<dinamik>") return false;           // sınıf hesaplanıyor; üst öğe sınırlıyor
  if (isBoxException(t)) return false;
  return !fixedBox(c);
});
ok(unconstrained.length === 0,
  `her görselin kutusu CSS ile sabit — width/height özniteliği gereksiz (serbest: ${unconstrained.map((t) => `${t.file}:${t.line} [${cls(t.tag)}]`).join(", ")})`);
// İstisna gerçekten üst öğeden sınırlanıyor mu — varsayımı da ölçüyoruz.
{
  const chat = readFileSync(join(SRC, "components/features/ChatBubble.tsx"), "utf8");
  ok(/max-w-\[75%\]/.test(chat), "sohbet balonu istisnası geçerli: genişlik üst öğede sınırlı (max-w-[75%])");
  ok(/max-h-40/.test(chat), "sohbet fotoğrafının yüksekliği sınırlı (max-h-40)");
}

// ============================================================ 5) KARAR KAYIT ALTINDA
/**
 * Bu kontroller koda değil GEREKÇENİN YAZILI OLMASINA bakıyor. "Neden width/height eklemedik" ve
 * "neden lazy bugün işe yaramıyor" soruları altı ay sonra tekrar sorulacak; cevap kodda yoksa
 * biri iyi niyetle geri ekler.
 */
const selfSrc = readFileSync(join(ROOT, "tests", "image-loading.test.mjs"), "utf8");
ok(/data:` URI|data: URI/.test(selfSrc), "lazy'nin bugün neden etkisiz olduğu yazılı");
ok(/Faz 4/.test(selfSrc), "kazancın hangi fazda geleceği yazılı");
const handbook = readFileSync(join(SRC, "data", "handbook.ts"), "utf8");
ok(/decoding/.test(handbook), "el kitabında decoding kararı anlatılıyor");
ok(/lazy/.test(handbook), "el kitabında lazy kararı anlatılıyor");

if (failures.length === 0) {
  console.log(`OK görsel yükleme öznitelikleri (${passed})`);
  process.exit(0);
}
console.log(`BAŞARISIZ görsel yükleme öznitelikleri — ${failures.length}/${passed + failures.length}`);
for (const f of failures) console.log("  ✗ " + f);
process.exit(1);
