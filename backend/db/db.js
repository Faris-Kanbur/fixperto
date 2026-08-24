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
  verificationDocs TEXT DEFAULT '[]'
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
  password TEXT NOT NULL
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
  date TEXT, time TEXT,
  status TEXT DEFAULT 'Onay Bekliyor',
  autoAccepted INTEGER DEFAULT 0,
  issue TEXT,
  depositPaid INTEGER,
  createdAt TEXT DEFAULT (datetime('now'))
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
  vehicleId INTEGER
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
  applicants TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id INTEGER PRIMARY KEY,
  type TEXT, priority TEXT, status TEXT DEFAULT 'open',
  fromType TEXT, fromName TEXT,
  subject TEXT, description TEXT, relatedNote TEXT,
  createdDate TEXT, adminNote TEXT DEFAULT '',
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
  createdAt TEXT DEFAULT (datetime('now'))
);
`);

export function isEmpty(table) {
  return db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n === 0;
}
