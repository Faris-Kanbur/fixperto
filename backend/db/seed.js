// Seed data ported directly from the original single-file demo's MECHANICS_INITIAL,
// INITIAL_VEHICLES, INITIAL_APPOINTMENTS, INITIAL_LISTINGS, INITIAL_JOB_LISTINGS,
// INITIAL_OWNERS_DIRECTORY and INITIAL_SUPPORT_TICKETS constants, so the backend
// starts up with the exact same demo dataset the frontend used to hardcode.
import { db, isEmpty } from "./db.js";

const MECHANICS = [
  { id: 1, name: "Usta Mehmet Oto Servis", distance: 1.2, price: 350, rating: 4.8, reviews: 124, verified: 1, avgResponseMinutes: 9, specialty: "Genel Bakım, Motor", img: "🔧", lang: "tr", px: 30, py: 40, bannerPreset: "blue", coverPhoto: null, lat: 40.9927, lng: 29.0275, iban: "", bankName: "", accountHolder: "",
    address: "Bağdat Cad. No:45, Kadıköy / İstanbul", hoursText: [],
    services: [{ name: "Yağ Değişimi", price: "350₺", fixed: true }, { name: "Genel Bakım", price: "600₺", fixed: true }, { name: "Motor Kontrolü", price: "450₺", fixed: false }, { name: "Akü Değişimi", price: "900₺", fixed: true }],
    staff: [{ name: "Mehmet Usta", role: "Servis Sorumlusu", emoji: "👨‍🔧" }, { name: "Can Yılmaz", role: "Motor Ustası", emoji: "🧑‍🔧" }, { name: "Deniz Ak", role: "Elektrik Teknisyeni", emoji: "👨‍🔧" }],
    reviewList: [
      { name: "Ahmet K.", avatar: "🧔", rating: 5, comment: "Çok hızlı ve dürüst hizmet, tekrar geleceğim.", photo: true },
      { name: "Elif S.", avatar: "👩", rating: 4, comment: "Fiyat performans olarak gayet iyi.", photo: false },
      { name: "Burak T.", avatar: "👨", rating: 5, comment: "Ustalar çok ilgiliydi, aracımı zamanında teslim ettiler.", photo: true },
    ], verificationDocs: [], brandsServiced: ["Volkswagen", "Renault", "Fiat", "Ford", "Toyota", "Hyundai"], paymentMethods: ["Nakit", "Kredi/Banka Kartı", "Havale/EFT"] },
  { id: 2, name: "Hızlı Tamir Merkezi", distance: 2.5, price: 280, rating: 4.5, reviews: 89, verified: 1, avgResponseMinutes: 14, specialty: "Lastik, Fren", img: "🚗", lang: "tr", px: 55, py: 25, bannerPreset: "orange", coverPhoto: null, lat: 39.9179, lng: 32.8627, iban: "", bankName: "", accountHolder: "",
    address: "Atatürk Bulvarı No:112, Çankaya / Ankara", hoursText: ["Pzt: 09:00-18:00", "Sal: 09:00-18:00", "Çar: 09:00-18:00", "Per: 09:00-18:00", "Cum: 09:00-18:00", "Cmt: 09:00-14:00", "Paz: Kapalı"],
    services: [{ name: "Lastik Değişimi", price: "1200₺", fixed: true }, { name: "Fren Balata", price: "700₺", fixed: true }, { name: "Rot Balans", price: "400₺", fixed: true }],
    staff: [{ name: "Serkan Bey", role: "Servis Şefi", emoji: "👨‍🔧" }, { name: "Onur K.", role: "Lastik Ustası", emoji: "🧑‍🔧" }],
    reviewList: [{ name: "Fatma Y.", avatar: "👩‍🦰", rating: 4, comment: "Lastik değişimi çok hızlı oldu.", photo: false }, { name: "Kerem A.", avatar: "🧑", rating: 5, comment: "Fren sesim tamamen geçti.", photo: true }], verificationDocs: [], brandsServiced: ["Renault", "Fiat", "Ford", "Opel", "Hyundai", "Peugeot"], paymentMethods: ["Nakit", "Kredi/Banka Kartı"] },
  { id: 3, name: "Güven Oto", distance: 0.8, price: 420, rating: 4.9, reviews: 210, verified: 1, avgResponseMinutes: 6, specialty: "Elektrik, Elektronik", img: "⚡", lang: "tr", px: 45, py: 60, bannerPreset: "green", coverPhoto: null, lat: 38.4192, lng: 27.1287, iban: "", bankName: "", accountHolder: "",
    address: "İnönü Cad. No:8, Konak / İzmir", hoursText: ["Pzt: 08:30-19:00", "Sal: 08:30-19:00", "Çar: 08:30-19:00", "Per: 08:30-19:00", "Cum: 08:30-19:00", "Cmt: 09:00-15:00", "Paz: Kapalı"],
    services: [{ name: "Elektrik Arıza Tespiti", price: "500₺", fixed: false }, { name: "Akü/Şarj Kontrolü", price: "300₺", fixed: true }],
    staff: [{ name: "Hakan Usta", role: "Elektrik Mühendisi", emoji: "👨‍🔧" }],
    reviewList: [{ name: "Tolga E.", avatar: "👨‍🦱", rating: 5, comment: "Arızayı dakikalar içinde buldular.", photo: true }], verificationDocs: [], brandsServiced: ["Volkswagen", "BMW", "Mercedes-Benz", "Audi"], paymentMethods: ["Nakit", "Kredi/Banka Kartı", "Havale/EFT"] },
  { id: 4, name: "Anadolu Servis", distance: 3.1, price: 250, rating: 4.2, reviews: 56, verified: 1, avgResponseMinutes: 22, specialty: "Yağ Değişimi, Bakım", img: "🛠️", lang: "tr", px: 70, py: 70, bannerPreset: "blue", coverPhoto: null, lat: 40.1826, lng: 29.0610, iban: "", bankName: "", accountHolder: "",
    address: "Cumhuriyet Mah. No:23, Osmangazi / Bursa", hoursText: ["Pzt: 09:00-18:00", "Sal: 09:00-18:00", "Çar: 09:00-18:00", "Per: 09:00-18:00", "Cum: 09:00-18:00", "Cmt: Kapalı", "Paz: Kapalı"],
    services: [{ name: "Yağ Değişimi", price: "250₺", fixed: true }, { name: "Filtre Değişimi", price: "200₺", fixed: true }],
    staff: [{ name: "İsmail Usta", role: "Servis Sorumlusu", emoji: "👨‍🔧" }],
    reviewList: [{ name: "Nihal K.", avatar: "👩", rating: 4, comment: "Ekonomik ve iş bilir bir servis.", photo: false }, { name: "Kullanıcı8823", avatar: "🙄", rating: 1, comment: "Bu servise hiç gitmedim ama düşük puan bırakıyorum.", photo: false, flagged: true }], verificationDocs: [], brandsServiced: ["Renault", "Fiat", "Dacia", "Tofaş", "Hyundai"], paymentMethods: ["Nakit"] },
  { id: 5, name: "Star Auto Care", distance: 1.9, price: 500, rating: 4.7, reviews: 178, verified: 1, avgResponseMinutes: 11, specialty: "Kaporta, Boya", img: "✨", lang: "en", px: 20, py: 65, bannerPreset: "orange", coverPhoto: null, lat: 41.0390, lng: 28.8560, iban: "", bankName: "", accountHolder: "",
    address: "Bağcılar Sanayi Sitesi No:31, İstanbul", hoursText: ["Mon: 09:00-18:00", "Tue: 09:00-18:00", "Wed: 09:00-18:00", "Thu: 09:00-18:00", "Fri: 09:00-18:00", "Sat: 10:00-14:00", "Sun: Closed"],
    services: [{ name: "Kaporta Onarımı", price: "1500₺", fixed: false }, { name: "Boya İşlemi", price: "2000₺", fixed: false }],
    staff: [{ name: "John Miller", role: "Body Shop Lead", emoji: "👨‍🔧" }],
    reviewList: [{ name: "David R.", avatar: "🧑", rating: 5, comment: "Excellent paint job, looks brand new!", photo: true }], verificationDocs: [], brandsServiced: ["BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Mini"], paymentMethods: ["Kredi/Banka Kartı", "Havale/EFT"] },
  { id: 6, name: "Ekonomik Tamir", distance: 4.2, price: 200, rating: 3.9, reviews: 34, verified: 0, avgResponseMinutes: 40, specialty: "Genel Bakım", img: "🔩", lang: "tr", px: 80, py: 35, bannerPreset: "green", coverPhoto: null, lat: 37.8746, lng: 32.4932, iban: "", bankName: "", accountHolder: "",
    address: "Fevzi Çakmak Mah. No:9, Karatay / Konya", hoursText: ["Pzt: 09:00-17:00", "Sal: 09:00-17:00", "Çar: 09:00-17:00", "Per: 09:00-17:00", "Cum: 09:00-17:00", "Cmt: 09:00-13:00", "Paz: Kapalı"],
    services: [{ name: "Genel Bakım", price: "200₺", fixed: true }, { name: "Yağ Değişimi", price: "220₺", fixed: true }],
    staff: [{ name: "Ramazan Usta", role: "Servis Sorumlusu", emoji: "👨‍🔧" }],
    reviewList: [{ name: "Cem S.", avatar: "👨", rating: 4, comment: "Uygun fiyat, iş de fena değil.", photo: false }], verificationDocs: [], brandsServiced: ["Fiat", "Renault", "Tofaş", "Dacia"], paymentMethods: ["Nakit"] },
  { id: 7, name: "Akdeniz Oto Bakım", distance: 2.7, price: 380, rating: 4.6, reviews: 97, verified: 1, avgResponseMinutes: 13, specialty: "Genel Bakım, Lastik", img: "🌊", lang: "tr", px: 25, py: 80, bannerPreset: "blue", coverPhoto: null, lat: 36.8969, lng: 30.7133, iban: "", bankName: "", accountHolder: "",
    address: "Lara Cad. No:64, Muratpaşa / Antalya", hoursText: ["Pzt: 08:00-19:00", "Sal: 08:00-19:00", "Çar: 08:00-19:00", "Per: 08:00-19:00", "Cum: 08:00-19:00", "Cmt: 09:00-16:00", "Paz: Kapalı"],
    services: [{ name: "Lastik Değişimi", price: "1100₺", fixed: true }, { name: "Genel Bakım", price: "380₺", fixed: true }, { name: "Klima Bakımı", price: "450₺", fixed: true }],
    staff: [{ name: "Yusuf Usta", role: "Servis Sorumlusu", emoji: "👨‍🔧" }, { name: "Barış K.", role: "Lastik Ustası", emoji: "🧑‍🔧" }],
    reviewList: [{ name: "Selin A.", avatar: "👩‍🦱", rating: 5, comment: "Tatilde arıza yaptı, aynı gün hallettiler.", photo: true }, { name: "Murat D.", avatar: "🧔", rating: 4, comment: "Nazik ve hızlı ekip.", photo: false }], verificationDocs: [], brandsServiced: ["Volkswagen", "Renault", "Fiat", "Ford", "Toyota", "Opel"], paymentMethods: ["Nakit", "Kredi/Banka Kartı", "Havale/EFT"] },
  { id: 8, name: "Gaziantep Teknik Servis", distance: 5.4, price: 300, rating: 4.3, reviews: 61, verified: 0, avgResponseMinutes: 35, specialty: "Klima, Egzoz", img: "🌡️", lang: "tr", px: 65, py: 55, bannerPreset: "orange", coverPhoto: null, lat: 37.0662, lng: 37.3833, iban: "", bankName: "", accountHolder: "",
    address: "İncilipınar Mah. No:17, Şahinbey / Gaziantep", hoursText: ["Pzt: 09:00-18:00", "Sal: 09:00-18:00", "Çar: 09:00-18:00", "Per: 09:00-18:00", "Cum: 09:00-18:00", "Cmt: 09:00-14:00", "Paz: Kapalı"],
    services: [{ name: "Klima Gazı Dolumu", price: "500₺", fixed: true }, { name: "Egzoz Onarımı", price: "600₺", fixed: true }],
    staff: [{ name: "Halil Usta", role: "Servis Şefi", emoji: "👨‍🔧" }],
    reviewList: [{ name: "Emre T.", avatar: "👨", rating: 4, comment: "Klima gayet iyi soğutuyor şimdi.", photo: false }], verificationDocs: [], brandsServiced: ["Renault", "Fiat", "Hyundai", "Toyota"], paymentMethods: ["Nakit", "Kredi/Banka Kartı"] },
  { id: 9, name: "Trabzon Karadeniz Oto", distance: 3.6, price: 330, rating: 4.4, reviews: 48, verified: 1, avgResponseMinutes: 18, specialty: "Kaporta, Elektrik", img: "⚙️", lang: "tr", px: 15, py: 15, bannerPreset: "green", coverPhoto: null, lat: 41.0027, lng: 39.7168, iban: "", bankName: "", accountHolder: "",
    address: "Değirmendere Mah. No:52, Ortahisar / Trabzon", hoursText: ["Pzt: 09:00-18:00", "Sal: 09:00-18:00", "Çar: 09:00-18:00", "Per: 09:00-18:00", "Cum: 09:00-18:00", "Cmt: Kapalı", "Paz: Kapalı"],
    services: [{ name: "Kaporta Onarımı", price: "1300₺", fixed: false }, { name: "Elektrik Arıza Tespiti", price: "450₺", fixed: false }],
    staff: [{ name: "Orhan Usta", role: "Kaporta Ustası", emoji: "👨‍🔧" }],
    reviewList: [{ name: "Gökhan B.", avatar: "🧑", rating: 5, comment: "Çarpma izini fark edilmeyecek şekilde düzelttiler.", photo: true }], verificationDocs: [], brandsServiced: ["Renault", "Ford", "Opel", "Volkswagen"], paymentMethods: ["Nakit", "Havale/EFT"] },
  { id: 10, name: "Eskişehir Genç Oto", distance: 1.5, price: 260, rating: 4.1, reviews: 40, verified: 0, avgResponseMinutes: 28, specialty: "Motor, Şanzıman", img: "🧰", lang: "tr", px: 50, py: 20, bannerPreset: "blue", coverPhoto: null, lat: 39.7767, lng: 30.5206, iban: "", bankName: "", accountHolder: "",
    address: "Odunpazarı Mah. No:29, Eskişehir", hoursText: ["Pzt: 09:00-18:00", "Sal: 09:00-18:00", "Çar: 09:00-18:00", "Per: 09:00-18:00", "Cum: 09:00-18:00", "Cmt: 09:00-13:00", "Paz: Kapalı"],
    services: [{ name: "Motor Revizyonu", price: "3500₺", fixed: false }, { name: "Şanzıman Bakımı", price: "1200₺", fixed: false }],
    staff: [{ name: "Kaan Usta", role: "Motor Ustası", emoji: "🧑‍🔧" }],
    reviewList: [{ name: "Pınar E.", avatar: "👩", rating: 4, comment: "Şanzıman sorunu çözüldü, teşekkürler.", photo: false }],
    verificationDocs: [
      { name: "İşletme Ruhsatı.pdf", type: "İşletme Ruhsatı", uploadedDate: "2026-08-12" },
      { name: "Vergi Levhası.pdf", type: "Vergi Levhası", uploadedDate: "2026-08-13" },
      { name: "Usta Belgesi.pdf", type: "Ustalık Belgesi", uploadedDate: "2026-08-13" },
    ], brandsServiced: ["Volkswagen", "Renault", "Fiat", "Ford", "Toyota", "Honda"], paymentMethods: ["Nakit", "Kredi/Banka Kartı", "Havale/EFT", "Kapıda Ödeme"] },
];

