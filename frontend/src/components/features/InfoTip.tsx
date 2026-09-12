import { useState } from "react";

/**
 * BİLGİ BALONCUĞU ("?" ipucu).
 * ---------------------------------------------------------------------------------------------
 * NEDEN VAR: arayüzdeki bazı terimler kullanıcıya hiçbir şey anlatmıyor. "Değişken fiyat" ne
 * demek? "Diğer markalar" neyi gösteriyor? Bu soruların cevabını ekrana uzun uzun yazmak listeyi
 * boğar; hiç yazmamak ise kullanıcıyı tahmine bırakır. Çözüm: üstüne gelince çıkan kısa bir balon.
 *
 * NEDEN title= YETMEDİ: tarayıcının kendi title balonu ~1 saniye gecikmeyle çıkar, biçimlenemez,
 * dokunmatik cihazlarda HİÇ çıkmaz. Kendi balonumuz anında çıkıyor ve tıklanarak da açılıyor —
 * telefonda kullanıcı "?" işaretine dokunarak okuyabiliyor.
 *
 * İKİ BİÇİM:
 *  - Varsayılan: gerçek bir <button>. Klavyeyle sekmeyle gezilebilir, Enter/boşlukla açılır.
 *  - inline: bir <button>'ın İÇİNDE kullanılır (ör. randevu ekranındaki hizmet satırı bir düğme).
 *    İç içe düğme geçersiz HTML'dir ve tıklama olayları birbirine karışır; bu yüzden orada
 *    odaklanamayan bir <span> basıyoruz ve erişilebilirlik için title özniteliğini koruyoruz.
 *
 * Modül düzeyinde tanımlı — bkz. tests/ui.test.mjs KURAL 8 (render içinde tanımlanan bileşen her
 * karakterde yeniden bağlanır, odak ve kaydırma kaybolur).
 */
export function InfoTip({ text, label, inline = false, side = "right" }: {
  text: string; label: string; inline?: boolean; side?: "right" | "left";
}) {
  const [open, setOpen] = useState(false);

  const bubble = (
    <span
      role="tooltip"
      className={`pointer-events-none absolute z-30 bottom-full mb-1.5 w-56 rounded-xl bg-gray-900 text-white text-[11px] font-normal leading-relaxed px-3 py-2 shadow-lg transition-opacity normal-case tracking-normal text-left ${side === "left" ? "right-0" : "left-1/2 -translate-x-1/2"} ${open ? "opacity-100" : "opacity-0"}`}
    >
      {text}
    </span>
  );

  // "?" dairesi — iki biçimde de aynı görünüyor ki kullanıcı aynı işareti aynı şey sansın.
  const mark = "w-[15px] h-[15px] rounded-full border border-current/40 flex items-center justify-center text-[9px] font-bold leading-none opacity-70 hover:opacity-100 transition";

  if (inline) {
    return (
      <span className="relative inline-flex items-center" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
        <span className={mark} title={text} aria-label={label}>?</span>
        {bubble}
      </span>
    );
  }

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        // Dokunmatik cihazda hover yok: tıklama balonu açıp kapatıyor.
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
        className={mark}
      >?</button>
      {bubble}
    </span>
  );
}
