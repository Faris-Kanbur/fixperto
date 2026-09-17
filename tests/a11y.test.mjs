/**
 * ERİŞİLEBİLİRLİK — TARAYICI OLMADAN ÖLÇÜLEBİLENLER.
 * ================================================================================================
 * NEDEN BU DOSYA VAR: önceki üç denetimde "tarayıcı/responsive/erişilebilirlik testi bu ortamda
 * yapılamıyor" diye bir satır yazıp geçtim. O satır DOĞRU ama TAMAM değildi: tarayıcı gerektiren
 * şeyler (gerçek kontrast, odak sırası, ekran okuyucu çıktısı, 320px'te akış) ile KAYNAK KODDAN
 * ölçülebilen şeyler aynı kefeye konmuştu. İkincisi hiç denenmemişti.
 *
 * Bu dosya yalnızca ikincisini ölçüyor ve NE ÖLÇMEDİĞİNİ de yazıyor (en altta). Amaç "erişilebilir"
 * demek değil; ölçülebilir olanı ölçmek ve bir daha kötüye gitmesini engellemek.
 *
 * ÖLÇÜM ARACININ KENDİSİ HAKKINDA BİR NOT: ilk taramam 73 "etiketsiz input" ve 62 "klavyeyle
 * erişilemez tıklanabilir div" bildirdi. İkisi de büyük ölçüde YANLIŞ POZİTİFTİ:
 *   - inputların bir kısmı `type="file" className="hidden"` (bir düğmeyle tetikleniyor, etiket
 *     gerekmiyor), bir kısmı da yanında GÖRÜNÜR bir <label> olan ama `htmlFor`/`id` ile
 *     BAĞLANMAMIŞ alanlar — bu gerçek bir eksik ama "etiketi yok" demek yanlış.
 *   - "tıklanabilir div"lerin neredeyse tamamı MODAL ARKA PLANI (tıkla-kapat). WCAG bunların
 *     klavyeyle erişilebilir olmasını istemiyor; istediği şey modalın klavyeyle KAPANABİLMESİ.
 * Yani ham sayıya bakıp 135 "hata" bildirmek, gerçek hatayı gizleyen bir gürültü olurdu. Kurallar
 * daraltıldı ve asıl soru soruldu: modallar Escape ile kapanıyor mu? Cevap HAYIR'dı — 30 modalın
 * hiçbiri. Gerçek bulgu buydu.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, ok, report, stripComments } from "./_harness.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "frontend", "src");
const read = (p) => readFileSync(p, "utf8");

const files = [];
(function walk(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx|jsx)$/.test(e)) files.push(p);
  }
})(SRC);
const rel = (f) => relative(SRC, f);
ok(files.length > 20, `taranacak bileşen dosyası bulundu (${files.length})`);

/**
 * JSX açılış etiketlerini SÜSLÜ PARANTEZ DERİNLİĞİNE göre tarar.
 * Bu, bu oturumda bir kez bizzat yaşanan hatanın çözümü: `<img ... onError={() => x}>` gibi bir
 * etikette basit bir `<img[^>]*>` deseni, `=>` içindeki `>` yüzünden etiketi ORTADAN kesiyor ve
 * sonraki nitelikleri (ör. `alt`) hiç görmüyordu — yani test "alt yok" diyordu, oysa vardı.
 */
function openTags(src, name) {
  const out = [];
  let i = 0;
  for (;;) {
    i = src.indexOf(`<${name}`, i);
    if (i === -1) break;
    const nxt = src[i + name.length + 1];
    if (nxt && /[A-Za-z0-9\-_]/.test(nxt)) { i += 1; continue; }
    let j = i + 1, depth = 0, quote = null;
    while (j < src.length) {
      const c = src[j];
      if (quote) { if (c === quote && src[j - 1] !== "\\") quote = null; }
      else if (c === '"' || c === "'" || c === "`") quote = c;
      else if (c === "{") depth += 1;
      else if (c === "}") depth -= 1;
      else if (c === ">" && depth === 0) break;
      j += 1;
    }
    out.push({ text: src.slice(i, j + 1), line: src.slice(0, i).split("\n").length, start: i, end: j + 1 });
    i = j + 1;
  }
  return out;
}

// --- 1) HER <img> BİR alt TAŞIYOR --------------------------------------------------------------
// Ölçüldü: bir tanesi eksikti (randevu arıza fotoğrafları). Ekran okuyucu orada dosya adını ya da
// hiçbir şey okuyordu; artık aracı ve kaçıncı fotoğraf olduğunu söylüyor.
{
  const missing = [];
  for (const f of files) for (const t of openTags(read(f), "img")) {
    if (!/\balt\s*=/.test(t.text)) missing.push(`${rel(f)}:${t.line}`);
  }
  eq(missing.length, 0, `her <img> alt taşıyor${missing.length ? ` — eksik: ${missing.join(", ")}` : ""}`);
}

