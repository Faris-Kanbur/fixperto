/**
 * KOD BÖLME (Faz 6) — NE DOĞRULANABİLİYOR, NE DOĞRULANAMIYOR.
 * ================================================================================================
 * DÜRÜST SINIR, ÖNCE BU:
 * Bu ortamda ön yüz DERLENEMİYOR. `vite build` rollup'ın yerel ikilisini istiyor ve kurulu olan
 * darwin-arm64 (bu makine linux-aarch64); esbuild için de aynı durum, npm kayıt defterine erişim
 * de yok. Yani:
 *   ❌ PAKET BOYUTU ÖLÇÜLEMİYOR. "İlk paket şu kadar küçüldü" diyemem — o sayıyı üretecek
 *      araç çalışmıyor. Aşağıda verilen boyutlar node_modules'daki GERÇEK dağıtım dosyalarının
 *      boyutları, yani bölünen kodun büyüklüğü; paketleyicinin son çıktısı değil.
 *   ❌ PARÇANIN TARAYICIDA İNDİĞİ doğrulanamıyor. Bunun için gerçek bir tarayıcı gerekiyor.
 *   ✅ DİNAMİK IMPORT'UN ÇÖZÜLDÜĞÜ ve PDF'in HÂLÂ ÜRETİLDİĞİ doğrulanabiliyor — aşağıda
 *      işlev gerçekten çağrılıyor ve çıktı denetleniyor. Kod bölmenin en sinsi hatası budur:
 *      düğme sessizce hiçbir şey yapmaz.
 *   ✅ SUSPENSE SINIRININ VAR OLDUĞU doğrulanabiliyor. `React.lazy`yi sınırsız bırakmak çalışma
 *      zamanında hata (beyaz ekran) demek; sınır kaynakta denetleniyor.
 *   ✅ STATİK BAĞIMLILIĞIN GERÇEKTEN KALKTIĞI doğrulanabiliyor. `import type` çalışma zamanında
 *      hiçbir şey getirmiyor; derlenmiş çıktıya bakarak kanıtlanıyor.
 */
const ROOT = new URL("../../", import.meta.url).pathname;

let passed = 0;
const failures = [];
const ok = (v, name) => { if (v) passed++; else failures.push(name); };
const eq = (got, want, name) => ok(got === want, `${name} (beklenen: ${want}, gelen: ${got})`);

const fs = await import("node:fs");
const path = await import("node:path");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

// ============================================================ 1) STATİK BAĞIMLILIK KALKTI MI
/**
 * Asıl soru: paketleyici jspdf'i ana pakete koymak ZORUNDA mı? Zorunda olması için üst düzeyde
 * bir DEĞER importu gerekir. `import type` tip bilgisi taşır ve TypeScript onu SİLER.
 * Bunu iddia etmek yeterli değil — derleyiciye derletip çıktıda jspdf var mı diye bakıyoruz.
 */
const reportSrc = read("frontend/src/utils/analyticsReport.ts");
ok(!/^import\s+\{\s*jsPDF\s*\}\s+from\s+"jspdf"/m.test(reportSrc),
  "üst düzeyde DEĞER olarak jspdf importu kalmadı");
ok(/^import type \{ jsPDF \} from "jspdf";$/m.test(reportSrc),
  "jsPDF yalnızca TİP olarak içe alınıyor (çalışma zamanında hiçbir şey getirmez)");
