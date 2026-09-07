// Minik test koşucusu. Bilinçli olarak SESSİZ: geçen testler hiçbir şey yazdırmıyor.
// Amaç, her değişiklikten sonra tam takımı çalıştırıp ekrana tek satır özet düşürmek.
// Sadece BAŞARISIZ testler ayrıntılı yazdırılır — arıza varsa gürültü zaten istenir.
let passed = 0;
const failures = [];

export function eq(actual, expected, name) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  else failures.push(`${name}\n    beklenen: ${JSON.stringify(expected)}\n    gelen   : ${JSON.stringify(actual)}`);
}

export function ok(value, name) { eq(!!value, true, name); }

/** Çökmemesi gereken kod: fırlatırsa test düşer, dönen değer opsiyonel karşılaştırılır. */
export function noThrow(fn, name, expected) {
  try {
    const got = fn();
    if (expected === undefined) passed++;
    else eq(got, expected, name);
  } catch (e) {
    failures.push(`${name}\n    ÇÖKTÜ: ${e.message}`);
  }
}

/** FırlatMASI beklenen kod (ör. eski hatalı kodun hâlâ çöktüğünü kanıtlamak). */
export function throws(fn, name) {
  try { fn(); failures.push(`${name}\n    fırlatması bekleniyordu ama fırlatmadı`); }
  catch { passed++; }
}

export function report(suiteName) {
  if (failures.length === 0) { console.log(`OK ${suiteName} (${passed})`); process.exit(0); }
  console.log(`BAŞARISIZ ${suiteName} — ${failures.length}/${passed + failures.length}`);
  for (const f of failures) console.log("  ✗ " + f);
  process.exit(1);
}
