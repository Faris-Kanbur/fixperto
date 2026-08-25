import { PriceLevelDots } from "../ui/PriceLevelDots";
import { BadgeCheck, Banknote, Briefcase, Calendar, Car, ChevronLeft, ChevronRight, Clock, Flag, Image as ImageIcon, MapPin, MessageCircle, Navigation, Star, ThumbsUp, Users, Wrench as ToolIcon, Zap } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";
import { MapPanel } from "./MapPanel";
import { ListingCard } from "./ListingCard";
import { JobCard } from "./JobCard";
import { BANNER_PRESETS, MY_MECHANIC_ID } from "../../data/constants";
import { formatHoursText, isImgUrl } from "../../utils/helpers";

export function MechDetailBody() {
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
    <>
      <style>{`@keyframes reviewScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } } .review-track { animation: reviewScroll 28s linear infinite; } .review-track:hover { animation-play-state: paused; }`}</style>
      <div className="relative">
        <button onClick={() => { if (mapDetailOpen) { setMapDetailOpen(false); } else { setScreen(detailReturnScreen || (role === "mechanic" ? "mechBrowse" : "owner")); setDetailReturnScreen(null); } }} className="absolute top-4 left-4 z-10 w-9 h-9 bg-black/30 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-black/50 transition"><ChevronLeft size={18} /></button>
        {selectedMechanic.rating >= 4.7 && <span className="absolute top-4 right-4 z-10 bg-white/95 text-gray-700 text-[10px] font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1"><BadgeCheck size={12} /> Öne Çıkan</span>}
        <div className={`h-36 bg-gradient-to-br ${BANNER_PRESETS[selectedMechanic.bannerPreset] || BANNER_PRESETS.blue} relative overflow-hidden`} style={selectedMechanic.coverPhoto ? { backgroundImage: `url(${selectedMechanic.coverPhoto})`, backgroundSize: "cover", backgroundPosition: "center" } : {}} />
        <div className="absolute -bottom-8 left-5 w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center text-4xl border-4 border-white overflow-hidden">{selectedMechanic.img}</div>
      </div>
      <div className="pt-10 px-5 md:px-8">
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-1.5">{selectedMechanic.name}{selectedMechanic.verified && <BadgeCheck size={16} className="text-rose-500 flex-shrink-0" />}</h1><p className="text-sm text-gray-400">{selectedMechanic.specialty} <span className="text-gray-300">· Tamirci No: #{selectedMechanic.id}</span></p>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap"><span className="flex items-center gap-1"><Star size={12} className="text-gray-900 fill-gray-900" />{selectedMechanic.rating} ({selectedMechanic.reviews})</span><span className="flex items-center gap-1"><MapPin size={12} />{getEffectiveDistance(selectedMechanic).toFixed(1)} km</span>{(() => { const open = mechanicOpenStatus(selectedMechanic); return open === null ? null : (<span className={`px-2 py-0.5 rounded-full font-medium ${open ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>{open ? "Şu an açık" : "Şu an kapalı"}</span>); })()}{selectedMechanic.avgResponseMinutes && <span className="flex items-center gap-1 text-gray-400"><Zap size={12} className="text-gray-900" /> Ort. {selectedMechanic.avgResponseMinutes} dk yanıt</span>}</div>
        {selectedMechanic.verified && <p className="text-[11px] text-rose-600 mt-1.5 flex items-center gap-1"><BadgeCheck size={12} className="flex-shrink-0" /> Kimliği ve işletme bilgileri doğrulandı</p>}
        {role !== "mechanic" && (<button onClick={() => { setMapDetailOpen(false); setShowMapMobile(false); setScreen("booking"); }} className="w-full mt-4 bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition shadow-md shadow-rose-200 flex items-center justify-center gap-2"><Calendar size={16} /> {t("bookNow")}</button>)}
      </div>
      <div className="flex-1 overflow-y-auto mt-4">
        <div className="px-5 md:px-8">
          <div className="grid grid-cols-3 gap-2 mb-4"><div className="bg-white border border-gray-200 rounded-xl p-3 text-center"><MapPin size={16} className="mx-auto mb-1 text-rose-500" /><p className="text-xs text-gray-500">{t("distance")}</p><p className="text-sm font-bold text-gray-800">{getEffectiveDistance(selectedMechanic).toFixed(1)} km</p></div><div className="bg-white border border-gray-200 rounded-xl p-3 text-center"><Star size={16} className="mx-auto mb-1 text-gray-900" /><p className="text-xs text-gray-500">{t("rating")}</p><p className="text-sm font-bold text-gray-800">{selectedMechanic.rating}/5</p></div><div className="bg-white border border-gray-200 rounded-xl p-3 text-center"><Clock size={16} className="mx-auto mb-1 text-green-500" /><p className="text-xs text-gray-500">{t("price")}</p><p className="text-sm font-bold text-gray-800"><PriceLevelDots price={selectedMechanic.price} /></p></div></div>
          <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2"><Clock size={16} className="text-rose-500" /> {t("workingHours")}</h3>
          <div className="bg-white border border-gray-200 rounded-2xl p-3 mb-5 space-y-1">{(selectedMechanic.id === MY_MECHANIC_ID ? formatHoursText(mechanicHours) : selectedMechanic.hoursText || []).map((line, i) => { const isClosed = line.includes("Kapalı") || line.includes("Closed"); return (<div key={i} className="flex justify-between text-xs"><span className="text-gray-500">{line.split(":")[0]}</span><span className={isClosed ? "text-red-400" : "text-gray-700 font-medium"}>{line.split(/:(.+)/)[1]}</span></div>); })}</div>
          <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2"><Navigation size={16} className="text-rose-500" /> {t("location")}</h3>
          <div className="rounded-2xl overflow-hidden border border-gray-100 mb-5"><MapPanel className="h-28" items={[selectedMechanic]} onPick={() => {}} /><div className="p-3 bg-white"><p className="text-xs text-gray-600">{selectedMechanic.address}</p></div></div>
          <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2"><ToolIcon size={16} className="text-rose-500" /> {t("services")} <span className="text-gray-300 font-normal">({selectedMechanic.services.length})</span></h3>
          <div className="mb-5">
            <div className={selectedMechanic.services.length > 5 ? "max-h-56 overflow-y-auto pr-1 rounded-xl ring-1 ring-gray-100 p-1" : ""}>
              <div className="flex flex-col gap-2">{selectedMechanic.services.map((s, i) => (<div key={i} className="flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5"><span className="text-xs text-gray-700 flex items-center gap-1.5 min-w-0"><ToolIcon size={11} className="text-rose-400 flex-shrink-0" /><span className="truncate">{s.name}</span></span><span className="text-xs font-bold text-rose-600 whitespace-nowrap flex-shrink-0">{String(s.price || "").trim() || "Fiyata bakılacak"}</span></div>))}</div>
            </div>
            {selectedMechanic.services.length > 5 && <p className="text-center text-[10px] text-gray-300 mt-1.5 flex items-center justify-center gap-1"><ChevronRight size={10} className="rotate-90" /> Daha fazlası için kaydırın</p>}
          </div>
          <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2"><Users size={16} className="text-rose-500" /> {t("team")}</h3>
          <div className="flex gap-3 mb-5 overflow-x-auto pb-1">{selectedMechanic.staff.map((s, i) => { const grads = ["from-rose-400 to-rose-500", "from-gray-700 to-gray-900", "from-rose-500 to-rose-600", "from-gray-500 to-gray-700"]; return (<div key={i} className="flex-shrink-0 w-28 text-center bg-white border border-gray-100 rounded-2xl p-3 shadow-sm hover:shadow-md transition"><div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${grads[i % grads.length]} flex items-center justify-center text-2xl mb-2 overflow-hidden shadow-md relative`}>{isImgUrl(s.emoji) ? <img src={s.emoji} className="w-full h-full object-cover" /> : <span className="drop-shadow">{s.emoji}</span>}<span className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full" /></div><p className="text-[11px] font-semibold text-gray-700 leading-tight">{s.name}</p><p className="text-[10px] text-gray-400 leading-tight">{s.role}</p></div>); })}</div>
          {role !== "mechanic" && (() => {
            const mechListings = listings.filter(l => l.sellerType === "mechanic" && l.sellerName === selectedMechanic.name && !l.adminRemoved);
            const mechJobs = jobListings.filter(j => j.mechanicId === selectedMechanic.id);
            if (mechListings.length === 0 && mechJobs.length === 0) return null;
            return (
              <>
                {mechListings.length > 0 && (
                  <>
                    <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2"><Car size={16} className="text-rose-500" /> Araç İlanları <span className="text-gray-300 font-normal">({mechListings.length})</span></h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">{mechListings.map(l => (<ListingCard key={l.id} l={l} />))}</div>
                  </>
                )}
                {mechJobs.length > 0 && (
                  <>
                    <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2"><Briefcase size={16} className="text-rose-500" /> İş İlanları <span className="text-gray-300 font-normal">({mechJobs.length})</span></h3>
                    <div className="flex flex-col gap-2 mb-5">{mechJobs.map(j => (<JobCard key={j.id} j={j} />))}</div>
                  </>
                )}
              </>
            );
          })()}
          {role !== "mechanic" && (<><div className="bg-gray-100 border border-gray-200 rounded-2xl p-4 mb-4"><p className="text-xs text-gray-700 mb-3 flex items-center gap-2"><Banknote size={14} /> Randevu almadan önce fiyat teklifi isteyebilirsiniz.</p><button onClick={() => { setMapDetailOpen(false); setShowMapMobile(false); openChatWithMechanic(selectedMechanic); }} className="w-full bg-white border border-gray-300 text-gray-700 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-100 transition flex items-center justify-center gap-2"><MessageCircle size={16} /> {t("sendMessage")}</button></div><button onClick={() => { setMapDetailOpen(false); setShowMapMobile(false); setScreen("booking"); }} className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition mb-3">{t("bookDirect")}</button><button onClick={() => { setMapDetailOpen(false); setShowMapMobile(false); openReportForm("quality", `Tamirci #${selectedMechanic.id} · ${selectedMechanic.name}`, `"${selectedMechanic.name}" hakkında şikayetim var`); }} className="w-full flex items-center justify-center gap-1.5 text-[11px] text-gray-400 hover:text-red-500 transition py-1 mb-6"><Flag size={11} /> Bu tamirciyi şikayet et</button></>)}
        </div>
        <div className="border-t border-gray-100 pt-4 pb-6 bg-gray-50/50">
          <div className="flex items-center justify-between px-5 md:px-8 mb-3"><h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Star size={16} className="text-gray-900 fill-gray-900" /> {t("reviews")}</h3><span className={`text-xs flex items-center gap-1 font-medium ${darkMode ? "text-white" : "text-gray-400"}`}>{selectedMechanic.rating} <Star size={11} className="text-gray-900 fill-gray-900" /> · {selectedMechanic.reviews} değerlendirme</span></div>
          <div className="overflow-hidden"><div className="flex gap-3 w-max review-track px-5 md:px-8">{[...selectedMechanic.reviewList, ...selectedMechanic.reviewList].map((r, i) => { const grads = ["from-rose-400 to-rose-500", "from-gray-700 to-gray-900", "from-rose-500 to-rose-600", "from-gray-500 to-gray-700"]; const times = ["2 gün önce", "1 hafta önce", "3 hafta önce", "1 ay önce", "2 ay önce"]; return (
            <div key={i} className="w-60 flex-shrink-0 bg-white border border-gray-100 rounded-2xl p-3.5 shadow-sm">
              <div className="flex items-center gap-2.5 mb-2"><div className={`w-10 h-10 rounded-full bg-gradient-to-br ${grads[i % grads.length]} flex items-center justify-center text-lg flex-shrink-0 shadow-sm`}>{r.avatar}</div><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-gray-800 truncate">{r.name}</p><p className="text-[10px] text-gray-400">{times[i % times.length]}</p></div><BadgeCheck size={14} className="text-rose-400 flex-shrink-0" /></div>
              <div className="flex items-center gap-0.5 mb-2">{[...Array(5)].map((_, j) => (<Star key={j} size={12} className={j < r.rating ? "text-gray-900 fill-gray-900" : "text-gray-200 fill-gray-200"} />))}</div>
              {r.photo && <div className="w-full h-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-2xl mb-2"><ImageIcon size={22} className="text-gray-400" /></div>}
              <p className="text-[11px] text-gray-500 leading-snug">{r.comment}</p>
              {r.reply && (<div className="mt-2 pt-2 border-t border-gray-50 bg-gray-50 rounded-lg p-2"><p className="text-[9px] font-bold text-gray-500 mb-0.5">İşletme yanıtı</p><p className="text-[10px] text-gray-500 leading-snug">{r.reply}</p></div>)}
              {!r.reply && role === "mechanic" && selectedMechanic.id === MY_MECHANIC_ID && (
                replyingReviewId === r.id ? (
                  <div className="mt-2 pt-2 border-t border-gray-50">
                    <textarea value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} rows={2} placeholder="Yanıtınızı yazın..." className="w-full text-[10px] border border-gray-200 rounded-lg p-1.5 mb-1 resize-none" />
                    <div className="flex gap-1"><button onClick={() => { setReplyingReviewId(null); setReplyDraft(""); }} className="flex-1 text-[9px] py-1 rounded-lg border border-gray-200 text-gray-500">Vazgeç</button><button onClick={() => submitMechanicReply(selectedMechanic.id, r.id)} className="flex-1 text-[9px] py-1 rounded-lg bg-rose-600 text-white">Gönder</button></div>
                  </div>
                ) : (<button onClick={() => { setReplyingReviewId(r.id); setReplyDraft(""); }} className="mt-2 text-[9px] text-rose-600 font-semibold">Yanıtla</button>)
              )}
              <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-gray-50"><ThumbsUp size={11} className="text-gray-300" /><span className="text-[10px] text-gray-300">Faydalı</span></div>
            </div>
          ); })}</div></div>
        </div>
      </div>
    </>
  );
}
