import { useApp } from "./state/AppLogicProvider";
import { Search, MapPin, Star, Clock, Calendar, ChevronLeft, Check, User, Wrench, Mail, Lock, Eye, EyeOff, Phone, Car, Plus, History, ChevronRight, CircleDot, CheckCircle2, MessageCircle, Image as ImageIcon, Send, Globe, Banknote, ClipboardList, Settings, Bell, X, ThumbsUp, ThumbsDown, Users, Wrench as ToolIcon, Navigation, Pencil, Trash2, Save, SlidersHorizontal, Map as MapIcon, BadgeCheck, Camera, Gauge, Tag, Compass, Heart, Fuel, Cog, Zap, CalendarDays, Palette, Briefcase, GraduationCap, FileText, Paperclip, Shield, LayoutDashboard, LifeBuoy, LogOut, Ban, AlertTriangle, ShieldAlert, TrendingUp, Megaphone, Flag, Share2 } from "lucide-react";
import { PriceLevelDots } from "../components/ui/PriceLevelDots";
import { MiniBarChart } from "../components/ui/MiniBarChart";
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
import {
  LEGAL_CONTENT, FREE_QUOTE_MECH_LIMIT, PREMIUM_QUOTE_MECH_LIMIT, BANNER_PRESETS,
  ONBOARDING_SLIDES, ADMIN_TICKET_TYPE_LABELS, ADMIN_TICKET_PRIORITY_LABELS,
  ADMIN_SLA_DAYS, ADMIN_TREND_DATA, PLATFORM_COMMISSION_RATE, DE_CITIES, TODAY_STR,
  REMINDER_KIND_LABELS, TRANSMISSIONS, FUEL_TYPES, EMPLOYMENT_TYPES, EXPERIENCE_LEVELS,
  MY_MECHANIC_ID, MY_OWNER_ID, DAY_KEYS, DAY_LABELS_FULL, SHARE_CHANNEL_LABELS,
} from "../data/constants";
import {
  ticketSlaBreached, ticketDaysOpen, initials, isValidEmail, validatePhone,
  computeReminders, isImgUrl, listingStatusMeta, isValidDateStr, listingCurrency,
  jobStatusMeta, parsePriceNumber, isFixedPriceService, statusColor, getDaySlots,
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
    setShowAddServiceForm, newServiceForm, setNewServiceForm, duplicateServiceWarning, setDuplicateServiceWarning, mechReqView, setMechReqView, mechAnalyticsView,
    setMechAnalyticsView, expandedCustomerHistory, setExpandedCustomerHistory, historyExpandedDate, setHistoryExpandedDate, ownerApptView, setOwnerApptView, ownerHistoryExpandedDate,
    setOwnerHistoryExpandedDate, quoteRequests, setQuoteRequests, quoteOffers, setQuoteOffers, showQuoteModal, setShowQuoteModal, quoteVehicleId,
    setQuoteVehicleId, quoteIssue, setQuoteIssue, quotePhotos, setQuotePhotos, quoteSelectedMechIds, setQuoteSelectedMechIds, quoteMechSearch,
    setQuoteMechSearch, quotePremiumUnlocked, setQuotePremiumUnlocked, showQuotePremiumUpsell, setShowQuotePremiumUpsell, respondingQuoteOfferId, setRespondingQuoteOfferId, quoteOfferForm,
    setQuoteOfferForm, expandedQuoteReqId, setExpandedQuoteReqId, pendingQuoteAccept, setPendingQuoteAccept, coverFileRef, staffFileRefs, expandedDay,
    setExpandedDay, newSlotTime, setNewSlotTime, listings, setListings, showSellForm, setShowSellForm, showSellVehiclePicker,
    setShowSellVehiclePicker, sellForm, setSellForm, sellPhotoRef, selectedListingId, setSelectedListingId, showOfferForm, setShowOfferForm,
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
    adminChangeLog, setAdminChangeLog, fireSuccessPulse, getEffectiveDistance, requestLocation, handleSortClick, confirmUseLocation, stopUsingLocation,
    requestNotifPermission, fireNotification, selectedMechanic, bookingServiceOptions, myProfile, selectedListing, allReminders, dismissedReminderKey,
    setDismissedReminderKey, browseScrollRef, heroCollapsed, setHeroCollapsed, goBookFromReminder, topReminder, notifiedReminderKeysRef, filtered,
    quoteFilteredMechanics, filteredListings, activeListingFilterCount, filteredJobs, activeJobFilterCount, selectedJob, myReviews, myApplicationRefs,
    activeFilterCount, nextDays, isSameMechanicAppt, customerNoShowCount, isMyOwnerAppt, activeAppts, historyByDate, slotsForDate,
    isDayOpenForMechanic, mechanicOpenStatus, goToAddSlotForToday, openDetail, rebookAppt, downloadAppointmentIcs, downloadMaintenanceReport, downloadAppointmentReceipt,
    mechanicDirectionsUrl, toggleQuoteMechanic, unlockQuotePremium, closeQuoteModal, submitQuoteRequest, submitQuoteOffer, acceptQuoteOffer, EXPENSIVE_SERVICE_THRESHOLD,
    confirmBooking, goHome, chooseRole, submitAdminLogin, adminLogout, ADMIN_FIELD_LABELS, adminFieldLabel, formatAdminHistoryValue,
    adminChangeTargetLabel, logAdminChange, applyAdminFieldChange, revertAdminChange, ADMIN_TARGET_TYPE_META, adminChangeLogGrouped, expandedHistoryGroups, setExpandedHistoryGroups, recordShare, shareStats, viewStats, myProfileViewStats, listingViewStats, listingFavoriteCount,
    toggleHistoryGroup, revertAdminChangeGroup, fieldEditSnapshotRef, trackFieldFocus, trackFieldBlurAndLog, trackInputProps, adminStats, adminAllUsers,
    adminFilteredUsers, openAdminUserEdit, saveAdminUserEdit, toggleAdminUserStatus, resetUserPassword, sendPasswordResetLink, openAdminProfileView, viewingUser,
    profileFieldOldValueRef, startEditProfileField, cancelEditProfileField, ADMIN_NUMERIC_PROFILE_FIELDS, saveProfileField, renderAdminProfileRow, toggleListingRemoved, updateListingField,
    updateMechService, removeMechService, addMechService, toggleJobListingStatus, updateJobField, renderAdminListingCard, renderAdminJobCard, openAdminAnalyze,
    analyzingUser, adminUserAnalytics, adminFilteredTickets, adminTicketAnalytics, selectedTicket, updateTicketStatus, saveTicketNote, issueTicketRefund,
    removeReportedListing, removeFlaggedReview, grantVerification, sendAdminReply, sendBroadcast, adminRegionBreakdown, adminRevenueStats, submitAuth,
    addVehicle, updateVehicleFields, saveReminderOverride, resetReminderOverride, submitNewReminder, updateCustomReminder, removeCustomReminder, acceptAppt,
    rejectAppt, markNoShow, advanceStatus, completeApptWithWarranty, cancelOwnAppt, startReschedule, confirmReschedule, submitReview,
    submitMechanicReply, deleteMyReview, closePasswordModal, submitPasswordChange, confirmDeleteAccount, openHelpInfo, mySupportTickets, submitSupportTicket,
    openReportForm, renderSupportView, openChatWithMechanic, openMechChatWithOwnerListing, activeConvo, sendOwnerMessage, handleFileSelect, sendOwnerMessageWithReply,
    toggleTranslate, mechConvo, sendMechMessage, updateMyField, updateService, removeService, toggleServiceFixed, finalizeAddService,
    findMissingFixedPriceService, saveMyProfile, previewMyProfile, tryAddService, cancelAddService, uploadCoverPhoto, removeCoverPhoto, addStaff,
    updateStaffField, removeStaff, staffAvatarUpload, ownerPhotoUpload, toggleDayOpen, toggleSlotClosed, addExtraSlot, openSellForm,
    startSellFlow, pickVehicleToSell, pickOtherCarToSell, sellPhotoUpload, notifyFavoriteWatchers, submitListing, setListingStatus, removeListing,
    myBuyerName, myPendingOfferOn, openOfferForm, submitOffer, submitListingMsg, respondOffer, markOffersSeen, clearListingFilters,
    clearJobFilters, openJobForm, submitJobListing, setJobListingStatus, removeJobListing, handleCvSelect, removeCv, closeJobApplyForm,
    openJobApplyForm, jobApplyPhoneCheck, jobApplyEmailValid, jobApplyInfoValid, jobApplyReady, submitJobApplication, rejectApplication, roleColor,
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
      {toast && (<div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md"><div className={`rounded-2xl shadow-lg p-3 flex items-start gap-2 text-xs ${toast.type === "sms" ? "bg-green-600 text-white" : "bg-gray-800 text-white"}`}><Bell size={16} className="flex-shrink-0 mt-0.5" /><span className="flex-1">{toast.text}</span><button onClick={() => setToast(null)} aria-label="Bildirimi kapat" className="p-2 -m-2"><X size={14} /></button></div></div>)}
      {successPulse && (<div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none"><div className="success-pulse-badge bg-white rounded-3xl shadow-2xl px-6 py-5 flex flex-col items-center gap-2"><div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center"><Check size={30} className="text-green-500" strokeWidth={3} /></div><p className="text-sm font-semibold text-gray-800 text-center max-w-[220px]">{successPulse}</p></div></div>)}
      {showDayFullPrompt && role === "mechanic" && (
        <div className="fixed inset-0 bg-black/40 z-[90] flex items-center justify-center p-4" style={{ zIndex: 9000 }} onClick={() => setShowDayFullPrompt(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-5">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-3"><Calendar size={22} className="text-red-500" /></div>
            <h3 className="font-bold text-gray-900 text-base mb-1">Bugünün tüm randevu saatleri doldu! 📅</h3>
            <p className="text-sm text-gray-500 mb-4">Bugün için tüm randevu saatleriniz doldu. Müşterileriniz için yeni bir randevu saati eklemek ister misiniz?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDayFullPrompt(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">Hayır, gerek yok</button>
              <button onClick={goToAddSlotForToday} className="flex-1 bg-rose-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-rose-700 transition">Evet, saat ekle</button>
            </div>
          </div>
        </div>
      )}
      {completingApptId && (
        <div className="fixed inset-0 bg-black/40 z-[90] flex items-center justify-center p-4" style={{ zIndex: 9000 }} onClick={() => { setCompletingApptId(null); setWarrantyDaysForm(""); }}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-5">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-3"><CheckCircle2 size={22} className="text-green-600" /></div>
            <h3 className="font-bold text-gray-900 text-base mb-1">Tamiri tamamla</h3>
            <p className="text-sm text-gray-500 mb-3">Değişen parça varsa opsiyonel olarak garanti süresi ekleyebilirsiniz. Müşteri, garanti bitiş tarihini randevu detayında görecek.</p>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Parça garantisi (gün, opsiyonel)</label>
            <input type="number" min="0" value={warrantyDaysForm} onChange={(e) => setWarrantyDaysForm(e.target.value)} placeholder="Örn. 90" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm mb-4" />
            <div className="flex gap-2">
              <button onClick={() => { setCompletingApptId(null); setWarrantyDaysForm(""); }} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">Vazgeç</button>
              <button onClick={() => completeApptWithWarranty(warrantyDaysForm)} className="flex-1 bg-rose-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-rose-700 transition">Tamamla</button>
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
              <button onClick={() => setConfirmDialog(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">Vazgeç</button>
              <button onClick={() => { const fn = confirmDialog.onConfirm; setConfirmDialog(null); fn(); }} className={`flex-1 text-white py-2.5 rounded-xl font-semibold text-sm transition ${confirmDialog.danger ? "bg-red-500 hover:bg-red-600" : "bg-rose-600 hover:bg-rose-700"}`}>{confirmDialog.confirmLabel || "Onayla"}</button>
            </div>
          </div>
        </div>
      )}
      {showLocationPrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" style={{ zIndex: 9600 }} onClick={() => setShowLocationPrompt(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-5">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-3"><MapPin size={22} className="text-rose-600" /></div>
            <h3 className="font-bold text-gray-900 text-base mb-1">Konumunuzu Paylaşın</h3>
            <p className="text-sm text-gray-500 mb-4">Size en yakın tamircileri gösterebilmemiz ve mesafeye göre daha doğru sıralama yapabilmemiz için konumunuza ihtiyacımız var. İzin vermezseniz tahmini mesafeler gösterilir.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowLocationPrompt(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">Şimdi Değil</button>
              <button onClick={confirmUseLocation} className="flex-1 bg-rose-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-rose-700 transition">Konumu Paylaş</button>
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
                    <p className="text-[11px] text-gray-400 mt-0.5">Son güncelleme: {doc.updated}</p>
                  </div>
                  <button onClick={() => setLegalModalTopic(null)} aria-label="Kapat" className="p-1 -m-1 text-gray-400 hover:text-gray-700"><X size={18} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 leading-snug">Bu metin geçici/demo amaçlıdır, bir avukat tarafından hazırlanmamıştır. Fixperto gerçek kullanıcılara açılmadan önce bir hukuk danışmanına onaylatılmalıdır.</p>
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
                <button onClick={() => setLegalModalTopic(null)} className="w-full bg-rose-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-rose-700 transition">Anladım</button>
              </div>
            </div>
          </>
        );
      })()}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 9000 }} onClick={closeQuoteModal}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-auto max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2"><Users size={18} className="text-rose-600" /> Birden Fazla Tamirciden Teklif Al</h3>
                <p className="text-xs text-gray-400 mt-0.5">Arızanı bir kez anlat, seçtiğin tamircilerden fiyat teklifi al.</p>
              </div>
              <button onClick={closeQuoteModal} aria-label="Kapat" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0 ml-3"><X size={15} /></button>
            </div>
            <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Araç</label>
                <div className="flex flex-wrap gap-1.5">
                  {vehicles.map(v => (<button key={v.id} onClick={() => setQuoteVehicleId(v.id)} className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${quoteVehicleId === v.id ? "bg-rose-600 text-white border-rose-600" : "border-gray-200 text-gray-600 hover:border-rose-300"}`}>{v.brand} {v.model} ({v.plate})</button>))}
                  <button onClick={() => setShowAddVehicle(!showAddVehicle)} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border border-dashed transition ${showAddVehicle ? "bg-rose-50 border-rose-300 text-rose-600" : "border-gray-300 text-gray-500 hover:border-rose-300 hover:text-rose-600"}`}><Plus size={12} /> Başka Araç Ekle</button>
                </div>
                {(vehicles.length === 0 || showAddVehicle) && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mt-2 space-y-2">
                    <input value={newVehicle.brand} onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })} placeholder="Marka" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white" />
                    <input value={newVehicle.model} onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })} placeholder="Model" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white" />
                    <div className="flex gap-2"><input value={newVehicle.year} onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })} placeholder="Yıl" className="w-1/2 px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white" /><input value={newVehicle.plate} onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value })} placeholder="Plaka" className="w-1/2 px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white" /></div>
                    <button onClick={addVehicle} disabled={!newVehicle.brand || !newVehicle.model} className={`w-full py-2 rounded-lg text-xs font-semibold transition ${newVehicle.brand && newVehicle.model ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>Ekle ve Seç</button>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Arızayı anlat</label>
                <textarea value={quoteIssue} onChange={(e) => setQuoteIssue(e.target.value)} rows={3} placeholder="Örn. Fren yaparken ön taraftan ses geliyor..." className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none" />
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {quotePhotos.map((src, i) => (<div key={i} className="relative"><img src={src} alt={`Teklif fotoğrafı ${i + 1}`} className="w-14 h-14 rounded-lg object-cover border border-gray-100" /><button onClick={() => removeQuotePhoto(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center text-white"><X size={10} /></button></div>))}
                  <button onClick={() => quotePhotoRef.current?.click()} className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-rose-300 hover:text-rose-500 transition"><Camera size={16} /></button>
                  <input ref={quotePhotoRef} type="file" accept="image/*" className="hidden" onChange={addQuotePhoto} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-700">Tamirci seç</label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{quoteSelectedMechIds.length} seçili</span>
                </div>
                <p className="text-[10px] text-gray-400 mb-2">İstediğiniz sayıda tamirci seçebilirsiniz — en az 1 yeterli, {FREE_QUOTE_MECH_LIMIT} tanesi ücretsizdir.</p>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input value={quoteMechSearch} onChange={(e) => setQuoteMechSearch(e.target.value)} placeholder="Tamirci veya uzmanlık ara..." className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-xs" />
                </div>
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  {[{ key: "distance", label: "📍 Mesafe" }, { key: "price", label: "💰 Fiyat" }, { key: "rating", label: "⭐ Puan" }].map(opt => (<button key={opt.key} onClick={() => handleSortClick(opt.key)} className={`px-2.5 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap border transition ${sortBy === opt.key ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-600 border-gray-200"}`}>{opt.label}{sortBy === opt.key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}</button>))}
                  <button onClick={() => { setOwnerMode("mechanics"); setShowFilterModal(true); }} className="px-2.5 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap border flex items-center gap-1 bg-white text-gray-600 border-gray-200 relative"><SlidersHorizontal size={11} /> Filtrele {activeFilterCount > 0 && <span className="ml-0.5 w-3.5 h-3.5 bg-rose-600 text-white rounded-full text-[8px] flex items-center justify-center">{activeFilterCount}</span>}</button>
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
                            {open !== null && (<span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${open ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>{open ? "Açık" : "Kapalı"}</span>)}
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? "bg-rose-600 border-rose-600" : "border-gray-300"}`}>{selected && <Check size={12} className="text-white" strokeWidth={3} />}</div>
                      </button>
                    );
                  })}
                  {quoteFilteredMechanics.length === 0 && <p className="text-center text-gray-400 text-xs py-6">Bu kriterlere uyan tamirci bulunamadı.</p>}
                </div>
                {showQuotePremiumUpsell && (
                  <div className="mt-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <p className="text-xs font-semibold text-amber-700 mb-0.5">⭐ {FREE_QUOTE_MECH_LIMIT}'ten fazla tamirci seçmek Premium özelliktir</p>
                    <p className="text-[11px] text-amber-600 mb-2">Premium ile aynı anda {PREMIUM_QUOTE_MECH_LIMIT} tamirciye kadar teklif isteyebilirsiniz.</p>
                    <div className="flex gap-2">
                      <button onClick={() => setShowQuotePremiumUpsell(false)} className="flex-1 border border-amber-200 text-amber-700 text-[11px] py-1.5 rounded-lg font-medium">Kapat</button>
                      <button onClick={unlockQuotePremium} className="flex-1 bg-amber-500 text-white text-[11px] py-1.5 rounded-lg font-medium">Premium'a Geç (Demo)</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
              <button disabled={!quoteVehicleId || !quoteIssue.trim() || quoteSelectedMechIds.length === 0} onClick={submitQuoteRequest} className={`w-full py-3 rounded-2xl font-semibold text-sm transition ${quoteVehicleId && quoteIssue.trim() && quoteSelectedMechIds.length > 0 ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>Teklif İste {quoteSelectedMechIds.length > 0 ? `(${quoteSelectedMechIds.length} tamirci)` : ""}</button>
            </div>
          </div>
        </div>
      )}
      {onboardingVisible && (() => { const slide = ONBOARDING_SLIDES[onboardStep]; const isLast = onboardStep === ONBOARDING_SLIDES.length - 1; return (
        <div className="fixed inset-0 w-screen h-screen bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden my-auto">
            <div className={`bg-gradient-to-br ${slide.grad} px-6 pt-8 pb-10 text-center relative`}>
              <button onClick={() => setShowOnboarding(false)} aria-label="Turu atla" className="absolute top-3 right-3 text-white/80 hover:text-white p-2 -m-1 text-xs font-medium">Atla</button>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-3">{slide.icon}</div>
              <h2 className="text-white font-bold text-lg">{slide.title}</h2>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 leading-relaxed mb-5 min-h-[60px]">{slide.desc}</p>
              <div className="flex items-center justify-center gap-1.5 mb-5">{ONBOARDING_SLIDES.map((_, i) => (<div key={i} className={`h-1.5 rounded-full transition-all ${i === onboardStep ? "w-6 bg-rose-600" : "w-1.5 bg-gray-200"}`} />))}</div>
              <button onClick={() => { if (isLast) setShowOnboarding(false); else setOnboardStep(s => s + 1); }} className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition">{isLast ? "Başlayalım" : "İleri"}</button>
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
                <h2 className="text-3xl font-extrabold leading-tight mb-3 text-gray-900 max-w-[260px]">Aracınız için en iyi çözüm.</h2>
                <p className="text-gray-500 text-sm mb-7 max-w-[260px]">{t("tagline")}</p>
                <div className="grid grid-cols-3 gap-4 max-w-sm">
                  <div><div className="flex items-center gap-2 mb-1.5"><Shield size={24} className="text-rose-600 flex-shrink-0" /><p className="text-sm font-bold text-gray-900">Güvenilir</p></div><p className="text-xs text-gray-500 leading-snug">Doğrulanmış tamirciler</p></div>
                  <div><div className="flex items-center gap-2 mb-1.5"><Zap size={24} className="text-rose-600 flex-shrink-0" /><p className="text-sm font-bold text-gray-900">Hızlı</p></div><p className="text-xs text-gray-500 leading-snug">Hızlı randevu imkanı</p></div>
                  <div><div className="flex items-center gap-2 mb-1.5"><Star size={24} className="text-rose-600 flex-shrink-0" /><p className="text-sm font-bold text-gray-900">Kolay</p></div><p className="text-xs text-gray-500 leading-snug">Kolay ve pratik kullanım</p></div>
                </div>
              </div>
            </div>
            <div className="px-6 pt-8 pb-10 flex flex-col gap-4 max-w-md mx-auto w-full">
              <div className="text-center mb-1">
                <h3 className="text-xl font-bold text-gray-900">{lang === "tr" ? "Devam etmek için" : lang === "en" ? "To continue" : "Um fortzufahren"}</h3>
                <p className="text-gray-500 text-sm mt-1">{lang === "tr" ? "Size en uygun seçeneği seçin" : lang === "en" ? "Choose the option that suits you" : "Wählen Sie die passende Option"}</p>
              </div>
              <button onClick={() => chooseRole("owner")} className="group w-full bg-white border border-gray-200 hover:border-gray-900 shadow-sm hover:shadow-md rounded-2xl p-4 flex items-center gap-4 transition"><div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center flex-shrink-0"><Car size={26} className="text-rose-600" /></div><div className="text-left flex-1"><h3 className="font-bold text-gray-900">{t("ownerRole")}</h3><p className="text-xs text-gray-500">{t("ownerRoleDesc")}</p></div><div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-900 transition"><ChevronRight size={16} className="text-gray-500 group-hover:text-white transition" /></div></button>
              <button onClick={() => chooseRole("mechanic")} className="group w-full bg-white border border-gray-200 hover:border-gray-900 shadow-sm hover:shadow-md rounded-2xl p-4 flex items-center gap-4 transition"><div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center flex-shrink-0"><Wrench size={26} className="text-rose-700" /></div><div className="text-left flex-1"><h3 className="font-bold text-gray-900">{t("mechanicRole")}</h3><p className="text-xs text-gray-500">{t("mechanicRoleDesc")}</p></div><div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-900 transition"><ChevronRight size={16} className="text-gray-500 group-hover:text-white transition" /></div></button>
              <div className="mt-2 -mx-6 overflow-hidden" style={{ WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)", maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}>
                <div className="stat-track flex items-stretch gap-3 w-max px-6">
                  {(() => {
                    const liveStats = [
                      { icon: Star, value: `${adminStats.avgRating}`, label: "Puan", bg: "bg-amber-50", color: darkMode ? "text-amber-400" : "text-amber-600" },
                      { icon: MessageCircle, value: `${adminStats.totalReviews}`, label: "Yorum", bg: "bg-rose-50", color: darkMode ? "text-rose-400" : "text-rose-600" },
                      { icon: Wrench, value: `${adminStats.totalMechanics}`, label: "Tamirci", bg: "bg-green-50", color: darkMode ? "text-green-400" : "text-green-600" },
                      { icon: Calendar, value: `${adminStats.totalAppointments}`, label: "Randevu", bg: "bg-amber-50", color: darkMode ? "text-amber-400" : "text-amber-600" },
                      { icon: Tag, value: `${adminStats.activeCarListings}`, label: "Araç İlanı", bg: "bg-rose-50", color: darkMode ? "text-rose-400" : "text-rose-600" },
                      { icon: MapPin, value: `${adminStats.totalCities}`, label: "Şehir", bg: "bg-green-50", color: darkMode ? "text-green-400" : "text-green-600" },
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
              <p className="text-[9px] text-gray-200">Tüm hakları saklıdır.</p>
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
              <div className="flex bg-gray-100 rounded-xl p-1 mb-6"><button onClick={() => { setScreen("login"); setAuthError(""); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${screen === "login" ? "bg-white shadow-sm text-gray-800" : "text-gray-400"}`}>{t("login")}</button><button onClick={() => { setScreen("signup"); setAuthError(""); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${screen === "signup" ? "bg-white shadow-sm text-gray-800" : "text-gray-400"}`}>{t("signup")}</button></div>
              <div className="space-y-3">
                {screen === "signup" && (<div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ad Soyad" className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm" /></div>)}
                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="E-posta" type="email" className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm" /></div>
                {screen === "signup" && (<div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Telefon (örn. +90 532 123 45 67)" className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm" /></div>)}
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input type={showPass ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Şifre" className="w-full pl-9 pr-10 py-3 rounded-xl border border-gray-200 text-sm" /><button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
                {screen === "login" && (<p onClick={() => setScreen("forgotPassword")} className="text-xs text-rose-500 text-right cursor-pointer hover:underline">Şifremi unuttum</p>)}
                {authError && <p className="text-xs text-red-500 flex items-center gap-1.5"><Bell size={12} className="flex-shrink-0" /> {authError}</p>}
              </div>
              <button onClick={submitAuth} className={`w-full text-white py-3 rounded-2xl font-semibold text-sm mt-6 transition ${roleBtn}`}>{screen === "login" ? t("login") : t("signup")}</button>
            </div>
          </div>
        )}
        {screen === "forgotPassword" && (
          <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
            <div className="bg-white text-gray-900 px-5 pt-6 pb-6 border-b border-gray-200 shadow-sm">
              <button onClick={() => setScreen("login")} className="flex items-center gap-1 text-gray-500 mb-4 text-sm hover:text-gray-900 transition"><ChevronLeft size={18} /> {t("back")}</button>
              <div className="flex items-center gap-3"><div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center"><Lock size={22} className="text-rose-600" /></div><div><h1 className="text-lg font-bold text-gray-900">Şifremi Unuttum</h1><p className="text-xs text-gray-500">E-posta adresinize sıfırlama bağlantısı gönderelim</p></div></div>
            </div>
            <div className="flex-1 px-6 py-6">
              <p className="text-sm text-gray-500 mb-4">Hesabınıza kayıtlı e-posta adresini girin, size bir şifre sıfırlama bağlantısı gönderelim.</p>
              <div className="relative mb-4"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="E-posta adresi" type="email" className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200" /></div>
              <button disabled={!forgotEmail} onClick={() => setScreen("resetSent")} className={`w-full text-white py-3 rounded-2xl font-semibold text-sm transition ${forgotEmail ? "bg-rose-600 hover:bg-rose-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>Sıfırlama Bağlantısı Gönder</button>
              <p className="text-center text-xs text-gray-400 mt-4">Şifrenizi hatırladınız mı? <span onClick={() => setScreen("login")} className="text-rose-500 font-medium cursor-pointer hover:underline">Giriş Yapın</span></p>
            </div>
          </div>
        )}
        {screen === "resetSent" && (
          <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full px-6 py-10 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-4"><Mail size={36} className="text-rose-500" /></div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">E-postanızı Kontrol Edin</h2>
            <p className="text-sm text-gray-500 mb-1">Eğer <span className="font-medium text-gray-700">{forgotEmail}</span> kayıtlıysa,</p>
            <p className="text-sm text-gray-500 mb-6">birkaç dakika içinde şifre sıfırlama bağlantısı alacaksınız.</p>
            <div className="bg-gray-100 rounded-xl p-3 text-xs text-gray-700 mb-6 flex items-start gap-2 text-left"><Bell size={14} className="flex-shrink-0 mt-0.5" /> Bu bir demo ekranıdır — gerçek uygulamada e-posta backend üzerinden gönderilir.</div>
            <button onClick={() => setScreen("login")} className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition mb-2">Giriş Ekranına Dön</button>
            <button onClick={() => setScreen("forgotPassword")} className="text-xs text-gray-400 hover:text-gray-600">E-postayı almadınız mı? Tekrar deneyin</button>
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
                              {listings.filter(l => l.sellerName === viewingUser.name).length === 0 ? (
                                <p className="text-xs text-gray-400">Bu kullanıcının araç ilanı yok.</p>
                              ) : (
                                <div className="space-y-2">{listings.filter(l => l.sellerName === viewingUser.name).map(l => renderAdminListingCard(l))}</div>
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
                              {listings.filter(l => l.sellerType === "mechanic" && l.sellerName === viewingUser.name).length === 0 ? (
                                <p className="text-xs text-gray-400">Bu tamircinin araç ilanı yok.</p>
                              ) : (
                                <div className="space-y-2">{listings.filter(l => l.sellerType === "mechanic" && l.sellerName === viewingUser.name).map(l => renderAdminListingCard(l))}</div>
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
                <span className="text-xs text-gray-500">Merhaba{ownerProfile.name ? `, ${ownerProfile.name}` : ""} 👋</span>
                <div className="flex items-center gap-2.5">
                  <NotifBell />
                  <button onClick={() => { setScreen("ownerProfilePage"); setOwnerProfileTab("info"); }} className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden text-xs font-bold text-gray-700 hover:bg-gray-200 transition">{ownerProfile.photo ? <img src={ownerProfile.photo} alt={ownerProfile.name || "Profil fotoğrafı"} className="w-full h-full object-cover" /> : initials(ownerProfile.name || "AS")}</button>
                </div>
              </div>
              <div className="hidden md:flex items-center justify-between max-w-7xl mx-auto w-full relative mb-5">
                <div className="flex items-center gap-2 flex-shrink-0"><div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center"><Wrench size={16} className="text-white" /></div><span className="text-lg font-extrabold text-gray-900">Fix<span className="text-rose-600">perto</span></span></div>
                <div className="flex items-center gap-8">
                  {[{ key: "mechanics", label: t("findMechanic"), icon: Wrench }, { key: "cars", label: t("findCar"), icon: Car }, { key: "jobs", label: "İş İlanları", icon: Briefcase }].map(tab => {
                    const Icon = tab.icon; const active = ownerMode === tab.key;
                    return (<button key={tab.key} onClick={() => { setOwnerMode(tab.key); setQuery(""); }} className="relative flex items-center gap-1.5 pb-3 pt-1"><Icon size={16} className={active ? "text-gray-900" : "text-gray-400"} /><span className={`text-sm font-extrabold tracking-tight ${active ? "text-gray-900" : "text-gray-500"}`}>{tab.label}</span>{active && <span className="absolute -bottom-[1px] left-0 right-0 h-0.5 bg-gray-900 rounded-full" />}</button>);
                  })}
                  <button onClick={() => setShowQuoteModal(true)} className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-extrabold tracking-tight px-3.5 py-1.5 rounded-full transition whitespace-nowrap"><Users size={13} /> Çoklu Teklif Al</button>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <NotifBell />
                  <button onClick={() => { setScreen("ownerProfilePage"); setOwnerProfileTab("info"); }} title="Profil ve Ayarlar" className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden text-xs font-bold text-gray-700 hover:bg-gray-200 transition">{ownerProfile.photo ? <img src={ownerProfile.photo} alt={ownerProfile.name || "Profil fotoğrafı"} className="w-full h-full object-cover" /> : initials(ownerProfile.name || "AS")}</button>
                </div>
              </div>
              <div className="max-w-7xl mx-auto w-full relative">
                {(ownerTab === "search") && (<>
                  <div className={`transition-all duration-300 ease-out overflow-hidden ${heroCollapsed ? "max-h-0 opacity-0 -translate-y-3 mb-0 pointer-events-none" : "max-h-56 opacity-100 translate-y-0 mb-4"}`}>
                    <div className="flex flex-col items-center gap-2 mb-4 md:hidden">
                      <div className="inline-flex items-center gap-0.5 bg-gray-100 rounded-full p-1">
                        <button onClick={() => { setOwnerMode("mechanics"); setQuery(""); }} className={`px-3.5 py-2 rounded-full text-xs font-extrabold tracking-tight transition flex items-center gap-1.5 ${ownerMode === "mechanics" ? "bg-white text-rose-600 shadow-sm" : "text-gray-500"}`}><Wrench size={13} /> {t("findMechanic")}</button>
                        <button onClick={() => { setOwnerMode("cars"); setQuery(""); }} className={`px-3.5 py-2 rounded-full text-xs font-extrabold tracking-tight transition flex items-center gap-1.5 ${ownerMode === "cars" ? "bg-white text-rose-600 shadow-sm" : "text-gray-500"}`}><Car size={13} /> {t("findCar")}</button>
                        <button onClick={() => { setOwnerMode("jobs"); setQuery(""); }} className={`px-3.5 py-2 rounded-full text-xs font-extrabold tracking-tight transition flex items-center gap-1.5 ${ownerMode === "jobs" ? "bg-white text-rose-600 shadow-sm" : "text-gray-500"}`}><Briefcase size={13} /> İş İlanları</button>
                      </div>
                      <button onClick={() => setShowQuoteModal(true)} className="px-3.5 py-2 rounded-full text-xs font-extrabold tracking-tight transition flex items-center gap-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100"><Users size={13} /> Çoklu Teklif Al</button>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-0 leading-snug text-gray-900 text-center">{ownerMode === "mechanics" ? t("searchHeroTitle") : ownerMode === "cars" ? t("carMarket") : "İş İlanları"}</h1>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center gap-2 p-2 pl-2.5 md:hidden">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${ownerMode === "cars" ? "bg-rose-100" : "bg-rose-50"}`}>{ownerMode === "cars" ? <Car size={18} className="text-rose-700" /> : ownerMode === "jobs" ? <Briefcase size={18} className="text-rose-600" /> : <Wrench size={18} className="text-rose-600" />}</div>
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ownerMode === "mechanics" ? t("searchPlaceholder") : ownerMode === "cars" ? "Marka veya model ara..." : "Pozisyon veya beceri ara..."} className="flex-1 px-1 py-2 text-gray-800 text-sm focus:outline-none bg-transparent min-w-0" />
                    <button onClick={(e) => e.currentTarget.blur()} className={`flex-shrink-0 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition ${ownerMode === "cars" ? "bg-rose-600 hover:bg-rose-700" : "bg-rose-600 hover:bg-rose-700"}`}>Ara</button>
                  </div>
                  <div className="hidden md:flex items-stretch bg-white rounded-full border border-gray-300 shadow-lg divide-x divide-gray-200 max-w-xl mx-auto overflow-hidden">
                    <div className="flex-1 px-6 py-2.5"><label className="block text-[11px] font-bold text-gray-900">{ownerMode === "mechanics" ? "Ne arıyorsun?" : ownerMode === "cars" ? "Marka / Model" : "Pozisyon"}</label><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ownerMode === "mechanics" ? t("searchPlaceholder") : ownerMode === "cars" ? "Marka veya model ara..." : "Pozisyon veya beceri ara..."} className="w-full text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none bg-transparent" /></div>
                    <div className="flex-1 px-6 py-2.5"><label className="block text-[11px] font-bold text-gray-900">Konum</label><input value={locationQuery} onChange={(e) => setLocationQuery(e.target.value)} placeholder="Şehir veya semt" className="w-full text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none bg-transparent" /></div>
                    <div className="flex items-center pr-2 pl-1"><button onClick={(e) => e.currentTarget.blur()} aria-label="Ara" className="w-11 h-11 rounded-full bg-rose-600 hover:bg-rose-700 transition flex items-center justify-center flex-shrink-0"><Search size={17} className="text-white" /></button></div>
                  </div>
                </>)}
                {ownerTab !== "search" && (<button onClick={() => setOwnerTab("search")} className="flex items-center gap-1 text-gray-500 hover:text-gray-900 text-sm mb-3 transition"><ChevronLeft size={16} /> {t("back")}</button>)}
                {ownerTab === "market" && (<><h1 className="text-xl font-bold mb-1 text-gray-900">🏷️ {t("navMarket")}</h1><p className="text-gray-500 text-sm">{t("myListingsSub")}</p></>)}
                {ownerTab === "favorites" && (<><h1 className="text-xl font-bold mb-1 text-gray-900">❤️ {t("favorites")}</h1><p className="text-gray-500 text-sm">Beğendiğiniz ilanları burada bulabilirsiniz</p></>)}
                {ownerTab === "chats" && (<><h1 className="text-xl font-bold mb-1 text-gray-900">💬 {t("chats")}</h1></>)}
                {ownerTab === "appointments" && (<><h1 className="text-xl font-bold mb-1 text-gray-900">📋 {t("appointments")}</h1></>)}
              </div>
            </div>
            {ownerTab === "search" ? <BrowseHome /> : (
              <div className="flex-1 overflow-y-auto">
                {ownerTab === "market" && (<div className="px-5 py-4"><button onClick={startSellFlow} className="w-full mb-4 bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition flex items-center justify-center gap-2"><Plus size={16} /> {t("sellMyCar")}</button>{listings.filter(l => l.sellerName === ownerProfile.name).length === 0 ? (<div className="text-center py-16"><Tag size={40} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-400 text-sm">{t("noOwnListings")}</p></div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{listings.filter(l => l.sellerName === ownerProfile.name).map(l => (<ListingCard key={l.id} l={l} />))}</div>)}</div>)}
                {ownerTab === "favorites" && (
                  <div className="px-5 py-4">
                    {listings.filter(l => favoriteIds.includes(l.id)).length === 0 ? (
                      <div className="text-center py-16"><Heart size={40} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-400 text-sm">Henüz favori eklemediniz.</p><p className="text-gray-300 text-xs mt-1">İlan kartlarındaki kalp ikonuna dokunarak favorilere ekleyebilirsiniz.</p></div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{listings.filter(l => favoriteIds.includes(l.id)).map(l => (<ListingCard key={l.id} l={l} />))}</div>
                    )}
                  </div>
                )}
                {ownerTab === "chats" && (<div className="px-5 py-4 space-y-3">{conversations.map(c => { const last = c.messages[c.messages.length - 1]; return (<button key={c.id} onClick={() => { setActiveConvoId(c.id); setScreen("chat"); }} className="w-full text-left bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-rose-200 transition flex items-center gap-3"><div className="text-2xl bg-rose-50 rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0">{c.mechanicImg}</div><div className="flex-1 min-w-0"><h4 className="font-semibold text-gray-800 text-sm">{c.mechanicName}</h4><p className="text-xs text-gray-400 truncate">{last ? last.text : "Henüz mesaj yok"}</p></div><ChevronRight size={16} className="text-gray-300" /></button>); })}{conversations.length === 0 && <p className="text-center text-gray-400 text-sm py-10">Henüz bir sohbetiniz yok.</p>}</div>)}
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
              <div className="flex items-center gap-3 mb-4"><div className="w-16 h-16 rounded-full bg-white shadow-sm border-2 border-white flex items-center justify-center overflow-hidden text-lg font-bold text-gray-700">{ownerProfile.photo ? <img src={ownerProfile.photo} alt={ownerProfile.name || "Profil fotoğrafı"} className="w-full h-full object-cover" /> : initials(ownerProfile.name || "AS")}</div><div><h1 className="text-xl font-bold text-gray-900">{ownerProfile.name || "Araç Sahibi"}</h1><p className="text-xs text-gray-500">{ownerProfile.email}</p></div></div>
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
                <div className="flex flex-col items-center mb-5"><div className="relative w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center text-2xl font-bold text-rose-600 overflow-hidden mb-2">{ownerProfile.photo ? <img src={ownerProfile.photo} alt={ownerProfile.name || "Profil fotoğrafı"} className="w-full h-full object-cover" /> : initials(ownerProfile.name || "AS")}<input ref={ownerPhotoRef} type="file" accept="image/*" onChange={ownerPhotoUpload} className="hidden" /><button onClick={() => ownerPhotoRef.current?.click()} className="absolute inset-0 bg-black/0 hover:bg-black/40 transition flex items-center justify-center text-transparent hover:text-white"><Camera size={18} /></button></div><button onClick={() => ownerPhotoRef.current?.click()} className="text-xs text-rose-600 font-medium">Fotoğraf Değiştir</button><span className="text-[11px] text-gray-400 mt-1">Kullanıcı No: #{MY_OWNER_ID}</span></div>
                <div className="space-y-2 mb-5"><input value={ownerProfile.name} onChange={(e) => updateMyOwnerField("name", e.target.value)} placeholder="Ad Soyad" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={ownerProfile.email} onChange={(e) => updateMyOwnerField("email", e.target.value)} placeholder="E-posta" type="email" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={ownerProfile.phone} onChange={(e) => updateMyOwnerField("phone", e.target.value)} placeholder="Telefon (örn. +90 532 123 45 67)" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} /><input value={ownerProfile.address} onChange={(e) => updateMyOwnerField("address", e.target.value)} placeholder="Adres" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div><p className="text-[11px] text-gray-400 px-1">Bu bilgiler iş başvurularında otomatik doldurulur.</p></div>
                <button onClick={() => { if (ownerProfile.email && !isValidEmail(ownerProfile.email)) { setToast({ type: "info", text: "⚠️ Geçersiz e-posta adresi." }); return; } if (ownerProfile.phone) { const pc = validatePhone(ownerProfile.phone); if (!pc.valid) { setToast({ type: "info", text: `⚠️ ${pc.message}` }); return; } } setToast({ type: "info", text: "✅ Profil güncellendi." }); }} className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition mb-7">{t("save")}</button>
                <h3 className="hidden md:flex font-semibold text-gray-800 text-sm mb-3 items-center gap-2"><Tag size={15} className="text-gray-400" /> İlanlarım</h3>
                <button onClick={() => setOwnerProfileTab("market")} className="hidden md:flex w-full items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-5 hover:bg-gray-100 transition"><span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Tag size={14} className="text-gray-400" /> Sattığım Araçlar{listings.filter(l => l.sellerName === ownerProfile.name).length > 0 && <span className="text-xs text-gray-400">({listings.filter(l => l.sellerName === ownerProfile.name).length})</span>}</span><ChevronRight size={15} className="text-gray-300" /></button>
                <h3 className="hidden md:flex font-semibold text-gray-800 text-sm mb-3 items-center gap-2"><Heart size={15} className="text-gray-400" /> Favoriler</h3>
                <button onClick={() => setOwnerProfileTab("favorites")} className="hidden md:flex w-full items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-5 hover:bg-gray-100 transition"><span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Heart size={14} className="text-gray-400" /> Favori İlanlarım{favoriteIds.length > 0 && <span className="text-xs text-gray-400">({favoriteIds.length})</span>}</span><ChevronRight size={15} className="text-gray-300" /></button>
                <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2"><Briefcase size={15} className="text-gray-400" /> Kariyer</h3>
                <button onClick={() => setOwnerProfileTab("applications")} className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-5 hover:bg-gray-100 transition"><span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Briefcase size={14} className="text-gray-400" /> Başvurularım{myApplicationRefs.filter(r => r.role === "owner").length > 0 && <span className="text-xs text-gray-400">({myApplicationRefs.filter(r => r.role === "owner").length})</span>}</span><ChevronRight size={15} className="text-gray-300" /></button>
                <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2"><Star size={15} className="text-gray-400" /> Yorumlarım</h3>
                <button onClick={() => setOwnerProfileTab("myReviews")} className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-5 hover:bg-gray-100 transition"><span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Star size={14} className="text-gray-400" /> Yaptığım Yorumlar{myReviews.length > 0 && <span className="text-xs text-gray-400">({myReviews.length})</span>}</span><ChevronRight size={15} className="text-gray-300" /></button>
                <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2"><Settings size={15} className="text-gray-400" /> Uygulama</h3>
                <button onClick={() => setOwnerProfileTab("settings")} className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-2 hover:bg-gray-100 transition"><span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Settings size={14} className="text-gray-400" /> Ayarlar</span><ChevronRight size={15} className="text-gray-300" /></button>
                <button onClick={goHome} className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-5 hover:bg-gray-100 transition"><span className="text-sm font-medium text-gray-700 flex items-center gap-2"><LogOut size={14} className="text-gray-400" /> {t("logout")}</span><ChevronRight size={15} className="text-gray-300" /></button>
              </>)}
              {ownerProfileTab === "settings" && (
                <>
                  <button onClick={() => setOwnerProfileTab("info")} className="flex items-center gap-1 text-rose-600 mb-4 text-sm"><ChevronLeft size={16} /> Bilgilerime Dön</button>
                  <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Settings size={16} className="text-rose-500" /> Ayarlar</h2>
                  <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-4"><h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Bell size={14} className="text-rose-500" /> {t("smartReminders")}</h4><button onClick={() => setOwnerSettings(s => ({ ...s, smartReminders: !s.smartReminders }))} aria-label="Değiştir" className="p-3 -m-3 flex-shrink-0"><div className={`w-12 h-7 rounded-full transition relative ${ownerSettings.smartReminders ? "bg-rose-600" : "bg-gray-200"}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition ${ownerSettings.smartReminders ? "left-6" : "left-1"}`} /></div></button></div>
                  <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-4"><div className="pr-3"><h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><MapPin size={14} className="text-rose-500" /> Konumumu Kullan</h4><p className="text-[11px] text-gray-400 mt-0.5">{userLocation ? "Gerçek konumunuza göre mesafe gösteriliyor" : "Kapalı — tahmini mesafeler gösteriliyor"}</p></div><button onClick={() => (userLocation ? stopUsingLocation() : setShowLocationPrompt(true))} aria-label="Değiştir" className="p-3 -m-3 flex-shrink-0"><div className={`w-12 h-7 rounded-full transition relative ${userLocation ? "bg-rose-600" : "bg-gray-200"}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition ${userLocation ? "left-6" : "left-1"}`} /></div></button></div>
                  {(() => {
                    const notifOpts = [{ key: "notifyAppointments", label: "Randevu güncellemeleri" }, { key: "notifyOffers", label: "Teklif sonuçları" }, { key: "notifyMessages", label: "Mesaj bildirimleri" }];
                    const allNotifsOn = notifOpts.every(opt => ownerSettings[opt.key]);
                    const toggleAllNotifs = () => {
                      setOwnerSettings(s => ({ ...s, ...Object.fromEntries(notifOpts.map(opt => [opt.key, !allNotifsOn])) }));
                      if (!allNotifsOn && notifPermission !== "granted") requestNotifPermission();
                    };
                    return (
                      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
                        <div className="flex items-center justify-between"><div className="pr-3"><h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Bell size={14} className="text-rose-500" /> Bildirimler</h4><p className="text-[11px] text-gray-400 mt-0.5">{notifPermission === "denied" ? "Tarayıcı ayarlarından izin vermeniz gerekiyor" : allNotifsOn ? "Tüm bildirim türleri açık" : "Randevu güncellemelerini kaçırmayın"}</p></div><button onClick={toggleAllNotifs} aria-label="Değiştir" className="p-3 -m-3 flex-shrink-0"><div className={`w-12 h-7 rounded-full transition relative ${allNotifsOn ? "bg-rose-600" : "bg-gray-200"}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition ${allNotifsOn ? "left-6" : "left-1"}`} /></div></button></div>
                        <button onClick={() => setOwnerNotifDetailsOpen(o => !o)} className="w-full flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 hover:text-gray-700 transition"><span>Bildirim türlerini göster</span><ChevronRight size={13} className={`transition-transform ${ownerNotifDetailsOpen ? "rotate-90" : ""}`} /></button>
                        {ownerNotifDetailsOpen && (
                          <div className="mt-3 space-y-2.5">
                            {notifOpts.map(opt => (
                              <div key={opt.key} className="flex items-center justify-between"><span className="text-xs text-gray-600">{opt.label}</span><button onClick={() => setOwnerSettings(s => ({ ...s, [opt.key]: !s[opt.key] }))} aria-label="Değiştir" className="p-3 -m-3 flex-shrink-0"><div className={`w-9 h-5 rounded-full transition relative ${ownerSettings[opt.key] ? "bg-rose-600" : "bg-gray-200"}`}><div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition ${ownerSettings[opt.key] ? "left-[19px]" : "left-[3px]"}`} /></div></button></div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-4"><h4 className="font-semibold text-gray-800 text-sm">{t("siteLanguage")}</h4><LangSwitch /></div>
                  <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-4"><div className="pr-3"><h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Globe size={14} className="text-rose-500" /> Mesajlaşma Dili</h4><p className="text-[11px] text-gray-400 mt-0.5">Tamircilerin size yazdığı mesajlar bu dile otomatik çevrilir</p></div><div className="flex bg-gray-100 rounded-full p-0.5 gap-0.5 flex-shrink-0">{["tr", "en", "de"].map(l => (<button key={l} onClick={() => setOwnerLang(l)} className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${ownerLang === l ? "bg-white text-rose-600 shadow-sm" : "text-gray-400"}`}>{l.toUpperCase()}</button>))}</div></div>
                  <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-5"><h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Palette size={14} className="text-rose-500" /> Görünüm — Karanlık Mod</h4><button onClick={() => setDarkMode(d => !d)} aria-label="Değiştir" className="p-3 -m-3 flex-shrink-0"><div className={`w-12 h-7 rounded-full transition relative ${darkMode ? "bg-rose-600" : "bg-gray-200"}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition ${darkMode ? "left-6" : "left-1"}`} /></div></button></div>
                  <button onClick={() => setOwnerAccountOpen(o => !o)} className="w-full flex items-center justify-between mb-2 hover:opacity-70 transition"><h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Lock size={15} className="text-gray-400" /> Hesap</h3><ChevronRight size={15} className={`text-gray-300 transition-transform ${ownerAccountOpen ? "rotate-90" : ""}`} /></button>
                  {ownerAccountOpen && (<>
                    <button onClick={() => setShowPasswordModal(true)} className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-2 hover:bg-gray-100 transition"><span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Lock size={14} className="text-gray-400" /> Şifre Değiştir</span><ChevronRight size={15} className="text-gray-300" /></button>
                    <button onClick={() => setOwnerProfileTab("support")} className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-2 hover:bg-gray-100 transition"><span className="text-sm font-medium text-gray-700 flex items-center gap-2"><LifeBuoy size={14} className="text-gray-400" /> Yardım &amp; Destek</span>{mySupportTickets().filter(tk => tk.status !== "resolved").length > 0 && <span className="text-[10px] font-bold text-white bg-rose-600 rounded-full px-1.5 py-0.5 flex-shrink-0">{mySupportTickets().filter(tk => tk.status !== "resolved").length}</span>}<ChevronRight size={15} className="text-gray-300" /></button>
                    <button onClick={() => setLegalModalTopic("terms")} className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-2 hover:bg-gray-100 transition"><span className="text-sm font-medium text-gray-700">Kullanım Şartları</span><ChevronRight size={15} className="text-gray-300" /></button>
                    <button onClick={() => setLegalModalTopic("privacy")} className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 mb-2 hover:bg-gray-100 transition"><span className="text-sm font-medium text-gray-700">Gizlilik Politikası</span><ChevronRight size={15} className="text-gray-300" /></button>
                  </>)}
                  <div className="mt-3" />
                  <button onClick={() => setOwnerDangerZoneOpen(o => !o)} className="w-full flex items-center justify-between py-2 text-xs text-gray-400 hover:text-gray-600 transition"><span>Tehlikeli Bölge</span><ChevronRight size={13} className={`transition-transform ${ownerDangerZoneOpen ? "rotate-90" : ""}`} /></button>
                  {ownerDangerZoneOpen && (
                    <div className="border border-red-100 bg-red-50/50 rounded-2xl p-4 mt-1">
                      <p className="text-xs text-gray-500 mb-3">Hesabını silersen tüm araçların, randevuların ve sohbetlerin kalıcı olarak silinir. Bu işlem geri alınamaz.</p>
                      <button onClick={() => { setShowDeleteAccountModal(true); setDeleteConfirmText(""); }} className="w-full text-red-500 border border-red-200 py-2.5 rounded-xl font-medium text-xs hover:bg-red-100 transition">Hesabımı Sil</button>
                    </div>
                  )}
                </>
              )}
              {ownerProfileTab === "applications" && (
                <>
                  <button onClick={() => setOwnerProfileTab("info")} className="flex items-center gap-1 text-rose-600 mb-4 text-sm"><ChevronLeft size={16} /> Bilgilerime Dön</button>
                  <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Briefcase size={16} className="text-rose-500" /> İş Başvurularım</h2>
                  <div className="space-y-3">
                    {myApplicationRefs.filter(r => r.role === "owner").map(r => (
                      <button key={r.id} onClick={() => setSelectedJobId(r.job.id)} className="w-full text-left bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-rose-200 transition">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-gray-800 text-sm">{r.job.title}</h4>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${r.applicant?.status === "rejected" ? "bg-red-50 text-red-500" : r.job.status === "closed" ? "bg-gray-100 text-gray-400" : "bg-gray-100 text-gray-700"}`}>{r.applicant?.status === "rejected" ? "Reddedildi" : r.job.status === "closed" ? "İlan Kapandı" : "İnceleniyor"}</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-1">{r.job.mechanicName}{r.job.location ? ` · ${r.job.location}` : ""}</p>
                        <p className="text-[11px] text-gray-300">{r.date} başvuruldu</p>
                      </button>
                    ))}
                    {myApplicationRefs.filter(r => r.role === "owner").length === 0 && <div className="text-center py-16"><Briefcase size={40} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-400 text-sm">Henüz bir iş başvurunuz yok.</p></div>}
                  </div>
                </>
              )}
              {ownerProfileTab === "myReviews" && (
                <>
                  <button onClick={() => setOwnerProfileTab("info")} className="flex items-center gap-1 text-rose-600 mb-4 text-sm"><ChevronLeft size={16} /> Bilgilerime Dön</button>
                  <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2"><Star size={16} className="text-gray-900" /> Yaptığım Yorumlar</h2>
                  <p className="text-xs text-gray-400 mb-4">Airbnb'de olduğu gibi, gönderdiğiniz bir yorumu düzenleyemezsiniz — sadece silebilirsiniz.</p>
                  <div className="space-y-3">
                    {myReviews.map(r => (
                      <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-gray-800 text-sm">{r.mechanicImg} {r.mechanicName}</h4>
                          <button onClick={() => setConfirmDialog({ title: "Yorumu sil", body: "Bu yorumu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.", confirmLabel: "Evet, Sil", danger: true, onConfirm: () => deleteMyReview(r.mechanicId, r.id) })} aria-label="Yorumu sil" className="text-red-400 hover:text-red-600 flex-shrink-0 p-2 -m-2"><Trash2 size={14} /></button>
                        </div>
                        <div className="flex items-center gap-0.5 mb-1.5">{[1, 2, 3, 4, 5].map(n => (<Star key={n} size={12} className={n <= r.rating ? "text-gray-900 fill-gray-900" : "text-gray-200 fill-gray-200"} />))}</div>
                        <p className="text-xs text-gray-500">{r.comment}</p>
                        <p className="text-[11px] text-gray-300 mt-1.5">{r.date}</p>
                      </div>
                    ))}
                    {myReviews.length === 0 && <div className="text-center py-16"><Star size={40} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-400 text-sm">Henüz bir yorum yapmadınız.</p></div>}
                  </div>
                </>
              )}
              {ownerProfileTab === "market" && (
                <>
                  <button onClick={() => setOwnerProfileTab("info")} className="flex items-center gap-1 text-rose-600 mb-4 text-sm"><ChevronLeft size={16} /> Bilgilerime Dön</button>
                  <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Tag size={16} className="text-rose-500" /> Sattığım Araçlar</h2>
                  <button onClick={startSellFlow} className="w-full mb-4 bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition flex items-center justify-center gap-2"><Plus size={16} /> {t("sellMyCar")}</button>
                  {listings.filter(l => l.sellerName === ownerProfile.name).length === 0 ? (<div className="text-center py-16"><Tag size={40} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-400 text-sm">{t("noOwnListings")}</p></div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{listings.filter(l => l.sellerName === ownerProfile.name).map(l => (<ListingCard key={l.id} l={l} />))}</div>)}
                </>
              )}
              {ownerProfileTab === "favorites" && (
                <>
                  <button onClick={() => setOwnerProfileTab("info")} className="flex items-center gap-1 text-rose-600 mb-4 text-sm"><ChevronLeft size={16} /> Bilgilerime Dön</button>
                  <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Heart size={16} className="text-rose-500" /> Favori İlanlarım</h2>
                  {listings.filter(l => favoriteIds.includes(l.id)).length === 0 ? (
                    <div className="text-center py-16"><Heart size={40} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-400 text-sm">Henüz favori eklemediniz.</p><p className="text-gray-300 text-xs mt-1">İlan kartlarındaki kalp ikonuna dokunarak favorilere ekleyebilirsiniz.</p></div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{listings.filter(l => favoriteIds.includes(l.id)).map(l => (<ListingCard key={l.id} l={l} />))}</div>
                  )}
                </>
              )}
              {ownerProfileTab === "support" && renderSupportView("settings", setOwnerProfileTab)}
              {ownerProfileTab === "vehicles" && !selectedVehicle && (
                <>
                  <button onClick={() => setShowAddVehicle(!showAddVehicle)} className="w-full mb-4 border-2 border-dashed border-rose-200 rounded-2xl py-3 flex items-center justify-center gap-2 text-rose-600 text-sm font-medium hover:bg-rose-50 transition"><Plus size={16} /> {t("addVehicle")}</button>
                  {showAddVehicle && (<div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 space-y-2">
                    <input value={newVehicle.brand} onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })} placeholder="Marka" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                    <input value={newVehicle.model} onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })} placeholder="Model" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                    <div className="flex gap-2"><input value={newVehicle.year} onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })} placeholder="Yıl" className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={newVehicle.plate} onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value })} placeholder="Plaka" className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                    <select value={newVehicle.country} onChange={(e) => setNewVehicle({ ...newVehicle, country: e.target.value, city: "" })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"><option value="tr">🇹🇷 Türkiye</option><option value="de">🇩🇪 Almanya</option></select>
                    {newVehicle.country === "de" ? (
                      <select value={newVehicle.city} onChange={(e) => setNewVehicle({ ...newVehicle, city: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"><option value="">Şehir seçin (resmi lastik tarihi için)</option>{DE_CITIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    ) : (
                      <input value={newVehicle.city} onChange={(e) => setNewVehicle({ ...newVehicle, city: e.target.value })} placeholder="Şehir" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                    )}
                    <select value={newVehicle.tireType} onChange={(e) => setNewVehicle({ ...newVehicle, tireType: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"><option value="mevsimlik">Mevsimlik lastik</option><option value="allseason">4 mevsim lastik</option></select>
                    <div><label className="text-[11px] text-gray-400">Son Muayene</label><input type="date" value={newVehicle.lastInspection} onChange={(e) => setNewVehicle({ ...newVehicle, lastInspection: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                    <div><label className="text-[11px] text-gray-400">Sigorta Bitiş</label><input type="date" value={newVehicle.insuranceEnd} onChange={(e) => setNewVehicle({ ...newVehicle, insuranceEnd: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                    <button onClick={addVehicle} className="w-full bg-rose-600 text-white py-3 rounded-2xl text-sm font-semibold hover:bg-rose-700 transition">{t("add")}</button>
                  </div>)}
                  <div className="space-y-3">{vehicles.map(v => { const vReminders = computeReminders(v); const vListing = listings.find(l => l.id === v.listingId); const vOfferCount = vListing ? vListing.offers.filter(o => o.status !== "replaced").length : 0; return (<button key={v.id} onClick={() => setSelectedVehicleId(v.id)} className="w-full text-left bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-rose-200 transition flex items-center gap-3"><div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center flex-shrink-0"><Car size={22} className="text-rose-600" /></div><div className="flex-1"><h3 className="font-semibold text-gray-800 text-sm">{v.brand} {v.model} ({v.year})</h3><p className="text-xs text-gray-400">{v.plate}{vListing && <span className="ml-2 text-rose-500">· 🏷️ Satışta{vOfferCount > 0 ? ` · ${vOfferCount} teklif` : ""}</span>}</p></div>{ownerSettings.smartReminders && vReminders.filter(r=>r.urgent).length > 0 && <span className="w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center flex-shrink-0">{vReminders.filter(r=>r.urgent).length}</span>}<ChevronRight size={16} className="text-gray-300" /></button>); })}{vehicles.length === 0 && <p className="text-center text-gray-400 text-sm py-10">Henüz araç eklemediniz</p>}
                  {listings.filter(l => l.sellerName === ownerProfile.name && !vehicles.some(v => v.listingId === l.id)).length > 0 && (
                    <>
                      <h3 className="font-semibold text-gray-800 text-sm mt-6 mb-1 flex items-center gap-2"><Tag size={15} className="text-gray-400" /> Kayıtlı Aracım Dışında Sattıklarım</h3>
                      {listings.filter(l => l.sellerName === ownerProfile.name && !vehicles.some(v => v.listingId === l.id)).map(l => {
                        const offerCount = l.offers.filter(o => o.status !== "replaced").length;
                        return (
                          <div key={l.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                            <button onClick={() => setSelectedListingId(l.id)} className="w-full text-left flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">{isImgUrl(l.photo) ? <img src={l.photo} alt={`${l.brand ?? ""} ${l.model ?? ""}`.trim() || "İlan fotoğrafı"} className="w-full h-full object-cover" /> : l.photo}</div>
                              <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{l.brand} {l.model} ({l.year})</p><p className="text-xs text-gray-400">{l.price} · İlan #{l.id}</p></div>
                              <span className={`text-[10px] font-bold text-white px-2 py-1 rounded-full flex-shrink-0 ${l.adminRemoved ? "bg-gray-900" : listingStatusMeta(l.status, t).color}`}>{l.adminRemoved ? "Kaldırıldı" : listingStatusMeta(l.status, t).label}</span>
                            </button>
                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                              <span className="text-[11px] text-gray-400">{offerCount > 0 ? `${offerCount} teklif` : "Henüz teklif yok"}</span>
                              <div className="flex items-center gap-3">
                                <button onClick={() => openSellForm({ brand: l.brand, model: l.model, year: l.year, km: l.km, price: l.price, description: l.description, photo: l.photo, fuelType: l.fuelType, transmission: l.transmission, power: l.power, firstReg: l.firstReg, color: l.color, _vehicleId: null, _editingId: l.id })} className="text-xs font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"><Pencil size={12} /> Düzenle</button>
                                <button onClick={() => setSelectedListingId(l.id)} className="text-xs font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1">Teklifleri Gör <ChevronRight size={12} /></button>
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
                  <button onClick={() => setSelectedVehicleId(null)} className="flex items-center gap-1 text-rose-600 mb-4 text-sm"><ChevronLeft size={16} /> Araçlara Dön</button>
                  <div className="bg-rose-50 rounded-2xl p-4 mb-5 flex items-center gap-3"><div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center"><Car size={26} className="text-rose-600" /></div><div className="flex-1"><h2 className="font-bold text-gray-800">{selectedVehicle.brand} {selectedVehicle.model}</h2><p className="text-xs text-gray-500">{selectedVehicle.year} · {selectedVehicle.plate}</p></div><button onClick={() => { setEditVehicleForm({ ...selectedVehicle }); setShowEditVehicle(true); }} aria-label="Aracı düzenle" className="text-rose-600 p-2 -m-2"><Pencil size={16} /></button></div>
                  {showEditVehicle && editVehicleForm && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5 space-y-2">
                      <h3 className="font-semibold text-gray-800 text-sm mb-1">Araç Bilgilerini Düzenle</h3>
                      <div className="flex gap-2"><input value={editVehicleForm.brand} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, brand: e.target.value })} placeholder="Marka" className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={editVehicleForm.model} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, model: e.target.value })} placeholder="Model" className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                      <div className="flex gap-2"><input value={editVehicleForm.year} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, year: e.target.value })} placeholder="Yıl" className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={editVehicleForm.plate} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, plate: e.target.value })} placeholder="Plaka" className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                      <select value={editVehicleForm.country} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, country: e.target.value, city: "" })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"><option value="tr">🇹🇷 Türkiye</option><option value="de">🇩🇪 Almanya</option></select>
                      {editVehicleForm.country === "de" ? (
                        <select value={editVehicleForm.city || ""} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, city: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"><option value="">Şehir seçin (resmi lastik tarihi için)</option>{DE_CITIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                      ) : (
                        <input value={editVehicleForm.city || ""} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, city: e.target.value })} placeholder="Şehir" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                      )}
                      <select value={editVehicleForm.tireType} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, tireType: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"><option value="mevsimlik">Mevsimlik lastik</option><option value="allseason">4 mevsim lastik</option></select>
                      <div><label className="text-[11px] text-gray-400">Son Muayene</label><input type="date" value={editVehicleForm.lastInspection || ""} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, lastInspection: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                      <div><label className="text-[11px] text-gray-400">Son Bakım</label><input type="date" value={editVehicleForm.lastMaintenance || ""} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, lastMaintenance: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                      <div><label className="text-[11px] text-gray-400">Sigorta Bitiş</label><input type="date" value={editVehicleForm.insuranceEnd || ""} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, insuranceEnd: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                      <div className="flex gap-2 pt-1"><button onClick={() => setShowEditVehicle(false)} className="flex-1 border border-gray-200 text-gray-500 py-2 rounded-xl text-sm">{t("cancel")}</button><button onClick={() => { if (editVehicleForm.lastInspection && !isValidDateStr(editVehicleForm.lastInspection)) { setToast({ type: "info", text: "⚠️ Geçersiz Son Muayene tarihi." }); return; } if (editVehicleForm.lastMaintenance && !isValidDateStr(editVehicleForm.lastMaintenance)) { setToast({ type: "info", text: "⚠️ Geçersiz Son Bakım tarihi." }); return; } if (editVehicleForm.insuranceEnd && !isValidDateStr(editVehicleForm.insuranceEnd)) { setToast({ type: "info", text: "⚠️ Geçersiz Sigorta Bitiş tarihi." }); return; } updateVehicleFields(selectedVehicle.id, editVehicleForm); setShowEditVehicle(false); setToast({ type: "info", text: "✅ Araç bilgileri güncellendi." }); }} className="flex-1 bg-rose-600 text-white py-2 rounded-xl text-sm font-medium">{t("save")}</button></div>
                    </div>
                  )}
                  {linkedListing ? (<div className="mb-5 bg-white border border-gray-100 rounded-2xl p-4"><div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Tag size={15} className="text-rose-500" /> {t("listingStatus")}</h3><span className={`text-[10px] text-white font-bold px-2 py-1 rounded-full ${listingStatusMeta(linkedListing.status, t).color}`}>{listingStatusMeta(linkedListing.status, t).label}</span></div><div className="flex gap-2 mb-3">{["active", "reserved", "sold"].map(st => (<button key={st} onClick={() => setListingStatus(linkedListing.id, st)} className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium border transition ${linkedListing.status === st ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-500 border-gray-200"}`}>{listingStatusMeta(st, t).label}</button>))}</div><p className="text-[11px] text-gray-400 mb-3">{(() => { const oc = linkedListing.offers.filter(o => o.status !== "replaced").length; return oc > 0 ? `${oc} teklif geldi` : "Henüz teklif gelmedi"; })()}</p><div className="flex gap-2"><button onClick={() => openSellForm({ ...linkedListing, _vehicleId: selectedVehicle.id, _editingId: linkedListing.id })} className="flex-1 bg-gray-50 text-gray-700 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 transition flex items-center justify-center gap-2"><Pencil size={14} /> {t("editListing")}</button><button onClick={() => setSelectedListingId(linkedListing.id)} className="flex-1 bg-rose-50 text-rose-600 py-2 rounded-xl text-sm font-medium hover:bg-rose-100 transition flex items-center justify-center gap-2"><MessageCircle size={14} /> Teklifleri Gör</button></div></div>) : (<button onClick={() => openSellForm({ brand: selectedVehicle.brand, model: selectedVehicle.model, year: selectedVehicle.year, km: "", price: "", description: "", photo: "🚗", fuelType: "Benzin", transmission: "Manuel", power: "", firstReg: "", color: "", _vehicleId: selectedVehicle.id, _editingId: null })} className="w-full mb-5 bg-white border border-rose-200 text-rose-600 py-2.5 rounded-xl text-sm font-medium hover:bg-rose-50 transition flex items-center justify-center gap-2"><Tag size={15} /> {t("sellThisCar")}</button>)}
                  {ownerSettings.smartReminders && (() => {
                    const vReminders = computeReminders(selectedVehicle);
                    const disabledKinds = Object.entries(selectedVehicle.reminderOverrides || {}).filter(([, ov]: [string, any]) => ov && ov.enabled === false).map(([k]) => k);
                    return (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Bell size={16} className="text-rose-500" /> {t("smartReminders")}</h3>
                        {selectedVehicle.city && <span className="text-[10px] text-gray-400">📍 {selectedVehicle.city}</span>}
                      </div>
                      <p className="text-[11px] text-gray-400 -mt-2 mb-3">Sistem hangi hatırlatmaların gerekli olduğuna otomatik karar verir. Düzenlemezsen resmi/yasal tarihler esas alınır — istersen tarihi veya kaç gün önceden hatırlatılacağını sen belirle.</p>
                      <div className="space-y-2 mb-3">
                        {vReminders.map((r) => (
                          <div key={r.kind} className={`rounded-xl p-3 ${r.urgent ? "bg-red-50" : "bg-gray-100"}`}>
                            <div className="flex items-start gap-2">
                              <span className="text-lg flex-shrink-0">{r.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className={`text-xs font-semibold ${r.urgent ? "text-red-600" : "text-gray-700"}`}>{r.title}</p>
                                  {r.customized && <span className="text-[9px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">Özel ayar</span>}
                                </div>
                                <p className="text-[11px] text-gray-500 mt-0.5">{r.detail}</p>
                              </div>
                              <button onClick={() => { if (editingReminderKind === r.kind) { setEditingReminderKind(null); } else { setEditingReminderKind(r.kind); setReminderEditForm({ enabled: true, customDate: r.dueDate ? r.dueDate.toISOString().slice(0, 10) : "", leadDays: String(r.leadDays ?? "") }); } }} aria-label="Hatırlatmayı düzenle" className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-2 -m-1.5"><Pencil size={13} /></button>
                            </div>
                            {editingReminderKind === r.kind && (
                              <div className="mt-3 pt-3 border-t border-black/5 space-y-2">
                                <div><label className="text-[10px] text-gray-400">{r.isUserCreated ? "Hatırlatma tarihi" : "Hatırlatma tarihi (boş bırakırsan resmi/otomatik tarih kullanılır)"}</label><input type="date" min={TODAY_STR} value={reminderEditForm.customDate} onChange={(e) => setReminderEditForm(f => ({ ...f, customDate: e.target.value }))} className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs mt-0.5" /></div>
                                <div><label className="text-[10px] text-gray-400">Kaç gün önceden hatırlatayım?</label><input type="number" min="0" value={reminderEditForm.leadDays} onChange={(e) => setReminderEditForm(f => ({ ...f, leadDays: e.target.value }))} placeholder={String(r.leadDays)} className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs mt-0.5" /></div>
                                {r.isUserCreated ? (
                                  <div className="flex gap-2 pt-1">
                                    <button onClick={() => updateCustomReminder(selectedVehicle.id, r.customId, { date: reminderEditForm.customDate || r.dueDate.toISOString().slice(0, 10), leadDays: reminderEditForm.leadDays || "7" })} className="flex-1 bg-rose-600 text-white py-1.5 rounded-lg text-[11px] font-medium">{t("save")}</button>
                                    <button onClick={() => removeCustomReminder(selectedVehicle.id, r.customId)} className="flex-1 border border-red-200 text-red-500 py-1.5 rounded-lg text-[11px] font-medium">Sil</button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex gap-2 pt-1">
                                      <button onClick={() => saveReminderOverride(selectedVehicle.id, r.kind, { enabled: true, customDate: reminderEditForm.customDate || null, leadDays: reminderEditForm.leadDays === "" ? null : Number(reminderEditForm.leadDays) })} className="flex-1 bg-rose-600 text-white py-1.5 rounded-lg text-[11px] font-medium">{t("save")}</button>
                                      <button onClick={() => saveReminderOverride(selectedVehicle.id, r.kind, { enabled: false })} className="flex-1 border border-gray-200 text-gray-500 py-1.5 rounded-lg text-[11px] font-medium">Bunu Kapat</button>
                                    </div>
                                    {r.customized && <button onClick={() => resetReminderOverride(selectedVehicle.id, r.kind)} className="w-full text-rose-600 text-[11px] font-medium py-1">↩️ Varsayılan (resmi) tarihe dön</button>}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        {vReminders.length === 0 && <p className="text-center text-gray-400 text-xs py-3">Şu an aktif hatırlatma yok.</p>}
                      </div>
                      {disabledKinds.length > 0 && (
                        <div className="mb-5 bg-white border border-gray-200 rounded-xl p-3">
                          <p className="text-[10px] text-gray-400 mb-2">Kapatılan hatırlatmalar</p>
                          <div className="flex flex-wrap gap-1.5">
                            {disabledKinds.map(k => (<button key={k} onClick={() => resetReminderOverride(selectedVehicle.id, k)} className="text-[10px] bg-white border border-gray-200 text-gray-500 px-2 py-1 rounded-full hover:border-rose-300 hover:text-rose-600 transition">{REMINDER_KIND_LABELS[k] || k} · Tekrar Aç</button>))}
                          </div>
                        </div>
                      )}
                      {!showAddReminderForm ? (
                        <button onClick={() => { setShowAddReminderForm(true); setNewReminderForm({ title: "", date: "", leadDays: "7" }); }} className="w-full border-2 border-dashed border-rose-200 rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-rose-600 text-xs font-medium hover:bg-rose-50 transition mb-5"><Plus size={14} /> Yeni Hatırlatma Ekle</button>
                      ) : (
                        <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 mb-5 space-y-2">
                          <input autoFocus value={newReminderForm.title} onChange={(e) => setNewReminderForm(f => ({ ...f, title: e.target.value }))} placeholder="Hatırlatma başlığı (örn. Fren Balata Kontrolü)" className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white" />
                          <div className="flex gap-2">
                            <div className="flex-1"><label className="text-[9px] text-gray-400 block mb-0.5">Tarih</label><input type="date" min={TODAY_STR} value={newReminderForm.date} onChange={(e) => setNewReminderForm(f => ({ ...f, date: e.target.value }))} className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white" /></div>
                            <div className="w-28"><label className="text-[9px] text-gray-400 block mb-0.5">Kaç gün önceden hatırlatayım?</label><input type="number" min="0" value={newReminderForm.leadDays} onChange={(e) => setNewReminderForm(f => ({ ...f, leadDays: e.target.value }))} placeholder="Gün" className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white" /></div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setShowAddReminderForm(false); setNewReminderForm({ title: "", date: "", leadDays: "7" }); }} className="flex-1 border border-gray-200 text-gray-500 text-[11px] py-1.5 rounded-lg font-medium">{t("cancel")}</button>
                            <button disabled={!newReminderForm.title.trim() || !newReminderForm.date} onClick={() => submitNewReminder(selectedVehicle.id)} className={`flex-1 text-[11px] py-1.5 rounded-lg font-medium transition ${newReminderForm.title.trim() && newReminderForm.date ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>Ekle</button>
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
                    {selectedVehicle.history.length > 0 && (<button onClick={() => downloadMaintenanceReport(selectedVehicle)} title="Raporu indir" className="ml-2 w-7 h-7 flex-shrink-0 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition"><FileText size={13} /></button>)}
                  </div>
                  {showMaintenanceHistory && (selectedVehicle.history.length === 0 ? (
                    <p className="text-center text-gray-400 text-xs py-6">Henüz bakım kaydı yok.</p>
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
                      {selectedVehicle.history.length > 4 && <p className="text-center text-[10px] text-gray-300 mt-1.5 flex items-center justify-center gap-1"><ChevronRight size={10} className="rotate-90" /> Daha fazlası için kaydırın</p>}
                    </>
                  ))}
                </>
              ); })()}
              {ownerProfileTab === "appts" && <OwnerAppointmentsView />}
              {ownerProfileTab === "chats" && (<div className="space-y-3">{conversations.map(c => { const last = c.messages[c.messages.length - 1]; return (<button key={c.id} onClick={() => { setActiveConvoId(c.id); setScreen("chat"); }} className="w-full text-left bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3"><div className="text-2xl bg-rose-50 rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0">{c.mechanicImg}</div><div className="flex-1 min-w-0"><h4 className="font-semibold text-gray-800 text-sm">{c.mechanicName}</h4><p className="text-xs text-gray-400 truncate">{last ? last.text : "Henüz mesaj yok"}</p></div><ChevronRight size={16} className="text-gray-300" /></button>); })}{conversations.length === 0 && <p className="text-center text-gray-400 text-sm py-10">Sohbet yok</p>}</div>)}
              {ownerProfileTab === "offers" && (<>
                <h3 className="font-semibold text-gray-800 text-sm mb-2">{t("offersMade")}</h3>
                <div className="space-y-2 mb-6">{listings.flatMap(l => l.offers.filter(o => o.from === ownerProfile.name && o.status !== "replaced").map(o => ({ ...o, listing: l }))).map(o => (<div key={o.id} className="bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-center"><div><p className="text-xs font-medium text-gray-700">{o.listing.brand} {o.listing.model}</p><p className="text-[10px] text-gray-400">{o.status === "accepted" ? "✅ Kabul edildi" : o.status === "rejected" ? "❌ Reddedildi" : o.seen ? "⏳ Beklemede · satıcı gördü" : "⏳ Beklemede"}</p></div><span className="font-bold text-rose-600 text-sm">{o.amount}{o.currency || "₺"}</span></div>))}
                {listings.flatMap(l => l.offers.filter(o => o.from === ownerProfile.name && o.status !== "replaced")).length === 0 && <p className="text-center text-gray-400 text-sm py-4">Henüz teklif vermediniz</p>}</div>
                <h3 className="font-semibold text-gray-800 text-sm mb-2">{t("offersReceived")}</h3>
                <div className="space-y-2">{listings.filter(l => l.sellerName === ownerProfile.name).flatMap(l => l.offers.filter(o => o.status !== "replaced").map(o => ({ ...o, listing: l }))).map(o => (
                  <div key={o.id} className="bg-white border border-gray-100 rounded-xl p-3">
                    <div className="flex justify-between items-center mb-2"><div><p className="text-xs font-medium text-gray-700">{o.from}</p><p className="text-[10px] text-gray-400">{o.listing.brand} {o.listing.model}</p></div><span className="font-bold text-rose-600 text-sm">{o.amount}{o.currency || "₺"}</span></div>
                    {o.status === "pending" ? (<div className="flex gap-2"><button onClick={() => respondOffer(o.listing.id, o.id, "accepted")} className="flex-1 bg-green-500 text-white text-[11px] py-1.5 rounded-lg font-medium">{t("accept")}</button><button onClick={() => respondOffer(o.listing.id, o.id, "rejected")} className="flex-1 border border-gray-200 text-gray-500 text-[11px] py-1.5 rounded-lg font-medium">{t("reject")}</button></div>) : (<p className="text-[11px] text-gray-400">{o.status === "accepted" ? "✅ Kabul edildi" : "❌ Reddedildi"}</p>)}
                  </div>
                ))}{listings.filter(l => l.sellerName === ownerProfile.name).flatMap(l => l.offers.filter(o => o.status !== "replaced")).length === 0 && <p className="text-center text-gray-400 text-sm py-4">Henüz teklif almadınız</p>}</div>
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
              <div className="h-56 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-7xl overflow-hidden">{isImgUrl(selectedListing.photo) ? <img src={selectedListing.photo} alt={`${selectedListing.brand ?? ""} ${selectedListing.model ?? ""}`.trim() || "İlan fotoğrafı"} className="w-full h-full object-cover" /> : selectedListing.photo}</div>
              <span className={`absolute bottom-3 left-4 text-white text-xs font-bold px-3 py-1.5 rounded-full ${listingStatusMeta(selectedListing.status, t).color}`}>{listingStatusMeta(selectedListing.status, t).label}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-5 md:p-8">
              <h1 className="text-xl font-bold text-gray-800">{selectedListing.brand} {selectedListing.model}</h1>
              <p className="text-3xl font-bold text-rose-700 mt-1">{selectedListing.price}</p>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><Gauge size={16} className="mx-auto mb-1 text-gray-400" /><p className="text-[9px] text-gray-400">{t("mileage")}</p><p className="text-xs font-bold text-gray-700">{Number(selectedListing.km).toLocaleString("tr-TR")} km</p></div>
                <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><CalendarDays size={16} className="mx-auto mb-1 text-gray-400" /><p className="text-[9px] text-gray-400">{t("firstReg")}</p><p className="text-xs font-bold text-gray-700">{selectedListing.firstReg || selectedListing.year}</p></div>
                <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><Fuel size={16} className="mx-auto mb-1 text-gray-400" /><p className="text-[9px] text-gray-400">{t("fuelType")}</p><p className="text-xs font-bold text-gray-700">{selectedListing.fuelType || "—"}</p></div>
                <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><Cog size={16} className="mx-auto mb-1 text-gray-400" /><p className="text-[9px] text-gray-400">{t("transmission")}</p><p className="text-xs font-bold text-gray-700">{selectedListing.transmission || "—"}</p></div>
                <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><Zap size={16} className="mx-auto mb-1 text-gray-400" /><p className="text-[9px] text-gray-400">{t("power")}</p><p className="text-xs font-bold text-gray-700">{selectedListing.power ? `${selectedListing.power} HP` : "—"}</p></div>
                <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><Palette size={16} className="mx-auto mb-1 text-gray-400" /><p className="text-[9px] text-gray-400">{t("color")}</p><p className="text-xs font-bold text-gray-700">{selectedListing.color || "—"}</p></div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 flex-wrap"><span className={`px-2 py-1 rounded-full font-medium ${selectedListing.sellerType === "mechanic" ? "bg-rose-100 text-rose-700" : "bg-rose-50 text-rose-600"}`}>{selectedListing.sellerType === "mechanic" ? "🔧 Tamirci" : "👤 Sahibinden"}</span><span>{selectedListing.sellerName}</span><span className="text-gray-300">·</span><span className="text-gray-400">İlan #{selectedListing.id}</span></div>
              <p className="text-sm text-gray-600 mt-4 leading-relaxed">{selectedListing.description}</p>
              {(() => {
                const isOwnListing = selectedListing.sellerName === (role === "owner" ? ownerProfile.name : myProfile?.name);
                const activeOffers = selectedListing.offers.filter(o => o.status !== "replaced");
                if (isOwnListing) return (
                  <>
                    <div className="mt-5 bg-rose-50 rounded-2xl p-3 text-xs text-rose-700 flex items-center gap-2"><Tag size={14} className="flex-shrink-0" /> Bu sizin ilanınız. Gelen teklif ve mesajları aşağıda görebilirsiniz.</div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><Eye size={14} className="mx-auto mb-1 text-gray-400" /><p className="text-sm font-bold text-gray-800">{listingViewStats?.totalViews ?? "—"}</p><p className="text-[9px] text-gray-400">Görüntülenme</p></div>
                      <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><Share2 size={14} className="mx-auto mb-1 text-gray-400" /><p className="text-sm font-bold text-gray-800">{selectedListing.shareCount || 0}</p><p className="text-[9px] text-gray-400">Paylaşım</p></div>
                      <div className="bg-white border border-gray-200 rounded-xl p-2.5 text-center"><Heart size={14} className="mx-auto mb-1 text-gray-400" /><p className="text-sm font-bold text-gray-800">{listingFavoriteCount(selectedListing.id)}</p><p className="text-[9px] text-gray-400">Favori</p></div>
                    </div>
                    <div className="mt-3 bg-white border border-gray-200 rounded-2xl p-3"><div className="flex items-center justify-between mb-2"><h4 className="text-xs font-semibold text-gray-500">{t("listingStatus")}</h4><span className={`text-[10px] text-white font-bold px-2 py-1 rounded-full ${listingStatusMeta(selectedListing.status, t).color}`}>{listingStatusMeta(selectedListing.status, t).label}</span></div><div className="flex gap-2">{["active", "reserved", "sold"].map(st => (<button key={st} onClick={() => setListingStatus(selectedListing.id, st)} className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium border transition ${selectedListing.status === st ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-500 border-gray-200"}`}>{listingStatusMeta(st, t).label}</button>))}</div></div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => openSellForm({ brand: selectedListing.brand, model: selectedListing.model, year: selectedListing.year, km: selectedListing.km, price: selectedListing.price, description: selectedListing.description, photo: selectedListing.photo, fuelType: selectedListing.fuelType, transmission: selectedListing.transmission, power: selectedListing.power, firstReg: selectedListing.firstReg, color: selectedListing.color, _vehicleId: selectedListing._vehicleId || null, _editingId: selectedListing.id })} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition flex items-center justify-center gap-2"><Pencil size={14} /> İlanı Düzenle</button>
                      <button onClick={() => setConfirmDialog({ title: "İlanı sil", body: "Bu ilanı silmek istediğinizden emin misiniz? Gelen teklifler ve mesajlar dahil tüm veriler kalıcı olarak silinir.", confirmLabel: "Evet, Sil", danger: true, onConfirm: () => { removeListing(selectedListing.id); setSelectedListingId(null); } })} aria-label="İlanı sil" className="flex-shrink-0 border border-gray-200 text-red-400 hover:text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl transition"><Trash2 size={16} /></button>
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm mt-6 mb-2 flex items-center gap-2"><Banknote size={15} className="text-rose-600" /> Teklifler {activeOffers.length > 0 && <span className="text-gray-300 font-normal">({activeOffers.length})</span>}</h3>
                    {activeOffers.length === 0 ? (
                      <p className="text-center text-gray-400 text-xs py-4">Henüz teklif gelmedi.</p>
                    ) : (
                      <div className="space-y-2 mb-2">{activeOffers.map(o => (
                        <div key={o.id} className="bg-white border border-gray-100 rounded-xl p-3">
                          <div className="flex justify-between items-center mb-1"><span className="text-xs font-medium text-gray-700">{o.from}</span><span className="font-bold text-rose-700 text-sm">{o.amount}{o.currency || "₺"}</span></div>
                          {o.status === "pending" ? (
                            <div className="flex gap-2 mt-2"><button onClick={() => respondOffer(selectedListing.id, o.id, "accepted")} className="flex-1 bg-green-500 text-white text-[11px] py-1.5 rounded-lg font-medium">{t("accept")}</button><button onClick={() => respondOffer(selectedListing.id, o.id, "rejected")} className="flex-1 border border-gray-200 text-gray-500 text-[11px] py-1.5 rounded-lg font-medium">{t("reject")}</button></div>
                          ) : (
                            <p className="text-[11px] text-gray-400 mt-1">{o.status === "accepted" ? "✅ Kabul edildi" : "❌ Reddedildi"}</p>
                          )}
                        </div>
                      ))}</div>
                    )}
                    {selectedListing.messages.length > 0 && (<>
                      <h3 className="font-semibold text-gray-800 text-sm mt-5 mb-2 flex items-center gap-2"><MessageCircle size={15} className="text-rose-500" /> Sorular</h3>
                      <div className="space-y-2">{selectedListing.messages.map(m => (<div key={m.id} className="bg-white border border-gray-200 rounded-xl p-3 text-xs"><span className="font-medium text-gray-700">{m.from}:</span> <span className="text-gray-600">{m.text}</span></div>))}</div>
                    </>)}
                  </>
                );
                const myOffer = myPendingOfferOn(selectedListing);
                const currency = listingCurrency(selectedListing.price);
                const offerLabel = myOffer && !myOffer.seen ? "Teklifini Güncelle" : myOffer ? "Yeni Teklif Ver" : t("makeOffer");
                return (
                  <div className="grid grid-cols-2 gap-2 mt-5">
                    <button onClick={openOfferForm} className="bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition flex items-center justify-center gap-2"><Banknote size={15} /> {offerLabel}</button>
                    {selectedListing.sellerType === "mechanic" ? (
                      <button onClick={() => { const mech = mechanicsList.find(m => m.name === selectedListing.sellerName); if (mech) openChatWithMechanic(mech, `🚗 Bu sohbeti "${selectedListing.brand} ${selectedListing.model}" (İlan #${selectedListing.id}) ilanı hakkında başlattım.`); setSelectedListingId(null); }} className="border border-gray-200 text-gray-700 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition flex items-center justify-center gap-2"><MessageCircle size={15} /> {t("startChat")}</button>
                    ) : (
                      <button onClick={() => { const contextNote = `🚗 Bu sohbeti "${selectedListing.brand} ${selectedListing.model}" (İlan #${selectedListing.id}) ilanı hakkında başlattım.`; if (role === "mechanic") { openMechChatWithOwnerListing(contextNote); } else { openChatWithMechanic({ id: `seller-${selectedListing.sellerName}`, name: selectedListing.sellerName, img: "👤", lang: "tr" }, contextNote); } setSelectedListingId(null); }} className="border border-gray-200 text-gray-700 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition flex items-center justify-center gap-2"><MessageCircle size={15} /> {t("startChat")}</button>
                    )}
                    {myOffer && <p className="col-span-2 text-[11px] text-gray-400 text-center">Mevcut teklifiniz: {myOffer.amount}{currency}{myOffer.seen ? " · satıcı gördü" : " · henüz görülmedi"}</p>}
                    <button onClick={() => openReportForm("listing", `İlan #${selectedListing.id} · ${selectedListing.sellerName}`, `"${selectedListing.brand} ${selectedListing.model}" ilanını bildiriyorum`)} className="col-span-2 flex items-center justify-center gap-1.5 text-[11px] text-gray-400 hover:text-red-500 transition py-1"><Flag size={11} /> Bu ilanı bildir</button>
                  </div>
                );
              })()}
            </div>
          </div>
        </>)}
        {selectedJobId && selectedJob && (() => { const isOwnJob = role === "mechanic" && selectedJob.mechanicName === myProfile?.name; return (<>
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
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${jobEmploymentColor(selectedJob.employmentType)}`}>{selectedJob.employmentType}</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 flex items-center gap-1"><GraduationCap size={12} /> {selectedJob.experienceLevel}</span>
                {(selectedJob.salaryMin || selectedJob.salaryMax) && <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-600 flex items-center gap-1"><Banknote size={12} /> {selectedJob.salaryMin && selectedJob.salaryMax ? `${Number(selectedJob.salaryMin).toLocaleString("tr-TR")} - ${Number(selectedJob.salaryMax).toLocaleString("tr-TR")}₺` : `${Number(selectedJob.salaryMin || selectedJob.salaryMax).toLocaleString("tr-TR")}₺+`}</span>}
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full text-white ${jobStatusMeta(selectedJob.status).color}`}>{jobStatusMeta(selectedJob.status).label}</span>
              </div>
              <h3 className="font-semibold text-gray-800 text-sm mb-2">Pozisyon Açıklaması</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-5">{selectedJob.description || "—"}</p>
              {selectedJob.requirements.length > 0 && (<>
                <h3 className="font-semibold text-gray-800 text-sm mb-2">Aranan Nitelikler</h3>
                <div className="space-y-1.5 mb-5">{selectedJob.requirements.map((r, i) => (<div key={i} className="flex items-start gap-2 text-sm text-gray-600"><CheckCircle2 size={14} className="text-rose-500 flex-shrink-0 mt-0.5" /><span>{r}</span></div>))}</div>
              </>)}
              {selectedJob.skills.length > 0 && (<>
                <h3 className="font-semibold text-gray-800 text-sm mb-2">Beceriler</h3>
                <div className="flex flex-wrap gap-1.5 mb-5">{selectedJob.skills.map((s, i) => (<span key={i} className="text-xs font-medium px-2.5 py-1 rounded-full bg-rose-50 text-rose-600">{s}</span>))}</div>
              </>)}
              <p className="text-[11px] text-gray-400 flex items-center gap-1 mb-5"><Clock size={11} /> {selectedJob.postedDate} yayınlandı</p>
              {isOwnJob ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2"><Users size={15} /> Başvurular ({selectedJob.applicants.length})</h3>
                  <div className="space-y-2">{selectedJob.applicants.map(a => (<div key={a.id} className="bg-white border border-gray-100 rounded-xl p-3"><div className="flex justify-between items-center mb-1"><span className="text-xs font-semibold text-gray-700">{a.name}</span><div className="flex items-center gap-1.5 flex-shrink-0">{a.status === "rejected" && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-500">Reddedildi</span>}<span className="text-[10px] text-gray-400">{a.date}</span></div></div>{(a.phone || a.email || a.address) && (<div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-400 mb-1.5">{a.phone && <span className="flex items-center gap-1"><Phone size={10} /> {a.phone}</span>}{a.email && <span className="flex items-center gap-1"><Mail size={10} /> {a.email}</span>}{a.address && <span className="flex items-center gap-1"><MapPin size={10} /> {a.address}</span>}</div>)}{a.message && <p className="text-xs text-gray-500 mb-1.5">{a.message}</p>}<div className="flex items-center gap-2 flex-wrap">{a.cvUrl ? (<a href={a.cvUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] font-medium text-rose-600 hover:text-rose-700 bg-rose-50 rounded-lg px-2 py-1 max-w-full min-w-0"><FileText size={12} className="flex-shrink-0" /><span className="truncate min-w-0">{a.cvName || "CV"}</span></a>) : (<span className="inline-flex items-center gap-1.5 text-[11px] text-gray-300"><FileText size={12} /> CV eklenmedi</span>)}{a.status !== "rejected" && (<button onClick={() => rejectApplication(selectedJob.id, a.id)} className="text-[11px] font-medium text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-lg px-2 py-1 transition flex-shrink-0">CV Reddet</button>)}</div></div>))}{selectedJob.applicants.length === 0 && <p className="text-center text-gray-400 text-xs py-4">Henüz başvuru yok.</p>}</div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => { openJobForm({ title: selectedJob.title, employmentType: selectedJob.employmentType, experienceLevel: selectedJob.experienceLevel, location: selectedJob.location, salaryMin: selectedJob.salaryMin, salaryMax: selectedJob.salaryMax, description: selectedJob.description, requirements: selectedJob.requirements.join("\n"), skills: selectedJob.skills.join(", "), _editingId: selectedJob.id }); setSelectedJobId(null); }} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-xs font-medium hover:bg-gray-100 transition flex items-center justify-center gap-1"><Pencil size={13} /> Düzenle</button>
                    <button onClick={() => { setJobListingStatus(selectedJob.id, selectedJob.status === "active" ? "closed" : "active"); }} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-xs font-medium hover:bg-gray-100 transition">{selectedJob.status === "active" ? "İlanı Kapat" : "Tekrar Aç"}</button>
                    <button onClick={() => setConfirmDialog({ title: "İlanı sil", body: "Bu iş ilanını silmek istediğinizden emin misiniz? Başvurular dahil tüm veriler kalıcı olarak silinir.", confirmLabel: "Evet, Sil", danger: true, onConfirm: () => { removeJobListing(selectedJob.id); setSelectedJobId(null); } })} aria-label="İlanı sil" className="text-red-400 hover:text-red-600 px-3 py-2.5"><Trash2 size={16} /></button>
                  </div>
                </div>
              ) : role === "mechanic" ? (
                <div className="bg-gray-100 border border-gray-200 rounded-2xl p-4 text-center">
                  <p className="text-sm text-gray-600 mb-3">Bu ilana başvurmak için bir araç sahibi hesabı oluşturmanız gerekiyor.</p>
                  <button onClick={goHome} className="w-full bg-gray-900 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-800 transition">Araç Sahibi Hesabı Oluştur</button>
                </div>
              ) : (
                <button onClick={openJobApplyForm} className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition flex items-center justify-center gap-2"><Briefcase size={15} /> Başvur</button>
              )}
            </div>
          </div>
        </>); })()}
        {screen === "chat" && activeConvo && (
          <div className="max-w-md md:max-w-2xl mx-auto w-full flex flex-col flex-1">
            <div className="bg-white text-gray-900 px-5 pt-6 pb-4 border-b border-gray-200 shadow-sm"><button onClick={() => setScreen("owner")} className="flex items-center gap-1 text-gray-500 mb-3 text-sm hover:text-gray-900 transition"><ChevronLeft size={18} /> {t("back")}</button><div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="text-2xl bg-rose-50 rounded-xl w-11 h-11 flex items-center justify-center">{activeConvo.mechanicImg}</div><h1 className="text-base font-bold text-gray-900">{activeConvo.mechanicName}</h1></div><select value={ownerLang} onChange={(e) => setOwnerLang(e.target.value)} className="bg-gray-100 text-gray-700 text-xs rounded-lg px-2 py-1 border-none outline-none"><option className="text-black" value="tr">🇹🇷 TR</option><option className="text-black" value="en">🇬🇧 EN</option><option className="text-black" value="de">🇩🇪 DE</option></select></div></div>
            <div className="flex-1 px-5 py-4 overflow-y-auto">{activeConvo.messages.map(m => (<ChatBubble key={m.id} msg={m} viewerLang={ownerLang} mine={m.sender === "owner"} />))}</div>
            {activeConvo.messages.length > 0 && activeConvo.messages[activeConvo.messages.length - 1].isRejectionNotice ? (
              <div className="px-5 pb-6 pt-2 border-t border-gray-100"><div className="bg-gray-100 text-gray-500 text-xs text-center py-3 rounded-xl">Bu başvuru reddedildi. Bu görüşmede mesaj gönderemezsiniz.</div></div>
            ) : (<>
              <div className="px-5 pb-2"><button onClick={() => setScreen("booking")} className="w-full mb-3 bg-rose-50 text-rose-600 text-xs font-medium py-2 rounded-xl hover:bg-rose-100 transition flex items-center justify-center gap-1"><Calendar size={14} /> Bu tamirciden randevu al</button></div>
              <div className="px-5 pb-6 pt-2 border-t border-gray-100 flex items-center gap-2"><input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" /><button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition flex-shrink-0"><ImageIcon size={18} /></button><input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendOwnerMessageWithReply(chatInput); }} placeholder="Mesajınızı yazın..." className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200" /><button onClick={() => sendOwnerMessageWithReply(chatInput)} className="w-10 h-10 flex items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700 transition flex-shrink-0"><Send size={16} /></button></div>
            </>)}
          </div>
        )}
        {screen === "booking" && (
          <div className="max-w-md md:max-w-2xl mx-auto w-full flex flex-col flex-1">
            <div className="bg-white text-gray-900 px-5 pt-6 pb-5 border-b border-gray-200 shadow-sm"><button onClick={() => setScreen(selectedMechanic ? "detail" : "owner")} className="flex items-center gap-1 text-gray-500 mb-3 text-sm hover:text-gray-900 transition"><ChevronLeft size={18} /> {t("back")}</button><h1 className="text-lg font-bold text-gray-900">Randevu Oluştur</h1></div>
            <div className="flex-1 px-5 md:px-8 py-4 md:grid md:grid-cols-2 md:gap-8">
              <div>
              <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2"><Car size={16} /> Araç Seç</h3>
              {vehicles.length === 0 && !showAddVehicle ? (
                <div className="bg-gray-100 rounded-xl p-3 mb-3 text-xs text-gray-700">Henüz kayıtlı bir aracınız yok. Aşağıdan yeni bir araç ekleyerek randevu oluşturabilirsiniz.</div>
              ) : vehicles.length > 0 ? (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                  {vehicles.map(v => { const isSel = selectedBookingVehicleId === v.id; return (<button key={v.id} onClick={() => setSelectedBookingVehicleId(v.id)} className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition ${isSel ? "bg-rose-600 border-rose-600 text-white" : "border-gray-200 text-gray-600 hover:border-rose-300"}`}><Car size={14} className="flex-shrink-0" /><div><p className="text-xs font-semibold leading-tight whitespace-nowrap">{v.brand} {v.model}</p><p className={`text-[10px] leading-tight ${isSel ? "text-rose-100" : "text-gray-400"}`}>{v.plate}</p></div></button>); })}
                  <button onClick={() => setShowAddVehicle(!showAddVehicle)} className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed text-xs font-medium transition ${showAddVehicle ? "bg-rose-50 border-rose-300 text-rose-600" : "border-gray-300 text-gray-500 hover:border-rose-300 hover:text-rose-600"}`}><Plus size={14} /> Araç Ekle</button>
                </div>
              ) : null}
              {(vehicles.length === 0 || showAddVehicle) && (
                <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3 space-y-2">
                  <input value={newVehicle.brand} onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })} placeholder="Marka" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                  <input value={newVehicle.model} onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })} placeholder="Model" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                  <div className="flex gap-2"><input value={newVehicle.year} onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })} placeholder="Yıl" className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={newVehicle.plate} onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value })} placeholder="Plaka" className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                  <button onClick={addVehicle} className="w-full bg-rose-600 text-white py-3 rounded-2xl text-sm font-semibold hover:bg-rose-700 transition">Ekle ve Seç</button>
                </div>
              )}
              <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2 mt-3"><Calendar size={16} /> Tarih Seç</h3>
              <div className="flex gap-2 mb-5 overflow-x-auto pb-1">{nextDays.map((d, i) => { const isSel = selectedDate?.toDateString() === d.toDateString(); const open = isDayOpenForMechanic(selectedMechanic, d); return (<button key={i} disabled={!open} onClick={() => setSelectedDate(d)} className={`flex-shrink-0 w-14 py-2 rounded-xl border text-center transition ${!open ? "opacity-30 cursor-not-allowed" : isSel ? "bg-rose-600 border-rose-600 text-white" : "border-gray-200 text-gray-600 hover:border-rose-300"}`}><p className="text-[10px]">{d.toLocaleDateString("tr-TR", { weekday: "short" })}</p><p className="text-sm font-bold">{d.getDate()}</p></button>); })}</div>
              <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2"><Clock size={16} /> Saat Seç</h3>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-5">{selectedDate ? slotsForDate(selectedMechanic, selectedDate).map(tm => (<button key={tm} onClick={() => setSelectedTime(tm)} className={`py-2 rounded-xl border text-sm font-medium transition ${selectedTime === tm ? "bg-rose-600 border-rose-600 text-white" : "border-gray-200 text-gray-600 hover:border-rose-300"}`}>{tm}</button>)) : <p className="col-span-3 md:col-span-4 text-xs text-gray-400 text-center py-4">Önce tarih seçin</p>}{selectedDate && slotsForDate(selectedMechanic, selectedDate).length === 0 && <p className="col-span-3 md:col-span-4 text-xs text-gray-400 text-center py-4">Bu gün kapalı</p>}</div>
              <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2"><ToolIcon size={16} /> Hizmet Seçin</h3>
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={bookingServiceSearch} onChange={(e) => setBookingServiceSearch(e.target.value)} placeholder="Hizmet ara (ör. yağ değişimi, lastik...)" className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              </div>
              <div className="flex flex-col gap-2 mb-5 max-h-64 overflow-y-auto pr-0.5">
                {bookingServiceOptions.length === 0 && (<p className="text-xs text-gray-400 text-center py-3">"{bookingServiceSearch}" ile eşleşen hizmet bulunamadı.</p>)}
                {bookingServiceOptions.map((s, i) => {
                  const isSel = bookingService && !bookingService.other && bookingService.name === s.name;
                  return (
                    <button key={i} onClick={() => setBookingService({ name: s.name, price: s.price, other: false, fixed: s.fixed })} className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left transition ${isSel ? "bg-rose-600 border-rose-600 text-white" : "border-gray-200 text-gray-600 hover:border-rose-300"}`}>
                      <span className="text-xs font-medium flex items-center gap-1.5 min-w-0"><ToolIcon size={12} className={`flex-shrink-0 ${isSel ? "text-white" : "text-rose-400"}`} /><span className="truncate">{s.name}{s.fromCatalog && <span className={`block text-[9px] font-normal ${isSel ? "text-rose-100" : "text-gray-400"}`}>Genel sabit fiyat listesi</span>}</span></span>
                      <span className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${isSel ? "bg-white/20 text-white" : s.fixed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{s.fixed ? "Sabit Fiyat" : "Fiyat Değişken"}</span>
                        {String(s.price || "").trim() && <span className="text-xs font-bold whitespace-nowrap">{s.price}</span>}
                      </span>
                    </button>
                  );
                })}
                <button onClick={() => setBookingService({ name: "Diğer / Listede Yok", price: null, other: true, fixed: false })} className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left transition ${bookingService?.other ? "bg-rose-600 border-rose-600 text-white" : "border-gray-200 text-gray-600 hover:border-rose-300"}`}>
                  <span className="text-xs font-medium">Diğer / Listede Yok</span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${bookingService?.other ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"}`}>Tamirden sonra belirlenir</span>
                </button>
              </div>
              <h3 className="font-semibold text-gray-800 text-sm mb-2">Arıza Açıklaması (opsiyonel)</h3>
              <textarea value={problemDesc} onChange={(e) => setProblemDesc(e.target.value)} placeholder="Aracınızdaki sorunu kısaca açıklayın..." className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none" rows={3} />
              <div className="flex items-center gap-2 flex-wrap mb-1 md:mb-0">
                <input ref={problemPhotoRef} type="file" accept="image/*" onChange={addProblemPhoto} className="hidden" />
                {problemPhotos.map((src, i) => (
                  <div key={i} className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                    <img src={src} alt="Araç fotoğrafı" className="w-full h-full object-cover" />
                    <button onClick={() => removeProblemPhoto(i)} aria-label="Fotoğrafı kaldır" className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center"><X size={10} className="text-white" /></button>
                  </div>
                ))}
                <button onClick={() => problemPhotoRef.current?.click()} className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-rose-300 hover:text-rose-500 transition flex-shrink-0"><Camera size={16} /><span className="text-[9px] mt-0.5">Ekle</span></button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">Arızayı fotoğraflarsanız tamirci önceden hazırlıklı gelir.</p>
              <label className="flex items-start gap-2.5 mt-3 bg-gray-50 rounded-xl p-3 cursor-pointer">
                <input type="checkbox" checked={shareHistoryConsent} onChange={(e) => setShareHistoryConsent(e.target.checked)} className="mt-0.5 w-4 h-4 accent-rose-600 flex-shrink-0" />
                <span className="text-xs text-gray-600"><span className="font-medium text-gray-800">Bu tamircinin geçmiş randevularımı görmesine izin veriyorum.</span> Bu sayede tamirci geçmiş bakımlarınızı görüp daha hızlı yardımcı olabilir. İstediğiniz zaman kapatabilirsiniz.</span>
              </label>
              </div>
              <div>
              <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2 mt-1 md:mt-0"><Banknote size={16} /> Ödeme</h3>
              {!bookingService ? (
                <div className="bg-gray-100 rounded-2xl p-4 mb-3 text-xs text-gray-700">Ödeme seçeneklerini görmek için önce yukarıdan bir hizmet seçin.</div>
              ) : bookingService.other || !bookingService.fixed ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
                  <div className="flex justify-between items-center mb-2"><span className="text-xs text-gray-500">Hizmet</span><span className="text-sm font-semibold text-gray-800 text-right">{bookingService.name}</span></div>
                  <p className="text-xs text-gray-500 leading-relaxed bg-white rounded-xl p-3 border border-gray-200">🏪 Bu hizmetin sabit bir ücreti yok. Fiyat, tamirci aracınızı incelendikten sonra belirlenecek ve ödeme <b>tamir sonrasında yerinde</b> yapılacaktır.</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
                  <div className="flex justify-between items-center mb-3"><span className="text-xs text-gray-500">{bookingService.name}</span><span className="text-lg font-bold text-gray-800">{bookingService.price}</span></div>
                  <div className="flex gap-2 mb-3">
                    <button onClick={() => setPaymentForm(f => ({ ...f, method: "card" }))} className={`flex-1 py-2 rounded-xl text-xs font-medium border transition ${paymentForm.method === "card" ? "bg-rose-600 border-rose-600 text-white" : "border-gray-200 text-gray-600"}`}>💳 Şimdi Öde</button>
                    <button onClick={() => setPaymentForm(f => ({ ...f, method: "onsite" }))} className={`flex-1 py-2 rounded-xl text-xs font-medium border transition ${paymentForm.method === "onsite" ? "bg-rose-600 border-rose-600 text-white" : "border-gray-200 text-gray-600"}`}>🏪 Yerinde Öde</button>
                  </div>
                  {paymentForm.method === "card" && (
                    <div className="space-y-2">
                      <input value={paymentForm.cardNumber} onChange={(e) => setPaymentForm(f => ({ ...f, cardNumber: e.target.value }))} placeholder="Kart Numarası" maxLength={19} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                      <div className="flex gap-2"><input value={paymentForm.expiry} onChange={(e) => setPaymentForm(f => ({ ...f, expiry: e.target.value }))} placeholder="AA/YY" className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={paymentForm.cvc} onChange={(e) => setPaymentForm(f => ({ ...f, cvc: e.target.value }))} placeholder="CVC" className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-3 flex items-start gap-1"><Lock size={11} className="flex-shrink-0 mt-0.5" /> Bu bir demo ödeme adımıdır, gerçek bir tahsilat yapılmaz.</p>
                </div>
              )}
              {bookingService?.fixed && !bookingService.other && parsePriceNumber(bookingService.price) > EXPENSIVE_SERVICE_THRESHOLD && (
                <label className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3 mt-3 cursor-pointer">
                  <input type="checkbox" checked={approveExpensiveService} onChange={(e) => setApproveExpensiveService(e.target.checked)} className="mt-0.5 w-4 h-4 accent-rose-600 flex-shrink-0" />
                  <span className="text-xs text-gray-700">Bu hizmetin <strong>{bookingService.price}</strong> tutarında olduğunu okudum ve onaylıyorum.</span>
                </label>
              )}
              <button disabled={!selectedDate || !selectedTime || !bookingService || (vehicles.length > 0 && !selectedBookingVehicleId) || (bookingService?.fixed && !bookingService.other && paymentForm.method === "card" && paymentForm.cardNumber.trim().length < 12) || (bookingService?.fixed && !bookingService.other && parsePriceNumber(bookingService.price) > EXPENSIVE_SERVICE_THRESHOLD && !approveExpensiveService)} onClick={confirmBooking} className={`w-full py-3 rounded-2xl font-semibold text-sm transition mt-3 ${selectedDate && selectedTime && bookingService && (vehicles.length === 0 || selectedBookingVehicleId) && (!bookingService.fixed || bookingService.other || paymentForm.method === "onsite" || paymentForm.cardNumber.trim().length >= 12) && (!bookingService?.fixed || bookingService.other || parsePriceNumber(bookingService.price) <= EXPENSIVE_SERVICE_THRESHOLD || approveExpensiveService) ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>Randevuyu Onayla</button>
              </div>
            </div>
          </div>
        )}
        {screen === "confirmed" && (<div className="max-w-md mx-auto w-full flex-1 px-5 py-10 flex flex-col items-center text-center"><div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4"><Check size={40} className="text-green-500" /></div><h2 className="text-lg font-bold text-gray-800 mb-1">{autoAccept ? "Randevunuz Onaylandı!" : "Randevu Talebiniz Gönderildi!"}</h2><button onClick={() => { setScreen("owner"); setOwnerTab("appointments"); }} className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition mb-2 mt-4">Randevumu Görüntüle</button><button onClick={goHome} className="w-full border border-gray-200 text-gray-500 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition">Ana Sayfaya Dön</button></div>)}
        {screen === "mechBrowse" && (
          <>
            <div className="bg-gradient-to-b from-rose-50 to-white text-gray-900 px-5 md:px-8 pt-6 pb-5 border-b border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3 max-w-7xl mx-auto w-full relative md:hidden">
                <span className="text-xs text-gray-500">Merhaba{form.name ? `, ${form.name}` : ""} 🔧</span>
                <button onClick={() => setScreen("mechanicDashboard")} className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1"><ChevronLeft size={14}/> Panele Dön</button>
              </div>
              <div className="hidden md:flex items-center justify-between max-w-7xl mx-auto w-full relative mb-5">
                <div className="flex items-center gap-2 flex-shrink-0"><div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center"><Wrench size={16} className="text-white" /></div><span className="text-lg font-extrabold text-gray-900">Fix<span className="text-rose-600">perto</span></span></div>
                <div className="flex items-center gap-8">
                  {[{ key: "mechanics", label: t("findMechanic"), icon: Wrench }, { key: "cars", label: t("findCar"), icon: Car }, { key: "jobs", label: "İş İlanları", icon: Briefcase }].map(tab => {
                    const Icon = tab.icon; const active = ownerMode === tab.key;
                    return (<button key={tab.key} onClick={() => { setOwnerMode(tab.key); setQuery(""); }} className="relative flex items-center gap-1.5 pb-3 pt-1"><Icon size={16} className={active ? "text-gray-900" : "text-gray-400"} /><span className={`text-sm font-extrabold tracking-tight ${active ? "text-gray-900" : "text-gray-500"}`}>{tab.label}</span>{active && <span className="absolute -bottom-[1px] left-0 right-0 h-0.5 bg-gray-900 rounded-full" />}</button>);
                  })}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button onClick={() => setScreen("mechanicDashboard")} className="text-sm font-semibold text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-full transition whitespace-nowrap">Panele Dön</button>
                  <button onClick={() => { setScreen("mechProfilePage"); setMechProfileTab("profile"); }} title="Profil ve Ayarlar" className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden text-lg">{myProfile?.img || "🔧"}</button>
                </div>
              </div>
              <div className="max-w-7xl mx-auto w-full relative">
                <div className={`transition-all duration-300 ease-out overflow-hidden ${heroCollapsed ? "max-h-0 opacity-0 -translate-y-3 mb-0 pointer-events-none" : "max-h-56 opacity-100 translate-y-0 mb-4"}`}>
                  <div className="flex items-center justify-center md:hidden mb-4">
                    <div className="inline-flex items-center gap-0.5 bg-gray-100 rounded-full p-1">
                      <button onClick={() => { setOwnerMode("mechanics"); setQuery(""); }} className={`px-3.5 py-2 rounded-full text-xs font-extrabold tracking-tight transition flex items-center gap-1.5 ${ownerMode === "mechanics" ? "bg-white text-rose-600 shadow-sm" : "text-gray-500"}`}><Wrench size={13} /> {t("findMechanic")}</button>
                      <button onClick={() => { setOwnerMode("cars"); setQuery(""); }} className={`px-3.5 py-2 rounded-full text-xs font-extrabold tracking-tight transition flex items-center gap-1.5 ${ownerMode === "cars" ? "bg-white text-rose-600 shadow-sm" : "text-gray-500"}`}><Car size={13} /> {t("findCar")}</button>
                      <button onClick={() => { setOwnerMode("jobs"); setQuery(""); }} className={`px-3.5 py-2 rounded-full text-xs font-extrabold tracking-tight transition flex items-center gap-1.5 ${ownerMode === "jobs" ? "bg-white text-rose-600 shadow-sm" : "text-gray-500"}`}><Briefcase size={13} /> İş İlanları</button>
                    </div>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-0 leading-snug text-gray-900 text-center">{ownerMode === "mechanics" ? "Diğer tamircileri keşfet" : ownerMode === "cars" ? t("carMarket") : "İş İlanları"}</h1>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center gap-2 p-2 pl-2.5 md:hidden">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">{ownerMode === "cars" ? <Car size={18} className="text-rose-700" /> : ownerMode === "jobs" ? <Briefcase size={18} className="text-rose-700" /> : <Wrench size={18} className="text-rose-700" />}</div>
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ownerMode === "mechanics" ? t("searchPlaceholder") : ownerMode === "cars" ? "Marka veya model ara..." : "Pozisyon veya beceri ara..."} className="flex-1 px-1 py-2 text-gray-800 text-sm focus:outline-none bg-transparent min-w-0" />
                  <button onClick={(e) => e.currentTarget.blur()} className="flex-shrink-0 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition">Ara</button>
                </div>
                <div className="hidden md:flex items-stretch bg-white rounded-full border border-gray-300 shadow-lg divide-x divide-gray-200 max-w-xl mx-auto overflow-hidden">
                  <div className="flex-1 px-6 py-2.5"><label className="block text-[11px] font-bold text-gray-900">{ownerMode === "mechanics" ? "Ne arıyorsun?" : ownerMode === "cars" ? "Marka / Model" : "Pozisyon"}</label><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ownerMode === "mechanics" ? t("searchPlaceholder") : ownerMode === "cars" ? "Marka veya model ara..." : "Pozisyon veya beceri ara..."} className="w-full text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none bg-transparent" /></div>
                  <div className="flex-1 px-6 py-2.5"><label className="block text-[11px] font-bold text-gray-900">Konum</label><input value={locationQuery} onChange={(e) => setLocationQuery(e.target.value)} placeholder="Şehir veya semt" className="w-full text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none bg-transparent" /></div>
                  <div className="flex items-center pr-2 pl-1"><button onClick={(e) => e.currentTarget.blur()} aria-label="Ara" className="w-11 h-11 rounded-full bg-rose-600 hover:bg-rose-700 transition flex items-center justify-center flex-shrink-0"><Search size={17} className="text-white" /></button></div>
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
                <span className="text-xs text-gray-500">Merhaba{form.name ? `, ${form.name}` : ""} 🔧</span>
                <div className="flex items-center gap-2.5">
                  <NotifBell />
                  <button onClick={() => setScreen("mechBrowse")} title="Tamirci / Araç Ara" className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition"><Search size={15} /></button>
                  <button onClick={() => { setScreen("mechProfilePage"); setMechProfileTab("profile"); }} title="Profil ve Ayarlar" className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden text-sm hover:bg-gray-100 transition">{myProfile?.img || "🔧"}</button>
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-1 text-gray-900">Tamirci Paneli</h1>
              <div className="grid grid-cols-5 gap-1 bg-gray-100 rounded-xl p-1 mt-3">
                <button onClick={() => setMechTab("requests")} className={`py-1.5 rounded-lg text-[9px] font-medium transition ${mechTab === "requests" ? "bg-white text-rose-700 shadow-sm" : "text-gray-500"}`}>Randevu</button>
                <button onClick={() => setMechTab("messages")} className={`py-1.5 rounded-lg text-[9px] font-medium transition ${mechTab === "messages" ? "bg-white text-rose-700 shadow-sm" : "text-gray-500"}`}>Mesaj</button>
                <button onClick={() => setMechTab("market")} className={`py-1.5 rounded-lg text-[9px] font-medium transition ${mechTab === "market" ? "bg-white text-rose-700 shadow-sm" : "text-gray-500"}`}>{t("navMarket")}</button>
                <button onClick={() => setMechTab("favorites")} className={`py-1.5 rounded-lg text-[9px] font-medium transition flex items-center justify-center gap-0.5 ${mechTab === "favorites" ? "bg-white text-rose-700 shadow-sm" : "text-gray-500"}`}><Heart size={10} /> Favoriler</button>
                <button onClick={() => setMechTab("analytics")} className={`py-1.5 rounded-lg text-[9px] font-medium transition flex items-center justify-center gap-0.5 ${mechTab === "analytics" ? "bg-white text-rose-700 shadow-sm" : "text-gray-500"}`}><TrendingUp size={10} /> Analiz</button>
              </div>
            </div>
            {mechTab === "requests" && (
              <div className="flex-1 px-5 py-4">
                <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
                  <button onClick={() => setMechReqView("active")} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${mechReqView === "active" ? "bg-white shadow-sm text-rose-700" : "text-gray-400"}`}>Aktif ({activeAppts.length})</button>
                  <button onClick={() => setMechReqView("quotes")} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${mechReqView === "quotes" ? "bg-white shadow-sm text-rose-700" : "text-gray-400"}`}><ClipboardList size={12} /> Teklifler {quoteOffers.filter(o => o.mechanicId === MY_MECHANIC_ID && o.status === "pending").length > 0 && (<span className="w-1.5 h-1.5 rounded-full bg-rose-600" />)}</button>
                  <button onClick={() => setMechReqView("history")} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${mechReqView === "history" ? "bg-white shadow-sm text-rose-700" : "text-gray-400"}`}><Calendar size={12} /> Geçmiş</button>
                </div>
                {mechReqView === "active" && (<>
                  <div className="grid grid-cols-3 gap-2 mb-5 text-center">
                    <div className="bg-gray-100 rounded-xl p-2"><p className="text-sm font-bold text-gray-700">{appointments.filter(a=>a.status==="Onay Bekliyor").length}</p><p className="text-[9px] text-gray-500">Bekliyor</p></div>
                    <div className="bg-gray-100 rounded-xl p-2"><p className="text-sm font-bold text-gray-700">{appointments.filter(a=>a.status==="Sırada").length}</p><p className="text-[9px] text-gray-500">Sırada</p></div>
                    <div className="bg-rose-50 rounded-xl p-2"><p className="text-sm font-bold text-rose-600">{appointments.filter(a=>a.status==="Tamire Alındı").length}</p><p className="text-[9px] text-gray-500">Tamirde</p></div>
                  </div>
                  <div className="space-y-3">
                    {activeAppts.map(r => (
                      <div key={r.id} className="border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-2"><div><div className="flex items-center gap-1.5"><h4 className="font-semibold text-gray-800 text-sm">{r.customer}</h4>{customerNoShowCount(r.customer) > 0 && (<span title={`Geçmişte ${customerNoShowCount(r.customer)} kez gelmedi`} className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold"><AlertTriangle size={9} /> {customerNoShowCount(r.customer)}x gelmedi</span>)}</div><p className="text-xs text-gray-400">{r.vehicle}</p></div><span className={`text-[10px] px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusColor(r.status)}`}>{r.status}</span></div>
                        <p className="text-xs text-gray-500 mb-3">{r.issue}</p>
                        {r.issuePhotos && r.issuePhotos.length > 0 && (<div className="flex gap-1.5 mb-3">{r.issuePhotos.map((src, i) => (<img key={i} src={src} alt={`Sorun fotoğrafı ${i + 1}`} className="w-12 h-12 rounded-lg object-cover border border-gray-100" />))}</div>)}
                        <div className="flex items-center justify-between gap-3 text-xs text-gray-400 mb-3"><div className="flex items-center gap-3"><span className="flex items-center gap-1"><Calendar size={12} />{r.date}</span><span className="flex items-center gap-1"><Clock size={12} />{r.time}</span></div><button onClick={() => openReportForm("customer", `Randevu #${r.id} · ${r.customer}`, `"${r.customer}" müşterisini bildiriyorum`)} className="flex items-center gap-1 text-gray-300 hover:text-red-500 transition"><Flag size={11} /> Şikayet Et</button></div>
                        {r.historyShareConsent === false ? (<p className="flex items-center gap-1 text-[11px] text-gray-300 mb-3"><Lock size={11} /> Müşteri geçmiş randevu paylaşımına izin vermedi</p>) : (() => { const past = appointments.filter(a => a.customer === r.customer && a.id !== r.id && ["Tamir Tamamlandı", "İptal Edildi", "Reddedildi", "Gelmedi"].includes(a.status) && a.historyShareConsent !== false && isSameMechanicAppt(a)); if (past.length === 0) return null; const isOpen = expandedCustomerHistory === r.id; return (
                          <div className="mb-3">
                            <button onClick={() => setExpandedCustomerHistory(isOpen ? null : r.id)} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-rose-600 transition"><History size={11} /> {past.length} geçmiş randevu {isOpen ? "gizle" : "gör"} <ChevronRight size={11} className={`transition-transform ${isOpen ? "rotate-90" : ""}`} /></button>
                            {isOpen && (<div className="mt-2 space-y-1.5 bg-gray-50 rounded-xl p-2.5">{past.map(p => (<div key={p.id} className="flex items-center justify-between text-[11px]"><span className="text-gray-500 truncate">{p.date} · {p.issue}</span><span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${statusColor(p.status)}`}>{p.status}</span></div>))}</div>)}
                          </div>
                        ); })()}
                        {r.status === "Onay Bekliyor" && (<div className="flex gap-2"><button onClick={() => acceptAppt(r.id)} className="flex-1 bg-rose-600 text-white text-xs py-2 rounded-xl font-medium hover:bg-rose-700 transition flex items-center justify-center gap-1"><ThumbsUp size={12} /> Kabul Et</button><button onClick={() => rejectAppt(r.id)} className="flex-1 border border-gray-200 text-gray-500 text-xs py-2 rounded-xl font-medium hover:bg-gray-50 transition flex items-center justify-center gap-1"><ThumbsDown size={12} /> Reddet</button></div>)}
                        {(r.status === "Sırada" || r.status === "Tamire Alındı") && (<div className="flex gap-2"><button onClick={() => r.status === "Tamire Alındı" ? setCompletingApptId(r.id) : advanceStatus(r.id)} className="flex-1 bg-rose-600 text-white text-xs py-2 rounded-xl font-medium hover:bg-rose-700 transition">{r.status === "Sırada" ? "Tamire Al" : "Tamamlandı (SMS gönderilir)"}</button>{r.status === "Sırada" && (<button onClick={() => markNoShow(r.id)} className="border border-gray-200 text-gray-500 text-xs py-2 px-3 rounded-xl font-medium hover:bg-gray-50 transition whitespace-nowrap">Gelmedi</button>)}</div>)}
                      </div>
                    ))}
                    {activeAppts.length === 0 && <p className="text-center text-gray-400 text-sm py-10">🎉 Bekleyen işiniz yok, harika!</p>}
                  </div>
                </>)}
                {mechReqView === "quotes" && (
                  <div className="space-y-3">
                    {quoteOffers.filter(o => o.mechanicId === MY_MECHANIC_ID).length === 0 && <p className="text-center text-gray-400 text-sm py-10">Henüz size gelen teklif isteği yok</p>}
                    {quoteOffers.filter(o => o.mechanicId === MY_MECHANIC_ID).map(o => {
                      const req = quoteRequests.find(r => r.id === o.requestId);
                      if (!req) return null;
                      const responding = respondingQuoteOfferId === o.id;
                      return (
                        <div key={o.id} className="border border-gray-100 rounded-2xl p-4 shadow-sm">
                          <div className="flex justify-between items-start mb-2"><div><h4 className="font-semibold text-gray-800 text-sm">{req.customer}</h4><p className="text-xs text-gray-400">{req.vehicle}</p></div><span className={`text-[10px] px-2 py-1 rounded-full font-medium whitespace-nowrap ${o.status === "pending" ? "bg-amber-50 text-amber-600" : o.status === "submitted" ? "bg-rose-50 text-rose-600" : o.status === "accepted" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}>{o.status === "pending" ? "Yanıt bekliyor" : o.status === "submitted" ? "Teklif gönderildi" : o.status === "accepted" ? "Kabul edildi 🎉" : "Kaybedildi"}</span></div>
                          <p className="text-xs text-gray-500 mb-3">{req.issue}</p>
                          {req.photos && req.photos.length > 0 && (<div className="flex gap-1.5 mb-3">{req.photos.map((src, i) => (<img key={i} src={src} alt={`Sorun fotoğrafı ${i + 1}`} className="w-12 h-12 rounded-lg object-cover border border-gray-100" />))}</div>)}
                          {o.status === "pending" && !responding && (<button onClick={() => { setRespondingQuoteOfferId(o.id); setQuoteOfferForm({ price: "", etaDays: "", note: "" }); }} className="w-full bg-rose-600 text-white text-xs py-2 rounded-xl font-medium hover:bg-rose-700 transition">Teklif Ver</button>)}
                          {o.status === "pending" && responding && (
                            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                              <div className="flex gap-2">
                                <div className="flex-1"><label className="text-[9px] text-gray-400 block mb-0.5">Fiyat (₺)</label><input type="number" min="0" value={quoteOfferForm.price} onChange={(e) => setQuoteOfferForm(f => ({ ...f, price: e.target.value }))} placeholder="Örn. 450" className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white" /></div>
                                <div className="w-24"><label className="text-[9px] text-gray-400 block mb-0.5">Süre (gün)</label><input type="number" min="0" value={quoteOfferForm.etaDays} onChange={(e) => setQuoteOfferForm(f => ({ ...f, etaDays: e.target.value }))} placeholder="1" className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white" /></div>
                              </div>
                              <textarea value={quoteOfferForm.note} onChange={(e) => setQuoteOfferForm(f => ({ ...f, note: e.target.value }))} rows={2} placeholder="Not (opsiyonel)" className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white resize-none" />
                              <div className="flex gap-2"><button onClick={() => setRespondingQuoteOfferId(null)} className="flex-1 border border-gray-200 text-gray-500 text-[11px] py-1.5 rounded-lg font-medium">Vazgeç</button><button disabled={!parsePriceNumber(quoteOfferForm.price)} onClick={() => submitQuoteOffer(o.id)} className={`flex-1 text-[11px] py-1.5 rounded-lg font-medium ${parsePriceNumber(quoteOfferForm.price) ? "bg-rose-600 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>Teklifi Gönder</button></div>
                            </div>
                          )}
                          {o.status === "submitted" && (<div className="bg-rose-50 rounded-xl p-3 flex items-center justify-between"><span className="text-xs text-gray-600">Teklifiniz: <strong className="text-rose-600">{o.price}₺</strong>{o.etaDays ? ` · ${o.etaDays} gün` : ""}</span><span className="text-[10px] text-gray-400">Yanıt bekleniyor...</span></div>)}
                          {o.status === "accepted" && (<p className="text-[11px] text-green-600 flex items-center gap-1"><CheckCircle2 size={12} /> Müşteri teklifinizi kabul etti, randevu oluşturulacak.</p>)}
                          {o.status === "lost" && (<p className="text-[11px] text-gray-400">Müşteri başka bir tamirciyi tercih etti.</p>)}
                        </div>
                      );
                    })}
                  </div>
                )}
                {mechReqView === "history" && (
                  <div className="space-y-2">
                    {historyByDate.length === 0 && <p className="text-center text-gray-400 text-sm py-10">Henüz geçmiş kayıt yok</p>}
                    {historyByDate.map(([date, items]) => {
                      const isOpen = historyExpandedDate === date;
                      const completedCount = items.filter(i => i.status === "Tamir Tamamlandı").length;
                      return (
                        <div key={date} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                          <button onClick={() => setHistoryExpandedDate(isOpen ? null : date)} className="w-full flex items-center justify-between p-3">
                            <div className="flex items-center gap-2"><div className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center"><Calendar size={15} className="text-gray-400" /></div><div className="text-left"><p className="text-sm font-semibold text-gray-700">{date}</p><p className="text-[10px] text-gray-400">{completedCount} tamamlanan · {items.length} kayıt</p></div></div>
                            <ChevronRight size={14} className={`text-gray-300 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                          </button>
                          {isOpen && (<div className="px-3 pb-3 border-t border-gray-50 pt-2 space-y-2">{items.map(r => (<div key={r.id} className="bg-white border border-gray-200 rounded-xl p-3"><div className="flex justify-between items-start mb-1"><h4 className="text-xs font-semibold text-gray-700">{r.customer}</h4><span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${statusColor(r.status)}`}>{r.status}</span></div><p className="text-[11px] text-gray-400">{r.vehicle}</p><p className="text-[11px] text-gray-500 mt-1">{r.issue}</p><div className="flex items-center justify-between mt-1"><p className="text-[10px] text-gray-300 flex items-center gap-1"><Clock size={10} />{r.time}</p>{r.status === "Tamir Tamamlandı" && (<button onClick={() => downloadAppointmentReceipt(r)} className="text-[10px] text-rose-600 font-medium flex items-center gap-0.5 hover:underline"><FileText size={10} /> Fiş İndir</button>)}</div></div>))}</div>)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {mechTab === "messages" && !mechConvo && (<div className="flex-1 px-5 py-4 space-y-3">{conversations.map(c => { const last = c.messages[c.messages.length - 1]; return (<button key={c.id} onClick={() => setMechActiveConvoId(c.id)} className="w-full text-left bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-rose-300 transition flex items-center gap-3"><div className="w-11 h-11 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0"><User size={20} className="text-rose-600" /></div><div className="flex-1 min-w-0"><h4 className="font-semibold text-gray-800 text-sm">Araç Sahibi</h4><p className="text-xs text-gray-400 truncate">{last ? last.text : "Henüz mesaj yok"}</p></div><ChevronRight size={16} className="text-gray-300" /></button>); })}{conversations.length === 0 && <p className="text-center text-gray-400 text-sm py-10">Henüz mesaj yok</p>}</div>)}
            {mechTab === "messages" && mechConvo && (<><div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2"><button onClick={() => setMechActiveConvoId(null)} className="text-gray-400"><ChevronLeft size={18} /></button><span className="text-sm font-semibold text-gray-800">Araç Sahibi Sohbeti</span></div><div className="flex-1 px-5 py-4 overflow-y-auto">{mechConvo.messages.map(m => (<ChatBubble key={m.id} msg={m} viewerLang={myProfile.lang || "tr"} mine={m.sender === "mechanic"} />))}</div><div className="px-5 pb-6 pt-2 border-t border-gray-100 flex items-center gap-2"><input value={mechChatInput} onChange={(e) => setMechChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendMechMessage(mechChatInput); }} placeholder="Yanıt yazın..." className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" /><button onClick={() => sendMechMessage(mechChatInput)} className="w-10 h-10 flex items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700 transition flex-shrink-0"><Send size={16} /></button></div></>)}
            {mechTab === "market" && (
              <div className="flex-1 px-5 py-4 overflow-y-auto">
                <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
                  <button onClick={() => setMechListingsSubTab("cars")} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${mechListingsSubTab === "cars" ? "bg-white shadow-sm text-rose-700" : "text-gray-400"}`}><Car size={13} /> Araç İlanlarım</button>
                  <button onClick={() => setMechListingsSubTab("jobs")} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${mechListingsSubTab === "jobs" ? "bg-white shadow-sm text-rose-700" : "text-gray-400"}`}><Briefcase size={13} /> İş İlanlarım</button>
                </div>
                {mechListingsSubTab === "cars" && (<>
                  <p className="text-xs text-gray-400 mb-3">{t("myListingsSub")}</p>
                  <button onClick={() => openSellForm(null)} className="w-full mb-4 bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition flex items-center justify-center gap-2"><Plus size={16} /> {t("sellMyCar")}</button>
                  {listings.filter(l => l.sellerName === myProfile?.name).length === 0 ? (<div className="text-center py-16"><Tag size={40} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-400 text-sm">{t("noOwnListings")}</p></div>) : (<div className="grid grid-cols-1 gap-3">{listings.filter(l => l.sellerName === myProfile?.name).map(l => (<ListingCard key={l.id} l={l} />))}</div>)}
                </>)}
                {mechListingsSubTab === "jobs" && (<>
                  <p className="text-xs text-gray-400 mb-3">Çalışan aramak için iş ilanı verin, başvuruları burada takip edin.</p>
                  <button onClick={() => openJobForm(null)} className="w-full mb-4 bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition flex items-center justify-center gap-2"><Plus size={16} /> Yeni İş İlanı Ver</button>
                  {jobListings.filter(j => j.mechanicName === myProfile?.name).length === 0 ? (<div className="text-center py-16"><Briefcase size={40} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-400 text-sm">Henüz bir iş ilanınız yok.</p></div>) : (<div className="space-y-3">{jobListings.filter(j => j.mechanicName === myProfile?.name).map(j => (<JobCard key={j.id} j={j} />))}</div>)}
                </>)}
              </div>
            )}
            {mechTab === "favorites" && (
              <div className="flex-1 px-5 py-4 overflow-y-auto">
                {listings.filter(l => favoriteIds.includes(l.id)).length === 0 ? (
                  <div className="text-center py-16"><Heart size={40} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-400 text-sm">Henüz favori eklemediniz.</p><p className="text-gray-300 text-xs mt-1">Pazar'daki veya keşfetteki ilan kartlarında kalp ikonuna dokunarak favorilere ekleyebilirsiniz.</p></div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">{listings.filter(l => favoriteIds.includes(l.id)).map(l => (<ListingCard key={l.id} l={l} />))}</div>
                )}
              </div>
            )}
            {mechTab === "analytics" && (() => {
              const myAppts = appointments.filter(isSameMechanicAppt);
              const now = new Date();
              const withinDays = (a, days) => { if (!a.dateISO) return false; const d = new Date(a.dateISO); return (now.getTime() - d.getTime()) / 86400000 <= days && (now.getTime() - d.getTime()) >= 0; };
              const totalBooked = myAppts.length;
              const monthBooked = myAppts.filter(a => withinDays(a, 30)).length;
              const completedAll = myAppts.filter(a => a.status === "Tamir Tamamlandı");
              const cancelledAll = myAppts.filter(a => a.status === "İptal Edildi" || a.status === "Reddedildi");
              const noShowAll = myAppts.filter(a => a.status === "Gelmedi" || a.noShow);
              const completionRate = totalBooked > 0 ? Math.round((completedAll.length / totalBooked) * 100) : 0;
              const reviewList = myProfile?.reviewList || [];
              const avgRating = reviewList.length > 0 ? (reviewList.reduce((s, r) => s + r.rating, 0) / reviewList.length) : (myProfile?.rating || 0);
              const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({ star, count: reviewList.filter(r => Math.round(r.rating) === star).length }));
              const maxBreakdown = Math.max(1, ...ratingBreakdown.map(r => r.count));
              const completed = completedAll;
              const total = completed.reduce((s, a) => s + (a.servicePrice || 0), 0);
              const weekTotal = completed.filter(a => withinDays(a, 7)).reduce((s, a) => s + (a.servicePrice || 0), 0);
              const monthTotal = completed.filter(a => withinDays(a, 30)).reduce((s, a) => s + (a.servicePrice || 0), 0);
              const serviceMap: Record<string, { count: number; total: number }> = {};
              completed.forEach(a => { const name = (a.issue || "Diğer").split(" — ")[0]; if (!serviceMap[name]) serviceMap[name] = { count: 0, total: 0 }; serviceMap[name].count += 1; serviceMap[name].total += (a.servicePrice || 0); });
              const topServices = Object.entries(serviceMap).sort((a, b) => b[1].total - a[1].total).slice(0, 5);
              return (
                <div className="flex-1 px-5 py-4 overflow-y-auto">
                  <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
                    <button onClick={() => setMechAnalyticsView("overview")} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${mechAnalyticsView === "overview" ? "bg-white shadow-sm text-rose-700" : "text-gray-400"}`}><TrendingUp size={12} /> Genel Analiz</button>
                    <button onClick={() => setMechAnalyticsView("earnings")} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${mechAnalyticsView === "earnings" ? "bg-white shadow-sm text-rose-700" : "text-gray-400"}`}><Banknote size={12} /> Kazanç</button>
                    <button onClick={() => setMechAnalyticsView("traffic")} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 ${mechAnalyticsView === "traffic" ? "bg-white shadow-sm text-rose-700" : "text-gray-400"}`}><Compass size={12} /> Ziyaret & Rapor</button>
                  </div>
                  {mechAnalyticsView === "overview" && (<>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-rose-50 rounded-xl p-3"><p className="text-lg font-bold text-rose-600">{totalBooked}</p><p className="text-[10px] text-gray-500 mt-0.5">Toplam randevu</p></div>
                      <div className="bg-gray-100 rounded-xl p-3"><p className="text-lg font-bold text-gray-700">{monthBooked}</p><p className="text-[10px] text-gray-500 mt-0.5">Bu ay alınan</p></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      <div className="bg-green-50 rounded-xl p-2.5 text-center"><p className="text-sm font-bold text-green-600">{completedAll.length}</p><p className="text-[9px] text-gray-500 mt-0.5">Geldi</p></div>
                      <div className="bg-red-50 rounded-xl p-2.5 text-center"><p className="text-sm font-bold text-red-500">{cancelledAll.length}</p><p className="text-[9px] text-gray-500 mt-0.5">İptal/Red</p></div>
                      <div className="bg-amber-50 rounded-xl p-2.5 text-center"><p className="text-sm font-bold text-amber-600">{noShowAll.length}</p><p className="text-[9px] text-gray-500 mt-0.5">Gelmedi</p></div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4">
                      <div className="flex items-center justify-between mb-1"><h3 className="text-sm font-bold text-gray-800">Tamamlanma Oranı</h3><span className="text-sm font-bold text-rose-600">%{completionRate}</span></div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-rose-600 rounded-full" style={{ width: `${completionRate}%` }} /></div>
                      <p className="text-[10px] text-gray-400 mt-1.5">{completedAll.length} tamamlanan / {totalBooked} toplam randevu</p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold text-gray-800">Müşteri Memnuniyeti</h3><span className="flex items-center gap-1 text-sm font-bold text-gray-900"><Star size={14} className="fill-gray-900" />{avgRating.toFixed(1)}</span></div>
                      {reviewList.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">Henüz değerlendirme yok.</p>
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
                      <p className="text-[10px] text-gray-300 mt-3">{reviewList.length} değerlendirme üzerinden hesaplanmıştır.</p>
                    </div>
                  </>)}
                  {mechAnalyticsView === "earnings" && (<>
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      <div className="bg-rose-50 rounded-xl p-3 text-center"><p className="text-base font-bold text-rose-600">{weekTotal}₺</p><p className="text-[9px] text-gray-500 mt-0.5">Bu hafta</p></div>
                      <div className="bg-gray-100 rounded-xl p-3 text-center"><p className="text-base font-bold text-gray-700">{monthTotal}₺</p><p className="text-[9px] text-gray-500 mt-0.5">Bu ay</p></div>
                      <div className="bg-gray-100 rounded-xl p-3 text-center"><p className="text-base font-bold text-gray-700">{total}₺</p><p className="text-[9px] text-gray-500 mt-0.5">Toplam</p></div>
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 mb-2.5">En Çok Kazandıran Hizmetler</h3>
                    {topServices.length === 0 ? (
                      <div className="text-center py-14"><Banknote size={36} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-400 text-sm">Henüz tamamlanmış ücretli iş yok.</p></div>
                    ) : (
                      <div className="space-y-2">{topServices.map(([name, s]) => (<div key={name} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-3 shadow-sm"><div className="min-w-0"><p className="text-xs font-semibold text-gray-800 truncate">{name}</p><p className="text-[10px] text-gray-400">{s.count} işlem</p></div><p className="text-sm font-bold text-rose-600 flex-shrink-0 ml-2">{s.total}₺</p></div>))}</div>
                    )}
                    <p className="text-[10px] text-gray-300 mt-4 text-center">Toplam {completed.length} tamamlanan iş üzerinden hesaplanmıştır.</p>
                  </>)}
                  {mechAnalyticsView === "traffic" && (() => {
                    const myOwnListings = listings.filter(l => l.sellerType === "mechanic" && l.sellerName === myProfile?.name);
                    const myOwnJobs = jobListings.filter(j => j.mechanicId === myProfile?.id);
                    const myTotalShares = (myProfile?.shareCount || 0) + myOwnListings.reduce((s, l) => s + (l.shareCount || 0), 0) + myOwnJobs.reduce((s, j) => s + (j.shareCount || 0), 0);
                    const myTotalApplicants = myOwnJobs.reduce((s, j) => s + (j.applicants || []).length, 0);
                    const TR_MONTH_ABBR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
                    const formatMonth = (m) => { const parts = String(m).split("-"); return TR_MONTH_ABBR[parseInt(parts[1], 10) - 1] || m; };
                    const stats = myProfileViewStats;
                    const viewConvRate = stats && stats.viewsThisYear > 0 ? Math.round((stats.conversionsThisYear / stats.viewsThisYear) * 100) : 0;
                    return (
                      <>
                        <h3 className="text-sm font-bold text-gray-800 mb-2.5 flex items-center gap-1.5"><Compass size={14} className="text-rose-500" /> Profil Ziyaretleri</h3>
                        {!stats ? (
                          <div className="text-center py-10 text-xs text-gray-400">Yükleniyor…</div>
                        ) : (
                          <>
                            <div className="grid grid-cols-3 gap-2 mb-4">
                              <div className="bg-rose-50 rounded-xl p-3 text-center"><p className="text-base font-bold text-rose-600">{stats.viewsThisYear}</p><p className="text-[9px] text-gray-500 mt-0.5">Bu yıl ziyaret</p></div>
                              <div className="bg-gray-100 rounded-xl p-3 text-center"><p className="text-base font-bold text-gray-700">{stats.conversionsThisYear}</p><p className="text-[9px] text-gray-500 mt-0.5">Randevuya dönüşen</p></div>
                              <div className="bg-gray-100 rounded-xl p-3 text-center"><p className="text-base font-bold text-gray-700">%{viewConvRate}</p><p className="text-[9px] text-gray-500 mt-0.5">Dönüşüm oranı</p></div>
                            </div>
                            {stats.monthly.length > 0 && (
                              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-5">
                                <h4 className="text-xs font-semibold text-gray-700 mb-3">Aylık Ziyaret Trendi</h4>
                                <MiniBarChart labels={stats.monthly.map(m => formatMonth(m.month))} values={stats.monthly.map(m => m.views)} colorClass="bg-rose-500" />
                              </div>
                            )}
                            <p className="text-[10px] text-gray-300 mb-5">Toplam (tüm zamanlar): {stats.totalViews} ziyaret, {stats.conversions} dönüşüm.</p>
                          </>
                        )}
                        <h3 className="text-sm font-bold text-gray-800 mb-2.5 flex items-center gap-1.5"><History size={14} className="text-rose-500" /> Yıllık Özet Raporu</h3>
                        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-2">
                          <div className="flex items-center justify-between text-sm"><span className="text-gray-500">Toplam Randevu</span><span className="font-semibold text-gray-800">{totalBooked}</span></div>
                          <div className="flex items-center justify-between text-sm"><span className="text-gray-500">Tamamlanan Randevu</span><span className="font-semibold text-gray-800">{completedAll.length} (%{completionRate})</span></div>
                          <div className="flex items-center justify-between text-sm"><span className="text-gray-500">Toplam Kazanç</span><span className="font-semibold text-gray-800">{total.toLocaleString("tr-TR")}₺</span></div>
                          <div className="flex items-center justify-between text-sm"><span className="text-gray-500">Ortalama Puan</span><span className="font-semibold text-gray-800 flex items-center gap-1"><Star size={12} className="fill-gray-900" /> {avgRating.toFixed(1)} ({reviewList.length} değerlendirme)</span></div>
                          <div className="flex items-center justify-between text-sm"><span className="text-gray-500">Profil + İlan Paylaşımı</span><span className="font-semibold text-gray-800">{myTotalShares}</span></div>
                          <div className="flex items-center justify-between text-sm"><span className="text-gray-500">Bu Yıl Profil Ziyareti</span><span className="font-semibold text-gray-800">{stats?.viewsThisYear ?? "—"}</span></div>
                          <div className="flex items-center justify-between text-sm"><span className="text-gray-500">Aktif Araç İlanı</span><span className="font-semibold text-gray-800">{myOwnListings.filter(l => !l.adminRemoved).length}</span></div>
                          <div className="flex items-center justify-between text-sm"><span className="text-gray-500">İş İlanlarına Toplam Başvuru</span><span className="font-semibold text-gray-800">{myTotalApplicants}</span></div>
                        </div>
                        <p className="text-[10px] text-gray-300 mt-3 text-center">Bu rapor, hesabınızın açıldığı tarihten bugüne kadar biriken verilere dayanır.</p>
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
                <div className="min-w-0"><h1 className="text-lg font-bold truncate text-gray-900">{myProfile.name || "İşletmem"}</h1><p className="text-gray-500 text-xs">Profil ve Ayarlar</p></div>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-gray-100 rounded-xl p-1">
                <button onClick={() => setMechProfileTab("profile")} className={`py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 ${mechProfileTab === "profile" ? "bg-white text-rose-700 shadow-sm" : "text-gray-500"}`}><Pencil size={12} /> Profil</button>
                <button onClick={() => setMechProfileTab("offers")} className={`py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 ${mechProfileTab === "offers" ? "bg-white text-rose-700 shadow-sm" : "text-gray-500"}`}><Banknote size={12} /> Teklifler</button>
                <button onClick={() => setMechProfileTab("settings")} className={`py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 ${mechProfileTab === "settings" ? "bg-white text-rose-700 shadow-sm" : "text-gray-500"}`}><Settings size={12} /> Ayarlar</button>
              </div>
            </div>
            {mechProfileTab === "profile" && (
              <div className="flex-1 px-5 py-4 overflow-y-auto">
                <div className="bg-rose-100 rounded-xl p-3 mb-4 text-xs text-rose-800 flex items-center gap-2"><Pencil size={14} /> Değişiklikler anında yansır.</div>
                <h3 className="font-semibold text-gray-800 text-sm mb-2">Temel Bilgiler</h3>
                <div className="space-y-2 mb-5"><input value={myProfile.name} onChange={(e) => updateMyField("name", e.target.value)} placeholder="İşletme Adı" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={myProfile.specialty} onChange={(e) => updateMyField("specialty", e.target.value)} placeholder="Uzmanlık Alanı" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} /><input value={myProfile.address} onChange={(e) => updateMyField("address", e.target.value)} placeholder="Adres" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div><input value={myProfile.price} onChange={(e) => updateMyField("price", Number(e.target.value) || 0)} type="number" placeholder="Fiyat (₺)" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                <div className="flex items-center justify-between mb-2"><h3 className="font-semibold text-gray-800 text-sm">Hizmetler</h3>{!showAddServiceForm && <button onClick={() => setShowAddServiceForm(true)} className="text-xs text-rose-700 font-medium flex items-center gap-1"><Plus size={14} /> Ekle</button>}</div>
                <p className="text-[11px] text-gray-400 mb-2 -mt-1">"Sabit Fiyat" işaretlediğiniz hizmetler, araç sahiplerine randevu alırken önceden ödeme seçeneğiyle gösterilir.</p>
                <div className="space-y-2 mb-3 max-h-52 overflow-y-auto pr-0.5">{myProfile.services.map((s, i) => (<div key={i} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-2"><input value={s.name} onChange={(e) => updateService(i, "name", e.target.value)} placeholder="Hizmet" className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs" /><input value={s.price} onChange={(e) => updateService(i, "price", e.target.value)} placeholder={s.fixed ? "Fiyat *" : "Fiyat (opsiyonel)"} className={`w-20 px-2 py-1.5 rounded-lg border text-xs ${s.fixed && !String(s.price || "").trim() ? "border-red-300" : "border-gray-200"}`} /><button onClick={() => toggleServiceFixed(i)} className={`flex-shrink-0 text-[10px] font-semibold px-2 py-1.5 rounded-lg whitespace-nowrap transition ${s.fixed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{s.fixed ? "Sabit Fiyat" : "Değişken"}</button><button onClick={() => removeService(i)} aria-label="Hizmeti sil" className="text-red-400 hover:text-red-600 flex-shrink-0 p-2 -m-2"><Trash2 size={14} /></button></div>))}</div>
                {showAddServiceForm && (
                  <div className="bg-rose-100 border border-rose-200 rounded-xl p-3 mb-5">
                    <div className="flex items-center gap-2 mb-2">
                      <input autoFocus value={newServiceForm.name} onChange={(e) => { const val = e.target.value; setNewServiceForm(f => ({ ...f, name: val, fixed: f.fixedTouched ? f.fixed : isFixedPriceService(val) })); setDuplicateServiceWarning(null); }} placeholder="Yeni hizmet adı" className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white" />
                      <input value={newServiceForm.price} onChange={(e) => setNewServiceForm(f => ({ ...f, price: e.target.value }))} placeholder={newServiceForm.fixed ? "Fiyat *" : "Fiyat (opsiyonel)"} className={`w-20 px-2 py-1.5 rounded-lg border text-xs bg-white ${newServiceForm.fixed && !newServiceForm.price.trim() ? "border-red-300" : "border-gray-200"}`} />
                    </div>
                    <button onClick={() => setNewServiceForm(f => ({ ...f, fixed: !f.fixed, fixedTouched: true }))} className={`w-full mb-2 text-[11px] font-semibold py-1.5 rounded-lg transition ${newServiceForm.fixed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{newServiceForm.fixed ? "✓ Sabit Fiyat (müşteri önceden ödeyebilir)" : "Değişken Fiyat (ödeme tamirden sonra)"}</button>
                    {newServiceForm.fixed && !newServiceForm.price.trim() && (<p className="text-[10px] text-red-500 mb-2 -mt-1">Sabit fiyatlı hizmetler için fiyat girmelisiniz.</p>)}
                    {duplicateServiceWarning ? (
                      <div className="bg-white border border-gray-300 rounded-lg p-2.5 mb-2">
                        <p className="text-[11px] text-gray-700 mb-2 flex items-start gap-1.5"><Bell size={12} className="flex-shrink-0 mt-0.5" /> "{duplicateServiceWarning.name}" zaten hizmetler listenizde var. Yine de eklemek istiyor musunuz?</p>
                        <div className="flex gap-2">
                          <button onClick={() => setDuplicateServiceWarning(null)} className="flex-1 border border-gray-200 text-gray-500 text-[11px] py-1.5 rounded-lg font-medium">Vazgeç</button>
                          <button onClick={() => finalizeAddService(duplicateServiceWarning.name, duplicateServiceWarning.price, duplicateServiceWarning.fixed)} className="flex-1 bg-rose-600 text-white text-[11px] py-1.5 rounded-lg font-medium hover:bg-rose-700 transition">Yine de Ekle</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={cancelAddService} className="flex-1 border border-gray-200 text-gray-500 text-[11px] py-1.5 rounded-lg font-medium">{t("cancel")}</button>
                        <button disabled={!newServiceForm.name.trim() || (newServiceForm.fixed && !newServiceForm.price.trim())} onClick={tryAddService} className={`flex-1 text-[11px] py-1.5 rounded-lg font-medium transition ${newServiceForm.name.trim() && (!newServiceForm.fixed || newServiceForm.price.trim()) ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>Ekle</button>
                      </div>
                    )}
                  </div>
                )}
                <h3 className="font-semibold text-gray-800 text-sm mb-2">Kapak Fotoğrafı</h3>
                {myProfile.coverPhoto ? (<div className="relative w-full h-28 rounded-2xl overflow-hidden mb-5"><img src={myProfile.coverPhoto} alt="Kapak fotoğrafı" className="w-full h-full object-cover" /><button onClick={removeCoverPhoto} aria-label="Kapak fotoğrafını kaldır" className="absolute top-2 right-2 w-9 h-9 bg-black/50 rounded-full flex items-center justify-center text-white"><X size={14} /></button></div>) : (<div className="mb-5"><div className="flex gap-2 mb-2">{Object.entries(BANNER_PRESETS).map(([key, grad]) => (<button key={key} onClick={() => updateMyField("bannerPreset", key)} className={`flex-1 h-14 rounded-xl bg-gradient-to-br ${grad} ${myProfile.bannerPreset === key ? "ring-2 ring-offset-2 ring-rose-600" : ""}`} />))}</div><input ref={coverFileRef} type="file" accept="image/*" onChange={uploadCoverPhoto} className="hidden" /><button onClick={() => coverFileRef.current?.click()} className="w-full border-2 border-dashed border-rose-300 rounded-xl py-2.5 text-rose-600 text-xs font-medium hover:bg-rose-100 transition flex items-center justify-center gap-2"><Camera size={14} /> Kendi Fotoğrafını Yükle</button></div>)}
                <div className="flex items-center justify-between mb-2"><h3 className="font-semibold text-gray-800 text-sm">{t("team")}</h3><button onClick={addStaff} className="text-xs text-rose-700 font-medium flex items-center gap-1"><Plus size={14} /> Ekle</button></div>
                <div className="space-y-3 mb-6">{myProfile.staff.map((s, i) => (<div key={i} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-2"><div className="relative w-11 h-11 rounded-full bg-rose-50 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">{isImgUrl(s.emoji) ? <img src={s.emoji} alt={s.name || "Personel fotoğrafı"} className="w-full h-full object-cover" /> : s.emoji}<input ref={(el) => (staffFileRefs.current[i] = el)} type="file" accept="image/*" onChange={(e) => staffAvatarUpload(i, e)} className="hidden" /><button onClick={() => staffFileRefs.current[i]?.click()} className="absolute inset-0 bg-black/0 hover:bg-black/30 transition flex items-center justify-center text-transparent hover:text-white"><Pencil size={12} /></button></div><div className="flex-1 space-y-1"><input value={s.name} onChange={(e) => updateStaffField(i, "name", e.target.value)} placeholder="Ad Soyad" className="w-full px-2 py-1 rounded-lg border border-gray-200 text-xs" /><input value={s.role} onChange={(e) => updateStaffField(i, "role", e.target.value)} placeholder="Görev" className="w-full px-2 py-1 rounded-lg border border-gray-200 text-xs" /></div><button onClick={() => removeStaff(i)} aria-label="Personeli sil" className="text-red-400 hover:text-red-600 flex-shrink-0 p-2 -m-2"><Trash2 size={14} /></button></div>))}</div>
                <button onClick={saveMyProfile} className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition flex items-center justify-center gap-2 mb-2"><Save size={16} /> {t("save")}</button>
                <button onClick={previewMyProfile} className="w-full border border-gray-200 text-gray-500 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition mb-5">Sayfamı Önizle</button>
              </div>
            )}
            {mechProfileTab === "offers" && (
              <div className="flex-1 px-5 py-4 overflow-y-auto">
                <h3 className="font-semibold text-gray-800 text-sm mb-2">{t("offersMade")}</h3>
                <div className="space-y-2 mb-6">{listings.flatMap(l => l.offers.filter(o => o.from === myProfile.name && o.status !== "replaced").map(o => ({ ...o, listing: l }))).map(o => (<button key={o.id} onClick={() => setSelectedListingId(o.listing.id)} className="w-full text-left bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-center hover:border-rose-200 transition"><div><p className="text-xs font-medium text-gray-700">{o.listing.brand} {o.listing.model}</p><p className="text-[10px] text-gray-400">{o.status === "accepted" ? "✅ Kabul edildi" : o.status === "rejected" ? "❌ Reddedildi" : o.seen ? "⏳ Beklemede · satıcı gördü" : "⏳ Beklemede"}</p></div><span className="font-bold text-rose-600 text-sm">{o.amount}{o.currency || "₺"}</span></button>))}
                {listings.flatMap(l => l.offers.filter(o => o.from === myProfile.name && o.status !== "replaced")).length === 0 && <p className="text-center text-gray-400 text-sm py-4">Henüz teklif vermediniz</p>}</div>
                {listings.filter(l => l.offers.some(o => o.status === "rejected" && o.from === myProfile.name)).length > 0 && (
                  <p className="text-[11px] text-gray-400 mb-4 -mt-3 flex items-start gap-1.5"><AlertTriangle size={12} className="flex-shrink-0 mt-0.5 text-amber-500" /> Reddedilen bir teklifin üzerine, ilgili ilana girip yeni teklif verebilirsiniz.</p>
                )}
                <h3 className="font-semibold text-gray-800 text-sm mb-2">{t("offersReceived")}</h3>
                <div className="space-y-2">{listings.filter(l => l.sellerName === myProfile.name).flatMap(l => l.offers.filter(o => o.status !== "replaced").map(o => ({ ...o, listing: l }))).map(o => (
                  <div key={o.id} className="bg-white border border-gray-100 rounded-xl p-3">
                    <button onClick={() => setSelectedListingId(o.listing.id)} className="w-full text-left flex justify-between items-center mb-2"><div><p className="text-xs font-medium text-gray-700">{o.from}</p><p className="text-[10px] text-gray-400">{o.listing.brand} {o.listing.model}</p></div><span className="font-bold text-rose-600 text-sm">{o.amount}{o.currency || "₺"}</span></button>
                    {o.status === "pending" ? (<div className="flex gap-2"><button onClick={() => respondOffer(o.listing.id, o.id, "accepted")} className="flex-1 bg-green-500 text-white text-[11px] py-1.5 rounded-lg font-medium">{t("accept")}</button><button onClick={() => respondOffer(o.listing.id, o.id, "rejected")} className="flex-1 border border-gray-200 text-gray-500 text-[11px] py-1.5 rounded-lg font-medium">{t("reject")}</button></div>) : (<p className="text-[11px] text-gray-400">{o.status === "accepted" ? "✅ Kabul edildi" : "❌ Reddedildi"}</p>)}
                  </div>
                ))}{listings.filter(l => l.sellerName === myProfile.name).flatMap(l => l.offers.filter(o => o.status !== "replaced")).length === 0 && <p className="text-center text-gray-400 text-sm py-4">Henüz teklif almadınız</p>}</div>
              </div>
            )}
            {mechProfileTab === "settings" && (
              <div className="flex-1 px-5 py-5 overflow-y-auto">
                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4"><div className="flex items-center justify-between mb-2"><h3 className="font-semibold text-gray-800 text-sm">Randevuları Otomatik Onayla</h3><button onClick={() => setAutoAccept(!autoAccept)} aria-label="Değiştir" className="p-3 -m-3 flex-shrink-0"><div className={`w-12 h-7 rounded-full transition relative ${autoAccept ? "bg-rose-600" : "bg-gray-200"}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition ${autoAccept ? "left-6" : "left-1"}`} /></div></button></div></div>
                <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4"><div className="pr-3"><h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><MapPin size={14} className="text-rose-600" /> Konumumu Kullan</h3><p className="text-[11px] text-gray-400 mt-0.5">{userLocation ? "Gerçek konumunuza göre mesafe gösteriliyor" : "Kapalı — tahmini mesafeler gösteriliyor"}</p></div><button onClick={() => (userLocation ? stopUsingLocation() : setShowLocationPrompt(true))} aria-label="Değiştir" className="p-3 -m-3 flex-shrink-0"><div className={`w-12 h-7 rounded-full transition relative ${userLocation ? "bg-rose-600" : "bg-gray-200"}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition ${userLocation ? "left-6" : "left-1"}`} /></div></button></div>
                {(() => {
                  const notifOpts = [{ key: "notifyAppointments", label: "Randevu güncellemeleri" }, { key: "notifyOffers", label: "Teklif sonuçları" }, { key: "notifyMessages", label: "Mesaj bildirimleri" }, { key: "notifyJobApplications", label: "Yeni başvurular" }];
                  const allNotifsOn = notifOpts.every(opt => mechSettings[opt.key]);
                  const toggleAllNotifs = () => {
                    setMechSettings(s => ({ ...s, ...Object.fromEntries(notifOpts.map(opt => [opt.key, !allNotifsOn])) }));
                    if (!allNotifsOn && notifPermission !== "granted") requestNotifPermission();
                  };
                  return (
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4">
                      <div className="flex items-center justify-between"><div className="pr-3"><h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Bell size={14} className="text-rose-600" /> Bildirimler</h3><p className="text-[11px] text-gray-400 mt-0.5">{notifPermission === "denied" ? "Tarayıcı ayarlarından izin vermeniz gerekiyor" : allNotifsOn ? "Tüm bildirim türleri açık" : "Tarayıcı bildirimlerini açın"}</p></div><button onClick={toggleAllNotifs} aria-label="Değiştir" className="p-3 -m-3 flex-shrink-0"><div className={`w-12 h-7 rounded-full transition relative ${allNotifsOn ? "bg-rose-600" : "bg-gray-200"}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition ${allNotifsOn ? "left-6" : "left-1"}`} /></div></button></div>
                      <button onClick={() => setMechNotifDetailsOpen(o => !o)} className="w-full flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 hover:text-gray-700 transition"><span>Bildirim türlerini göster</span><ChevronRight size={13} className={`transition-transform ${mechNotifDetailsOpen ? "rotate-90" : ""}`} /></button>
                      {mechNotifDetailsOpen && (
                        <div className="mt-3 space-y-2.5">
                          {notifOpts.map(opt => (
                            <div key={opt.key} className="flex items-center justify-between"><span className="text-xs text-gray-600">{opt.label}</span><button onClick={() => setMechSettings(s => ({ ...s, [opt.key]: !s[opt.key] }))} aria-label="Değiştir" className="p-3 -m-3 flex-shrink-0"><div className={`w-9 h-5 rounded-full transition relative ${mechSettings[opt.key] ? "bg-rose-600" : "bg-gray-200"}`}><div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition ${mechSettings[opt.key] ? "left-[19px]" : "left-[3px]"}`} /></div></button></div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
                <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4"><h3 className="font-semibold text-gray-800 text-sm">{t("siteLanguage")}</h3><LangSwitch /></div>
                <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4"><div className="pr-3"><h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Globe size={14} className="text-rose-600" /> Mesajlaşma Dili</h3><p className="text-[11px] text-gray-400 mt-0.5">Araç sahiplerinin size yazdığı mesajlar bu dile otomatik çevrilir</p></div><div className="flex bg-gray-100 rounded-full p-0.5 gap-0.5 flex-shrink-0">{["tr", "en", "de"].map(l => (<button key={l} onClick={() => updateMyField("lang", l)} className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${(myProfile.lang || "tr") === l ? "bg-white text-rose-600 shadow-sm" : "text-gray-400"}`}>{l.toUpperCase()}</button>))}</div></div>
                <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4"><h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Palette size={14} className={darkMode ? "text-rose-500" : "text-rose-600"} /> Görünüm — Karanlık Mod</h3><button onClick={() => setDarkMode(d => !d)} aria-label="Değiştir" className="p-3 -m-3 flex-shrink-0"><div className={`w-12 h-7 rounded-full transition relative ${darkMode ? "bg-rose-600" : "bg-gray-200"}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition ${darkMode ? "left-6" : "left-1"}`} /></div></button></div>
                <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2"><Clock size={16} /> {t("workingHours")}</h3>
                <p className="text-[11px] text-gray-400 mb-3">Bir güne tıklayıp açın; kapattığınız saatler müşterilere dolu görünür. "+" ile o güne ekstra saat ekleyebilirsiniz.</p>
                <div className="space-y-2 mb-6">
                  {DAY_KEYS.map(key => { const day = mechanicHours[key]; const isOpen = expandedDay === key; const slots = getDaySlots(day); const summary = day.open ? `${day.start} - ${slots.length ? slots[slots.length - 1] : day.end}` : t("closed"); return (
                    <div key={key} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                      <button onClick={() => setExpandedDay(isOpen ? null : key)} className="w-full flex items-center justify-between p-3">
                        <span className="text-sm font-semibold text-gray-700">{DAY_LABELS_FULL[key]}</span>
                        <div className="flex items-center gap-2"><span className={`text-[11px] ${day.open ? "text-gray-400" : "text-red-400"}`}>{summary}</span><ChevronRight size={14} className={`text-gray-300 transition-transform ${isOpen ? "rotate-90" : ""}`} /></div>
                      </button>
                      {isOpen && (
                        <div className="px-3 pb-3 border-t border-gray-50 pt-3">
                          <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500">Bu gün açık</span><button onClick={() => toggleDayOpen(key)} aria-label="Değiştir" className="p-3 -m-3 flex-shrink-0"><div className={`w-11 h-6 rounded-full transition relative ${day.open ? "bg-rose-600" : "bg-gray-200"}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition ${day.open ? "left-6" : "left-1"}`} /></div></button></div>
                          {day.open && (<>
                            <div className="flex flex-wrap gap-1.5 mb-3">{slots.map(slot => { const closed = day.closedSlots.includes(slot); return (<button key={slot} onClick={() => toggleSlotClosed(key, slot)} className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition ${closed ? "bg-red-50 text-red-400 border-red-100 line-through" : "bg-green-50 text-green-600 border-green-100"}`}>{slot}</button>); })}</div>
                            <div className="flex items-center gap-2"><input type="time" value={expandedDay === key ? newSlotTime : ""} onChange={(e) => setNewSlotTime(e.target.value)} step="1800" className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs" /><button onClick={() => { addExtraSlot(key, newSlotTime); setNewSlotTime(""); }} className="w-8 h-8 bg-rose-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 hover:bg-rose-700 transition"><Plus size={16} /></button></div>
                          </>)}
                        </div>
                      )}
                    </div>
                  ); })}
                </div>
                <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2"><Bell size={16} /> SMS Bildirim Geçmişi</h3>
                <div className="space-y-2 mb-6">{smsLog.map(s => (<div key={s.id} className="bg-white border border-gray-200 rounded-xl p-3 text-xs text-gray-600">{s.text}</div>))}{smsLog.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Henüz SMS gönderilmedi.</p>}</div>
                <button onClick={() => setMechPaymentInfoOpen(o => !o)} className="w-full flex items-center justify-between mb-2 hover:opacity-70 transition"><h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Banknote size={16} /> Ödeme Bilgileri</h3><ChevronRight size={15} className={`text-gray-300 transition-transform ${mechPaymentInfoOpen ? "rotate-90" : ""}`} /></button>
                {mechPaymentInfoOpen && (<>
                  <p className="text-[11px] text-gray-400 mb-3">Randevu kaporalarının aktarılacağı hesap bilgileri.</p>
                  <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-2 mb-6">
                    <input value={myProfile?.accountHolder || ""} onChange={(e) => updateMyField("accountHolder", e.target.value)} placeholder="Hesap Sahibi" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                    <input value={myProfile?.bankName || ""} onChange={(e) => updateMyField("bankName", e.target.value)} placeholder="Banka Adı" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                    <input value={myProfile?.iban || ""} onChange={(e) => updateMyField("iban", e.target.value)} placeholder="IBAN" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                    <button onClick={() => setToast({ type: "info", text: "✅ Ödeme bilgileri kaydedildi." })} className="w-full bg-gray-800 text-white py-2 rounded-xl text-sm font-medium hover:bg-gray-900 transition mt-1">{t("save")}</button>
                  </div>
                </>)}
                <button onClick={() => setMechAccountOpen(o => !o)} className="w-full flex items-center justify-between mt-2 mb-2 hover:opacity-70 transition"><h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2"><Lock size={15} className="text-gray-400" /> Hesap</h3><ChevronRight size={15} className={`text-gray-300 transition-transform ${mechAccountOpen ? "rotate-90" : ""}`} /></button>
                {mechAccountOpen && (<>
                  <button onClick={() => setShowPasswordModal(true)} className="w-full flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 mb-2 shadow-sm hover:bg-gray-50 transition"><span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Lock size={14} className="text-gray-400" /> Şifre Değiştir</span><ChevronRight size={15} className="text-gray-300" /></button>
                  <button onClick={() => setMechProfileTab("support")} className="w-full flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 mb-2 shadow-sm hover:bg-gray-50 transition"><span className="text-sm font-medium text-gray-700 flex items-center gap-2"><LifeBuoy size={14} className="text-gray-400" /> Yardım &amp; Destek</span>{mySupportTickets().filter(tk => tk.status !== "resolved").length > 0 && <span className="text-[10px] font-bold text-white bg-rose-600 rounded-full px-1.5 py-0.5 flex-shrink-0">{mySupportTickets().filter(tk => tk.status !== "resolved").length}</span>}<ChevronRight size={15} className="text-gray-300" /></button>
                  <button onClick={() => setLegalModalTopic("terms")} className="w-full flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 mb-2 shadow-sm hover:bg-gray-50 transition"><span className="text-sm font-medium text-gray-700">Kullanım Şartları</span><ChevronRight size={15} className="text-gray-300" /></button>
                  <button onClick={() => setLegalModalTopic("privacy")} className="w-full flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 mb-2 shadow-sm hover:bg-gray-50 transition"><span className="text-sm font-medium text-gray-700">Gizlilik Politikası</span><ChevronRight size={15} className="text-gray-300" /></button>
                </>)}
                <button onClick={goHome} className="w-full border border-gray-200 text-gray-600 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition mb-5 mt-3">{t("logout")}</button>
                <button onClick={() => setMechDangerZoneOpen(o => !o)} className="w-full flex items-center justify-between py-2 text-xs text-gray-400 hover:text-gray-600 transition"><span>Tehlikeli Bölge</span><ChevronRight size={13} className={`transition-transform ${mechDangerZoneOpen ? "rotate-90" : ""}`} /></button>
                {mechDangerZoneOpen && (
                  <div className="border border-red-100 bg-red-50/50 rounded-2xl p-4 mt-1">
                    <p className="text-xs text-gray-500 mb-3">İşletmeni silersen profilin, ilanların ve randevu geçmişin kalıcı olarak silinir. Bu işlem geri alınamaz.</p>
                    <button onClick={() => { setShowDeleteAccountModal(true); setDeleteConfirmText(""); }} className="w-full text-red-500 border border-red-200 py-2.5 rounded-xl font-medium text-xs hover:bg-red-100 transition">İşletmemi Sil</button>
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
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-800 flex items-center gap-2"><SlidersHorizontal size={18} /> {t("filterBtn")}</h3><button onClick={() => setShowFilterModal(false)} aria-label="Kapat" className="w-9 h-9 -m-2 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition flex-shrink-0"><X size={18} /></button></div>
            {ownerMode === "mechanics" ? (
              <>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Fiyat Aralığı</h4>
                <div className="flex gap-2 mb-5 flex-wrap">{[{ key: "all", label: "Tümü" }, { key: "cheap", label: "💵 Uygun" }, { key: "mid", label: "💰 Orta" }, { key: "expensive", label: "💎 Pahalı" }].map(o => (<button key={o.key} onClick={() => setFilters(f => ({ ...f, priceTier: o.key }))} className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${filters.priceTier === o.key ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-600 border-gray-200"}`}>{o.label}</button>))}</div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Minimum Puan</h4>
                <div className="flex gap-2 mb-5 flex-wrap">{[{ key: 0, label: "Tümü" }, { key: 4.0, label: "⭐ 4.0+" }, { key: 4.5, label: "⭐ 4.5+" }].map(o => (<button key={o.key} onClick={() => setFilters(f => ({ ...f, minRating: o.key }))} className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${filters.minRating === o.key ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-600 border-gray-200"}`}>{o.label}</button>))}</div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><MapPin size={13} /> Maksimum Mesafe</h4>
                <div className="flex gap-2 mb-6 flex-wrap">{[{ key: 999, label: "Tümü" }, { key: 1, label: "< 1 km" }, { key: 2, label: "< 2 km" }, { key: 5, label: "< 5 km" }].map(o => (<button key={o.key} onClick={() => setFilters(f => ({ ...f, maxDistance: o.key }))} className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${filters.maxDistance === o.key ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-600 border-gray-200"}`}>{o.label}</button>))}</div>
              </>
            ) : ownerMode === "cars" ? (
              <>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Cog size={13} /> Vites</h4>
                <div className="flex gap-2 mb-5 flex-wrap">{[{ key: "all", label: "Tümü" }, ...TRANSMISSIONS.map(tr => ({ key: tr, label: tr }))].map(o => (<button key={o.key} onClick={() => setListingFilters(f => ({ ...f, transmission: o.key }))} className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${listingFilters.transmission === o.key ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-600 border-gray-200"}`}>{o.label}</button>))}</div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Fuel size={13} /> Yakıt Türü</h4>
                <div className="flex gap-2 mb-5 flex-wrap">{[{ key: "all", label: "Tümü" }, ...FUEL_TYPES.map(f => ({ key: f, label: f }))].map(o => (<button key={o.key} onClick={() => setListingFilters(f => ({ ...f, fuelType: o.key }))} className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${listingFilters.fuelType === o.key ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-600 border-gray-200"}`}>{o.label}</button>))}</div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Banknote size={13} /> Fiyat Aralığı (₺)</h4>
                <div className="flex gap-2 mb-5"><input type="number" placeholder="Min" value={listingFilters.minPrice} onChange={(e) => setListingFilters(f => ({ ...f, minPrice: e.target.value }))} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input type="number" placeholder="Max" value={listingFilters.maxPrice} onChange={(e) => setListingFilters(f => ({ ...f, maxPrice: e.target.value }))} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Gauge size={13} /> Kilometre Aralığı</h4>
                <div className="flex gap-2 mb-5"><input type="number" placeholder="Min km" value={listingFilters.minKm} onChange={(e) => setListingFilters(f => ({ ...f, minKm: e.target.value }))} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input type="number" placeholder="Max km" value={listingFilters.maxKm} onChange={(e) => setListingFilters(f => ({ ...f, maxKm: e.target.value }))} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><CalendarDays size={13} /> Model Yılı</h4>
                <div className="flex gap-2 mb-6"><input type="number" placeholder="Min yıl" value={listingFilters.minYear} onChange={(e) => setListingFilters(f => ({ ...f, minYear: e.target.value }))} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input type="number" placeholder="Max yıl" value={listingFilters.maxYear} onChange={(e) => setListingFilters(f => ({ ...f, maxYear: e.target.value }))} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
              </>
            ) : (
              <>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Briefcase size={13} /> Çalışma Şekli</h4>
                <div className="flex gap-2 mb-5 flex-wrap">{[{ key: "all", label: "Tümü" }, ...EMPLOYMENT_TYPES.map(et => ({ key: et, label: et }))].map(o => (<button key={o.key} onClick={() => setJobFilters(f => ({ ...f, employmentType: o.key }))} className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${jobFilters.employmentType === o.key ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-600 border-gray-200"}`}>{o.label}</button>))}</div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><GraduationCap size={13} /> Deneyim Seviyesi</h4>
                <div className="flex gap-2 mb-6 flex-wrap">{[{ key: "all", label: "Tümü" }, ...EXPERIENCE_LEVELS.map(ex => ({ key: ex, label: ex }))].map(o => (<button key={o.key} onClick={() => setJobFilters(f => ({ ...f, experienceLevel: o.key }))} className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${jobFilters.experienceLevel === o.key ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-600 border-gray-200"}`}>{o.label}</button>))}</div>
              </>
            )}
            <div className="flex gap-2">
              <button onClick={() => ownerMode === "mechanics" ? setFilters({ priceTier: "all", minRating: 0, maxDistance: 999 }) : ownerMode === "cars" ? clearListingFilters() : clearJobFilters()} className="flex-1 border border-gray-200 text-gray-500 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition">{t("clear")}</button>
              <button onClick={() => setShowFilterModal(false)} className={`flex-1 text-white py-3 rounded-2xl font-semibold text-sm transition ${ownerMode === "mechanics" ? "bg-rose-600 hover:bg-rose-700" : ownerMode === "cars" ? "bg-rose-600 hover:bg-rose-700" : "bg-rose-600 hover:bg-rose-700"}`}>{t("apply")}</button>
            </div>
          </div>
        </div>
      )}
      {showMapMobile && (<div className="fixed inset-0 bg-white z-50 flex flex-col md:hidden"><div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between"><h3 className="font-bold text-gray-800">Haritada Tamirciler</h3><button onClick={() => setShowMapMobile(false)} aria-label="Kapat" className="w-9 h-9 -m-2 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition flex-shrink-0"><X size={18} /></button></div><MapPanel className="flex-1 m-4" items={filtered} onPick={openMapDetail} previewItem={mapPreviewItem} onPreviewChange={setMapPreviewItem} /><div className="p-4"><button onClick={() => setShowMapMobile(false)} className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm">Listeye Dön</button></div></div>)}
      {showSellVehiclePicker && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setShowSellVehiclePicker(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-sm rounded-t-3xl md:rounded-3xl p-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1"><h3 className="font-bold text-gray-800 flex items-center gap-2"><Car size={18} className="text-rose-600" /> Hangi Aracı Satacaksınız?</h3><button onClick={() => setShowSellVehiclePicker(false)} aria-label="Kapat" className="w-9 h-9 -m-2 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition flex-shrink-0"><X size={18} /></button></div>
            <p className="text-xs text-gray-400 mb-4">Kayıtlı araçlarınızdan birini seçerseniz bilgileri otomatik doldurulur.</p>
            <div className="space-y-2">
              {vehicles.map(v => {
                const linked = listings.find(l => l.id === v.listingId);
                return (
                  <button key={v.id} onClick={() => pickVehicleToSell(v)} className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-3 hover:border-rose-300 transition text-left">
                    <div className="w-11 h-11 bg-rose-50 rounded-xl flex items-center justify-center flex-shrink-0"><Car size={20} className="text-rose-600" /></div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{v.brand} {v.model}</p><p className="text-xs text-gray-400">{v.year} · {v.plate}{linked ? " · zaten ilanda" : ""}</p></div>
                    <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                  </button>
                );
              })}
              <button onClick={pickOtherCarToSell} className="w-full flex items-center gap-3 bg-white border border-dashed border-gray-300 rounded-2xl p-3 hover:border-rose-300 transition text-left">
                <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0"><Plus size={20} className="text-gray-500" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800">Başka Bir Araç</p><p className="text-xs text-gray-400">Kayıtlı araçlarımda yok, bilgileri kendim gireceğim</p></div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}
      {showSellForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center" onClick={() => setShowSellForm(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md md:max-w-lg rounded-t-3xl md:rounded-3xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-800 flex items-center gap-2"><Tag size={18} className="text-rose-600" /> {sellForm._editingId ? t("editListing") : "Araç Satış İlanı"}</h3><button onClick={() => setShowSellForm(false)} aria-label="Kapat" className="w-9 h-9 -m-2 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition flex-shrink-0"><X size={18} /></button></div>
            <div className="flex justify-center mb-4"><div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl overflow-hidden">{isImgUrl(sellForm.photo) ? <img src={sellForm.photo} alt="Araç fotoğrafı" className="w-full h-full object-cover" /> : sellForm.photo}<input ref={sellPhotoRef} type="file" accept="image/*" onChange={sellPhotoUpload} className="hidden" /><button onClick={() => sellPhotoRef.current?.click()} className="absolute inset-0 bg-black/0 hover:bg-black/40 transition flex items-center justify-center text-transparent hover:text-white"><Camera size={20} /></button></div></div>
            <div className="space-y-2">
              <div className="flex gap-2"><input value={sellForm.brand} onChange={(e) => setSellForm({ ...sellForm, brand: e.target.value })} placeholder="Marka *" className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={sellForm.model} onChange={(e) => setSellForm({ ...sellForm, model: e.target.value })} placeholder="Model *" className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
              <div className="flex gap-2"><input value={sellForm.year} onChange={(e) => setSellForm({ ...sellForm, year: e.target.value })} placeholder="Yıl *" className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={sellForm.km} onChange={(e) => setSellForm({ ...sellForm, km: e.target.value })} placeholder="Kilometre *" type="number" className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
              <input value={sellForm.price} onChange={(e) => setSellForm({ ...sellForm, price: e.target.value })} placeholder="Fiyat * (örn. 350.000₺)" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <p className="text-[10px] text-gray-300 px-1">* zorunlu alanlar</p>
              <div className="flex gap-2"><select value={sellForm.fuelType} onChange={(e) => setSellForm({ ...sellForm, fuelType: e.target.value })} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm">{FUEL_TYPES.map(f => <option key={f}>{f}</option>)}</select><select value={sellForm.transmission} onChange={(e) => setSellForm({ ...sellForm, transmission: e.target.value })} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm">{TRANSMISSIONS.map(f => <option key={f}>{f}</option>)}</select></div>
              <div className="flex gap-2"><input value={sellForm.power} onChange={(e) => setSellForm({ ...sellForm, power: e.target.value })} placeholder="Güç (HP)" type="number" className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={sellForm.color} onChange={(e) => setSellForm({ ...sellForm, color: e.target.value })} placeholder="Renk" className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
              <input value={sellForm.firstReg} onChange={(e) => setSellForm({ ...sellForm, firstReg: e.target.value })} placeholder="İlk Tescil (örn. 03.2019)" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <textarea value={sellForm.description} onChange={(e) => setSellForm({ ...sellForm, description: e.target.value })} placeholder="Açıklama" rows={3} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none" />
            </div>
            <button onClick={() => submitListing(role)} className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm mt-4 hover:bg-rose-700 transition">{sellForm._editingId ? t("updateListing") : t("publishListing")}</button>
          </div>
        </div>
      )}
      {showJobForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center" onClick={() => setShowJobForm(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md md:max-w-lg rounded-t-3xl md:rounded-3xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-800 flex items-center gap-2"><Briefcase size={18} className="text-rose-500" /> {jobForm._editingId ? "İş İlanını Düzenle" : "Yeni İş İlanı"}</h3><button onClick={() => setShowJobForm(false)} aria-label="Kapat" className="w-9 h-9 -m-2 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition flex-shrink-0"><X size={18} /></button></div>
            <div className="space-y-2">
              <input value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} placeholder="Pozisyon (örn. Motor Ustası)" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <div className="flex gap-2"><select value={jobForm.employmentType} onChange={(e) => setJobForm({ ...jobForm, employmentType: e.target.value })} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm">{EMPLOYMENT_TYPES.map(t2 => <option key={t2}>{t2}</option>)}</select><select value={jobForm.experienceLevel} onChange={(e) => setJobForm({ ...jobForm, experienceLevel: e.target.value })} className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm">{EXPERIENCE_LEVELS.map(ex => <option key={ex}>{ex}</option>)}</select></div>
              <input value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} placeholder="Konum (örn. Kadıköy / İstanbul)" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <div className="flex gap-2"><input value={jobForm.salaryMin} onChange={(e) => setJobForm({ ...jobForm, salaryMin: e.target.value })} type="number" placeholder="Min Maaş (₺, opsiyonel)" className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /><input value={jobForm.salaryMax} onChange={(e) => setJobForm({ ...jobForm, salaryMax: e.target.value })} type="number" placeholder="Max Maaş (₺, opsiyonel)" className="w-1/2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
              <textarea value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} placeholder="Pozisyon açıklaması" rows={3} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none" />
              <textarea value={jobForm.requirements} onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })} placeholder={"Aranan nitelikler (her satıra bir tane)\nÖrn: En az 2 yıl tecrübe\nB sınıfı ehliyet"} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none" />
              <input value={jobForm.skills} onChange={(e) => setJobForm({ ...jobForm, skills: e.target.value })} placeholder="Beceriler (virgülle ayırın, örn. Motor Tamiri, Kaynak)" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
            </div>
            <button disabled={!jobForm.title.trim()} onClick={submitJobListing} className={`w-full py-3 rounded-2xl font-semibold text-sm mt-4 transition ${jobForm.title.trim() ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>{jobForm._editingId ? "İlanı Güncelle" : "İlanı Yayınla"}</button>
          </div>
        </div>
      )}
      {showOfferForm && selectedListing && (() => { const currency = listingCurrency(selectedListing.price); const existingOffer = myPendingOfferOn(selectedListing); const isUpdate = existingOffer && !existingOffer.seen; return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowOfferForm(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-5">
            <div className="flex items-center justify-between mb-1"><h3 className="font-bold text-gray-800">{isUpdate ? "Teklifini Güncelle" : t("makeOffer")}</h3><button onClick={() => setShowOfferForm(false)} aria-label="Kapat" className="w-9 h-9 -m-2 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition flex-shrink-0"><X size={18} /></button></div>
            <p className="text-xs text-gray-400 mb-4">{selectedListing.brand} {selectedListing.model} · {selectedListing.price}</p>
            <input value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} type="number" placeholder={`Teklif tutarı (${currency})`} className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm mb-4" />
            <button disabled={!offerAmount} onClick={submitOffer} className={`w-full py-3 rounded-2xl font-semibold text-sm transition ${offerAmount ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>{isUpdate ? "Teklifi Güncelle" : "Teklifi Gönder"}</button>
          </div>
        </div>
      ); })()}
      {showListingMsgForm && (<div className="fixed inset-0 bg-black/40 z-[60] flex items-end md:items-center justify-center" onClick={() => setShowListingMsgForm(false)}><div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-5"><div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-800">{t("messageSeller")}</h3><button onClick={() => setShowListingMsgForm(false)} aria-label="Kapat" className="w-9 h-9 -m-2 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition flex-shrink-0"><X size={18} /></button></div><textarea value={listingMsg} onChange={(e) => setListingMsg(e.target.value)} rows={3} placeholder="Mesajınızı yazın..." className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm mb-4 resize-none" /><button onClick={submitListingMsg} className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition">Gönder</button></div></div>)}
      {showJobApplyForm && selectedJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={closeJobApplyForm}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md rounded-3xl shadow-2xl ring-1 ring-black/5 max-h-[88vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><Briefcase size={18} className="text-rose-500" /> Başvuru</h3>
              <button onClick={closeJobApplyForm} aria-label="Kapat" className="w-9 h-9 -m-2 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition flex-shrink-0"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="text-xs text-gray-400 mb-4">{selectedJob.title} · {selectedJob.mechanicName}</p>
              <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><User size={13} className="text-gray-400" /> Başvuru Bilgileriniz</h4>
              <div className="space-y-2 mb-4">
                <input value={jobApplyInfo.name} onChange={(e) => setJobApplyInfo(i => ({ ...i, name: e.target.value }))} placeholder="Ad Soyad *" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                <div className="flex gap-2">
                  <div className="w-1/2"><input value={jobApplyInfo.phone} onChange={(e) => setJobApplyInfo(i => ({ ...i, phone: e.target.value }))} placeholder="Telefon (+90 / +49) *" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />{jobApplyInfo.phone.trim() && !jobApplyPhoneCheck.valid && <p className="text-[10px] text-red-500 mt-1">{jobApplyPhoneCheck.message}</p>}</div>
                  <div className="w-1/2"><input value={jobApplyInfo.email} onChange={(e) => setJobApplyInfo(i => ({ ...i, email: e.target.value }))} placeholder="E-posta *" type="email" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />{jobApplyInfo.email.trim() && !jobApplyEmailValid && <p className="text-[10px] text-red-500 mt-1">Geçersiz e-posta.</p>}</div>
                </div>
                <input value={jobApplyInfo.address} onChange={(e) => setJobApplyInfo(i => ({ ...i, address: e.target.value }))} placeholder="Adres *" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
              </div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Ön Yazı (opsiyonel)</h4>
              <textarea value={jobApplyMsg} onChange={(e) => setJobApplyMsg(e.target.value)} rows={3} placeholder="Kendinizden ve deneyiminizden kısaca bahsedin..." className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm mb-4 resize-none" />
              <h4 className="text-xs font-semibold text-gray-700 mb-2">CV *</h4>
              <input ref={cvFileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleCvSelect} className="hidden" />
              {jobApplyCv ? (
                <div className="flex items-center justify-between gap-2 bg-rose-50 rounded-xl px-3 py-2.5">
                  <span className="flex items-center gap-2 text-xs text-rose-700 min-w-0"><FileText size={15} className="flex-shrink-0" /><span className="truncate">{jobApplyCv.name}</span></span>
                  <button onClick={removeCv} aria-label="CV'yi kaldır" className="text-rose-400 hover:text-red-500 flex-shrink-0 p-2 -m-2"><X size={15} /></button>
                </div>
              ) : (
                <button onClick={() => cvFileRef.current?.click()} className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 text-gray-500 rounded-xl py-2.5 text-xs font-medium hover:bg-gray-50 transition"><Paperclip size={14} /> CV Yükle (PDF, DOC)</button>
              )}
              <p className="text-[10px] text-gray-300 mt-2">* zorunlu alanlar</p>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
              <button disabled={!jobApplyReady} onClick={submitJobApplication} className={`w-full py-3 rounded-2xl font-semibold text-sm transition ${jobApplyReady ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>Başvuruyu Gönder</button>
            </div>
          </div>
        </div>
      )}
      {reviewingApptId && (() => { const revAppt = appointments.find(a => a.id === reviewingApptId); return (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-end md:items-center justify-center" onClick={() => setReviewingApptId(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-5">
            <div className="flex items-center justify-between mb-1"><h3 className="font-bold text-gray-800">Yorum Yap</h3><button onClick={() => setReviewingApptId(null)} aria-label="Kapat" className="w-9 h-9 -m-2 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition flex-shrink-0"><X size={18} /></button></div>
            <p className="text-xs text-gray-400 mb-4">{revAppt?.mechanicName}</p>
            <div className="flex items-center gap-1.5 mb-4 justify-center">{[1, 2, 3, 4, 5].map(n => (<button key={n} onClick={() => setReviewForm(f => ({ ...f, rating: n }))}><Star size={30} className={n <= reviewForm.rating ? "text-gray-900 fill-gray-900" : "text-gray-200 fill-gray-200"} /></button>))}</div>
            <textarea value={reviewForm.comment} onChange={(e) => setReviewForm(f => ({ ...f, comment: e.target.value }))} rows={3} placeholder="Deneyiminizi paylaşın..." className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm mb-4 resize-none" />
            <button onClick={submitReview} className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition">Gönder</button>
          </div>
        </div>
      ); })()}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-end md:items-center justify-center" onClick={closePasswordModal}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-800 flex items-center gap-2"><Lock size={18} /> Şifre Değiştir</h3><button onClick={closePasswordModal} aria-label="Kapat" className="w-9 h-9 -m-2 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition flex-shrink-0"><X size={18} /></button></div>
            <div className="space-y-2">
              <input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm(f => ({ ...f, current: e.target.value }))} placeholder="Mevcut Şifre" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <input type="password" value={passwordForm.next} onChange={(e) => setPasswordForm(f => ({ ...f, next: e.target.value }))} placeholder="Yeni Şifre" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Yeni Şifre (Tekrar)" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
            </div>
            <button onClick={submitPasswordChange} className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm mt-4 hover:bg-rose-700 transition">Şifreyi Güncelle</button>
          </div>
        </div>
      )}
      {showNewTicketForm && (
        <div style={{ zIndex: 9999 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center p-4" onClick={() => setShowNewTicketForm(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-sm rounded-t-3xl md:rounded-3xl p-5 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1"><h3 className="text-base font-bold text-gray-900">Yeni Destek Talebi</h3><button onClick={() => setShowNewTicketForm(false)} aria-label="Kapat" className="w-9 h-9 -m-2 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition flex-shrink-0"><X size={18} /></button></div>
            <p className="text-xs text-gray-400 mb-4">Konunu kısaca özetle, ekibimiz en kısa sürede dönüş yapacak.</p>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">Talep Türü</label>
                <select value={newTicketForm.type} onChange={(e) => setNewTicketForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm">
                  {Object.entries(ADMIN_TICKET_TYPE_LABELS).map(([k, label]) => (<option key={k} value={k}>{label}</option>))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">Konu</label>
                <input value={newTicketForm.subject} onChange={(e) => setNewTicketForm(f => ({ ...f, subject: e.target.value }))} placeholder="Örn. Kapora iade edilmedi" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">Açıklama</label>
                <textarea value={newTicketForm.description} onChange={(e) => setNewTicketForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder="Yaşadığın sorunu detaylı anlat..." className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">İlgili Randevu / İlan / Tamirci No (opsiyonel)</label>
                <input value={newTicketForm.relatedNote} onChange={(e) => setNewTicketForm(f => ({ ...f, relatedNote: e.target.value }))} placeholder="Örn. İlan #503 veya Tamirci #12" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
                <p className="text-[10px] text-gray-300 mt-1">İlan/tamirci numarasını, o ilanın veya tamircinin sayfasında görebilirsin.</p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowNewTicketForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">Vazgeç</button>
              <button onClick={submitSupportTicket} className="flex-1 bg-rose-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-rose-700 transition">Gönder</button>
            </div>
          </div>
        </div>
      )}
      {showDeleteAccountModal && (() => { const deleteReady = deleteConfirmText.trim().toLocaleUpperCase("tr-TR") === "SİL"; const closeDeleteModal = () => { setShowDeleteAccountModal(false); setDeleteConfirmText(""); }; return (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-end md:items-center justify-center" onClick={closeDeleteModal}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-5">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-3 mx-auto"><Trash2 size={26} className="text-red-500" /></div>
            <h3 className="font-bold text-gray-800 text-center mb-1">{role === "mechanic" ? "İşletmeni" : "Hesabını"} silmek istediğine emin misin?</h3>
            <p className="text-xs text-gray-400 text-center mb-4">Bu işlem geri alınamaz. Tüm {role === "mechanic" ? "ilanların ve randevu geçmişin" : "araçların, randevuların ve sohbetlerin"} kalıcı olarak silinir.</p>
            <div className="bg-red-50 rounded-xl p-3 mb-4">
              <p className="text-xs text-gray-600 text-center mb-2">Onaylamak için kutuya <span className="font-bold text-red-600">SİL</span> yazın</p>
              <input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="SİL" className="w-full px-3 py-2.5 rounded-xl border border-red-200 text-sm text-center font-semibold tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-red-300" />
            </div>
            <div className="flex gap-2">
              <button onClick={closeDeleteModal} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition">{t("cancel")}</button>
              <button disabled={!deleteReady} onClick={confirmDeleteAccount} className={`flex-1 py-3 rounded-2xl font-semibold text-sm transition ${deleteReady ? "bg-red-500 text-white hover:bg-red-600" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>Evet, Sil</button>
            </div>
          </div>
        </div>
      ); })()}
    </div>
  );
}
