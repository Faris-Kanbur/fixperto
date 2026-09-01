// SQLite stores nested/array fields as JSON TEXT columns; these helpers convert
// rows back into the shape the frontend expects (parsed JSON, booleans instead
// of 0/1) when reading, and back into TEXT when writing.
const JSON_FIELDS = {
  mechanics: ["hoursText", "services", "staff", "reviewList", "verificationDocs", "brandsServiced", "paymentMethods"],
  vehicles: ["reminderOverrides", "customReminders", "history"],
  owners: ["favoriteIds", "favoriteMechanicIds", "likedReviewIds", "savedSearches"],
  listings: ["offers", "messages", "features", "photos"],
  conversations: ["messages"],
  job_listings: ["requirements", "skills", "applicants"],
  appointments: ["issuePhotos"],
  support_tickets: ["adminReplies"],
  quote_requests: ["photos", "mechanicIds"],
};
const BOOL_FIELDS = {
  mechanics: ["verified"],
  appointments: ["autoAccepted", "reviewed", "noShow", "historyShareConsent", "depositRefunded"],
  support_tickets: ["refunded"],
  listings: ["tradeIn", "negotiable", "featured", "adminRemoved"],
};

// GÜVENLİK DÜZELTMESİ: `password` sütunu owners/mechanics tablolarında düz metin olarak
// duruyor (bkz. db.js şema yorumu — gerçek üretimde hash'lenmeli). Bu sütun daha önce hiçbir
// filtre olmadan `SELECT *` ile API yanıtına dahil ediliyordu, yani `/api/owners` veya
// `/api/mechanics` uç noktasını bilen HERKES tüm kullanıcıların şifrelerini düz metin olarak
// görebiliyordu. Artık hydrate() bu alanı yanıttan tamamen çıkarıyor — şifre bir daha asla
// istemciye dönmüyor. Mevcut şifreyi doğrulamak gereken tek yer (kullanıcının kendi "şifre
// değiştir" formu) artık ayrı bir sunucu tarafı POST /:id/verify-password uç noktası kullanıyor
// (bkz. makeCrudRouter.js passwordVerify seçeneği) — şifre değeri hiçbir zaman ağ üzerinden
// istemciye taşınmıyor, sadece eşleşip eşleşmediği (true/false) dönüyor.
const SENSITIVE_FIELDS = {
  owners: ["password"],
  mechanics: ["password"],
};

// GÜVENLİK DÜZELTMESİ (devamı): `iban`/`bankName`/`accountHolder` sadece tamircinin KENDİ profil
// ayarları ekranında (bkz. AppShell.tsx myProfile) gösteriliyor/düzenleniyor — hiçbir yerde başka
// bir kullanıcıya (araç sahibine ya da başka bir tamirciye) gösterilmiyor. Ama önceden herkese açık
// tamirci LİSTESİ (`GET /api/mechanics`, arama/keşfet ekranının kullandığı toplu uç nokta) bu
// alanları da içeriyordu — yani API'yi bilen biri TEK bir istekle sitedeki tüm tamircilerin banka
// bilgilerini toplu olarak çekebilirdi (en riskli kısım). Bu uygulamada gerçek bir oturum/kimlik
// doğrulama katmanı olmadığı için (bkz. REFACTOR_REPORT.md bölüm 9 madde 2 — backend hiçbir isteğin
// "gerçekten o tamirciden mi geldiğini" bilmiyor), tek bir kaydı ID ile isteyen bir çağrıyı
// "kendi profilim" isteğinden ayırt etmenin güvenli bir yolu yok; bunun tam çözümü gerçek tamirci
// girişi/oturumu eklemeyi gerektirir (ayrı, daha büyük bir iş). Bu yüzden burada ORANTILI bir
// azaltma uygulanıyor: TOPLU liste uç noktası bu alanları asla döndürmez (böylece kimse tüm
// tamircilerin banka bilgisini tek istekte toplayamaz); frontend kendi profilini artık ayrıca
// GET /api/mechanics/:id ile çekip toplu listedeki kendi kaydının üzerine yazıyor (bkz.
// AppLogicProvider.tsx ilk veri yükleme efekti) — bu tekil uç nokta hâlâ bu alanları döndürüyor.
const LIST_ONLY_SENSITIVE_FIELDS = {
  mechanics: ["iban", "bankName", "accountHolder"],
};

export function hydrate(table, row) {
  if (!row) return row;
  const out = { ...row };
  for (const f of JSON_FIELDS[table] || []) {
    try { out[f] = JSON.parse(out[f] ?? "null"); } catch { /* leave as-is if malformed */ }
  }
  for (const f of BOOL_FIELDS[table] || []) {
    out[f] = !!out[f];
  }
  for (const f of SENSITIVE_FIELDS[table] || []) {
    delete out[f];
  }
  return out;
}

export function hydrateAll(table, rows) {
  return rows.map((r) => {
    const hydrated = hydrate(table, r);
    for (const f of LIST_ONLY_SENSITIVE_FIELDS[table] || []) {
      delete hydrated[f];
    }
    return hydrated;
  });
}

export function dehydrate(table, obj) {
  const out = { ...obj };
  for (const f of JSON_FIELDS[table] || []) {
    if (f in out) out[f] = JSON.stringify(out[f] ?? []);
  }
  for (const f of BOOL_FIELDS[table] || []) {
    if (f in out) out[f] = out[f] ? 1 : 0;
  }
  return out;
}
