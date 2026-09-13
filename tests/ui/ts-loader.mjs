/**
 * TSX'i Node içinde ÇALIŞTIRILABİLİR hâle getiren ESM yükleyicisi.
 * ------------------------------------------------------------------------------------------------
 * NEDEN: bu ortamda vite/esbuild/rollup'ın derlenmiş ikilileri çalışmıyor (başka bir işletim
 * sistemi için kurulmuşlar) ve npm kayıt defterine erişim yok — yani uygulamayı paketleyip
 * tarayıcıda açamıyoruz. Ama React ve TypeScript'in kendisi SAF JavaScript: TypeScript derleyicisi
 * TSX'i JS'e çevirebiliyor, react-dom/server de bileşenleri HTML'e basabiliyor.
 *
 * Bu yükleyici sayesinde bileşenlerin GERÇEK kodu çalışıyor: koşullar, hesaplamalar, hook'ların
 * ilk durumu, erken dönüşler. "Kaynakta şu yazıyor" demekle "bu bileşen bu girdide şunu basıyor"
 * demek arasındaki fark budur.
 *
 * DÜRÜST SINIR: bu bir tarayıcı değil. Tıklama, odak, kaydırma, portal yerleşimi, CSS ve gerçek
 * z-index davranışı BURADA TEST EDİLMİYOR. Bileşenin ilk çizimini test ediyoruz, etkileşimini değil.
 */
import { readFileSync, existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve as resolvePath } from "node:path";
import { createRequire } from "node:module";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const require = createRequire(join(ROOT, "frontend", "package.json"));
const ts = require("typescript");

const APP_STUB = pathToFileURL(join(HERE, "app-stub.mjs")).href;
const EMPTY = "data:text/javascript,export default {}";

/**
 * Göreli import'u gerçek dosyaya bağlar. İki durum var:
 *   - uzantısız (".../MechCard") → .tsx/.ts denenir,
 *   - ".js" ile biten ama kaynağı TypeScript olan ("../data/constants.js") → .ts'e çevrilir.
 * İkincisi ESM'de standart yazım (derlenmiş çıktının adı yazılır); Node ham kaynağı okurken
 * o dosyayı bulamaz, çevirmemiz gerekir.
 */
function withExtension(path) {
  const candidates = [path];
  if (/\.jsx?$/.test(path)) candidates.push(path.replace(/\.jsx?$/, ".tsx"), path.replace(/\.jsx?$/, ".ts"));
  else candidates.push(path + ".tsx", path + ".ts", path + ".jsx", path + ".js", join(path, "index.tsx"), join(path, "index.ts"));
  for (const c of candidates) {
    try { if (existsSync(c) && !statSync(c).isDirectory()) return c; } catch { /* yok */ }
  }
  return null;
}

export async function resolve(specifier, context, next) {
  // Uygulama durumu (context) bütün ekranı içeri çeker; bileşen testinde onu denetimli bir
  // taklitle değiştiriyoruz. Sağlayıcının KENDİSİ ayrı takımlarda ve uçtan uca testlerde denetleniyor.
  if (/app\/state\/AppLogicProvider$/.test(specifier)) return { url: APP_STUB, shortCircuit: true };
  if (/\.css$/.test(specifier)) return { url: EMPTY, shortCircuit: true };
  // Paket import'ları (react, react-dom/server, lucide-react) frontend/node_modules'tan çözülmeli:
  // test dosyaları tests/ altında ve orada node_modules yok.
  if (!specifier.startsWith(".") && !specifier.startsWith("node:") && !specifier.startsWith("data:") && !specifier.startsWith("file:")) {
    try { return { url: pathToFileURL(require.resolve(specifier)).href, shortCircuit: true }; }
    catch { /* çözülemedi: Node'un kendi mekanizmasına bırak */ }
  }
  if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
    const base = dirname(fileURLToPath(context.parentURL));
    const hit = withExtension(resolvePath(base, specifier));
    if (hit) return { url: pathToFileURL(hit).href, format: "module", shortCircuit: true };
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (/\.tsx?$/.test(url)) {
    const source = readFileSync(fileURLToPath(url), "utf8");
    const out = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.ReactJSX,
        jsxImportSource: "react",
        esModuleInterop: true,
      },
      fileName: fileURLToPath(url),
    });
    return { format: "module", source: out.outputText, shortCircuit: true };
  }
  return next(url, context);
}
