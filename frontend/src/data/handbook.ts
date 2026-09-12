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

## Onay anında yeniden doğrulama
Seçim ile onay arasında dakikalar geçebiliyor (giriş kapısı açılıyor, kullanıcı sekmeyi bırakıp dönüyor). Buton yalnızca "seçimler dolu mu" diye bakıyordu: 13:55'te 14:00'ı seçip 14:30'da onaylayan kullanıcı GEÇMİŞE randevu alıyordu, bu arada aynı saati başkası kaptıysa iki randevu aynı saate düşüyordu. Artık onay anında saat yeniden sorgulanıyor; geçmiş ya da dolu ise randevu oluşturulmuyor, saat seçimi düşürülüyor ve nedeni yazılıyor. Kontrol, ölçüm ve kayıttan ÖNCE yapılıyor — reddedilen bir randevu "alındı" diye sayılmamalı.

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

## Sabit / Değişken seçimi tek düğme DEĞİL
Eskiden tek bir düğme vardı ve üzerinde MEVCUT durum yazıyordu. "Değişken" yazan düğmeye basmak "değişkeni seç" değil "sabite geçir" demekti; fiyat vermek istemeyen tamirci "Değişken"e bastığında "önce bir fiyat girin" uyarısı alıyordu — yani uyarı, kullanıcının niyetinin TAM TERSİNİ engelliyordu. Artık iki ayrı seçenek var. "Değişken" her zaman serbesttir, hiçbir rakam gerektirmez; uyarı yalnızca tamirci açıkça "Sabit" dediğinde çıkar, çünkü rakamsız sabit fiyat müşteriye hiçbir şey anlatmaz.

## Uzun hizmet listesi sayfayı ele geçirmez
Tamirci sayfasında kapalı hâlde 6 hizmet gösterilir. "Tümünü gör" listeyi OLDUĞU GİBİ açıyordu; 50 hizmeti olan bir tamircide sayfa metrelerce uzuyor, altındaki çalışma saatleri ve yorumlar pratikte erişilemez hâle geliyordu. Artık açık hâlde de bir tavan var: 10 satır görünür, gerisi kutunun KENDİ İÇİNDE kaydırılır. 10 ve altı hizmette kaydırma kutusu hiç açılmaz — gereksiz bir kutu, düz listeden kötüdür. Kaydırılabildiği ayrıca yazıyla da söylenir ("{total} hizmetten {shown} tanesi görünüyor"), çünkü kullanıcı listenin bittiğini sanıp kaydırmayı denemeyebilir.

## Fiyatsız hizmet gizlenmez
Değişken işaretlenmiş ve fiyatı boş bir hizmet, araç sahibinin randevu ekranındaki listede GÖRÜNÜR — yanında "Değişken" rozeti ve rozetin yanında "?" ipucu ile. Hizmeti listeden çıkarmak, tamirciyi "uydurma bir rakam yaz" ile "bu işi hiç sunmuyormuş gibi görün" arasında seçime zorlardı.

