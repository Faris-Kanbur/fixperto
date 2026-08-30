import { useEffect } from "react";
import { Globe, Loader2 } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";

// Sohbet mesajları dışındaki serbest metinler için (randevu "sorun açıklaması", çoklu teklif
// isteği notu vb.) ChatBubble'daki ile AYNI otomatik-çeviri altyapısını (translationCache +
// translateMessage, bkz. AppLogicProvider.tsx) yeniden kullanan küçük, tekrar kullanılabilir bir
// bileşen. `id` alanı translationCache'te GLOBAL olarak benzersiz olmalı — bu yüzden çağıran
// taraf her zaman bir önek kullanmalı (örn. "appt-issue-101"), aksi halde farklı bir mesaj
// kimliğiyle çakışıp yanlış çeviri gösterebilir.
export function TranslatedText({ id, text, fromLang, viewerLang, className = "", compact = false }) {
  const { translationCache, translateMessage, showTranslated, toggleTranslate, t } = useApp();
  const needsTranslation = !!text && !!fromLang && !!viewerLang && fromLang !== viewerLang;
  const manuallySet = showTranslated[id];
  const showTr = needsTranslation ? (manuallySet === undefined ? true : manuallySet) : false;
  const cacheKey = `${id}:${viewerLang}`;
  const translated = translationCache[cacheKey];
  const isTranslating = needsTranslation && showTr && translated === undefined;
  useEffect(() => {
    if (needsTranslation && translated === undefined) translateMessage({ id, text, lang: fromLang }, viewerLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsTranslation, id, viewerLang, translated, text]);
  if (!text) return null;
  const displayText = needsTranslation && showTr && translated ? translated : text;
  return (
    <span className={className}>
      {displayText}
      {needsTranslation && !compact && (
        <button onClick={(e) => { e.stopPropagation(); toggleTranslate(id); }} className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] text-gray-400 hover:underline align-middle">
          {isTranslating ? <Loader2 size={9} className="animate-spin" /> : <Globe size={9} />} {isTranslating ? t("translatingLabel") : showTr ? t("showOriginalToggle") : t("showTranslationToggle")}
        </button>
      )}
    </span>
  );
}
