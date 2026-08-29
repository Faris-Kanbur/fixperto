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
  paymentMethods TEXT DEFAULT '[]',
  phone TEXT,
  -- Owners tablosundaki password sütunuyla aynı gerekçeyle eklendi (bkz. o tablodaki yorum):
  -- tamirci profil ayarlarındaki "şifre değiştir" formu önceden mevcut şifreyi hiç doğrulamıyordu
  -- çünkü karşılaştırılacak gerçek bir sütun yoktu. Demo amaçlı düz metin — gerçek bir üretim
  -- sisteminde ASLA client'a dönmemeli.
  password TEXT DEFAULT 'demo1234'
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
  likedReviewIds TEXT DEFAULT '[]',
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
  sellerId INTEGER,
  brand TEXT, model TEXT, year INTEGER, km INTEGER,
  price TEXT, description TEXT, photo TEXT,
  status TEXT DEFAULT 'active',
  px REAL, py REAL,
  offers TEXT DEFAULT '[]',
  messages TEXT DEFAULT '[]',
  fuelType TEXT, transmission TEXT, power TEXT, firstReg TEXT, color TEXT,
  vehicleId INTEGER,
  shareCount INTEGER DEFAULT 0,
  bodyType TEXT,
  engineSize TEXT,
  drivetrain TEXT,
  ownerCount INTEGER,
  paintedParts INTEGER DEFAULT 0,
  changedParts INTEGER DEFAULT 0,
  tradeIn INTEGER DEFAULT 0,
  doorCount INTEGER,
  features TEXT DEFAULT '[]',
  photos TEXT DEFAULT '[]',
  seatCount INTEGER,
  fuelConsumption TEXT,
  co2Emission INTEGER,
  emissionClass TEXT,
  batteryCapacity TEXT,
  rangeKm INTEGER,
  city TEXT,
  lang TEXT,
  negotiable INTEGER DEFAULT 0,
  inspectionReportUrl TEXT,
  featured INTEGER DEFAULT 0,
  adminRemoved INTEGER DEFAULT 0
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
  shareCount INTEGER DEFAULT 0,
  lang TEXT
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id INTEGER PRIMARY KEY,
  type TEXT, priority TEXT, status TEXT DEFAULT 'open',
  fromType TEXT, fromName TEXT,
  fromId INTEGER,
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
  ["support_tickets", "fromId INTEGER"],
  ["owners", "favoriteIds TEXT DEFAULT '[]'"],
  ["owners", "likedReviewIds TEXT DEFAULT '[]'"],
  ["owners", "lang TEXT DEFAULT 'tr'"],
  ["admin_change_log", "reverted INTEGER DEFAULT 0"],
  ["mechanics", "shareCount INTEGER DEFAULT 0"],
  ["mechanics", "brandsServiced TEXT DEFAULT '[]'"],
  ["mechanics", "paymentMethods TEXT DEFAULT '[]'"],
  ["listings", "shareCount INTEGER DEFAULT 0"],
  ["job_listings", "shareCount INTEGER DEFAULT 0"],
  ["listings", "bodyType TEXT"],
  ["listings", "engineSize TEXT"],
  ["listings", "drivetrain TEXT"],
  ["listings", "ownerCount INTEGER"],
  ["listings", "paintedParts INTEGER DEFAULT 0"],
  ["listings", "changedParts INTEGER DEFAULT 0"],
  ["listings", "tradeIn INTEGER DEFAULT 0"],
  ["listings", "doorCount INTEGER"],
  ["listings", "features TEXT DEFAULT '[]'"],
  ["listings", "photos TEXT DEFAULT '[]'"],
  ["listings", "seatCount INTEGER"],
  ["listings", "fuelConsumption TEXT"],
  ["listings", "co2Emission INTEGER"],
  ["listings", "emissionClass TEXT"],
  ["listings", "batteryCapacity TEXT"],
  ["listings", "rangeKm INTEGER"],
  ["listings", "city TEXT"],
  ["listings", "lang TEXT"],
  ["job_listings", "lang TEXT"],
  ["listings", "sellerId INTEGER"],
  ["listings", "offers TEXT DEFAULT '[]'"],
  ["listings", "messages TEXT DEFAULT '[]'"],
  ["listings", "negotiable INTEGER DEFAULT 0"],
  ["listings", "inspectionReportUrl TEXT"],
  ["listings", "featured INTEGER DEFAULT 0"],
  ["listings", "adminRemoved INTEGER DEFAULT 0"],
  ["mechanics", "phone TEXT"],
  ["mechanics", "password TEXT DEFAULT 'demo1234'"],
].forEach(([table, columnDef]) => ensureColumn(table, columnDef));

