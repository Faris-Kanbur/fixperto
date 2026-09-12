import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * BİLGİ BALONCUĞU ("?" ipucu).
 * ---------------------------------------------------------------------------------------------
 * NEDEN VAR: arayüzdeki bazı terimler kullanıcıya hiçbir şey anlatmıyor. "Değişken fiyat" ne
 * demek? "Diğer markalar" neyi gösteriyor? Bu soruların cevabını ekrana uzun uzun yazmak listeyi
 * boğar; hiç yazmamak ise kullanıcıyı tahmine bırakır. Çözüm: üstüne gelince çıkan kısa bir balon.
 *
 * ====== DÜZELTİLEN HATA (kullanıcı bildirdi: "bazen yazının arkasında kalıyor, metin okunmuyor")
 * İlk sürümde balon, "?" işaretinin YANINDAKİ kapsayıcının içinde `absolute` olarak duruyordu.
 * Bu iki ayrı nedenle bozuluyordu ve ikisi de CSS'in temel davranışı:
 *
 *  1) KIRPILMA: absolute bir öğe, kendisini içeren ve `overflow: hidden/auto` olan HER atadan
 *     kesilir. Balonlarımız tam da böyle yerlerdeydi — randevu ekranındaki hizmet listesi
 *     (max-h + overflow-y-auto), tamirci sayfasındaki hizmet kutusu (overflow-hidden),
 *     hizmet satırının kendisi. Kutunun dışına taşan kısım görünmüyordu: metin "yarım" kalıyordu.
 *
 *  2) YIĞIN BAĞLAMI: z-index yalnızca KENDİ yığın bağlamı içinde geçerlidir. Ata öğelerden biri
 *     (yapışkan başlık, dönüşümlü/opaklıklı bir kart) yeni bir yığın bağlamı açtığında, içerideki
 *     "z-30" dışarıdaki bir kartın z-10'unu geçemez — balon komşu metnin ARKASINDA kalır.
 *
 * ÇÖZÜM: balon artık React portalı ile doğrudan <body> altına basılıyor ve `position: fixed` ile
 * "?" işaretinin ekrandaki gerçek koordinatına konumlanıyor. Body'nin altındaki hiçbir overflow
 * onu kırpamaz, hiçbir ata yığın bağlamı onu gömemez.
 *
 * Konum hesabı üç şeyi garantiye alıyor:
 *  - Üstte yer yoksa balon ALTA açılır (sayfanın tepesindeki bir "?" işaretinde metin ekran
 *    dışında kalıyordu).
 *  - Sağa/sola taşma varsa balon ekran içine çekilir (sağ kenardaki "?" işaretlerinde metnin
 *    yarısı görünmüyordu).
 *  - Sayfa kaydırılınca/pencere boyutlanınca balon kapanır: fixed konum bayatlar, balon ait
 *    olmadığı bir yerde asılı kalırdı.
 *
 * Metin TAMAMEN okunabilmeli: genişlik ekrana göre sınırlanıyor, uzun kelimeler bölünüyor
 * (break-words) ve satır sayısı kısıtlanmıyor.
 *
 * İKİ BİÇİM:
 *  - Varsayılan: gerçek bir <button>. Klavyeyle sekmeyle gezilir, Enter/boşlukla açılır.
 *  - inline: bir <button>'ın İÇİNDE kullanılır (ör. randevu ekranındaki hizmet satırı bir düğme).
 *    İç içe düğme geçersiz HTML'dir ve tıklama olayları birbirine karışır; orada odaklanamayan
 *    bir <span> basılır ve erişilebilirlik için title özniteliği korunur.
 *
 * Modül düzeyinde tanımlı — bkz. tests/ui.test.mjs KURAL 8.
 */

// Balonun ölçüleri. Genişlik sabit değil: dar ekranda pencereye sığacak kadar daralıyor.
const TIP_MAX_W = 260;
const TIP_GAP = 8;      // "?" ile balon arasındaki boşluk
const EDGE = 8;         // ekran kenarından bırakılan güvenli pay

export function InfoTip({ text, label, inline = false }: {
  text: string; label: string; inline?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; below: boolean } | null>(null);
  const anchorRef = useRef<HTMLSpanElement | null>(null);

  // Konumu "?" işaretinin EKRANDAKİ yerinden hesaplıyoruz; fixed olduğu için sayfa kaydırması
  // hesaba katılmıyor (zaten kaydırınca balon kapanıyor).
  const place = useCallback(() => {
    const el = anchorRef.current;
    if (!el || typeof window === "undefined") return;
    const r = el.getBoundingClientRect();
    const width = Math.min(TIP_MAX_W, window.innerWidth - EDGE * 2);
    // Balon yaklaşık yüksekliği: ölçmeden önce yer kararı vermek gerekiyor; 5 satırlık bir
    // tahmin, "üstte yer var mı" sorusu için fazlasıyla yeterli.
    const estH = 120;
    const below = r.top < estH + TIP_GAP;
    let left = r.left + r.width / 2 - width / 2;
    left = Math.max(EDGE, Math.min(left, window.innerWidth - width - EDGE));
    setPos({
      top: below ? r.bottom + TIP_GAP : r.top - TIP_GAP,
      left,
      width,
      below,
    });
  }, []);

  const show = () => { place(); setOpen(true); };
  const hide = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    // Fixed konum sayfa kaydırılınca bayatlar — balonu kapatmak, yanlış yerde asılı kalmasından
    // iyidir. capture:true, iç kapsayıcıların (liste kutuları) kaydırmasını da yakalar.
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const bubble = (open && pos && typeof document !== "undefined") ? createPortal(
    <div
      role="tooltip"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: pos.width,
        transform: pos.below ? undefined : "translateY(-100%)",
      }}
      // z-[95]: uygulamadaki en üst katmanların (modal z-[90]) üzerinde; balon her zaman
      // tetiklendiği içeriğin önünde durmalı.
      className="z-[95] pointer-events-none rounded-xl bg-gray-900 text-white text-[11px] font-normal normal-case tracking-normal leading-relaxed text-left px-3 py-2 shadow-xl break-words"
    >
      {text}
    </div>,
    document.body,
  ) : null;

  // "?" dairesi — iki biçimde de aynı görünüyor ki kullanıcı aynı işareti aynı şey sansın.
  // Rengi BULUNDUĞU YERDEN alıyor (border-current): seçili satırın koyu pembe zemininde de,
  // beyaz kart üzerinde de okunur kalıyor. Sabit bir gri, seçili satırda kayboluyordu.
  const mark = "w-[15px] h-[15px] rounded-full border border-current flex items-center justify-center text-[9px] font-bold leading-none opacity-60 hover:opacity-100 transition";

  if (inline) {
    return (
      <span ref={anchorRef} className="relative inline-flex items-center" onMouseEnter={show} onMouseLeave={hide}>
        <span className={mark} title={text} aria-label={label}>?</span>
        {bubble}
      </span>
    );
  }

  return (
    <span ref={anchorRef} className="relative inline-flex items-center">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        // Dokunmatik cihazda hover yok: tıklama balonu açıp kapatıyor.
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (open) hide(); else show(); }}
        className={mark}
      >?</button>
      {bubble}
    </span>
  );
}
