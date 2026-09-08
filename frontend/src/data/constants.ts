export const BANNER_PRESETS = { blue: "from-gray-50 to-gray-100", orange: "from-rose-50 to-rose-100", green: "from-gray-100 to-gray-200" };
// Karşılama turu adımları. Metinler artık BURADA DEĞİL i18n'de (titleKey/descKey): eskiden sabit
// Türkçe yazılıydı, yani site İngilizce/Almanca'ya alınsa bile karşılama ekranı Türkçe kalıyordu —
// üstelik kullanıcının gördüğü İLK ekran orasıydı.
export const ONBOARDING_SLIDES = [
  { icon: "🔧", grad: "from-gray-950 via-gray-900 to-rose-800", titleKey: "onboardWelcomeTitle", descKey: "onboardWelcomeDesc" },
  { icon: "🚗", grad: "from-rose-600 to-rose-900", titleKey: "onboardOwnerTitle", descKey: "onboardOwnerDesc" },
  { icon: "🛠️", grad: "from-rose-500 to-rose-700", titleKey: "onboardMechTitle", descKey: "onboardMechDesc" },
];
export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const DAY_LABELS = { mon: "Pzt", tue: "Sal", wed: "Çar", thu: "Per", fri: "Cum", sat: "Cmt", sun: "Paz" };
export const DAY_LABELS_FULL = { mon: "Pazartesi", tue: "Salı", wed: "Çarşamba", thu: "Perşembe", fri: "Cuma", sat: "Cumartesi", sun: "Pazar" };
// GERÇEK HATA DÜZELTMESİ: Çalışma saatleri (Öffnungszeiten) bölümündeki gün isimleri dil seçeneği
// değişince güncellenmiyordu — çünkü formatHoursText (bkz. helpers.ts) DAY_LABELS'ı doğrudan
// kullanıyordu, hep Türkçe. Bu üç haritayla formatHoursText artık aktif dile (tr/en/de) göre doğru
// gün adını ve "Kapalı" metnini üretebiliyor.
export const DAY_LABELS_BY_LANG = {
  tr: DAY_LABELS,
  en: { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" },
  de: { mon: "Mo", tue: "Di", wed: "Mi", thu: "Do", fri: "Fr", sat: "Sa", sun: "So" },
};
export const DAY_LABELS_FULL_BY_LANG = {
  tr: DAY_LABELS_FULL,
  en: { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" },
  de: { mon: "Montag", tue: "Dienstag", wed: "Mittwoch", thu: "Donnerstag", fri: "Freitag", sat: "Samstag", sun: "Sonntag" },
};
export const CLOSED_LABEL_BY_LANG = { tr: "Kapalı", en: "Closed", de: "Geschlossen" };
export const JS_DAY_TO_KEY = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
export const FUEL_TYPES = ["Benzin", "Dizel", "Elektrik", "Hibrit", "LPG"];
export const TRANSMISSIONS = ["Manuel", "Otomatik", "Yarı Otomatik"];
// Araç ilanı detay modalı için — sahibinden.com/arabam.com gibi büyük ikinci el araç
// platformlarındaki standart ilan alanlarından uyarlandı (kasa tipi, çekiş, donanım listesi vb.).
export const BODY_TYPES = ["Sedan", "Hatchback/3 Kapı", "Hatchback/5 Kapı", "SUV", "Crossover (SUV)", "Station Wagon", "Coupe", "Cabrio", "Pickup", "Minivan/Panelvan"];
export const DRIVETRAIN_OPTIONS = ["Önden Çekiş", "Arkadan İtiş", "4x4 (AWD)"];
export const DOOR_COUNT_OPTIONS = [2, 3, 4, 5];
export const SEAT_COUNT_OPTIONS = [2, 4, 5, 6, 7, 8, 9];
// Almanya (mobile.de/AutoScout24) ilanlarındaki emisyon/Euro normu sınıflandırması — çevre ve
// vergi bilgisi olarak ilan detayında gösterilir.
export const EMISSION_CLASS_OPTIONS = ["Euro 3", "Euro 4", "Euro 5", "Euro 6", "Euro 6d"];
export const LISTING_FEATURE_OPTIONS = [
  "Klima", "Deri Döşeme", "Elektrikli Cam", "Elektrikli Ayna", "Isıtmalı Koltuk", "Sunroof/Cam Tavan",
  "Geri Görüş Kamerası", "Park Sensörü (Ön)", "Park Sensörü (Arka)", "Xenon/LED Far", "Yağmur Sensörü",
  "Far Sensörü", "Hız Sabitleyici (Cruise Control)", "Bluetooth", "Navigasyon", "Alaşım Jant",
  "ABS", "ESP", "Yokuş Kalkış Desteği", "Şerit Takip Asistanı",
];
// AutoScout24'ün ilan detayındaki "Ausstattung" bölümü donanımları düz bir liste olarak DEĞİL,
// başlıklar altında gruplayarak gösteriyor (Komfort / Unterhaltung / Sicherheit / Extras) — 30+
// donanımı tek bir yığın hâlinde okumak imkânsız olduğu için. Aynı gruplamayı biz de kullanıyoruz.
// Buradaki listelerde OLMAYAN donanımlar (kullanıcının serbest metinle eklediği özel donanımlar
// dahil) otomatik olarak "Diğer" grubuna düşer — bkz. ListingDetailPage groupedFeatures.
export const LISTING_FEATURE_GROUPS = [
  { key: "comfort", features: ["Klima", "Deri Döşeme", "Elektrikli Cam", "Elektrikli Ayna", "Isıtmalı Koltuk", "Sunroof/Cam Tavan", "Yağmur Sensörü", "Far Sensörü", "Hız Sabitleyici (Cruise Control)"] },
  { key: "safety", features: ["ABS", "ESP", "Yokuş Kalkış Desteği", "Şerit Takip Asistanı", "Park Sensörü (Ön)", "Park Sensörü (Arka)", "Geri Görüş Kamerası", "Xenon/LED Far"] },
  { key: "media", features: ["Bluetooth", "Navigasyon"] },
  { key: "extras", features: ["Alaşım Jant"] },
];

export const EMPLOYMENT_TYPES = ["Tam Zamanlı", "Yarı Zamanlı", "Stajyer/Çırak", "Sözleşmeli"];
export const EXPERIENCE_LEVELS = ["Deneyim Aranmıyor", "1-3 Yıl", "3-5 Yıl", "5+ Yıl"];

// GERÇEK HATA DÜZELTMESİ: aşağıdaki 6 sabit liste (yakıt tipi, vites, kasa tipi, çekiş, çalışma
// şekli, deneyim seviyesi) dil seçeneğinden bağımsız hep ham Türkçe değer olarak gösteriliyordu.
// APPT_STATUS_LABELS_BY_LANG ile AYNI desen: bu haritalar SADECE ekranda gösterilecek metni
// çevirir (bkz. helpers.ts vocabLabel) — ham değer (filtre/karşılaştırma/<select> value'su) hep
// orijinal Türkçe string olarak kalır, DEĞİŞTİRİLMEZ. Kullanıcının serbest metinle eklediği özel
// (custom) değerler bu haritalarda yoktur ve olduğu gibi gösterilir (kasıtlı — çevirisi yok).
// NOT: EMISSION_CLASS_OPTIONS ("Euro 3"–"Euro 6d") kasıtlı olarak burada YOK — AB genelinde
// standart, üç dilde de aynı terminoloji, çeviriye gerek yok.
export const FUEL_TYPE_LABELS_BY_LANG = {
  tr: { "Benzin": "Benzin", "Dizel": "Dizel", "Elektrik": "Elektrik", "Hibrit": "Hibrit", "LPG": "LPG" },
  en: { "Benzin": "Petrol", "Dizel": "Diesel", "Elektrik": "Electric", "Hibrit": "Hybrid", "LPG": "LPG" },
  de: { "Benzin": "Benzin", "Dizel": "Diesel", "Elektrik": "Elektro", "Hibrit": "Hybrid", "LPG": "LPG" },
};
export const TRANSMISSION_LABELS_BY_LANG = {
  tr: { "Manuel": "Manuel", "Otomatik": "Otomatik", "Yarı Otomatik": "Yarı Otomatik" },
  en: { "Manuel": "Manual", "Otomatik": "Automatic", "Yarı Otomatik": "Semi-automatic" },
  de: { "Manuel": "Manuell", "Otomatik": "Automatik", "Yarı Otomatik": "Halbautomatik" },
};
export const BODY_TYPE_LABELS_BY_LANG = {
  tr: { "Sedan": "Sedan", "Hatchback/3 Kapı": "Hatchback/3 Kapı", "Hatchback/5 Kapı": "Hatchback/5 Kapı", "SUV": "SUV", "Crossover (SUV)": "Crossover (SUV)", "Station Wagon": "Station Wagon", "Coupe": "Coupe", "Cabrio": "Cabrio", "Pickup": "Pickup", "Minivan/Panelvan": "Minivan/Panelvan" },
  en: { "Sedan": "Sedan", "Hatchback/3 Kapı": "Hatchback/3-door", "Hatchback/5 Kapı": "Hatchback/5-door", "SUV": "SUV", "Crossover (SUV)": "Crossover (SUV)", "Station Wagon": "Station Wagon", "Coupe": "Coupe", "Cabrio": "Convertible", "Pickup": "Pickup", "Minivan/Panelvan": "Minivan/Van" },
  de: { "Sedan": "Limousine", "Hatchback/3 Kapı": "Kleinwagen/3-Türer", "Hatchback/5 Kapı": "Kleinwagen/5-Türer", "SUV": "SUV", "Crossover (SUV)": "Crossover (SUV)", "Station Wagon": "Kombi", "Coupe": "Coupé", "Cabrio": "Cabrio", "Pickup": "Pickup", "Minivan/Panelvan": "Van/Kleinbus" },
};
export const DRIVETRAIN_LABELS_BY_LANG = {
  tr: { "Önden Çekiş": "Önden Çekiş", "Arkadan İtiş": "Arkadan İtiş", "4x4 (AWD)": "4x4 (AWD)" },
  en: { "Önden Çekiş": "Front-wheel drive", "Arkadan İtiş": "Rear-wheel drive", "4x4 (AWD)": "4x4 (AWD)" },
  de: { "Önden Çekiş": "Frontantrieb", "Arkadan İtiş": "Heckantrieb", "4x4 (AWD)": "4x4 (Allrad)" },
};
export const EMPLOYMENT_TYPE_LABELS_BY_LANG = {
  tr: { "Tam Zamanlı": "Tam Zamanlı", "Yarı Zamanlı": "Yarı Zamanlı", "Stajyer/Çırak": "Stajyer/Çırak", "Sözleşmeli": "Sözleşmeli" },
  en: { "Tam Zamanlı": "Full-time", "Yarı Zamanlı": "Part-time", "Stajyer/Çırak": "Intern/Apprentice", "Sözleşmeli": "Contract" },
  de: { "Tam Zamanlı": "Vollzeit", "Yarı Zamanlı": "Teilzeit", "Stajyer/Çırak": "Praktikant/Azubi", "Sözleşmeli": "Vertragsbasis" },
};
export const EXPERIENCE_LEVEL_LABELS_BY_LANG = {
  tr: { "Deneyim Aranmıyor": "Deneyim Aranmıyor", "1-3 Yıl": "1-3 Yıl", "3-5 Yıl": "3-5 Yıl", "5+ Yıl": "5+ Yıl" },
  en: { "Deneyim Aranmıyor": "No experience required", "1-3 Yıl": "1-3 years", "3-5 Yıl": "3-5 years", "5+ Yıl": "5+ years" },
  de: { "Deneyim Aranmıyor": "Keine Erfahrung nötig", "1-3 Yıl": "1-3 Jahre", "3-5 Yıl": "3-5 Jahre", "5+ Yıl": "5+ Jahre" },
};

export const EMPTY_JOB_FORM = { title: "", employmentType: "Tam Zamanlı", experienceLevel: "Deneyim Aranmıyor", location: "", salaryMin: "", salaryMax: "", description: "", requirements: "", skills: "", _editingId: null };
export const DEFAULT_HOURS = { mon: { open: true, start: "09:00", end: "18:00", closedSlots: [], extraSlots: [] }, tue: { open: true, start: "09:00", end: "18:00", closedSlots: [], extraSlots: [] }, wed: { open: true, start: "09:00", end: "18:00", closedSlots: [], extraSlots: [] }, thu: { open: true, start: "09:00", end: "18:00", closedSlots: [], extraSlots: [] }, fri: { open: true, start: "09:00", end: "18:00", closedSlots: [], extraSlots: [] }, sat: { open: true, start: "09:00", end: "14:00", closedSlots: [], extraSlots: [] }, sun: { open: false, start: "09:00", end: "18:00", closedSlots: [], extraSlots: [] } };
export const PRICE_LEVEL_BREAKS = [260, 320, 390, 460];
// Filtre modalındaki ucuz/orta/pahalı sekmeleri PRICE_LEVEL_BREAKS'ten türetilir, böylece bir
// tamirciğin kart üzerindeki € nokta seviyesi (bkz. PriceLevelDots) filtredeki fiyat etiketiyle
// çelişmez: ucuz = 1-2 nokta, orta = 3 nokta, pahalı = 4-5 nokta.
export const PRICE_TIER_BREAKS = [PRICE_LEVEL_BREAKS[1], PRICE_LEVEL_BREAKS[2]];

// Tamirci "Analiz" sekmesindeki zaman aralığı filtresi (bkz. AppShell.tsx mechTab === "analytics").
// `days: null` olan "all" seçeneği filtre uygulanmadığı (tüm zamanlar) anlamına gelir.
export const ANALYTICS_RANGES = [
  { key: "24h", days: 1 },
  { key: "week", days: 7 },
  { key: "month", days: 30 },
  { key: "6m", days: 182 },
  { key: "all", days: null },
];

// GERÇEK OTURUM SİSTEMİ: bu ikisi eskiden sabit demo id'lerdi (mechanic=1, owner=9001) — "aktif
// kullanıcı" her zaman bu id'lere hardcode edilmişti (gerçek bir giriş sistemi yoktu). Artık gerçek
// bir giriş sistemi olduğu için (bkz. backend/routes/auth.js, AppLogicProvider.tsx submitLogin/
// submitOtp) bunlar `let` ile dışa aktarılan CANLI bağlamalar: null olarak başlıyor (henüz giriş
// yapılmamış), başarılı girişte setMyOwnerId/setMyMechanicId ile güncelleniyor. Bu dosyayı
// `import { MY_OWNER_ID } from "./constants"` ile kullanan HER yer (AppLogicProvider, AppShell,
// MechDetailBody...) ES module canlı bağlama sayesinde değişikliği otomatik görür — 90'dan fazla
// kullanım sitesini tek tek değiştirmeye gerek kalmadı. Kritik not: React bunu OTOMATİK yeniden
// render ETMEZ (düz bir modül değişkeni, state değil) — ama giriş akışı zaten hemen ardından gerçek
// React state günceller (ör. setScreen, veri yeniden çekme), bu da bir render tetikleyip yeni
// değerin her yerde görünmesini sağlıyor.
export let MY_MECHANIC_ID: number | null = null;
export let MY_OWNER_ID: number | null = null;
export function setMyMechanicId(id: number | null) { MY_MECHANIC_ID = id; }
export function setMyOwnerId(id: number | null) { MY_OWNER_ID = id; }

// Randevunun autoAccepted bayrağına göre iki ayrı adım seti var (bkz. Uber-style status stepper).
export const TRACK_STATUSES_MANUAL = ["Onay Bekliyor", "Sırada", "Tamire Alındı", "Tamir Tamamlandı"];
export const TRACK_LABELS_MANUAL = ["Onay Bekliyor", "Kabul Edildi", "Serviste", "Tamamlandı"];
export const TRACK_STATUSES_AUTO = ["Sırada", "Tamire Alındı", "Tamir Tamamlandı"];
export const TRACK_LABELS_AUTO = ["Kabul Edildi", "Serviste", "Tamamlandı"];
// GERÇEK HATA DÜZELTMESİ: StatusTracker'daki adım etiketleri (yukarıdaki TRACK_LABELS_*) dil
// seçeneğinden bağımsız hep Türkçe gösteriliyordu. TRACK_STATUSES_* dizileri appointment.status
// karşılaştırmalarında (indexOf) kullanılan iç anahtarlar olduğu için DEĞİŞTİRİLEMEZ — sadece
// GÖSTERİLEN etiketleri dile göre değiştiriyoruz (bkz. StatusTracker.tsx).
export const TRACK_LABELS_MANUAL_BY_LANG = {
  tr: TRACK_LABELS_MANUAL,
  en: ["Awaiting Approval", "Accepted", "In Service", "Completed"],
  de: ["Warten auf Bestätigung", "Angenommen", "In Wartung", "Abgeschlossen"],
};
export const TRACK_LABELS_AUTO_BY_LANG = {
  tr: TRACK_LABELS_AUTO,
  en: ["Accepted", "In Service", "Completed"],
  de: ["Angenommen", "In Wartung", "Abgeschlossen"],
};
// GERÇEK HATA DÜZELTMESİ: appointment.status alanı iş mantığında (karşılaştırmalar, backend'e
// yazma) kullanılan ham bir Türkçe string ("Tamir Tamamlandı" vb.) — bu değer AppointmentCard'da
// doğrudan {a.status} olarak, HİÇ çevrilmeden ekrana basılıyordu, dil İngilizce/Almanca seçilse
// bile randevu rozeti hep Türkçe kalıyordu. Buradaki harita SADECE GÖSTERİM amaçlı — durum
// karşılaştırmalarında hâlâ orijinal Türkçe değerler kullanılıyor, sadece ekrana yazılan metin
// aktif dile göre değişiyor (bkz. helpers.ts apptStatusLabel, AppointmentCard.tsx).
export const APPT_STATUS_LABELS_BY_LANG = {
  tr: { "Onay Bekliyor": "Onay Bekliyor", "Sırada": "Sırada", "Tamire Alındı": "Tamire Alındı", "Tamir Tamamlandı": "Tamir Tamamlandı", "İptal Edildi": "İptal Edildi", "Reddedildi": "Reddedildi", "Gelmedi": "Gelmedi" },
  en: { "Onay Bekliyor": "Awaiting Approval", "Sırada": "Queued", "Tamire Alındı": "In Repair", "Tamir Tamamlandı": "Completed", "İptal Edildi": "Cancelled", "Reddedildi": "Rejected", "Gelmedi": "No-show" },
  de: { "Onay Bekliyor": "Warten auf Bestätigung", "Sırada": "In der Warteschlange", "Tamire Alındı": "In Reparatur", "Tamir Tamamlandı": "Abgeschlossen", "İptal Edildi": "Storniert", "Reddedildi": "Abgelehnt", "Gelmedi": "Nicht erschienen" },
};

export const TODAY = new Date(2026, 7, 15);
export const TODAY_STR = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, "0")}-${String(TODAY.getDate()).padStart(2, "0")}`;

export const FIXED_PRICE_KEYWORDS = ["yağ değişimi", "lastik değişimi", "lastik", "fren balata", "balata", "fren diski", "akü değişimi", "akü", "filtre değişimi", "filtre", "rot balans", "klima gazı", "klima bakımı", "cam suyu", "muayene", "silecek", "far ampul", "egzoz", "periyodik bakım", "genel bakım", "şarj kontrolü"];
export const VARIABLE_PRICE_KEYWORDS = ["arıza tespit", "arıza", "kaporta", "boya", "revizyon", "şanzıman", "elektrik", "motor kontrolü", "çarpma", "hasar"];

// ATU'nun (Almanya'nın en büyük oto servis zinciri) web sitesinde ve fiyat araştırmalarında
// sabit fiyatla sunulan başlıca hizmetler baz alınarak oluşturulmuş standart hizmet kataloğu.
// ---------------------------------------------------------------------------------------------
// HİZMET KATALOĞU
// ---------------------------------------------------------------------------------------------
// Kaynak/örnek: ATU (atu.de) "Werkstattservices" sayfasındaki hizmet ağacı — Almanya'nın en büyük
// zincir servislerinden biri. ATU'nun akışı şu: önce ARAÇ MARKASI + model + yıl seçiliyor, SONRA o
// hizmetin fiyatı gösteriliyor. Yani fiyat markaya göre değişiyor; bu katalog ve altındaki
// `brandPrices` alanı (bkz. types/domain.ts → Service) tam olarak bu modeli izliyor.
//
// Tamirci serbest metin yazmak yerine bu listeden çoklu seçim yapıyor. Bunun üç faydası var:
//   1) Arama/filtreleme gerçekten çalışıyor ("fren balata" yazan da "Balata Değişimi" bulabiliyor),
//   2) hizmet adları üç dilde tutarlı görünüyor (tamirci Türkçe seçiyor, Alman müşteri Almanca
//      görüyor — serbest metinle bu imkânsızdı),
//   3) müşteri farklı tamircileri gerçekten karşılaştırabiliyor (aynı hizmetin aynı adı).
// Katalogda olmayan bir iş için serbest metin ekleme yolu hâlâ açık (key'i olmayan hizmet).
export const SERVICE_CATALOG = [
  {
    key: "maintenance", icon: "wrench",
    tr: "Bakım & Servis", en: "Maintenance & Service", de: "Wartung & Service",
    items: [
      { key: "periodic_service", tr: "Periyodik Bakım", en: "Periodic Service", de: "Inspektion" },
      { key: "oil_change", tr: "Yağ Değişimi", en: "Oil Change", de: "Ölwechsel" },
      { key: "oil_filter", tr: "Yağ Filtresi Değişimi", en: "Oil Filter Replacement", de: "Ölfilterwechsel" },
      { key: "air_filter", tr: "Hava Filtresi Değişimi", en: "Air Filter Replacement", de: "Luftfilterwechsel" },
      { key: "cabin_filter", tr: "Polen Filtresi Değişimi", en: "Cabin Filter Replacement", de: "Innenraumfilterwechsel" },
      { key: "fuel_filter", tr: "Yakıt Filtresi Değişimi", en: "Fuel Filter Replacement", de: "Kraftstofffilterwechsel" },
      { key: "spark_plugs", tr: "Buji Değişimi", en: "Spark Plug Replacement", de: "Zündkerzenwechsel" },
      { key: "timing_belt", tr: "Triger Kayışı Değişimi", en: "Timing Belt Replacement", de: "Zahnriemenwechsel" },
      { key: "vbelt", tr: "V Kayışı Değişimi", en: "Drive Belt Replacement", de: "Keilriemenwechsel" },
      { key: "coolant", tr: "Antifriz / Soğutma Suyu", en: "Coolant Top-up", de: "Kühlmittel nachfüllen" },
      { key: "wipers", tr: "Silecek Değişimi", en: "Wiper Blade Replacement", de: "Scheibenwischerwechsel" },
    ],
  },
  {
    key: "brakes", icon: "disc",
    tr: "Fren Sistemi", en: "Brake System", de: "Bremsanlage",
    items: [
      { key: "brake_pads", tr: "Fren Balata Değişimi", en: "Brake Pad Replacement", de: "Bremsbeläge wechseln" },
      { key: "brake_discs", tr: "Fren Diski Değişimi", en: "Brake Disc Replacement", de: "Bremsscheiben wechseln" },
      { key: "brake_fluid", tr: "Fren Hidroliği Değişimi", en: "Brake Fluid Change", de: "Bremsflüssigkeitswechsel" },
      { key: "brake_check", tr: "Fren Kontrolü", en: "Brake Check", de: "Bremsen-Check" },
      { key: "handbrake", tr: "El Freni Ayarı", en: "Handbrake Adjustment", de: "Handbremse einstellen" },
      { key: "abs_repair", tr: "ABS Arıza Onarımı", en: "ABS Fault Repair", de: "ABS-Reparatur" },
    ],
  },
  {
    key: "tires", icon: "circle",
    tr: "Lastik & Jant", en: "Tires & Wheels", de: "Reifen & Felgen",
    items: [
      { key: "tire_change", tr: "Lastik Değişimi", en: "Tire Change", de: "Reifenwechsel" },
      { key: "tire_mounting", tr: "Lastik Montajı", en: "Tire Mounting", de: "Reifenmontage" },
      { key: "wheel_balance", tr: "Balans Ayarı", en: "Wheel Balancing", de: "Auswuchten" },
      { key: "wheel_alignment", tr: "Rot Balans / Aks Ayarı", en: "Wheel Alignment", de: "Achsvermessung" },
      { key: "tire_repair", tr: "Lastik Tamiri", en: "Tire Repair", de: "Reifenreparatur" },
      { key: "tire_storage", tr: "Lastik Oteli (Saklama)", en: "Tire Storage", de: "Reifeneinlagerung" },
      { key: "rim_repair", tr: "Jant Onarımı", en: "Rim Refurbishment", de: "Felgenaufbereitung" },
      { key: "tpms", tr: "Lastik Basınç Sensörü (TPMS)", en: "TPMS Service", de: "Reifendrucksensor (RDKS)" },
    ],
  },
  {
    key: "engine", icon: "cog",
    tr: "Motor & Şanzıman", en: "Engine & Transmission", de: "Motor & Getriebe",
    items: [
      { key: "engine_diag", tr: "Motor Arıza Tespiti", en: "Engine Diagnostics", de: "Motordiagnose" },
      { key: "engine_repair", tr: "Motor Onarımı", en: "Engine Repair", de: "Motorreparatur" },
      { key: "clutch", tr: "Debriyaj Değişimi", en: "Clutch Replacement", de: "Kupplungswechsel" },
      { key: "gearbox", tr: "Şanzıman Bakımı / Onarımı", en: "Gearbox Service / Repair", de: "Getriebeservice" },
      { key: "gearbox_oil", tr: "Şanzıman Yağı Değişimi", en: "Transmission Oil Change", de: "Getriebeölwechsel" },
      { key: "starter", tr: "Marş Motoru Değişimi", en: "Starter Motor Replacement", de: "Anlasser wechseln" },
      { key: "alternator", tr: "Alternatör (Şarj Dinamosu)", en: "Alternator Replacement", de: "Lichtmaschine wechseln" },
      { key: "turbo", tr: "Turbo Onarımı", en: "Turbocharger Repair", de: "Turbolader-Reparatur" },
      { key: "carbon_clean", tr: "Hidrojenle Motor Temizliği", en: "Engine Carbon Cleaning", de: "Carbon Cleaning" },
      { key: "water_pump", tr: "Devirdaim (Su Pompası)", en: "Water Pump Replacement", de: "Wasserpumpe wechseln" },
    ],
  },
  {
    key: "suspension", icon: "activity",
    tr: "Süspansiyon & Direksiyon", en: "Suspension & Steering", de: "Fahrwerk & Lenkung",
    items: [
      { key: "shock_absorbers", tr: "Amortisör Değişimi", en: "Shock Absorber Replacement", de: "Stoßdämpfer wechseln" },
      { key: "springs", tr: "Helezon Yay Değişimi", en: "Spring Replacement", de: "Federn wechseln" },
      { key: "control_arm", tr: "Salıncak / Rotil Değişimi", en: "Control Arm / Ball Joint", de: "Querlenker / Traggelenk" },
      { key: "steering_rack", tr: "Direksiyon Kutusu Onarımı", en: "Steering Rack Repair", de: "Lenkgetriebe-Reparatur" },
      { key: "cv_joint", tr: "Aks / Körük Değişimi", en: "CV Joint / Boot Replacement", de: "Antriebswelle / Manschette" },
      { key: "suspension_check", tr: "Süspansiyon Kontrolü", en: "Suspension Check", de: "Fahrwerks-Check" },
    ],
  },
  {
    key: "electrics", icon: "zap",
    tr: "Elektrik & Elektronik", en: "Electrics & Electronics", de: "Elektrik & Elektronik",
    items: [
      { key: "battery", tr: "Akü Değişimi", en: "Battery Replacement", de: "Batteriewechsel" },
      { key: "battery_test", tr: "Akü & Şarj Testi", en: "Battery & Charging Test", de: "Batterie- und Ladetest" },
      { key: "error_memory", tr: "Arıza Kodu Okuma / Silme", en: "Fault Code Read / Reset", de: "Fehlerspeicher auslesen" },
      { key: "lighting", tr: "Far & Ampul Değişimi", en: "Lighting & Bulb Replacement", de: "Beleuchtung & Leuchtmittel" },
      { key: "led_retrofit", tr: "LED Dönüşümü", en: "LED Retrofit", de: "LED Umrüstung" },
      { key: "headlight_align", tr: "Far Ayarı", en: "Headlight Alignment", de: "Scheinwerfer einstellen" },
      { key: "adas", tr: "Sürüş Asistanı Kalibrasyonu", en: "Driver Assistance Calibration", de: "Fahrassistenzsysteme kalibrieren" },
      { key: "car_audio", tr: "Multimedya / Ses Sistemi", en: "Multimedia / Audio System", de: "Multimedia / Audio" },
      { key: "parking_sensor", tr: "Park Sensörü / Kamera", en: "Parking Sensor / Camera", de: "Einparkhilfe / Kamera" },
    ],
  },
  {
    key: "climate", icon: "wind",
    tr: "Klima & Isıtma", en: "Climate & Heating", de: "Klima & Heizung",
    items: [
      { key: "ac_service", tr: "Klima Bakımı", en: "A/C Service", de: "Klimaanlagen-Service" },
      { key: "ac_gas", tr: "Klima Gazı Dolumu", en: "A/C Refrigerant Refill", de: "Klimaanlage befüllen" },
      { key: "ac_disinfect", tr: "Klima Dezenfeksiyonu", en: "A/C Disinfection", de: "Klimaanlagen-Desinfektion" },
      { key: "ac_repair", tr: "Klima Onarımı", en: "A/C Repair", de: "Klimaanlagen-Reparatur" },
      { key: "heater_repair", tr: "Kalorifer Onarımı", en: "Heater Repair", de: "Heizungsreparatur" },
    ],
  },
  {
    key: "exhaust", icon: "cloud",
    tr: "Egzoz & Emisyon", en: "Exhaust & Emissions", de: "Abgas & Emissionen",
    items: [
      { key: "exhaust", tr: "Egzoz Değişimi / Onarımı", en: "Exhaust Replacement / Repair", de: "Auspuff wechseln / reparieren" },
      { key: "dpf_clean", tr: "Partikül Filtresi (DPF) Temizliği", en: "Diesel Particulate Filter Cleaning", de: "Dieselpartikelfilter-Reinigung" },
      { key: "catalyst", tr: "Katalizör Değişimi", en: "Catalytic Converter Replacement", de: "Katalysator wechseln" },
      { key: "adblue", tr: "AdBlue Dolumu", en: "AdBlue Refill", de: "AdBlue Betankung" },
      { key: "emission_test", tr: "Egzoz Emisyon Ölçümü", en: "Emissions Test", de: "Abgasuntersuchung (AU)" },
    ],
  },
  {
    key: "body", icon: "car",
    tr: "Kaporta, Boya & Cam", en: "Body, Paint & Glass", de: "Karosserie, Lack & Glas",
    items: [
      { key: "body_repair", tr: "Kaporta Onarımı", en: "Body Repair", de: "Karosseriereparatur" },
      { key: "paint", tr: "Boya", en: "Paint Work", de: "Lackierung" },
      { key: "smart_repair", tr: "Lokal Onarım (Smart Repair)", en: "Smart Repair", de: "Smart Repair" },
      { key: "dent_removal", tr: "Boyasız Göçük Düzeltme", en: "Paintless Dent Removal", de: "Dellenentfernung" },
      { key: "accident_repair", tr: "Kaza Hasar Onarımı", en: "Accident Damage Repair", de: "Unfallschadenreparatur" },
      { key: "windshield", tr: "Ön Cam Değişimi", en: "Windshield Replacement", de: "Windschutzscheibe wechseln" },
      { key: "glass_repair", tr: "Cam Çatlak Onarımı", en: "Glass Chip Repair", de: "Steinschlagreparatur" },
      { key: "towbar", tr: "Çeki Demiri Montajı", en: "Towbar Fitting", de: "Anhängerkupplung montieren" },
      { key: "roof_rack", tr: "Port Bagaj / Tavan Kutusu Montajı", en: "Roof Rack / Box Fitting", de: "Dachträger / Dachbox montieren" },
    ],
  },
  {
    key: "inspection", icon: "clipboard",
    tr: "Muayene & Kontroller", en: "Inspection & Checks", de: "Prüfung & Checks",
    items: [
      { key: "pre_inspection", tr: "Muayene Öncesi Kontrol", en: "Pre-Inspection Check", de: "HU-Vorabcheck" },
      { key: "official_inspection", tr: "Araç Muayenesi (TÜVTÜRK)", en: "Official Vehicle Inspection", de: "Hauptuntersuchung (HU)" },
      { key: "expertise", tr: "Ekspertiz Raporu", en: "Vehicle Expertise Report", de: "Fahrzeug-Gutachten" },
      { key: "mobility_check", tr: "Yolculuk Öncesi Kontrol", en: "Pre-Trip Mobility Check", de: "Mobilitäts-Check" },
      { key: "fleet_check", tr: "Filo Aracı Kontrolü (UVV)", en: "Fleet Vehicle Check (UVV)", de: "Flottencheck (UVV / DGUV)" },
    ],
  },
  {
    key: "ev", icon: "battery",
    tr: "Elektrikli & Hibrit Araçlar", en: "Electric & Hybrid Vehicles", de: "E-Mobilität & Hybrid",
    items: [
      { key: "ev_service", tr: "Elektrikli Araç Bakımı", en: "EV Service", de: "E-Fahrzeug-Service" },
      { key: "hv_battery_check", tr: "Yüksek Voltaj Batarya Testi", en: "HV Battery Health Check", de: "HV-Batterie-Check" },
      { key: "charge_port", tr: "Şarj Soketi Onarımı", en: "Charging Port Repair", de: "Ladeanschluss-Reparatur" },
      { key: "wallbox", tr: "Duvar Tipi Şarj Ünitesi Montajı", en: "Wallbox Installation", de: "Wallbox-Installation" },
      { key: "hybrid_service", tr: "Hibrit Sistem Bakımı", en: "Hybrid System Service", de: "Hybrid-Service" },
    ],
  },
  {
    key: "care", icon: "sparkles",
    tr: "Bakım & Temizlik", en: "Care & Detailing", de: "Pflege & Aufbereitung",
    items: [
      { key: "detailing", tr: "İç & Dış Detaylı Temizlik", en: "Interior & Exterior Detailing", de: "Innen- & Außenaufbereitung" },
      { key: "polish", tr: "Pasta & Cila", en: "Polish & Wax", de: "Politur & Versiegelung" },
      { key: "ceramic", tr: "Seramik Kaplama", en: "Ceramic Coating", de: "Keramikversiegelung" },
      { key: "ppf", tr: "Kaporta Koruma Filmi (PPF)", en: "Paint Protection Film", de: "Lackschutzfolie" },
      { key: "window_tint", tr: "Cam Filmi", en: "Window Tinting", de: "Scheibentönung" },
    ],
  },
];

// Katalogdaki tüm hizmetler tek düz listede — arama ve key→isim çözümü için.
export const SERVICE_CATALOG_FLAT = SERVICE_CATALOG.flatMap((cat) =>
  cat.items.map((it) => ({ ...it, categoryKey: cat.key, categoryTr: cat.tr, categoryEn: cat.en, categoryDe: cat.de }))
);
export const SERVICE_BY_KEY = Object.fromEntries(SERVICE_CATALOG_FLAT.map((it) => [it.key, it]));

// Randevu ekranındaki "tamircinin listelemediği ama yine de sorulabilecek" sabit fiyatlı hizmetler.
// Eskiden elle yazılmış 14 satırlık ayrı bir listeydi; artık katalogdan türetiliyor ki iki liste
// birbirinden ayrı düşmesin (bkz. bookingServiceOptions).
const COMMON_FIXED_KEYS = {
  oil_change: "350₺", cabin_filter: "250₺", tire_change: "300₺", wheel_alignment: "400₺",
  brake_pads: "700₺", brake_discs: "1200₺", battery: "900₺", ac_gas: "500₺", ac_service: "450₺",
  exhaust: "900₺", periodic_service: "600₺", official_inspection: "300₺", wipers: "150₺", lighting: "150₺",
};
export const ATU_FIXED_CATALOG = Object.entries(COMMON_FIXED_KEYS).map(([key, price]) => ({
  key,
  matchKey: (SERVICE_BY_KEY[key]?.tr || key).toLocaleLowerCase("tr-TR"),
  name: SERVICE_BY_KEY[key]?.tr || key,
  price,
}));

export const DICT_TR_EN = { "merhaba": "hello", "selam": "hi", "teşekkürler": "thank you", "fren sesi geliyor": "there's a brake noise", "ne kadar tutar": "how much will it cost", "tamam": "okay", "evet": "yes", "hayır": "no" };
export const DICT_EN_TR = Object.fromEntries(Object.entries(DICT_TR_EN).map(([k, v]) => [v, k]));

// Ülkeye göre lastik değişimi için "resmi" tarih kuralları (demo amaçlı sadeleştirilmiş).
export const LEGAL_TIRE_RULES = {
  tr: { winterMonthDay: "12-01", summerMonthDay: "04-01", label: "Karayolları Trafik Yönetmeliği" },
  de: { winterMonthDay: "11-01", summerMonthDay: "04-15", label: "Alman Karayolları Trafik Yönetmeliği (StVO §2 Abs. 3a)" },
};
export const DE_CITIES = ["Stuttgart", "Berlin", "München", "Hamburg", "Köln", "Frankfurt", "Dortmund", "Essen"];
export const REMINDER_KIND_LABELS = { inspection: "Araç Muayenesi", maintenance: "Periyodik Bakım", "tire-winter": "Kışlık Lastik", "tire-summer": "Yazlık Lastik", insurance: "Sigorta Yenileme", battery: "Akü ve Cam Suyu Kontrolü" };

// Tamircinin "Hizmet Verdiği Markalar" bölümü (profil) ve ana sayfa marka arama/filtresi için
// standart marka listesi — Türkiye'de yaygın markalar baz alınarak oluşturuldu.
export const CAR_BRANDS = [
  "Volkswagen", "Renault", "Fiat", "Ford", "Opel", "Toyota", "Hyundai", "Peugeot", "Citroën",
  "Skoda", "Seat", "BMW", "Mercedes-Benz", "Audi", "Nissan", "Honda", "Kia", "Dacia", "Mini",
  "Volvo", "Chevrolet", "Mazda", "Suzuki", "Porsche", "Tofaş",
];
export const PAYMENT_METHOD_OPTIONS = ["Nakit", "Kredi/Banka Kartı", "Havale/EFT", "Kapıda Ödeme"];
export const LANG_LABELS = { tr: "Türkçe", en: "English", de: "Deutsch" };

// ==================== GENİŞLETİLMİŞ FİLTRE SEÇENEKLERİ (AutoScout24 / sahibinden.com esinli) ====================
// Araç ilanlarında yalnızca serbest metin bir "city" alanı var (tamircilerin aksine lat/lng YOK).
// AutoScout24'teki "Umkreis" (yarıçap) filtresini araç aramasına da getirebilmek için şehir adını
// koordinata çeviren küçük bir tablo tutuyoruz. Anahtarlar küçük harfe (tr-TR) normalize edilerek
// aranır, bu yüzden "İstanbul"/"istanbul"/"İSTANBUL" hepsi eşleşir.
export const TR_CITY_COORDS = {
  "istanbul": { lat: 41.0082, lng: 28.9784 },
  "ankara": { lat: 39.9334, lng: 32.8597 },
  "izmir": { lat: 38.4237, lng: 27.1428 },
  "bursa": { lat: 40.1826, lng: 29.0665 },
  "antalya": { lat: 36.8969, lng: 30.7133 },
  "konya": { lat: 37.8746, lng: 32.4932 },
  "adana": { lat: 37.0000, lng: 35.3213 },
  "gaziantep": { lat: 37.0662, lng: 37.3833 },
  "mersin": { lat: 36.8121, lng: 34.6415 },
  "kayseri": { lat: 38.7312, lng: 35.4787 },
  "eskişehir": { lat: 39.7767, lng: 30.5206 },
  "diyarbakır": { lat: 37.9144, lng: 40.2306 },
  "samsun": { lat: 41.2867, lng: 36.3300 },
  "denizli": { lat: 37.7765, lng: 29.0864 },
  "şanlıurfa": { lat: 37.1591, lng: 38.7969 },
  "malatya": { lat: 38.3552, lng: 38.3095 },
  "trabzon": { lat: 41.0027, lng: 39.7168 },
  "erzurum": { lat: 39.9000, lng: 41.2700 },
  "van": { lat: 38.4891, lng: 43.4089 },
  "sakarya": { lat: 40.7569, lng: 30.3783 },
  "kocaeli": { lat: 40.8533, lng: 29.8815 },
  "manisa": { lat: 38.6191, lng: 27.4289 },
  "balıkesir": { lat: 39.6484, lng: 27.8826 },
  "aydın": { lat: 37.8560, lng: 27.8416 },
  "muğla": { lat: 37.2153, lng: 28.3636 },
  "tekirdağ": { lat: 40.9833, lng: 27.5167 },
  "hatay": { lat: 36.2025, lng: 36.1606 },
  "elazığ": { lat: 38.6810, lng: 39.2264 },
  "sivas": { lat: 39.7477, lng: 37.0179 },
  "çanakkale": { lat: 40.1553, lng: 26.4142 },
};

// "İlan Tarihi" filtresi (sahibinden.com'daki karşılığı) — değerler GÜN cinsinden, "all" = sınırsız.
export const LISTED_WITHIN_OPTIONS = ["1", "3", "7", "30"];
// AutoScout24'teki "Preisbewertung" karşılığı — listingMarketPriceTier'in döndürdüğü tier değerleri.
export const PRICE_RATING_OPTIONS = ["below", "average"];
// Tamirci filtresi: "en geç kaç dakikada yanıt veriyor" (Mechanic.avgResponseMinutes).
export const RESPONSE_TIME_OPTIONS = [15, 30, 60];
// Tamirci filtresi: minimum yorum sayısı — tek yorumla oluşan 5.0 puanları elemek için.
export const MIN_REVIEW_COUNT_OPTIONS = [5, 20, 50];

export const FREE_QUOTE_MECH_LIMIT = 5;
export const PREMIUM_QUOTE_MECH_LIMIT = 10;

// ==================== KULLANIM ŞARTLARI & GİZLİLİK POLİTİKASI (TASLAK/DEMO) ====================
// Bu içerik bir avukat tarafından hazırlanmamıştır; Fixperto'nun veri modeline göre yazılmış
// geçici bir taslaktır. Uygulama gerçek kullanıcılara açılmadan önce bir hukuk danışmanına
// onaylatılmalıdır.
export const LEGAL_CONTENT = {
  terms: {
    title: "Kullanım Şartları",
    updated: "16 Ağustos 2026",
    sections: [
      { h: "1. Taraflar ve Kabul", b: "Bu Kullanım Şartları (\"Şartlar\"), Fixperto mobil/web uygulamasını (\"Platform\") kullanan Araç Sahibi ve Tamirci kullanıcılar ile Platform işletmecisi arasındaki ilişkiyi düzenler. Platforma üye olarak veya kullanarak bu Şartları kabul etmiş olursunuz. 18 yaşından küçükseniz Platformu kullanamazsınız." },
      { h: "2. Hizmetin Tanımı", b: "Fixperto, araç sahiplerini bağımsız tamirci ve servislerle buluşturan bir aracı platformdur. Randevu oluşturma, teklif isteme/karşılaştırma, mesajlaşma, ikinci el araç ilanı verme ve iş ilanı yayınlama gibi özellikler sunar." },
      { h: "3. Platformun Rolü — Aracılık", b: "Fixperto, tamir/bakım hizmetinin tarafı değildir; sadece araç sahibi ile tamirciyi buluşturur. Verilen hizmetin kalitesi, süresi, fiyatı ve sonucu doğrudan tamirci ile araç sahibi arasındaki ilişkiye aittir. Fixperto, tamircilerin mesleki yeterliliğini garanti etmez, ancak doğrulama (rozet) sürecinden geçen hesapları buna göre işaretler." },
      { h: "4. Hesap Oluşturma ve Sorumluluk", b: "Kayıt sırasında verdiğiniz bilgilerin doğru, güncel ve size ait olduğunu kabul edersiniz. Hesap bilgilerinizin (şifre dahil) gizliliğinden ve hesabınız üzerinden yapılan tüm işlemlerden siz sorumlusunuz. Şüpheli bir erişim fark ederseniz derhal bize bildirmelisiniz." },
      { h: "5. Randevu, Teklif ve Ödeme", b: "Randevu talebi, çoklu tamirciden teklif isteme ve teklif kabul akışları Platform üzerinden yürütülür; nihai sözleşme ilişkisi araç sahibi ile seçilen tamirci arasında kurulur. Uygulama içindeki ödeme/kapora adımları bu sürümde demo niteliğindedir; gerçek bir para transferi gerçekleştirilmez ve gerçek kart bilgisi talep edilmez/saklanmaz." },
      { h: "6. Kullanıcı İçerikleri", b: "Yorum, fotoğraf, video, mesaj ve ilan gibi paylaştığınız içeriklerin doğruluğundan ve hukuka uygunluğundan siz sorumlusunuz. Fixperto, kural ihlali (yanıltıcı, hakaret içeren, hukuka aykırı içerik vb.) tespit ettiği içerikleri kaldırma veya ilgili hesabı kısıtlama hakkını saklı tutar." },
      { h: "7. Yasaklı Davranışlar", b: "Platformu; yanıltıcı ilan/teklif vermek, başka bir kullanıcının kimliğine bürünmek, sahte yorum/randevu oluşturmak, Platform dışına yönlendirerek ücret tahsilatı yapmaya çalışmak veya sistemin işleyişine zarar verecek şekilde kullanmak yasaktır." },
      { h: "8. Fikri Mülkiyet", b: "Fixperto adı, logosu, arayüz tasarımı ve yazılımı Platform işletmecisine aittir. Kullanıcı içerikleri hariç, Platformdaki içeriklerin izinsiz kopyalanması, çoğaltılması veya ticari amaçla kullanılması yasaktır." },
      { h: "9. Hesabın Askıya Alınması / Feshi", b: "Bu Şartların ihlali halinde hesabınız uyarılabilir, geçici olarak kısıtlanabilir veya kapatılabilir. Hesabınızı istediğiniz zaman Ayarlar > Tehlikeli Bölge üzerinden kalıcı olarak silebilirsiniz." },
      { h: "10. Sorumluluğun Sınırlandırılması", b: "Fixperto, tamircilerin sunduğu hizmetlerin kalitesinden, kullanıcılar arası anlaşmazlıklardan veya Platform dışında oluşan zararlardan sorumlu tutulamaz. Platform \"olduğu gibi\" sunulur; kesintisiz veya hatasız çalışacağı garanti edilmez." },
      { h: "11. Uyuşmazlık Çözümü ve Uygulanacak Hukuk", b: "Bu Şartlar Türkiye Cumhuriyeti kanunlarına tabidir. Tüketici sıfatıyla yapılan işlemlerde ilgili tutar sınırları dahilinde Tüketici Hakem Heyetleri, üzerinde ise Tüketici Mahkemeleri yetkilidir." },
      { h: "12. Değişiklikler", b: "Bu Şartlar zaman zaman güncellenebilir. Önemli değişiklikler Platform üzerinden bildirilir; güncel Şartlar her zaman bu sayfadan görüntülenebilir." },
      { h: "13. İletişim", b: "Sorularınız için Ayarlar > Yardım & Destek bölümünden bize ulaşabilirsiniz." },
    ],
  },
  privacy: {
    title: "Gizlilik Politikası ve KVKK Aydınlatma Metni",
    updated: "16 Ağustos 2026",
    sections: [
      { h: "1. Veri Sorumlusu", b: "6698 sayılı Kişisel Verilerin Korunması Kanunu (\"KVKK\") kapsamında, Fixperto Platformu üzerinden işlenen kişisel verileriniz bakımından veri sorumlusu Platform işletmecisidir." },
      { h: "2. Toplanan Kişisel Veriler", b: "Ad-soyad, e-posta, telefon, adres gibi kimlik/iletişim bilgileri; araç bilgileri (marka, model, plaka, bakım geçmişi); randevu ve mesaj içerikleri; yüklediğiniz fotoğraf/video ve varsa özgeçmiş (CV); tarafınızca izin verilmesi halinde konum bilginiz; yorum ve puanlama bilgileri; cihaz/log verileri (tarayıcı bildirim izni durumu gibi)." },
      { h: "3. İşleme Amaçları", b: "Hesabınızı oluşturmak ve yönetmek; randevu, teklif isteme ve ilan verme gibi temel Platform işlevlerini sunmak; size en yakın/uygun tamirciyi gösterebilmek; bildirim göndermek (tercihlerinize göre açılıp kapatılabilir); Platform güvenliğini sağlamak, kötüye kullanımı önlemek; yasal yükümlülükleri yerine getirmek." },
      { h: "4. Hukuki Sebep", b: "Kişisel verileriniz KVKK m.5 kapsamında; bir sözleşmenin kurulması/ifası (randevu, ilan), meşru menfaat (güvenlik, kötüye kullanımın önlenmesi) ve açık rızanıza dayalı olarak (konum paylaşımı, tarayıcı bildirimleri gibi isteğe bağlı izinler) işlenir." },
      { h: "5. Konum ve Bildirim İzinleri", b: "Konum paylaşımı ve tarayıcı bildirimleri varsayılan olarak kapalıdır; sadece açık onayınızla etkinleştirilir ve Ayarlar bölümünden istediğiniz zaman kapatılabilir." },
      { h: "6. Verilerin Aktarımı", b: "Randevu/teklif akışında ilgili tamirci ile paylaşmayı seçtiğiniz bilgiler (adınız, aracınız, geçmiş randevu kaydı — açık onayınızla) o tamirciyle paylaşılır. Verileriniz, yasal zorunluluklar dışında üçüncü taraflarla ticari amaçla paylaşılmaz." },
      { h: "7. Saklama Süresi", b: "Kişisel verileriniz, işleme amacının gerektirdiği süre boyunca veya ilgili mevzuatta öngörülen süre boyunca saklanır; hesabınızı sildiğinizde ilişkili veriler makul bir süre içinde silinir veya anonim hale getirilir." },
      { h: "8. Veri Güvenliği", b: "Kişisel verilerinizin hukuka aykırı erişime, kaybına veya ifşasına karşı uygun teknik ve idari tedbirler alınır." },
      { h: "9. İlgili Kişinin Hakları (KVKK m.11)", b: "KVKK m.11 uyarınca; kişisel verinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işlenme amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içi/yurt dışında aktarıldığı üçüncü kişileri bilme, eksik/yanlış işlenmişse düzeltilmesini isteme, silinmesini/yok edilmesini isteme, bu işlemlerin aktarılan üçüncü kişilere bildirilmesini isteme, münhasıran otomatik sistemlerle analiz sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme ve kanuna aykırı işleme nedeniyle zarara uğramanız halinde zararın giderilmesini talep etme haklarına sahipsiniz." },
      { h: "10. Başvuru Yöntemi", b: "Bu haklarınızı kullanmak için Ayarlar > Yardım & Destek bölümünden bize ulaşabilirsiniz." },
      { h: "11. Politika Güncellemeleri", b: "Bu Politika zaman zaman güncellenebilir; güncel sürüm her zaman bu sayfadan görüntülenebilir." },
    ],
  },
};

// ==================== ADMIN (SİTE SAHİBİ) PANELİ ====================
// GÜVENLİK NOTU: Admin kimlik bilgileri artık burada TUTULMUYOR. Eskiden bu dosyada düz metin
// olarak duran ADMIN_CREDENTIALS sabiti, frontend paketine (bundle'a) gömülüyordu — yani herkes
// tarayıcı devtools'tan veya "view-source"tan admin şifresini okuyabilirdi ve giriş kontrolü tamamen
// istemci tarafında yapıldığı için backend hiç doğrulama yapmıyordu (React state'i manuple ederek
// bile atlatılabilirdi). Artık admin girişi gerçek bir backend uç noktasını çağırıyor:
// bkz. services/api/client.ts -> api.admin.login() ve backend/routes/admin.js (kimlik bilgileri
// orada da FIXPERTO_ADMIN_EMAIL / FIXPERTO_ADMIN_PASSWORD ortam değişkenlerinden okunuyor).

export const ADMIN_TICKET_TYPE_LABELS = { payment: "Ödeme / Kapora", listing: "İlan Şikayeti", quality: "Hizmet Kalitesi", verification: "Doğrulama Talebi", no_show: "Randevuya Gelmeme", review: "Yorum Şikayeti", bug: "Teknik Hata", customer: "Müşteri Şikayeti" };
export const ADMIN_TICKET_STATUS_LABELS = { open: "Açık", in_review: "İnceleniyor", resolved: "Çözüldü" };
export const ADMIN_TICKET_PRIORITY_LABELS = { high: "Yüksek", medium: "Orta", low: "Düşük" };
export const ADMIN_TICKET_PRIORITY_WEIGHT = { high: 0, medium: 1, low: 2 };
export const ADMIN_TICKET_TYPE_DEFAULT_PRIORITY = { payment: "high", listing: "high", quality: "medium", verification: "low", no_show: "medium", review: "low", bug: "medium", customer: "medium" };
export const TR_ASCII_MAP = { "ı": "i", "İ": "i", "ğ": "g", "ü": "u", "ş": "s", "ö": "o", "ç": "c" };
export const SHARE_CHANNEL_LABELS = { whatsapp: "WhatsApp", facebook: "Facebook", x: "X", mail: "E-posta", copy: "Link Kopyalama", native: "Native Paylaşım" };
export const PLATFORM_COMMISSION_RATE = 0.08;
export const ADMIN_TREND_DATA = {
  months: ["Mar", "Nis", "May", "Haz", "Tem", "Ağu"],
  signups: [14, 19, 23, 27, 31, 36],
  appointments: [22, 28, 35, 41, 47, 52],
  revenue: [1850, 2340, 2960, 3420, 3890, 4260],
};
export const ADMIN_SLA_DAYS = { high: 2, medium: 4, low: 7 };
