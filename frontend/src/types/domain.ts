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
  flagged?: boolean;
  mechanicReply?: string;
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
  amount: string;
  from: string;
  seen?: boolean;
}

export interface ListingMessage {
  from: string;
  text: string;
  ts?: string;
}

export type ListingStatus = "active" | "reserved" | "sold" | string;

export interface Listing {
  id: number;
  sellerName: string;
  sellerType: "mechanic" | "owner";
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
}

export interface JobApplicant {
  name: string;
  email?: string;
  phone?: string;
  cvFileName?: string;
  status?: "pending" | "rejected" | "accepted";
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

export type UserRole = "owner" | "mechanic" | "admin" | null;
