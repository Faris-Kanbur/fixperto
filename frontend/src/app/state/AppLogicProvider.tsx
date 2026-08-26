import { useState, useMemo, useRef, useEffect, createContext, useContext } from "react";
import { Search, MapPin, Star, Clock, Calendar, ChevronLeft, Check, User, Wrench, Mail, Lock, Eye, EyeOff, Phone, Car, Plus, History, ChevronRight, CircleDot, CheckCircle2, MessageCircle, Image as ImageIcon, Send, Globe, Banknote, ClipboardList, Settings, Bell, X, ThumbsUp, ThumbsDown, Users, Wrench as ToolIcon, Navigation, Pencil, Trash2, Save, SlidersHorizontal, Map as MapIcon, BadgeCheck, Camera, Gauge, Tag, Compass, Heart, Fuel, Cog, Zap, CalendarDays, Palette, Briefcase, GraduationCap, FileText, Paperclip, Shield, Menu, LayoutDashboard, LifeBuoy, LogOut, Ban, AlertTriangle, ShieldAlert, TrendingUp, Megaphone, Flag, Share2 } from "lucide-react";
import { api } from "../../services/api/client";
import { T, useT } from "../../data/i18n";
import {
  BANNER_PRESETS, ONBOARDING_SLIDES, DAY_KEYS, DAY_LABELS, DAY_LABELS_FULL, JS_DAY_TO_KEY,
  FUEL_TYPES, TRANSMISSIONS, EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, EMPTY_JOB_FORM, DEFAULT_HOURS,
  PRICE_LEVEL_BREAKS, MY_MECHANIC_ID, MY_OWNER_ID, TRACK_STATUSES_MANUAL, TRACK_LABELS_MANUAL,
  TRACK_STATUSES_AUTO, TRACK_LABELS_AUTO, TODAY, TODAY_STR, FIXED_PRICE_KEYWORDS, VARIABLE_PRICE_KEYWORDS,
  ATU_FIXED_CATALOG, DICT_TR_EN, DICT_EN_TR, LEGAL_TIRE_RULES, DE_CITIES, REMINDER_KIND_LABELS,
  FREE_QUOTE_MECH_LIMIT, PREMIUM_QUOTE_MECH_LIMIT, LEGAL_CONTENT,
  ADMIN_TICKET_TYPE_LABELS, ADMIN_TICKET_STATUS_LABELS, ADMIN_TICKET_PRIORITY_LABELS,
  ADMIN_TICKET_PRIORITY_WEIGHT, ADMIN_TICKET_TYPE_DEFAULT_PRIORITY, TR_ASCII_MAP,
  PLATFORM_COMMISSION_RATE, ADMIN_TREND_DATA, ADMIN_SLA_DAYS,
} from "../../data/constants";
import {
  jobStatusMeta, genSlots, getDaySlots, formatHoursText, parseListingPrice, isOpenNowByHoursText,
  priceLevel, haversineDistanceKm, isValidDateStr, isFixedPriceService, parsePriceNumber,
  listingCurrency, isValidEmail, validatePhone, computeReminders, mockTranslate, statusColor,
  isImgUrl, monthsBetween, initials, listingStatusMeta, slugifyForEmail, ticketDaysOpen, ticketSlaBreached,
} from "../../utils/helpers";
import { PriceLevelDots } from "../../components/ui/PriceLevelDots";
import { MiniBarChart } from "../../components/ui/MiniBarChart";

// Basit istemci-taraflı sıra numarası sayaçları (mesaj/randevu/ilan/iş ilanı/değişiklik kaydı/
// destek talebi/teklif isteği/teklif id'leri) — backend'deki gerçek id'ler INSERT sırasında
// otomatik atanıyor, bunlar sadece bu oturumda henüz kaydedilmemiş taslak nesneler için kullanılıyor.
let msgId = 1000, apptId = 200, listingId = 500, jobListingId = 800, adminChangeLogId = 1, supportTicketId = 8001, quoteReqId = 5000, quoteOfferId = 9000;

