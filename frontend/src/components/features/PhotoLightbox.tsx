import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { isImgUrl, imgFallbackHandler, imgThumb } from "../../utils/helpers";

// Diğer araç sitelerindeki gibi tam ekran fotoğraf görüntüleyici: bir fotoğrafa
// tıklanınca açılır, ok tuşlarıyla/oklarla ileri-geri gidilebilir, alttaki şerit
// üzerinden istenen fotoğrafa direkt atlanabilir. Performans için sadece bu modal
// açıkken ve sadece görünen büyük fotoğraf orijinal boyutunda yükleniyor, şerit
// küçük resimleri her zaman küçük (thumb) boyutta.
export function PhotoLightbox({ photos, index, onIndexChange, onClose, title = "" }) {
  const count = photos.length;
  const safeIndex = ((index % count) + count) % count;

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onIndexChange((safeIndex - 1 + count) % count);
      else if (e.key === "ArrowRight") onIndexChange((safeIndex + 1) % count);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [safeIndex, count, onClose, onIndexChange]);

  if (count === 0) return null;
  const current = photos[safeIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col" role="dialog" aria-modal="true" aria-label="Fotoğraf galerisi">
      <div className="flex items-center justify-between px-4 py-3 text-white/90 flex-shrink-0">
        <span className="text-sm font-medium truncate">{title} {count > 1 && <span className="text-white/50">· {safeIndex + 1}/{count}</span>}</span>
        <button onClick={onClose} aria-label="Kapat" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"><X size={18} /></button>
      </div>
      <div className="flex-1 relative flex items-center justify-center min-h-0 px-4">
        {count > 1 && (
          <button onClick={() => onIndexChange((safeIndex - 1 + count) % count)} aria-label="Önceki fotoğraf" className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition z-10"><ChevronLeft size={22} /></button>
        )}
        <div className="max-w-full max-h-full flex items-center justify-center">
          {isImgUrl(current) ? (
            <img src={current} onError={imgFallbackHandler} alt={`${title} fotoğraf ${safeIndex + 1}`} className="max-w-full max-h-[calc(100vh-160px)] object-contain rounded-lg" />
          ) : (
            <span className="text-8xl">{current}</span>
          )}
        </div>
        {count > 1 && (
          <button onClick={() => onIndexChange((safeIndex + 1) % count)} aria-label="Sonraki fotoğraf" className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition z-10"><ChevronRight size={22} /></button>
        )}
      </div>
      {count > 1 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto flex-shrink-0">
          {photos.map((p, i) => (
            <button key={i} onClick={() => onIndexChange(i)} className={`w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 flex items-center justify-center text-xl bg-white/10 ${i === safeIndex ? "border-white" : "border-transparent opacity-50 hover:opacity-80"}`}>
              {isImgUrl(p) ? <img src={imgThumb(p, 160)} loading="lazy" onError={imgFallbackHandler} alt={`Küçük fotoğraf ${i + 1}`} className="w-full h-full object-cover" /> : <span className="text-white">{p}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
