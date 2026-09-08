/**
 * MARKAYA GÖRE MODEL LİSTESİ
 * ---------------------------------------------------------------------------------------------
 * Marka seçildikten sonra model alanına öneri verebilmek için. Anahtarlar CAR_BRANDS'teki resmi
 * yazımla BİREBİR aynı olmalı (bkz. helpers.ts → canonicalBrand); aksi halde marka seçilse bile
 * model listesi boş gelir.
 *
 * DÜRÜST SINIR: bu liste her modeli kapsamıyor ve kapsaması da amaçlanmadı. Türkiye ve Almanya
 * yollarında sık görülen modeller seçildi. Bu yüzden model alanı SERBEST YAZMAYA da açık —
 * listede olmayan bir model (ör. eski ya da ithal bir kasa) yazılabiliyor. Liste sadece
 * yazmayı hızlandıran bir öneri; zorunlu bir kısıt değil. Model verisi bir araç veri
 * sağlayıcısından beslenene kadar doğru davranış budur.
 */
export const CAR_MODELS: Record<string, string[]> = {
  Volkswagen: ["Polo", "Golf", "Passat", "Jetta", "Tiguan", "T-Roc", "T-Cross", "Touran", "Caddy", "Transporter", "Arteon", "ID.4"],
  Renault: ["Clio", "Megane", "Symbol", "Talisman", "Captur", "Kadjar", "Austral", "Fluence", "Kangoo", "Trafic", "Zoe"],
  Fiat: ["Egea", "Egea Cross", "Panda", "500", "500X", "Punto", "Linea", "Doblo", "Fiorino", "Ducato", "Tipo"],
  Ford: ["Fiesta", "Focus", "Mondeo", "Puma", "Kuga", "EcoSport", "Ranger", "Transit", "Tourneo Courier", "Tourneo Custom", "Mustang"],
  Opel: ["Corsa", "Astra", "Insignia", "Mokka", "Crossland", "Grandland", "Zafira", "Combo", "Vivaro"],
  Toyota: ["Corolla", "Yaris", "Auris", "C-HR", "RAV4", "Camry", "Avensis", "Hilux", "Proace City", "Land Cruiser"],
  Hyundai: ["i10", "i20", "i30", "Accent Blue", "Elantra", "Bayon", "Kona", "Tucson", "Santa Fe", "Ioniq 5"],
  Peugeot: ["208", "308", "301", "508", "2008", "3008", "5008", "Partner", "Rifter", "Expert"],
  "Citroën": ["C3", "C4", "C5 Aircross", "C3 Aircross", "C-Elysee", "Berlingo", "Jumpy", "Jumper"],
  Skoda: ["Fabia", "Octavia", "Superb", "Scala", "Kamiq", "Karoq", "Kodiaq", "Rapid", "Enyaq"],
  Seat: ["Ibiza", "Leon", "Arona", "Ateca", "Tarraco", "Toledo", "Cordoba"],
  BMW: ["1 Serisi", "2 Serisi", "3 Serisi", "4 Serisi", "5 Serisi", "7 Serisi", "X1", "X3", "X5", "X6", "i3", "i4"],
  "Mercedes-Benz": ["A-Serisi", "B-Serisi", "C-Serisi", "E-Serisi", "S-Serisi", "CLA", "GLA", "GLC", "GLE", "Vito", "Sprinter", "EQC"],
  Audi: ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q5", "Q7", "e-tron"],
  Nissan: ["Micra", "Note", "Juke", "Qashqai", "X-Trail", "Navara", "Leaf"],
  Honda: ["Jazz", "Civic", "Accord", "HR-V", "CR-V", "City"],
  Kia: ["Picanto", "Rio", "Ceed", "Cerato", "Stonic", "Sportage", "Sorento", "Niro", "EV6"],
  Dacia: ["Sandero", "Sandero Stepway", "Logan", "Duster", "Jogger", "Lodgy", "Dokker", "Spring"],
  Mini: ["Cooper", "Cooper S", "Countryman", "Clubman", "One"],
  Volvo: ["S60", "S90", "V40", "V60", "XC40", "XC60", "XC90"],
  Chevrolet: ["Aveo", "Cruze", "Spark", "Captiva", "Lacetti", "Kalos"],
  Mazda: ["2", "3", "6", "CX-3", "CX-30", "CX-5", "MX-5"],
  Suzuki: ["Swift", "Vitara", "S-Cross", "Ignis", "Jimny", "Baleno"],
  Porsche: ["911", "718 Cayman", "718 Boxster", "Macan", "Cayenne", "Panamera", "Taycan"],
  "Tofaş": ["Şahin", "Doğan", "Kartal", "Serçe", "Murat 131"],
};

/** Verilen markanın model önerileri; marka bilinmiyorsa boş liste (alan yine serbest yazılabilir). */
export function modelsForBrand(brand: string): string[] {
  return CAR_MODELS[String(brand ?? "").trim()] || [];
}
