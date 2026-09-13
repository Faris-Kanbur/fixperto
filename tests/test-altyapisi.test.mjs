/**
 * TEST ALTYAPISININ KENDİSİNİ DENETLEYEN TAKIM.
 * ---------------------------------------------------------------------------------------------
 * NEDEN VAR: uçtan uca takımların ilk sürümü geliştirme ortamına özel bir çözümü (Node 22'nin
 * yerleşik node:sqlite'ı) TEK yol olarak yazmıştı. Sonuç: benim ortamımda yeşil, kullanıcının
 * Node 20 kurulu makinesinde "No such built-in module: node:sqlite" ile patladı. Bu, testin en
 * kötü türden hatasıdır — testin kendisi bozukken kod hakkında hiçbir şey öğrenemezsin.
 *
 * Buradaki kurallar o hatanın geri gelmesini engelliyor:
 *   1) Sürücü ÇALIŞMA ANINDA seçilir; node:sqlite üst seviyede import EDİLMEZ.
 *   2) Makinede better-sqlite3 varsa sunucu yükleyici numarası olmadan, üretimdeki hâliyle başlar.
 *   3) Hiçbir sürücü yoksa takım hata vermez, sebebini yazıp atlar.
 *   4) Her takım kendi portunu ve kendi veritabanı dosyasını kullanır.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...p) => readFileSync(join(ROOT, ...p), "utf8");

let passed = 0;
const failures = [];
const ok = (v, name) => { if (v) passed++; else failures.push(name); };
const eq = (a, b, name) => ok(JSON.stringify(a) === JSON.stringify(b), `${name} — beklenen ${JSON.stringify(b)}, gelen ${JSON.stringify(a)}`);

const harness = read("tests", "e2e", "harness.mjs");
const runner = read("tests", "run.mjs");

// 1) node:sqlite ÜST SEVİYEDE import edilmemeli — o satır Node 20'de dosyayı okunmadan patlatır.
eq(/^import .*from "node:sqlite"/m.test(harness), false,
  "harness node:sqlite'ı üst seviyede import etmiyor (Node 20'de çöktürürdü)");
ok(/function pickDriver\(\)/.test(harness), "sürücü çalışma anında seçiliyor");
ok(/requireFromRoot\("better-sqlite3"\)/.test(harness), "önce gerçek better-sqlite3 deneniyor");
ok(/requireFromRoot\("node:sqlite"\)/.test(harness), "yedek olarak node:sqlite deneniyor");
// Sadece import etmek yetmez: bozuk bir ikili import edilebilir ama açılamaz.
ok(/new Better\(":memory:"\)/.test(harness), "better-sqlite3 ikilisi gerçekten AÇILARAK sınanıyor");

// 2) better-sqlite3 varsa yükleyici devreye girmemeli: test edilen şey üretimdeki şey olmalı.
ok(/DRIVER\?\.kind === "node:sqlite"[\s\S]{0,160}--experimental-loader/.test(harness),
  "yükleyici YALNIZCA node:sqlite yedeğinde kullanılıyor");

// 3) Sürücü yoksa hata değil, açıklamalı atlama.
ok(/export function skipIfUnsupported/.test(harness), "atlama yolu var");
ok(/Node 22\+ gerekir/.test(harness), "atlama mesajı sebebi söylüyor");
for (const f of readdirSync(join(ROOT, "tests", "e2e")).filter((x) => x.endsWith(".e2e.mjs"))) {
  const src = read("tests", "e2e", f);
  ok(/skipIfUnsupported\(/.test(src), `${f} atlama kontrolünü çağırıyor`);
  ok(src.indexOf("skipIfUnsupported(") < src.indexOf("await startServer()"),
    `${f} atlama kontrolünü sunucuyu başlatmadan ÖNCE yapıyor`);
}

// 4) Takımlar birbirinin ayağına basmamalı: port da veritabanı dosyası da ayrı.
ok(/E2E_PORT/.test(harness) && /E2E_PORT/.test(runner), "port dışarıdan veriliyor");
ok(/fixperto-e2e-\$\{PORT\}\.sqlite/.test(harness), "veritabanı dosyası porta bağlı (çakışma yok)");
ok(/TMPDIR/.test(harness), "geçici dizin işletim sistemine bırakılıyor (macOS'ta /tmp değil)");

// 5) Koşucu uçtan uca takımları ve envanteri gerçekten çalıştırıyor mu?
ok(/e2e"\)\)\.filter\(f => f\.endsWith\("\.e2e\.mjs"\)\)/.test(runner), "run.mjs uçtan uca takımları buluyor");
ok(/inventory\.mjs/.test(runner), "run.mjs envanter taramasını çalıştırıyor");

// 6) Adaptör yalnızca testlerde; uygulama kodu ona hiç dokunmamalı.
const backendFiles = ["server.js", ...readdirSync(join(ROOT, "backend/routes")).map((f) => "routes/" + f),
  ...readdirSync(join(ROOT, "backend/db")).filter((f) => f.endsWith(".js")).map((f) => "db/" + f),
  ...readdirSync(join(ROOT, "backend/utils")).map((f) => "utils/" + f)];
const leaking = backendFiles.filter((f) => /sqlite-adapter|node:sqlite|E2E_PORT/.test(read("backend", f)));
eq(leaking, [], "uygulama kodu test adaptöründen habersiz (test için üretim kodu esnetilmemiş)");

if (failures.length === 0) {
  console.log(`OK test altyapısı (${passed})`);
  process.exit(0);
}
console.log(`BAŞARISIZ test altyapısı — ${failures.length}/${passed + failures.length}`);
for (const f of failures) console.log("  ✗ " + f);
process.exit(1);