// ---------------------------------------------------------------------------
// Tek seferlik veri düzeltmesi (backfill): brandsServiced/paymentMethods sütunları yukarıdaki
// ensureColumn ile eklendiğinde, "CREATE TABLE IF NOT EXISTS" zaten devrede olduğu için (yani
// mechanics tablosu bu sütunlar eklenmeden ÖNCE zaten oluşturulmuş ve doldurulmuşsa) ALTER TABLE
// mevcut satırlara sadece DEFAULT '[]' atar — backend/db/seed.js'deki gerçek marka/ödeme
// yöntemi verileri yalnızca sıfırdan oluşturulan bir veritabanında INSERT ile eklenir, var olan
// satırları geriye dönük doldurmaz. Bu yüzden burada, hâlâ boş dizi ('[]') olan bilinen demo
// tamirci satırlarını seed.js ile birebir aynı verilerle dolduruyoruz — kullanıcının kendi
// profilinden zaten seçim yapmış olduğu satırlara (yani artık '[]' olmayanlara) DOKUNMUYORUZ.
// Faris'in verdiği gerçek LoremFlickr linkleri — seed.js ile birebir aynı lock numaraları.
const wc = (lock) => `https://loremflickr.com/800/600/car?lock=${lock}`;

const MECHANIC_BACKFILL = {
  1: { brandsServiced: ["Volkswagen", "Renault", "Fiat", "Ford", "Toyota", "Hyundai"], paymentMethods: ["Nakit", "Kredi/Banka Kartı", "Havale/EFT"], coverPhoto: wc(9), phone: "0216 345 67 89" },
  2: { brandsServiced: ["Renault", "Fiat", "Ford", "Opel", "Hyundai", "Peugeot"], paymentMethods: ["Nakit", "Kredi/Banka Kartı"], coverPhoto: wc(10), phone: "0312 456 78 90" },
  3: { brandsServiced: ["Volkswagen", "BMW", "Mercedes-Benz", "Audi"], paymentMethods: ["Nakit", "Kredi/Banka Kartı", "Havale/EFT"], coverPhoto: wc(11), phone: "0232 567 89 01" },
  4: { brandsServiced: ["Renault", "Fiat", "Dacia", "Tofaş", "Hyundai"], paymentMethods: ["Nakit"], coverPhoto: wc(12), phone: "0224 678 90 12" },
  5: { brandsServiced: ["BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Mini"], paymentMethods: ["Kredi/Banka Kartı", "Havale/EFT"], coverPhoto: wc(13), phone: "0212 789 01 23" },
  6: { brandsServiced: ["Fiat", "Renault", "Tofaş", "Dacia"], paymentMethods: ["Nakit"], coverPhoto: wc(14), phone: "0332 890 12 34" },
  7: { brandsServiced: ["Volkswagen", "Renault", "Fiat", "Ford", "Toyota", "Opel"], paymentMethods: ["Nakit", "Kredi/Banka Kartı", "Havale/EFT"], coverPhoto: wc(15), phone: "0242 901 23 45" },
  8: { brandsServiced: ["Renault", "Fiat", "Hyundai", "Toyota"], paymentMethods: ["Nakit", "Kredi/Banka Kartı"], coverPhoto: wc(16), phone: "0342 012 34 56" },
  9: { brandsServiced: ["Renault", "Ford", "Opel", "Volkswagen"], paymentMethods: ["Nakit", "Havale/EFT"], coverPhoto: wc(17), phone: "0462 123 45 67" },
  10: { brandsServiced: ["Volkswagen", "Renault", "Fiat", "Ford", "Toyota", "Honda"], paymentMethods: ["Nakit", "Kredi/Banka Kartı", "Havale/EFT", "Kapıda Ödeme"], coverPhoto: wc(18), phone: "0222 234 56 78" },
};
try {
  const backfillStmt = db.prepare(`UPDATE mechanics SET
    brandsServiced = CASE WHEN brandsServiced IS NULL OR brandsServiced = '[]' THEN @brandsServiced ELSE brandsServiced END,
    paymentMethods = CASE WHEN paymentMethods IS NULL OR paymentMethods = '[]' THEN @paymentMethods ELSE paymentMethods END,
    coverPhoto = CASE WHEN coverPhoto IS NULL OR coverPhoto = '' OR coverPhoto LIKE '%wikimedia%' THEN @coverPhoto ELSE coverPhoto END,
    phone = CASE WHEN phone IS NULL OR phone = '' THEN @phone ELSE phone END
    WHERE id = @id`);
  Object.entries(MECHANIC_BACKFILL).forEach(([id, data]) => {
    backfillStmt.run({ id: Number(id), brandsServiced: JSON.stringify(data.brandsServiced), paymentMethods: JSON.stringify(data.paymentMethods), coverPhoto: data.coverPhoto, phone: data.phone });
  });
} catch (err) {
  console.error("Tamirci marka/ödeme yöntemi backfill hatası:", err.message);
}