const OWNERS = [
  { id: 9001, name: "Ali Yıldız", email: "ali.yildiz@gmail.com", phone: "+90 532 111 22 33", photo: "", address: "", city: "İstanbul", joinDate: "2026-01-14", status: "active", vehicleCount: 2, apptCount: 7, password: "demo1234" },
  { id: 9002, name: "Mehmet Demir", email: "mehmet.demir@gmail.com", phone: "+90 542 222 33 44", photo: "", address: "", city: "Ankara", joinDate: "2026-02-03", status: "active", vehicleCount: 1, apptCount: 3, password: "demo1234" },
  { id: 9003, name: "Zeynep Kaya", email: "zeynep.kaya@gmail.com", phone: "+90 505 333 44 55", photo: "", address: "", city: "İzmir", joinDate: "2026-02-20", status: "active", vehicleCount: 1, apptCount: 5, password: "demo1234" },
  { id: 9004, name: "Emre Şahin", email: "emre.sahin@gmail.com", phone: "+90 533 444 55 66", photo: "", address: "", city: "Bursa", joinDate: "2026-03-11", status: "suspended", vehicleCount: 1, apptCount: 1, password: "demo1234" },
  { id: 9005, name: "Selin Arslan", email: "selin.arslan@gmail.com", phone: "+90 543 555 66 77", photo: "", address: "", city: "Antalya", joinDate: "2026-04-02", status: "active", vehicleCount: 3, apptCount: 12, password: "demo1234" },
  { id: 9006, name: "Burak Öztürk", email: "burak.ozturk@gmail.com", phone: "+90 536 666 77 88", photo: "", address: "", city: "Konya", joinDate: "2026-05-19", status: "active", vehicleCount: 1, apptCount: 2, password: "demo1234" },
];

