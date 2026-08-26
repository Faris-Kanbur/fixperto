import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.FIXPERTO_DB_PATH || path.join(__dirname, "fixperto.sqlite");

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ---------------------------------------------------------------------------
// Schema. JSON-shaped fields (services, staff, reviewList, offers, messages,
// requirements, skills, applicants, history, reminderOverrides, customReminders,
// verificationDocs, hoursText) are stored as TEXT columns holding JSON — this
// mirrors the nested objects the original single-file demo kept in React state,
// without over-normalizing data that has no independent identity of its own.
// ---------------------------------------------------------------------------
db.exec(`
CREATE TABLE IF NOT EXISTS mechanics (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  distance REAL,
  price INTEGER,
  rating REAL,
  reviews INTEGER DEFAULT 0,
  verified INTEGER DEFAULT 0,
  avgResponseMinutes INTEGER,
  specialty TEXT,
  img TEXT,
  lang TEXT DEFAULT 'tr',
  px REAL, py REAL,
  bannerPreset TEXT,
  coverPhoto TEXT,
  lat REAL, lng REAL,
  iban TEXT DEFAULT '',
  bankName TEXT DEFAULT '',
  accountHolder TEXT DEFAULT '',
  address TEXT,
  hoursText TEXT DEFAULT '[]',
  services TEXT DEFAULT '[]',
  staff TEXT DEFAULT '[]',
  reviewList TEXT DEFAULT '[]',
  verificationDocs TEXT DEFAULT '[]',
  shareCount INTEGER DEFAULT 0,
  brandsServiced TEXT DEFAULT '[]',
  paymentMethods TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS owners (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  photo TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT,
  joinDate TEXT,
  status TEXT DEFAULT 'active',
  vehicleCount INTEGER DEFAULT 0,
  apptCount INTEGER DEFAULT 0,
  password TEXT NOT NULL,
  favoriteIds TEXT DEFAULT '[]',
  lang TEXT DEFAULT 'tr'
);

CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY,
  ownerId INTEGER REFERENCES owners(id),
  brand TEXT, model TEXT, year INTEGER, plate TEXT,
  country TEXT DEFAULT 'tr', city TEXT,
  tireType TEXT DEFAULT 'mevsimlik',
  lastInspection TEXT, lastMaintenance TEXT, insuranceEnd TEXT,
  listingId INTEGER,
  reminderOverrides TEXT DEFAULT '{}',
  customReminders TEXT DEFAULT '[]',
  history TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY,
  ownerId INTEGER REFERENCES owners(id),
  mechanicId INTEGER REFERENCES mechanics(id),
  customer TEXT,
  mechanicName TEXT,
  mechanicImg TEXT,
  vehicle TEXT,
  date TEXT, time TEXT, dateISO TEXT,
  status TEXT DEFAULT 'Onay Bekliyor',
  autoAccepted INTEGER DEFAULT 0,
  issue TEXT,
  issuePhotos TEXT DEFAULT '[]',
  paymentMethod TEXT,
  servicePrice INTEGER,
  depositPaid INTEGER,
  depositRefunded INTEGER DEFAULT 0,
  reviewed INTEGER DEFAULT 0,
  noShow INTEGER DEFAULT 0,
  historyShareConsent INTEGER DEFAULT 1,
  warrantyEndDate TEXT,
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY,
  mechanicId INTEGER,
  mechanicName TEXT,
  mechanicImg TEXT,
  mechanicLang TEXT DEFAULT 'tr',
  messages TEXT DEFAULT '[]',
  pendingContextNote TEXT
);

CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY,
  sellerName TEXT, sellerType TEXT,
  brand TEXT, model TEXT, year INTEGER, km INTEGER,
  price TEXT, description TEXT, photo TEXT,
  status TEXT DEFAULT 'active',
  px REAL, py REAL,
  offers TEXT DEFAULT '[]',
  messages TEXT DEFAULT '[]',
  fuelType TEXT, transmission TEXT, power TEXT, firstReg TEXT, color TEXT,
  vehicleId INTEGER,
  shareCount INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS job_listings (
  id INTEGER PRIMARY KEY,
  mechanicId INTEGER REFERENCES mechanics(id),
  mechanicName TEXT, mechanicImg TEXT,
  title TEXT, employmentType TEXT, experienceLevel TEXT, location TEXT,
  salaryMin TEXT, salaryMax TEXT,
  description TEXT,
  requirements TEXT DEFAULT '[]',
  skills TEXT DEFAULT '[]',
  postedDate TEXT, status TEXT DEFAULT 'active',
  applicants TEXT DEFAULT '[]',
  shareCount INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id INTEGER PRIMARY KEY,
  type TEXT, priority TEXT, status TEXT DEFAULT 'open',
  fromType TEXT, fromName TEXT,
  subject TEXT, description TEXT, relatedNote TEXT,
  createdDate TEXT, resolvedDate TEXT, adminNote TEXT DEFAULT '',
  adminReplies TEXT DEFAULT '[]',
  refunded INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admin_change_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT DEFAULT 'admin',
  action TEXT NOT NULL,
  entityType TEXT,
  entityId TEXT,
  before TEXT,
  after TEXT,
  reverted INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- Çoklu tamirci fiyat teklifi isteği (quote request) ve buna gelen tekliflerin (quote offer)
-- kalıcı hâli — bu özellik daha önce sadece istemci tarafı state'te tutuluyordu (bkz.
-- REFACTOR_REPORT.md "kalan teknik borç"), şimdi diğer 8 varlık gibi gerçek tablolara taşındı.
CREATE TABLE IF NOT EXISTS quote_requests (
  id INTEGER PRIMARY KEY,
  ownerId INTEGER REFERENCES owners(id),
  vehicleId INTEGER REFERENCES vehicles(id),
  customer TEXT,
  vehicle TEXT,
  issue TEXT,
  photos TEXT DEFAULT '[]',
  mechanicIds TEXT DEFAULT '[]',
  status TEXT DEFAULT 'open',
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS quote_offers (
  id INTEGER PRIMARY KEY,
  requestId INTEGER REFERENCES quote_requests(id),
  mechanicId INTEGER REFERENCES mechanics(id),
  mechanicName TEXT,
  mechanicImg TEXT,
  status TEXT DEFAULT 'pending',
  price INTEGER,
  etaDays INTEGER,
  note TEXT DEFAULT ''
);

-- Her ShareButton eylemi (WhatsApp/Facebook/X/e-posta/link kopyalama/native paylaşım) burada ayrı
-- bir satır olarak, kendine özgü bir refCode ile kaydedilir. Paylaşılan link o refCode'u taşıdığı
-- için, linke tıklayan biri geldiğinde (clickCount) ve sonrasında sohbet/randevu/teklif/başvuru
-- gibi bir "dönüşüm" eylemi yaptığında (conversionCount) aynı satıra atfedilebiliyor — bu sayede
-- ham "kaç kez paylaşıldı" sayısının ötesinde, hangi kanalın gerçekten iş getirdiği görülebiliyor.
CREATE TABLE IF NOT EXISTS share_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  targetType TEXT NOT NULL,
  targetId INTEGER NOT NULL,
  channel TEXT NOT NULL,
  refCode TEXT UNIQUE NOT NULL,
  sharedBy TEXT,
  clickCount INTEGER DEFAULT 0,
  conversionCount INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- Tamirci profili ve araç ilanı sayfa görüntülemeleri: her açılışta tek bir satır eklenir (basit bir
-- olay günlüğü). "converted" alanı, bu görüntülemenin ardından (aynı oturumda) bir randevuya
-- dönüşüp dönüşmediğini işaretler — bkz. AppLogicProvider.tsx: activeMechanicViewIdRef,
-- confirmBooking. Toplam/yıllık görüntülenme ve dönüşüm oranı buradan hesaplanıyor (COUNT/SUM
-- yerine tek tek satır tutmak, "bu yıl" gibi zaman pencereli sorguları ve aylık trend grafiğini de
-- mümkün kılıyor — bkz. backend/routes/profileViews.js GET /stats).
CREATE TABLE IF NOT EXISTS profile_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  targetType TEXT NOT NULL,
  targetId INTEGER NOT NULL,
  converted INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- Admin panelden gönderilen platform duyurularının kalıcı kaydı (bkz. sendBroadcast,
-- AppLogicProvider.tsx) — daha önce sadece local state'te tutuluyordu ve sayfa yenilenince
-- kayboluyordu.
CREATE TABLE IF NOT EXISTS broadcasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audience TEXT NOT NULL,
  message TEXT NOT NULL,
  recipientCount INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- Sohbet mesajı çevirilerinin sunucu tarafı önbelleği: aynı metin/dil çifti için gerçek çeviri
-- servisine (bkz. backend/routes/translate.js) sadece bir kez gidilir — hem hız hem de ücretsiz
-- servisin nadir istek sınırlarını aşmamak için önemli (bkz. "yavaşlatmasın" isteği).
CREATE TABLE IF NOT EXISTS translation_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fromLang TEXT NOT NULL,
  toLang TEXT NOT NULL,
  sourceText TEXT NOT NULL,
  translatedText TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  UNIQUE(fromLang, toLang, sourceText)
);
`);

