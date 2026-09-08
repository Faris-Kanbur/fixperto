import { Wrench, Car, Briefcase, BookOpen, LifeBuoy, Mail, ChevronRight } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";
import { SERVICE_CATALOG_FLAT, TR_CITY_COORDS } from "../../data/constants";
import { LangSwitch } from "./LangSwitch";

/**
 * SITE ALT BİLGİSİ (footer)
 * ---------------------------------------------------------------------------------------------
 * Yapı, AutoScout24'ün gerçek alt bilgisi örnek alınarak kuruldu (Unternehmen / Service /
 * In Verbindung bleiben / dil-ülke seçici / telif satırı) ama Fixperto'nun iki taraflı pazar
 * yeri olmasına göre uyarlandı: araç sahibi ve tamirci sütunları AYRI. Bir pazar yerinde bu
 * ayrım önemli, çünkü iki taraf tamamen farklı şeyler arıyor.
 *
 * SEO NOTU — "Popüler aramalar" blokları süs değil:
 * Pazar yerleri organik trafiğin büyük kısmını "İstanbul'da tamirci", "fren balatası değişimi"
 * gibi uzun kuyruklu aramalardan alır. Alt bilgideki bu bağlantılar hem kullanıcıya kısayol
 * verir hem de site içi bağlantı ağını kurar. Bağlantılar gerçek aramaları TETİKLİYOR
 * (setLocationQuery/setServiceQuery + goToBrowse), yani içi boş bağlantı değiller.
 *
 * DÜRÜST SINIR: bu uygulama istemci tarafında render ediliyor (SSR yok). Alt bilgideki
 * bağlantılar ve blog yazıları JavaScript çalıştıran botlar tarafından görülür; tam SEO için
 * ileride sunucu tarafı render ya da ön-render gerekir. Backend'e sitemap.xml ve robots.txt
 * eklendi (bkz. backend/server.js) — bu, o adım atılana kadarki en faydalı parça.
 */
/**
 * Modül düzeyinde tanımlı — bkz. AppShell.tsx'teki aynı düzeltmenin gerekçesi: bileşeni ana
 * bileşenin içinde tanımlamak, her render'da yeni bir tür üretip alttaki ağacı söküp yeniden
 * kurmaya yol açıyor (kaydırma konumu, odak ve alt bileşen durumu kayboluyor).
 */
const Col = ({ title, icon: Icon, children }) => (
  <div>
    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Icon size={15} className="text-rose-500" /> {title}</h3>
    <ul className="space-y-2">{children}</ul>
  </div>
);

const Item = ({ onClick, children }) => (
  <li><button onClick={onClick} className="text-sm text-gray-500 hover:text-rose-600 transition text-left">{children}</button></li>
);