## Düzeltilen yanlış açıklama
Hizmet ekranındaki yardım metni "sabit fiyatlı hizmetler araç sahiplerine ÖNCEDEN ÖDEME seçeneğiyle gösterilir" diyordu. Randevudaki ödeme adımı kaldırıldığı için (bkz. 3.4) bu cümle olmayan bir özelliği anlatıyordu — tamirci, müşterinin parayı peşin yatırdığını sanabilirdi. Metin gerçeğe çevrildi: sabit fiyat, araç sahibine randevu alırken KESİN tutar olarak gösterilir, tahsilat serviste yapılır; fiyat değişkense işaretlenmez ve "başlangıç fiyatı" olarak görünür.

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
      {
        id: "telefon",
        title: "6.3 Telefon numarası",
        body: `Telefon, sitedeki en kritik iletişim alanı: randevu değişince tamirci müşteriyi ARAR. Yanlış kayıtlı bir numara, randevunun sessizce kaybolması demektir.

## Yaşanan iki hata
1) "+" işareti ZORUNLUYDU. Kimse telefonunu "+90 532…" diye yazmaz; "0532…" yazar ve form reddediyordu. Ülke kodunu kullanıcıya yazdırmak yerine BİZ ekliyoruz.
2) Denetim sadece "ülke kodundan sonra 10 hane" diyordu. "+90 876 000 00 00" kabul ediliyordu — oysa Türkiye'de 8 ile başlayan abone numarası YOKTUR. Sistem, telefon numarası olmayan bir şeyi telefon numarası diye kaydediyordu.

## Kural
Girdi önce temizlenir (boşluk, parantez, tire, nokta; baştaki "00" → "+"), sonra ulusal numaraya indirgenir (baştaki 0 atılır) ve GERÇEK numara planına göre denetlenir:
Türkiye — cep: 50(1–9), 53x, 54x, 55x, 56(0–6) + 7 hane. Sabit hat: alan kodu 2/3/4 ile başlar, toplam 10 hane. 8 ve 9 ile başlayanlar abone numarası değildir (özel servis/ücretli hat), reddedilir.
Almanya — cep: 15x / 16(0,2,3,8,9) / 17x. Sabit hat: alan kodu 2–9 ile başlar, 6–12 hane. 0180/0137/011x gibi servis numaraları reddedilir.

## Ülke tahmini kullanıcıya sorulmaz
Varsayılan ülke saat diliminden tahmin edilir (bkz. detectCountryCode) — Almanya'daki kullanıcı "0151…" yazdığında Alman numarası olduğu anlaşılır. 5 ile başlayan 10 haneli numara ise tahminden BAĞIMSIZ olarak Türkiye cep numarası sayılır.

## Kaydedilen biçim: +E.164
Geçerli numara her zaman "+905321234567" biçiminde kaydedilir. Aynı numaranın veritabanında iki farklı yazımla durması, sonradan "bu iki kayıt aynı kişi mi" sorusunu cevaplanamaz hale getirirdi.

## Nerede çalışır
Kayıt formu, araç sahibi profili, tamirci profili, iş başvurusu formu ve yönetici panelindeki kullanıcı düzenleme — hepsi aynı merkezden (checkPhone / normalizePhoneField) geçer. Alan odağını kaybettiği anda numara düzeltilir ya da uyarı gösterilir; kaydet düğmesine kadar beklemek hatayı fark etmeyi geciktiriyordu. "telefon" test takımı, telefon girilen HER alanın bu merkezden geçtiğini denetler — biri unutulursa test düşer.

## BİLİNEN SINIR
Bu, numaranın GERÇEKTEN VAR OLDUĞUNU doğrulamaz. Numara planına uyan ama kimseye ait olmayan bir numara kabul edilir; bunu ancak SMS doğrulaması çözer. Amaç, apaçık imkânsız numaraları kaynağında elemek.`,
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
      {
        id: "ustcubuk",
        title: "7.3 Ana sayfa üst çubuğu",
        body: `Üst çubuk giriş yapmamış ve yapmış kullanıcıya FARKLI şeyler gösterir; ikisinin ihtiyacı aynı değil.

## Misafir
"Giriş yap" ve "Kayıt ol". Aradığı şey hesabına girmek ya da hesap açmak.

## Giriş yapmış kullanıcı
"Panele dön" ve "Ayarlar". Eskiden burada "Ara" (Suchen) yazan tek bir düğme vardı: etiket kullanıcının adından geliyordu, adı boş olanlarda arama sekmesinin adına düşüyordu. Zaten ana sayfadaki arama kutusunun üstünde duran birine "Ara" demek hiçbir şey kazandırmıyordu; asıl eksik olan kullanıcının kendi alanına dönebilmesiydi.

## Hedef role göre değişir ve TEK yerde durur
goToMyPanel / goToMySettings (AppLogicProvider). Tamirci → tamirci paneli ve profil ayarları sekmesi; araç sahibi → panosu ve ayar ekranı. Bu seçimi her üst çubukta yeniden yazmak, birinin er geç yanlış ekrana gitmesi demekti.`,
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
      {
        id: "ipucu",
        title: "8.4 Bilgi baloncuğu (\"?\" ipucu)",
        body: `Arayüzdeki bazı terimler kendi başına hiçbir şey anlatmıyor: "Değişken fiyat" ne demek, şimdi para mı ödeyeceğim? "Diğer markalar" bir marka listesi mi, varsayılan fiyat mı? Bu soruların cevabını ekrana uzun uzun yazmak listeyi boğar, hiç yazmamak kullanıcıyı tahmine bırakır.

## Desen
Terimin yanına küçük bir "?" dairesi konur; üstüne gelince ya da tıklanınca birkaç cümlelik koyu bir balon çıkar. Bileşen: components/features/InfoTip.tsx. Metin daima i18n'den gelir, üç dilde yazılır.

## Neden tarayıcının title balonu yetmedi
title ~1 saniye gecikmeyle çıkar, biçimlenemez ve DOKUNMATİK cihazlarda hiç çıkmaz. Kendi balonumuz anında açılır, "?" işaretine dokunulduğunda telefonda da okunur.

## Balon sayfanın İÇİNDE değil, üstünde durur
İlk sürümde balon, "?" işaretinin yanındaki kapsayıcıda absolute olarak duruyordu ve iki şekilde bozuluyordu: (1) overflow: hidden/auto olan her ata onu KIRPIYOR — randevu ekranındaki hizmet listesi, tamirci sayfasındaki hizmet kutusu tam da böyleydi, metnin bir kısmı görünmüyordu; (2) z-index yalnızca kendi yığın bağlamında geçerli olduğu için, yeni yığın bağlamı açan bir ata (yapışkan başlık, dönüşümlü kart) balonu komşu metnin ARKASINDA bırakıyordu. Artık balon React portalıyla doğrudan body altına basılıyor ve "?" işaretinin ekran koordinatına fixed olarak konumlanıyor. Body'nin altındaki hiçbir overflow onu kıramaz, hiçbir ata onu gömemez.

## Konum kuralları
Üstte yer yoksa balon alta açılır; sağa/sola taşarsa ekran içine çekilir; genişlik dar ekranda pencereye göre daralır; uzun kelimeler bölünür ve satır sayısı kısıtlanmaz — metnin TAMAMI okunabilmeli. Sayfa kaydırılınca ya da pencere boyutlanınca balon kapanır: fixed konum bayatlar, balon ait olmadığı bir yerde asılı kalırdı.

## İki biçim
Varsayılan biçim gerçek bir düğmedir: klavyeyle sekmeyle gezilir, odaklanınca açılır. "inline" biçimi ise başka bir düğmenin İÇİNDE kullanılır (ör. randevu ekranındaki hizmet satırının kendisi bir düğmedir) — iç içe düğme geçersiz HTML'dir ve tıklamalar birbirine karışır, bu yüzden orada odaklanamayan bir span basılır ve erişilebilirlik için title korunur.

## Nerede kullanılıyor
Randevu ekranında "Değişken" rozetinin yanında, tamircinin hizmet satırındaki Sabit/Değişken seçiminde ve tamirci profilinde "Markaya göre fiyat" başlığında ("Diğer markalar" ne demek).

## Kural
İpucu, eksik tasarımın yaması değildir. Etiketin kendisi anlaşılır yazılabiliyorsa önce o düzeltilir; balon yalnızca gerçekten bir kavramın açıklanması gerektiğinde eklenir.`,
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

## Önbellek üç katmanlı
1) Sunucuda SQLite: aynı metin/dil çifti bir daha dış servise gitmez. 2) Tarayıcıda localStorage: anahtarı MESAJ KİMLİĞİ değil "kaynakDil:hedefDil:metin" — aynı cümle ikinci kez görüldüğünde (sayfa yenilendi, aynı kalıp başka bir sohbette geçti) hiç ağ isteği olmadan ANINDA basılır; en fazla 500 cümle saklanır, eskiler düşer. 3) Ekran ömrü boyunca bellekteki mesaj-kimliği önbelleği.

