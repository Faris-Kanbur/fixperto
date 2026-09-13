import { useState } from "react";
import { Bell, Trash2, Pencil, Check, X, RefreshCw } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";

/**
 * KAYITLI ARAMALAR LİSTESİ
 * ---------------------------------------------------------------------------------------------
 * ÖNCEKİ HÂLİ: yalnızca "uygula" ve "sil". Adını yanlış yazan ya da kriterleri değişen kişi
 * aramayı silip baştan kurmak zorundaydı — ve sildiği anda "yeni eşleşme" takibi de sıfırlanıyordu,
 * yani bir sonraki açılışta eski ilanların hepsi "yeni" gibi bildirilirdi.
 *
 * ARTIK İKİ DÜZENLEME VAR:
 *   1) Ad değiştirme (satır içi) — en sık ihtiyaç.
 *   2) "Kriterleri şu ankiyle değiştir" — kullanıcı filtreleri elinde tutarken aramayı tazeliyor.
 *      Bu düğme YALNIZCA arama ekranında görünüyor (showUpdate), çünkü profil sayfasında "şu anki
 *      filtre" diye bir bağlam yok; orada göstermek kullanıcıyı yanıltırdı.
 *
 * Aynı liste iki yerde kullanılıyor (profil sayfası ve arama ekranı yan paneli); tek bileşen
 * olması, birinde düzeltilen bir davranışın diğerinde eksik kalmasını engelliyor.
 *
 * Modül düzeyinde tanımlı — bkz. tests/ui.test.mjs KURAL 8.
 */
export function SavedSearchList({ showUpdate = false, compact = false }: { showUpdate?: boolean; compact?: boolean }) {
  const { t, savedSearches, applySavedSearch, removeSavedSearch, renameSavedSearch, updateSavedSearchToCurrent, savedSearchFrequency, setSavedSearchFrequency } = useApp();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");

  const startEdit = (s) => { setEditingId(s.id); setDraftName(s.name); };
  const commit = () => { if (editingId != null) renameSavedSearch(editingId, draftName); setEditingId(null); };

  if (savedSearches.length === 0) {
    return (
      <div className={`text-center ${compact ? "py-8" : "py-10 bg-gray-50 rounded-2xl"}`}>
        <Bell size={compact ? 28 : 32} className="mx-auto text-gray-200 mb-2" />
        <p className="text-gray-400 text-xs">{t("noSavedSearchesNote")}</p>
      </div>
    );
  }

  const typeLabel = (type) =>
    type === "jobs" ? t("savedSearchTypeJobs") : type === "mechanics" ? t("savedSearchTypeMechanics") : t("savedSearchTypeCars");

  return (
    <div className="space-y-2">
      {savedSearches.map((s) => {
        const editing = editingId === s.id;
        const freq = savedSearchFrequency(s);
        return (
          <div key={s.id} className={`rounded-2xl p-3 transition ${compact ? "border border-gray-100 hover:border-rose-200" : "bg-white border border-gray-100 shadow-sm"}`}>
            <div className="flex items-center justify-between gap-2">
            {editing ? (
              <>
                <input
                  value={draftName}
                  autoFocus
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditingId(null); }}
                  aria-label={t("savedSearchRenameAria")}
                  className="flex-1 min-w-0 px-3 py-1.5 rounded-xl border border-rose-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
                <button onClick={commit} aria-label={t("save")} className="text-emerald-600 hover:text-emerald-700 flex-shrink-0 p-2 -m-1"><Check size={15} /></button>
                <button onClick={() => setEditingId(null)} aria-label={t("cancel")} className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-2 -m-1"><X size={15} /></button>
              </>
            ) : (
              <>
                <button onClick={() => applySavedSearch(s)} className="flex-1 text-left min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate flex items-center gap-1.5">
                    {s.name}
                    <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">{typeLabel(s.type)}</span>
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {[s.query, s.serviceQuery, s.locationQuery].filter(Boolean).join(" · ") || t("allFilterLabel")}
                  </p>
                </button>
                {showUpdate && (
                  <button onClick={() => updateSavedSearchToCurrent(s.id)} title={t("savedSearchUpdateCriteriaAria")} aria-label={t("savedSearchUpdateCriteriaAria")}
                    className="text-gray-400 hover:text-rose-600 flex-shrink-0 p-2 -m-1"><RefreshCw size={14} /></button>
                )}
                <button onClick={() => startEdit(s)} title={t("savedSearchRenameAria")} aria-label={t("savedSearchRenameAria")}
                  className="text-gray-400 hover:text-gray-700 flex-shrink-0 p-2 -m-1"><Pencil size={14} /></button>
                <button onClick={() => removeSavedSearch(s.id)} aria-label={t("deleteSavedSearchAria")}
                  className="text-red-400 hover:text-red-600 flex-shrink-0 p-2 -m-1"><Trash2 size={14} /></button>
              </>
            )}
            </div>
            {/* BİLDİRİM SIKLIĞI — arama başına. Emlak/iş ilanı sitelerinin yaptığı gibi: geniş bir
                aramada her sonuç için ayrı bildirim yorucu olur, kullanıcı da bildirimleri tümden
                kapatır. Günlük/haftalıkta eşleşmeler tek özet bildirimde toplanıyor. */}
            {!editing && (
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-100 flex-wrap">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mr-0.5">{t("savedSearchFreqLabel")}</span>
                {["instant", "daily", "weekly", "off"].map((f) => (
                  <button key={f} onClick={() => setSavedSearchFrequency(s.id, f)} aria-pressed={freq === f}
                    title={t("savedSearchFreqHint")}
                    className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition ${freq === f ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                    {t(`savedSearchFreq_${f}`)}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
