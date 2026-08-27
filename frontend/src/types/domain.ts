// Domain model tipleri — backend/db/seed.js + backend/db/hydrate.js'deki gerçek veri şekline
// göre çıkarıldı (bkz. backend/db/db.js için şema, backend/routes/makeCrudRouter.js için CRUD
// sözleşmesi). Bu dosya, "TypeScript'e geçiş" işinin ilk adımı: önce ortak veri modelini
// sabitliyoruz, ardından bunu kullanan yerleri kademeli olarak tipliyoruz (bkz.
// app/state/AppLogicProvider.tsx içindeki "strict=false, kademeli geçiş" notu).
//
// NOT: AppLogicProvider.tsx içindeki 180+ useState hâlâ örtük `any` ile çalışıyor — bu dosyadaki
// tipleri onlara uygulamak (`useState<Mechanic[]>([])` gibi), gerçek bir tarayıcıda canlı test
// edilmeden riskli olacağından bu geçişte YAPILMADI; bkz. REFACTOR_REPORT.md "kalan teknik borç".

export interface Service {
  name: string;
  price: string;
  fixed: boolean;
}

export interface StaffMember {
  name: string;
  role: string;
  emoji: string;
}

export interface Review {
  name: string;
  avatar: string;
  rating: number;
  comment: string;
  photo: boolean;
  /** photo=true olduğunda gösterilecek gerçek fotoğraf URL'i — bkz. backend/db/seed.js wc() helper. */
  photoUrl?: string;
  flagged?: boolean;
  mechanicReply?: string;
  /** "Faydalı" (helpful) tıklama sayısı — bkz. toggleReviewHelpful, owners.likedReviewIds. */
  helpfulCount?: number;
}

export interface Mechanic {
  id: number;
  name: string;
  distance: number;
  price: number;
  rating: number;
  reviews: number;
  verified: boolean;
  avgResponseMinutes: number;
  specialty: string;
  img: string;
  lang: "tr" | "en" | "de";
  px: number;
  py: number;
  bannerPreset: string;
  coverPhoto: string | null;
  lat: number;
  lng: number;
  iban: string;
  bankName: string;
  accountHolder: string;
  address: string;
  hoursText: string[];
  services: Service[];
  staff: StaffMember[];
  reviewList: Review[];
  verificationDocs: string[];
  shareCount?: number;
  /** Hizmet verdiği araç markaları — profilde tag/chip olarak gösterilir, arama/filtrede kullanılır. */
  brandsServiced?: string[];
  /** Kabul ettiği ödeme yöntemleri (Nakit, Kredi/Banka Kartı, Havale/EFT, Kapıda Ödeme). */
  paymentMethods?: string[];
  /** İşletme telefon numarası — ilan detayındaki "Telefonla Ara" butonu için. */
  phone?: string;
}

export interface Owner {
  id: number;
  name: string;
  email: string;
  phone: string;
  photo: string;
  address: string;
  city: string;
  joinDate: string;
  status: "active" | "suspended";
  vehicleCount: number;
  apptCount: number;
  /** Demo amaçlı düz metin — gerçek bir üretim sisteminde ASLA client'a dönmemeli (bkz. güvenlik notları). */
  password?: string;
  favoriteIds?: number[];
  /** "Faydalı" işaretlediği yorumlar — "mechanicId:reviewId" formatında bileşik anahtarlar. */
  likedReviewIds?: string[];
  /** Sohbet mesajlarının hangi dile otomatik çevrileceğini belirler — bkz. ChatBubble. */
  lang?: "tr" | "en" | "de";
}

export interface MaintenanceRecord {
  date: string;
  type: string;
  mechanic: string;
  price: string;
}

export interface Vehicle {
  id: number;
  ownerId: number;
  brand: string;
  model: string;
  year: number | string;
  plate: string;
  country: string;
  city: string;
  tireType: string;
  lastInspection: string;
  lastMaintenance: string;
  insuranceEnd: string;
  listingId: number | null;
  reminderOverrides: Record<string, unknown>;
  customReminders: unknown[];
  history: MaintenanceRecord[];
}

export type AppointmentStatus = "Sırada" | "Tamire Alındı" | "Tamir Tamamlandı" | string;

export interface Appointment {
  id: number;
  ownerId: number;
  mechanicId: number;
  customer: string;
  mechanicName: string;
  mechanicImg: string;
  vehicle: string;
  date: string;
  time: string;
  dateISO?: string | null;
  status: AppointmentStatus;
  autoAccepted: boolean;
  issue: string;
  issuePhotos?: string[];
  paymentMethod?: string;
  servicePrice?: number;
  depositPaid: number | null;
  depositRefunded?: boolean;
  reviewed?: boolean;
  noShow?: boolean;
  historyShareConsent?: boolean;
  warrantyEndDate?: string;
}

