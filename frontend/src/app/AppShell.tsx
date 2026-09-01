import { useApp } from "./state/AppLogicProvider";
import { MONTH_ABBR_BY_LANG } from "../data/i18n";
import { Search, MapPin, Star, Clock, Calendar, ChevronLeft, Check, User, Wrench, Mail, Lock, Eye, EyeOff, Phone, Car, Plus, History, ChevronRight, CircleDot, CheckCircle2, MessageCircle, Image as ImageIcon, Send, Globe, Banknote, ClipboardList, Settings, Bell, X, ThumbsUp, ThumbsDown, Users, Wrench as ToolIcon, Navigation, Pencil, Trash2, Save, SlidersHorizontal, Map as MapIcon, BadgeCheck, Camera, Gauge, Tag, Compass, Heart, Fuel, Cog, Zap, CalendarDays, Palette, Briefcase, GraduationCap, FileText, Paperclip, Shield, LayoutDashboard, LifeBuoy, LogOut, Ban, AlertTriangle, ShieldAlert, TrendingUp, Megaphone, Flag, Share2, CreditCard, Repeat, DoorOpen, PaintBucket, Leaf, Droplet, BatteryCharging, Download } from "lucide-react";
import { PriceLevelDots } from "../components/ui/PriceLevelDots";
import { MiniBarChart } from "../components/ui/MiniBarChart";
import { generateAnalyticsPdf } from "../utils/analyticsReport";
import { LangSwitch } from "../components/features/LangSwitch";
import { NotifBell } from "../components/features/NotifBell";
import { OwnerBottomNav } from "../components/features/OwnerBottomNav";
import { OwnerAppointmentsView } from "../components/features/OwnerAppointmentsView";
import { ChatBubble } from "../components/features/ChatBubble";
import { StatusTracker } from "../components/features/StatusTracker";
import { MechCard } from "../components/features/MechCard";
import { SkeletonCard } from "../components/features/SkeletonCard";
import { MapPanel } from "../components/features/MapPanel";
import { ListingCard } from "../components/features/ListingCard";
import { JobCard } from "../components/features/JobCard";
import { MechDetailBody } from "../components/features/MechDetailBody";
import { AppointmentCard } from "../components/features/AppointmentCard";
import { BrowseHome } from "../components/features/BrowseHome";
import { ShareButton } from "../components/features/ShareButton";
import { TranslatedText } from "../components/features/TranslatedText";
import { PhotoLightbox } from "../components/features/PhotoLightbox";
import {
  LEGAL_CONTENT, FREE_QUOTE_MECH_LIMIT, PREMIUM_QUOTE_MECH_LIMIT, BANNER_PRESETS,
  ONBOARDING_SLIDES, ADMIN_TICKET_TYPE_LABELS, ADMIN_TICKET_PRIORITY_LABELS,
  ADMIN_SLA_DAYS, ADMIN_TREND_DATA, PLATFORM_COMMISSION_RATE, DE_CITIES, TODAY_STR,
  REMINDER_KIND_LABELS, TRANSMISSIONS, FUEL_TYPES, EMPLOYMENT_TYPES, EXPERIENCE_LEVELS,
  MY_MECHANIC_ID, MY_OWNER_ID, DAY_KEYS, DAY_LABELS_FULL, DAY_LABELS_FULL_BY_LANG, SHARE_CHANNEL_LABELS,
  CAR_BRANDS, PAYMENT_METHOD_OPTIONS, LANG_LABELS, ATU_FIXED_CATALOG,
  BODY_TYPES, DRIVETRAIN_OPTIONS, DOOR_COUNT_OPTIONS, LISTING_FEATURE_OPTIONS,
  SEAT_COUNT_OPTIONS, EMISSION_CLASS_OPTIONS, ANALYTICS_RANGES,
  FUEL_TYPE_LABELS_BY_LANG, TRANSMISSION_LABELS_BY_LANG, BODY_TYPE_LABELS_BY_LANG,
  DRIVETRAIN_LABELS_BY_LANG, EMPLOYMENT_TYPE_LABELS_BY_LANG, EXPERIENCE_LEVEL_LABELS_BY_LANG,
} from "../data/constants";
import {
  ticketSlaBreached, ticketDaysOpen, initials, isValidEmail, validatePhone,
  computeReminders, isImgUrl, listingStatusMeta, isValidDateStr, listingCurrency,
  jobStatusMeta, parsePriceNumber, isFixedPriceService, statusColor, getDaySlots, dayClosingTime,
  imgFallbackHandler, imgThumb, apptStatusLabel, vocabLabel,
} from "../utils/helpers";

// AppShell: eskiden App.jsx'in return(...) bloğuydu. Tüm state/handler'lar
// artık useApp() üzerinden context'ten geliyor; JSX ve görünüm AYNI.
export function AppShell() {
  const {
    lang, setLang, t, screen, setScreen, role, setRole, showPass,
    setShowPass, forgotEmail, setForgotEmail, form, setForm, authError, setAuthError, ownerTab,
    setOwnerTab, ownerMode, setOwnerMode, ownerLang, setOwnerLang, ownerSettings, setOwnerSettings, mechSettings,
    setMechSettings, notifLog, setNotifLog, ownerNotifSeenAt, setOwnerNotifSeenAt, mechNotifSeenAt, setMechNotifSeenAt, showNotifPanel,
    setShowNotifPanel, darkMode, setDarkMode, ownerPhotoRef, ownerProfileTab, setOwnerProfileTab, showMapMobile, setShowMapMobile,
    hoveredPinId, setHoveredPinId, mapPreviewItem, setMapPreviewItem, showFilterModal, setShowFilterModal, filters, setFilters,
    listingFilters, setListingFilters, listingSort, setListingSort, userLocation, setUserLocation, locationStatus, setLocationStatus,
    notifPermission, setNotifPermission, favoriteIds, setFavoriteIds, toggleFavorite, mechanicsList, setMechanicsList, mechanicHours,
    setMechanicHours, query, setQuery, locationQuery, setLocationQuery, sortBy, setSortBy, sortDir,
    setSortDir, showLocationPrompt, setShowLocationPrompt, selectedMechanicId, setSelectedMechanicId, mapDetailOpen, setMapDetailOpen, openMapDetail,
    selectedDate, setSelectedDate, selectedTime, setSelectedTime, problemDesc, setProblemDesc, problemPhotos, setProblemPhotos,
    problemPhotoRef, addProblemPhoto, removeProblemPhoto, quotePhotoRef, addQuotePhoto, removeQuotePhoto, approveExpensiveService, setApproveExpensiveService,
    shareHistoryConsent, setShareHistoryConsent, bookingService, setBookingService, bookingServiceSearch, setBookingServiceSearch, selectedBookingVehicleId, setSelectedBookingVehicleId,
    paymentForm, setPaymentForm, reviewingApptId, setReviewingApptId, reviewForm, setReviewForm, showPasswordModal, setShowPasswordModal,
    legalModalTopic, setLegalModalTopic, detailReturnScreen, setDetailReturnScreen, passwordForm, setPasswordForm, showNewTicketForm, setShowNewTicketForm,
    newTicketForm, setNewTicketForm, showDeleteAccountModal, setShowDeleteAccountModal, confirmDialog, setConfirmDialog, deleteConfirmText, setDeleteConfirmText,
    ownerDangerZoneOpen, setOwnerDangerZoneOpen, mechDangerZoneOpen, setMechDangerZoneOpen, ownerNotifDetailsOpen, setOwnerNotifDetailsOpen, mechNotifDetailsOpen, setMechNotifDetailsOpen,
    ownerAccountOpen, setOwnerAccountOpen, mechAccountOpen, setMechAccountOpen, mechPaymentInfoOpen, setMechPaymentInfoOpen, reschedulingApptId, setReschedulingApptId,
    rescheduleDate, setRescheduleDate, rescheduleTime, setRescheduleTime, vehicles, setVehicles, selectedVehicleId, setSelectedVehicleId,
    selectedVehicle, showMaintenanceHistory, setShowMaintenanceHistory, showAddVehicle, setShowAddVehicle, newVehicle, setNewVehicle, editingReminderKind,
    setEditingReminderKind, reminderEditForm, setReminderEditForm, showAddReminderForm, setShowAddReminderForm, newReminderForm, setNewReminderForm, showEditVehicle,
    setShowEditVehicle, editVehicleForm, setEditVehicleForm, appointments, setAppointments, autoAccept, setAutoAccept, toast,
    setToast, successPulse, setSuccessPulse, showOnboarding, setShowOnboarding, onboardStep, setOnboardStep, showDayFullPrompt,
    setShowDayFullPrompt, dayFullNotified, setDayFullNotified, completingApptId, setCompletingApptId, warrantyDaysForm, setWarrantyDaysForm, replyingReviewId,
    setReplyingReviewId, replyDraft, setReplyDraft, onboardingVisible, smsLog, setSmsLog, conversations, setConversations,
    activeConvoId, setActiveConvoId, chatInput, setChatInput, showTranslated, setShowTranslated, fileInputRef, mechActiveConvoId,
    setMechActiveConvoId, mechChatInput, setMechChatInput, mechTab, setMechTab, mechProfileTab, setMechProfileTab, showAddServiceForm,
    setShowAddServiceForm, newServiceForm, setNewServiceForm, duplicateServiceWarning, setDuplicateServiceWarning, mechReqView, setMechReqView, mechAnalyticsView, analyticsRange, setAnalyticsRange,
    setMechAnalyticsView, expandedCustomerHistory, setExpandedCustomerHistory, historyExpandedDate, setHistoryExpandedDate, ownerApptView, setOwnerApptView, ownerHistoryExpandedDate,
    setOwnerHistoryExpandedDate, quoteRequests, setQuoteRequests, quoteOffers, setQuoteOffers, showQuoteModal, setShowQuoteModal, quoteVehicleId,
    setQuoteVehicleId, quoteIssue, setQuoteIssue, quotePhotos, setQuotePhotos, quoteSelectedMechIds, setQuoteSelectedMechIds, quoteMechSearch,
    setQuoteMechSearch, quotePremiumUnlocked, setQuotePremiumUnlocked, showQuotePremiumUpsell, setShowQuotePremiumUpsell, respondingQuoteOfferId, setRespondingQuoteOfferId, quoteOfferForm,
    setQuoteOfferForm, expandedQuoteReqId, setExpandedQuoteReqId, pendingQuoteAccept, setPendingQuoteAccept, coverFileRef, staffFileRefs, expandedDay,
    setExpandedDay, newSlotTime, setNewSlotTime, listings, setListings, showSellForm, setShowSellForm, showSellVehiclePicker,
    setShowSellVehiclePicker, sellForm, setSellForm, sellPhotoRef, selectedListingId, setSelectedListingId, selectedListingPhotoIndex, setSelectedListingPhotoIndex, listingLightboxOpen, setListingLightboxOpen, showOfferForm, setShowOfferForm,
    offerAmount, setOfferAmount, showListingMsgForm, setShowListingMsgForm, listingMsg, setListingMsg, jobListings, setJobListings,
    jobFilters, setJobFilters, selectedJobId, setSelectedJobId, showJobForm, setShowJobForm, jobForm, setJobForm,
    showJobApplyForm, setShowJobApplyForm, jobApplyMsg, setJobApplyMsg, jobApplyCv, setJobApplyCv, jobApplyInfo, setJobApplyInfo,
    myApplications, setMyApplications, cvFileRef, mechListingsSubTab, setMechListingsSubTab, adminAuthed, setAdminAuthed, adminForm,
    setAdminForm, adminError, setAdminError, adminLoginLoading, adminTab, setAdminTab, adminUserTypeFilter, setAdminUserTypeFilter, adminUserSearch,
    setAdminUserSearch, selectedAdminUser, setSelectedAdminUser, adminEditForm, setAdminEditForm, adminProfileViewUser, setAdminProfileViewUser, editingProfileField,
    setEditingProfileField, profileFieldDraft, setProfileFieldDraft, profilePasswordDraft, setProfilePasswordDraft, adminAnalyzeUserKey, setAdminAnalyzeUserKey, expandedAdminListingId,
    setExpandedAdminListingId, expandedAdminJobId, setExpandedAdminJobId, ownersDirectory, setOwnersDirectory, mechanicAdminOverrides, setMechanicAdminOverrides, ownerProfile,
    updateMyOwnerField, updateMyOwnerFields, supportTickets, setSupportTickets, apiReady, setApiReady, apiError, setApiError,
    adminTicketStatusFilter, setAdminTicketStatusFilter, adminTicketTypeFilter, setAdminTicketTypeFilter, adminTicketPriorityFilter, setAdminTicketPriorityFilter, adminTicketSearch, setAdminTicketSearch,
    adminTicketVisibleCount, setAdminTicketVisibleCount, showTicketAnalytics, setShowTicketAnalytics, selectedTicketId, setSelectedTicketId, adminTicketNote, setAdminTicketNote,
    adminReplyDraft, setAdminReplyDraft, showBroadcastModal, setShowBroadcastModal, broadcastForm, setBroadcastForm, broadcastLog, setBroadcastLog,
    adminChangeLog, setAdminChangeLog, fireSuccessPulse, getEffectiveDistance, requestLocation, handleSortClick, handleDistanceFilterClick, locationPromptDismissed, dismissLocationPrompt, confirmUseLocation, stopUsingLocation,
    requestNotifPermission, fireNotification, selectedMechanic, bookingServiceOptions, myProfile, selectedListing, allReminders, dismissedReminderKey,
    setDismissedReminderKey, browseScrollRef, heroCollapsed, setHeroCollapsed, goBookFromReminder, topReminder, notifiedReminderKeysRef, filtered,
    quoteFilteredMechanics, filteredListings, activeListingFilterCount, filteredJobs, activeJobFilterCount, selectedJob, myReviews, myApplicationRefs,
    activeFilterCount, nextDays, isSameMechanicAppt, customerNoShowCount, isMyOwnerAppt, activeAppts, historyByDate, slotsForDate,
    isDayOpenForMechanic, mechanicOpenStatus, goToAddSlotForToday, openDetail, rebookAppt, downloadAppointmentIcs, downloadMaintenanceReport, downloadAppointmentReceipt,
    mechanicDirectionsUrl, toggleQuoteMechanic, unlockQuotePremium, closeQuoteModal, submitQuoteRequest, submitQuoteOffer, acceptQuoteOffer, declineQuoteOffer, cancelQuoteRequest, EXPENSIVE_SERVICE_THRESHOLD,
    myQuoteOffers,
    confirmBooking, goHome, chooseRole, submitAdminLogin, adminLogout, ADMIN_FIELD_LABELS, adminFieldLabel, formatAdminHistoryValue,
    adminChangeTargetLabel, logAdminChange, applyAdminFieldChange, revertAdminChange, ADMIN_TARGET_TYPE_META, adminChangeLogGrouped, expandedHistoryGroups, setExpandedHistoryGroups, recordShare, shareStats, viewStats, myProfileViewStats, listingViewStats, listingFavoriteCount,
    toggleHistoryGroup, revertAdminChangeGroup, fieldEditSnapshotRef, trackFieldFocus, trackFieldBlurAndLog, trackInputProps, adminStats, adminAllUsers,
    adminFilteredUsers, openAdminUserEdit, saveAdminUserEdit, toggleAdminUserStatus, resetUserPassword, sendPasswordResetLink, openAdminProfileView, viewingUser,
    profileFieldOldValueRef, startEditProfileField, cancelEditProfileField, ADMIN_NUMERIC_PROFILE_FIELDS, saveProfileField, renderAdminProfileRow, toggleListingRemoved, updateListingField,
    updateMechService, removeMechService, addMechService, toggleJobListingStatus, updateJobField, renderAdminListingCard, renderAdminJobCard, openAdminAnalyze,
    analyzingUser, adminUserAnalytics, adminFilteredTickets, adminTicketAnalytics, selectedTicket, updateTicketStatus, saveTicketNote, issueTicketRefund,
    removeReportedListing, removeFlaggedReview, grantVerification, sendAdminReply, sendBroadcast, adminRegionBreakdown, adminRevenueStats,
    submitRegister, submitLogin, submitOtpVerify, cancelOtpVerify, logoutUser, otpCode, setOtpCode, authNotice, setAuthNotice, authLoading,
    addVehicle, updateVehicleFields, removeVehicle, saveReminderOverride, resetReminderOverride, submitNewReminder, updateCustomReminder, removeCustomReminder, acceptAppt,
    rejectAppt, markNoShow, advanceStatus, completeApptWithWarranty, cancelOwnAppt, startReschedule, confirmReschedule, submitReview,
    submitMechanicReply, deleteMyReview, closePasswordModal, submitPasswordChange, confirmDeleteAccount, openHelpInfo, mySupportTickets, submitSupportTicket,
    openReportForm, renderSupportView, openChatWithMechanic, openMechChatWithOwnerListing, activeConvo, sendOwnerMessage, handleFileSelect, sendOwnerMessageWithReply,
    toggleTranslate, mechConvo, sendMechMessage, updateMyField, updateMyPriceField, updateService, removeService, toggleServiceFixed, finalizeAddService,
    findMissingFixedPriceService, saveMyProfile, previewMyProfile, tryAddService, cancelAddService, uploadCoverPhoto, removeCoverPhoto, addStaff,
    updateStaffField, removeStaff, staffAvatarUpload, ownerPhotoUpload, toggleDayOpen, toggleSlotClosed, addExtraSlot, openSellForm,
    startSellFlow, pickVehicleToSell, pickOtherCarToSell, sellPhotoUpload, sellPhotosUpload, removeSellPhoto, MAX_LISTING_GALLERY_PHOTOS, toggleSellFeature, customFeatureInput, setCustomFeatureInput, addCustomFeature, showAllFeatureOptions, setShowAllFeatureOptions, toggleBrandServiced, customBrandInput, setCustomBrandInput, addCustomBrand, showAllBrandOptions, setShowAllBrandOptions, togglePaymentMethod, customPaymentInput, setCustomPaymentInput, addCustomPaymentMethod, showAllPaymentOptions, setShowAllPaymentOptions, notifyFavoriteWatchers, submitListing, setListingStatus, removeListing,
    myBuyerName, myBuyerId, isRealSellerOfListing, isMyListing, myPendingOfferOn, openOfferForm, submitOffer, submitListingMsg, respondOffer, markOffersSeen, clearListingFilters,
    gallerySelectedIds, setGallerySelectedIds, myListingsStats, toggleGallerySelect, listingDaysActive, bulkFeatureSelectedListings, bulkSetStatusSelectedListings, bulkDeleteSelectedListings,
    similarListings, listingPriceComparison, requestFeaturedListing, confirmFeaturedPurchase, showFeaturedUpsell, setShowFeaturedUpsell, FEATURED_LISTING_PRICE, FEATURED_LISTING_DAYS,
    clearJobFilters, openJobForm, submitJobListing, setJobListingStatus, removeJobListing, handleCvSelect, removeCv, closeJobApplyForm,
    openJobApplyForm, jobApplyPhoneCheck, jobApplyEmailValid, jobApplyInfoValid, jobApplyReady, submitJobApplication, rejectApplication, roleColor, ownerLangFor,
    roleBtn, goToNotifTarget,
    jobEmploymentColor,
  } = useApp();
  return (
    <div className={`min-h-screen flex justify-center relative ${darkMode ? "dark-scope bg-gray-950" : "bg-gray-50"}`}>
      {darkMode && (<style>{`
        .dark-scope { color-scheme: dark; }
        .dark-scope .bg-white { background-color: #17171f !important; }
        .dark-scope .bg-gray-50 { background-color: #121218 !important; }
        .dark-scope .bg-gray-100 { background-color: #20202b !important; }
        .dark-scope .bg-gray-200 { background-color: #2a2a38 !important; }
        .dark-scope .text-gray-900, .dark-scope .text-gray-800, .dark-scope .text-gray-700 { color: #e9e9f0 !important; }
        .dark-scope .text-gray-600, .dark-scope .text-gray-500 { color: #a3a3b8 !important; }
        .dark-scope .text-gray-400, .dark-scope .text-gray-300 { color: #71718c !important; }
        .dark-scope .border-gray-100, .dark-scope .border-gray-200, .dark-scope .border-gray-300 { border-color: #2c2c3a !important; }
        .dark-scope .divide-gray-100 > * + * { border-color: #2c2c3a !important; }
        .dark-scope input, .dark-scope select, .dark-scope textarea { background-color: #14141b !important; color: #e9e9f0 !important; border-color: #2c2c3a !important; }
        .dark-scope input::placeholder, .dark-scope textarea::placeholder { color: #63637a !important; }
        .dark-scope .shadow-sm, .dark-scope .shadow-lg, .dark-scope .shadow-xl, .dark-scope .shadow-2xl { box-shadow: 0 1px 2px rgba(0,0,0,0.4) !important; }
        .dark-scope ::-webkit-scrollbar-thumb { background-color: #34344a; }
        .dark-scope [class*="from-rose-50"][class*="to-white"] { background-image: none !important; background-color: #17171f !important; }
        .dark-scope .bg-red-50 { background-color: #2a1418 !important; }
        .dark-scope .bg-red-100 { background-color: #3a1a20 !important; }
        .dark-scope .border-red-100, .dark-scope .border-red-200, .dark-scope .border-red-300 { border-color: #4a2530 !important; }
        .dark-scope .bg-green-50 { background-color: #12241a !important; }
        .dark-scope .bg-green-100 { background-color: #163322 !important; }
        .dark-scope .border-green-100, .dark-scope .border-green-200 { border-color: #1f4632 !important; }
        .dark-scope .bg-amber-50 { background-color: #2a2212 !important; }
        .dark-scope .bg-amber-100 { background-color: #3a2f16 !important; }
        .dark-scope .border-amber-100, .dark-scope .border-amber-200 { border-color: #4a3d1e !important; }
        .dark-scope .bg-rose-50 { background-color: #2a141c !important; }
        .dark-scope .bg-rose-100 { background-color: #3a1a28 !important; }
        .dark-scope .border-rose-100, .dark-scope .border-rose-200 { border-color: #4a2538 !important; }
      `}</style>)}
      <style>{`
        @keyframes micro-pop { 0% { transform: scale(0.4); opacity: 0; } 60% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes micro-fade-out { 0%, 75% { opacity: 1; } 100% { opacity: 0; } }
        .success-pulse-badge { animation: micro-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, micro-fade-out 1.4s ease forwards; }
        button:not(:disabled):active { transform: scale(0.96); }
        button { transition: transform 0.12s ease, background-color 0.15s ease, opacity 0.15s ease; }
      `}</style>
      {toast && (<div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md"><div className={`rounded-2xl shadow-lg p-3 flex items-start gap-2 text-xs ${toast.type === "sms" ? "bg-green-600 text-white" : "bg-gray-800 text-white"}`}><Bell size={16} className="flex-shrink-0 mt-0.5" /><span className="flex-1">{toast.text}</span><button onClick={() => setToast(null)} aria-label={t("dismissToastAria")} className="p-2 -m-2"><X size={14} /></button></div></div>)}
      {successPulse && (<div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none"><div className="success-pulse-badge bg-white rounded-3xl shadow-2xl px-6 py-5 flex flex-col items-center gap-2"><div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center"><Check size={30} className="text-green-500" strokeWidth={3} /></div><p className="text-sm font-semibold text-gray-800 text-center max-w-[220px]">{successPulse}</p></div></div>)}
      {showDayFullPrompt && role === "mechanic" && (
        <div className="fixed inset-0 bg-black/40 z-[90] flex items-center justify-center p-4" style={{ zIndex: 9000 }} onClick={() => setShowDayFullPrompt(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-5">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-3"><Calendar size={22} className="text-red-500" /></div>
            <h3 className="font-bold text-gray-900 text-base mb-1">{t("dayFullPromptTitle")}</h3>
            <p className="text-sm text-gray-500 mb-4">{t("dayFullPromptBody")}</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDayFullPrompt(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">{t("dayFullPromptNoBtn")}</button>
              <button onClick={goToAddSlotForToday} className="flex-1 bg-rose-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-rose-700 transition">{t("dayFullPromptYesBtn")}</button>
            </div>
          </div>
        </div>
      )}
      {completingApptId && (
        <div className="fixed inset-0 bg-black/40 z-[90] flex items-center justify-center p-4" style={{ zIndex: 9000 }} onClick={() => { setCompletingApptId(null); setWarrantyDaysForm(""); }}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-5">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-3"><CheckCircle2 size={22} className="text-green-600" /></div>
            <h3 className="font-bold text-gray-900 text-base mb-1">{t("completeApptModalTitle")}</h3>
            <p className="text-sm text-gray-500 mb-3">{t("completeApptModalBody")}</p>
            <label className="text-xs font-medium text-gray-600 mb-1 block">{t("warrantyDaysLabel")}</label>
            <input type="number" min="0" value={warrantyDaysForm} onChange={(e) => setWarrantyDaysForm(e.target.value)} placeholder={t("warrantyDaysPlaceholder")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm mb-4" />
            <div className="flex gap-2">
              <button onClick={() => { setCompletingApptId(null); setWarrantyDaysForm(""); }} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">{t("giveUpBtn")}</button>
              <button onClick={() => completeApptWithWarranty(warrantyDaysForm)} className="flex-1 bg-rose-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-rose-700 transition">{t("completeApptBtn")}</button>
            </div>
          </div>
        </div>
      )}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/40 z-[90] flex items-center justify-center p-4" style={{ zIndex: 9800 }} onClick={() => setConfirmDialog(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${confirmDialog.danger ? "bg-red-50" : "bg-rose-50"}`}><AlertTriangle size={22} className={confirmDialog.danger ? "text-red-500" : "text-rose-600"} /></div>
            <h3 className="font-bold text-gray-900 text-base mb-1">{confirmDialog.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{confirmDialog.body}</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDialog(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">{t("giveUpBtn")}</button>
              <button onClick={() => { const fn = confirmDialog.onConfirm; setConfirmDialog(null); fn(); }} className={`flex-1 text-white py-2.5 rounded-xl font-semibold text-sm transition ${confirmDialog.danger ? "bg-red-500 hover:bg-red-600" : "bg-rose-600 hover:bg-rose-700"}`}>{confirmDialog.confirmLabel || t("confirmBtnDefault")}</button>
            </div>
          </div>
        </div>
      )}
      {showLocationPrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" style={{ zIndex: 9600 }} onClick={dismissLocationPrompt}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-5">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-3"><MapPin size={22} className="text-rose-600" /></div>
            <h3 className="font-bold text-gray-900 text-base mb-1">{t("locationPromptTitle")}</h3>
            <p className="text-sm text-gray-500 mb-4">{t("locationPromptBody")}</p>
            <div className="flex gap-2">
              <button onClick={dismissLocationPrompt} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">{t("notNowBtn")}</button>
              <button onClick={confirmUseLocation} className="flex-1 bg-rose-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-rose-700 transition">{t("shareLocationBtn")}</button>
            </div>
          </div>
        </div>
      )}
      {legalModalTopic && (() => {
        const doc = LEGAL_CONTENT[legalModalTopic];
        if (!doc) return null;
        return (
          <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" style={{ zIndex: 9700 }} onClick={() => setLegalModalTopic(null)} />
            <div className="fixed inset-0 bg-white flex flex-col max-w-md md:max-w-2xl mx-auto md:my-6 md:rounded-3xl md:shadow-2xl overflow-hidden" style={{ zIndex: 9701 }}>
              <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
                <button onClick={() => setLegalModalTopic(null)} className="flex items-center gap-1 text-gray-500 mb-2 text-sm hover:text-gray-900 transition"><ChevronLeft size={18} /> {t("back")}</button>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{doc.title}</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">{t("legalLastUpdatedLabel", { date: doc.updated })}</p>
                  </div>
                  <button onClick={() => setLegalModalTopic(null)} aria-label={t("closeAria")} className="p-1 -m-1 text-gray-400 hover:text-gray-700"><X size={18} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 leading-snug">{t("legalDisclaimerNote")}</p>
                </div>
                <div className="space-y-4">
                  {doc.sections.map((s, i) => (
                    <div key={i}>
                      <h4 className="text-sm font-semibold text-gray-800 mb-1">{s.h}</h4>
                      <p className="text-[12.5px] text-gray-500 leading-relaxed">{s.b}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0">
                <button onClick={() => setLegalModalTopic(null)} className="w-full bg-rose-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-rose-700 transition">{t("understoodBtn")}</button>
              </div>
            </div>
          </>
        );
      })()}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 9000 }} onClick={closeQuoteModal}>
          {showQuotePremiumUpsell && (
            <div style={{ zIndex: 9500 }} className="fixed top-5 left-1/2 -translate-x-1/2 w-[92%] max-w-sm pointer-events-none">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl shadow-lg p-3 text-center">
                <p className="text-xs font-semibold text-amber-700">{t("premiumUpsellTitle", { n: String(FREE_QUOTE_MECH_LIMIT) })}</p>
                <p className="text-[11px] text-amber-600 mt-0.5">{t("premiumUpsellDesc", { max: String(PREMIUM_QUOTE_MECH_LIMIT) })}</p>
              </div>
            </div>
          )}
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-auto max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2"><Users size={18} className="text-rose-600" /> {t("multiQuoteModalTitle")}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{t("multiQuoteModalSubtitle")}</p>
              </div>
              <button onClick={closeQuoteModal} aria-label={t("closeAria")} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0 ml-3"><X size={15} /></button>
            </div>
            <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">{t("vehicleFieldLabel")}</label>
                <div className="flex flex-wrap gap-1.5">
                  {vehicles.map(v => (<button key={v.id} onClick={() => setQuoteVehicleId(v.id)} className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${quoteVehicleId === v.id ? "bg-rose-600 text-white border-rose-600" : "border-gray-200 text-gray-600 hover:border-rose-300"}`}>{v.brand} {v.model} ({v.plate})</button>))}
                  <button onClick={() => setShowAddVehicle(!showAddVehicle)} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border border-dashed transition ${showAddVehicle ? "bg-rose-50 border-rose-300 text-rose-600" : "border-gray-300 text-gray-500 hover:border-rose-300 hover:text-rose-600"}`}><Plus size={12} /> {t("addAnotherVehicleBtn")}</button>
                </div>
                {(vehicles.length === 0 || showAddVehicle) && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mt-2 space-y-2">
                    <input value={newVehicle.brand} onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })} placeholder={t("bookingBrandPlaceholder")} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white" />
                    <input value={newVehicle.model} onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })} placeholder={t("bookingModelPlaceholder")} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white" />
                    <div className="flex gap-2"><input value={newVehicle.year} onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })} placeholder={t("bookingYearPlaceholder")} className="w-1/2 px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white" /><input value={newVehicle.plate} onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value })} placeholder={t("bookingPlatePlaceholder")} className="w-1/2 px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white" /></div>
                    <button onClick={addVehicle} disabled={!newVehicle.brand || !newVehicle.model} className={`w-full py-2 rounded-lg text-xs font-semibold transition ${newVehicle.brand && newVehicle.model ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>{t("bookingAddAndSelect")}</button>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">{t("describeIssueLabel")}</label>
                <textarea value={quoteIssue} onChange={(e) => setQuoteIssue(e.target.value)} rows={3} placeholder={t("issueDescPlaceholderExample")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none" />
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {quotePhotos.map((src, i) => (<div key={i} className="relative"><img src={src} alt={t("quotePhotoAlt", { n: String(i + 1) })} className="w-14 h-14 rounded-lg object-cover border border-gray-100" /><button onClick={() => removeQuotePhoto(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center text-white"><X size={10} /></button></div>))}
                  <button onClick={() => quotePhotoRef.current?.click()} className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-rose-300 hover:text-rose-500 transition"><Camera size={16} /></button>
                  <input ref={quotePhotoRef} type="file" accept="image/*" className="hidden" onChange={addQuotePhoto} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-700">{t("selectMechanicLabel")}</label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{t("selectedCountSuffix", { n: String(quoteSelectedMechIds.length) })}</span>
                </div>
                <p className="text-[10px] text-gray-400 mb-2">{t("selectAnyCountNote", { n: String(FREE_QUOTE_MECH_LIMIT), max: String(PREMIUM_QUOTE_MECH_LIMIT) })}</p>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={quoteMechSearch} onChange={(e) => setQuoteMechSearch(e.target.value)} placeholder={t("searchMechOrSpecialtyPlaceholder")} className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-xs" />
                </div>
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  {[{ key: "distance", labelKey: "sortDistance" }, { key: "price", labelKey: "sortPrice" }, { key: "rating", labelKey: "sortRating" }].map(opt => (<button key={opt.key} onClick={() => handleSortClick(opt.key)} className={`px-2.5 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap border transition ${sortBy === opt.key ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-600 border-gray-200"}`}>{t(opt.labelKey)}{sortBy === opt.key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}</button>))}
                  <button onClick={() => { setOwnerMode("mechanics"); setShowFilterModal(true); }} className="px-2.5 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap border flex items-center gap-1 bg-white text-gray-600 border-gray-200 relative"><SlidersHorizontal size={11} /> {t("filterBtn")} {activeFilterCount > 0 && <span className="ml-0.5 w-3.5 h-3.5 bg-rose-600 text-white rounded-full text-[8px] flex items-center justify-center">{activeFilterCount}</span>}</button>
                </div>
                <div className="max-h-72 overflow-y-auto rounded-xl ring-1 ring-gray-100 divide-y divide-gray-50">
                  {quoteFilteredMechanics.map(m => {
                    const selected = quoteSelectedMechIds.includes(m.id);
                    const open = mechanicOpenStatus(m);
                    return (
                      <button key={m.id} onClick={() => toggleQuoteMechanic(m.id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition ${selected ? "bg-rose-50" : "hover:bg-gray-50"}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base flex-shrink-0 bg-gradient-to-br ${BANNER_PRESETS[m.bannerPreset] || BANNER_PRESETS.blue}`}><span className="w-8 h-8 bg-white rounded-full flex items-center justify-center">{m.img || "🔧"}</span></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate flex items-center gap-1">{m.name}{m.verified && <BadgeCheck size={11} className="text-rose-600 flex-shrink-0" />}</p>
                          <p className="text-[10px] text-gray-400 truncate">{m.specialty}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] text-gray-500 flex items-center gap-0.5"><MapPin size={9} />{(m.effectiveDistance ?? m.distance).toFixed(1)} km</span>
                            <span className="text-[10px] text-gray-500 flex items-center gap-0.5"><Star size={9} className="text-gray-900 fill-gray-900" />{m.rating}</span>
                            <PriceLevelDots price={m.price} />
                            {open !== null && (<span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${open ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>{open ? t("mechOpenShort") : t("mechClosedShort")}</span>)}
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? "bg-rose-600 border-rose-600" : "border-gray-300"}`}>{selected && <Check size={12} className="text-white" strokeWidth={3} />}</div>
                      </button>
                    );
                  })}
                  {quoteFilteredMechanics.length === 0 && <p className="text-center text-gray-400 text-xs py-6">{t("noMechanicMatchNote")}</p>}
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
              <button disabled={!quoteVehicleId || !quoteIssue.trim() || quoteSelectedMechIds.length === 0} onClick={submitQuoteRequest} className={`w-full py-3 rounded-2xl font-semibold text-sm transition ${quoteVehicleId && quoteIssue.trim() && quoteSelectedMechIds.length > 0 ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>{t("requestQuoteBtn")} {quoteSelectedMechIds.length > 0 ? `(${t("mechanicCountSuffix", { n: String(quoteSelectedMechIds.length) })})` : ""}</button>
            </div>
          </div>
        </div>
      )}
      {onboardingVisible && (() => { const slide = ONBOARDING_SLIDES[onboardStep]; const isLast = onboardStep === ONBOARDING_SLIDES.length - 1; return (
        <div className="fixed inset-0 w-screen h-screen bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden my-auto">
            <div className={`bg-gradient-to-br ${slide.grad} px-6 pt-8 pb-10 text-center relative`}>
              <button onClick={() => setShowOnboarding(false)} aria-label={t("skipTourAria")} className="absolute top-3 right-3 text-white/80 hover:text-white p-2 -m-1 text-xs font-medium">{t("skipBtn")}</button>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-3">{slide.icon}</div>
              <h2 className="text-white font-bold text-lg">{slide.title}</h2>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 leading-relaxed mb-5 min-h-[60px]">{slide.desc}</p>
              <div className="flex items-center justify-center gap-1.5 mb-5">{ONBOARDING_SLIDES.map((_, i) => (<div key={i} className={`h-1.5 rounded-full transition-all ${i === onboardStep ? "w-6 bg-rose-600" : "w-1.5 bg-gray-200"}`} />))}</div>
              <button onClick={() => { if (isLast) setShowOnboarding(false); else setOnboardStep(s => s + 1); }} className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition">{isLast ? t("letsStartBtn") : t("nextBtn")}</button>
            </div>
          </div>
        </div>
      ); })()}
      <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }} className={`w-full bg-gray-50 min-h-screen shadow-xl flex flex-col ${(screen === "owner" && (ownerTab === "search" || ownerTab === "market")) || screen === "mechBrowse" || screen === "adminDashboard" ? "max-w-7xl" : "max-w-md md:max-w-2xl"}`}>
        {screen === "home" && (
          <div className="flex-1 flex flex-col">
            <div className="bg-gradient-to-b from-rose-50 to-white pb-6 rounded-b-[32px]">
              <div className="px-6 pt-8 max-w-md mx-auto w-full">
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center flex-shrink-0"><Wrench size={16} className="text-white" /></div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Fix<span className="text-rose-600">perto</span></h1>
                </div>
                <h2 className="text-3xl font-extrabold leading-tight mb-3 text-gray-900 max-w-[260px]">{t("heroHeadline")}</h2>
                <p className="text-gray-500 text-sm mb-7 max-w-[260px]">{t("tagline")}</p>
                <div className="grid grid-cols-3 gap-4 max-w-sm">
                  <div><div className="flex items-center gap-2 mb-1.5"><Shield size={24} className="text-rose-600 flex-shrink-0" /><p className="text-sm font-bold text-gray-900">{t("featureReliableTitle")}</p></div><p className="text-xs text-gray-500 leading-snug">{t("featureReliableDesc")}</p></div>
                  <div><div className="flex items-center gap-2 mb-1.5"><Zap size={24} className="text-rose-600 flex-shrink-0" /><p className="text-sm font-bold text-gray-900">{t("featureFastTitle")}</p></div><p className="text-xs text-gray-500 leading-snug">{t("featureFastDesc")}</p></div>
                  <div><div className="flex items-center gap-2 mb-1.5"><Star size={24} className="text-rose-600 flex-shrink-0" /><p className="text-sm font-bold text-gray-900">{t("featureEasyTitle")}</p></div><p className="text-xs text-gray-500 leading-snug">{t("featureEasyDesc")}</p></div>
                </div>
              </div>
            </div>
            <div className="px-6 pt-8 pb-10 flex flex-col gap-4 max-w-md mx-auto w-full">
              <div className="text-center mb-1">
                <h3 className="text-xl font-bold text-gray-900">{t("continueHeading")}</h3>
                <p className="text-gray-500 text-sm mt-1">{t("continueSubheading")}</p>
              </div>
              <button onClick={() => chooseRole("owner")} className="group w-full bg-white border border-gray-200 hover:border-gray-900 shadow-sm hover:shadow-md rounded-2xl p-4 flex items-center gap-4 transition"><div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center flex-shrink-0"><Car size={26} className="text-rose-600" /></div><div className="text-left flex-1"><h3 className="font-bold text-gray-900">{t("ownerRole")}</h3><p className="text-xs text-gray-500">{t("ownerRoleDesc")}</p></div><div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-900 transition"><ChevronRight size={16} className="text-gray-500 group-hover:text-white transition" /></div></button>
              <button onClick={() => chooseRole("mechanic")} className="group w-full bg-white border border-gray-200 hover:border-gray-900 shadow-sm hover:shadow-md rounded-2xl p-4 flex items-center gap-4 transition"><div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center flex-shrink-0"><Wrench size={26} className="text-rose-700" /></div><div className="text-left flex-1"><h3 className="font-bold text-gray-900">{t("mechanicRole")}</h3><p className="text-xs text-gray-500">{t("mechanicRoleDesc")}</p></div><div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-900 transition"><ChevronRight size={16} className="text-gray-500 group-hover:text-white transition" /></div></button>
              <div className="mt-2 -mx-6 overflow-hidden" style={{ WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)", maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}>
                <div className="stat-track flex items-stretch gap-3 w-max px-6">
                  {(() => {
                    const liveStats = [
                      { icon: Star, value: `${adminStats.avgRating}`, label: t("statLabelRating"), bg: "bg-amber-50", color: darkMode ? "text-amber-400" : "text-amber-600" },
                      { icon: MessageCircle, value: `${adminStats.totalReviews}`, label: t("statLabelReviews"), bg: "bg-rose-50", color: darkMode ? "text-rose-400" : "text-rose-600" },
                      { icon: Wrench, value: `${adminStats.totalMechanics}`, label: t("statLabelMechanics"), bg: "bg-green-50", color: darkMode ? "text-green-400" : "text-green-600" },
                      { icon: Calendar, value: `${adminStats.totalAppointments}`, label: t("statLabelAppointments"), bg: "bg-amber-50", color: darkMode ? "text-amber-400" : "text-amber-600" },
                      { icon: Tag, value: `${adminStats.activeCarListings}`, label: t("statLabelCarListings"), bg: "bg-rose-50", color: darkMode ? "text-rose-400" : "text-rose-600" },
                      { icon: MapPin, value: `${adminStats.totalCities}`, label: t("statLabelCities"), bg: "bg-green-50", color: darkMode ? "text-green-400" : "text-green-600" },
                    ];
                    return liveStats.concat(liveStats).map((s, i) => (
                      <div key={i} className="w-[95px] flex-shrink-0 bg-white border border-gray-100 rounded-2xl shadow-sm px-2.5 py-2.5 flex flex-col items-center gap-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${s.bg}`}><s.icon size={13.5} className={`${s.color} flex-shrink-0`} /></div>
                        <p className="text-sm font-extrabold tracking-tight text-gray-900 leading-none">{s.value}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide leading-none text-center">{s.label}</p>
                      </div>
                    ));
                  })()}
                </div>
                <style>{`@keyframes statScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } } .stat-track { animation: statScroll 26s linear infinite; } .stat-track:hover { animation-play-state: paused; }`}</style>
              </div>
            </div>
            <div className="mt-auto pt-5 pb-6 border-t border-gray-100 flex flex-col items-center gap-1">
              <p className="text-sm text-gray-400">© 2026 <span onClick={() => setScreen("adminLogin")} className="font-bold text-rose-600 cursor-pointer select-none">{t("appName")}</span></p>
              <p className="text-[9px] text-gray-200">{t("allRightsReserved")}</p>
            </div>
          </div>
        )}
        {(screen === "login" || screen === "signup") && (
          <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
            <div className="bg-gradient-to-b from-rose-50 to-white text-gray-900 px-5 pt-6 pb-8 border-b border-gray-100 shadow-sm rounded-b-[28px]">
              <div className="mb-4"><button onClick={goHome} className="flex items-center gap-1 text-gray-500 text-sm hover:text-gray-900 transition"><ChevronLeft size={18} /> {t("back")}</button></div>
              <div className="flex flex-col items-center text-center gap-2"><div className="w-16 h-16 bg-white shadow-sm rounded-2xl flex items-center justify-center"><Wrench size={28} className="text-rose-600" /></div><h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("appName")}</h1><p className="text-xs text-gray-500 -mt-1">{role === "mechanic" ? t("mechanicRole") : t("ownerRole")}</p></div>
            </div>
            <div className="flex-1 px-6 py-6">
              <div className="flex bg-gray-100 rounded-xl p-1 mb-6"><button onClick={() => { setScreen("login"); setAuthError(""); setAuthNotice(""); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${screen === "login" ? "bg-white shadow-sm text-gray-800" : "text-gray-400"}`}>{t("login")}</button><button onClick={() => { setScreen("signup"); setAuthError(""); setAuthNotice(""); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${screen === "signup" ? "bg-white shadow-sm text-gray-800" : "text-gray-400"}`}>{t("signup")}</button></div>
              <div className="space-y-3">
                {screen === "signup" && (<div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("fullNameShortPlaceholder")} className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm" /></div>)}
                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t("emailPlaceholder")} type="email" className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm" /></div>
                {screen === "signup" && (<div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t("phonePlaceholderExample2")} className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm" /></div>)}
                {/* GERÇEK OTURUM SİSTEMİ: kayıt formunda artık şifre alanı YOK — kullanıcı şifre
                    seçmiyor, backend rastgele bir şifre üretip e-postasına gönderiyor (bkz.
                    submitRegister / backend/routes/auth.js). Şifre alanı sadece GİRİŞ ekranında var. */}
                {screen === "signup" && (<p className="text-xs text-gray-400 leading-relaxed">{t("signupPasswordNote")}</p>)}
                {screen === "login" && (<div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input type={showPass ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={t("passwordPlaceholder")} className="w-full pl-9 pr-10 py-3 rounded-xl border border-gray-200 text-sm" /><button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>)}
                {screen === "login" && (<p onClick={() => setScreen("forgotPassword")} className="text-xs text-rose-500 text-right cursor-pointer hover:underline">{t("forgotPasswordLink")}</p>)}
                {authNotice && <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 flex items-start gap-1.5"><Bell size={12} className="flex-shrink-0 mt-0.5" /> {authNotice}</p>}
                {authError && <p className="text-xs text-red-500 flex items-center gap-1.5"><Bell size={12} className="flex-shrink-0" /> {authError}</p>}
              </div>
              <button disabled={authLoading} onClick={screen === "login" ? submitLogin : submitRegister} className={`w-full text-white py-3 rounded-2xl font-semibold text-sm mt-6 transition ${roleBtn} ${authLoading ? "opacity-60 cursor-not-allowed" : ""}`}>{authLoading ? t("submitting") : (screen === "login" ? t("login") : t("signup"))}</button>
            </div>
          </div>
        )}
        {screen === "loginOtp" && (
          <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
            <div className="bg-gradient-to-b from-rose-50 to-white text-gray-900 px-5 pt-6 pb-8 border-b border-gray-100 shadow-sm rounded-b-[28px]">
              <div className="mb-4"><button onClick={cancelOtpVerify} className="flex items-center gap-1 text-gray-500 text-sm hover:text-gray-900 transition"><ChevronLeft size={18} /> {t("back")}</button></div>
              <div className="flex flex-col items-center text-center gap-2"><div className="w-16 h-16 bg-white shadow-sm rounded-2xl flex items-center justify-center"><Lock size={28} className="text-rose-600" /></div><h1 className="text-xl font-bold tracking-tight text-gray-900">{t("otpTitle")}</h1><p className="text-xs text-gray-500">{t("otpSubtitle")}</p></div>
            </div>
            <div className="flex-1 px-6 py-6">
              <div className="space-y-3">
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))} placeholder={t("otpCodePlaceholder")} inputMode="numeric" className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm tracking-[0.3em] text-center font-semibold" /></div>
                {authNotice && <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 flex items-start gap-1.5"><Bell size={12} className="flex-shrink-0 mt-0.5" /> {authNotice}</p>}
                {authError && <p className="text-xs text-red-500 flex items-center gap-1.5"><Bell size={12} className="flex-shrink-0" /> {authError}</p>}
              </div>
              <button disabled={authLoading} onClick={submitOtpVerify} className={`w-full text-white py-3 rounded-2xl font-semibold text-sm mt-6 transition ${roleBtn} ${authLoading ? "opacity-60 cursor-not-allowed" : ""}`}>{authLoading ? t("submitting") : t("otpVerifyBtn")}</button>
              <p className="text-center text-xs text-gray-400 mt-4"><span onClick={cancelOtpVerify} className="text-rose-500 font-medium cursor-pointer hover:underline">{t("otpBackToLogin")}</span></p>
            </div>
          </div>
        )}
        {screen === "forgotPassword" && (
          <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
            <div className="bg-white text-gray-900 px-5 pt-6 pb-6 border-b border-gray-200 shadow-sm">
              <button onClick={() => setScreen("login")} className="flex items-center gap-1 text-gray-500 mb-4 text-sm hover:text-gray-900 transition"><ChevronLeft size={18} /> {t("back")}</button>
              <div className="flex items-center gap-3"><div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center"><Lock size={22} className="text-rose-600" /></div><div><h1 className="text-lg font-bold text-gray-900">{t("forgotPasswordTitle")}</h1><p className="text-xs text-gray-500">{t("forgotPasswordSubtitle")}</p></div></div>
            </div>
            <div className="flex-1 px-6 py-6">
              <p className="text-sm text-gray-500 mb-4">{t("forgotPasswordBody")}</p>
              <div className="relative mb-4"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder={t("emailAddressPlaceholder")} type="email" className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200" /></div>
              <button disabled={!forgotEmail} onClick={() => setScreen("resetSent")} className={`w-full text-white py-3 rounded-2xl font-semibold text-sm transition ${forgotEmail ? "bg-rose-600 hover:bg-rose-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>{t("sendResetLinkBtn")}</button>
              <p className="text-center text-xs text-gray-400 mt-4">{t("rememberedPasswordNote")} <span onClick={() => setScreen("login")} className="text-rose-500 font-medium cursor-pointer hover:underline">{t("logInLink")}</span></p>
            </div>
          </div>
        )}
        {screen === "resetSent" && (
          <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full px-6 py-10 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-4"><Mail size={36} className="text-rose-500" /></div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">{t("checkYourEmailTitle")}</h2>
            <p className="text-sm text-gray-500 mb-1">{t("ifRegisteredNote", { email: forgotEmail })}</p>
            <p className="text-sm text-gray-500 mb-6">{t("resetLinkComingNote")}</p>
            <div className="bg-gray-100 rounded-xl p-3 text-xs text-gray-700 mb-6 flex items-start gap-2 text-left"><Bell size={14} className="flex-shrink-0 mt-0.5" /> {t("resetDemoNote")}</div>
            <button onClick={() => setScreen("login")} className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition mb-2">{t("backToLoginBtn")}</button>
            <button onClick={() => setScreen("forgotPassword")} className="text-xs text-gray-400 hover:text-gray-600">{t("didntGetEmailBtn")}</button>
          </div>
        )}
        {screen === "adminLogin" && (
          <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full px-6 py-10">
            <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center mb-4"><ShieldAlert size={26} className="text-white" /></div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Yönetici Paneli</h1>
            <p className="text-xs text-gray-500 mb-6 text-center max-w-[260px]">Bu alan yalnızca Fixperto ekibi içindir. Araç sahipleri ve tamirciler bu panele erişemez.</p>
            <div className="w-full space-y-3">
              <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} placeholder="Yönetici e-postası" type="email" className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm" /></div>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} placeholder="Şifre" disabled={adminLoginLoading} className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm disabled:opacity-60" onKeyDown={(e) => { if (e.key === "Enter") submitAdminLogin(); }} /></div>
              {adminError && <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertTriangle size={12} className="flex-shrink-0" /> {adminError}</p>}
            </div>
            <button onClick={submitAdminLogin} disabled={adminLoginLoading} className="w-full bg-gray-900 text-white py-3 rounded-2xl font-semibold text-sm mt-5 hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed">{adminLoginLoading ? "Giriş yapılıyor..." : "Giriş Yap"}</button>
            <button onClick={goHome} className="text-xs text-gray-400 mt-4 hover:text-gray-600">← Uygulamaya dön</button>
          </div>
        )}
        {screen === "adminDashboard" && adminAuthed && (() => {
          const adminNavItems = [{ key: "dashboard", label: "Genel Bakış", icon: LayoutDashboard }, { key: "users", label: "Kullanıcılar", icon: Users }, { key: "tickets", label: "Destek Talepleri", icon: LifeBuoy }, { key: "analytics", label: "Analitik", icon: TrendingUp }, { key: "history", label: "Geçmiş", icon: History }];
          return (
          <div className="flex-1 flex flex-col md:flex-row min-h-0">
            <div className="hidden md:flex md:w-60 md:flex-shrink-0 bg-gray-900 text-white flex-col p-4">
              <div className="flex items-center gap-2 mb-8 px-2"><div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center flex-shrink-0"><Wrench size={16} className="text-white" /></div><span className="text-lg font-extrabold">Fix<span className="text-rose-500">perto</span></span></div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 px-2 mb-2">Yönetici Paneli</p>
              <nav className="flex flex-col gap-1">
                {adminNavItems.map(item => { const Icon = item.icon; const active = adminTab === item.key; return (
                  <button key={item.key} onClick={() => setAdminTab(item.key)} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition ${active ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"}`}>
                    <Icon size={16} />{item.label}
                    {item.key === "tickets" && adminStats.openTickets > 0 && <span className="ml-auto bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{adminStats.openTickets}</span>}
                  </button>
                ); })}
              </nav>
              <button onClick={() => setShowBroadcastModal(true)} className="mt-2 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-gray-200 transition"><Megaphone size={16} /> Duyuru Gönder</button>
              <button onClick={adminLogout} className="mt-auto flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-gray-200 transition"><LogOut size={16} /> Çıkış Yap</button>
            </div>
            <div className="md:hidden bg-gray-900 text-white px-4 pt-5 pb-3 flex-shrink-0">
              <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><div className="w-7 h-7 bg-rose-600 rounded-lg flex items-center justify-center"><Wrench size={14} className="text-white" /></div><span className="text-sm font-extrabold">Fix<span className="text-rose-500">perto</span> <span className="text-gray-400 font-medium">Admin</span></span></div><div className="flex items-center gap-1"><button onClick={() => setShowBroadcastModal(true)} aria-label="Duyuru gönder" className="text-gray-400 hover:text-white p-1"><Megaphone size={16} /></button><button onClick={adminLogout} aria-label="Çıkış" className="text-gray-400 hover:text-white p-1"><LogOut size={16} /></button></div></div>
              <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                {adminNavItems.map(item => (<button key={item.key} onClick={() => setAdminTab(item.key)} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition relative ${adminTab === item.key ? "bg-white text-gray-900" : "text-gray-400"}`}>{item.label.split(" ")[0]}{item.key === "tickets" && adminStats.openTickets > 0 && <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{adminStats.openTickets}</span>}</button>))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <div className="max-w-6xl mx-auto w-full px-5 md:px-8 py-6">
                {adminTab === "dashboard" && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 mb-1">Genel Bakış</h1>
                    <p className="text-sm text-gray-500 mb-6">Platformun anlık durumu</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                      {[
                        { label: "Araç Sahibi", value: adminStats.totalOwners, icon: Car, note: `${adminStats.suspendedOwners} askıda` },
                        { label: "Tamirci", value: adminStats.totalMechanics, icon: Wrench, note: `${adminStats.suspendedMechanics} askıda` },
                        { label: "Toplam Kullanıcı", value: adminStats.totalUsers, icon: Users, note: null },
                        { label: "Aktif Araç İlanı", value: adminStats.activeCarListings, icon: Tag, note: null },
                        { label: "Aktif İş İlanı", value: adminStats.activeJobListings, icon: Briefcase, note: null },
                        { label: "Toplam Randevu", value: adminStats.totalAppointments, icon: Calendar, note: `${adminStats.completedThisMonth} tamamlandı` },
                        { label: "Açık Destek Talebi", value: adminStats.openTickets, icon: LifeBuoy, note: null, alert: adminStats.openTickets > 0 },
                        { label: "SLA Aşan Talep", value: adminStats.slaBreached, icon: AlertTriangle, note: null, alert: adminStats.slaBreached > 0 },
                        { label: "Doğrulama Bekleyen", value: adminStats.pendingVerification, icon: BadgeCheck, note: null, alert: adminStats.pendingVerification > 0 },
                        { label: "Ortalama Puan", value: adminStats.avgRating, icon: Star, note: null },
                      ].map((c, i) => { const Icon = c.icon; return (
                        <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${c.alert ? "bg-red-50" : "bg-rose-50"}`}><Icon size={16} className={c.alert ? "text-red-500" : "text-rose-600"} /></div>
                          <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
                          {c.note && <p className="text-[10px] text-gray-400 mt-1">{c.note}</p>}
                        </div>
                      ); })}
                    </div>
                    <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><LifeBuoy size={15} className="text-rose-500" /> Son Destek Talepleri</h2>
                    <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 mb-8">
                      {supportTickets.slice(0, 5).map(tk => (
                        <button key={tk.id} onClick={() => { setAdminTab("tickets"); setSelectedTicketId(tk.id); setAdminTicketNote(tk.adminNote || ""); }} className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${tk.status === "open" ? "bg-red-500" : tk.status === "in_review" ? "bg-gray-400" : "bg-green-500"}`} />
                          <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-800 truncate">{tk.subject}</p><p className="text-xs text-gray-400 truncate">{tk.fromName} · {ADMIN_TICKET_TYPE_LABELS[tk.type]}</p></div>
                          {ticketSlaBreached(tk) && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 flex-shrink-0 flex items-center gap-0.5"><AlertTriangle size={9} /> SLA</span>}
                          <span className="text-[10px] text-gray-400 flex-shrink-0">{tk.createdDate}</span>
                        </button>
                      ))}
                    </div>
                    <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><Megaphone size={15} className="text-rose-500" /> Son Duyurular</h2>
                    <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
                      {broadcastLog.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Henüz duyuru gönderilmedi</p>}
                      {broadcastLog.slice(0, 5).map(b => (
                        <div key={b.id} className="px-4 py-3">
                          <div className="flex items-center justify-between mb-1"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{b.audience === "all" ? "Tümü" : b.audience === "owner" ? "Araç Sahipleri" : "Tamirciler"} · {b.recipientCount} kişi</span><span className="text-[10px] text-gray-300">{b.date}</span></div>
                          <p className="text-xs text-gray-600">{b.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {adminTab === "users" && (
                  <div>
                    {adminProfileViewUser && viewingUser ? (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <button onClick={() => { setAdminProfileViewUser(null); setEditingProfileField(null); }} className="flex items-center gap-1 text-gray-500 hover:text-gray-900 text-sm transition"><ChevronLeft size={16} /> Kullanıcılara Dön</button>
                          <button onClick={() => openAdminAnalyze(viewingUser)} className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 transition"><TrendingUp size={14} /> Analizi Görüntüle</button>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5">
                          <div className="flex items-center gap-3 mb-1">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl font-bold ${viewingUser.type === "mechanic" ? "bg-rose-50 text-rose-600" : "bg-gray-100 text-gray-600"}`}>{viewingUser.type === "mechanic" ? <Wrench size={22} /> : <Car size={22} />}</div>
                            <div className="flex-1 min-w-0">
                              <h2 className="text-lg font-bold text-gray-900 truncate">{viewingUser.name}</h2>
                              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{viewingUser.type === "mechanic" ? "Tamirci" : "Araç Sahibi"}</span>
                                {viewingUser.status === "suspended" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">Askıda</span>}
                                {viewingUser.type === "mechanic" && viewingUser.verified && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 flex items-center gap-0.5"><BadgeCheck size={10} /> Doğrulanmış</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 px-1">Hesap Bilgileri</p>
                        <div className="bg-white border border-gray-200 rounded-2xl px-4 mb-5">
                          {renderAdminProfileRow(viewingUser, "name", viewingUser.type === "mechanic" ? "İşletme Adı" : "Ad Soyad", viewingUser.name)}
                          {renderAdminProfileRow(viewingUser, "email", "E-posta", viewingUser.email)}
                          {renderAdminProfileRow(viewingUser, "phone", "Telefon", viewingUser.phone)}
                          {viewingUser.type === "owner" && renderAdminProfileRow(viewingUser, "city", "Şehir", viewingUser.city)}
                          {renderAdminProfileRow(viewingUser, "status", "Hesap Durumu", viewingUser.status, { type: "toggle", options: [{ value: "active", label: "Aktif" }, { value: "suspended", label: "Askıya Al" }], display: viewingUser.status === "active" ? "Aktif" : "Askıda" })}
                        </div>
                        {viewingUser.type === "owner" && (
                          <>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 px-1">Platform İstatistikleri</p>
                            <div className="bg-white border border-gray-200 rounded-2xl px-4 mb-5">
                              {renderAdminProfileRow(viewingUser, "vehicleCount", "Kayıtlı Araç Sayısı", ownersDirectory.find(o => o.id === viewingUser.id)?.vehicleCount, { numeric: true })}
                              {renderAdminProfileRow(viewingUser, "apptCount", "Toplam Randevu", ownersDirectory.find(o => o.id === viewingUser.id)?.apptCount, { numeric: true })}
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 px-1">Araç İlanları</p>
                            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5">
                              {listings.filter(l => l.sellerId != null ? l.sellerId === viewingUser.id : l.sellerName === viewingUser.name).length === 0 ? (
                                <p className="text-xs text-gray-400">Bu kullanıcının araç ilanı yok.</p>
                              ) : (
                                <div className="space-y-2">{listings.filter(l => l.sellerId != null ? l.sellerId === viewingUser.id : l.sellerName === viewingUser.name).map(l => renderAdminListingCard(l))}</div>
                              )}
                            </div>
                          </>
                        )}
                        {viewingUser.type === "mechanic" && (
                          <>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 px-1">İşletme Profili</p>
                            <div className="bg-white border border-gray-200 rounded-2xl px-4 mb-5">
                              {renderAdminProfileRow(viewingUser, "specialty", "Uzmanlık Alanı", viewingUser.specialty)}
                              {renderAdminProfileRow(viewingUser, "address", "Adres", viewingUser.address)}
                              {renderAdminProfileRow(viewingUser, "price", "Başlangıç Fiyatı (₺)", viewingUser.price, { numeric: true })}
                              {renderAdminProfileRow(viewingUser, "verified", "Doğrulama Rozeti", viewingUser.verified, { type: "toggle", options: [{ value: "true", label: "Doğrulanmış" }, { value: "false", label: "Doğrulanmamış" }], display: viewingUser.verified ? "Doğrulanmış" : "Doğrulanmamış" })}
                              <div className="flex items-center justify-between gap-3 py-3 border-b border-gray-100 last:border-0"><div className="flex-1 min-w-0"><p className="text-[11px] text-gray-400 mb-0.5">Konuştuğu Dil</p><p className="text-sm font-medium text-gray-800">{(() => { const l = mechanicsList.find(m => m.id === viewingUser.id)?.lang; return LANG_LABELS[l] || l || "—"; })()}</p></div></div>
                              <div className="flex items-center justify-between gap-3 py-3 border-b border-gray-100 last:border-0"><div className="flex-1 min-w-0"><p className="text-[11px] text-gray-400 mb-0.5">Hizmet Verdiği Markalar</p><p className="text-sm font-medium text-gray-800">{(mechanicsList.find(m => m.id === viewingUser.id)?.brandsServiced || []).join(", ") || "—"}</p></div></div>
                              <div className="flex items-center justify-between gap-3 py-3 border-b border-gray-100 last:border-0"><div className="flex-1 min-w-0"><p className="text-[11px] text-gray-400 mb-0.5">Ödeme Yöntemleri</p><p className="text-sm font-medium text-gray-800">{(mechanicsList.find(m => m.id === viewingUser.id)?.paymentMethods || []).join(", ") || "—"}</p></div></div>
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 px-1">Konum</p>
                            <div className="rounded-2xl overflow-hidden border border-gray-200 mb-5">
                              <MapPanel className="h-32" items={[mechanicsList.find(m => m.id === viewingUser.id)].filter(Boolean)} onPick={() => {}} />
                              <div className="p-3 bg-white text-xs text-gray-600">{viewingUser.address}</div>
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 px-1 flex items-center justify-between">
                              <span>Sunduğu Hizmetler</span>
                              <button onClick={() => addMechService(viewingUser.id)} className="normal-case text-rose-600 font-semibold flex items-center gap-1"><Plus size={11} /> Ekle</button>
                            </p>
                            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5">
                              {(mechanicsList.find(m => m.id === viewingUser.id)?.services || []).length === 0 ? (
                                <p className="text-xs text-gray-400">Henüz hizmet eklenmemiş.</p>
                              ) : (
                                <div className="space-y-2">
                                  {mechanicsList.find(m => m.id === viewingUser.id).services.map((s, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <input value={s.name} onChange={(e) => updateMechService(viewingUser.id, i, "name", e.target.value)} onFocus={() => trackFieldFocus(`service:${viewingUser.id}:${i}:name`, s.name)} onBlur={(e) => trackFieldBlurAndLog(`service:${viewingUser.id}:${i}:name`, e.target.value, { targetType: "service", targetId: viewingUser.id, field: "name", extra: { serviceIdx: i } })} className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs" />
                                      <input value={s.price} onChange={(e) => updateMechService(viewingUser.id, i, "price", e.target.value)} onFocus={() => trackFieldFocus(`service:${viewingUser.id}:${i}:price`, s.price)} onBlur={(e) => trackFieldBlurAndLog(`service:${viewingUser.id}:${i}:price`, e.target.value, { targetType: "service", targetId: viewingUser.id, field: "price", extra: { serviceIdx: i } })} className="w-20 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs" />
                                      <button onClick={() => removeMechService(viewingUser.id, i)} aria-label="Hizmeti kaldır" className="w-7 h-7 rounded-lg border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50 transition flex-shrink-0"><Trash2 size={12} /></button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 px-1">Araç İlanları</p>
                            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5">
                              {listings.filter(l => l.sellerType === "mechanic" && (l.sellerId != null ? l.sellerId === viewingUser.id : l.sellerName === viewingUser.name)).length === 0 ? (
                                <p className="text-xs text-gray-400">Bu tamircinin araç ilanı yok.</p>
                              ) : (
                                <div className="space-y-2">{listings.filter(l => l.sellerType === "mechanic" && (l.sellerId != null ? l.sellerId === viewingUser.id : l.sellerName === viewingUser.name)).map(l => renderAdminListingCard(l))}</div>
                              )}
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 px-1">İş İlanları</p>
                            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5">
                              {jobListings.filter(j => j.mechanicId === viewingUser.id).length === 0 ? (
                                <p className="text-xs text-gray-400">Bu tamircinin iş ilanı yok.</p>
                              ) : (
                                <div className="space-y-2">{jobListings.filter(j => j.mechanicId === viewingUser.id).map(j => renderAdminJobCard(j))}</div>
                              )}
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 px-1">Doğrulama Belgeleri</p>
                            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5">
                              {(viewingUser.verificationDocs || []).length === 0 ? (
                                <p className="text-xs text-gray-400">Henüz belge gönderilmedi.</p>
                              ) : (
                                <div className="space-y-2">
                                  {viewingUser.verificationDocs.map((d, i) => (
                                    <div key={i} className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
                                      <FileText size={14} className="text-rose-500 flex-shrink-0" />
                                      <div className="flex-1 min-w-0"><p className="text-xs font-medium text-gray-700 truncate">{d.name}</p><p className="text-[10px] text-gray-400">{d.type} · {d.uploadedDate}</p></div>
                                      <button onClick={() => setToast({ type: "info", text: "📄 Bu bir demo belgesidir, gerçek dosya içeriği bulunmuyor." })} className="text-[11px] font-medium text-rose-600 hover:text-rose-700 flex-shrink-0">Görüntüle</button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 px-1">Şifre Yönetimi</p>
                        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5">
                          <div className="flex gap-2 mb-2">
                            <input type="text" value={profilePasswordDraft} onChange={(e) => setProfilePasswordDraft(e.target.value)} placeholder="Yeni şifre belirle" className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                            <button onClick={() => { if (!profilePasswordDraft.trim()) return; if (viewingUser.type === "owner") setOwnersDirectory(list => list.map(o => o.id === viewingUser.id ? { ...o, password: profilePasswordDraft.trim() } : o)); else setMechanicAdminOverrides(ov => ({ ...ov, [viewingUser.id]: { ...ov[viewingUser.id], password: profilePasswordDraft.trim() } })); setProfilePasswordDraft(""); setToast({ type: "info", text: "🔑 Şifre güncellendi. Kullanıcıya yeni şifresi iletilecek (demo)." }); }} disabled={!profilePasswordDraft.trim()} className={`px-3 rounded-xl text-xs font-semibold transition flex-shrink-0 ${profilePasswordDraft.trim() ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}>Güncelle</button>
                          </div>
                          <button onClick={() => setToast({ type: "info", text: `✉️ Şifre sıfırlama bağlantısı ${viewingUser.email} adresine gönderildi (demo).` })} className="w-full border border-gray-200 text-gray-600 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-1.5"><Mail size={12} /> Şifre Sıfırlama Bağlantısı Gönder</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                          <div><h1 className="text-xl font-bold text-gray-900">Kullanıcılar</h1><p className="text-sm text-gray-500">{adminFilteredUsers.length} kullanıcı</p></div>
                          <div className="relative w-full sm:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} /><input value={adminUserSearch} onChange={(e) => setAdminUserSearch(e.target.value)} placeholder="İsim veya e-posta ara" className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-sm" /></div>
                        </div>
                        <div className="flex gap-2 mb-4">
                          {[{ key: "all", label: "Tümü" }, { key: "owner", label: "Araç Sahipleri" }, { key: "mechanic", label: "Tamirciler" }].map(f => (<button key={f.key} onClick={() => setAdminUserTypeFilter(f.key)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${adminUserTypeFilter === f.key ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{f.label}</button>))}
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
                          {adminFilteredUsers.map(u => (
                            <div key={`${u.type}-${u.id}`} className="px-4 py-3 flex items-center gap-3 flex-wrap sm:flex-nowrap">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${u.type === "mechanic" ? "bg-rose-50 text-rose-600" : "bg-gray-100 text-gray-600"}`}>{u.type === "mechanic" ? <Wrench size={15} /> : <Car size={15} />}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5"><p className="text-sm font-semibold text-gray-800 truncate">{u.name}</p>{u.status === "suspended" && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 flex-shrink-0">Askıda</span>}</div>
                                <p className="text-xs text-gray-400 truncate">{u.email} · {u.phone}</p>
                                <p className="text-[10px] text-gray-300 truncate">{u.extra}</p>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto sm:ml-0">
                                <button onClick={() => openAdminProfileView(u)} aria-label="Profili Görüntüle" className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition"><Eye size={13} /></button>
                                <button onClick={() => openAdminAnalyze(u)} aria-label="Analiz" className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition"><TrendingUp size={13} /></button>
                                <button onClick={() => openAdminUserEdit(u)} aria-label="Düzenle" className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition"><Pencil size={13} /></button>
                                <button onClick={() => toggleAdminUserStatus(u)} aria-label="Durumu değiştir" className={`w-8 h-8 rounded-lg border flex items-center justify-center transition ${u.status === "suspended" ? "border-green-200 text-green-600 hover:bg-green-50" : "border-red-200 text-red-500 hover:bg-red-50"}`}>{u.status === "suspended" ? <CheckCircle2 size={13} /> : <Ban size={13} />}</button>
                              </div>
                            </div>
                          ))}
                          {adminFilteredUsers.length === 0 && <p className="text-center text-gray-400 text-sm py-10">Sonuç bulunamadı</p>}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {adminTab === "tickets" && (
                  <div>
                    <div className="mb-4"><h1 className="text-xl font-bold text-gray-900">Destek Talepleri</h1><p className="text-sm text-gray-500">{supportTickets.length.toLocaleString("tr-TR")} talep{adminFilteredTickets.length !== supportTickets.length ? ` · ${adminFilteredTickets.length.toLocaleString("tr-TR")} filtreyle eşleşiyor` : ""}</p></div>
                    {!showTicketAnalytics && (<>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">Talep Listesi</p>
                      <div className="relative mb-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} /><input value={adminTicketSearch} onChange={(e) => { setAdminTicketSearch(e.target.value); setAdminTicketVisibleCount(25); }} placeholder="Konu veya kullanıcı adına göre ara..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                    </>)}
                    <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                      {[{ key: "all", label: "Tümü" }, { key: "open", label: "Açık" }, { key: "in_review", label: "İnceleniyor" }, { key: "resolved", label: "Çözüldü" }].map(f => (<button key={f.key} onClick={() => { setAdminTicketStatusFilter(f.key); setAdminTicketVisibleCount(25); setShowTicketAnalytics(false); }} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${adminTicketStatusFilter === f.key && !showTicketAnalytics ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{f.label}</button>))}
                      <button onClick={() => setShowTicketAnalytics(s => !s)} className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${showTicketAnalytics ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600"}`}><TrendingUp size={12} /> Genel Analiz</button>
                    </div>
                    {showTicketAnalytics && (
                      <div className="mb-4">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-3">
                          <div className="bg-white border border-gray-200 rounded-2xl p-3"><p className="text-xl font-bold text-gray-900">{adminTicketAnalytics.total.toLocaleString("tr-TR")}</p><p className="text-[11px] text-gray-500 mt-0.5">Toplam Talep</p></div>
                          <div className="bg-white border border-gray-200 rounded-2xl p-3"><p className="text-xl font-bold text-red-500">{adminTicketAnalytics.byStatus.open || 0}</p><p className="text-[11px] text-gray-500 mt-0.5">Açık</p></div>
                          <div className="bg-white border border-gray-200 rounded-2xl p-3"><p className="text-xl font-bold text-gray-600">{adminTicketAnalytics.byStatus.in_review || 0}</p><p className="text-[11px] text-gray-500 mt-0.5">İnceleniyor</p></div>
                          <div className="bg-white border border-gray-200 rounded-2xl p-3"><p className="text-xl font-bold text-green-600">{adminTicketAnalytics.byStatus.resolved || 0}</p><p className="text-[11px] text-gray-500 mt-0.5">Çözüldü</p></div>
                          <div className="bg-white border border-gray-200 rounded-2xl p-3"><p className="text-xl font-bold text-red-600">{adminTicketAnalytics.slaBreachedCount}</p><p className="text-[11px] text-gray-500 mt-0.5">SLA Aşan</p></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-white border border-gray-200 rounded-2xl p-4">
                            <h3 className="text-xs font-semibold text-gray-700 mb-3">Talep Türüne Göre Dağılım</h3>
                            <div className="space-y-2">
                              {adminTicketAnalytics.typeBreakdown.map(([type, count]) => { const max = adminTicketAnalytics.typeBreakdown[0][1]; return (
                                <div key={type} className="flex items-center gap-3">
                                  <span className="text-xs text-gray-600 w-32 flex-shrink-0 truncate">{ADMIN_TICKET_TYPE_LABELS[type] || type}</span>
                                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden"><div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.max(6, (count / max) * 100)}%` }} /></div>
                                  <span className="text-xs font-semibold text-gray-700 w-6 text-right flex-shrink-0">{count}</span>
                                </div>
                              ); })}
                            </div>
                          </div>
                          <div className="bg-white border border-gray-200 rounded-2xl p-4">
                            <h3 className="text-xs font-semibold text-gray-700 mb-3">Önceliğe Göre Dağılım{adminTicketAnalytics.avgResolutionDays !== null && <span className="text-gray-400 font-normal"> · Ort. çözüm süresi: {adminTicketAnalytics.avgResolutionDays} gün</span>}</h3>
                            <div className="space-y-2">
                              {["high", "medium", "low"].map(p => { const count = adminTicketAnalytics.byPriority[p] || 0; const max = Math.max(1, ...Object.values(adminTicketAnalytics.byPriority)); return (
                                <div key={p} className="flex items-center gap-3">
                                  <span className="text-xs text-gray-600 w-14 flex-shrink-0">{ADMIN_TICKET_PRIORITY_LABELS[p]}</span>
                                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden"><div className={`h-full rounded-full ${p === "high" ? "bg-red-500" : p === "medium" ? "bg-gray-500" : "bg-gray-300"}`} style={{ width: `${Math.max(6, (count / max) * 100)}%` }} /></div>
                                  <span className="text-xs font-semibold text-gray-700 w-6 text-right flex-shrink-0">{count}</span>
                                </div>
                              ); })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {!showTicketAnalytics && (<>
                      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                        <select value={adminTicketTypeFilter} onChange={(e) => { setAdminTicketTypeFilter(e.target.value); setAdminTicketVisibleCount(25); }} className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 bg-white text-gray-600">
                          <option value="all">Tüm Türler</option>
                          {Object.entries(ADMIN_TICKET_TYPE_LABELS).map(([k, label]) => (<option key={k} value={k}>{label}</option>))}
                        </select>
                        {[{ key: "all", label: "Tüm Öncelikler" }, { key: "high", label: "Yüksek" }, { key: "medium", label: "Orta" }, { key: "low", label: "Düşük" }].map(f => (<button key={f.key} onClick={() => { setAdminTicketPriorityFilter(f.key); setAdminTicketVisibleCount(25); }} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${adminTicketPriorityFilter === f.key ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>{f.label}</button>))}
                      </div>
                      <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
                        {adminFilteredTickets.slice(0, adminTicketVisibleCount).map(tk => (
                          <button key={tk.id} onClick={() => { setSelectedTicketId(tk.id); setAdminTicketNote(tk.adminNote || ""); }} className="w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-gray-50 transition">
                            <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${tk.status === "open" ? "bg-red-500" : tk.status === "in_review" ? "bg-gray-400" : "bg-green-500"}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-semibold text-gray-800">{tk.subject}</p><span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{ADMIN_TICKET_TYPE_LABELS[tk.type]}</span>{tk.priority === "high" && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 flex items-center gap-0.5"><AlertTriangle size={9} /> Yüksek</span>}{ticketSlaBreached(tk) && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-0.5"><AlertTriangle size={9} /> SLA Aşıldı ({ticketDaysOpen(tk)}g)</span>}</div>
                              <p className="text-xs text-gray-400 mt-0.5 truncate">{tk.fromName} ({tk.fromType === "mechanic" ? "Tamirci" : "Araç Sahibi"}) · {tk.relatedNote}</p>
                            </div>
                            <span className="text-[10px] text-gray-300 flex-shrink-0">{tk.createdDate}</span>
                          </button>
                        ))}
                        {adminFilteredTickets.length === 0 && <p className="text-center text-gray-400 text-sm py-10">Bu filtreye uyan talep yok</p>}
                      </div>
                      {adminFilteredTickets.length > 0 && (
                        <div className="mt-3">
                          {adminFilteredTickets.length > adminTicketVisibleCount && (
                            <button onClick={() => setAdminTicketVisibleCount(c => c + 25)} className="w-full py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 transition">Daha Fazla Yükle ({(adminFilteredTickets.length - adminTicketVisibleCount).toLocaleString("tr-TR")} kaldı)</button>
                          )}
                          <p className="text-center text-[11px] text-gray-400 mt-2">{Math.min(adminTicketVisibleCount, adminFilteredTickets.length).toLocaleString("tr-TR")} / {adminFilteredTickets.length.toLocaleString("tr-TR")} talep gösteriliyor</p>
                        </div>
                      )}
                    </>)}
                  </div>
                )}
                {adminTab === "analytics" && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 mb-1">Analitik</h1>
                    <p className="text-sm text-gray-500 mb-6">Büyüme, gelir ve bölgesel dağılım (son 6 ay, tahmini)</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                      <div className="bg-white border border-gray-200 rounded-2xl p-4"><div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center mb-3"><Banknote size={16} className="text-rose-600" /></div><p className="text-2xl font-bold text-gray-900">{adminRevenueStats.estCommission.toLocaleString("tr-TR")}₺</p><p className="text-xs text-gray-500 mt-0.5">Tahmini Platform Geliri (%{Math.round(PLATFORM_COMMISSION_RATE * 100)} komisyon)</p></div>
                      <div className="bg-white border border-gray-200 rounded-2xl p-4"><div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center mb-3"><TrendingUp size={16} className="text-rose-600" /></div><p className="text-2xl font-bold text-gray-900">{adminRevenueStats.estGMV.toLocaleString("tr-TR")}₺</p><p className="text-xs text-gray-500 mt-0.5">Tahmini İşlem Hacmi (GMV) · {adminRevenueStats.completedCount} tamamlanan randevu</p></div>
                      <div className="bg-white border border-gray-200 rounded-2xl p-4"><div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center mb-3"><Calendar size={16} className="text-rose-600" /></div><p className="text-2xl font-bold text-gray-900">{adminRevenueStats.avgTicket.toLocaleString("tr-TR")}₺</p><p className="text-xs text-gray-500 mt-0.5">Ortalama İşlem Bedeli</p></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-white border border-gray-200 rounded-2xl p-4"><h3 className="text-xs font-semibold text-gray-700 mb-3">Toplam Kullanıcı (kümülatif)</h3><MiniBarChart labels={ADMIN_TREND_DATA.months} values={ADMIN_TREND_DATA.signups} colorClass="bg-gray-800" /></div>
                      <div className="bg-white border border-gray-200 rounded-2xl p-4"><h3 className="text-xs font-semibold text-gray-700 mb-3">Aylık Randevu</h3><MiniBarChart labels={ADMIN_TREND_DATA.months} values={ADMIN_TREND_DATA.appointments} colorClass="bg-rose-500" /></div>
                      <div className="bg-white border border-gray-200 rounded-2xl p-4"><h3 className="text-xs font-semibold text-gray-700 mb-3">Aylık Tahmini Gelir</h3><MiniBarChart labels={ADMIN_TREND_DATA.months} values={ADMIN_TREND_DATA.revenue} colorClass="bg-green-500" valueFormat={(v) => `${(v / 1000).toFixed(1)}k₺`} /></div>
                    </div>
                    <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><MapPin size={15} className="text-rose-500" /> Şehir / Bölge Dağılımı</h2>
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2.5">
                      {adminRegionBreakdown.map(([city, count]) => { const max = adminRegionBreakdown[0][1]; return (
                        <div key={city} className="flex items-center gap-3">
                          <span className="text-xs text-gray-600 w-24 flex-shrink-0 truncate">{city}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden"><div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.max(6, (count / max) * 100)}%` }} /></div>
                          <span className="text-xs font-semibold text-gray-700 w-6 text-right flex-shrink-0">{count}</span>
                        </div>
                      ); })}
                    </div>
                    <h2 className="text-sm font-semibold text-gray-800 mb-3 mt-6 flex items-center gap-2"><Share2 size={15} className="text-rose-500" /> Paylaşım Performansı</h2>
                    {!shareStats ? (
                      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-400">Yükleniyor…</div>
                    ) : shareStats.totals.shares === 0 ? (
                      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-400">Henüz kayıtlı bir paylaşım yok.</div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                          <div className="bg-white border border-gray-200 rounded-2xl p-4"><p className="text-2xl font-bold text-gray-900">{shareStats.totals.shares}</p><p className="text-xs text-gray-500 mt-0.5">Toplam Paylaşım</p></div>
                          <div className="bg-white border border-gray-200 rounded-2xl p-4"><p className="text-2xl font-bold text-gray-900">{shareStats.totals.clicks}</p><p className="text-xs text-gray-500 mt-0.5">Toplam Tıklama</p></div>
                          <div className="bg-white border border-gray-200 rounded-2xl p-4"><p className="text-2xl font-bold text-gray-900">{shareStats.totals.conversions}</p><p className="text-xs text-gray-500 mt-0.5">Toplam Dönüşüm (sohbet/randevu/teklif/başvuru)</p></div>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">Kanala Göre Kırılım</p>
                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
                          <table className="w-full text-sm">
                            <thead><tr className="border-b border-gray-100 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400"><th className="px-4 py-2.5">Kanal</th><th className="px-4 py-2.5 text-right">Paylaşım</th><th className="px-4 py-2.5 text-right">Tıklama</th><th className="px-4 py-2.5 text-right">Dönüşüm</th><th className="px-4 py-2.5 text-right">Dönüşüm Oranı</th></tr></thead>
                            <tbody>
                              {shareStats.byChannel.map((row) => (
                                <tr key={row.channel} className="border-b border-gray-50 last:border-0">
                                  <td className="px-4 py-2.5 font-medium text-gray-800">{SHARE_CHANNEL_LABELS[row.channel] || row.channel}</td>
                                  <td className="px-4 py-2.5 text-right text-gray-600">{row.shares}</td>
                                  <td className="px-4 py-2.5 text-right text-gray-600">{row.clicks}</td>
                                  <td className="px-4 py-2.5 text-right text-gray-600">{row.conversions}</td>
                                  <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{row.clicks > 0 ? `%${Math.round((row.conversions / row.clicks) * 100)}` : "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">En Çok Paylaşılan İçerikler</p>
                        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2.5">
                          {shareStats.byTarget.map((row) => (
                            <div key={`${row.targetType}:${row.targetId}`} className="flex items-center gap-3">
                              <span className="text-xs text-gray-600 flex-1 truncate">{adminChangeTargetLabel(row.targetType, row.targetId)}</span>
                              <span className="text-[10px] text-gray-400">{row.shares} paylaşım</span>
                              <span className="text-[10px] text-gray-400">{row.clicks} tıklama</span>
                              <span className="text-[10px] font-semibold text-gray-700">{row.conversions} dönüşüm</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    <h2 className="text-sm font-semibold text-gray-800 mb-3 mt-6 flex items-center gap-2"><Eye size={15} className="text-rose-500" /> Sayfa Ziyaretleri</h2>
                    {!viewStats ? (
                      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-400">Yükleniyor…</div>
                    ) : viewStats.totals.views === 0 ? (
                      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-400">Henüz kayıtlı bir ziyaret yok.</div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                          <div className="bg-white border border-gray-200 rounded-2xl p-4"><p className="text-2xl font-bold text-gray-900">{viewStats.totals.views}</p><p className="text-xs text-gray-500 mt-0.5">Toplam Sayfa Görüntülemesi</p></div>
                          <div className="bg-white border border-gray-200 rounded-2xl p-4"><p className="text-2xl font-bold text-gray-900">{viewStats.totals.conversions}</p><p className="text-xs text-gray-500 mt-0.5">Randevuya Dönüşen Ziyaret</p></div>
                          <div className="bg-white border border-gray-200 rounded-2xl p-4"><p className="text-2xl font-bold text-gray-900">%{viewStats.totals.views > 0 ? Math.round((viewStats.totals.conversions / viewStats.totals.views) * 100) : 0}</p><p className="text-xs text-gray-500 mt-0.5">Genel Dönüşüm Oranı</p></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">En Çok Ziyaret Edilen Tamirciler</p>
                            <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2.5">
                              {viewStats.topMechanics.length === 0 ? <p className="text-xs text-gray-400 text-center py-2">Henüz veri yok.</p> : viewStats.topMechanics.map((row) => (
                                <div key={row.targetId} className="flex items-center gap-3">
                                  <span className="text-xs text-gray-600 flex-1 truncate">{adminChangeTargetLabel("mechanic", row.targetId)}</span>
                                  <span className="text-[10px] text-gray-400">{row.views} ziyaret</span>
                                  <span className="text-[10px] font-semibold text-gray-700">{row.conversions} randevu</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">En Çok Görüntülenen İlanlar</p>
                            <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2.5">
                              {viewStats.topListings.length === 0 ? <p className="text-xs text-gray-400 text-center py-2">Henüz veri yok.</p> : viewStats.topListings.map((row) => (
                                <div key={row.targetId} className="flex items-center gap-3">
                                  <span className="text-xs text-gray-600 flex-1 truncate">{adminChangeTargetLabel("listing", row.targetId)}</span>
                                  <span className="text-[10px] font-semibold text-gray-700">{row.views} görüntülenme</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {adminTab === "history" && (
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 mb-1">Değişiklik Geçmişi</h1>
                    <p className="text-sm text-gray-500 mb-6">Panelden yapılan her düzenleme burada — hangi hesapta olursa olsun, istediğin an tek tıkla geri alabilirsin.</p>
                    {adminChangeLog.length === 0 ? (
                      <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl"><History size={36} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-400 text-sm">Henüz bir değişiklik yapılmadı.</p></div>
                    ) : (
                      <div className="space-y-2">
                        {adminChangeLogGrouped.map(group => {
                          const expanded = !!expandedHistoryGroups[group.key];
                          const pendingCount = group.entries.filter(e => !e.reverted).length;
                          const TypeIcon = group.typeMeta.icon;
                          return (
                            <div key={group.key} className={`bg-white border rounded-2xl overflow-hidden ${pendingCount === 0 ? "border-gray-100 opacity-60" : "border-gray-200"}`}>
                              <button onClick={() => toggleHistoryGroup(group.key)} className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-gray-50 transition">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0"><TypeIcon size={15} className="text-gray-500" /></div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-semibold text-gray-800 truncate">{group.targetLabel}</span>
                                      <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{group.typeMeta.label}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-0.5">{group.entries.length} değişiklik{pendingCount < group.entries.length ? ` · ${group.entries.length - pendingCount} geri alındı` : ""} · son: {group.entries[0].date}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <button onClick={(e) => { e.stopPropagation(); revertAdminChangeGroup(group); }} disabled={pendingCount === 0} className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition ${pendingCount === 0 ? "bg-gray-50 text-gray-300 cursor-not-allowed" : "bg-gray-900 text-white hover:bg-gray-800"}`}><History size={11} /> Tümünü Geri Al</button>
                                  <ChevronRight size={16} className={`text-gray-300 transition-transform ${expanded ? "rotate-90" : ""}`} />
                                </div>
                              </button>
                              {expanded && (
                                <div className="border-t border-gray-100 divide-y divide-gray-100">
                                  {group.entries.map(entry => (
                                    <div key={entry.id} className="flex items-start justify-between gap-3 px-4 py-3">
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                          <span className="text-[11px] font-semibold text-gray-600">{adminFieldLabel(entry.field)}</span>
                                          {entry.reverted && <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 size={10} /> Geri Alındı</span>}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                          <span className="line-through text-gray-400">{formatAdminHistoryValue(entry.field, entry.oldValue)}</span>
                                          <span className="mx-1.5 text-gray-300">→</span>
                                          <span className="text-gray-700 font-medium">{formatAdminHistoryValue(entry.field, entry.newValue)}</span>
                                        </p>
                                        <p className="text-[10px] text-gray-300 mt-0.5">{entry.date}</p>
                                      </div>
                                      <button onClick={() => revertAdminChange(entry)} disabled={entry.reverted} className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg flex-shrink-0 transition ${entry.reverted ? "bg-gray-50 text-gray-300 cursor-not-allowed" : "border border-gray-200 text-gray-600 hover:bg-gray-100"}`}>Geri Al</button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {selectedAdminUser && adminEditForm && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4" onClick={() => { setSelectedAdminUser(null); setAdminEditForm(null); }}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[88vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-base font-bold text-gray-900">Kullanıcıyı Düzenle</h3>
                    <button onClick={() => openAdminProfileView(selectedAdminUser)} className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 flex-shrink-0"><Eye size={12} /> Tam Profili Görüntüle</button>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">{selectedAdminUser.type === "mechanic" ? "Tamirci" : "Araç Sahibi"} hesabı</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Hesap Bilgileri</p>
                  <div className="space-y-3">
                    <div><label className="text-[11px] font-medium text-gray-500 mb-1 block">Ad Soyad / İşletme</label><input value={adminEditForm.name} onChange={(e) => setAdminEditForm({ ...adminEditForm, name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                    <div><label className="text-[11px] font-medium text-gray-500 mb-1 block">E-posta</label><input value={adminEditForm.email} onChange={(e) => setAdminEditForm({ ...adminEditForm, email: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                    <div><label className="text-[11px] font-medium text-gray-500 mb-1 block">Telefon</label><input value={adminEditForm.phone} onChange={(e) => setAdminEditForm({ ...adminEditForm, phone: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                    <div><label className="text-[11px] font-medium text-gray-500 mb-1 block">Şehir</label><input value={adminEditForm.city} onChange={(e) => setAdminEditForm({ ...adminEditForm, city: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                  </div>
                  {selectedAdminUser.type === "mechanic" && (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-5 mb-2">İşletme Profili</p>
                      <div className="space-y-3">
                        <div><label className="text-[11px] font-medium text-gray-500 mb-1 block">Uzmanlık Alanı</label><input value={adminEditForm.specialty} onChange={(e) => setAdminEditForm({ ...adminEditForm, specialty: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                        <div><label className="text-[11px] font-medium text-gray-500 mb-1 block">Adres</label><input value={adminEditForm.address} onChange={(e) => setAdminEditForm({ ...adminEditForm, address: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                        <div><label className="text-[11px] font-medium text-gray-500 mb-1 block">Başlangıç Fiyatı (₺)</label><input value={adminEditForm.price} onChange={(e) => setAdminEditForm({ ...adminEditForm, price: e.target.value.replace(/[^0-9]/g, "") })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                        <div><label className="text-[11px] font-medium text-gray-500 mb-1 block">Doğrulama Rozeti</label>
                          <div className="flex gap-2">
                            <button onClick={() => setAdminEditForm({ ...adminEditForm, verified: true })} className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1 ${adminEditForm.verified ? "bg-rose-50 border-rose-200 text-rose-600" : "border-gray-200 text-gray-400"}`}><BadgeCheck size={13} /> Doğrulanmış</button>
                            <button onClick={() => setAdminEditForm({ ...adminEditForm, verified: false })} className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${!adminEditForm.verified ? "bg-gray-100 border-gray-300 text-gray-700" : "border-gray-200 text-gray-400"}`}>Doğrulanmamış</button>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-5 mb-2">Doğrulama Belgeleri</p>
                      {(selectedAdminUser.verificationDocs || []).length === 0 ? (
                        <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">Henüz belge gönderilmedi.</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedAdminUser.verificationDocs.map((d, i) => (
                            <div key={i} className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
                              <FileText size={14} className="text-rose-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0"><p className="text-xs font-medium text-gray-700 truncate">{d.name}</p><p className="text-[10px] text-gray-400">{d.type} · {d.uploadedDate}</p></div>
                              <button onClick={() => setToast({ type: "info", text: "📄 Bu bir demo belgesidir, gerçek dosya içeriği bulunmuyor." })} className="text-[11px] font-medium text-rose-600 hover:text-rose-700 flex-shrink-0">Görüntüle</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-5 mb-2">Hesap Durumu</p>
                  <div className="flex gap-2">
                    <button onClick={() => setAdminEditForm({ ...adminEditForm, status: "active" })} className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${adminEditForm.status === "active" ? "bg-green-50 border-green-200 text-green-600" : "border-gray-200 text-gray-400"}`}>Aktif</button>
                    <button onClick={() => setAdminEditForm({ ...adminEditForm, status: "suspended" })} className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${adminEditForm.status === "suspended" ? "bg-red-50 border-red-200 text-red-500" : "border-gray-200 text-gray-400"}`}>Askıya Al</button>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-5 mb-2">Şifre Yönetimi</p>
                  <div className="flex gap-2 mb-2">
                    <input type="text" value={adminEditForm.newPassword} onChange={(e) => setAdminEditForm({ ...adminEditForm, newPassword: e.target.value })} placeholder="Yeni şifre belirle" className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                    <button onClick={resetUserPassword} disabled={!adminEditForm.newPassword.trim()} className={`px-3 rounded-xl text-xs font-semibold transition flex-shrink-0 ${adminEditForm.newPassword.trim() ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}>Güncelle</button>
                  </div>
                  <button onClick={sendPasswordResetLink} className="w-full border border-gray-200 text-gray-600 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-1.5"><Mail size={12} /> Şifre Sıfırlama Bağlantısı Gönder</button>
                  <div className="flex gap-2 mt-5">
                    <button onClick={() => { setSelectedAdminUser(null); setAdminEditForm(null); }} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium">Vazgeç</button>
                    <button onClick={saveAdminUserEdit} className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition">Kaydet</button>
                  </div>
                </div>
              </div>
            )}
            {selectedTicket && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4" onClick={() => setSelectedTicketId(null)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-start justify-between mb-3">
                    <div><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{ADMIN_TICKET_TYPE_LABELS[selectedTicket.type]}</span><h3 className="text-base font-bold text-gray-900 mt-2">{selectedTicket.subject}</h3></div>
                    <button onClick={() => setSelectedTicketId(null)} aria-label="Kapat" className="text-gray-300 hover:text-gray-500 p-1 -m-1"><X size={18} /></button>
                  </div>
                  <p className="text-xs text-gray-400 mb-1">{selectedTicket.fromName} ({selectedTicket.fromType === "mechanic" ? "Tamirci" : "Araç Sahibi"}) · {selectedTicket.relatedNote} · {selectedTicket.createdDate}</p>
                  <p className={`text-[11px] mb-3 flex items-center gap-1 ${ticketSlaBreached(selectedTicket) ? "text-red-500 font-semibold" : "text-gray-400"}`}>{ticketSlaBreached(selectedTicket) && <AlertTriangle size={11} />} {ticketDaysOpen(selectedTicket)} gündür açık{ticketSlaBreached(selectedTicket) ? ` · SLA hedefi (${ADMIN_SLA_DAYS[selectedTicket.priority] || 5}g) aşıldı` : ""}</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 mb-3 leading-relaxed">{selectedTicket.description}</p>
                  {(selectedTicket.adminReplies || []).length > 0 && (
                    <div className="space-y-2 mb-3">
                      {selectedTicket.adminReplies.map((r, i) => (
                        <div key={i} className="bg-gray-900 text-white rounded-xl p-3 ml-6"><p className="text-[9px] text-gray-400 mb-1">Yönetici · {r.date}</p><p className="text-xs leading-relaxed">{r.text}</p></div>
                      ))}
                    </div>
                  )}
                  {selectedTicket.type === "payment" && (
                    selectedTicket.refunded ? (
                      <p className="text-xs text-green-600 bg-green-50 rounded-xl p-2.5 mb-4 flex items-center gap-1.5"><CheckCircle2 size={13} /> Kapora iade edildi, randevu iptal edildi.</p>
                    ) : (
                      <button onClick={() => issueTicketRefund(selectedTicket.id)} className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-800 transition mb-4 flex items-center justify-center gap-1.5"><Banknote size={13} /> Kaporayı İade Et / Randevuyu İptal Et</button>
                    )
                  )}
                  {selectedTicket.type === "listing" && (() => {
                    const lidMatch = selectedTicket.relatedNote.match(/#(\d+)/);
                    const lst = lidMatch ? listings.find(l => l.id === Number(lidMatch[1])) : null;
                    if (!lst) return null;
                    return lst.adminRemoved ? (
                      <p className="text-xs text-green-600 bg-green-50 rounded-xl p-2.5 mb-4 flex items-center gap-1.5"><CheckCircle2 size={13} /> İlan platformdan kaldırıldı.</p>
                    ) : (
                      <button onClick={() => removeReportedListing(selectedTicket.id)} className="w-full bg-red-500 text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-red-600 transition mb-4 flex items-center justify-center gap-1.5"><Ban size={13} /> İlanı Kaldır</button>
                    );
                  })()}
                  {selectedTicket.type === "review" && (() => {
                    const mech = mechanicsList.find(m => m.name === selectedTicket.fromName);
                    if (!mech) return null;
                    const hasFlagged = (mech.reviewList || []).some(r => r.flagged);
                    return hasFlagged ? (
                      <button onClick={() => removeFlaggedReview(selectedTicket.id)} className="w-full bg-red-500 text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-red-600 transition mb-4 flex items-center justify-center gap-1.5"><Trash2 size={13} /> Yorumu Kaldır</button>
                    ) : (
                      <p className="text-xs text-green-600 bg-green-50 rounded-xl p-2.5 mb-4 flex items-center gap-1.5"><CheckCircle2 size={13} /> İşaretli yorum kaldırıldı.</p>
                    );
                  })()}
                  {selectedTicket.type === "verification" && (() => {
                    const mech = mechanicsList.find(m => m.name === selectedTicket.fromName);
                    if (!mech) return null;
                    return mech.verified ? (
                      <p className="text-xs text-green-600 bg-green-50 rounded-xl p-2.5 mb-4 flex items-center gap-1.5"><BadgeCheck size={13} /> Tamirci doğrulandı.</p>
                    ) : (
                      <button onClick={() => grantVerification(selectedTicket.id)} className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-800 transition mb-4 flex items-center justify-center gap-1.5"><BadgeCheck size={13} /> Doğrula ve Rozeti Ver</button>
                    );
                  })()}
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Kullanıcıya Mesaj Gönder</label>
                  <div className="flex gap-2 mb-4">
                    <input value={adminReplyDraft} onChange={(e) => setAdminReplyDraft(e.target.value)} placeholder="Kullanıcıya yanıt yazın..." className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" onKeyDown={(e) => { if (e.key === "Enter") sendAdminReply(selectedTicket.id); }} />
                    <button onClick={() => sendAdminReply(selectedTicket.id)} disabled={!adminReplyDraft.trim()} aria-label="Gönder" className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition ${adminReplyDraft.trim() ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}><Send size={15} /></button>
                  </div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Dahili Yönetici Notu</label>
                  <textarea value={adminTicketNote} onChange={(e) => setAdminTicketNote(e.target.value)} rows={3} placeholder="Bu talep hakkında not ekleyin (yalnızca ekip içi)..." className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm mb-3 resize-none" />
                  <button onClick={saveTicketNote} className="w-full border border-gray-200 text-gray-600 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 transition mb-4">Notu Kaydet</button>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => updateTicketStatus(selectedTicket.id, "open")} className={`py-2 rounded-xl text-xs font-semibold border transition ${selectedTicket.status === "open" ? "bg-red-50 border-red-200 text-red-500" : "border-gray-200 text-gray-400"}`}>Açık</button>
                    <button onClick={() => updateTicketStatus(selectedTicket.id, "in_review")} className={`py-2 rounded-xl text-xs font-semibold border transition ${selectedTicket.status === "in_review" ? "bg-gray-100 border-gray-300 text-gray-700" : "border-gray-200 text-gray-400"}`}>İnceleniyor</button>
                    <button onClick={() => updateTicketStatus(selectedTicket.id, "resolved")} className={`py-2 rounded-xl text-xs font-semibold border transition ${selectedTicket.status === "resolved" ? "bg-green-50 border-green-200 text-green-600" : "border-gray-200 text-gray-400"}`}>Çözüldü</button>
                  </div>
                </div>
              </div>
            )}
            {showBroadcastModal && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[85] flex items-center justify-center p-4" onClick={() => setShowBroadcastModal(false)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2"><Megaphone size={16} className="text-rose-600" /> Duyuru Gönder</h3>
                  <p className="text-xs text-gray-400 mb-4">Tüm platforma ya da seçtiğin gruba anlık duyuru gönder (demo).</p>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Kime</label>
                  <div className="flex gap-2 mb-3">
                    {[{ key: "all", label: `Tümü (${adminAllUsers.length})` }, { key: "owner", label: `Araç Sahipleri (${adminStats.totalOwners})` }, { key: "mechanic", label: `Tamirciler (${adminStats.totalMechanics})` }].map(o => (
                      <button key={o.key} onClick={() => setBroadcastForm({ ...broadcastForm, audience: o.key })} className={`flex-1 py-2 rounded-xl text-[11px] font-semibold border transition ${broadcastForm.audience === o.key ? "bg-gray-900 border-gray-900 text-white" : "border-gray-200 text-gray-500"}`}>{o.label}</button>
                    ))}
                  </div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Mesaj</label>
                  <textarea value={broadcastForm.message} onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })} rows={4} placeholder="Örn: Yarın 02:00-04:00 arası bakım nedeniyle kısa süreli erişim kesintisi yaşanabilir." className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none mb-4" />
                  <div className="flex gap-2">
                    <button onClick={() => setShowBroadcastModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium">Vazgeç</button>
                    <button disabled={!broadcastForm.message.trim()} onClick={sendBroadcast} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${broadcastForm.message.trim() ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>Gönder</button>
                  </div>
                </div>
              </div>
            )}
            {analyzingUser && adminUserAnalytics && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[85] flex items-center justify-center p-4" onClick={() => setAdminAnalyzeUserKey(null)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-start justify-between mb-4">
                    <div><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{analyzingUser.type === "mechanic" ? "Tamirci Analizi" : "Araç Sahibi Analizi"}</span><h3 className="text-base font-bold text-gray-900 mt-2">{analyzingUser.name}</h3></div>
                    <button onClick={() => setAdminAnalyzeUserKey(null)} aria-label="Kapat" className="text-gray-300 hover:text-gray-500 p-1 -m-1"><X size={18} /></button>
                  </div>
                  {analyzingUser.type === "owner" ? (
                    <>
                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="bg-gray-50 rounded-2xl p-4"><p className="text-2xl font-bold text-gray-900">{adminUserAnalytics.apptCount}</p><p className="text-xs text-gray-500 mt-0.5">Toplam Randevu</p></div>
                        <div className="bg-gray-50 rounded-2xl p-4"><p className="text-2xl font-bold text-gray-900">{adminUserAnalytics.listingCount}</p><p className="text-xs text-gray-500 mt-0.5">Toplam İlan</p></div>
                        <div className="bg-gray-50 rounded-2xl p-4"><p className="text-2xl font-bold text-gray-900">{adminUserAnalytics.activeListings}</p><p className="text-xs text-gray-500 mt-0.5">Aktif İlan</p></div>
                        <div className="bg-gray-50 rounded-2xl p-4"><p className="text-2xl font-bold text-gray-900">{adminUserAnalytics.soldListings}</p><p className="text-xs text-gray-500 mt-0.5">Satılan İlan</p></div>
                        <div className="bg-gray-50 rounded-2xl p-4"><p className="text-2xl font-bold text-gray-900 flex items-center gap-1.5"><Share2 size={16} className="text-gray-400" /> {adminUserAnalytics.totalShares}</p><p className="text-xs text-gray-500 mt-0.5">Toplam Paylaşım</p></div>
                      </div>
                      {Object.keys(adminUserAnalytics.byStatus).length > 0 && (
                        <>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Randevu Durum Dağılımı</p>
                          <div className="bg-gray-50 rounded-2xl p-4 mb-5 space-y-2">
                            {Object.entries(adminUserAnalytics.byStatus).map(([status, count]) => (
                              <div key={status} className="flex items-center gap-3"><span className="text-xs text-gray-600 w-32 flex-shrink-0 truncate">{status}</span><div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden"><div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.max(6, (count / adminUserAnalytics.apptCount) * 100)}%` }} /></div><span className="text-xs font-semibold text-gray-700 w-5 text-right flex-shrink-0">{count}</span></div>
                            ))}
                          </div>
                        </>
                      )}
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Destek Talepleri</p>
                      <div className="bg-gray-50 rounded-2xl p-4"><p className="text-sm text-gray-700">{adminUserAnalytics.ticketCount} talep açtı, {adminUserAnalytics.openTickets} tanesi hâlâ açık.</p></div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="bg-gray-50 rounded-2xl p-4"><p className="text-2xl font-bold text-gray-900">{adminUserAnalytics.estRevenue.toLocaleString("tr-TR")}₺</p><p className="text-xs text-gray-500 mt-0.5">Tahmini Ciro</p></div>
                        <div className="bg-gray-50 rounded-2xl p-4"><p className="text-2xl font-bold text-gray-900">{adminUserAnalytics.completed}/{adminUserAnalytics.apptCount}</p><p className="text-xs text-gray-500 mt-0.5">Tamamlanan Randevu</p></div>
                        <div className="bg-gray-50 rounded-2xl p-4"><p className="text-2xl font-bold text-gray-900">{adminUserAnalytics.activeListings}/{adminUserAnalytics.listingCount}</p><p className="text-xs text-gray-500 mt-0.5">Aktif Araç İlanı</p></div>
                        <div className="bg-gray-50 rounded-2xl p-4"><p className="text-2xl font-bold text-gray-900">{adminUserAnalytics.activeJobs}/{adminUserAnalytics.jobCount}</p><p className="text-xs text-gray-500 mt-0.5">Aktif İş İlanı</p></div>
                        <div className="bg-gray-50 rounded-2xl p-4"><p className="text-2xl font-bold text-gray-900 flex items-center gap-1.5"><Share2 size={16} className="text-gray-400" /> {adminUserAnalytics.totalShares}</p><p className="text-xs text-gray-500 mt-0.5">Toplam Paylaşım</p></div>
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Genel</p>
                      <div className="bg-gray-50 rounded-2xl p-4 mb-5 space-y-1.5">
                        <div className="flex items-center justify-between text-sm"><span className="text-gray-500">Puan</span><span className="font-semibold text-gray-800 flex items-center gap-1"><Star size={12} className="text-gray-900 fill-gray-900" /> {(analyzingUser as any).rating || mechanicsList.find(m => m.id === analyzingUser.id)?.rating} ({mechanicsList.find(m => m.id === analyzingUser.id)?.reviews} değerlendirme)</span></div>
                        <div className="flex items-center justify-between text-sm"><span className="text-gray-500">Ort. Yanıt Süresi</span><span className="font-semibold text-gray-800">{mechanicsList.find(m => m.id === analyzingUser.id)?.avgResponseMinutes} dk</span></div>
                        <div className="flex items-center justify-between text-sm"><span className="text-gray-500">İş İlanlarına Toplam Başvuru</span><span className="font-semibold text-gray-800">{adminUserAnalytics.totalApplicants}</span></div>
                        <div className="flex items-center justify-between text-sm"><span className="text-gray-500">Profil Paylaşılma Sayısı</span><span className="font-semibold text-gray-800">{adminUserAnalytics.ownShareCount}</span></div>
                      </div>
                      {Object.keys(adminUserAnalytics.byStatus).length > 0 && (
                        <>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Randevu Durum Dağılımı</p>
                          <div className="bg-gray-50 rounded-2xl p-4 mb-5 space-y-2">
                            {Object.entries(adminUserAnalytics.byStatus).map(([status, count]) => (
                              <div key={status} className="flex items-center gap-3"><span className="text-xs text-gray-600 w-32 flex-shrink-0 truncate">{status}</span><div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden"><div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.max(6, (count / adminUserAnalytics.apptCount) * 100)}%` }} /></div><span className="text-xs font-semibold text-gray-700 w-5 text-right flex-shrink-0">{count}</span></div>
                            ))}
                          </div>
                        </>
                      )}
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Destek Talepleri</p>
                      <div className="bg-gray-50 rounded-2xl p-4"><p className="text-sm text-gray-700">{adminUserAnalytics.ticketCount} talep var, {adminUserAnalytics.openTickets} tanesi hâlâ açık.</p></div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          ); })()}
        {screen === "owner" && !onboardingVisible && (
          <>
            <div className="bg-gradient-to-b from-rose-50 to-white text-gray-900 px-5 md:px-8 pt-6 pb-5 border-b border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3 max-w-7xl mx-auto w-full relative md:hidden">
                <span className="text-xs text-gray-500">{t("greetingHello")}{ownerProfile.name ? `, ${ownerProfile.name}` : ""} 👋</span>
                <div className="flex items-center gap-2.5">
                  <NotifBell />
                  <button onClick={() => { setScreen("ownerProfilePage"); setOwnerProfileTab("info"); }} className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden text-xs font-bold text-gray-700 hover:bg-gray-200 transition">{ownerProfile.photo ? <img src={ownerProfile.photo} alt={ownerProfile.name || t("profilePhotoAlt")} className="w-full h-full object-cover" /> : initials(ownerProfile.name || "AS")}</button>
                </div>
              </div>
              <div className="hidden md:flex items-center justify-between max-w-7xl mx-auto w-full relative mb-5">
                <div className="flex items-center gap-2 flex-shrink-0"><div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center"><Wrench size={16} className="text-white" /></div><span className="text-lg font-extrabold text-gray-900">Fix<span className="text-rose-600">perto</span></span></div>
                {/* GÜVENLİK/UX DÜZELTMESİ (kullanıcı geri bildirimi): bu "Tamirci Ara / Araç Ara / İş
                    İlanları" hızlı-arama sekmeleri sadece keşif (search) ekranında anlamlı — önceden
                    ownerTab ne olursa olsun (ör. Randevularım) hep görünüyordu, sadece "aktif" vurgusu
                    doğruydu. Artık ownerTab === "search" değilken bu sekme grubu tamamen gizleniyor. */}
                {ownerTab === "search" && (
                <div className="flex items-center gap-8">
                  {[{ key: "mechanics", label: t("findMechanic"), icon: Wrench }, { key: "cars", label: t("findCar"), icon: Car }, { key: "jobs", label: t("jobListingsNavLabel"), icon: Briefcase }].map(tab => {
                    const Icon = tab.icon; const active = ownerMode === tab.key;
                    return (<button key={tab.key} onClick={() => { setOwnerMode(tab.key); setOwnerTab("search"); setQuery(""); }} className="relative flex items-center gap-1.5 pb-3 pt-1"><Icon size={16} className={active ? "text-gray-900" : "text-gray-400"} /><span className={`text-sm font-extrabold tracking-tight ${active ? "text-gray-900" : "text-gray-500"}`}>{tab.label}</span>{active && <span className="absolute -bottom-[1px] left-0 right-0 h-0.5 bg-gray-900 rounded-full" />}</button>);
                  })}
                  <button onClick={() => setShowQuoteModal(true)} className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-extrabold tracking-tight px-3.5 py-1.5 rounded-full transition whitespace-nowrap"><Users size={13} /> {t("multiQuoteBtn")}</button>
                </div>
                )}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <NotifBell />
                  <button onClick={() => { setScreen("ownerProfilePage"); setOwnerProfileTab("info"); }} title={t("profileAndSettingsTitle")} className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden text-xs font-bold text-gray-700 hover:bg-gray-200 transition">{ownerProfile.photo ? <img src={ownerProfile.photo} alt={ownerProfile.name || t("profilePhotoAlt")} className="w-full h-full object-cover" /> : initials(ownerProfile.name || "AS")}</button>
                </div>
              </div>
              <div className="max-w-7xl mx-auto w-full relative">
                {(ownerTab === "search") && (<>
                  <div className={`transition-all duration-300 ease-out overflow-hidden ${heroCollapsed ? "max-h-0 opacity-0 -translate-y-3 mb-0 pointer-events-none" : "max-h-56 opacity-100 translate-y-0 mb-4"}`}>
                    <div className="flex flex-col items-center gap-2 mb-4 md:hidden">
                      <div className="inline-flex items-center gap-0.5 bg-gray-100 rounded-full p-1">
                        <button onClick={() => { setOwnerMode("mechanics"); setQuery(""); }} className={`px-3.5 py-2 rounded-full text-xs font-extrabold tracking-tight transition flex items-center gap-1.5 ${ownerMode === "mechanics" ? "bg-white text-rose-600 shadow-sm" : "text-gray-500"}`}><Wrench size={13} /> {t("findMechanic")}</button>
                        <button onClick={() => { setOwnerMode("cars"); setQuery(""); }} className={`px-3.5 py-2 rounded-full text-xs font-extrabold tracking-tight transition flex items-center gap-1.5 ${ownerMode === "cars" ? "bg-white text-rose-600 shadow-sm" : "text-gray-500"}`}><Car size={13} /> {t("findCar")}</button>
                        <button onClick={() => { setOwnerMode("jobs"); setQuery(""); }} className={`px-3.5 py-2 rounded-full text-xs font-extrabold tracking-tight transition flex items-center gap-1.5 ${ownerMode === "jobs" ? "bg-white text-rose-600 shadow-sm" : "text-gray-500"}`}><Briefcase size={13} /> {t("jobListingsNavLabel")}</button>
                      </div>
                      <button onClick={() => setShowQuoteModal(true)} className="px-3.5 py-2 rounded-full text-xs font-extrabold tracking-tight transition flex items-center gap-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100"><Users size={13} /> {t("multiQuoteBtn")}</button>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-0 leading-snug text-gray-900 text-center">{ownerMode === "mechanics" ? t("searchHeroTitle") : ownerMode === "cars" ? t("carMarket") : t("jobListingsNavLabel")}</h1>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center gap-2 p-2 pl-2.5 md:hidden">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${ownerMode === "cars" ? "bg-rose-100" : "bg-rose-50"}`}>{ownerMode === "cars" ? <Car size={18} className="text-rose-700" /> : ownerMode === "jobs" ? <Briefcase size={18} className="text-rose-600" /> : <Wrench size={18} className="text-rose-600" />}</div>
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ownerMode === "mechanics" ? t("searchPlaceholder") : ownerMode === "cars" ? t("searchBrandModelPlaceholder") : t("searchPositionSkillPlaceholder")} className="flex-1 px-1 py-2 text-gray-800 text-sm focus:outline-none bg-transparent min-w-0" />
                    <button onClick={(e) => e.currentTarget.blur()} className={`flex-shrink-0 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition ${ownerMode === "cars" ? "bg-rose-600 hover:bg-rose-700" : "bg-rose-600 hover:bg-rose-700"}`}>{t("searchBtn")}</button>
                  </div>
                  <div className="hidden md:flex items-stretch bg-white rounded-full border border-gray-300 shadow-lg divide-x divide-gray-200 max-w-xl mx-auto overflow-hidden">
                    <div className="flex-1 px-6 py-2.5"><label className="block text-[11px] font-bold text-gray-900">{ownerMode === "mechanics" ? t("brandFieldLabel") : ownerMode === "cars" ? t("brandModelFieldLabel") : t("positionFieldLabel")}</label><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ownerMode === "mechanics" ? t("searchPlaceholder") : ownerMode === "cars" ? t("searchBrandModelPlaceholder") : t("searchPositionSkillPlaceholder")} className="w-full text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none bg-transparent" /></div>
                    <div className="flex-1 px-6 py-2.5"><label className="block text-[11px] font-bold text-gray-900">{ownerMode === "mechanics" ? t("cityLabelShort") : t("locationFieldLabel")}</label><input value={locationQuery} onChange={(e) => setLocationQuery(e.target.value)} placeholder={ownerMode === "mechanics" ? t("searchCityPlaceholder") : t("cityOrDistrictPlaceholder")} className="w-full text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none bg-transparent" /></div>
                    <div className="flex items-center pr-2 pl-1"><button onClick={(e) => e.currentTarget.blur()} aria-label={t("searchBtn")} className="w-11 h-11 rounded-full bg-rose-600 hover:bg-rose-700 transition flex items-center justify-center flex-shrink-0"><Search size={17} className="text-white" /></button></div>
                  </div>
                </>)}
                {ownerTab !== "search" && (<button onClick={() => setOwnerTab("search")} className="flex items-center gap-1 text-gray-500 hover:text-gray-900 text-sm mb-3 transition"><ChevronLeft size={16} /> {t("back")}</button>)}
                {ownerTab === "market" && (<><h1 className="text-xl font-bold mb-1 text-gray-900">🏷️ {t("navMarket")}</h1><p className="text-gray-500 text-sm">{t("myListingsSub")}</p></>)}
                {ownerTab === "favorites" && (<><h1 className="text-xl font-bold mb-1 text-gray-900">❤️ {t("favorites")}</h1><p className="text-gray-500 text-sm">{t("favoritesSubtitle")}</p></>)}
                {ownerTab === "chats" && (<><h1 className="text-xl font-bold mb-1 text-gray-900">💬 {t("chats")}</h1></>)}
                {ownerTab === "appointments" && (<><h1 className="text-xl font-bold mb-1 text-gray-900">📋 {t("appointments")}</h1></>)}
              </div>
            </div>
            {ownerTab === "search" ? <BrowseHome /> : (
              <div className="flex-1 overflow-y-auto">
                {ownerTab === "market" && (<div className="px-5 py-4"><button onClick={startSellFlow} className="w-full mb-4 bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition flex items-center justify-center gap-2"><Plus size={16} /> {t("sellMyCar")}</button>{listings.filter(isMyListing).length === 0 ? (<div className="text-center py-16"><Tag size={40} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-400 text-sm">{t("noOwnListings")}</p></div>) : (<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{listings.filter(isMyListing).map(l => (<ListingCard key={l.id} l={l} />))}</div>)}</div>)}
                {ownerTab === "favorites" && (
                  <div className="px-5 py-4">
                    {listings.filter(l => favoriteIds.includes(l.id)).length === 0 ? (
                      <div className="text-center py-16"><Heart size={40} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-400 text-sm">{t("noFavoritesOwnerNote")}</p><p className="text-gray-300 text-xs mt-1">{t("favoritesHintNote")}</p></div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{listings.filter(l => favoriteIds.includes(l.id)).map(l => (<ListingCard key={l.id} l={l} />))}</div>
                    )}
                  </div>
                )}
                {ownerTab === "chats" && (<div className="px-5 py-4 space-y-3">{conversations.map(c => { const last = c.messages[c.messages.length - 1]; return (<button key={c.id} onClick={() => { setActiveConvoId(c.id); setScreen("chat"); }} className="w-full text-left bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-rose-200 transition flex items-center gap-3"><div className="text-2xl bg-rose-50 rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0">{c.mechanicImg}</div><div className="flex-1 min-w-0"><h4 className="font-semibold text-gray-800 text-sm">{c.mechanicName}</h4><p className="text-xs text-gray-400 truncate">{last ? last.text : t("noMessagesInChatYet")}</p></div><ChevronRight size={16} className="text-gray-300" /></button>); })}{conversations.length === 0 && <p className="text-center text-gray-400 text-sm py-10">{t("noConvosYetNote")}</p>}</div>)}
                {ownerTab === "appointments" && (<div className="px-5 py-4"><OwnerAppointmentsView /></div>)}
              </div>
            )}
            <OwnerBottomNav />
          </>
        )}
        {screen === "ownerProfilePage" && (
          <div className="max-w-md md:max-w-2xl mx-auto w-full flex flex-col flex-1">
            <div className="bg-gradient-to-b from-rose-50 to-white text-gray-900 px-5 pt-6 pb-5 border-b border-gray-100 shadow-sm">
              <button onClick={() => { if (["applications", "myReviews", "support", "settings", "market", "favorites"].includes(ownerProfileTab)) setOwnerProfileTab("info"); else setScreen("owner"); }} className="flex items-center gap-1 text-gray-500 mb-3 text-sm hover:text-gray-900 transition"><ChevronLeft size={18} /> {t("back")}</button>
              <div className="flex items-center gap-3 mb-4"><div className="w-16 h-16 rounded-full bg-white shadow-sm border-2 border-white flex items-center justify-center overflow-hidden text-lg font-bold text-gray-700">{ownerProfile.photo ? <img src={ownerProfile.photo} alt={ownerProfile.name || t("profilePhotoAlt")} className="w-full h-full object-cover" /> : initials(ownerProfile.name || "AS")}</div><div><h1 className="text-xl font-bold text-gray-900">{ownerProfile.name || t("ownerFallbackName")}</h1><p className="text-xs text-gray-500">{ownerProfile.email}</p></div></div>
              <div className="grid grid-cols-5 gap-1 bg-gray-100 rounded-xl p-1 text-[9px] leading-tight">
                <button onClick={() => setOwnerProfileTab("info")} className={`px-1 py-1.5 rounded-lg font-medium text-center transition ${ownerProfileTab === "info" ? "bg-white text-rose-600 shadow-sm" : "text-gray-500"}`}>{t("myInfo")}</button>
                <button onClick={() => { setOwnerProfileTab("vehicles"); setSelectedVehicleId(null); }} className={`relative px-1 py-1.5 rounded-lg font-medium text-center transition ${ownerProfileTab === "vehicles" ? "bg-white text-rose-600 shadow-sm" : "text-gray-500"}`}>{t("myVehicles")}{allReminders.filter(r=>r.urgent).length > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white flex items-center justify-center text-[8px]">{allReminders.filter(r=>r.urgent).length}</span>}</button>
                <button onClick={() => setOwnerProfileTab("appts")} className={`px-1 py-1.5 rounded-lg font-medium text-center transition ${ownerProfileTab === "appts" ? "bg-white text-rose-600 shadow-sm" : "text-gray-500"}`}>{t("appointments")}</button>
                <button onClick={() => setOwnerProfileTab("chats")} className={`px-1 py-1.5 rounded-lg font-medium text-center transition ${ownerProfileTab === "chats" ? "bg-white text-rose-600 shadow-sm" : "text-gray-500"}`}>{t("chats")}</button>
                <button onClick={() => setOwnerProfileTab("offers")} className={`px-1 py-1.5 rounded-lg font-medium text-center transition ${ownerProfileTab === "offers" ? "bg-white text-rose-600 shadow-sm" : "text-gray-500"}`}>{t("myOffers")}</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {ownerProfileTab === "info" && (<>
                <div className="flex flex-col items-center mb-5"><div className="relative w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center text-2xl font-bold text-rose-600 overflow-hidden mb-2">{ownerProfile.photo ? <img src={ownerProfile.photo} alt={ownerProfile.name || t("profilePhotoAlt")} className="w-full h-full object-cover" /> : initials(ownerProfile.name || "AS")}<input ref={ownerPhotoRef} type="file" accept="image/*" onChange={ownerPhotoUpload} className="hidden" /><button onClick={() => ownerPhotoRef.current?.click()} className="absolute inset-0 bg-black/0 hover:bg-black/40 transition flex items-center justify-center text-transparent hover:text-white"><Camera size={18} /></button></div><button onClick={() => ownerPhotoRef.current?.click()} className="text-xs text-rose-600 font-medium">{t("changePhotoBtn")}</button><span className="text-[11px] text-gray-400 mt-1">{t("userNumberLabel", { id: String(MY_OWNER_ID) })}</span></div>
                <div className="space-y-2 mb-5"><input value={ownerProfile.name} onChange={(e) => updateMyOwnerField("name", e.target.value)} placeholder={t("fullNameShortPlaceholder")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={ownerProfile.email} onChange={(e) => updateMyOwnerField("email", e.target.value)} placeholder={t("emailPlaceholder")} type="email" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={ownerProfile.phone} onChange={(e) => updateMyOwnerField("phone", e.target.value)} placeholder={t("phonePlaceholderExample2")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} /><input value={ownerProfile.address} onChange={(e) => updateMyOwnerField("address", e.target.value)} placeholder={t("addressPlaceholderShort")} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div><p className="text-[11px] text-gray-400 px-1">{t("autofillJobAppsNote")}</p></div>
                <button onClick={() => { if (ownerProfile.email && !isValidEmail(ownerProfile.email)) { setToast({ type: "info", text: t("invalidEmailAddrToast") }); return; } if (ownerProfile.phone) { const pc = validatePhone(ownerProfile.phone); if (!pc.valid) { setToast({ type: "info", text: `⚠️ ${pc.message}` }); return; } } setToast({ type: "info", text: t("profileUpdatedToast") }); }} className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition mb-7">{t("save")}</button>
                <h3 className="hidden md:flex font-semibold text-gray-800 text-sm mb-3 items-center gap-2"><Tag size={15} className="text-gray-400" /> {t("myListingsHeading")}</h3>
                <button onClick={() => setOwnerProfileTab("market")} className="hidden md:flex w-full items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-5 hover:bg-gray-100 transition"><span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Tag size={14} className="text-gray-400" /> {t("soldCarsLabel")}{listings.filter(isMyListing).length > 0 && <span className="text-xs text-gray-400">({listings.filter(isMyListing).length})</span>}</span><ChevronRight size={15} className="text-gray-300" /></button>
                <h3 className="hidden md:flex font-semibold text-gray-800 text-sm mb-3 items-center gap-2"><Heart size={15} className="text-gray-400" /> {t("favoritesHeadingShort")}</h3>
                <button onClick={() => setOwnerProfileTab("favorites")} className="hidden md:flex w-full items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-5 hover:bg-gray-100 transition"><span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Heart size={14} className="text-gray-400" /> {t("favoriteListingsLabel")}{favoriteIds.length > 0 && <span className="text-xs text-gray-400">({favoriteIds.length})</span>}</span><ChevronRight size={15} className="text-gray-300" /></button>
                <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2"><Briefcase size={15} className="text-gray-400" /> {t("careerHeading")}</h3>
                <button onClick={() => setOwnerProfileTab("applications")} className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-5 hover:bg-gray-100 transition"><span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Briefcase size={14} className="text-gray-400" /> {t("myApplicationsLabel")}{myApplicationRefs.filter(r => r.role === "owner").length > 0 && <span className="text-xs text-gray-400">({myApplicationRefs.filter(r => r.role === "owner").length})</span>}</span><ChevronRight size={15} className="text-gray-300" /></button>
                <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2"><Star size={15} className="text-gray-400" /> {t("myReviewsHeading")}</h3>
                <button onClick={() => setOwnerProfileTab("myReviews")} className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-5 hover:bg-gray-100 transition"><span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Star size={14} className="text-gray-400" /> {t("reviewsIMadeLabel")}{myReviews.length > 0 && <span className="text-xs text-gray-400">({myReviews.length})</span>}</span><ChevronRight size={15} className="text-gray-300" /></button>
                <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2"><Settings size={15} className="text-gray-400" /> {t("appSectionHeading")}</h3>
                <button onClick={() => setOwnerProfileTab("settings")} className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-2 hover:bg-gray-100 transition"><span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Settings size={14} className="text-gray-400" /> {t("settingsLabel")}</span><ChevronRight size={15} className="text-gray-300" /></button>
                <button onClick={logoutUser} className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-5 hover:bg-gray-100 transition"><span className="text-sm font-medium text-gray-700 flex items-center gap-2"><LogOut size={14} className="text-gray-400" /> {t("logout")}</span><ChevronRight size={15} className="text-gray-300" /></button>
              </>)}
              {ownerProfileTab === "settings" && (
                <>
                  <button onClick={() => setOwnerProfileTab("info")} className="flex items-center gap-1 text-rose-600 mb-4 text-sm"><ChevronLeft size={16} /> {t("backToInfoBtn")}</button>
                  <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Settings size={16} className="text-rose-500" /> {t("settingsLabel")}</h2>
                  <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-4"><h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Bell size={14} className="text-rose-500" /> {t("smartReminders")}</h4><button onClick={() => setOwnerSettings(s => ({ ...s, smartReminders: !s.smartReminders }))} aria-label={t("toggleChangeAria")} className="p-3 -m-3 flex-shrink-0"><div className={`w-12 h-7 rounded-full transition relative ${ownerSettings.smartReminders ? "bg-rose-600" : "bg-gray-200"}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition ${ownerSettings.smartReminders ? "left-6" : "left-1"}`} /></div></button></div>
                  <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-4"><div className="pr-3"><h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><MapPin size={14} className="text-rose-500" /> {t("useMyLocationTitle")}</h4><p className="text-[11px] text-gray-400 mt-0.5">{userLocation ? t("realLocationDistanceNote") : t("estimatedDistanceNote")}</p></div><button onClick={() => (userLocation ? stopUsingLocation() : setShowLocationPrompt(true))} aria-label={t("toggleChangeAria")} className="p-3 -m-3 flex-shrink-0"><div className={`w-12 h-7 rounded-full transition relative ${userLocation ? "bg-rose-600" : "bg-gray-200"}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition ${userLocation ? "left-6" : "left-1"}`} /></div></button></div>
                  {(() => {
                    const notifOpts = [{ key: "notifyAppointments", label: t("notifApptUpdatesLabel") }, { key: "notifyOffers", label: t("notifOfferResultsLabel") }, { key: "notifyMessages", label: t("notifMessagesLabel") }];
                    const allNotifsOn = notifOpts.every(opt => ownerSettings[opt.key]);
                    const toggleAllNotifs = () => {
                      setOwnerSettings(s => ({ ...s, ...Object.fromEntries(notifOpts.map(opt => [opt.key, !allNotifsOn])) }));
                      if (!allNotifsOn && notifPermission !== "granted") requestNotifPermission();
                    };
                    return (
                      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
                        <div className="flex items-center justify-between"><div className="pr-3"><h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Bell size={14} className="text-rose-500" /> {t("notifBellTitle")}</h4><p className="text-[11px] text-gray-400 mt-0.5">{notifPermission === "denied" ? t("notifPermDeniedHint") : allNotifsOn ? t("allNotifTypesOnHint") : t("dontMissApptUpdatesHint")}</p></div><button onClick={toggleAllNotifs} aria-label={t("toggleChangeAria")} className="p-3 -m-3 flex-shrink-0"><div className={`w-12 h-7 rounded-full transition relative ${allNotifsOn ? "bg-rose-600" : "bg-gray-200"}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition ${allNotifsOn ? "left-6" : "left-1"}`} /></div></button></div>
                        <button onClick={() => setOwnerNotifDetailsOpen(o => !o)} className="w-full flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 hover:text-gray-700 transition"><span>{t("showNotifTypesBtn")}</span><ChevronRight size={13} className={`transition-transform ${ownerNotifDetailsOpen ? "rotate-90" : ""}`} /></button>
                        {ownerNotifDetailsOpen && (
                          <div className="mt-3 space-y-2.5">
                            {notifOpts.map(opt => (
                              <div key={opt.key} className="flex items-center justify-between"><span className="text-xs text-gray-600">{opt.label}</span><button onClick={() => setOwnerSettings(s => ({ ...s, [opt.key]: !s[opt.key] }))} aria-label={t("toggleChangeAria")} className="p-3 -m-3 flex-shrink-0"><div className={`w-9 h-5 rounded-full transition relative ${ownerSettings[opt.key] ? "bg-rose-600" : "bg-gray-200"}`}><div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition ${ownerSettings[opt.key] ? "left-[19px]" : "left-[3px]"}`} /></div></button></div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-4"><h4 className="font-semibold text-gray-800 text-sm">{t("siteLanguage")}</h4><LangSwitch /></div>
                  <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-4"><div className="pr-3"><h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Globe size={14} className="text-rose-500" /> {t("messagingLanguageTitle")}</h4><p className="text-[11px] text-gray-400 mt-0.5">{t("ownerMessagingLangHint")}</p></div><div className="flex bg-gray-100 rounded-full p-0.5 gap-0.5 flex-shrink-0">{["tr", "en", "de"].map(l => (<button key={l} onClick={() => setOwnerLang(l)} className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${ownerLang === l ? "bg-white text-rose-600 shadow-sm" : "text-gray-400"}`}>{l.toUpperCase()}</button>))}</div></div>
                  <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-5"><h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Palette size={14} className="text-rose-500" /> {t("appearanceDarkModeTitle")}</h4><button onClick={() => setDarkMode(d => !d)} aria-label={t("toggleChangeAria")} className="p-3 -m-3 flex-shrink-0"><div className={`w-12 h-7 rounded-full transition relative ${darkMode ? "bg-rose-600" : "bg-gray-200"}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition ${darkMode ? "left-6" : "left-1"}`} /></div></button></div>
                  <button onClick={() => setOwnerAccountOpen(o => !o)} className="w-full flex items-center justify-between mb-2 hover:opacity-70 transition"><h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Lock size={15} className="text-gray-400" /> {t("accountTitle")}</h3><ChevronRight size={15} className={`text-gray-300 transition-transform ${ownerAccountOpen ? "rotate-90" : ""}`} /></button>
                  {ownerAccountOpen && (<>
                    <button onClick={() => setShowPasswordModal(true)} className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-2 hover:bg-gray-100 transition"><span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Lock size={14} className="text-gray-400" /> {t("changePasswordTitle")}</span><ChevronRight size={15} className="text-gray-300" /></button>
                    <button onClick={() => setOwnerProfileTab("support")} className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-2 hover:bg-gray-100 transition"><span className="text-sm font-medium text-gray-700 flex items-center gap-2"><LifeBuoy size={14} className="text-gray-400" /> {t("helpSupportBtn")}</span>{mySupportTickets().filter(tk => tk.status !== "resolved").length > 0 && <span className="text-[10px] font-bold text-white bg-rose-600 rounded-full px-1.5 py-0.5 flex-shrink-0">{mySupportTickets().filter(tk => tk.status !== "resolved").length}</span>}<ChevronRight size={15} className="text-gray-300" /></button>
                    <button onClick={() => setLegalModalTopic("terms")} className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-2 hover:bg-gray-100 transition"><span className="text-sm font-medium text-gray-700">{t("termsOfUseBtn")}</span><ChevronRight size={15} className="text-gray-300" /></button>
                    <button onClick={() => setLegalModalTopic("privacy")} className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-2 hover:bg-gray-100 transition"><span className="text-sm font-medium text-gray-700">{t("privacyPolicyBtn")}</span><ChevronRight size={15} className="text-gray-300" /></button>
                  </>)}
                  <div className="mt-3" />
                  <button onClick={() => setOwnerDangerZoneOpen(o => !o)} className="w-full flex items-center justify-between py-2 text-xs text-gray-400 hover:text-gray-600 transition"><span>{t("dangerZoneBtn")}</span><ChevronRight size={13} className={`transition-transform ${ownerDangerZoneOpen ? "rotate-90" : ""}`} /></button>
                  {ownerDangerZoneOpen && (
                    <div className="border border-red-100 bg-red-50/50 rounded-2xl p-4 mt-1">
                      <p className="text-xs text-gray-500 mb-3">{t("ownerDeleteAccountWarningNote")}</p>
                      <button onClick={() => { setShowDeleteAccountModal(true); setDeleteConfirmText(""); }} className="w-full text-red-500 border border-red-200 py-2.5 rounded-xl font-medium text-xs hover:bg-red-100 transition">{t("deleteMyAccountBtn")}</button>
                    </div>
                  )}
                </>
              )}
              {ownerProfileTab === "applications" && (
                <>
                  <button onClick={() => setOwnerProfileTab("info")} className="flex items-center gap-1 text-rose-600 mb-4 text-sm"><ChevronLeft size={16} /> {t("backToInfoBtn")}</button>
                  <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Briefcase size={16} className="text-rose-500" /> {t("jobApplicationsHeading")}</h2>
                  <div className="space-y-3">
                    {myApplicationRefs.filter(r => r.role === "owner").map(r => (
                      <button key={r.id} onClick={() => setSelectedJobId(r.job.id)} className="w-full text-left bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-rose-200 transition">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-gray-800 text-sm">{r.job.title}</h4>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${r.applicant?.status === "rejected" ? "bg-red-50 text-red-500" : r.job.status === "closed" ? "bg-gray-100 text-gray-400" : "bg-gray-100 text-gray-700"}`}>{r.applicant?.status === "rejected" ? t("jobAppRejectedStatus") : r.job.status === "closed" ? t("jobListingClosedStatus") : t("jobAppUnderReviewStatus")}</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-1">{r.job.mechanicName}{r.job.location ? ` · ${r.job.location}` : ""}</p>
                        <p className="text-[11px] text-gray-300">{t("appliedOnLabel", { date: r.date })}</p>
                      </button>
                    ))}
                    {myApplicationRefs.filter(r => r.role === "owner").length === 0 && <div className="text-center py-16"><Briefcase size={40} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-400 text-sm">{t("noJobApplicationsNote")}</p></div>}
                  </div>
                </>
              )}
              {ownerProfileTab === "myReviews" && (
                <>
                  <button onClick={() => setOwnerProfileTab("info")} className="flex items-center gap-1 text-rose-600 mb-4 text-sm"><ChevronLeft size={16} /> {t("backToInfoBtn")}</button>
                  <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2"><Star size={16} className="text-gray-900" /> {t("reviewsIMadeLabel")}</h2>
                  <p className="text-xs text-gray-400 mb-4">{t("reviewsCannotEditNote")}</p>
                  <div className="space-y-3">
                    {myReviews.map(r => (
                      <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-gray-800 text-sm">{r.mechanicImg} {r.mechanicName}</h4>
                          <button onClick={() => setConfirmDialog({ title: t("deleteReviewConfirmTitle"), body: t("deleteReviewConfirmBody"), confirmLabel: t("yesDeleteConfirmLabel"), danger: true, onConfirm: () => deleteMyReview(r.mechanicId, r.id) })} aria-label={t("deleteReviewAria")} className="text-red-400 hover:text-red-600 flex-shrink-0 p-2 -m-2"><Trash2 size={14} /></button>
                        </div>
                        <div className="flex items-center gap-0.5 mb-1.5">{[1, 2, 3, 4, 5].map(n => (<Star key={n} size={12} className={n <= r.rating ? "text-gray-900 fill-gray-900" : "text-gray-200 fill-gray-200"} />))}</div>
                        <p className="text-xs text-gray-500">{r.comment}</p>
                        <p className="text-[11px] text-gray-300 mt-1.5">{r.date}</p>
                      </div>
                    ))}
                    {myReviews.length === 0 && <div className="text-center py-16"><Star size={40} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-400 text-sm">{t("noReviewsWrittenNote")}</p></div>}
                  </div>
                </>
              )}
              {ownerProfileTab === "market" && (
                <>
                  <button onClick={() => setOwnerProfileTab("info")} className="flex items-center gap-1 text-rose-600 mb-4 text-sm"><ChevronLeft size={16} /> {t("backToInfoBtn")}</button>
                  <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Tag size={16} className="text-rose-500" /> {t("soldCarsLabel")}</h2>
                  <button onClick={startSellFlow} className="w-full mb-4 bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition flex items-center justify-center gap-2"><Plus size={16} /> {t("sellMyCar")}</button>
                  {listings.filter(isMyListing).length === 0 ? (<div className="text-center py-16"><Tag size={40} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-400 text-sm">{t("noOwnListings")}</p></div>) : (<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{listings.filter(isMyListing).map(l => (<ListingCard key={l.id} l={l} />))}</div>)}
                </>
              )}
              {ownerProfileTab === "favorites" && (
                <>
                  <button onClick={() => setOwnerProfileTab("info")} className="flex items-center gap-1 text-rose-600 mb-4 text-sm"><ChevronLeft size={16} /> {t("backToInfoBtn")}</button>
                  <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Heart size={16} className="text-rose-500" /> {t("favoriteListingsLabel")}</h2>
                  {listings.filter(l => favoriteIds.includes(l.id)).length === 0 ? (
                    <div className="text-center py-16"><Heart size={40} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-400 text-sm">{t("noFavoritesOwnerNote")}</p><p className="text-gray-300 text-xs mt-1">{t("favoritesHintNote")}</p></div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{listings.filter(l => favoriteIds.includes(l.id)).map(l => (<ListingCard key={l.id} l={l} />))}</div>
                  )}
                </>
              )}
              {ownerProfileTab === "support" && renderSupportView("settings", setOwnerProfileTab)}
              {ownerProfileTab === "vehicles" && !selectedVehicle && (
                <>
                  <button onClick={() => setShowAddVehicle(!showAddVehicle)} className="w-full mb-4 border-2 border-dashed border-rose-200 rounded-2xl py-3 flex items-center justify-center gap-2 text-rose-600 text-sm font-medium hover:bg-rose-50 transition"><Plus size={16} /> {t("addVehicle")}</button>
                  {showAddVehicle && (<div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 space-y-2">
                    <input value={newVehicle.brand} onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })} placeholder={t("bookingBrandPlaceholder")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                    <input value={newVehicle.model} onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })} placeholder={t("bookingModelPlaceholder")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                    <div className="flex gap-2"><input value={newVehicle.year} onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })} placeholder={t("bookingYearPlaceholder")} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={newVehicle.plate} onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value })} placeholder={t("bookingPlatePlaceholder")} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                    <select value={newVehicle.country} onChange={(e) => setNewVehicle({ ...newVehicle, country: e.target.value, city: "" })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"><option value="tr">🇹🇷 {t("countryTurkeyLabel")}</option><option value="de">🇩🇪 {t("countryGermanyLabel")}</option></select>
                    {newVehicle.country === "de" ? (
                      <select value={newVehicle.city} onChange={(e) => setNewVehicle({ ...newVehicle, city: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"><option value="">{t("selectCityForTireDatePlaceholder")}</option>{DE_CITIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    ) : (
                      <input value={newVehicle.city} onChange={(e) => setNewVehicle({ ...newVehicle, city: e.target.value })} placeholder={t("cityLabelShort")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                    )}
                    <select value={newVehicle.tireType} onChange={(e) => setNewVehicle({ ...newVehicle, tireType: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"><option value="mevsimlik">{t("seasonalTireOption")}</option><option value="allseason">{t("allSeasonTireOption")}</option></select>
                    <div><label className="text-[11px] text-gray-400">{t("lastInspectionLabel")}</label><input type="date" value={newVehicle.lastInspection} onChange={(e) => setNewVehicle({ ...newVehicle, lastInspection: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                    <div><label className="text-[11px] text-gray-400">{t("insuranceEndLabel")}</label><input type="date" value={newVehicle.insuranceEnd} onChange={(e) => setNewVehicle({ ...newVehicle, insuranceEnd: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                    <button onClick={addVehicle} className="w-full bg-rose-600 text-white py-3 rounded-2xl text-sm font-semibold hover:bg-rose-700 transition">{t("add")}</button>
                  </div>)}
                  <div className="space-y-3">{vehicles.map(v => { const vReminders = computeReminders(v); const vListing = listings.find(l => l.id === v.listingId); const vOfferCount = vListing ? vListing.offers.filter(o => o.status !== "replaced").length : 0; return (<button key={v.id} onClick={() => setSelectedVehicleId(v.id)} className="w-full text-left bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-rose-200 transition flex items-center gap-3"><div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center flex-shrink-0"><Car size={22} className="text-rose-600" /></div><div className="flex-1"><h3 className="font-semibold text-gray-800 text-sm">{v.brand} {v.model} ({v.year})</h3><p className="text-xs text-gray-400">{v.plate}{vListing && <span className="ml-2 text-rose-500">· {t("forSaleTag")}{vOfferCount > 0 ? ` · ${t("offerCountSuffixShort", { n: String(vOfferCount) })}` : ""}</span>}</p></div>{ownerSettings.smartReminders && vReminders.filter(r=>r.urgent).length > 0 && <span className="w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center flex-shrink-0">{vReminders.filter(r=>r.urgent).length}</span>}<ChevronRight size={16} className="text-gray-300" /></button>); })}{vehicles.length === 0 && <p className="text-center text-gray-400 text-sm py-10">{t("noVehiclesAddedNote")}</p>}
                  {listings.filter(l => isMyListing(l) && !vehicles.some(v => v.listingId === l.id)).length > 0 && (
                    <>
                      <h3 className="font-semibold text-gray-800 text-sm mt-6 mb-1 flex items-center gap-2"><Tag size={15} className="text-gray-400" /> {t("soldOutsideRegisteredVehicleHeading")}</h3>
                      {listings.filter(l => isMyListing(l) && !vehicles.some(v => v.listingId === l.id)).map(l => {
                        const offerCount = l.offers.filter(o => o.status !== "replaced").length;
                        return (
                          <div key={l.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                            <button onClick={() => setSelectedListingId(l.id)} className="w-full text-left flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">{isImgUrl(l.photo) ? <img src={imgThumb(l.photo, 100)} loading="lazy" onError={imgFallbackHandler} alt={`${l.brand ?? ""} ${l.model ?? ""}`.trim() || t("listingPhotoAlt")} className="w-full h-full object-cover" /> : l.photo}</div>
                              <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{l.brand} {l.model} ({l.year})</p><p className="text-xs text-gray-400">{l.price} · {t("listingNumberLabel", { id: String(l.id) })}</p></div>
                              <span className={`text-[10px] font-bold text-white px-2 py-1 rounded-full flex-shrink-0 ${l.adminRemoved ? "bg-gray-900" : listingStatusMeta(l.status, t).color}`}>{l.adminRemoved ? t("removedStatusLabel") : listingStatusMeta(l.status, t).label}</span>
                            </button>
                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                              <span className="text-[11px] text-gray-400">{offerCount > 0 ? t("offerCountSuffixShort", { n: String(offerCount) }) : t("noOffersYetShort")}</span>
                              <div className="flex items-center gap-3">
                                <button onClick={() => openSellForm({ brand: l.brand, model: l.model, year: l.year, km: l.km, price: l.price, description: l.description, photo: l.photo, fuelType: l.fuelType, transmission: l.transmission, power: l.power, firstReg: l.firstReg, color: l.color, city: l.city || "", _vehicleId: null, _editingId: l.id })} className="text-xs font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"><Pencil size={12} /> {t("editBtn")}</button>
                                <button onClick={() => setSelectedListingId(l.id)} className="text-xs font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1">{t("viewOffersBtn")} <ChevronRight size={12} /></button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                  </div>
                </>
              )}
              {ownerProfileTab === "vehicles" && selectedVehicle && (() => { const linkedListing = listings.find(l => l.id === selectedVehicle.listingId); return (
                <>
                  <button onClick={() => setSelectedVehicleId(null)} className="flex items-center gap-1 text-rose-600 mb-4 text-sm"><ChevronLeft size={16} /> {t("backToVehiclesBtn")}</button>
                  <div className="bg-rose-50 rounded-2xl p-4 mb-5 flex items-center gap-3"><div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center"><Car size={26} className="text-rose-600" /></div><div className="flex-1"><h2 className="font-bold text-gray-800">{selectedVehicle.brand} {selectedVehicle.model}</h2><p className="text-xs text-gray-500">{selectedVehicle.year} · {selectedVehicle.plate}</p></div><button onClick={() => { setEditVehicleForm({ ...selectedVehicle }); setShowEditVehicle(true); }} aria-label={t("editVehicleAria")} className="text-rose-600 p-2 -m-2"><Pencil size={16} /></button><button onClick={() => setConfirmDialog({ title: t("deleteVehicleConfirmTitle"), body: t("deleteVehicleConfirmBody"), confirmLabel: t("yesDeleteConfirmLabel"), danger: true, onConfirm: () => removeVehicle(selectedVehicle.id) })} aria-label={t("deleteVehicleAria")} className="text-red-400 hover:text-red-600 p-2 -m-2"><Trash2 size={16} /></button></div>
                  {showEditVehicle && editVehicleForm && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5 space-y-2">
                      <h3 className="font-semibold text-gray-800 text-sm mb-1">{t("editVehicleInfoTitle")}</h3>
                      <div className="flex gap-2"><input value={editVehicleForm.brand} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, brand: e.target.value })} placeholder={t("bookingBrandPlaceholder")} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={editVehicleForm.model} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, model: e.target.value })} placeholder={t("bookingModelPlaceholder")} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                      <div className="flex gap-2"><input value={editVehicleForm.year} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, year: e.target.value })} placeholder={t("bookingYearPlaceholder")} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={editVehicleForm.plate} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, plate: e.target.value })} placeholder={t("bookingPlatePlaceholder")} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                      <select value={editVehicleForm.country} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, country: e.target.value, city: "" })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"><option value="tr">🇹🇷 {t("countryTurkeyLabel")}</option><option value="de">🇩🇪 {t("countryGermanyLabel")}</option></select>
                      {editVehicleForm.country === "de" ? (
                        <select value={editVehicleForm.city || ""} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, city: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"><option value="">{t("selectCityForTireDatePlaceholder")}</option>{DE_CITIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                      ) : (
                        <input value={editVehicleForm.city || ""} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, city: e.target.value })} placeholder={t("cityLabelShort")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                      )}
                      <select value={editVehicleForm.tireType} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, tireType: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"><option value="mevsimlik">{t("seasonalTireOption")}</option><option value="allseason">{t("allSeasonTireOption")}</option></select>
                      <div><label className="text-[11px] text-gray-400">{t("lastInspectionLabel")}</label><input type="date" value={editVehicleForm.lastInspection || ""} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, lastInspection: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                      <div><label className="text-[11px] text-gray-400">{t("lastMaintenanceLabel")}</label><input type="date" value={editVehicleForm.lastMaintenance || ""} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, lastMaintenance: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                      <div><label className="text-[11px] text-gray-400">{t("insuranceEndLabel")}</label><input type="date" value={editVehicleForm.insuranceEnd || ""} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, insuranceEnd: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                      <div className="flex gap-2 pt-1"><button onClick={() => setShowEditVehicle(false)} className="flex-1 border border-gray-200 text-gray-500 py-2 rounded-xl text-sm">{t("cancel")}</button><button onClick={() => { if (editVehicleForm.lastInspection && !isValidDateStr(editVehicleForm.lastInspection)) { setToast({ type: "info", text: t("invalidDateFieldToast", { field: t("lastInspectionLabel") }) }); return; } if (editVehicleForm.lastMaintenance && !isValidDateStr(editVehicleForm.lastMaintenance)) { setToast({ type: "info", text: t("invalidDateFieldToast", { field: t("lastMaintenanceLabel") }) }); return; } if (editVehicleForm.insuranceEnd && !isValidDateStr(editVehicleForm.insuranceEnd)) { setToast({ type: "info", text: t("invalidDateFieldToast", { field: t("insuranceEndLabel") }) }); return; } updateVehicleFields(selectedVehicle.id, editVehicleForm); setShowEditVehicle(false); setToast({ type: "info", text: t("vehicleInfoUpdatedToast") }); }} className="flex-1 bg-rose-600 text-white py-2 rounded-xl text-sm font-medium">{t("save")}</button></div>
                    </div>
                  )}
                  {linkedListing ? (<div className="mb-5 bg-white border border-gray-100 rounded-2xl p-4"><div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Tag size={15} className="text-rose-500" /> {t("listingStatus")}</h3><span className={`text-[10px] text-white font-bold px-2 py-1 rounded-full ${listingStatusMeta(linkedListing.status, t).color}`}>{listingStatusMeta(linkedListing.status, t).label}</span></div><div className="flex gap-2 mb-3">{["active", "reserved", "sold"].map(st => (<button key={st} onClick={() => setListingStatus(linkedListing.id, st)} className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium border transition ${linkedListing.status === st ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-500 border-gray-200"}`}>{listingStatusMeta(st, t).label}</button>))}</div><p className="text-[11px] text-gray-400 mb-3">{(() => { const oc = linkedListing.offers.filter(o => o.status !== "replaced").length; return oc > 0 ? t("offersCameInSuffix", { n: String(oc) }) : t("noOffersYetOnListing"); })()}</p><div className="flex gap-2"><button onClick={() => openSellForm({ ...linkedListing, _vehicleId: selectedVehicle.id, _editingId: linkedListing.id })} className="flex-1 bg-gray-50 text-gray-700 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 transition flex items-center justify-center gap-2"><Pencil size={14} /> {t("editListing")}</button><button onClick={() => setSelectedListingId(linkedListing.id)} className="flex-1 bg-rose-50 text-rose-600 py-2 rounded-xl text-sm font-medium hover:bg-rose-100 transition flex items-center justify-center gap-2"><MessageCircle size={14} /> {t("viewOffersBtn")}</button></div></div>) : (<button onClick={() => openSellForm({ brand: selectedVehicle.brand, model: selectedVehicle.model, year: selectedVehicle.year, km: "", price: "", description: "", photo: "🚗", fuelType: "Benzin", transmission: "Manuel", power: "", firstReg: "", color: "", _vehicleId: selectedVehicle.id, _editingId: null })} className="w-full mb-5 bg-white border border-rose-200 text-rose-600 py-2.5 rounded-xl text-sm font-medium hover:bg-rose-50 transition flex items-center justify-center gap-2"><Tag size={15} /> {t("sellThisCar")}</button>)}
                  {ownerSettings.smartReminders && (() => {
                    const vReminders = computeReminders(selectedVehicle);
                    const disabledKinds = Object.entries(selectedVehicle.reminderOverrides || {}).filter(([, ov]: [string, any]) => ov && ov.enabled === false).map(([k]) => k);
                    return (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Bell size={16} className="text-rose-500" /> {t("smartReminders")}</h3>
                        {selectedVehicle.city && <span className="text-[10px] text-gray-400">📍 {selectedVehicle.city}</span>}
                      </div>
                      <p className="text-[11px] text-gray-400 -mt-2 mb-3">{t("smartRemindersAutoNote")}</p>
                      <div className="space-y-2 mb-3">
                        {vReminders.map((r) => (
                          <div key={r.kind} className={`rounded-xl p-3 ${r.urgent ? "bg-red-50" : "bg-gray-100"}`}>
                            <div className="flex items-start gap-2">
                              <span className="text-lg flex-shrink-0">{r.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className={`text-xs font-semibold ${r.urgent ? "text-red-600" : "text-gray-700"}`}>{r.title}</p>
                                  {r.customized && <span className="text-[9px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">{t("customSettingBadge")}</span>}
                                </div>
                                <p className="text-[11px] text-gray-500 mt-0.5">{r.detail}</p>
                              </div>
                              <button onClick={() => { if (editingReminderKind === r.kind) { setEditingReminderKind(null); } else { setEditingReminderKind(r.kind); setReminderEditForm({ enabled: true, customDate: r.dueDate ? r.dueDate.toISOString().slice(0, 10) : "", leadDays: String(r.leadDays ?? "") }); } }} aria-label={t("editReminderAria")} className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-2 -m-1.5"><Pencil size={13} /></button>
                            </div>
                            {editingReminderKind === r.kind && (
                              <div className="mt-3 pt-3 border-t border-black/5 space-y-2">
                                <div><label className="text-[10px] text-gray-400">{r.isUserCreated ? t("reminderDateLabel") : t("reminderDateAutoHint")}</label><input type="date" min={TODAY_STR} value={reminderEditForm.customDate} onChange={(e) => setReminderEditForm(f => ({ ...f, customDate: e.target.value }))} className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs mt-0.5" /></div>
                                <div><label className="text-[10px] text-gray-400">{t("leadDaysQuestionLabel")}</label><input type="number" min="0" value={reminderEditForm.leadDays} onChange={(e) => setReminderEditForm(f => ({ ...f, leadDays: e.target.value }))} placeholder={String(r.leadDays)} className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs mt-0.5" /></div>
                                {r.isUserCreated ? (
                                  <div className="flex gap-2 pt-1">
                                    <button onClick={() => updateCustomReminder(selectedVehicle.id, r.customId, { date: reminderEditForm.customDate || r.dueDate.toISOString().slice(0, 10), leadDays: reminderEditForm.leadDays || "7" })} className="flex-1 bg-rose-600 text-white py-1.5 rounded-lg text-[11px] font-medium">{t("save")}</button>
                                    <button onClick={() => removeCustomReminder(selectedVehicle.id, r.customId)} className="flex-1 border border-red-200 text-red-500 py-1.5 rounded-lg text-[11px] font-medium">{t("deleteBtnShort")}</button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex gap-2 pt-1">
                                      <button onClick={() => saveReminderOverride(selectedVehicle.id, r.kind, { enabled: true, customDate: reminderEditForm.customDate || null, leadDays: reminderEditForm.leadDays === "" ? null : Number(reminderEditForm.leadDays) })} className="flex-1 bg-rose-600 text-white py-1.5 rounded-lg text-[11px] font-medium">{t("save")}</button>
                                      <button onClick={() => saveReminderOverride(selectedVehicle.id, r.kind, { enabled: false })} className="flex-1 border border-gray-200 text-gray-500 py-1.5 rounded-lg text-[11px] font-medium">{t("turnOffThisBtn")}</button>
                                    </div>
                                    {r.customized && <button onClick={() => resetReminderOverride(selectedVehicle.id, r.kind)} className="w-full text-rose-600 text-[11px] font-medium py-1">{t("resetToDefaultDateBtn")}</button>}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        {vReminders.length === 0 && <p className="text-center text-gray-400 text-xs py-3">{t("noActiveRemindersNote")}</p>}
                      </div>
                      {disabledKinds.length > 0 && (
                        <div className="mb-5 bg-white border border-gray-200 rounded-xl p-3">
                          <p className="text-[10px] text-gray-400 mb-2">{t("disabledRemindersLabel")}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {disabledKinds.map(k => (<button key={k} onClick={() => resetReminderOverride(selectedVehicle.id, k)} className="text-[10px] bg-white border border-gray-200 text-gray-500 px-2 py-1 rounded-full hover:border-rose-300 hover:text-rose-600 transition">{REMINDER_KIND_LABELS[k] || k} · {t("reopenSuffixBtn")}</button>))}
                          </div>
                        </div>
                      )}
                      {!showAddReminderForm ? (
                        <button onClick={() => { setShowAddReminderForm(true); setNewReminderForm({ title: "", date: "", leadDays: "7" }); }} className="w-full border-2 border-dashed border-rose-200 rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-rose-600 text-xs font-medium hover:bg-rose-50 transition mb-5"><Plus size={14} /> {t("addNewReminderBtn")}</button>
                      ) : (
                        <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 mb-5 space-y-2">
                          <input autoFocus value={newReminderForm.title} onChange={(e) => setNewReminderForm(f => ({ ...f, title: e.target.value }))} placeholder={t("reminderTitlePlaceholderExample")} className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white" />
                          <div className="flex gap-2">
                            <div className="flex-1"><label className="text-[9px] text-gray-400 block mb-0.5">{t("dateLabel")}</label><input type="date" min={TODAY_STR} value={newReminderForm.date} onChange={(e) => setNewReminderForm(f => ({ ...f, date: e.target.value }))} className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white" /></div>
                            <div className="w-28"><label className="text-[9px] text-gray-400 block mb-0.5">{t("leadDaysQuestionLabel")}</label><input type="number" min="0" value={newReminderForm.leadDays} onChange={(e) => setNewReminderForm(f => ({ ...f, leadDays: e.target.value }))} placeholder={t("daysFieldPlaceholder")} className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white" /></div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setShowAddReminderForm(false); setNewReminderForm({ title: "", date: "", leadDays: "7" }); }} className="flex-1 border border-gray-200 text-gray-500 text-[11px] py-1.5 rounded-lg font-medium">{t("cancel")}</button>
                            <button disabled={!newReminderForm.title.trim() || !newReminderForm.date} onClick={() => submitNewReminder(selectedVehicle.id)} className={`flex-1 text-[11px] py-1.5 rounded-lg font-medium transition ${newReminderForm.title.trim() && newReminderForm.date ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>{t("add")}</button>
                          </div>
                        </div>
                      )}
                    </>
                    );
                  })()}
                  <div className="w-full flex items-center justify-between mb-3">
                    <button onClick={() => setShowMaintenanceHistory(o => !o)} className="flex-1 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><History size={16} /> {t("maintenanceHistory")} <span className="text-gray-300 font-normal">({selectedVehicle.history.length})</span></h3>
                      <ChevronRight size={16} className={`text-gray-300 transition-transform ${showMaintenanceHistory ? "rotate-90" : ""}`} />
                    </button>
                    {selectedVehicle.history.length > 0 && (<button onClick={() => downloadMaintenanceReport(selectedVehicle)} title={t("downloadReportAria")} className="ml-2 w-7 h-7 flex-shrink-0 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition"><FileText size={13} /></button>)}
                  </div>
                  {showMaintenanceHistory && (selectedVehicle.history.length === 0 ? (
                    <p className="text-center text-gray-400 text-xs py-6">{t("noMaintenanceRecordNote")}</p>
                  ) : (
                    <>
                      <div className={selectedVehicle.history.length > 4 ? "max-h-64 overflow-y-auto pr-1 rounded-xl ring-1 ring-gray-100 p-1" : ""}>
                        <div className="space-y-2">{selectedVehicle.history.map((h, i) => (
                          <div key={i} className="border border-gray-100 rounded-xl p-3">
                            <div className="flex justify-between items-start gap-2 mb-1"><h4 className="font-semibold text-gray-800 text-sm">{h.type}</h4><span className="text-xs font-bold text-rose-600 whitespace-nowrap">{h.price}</span></div>
                            <div className="flex items-center justify-between gap-2 text-[11px] text-gray-400"><span className="truncate">{h.mechanic}</span><span className="flex items-center gap-1 flex-shrink-0"><Calendar size={10} />{h.date}</span></div>
                          </div>
                        ))}</div>
                      </div>
                      {selectedVehicle.history.length > 4 && <p className="text-center text-[10px] text-gray-300 mt-1.5 flex items-center justify-center gap-1"><ChevronRight size={10} className="rotate-90" /> {t("scrollForMoreHint")}</p>}
                    </>
                  ))}
                </>
              ); })()}
              {ownerProfileTab === "appts" && <OwnerAppointmentsView />}
              {ownerProfileTab === "chats" && (<div className="space-y-3">{conversations.map(c => { const last = c.messages[c.messages.length - 1]; return (<button key={c.id} onClick={() => { setActiveConvoId(c.id); setScreen("chat"); }} className="w-full text-left bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3"><div className="text-2xl bg-rose-50 rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0">{c.mechanicImg}</div><div className="flex-1 min-w-0"><h4 className="font-semibold text-gray-800 text-sm">{c.mechanicName}</h4><p className="text-xs text-gray-400 truncate">{last ? last.text : t("noMessagesInChatYet")}</p></div><ChevronRight size={16} className="text-gray-300" /></button>); })}{conversations.length === 0 && <p className="text-center text-gray-400 text-sm py-10">{t("noChatsShort")}</p>}</div>)}
              {ownerProfileTab === "offers" && (<>
                <h3 className="font-semibold text-gray-800 text-sm mb-2">{t("offersMade")}</h3>
                <div className="space-y-2 mb-6">{listings.flatMap(l => l.offers.filter(o => (o.buyerId != null ? o.buyerId === MY_OWNER_ID : o.from === ownerProfile.name) && o.status !== "replaced").map(o => ({ ...o, listing: l }))).map(o => (<div key={o.id} className="bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-center"><div><p className="text-xs font-medium text-gray-700">{o.listing.brand} {o.listing.model}</p><p className="text-[10px] text-gray-400">{o.status === "accepted" ? t("offerAcceptedStatus") : o.status === "rejected" ? t("offerRejectedStatus") : o.seen ? t("pendingSeenStatus") : t("pendingStatus")}</p></div><span className="font-bold text-rose-600 text-sm">{o.amount}{o.currency || "₺"}</span></div>))}
                {listings.flatMap(l => l.offers.filter(o => (o.buyerId != null ? o.buyerId === MY_OWNER_ID : o.from === ownerProfile.name) && o.status !== "replaced")).length === 0 && <p className="text-center text-gray-400 text-sm py-4">{t("noOffersMadeNote")}</p>}</div>
                <h3 className="font-semibold text-gray-800 text-sm mb-2">{t("offersReceived")}</h3>
                <div className="space-y-2">{listings.filter(isMyListing).flatMap(l => l.offers.filter(o => o.status !== "replaced").map(o => ({ ...o, listing: l }))).map(o => (
                  <div key={o.id} className="bg-white border border-gray-100 rounded-xl p-3">
                    <div className="flex justify-between items-center mb-2"><div><p className="text-xs font-medium text-gray-700">{o.from}</p><p className="text-[10px] text-gray-400">{o.listing.brand} {o.listing.model}</p></div><span className="font-bold text-rose-600 text-sm">{o.amount}{o.currency || "₺"}</span></div>
                    {o.status === "pending" ? (<div className="flex gap-2"><button onClick={() => respondOffer(o.listing.id, o.id, "accepted")} className="flex-1 bg-green-500 text-white text-[11px] py-1.5 rounded-lg font-medium">{t("accept")}</button><button onClick={() => respondOffer(o.listing.id, o.id, "rejected")} className="flex-1 border border-gray-200 text-gray-500 text-[11px] py-1.5 rounded-lg font-medium">{t("reject")}</button></div>) : (<p className="text-[11px] text-gray-400">{o.status === "accepted" ? t("offerAcceptedStatus") : t("offerRejectedStatus")}</p>)}
                  </div>
                ))}{listings.filter(isMyListing).flatMap(l => l.offers.filter(o => o.status !== "replaced")).length === 0 && <p className="text-center text-gray-400 text-sm py-4">{t("noOffersReceivedNote")}</p>}</div>
              </>)}
            </div>
          </div>
        )}
        {(screen === "detail" || mapDetailOpen) && selectedMechanic && (
          mapDetailOpen ? (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto" onClick={() => setMapDetailOpen(false)}>
              <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg md:max-w-2xl my-auto max-h-[90vh] flex flex-col overflow-hidden">
                <MechDetailBody />
              </div>
            </div>
          ) : (
            <div className="max-w-md md:max-w-2xl mx-auto w-full flex flex-col flex-1">
              <MechDetailBody />
            </div>
          )
        )}
        {selectedListingId && selectedListing && (<>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setSelectedListingId(null)} />
          <div className="fixed inset-0 bg-white z-50 flex flex-col max-w-md md:max-w-2xl mx-auto md:my-6 md:rounded-3xl md:shadow-2xl overflow-hidden">
            <div className="relative">
              <button onClick={() => setSelectedListingId(null)} className="absolute top-4 left-4 z-10 w-9 h-9 bg-black/30 backdrop-blur rounded-full flex items-center justify-center text-white"><ChevronLeft size={18} /></button>
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <ShareButton title={`${selectedListing.brand} ${selectedListing.model}`} text={`${selectedListing.brand} ${selectedListing.model} — ${selectedListing.price}`} path={`?listing=${selectedListing.id}`} onShare={(channel, refCode) => recordShare("listing", selectedListing.id, channel, refCode)} className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center text-gray-600 hover:bg-white transition" />
                <button onClick={() => toggleFavorite(selectedListing.id)} className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center"><Heart size={16} className={favoriteIds.includes(selectedListing.id) ? "fill-rose-600 text-rose-600" : "text-gray-500"} /></button>
              </div>
              {(() => {
                const galleryPhotos = (selectedListing.photos && selectedListing.photos.length > 0) ? [selectedListing.photo, ...selectedListing.photos] : [selectedListing.photo];
                const activeIdx = Math.min(selectedListingPhotoIndex, galleryPhotos.length - 1);
                const activePhoto = galleryPhotos[activeIdx];
                return (
                  <>
                    {/* ÖNEMLİ: durum rozeti (Rezerve/İade Edildi vb.) artık fotoğraf <button>'ının İÇİNDE,
                        sabit yükseklikli (h-56) kutuya göre konumlanıyor. Önceden bu rozet <button>'ın
                        DIŞINDA, hem ana fotoğrafı hem de altındaki küçük resim şeridini saran ortak
                        "relative" kapsayıcının en altına göre konumlanıyordu — kapsayıcının toplam
                        yüksekliği (ana foto + şerit) arttıkça rozet şeridin üzerine biniyordu. Artık
                        kendi kutusuna sabitlendiği için şeritte kaç küçük resim olursa olsun asla
                        üzerine binmiyor. Fotoğraf sayacı ("1/2") ile çakışmaması için sayaç sol alta,
                        durum rozeti sağ alta alındı. */}
                    <button onClick={() => setListingLightboxOpen(true)} aria-label={t("enlargePhotoAria")} className="w-full h-56 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-7xl overflow-hidden relative cursor-zoom-in">
                      {isImgUrl(activePhoto) ? <img src={imgThumb(activePhoto, 900)} onError={imgFallbackHandler} alt={`${selectedListing.brand ?? ""} ${selectedListing.model ?? ""}`.trim() || t("listingPhotoAlt")} className="w-full h-full object-cover" /> : activePhoto}
                      {galleryPhotos.length > 1 && (<>
                        <span onClick={(e) => { e.stopPropagation(); setSelectedListingPhotoIndex((activeIdx - 1 + galleryPhotos.length) % galleryPhotos.length); }} role="button" aria-label={t("prevPhotoAria")} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-black/50 transition"><ChevronLeft size={16} /></span>
                        <span onClick={(e) => { e.stopPropagation(); setSelectedListingPhotoIndex((activeIdx + 1) % galleryPhotos.length); }} role="button" aria-label={t("nextPhotoAria")} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-black/50 transition"><ChevronRight size={16} /></span>
                        <span className="absolute bottom-3 left-4 text-[10px] font-bold text-white bg-black/40 backdrop-blur px-2 py-1 rounded-full">{activeIdx + 1}/{galleryPhotos.length}</span>
                      </>)}
                      <span className={`absolute bottom-3 right-4 text-white text-xs font-bold px-3 py-1.5 rounded-full ${listingStatusMeta(selectedListing.status, t).color}`}>{listingStatusMeta(selectedListing.status, t).label}</span>
                    </button>
                    {galleryPhotos.length > 1 && (
                      <div className="flex gap-1.5 px-4 py-2 bg-gray-50 overflow-x-auto">
                        {galleryPhotos.map((p, i) => (
                          <button key={i} onClick={() => { setSelectedListingPhotoIndex(i); setListingLightboxOpen(true); }} className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 flex items-center justify-center text-xl bg-white ${i === activeIdx ? "border-rose-600" : "border-transparent opacity-70"}`}>
                            {isImgUrl(p) ? <img src={imgThumb(p, 160)} loading="lazy" onError={imgFallbackHandler} alt={t("photoNumberAlt", { n: String(i + 1) })} className="w-full h-full object-cover" /> : p}
                          </button>
                        ))}
                      </div>
                    )}
                    {listingLightboxOpen && (
                      <PhotoLightbox
                        photos={galleryPhotos}
                        index={activeIdx}
                        onIndexChange={setSelectedListingPhotoIndex}
                        onClose={() => setListingLightboxOpen(false)}
                        title={`${selectedListing.brand ?? ""} ${selectedListing.model ?? ""}`.trim()}
                      />
                    )}
                  </>
                );
              })()}
            </div>
            <div className="flex-1 overflow-y-auto p-5 md:p-8">
              <h1 className="text-xl font-bold text-gray-800">{selectedListing.brand} {selectedListing.model}</h1>
              {selectedListing.city && <p className="text-gray-400 text-xs mt-1 flex items-center gap-1"><MapPin size={12} />{selectedListing.city}</p>}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <p className="text-3xl font-bold text-rose-700">{selectedListing.price}</p>
                {selectedListing.negotiable && <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{t("negotiableBadge")}</span>}
                {selectedListing.featured && <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{t("featuredBadge")}</span>}
              </div>
              {(() => {
                const cmp = listingPriceComparison(selectedListing);
                if (!cmp || cmp.tier === "average") return null;
                return (
                  <p className={`text-[11px] font-medium mt-1 ${cmp.tier === "below" ? "text-emerald-600" : "text-amber-600"}`}>
                    {cmp.tier === "below" ? t("priceBelowAverage", { pct: String(Math.abs(cmp.diffPercent)) }) : t("priceAboveAverage", { pct: String(cmp.diffPercent) })}
                  </p>
                );
              })()}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><Gauge size={16} className="mx-auto mb-1 text-gray-400" /><p className="text-[9px] text-gray-400">{t("mileage")}</p><p className="text-xs font-bold text-gray-700">{Number(selectedListing.km).toLocaleString("tr-TR")} km</p></div>
                <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><CalendarDays size={16} className="mx-auto mb-1 text-gray-400" /><p className="text-[9px] text-gray-400">{t("firstReg")}</p><p className="text-xs font-bold text-gray-700">{selectedListing.firstReg || selectedListing.year}</p></div>
                <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><Fuel size={16} className="mx-auto mb-1 text-gray-400" /><p className="text-[9px] text-gray-400">{t("fuelType")}</p><p className="text-xs font-bold text-gray-700">{selectedListing.fuelType ? vocabLabel(selectedListing.fuelType, lang, FUEL_TYPE_LABELS_BY_LANG) : "—"}</p></div>
                <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><Cog size={16} className="mx-auto mb-1 text-gray-400" /><p className="text-[9px] text-gray-400">{t("transmission")}</p><p className="text-xs font-bold text-gray-700">{selectedListing.transmission ? vocabLabel(selectedListing.transmission, lang, TRANSMISSION_LABELS_BY_LANG) : "—"}</p></div>
                <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><Zap size={16} className="mx-auto mb-1 text-gray-400" /><p className="text-[9px] text-gray-400">{t("power")}</p><p className="text-xs font-bold text-gray-700">{selectedListing.power ? `${selectedListing.power} HP` : "—"}</p></div>
                <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><Palette size={16} className="mx-auto mb-1 text-gray-400" /><p className="text-[9px] text-gray-400">{t("color")}</p><p className="text-xs font-bold text-gray-700">{selectedListing.color || "—"}</p></div>
                <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><Car size={16} className="mx-auto mb-1 text-gray-400" /><p className="text-[9px] text-gray-400">{t("bodyTypePlaceholder")}</p><p className="text-xs font-bold text-gray-700">{selectedListing.bodyType ? vocabLabel(selectedListing.bodyType, lang, BODY_TYPE_LABELS_BY_LANG) : "—"}</p></div>
                <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><Wrench size={16} className="mx-auto mb-1 text-gray-400" /><p className="text-[9px] text-gray-400">{t("engineSizeLabel")}</p><p className="text-xs font-bold text-gray-700">{selectedListing.engineSize || "—"}</p></div>
                <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><Compass size={16} className="mx-auto mb-1 text-gray-400" /><p className="text-[9px] text-gray-400">{t("drivetrainPlaceholder")}</p><p className="text-xs font-bold text-gray-700">{selectedListing.drivetrain ? vocabLabel(selectedListing.drivetrain, lang, DRIVETRAIN_LABELS_BY_LANG) : "—"}</p></div>
                <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><DoorOpen size={16} className="mx-auto mb-1 text-gray-400" /><p className="text-[9px] text-gray-400">{t("doorCountPlaceholder")}</p><p className="text-xs font-bold text-gray-700">{selectedListing.doorCount || "—"}</p></div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 flex-wrap"><span className={`px-2 py-1 rounded-full font-medium ${selectedListing.sellerType === "mechanic" ? "bg-rose-100 text-rose-700" : "bg-rose-50 text-rose-600"}`}>{selectedListing.sellerType === "mechanic" ? t("sellerTypeMechanic") : t("sellerTypeOwner")}</span><span>{selectedListing.sellerName}</span><span className="text-gray-300">·</span><span className="text-gray-400">{t("listingNumberLabel", { id: String(selectedListing.id) })}</span></div>
              {selectedListing.inspectionReportUrl && (
                <a href={selectedListing.inspectionReportUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"><FileText size={12} /> {t("inspectionReportAvailableLabel")}</a>
              )}
              {(() => {
                const sellerMechanic = selectedListing.sellerType === "mechanic" ? mechanicsList.find(m => selectedListing.sellerId != null ? m.id === selectedListing.sellerId : m.name === selectedListing.sellerName) : null;
                const sellerOwner = selectedListing.sellerType === "owner" ? ownersDirectory.find(o => selectedListing.sellerId != null ? o.id === selectedListing.sellerId : o.name === selectedListing.sellerName) : null;
                if (!sellerMechanic && !sellerOwner) return null;
                return (
                  <div className="mt-3 bg-gray-50 border border-gray-200 rounded-2xl p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-lg flex-shrink-0">{sellerMechanic ? sellerMechanic.img : "👤"}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-gray-800 truncate">{selectedListing.sellerName}</span>
                        {sellerMechanic?.verified && <BadgeCheck size={14} className="text-blue-500 flex-shrink-0" />}
                      </div>
                      {sellerMechanic ? (
                        <p className="text-[11px] text-gray-500">{t("respondsWithinNote", { rating: String(sellerMechanic.rating), reviews: String(sellerMechanic.reviews), mins: String(sellerMechanic.avgResponseMinutes) })}</p>
                      ) : sellerOwner ? (
                        <p className="text-[11px] text-gray-500">{t("memberSinceLabel", { date: sellerOwner.joinDate ? new Date(sellerOwner.joinDate).toLocaleDateString("tr-TR", { year: "numeric", month: "long" }) : "—" })}</p>
                      ) : null}
                    </div>
                  </div>
                );
              })()}
              <p className="text-sm text-gray-600 mt-4 leading-relaxed whitespace-pre-line"><TranslatedText id={`listing-desc-${selectedListing.id}`} text={selectedListing.description} fromLang={selectedListing.lang || "tr"} viewerLang={role === "mechanic" ? (myProfile?.lang || "tr") : ownerLang} /></p>
              {(selectedListing.ownerCount || selectedListing.paintedParts !== undefined || selectedListing.changedParts !== undefined || selectedListing.tradeIn) && (
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2"><Shield size={15} className="text-rose-500" /> {t("vehicleHistoryTitle")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {!!selectedListing.ownerCount && (<span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-gray-100 text-gray-700"><User size={12} /> {t("ownerNumberLabel", { n: String(selectedListing.ownerCount) })}</span>)}
                    {(!Number(selectedListing.paintedParts) && !Number(selectedListing.changedParts)) ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><BadgeCheck size={12} /> {t("noPaintChangeLabel")}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200"><PaintBucket size={12} /> {t("paintedChangedPartsLabel", { painted: String(Number(selectedListing.paintedParts) || 0), changed: String(Number(selectedListing.changedParts) || 0) })}</span>
                    )}
                    {!!selectedListing.tradeIn && (<span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200"><Repeat size={12} /> {t("tradeInAvailableLabel")}</span>)}
                  </div>
                </div>
              )}
              {(selectedListing.seatCount || selectedListing.fuelConsumption || selectedListing.co2Emission || selectedListing.emissionClass) && (
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2"><Leaf size={15} className="text-rose-500" /> {t("fuelConsumptionSection")}</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><User size={16} className="mx-auto mb-1 text-gray-400" /><p className="text-[9px] text-gray-400">{t("seatCountPlaceholder")}</p><p className="text-xs font-bold text-gray-700">{selectedListing.seatCount || "—"}</p></div>
                    <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><Droplet size={16} className="mx-auto mb-1 text-gray-400" /><p className="text-[9px] text-gray-400">{t("consumptionLabel")}</p><p className="text-xs font-bold text-gray-700">{selectedListing.fuelConsumption ? `${selectedListing.fuelConsumption} L/100km` : "—"}</p></div>
                    <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><Leaf size={16} className="mx-auto mb-1 text-gray-400" /><p className="text-[9px] text-gray-400">{t("co2Label")}</p><p className="text-xs font-bold text-gray-700">{selectedListing.co2Emission ? `${selectedListing.co2Emission} g/km` : "—"}</p></div>
                  </div>
                  {selectedListing.emissionClass && (<span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mt-2"><BadgeCheck size={12} /> {selectedListing.emissionClass}</span>)}
                </div>
              )}
              {(selectedListing.batteryCapacity || selectedListing.rangeKm) && (
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2"><BatteryCharging size={15} className="text-rose-500" /> {t("evDataTitle")}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><BatteryCharging size={16} className="mx-auto mb-1 text-gray-400" /><p className="text-[9px] text-gray-400">{t("batteryLabel")}</p><p className="text-xs font-bold text-gray-700">{selectedListing.batteryCapacity ? `${selectedListing.batteryCapacity} kWh` : "—"}</p></div>
                    <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><Compass size={16} className="mx-auto mb-1 text-gray-400" /><p className="text-[9px] text-gray-400">{t("rangeLabel")}</p><p className="text-xs font-bold text-gray-700">{selectedListing.rangeKm ? `${selectedListing.rangeKm} km` : "—"}</p></div>
                  </div>
                </div>
              )}
              {selectedListing.features && selectedListing.features.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2"><Tag size={15} className="text-rose-500" /> {t("featuresSection")}</h3>
                  {/* Donanım sayısı artık sabit olmayabiliyor (kullanıcı kendi donanımını da
                      ekleyebiliyor, bkz. addCustomFeature) — çok sayıda donanımda karmaşık
                      görünmemesi için renk döngüsü kaldırıldı, tek/sade bir rozet stili kullanılıyor. */}
                  <div className="flex flex-wrap gap-2">
                    {selectedListing.features.map((f) => (
                      <span key={f} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border bg-gray-50 text-gray-600 border-gray-200"><Tag size={10} className="text-rose-500" /> {f}</span>
                    ))}
                  </div>
                </div>
              )}
              {(() => {
                const sims = similarListings(selectedListing);
                if (sims.length === 0) return null;
                return (
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2"><Car size={15} className="text-rose-500" /> {t("similarListingsTitle")}</h3>
                    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                      {sims.map(sl => (
                        <button key={sl.id} onClick={() => { setSelectedListingId(sl.id); setSelectedListingPhotoIndex(0); }} className="flex-shrink-0 w-36 text-left bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition">
                          <div className="w-full h-24 bg-gray-100 flex items-center justify-center text-3xl overflow-hidden">
                            {isImgUrl(sl.photo) ? <img src={imgThumb(sl.photo, 300)} loading="lazy" onError={imgFallbackHandler} alt={`${sl.brand} ${sl.model}`} className="w-full h-full object-cover" /> : sl.photo}
                          </div>
                          <div className="p-2">
                            <p className="text-[11px] font-semibold text-gray-800 truncate">{sl.brand} {sl.model}</p>
                            <p className="text-[10px] text-gray-400">{sl.year} · {Number(sl.km).toLocaleString("tr-TR")} km</p>
                            <p className="text-xs font-bold text-rose-700 mt-0.5">{sl.price}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
              {(() => {
                const isOwnListing = isMyListing(selectedListing);
                const activeOffers = selectedListing.offers.filter(o => o.status !== "replaced");
                if (isOwnListing) return (
                  <>
                    <div className="mt-5 bg-rose-50 rounded-2xl p-3 text-xs text-rose-700 flex items-center gap-2"><Tag size={14} className="flex-shrink-0" /> {t("ownListingNotice")}</div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><Eye size={14} className="mx-auto mb-1 text-gray-400" /><p className="text-sm font-bold text-gray-800">{listingViewStats?.totalViews ?? "—"}</p><p className="text-[9px] text-gray-400">{t("viewsLabel")}</p></div>
                      <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><Share2 size={14} className="mx-auto mb-1 text-gray-400" /><p className="text-sm font-bold text-gray-800">{selectedListing.shareCount || 0}</p><p className="text-[9px] text-gray-400">{t("sharesLabel")}</p></div>
                      <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><Heart size={14} className="mx-auto mb-1 text-gray-400" /><p className="text-sm font-bold text-gray-800">{listingFavoriteCount(selectedListing.id)}</p><p className="text-[9px] text-gray-400">{t("favoriteLabel")}</p></div>
                    </div>
                    {listingViewStats?.monthly && listingViewStats.monthly.length > 1 && (
                      <div className="mt-2 bg-white border border-gray-200 rounded-2xl p-3">
                        <h4 className="text-[11px] font-semibold text-gray-500 mb-2">{t("viewTrendTitle")}</h4>
                        <div className="flex items-end gap-1.5 h-14">
                          {listingViewStats.monthly.map((m) => {
                            const max = Math.max(...listingViewStats.monthly.map(x => x.views), 1);
                            const h = Math.max(4, Math.round((m.views / max) * 56));
                            return (
                              <div key={m.month} className="flex-1 flex flex-col items-center justify-end gap-1" title={t("viewsTooltip", { month: m.month, views: String(m.views) })}>
                                <div className="w-full bg-rose-200 rounded-t" style={{ height: `${h}px` }} />
                                <span className="text-[8px] text-gray-400 whitespace-nowrap">{m.month.slice(5)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div className="mt-3 bg-white border border-gray-200 rounded-2xl p-3"><div className="flex items-center justify-between mb-2"><h4 className="text-xs font-semibold text-gray-500">{t("listingStatus")}</h4><span className={`text-[10px] text-white font-bold px-2 py-1 rounded-full ${listingStatusMeta(selectedListing.status, t).color}`}>{listingStatusMeta(selectedListing.status, t).label}</span></div><div className="flex gap-2">{["active", "reserved", "sold"].map(st => (<button key={st} onClick={() => setListingStatus(selectedListing.id, st)} className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium border transition ${selectedListing.status === st ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-500 border-gray-200"}`}>{listingStatusMeta(st, t).label}</button>))}</div></div>
                    <button onClick={() => requestFeaturedListing(selectedListing.id)} className={`w-full mt-2 py-2.5 rounded-2xl font-semibold text-sm transition flex items-center justify-center gap-2 border ${selectedListing.featured ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>⭐ {selectedListing.featured ? t("removeFromFeaturedBtn") : t("featureListingBtn", { price: String(FEATURED_LISTING_PRICE) })}</button>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => openSellForm({ brand: selectedListing.brand, model: selectedListing.model, year: selectedListing.year, km: selectedListing.km, price: selectedListing.price, description: selectedListing.description, photo: selectedListing.photo, fuelType: selectedListing.fuelType, transmission: selectedListing.transmission, power: selectedListing.power, firstReg: selectedListing.firstReg, color: selectedListing.color, bodyType: selectedListing.bodyType || "", engineSize: selectedListing.engineSize || "", drivetrain: selectedListing.drivetrain || "", ownerCount: selectedListing.ownerCount || "", paintedParts: selectedListing.paintedParts ?? "", changedParts: selectedListing.changedParts ?? "", tradeIn: !!selectedListing.tradeIn, doorCount: selectedListing.doorCount || "", features: selectedListing.features || [], photos: selectedListing.photos || [], seatCount: selectedListing.seatCount || "", fuelConsumption: selectedListing.fuelConsumption || "", co2Emission: selectedListing.co2Emission || "", emissionClass: selectedListing.emissionClass || "", batteryCapacity: selectedListing.batteryCapacity || "", rangeKm: selectedListing.rangeKm || "", city: selectedListing.city || "", negotiable: !!selectedListing.negotiable, inspectionReportUrl: selectedListing.inspectionReportUrl || "", featured: !!selectedListing.featured, _vehicleId: selectedListing._vehicleId || null, _editingId: selectedListing.id })} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition flex items-center justify-center gap-2"><Pencil size={14} /> {t("editListingBtn")}</button>
                      <button onClick={() => setConfirmDialog({ title: t("deleteListingConfirmTitle"), body: t("deleteListingConfirmBody"), confirmLabel: t("yesDeleteConfirmLabel"), danger: true, onConfirm: () => { removeListing(selectedListing.id); setSelectedListingId(null); } })} aria-label={t("deleteListingAria")} className="flex-shrink-0 border border-gray-200 text-red-400 hover:text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl transition"><Trash2 size={16} /></button>
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm mt-6 mb-2 flex items-center gap-2"><Banknote size={15} className="text-rose-600" /> {t("tabLabelOffers")} {activeOffers.length > 0 && <span className="text-gray-300 font-normal">({activeOffers.length})</span>}</h3>
                    {activeOffers.length === 0 ? (
                      <p className="text-center text-gray-400 text-xs py-4">{t("noOffersYetOnListing")}</p>
                    ) : (
                      <div className="space-y-2 mb-2">{activeOffers.map(o => (
                        <div key={o.id} className="bg-white border border-gray-100 rounded-xl p-3">
                          <div className="flex justify-between items-center mb-1"><span className="text-xs font-medium text-gray-700">{o.from}</span><span className="font-bold text-rose-700 text-sm">{o.amount}{o.currency || "₺"}</span></div>
                          {o.status === "pending" ? (
                            <div className="flex gap-2 mt-2"><button onClick={() => respondOffer(selectedListing.id, o.id, "accepted")} className="flex-1 bg-green-500 text-white text-[11px] py-1.5 rounded-lg font-medium">{t("accept")}</button><button onClick={() => respondOffer(selectedListing.id, o.id, "rejected")} className="flex-1 border border-gray-200 text-gray-500 text-[11px] py-1.5 rounded-lg font-medium">{t("reject")}</button></div>
                          ) : (
                            <p className="text-[11px] text-gray-400 mt-1">{o.status === "accepted" ? t("offerAcceptedStatus") : t("offerRejectedStatus")}</p>
                          )}
                        </div>
                      ))}</div>
                    )}
                    {selectedListing.messages.length > 0 && (<>
                      <h3 className="font-semibold text-gray-800 text-sm mt-5 mb-2 flex items-center gap-2"><MessageCircle size={15} className="text-rose-500" /> {t("questionsTitle")}</h3>
                      <div className="space-y-2">{selectedListing.messages.map(m => (<div key={m.id} className="bg-white border border-gray-200 rounded-xl p-3 text-xs"><span className="font-medium text-gray-700">{m.from}:</span> <span className="text-gray-600"><TranslatedText id={`listingmsg-${m.id}`} text={m.text} fromLang={m.lang || "tr"} viewerLang={role === "mechanic" ? (myProfile?.lang || "tr") : ownerLang} compact /></span></div>))}</div>
                    </>)}
                  </>
                );
                const myOffer = myPendingOfferOn(selectedListing);
                const currency = listingCurrency(selectedListing.price);
                const offerLabel = myOffer && !myOffer.seen ? t("updateOfferBtn") : myOffer ? t("newOfferBtn") : t("makeOffer");
                const sellerPhone = selectedListing.sellerType === "mechanic"
                  ? mechanicsList.find(m => selectedListing.sellerId != null ? m.id === selectedListing.sellerId : m.name === selectedListing.sellerName)?.phone
                  : ownersDirectory.find(o => selectedListing.sellerId != null ? o.id === selectedListing.sellerId : o.name === selectedListing.sellerName)?.phone;
                return (
                  <div className="grid grid-cols-2 gap-2 mt-5 sticky bottom-0 bg-white/95 backdrop-blur-sm pt-3 pb-2 -mx-5 px-5 md:-mx-8 md:px-8 border-t border-gray-100">
                    <button onClick={openOfferForm} className="bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition flex items-center justify-center gap-2"><Banknote size={15} /> {offerLabel}</button>
                    {selectedListing.sellerType === "mechanic" ? (
                      <button onClick={() => { const mech = mechanicsList.find(m => m.name === selectedListing.sellerName); if (mech) openChatWithMechanic(mech, `🚗 Bu sohbeti "${selectedListing.brand} ${selectedListing.model}" (İlan #${selectedListing.id}) ilanı hakkında başlattım.`); setSelectedListingId(null); }} className="border border-gray-200 text-gray-700 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition flex items-center justify-center gap-2"><MessageCircle size={15} /> {t("startChat")}</button>
                    ) : (
                      <button onClick={() => { const contextNote = `🚗 Bu sohbeti "${selectedListing.brand} ${selectedListing.model}" (İlan #${selectedListing.id}) ilanı hakkında başlattım.`; if (role === "mechanic") { openMechChatWithOwnerListing(contextNote); } else { openChatWithMechanic({ id: `seller-${selectedListing.sellerName}`, name: selectedListing.sellerName, img: "👤", lang: "tr" }, contextNote); } setSelectedListingId(null); }} className="border border-gray-200 text-gray-700 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition flex items-center justify-center gap-2"><MessageCircle size={15} /> {t("startChat")}</button>
                    )}
                    {sellerPhone && (
                      <a href={`tel:${sellerPhone.replace(/\s+/g, "")}`} className="col-span-2 border border-gray-200 text-gray-700 py-2.5 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition flex items-center justify-center gap-2"><Phone size={14} /> {t("callPhoneBtn", { phone: sellerPhone })}</a>
                    )}
                    {myOffer && <p className="col-span-2 text-[11px] text-gray-400 text-center">{t("myCurrentOfferNote", { amount: String(myOffer.amount), currency })}{myOffer.seen ? ` · ${t("sellerSawItSuffix")}` : ` · ${t("notSeenYetSuffix")}`}</p>}
                    <button onClick={() => openReportForm("listing", `İlan #${selectedListing.id} · ${selectedListing.sellerName}`, `"${selectedListing.brand} ${selectedListing.model}" ilanını bildiriyorum`)} className="col-span-2 flex items-center justify-center gap-1.5 text-[11px] text-gray-400 hover:text-red-500 transition py-1"><Flag size={11} /> {t("reportThisListingBtn")}</button>
                  </div>
                );
              })()}
            </div>
          </div>
        </>)}
        {selectedJobId && selectedJob && (() => { const isOwnJob = role === "mechanic" && (selectedJob.mechanicId != null ? selectedJob.mechanicId === MY_MECHANIC_ID : selectedJob.mechanicName === myProfile?.name); return (<>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setSelectedJobId(null)} />
          <div className="fixed inset-0 bg-white z-50 flex flex-col max-w-md md:max-w-2xl mx-auto md:my-6 md:rounded-3xl md:shadow-2xl overflow-hidden">
            <div className="bg-white text-gray-900 px-5 pt-6 pb-6 relative flex-shrink-0 border-b border-gray-200 shadow-sm">
              <button onClick={() => setSelectedJobId(null)} className="absolute top-4 left-4 z-10 w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-200 transition"><ChevronLeft size={18} /></button>
              <div className="absolute top-4 right-4 z-10">
                <ShareButton title={selectedJob.title} text={`${selectedJob.title} — ${selectedJob.mechanicName}`} path={`?job=${selectedJob.id}`} onShare={(channel, refCode) => recordShare("job", selectedJob.id, channel, refCode)} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-200 transition" />
              </div>
              <div className="flex items-center gap-3 mt-8">
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">{selectedJob.mechanicImg}</div>
                <div className="min-w-0">
                  <h1 className="text-lg font-bold leading-tight text-gray-900">{selectedJob.title}</h1>
                  <p className="text-gray-500 text-sm truncate">{selectedJob.mechanicName} · {selectedJob.location}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 md:p-8">
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${jobEmploymentColor(selectedJob.employmentType)}`}>{vocabLabel(selectedJob.employmentType, lang, EMPLOYMENT_TYPE_LABELS_BY_LANG)}</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 flex items-center gap-1"><GraduationCap size={12} /> {vocabLabel(selectedJob.experienceLevel, lang, EXPERIENCE_LEVEL_LABELS_BY_LANG)}</span>
                {(selectedJob.salaryMin || selectedJob.salaryMax) && <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-600 flex items-center gap-1"><Banknote size={12} /> {selectedJob.salaryMin && selectedJob.salaryMax ? `${Number(selectedJob.salaryMin).toLocaleString("tr-TR")} - ${Number(selectedJob.salaryMax).toLocaleString("tr-TR")}₺` : `${Number(selectedJob.salaryMin || selectedJob.salaryMax).toLocaleString("tr-TR")}₺+`}</span>}
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full text-white ${jobStatusMeta(selectedJob.status, t).color}`}>{jobStatusMeta(selectedJob.status, t).label}</span>
              </div>
              <h3 className="font-semibold text-gray-800 text-sm mb-2">{t("positionDescriptionTitle")}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-5">{selectedJob.description ? <TranslatedText id={`job-desc-${selectedJob.id}`} text={selectedJob.description} fromLang={selectedJob.lang || "tr"} viewerLang={role === "mechanic" ? (myProfile?.lang || "tr") : ownerLang} /> : "—"}</p>
              {selectedJob.requirements.length > 0 && (<>
                <h3 className="font-semibold text-gray-800 text-sm mb-2">{t("requiredQualificationsTitle")}</h3>
                <div className="space-y-1.5 mb-5">{selectedJob.requirements.map((r, i) => (<div key={i} className="flex items-start gap-2 text-sm text-gray-600"><CheckCircle2 size={14} className="text-rose-500 flex-shrink-0 mt-0.5" /><span>{r}</span></div>))}</div>
              </>)}
              {selectedJob.skills.length > 0 && (<>
                <h3 className="font-semibold text-gray-800 text-sm mb-2">{t("skillsTitle")}</h3>
                <div className="flex flex-wrap gap-1.5 mb-5">{selectedJob.skills.map((s, i) => (<span key={i} className="text-xs font-medium px-2.5 py-1 rounded-full bg-rose-50 text-rose-600">{s}</span>))}</div>
              </>)}
              <p className="text-[11px] text-gray-400 flex items-center gap-1 mb-5"><Clock size={11} /> {t("postedOnLabel", { date: selectedJob.postedDate })}</p>
              {isOwnJob ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2"><Users size={15} /> {t("applicationsTitle", { n: String(selectedJob.applicants.length) })}</h3>
                  <div className="space-y-2">{selectedJob.applicants.map(a => (<div key={a.id} className="bg-white border border-gray-100 rounded-xl p-3"><div className="flex justify-between items-center mb-1"><span className="text-xs font-semibold text-gray-700">{a.name}</span><div className="flex items-center gap-1.5 flex-shrink-0">{a.status === "rejected" && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-500">{t("rejectedLabel")}</span>}<span className="text-[10px] text-gray-400">{a.date}</span></div></div>{(a.phone || a.email || a.address) && (<div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-400 mb-1.5">{a.phone && <span className="flex items-center gap-1"><Phone size={10} /> {a.phone}</span>}{a.email && <span className="flex items-center gap-1"><Mail size={10} /> {a.email}</span>}{a.address && <span className="flex items-center gap-1"><MapPin size={10} /> {a.address}</span>}</div>)}{a.message && <p className="text-xs text-gray-500 mb-1.5"><TranslatedText id={`job-applicant-msg-${a.id}`} text={a.message} fromLang={a.lang || "tr"} viewerLang={myProfile?.lang || "tr"} compact /></p>}<div className="flex items-center gap-2 flex-wrap">{a.cvUrl ? (<a href={a.cvUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] font-medium text-rose-600 hover:text-rose-700 bg-rose-50 rounded-lg px-2 py-1 max-w-full min-w-0"><FileText size={12} className="flex-shrink-0" /><span className="truncate min-w-0">{a.cvName || "CV"}</span></a>) : (<span className="inline-flex items-center gap-1.5 text-[11px] text-gray-300"><FileText size={12} /> {t("noCvAttached")}</span>)}{a.status !== "rejected" && (<button onClick={() => rejectApplication(selectedJob.id, a.id)} className="text-[11px] font-medium text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-lg px-2 py-1 transition flex-shrink-0">{t("rejectCvBtn")}</button>)}</div></div>))}{selectedJob.applicants.length === 0 && <p className="text-center text-gray-400 text-xs py-4">{t("noApplicationsYet")}</p>}</div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => { openJobForm({ title: selectedJob.title, employmentType: selectedJob.employmentType, experienceLevel: selectedJob.experienceLevel, location: selectedJob.location, salaryMin: selectedJob.salaryMin, salaryMax: selectedJob.salaryMax, description: selectedJob.description, requirements: selectedJob.requirements.join("\n"), skills: selectedJob.skills.join(", "), _editingId: selectedJob.id }); setSelectedJobId(null); }} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-xs font-medium hover:bg-gray-100 transition flex items-center justify-center gap-1"><Pencil size={13} /> {t("editBtn")}</button>
                    <button onClick={() => { setJobListingStatus(selectedJob.id, selectedJob.status === "active" ? "closed" : "active"); }} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-xs font-medium hover:bg-gray-100 transition">{selectedJob.status === "active" ? t("closeListingBtn") : t("reopenListingBtn")}</button>
                    <button onClick={() => setConfirmDialog({ title: t("deleteListingConfirmTitle"), body: t("deleteJobConfirmBody"), confirmLabel: t("yesDeleteConfirmLabel"), danger: true, onConfirm: () => { removeJobListing(selectedJob.id); setSelectedJobId(null); } })} aria-label={t("deleteListingAria")} className="text-red-400 hover:text-red-600 px-3 py-2.5"><Trash2 size={16} /></button>
                  </div>
                </div>
              ) : role === "mechanic" ? (
                <div className="bg-gray-100 border border-gray-200 rounded-2xl p-4 text-center">
                  <p className="text-sm text-gray-600 mb-3">{t("needOwnerAccountToApplyNote")}</p>
                  <button onClick={goHome} className="w-full bg-gray-900 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-800 transition">{t("createOwnerAccountBtn")}</button>
                </div>
              ) : (
                <button onClick={openJobApplyForm} className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition flex items-center justify-center gap-2"><Briefcase size={15} /> {t("applyBtn")}</button>
              )}
            </div>
          </div>
        </>); })()}
        {screen === "chat" && activeConvo && (
          <div className="max-w-md md:max-w-2xl mx-auto w-full flex flex-col flex-1">
            <div className="bg-white text-gray-900 px-5 pt-6 pb-4 border-b border-gray-200 shadow-sm"><button onClick={() => setScreen("owner")} className="flex items-center gap-1 text-gray-500 mb-3 text-sm hover:text-gray-900 transition"><ChevronLeft size={18} /> {t("back")}</button><div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="text-2xl bg-rose-50 rounded-xl w-11 h-11 flex items-center justify-center">{activeConvo.mechanicImg}</div><h1 className="text-base font-bold text-gray-900">{activeConvo.mechanicName}</h1></div><select value={ownerLang} onChange={(e) => setOwnerLang(e.target.value)} className="bg-gray-100 text-gray-700 text-xs rounded-lg px-2 py-1 border-none outline-none"><option className="text-black" value="tr">🇹🇷 TR</option><option className="text-black" value="en">🇬🇧 EN</option><option className="text-black" value="de">🇩🇪 DE</option></select></div></div>
            <div className="flex-1 px-5 py-4 overflow-y-auto">{activeConvo.messages.map(m => (<ChatBubble key={m.id} msg={m} viewerLang={ownerLang} mine={m.sender === "owner"} />))}</div>
            {activeConvo.messages.length > 0 && activeConvo.messages[activeConvo.messages.length - 1].isRejectionNotice ? (
              <div className="px-5 pb-6 pt-2 border-t border-gray-100"><div className="bg-gray-100 text-gray-500 text-xs text-center py-3 rounded-xl">{t("applicationRejectedNotice")}</div></div>
            ) : (<>
              <div className="px-5 pb-2"><button onClick={() => {
                // Sohbet ekranı kendi tamirci bağlamını activeConvo.mechanicId üzerinden tutuyor —
                // selectedMechanicId ile senkron OLMAK ZORUNDA DEĞİL (ör. bu sohbete "Sohbetlerim"
                // listesinden doğrudan girildiyse selectedMechanicId hiç ayarlanmamış ya da BAŞKA bir
                // tamirciye ait olabilir). Randevu ekranı selectedMechanic'i okuduğu için burada
                // ayarlamazsak ya boş/çökmüş bir ekran ya da YANLIŞ tamirciyle randevu oluşurdu.
                const mech = mechanicsList.find(m => m.id === activeConvo.mechanicId);
                if (!mech) { setToast({ type: "info", text: t("mechanicNoLongerListed") }); return; }
                setSelectedMechanicId(mech.id);
                setSelectedDate(null); setSelectedTime(null); setBookingService(null); setProblemDesc(""); setProblemPhotos([]);
                setScreen("booking");
              }} className="w-full mb-3 bg-rose-50 text-rose-600 text-xs font-medium py-2 rounded-xl hover:bg-rose-100 transition flex items-center justify-center gap-1"><Calendar size={14} /> {t("bookWithThisMechanic")}</button></div>
              <div className="px-5 pb-6 pt-2 border-t border-gray-100 flex items-center gap-2"><input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" /><button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition flex-shrink-0"><ImageIcon size={18} /></button><input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendOwnerMessageWithReply(chatInput); }} placeholder={t("chatInputPlaceholder")} className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200" /><button onClick={() => sendOwnerMessageWithReply(chatInput)} className="w-10 h-10 flex items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700 transition flex-shrink-0"><Send size={16} /></button></div>
            </>)}
          </div>
        )}
        {screen === "booking" && selectedMechanic && (
          <div className="max-w-md md:max-w-2xl mx-auto w-full flex flex-col flex-1">
            <div className="bg-white text-gray-900 px-5 pt-6 pb-5 border-b border-gray-200 shadow-sm"><button onClick={() => setScreen(selectedMechanic ? "detail" : "owner")} className="flex items-center gap-1 text-gray-500 mb-3 text-sm hover:text-gray-900 transition"><ChevronLeft size={18} /> {t("back")}</button><h1 className="text-lg font-bold text-gray-900">{t("bookingTitle")}</h1></div>
            <div className="flex-1 px-5 md:px-8 py-4 md:grid md:grid-cols-2 md:gap-8">
              <div>
              <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2"><Car size={16} /> {t("bookingSelectVehicle")}</h3>
              {vehicles.length === 0 && !showAddVehicle ? (
                <div className="bg-gray-100 rounded-xl p-3 mb-3 text-xs text-gray-700">{t("bookingNoVehicles")}</div>
              ) : vehicles.length > 0 ? (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                  {vehicles.map(v => { const isSel = selectedBookingVehicleId === v.id; return (<button key={v.id} onClick={() => setSelectedBookingVehicleId(v.id)} className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition ${isSel ? "bg-rose-600 border-rose-600 text-white" : "border-gray-200 text-gray-600 hover:border-rose-300"}`}><Car size={14} className="flex-shrink-0" /><div><p className="text-xs font-semibold leading-tight whitespace-nowrap">{v.brand} {v.model}</p><p className={`text-[10px] leading-tight ${isSel ? "text-rose-100" : "text-gray-400"}`}>{v.plate}</p></div></button>); })}
                  <button onClick={() => setShowAddVehicle(!showAddVehicle)} className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed text-xs font-medium transition ${showAddVehicle ? "bg-rose-50 border-rose-300 text-rose-600" : "border-gray-300 text-gray-500 hover:border-rose-300 hover:text-rose-600"}`}><Plus size={14} /> {t("bookingAddVehicle")}</button>
                </div>
              ) : null}
              {(vehicles.length === 0 || showAddVehicle) && (
                <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3 space-y-2">
                  <input value={newVehicle.brand} onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })} placeholder={t("bookingBrandPlaceholder")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                  <input value={newVehicle.model} onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })} placeholder={t("bookingModelPlaceholder")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                  <div className="flex gap-2"><input value={newVehicle.year} onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })} placeholder={t("bookingYearPlaceholder")} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={newVehicle.plate} onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value })} placeholder={t("bookingPlatePlaceholder")} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                  <button onClick={addVehicle} className="w-full bg-rose-600 text-white py-3 rounded-2xl text-sm font-semibold hover:bg-rose-700 transition">{t("bookingAddAndSelect")}</button>
                </div>
              )}
              <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2 mt-3"><Calendar size={16} /> {t("bookingSelectDate")}</h3>
              <div className="flex gap-2 mb-5 overflow-x-auto pb-1">{nextDays.map((d, i) => { const isSel = selectedDate?.toDateString() === d.toDateString(); const open = isDayOpenForMechanic(selectedMechanic, d); return (<button key={i} disabled={!open} onClick={() => setSelectedDate(d)} className={`flex-shrink-0 w-14 py-2 rounded-xl border text-center transition ${!open ? "opacity-30 cursor-not-allowed" : isSel ? "bg-rose-600 border-rose-600 text-white" : "border-gray-200 text-gray-600 hover:border-rose-300"}`}><p className="text-[10px]">{d.toLocaleDateString("tr-TR", { weekday: "short" })}</p><p className="text-sm font-bold">{d.getDate()}</p></button>); })}</div>
              <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2"><Clock size={16} /> {t("bookingSelectTime")}</h3>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-5">{selectedDate ? slotsForDate(selectedMechanic, selectedDate).map(tm => (<button key={tm} onClick={() => setSelectedTime(tm)} className={`py-2 rounded-xl border text-sm font-medium transition ${selectedTime === tm ? "bg-rose-600 border-rose-600 text-white" : "border-gray-200 text-gray-600 hover:border-rose-300"}`}>{tm}</button>)) : <p className="col-span-3 md:col-span-4 text-xs text-gray-400 text-center py-4">{t("bookingSelectDateFirst")}</p>}{selectedDate && slotsForDate(selectedMechanic, selectedDate).length === 0 && <p className="col-span-3 md:col-span-4 text-xs text-gray-400 text-center py-4">{t("bookingClosedDay")}</p>}</div>
              <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2"><ToolIcon size={16} /> {t("bookingSelectService")}</h3>
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={bookingServiceSearch} onChange={(e) => setBookingServiceSearch(e.target.value)} placeholder={t("bookingServiceSearchPlaceholder")} className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              </div>
              <div className="flex flex-col gap-2 mb-5 max-h-64 overflow-y-auto pr-0.5">
                {bookingServiceOptions.length === 0 && (<p className="text-xs text-gray-400 text-center py-3">{t("noServiceMatch", { query: bookingServiceSearch })}</p>)}
                {bookingServiceOptions.map((s, i) => {
                  const isSel = bookingService && !bookingService.other && bookingService.name === s.name;
                  return (
                    <button key={i} onClick={() => setBookingService({ name: s.name, price: s.price, other: false, fixed: s.fixed })} className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left transition ${isSel ? "bg-rose-600 border-rose-600 text-white" : "border-gray-200 text-gray-600 hover:border-rose-300"}`}>
                      <span className="text-xs font-medium flex items-center gap-1.5 min-w-0"><ToolIcon size={12} className={`flex-shrink-0 ${isSel ? "text-white" : "text-rose-400"}`} /><span className="truncate">{s.name}{s.fromCatalog && <span className={`block text-[9px] font-normal ${isSel ? "text-rose-100" : "text-gray-400"}`}>{t("fromCatalogLabel")}</span>}</span></span>
                      <span className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${isSel ? "bg-white/20 text-white" : s.fixed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{s.fixed ? t("fixedPriceBadge") : t("variablePriceBadge")}</span>
                        {String(s.price || "").trim() && <span className="text-xs font-bold whitespace-nowrap">{s.price}</span>}
                      </span>
                    </button>
                  );
                })}
                <button onClick={() => setBookingService({ name: t("otherServiceLabel"), price: null, other: true, fixed: false })} className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left transition ${bookingService?.other ? "bg-rose-600 border-rose-600 text-white" : "border-gray-200 text-gray-600 hover:border-rose-300"}`}>
                  <span className="text-xs font-medium">{t("otherServiceLabel")}</span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${bookingService?.other ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"}`}>{t("determinedAfterRepair")}</span>
                </button>
              </div>
              <h3 className="font-semibold text-gray-800 text-sm mb-2">{t("problemDescLabel")}</h3>
              <textarea value={problemDesc} onChange={(e) => setProblemDesc(e.target.value)} placeholder={t("problemDescPlaceholder")} className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none" rows={3} />
              <div className="flex items-center gap-2 flex-wrap mb-1 md:mb-0">
                <input ref={problemPhotoRef} type="file" accept="image/*" onChange={addProblemPhoto} className="hidden" />
                {problemPhotos.map((src, i) => (
                  <div key={i} className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                    <img src={src} alt={t("vehiclePhotoAlt")} className="w-full h-full object-cover" />
                    <button onClick={() => removeProblemPhoto(i)} aria-label={t("removePhotoAria")} className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center"><X size={10} className="text-white" /></button>
                  </div>
                ))}
                <button onClick={() => problemPhotoRef.current?.click()} className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-rose-300 hover:text-rose-500 transition flex-shrink-0"><Camera size={16} /><span className="text-[9px] mt-0.5">{t("addPhotoLabel")}</span></button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">{t("problemPhotoHint")}</p>
              <label className="flex items-start gap-2.5 mt-3 bg-gray-50 rounded-xl p-3 cursor-pointer">
                <input type="checkbox" checked={shareHistoryConsent} onChange={(e) => setShareHistoryConsent(e.target.checked)} className="mt-0.5 w-4 h-4 accent-rose-600 flex-shrink-0" />
                <span className="text-xs text-gray-600"><span className="font-medium text-gray-800">{t("historyShareConsentTitle")}</span> {t("historyShareConsentDesc")}</span>
              </label>
              </div>
              <div>
              <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2 mt-1 md:mt-0"><Banknote size={16} /> {t("paymentSectionTitle")}</h3>
              {!bookingService ? (
                <div className="bg-gray-100 rounded-2xl p-4 mb-3 text-xs text-gray-700">{t("paymentSelectServiceFirst")}</div>
              ) : bookingService.other || !bookingService.fixed ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
                  <div className="flex justify-between items-center mb-2"><span className="text-xs text-gray-500">{t("serviceLabel")}</span><span className="text-sm font-semibold text-gray-800 text-right">{bookingService.name}</span></div>
                  <p className="text-xs text-gray-500 leading-relaxed bg-white rounded-xl p-3 border border-gray-200">{t("noFixedPriceNotice")} <b>{t("onSiteAfterRepair")}</b> {t("paymentWillBeMadeSuffix")}</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
                  <div className="flex justify-between items-center mb-3"><span className="text-xs text-gray-500">{bookingService.name}</span><span className="text-lg font-bold text-gray-800">{bookingService.price}</span></div>
                  <div className="flex gap-2 mb-3">
                    <button onClick={() => setPaymentForm(f => ({ ...f, method: "card" }))} className={`flex-1 py-2 rounded-xl text-xs font-medium border transition ${paymentForm.method === "card" ? "bg-rose-600 border-rose-600 text-white" : "border-gray-200 text-gray-600"}`}>{t("payNowOption")}</button>
                    <button onClick={() => setPaymentForm(f => ({ ...f, method: "onsite" }))} className={`flex-1 py-2 rounded-xl text-xs font-medium border transition ${paymentForm.method === "onsite" ? "bg-rose-600 border-rose-600 text-white" : "border-gray-200 text-gray-600"}`}>{t("payOnSiteOption")}</button>
                  </div>
                  {paymentForm.method === "card" && (
                    <div className="space-y-2">
                      <input value={paymentForm.cardNumber} onChange={(e) => setPaymentForm(f => ({ ...f, cardNumber: e.target.value }))} placeholder={t("cardNumberPlaceholder")} maxLength={19} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                      <div className="flex gap-2"><input value={paymentForm.expiry} onChange={(e) => setPaymentForm(f => ({ ...f, expiry: e.target.value }))} placeholder={t("expiryPlaceholder")} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={paymentForm.cvc} onChange={(e) => setPaymentForm(f => ({ ...f, cvc: e.target.value }))} placeholder={t("cvcPlaceholder")} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-3 flex items-start gap-1"><Lock size={11} className="flex-shrink-0 mt-0.5" /> {t("demoPaymentNotice")}</p>
                </div>
              )}
              {bookingService?.fixed && !bookingService.other && parsePriceNumber(bookingService.price) > EXPENSIVE_SERVICE_THRESHOLD && (
                <label className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3 mt-3 cursor-pointer">
                  <input type="checkbox" checked={approveExpensiveService} onChange={(e) => setApproveExpensiveService(e.target.checked)} className="mt-0.5 w-4 h-4 accent-rose-600 flex-shrink-0" />
                  <span className="text-xs text-gray-700">{t("expensiveServiceConfirmPrefix")} <strong>{bookingService.price}</strong> {t("expensiveServiceConfirmSuffix")}</span>
                </label>
              )}
              <button disabled={!selectedDate || !selectedTime || !bookingService || (vehicles.length > 0 && !selectedBookingVehicleId) || (bookingService?.fixed && !bookingService.other && paymentForm.method === "card" && paymentForm.cardNumber.trim().length < 12) || (bookingService?.fixed && !bookingService.other && parsePriceNumber(bookingService.price) > EXPENSIVE_SERVICE_THRESHOLD && !approveExpensiveService)} onClick={confirmBooking} className={`w-full py-3 rounded-2xl font-semibold text-sm transition mt-3 ${selectedDate && selectedTime && bookingService && (vehicles.length === 0 || selectedBookingVehicleId) && (!bookingService.fixed || bookingService.other || paymentForm.method === "onsite" || paymentForm.cardNumber.trim().length >= 12) && (!bookingService?.fixed || bookingService.other || parsePriceNumber(bookingService.price) <= EXPENSIVE_SERVICE_THRESHOLD || approveExpensiveService) ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>{t("confirmBookingBtn")}</button>
              </div>
            </div>
          </div>
        )}
        {screen === "confirmed" && (<div className="max-w-md mx-auto w-full flex-1 px-5 py-10 flex flex-col items-center text-center"><div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4"><Check size={40} className="text-green-500" /></div><h2 className="text-lg font-bold text-gray-800 mb-1">{autoAccept ? t("appointmentConfirmedTitle") : t("appointmentRequestSentTitle")}</h2><button onClick={() => { setScreen("owner"); setOwnerTab("appointments"); }} className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition mb-2 mt-4">{t("viewMyAppointmentBtn")}</button><button onClick={goHome} className="w-full border border-gray-200 text-gray-500 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition">{t("backToHomeBtn")}</button></div>)}
        {screen === "mechBrowse" && (
          <>
            <div className="bg-gradient-to-b from-rose-50 to-white text-gray-900 px-5 md:px-8 pt-6 pb-5 border-b border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3 max-w-7xl mx-auto w-full relative md:hidden">
                <span className="text-xs text-gray-500">{t("greetingHello")}{form.name ? `, ${form.name}` : ""} 🔧</span>
                <button onClick={() => setScreen("mechanicDashboard")} className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1"><ChevronLeft size={14}/> {t("backToDashboardBtn")}</button>
              </div>
              <div className="hidden md:flex items-center justify-between max-w-7xl mx-auto w-full relative mb-5">
                <div className="flex items-center gap-2 flex-shrink-0"><div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center"><Wrench size={16} className="text-white" /></div><span className="text-lg font-extrabold text-gray-900">Fix<span className="text-rose-600">perto</span></span></div>
                <div className="flex items-center gap-8">
                  {[{ key: "mechanics", label: t("findMechanic"), icon: Wrench }, { key: "cars", label: t("findCar"), icon: Car }, { key: "jobs", label: t("jobListingsNavLabel"), icon: Briefcase }].map(tab => {
                    const Icon = tab.icon; const active = ownerMode === tab.key;
                    return (<button key={tab.key} onClick={() => { setOwnerMode(tab.key); setQuery(""); }} className="relative flex items-center gap-1.5 pb-3 pt-1"><Icon size={16} className={active ? "text-gray-900" : "text-gray-400"} /><span className={`text-sm font-extrabold tracking-tight ${active ? "text-gray-900" : "text-gray-500"}`}>{tab.label}</span>{active && <span className="absolute -bottom-[1px] left-0 right-0 h-0.5 bg-gray-900 rounded-full" />}</button>);
                  })}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button onClick={() => setScreen("mechanicDashboard")} className="text-sm font-semibold text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-full transition whitespace-nowrap">{t("backToDashboardBtn")}</button>
                  <button onClick={() => { setScreen("mechProfilePage"); setMechProfileTab("profile"); }} title={t("profileSettingsTitle")} className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden text-lg">{myProfile?.img || "🔧"}</button>
                </div>
              </div>
              <div className="max-w-7xl mx-auto w-full relative">
                <div className={`transition-all duration-300 ease-out overflow-hidden ${heroCollapsed ? "max-h-0 opacity-0 -translate-y-3 mb-0 pointer-events-none" : "max-h-56 opacity-100 translate-y-0 mb-4"}`}>
                  <div className="flex items-center justify-center md:hidden mb-4">
                    <div className="inline-flex items-center gap-0.5 bg-gray-100 rounded-full p-1">
                      <button onClick={() => { setOwnerMode("mechanics"); setQuery(""); }} className={`px-3.5 py-2 rounded-full text-xs font-extrabold tracking-tight transition flex items-center gap-1.5 ${ownerMode === "mechanics" ? "bg-white text-rose-600 shadow-sm" : "text-gray-500"}`}><Wrench size={13} /> {t("findMechanic")}</button>
                      <button onClick={() => { setOwnerMode("cars"); setQuery(""); }} className={`px-3.5 py-2 rounded-full text-xs font-extrabold tracking-tight transition flex items-center gap-1.5 ${ownerMode === "cars" ? "bg-white text-rose-600 shadow-sm" : "text-gray-500"}`}><Car size={13} /> {t("findCar")}</button>
                      <button onClick={() => { setOwnerMode("jobs"); setQuery(""); }} className={`px-3.5 py-2 rounded-full text-xs font-extrabold tracking-tight transition flex items-center gap-1.5 ${ownerMode === "jobs" ? "bg-white text-rose-600 shadow-sm" : "text-gray-500"}`}><Briefcase size={13} /> {t("jobListingsNavLabel")}</button>
                    </div>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-0 leading-snug text-gray-900 text-center">{ownerMode === "mechanics" ? t("discoverOtherMechanicsTitle") : ownerMode === "cars" ? t("carMarket") : t("jobListingsNavLabel")}</h1>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center gap-2 p-2 pl-2.5 md:hidden">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">{ownerMode === "cars" ? <Car size={18} className="text-rose-700" /> : ownerMode === "jobs" ? <Briefcase size={18} className="text-rose-700" /> : <Wrench size={18} className="text-rose-700" />}</div>
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ownerMode === "mechanics" ? t("searchPlaceholder") : ownerMode === "cars" ? t("searchBrandModelPlaceholder") : t("searchPositionSkillPlaceholder")} className="flex-1 px-1 py-2 text-gray-800 text-sm focus:outline-none bg-transparent min-w-0" />
                  <button onClick={(e) => e.currentTarget.blur()} className="flex-shrink-0 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition">{t("searchBtn")}</button>
                </div>
                <div className="hidden md:flex items-stretch bg-white rounded-full border border-gray-300 shadow-lg divide-x divide-gray-200 max-w-xl mx-auto overflow-hidden">
                  <div className="flex-1 px-6 py-2.5"><label className="block text-[11px] font-bold text-gray-900">{ownerMode === "mechanics" ? t("brandFieldLabel") : ownerMode === "cars" ? t("brandModelFieldLabel") : t("positionFieldLabel")}</label><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ownerMode === "mechanics" ? t("searchPlaceholder") : ownerMode === "cars" ? t("searchBrandModelPlaceholder") : t("searchPositionSkillPlaceholder")} className="w-full text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none bg-transparent" /></div>
                  <div className="flex-1 px-6 py-2.5"><label className="block text-[11px] font-bold text-gray-900">{ownerMode === "mechanics" ? t("cityLabelShort") : t("locationFieldLabel")}</label><input value={locationQuery} onChange={(e) => setLocationQuery(e.target.value)} placeholder={ownerMode === "mechanics" ? t("searchCityPlaceholder") : t("cityOrDistrictPlaceholder")} className="w-full text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none bg-transparent" /></div>
                  <div className="flex items-center pr-2 pl-1"><button onClick={(e) => e.currentTarget.blur()} aria-label={t("searchBtn")} className="w-11 h-11 rounded-full bg-rose-600 hover:bg-rose-700 transition flex items-center justify-center flex-shrink-0"><Search size={17} className="text-white" /></button></div>
                </div>
              </div>
            </div>
            <BrowseHome />
          </>
        )}
        {screen === "mechanicDashboard" && !onboardingVisible && (
          <div className="max-w-md md:max-w-2xl mx-auto w-full flex flex-col flex-1">
            <div className="bg-gradient-to-b from-rose-50 to-white text-gray-900 px-5 pt-6 pb-5 border-b border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500">{t("greetingHello")}{form.name ? `, ${form.name}` : ""} 🔧</span>
                <div className="flex items-center gap-2.5">
                  <NotifBell />
                  <button onClick={() => setScreen("mechBrowse")} title={t("searchMechOrCarTitle")} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition"><Search size={15} /></button>
                  <button onClick={() => { setScreen("mechProfilePage"); setMechProfileTab("profile"); }} title={t("profileSettingsTitle")} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden text-sm hover:bg-gray-100 transition">{myProfile?.img || "🔧"}</button>
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-1 text-gray-900">{t("mechPanelTitle")}</h1>
              <div className="grid grid-cols-5 gap-1 bg-gray-100 rounded-xl p-1 mt-3">
                <button onClick={() => setMechTab("requests")} className={`py-1.5 rounded-lg text-[9px] font-medium transition ${mechTab === "requests" ? "bg-white text-rose-700 shadow-sm" : "text-gray-500"}`}>{t("mechTabAppointments")}</button>
                <button onClick={() => setMechTab("messages")} className={`py-1.5 rounded-lg text-[9px] font-medium transition ${mechTab === "messages" ? "bg-white text-rose-700 shadow-sm" : "text-gray-500"}`}>{t("mechTabMessages")}</button>
                <button onClick={() => setMechTab("market")} className={`py-1.5 rounded-lg text-[9px] font-medium transition ${mechTab === "market" ? "bg-white text-rose-700 shadow-sm" : "text-gray-500"}`}>{t("navMarket")}</button>
                <button onClick={() => setMechTab("favorites")} className={`py-1.5 rounded-lg text-[9px] font-medium transition flex items-center justify-center gap-0.5 ${mechTab === "favorites" ? "bg-white text-rose-700 shadow-sm" : "text-gray-500"}`}><Heart size={10} /> {t("mechTabFavorites")}</button>
                <button onClick={() => setMechTab("analytics")} className={`py-1.5 rounded-lg text-[9px] font-medium transition flex items-center justify-center gap-0.5 ${mechTab === "analytics" ? "bg-white text-rose-700 shadow-sm" : "text-gray-500"}`}><TrendingUp size={10} /> {t("mechTabAnalytics")}</button>
              </div>
            </div>
            {mechTab === "requests" && (
              <div className="flex-1 px-5 py-4">
                <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
                  <button onClick={() => setMechReqView("active")} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${mechReqView === "active" ? "bg-white shadow-sm text-rose-700" : "text-gray-400"}`}>{t("activeReqTab")} ({activeAppts.length})</button>
                  <button onClick={() => setMechReqView("quotes")} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${mechReqView === "quotes" ? "bg-white shadow-sm text-rose-700" : "text-gray-400"}`}><ClipboardList size={12} /> {t("quotesReqTab")} {myQuoteOffers.filter(o => o.status === "pending").length > 0 && (<span className="w-1.5 h-1.5 rounded-full bg-rose-600" />)}</button>
                  <button onClick={() => setMechReqView("history")} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${mechReqView === "history" ? "bg-white shadow-sm text-rose-700" : "text-gray-400"}`}><Calendar size={12} /> {t("historyReqTab")}</button>
                </div>
                {mechReqView === "active" && (<>
                  <div className="grid grid-cols-3 gap-2 mb-5 text-center">
                    <div className="bg-gray-100 rounded-xl p-2"><p className="text-sm font-bold text-gray-700">{appointments.filter(a=>a.status==="Onay Bekliyor").length}</p><p className="text-[9px] text-gray-500">{t("statPending")}</p></div>
                    <div className="bg-gray-100 rounded-xl p-2"><p className="text-sm font-bold text-gray-700">{appointments.filter(a=>a.status==="Sırada").length}</p><p className="text-[9px] text-gray-500">{t("statQueued")}</p></div>
                    <div className="bg-rose-50 rounded-xl p-2"><p className="text-sm font-bold text-rose-600">{appointments.filter(a=>a.status==="Tamire Alındı").length}</p><p className="text-[9px] text-gray-500">{t("statInProgress")}</p></div>
                  </div>
                  <div className="space-y-3">
                    {activeAppts.map(r => (
                      <div key={r.id} className="border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-2"><div><div className="flex items-center gap-1.5"><h4 className="font-semibold text-gray-800 text-sm">{r.customer}</h4>{customerNoShowCount(r.ownerId) > 0 && (<span title={t("noShowHistoryTitle", { n: String(customerNoShowCount(r.ownerId)) })} className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold"><AlertTriangle size={9} /> {t("noShowBadge", { n: String(customerNoShowCount(r.ownerId)) })}</span>)}</div><p className="text-xs text-gray-400">{r.vehicle}</p></div><span className={`text-[10px] px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusColor(r.status)}`}>{apptStatusLabel(r.status, lang)}</span></div>
                        <p className="text-xs text-gray-500 mb-3"><TranslatedText id={`appt-issue-${r.id}`} text={r.issue} fromLang={ownerLangFor(r.ownerId)} viewerLang={myProfile.lang || "tr"} /></p>
                        {r.issuePhotos && r.issuePhotos.length > 0 && (<div className="flex gap-1.5 mb-3">{r.issuePhotos.map((src, i) => (<img key={i} src={src} alt={t("issuePhotoAlt", { n: String(i + 1) })} className="w-12 h-12 rounded-lg object-cover border border-gray-100" />))}</div>)}
                        <div className="flex items-center justify-between gap-3 text-xs text-gray-400 mb-3"><div className="flex items-center gap-3"><span className="flex items-center gap-1"><Calendar size={12} />{r.date}</span><span className="flex items-center gap-1"><Clock size={12} />{r.time}</span></div><button onClick={() => openReportForm("customer", `Randevu #${r.id} · ${r.customer}`, `"${r.customer}" müşterisini bildiriyorum`)} className="flex items-center gap-1 text-gray-300 hover:text-red-500 transition"><Flag size={11} /> {t("reportBtn")}</button></div>
                        {r.historyShareConsent === false ? (<p className="flex items-center gap-1 text-[11px] text-gray-300 mb-3"><Lock size={11} /> {t("historyShareDeclinedNotice")}</p>) : (() => { const past = appointments.filter(a => a.ownerId === r.ownerId && a.id !== r.id && ["Tamir Tamamlandı", "İptal Edildi", "Reddedildi", "Gelmedi"].includes(a.status) && a.historyShareConsent !== false && isSameMechanicAppt(a)); if (past.length === 0) return null; const isOpen = expandedCustomerHistory === r.id; return (
                          <div className="mb-3">
                            <button onClick={() => setExpandedCustomerHistory(isOpen ? null : r.id)} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-rose-600 transition"><History size={11} /> {t("pastAppointmentsCount", { n: String(past.length) })} {isOpen ? t("hideLabel") : t("showLabel")} <ChevronRight size={11} className={`transition-transform ${isOpen ? "rotate-90" : ""}`} /></button>
                            {isOpen && (<div className="mt-2 space-y-1.5 bg-gray-50 rounded-xl p-2.5">{past.map(p => (<div key={p.id} className="flex items-center justify-between text-[11px]"><span className="text-gray-500 truncate">{p.date} · <TranslatedText id={`appt-issue-${p.id}`} text={p.issue} fromLang={ownerLangFor(p.ownerId)} viewerLang={myProfile.lang || "tr"} compact /></span><span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${statusColor(p.status)}`}>{apptStatusLabel(p.status, lang)}</span></div>))}</div>)}
                          </div>
                        ); })()}
                        {r.status === "Onay Bekliyor" && (<div className="flex gap-2"><button onClick={() => acceptAppt(r.id)} className="flex-1 bg-rose-600 text-white text-xs py-2 rounded-xl font-medium hover:bg-rose-700 transition flex items-center justify-center gap-1"><ThumbsUp size={12} /> {t("acceptBtn")}</button><button onClick={() => rejectAppt(r.id)} className="flex-1 border border-gray-200 text-gray-500 text-xs py-2 rounded-xl font-medium hover:bg-gray-50 transition flex items-center justify-center gap-1"><ThumbsDown size={12} /> {t("rejectBtn")}</button></div>)}
                        {(r.status === "Sırada" || r.status === "Tamire Alındı") && (<div className="flex gap-2"><button onClick={() => r.status === "Tamire Alındı" ? setCompletingApptId(r.id) : advanceStatus(r.id)} className="flex-1 bg-rose-600 text-white text-xs py-2 rounded-xl font-medium hover:bg-rose-700 transition">{r.status === "Sırada" ? t("takeInForRepairBtn") : t("completedSmsBtn")}</button>{r.status === "Sırada" && (<button onClick={() => markNoShow(r.id)} className="border border-gray-200 text-gray-500 text-xs py-2 px-3 rounded-xl font-medium hover:bg-gray-50 transition whitespace-nowrap">{t("noShowBtn")}</button>)}</div>)}
                      </div>
                    ))}
                    {activeAppts.length === 0 && <p className="text-center text-gray-400 text-sm py-10">{t("noPendingWorkNotice")}</p>}
                  </div>
                </>)}
                {mechReqView === "quotes" && (
                  <div className="space-y-3">
                    {myQuoteOffers.length === 0 && <p className="text-center text-gray-400 text-sm py-10">{t("noQuoteRequestsNotice")}</p>}
                    {myQuoteOffers.map(o => {
                      const req = quoteRequests.find(r => r.id === o.requestId);
                      if (!req) return null;
                      const responding = respondingQuoteOfferId === o.id;
                      return (
                        <div key={o.id} className="border border-gray-100 rounded-2xl p-4 shadow-sm">
                          <div className="flex justify-between items-start mb-2"><div><h4 className="font-semibold text-gray-800 text-sm">{req.customer}</h4><p className="text-xs text-gray-400">{req.vehicle}</p></div><span className={`text-[10px] px-2 py-1 rounded-full font-medium whitespace-nowrap ${o.status === "pending" ? "bg-amber-50 text-amber-600" : o.status === "submitted" ? "bg-rose-50 text-rose-600" : o.status === "accepted" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}>{o.status === "pending" ? t("quoteStatusPending") : o.status === "submitted" ? t("quoteStatusSubmitted") : o.status === "accepted" ? t("quoteStatusAccepted") : o.status === "declined" ? t("quoteStatusDeclined") : t("quoteStatusLost")}</span></div>
                          <p className="text-xs text-gray-500 mb-3"><TranslatedText id={`quotereq-issue-${req.id}`} text={req.issue} fromLang={ownerLangFor(req.ownerId)} viewerLang={myProfile.lang || "tr"} /></p>
                          {req.photos && req.photos.length > 0 && (<div className="flex gap-1.5 mb-3">{req.photos.map((src, i) => (<img key={i} src={src} alt={t("issuePhotoAlt", { n: String(i + 1) })} className="w-12 h-12 rounded-lg object-cover border border-gray-100" />))}</div>)}
                          {o.status === "pending" && !responding && (<div className="flex gap-2"><button onClick={() => { setRespondingQuoteOfferId(o.id); setQuoteOfferForm({ price: "", etaDays: "", note: "" }); }} className="flex-1 bg-rose-600 text-white text-xs py-2 rounded-xl font-medium hover:bg-rose-700 transition">{t("giveQuoteBtn")}</button><button onClick={() => declineQuoteOffer(o.id)} className="border border-gray-200 text-gray-500 text-xs px-3 py-2 rounded-xl font-medium hover:bg-gray-50 transition">{t("declineQuoteBtn")}</button></div>)}
                          {o.status === "pending" && responding && (
                            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                              <div className="flex gap-2">
                                <div className="flex-1"><label className="text-[9px] text-gray-400 block mb-0.5">{t("priceLabel")}</label><input type="number" min="0" value={quoteOfferForm.price} onChange={(e) => setQuoteOfferForm(f => ({ ...f, price: e.target.value }))} placeholder={t("pricePlaceholderExample")} className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white" /></div>
                                <div className="w-24"><label className="text-[9px] text-gray-400 block mb-0.5">{t("durationDaysLabel")}</label><input type="number" min="0" value={quoteOfferForm.etaDays} onChange={(e) => setQuoteOfferForm(f => ({ ...f, etaDays: e.target.value }))} placeholder="1" className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white" /></div>
                              </div>
                              <textarea value={quoteOfferForm.note} onChange={(e) => setQuoteOfferForm(f => ({ ...f, note: e.target.value }))} rows={2} placeholder={t("noteOptionalPlaceholder")} className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white resize-none" />
                              {/* GERÇEK HATA DÜZELTMESİ: buton önceden `disabled` ile tamamen tıklanamaz hale geliyordu —
                              tarayıcılar disabled elemanlarda hiçbir click olayı ateşlemez, bu da geçersiz bir fiyatta
                              (ör. otomatik doldurma React state'ini senkronize etmeden inputu doldurmuşsa) kullanıcının
                              "butona basıyorum hiçbir şey olmuyor" şeklinde algılamasına yol açıyordu. Artık buton her
                              zaman tıklanabilir; geçersiz fiyatta submitQuoteOffer kendi içinde net bir uyarı gösteriyor. */}
                              <div className="flex gap-2"><button onClick={() => setRespondingQuoteOfferId(null)} className="flex-1 border border-gray-200 text-gray-500 text-[11px] py-1.5 rounded-lg font-medium">{t("giveUpBtn")}</button><button onClick={() => submitQuoteOffer(o.id)} className={`flex-1 text-[11px] py-1.5 rounded-lg font-medium ${parsePriceNumber(quoteOfferForm.price) ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-gray-300 text-gray-600"}`}>{t("sendQuoteBtn")}</button></div>
                            </div>
                          )}
                          {o.status === "submitted" && (<div className="bg-rose-50 rounded-xl p-3 flex items-center justify-between"><span className="text-xs text-gray-600">{t("yourQuoteLabel")} <strong className="text-rose-600">{o.price}₺</strong>{o.etaDays ? ` · ${o.etaDays} ${t("daysSuffix")}` : ""}</span><span className="text-[10px] text-gray-400">{t("awaitingResponseEllipsis")}</span></div>)}
                          {o.status === "accepted" && (<p className="text-[11px] text-green-600 flex items-center gap-1"><CheckCircle2 size={12} /> {t("quoteAcceptedNotice")}</p>)}
                          {o.status === "lost" && (<p className="text-[11px] text-gray-400">{t("quoteLostNotice")}</p>)}
                          {o.status === "declined" && (<p className="text-[11px] text-gray-400">{t("quoteDeclinedNotice")}</p>)}
                        </div>
                      );
                    })}
                  </div>
                )}
                {mechReqView === "history" && (
                  <div className="space-y-2">
                    {historyByDate.length === 0 && <p className="text-center text-gray-400 text-sm py-10">{t("noHistoryYetNotice")}</p>}
                    {historyByDate.map(([date, items]) => {
                      const isOpen = historyExpandedDate === date;
                      const completedCount = items.filter(i => i.status === "Tamir Tamamlandı").length;
                      return (
                        <div key={date} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                          <button onClick={() => setHistoryExpandedDate(isOpen ? null : date)} className="w-full flex items-center justify-between p-3">
                            <div className="flex items-center gap-2"><div className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center"><Calendar size={15} className="text-gray-400" /></div><div className="text-left"><p className="text-sm font-semibold text-gray-700">{date}</p><p className="text-[10px] text-gray-400">{t("completedAndRecordsCount", { done: String(completedCount), total: String(items.length) })}</p></div></div>
                            <ChevronRight size={14} className={`text-gray-300 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                          </button>
                          {isOpen && (<div className="px-3 pb-3 border-t border-gray-50 pt-2 space-y-2">{items.map(r => (<div key={r.id} className="bg-white border border-gray-200 rounded-xl p-3"><div className="flex justify-between items-start mb-1"><h4 className="text-xs font-semibold text-gray-700">{r.customer}</h4><span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${statusColor(r.status)}`}>{apptStatusLabel(r.status, lang)}</span></div><p className="text-[11px] text-gray-400">{r.vehicle}</p><p className="text-[11px] text-gray-500 mt-1"><TranslatedText id={`appt-issue-${r.id}`} text={r.issue} fromLang={ownerLangFor(r.ownerId)} viewerLang={myProfile.lang || "tr"} compact /></p><div className="flex items-center justify-between mt-1"><p className="text-[10px] text-gray-300 flex items-center gap-1"><Clock size={10} />{r.time}</p>{r.status === "Tamir Tamamlandı" && (<button onClick={() => downloadAppointmentReceipt(r)} className="text-[10px] text-rose-600 font-medium flex items-center gap-0.5 hover:underline"><FileText size={10} /> {t("downloadReceiptBtn")}</button>)}</div></div>))}</div>)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {/* ÖNEMLİ: conversations tablosu tüm tamircilerin (yalnızca kendi hesabımız değil, demo
                listesindeki diğer ~9 tamirci dahil) araç sahibiyle olan sohbetlerini tek bir tabloda
                tutuyor (her satır mechanicId ile ayrılıyor). Önceden bu liste hiç filtrelenmeden
                render ediliyordu — giriş yapmış tamirci (MY_MECHANIC_ID) kendi "Mesajlar" sekmesinde
                BAŞKA tamircilere ait sohbetleri de görüyordu, üstelik bir tanesine tıklayıp yanıt
                yazarsa (sendMechMessage) o mesaj o BAŞKA tamirciymiş gibi araç sahibine gidiyordu —
                gerçek bir kimlik karışıklığı/veri sızıntısı hatasıydı. Artık yalnızca kendi hesabımıza
                ait satırlar listeleniyor. */}
            {mechTab === "messages" && !mechConvo && (<div className="flex-1 px-5 py-4 space-y-3">{conversations.filter(c => c.mechanicId === MY_MECHANIC_ID).map(c => { const last = c.messages[c.messages.length - 1]; return (<button key={c.id} onClick={() => setMechActiveConvoId(c.id)} className="w-full text-left bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-rose-300 transition flex items-center gap-3"><div className="w-11 h-11 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0"><User size={20} className="text-rose-600" /></div><div className="flex-1 min-w-0"><h4 className="font-semibold text-gray-800 text-sm">{t("vehicleOwnerLabel")}</h4><p className="text-xs text-gray-400 truncate">{last ? last.text : t("noMessagesYet")}</p></div><ChevronRight size={16} className="text-gray-300" /></button>); })}{conversations.filter(c => c.mechanicId === MY_MECHANIC_ID).length === 0 && <p className="text-center text-gray-400 text-sm py-10">{t("noMessagesYet")}</p>}</div>)}
            {mechTab === "messages" && mechConvo && (<><div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2"><button onClick={() => setMechActiveConvoId(null)} className="text-gray-400"><ChevronLeft size={18} /></button><span className="text-sm font-semibold text-gray-800">{t("vehicleOwnerChatTitle")}</span></div><div className="flex-1 px-5 py-4 overflow-y-auto">{mechConvo.messages.map(m => (<ChatBubble key={m.id} msg={m} viewerLang={myProfile.lang || "tr"} mine={m.sender === "mechanic"} />))}</div><div className="px-5 pb-6 pt-2 border-t border-gray-100 flex items-center gap-2"><input value={mechChatInput} onChange={(e) => setMechChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendMechMessage(mechChatInput); }} placeholder={t("replyInputPlaceholder")} className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" /><button onClick={() => sendMechMessage(mechChatInput)} className="w-10 h-10 flex items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700 transition flex-shrink-0"><Send size={16} /></button></div></>)}
            {mechTab === "market" && (
              <div className="flex-1 px-5 py-4 overflow-y-auto">
                <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
                  <button onClick={() => setMechListingsSubTab("cars")} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${mechListingsSubTab === "cars" ? "bg-white shadow-sm text-rose-700" : "text-gray-400"}`}><Car size={13} /> {t("myCarListingsTab")}</button>
                  <button onClick={() => setMechListingsSubTab("jobs")} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${mechListingsSubTab === "jobs" ? "bg-white shadow-sm text-rose-700" : "text-gray-400"}`}><Briefcase size={13} /> {t("myJobListingsTab")}</button>
                </div>
                {mechListingsSubTab === "cars" && (() => {
                  const myCarListings = listings.filter(isMyListing);
                  const allSelected = myCarListings.length > 0 && gallerySelectedIds.length === myCarListings.length;
                  return (
                    <>
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <p className="text-xs text-gray-400">{t("myListingsSub")}</p>
                        {myProfile?.verified && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 flex items-center gap-1 flex-shrink-0"><BadgeCheck size={11} /> {t("authorizedDealerBadge")}</span>}
                      </div>
                      <button onClick={() => openSellForm(null)} className="w-full mb-4 bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition flex items-center justify-center gap-2"><Plus size={16} /> {t("sellMyCar")}</button>
                      {myCarListings.length === 0 ? (
                        <div className="text-center py-16"><Tag size={40} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-400 text-sm">{t("noOwnListings")}</p></div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <button onClick={() => setGallerySelectedIds(allSelected ? [] : myCarListings.map(l => l.id))} className="text-xs font-medium text-gray-500 hover:text-gray-800">{allSelected || gallerySelectedIds.length > 0 ? t("galleryClearSelectionBtn") : t("gallerySelectAllBtn")}</button>
                            {gallerySelectedIds.length > 0 && <span className="text-xs font-semibold text-rose-600">{t("gallerySelectedCountLabel", { n: String(gallerySelectedIds.length) })}</span>}
                          </div>
                          {gallerySelectedIds.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3 bg-rose-50 border border-rose-100 rounded-xl p-2.5">
                              <button onClick={() => bulkFeatureSelectedListings(true)} className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-rose-300 transition">{t("galleryBulkFeatureBtn")}</button>
                              <button onClick={() => bulkFeatureSelectedListings(false)} className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-rose-300 transition">{t("galleryBulkUnfeatureBtn")}</button>
                              <button onClick={() => bulkSetStatusSelectedListings("sold")} className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-rose-300 transition">{t("galleryBulkMarkSoldBtn")}</button>
                              <button onClick={() => bulkSetStatusSelectedListings("active")} className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-rose-300 transition">{t("galleryBulkMarkActiveBtn")}</button>
                              <button onClick={bulkDeleteSelectedListings} className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 transition flex items-center gap-1"><Trash2 size={12} /> {t("galleryBulkDeleteBtn")}</button>
                            </div>
                          )}
                          <div className="space-y-2">
                            {myCarListings.map(l => {
                              const days = listingDaysActive(l);
                              const stats = myListingsStats?.[l.id];
                              const msgCount = (l.messages || []).length;
                              const offerCount = (l.offers || []).filter(o => o.status !== "replaced").length;
                              const checked = gallerySelectedIds.includes(l.id);
                              return (
                                <div key={l.id} className={`bg-white border rounded-2xl p-3 transition ${checked ? "border-rose-300 ring-1 ring-rose-100" : "border-gray-200"}`}>
                                  <div className="flex items-center gap-3">
                                    <input type="checkbox" checked={checked} onChange={() => toggleGallerySelect(l.id)} aria-label={t("gallerySelectAllBtn")} className="w-4 h-4 flex-shrink-0 accent-rose-600" />
                                    <button onClick={() => setSelectedListingId(l.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">{isImgUrl(l.photo) ? <img src={imgThumb(l.photo, 100)} loading="lazy" onError={imgFallbackHandler} alt={`${l.brand ?? ""} ${l.model ?? ""}`.trim() || t("listingPhotoAlt")} className="w-full h-full object-cover" /> : l.photo}</div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{l.brand} {l.model} ({l.year})</p>
                                        <p className="text-xs text-gray-400">{l.price}{l.featured && <span className="ml-1.5 text-amber-500">★</span>}</p>
                                      </div>
                                    </button>
                                    <span className={`text-[10px] font-bold text-white px-2 py-1 rounded-full flex-shrink-0 ${l.adminRemoved ? "bg-gray-900" : listingStatusMeta(l.status, t).color}`}>{l.adminRemoved ? t("removedStatusLabel") : listingStatusMeta(l.status, t).label}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2 pt-2.5 mt-2.5 border-t border-gray-100 text-[11px] text-gray-400">
                                    <div className="flex items-center gap-3 flex-wrap">
                                      <span>{days != null ? t("galleryDaysActiveLabel", { n: String(days) }) : "—"}</span>
                                      <span className="flex items-center gap-1"><Eye size={11} /> {stats ? t("galleryViewsCountLabel", { n: String(stats.totalViews) }) : "…"}</span>
                                      <span>{t("galleryMessagesCountLabel", { n: String(msgCount) })}</span>
                                      <span>{offerCount > 0 ? t("offerCountSuffixShort", { n: String(offerCount) }) : t("noOffersYetShort")}</span>
                                    </div>
                                    <button onClick={() => openSellForm({ brand: l.brand, model: l.model, year: l.year, km: l.km, price: l.price, description: l.description, photo: l.photo, fuelType: l.fuelType, transmission: l.transmission, power: l.power, firstReg: l.firstReg, color: l.color, city: l.city || "", _vehicleId: null, _editingId: l.id })} className="text-gray-500 hover:text-gray-900 flex items-center gap-1 flex-shrink-0"><Pencil size={11} /> {t("editBtn")}</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}
                {mechListingsSubTab === "jobs" && (<>
                  <p className="text-xs text-gray-400 mb-3">{t("jobListingsHint")}</p>
                  <button onClick={() => openJobForm(null)} className="w-full mb-4 bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition flex items-center justify-center gap-2"><Plus size={16} /> {t("postNewJobBtn")}</button>
                  {/* ÖNEMLİ: mechanicId ile eşleştir — mechanicName (isim) ile eşleştirme, tamirci
                      işletme adını değiştirdiğinde kendi iş ilanlarının bu listeden tamamen
                      kaybolmasına (düzenleyememesine/kapatamamasına) yol açıyordu. */}
                  {jobListings.filter(j => j.mechanicId != null ? j.mechanicId === MY_MECHANIC_ID : j.mechanicName === myProfile?.name).length === 0 ? (<div className="text-center py-16"><Briefcase size={40} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-400 text-sm">{t("noOwnJobListings")}</p></div>) : (<div className="space-y-3">{jobListings.filter(j => j.mechanicId != null ? j.mechanicId === MY_MECHANIC_ID : j.mechanicName === myProfile?.name).map(j => (<JobCard key={j.id} j={j} />))}</div>)}
                </>)}
              </div>
            )}
            {mechTab === "favorites" && (
              <div className="flex-1 px-5 py-4 overflow-y-auto">
                {listings.filter(l => favoriteIds.includes(l.id)).length === 0 ? (
                  <div className="text-center py-16"><Heart size={40} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-400 text-sm">{t("noFavoritesYet")}</p><p className="text-gray-300 text-xs mt-1">{t("noFavoritesHint")}</p></div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{listings.filter(l => favoriteIds.includes(l.id)).map(l => (<ListingCard key={l.id} l={l} />))}</div>
                )}
              </div>
            )}
            {mechTab === "analytics" && (() => {
              const myAppts = appointments.filter(isSameMechanicAppt);
              const now = new Date();
              const withinDays = (a, days) => { if (!a.dateISO) return false; const d = new Date(a.dateISO); return (now.getTime() - d.getTime()) / 86400000 <= days && (now.getTime() - d.getTime()) >= 0; };
              // GERÇEK ÖZELLİK: tüm Analiz sekmesi (randevu/kazanç/trafik) tek bir zaman aralığı
              // seçiciyle (24 saat / 1 hafta / 1 ay / 6 ay / tüm zamanlar) filtrelenebiliyor —
              // bkz. ANALYTICS_RANGES (data/constants.ts) ve analyticsRange state'i.
              const RANGE_LABEL_KEYS = { "24h": "rangeLast24h", week: "rangeLastWeek", month: "rangeLastMonth", "6m": "rangeLast6Months", all: "rangeAllTime" };
              const selectedRangeDays = ANALYTICS_RANGES.find(r => r.key === analyticsRange)?.days ?? null;
              const inSelectedRange = (a) => selectedRangeDays == null ? true : withinDays(a, selectedRangeDays);
              const rangeAppts = myAppts.filter(inSelectedRange);
              const totalBooked = rangeAppts.length;
              const completedAll = rangeAppts.filter(a => a.status === "Tamir Tamamlandı");
              const cancelledAll = rangeAppts.filter(a => a.status === "İptal Edildi" || a.status === "Reddedildi");
              const noShowAll = rangeAppts.filter(a => a.status === "Gelmedi" || a.noShow);
              const completionRate = totalBooked > 0 ? Math.round((completedAll.length / totalBooked) * 100) : 0;
              const reviewList = myProfile?.reviewList || [];
              const avgRating = reviewList.length > 0 ? (reviewList.reduce((s, r) => s + r.rating, 0) / reviewList.length) : (myProfile?.rating || 0);
              const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({ star, count: reviewList.filter(r => Math.round(r.rating) === star).length }));
              const maxBreakdown = Math.max(1, ...ratingBreakdown.map(r => r.count));
              const completed = completedAll;
              const total = completed.reduce((s, a) => s + (a.servicePrice || 0), 0);
              const serviceMap: Record<string, { count: number; total: number }> = {};
              completed.forEach(a => { const name = (a.issue || "Diğer").split(" — ")[0]; if (!serviceMap[name]) serviceMap[name] = { count: 0, total: 0 }; serviceMap[name].count += 1; serviceMap[name].total += (a.servicePrice || 0); });
              const topServices = Object.entries(serviceMap).sort((a, b) => b[1].total - a[1].total).slice(0, 5);
              // Trafik sekmesi + PDF raporu her ikisi de bu değerlere ihtiyaç duyduğu için (bkz.
              // downloadAnalyticsReport) dıştaki scope'a taşındı — önceden yalnızca "traffic" alt
              // sekmesi içindeki bir IIFE'de hesaplanıyordu, PDF butonu her sekmede görünür olduğu
              // için erişemiyordu.
              const myOwnListings = listings.filter(isMyListing);
              const myOwnJobs = jobListings.filter(j => j.mechanicId === myProfile?.id);
              const myTotalShares = (myProfile?.shareCount || 0) + myOwnListings.reduce((s, l) => s + (l.shareCount || 0), 0) + myOwnJobs.reduce((s, j) => s + (j.shareCount || 0), 0);
              const myTotalApplicants = myOwnJobs.reduce((s, j) => s + (j.applicants || []).length, 0);
              const monthAbbr = MONTH_ABBR_BY_LANG[lang] || MONTH_ABBR_BY_LANG.tr;
              const formatMonth = (m) => { const parts = String(m).split("-"); return monthAbbr[parseInt(parts[1], 10) - 1] || m; };
              const stats = myProfileViewStats;
              // "all" seçiliyken tüm-zamanlar sayaçlarını (totalViews/conversions) kullan; aksi
              // halde backend'in `days` parametresiyle döndürdüğü aralık-bazlı sayıyı kullan —
              // bkz. backend/routes/profileViews.js `viewsInRange`/`conversionsInRange`.
              const rangeViews = stats ? (analyticsRange === "all" ? stats.totalViews : (stats.viewsInRange ?? stats.viewsThisYear)) : 0;
              const rangeConversions = stats ? (analyticsRange === "all" ? stats.conversions : (stats.conversionsInRange ?? stats.conversionsThisYear)) : 0;
              const viewConvRate = rangeViews > 0 ? Math.round((rangeConversions / rangeViews) * 100) : 0;
              const handleDownloadPdf = () => {
                try {
                  generateAnalyticsPdf({
                    mechanicName: myProfile?.name || t("myBusinessFallback"),
                    mechanicSpecialty: myProfile?.specialty || "",
                    rangeLabel: t(RANGE_LABEL_KEYS[analyticsRange]),
                    generatedAtLabel: now.toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "short" }),
                    totalBooked, completedCount: completedAll.length, cancelledCount: cancelledAll.length,
                    noShowCount: noShowAll.length, completionRate, avgRating, reviewCount: reviewList.length,
                    totalEarnings: total, topServices: topServices.map(([name, s]) => ({ name, count: s.count, total: s.total })),
                    rangeViews, rangeConversions, viewConvRate,
                    totalSharesAllTime: myTotalShares, activeListingsCount: myOwnListings.filter(l => !l.adminRemoved).length,
                    totalApplicantsCount: myTotalApplicants,
                    labels: {
                      reportSubtitle: t("pdfReportSubtitle"), periodLabel: t("pdfPeriodLabel"), generatedLabel: t("pdfGeneratedLabel"),
                      summaryTitle: t("pdfSummaryTitle"), totalBookingsLabel: t("totalBookingsLabel"), completionRateLabel: t("completionRateTitle"),
                      totalEarningsLabel: t("totalEarningsRow"), avgRatingLabel: t("avgRatingRow"), bookingBreakdownTitle: t("pdfBookingBreakdownTitle"),
                      cameLabel: t("cameLabel"), cancelledRejectedLabel: t("cancelledRejectedLabel"), noShowLabel: t("noShowBtn"),
                      topEarningServicesTitle: t("topEarningServicesTitle"), noPaidWorkYet: t("noPaidWorkYet"),
                      serviceColumn: t("pdfServiceColumn"), transactionsColumn: t("pdfTransactionsColumn"), earningsColumn: t("pdfEarningsColumn"),
                      profileVisitsTitle: t("profileVisitsTitle"), analyticsVisitsLabel: t("analyticsVisitsLabel"),
                      analyticsConversionsLabel: t("analyticsConversionsLabel"), conversionRateLabel: t("conversionRateLabel"),
                      periodSummaryReportTitle: t("periodSummaryReportTitle"), profileAndListingSharesRow: t("profileAndListingSharesRow"),
                      activeCarListingsRow: t("activeCarListingsRow"), totalJobApplicantsRow: t("totalJobApplicantsRow"),
                      reviewsCountRow: t("pdfReviewsCountRow"), footerNote: t("pdfFooterNote"), pageLabel: t("pdfPageLabel"),
                    },
                  });
                  setToast({ type: "info", text: t("pdfReportGeneratedToast") });
                } catch (err) {
                  setToast({ type: "info", text: t("pdfReportFailedToast") });
                }
              };
              return (
                <div className="flex-1 px-5 py-4 overflow-y-auto">
                  <div className="flex bg-gray-100 rounded-xl p-1 mb-3">
                    <button onClick={() => setMechAnalyticsView("overview")} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${mechAnalyticsView === "overview" ? "bg-white shadow-sm text-rose-700" : "text-gray-400"}`}><TrendingUp size={12} /> {t("analyticsOverviewTab")}</button>
                    <button onClick={() => setMechAnalyticsView("earnings")} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${mechAnalyticsView === "earnings" ? "bg-white shadow-sm text-rose-700" : "text-gray-400"}`}><Banknote size={12} /> {t("analyticsEarningsTab")}</button>
                    <button onClick={() => setMechAnalyticsView("traffic")} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${mechAnalyticsView === "traffic" ? "bg-white shadow-sm text-rose-700" : "text-gray-400"}`}><Compass size={12} /> {t("analyticsTrafficTab")}</button>
                  </div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-5 px-5">
                      {ANALYTICS_RANGES.map(r => { const key = RANGE_LABEL_KEYS[r.key]; return (
                        <button key={r.key} onClick={() => setAnalyticsRange(r.key)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition whitespace-nowrap ${analyticsRange === r.key ? "bg-rose-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{t(key)}</button>
                      ); })}
                    </div>
                  </div>
                  <button onClick={handleDownloadPdf} className="w-full mb-5 border border-rose-200 text-rose-600 py-2.5 rounded-xl font-semibold text-xs hover:bg-rose-50 transition flex items-center justify-center gap-1.5"><Download size={13} /> {t("downloadPdfReportBtn")}</button>
                  {mechAnalyticsView === "overview" && (<>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-rose-50 rounded-xl p-3"><p className="text-lg font-bold text-rose-600">{totalBooked}</p><p className="text-[10px] text-gray-500 mt-0.5">{t("totalBookingsLabel")}</p></div>
                      <div className="bg-gray-100 rounded-xl p-3"><p className="text-lg font-bold text-gray-700">{total.toLocaleString("tr-TR")}₺</p><p className="text-[10px] text-gray-500 mt-0.5">{t("totalEarningsRow")}</p></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      <div className="bg-green-50 rounded-xl p-2.5 text-center"><p className="text-sm font-bold text-green-600">{completedAll.length}</p><p className="text-[9px] text-gray-500 mt-0.5">{t("cameLabel")}</p></div>
                      <div className="bg-red-50 rounded-xl p-2.5 text-center"><p className="text-sm font-bold text-red-500">{cancelledAll.length}</p><p className="text-[9px] text-gray-500 mt-0.5">{t("cancelledRejectedLabel")}</p></div>
                      <div className="bg-amber-50 rounded-xl p-2.5 text-center"><p className="text-sm font-bold text-amber-600">{noShowAll.length}</p><p className="text-[9px] text-gray-500 mt-0.5">{t("noShowBtn")}</p></div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4">
                      <div className="flex items-center justify-between mb-1"><h3 className="text-sm font-bold text-gray-800">{t("completionRateTitle")}</h3><span className="text-sm font-bold text-rose-600">%{completionRate}</span></div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-rose-600 rounded-full" style={{ width: `${completionRate}%` }} /></div>
                      <p className="text-[10px] text-gray-400 mt-1.5">{t("completedOfTotalNote", { completed: String(completedAll.length), total: String(totalBooked) })}</p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold text-gray-800">{t("customerSatisfactionTitle")}</h3><span className="flex items-center gap-1 text-sm font-bold text-gray-900"><Star size={14} className="fill-gray-900" />{avgRating.toFixed(1)}</span></div>
                      {reviewList.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">{t("noReviewsYetNotice")}</p>
                      ) : (
                        <div className="space-y-1.5">
                          {ratingBreakdown.map(r => (
                            <div key={r.star} className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400 w-6 flex-shrink-0">{r.star}★</span>
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-amber-400 rounded-full" style={{ width: `${(r.count / maxBreakdown) * 100}%` }} /></div>
                              <span className="text-[10px] text-gray-400 w-5 flex-shrink-0 text-right">{r.count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-gray-300 mt-3">{t("basedOnReviewsNote", { n: String(reviewList.length) })}</p>
                    </div>
                  </>)}
                  {mechAnalyticsView === "earnings" && (<>
                    <div className="grid grid-cols-2 gap-2 mb-5">
                      <div className="bg-rose-50 rounded-xl p-3 text-center"><p className="text-base font-bold text-rose-600">{total.toLocaleString("tr-TR")}₺</p><p className="text-[9px] text-gray-500 mt-0.5">{t("totalEarningsRow")}</p></div>
                      <div className="bg-gray-100 rounded-xl p-3 text-center"><p className="text-base font-bold text-gray-700">{completed.length}</p><p className="text-[9px] text-gray-500 mt-0.5">{t("completedBookingsRow")}</p></div>
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 mb-2.5">{t("topEarningServicesTitle")}</h3>
                    {topServices.length === 0 ? (
                      <div className="text-center py-14"><Banknote size={36} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-400 text-sm">{t("noPaidWorkYet")}</p></div>
                    ) : (
                      <div className="space-y-2">{topServices.map(([name, s]) => (<div key={name} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-3 shadow-sm"><div className="min-w-0"><p className="text-xs font-semibold text-gray-800 truncate">{name}</p><p className="text-[10px] text-gray-400">{s.count} {t("transactionsCountSuffix")}</p></div><p className="text-sm font-bold text-rose-600 flex-shrink-0 ml-2">{s.total}₺</p></div>))}</div>
                    )}
                    <p className="text-[10px] text-gray-300 mt-4 text-center">{t("basedOnCompletedJobsNote", { n: String(completed.length) })}</p>
                  </>)}
                  {mechAnalyticsView === "traffic" && (() => {
                    return (
                      <>
                        <h3 className="text-sm font-bold text-gray-800 mb-2.5 flex items-center gap-1.5"><Compass size={14} className="text-rose-500" /> {t("profileVisitsTitle")}</h3>
                        {!stats ? (
                          <div className="text-center py-10 text-xs text-gray-400">{t("loadingEllipsis")}</div>
                        ) : (
                          <>
                            <div className="grid grid-cols-3 gap-2 mb-4">
                              <div className="bg-rose-50 rounded-xl p-3 text-center"><p className="text-base font-bold text-rose-600">{rangeViews}</p><p className="text-[9px] text-gray-500 mt-0.5">{t("analyticsVisitsLabel")}</p></div>
                              <div className="bg-gray-100 rounded-xl p-3 text-center"><p className="text-base font-bold text-gray-700">{rangeConversions}</p><p className="text-[9px] text-gray-500 mt-0.5">{t("analyticsConversionsLabel")}</p></div>
                              <div className="bg-gray-100 rounded-xl p-3 text-center"><p className="text-base font-bold text-gray-700">%{viewConvRate}</p><p className="text-[9px] text-gray-500 mt-0.5">{t("conversionRateLabel")}</p></div>
                            </div>
                            {stats.monthly.length > 0 && (
                              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-5">
                                <h4 className="text-xs font-semibold text-gray-700 mb-3">{t("monthlyVisitTrendTitle")}</h4>
                                <MiniBarChart labels={stats.monthly.map(m => formatMonth(m.month))} values={stats.monthly.map(m => m.views)} colorClass="bg-rose-500" />
                              </div>
                            )}
                            <p className="text-[10px] text-gray-300 mb-5">{t("totalAllTimeNote", { views: String(stats.totalViews), conversions: String(stats.conversions) })}</p>
                          </>
                        )}
                        <h3 className="text-sm font-bold text-gray-800 mb-2.5 flex items-center gap-1.5"><History size={14} className="text-rose-500" /> {t("periodSummaryReportTitle")}</h3>
                        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-2">
                          <div className="flex items-center justify-between text-sm"><span className="text-gray-500">{t("totalBookingsRow")}</span><span className="font-semibold text-gray-800">{totalBooked}</span></div>
                          <div className="flex items-center justify-between text-sm"><span className="text-gray-500">{t("completedBookingsRow")}</span><span className="font-semibold text-gray-800">{completedAll.length} (%{completionRate})</span></div>
                          <div className="flex items-center justify-between text-sm"><span className="text-gray-500">{t("totalEarningsRow")}</span><span className="font-semibold text-gray-800">{total.toLocaleString("tr-TR")}₺</span></div>
                          <div className="flex items-center justify-between text-sm"><span className="text-gray-500">{t("avgRatingRow")}</span><span className="font-semibold text-gray-800 flex items-center gap-1"><Star size={12} className="fill-gray-900" /> {avgRating.toFixed(1)} {t("reviewsCountParens", { n: String(reviewList.length) })}</span></div>
                          <div className="flex items-center justify-between text-sm"><span className="text-gray-500">{t("profileAndListingSharesRow")}</span><span className="font-semibold text-gray-800">{myTotalShares}</span></div>
                          <div className="flex items-center justify-between text-sm"><span className="text-gray-500">{t("analyticsVisitsLabel")}</span><span className="font-semibold text-gray-800">{rangeViews}</span></div>
                          <div className="flex items-center justify-between text-sm"><span className="text-gray-500">{t("activeCarListingsRow")}</span><span className="font-semibold text-gray-800">{myOwnListings.filter(l => !l.adminRemoved).length}</span></div>
                          <div className="flex items-center justify-between text-sm"><span className="text-gray-500">{t("totalJobApplicantsRow")}</span><span className="font-semibold text-gray-800">{myTotalApplicants}</span></div>
                        </div>
                        <p className="text-[10px] text-gray-300 mt-3 text-center">{t("yearlyReportFootnote")}</p>
                      </>
                    );
                  })()}
                </div>
              );
            })()}
          </div>
        )}
        {screen === "mechProfilePage" && myProfile && (
          <div className="max-w-md md:max-w-2xl mx-auto w-full flex flex-col flex-1">
            <div className="bg-gradient-to-b from-rose-50 to-white text-gray-900 px-5 pt-6 pb-5 border-b border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <button onClick={() => { if (mechProfileTab === "support") setMechProfileTab("settings"); else setScreen("mechanicDashboard"); }} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 text-gray-700 hover:bg-gray-100 transition"><ChevronLeft size={16} /></button>
                <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-white flex items-center justify-center text-lg flex-shrink-0">{myProfile.img || "🔧"}</div>
                <div className="min-w-0"><h1 className="text-lg font-bold truncate text-gray-900">{myProfile.name || t("myBusinessFallback")}</h1><p className="text-gray-500 text-xs">{t("profileSettingsTitle")}</p></div>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-gray-100 rounded-xl p-1">
                <button onClick={() => setMechProfileTab("profile")} className={`py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 ${mechProfileTab === "profile" ? "bg-white text-rose-700 shadow-sm" : "text-gray-500"}`}><Pencil size={12} /> {t("tabLabelProfile")}</button>
                <button onClick={() => setMechProfileTab("offers")} className={`py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 ${mechProfileTab === "offers" ? "bg-white text-rose-700 shadow-sm" : "text-gray-500"}`}><Banknote size={12} /> {t("tabLabelOffers")}</button>
                <button onClick={() => setMechProfileTab("settings")} className={`py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 ${mechProfileTab === "settings" ? "bg-white text-rose-700 shadow-sm" : "text-gray-500"}`}><Settings size={12} /> {t("tabLabelSettings")}</button>
              </div>
            </div>
            {mechProfileTab === "profile" && (
              <div className="flex-1 px-5 py-4 overflow-y-auto">
                <div className="bg-rose-100 rounded-xl p-3 mb-4 text-xs text-rose-800 flex items-center gap-2"><Pencil size={14} /> {t("changesApplyInstantly")}</div>
                <h3 className="font-semibold text-gray-800 text-sm mb-2">{t("basicInfoTitle")}</h3>
                <div className="space-y-2 mb-5"><input value={myProfile.name} onChange={(e) => updateMyField("name", e.target.value)} placeholder={t("businessNamePlaceholder")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={myProfile.specialty} onChange={(e) => updateMyField("specialty", e.target.value)} placeholder={t("specialtyPlaceholder")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} /><input value={myProfile.address} onChange={(e) => updateMyField("address", e.target.value)} placeholder={t("addressPlaceholder")} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} /><input value={myProfile.phone || ""} onChange={(e) => updateMyField("phone", e.target.value)} placeholder={t("phonePlaceholderExample")} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div><input value={myProfile.price} onChange={(e) => updateMyPriceField(e.target.value)} type="number" placeholder={t("priceTlPlaceholder")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-1.5"><Tag size={14} className="text-rose-500" /> {t("brandsServicedTitle")}</h3>
                <p className="text-[11px] text-gray-400 mb-2 -mt-1">{t("brandsServicedHint")}</p>
                {/* Donanımdaki gibi: sabit CAR_BRANDS listesinde olmayan bir marka da serbest metin
                    olarak eklenebiliyor; 25 sabit marka + eklenenler tek ızgarada karmaşık
                    görünmesin diye seçilmemiş olanlar varsayılan olarak daraltılıp "+N tane daha"
                    ile açılıyor. */}
                {(() => {
                  const selectedBrands = myProfile.brandsServiced || [];
                  const unselectedBrands = CAR_BRANDS.filter(b => !selectedBrands.includes(b));
                  const VISIBLE_COUNT = 8;
                  const visibleUnselected = showAllBrandOptions ? unselectedBrands : unselectedBrands.slice(0, VISIBLE_COUNT);
                  const hiddenCount = unselectedBrands.length - visibleUnselected.length;
                  return (
                    <div className="space-y-2 mb-5">
                      {selectedBrands.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedBrands.map(b => (
                            <button key={b} type="button" onClick={() => toggleBrandServiced(b)} className="pl-2.5 pr-2 py-1.5 rounded-full text-xs font-semibold border bg-rose-600 border-rose-600 text-white flex items-center gap-1 transition hover:bg-rose-700">{b} <X size={11} /></button>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {visibleUnselected.map(b => (
                          <button key={b} type="button" onClick={() => toggleBrandServiced(b)} className="text-xs font-semibold px-2.5 py-1.5 rounded-full border bg-white border-gray-200 text-gray-500 hover:border-rose-300 transition">{b}</button>
                        ))}
                        {hiddenCount > 0 && (
                          <button type="button" onClick={() => setShowAllBrandOptions(true)} className="text-xs font-semibold px-2.5 py-1.5 rounded-full border border-dashed border-gray-300 text-gray-400 hover:text-rose-500 hover:border-rose-300 transition">+{hiddenCount} {t("showMoreFeaturesSuffix")}</button>
                        )}
                        {showAllBrandOptions && unselectedBrands.length > VISIBLE_COUNT && (
                          <button type="button" onClick={() => setShowAllBrandOptions(false)} className="text-xs font-semibold px-2.5 py-1.5 rounded-full border border-dashed border-gray-300 text-gray-400 hover:text-rose-500 hover:border-rose-300 transition">{t("showLessFeaturesLabel")}</button>
                        )}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <input value={customBrandInput} onChange={(e) => setCustomBrandInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomBrand(); } }} placeholder={t("customBrandPlaceholder")} className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                        <button type="button" onClick={addCustomBrand} aria-label={t("addCustomBrandAria")} className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-rose-50 hover:text-rose-600 transition flex items-center justify-center flex-shrink-0"><Plus size={16} /></button>
                      </div>
                    </div>
                  );
                })()}
                <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-1.5"><CreditCard size={14} className="text-rose-500" /> {t("paymentMethodsTitle")}</h3>
                {(() => {
                  const selectedPayments = myProfile.paymentMethods || [];
                  const unselectedPayments = PAYMENT_METHOD_OPTIONS.filter(p => !selectedPayments.includes(p));
                  return (
                    <div className="space-y-2 mb-5">
                      {selectedPayments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedPayments.map(p => (
                            <button key={p} type="button" onClick={() => togglePaymentMethod(p)} className="pl-2.5 pr-2 py-1.5 rounded-full text-xs font-semibold border bg-gray-900 border-gray-900 text-white flex items-center gap-1 transition hover:bg-gray-800">{p} <X size={11} /></button>
                          ))}
                        </div>
                      )}
                      {unselectedPayments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {unselectedPayments.map(p => (
                            <button key={p} type="button" onClick={() => togglePaymentMethod(p)} className="text-xs font-semibold px-2.5 py-1.5 rounded-full border bg-white border-gray-200 text-gray-500 hover:border-gray-400 transition">{p}</button>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <input value={customPaymentInput} onChange={(e) => setCustomPaymentInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomPaymentMethod(); } }} placeholder={t("customPaymentPlaceholder")} className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                        <button type="button" onClick={addCustomPaymentMethod} aria-label={t("addCustomPaymentAria")} className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-rose-50 hover:text-rose-600 transition flex items-center justify-center flex-shrink-0"><Plus size={16} /></button>
                      </div>
                    </div>
                  );
                })()}
                <div className="flex items-center justify-between mb-2"><h3 className="font-semibold text-gray-800 text-sm">{t("servicesTitle")}</h3>{!showAddServiceForm && <button onClick={() => setShowAddServiceForm(true)} className="text-xs text-rose-700 font-medium flex items-center gap-1"><Plus size={14} /> {t("genericAddBtn")}</button>}</div>
                <p className="text-[11px] text-gray-400 mb-2 -mt-1">{t("servicesFixedPriceHint")}</p>
                <div className="space-y-2 mb-3 max-h-52 overflow-y-auto pr-0.5">{myProfile.services.map((s, i) => (<div key={i} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-2"><input value={s.name} onChange={(e) => updateService(i, "name", e.target.value)} placeholder={t("servicePlaceholder")} className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs" /><input value={s.price} onChange={(e) => updateService(i, "price", e.target.value)} placeholder={s.fixed ? t("priceRequiredShort") : t("priceOptionalShort")} className={`w-20 px-2 py-1.5 rounded-lg border text-xs ${s.fixed && !String(s.price || "").trim() ? "border-red-300" : "border-gray-200"}`} /><button onClick={() => toggleServiceFixed(i)} className={`flex-shrink-0 text-[10px] font-semibold px-2 py-1.5 rounded-lg whitespace-nowrap transition ${s.fixed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{s.fixed ? t("fixedPriceBadge") : t("variableLabel")}</button><button onClick={() => removeService(i)} aria-label={t("removeServiceAria")} className="text-red-400 hover:text-red-600 flex-shrink-0 p-2 -m-2"><Trash2 size={14} /></button></div>))}</div>
                {showAddServiceForm && (
                  <div className="bg-rose-100 border border-rose-200 rounded-xl p-3 mb-5">
                    <div className="flex items-center gap-2 mb-2">
                      <input autoFocus value={newServiceForm.name} onChange={(e) => { const val = e.target.value; setNewServiceForm(f => ({ ...f, name: val, fixed: f.fixedTouched ? f.fixed : isFixedPriceService(val) })); setDuplicateServiceWarning(null); }} placeholder={t("newServiceNamePlaceholder")} className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white" />
                      <input value={newServiceForm.price} onChange={(e) => setNewServiceForm(f => ({ ...f, price: e.target.value }))} placeholder={newServiceForm.fixed ? t("priceRequiredShort") : t("priceOptionalShort")} className={`w-20 px-2 py-1.5 rounded-lg border text-xs bg-white ${newServiceForm.fixed && !newServiceForm.price.trim() ? "border-red-300" : "border-gray-200"}`} />
                    </div>
                    <button onClick={() => setNewServiceForm(f => ({ ...f, fixed: !f.fixed, fixedTouched: true }))} className={`w-full mb-2 text-[11px] font-semibold py-1.5 rounded-lg transition ${newServiceForm.fixed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{newServiceForm.fixed ? t("fixedPricePrepayNote") : t("variablePriceAfterNote")}</button>
                    {newServiceForm.fixed && !newServiceForm.price.trim() && (<p className="text-[10px] text-red-500 mb-2 -mt-1">{t("fixedPriceRequiredWarning")}</p>)}
                    {duplicateServiceWarning ? (
                      <div className="bg-white border border-gray-300 rounded-lg p-2.5 mb-2">
                        <p className="text-[11px] text-gray-700 mb-2 flex items-start gap-1.5"><Bell size={12} className="flex-shrink-0 mt-0.5" /> {t("duplicateServiceWarningText", { name: duplicateServiceWarning.name })}</p>
                        <div className="flex gap-2">
                          <button onClick={() => setDuplicateServiceWarning(null)} className="flex-1 border border-gray-200 text-gray-500 text-[11px] py-1.5 rounded-lg font-medium">{t("giveUpBtn")}</button>
                          <button onClick={() => finalizeAddService(duplicateServiceWarning.name, duplicateServiceWarning.price, duplicateServiceWarning.fixed)} className="flex-1 bg-rose-600 text-white text-[11px] py-1.5 rounded-lg font-medium hover:bg-rose-700 transition">{t("addAnywayBtn")}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={cancelAddService} className="flex-1 border border-gray-200 text-gray-500 text-[11px] py-1.5 rounded-lg font-medium">{t("cancel")}</button>
                        <button disabled={!newServiceForm.name.trim() || (newServiceForm.fixed && !newServiceForm.price.trim())} onClick={tryAddService} className={`flex-1 text-[11px] py-1.5 rounded-lg font-medium transition ${newServiceForm.name.trim() && (!newServiceForm.fixed || newServiceForm.price.trim()) ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>{t("genericAddBtn")}</button>
                      </div>
                    )}
                  </div>
                )}
                <h3 className="font-semibold text-gray-800 text-sm mb-2">{t("coverPhotoTitle")}</h3>
                <input ref={coverFileRef} type="file" accept="image/*" onChange={uploadCoverPhoto} className="hidden" />
                {myProfile.coverPhoto ? (<div className="relative w-full h-28 rounded-2xl overflow-hidden mb-5"><img src={imgThumb(myProfile.coverPhoto, 700)} onError={imgFallbackHandler} alt={t("coverPhotoAlt")} className="w-full h-full object-cover" /><button onClick={() => coverFileRef.current?.click()} aria-label={t("changeCoverPhotoAria")} className="absolute top-2 right-12 w-9 h-9 bg-black/50 rounded-full flex items-center justify-center text-white"><Pencil size={14} /></button><button onClick={removeCoverPhoto} aria-label={t("removeCoverPhotoAria")} className="absolute top-2 right-2 w-9 h-9 bg-black/50 rounded-full flex items-center justify-center text-white"><X size={14} /></button></div>) : (<div className="mb-5"><div className="flex gap-2 mb-2">{Object.entries(BANNER_PRESETS).map(([key, grad]) => (<button key={key} onClick={() => updateMyField("bannerPreset", key)} className={`flex-1 h-14 rounded-xl bg-gradient-to-br ${grad} ${myProfile.bannerPreset === key ? "ring-2 ring-offset-2 ring-rose-600" : ""}`} />))}</div><button onClick={() => coverFileRef.current?.click()} className="w-full border-2 border-dashed border-rose-300 rounded-xl py-2.5 text-rose-600 text-xs font-medium hover:bg-rose-100 transition flex items-center justify-center gap-2"><Camera size={14} /> {t("uploadOwnPhotoBtn")}</button></div>)}
                <div className="flex items-center justify-between mb-2"><h3 className="font-semibold text-gray-800 text-sm">{t("team")}</h3><button onClick={addStaff} className="text-xs text-rose-700 font-medium flex items-center gap-1"><Plus size={14} /> {t("genericAddBtn")}</button></div>
                <div className="space-y-3 mb-6">{myProfile.staff.map((s, i) => (<div key={i} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-2"><div className="relative w-11 h-11 rounded-full bg-rose-50 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">{isImgUrl(s.emoji) ? <img src={s.emoji} alt={s.name || t("staffPhotoFallbackAlt")} className="w-full h-full object-cover" /> : s.emoji}<input ref={(el) => (staffFileRefs.current[i] = el)} type="file" accept="image/*" onChange={(e) => staffAvatarUpload(i, e)} className="hidden" /><button onClick={() => staffFileRefs.current[i]?.click()} className="absolute inset-0 bg-black/0 hover:bg-black/30 transition flex items-center justify-center text-transparent hover:text-white"><Pencil size={12} /></button></div><div className="flex-1 space-y-1"><input value={s.name} onChange={(e) => updateStaffField(i, "name", e.target.value)} placeholder={t("fullNamePlaceholder")} className="w-full px-2 py-1 rounded-lg border border-gray-200 text-xs" /><input value={s.role} onChange={(e) => updateStaffField(i, "role", e.target.value)} placeholder={t("rolePlaceholder")} className="w-full px-2 py-1 rounded-lg border border-gray-200 text-xs" /></div><button onClick={() => removeStaff(i)} aria-label={t("removeStaffAria")} className="text-red-400 hover:text-red-600 flex-shrink-0 p-2 -m-2"><Trash2 size={14} /></button></div>))}</div>
                <button onClick={saveMyProfile} className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition flex items-center justify-center gap-2 mb-2"><Save size={16} /> {t("save")}</button>
                <button onClick={previewMyProfile} className="w-full border border-gray-200 text-gray-500 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition mb-5">{t("previewMyPageBtn")}</button>
              </div>
            )}
            {mechProfileTab === "offers" && (
              <div className="flex-1 px-5 py-4 overflow-y-auto">
                <h3 className="font-semibold text-gray-800 text-sm mb-2">{t("offersMade")}</h3>
                <div className="space-y-2 mb-6">{listings.flatMap(l => l.offers.filter(o => (o.buyerId != null ? o.buyerId === MY_MECHANIC_ID : o.from === myProfile.name) && o.status !== "replaced").map(o => ({ ...o, listing: l }))).map(o => (<button key={o.id} onClick={() => setSelectedListingId(o.listing.id)} className="w-full text-left bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-center hover:border-rose-200 transition"><div><p className="text-xs font-medium text-gray-700">{o.listing.brand} {o.listing.model}</p><p className="text-[10px] text-gray-400">{o.status === "accepted" ? t("offerAcceptedStatus") : o.status === "rejected" ? t("offerRejectedStatus") : o.seen ? t("offerPendingSeenStatus") : t("offerPendingStatus")}</p></div><span className="font-bold text-rose-600 text-sm">{o.amount}{o.currency || "₺"}</span></button>))}
                {listings.flatMap(l => l.offers.filter(o => (o.buyerId != null ? o.buyerId === MY_MECHANIC_ID : o.from === myProfile.name) && o.status !== "replaced")).length === 0 && <p className="text-center text-gray-400 text-sm py-4">{t("noOffersMadeYet")}</p>}</div>
                {listings.filter(l => l.offers.some(o => o.status === "rejected" && (o.buyerId != null ? o.buyerId === MY_MECHANIC_ID : o.from === myProfile.name))).length > 0 && (
                  <p className="text-[11px] text-gray-400 mb-4 -mt-3 flex items-start gap-1.5"><AlertTriangle size={12} className="flex-shrink-0 mt-0.5 text-amber-500" /> {t("rejectedOfferHint")}</p>
                )}
                <h3 className="font-semibold text-gray-800 text-sm mb-2">{t("offersReceived")}</h3>
                <div className="space-y-2">{listings.filter(isMyListing).flatMap(l => l.offers.filter(o => o.status !== "replaced").map(o => ({ ...o, listing: l }))).map(o => (
                  <div key={o.id} className="bg-white border border-gray-100 rounded-xl p-3">
                    <button onClick={() => setSelectedListingId(o.listing.id)} className="w-full text-left flex justify-between items-center mb-2"><div><p className="text-xs font-medium text-gray-700">{o.from}</p><p className="text-[10px] text-gray-400">{o.listing.brand} {o.listing.model}</p></div><span className="font-bold text-rose-600 text-sm">{o.amount}{o.currency || "₺"}</span></button>
                    {o.status === "pending" ? (<div className="flex gap-2"><button onClick={() => respondOffer(o.listing.id, o.id, "accepted")} className="flex-1 bg-green-500 text-white text-[11px] py-1.5 rounded-lg font-medium">{t("accept")}</button><button onClick={() => respondOffer(o.listing.id, o.id, "rejected")} className="flex-1 border border-gray-200 text-gray-500 text-[11px] py-1.5 rounded-lg font-medium">{t("reject")}</button></div>) : (<p className="text-[11px] text-gray-400">{o.status === "accepted" ? t("offerAcceptedStatus") : t("offerRejectedStatus")}</p>)}
                  </div>
                ))}{listings.filter(isMyListing).flatMap(l => l.offers.filter(o => o.status !== "replaced")).length === 0 && <p className="text-center text-gray-400 text-sm py-4">{t("noOffersReceivedYet")}</p>}</div>
              </div>
            )}
            {mechProfileTab === "settings" && (
              <div className="flex-1 px-5 py-5 overflow-y-auto">
                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4"><div className="flex items-center justify-between mb-2"><h3 className="font-semibold text-gray-800 text-sm">{t("autoAcceptAppointmentsTitle")}</h3><button onClick={() => setAutoAccept(!autoAccept)} aria-label={t("toggleAria")} className="p-3 -m-3 flex-shrink-0"><div className={`w-12 h-7 rounded-full transition relative ${autoAccept ? "bg-rose-600" : "bg-gray-200"}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition ${autoAccept ? "left-6" : "left-1"}`} /></div></button></div></div>
                <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4"><div className="pr-3"><h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><MapPin size={14} className="text-rose-600" /> {t("useMyLocationTitle")}</h3><p className="text-[11px] text-gray-400 mt-0.5">{userLocation ? t("realLocationDistanceNote") : t("estimatedDistanceNote")}</p></div><button onClick={() => (userLocation ? stopUsingLocation() : setShowLocationPrompt(true))} aria-label={t("toggleAria")} className="p-3 -m-3 flex-shrink-0"><div className={`w-12 h-7 rounded-full transition relative ${userLocation ? "bg-rose-600" : "bg-gray-200"}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition ${userLocation ? "left-6" : "left-1"}`} /></div></button></div>
                {(() => {
                  const notifOpts = [{ key: "notifyAppointments", label: t("notifyAppointmentsLabel") }, { key: "notifyOffers", label: t("notifyOffersLabel") }, { key: "notifyMessages", label: t("notifyMessagesLabel") }, { key: "notifyJobApplications", label: t("notifyJobApplicationsLabel") }];
                  const allNotifsOn = notifOpts.every(opt => mechSettings[opt.key]);
                  const toggleAllNotifs = () => {
                    setMechSettings(s => ({ ...s, ...Object.fromEntries(notifOpts.map(opt => [opt.key, !allNotifsOn])) }));
                    if (!allNotifsOn && notifPermission !== "granted") requestNotifPermission();
                  };
                  return (
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4">
                      <div className="flex items-center justify-between"><div className="pr-3"><h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Bell size={14} className="text-rose-600" /> {t("notificationsTitle")}</h3><p className="text-[11px] text-gray-400 mt-0.5">{notifPermission === "denied" ? t("notifPermissionDeniedNote") : allNotifsOn ? t("allNotifsOnNote") : t("enableBrowserNotifsNote")}</p></div><button onClick={toggleAllNotifs} aria-label={t("toggleAria")} className="p-3 -m-3 flex-shrink-0"><div className={`w-12 h-7 rounded-full transition relative ${allNotifsOn ? "bg-rose-600" : "bg-gray-200"}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition ${allNotifsOn ? "left-6" : "left-1"}`} /></div></button></div>
                      <button onClick={() => setMechNotifDetailsOpen(o => !o)} className="w-full flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 hover:text-gray-700 transition"><span>{t("showNotifTypesBtn")}</span><ChevronRight size={13} className={`transition-transform ${mechNotifDetailsOpen ? "rotate-90" : ""}`} /></button>
                      {mechNotifDetailsOpen && (
                        <div className="mt-3 space-y-2.5">
                          {notifOpts.map(opt => (
                            <div key={opt.key} className="flex items-center justify-between"><span className="text-xs text-gray-600">{opt.label}</span><button onClick={() => setMechSettings(s => ({ ...s, [opt.key]: !s[opt.key] }))} aria-label={t("toggleAria")} className="p-3 -m-3 flex-shrink-0"><div className={`w-9 h-5 rounded-full transition relative ${mechSettings[opt.key] ? "bg-rose-600" : "bg-gray-200"}`}><div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition ${mechSettings[opt.key] ? "left-[19px]" : "left-[3px]"}`} /></div></button></div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
                <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4"><h3 className="font-semibold text-gray-800 text-sm">{t("siteLanguage")}</h3><LangSwitch /></div>
                <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4"><div className="pr-3"><h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Globe size={14} className="text-rose-600" /> {t("messagingLanguageTitle")}</h3><p className="text-[11px] text-gray-400 mt-0.5">{t("messagingLanguageHint")}</p></div><div className="flex bg-gray-100 rounded-full p-0.5 gap-0.5 flex-shrink-0">{["tr", "en", "de"].map(l => (<button key={l} onClick={() => updateMyField("lang", l)} className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${(myProfile.lang || "tr") === l ? "bg-white text-rose-600 shadow-sm" : "text-gray-400"}`}>{l.toUpperCase()}</button>))}</div></div>
                <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4"><h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Palette size={14} className={darkMode ? "text-rose-500" : "text-rose-600"} /> {t("darkModeAppearanceTitle")}</h3><button onClick={() => setDarkMode(d => !d)} aria-label={t("toggleAria")} className="p-3 -m-3 flex-shrink-0"><div className={`w-12 h-7 rounded-full transition relative ${darkMode ? "bg-rose-600" : "bg-gray-200"}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition ${darkMode ? "left-6" : "left-1"}`} /></div></button></div>
                <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2"><Clock size={16} /> {t("workingHours")}</h3>
                <p className="text-[11px] text-gray-400 mb-3">{t("workingHoursHint")}</p>
                <div className="space-y-2 mb-6">
                  {DAY_KEYS.map(key => { const day = mechanicHours[key]; const isOpen = expandedDay === key; const slots = getDaySlots(day); const summary = day.open ? `${day.start} - ${dayClosingTime(day)}` : t("closed"); return (
                    <div key={key} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                      <button onClick={() => setExpandedDay(isOpen ? null : key)} className="w-full flex items-center justify-between p-3">
                        <span className="text-sm font-semibold text-gray-700">{(DAY_LABELS_FULL_BY_LANG[lang] || DAY_LABELS_FULL)[key]}</span>
                        <div className="flex items-center gap-2"><span className={`text-[11px] ${day.open ? "text-gray-400" : "text-red-400"}`}>{summary}</span><ChevronRight size={14} className={`text-gray-300 transition-transform ${isOpen ? "rotate-90" : ""}`} /></div>
                      </button>
                      {isOpen && (
                        <div className="px-3 pb-3 border-t border-gray-50 pt-3">
                          <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500">{t("dayOpenLabel")}</span><button onClick={() => toggleDayOpen(key)} aria-label={t("toggleAria")} className="p-3 -m-3 flex-shrink-0"><div className={`w-11 h-6 rounded-full transition relative ${day.open ? "bg-rose-600" : "bg-gray-200"}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition ${day.open ? "left-6" : "left-1"}`} /></div></button></div>
                          {day.open && (<>
                            <div className="flex flex-wrap gap-1.5 mb-3">{slots.map(slot => { const closed = day.closedSlots.includes(slot); return (<button key={slot} onClick={() => toggleSlotClosed(key, slot)} className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition ${closed ? "bg-red-50 text-red-400 border-red-100 line-through" : "bg-green-50 text-green-600 border-green-100"}`}>{slot}</button>); })}</div>
                            <div className="flex items-center gap-2"><input type="time" value={expandedDay === key ? newSlotTime : ""} onChange={(e) => setNewSlotTime(e.target.value)} step="1800" className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs" /><button onClick={() => { addExtraSlot(key, newSlotTime); setNewSlotTime(""); }} className="w-8 h-8 bg-rose-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 hover:bg-rose-700 transition"><Plus size={16} /></button></div>
                          </>)}
                        </div>
                      )}
                    </div>
                  ); })}
                </div>
                <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2"><Bell size={16} /> {t("smsNotifHistoryTitle")}</h3>
                <div className="space-y-2 mb-6">{smsLog.map(s => (<div key={s.id} className="bg-white border border-gray-200 rounded-xl p-3 text-xs text-gray-600">{s.text}</div>))}{smsLog.length === 0 && <p className="text-center text-gray-400 text-sm py-8">{t("noSmsSentYet")}</p>}</div>
                <button onClick={() => setMechPaymentInfoOpen(o => !o)} className="w-full flex items-center justify-between mb-2 hover:opacity-70 transition"><h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Banknote size={16} /> {t("paymentInfoTitle")}</h3><ChevronRight size={15} className={`text-gray-300 transition-transform ${mechPaymentInfoOpen ? "rotate-90" : ""}`} /></button>
                {mechPaymentInfoOpen && (<>
                  <p className="text-[11px] text-gray-400 mb-3">{t("paymentInfoHint")}</p>
                  <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-2 mb-6">
                    <input value={myProfile?.accountHolder || ""} onChange={(e) => updateMyField("accountHolder", e.target.value)} placeholder={t("accountHolderPlaceholder")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                    <input value={myProfile?.bankName || ""} onChange={(e) => updateMyField("bankName", e.target.value)} placeholder={t("bankNamePlaceholder")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                    <input value={myProfile?.iban || ""} onChange={(e) => updateMyField("iban", e.target.value)} placeholder={t("ibanPlaceholder")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                    <button onClick={() => setToast({ type: "info", text: t("paymentInfoSavedToast") })} className="w-full bg-gray-800 text-white py-2 rounded-xl text-sm font-medium hover:bg-gray-900 transition mt-1">{t("save")}</button>
                  </div>
                </>)}
                <button onClick={() => setMechAccountOpen(o => !o)} className="w-full flex items-center justify-between mt-2 mb-2 hover:opacity-70 transition"><h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Lock size={15} className="text-gray-400" /> {t("accountTitle")}</h3><ChevronRight size={15} className={`text-gray-300 transition-transform ${mechAccountOpen ? "rotate-90" : ""}`} /></button>
                {mechAccountOpen && (<>
                  <button onClick={() => setShowPasswordModal(true)} className="w-full flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 mb-2 shadow-sm hover:bg-gray-50 transition"><span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Lock size={14} className="text-gray-400" /> {t("changePasswordBtn")}</span><ChevronRight size={15} className="text-gray-300" /></button>
                  <button onClick={() => setMechProfileTab("support")} className="w-full flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 mb-2 shadow-sm hover:bg-gray-50 transition"><span className="text-sm font-medium text-gray-700 flex items-center gap-2"><LifeBuoy size={14} className="text-gray-400" /> {t("helpSupportBtn")}</span>{mySupportTickets().filter(tk => tk.status !== "resolved").length > 0 && <span className="text-[10px] font-bold text-white bg-rose-600 rounded-full px-1.5 py-0.5 flex-shrink-0">{mySupportTickets().filter(tk => tk.status !== "resolved").length}</span>}<ChevronRight size={15} className="text-gray-300" /></button>
                  <button onClick={() => setLegalModalTopic("terms")} className="w-full flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 mb-2 shadow-sm hover:bg-gray-50 transition"><span className="text-sm font-medium text-gray-700">{t("termsOfUseBtn")}</span><ChevronRight size={15} className="text-gray-300" /></button>
                  <button onClick={() => setLegalModalTopic("privacy")} className="w-full flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 mb-2 shadow-sm hover:bg-gray-50 transition"><span className="text-sm font-medium text-gray-700">{t("privacyPolicyBtn")}</span><ChevronRight size={15} className="text-gray-300" /></button>
                </>)}
                <button onClick={logoutUser} className="w-full border border-gray-200 text-gray-600 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition mb-5 mt-3">{t("logout")}</button>
                <button onClick={() => setMechDangerZoneOpen(o => !o)} className="w-full flex items-center justify-between py-2 text-xs text-gray-400 hover:text-gray-600 transition"><span>{t("dangerZoneBtn")}</span><ChevronRight size={13} className={`transition-transform ${mechDangerZoneOpen ? "rotate-90" : ""}`} /></button>
                {mechDangerZoneOpen && (
                  <div className="border border-red-100 bg-red-50/50 rounded-2xl p-4 mt-1">
                    <p className="text-xs text-gray-500 mb-3">{t("deleteBusinessWarning")}</p>
                    <button onClick={() => { setShowDeleteAccountModal(true); setDeleteConfirmText(""); }} className="w-full text-red-500 border border-red-200 py-2.5 rounded-xl font-medium text-xs hover:bg-red-100 transition">{t("deleteBusinessBtn")}</button>
                  </div>
                )}
              </div>
            )}
            {mechProfileTab === "support" && (
              <div className="flex-1 px-5 py-5 overflow-y-auto">
                {renderSupportView("settings", setMechProfileTab)}
              </div>
            )}
          </div>
        )}
      </div>
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center" style={{ zIndex: 9500 }} onClick={() => setShowFilterModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-800 flex items-center gap-2"><SlidersHorizontal size={18} /> {t("filterBtn")}</h3><button onClick={() => setShowFilterModal(false)} aria-label={t("closeAria")} className="w-9 h-9 -m-2 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition flex-shrink-0"><X size={18} /></button></div>
            {ownerMode === "mechanics" ? (
              <>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">{t("priceRangeLabel")}</h4>
                <div className="flex gap-2 mb-5 flex-wrap">{[{ key: "all", label: t("allFilterLabel") }, { key: "cheap", label: t("affordablePriceTier") }, { key: "mid", label: t("midPriceTier") }, { key: "expensive", label: t("expensivePriceTier") }].map(o => (<button key={o.key} onClick={() => setFilters(f => ({ ...f, priceTier: o.key }))} className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${filters.priceTier === o.key ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-600 border-gray-200"}`}>{o.label}</button>))}</div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">{t("minRatingLabel")}</h4>
                <div className="flex gap-2 mb-5 flex-wrap">{[{ key: 0, label: t("allFilterLabel") }, { key: 4.0, label: "⭐ 4.0+" }, { key: 4.5, label: "⭐ 4.5+" }].map(o => (<button key={o.key} onClick={() => setFilters(f => ({ ...f, minRating: o.key }))} className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${filters.minRating === o.key ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-600 border-gray-200"}`}>{o.label}</button>))}</div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><MapPin size={13} /> {t("maxDistanceLabel")}</h4>
                <div className="flex gap-2 mb-1 flex-wrap">{[{ key: 999, label: t("allFilterLabel") }, { key: 1, label: "< 1 km" }, { key: 2, label: "< 2 km" }, { key: 5, label: "< 5 km" }].map(o => (<button key={o.key} onClick={() => handleDistanceFilterClick(o.key)} className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${filters.maxDistance === o.key ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-600 border-gray-200"}`}>{o.label}</button>))}</div>
                {!userLocation && (<p className="text-[11px] text-gray-400 mb-5 flex items-center gap-1"><MapPin size={11} /> {t("estimatedDistanceFilterHint")}</p>)}
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Car size={13} /> {t("vehicleBrandLabel")}</h4>
                <select value={filters.brand} onChange={(e) => setFilters(f => ({ ...f, brand: e.target.value }))} className="w-full mb-5 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white"><option value="">{t("allBrandsOption")}</option>{CAR_BRANDS.map(b => (<option key={b} value={b}>{b}</option>))}</select>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Wrench size={13} /> {t("serviceLabelFilter")}</h4>
                <select value={filters.service} onChange={(e) => setFilters(f => ({ ...f, service: e.target.value }))} className="w-full mb-6 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white"><option value="">{t("allServicesOption")}</option>{ATU_FIXED_CATALOG.map(s => (<option key={s.name} value={s.name}>{s.name}</option>))}</select>
              </>
            ) : ownerMode === "cars" ? (
              <>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Cog size={13} /> {t("transmissionLabel")}</h4>
                <div className="flex gap-2 mb-5 flex-wrap">{[{ key: "all", label: t("allFilterLabel") }, ...TRANSMISSIONS.map(tv => ({ key: tv, label: vocabLabel(tv, lang, TRANSMISSION_LABELS_BY_LANG) }))].map(o => (<button key={o.key} onClick={() => setListingFilters(f => ({ ...f, transmission: o.key }))} className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${listingFilters.transmission === o.key ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-600 border-gray-200"}`}>{o.label}</button>))}</div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Fuel size={13} /> {t("fuelTypeLabel")}</h4>
                <div className="flex gap-2 mb-5 flex-wrap">{[{ key: "all", label: t("allFilterLabel") }, ...FUEL_TYPES.map(fv => ({ key: fv, label: vocabLabel(fv, lang, FUEL_TYPE_LABELS_BY_LANG) }))].map(o => (<button key={o.key} onClick={() => setListingFilters(f => ({ ...f, fuelType: o.key }))} className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${listingFilters.fuelType === o.key ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-600 border-gray-200"}`}>{o.label}</button>))}</div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Banknote size={13} /> {t("priceRangeTlLabel")}</h4>
                <div className="flex gap-2 mb-5"><input type="number" placeholder={t("minPlaceholder")} value={listingFilters.minPrice} onChange={(e) => setListingFilters(f => ({ ...f, minPrice: e.target.value }))} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input type="number" placeholder={t("maxPlaceholder")} value={listingFilters.maxPrice} onChange={(e) => setListingFilters(f => ({ ...f, maxPrice: e.target.value }))} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Gauge size={13} /> {t("kmRangeLabel")}</h4>
                <div className="flex gap-2 mb-5"><input type="number" placeholder={t("minKmPlaceholder")} value={listingFilters.minKm} onChange={(e) => setListingFilters(f => ({ ...f, minKm: e.target.value }))} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input type="number" placeholder={t("maxKmPlaceholder")} value={listingFilters.maxKm} onChange={(e) => setListingFilters(f => ({ ...f, maxKm: e.target.value }))} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><CalendarDays size={13} /> {t("modelYearLabel")}</h4>
                <div className="flex gap-2 mb-6"><input type="number" placeholder={t("minYearPlaceholder")} value={listingFilters.minYear} onChange={(e) => setListingFilters(f => ({ ...f, minYear: e.target.value }))} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input type="number" placeholder={t("maxYearPlaceholder")} value={listingFilters.maxYear} onChange={(e) => setListingFilters(f => ({ ...f, maxYear: e.target.value }))} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
              </>
            ) : (
              <>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Briefcase size={13} /> {t("employmentTypeFilterLabel")}</h4>
                <div className="flex gap-2 mb-5 flex-wrap">{[{ key: "all", label: t("allFilterLabel") }, ...EMPLOYMENT_TYPES.map(et => ({ key: et, label: vocabLabel(et, lang, EMPLOYMENT_TYPE_LABELS_BY_LANG) }))].map(o => (<button key={o.key} onClick={() => setJobFilters(f => ({ ...f, employmentType: o.key }))} className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${jobFilters.employmentType === o.key ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-600 border-gray-200"}`}>{o.label}</button>))}</div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><GraduationCap size={13} /> {t("experienceLevelFilterLabel")}</h4>
                <div className="flex gap-2 mb-6 flex-wrap">{[{ key: "all", label: t("allFilterLabel") }, ...EXPERIENCE_LEVELS.map(ex => ({ key: ex, label: vocabLabel(ex, lang, EXPERIENCE_LEVEL_LABELS_BY_LANG) }))].map(o => (<button key={o.key} onClick={() => setJobFilters(f => ({ ...f, experienceLevel: o.key }))} className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${jobFilters.experienceLevel === o.key ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-600 border-gray-200"}`}>{o.label}</button>))}</div>
              </>
            )}
            <div className="flex gap-2">
              <button onClick={() => ownerMode === "mechanics" ? (() => { setFilters({ priceTier: "all", minRating: 0, maxDistance: 999, brand: "", service: "" }); setQuery(""); setLocationQuery(""); })() : ownerMode === "cars" ? clearListingFilters() : clearJobFilters()} className="flex-1 border border-gray-200 text-gray-500 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition">{t("clear")}</button>
              <button onClick={() => setShowFilterModal(false)} className={`flex-1 text-white py-3 rounded-2xl font-semibold text-sm transition ${ownerMode === "mechanics" ? "bg-rose-600 hover:bg-rose-700" : ownerMode === "cars" ? "bg-rose-600 hover:bg-rose-700" : "bg-rose-600 hover:bg-rose-700"}`}>{t("apply")}</button>
            </div>
          </div>
        </div>
      )}
      {showMapMobile && (<div className="fixed inset-0 bg-white z-50 flex flex-col md:hidden"><div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between"><h3 className="font-bold text-gray-800">{t("mapMechanicsTitle")}</h3><button onClick={() => setShowMapMobile(false)} aria-label={t("closeAria")} className="w-9 h-9 -m-2 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition flex-shrink-0"><X size={18} /></button></div><MapPanel className="flex-1 m-4" items={filtered} onPick={openMapDetail} previewItem={mapPreviewItem} onPreviewChange={setMapPreviewItem} /><div className="p-4"><button onClick={() => setShowMapMobile(false)} className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm">{t("backToListBtn")}</button></div></div>)}
      {showSellVehiclePicker && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setShowSellVehiclePicker(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-sm rounded-t-3xl md:rounded-3xl p-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1"><h3 className="font-bold text-gray-800 flex items-center gap-2"><Car size={18} className="text-rose-600" /> {t("whichVehicleSellTitle")}</h3><button onClick={() => setShowSellVehiclePicker(false)} aria-label={t("closeAria")} className="w-9 h-9 -m-2 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition flex-shrink-0"><X size={18} /></button></div>
            <p className="text-xs text-gray-400 mb-4">{t("selectRegisteredVehicleHint")}</p>
            <div className="space-y-2">
              {vehicles.map(v => {
                const linked = listings.find(l => l.id === v.listingId);
                return (
                  <button key={v.id} onClick={() => pickVehicleToSell(v)} className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-3 hover:border-rose-300 transition text-left">
                    <div className="w-11 h-11 bg-rose-50 rounded-xl flex items-center justify-center flex-shrink-0"><Car size={20} className="text-rose-600" /></div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{v.brand} {v.model}</p><p className="text-xs text-gray-400">{v.year} · {v.plate}{linked ? ` · ${t("alreadyListedSuffix")}` : ""}</p></div>
                    <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                  </button>
                );
              })}
              <button onClick={pickOtherCarToSell} className="w-full flex items-center gap-3 bg-white border border-dashed border-gray-300 rounded-2xl p-3 hover:border-rose-300 transition text-left">
                <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0"><Plus size={20} className="text-gray-500" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800">{t("otherVehicleLabel")}</p><p className="text-xs text-gray-400">{t("otherVehicleHint")}</p></div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}
      {showSellForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center" onClick={() => setShowSellForm(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md md:max-w-lg rounded-t-3xl md:rounded-3xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-800 flex items-center gap-2"><Tag size={18} className="text-rose-600" /> {sellForm._editingId ? t("editListing") : t("sellFormTitle")}</h3><button onClick={() => setShowSellForm(false)} aria-label={t("closeAria")} className="w-9 h-9 -m-2 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition flex-shrink-0"><X size={18} /></button></div>
            <div className="flex justify-center mb-4"><div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl overflow-hidden">{isImgUrl(sellForm.photo) ? <img src={imgThumb(sellForm.photo, 200)} onError={imgFallbackHandler} alt={t("vehiclePhotoAlt")} className="w-full h-full object-cover" /> : sellForm.photo}<input ref={sellPhotoRef} type="file" accept="image/*" onChange={sellPhotoUpload} className="hidden" /><button onClick={() => sellPhotoRef.current?.click()} className="absolute inset-0 bg-black/0 hover:bg-black/40 transition flex items-center justify-center text-transparent hover:text-white"><Camera size={20} /></button></div></div>
            <div className="space-y-2">
              <div className="flex gap-2"><input value={sellForm.brand} onChange={(e) => setSellForm({ ...sellForm, brand: e.target.value })} placeholder={t("brandRequiredPlaceholder")} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={sellForm.model} onChange={(e) => setSellForm({ ...sellForm, model: e.target.value })} placeholder={t("modelRequiredPlaceholder")} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
              <div className="flex gap-2"><input value={sellForm.year} onChange={(e) => setSellForm({ ...sellForm, year: e.target.value })} placeholder={t("yearRequiredPlaceholder")} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={sellForm.km} onChange={(e) => setSellForm({ ...sellForm, km: e.target.value })} placeholder={t("kmRequiredPlaceholder")} type="number" className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
              <input value={sellForm.price} onChange={(e) => setSellForm({ ...sellForm, price: e.target.value })} placeholder={t("priceRequiredPlaceholder")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <p className="text-[10px] text-gray-300 px-1">{t("requiredFieldsNote")}</p>
              <div className="flex gap-2"><select value={sellForm.fuelType} onChange={(e) => setSellForm({ ...sellForm, fuelType: e.target.value })} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm">{FUEL_TYPES.map(f => <option key={f} value={f}>{vocabLabel(f, lang, FUEL_TYPE_LABELS_BY_LANG)}</option>)}</select><select value={sellForm.transmission} onChange={(e) => setSellForm({ ...sellForm, transmission: e.target.value })} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm">{TRANSMISSIONS.map(f => <option key={f} value={f}>{vocabLabel(f, lang, TRANSMISSION_LABELS_BY_LANG)}</option>)}</select></div>
              <div className="flex gap-2"><input value={sellForm.power} onChange={(e) => setSellForm({ ...sellForm, power: e.target.value })} placeholder={t("powerHpPlaceholder")} type="number" className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={sellForm.color} onChange={(e) => setSellForm({ ...sellForm, color: e.target.value })} placeholder={t("colorPlaceholder")} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
              <div className="flex gap-2"><input value={sellForm.firstReg} onChange={(e) => setSellForm({ ...sellForm, firstReg: e.target.value })} placeholder={t("firstRegPlaceholder")} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={sellForm.city} onChange={(e) => setSellForm({ ...sellForm, city: e.target.value })} placeholder={t("cityPlaceholder")} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
              <textarea value={sellForm.description} onChange={(e) => setSellForm({ ...sellForm, description: e.target.value })} placeholder={t("descriptionPlaceholder")} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 pt-2 px-1">{t("vehicleDetailsSection")}</p>
              <div className="flex gap-2"><select value={sellForm.bodyType} onChange={(e) => setSellForm({ ...sellForm, bodyType: e.target.value })} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700"><option value="">{t("bodyTypePlaceholder")}</option>{BODY_TYPES.map(b => <option key={b} value={b}>{vocabLabel(b, lang, BODY_TYPE_LABELS_BY_LANG)}</option>)}</select><select value={sellForm.drivetrain} onChange={(e) => setSellForm({ ...sellForm, drivetrain: e.target.value })} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700"><option value="">{t("drivetrainPlaceholder")}</option>{DRIVETRAIN_OPTIONS.map(d => <option key={d} value={d}>{vocabLabel(d, lang, DRIVETRAIN_LABELS_BY_LANG)}</option>)}</select></div>
              <div className="flex gap-2"><input value={sellForm.engineSize} onChange={(e) => setSellForm({ ...sellForm, engineSize: e.target.value })} placeholder={t("engineSizePlaceholder")} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><select value={sellForm.doorCount} onChange={(e) => setSellForm({ ...sellForm, doorCount: e.target.value })} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700"><option value="">{t("doorCountPlaceholder")}</option>{DOOR_COUNT_OPTIONS.map(d => <option key={d} value={d}>{d} {t("doorSuffix")}</option>)}</select></div>
              <div className="flex gap-2"><input value={sellForm.ownerCount} onChange={(e) => setSellForm({ ...sellForm, ownerCount: e.target.value })} type="number" min="1" placeholder={t("ownerCountPlaceholder")} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><button type="button" onClick={() => setSellForm({ ...sellForm, tradeIn: !sellForm.tradeIn })} className={`w-1/2 px-3 py-2.5 rounded-xl border text-sm font-medium flex items-center justify-center gap-1.5 transition ${sellForm.tradeIn ? "bg-blue-50 border-blue-200 text-blue-700" : "border-gray-200 text-gray-500"}`}><Repeat size={14} /> {t("tradeInLabel")} {sellForm.tradeIn ? t("yesLabel") : t("noLabel")}</button></div>
              <div className="flex gap-2"><input value={sellForm.paintedParts} onChange={(e) => setSellForm({ ...sellForm, paintedParts: e.target.value })} type="number" min="0" placeholder={t("paintedPartsPlaceholder")} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={sellForm.changedParts} onChange={(e) => setSellForm({ ...sellForm, changedParts: e.target.value })} type="number" min="0" placeholder={t("changedPartsPlaceholder")} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 pt-2 px-1">{t("fuelConsumptionSection")}</p>
              <div className="flex gap-2"><select value={sellForm.seatCount} onChange={(e) => setSellForm({ ...sellForm, seatCount: e.target.value })} className="w-1/3 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700"><option value="">{t("seatCountPlaceholder")}</option>{SEAT_COUNT_OPTIONS.map(s => <option key={s} value={s}>{s} {t("seatSuffix")}</option>)}</select><input value={sellForm.fuelConsumption} onChange={(e) => setSellForm({ ...sellForm, fuelConsumption: e.target.value })} placeholder={t("fuelConsumptionPlaceholder")} className="w-1/3 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={sellForm.co2Emission} onChange={(e) => setSellForm({ ...sellForm, co2Emission: e.target.value })} type="number" min="0" placeholder={t("co2Placeholder")} className="w-1/3 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
              <select value={sellForm.emissionClass} onChange={(e) => setSellForm({ ...sellForm, emissionClass: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700"><option value="">{t("emissionClassPlaceholder")}</option>{EMISSION_CLASS_OPTIONS.map(e2 => <option key={e2}>{e2}</option>)}</select>
              {(sellForm.fuelType === "Elektrik" || sellForm.fuelType === "Hibrit") && (
                <div className="flex gap-2"><input value={sellForm.batteryCapacity} onChange={(e) => setSellForm({ ...sellForm, batteryCapacity: e.target.value })} placeholder={t("batteryCapacityPlaceholder")} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={sellForm.rangeKm} onChange={(e) => setSellForm({ ...sellForm, rangeKm: e.target.value })} type="number" min="0" placeholder={t("rangeKmPlaceholder")} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
              )}
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 pt-2 px-1">{t("featuresSection")}</p>
              {/* ÖNEMLİ: donanım listesi artık sadece sabit LISTING_FEATURE_OPTIONS ile sınırlı değil —
                  kullanıcı listede olmayan bir donanımı da yazıp ekleyebiliyor (addCustomFeature).
                  Sabit liste + eklenen özel donanımlar toplamda kolayca 30'a ulaşabildiği için hepsini
                  aynı anda tek bir kalabalık ızgarada göstermek yerine: önce SEÇİLİ olanlar ayrı, kompakt
                  bir satırda (kaldırmak için tıklanabilir); henüz seçilmemiş sabit seçenekler ise
                  varsayılan olarak sadece ilk birkaçı gösterilip "+N tane daha" ile genişletiliyor. */}
              {(() => {
                const selectedFeatures = sellForm.features || [];
                const unselectedOptions = LISTING_FEATURE_OPTIONS.filter(f => !selectedFeatures.includes(f));
                const VISIBLE_UNSELECTED_COUNT = 8;
                const visibleUnselected = showAllFeatureOptions ? unselectedOptions : unselectedOptions.slice(0, VISIBLE_UNSELECTED_COUNT);
                const hiddenCount = unselectedOptions.length - visibleUnselected.length;
                return (
                  <div className="space-y-2">
                    {selectedFeatures.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedFeatures.map(f => (
                          <button key={f} type="button" onClick={() => toggleSellFeature(f)} className="pl-2.5 pr-2 py-1.5 rounded-full text-[11px] font-medium border bg-rose-600 text-white border-rose-600 flex items-center gap-1 transition hover:bg-rose-700">
                            {f} <X size={11} />
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {visibleUnselected.map(f => (
                        <button key={f} type="button" onClick={() => toggleSellFeature(f)} className="px-2.5 py-1.5 rounded-full text-[11px] font-medium border bg-white text-gray-500 border-gray-200 hover:border-rose-300 hover:text-rose-600 transition">{f}</button>
                      ))}
                      {hiddenCount > 0 && (
                        <button type="button" onClick={() => setShowAllFeatureOptions(true)} className="px-2.5 py-1.5 rounded-full text-[11px] font-semibold border border-dashed border-gray-300 text-gray-400 hover:text-rose-500 hover:border-rose-300 transition">+{hiddenCount} {t("showMoreFeaturesSuffix")}</button>
                      )}
                      {showAllFeatureOptions && unselectedOptions.length > VISIBLE_UNSELECTED_COUNT && (
                        <button type="button" onClick={() => setShowAllFeatureOptions(false)} className="px-2.5 py-1.5 rounded-full text-[11px] font-semibold border border-dashed border-gray-300 text-gray-400 hover:text-rose-500 hover:border-rose-300 transition">{t("showLessFeaturesLabel")}</button>
                      )}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <input value={customFeatureInput} onChange={(e) => setCustomFeatureInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomFeature(); } }} placeholder={t("customFeaturePlaceholder")} className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                      <button type="button" onClick={addCustomFeature} aria-label={t("addCustomFeatureAria")} className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-rose-50 hover:text-rose-600 transition flex items-center justify-center flex-shrink-0"><Plus size={16} /></button>
                    </div>
                  </div>
                );
              })()}
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 pt-2 px-1 flex items-center justify-between"><span>{t("extraPhotosSection")}</span><span className="normal-case tracking-normal text-gray-300">{(sellForm.photos || []).length}/{MAX_LISTING_GALLERY_PHOTOS}</span></p>
              <div className="flex flex-wrap gap-2">
                {(sellForm.photos || []).map((p, i) => (
                  <div key={i} className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-200"><img src={imgThumb(p, 120)} loading="lazy" onError={imgFallbackHandler} alt={t("extraPhotoAlt", { n: String(i + 1) })} className="w-full h-full object-cover" /><button type="button" onClick={() => removeSellPhoto(i)} aria-label={t("removePhotoAria")} className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center text-white"><X size={9} /></button></div>
                ))}
                {(sellForm.photos || []).length < MAX_LISTING_GALLERY_PHOTOS && (
                  <label className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:text-rose-500 hover:border-rose-300 transition cursor-pointer"><Plus size={18} /><input type="file" accept="image/*" multiple onChange={sellPhotosUpload} className="hidden" /></label>
                )}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 pt-2 px-1">{t("marketingSection")}</p>
              <input value={sellForm.inspectionReportUrl || ""} onChange={(e) => setSellForm({ ...sellForm, inspectionReportUrl: e.target.value })} placeholder={t("inspectionReportPlaceholder")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <button type="button" onClick={() => setSellForm({ ...sellForm, negotiable: !sellForm.negotiable })} className={`w-full px-3 py-2.5 rounded-xl border text-sm font-medium flex items-center justify-center gap-1.5 transition ${sellForm.negotiable ? "bg-blue-50 border-blue-200 text-blue-700" : "border-gray-200 text-gray-500"}`}>{t("negotiableToggle")} {sellForm.negotiable ? t("yesLabel") : t("noLabel")}</button>
              <p className="text-[10px] text-gray-400 px-1">{t("featuredHintNote")}</p>
            </div>
            <button onClick={() => submitListing(role)} className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm mt-4 hover:bg-rose-700 transition">{sellForm._editingId ? t("updateListing") : t("publishListing")}</button>
          </div>
        </div>
      )}
      {showJobForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center" onClick={() => setShowJobForm(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md md:max-w-lg rounded-t-3xl md:rounded-3xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-800 flex items-center gap-2"><Briefcase size={18} className="text-rose-500" /> {jobForm._editingId ? t("editJobListingTitle") : t("newJobListingTitle")}</h3><button onClick={() => setShowJobForm(false)} aria-label={t("closeAria")} className="w-9 h-9 -m-2 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition flex-shrink-0"><X size={18} /></button></div>
            <div className="space-y-2">
              <input value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} placeholder={t("jobTitlePlaceholderExample")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <div className="flex gap-2"><select value={jobForm.employmentType} onChange={(e) => setJobForm({ ...jobForm, employmentType: e.target.value })} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm">{EMPLOYMENT_TYPES.map(t2 => <option key={t2} value={t2}>{vocabLabel(t2, lang, EMPLOYMENT_TYPE_LABELS_BY_LANG)}</option>)}</select><select value={jobForm.experienceLevel} onChange={(e) => setJobForm({ ...jobForm, experienceLevel: e.target.value })} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm">{EXPERIENCE_LEVELS.map(ex => <option key={ex} value={ex}>{vocabLabel(ex, lang, EXPERIENCE_LEVEL_LABELS_BY_LANG)}</option>)}</select></div>
              <input value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} placeholder={t("jobLocationPlaceholderExample")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <div className="flex gap-2"><input value={jobForm.salaryMin} onChange={(e) => setJobForm({ ...jobForm, salaryMin: e.target.value })} type="number" placeholder={t("minSalaryPlaceholder")} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={jobForm.salaryMax} onChange={(e) => setJobForm({ ...jobForm, salaryMax: e.target.value })} type="number" placeholder={t("maxSalaryPlaceholder")} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
              <textarea value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} placeholder={t("positionDescPlaceholder")} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none" />
              <textarea value={jobForm.requirements} onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })} placeholder={t("requirementsPlaceholderMulti")} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none" />
              <input value={jobForm.skills} onChange={(e) => setJobForm({ ...jobForm, skills: e.target.value })} placeholder={t("skillsPlaceholderExample")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
            </div>
            <button disabled={!jobForm.title.trim()} onClick={submitJobListing} className={`w-full py-3 rounded-2xl font-semibold text-sm mt-4 transition ${jobForm.title.trim() ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>{jobForm._editingId ? t("updateListingBtn") : t("publishListingBtn")}</button>
          </div>
        </div>
      )}
      {showOfferForm && selectedListing && (() => { const currency = listingCurrency(selectedListing.price); const existingOffer = myPendingOfferOn(selectedListing); const isUpdate = existingOffer && !existingOffer.seen; return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowOfferForm(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-5">
            <div className="flex items-center justify-between mb-1"><h3 className="font-bold text-gray-800">{isUpdate ? t("updateOfferBtn") : t("makeOffer")}</h3><button onClick={() => setShowOfferForm(false)} aria-label={t("closeAria")} className="w-9 h-9 -m-2 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition flex-shrink-0"><X size={18} /></button></div>
            <p className="text-xs text-gray-400 mb-4">{selectedListing.brand} {selectedListing.model} · {selectedListing.price}</p>
            <input value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} type="number" placeholder={t("offerAmountPlaceholder", { currency })} className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm mb-4" />
            <button disabled={!offerAmount} onClick={submitOffer} className={`w-full py-3 rounded-2xl font-semibold text-sm transition ${offerAmount ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>{isUpdate ? t("updateOfferSubmitBtn") : t("sendOfferBtn")}</button>
          </div>
        </div>
      ); })()}
      {showFeaturedUpsell && selectedListing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowFeaturedUpsell(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-5">
            <div className="flex items-center justify-between mb-1"><h3 className="font-bold text-gray-800 flex items-center gap-2">{t("featuredUpsellTitle")}</h3><button onClick={() => setShowFeaturedUpsell(false)} aria-label={t("closeAria")} className="w-9 h-9 -m-2 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition flex-shrink-0"><X size={18} /></button></div>
            <p className="text-xs text-gray-400 mb-4">{selectedListing.brand} {selectedListing.model} · {selectedListing.price}</p>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
              <p className="text-sm text-amber-900 leading-relaxed">{t("featuredUpsellBadgeNote", { days: String(FEATURED_LISTING_DAYS) })}</p>
              <p className="text-2xl font-bold text-amber-800 mt-2">{FEATURED_LISTING_PRICE}₺</p>
            </div>
            <p className="text-[11px] text-gray-400 mb-4">{t("featuredUpsellDemoNote")}</p>
            <button onClick={confirmFeaturedPurchase} className="w-full bg-amber-500 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-amber-600 transition flex items-center justify-center gap-2"><Banknote size={15} /> {t("payAndFeatureBtn", { price: String(FEATURED_LISTING_PRICE) })}</button>
          </div>
        </div>
      )}
      {showListingMsgForm && (<div className="fixed inset-0 bg-black/40 z-[60] flex items-end md:items-center justify-center" onClick={() => setShowListingMsgForm(false)}><div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-5"><div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-800">{t("messageSeller")}</h3><button onClick={() => setShowListingMsgForm(false)} aria-label={t("closeAria")} className="w-9 h-9 -m-2 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition flex-shrink-0"><X size={18} /></button></div><textarea value={listingMsg} onChange={(e) => setListingMsg(e.target.value)} rows={3} placeholder={t("listingMsgPlaceholder")} className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm mb-4 resize-none" /><button onClick={submitListingMsg} className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition">{t("sendReviewBtn")}</button></div></div>)}
      {showJobApplyForm && selectedJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={closeJobApplyForm}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md rounded-3xl shadow-2xl ring-1 ring-black/5 max-h-[88vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><Briefcase size={18} className="text-rose-500" /> {t("applicationTitle")}</h3>
              <button onClick={closeJobApplyForm} aria-label={t("closeAria")} className="w-9 h-9 -m-2 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition flex-shrink-0"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="text-xs text-gray-400 mb-4">{selectedJob.title} · {selectedJob.mechanicName}</p>
              <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><User size={13} className="text-gray-400" /> {t("applicationInfoTitle")}</h4>
              <div className="space-y-2 mb-4">
                <input value={jobApplyInfo.name} onChange={(e) => setJobApplyInfo(i => ({ ...i, name: e.target.value }))} placeholder={t("fullNameRequiredPlaceholder")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                <div className="flex gap-2">
                  <div className="w-1/2"><input value={jobApplyInfo.phone} onChange={(e) => setJobApplyInfo(i => ({ ...i, phone: e.target.value }))} placeholder={t("phoneCountryPlaceholder")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />{jobApplyInfo.phone.trim() && !jobApplyPhoneCheck.valid && <p className="text-[10px] text-red-500 mt-1">{jobApplyPhoneCheck.message}</p>}</div>
                  <div className="w-1/2"><input value={jobApplyInfo.email} onChange={(e) => setJobApplyInfo(i => ({ ...i, email: e.target.value }))} placeholder={t("emailRequiredPlaceholder")} type="email" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />{jobApplyInfo.email.trim() && !jobApplyEmailValid && <p className="text-[10px] text-red-500 mt-1">{t("invalidEmailNote")}</p>}</div>
                </div>
                <input value={jobApplyInfo.address} onChange={(e) => setJobApplyInfo(i => ({ ...i, address: e.target.value }))} placeholder={t("addressRequiredPlaceholder")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
              </div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">{t("coverLetterTitle")}</h4>
              <textarea value={jobApplyMsg} onChange={(e) => setJobApplyMsg(e.target.value)} rows={3} placeholder={t("coverLetterPlaceholder")} className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm mb-4 resize-none" />
              <h4 className="text-xs font-semibold text-gray-700 mb-2">{t("cvRequiredTitle")}</h4>
              <input ref={cvFileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleCvSelect} className="hidden" />
              {jobApplyCv ? (
                <div className="flex items-center justify-between gap-2 bg-rose-50 rounded-xl px-3 py-2.5">
                  <span className="flex items-center gap-2 text-xs text-rose-700 min-w-0"><FileText size={15} className="flex-shrink-0" /><span className="truncate">{jobApplyCv.name}</span></span>
                  <button onClick={removeCv} aria-label={t("removeCvAria")} className="text-rose-400 hover:text-red-500 flex-shrink-0 p-2 -m-2"><X size={15} /></button>
                </div>
              ) : (
                <button onClick={() => cvFileRef.current?.click()} className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 text-gray-500 rounded-xl py-2.5 text-xs font-medium hover:bg-gray-50 transition"><Paperclip size={14} /> {t("uploadCvBtn")}</button>
              )}
              <p className="text-[10px] text-gray-300 mt-2">{t("requiredFieldsHint")}</p>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
              <button disabled={!jobApplyReady} onClick={submitJobApplication} className={`w-full py-3 rounded-2xl font-semibold text-sm transition ${jobApplyReady ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>{t("submitApplicationBtn")}</button>
            </div>
          </div>
        </div>
      )}
      {reviewingApptId && (() => { const revAppt = appointments.find(a => a.id === reviewingApptId); return (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-end md:items-center justify-center" onClick={() => setReviewingApptId(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-5">
            <div className="flex items-center justify-between mb-1"><h3 className="font-bold text-gray-800">{t("writeReviewTitle")}</h3><button onClick={() => setReviewingApptId(null)} aria-label={t("closeAria")} className="w-9 h-9 -m-2 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition flex-shrink-0"><X size={18} /></button></div>
            <p className="text-xs text-gray-400 mb-4">{revAppt?.mechanicName}</p>
            <div className="flex items-center gap-1.5 mb-4 justify-center">{[1, 2, 3, 4, 5].map(n => (<button key={n} onClick={() => setReviewForm(f => ({ ...f, rating: n }))}><Star size={30} className={n <= reviewForm.rating ? "text-gray-900 fill-gray-900" : "text-gray-200 fill-gray-200"} /></button>))}</div>
            <textarea value={reviewForm.comment} onChange={(e) => setReviewForm(f => ({ ...f, comment: e.target.value }))} rows={3} placeholder={t("shareExperiencePlaceholder")} className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm mb-4 resize-none" />
            <button onClick={submitReview} className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition">{t("sendReviewBtn")}</button>
          </div>
        </div>
      ); })()}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-end md:items-center justify-center" onClick={closePasswordModal}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-800 flex items-center gap-2"><Lock size={18} /> {t("changePasswordTitle")}</h3><button onClick={closePasswordModal} aria-label={t("closeAria")} className="w-9 h-9 -m-2 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition flex-shrink-0"><X size={18} /></button></div>
            <div className="space-y-2">
              <input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm(f => ({ ...f, current: e.target.value }))} placeholder={t("currentPasswordPlaceholder")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <input type="password" value={passwordForm.next} onChange={(e) => setPasswordForm(f => ({ ...f, next: e.target.value }))} placeholder={t("newPasswordPlaceholder")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm(f => ({ ...f, confirm: e.target.value }))} placeholder={t("newPasswordRepeatPlaceholder")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
            </div>
            <button onClick={submitPasswordChange} className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm mt-4 hover:bg-rose-700 transition">{t("updatePasswordBtn")}</button>
          </div>
        </div>
      )}
      {showNewTicketForm && (
        <div style={{ zIndex: 9999 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center p-4" onClick={() => setShowNewTicketForm(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-sm rounded-t-3xl md:rounded-3xl p-5 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1"><h3 className="text-base font-bold text-gray-900">{t("newSupportTicketTitle")}</h3><button onClick={() => setShowNewTicketForm(false)} aria-label={t("closeAria")} className="w-9 h-9 -m-2 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition flex-shrink-0"><X size={18} /></button></div>
            <p className="text-xs text-gray-400 mb-4">{t("ticketSummaryHint")}</p>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">{t("requestTypeLabel")}</label>
                <select value={newTicketForm.type} onChange={(e) => setNewTicketForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm">
                  {Object.entries(ADMIN_TICKET_TYPE_LABELS).map(([k, label]) => (<option key={k} value={k}>{label}</option>))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">{t("subjectLabel")}</label>
                <input value={newTicketForm.subject} onChange={(e) => setNewTicketForm(f => ({ ...f, subject: e.target.value }))} placeholder={t("subjectPlaceholderExample")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">{t("descriptionLabel")}</label>
                <textarea value={newTicketForm.description} onChange={(e) => setNewTicketForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder={t("describeIssueDetailPlaceholder")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">{t("relatedApptListingMechLabel")}</label>
                <input value={newTicketForm.relatedNote} onChange={(e) => setNewTicketForm(f => ({ ...f, relatedNote: e.target.value }))} placeholder={t("relatedNotePlaceholderExample")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                <p className="text-[10px] text-gray-300 mt-1">{t("relatedNoteHint")}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowNewTicketForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">{t("giveUpBtn")}</button>
              <button onClick={submitSupportTicket} className="flex-1 bg-rose-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-rose-700 transition">{t("sendReviewBtn")}</button>
            </div>
          </div>
        </div>
      )}
      {showDeleteAccountModal && (() => { const deleteReady = deleteConfirmText.trim().toLocaleUpperCase("tr-TR") === "SİL"; const closeDeleteModal = () => { setShowDeleteAccountModal(false); setDeleteConfirmText(""); }; return (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-end md:items-center justify-center" onClick={closeDeleteModal}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-5">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-3 mx-auto"><Trash2 size={26} className="text-red-500" /></div>
            <h3 className="font-bold text-gray-800 text-center mb-1">{t("deleteBusinessOrAccountQuestion", { who: role === "mechanic" ? t("deleteBusinessSubject") : t("deleteAccountSubject") })}</h3>
            <p className="text-xs text-gray-400 text-center mb-4">{t("deleteAccountIrreversibleNote", { items: role === "mechanic" ? t("mechanicDeleteItemsNote") : t("ownerDeleteItemsNote") })}</p>
            <div className="bg-red-50 rounded-xl p-3 mb-4">
              <p className="text-xs text-gray-600 text-center mb-2">{t("typeToConfirmNote", { word: t("deleteWordTr") })}</p>
              <input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder={t("deleteWordTr")} className="w-full px-3 py-2.5 rounded-xl border border-red-200 text-sm text-center font-semibold tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-red-300" />
            </div>
            <div className="flex gap-2">
              <button onClick={closeDeleteModal} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition">{t("cancel")}</button>
              <button disabled={!deleteReady} onClick={confirmDeleteAccount} className={`flex-1 py-3 rounded-2xl font-semibold text-sm transition ${deleteReady ? "bg-red-500 text-white hover:bg-red-600" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>{t("yesDeleteConfirmLabel")}</button>
            </div>
          </div>
        </div>
      ); })()}
    </div>
  );
}