// --- 2) MODALLAR ESCAPE İLE KAPANABİLİYOR ------------------------------------------------------
// ASIL BULGU. Üç şeyi ayrı ayrı doğruluyoruz, çünkü üçü de gerekli:
//   (a) merkezi Escape işleyicisi var,
//   (b) en üstteki modalı seçiyor (üst üste modalda hepsini birden kapatmıyor),
//   (c) tıkla-kapat arka planlarının HEPSİ işaretli — biri işaretsiz kalırsa o modal yine
//       klavyeyle kapatılamaz hâle gelir, yani (a) tek başına yeterli değil.
{
  const shell = read(join(SRC, "app", "AppShell.tsx"));
  const code = stripComments(shell);
  ok(/e\.key !== "Escape"/.test(code) && /data-modal-backdrop/.test(code), "merkezi Escape işleyicisi var");
  ok(/zOf\(el\) >= zOf\(best\)/.test(code), "Escape yalnızca EN ÜSTTEKİ modalı kapatıyor");
  ok(/window\.removeEventListener\("keydown", onKey\)/.test(code), "dinleyici temizleniyor (sızıntı yok)");

  // Tıkla-kapat arka planı olan her div işaretli mi?
  const unmarked = [];
  for (const t of openTags(code, "div")) {
    if (!/fixed inset-0/.test(t.text)) continue;
    if (!/onClick=/.test(t.text)) continue;
    if (/data-modal-backdrop/.test(t.text)) continue;
    unmarked.push(`AppShell.tsx:${t.line}`);
  }
  eq(unmarked.length, 0,
    `tıkla-kapat modal arka planlarının hepsi Escape kapsamında${unmarked.length ? ` — işaretsiz: ${unmarked.join(", ")}` : ""}`);
  const marked = (code.match(/data-modal-backdrop/g) || []).length;
  ok(marked >= 25, `işaretli arka plan sayısı beklenen aralıkta (${marked})`);
}

// --- 3) KENDİ ESCAPE'İNİ YÖNETEN BİLEŞENLER BUNU SÜRDÜRÜYOR ------------------------------------
// Bu bileşenler doğru davranışın zaten var olduğu yerlerdi; merkezi işleyici eklenirken
// bozulmadıklarını da ölçüyoruz (regresyon).
{
  for (const [file, label] of [
    ["components/features/PhotoLightbox.tsx", "fotoğraf büyütme"],
    ["components/features/EmojiPicker.tsx", "emoji seçici"],
    ["components/features/ComboBox.tsx", "birleşik kutu"],
    ["components/features/WelcomeTour.tsx", "tanıtım turu"],
    ["components/features/ShareButton.tsx", "paylaş menüsü"],
  ]) {
    ok(/Escape/.test(read(join(SRC, file))), `${label} Escape'i kendi yönetiyor`);
  }
}

