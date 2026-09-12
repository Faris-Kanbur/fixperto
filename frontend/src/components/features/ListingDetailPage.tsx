import { useState } from "react";
import {
  BadgeCheck, Banknote, Calendar, Car, ChevronLeft, ChevronRight, Cog, Eye, FileText, Flag, Fuel,
  Gauge, Heart, History, Leaf, MapPin, MessageCircle, Phone, Scale, Settings, Star, Tag, Users,
  Zap, BatteryCharging,
} from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";
import { ShareButton } from "./ShareButton";
import { PhotoLightbox } from "./PhotoLightbox";
import { ListingCard } from "./ListingCard";
import { TranslatedText } from "./TranslatedText";
import { ListingHistorySection } from "./VehicleHistoryPanel";
import {
  LISTING_FEATURE_GROUPS, FUEL_TYPE_LABELS_BY_LANG, TRANSMISSION_LABELS_BY_LANG,
  BODY_TYPE_LABELS_BY_LANG, DRIVETRAIN_LABELS_BY_LANG,
} from "../../data/constants";
import { isImgUrl, imgThumb, imgFallbackHandler, listingStatusMeta, vocabLabel, safeHref } from "../../utils/helpers";
import { PageTopBar } from "./BrandMark";

/**
 * TAM SAYFA ARAÇ İLANI — AutoScout24 / mobile.de / sahibinden.com ilan detay sayfalarının bölüm
 * yapısı temel alınarak yazıldı. Modal ("Hızlı Görüntüle") kaldırılmadı; bu sayfa, aracı ciddi
 * olarak değerlendiren alıcı için TÜM veriyi gösteren ikinci katman.
 *
 * AutoScout24'ün gerçek bölüm sırası incelendi ve şu şekilde uyarlandı:
 *   Basisdaten          → Temel Bilgiler
 *   Fahrzeughistorie    → Araç Geçmişi (+ sahibinden'in boyalı/değişen parça kaydı)
 *   Technische Daten    → Teknik Veriler
 *   Energieverbrauch    → Tüketim & Emisyon (elektrikliyse batarya/menzil)
 *   Ausstattung         → Donanım (başlıklara GRUPLANMIŞ, düz liste değil)
 *   Farbe/Innenausst.   → Renk
 *   Fahrzeugbeschreibung→ Açıklama
 *   Preisbewertung      → Fiyat Değerlendirmesi
 *   Verkäufer           → Satıcı kartı (sağda yapışkan)
 * Finansman/leasing/sigorta bölümleri bilinçli olarak alınmadı — Fixperto bir kredi aracısı değil.
 */
/**
 * Modül düzeyinde tanımlı — bkz. AppShell.tsx'teki aynı düzeltmenin gerekçesi: bileşeni ana
 * bileşenin içinde tanımlamak, her render'da yeni bir tür üretip alttaki ağacı söküp yeniden
 * kurmaya yol açıyor (kaydırma konumu, odak ve alt bileşen durumu kayboluyor).
 */
const Section = ({ id, icon: Icon, title, children }) => (
  <section id={id} className="scroll-mt-24">
    <h2 className="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
      <span className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0"><Icon size={16} className="text-rose-600" /></span>
      {title}
    </h2>
    {children}
  </section>
);

const SpecTable = ({ items }) => (
  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden grid grid-cols-1 sm:grid-cols-2">
    {items.map((r, i) => (
      <div key={r.label} className={`flex items-center justify-between gap-3 px-4 py-3 text-sm border-gray-100 ${i % 2 === 0 ? "sm:border-r" : ""} ${i < items.length - (items.length % 2 === 0 ? 2 : 1) ? "border-b" : "border-b sm:border-b-0"}`}>
        <span className="text-gray-500">{r.label}</span>
        <span className="font-semibold text-gray-900 text-right">{r.value}</span>
      </div>
    ))}
  </div>
);

