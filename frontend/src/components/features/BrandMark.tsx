import { Wrench } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";

/**
 * FIXPERTO LOGOSU — her sayfada aynı bileşen.
 * ---------------------------------------------------------------------------------------------
 * Logo, web'de kullanıcının en güvendiği kaçış yoludur: "kaybolduysam logoya basarım, başa
 * dönerim". Daha önce logo yalnızca birkaç ekranda vardı; detay, randevu, blog gibi sayfalarda
 * kullanıcının elinde sadece "geri" oku kalıyordu. Artık tek bir bileşen var ve her yerde
 * aynı davranıyor.
 *
 * goHome() BİLEREK kullanılmıyor: o fonksiyon çıkış akışı için yazılmış ve rolü "owner"a
 * sıfırlıyor — giriş yapmış bir tamirci logoya basınca kendini araç sahibi rolünde bulmamalı.
 * goToLandingPage() sadece ekranı değiştiriyor, oturumu ve rolü koruyor.
 */
export function BrandMark({ size = "md", className = "" }: { size?: "sm" | "md"; className?: string }) {
  const { t, goToLandingPage } = useApp();
  const box = size === "sm" ? "w-7 h-7" : "w-8 h-8";
  const icon = size === "sm" ? 14 : 16;
  const text = size === "sm" ? "text-base" : "text-lg";
  return (
    <button
      onClick={goToLandingPage}
      title={t("backToHomeBtn")}
      aria-label={t("backToHomeBtn")}
      className={`flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition ${className}`}
    >
      <div className={`${box} bg-rose-600 rounded-lg flex items-center justify-center`}><Wrench size={icon} className="text-white" /></div>
      <span className={`${text} font-extrabold tracking-tight text-gray-900`}>Fix<span className="text-rose-600">perto</span></span>
    </button>
  );
}

/**
 * İç sayfaların üst çubuğu: solda geri oku (varsa) + logo, sağda sayfaya özel eylemler.
 * Yapışkan (sticky) — uzun bir sayfanın ortasındayken bile logo elinin altında kalsın.
 */
export function PageTopBar({ onBack = null, right = null }: { onBack?: (() => void) | null; right?: React.ReactNode }) {
  const { t } = useApp();
  return (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-5 md:px-8 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button onClick={onBack} aria-label={t("back")} className="w-9 h-9 -ml-1 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 transition flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
            </button>
          )}
          <BrandMark />
        </div>
        {right && <div className="flex items-center gap-2 flex-shrink-0">{right}</div>}
      </div>
    </div>
  );
}
