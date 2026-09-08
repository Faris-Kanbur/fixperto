import { useState } from "react";
import { useApp } from "../../app/state/AppLogicProvider";
import { CAR_BRANDS } from "../../data/constants";
import { canonicalBrand } from "../../utils/helpers";

/**
 * ARAÇ MARKASI SEÇİCİ
 * ---------------------------------------------------------------------------------------------
 * NEDEN LİSTE, NEDEN SERBEST METİN DEĞİL:
 * Tamirci hizmet fiyatlarını MARKA BAZINDA giriyor (bkz. Service.brandPrices) ve o markaları
 * sabit CAR_BRANDS listesinden seçiyor. Araç sahibi markayı elle yazdığında ("bmw", "Bmw ",
 * "b.m.w") yazdığı metin tamircinin anahtarıyla eşleşmiyordu; sonuç olarak randevu ekranında
 * kişi kendi markasının fiyatını göremiyor, varsayılan fiyatı görüyordu. Yani serbest metin
 * sadece bir "yazım rahatsızlığı" değil, fiyatlandırmanın sessizce yanlış çalışmasıydı.
 *
 * İki taraf da aynı listeden seçince anahtarlar birebir tutuyor.
 *
 * "Diğer" seçeneği BİLEREK duruyor: 25 markalık liste Türkiye'deki her aracı kapsamıyor
 * (Chery, BYD, Togg, ticari araçlar…). Listeyi zorunlu kılmak, listede olmayan araç sahibini
 * tamamen dışarıda bırakırdı. Listede olmayan marka yazıldığında marka bazlı fiyat zaten
 * bulunamaz ve varsayılan fiyat gösterilir — doğru davranış budur.
 */

const OTHER = "__other__";

export function BrandSelect({
  value,
  onChange,
  className = "",
  compact = false,
}: {
  value: string;
  onChange: (brand: string) => void;
  className?: string;
  compact?: boolean;
}) {
  const { t } = useApp();
  const canon = canonicalBrand(value);
  const inList = !!canon && CAR_BRANDS.includes(canon);
  // Kullanıcı "Diğer"i seçtiği için mi açık, yoksa kayıtlı marka listede olmadığı için mi?
  // İkisi de açık tutmalı; bu yüzden state ile türetilmiş durumu birleştiriyoruz.
  const [chose, setChose] = useState(false);
  const showFree = chose || (!!canon && !inList);

  const box = compact
    ? "w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
    : "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white";

  return (
    <div className={className}>
      <select
        value={showFree ? OTHER : canon}
        aria-label={t("bookingBrandPlaceholder")}
        onChange={(e) => {
          const v = e.target.value;
          if (v === OTHER) { setChose(true); onChange(""); }
          else { setChose(false); onChange(v); }
        }}
        className={box}
      >
        <option value="">{t("bookingBrandPlaceholder")}</option>
        {CAR_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
        <option value={OTHER}>{t("brandOtherOption")}</option>
      </select>
      {showFree && (
        <input
          value={inList ? "" : canon}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("customBrandPlaceholder")}
          aria-label={t("customBrandPlaceholder")}
          className={`${box} mt-2`}
        />
      )}
    </div>
  );
}
