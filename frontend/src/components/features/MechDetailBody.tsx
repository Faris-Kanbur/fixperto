import { useState, useMemo } from "react";
import { PageTopBar } from "./BrandMark";
import { PriceLevelDots } from "../ui/PriceLevelDots";
import { BadgeCheck, Banknote, Briefcase, Calendar, Car, ChevronLeft, ChevronRight, Clock, CreditCard, Flag, Globe, Heart, MapPin, MessageCircle, Navigation, Phone, Star, Tag, ThumbsUp, Users, Wrench as ToolIcon, X, Zap } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";
import { MapPanel } from "./MapPanel";
import { ShareButton } from "./ShareButton";
import { ListingCard } from "./ListingCard";
import { JobCard } from "./JobCard";
import { TranslatedText } from "./TranslatedText";
import { BANNER_PRESETS, MY_MECHANIC_ID, LANG_LABELS } from "../../data/constants";
import { formatHoursText, isImgUrl, imgThumb, imgFallbackHandler, formatDistanceKm, brandPriceFor } from "../../utils/helpers";
import { REVIEW_TIME_LABELS_BY_LANG } from "../../data/i18n";

export function MechDetailBody() {
  const [coverBroken, setCoverBroken] = useState(false);
  // "Tümünü Gör" — çoklu teklif modaline benzer, tam ekran yorum listesi. Sadece bu bileşene
  // özel bir UI durumu olduğu için (başka hiçbir yerden tetiklenmiyor) global context'e eklemek
  // yerine yerel state olarak tutuyoruz — bkz. coverBroken için de aynı yaklaşım.
  const [showAllReviews, setShowAllReviews] = useState(false);
  // Hizmet listesi uzun olabildiği için varsayılan olarak ilk 6 hizmet gösteriliyor (bkz.
  // SERVICE_PREVIEW); "tümünü gör" ile açılıyor — kaydırma kutusundan daha okunabilir bir düzen.
  const [showAllServices, setShowAllServices] = useState(false);
  const {
    lang, setLang, t, screen, setScreen, role, setRole, showPass, setShowPass, forgotEmail, setForgotEmail, form, 
    setForm, authError, setAuthError, ownerTab, setOwnerTab, ownerMode, setOwnerMode, ownerLang, setOwnerLang, 
    ownerSettings, setOwnerSettings, mechSettings, setMechSettings, notifLog, setNotifLog, ownerNotifSeenAt, 
    setOwnerNotifSeenAt, mechNotifSeenAt, setMechNotifSeenAt, showNotifPanel, setShowNotifPanel, darkMode, 
    setDarkMode, ownerPhotoRef, ownerProfileTab, setOwnerProfileTab, showMapMobile, setShowMapMobile, 
    hoveredPinId, setHoveredPinId, mapPreviewItem, setMapPreviewItem, showFilterModal, setShowFilterModal, 
    filters, setFilters, listingFilters, setListingFilters, listingSort, setListingSort, userLocation, 
    setUserLocation, locationStatus, setLocationStatus, notifPermission, setNotifPermission, favoriteIds,
    setFavoriteIds, toggleFavorite, favoriteMechanicIds, toggleFavoriteMechanic, likedReviewIds, toggleReviewHelpful,
    serviceLabel, servicePriceForBrand, mechanicStartingPrice, mechanicsList, setMechanicsList, mechanicHours, setMechanicHours, query,
    setQuery, locationQuery, setLocationQuery, sortBy, setSortBy, sortDir, setSortDir, showLocationPrompt, 
    setShowLocationPrompt, selectedMechanicId, setSelectedMechanicId, mapDetailOpen, setMapDetailOpen, 
    openMapDetail, selectedDate, setSelectedDate, selectedTime, setSelectedTime, problemDesc, setProblemDesc, 
    problemPhotos, setProblemPhotos, problemPhotoRef, addProblemPhoto, removeProblemPhoto, quotePhotoRef, 
    addQuotePhoto, removeQuotePhoto, approveExpensiveService, setApproveExpensiveService, shareHistoryConsent, 
    setShareHistoryConsent, bookingService, setBookingService, bookingServiceSearch, setBookingServiceSearch, 
    selectedBookingVehicleId, setSelectedBookingVehicleId, paymentForm, setPaymentForm, reviewingApptId, 
    setReviewingApptId, reviewForm, setReviewForm, showPasswordModal, setShowPasswordModal, legalModalTopic, 
    setLegalModalTopic, detailReturnScreen, setDetailReturnScreen, passwordForm, setPasswordForm, 
    showNewTicketForm, setShowNewTicketForm, newTicketForm, setNewTicketForm, showDeleteAccountModal, 
    setShowDeleteAccountModal, confirmDialog, setConfirmDialog, deleteConfirmText, setDeleteConfirmText, 
    ownerDangerZoneOpen, setOwnerDangerZoneOpen, mechDangerZoneOpen, setMechDangerZoneOpen, 
    ownerNotifDetailsOpen, setOwnerNotifDetailsOpen, mechNotifDetailsOpen, setMechNotifDetailsOpen, 
    ownerAccountOpen, setOwnerAccountOpen, mechAccountOpen, setMechAccountOpen, mechPaymentInfoOpen, 
    setMechPaymentInfoOpen, reschedulingApptId, setReschedulingApptId, rescheduleDate, setRescheduleDate, 
    rescheduleTime, setRescheduleTime, vehicles, setVehicles, selectedVehicleId, setSelectedVehicleId, 
    selectedVehicle, showMaintenanceHistory, setShowMaintenanceHistory, showAddVehicle, setShowAddVehicle, 
    newVehicle, setNewVehicle, editingReminderKind, setEditingReminderKind, reminderEditForm, 
    setReminderEditForm, showAddReminderForm, setShowAddReminderForm, newReminderForm, setNewReminderForm, 
    showEditVehicle, setShowEditVehicle, editVehicleForm, setEditVehicleForm, appointments, setAppointments, 
    autoAccept, setAutoAccept, toast, setToast, successPulse, setSuccessPulse, showOnboarding, setShowOnboarding, 
    onboardStep, setOnboardStep, showDayFullPrompt, setShowDayFullPrompt, dayFullNotified, setDayFullNotified, 
    completingApptId, setCompletingApptId, warrantyDaysForm, setWarrantyDaysForm, replyingReviewId, 
    setReplyingReviewId, replyDraft, setReplyDraft, onboardingVisible, smsLog, setSmsLog, conversations, 
    setConversations, activeConvoId, setActiveConvoId, chatInput, setChatInput, showTranslated, 
    setShowTranslated, fileInputRef, mechActiveConvoId, setMechActiveConvoId, mechChatInput, setMechChatInput, 
    mechTab, setMechTab, mechProfileTab, setMechProfileTab, showAddServiceForm, setShowAddServiceForm, 
    newServiceForm, setNewServiceForm, duplicateServiceWarning, setDuplicateServiceWarning, mechReqView, 
    setMechReqView, mechAnalyticsView, setMechAnalyticsView, expandedCustomerHistory, setExpandedCustomerHistory, 
    historyExpandedDate, setHistoryExpandedDate, ownerApptView, setOwnerApptView, ownerHistoryExpandedDate, 
    setOwnerHistoryExpandedDate, quoteRequests, setQuoteRequests, quoteOffers, setQuoteOffers, showQuoteModal, 
    setShowQuoteModal, quoteVehicleId, setQuoteVehicleId, quoteIssue, setQuoteIssue, quotePhotos, setQuotePhotos, 
    quoteSelectedMechIds, setQuoteSelectedMechIds, quoteMechSearch, setQuoteMechSearch, quotePremiumUnlocked, 
    setQuotePremiumUnlocked, showQuotePremiumUpsell, setShowQuotePremiumUpsell, respondingQuoteOfferId, 
    setRespondingQuoteOfferId, quoteOfferForm, setQuoteOfferForm, expandedQuoteReqId, setExpandedQuoteReqId, 
    pendingQuoteAccept, setPendingQuoteAccept, coverFileRef, staffFileRefs, expandedDay, setExpandedDay, 
    newSlotTime, setNewSlotTime, listings, setListings, showSellForm, setShowSellForm, showSellVehiclePicker, 
    setShowSellVehiclePicker, sellForm, setSellForm, sellPhotoRef, selectedListingId, setSelectedListingId, 
    showOfferForm, setShowOfferForm, offerAmount, setOfferAmount, showListingMsgForm, setShowListingMsgForm, 
    listingMsg, setListingMsg, jobListings, setJobListings, jobFilters, setJobFilters, selectedJobId, 
    setSelectedJobId, showJobForm, setShowJobForm, jobForm, setJobForm, showJobApplyForm, setShowJobApplyForm, 
    jobApplyMsg, setJobApplyMsg, jobApplyCv, setJobApplyCv, jobApplyInfo, setJobApplyInfo, myApplications, 
    setMyApplications, cvFileRef, mechListingsSubTab, setMechListingsSubTab, adminAuthed, setAdminAuthed, 
    adminForm, setAdminForm, adminError, setAdminError, adminLoginLoading, adminTab, setAdminTab, 
    adminUserTypeFilter, setAdminUserTypeFilter, adminUserSearch, setAdminUserSearch, selectedAdminUser, 
    setSelectedAdminUser, adminEditForm, setAdminEditForm, adminProfileViewUser, setAdminProfileViewUser, 
    editingProfileField, setEditingProfileField, profileFieldDraft, setProfileFieldDraft, profilePasswordDraft, 
    setProfilePasswordDraft, adminAnalyzeUserKey, setAdminAnalyzeUserKey, expandedAdminListingId, 
    setExpandedAdminListingId, expandedAdminJobId, setExpandedAdminJobId, ownersDirectory, setOwnersDirectory, 
    mechanicAdminOverrides, setMechanicAdminOverrides, ownerProfile, updateMyOwnerField, updateMyOwnerFields, 
    supportTickets, setSupportTickets, apiReady, setApiReady, apiError, setApiError, adminTicketStatusFilter, 
    setAdminTicketStatusFilter, adminTicketTypeFilter, setAdminTicketTypeFilter, adminTicketPriorityFilter, 
    setAdminTicketPriorityFilter, adminTicketSearch, setAdminTicketSearch, adminTicketVisibleCount, 
    setAdminTicketVisibleCount, showTicketAnalytics, setShowTicketAnalytics, selectedTicketId, 
    setSelectedTicketId, adminTicketNote, setAdminTicketNote, adminReplyDraft, setAdminReplyDraft, 
    showBroadcastModal, setShowBroadcastModal, broadcastForm, setBroadcastForm, broadcastLog, setBroadcastLog, 
    adminChangeLog, setAdminChangeLog, fireSuccessPulse, getEffectiveDistance, requestLocation, handleSortClick, 
    confirmUseLocation, stopUsingLocation, requestNotifPermission, fireNotification, selectedMechanic, 
    bookingServiceOptions, myProfile, selectedListing, allReminders, dismissedReminderKey, 
    setDismissedReminderKey, browseScrollRef, heroCollapsed, setHeroCollapsed, goBookFromReminder, topReminder, 
    notifiedReminderKeysRef, filtered, quoteFilteredMechanics, filteredListings, activeListingFilterCount, 
    filteredJobs, activeJobFilterCount, selectedJob, myReviews, myApplicationRefs, activeFilterCount, nextDays, 
    isSameMechanicAppt, customerNoShowCount, isMyOwnerAppt, activeAppts, historyByDate, slotsForDate, 
    isDayOpenForMechanic, mechanicOpenStatus, goToAddSlotForToday, openDetail, rebookAppt, 
    downloadAppointmentIcs, downloadMaintenanceReport, downloadAppointmentReceipt, mechanicDirectionsUrl, 
    toggleQuoteMechanic, unlockQuotePremium, closeQuoteModal, submitQuoteRequest, submitQuoteOffer, 
    acceptQuoteOffer, EXPENSIVE_SERVICE_THRESHOLD, confirmBooking, goHome, chooseRole, submitAdminLogin, 
    adminLogout, ADMIN_FIELD_LABELS, adminFieldLabel, formatAdminHistoryValue, adminChangeTargetLabel, 
    logAdminChange, applyAdminFieldChange, revertAdminChange, ADMIN_TARGET_TYPE_META, adminChangeLogGrouped, 
    expandedHistoryGroups, setExpandedHistoryGroups, toggleHistoryGroup, revertAdminChangeGroup, recordShare,
    fieldEditSnapshotRef, trackFieldFocus, trackFieldBlurAndLog, trackInputProps, adminStats, adminAllUsers, 
    adminFilteredUsers, openAdminUserEdit, saveAdminUserEdit, toggleAdminUserStatus, resetUserPassword, 
    sendPasswordResetLink, openAdminProfileView, viewingUser, profileFieldOldValueRef, startEditProfileField, 
    cancelEditProfileField, ADMIN_NUMERIC_PROFILE_FIELDS, saveProfileField, renderAdminProfileRow, 
    toggleListingRemoved, updateListingField, updateMechService, removeMechService, addMechService, 
    toggleJobListingStatus, updateJobField, renderAdminListingCard, renderAdminJobCard, openAdminAnalyze, 
    analyzingUser, adminUserAnalytics, adminFilteredTickets, adminTicketAnalytics, selectedTicket, 
    updateTicketStatus, saveTicketNote, issueTicketRefund, removeReportedListing, removeFlaggedReview, 
    grantVerification, sendAdminReply, sendBroadcast, adminRegionBreakdown, adminRevenueStats, 
    addVehicle, updateVehicleFields, saveReminderOverride, resetReminderOverride, submitNewReminder, 
    updateCustomReminder, removeCustomReminder, acceptAppt, rejectAppt, markNoShow, advanceStatus, 
    completeApptWithWarranty, cancelOwnAppt, startReschedule, confirmReschedule, submitReview, 
    submitMechanicReply, deleteMyReview, closePasswordModal, submitPasswordChange, confirmDeleteAccount, 
    openHelpInfo, mySupportTickets, submitSupportTicket, openReportForm, renderSupportView, openChatWithMechanic, 
    openMechChatWithOwnerListing, activeConvo, sendOwnerMessage, handleFileSelect, sendOwnerMessageWithReply, 
    toggleTranslate, mechConvo, sendMechMessage, updateMyField, updateService, removeService, toggleServiceFixed, 
    finalizeAddService, findMissingFixedPriceService, saveMyProfile, previewMyProfile, tryAddService, 
    cancelAddService, uploadCoverPhoto, removeCoverPhoto, addStaff, updateStaffField, removeStaff, 
    staffAvatarUpload, ownerPhotoUpload, toggleDayOpen, toggleSlotClosed, addExtraSlot, openSellForm, 
    startSellFlow, pickVehicleToSell, pickOtherCarToSell, sellPhotoUpload, notifyFavoriteWatchers, submitListing, 
    setListingStatus, removeListing, myBuyerName, myPendingOfferOn, openOfferForm, submitOffer, submitListingMsg, 
    respondOffer, markOffersSeen, clearListingFilters, clearJobFilters, openJobForm, submitJobListing, 
    setJobListingStatus, removeJobListing, handleCvSelect, removeCv, closeJobApplyForm, openJobApplyForm, 
    jobApplyPhoneCheck, jobApplyEmailValid, jobApplyInfoValid, jobApplyReady, submitJobApplication, 
    rejectApplication, roleColor, roleBtn, goToNotifTarget, jobEmploymentColor, openQuoteModal,
  } = useApp();
  // ---------------------------------------------------------------------------------------------
  // TAM SAYFA WEB DÜZENİ
  // Bu sayfa iki farklı bağlamda render ediliyor:
  //   1) screen === "detail"  → tarayıcının tam genişliği, Airbnb ilan sayfası gibi 2 kolonlu
  //      (solda içerik, sağda yapışkan randevu kartı).
  //   2) mapDetailOpen        → haritadan açılan dar modal; orada 2 kolon sıkışık görünürdü, bu
  //      yüzden `compact` ile tek kolona düşürülüyor. Tailwind'in lg: kırılımı VIEWPORT'a bakar,
  //      kapsayıcı genişliğine değil — büyük ekranda dar modal içinde lg: yine tetiklenirdi.
  const compact = mapDetailOpen;
  // "Faydalı" oyu: araç sahipleri her zaman, tamirciler ise KENDİ profilleri dışında oy verebilir.
  const canVoteHelpful = role === "owner" || (role === "mechanic" && selectedMechanic?.id !== MY_MECHANIC_ID);
  const dist = getEffectiveDistance(selectedMechanic);
  const openNow = mechanicOpenStatus(selectedMechanic);
  const hourLines = selectedMechanic.id === MY_MECHANIC_ID ? formatHoursText(mechanicHours, lang) : (selectedMechanic.hoursText || []);
  const todayIdx = (new Date().getDay() + 6) % 7; // 0=Pzt (hourLines ile aynı sıra)
  const reviewList = selectedMechanic.reviewList || [];
  // Puan dağılımı: 5→1 yıldız için kaç yorum geldiğini sayar (Airbnb/Google tarzı çubuk grafik).
  const ratingBuckets = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviewList.filter((r) => Math.round(r.rating) === star).length }));
  const SERVICE_PREVIEW = 6;
  const services = selectedMechanic.services || [];
  const visibleServices = showAllServices ? services : services.slice(0, SERVICE_PREVIEW);
  // MARKA BAZLI FİYAT: tamirci bazı işler için markaya göre farklı fiyat girmiş olabilir
  // (aynı kapı tamiri BMW'de başka, Toyota'da başka). ATU'da da akış aynı: önce marka seçiliyor,
  // fiyat ona göre gösteriliyor. Burada müşteri markasını seçince tüm liste o markaya göre
  // yeniden fiyatlanıyor; hiçbir hizmette marka farkı yoksa seçici hiç gösterilmiyor.
  const priceBrands = useMemo(() => {
    const set = new Set<string>();
    for (const s of services) for (const b of Object.keys(s.brandPrices || {})) set.add(b);
    return [...set].sort();
  }, [services]);
  const [priceBrand, setPriceBrand] = useState(null);
  // Sayfa içi bölüm bağlantıları: id'ler bu bileşende benzersiz olsun diye tamirci id'siyle
  // öneklenmiyor — aynı anda yalnızca tek bir tamirci profili açık olabiliyor.
  const scrollToSection = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const mechListings = listings.filter((l) => l.sellerType === "mechanic" && (l.sellerId != null ? l.sellerId === selectedMechanic.id : l.sellerName === selectedMechanic.name) && !l.adminRemoved);
  const mechJobs = jobListings.filter((j) => j.mechanicId === selectedMechanic.id);
  const isVisitor = role !== "mechanic";
  const closeOverlays = () => { setMapDetailOpen(false); setShowMapMobile(false); };
  const goBack = () => { if (mapDetailOpen) { setMapDetailOpen(false); } else { setScreen(detailReturnScreen || (role === "mechanic" ? "mechBrowse" : "owner")); setDetailReturnScreen(null); } };
  // Rozetler: profilin en üstünde "bu servis neden iyi" sorusuna tek bakışta cevap veren şerit.
  // Yalnızca GERÇEKTEN hak edilen rozetler gösteriliyor — herkeste çıkan bir rozet bilgi taşımaz.
  const highlights = [
    selectedMechanic.rating >= 4.7 && { icon: Star, label: t("mechBadgeTopRated"), tone: "bg-amber-50 text-amber-700 border-amber-200" },
    selectedMechanic.avgResponseMinutes && selectedMechanic.avgResponseMinutes <= 30 && { icon: Zap, label: t("mechBadgeFastReply"), tone: "bg-blue-50 text-blue-700 border-blue-200" },
    selectedMechanic.reviews >= 50 && { icon: Users, label: t("mechBadgeManyReviews"), tone: "bg-violet-50 text-violet-700 border-violet-200" },
    services.some((s) => s.fixed && String(s.price || "").trim()) && { icon: Tag, label: t("mechBadgeFixedPrice"), tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    (selectedMechanic.brandsServiced || []).length >= 3 && { icon: Car, label: t("mechBadgeMultiBrand", { n: String(selectedMechanic.brandsServiced.length) }), tone: "bg-rose-50 text-rose-700 border-rose-200" },
  ].filter(Boolean);
  const statTiles = [
    { icon: Star, label: t("rating"), value: `${selectedMechanic.rating}/5`, tint: "text-amber-500" },
    { icon: MapPin, label: t("distance"), value: formatDistanceKm(dist), tint: "text-rose-500" },
    selectedMechanic.avgResponseMinutes ? { icon: Zap, label: t("mechResponseStatLabel"), value: `${selectedMechanic.avgResponseMinutes} ${t("mechMinuteShort")}`, tint: "text-blue-500" } : null,
    { icon: Banknote, label: t("price"), value: null, tint: "text-emerald-500" },
  ].filter(Boolean);

  // Bölüm başlığı — tüm bölümlerde aynı tipografi/aralık kullanılsın diye tek yerde tanımlı.
  const Section = ({ id, icon: Icon, title, count = null, action = null, children }) => (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h2 className="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0"><Icon size={16} className="text-rose-600" /></span>
          {title}{count != null && <span className="text-gray-300 font-normal text-sm">({count})</span>}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );

  const bookingCard = (
    <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-lg shadow-gray-100">
      <div className="flex items-end justify-between gap-2 mb-1">
        <div>
          <p className="text-[11px] text-gray-400 font-medium">{t("mechStartingFromLabel")}</p>
          {/* Türetilmiş başlangıç fiyatı: tamircinin hizmet listesindeki EN DÜŞÜK fiyat
              (marka bazlı fiyatlar dahil). Hiç fiyatlı hizmet yoksa rakam yerine "—". */}
          <p className="text-2xl font-bold text-gray-900 leading-tight">{mechanicStartingPrice(selectedMechanic) > 0 ? <>{mechanicStartingPrice(selectedMechanic).toLocaleString("tr-TR")}<span className="text-base font-semibold text-gray-400">₺</span></> : <span className="text-lg text-gray-400">—</span>}</p>
        </div>
        <span className="flex items-center gap-1 text-sm font-semibold text-gray-900"><Star size={14} className="fill-gray-900" />{selectedMechanic.rating}<span className="text-gray-400 font-normal text-xs">({selectedMechanic.reviews})</span></span>
      </div>
      <div className="mb-4"><PriceLevelDots price={selectedMechanic.price} /></div>
      {isVisitor ? (
        <>
          <button onClick={() => { closeOverlays(); setScreen("booking"); }} className="w-full bg-rose-600 text-white py-3.5 rounded-2xl font-semibold text-sm hover:bg-rose-700 active:scale-[0.99] transition shadow-md shadow-rose-200 flex items-center justify-center gap-2 whitespace-nowrap"><Calendar size={16} /> {t("bookNow")}</button>
          <button onClick={() => { closeOverlays(); openChatWithMechanic(selectedMechanic); }} className="w-full mt-2 border border-gray-200 text-gray-700 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition flex items-center justify-center gap-2 whitespace-nowrap"><MessageCircle size={16} /> {t("sendMessage")}</button>
          <button onClick={() => { closeOverlays(); openQuoteModal(); }} className="w-full mt-2 border border-dashed border-rose-300 text-rose-600 py-3 rounded-2xl font-semibold text-sm hover:bg-rose-50 transition flex items-center justify-center gap-2 whitespace-nowrap"><Banknote size={16} /> {t("mechFreeQuoteBtn")}</button>
          {selectedMechanic.phone && (
            <a href={`tel:${selectedMechanic.phone}`} className="w-full mt-2 text-gray-500 py-2 rounded-2xl font-medium text-xs hover:text-rose-600 transition flex items-center justify-center gap-1.5"><Phone size={13} /> {t("mechCallBtn")} · {selectedMechanic.phone}</a>
          )}
          <p className="text-[11px] text-gray-400 text-center mt-3">{t("mechBookingCardHint")}</p>
        </>
      ) : null}
      <div className="border-t border-gray-100 mt-4 pt-4 space-y-2.5">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{t("mechTrustTitle")}</p>
        {selectedMechanic.verified && <p className="text-xs text-gray-600 flex items-start gap-2"><BadgeCheck size={14} className="text-rose-500 flex-shrink-0 mt-px" /> {t("identityVerifiedNote")}</p>}
        <p className="text-xs text-gray-600 flex items-start gap-2"><Globe size={14} className="text-gray-400 flex-shrink-0 mt-px" /> {LANG_LABELS[selectedMechanic.lang] || t("turkishFallbackLabel")}</p>
        <div className="text-xs text-gray-600 flex items-start gap-2">
          <CreditCard size={14} className="text-gray-400 flex-shrink-0 mt-px" />
          {(selectedMechanic.paymentMethods || []).length > 0
            ? <span className="flex flex-wrap gap-1">{selectedMechanic.paymentMethods.map((p) => (<span key={p} className="bg-gray-100 rounded-full px-2 py-0.5 text-[10px] font-medium">{p}</span>))}</span>
            : <span className="text-gray-400">{t("notSpecifiedLabel")}</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div className={compact ? "flex flex-col min-h-0 overflow-y-auto" : "w-full bg-gray-50 min-h-screen pb-24 lg:pb-0"}>
      {/* Üst çubuk yalnızca TAM SAYFA modda: haritadan açılan dar modalda (compact) yer kaplardı
          ve modalın kendi kapatma düğmesi zaten var. Logo burada da olsun ki kullanıcı detay
          sayfasının ortasındayken bile tek tıkla ana sayfaya dönebilsin. */}
      {!compact && <PageTopBar onBack={goBack} />}
      {/* ---- KAPAK ---- Airbnb'deki geniş görsel bandı; üstte yüzen aksiyonlar, altta profil kartı
           görselin üzerine biniyor (fizyoterapistimibul'daki uzman kartı yerleşimi). */}
      <div className="relative">
        <div className={`${compact ? "h-40" : "h-56 md:h-72 lg:h-80"} bg-gradient-to-br ${BANNER_PRESETS[selectedMechanic.bannerPreset] || BANNER_PRESETS.blue} relative overflow-hidden`}>
          {selectedMechanic.coverPhoto && !coverBroken && <img src={imgThumb(selectedMechanic.coverPhoto, 1600)} loading="eager" decoding="async" onError={() => setCoverBroken(true)} alt={t("mechCoverAlt", { name: selectedMechanic.name })} className="absolute inset-0 w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-black/25" />
        </div>
        <button onClick={goBack} aria-label={t("backToListBtn")} className="absolute top-4 left-4 z-10 w-10 h-10 bg-white/95 backdrop-blur rounded-full shadow-sm flex items-center justify-center text-gray-700 hover:scale-105 transition"><ChevronLeft size={18} /></button>
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <button onClick={() => toggleFavoriteMechanic(selectedMechanic.id)} aria-label={t("addToFavoritesAria")} className="w-10 h-10 bg-white/95 backdrop-blur rounded-full shadow-sm hover:scale-105 transition flex items-center justify-center"><Heart size={16} className={(favoriteMechanicIds || []).includes(selectedMechanic.id) ? "fill-rose-600 text-rose-600" : "text-gray-600"} /></button>
          <ShareButton title={selectedMechanic.name} text={`${selectedMechanic.name} — ${t("discoverOnFixperto")}`} path={`?mechanic=${selectedMechanic.id}`} onShare={(channel, refCode) => recordShare("mechanic", selectedMechanic.id, channel, refCode)} />
        </div>
      </div>

      {/* ---- PROFİL BAŞLIĞI ---- */}
      <div className={`${compact ? "px-5" : "max-w-7xl mx-auto px-5 md:px-8"} relative`}>
        <div className={`bg-white border border-gray-100 rounded-3xl shadow-sm ${compact ? "-mt-10 p-4" : "-mt-14 md:-mt-16 p-5 md:p-6"}`}>
          <div className="flex items-start gap-4">
            <div className={`${compact ? "w-16 h-16 text-3xl" : "w-20 h-20 md:w-24 md:h-24 text-4xl md:text-5xl"} rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden`}>{selectedMechanic.img}</div>
            <div className="flex-1 min-w-0">
              <h1 className={`${compact ? "text-lg" : "text-xl md:text-2xl"} font-bold text-gray-900 flex items-center gap-1.5 flex-wrap`}>
                {selectedMechanic.name}
                {selectedMechanic.verified && <BadgeCheck size={compact ? 16 : 20} className="text-rose-500 flex-shrink-0" />}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">{selectedMechanic.specialty}</p>
              <div className="flex items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500 flex-wrap">
                <span className="flex items-center gap-1 font-semibold text-gray-900"><Star size={13} className="fill-gray-900" />{selectedMechanic.rating}<span className="font-normal text-gray-400">({selectedMechanic.reviews})</span></span>
                <span className="flex items-center gap-1"><MapPin size={12} />{formatDistanceKm(dist)}</span>
                {openNow !== null && (<span className={`px-2 py-0.5 rounded-full font-semibold ${openNow ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>{openNow ? t("mechOpenNow") : t("mechClosedNow")}</span>)}
                {selectedMechanic.avgResponseMinutes && <span className="flex items-center gap-1"><Zap size={12} className="text-blue-500" />{t("avgResponsePrefix")} {selectedMechanic.avgResponseMinutes} {t("avgResponseSuffix")}</span>}
              </div>
            </div>
            {/* Geniş ekranda birincil aksiyon başlıkta da duruyor — kullanıcı sağdaki karta gitmeden
                de randevu alabilsin (sayfanın en üstünde tek tık). */}
            {!compact && isVisitor && (
              <div className="hidden lg:flex flex-col gap-2 flex-shrink-0 w-52">
                <button onClick={() => { closeOverlays(); setScreen("booking"); }} className="bg-rose-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-rose-700 transition flex items-center justify-center gap-2"><Calendar size={15} /> {t("bookNow")}</button>
                <button onClick={() => { closeOverlays(); openChatWithMechanic(selectedMechanic); }} className="border border-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition flex items-center justify-center gap-2"><MessageCircle size={15} /> {t("sendMessage")}</button>
              </div>
            )}
          </div>
          {highlights.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
              {highlights.map((h, i) => (<span key={i} className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border ${h.tone}`}><h.icon size={12} /> {h.label}</span>))}
            </div>
          )}
        </div>
      </div>

      {/* ---- BÖLÜM NAVİGASYONU (yapışkan) ---- yalnızca tam sayfada; uzun profillerde kullanıcı
           doğrudan ilgilendiği bölüme atlayabiliyor. */}
      {!compact && (
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100 mt-6 hidden md:block">
          <div className="max-w-7xl mx-auto px-5 md:px-8 flex gap-1 overflow-x-auto">
            {[
              { id: "mech-about", label: t("mechNavAbout") },
              { id: "mech-services", label: t("mechNavServices") },
              // Sekmeler yalnızca karşılığı GERÇEKTEN render edilen bölümler için gösteriliyor —
              // ekibi/aracı olmayan bir tamircide tıklandığında hiçbir şey yapmayan ölü bir sekme
              // kalmasın diye (scrollToSection sessizce no-op olurdu).
              ...((selectedMechanic.staff || []).length > 0 ? [{ id: "mech-team", label: t("mechNavTeam") }] : []),
              { id: "mech-location", label: t("mechNavLocation") },
              ...(isVisitor && mechListings.length > 0 ? [{ id: "mech-inventory", label: t("mechNavInventory") }] : []),
              { id: "mech-reviews", label: t("mechNavReviews") },
            ].map((s) => (
              <button key={s.id} onClick={() => scrollToSection(s.id)} className="px-4 py-3.5 text-sm font-medium text-gray-500 hover:text-rose-600 border-b-2 border-transparent hover:border-rose-500 transition whitespace-nowrap">{s.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* ---- GÖVDE ---- solda içerik, sağda yapışkan randevu kartı ---- */}
      <div className={compact ? "px-5 pt-5 pb-6 space-y-8" : `max-w-7xl mx-auto px-5 md:px-8 py-8 grid grid-cols-1 gap-8 lg:gap-12 items-start ${isVisitor ? "lg:grid-cols-3" : ""}`}>
        <div className={compact ? "space-y-8" : `space-y-10 ${isVisitor ? "lg:col-span-2" : ""}`}>
          {/* Özet istatistikler */}
          <div id="mech-about" className="grid grid-cols-2 md:grid-cols-4 gap-3 scroll-mt-24">
            {statTiles.map((s, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-3.5 text-center">
                <s.icon size={17} className={`mx-auto mb-1.5 ${s.tint}`} />
                <p className="text-[11px] text-gray-400 mb-0.5">{s.label}</p>
                <div className="text-sm font-bold text-gray-900 flex items-center justify-center">{s.value ?? <PriceLevelDots price={selectedMechanic.price} />}</div>
              </div>
            ))}
          </div>

          {/* Markalar */}
          {(selectedMechanic.brandsServiced || []).length > 0 && (
            <Section id="mech-brands" icon={Tag} title={t("brandsServicedByMechanicTitle")}>
              <p className="text-xs text-gray-400 -mt-2 mb-3">{t("mechBrandsHint")}</p>
              <div className="flex flex-wrap gap-2">
                {selectedMechanic.brandsServiced.map((brand, i) => {
                  const palette = ["bg-rose-50 text-rose-700 border-rose-200", "bg-blue-50 text-blue-700 border-blue-200", "bg-amber-50 text-amber-700 border-amber-200", "bg-emerald-50 text-emerald-700 border-emerald-200", "bg-violet-50 text-violet-700 border-violet-200", "bg-cyan-50 text-cyan-700 border-cyan-200"];
                  return (<span key={brand} className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-xl border ${palette[i % palette.length]}`}><Car size={13} /> {brand}</span>);
                })}
              </div>
            </Section>
          )}

          {/* Hizmetler ve fiyatlar — servis menüsü gibi iki sütunlu liste */}
          <Section id="mech-services" icon={ToolIcon} title={t("mechServicesPriceTitle")} count={services.length}>
            {priceBrands.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5"><Car size={13} className="text-rose-500" /> {t("brandPricesOnDetailTitle")}</p>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setPriceBrand(null)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${priceBrand === null ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"}`}>{t("otherBrandsLabel")}</button>
                  {priceBrands.map((b) => (
                    <button key={b} onClick={() => setPriceBrand(b)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${priceBrand === b ? "bg-rose-600 text-white border-rose-600" : "bg-white border-gray-200 text-gray-500 hover:border-rose-300"}`}>{b}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
              {visibleServices.map((s, i) => {
                // Eski kayıtlarda fiyat "350₺" gibi para birimiyle yazılmış olabilir (serbest metin
                // dönemi); yenilerde yalnızca rakam. İki durumu da doğru gösteriyoruz.
                const raw = String(servicePriceForBrand(s, priceBrand) || "").trim();
                const shown = raw === "" ? "" : (/[₺€$]/.test(raw) ? raw : `${raw}₺`);
                const isBrandPrice = brandPriceFor(s, priceBrand) != null;
                return (
                  <div key={s.key || `c-${i}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50/70 transition">
                    <span className="text-sm text-gray-700 flex items-center gap-2 min-w-0">
                      <ToolIcon size={13} className="text-rose-400 flex-shrink-0" />
                      <span className="truncate">{serviceLabel(s)}</span>
                      {s.fixed && String(s.price || "").trim() && <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-50 rounded px-1.5 py-0.5 flex-shrink-0">FIX</span>}
                    </span>
                    <span className="flex items-center gap-2 flex-shrink-0">
                      {isBrandPrice && <span className="text-[10px] font-bold text-rose-600 bg-rose-50 rounded px-1.5 py-0.5">{priceBrand}</span>}
                      <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{shown || <span className="text-xs font-medium text-gray-400">{t("priceUponInspectionLabel")}</span>}</span>
                    </span>
                  </div>
                );
              })}
            </div>
            {services.length > SERVICE_PREVIEW && (
              <button onClick={() => setShowAllServices((v) => !v)} className="mt-3 text-sm font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1">
                {showAllServices ? t("mechShowLess") : t("mechShowAllServices", { n: String(services.length) })}
                <ChevronRight size={14} className={showAllServices ? "-rotate-90 transition" : "rotate-90 transition"} />
              </button>
            )}
            <p className="text-[11px] text-gray-400 mt-3">{t("mechServicesPriceNote")}</p>
          </Section>

          {/* Çalışma saatleri — bugünün satırı vurgulu */}
          <Section id="mech-hours" icon={Clock} title={t("workingHours")}>
            <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-50 overflow-hidden">
              {hourLines.map((line, i) => {
                const isClosed = /kapalı|closed|geschlossen/i.test(line);
                const isToday = i === todayIdx;
                return (
                  <div key={i} className={`flex justify-between items-center px-4 py-2.5 text-sm ${isToday ? "bg-rose-50/60" : ""}`}>
                    <span className={isToday ? "font-bold text-gray-900 flex items-center gap-2" : "text-gray-500"}>
                      {line.split(":")[0]}
                      {isToday && <span className="text-[9px] font-bold uppercase tracking-wide text-rose-600 bg-white border border-rose-200 rounded px-1.5 py-0.5">{t("mechTodayLabel")}</span>}
                    </span>
                    <span className={isClosed ? "text-red-400 font-medium" : isToday ? "font-bold text-gray-900" : "text-gray-700 font-medium"}>{line.split(/:(.+)/)[1]}</span>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Ekip */}
          {(selectedMechanic.staff || []).length > 0 && (
            <Section id="mech-team" icon={Users} title={t("team")} count={selectedMechanic.staff.length}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {selectedMechanic.staff.map((s, i) => {
                  const grads = ["from-rose-400 to-rose-500", "from-gray-700 to-gray-900", "from-rose-500 to-rose-600", "from-gray-500 to-gray-700"];
                  return (
                    <div key={i} className="text-center bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                      <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${grads[i % grads.length]} flex items-center justify-center text-2xl mb-2.5 overflow-hidden shadow-md relative`}>
                        {isImgUrl(s.emoji) ? <img src={s.emoji} loading="lazy" onError={imgFallbackHandler} alt={s.name} className="w-full h-full object-cover" /> : <span className="drop-shadow">{s.emoji}</span>}
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full" />
                      </div>
                      <p className="text-xs font-semibold text-gray-800 leading-tight truncate">{s.name}</p>
                      <p className="text-[11px] text-gray-400 leading-tight truncate">{s.role}</p>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Konum */}
          <Section id="mech-location" icon={Navigation} title={t("location")}>
            <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
              <MapPanel className={compact ? "h-32" : "h-56 md:h-64"} items={[selectedMechanic]} onPick={() => {}} />
              <a
                href={selectedMechanic.lat && selectedMechanic.lng
                  ? `https://www.google.com/maps/dir/?api=1&destination=${selectedMechanic.lat},${selectedMechanic.lng}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedMechanic.address || selectedMechanic.name)}`}
                target="_blank" rel="noreferrer"
                className="p-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition group"
              >
                <p className="text-sm text-gray-600 group-hover:text-rose-600 transition">{selectedMechanic.address}</p>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 flex-shrink-0"><Navigation size={13} /> {t("directionsLabel")}</span>
              </a>
            </div>
          </Section>

          {/* Satılık araçlar & iş ilanları */}
          {isVisitor && mechListings.length > 0 && (
            <Section id="mech-inventory" icon={Car} title={t("carListingsTitle")} count={mechListings.length}
              action={selectedMechanic.verified ? <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 flex items-center gap-1"><BadgeCheck size={12} /> {t("authorizedDealerBadge")}</span> : null}>
              <div className={`grid gap-4 ${compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>{mechListings.map((l) => (<ListingCard key={l.id} l={l} />))}</div>
            </Section>
          )}
          {isVisitor && mechJobs.length > 0 && (
            <Section id="mech-jobs" icon={Briefcase} title={t("jobListingsTitle")} count={mechJobs.length}>
              <div className="flex flex-col gap-3">{mechJobs.map((j) => (<JobCard key={j.id} j={j} />))}</div>
            </Section>
          )}

          {/* Yorumlar — puan dağılımı + kart ızgarası (marka bandı yerine okunabilir düzen) */}
          <Section id="mech-reviews" icon={Star} title={t("reviews")}
            action={reviewList.length > 0 ? <button onClick={() => setShowAllReviews(true)} className="text-sm font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-0.5">{t("viewAllBtn")} <ChevronRight size={14} /></button> : null}>
            {reviewList.length === 0 ? (
              <p className="text-sm text-gray-400 bg-white border border-gray-200 rounded-2xl p-6 text-center">{t("mechNoReviewsYet")}</p>
            ) : (
              <>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 flex flex-col sm:flex-row gap-5 sm:items-center">
                  <div className="text-center sm:w-36 flex-shrink-0">
                    <p className="text-4xl font-bold text-gray-900 leading-none">{selectedMechanic.rating}</p>
                    <div className="flex items-center justify-center gap-0.5 my-1.5">{[...Array(5)].map((_, j) => (<Star key={j} size={13} className={j < Math.round(selectedMechanic.rating) ? "text-gray-900 fill-gray-900" : "text-gray-200 fill-gray-200"} />))}</div>
                    <p className="text-xs text-gray-400">{selectedMechanic.reviews} {t("reviewWordPlural")}</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {ratingBuckets.map((b) => {
                      const pct = reviewList.length ? Math.round((b.count / reviewList.length) * 100) : 0;
                      return (
                        <div key={b.star} className="flex items-center gap-2.5">
                          <span className="text-[11px] text-gray-400 w-3 text-right">{b.star}</span>
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gray-900 rounded-full" style={{ width: `${pct}%` }} /></div>
                          <span className="text-[11px] text-gray-400 w-7">{b.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className={`grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
                  {reviewList.slice(0, 4).map((r, i) => {
                    const grads = ["from-rose-400 to-rose-500", "from-gray-700 to-gray-900", "from-rose-500 to-rose-600", "from-gray-500 to-gray-700"];
                    const times = REVIEW_TIME_LABELS_BY_LANG[lang] || REVIEW_TIME_LABELS_BY_LANG.tr;
                    const liked = likedReviewIds.includes(`${selectedMechanic.id}:${r.id}`);
                    return (
                      <div key={r.id ?? i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${grads[i % grads.length]} flex items-center justify-center text-lg flex-shrink-0 shadow-sm`}>{r.avatar}</div>
                          <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-gray-800 truncate">{r.name}</p><p className="text-[11px] text-gray-400">{times[i % times.length]}</p></div>
                          <BadgeCheck size={14} className="text-rose-400 flex-shrink-0" />
                        </div>
                        <div className="flex items-center gap-0.5 mb-2">{[...Array(5)].map((_, j) => (<Star key={j} size={12} className={j < r.rating ? "text-gray-900 fill-gray-900" : "text-gray-200 fill-gray-200"} />))}</div>
                        {r.photo && isImgUrl(r.photoUrl) && <img src={imgThumb(r.photoUrl, 400)} loading="lazy" decoding="async" onError={imgFallbackHandler} alt={t("reviewPhotoAlt")} className="w-full h-32 rounded-xl object-cover mb-2" />}
                        <p className="text-xs text-gray-500 leading-relaxed"><TranslatedText id={`review-comment-${selectedMechanic.id}-${r.id}`} text={r.comment} fromLang={r.lang || "tr"} viewerLang={role === "mechanic" ? (myProfile?.lang || "tr") : ownerLang} compact /></p>
                        {r.reply && (<div className="mt-2.5 bg-gray-50 rounded-xl p-2.5"><p className="text-[10px] font-bold text-gray-500 mb-0.5">{t("businessReplyLabel")}</p><p className="text-[11px] text-gray-500 leading-snug"><TranslatedText id={`review-reply-${selectedMechanic.id}-${r.id}`} text={r.reply} fromLang={r.replyLang || selectedMechanic.lang || "tr"} viewerLang={role === "mechanic" ? (myProfile?.lang || "tr") : ownerLang} compact /></p></div>)}
                        {!r.reply && role === "mechanic" && selectedMechanic.id === MY_MECHANIC_ID && (
                          replyingReviewId === r.id ? (
                            <div className="mt-2.5 pt-2.5 border-t border-gray-50">
                              <textarea value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} rows={2} placeholder={t("writeYourReplyPlaceholder")} className="w-full text-xs border border-gray-200 rounded-lg p-2 mb-1.5 resize-none" />
                              <div className="flex gap-1.5"><button onClick={() => { setReplyingReviewId(null); setReplyDraft(""); }} className="flex-1 text-[11px] py-1.5 rounded-lg border border-gray-200 text-gray-500">{t("giveUpBtn")}</button><button onClick={() => submitMechanicReply(selectedMechanic.id, r.id)} className="flex-1 text-[11px] py-1.5 rounded-lg bg-rose-600 text-white font-medium">{t("sendBtn")}</button></div>
                            </div>
                          ) : (<button onClick={() => { setReplyingReviewId(r.id); setReplyDraft(""); }} className="mt-2.5 text-[11px] text-rose-600 font-semibold">{t("replyBtn")}</button>)
                        )}
                        <button onClick={() => toggleReviewHelpful(selectedMechanic.id, r.id)} disabled={canVoteHelpful === false} className={`flex items-center gap-1.5 mt-3 pt-2.5 border-t border-gray-50 w-full ${canVoteHelpful ? "cursor-pointer" : "cursor-default"}`}>
                          <ThumbsUp size={12} className={liked ? "text-rose-600 fill-rose-600" : "text-gray-300"} />
                          <span className={`text-[11px] ${liked ? "text-rose-600 font-semibold" : "text-gray-300"}`}>{t("helpfulLabel")}{r.helpfulCount ? ` · ${r.helpfulCount}` : ""}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Section>

          {isVisitor && (
            <button onClick={() => { closeOverlays(); openReportForm("quality", `Tamirci #${selectedMechanic.id} · ${selectedMechanic.name}`, `"${selectedMechanic.name}" hakkında şikayetim var`); }} className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition py-2"><Flag size={12} /> {t("reportThisMechanicBtn")}</button>
          )}
        </div>

        {/* ---- SAĞ KOLON: yapışkan randevu kartı (Airbnb rezervasyon kartı deseni) ---- */}
        {/* Randevu kartı yalnızca ZİYARETÇİ için anlamlı; tamirci rolü başka bir tamirciyi
            incelerken hem kart gizleniyor hem de ızgara tek kolona düşüyor (yukarıdaki
            isVisitor koşulu) — aksi halde ekranın sağ üçte biri boş kalırdı. */}
        {isVisitor && !compact && (
          <aside className="hidden lg:block lg:sticky lg:top-20">{bookingCard}</aside>
        )}
        {isVisitor && compact && <div>{bookingCard}</div>}
      </div>

      {/* ---- MOBİL YAPIŞKAN AKSİYON ÇUBUĞU ---- tam sayfada sağdaki kart görünmediği için ---- */}
      {!compact && isVisitor && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 flex items-center gap-3">
          <div className="flex-shrink-0">
            <p className="text-[10px] text-gray-400 leading-none mb-0.5">{t("mechStartingFromLabel")}</p>
            <p className="text-base font-bold text-gray-900 leading-none">{mechanicStartingPrice(selectedMechanic) > 0 ? `${mechanicStartingPrice(selectedMechanic).toLocaleString("tr-TR")}₺` : "—"}</p>
          </div>
          <button onClick={() => { closeOverlays(); openChatWithMechanic(selectedMechanic); }} aria-label={t("sendMessage")} className="w-11 h-11 rounded-xl border border-gray-200 text-gray-600 flex items-center justify-center flex-shrink-0"><MessageCircle size={18} /></button>
          <button onClick={() => { closeOverlays(); setScreen("booking"); }} className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-rose-700 transition flex items-center justify-center gap-2"><Calendar size={16} /> {t("bookNow")}</button>
        </div>
      )}

      {showAllReviews && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 9000 }} onClick={() => setShowAllReviews(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-auto max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2"><Star size={18} className="text-gray-900 fill-gray-900" /> {t("allReviewsTitle")}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{selectedMechanic.rating} <Star size={10} className="inline text-gray-900 fill-gray-900" /> · {selectedMechanic.reviews} {t("reviewWordPlural")}</p>
              </div>
              <button onClick={() => setShowAllReviews(false)} aria-label={t("closeAria")} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0 ml-3"><X size={15} /></button>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
              {reviewList.map((r) => {
                const liked = likedReviewIds.includes(`${selectedMechanic.id}:${r.id}`);
                return (
                  <div key={r.id} className="p-5">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-lg flex-shrink-0 shadow-sm">{r.avatar}</div>
                      <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-gray-800 truncate flex items-center gap-1">{r.name}<BadgeCheck size={12} className="text-rose-400 flex-shrink-0" /></p><div className="flex items-center gap-1">{[...Array(5)].map((_, j) => (<Star key={j} size={11} className={j < r.rating ? "text-gray-900 fill-gray-900" : "text-gray-200 fill-gray-200"} />))}</div></div>
                    </div>
                    {r.photo && isImgUrl(r.photoUrl) && <img src={imgThumb(r.photoUrl, 300)} loading="lazy" decoding="async" onError={imgFallbackHandler} alt={t("reviewPhotoAlt")} className="w-1/3 max-w-[110px] aspect-square rounded-xl object-cover mb-2.5 float-left mr-3" />}
                    <p className="text-sm text-gray-600 leading-relaxed"><TranslatedText id={`review-comment-${selectedMechanic.id}-${r.id}`} text={r.comment} fromLang={r.lang || "tr"} viewerLang={role === "mechanic" ? (myProfile?.lang || "tr") : ownerLang} /></p>
                    <div className="clear-left" />
                    {r.reply && (<div className="mt-2.5 pt-2.5 border-t border-gray-50 bg-gray-50 rounded-xl p-3"><p className="text-[10px] font-bold text-gray-500 mb-1">{t("businessReplyLabel")}</p><p className="text-xs text-gray-500 leading-relaxed"><TranslatedText id={`review-reply-${selectedMechanic.id}-${r.id}`} text={r.reply} fromLang={r.replyLang || selectedMechanic.lang || "tr"} viewerLang={role === "mechanic" ? (myProfile?.lang || "tr") : ownerLang} /></p></div>)}
                    {!r.reply && role === "mechanic" && selectedMechanic.id === MY_MECHANIC_ID && (
                      replyingReviewId === r.id ? (
                        <div className="mt-2.5 pt-2.5 border-t border-gray-50">
                          <textarea value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} rows={2} placeholder={t("writeYourReplyPlaceholder")} className="w-full text-xs border border-gray-200 rounded-lg p-2 mb-1.5 resize-none" />
                          <div className="flex gap-1.5"><button onClick={() => { setReplyingReviewId(null); setReplyDraft(""); }} className="flex-1 text-[11px] py-1.5 rounded-lg border border-gray-200 text-gray-500">{t("giveUpBtn")}</button><button onClick={() => submitMechanicReply(selectedMechanic.id, r.id)} className="flex-1 text-[11px] py-1.5 rounded-lg bg-rose-600 text-white font-medium">{t("sendBtn")}</button></div>
                        </div>
                      ) : (<button onClick={() => { setReplyingReviewId(r.id); setReplyDraft(""); }} className="mt-2.5 text-[11px] text-rose-600 font-semibold">{t("replyBtn")}</button>)
                    )}
                    <button onClick={() => toggleReviewHelpful(selectedMechanic.id, r.id)} disabled={canVoteHelpful === false} className={`flex items-center gap-1.5 mt-3 ${canVoteHelpful ? "cursor-pointer" : "cursor-default"}`}>
                      <ThumbsUp size={14} className={liked ? "text-rose-600 fill-rose-600" : "text-gray-300"} />
                      <span className={`text-xs ${liked ? "text-rose-600 font-semibold" : "text-gray-400"}`}>{t("helpfulLabel")}{r.helpfulCount ? ` · ${r.helpfulCount}` : ""}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