const VEHICLES = [
  { id: 1, ownerId: 9001, brand: "Renault", model: "Clio", year: 2019, plate: "34 ABC 123", country: "tr", city: "İstanbul", tireType: "mevsimlik", lastInspection: "2024-09-10", lastMaintenance: "2026-02-12", insuranceEnd: "2026-09-05", listingId: null, reminderOverrides: {}, customReminders: [],
    history: [{ date: "12 Mart 2026", type: "Yağ Değişimi", mechanic: "Usta Mehmet Oto Servis", price: "350₺" }, { date: "3 Ocak 2026", type: "Lastik Değişimi", mechanic: "Hızlı Tamir Merkezi", price: "1200₺" }] },
];

const APPOINTMENTS = [
  { id: 101, ownerId: 9001, mechanicId: 1, customer: "Ali Yıldız", mechanicName: "Usta Mehmet Oto Servis", mechanicImg: "🔧", vehicle: "Renault Clio (34 ABC 123)", date: "18 Ağustos", time: "10:30", status: "Tamire Alındı", autoAccepted: 1, issue: "Fren sesi kontrolü", depositPaid: 150 },
  { id: 102, ownerId: 9001, mechanicId: 1, customer: "Zeynep Kaya", mechanicName: "Usta Mehmet Oto Servis", mechanicImg: "🔧", vehicle: "Fiat Egea 2021", date: "16 Ağustos", time: "14:00", status: "Sırada", autoAccepted: 1, issue: "Yağ değişimi ve genel bakım", depositPaid: null },
  { id: 103, ownerId: 9001, mechanicId: 1, customer: "Mehmet Demir", mechanicName: "Usta Mehmet Oto Servis", mechanicImg: "🔧", vehicle: "VW Golf 2018", date: "17 Ağustos", time: "09:00", status: "Tamir Tamamlandı", autoAccepted: 1, issue: "Motor arızası, ses geliyor", depositPaid: null },
];

