// SQLite stores nested/array fields as JSON TEXT columns; these helpers convert
// rows back into the shape the frontend expects (parsed JSON, booleans instead
// of 0/1) when reading, and back into TEXT when writing.
const JSON_FIELDS = {
  mechanics: ["hoursText", "services", "staff", "reviewList", "verificationDocs", "brandsServiced", "paymentMethods", "favoriteIds", "favoriteMechanicIds", "likedReviewIds", "savedSearches", "notifySettings"],
  vehicles: ["reminderOverrides", "customReminders", "history"],
  owners: ["favoriteIds", "favoriteMechanicIds", "likedReviewIds", "savedSearches", "notifySettings"],
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
  listings: ["tradeIn", "negotiable", "featured", "adminRemoved", "showHistory"],
  vehicles: ["vinShared"],
  vehicle_history: ["shared"],
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
/**
 * GÜVENLİK DÜZELTMESİ (otomatik güvenlik matrisi taramasında bulundu): `signupIpHash`.
 * ------------------------------------------------------------------------------------------------
 * Bu alan, kayıt anındaki IP adresinin karması. Sunucu onu SADECE kendi içinde kullanıyor
 * (rakip yorum tespitinde bir inceleme ipucu olarak, bkz. routes/reviews.js). Ama hiçbir yerde
 * yanıttan çıkarılmadığı için `GET /api/mechanics` ve `GET /api/owners` gibi HERKESE AÇIK
 * uçlarda olduğu gibi dönüyordu.
 *
 * Neden ciddi: karma, IP'yi geri vermez ama EŞİTLİĞİ verir. Yani girişsiz biri tek istekle
 * tüm kullanıcıları çekip "hangi hesaplar aynı ağdan açılmış" haritasını çıkarabilir —
 * aynı ev, aynı ofis, aynı tamirhane. Bu bir kimlik bağlama (deanonimizasyon) sinyalidir ve
 * kimsenin görmesi gerekmiyor. Ayrıca kötü niyetli biri, hangi hesabın işaretleneceğini
 * önceden öğrenip tespitten kaçabilirdi.
 *
 * Çözüm: alan artık HİÇBİR yanıtta dönmüyor (yöneticide de değil — yönetici de bu ham değere
 * ihtiyaç duymuyor, kararı sunucu veriyor).
 */
const SENSITIVE_FIELDS = {
  owners: ["password", "signupIpHash"],
  mechanics: ["password", "signupIpHash"],
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
// GÜVENLİK DÜZELTMESİ (karşılaştırma/kayıtlı arama denetiminde bulundu): owners.savedSearches
// eklenirken fark edildi — owners tablosunun favoriteMechanicIds/likedReviewIds/savedSearches
// alanları da mechanics'teki iban/bankName/accountHolder ile AYNI sorunu taşıyordu: `authScope`
// owners için publicRead'i kapatmadığından (owner profilleri "üyelik tarihi" gibi bilgiler için
// herkese açık kalmalı), GET /api/owners (toplu) ve girişsiz/başkasının GET /api/owners/:id
// isteği bu alanları da olduğu gibi döndürüyordu — yani ID'sini bilen HERKES başka bir araç
// sahibinin favori tamirci listesini, beğendiği yorumları ve (bu özellikle) kayıtlı arama
// geçmişini (ne tür araç aradığı, hangi fiyat aralığında vb.) tek istekle çekebiliyordu.
// favoriteIds burada YOK — o alan listingFavoriteCount tarafından KASITLI olarak toplu listede
// kullanılıyor (bkz. AppLogicProvider.tsx, "kaç kişi favoriledi" sayacı), o yüzden çıkarılmadı.
// Kendi profilini görüntüleyen kullanıcı (isSelfOrAdmin) hâlâ hydrate() ile TÜM alanları görüyor —
// bu sadece BAŞKALARININ toplu/tekil genel görünümünden bu üç kişisel alanı gizliyor.
const LIST_ONLY_SENSITIVE_FIELDS = {
  // Tamircinin kendi favorileri/kayıtlı aramaları da owners tarafındaki ile aynı gerekçeyle toplu
  // listede gizleniyor: bir tamircinin neyi favorilediği başka kullanıcıları ilgilendirmez.
  // verificationDocs (aynı tarama): tamircinin doğrulama için yüklediği BELGELER. Rozetin kendisi
  // herkese açık bilgi ama belgeler değil — vergi levhası, ruhsat, kimlik gibi şeyler olabilir.
  // Girişsiz tamirci listesinde olduğu gibi dönüyordu. Kendi profilini görüntüleyen tamirci ve
  // yönetici hâlâ görüyor (hydrateAll yalnızca BAŞKALARININ gördüğü listede gizliyor).
  mechanics: ["iban", "bankName", "accountHolder", "favoriteIds", "favoriteMechanicIds", "likedReviewIds", "savedSearches", "verificationDocs",
    // E-POSTA (tam uygulama denetiminde bulundu): tamircinin telefonu herkese açık olmalı —
    // müşteri arayacak. E-postası ise toplu listede hiçbir işe yaramıyor ve tek istekle
    // çekilebilen bir spam/oltalama listesi oluşturuyor. Kendi profilinde ve yöneticide duruyor.
    "email",
    // notifySettings: hangi bildirim kategorilerinin açık/kapalı olduğu tamamen kişisel bir tercih,
    // diğer favoriler/aramalar gibi başka kullanıcıyı ilgilendirmiyor (bkz. el kitabı 15.1).
    "notifySettings"],
  /**
   * OWNERS LİSTESİ — EN CİDDİ GİZLİLİK BULGUSU (tam uygulama denetiminde ölçüldü).
   * `GET /api/owners` OTURUMSUZ olarak 200 dönüyordu ve her müşterinin AD, E-POSTA, TELEFON ve
   * ADRESİNİ içeriyordu. Yani siteyi bilen herkes tek istekle tüm müşteri listesini indirebilirdi.
   * İlginç ayrıntı: tekil kayıt (`GET /api/owners/1`) DOĞRU biçimde 404 veriyordu — yani kapı
   * kilitliydi, pencere açıktı. (Aynı desen bu denetimde üçüncü kez çıktı.)
   *
   * NEDEN LİSTE TAMAMEN KAPATILMADI: ön yüz açılışta (girişten ÖNCE) bu listeyi çekiyor ve
   * ilandaki satıcının adı/şehri, sohbetteki karşı tarafın dili, favori sayacı gibi meşru
   * yerlerde kullanıyor. 401 döndürmek açılış isteğini kırıp siteyi misafirlere kapatırdı.
   * Doğru çözüm alanı daraltmak: kimliğe doğrudan bağlanan İLETİŞİM bilgileri listeden çıktı.
   * Yönetici tam listeyi görmeye devam ediyor (hydrateAll yalnızca BAŞKALARININ gördüğü
   * listede gizliyor) ve kullanıcı kendi kaydını tekil uçtan tam olarak alıyor.
   *
   * ÖNCEKİ DENETİMİN "KABUL EDİLEN RİSKİ" ARTIK KAPATILDI (ikinci denetim).
   * -------------------------------------------------------------------------------------------
   * Burada şöyle yazıyordu: "`favoriteIds` listede kalıyor, çünkü 'bu ilanı N kişi favorilere
   * ekledi' sayacı buna dayanıyor... gizlemek sayacı bozardı." Bu, riski kabul etmek için yeterli
   * bir gerekçe DEĞİLDİ ve ikinci denetimde bağımsız olarak yeniden değerlendirildi:
   *
   *   - Sızan şey bir SAYI değil, KİŞİ↔İLAN EŞLEŞMESİ: hangi kullanıcının hangi araçları
   *     favorilediği. Ad ve şehir aynı listede olduğu için bu doğrudan profillemeye açık
   *     ("bu kişi 600.000₺ üstü SUV arıyor" gibi) ve kullanıcının paylaşmayı seçtiği bir bilgi değil.
   *   - Özelliğin ihtiyacı olan şey bir SAYI. Sayıyı istemciye tüm listeyi vererek hesaplatmak,
   *     ihtiyaçtan çok daha fazla veri dağıtmaktı. Doğru yer sunucu.
   *
   * Bu yüzden alan artık listeden ÇIKIYOR ve sayaç sunucuda toplanıyor:
   * `GET /api/listings/favorite-counts` → { listingId: kaçKişi }. Yani özellik korunuyor, eşleşme
   * sızmıyor. Kullanıcı kendi `favoriteIds` listesini kendi kaydında (hydrate) görmeye devam ediyor.
   */
  owners: ["favoriteIds", "favoriteMechanicIds", "likedReviewIds", "savedSearches", "email", "phone", "address", "notifySettings"],
};

// JSON sütunlarının tamamı DİZİ tutuyor; istisnalar nesne tutanlar (vehicles.reminderOverrides,
// owners/mechanics.notifySettings). Bu ayrım aşağıdaki boş-değer varsayılanı için gerekli.
const JSON_OBJECT_FIELDS = new Set(["reminderOverrides", "notifySettings"]);

export function hydrate(table, row) {
  if (!row) return row;
  const out = { ...row };
  for (const f of JSON_FIELDS[table] || []) {
    // GERÇEK HATA DÜZELTMESİ: burası `JSON.parse(out[f] ?? "null")` idi — sütun NULL olduğunda
    // (ya da içeriği bozuksa) alan `null` olarak dönüyordu. Arayüz bu alanları koşulsuz dizi gibi
    // kullanıyor (selectedMechanic.staff.map, mech.reviewList.filter, listing.offers.some ...),
    // yani tek bir NULL sütun o ekranı komple çökertebiliyordu. Şema varsayılanları ('[]') çoğu
    // satırı koruyor ama elle/eski göçlerle açılan satırlarda garanti yok. Sözleşmeyi burada
    // netleştiriyoruz: dizi alanı her zaman dizi, nesne alanı her zaman nesne döner.
    const fallback = JSON_OBJECT_FIELDS.has(f) ? {} : [];
    try {
      const parsed = JSON.parse(out[f] ?? "null");
      out[f] = parsed == null ? fallback : parsed;
    } catch { out[f] = fallback; }
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
