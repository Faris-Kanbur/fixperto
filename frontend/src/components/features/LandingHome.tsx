import { useApp } from "../../app/state/AppLogicProvider";
import { MechCard } from "./MechCard";
import { ListingCard } from "./ListingCard";
import { LangSwitch } from "./LangSwitch";
import { ATU_FIXED_CATALOG } from "../../data/constants";
import {
  Search, MapPin, Star, Wrench, Car, Briefcase, BadgeCheck, ChevronRight, Navigation,
  Shield, Zap, SlidersHorizontal, Calendar, MessageCircle, LifeBuoy, Users, Quote, Globe,
} from "lucide-react";

// MİSAFİR KARŞILAMA SAYFASI (landing)
// -----------------------------------------------------------------------------------------------
// Siteye ilk giren herkesin (giriş yapmamış ziyaretçi) gördüğü sayfa. Yapı, kullanıcının referans
// verdiği fizyoterapistimibul.com deseninden uyarlandı: üstte arama kartlı bir hero, altında
// "doğrulanmış uzmanlar" şeridi, şehir bazlı keşif, öne çıkan uzmanlar, sık aranan hizmetler,
// nasıl çalışır adımları, avantaj blokları, gerçek kullanıcı yorumları ve çok sütunlu alt bilgi.
//
// ÖNEMLİ: buradaki her sayı/kart GERÇEK veriden geliyor (mechanicsList, listings, adminStats) —
// sahte/dummy içerik yok. Arama alanları da uygulamanın gerçek arama state'ini (query /
// locationQuery / serviceQuery) besliyor, "Ara" denince kullanıcı doğrudan sonuç ekranına düşüyor.
export function LandingHome() {
  const {
    t, mechanicsList, listings, jobListings, adminStats, isAuthed, openAuthGate,
    query, setQuery, locationQuery, setLocationQuery, serviceQuery, setServiceQuery,
    goToBrowse, setScreen, requestLocation, ownerProfile,
    setShowFilterModal, activeFilterCount, openQuoteModal, setSortBy, setSortDir,
  } = useApp();

  // --- Gerçek veriden türetilen içerikler --------------------------------------------------------
  const topMechanics = [...mechanicsList]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviews || 0) - (a.reviews || 0))
    .slice(0, 6);
  const verifiedStrip = mechanicsList.filter(m => m.verified).slice(0, 3);
  const cityCounts = (() => {
    const counts = {};
    mechanicsList.forEach(m => {
      const city = (m.address || "").split("/").pop()?.trim();
      if (city) counts[city] = (counts[city] || 0) + 1;
    });
    return Object.entries(counts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 8);
  })();
  const featuredListings = [...listings]
    .filter(l => !l.adminRemoved && l.status === "active")
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    .slice(0, 4);
  const popularServices = ATU_FIXED_CATALOG.slice(0, 8);
  // Gerçek yorumlar: tüm tamircilerin reviewList'lerinden en uzun/dolu olanlar (boş yorum gösterme).
  const testimonials = mechanicsList
    .flatMap(m => (m.reviewList || []).map(r => ({ ...r, mechanicName: m.name, mechanicImg: m.img })))
    .filter(r => (r.comment || "").length > 40)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.comment?.length || 0) - (a.comment?.length || 0))
    .slice(0, 3);

  // Logo tıklaması: zaten karşılama sayfasındayız, sayfanın başına dön.
  // smooth davranışı desteklenmeyen/azaltılmış hareket tercihi olan ortamlarda da güvenli:
  // scrollTo nesne imzasını desteklemeyen eski tarayıcılarda sessizce klasik çağrıya düşüyor.
  const scrollToTop = () => {
    try { window.scrollTo({ top: 0, behavior: "smooth" }); }
    catch { window.scrollTo(0, 0); }
  };
  const runSearch = () => goToBrowse("mechanics");
  const searchService = (name) => { setServiceQuery(name); goToBrowse("mechanics"); };
  const searchCity = (city) => { setLocationQuery(city); goToBrowse("mechanics"); };

  const SectionLabel = ({ icon: Icon, children }) => (
    <p className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full mb-3"><Icon size={12} /> {children}</p>
  );

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* ---- Üst gezinme çubuğu ---- */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto w-full px-5 md:px-8 py-3 flex items-center justify-between gap-4">
          {/* Zaten ana sayfadayız — logo başka bir sayfaya değil, sayfanın en üstüne götürüyor
              (web'de logonun beklenen davranışı: "beni başa döndür"). */}
          <button onClick={scrollToTop} title={t("backToHomeBtn")} aria-label={t("backToHomeBtn")} className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition">
            <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center"><Wrench size={16} className="text-white" /></div>
            <span className="text-lg font-extrabold tracking-tight text-gray-900">Fix<span className="text-rose-600">perto</span></span>
          </button>
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => goToBrowse("mechanics")} className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition">{t("findMechanic")}</button>
            <button onClick={() => goToBrowse("cars")} className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition">{t("findCar")}</button>
            <button onClick={() => goToBrowse("jobs")} className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition">{t("jobListingsNavLabel")}</button>
            {/* Çoklu fiyat teklifi, diğer ana gezinme bağlantılarıyla AYNI seviyede duruyor
                (kullanıcı isteği) — vurgulu görünsün diye hafif arka planlı bir hap biçiminde. */}
            <button onClick={openQuoteModal} title={t("landingQuoteCtaNote")} className="text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5 whitespace-nowrap"><Users size={14} /> {t("landingQuoteCta")}</button>
          </nav>
          {/* NOT: Buradaki TR/EN/DE seçicisi KALDIRILDI — dil artık kullanıcının bulunduğu ülkeye
              göre otomatik seçiliyor (bkz. helpers.ts initialSiteLang). Yine de kimse yanlış dilde
              kilitli kalmasın diye seçici footer'a taşındı: Airbnb/Booking gibi büyük sitelerin de
              kullandığı, üst çubuğu kalabalıklaştırmayan yerleşim. */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isAuthed ? (
              <button onClick={() => goToBrowse("mechanics")} className="text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 px-4 py-2 rounded-full transition whitespace-nowrap">{ownerProfile?.name ? ownerProfile.name.split(" ")[0] : t("navSearch")}</button>
            ) : (
              <>
                <button onClick={() => openAuthGate("", "login")} className="text-sm font-semibold text-gray-700 hover:text-gray-900 px-3 py-2 rounded-full hover:bg-gray-100 transition whitespace-nowrap">{t("authGateLoginTab")}</button>
                <button onClick={() => openAuthGate("", "signup")} className="text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 px-4 py-2 rounded-full transition whitespace-nowrap">{t("authGateSignupTab")}</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ---- Hero + arama kartı ---- */}
      <section className="bg-gradient-to-b from-rose-50 via-rose-50/40 to-white">
        <div className="max-w-6xl mx-auto w-full px-5 md:px-8 pt-10 pb-12 md:pt-16 md:pb-16">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-rose-700 bg-white border border-rose-100 px-3 py-1.5 rounded-full mb-4 shadow-sm"><BadgeCheck size={13} /> {t("landingHeroBadge")}</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.1] mb-4">{t("landingHeroTitle")}</h1>
            <p className="text-gray-500 text-base md:text-lg leading-relaxed mb-7 max-w-2xl">{t("landingHeroSubtitle")}</p>
          </div>
          {/* Arama kartı — gerçek arama state'ini besler */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-3 md:p-4 max-w-4xl">
            <div className="flex flex-col md:flex-row md:items-stretch gap-2 md:gap-0 md:divide-x md:divide-gray-100">
              <div className="flex-1 px-3 py-2">
                <label className="block text-[11px] font-bold text-gray-900 mb-0.5">{t("serviceFieldLabel")}</label>
                <input value={serviceQuery} onChange={(e) => setServiceQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }} placeholder={t("searchServicePlaceholder")} className="w-full text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none bg-transparent" />
              </div>
              <div className="flex-1 px-3 py-2">
                <label className="block text-[11px] font-bold text-gray-900 mb-0.5">{t("brandFieldLabel")}</label>
                <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }} placeholder={t("searchPlaceholder")} className="w-full text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none bg-transparent" />
              </div>
              <div className="flex-1 px-3 py-2">
                <label className="block text-[11px] font-bold text-gray-900 mb-0.5">{t("cityLabelShort")}</label>
                <input value={locationQuery} onChange={(e) => setLocationQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }} placeholder={t("searchCityPlaceholder")} className="w-full text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none bg-transparent" />
              </div>
              {/* Filtrele, arama alanlarıyla AYNI seviyede — kullanıcı arama yapmadan önce de tüm
                  filtreleri açıp öyle aratabiliyor (sonuç ekranındaki arama çubuğuyla aynı desen). */}
              <button onClick={() => setShowFilterModal(true)} className="flex items-center justify-center md:justify-start gap-2 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-2xl md:rounded-none transition whitespace-nowrap">
                <SlidersHorizontal size={15} className="text-gray-500" />
                {t("landingFilterBtn")}
                {activeFilterCount > 0 && <span className="w-5 h-5 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>}
              </button>
              <div className="flex items-center px-1">
                <button onClick={runSearch} className="w-full md:w-auto bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold px-6 py-3 rounded-2xl transition flex items-center justify-center gap-2 whitespace-nowrap"><Search size={16} /> {t("landingSearchCta")}</button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-4">
            {/* "Yakınımda Ara": tarayıcının konum iznini ISTER (navigator.geolocation), izin gelince
                sonuçlar mesafeye göre sıralanır. İzin reddedilirse requestLocation kullanıcıyı
                bilgilendirip tahmini mesafelerle devam eder. */}
            <button onClick={() => { requestLocation(); setSortBy("distance"); setSortDir("asc"); goToBrowse("mechanics"); }} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 px-3.5 py-2 rounded-full hover:border-gray-900 transition"><Navigation size={13} className="text-rose-600" /> {t("landingNearMe")}</button>
            {/* Çoklu fiyat teklifi masaüstünde üst gezinme çubuğunda (diğer bağlantılarla aynı
                seviyede) duruyor; üst çubuk mobilde gizlendiği için burada SADECE mobilde gösteriliyor. */}
            <button onClick={openQuoteModal} title={t("landingQuoteCtaNote")} className="md:hidden inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100 px-3.5 py-2 rounded-full hover:bg-rose-100 transition"><Users size={13} /> {t("landingQuoteCta")}</button>
            <span className="text-xs text-gray-400 ml-1">{t("landingPopularPrefix")}</span>
            {popularServices.slice(0, 4).map(s => (
              <button key={s.name} onClick={() => searchService(s.name)} className="text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-100 px-3 py-1.5 rounded-full transition">{s.name}</button>
            ))}
          </div>
          {/* Canlı güven şeridi: doğrulanmış tamirciler + platform sayıları */}
          <div className="mt-8 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {verifiedStrip.map(m => (
                  <div key={m.id} className="w-10 h-10 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center text-lg overflow-hidden">{m.img}</div>
                ))}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><BadgeCheck size={14} className="text-rose-600" /> {t("landingVerifiedStripTitle")}</p>
                <p className="text-xs text-gray-500">{t("landingVerifiedStripNote")}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 md:gap-8">
              <div><p className="text-xl font-extrabold text-gray-900">{adminStats.totalMechanics}</p><p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">{t("statLabelMechanics")}</p></div>
              <div><p className="text-xl font-extrabold text-gray-900">{adminStats.avgRating}</p><p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">{t("statLabelRating")}</p></div>
              <div><p className="text-xl font-extrabold text-gray-900">{adminStats.totalReviews}</p><p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">{t("statLabelReviews")}</p></div>
              <div className="hidden sm:block"><p className="text-xl font-extrabold text-gray-900">{adminStats.activeCarListings}</p><p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">{t("statLabelCarListings")}</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Şehre göre keşfet ---- */}
      {cityCounts.length > 0 && (
        <section className="max-w-6xl mx-auto w-full px-5 md:px-8 py-12">
          <SectionLabel icon={MapPin}>{t("landingCityLabel")}</SectionLabel>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 mb-2">{t("landingCityTitle")}</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-2xl">{t("landingCitySubtitle")}</p>
          <div className="flex flex-wrap gap-2">
            {cityCounts.map(([city, count]: any) => (
              <button key={city} onClick={() => searchCity(city)} className="group bg-white border border-gray-200 hover:border-gray-900 rounded-2xl px-4 py-3 text-left transition shadow-sm hover:shadow-md">
                <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><MapPin size={13} className="text-rose-600" /> {city}</p>
                <p className="text-[11px] text-gray-400 font-medium">{t("landingCityCount", { n: String(count) })}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ---- Öne çıkan tamirciler ---- */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto w-full px-5 md:px-8 py-12">
          <SectionLabel icon={Star}>{t("landingTopMechanicsLabel")}</SectionLabel>
          <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 mb-2">{t("landingTopMechanicsTitle")}</h2>
              <p className="text-gray-500 text-sm max-w-2xl">{t("landingTopMechanicsSubtitle")}</p>
            </div>
            <button onClick={() => goToBrowse("mechanics")} className="text-sm font-bold text-rose-600 hover:underline flex items-center gap-1 whitespace-nowrap">{t("landingSeeAllMechanics")} <ChevronRight size={15} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* onHover harita eşleştirmesi için — karşılama sayfasında harita yok, boş geçiliyor. */}
            {topMechanics.map(m => (<MechCard key={m.id} m={m} onHover={undefined} />))}
          </div>
        </div>
      </section>

      {/* ---- Sık aranan hizmetler ---- */}
      <section className="max-w-6xl mx-auto w-full px-5 md:px-8 py-12">
        <SectionLabel icon={Wrench}>{t("landingServicesLabel")}</SectionLabel>
        <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 mb-2">{t("landingServicesTitle")}</h2>
            <p className="text-gray-500 text-sm max-w-2xl">{t("landingServicesSubtitle")}</p>
          </div>
          <button onClick={() => goToBrowse("mechanics")} className="text-sm font-bold text-rose-600 hover:underline flex items-center gap-1 whitespace-nowrap">{t("landingSeeAllServices")} <ChevronRight size={15} /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {popularServices.map((s, i) => (
            <button key={s.name} onClick={() => searchService(s.name)} className="group bg-white border border-gray-200 hover:border-gray-900 rounded-2xl p-4 text-left transition shadow-sm hover:shadow-md">
              <p className="text-[11px] font-extrabold text-gray-300 mb-1">{String(i + 1).padStart(2, "0")}</p>
              <p className="text-sm font-bold text-gray-900 leading-snug mb-1">{s.name}</p>
              <p className="text-xs text-gray-400 font-medium">{t("landingServiceFromPrice", { price: s.price })}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ---- İkinci el araç pazarı ---- */}
      {featuredListings.length > 0 && (
        <section className="bg-gray-50 border-y border-gray-100">
          <div className="max-w-6xl mx-auto w-full px-5 md:px-8 py-12">
            <SectionLabel icon={Car}>{t("landingMarketLabel")}</SectionLabel>
            <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 mb-2">{t("landingMarketTitle")}</h2>
                <p className="text-gray-500 text-sm max-w-2xl">{t("landingMarketSubtitle")}</p>
              </div>
              <button onClick={() => goToBrowse("cars")} className="text-sm font-bold text-rose-600 hover:underline flex items-center gap-1 whitespace-nowrap">{t("landingSeeAllListings")} <ChevronRight size={15} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredListings.map(l => (<ListingCard key={l.id} l={l} />))}
            </div>
          </div>
        </section>
      )}

      {/* ---- Nasıl çalışır ---- */}
      <section className="max-w-6xl mx-auto w-full px-5 md:px-8 py-12">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 mb-8 text-center">{t("landingHowTitle")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { n: 1, icon: Search, title: t("landingHowStep1Title"), desc: t("landingHowStep1Desc") },
            { n: 2, icon: SlidersHorizontal, title: t("landingHowStep2Title"), desc: t("landingHowStep2Desc") },
            { n: 3, icon: Calendar, title: t("landingHowStep3Title"), desc: t("landingHowStep3Desc") },
          ].map(s => (
            <div key={s.n} className="text-center px-4">
              <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-3"><s.icon size={24} className="text-rose-600" /></div>
              <p className="text-[11px] font-extrabold text-rose-600 mb-1">{String(s.n).padStart(2, "0")}</p>
              <h3 className="text-base font-bold text-gray-900 mb-1.5">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Neden Fixperto ---- */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto w-full px-5 md:px-8 py-12">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 mb-2 text-center">{t("landingWhyTitle")}</h2>
          <p className="text-gray-500 text-sm mb-8 text-center">{t("landingWhySubtitle")}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: BadgeCheck, title: t("landingWhy1Title"), desc: t("landingWhy1Desc") },
              { icon: Users, title: t("landingWhy2Title"), desc: t("landingWhy2Desc") },
              { icon: SlidersHorizontal, title: t("landingWhy3Title"), desc: t("landingWhy3Desc") },
              { icon: Zap, title: t("landingWhy4Title"), desc: t("landingWhy4Desc") },
              { icon: MessageCircle, title: t("landingWhy5Title"), desc: t("landingWhy5Desc") },
              { icon: LifeBuoy, title: t("landingWhy6Title"), desc: t("landingWhy6Desc") },
            ].map(f => (
              <div key={f.title} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="w-11 h-11 bg-rose-50 rounded-xl flex items-center justify-center mb-3"><f.icon size={20} className="text-rose-600" /></div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Kullanıcı yorumları (gerçek değerlendirmeler) ---- */}
      {testimonials.length > 0 && (
        <section className="max-w-6xl mx-auto w-full px-5 md:px-8 py-12">
          <div className="text-center mb-8">
            <SectionLabel icon={Shield}>{t("landingTestimonialsLabel")}</SectionLabel>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 mb-2">{t("landingTestimonialsTitle")}</h2>
            <p className="text-gray-500 text-sm">{t("landingTestimonialsSubtitle")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((r, i) => (
              <div key={`${r.mechanicName}-${r.id ?? i}`} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col">
                <Quote size={18} className="text-rose-200 mb-2" />
                <p className="text-sm text-gray-600 leading-relaxed flex-1">{r.comment}</p>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-base flex-shrink-0">{r.avatar || "👤"}</div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{r.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{r.mechanicImg} {r.mechanicName}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-0.5 flex-shrink-0">{[1, 2, 3, 4, 5].map(n => (<Star key={n} size={11} className={n <= (r.rating || 0) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />))}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---- Tamirci/işletme çağrısı ---- */}
      <section className="max-w-6xl mx-auto w-full px-5 md:px-8 pb-12">
        <div className="bg-gray-900 rounded-3xl px-6 py-10 md:px-12 md:py-12 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-3">{t("landingMechanicCtaTitle")}</h2>
          <p className="text-gray-300 text-sm md:text-base mb-6 max-w-2xl mx-auto leading-relaxed">{t("landingMechanicCtaSubtitle")}</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={() => openAuthGate("", "signup")} className="bg-white text-gray-900 font-bold text-sm px-6 py-3 rounded-2xl hover:bg-gray-100 transition">{t("landingMechanicCtaBtn")}</button>
            <button onClick={() => goToBrowse("jobs")} className="text-white font-semibold text-sm px-6 py-3 rounded-2xl border border-white/30 hover:bg-white/10 transition flex items-center gap-2"><Briefcase size={15} /> {t("jobListingsNavLabel")}</button>
          </div>
        </div>
      </section>

      {/* ---- Alt bilgi (footer) ---- */}
      <footer className="bg-gray-50 border-t border-gray-100 mt-auto">
        <div className="max-w-6xl mx-auto w-full px-5 md:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <button onClick={scrollToTop} title={t("backToHomeBtn")} aria-label={t("backToHomeBtn")} className="flex items-center gap-2 mb-3 hover:opacity-80 transition">
                <div className="w-7 h-7 bg-rose-600 rounded-lg flex items-center justify-center"><Wrench size={14} className="text-white" /></div>
                <span className="text-base font-extrabold tracking-tight text-gray-900">Fix<span className="text-rose-600">perto</span></span>
              </button>
              <p className="text-xs text-gray-500 leading-relaxed">{t("landingFooterAbout")}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 mb-2.5">{t("landingFooterExplore")}</p>
              <ul className="space-y-1.5">
                <li><button onClick={() => goToBrowse("mechanics")} className="text-xs text-gray-500 hover:text-gray-900 transition">{t("findMechanic")}</button></li>
                <li><button onClick={() => goToBrowse("cars")} className="text-xs text-gray-500 hover:text-gray-900 transition">{t("findCar")}</button></li>
                <li><button onClick={() => goToBrowse("jobs")} className="text-xs text-gray-500 hover:text-gray-900 transition">{t("jobListingsNavLabel")}</button></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 mb-2.5">{t("landingFooterServices")}</p>
              <ul className="space-y-1.5">
                {popularServices.slice(0, 5).map(s => (
                  <li key={s.name}><button onClick={() => searchService(s.name)} className="text-xs text-gray-500 hover:text-gray-900 transition text-left">{s.name}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 mb-2.5">{t("landingFooterAccount")}</p>
              <ul className="space-y-1.5">
                <li><button onClick={() => openAuthGate("", "login")} className="text-xs text-gray-500 hover:text-gray-900 transition">{t("authGateLoginTab")}</button></li>
                <li><button onClick={() => openAuthGate("", "signup")} className="text-xs text-gray-500 hover:text-gray-900 transition">{t("authGateSignupTab")}</button></li>
                <li><span className="text-xs text-gray-400">{jobListings.length} {t("jobsFoundSuffix")}</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-5 flex flex-col items-center gap-2.5">
            <div className="flex items-center gap-2">
              <Globe size={13} className="text-gray-400" />
              <LangSwitch />
            </div>
            {/* Gizli admin girişi: eski karşılama ekranındaki desen korunuyor (© yazısına tıklama). */}
            <p className="text-xs text-gray-400">© 2026 <span onClick={() => setScreen("adminLogin")} className="font-bold text-rose-600 cursor-pointer select-none">{t("appName")}</span></p>
            <p className="text-[9px] text-gray-300">{t("allRightsReserved")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
