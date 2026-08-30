import { Banknote, Calendar, CalendarDays, CheckCircle2, Clock, FileText, Navigation, Shield, Star } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";
import { StatusTracker } from "./StatusTracker";
import { statusColor, apptStatusLabel } from "../../utils/helpers";

export function AppointmentCard({ a }) {
  const {
    lang, setLang, t, screen, setScreen, role, setRole, showPass, setShowPass, forgotEmail, setForgotEmail, form, 
    setForm, authError, setAuthError, ownerTab, setOwnerTab, ownerMode, setOwnerMode, ownerLang, setOwnerLang, 
    ownerSettings, setOwnerSettings, mechSettings, setMechSettings, notifLog, setNotifLog, ownerNotifSeenAt, 
    setOwnerNotifSeenAt, mechNotifSeenAt, setMechNotifSeenAt, showNotifPanel, setShowNotifPanel, darkMode, 
    setDarkMode, ownerPhotoRef, ownerProfileTab, setOwnerProfileTab, showMapMobile, setShowMapMobile, 
    hoveredPinId, setHoveredPinId, mapPreviewItem, setMapPreviewItem, showFilterModal, setShowFilterModal, 
    filters, setFilters, listingFilters, setListingFilters, listingSort, setListingSort, userLocation, 
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

    const cancellable = !["Tamir Tamamlandı", "İptal Edildi", "Reddedildi"].includes(a.status);
    const isRescheduling = reschedulingApptId === a.id;
    return (
      <div className="border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-start gap-3 mb-3"><div className="text-2xl bg-rose-50 rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0">{a.mechanicImg}</div><div className="flex-1"><h4 className="font-semibold text-gray-800 text-sm">{a.mechanicName}</h4><p className="text-xs text-gray-400">{a.vehicle}</p></div><span className={`text-[10px] px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusColor(a.status)}`}>{apptStatusLabel(a.status, lang)}</span></div>
        <p className="text-xs text-gray-500 mb-3">{a.issue}</p>
        {a.issuePhotos && a.issuePhotos.length > 0 && (<div className="flex gap-1.5 mb-3">{a.issuePhotos.map((src, i) => (<img key={i} src={src} className="w-12 h-12 rounded-lg object-cover border border-gray-100" />))}</div>)}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3"><span className="flex items-center gap-1"><Calendar size={12} />{a.date}</span><span className="flex items-center gap-1"><Clock size={12} />{a.time}</span></div>
        {cancellable && (
          <div className="flex items-center gap-3 text-[11px] text-rose-500 mb-3">
            <button onClick={() => downloadAppointmentIcs(a)} className="flex items-center gap-1 hover:underline"><CalendarDays size={12} /> {t("addToCalendarBtn")}</button>
            {mechanicDirectionsUrl(a.mechanicId) && (<a href={mechanicDirectionsUrl(a.mechanicId)} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline"><Navigation size={12} /> {t("directionsLabel")}</a>)}
          </div>
        )}
        <StatusTracker status={a.status} autoAccepted={a.autoAccepted} />
        {a.depositPaid > 0 && (<p className="text-[11px] text-green-600 mt-2 flex items-center gap-1"><CheckCircle2 size={11} /> {t("depositPaidDemoNote", { amount: String(a.depositPaid) })}</p>)}
        {a.paymentMethod === "onsite" && (<p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1"><Banknote size={11} /> {t("paymentOnsiteNote")}</p>)}
        {a.warrantyEndDate && (<p className="text-[11px] text-gray-500 mt-2 flex items-center gap-1"><Shield size={11} className="text-green-500 flex-shrink-0" /> {t("warrantyUntilNote", { date: new Date(a.warrantyEndDate).toLocaleDateString("tr-TR") })}</p>)}
        {a.status === "Tamir Tamamlandı" && !a.reviewed && (<button onClick={() => { setReviewingApptId(a.id); setReviewForm({ rating: 5, comment: "" }); }} className="w-full mt-3 border border-gray-300 text-gray-700 text-xs py-2 rounded-xl font-medium hover:bg-gray-100 transition flex items-center justify-center gap-1"><Star size={12} /> {t("writeReviewTitle")}</button>)}
        {a.status === "Tamir Tamamlandı" && a.reviewed && (<p className="mt-3 text-[11px] text-green-600 flex items-center gap-1 justify-center"><CheckCircle2 size={12} /> {t("reviewSubmittedNotice")}</p>)}
        {a.status === "Tamir Tamamlandı" && (<div className="flex gap-2 mt-2"><button onClick={() => rebookAppt(a)} className="flex-1 bg-rose-50 text-rose-600 text-xs py-2 rounded-xl font-medium hover:bg-rose-100 transition flex items-center justify-center gap-1"><Calendar size={12} /> {t("rebookApptBtn")}</button><button onClick={() => downloadAppointmentReceipt(a)} className="flex-1 border border-gray-200 text-gray-600 text-xs py-2 rounded-xl font-medium hover:bg-gray-50 transition flex items-center justify-center gap-1"><FileText size={12} /> {t("downloadReceiptBtn")}</button></div>)}
        {cancellable && !isRescheduling && (<div className="flex gap-2 mt-3"><button onClick={() => startReschedule(a)} className="flex-1 border border-rose-200 text-rose-600 text-xs py-2 rounded-xl font-medium hover:bg-rose-50 transition">{t("reschedule")}</button><button onClick={() => setConfirmDialog({ title: t("cancelApptConfirmTitle"), body: t("cancelApptConfirmBody"), confirmLabel: t("cancelApptConfirmLabel"), danger: true, onConfirm: () => cancelOwnAppt(a.id) })} className="flex-1 border border-red-200 text-red-500 text-xs py-2 rounded-xl font-medium hover:bg-red-50 transition">{t("cancelAppt")}</button></div>)}
        {isRescheduling && (() => {
          // ÖNEMLİ: önce mechanicId ile eşleştir — isimle eşleştirme (eski davranış) bir tamirci
          // işletme adını değiştirdiğinde ya da iki tamirci aynı adı taşıdığında YANLIŞ tamirciyi
          // (ya da hiçbirini) bulup "her gün kapalı" göstererek yeniden randevu almayı imkansız
          // kılabiliyordu. Eski/seed kayıtlar için isimle eşleştirme geriye dönük uyumluluk amacıyla korunuyor.
          const mech = mechanicsList.find(m => m.id === a.mechanicId) || mechanicsList.find(m => m.name === a.mechanicName) || { id: -1 };
          return (
          <div className="mt-3 bg-white border border-gray-200 rounded-xl p-3">
            <div className="flex gap-2 mb-2 overflow-x-auto pb-1">{nextDays.map((d, i) => { const isSel = rescheduleDate?.toDateString() === d.toDateString(); const open = isDayOpenForMechanic(mech, d); return (<button key={i} disabled={!open} onClick={() => setRescheduleDate(d)} className={`flex-shrink-0 w-12 py-1.5 rounded-lg border text-center transition ${!open ? "opacity-30 cursor-not-allowed" : isSel ? "bg-rose-600 border-rose-600 text-white" : "border-gray-200 text-gray-600"}`}><p className="text-[9px]">{d.toLocaleDateString("tr-TR", { weekday: "short" })}</p><p className="text-xs font-bold">{d.getDate()}</p></button>); })}</div>
            {rescheduleDate && (<div className="grid grid-cols-4 gap-1.5 mb-2">{slotsForDate(mech, rescheduleDate).map(tm => (<button key={tm} onClick={() => setRescheduleTime(tm)} className={`py-1.5 rounded-lg border text-[11px] font-medium transition ${rescheduleTime === tm ? "bg-rose-600 border-rose-600 text-white" : "border-gray-200 text-gray-600"}`}>{tm}</button>))}{slotsForDate(mech, rescheduleDate).length === 0 && <p className="col-span-4 text-[11px] text-gray-400 text-center py-2">{t("bookingClosedDay")}</p>}</div>)}
            <div className="flex gap-2"><button onClick={() => setReschedulingApptId(null)} className="flex-1 text-xs py-2 rounded-lg border border-gray-200 text-gray-500">{t("cancel")}</button><button disabled={!rescheduleDate || !rescheduleTime} onClick={confirmReschedule} className="flex-1 text-xs py-2 rounded-lg bg-rose-600 text-white disabled:opacity-40">{t("save")}</button></div>
          </div>
        ); })()}
      </div>
    );
  }
