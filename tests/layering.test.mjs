/**
 * KATMAN SIRASI (z-index) — "uyarı mesajı geride kalıyor" hatasının kalıcı çözümü.
 * ================================================================================================
 * BULUNAN HATA (kullanıcı bildirdi): araç ilanı yayınlanırken "geçerli bir fiyat girin" uyarısı
 * MODALIN ARKASINDA kalıyordu. Sebep: uyarı kutusu `z-50`, uygulamadaki modaller ise 9400–9999
 * arası katmanlarda.
 *
 * Bu tek bir ekranın kusuru DEĞİLDİ ve ölçüldüğünde kapsamı şu: uyarıların neredeyse tamamı bir
 * form modalı AÇIKKEN çıkıyor ("geçerli bir fiyat girin", "favori kaydedilemedi", "sunucuya
 * kaydedilemedi"…). Yani uygulama kullanıcıya sorunu söylüyordu ama söylediği yer görünmüyordu —
 * kullanıcı açısından "butona bastım, hiçbir şey olmadı".
 *
 * NEDEN SABİT BİR SAYI YETMEZ: bugün 10001 yazıp geçmek, yarın biri z-99999'lu bir modal
 * eklediğinde aynı hatayı geri getirir. Bu yüzden test SABİT DEĞİL BAĞIL: kod tabanındaki EN
 * YÜKSEK katmanı hesaplıyor ve geri bildirim katmanlarının onun üstünde olmasını şart koşuyor.
 * Yeni bir modal katmanı eklenirse test kırmızı yanar ve ne yapılacağını söyler.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, ok, report, stripComments } from "./_harness.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "frontend", "src");

const files = [];
(function walk(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx|jsx)$/.test(e)) files.push(p);
  }
})(SRC);
const rel = (f) => relative(SRC, f);
/** Yorumlar çıkarılıyor: bir katmanın NEDEN değiştiğini anlatan yorum eski değeri alıntılıyor. */
const read = (f) => stripComments(readFileSync(f, "utf8"));

/**
 * Bir dosyadaki tüm katman değerlerini topla.
 * İki biçim var ve ikisi de kullanılıyor: Tailwind sınıfı (`z-50`, `z-[9999]`) ve satır içi stil
 * (`zIndex: 9999`). Yalnızca birine bakmak, diğerindeki en yüksek değeri kaçırmak demek olurdu —
 * nitekim en yüksek modal (9999) satır içi stille yazılmış.
 */
function layersIn(src, file) {
  const out = [];
  for (const m of src.matchAll(/\bz-\[(\d+)\]/g)) out.push({ z: Number(m[1]), how: `z-[${m[1]}]`, file, at: m.index });
  for (const m of src.matchAll(/\bz-(\d+)\b/g)) out.push({ z: Number(m[1]), how: `z-${m[1]}`, file, at: m.index });
  for (const m of src.matchAll(/zIndex:\s*(\d+)/g)) out.push({ z: Number(m[1]), how: `zIndex: ${m[1]}`, file, at: m.index });
  return out;
}

const shellSrc = read(join(SRC, "app", "AppShell.tsx"));

// --- 1) GERİ BİLDİRİM KATMANLARINI BUL --------------------------------------------------------
// Bunlar kullanıcıya "ne oldu" diyen yüzeyler: uyarı/bilgi kutusu ve başarı animasyonu.
const toastTag = /\{toast && \(<div className="([^"]+)"/.exec(shellSrc);
ok(toastTag, "uyarı/bilgi kutusu bulundu");
const pulseTag = /\{successPulse && \(<div className="([^"]+)"/.exec(shellSrc);
ok(pulseTag, "başarı animasyonu bulundu");

const zOfClass = (cls) => {
  const bracket = /z-\[(\d+)\]/.exec(cls);
  if (bracket) return Number(bracket[1]);
  const plain = /\bz-(\d+)\b/.exec(cls);
  return plain ? Number(plain[1]) : null;
};
const toastZ = zOfClass(toastTag[1]);
const pulseZ = zOfClass(pulseTag[1]);
ok(toastZ != null, `uyarı kutusunun katmanı açıkça yazılmış (z-${toastZ})`);
ok(pulseZ != null, `başarı animasyonunun katmanı açıkça yazılmış (z-${pulseZ})`);

