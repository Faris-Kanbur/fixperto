/**
 * FIXPERTO EL KİTABI — sitenin nasıl çalıştığının ve hangi standartlara göre tasarlandığının
 * tek kaynağı. Yönetici panelindeki "El Kitabı" sekmesinde okunuyor.
 * ---------------------------------------------------------------------------------------------
 * NEDEN VAR: bir davranış tuhaf göründüğünde sorulacak ilk soru "bu bir hata mı, yoksa biz bunu
 * bilerek mi böyle tasarladık?" oluyor. Cevap kodun içindeki yorumlarda dağınık duruyordu; bu
 * dosya onları tek yerde, aranabilir biçimde topluyor.
 *
 * BAKIM KURALI: yeni bir özellik eklendiğinde ya da mevcut bir davranış değiştiğinde İLGİLİ SAYFA
 * AYNI COMMIT'TE güncellenir. Bu kural yazıyla kalmasın diye teste bağlandı:
 * tests/handbook.test.mjs, components/features altındaki her bileşenin el kitabında geçtiğini
 * doğruluyor — yeni bir bileşen ekleyip burayı güncellemezsen test düşer.
 *
 * BİÇİM: gövde düz metin. "## " ile başlayan satır alt başlık olur. HTML yok — panelden gelen
 * içerik gibi davranıp güvenli işliyoruz (bkz. blog sayfasındaki aynı karar).
 */

export interface HandbookPage {
  id: string;
  title: string;
  body: string;
}

export interface HandbookSection {
  id: string;
  title: string;
  /** Bölümün bir cümlelik özeti — kenar çubuğunda ve arama sonuçlarında görünür. */
  summary: string;
  pages: HandbookPage[];
}

