/**
 * YÜKLEME HAZIRLIĞI TAKIMI — sarmalayıcı.
 * ------------------------------------------------------------------------------------------------
 * Asıl testler tests/ui/media-upload.ui.mjs içinde. utils/mediaUpload.ts bir TypeScript dosyası
 * olduğu için TSX/TS yükleyicisiyle çalıştırılması gerekiyor (bkz. tests/ui/ts-loader.mjs) ve
 * yükleyici ancak süreç başlarken verilebiliyor. Bu dosya o süreci başlatıp çıktısını aktarıyor,
 * böylece takım diğerleriyle aynı şekilde (dosya adından) bulunuyor.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

if (!existsSync(join(ROOT, "frontend", "node_modules", "typescript"))) {
  console.log("ATLANDI yükleme hazırlığı — frontend/node_modules/typescript yok (önce: cd frontend && npm install)");
  process.exit(0);
}

try {
  const out = execFileSync(process.execPath, [
    "--experimental-loader", join(HERE, "ui", "ts-loader.mjs"),
    join(HERE, "ui", "media-upload.ui.mjs"),
  ], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, NODE_NO_WARNINGS: "1" } });
  console.log(out.trim());
} catch (err) {
  const text = ((err.stdout || "") + (err.stderr || "")).trim();
  console.log(text || `BAŞARISIZ yükleme hazırlığı — ${err.message}`);
  process.exit(1);
}