// "Tüm Yorumlar" modalindeki foto/fotosuz yorum karışıklığını düzeltmek için (bkz. AppShell/
// MechDetailBody), photo:true olan demo yorumlarına gerçek bir photoUrl ekliyoruz. Ayrıca —
// daha kritik bir düzeltme — seed.js'deki demo yorumların ilk sürümünde `id` alanı YOKTU; bu
// yüzden "Faydalı" (helpful) beğenisi ve tamirci yanıtı gibi id'ye göre eşleşen her işlem, aynı
// tamirciye ait TÜM yorumlarda birden etkili oluyordu (hepsinin id'si undefined olduğu için tek
// bir yorumu beğenince tamirciye ait tüm yorumlar "beğenilmiş" görünüyordu — kullanıcı geri
// bildirimi). Burada isme göre eşleştirip eksik id/photoUrl'i tamamlıyoruz; zaten id'si olan
// (yani kullanıcının sonradan eklediği gerçek) yorumlara dokunmuyoruz.
// reviewList bir JSON blob olduğu için yukarıdaki gibi düz bir SQL CASE ile yamanamıyor — satırı
// okuyup JS tarafında ismiyle eşleşen yorumu yamalayıp geri yazıyoruz.
const REVIEW_BACKFILL = {
  1: [{ name: "Ahmet K.", id: 6001, photoUrl: wc(201) }, { name: "Elif S.", id: 6002 }, { name: "Burak T.", id: 6003, photoUrl: wc(202) }],
  2: [{ name: "Fatma Y.", id: 6004 }, { name: "Kerem A.", id: 6005, photoUrl: wc(203) }],
  3: [{ name: "Tolga E.", id: 6006, photoUrl: wc(204) }],
  4: [{ name: "Nihal K.", id: 6007 }, { name: "Kullanıcı8823", id: 6008 }],
  5: [{ name: "David R.", id: 6009, photoUrl: wc(205) }],
  6: [{ name: "Cem S.", id: 6010 }],
  7: [{ name: "Selin A.", id: 6011, photoUrl: wc(206) }, { name: "Murat D.", id: 6012 }],
  8: [{ name: "Emre T.", id: 6013 }],
  9: [{ name: "Gökhan B.", id: 6014, photoUrl: wc(207) }],
  10: [{ name: "Pınar E.", id: 6015 }],
};
try {
  const reviewRowStmt = db.prepare(`SELECT id, reviewList FROM mechanics WHERE id = ?`);
  const reviewUpdateStmt = db.prepare(`UPDATE mechanics SET reviewList = @reviewList WHERE id = @id`);
  Object.entries(REVIEW_BACKFILL).forEach(([id, patches]) => {
    const row = reviewRowStmt.get(Number(id));
    if (!row) return;
    let reviewList;
    try { reviewList = JSON.parse(row.reviewList || "[]"); } catch { return; }
    let changed = false;
    const nextList = reviewList.map((r) => {
      const patch = patches.find((p) => p.name === r.name);
      if (!patch) return r;
      const next = { ...r };
      if (r.id === undefined || r.id === null) { next.id = patch.id; changed = true; }
      if (patch.photoUrl && r.photo && !r.photoUrl) { next.photoUrl = patch.photoUrl; changed = true; }
      return next;
    });
    if (changed) reviewUpdateStmt.run({ id: Number(id), reviewList: JSON.stringify(nextList) });
  });
} catch (err) {
  console.error("Yorum id/fotoğrafı backfill hatası:", err.message);
}