export interface ListingOffer {
  id?: number;
  amount: string;
  currency?: string;
  from: string;
  /** Teklifi verenin kalıcı id'si — bkz. Listing.sellerId notu, aynı gerekçe. */
  buyerId?: number | null;
  buyerType?: "owner" | "mechanic" | string;
  status?: string;
  seen?: boolean;
}

export interface ListingMessage {
  id?: number;
  from: string;
  /** Mesajı gönderenin kalıcı id'si — bkz. Listing.sellerId notu, aynı gerekçe. */
  buyerId?: number | null;
  buyerType?: "owner" | "mechanic" | string;
  text: string;
  lang?: string;
  ts?: string;
}

export type ListingStatus = "active" | "reserved" | "sold" | string;

export interface Listing {
  id: number;
  sellerName: string;
  sellerType: "mechanic" | "owner";
  /** Satıcının kalıcı id'si (MY_OWNER_ID veya MY_MECHANIC_ID, ya da başka bir owners/mechanics id'si)
   * — sellerName sadece görünen ad olduğu için (kullanıcı değiştirebilir) "bu ilan benim mi" gibi
   * kontroller artık öncelikle buna bakıyor; sellerName yalnızca eski/demo kayıtlar için yedek. */
  sellerId?: number | null;
  brand: string;
  model: string;
  year: number | string;
  km: number | string;
  price: string;
  description: string;
  photo: string;
  status: ListingStatus;
  px: number;
  py: number;
  offers: ListingOffer[];
  messages: ListingMessage[];
  fuelType: string;
  transmission: string;
  power: string;
  firstReg: string;
  color: string;
  vehicleId: number | null;
  adminRemoved?: boolean;
  shareCount?: number;
  /** İlanın bulunduğu şehir — homepage/filtre modalındaki konum aramasının eşleştiği alan. */
  city?: string;
  /** Açıklamanın hangi dilde yazıldığı — görüntüleyenin dili farklıysa otomatik çeviri için. */
  lang?: string;
  /** Kasa tipi (Sedan, Hatchback, SUV, ...) — bkz. constants.ts BODY_TYPES. */
  bodyType?: string;
  /** Motor hacmi, serbest metin (örn. "1.6", "2.0 TDI"). */
  engineSize?: string;
  /** Çekiş tipi — bkz. constants.ts DRIVETRAIN_OPTIONS. */
  drivetrain?: string;
  /** Kaçıncı elden (1 = ilk sahibinden). Form input'tan geldiği için year/km gibi string de olabilir. */
  ownerCount?: number | string;
  /** Hasar/tramer kaydı: boyalı ve değişen parça sayısı — sahibinden.com/arabam.com kaynaklı. */
  paintedParts?: number | string;
  changedParts?: number | string;
  /** Takas teklifi değerlendirilir mi. */
  tradeIn?: boolean;
  doorCount?: number | string;
  /** Donanım listesi (Klima, ABS, Deri Döşeme, ...) — bkz. constants.ts LISTING_FEATURE_OPTIONS. */
  features?: string[];
  /** Ek fotoğraflar (galeri) — boşsa tek `photo` alanı kullanılır. */
  photos?: string[];
  /** Almanya pazarındaki (mobile.de/AutoScout24) ilan alanlarından uyarlandı — koltuk sayısı,
   * ortalama yakıt tüketimi (l/100km), CO2 emisyonu (g/km) ve emisyon/Euro normu sınıfı. */
  seatCount?: number | string;
  fuelConsumption?: string;
  co2Emission?: number | string;
  emissionClass?: string;
  /** Sadece elektrikli/hibrit araçlarda anlamlı: batarya kapasitesi (kWh) ve menzil (km). */
  batteryCapacity?: string;
  rangeKm?: number | string;
  /** Fiyatta pazarlık payı olduğunu belirtir — detay sayfasında ve kartta rozet olarak gösterilir. */
  negotiable?: boolean;
  /** Ekspertiz raporu URL'i (fotoğraflarla aynı desen: dosya yükleme değil, dış bağlantı). */
  inspectionReportUrl?: string | null;
  /** Satıcı tarafından "öne çıkar" olarak işaretlenmiş mi — pazar listesinde üste sıralanır,
   * kartta/detayda rozet gösterilir. Gerçek bir ödeme akışı yok; demo kapsamında satıcı kendi
   * ilanında bunu doğrudan açıp kapatabilir, admin de geri alabilir. */
  featured?: boolean;
}

