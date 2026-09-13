#!/usr/bin/env node
// TEK KOMUT: node tests/run.mjs
// Her değişiklikten sonra çalıştırılır. Çıktı bilinçli olarak KISA — her şey yolundaysa tek satır.
// Bir şey bozulduğunda ise tam ayrıntı basılır (o an gürültü zaten istenir).
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const run = (cmd, args, cwd) => {
  try { return { ok: true, out: execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) }; }
  catch (e) { return { ok: false, out: (e.stdout || "") + (e.stderr || "") }; }
};

const problems = [];
let total = 0;

// 1) Tip denetimi — tanımsız değişken, yanlış imza, eksik prop.
const tsc = run("npx", ["tsc", "--noEmit"], join(ROOT, "frontend"));
if (!tsc.ok) problems.push("tsc:\n" + tsc.out.trim());

// 2) Backend sözdizimi — her dosya ayrı ayrı.
const backendFiles = ["server.js", ...readdirSync(join(ROOT, "backend/routes")).map(f => "routes/" + f),
  ...readdirSync(join(ROOT, "backend/db")).filter(f => f.endsWith(".js")).map(f => "db/" + f),
  ...readdirSync(join(ROOT, "backend/utils")).map(f => "utils/" + f)];
for (const f of backendFiles) {
  const r = run("node", ["--check", f], join(ROOT, "backend"));
  if (!r.ok) problems.push(`backend ${f}:\n` + r.out.trim());
}

// 3) Test takımları — dosya eklemek yeterli, listeye yazmaya gerek yok.
const suites = readdirSync(HERE).filter(f => f.endsWith(".test.mjs")).sort();
for (const s of suites) {
  const r = run("node", [join(HERE, s)], ROOT);
  const line = r.out.trim();
  const m = line.match(/\((\d+)\)/);
  if (m) total += Number(m[1]);
  if (!r.ok) problems.push(line);
}

/**
 * 4) UÇTAN UCA — gerçek Express sunucusu, gerçek SQLite, gerçek HTTP.
 * ------------------------------------------------------------------------------------------------
 * Yukarıdaki takımlar STATİK: kaynak kodu okuyup kural ihlali arıyorlar. Değerliler ama bir şeyi
 * yapamıyorlar — kodu ÇALIŞTIRMIYORLAR. Bu bölüm sunucuyu geçici bir veritabanıyla ayağa kaldırıp
 * istekleri gerçekten atıyor ve sonucu VERİTABANINDAN doğruluyor; "ekranda başarı yazdı ama hiçbir
 * şey kaydedilmedi" sınıfı hatalar ancak böyle yakalanıyor (bu denetimde 6 tanesi böyle bulundu).
 *
 * better-sqlite3 bu ortamda derlenemediği için `--experimental-loader` ile o modül isteği
 * node:sqlite üzerine kurulu bir adaptöre yönlendiriliyor; UYGULAMA KODU DEĞİŞMİYOR.
 * Her takım kendi portunu kullanıyor ki paralel çalıştırmada çakışmasınlar.
 */
const e2eSuites = readdirSync(join(HERE, "e2e")).filter(f => f.endsWith(".e2e.mjs")).sort();
e2eSuites.forEach((s, i) => {
  const r = (() => {
    try {
      return { ok: true, out: execFileSync("node", [join(HERE, "e2e", s)], {
        cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, E2E_PORT: String(4400 + i) },
      }) };
    } catch (e) { return { ok: false, out: (e.stdout || "") + (e.stderr || "") }; }
  })();
  const line = r.out.split("\n").filter(l => !/ExperimentalWarning|trace-warnings/.test(l)).join("\n").trim();
  const m = line.match(/\((\d+)\)/);
  if (m) total += Number(m[1]);
  if (!r.ok) problems.push(`e2e ${s}:\n` + line);
});

// 5) Envanter — istemcinin çağırdığı her yolun sunucuda karşılığı var mı (buton var, uç yok?).
const inv = run("node", [join(HERE, "e2e", "inventory.mjs")], ROOT);
if (!inv.ok) problems.push("envanter:\n" + inv.out.trim());

if (problems.length === 0) {
  console.log(`✅ tsc + backend + envanter + ${suites.length} statik + ${e2eSuites.length} uçtan uca takım / ${total} test — hepsi geçti`);
  process.exit(0);
}
console.log(`❌ ${problems.length} sorun:\n`);
for (const p of problems) console.log(p + "\n");
process.exit(1);
