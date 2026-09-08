import { useApp } from "../../app/state/AppLogicProvider";
import { CAR_BRANDS } from "../../data/constants";
import { modelsForBrand } from "../../data/carModels";
import { canonicalBrand } from "../../utils/helpers";
import { ComboBox } from "./ComboBox";

/**
 * ARAÇ MARKASI VE MODELİ SEÇİCİLERİ
 * ---------------------------------------------------------------------------------------------
 * NEDEN LİSTEDEN SEÇİLİYOR:
 * Tamirci hizmet fiyatlarını MARKA BAZINDA giriyor (bkz. Service.brandPrices) ve o markaları
 * sabit CAR_BRANDS listesinden seçiyor. Araç sahibi markayı serbestçe yazdığında ("bmw", "Bmw ")
 * yazdığı metin tamircinin anahtarıyla eşleşmiyordu; kişi randevu ekranında kendi markasının
 * fiyatını göremiyor, varsayılan fiyatı görüyordu. Yani serbest metin bir yazım rahatsızlığı
 * değil, fiyatlandırmanın sessizce yanlış çalışmasıydı.
 *
 * NEDEN AÇILIR LİSTE DEĞİL DE YAZARAK SÜZÜLEN KUTU:
 * İlk çözüm klasik bir `select` idi; 25 markalık listede aradığını bulmak gözle tarama
 * gerektiriyordu, model listesi eklenince bu iyice zorlaşacaktı. Artık kutuya yazdıkça liste
 * süzülüyor — hem hızlı hem de listede olmayan araçlar için serbest yazma açık kalıyor
 * (bkz. ComboBox).
 *
 * MODEL, MARKAYA BAĞLI: marka seçilmeden model önerisi gösterilmiyor, çünkü hangi listeyi
 * göstereceğimiz markaya bağlı. Marka değişince model alanı temizleniyor — "BMW / Clio" gibi
 * imkânsız bir çift kayda geçmesin.
 */
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
  return (
    <div className={className}>
      <ComboBox
        value={value}
        onChange={onChange}
        options={CAR_BRANDS}
        placeholder={t("bookingBrandPlaceholder")}
        ariaLabel={t("bookingBrandPlaceholder")}
        compact={compact}
        emptyHint={t("comboNoMatchHint")}
      />
    </div>
  );
}

export function ModelSelect({
  brand,
  value,
  onChange,
  className = "",
  compact = false,
}: {
  brand: string;
  value: string;
  onChange: (model: string) => void;
  className?: string;
  compact?: boolean;
}) {
  const { t } = useApp();
  // canonicalBrand: kullanıcı "bmw" yazdıysa da BMW'nin modelleri gelsin.
  const options = modelsForBrand(canonicalBrand(brand));
  return (
    <div className={className}>
      <ComboBox
        value={value}
        onChange={onChange}
        options={options}
        placeholder={t("bookingModelPlaceholder")}
        ariaLabel={t("bookingModelPlaceholder")}
        compact={compact}
        emptyHint={brand ? t("comboNoMatchHint") : t("modelPickBrandFirst")}
      />
    </div>
  );
}