// ---------------------------------------------------------------------------
// Küçük, sıfır bağımlılıklı migrasyon: "CREATE TABLE IF NOT EXISTS" zaten var olan bir
// tabloya yeni sütun eklemez. Bu backend daha önce çalıştırılmış ve diskte eski şemalı bir
// fixperto.sqlite dosyası varsa, aşağıdaki ALTER TABLE'lar eksik sütunları ekler. Sütun zaten
// varsa SQLite hata fırlatır — bunu sessizce yutuyoruz (idempotent migrasyon).
function ensureColumn(table, columnDef) {
  const columnName = columnDef.trim().split(/\s+/)[0];
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
  } catch (err) {
    if (!/duplicate column name/i.test(err.message)) throw err;
  }
}
[
  ["appointments", "dateISO TEXT"],
  ["appointments", "issuePhotos TEXT DEFAULT '[]'"],
  ["appointments", "paymentMethod TEXT"],
  ["appointments", "servicePrice INTEGER"],
  ["appointments", "depositRefunded INTEGER DEFAULT 0"],
  ["appointments", "reviewed INTEGER DEFAULT 0"],
  ["appointments", "noShow INTEGER DEFAULT 0"],
  ["appointments", "historyShareConsent INTEGER DEFAULT 1"],
  ["appointments", "warrantyEndDate TEXT"],
  ["support_tickets", "resolvedDate TEXT"],
  ["support_tickets", "adminReplies TEXT DEFAULT '[]'"],
  ["owners", "favoriteIds TEXT DEFAULT '[]'"],
  ["owners", "lang TEXT DEFAULT 'tr'"],
  ["admin_change_log", "reverted INTEGER DEFAULT 0"],
  ["mechanics", "shareCount INTEGER DEFAULT 0"],
  ["mechanics", "brandsServiced TEXT DEFAULT '[]'"],
  ["mechanics", "paymentMethods TEXT DEFAULT '[]'"],
  ["listings", "shareCount INTEGER DEFAULT 0"],
  ["job_listings", "shareCount INTEGER DEFAULT 0"],
].forEach(([table, columnDef]) => ensureColumn(table, columnDef));

export function isEmpty(table) {
  return db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n === 0;
}
