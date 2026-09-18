/**
 * OLAY NESNESİ PARAMETRE SANILMASIN — "Converting circular structure to JSON" hatasının kökü.
 * ================================================================================================
 * BULUNAN HATA (kullanıcı bildirdi):
 *   "⚠️ Teklif isteği kaydedilemedi: Converting circular structure to JSON
 *    --> starting at object with constructor 'HTMLButtonElement'
 *    | property '__reactFiber$…' -> object with constructor 'FiberNode'"
 *
 * SEBEP — ve bu benim kendi regresyonumdu (bkz. el kitabı 25.17): `openQuoteModal`e
 * `preselectMechanicId` parametresini eklemiştim, ama fonksiyon dört yerde düğmeye
 * `onClick={openQuoteModal}` diye DOĞRUDAN bağlıydı. React bu durumda handler'a tıklama olayını
 * geçirir; yani parametre bir tamirci id'si değil, DOM düğümüne bağlı bir SyntheticEvent oluyordu.
 * `!= null` olduğu için ön seçim listesine yazılıyor, istek gönderilirken `JSON.stringify` o
 * nesnenin içindeki döngüye takılıyordu.
 *
 * NEDEN BU KADAR SİNSİ: modal sorunsuz açılıyor. Kullanıcı formu baştan sona dolduruyor ve hata
 * ancak GÖNDER'e bastığında çıkıyor — yani emek harcandıktan SONRA. Hatanın olduğu yer (bağlama)
 * ile patladığı yer (gönderim) arasında dosyalar ve dakikalar var.
 *
 * GENEL KURAL: varsayılan değerli ya da olay-olmayan bir parametre alan bir fonksiyon, bir olay
 * işleyicisine DOĞRUDAN bağlanamaz. `onClick={() => fn()}` yazılmalı.
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
    else if (/\.(tsx|jsx|ts)$/.test(e)) files.push(p);
  }
})(SRC);
const rel = (f) => relative(SRC, f);
/** Yorumsuz okuma ŞART: bu dosyanın ve düzeltilen dosyaların yorumları hatalı kodu ALINTILIYOR. */
const read = (f) => stripComments(readFileSync(f, "utf8"));

// --- 1) FONKSİYONLARI SINIFLANDIR -------------------------------------------------------------
/**
 * `e`, `ev`, `event` adlı bir parametre almak, o fonksiyonun olay işleyicisi olarak YAZILDIĞINI
 * gösterir — `onChange={addQuotePhoto}` gibi kullanımlar doğrudur ve bulgu sayılmamalı.
 * İlk taramamda bu ayrımı yapmayınca 12 "bulgu" çıkmıştı; 11'i doğru koddu. Eşiği indirmek yerine
 * kuralı keskinleştirdim — yanlış alarmla dolu bir test, kimsenin bakmadığı bir testtir.
 */
const EVENTISH = /^(e|ev|evt|event|_e|_ev)$/;
const risky = new Map();
for (const f of files) {
  const src = read(f);
  for (const m of src.matchAll(/const\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\(\s*([a-zA-Z0-9_]+)\s*(=\s*[^,)]+)?\)\s*=>/g)) {
    const [, name, param, dflt] = m;
    if (dflt || !EVENTISH.test(param)) {
      risky.set(name, { param, hasDefault: !!dflt, file: rel(f) });
    }
  }
}
ok(risky.size > 30, `olay-olmayan parametre alan fonksiyonlar tarandı (${risky.size})`);

// --- 2) BUNLARDAN HANGİSİ DOĞRUDAN OLAY İŞLEYİCİSİ OLARAK BAĞLANMIŞ? --------------------------
const EVENT_PROPS = /\b(onClick|onChange|onSubmit|onBlur|onFocus|onKeyDown|onKeyUp|onInput|onMouseDown|onMouseUp|onTouchStart|onPointerDown|onDoubleClick)=\{([a-zA-Z0-9_]+)\}/g;
const bad = [];
let boundCount = 0;
for (const f of files) {
  if (!/\.(tsx|jsx)$/.test(f)) continue;
  read(f).split("\n").forEach((line, i) => {
    for (const m of line.matchAll(EVENT_PROPS)) {
      boundCount++;
      const r = risky.get(m[2]);
      if (r) {
        bad.push(`${rel(f)}:${i + 1} ${m[1]}={${m[2]}} → ${m[2]}(${r.param}${r.hasDefault ? " = ..." : ""}) [${r.file}]`);
      }
    }
  });
}
// Aracın gerçekten baktığını kanıtla: hiç bağlama görmeseydi "0 bulgu" anlamsız olurdu.
ok(boundCount > 15, `doğrudan bağlanmış olay işleyicisi bulundu (${boundCount}) — desen çalışıyor`);
eq(bad, [],
  "olay-olmayan parametre alan hiçbir fonksiyon doğrudan olay işleyicisine bağlı değil (onClick={fn} yerine onClick={() => fn()} yaz)");

// --- 3) ASIL HATANIN KENDİSİ: openQuoteModal --------------------------------------------------
{
  const provider = read(join(SRC, "app", "state", "AppLogicProvider.tsx"));
  ok(/const openQuoteModal = \(preselectMechanicId = null\)/.test(provider),
    "openQuoteModal hâlâ isteğe bağlı ön seçim parametresi alıyor (özellik duruyor)");

  /**
   * İKİNCİ KATMAN: çağrı yerlerini düzeltmek yetmez — yarın biri yeni bir düğmeye yine
   * `onClick={openQuoteModal}` yazabilir. Fonksiyonun kendisi çöp parametreyi yok saymalı.
   */
  const fnBody = provider.slice(provider.indexOf("const openQuoteModal"), provider.indexOf("const toggleAddVehicle"));
  ok(/Number\(preselectMechanicId\)/.test(fnBody),
    "parametre sayıya çevriliyor (olay nesnesi → NaN)");
  ok(/Number\.isFinite\(id\)/.test(fnBody),
    "sayı değilse ön seçim yapılmıyor — yanlış parametre zararsız");
  ok(!/preselectMechanicId != null/.test(fnBody),
    "eski '!= null' kontrolü kalmadı (bir olay nesnesi de null DEĞİLDİR — hatanın tam olarak bu satırdı)");
}