// Aynı gerekçeyle (bkz. MECHANIC_BACKFILL yukarıda): listings tablosu bu alanlar eklenmeden ÖNCE
// zaten oluşturulmuş olabileceğinden, seed.js'deki zengin örnek veriler yalnızca hâlâ boş/varsayılan
// olan bilinen demo ilan satırlarına (id 1-8) geriye dönük yazılıyor — kullanıcının kendi girdiği
// veya düzenlediği ilanlara dokunulmuyor.
const LISTING_BACKFILL = {
  1: { bodyType: "Sedan", engineSize: "1.6", drivetrain: "Önden Çekiş", ownerCount: 2, paintedParts: 0, changedParts: 0, tradeIn: 0, doorCount: 4, features: ["Klima", "Elektrikli Cam", "Elektrikli Ayna", "ABS", "Bluetooth"], seatCount: 5, fuelConsumption: "6.5", co2Emission: 148, emissionClass: "Euro 6", photo: wc(1), photos: [wc(19)], city: "İstanbul" },
  2: { bodyType: "Hatchback/5 Kapı", engineSize: "1.5 dCi", drivetrain: "Önden Çekiş", ownerCount: 1, paintedParts: 0, changedParts: 0, tradeIn: 1, doorCount: 5, features: ["Klima", "Elektrikli Cam", "Hız Sabitleyici (Cruise Control)", "Bluetooth"], seatCount: 5, fuelConsumption: "4.2", co2Emission: 110, emissionClass: "Euro 6", photo: wc(2), photos: [wc(20)], city: "İstanbul" },
  3: { bodyType: "Sedan", engineSize: "2.0", drivetrain: "Arkadan İtiş", ownerCount: 1, paintedParts: 0, changedParts: 0, tradeIn: 0, doorCount: 4, features: ["Deri Döşeme", "Sunroof/Cam Tavan", "Geri Görüş Kamerası", "Park Sensörü (Ön)", "Park Sensörü (Arka)", "Xenon/LED Far", "Navigasyon", "Alaşım Jant"], seatCount: 5, fuelConsumption: "6.8", co2Emission: 155, emissionClass: "Euro 6", photo: wc(3), photos: [], city: "İzmir" },
  4: { bodyType: "Hatchback/5 Kapı", engineSize: "1.6 TDI", drivetrain: "Önden Çekiş", ownerCount: 2, paintedParts: 1, changedParts: 0, tradeIn: 0, doorCount: 5, features: ["Klima", "Elektrikli Cam", "Bluetooth", "ABS"], seatCount: 5, fuelConsumption: "4.5", co2Emission: 118, emissionClass: "Euro 6", photo: wc(4), photos: [], city: "Ankara" },
  5: { bodyType: "Sedan", engineSize: "1.4", drivetrain: "Önden Çekiş", ownerCount: 1, paintedParts: 0, changedParts: 0, tradeIn: 0, doorCount: 4, features: ["Klima", "Elektrikli Cam", "Elektrikli Ayna", "Bluetooth", "Park Sensörü (Arka)"], seatCount: 5, fuelConsumption: "5.9", co2Emission: 135, emissionClass: "Euro 6", photo: wc(5), photos: [], city: "Ankara" },
  6: { bodyType: "Sedan", engineSize: "2.0", drivetrain: "Arkadan İtiş", ownerCount: 3, paintedParts: 2, changedParts: 1, tradeIn: 0, doorCount: 4, features: ["Deri Döşeme", "Isıtmalı Koltuk", "Sunroof/Cam Tavan", "Navigasyon", "Alaşım Jant", "Park Sensörü (Ön)", "Park Sensörü (Arka)"], seatCount: 5, fuelConsumption: "5.1", co2Emission: 134, emissionClass: "Euro 6", photo: wc(6), photos: [], city: "İzmir" },
  7: { bodyType: "Hatchback/5 Kapı", engineSize: "1.4", drivetrain: "Önden Çekiş", ownerCount: 1, paintedParts: 0, changedParts: 0, tradeIn: 1, doorCount: 5, features: ["Klima", "Elektrikli Cam", "Elektrikli Ayna", "Bluetooth", "Geri Görüş Kamerası"], seatCount: 5, fuelConsumption: "5.6", co2Emission: 128, emissionClass: "Euro 6", photo: wc(7), photos: [], city: "Antalya" },
  8: { bodyType: "Hatchback/5 Kapı", engineSize: "2.0 TDI", drivetrain: "Önden Çekiş", ownerCount: 2, paintedParts: 1, changedParts: 0, tradeIn: 0, doorCount: 5, features: ["Deri Döşeme", "Xenon/LED Far", "Navigasyon", "Alaşım Jant", "Park Sensörü (Ön)", "Park Sensörü (Arka)"], seatCount: 5, fuelConsumption: "4.3", co2Emission: 113, emissionClass: "Euro 6", photo: wc(8), photos: [], city: "Bursa" },
};
try {
  const listingBackfillStmt = db.prepare(`UPDATE listings SET
    bodyType = CASE WHEN bodyType IS NULL OR bodyType = '' THEN @bodyType ELSE bodyType END,
    engineSize = CASE WHEN engineSize IS NULL OR engineSize = '' THEN @engineSize ELSE engineSize END,
    drivetrain = CASE WHEN drivetrain IS NULL OR drivetrain = '' THEN @drivetrain ELSE drivetrain END,
    ownerCount = CASE WHEN ownerCount IS NULL THEN @ownerCount ELSE ownerCount END,
    doorCount = CASE WHEN doorCount IS NULL THEN @doorCount ELSE doorCount END,
    features = CASE WHEN features IS NULL OR features = '[]' THEN @features ELSE features END,
    seatCount = CASE WHEN seatCount IS NULL THEN @seatCount ELSE seatCount END,
    fuelConsumption = CASE WHEN fuelConsumption IS NULL OR fuelConsumption = '' THEN @fuelConsumption ELSE fuelConsumption END,
    co2Emission = CASE WHEN co2Emission IS NULL THEN @co2Emission ELSE co2Emission END,
    emissionClass = CASE WHEN emissionClass IS NULL OR emissionClass = '' THEN @emissionClass ELSE emissionClass END,
    photo = CASE WHEN photo IS NULL OR photo = '' OR length(photo) <= 4 OR photo LIKE '%wikimedia%' THEN @photo ELSE photo END,
    photos = CASE WHEN photos IS NULL OR photos = '[]' OR photos LIKE '%wikimedia%' THEN @photos ELSE photos END,
    city = CASE WHEN city IS NULL OR city = '' THEN @city ELSE city END
    WHERE id = @id`);
  Object.entries(LISTING_BACKFILL).forEach(([id, data]) => {
    listingBackfillStmt.run({ id: Number(id), bodyType: data.bodyType, engineSize: data.engineSize, drivetrain: data.drivetrain, ownerCount: data.ownerCount, doorCount: data.doorCount, features: JSON.stringify(data.features), seatCount: data.seatCount, fuelConsumption: data.fuelConsumption, co2Emission: data.co2Emission, emissionClass: data.emissionClass, photo: data.photo, photos: JSON.stringify(data.photos || []), city: data.city });
  });
} catch (err) {
  console.error("İlan araç bilgisi backfill hatası:", err.message);
}

