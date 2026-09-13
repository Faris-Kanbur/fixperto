/**
 * Bileşen testleri için uygulama durumunun (AppLogicProvider) denetimli taklidi.
 * ------------------------------------------------------------------------------------------------
 * Gerçek sağlayıcı bütün ekranı, ağ çağrılarını ve yönlendirmeyi içeri çeker; bir kartın doğru
 * çizilip çizilmediğini ölçmek için bunların hiçbiri gerekmiyor. Sağlayıcının KENDİ mantığı ayrı
 * statik takımlarda ve uçtan uca testlerde (gerçek sunucuya karşı) denetleniyor.
 *
 * `t` GERÇEK sözlükten okuyor (frontend/src/data/i18n.ts): böylece "bileşen var olmayan bir çeviri
 * anahtarı kullanıyor" hatası testte ortaya çıkar. Uydurma bir t() bunu gizlerdi.
 */
import { T as I18N } from "../../frontend/src/data/i18n.ts";

let current = {};

/** Testler her senaryodan önce hangi durumu görmek istediklerini burada söyler. */
export function setAppState(partial) {
  current = { ...partial };
}

/** Sözlükte OLMAYAN anahtarları yakalayabilmek için kayıt tutuyoruz. */
export const missingKeys = new Set();

function translate(key, vars) {
  const entry = I18N?.[key];
  if (!entry) { missingKeys.add(key); return key; }
  const lang = current.lang || "tr";
  let text = entry[lang] ?? entry.tr ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.split(`{${k}}`).join(String(v));
  return text;
}

const noop = () => {};

export function useApp() {
  return new Proxy({}, {
    get(_t, prop) {
      if (prop === "t") return translate;
      if (prop === "lang") return current.lang || "tr";
      if (prop in current) return current[prop];
      /**
       * Tanımlanmamış her anahtar zararsız bir işlev döndürüyor: bağlamdaki değerlerin çoğu
       * ya bir olay göndericisi ya da bir yardımcı hesap işlevi, ve testin ilgilendiği veriler
       * zaten setAppState ile açıkça veriliyor.
       * DİKKAT: işlev DOĞRU (truthy) bir değerdir. "Seçili kayıt var mı?" gibi kontroller bundan
       * etkilenir, bu yüzden öyle anahtarlar testte açıkça null veriliyor (bkz. SWEEP_STATE).
       */
      return noop;
    },
  });
}

export const AppLogicProvider = ({ children }) => children;
export default useApp;
