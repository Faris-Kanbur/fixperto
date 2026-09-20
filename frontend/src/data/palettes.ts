// frontend/src/data/palettes.ts
// Admin "Renk Paletleri" panelinin okuduğu katalog. Sadece veri — mantık yok. Her `preview`
// değeri frontend/src/styles/tokens.css'teki GERÇEK token değerleriyle birebir aynı olmalı
// (bkz. docs/superpowers/plans/2026-09-20-palette-system-and-admin-picker.md'deki tablo).
export interface PaletteEntry {
  key: string;
  nameKey: string;
  descKey: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    success: string;
    warning: string;
    error: string;
  };
}

// Nötr (background/text) ve success/warning/error tüm paletlerde AYNI — bkz. plan, "Global
// Constraints". Tek satırda tanımlanıp her girişte yeniden kullanılıyor.
const SHARED_NEUTRAL_AND_STATUS = {
  background: "#f9fafb",
  text: "#111827",
  success: "#16a34a",
  warning: "#d97706",
  error: "#dc2626",
};

export const PALETTE_CATALOG: PaletteEntry[] = [
  { key: "default", nameKey: "paletteDefaultName", descKey: "paletteDefaultDesc",
    preview: { primary: "#2563eb", secondary: "#111827", accent: "#f59e0b", ...SHARED_NEUTRAL_AND_STATUS } },
  { key: "trust", nameKey: "paletteTrustName", descKey: "paletteTrustDesc",
    preview: { primary: "#047857", secondary: "#111827", accent: "#f59e0b", ...SHARED_NEUTRAL_AND_STATUS } },
  { key: "industrial", nameKey: "paletteIndustrialName", descKey: "paletteIndustrialDesc",
    preview: { primary: "#c2410c", secondary: "#1e293b", accent: "#64748b", ...SHARED_NEUTRAL_AND_STATUS } },
  { key: "performance", nameKey: "palettePerformanceName", descKey: "palettePerformanceDesc",
    preview: { primary: "#0e7490", secondary: "#09090b", accent: "#dc2626", ...SHARED_NEUTRAL_AND_STATUS } },
  { key: "european", nameKey: "paletteEuropeanName", descKey: "paletteEuropeanDesc",
    preview: { primary: "#1e40af", secondary: "#0f172a", accent: "#475569", ...SHARED_NEUTRAL_AND_STATUS } },
  { key: "minimal", nameKey: "paletteMinimalName", descKey: "paletteMinimalDesc",
    preview: { primary: "#18181b", secondary: "#3f3f46", accent: "#a16207", ...SHARED_NEUTRAL_AND_STATUS } },
];
