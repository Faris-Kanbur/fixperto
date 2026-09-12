import { Plus, X, SlidersHorizontal, Map as MapIcon } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";
import { MechCard } from "./MechCard";
import { SiteFooter } from "./SiteFooter";
import { SkeletonCard } from "./SkeletonCard";
import { MapPanel } from "./MapPanel";
import { ListingCard } from "./ListingCard";
import { JobCard } from "./JobCard";


// ARAMA REHBERİ ÇUBUĞU — boş/eksik kriter kombinasyonlarında kullanıcıyı yönlendirir.
// Karar (bkz. AppLogicProvider.tsx searchGuidance yorumu): hiçbir alan doldurulmasa bile ENGELLEYİCİ
// popup göstermiyoruz; her zaman sonuç veriyoruz ve aktif kriterleri tek tıkla kaldırılabilir
// rozetlerle gösteriyoruz. Sonuç sıfırsa, hangi kriteri kaldırınca kaç sonuç çıkacağını söylüyoruz.
function SearchGuidanceBar({ mode }) {
  const { t, searchGuidance } = useApp();
  const g = searchGuidance(mode);
  if (!g.hasAnyCriteria && g.total > 0) return null; // kriter yoksa ve sonuç varsa sessiz kal
  return (
    <div className="mb-3 flex items-center gap-2 flex-wrap">
      {g.chips.map(chip => (
        <span key={chip.key} className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium pl-3 pr-1.5 py-1.5 rounded-full">
          <span className="text-gray-400">{chip.label}:</span> {chip.value}
          <button onClick={chip.clear} aria-label={t("clear")} className="w-5 h-5 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500"><X size={11} /></button>
        </span>
      ))}
      {g.hasAnyCriteria && <span className="text-xs text-gray-400">{t("searchResultCount", { n: String(g.total) })}</span>}
    </div>
  );
}