## Neden toplu istek
Yavaşlığın sebebi çeviri servisi değil MİMARİYDİ: her mesaj için ayrı bir HTTP isteği atılıyordu ve tarayıcı aynı sunucuya aynı anda ~6 bağlantı açabildiği için 20 mesajlık bir sohbette istekler sıraya giriyordu. Artık bir karede istenen tüm çeviriler 16 ms biriktirilip TEK isteğe (POST /api/translate/batch) konuyor. Sunucu önbellektekileri anında döndürüyor, kalanları kendi arasında paralel (8) çeviriyor ve sohbette tekrar eden aynı cümleyi bir kez çeviriyor.

## Hata durumu
Çeviri başarısız olursa orijinal metin gösterilir; kullanıcı "çeviri hatası" görmez. Başarısız sonuç ÖNBELLEĞE ALINMAZ — aksi halde servis bir kez erişilemediğinde o cümle bir daha hiç çevrilmezdi.

## Mesajın dili uydurulmuyor
Bir mesajın "hangi dilde yazıldığı" bilgisi sunucuda, gönderenin kayıtlı dilinden damgalanır. İstemcinin gönderdiği bir dil etiketine güvenilseydi çeviri yanlış yönde yapılabilirdi.

## Hız sınırı gerçek kullanımı engellemiyor
Sayaç yalnızca DIŞ SERVİSE giden istekleri sayar (önbellek isabetleri bedava) ve 5 dakikalık kayan pencerede çalışır. Eskiden sayaç ömür boyu birikiyordu: uzun bir oturumda sohbetleri gezen sıradan bir kullanıcı sınıra çarpıyor, çeviri sessizce ölüyordu.`,
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

## Korumalı sütunlar (kitlesel atama)
Sahiplik kontrolü "bu satır senin mi" sorusunu cevaplar; "bu SÜTUNU değiştirebilir misin" sorusunu değil. İkincisi sorulmadığı için bir tamirci kendi satırına verified:1 yazıp "doğrulanmış" rozetiyle görünebiliyor, askıya alınmış bir kullanıcı status:"active" yazıp askıyı kaldırabiliyordu. Artık bu sütunlar (verified, verificationDocs, status, shareCount, vehicleCount, apptCount, avgResponseMinutes, distance) admin dışında kimseden kabul edilmiyor; gövdeden sessizce düşürülüyor, isteğin meşru alanları işlenmeye devam ediyor. Ayrıca tabloda GERÇEKTEN bulunmayan sütun adları SQL'e hiç ulaşmıyor.

## Mesaj gönderen kimliği
Sohbet mesajı eklemenin tek yolu POST /api/conversations/:id/messages. Gönderen ve dil sunucuda oturumdan damgalanır, ekleme sunucudaki güncel dizinin sonuna yapılır. Eskiden mesaj dizisi PATCH ile topluca yazılıyordu: bir taraf karşı tarafın ağzından mesaj uydurabiliyor ve aynı anda gelen mesaj sessizce siliniyordu. Aynı nedenle "tamirci otomatik yanıtı" demosu da kaldırıldı — kullanıcı gerçekten cevap aldığını sanıyordu.

## Hız sınırlama
Kayıt, giriş, OTP, çeviri, profil görüntülenme ve paylaşım kayıtları IP bazlı sınırlıdır. Sayaç kayan pencerede çalışır: giriş denemelerinde art arda hata kilit getirir, normal kullanımda ise sınır "ömür boyu" değil "dakikada/5 dakikada" anlamına gelir.`,
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

## Kariyer sayfası
Alt bilgideki "Kariyer" bağlantısı gerçek bir sayfaya gidiyor: açık pozisyonlar, ekip değerleri ve
başvuru e-postası. İlanlar yönetici panelinden giriliyor, yani ilan açmak için kod değişmiyor.
Açık pozisyon yokken sayfa boş kalmıyor — "doğru kişi için ilan beklemiyoruz" mesajı ve iletişim
adresi gösteriliyor, çünkü kariyer sayfasına giren kişi bir sonraki adımı arıyor.

## Alt bilgi (footer) kuralı
Alt bilgideki her bağlantı GERÇEK bir hedefe gitmeli. "Kariyer" ve "Basın" bağlantıları ikisi de
Hakkımızda sayfasına gidiyordu; olmayan bir sayfayı vaat eden bağlantı, hiç bağlantı olmamasından
kötüdür — kaldırıldılar. "SSS" artık Hakkımızda sayfasındaki gerçek SSS bölümüne kaydırıyor.
Eylem bağlantıları da eylemi yapıyor: "Aracımı sat" ilan formunu açıyor (eskiden hiçbir şey
olmuyordu), "İş ilanı ver" ilan verme ekranını açıyor (eskiden iş ilanlarına BAKMA ekranını
açıyordu), "Tamirci olarak katıl" giriş yapmış bir araç sahibini tamirci paneline yollamıyor.

## Bağlantıdan sonra sayfa başa alınır
Alt bilgideki bir bağlantı yalnızca arama modunu değiştirdiğinde (araç ↔ iş ilanı) sayfa başa
alınmıyordu; kullanıcı alt bilgide kalıp "hiçbir şey olmadı" sanıyordu. Kaydırma sıfırlaması artık
mod ve alt sekme değişimlerini de kapsıyor.

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
tsc tip denetimi + her backend dosyasının sözdizimi + 19 test takımı.

## Takımlar
arama, fiyatlandırma, gezinme, akışlar, i18n, ui, null-güvenliği, blog, randevu takvimi, araç formu, güvenlik, doğrulama, el kitabı, alt bilgi bağlantıları, kariyer, telefon, hizmet fiyatı, çeviri, araç geçmişi.

