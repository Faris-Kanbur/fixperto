// ARAÇ FORMU — marka/model listeleri, yazarak süzme, marka değişince modelin temizlenmesi.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, ok, report } from "./_harness.mjs";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..", "frontend", "src");
const read = (p) => readFileSync(join(SRC, p), "utf8");

// --- Model listesi anahtarları CAR_BRANDS ile BİREBİR aynı olmalı ------------------------------
// Bu sessiz bir hata sınıfı: anahtar "Mercedes" yazılırsa (doğrusu "Mercedes-Benz") kod çalışır,
// tsc susar, ama o markayı seçen kişiye HİÇ model önerisi gelmez.
const brandsSrc = read("data/constants.ts");
const brandsBlock = brandsSrc.slice(brandsSrc.indexOf("export const CAR_BRANDS = ["));
const CAR_BRANDS = [...brandsBlock.slice(0, brandsBlock.indexOf("];")).matchAll(/"([^"]+)"/g)].map((m) => m[1]);
ok(CAR_BRANDS.length >= 20, "CAR_BRANDS okunabildi");

const modelsSrc = read("data/carModels.ts");
const modelKeys = [...modelsSrc.matchAll(/^ {2}(?:"([^"]+)"|([A-Za-z][A-Za-z0-9_]*)):\s*\[/gm)].map((m) => m[1] ?? m[2]);
ok(modelKeys.length >= 20, "model listesi okunabildi");

const unknown = modelKeys.filter((k) => !CAR_BRANDS.includes(k));
eq(unknown, [], "her model anahtarı CAR_BRANDS'te birebir var (yoksa o markada öneri hiç çıkmaz)");
const missing = CAR_BRANDS.filter((b) => !modelKeys.includes(b));
eq(missing, [], "her markanın model listesi var");

// --- Yazarak süzme (ComboBox mantığı) ---------------------------------------------------------
const lc = (v) => String(v ?? "").toLocaleLowerCase("tr-TR");
const filterOptions = (options, value) => {
  const q = lc(value).trim();
  const exact = options.some((o) => lc(o) === q);
  return !q || exact ? options : options.filter((o) => lc(o).includes(q));
};
eq(filterOptions(CAR_BRANDS, "mer"), ["Mercedes-Benz"], "'mer' → Mercedes-Benz");
eq(filterOptions(CAR_BRANDS, "OPE"), ["Opel"], "büyük harf fark etmiyor");
eq(filterOptions(CAR_BRANDS, "ı"), [], "tr-TR küçük harf: 'ı' hiçbir markada geçmiyor");
eq(filterOptions(CAR_BRANDS, "").length, CAR_BRANDS.length, "boş kutu → tüm liste");
eq(filterOptions(CAR_BRANDS, "BMW").length, CAR_BRANDS.length, "tam eşleşme → liste tekrar açılınca hepsi görünür (fikir değiştirilebilsin)");
eq(filterOptions(CAR_BRANDS, "Togg"), [], "listede olmayan marka → öneri yok (ama yazılan değer geçerli kalır)");
eq(filterOptions(["Golf", "Polo", "Passat"], "o"), ["Golf", "Polo"], "model süzme de aynı kuralla çalışıyor");

// --- Marka değişince model temizlenir ---------------------------------------------------------
// Aksi halde "BMW / Clio" gibi imkânsız bir çift kaydedilebilirdi.
const shell = read("app/AppShell.tsx");
const brandHandlers = [...shell.matchAll(/<BrandSelect[^>]*onChange=\{\(b\) => set\w+\(\{[^}]*\}\)\}/g)].map((m) => m[0]);
ok(brandHandlers.length >= 5, "tüm marka seçicileri bulundu");
eq(brandHandlers.filter((h) => !/model:\s*""/.test(h)), [], "marka değişince model temizleniyor");

// --- Araç ekleme oturum gerektirir ------------------------------------------------------------
const provider = read("app/state/AppLogicProvider.tsx");
ok(/const toggleAddVehicle = \(\) => \{[\s\S]*?requireAuth\(/.test(provider), "araç ekleme requireAuth ile kapılanıyor");
eq((shell.match(/setShowAddVehicle\(!showAddVehicle\)/g) || []).length, 0, "kapılanmamış doğrudan açma kalmadı");

report("araç formu");
