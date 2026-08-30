import { useEffect, useRef, useState } from "react";
import { Share2, MessageCircle, Facebook, X as XIcon, Mail, Link2, Check } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";

// Instagram/Airbnb tarzı paylaşım butonu: tıklanınca WhatsApp/Facebook/X/E-posta seçenekleri ve
// "Linki Kopyala" içeren küçük bir menü açılır. Cihaz destekliyorsa (çoğunlukla mobil) önce
// native paylaşım sayfasını (navigator.share) dener — bu, işletim sisteminin kendi paylaşım
// sayfasını (Instagram, Mesajlar, AirDrop vb. dahil) açar; desteklenmiyorsa bu özel menüye düşer.
// `path`, geçerli sayfanın query string'idir (örn. "?mechanic=12") — paylaşılan link tıklanınca
// ilgili kayıt otomatik açılsın diye (bkz. AppLogicProvider'daki deep-link okuma efekti).
//
// Her buton örneği, mount olduğunda kendine özgü bir `refCode` üretir ve bunu paylaşılan linke
// `&ref=` olarak ekler. Böylece linke kim tıkladı (click), sonra sohbet/randevu/teklif/başvuru gibi
// bir eyleme dönüştü mü (conversion) — hangi platformdan (WhatsApp/Facebook/X/e-posta/kopyalama/
// native) paylaşıldığıyla birlikte backend'de aynı satıra atfedilebiliyor (bkz. share_events
// tablosu, AppLogicProvider'daki recordShare/recordConversion). `onShare(channel, refCode)` sadece
// gerçek bir paylaşım eylemi olduğunda (linke tıklama/kopyalama/native paylaşımın başarıyla
// açılması) çağrılır — menüyü sadece açmak bir "paylaşım" sayılmaz.
export function ShareButton({ title, text, path, className = "", iconSize = 16, onShare }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);
  const refCode = useRef(Math.random().toString(36).slice(2, 10)).current;

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onEsc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDocClick); document.removeEventListener("keydown", onEsc); };
  }, [open]);

  const baseUrl = typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}${path || ""}` : "";
  const shareUrl = baseUrl ? `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}ref=${refCode}` : "";
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(text || title || "");

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch { /* yoksay */ }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    onShare?.("copy", refCode);
  };

  const openShare = async (e) => {
    e.stopPropagation();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        onShare?.("native", refCode);
      } catch (err) {
        // GERÇEK HATA DÜZELTMESİ: kullanıcı native paylaşım sayfasını kendi isteğiyle kapatırsa
        // (ör. "İptal"e basarsa) tarayıcı navigator.share() promise'ini AbortError ile reddeder.
        // Önceden bu durumda da kod özel menüye "düşüyordu" — yani kullanıcı native paylaşım
        // sayfasını kapatır kapatmaz, hiç istemediği ikinci bir paylaşım menüsü aniden açılıyordu
        // ("Paylaş düzgün çalışmıyor" hissi buradan geliyordu). Artık sadece native paylaşım
        // GERÇEKTEN başarısız olduğunda (kullanıcının kendi iptali dışındaki hatalarda) özel
        // menüye düşülüyor.
        if (err?.name !== "AbortError") setOpen((o) => !o);
      }
      return;
    }
    setOpen((o) => !o);
  };

  const platforms = [
    { key: "whatsapp", label: "WhatsApp", Icon: MessageCircle, bg: "bg-green-500", href: `https://wa.me/?text=${encodedText}%20${encodedUrl}` },
    { key: "facebook", label: "Facebook", Icon: Facebook, bg: "bg-blue-600", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { key: "x", label: "X", Icon: XIcon, bg: "bg-gray-900", href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}` },
    { key: "mail", label: t("emailPlaceholder"), Icon: Mail, bg: "bg-gray-500", href: `mailto:?subject=${encodeURIComponent(title || "")}&body=${encodedText}%20${encodedUrl}` },
  ];

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={openShare}
        aria-label={t("shareMenuTitle")}
        title={t("shareMenuTitle")}
        className={className || "w-9 h-9 bg-black/30 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-black/50 transition"}
      >
        <Share2 size={iconSize} />
      </button>
      {open && (
        <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-full mt-2 z-[60] bg-white rounded-2xl shadow-xl border border-gray-100 p-3 w-64">
          <p className="text-xs font-semibold text-gray-500 px-1 mb-2">{t("shareMenuTitle")}</p>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {platforms.map(({ key, label, Icon, bg, href }) => (
              // mailto: linki bir web sayfası değil, işletim sisteminin posta uygulamasını açar —
              // target="_blank" ile açılırsa arkada boş, hiçbir zaman kapanmayan bir sekme kalıyordu.
              // Sadece gerçek web linklerinde (WhatsApp/Facebook/X) yeni sekme kullanılıyor.
              <a key={key} href={href} {...(href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })} onClick={() => { setOpen(false); onShare?.(key, refCode); }} className="flex flex-col items-center gap-1">
                <span className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center text-white hover:opacity-90 transition`}>
                  <Icon size={18} />
                </span>
                <span className="text-[10px] text-gray-500">{label}</span>
              </a>
            ))}
          </div>
          <button type="button" onClick={copyLink} className="w-full flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-gray-50 transition text-sm text-gray-700">
            {copied ? <Check size={16} className="text-green-600" /> : <Link2 size={16} className="text-gray-400" />}
            {copied ? t("linkCopiedNotice") : t("copyLinkBtn")}
          </button>
        </div>
      )}
    </div>
  );
}
