/**
 * ARAYÜZ ÇİZİM TAKIMI — sarmalayıcı.
 * ------------------------------------------------------------------------------------------------
 * Asıl testler tests/ui/render.ui.mjs içinde; TSX'i çalıştırabilmek için özel bir ESM yükleyicisi
 * gerekiyor (tests/ui/ts-loader.mjs) ve yükleyici ancak süreç başlarken verilebiliyor. Bu dosya
 * o süreci başlatıp çıktısını olduğu gibi aktarıyor, böylece takım diğerleriyle aynı şekilde
 * (tests/run.mjs tarafından, dosya adından) bulunuyor.
 *
 * React ve TypeScript saf JavaScript olduğu için bu takım her makinede çalışır; frontend
 * bağımlılıkları kurulu değilse hata vermek yerine sebebini yazıp atlar.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

for (const dep of ["react", "react-dom", "typescript"]) {
  if (!existsSync(join(ROOT, "frontend", "node_modules", dep))) {
    console.log(`ATLANDI arayüz çizimi — frontend/node_modules/${dep} yok (önce: cd frontend && npm install)`);
    process.exit(0);
  }
}

try {
  const out = execFileSync(process.execPath, [
    "--experimental-loader", join(HERE, "ui", "ts-loader.mjs"),
    join(HERE, "ui", "render.ui.mjs"),
  ], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, NODE_NO_WARNINGS: "1" } });
  console.log(out.trim());
} catch (err) {
  const text = ((err.stdout || "") + (err.stderr || "")).trim();
  console.log(text || `BAŞARISIZ arayüz çizimi — ${err.message}`);
  process.exit(1);
}