export interface ChatMessage {
  id: number;
  sender: "owner" | "mechanic";
  text: string;
  lang?: string;
  image?: string;
}

export interface Conversation {
  id: number;
  mechanicId: number;
  mechanicName: string;
  mechanicImg: string;
  mechanicLang?: string;
  messages: ChatMessage[];
  pendingContextNote?: string | null;
}

export interface JobApplicant {
  name: string;
  email?: string;
  phone?: string;
  cvFileName?: string;
  status?: "pending" | "rejected" | "accepted";
  /** Başvuru mesajı — adayın kendi diliyle yazdığı serbest metin. */
  message?: string;
  /** Başvuru mesajının hangi dilde yazıldığı — TranslatedText ile çeviri için. */
  lang?: string;
}

export interface JobListing {
  id: number;
  mechanicId: number;
  mechanicName: string;
  mechanicImg: string;
  title: string;
  employmentType: string;
  experienceLevel: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
  description: string;
  requirements: string[];
  skills: string[];
  postedDate: string;
  status: "active" | "closed" | string;
  applicants: JobApplicant[];
  shareCount?: number;
  /** İlan açıklamasının hangi dilde yazıldığı — görüntüleyenin dili farklıysa otomatik çeviri için. */
  lang?: string;
}

export type TicketType = "payment" | "listing" | "quality" | "verification" | "no_show" | "review" | "bug" | "customer" | string;
export type TicketPriority = "high" | "medium" | "low";
export type TicketStatus = "open" | "in_review" | "resolved" | string;

export interface SupportTicket {
  id: number;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  fromType: "owner" | "mechanic" | string;
  fromName: string;
  /** Talebi açan hesabın kalıcı id'si (MY_OWNER_ID/MY_MECHANIC_ID) — fromName bir görünen ad olduğu
   * için (kullanıcı sonradan değiştirebilir, ya da iki hesap aynı adı taşıyabilir) admin işlemlerinin
   * (grantVerification, removeFlaggedReview) DOĞRU hesabı hedeflediğinden emin olmak için kullanılır. */
  fromId?: number | null;
  subject: string;
  description: string;
  relatedNote: string;
  createdDate: string;
  resolvedDate?: string | null;
  adminNote: string;
  adminReplies?: { text: string; date: string }[];
  refunded: boolean;
}

export interface QuoteRequest {
  id: number;
  ownerId?: number;
  vehicleId?: number | null;
  customer: string;
  vehicle: string;
  issue: string;
  photos: string[];
  mechanicIds: number[];
  status: "open" | "closed" | string;
  createdAt?: string;
}

export interface QuoteOffer {
  id: number;
  requestId: number;
  mechanicId: number;
  mechanicName: string;
  mechanicImg: string;
  status: "pending" | "submitted" | "accepted" | "lost" | string;
  price: number | null;
  etaDays: number | null;
  note: string;
}

export interface AdminChangeLogEntry {
  id: number;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  before: unknown;
  after: unknown;
  reverted?: boolean;
  createdAt?: string;
}

export interface AdminStats {
  totalMechanics: number;
  totalOwners: number;
  totalAppointments: number;
  activeCarListings: number;
  openTickets: number;
  avgRating: number;
  totalReviews: number;
}

export interface ShareEvent {
  id: number;
  targetType: string;
  targetId: number;
  channel: string;
  refCode: string;
  sharedBy?: string | null;
  clickCount: number;
  conversionCount: number;
  createdAt?: string;
}

export interface ShareStats {
  totals: { shares: number; clicks: number; conversions: number };
  byChannel: { channel: string; shares: number; clicks: number; conversions: number }[];
  byTarget: { targetType: string; targetId: number; shares: number; clicks: number; conversions: number }[];
}

export interface ProfileViewStats {
  totalViews: number;
  viewsThisYear: number;
  conversions: number;
  conversionsThisYear: number;
  monthly: { month: string; views: number; conversions: number }[];
}

export interface ProfileViewAggregateStats {
  totals: { views: number; conversions: number };
  byTargetType: { targetType: string; views: number; conversions: number }[];
  topMechanics: { targetId: number; views: number; conversions: number }[];
  topListings: { targetId: number; views: number; conversions: number }[];
}

export interface Broadcast {
  id: number;
  audience: "all" | "owner" | "mechanic" | string;
  message: string;
  recipientCount: number;
  createdAt?: string;
}

export interface TranslateResult {
  translatedText: string;
  cached?: boolean;
  fallback?: boolean;
}

export type UserRole = "owner" | "mechanic" | "admin" | null;