const LISTINGS = [
  { id: 1, sellerName: "Usta Mehmet Oto Servis", sellerType: "mechanic", brand: "Toyota", model: "Corolla", year: 2017, km: 98000, price: "410.000₺", description: "Bakımlı, hasar kaydı yok, servis geçmişi elimizde.", photo: "🚗", status: "active", px: 35, py: 45, offers: [], messages: [], fuelType: "Benzin", transmission: "Otomatik", power: "132", firstReg: "03.2017", color: "Beyaz", vehicleId: null,
    bodyType: "Sedan", engineSize: "1.6", drivetrain: "Önden Çekiş", ownerCount: 2, paintedParts: 0, changedParts: 0, tradeIn: 0, doorCount: 4, features: ["Klima", "Elektrikli Cam", "Elektrikli Ayna", "ABS", "Bluetooth"], photos: [] },
  { id: 2, sellerName: "Ali Yıldız", sellerType: "owner", brand: "Renault", model: "Clio", year: 2019, km: 62000, price: "365.000₺", description: "Tek elden, düzenli bakımlı, değişensiz.", photo: "🚙", status: "reserved", px: 60, py: 30, offers: [], messages: [], fuelType: "Dizel", transmission: "Manuel", power: "90", firstReg: "07.2019", color: "Gri", vehicleId: null,
    bodyType: "Hatchback/5 Kapı", engineSize: "1.5 dCi", drivetrain: "Önden Çekiş", ownerCount: 1, paintedParts: 0, changedParts: 0, tradeIn: 1, doorCount: 5, features: ["Klima", "Elektrikli Cam", "Hız Sabitleyici (Cruise Control)", "Bluetooth"], photos: [] },
  { id: 3, sellerName: "Zeynep Kaya", sellerType: "owner", brand: "BMW", model: "3.20i", year: 2020, km: 45000, price: "720.000₺", description: "Full bakımlı, boyasız, ilk sahibinden.", photo: "🚘", status: "active", px: 48, py: 60, offers: [], messages: [], fuelType: "Benzin", transmission: "Otomatik", power: "184", firstReg: "05.2020", color: "Siyah", vehicleId: null,
    bodyType: "Sedan", engineSize: "2.0", drivetrain: "Arkadan İtiş", ownerCount: 1, paintedParts: 0, changedParts: 0, tradeIn: 0, doorCount: 4, features: ["Deri Döşeme", "Sunroof/Cam Tavan", "Geri Görüş Kamerası", "Park Sensörü (Ön)", "Park Sensörü (Arka)", "Xenon/LED Far", "Navigasyon", "Alaşım Jant"], photos: [] },
  { id: 4, sellerName: "Hızlı Tamir Merkezi", sellerType: "mechanic", brand: "Volkswagen", model: "Golf", year: 2018, km: 110000, price: "320.000₺", description: "Dizel, ekonomik, düzenli servis kayıtlı.", photo: "🚗", status: "active", px: 20, py: 25, offers: [], messages: [], fuelType: "Dizel", transmission: "Manuel", power: "115", firstReg: "02.2018", color: "Mavi", vehicleId: null,
    bodyType: "Hatchback/5 Kapı", engineSize: "1.6 TDI", drivetrain: "Önden Çekiş", ownerCount: 2, paintedParts: 1, changedParts: 0, tradeIn: 0, doorCount: 5, features: ["Klima", "Elektrikli Cam", "Bluetooth", "ABS"], photos: [] },
  { id: 5, sellerName: "Mehmet Demir", sellerType: "owner", brand: "Fiat", model: "Egea", year: 2021, km: 30000, price: "480.000₺", description: "Az kullanılmış, garaj arabası, hasarsız.", photo: "🚙", status: "sold", px: 72, py: 42, offers: [], messages: [], fuelType: "Benzin", transmission: "Manuel", power: "95", firstReg: "01.2021", color: "Kırmızı", vehicleId: null,
    bodyType: "Sedan", engineSize: "1.4", drivetrain: "Önden Çekiş", ownerCount: 1, paintedParts: 0, changedParts: 0, tradeIn: 0, doorCount: 4, features: ["Klima", "Elektrikli Cam", "Elektrikli Ayna", "Bluetooth", "Park Sensörü (Arka)"], photos: [] },
  { id: 6, sellerName: "Güven Oto", sellerType: "mechanic", brand: "Mercedes-Benz", model: "C 200", year: 2016, km: 150000, price: "650.000₺", description: "Otomatik vites, deri döşeme, bakımları düzenli yapılmış.", photo: "🚘", status: "active", px: 55, py: 15, offers: [], messages: [], fuelType: "Dizel", transmission: "Otomatik", power: "170", firstReg: "09.2016", color: "Gümüş", vehicleId: null,
    bodyType: "Sedan", engineSize: "2.0", drivetrain: "Arkadan İtiş", ownerCount: 3, paintedParts: 2, changedParts: 1, tradeIn: 0, doorCount: 4, features: ["Deri Döşeme", "Isıtmalı Koltuk", "Sunroof/Cam Tavan", "Navigasyon", "Alaşım Jant", "Park Sensörü (Ön)", "Park Sensörü (Arka)"], photos: [] },
  { id: 7, sellerName: "Elif S.", sellerType: "owner", brand: "Hyundai", model: "i20", year: 2022, km: 15000, price: "550.000₺", description: "Sıfıra yakın, garantisi devam ediyor.", photo: "🚗", status: "reserved", px: 30, py: 70, offers: [], messages: [], fuelType: "Benzin", transmission: "Manuel", power: "100", firstReg: "06.2022", color: "Beyaz", vehicleId: null,
    bodyType: "Hatchback/5 Kapı", engineSize: "1.4", drivetrain: "Önden Çekiş", ownerCount: 1, paintedParts: 0, changedParts: 0, tradeIn: 1, doorCount: 5, features: ["Klima", "Elektrikli Cam", "Elektrikli Ayna", "Bluetooth", "Geri Görüş Kamerası"], photos: [] },
  { id: 8, sellerName: "Anadolu Servis", sellerType: "mechanic", brand: "Audi", model: "A3", year: 2019, km: 80000, price: "610.000₺", description: "Sportback, dizel, bakımlı ve temiz.", photo: "🚘", status: "active", px: 82, py: 65, offers: [], messages: [], fuelType: "Dizel", transmission: "Otomatik", power: "150", firstReg: "04.2019", color: "Gri", vehicleId: null,
    bodyType: "Hatchback/5 Kapı", engineSize: "2.0 TDI", drivetrain: "Önden Çekiş", ownerCount: 2, paintedParts: 1, changedParts: 0, tradeIn: 0, doorCount: 5, features: ["Deri Döşeme", "Xenon/LED Far", "Navigasyon", "Alaşım Jant", "Park Sensörü (Ön)", "Park Sensörü (Arka)"], photos: [] },
];

