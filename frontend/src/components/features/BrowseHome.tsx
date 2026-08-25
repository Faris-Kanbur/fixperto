import { Plus, X, SlidersHorizontal, Map as MapIcon } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";
import { MechCard } from "./MechCard";
import { SkeletonCard } from "./SkeletonCard";
import { MapPanel } from "./MapPanel";
import { ListingCard } from "./ListingCard";
import { JobCard } from "./JobCard";

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
    expandedHistoryGroups, setExpandedHistoryGroups, toggleHistoryGroup, revertAdminChangeGroup, 
    fieldEditSnapshotRef, trackFieldFocus, trackFieldBlurAndLog, trackInputProps, adminStats, adminAllUsers, 
    adminFilteredUsers, openAdminUserEdit, saveAdminUserEdit, toggleAdminUserStatus, resetUserPassword, 
    sendPasswordResetLink, openAdminProfileView, viewingUser, profileFieldOldValueRef, startEditProfileField, 
    cancelEditProfileField, ADMIN_NUMERIC_PROFILE_FIELDS, saveProfileField, renderAdminProfileRow, 
    toggleListingRemoved, updateListingField, updateMechService, removeMechService, addMechService, 
    toggleJobListingStatus, updateJobField, renderAdminListingCard, renderAdminJobCard, openAdminAnalyze, 
    analyzingUser, adminUserAnalytics, adminFilteredTickets, adminTicketAnalytics, selectedTicket, 
    updateTicketStatus, saveTicketNote, issueTicketRefund, removeReportedListing, removeFlaggedReview, 
    grantVerification, sendAdminReply, sendBroadcast, adminRegionBreakdown, adminRevenueStats, submitAuth, 
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
            <button onClick={() => goBookFromReminder(topReminder.key)} className={`flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-xl text-white transition ${topReminder.urgent ? "bg-red-600 hover:bg-red-700" : "bg-rose-600 hover:bg-rose-700"}`}>Randevu Al</button>
            <button onClick={() => setDismissedReminderKey(topReminder.key)} aria-label="Kapat" className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition p-2 -m-2"><X size={16} /></button>
          </div>
        </div>
      )}
      {ownerMode === "mechanics" && (
        <div className="max-w-6xl mx-auto w-full px-5 md:px-8 py-4">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[{ key: "distance", label: "📍 Mesafe" }, { key: "price", label: "💰 Fiyat" }, { key: "rating", label: "⭐ Puan" }].map(opt => (<button key={opt.key} onClick={() => handleSortClick(opt.key)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition ${sortBy === opt.key ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-600 border-gray-200"}`}>{opt.label}{sortBy === opt.key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}</button>))}
              <button onClick={() => setShowFilterModal(true)} className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border flex items-center gap-1 bg-white text-gray-600 border-gray-200 relative"><SlidersHorizontal size={12} /> {t("filterBtn")} {activeFilterCount > 0 && <span className="ml-0.5 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] flex items-center justify-center">{activeFilterCount}</span>}</button>
              <button onClick={() => setShowMapMobile(true)} className="md:hidden px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border flex items-center gap-1 bg-white text-gray-600 border-gray-200"><MapIcon size={12} /> {t("showMap")}</button>
            </div>
            <p className="text-xs text-gray-400 whitespace-nowrap">{filtered.length} tamirci bulundu</p>
          </div>
          <div className="md:flex md:gap-6">
            <div className="md:w-[58%]"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{locationStatus === "loading" ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />) : filtered.map(m => (<MechCard key={m.id} m={m} onHover={setHoveredPinId} />))}</div></div>
            <div className="hidden md:block md:w-[42%] md:sticky md:top-4 md:self-start"><MapPanel className="h-[65vh]" items={filtered} onPick={openMapDetail} hoveredId={hoveredPinId} onHoverItem={setHoveredPinId} previewItem={mapPreviewItem} onPreviewChange={setMapPreviewItem} /></div>
          </div>
        </div>
      )}
      {ownerMode === "cars" && (
        <div className="max-w-6xl mx-auto w-full px-5 md:px-8 py-4">
          <button onClick={startSellFlow} className="w-full md:max-w-xs mb-4 bg-rose-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-rose-700 transition flex items-center justify-center gap-2"><Plus size={16} /> {t("sellMyCar")}</button>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button onClick={() => setListingSort("default")} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition ${listingSort === "default" ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-600 border-gray-200"}`}>Önerilen</button>
              {[{ key: "price", label: "💰 Fiyat" }, { key: "km", label: "🛞 KM" }, { key: "year", label: "📅 Yıl" }].map(opt => (<button key={opt.key} onClick={() => handleListingSortClick(opt.key)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition ${listingSort === opt.key ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-600 border-gray-200"}`}>{opt.label}{listingSort === opt.key ? (listingSortDir === "asc" ? " ↑" : " ↓") : ""}</button>))}
              <button onClick={() => setShowFilterModal(true)} className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border flex items-center gap-1 bg-white text-gray-600 border-gray-200 relative"><SlidersHorizontal size={12} /> {t("filterBtn")} {activeListingFilterCount > 0 && <span className="ml-0.5 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] flex items-center justify-center">{activeListingFilterCount}</span>}</button>
            </div>
            <p className="text-xs text-gray-400 whitespace-nowrap">{filteredListings.length} ilan bulundu</p>
          </div>
          <div className="md:flex md:gap-6">
            <div className="md:w-[58%]"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 relative">{filteredListings.map(l => (<ListingCard key={l.id} l={l} onHover={setHoveredPinId} />))}{filteredListings.length === 0 && (<div className="col-span-full text-center py-10"><p className="text-gray-400 text-sm mb-3">Bu filtrelere uyan ilan bulunamadı</p>{(activeListingFilterCount > 0 || query.trim()) && <button onClick={() => { clearListingFilters(); setQuery(""); }} className="text-rose-600 text-sm font-semibold hover:underline">Filtreleri Temizle</button>}</div>)}</div></div>
            <div className="hidden md:block md:w-[42%] md:sticky md:top-4 md:self-start"><MapPanel className="h-[65vh]" items={filteredListings} onPick={(l) => setSelectedListingId(l.id)} hoveredId={hoveredPinId} onHoverItem={setHoveredPinId} previewItem={mapPreviewItem} onPreviewChange={setMapPreviewItem} /></div>
          </div>
        </div>
      )}
      {ownerMode === "jobs" && (
        <div className="max-w-6xl mx-auto w-full px-5 md:px-8 py-4">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <button onClick={() => setShowFilterModal(true)} className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border flex items-center gap-1 bg-white text-gray-600 border-gray-200 relative"><SlidersHorizontal size={12} /> {t("filterBtn")} {activeJobFilterCount > 0 && <span className="ml-0.5 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] flex items-center justify-center">{activeJobFilterCount}</span>}</button>
            <p className="text-xs text-gray-400 whitespace-nowrap">{filteredJobs.length} iş ilanı bulundu</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{filteredJobs.map(j => (<JobCard key={j.id} j={j} />))}{filteredJobs.length === 0 && (<div className="col-span-full text-center py-10"><p className="text-gray-400 text-sm mb-3">Bu filtrelere uyan iş ilanı bulunamadı</p>{(activeJobFilterCount > 0 || query.trim()) && <button onClick={() => { clearJobFilters(); setQuery(""); }} className="text-rose-600 text-sm font-semibold hover:underline">Filtreleri Temizle</button>}</div>)}</div>
        </div>
      )}
    </div>
  );
}
