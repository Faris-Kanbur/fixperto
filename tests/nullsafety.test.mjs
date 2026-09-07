// NULL GÜVENLİĞİ — gerçek kaynak üzerinde statik denetim.
// Bu proje TSX içinde tipsiz JS kullanıyor, dolayısıyla tsc `m.specialty.toLowerCase()` gibi bir
// çağrıyı NULL riski açısından denetleyemiyor. Yaşanan hata: veritabanında NULL kalan tek bir
// sütun ("Cannot read properties of null") tamirci/araç/ilan aramalarının ÜÇÜNÜ birden çökertti.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, report } from "./_harness.mjs";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..", "frontend", "src");
const FILES = ["app/state/AppLogicProvider.tsx", "app/AppShell.tsx",
               "components/features/MechDetailBody.tsx", "components/features/ListingCard.tsx",
               "components/features/MechCard.tsx", "components/features/JobCard.tsx"];

// Veri alanı üzerinde KORUMASIZ metin/sayı metodu: obj.alan.method()
// Güvenli sayılanlar: lc(...), String(...), (x || "").method(), formatNumber/formatDistanceKm.
const RISKY = /(?<![\w.)"'`\]])\b([a-z]\w*)\.(\w+)\.(toLowerCase|toLocaleLowerCase|toUpperCase|toFixed|trim|split|padStart|charAt|localeCompare)\(/g;
// Bilinçli istisnalar: sabit/kod alanları (veriden gelmiyor) ya da zaten garanti dolu olanlar.
const ALLOW = new Set([
  "e.target.value", "reader.result", "err.message", "e.key", "item.label",
  "search.query", "search.locationQuery", "search.serviceQuery", "search.name",
  "adminForm.email", "adminForm.password", "newServiceForm.name", "newServiceForm.price",
  "sellForm.price", "jobForm.title", "quoteOfferForm.price", "form.email", "form.name",
  "form.phone", "form.password", "passwordForm.current", "passwordForm.next",
  "newTicketForm.subject", "newTicketForm.description", "broadcastForm.message",
  "jobApplyInfo.email", "jobApplyInfo.phone", "jobApplyInfo.name", "newVehicle.plate",
  "editVehicleForm.plate", "newReminderForm.label", "reminderEditForm.date",
  "listingFilters.color", "f.color", "filters.service", "cat.tr", "it.tr",
  "servicePickerQuery.trim", "bookingServiceSearch.trim",
  // Aşağıdakiler tamamen İSTEMCİ TARAFI form state'i: hepsi "" ile başlatılıyor ve yalnızca
  // input onChange ile yazılıyor, hiçbir zaman veritabanından gelmiyor — NULL olamazlar.
  "adminEditForm.newPassword", "newReminderForm.title", "reviewForm.comment",
  "newTicketForm.relatedNote", "jobForm.requirements", "jobForm.skills",
  "jobApplyInfo.address", "paymentForm.cardNumber",
  // appt.time zaten bir satır önce `if (appt.time)` ile korunuyor.
  "appt.time",
]);

const hits = [];
for (const rel of FILES) {
  const lines = readFileSync(join(SRC, rel), "utf8").split("\n");
  lines.forEach((l, i) => {
    const s = l.trim();
    if (s.startsWith("//") || s.startsWith("*") || s.startsWith("/*")) return;
    for (const m of l.matchAll(RISKY)) {
      const expr = `${m[1]}.${m[2]}`;
      if (ALLOW.has(expr)) continue;
      // `(x.y || "").method()` ve `String(x.y).method()` biçimleri zaten güvenli
      const before = l.slice(Math.max(0, m.index - 12), m.index);
      if (/\(\s*$/.test(before) && /\|\|\s*""\s*\)/.test(l.slice(m.index, m.index + 60))) continue;
      hits.push(`${rel}:${i + 1} ${expr}.${m[3]}()`);
    }
  });
}
eq(hits, [], "veri alanlarında korumasız metin/sayı metodu olmamalı (lc()/String() kullanın)");

report("null-güvenliği");