export function SiteFooter() {
  const {
    t, lang, setScreen, goToBrowse, setLocationQuery, setServiceQuery, setQuery,
    setLegalModalTopic, setShowNewTicketForm, isAuthed, role, setRole,
    setMechTab, setMechListingsSubTab, openSellForm, setAboutSection,
  } = useApp();

  // Popüler şehirler: koordinat tablosundaki ilk 8 şehir (mesafe hesabında zaten kullanılıyor,
  // yani gerçekten desteklenen şehirler — uydurma bir liste değil).
  const cities = Object.keys(TR_CITY_COORDS).slice(0, 8);
  const cityLabel = (c) => c.charAt(0).toLocaleUpperCase("tr-TR") + c.slice(1);
  // Popüler hizmetler: katalogdan en çok aranan 8 iş.
  const POPULAR_SERVICE_KEYS = ["oil_change", "brake_pads", "periodic_service", "tire_change",
    "ac_service", "battery", "wheel_alignment", "exhaust"];
  const services = POPULAR_SERVICE_KEYS
    .map((k) => SERVICE_CATALOG_FLAT.find((s) => s.key === k))
    .filter(Boolean);

  const searchCity = (c) => { setLocationQuery(cityLabel(c)); setServiceQuery(""); setQuery(""); goToBrowse("mechanics"); };
  const searchService = (s) => { setServiceQuery(s[lang] || s.tr); setLocationQuery(""); setQuery(""); goToBrowse("mechanics"); };


  return (
    <footer className="w-full bg-white border-t border-gray-100 mt-12">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-10 md:py-14">
        {/* ---- Ana bağlantı sütunları ---- */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center"><Wrench size={16} className="text-white" /></div>
              <span className="text-lg font-extrabold tracking-tight text-gray-900">Fix<span className="text-rose-600">perto</span></span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{t("footerTagline")}</p>
          </div>

          <Col title={t("footerForOwners")} icon={Car}>
            <Item onClick={() => goToBrowse("mechanics")}>{t("findMechanic")}</Item>
            <Item onClick={() => goToBrowse("cars")}>{t("findCar")}</Item>
            <Item onClick={() => goToBrowse("jobs")}>{t("jobListingsNavLabel")}</Item>
            <Item onClick={() => openSellForm(null)}>{t("sellMyCar")}</Item>
          </Col>

          <Col title={t("footerForMechanics")} icon={Wrench}>
            <Item onClick={() => {
              if (isAuthed && role === "mechanic") { setScreen("mechanicDashboard"); setMechTab("profile"); return; }
              setRole("mechanic"); setScreen("signup");
            }}>{t("footerMechanicSignup")}</Item>
            <Item onClick={() => {
              if (isAuthed && role === "mechanic") { setScreen("mechanicDashboard"); setMechTab("market"); setMechListingsSubTab("jobs"); return; }
              setRole("mechanic"); setScreen("signup");
            }}>{t("footerPostJob")}</Item>
            <Item onClick={() => setScreen("blog")}>{t("footerMechanicGuide")}</Item>
          </Col>

          <Col title={t("footerCompany")} icon={BookOpen}>
            <Item onClick={() => setScreen("blog")}>{t("blogTitle")}</Item>
            <Item onClick={() => setScreen("about")}>{t("footerAbout")}</Item>
            <Item onClick={() => setShowNewTicketForm(true)}>{t("footerContact")}</Item>
          </Col>

          <Col title={t("footerSupport")} icon={LifeBuoy}>
            <Item onClick={() => setShowNewTicketForm(true)}>{t("footerContact")}</Item>
            <Item onClick={() => { setScreen("about"); setAboutSection("faq"); }}>{t("footerFaq")}</Item>
            <Item onClick={() => setLegalModalTopic("terms")}>{t("termsOfUseBtn")}</Item>
            <Item onClick={() => setLegalModalTopic("privacy")}>{t("privacyPolicyBtn")}</Item>
          </Col>
        </div>

        {/* ---- SEO: popüler aramalar ---- */}
        <div className="border-t border-gray-100 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">{t("footerPopularCities")}</h4>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {cities.map((c) => (
                <button key={c} onClick={() => searchCity(c)} className="text-sm text-gray-500 hover:text-rose-600 transition">
                  {t("footerCityMechanics", { city: cityLabel(c) })}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">{t("footerPopularServices")}</h4>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {services.map((s) => (
                <button key={s.key} onClick={() => searchService(s)} className="text-sm text-gray-500 hover:text-rose-600 transition">
                  {s[lang] || s.tr}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---- Alt bar: telif, dil, iletişim ---- */}
      <div className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400 text-center sm:text-left">
            © {new Date().getFullYear()} <span className="font-semibold text-gray-500">Fixperto</span> · {t("allRightsReserved")}
          </p>
          <div className="flex items-center gap-4">
            <a href="mailto:destek@fixperto.com" className="text-xs text-gray-400 hover:text-rose-600 transition flex items-center gap-1.5"><Mail size={13} /> destek@fixperto.com</a>
            <LangSwitch />
          </div>
        </div>
      </div>
    </footer>
  );
}
