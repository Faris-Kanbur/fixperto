export const BANNER_PRESETS = { blue: "from-gray-50 to-gray-100", orange: "from-rose-50 to-rose-100", green: "from-gray-100 to-gray-200" };
export const ONBOARDING_SLIDES = [
  { icon: "🔧", grad: "from-gray-950 to-rose-700", title: "Fixperto'ya Hoş Geldiniz", desc: "Güvenilir tamircileri bulun, randevu alın ve aracınızı tek bir yerden takip edin." },
  { icon: "🚗", grad: "from-rose-600 to-rose-800", title: "Araç Sahibiyseniz", desc: "Yakınınızdaki tamircileri karşılaştırın, sabit fiyatlı hizmetlerde önceden ödeme yapın, aracınızı satışa çıkarın ve akıllı bakım hatırlatmaları alın." },
  { icon: "🛠️", grad: "from-rose-600 to-rose-600", title: "Tamirciyseniz", desc: "Randevu taleplerini yönetin, hizmet ve fiyatlarınızı belirleyin, iş ilanı verin ve müşterilerinizle sohbet edin." },
];
export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const DAY_LABELS = { mon: "Pzt", tue: "Sal", wed: "Çar", thu: "Per", fri: "Cum", sat: "Cmt", sun: "Paz" };
export const DAY_LABELS_FULL = { mon: "Pazartesi", tue: "Salı", wed: "Çarşamba", thu: "Perşembe", fri: "Cuma", sat: "Cumartesi", sun: "Pazar" };
export const JS_DAY_TO_KEY = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
export const FUEL_TYPES = ["Benzin", "Dizel", "Elektrik", "Hibrit", "LPG"];
export const TRANSMISSIONS = ["Manuel", "Otomatik", "Yarı Otomatik"];
export const EMPLOYMENT_TYPES = ["Tam Zamanlı", "Yarı Zamanlı", "Stajyer/Çırak", "Sözleşmeli"];
export const EXPERIENCE_LEVELS = ["Deneyim Aranmıyor", "1-3 Yıl", "3-5 Yıl", "5+ Yıl"];
export const EMPTY_JOB_FORM = { title: "", employmentType: "Tam Zamanlı", experienceLevel: "Deneyim Aranmıyor", location: "", salaryMin: "", salaryMax: "", description: "", requirements: "", skills: "", _editingId: null };
export const DEFAULT_HOURS = { mon: { open: true, start: "09:00", end: "18:00", closedSlots: [], extraSlots: [] }, tue: { open: true, start: "09:00", end: "18:00", closedSlots: [], extraSlots: [] }, wed: { open: true, start: "09:00", end: "18:00", closedSlots: [], extraSlots: [] }, thu: { open: true, start: "09:00", end: "18:00", closedSlots: [], extraSlots: [] }, fri: { open: true, start: "09:00", end: "18:00", closedSlots: [], extraSlots: [] }, sat: { open: true, start: "09:00", end: "14:00", closedSlots: [], extraSlots: [] }, sun: { open: false, start: "09:00", end: "18:00", closedSlots: [], extraSlots: [] } };
export const PRICE_LEVEL_BREAKS = [260, 320, 390, 460];

// The single logged-in demo owner/mechanic account both map to a fixed id, mirroring the
// original single-file app: the "current user" is always MY_MECHANIC_ID / MY_OWNER_ID from
// the shared mechanics/owners tables, so admin panel edits reflect instantly in their profile.
export const MY_MECHANIC_ID = 1;
export const MY_OWNER_ID = 9001;

// Randevunun autoAccepted bayrağına göre iki ayrı adım seti var (bkz. Uber-style status stepper).
export const TRACK_STATUSES_MANUAL = ["Onay Bekliyor", "Sırada", "Tamire Alındı", "Tamir Tamamlandı"];
export const TRACK_LABELS_MANUAL = ["Onay Bekliyor", "Kabul Edildi", "Serviste", "Tamamlandı"];
export const TRACK_STATUSES_AUTO = ["Sırada", "Tamire Alındı", "Tamir Tamamlandı"];
export const TRACK_LABELS_AUTO = ["Kabul Edildi", "Serviste", "Tamamlandı"];