// --- 2) EN YÜKSEK "DİĞER" KATMAN --------------------------------------------------------------
// Geri bildirim katmanlarının kendisi hariç, kod tabanındaki en yüksek katman.
const others = [];
for (const f of files) {
  const src = read(f);
  for (const l of layersIn(src, rel(f))) {
    // Geri bildirim katmanlarını kendileriyle karşılaştırmıyoruz.
    if (l.z === toastZ || l.z === pulseZ) continue;
    others.push(l);
  }
}
ok(others.length > 20, `karşılaştırılacak katman bulundu (${others.length})`);
const top = others.reduce((a, b) => (b.z > a.z ? b : a), others[0]);

ok(toastZ > top.z,
  `uyarı kutusu HER ŞEYİN üstünde: z-${toastZ} > en yüksek diğer katman z-${top.z} (${top.file}, ${top.how})`);
ok(pulseZ > top.z,
  `başarı animasyonu da modallerin üstünde: z-${pulseZ} > z-${top.z}`);
ok(toastZ > pulseZ,
  `uyarı mesajı başarı animasyonunun ÜSTÜNDE (${toastZ} > ${pulseZ}) — ikisi çakışırsa okunması gereken mesajdır`);

// --- 3) BAŞARI ANİMASYONU TIKLAMAYI ENGELLEMİYOR ----------------------------------------------
// En üste çıkarılan tam ekran bir katman, `pointer-events-none` olmadan altındaki modalı
// TAMAMEN kullanılamaz hâle getirir. Katmanı yükseltmenin yan etkisi tam olarak bu olurdu.
ok(/pointer-events-none/.test(pulseTag[1]),
  "başarı animasyonu tam ekran ve en üstte ama tıklamayı engellemiyor (pointer-events-none)");

// --- 4) ÜST ÇUBUK: kapak öğelerinin üstünde, modallerin altında -------------------------------
// Ayrı bir hata sınıfı ama aynı aile (bkz. tests/back-button.test.mjs). Burada yalnızca sıranın
// bir bütün olarak tutarlı olduğunu doğruluyoruz.
{
  const topBar = read(join(SRC, "components", "features", "BrandMark.tsx"));
  const m = /sticky top-0 z-\[(\d+)\]/.exec(topBar);
  ok(m, "üst çubuğun katmanı açıkça yazılmış");
  const barZ = Number(m[1]);
  ok(barZ > 40, `üst çubuk kapak bandı öğelerinin (z-40) üstünde (z-${barZ})`);
  ok(barZ < toastZ, `üst çubuk uyarı kutusunun altında (z-${barZ} < z-${toastZ})`);
  ok(barZ < 9400, `üst çubuk modallerin altında (z-${barZ} < 9400)`);
}

// --- 5) BEKLENEN SIRA, TEK BİR CÜMLEDE --------------------------------------------------------
// Sıralamayı burada açıkça yazıyoruz ki gelecekte biri bir katman eklerken nereye koyacağını
// tahmin etmek zorunda kalmasın.
{
  const order = [
    ["içerik kartı", 10],
    ["yapışkan sekme çubuğu", 20],
    ["kapak bandı öğeleri", 40],
    ["üst çubuk", zOfClass(/sticky top-0 (z-\[\d+\])/.exec(read(join(SRC, "components", "features", "BrandMark.tsx")))[1])],
    ["modaller", top.z],
    ["başarı animasyonu", pulseZ],
    ["uyarı/bilgi mesajı", toastZ],
  ];
  const zs = order.map(([, z]) => z);
  const sorted = [...zs].sort((a, b) => a - b);
  eq(zs.join("<"), sorted.join("<"),
    `katman sırası artan: ${order.map(([n, z]) => `${n}(${z})`).join(" < ")}`);
}

report("katman sırası");
