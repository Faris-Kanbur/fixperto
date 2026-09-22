import { useEffect, useState } from "react";
import { X, Search, MapPin, SlidersHorizontal } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";
import {
  FUEL_TYPES, TRANSMISSIONS, BODY_TYPES, EMPLOYMENT_TYPES, EXPERIENCE_LEVELS,
  FUEL_TYPE_LABELS_BY_LANG, TRANSMISSION_LABELS_BY_LANG,
} from "../../data/constants";
import { vocabLabel } from "../../utils/helpers";

/**
 * KAYITLI ARAMAYI DÜZENLEME PENCERESİ.
 * ------------------------------------------------------------------------------------------------
 * ÖNCEKİ HÂLİ (kullanıcı bildirdi): satırdaki kalem simgesi YALNIZCA adı değiştiriyordu. Oysa bir
 * kayıtlı aramanın asıl içeriği kriterleridir; "azami fiyatı 50 bin artırayım" diyen kişi aramayı
 * silip baştan kurmak zorunda kalıyordu — ve sildiği anda "hangi ilanları zaten gördü" takibi de
 * sıfırlanıyor, bir sonraki açılışta eski ilanların hepsi "yeni eşleşme" diye bildiriliyordu.
 * Yani en masum düzenleme, bildirimleri çöpe çeviriyordu.
 *
 * TASARIM KARARI — neden bütün filtreler burada DEĞİL:
 * Araç aramasının 35'in üzerinde filtresi var. Hepsini bu pencereye kopyalamak, aynı arayüzün
 * ikinci bir kopyasını yaratmak demekti; biri düzeltilip diğeri unutulduğunda ikisi ayrışırdı.
 * Bunun yerine:
 *   - Karar veren, sık değişen alanlar burada doğrudan düzenleniyor (fiyat, yıl, km, yakıt, vites,
 *     kasa; tamircide puan/doğrulanmış; iş ilanında çalışma türü/deneyim).
 *   - Diğer TÜM aktif filtreler rozet olarak listeleniyor ve tek tıkla KALDIRILABİLİYOR.
 *   - Sıfırdan karmaşık bir filtre kurmak isteyen için doğru yol zaten arama ekranı: oradaki
 *     filtre panelini kullanıp "kriterleri şu ankiyle değiştir" düğmesine basmak.
 * Bu sınır bilinçli ve el kitabında yazılı.
 *
 * Kaydetmeden önce "bu kriterlere şu an kaç kayıt uyuyor" canlı gösteriliyor: kullanıcı kaydettiği
 * şeyin boş bir arama olup olmadığını GÖRSÜN, sonradan "hiç bildirim gelmiyor" diye şaşırmasın.
 */