// SIFIR SONUÇ EKRANI — "sonuç yok" demekle bırakmıyoruz: hangi kriteri kaldırınca kaç sonuç
// çıkacağını hesaplayıp tek tıkla uygulanabilir öneriler sunuyoruz; şehir yazımı hatalıysa
// veri içindeki en yakın gerçek şehri öneriyoruz.
function SearchEmptyState({ mode, emptyText }) {
  const { t, searchGuidance } = useApp();
  const g = searchGuidance(mode);
  return (
    <div className="col-span-full text-center py-12 px-4">
      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><SlidersHorizontal size={22} className="text-gray-400" /></div>
      <p className="text-gray-700 text-sm font-semibold mb-1">{emptyText}</p>
      {!g.hasAnyCriteria && <p className="text-gray-400 text-xs">{t("searchNoDataYet")}</p>}
      {g.citySuggestion && (
        <p className="text-sm text-gray-500 mt-2">
          {t("searchDidYouMean")} <button onClick={g.citySuggestion.apply} className="font-bold text-rose-600 hover:underline">{g.citySuggestion.city}</button>
        </p>
      )}
      {g.relax.length > 0 && (
        <div className="mt-4 max-w-md mx-auto">
          <p className="text-xs text-gray-400 mb-2">{t("searchRelaxHint")}</p>
          <div className="flex flex-col gap-2">
            {g.relax.map(r => (
              <button key={r.key} onClick={r.apply} className="flex items-center justify-between gap-3 bg-white border border-gray-200 hover:border-gray-900 rounded-xl px-3.5 py-2.5 text-left transition">
                <span className="text-sm text-gray-700 truncate">{t("searchRelaxRemove", { label: r.label, value: r.value })}</span>
                <span className="text-xs font-bold text-rose-600 whitespace-nowrap">{t("searchRelaxCount", { n: String(r.count) })}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function BrowseHome({ theme = undefined }) {
  const {
    lang, setLang, t, screen, setScreen, role, setRole, showPass, setShowPass, forgotEmail, setForgotEmail, form, 
    setForm, authError, setAuthError, ownerTab, setOwnerTab, ownerMode, setOwnerMode, ownerLang, setOwnerLang, 
    ownerSettings, setOwnerSettings, mechSettings, setMechSettings, notifLog, setNotifLog, ownerNotifSeenAt, 
    setOwnerNotifSeenAt, mechNotifSeenAt, setMechNotifSeenAt, showNotifPanel, setShowNotifPanel, darkMode, 
    setDarkMode, ownerPhotoRef, ownerProfileTab, setOwnerProfileTab, showMapMobile, setShowMapMobile, 
    hoveredPinId, setHoveredPinId, mapPreviewItem, setMapPreviewItem, showFilterModal, setShowFilterModal, 
    filters, setFilters, listingFilters, setListingFilters, listingSort, setListingSort, listingSortDir, handleListingSortClick, userLocation,
    setUserLocation, locationStatus, setLocationStatus, notifPermission, setNotifPermission, favoriteIds, 
    setFavoriteIds, toggleFavorite, mechanicsList, setMechanicsList, mechanicHours, setMechanicHours, query,
    setQuery, locationQuery, setLocationQuery, serviceQuery, setServiceQuery, sortBy, setSortBy, sortDir, setSortDir, showLocationPrompt,
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
    expandedHistoryGroups, setExpandedHistoryGroups, toggleHistoryGroup, revertAdminChangeGroup, 
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
    toggleTranslate, mechConvo, sendMechMessage, updateMyField, updateService, removeService, setServiceFixed, 
    finalizeAddService, findMissingFixedPriceService, saveMyProfile, previewMyProfile, tryAddService, 
    cancelAddService, uploadCoverPhoto, removeCoverPhoto, addStaff, updateStaffField, removeStaff, 
    staffAvatarUpload, ownerPhotoUpload, toggleDayOpen, toggleSlotClosed, addExtraSlot, openSellForm, 
    startSellFlow, pickVehicleToSell, pickOtherCarToSell, sellPhotoUpload, notifyFavoriteWatchers, submitListing, 
    setListingStatus, removeListing, myBuyerName, myPendingOfferOn, openOfferForm, submitOffer, submitListingMsg, 
    respondOffer, markOffersSeen, clearListingFilters, clearJobFilters, openJobForm, submitJobListing, 
    setJobListingStatus, removeJobListing, handleCvSelect, removeCv, closeJobApplyForm, openJobApplyForm, 
    jobApplyPhoneCheck, jobApplyEmailValid, jobApplyInfoValid, jobApplyReady, submitJobApplication, 
    rejectApplication, roleColor, roleBtn, goToNotifTarget, jobEmploymentColor, 
  } = useApp();
  return (
    <div ref={browseScrollRef} onScroll={() => setHeroCollapsed(c => { const collapsed = browseScrollRef.current.scrollTop > 36; return c === collapsed ? c : collapsed; })} className="flex-1 overflow-y-auto">
      {topReminder && role === "owner" && (
        <div className="max-w-6xl mx-auto w-full px-5 md:px-8 pt-4">
          <div className={`rounded-2xl p-4 mb-1 flex items-center gap-3 shadow-sm border ${topReminder.urgent ? "bg-red-50 border-red-100" : "bg-rose-50 border-rose-100"}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${topReminder.urgent ? "bg-red-100" : "bg-rose-100"}`}>{topReminder.icon}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${topReminder.urgent ? "text-red-700" : "text-rose-700"}`}>{topReminder.vehicleName} — {topReminder.title}</p>
              <p className="text-xs text-gray-500 truncate">{topReminder.detail}</p>
            </div>
            <button onClick={() => goBookFromReminder(topReminder.key)} className={`flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-xl text-white transition ${topReminder.urgent ? "bg-red-600 hover:bg-red-700" : "bg-rose-600 hover:bg-rose-700"}`}>{t("bookNow")}</button>
            <button onClick={() => setDismissedReminderKey(topReminder.key)} aria-label={t("closeAria")} className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition p-2 -m-2"><X size={16} /></button>
          </div>
        </div>
      )}
      {ownerMode === "mechanics" && (
        <div className="max-w-6xl mx-auto w-full px-5 md:px-8 py-4">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[{ key: "distance", label: t("sortDistance") }, { key: "price", label: t("sortPrice") }, { key: "rating", label: t("sortRating") }].map(opt => (<button key={opt.key} onClick={() => handleSortClick(opt.key)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition ${sortBy === opt.key ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-600 border-gray-200"}`}>{opt.label}{sortBy === opt.key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}</button>))}
              <button onClick={() => setShowMapMobile(true)} className="md:hidden px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border flex items-center gap-1 bg-white text-gray-600 border-gray-200"><MapIcon size={12} /> {t("showMap")}</button>
            </div>
            <p className="text-xs text-gray-400 whitespace-nowrap">{filtered.length} {t("mechanicsFoundSuffix")}</p>
          </div>
          <SearchGuidanceBar mode="mechanics" />
          <div className="md:flex md:gap-6">
            <div className="md:w-[58%]"><div className="grid grid-cols-1 sm:grid-cols-2 gap-5">{locationStatus === "loading" ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />) : filtered.map(m => (<MechCard key={m.id} m={m} onHover={setHoveredPinId} />))}{locationStatus !== "loading" && filtered.length === 0 && (<SearchEmptyState mode="mechanics" emptyText={t("noMechanicMatchNote")} />)}</div></div>
            <div className="hidden md:block md:w-[42%] md:sticky md:top-4 md:self-start"><MapPanel className="h-[65vh]" items={filtered} onPick={openMapDetail} hoveredId={hoveredPinId} onHoverItem={setHoveredPinId} previewItem={mapPreviewItem} onPreviewChange={setMapPreviewItem} /></div>
          </div>
        </div>
      )}
      {ownerMode === "cars" && (
        <div className="max-w-6xl mx-auto w-full px-5 md:px-8 py-4">
          <button onClick={startSellFlow} className="w-full md:max-w-xs mb-4 bg-rose-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-rose-700 transition flex items-center justify-center gap-2"><Plus size={16} /> {t("sellMyCar")}</button>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button onClick={() => setListingSort("default")} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition ${listingSort === "default" ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-600 border-gray-200"}`}>{t("sortRecommended")}</button>
              {[{ key: "price", label: t("sortPrice") }, { key: "km", label: t("sortKm") }, { key: "year", label: t("sortYear") }].map(opt => (<button key={opt.key} onClick={() => handleListingSortClick(opt.key)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition ${listingSort === opt.key ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-600 border-gray-200"}`}>{opt.label}{listingSort === opt.key ? (listingSortDir === "asc" ? " ↑" : " ↓") : ""}</button>))}
              </div>
            <p className="text-xs text-gray-400 whitespace-nowrap">{filteredListings.length} {t("listingsFoundSuffix")}</p>
          </div>
          <SearchGuidanceBar mode="cars" />
          <div className="md:flex md:gap-6">
            <div className="md:w-[58%]"><div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative">{filteredListings.map(l => (<ListingCard key={l.id} l={l} onHover={setHoveredPinId} />))}{filteredListings.length === 0 && (<SearchEmptyState mode="cars" emptyText={t("noListingsMatchFilters")} />)}</div></div>
            <div className="hidden md:block md:w-[42%] md:sticky md:top-4 md:self-start"><MapPanel className="h-[65vh]" items={filteredListings} onPick={(l) => setSelectedListingId(l.id)} hoveredId={hoveredPinId} onHoverItem={setHoveredPinId} previewItem={mapPreviewItem} onPreviewChange={setMapPreviewItem} /></div>
          </div>
        </div>
      )}
      {ownerMode === "jobs" && (
        <div className="max-w-6xl mx-auto w-full px-5 md:px-8 py-4">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <p className="text-xs text-gray-400 whitespace-nowrap">{filteredJobs.length} {t("jobsFoundSuffix")}</p>
          </div>
          <SearchGuidanceBar mode="jobs" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{filteredJobs.map(j => (<JobCard key={j.id} j={j} />))}{filteredJobs.length === 0 && (<SearchEmptyState mode="jobs" emptyText={t("noJobsMatchFilters")} />)}</div>
        </div>
      )}
      {/* Alt bilgi: eski karşılama (hero + rol seçim) ekranı misafir gezinmeyle birlikte kaldırıldı;
          oradaki gizli admin girişi (© Fixperto yazısına tıklama) burada korunuyor. */}
      {/* Arama ekranının alt bilgisi artık site geneliyle aynı bileşen. Gizli yönetici girişi
          (© Fixperto yazısına tıklama) bu satırda korunuyor — SiteFooter'ın telif satırında değil,
          çünkü orası her sayfada görünüyor ve kolayca keşfedilir hale gelirdi. */}
      <div className="mt-auto">
        <SiteFooter />
        <div className="text-center pb-4">
          <span data-a11y-exempt="gizli yönetici girişi — bilinçli olarak duyurulmuyor" onClick={() => setScreen("adminLogin")} className="text-[9px] text-gray-200 cursor-pointer select-none">{t("allRightsReserved")}</span>
        </div>
      </div>
    </div>
  );
}