// --- 4) İKON DÜĞMELERİ GERÇEK <button> ---------------------------------------------------------
// Klavye ve ekran okuyucu için kritik: `<div onClick>` sekmeyle erişilemez ve "düğme" olarak
// duyurulmaz. Ölçüldü: etiketsiz ikon düğmesi YOK (hepsi <button> ve metin/aria taşıyor).
{
  /**
   * ÖLÇÜM ARACINDAKİ İKİ HATA (bu testi yazarken bizzat yapıldı, düzeltildi):
   *   1) Gövde `src.indexOf(t.text)` ile bulunuyordu. Aynı açılış etiketi dosyada birden çok kez
   *      geçtiğinde (ör. iki yerde birebir aynı `<button onClick={...} className="...">`) indexOf
   *      HER ZAMAN İLK kopyayı buluyor, yani ikinci düğmenin gövdesi diye BAŞKA bir düğmenin
   *      gövdesi okunuyordu. Etiketin gerçek konumu (`t.end`) artık taşınıyor.
   *   2) "Metin var mı" kuralı yalnızca harf arıyordu. Ama gövde `{o.l}` / `{tm}` / `{b}` gibi bir
   *      DEĞİŞKEN de olabilir ve o değişken ekranda metin basar. Bunları "etiketsiz ikon düğmesi"
   *      saymak gerçek bulguları (2 tane) 13 yanlış alarmın içinde gizliyordu.
   */
  let iconButtons = 0;
  const bad = [];
  for (const f of files) {
    const src = read(f);
    for (const t of openTags(src, "button")) {
      const body = (src.slice(t.end).split("</button>")[0] || "").slice(0, 400);
      const withoutTags = body.replace(/<[^>]*>/g, "");
      // Metin sayılan şeyler: çeviri çağrısı, herhangi bir JSX ifadesi (değişken metin basar),
      // ya da üç harflik düz metin.
      const hasVisibleText = /\{t\(/.test(body) || /\{[^}]+\}/.test(withoutTags)
        || /[A-Za-zÀ-ÿğüşıöçĞÜŞİÖÇ]{3}/.test(withoutTags);
      if (hasVisibleText) continue;
      iconButtons += 1;
      if (!/aria-label|title\s*=/.test(t.text)) bad.push(`${rel(f)}:${t.line}`);
    }
  }
  eq(bad.length, 0, `metinsiz düğmelerin hepsi aria-label/title taşıyor (${iconButtons} ikon düğmesi)`);
}

// --- 5) GİZLİ DOSYA SEÇİCİLERİ GERÇEKTEN GİZLİ ve BİR DÜĞMEYLE TETİKLENİYOR --------------------
// `type="file"` alanları bilerek gizli (tasarım tercihi) — ama gizli bir alanın klavyeyle
// erişilebilir bir tetikleyicisi OLMALI, yoksa dosya yükleme klavyeyle imkânsız olur.
{
  const shell = read(join(SRC, "app", "AppShell.tsx"));
  const fileInputs = openTags(shell, "input").filter((t) => /type="file"/.test(t.text));
  ok(fileInputs.length > 0, `gizli dosya seçici bulundu (${fileInputs.length})`);
  const refNames = fileInputs
    .map((t) => /ref=\{(\w+)\}/.exec(t.text)?.[1])
    .filter(Boolean);
  const noTrigger = refNames.filter((r) => !new RegExp(`${r}\\.current\\??\\.click\\(\\)`).test(shell));
  eq(noTrigger.length, 0,
    `her gizli dosya seçicisinin bir düğme tetikleyicisi var${noTrigger.length ? ` — tetikleyicisiz: ${noTrigger.join(", ")}` : ""}`);
}

// --- 6) RESPONSIVE: SABİT GENİŞLİK TAŞMASI ------------------------------------------------------
// Tarayıcı olmadan gerçek akışı ölçemiyoruz, ama en yaygın taşma sebebini ölçebiliyoruz: en küçük
// hedef ekrandan (375px) geniş SABİT bir genişlik. Böyle bir sınıf varsa yatay kaydırma kesin.
{
  const wide = [];
  for (const f of files) {
    const src = read(f);
    for (const m of src.matchAll(/\b(?:min-)?w-\[(\d+)px\]/g)) {
      if (Number(m[1]) > 375) wide.push(`${rel(f)}:${src.slice(0, m.index).split("\n").length} (${m[0]})`);
    }
  }
  eq(wide.length, 0, `375px'ten geniş sabit genişlik yok${wide.length ? ` — ${wide.join(", ")}` : ""}`);
}

// --- 7) DİL ETİKETİ: ekran okuyucu doğru telaffuz için lang bilmek zorunda ----------------------
{
  const indexHtml = read(join(ROOT, "frontend", "index.html"));
  ok(/<html[^>]*\slang=/.test(indexHtml), "index.html bir lang niteliği taşıyor");
  ok(/name="viewport"[^>]*width=device-width/.test(indexHtml), "viewport meta etiketi mobil için doğru");
}

/**
 * ====== BU DOSYANIN ÖLÇMEDİKLERİ (tarayıcı gerekir, uydurmuyoruz) ======
 * ------------------------------------------------------------------------------------------------
 *   - GERÇEK RENK KONTRASTI. Tailwind sınıflarından tahmin edilebilir ama koyu mod, üst üste binen
 *     yarı saydam katmanlar ve resim üstü metin hesabı bozuyor. Gerçek ölçüm için render şart.
 *   - ODAK SIRASI ve ODAK TUZAĞI. Modal açıkken sekmenin modal içinde kalması (focus trap)
 *     DOM sırası + görünürlükle ilgili; statik olarak güvenilir biçimde çıkarılamaz.
 *   - EKRAN OKUYUCU ÇIKTISI. `aria-label` VAR mı diye bakabiliyoruz; okununca ANLAMLI mı,
 *     bakamıyoruz.
 *   - 320-375px'te GERÇEK AKIŞ. Sabit genişlikleri yakalıyoruz; uzun kelime, esnek kutu taşması
 *     ve tablo kaydırması yalnızca gerçek düzende görünür.
 *   - DOKUNMA HEDEFİ BOYUTU (44×44px). Sınıflardan yaklaşık çıkarılabilir ama iç dolgu, satır
 *     yüksekliği ve ikon boyutu birleşince statik tahmin yanıltıcı olur.
 * Bunlar için tarayıcı tabanlı bir araç (Playwright + axe-core) gerekiyor ve bu ortamda ön yüz
 * derlenemediği için kurulamıyor. Kapatılan boşluk: yukarıdaki 7 başlık artık ölçülüyor ve
 * bozulursa test kırmızı yanıyor.
 */
report("erişilebilirlik (statik)");