const JOB_LISTINGS = [
  { id: 701, mechanicId: 1, mechanicName: "Usta Mehmet Oto Servis", mechanicImg: "🔧", title: "Motor Ustası Aranıyor", employmentType: "Tam Zamanlı", experienceLevel: "3-5 Yıl", location: "Kadıköy / İstanbul", salaryMin: "25000", salaryMax: "35000",
    description: "Servisimizde motor bakım ve onarım işlerini yürütecek deneyimli bir motor ustası arıyoruz. Ekip çalışmasına yatkın, işine özen gösteren adaylarla çalışmak istiyoruz.",
    requirements: ["En az 3 yıl motor tamiri tecrübesi", "B sınıfı ehliyet", "Diyagnostik cihaz kullanabilme"],
    skills: ["Motor Tamiri", "Arıza Tespiti", "Diyagnostik"], postedDate: "3 gün önce", status: "active", applicants: [] },
  { id: 702, mechanicId: 2, mechanicName: "Hızlı Tamir Merkezi", mechanicImg: "🚗", title: "Lastikçi Çırağı Aranıyor", employmentType: "Stajyer/Çırak", experienceLevel: "Deneyim Aranmıyor", location: "Çankaya / Ankara", salaryMin: "12000", salaryMax: "",
    description: "Lastik değişimi ve rot balans konusunda kendini geliştirmek isteyen, öğrenmeye açık bir çırak arkadaş arıyoruz. Deneyim şart değildir, işini severek yapacak birini arıyoruz.",
    requirements: ["Fiziksel olarak aktif çalışabilmek", "Öğrenmeye istekli olmak"],
    skills: ["Lastik Değişimi", "Rot Balans"], postedDate: "1 hafta önce", status: "active", applicants: [] },
  { id: 703, mechanicId: 3, mechanicName: "Güven Oto", mechanicImg: "⚡", title: "Oto Elektrik Teknisyeni", employmentType: "Tam Zamanlı", experienceLevel: "1-3 Yıl", location: "Konak / İzmir", salaryMin: "22000", salaryMax: "28000",
    description: "Araç elektrik/elektronik arıza tespiti ve onarımı yapacak, kendini bu alanda geliştirmiş bir teknisyen arıyoruz.",
    requirements: ["En az 1 yıl oto elektrik tecrübesi", "Devre şemalarını okuyabilme"],
    skills: ["Oto Elektrik", "Elektronik Arıza Tespiti"], postedDate: "5 gün önce", status: "active", applicants: [] },
];

