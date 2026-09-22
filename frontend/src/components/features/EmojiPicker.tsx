import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Smile } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";

/**
 * EMOJİ SEÇİCİ — sohbet kutusunun yanındaki gülen yüz (WhatsApp'taki gibi).
 * ================================================================================================
 * NEDEN HAZIR KÜTÜPHANE DEĞİL: emoji seçici paketleri tipik olarak birkaç yüz kilobayt ve binlerce
 * emoji taşıyor. Burada gerçek ihtiyaç bir tamirci ile araç sahibinin yazışması — "tamam", "eyvallah",
 * "araba hazır mı". Küçük ve konuya uygun bir set hem daha hızlı yüklenir hem de aranacak bir şey
 * kalmadığı için daha hızlı KULLANILIR. Setin içinde bu işe özgü olanlar da var (araba, anahtar,
 * tamir) — genel bir kütüphanede bunları bulmak için arama yapmak gerekirdi.
 *
 * PORTAL: panel document.body'ye basılıyor. Sohbet kutusu `overflow-y-auto` bir kabın içinde;
 * normal akışta açılan panel o kabın kenarında KESİLİYOR ya da altında kalıyordu (aynı sınıf hata
 * bilgi baloncuğunda da yaşandı, bkz. InfoTip). Portal, taşma ve yığılma bağlamlarından kaçmanın
 * tek güvenilir yolu.
 *
 * ERİŞİLEBİLİRLİK: düğme gerçek bir <button>, panel Escape ile kapanıyor, dışarı tıklama kapatıyor
 * ve her emojinin okunabilir bir adı var — ekran okuyucu "gülen yüz" der, "grinning face emoji
 * karakteri" diye anlamsız bir şey değil.
 */

/** Küçük ve işe uygun set. Sıra bilinçli: en çok kullanılacaklar başta. */
const EMOJI_GROUPS: { key: string; items: string[] }[] = [
  { key: "emojiGroupCommon", items: ["👍", "🙏", "😊", "😄", "😉", "🙂", "😅", "😂", "❤️", "🔥", "👏", "🤝", "✅", "❌", "❗", "❓"] },
  { key: "emojiGroupCar", items: ["🚗", "🚙", "🛻", "🏍️", "🔧", "🔩", "🛠️", "⚙️", "🔋", "⛽", "🛞", "🧰", "🚨", "🅿️", "🧽", "💨"] },
  { key: "emojiGroupTime", items: ["⏰", "📅", "⏳", "📍", "📞", "💬", "📷", "📄", "💰", "💳", "🧾", "🎉", "👌", "🤔", "😕", "😐"] },
];

export function EmojiPicker({ onPick, ariaLabel = undefined }: { onPick: (emoji: string) => void; ariaLabel?: string }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Panel düğmenin ÜSTÜNDE açılıyor: sohbet kutusu ekranın altında, aşağı açılsa ekran dışına
  // taşardı. Ekranın soluna/sağına taşmaması için de yatayda sınırlanıyor.
  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = 296;
    const left = Math.min(Math.max(8, r.left), Math.max(8, window.innerWidth - width - 8));
    setPos({ top: Math.max(8, r.top - 8), left });
  };

  useEffect(() => {
    if (!open) return;
    place();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btnRef.current?.focus(); } };
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || btnRef.current?.contains(target)) return;
      setOpen(false);
    };
    // Kaydırma/yeniden boyutlandırmada panel düğmeden kopmasın.
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel || t("emojiPickerAria")}
        aria-expanded={open}
        title={ariaLabel || t("emojiPickerAria")}
        className={`w-10 h-10 flex items-center justify-center rounded-full transition flex-shrink-0 ${open ? "bg-blue-100 text-primary" : "bg-surface-elevated text-fg-secondary hover:bg-border"}`}
      >
        <Smile size={18} />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={panelRef}
          role="dialog"
          aria-label={t("emojiPickerAria")}
          style={{ position: "fixed", top: pos.top, left: pos.left, width: 296, transform: "translateY(-100%)" }}
          className="z-[80] bg-white border border-border rounded-2xl shadow-xl p-3 max-h-[50vh] overflow-y-auto"
        >
          {EMOJI_GROUPS.map((group) => (
            <div key={group.key} className="mb-2 last:mb-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted mb-1.5">{t(group.key)}</p>
              <div className="grid grid-cols-8 gap-0.5">
                {group.items.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => { onPick(e); setOpen(false); }}
                    aria-label={e}
                    className="w-8 h-8 flex items-center justify-center text-lg rounded-lg hover:bg-surface-elevated active:scale-95 transition"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

export default EmojiPicker;
