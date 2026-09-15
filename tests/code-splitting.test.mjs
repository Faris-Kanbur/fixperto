/**
 * KOD BÖLME TAKIMI — sarmalayıcı.
 * ------------------------------------------------------------------------------------------------
 * Asıl testler tests/ui/code-splitting.ui.mjs içinde: TypeScript kaynağını hem derliyor hem
 * ÇALIŞTIRIYOR (PDF gerçekten üretiliyor), bu yüzden TS yükleyicisi gerekiyor ve yükleyici ancak
 * süreç başlarken verilebiliyor.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

for (const dep of ["typescript", "jspdf", "jspdf-autotable"]) {
  if (!existsSync(join(ROOT, "frontend", "node_modules", dep))) {
    console.log(`ATLANDI kod bölme — frontend/node_modules/${dep} yok (önce: cd frontend && npm install)`);
    process.exit(0);
  }
}

try {
  const out = execFileSync(process.execPath, [
    "--experimental-loader", join(HERE, "ui", "ts-loader.mjs"),
    join(HERE, "ui", "code-splitting.ui.mjs"),
  ], {
    // frontend klasöründen çalışıyor: "jspdf" gibi paket isimleri oradan çözülüyor.
    cwd: join(ROOT, "frontend"), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_NO_WARNINGS: "1" },
  });
  console.log(out.trim());
} catch (err) {
  const text = ((err.stdout || "") + (err.stderr || "")).trim();
  console.log(text || `BAŞARISIZ kod bölme — ${err.message}`);
  process.exit(1);
}