const SUPPORT_TICKETS = [
  { id: 7001, type: "payment", priority: "high", status: "open", fromType: "owner", fromName: "Emre Şahin", subject: "Kapora iade edilmedi", description: "Randevuyu iptal ettim ama 150₺ kapora tutarım 5 gündür hesabıma geri gelmedi.", relatedNote: "Randevu #101 · Usta Mehmet Oto Servis", createdDate: "2026-08-11", adminNote: "", refunded: 0 },
  { id: 7002, type: "listing", priority: "high", status: "open", fromType: "owner", fromName: "Zeynep Kaya", subject: "Şüpheli / yanıltıcı araç ilanı", description: "İlan #6'daki aracın fotoğrafları başka bir ilandan alınmış gibi duruyor, km bilgisi de tutarsız görünüyor.", relatedNote: "İlan #6 · Güven Oto", createdDate: "2026-08-12", adminNote: "", refunded: 0 },
  { id: 7003, type: "quality", priority: "medium", status: "in_review", fromType: "owner", fromName: "Mert Demir", subject: "Hizmet kalitesi şikayeti", description: "Yağ değişimi sonrası arabamdan yağ sızıntısı başladı, tamirci ile iletişime geçemiyorum.", relatedNote: "Hızlı Tamir Merkezi", createdDate: "2026-08-09", adminNote: "Tamirciyle görüşüldü, parça değişimi teklif edildi.", refunded: 0 },
  { id: 7004, type: "verification", priority: "low", status: "open", fromType: "mechanic", fromName: "Eskişehir Genç Oto", subject: "Doğrulama rozeti talebi", description: "İşletme belgelerimizi yükledik, hesabımızın doğrulanmış (mavi tik) olarak işaretlenmesini istiyoruz.", relatedNote: "Tamirci ID #10", createdDate: "2026-08-13", adminNote: "", refunded: 0 },
  { id: 7005, type: "no_show", priority: "medium", status: "in_review", fromType: "mechanic", fromName: "Güven Oto", subject: "Müşteri randevuya gelmedi", description: "Bugünkü 14:00 randevusu için müşteri gelmedi ve haber vermedi, bu saatlik zaman kaybımız oldu.", relatedNote: "Randevu #227", createdDate: "2026-08-14", adminNote: "", refunded: 0 },
  { id: 7006, type: "review", priority: "low", status: "resolved", fromType: "mechanic", fromName: "Ekonomik Tamir", subject: "Uygunsuz / haksız yorum", description: "Bize hiç gelmemiş bir kullanıcı 1 yıldız verip küfürlü yorum bırakmış, kaldırılmasını istiyoruz.", relatedNote: "Yorum ID #88", createdDate: "2026-08-05", adminNote: "İnceleme sonucu yorum kaldırıldı, kullanıcı uyarıldı.", refunded: 0 },
  { id: 7007, type: "bug", priority: "medium", status: "open", fromType: "owner", fromName: "Selin Arslan", subject: "Uygulama hatası: fotoğraf yüklenmiyor", description: "İlan verirken araç fotoğrafı eklemeye çalışıyorum ama sürekli hata veriyor.", relatedNote: "Teknik", createdDate: "2026-08-15", adminNote: "", refunded: 0 },
  { id: 7008, type: "review", priority: "low", status: "open", fromType: "mechanic", fromName: "Anadolu Servis", subject: "Uygunsuz / gerçek dışı yorum kaldırma talebi", description: "Bize hiç gelmemiş görünen bir kullanıcı 1 yıldız verip haksız yere puanımızı düşürdü, yorumun kaldırılmasını istiyoruz.", relatedNote: "Anadolu Servis üzerindeki yorum", createdDate: "2026-08-16", adminNote: "", refunded: 0 },
];

