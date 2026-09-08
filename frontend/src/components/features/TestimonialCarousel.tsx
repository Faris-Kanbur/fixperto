import { useEffect, useRef, useState } from "react";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";

/**
 * "KULLANICILAR NE DİYOR?" — akan değerlendirme şeridi.
 * ---------------------------------------------------------------------------------------------
 * ÖNCEKİ HÂLİ: sabit üç kart. İki sorunu vardı:
 *   1) Sitede yüzlerce yorum olsa bile ana sayfada hep AYNI üçü görünüyordu; her ziyarette aynı
 *      metni gören kişi için bu bir vitrin değil, dekor.
 *   2) Üç kart "gerçek yorumlar" iddiasını zayıflatıyordu — az sayıda örnek, seçilmiş izlenimi verir.
 *
 * YENİ HÂLİ: yatay kayan şerit. En fazla 12 gerçek yorum gösteriliyor, kendiliğinden ilerliyor,
 * fare üzerine gelince duruyor, ok tuşları ve dokunmatik kaydırma da çalışıyor.
 *
 * ERİŞİLEBİLİRLİK: "hareketi azalt" tercihi açık olan kullanıcıda otomatik ilerleme HİÇ
 * çalışmıyor — kendiliğinden hareket eden içerik bu tercihi olan kişiler için rahatsız edici.
 * Şerit yine elle kaydırılabiliyor, yani içerik kaybolmuyor.
 *
 * Modül düzeyinde tanımlı — bkz. tests/ui.test.mjs KURAL 8.
 */

const AUTO_ADVANCE_MS = 5000;

export function TestimonialCarousel({ items }) {
  const { t } = useApp();
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  // Kaç kart kaydırılacağını sabit bir sayıyla değil, ilk kartın GERÇEK genişliğinden
  // hesaplıyoruz: kart genişliği ekran boyutuna göre değişiyor (mobilde tek, masaüstünde üç).
  const scrollByCard = (dir) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 20 : track.clientWidth;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
    if (dir > 0 && atEnd) {
      track.scrollTo({ left: 0, behavior: "smooth" }); // başa sar: şerit bitmesin
      return;
    }
    track.scrollBy({ left: step * dir, behavior: "smooth" });
  };

  useEffect(() => {
    if (paused || items.length < 2) return;
    // Hareketi azalt tercihi: otomatik ilerleme kapalı.
    let reduced = false;
    try { reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { /* eski tarayıcı */ }
    if (reduced) return;
    const id = setInterval(() => scrollByCard(1), AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [paused, items.length]);

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((r, i) => (
          <div
            key={`${r.mechanicName}-${r.id ?? i}`}
            className="snap-start flex-shrink-0 w-[85%] sm:w-[48%] lg:w-[31.5%] bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col"
          >
            <Quote size={18} className="text-rose-200 mb-2" />
            <p className="text-sm text-gray-600 leading-relaxed flex-1">{r.comment}</p>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-base flex-shrink-0">{r.avatar || "👤"}</div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{r.name}</p>
                <p className="text-[11px] text-gray-400 truncate">{r.mechanicImg} {r.mechanicName}</p>
              </div>
              <div className="ml-auto flex items-center gap-0.5 flex-shrink-0">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={11} className={n <= (r.rating || 0) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => scrollByCard(-1)} aria-label={t("prevBtn")}
            className="w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-500 hover:text-rose-600 hover:border-rose-300 transition flex items-center justify-center">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => scrollByCard(1)} aria-label={t("nextBtn")}
            className="w-9 h-9 rounded-full border border-gray-200 bg-white text-gray-500 hover:text-rose-600 hover:border-rose-300 transition flex items-center justify-center">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
