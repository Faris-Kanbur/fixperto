// GEZİNME — tarayıcı geri/ileri tuşları (AppLogicProvider'daki history yığınının kopyası).
import { eq, report } from "./_harness.mjs";

function makeApp(initial) {
  let state = { ...initial };
  const stack = []; let index = 0; const hist = []; let hIndex = -1;
  const key = () => JSON.stringify(state);
  const effect = () => {
    if (stack.length === 0) { stack.push({ ...state }); index = 0; hist.push({ fx: 0 }); hIndex = 0; return; }
    if (JSON.stringify(stack[index]) === key()) return;   // idempotent: aynı yere tekrar tıklama
    const next = index + 1;
    stack.splice(next, stack.length - next, { ...state }); index = next;
    hist.splice(hIndex + 1, hist.length - hIndex - 1, { fx: next }); hIndex = hist.length - 1;
  };
  const pop = (d) => { const ni = hIndex + d; if (ni < 0 || ni >= hist.length) return "SITE_DISI"; hIndex = ni; index = hist[ni].fx; state = { ...stack[index] }; return "OK"; };
  effect();
  return { go: (p) => { state = { ...state, ...p }; effect(); }, back: () => pop(-1), fwd: () => pop(1), get: () => state, len: () => stack.length };
}

const base = { screen: "mechanicDashboard", mechTab: "requests", mechProfileTab: "settings", mechListingsSubTab: "cars", mechActiveConvoId: null };
const ownerBase = { screen: "ownerProfilePage", ownerProfileTab: "info", ownerSettingsTab: "settings" };

// Sekme gezinme + geri
let a = makeApp(base);
a.go({ mechTab: "market" }); a.go({ mechListingsSubTab: "jobs" });
eq(a.back(), "OK", "alt sekme geçmişe yazılıyor");
eq(a.get().mechListingsSubTab, "cars", "geri → Araçlarım alt sekmesi");
eq(a.back(), "OK", "geri: ana sekme");
eq(a.get().mechTab, "requests", "geri → Randevular");
eq(a.back(), "SITE_DISI", "ilk girdide geri = siteden çık (tek basış)");

// İleri
a = makeApp(base);
a.go({ mechTab: "analytics" }); a.back();
eq(a.fwd(), "OK", "ileri basılabiliyor");
eq(a.get().mechTab, "analytics", "ileri → Analiz");

// Geri bas → SONRA yeni dal: eski ileri girdileri geçersizleşmeli
a = makeApp(base);
a.go({ mechTab: "market" }); a.go({ mechTab: "favorites" }); a.back(); a.go({ mechTab: "messages" });
eq(a.get().mechTab, "messages", "geri sonrası yeni gezinme kaydediliyor");
eq(a.fwd(), "SITE_DISI", "eski ileri girdisi silindi");
eq(a.back(), "OK", "geri hâlâ çalışıyor");
eq(a.get().mechTab, "market", "geri → market");

// Sohbet: telefonda listeden sohbete gir, geri → LİSTEYE dön (sekmeden çıkma)
a = makeApp(base);
a.go({ mechTab: "messages" }); a.go({ mechActiveConvoId: 12 });
eq(a.back(), "OK", "sohbetten geri");
eq(a.get().mechActiveConvoId, null, "geri → sohbet listesi");
eq(a.get().mechTab, "messages", "hâlâ Mesajlar sekmesindeyiz");

// Profil/Teklifler pano sekmesi ↔ ayrı Ayarlar ekranı
a = makeApp(base);
a.go({ mechTab: "profile" }); a.go({ mechTab: "offers" }); a.go({ screen: "mechProfilePage" });
eq(a.get().screen, "mechProfilePage", "dişli → Ayarlar ekranı");
a.back(); eq(a.get().mechTab, "offers", "geri → Teklifler sekmesi");
a.back(); eq(a.get().mechTab, "profile", "geri → Profil sekmesi");

// Aynı sekmeye tekrar tıklamak geçmişi şişirmemeli
a = makeApp(base);
a.go({ mechTab: "market" }); const n = a.len(); a.go({ mechTab: "market" });
eq(a.len(), n, "aynı sekmeye tekrar tıklamak geçmişi şişirmiyor");

// Araç sahibi: Ayarlar AYRI bir ekran (tamirci tarafındaki gibi) — sekme değil.
// Profil sekmesi → Ayarlar → Destek → geri geri geri zinciri bozulmamalı.
let o = makeApp(ownerBase);
o.go({ ownerProfileTab: "vehicles" });
o.go({ screen: "ownerSettings", ownerSettingsTab: "settings" });
eq(o.get().screen, "ownerSettings", "dişli → ayrı Ayarlar ekranı");
o.go({ ownerSettingsTab: "support" });
eq(o.back(), "OK", "destekten geri");
eq(o.get().ownerSettingsTab, "settings", "geri → Ayarlar");
eq(o.back(), "OK", "ayarlardan geri");
eq(o.get(), { screen: "ownerProfilePage", ownerProfileTab: "vehicles", ownerSettingsTab: "settings" }, "geri → profil, Araçlarım sekmesi korunuyor");
eq(o.back(), "OK", "bir daha geri");
eq(o.get().ownerProfileTab, "info", "geri → Bilgilerim");

report("gezinme");
