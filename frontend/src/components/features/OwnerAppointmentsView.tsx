import { Calendar, CheckCircle2, ChevronRight, ClipboardList, Plus } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";
import { AppointmentCard } from "./AppointmentCard";
import { TranslatedText } from "./TranslatedText";

export function OwnerAppointmentsView() {
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
  return (
    <div>
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
        <button onClick={() => setOwnerApptView("active")} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${ownerApptView === "active" ? "bg-white shadow-sm text-rose-600" : "text-gray-400"}`}>Aktif ({activeAppts.length})</button>
        <button onClick={() => setOwnerApptView("quotes")} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${ownerApptView === "quotes" ? "bg-white shadow-sm text-rose-600" : "text-gray-400"}`}><ClipboardList size={12} /> Teklifler {quoteRequests.filter(r => r.status === "open").length > 0 && (<span className="w-1.5 h-1.5 rounded-full bg-rose-600" />)}</button>
        <button onClick={() => setOwnerApptView("history")} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${ownerApptView === "history" ? "bg-white shadow-sm text-rose-600" : "text-gray-400"}`}><Calendar size={12} /> Geçmiş</button>
      </div>
      {ownerApptView === "active" && (<div className="space-y-3">{activeAppts.map(a => (<AppointmentCard key={a.id} a={a} />))}{activeAppts.length === 0 && <p className="text-center text-gray-400 text-sm py-10">Aktif randevunuz yok</p>}</div>)}
      {ownerApptView === "quotes" && (
        <div className="space-y-3">
          <button onClick={() => setShowQuoteModal(true)} className="w-full border-2 border-dashed border-rose-200 rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-rose-600 text-xs font-medium hover:bg-rose-50 transition"><Plus size={14} /> Yeni Teklif İsteği</button>
          {quoteRequests.length === 0 && <p className="text-center text-gray-400 text-sm py-10">Henüz teklif isteğiniz yok</p>}
          {quoteRequests.map(req => {
            const offers = quoteOffers.filter(o => o.requestId === req.id);
            const isOpen = expandedQuoteReqId === req.id;
            const submittedCount = offers.filter(o => o.status === "submitted").length;
            return (
              <div key={req.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <button onClick={() => setExpandedQuoteReqId(isOpen ? null : req.id)} className="w-full flex items-center justify-between p-3.5">
                  <div className="text-left min-w-0 flex-1"><p className="text-sm font-semibold text-gray-800 truncate">{req.issue}</p><p className="text-[11px] text-gray-400 mt-0.5">{req.vehicle} · {offers.length} tamirci{req.status === "open" ? ` · ${submittedCount} teklif geldi` : " · kapandı"}</p></div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-medium flex-shrink-0 ml-2 ${req.status === "open" ? "bg-rose-50 text-rose-600" : "bg-gray-100 text-gray-400"}`}>{req.status === "open" ? "Açık" : "Kapandı"}</span>
                  <ChevronRight size={14} className={`text-gray-300 transition-transform flex-shrink-0 ml-2 ${isOpen ? "rotate-90" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-3.5 pb-3.5 border-t border-gray-50 pt-3 space-y-2">
                    {offers.sort((a, b) => (a.price || 999999) - (b.price || 999999)).map(o => (
                      <div key={o.id} className={`rounded-xl p-3 border ${o.status === "accepted" ? "border-green-200 bg-green-50" : "border-gray-100 bg-gray-50"}`}>
                        <div className="flex items-center justify-between mb-1"><div className="flex items-center gap-2 min-w-0"><span className="text-lg flex-shrink-0">{o.mechanicImg}</span><p className="text-xs font-semibold text-gray-800 truncate">{o.mechanicName}</p></div>{o.status === "submitted" && req.status === "open" && (<button onClick={() => acceptQuoteOffer(req.id, o.id)} className="flex-shrink-0 bg-rose-600 text-white text-[10px] px-2.5 py-1.5 rounded-lg font-medium hover:bg-rose-700 transition">Kabul Et</button>)}{o.status === "accepted" && (<span className="flex-shrink-0 text-[10px] text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 size={11} /> Kabul edildi</span>)}{o.status === "lost" && (<span className="flex-shrink-0 text-[10px] text-gray-400">Seçilmedi</span>)}{o.status === "pending" && (<span className="flex-shrink-0 text-[10px] text-amber-500">Yanıt bekleniyor</span>)}</div>
                        {o.status === "submitted" || o.status === "accepted" ? (<div className="flex items-center gap-3 text-[11px] text-gray-500"><span className="font-bold text-gray-800">{o.price}₺</span>{o.etaDays && <span>· {o.etaDays} gün</span>}{o.note && <span className="truncate">· <TranslatedText id={`quoteoffer-note-${o.id}`} text={o.note} fromLang={mechanicsList.find(m => m.id === o.mechanicId)?.lang || "tr"} viewerLang={ownerLang} compact /></span>}</div>) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {ownerApptView === "history" && (
        <div className="space-y-2">
          {historyByDate.length === 0 && <p className="text-center text-gray-400 text-sm py-10">Henüz tamamlanan randevu yok</p>}
          {historyByDate.map(([date, items]) => {
            const isOpen = ownerHistoryExpandedDate === date;
            const completedCount = items.filter(i => i.status === "Tamir Tamamlandı").length;
            return (
              <div key={date} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <button onClick={() => setOwnerHistoryExpandedDate(isOpen ? null : date)} className="w-full flex items-center justify-between p-3">
                  <div className="flex items-center gap-2"><div className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center"><Calendar size={15} className="text-gray-400" /></div><div className="text-left"><p className="text-sm font-semibold text-gray-700">{date}</p><p className="text-[10px] text-gray-400">{completedCount} tamamlanan · {items.length} kayıt</p></div></div>
                  <ChevronRight size={14} className={`text-gray-300 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                </button>
                {isOpen && (<div className="px-3 pb-3 border-t border-gray-50 pt-3 space-y-3">{items.map(a => (<AppointmentCard key={a.id} a={a} />))}</div>)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
