import { useEffect } from "react";
import { Wrench, ChevronLeft, ChevronRight, BadgeCheck, Tag, Sparkles } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";
import { ONBOARDING_SLIDES } from "../../data/constants";

/**
 * KARŞILAMA TURU ("Fixperto'ya Hoş Geldiniz")
 * ---------------------------------------------------------------------------------------------
 * ÖNCEKİ HÂLİ: telefon genişliğinde (max-w-sm) küçük bir kutu, üstte emoji, altta bir paragraf.
 * Masaüstünde ekranın ortasında kaybolmuş duruyordu ve sitenin kimliğinden hiçbir iz taşımıyordu —
 * logo bile yoktu. Kullanıcının siteyle İLK karşılaşması burası olduğu için bu ilk izlenim önemli.
 *
 * YENİ HÂLİ: iki panelli, geniş bir karşılama. Solda marka paneli (logo + o adımın görseli +
 * değişmeyen üç güven maddesi), sağda adımın metni ve gezinme. Bu ayrım bilinçli: SOL taraf
 * "Fixperto nedir" sorusunun cevabı olarak sabit durur, SAĞ taraf adım adım değişir. Böylece
 * kullanıcı hangi adımda olursa olsun markayı ve vaadi görmeye devam ediyor.
 *
 * Arka plan bilerek daha ŞEFFAF (bg-gray-950/55 + hafif bulanıklık): tamamen karartmak, altta
 * duran sitenin varlığını siliyordu; hafif şeffaflık "bunun arkasında gerçek bir site var"
 * hissini koruyor ve pencere daha hafif görünüyor.
 *
 * Ayrıca ESKİDE OLMAYAN İKİ ŞEY: geri adım (yanlışlıkla ileri basan geri dönebilsin) ve Escape
 * ile kapatma. Bir tanıtım penceresi kullanıcıyı hapsetmemeli.
 *
 * Modül düzeyinde tanımlı — bkz. tests/ui.test.mjs KURAL 8.
 */
export function WelcomeTour() {
  const { t, onboardStep, setOnboardStep, setShowOnboarding } = useApp();
  const slide = ONBOARDING_SLIDES[onboardStep] || ONBOARDING_SLIDES[0];
  const isLast = onboardStep === ONBOARDING_SLIDES.length - 1;
  const close = () => setShowOnboarding(false);

  // Escape ile kapatma: kullanıcı tanıtımı okumak zorunda değil.
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const promises = [
    { icon: BadgeCheck, text: t("onboardPromiseVerified") },
    { icon: Tag, text: t("onboardPromisePrice") },
    { icon: Sparkles, text: t("onboardPromiseFree") },
  ];

  return (
    <div
      className="fixed inset-0 w-screen h-screen bg-gray-950/55 backdrop-blur-[3px] z-[200] flex items-center justify-center p-4 md:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={t("onboardWelcomeTitle")}
    >
      <div className="bg-white rounded-[28px] shadow-2xl ring-1 ring-black/5 w-full max-w-3xl my-auto overflow-hidden grid grid-cols-1 md:grid-cols-[minmax(0,300px)_1fr]">
        {/* ---- SOL: marka paneli (adıma göre renk değişir, içerik sabit kalır) ---- */}
        <div className={`bg-gradient-to-br ${slide.grad} p-7 md:p-8 flex flex-col justify-between text-white relative overflow-hidden`}>
          {/* Dekoratif halkalar: düz bir renk bloğu yerine derinlik. */}
          <div aria-hidden="true" className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-white/10" />
          <div aria-hidden="true" className="absolute -bottom-20 -left-10 w-44 h-44 rounded-full bg-white/5" />

          <div className="relative">
            {/* Logo — tıklanabilir DEĞİL: pencere zaten modal, arkaya gitmek kafa karıştırırdı. */}
            <div className="flex items-center gap-2 mb-8">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <Wrench size={18} className="text-rose-600" />
              </div>
              <span className="text-xl font-extrabold tracking-tight">Fixperto</span>
            </div>
            <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-5xl">
              {slide.icon}
            </div>
          </div>

          <ul className="relative space-y-2.5 mt-8">
            {promises.map((p) => (
              <li key={p.text} className="flex items-center gap-2.5 text-sm text-white/90">
                <p.icon size={15} className="flex-shrink-0 text-white" />
                {p.text}
              </li>
            ))}
          </ul>
        </div>

        {/* ---- SAĞ: adım içeriği ---- */}
        <div className="p-7 md:p-10 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs font-bold tracking-wide uppercase text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full tabular-nums">
              {onboardStep + 1} / {ONBOARDING_SLIDES.length}
            </span>
            <button onClick={close} aria-label={t("skipTourAria")} className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition">
              {t("skipBtn")}
            </button>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-3">{t(slide.titleKey)}</h2>
          <p className="text-[15px] text-gray-500 leading-relaxed">{t(slide.descKey)}</p>

          <div className="flex-1 min-h-[24px]" />

          <div className="flex items-center gap-2 mb-6 mt-8">
            {ONBOARDING_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setOnboardStep(i)}
                aria-label={`${i + 1} / ${ONBOARDING_SLIDES.length}`}
                aria-current={i === onboardStep}
                className={`h-1.5 rounded-full transition-all ${i === onboardStep ? "w-8 bg-rose-600" : "w-2 bg-gray-200 hover:bg-gray-300"}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {onboardStep > 0 && (
              <button
                onClick={() => setOnboardStep((s) => s - 1)}
                className="h-12 px-4 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition flex items-center gap-1.5"
              >
                <ChevronLeft size={16} /> {t("back")}
              </button>
            )}
            <button
              onClick={() => { if (isLast) close(); else setOnboardStep((s) => s + 1); }}
              className="flex-1 h-12 bg-rose-600 text-white rounded-2xl font-semibold text-sm hover:bg-rose-700 transition flex items-center justify-center gap-1.5"
            >
              {isLast ? t("letsStartBtn") : t("nextBtn")}
              {!isLast && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
