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

if (problems.length === 0) {
  console.log(`✅ tsc + backend + ${suites.length} takım / ${total} test — hepsi geçti`);
  process.exit(0);
}
console.log(`❌ ${problems.length} sorun:\n`);
for (const p of problems) console.log(p + "\n");
process.exit(1);
