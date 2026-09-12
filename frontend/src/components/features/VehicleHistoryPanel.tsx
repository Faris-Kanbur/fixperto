import { useEffect, useState } from "react";
import { History, Search, ShieldCheck, Wrench, Calendar, Loader2, Lock } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";
import { InfoTip } from "./InfoTip";
import { api } from "../../services/api/client";

/**
 * ARACIN GEÇMİŞİ — şasi (VIN) numarasına bağlı, sahipten bağımsız servis kaydı.
 * ---------------------------------------------------------------------------------------------
 * İki ekran, tek bileşen:
 *  - VinLookupPanel: "şasi numarasıyla sorgula". Hem araç sahibi (ikinci el araç aldı) hem
 *    tamirci (tamirhanesine ilk kez gelen araç) için aynı şey gerekiyor, bu yüzden tek bileşen.
 *  - VerifiedHistoryList: kayıtların listesi. İlan sayfasında, sorgulama sonucunda ve aracın
 *    kendi sayfasında AYNI biçimde görünür — kullanıcı aynı şeyi aynı yerde aynı şekilde görsün.
 *
 * Gösterilen alanlar bilinçli olarak dar: tarih, işletme, yapılan iş, varsa km ve garanti.
 * Eski sahibin adı/telefonu/plakası ve ödenen tutar sunucudan zaten DÖNMÜYOR (bkz.
 * backend/routes/vehicleHistory.js) — bunlar aracın değil bir kişinin verisi.
 *
 * Modül düzeyinde tanımlı — bkz. tests/ui.test.mjs KURAL 8.
 */

const fmtDate = (value, lang) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "tr-TR", { day: "numeric", month: "long", year: "numeric" });
};

export function VerifiedHistoryList({ records, emptyText = null }: { records: any[]; emptyText?: string | null }) {
  const { t, lang } = useApp();
  if (!records || records.length === 0) {
    return emptyText ? <p className="text-sm text-gray-400 py-4 text-center">{emptyText}</p> : null;
  }
  return (
    <div className="space-y-2">
      {records.map((r) => (
        <div key={r.id} className="flex items-start gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0"><Wrench size={14} /></div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{r.serviceText || "—"}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-[11px] text-gray-400">
              <span className="flex items-center gap-1"><Calendar size={11} /> {fmtDate(r.serviceDate, lang)}</span>
              {r.mechanicName && <span className="truncate">{r.mechanicName}</span>}
              {r.km != null && <span>{Number(r.km).toLocaleString("tr-TR")} km</span>}
              {r.warrantyEndDate && <span className="text-emerald-600">{t("vinWarrantyLabel")}: {fmtDate(r.warrantyEndDate, lang)}</span>}
            </div>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5 flex-shrink-0">
            <ShieldCheck size={11} /> {t("verifiedBadge")}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Şasi numarasıyla sorgulama — araç sahibi ve tamirci için aynı panel. */
export function VinLookupPanel() {
  const { t, vinLookup, lookupVin, clearVinLookup } = useApp();
  const [input, setInput] = useState("");
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-1">
        <History size={15} className="text-rose-500" /> {t("vinLookupTitle")}
        <InfoTip text={t("vinTip")} label={t("infoTipAria")} />
      </h3>
      <p className="text-[12px] text-gray-500 leading-relaxed mb-3">{t("vinLookupDesc")}</p>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === "Enter") lookupVin(input); }}
          placeholder={t("vinPlaceholder")}
          aria-label={t("vinLabel")}
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono tracking-wide focus:outline-none focus:ring-2 focus:ring-rose-200"
        />
        <button onClick={() => lookupVin(input)} disabled={vinLookup.loading}
          className="bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-60 flex items-center gap-1.5">
          {vinLookup.loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} {t("vinLookupBtn")}
        </button>
      </div>
      {vinLookup.error && <p className="text-[12px] text-red-500 mt-2">{vinLookup.error}</p>}
      {vinLookup.records && (
        <div className="mt-4">
          <VerifiedHistoryList records={vinLookup.records} emptyText={t("vinLookupEmpty")} />
          {/* "Kayıt yok" ile "kayıt var ama paylaşılmamış" farkı söylenmeli: alıcı eksik bilgiyi
              temiz geçmiş sanmamalı. */}
          {vinLookup.hiddenCount > 0 && (
            <p className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-2">
              <Lock size={11} /> {t("vinLookupHidden", { n: String(vinLookup.hiddenCount) })}
            </p>
          )}
          <button onClick={clearVinLookup} className="text-[11px] text-gray-400 hover:text-gray-600 mt-3">{t("vinHistoryClearBtn")}</button>
        </div>
      )}
    </div>
  );
}

/** İlan sayfasındaki "doğrulanmış servis geçmişi" bölümü. Satıcı açmadıysa hiç görünmez. */
export function ListingHistorySection({ listingId }: { listingId: number | string }) {
  const { t } = useApp();
  const [state, setState] = useState<{ loading: boolean; records: any[]; shown: boolean; earlierCount: number }>({ loading: true, records: [], shown: false, earlierCount: 0 });
  useEffect(() => {
    let alive = true;
    api.vehicleHistory.forListing(listingId)
      .then((res) => { if (alive) setState({ loading: false, records: res.records || [], shown: !!res.shown, earlierCount: (res as any).earlierCount || 0 }); })
      .catch(() => { if (alive) setState({ loading: false, records: [], shown: false, earlierCount: 0 }); });
    return () => { alive = false; };
  }, [listingId]);
  if (state.loading || !state.shown || state.records.length === 0) return null;
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 md:p-5">
      <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-1">
        <ShieldCheck size={15} className="text-emerald-500" /> {t("vehicleHistoryVerifiedTitle")}
        <InfoTip text={t("vehicleHistoryVerifiedNote")} label={t("infoTipAria")} />
      </h3>
      <p className="text-[11px] text-gray-400 mb-3">{t("listingHistoryOwnPeriodNote")}</p>
      <VerifiedHistoryList records={state.records} />
      {/* Alıcı, gösterilenin ARACIN TÜM GEÇMİŞİ olduğunu sanmamalı: ilanda yalnızca satıcının
          kendi dönemi yayımlanıyor (bkz. backend). Daha eski kayıt varsa sayısını söylüyoruz. */}
      {state.earlierCount > 0 && (
        <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">{t("listingHistoryEarlierNote", { n: String(state.earlierCount) })}</p>
      )}
    </div>
  );
}