function j(v) { return JSON.stringify(v); }

export function seedIfEmpty() {
  if (isEmpty("mechanics")) {
    const stmt = db.prepare(`INSERT INTO mechanics (id,name,distance,price,rating,reviews,verified,avgResponseMinutes,specialty,img,lang,px,py,bannerPreset,coverPhoto,lat,lng,iban,bankName,accountHolder,address,hoursText,services,staff,reviewList,verificationDocs,brandsServiced,paymentMethods)
    VALUES (@id,@name,@distance,@price,@rating,@reviews,@verified,@avgResponseMinutes,@specialty,@img,@lang,@px,@py,@bannerPreset,@coverPhoto,@lat,@lng,@iban,@bankName,@accountHolder,@address,@hoursText,@services,@staff,@reviewList,@verificationDocs,@brandsServiced,@paymentMethods)`);
    const insertMany = db.transaction((rows) => {
      for (const m of rows) stmt.run({ ...m, hoursText: j(m.hoursText), services: j(m.services), staff: j(m.staff), reviewList: j(m.reviewList), verificationDocs: j(m.verificationDocs), brandsServiced: j(m.brandsServiced || []), paymentMethods: j(m.paymentMethods || []) });
    });
    insertMany(MECHANICS);
  }

  if (isEmpty("owners")) {
    const stmt = db.prepare(`INSERT INTO owners (id,name,email,phone,photo,address,city,joinDate,status,vehicleCount,apptCount,password) VALUES (@id,@name,@email,@phone,@photo,@address,@city,@joinDate,@status,@vehicleCount,@apptCount,@password)`);
    const insertMany = db.transaction((rows) => { for (const o of rows) stmt.run(o); });
    insertMany(OWNERS);
  }

  if (isEmpty("vehicles")) {
    const stmt = db.prepare(`INSERT INTO vehicles (id,ownerId,brand,model,year,plate,country,city,tireType,lastInspection,lastMaintenance,insuranceEnd,listingId,reminderOverrides,customReminders,history)
    VALUES (@id,@ownerId,@brand,@model,@year,@plate,@country,@city,@tireType,@lastInspection,@lastMaintenance,@insuranceEnd,@listingId,@reminderOverrides,@customReminders,@history)`);
    const insertMany = db.transaction((rows) => {
      for (const v of rows) stmt.run({ ...v, reminderOverrides: j(v.reminderOverrides), customReminders: j(v.customReminders), history: j(v.history) });
    });
    insertMany(VEHICLES);
  }

  if (isEmpty("appointments")) {
    const stmt = db.prepare(`INSERT INTO appointments (id,ownerId,mechanicId,customer,mechanicName,mechanicImg,vehicle,date,time,status,autoAccepted,issue,depositPaid)
    VALUES (@id,@ownerId,@mechanicId,@customer,@mechanicName,@mechanicImg,@vehicle,@date,@time,@status,@autoAccepted,@issue,@depositPaid)`);
    const insertMany = db.transaction((rows) => { for (const a of rows) stmt.run(a); });
    insertMany(APPOINTMENTS);
  }

  if (isEmpty("listings")) {
    const stmt = db.prepare(`INSERT INTO listings (id,sellerName,sellerType,brand,model,year,km,price,description,photo,status,px,py,offers,messages,fuelType,transmission,power,firstReg,color,vehicleId,bodyType,engineSize,drivetrain,ownerCount,paintedParts,changedParts,tradeIn,doorCount,features,photos)
    VALUES (@id,@sellerName,@sellerType,@brand,@model,@year,@km,@price,@description,@photo,@status,@px,@py,@offers,@messages,@fuelType,@transmission,@power,@firstReg,@color,@vehicleId,@bodyType,@engineSize,@drivetrain,@ownerCount,@paintedParts,@changedParts,@tradeIn,@doorCount,@features,@photos)`);
    const insertMany = db.transaction((rows) => { for (const l of rows) stmt.run({ ...l, offers: j(l.offers), messages: j(l.messages), bodyType: l.bodyType || null, engineSize: l.engineSize || null, drivetrain: l.drivetrain || null, ownerCount: l.ownerCount ?? null, paintedParts: l.paintedParts ?? 0, changedParts: l.changedParts ?? 0, tradeIn: l.tradeIn ? 1 : 0, doorCount: l.doorCount ?? null, features: j(l.features || []), photos: j(l.photos || []) }); });
    insertMany(LISTINGS);
  }

  if (isEmpty("job_listings")) {
    const stmt = db.prepare(`INSERT INTO job_listings (id,mechanicId,mechanicName,mechanicImg,title,employmentType,experienceLevel,location,salaryMin,salaryMax,description,requirements,skills,postedDate,status,applicants)
    VALUES (@id,@mechanicId,@mechanicName,@mechanicImg,@title,@employmentType,@experienceLevel,@location,@salaryMin,@salaryMax,@description,@requirements,@skills,@postedDate,@status,@applicants)`);
    const insertMany = db.transaction((rows) => { for (const jl of rows) stmt.run({ ...jl, requirements: j(jl.requirements), skills: j(jl.skills), applicants: j(jl.applicants) }); });
    insertMany(JOB_LISTINGS);
  }

  if (isEmpty("support_tickets")) {
    const stmt = db.prepare(`INSERT INTO support_tickets (id,type,priority,status,fromType,fromName,subject,description,relatedNote,createdDate,adminNote,refunded)
    VALUES (@id,@type,@priority,@status,@fromType,@fromName,@subject,@description,@relatedNote,@createdDate,@adminNote,@refunded)`);
    const insertMany = db.transaction((rows) => { for (const t of rows) stmt.run(t); });
    insertMany(SUPPORT_TICKETS);
  }
}

// Allow running directly: `npm run seed`
if (import.meta.url === `file://${process.argv[1]}`) {
  seedIfEmpty();
  console.log("Seed complete.");
}