export const HANDBOOK: HandbookSection[] = [
  // ==========================================================================================
  {
    id: "genel",
    title: "1. Genel Bakış",
    summary: "Fixperto nedir, kimler kullanır, hangi parçalardan oluşur.",
    pages: [
      {
        id: "urun",
        title: "1.1 Ürün tanımı",
        body: `Fixperto, araç sahipleriyle tamircileri buluşturan iki taraflı bir pazar yeridir. Araç sahibi tamirci arar, fiyat görür, randevu alır; tamirci hizmetlerini ve fiyatlarını yönetir, randevu taleplerini karşılar.

## İki taraflı olmanın sonucu
Her ekran "kim bakıyor" sorusuna göre değişir. Aynı veri (ör. bir randevu) araç sahibinde "randevum", tamircide "gelen talep" olarak görünür. Bu yüzden neredeyse her listede role göre bir filtre vardır ve bu filtreler İSİM değil KİMLİK (ownerId/mechanicId) üzerinden çalışır — isim eşleşmesi geçmişte gerçek hatalara yol açtı.

## Üçüncü rol: yönetici
Site sahibi için ayrı bir panel var (yönetici paneli). Kendi token'ıyla çalışır, kullanıcı oturumundan tamamen bağımsızdır.

## Misafir
Giriş yapmadan arama, tamirci profili, ilan ve blog gezilebilir. Giriş yalnızca bir şey KAYDEDİLECEĞİ anda istenir (randevu onayı, teklif, mesaj, favori, araç ekleme). Bunun sebebi: kişiyi daha ne sunduğumuzu görmeden kayıt formuna sokmak dönüşümü düşürüyor.`,
      },
      {
        id: "yigin",
        title: "1.2 Teknoloji ve klasörler",
        body: `Frontend: React + TypeScript + Vite + Tailwind. Backend: Node + Express + SQLite (better-sqlite3).

## Frontend klasörleri
app/AppShell.tsx — tüm ekranların çizildiği yer.
app/state/AppLogicProvider.tsx — tüm state ve iş mantığı; tek bir context ile dağıtılır.
components/features/ — bağımsız parçalar (kartlar, paneller, takvim, seçiciler).
data/ — sabitler, çeviriler, katalog, model listesi, bu el kitabı.
utils/ — saf yardımcılar (tarih, fiyat, doğrulama, güvenlik).
services/api/client.ts — tek HTTP katmanı.

## Backend klasörleri
server.js — orta katmanlar, CORS, güvenlik başlıkları, rota bağlama.
routes/ — auth, admin, blog, quotes, conversations, analytics, translate + genel CRUD üreticisi.
db/ — şema, göç (migration), tohum veri, hydrate (API çıktısının biçimlendirilmesi).
utils/auth.js — şifre, oturum, hız sınırlayıcı.

## Neden tek büyük provider
State'i özelliğe göre bölmek yerine tek yerde tutuyoruz. Sebebi: bu üründe ekranlar birbirine çok bağlı (sohbetten randevuya, ilandan tamirciye). Ayrı store'lar arası senkron, tek dosyanın uzunluğundan daha pahalıya geliyordu.`,
      },
    ],
  },

  // ==========================================================================================
  {
    id: "kimlik",
    title: "2. Kimlik ve Oturum",
    summary: "Kayıt, giriş, iki adımlı doğrulama, oturum ömrü, misafir kapısı.",
    pages: [
      {
        id: "kayit",
        title: "2.1 Kayıt ve giriş akışı",
        body: `Kayıt: kullanıcı rol (araç sahibi / tamirci), ad, e-posta ve telefon verir. Şifreyi KULLANICI SEÇMEZ — backend rastgele bir şifre üretip e-postayla gönderir.

## Neden şifreyi kullanıcı seçmiyor
Zayıf şifre sorununu kaynağında kesiyor ve e-posta adresinin gerçekten kullanıcıya ait olduğunu ilk adımda doğrulamış oluyoruz.

## Giriş iki adımlı
E-posta + şifre doğrulanınca oturum HENÜZ verilmez; e-postaya 6 haneli kod gider. Kod doğrulanınca gerçek oturum token'ı üretilir.

## Geliştirme kolaylığı
SMTP ayarlı değilse backend üretilen şifreyi/kodu API yanıtına ekler ve arayüz bunu ekranda gösterir. Bu dal yalnızca e-posta gönderilemediğinde çalışır; gerçek kurulumda hiç tetiklenmez.

## Rol girişte sorulmaz
Hesabın araç sahibi mi tamirci mi olduğunu backend e-postadan bulur. Kullanıcıya "hangi roldesin" diye sormak gereksiz bir adımdı.`,
      },
      {
        id: "oturum",
        title: "2.2 Oturum yönetimi",
        body: `Oturumlar veritabanındaki sessions tablosunda tutulur. Saklanan şey token'ın KENDİSİ değil, SHA-256 ÖZETİDİR.

## Neden veritabanı, neden özet
Önceden token'lar yalnızca sunucu belleğindeydi; sunucunun her yeniden başlayışında herkes sessizce çıkış yapmış oluyordu (geliştirmede dakikada bir, canlıda her dağıtımda). Veritabanına taşıdık. Token'ın kendisini yazmıyoruz: veritabanı sızsa bile özetlerden kullanılabilir token üretilemez.

## Ömür
7 gün. Süresi dolan kayıtlar hem okuma anında hem saatlik temizlikle silinir.

## Token nerede duruyor
Tarayıcıda localStorage'da. BİLİNEN SINIR: bir XSS açığı token'ı okuyabilir. Bu yüzden kullanıcı içeriğinden gelen bağlantılar denetleniyor (bkz. Güvenlik). Kalıcı çözüm httpOnly çerez; henüz yapılmadı.

## Oturum düşerse
Herhangi bir isteğe 401 gelirse yerel oturum temizlenir ve giriş kapısı açılır. Eskiden arayüz bunu fark etmiyordu: kullanıcı "giriş yapmış" görünüyor, her işlemde uyarı alıyor ama giriş ekranı açılmadığı için çıkışı olmayan bir döngüde kalıyordu. İki istisna: yönetici token'ından gelen 401 ve giriş ekranındaki "yanlış şifre" 401'i.`,
      },
      {
        id: "kapi",
        title: "2.3 Misafir kapısı (auth gate)",
        body: `Korumalı bir işlem misafirken tetiklenirse ekran DEĞİŞMEZ; üstte bir giriş penceresi açılır ve giriş bitince kullanıcının başlatmak istediği işlem otomatik devam eder.

## Neden ekran değişmiyor
Kişi randevu formunu doldurmuş, saat seçmiş olabilir. Onu giriş sayfasına göndermek bütün emeği çöpe atardı. Alttaki ekran mount'lu kaldığı için form kaybolmuyor.

## Kapılanan işlemler
Randevu onaylama, teklif gönderme, mesaj, favori, kayıtlı arama, ilan yayınlama, iş başvurusu, araç ekleme.

## Araç ekleme neden kapılı
Araç kişinin hesabına kaydediliyor; oturum yokken kaydedilecek bir yer yok. Eskiden misafir formu baştan sona dolduruyor, kaydet deyince istek sessizce boşa gidiyordu.`,
      },
    ],
  },

  // ==========================================================================================
  {
    id: "owner",
    title: "3. Araç Sahibi Akışları",
    summary: "Arama, garaj, randevu, teklif, mesaj, ilan verme.",
    pages: [
      {
        id: "anasayfa",
        title: "3.1 Ana sayfa",
        body: `Siteye giren herkesin (misafir dâhil) gördüğü ilk ekran. Üstte arama kutusu, altında popüler hizmetler, öne çıkan tamirciler ve ilanlar, en altta alt bilgi.

## Logo her yerde ana sayfaya götürür
Logo, kullanıcının en güvendiği kaçış yoludur: "kaybolduysam logoya basarım". Bu yüzden her kullanıcı ekranında bulunur ve testte denetlenir. Logo oturumu ve rolü DEĞİŞTİRMEZ — giriş yapmış bir tamirci logoya basınca kendini araç sahibi rolünde bulmamalı.

## Kayıt sonrası buraya dönülür
Yeni kayıt olan kullanıcı karşılama turunu kapatınca ana sayfada bırakılır; turun bulanık arka planında da bu sayfa görünür.`,
      },
      {
        id: "arama",
        title: "3.2 Arama ve filtreleme",
        body: `Tamirci, araç ilanı ve iş ilanı için ayrı listeler var; hepsi aynı arama kutusunu paylaşır.

## Filtreler
Şehir/konum, mesafe, marka, hizmet, puan, fiyat aralığı, açık/kapalı. Araç ilanlarında ayrıca yıl, km, yakıt, vites, kasa tipi ve daha fazlası.

## Mesafe
Konum izni verilirse gerçek koordinat, verilmezse şehir merkezine göre TAHMİNİ mesafe kullanılır ve bu kullanıcıya açıkça yazılır.

## Kayıtlı aramalar
Bir filtre kombinasyonu kaydedilebilir; hesapla birlikte kalıcıdır.

## Metin araması NULL-güvenli
Arama alanları veritabanında boş olabildiği için karşılaştırmalar lc() yardımcısıyla yapılır. Doğrudan .toLowerCase() çağrısı geçmişte tüm aramayı çökerten gerçek bir hataya yol açtı; test bu deseni artık yasaklıyor.`,
      },
      {
        id: "garaj",
        title: "3.3 Garaj (Araçlarım)",
        body: `Kullanıcı araçlarını kaydeder; randevu ve teklif akışları bu listeden beslenir.

## Marka ve model listeden seçilir
Marka serbest metin olduğunda tamircinin marka bazlı fiyat anahtarıyla eşleşmiyordu ("bmw" ≠ "BMW") ve kişi kendi markasının fiyatını göremiyordu. Artık ikisi de yazarak süzülen listelerden seçiliyor; listede olmayan araçlar için serbest yazma açık. Marka değişince model temizlenir (BMW/Clio gibi imkânsız çift oluşmasın).

## Randevuda eklenen araç
"Bu aracı araçlarıma kaydet" onay kutusu vardır, varsayılan işaretli. Kapatılırsa araç yalnızca o randevu için kullanılır ve garaja yazılmaz — başkasının aracını servise götürme durumu için.

## Hatırlatmalar
Muayene, bakım ve sigorta tarihlerinden bakım hatırlatmaları türetilir. Bu yüzden tarihlerin MANTIKLI olması şart (bkz. Veri Doğrulama).`,
      },
      {
        id: "randevu",
        title: "3.4 Randevu alma",
        body: `Adımlar sırayla: araç → hizmet → tarih/saat → arıza açıklaması. Sıra rastgele değil: ARAÇ seçimi hizmet fiyatlarını belirliyor.

## Fiyat araca göre
Tamirci hizmetleri marka bazında fiyatlandırabilir. Araç seçilince liste o markanın fiyatlarıyla gelir ve fiyatın yanında marka rozeti çıkar. Araç sonradan değiştirilirse SEÇİLİ hizmetin fiyatı da tazelenir — aksi halde özet kartı eski markanın fiyatında kalıyordu.

## Ödeme adımı yok
Randevu alırken kart bilgisi istemek gereksiz bir sürtünmeydi; iş yapılmadan para alınmıyor. Tamircinin KABUL ETTİĞİ ödeme yöntemleri bilgi olarak özet kartında gösterilir.

## Pahalı hizmet onayı
Belirli bir tutarın üzerindeki sabit fiyatlı hizmetlerde kullanıcının tutarı onayladığını işaretlemesi istenir.

## Geçmiş paylaşımı
Kullanıcı, aracının bakım geçmişini tamirciyle paylaşmayı seçebilir (varsayılan açık, kapatılabilir).`,
      },
      {
        id: "teklif",
        title: "3.5 Çoklu fiyat teklifi",
        body: `Kullanıcı bir işi tarif eder, birden çok tamirciye aynı anda gönderir, gelen teklifleri karşılaştırır.

## Neden kapıda giriş isteniyor
Akış kullanıcının KAYITLI ARAÇLARI üzerinden çalışıyor; misafirin aracı yok. Bu yüzden diğer akışlardaki "son adımda sor" deseninden farklı olarak modal açılırken kapılanıyor.

## Fotoğraflar
Arıza fotoğrafları data URI olarak saklanır. Geçici blob adresleri sayfa yenilenince ölüyordu.

## Teklif kabulü
Kabul edilen teklif randevu ekranını hazır verilerle açar.`,
      },
      {
        id: "mesaj",
        title: "3.6 Mesajlar",
        body: `Solda sohbet listesi, sağda seçili sohbet (masaüstü). Mobilde sohbet seçilince liste gizlenir ve geri oku çıkar.

## Neden iki panel
Önceden kart ızgarası vardı ve bir sohbete girmek ayrı bir ekrana götürüyordu; iki kişiyle yazışırken sürekli ileri-geri gerekiyordu. Tamirci tarafı zaten doğru deseni kullanıyordu, araç sahibi tarafı da aynı oldu.

## Çeviri
Mesajlar karşı tarafın diline otomatik çevrilebilir. Çeviri sonucu veritabanında önbelleğe alınır; aynı metin bir daha dış servise gitmez. Arayüzde çeviri gösterimi tek bir bileşen üzerinden yapılır (TranslatedText): orijinal/çeviri geçişi ve yükleniyor durumu her yerde aynı davranır.

## Sohbetten randevuya
Sohbet başlığındaki düğme o tamirciyle randevu ekranını açar. Sohbetin tamirci bağlamı ile randevu ekranının seçili tamircisi burada eşitlenir; eşitlenmezse YANLIŞ tamirciyle randevu açılırdı.`,
      },
    ],
  },

  // ==========================================================================================
  {
    id: "mechanic",
    title: "4. Tamirci Akışları",
    summary: "Panel, talepler, hizmet ve fiyatlar, çalışma saatleri, ilanlar, analiz.",
    pages: [
      {
        id: "panel",
        title: "4.1 Panel ve sekmeler",
        body: `Sekmeler: Profil, Randevular, Mesajlar, İlanlarım, Favoriler, Analiz, Teklifler.

## Profil sekmesi
Kimlik bilgileri, kapak fotoğrafı, hizmetler ve fiyatlar, çalışma saatleri, hizmet verilen markalar, kabul edilen ödeme yöntemleri, IBAN.

## IBAN görünürlüğü
IBAN, banka adı ve hesap sahibi toplu tamirci listesinde DÖNMEZ; yalnızca tamircinin kendi profil ayarlarında tek kayıt uç noktasından çekilir.

## Randevu talepleri
Aktif ve geçmiş olarak ikiye ayrılır. Otomatik kabul açıksa gelen randevular doğrudan "Sırada" olur, kapalıysa "Onay Bekliyor".`,
      },
      {
        id: "hizmet",
        title: "4.2 Hizmetler ve fiyatlandırma",
        body: `Hizmetler kataloğu 12 kategori / 84 hizmetten oluşur ve üç dilde tanımlıdır. Tamirci katalogdan seçer, dilerse kendi hizmetini ekler.

## Marka bazlı fiyat
Aynı iş markaya göre farklı tutabilir (kapı tamiri BMW'de başka, Toyota'da başka). Fiyat anahtarları marka listesinden seçilir. Eşleşme büyük/küçük harf duyarsızdır (tr-TR kurallı), böylece marka seçici gelmeden önce kaydedilmiş eski araçlar da doğru fiyata bağlanır.

## Sabit ve değişken fiyat
Sabit fiyatlı hizmetler önceden bilinen tutarlıdır; değişkenler ekspertiz sonrası netleşir. Sabit işaretlenip fiyatı boş bırakılan bir hizmet kaydedilemez.

## Başlangıç fiyatı türetilir
Tamircinin kartında görünen "başlangıç fiyatı", hizmet listesindeki EN DÜŞÜK fiyattan hesaplanır. Eskiden elle girilen "saatlik ücret" alanı vardı; uydurma bir sayıydı, hiçbir yerde doğrulanmıyordu ve müşteriye yanlış beklenti veriyordu.`,
      },
      {
        id: "saatler",
        title: "4.3 Çalışma saatleri",
        body: `Her gün için açık/kapalı, başlangıç ve bitiş saati; ayrıca tek tek slot kapatma (öğle arası gibi).

## Kapanış saati hesabı
Slot listesi yarı açıktır: 09:00–18:00 için son slot 17:30'dur, bu son randevunun BAŞLAYABİLECEĞİ saattir. Görünen kapanış saati son slota 30 dakika eklenerek bulunur; aksi halde her tamirci gerçek kapanışından yarım saat erken görünüyordu.

## Öğle arası
Kapatılan slotlar görünen saat metnine yansır: "09:00-12:00, 13:00-18:00" gibi ayrı aralıklar olarak.

## Gün dolduğunda
O gün için boş slot kalmadıysa tamirciye bildirim gider ve ek saat açma daveti gösterilir.`,
      },
      {
        id: "ilanlar",
        title: "4.4 İlanlar ve iş ilanları",
        body: `Tamirci araç ilanı verebilir (galeri) ve iş ilanı açıp başvuru alabilir.

## Galeri paneli
Birden çok ilanı toplu yönetmek için seçim, toplu durum değiştirme ve toplu analitik vardır.

## Öne çıkarma
Ücretli bir onay akışının arkasındadır.

## Başvurular
CV bağlantısı kullanıcıdan gelir; gösterilmeden önce adres denetiminden geçer (bkz. Güvenlik).`,
      },
    ],
  },

  // ==========================================================================================
  {
    id: "takvim",
    title: "5. Randevu Takvimi Standartları",
    summary: "Slot üretimi, çalışma saatlerinin okunması, geçmiş ve dolu saatler.",
    pages: [
      {
        id: "slot",
        title: "5.1 Saatler nasıl üretiliyor",
        body: `Slotlar 30 dakikalıktır.

## Kendi hesabımız
Profildeki çalışma saatleri yapısından üretilir; kapatılan slotlar çıkarılır.

## Diğer tamirciler
İlan ettikleri çalışma saatleri METNİNDEN okunur ("Pzt: 09:00-18:00" … "Paz: Kapalı"). Dizi ETİKETE göre değil SIRAYA göre okunur (0 = Pazartesi), çünkü etiket dile göre değişir, sıra değişmez. Çift aralıklı günler (öğle arası) desteklenir.

## Saatini hiç girmemiş tamirci
Varsayılan 09:00–18:00 kullanılır. Bu bilinçli bir geri düşüş: alternatif, o tamirciye hiç randevu verilememesiydi.

## Düzeltilen gerçek hata
Eskiden kendi hesabımız dışındaki HER tamirci için saatler sabit 09:00–18:00 üretiliyordu. Profilinde "Paz: Kapalı" yazan tamirciye pazar günü randevu verilebiliyordu; müşteri kapalı dükkâna gidiyordu.`,
      },
      {
        id: "kural",
        title: "5.2 Seçilebilirlik kuralları",
        body: `Bir saat üç sebeple seçilemez: gün kapalı, saat geçmiş, saat dolu.

## Geçmiş saat
Bugün için, o anın 60 dakika sonrasından önceki saatler kapalıdır (yolda geçen süre payı). Saat 17:00'de bugünün 09:00'ını seçebilmek anlamsızdı.

## Dolu saat
Aynı tamircinin iptal/red dışındaki randevuları o saati kapatır. Dolu ve geçmiş saatler listede GÖRÜNÜR ama pasiftir — hem ekran boş kalmasın hem kişi dükkânın yoğunluğunu görsün.

## Ne kadar ileriye
90 gün. Varsayılan görünüm tek satır hafta şerididir; ay takvimi "Takvim" düğmesiyle açılır panel olarak gelir.

## Günün altındaki sayı
Hafta şeridinde her günün altında o günün boş saat sayısı yazar. Bir servis randevusunda asıl soru "hangi gün yer var" olduğu için bu, sadece açık/kapalı göstermekten daha faydalı.

## BİLİNEN SINIR
"Dolu" bilgisi bu cihazın gördüğü randevu listesinden hesaplanır. İki kişi aynı anda aynı saati seçerse çakışmayı asıl engelleyecek yer backend'dir; orada henüz slot kilidi yok.`,
      },
    ],
  },

  // ==========================================================================================
  {
    id: "dogrulama",
    title: "6. Veri Doğrulama Standartları",
    summary: "Hangi alan hangi aralıkta kabul ediliyor ve neden.",
    pages: [
      {
        id: "ilke",
        title: "6.1 İlke: kabul edilebilir değil, mantıklı",
        body: `Doğrulama "bu metin çevrilebiliyor mu" değil "bu değer gerçek dünyada mümkün mü" sorusunu sorar.

## Yaşanan hata
Sigorta bitiş tarihine 2099 yazılabiliyordu. 2099-01-01 geçerli bir tarihtir ama geçerli bir SİGORTA tarihi değildir. Aynı boşluk her sayısal alanda vardı: 9.000.000 km, 1899 model, 50.000 beygir, 99 kapı.

## Kural tek yerde
Aynı alan dört formda geçiyor (araç ekle, araç düzenle, ilan ver, ilan düzenle). Kuralı her formda tekrar yazmak, er geç birinin unutulması demekti. Kurallar utils/validation.ts içinde tanımlı, formlar oradan çağırıyor.

## Zorunluluk ayrı
Bu katman boş alanlara karışmaz; "bu alan zorunlu mu" kontrolü çağıran tarafta kalır.

## BİLİNEN SINIR
Doğrulama istemci tarafında. API'ye doğrudan istek atan biri saçma değer yazabilir; backend doğrulaması henüz yok.`,
      },
      {
        id: "araliklar",
        title: "6.2 Alan aralıkları",
        body: `Aralıklar keyfi değil, gerçek dünyadaki uç değere göre seçildi.

## Tarihler
Son muayene / son bakım: geçmişte olmalı, 1950 öncesi olamaz.
Sigorta bitiş: en fazla 3 yıl ileri, 5 yıldan eski değil. Süresi dolmuş poliçe gerçek bir durum olduğu için geçmişe izin veriliyor.

## Araç
Yıl: 1950 – (bu yıl + 1). Yeni model yılı takvim yılından önce satışa çıkar.
Kilometre: 0 – 1.500.000. Ticari araçlarda bile uç değer.
Fiyat: 1 – 100.000.000.
Motor gücü: 1 – 2000 HP.
Motor hacmi: 0.6–10 litre ya da 600–10.000 cc (iki yazım da kabul).
Kapı 2–7, koltuk 1–9, kaçıncı el 0–30.
Yakıt tüketimi 1–40 L/100km, CO₂ 0–600 g/km, batarya 1–300 kWh, menzil 1–1500 km.

## Hizmet
Hizmet fiyatı 0 – 1.000.000 (0 = ücretsiz kontrol).
Garanti 0 – 3650 gün.`,
      },
    ],
  },

  // ==========================================================================================
  {
    id: "gezinme",
    title: "7. Gezinme ve Durum",
    summary: "Ekran state'i, geri/ileri tuşu, sayfa yenileme, kaydırma.",
    pages: [
      {
        id: "ekran",
        title: "7.1 Ekranlar ve geçmiş",
        body: `URL yönlendiricisi YOK. Gezinme React state'inde tutulur (screen + sekme alanları).

## Geri/ileri tuşu
Gezinme durumunun anlık görüntüsü tarayıcı geçmişine yazılır; geri/ileri basılınca o görüntü geri yüklenir. Tam bir router değil ama kullanıcının beklediği davranışı karşılıyor.

## Modallar geçmişe yazılmaz
Her modal açılışını geçmişe yazmak, kullanıcının geri tuşuna arka arkaya basmasını gerektirirdi.

## Sayfa yenileme
Gezinme durumu sekme bazında (sessionStorage) saklanır ve açılışta İLK RENDER ile geri yüklenir. Bilerek geri yüklenmeyenler: yarım kalmış kimlik akışı, sohbet, yönetici paneli ve randevu formu (seçimler saklanmıyor; tamircinin sayfasına düşülür).

## BİLİNEN SINIR
Adres çubuğu değişmediği için bağlantı paylaşarak derin sayfa açılamıyor. Gerçek çözüm URL tabanlı yönlendirme.`,
      },
      {
        id: "kaydirma",
        title: "7.2 Kaydırma davranışı",
        body: `Ekran değişince sayfa en üste alınır.

## Neden gerekli
Tek sayfa uygulamasında yeni belge yüklenmediği için tarayıcı kaydırma konumunu korur. Alt bilgideki bir bağlantıya tıklayan kullanıcı yeni sayfayı yine altta açılmış görüyordu.

## İç kapsayıcılar
Bazı ekranlar pencereyi değil kendi overflow-y-auto kapsayıcılarını kaydırır. Onlar da sıfırlanır ve bu, React DOM'u değiştirdikten SONRA yapılır.`,
      },
    ],
  },

  // ==========================================================================================
  {
    id: "tasarim",
    title: "8. Tasarım Standartları",
    summary: "Renk, biçim, düzen, bileşen desenleri.",
    pages: [
      {
        id: "dil",
        title: "8.1 Görsel dil",
        body: `Ana renk rose-600. Vurgu ve seçili durumlar bu renkte; gri tonlar metin ve kenarlıklarda.

## Biçim
Kartlar rounded-3xl, düğmeler rounded-xl/2xl, küçük rozetler rounded-full. Gölge hafif (shadow-sm), yükselme hover'da.

## Kart deseni
Beyaz zemin + border-gray-100 + rounded-3xl. Site genelinde tek desen; yeni ekranlar bunu tekrar eder.

## Genişlik
İçerik max-w-7xl kapsayıcılarda ortalanır. Tam sayfa ekranlarda dış kabuk max-w-none olmalı; bu listeye eklenmeyen bir ekran dar kapsayıcıda sıkışır (test bu kuralı denetliyor).

## Boş durumlar
Her liste için ikon + tek cümlelik açıklama. Boş ekran bırakılmaz.`,
      },
      {
        id: "bilesen",
        title: "8.2 Bileşen kuralları",
        body: `## Bileşen tanımı modül düzeyinde
Bir bileşen başka bir bileşenin İÇİNDE tanımlanmaz. Her render'da yeni bir tür üretir ve React alttaki tüm ağacı söküp yeniden kurar: kaydırma konumu, odak ve alt bileşen durumu kaybolur. Bu, gerçekten yaşandı — randevu ekranında gün seçince sayfa en üste zıplıyor, form alanlarında her harften sonra odak kaçıyordu.

## Katman sırası
Konumlandırılmış bir öğe, sonraki konumsuz kardeşlerinin üstüne boyanır. Banda binen kartlar konumlandırılmalıdır. Bildirim paneli her zaman kartın ve sekmelerin üstünde olmalıdır.

## Seçiciler
Uzun listelerden seçim yazarak süzülen kutu (ComboBox) ile yapılır; serbest yazma açık kalır çünkü hiçbir liste her durumu kapsamaz.

## Mobil/masaüstü
İki panelli düzenler mobilde tek panele iner; seçim yapılınca liste gizlenir ve geri oku çıkar.`,
      },
      {
        id: "erisim",
        title: "8.3 Erişilebilirlik",
        body: `## Adlandırma
Yalnızca ikon içeren her düğmenin aria-label ya da title değeri olmalı. Ekran okuyucu için "düğme" tek başına hiçbir şey ifade etmez.

## Klavye
Tıklanabilir görünen her öğe klavyeyle de erişilebilir olmalı (gerçek button/a öğesi ya da tabIndex + tuş işleyici).

## Modal
Escape ile kapanmalı; kullanıcıyı içeride hapsetmemeli.

Bu üç kural testte denetleniyor.`,
      },
    ],
  },

  // ==========================================================================================
  {
    id: "i18n",
    title: "9. Çok Dillilik",
    summary: "Üç dil, anahtar yapısı, otomatik çeviri.",
    pages: [
      {
        id: "anahtar",
        title: "9.1 Arayüz metinleri",
        body: `Türkçe, İngilizce, Almanca. Her metin data/i18n.ts içinde { tr, en, de } olarak tanımlı ve çeviri fonksiyonu (t) ile anahtar üzerinden okunur.

## Değişken yerleştirme
Metin içine {ad} yazılır, çeviri çağrısına verilen nesneyle doldurulur.

## Sabit metin yasak
Ekrana yazılan hiçbir metin kodun içinde sabit durmamalı. Karşılama turunun metinleri sabit Türkçeydi; site başka dile alınsa bile kullanıcının gördüğü İLK ekran Türkçe kalıyordu.

## Test
Kullanılan her anahtarın tanımlı olduğu ve her anahtarın üç dilde bulunduğu testle denetleniyor. tsc bu hata sınıfını yakalayamaz: tanımsız bir anahtarla yapılan çağrı sorunsuz derlenir, ekranda ham anahtar adı görünür.

## Ülke/dil tahmini
Açılış dili cihazın saat dilimi ve tarayıcı dilinden tahmin edilir. Hiçbir kişisel veri sunucuya gitmez, IP işlenmez.`,
      },
      {
        id: "ceviri",
        title: "9.2 Kullanıcı içeriğinin çevirisi",
        body: `Mesajlar, ilan açıklamaları, yorumlar ve randevu notları karşı tarafın diline çevrilebilir.

## Servisler
Önce anahtarsız Google uç noktası, olmazsa MyMemory. Her ikisinde de 3 saniyelik zaman aşımı var.

## Önbellek
Sonuçlar veritabanında saklanır; aynı metin/dil çifti bir daha dış servise gitmez.

## Hata durumu
Çeviri başarısız olursa orijinal metin gösterilir; kullanıcı "çeviri hatası" görmez.`,
      },
    ],
  },

  // ==========================================================================================
  {
    id: "guvenlik",
    title: "10. Güvenlik Standartları",
    summary: "Yetkilendirme, girdi denetimi, başlıklar, bilinen riskler.",
    pages: [
      {
        id: "yetki",
        title: "10.1 Yetkilendirme",
        body: `## Sahiplik istemciden gelmez
Bir kaydın sahibi (ownerId/mechanicId) İSTEMCİDEN DEĞİL oturumdan alınır. İstemci "ownerId: 9999" gönderse bile yok sayılır. Sahiplik alanı düzenleme ile devredilemez.

## Özel ve açık veriler
Araçlar, randevular ve destek talepleri tamamen özeldir: girişsiz kimse göremez. Tamirciler, araç sahipleri, ilanlar ve iş ilanları pazar yeri gezinmesi için okumada açıktır; yazma her zaman sahiplik kontrolüne tabidir.

## Yönetici
Ayrı token. Yönetici uçları token olmadan çalışmaz; blog yazma/düzenleme/silme dahil.

## Hız sınırlama
Kayıt, giriş, OTP ve analitik olay gönderimi IP bazlı sınırlıdır.`,
      },
      {
        id: "girdi",
        title: "10.2 Girdi ve çıktı denetimi",
        body: `## Bağlantılar
Kullanıcıdan gelen adresler (ekspertiz raporu linki, CV bağlantısı) gösterilmeden önce safeHref denetiminden geçer. İzin verilenler: http, https, mailto, tel ve yalnızca zararsız data türleri.

Neden: href yalnızca http olmak zorunda değil. "javascript:" ile başlayan bir adres yazan kötü niyetli bir satıcı, o linke tıklayan HER ziyaretçinin tarayıcısında kod çalıştırabilir ve oturum token'ını çalabilirdi. Bu klasik bir DEPOLANMIŞ XSS: saldırgan bir kez kaydeder, kurbanlar sonradan tetikler.

## HTML basılmıyor
dangerouslySetInnerHTML hiçbir yerde kullanılmıyor. Blog ve el kitabı gövdeleri düz metin + basit başlık olarak işleniyor.

## SQL
Tüm sorgular parametreli. Sorgu metnine giren tek değişken tablo adıdır ve o da sunucu tarafı sabittir.

## Yanıt başlıkları
X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy gönderiliyor; x-powered-by kapalı.

## CORS
İzin verilen originler ortam değişkeninden okunur. Ayarlanmamışsa yalnızca localhost'a izin verilir.`,
      },
      {
        id: "riskler",
        title: "10.3 Bilinen riskler",
        body: `Bunlar bilinen ve kabul edilmiş sınırlardır; gizlenmiyor, kayıt altına alınıyor.

## Token localStorage'da
Bir XSS açığı token'ı okuyabilir. Kalıcı çözüm httpOnly çerez.

## Backend doğrulaması yok
Alan aralıkları yalnızca istemcide denetleniyor.

## Slot kilidi yok
Aynı saate iki eşzamanlı randevu backend tarafından engellenmiyor.

## Ödeme gerçek değil
Öne çıkarma akışındaki ödeme bir gösterimdir; gerçek bir ödeme sağlayıcısı bağlı değil.

## Sunucu tarafı render yok
Blog ve alt bilgi bağlantıları yalnızca JavaScript çalıştıran botlarca görülür.`,
      },
    ],
  },

  // ==========================================================================================
  {
    id: "analitik",
    title: "11. Analitik ve Ölçüm",
    summary: "Hangi olaylar toplanıyor, kim görüyor.",
    pages: [
      {
        id: "olay",
        title: "11.1 Olay toplama",
        body: `Olaylar istemcide biriktirilip toplu gönderilir; her tıklamada ayrı istek atılmaz.

## Beyaz liste
Yalnızca tanımlı olay adları kabul edilir, bilinmeyenler sessizce atılır. Alanlar uzunluk sınırına kırpılır.

## Ziyaretçi kimliği
Anonim bir ziyaretçi ve oturum kimliği kullanılır; kişisel veri toplanmaz.

## Kim görüyor
Toplu raporlar yalnızca yöneticiye açıktır. Tamirci yalnızca KENDİ profiline ait sayıları görebilir; bu, oturumdan doğrulanır.

## Tamirciye özel içgörü
"Şehrindeki talep" bloğu, tamircinin bulunduğu şehirde en çok aranan hizmetleri gösterir. Kişi bazlı hiçbir veri içermez.`,
      },
    ],
  },

  // ==========================================================================================
  {
    id: "blog",
    title: "12. Blog ve SEO",
    summary: "İçerik motoru, arama motoru bağlantıları.",
    pages: [
      {
        id: "icerik",
        title: "12.1 İçerik ve bağlantı",
        body: `Yazılar insanların Google'a gerçekten yazdığı sorulara göre kurgulandı ("jant tamiri kaç para", "klima soğutmuyor").

## Hizmete bağlanma
Her yazı katalogdaki bir hizmete bağlıdır. Yazının içindeki ve sonundaki düğme, o hizmeti veren tamircilerin FİLTRELENMİŞ listesini açar. Blog trafiğinin işe dönüştüğü yer burasıdır.

## Filtre temizleme
Hizmet filtresi uygulanırken diğer filtreler temizlenir; aksi halde okuyucu eski bir mesafe/puan filtresi yüzünden boş listeyle karşılaşırdı.

## Slug
Türkçe karakterler ASCII'ye çevrilir, benzersizleştirilir ve başlık değişse bile DEĞİŞMEZ (eski bağlantılar kırılmasın).

## SEO altyapısı
sitemap.xml, robots.txt ve yazı sayfalarında JSON-LD var.

## BİLİNEN SINIR
Kapak görselleri konuya göre etiketlenmiş STOK fotoğraflardır, üretilmiş değildir.`,
      },
    ],
  },

  // ==========================================================================================
  {
    id: "test",
    title: "13. Test Standartları",
    summary: "Ne test ediliyor, nasıl çalıştırılır, hangi kurallar zorunlu.",
    pages: [
      {
        id: "harness",
        title: "13.1 Test düzeni",
        body: `Tek komut: node tests/run.mjs. Başarıda tek satır yazar, ayrıntı yalnızca hata olunca çıkar.

## Kapsam
tsc tip denetimi + her backend dosyasının sözdizimi + 12 test takımı.

## Takımlar
arama, fiyatlandırma, gezinme, akışlar, i18n, ui, null-güvenliği, blog, randevu takvimi, araç formu, güvenlik, doğrulama.

## Neden kaynak dosyaları tarıyor
Bu ortamda tarayıcı yok. UI kuralları gerçek kaynak dosyalar üzerinde statik olarak denetleniyor. Bu, gerçek bir tarayıcı testinin yerini tutmaz ama tsc'nin göremediği hata sınıflarını yakalar.

## KURAL: her yeni özellik için test
Yeni bir özellik ya da düzeltme, testsiz eklenmez. Tercihen düzeltmeden ÖNCE testin düştüğü doğrulanır — yoksa test neyi koruduğunu kanıtlamamış olur.`,
      },
      {
        id: "kurallar",
        title: "13.2 UI kuralları (1–9)",
        body: `Her biri bu projede gerçekten yaşanmış bir hatadan doğdu.

1. Banda binen kartlar konumlandırılmış olmalı.
2. Katman sırası tutarlı olmalı (bildirim > kart, bildirim > sekmeler, sekmeler > kart).
3. Yalnız ikonlu düğmelerin erişilebilir adı olmalı.
4. Tıklanabilir görünen öğe klavyeyle erişilebilir olmalı.
5. İki sütunlu ekran dar kapsayıcıya hapsedilmemeli.
6. Her kullanıcı ekranında Fixperto logosu bulunmalı.
7. Araç markası serbest metin kutusuyla girilmemeli.
8. Bileşenler modül düzeyinde tanımlanmalı.
9. Karşılama turu ekrana bağlanmamalı, arkasındaki sayfa gizlenmemeli.`,
      },
    ],
  },

  // ==========================================================================================
  {
    id: "calisma",
    title: "14. Çalışma Düzeni",
    summary: "Kurulum, komutlar, bakım kuralları.",
    pages: [
      {
        id: "komut",
        title: "14.1 Çalıştırma",
        body: `İki ayrı terminal gerekir.

Backend: cd backend && npm install && npm run dev (http://localhost:4000)
Frontend: cd frontend && npm install && npm run dev (http://localhost:5173)
Testler: node tests/run.mjs

## better-sqlite3 hatası
Node sürümü değiştiğinde "NODE_MODULE_VERSION" hatası verir; çözüm npm rebuild better-sqlite3.

## Veritabanı
backend/db klasöründeki SQLite dosyası. Şema değişiklikleri açılışta göç (migration) olarak uygulanır; mevcut veriler korunur.`,
      },
      {
        id: "bakim",
        title: "14.2 Bakım kuralları",
        body: `## El kitabı güncel tutulur
Yeni bir özellik eklendiğinde ya da davranış değiştiğinde ilgili sayfa AYNI COMMIT'te güncellenir. Bu kural teste bağlı: components/features altındaki her bileşen el kitabında geçmek zorunda.

## Her özellik testli gelir
Bkz. Test Standartları.

## Kararların gerekçesi yazılır
Bir davranış "neden böyle" sorusunu doğuruyorsa, cevabı ya kod yorumunda ya bu el kitabında olmalı. Amaç: altı ay sonra "bu bir hata mı, yoksa bilerek mi böyle" sorusuna bakarak cevap verebilmek.

## Bilinen sınırlar gizlenmez
Yapılmamış ya da yarım kalan şeyler "Bilinen riskler" ve ilgili sayfalarda açıkça yazılır.`,
      },
    ],
  },
];

/** Arama için düz liste: bölüm başlığı + sayfa başlığı + gövde. */
export const HANDBOOK_PAGES = HANDBOOK.flatMap((s) =>
  s.pages.map((p) => ({ sectionId: s.id, sectionTitle: s.title, ...p })),
);