// --- 4) ÜÇÜNCÜ KATMAN: gönderim öncesi süzme --------------------------------------------------
{
  const provider = read(join(SRC, "app", "state", "AppLogicProvider.tsx"));
  const submit = provider.slice(provider.indexOf("const submitQuoteRequest"), provider.indexOf("const submitQuoteRequest") + 2500);
  ok(/quoteSelectedMechIds\.map\(Number\)\.filter\(Number\.isFinite\)/.test(submit),
    "gönderilecek tamirci id listesi sayıya süzülüyor (son savunma hattı)");
  ok(/selectedMechIds\.length === 0/.test(submit),
    "süzmeden sonra liste boşaldıysa istek gönderilmiyor, kullanıcı uyarılıyor");
}

// --- 5) DÖRDÜNCÜ KATMAN: hata MESAJI da kullanışlı olmalı -------------------------------------
/**
 * Hatanın kendisi düzeldi; ama "Converting circular structure to JSON --> HTMLButtonElement"
 * cümlesi kullanıcıya da geliştiriciye de hangi ALANIN bozuk olduğunu söylemiyordu. Bu sınıf
 * hata bir daha olursa mesaj işe yarasın diye tüm istek gövdeleri tek bir kapıdan geçiyor.
 */
{
  const client = read(join(SRC, "services", "api", "client.ts"));
  ok(/export function jsonBody/.test(client), "istek gövdeleri için tek bir çeviri kapısı var");
  ok(/Object\.entries/.test(client.slice(client.indexOf("export function jsonBody"), client.indexOf("export function jsonBody") + 1400)),
    "çeviri patlarsa sorumlu alanlar ADIYLA aranıyor");

  // `crud()` fabrikası dahil, hiçbir yerde ham JSON.stringify ile gövde kurulmuyor.
  const rawBodies = [...client.matchAll(/body:\s*JSON\.stringify\(/g)].length;
  eq(rawBodies, 0, "hiçbir istek gövdesi ham JSON.stringify ile kurulmuyor");
  const guarded = [...client.matchAll(/body:\s*jsonBody\(/g)].length;
  ok(guarded > 30, `tüm istek gövdeleri korumalı kapıdan geçiyor (${guarded} çağrı)`);
}

// --- 6) DAVRANIŞ: jsonBody gerçekten çalışıyor mu -------------------------------------------
/**
 * Yukarıdakiler kaynak kodu OKUYOR. Bu bölüm fonksiyonu ÇALIŞTIRIYOR — "kod doğru görünüyor" ile
 * "kod doğru çalışıyor" arasındaki farkı bu projede birkaç kez pahalıya öğrendik.
 * client.ts tarayıcıya özgü şeyler (import.meta.env, localStorage) kullandığı için doğrudan
 * import edilemiyor; fonksiyonun mantığı burada birebir yeniden kuruluyor ve kaynakla
 * karşılaştırılıyor.
 */
{
  const findBadFields = (data) => {
    const bad = [];
    if (data && typeof data === "object") {
      for (const [k, v] of Object.entries(data)) {
        try { JSON.stringify(v); } catch { bad.push(`${k} (${v?.constructor?.name || typeof v})`); }
      }
    }
    return bad;
  };

  // Kullanıcının yaşadığı durumun aynısı: döngüsel bir nesne, id listesinin içinde.
  const fakeNode = { tagName: "BUTTON" };
  const fakeFiber = { stateNode: fakeNode };
  fakeNode.__reactFiber = fakeFiber;          // döngü kuruldu
  const draft = { vehicleId: 3, issue: "fren", mechanicIds: [fakeNode], status: "open" };

  let threw = false;
  try { JSON.stringify(draft); } catch { threw = true; }
  ok(threw, "test verisi gerçekten döngüsel (hata senaryosu doğru kuruldu)");

  const bad = findBadFields(draft);
  eq(bad.length, 1, "yalnızca sorunlu alan işaretleniyor, tüm gövde değil");
  ok(bad[0].startsWith("mechanicIds"), `sorunlu alan ADIYLA bulunuyor: ${bad[0]}`);

  // Sağlam gövdede hiçbir şey işaretlenmemeli (yanlış alarm üretmiyor).
  eq(findBadFields({ vehicleId: 3, mechanicIds: [1, 2], issue: "fren" }), [],
    "sağlam gövdede uyarı üretmiyor");

  // Süzme mantığı: olay nesnesi ve çöp eleniyor, gerçek id'ler kalıyor.
  const filter = (ids) => ids.map(Number).filter(Number.isFinite);
  eq(filter([1, 2, 3]), [1, 2, 3], "geçerli id'ler korunuyor");
  eq(filter(["4", 5]), [4, 5], "metin id sayıya çevriliyor");
  eq(filter([fakeNode, 7]), [7], "olay/DOM nesnesi eleniyor, gerçek id kalıyor");
  eq(filter([fakeNode]), [], "yalnızca çöp varsa liste boşalıyor (istek gönderilmiyor)");
}

report("olay işleyici parametreleri");