// GERÇEK HATA DÜZELTMESİ: listings tablosu satıcı kimliğini şimdiye kadar sadece sellerName (donmuş
// bir görünen ad) olarak tutuyordu — sellerId hiç yoktu. Bu, "bu ilan benim mi", "ilana gelen teklif/
// soru bildirimi bana mı ait" gibi TÜM kontrollerin isimle yapılmasına yol açıyordu: bir kullanıcı adını
// değiştirirse (profilden veya admin panelinden) kendi ilanlarını, tekliflerini ve bildirimlerini
// sessizce kaybederdi (bkz. REFACTOR_REPORT.md bölüm 17 — appointments/support_tickets'ta zaten
// düzeltilen "isimle eşleştirme" hata sınıfının aynısı). Burada seed.js'deki 8 demo ilanın satıcı
// adı, owners/mechanics tablolarındaki gerçek kayıtlarla eşleştirilip sellerId geriye dönük yazılıyor.
// "Elif S." (ilan #7) owners tablosunda karşılığı olmayan kurgusal bir isim olduğu için sellerId
// bilerek NULL bırakılıyor — tıpkı diğer isimsiz/karşılıksız demo verilerinde olduğu gibi (bkz.
// flagged review "Kullanıcı8823"), zaten gerçek/etkileşimli bir hesaba karşılık gelmiyor.
const LISTING_SELLER_ID_BACKFILL = {
  1: { sellerType: "mechanic", sellerName: "Usta Mehmet Oto Servis" },
  2: { sellerType: "owner", sellerName: "Ali Yıldız" },
  3: { sellerType: "owner", sellerName: "Zeynep Kaya" },
  4: { sellerType: "mechanic", sellerName: "Hızlı Tamir Merkezi" },
  5: { sellerType: "owner", sellerName: "Mehmet Demir" },
  6: { sellerType: "mechanic", sellerName: "Güven Oto" },
  8: { sellerType: "mechanic", sellerName: "Anadolu Servis" },
};
try {
  const mechByName = new Map(db.prepare(`SELECT id, name FROM mechanics`).all().map((m) => [m.name, m.id]));
  const ownerByName = new Map(db.prepare(`SELECT id, name FROM owners`).all().map((o) => [o.name, o.id]));
  const listingSellerIdStmt = db.prepare(`UPDATE listings SET sellerId = @sellerId WHERE id = @id AND sellerId IS NULL`);
  Object.entries(LISTING_SELLER_ID_BACKFILL).forEach(([id, meta]) => {
    const sellerId = meta.sellerType === "mechanic" ? mechByName.get(meta.sellerName) : ownerByName.get(meta.sellerName);
    if (sellerId != null) listingSellerIdStmt.run({ id: Number(id), sellerId });
  });
} catch (err) {
  console.error("İlan satıcı id backfill hatası:", err.message);
}

export function isEmpty(table) {
  return db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n === 0;
}