export function SavedSearchEditModal() {
  const {
    t, lang, editingSavedSearch, closeSavedSearchEditor, saveSavedSearchEdits,
    countSearchMatches, EMPTY_LISTING_FILTERS, EMPTY_MECH_FILTERS, savedSearchFilterLabel,
  } = useApp();
  const [draft, setDraft] = useState(null);

  useEffect(() => { setDraft(editingSavedSearch ? { ...editingSavedSearch, filters: { ...(editingSavedSearch.filters || {}) } } : null); }, [editingSavedSearch?.id]);

  if (!editingSavedSearch || !draft) return null;
  const type = draft.type || "cars";
  const emptyFilters = type === "cars" ? EMPTY_LISTING_FILTERS
    : type === "jobs" ? { employmentType: "all", experienceLevel: "all" } : EMPTY_MECH_FILTERS;

  const setF = (key, value) => setDraft((d) => ({ ...d, filters: { ...d.filters, [key]: value } }));
  const clearF = (key) => setDraft((d) => ({ ...d, filters: { ...d.filters, [key]: emptyFilters[key] } }));

  // Burada AYRI AYRI düzenlenen alanlar; kalanlar aşağıda rozet olarak çıkıyor.
  const INLINE = type === "cars"
    ? ["fuelType", "transmission", "bodyType", "minPrice", "maxPrice", "minYear", "maxYear", "maxKm"]
    : type === "jobs" ? ["employmentType", "experienceLevel"]
      : ["minRating", "maxPrice", "verifiedOnly"];

  const activeOtherFilters = Object.keys(emptyFilters).filter((key) => {
    if (INLINE.includes(key)) return false;
    const cur = draft.filters?.[key];
    const empty = emptyFilters[key];
    if (Array.isArray(empty)) return (cur || []).length > 0;
    if (typeof empty === "boolean") return !!cur;
    return cur !== empty && cur !== "" && cur != null;
  });

  const matchCount = countSearchMatches(type, {
    type, query: draft.query || "", locationQuery: draft.locationQuery || "",
    serviceQuery: draft.serviceQuery || "", filters: { ...emptyFilters, ...draft.filters },
  });

  const num = (key, placeholder) => (
    <input type="number" inputMode="numeric" value={draft.filters?.[key] ?? ""} placeholder={placeholder}
      onChange={(e) => setF(key, e.target.value)}
      className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-subtle" />
  );
  const select = (key, options, labelFor = (v) => v) => (
    <select value={draft.filters?.[key] ?? "all"} onChange={(e) => setF(key, e.target.value)}
      className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-white">
      <option value="all">{t("allFilterLabel")}</option>
      {options.map((o) => <option key={o} value={o}>{labelFor(o)}</option>)}
    </select>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={t("savedSearchEditTitle")}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-surface-elevated px-5 py-4 flex items-center justify-between gap-3">
          <h3 className="font-bold text-fg text-base">{t("savedSearchEditTitle")}</h3>
          <button onClick={closeSavedSearchEditor} aria-label={t("cancel")} className="text-fg-muted hover:text-fg-strong p-2 -m-2"><X size={18} /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-fg-secondary block mb-1.5">{t("savedSearchNameFieldLabel")}</span>
            <input value={draft.name || ""} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-subtle" />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-fg-secondary mb-1.5 flex items-center gap-1.5"><Search size={12} /> {type === "cars" ? t("brandModelFieldLabel") : type === "jobs" ? t("positionFieldLabel") : t("brandFieldLabel")}</span>
            <input value={draft.query || ""} onChange={(e) => setDraft((d) => ({ ...d, query: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-subtle" />
          </label>

          {type === "mechanics" && (
            <label className="block">
              <span className="text-xs font-medium text-fg-secondary block mb-1.5">{t("serviceFieldLabel")}</span>
              <input value={draft.serviceQuery || ""} onChange={(e) => setDraft((d) => ({ ...d, serviceQuery: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-subtle" />
            </label>
          )}

          <label className="block">
            <span className="text-xs font-medium text-fg-secondary mb-1.5 flex items-center gap-1.5"><MapPin size={12} /> {t("cityLabelShort")}</span>
            <input value={draft.locationQuery || ""} onChange={(e) => setDraft((d) => ({ ...d, locationQuery: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-subtle" />
          </label>

          <div className="pt-1">
            <p className="text-xs font-semibold text-fg-strong mb-2 flex items-center gap-1.5"><SlidersHorizontal size={13} className="text-info" /> {t("filterBtn")}</p>
            {type === "cars" && (
              <div className="grid grid-cols-2 gap-2">
                <div>{select("fuelType", FUEL_TYPES, (v) => vocabLabel(v, lang, FUEL_TYPE_LABELS_BY_LANG))}</div>
                <div>{select("transmission", TRANSMISSIONS, (v) => vocabLabel(v, lang, TRANSMISSION_LABELS_BY_LANG))}</div>
                <div className="col-span-2">{select("bodyType", BODY_TYPES)}</div>
                <div>{num("minPrice", t("minPlaceholder"))}</div>
                <div>{num("maxPrice", t("maxPlaceholder"))}</div>
                <div>{num("minYear", t("minYearPlaceholder"))}</div>
                <div>{num("maxYear", t("maxYearPlaceholder"))}</div>
                <div className="col-span-2">{num("maxKm", t("maxKmPlaceholder"))}</div>
              </div>
            )}
            {type === "jobs" && (
              <div className="grid grid-cols-2 gap-2">
                <div>{select("employmentType", EMPLOYMENT_TYPES)}</div>
                <div>{select("experienceLevel", EXPERIENCE_LEVELS)}</div>
              </div>
            )}
            {type === "mechanics" && (
              <div className="grid grid-cols-2 gap-2">
                <div>{num("minRating", t("minRatingLabel"))}</div>
                <div>{num("maxPrice", t("maxPlaceholder"))}</div>
                <label className="col-span-2 flex items-center gap-2 text-sm text-fg-secondary">
                  <input type="checkbox" checked={!!draft.filters?.verifiedOnly} onChange={(e) => setF("verifiedOnly", e.target.checked)} className="w-4 h-4 accent-blue-600" />
                  {t("nearMissVerified")}
                </label>
              </div>
            )}
          </div>

          {/* Burada tek tek düzenlenmeyen filtreler: en azından GÖRÜNSÜNLER ve kaldırılabilsinler.
              Görünmeyen bir filtre, "neden hiç sonuç gelmiyor" sorusunun görünmeyen cevabıdır. */}
          {activeOtherFilters.length > 0 && (
            <div>
              <p className="text-[11px] text-fg-muted mb-1.5">{t("savedSearchOtherFiltersHint")}</p>
              <div className="flex flex-wrap gap-1.5">
                {activeOtherFilters.map((key) => (
                  <button key={key} onClick={() => clearF(key)}
                    className="inline-flex items-center gap-1 text-[11px] bg-background border border-border text-fg-secondary px-2 py-1 rounded-full hover:border-red-300 hover:text-error transition">
                    {savedSearchFilterLabel(key)}<X size={10} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Kaydetmeden önce sonucu göster: boş bir arama kaydedip "bildirim gelmiyor" demesin. */}
          <p className={`text-xs ${matchCount === 0 ? "text-warning" : "text-fg-secondary"}`}>
            {matchCount === 0 ? t("savedSearchEditNoMatch") : t("savedSearchEditMatchCount", { n: String(matchCount) })}
          </p>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-surface-elevated px-5 py-3 flex gap-2">
          <button onClick={closeSavedSearchEditor} className="flex-1 border border-border text-fg-secondary py-2.5 rounded-xl text-sm font-medium">{t("cancel")}</button>
          <button onClick={() => saveSavedSearchEdits(draft)} className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-hover transition">{t("save")}</button>
        </div>
      </div>
    </div>
  );
}

export default SavedSearchEditModal;
