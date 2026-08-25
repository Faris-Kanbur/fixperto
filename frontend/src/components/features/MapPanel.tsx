import { PriceLevelDots } from "../ui/PriceLevelDots";
import { Compass, Navigation, Star, X } from "lucide-react";
import { useState } from "react";
import { useApp } from "../../app/state/AppLogicProvider";
import { priceLevel, isImgUrl } from "../../utils/helpers";

export function MapPanel({ className, items, onPick, hoveredId = null, onHoverItem = undefined, previewItem: previewItemProp = undefined, onPreviewChange = undefined }) {
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

    const isControlled = onPreviewChange !== undefined;
    const [localPreviewItem, setLocalPreviewItem] = useState(null);
    const previewItem = isControlled ? previewItemProp : localPreviewItem;
    const setPreviewItem = isControlled ? onPreviewChange : setLocalPreviewItem;
    const isListing = (it) => it && it.brand !== undefined;
    return (
    <div className={`rounded-2xl border border-gray-200 relative ${className}`}>
      <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{ backgroundColor: "#eaf0e4" }}>
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <ellipse cx="88%" cy="12%" rx="70" ry="55" fill="#aee1f7" opacity="0.9" />
          <ellipse cx="8%" cy="85%" rx="60" ry="45" fill="#c8e6c9" opacity="0.7" />
          <ellipse cx="70%" cy="80%" rx="45" ry="30" fill="#c8e6c9" opacity="0.5" />
        </svg>
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <line x1="0" y1="28%" x2="100%" y2="24%" stroke="#ffffff" strokeWidth="7" />
          <line x1="0" y1="62%" x2="100%" y2="68%" stroke="#ffffff" strokeWidth="6" />
          <line x1="22%" y1="0" x2="18%" y2="100%" stroke="#ffffff" strokeWidth="5" />
          <line x1="66%" y1="0" x2="72%" y2="100%" stroke="#ffffff" strokeWidth="8" />
          <line x1="66%" y1="0" x2="72%" y2="100%" stroke="#ffd580" strokeWidth="3" strokeDasharray="10 6" />
          <line x1="0" y1="45%" x2="45%" y2="100%" stroke="#ffffff" strokeWidth="4" />
        </svg>
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: "linear-gradient(#c9cfc1 1px, transparent 1px), linear-gradient(90deg, #c9cfc1 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
        <div style={{ left: "50%", top: "50%" }} className="absolute -translate-x-1/2 -translate-y-1/2 z-10"><div className="w-4 h-4 bg-rose-600 rounded-full ring-4 ring-rose-200 border-2 border-white shadow" /><div className="absolute inset-0 w-4 h-4 bg-rose-500 rounded-full animate-ping opacity-40" /></div>
        {items.map(m => { const active = hoveredId === m.id || previewItem?.id === m.id; return (
          <button key={m.id} type="button" onClick={() => setPreviewItem(m)} onMouseEnter={() => onHoverItem && onHoverItem(m.id)} onMouseLeave={() => onHoverItem && onHoverItem(null)} style={{ left: `${m.px}%`, top: `${m.py}%` }} className={`absolute -translate-x-1/2 -translate-y-full flex flex-col items-center transition-transform cursor-pointer ${active ? "z-30 scale-125" : "z-10"}`}>
            <div className={`shadow-lg rounded-full px-2.5 py-1 text-[11px] font-bold border transition whitespace-nowrap mb-0.5 flex items-center gap-1 ${active ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-700 border-gray-100"}`}>{isListing(m) ? m.price : (<>{m.reviews > 100 && (<><span>{"€".repeat(priceLevel(m.price))}</span><span className={active ? "text-white/60" : "text-gray-300"}>·</span></>)}<span className="flex items-center gap-0.5"><Star size={9} className={active ? "fill-white text-white" : "fill-gray-900 text-gray-900"} />{m.rating}</span></>)}</div>
            <svg width="26" height="32" viewBox="0 0 24 30" className="drop-shadow-md">
              <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 18 12 18s12-9 12-18c0-6.6-5.4-12-12-12z" fill={active ? "#c0281c" : "#ea4335"} />
              <circle cx="12" cy="12" r="6.5" fill="white" />
            </svg>
          </button>
        ); })}
        <div className="absolute right-2 bottom-2 flex flex-col bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 z-20">
          <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-lg font-bold border-b border-gray-100">+</button>
          <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-lg font-bold">−</button>
        </div>
        <div className="absolute right-2 top-2 flex flex-col gap-1.5 z-20">
          <div className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-100"><Compass size={14} className="text-gray-500" /></div>
          <div className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-100"><Navigation size={13} className="text-rose-600" /></div>
        </div>
        <div className="absolute bottom-1 left-2 text-[9px] text-gray-400/80 z-20">Örnek harita verisi</div>
      </div>
      {previewItem && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-3 z-40 w-[88%] max-w-[280px]">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-3 flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">{isImgUrl(previewItem.photo) ? <img src={previewItem.photo} className="w-full h-full object-cover" /> : (previewItem.photo || previewItem.img)}</div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-800 text-xs truncate">{isListing(previewItem) ? `${previewItem.brand} ${previewItem.model}` : previewItem.name}</h4>
              <p className="text-rose-700 font-bold text-xs">{isListing(previewItem) ? previewItem.price : <PriceLevelDots price={previewItem.price} />}</p>
              {!isListing(previewItem) && <p className="text-[10px] text-gray-400 flex items-center gap-1"><Star size={10} className="text-gray-900 fill-gray-900" />{previewItem.rating} ({previewItem.reviews})</p>}
              <button onClick={() => { const item = previewItem; setPreviewItem(null); onPick(item); }} className="text-[10px] text-rose-600 font-medium hover:underline mt-0.5">Detayları Gör →</button>
            </div>
            <button onClick={() => setPreviewItem(null)} aria-label="Kapat" className="text-gray-300 hover:text-gray-500 flex-shrink-0 self-start p-2 -m-2"><X size={14} /></button>
          </div>
        </div>
      )}
    </div>
    );
  }