// ---------------------------------------------------------------------------
// useAppLogic: TÜM uygulama state'i ve business logic'i (eskiden App.jsx'in
// içinde tanımlıydı). Mekanik olarak buraya taşındı; iç mantık DEĞİŞTİRİLMEDİ.
// Bu, "App.jsx içinde business logic olmasın" refactor'ünün ilk ve en güvenli
// adımı: davranışı bire bir koruyarak state'i component'ten ayırıyor. Bu tek
// büyük hook'un ileride (gerçek tarayıcıda test edilebildiğinde) daha küçük,
// domain'e özel hook'lara (useAuth, useAppointments, useQuotes, vb.) bölünmesi
// önerilir — bkz. proje kökündeki REFACTOR_REPORT.md.
// ---------------------------------------------------------------------------
function useAppLogic() {
  const [lang, setLang] = useState("tr");
  const t = useT(lang);
  const [screen, setScreen] = useState("home");
  const [role, setRole] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [ownerTab, setOwnerTab] = useState("search");
  const [ownerMode, setOwnerMode] = useState("mechanics");
  const [ownerSettings, setOwnerSettings] = useState({ smartReminders: true, notifyAppointments: true, notifyOffers: true, notifyMessages: true });
  // Tamirci tarafının kendi bildirim tercihleri — hepsi varsayılan olarak açık.
  const [mechSettings, setMechSettings] = useState({ notifyAppointments: true, notifyOffers: true, notifyMessages: true, notifyJobApplications: true });
  // Uygulama-içi bildirim kaydı: tarayıcı bildirim izni verilmemiş/desteklenmiyor olsa bile
  // kullanıcının bildirimi görebilmesi için (zil ikonu + rozet) permission-bağımsız bir yedek.
  const [notifLog, setNotifLog] = useState([]);
  const [ownerNotifSeenAt, setOwnerNotifSeenAt] = useState(0);
  const [mechNotifSeenAt, setMechNotifSeenAt] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  // Karanlık mod: cihaz/görünüm tercihi olarak ele alınıyor, hem araç sahibi hem tamirci ayarlarından
  // aynı paylaşılan state'e erişip açıp kapatabiliyor.
  const [darkMode, setDarkMode] = useState(false);
  const ownerPhotoRef = useRef(null);
  const [ownerProfileTab, setOwnerProfileTab] = useState("info");
  const [showMapMobile, setShowMapMobile] = useState(false);
  const [hoveredPinId, setHoveredPinId] = useState(null);
  const [mapPreviewItem, setMapPreviewItem] = useState(null);
  useEffect(() => { setHoveredPinId(null); setMapPreviewItem(null); }, [ownerMode]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({ priceTier: "all", minRating: 0, maxDistance: 999, brand: "", service: "" });
  const [listingFilters, setListingFilters] = useState({ transmission: "all", fuelType: "all", minPrice: "", maxPrice: "", minKm: "", maxKm: "", minYear: "", maxYear: "" });
  const [listingSort, setListingSort] = useState("default");
  const [listingSortDir, setListingSortDir] = useState("asc");
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle");
  const [notifPermission, setNotifPermission] = useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");
  const [favoriteIds, setFavoriteIds] = useState([]);
  const toggleFavorite = (id) => {
    setFavoriteIds(f => {
      const next = f.includes(id) ? f.filter(x => x !== id) : [...f, id];
      persist(api.owners.update(MY_OWNER_ID, { favoriteIds: next }), "Favori kaydedilemedi");
      return next;
    });
  };
  const [mechanicsList, setMechanicsList] = useState([]);
  const [mechanicHours, setMechanicHours] = useState(DEFAULT_HOURS);
  const [query, setQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [sortBy, setSortBy] = useState("distance");
  const [sortDir, setSortDir] = useState("asc");
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [selectedMechanicId, setSelectedMechanicId] = useState(null);
  const [mapDetailOpen, setMapDetailOpen] = useState(false);
  const openMapDetail = (m) => { setSelectedMechanicId(m.id); setMapDetailOpen(true); };
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [problemDesc, setProblemDesc] = useState("");
  const [problemPhotos, setProblemPhotos] = useState([]);
  const problemPhotoRef = useRef(null);
  const addProblemPhoto = (e) => { const file = e.target.files?.[0]; if (!file) return; setProblemPhotos(p => [...p, URL.createObjectURL(file)]); e.target.value = ""; };
  const removeProblemPhoto = (idx) => setProblemPhotos(p => p.filter((_, i) => i !== idx));
  const quotePhotoRef = useRef(null);
  const addQuotePhoto = (e) => { const file = e.target.files?.[0]; if (!file) return; setQuotePhotos(p => [...p, URL.createObjectURL(file)]); e.target.value = ""; };
  const removeQuotePhoto = (idx) => setQuotePhotos(p => p.filter((_, i) => i !== idx));
  const [approveExpensiveService, setApproveExpensiveService] = useState(false);
  const [shareHistoryConsent, setShareHistoryConsent] = useState(true);
  const [bookingService, setBookingService] = useState(null);
  const [bookingServiceSearch, setBookingServiceSearch] = useState("");
  const [selectedBookingVehicleId, setSelectedBookingVehicleId] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ method: "card", cardNumber: "", expiry: "", cvc: "" });
  const [reviewingApptId, setReviewingApptId] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [legalModalTopic, setLegalModalTopic] = useState(null);
  // "detail" ekranına (bir tamircinin profili) hangi ekrandan girildiğini hatırlar, böylece geri
  // butonu her zaman aynı sabit ekrana değil, gerçekten geldiği yere döner (örn. kendi profilini
  // "Sayfamı Önizle" ile açan tamirci, geri tıkladığında arama sonuçlarına değil kendi profil
  // sayfasına dönmeli).
  const [detailReturnScreen, setDetailReturnScreen] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  // ---- Araç sahibi / tamirci tarafından oluşturulan destek talebi (şikayet/yardım talebi) ----
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({ type: "quality", subject: "", description: "", relatedNote: "" });
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [ownerDangerZoneOpen, setOwnerDangerZoneOpen] = useState(false);
  const [mechDangerZoneOpen, setMechDangerZoneOpen] = useState(false);
  const [ownerNotifDetailsOpen, setOwnerNotifDetailsOpen] = useState(false);
  const [mechNotifDetailsOpen, setMechNotifDetailsOpen] = useState(false);
  const [ownerAccountOpen, setOwnerAccountOpen] = useState(false);
  const [mechAccountOpen, setMechAccountOpen] = useState(false);
  const [mechPaymentInfoOpen, setMechPaymentInfoOpen] = useState(false);
  const [reschedulingApptId, setReschedulingApptId] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(null);
  const [rescheduleTime, setRescheduleTime] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || null;
  const [showMaintenanceHistory, setShowMaintenanceHistory] = useState(false);
  useEffect(() => { setShowMaintenanceHistory(false); }, [selectedVehicleId]);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ brand: "", model: "", year: "", plate: "", country: "tr", city: "", tireType: "mevsimlik", lastInspection: "", lastMaintenance: "", insuranceEnd: "" });
  const [editingReminderKind, setEditingReminderKind] = useState(null);
  const [reminderEditForm, setReminderEditForm] = useState({ enabled: true, customDate: "", leadDays: "" });
  const [showAddReminderForm, setShowAddReminderForm] = useState(false);
  const [newReminderForm, setNewReminderForm] = useState({ title: "", date: "", leadDays: "7" });
  const [showEditVehicle, setShowEditVehicle] = useState(false);
  const [editVehicleForm, setEditVehicleForm] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [autoAccept, setAutoAccept] = useState(true);
  const [toast, setToast] = useState(null);
  const [successPulse, setSuccessPulse] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardStep, setOnboardStep] = useState(0);
  const [showDayFullPrompt, setShowDayFullPrompt] = useState(false);
  const [dayFullNotified, setDayFullNotified] = useState(false);
  const [completingApptId, setCompletingApptId] = useState(null);
  const [warrantyDaysForm, setWarrantyDaysForm] = useState("");
  const [replyingReviewId, setReplyingReviewId] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");
  // Onboarding sadece ilk kayıt (signup) sırasında bir kereliğine gösterilir — normal girişte (login) tekrar açılmaz.
  // Gösterildiğinde, kullanıcı giriş/kayıt yaptıktan sonra kendi ana ekranında (araç sahibi "owner" ya da tamirci "mechanicDashboard") modal olarak açılır.
  const onboardingVisible = showOnboarding && (screen === "owner" || screen === "mechanicDashboard");
  // Onboarding modalı açıkken arka planın (ev ekranının) kaymasını/kaydırılmasını engelle —
  // aksi halde yarı saydam arka plan üzerinden arkadaki içerik kayarken görünüp karışık/bozuk görünüyordu.
  useEffect(() => {
    if (!onboardingVisible) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [onboardingVisible]);
  const [smsLog, setSmsLog] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConvoId, setActiveConvoId] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [showTranslated, setShowTranslated] = useState({});
  const fileInputRef = useRef(null);
  const [mechActiveConvoId, setMechActiveConvoId] = useState(null);
  const [mechChatInput, setMechChatInput] = useState("");
  const [mechTab, setMechTab] = useState("requests");
  const [mechProfileTab, setMechProfileTab] = useState("profile");
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  const [newServiceForm, setNewServiceForm] = useState({ name: "", price: "", fixed: false, fixedTouched: false });
  const [duplicateServiceWarning, setDuplicateServiceWarning] = useState(null);
  const [mechReqView, setMechReqView] = useState("active");
  const [mechAnalyticsView, setMechAnalyticsView] = useState("overview");
  const [expandedCustomerHistory, setExpandedCustomerHistory] = useState(null);
  const [historyExpandedDate, setHistoryExpandedDate] = useState(null);
  const [ownerApptView, setOwnerApptView] = useState("active");
  const [ownerHistoryExpandedDate, setOwnerHistoryExpandedDate] = useState(null);
  const [quoteRequests, setQuoteRequests] = useState([]);
  const [quoteOffers, setQuoteOffers] = useState([]);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteVehicleId, setQuoteVehicleId] = useState(null);
  const [quoteIssue, setQuoteIssue] = useState("");
  const [quotePhotos, setQuotePhotos] = useState([]);
  const [quoteSelectedMechIds, setQuoteSelectedMechIds] = useState([]);
  const [quoteMechSearch, setQuoteMechSearch] = useState("");
  const [quotePremiumUnlocked, setQuotePremiumUnlocked] = useState(false);
  const [showQuotePremiumUpsell, setShowQuotePremiumUpsell] = useState(false);
  const [respondingQuoteOfferId, setRespondingQuoteOfferId] = useState(null);
  const [quoteOfferForm, setQuoteOfferForm] = useState({ price: "", etaDays: "", note: "" });
  const [expandedQuoteReqId, setExpandedQuoteReqId] = useState(null);
  const [pendingQuoteAccept, setPendingQuoteAccept] = useState(null);
  const coverFileRef = useRef(null);
  const staffFileRefs = useRef({});
  const [expandedDay, setExpandedDay] = useState(null);
  const [newSlotTime, setNewSlotTime] = useState("");
  const [listings, setListings] = useState([]);
  const [showSellForm, setShowSellForm] = useState(false);
  const [showSellVehiclePicker, setShowSellVehiclePicker] = useState(false);
  const [sellForm, setSellForm] = useState({ brand: "", model: "", year: "", km: "", price: "", description: "", photo: "🚗", fuelType: "Benzin", transmission: "Manuel", power: "", firstReg: "", color: "", bodyType: "", engineSize: "", drivetrain: "", ownerCount: "", paintedParts: "", changedParts: "", tradeIn: false, doorCount: "", features: [], photos: [], seatCount: "", fuelConsumption: "", co2Emission: "", emissionClass: "", batteryCapacity: "", rangeKm: "", city: "", _vehicleId: null, _editingId: null });
  const sellPhotoRef = useRef(null);
  const [selectedListingId, setSelectedListingId] = useState(null);
  // İlan detay modalındaki fotoğraf galerisi için seçili küçük resim indeksi — yeni bir ilan
  // açıldığında sıfırlanır (bkz. aşağıdaki useEffect), aksi halde bir önceki ilanın 3. fotoğrafı
  // açıkken yeni ilana geçilince aynı indeks kalır ve dizi sınırını aşabilir.
  const [selectedListingPhotoIndex, setSelectedListingPhotoIndex] = useState(0);
  useEffect(() => { setSelectedListingPhotoIndex(0); }, [selectedListingId]);
  // Tam ekran fotoğraf galerisi (lightbox) — ilan detayındaki ana fotoğrafa
  // tıklanınca açılır, aynı selectedListingPhotoIndex'i kullanarak küçük
  // galeriyle senkron kalır.
  const [listingLightboxOpen, setListingLightboxOpen] = useState(false);
  useEffect(() => { setListingLightboxOpen(false); }, [selectedListingId]);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [showListingMsgForm, setShowListingMsgForm] = useState(false);
  const [listingMsg, setListingMsg] = useState("");
  const [jobListings, setJobListings] = useState([]);
  const [jobFilters, setJobFilters] = useState({ employmentType: "all", experienceLevel: "all" });
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState(EMPTY_JOB_FORM);
  const [showJobApplyForm, setShowJobApplyForm] = useState(false);
  const [jobApplyMsg, setJobApplyMsg] = useState("");
  const [jobApplyCv, setJobApplyCv] = useState(null);
  const [jobApplyInfo, setJobApplyInfo] = useState({ name: "", phone: "", email: "", address: "" });
  const [myApplications, setMyApplications] = useState([]);
  const cvFileRef = useRef(null);
  const [mechListingsSubTab, setMechListingsSubTab] = useState("cars");
  // ---- Admin (site sahibi) paneli state'i ----
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: "", password: "" });
  const [adminError, setAdminError] = useState("");
  // Girişin backend'e giderken tekrar tekrar tıklanmasını (duplicate submit) önlemek için.
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminTab, setAdminTab] = useState("dashboard");
  // Paylaşım analitiği (kanal bazında paylaşım/tıklama/dönüşüm) sadece admin Analitik sekmesi
  // açıldığında çekilir — her uygulama açılışında tüm kullanıcılar için gereksiz yere yüklenmesin.
  const [shareStats, setShareStats] = useState(null);
  const [viewStats, setViewStats] = useState(null);
  useEffect(() => {
    if (adminAuthed && adminTab === "analytics") {
      api.shareEvents.stats().then(setShareStats).catch(() => { /* sessizce geç — sadece analitik */ });
      api.profileViews.stats().then(setViewStats).catch(() => { /* sessizce geç — sadece analitik */ });
    }
  }, [adminAuthed, adminTab]);
  const [adminUserTypeFilter, setAdminUserTypeFilter] = useState("all");
  const [adminUserSearch, setAdminUserSearch] = useState("");
  const [selectedAdminUser, setSelectedAdminUser] = useState(null);
  const [adminEditForm, setAdminEditForm] = useState(null);
  const [adminProfileViewUser, setAdminProfileViewUser] = useState(null);
  const [editingProfileField, setEditingProfileField] = useState(null);
  const [profileFieldDraft, setProfileFieldDraft] = useState("");
  const [profilePasswordDraft, setProfilePasswordDraft] = useState("");
  const [adminAnalyzeUserKey, setAdminAnalyzeUserKey] = useState(null);
  const [expandedAdminListingId, setExpandedAdminListingId] = useState(null);
  const [expandedAdminJobId, setExpandedAdminJobId] = useState(null);
  const [ownersDirectory, setOwnersDirectory] = useState([]);
  const [mechanicAdminOverrides, setMechanicAdminOverrides] = useState({});
  // ---- Oturum açmış araç sahibinin canlı profili — tamirci tarafındaki myProfile ile aynı
  // mantık: tek gerçek kaynak ownersDirectory, admin panelinden yapılan her değişiklik anında
  // burada da görünür; araç sahibinin kendi profil ekranından yaptığı düzenlemeler de aynı
  // kayda yazılır, böylece admin panelinde de anında görünür (iki yönlü canlı senkron). ----
  const ownerProfile = ownersDirectory.find(o => o.id === MY_OWNER_ID) || { name: "", photo: "", email: "", phone: "", address: "" };
  const updateMyOwnerField = (field, value) => setOwnersDirectory(list => list.map(o => o.id === MY_OWNER_ID ? { ...o, [field]: value } : o));
  const updateMyOwnerFields = (patch) => setOwnersDirectory(list => list.map(o => o.id === MY_OWNER_ID ? { ...o, ...patch } : o));
  // Araç sahibinin sohbet mesajlarının hangi dilde etiketleneceği (karşı taraf otomatik çeviri
  // görecek — bkz. ChatBubble). Önceden ayrı, hiçbir yerden ayarlanamayan bir useState'ti (her
  // zaman "tr"de kalıp sıfırlanıyordu) — artık ownerProfile.lang'tan türetiliyor ve
  // updateMyOwnerField ile diğer profil alanları gibi gerçekten kalıcı.
  const ownerLang = ownerProfile.lang || "tr";
  const setOwnerLang = (value) => { updateMyOwnerField("lang", value); persist(api.owners.update(MY_OWNER_ID, { lang: value }), "Dil tercihi kaydedilemedi"); };
  // Randevu "sorun açıklaması" / çoklu teklif notu gibi, sohbet dışındaki serbest metinler her
  // zaman metni YAZAN araç sahibinin o anki diliyle etiketlenmelidir (bkz. TranslatedText.tsx) —
  // appointment/quoteRequest kayıtlarındaki ownerId'den ownersDirectory'de canlı dil ayarına
  // bakıyoruz (ownerProfile'ın MY_OWNER_ID için aynı mantığı kullandığı gibi).
  const ownerLangFor = (ownerId) => ownersDirectory.find(o => o.id === ownerId)?.lang || "tr";
  const [supportTickets, setSupportTickets] = useState([]);
  // --- Backend bootstrap: hydrate the core entities from the Express + SQLite API on mount ---
  // (replaces the single-file demo's hardcoded MECHANICS_INITIAL / INITIAL_* mock arrays).
  const [apiReady, setApiReady] = useState(false);
  const [apiError, setApiError] = useState(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [mechanicsRes, vehiclesRes, appointmentsRes, listingsRes, jobsRes, ownersRes, ticketsRes, quoteRequestsRes, quoteOffersRes, conversationsRes, changeLogRes, broadcastsRes] = await Promise.all([
          api.mechanics.list(),
          api.vehicles.list(),
          api.appointments.list(),
          api.listings.list(),
          api.jobs.list(),
          api.owners.list(),
          api.tickets.list(),
          api.quoteRequests.list(),
          api.quoteOffers.list(),
          api.conversations.list(),
          api.admin.changeLog(),
          api.broadcasts.list(),
        ]);
        if (cancelled) return;
        setMechanicsList(mechanicsRes);
        setVehicles(vehiclesRes);
        setAppointments(appointmentsRes);
        setListings(listingsRes);
        setJobListings(jobsRes);
        setOwnersDirectory(ownersRes);
        const myOwnerRow = ownersRes.find((o) => o.id === MY_OWNER_ID);
        if (myOwnerRow?.favoriteIds) setFavoriteIds(myOwnerRow.favoriteIds);
        setSupportTickets(ticketsRes);
        setQuoteRequests(quoteRequestsRes);
        setQuoteOffers(quoteOffersRes);
        setConversations(conversationsRes);
        // Admin duyuruları — önceden sadece local state'te tutuluyor, sayfa yenilenince
        // kayboluyordu (bkz. sendBroadcast); artık backend'den gelen gerçek kayıtlarla dolduruluyor.
        setBroadcastLog((broadcastsRes || []).map((b: any) => ({
          id: b.id,
          audience: b.audience,
          message: b.message,
          recipientCount: b.recipientCount,
          date: b.createdAt ? new Date(`${b.createdAt.replace(" ", "T")}Z`).toLocaleDateString("tr-TR") : "",
        })));
        // admin_change_log backend'de genel bir "action/entityType/entityId/before/after/reverted"
        // audit şemasıyla saklanıyor (bkz. logAdminChange, backend/routes/admin.js); burada admin
        // panelin "Geçmiş" ekranının beklediği zengin şekle (targetType/targetId/field/oldValue/
        // newValue/extra/reverted) geri eşliyoruz ki sayfa yenilenince geçmiş kaybolmasın.
        const mappedChangeLog = (changeLogRes || []).map((r: any) => {
          const rawId = r.entityId;
          const targetId = rawId !== undefined && rawId !== null && rawId !== "" && !Number.isNaN(Number(rawId)) ? Number(rawId) : rawId;
          const createdAt = r.createdAt ? new Date(`${r.createdAt.replace(" ", "T")}Z`) : null;
          return {
            id: r.id,
            date: createdAt && !Number.isNaN(createdAt.getTime())
              ? createdAt.toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
              : "",
            reverted: !!r.reverted,
            targetType: r.entityType,
            targetId,
            field: r.before?.field ?? r.after?.field,
            oldValue: r.before?.value,
            newValue: r.after?.value,
            extra: r.before?.extra ?? r.after?.extra,
          };
        });
        setAdminChangeLog(mappedChangeLog);
        // Yeni yerel (iyimser) kayıtların, sunucudan gelen gerçek id'lerle çakışmaması için sayaç,
        // hâlihazırda yüklenen en büyük id'nin üstüne konumlanıyor.
        if (mappedChangeLog.length) adminChangeLogId = Math.max(adminChangeLogId, ...mappedChangeLog.map((e) => (typeof e.id === "number" ? e.id : 0)) ) + 1;
        setApiReady(true);
      } catch (err) {
        if (!cancelled) setApiError(err.message || "Backend'e bağlanılamadı.");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Arka planda backend'e kalıcı hale getirme yardımcı fonksiyonu: yerel state güncellemesi
  // senkron/anında kalsın diye (mevcut UX bozulmasın), API çağrısı ARKA PLANDA yapılır.
  // Başarısız olursa kullanıcıya toast ile haber verilir (veri sessizce kaybolmasın).
  const persist = (promise, failMessage) => {
    promise.catch((err) => {
      if (typeof window !== "undefined" && (import.meta as any)?.env?.DEV) console.error("[persist]", failMessage, err);
      setToast({ type: "info", text: `⚠️ ${failMessage}: ${err?.message || "Sunucuya kaydedilemedi."}` });
    });
  };

  // ShareButton'da (mekanik profili, araç ilanı, iş ilanı) gerçek bir paylaşım eylemi olduğunda
  // (WhatsApp/Facebook/X/e-posta linkine tıklama, link kopyalama ya da native paylaşım sayfasının
  // başarıyla açılması) çağrılır — hem yerel state'te anında görünsün hem backend'de kalıcı olsun
  // diye sunucudaki atomik POST /:id/share uç noktasını kullanır (bkz. makeCrudRouter.js).
  // Ayrıca ShareButton'ın ürettiği refCode + hangi kanaldan (WhatsApp/Facebook/X/e-posta/kopyalama/
  // native) paylaşıldığı bilgisiyle bir share_events satırı açar — linke tıklama (click) ve sonraki
  // dönüşüm (conversion) bu satıra atfedilecek (bkz. recordConversion, incomingShareRef efekti).
  const recordShare = (targetType, targetId, channel, refCode) => {
    const bump = (list) => list.map((x) => (x.id === targetId ? { ...x, shareCount: (x.shareCount || 0) + 1 } : x));
    if (targetType === "listing") { setListings((ls) => bump(ls)); persist(api.listings.share(targetId), "Paylaşım sayısı kaydedilemedi"); }
    else if (targetType === "job") { setJobListings((js) => bump(js)); persist(api.jobs.share(targetId), "Paylaşım sayısı kaydedilemedi"); }
    else if (targetType === "mechanic") { setMechanicsList((ms) => bump(ms)); persist(api.mechanics.share(targetId), "Paylaşım sayısı kaydedilemedi"); }
    if (channel && refCode) {
      const sharedBy = role === "mechanic" ? myProfile?.name : ownerProfile?.name;
      persist(api.shareEvents.create({ targetType, targetId, channel, refCode, sharedBy }), "Paylaşım kaydı oluşturulamadı");
    }
  };
  // Bir ziyaretçi, ?ref=<kod> parametresi taşıyan paylaşılmış bir linkle uygulamaya geldiğinde bu
  // efekt bir kez çalışır: tıklamayı backend'e bildirir (clickCount) ve refCode'u state'te tutar ki
  // ziyaretçi sohbet başlatma/randevu alma/teklif verme/iş başvurusu gibi bir eyleme geçtiğinde
  // recordConversion ile aynı satıra dönüşüm olarak yazılabilsin (tek seferlik atıf).
  const [incomingShareRef, setIncomingShareRef] = useState(null);
  // Paylaşılan link tıklanınca ilgili kayda otomatik gitsin diye (bkz. ShareButton'daki path
  // yorumu): ?listing=/?mechanic=/?job= parametrelerini bir kez okuyup bir ref'te saklıyoruz.
  // Hemen tüketmiyoruz çünkü bu noktada kullanıcı henüz rol seçip giriş yapmamış olabilir
  // (uygulama her zaman "home" ekranıyla başlar) — aşağıdaki ayrı efekt, kullanıcı kendi ana
  // ekranına (owner/mechanicDashboard) ulaştığında bunu tüketip ilgili kaydı açıyor.
  const pendingDeepLinkRef = useRef(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const refFromUrl = params.get("ref");
    if (refFromUrl) {
      setIncomingShareRef(refFromUrl);
      api.shareEvents.click(refFromUrl).catch(() => { /* sessizce geç — bu sadece analitik */ });
    }
    const listingIdFromUrl = params.get("listing");
    const mechanicIdFromUrl = params.get("mechanic");
    const jobIdFromUrl = params.get("job");
    if (listingIdFromUrl) pendingDeepLinkRef.current = { type: "listing", id: Number(listingIdFromUrl) };
    else if (mechanicIdFromUrl) pendingDeepLinkRef.current = { type: "mechanic", id: Number(mechanicIdFromUrl) };
    else if (jobIdFromUrl) pendingDeepLinkRef.current = { type: "job", id: Number(jobIdFromUrl) };
  }, []);
  useEffect(() => {
    if (!pendingDeepLinkRef.current) return;
    if (screen !== "owner" && screen !== "mechanicDashboard") return;
    const { type, id } = pendingDeepLinkRef.current;
    if (Number.isFinite(id)) {
      if (type === "listing") setSelectedListingId(id);
      else if (type === "job") setSelectedJobId(id);
      else if (type === "mechanic") { setSelectedMechanicId(id); setDetailReturnScreen(null); setScreen("detail"); }
    }
    pendingDeepLinkRef.current = null;
  }, [screen]);
  const recordConversion = (action) => {
    if (!incomingShareRef) return;
    persist(api.shareEvents.convert(incomingShareRef), `Dönüşüm kaydedilemedi (${action})`);
    setIncomingShareRef(null);
  };

  // ---- Sayfa görüntülenme (view) takibi: tamirci profili ve araç ilanı her açıldığında bir
  // profile_views satırı açılır. Hangi görüntülemenin şu an "aktif" olduğunu (yani bir sonraki
  // randevu/teklif bu görüntülemeye mi atfedilecek) bir ref'te tutuyoruz — state değil, çünkü her
  // render'da yeniden oluşmasına gerek yok ve gereksiz re-render'a yol açmasın istiyoruz. ----
  const activeMechanicViewIdRef = useRef(null);
  useEffect(() => {
    // Tamirci kendi profiline yönlendirildiğinde (ör. "Yorumlarım") bu bir gerçek ziyaret değil,
    // sayaç şişmesin diye saymıyoruz.
    if (selectedMechanicId == null || selectedMechanicId === MY_MECHANIC_ID) { activeMechanicViewIdRef.current = null; return; }
    api.profileViews.create("mechanic", selectedMechanicId)
      .then((v) => { activeMechanicViewIdRef.current = v.id; })
      .catch(() => { activeMechanicViewIdRef.current = null; });
  }, [selectedMechanicId]);
  useEffect(() => {
    if (selectedListingId == null) return;
    // İlan sahibi kendi ilanını açtığında bu gerçek bir ziyaret değil — tamirci profili için
    // yukarıda uygulanan self-view korumasıyla (activeMechanicViewIdRef efekti) aynı mantık.
    // listings/ownerProfile/myProfile bilerek deps'e eklenmiyor (isMine hesaplayan efektteki
    // yerleşik desenle aynı, bkz. yukarıdaki "selectedListing" efekti) — aksi halde app içinde
    // HERHANGİ bir ilan güncellendiğinde (listings referansı değiştiğinde) bu efekt gereksiz yere
    // yeniden tetiklenip aynı görüntülemeyi tekrar tekrar kaydederdi. Sadece selectedListingId
    // değiştiğinde, o anki en güncel closure değerleriyle bir kez çalışır.
    const listing = listings.find((l) => l.id === selectedListingId);
    const isMine = listing && listing.sellerName === (role === "owner" ? ownerProfile.name : myProfile?.name);
    if (isMine) return;
    api.profileViews.create("listing", selectedListingId).catch(() => { /* sessizce geç — sadece analitik */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedListingId]);
  // Kleinanzeigen tarzı "kaç görüntülenme" rozeti için — ilan sahibi kendi ilanını açtığında kullanılır.
  const [listingViewStats, setListingViewStats] = useState(null);
  useEffect(() => {
    if (selectedListingId == null) { setListingViewStats(null); return; }
    api.profileViews.stats("listing", selectedListingId).then(setListingViewStats).catch(() => setListingViewStats(null));
  }, [selectedListingId]);
  const recordProfileViewConversion = () => {
    if (!activeMechanicViewIdRef.current) return;
    persist(api.profileViews.convert(activeMechanicViewIdRef.current), "Ziyaret dönüşümü kaydedilemedi");
    activeMechanicViewIdRef.current = null;
  };
  // Kleinanzeigen tarzı: bir ilanın kaç farklı kullanıcının favorilerinde olduğu, owners.favoriteIds
  // dizilerinin tamamı taranarak anlık hesaplanıyor — ayrı bir sayaç sütunu tutmaya gerek yok, zaten
  // favoriler backend'de kalıcı (bkz. toggleFavorite).
  const listingFavoriteCount = (listingId) => ownersDirectory.filter((o) => (o.favoriteIds || []).includes(listingId)).length;
  // Tamircinin kendi "Analiz" sekmesindeki "Profil Ziyaretleri" ve "Yıllık Özet Raporu" bölümleri
  // için — sadece o sekme açıldığında çekilir (her uygulama açılışında değil).
  const [myProfileViewStats, setMyProfileViewStats] = useState(null);
  useEffect(() => {
    if (mechTab === "analytics") {
      api.profileViews.stats("mechanic", MY_MECHANIC_ID).then(setMyProfileViewStats).catch(() => { /* sessizce geç — sadece analitik */ });
    }
  }, [mechTab]);

  const [adminTicketStatusFilter, setAdminTicketStatusFilter] = useState("all");
  const [adminTicketTypeFilter, setAdminTicketTypeFilter] = useState("all");
  const [adminTicketPriorityFilter, setAdminTicketPriorityFilter] = useState("all");
  const [adminTicketSearch, setAdminTicketSearch] = useState("");
  // Binlerce talep olsa bile aynı anda tek seferde 25'ten fazlası DOM'a basılmıyor —
  // "Daha Fazla Yükle" ile kademeli açılıyor. Filtre/arama değişince başa dönüyor.
  const [adminTicketVisibleCount, setAdminTicketVisibleCount] = useState(25);
  const [showTicketAnalytics, setShowTicketAnalytics] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [adminTicketNote, setAdminTicketNote] = useState("");
  const [adminReplyDraft, setAdminReplyDraft] = useState("");
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ audience: "all", message: "" });
  // Bootstrap effect'i backend'den gerçek kayıtları yükleyip dolduruyor (bkz. yukarıdaki
  // Promise.all + setBroadcastLog) — burada boş başlıyor ki yüklenmeden önce sahte bir kayıt
  // görünmesin.
  const [broadcastLog, setBroadcastLog] = useState([]);
  // ---- Admin değişiklik geçmişi (audit trail): panelden yapılan HER yazma işlemi burada
  // kaydedilir (eski değer / yeni değer) ve "Geri Al" ile tek tıkla eski haline döndürülebilir. ----
  const [adminChangeLog, setAdminChangeLog] = useState([]);
  useEffect(() => { if (!toast) return; const tm = setTimeout(() => setToast(null), 3200); return () => clearTimeout(tm); }, [toast]);
  useEffect(() => { if (!successPulse) return; const tm = setTimeout(() => setSuccessPulse(null), 1400); return () => clearTimeout(tm); }, [successPulse]);
  const fireSuccessPulse = (text) => setSuccessPulse(text);
  useEffect(() => { if (screen === "booking" && !selectedBookingVehicleId && vehicles.length > 0) setSelectedBookingVehicleId(vehicles[0].id); }, [screen, vehicles, selectedBookingVehicleId]);
  useEffect(() => { if (screen === "booking") { setBookingService(null); setBookingServiceSearch(""); setPaymentForm(f => ({ ...f, method: "card" })); setProblemDesc(""); setProblemPhotos([]); setApproveExpensiveService(false); setShareHistoryConsent(true); } }, [selectedMechanicId]);
  useEffect(() => { if (pendingQuoteAccept && screen === "booking") { setBookingService(pendingQuoteAccept.bookingService); setProblemDesc(pendingQuoteAccept.problemDesc); setProblemPhotos(pendingQuoteAccept.problemPhotos); setPendingQuoteAccept(null); } }, [pendingQuoteAccept, selectedMechanicId, screen]);
  const getEffectiveDistance = (m) => (userLocation && m.lat != null && m.lng != null) ? haversineDistanceKm(userLocation.lat, userLocation.lng, m.lat, m.lng) : m.distance;
  const requestLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) { setLocationStatus("denied"); setToast({ type: "info", text: "📍 Tarayıcınız konum özelliğini desteklemiyor, tahmini mesafeler gösteriliyor." }); return; }
    setLocationStatus("loading");
    let settled = false;
    const finish = (fn) => { if (settled) return; settled = true; fn(); };
    // Bazı ortamlarda (izin politikası engelli iframe vb.) tarayıcı geolocation callback'ini hiç
    // çağırmayabiliyor; bu yüzden dahili timeout'a ek olarak manuel bir güvenlik ağı koyuyoruz,
    // aksi halde "Konumu Paylaş" tıklandığında hiçbir şey olmuyormuş gibi görünüyordu.
    const failSafe = setTimeout(() => finish(() => { setLocationStatus("denied"); setToast({ type: "info", text: "📍 Konum alınamadı, tahmini mesafeler gösteriliyor." }); }), 8000);
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => finish(() => { clearTimeout(failSafe); setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationStatus("granted"); setToast({ type: "info", text: "📍 Konumunuz kullanılarak mesafeler güncellendi." }); }),
        () => finish(() => { clearTimeout(failSafe); setLocationStatus("denied"); setToast({ type: "info", text: "📍 Konum izni verilmedi, tahmini mesafeler gösteriliyor." }); }),
        { enableHighAccuracy: true, timeout: 7000 }
      );
    } catch (e) {
      finish(() => { clearTimeout(failSafe); setLocationStatus("denied"); setToast({ type: "info", text: "📍 Konum alınamadı, tahmini mesafeler gösteriliyor." }); });
    }
  };
  const handleSortClick = (key) => {
    if (sortBy === key) { setSortDir(d => (d === "asc" ? "desc" : "asc")); }
    else { setSortBy(key); setSortDir(key === "rating" ? "desc" : "asc"); }
    if (key === "distance" && !userLocation) setShowLocationPrompt(true);
  };
  const handleListingSortClick = (key) => {
    if (listingSort === key) { setListingSortDir(d => (d === "asc" ? "desc" : "asc")); }
    else { setListingSort(key); setListingSortDir(key === "year" ? "desc" : "asc"); }
  };
  const confirmUseLocation = () => { setShowLocationPrompt(false); requestLocation(); };
  const stopUsingLocation = () => { setUserLocation(null); setLocationStatus("idle"); setToast({ type: "info", text: "📍 Konum kullanımı kapatıldı, tahmini mesafeler gösteriliyor." }); };
  const requestNotifPermission = () => {
    if (typeof Notification === "undefined") { setToast({ type: "info", text: "🔔 Tarayıcınız bildirimleri desteklemiyor." }); return; }
    Notification.requestPermission().then(perm => { setNotifPermission(perm); if (perm === "granted") { setToast({ type: "info", text: "🔔 Bildirimler açıldı." }); try { new Notification("Fixperto", { body: "Bildirimler başarıyla açıldı. Randevu güncellemelerinden haberdar olacaksınız." }); } catch (e) {} } else if (perm === "denied") setToast({ type: "info", text: "🔔 Bildirim izni reddedildi." }); });
  };
  // `allowed` parametresi, ilgili bildirim kategorisi (randevu/teklif/mesaj/başvuru) ayarlardan
  // kapatılmışsa false gelir — o zaman tarayıcı izni olsa da bildirim gönderilmez.
  const fireNotification = (title, body, allowed = true, notifyRole = null, target = null) => {
    if (allowed === false) return;
    // Uygulama-içi kayıt: tarayıcı bildirim izni olsun ya da olmasın, ilgili taraf zil ikonundan
    // her zaman görebilsin diye (izin verilmemişse bildirim tamamen sessizce kaybolmasın).
    // `target`, bildirime tıklanınca nereye gidileceğini tanımlar (örn. { type: "appointment", id }).
    if (notifyRole) setNotifLog(log => [{ id: Date.now() + Math.random(), role: notifyRole, title, body, ts: Date.now(), target }, ...log].slice(0, 40));
    if (typeof Notification !== "undefined" && Notification.permission === "granted") { try { new Notification(title, { body }); } catch (e) {} }
  };
  const selectedMechanic = mechanicsList.find(m => m.id === selectedMechanicId) || null;
  const bookingServiceOptions = useMemo(() => {
    const own = (selectedMechanic?.services || []).map(s => ({ name: s.name, price: s.price, other: false, fixed: s.fixed !== undefined ? !!s.fixed : isFixedPriceService(s.name), fromCatalog: false }));
    const ownKeys = own.map(s => s.name.toLocaleLowerCase("tr-TR"));
    const extras = ATU_FIXED_CATALOG.filter(c => !ownKeys.some(k => k.includes(c.matchKey) || c.matchKey.includes(k))).map(c => ({ name: c.name, price: c.price, other: false, fixed: true, fromCatalog: true }));
    const all = [...own, ...extras];
    const q = bookingServiceSearch.trim().toLocaleLowerCase("tr-TR");
    return q ? all.filter(s => s.name.toLocaleLowerCase("tr-TR").includes(q)) : all;
  }, [selectedMechanic, bookingServiceSearch]);
  // Backend fetch is async now (bkz. yukarıdaki bootstrap useEffect), bu yüzden mechanicsList ilk
  // render'da boş olabilir; ownerProfile'daki gibi güvenli bir varsayılan nesne veriyoruz ki tamirci
  // profil sayfası veri gelmeden önce açılırsa myProfile.xxx erişimleri çökmesin.
  const myProfile = mechanicsList.find(m => m.id === MY_MECHANIC_ID) || { id: MY_MECHANIC_ID, name: "", img: "🔧", lang: "tr", address: "", price: 0, services: [], staff: [], coverPhoto: null, bannerPreset: "blue", specialty: "", rating: 0, reviewList: [], iban: "", bankName: "", accountHolder: "" };
  const selectedListing = listings.find(l => l.id === selectedListingId) || null;
  useEffect(() => {
    if (!selectedListing) return;
    const isMine = selectedListing.sellerName === (role === "owner" ? ownerProfile.name : myProfile?.name);
    if (isMine && selectedListing.offers.some(o => !o.seen)) markOffersSeen(selectedListing.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedListingId]);
  const allReminders = useMemo(() => { if (!ownerSettings.smartReminders) return []; return vehicles.flatMap(v => computeReminders(v).map(r => ({ ...r, vehicleId: v.id, vehicleName: `${v.brand} ${v.model}` }))); }, [vehicles, ownerSettings.smartReminders]);
  const [dismissedReminderKey, setDismissedReminderKey] = useState(null);
  const browseScrollRef = useRef(null);
  const [heroCollapsed, setHeroCollapsed] = useState(false);
  useEffect(() => {
    const getScrollTop = () => Math.max(
      window.scrollY || 0,
      document.documentElement ? document.documentElement.scrollTop : 0,
      document.body ? document.body.scrollTop : 0,
      browseScrollRef.current ? browseScrollRef.current.scrollTop : 0
    );
    const handleScroll = () => setHeroCollapsed(c => { const collapsed = getScrollTop() > 36; return c === collapsed ? c : collapsed; });
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    return () => { window.removeEventListener("scroll", handleScroll); document.removeEventListener("scroll", handleScroll, true); };
  }, []);
  const goBookFromReminder = (key) => {
    setDismissedReminderKey(key);
    setOwnerMode("mechanics");
    requestAnimationFrame(() => browseScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }));
  };
  const topReminder = useMemo(() => {
    const withDates = allReminders.filter(r => r.dueDate);
    if (withDates.length === 0) return null;
    const sorted = [...withDates].sort((a, b) => { if (a.urgent !== b.urgent) return a.urgent ? -1 : 1; return a.dueDate - b.dueDate; });
    const top = sorted[0];
    const key = `${top.vehicleId}-${top.kind}-${top.dueDate.toDateString()}`;
    if (key === dismissedReminderKey) return null;
    return { ...top, key };
  }, [allReminders, dismissedReminderKey]);
  const notifiedReminderKeysRef = useRef(new Set());
  useEffect(() => {
    if (!ownerSettings.smartReminders || role !== "owner") return;
    allReminders.forEach(r => {
      if (!r.urgent) return;
      const key = `${r.vehicleId}-${r.kind}-${r.dueDate ? r.dueDate.toDateString() : "static"}`;
      if (notifiedReminderKeysRef.current.has(key)) return;
      notifiedReminderKeysRef.current.add(key);
      fireNotification(`⏰ ${r.title}`, `${r.vehicleName} — ${r.detail}`, true, "owner", { type: "vehicle", id: r.vehicleId });
    });
  }, [allReminders, ownerSettings.smartReminders]);
  const filtered = useMemo(() => {
    let list = mechanicsList.map(m => ({ ...m, effectiveDistance: getEffectiveDistance(m) }));
    const q = query.toLowerCase().trim();
    if (q) list = list.filter(m => m.name.toLowerCase().includes(q) || m.specialty.toLowerCase().includes(q) || (m.brandsServiced || []).some(b => b.toLowerCase().includes(q)));
    if (locationQuery.trim()) list = list.filter(m => (m.address || "").toLowerCase().includes(locationQuery.trim().toLowerCase()));
    if (filters.priceTier === "cheap") list = list.filter(m => m.price <= 300);
    if (filters.priceTier === "mid") list = list.filter(m => m.price > 300 && m.price <= 450);
    if (filters.priceTier === "expensive") list = list.filter(m => m.price > 450);
    if (filters.minRating > 0) list = list.filter(m => m.rating >= filters.minRating);
    if (filters.maxDistance < 999) list = list.filter(m => m.effectiveDistance <= filters.maxDistance);
    if (filters.brand) list = list.filter(m => (m.brandsServiced || []).includes(filters.brand));
    if (filters.service) list = list.filter(m => (m.services || []).some(s => s.name === filters.service));
    if (sortBy === "distance") list = [...list].sort((a, b) => sortDir === "asc" ? a.effectiveDistance - b.effectiveDistance : b.effectiveDistance - a.effectiveDistance);
    if (sortBy === "price") list = [...list].sort((a, b) => sortDir === "asc" ? a.price - b.price : b.price - a.price);
    if (sortBy === "rating") list = [...list].sort((a, b) => sortDir === "asc" ? a.rating - b.rating : b.rating - a.rating);
    return list;
  }, [query, locationQuery, sortBy, sortDir, mechanicsList, filters, userLocation]);
  const quoteFilteredMechanics = useMemo(() => {
    let list = mechanicsList.map(m => ({ ...m, effectiveDistance: getEffectiveDistance(m) }));
    if (quoteMechSearch.trim()) list = list.filter(m => m.name.toLowerCase().includes(quoteMechSearch.toLowerCase()) || m.specialty.toLowerCase().includes(quoteMechSearch.toLowerCase()));
    if (filters.priceTier === "cheap") list = list.filter(m => m.price <= 300);
    if (filters.priceTier === "mid") list = list.filter(m => m.price > 300 && m.price <= 450);
    if (filters.priceTier === "expensive") list = list.filter(m => m.price > 450);
    if (filters.minRating > 0) list = list.filter(m => m.rating >= filters.minRating);
    if (filters.maxDistance < 999) list = list.filter(m => m.effectiveDistance <= filters.maxDistance);
    if (sortBy === "distance") list = [...list].sort((a, b) => sortDir === "asc" ? a.effectiveDistance - b.effectiveDistance : b.effectiveDistance - a.effectiveDistance);
    if (sortBy === "price") list = [...list].sort((a, b) => sortDir === "asc" ? a.price - b.price : b.price - a.price);
    if (sortBy === "rating") list = [...list].sort((a, b) => sortDir === "asc" ? a.rating - b.rating : b.rating - a.rating);
    return list;
  }, [quoteMechSearch, sortBy, sortDir, mechanicsList, filters, userLocation]);
  const filteredListings = useMemo(() => {
    let list = listings.filter(l => !l.adminRemoved && `${l.brand} ${l.model}`.toLowerCase().includes(query.toLowerCase()));
    if (locationQuery.trim()) list = list.filter(l => (l.city || "").toLowerCase().includes(locationQuery.trim().toLowerCase()));
    if (listingFilters.transmission !== "all") list = list.filter(l => l.transmission === listingFilters.transmission);
    if (listingFilters.fuelType !== "all") list = list.filter(l => l.fuelType === listingFilters.fuelType);
    if (listingFilters.minPrice) list = list.filter(l => parseListingPrice(l.price) >= Number(listingFilters.minPrice));
    if (listingFilters.maxPrice) list = list.filter(l => parseListingPrice(l.price) <= Number(listingFilters.maxPrice));
    if (listingFilters.minKm) list = list.filter(l => Number(l.km) >= Number(listingFilters.minKm));
    if (listingFilters.maxKm) list = list.filter(l => Number(l.km) <= Number(listingFilters.maxKm));
    if (listingFilters.minYear) list = list.filter(l => Number(l.year) >= Number(listingFilters.minYear));
    if (listingFilters.maxYear) list = list.filter(l => Number(l.year) <= Number(listingFilters.maxYear));
    if (listingSort === "price") list = [...list].sort((a, b) => listingSortDir === "asc" ? parseListingPrice(a.price) - parseListingPrice(b.price) : parseListingPrice(b.price) - parseListingPrice(a.price));
    if (listingSort === "km") list = [...list].sort((a, b) => listingSortDir === "asc" ? Number(a.km) - Number(b.km) : Number(b.km) - Number(a.km));
    if (listingSort === "year") list = [...list].sort((a, b) => listingSortDir === "asc" ? Number(a.year) - Number(b.year) : Number(b.year) - Number(a.year));
    return list;
  }, [listings, query, locationQuery, listingFilters, listingSort, listingSortDir]);
  const activeListingFilterCount = (listingFilters.transmission !== "all" ? 1 : 0) + (listingFilters.fuelType !== "all" ? 1 : 0) + (listingFilters.minPrice ? 1 : 0) + (listingFilters.maxPrice ? 1 : 0) + (listingFilters.minKm ? 1 : 0) + (listingFilters.maxKm ? 1 : 0) + (listingFilters.minYear ? 1 : 0) + (listingFilters.maxYear ? 1 : 0);
  const filteredJobs = useMemo(() => {
    let list = jobListings.filter(j => j.status === "active");
    const q = query.toLowerCase();
    if (q) list = list.filter(j => j.title.toLowerCase().includes(q) || j.mechanicName.toLowerCase().includes(q) || j.skills.some(s => s.toLowerCase().includes(q)));
    if (jobFilters.employmentType !== "all") list = list.filter(j => j.employmentType === jobFilters.employmentType);
    if (jobFilters.experienceLevel !== "all") list = list.filter(j => j.experienceLevel === jobFilters.experienceLevel);
    return list;
  }, [jobListings, query, jobFilters]);
  const activeJobFilterCount = (jobFilters.employmentType !== "all" ? 1 : 0) + (jobFilters.experienceLevel !== "all" ? 1 : 0);
  const selectedJob = jobListings.find(j => j.id === selectedJobId) || null;
  const myReviews = useMemo(() => mechanicsList.flatMap(m => (m.reviewList || []).filter(r => r.mine).map(r => ({ ...r, mechanicId: m.id, mechanicName: m.name, mechanicImg: m.img }))), [mechanicsList]);
  // Not: bu liste eskiden yalnızca oturum-içi (sayfa yenilenince kaybolan) `myApplications`
  // dizisinden türetiliyordu; başvuru backend'e kaydedilse bile "Başvurularım" sayfa
  // yenilendiğinde boş görünüyordu. Artık kalıcı `jobListings[].applicants` verisinden,
  // e-posta eşleşmesiyle (kendi e-postam) doğrudan türetiliyor — tek doğruluk kaynağı budur.
  const myApplicationRefs = useMemo(() => {
    const refs = [];
    for (const job of jobListings) {
      for (const applicant of job.applicants || []) {
        const isOwnerMatch = !!ownerProfile.email && applicant.email === ownerProfile.email;
        const isMechMatch = !!myProfile?.email && applicant.email === myProfile.email;
        if (isOwnerMatch || isMechMatch) {
          refs.push({ id: applicant.id, jobId: job.id, applicantId: applicant.id, role: isOwnerMatch ? "owner" : "mechanic", date: applicant.date, job, applicant });
        }
      }
    }
    return refs;
  }, [jobListings, ownerProfile.email, myProfile?.email]);
  const activeFilterCount = (filters.priceTier !== "all" ? 1 : 0) + (filters.minRating > 0 ? 1 : 0) + (filters.maxDistance < 999 ? 1 : 0) + (filters.brand ? 1 : 0) + (filters.service ? 1 : 0);
  const nextDays = useMemo(() => { const days = []; const today = new Date(); for (let i = 0; i < 7; i++) { const d = new Date(today); d.setDate(today.getDate() + i); days.push(d); } return days; }, []);
  const isSameMechanicAppt = (a) => a.mechanicId === MY_MECHANIC_ID || (!a.mechanicId && a.mechanicName === myProfile?.name);
  const customerNoShowCount = (customer) => appointments.filter(a => a.customer === customer && a.noShow && isSameMechanicAppt(a)).length;
  // `activeAppts`/`historyByDate` her zaman GÖRÜNTÜLEYEN kullanıcıya göre filtrelenir: araç sahibi
  // sadece kendi randevularını (customer === ownerProfile.name), tamirci sadece kendisine ait
  // randevuları (isSameMechanicAppt) görür — aksi halde örnek/başka kullanıcı randevuları herkese
  // sızardı (önceden bu şekilde bir gizlilik hatası vardı, bu iki liste de aynı hataya sahipti).
  const isMyOwnerAppt = (a) => a.customer === ownerProfile.name;
  const activeAppts = useMemo(() => {
    const list = appointments.filter(a => !["Tamir Tamamlandı", "İptal Edildi", "Reddedildi", "Gelmedi"].includes(a.status));
    return list.filter(role === "mechanic" ? isSameMechanicAppt : isMyOwnerAppt);
  }, [appointments, role, ownerProfile.name, myProfile?.name]);
  const historyByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    const list = appointments.filter(a => ["Tamir Tamamlandı", "İptal Edildi", "Reddedildi", "Gelmedi"].includes(a.status)).filter(role === "mechanic" ? isSameMechanicAppt : isMyOwnerAppt);
    list.forEach(a => { if (!map[a.date]) map[a.date] = []; map[a.date].push(a); });
    return Object.entries(map);
  }, [appointments, role, ownerProfile.name, myProfile?.name]);
  function slotsForDate(mechanic, date) {
    if (!mechanic) return [];
    if (mechanic.id !== MY_MECHANIC_ID) return genSlots("09:00", "18:00");
    const key = JS_DAY_TO_KEY[date.getDay()];
    const dayCfg = mechanicHours[key];
    if (!dayCfg.open) return [];
    return getDaySlots(dayCfg).filter(s => !dayCfg.closedSlots.includes(s));
  }
  const isDayOpenForMechanic = (mechanic, date) => { if (!mechanic || mechanic.id !== MY_MECHANIC_ID) return true; return mechanicHours[JS_DAY_TO_KEY[date.getDay()]].open; };
  // Bir tamircinin (kendi hesabımız ya da ilan listesindeki herhangi biri) şu an açık mı kapalı mı olduğunu döner.
  const mechanicOpenStatus = (m) => { if (!m) return null; const lines = m.id === MY_MECHANIC_ID ? formatHoursText(mechanicHours) : m.hoursText; return isOpenNowByHoursText(lines); };
  // Bugün için tüm randevu saatleri dolduysa tamirciye bildirim gönder + yeni saat eklemek isteyip
  // istemediğini soran uygulama içi bir davet göster. Aynı gün için tekrar tekrar bildirim gitmesin diye
  // "dayFullNotified" bayrağı kullanılıyor; slotlar boşalırsa (örn. iptal) bayrak sıfırlanır.
  useEffect(() => {
    if (!myProfile) return;
    const today = new Date();
    const todayStr = today.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
    const totalSlots = slotsForDate(myProfile, today).length;
    // `activeAppts` artık GÖRÜNTÜLEYEN kullanıcıya göre filtreleniyor (owner iken tamircinin
    // randevularını içermez), bu yüzden burada mutlaka tamirciye özel, role'den bağımsız bir sayım
    // kullanılmalı — yoksa "bugün doluysunuz" kontrolü owner görünümündeyken yanlış hesaplanır.
    const bookedToday = appointments.filter(a => isSameMechanicAppt(a) && !["Tamir Tamamlandı", "İptal Edildi", "Reddedildi", "Gelmedi"].includes(a.status) && a.date === todayStr).length;
    const isFull = totalSlots > 0 && bookedToday >= totalSlots;
    if (isFull && !dayFullNotified) {
      if (role === "mechanic") fireNotification("Bugünün tüm randevu saatleri doldu! 📅", "Bugün için tüm randevu saatleriniz doldu. Müşterileriniz için yeni bir saat eklemek ister misiniz?", mechSettings.notifyAppointments, "mechanic", { type: "workingHours" });
      setShowDayFullPrompt(true);
      setDayFullNotified(true);
    } else if (!isFull && dayFullNotified) {
      setDayFullNotified(false);
    }
  }, [appointments, mechanicHours, myProfile, role]);
  const goToAddSlotForToday = () => {
    setShowDayFullPrompt(false);
    setScreen("mechProfilePage");
    setMechProfileTab("settings");
    setExpandedDay(JS_DAY_TO_KEY[new Date().getDay()]);
  };
  const openDetail = (m, returnTo = undefined) => { setSelectedMechanicId(m.id); setDetailReturnScreen(returnTo || null); setScreen("detail"); };
  const rebookAppt = (a) => {
    const mech = mechanicsList.find(m => m.id === a.mechanicId) || mechanicsList.find(m => m.name === a.mechanicName);
    if (!mech) { setToast({ type: "info", text: "⚠️ Bu tamirci artık listede bulunamadı." }); return; }
    setSelectedMechanicId(mech.id);
    setSelectedDate(null); setSelectedTime(null); setBookingService(null); setProblemDesc(""); setProblemPhotos([]);
    setScreen("booking");
  };
  // Randevuyu .ics dosyası olarak indirir (Google/Apple/Outlook takvimine eklenebilir).
  const downloadAppointmentIcs = (appt) => {
    const start = appt.dateISO ? new Date(appt.dateISO) : new Date();
    if (appt.time) { const [hh, mm] = appt.time.split(":").map(Number); start.setHours(hh || 9, mm || 0, 0, 0); }
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const fmt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const esc = (s) => String(s || "").replace(/\n/g, "\\n");
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", `UID:appt-${appt.id}@fixperto.com`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`, `SUMMARY:${esc(appt.mechanicName + " - Randevu")}`, `DESCRIPTION:${esc(appt.issue)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `randevu-${appt.id}.ics`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    setToast({ type: "info", text: "📅 Takvim dosyası indirildi." });
  };
  const downloadMaintenanceReport = (vehicle) => {
    const esc = (s) => String(s ?? "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const rows = (vehicle.history || []).map(h => `<tr><td>${esc(h.date)}</td><td>${esc(h.type)}</td><td>${esc(h.mechanic)}</td><td style="text-align:right">${esc(h.price)}</td></tr>`).join("");
    const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>Bakım Geçmişi - ${esc(vehicle.plate)}</title><style>
      body{font-family:-apple-system,Arial,sans-serif;color:#1f2937;padding:32px;max-width:720px;margin:0 auto;}
      h1{font-size:20px;margin-bottom:2px;} .sub{color:#6b7280;font-size:12px;margin-bottom:20px;}
      table{width:100%;border-collapse:collapse;margin-top:12px;} th,td{padding:8px 10px;font-size:13px;border-bottom:1px solid #e5e7eb;text-align:left;}
      th{color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:.03em;} .meta{display:flex;gap:24px;margin:16px 0;font-size:13px;} .meta div span{display:block;color:#9ca3af;font-size:10px;}
      .foot{margin-top:24px;font-size:11px;color:#9ca3af;} @media print{body{padding:0;}}
    </style></head><body>
      <h1>Bakım Geçmişi Raporu</h1><p class="sub">Fixperto · Oluşturulma: ${new Date().toLocaleDateString("tr-TR")}</p>
      <div class="meta"><div><span>Araç</span>${esc(vehicle.brand)} ${esc(vehicle.model)} (${esc(vehicle.year)})</div><div><span>Plaka</span>${esc(vehicle.plate)}</div><div><span>Kayıt Sayısı</span>${(vehicle.history || []).length}</div></div>
      <table><thead><tr><th>Tarih</th><th>İşlem</th><th>Tamirci</th><th style="text-align:right">Tutar</th></tr></thead><tbody>${rows || `<tr><td colspan="4" style="color:#9ca3af">Kayıt bulunmuyor.</td></tr>`}</tbody></table>
      <p class="foot">Bu rapor Fixperto uygulaması üzerinden otomatik oluşturulmuştur. Yazdırmak için Ctrl/Cmd+P kullanabilirsiniz.</p>
    </body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `bakim-gecmisi-${vehicle.plate.replace(/\s/g, "")}.html`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    setToast({ type: "info", text: "📄 Rapor indirildi. Açıp yazdırabilirsiniz." });
  };
  const downloadAppointmentReceipt = (appt) => {
    const esc = (s) => String(s ?? "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const total = appt.servicePrice > 0 ? appt.servicePrice : null;
    const deposit = appt.depositPaid || 0;
    const remaining = total !== null ? Math.max(total - deposit, 0) : null;
    const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>Fiş - Randevu #${appt.id}</title><style>
      body{font-family:-apple-system,Arial,sans-serif;color:#1f2937;padding:32px;max-width:560px;margin:0 auto;}
      .brand{font-size:18px;font-weight:800;} .brand span{color:#e11d48;} h1{font-size:15px;color:#6b7280;font-weight:600;margin:18px 0 4px;}
      .sub{color:#9ca3af;font-size:11px;margin-bottom:20px;} table{width:100%;border-collapse:collapse;margin-top:10px;}
      td{padding:8px 0;font-size:13px;border-bottom:1px solid #f3f4f6;} td.label{color:#6b7280;width:40%;}
      .total-row td{font-weight:800;font-size:15px;border-top:2px solid #1f2937;border-bottom:none;padding-top:12px;}
      .foot{margin-top:28px;font-size:11px;color:#9ca3af;} @media print{body{padding:0;}}
    </style></head><body>
      <div class="brand">Fix<span>perto</span></div>
      <h1>Hizmet Fişi</h1><p class="sub">Randevu #${appt.id} · ${new Date().toLocaleDateString("tr-TR")}</p>
      <table>
        <tr><td class="label">Müşteri</td><td>${esc(appt.customer)}</td></tr>
        <tr><td class="label">Tamirci</td><td>${esc(appt.mechanicName)}</td></tr>
        <tr><td class="label">Araç</td><td>${esc(appt.vehicle)}</td></tr>
        <tr><td class="label">Hizmet</td><td>${esc(appt.issue)}</td></tr>
        <tr><td class="label">Tarih / Saat</td><td>${esc(appt.date)} · ${esc(appt.time)}</td></tr>
        <tr><td class="label">Ödeme Yöntemi</td><td>${appt.paymentMethod === "onsite" ? "Yerinde ödeme" : "Kart (online)"}</td></tr>
        ${deposit > 0 ? `<tr><td class="label">Ödenen Kapora</td><td>${deposit}₺</td></tr>` : ""}
        ${remaining !== null ? `<tr><td class="label">Kalan Tutar</td><td>${remaining}₺</td></tr>` : ""}
        <tr class="total-row"><td>Toplam</td><td>${total !== null ? total + "₺" : "Yerinde belirlenecek"}</td></tr>
      </table>
      <p class="foot">Bu fiş Fixperto uygulaması üzerinden otomatik oluşturulmuştur. Yazdırmak için Ctrl/Cmd+P kullanabilirsiniz.</p>
    </body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `fis-randevu-${appt.id}.html`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    setToast({ type: "info", text: "🧾 Fiş indirildi. Açıp yazdırabilirsiniz." });
  };
  const mechanicDirectionsUrl = (mechanicName) => {
    const mech = mechanicsList.find(m => m.name === mechanicName);
    if (!mech || !mech.lat || !mech.lng) return null;
    return `https://www.google.com/maps/dir/?api=1&destination=${mech.lat},${mech.lng}`;
  };
  const toggleQuoteMechanic = (id) => {
    setQuoteSelectedMechIds(ids => {
      if (ids.includes(id)) return ids.filter(x => x !== id);
      const limit = quotePremiumUnlocked ? PREMIUM_QUOTE_MECH_LIMIT : FREE_QUOTE_MECH_LIMIT;
      if (ids.length >= limit) { setShowQuotePremiumUpsell(true); return ids; }
      return [...ids, id];
    });
  };
  const unlockQuotePremium = () => { setQuotePremiumUnlocked(true); setShowQuotePremiumUpsell(false); setToast({ type: "info", text: "⭐ Premium açıldı (demo) — artık 10 tamirciye kadar teklif isteyebilirsiniz." }); };
  const closeQuoteModal = () => { setShowQuoteModal(false); setShowAddVehicle(false); setShowQuotePremiumUpsell(false); setQuoteVehicleId(null); setQuoteIssue(""); setQuotePhotos([]); setQuoteSelectedMechIds([]); setQuoteMechSearch(""); };
  const submitQuoteRequest = async () => {
    if (!quoteVehicleId || !quoteIssue.trim() || quoteSelectedMechIds.length === 0) return;
    const vehicle = vehicles.find(v => v.id === quoteVehicleId);
    const customerName = ownerProfile.name || form.name || "Siz";
    const issueText = quoteIssue.trim();
    const photos = quotePhotos;
    const selectedMechIds = [...quoteSelectedMechIds];
    const draft = { ownerId: MY_OWNER_ID, vehicleId: quoteVehicleId, customer: customerName, vehicle: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})` : "Araç seçilmedi", issue: issueText, photos, mechanicIds: selectedMechIds, status: "open" };
    setShowQuoteModal(false);
    setQuoteVehicleId(null); setQuoteIssue(""); setQuotePhotos([]); setQuoteSelectedMechIds([]); setQuoteMechSearch("");
    setToast({ type: "info", text: `📋 ${selectedMechIds.length} tamirciye teklif isteği gönderildi.` });
    try {
      const createdReq = await api.quoteRequests.create(draft);
      setQuoteRequests(qs => [createdReq, ...qs]);
      // Demo amaçlı: gerçek bir tamirci (MY_MECHANIC_ID) hariç diğerleri için otomatik örnek
      // teklifler üretiliyor (backend'de gerçek bir tamirci tarafında yanıt akışı yok — demo).
      const offerDrafts = selectedMechIds.map(mid => {
        const mech = mechanicsList.find(m => m.id === mid);
        const isMe = mid === MY_MECHANIC_ID;
        const basePrice = mech?.price || 400;
        const variance = Math.round((basePrice * (0.85 + Math.random() * 0.3)) / 10) * 10;
        return { requestId: createdReq.id, mechanicId: mid, mechanicName: mech?.name || "Tamirci", mechanicImg: mech?.img || "🔧", status: isMe ? "pending" : "submitted", price: isMe ? null : variance, etaDays: isMe ? null : (1 + Math.floor(Math.random() * 3)), note: "" };
      });
      const createdOffers = await Promise.all(offerDrafts.map(o => api.quoteOffers.create(o)));
      setQuoteOffers(os => [...createdOffers, ...os]);
      if (selectedMechIds.includes(MY_MECHANIC_ID)) {
        fireNotification("Yeni teklif isteği 📋", `${customerName} sizden "${issueText.slice(0, 50)}" için fiyat teklifi istiyor.`, mechSettings.notifyOffers, "mechanic", { type: "appointment" });
      }
    } catch (err) {
      setToast({ type: "info", text: `⚠️ Teklif isteği kaydedilemedi: ${err?.message || "Sunucuya kaydedilemedi."}` });
    }
  };
  const submitQuoteOffer = (offerId) => {
    const price = parsePriceNumber(quoteOfferForm.price);
    if (!price) return;
    const patch = { status: "submitted", price, etaDays: quoteOfferForm.etaDays ? parseInt(quoteOfferForm.etaDays, 10) : null, note: quoteOfferForm.note.trim() };
    setQuoteOffers(os => os.map(o => o.id === offerId ? { ...o, ...patch } : o));
    persist(api.quoteOffers.update(offerId, patch), "Teklif kaydedilemedi");
    setRespondingQuoteOfferId(null);
    setQuoteOfferForm({ price: "", etaDays: "", note: "" });
    setToast({ type: "info", text: "💬 Teklifiniz gönderildi." });
    fireNotification("Yeni teklif geldi! 💰", "Bir tamirci teklif isteğinize yanıt verdi.", ownerSettings.notifyOffers, "owner", { type: "quoteOwner" });
  };
  const acceptQuoteOffer = (requestId, offerId) => {
    const req = quoteRequests.find(r => r.id === requestId);
    const offer = quoteOffers.find(o => o.id === offerId);
    if (!req || !offer) return;
    const mech = mechanicsList.find(m => m.id === offer.mechanicId);
    if (!mech) { setToast({ type: "info", text: "⚠️ Bu tamirci artık listede bulunamadı." }); return; }
    const myLostOffer = offer.mechanicId !== MY_MECHANIC_ID && quoteOffers.find(o => o.requestId === requestId && o.mechanicId === MY_MECHANIC_ID && o.status === "submitted");
    setPendingQuoteAccept({ bookingService: { name: `Teklif: ${req.issue.slice(0, 40)}`, price: `${offer.price}₺`, other: false, fixed: true }, problemDesc: req.issue, problemPhotos: req.photos || [] });
    setSelectedMechanicId(mech.id);
    setSelectedDate(null); setSelectedTime(null);
    setQuoteRequests(qs => qs.map(r => r.id === requestId ? { ...r, status: "closed" } : r));
    persist(api.quoteRequests.update(requestId, { status: "closed" }), "Teklif isteği kaydedilemedi");
    const relatedOffers = quoteOffers.filter(o => o.requestId === requestId);
    relatedOffers.forEach(o => {
      const nextStatus = o.id === offerId ? "accepted" : (o.status === "submitted" ? "lost" : o.status);
      if (nextStatus !== o.status) persist(api.quoteOffers.update(o.id, { status: nextStatus }), "Teklif kaydedilemedi");
    });
    setQuoteOffers(os => os.map(o => o.requestId === requestId ? { ...o, status: o.id === offerId ? "accepted" : (o.status === "submitted" ? "lost" : o.status) } : o));
    setScreen("booking");
    setToast({ type: "info", text: `✅ ${mech.name} teklifini kabul ettiniz, randevu saatinizi seçin.` });
    if (myLostOffer) {
      fireNotification("Teklif isteği sonuçlandı", `"${req.issue.slice(0, 40)}" için verdiğiniz teklif kabul edilmedi, müşteri başka bir tamirciyi seçti.`, mechSettings.notifyOffers, "mechanic", { type: "appointment" });
    }
  };
  const EXPENSIVE_SERVICE_THRESHOLD = 1500;
  const confirmBooking = async () => {
    const status = autoAccept ? "Sırada" : "Onay Bekliyor";
    const bookingVehicle = vehicles.find(v => v.id === selectedBookingVehicleId) || vehicles[0];
    const isPayableNow = bookingService && bookingService.fixed && !bookingService.other;
    const servicePrice = isPayableNow ? parsePriceNumber(bookingService.price) : 0;
    const paymentMethod = isPayableNow ? paymentForm.method : "onsite";
    if (servicePrice > EXPENSIVE_SERVICE_THRESHOLD && !approveExpensiveService) { setToast({ type: "info", text: "⚠️ Lütfen devam etmeden önce tutarı onayladığınızı işaretleyin." }); return; }
    const issueText = bookingService ? `${bookingService.name}${problemDesc ? " — " + problemDesc : ""}` : (problemDesc || "Belirtilmedi");
    const draft = { ownerId: MY_OWNER_ID, customer: ownerProfile.name || form.name || "Siz", mechanicName: selectedMechanic.name, mechanicImg: selectedMechanic.img, mechanicId: selectedMechanic.id, vehicle: bookingVehicle ? `${bookingVehicle.brand} ${bookingVehicle.model} (${bookingVehicle.plate})` : "Araç seçilmedi", date: selectedDate?.toLocaleDateString("tr-TR", { day: "numeric", month: "long" }), dateISO: selectedDate ? selectedDate.toISOString() : null, time: selectedTime, status, autoAccepted: autoAccept, issue: issueText, issuePhotos: problemPhotos, paymentMethod, depositPaid: paymentMethod === "card" ? servicePrice : 0, servicePrice, reviewed: false, noShow: false, historyShareConsent: shareHistoryConsent };
    setPaymentForm({ method: "card", cardNumber: "", expiry: "", cvc: "" });
    setSelectedBookingVehicleId(null);
    setBookingService(null);
    setProblemDesc("");
    setProblemPhotos([]);
    setApproveExpensiveService(false);
    setShareHistoryConsent(true);
    setScreen("confirmed");
    try {
      const created = await api.appointments.create(draft);
      setAppointments(apps => [created, ...apps]);
      recordConversion("appointment");
      recordProfileViewConversion();
      // Sadece gerçekten etkileşimli tamirci hesabına (MY_MECHANIC_ID) yapılan randevularda gerçek
      // bildirim gönderilir — demo/örnek tamircilere randevu alınırken bildirim ateşlenmez, çünkü o
      // tamirci panelinde bu randevu zaten hiç görünmeyecek.
      if (selectedMechanic.id === MY_MECHANIC_ID) {
        fireNotification(autoAccept ? "Yeni randevu 📅" : "Yeni randevu talebi 📅", `${created.customer} — ${created.vehicle}${autoAccept ? " için randevu oluşturuldu." : " için onayınızı bekliyor."}`, mechSettings.notifyAppointments, "mechanic", { type: "appointment", id: created.id });
      }
    } catch (err) {
      setToast({ type: "info", text: `⚠️ Randevu kaydedilemedi: ${err?.message || "Sunucuya kaydedilemedi."}` });
    }
  };
  const goHome = () => { setScreen("home"); setRole(null); setSelectedMechanicId(null); setSelectedDate(null); setSelectedTime(null); setProblemDesc(""); setProblemPhotos([]); setApproveExpensiveService(false); setShareHistoryConsent(true); setSelectedBookingVehicleId(null); setBookingService(null); setPaymentForm({ method: "card", cardNumber: "", expiry: "", cvc: "" }); setForm({ name: "", email: "", phone: "", password: "" }); setOwnerTab("search"); setOwnerMode("mechanics"); setActiveConvoId(null); setMechActiveConvoId(null); setMechTab("requests"); setSelectedJobId(null); setSelectedListingId(null); setMapDetailOpen(false); setShowMapMobile(false); };
  const chooseRole = (r) => { setRole(r); setScreen("login"); };
  // ---- Admin (site sahibi) fonksiyonları ----
  // GÜVENLİK: Bu fonksiyon artık admin şifresini istemci tarafında (frontend'de) KARŞILAŞTIRMIYOR.
  // Eskiden burada ADMIN_CREDENTIALS adlı düz-metin bir sabitle karşılaştırma yapılıyordu; bu hem
  // şifreyi frontend paketine gömüyordu (herkes okuyabilir) hem de "gerçek" bir doğrulama değildi
  // (backend hiç sorulmuyordu). Şimdi gerçek kimlik doğrulaması backend'de yapılıyor:
  // bkz. services/api/client.ts -> api.admin.login() ve backend/routes/admin.js.
  const submitAdminLogin = async () => {
    if (adminLoginLoading) return; // duplicate-submit koruması
    const email = adminForm.email.trim().toLocaleLowerCase("tr-TR");
    if (!email || !adminForm.password) {
      setAdminError("E-posta ve şifre zorunludur.");
      return;
    }
    setAdminLoginLoading(true);
    setAdminError("");
    try {
      await api.admin.login(email, adminForm.password);
      setAdminAuthed(true); setAdminError(""); setRole("admin"); setScreen("adminDashboard"); setAdminTab("dashboard");
    } catch (err) {
      setAdminError(err?.status === 401 ? "E-posta veya şifre hatalı." : (err?.message || "Giriş yapılamadı, lütfen tekrar deneyin."));
    } finally {
      setAdminLoginLoading(false);
    }
  };
  const adminLogout = () => { setAdminAuthed(false); setAdminForm({ email: "", password: "" }); setSelectedAdminUser(null); setAdminEditForm(null); setSelectedTicketId(null); setRole(null); setScreen("home"); };
  // ---- Değişiklik geçmişi / Geri Al altyapısı ----
  // Panelden yapılan her tekil alan değişikliği burada loglanır (kim/ne/eski değer/yeni değer),
  // ve applyAdminFieldChange aynı yazma yolunu tersten çalıştırarak "Geri Al"ı mümkün kılar.
  const ADMIN_FIELD_LABELS = {
    name: "Ad Soyad", email: "E-posta", phone: "Telefon", city: "Şehir", address: "Adres", status: "Hesap Durumu",
    specialty: "Uzmanlık", price: "Fiyat", verified: "Doğrulama Rozeti", rating: "Puan", reviews: "Yorum Sayısı",
    avgResponseMinutes: "Ort. Yanıt Süresi (dk)", vehicleCount: "Araç Sayısı", apptCount: "Randevu Sayısı",
    password: "Şifre", newPassword: "Şifre", photo: "Fotoğraf",
    brand: "Marka", model: "Model", year: "Yıl", km: "Kilometre", fuelType: "Yakıt Tipi", transmission: "Vites",
    power: "Güç", color: "Renk", firstReg: "İlk Tescil", adminRemoved: "Yayın Durumu",
    title: "Pozisyon", employmentType: "Çalışma Şekli", experienceLevel: "Deneyim Seviyesi", location: "Konum",
    salaryMin: "Min. Maaş", salaryMax: "Maks. Maaş", description: "Açıklama", requirements: "Aranan Nitelikler", skills: "Beceriler",
    adminNote: "Dahili Not", refunded: "İade Durumu", depositRefunded: "Kapora İadesi", services: "Sunulan Hizmetler",
    reviewList: "Yorumlar", brandsServiced: "Hizmet Verdiği Markalar", paymentMethods: "Ödeme Yöntemleri", lang: "Konuştuğu Dil",
  };
  const adminFieldLabel = (field) => ADMIN_FIELD_LABELS[field] || field;
  const formatAdminHistoryValue = (field, value) => {
    if (value === undefined || value === null || value === "") return "—";
    if (field === "password" || field === "newPassword") return "••••••";
    if (field === "verified") return value ? "Doğrulanmış" : "Doğrulanmamış";
    if (field === "adminRemoved") return value ? "Kaldırıldı" : "Yayında";
    if (field === "refunded" || field === "depositRefunded") return value ? "Evet" : "Hayır";
    if (field === "status") {
      if (value === "active" || value === "suspended") return value === "active" ? "Aktif" : "Askıya Alınmış";
      if (value === "sold") return "Satıldı";
      if (value === "reserved") return "Rezerve";
      if (value === "closed") return "Kapalı";
      if (ADMIN_TICKET_STATUS_LABELS[value]) return ADMIN_TICKET_STATUS_LABELS[value];
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return "—";
      if (typeof value[0] === "object") return `${value.length} kayıt`;
      return value.join(", ");
    }
    if (typeof value === "object") return "(güncellendi)";
    return String(value);
  };
  const adminChangeTargetLabel = (targetType, targetId) => {
    if (targetType === "owner") return ownersDirectory.find(o => o.id === targetId)?.name || `Araç Sahibi #${targetId}`;
    if (["mechanic", "mechanicOverride", "mechanicServicesArray", "mechanicReviewList", "service"].includes(targetType)) return mechanicsList.find(m => m.id === targetId)?.name || `Tamirci #${targetId}`;
    if (targetType === "listing") { const l = listings.find(x => x.id === targetId); return l ? `${l.brand} ${l.model} #${l.id}` : `İlan #${targetId}`; }
    if (targetType === "job") { const j = jobListings.find(x => x.id === targetId); return j ? `${j.title} #${j.id}` : `İş İlanı #${targetId}`; }
    if (targetType === "ticket") return `Destek Talebi #${targetId}`;
    if (targetType === "appointment") return `Randevu #${targetId}`;
    return `#${targetId}`;
  };
  const logAdminChange = (entry) => {
    const logEntry = {
      id: adminChangeLogId++,
      date: TODAY.toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      reverted: false,
      ...entry,
    };
    setAdminChangeLog(log => [logEntry, ...log]);
    // Backend admin_change_log şeması genel bir "action/entityType/entityId/before/after" audit
    // kaydı bekliyor (bkz. backend/routes/admin.js) — istemcideki daha zengin alan adlarını
    // (targetType/targetId/field/oldValue/newValue/extra) buna eşliyoruz. Sunucudaki gerçek id ile
    // yerel iyimser id'yi eşitliyoruz ki "Geri Al" sonradan doğru satırı bulup PATCH edebilsin.
    api.admin.logChange({
      action: `${entry.field} güncellendi`,
      entityType: entry.targetType,
      entityId: entry.targetId,
      before: { field: entry.field, value: entry.oldValue, extra: entry.extra },
      after: { field: entry.field, value: entry.newValue, extra: entry.extra },
    }).then((created) => {
      if (created?.id != null) setAdminChangeLog(log => log.map(e => e.id === logEntry.id ? { ...e, id: created.id } : e));
    }).catch((err) => {
      if (typeof window !== "undefined" && (import.meta as any)?.env?.DEV) console.error("[persist]", "Değişiklik geçmişi kaydedilemedi", err);
      setToast({ type: "info", text: `⚠️ Değişiklik geçmişi kaydedilemedi: ${err?.message || "Sunucuya kaydedilemedi."}` });
    });
  };
  // Admin panelinden yapılan bir alan değişikliğini hem yerel state'e hem (mechanicOverride hariç —
  // bu alanlar backend şemasında yok, sadece demo amaçlı istemci tarafı bir katman) gerçek backend
  // kaydına uygular. `applyAdminFieldChange` hem doğrudan düzenlemelerde hem "Geri Al" akışında
  // (revertAdminChange/-Group) kullanıldığı için, buraya eklenen persist tek noktadan TÜM admin
  // panel yazma işlemlerini kalıcı hale getiriyor.
  const applyAdminFieldChange = (targetType, targetId, field, value, extra = undefined) => {
    if (targetType === "owner") { setOwnersDirectory(list => list.map(o => o.id === targetId ? { ...o, [field]: value } : o)); persist(api.owners.update(targetId, { [field]: value }), "Kullanıcı bilgisi kaydedilemedi"); }
    else if (targetType === "mechanic") { setMechanicsList(list => list.map(m => m.id === targetId ? { ...m, [field]: value } : m)); persist(api.mechanics.update(targetId, { [field]: value }), "Tamirci bilgisi kaydedilemedi"); }
    else if (targetType === "mechanicOverride") setMechanicAdminOverrides(ov => ({ ...ov, [targetId]: { ...ov[targetId], [field]: value } }));
    else if (targetType === "mechanicServicesArray") { setMechanicsList(list => list.map(m => m.id === targetId ? { ...m, services: value } : m)); persist(api.mechanics.update(targetId, { services: value }), "Hizmetler kaydedilemedi"); }
    else if (targetType === "mechanicReviewList") { setMechanicsList(list => list.map(m => m.id === targetId ? { ...m, reviewList: value, reviews: extra?.reviews ?? m.reviews } : m)); persist(api.mechanics.update(targetId, { reviewList: value, ...(extra?.reviews !== undefined ? { reviews: extra.reviews } : {}) }), "Yorumlar kaydedilemedi"); }
    else if (targetType === "service") { const mech = mechanicsList.find(m => m.id === targetId); const services = mech ? mech.services.map((s, i) => i === extra?.serviceIdx ? { ...s, [field]: value } : s) : []; setMechanicsList(list => list.map(m => m.id === targetId ? { ...m, services } : m)); persist(api.mechanics.update(targetId, { services }), "Hizmet kaydedilemedi"); }
    else if (targetType === "listing") { setListings(ls => ls.map(l => l.id === targetId ? { ...l, [field]: value } : l)); persist(api.listings.update(targetId, { [field]: value }), "İlan kaydedilemedi"); }
    else if (targetType === "job") { setJobListings(js => js.map(j => j.id === targetId ? { ...j, [field]: value } : j)); persist(api.jobs.update(targetId, { [field]: value }), "İş ilanı kaydedilemedi"); }
    else if (targetType === "ticket") { setSupportTickets(list => list.map(tk => tk.id === targetId ? { ...tk, [field]: value } : tk)); persist(api.tickets.update(targetId, { [field]: value }), "Destek talebi kaydedilemedi"); }
    else if (targetType === "appointment") { setAppointments(apps => apps.map(a => a.id === targetId ? { ...a, [field]: value } : a)); persist(api.appointments.update(targetId, { [field]: value }), "Randevu kaydedilemedi"); }
  };
  const revertAdminChange = (entry) => {
    if (entry.reverted) return;
    applyAdminFieldChange(entry.targetType, entry.targetId, entry.field, entry.oldValue, entry.extra);
    setAdminChangeLog(log => log.map(e => e.id === entry.id ? { ...e, reverted: true } : e));
    persist(api.admin.revertChange(entry.id), "Geri alma işlemi kaydedilemedi");
    setToast({ type: "info", text: `↩️ Geri alındı: ${adminChangeTargetLabel(entry.targetType, entry.targetId)} — ${adminFieldLabel(entry.field)}` });
  };
  // ---- Geçmiş, kalabalıklaşmasın diye tek tek satır yerine hesap/kayıt bazında gruplanıyor:
  // 10 kullanıcıda 4 değişiklik = 40 satır yerine, her hesap için tek bir kart (içinde 4 satır,
  // istenirse açılıp kapanabiliyor). Grup en son değişen alan üstte olacak şekilde sıralanıyor. ----
  const ADMIN_TARGET_TYPE_META = {
    owner: { label: "Araç Sahibi", icon: User },
    mechanic: { label: "Tamirci", icon: Wrench },
    mechanicOverride: { label: "Tamirci", icon: Wrench },
    mechanicServicesArray: { label: "Tamirci", icon: Wrench },
    mechanicReviewList: { label: "Tamirci", icon: Wrench },
    service: { label: "Tamirci", icon: Wrench },
    listing: { label: "Araç İlanı", icon: Tag },
    job: { label: "İş İlanı", icon: Briefcase },
    ticket: { label: "Destek Talebi", icon: LifeBuoy },
    appointment: { label: "Randevu", icon: Calendar },
  };
  const adminChangeLogGrouped = useMemo(() => {
    const groups = new Map();
    adminChangeLog.forEach(entry => {
      const key = `${entry.targetType === "mechanicOverride" || entry.targetType === "mechanicServicesArray" || entry.targetType === "mechanicReviewList" || entry.targetType === "service" ? "mechanic" : entry.targetType}:${entry.targetId}`;
      if (!groups.has(key)) groups.set(key, { key, targetType: entry.targetType, targetId: entry.targetId, targetLabel: adminChangeTargetLabel(entry.targetType, entry.targetId), typeMeta: ADMIN_TARGET_TYPE_META[entry.targetType] || { label: "Kayıt", icon: History }, entries: [] });
      groups.get(key).entries.push(entry);
    });
    return Array.from(groups.values());
  }, [adminChangeLog, ownersDirectory, mechanicsList, listings, jobListings]);
  const [expandedHistoryGroups, setExpandedHistoryGroups] = useState({});
  const toggleHistoryGroup = (key) => setExpandedHistoryGroups(g => ({ ...g, [key]: !g[key] }));
  const revertAdminChangeGroup = (group) => {
    const toRevert = group.entries.filter(e => !e.reverted);
    if (toRevert.length === 0) return;
    toRevert.forEach(entry => {
      applyAdminFieldChange(entry.targetType, entry.targetId, entry.field, entry.oldValue, entry.extra);
      persist(api.admin.revertChange(entry.id), "Geri alma işlemi kaydedilemedi");
    });
    const ids = new Set(toRevert.map(e => e.id));
    setAdminChangeLog(log => log.map(e => ids.has(e.id) ? { ...e, reverted: true } : e));
    setToast({ type: "info", text: `↩️ ${group.targetLabel} için ${toRevert.length} değişiklik geri alındı.` });
  };
  // Serbest metin alanları (ilan/iş ilanı/hizmet detayları) her tuş vuruşunda değişir; bunları
  // her karakterde değil, alandan çıkıldığında (blur) tek bir "değişiklik" olarak loglamak için
  // odaklanma anındaki değeri burada anlık tutuyoruz.
  const fieldEditSnapshotRef = useRef({});
  const trackFieldFocus = (key, currentValue) => { fieldEditSnapshotRef.current[key] = currentValue; };
  const trackFieldBlurAndLog = (key, newValue, entry) => {
    const oldValue = fieldEditSnapshotRef.current[key];
    delete fieldEditSnapshotRef.current[key];
    if (oldValue === undefined || String(oldValue) === String(newValue)) return;
    logAdminChange({ ...entry, oldValue, newValue });
  };
  const trackInputProps = (targetType, targetId, field, currentValue, newValueFn = (e) => e.target.value) => ({
    onFocus: () => trackFieldFocus(`${targetType}:${targetId}:${field}`, currentValue),
    onBlur: (e) => trackFieldBlurAndLog(`${targetType}:${targetId}:${field}`, newValueFn(e), { targetType, targetId, field }),
  });
  const adminStats = useMemo(() => {
    const totalOwners = ownersDirectory.length;
    const totalMechanics = mechanicsList.length;
    const activeCarListings = listings.filter(l => l.status !== "sold").length;
    const activeJobListings = jobListings.filter(j => j.status === "active").length;
    const totalAppointments = appointments.length;
    const completedThisMonth = appointments.filter(a => a.status === "Tamir Tamamlandı").length;
    const openTickets = supportTickets.filter(tk => tk.status !== "resolved").length;
    const pendingVerification = mechanicsList.filter(m => !m.verified).length;
    const avgRating = mechanicsList.length ? (mechanicsList.reduce((s, m) => s + m.rating, 0) / mechanicsList.length).toFixed(1) : "-";
    const suspendedOwners = ownersDirectory.filter(o => o.status === "suspended").length;
    const suspendedMechanics = mechanicsList.filter(m => (mechanicAdminOverrides[m.id]?.status || "active") === "suspended").length;
    const slaBreached = supportTickets.filter(ticketSlaBreached).length;
    const totalReviews = mechanicsList.reduce((s, m) => s + (m.reviews || 0), 0);
    const totalCities = new Set(mechanicsList.map(m => (m.address || "").split("/").pop().trim()).filter(Boolean)).size;
    return { totalOwners, totalMechanics, activeCarListings, activeJobListings, totalAppointments, completedThisMonth, openTickets, pendingVerification, avgRating, suspendedOwners, suspendedMechanics, slaBreached, totalUsers: totalOwners + totalMechanics, totalReviews, totalCities };
  }, [ownersDirectory, mechanicsList, listings, jobListings, appointments, supportTickets, mechanicAdminOverrides]);
  const adminAllUsers = useMemo(() => {
    const owners = ownersDirectory.map(o => ({ type: "owner" as const, id: o.id, name: o.name, email: o.email, phone: o.phone, status: o.status, joinDate: o.joinDate, city: o.city, password: o.password || "demo1234", extra: `${o.vehicleCount} araç · ${o.apptCount} randevu · ${o.city}` }));
    const mechs = mechanicsList.map(m => {
      const ov = mechanicAdminOverrides[m.id] || {};
      const city = (m.address || "").split("/").pop().trim();
      return { type: "mechanic" as const, id: m.id, name: m.name, email: ov.email || `${slugifyForEmail(m.name)}@fixperto.com`, phone: ov.phone || "+90 5xx xxx xx xx", status: ov.status || "active", joinDate: ov.joinDate || "2026-01-01", password: ov.password || "demo1234", city, specialty: m.specialty, address: m.address, price: m.price, verified: m.verified, verificationDocs: m.verificationDocs || [], extra: `${m.specialty} · ${m.rating}★ (${m.reviews})${m.verified ? "" : " · Doğrulanmamış"}` };
    });
    return [...owners, ...mechs];
  }, [ownersDirectory, mechanicsList, mechanicAdminOverrides]);
  const adminFilteredUsers = useMemo(() => {
    const q = adminUserSearch.trim().toLocaleLowerCase("tr-TR");
    return adminAllUsers.filter(u => {
      if (adminUserTypeFilter !== "all" && u.type !== adminUserTypeFilter) return false;
      if (q && !(u.name.toLocaleLowerCase("tr-TR").includes(q) || u.email.toLocaleLowerCase("tr-TR").includes(q))) return false;
      return true;
    });
  }, [adminAllUsers, adminUserTypeFilter, adminUserSearch]);
  const openAdminUserEdit = (u) => {
    setSelectedAdminUser(u);
    setAdminEditForm({
      name: u.name, email: u.email, phone: u.phone, status: u.status, city: u.city || "",
      specialty: u.specialty || "", address: u.address || "", price: u.price || "", verified: !!u.verified,
      newPassword: "",
    });
  };
  const saveAdminUserEdit = () => {
    if (!selectedAdminUser || !adminEditForm) return;
    if (selectedAdminUser.type === "owner") {
      const patch = { name: adminEditForm.name, email: adminEditForm.email, phone: adminEditForm.phone, status: adminEditForm.status, city: adminEditForm.city };
      Object.entries(patch).forEach(([field, newValue]) => { const oldValue = selectedAdminUser[field]; if (String(oldValue ?? "") !== String(newValue ?? "")) logAdminChange({ targetType: "owner", targetId: selectedAdminUser.id, field, oldValue, newValue }); });
      setOwnersDirectory(list => list.map(o => o.id === selectedAdminUser.id ? { ...o, ...patch } : o));
      persist(api.owners.update(selectedAdminUser.id, patch), "Kullanıcı bilgisi kaydedilemedi");
    } else {
      const corePatch = { name: adminEditForm.name, specialty: adminEditForm.specialty, address: adminEditForm.address, price: Number(adminEditForm.price) || selectedAdminUser.price, verified: adminEditForm.verified };
      Object.entries(corePatch).forEach(([field, newValue]) => { const oldValue = selectedAdminUser[field]; if (String(oldValue ?? "") !== String(newValue ?? "")) logAdminChange({ targetType: "mechanic", targetId: selectedAdminUser.id, field, oldValue, newValue }); });
      setMechanicsList(list => list.map(m => m.id === selectedAdminUser.id ? { ...m, ...corePatch } : m));
      persist(api.mechanics.update(selectedAdminUser.id, corePatch), "Tamirci bilgisi kaydedilemedi");
      // Not: email/phone/status alanları mechanicOverride olarak yalnızca istemci tarafında tutuluyor —
      // backend mechanics şemasında bu alanlar yok (demo amaçlı, gerçek bir üretim sisteminde
      // mechanics tablosuna eklenmesi gerekir; bkz. REFACTOR_REPORT.md).
      const overridePatch = { email: adminEditForm.email, phone: adminEditForm.phone, status: adminEditForm.status };
      Object.entries(overridePatch).forEach(([field, newValue]) => { const oldValue = selectedAdminUser[field]; if (String(oldValue ?? "") !== String(newValue ?? "")) logAdminChange({ targetType: "mechanicOverride", targetId: selectedAdminUser.id, field, oldValue, newValue }); });
      setMechanicAdminOverrides(ov => ({ ...ov, [selectedAdminUser.id]: { ...ov[selectedAdminUser.id], ...overridePatch } }));
    }
    setToast({ type: "info", text: "✅ Kullanıcı bilgileri güncellendi." });
    setSelectedAdminUser(null); setAdminEditForm(null);
  };
  const toggleAdminUserStatus = (u) => {
    const nextStatus = u.status === "active" ? "suspended" : "active";
    if (u.type === "owner") { setOwnersDirectory(list => list.map(o => o.id === u.id ? { ...o, status: nextStatus } : o)); persist(api.owners.update(u.id, { status: nextStatus }), "Kullanıcı durumu kaydedilemedi"); }
    else setMechanicAdminOverrides(ov => ({ ...ov, [u.id]: { ...ov[u.id], status: nextStatus } }));
    logAdminChange({ targetType: u.type === "owner" ? "owner" : "mechanicOverride", targetId: u.id, field: "status", oldValue: u.status, newValue: nextStatus });
    setToast({ type: "info", text: nextStatus === "suspended" ? "🚫 Kullanıcı askıya alındı." : "✅ Kullanıcı yeniden etkinleştirildi." });
  };
  // ---- Şifre yardımı: doğrudan yeni şifre belirleme veya sıfırlama bağlantısı gönderme (demo) ----
  const resetUserPassword = () => {
    if (!selectedAdminUser || !adminEditForm || !adminEditForm.newPassword.trim()) return;
    const pwd = adminEditForm.newPassword.trim();
    const pwdTargetType = selectedAdminUser.type === "owner" ? "owner" : "mechanicOverride";
    logAdminChange({ targetType: pwdTargetType, targetId: selectedAdminUser.id, field: "password", oldValue: selectedAdminUser.password, newValue: pwd });
    if (selectedAdminUser.type === "owner") { setOwnersDirectory(list => list.map(o => o.id === selectedAdminUser.id ? { ...o, password: pwd } : o)); persist(api.owners.update(selectedAdminUser.id, { password: pwd }), "Şifre kaydedilemedi"); }
    else setMechanicAdminOverrides(ov => ({ ...ov, [selectedAdminUser.id]: { ...ov[selectedAdminUser.id], password: pwd } }));
    setAdminEditForm(f => ({ ...f, newPassword: "" }));
    setToast({ type: "info", text: "🔑 Şifre güncellendi. Kullanıcıya yeni şifresi iletilecek (demo)." });
  };
  const sendPasswordResetLink = () => {
    if (!selectedAdminUser) return;
    setToast({ type: "info", text: `✉️ Şifre sıfırlama bağlantısı ${selectedAdminUser.email} adresine gönderildi (demo).` });
  };
  // ---- Kullanıcının tam profil sayfası (satır satır düzenlenebilir) ----
  const openAdminProfileView = (u) => { setAdminProfileViewUser({ type: u.type, id: u.id }); setSelectedAdminUser(null); setAdminEditForm(null); setEditingProfileField(null); };
  const viewingUser = adminProfileViewUser ? adminAllUsers.find(u => u.type === adminProfileViewUser.type && u.id === adminProfileViewUser.id) : null;
  const profileFieldOldValueRef = useRef(undefined);
  const startEditProfileField = (key, value) => { setEditingProfileField(key); setProfileFieldDraft(String(value ?? "")); profileFieldOldValueRef.current = value; };
  const cancelEditProfileField = () => { setEditingProfileField(null); setProfileFieldDraft(""); };
  const ADMIN_NUMERIC_PROFILE_FIELDS = ["vehicleCount", "apptCount", "price", "rating", "reviews", "avgResponseMinutes"];
  const saveProfileField = (user, key) => {
    let value: any = profileFieldDraft;
    if (ADMIN_NUMERIC_PROFILE_FIELDS.includes(key)) value = Number(value) || 0;
    if (key === "verified") value = value === "true";
    const oldValue = profileFieldOldValueRef.current;
    if (String(oldValue ?? "") !== String(value ?? "")) {
      const targetType = user.type === "owner" ? "owner" : (["email", "phone", "status"].includes(key) ? "mechanicOverride" : "mechanic");
      logAdminChange({ targetType, targetId: user.id, field: key, oldValue, newValue: value });
    }
    if (user.type === "owner") {
      setOwnersDirectory(list => list.map(o => o.id === user.id ? { ...o, [key]: value } : o));
      persist(api.owners.update(user.id, { [key]: value }), "Profil bilgisi kaydedilemedi");
    } else if (["email", "phone", "status"].includes(key)) {
      // Bu alanlar mechanics şemasında yok — sadece istemci tarafı demo katmanı (bkz. saveAdminUserEdit notu).
      setMechanicAdminOverrides(ov => ({ ...ov, [user.id]: { ...ov[user.id], [key]: value } }));
    } else {
      setMechanicsList(list => list.map(m => m.id === user.id ? { ...m, [key]: value } : m));
      persist(api.mechanics.update(user.id, { [key]: value }), "Profil bilgisi kaydedilemedi");
    }
    setEditingProfileField(null); setProfileFieldDraft("");
    setToast({ type: "info", text: "✅ Güncellendi." });
  };
  const renderAdminProfileRow = (user, key, label, value, opts: any = {}) => {
    const editing = editingProfileField === key;
    return (
      <div key={key} className="flex items-center justify-between gap-3 py-3 border-b border-gray-100 last:border-0">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-gray-400 mb-0.5">{label}</p>
          {editing ? (
            opts.type === "toggle" ? (
              <div className="flex gap-2 mt-1">
                {opts.options.map(o => (<button key={o.value} onClick={() => setProfileFieldDraft(o.value)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${String(profileFieldDraft) === o.value ? "bg-gray-900 border-gray-900 text-white" : "border-gray-200 text-gray-500"}`}>{o.label}</button>))}
              </div>
            ) : (
              <input autoFocus type={opts.numeric ? "number" : "text"} value={profileFieldDraft} onChange={(e) => setProfileFieldDraft(e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-sm mt-0.5" onKeyDown={(e) => { if (e.key === "Enter") saveProfileField(user, key); if (e.key === "Escape") cancelEditProfileField(); }} />
            )
          ) : (
            <p className="text-sm font-medium text-gray-800">{opts.display !== undefined ? opts.display : (value || value === 0 ? value : "—")}</p>
          )}
        </div>
        {editing ? (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => saveProfileField(user, key)} aria-label="Kaydet" className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition"><Check size={13} /></button>
            <button onClick={cancelEditProfileField} aria-label="Vazgeç" className="w-7 h-7 rounded-lg border border-gray-200 text-gray-400 flex items-center justify-center hover:bg-gray-50 transition"><X size={13} /></button>
          </div>
        ) : (
          <button onClick={() => startEditProfileField(key, value)} aria-label={`${label} düzenle`} className="w-7 h-7 rounded-lg border border-gray-200 text-gray-400 flex items-center justify-center hover:bg-gray-50 hover:text-gray-600 transition flex-shrink-0"><Pencil size={12} /></button>
        )}
      </div>
    );
  };
  // ---- Profil sayfasındaki ilan/hizmet/iş ilanı yönetimi (admin doğrudan görebilir ve düzenleyebilir) ----
  const toggleListingRemoved = (id) => {
    const l = listings.find(x => x.id === id);
    if (l) { applyAdminFieldChange("listing", id, "adminRemoved", !l.adminRemoved); logAdminChange({ targetType: "listing", targetId: id, field: "adminRemoved", oldValue: l.adminRemoved, newValue: !l.adminRemoved }); }
    setToast({ type: "info", text: "✅ İlan durumu güncellendi." });
  };
  const updateListingField = (id, field, value) => { setListings(ls => ls.map(l => l.id === id ? { ...l, [field]: value } : l)); persist(api.listings.update(id, { [field]: value }), "İlan kaydedilemedi"); };
  const updateMechService = (mechId, idx, field, value) => {
    const mech = mechanicsList.find(m => m.id === mechId);
    const services = mech ? mech.services.map((s, i) => i === idx ? { ...s, [field]: value } : s) : [];
    setMechanicsList(list => list.map(m => m.id === mechId ? { ...m, services } : m));
    persist(api.mechanics.update(mechId, { services }), "Hizmet kaydedilemedi");
  };
  const removeMechService = (mechId, idx) => {
    const mech = mechanicsList.find(m => m.id === mechId);
    const oldServices = mech ? mech.services : [];
    const newServices = oldServices.filter((_, i) => i !== idx);
    applyAdminFieldChange("mechanicServicesArray", mechId, "services", newServices);
    logAdminChange({ targetType: "mechanicServicesArray", targetId: mechId, field: "services", oldValue: oldServices, newValue: newServices });
    setToast({ type: "info", text: "🗑️ Hizmet kaldırıldı." });
  };
  const addMechService = (mechId) => {
    const mech = mechanicsList.find(m => m.id === mechId);
    const oldServices = mech ? mech.services : [];
    const newServices = [...oldServices, { name: "Yeni Hizmet", price: "0₺", fixed: false }];
    applyAdminFieldChange("mechanicServicesArray", mechId, "services", newServices);
    logAdminChange({ targetType: "mechanicServicesArray", targetId: mechId, field: "services", oldValue: oldServices, newValue: newServices });
  };
  const toggleJobListingStatus = (jobId) => {
    const j = jobListings.find(x => x.id === jobId);
    const nextStatus = j && j.status === "active" ? "closed" : "active";
    if (j) { applyAdminFieldChange("job", jobId, "status", nextStatus); logAdminChange({ targetType: "job", targetId: jobId, field: "status", oldValue: j.status, newValue: nextStatus }); }
    setToast({ type: "info", text: "✅ İş ilanı durumu güncellendi." });
  };
  const updateJobField = (id, field, value) => { setJobListings(js => js.map(j => j.id === id ? { ...j, [field]: value } : j)); persist(api.jobs.update(id, { [field]: value }), "İş ilanı kaydedilemedi"); };
  // ---- Paylaşılan araç/iş ilanı kartı — hem araç sahibi hem tamirci profilinde kullanılıyor.
  // "Detaylar" ile açılan bölümde ilanın tüm alanları (marka, model, yıl, km, yakıt, vites,
  // güç, renk, ilk tescil, açıklama, durum) tek tek düzenlenebiliyor. ----
  const renderAdminListingCard = (l) => {
    const expanded = expandedAdminListingId === l.id;
    return (
      <div key={l.id} className="bg-gray-50 rounded-xl p-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <p className="text-xs font-semibold text-gray-800 truncate">{l.brand} {l.model} <span className="text-gray-300 font-normal">#{l.id}</span></p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5" title="Kaç kez paylaşıldı"><Share2 size={10} /> {l.shareCount || 0}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${l.adminRemoved ? "bg-gray-800 text-white" : l.status === "sold" ? "bg-red-50 text-red-500" : l.status === "reserved" ? "bg-gray-200 text-gray-700" : "bg-green-50 text-green-600"}`}>{l.adminRemoved ? "Kaldırıldı" : l.status === "sold" ? "Satıldı" : l.status === "reserved" ? "Rezerve" : "Aktif"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input value={l.price} onChange={(e) => updateListingField(l.id, "price", e.target.value)} {...trackInputProps("listing", l.id, "price", l.price)} className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs" />
          <button onClick={() => toggleListingRemoved(l.id)} className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg flex-shrink-0 transition ${l.adminRemoved ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-red-50 text-red-500 hover:bg-red-100"}`}>{l.adminRemoved ? "Geri Yükle" : "Kaldır"}</button>
          <button onClick={() => setExpandedAdminListingId(x => x === l.id ? null : l.id)} className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg flex-shrink-0 border border-gray-200 text-gray-600 hover:bg-gray-100 transition">{expanded ? "Kapat" : "Detaylar"}</button>
        </div>
        {expanded && (
          <div className="mt-2.5 pt-2.5 border-t border-gray-200 grid grid-cols-2 gap-2">
            <div><label className="text-[10px] text-gray-400 mb-0.5 block">Marka</label><input value={l.brand} onChange={(e) => updateListingField(l.id, "brand", e.target.value)} {...trackInputProps("listing", l.id, "brand", l.brand)} className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs" /></div>
            <div><label className="text-[10px] text-gray-400 mb-0.5 block">Model</label><input value={l.model} onChange={(e) => updateListingField(l.id, "model", e.target.value)} {...trackInputProps("listing", l.id, "model", l.model)} className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs" /></div>
            <div><label className="text-[10px] text-gray-400 mb-0.5 block">Yıl</label><input value={l.year} onChange={(e) => updateListingField(l.id, "year", e.target.value)} {...trackInputProps("listing", l.id, "year", l.year)} className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs" /></div>
            <div><label className="text-[10px] text-gray-400 mb-0.5 block">Kilometre</label><input value={l.km} onChange={(e) => updateListingField(l.id, "km", e.target.value)} {...trackInputProps("listing", l.id, "km", l.km)} className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs" /></div>
            <div><label className="text-[10px] text-gray-400 mb-0.5 block">Yakıt Tipi</label><input value={l.fuelType} onChange={(e) => updateListingField(l.id, "fuelType", e.target.value)} {...trackInputProps("listing", l.id, "fuelType", l.fuelType)} className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs" /></div>
            <div><label className="text-[10px] text-gray-400 mb-0.5 block">Vites</label><input value={l.transmission} onChange={(e) => updateListingField(l.id, "transmission", e.target.value)} {...trackInputProps("listing", l.id, "transmission", l.transmission)} className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs" /></div>
            <div><label className="text-[10px] text-gray-400 mb-0.5 block">Güç (hp)</label><input value={l.power} onChange={(e) => updateListingField(l.id, "power", e.target.value)} {...trackInputProps("listing", l.id, "power", l.power)} className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs" /></div>
            <div><label className="text-[10px] text-gray-400 mb-0.5 block">Renk</label><input value={l.color} onChange={(e) => updateListingField(l.id, "color", e.target.value)} {...trackInputProps("listing", l.id, "color", l.color)} className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs" /></div>
            <div className="col-span-2"><label className="text-[10px] text-gray-400 mb-0.5 block">İlk Tescil</label><input value={l.firstReg} onChange={(e) => updateListingField(l.id, "firstReg", e.target.value)} {...trackInputProps("listing", l.id, "firstReg", l.firstReg)} className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs" /></div>
            <div className="col-span-2"><label className="text-[10px] text-gray-400 mb-0.5 block">Açıklama</label><textarea value={l.description} onChange={(e) => updateListingField(l.id, "description", e.target.value)} {...trackInputProps("listing", l.id, "description", l.description)} rows={2} className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs resize-none" /></div>
            <div className="col-span-2"><label className="text-[10px] text-gray-400 mb-1 block">Durum</label>
              <div className="flex gap-1.5">
                {[{ value: "active", label: "Aktif" }, { value: "reserved", label: "Rezerve" }, { value: "sold", label: "Satıldı" }].map(o => (<button key={o.value} onClick={() => { if (l.status !== o.value) logAdminChange({ targetType: "listing", targetId: l.id, field: "status", oldValue: l.status, newValue: o.value }); updateListingField(l.id, "status", o.value); }} className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition ${l.status === o.value ? "bg-gray-900 border-gray-900 text-white" : "border-gray-200 text-gray-500"}`}>{o.label}</button>))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  // Paylaşılan iş ilanı kartı — başlık, çalışma şekli, deneyim, konum, maaş aralığı, açıklama,
  // aranan nitelikler ve beceriler dahil tüm alanlar admin tarafından düzenlenebiliyor.
  const renderAdminJobCard = (j) => {
    const expanded = expandedAdminJobId === j.id;
    return (
      <div key={j.id} className="bg-gray-50 rounded-xl p-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-gray-800 truncate">{j.title}</p><p className="text-[10px] text-gray-400 flex items-center gap-1">{j.location} · {j.applicants.length} başvuru · <Share2 size={10} className="inline" /> {j.shareCount || 0} paylaşım</p></div>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${j.status === "active" ? "bg-green-50 text-green-600" : "bg-gray-200 text-gray-600"}`}>{j.status === "active" ? "Açık" : "Kapalı"}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => toggleJobListingStatus(j.id)} className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg flex-shrink-0 transition ${j.status === "active" ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>{j.status === "active" ? "Kapat" : "Aç"}</button>
          <button onClick={() => setExpandedAdminJobId(x => x === j.id ? null : j.id)} className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg flex-shrink-0 border border-gray-200 text-gray-600 hover:bg-gray-100 transition">{expanded ? "Kapat" : "Detaylar"}</button>
        </div>
        {expanded && (
          <div className="mt-2.5 pt-2.5 border-t border-gray-200 grid grid-cols-2 gap-2">
            <div className="col-span-2"><label className="text-[10px] text-gray-400 mb-0.5 block">Pozisyon</label><input value={j.title} onChange={(e) => updateJobField(j.id, "title", e.target.value)} {...trackInputProps("job", j.id, "title", j.title)} className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs" /></div>
            <div><label className="text-[10px] text-gray-400 mb-0.5 block">Çalışma Şekli</label><input value={j.employmentType} onChange={(e) => updateJobField(j.id, "employmentType", e.target.value)} {...trackInputProps("job", j.id, "employmentType", j.employmentType)} className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs" /></div>
            <div><label className="text-[10px] text-gray-400 mb-0.5 block">Deneyim Seviyesi</label><input value={j.experienceLevel} onChange={(e) => updateJobField(j.id, "experienceLevel", e.target.value)} {...trackInputProps("job", j.id, "experienceLevel", j.experienceLevel)} className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs" /></div>
            <div className="col-span-2"><label className="text-[10px] text-gray-400 mb-0.5 block">Konum</label><input value={j.location} onChange={(e) => updateJobField(j.id, "location", e.target.value)} {...trackInputProps("job", j.id, "location", j.location)} className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs" /></div>
            <div><label className="text-[10px] text-gray-400 mb-0.5 block">Min. Maaş</label><input value={j.salaryMin} onChange={(e) => updateJobField(j.id, "salaryMin", e.target.value)} {...trackInputProps("job", j.id, "salaryMin", j.salaryMin)} className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs" /></div>
            <div><label className="text-[10px] text-gray-400 mb-0.5 block">Maks. Maaş</label><input value={j.salaryMax} onChange={(e) => updateJobField(j.id, "salaryMax", e.target.value)} {...trackInputProps("job", j.id, "salaryMax", j.salaryMax)} className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs" /></div>
            <div className="col-span-2"><label className="text-[10px] text-gray-400 mb-0.5 block">Açıklama</label><textarea value={j.description} onChange={(e) => updateJobField(j.id, "description", e.target.value)} {...trackInputProps("job", j.id, "description", j.description)} rows={2} className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs resize-none" /></div>
            <div className="col-span-2"><label className="text-[10px] text-gray-400 mb-0.5 block">Aranan Nitelikler (virgülle ayırın)</label><input value={(j.requirements || []).join(", ")} onChange={(e) => updateJobField(j.id, "requirements", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} {...trackInputProps("job", j.id, "requirements", j.requirements, (e) => e.target.value.split(",").map(s => s.trim()).filter(Boolean))} className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs" /></div>
            <div className="col-span-2"><label className="text-[10px] text-gray-400 mb-0.5 block">Beceriler (virgülle ayırın)</label><input value={(j.skills || []).join(", ")} onChange={(e) => updateJobField(j.id, "skills", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} {...trackInputProps("job", j.id, "skills", j.skills, (e) => e.target.value.split(",").map(s => s.trim()).filter(Boolean))} className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs" /></div>
          </div>
        )}
      </div>
    );
  };
  // ---- Kişi/tamirci bazında analiz ----
  const openAdminAnalyze = (u) => setAdminAnalyzeUserKey({ type: u.type, id: u.id });
  const analyzingUser = adminAnalyzeUserKey ? adminAllUsers.find(u => u.type === adminAnalyzeUserKey.type && u.id === adminAnalyzeUserKey.id) : null;
  const adminUserAnalytics = useMemo(() => {
    if (!analyzingUser) return null;
    if (analyzingUser.type === "owner") {
      const myAppts = appointments.filter(a => a.customer === analyzingUser.name);
      const byStatus: Record<string, number> = {};
      myAppts.forEach(a => { byStatus[a.status] = (byStatus[a.status] || 0) + 1; });
      const myListings = listings.filter(l => l.sellerName === analyzingUser.name);
      const myTickets = supportTickets.filter(tk => tk.fromName === analyzingUser.name);
      return {
        apptCount: myAppts.length, byStatus,
        listingCount: myListings.length, activeListings: myListings.filter(l => l.status !== "sold" && !l.adminRemoved).length, soldListings: myListings.filter(l => l.status === "sold").length,
        ticketCount: myTickets.length, openTickets: myTickets.filter(tk => tk.status !== "resolved").length,
        totalShares: myListings.reduce((s, l) => s + (l.shareCount || 0), 0),
      };
    }
    const myAppts = appointments.filter(a => a.mechanicName === analyzingUser.name);
    const completed = myAppts.filter(a => a.status === "Tamir Tamamlandı").length;
    const byStatus: Record<string, number> = {};
    myAppts.forEach(a => { byStatus[a.status] = (byStatus[a.status] || 0) + 1; });
    const myListings = listings.filter(l => l.sellerType === "mechanic" && l.sellerName === analyzingUser.name);
    const myJobs = jobListings.filter(j => j.mechanicId === analyzingUser.id);
    const totalApplicants = myJobs.reduce((s, j) => s + (j.applicants || []).length, 0);
    const myTickets = supportTickets.filter(tk => tk.fromName === analyzingUser.name);
    const estRevenue = completed * ((analyzingUser as any).price || 0);
    const ownShareCount = mechanicsList.find(m => m.id === analyzingUser.id)?.shareCount || 0;
    const totalShares = ownShareCount + myListings.reduce((s, l) => s + (l.shareCount || 0), 0) + myJobs.reduce((s, j) => s + (j.shareCount || 0), 0);
    return {
      apptCount: myAppts.length, completed, byStatus, estRevenue,
      listingCount: myListings.length, activeListings: myListings.filter(l => !l.adminRemoved).length,
      jobCount: myJobs.length, activeJobs: myJobs.filter(j => j.status === "active").length, totalApplicants,
      ticketCount: myTickets.length, openTickets: myTickets.filter(tk => tk.status !== "resolved").length,
      ownShareCount, totalShares,
    };
  }, [analyzingUser, appointments, listings, jobListings, supportTickets, mechanicsList]);
  // Binlerce talep birikse bile en acil olanlar hep üstte: önce açık/inceleniyor, sonra çözülenler;
  // aynı grup içinde SLA'yı aşanlar ve yüksek öncelikliler öne alınıyor, en son tarihe göre sıralanıyor.
  const adminFilteredTickets = useMemo(() => {
    const q = adminTicketSearch.trim().toLocaleLowerCase("tr-TR");
    const filtered = supportTickets.filter(tk => {
      if (adminTicketStatusFilter !== "all" && tk.status !== adminTicketStatusFilter) return false;
      if (adminTicketTypeFilter !== "all" && tk.type !== adminTicketTypeFilter) return false;
      if (adminTicketPriorityFilter !== "all" && tk.priority !== adminTicketPriorityFilter) return false;
      if (q && !(tk.subject.toLocaleLowerCase("tr-TR").includes(q) || tk.fromName.toLocaleLowerCase("tr-TR").includes(q))) return false;
      return true;
    });
    return filtered.slice().sort((a, b) => {
      const aActive = a.status !== "resolved", bActive = b.status !== "resolved";
      if (aActive !== bActive) return aActive ? -1 : 1;
      const aBreach = ticketSlaBreached(a), bBreach = ticketSlaBreached(b);
      if (aBreach !== bBreach) return aBreach ? -1 : 1;
      const pw = (ADMIN_TICKET_PRIORITY_WEIGHT[a.priority] ?? 3) - (ADMIN_TICKET_PRIORITY_WEIGHT[b.priority] ?? 3);
      if (pw !== 0) return pw;
      return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
    });
  }, [supportTickets, adminTicketStatusFilter, adminTicketTypeFilter, adminTicketPriorityFilter, adminTicketSearch]);
  const adminTicketAnalytics = useMemo(() => {
    const byStatus = { open: 0, in_review: 0, resolved: 0 };
    const byPriority = { high: 0, medium: 0, low: 0 };
    const byType: Record<string, number> = {};
    let resolvedWithDate = 0, totalResolutionDays = 0;
    supportTickets.forEach(tk => {
      byStatus[tk.status] = (byStatus[tk.status] || 0) + 1;
      byPriority[tk.priority] = (byPriority[tk.priority] || 0) + 1;
      byType[tk.type] = (byType[tk.type] || 0) + 1;
      if (tk.status === "resolved" && tk.resolvedDate) {
        const days = Math.max(0, Math.round((new Date(tk.resolvedDate).getTime() - new Date(tk.createdDate).getTime()) / 86400000));
        totalResolutionDays += days; resolvedWithDate++;
      }
    });
    const typeBreakdown = Object.entries(byType).sort((a, b) => b[1] - a[1]);
    return {
      total: supportTickets.length, byStatus, byPriority, typeBreakdown,
      slaBreachedCount: supportTickets.filter(ticketSlaBreached).length,
      avgResolutionDays: resolvedWithDate ? Math.round((totalResolutionDays / resolvedWithDate) * 10) / 10 : null,
    };
  }, [supportTickets]);
  const selectedTicket = supportTickets.find(tk => tk.id === selectedTicketId) || null;
  const updateTicketStatus = (id, status) => {
    const tk = supportTickets.find(t => t.id === id);
    const resolvedDate = status === "resolved" ? TODAY.toISOString().slice(0, 10) : null;
    setSupportTickets(list => list.map(t => t.id === id ? { ...t, status, resolvedDate } : t));
    persist(api.tickets.update(id, { status, resolvedDate }), "Talep durumu kaydedilemedi");
    if (tk) logAdminChange({ targetType: "ticket", targetId: id, field: "status", oldValue: tk.status, newValue: status });
    setToast({ type: "info", text: `📋 Talep durumu güncellendi: ${ADMIN_TICKET_STATUS_LABELS[status]}` });
    if (tk && status === "resolved") fireNotification("Destek talebiniz çözüldü ✅", `"${tk.subject}" talebiniz çözüldü olarak işaretlendi.`, tk.fromType === "mechanic" ? mechSettings.notifyMessages : ownerSettings.notifyMessages, tk.fromType === "mechanic" ? "mechanic" : "owner", { type: "supportTicket" });
  };
  const saveTicketNote = () => {
    if (!selectedTicketId) return;
    const tk = supportTickets.find(t => t.id === selectedTicketId);
    setSupportTickets(list => list.map(t => t.id === selectedTicketId ? { ...t, adminNote: adminTicketNote } : t));
    persist(api.tickets.update(selectedTicketId, { adminNote: adminTicketNote }), "Not kaydedilemedi");
    if (tk && (tk.adminNote || "") !== adminTicketNote) logAdminChange({ targetType: "ticket", targetId: selectedTicketId, field: "adminNote", oldValue: tk.adminNote, newValue: adminTicketNote });
    setToast({ type: "info", text: "📝 Not kaydedildi." });
  };
  // ---- Ticket'lardan tetiklenen operasyonel işlemler (iade, ilan kaldırma, yorum silme, doğrulama) ----
  // Her biri birden fazla kaydı aynı anda değiştirdiği için, dokunulan her alan geçmişe AYRI
  // bir satır olarak yazılıyor — böylece "Geri Al" ile istenirse sadece bir parçası bile geri alınabilir.
  const issueTicketRefund = (id) => {
    const tk = supportTickets.find(t => t.id === id);
    if (!tk || tk.refunded) return;
    const amountMatch = tk.description.match(/(\d[\d.,]*)\s*₺/);
    const amount = amountMatch ? amountMatch[1] : "—";
    const apptIdMatch = tk.relatedNote.match(/#(\d+)/);
    if (apptIdMatch) {
      const aid = Number(apptIdMatch[1]);
      const appt = appointments.find(a => a.id === aid);
      if (appt) {
        logAdminChange({ targetType: "appointment", targetId: aid, field: "status", oldValue: appt.status, newValue: "İptal Edildi" });
        logAdminChange({ targetType: "appointment", targetId: aid, field: "depositRefunded", oldValue: appt.depositRefunded, newValue: true });
      }
      setAppointments(apps => apps.map(a => a.id === aid ? { ...a, status: "İptal Edildi", depositRefunded: true } : a));
      persist(api.appointments.update(aid, { status: "İptal Edildi", depositRefunded: true }), "Randevu güncellenemedi");
    }
    const newNote = (tk.adminNote ? tk.adminNote + "\n" : "") + `${amount}₺ iade edildi, randevu iptal edildi (${TODAY.toLocaleDateString("tr-TR")}).`;
    logAdminChange({ targetType: "ticket", targetId: id, field: "refunded", oldValue: tk.refunded, newValue: true });
    logAdminChange({ targetType: "ticket", targetId: id, field: "status", oldValue: tk.status, newValue: "resolved" });
    logAdminChange({ targetType: "ticket", targetId: id, field: "adminNote", oldValue: tk.adminNote, newValue: newNote });
    setSupportTickets(list => list.map(t => t.id === id ? { ...t, refunded: true, status: "resolved", adminNote: newNote, resolvedDate: TODAY.toISOString().slice(0, 10) } : t));
    persist(api.tickets.update(id, { refunded: true, status: "resolved", adminNote: newNote, resolvedDate: TODAY.toISOString().slice(0, 10) }), "Talep güncellenemedi");
    setToast({ type: "info", text: `💳 ${amount}₺ iade işlemi onaylandı ve randevu iptal edildi (demo).` });
  };
  const removeReportedListing = (id) => {
    const tk = supportTickets.find(t => t.id === id);
    if (!tk) return;
    const listingIdMatch = tk.relatedNote.match(/#(\d+)/);
    if (!listingIdMatch) return;
    const lid = Number(listingIdMatch[1]);
    const l = listings.find(x => x.id === lid);
    if (l) logAdminChange({ targetType: "listing", targetId: lid, field: "adminRemoved", oldValue: l.adminRemoved, newValue: true });
    setListings(ls => ls.map(x => x.id === lid ? { ...x, adminRemoved: true } : x));
    persist(api.listings.update(lid, { adminRemoved: true }), "İlan güncellenemedi");
    const newNote = (tk.adminNote ? tk.adminNote + "\n" : "") + `İlan #${lid} kaldırıldı (${TODAY.toLocaleDateString("tr-TR")}).`;
    logAdminChange({ targetType: "ticket", targetId: id, field: "status", oldValue: tk.status, newValue: "resolved" });
    logAdminChange({ targetType: "ticket", targetId: id, field: "adminNote", oldValue: tk.adminNote, newValue: newNote });
    setSupportTickets(list => list.map(t => t.id === id ? { ...t, status: "resolved", adminNote: newNote, resolvedDate: TODAY.toISOString().slice(0, 10) } : t));
    persist(api.tickets.update(id, { status: "resolved", adminNote: newNote, resolvedDate: TODAY.toISOString().slice(0, 10) }), "Talep güncellenemedi");
    setToast({ type: "info", text: `🚫 İlan #${lid} platformdan kaldırıldı.` });
  };
  const removeFlaggedReview = (id) => {
    const tk = supportTickets.find(t => t.id === id);
    if (!tk) return;
    const mech = mechanicsList.find(m => m.name === tk.fromName);
    if (!mech) return;
    const removedCount = (mech.reviewList || []).filter(r => r.flagged).length;
    if (removedCount === 0) { setToast({ type: "info", text: "Kaldırılacak işaretli yorum bulunamadı." }); return; }
    const oldReviewList = mech.reviewList || [];
    const newReviewList = oldReviewList.filter(r => !r.flagged);
    const newReviewsCount = Math.max(0, mech.reviews - removedCount);
    logAdminChange({ targetType: "mechanicReviewList", targetId: mech.id, field: "reviewList", oldValue: oldReviewList, newValue: newReviewList, extra: { reviews: mech.reviews } });
    setMechanicsList(list => list.map(m => m.id === mech.id ? { ...m, reviewList: newReviewList, reviews: newReviewsCount } : m));
    persist(api.mechanics.update(mech.id, { reviewList: newReviewList, reviews: newReviewsCount }), "Yorum güncellenemedi");
    const newNote = (tk.adminNote ? tk.adminNote + "\n" : "") + `Uygunsuz yorum kaldırıldı (${TODAY.toLocaleDateString("tr-TR")}).`;
    logAdminChange({ targetType: "ticket", targetId: id, field: "status", oldValue: tk.status, newValue: "resolved" });
    logAdminChange({ targetType: "ticket", targetId: id, field: "adminNote", oldValue: tk.adminNote, newValue: newNote });
    setSupportTickets(list => list.map(t => t.id === id ? { ...t, status: "resolved", adminNote: newNote, resolvedDate: TODAY.toISOString().slice(0, 10) } : t));
    persist(api.tickets.update(id, { status: "resolved", adminNote: newNote, resolvedDate: TODAY.toISOString().slice(0, 10) }), "Talep güncellenemedi");
    setToast({ type: "info", text: "🗑️ Şikayet edilen yorum kaldırıldı." });
  };
  const grantVerification = (id) => {
    const tk = supportTickets.find(t => t.id === id);
    if (!tk) return;
    const mech = mechanicsList.find(m => m.name === tk.fromName);
    if (mech) { logAdminChange({ targetType: "mechanic", targetId: mech.id, field: "verified", oldValue: mech.verified, newValue: true }); persist(api.mechanics.update(mech.id, { verified: true }), "Doğrulama kaydedilemedi"); }
    setMechanicsList(list => list.map(m => m.name === tk.fromName ? { ...m, verified: true } : m));
    const newNote = (tk.adminNote ? tk.adminNote + "\n" : "") + `Doğrulama rozeti verildi (${TODAY.toLocaleDateString("tr-TR")}).`;
    logAdminChange({ targetType: "ticket", targetId: id, field: "status", oldValue: tk.status, newValue: "resolved" });
    logAdminChange({ targetType: "ticket", targetId: id, field: "adminNote", oldValue: tk.adminNote, newValue: newNote });
    setSupportTickets(list => list.map(t => t.id === id ? { ...t, status: "resolved", adminNote: newNote, resolvedDate: TODAY.toISOString().slice(0, 10) } : t));
    persist(api.tickets.update(id, { status: "resolved", adminNote: newNote, resolvedDate: TODAY.toISOString().slice(0, 10) }), "Talep güncellenemedi");
    setToast({ type: "info", text: "✅ Tamirciye doğrulama rozeti verildi." });
  };
  // ---- Ticket sahibine doğrudan mesaj (dahili nottan ayrı, kullanıcıya "gönderilen" mesaj kaydı) ----
  const sendAdminReply = (id) => {
    if (!adminReplyDraft.trim()) return;
    const tk = supportTickets.find(t => t.id === id);
    const adminReplies = [...(tk?.adminReplies || []), { text: adminReplyDraft.trim(), date: TODAY.toLocaleDateString("tr-TR") }];
    setSupportTickets(list => list.map(t => t.id === id ? { ...t, adminReplies } : t));
    persist(api.tickets.update(id, { adminReplies }), "Yanıt kaydedilemedi");
    setAdminReplyDraft("");
    setToast({ type: "info", text: "✉️ Kullanıcıya mesaj gönderildi (demo)." });
    if (tk) fireNotification("Destek talebinize yanıt geldi 📩", `"${tk.subject}" talebiniz için yeni bir mesaj var.`, tk.fromType === "mechanic" ? mechSettings.notifyMessages : ownerSettings.notifyMessages, tk.fromType === "mechanic" ? "mechanic" : "owner", { type: "supportTicket" });
  };
  // ---- Toplu duyuru (broadcast) ----
  const sendBroadcast = () => {
    if (!broadcastForm.message.trim()) return;
    const message = broadcastForm.message.trim();
    const audience = broadcastForm.audience;
    const count = audience === "all" ? adminAllUsers.length : audience === "owner" ? adminStats.totalOwners : adminStats.totalMechanics;
    const entry = { audience, message, recipientCount: count };
    setBroadcastLog(log => [{ id: Date.now(), ...entry, date: TODAY.toLocaleDateString("tr-TR") }, ...log]);
    // Önceden bu sadece admin'in kendi kayıt defterine yazılıyordu — gerçekte KİMSEYE
    // ulaşmıyordu. Bu demo'da gerçekten etkileşimli tek bir owner ve tek bir mechanic hesabı
    // olduğu için, duyuruyu o hesapların bildirim ziline (notifLog) de düşürüyoruz ki "gönderildi"
    // demek gerçekten bir şey ifade etsin.
    if (audience === "all" || audience === "owner") fireNotification("📢 Fixperto Duyurusu", message, true, "owner", { type: "broadcast" });
    if (audience === "all" || audience === "mechanic") fireNotification("📢 Fixperto Duyurusu", message, true, "mechanic", { type: "broadcast" });
    persist(api.broadcasts.create(entry), "Duyuru kaydedilemedi");
    setToast({ type: "info", text: `📢 Duyuru ${count} kullanıcıya gönderildi.` });
    setBroadcastForm({ audience: "all", message: "" });
    setShowBroadcastModal(false);
  };
  // ---- Analitik: bölge dağılımı + gelir/komisyon tahmini ----
  const adminRegionBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    ownersDirectory.forEach(o => { counts[o.city] = (counts[o.city] || 0) + 1; });
    mechanicsList.forEach(m => { const city = (m.address || "").split("/").pop().trim(); if (city) counts[city] = (counts[city] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [ownersDirectory, mechanicsList]);
  const adminRevenueStats = useMemo(() => {
    const completedAppts = appointments.filter(a => a.status === "Tamir Tamamlandı");
    const avgTicket = mechanicsList.length ? mechanicsList.reduce((s, m) => s + (m.price || 0), 0) / mechanicsList.length : 0;
    const estGMV = completedAppts.length * avgTicket;
    const estCommission = estGMV * PLATFORM_COMMISSION_RATE;
    return { completedCount: completedAppts.length, avgTicket: Math.round(avgTicket), estGMV: Math.round(estGMV), estCommission: Math.round(estCommission) };
  }, [appointments, mechanicsList]);
  const submitAuth = () => {
    if (screen === "signup") {
      if (!isValidEmail(form.email)) { setAuthError("Geçersiz e-posta adresi. Lütfen geçerli bir e-posta girin (örn. ad@ornek.com)."); return; }
      const phoneCheck = validatePhone(form.phone);
      if (!phoneCheck.valid) { setAuthError(phoneCheck.message); return; }
    }
    setAuthError("");
    const isFirstSignup = screen === "signup";
    if (role === "owner") {
      const ownerPatch = { name: form.name || "Araç Sahibi", email: form.email, phone: form.phone };
      updateMyOwnerFields(ownerPatch);
      persist(api.owners.update(MY_OWNER_ID, ownerPatch), "Kayıt bilgileri kaydedilemedi");
      setScreen("owner"); setOwnerTab("search");
    } else setScreen("mechanicDashboard");
    if (isFirstSignup) { setOnboardStep(0); setShowOnboarding(true); }
    // Bildirimler varsayılan olarak açık sayılsın diye: tarayıcı henüz sorulmadıysa girişte hemen soruyoruz.
    if (typeof Notification !== "undefined" && Notification.permission === "default") { requestNotifPermission(); }
  };
  const addVehicle = async () => {
    if (!newVehicle.brand || !newVehicle.model) return;
    if (newVehicle.lastInspection && !isValidDateStr(newVehicle.lastInspection)) { setToast({ type: "info", text: "⚠️ Geçersiz Son Muayene tarihi." }); return; }
    if (newVehicle.lastMaintenance && !isValidDateStr(newVehicle.lastMaintenance)) { setToast({ type: "info", text: "⚠️ Geçersiz Son Bakım tarihi." }); return; }
    if (newVehicle.insuranceEnd && !isValidDateStr(newVehicle.insuranceEnd)) { setToast({ type: "info", text: "⚠️ Geçersiz Sigorta Bitiş tarihi." }); return; }
    const draft = { ownerId: MY_OWNER_ID, ...newVehicle, year: newVehicle.year || "—", listingId: null, reminderOverrides: {}, customReminders: [], history: [] };
    // Önce iyimser (optimistic) bir yerel kayıt gösteriyoruz ki UI anında tepki versin; backend
    // gerçek id'yi döndürünce yerel geçici id'yi onunla değiştiriyoruz.
    const tempId = Date.now();
    setVehicles(vs => [...vs, { id: tempId, ...draft }]);
    setNewVehicle({ brand: "", model: "", year: "", plate: "", country: "tr", city: "", tireType: "mevsimlik", lastInspection: "", lastMaintenance: "", insuranceEnd: "" }); setShowAddVehicle(false);
    if (screen === "booking") setSelectedBookingVehicleId(tempId); if (showQuoteModal) setQuoteVehicleId(tempId);
    setToast({ type: "info", text: "🚘 Araç eklendi." });
    try {
      const created = await api.vehicles.create(draft);
      setVehicles(vs => vs.map(v => v.id === tempId ? created : v));
      if (screen === "booking" && selectedBookingVehicleId === tempId) setSelectedBookingVehicleId(created.id);
      if (showQuoteModal && quoteVehicleId === tempId) setQuoteVehicleId(created.id);
    } catch (err) {
      setToast({ type: "info", text: `⚠️ Araç kaydedilemedi: ${err?.message || "Sunucuya kaydedilemedi."}` });
    }
  };
  const updateVehicleFields = (id, updates) => { setVehicles(vs => vs.map(v => v.id === id ? { ...v, ...updates } : v)); persist(api.vehicles.update(id, updates), "Araç güncellenemedi"); };
  const saveReminderOverride = (vehicleId, kind, override) => {
    if (override.customDate) {
      if (!isValidDateStr(override.customDate)) { setToast({ type: "info", text: "⚠️ Geçersiz tarih. Lütfen geçerli bir tarih seçin (YYYY-AA-GG)." }); return; }
      if (new Date(override.customDate) < TODAY) { setToast({ type: "info", text: "⚠️ Hatırlatma tarihi bugünden önce olamaz." }); return; }
    }
    const vehicle = vehicles.find(v => v.id === vehicleId);
    const reminderOverrides = { ...(vehicle?.reminderOverrides || {}), [kind]: override };
    setVehicles(vs => vs.map(v => v.id === vehicleId ? { ...v, reminderOverrides } : v)); setEditingReminderKind(null); setToast({ type: "info", text: "🔔 Hatırlatma güncellendi." });
    persist(api.vehicles.update(vehicleId, { reminderOverrides }), "Hatırlatma kaydedilemedi");
  };
  const resetReminderOverride = (vehicleId, kind) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    const reminderOverrides = { ...(vehicle?.reminderOverrides || {}) };
    delete reminderOverrides[kind];
    setVehicles(vs => vs.map(v => v.id !== vehicleId ? v : { ...v, reminderOverrides })); setEditingReminderKind(null); setToast({ type: "info", text: "↩️ Varsayılan hatırlatmaya dönüldü." });
    persist(api.vehicles.update(vehicleId, { reminderOverrides }), "Hatırlatma kaydedilemedi");
  };
  const submitNewReminder = (vehicleId) => {
    if (!newReminderForm.title.trim() || !newReminderForm.date) return;
    if (!isValidDateStr(newReminderForm.date)) { setToast({ type: "info", text: "⚠️ Geçersiz tarih. Lütfen geçerli bir tarih seçin (YYYY-AA-GG)." }); return; }
    if (new Date(newReminderForm.date) < TODAY) { setToast({ type: "info", text: "⚠️ Hatırlatma tarihi bugünden önce olamaz." }); return; }
    const reminder = { id: Date.now(), title: newReminderForm.title.trim(), date: newReminderForm.date, leadDays: newReminderForm.leadDays || "7" };
    const vehicle = vehicles.find(v => v.id === vehicleId);
    const customReminders = [...(vehicle?.customReminders || []), reminder];
    setVehicles(vs => vs.map(v => v.id === vehicleId ? { ...v, customReminders } : v));
    setNewReminderForm({ title: "", date: "", leadDays: "7" });
    setShowAddReminderForm(false);
    setToast({ type: "info", text: "🔔 Yeni hatırlatma eklendi." });
    persist(api.vehicles.update(vehicleId, { customReminders }), "Hatırlatma kaydedilemedi");
  };
  const updateCustomReminder = (vehicleId, reminderId, updates) => {
    if (updates.date) {
      if (!isValidDateStr(updates.date)) { setToast({ type: "info", text: "⚠️ Geçersiz tarih. Lütfen geçerli bir tarih seçin (YYYY-AA-GG)." }); return; }
      if (new Date(updates.date) < TODAY) { setToast({ type: "info", text: "⚠️ Hatırlatma tarihi bugünden önce olamaz." }); return; }
    }
    const vehicle = vehicles.find(v => v.id === vehicleId);
    const customReminders = (vehicle?.customReminders || []).map(cr => cr.id === reminderId ? { ...cr, ...updates } : cr);
    setVehicles(vs => vs.map(v => v.id !== vehicleId ? v : { ...v, customReminders })); setEditingReminderKind(null); setToast({ type: "info", text: "🔔 Hatırlatma güncellendi." });
    persist(api.vehicles.update(vehicleId, { customReminders }), "Hatırlatma kaydedilemedi");
  };
  const removeCustomReminder = (vehicleId, reminderId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    const customReminders = (vehicle?.customReminders || []).filter(cr => cr.id !== reminderId);
    setVehicles(vs => vs.map(v => v.id !== vehicleId ? v : { ...v, customReminders })); setEditingReminderKind(null); setToast({ type: "info", text: "🗑️ Hatırlatma silindi." });
    persist(api.vehicles.update(vehicleId, { customReminders }), "Hatırlatma kaydedilemedi");
  };
  const acceptAppt = (id) => { setAppointments(apps => apps.map(a => a.id === id ? { ...a, status: "Sırada" } : a)); persist(api.appointments.update(id, { status: "Sırada" }), "Randevu güncellenemedi"); fireSuccessPulse("Randevu kabul edildi ✅"); fireNotification("Randevunuz kabul edildi ✅", "Tamirci randevu talebinizi onayladı.", ownerSettings.notifyAppointments, "owner", { type: "appointment", id }); };
  const rejectAppt = (id) => { setAppointments(apps => apps.map(a => a.id === id ? { ...a, status: "Reddedildi" } : a)); persist(api.appointments.update(id, { status: "Reddedildi" }), "Randevu güncellenemedi"); setToast({ type: "info", text: "❌ Randevu reddedildi." }); fireNotification("Randevunuz reddedildi", "Tamirci bu randevu talebini kabul edemedi.", ownerSettings.notifyAppointments, "owner", { type: "appointment", id }); };
  const markNoShow = (id) => { setAppointments(apps => apps.map(a => a.id === id ? { ...a, status: "Gelmedi", noShow: true } : a)); persist(api.appointments.update(id, { status: "Gelmedi", noShow: true }), "Randevu güncellenemedi"); setToast({ type: "info", text: "🚫 Müşteri gelmedi olarak işaretlendi." }); };
  const advanceStatus = (id) => {
    let nextStatus = null;
    setAppointments(apps => apps.map(a => { if (a.id !== id) return a; const idx = TRACK_STATUSES_AUTO.indexOf(a.status); const next = TRACK_STATUSES_AUTO[Math.min(idx + 1, TRACK_STATUSES_AUTO.length - 1)]; nextStatus = next; if (next === "Tamir Tamamlandı" && a.status !== "Tamir Tamamlandı") { const smsText = `📱 SMS → ${a.customer}: "${a.mechanicName} aracınızın (${a.vehicle}) tamirini tamamladı."`; setSmsLog(log => [{ id: Date.now(), text: smsText }, ...log]); setToast({ type: "sms", text: smsText }); fireSuccessPulse("Tamir tamamlandı 🎉"); fireNotification("Aracınız hazır! 🚗", `${a.mechanicName} aracınızın tamirini tamamladı.`, ownerSettings.notifyAppointments, "owner", { type: "appointment", id }); } else if (next === "Tamire Alındı") { fireNotification("Aracınız tamirde 🔧", `${a.mechanicName} aracınızla ilgilenmeye başladı.`, ownerSettings.notifyAppointments, "owner", { type: "appointment", id }); } return { ...a, status: next }; }));
    if (nextStatus) persist(api.appointments.update(id, { status: nextStatus }), "Randevu güncellenemedi");
  };
  // Tamiri "Tamamlandı" olarak işaretlerken, değişen parça varsa opsiyonel garanti süresi eklenebilir.
  // Garanti bitiş tarihi hem randevu kartında gösterilir hem de (plaka eşleşirse) aracın hatırlatmalarına eklenir.
  const completeApptWithWarranty = (warrantyDays) => {
    const id = completingApptId;
    if (!id) return;
    advanceStatus(id);
    const days = parseInt(warrantyDays, 10);
    if (days > 0) {
      const appt = appointments.find(a => a.id === id);
      const end = new Date(TODAY); end.setDate(end.getDate() + days);
      const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
      setAppointments(apps => apps.map(a => a.id === id ? { ...a, warrantyEndDate: endStr } : a));
      persist(api.appointments.update(id, { warrantyEndDate: endStr }), "Garanti bilgisi kaydedilemedi");
      if (appt) {
        const vehicle = vehicles.find(v => v.plate && appt.vehicle.includes(v.plate));
        if (vehicle) {
          const reminder = { id: Date.now(), title: "Parça Garantisi Bitiyor", date: endStr, leadDays: "7" };
          const customReminders = [...(vehicle.customReminders || []), reminder];
          setVehicles(vs => vs.map(v => v.id === vehicle.id ? { ...v, customReminders } : v));
          persist(api.vehicles.update(vehicle.id, { customReminders }), "Hatırlatma kaydedilemedi");
        }
      }
    }
    setCompletingApptId(null);
    setWarrantyDaysForm("");
  };
  const cancelOwnAppt = (id) => {
    const appt = appointments.find(a => a.id === id);
    setAppointments(apps => apps.map(a => a.id === id ? { ...a, status: "İptal Edildi" } : a));
    persist(api.appointments.update(id, { status: "İptal Edildi" }), "Randevu güncellenemedi");
    if (appt && appt.mechanicId === MY_MECHANIC_ID) {
      fireNotification("Randevu iptal edildi ❌", `${appt.customer} — ${appt.vehicle} randevusunu iptal etti.`, mechSettings.notifyAppointments, "mechanic", { type: "appointment", id: appt.id });
    }
  };
  const startReschedule = (a) => { setReschedulingApptId(a.id); setRescheduleDate(null); setRescheduleTime(null); };
  const confirmReschedule = () => {
    if (!rescheduleDate || !rescheduleTime) return;
    const appt = appointments.find(a => a.id === reschedulingApptId);
    const newDate = rescheduleDate.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
    const patch = { date: newDate, time: rescheduleTime, status: autoAccept ? "Sırada" : "Onay Bekliyor", autoAccepted: autoAccept };
    setAppointments(apps => apps.map(a => a.id === reschedulingApptId ? { ...a, ...patch } : a));
    persist(api.appointments.update(reschedulingApptId, patch), "Randevu güncellenemedi");
    setReschedulingApptId(null);
    setToast({ type: "info", text: "🔄 Randevunuz güncellendi." });
    if (appt && appt.mechanicId === MY_MECHANIC_ID) {
      fireNotification("Randevu güncellendi 🔄", `${appt.customer} randevu tarihini/saatini değiştirdi: ${newDate} ${rescheduleTime}`, mechSettings.notifyAppointments, "mechanic", { type: "appointment", id: appt.id });
    }
  };
  const submitReview = () => {
    if (!reviewingApptId) return;
    const appt = appointments.find(a => a.id === reviewingApptId);
    if (!appt) return;
    const mech = mechanicsList.find(m => m.name === appt.mechanicName);
    if (mech) {
      const newReview = { id: Date.now(), mine: true, date: "az önce", name: ownerProfile.name || "Araç Sahibi", avatar: "🙂", rating: reviewForm.rating, comment: reviewForm.comment.trim() || "Hizmetten memnun kaldım.", photo: false };
      const newReviewsCount = mech.reviews + 1;
      const newAvg = Math.round((((mech.rating * mech.reviews) + reviewForm.rating) / newReviewsCount) * 10) / 10;
      const reviewList = [newReview, ...mech.reviewList];
      setMechanicsList(list => list.map(m => m.id !== mech.id ? m : { ...m, reviewList, reviews: newReviewsCount, rating: newAvg }));
      persist(api.mechanics.update(mech.id, { reviewList, reviews: newReviewsCount, rating: newAvg }), "Değerlendirme kaydedilemedi");
    }
    setAppointments(apps => apps.map(a => a.id === reviewingApptId ? { ...a, reviewed: true } : a));
    persist(api.appointments.update(reviewingApptId, { reviewed: true }), "Randevu güncellenemedi");
    setReviewingApptId(null);
    setReviewForm({ rating: 5, comment: "" });
    setToast({ type: "info", text: "⭐ Değerlendirmeniz için teşekkürler!" });
    if (mech && mech.id === MY_MECHANIC_ID) {
      fireNotification("Yeni değerlendirme aldınız ⭐", `${ownerProfile.name || "Bir müşteri"} size ${reviewForm.rating} yıldız verdi.`, mechSettings.notifyMessages, "mechanic", { type: "ownMechanicReviews" });
    }
  };
  const submitMechanicReply = (mechanicId, reviewId) => {
    if (!replyDraft.trim()) return;
    const mech = mechanicsList.find(m => m.id === mechanicId);
    const review = mech?.reviewList.find(r => r.id === reviewId);
    const reviewList = mech ? mech.reviewList.map(r => r.id === reviewId ? { ...r, reply: replyDraft.trim() } : r) : [];
    setMechanicsList(list => list.map(m => m.id !== mechanicId ? m : { ...m, reviewList }));
    if (mech) persist(api.mechanics.update(mechanicId, { reviewList }), "Yanıt kaydedilemedi");
    setReplyingReviewId(null);
    setReplyDraft("");
    setToast({ type: "info", text: "💬 Yanıtınız yayınlandı." });
    if (review?.mine) {
      fireNotification("Yorumunuza yanıt geldi 💬", "İşletme, değerlendirmenize bir yanıt yazdı.", ownerSettings.notifyMessages, "owner", { type: "mechanicDetail", id: mechanicId });
    }
  };
  const deleteMyReview = (mechanicId, reviewId) => {
    const mech = mechanicsList.find(m => m.id === mechanicId);
    const review = mech?.reviewList.find(r => r.id === reviewId);
    if (mech && review) {
      const newReviewsCount = Math.max(0, mech.reviews - 1);
      const newAvg = newReviewsCount > 0 ? Math.round((((mech.rating * mech.reviews) - review.rating) / newReviewsCount) * 10) / 10 : 0;
      const reviewList = mech.reviewList.filter(r => r.id !== reviewId);
      setMechanicsList(list => list.map(m => m.id !== mechanicId ? m : { ...m, reviewList, reviews: newReviewsCount, rating: newAvg }));
      persist(api.mechanics.update(mechanicId, { reviewList, reviews: newReviewsCount, rating: newAvg }), "Yorum silinemedi");
    }
    setToast({ type: "info", text: "🗑️ Yorumunuz silindi." });
  };
  const closePasswordModal = () => { setShowPasswordModal(false); setPasswordForm({ current: "", next: "", confirm: "" }); };
  const submitPasswordChange = () => {
    if (!passwordForm.current || !passwordForm.next) { setToast({ type: "info", text: "⚠️ Lütfen tüm alanları doldurun." }); return; }
    if (passwordForm.next.length < 6) { setToast({ type: "info", text: "⚠️ Yeni şifre en az 6 karakter olmalı." }); return; }
    if (passwordForm.next !== passwordForm.confirm) { setToast({ type: "info", text: "⚠️ Yeni şifreler eşleşmiyor." }); return; }
    setShowPasswordModal(false);
    setPasswordForm({ current: "", next: "", confirm: "" });
    setToast({ type: "info", text: "🔒 Şifreniz güncellendi." });
  };
  const confirmDeleteAccount = () => {
    setShowDeleteAccountModal(false);
    setToast({ type: "info", text: "🗑️ Hesabınız silindi (demo)." });
    goHome();
  };
  const openHelpInfo = (topic) => setToast({ type: "info", text: `ℹ️ ${topic} — bu bir demo uygulamasıdır, gerçek içerik burada gösterilir.` });
  // ---- Araç sahibi / tamirci "Yardım & Destek" akışı: kendi şikayet/destek talebini oluşturur,
  // admin panelindeki AYNI supportTickets state'ine düşer, admin panelinden verilen cevapları
  // (adminReplies) burada görebilir. ----
  const mySupportTickets = () => {
    const myName = role === "owner" ? ownerProfile.name : myProfile?.name;
    if (!myName) return [];
    return supportTickets.filter(tk => tk.fromName === myName).sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
  };
  const submitSupportTicket = async () => {
    if (!newTicketForm.subject.trim() || !newTicketForm.description.trim()) { setToast({ type: "info", text: "⚠️ Lütfen konu ve açıklama girin." }); return; }
    const fromType = role === "owner" ? "owner" : "mechanic";
    const fromName = (role === "owner" ? ownerProfile.name : myProfile?.name) || (role === "owner" ? "Araç Sahibi" : "Tamirci");
    const draft = {
      type: newTicketForm.type,
      priority: ADMIN_TICKET_TYPE_DEFAULT_PRIORITY[newTicketForm.type] || "medium",
      status: "open",
      fromType, fromName,
      subject: newTicketForm.subject.trim(),
      description: newTicketForm.description.trim(),
      relatedNote: newTicketForm.relatedNote.trim() || "—",
      createdDate: TODAY.toISOString().slice(0, 10),
      adminNote: "",
      adminReplies: [],
    };
    setNewTicketForm({ type: "quality", subject: "", description: "", relatedNote: "" });
    setShowNewTicketForm(false);
    setToast({ type: "info", text: "✅ Destek talebiniz alındı. En kısa sürede dönüş yapılacaktır." });
    try {
      const created = await api.tickets.create(draft);
      setSupportTickets(list => [created, ...list]);
    } catch (err) {
      setToast({ type: "info", text: `⚠️ Destek talebi kaydedilemedi: ${err?.message || "Sunucuya kaydedilemedi."}` });
    }
  };
  // Belirli bir ilanı, tamirciyi ya da müşteriyi bağlamsal olarak bildirmek için: formu önceden
  // doldurup direkt "Yeni Destek Talebi" modalını açar — kullanıcı sadece açıklamayı yazıp gönderir.
  const openReportForm = (type, relatedNote, subject) => {
    setNewTicketForm({ type, subject: subject || "", description: "", relatedNote: relatedNote || "" });
    setShowNewTicketForm(true);
  };
  // Hem araç sahibi hem tamirci profilinde birebir aynı görünüm kullanılıyor — tek yerden bakımı kolaylaştırıyor.
  const renderSupportView = (backTab, setTabFn) => {
    const myTickets = mySupportTickets();
    return (
      <>
        <button onClick={() => setTabFn(backTab)} className="flex items-center gap-1 text-rose-600 mb-4 text-sm"><ChevronLeft size={16} /> Bilgilerime Dön</button>
        <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2"><LifeBuoy size={16} className="text-rose-500" /> Yardım &amp; Destek</h2>
        <p className="text-xs text-gray-400 mb-4">Bir sorun mu yaşıyorsun ya da bir şikayetin mi var? Buradan bize ulaşabilirsin.</p>
        <button onClick={() => setShowNewTicketForm(true)} className="w-full bg-rose-600 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-rose-700 transition mb-5 flex items-center justify-center gap-2"><Plus size={15} /> Yeni Destek Talebi Oluştur</button>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Taleplerim{myTickets.length > 0 ? ` (${myTickets.length})` : ""}</h3>
        {myTickets.length === 0 ? (
          <div className="text-center py-10 bg-white border border-gray-200 rounded-2xl"><LifeBuoy size={32} className="mx-auto text-gray-200 mb-2" /><p className="text-gray-400 text-sm">Henüz bir destek talebin yok.</p></div>
        ) : (
          <div className="space-y-2">
            {myTickets.map(tk => (
              <div key={tk.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-800">{tk.subject}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${tk.status === "open" ? "bg-red-50 text-red-500" : tk.status === "in_review" ? "bg-gray-100 text-gray-600" : "bg-green-50 text-green-600"}`}>{ADMIN_TICKET_STATUS_LABELS[tk.status]}</span>
                </div>
                <p className="text-[11px] text-gray-400 mb-2">{ADMIN_TICKET_TYPE_LABELS[tk.type]} · {tk.createdDate}</p>
                <p className="text-xs text-gray-600">{tk.description}</p>
                {(tk.adminReplies || []).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                    {tk.adminReplies.map((r, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-2.5">
                        <p className="text-[10px] font-semibold text-gray-500 mb-0.5">Fixperto Destek Ekibi · {r.date}</p>
                        <p className="text-xs text-gray-700">{r.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    );
  };
  const openChatWithMechanic = (m, contextNote = undefined) => {
    let convo = conversations.find(c => c.mechanicId === m.id);
    if (!convo) {
      convo = { id: Date.now(), mechanicId: m.id, mechanicName: m.name, mechanicImg: m.img, mechanicLang: m.lang, messages: [], pendingContextNote: contextNote || null };
      setConversations([convo, ...conversations]);
      persist(api.conversations.create(convo), "Sohbet başlatılamadı");
      recordConversion("chat");
    } else if (contextNote) {
      const alreadySent = convo.messages.some(msg => msg.text === contextNote);
      if (!alreadySent && convo.pendingContextNote !== contextNote) {
        setConversations(cs => cs.map(c => c.id === convo.id ? { ...c, pendingContextNote: contextNote } : c));
        persist(api.conversations.update(convo.id, { pendingContextNote: contextNote }), "Sohbet kaydedilemedi");
      }
    }
    setActiveConvoId(convo.id);
    setScreen("chat");
  };
  // Tamirci, kendi ilanı olmayan bir "araç sahibi" tipi ilana bakarken sohbet başlatırsa: bu her
  // zaman (tek) gerçek araç sahibiyle olan aynı sohbet dizisine bağlanır — kendi kimliğiyle
  // (myProfile) anchor edilir, böylece araç sahibi bunu Sohbetlerim'de görüp cevaplayabilir.
  const openMechChatWithOwnerListing = (contextNote) => {
    if (!myProfile) return;
    let convo = conversations.find(c => c.mechanicId === myProfile.id);
    if (!convo) {
      convo = { id: Date.now(), mechanicId: myProfile.id, mechanicName: myProfile.name, mechanicImg: myProfile.img, mechanicLang: myProfile.lang, messages: [], pendingContextNote: contextNote || null };
      setConversations([convo, ...conversations]);
      persist(api.conversations.create(convo), "Sohbet başlatılamadı");
      recordConversion("chat");
    } else if (contextNote) {
      const alreadySent = convo.messages.some(msg => msg.text === contextNote);
      if (!alreadySent && convo.pendingContextNote !== contextNote) {
        setConversations(cs => cs.map(c => c.id === convo.id ? { ...c, pendingContextNote: contextNote } : c));
        persist(api.conversations.update(convo.id, { pendingContextNote: contextNote }), "Sohbet kaydedilemedi");
      }
    }
    setMechActiveConvoId(convo.id);
    setMechTab("messages");
    setScreen("mechanicDashboard");
  };
  const activeConvo = conversations.find(c => c.id === activeConvoId);
  const sendOwnerMessage = (text, image) => {
    if (!text && !image) return;
    const convo = conversations.find(c => c.id === activeConvoId);
    if (!convo) return;
    const newMsgs = [...convo.messages];
    if (convo.pendingContextNote) newMsgs.push({ id: msgId++, sender: "owner", text: convo.pendingContextNote, lang: ownerLang });
    newMsgs.push({ id: msgId++, sender: "owner", text, lang: ownerLang, image });
    setConversations(cs => cs.map(c => c.id === activeConvoId ? { ...c, messages: newMsgs, pendingContextNote: null } : c));
    persist(api.conversations.update(activeConvoId, { messages: newMsgs, pendingContextNote: null }), "Mesaj kaydedilemedi");
    fireNotification("Yeni mesaj 💬", `${ownerProfile.name || "Araç sahibi"}: ${text || "📷 Fotoğraf gönderdi"}`, mechSettings.notifyMessages, "mechanic", { type: "chat", id: activeConvoId });
    setChatInput("");
  };
  const handleFileSelect = (e) => { const file = e.target.files?.[0]; if (!file) return; sendOwnerMessage("📎 Fotoğraf gönderildi", URL.createObjectURL(file)); };
  const sendOwnerMessageWithReply = (text, image = undefined) => { const convoId = activeConvoId; const wasEmpty = activeConvo && activeConvo.messages.length === 0; sendOwnerMessage(text, image); if (wasEmpty) { setTimeout(() => { let replyMsgs = null; setConversations(cs => cs.map(c => { if (c.id !== convoId) return c; const replyText = c.mechanicLang === "en" ? "Thanks for reaching out!" : "Merhaba, mesajınız için teşekkürler!"; replyMsgs = [...c.messages, { id: msgId++, sender: "mechanic", text: replyText, lang: c.mechanicLang }]; return { ...c, messages: replyMsgs }; })); if (replyMsgs) persist(api.conversations.update(convoId, { messages: replyMsgs }), "Mesaj kaydedilemedi"); fireNotification("Yeni mesaj 💬", `${activeConvo.mechanicName}: Merhaba, mesajınız için teşekkürler!`, ownerSettings.notifyMessages, "owner", { type: "chat", id: convoId }); }, 900); } };
  // Mesaj çevirisi: varsayılan olarak (kullanıcı elle değiştirmediği sürece) karşı taraf mesajı
  // HER ZAMAN kendi diline otomatik çevrilmiş görür — showTranslated[msgId] burada "true" ise
  // çeviriyi, "false" ise bilerek orijinali gösteriyor demektir; "undefined" (hiç dokunulmamış)
  // otomatik-çeviri-göster anlamına gelir (bkz. ChatBubble).
  const toggleTranslate = (id) => setShowTranslated(s => { const current = s[id] === undefined ? true : s[id]; return { ...s, [id]: !current }; });
  // Gerçek zamanlı sohbet çevirisi: backend/routes/translate.js'e gidip gelen sonucu mesaj id'si +
  // hedef dile göre önbelleğe alıyoruz (bir mesaj bir dile SADECE BİR KEZ çevrilir — sekme
  // değiştirme/yeniden render'da tekrar istek atılmaz). Ayrıca aynı mesaj+dil için aynı anda birden
  // fazla istek gitmesini de translationInFlightRef ile engelliyoruz. Uygulamayı yavaşlatmaması için
  // TAMAMEN arka planda, mesaj her zaman önce orijinaliyle görünür, çeviri gelince yerine geçer.
  const [translationCache, setTranslationCache] = useState({});
  const translationInFlightRef = useRef(new Set());
  const translateMessage = (msg, toLang) => {
    if (!msg?.text || !toLang) return;
    const fromLang = msg.lang || "tr";
    if (fromLang === toLang) return;
    const key = `${msg.id}:${toLang}`;
    if (translationCache[key] !== undefined || translationInFlightRef.current.has(key)) return;
    translationInFlightRef.current.add(key);
    api.translate(msg.text, fromLang, toLang)
      .then((res) => setTranslationCache((c) => ({ ...c, [key]: res?.translatedText || msg.text })))
      .catch(() => setTranslationCache((c) => ({ ...c, [key]: msg.text })))
      .finally(() => translationInFlightRef.current.delete(key));
  };
  const mechConvo = conversations.find(c => c.id === mechActiveConvoId);
  const sendMechMessage = (text) => {
    if (!text) return;
    const convo = conversations.find(c => c.id === mechActiveConvoId);
    if (!convo) return;
    // Bu sohbet dizisi başka bir (demo) tamirciye ait olsa bile mesajı GERÇEKTE yazan her zaman
    // giriş yapmış tek tamirci hesabıdır (myProfile) — bu yüzden gönderenin dili artık dondurulmuş
    // convo.mechanicLang yerine myProfile'ın GÜNCEL dil ayarından okunuyor (bkz. Ayarlar'daki dil
    // seçici). Böylece tamirci dilini değiştirdiğinde yeni mesajları doğru dille etiketlenir.
    const senderLang = myProfile.lang || "tr";
    const newMsgs = [...convo.messages];
    if (convo.pendingContextNote) newMsgs.push({ id: msgId++, sender: "mechanic", text: convo.pendingContextNote, lang: senderLang });
    newMsgs.push({ id: msgId++, sender: "mechanic", text, lang: senderLang });
    setConversations(cs => cs.map(c => c.id === mechActiveConvoId ? { ...c, messages: newMsgs, pendingContextNote: null } : c));
    persist(api.conversations.update(mechActiveConvoId, { messages: newMsgs, pendingContextNote: null }), "Mesaj kaydedilemedi");
    fireNotification("Yeni mesaj 💬", `${myProfile?.name || "Tamirci"}: ${text}`, ownerSettings.notifyMessages, "owner", { type: "chat", id: mechActiveConvoId });
    setMechChatInput("");
  };
  const updateMyField = (field, value) => { setMechanicsList(list => list.map(m => m.id === MY_MECHANIC_ID ? { ...m, [field]: value } : m)); persist(api.mechanics.update(MY_MECHANIC_ID, { [field]: value }), "Profil bilgisi kaydedilemedi"); };
  const updateService = (idx, field, value) => {
    const services = myProfile.services.map((s, i) => i === idx ? { ...s, [field]: value } : s);
    setMechanicsList(list => list.map(m => m.id !== MY_MECHANIC_ID ? m : { ...m, services }));
    persist(api.mechanics.update(MY_MECHANIC_ID, { services }), "Hizmet kaydedilemedi");
  };
  const removeService = (idx) => {
    const services = myProfile.services.filter((_, i) => i !== idx);
    setMechanicsList(list => list.map(m => m.id !== MY_MECHANIC_ID ? m : { ...m, services }));
    persist(api.mechanics.update(MY_MECHANIC_ID, { services }), "Hizmet kaydedilemedi");
  };
  const toggleServiceFixed = (idx) => {
    const svc = myProfile?.services?.[idx];
    if (!svc) return;
    if (!svc.fixed && !String(svc.price || "").trim()) { setToast({ type: "info", text: "⚠️ Sabit fiyat işaretlemeden önce bu hizmete bir fiyat girin." }); return; }
    updateService(idx, "fixed", !svc.fixed);
  };
  const finalizeAddService = (name, price, fixed) => {
    const services = [...myProfile.services, { name, price, fixed }];
    setMechanicsList(list => list.map(m => m.id !== MY_MECHANIC_ID ? m : { ...m, services }));
    persist(api.mechanics.update(MY_MECHANIC_ID, { services }), "Hizmet kaydedilemedi");
    setNewServiceForm({ name: "", price: "", fixed: false, fixedTouched: false }); setShowAddServiceForm(false); setDuplicateServiceWarning(null);
  };
  const findMissingFixedPriceService = () => (myProfile?.services || []).find(s => s.fixed && !String(s.price || "").trim()) || null;
  const saveMyProfile = () => {
    const missing = findMissingFixedPriceService();
    if (missing) { setToast({ type: "info", text: `⚠️ "${missing.name}" sabit fiyatlı işaretli ama fiyatı boş. Lütfen fiyat girin ya da "Değişken" olarak işaretleyin.` }); return; }
    setToast({ type: "info", text: "✅ Profiliniz güncellendi." });
  };
  const previewMyProfile = () => {
    const missing = findMissingFixedPriceService();
    if (missing) { setToast({ type: "info", text: `⚠️ Önizlemeden önce "${missing.name}" hizmetine bir fiyat girin ya da "Değişken" olarak işaretleyin.` }); return; }
    openDetail(myProfile, "mechProfilePage");
  };
  const tryAddService = () => {
    const name = newServiceForm.name.trim();
    if (!name) return;
    const fixed = newServiceForm.fixed;
    if (fixed && !newServiceForm.price.trim()) { setToast({ type: "info", text: "⚠️ Sabit fiyatlı hizmetler için fiyat girmelisiniz." }); return; }
    const price = newServiceForm.price.trim();
    const isDup = (myProfile?.services || []).some(s => s.name.trim().toLocaleLowerCase("tr-TR") === name.toLocaleLowerCase("tr-TR"));
    if (isDup) { setDuplicateServiceWarning({ name, price, fixed }); return; }
    finalizeAddService(name, price, fixed);
  };
  const cancelAddService = () => { setShowAddServiceForm(false); setNewServiceForm({ name: "", price: "", fixed: false, fixedTouched: false }); setDuplicateServiceWarning(null); };
  const uploadCoverPhoto = (e) => { const file = e.target.files?.[0]; if (!file) return; updateMyField("coverPhoto", URL.createObjectURL(file)); };
  const removeCoverPhoto = () => updateMyField("coverPhoto", null);
  const addStaff = () => {
    const staff = [...myProfile.staff, { name: "Yeni Çalışan", role: "Görev", emoji: "🧑‍🔧" }];
    setMechanicsList(list => list.map(m => m.id !== MY_MECHANIC_ID ? m : { ...m, staff }));
    persist(api.mechanics.update(MY_MECHANIC_ID, { staff }), "Çalışan kaydedilemedi");
  };
  const updateStaffField = (idx, field, value) => {
    const staff = myProfile.staff.map((s, i) => i === idx ? { ...s, [field]: value } : s);
    setMechanicsList(list => list.map(m => m.id !== MY_MECHANIC_ID ? m : { ...m, staff }));
    persist(api.mechanics.update(MY_MECHANIC_ID, { staff }), "Çalışan kaydedilemedi");
  };
  const removeStaff = (idx) => {
    const staff = myProfile.staff.filter((_, i) => i !== idx);
    setMechanicsList(list => list.map(m => m.id !== MY_MECHANIC_ID ? m : { ...m, staff }));
    persist(api.mechanics.update(MY_MECHANIC_ID, { staff }), "Çalışan kaydedilemedi");
  };
  const staffAvatarUpload = (idx, e) => { const file = e.target.files?.[0]; if (!file) return; updateStaffField(idx, "emoji", URL.createObjectURL(file)); };
  const ownerPhotoUpload = (e) => { const file = e.target.files?.[0]; if (!file) return; const url = URL.createObjectURL(file); updateMyOwnerField("photo", url); persist(api.owners.update(MY_OWNER_ID, { photo: url }), "Fotoğraf kaydedilemedi"); };
  // Çalışma saatleri (mechanicHours) ayrı bir istemci-taraflı yapı; backend'deki mechanics.hoursText
  // alanına insan-okur biçimde yansıtılır (bkz. formatHoursText) — böylece diğer kullanıcılar
  // gerçek zamanlı çalışma saatlerini görebilir.
  const persistMechanicHours = (nextHours) => persist(api.mechanics.update(MY_MECHANIC_ID, { hoursText: formatHoursText(nextHours) }), "Çalışma saatleri kaydedilemedi");
  const toggleDayOpen = (key) => setMechanicHours(h => { const next = { ...h, [key]: { ...h[key], open: !h[key].open } }; persistMechanicHours(next); return next; });
  const toggleSlotClosed = (key, slot) => setMechanicHours(h => { const closed = h[key].closedSlots.includes(slot); const next = { ...h, [key]: { ...h[key], closedSlots: closed ? h[key].closedSlots.filter(s => s !== slot) : [...h[key].closedSlots, slot] } }; persistMechanicHours(next); return next; });
  const addExtraSlot = (key, time) => { if (!time) return; setMechanicHours(h => { if (h[key].extraSlots.includes(time) || genSlots(h[key].start, h[key].end).includes(time)) return h; const next = { ...h, [key]: { ...h[key], extraSlots: [...h[key].extraSlots, time].sort() } }; persistMechanicHours(next); return next; }); };
  const openSellForm = (prefill) => { setSellForm(prefill || { brand: "", model: "", year: "", km: "", price: "", description: "", photo: "🚗", fuelType: "Benzin", transmission: "Manuel", power: "", firstReg: "", color: "", bodyType: "", engineSize: "", drivetrain: "", ownerCount: "", paintedParts: "", changedParts: "", tradeIn: false, doorCount: "", features: [], photos: [], seatCount: "", fuelConsumption: "", co2Emission: "", emissionClass: "", batteryCapacity: "", rangeKm: "", city: role === "owner" ? (ownerProfile.city || "") : "", _vehicleId: null, _editingId: null }); setShowSellForm(true); };
  // "Aracımı Satışa Çıkar" tıklanınca: kayıtlı araç(lar)ı varsa hangisini satacağını sorar ve
  // seçilen aracın bilgilerini forma otomatik doldurur; kayıtlı aracı yoksa direkt boş form açar.
  const startSellFlow = () => { if (vehicles.length === 0) { openSellForm(null); return; } setShowSellVehiclePicker(true); };
  const pickVehicleToSell = (v) => {
    setShowSellVehiclePicker(false);
    const existingListing = listings.find(l => l.id === v.listingId);
    if (existingListing) { openSellForm({ ...existingListing, _vehicleId: v.id, _editingId: existingListing.id }); return; }
    openSellForm({ brand: v.brand, model: v.model, year: v.year, km: "", price: "", description: "", photo: "🚗", fuelType: "Benzin", transmission: "Manuel", power: "", firstReg: "", color: "", bodyType: "", engineSize: "", drivetrain: "", ownerCount: "", paintedParts: "", changedParts: "", tradeIn: false, doorCount: "", features: [], photos: [], seatCount: "", fuelConsumption: "", co2Emission: "", emissionClass: "", batteryCapacity: "", rangeKm: "", city: role === "owner" ? (ownerProfile.city || "") : "", _vehicleId: v.id, _editingId: null });
  };
  const pickOtherCarToSell = () => { setShowSellVehiclePicker(false); openSellForm(null); };
  const sellPhotoUpload = (e) => { const file = e.target.files?.[0]; if (!file) return; setSellForm(f => ({ ...f, photo: URL.createObjectURL(file) })); };
  // Kapak fotoğrafının yanına eklenen ek galeri fotoğrafları (bkz. ilan detay modalındaki
  // galeri/thumbnail şeridi) — birden fazla dosya birden seçilebilir, hepsi sellForm.photos
  // dizisine eklenir.
  const sellPhotosUpload = (e) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const urls = [];
    for (let i = 0; i < fileList.length; i++) urls.push(URL.createObjectURL(fileList[i]));
    setSellForm((f) => ({ ...f, photos: [...(f.photos || []), ...urls] }));
  };
  const removeSellPhoto = (idx) => setSellForm((f) => ({ ...f, photos: (f.photos || []).filter((_, i) => i !== idx) }));
  // Bir ilan favorilenmişse (favoriteIds), o ilanla ilgili herhangi bir güncelleme (fiyat, durum, vb.)
  // olduğunda favorileyen kişiye bildirim gönderiyoruz. Demo'da tekil favoriteIds listesi rol bazlı
  // ayrılmadığı için hem owner hem mechanic tarafına düşürüyoruz — hangi rolde bakılırsa görünsün.
  const notifyFavoriteWatchers = (listingId, listingLabel, message) => {
    if (!favoriteIds.includes(listingId)) return;
    const title = "Favorilediğiniz ilan güncellendi ⭐";
    const body = `"${listingLabel}" ilanında bir güncelleme var: ${message}`;
    fireNotification(title, body, ownerSettings.notifyOffers, "owner", { type: "listing", id: listingId });
    fireNotification(title, body, mechSettings.notifyOffers, "mechanic", { type: "listing", id: listingId });
  };
  const submitListing = async (sellerType) => {
    const missingFields = [];
    if (!sellForm.brand?.trim()) missingFields.push("Marka");
    if (!sellForm.model?.trim()) missingFields.push("Model");
    if (!String(sellForm.year ?? "").trim() || String(sellForm.year).trim() === "—") missingFields.push("Yıl");
    if (!String(sellForm.km ?? "").trim()) missingFields.push("Kilometre");
    if (!sellForm.price?.trim()) missingFields.push("Fiyat");
    if (missingFields.length > 0) { setToast({ type: "info", text: `⚠️ Eksik bilgiler var: ${missingFields.join(", ")}. Lütfen doldurun.` }); return; }
    if (sellForm._editingId) {
      const before = listings.find(x => x.id === sellForm._editingId);
      const { _editingId, _vehicleId, ...patch } = sellForm;
      setListings(l => l.map(x => x.id === sellForm._editingId ? { ...x, ...sellForm } : x));
      persist(api.listings.update(sellForm._editingId, patch), "İlan kaydedilemedi");
      setToast({ type: "info", text: "✅ İlan güncellendi." });
      if (before) {
        const label = `${sellForm.brand} ${sellForm.model}`;
        if (String(before.price) !== String(sellForm.price)) notifyFavoriteWatchers(sellForm._editingId, label, `fiyat ${before.price} → ${sellForm.price} olarak güncellendi.`);
        else notifyFavoriteWatchers(sellForm._editingId, label, "ilan bilgileri güncellendi.");
      }
      setShowSellForm(false);
    }
    else {
      const sellerName = sellerType === "mechanic" ? (myProfile?.name || "Tamirci") : (ownerProfile.name || "Araç Sahibi");
      const { _editingId, _vehicleId, ...formFields } = sellForm;
      const draft = { sellerName, sellerType, ...formFields, vehicleId: _vehicleId || null, status: "active", px: 20 + Math.random() * 60, py: 20 + Math.random() * 60, offers: [], messages: [] };
      setShowSellForm(false);
      setToast({ type: "info", text: "🚗 İlanınız yayınlandı." });
      try {
        const created = await api.listings.create(draft);
        setListings(l => [created, ...l]);
        if (_vehicleId) { setVehicles(vs => vs.map(v => v.id === _vehicleId ? { ...v, listingId: created.id } : v)); persist(api.vehicles.update(_vehicleId, { listingId: created.id }), "Araç kaydedilemedi"); }
      } catch (err) {
        setToast({ type: "info", text: `⚠️ İlan kaydedilemedi: ${err?.message || "Sunucuya kaydedilemedi."}` });
      }
    }
  };
  const setListingStatus = (id, status) => {
    const listing = listings.find(x => x.id === id);
    setListings(l => l.map(x => x.id === id ? { ...x, status } : x));
    persist(api.listings.update(id, { status }), "İlan durumu kaydedilemedi");
    if (listing) notifyFavoriteWatchers(id, `${listing.brand} ${listing.model}`, `durumu "${listingStatusMeta(status, t).label}" olarak değişti.`);
  };
  const removeListing = (id) => {
    const listing = listings.find(l => l.id === id);
    setListings(l => l.filter(x => x.id !== id));
    persist(api.listings.remove(id), "İlan silinemedi");
    if (listing?._vehicleId) { setVehicles(vs => vs.map(v => v.id === listing._vehicleId ? { ...v, listingId: null } : v)); persist(api.vehicles.update(listing._vehicleId, { listingId: null }), "Araç kaydedilemedi"); }
    setToast({ type: "info", text: "🗑️ İlan silindi." });
  };
  // Şu an aktif olan role göre "ben kimim" — bunu rolden bağımsız (sadece ownerProfile.name doluysa
  // onu döndürüp) hesaplamak, tamirci teklif verdiğinde teklifin sahibini yanlışlıkla araç sahibine
  // mal ediyordu (Aldığım Teklifler ile Verdiğim Teklifler karışıyordu). Artık role göre ayrışıyor.
  const myBuyerName = () => role === "mechanic" ? (myProfile?.name || "Tamirci") : (ownerProfile.name || "Araç Sahibi");
  const myPendingOfferOn = (listing) => listing ? (listing.offers || []).find(o => o.from === myBuyerName() && o.status === "pending") : null;
  const openOfferForm = () => {
    if (!selectedListing) return;
    const existing = myPendingOfferOn(selectedListing);
    setOfferAmount(existing && !existing.seen ? String(existing.amount) : "");
    setShowOfferForm(true);
  };
  const submitOffer = () => {
    if (!offerAmount || !selectedListing) return;
    const currency = listingCurrency(selectedListing.price);
    const buyerName = myBuyerName();
    const existing = myPendingOfferOn(selectedListing);
    const newOffers = existing && !existing.seen
      ? selectedListing.offers.map(o => o.id === existing.id ? { ...o, amount: offerAmount, currency } : o)
      : [{ id: Date.now(), amount: offerAmount, currency, from: buyerName, status: "pending", seen: false }, ...(existing ? selectedListing.offers.map(o => o.id === existing.id ? { ...o, status: "replaced" } : o) : selectedListing.offers)];
    setListings(l => l.map(x => x.id === selectedListing.id ? { ...x, offers: newOffers } : x));
    persist(api.listings.update(selectedListing.id, { offers: newOffers }), "Teklif kaydedilemedi");
    if (!existing) recordConversion("offer");
    setOfferAmount("");
    setShowOfferForm(false);
    setToast({ type: "info", text: existing && !existing.seen ? "💰 Teklifiniz güncellendi." : "💰 Teklifiniz iletildi." });
    // Bildirim sadece ilanın satıcısı gerçekten "siz" iseniz (etkileşimli owner/mechanic hesabı)
    // ateşlenir — demo/örnek satıcılara teklif verilince gerçek bir bildirim gitmemeli, çünkü o
    // hesabın panelinde bu teklif zaten hiç görünmeyecek.
    if (selectedListing.sellerName !== buyerName) {
      const isRealSeller = selectedListing.sellerType === "mechanic" ? selectedListing.sellerName === myProfile?.name : selectedListing.sellerName === ownerProfile.name;
      if (isRealSeller) {
        fireNotification("Yeni teklif aldınız! 💰", `${selectedListing.brand} ${selectedListing.model} ilanınıza ${offerAmount}${currency} teklif geldi.`, selectedListing.sellerType === "mechanic" ? mechSettings.notifyOffers : ownerSettings.notifyOffers, selectedListing.sellerType === "mechanic" ? "mechanic" : "owner", { type: "listing", id: selectedListing.id });
      }
    }
  };
  const submitListingMsg = () => {
    if (!listingMsg || !selectedListing) return;
    const senderName = ownerProfile.name || myProfile?.name || "Kullanıcı";
    const messages = [{ id: Date.now(), text: listingMsg, from: senderName }, ...selectedListing.messages];
    setListings(l => l.map(x => x.id === selectedListing.id ? { ...x, messages } : x));
    persist(api.listings.update(selectedListing.id, { messages }), "Mesaj kaydedilemedi");
    setListingMsg("");
    setShowListingMsgForm(false);
    setToast({ type: "info", text: "💬 Mesaj gönderildi." });
    if (selectedListing.sellerName !== senderName) {
      const isRealSeller = selectedListing.sellerType === "mechanic" ? selectedListing.sellerName === myProfile?.name : selectedListing.sellerName === ownerProfile.name;
      if (isRealSeller) {
        fireNotification("İlanınıza yeni soru geldi 💬", `"${selectedListing.brand} ${selectedListing.model}" ilanınıza bir soru soruldu.`, selectedListing.sellerType === "mechanic" ? mechSettings.notifyMessages : ownerSettings.notifyMessages, selectedListing.sellerType === "mechanic" ? "mechanic" : "owner", { type: "listing", id: selectedListing.id });
      }
    }
  };
  const respondOffer = (listingIdx, offerId, status) => {
    const listing = listings.find(l => l.id === listingIdx);
    const offer = listing?.offers.find(o => o.id === offerId);
    const offers = listing ? listing.offers.map(o => o.id === offerId ? { ...o, status } : o) : [];
    const listingPatch = { offers, ...(status === "accepted" ? { status: "sold" } : {}) };
    setListings(l => l.map(x => x.id === listingIdx ? { ...x, ...listingPatch } : x));
    persist(api.listings.update(listingIdx, listingPatch), "Teklif kaydedilemedi");
    // Teklifi veren araç sahibi mi tamirci mi — bildirim tercihini ona göre kontrol ediyoruz.
    const buyerIsMechanic = offer && myProfile && offer.from === myProfile.name;
    const notifyAllowed = buyerIsMechanic ? mechSettings.notifyOffers : ownerSettings.notifyOffers;
    if (status === "accepted") {
      fireSuccessPulse("Teklif kabul edildi 🎉 · Araç satıldı olarak işaretlendi");
      fireNotification("Teklifiniz kabul edildi! 🎉", listing ? `"${listing.brand} ${listing.model}" ilanına verdiğiniz teklif kabul edildi, araç satıldı olarak işaretlendi.` : "Verdiğiniz teklif kabul edildi.", notifyAllowed, buyerIsMechanic ? "mechanic" : "owner", { type: "myOffers" });
    } else if (status === "rejected") {
      fireNotification("Teklifiniz reddedildi", listing ? `"${listing.brand} ${listing.model}" ilanına verdiğiniz teklif satıcı tarafından reddedildi.` : "Verdiğiniz teklif reddedildi.", notifyAllowed, buyerIsMechanic ? "mechanic" : "owner", { type: "myOffers" });
    }
  };
  const markOffersSeen = (listingId) => {
    const listing = listings.find(l => l.id === listingId);
    if (!listing || !listing.offers.some(o => !o.seen)) return;
    const offers = listing.offers.map(o => o.seen ? o : { ...o, seen: true });
    setListings(l => l.map(x => x.id === listingId ? { ...x, offers } : x));
    persist(api.listings.update(listingId, { offers }), "Teklif kaydedilemedi");
  };
  const clearListingFilters = () => setListingFilters({ transmission: "all", fuelType: "all", minPrice: "", maxPrice: "", minKm: "", maxKm: "", minYear: "", maxYear: "" });
  const clearJobFilters = () => setJobFilters({ employmentType: "all", experienceLevel: "all" });
  const openJobForm = (prefill) => { setJobForm(prefill || EMPTY_JOB_FORM); setShowJobForm(true); };
  const submitJobListing = async () => {
    if (!jobForm.title.trim()) return;
    const requirements = jobForm.requirements.split("\n").map(s => s.trim()).filter(Boolean);
    const skills = jobForm.skills.split(",").map(s => s.trim()).filter(Boolean);
    if (jobForm._editingId) {
      const { _editingId, ...formFields } = jobForm;
      const patch = { ...formFields, requirements, skills };
      setJobListings(js => js.map(j => j.id === jobForm._editingId ? { ...j, ...patch } : j));
      persist(api.jobs.update(jobForm._editingId, patch), "İş ilanı kaydedilemedi");
      setToast({ type: "info", text: "✅ İş ilanı güncellendi." });
      setShowJobForm(false);
    } else {
      const { _editingId, ...formFields } = jobForm;
      const draft = { mechanicId: MY_MECHANIC_ID, mechanicName: myProfile?.name || "Tamirci", mechanicImg: myProfile?.img || "🔧", ...formFields, requirements, skills, postedDate: "az önce", status: "active", applicants: [] };
      setShowJobForm(false);
      setToast({ type: "info", text: "💼 İş ilanınız yayınlandı." });
      try {
        const created = await api.jobs.create(draft);
        setJobListings(js => [created, ...js]);
      } catch (err) {
        setToast({ type: "info", text: `⚠️ İş ilanı kaydedilemedi: ${err?.message || "Sunucuya kaydedilemedi."}` });
      }
    }
  };
  const setJobListingStatus = (id, status) => { setJobListings(js => js.map(j => j.id === id ? { ...j, status } : j)); persist(api.jobs.update(id, { status }), "İş ilanı durumu kaydedilemedi"); };
  const removeJobListing = (id) => { setJobListings(js => js.filter(j => j.id !== id)); persist(api.jobs.remove(id), "İş ilanı silinemedi"); setToast({ type: "info", text: "🗑️ İş ilanı silindi." }); };
  const handleCvSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setJobApplyCv({ name: file.name, url: URL.createObjectURL(file) });
    e.target.value = "";
  };
  const removeCv = () => { setJobApplyCv(null); if (cvFileRef.current) cvFileRef.current.value = ""; };
  const closeJobApplyForm = () => { setShowJobApplyForm(false); setJobApplyCv(null); };
  const openJobApplyForm = () => {
    if (!selectedJob) return;
    setJobApplyInfo({
      name: ownerProfile.name || myProfile?.name || form.name || "",
      phone: ownerProfile.phone || form.phone || "",
      email: ownerProfile.email || form.email || "",
      address: ownerProfile.address || myProfile?.address || "",
    });
    setJobApplyMsg(`Merhaba, "${selectedJob.title}" pozisyonu için başvurmak istiyorum.`);
    setJobApplyCv(null);
    setShowJobApplyForm(true);
  };
  const jobApplyPhoneCheck = validatePhone(jobApplyInfo.phone);
  const jobApplyEmailValid = isValidEmail(jobApplyInfo.email);
  const jobApplyInfoValid = jobApplyInfo.name.trim() && jobApplyPhoneCheck.valid && jobApplyEmailValid && jobApplyInfo.address.trim();
  const jobApplyReady = jobApplyInfoValid && jobApplyCv;
  const submitJobApplication = () => {
    if (!jobApplyReady || !selectedJob) return;
    const applicant = { id: Date.now(), name: jobApplyInfo.name.trim(), phone: jobApplyInfo.phone.trim(), email: jobApplyInfo.email.trim(), address: jobApplyInfo.address.trim(), message: jobApplyMsg, date: "az önce", status: "pending", cvName: jobApplyCv?.name || null, cvUrl: jobApplyCv?.url || null };
    const applicants = [applicant, ...selectedJob.applicants];
    setJobListings(js => js.map(j => j.id === selectedJob.id ? { ...j, applicants } : j));
    persist(api.jobs.update(selectedJob.id, { applicants }), "Başvuru kaydedilemedi");
    setMyApplications(list => [{ id: applicant.id, jobId: selectedJob.id, applicantId: applicant.id, role, date: "az önce" }, ...list]);
    recordConversion("jobApplication");
    setJobApplyMsg("");
    setJobApplyCv(null);
    setShowJobApplyForm(false);
    setToast({ type: "info", text: "✅ Başvurunuz iletildi." });
    fireNotification("Yeni başvuru! 📋", `"${selectedJob.title}" ilanınıza ${applicant.name} başvurdu.`, mechSettings.notifyJobApplications, "mechanic", { type: "job", id: selectedJob.id });
  };
  const rejectApplication = (jobId, applicantId) => {
    const job = jobListings.find(j => j.id === jobId);
    const applicant = job?.applicants.find(a => a.id === applicantId);
    if (!job || !applicant || !myProfile) return;
    const applicants = job.applicants.map(a => a.id === applicantId ? { ...a, status: "rejected" } : a);
    setJobListings(js => js.map(j => j.id === jobId ? { ...j, applicants } : j));
    persist(api.jobs.update(jobId, { applicants }), "Başvuru kaydedilemedi");
    const firstName = applicant.name.trim().split(" ")[0] || applicant.name;
    const rejectionText = `Merhaba ${firstName},\n\n"${job.title}" pozisyonuna gösterdiğiniz ilgi için teşekkür ederiz. Başvurunuzu özenle değerlendirdik, ancak bu pozisyon için şu anda sizinle ilerleyemeyeceğimizi üzülerek bildiririz.\n\nBu karar yeteneklerinizle değil, mevcut ihtiyaçlarımızla ilgilidir. İş arayışınızda size başarılar diler, ileride tekrar bir araya gelebilmeyi umarız.\n\nSaygılarımızla,\n${myProfile.name}`;
    setConversations(cs => {
      const existing = cs.find(c => c.mechanicId === myProfile.id);
      const newMsg = { id: msgId++, sender: "mechanic", text: rejectionText, lang: myProfile.lang || "tr", isRejectionNotice: true };
      if (existing) return cs.map(c => c.id === existing.id ? { ...c, messages: [...c.messages, newMsg] } : c);
      return [{ id: Date.now(), mechanicId: myProfile.id, mechanicName: myProfile.name, mechanicImg: myProfile.img, mechanicLang: myProfile.lang || "tr", messages: [newMsg] }, ...cs];
    });
    setToast({ type: "info", text: "❌ Başvuru reddedildi, adaya bilgilendirme mesajı gönderildi." });
    fireNotification("Başvuru sonucu", `"${job.title}" pozisyonuna yaptığınız başvuru için bir güncelleme var.`, ownerSettings.notifyMessages, "owner", { type: "myApplications" });
  };
  const roleColor = role === "mechanic" ? "from-rose-600 to-rose-600" : "from-rose-600 to-rose-600";
  const roleBtn = role === "mechanic" ? "bg-rose-600 hover:bg-rose-700" : "bg-rose-600 hover:bg-rose-700";
  // Bildirime tıklanınca ilgili randevu/ilan/iş ilanı/sohbet vb. sayfaya yönlendirir.
  // notifRole, bildirimin hangi hesap için ateşlendiğini (owner/mechanic) belirtir; aynı "detail"
  // ekranı iki role de farklı geri-dönüş bağlamıyla kullanılıyor.
  const goToNotifTarget = (target, notifRole) => {
    setShowNotifPanel(false);
    if (!target) return;
    const forMechanic = notifRole === "mechanic";
    switch (target.type) {
      case "appointment":
        if (forMechanic) { setScreen("mechanicDashboard"); setMechTab("requests"); }
        else { setScreen("owner"); setOwnerTab("appointments"); }
        break;
      case "quoteOwner":
        setScreen("owner"); setOwnerTab("appointments"); setOwnerApptView("quotes");
        break;
      case "listing":
        setSelectedListingId(target.id);
        break;
      case "job":
        setSelectedJobId(target.id);
        break;
      case "chat":
        if (forMechanic) { setMechActiveConvoId(target.id); setMechTab("messages"); setScreen("mechanicDashboard"); }
        else { setActiveConvoId(target.id); setScreen("chat"); }
        break;
      case "supportTicket":
        if (forMechanic) { setScreen("mechProfilePage"); setMechProfileTab("support"); }
        else { setScreen("ownerProfilePage"); setOwnerProfileTab("support"); }
        break;
      case "ownMechanicReviews":
        setSelectedMechanicId(MY_MECHANIC_ID); setDetailReturnScreen("mechProfilePage"); setScreen("detail");
        break;
      case "mechanicDetail":
        setSelectedMechanicId(target.id); setDetailReturnScreen(forMechanic ? "mechBrowse" : "owner"); setScreen("detail");
        break;
      case "vehicle":
        setScreen("ownerProfilePage"); setOwnerProfileTab("vehicles"); setSelectedVehicleId(target.id);
        break;
      case "workingHours":
        setScreen("mechProfilePage"); setMechProfileTab("settings");
        break;
      case "myApplications":
        setScreen("ownerProfilePage"); setOwnerProfileTab("applications");
        break;
      case "myOffers":
        if (forMechanic) { setScreen("mechProfilePage"); setMechProfileTab("offers"); }
        else { setScreen("ownerProfilePage"); setOwnerProfileTab("offers"); }
        break;
      default: break;
    }
  };
  // Uygulama-içi bildirim zili: tarayıcı bildirim izni verilmemiş olsa da kullanıcının
  // (araç sahibi/tamirci) kendine gelen bildirimleri her zaman burada görebilmesi için.
  // mobile.de tarzı ilan kartı — özellik ikonları satırı + favori kalp
  const jobEmploymentColor = (type) => type === "Tam Zamanlı" ? "bg-rose-50 text-rose-600" : type === "Yarı Zamanlı" ? "bg-gray-100 text-gray-700" : type === "Stajyer/Çırak" ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-600";
  // LinkedIn tarzı iş ilanı kartı — pozisyon, işletme, konum, çalışma şekli/deneyim/maaş etiketleri
  // Tamirci profil detayı — normal "detail" ekranında tam sayfa, harita üzerinden açılınca ortalanmış modal içinde kullanılıyor. İçerik tek yerden geliyor, iki görünüm de senkron kalıyor.
  // ---- Araç Ara / Tamirci Ara — hem owner hem mechanic tarafından paylaşılan arama görünümü ----
  return {
    lang, setLang, t, screen, setScreen, role, setRole, showPass,
    setShowPass, forgotEmail, setForgotEmail, form, setForm, authError, setAuthError, ownerTab,
    setOwnerTab, ownerMode, setOwnerMode, ownerLang, setOwnerLang, ownerSettings, setOwnerSettings, mechSettings,
    setMechSettings, notifLog, setNotifLog, ownerNotifSeenAt, setOwnerNotifSeenAt, mechNotifSeenAt, setMechNotifSeenAt, showNotifPanel,
    setShowNotifPanel, darkMode, setDarkMode, ownerPhotoRef, ownerProfileTab, setOwnerProfileTab, showMapMobile, setShowMapMobile,
    hoveredPinId, setHoveredPinId, mapPreviewItem, setMapPreviewItem, showFilterModal, setShowFilterModal, filters, setFilters,
    listingFilters, setListingFilters, listingSort, setListingSort, listingSortDir, setListingSortDir, handleListingSortClick, userLocation, setUserLocation, locationStatus, setLocationStatus,
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
    adminChangeLog, setAdminChangeLog, fireSuccessPulse, getEffectiveDistance, requestLocation, handleSortClick, confirmUseLocation, stopUsingLocation,
    requestNotifPermission, fireNotification, selectedMechanic, bookingServiceOptions, myProfile, selectedListing, allReminders, dismissedReminderKey,
    setDismissedReminderKey, browseScrollRef, heroCollapsed, setHeroCollapsed, goBookFromReminder, topReminder, notifiedReminderKeysRef, filtered,
    quoteFilteredMechanics, filteredListings, activeListingFilterCount, filteredJobs, activeJobFilterCount, selectedJob, myReviews, myApplicationRefs,
    activeFilterCount, nextDays, isSameMechanicAppt, customerNoShowCount, isMyOwnerAppt, activeAppts, historyByDate, slotsForDate,
    isDayOpenForMechanic, mechanicOpenStatus, goToAddSlotForToday, openDetail, rebookAppt, downloadAppointmentIcs, downloadMaintenanceReport, downloadAppointmentReceipt,
    mechanicDirectionsUrl, toggleQuoteMechanic, unlockQuotePremium, closeQuoteModal, submitQuoteRequest, submitQuoteOffer, acceptQuoteOffer, EXPENSIVE_SERVICE_THRESHOLD,
    confirmBooking, goHome, chooseRole, submitAdminLogin, adminLogout, ADMIN_FIELD_LABELS, adminFieldLabel, formatAdminHistoryValue,
    adminChangeTargetLabel, logAdminChange, applyAdminFieldChange, revertAdminChange, ADMIN_TARGET_TYPE_META, adminChangeLogGrouped, expandedHistoryGroups, setExpandedHistoryGroups, recordShare, recordConversion, shareStats, viewStats, listingFavoriteCount, myProfileViewStats, listingViewStats, translationCache, translateMessage, ownerLangFor,
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
    startSellFlow, pickVehicleToSell, pickOtherCarToSell, sellPhotoUpload, sellPhotosUpload, removeSellPhoto, notifyFavoriteWatchers, submitListing, setListingStatus, removeListing,
    myBuyerName, myPendingOfferOn, openOfferForm, submitOffer, submitListingMsg, respondOffer, markOffersSeen, clearListingFilters,
    clearJobFilters, openJobForm, submitJobListing, setJobListingStatus, removeJobListing, handleCvSelect, removeCv, closeJobApplyForm,
    openJobApplyForm, jobApplyPhoneCheck, jobApplyEmailValid, jobApplyInfoValid, jobApplyReady, submitJobApplication, rejectApplication, roleColor,
    roleBtn, goToNotifTarget,
    jobEmploymentColor,
  };
}

const AppLogicContext = createContext<ReturnType<typeof useAppLogic> | null>(null);

export function AppProvider({ children }) {
  const value = useAppLogic();
  return <AppLogicContext.Provider value={value}>{children}</AppLogicContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppLogicContext);
  if (!ctx) throw new Error("useApp() must be called within <AppProvider>");
  return ctx;
}