ok(!/^import\s+autoTable\s+from/m.test(reportSrc), "üst düzey autoTable importu kalmadı");
ok(/await Promise\.all\(\[\s*\n?\s*import\("jspdf"\)/.test(reportSrc) || /import\("jspdf"\)/.test(reportSrc),
  "jspdf dinamik import ile getiriliyor");
ok(/import\("jspdf-autotable"\)/.test(reportSrc), "jspdf-autotable dinamik import ile getiriliyor");
// İkisi PARALEL yüklenmeli: sırayla beklemek gecikmeyi iki katına çıkarır.
ok(/Promise\.all\(/.test(reportSrc), "iki modül paralel yükleniyor (sıralı beklemek gecikmeyi ikiye katlardı)");

/** DERLENMİŞ ÇIKTIYI DENETLE — iddia değil, kanıt. */
{
  const { createRequire } = await import("node:module");
  const require_ = createRequire(path.join(ROOT, "frontend", "package.json"));
  const ts = require_("typescript");
  const out = ts.transpileModule(reportSrc, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.Preserve },
  }).outputText;
  // Derlenmiş çıktıda jspdf yalnızca DİNAMİK import içinde görünmeli.
  const staticImports = [...out.matchAll(/^\s*import\s[^\n]*from\s+["']([^"']+)["']/gm)].map((m) => m[1]);
  ok(!staticImports.includes("jspdf"), `derlenmiş çıktıda statik jspdf importu YOK (bulunanlar: ${staticImports.join(", ") || "yok"})`);
  ok(!staticImports.includes("jspdf-autotable"), "derlenmiş çıktıda statik jspdf-autotable importu YOK");
  ok(/import\("jspdf"\)/.test(out), "derlenmiş çıktıda dinamik jspdf importu VAR");
}

// ============================================================ 2) BÖLÜNEN KODUN BÜYÜKLÜĞÜ
/**
 * Bu ölçüm GERÇEK: node_modules'daki dağıtım dosyalarının boyutu. Paketleyicinin son çıktısı
 * değil (o ölçülemiyor, bkz. dosya başı) ama "ne kadar kod ayrıldı" sorusunun dürüst cevabı.
 * Sayıyı teste koymanın sebebi: bağımlılık bir gün küçülür ya da büyürse karar yeniden
 * değerlendirilsin — 400 KB'lık bir parçayı ayırmak değer, 20 KB'lık bir parçayı ayırmak
 * karmaşıklıktan başka bir şey getirmez.
 */
{
  const sizeOf = (p) => { try { return fs.statSync(path.join(ROOT, "frontend", "node_modules", p)).size; } catch { return 0; } };
  const jspdfSize = sizeOf("jspdf/dist/jspdf.es.min.js");
  const autoSize = sizeOf("jspdf-autotable/dist/jspdf.plugin.autotable.min.js");
  if (jspdfSize === 0) {
    ok(true, "jspdf dağıtım dosyası yok — boyut ölçümü atlandı (bağımlılıklar kurulu değil)");
  } else {
    ok(jspdfSize > 200 * 1024, `jspdf gerçekten büyük: ${Math.round(jspdfSize / 1024)} KB (bölmeye değer)`);
    ok(autoSize > 10 * 1024, `jspdf-autotable: ${Math.round(autoSize / 1024)} KB`);
    ok(jspdfSize + autoSize > 300 * 1024,
      `ayrılan toplam kod ${Math.round((jspdfSize + autoSize) / 1024)} KB — ilk pakette olmasının karşılığı yoktu`);
  }
  // El kitabı verisi: bölmenin ikinci gerekçesi.
  const handbookSize = fs.statSync(path.join(ROOT, "frontend/src/data/handbook.ts")).size;
  ok(handbookSize > 100 * 1024, `el kitabı verisi ${Math.round(handbookSize / 1024)} KB (yönetici dışı hiç kimse görmüyor)`);
}

// ============================================================ 3) PDF HÂLÂ ÜRETİLİYOR MU (GERÇEK ÇAĞRI)
/**
 * KOD BÖLMENİN EN SİNSİ HATASI: dinamik import çalışma zamanında çözülmez ve düğme SESSİZCE
 * hiçbir şey yapmaz. Derleme yapamadığım için paket boyutunu ölçemiyorum, ama BU'nu ölçebiliyorum
 * ve daha önemlisi bu — bozuk bir düğme, büyük bir paketten kötüdür.
 *
 * jspdf Node'da çalışıyor (saf JS). `save()` tarayıcıda dosya indirir; burada onu yakalayıp
 * gerçekten bir PDF üretildiğini denetliyoruz.
 */
{
  /**
   * İLK DENEMEM ÇALIŞMADI VE SEBEBİ ÖĞRETİCİ: `jsPDF.prototype.save`i yamalayıp "PDF üretildi mi"
   * diye bakmaya çalıştım. jsPDF her metodu (save dâhil) ÖRNEĞİN KENDİ ÖZELLİĞİ olarak atıyor,
   * prototipte hiçbiri yok — yani dışarıdan yamalamak imkânsız ve testim sessizce hiçbir şey
   * yakalamadı (save çağrı sayısı: 0), ama "hata vermedi" diye yeşil yanabilirdi.
   *
   * Çözüm testi zorlamak değil, İŞLEVİ GÖZLEMLENEBİLİR YAPMAK oldu: artık ne ürettiğini
   * döndürüyor (dosya adı + sayfa sayısı). İkisi de zaten hesaplanmış değerler, ek maliyet yok,
   * ve test-özel bir kanca da değil.
   *
   * BU TESTİN KANITLADIĞI: dinamik import çözülüyor, autoTable çağrılabilir hâlde bulunuyor,
   * işlev baştan sona çalışıyor ve sayfa üretiyor.
   * KANITLAMADIĞI: tarayıcıda parçanın ayrı bir dosya olarak indiği (derleme yapılamıyor).
   */
  const mod = await import(ROOT + "frontend/src/utils/analyticsReport.ts");
  /**
   * GEÇİCİ KLASÖRE GEÇ — jsPDF'in `save()`i Node'da ÇALIŞMA KLASÖRÜNE DOSYA YAZIYOR.
   * Bunu fark etmemin yolu hoş değildi: test iki PDF'i frontend/ klasörüne bıraktı ve onlar
   * commit'e girdi. Bir test, çalıştığı depoya iz BIRAKMAMALI — bıraktığı iz bir gün birinin
   * "bu dosya ne" diye sorduğu, sonra da depoya yerleşen çöp olur.
   * Modül çözümlemesi dosya URL'sine göre yapıldığı için klasör değiştirmek import'ları bozmuyor.
   */
  const os = await import("node:os");
  const cwdBefore = process.cwd();
  process.chdir(os.tmpdir());
  try {
  eq(mod.generateAnalyticsPdf.constructor.name, "AsyncFunction",
    "işlev async (jspdf'i beklemek zorunda)");

  // Etiketler: her anahtar kendi adını döndüren bir vekil — 40 ayrı etiketi elle yazmaya gerek yok.
  const labels = new Proxy({}, { get: (_t, k) => String(k) });
  const result = await mod.generateAnalyticsPdf({
    mechanicName: "Test Oto", mechanicSpecialty: "Motor", rangeLabel: "Tüm zamanlar",
    generatedAtLabel: "15 Eylül 2026 10:00", totalBooked: 12, completedCount: 9,
    cancelledCount: 2, noShowCount: 1, completionRate: 75, avgRating: 4.6, reviewCount: 8,
    totalEarnings: 45000,
    topServices: [{ name: "Yağ değişimi", count: 5, total: 2500 }, { name: "Fren", count: 3, total: 4200 }],
    rangeViews: 340, rangeConversions: 21, viewConvRate: 6,
    totalSharesAllTime: 14, activeListingsCount: 3, totalApplicantsCount: 2,
    labels,
  });

  ok(!!result, "işlev ne ürettiğini döndürüyor");
  ok(typeof result?.fileName === "string" && result.fileName.endsWith(".pdf"),
    `dosya adı döndü: ${result?.fileName}`);
  ok(/^fixperto-analiz-raporu-/.test(result?.fileName || ""), "dosya adı beklenen biçimde");
  /**
   * SAYFA SAYISI İŞİN GERÇEKTEN YAPILDIĞININ KANITI: autoTable çözümlemesi başarısız olsaydı
   * işlev açık bir hata fırlatırdı (yukarıdaki throw); tablolar çizilmediyse sayfa da oluşmaz.
   */
  ok(Number.isInteger(result?.pageCount) && result.pageCount >= 1,
    `PDF gerçekten sayfa içeriyor (${result?.pageCount} sayfa)`);

  /**
   * TABLOLARIN GERÇEKTEN ÇİZİLDİĞİNİ NASIL KANITLARIM:
   * İlk hâlde "sayfa sayısı >= 2" yazmıştım ve bu bir VARSAYIMDI — küçük veri kümesi tek sayfaya
   * sığıyor, test haklı olarak kırmızı yandı. Sayıyı düşürüp geçmek kolay olurdu ama o zaman test
   * hiçbir şey kanıtlamazdı.
   * Doğru kanıt: VERİ MİKTARINI ARTIRIP sayfa sayısının arttığını görmek. autoTable hiç
   * çalışmasaydı satır sayısının sayfa sayısına etkisi olmazdı.
   */
  const many = Array.from({ length: 80 }, (_, i) => ({ name: `Hizmet ${i + 1}`, count: i, total: i * 100 }));
  const big = await mod.generateAnalyticsPdf({
    mechanicName: "Test Oto", mechanicSpecialty: "Motor", rangeLabel: "Tüm zamanlar",
    generatedAtLabel: "15 Eylül 2026 10:00", totalBooked: 12, completedCount: 9,
    cancelledCount: 2, noShowCount: 1, completionRate: 75, avgRating: 4.6, reviewCount: 8,
    totalEarnings: 45000, topServices: many,
    rangeViews: 340, rangeConversions: 21, viewConvRate: 6,
    totalSharesAllTime: 14, activeListingsCount: 3, totalApplicantsCount: 2,
    labels,
  });
  ok(big.pageCount > result.pageCount,
    `80 satırlık tablo sayfa sayısını artırdı (${result.pageCount} → ${big.pageCount}) — autoTable gerçekten çiziyor`);
  } finally {
    process.chdir(cwdBefore);
  }
}

/**
 * autoTable ÇÖZÜMLEYİCİSİ İKİ ORTAMI DA KAPSIYOR MU.
 * Node'un CJS köprüsünde işlev `m.default.default` içinde; paketleyicinin ESM çıktısında
 * `m.default` doğrudan işlev. (Bunu Node'da çalıştırarak buldum — "autoTable is not a function".
 * Tarayıcıda da olacağının KANITI değil; ama iki şekli de kapsamak varsaymaktan iyi.)
 */
{
  ok(/m\?\.default\?\.default, m\?\.default, m/.test(reportSrc),
    "autoTable çözümlemesi üç olası şekli de deniyor");
  ok(/jspdf-autotable yüklenemedi/.test(reportSrc),
    "hiçbiri işlev değilse SESSİZ kalmıyor, açık hata veriyor");
}

// ============================================================ 4) SUSPENSE SINIRI VAR MI
/**
 * `React.lazy` bir Suspense sınırı OLMADAN çalışma zamanında hata fırlatır — kullanıcı açısından
 * beyaz ekran. Bu, kod bölmenin ikinci klasik hatası ve derleyici yakalamıyor (tip olarak geçerli).
 * O yüzden kaynakta denetleniyor.
 */
{
  const shell = read("frontend/src/app/AppShell.tsx");
  /**
   * DEĞİŞTİ: eskiden import SATIRININ TAMAMI birebir aranıyordu. Erişilebilirlik düzeltmesinde
   * aynı satıra `useEffect` eklenince test kırıldı — oysa kod bölme hiç bozulmamıştı. Bir import
   * listesine yeni bir ad eklemek normal bir iş; testin ölçmesi gereken şey satırın metni değil
   * İKİ ADIN da içe alınmış olması.
   */
  const reactImport = /import \{([^}]*)\} from "react";/.exec(shell)?.[1] || "";
  ok(/\blazy\b/.test(reactImport) && /\bSuspense\b/.test(reactImport), "lazy ve Suspense içe alınmış");
  ok(/const HandbookPanel = lazy\(\(\) => import\("\.\.\/components\/features\/HandbookPanel"\)/.test(shell),
    "HandbookPanel lazy ile yükleniyor");
  ok(!/^import \{ HandbookPanel \}/m.test(shell), "statik HandbookPanel importu kaldırıldı");

  /**
   * SINIRIN KULLANIM YERİNİ SARDIĞINI denetle: yalnızca "Suspense dosyada geçiyor" demek yetmez,
   * lazy bileşenin ÇEVRESİNDE olması gerekiyor.
   */
  const useMatch = shell.match(/adminTab === "handbook" && \(([\s\S]{0,900}?)\)\}/);
  ok(!!useMatch, "el kitabı sekmesinin kullanım yeri bulundu");
  const block = useMatch?.[1] || "";
  ok(/<Suspense/.test(block) && /<HandbookPanel \/>/.test(block),
    "HandbookPanel bir Suspense sınırının İÇİNDE çiziliyor");
  ok(/fallback=/.test(block), "Suspense'in yedek içeriği var (boş ekran değil)");
  // Her lazy bileşen için bir sınır olmalı: sayıları karşılaştır.
  const lazyCount = (shell.match(/= lazy\(/g) || []).length;
  const suspenseCount = (shell.match(/<Suspense/g) || []).length;
  ok(suspenseCount >= lazyCount, `her lazy bileşen için Suspense sınırı var (${lazyCount} lazy, ${suspenseCount} sınır)`);
}

// ============================================================ 5) BÖLÜNMEYENLER — KARAR KAYITTA
/**
 * Bölmemek de bir karar ve gerekçesi olmalı. Bu kontroller "şunu da böl" diyen birine sebebini
 * gösteriyor.
 */
{
  const shell = read("frontend/src/app/AppShell.tsx");
  // i18n her ekranda gerekiyor: bölmek ilk çizimi geciktirirdi, hızlandırmazdı.
  ok(/from "\.\.\/data\/i18n"/.test(shell), "i18n statik kaldı (her ekranda gerekiyor, bölmek ilk çizimi geciktirirdi)");
  // Yönetici paneli ayrı bileşen DEĞİL: ayırmak büyük refactor olurdu.
  ok(/adminTab === "handbook"/.test(shell),
    "yönetici paneli hâlâ AppShell içinde — ayırmak büyük refactor olur, bu denetimin kuralına aykırı");
  ok(/büyük bir refactor|büyük refactor/.test(shell), "bölünmeyen yönetici panelinin gerekçesi kodda yazılı");
}

// ============================================================ 6) DÜRÜST SINIR YAZILI MI
{
  const self = read("tests/ui/code-splitting.ui.mjs");
  ok(/PAKET BOYUTU ÖLÇÜLEMİYOR/.test(self), "derleme yapılamadığı ve paket boyutunun ölçülemediği yazılı");
  const handbook = read("frontend/src/data/handbook.ts");
  ok(/derlenemiyor|derleme yapılamıyor|paket boyutu ölçülemiyor/i.test(handbook),
    "el kitabında da bu sınır yazılı");
}

if (failures.length === 0) {
  console.log(`OK kod bölme (${passed})`);
  process.exit(0);
}
console.log(`BAŞARISIZ kod bölme — ${failures.length}/${passed + failures.length}`);
for (const f of failures) console.log("  ✗ " + f);
process.exit(1);
