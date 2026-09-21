import { useEffect, useRef, useState } from "react";
import { Share2, MessageCircle, Facebook, X as XIcon, Mail, Link2, Check } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";

// Instagram/Airbnb tarzı paylaşım butonu: tıklanınca WhatsApp/Facebook/X/E-posta seçenekleri ve
// "Linki Kopyala" içeren küçük bir menü açılır.
//
// GERÇEK HATA DÜZELTMESİ: önceden, cihaz destekliyorsa (macOS Safari/Chrome dahil masaüstünde de
// destekleniyor) önce native paylaşım sayfası (navigator.share) deneniyor, o başarısız/iptal
// olursa bu özel menüye "düşülüyordu". Pratikte navigator.share() promise'i native sayfa hâlâ
// ekranda açıkken de (kullanıcı henüz bir seçim yapmadan) çeşitli tarayıcı/ortam kombinasyonlarında
// erken reddedilebiliyor — bu durumda kod native sayfa hâlâ açıkken ANINDA özel menüyü de açıyor,
// ekranda iki paylaşım paneli üst üste görünüyordu (bkz. Faris'in ekran görüntüleri: macOS'un
// AirDrop/Mail/Messages paneliyle bizim WhatsApp/Facebook/X paneli aynı anda açık). Ayrıca native
// paylaşımda hangi platforma paylaşıldığı bilgisi kaybolduğu için share_events/refCode analitiği
// (bkz. aşağıdaki not) hep "native" olarak kayıtlı kalıyor, kanal bazlı atıf yapılamıyordu. Bu
// yüzden native paylaşım denemesi tamamen kaldırıldı — buton her zaman, her cihazda aynı, kendi
// tasarımımızdaki bu menüyü açıyor. Böylece hem çift panel sorunu kökünden çözülüyor hem de her
// paylaşımın hangi kanaldan yapıldığı güvenilir şekilde kaydediliyor.
// `path`, geçerli sayfanın query string'idir (örn. "?mechanic=12") — paylaşılan link tıklanınca
// ilgili kayıt otomatik açılsın diye (bkz. AppLogicProvider'daki deep-link okuma efekti).
//
// Her buton örneği, mount olduğunda kendine özgü bir `refCode` üretir ve bunu paylaşılan linke
// `&ref=` olarak ekler. Böylece linke kim tıkladı (click), sonra sohbet/randevu/teklif/başvuru gibi
// bir eyleme dönüştü mü (conversion) — hangi platformdan (WhatsApp/Facebook/X/e-posta/kopyalama)
// paylaşıldığıyla birlikte backend'de aynı satıra atfedilebiliyor (bkz. share_events tablosu,
// AppLogicProvider'daki recordShare/recordConversion). `onShare(channel, refCode)` sadece gerçek
// bir paylaşım eylemi olduğunda (linke tıklama/kopyalama) çağrılır — menüyü sadece açmak bir
// "paylaşım" sayılmaz.
export function ShareButton({ title, text, path, className = "", iconSize = 16, onShare }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // Kopyalama BAŞARISIZ olduğunda linki ekranda göstermek için: sessiz başarısızlık yerine
  // kullanıcının elle seçebileceği bir yol bırakıyoruz.
  const [copyFailed, setCopyFailed] = useState(false);
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

  /**
   * PANOYA KOPYALAMA — ÜÇ TARAYICI GERÇEĞİ BİRDEN.
   * -------------------------------------------------------------------------------------------
   * 1) `navigator.clipboard` yalnızca GÜVENLİ BAĞLAMDA var. localhost güvenli sayılır ama
   *    telefondan http://192.168.1.x ile test ederken YOK — yani "linki kopyala" sessizce
   *    çalışmıyordu. Eski tarayıcılarda da yok.
   * 2) Safari, kullanıcı hareketiyle başlamayan bir kopyalamayı reddediyor; reddetme sessiz olur.
   * 3) Yedek yol (`document.execCommand("copy")`) artık kullanımdan kaldırılmış ama hâlâ her yerde
   *    çalışıyor — bu yüzden yedek olarak duruyor.
   *
   * GERÇEK HATA (bu denetimde bulundu): eski kodda `setCopied(true)` HER İKİ yol da başarısız
   * olduğunda bile çağrılıyordu. Yani kullanıcı "Kopyalandı ✓" görüyor, panoda hiçbir şey yok ve
   * paylaşacağı linki kaybediyor. Artık gerçekten kopyalandıysa onay veriliyor; kopyalanamadıysa
   * link EKRANDA gösteriliyor ki kullanıcı elle seçip alabilsin — sessiz başarısızlık yok.
   */
  const copyLink = async () => {
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        ok = true;
      }
    } catch { /* güvenli bağlam değil ya da izin yok — aşağıdaki yedeğe düşülüyor */ }
    if (!ok) {
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      // iOS Safari `select()`'i yok sayabiliyor; setSelectionRange olmadan seçim boş kalır.
      try { ta.setSelectionRange(0, shareUrl.length); } catch { /* desteklemiyorsa yoksay */ }
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      document.body.removeChild(ta);
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } else {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 8000);
    }
    onShare?.("copy", refCode);
  };

  const openShare = (e) => {
    e.stopPropagation();
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
        <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-full mt-2 z-[60] bg-white rounded-2xl shadow-xl border border-surface-elevated p-3 w-64">
          <p className="text-xs font-semibold text-fg-secondary px-1 mb-2">{t("shareMenuTitle")}</p>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {platforms.map(({ key, label, Icon, bg, href }) => (
              // mailto: linki bir web sayfası değil, işletim sisteminin posta uygulamasını açar —
              // target="_blank" ile açılırsa arkada boş, hiçbir zaman kapanmayan bir sekme kalıyordu.
              // Sadece gerçek web linklerinde (WhatsApp/Facebook/X) yeni sekme kullanılıyor.
              <a key={key} href={href} {...(href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })} onClick={() => { setOpen(false); onShare?.(key, refCode); }} className="flex flex-col items-center gap-1">
                <span className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center text-white hover:opacity-90 transition`}>
                  <Icon size={18} />
                </span>
                <span className="text-[10px] text-fg-secondary">{label}</span>
              </a>
            ))}
          </div>
          <button type="button" onClick={copyLink} className="w-full flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-background transition text-sm text-fg-strong">
            {copied ? <Check size={16} className="text-success" /> : <Link2 size={16} className="text-fg-muted" />}
            {copied ? t("linkCopiedNotice") : t("copyLinkBtn")}
          </button>
          {/* Kopyalanamadıysa linki GÖSTERİYORUZ. Panoya erişim güvenli bağlam gerektiriyor
              (telefondan http://192.168.x.x ile bakan kullanıcıda yok) ve Safari izin vermeyebilir.
              Sessizce başarısız olup "kopyalandı" demek, kullanıcının linki kaybetmesi demekti. */}
          {copyFailed && (
            <div className="mt-1 px-2 pb-1">
              <p className="text-[11px] text-warning mb-1">{t("copyLinkFailedNotice")}</p>
              <input
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                aria-label={t("copyLinkBtn")}
                className="w-full px-2 py-1.5 rounded-lg border border-border text-[11px] font-mono text-fg-secondary bg-background"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