export function ListingDetailPage() {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  // Büyütülmüş fotoğraf görüntüleyici — modaldeki desenle aynı (bkz. AppShell listingLightboxOpen),
  // ama bu sayfaya ait olduğu için global context yerine yerel state.
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const {
    t, lang, role, ownerLang, myProfile, mechanicsList,
    listingPageItem, closeListingPage, setSelectedListingId,
    favoriteIds, toggleFavorite, compareListingIds, toggleCompareListing,
    openOfferForm, offerButtonState, setShowListingMsgForm, openReportForm, recordShare,
    similarListings, listingPriceComparison, isMyListing, openSellForm, sellPrefillFromListing,
  } = useApp() as any;

  const l = listingPageItem;
  if (!l) return null;

  const mine = isMyListing(l);
  const statusMeta = listingStatusMeta(l.status, t);
  const cmp = listingPriceComparison(l);
  const sims = similarListings(l, 4);
  const photos = (l.photos && l.photos.length > 0) ? [l.photo, ...l.photos] : [l.photo];
  const activeIdx = Math.min(photoIdx, photos.length - 1);
  const sellerMech = l.sellerType === "mechanic" ? mechanicsList.find((m) => m.id === l.sellerId) : null;
  const fav = favoriteIds.includes(l.id);
  const inCompare = (compareListingIds || []).includes(l.id);
  const isEv = l.fuelType === "Elektrik" || l.fuelType === "Hibrit";
  const listedOn = l.createdAt ? new Date(l.createdAt).toLocaleDateString(lang === "tr" ? "tr-TR" : lang === "de" ? "de-DE" : "en-GB") : null;

  // "—" yerine boş satır basmamak için: değeri olmayan alanlar tablodan tamamen düşürülüyor
  // (AutoScout24 de bilinmeyen alanı hiç göstermiyor, boş satır bırakmıyor).
  const rows = (list) => list.filter((r) => r && r.value !== null && r.value !== undefined && String(r.value).trim() !== "" && String(r.value) !== "0");

  const basics = rows([
    { label: t("bodyTypePlaceholder"), value: l.bodyType && vocabLabel(l.bodyType, lang, BODY_TYPE_LABELS_BY_LANG) },
    { label: t("drivetrainPlaceholder"), value: l.drivetrain && vocabLabel(l.drivetrain, lang, DRIVETRAIN_LABELS_BY_LANG) },
    { label: t("seatCountPlaceholder"), value: l.seatCount },
    { label: t("doorCountPlaceholder"), value: l.doorCount },
    { label: t("color"), value: l.color },
    { label: t("listingStatus"), value: statusMeta?.label },
    { label: t("listingNoLabel"), value: `#${l.id}` },
    { label: t("listedOnLabel"), value: listedOn },
  ]);

  const history = rows([
    { label: t("mileage"), value: l.km != null && `${Number(l.km).toLocaleString("tr-TR")} km` },
    { label: t("firstReg"), value: l.firstReg || l.year },
    { label: t("ownerCountRowLabel"), value: l.ownerCount && t("ownerCountValue", { n: String(l.ownerCount) }) },
    // sahibinden.com'un en çok bakılan alanı: hasar kaydı. 0 değeri ANLAMLI olduğu için (hasarsız)
    // rows() filtresinden geçmez — bu yüzden metne çevrilerek ekleniyor.
    { label: t("paintedPartsRowLabel"), value: l.paintedParts != null ? (Number(l.paintedParts) === 0 ? t("noneLabel") : String(l.paintedParts)) : null },
    { label: t("changedPartsRowLabel"), value: l.changedParts != null ? (Number(l.changedParts) === 0 ? t("noneLabel") : String(l.changedParts)) : null },
    { label: t("tradeInRowLabel"), value: l.tradeIn ? t("yesLabel") : t("noLabel") },
  ]);

  const technical = rows([
    { label: t("power"), value: l.power && `${l.power} HP` },
    { label: t("engineSizeLabel"), value: l.engineSize },
    { label: t("transmission"), value: l.transmission && vocabLabel(l.transmission, lang, TRANSMISSION_LABELS_BY_LANG) },
    { label: t("fuelType"), value: l.fuelType && vocabLabel(l.fuelType, lang, FUEL_TYPE_LABELS_BY_LANG) },
  ]);

  const energy = rows([
    { label: t("consumptionLabel"), value: l.fuelConsumption && `${l.fuelConsumption} l/100km` },
    { label: t("co2Label"), value: l.co2Emission && `${l.co2Emission} g/km` },
    { label: t("emissionClassLabel"), value: l.emissionClass },
    ...(isEv ? [
      { label: t("batteryLabel"), value: l.batteryCapacity && `${l.batteryCapacity} kWh` },
      { label: t("rangeLabel"), value: l.rangeKm && `${l.rangeKm} km` },
    ] : []),
  ]);

  // Donanımı gruplara ayır; hiçbir gruba girmeyenler (kullanıcının serbest eklediği donanımlar dahil)
  // "Diğer" başlığı altında toplanır — böylece hiçbir donanım sessizce kaybolmaz.
  const allFeatures = l.features || [];
  const grouped = LISTING_FEATURE_GROUPS
    .map((g) => ({ key: g.key, items: allFeatures.filter((f) => g.features.includes(f)) }))
    .filter((g) => g.items.length > 0);
  const grouThe = new Set(LISTING_FEATURE_GROUPS.flatMap((g) => g.features));
  const otherFeatures = allFeatures.filter((f) => !grouThe.has(f));
  const groupedFeatures = otherFeatures.length > 0 ? [...grouped, { key: "other", items: otherFeatures }] : grouped;

  const keyFacts = [
    { icon: Gauge, label: t("mileage"), value: l.km != null ? `${Number(l.km).toLocaleString("tr-TR")} km` : "—" },
    { icon: Calendar, label: t("firstReg"), value: l.firstReg || l.year || "—" },
    { icon: Fuel, label: t("fuelType"), value: l.fuelType ? vocabLabel(l.fuelType, lang, FUEL_TYPE_LABELS_BY_LANG) : "—" },
    { icon: Cog, label: t("transmission"), value: l.transmission ? vocabLabel(l.transmission, lang, TRANSMISSION_LABELS_BY_LANG) : "—" },
    { icon: Zap, label: t("power"), value: l.power ? `${l.power} HP` : "—" },
    { icon: Users, label: t("sellerTypeLabel"), value: l.sellerType === "mechanic" ? t("sellerTypeMechanic") : t("sellerTypeOwner") },
  ];


  // Teknik tabloları iki sütunlu, zebra çizgili bir "künye" olarak basar — AutoScout24'ün
  // Basisdaten/Technische Daten bloklarındaki okuma deseni.

  const sellerCard = (
    <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-lg shadow-gray-100">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[11px] text-gray-400 font-medium">{statusMeta?.label}</p>
          <p className="text-3xl font-bold text-gray-900 leading-tight">{l.price}</p>
        </div>
        {l.negotiable && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-700 whitespace-nowrap">{t("negotiableBadge")}</span>}
      </div>
      {cmp && (
        <p className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${cmp.tier === "below" ? "text-emerald-600" : cmp.tier === "above" ? "text-amber-600" : "text-gray-500"}`}>
          <Scale size={13} />
          {cmp.tier === "below" ? t("priceBelowAverage", { pct: String(Math.abs(cmp.diffPercent)) })
            : cmp.tier === "above" ? t("priceAboveAverage", { pct: String(cmp.diffPercent) })
            : t("priceAtMarketLabel")}
        </p>
      )}
      <div className="border-t border-gray-100 my-4" />
      {/* Satıcı kimliği — AutoScout24'teki "Ein Fahrzeug von:" bloğu. Tamirci satıcıysa puanı ve
          doğrulama rozeti de gösteriliyor; alıcı için en güçlü güven sinyali bu. */}
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">{t("sellerLabel")}</p>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">{sellerMech?.img || "👤"}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1">
            {l.sellerName}
            {sellerMech?.verified && <BadgeCheck size={14} className="text-rose-500 flex-shrink-0" />}
          </p>
          <p className="text-[11px] text-gray-400 flex items-center gap-2">
            <span>{l.sellerType === "mechanic" ? t("sellerTypeMechanic") : t("sellerTypeOwner")}</span>
            {sellerMech && <span className="flex items-center gap-0.5"><Star size={10} className="fill-gray-900 text-gray-900" />{sellerMech.rating}</span>}
          </p>
        </div>
      </div>
      {l.city && <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-4"><MapPin size={13} className="text-gray-400" /> {l.city}</p>}
      {mine ? (
        <>
          <button onClick={() => openSellForm(sellPrefillFromListing(l))} className="w-full bg-gray-900 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-gray-800 transition whitespace-nowrap">{t("editListingBtn")}</button>
          {/* Teklif/mesaj yönetimi hızlı görüntüleme modalinde duruyor — burada ikinci bir kopyasını
              tutmak yerine oraya yönlendiriyoruz (tek doğruluk kaynağı). */}
          <button onClick={() => setSelectedListingId(l.id)} className="w-full mt-2 border border-gray-200 text-gray-700 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition whitespace-nowrap flex items-center justify-center gap-2"><MessageCircle size={15} /> {t("manageOffersBtn")}</button>
        </>
      ) : (
        <>
          {/* Düğmenin etiketi ve tıklanabilirliği tek yerden geliyor (bkz. offerButtonState):
              satıcı teklifi gördüyse yeni teklif gönderilemez, reddettiyse gönderilebilir. */}
          {(() => { const ob = offerButtonState(l); return (<>
            <button onClick={() => openOfferForm()} disabled={ob.disabled} className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition whitespace-nowrap flex items-center justify-center gap-2 ${ob.disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.99] shadow-md shadow-rose-200"}`}><Banknote size={16} /> {t(ob.labelKey)}</button>
            {ob.hintKey && <p className="text-[11px] text-gray-400 mt-1.5 text-center leading-relaxed">{t(ob.hintKey)}</p>}
          </>); })()}
          <button onClick={() => setShowListingMsgForm(true)} className="w-full mt-2 border border-gray-200 text-gray-700 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition whitespace-nowrap flex items-center justify-center gap-2"><MessageCircle size={16} /> {t("sendMessage")}</button>
          {sellerMech?.phone && (
            <a href={`tel:${sellerMech.phone}`} className="w-full mt-2 text-gray-500 py-2 font-medium text-xs hover:text-rose-600 transition flex items-center justify-center gap-1.5"><Phone size={13} /> {sellerMech.phone}</a>
          )}
        </>
      )}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button onClick={() => toggleFavorite(l.id)} className={`py-2.5 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${fav ? "border-rose-200 bg-rose-50 text-rose-600" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}><Heart size={14} className={fav ? "fill-rose-600" : ""} /> {t("favoriteLabel")}</button>
        <button onClick={() => toggleCompareListing(l.id)} className={`py-2.5 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${inCompare ? "border-rose-200 bg-rose-50 text-rose-600" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}><Scale size={14} /> {t("compareBtnLabel")}</button>
      </div>
      {safeHref(l.inspectionReportUrl) && (
        <a href={safeHref(l.inspectionReportUrl)} target="_blank" rel="noreferrer" className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 py-2.5 rounded-xl hover:bg-emerald-100 transition"><FileText size={13} /> {t("inspectionReportAvailableLabel")}</a>
      )}
    </div>
  );

  return (
    <>
      {/* Logo bu sayfada da olsun: kullanıcı ilanın ortasındayken tek tıkla ana sayfaya
          dönebilmeli. Geri oku ilan listesine, logo ana sayfaya götürüyor. */}
      <PageTopBar onBack={closeListingPage} />
      <div className="w-full bg-gray-50 min-h-screen pb-24 lg:pb-8">
      {/* ---- ÜST ÇUBUK ---- */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-3 flex items-center justify-between gap-3">
          <button onClick={closeListingPage} className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition"><ChevronLeft size={18} /> {t("back")}</button>
          <div className="flex items-center gap-2">
            {/* NOT: burada "Hızlı Görüntüle" butonu YOK. Hızlı görünüm, listede karttan ayrılmadan
                bakmak içindir; kullanıcı zaten tam detay sayfasındayken aynı ilanı DAHA AZ bilgiyle
                gösteren bir modal açmak geriye doğru bir adım olurdu. Geçiş tek yönlü: liste →
                (göz ikonu) hızlı görünüm → "Tüm Detayları Gör" → bu sayfa. */}
            {/* AutoScout24'te de ilan sayfasının üstünde "Merken / Teilen" (favori / paylaş) ikili
                duruyor — favori butonu sadece aşağıdaki satıcı kartında kalmasın, sayfanın en
                üstünde de erişilebilsin. */}
            <button onClick={() => toggleFavorite(l.id)} aria-label={t("addToFavoritesAria")} className="w-9 h-9 rounded-full border border-gray-200 hover:bg-gray-50 transition flex items-center justify-center"><Heart size={15} className={fav ? "fill-rose-600 text-rose-600" : "text-gray-500"} /></button>
            <ShareButton title={`${l.brand} ${l.model}`} text={`${l.brand} ${l.model} — ${l.price}`} path={`?listing=${l.id}`} onShare={(channel, refCode) => recordShare("listing", l.id, channel, refCode)} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 items-start">
        <div className="lg:col-span-2 space-y-10">
          {/* ---- GALERİ ---- büyük ana görsel + küçük resim şeridi (AutoScout24 deseni) ---- */}
          <div>
            <div className="relative rounded-3xl overflow-hidden bg-gray-100 border border-gray-200">
              <button onClick={() => setLightboxOpen(true)} className="w-full aspect-[4/3] sm:aspect-[16/10] flex items-center justify-center text-7xl" aria-label={t("enlargePhotoAria")}>
                {isImgUrl(photos[activeIdx])
                  ? <img src={imgThumb(photos[activeIdx], 1400)} onError={imgFallbackHandler} alt={t("listingPhotoAlt")} className="w-full h-full object-cover" />
                  : <span>{photos[activeIdx]}</span>}
              </button>
              {photos.length > 1 && (
                <>
                  <button onClick={() => setPhotoIdx((i) => (i - 1 + photos.length) % photos.length)} aria-label={t("prevPhotoAria")} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow flex items-center justify-center text-gray-700 hover:scale-105 transition"><ChevronLeft size={18} /></button>
                  <button onClick={() => setPhotoIdx((i) => (i + 1) % photos.length)} aria-label={t("nextPhotoAria")} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow flex items-center justify-center text-gray-700 hover:scale-105 transition"><ChevronRight size={18} /></button>
                  <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full">{activeIdx + 1} / {photos.length}</span>
                </>
              )}
              {l.featured && <span className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Star size={10} className="fill-white" /> {t("featuredBadge")}</span>}
            </div>
            {photos.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {photos.map((p, i) => (
                  <button key={i} onClick={() => setPhotoIdx(i)} className={`w-20 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition flex items-center justify-center text-2xl bg-gray-100 ${i === activeIdx ? "border-rose-500" : "border-transparent opacity-70 hover:opacity-100"}`}>
                    {isImgUrl(p) ? <img src={imgThumb(p, 200)} loading="lazy" onError={imgFallbackHandler} alt="" className="w-full h-full object-cover" /> : <span>{p}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ---- BAŞLIK ---- */}
          <div className="-mt-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{l.brand} {l.model}</h1>
            <div className="flex items-center gap-x-3 gap-y-1 mt-2 text-sm text-gray-500 flex-wrap">
              {l.city && <span className="flex items-center gap-1"><MapPin size={13} /> {l.city}</span>}
              <span className="text-gray-300">·</span>
              <span>{t("listingNoLabel")} #{l.id}</span>
              {listedOn && (<><span className="text-gray-300">·</span><span>{listedOn}</span></>)}
              {l.shareCount > 0 && (<><span className="text-gray-300">·</span><span className="flex items-center gap-1"><Eye size={13} /> {l.shareCount} {t("sharesLabel")}</span></>)}
            </div>
            {mine && <p className="mt-3 text-xs text-gray-600 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5">{t("ownListingNotice")}</p>}
          </div>

          {/* ---- ANAHTAR VERİLER ---- */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 -mt-4">
            {keyFacts.map((k, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-3.5">
                <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mb-1"><k.icon size={13} className="text-rose-500" /> {k.label}</p>
                <p className="text-sm font-bold text-gray-900 truncate">{k.value}</p>
              </div>
            ))}
          </div>

          {basics.length > 0 && <Section id="ld-basics" icon={Car} title={t("basicDataTitle")}><SpecTable items={basics} /></Section>}
          {history.length > 0 && (
            <Section id="ld-history" icon={History} title={t("vehicleHistoryTitle")}>
              <SpecTable items={history} />
              <p className="text-[11px] text-gray-400 mt-2.5">{t("damageRecordNote")}</p>
            </Section>
          )}
          {technical.length > 0 && <Section id="ld-technical" icon={Settings} title={t("technicalDataTitle")}><SpecTable items={technical} /></Section>}
          {energy.length > 0 && (
            <Section id="ld-energy" icon={isEv ? BatteryCharging : Leaf} title={t("consumptionEmissionTitle")}>
              <SpecTable items={energy} />
            </Section>
          )}

          {/* ---- DONANIM ---- gruplanmış ---- */}
          {allFeatures.length > 0 && (
            <Section id="ld-features" icon={Tag} title={`${t("featuresSection")} (${allFeatures.length})`}>
              <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
                {(showAllFeatures ? groupedFeatures : groupedFeatures.slice(0, 2)).map((g) => (
                  <div key={g.key} className="p-4">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2.5">{t(`featureGroup_${g.key}`)}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {g.items.map((f) => (
                        <span key={f} className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5">
                          <BadgeCheck size={11} className="text-emerald-500" /> {f}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {groupedFeatures.length > 2 && (
                <button onClick={() => setShowAllFeatures((v) => !v)} className="mt-3 text-sm font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1">
                  {showAllFeatures ? t("mechShowLess") : t("showAllFeaturesBtn")}
                  <ChevronRight size={14} className={showAllFeatures ? "-rotate-90" : "rotate-90"} />
                </button>
              )}
            </Section>
          )}

          {/* ---- AÇIKLAMA ---- */}
          {String(l.description || "").trim() && (
            <Section id="ld-description" icon={FileText} title={t("descriptionSectionTitle")}>
              <div className="bg-white border border-gray-200 rounded-2xl p-5 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                <TranslatedText id={`listing-desc-${l.id}`} text={l.description} fromLang={l.lang || "tr"} viewerLang={role === "mechanic" ? (myProfile?.lang || "tr") : ownerLang} />
              </div>
            </Section>
          )}

          {/* ---- FİYAT DEĞERLENDİRMESİ ---- AutoScout24 "Preisbewertung" ---- */}
          {cmp && (
            <Section id="ld-price" icon={Scale} title={t("priceRatingLabel")}>
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${cmp.tier === "below" ? "bg-emerald-50 text-emerald-700" : cmp.tier === "above" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                    {cmp.tier === "below" ? t("priceRatingBelow") : cmp.tier === "above" ? t("priceRatingAboveLabel") : t("priceAtMarketLabel")}
                  </span>
                  <span className="text-sm font-bold text-gray-900">{l.price}</span>
                </div>
                {/* Konum çubuğu: bu ilanın medyana göre nerede durduğunu göstermek, yüzde sayısından
                    çok daha hızlı anlaşılıyor. %-30 ile %+30 aralığı ölçek olarak alınıyor. */}
                <div className="relative h-2 bg-gradient-to-r from-emerald-200 via-gray-200 to-amber-200 rounded-full mb-2">
                  <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-gray-900 rounded-full" style={{ left: `${Math.min(100, Math.max(0, 50 + cmp.diffPercent * (50 / 30)))}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mb-3"><span>{t("priceScaleCheap")}</span><span>{t("priceScaleMarket")}</span><span>{t("priceScaleExpensive")}</span></div>
                <p className="text-xs text-gray-500">{t("priceRatingSample", { n: String(cmp.sampleSize), brand: l.brand, model: l.model })}</p>
              </div>
            </Section>
          )}

          {/* ---- BENZER İLANLAR ---- */}
          {sims.length > 0 && (
            <Section id="ld-similar" icon={Car} title={t("similarListingsTitle")}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{sims.map((s) => (<ListingCard key={s.id} l={s} />))}</div>
            </Section>
          )}

          {/* DOĞRULANMIŞ SERVİS GEÇMİŞİ — satıcı "bakım geçmişini göster" dediyse ve araca bağlı
              gerçek kayıtlar varsa görünür. Alıcı için en güçlü güven işareti: bu satırlar
              satıcının yazdığı bir metin değil, platformda gerçekten yapılmış işler. */}
          <ListingHistorySection listingId={l.id} />

          {!mine && (
            <button onClick={() => openReportForm("listing", `İlan #${l.id} · ${l.brand} ${l.model}`, `"${l.brand} ${l.model}" ilanı hakkında şikayetim var`)} className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition py-2"><Flag size={12} /> {t("reportListingBtn")}</button>
          )}
        </div>

        {/* ---- SAĞ KOLON: yapışkan satıcı/fiyat kartı ---- */}
        <aside className="hidden lg:block lg:sticky lg:top-20">{sellerCard}</aside>
        <div className="lg:hidden">{sellerCard}</div>
      </div>

      {lightboxOpen && (
        <PhotoLightbox photos={photos} index={activeIdx} onIndexChange={setPhotoIdx} onClose={() => setLightboxOpen(false)} title={`${l.brand ?? ""} ${l.model ?? ""}`.trim()} />
      )}

      {/* ---- MOBİL YAPIŞKAN AKSİYON ÇUBUĞU ---- */}
      {!mine && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 flex items-center gap-3">
          <div className="flex-shrink-0 min-w-0">
            <p className="text-[10px] text-gray-400 leading-none mb-0.5 truncate">{l.brand} {l.model}</p>
            <p className="text-base font-bold text-gray-900 leading-none">{l.price}</p>
          </div>
          <button onClick={() => setShowListingMsgForm(true)} aria-label={t("sendMessage")} className="w-11 h-11 rounded-xl border border-gray-200 text-gray-600 flex items-center justify-center flex-shrink-0"><MessageCircle size={18} /></button>
          {(() => { const ob = offerButtonState(l); return (
            <button onClick={() => openOfferForm()} disabled={ob.disabled} className={`flex-1 py-3 rounded-xl font-semibold text-sm transition whitespace-nowrap ${ob.disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-rose-600 text-white hover:bg-rose-700"}`}>{t(ob.labelKey)}</button>
          ); })()}
        </div>
      )}
    </div>
  </>
  );
}