## Belgeyi canlı tutan takım
"el kitabı" takımı bu belgeyi denetliyor: bölüm/sayfa yapısı, zorunlu konu listesi, bilinen sınırların yazılmış olması, yönetici panelindeki her sekmenin anlatılmış olması ve KAPSAM — components/features altındaki her bileşenin burada bir karşılığı olması. Yeni bir bileşen ekleyip belgeye dokunmazsan test düşer. Belge yazmak kolay, güncel tutmak zordur; kural yazıyla kalırsa birkaç hafta içinde unutulur.

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
    id: "admin",
    title: "14. Yönetici Paneli",
    summary: "Site sahibinin ekranı: kullanıcılar, talepler, analitik, değişiklik geçmişi.",
    pages: [
      {
        id: "adminGenel",
        title: "14.1 Sekmeler ve yetki",
        body: `Sekmeler: Genel Bakış, Kullanıcılar, Destek Talepleri, Analitik, Blog, Geçmiş, El Kitabı.

## Panele nasıl girilir
Menülerde bağlantısı YOK. İki yol var:
1) Adres çubuğuna #admin eklemek (ör. localhost:5173/#admin)
2) Klavye kısayolu: Ctrl/Cmd + Shift + A

Ayrıca arama ekranının en altında, alt bilginin ALTINDA soluk bir metin de aynı ekranı açıyor. Bu ilk yöntemdi ama site sahibi bile bulamadı: alt bilginin İÇİNDE de aynı metin var ve tıklanan çoğunlukla o oluyordu. Kısayol ve adres yöntemi bu yüzden eklendi.

## Bu bir güvenlik önlemi değil
Girişin gizli olması yalnızca tesadüfen bulunmasını zorlaştırır. Asıl koruma yönetici şifresi ve ayrı token'dır. Canlıda ortam değişkenleri ayarlanmazsa admin girişi tamamen kapalıdır (fail closed).

## Ayrı kimlik
Yönetici oturumu kullanıcı oturumundan tamamen bağımsızdır; kendi token'ıyla çalışır. Bu yüzden yönetici uçlarından gelen 401 kullanıcı oturumunu DÜŞÜRMEZ.

## Neden ayrı
Aynı kimlik sistemini paylaşsalardı, bir kullanıcı hesabının ele geçirilmesi yönetici yetkisine giden bir yol açardı.

## Veri çekme zamanı
Yönetici verileri (değişiklik günlüğü, analitik) yalnızca yönetici girişi BAŞARILI olduktan sonra çekilir. Eskiden uygulama açılışında herkes için koşulsuz çağrılıyordu.`,
      },
      {
        id: "adminCalisma",
        title: "14.2 Panel nasıl çalışır",
        body: `Panel, sitenin geri kalanıyla AYNI uygulamanın içinde ama ayrı bir dünyadır: ayrı kimlik, ayrı token, ayrı veri çekme zamanı.

## Giriş ve oturum
Yönetici e-posta + şifre ile giriş yapar (iki adımlı doğrulama YOK — bu hesap tek kişilik ve e-posta kutusuna bağımlı olmaması tercih edildi). Başarılı girişte backend bir yönetici token'ı üretir; token tarayıcının sekme belleğinde (sessionStorage) tutulur, yani sekme kapanınca oturum biter. Bu bilinçli: yönetici oturumunun günlerce açık kalması, ortak kullanılan bir bilgisayarda ciddi risk olurdu.

## İstekler nasıl imzalanır
Yönetici uçlarına giden her istek Authorization başlığına yönetici token'ını ekler. Bu ekleme API katmanında, uç nokta tanımının içinde yapılır — çağıran ekranın her seferinde hatırlaması gerekmez. Eskiden çağıran taraf ekliyordu ve unutulan bir yer sessizce 401 alan bir ekran demekti.

## Veri ne zaman çekilir
Yönetici verileri (değişiklik günlüğü, analitik, kariyer ilanları, blog taslakları) uygulama açılışında DEĞİL, yalnızca yönetici girişi başarılı olduktan sonra çekilir. Aksi halde her ziyaretçi için yetkisiz istekler gidip 401 dönerdi.

## Kullanıcı oturumundan bağımsız
Yönetici token'ından gelen 401, kullanıcı oturumunu DÜŞÜRMEZ. Bu ayrım kodda açıkça yazılı; olmasaydı panelde süresi dolan bir token, siteyi gezen kullanıcıyı da çıkışa zorlardı.

## Sekmeler ne yapar
Genel Bakış: sayılar ve son hareketler. Kullanıcılar: araç sahipleri, tamirciler, ilanlar ve iş ilanları üzerinde düzenleme/askıya alma. Destek Talepleri: gelen talepler, öncelik ve SLA. Analitik: ziyaretçi, arama ve dönüşüm raporları. Blog: yazı ekleme ve yayınlama. Kariyer: Fixperto'nun kendi iş ilanları. Geçmiş: panelden yapılan her değişikliğin kaydı ve geri alma. El Kitabı: bu belge.

## Yazma işlemleri kayda geçer
Panelden yapılan alan değişiklikleri "Geçmiş" sekmesine yazılır: hangi kayıt, hangi alan, eski ve yeni değer. Panel başkasının verisini değiştirdiği için bu kayıt olmadan yetki güvenli sayılmaz.

## Taslak/yayın ayrımı
Blog yazıları ve kariyer ilanları TASLAK olarak doğar; yayına almak ayrı ve bilinçli bir tıklamadır. Yarım kalmış bir içeriğin kazayla yayına çıkması, boş bir sayfadan daha kötüdür.`,
      },
      {
        id: "adminKariyer",
        title: "14.3 Kariyer ilanları",
        body: `Fixperto'nun KENDİ açık pozisyonları panelden açılıp kapatılır; kod değiştirmeye gerek yok. Yayındaki ilanlar sitedeki Kariyer sayfasında görünür.

## Tamirci iş ilanlarından farkı
İki ayrı tablo, iki ayrı ekran. Buradaki ilanların işvereni Fixperto; tamircilerin açtığı ilanlar iş ilanları aramasında duruyor. Aynı tabloda tutmak her sorguda "kim işveren" ayrımı yapmayı gerektirir ve tamirci ilanları listesine şirket ilanlarının karışma riskini taşırdı.

## Alanlar
Başlık, birim, konum, çalışma şekli (tam zamanlı / yarı zamanlı / staj / uzaktan), kısa özet, ilan metni, başvuru e-postası, yayın durumu.

## Başvuru neden e-posta
Site içi başvuru formu bilinçli olarak YOK. Özgeçmiş saklamak kişisel veri sorumluluğu doğurur; bu ölçekte e-posta yeterli ve dürüst bir çözüm.

## Silme onaylı
Silme geri alınamaz olduğu için onay penceresinden geçer — uygulamanın geri kalanıyla aynı kural.`,
      },
      {
        id: "adminKullanici",
        title: "14.4 Kullanıcı ve içerik yönetimi",
        body: `Araç sahipleri, tamirciler, ilanlar ve iş ilanları panelden düzenlenebilir, askıya alınabilir ya da kaldırılabilir.

## Kaldırma yumuşak
İlanlar silinmez, adminRemoved işaretiyle listelerden çıkarılır. Böylece yanlışlıkla yapılan bir kaldırma geri alınabilir ve geçmiş kayıtlar (teklifler, mesajlar) yetim kalmaz.

## Marka alanı serbest
Panelde araç markası yazarak süzülen listeden DEĞİL serbest metinle düzenlenir. Bilinçli bir istisna: yönetici yanlış girilmiş bir kaydı temizliyor olabilir. İstisna kodda açıkça işaretli ve testte tanımlı.

## Öne çıkarma
İlanları öne çıkarma yönetici tarafından da açılıp kapatılabilir.`,
      },
      {
        id: "adminTicket",
        title: "14.5 Destek talepleri",
        body: `Kullanıcılar ve tamirciler destek talebi açar; panelde tür, öncelik ve durum ile yönetilir.

## Öncelik
Talep türüne göre varsayılan bir öncelik atanır, yönetici değiştirebilir.

## SLA
Belirlenen gün sayısını aşan açık talepler işaretlenir; panelde "gecikmiş" olarak görünür.

## Kim açtı
Talebin sahibi isimle değil KİMLİKLE tutulur. Eskiden isim eşleşmesi kullanılıyordu ve aynı adı taşıyan bir tamirciyle araç sahibi karışabiliyordu.`,
      },
      {
        id: "adminGecmis",
        title: "14.6 Değişiklik geçmişi ve geri alma",
        body: `Panelden yapılan her alan değişikliği kaydedilir: hangi kayıt, hangi alan, eski ve yeni değer.

## Geri alma
Bir değişiklik geri alınabilir. Ancak aynı alan sonradan tekrar değiştiyse geri alma İŞLEMİ REDDEDİLİR — yoksa daha yeni bir düzenleme sessizce ezilirdi. Bu, gerçek bir hatanın düzeltmesidir.

## Neden kayıt tutuyoruz
Panelde yapılan bir düzenleme kullanıcının verisini değiştiriyor. "Bunu kim, ne zaman değiştirdi" sorusunun cevabı olmadan bu yetki güvenli değil.`,
      },
    ],
  },

  // ==========================================================================================
  {
    id: "bildirim",
    title: "15. Bildirimler ve Hatırlatmalar",
    summary: "Zil ikonu, tarayıcı bildirimleri, bakım hatırlatmaları.",
    pages: [
      {
        id: "bildirimAkis",
        title: "15.1 Bildirimler",
        body: `Her bildirim iki yerde birden var: uygulama içi zil ikonunda kayıtlı, ve tarayıcı izni verilmişse sistem bildirimi olarak.

## Neden ikisi birden
Tarayıcı izni verilmemişse bildirim tamamen kaybolmamalı. Zil ikonundaki kayıt her durumda tutulur.

## Kategoriler
Randevu, teklif, mesaj, başvuru ve duyuru. Kullanıcı ayarlardan kategorileri tek tek kapatabilir; kapalı kategoride hiç bildirim üretilmez.

## Tıklayınca nereye
Her bildirim bir hedef taşır (randevu, teklif, sohbet, ilan, duyuru). Tıklanınca doğru ekran ve doğru SEKME açılır. Randevu bildirimi aktif randevular sekmesini açar — kullanıcı en son "geçmiş" sekmesine bakmış olsa bile.

## Kapasite
Zil listesi son 40 kayıtla sınırlıdır; sınırsız büyüyen bir liste belleği tüketirdi.`,
      },
      {
        id: "hatirlatma",
        title: "15.2 Bakım hatırlatmaları",
        body: `Aracın muayene, bakım ve sigorta tarihlerinden hatırlatmalar türetilir.

## Türetilmiş, elle girilmez
Kullanıcı ayrı bir "hatırlatma" kaydı oluşturmaz; tarihleri girer, sistem yaklaşan işleri hesaplar. Kullanıcı isterse tek tek hatırlatmaları kapatabilir ya da kendi hatırlatmasını ekleyebilir.

## Tarihlerin doğruluğu şart
Bu yüzden tarih alanları mantık denetiminden geçer (bkz. Veri Doğrulama). 2099 tarihli bir sigorta, hatırlatma sistemini de anlamsız kılardı.

## Tekrar bildirim yok
Aynı hatırlatma için ikinci kez bildirim gönderilmez; gönderilen anahtarlar akılda tutulur.`,
      },
    ],
  },

  // ==========================================================================================
  {
    id: "karar",
    title: "16. Favoriler, Karşılaştırma ve Değerlendirmeler",
    summary: "Kullanıcının karar vermesine yardım eden araçlar.",
    pages: [
      {
        id: "favori",
        title: "16.1 Favoriler ve kayıtlı aramalar",
        body: `Hem araç ilanları hem TAMİRCİLER favorilenebilir. Favoriler hesapla birlikte kalıcıdır; cihaz değişince kaybolmaz.

## Fiyat düşünce haber
Favorilenen bir ilanın fiyatı düşerse favorileyen kullanıcılara ayrı, daha dikkat çekici bir bildirim gider. Fiyat artışı da bildirilir ama vurgusuz.

## Kayıtlı aramalar
Bir filtre kombinasyonu isimle kaydedilir ve tek tıkla geri yüklenir. Kaydedilen arama DÜZENLENEBİLİR: adı satır içinde değiştirilebilir, kriterleri "şu anki filtrelerimle güncelle" ile tazelenebilir. Eskiden yalnızca uygula/sil vardı; adını yanlış yazan kişi aramayı silip baştan kurmak zorundaydı ve sildiği anda "yeni eşleşme" takibi de sıfırlanıyordu — bir sonraki açılışta eski ilanların hepsi yeni sanılırdı.

Kriter güncelleme düğmesi YALNIZCA arama ekranında görünür; profil sayfasında "şu anki filtre" diye bir bağlam yok, orada göstermek yanıltıcı olurdu.

## Giriş gerekiyor
İkisi de hesaba yazıldığı için misafirken kapılanır.`,
      },
      {
        id: "karsilastirma",
        title: "16.2 Karşılaştırma aracı",
        body: `Birden çok araç ilanı seçilip yan yana karşılaştırılabilir.

## Yüzen çubuk
Seçim yapıldıkça ekranın altında bir çubuk birikir; kullanıcı listeyi gezmeye devam edebilir.

## Ne karşılaştırılıyor
Fiyat, yıl, kilometre, yakıt, vites, güç ve öne çıkan donanım. Amaç kullanıcıyı sekme arasında gidip gelmekten kurtarmak.`,
      },
      {
        id: "yorumlar",
        title: "16.3 Değerlendirmeler",
        body: `Araç sahibi tamamlanan bir işten sonra tamirciyi puanlayıp yorum yazabilir; fotoğraf ekleyebilir.

## Kime yazıldığı
Yorum tamirciye KİMLİKLE bağlanır. Eskiden isimle eşleştiriliyordu; aynı adı taşıyan iki tamirci olduğunda yorum yanlış profile düşüyordu.

## Faydalı oyu
Yorumlar "faydalı" olarak işaretlenebilir; oy hesapla birlikte kalıcıdır.

## Tamircinin cevabı
Tamirci bir yoruma tek seferlik cevap yazabilir.

## Puan ortalaması
Tamircinin puanı yorumlardan hesaplanır, elle girilmez.

## Ana sayfadaki değerlendirme şeridi
"Kullanıcılar ne diyor?" bölümü gerçek yorumlardan beslenir ve AKAN bir şerittir: en fazla 12 yorum, kendiliğinden ilerliyor, fare üzerine gelince duruyor, oklarla ve dokunmatik kaydırmayla da gezilebiliyor. Eskiden sabit üç karttı; her ziyarette aynı üç metni göstermek vitrin değil dekordu ve "gerçek yorumlar" iddiasını zayıflatıyordu. "Hareketi azalt" tercihi olan kullanıcıda otomatik ilerleme çalışmaz, şerit yalnızca elle kaydırılır.`,
      },
      {
        id: "paylasim",
        title: "16.4 Paylaşım",
        body: `Tamirci profilleri, ilanlar ve iş ilanları paylaşılabilir.

## Yerel paylaşım menüsü
Cihaz destekliyorsa sistemin kendi paylaşım penceresi açılır; desteklemiyorsa bağlantı panoya kopyalanır.

## Yeni sekme açılmıyor
Paylaşım penceresi target="_blank" ile açılırsa arkada boş, hiç kapanmayan bir sekme kalıyordu.

## Sayaç
Paylaşım sayısı kayda geçer ve tamircinin analiz ekranında görünür.`,
      },
    ],
  },

  // ==========================================================================================
  {
    id: "ayarlar",
    title: "17. Ayarlar ve Hesap",
    summary: "Profil, tercihler, şifre, hesap silme.",
    pages: [
      {
        id: "ayarSayfa",
        title: "17.1 Ayarlar sayfası",
        body: `Ayarlar hem araç sahibi hem tamirci için AYRI BİR SAYFA olarak açılır, profil bilgilerinin altında değil.

## Neden ayrı sayfa
Ayarları profil bilgilerinin altına gömmek, kullanıcının aradığı şeyi bulamamasına yol açıyordu.

## İçerik
Dil, bildirim kategorileri, konum kullanımı, otomatik randevu kabulü (tamirci), yasal metinler, destek ve hesap işlemleri.`,
      },
      {
        id: "hesap",
        title: "17.2 Şifre ve hesap silme",
        body: `## Şifre değiştirme
Mevcut şifre SUNUCUYA sorularak doğrulanır. Eskiden istemcide saklanan bir değerle karşılaştırılıyordu; şifreler artık API'den hiç dönmediği için bu zaten çalışmıyordu.

## Hesap silme
Onay ister ve geri alınamaz olduğu açıkça yazılır.

## Çıkış
Çıkışta oturum sunucudan da düşürülür ve özel veri listeleri (araçlar, randevular, sohbetler) yerel olarak boşaltılır. Sadece ekran değiştirmek yetmez; veriler bellekte kalırsa bir sonraki kullanıcı onları görebilirdi.`,
      },
    ],
  },

  // ==========================================================================================
  {
    id: "veri",
    title: "18. Veri Modeli ve API Katmanı",
    summary: "Tablolar, kimlik alanları, HTTP istemcisi.",
    pages: [
      {
        id: "tablolar",
        title: "18.1 Tablolar",
        body: `owners, mechanics, vehicles, appointments, listings, jobs, conversations, quote_requests, quote_offers, tickets, blog_posts, sessions, analytics_events, translation_cache.

## Kimlik alanları
Sahiplik her zaman kimlikle kurulur: vehicles.ownerId, appointments.ownerId/mechanicId, listings.sellerId/buyerId. Görünen ad (sellerName gibi) yalnızca gösterim içindir; filtre ve yetki kararlarında KULLANILMAZ.

## İç içe veriler
vehicle_history tablosu diğerlerinden farklı çalışır: kayıt bir KULLANICIYA değil, aracın şasi numarasına bağlıdır (bkz. 21. bölüm) — araç el değiştirse, eski sahip hesabını kapatsa bile kayıt durur.

Hizmetler, çalışma saatleri, yorumlar, teklifler gibi listeler JSON metin olarak saklanır ve okunurken nesneye çevrilir (hydrate). SQLite'ta ayrı tablo açmanın maliyeti bu ölçekte gerekmiyordu.

## Göç (migration)
Şema değişiklikleri açılışta uygulanır: eksik sütunlar eklenir, boş kalan alanlar doldurulur, bozuk NULL değerler onarılır. Mevcut veriler silinmez.

## Alan gizleme
API çıktısı hydrate katmanından geçer. Şifre hiçbir zaman dönmez; IBAN/banka bilgileri toplu listede dönmez, yalnızca tamircinin kendi kaydında görünür.`,
      },
      {
        id: "istemci",
        title: "18.2 API istemcisi",
        body: `Tüm HTTP çağrıları tek bir dosyadan geçer (services/api/client.ts).

## Neden tek kapı
Oturum token'ının her isteğe eklenmesi, hata mesajlarının kullanıcı diline çevrilmesi ve 401 davranışı tek yerde tanımlı. Yüzlerce çağrı sitesine tekrar tekrar yazmak yerine.

## Hata mesajları
HTTP durum kodları anlaşılır cümlelere çevrilir. Sunucuya hiç ulaşılamadığında (backend kapalı) ayrı bir mesaj gösterilir.

## Tekrarlanan istekler
Aynı anda giden aynı GET isteği tekilleştirilir.

## Başlık birleştirme
Varsayılan başlıklar ile çağrıya özel başlıklar GERÇEKTEN birleştirilir. Eskiden çağrıya özel başlık verildiğinde Content-Type siliniyor ve sunucu gövdeyi hiç ayrıştıramıyordu.

## İyimser güncelleme
Çoğu yazma işleminde arayüz anında güncellenir, istek arka planda gider. Başarısız olursa kullanıcıya bildirilir ve mümkün olan yerlerde değişiklik geri alınır.`,
      },
    ],
  },

  // ==========================================================================================
  {
    id: "konum",
    title: "19. Konum, Harita ve Yerel Kurallar",
    summary: "Mesafe hesabı, harita, ülkeye göre değişen kurallar.",
    pages: [
      {
        id: "mesafe",
        title: "19.1 Konum ve mesafe",
        body: `## İzin isteme
Konum izni kendiliğinden istenmez; kullanıcı mesafeye dayalı bir şey yapmak istediğinde sorulur ve reddedilirse bir daha üst üste sorulmaz.

## İzin yoksa
Şehir adından koordinat tablosuyla TAHMİNİ mesafe hesaplanır ve bunun tahmin olduğu ekranda yazılır. Sessizce yanlış bir sayı göstermek, hiç göstermemekten kötüdür.

## Harita
Tamirci konumları harita panelinde gösterilir; bir işaretçiye tıklanınca o tamircinin özeti açılır. Yol tarifi bağlantısı tamircinin KİMLİĞİNDEN üretilir, isminden değil.`,
      },
      {
        id: "yerel",
        title: "19.2 Ülkeye göre kurallar",
        body: `Site Türkiye ve Almanya kullanıcılarını hedefliyor; bazı kurallar ülkeye göre değişir.

## Kış lastiği
Almanya'da kış lastiği zorunluluğu hava koşullarına bağlıdır; Türkiye'de belirli tarihler arasında ve araç sınıfına göre zorunludur. Araç kaydındaki ülke/şehir bilgisine göre doğru kural gösterilir.

## Dil ve para birimi
Açılış dili cihazın saat diliminden tahmin edilir. Fiyatlar ilanın ülkesine göre ₺ veya € ile gösterilir.

## Şehir listeleri
Almanya için sabit bir şehir listesi, Türkiye için serbest metin + koordinat tablosu kullanılır.`,
      },
    ],
  },

  // ==========================================================================================
  {
    id: "calisma",
    title: "20. Çalışma Düzeni",
    summary: "Kurulum, komutlar, bakım kuralları.",
    pages: [
      {
        id: "komut",
        title: "20.1 Çalıştırma",
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
        title: "20.2 Bakım kuralları",
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
  // ==========================================================================================
  {
    id: "aracgecmisi",
    title: "21. Aracın Geçmişi (Şasi/VIN)",
    summary: "Servis geçmişini sahibe değil ARACA bağlamak; paylaşım izni ve gizlilik.",
    pages: [
      {
        id: "neden",
        title: "21.1 Neden araca bağlı",
        body: `Bakım geçmişi bugüne kadar araç SAHİBİNE bağlıydı (vehicles.history, kullanıcının kendi kaydı). Araç el değiştirince eski sahip onu garajından siliyor ve geçmiş onunla birlikte yok oluyordu. Oysa geçmiş arabaya ait: yeni sahip için de, o arabaya ilk kez bakacak usta için de en değerli bilgi bu.

## Çözüm: isteğe bağlı şasi numarası
Araç eklerken ya da sonradan düzenlerken bir şasi (VIN) numarası girilebilir. ZORUNLU DEĞİL. Girildiğinde, o araçta Fixperto üzerinden yapılan ve TAMAMLANAN işler bu numaraya bağlı kalıcı bir kayda (vehicle_history) yazılır. Araç satıldığında yeni sahip aynı numarayı kendi aracına girdiğinde ya da sorgulama panelinden aratınca geçmişi görür.

## Yalnızca DOĞRULANABİLİR kayıt
Bu kayda sadece platformda gerçekten gerçekleşmiş, tamamlanmış randevulardan doğan işler girer; kullanıcının elle yazdığı notlar girmez. "Doğrulanmış geçmiş" etiketi, arkasında gerçek bir randevu olmadığı sürece hiçbir şey ifade etmezdi.

## Numara doğrulanır
Standart VIN 17 hane, harf+rakam, ve I/O/Q harflerini içermez (1 ve 0 ile karışmasın diye). 11-17 arası kabul ediliyor (eski/özel şasi numaraları). Denetim hem istemcide hem sunucuda var: istemci kolaylık, sunucu güvenliktir. Bu denetim olmasa kullanıcı plakasını yazar, numara kalıcı kaydın anahtarı olur ve araç el değiştirdiğinde geçmiş bulunamazdı.

## Kayıt nasıl oluşur
Tamirci randevuyu "tamamlandı" yaptığında. Şasi numarasını elle yazabilir (aracı fiziksel olarak görüyor) ya da hiç yazmaz: araç sahibi numarayı garajında bir kez girdiyse SUNUCU plakadan eşleştirip kendisi bulur. Tamirci araç sahibinin garajını göremez, bu eşleştirme yalnızca sunucuda yapılır. Randevu başına tek kayıt (UNIQUE index).`,
      },
      {
        id: "vinizin",
        title: "21.2 Paylaşım izni ve gizlilik",
        body: `Şasi numarası YARI-AÇIK bir veridir: ön camın altında yazar, ilanlarda paylaşılır. "Numarayı bilen her şeyi görür" demek araç geçmişini sızdırmak olurdu. Dört kural birlikte çalışıyor.

## 1) İzin şart
Kayıt, ancak o dönemin sahibi paylaşıma açık bıraktıysa başkasına görünür. İzin kaydın ait olduğu DÖNEMİN sahibine aittir: sonraki sahip, kendinden önceki dönemin iznini değiştiremez. Varsayılan açık, çünkü numarayı girmenin tek amacı zaten bu; ama araç sayfasındaki tek anahtarla kapatılabilir ve kapatma geçmişe dönük çalışır.

## 2) Kimlik şart
Sorgulama için giriş yapmış olmak gerekir (araç sahibi ya da tamirci). Anonim bir betik VIN taraması yapamaz.

## 3) Hız sınırı
Kimlik de yetmez: saatte sınırlı sayıda sorgu. Amaç, elindeki VIN listesiyle toplu veri toplamayı ekonomik olmaktan çıkarmak.

## 4) Kişisel veri dönmez
Yanıt yalnızca "ne zaman, hangi işletmede, ne yapıldı" (varsa km ve garanti) içerir. Eski sahibin adı, telefonu, plakası ve ödediği tutar ASLA dönmez — bunlar aracın değil bir KİŞİNİN verisidir ve alıcıyı ilgilendirmez.

## Gizlenen kayıt sayısı söylenir
Sorgulama sonucunda kaç kaydın paylaşıma kapalı olduğu yazılır. Alıcı "geçmiş yok" ile "geçmiş paylaşılmamış" arasındaki farkı bilmeli; yoksa eksik bilgiyi temiz geçmiş sanır.`,
      },
      {
        id: "nerede",
        title: "21.3 Nerede kullanılıyor",
        body: `## Araç satışında
İlan formunda "Bakım geçmişini ilanda göster" seçeneği var. Açıksa ilan sayfasında "doğrulanmış servis geçmişi" bölümü çıkar. Seçenek yalnızca şasi numarası girilmişse çalışır — numara olmadan açık bırakmak, ilanda hiç görünmeyecek bir vaat olurdu.

## "Bu VIN gerçekten satıcının aracı mı?" — DOĞRULAYAMAYIZ
Şasi numarası bir sır değil: ön camın altında, ruhsatta, çoğu zaman ilan fotoğrafında yazar. Bir kullanıcının o numarayı kendi garajına araç olarak eklemesi BEYANDIR, kanıt değil. Gerçek sahiplik doğrulaması ancak resmi tescil kaydına bağlanmakla olur; öyle bir bağlantımız yok ve varmış gibi davranmak, güvenilmemesi gereken bir şeye güven etiketi basmak olurdu.

İlk sürümde kural "araç satıcının garajında kayıtlı mı" idi ve bu kendi kendine sağlanabiliyordu; sağlandığında da o numaraya ait TÜM paylaşılan kayıtlar (önceki sahiplerin dönemleri dâhil) girişsiz bir sayfada yayımlanıyordu — yani sorgulamadaki kimlik ve hız sınırı bu yoldan aşılabiliyordu.

Şimdiki kural, doğrulayamadığımız soruyu hiç sormuyor: ilanda YALNIZCA satıcının kendi dönemindeki (ownerId = satıcı) kayıtlar yayımlanır. Bu kayıtların arkasında tamamlanmış bir randevu ve onu yapan tamircinin kaydı var; yani satıcı yalnızca kendi yaptırdığı işleri yayımlayabilir. Başkasının geçmişini yayımlamak için o kişinin hesabına girmesi gerekirdi.

Aracın daha eski dönemleri kaybolmaz: alıcı giriş yapıp şasi numarasıyla kendisi sorgularsa önceki sahiplerin paylaşıma açtığı kayıtları da görür. Orada kimlik ve hız sınırı var; ilan sayfası herkese açık olduğu için kapsam dar tutuluyor. İlanda ayrıca "daha eski dönemlerden {n} kayıt daha var" notu çıkar — alıcı gösterilenin aracın tüm geçmişi olduğunu sanmamalı.

## Randevu alırken
"Bu tamircinin geçmiş randevularımı görmesine izin veriyorum" kutusu (varsayılan açık, kapatılabilir). Tamirci, izin verilmişse müşterinin kendisindeki geçmiş randevularını görür; izin verilmemişse yerinde bir kilit simgesi ve açıklama çıkar.

## Sorgulama paneli
Araç sahibinin garaj sekmesinde ve tamircinin randevular sekmesinde AYNI panel var: şasi numarasını gir, paylaşıma açık kayıtları gör. Araç sahibi için kullanım: ikinci el araç aldı. Tamirci için: tamirhanesine ilk kez gelen aracın geçmişini görmek teşhisi doğrudan etkiler.

## BİLİNEN SINIR
Bu bir "araç sorgu" servisi değildir: yalnızca Fixperto üzerinden yapılmış işleri bilir. Hasar kaydı, kilometre doğrulama ya da resmi tescil verisi burada yoktur ve öyleymiş gibi sunulmaz.`,
      },
    ],
  },
];

/** Arama için düz liste: bölüm başlığı + sayfa başlığı + gövde. */
export const HANDBOOK_PAGES = HANDBOOK.flatMap((s) =>
  s.pages.map((p) => ({ sectionId: s.id, sectionTitle: s.title, ...p })),
);
