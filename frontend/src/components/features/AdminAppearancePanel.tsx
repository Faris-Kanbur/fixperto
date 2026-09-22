import { Check, Palette } from "lucide-react";
import { useState } from "react";
import { useApp } from "../../app/state/AppLogicProvider";
import { PALETTE_CATALOG } from "../../data/palettes";

/**
 * YÖNETİCİ — RENK PALETLERİ.
 * ---------------------------------------------------------------------------------------------
 * Admin burada 6 hazır paletten birini SİTE GENELİNDE aktif eder (kendi tarayıcısı değil —
 * backend'e yazılır, her ziyaretçi bunu görür). Değişiklik anında bu sayfanın kendisine de
 * uygulanır (activePalette state'i güncellenince data-palette attribute'u da güncellenir),
 * yani admin "Kullan"a bastığı anda kendi ekranında sonucu görür.
 *
 * AdminCareersPanel.tsx ile aynı minimal destructure deseni — bu component'in ihtiyacı
 * olmayan 500+ değişkeni içeri almıyor.
 */
export function AdminAppearancePanel() {
  const { t, activePalette, setActivePalette, setToast } = useApp();
  const [applying, setApplying] = useState<string | null>(null);

  const apply = async (key: string) => {
    if (key === activePalette || applying) return;
    setApplying(key);
    try {
      await setActivePalette(key);
      setToast({ type: "success", text: `✅ ${t("adminAppearanceTabLabel")}: ${t(PALETTE_CATALOG.find((p) => p.key === key)!.nameKey)}` });
    } catch (e: any) {
      setToast({ type: "info", text: `⚠️ ${e?.message || "Palet uygulanamadı."}` });
    } finally {
      setApplying(null);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-fg mb-1 flex items-center gap-2"><Palette size={20} className="text-primary" /> {t("adminAppearanceTabLabel")}</h1>
      <p className="text-sm text-fg-secondary mb-6">Aktif edilen palet, sitedeki HERKES için anında geçerli olur.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PALETTE_CATALOG.map((p) => {
          const active = p.key === activePalette;
          return (
            <div key={p.key} className={`bg-white border rounded-2xl p-4 shadow-sm transition ${active ? "border-info ring-2 ring-blue-100" : "border-border"}`}>
              <div className="flex items-center gap-1.5 mb-3">
                {[p.preview.primary, p.preview.secondary, p.preview.accent, p.preview.background, p.preview.text, p.preview.success, p.preview.warning, p.preview.error].map((hex, i) => (
                  <div key={i} className="w-6 h-6 rounded-md border border-black/5 flex-shrink-0" style={{ backgroundColor: hex }} />
                ))}
              </div>
              <h3 className="font-bold text-fg text-sm mb-1">{t(p.nameKey)}</h3>
              <p className="text-xs text-fg-secondary leading-relaxed mb-4 min-h-[48px]">{t(p.descKey)}</p>
              <button
                onClick={() => apply(p.key)}
                disabled={active || applying === p.key}
                className={`w-full text-sm font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  active ? "bg-success-tint text-green-700 cursor-default" : "bg-secondary text-white hover:bg-gray-800 disabled:opacity-60"
                }`}
              >
                {active ? (<><Check size={15} /> Aktif</>) : applying === p.key ? "Uygulanıyor…" : "Kullan"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
