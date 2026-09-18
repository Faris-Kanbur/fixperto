import { Monitor } from "lucide-react";

/**
 * TANINAN TARAYICILAR PANELİ.
 * ================================================================================================
 * "Hesabınıza yeni bir tarayıcıdan giriş yapıldı" e-postasının arayüzdeki karşılığı. O e-postada
 * bilinçli olarak hiçbir BAĞLANTI yok (kimlik avı şablonuna dönüşmesin, jeton taşımasın — bkz.
 * backend/routes/auth.js); bunun karşılığı olarak kullanıcıyı uygulamanın içine yönlendiriyoruz,
 * yani gideceği bir yerin OLMASI gerekiyor. Burası o yer.
 *
 * NEDEN AYRI BİR BİLEŞEN: hesap güvenliği bölümü iki yerde var — araç sahibi ayarları ve tamirci
 * ayarları. Bu projede en sık tekrarlayan hata sınıfı tam olarak bu: bir şey bir yere eklenip
 * kardeşine eklenmiyor (geri tuşu, Escape ile kapatma, iptal geri alma…). Tek bileşen, iki çağrı.
 *
 * DİL: "cihaz" değil "tarayıcı" diyoruz. Tespit edilen şey tarayıcı + işletim sistemi birleşimi;
 * aynı bilgisayarda Safari'ye geçmek yeni bir satır açar. Kullanıcıya olduğundan fazla kesinlik
 * iddia etmek, ilk yanlış alarmda güvenini kaybetmek demek.
 */
export type KnownDevice = { label: string; firstSeenAt: number; lastSeenAt: number; loginCount: number };

type Props = {
  devices?: KnownDevice[] | null;
  loading?: boolean;
  onLoad?: () => void;
  t?: (key: string, vars?: Record<string, string>) => string;
  lang?: string;
};

/**
 * TÜM PROP'LARIN VARSAYILANI VAR — bunu tests/ui-render testi yakaladı.
 * O test her bileşeni BOŞ prop'larla çizmeye çalışıyor; ilk hâlinde \`t\` zorunluydu ve bileşen
 * "t is not a function" ile çöküyordu. Bu teorik bir kusur değil: bir bileşen eksik veriyle
 * çöktüğünde React ağacın tamamını düşürür, yani burada yapılan bir hata ayarlar ekranının
 * TAMAMINI beyaz bırakır. Varsayılanlar o riski kapatıyor.
 */
export function KnownDevices({ devices = null, loading = false, onLoad = () => {}, t = (k) => k, lang = "tr" }: Props) {
  const fmt = (ms: number) => {
    try {
      return new Date(ms).toLocaleDateString(lang === "tr" ? "tr-TR" : lang === "de" ? "de-DE" : "en-GB",
        { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return "—";
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-[11px] text-gray-400 mb-2">{t("knownDevicesDesc")}</p>
      {/* `devices === null` iki farklı durumu kapsıyor: henüz istenmedi ve istenip BAŞARISIZ oldu.
          İkisinde de listeyi göstermiyoruz — boş liste göstermek "hiç tarayıcı yok" demek olurdu
          ve bu yanlış bilgi olurdu. Hata durumunda kullanıcı uyarı mesajını zaten görüyor. */}
      {devices === null ? (
        <button
          onClick={onLoad}
          disabled={loading}
          className="text-xs font-semibold text-gray-700 border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-50 transition disabled:opacity-50"
        >
          {loading ? t("knownDevicesLoading") : t("knownDevicesBtn")}
        </button>
      ) : devices.length === 0 ? (
        <p className="text-xs text-gray-500">{t("knownDevicesEmpty")}</p>
      ) : (
        <>
          <ul className="space-y-1.5 mb-2">
            {devices.map((d, i) => (
              <li key={`${d.label}-${i}`} className="flex items-start gap-2 text-xs text-gray-600">
                <Monitor size={13} className="text-gray-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>
                  <span className="font-medium text-gray-700">{d.label}</span>
                  <span className="block text-[11px] text-gray-400">
                    {t("knownDeviceLastSeen", { d: fmt(d.lastSeenAt), n: String(d.loginCount) })}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {/* Ne yapılacağını söylemeyen bir uyarı işe yaramaz: tanınmayan bir satır görünce
              atılacak iki adım burada yazılı ve ikisinin butonu da hemen yukarıda. */}
          <p className="text-[11px] text-gray-400">{t("knownDevicesNotMine")}</p>
        </>
      )}
    </div>
  );
}