export const TODAY = new Date(2026, 7, 15);
export const TODAY_STR = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, "0")}-${String(TODAY.getDate()).padStart(2, "0")}`;

export const FIXED_PRICE_KEYWORDS = ["yağ değişimi", "lastik değişimi", "lastik", "fren balata", "balata", "fren diski", "akü değişimi", "akü", "filtre değişimi", "filtre", "rot balans", "klima gazı", "klima bakımı", "cam suyu", "muayene", "silecek", "far ampul", "egzoz", "periyodik bakım", "genel bakım", "şarj kontrolü"];
export const VARIABLE_PRICE_KEYWORDS = ["arıza tespit", "arıza", "kaporta", "boya", "revizyon", "şanzıman", "elektrik", "motor kontrolü", "çarpma", "hasar"];

// ATU'nun (Almanya'nın en büyük oto servis zinciri) web sitesinde ve fiyat araştırmalarında
// sabit fiyatla sunulan başlıca hizmetler baz alınarak oluşturulmuş standart hizmet kataloğu.
export const ATU_FIXED_CATALOG = [
  { matchKey: "yağ değişimi", name: "Yağ Değişimi", price: "350₺" },
  { matchKey: "filtre", name: "Filtre Değişimi (Yağ/Hava/Polen)", price: "250₺" },
  { matchKey: "lastik", name: "Lastik Değişimi / Montajı", price: "300₺" },
  { matchKey: "rot balans", name: "Rot Balans Ayarı", price: "400₺" },
  { matchKey: "fren balata", name: "Fren Balata Değişimi", price: "700₺" },
  { matchKey: "fren diski", name: "Fren Diski Değişimi", price: "1200₺" },
  { matchKey: "akü", name: "Akü Değişimi", price: "900₺" },
  { matchKey: "klima gazı", name: "Klima Gazı Dolumu", price: "500₺" },
  { matchKey: "klima bakımı", name: "Klima Bakımı", price: "450₺" },
  { matchKey: "egzoz", name: "Egzoz Değişimi", price: "900₺" },
  { matchKey: "periyodik bakım", name: "Periyodik Bakım (Genel Bakım)", price: "600₺" },
  { matchKey: "muayene", name: "Araç Muayenesi", price: "300₺" },
  { matchKey: "silecek", name: "Silecek Değişimi", price: "150₺" },
  { matchKey: "far ampul", name: "Far Ampulü Değişimi", price: "150₺" },
];

export const DICT_TR_EN = { "merhaba": "hello", "selam": "hi", "teşekkürler": "thank you", "fren sesi geliyor": "there's a brake noise", "ne kadar tutar": "how much will it cost", "tamam": "okay", "evet": "yes", "hayır": "no" };
export const DICT_EN_TR = Object.fromEntries(Object.entries(DICT_TR_EN).map(([k, v]) => [v, k]));

// Ülkeye göre lastik değişimi için "resmi" tarih kuralları (demo amaçlı sadeleştirilmiş).
export const LEGAL_TIRE_RULES = {
  tr: { winterMonthDay: "12-01", summerMonthDay: "04-01", label: "Karayolları Trafik Yönetmeliği" },
  de: { winterMonthDay: "11-01", summerMonthDay: "04-15", label: "Alman Karayolları Trafik Yönetmeliği (StVO §2 Abs. 3a)" },
};
export const DE_CITIES = ["Stuttgart", "Berlin", "München", "Hamburg", "Köln", "Frankfurt", "Dortmund", "Essen"];
export const REMINDER_KIND_LABELS = { inspection: "Araç Muayenesi", maintenance: "Periyodik Bakım", "tire-winter": "Kışlık Lastik", "tire-summer": "Yazlık Lastik", insurance: "Sigorta Yenileme", battery: "Akü ve Cam Suyu Kontrolü" };

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
export const PLATFORM_COMMISSION_RATE = 0.08;
export const ADMIN_TREND_DATA = {
  months: ["Mar", "Nis", "May", "Haz", "Tem", "Ağu"],
  signups: [14, 19, 23, 27, 31, 36],
  appointments: [22, 28, 35, 41, 47, 52],
  revenue: [1850, 2340, 2960, 3420, 3890, 4260],
};
export const ADMIN_SLA_DAYS = { high: 2, medium: 4, low: 7 };
