// Minik test koşucusu. Bilinçli olarak SESSİZ: geçen testler hiçbir şey yazdırmıyor.
// Amaç, her değişiklikten sonra tam takımı çalıştırıp ekrana tek satır özet düşürmek.
// Sadece BAŞARISIZ testler ayrıntılı yazdırılır — arıza varsa gürültü zaten istenir.
let passed = 0;
const failures = [];

export function eq(actual, expected, name) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  else failures.push(`${name}\n    beklenen: ${JSON.stringify(expected)}\n    gelen   : ${JSON.stringify(actual)}`);
}

export function ok(value, name) { eq(!!value, true, name); }

/** Çökmemesi gereken kod: fırlatırsa test düşer, dönen değer opsiyonel karşılaştırılır. */
export function noThrow(fn, name, expected) {
  try {
    const got = fn();
    if (expected === undefined) passed++;
    else eq(got, expected, name);
  } catch (e) {
    failures.push(`${name}\n    ÇÖKTÜ: ${e.message}`);
  }
}

/** FırlatMASI beklenen kod (ör. eski hatalı kodun hâlâ çöktüğünü kanıtlamak). */
export function throws(fn, name) {
  try { fn(); failures.push(`${name}\n    fırlatması bekleniyordu ama fırlatmadı`); }
  catch { passed++; }
}

/**
 * KAYNAK METNİNDEN YORUMLARI ÇIKARIR — "kod yok" derken yorumu saymamak için.
 * ================================================================================================
 * NEDEN VAR (ikinci denetimde ortaya çıktı, gerçek bir test aracı hatası): bu takımdaki statik
 * testlerin çoğu kaynak kodda bir desenin VAR ya da YOK olduğunu kontrol ediyor. Sorun şu ki
 * kaynak dosya yalnızca kod değil, aynı zamanda o kodu ANLATAN yorumları da içeriyor — ve bir şeyi
 * kaldırdığımızda neden kaldırdığımızı yazarken kaldırılan kodu ZORUNLU olarak alıntılıyoruz.
 *
 * İki kontrol tam bu yüzden yanlış yandı:
 *   - "önbellek isabeti bildirilmiyor" → `cached: true` deseni, o bayrağın neden kaldırıldığını
 *     açıklayan yorumun içinde bulundu.
 *   - "başarılı girişte sayaç sıfırlanmıyor" → `loginLimiter.reset(ip)` deseni, "bu satır
 *     KALDIRILDI" diyen yorumun içinde bulundu.
 * Yani düzeltme doğruydu, ölçüm yanlıştı: test "bu metin dosyada geçiyor mu" diye soruyordu, oysa
 * sorması gereken "bu KOD çalışıyor mu" idi. Bu ayrımı yapmayan her "YOK" kontrolü, düzeltmenin
 * belgelenmesi yüzünden kırmızı yanar — ve bu, gelecekte insanı yorumları silmeye teşvik eder,
 * yani kötü bir teşvik.
 *
 * Kasıtlı olarak basit tutuldu (tam bir JS ayrıştırıcısı değil): metin içindeki `//` dizilerini
 * (ör. "https://") yorum sanmasın diye satır yorumu yalnızca satır başında/boşluk sonrasında
 * eşleşiyor. Bu takımın ihtiyacı için yeterli, ve yetersiz kaldığı yerde davranışın kendisini
 * uçtan uca test etmek doğru araçtır.
 */
export function stripComments(src) {
  /**
   * SATIR SAYISI KORUNUYOR — ve bu ayrıntı bir hataya yol açtı.
   * İlk sürüm yorumları tamamen siliyordu; dosyadaki satır numaraları kayıyor ve bu yardımcıyı
   * kullanan testler bulguları YANLIŞ SATIRDA gösteriyordu ("AppShell/chat:45" diye bir yer
   * aradım, orada o kod yoktu). Ölçüm doğruydu, adres yanlıştı — ve yanlış adres, insanı olmayan
   * bir hatayı aramaya gönderiyor.
   * Çözüm: yorumun yerine aynı sayıda satır sonu bırakılıyor. Desen eşleşmesi için yorum yok,
   * satır numarası için dosya aynı uzunlukta.
   */
  const keepLines = (m) => "\n".repeat((m.match(/\n/g) || []).length);
  return src
    .replace(/\/\*[\s\S]*?\*\//g, keepLines)   // blok yorumlar (JSDoc dâhil)
    .replace(/(^|\s)\/\/[^\n]*/g, "$1");        // satır yorumları ("https://" yanlış eşleşmesin)
}

export function report(suiteName) {
  if (failures.length === 0) { console.log(`OK ${suiteName} (${passed})`); process.exit(0); }
  console.log(`BAŞARISIZ ${suiteName} — ${failures.length}/${passed + failures.length}`);
  for (const f of failures) console.log("  ✗ " + f);
  process.exit(1);
}
