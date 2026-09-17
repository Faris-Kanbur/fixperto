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
Sohbet başlığındaki düğme o tamirciyle randevu ekranını açar. Sohbetin tamirci bağlamı ile randevu ekranının seçili tamircisi burada eşitlenir; eşitlenmezse YANLIŞ tamirciyle randevu açılırdı.

## Emoji
Yazma alanının yanında gülen yüz düğmesi var (her iki tarafta da). Panel hazır bir kütüphane DEĞİL: emoji seçici paketleri birkaç yüz kilobayt ve binlerce emoji taşıyor, oysa burada gerçek ihtiyaç "tamam", "eyvallah", "araba hazır mı" yazışmasıdır. Küçük ve konuya uygun bir set hem daha hızlı yüklenir hem de aranacak bir şey kalmadığı için daha hızlı kullanılır; içinde bu işe özgü olanlar da var (araba, anahtar, tamir, yakıt) — genel bir kütüphanede bunları bulmak için arama yapmak gerekirdi.

Panel PORTAL ile document.body'ye basılıyor. Sohbet kutusu taşma (overflow) olan bir kabın içinde; normal akışta açılan panel o kabın kenarında kesiliyor ya da altında kalıyordu — bilgi baloncuğunda (InfoTip) yaşanan hatanın aynısı. Panel düğmenin ÜSTÜNDE açılıyor, çünkü yazma alanı ekranın altında; aşağı açılsa ekran dışına taşardı. Escape ile ve dışarı tıklayınca kapanıyor.`,
      },
      {
        id: "teklifakisi",
        title: "3.7 İlana teklif verme ve tekrar teklif",
        body: `Alıcı bir araç ilanına teklif verir; satıcı kabul eder, reddeder ya da bekletir. "Verdiğim Teklifler" listesi her iki rolde de (araç sahibi ve tamirci) aynı kuralla çalışır.

## Teklif nereye yazılıyor
GERÇEK HATA: teklif ve soru, ilanın kendi PATCH'i ile yazılıyordu. Ama ilan satırının yazma yetkisi SATICIYA bağlı — teklifi veren satıcı olmadığı için istek sunucuda 403 alıyordu: teklif ekranda görünüyor, veritabanına HİÇ kaydedilmiyordu. Artık teklif ve soru için ayrı uç noktalar var; kimlik (kim teklif verdi, kim sordu) sunucuda oturumdan damgalanıyor ve ekleme sunucudaki güncel diziye yapılıyor, yani eşzamanlı teklifler birbirini ezmiyor.

## Tekrar teklif kuralı
Satıcı teklifi HENÜZ GÖRMEDİYSE: tutar yerinde güncellenir, yeni satır açılmaz. REDDETTİYSE: yeni teklif verilebilir, eski kayıt arşivlenir ki listede tek güncel satır kalsın. GÖRDÜ ama henüz yanıtlamadıysa: yeni teklif YOK — satıcı yanıt bekliyorken arka arkaya teklif göndermek pazarlık değil, bildirim yağmuru olur. KABUL EDİLDİYSE: iş bitmiştir.

Kural SUNUCUDA. Arayüzdeki düğmenin etiketi ve tıklanabilirliği de tek bir yerden (offerButtonState) geliyor — üç ayrı yerde teklif düğmesi var ve her birinde ayrı hesaplansaydı biri er geç sunucunun reddedeceği bir isteği gönderirdi.

## Listeden doğrudan tekrar teklif
"Verdiğim Teklifler" satırında, teklif uygunsa bir düğme çıkar ve ilanı teklif formu açık olarak getirir. Kullanıcı ilanı arayıp bulmak zorunda kalmıyor. İki tarafta da aynı.

## Satıcının cevap hakkı
Alıcı ilana soru sorabiliyordu ama satıcının cevap verecek bir yeri yoktu: soru ilan yönetim ekranında okunup orada kalıyordu. Artık satıcı aynı yerden cevaplıyor; cevap "Satıcı" rozetiyle işaretleniyor (bu işareti SUNUCU koyuyor, istemciye bırakılsa bir alıcı kendi mesajını satıcı cevabı gibi gösterebilirdi) ve soruyu soran kişiye bildirim gidiyor.

## Sınırlar
Aynı ilanda bir alıcının teklif geçmişi 10 kayıtla, teklif/soru yazma IP başına dakikalık bir tavanla sınırlı. Kendi ilanına teklif verilemez, yayından kalkmış ilan teklif almaz.`,
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
Aktif ve geçmiş olarak ikiye ayrılır. Otomatik kabul açıksa gelen randevular doğrudan "Sırada" olur, kapalıysa "Onay Bekliyor".

## Profil tamamlanma listesi tıklanabilir
Liste neyin eksik olduğunu söylüyordu ama kullanıcı o alanı uzun formda kendisi arıyordu. Artık her eksik madde bir düğme: tıklayınca ilgili bölüme kaydırıyor ve bölüm kısa süre vurgulanıyor ("nereye geldim" sorusu kalmasın). Tamamlanmış maddeler düğme DEĞİL — orada yapılacak bir şey yok. Hareket azaltma tercihi açık kullanıcılarda yumuşak kaydırma yapılmıyor.`,
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

## Tamircinin kendi hizmet listesi kategoriye göre gruplanır
Tamirci 50 hizmet seçtiğinde profil düzenleme ekranı düz bir liste olarak metrelerce uzuyor ve aranan hizmet bulunamıyordu. Artık hizmet SEÇİCİSİNDEKİ ile aynı düzen: kategori başlıkları ve altlarında o kategorinin hizmetleri. Bir kategoride 3'ten fazla hizmet varsa o BÖLÜM kendi içinde kaydırılır — sayfa uzamaz, diğer başlıklar ekranda kalır. (Eşik 7 ile başladı, kullanıcı isteğiyle 3'e indi: 7'de bile birkaç dolu kategori üst üste gelince sayfa metrelerce uzuyor ve kategori başlıkları ekrandan çıkıyordu. 3'te her başlık görünür kalıyor, yani "hangi kategoriler var" sorusu tek bakışta cevaplanıyor; bölüm içindeki kayma da tam olarak bunun bedeli.) Katalogda olmayan (tamircinin kendi yazdığı) hizmetler kendi başlığı altında toplanır.

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
goToMyPanel / goToMySettings (AppLogicProvider). Tamirci → tamirci paneli ve profil ayarları sekmesi; araç sahibi → panosu ve ayar ekranı. Bu seçimi her üst çubukta yeniden yazmak, birinin er geç yanlış ekrana gitmesi demekti.

## Önizlemeden dönüş: ekran DEĞİL, ekran + sekme
Tamircinin "önizleme" düğmesi kendi profilini ziyaretçi gözüyle açıyor. Dönüş adresi sabit yazılmıştı ve kullanıcının hiç gitmediği bir sayfaya "geri" götürüyordu. Kural: bir ekrandan geçici olarak çıkan her akış, dönerken YALNIZCA ekranı değil o ekrandaki SEKMEYİ de geri almalı — kullanıcı düzenlemeye kaldığı yerden devam etsin.`,
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
Her liste için ikon + tek cümlelik açıklama. Boş ekran bırakılmaz.

## Görsel arka planları NÖTR
Blog kapak görsellerinin arkasında pembe bir degrade vardı; görselin kapatmadığı her yerde (şeffaf PNG, farklı en-boy oranı, görsel yüklenemediğinde) kırmızımsı bir zemin görünüyor ve hiçbir fotoğrafla uyuşmuyordu. Kural: bir görselin ARKASINDA marka rengi olmaz — nötr gri kullanılır. Marka rengi, görselin kendisi olmayan yerlerde (rozetler, başlık bantları, düğmeler) kalır.

## Karanlık mod: yarı saydam zeminler de kapsanmalı
Karanlık mod, açık renk Tailwind sınıflarını kapsam içinde ezen bir CSS katmanıyla çalışıyor. Kural ".bg-white" sınıfına bakıyordu; ama "bg-white/95" ve "bg-white/90" AYRI birer sınıftır ve hiç yakalanmıyordu. Sonuç: yapışkan üst çubuklar, ana sayfa başlığı ve modal başlıkları karanlık modda BEYAZ kalıyor, üzerlerindeki açık gri yazı okunmuyordu. Aynı sınıf hata degrade bantlarda (from-rose-50 …) ve yer tutucu ikonların açık grisinde vardı.

KURAL: yarı saydam bir zemin sınıfı (bg-white/90 gibi) eklenirse karanlık karşılığı da eklenir. Test bunu denetliyor: opak sayılabilecek her "bg-white/NN" için bir karanlık kural aranıyor.`,
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

## "Sessiz 403" hatası — bir HATA SINIFI
Bir kaydın yazma yetkisi SAHİBİNE bağlıdır. Ama bazı akışlarda o kayda yazan kişi sahibi değildir: teklifi veren satıcı değildir, işe başvuran ilanı açan tamirci değildir, yorumu yazan tamircinin kendisi değildir. Bu akışlar genel PATCH ile yazıldığında sunucu 403 döndürüyor ve özellik SESSİZCE çalışmıyordu — kullanıcı "gönderildi" mesajını görüyor, veri hiç kaydedilmiyordu. Üç yerde vardı: sohbet mesajı, ilan teklifi/sorusu ve İŞ BAŞVURUSU. Hepsi kendi uç noktasına taşındı; kimlik oturumdan damgalanıyor. Yeni bir "başkasının kaydına yazma" akışı eklenirse KURAL: genel PATCH değil, kendi uç noktası.

## Puan ve yorumlar
reviewList/reviews/rating alanları giriş yapmış herkese açıktı ("sharedWrite") — dizinin tamamı istemciden geldiği için biri bir tamircinin olumsuz yorumlarını silebiliyor, başkasının ağzından yorum ekleyebiliyor ve puanı doğrudan 5,0 yazabiliyordu. Puan bu pazar yerinin en önemli güven sinyali. Artık: yorum ayrı uçtan gidiyor, yazar oturumdan damgalanıyor, YALNIZCA o tamircide tamamlanmış randevusu olan kullanıcı yorum bırakabiliyor, kişi başına tek yorum, yorumu yalnızca yazarı silebiliyor (tamirci silemiyor, yalnızca yanıtlayabiliyor) ve PUANI SUNUCU listeden hesaplıyor.

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
      {
        id: "veristratejisi",
        title: "11.4 Hangi veriyi neden tutuyoruz",
        body: `Veri toplamanın tek meşru gerekçesi, o veriyle ALINACAK bir kararın olması. "İleride lazım olur" diye toplanan veri, sorumluluğu artırır ve hiçbir zaman kullanılmaz. Aşağıdaki listede her kalemin karşısında hangi kararı beslediği yazıyor.

## Karşılaştırma çiftleri (eklendi)
Kullanıcı iki aracı yan yana koyduğunda "neyin ALTERNATİFİ ne" sorusunu bize kendisi söylüyor. Tek tek görüntülenme verisi bunu bilemez. Beslediği kararlar:
· FİYATLAMA — satıcıya "ilanınız en çok X ile karşılaştırılıyor, X'in ortalama fiyatı şu" denebilir; doğru fiyatlanan ilan daha hızlı satılır.
· ÖNERİ — "bunu görenler şunu da inceledi" listesi tahmine değil gerçek karşılaştırmalara dayanır.
· ARZ AÇIĞI — çok kıyaslanan ama sitede az bulunan modeller, hangi ilanları çekmemiz gerektiğini söyler.
· TAMİRCİ TARAFI — çok kıyaslanan markalar, o markalara marka bazlı fiyat girmeye değer sinyalidir.
Kaydedilen şey yalnızca "Marka Model" metinleri ve sayılar; kimin karşılaştırdığı değil. Çift her zaman alfabetik sıralanır, yoksa "A ile B" ve "B ile A" iki ayrı satır olur ve sayılar bölünür.

## Zaten topladıklarımız ve besledikleri karar
· Sonuçsuz arama (search_zero_result) — ARZ AÇIĞI: aranan ama bulunamayan şey.
· Arama terimi/şehir/hizmet — hangi hizmete nerede talep var; tamirciye "şehrinde bu hizmete talep var, sen sunmuyorsun" sinyali.
· Filtre kullanımı — hangi filtre gerçekten kullanılıyor; kullanılmayan filtre arayüzden çıkarılabilir.
· Görüntülenme → dönüşüm hunisi — nerede kaybediyoruz.
· Paylaşım kanalı + tıklama — hangi kanal gerçekten müşteri getiriyor.
· Trafik kaynağı / ülke / cihaz — nereye yatırım yapılacağı.

## Eklemeye DEĞER (öncelik sırasıyla, henüz yok)
1. RANDEVU HUNİSİNDE TERK ADIMI: kullanıcı hangi adımda vazgeçiyor (araç/hizmet/tarih/onay). En pahalı kayıp burada ve düzeltmesi en ucuz yer.
2. YANIT SÜRESİ: tamircinin mesaja/randevuya ilk yanıt süresi. Hem sıralama sinyali hem tamirciye "rakiplerin 20 dakikada dönüyor" geri bildirimi.
3. TEKLİF/İLAN FİYAT ORANI: kabul edilen tekliflerin ilan fiyatına oranı — gerçek pazar fiyat endeksi, "bu fiyat pazarın üstünde" uyarısı yapılabilir.
4. TEKRAR GELEN MÜŞTERİ ORANI: aynı araç sahibinin aynı tamirciye dönüşü. Memnuniyetin puandan daha dürüst ölçüsü; sahte yorumla şişirilemez.
5. BİLDİRİM TIKLAMA ORANI: hangi bildirim işe yarıyor, hangisi rahatsızlık. Kapatma oranıyla birlikte okunmalı.
6. KAYITLI ARAMA DOLULUK ORANI: kaydedilen aramaların kaçı hiç sonuç görmüyor — yine arz açığı, ama kişinin beklentisiyle birlikte.

## Kural
Her yeni ölçüm için üç soru: (1) hangi kararı besliyor, (2) kişisel veri içeriyor mu, (3) panelde nerede görünecek? Üçünün de cevabı yoksa ölçüm eklenmez. Panelde hiç gösterilmeyen bir olay, veriyi sessizce çöpe atmakla aynı şeydir — kimse bakmadığı için bozulduğu da fark edilmez.`,
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
tsc tip denetimi + her backend dosyasının sözdizimi + 33 STATİK takım + 9 UÇTAN UCA takım + envanter taraması.

## Statik ve uçtan uca farkı — bu ayrım kritik
Statik takımlar kaynak kodu OKUR ve kural ihlali arar. Değerliler ama kodu ÇALIŞTIRMAZLAR: "ekranda başarı yazdı ama hiçbir şey kaydedilmedi" sınıfı hatayı göremezler. Uçtan uca takımlar gerçek Express sunucusunu geçici bir SQLite dosyasıyla ayağa kaldırır, gerçek HTTP isteği atar ve sonucu VERİTABANINDAN okuyarak doğrular. 1000'den fazla statik iddianın kaçırdığı altı gerçek hata ancak böyle bulundu — bir özelliğin "çalışıyor göründüğü" ile "gerçekten çalıştığı" arasındaki farkı yalnızca bu katman ölçer.

## Takımlar
Statik: arama, fiyatlandırma, gezinme, akışlar, i18n, ui, null-güvenliği, blog, randevu takvimi, araç formu, güvenlik, doğrulama, el kitabı, alt bilgi bağlantıları, kariyer, telefon, hizmet fiyatı, çeviri, araç geçmişi, ilan teklifleri, hesap güvenliği, rekabet ve veri, test altyapısı, arayüz çizimi, tarayıcı uyumluluğu, IP güvenliği, medya doğrulama.
Uçtan uca: tests/e2e/api.e2e.mjs (kimlik, araç, randevu, değerlendirme, ilan, sohbet, hesap güvenliği, girdi güvenliği), tests/e2e/api2.e2e.mjs (destek, teklif, blog/kariyer, duyuru, eşzamanlılık, analitik, öneri rızası, şifre uçları, başlıklar, hız sınırı), tests/e2e/api3.e2e.mjs (OTOMATİK GÜVENLİK MATRİSİ — aşağıya bakın).

## Otomatik güvenlik matrisi — elle yazılan testin kapatamadığı boşluk
Elle yazılan uçtan uca testler yalnızca YAZDIĞIN uçları korur. Yeni bir uç eklendiğinde kimse hatırlamazsa o uç denetlenmeden yayına çıkar. Bu yüzden uç listesi artık KODDAN üretiliyor (tests/e2e/endpoints.mjs) ve matris sunucudaki 128 ucun TAMAMINA aynı soruları soruyor:
1. Girişsiz çağrıldığında ne oluyor? Yazma uçları 200 dönmemeli. "Kasıtlı olarak herkese açık" olanların listesi testte gerekçeleriyle yazılı — listede olmayan bir uç girişsiz 200 dönerse test düşer, yani yeni bir açık uç eklemek FARK EDİLİR.
2. Bozuk/kötü niyetli gövdeyle (dizi, nesne, 5000 karakter, SQL, XSS, __proto__, yol atlama, eksi sayı) 500 patlatılabiliyor mu?
3. Yanıtlarda hassas alan sızıyor mu (password, tokenHash, signupIpHash…)?
4. Hata gövdesinde yığın izi, SQL hatası ya da dosya yolu görünüyor mu?
5. Sahiplikli her kaynakta IDOR: başkasının kaydı düzenlenebiliyor/silinebiliyor mu — ve kural meşru sahibi engelliyor mu?
6. Kitlesel atama: kullanıcı kendine rozet/puan/sayaç yazabiliyor mu?
7. Bozuk jetonlar (boş, "null", 500 karakter, son harfi değiştirilmiş) kabul ediliyor mu?

Aynı liste envanter taramasıyla da paylaşılıyor; tek kaynak olması, yeni bir ucun birinde unutulmasını imkânsız kılıyor.
Envanter: tests/e2e/inventory.mjs — istemcinin çağırdığı her yolun sunucuda karşılığı var mı.

## SQLite sürücüsü makineye göre seçilir
Normal kurulumda (senin makinen, CI) better-sqlite3 derlenmiş hâlde vardır ve sunucu OLDUĞU GİBİ başlatılır — hiçbir yükleyici numarası yok, test edilen şey birebir üretimdeki şey.

Bazı sanal ortamlarda better-sqlite3'ün ikilisi çalışmaz. Orada, Node 22+ ise, --experimental-loader ile "better-sqlite3" istekleri node:sqlite üstündeki ince bir adaptöre yönlendirilir (tests/e2e/sqlite-adapter.mjs + loader.mjs). UYGULAMA KODU YİNE DEĞİŞMEZ — test uğruna üretim kodunu esnetmek, test ettiğin şeyin artık üretimdeki şey olmaması demektir.

İkisi de yoksa takım hata VERMEZ; sebebini yazıp atlar. Çalıştıramadığın bir testin kırmızı yanması, gerçek bir hata gördüğünde ona güvenmemene yol açar.

## Arayüz gerçekten çiziliyor mu — üçüncü katman
Statik takımlar bileşenin KAYNAĞINI okur, uçtan uca takımlar SUNUCUYU çalıştırır. Aradaki boşluk şuydu: bileşenin kendi kodu hiç çalışmıyordu. Artık çalışıyor — TypeScript derleyicisi TSX'i çevirip react-dom/server bileşeni HTML'e basıyor (tests/ui-render.test.mjs). Böylece koşullar, hesaplamalar, dil seçimi ve "veri boş geldi" hâlleri gerçekten sınanıyor.

En değerli parçası TOPLU TARAMA: her bileşen boş/eksik veriyle bir kez çiziliyor. React'te tek bir bileşenin çizim sırasında atması bütün ağacı düşürür — kullanıcı beyaz ekran görür. Bu tarama daha ilk çalıştırmada gerçek bir örnek buldu: iş ilanı kartı, başvuru listesi null geldiğinde çöküyordu; tek bozuk kayıt bütün ilan listesini beyaz ekrana çeviriyordu.

## Hâlâ test EDİLMEYEN: tarayıcı
Bu bir tarayıcı değil. Tıklama, odak, kaydırma, CSS, gerçek z-index ve portal yerleşimi burada ölçülmüyor; ölçülen şey ilk çizim. Paketleyicinin (vite/rollup/esbuild) derlenmiş ikilileri bu ortamda çalışmadığı için uygulamayı paketleyip tarayıcıda açmak mümkün değil. Bu sınır biliniyor ve gizlenmiyor: "arayüz test edildi" demek, "tarayıcıda tıklandı" demek değildir.

## Bu kural bir hatadan doğdu
İlk sürüm node:sqlite'ı tek yol olarak yazmıştı ve üst seviyede import ediyordu: geliştirme ortamında yeşildi, Node 20 kurulu makinede "No such built-in module: node:sqlite" ile patladı. tests/test-altyapisi.test.mjs takımı bu hatanın geri gelmesini engelliyor — sürücü seçiminin çalışma anında yapıldığını, atlama yolunun durduğunu ve her takımın kendi portu/veritabanı dosyasıyla çalıştığını denetliyor.

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
Randevu, teklif, mesaj, başvuru, duyuru ve İLAN GÜNCELLEMELERİ. Kullanıcı ayarlardan kategorileri tek tek kapatabilir; kapalı kategoride hiç bildirim üretilmez. Her kategori iki rolde de (araç sahibi ve tamirci) ayrı ayrı vardır.

## "İlanıma teklif geldi" ile "izlediğim ilan değişti" AYNI ŞEY DEĞİL
İkisi eskiden tek anahtara (teklif bildirimleri) bağlıydı; birini kapatmak isteyen diğerini de kaybediyordu. Artık ilan güncellemelerinin kendi anahtarı var (notifyListingUpdates).

## İlan güncellemelerini kim alır
Üç grup: ilanı FAVORİLEYENLER, o ilana TEKLİF VERENLER ve SORU SORANLAR. Eskiden yalnızca favorileyenler haber alıyordu — oysa teklif vermiş biri favorileyenden daha ilgilidir: parasını konuşmuş, cevap bekliyor. Haber verilen değişiklikler: fiyat düşüşü (ayrı başlıkla), fiyat değişimi, ilan bilgilerinin güncellenmesi, durum değişimi (satıldı/duraklatıldı) ve ilanın yayından kaldırılması.

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
İkisi de hesaba yazıldığı için misafirken kapılanır.

## Bildirim sıklığı (arama başına)
Emlak ve iş ilanı sitelerinin yıllardır yaptığı şey: aramayı kaydet, yeni sonuç çıkınca haber al — ama hangi sıklıkta haber alacağına KULLANICI karar versin. Dört seçenek var: anında, günlük, haftalık, kapalı. Geniş bir aramada ("İstanbul'da araba") her yeni ilan için ayrı bildirim, kullanıcıya bildirimleri tümden kapattırır.

Günlük/haftalıkta eşleşmeler biriktirilir (pendingMatchIds) ve süre dolunca TEK özet bildirim gider ("3 yeni sonuç"). Anında seçilse bile ikiden fazla eşleşme tek bildirimde toplanır. "Kapalı"da eşleşmeler yine "görüldü" işaretlenir — aksi halde sıklık sonradan açıldığında aylar öncesinin sonuçları bir anda yağardı.

## Düzeltilen iki hata
Bildirim yalnızca ARAÇ SAHİBİ oturumundayken çalışıyordu; tamirci de arama kaydedebildiği hâlde onun aramaları hiç bildirim üretmiyordu. Ayrıca her eşleşme için ayrı bildirim atılıyordu: tek seferde 20 yeni ilan gelirse 20 bildirim. İkisi de düzeltildi ve bu bildirimlerin kendi aç/kapa anahtarı var (notifySavedSearches).`,
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
"Kullanıcılar ne diyor?" bölümü gerçek yorumlardan beslenir ve AKAN bir şerittir: en fazla 12 yorum, kendiliğinden ilerliyor, fare üzerine gelince duruyor, oklarla ve dokunmatik kaydırmayla da gezilebiliyor. Eskiden sabit üç karttı; her ziyarette aynı üç metni göstermek vitrin değil dekordu ve "gerçek yorumlar" iddiasını zayıflatıyordu. "Hareketi azalt" tercihi olan kullanıcıda otomatik ilerleme çalışmaz, şerit yalnızca elle kaydırılır.

## Rekabete aykırı değerlendirmeye karşı katmanlar
Bir tamircinin rakibinin puanını düşürmesi (ya da kendi puanını şişirmesi) bu pazar yerinin en kolay kötüye kullanım yolu. Dört katman var:

1. TAMİRCİ HESABI YORUM YAZAMAZ VE "FAYDALI" OYU VEREMEZ. Yorum müşteri deneyimidir; beğeni de yorumların sıralamasını etkilediği için aynı sınıfa girer. Tamirci gerçekten müşteriyse araç sahibi hesabıyla değerlendirir.
2. DOĞRULANMIŞ MÜŞTERİ ŞARTI: yorum, o tamircide TAMAMLANMIŞ bir randevu gerektirir. Sahte hesapla yorum yazmak önce gerçek bir randevu almayı ve tamamlamayı gerektirir.
3. KENDİNE YORUM KESİN ENGEL: araç sahibi hesabının e-postası ya da telefonu, yorum yazılan işletmenin bilgisiyle aynıysa aynı kişidir. (Telefon +E.164'e normalleştirilmiş saklandığı için bu karşılaştırma güvenilir — bkz. 6.3.)
4. RAKİP İŞARETİ: iletişim bilgisi BAŞKA bir işletme hesabıyla eşleşiyorsa yorum kaydedilir, görünür kalır ama PUAN ORTALAMASINA KATILMAZ ve okuyucuya bunun nedeni yazılır. Silmiyoruz, çünkü bir tamirci başka bir tamircinin gerçek müşterisi olabilir; ama sessizce puanı etkilemesine de izin vermiyoruz.

## Kayıt ağı karması
Ek bir ipucu olarak kayıt anındaki IP'nin TUZLANMIŞ KARMASI saklanır (ham IP değil). İki hesap aynı ağdan açıldıysa yorum işaretlenir. Bu TEK BAŞINA engel sebebi değildir: aynı ev, aynı ofis ve mobil operatör NAT'ı yüzünden ilgisiz kişiler de aynı IP'yi paylaşabilir.

## BİLİNEN SINIR
Farklı e-posta + farklı telefon + farklı ağ ile açılmış ikinci bir hesabı bu kontroller yakalamaz. Gerçek çözüm kimlik doğrulaması (ya da ödeme kartı doğrulaması) olurdu ve bu ölçekte yoktur. Bunun yerine kötüye kullanımın MALİYETİ artırılıyor: sahte yorum için gerçek bir randevu alınıp tamamlanmalı.`,
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
      {
        id: "hesapguvenlik",
        title: "17.4 Hesap güvenliği",
        body: `İlke: hesabın KALICI kontrolünü etkileyen hiçbir işlem, yalnızca oturum token'ıyla yapılamaz — mevcut ŞİFRE sorulur. Gerekçe: token çalınabilir (XSS, ödünç alınmış cihaz, kopyalanmış localStorage). Token'ı olan biri şifreyi/e-postayı değiştirebilseydi ya da hesabı silebilseydi, gerçek sahibi hesabından kalıcı olarak dışarıda kalırdı.

## Şifre değişimi diğer oturumları kapatır
AÇIK: şifre değiştirmek, o ana kadar açılmış diğer oturumları etkilemiyordu. Hesabı ele geçirilmiş biri şifresini değiştirdiğinde saldırganın elindeki token çalışmaya DEVAM ediyordu — yani şifre değiştirmek hiçbir şeyi kurtarmıyordu. Artık değişimde bu cihaz dışındaki tüm oturumlar sonlandırılıyor ve kaç oturumun kapandığı kullanıcıya söyleniyor. Yeni şifre en az 8 karakter ve eskisiyle aynı olamaz.

## Tüm cihazlardan çıkış
Ayarlarda açık oturum sayısı görünür ve tek tıkla bu cihaz dışındaki tüm oturumlar kapatılır. Bu işlem şifre İSTEMEZ: hesabı kaybettirmez, aksine güvenliği artırır — "telefonumu kaybettim" diyen birinin önüne engel koymak yanlış olurdu.

## E-posta değişimi
E-posta, şifre sıfırlamanın gittiği adrestir: onu değiştirmek hesabın kontrolünü devretmektir. Bu yüzden genel profil güncellemesiyle DEĞİŞTİRİLEMEZ (alan sunucuda düşürülür, admin için de), yalnızca mevcut şifre sorulan özel uçtan değişir. Başka bir hesapta kullanılan adres reddedilir ve değişiklik ESKİ adrese e-postayla bildirilir — e-posta değişimi hesap ele geçirmenin klasik adımıdır, gerçek sahibi bunu öğrenmeli.

## Hesap silme gerçekten siliyor
Bu düğme eskiden yalnızca "Hesabınız silindi (demo)" yazan bir bildirim gösteriyordu; hesap, araçlar ve oturumlar olduğu gibi duruyordu. Kullanıcıya verisinin silindiğini söyleyip saklamak hem yanlış bilgi hem de veri koruması açısından savunulamaz. Artık mevcut şifre sorulur; hesap, araçlar ve tüm oturumlar silinir. Randevu/teklif gibi KARŞI TARAFIN da tarafı olduğu kayıtlar silinmez (tamircinin işletme geçmişi tek taraflı yok edilemez) ama kişiyi tanımlayan alanlar anonimleştirilir. Bu ayrım kullanıcıya silme ekranında yazılı olarak söylenir.`,
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
  {
    id: "dagitim-ve-denetim",
    title: "22. Dağıtım Tuzakları ve Denetim Bulguları",
    summary: "Sunucuyu gerçekten çalıştırınca ortaya çıkan hatalar ve canlıya alırken bozulacak ayarlar.",
    pages: [
      {
        id: "ip-guvenligi",
        title: "22.0 IP GÜVENLİĞİ — ölçülen üç açık",
        body: `IP bu uygulamadaki BÜTÜN kötüye kullanım korumalarının temeli: giriş ve OTP kaba kuvveti, kayıt seli, VIN kazıma, teklif spam'i, analitik şişirme — hepsi "IP başına N deneme" ile sınırlanıyor. IP yanlış okunursa bu korumaların hiçbiri çalışmaz VE HİÇBİR HATA DA GÖRÜNMEZ. Sessizce kaybolan korumalar en tehlikelileridir.

## 1) SAHTE X-Forwarded-For — hız sınırının tamamı atlanıyordu (KRİTİK)
Ölçüm şuydu: \`TRUST_PROXY=true\` iken sınırı doldurup 429 aldıktan sonra, isteğe \`X-Forwarded-For: 1.2.3.4\` eklemek 401'e döndürüyordu. Yani saldırgan her isteğe rastgele bir IP yazar ve sınır diye bir şey kalmaz. Bu ayar el kitabının üretim için ÖNERDİĞİ ayardı.

Express'in kendi davranışı aslında doğru: en sağdaki girdiyi alır, onu da vekil yazar. Açık, vekil YOKKEN ya da vekil sayısı yanlışken oluşuyor — yani bir yapılandırma hatası. Ama sessizce bütün korumaları kapattığı için uygulamanın kendini savunması gerekiyordu.

İlk düzeltme denemem "zincir beklenen vekil sayısından kısaysa başlığı yok say" idi. TEK VEKİLLİ kurulumda bu YETMİYOR: istemcinin uydurduğu tek girdili başlık ile vekilin yazdığı tek girdili başlık uzunluk olarak aynıdır. Ayırt etmenin tek güvenilir yolu başlığa değil BAĞLANTIYA bakmaktı: isteği bize kim getirdi? Ters vekil neredeyse her zaman loopback'te ya da özel bir ağdadır (10.x, 172.16–31.x, 192.168.x, fc00::/7). Genel bir adresten gelen istek vekilden GEÇMEMİŞ demektir — vekil atlanmış ya da doğrudan porta gelinmiş — ve o durumda başlık tamamen yok sayılıyor. Egzotik kurulumlar için \`TRUSTED_PROXY_IPS\` ile açıkça liste verilebiliyor.

## 2) IPv6'da sınır anlamsızdı (YÜKSEK)
IPv6'da bir kullanıcıya tipik olarak /64 blok verilir: 18 kentilyon adres. "Adres başına 10 deneme" demek pratikte SINIRSIZ deneme demek — saldırgan her istekte yeni bir adres kullanır ve hiçbir sınıra takılmaz. Sınırlayıcı anahtarı artık IPv6'da /64 önekine indiriliyor: sınır kişiye uygulanıyor, adrese değil. Komşu /64'ler ayrı kovada, yani bir kişinin denemesi başkasını cezalandırmıyor.

## 3) Aynı istemci iki kovaya düşüyordu (ORTA)
IPv4 bağlantısı IPv6 soketinde \`::ffff:1.2.3.4\` biçiminde görünüyor. Normalleştirme olmadan aynı kişi bazen \`1.2.3.4\`, bazen \`::ffff:1.2.3.4\` anahtarı üretiyordu — "10 deneme" sınırı fiilen 20 oluyordu. Artık adresler tek biçime indiriliyor (port ve köşeli parantez de ayıklanıyor).

## Ayrıca: sınırlayıcının haritası sınırsız büyüyordu
Kayıt yalnızca kilidi dolmuş bir anahtar TEKRAR sorgulandığında siliniyordu; kilide ulaşmayan ve bir daha sorulmayan anahtarlar sonsuza kadar kalıyordu. IPv6'da anahtar çeşitliliği pratikte sınırsız olduğu için bu, kimlik doğrulaması gerektirmeyen ucuz bir bellek tüketme yoluydu. Artık süresi geçmişler seyreltiliyor ve sert bir üst sınır var; dolduğunda EN ESKİ kayıt düşüyor (en yeniyi atmak saldırganın kendi izini silmesine yardım etmek olurdu).

## Tek doğruluk kaynağı
Önceden 12 ayrı rota kendi \`req.ip || req.socket?.remoteAddress\` satırını yazıyordu — trust proxy çözümünü atlayan ve normalleştirme yapmayan bir yol. Aynı mantığın 12 kopyası, 12 farklı şekilde yanlış olabilir. Artık hepsi \`utils/clientIp.js\`ten geçiyor ve yeni bir rota kendi satırını yazarsa test düşüyor. Hız sınırı anahtarı \`rateLimitKey\` (kova), kayıt IP karması ise \`clientIp\` (gerçek adres) kullanıyor — karma kovadan üretilirse aynı /64'teki herkes "aynı kişi" görünürdü.

## Yapılandırma sessizce yanlış olamaz
Yanlış vekil sayısı iki ayrı şekilde zarar veriyor: fazla güven → sahte IP; eksik güven → bütün kullanıcılar tek kovaya düşer ve bir kişinin hatası siteyi herkese kapatır. İkisi de hiçbir hata üretmediği için açılışta ne yapıldığı günlüğe yazılıyor. \`IP_HASH_SALT\` tanımsızsa da uyarı veriliyor: o durumda salt her açılışta rastgele üretiliyor ve "aynı ağ" sinyali yeniden başlatmadan sonra sessizce çalışmaz hâle geliyor.

## Bu bölümün testi
\`tests/ip-security.test.mjs\` (48 kontrol) çözüm fonksiyonunu GERÇEKTEN çağırıyor — kaynağa bakıp "şu satır var" demek davranışın doğru olduğunu göstermez. Saldırı senaryolarının çoğu ancak farklı bir soket adresinden gelebileceği için (yerelde taklit edilemez) sahte istek nesneleriyle sınanıyor; ölçülen şey tam olarak sunucunun çalıştırdığı kod. Ayrıca güvenlik matrisinde gerçek sunucuya sahte başlıkla istek atılıp sınırın aşılamadığı doğrulanıyor.`,
      },
      {
        id: "trust-proxy",
        title: "22.1 Ters vekil arkasında IP (TRUST_PROXY)",
        body: `Sitedeki bütün hız sınırları (giriş denemesi, kayıt, VIN sorgulama, teklif yazma) İP ADRESİNE göre sayıyor. Express \`req.ip\`'yi doğrudan TCP bağlantısından okur.

## Tuzak
Uygulama Nginx, Cloudflare, Render, Heroku gibi bir vekil arkasına konulduğunda her isteğin kaynak IP'si vekilin IP'sidir. O anda bütün kullanıcılar TEK bir sayaca düşer: bir kişinin şifreyi üç kez yanlış girmesi ya da beş kayıt açması, siteyi HERKES için kilitler. Ters yönde de tehlikeli: körü körüne \`X-Forwarded-For\` başlığına güvenmek, saldırganın her istekte başlığı değiştirerek tüm sınırları atlaması demektir.

## Kural
\`app.set("trust proxy", 1)\` YALNIZCA \`TRUST_PROXY=true\` ortam değişkeniyle açılır ve yalnızca gerçekten bir vekilin arkasındayken açılmalıdır. Değişken varsayılan olarak kapalıdır — yerel çalıştırmada ve doğrudan internete bakan kurulumda doğru olan budur.

## İlgili ayar
\`REGISTER_LIMIT_PER_HOUR\` (varsayılan 5) kayıt sınırını işletmeye bırakır. Otomatik testler ve yük denemeleri bu sınıra takılmasın diye ayar var; canlıda düşük tutulmalı.`,
      },
      {
        id: "sifre-uclari",
        title: "22.2 Şifre uçları: kaldırılan kâhin ve admin-only sıfırlama",
        body: `Şifre değişiminin TEK meşru yolu \`POST /api/auth/change-password\`: mevcut şifreyi sorar ve başarıdan sonra diğer tüm oturumları kapatır. Bu iki koruma birlikte "hesabım ele geçirildi, şifremi değiştirdim" cümlesini anlamlı kılar.

## Kaldırılan: /:id/verify-password
Uygulama bu ucu artık hiç çağırmıyordu ama uç açıktı ve hız sınırı YOKTU. Çalınmış bir oturum token'ı, "bu şifre doğru mu?" sorusunu sınırsız sorarak hesabın DÜZ METİN şifresini bulabilirdi. Oturum token'ı normalde şifreyi ele vermez; bu uç veriyordu — ve insanlar aynı şifreyi başka sitelerde de kullanıyor. Uç tamamen kaldırıldı.

## Daraltılan: /:id/set-password
Önceden "kendisi ya da admin" idi. Yani çalınmış bir token, MEVCUT ŞİFREYİ BİLMEDEN yeni şifre koyabiliyor ve gerçek sahibi hesabından kalıcı olarak kilitleyebiliyordu — change-password'ün iki korumasını da baştan aşarak. Uç artık SADECE ADMIN'e açık; kullanıcının kendi şifresini değiştirme yolu tektir.

## Admin sıfırlaması oturumları kapatır
Bir yönetici şifre sıfırlıyorsa sebebi genelde "hesap ele geçirildi"dir. Saldırganın token'ı ayakta kalırsa sıfırlama hiçbir işe yaramaz; bu yüzden sıfırlama hedefin bütün oturumlarını siler ve kaç oturum kapandığını döner.`,
      },
      {
        id: "denetim-bulgulari",
        title: "22.3 Sunucuyu çalıştırınca çıkan hatalar",
        body: `Hepsi statik testlerin GÖREMEDİĞİ, yalnızca gerçek istek atınca ortaya çıkan hatalardı.

## 1) Analitik uçları ?days olmadan 500 veriyordu
Sorgular \`.all({ cutoff })\` ile çağrılıyordu; \`cutoff\` tanımsızken SQLite bağlama hatası veriyordu. Yani gün filtresi seçilmeden açılan her analitik ekranı boş dönüyordu. Düzeltme: \`const bind = (cutoff) => (cutoff ? { cutoff } : {})\`.

## 2) Eksi teklif kabul ediliyordu
Tutar "rakam olmayan her şeyi at" mantığıyla ayrıştırılıyordu: "-5" gönderildiğinde eksi işareti atılıyor ve 5 TL'lik GEÇERLİ bir teklif oluyordu. Doğrulama girdiyi DÜZELTMEK için değil REDDETMEK için vardır: önce sayıya çevir, sonra tam sayı/pozitif/üst sınır kontrolü yap.

## 3) Veritabanı kısıtı 500 dönüyordu
Zorunlu alan eksik bırakılınca NOT NULL/UNIQUE hatası kullanıcıya "sunucu hatası" olarak gidiyordu. Bunlar kullanıcı hatasıdır: artık 400 ve anlaşılır Türkçe mesaj.

## 4) Aynı ağdan kaydolmak tamircinin puanını sıfırlıyordu
Yorum yazan ile tamirci aynı IP'den kaydolmuşsa yorum "rakip" diye işaretleniyor, işaretli yorumlar ortalamaya girmediği için puan sıfırlanıyordu. Aynı ev, aynı ofis, aynı kafe, mobil operatörün CGNAT'ı — hepsi aynı IP'yi paylaşır; bu kanıt değil. Ağ eşleşmesi artık yalnızca inceleme için \`sameNetworkSignal\` olarak kaydediliyor, puanı etkilemiyor. Puanı yalnızca gerçek bir bağ (aynı e-posta/telefonla açılmış işletme hesabı) etkiler.

## Yöntem notu
Bu dördü, "kodu okuyup kural arayan" 1000'den fazla iddianın arasından geçmişti. Bir davranışın doğru olduğunu iddia etmenin tek dürüst yolu onu çalıştırıp sonucu veritabanından okumaktır.`,
      },      {
        id: "matris-bulgulari",
        title: "22.4 Otomatik matrisin bulduğu açıklar",
        body: `Uç listesi koddan üretilip 128 ucun tamamına aynı sorular sorulduğunda, ELLE yazılan 250'den fazla uçtan uca kontrolün kaçırdığı yedi sorun çıktı. Ortak özellikleri: hiçbiri "ekranda görünen" bir hata değil.

## 1) Kayıt IP karması herkese açıktı (YÜKSEK)
\`signupIpHash\` hiçbir yanıttan çıkarılmıyordu; girişsiz biri \`GET /api/mechanics\` ve \`GET /api/owners\` ile tüm kullanıcıların karmasını çekebiliyordu. Karma IP'yi geri vermez ama EŞİTLİĞİ verir: "hangi hesaplar aynı ağdan açılmış" haritası çıkar — aynı ev, aynı ofis, aynı tamirhane. Bu bir kimlik bağlama sinyali. Ayrıca kötü niyetli biri hangi hesabın işaretleneceğini önceden öğrenip tespitten kaçabilirdi. Artık hiç kimseye dönmüyor, yöneticiye de değil.

## 2) Doğrulama belgeleri herkese açıktı (ORTA)
\`verificationDocs\` tamircinin doğrulama için yüklediği belgeler (vergi levhası, ruhsat gibi). Rozetin kendisi herkese açık bilgi, belgeler değil. Artık yalnızca tamircinin kendisi ve yönetici görüyor.

## 3) Tek bir istek TÜM SUNUCUYU düşürebiliyordu (KRİTİK)
Express 4, async bir rota işleyicisinin reddedilen sözünü yakalamaz; hata Node'un unhandledRejection yoluna düşer ve Node 22 varsayılanında süreç sonlanır. "Hesabımı sil" akışındaki bir veritabanı kısıt hatası backend'i komple kapattı. Yani giriş yapmış herhangi bir kullanıcı, kendi hesabını silmeye çalışarak siteyi HERKES için düşürebiliyordu. Üç katmanlı düzeltme: asıl hata giderildi, tüm async işleyiciler sarmalandı (utils/asyncRoute.js), ve süreç düzeyinde son savunma eklendi. Statik bir test yeni bir sarmasız işleyicinin eklenmesini engelliyor.

## 4) Hesap silme, randevusu olan kullanıcılarda HİÇ çalışmıyordu (YÜKSEK)
appointments/quote_requests/conversations owners(id)'ye yabancı anahtarla bağlı. Kayıtlar bilerek silinmiyor (karşı tarafın işletme geçmişi) ama bağ koparılmadığı için silme kısıt hatası veriyordu. Artık ad anonimleştiriliyor VE bağ koparılıyor; ikisi birlikte olmazsa ya veri silinmiş sayılmaz ya da silme hiç çalışmaz.

## 5) Kişisel öneri profili hesap silindikten sonra kalıyordu (YÜKSEK)
Kullanıcı "hesabımı sil" dediğinde kastettiği şey "verimi tutmayı bırak"tır. Ana kaydı silip ondan türetilmiş kişisel profili saklamak, silme talebini teknik bir kurnazlıkla boşa çıkarmaktır. Artık iki rolde de siliniyor.

## 6) Silinen kullanıcının ilanları yayında kalıyordu (ORTA)
Tamirci kolunda düşünülmüş, araç sahibi kolunda atlanmış: ilan "active" kalıyor, alıcı teklif verip soru soruyor, karşı tarafta kimse yok. Ayrıca yorum anonimleştirmesinde ikinci bir tuzak vardı — yorumlar tabloda anonimleşiyor ama \`mechanics.reviewList\` önbelleği (JSON kopya) gerçek adı tutmaya devam ediyordu. Veriyi iki yerde tutmanın bedeli budur; o yüzden tek yazma yolu her zaman yeniden hesaplamadan geçiyor.

## 7) Yanlış türde alan 500 üretiyordu (ORTA)
Metin bir sütuna dizi/nesne gönderildiğinde SQLite sürücüsü kısıt hatası olmayan bir tür hatası atıyor, bu da 400'e çevrilmeyip 500 "Internal server error" olarak dönüyordu. Her CRUD ucunda geçerliydi. Artık bağlanamayan değerler 400 ile ve hangi alan olduğu söylenerek reddediliyor.

## Ayrıca: sınırsız liste
Liste uçları tablonun tamamını döndürüyordu ve okuma tarafında hiçbir sınır yoktu (10 tamirci = 15 KB; 10.000 tamirci = 15 MB, saniyede onlarca kez istenebilir). \`?limit\` / \`?offset\` eklendi, yüksek bir güvenlik tavanı kondu ve her yanıtta \`X-Total-Count\` başlığı dönüyor — sessizce kırpmak "veri kayboldu" hatalarının kaynağıdır, kırpılma GÖRÜLEBİLİR olmalı. Okuma tarafındaki istek sayısı sınırı dağıtım katmanının işi: uygulama içinde IP başına okuma sınırı koymak, vekil arkasında (bkz. 22.1) tüm kullanıcıları tek sayaca düşürüp siteyi herkese kapatma riski taşıyor.`,
      },
      {
        id: "ikinci-tur-bulgular",
        title: "22.5 İkinci turda çıkanlar — matrisin SORMADIĞI sorular",
        body: `Matris ilk turda yedi açık buldu. Ama matrisin kendisi de eksikti: yalnızca GÖVDEYİ zorluyordu ve kimlik akışının ince noktalarına hiç dokunmuyordu. Genişletilince beş şey daha çıktı.

## 1) Yönetici değişiklik günlüğüne DÜZ METİN ŞİFRE yazılıyordu (KRİTİK)
Yönetici bir kullanıcının şifresini sıfırladığında istemci denetim kaydına \`after: { field: "password", value: "<yeni şifre>" }\` gönderiyordu. Şifreler her yerde bcrypt ile saklanıyorken aynı şifre kalıcı bir tabloya düz metin düşüyor ve \`GET /api/admin/change-log\` ile geri okunabiliyordu. Bu tabloyu okuyan herkes (başka bir yönetici, bir yedek dosyası, bir sızıntı) şifreyi olduğu gibi görür — ve insanlar aynı şifreyi başka sitelerde de kullanıyor. bcrypt'in bütün amacı "veritabanını ele geçiren şifreyi öğrenemesin"di; tek bir düz metin sütun o çabayı boşa çıkarır.

Düzeltme üç parçalı: (a) sunucu artık şifre benzeri alanları kaydetmeden maskeliyor — istemcinin maskesine güvenmek yeterli değil, eski bir istemci ya da doğrudan API kullanımı onu atlar; (b) istemci değeri artık hiç göndermiyor (gönderilmeyen veri sızdırılamaz); (c) veritabanında ZATEN yazılmış satırlar tek seferlik bir temizlikle maskelendi — bir açığı kapatırken açığın ÜRETTİĞİ veriyi de temizlemek gerekir. Kayıt silinmiyor: "şifre değiştirildi" bilgisi denetim için gerekli, gizlenen yalnızca değer.

## 2) \`?field=__proto__\` sunucu hatası üretiyordu (ORTA)
Analitik kırılım ucunda sütun beyaz listesi düz bir nesneydi ve \`FIELDS[field]\` ile sorgulanıyordu. \`__proto__\` gönderildiğinde arama beyaz listeye değil nesnenin PROTOTİPİNE düşüyor ve truthy bir değer dönüyordu; bu değer sütun adı olarak SQL'e girip 500 üretiyordu. Aynı tuzak \`constructor\` ve \`toString\` için de geçerliydi. Beyaz liste artık prototipsiz (\`Object.create(null)\`) ve arama sahiplik kontrolüyle yapılıyor — "beyaz liste" gerçekten beyaz liste.

## 3) \`?days=999999999999\` bütün analitik uçlarını 500 yapıyordu (ORTA)
Tarih hesabı JavaScript'in geçerli tarih aralığının dışına çıkıyor, \`toISOString()\` hata fırlatıyordu. Üst sınır kondu (10 yıl): daha eskisi "tüm zamanlar" ile aynı şey.

## 4) Bekleyen girişler sınırsız büyüyebiliyordu (ORTA)
\`pendingLogins\` bellek içi bir eşleme ve süpürücüsü yalnızca SÜRESİ DOLANLARI siliyor. Giriş sınırlayıcısı ise yalnızca BAŞARISIZ denemeleri sayıyor — yani geçerli şifresi olan biri art arda giriş çağırarak 10 dakika boyunca belleği şişirebilirdi. Üst sınır kondu ve dolduğunda en eski bekleyen giriş düşüyor: yeni girişleri reddetmek, saldırganın meşru kullanıcıları kilitlemesine izin vermek olurdu.

## 5) Oturum süresi kontrolü BOZULDUĞUNDA izin veriyordu (YÜKSEK — savunma sertleştirmesi)
Bu, testi yazarken yanlışlıkla bulundu: \`createdAt\` epoch milisaniye olarak saklanıyor, testte oraya METİN yazdım ve oturum GEÇERLİ çıktı. Sebep şu: \`Date.now() - "2026-..."\` NaN olur ve \`NaN > TTL\` her zaman false'tur — kontrol sessizce geçer, o jeton sonsuza kadar çalışır, hiçbir hata da görünmez. SQLite gevşek tipli olduğu için eski bir şema, elle müdahale ya da hatalı bir göç bunu gerçekten üretebilir.

Bir güvenlik kontrolünün en kötü hâli, bozulduğunda hata vermek yerine İZİN VERMESİDİR. Değer artık sayıya çevriliyor ve sayı değilse oturum geçersiz sayılıp siliniyor. Yanlış tarafta hata yapmanın bedeli "kullanıcı tekrar giriş yapar"; diğer tarafta bedeli "çalınmış jeton sonsuza kadar çalışır".

## Doğrulanıp SAĞLAM çıkanlar
Hesap sayımı (account enumeration) kapalı: var olan ve olmayan e-posta hem giriş hem şifre sıfırlamada aynı kodu ve aynı mesajı alıyor. OTP tek kullanımlık ve bilet başına 5 denemeden sonra düşüyor. Sütun adı beyaz listesi dışında SQL'e hiçbir kullanıcı girdisi girmiyor (14 farklı enjeksiyon denemesinden sonra tablolar yerinde). \`dangerouslySetInnerHTML\` hiçbir yerde yok. CORS izinli kaynak listesi ortam değişkeninden okunuyor.

## Ops uyarısı: paylaşımlı IP
OTP ve giriş sınırlayıcıları IP başına çalışıyor ve 15 dakika kilitliyor. Paylaşımlı bir çıkış arkasında (ofis, CGNAT) bir kişinin kaba kuvvet denemesi aynı çıkıştaki HERKESİN girişini kilitler. Bu yüzden ikisi de ortam değişkeniyle ayarlanabilir (LOGIN_LIMIT_PER_WINDOW, OTP_IP_LIMIT_PER_WINDOW) — ama BİLET BAŞINA deneme sınırı ayarlanamaz: kodun kendisini korumak pazarlık konusu değil. Bkz. 22.1 (TRUST_PROXY).`,
      },
      {
        id: "tarayici-yuzeyi",
        title: "22.6 Tarayıcı tarafı saldırı yüzeyi",
        body: `Buraya kadarki denetim sunucu-sunucu bakış açısıydı: istek at, yanıta bak. Tarayıcıdan gelen saldırılar AYRI bir yüzey — kötü niyetli bir site, kurbanın tarayıcısını kullanarak bizim API'mize istek attırabilir, sayfamızı kendi sayfasına gömebilir ya da sayfamıza script sokabilir. Güvenlik matrisinin ilk sürümü hiç \`Origin\` başlığı göndermiyordu, yani bu yüzeyi HİÇ sınamıyordu.

## Neden burada bahis yüksek: jeton localStorage'da
Oturum jetonu localStorage'da tutuluyor — sayfa yenilemesinde oturumun sürmesi için pratik bir seçim, ama bedeli şu: sayfaya SCRIPT sokabilen biri jetonu okur ve hesabı devralır. Yani bu projede XSS "çirkin bir açık" değil, doğrudan HESAP DEVRİ demek. Üç katman birden gerekiyor.

## Katman 1 — kodda tehlikeli havuz yok
\`dangerouslySetInnerHTML\`, \`innerHTML\` ataması, \`insertAdjacentHTML\`, \`eval\`, \`new Function\`, \`document.write\`: hiçbiri kullanılmıyor ve test bunu her koşuda doğruluyor. React metni kendiliğinden kaçırdığı için kullanıcı içeriği ekrana güvenle basılıyor.

## Katman 2 — kullanıcı adresleri süzülüyor
Kullanıcının girdiği her adres \`safeHref\`ten geçiyor: yalnızca http/https/mailto/tel geçerli, \`javascript:\` reddediliyor. Bu önemli çünkü \`<a href="javascript:...">\` tıklandığında script çalıştırır ve o script jetonu okur. \`data:\` tamamen yasaklanamıyor (CV yüklemesi data URI olarak saklanıyor) ama yalnızca zararsız içerik türlerine izin var; \`data:text/html\` asla. Yeni sekmede açılan her bağlantıda \`rel\` var — yoksa açılan sekme, açan sayfayı başka bir adrese yönlendirebilirdi.

## Katman 3 — CSP (yalnızca üretim derlemesinde)
\`script-src 'self'\` sayfaya dışarıdan ya da satır içi script sokulmasını engelliyor; \`object-src 'none'\`, \`base-uri 'self'\` (\`<base>\` enjekte edip tüm göreli adresleri saldırgana yönlendirme numarası), \`form-action 'self'\` de kapalı. \`img-src\`/\`connect-src\` bilerek geniş: ilan fotoğrafları dış adreslerden geliyor ve API adresi dağıtıma göre değişiyor — buraya dar bir liste yazmak yanlış yapılandırmada siteyi çalışmaz hâle getirir, ve çalışmayan bir site kapatılan bir CSP demektir.

CSP yalnızca DERLEMEDE ekleniyor: Vite geliştirme sunucusu sıcak yenileme için satır içi script enjekte ediyor, \`script-src 'self'\` onu keser ve \`npm run dev\` çalışmaz. Geliştiriciyi engelleyen bir önlem, kapatılana kadar yaşar.

\`frame-ancestors\` CSP'ye YAZILMADI: meta etiketiyle verildiğinde tarayıcılar onu yok sayar, yazmak yanlış güven verirdi. Çerçeveleme koruması sunucu başlığıyla gelir — API'de \`X-Frame-Options: DENY\` var (hata yanıtlarında da), ön yüzü barındıran sunucuda da ayarlanmalı.

## CORS: reddetmek bir HATA değildir
Önceki hâlde izinsiz bir origin 500 alıyordu. İki sorun: (1) sunucuda bozulan bir şey yok, istek sadece izinli değil — 500 izleme panelinde gerçek arızalarla karışır; (2) her istek hata katmanından geçip tam yığın izini günlüğe yazdığı için, herhangi bir sayfadaki JS saniyede yüzlerce istekle sunucunun günlüğünü bedava şişirebilirdi. Doğrusu CORS başlığını EKLEMEMEK: koruma başlığın yokluğundan gelir. Alt dize tuzağı da test ediliyor — "localhost:5173.evil.com" izinli görünmüyor.

## Klasik CSRF yapısal olarak kapalı
Sunucu hiç çerez kullanmıyor; oturum jetonu Authorization başlığında. Tarayıcı bu başlığı başka bir sitenin isteğine kendiliğinden eklemez, dolayısıyla "kurbanın oturumuyla habersiz işlem yaptırma" mümkün değil. Bir gün çerez tabanlı oturuma geçilirse ilgili test düşer ve CSRF jetonu gerekli hâle gelir.

## Sunucu-sunucu testin GÖREMEDİĞİ bir hata
\`X-Total-Count\` başlığı eklendiğinde testler geçiyordu ama tarayıcıda okunamıyordu: çapraz kaynaklı yanıtta tarayıcı, \`Access-Control-Expose-Headers\` ile açıkça izin verilmeyen her başlığı JS'ten GİZLER. Test istemcisi tarayıcı olmadığı için CORS kuralları ona uygulanmıyordu. Ders şu: tarayıcıya bağlı bir davranışı sunucu-sunucu testle doğrulamak yetmez — yapılandırmanın kendisi de sınanmalı.`,
      },

    ],
  },
  {
    id: "oneriler",
    title: "23. Öneriler, Kişiselleştirme ve Sıfır Sonuç",
    summary: "\"Senin için\" nasıl çalışıyor, hangi veri tutuluyor, izin nasıl yönetiliyor.",
    pages: [
      {
        id: "nasil-calisiyor",
        title: "23.1 Öneri motoru — üç katman",
        body: `Netflix ve Amazon tek bir algoritma kullanmıyor; birkaç sinyali harmanlıyorlar. Buradaki tasarım aynı fikri bu pazar yerinin ölçeğine indiriyor.

## 1) Örtük sinyal — tek gerçekçi kaynak
Kimse "bu ilanı beğendim" düğmesine basmaz, ama insanlar ilanlara bakar, arar, karşılaştırır, favoriler. Netflix'in dayandığı şey de bu: açık puan azdır, davranış boldur. Ağırlıklar niyetin gücüne göre: bakmak 1, aramak 1,5, karşılaştırmak 2,5, favorilemek 4, teklif vermek 6. Favoriden ÇIKARMA sinyal değildir — vazgeçmenin ne anlama geldiği belirsizdir.

## 2) İçerik temelli — ana motor
Kullanıcının zevk profiliyle (marka, kasa tipi, yakıt, şanzıman, şehir, fiyat bandı) ilanın özellikleri eşleştirilir. Bu ANA motor, çünkü ölçek küçük: Netflix'in milyonlarca kullanıcısı var, biz yeni bir pazar yeriyiz. Az kullanıcıyla işbirlikçi süzgeç "soğuk başlangıç" yüzünden saçmalar; marka/fiyat benzerliği ilk günden çalışır.

## 3) Ürün-ürün benzerliği — "bu ilana bakanlar buna da baktı"
Amazon'un item-to-item yöntemi. ANONİM oturum akışından hesaplanır: aynı oturumda hangi iki ilana bakıldığı. Kullanıcıyı profillemediği için İZİN GEREKTİRMEZ ve izin vermeyen kullanıcıda da çalışır. Tek bir kişinin gezintisi benzerlik sayılmaz — en az iki farklı oturum gerekir. Pencere 60 gün: altı ay önce satılmış bir arabaya bakanların davranışı bugünü açıklamaz.

## Unutma
Bir ay önceki ilgi dünkü kadar güçlü değil; ağırlıklar okunurken yaşa göre azaltılıyor. Ayrıca tek bir değerin profili ele geçirmemesi için ağırlık tavanı var (bir markaya 200 kez bakmak onu sonsuz güçlü yapmaz).

## Her önerinin GEREKÇESİ yazılı
Netflix'in "X izlediğin için" satırının karşılığı. İki sebeple zorunlu: gerekçesiz öneri rastgele görünür ve güven kazanmaz; ayrıca kişiselleştirmenin neye dayandığını göstermeden "verini işliyoruz" demek rızayı biçimsel bir onay kutusuna indirger.`,
      },
      {
        id: "veri-ve-izin",
        title: "23.2 Hangi veri tutuluyor, izin nasıl çalışıyor",
        body: `## Gezinme geçmişi SAKLANMIYOR
Ham "şu ilana şu saatte baktı" kaydı tutulmuyor. Onun yerine baktıklarından çıkarılmış küçük bir ZEVK PROFİLİ var: "Volkswagen: 3,0", "Dizel: 1,5", "300–500 bin bandı: 2,0". Üç faydası:
1. Çok daha az veri — neyi sevdiğin, ne zaman ne yaptığın değil.
2. Amaca bağlı — bu özetten geçmişin geri kurulamaz.
3. GÖSTERİLEBİLİR — ayarlarda "hakkımda ne tutuyorsunuz" ile ekrana basılıyor.

## Varsayılan KAPALI
Davranıştan profil çıkarmak profillemedir ve açık rıza ister. "Zaten kabul etmiş sayılır" varsaymak hukuken de ahlaken de yanlış olur. Rızanın ne zaman verildiği (recsConsentAt) kaydediliyor; ispat yükümlülüğü bizde.

## Kapatınca SİLİNİYOR
Kapatmak yalnızca yeni yazmayı durdurmaz; birikmiş profil de silinir. Veriyi elde tutmak da işlemedir.

## Kontrol SUNUCUDA
İstemci "sakla" dese bile izin yoksa hiçbir şey yazılmaz ve yanıt {stored:false} döner. İstemcide bir "izin var mı" bayrağı taşıyıp ona güvenmek, o bayrağı bozan her hatayı sessiz bir gizlilik ihlaline çevirirdi.

## Özellikleri istemci belirlemiyor
İstemci yalnızca "şu ilana baktım" der; hangi özelliklerin saklanacağına sunucu, ilanı veritabanından okuyarak karar verir. Aksi halde biri kendi profiline istediği değerleri yazdırıp öneri sıralamasını manipüle edebilirdi. Serbest metin arama sorgusu hiç saklanmaz — kişisel bilgi içerebilir.

## İzin vermeyen cezalandırılmıyor
Kapalıyken bölüm kaybolmuyor: ürün-ürün benzerliği ve "şu sıralar çok bakılıyor" gösteriliyor, etiketi de dürüstçe "popüler" oluyor. Reddedeni boş ekranla cezalandırmak, rızayı gönüllü olmaktan çıkarır.`,
      },      {
        id: "sifir-sonuc",
        title: "23.3 Sıfır sonuç — \"tam uyan yok ama şunlar\"",
        body: `Sıfır sonuç, ARAMANIN başarısızlığıdır, kullanıcının değil. Katı bir filtre listeyi boşaltıyorsa doğru davranış filtreleri gevşetip yaklaşanları göstermektir. Bu desenin adı SORGU GEVŞETME (query relaxation); arama altyapılarının (Bloomreach, Elastic, OpenSearch) standart özelliği ve ticaret sitelerinde "tam eşleşme yok — benzerleri" bölümü olarak görünür.

## İki katman birlikte çalışıyor
1. HANGİ KRİTERİ KALDIRSAM: her kriter tek tek kaldırılıp kaç sonuç çıkacağı hesaplanıyor, sadece gerçekten sonuç getirenler tek tıkla uygulanabilir öneri olarak gösteriliyor. Bu, kullanıcının aramayı DÜZELTMESİNİ sağlar.
2. TAM UYAN YOK AMA BUNLAR: kriterlerin çoğunu karşılayan kayıtlar listeleniyor. Bu, kullanıcının aramayı düzeltmeden de bir şey bulmasını sağlar.

## Her kartta "neye uymuyor" yazılı — bu bilerek böyle
Pek çok site gevşetilmiş sonucu sessizce listeye karıştırıyor ve kullanıcı neden o kartın orada olduğunu anlamıyor ("ben dizel aramıştım, bu neden burada?"). Burada her kartın altında kaç kriterden kaçını tuttuğu ve hangi kritere uymadığı yazıyor. Böylece liste bir "belki" listesi olarak kalıyor, aramanın yerini almıyor.

## Kayıtlı aramayı düzenleme
Kayıtlı aramanın kalem simgesi bir DÜZENLEME PENCERESİ açıyor: ad, arama metni, konum ve filtreler aynı yerden değişiyor. Önceden yalnızca adı değiştiriyordu; kriterlerini değiştirmek isteyen aramayı silip baştan kurmak zorundaydı — ve sildiği anda "hangi ilanları zaten gördü" takibi sıfırlandığı için bir sonraki açılışta eski ilanların hepsi "yeni eşleşme" diye bildiriliyordu. Yani en masum düzenleme, bildirimleri çöpe çeviriyordu.

Kriter değişirse "görülenler" listesi YENİDEN hesaplanıyor; yalnızca ad değişirse dokunulmuyor (kriter değişmemiştir). Pencere, kaydetmeden önce "bu kriterlere şu an kaç kayıt uyuyor" bilgisini canlı gösteriyor — kullanıcı boş bir arama kaydedip sonra "hiç bildirim gelmiyor" diye şaşırmasın.

BİLİNÇLİ SINIR: araç aramasının 35'in üzerinde filtresi var; hepsini bu pencereye kopyalamak aynı arayüzün ikinci bir kopyasını yaratırdı ve biri düzeltilip diğeri unutulduğunda ikisi ayrışırdı. Bu yüzden pencerede karar veren alanlar doğrudan düzenleniyor (fiyat, yıl, km, yakıt, vites, kasa; tamircide puan/doğrulanmış; iş ilanında çalışma türü/deneyim), kalan aktif filtreler rozet olarak listelenip tek tıkla kaldırılabiliyor. Sıfırdan karmaşık bir filtre kurmanın yolu zaten arama ekranı: oradaki filtre panelini kullanıp "kriterleri şu ankiyle değiştir" demek.

## Neyin gösterilmeyeceği de bir karar
- Hiçbir kriteri tutmayan gösterilmez: o bir "belki" değil, rastgele bir kayıttır.
- Tam eşleşen gösterilmez: o zaten normal sonuçtur.
- Tek kriter varsa bu bölüm hiç çıkmaz: tek kriteri de tutmuyorsa "kısmen uydu" diye bir şey yoktur; doğru cevap "bu kriteri kaldır" önerisidir.
- Donanım listesi tek kriter sayılmaz; her donanım ayrı bir "uymadı" sebebidir, yoksa "üç donanımdan ikisi var" bilgisi kaybolur.

Sıralama ve eleme kuralları saf bir işlevde (helpers.ts scoreNearMisses) — React'e bağlı olmadığı için testlerde gerçekten çalıştırılarak denetleniyor.`,
      },

    ],
  },
  {
    id: "tarayici-uyumlulugu",
    title: "24. Tarayıcı Uyumluluğu ve Duyarlılık",
    summary: "Hangi tarayıcılarda ne değişiyor, hangi tuzaklar kapatıldı, neyi hâlâ tarayıcıda denemek gerekiyor.",
    pages: [
      {
        id: "motorlar",
        title: "24.1 Üç motor, beş tarayıcı",
        body: `Pazarda beş büyük tarayıcı var ama PRATİKTE ÜÇ MOTOR var — ve uyumluluk motorun işi, tarayıcı markasının değil.

## Blink — yaklaşık %78
Chrome (~%69), Edge (~%5) ve Samsung Internet (~%2) aynı motoru kullanıyor. Chrome'da çalışan bir şey Edge ve Samsung Internet'te de çalışır; üçünü ayrı ayrı denemek uyumluluk açısından yeni bilgi vermez (arayüz kabuğu farklı, web içeriği aynı).

## WebKit — yaklaşık %16, RİSK BURADA
Safari. Hem masaüstünde hem iPhone/iPad'de (iOS'ta tüm tarayıcılar WebKit kullanmak zorunda — iPhone'daki "Chrome" da WebKit'tir). Özellik desteği diğerlerinin arkasından geliyor ve kendine özgü davranışları var. Bu bölümdeki kuralların çoğu Safari kaynaklı.

## Gecko — yaklaşık %3
Firefox. Genellikle standartlara yakın ama webkit ön ekli kuralları YOK SAYAR.

## Bundan çıkan kural
"Chrome'da çalışıyor" bir uyumluluk kanıtı değildir: pazarın %78'ini kapatır, kalan riski hiç ölçmez. Bir özellik eklerken sorulacak soru "Safari'de de var mı" ve "Firefox webkit ön ekine bakmadan bunu nasıl çiziyor".`,
      },
      {
        id: "kapatilan-tuzaklar",
        title: "24.2 Kapatılan tarayıcı tuzakları",
        body: `## 1) iOS'ta alan odaklanınca sayfa zoomlanıyordu — en görünür mobil hata
iOS Safari, yazı tipi 16px'ten KÜÇÜK bir input/select/textarea odaklandığında sayfayı otomatik yakınlaştırır ve odak kalkınca GERİ ALMAZ. Bu projede 265 alanın 213'ü Tailwind'in \`text-sm\` (14px) sınıfını kullanıyordu — yani telefonda formların neredeyse tamamı bunu tetikliyordu. Kullanıcı her alandan sonra iki parmakla uzaklaştırmak zorunda kalıyordu.

Düzeltme global bir CSS kuralı: dokunmatik işaretçide (\`pointer: coarse\`) alanlar 16px. 213 sınıfı tek tek değiştirmek birinin unutulması demekti; ayrıca masaüstü tasarımı da bozulurdu.

İnternette en çok önerilen "çözüm" viewport'a \`user-scalable=no\` yazmak. BUNU YAPMADIK: zoom'u kapatmak hatayı gizler ama az gören kullanıcıların yakınlaştırmasını da engeller (WCAG 1.4.4). Bir erişilebilirlik özelliğini kapatarak düzen hatası çözülmez.

## 2) Panoya kopyalama sessizce başarısız oluyordu
\`navigator.clipboard\` yalnızca GÜVENLİ BAĞLAMDA var. localhost güvenli sayılır ama telefondan \`http://192.168.1.x\` ile bakarken YOK. Eski kod başarısızlığı yutuyor ve yine de "Kopyalandı ✓" gösteriyordu — kullanıcı paylaşacağı linki kaybediyordu. Artık gerçekten kopyalandıysa onay veriliyor; kopyalanamadıysa link ekranda gösteriliyor ki elle seçilebilsin. iOS'ta \`select()\` yok sayılabildiği için yedek yolda \`setSelectionRange\` de var.

## 3) Bildirim izni eski Safari'de hiçbir şey yapmıyordu
\`Notification.requestPermission()\` modern tarayıcılarda söz (promise) döndürür; Safari uzun süre yalnızca GERİ ÇAĞRI imzasını destekledi ve \`undefined\` döndürdü — \`.then(...)\` çağırmak hata veriyordu. Düğme tıklanıyor, hiçbir şey olmuyor, kullanıcı sebebini hiç görmüyordu. Artık iki imza da destekleniyor. (iOS Safari'de Notification API HİÇ yok; o durum zaten ayrıca kontrol ediliyor ve kullanıcıya söyleniyor.)

## 4) Karanlık modda Firefox'un kaydırma çubukları açık kalıyordu
Karanlık mod \`::-webkit-scrollbar-thumb\` ile boyanıyordu; Firefox webkit kurallarını yok sayar. Standart karşılığı \`scrollbar-color\` eklendi.

## 5) Çentikli telefonlarda alt sekme çubuğu ana ekran çubuğunun altında kalıyordu
\`env(safe-area-inset-bottom)\` ile boşluk telefondan okunuyor. Bu değişken ancak \`viewport-fit=cover\` varsa dolu gelir — ikisi birlikte eklendi. Çentiği olmayan cihazlarda değer 0, hiçbir fark yok.

## 6) Mobilde 100vh adres çubuğunu da sayıyor
Tam ekran öğe alttan kesiliyordu. \`dvh\` tam bunun için var ama eski tarayıcıda yok; \`@supports\` ile geçiliyor, desteklemeyen tarayıcı eski davranışta kalıyor.

## 7) Pencere içi liste bitince arka plan kaymaya devam ediyordu
\`overscroll-behavior-y: contain\` ile kaydırma zincirlenmesi kesildi.

## Ayrıca doğrulandı
Regex geriye bakma (lookbehind) hiç kullanılmıyor — Safari 16.4 öncesinde bu bir SÖZDİZİMİ hatasıdır ve dosya hiç yüklenmez, uygulama komple açılmaz. Boşluklu tarih dizesi (\`"2026-01-01 10:00"\`) hiç ayrıştırılmıyor: Chrome kabul eder, Safari "Invalid Date" verir — "Chrome'da çalışıyor" tuzağının klasik örneği. \`Object.groupBy\`, \`toSorted\`, \`structuredClone\` gibi çok yeni API'ler kullanılmıyor. Depolama erişimlerinin hepsi try/catch içinde (Safari gizli gezintide \`localStorage.setItem\` HATA FIRLATIR; korumasız tek bir çağrı gizli sekmede uygulamayı açılışta düşürür). autoprefixer yapılandırmada ve kurulu — \`backdrop-filter\` ve \`line-clamp\` Safari ön eklerini o üretiyor, düşerse hata çıkmaz ama Safari'de bulanıklık ve satır kırpma sessizce kaybolur.`,
      },
      {
        id: "hala-denenmeli",
        title: "24.3 Test edilen ve HÂLÂ denenmesi gereken",
        body: `## Ne test ediliyor
\`tests/browser-compat.test.mjs\` 46 kontrolle kaynak kodu biliniyor uyumluluk tuzaklarına karşı tarıyor: çok yeni JS API'leri, regex tuzakları, korumasız tarayıcı API'leri, tarih ayrıştırma, iOS zoom kuralı, viewport ayarları, güvenli alan, dvh yedeği, autoprefixer, karanlık mod mekanizması, sabit genişlikler.

## DÜRÜST SINIR: bu takım tarayıcı ÇALIŞTIRMIYOR
Paketleyicinin derlenmiş ikilileri bu geliştirme ortamında çalışmadığı için uygulama paketlenip bir tarayıcıda açılamıyor. "Beş tarayıcıda denendi" demek yanlış olur. Takımın bulduğu şeyler gerçek — kaynağı belgelenmiş tarayıcı davranışları — ama tarayıcıda GÖZLE doğrulanmış değil.

## Gözle denenmesi gerekenler
Statik olarak ölçülemeyen şeyler şunlar, ve bir insanın bakması gerekiyor:
- Çok sütunlu ızgaraların 360px genişlikte gerçekten sıkışıp sıkışmadığı. Tehlike sütun SAYISI değil sütun GENİŞLİĞİ, o da kabın genişliğine bağlı — statik hesaplanamaz. Testte bilinen meşru kullanımlar gerekçeleriyle listede (takvim 7 gün olmak zorunda, emoji ızgarası 296px panelde 8×32px sığıyor); listede olmayan yeni bir ızgara eklenirse test düşer ve bir insan karar verir.
- Dokunma hedeflerinin gerçek ölçüsü (Apple 44pt, Google 48dp önerir). Kod \`p-2 -m-2\` deseniyle küçük simge düğmelerinin tıklama alanını büyütüyor ve testte bu desenin yaygın kullanıldığı doğrulanıyor, ama gerçek piksel ölçümü ancak tarayıcıda yapılır.
- Bilgi baloncuğu ve emoji panelinin portal yerleşimi: hangi kenardan açıldığı, ekran dışına taşıp taşmadığı.
- Uzun Almanca metinlerin dar kartlarda taşması (Almanca kelimeler Türkçeden belirgin uzun).
- iOS'ta klavye açıkken sabit konumlu öğelerin yeri (WebKit klavye açılınca görünüm penceresini farklı hesaplar).

Bunlar için doğru araç gerçek bir cihaz ya da tarayıcı otomasyonu (Playwright/BrowserStack); statik tarama onların yerine geçmez ve geçtiğini iddia etmemeli.`,
      },
    ],
  },
  {
    id: "olcek-ve-medya",
    title: "25. Ölçek, Medya ve Performans",
    summary: "Fotoğraflar nerede saklanıyor, ölçekte ne olur, hangi sınırlar neden konuldu.",
    pages: [
      {
        id: "medya-mimarisi",
        title: "25.1 Fotoğraflar nerede — ve bunun bedeli",
        body: `## Mevcut durum: fotoğraflar VERİTABANININ İÇİNDE
Bu projede HTTP dosya yükleme yok. Tarayıcı fotoğrafı \`FileReader.readAsDataURL\` ile base64'e çeviriyor ve değer, normal bir JSON alanı gibi SQLite'ın TEXT sütununa yazılıyor. Ayrı dosya sistemi, obje deposu ya da CDN yok.

Bu seçimin bir avantajı var ve önemsiz değil: dosya adı hiç kullanılmadığı ve dosya sistemine yazılmadığı için yol atlama (path traversal), çifte uzantı ve polyglot saldırıları YAPISAL OLARAK imkânsız. Ayrıca sunucu görseli hiç çözmediği için sıkıştırma bombası CPU riski de yok. Görseller kayıtların içinde olduğu için ayrı bir "tahmin edilebilir dosya adı" IDOR yüzeyi yok.

## Ama ölçekte bedeli ağır — ÖLÇÜLDÜ
10 ilana 1 kapak + 5 galeri fotoğrafı eklendi (SIKIŞTIRILMIŞ hâlleriyle, 250 KB/foto — yani iyimser senaryo):

\`\`\`
GET /api/listings   18 kayıt   14,67 MB   201 ms
ilan başına ortalama: 834 KB
\`\`\`

Bugün aynı uç 7,9 KB / 3 ms. Veritabanı dosyası 13,45 MB'a çıktı → fotoğraf başına ~224 KB depolama. 200.000 fotoğrafta (10.000 kullanıcı × 20) tahmini ~45 GB TEK SQLite dosyası; günlük yedeklemesi pratik değil.

## Asıl kısıt: bu görseller CACHE'LENEMEZ
Görseller kimlik doğrulamalı, dinamik bir JSON yanıtının İÇİNDE gömülü. Ayrı bir URL'i olmayan bir görsel ne tarayıcı cache'ine, ne CDN'e, ne \`immutable\` başlığına konabilir. Yani "CDN ekleyelim" bugünkü mimaride işe yaramaz — cache'lenecek ayrı bir kaynak yok. Bu, mimarinin çekirdek kısıtı ve medya uçlarının (Faz 4) asıl gerekçesi.

## Yeniden boyutlandırma kısmi
8 yükleme yolundan 2'si (ilan kapak + galeri) istemcide 1600px / JPEG q0.78'e indiriliyor. Profil fotoğrafı, tamirci kapak fotoğrafı, sohbet fotoğrafı, arıza ve teklif fotoğrafı HAM kaydediliyor. Ayrıca yeniden boyutlandırma istemcide olduğu için doğrudan API'ye giderek atlanabiliyor — bu yüzden sunucu tarafı tavan şart (bkz. 25.2).`,
      },
      {
        id: "faz1-sinirlar",
        title: "25.2 Faz 1: konulan sınırlar ve gerekçeleri",
        body: `Hiçbir mevcut davranış değiştirilmedi; yalnızca REDDETME ve SIKIŞTIRMA eklendi.

## Sunucu tarafı medya doğrulama (utils/mediaValidation.js)
Jenerik CRUD fabrikası TEXT sütunlarına yazarken hiçbir tür/boyut kontrolü yapmıyordu; tek sınır \`express.json({limit:"5mb"})\` idi.

Doğrulama ÜÇ mevcut biçimi de kabul ediyor — emoji (\`mechanics.img\`), https adresi (tohum kapak fotoğrafları) ve data URI (kullanıcı yüklemeleri). Bir güvenlik kısıtı meşru veriyi reddediyorsa o bir düzeltme değil, yeni bir hatadır; bu yüzden birim testlerin yarısı "hâlâ kabul ediliyor mu" sorusunu soruyor.

Reddedilenler: \`data:image/svg+xml\` (script taşıyabilir), \`text/html\`, \`javascript\`, görsel alanında PDF, ve tavanı aşan boyutlar. Tavanlar: tek görsel 2 MB, profil/avatar 1 MB (ekranda en fazla 120px gösteriliyor), belge 4 MB (PDF olabilir), dizi toplamı 12 MB, dizi öğe sayısı 20.

2 MB seçildi çünkü istemci tipik olarak 200-500 KB üretiyor — yani meşru yüklemenin ~4 katı. Sıkıştırmayı atlayan bir istemciyi bile kabul ediyor ama sınırsız yazmayı engelliyor.

SVG'yi DEPOLAMAYA almamak, göstermemekten daha sağlam: \`<img src>\` içinde script çalışmaz ama yarın "yeni sekmede aç" gibi bir gösterim yolu eklendiği an açık oluşurdu.

## Sohbet satırı tavanı
Eski değerler çarpıldığında ortaya çıkan şey şuydu: görsel başına 6 MB × sohbet başına 2000 mesaj = TEK BİR SATIR YASAL OLARAK 12 GB. Ve mesajlar tek JSON sütununda tutulduğu için her yeni mesaj bu satırı baştan okuyup baştan yazıyor — 100 MB'lık bir sohbette "merhaba" yazmak 100 MB okuma + 100 MB yazma demek.

Yeni sınırlar: görsel başına 2 MB, mesaj sayısı 2000 (değişmedi), ve asıl koruma olan sohbet TOPLAM boyutu 40 MB. Sayı sınırı tek başına yetmiyordu çünkü sorun mesaj sayısı değil, mesajların boyutuydu.

## Medya yazmalarında hız sınırı
Boyut tavanı bir isteğin ne kadar yazacağını sınırlıyor; hız sınırı KAÇ istek atılacağını. İkisi de gerekli: 2 MB tavanla dakikada 500 istek hâlâ gigabaytlar yazar. Sınır dakikada 30 ve YALNIZCA gövdesinde gömülü görsel olan yazmalara uygulanıyor — sıradan metin düzenlemeleri hiç etkilenmiyor.

## Gövde çok büyükse 413, 500 değil
\`express.json\` sınırı aşan gövdede \`PayloadTooLargeError\` fırlatıyor ve bu genel hata katmanına düşüp "500 Internal server error" oluyordu. İki ayrı sorun: yanlış cevap (sunucuda bozulan bir şey yok, istek fazla büyük) ve sessiz sebep (kullanıcı fotoğrafın büyük olduğunu öğrenemiyor). Artık 413 ve sınırı söyleyen bir mesaj dönüyor.

## Yanıt sıkıştırma (utils/compress.js)
Hiçbir yanıt sıkıştırılmıyordu. Ölçüldü: \`/api/mechanics\` 15,3 KB → 3,4 KB (4,5x).

\`compression\` paketi yerine \`node:zlib\` ile 40 satır yazıldı: yeni bir bağımlılık, güncellenmesi ve güvenlik takibi gereken yeni bir yüzey demek. Projenin geri kalanı da aynı ilkeyle yazılmış (helmet yerine dört başlık elle).

DÜRÜST SINIR: base64 kodlanmış JPEG zaten sıkıştırılmış bir görüntünün metin gösterimidir; gzip onu %0-5 küçültür. Bu değişiklik META VERİ yükünü düşürür, gömülü fotoğraf yükünü DÜŞÜRMEZ. Fotoğraf sorununun çözümü ayrı (medya uçları).

Kimlik uçları (\`/api/auth/*\`) kasıtlı olarak sıkıştırma dışında: kazanç yok, ve BREACH sınıfı saldırılara karşı ihtiyat (jeton/OTP gövdede geçiyor). Bu API'de ilgili koşul zaten yok — oturum jetonu Authorization BAŞLIĞINDA taşınıyor, çerez kullanılmıyor — ama küçük bir ihtiyatın bedeli de yok.`,
      },
      {
        id: "sonraki-fazlar",
        title: "25.3 Sıradaki fazlar ve neden şimdi değil",
        body: `Tam analiz ve ölçümler depo kökündeki PERFORMANS-RAPORU.md dosyasında.

## Faz 2 — UYGULANDI (bkz. 25.4)

## Faz 3 — kalan 6 yükleme yolunu istemcide yeniden boyutlandırmaya geçirmek + lazy loading
35 \`<img>\` etiketinden 13'ünde \`loading="lazy"\` var. Kalanlara eklenecek — ama hero ve ilk ekran görsellerine EKLENMEYECEK, yoksa ilk görüntü yavaşlar.

## Faz 4 — medya uçları (asıl mimari kazanç)
\`POST /api/media\` + \`GET /media/:hash\` + içerik karması dosya adı + \`immutable\` cache. İçerik karması olunca cache invalidation sorunu HİÇ oluşmuyor: içerik değişince URL değişir, kullanıcı profil fotoğrafını değiştirince eskisi cache'te kalsa bile kimse ona bakmaz. Kullanıcının verdiği dosya adı hiç kullanılmadığı için yol atlama da imkânsız kalır.

Mevcut base64 değerler OLDUĞU GİBİ çalışmaya devam eder — \`<img src>\` hem \`data:\` hem \`/media/...\` kabul ediyor. Yani mevcut fotoğrafların hiçbiri bozulmaz, silinmez, taşınmak zorunda değil.

Dosya sistemi seçildi, obje deposu değil: sıfır ek bağımlılık, sıfır ek maliyet, ve "veritabanına binary koymama" hedefini tam karşılıyor. Obje deposu (S3/R2) doğru ADIM ama İKİNCİ adım — çok sunucuya geçince ya da 100 GB'ı aşınca. Yol soyutlaması aynı kaldığı için geçiş tek modül değişikliği olur.

## ŞU ANDA GEREKSİZ görülenler
- **Kuyruk / arka plan worker:** sunucuda görsel işleme olmadığı için kuyruğa alınacak ağır iş yok. Eklemek gereksiz karmaşıklık.
- **CDN:** Faz 4'ten ÖNCE anlamsız — cache'lenecek ayrı bir görsel URL'i yok.
- **Obje deposu:** çok sunucu ya da 100 GB'da.
- **Sunucu tarafı görsel işleme (sharp):** istemci yeterli ve daha güvenli. Sunucuya native bağımlılık + CPU yükü + sıkıştırma bombası riski getirirdi. Sunucu yalnızca DOĞRULUYOR.
- **AVIF:** tarayıcıda üretilemiyor, sunucu tarafı işleme gerektirir.
- **Sunucu tarafı filtreleme + sayfalama:** arka uç hazır (\`?limit\`/\`?offset\` + \`X-Total-Count\`) ama frontend kullanmıyor ve filtreleme istemcide (35+ filtre). Görsel sorunu çözülünce ilan başına yük 834 KB'dan ~2 KB'a düşeceği için 10.000+ ilana kadar mevcut yaklaşım çalışır. Gerçekten gerektiğinde, ÖLÇEREK yapılacak.

## Bilinen ve kabul edilen sınır
SQLite tek yazıcılı. Yüksek eşzamanlı yazmada Postgres gerekecek — ama bu bugünün sorunu değil ve ölçülmeden yapılmamalı.`,
      },
      {
        id: "faz-2-indeksler",
        title: "25.4 Faz 2: indeksler ve sorgu planları",
        body: `## Önce bir düzeltme: ilk rapor yanlıştı

İlk performans raporu "6 indeks eksik" diyordu. Faz 2'de her sorgunun planı \`EXPLAIN QUERY PLAN\` ile okundu ve o listenin **3 satırı yanlış, 5 satırı eksik** çıktı.

Yanlış olanlar: \`vehicle_history.vin\` zaten indeksliydi; \`share_events.refCode\` ve \`blog_posts.slug\` ise \`UNIQUE\` tanımlı olduğu için SQLite kendiliğinden indeks üretiyordu. Eksik olanlar: \`appointments.mechanicId\`, \`conversations.ownerId\`, \`conversations.mechanicId\`, \`support_tickets(fromId, fromType)\` ve \`profile_views\`.

Hatanın sebebi yöntemdi: ilk rapor kaynak kodda \`CREATE INDEX\` arayıp sorgu sayısı saymıştı. İkisi de vekil ölçüt. Doğru ölçüt SQLite'ın o sorgu için ne YAPTIĞI:

- \`SCAN <tablo>\` → tablo baştan sona okunuyor
- \`SEARCH <tablo> USING INDEX\` → indeksten gidiliyor

Bir indeksin VAR OLMASI ile KULLANILMASI ayrı şeyler: sütun sırası yanlışsa, sütuna bir işlev uygulanmışsa ya da karşılaştırma olumsuzsa (\`!=\`) indeks orada durur ama plan yine taramadır. Bu yüzden testler (\`tests/e2e/api4.e2e.mjs\`) indeksin varlığına değil PLANA bakıyor, hem de gerçek \`db.js\`'in kurduğu gerçek veritabanı üzerinde.

## En büyük kazanç bir indeks değildi

\`GET /api/conversations\` hiç \`WHERE\` cümlesi kullanmıyordu: tüm sohbetleri okuyup JS'te süzüyordu. Gizlilik açısından doğruydu — kimse başkasının sohbetini görmüyordu — ama mesajlar gömülü fotoğraflarıyla birlikte satırın İÇİNDE olduğu için "mesajlarım" ekranını açan her kullanıcı veritabanındaki HERKESİN fotoğraflarını diskten okutup belleğe alıyordu.

Buraya indeks eklemek ve sorguyu olduğu gibi bırakmak hiçbir şeyi değiştirmezdi — "körlemesine indeks eklemek" tam olarak budur. O yüzden filtre SQL'e taşındı; kural birebir aynı:

| Rol | Eskiden (JS) | Şimdi (SQL) |
|---|---|---|
| admin | \`true\` | WHERE yok |
| owner | \`row.ownerId === actor.id\` | \`WHERE ownerId = ?\` |
| mechanic | \`row.mechanicId === actor.id\` | \`WHERE mechanicId = ?\` |

**Ölçüm — 301 sohbet, 390 MB mesaj verisi: 315 ms → 2 ms.**

Bir performans değişikliğinin en sinsi hatası gizlilik kuralını farkında olmadan gevşetmektir: SQL bir satır FAZLA döndürürse o iyileştirme değil, sızıntıdır. Bu yüzden testler dört rolü de ayrı ayrı sınıyor, listeyi tekil GET ile karşılaştırıyor (listede görünmeyen bir sohbet id'si tahmin edilince okunabiliyor mu?) ve \`ownerId\` NULL olan eski kayıtların kimseye görünmediğini doğruluyor.

## Eklenen 10 indeks

\`vehicles(ownerId)\` · \`appointments(ownerId)\` · \`appointments(mechanicId)\` · \`conversations(ownerId)\` · \`conversations(mechanicId)\` · \`support_tickets(fromId, fromType)\` · \`profile_views(targetType, targetId, createdAt)\` · \`quote_offers(requestId)\` · \`vehicle_history(ownerId, serviceDate DESC)\` · \`listings(status)\`

Üç tasarım kararı:

**Randevularda İKİ indeks var.** Rol hangi sütunla sorgulandığını belirliyor: araç sahibi için \`ownerId\`, tamirci için \`mechanicId\`. Sadece biri eklenirse diğer rolün ekranı taramada kalır.

**Destek talepleri BİLEŞİK.** Sorgu her zaman iki sütunu birlikte kullanıyor (\`fromId = ? AND fromType = ?\`), çünkü owner #7 ile mechanic #7 farklı kişiler. İki ayrı indeks aynı işi yapmaz.

**Sütun sırası profil görüntülemelerinde önemli.** \`(targetType, targetId, createdAt)\` — eşitlikler önce, aralık en sonda. Ters sırada indeks aralık sütunundan sonrasını kullanamaz. Sorgular yalnızca \`COUNT\`/\`SUM\` istediği için plan \`COVERING INDEX\` diyor: satırlara hiç gidilmiyor. **200.000 satırda 5,7 ms → 0,0 ms**, ve istatistik ekranı bu tabloda beş ayrı sorgu çalıştırıyor.

## Yazma maliyeti — tahmin değil, ölçüm

Her indeks, sütun değiştiğinde fazladan bir B-ağacı yazması demek. Ölçüldü: 200.000 satırlık tabloya 2000 ekleme indekssiz 224 ms, indeksli 230 ms → **%2,7** (satır başına ~0,003 ms).

Bu kadar küçük olmasının sebebi şu: eklenen sütunların hepsi SAHİPLİK/HEDEF alanı, yani satır oluşturulurken bir kez yazılıp bir daha neredeyse hiç değişmiyor (bir randevunun \`ownerId\`'si güncellenmiyor). Maliyet "her güncellemede" değil, "kayıt başına bir kez". Okuma kazancı ise her sayfa açılışında tekrar ediyor.

## Kasıtlı olarak EKLENMEYENLER

Körlemesine eklememek de bir karar, o yüzden gerekçeleri yazılı — hatta testlerde kayıt altında:

- **\`sessions(createdAt)\`:** tek okuyucusu süresi dolmuş oturumları silen periyodik iş. Karşılığında her GİRİŞTE fazladan yazma gelirdi — en sık yazılan yolu yavaşlatıp en seyrek okunan işi hızlandırmak. Üstelik tablo 7 günlük TTL ile kendiliğinden sınırlı.
- **\`listings(sellerId, sellerType)\`:** ilan listesi herkese açık ve filtresiz dönüyor, yani liste sorgusunda işe yaramaz. Tek kullanıcısı hesap silme (kullanıcı başına bir kez).
- **\`quote_requests(ownerId)\`:** aynı gerekçe.
- **\`mechanics\` filtre sütunları (price, rating, verified):** arama BUGÜN istemcide yapılıyor, sunucuya böyle bir sorgu hiç gitmiyor. Var olmayan bir sorgu için indeks eklemek ölçmeden karar vermek olurdu. Sunucu tarafı filtreleme yapıldığı gün birlikte eklenir.

## İyi haber olarak bulunanlar

Denetim sırasında en çok korkulan yer zaten sağlamdı: \`sessions.tokenHash\` her kimlik doğrulamalı istekte sorgulanıyor ve \`PRIMARY KEY\` olduğu için indeksli. Aynı şekilde \`owners.email\`/\`mechanics.email\` (giriş) ve \`translation_cache(fromLang, toLang, sourceText)\` (çeviri önbelleği) de \`UNIQUE\` sayesinde indeksli.`,
      },      {
        id: "faz-3-yukleme",
        title: "25.5 Faz 3: yükleme yolları ve iki gizli hata",
        body: `## Sekiz yükleme yolu, dört farklı yazım, üç hata

Bu projede HTTP dosya yükleme yok: fotoğraf tarayıcıda base64'e çevrilip normal bir JSON alanı gibi kaydediliyor. Dolayısıyla "dosyayı okuma" mantığı sekiz ayrı yerde yazılmıştı ve yazımlar aynı değildi:

| Yol | Eski hâli |
|---|---|
| İlan kapak + galeri | Doğru olan: küçültme + JPEG |
| Sohbet, profil, kapak, çalışan, teklif fotoğrafı | Ham \`readAsDataURL\` — çalışıyor ama 3-10 MB'lık dosyayı olduğu gibi saklıyor |
| **Arıza fotoğrafı** | \`URL.createObjectURL\` — **bozuk** |
| **CV** | \`URL.createObjectURL\` — **bozuk** |

## İki gerçek hata

\`URL.createObjectURL(file)\` o SEKMEYE ÖZEL geçici bir bellek referansı döndürür. Sunucuya \`blob:http://.../uuid\` diye kaydediliyordu. Sonucu:

**Arıza fotoğrafı:** araç sahibi randevuya fotoğraf ekliyor, kendi ekranında görüyor, hata da almıyor. Ama fotoğrafı görmesi gereken TAMİRCİ her zaman kırık görsel görüyordu. Yani özellik hiç çalışmıyordu ve arayüzde hiçbir belirti yoktu.

**CV:** aday CV'sini ekliyor, "başvuru gönderildi" mesajını görüyor, ama işveren dosyayı HİÇ açamıyor. Başvuru sistemi CV olmadan çalışıyordu. Üstelik \`utils/helpers.ts\`'teki \`safeHref\` yorumu "CV data: URI olarak saklanıyor" diyordu — kod o niyeti karşılamıyordu. Yorumun koddan daha iyimser olması, bu sınıf hatanın tipik belirtisi.

Aynı hata daha önce teklif, sohbet ve kapak fotoğrafında üç kez düzeltilmiş; bu iki yol atlanmıştı. Sebebi de belli: mantık sekiz yerde kopyalanmıştı. Şimdi tek dosyada (\`utils/mediaUpload.ts\`).

## Hedefler kullanım yerine göre

"Ne kadar küçültebiliriz" değil, "kalite kaybı görünür olmadan ne kadar küçülür":

| Ön ayar | Boyut | Neden |
|---|---|---|
| listing / cover | 1600px | Tam genişlik galeri, yakınlaştırma bekleniyor |
| chat / issue / quote | 1280px | Ekranda en fazla ~600px; 1280 retinada da net |
| avatar | 512px | Ekranda 40-120px, ama 3x ekran payı bırakıldı |

## Saydam PNG siyaha boyanmıyor

PNG'yi JPEG'e çevirmek saydam bölgeleri SİYAH yapar. Tamirci logosu ya da kurumsal kapak görseli saydam PNG olabiliyor; "%80 küçülttük" deyip logonun arkasını siyaha boyamak iyileştirme değil, görünür bozulmadır. Bu yüzden PNG geldiğinde alfa kanalına bakılıyor ve saydamlık varsa PNG olarak kalıyor (boyutlandırma yine uygulanıyor, kazanç oradan geliyor).

Maliyeti düşük tutmak için kontrol KÜÇÜLTMEDEN SONRA yapılıyor — 10 megapiksellik özgün dosyada değil, en fazla 1600px'lik tuvalde. Ayrıca \`getImageData\` hata verirse (farklı kökenli görselde tuval "kirlenir") güvenli varsayım saydamlık VAR: kayıpsız taraf seçiliyor.

## Üç geri dönüş noktası — hiçbir şey sessizce bozulmuyor

- **Görsel çözülemezse** (bazı tarayıcılarda HEIC, ya da SVG): ham veri dönüyor, kullanıcının dosyası kaybolmuyor. SVG ise sunucu onu zaten reddediyor ve bu doğru davranış.
- **Sıkıştırma dosyayı BÜYÜTÜRSE** orijinal korunuyor. Gerçek örnek: 2000x2000 düz renkli bir PNG diskte 1 KB olabilir; onu 512px JPEG'e çevirmek onlarca KB üretir.
- **Tavan aşılırsa** kullanıcı SEBEBİNİ okuyor: kaç MB olduğu, sınırın kaç MB olduğu ve ne yapması gerektiği. Sessizce göndermek sunucudan 400 alırdı ve kimse nedenini anlamazdı.

İstemci tavanları sunucu tavanlarıyla aynı olmalı; ayrışırlarsa kullanıcı anlamsız bir hata görür. Test iki dosyayı doğrudan karşılaştırıyor (\`tests/ui/media-upload.ui.mjs\`).

## Düzeltmenin kendi yan etkisi

Arıza ve teklif fotoğraflarında hiç sayı sınırı yoktu — ve olması da gerekmiyordu: eski kod \`blob:\` bağlantısı saklıyordu, yani her fotoğraf ~50 baytlık bir metindi. Fotoğrafları GERÇEKTEN saklamaya başlayınca her biri ~330 KB oldu. Sınır konmasaydı düzeltme yeni bir hata doğuracaktı: kullanıcı 50 fotoğraf ekler, kaydete basar, randevu sunucudan 400 alıp sessizce kaybolur.

Bu yüzden \`canAppendImage\` eklendi: 10 fotoğraf sayı sınırı (sunucu 20'ye izin veriyor, arayüz kullanıcıyı tavana çarpmaktan korumak için daha erken duruyor) ve toplam boyut kontrolü — 6 fotoğraf sayı sınırının altında kalır ama her biri 2 MB ise toplam tavanı aşar, o yüzden sayı tek başına yetmiyor.

**Bir hatayı düzeltirken doğurduğu yeni sınırı da düşünmek gerekiyor.** Ölçüm yapılmadan "artık gerçek fotoğraf saklıyoruz" demek, sorunu bir yerden alıp başka yere taşımak olurdu.

## Ölçüm (4032x3024 / 12 MP kaynak, 3,5 MB)

| Yol | Hedef | Sonuç | Kazanç |
|---|---|---|---|
| ilan/kapak (zaten vardı) | 1600px | 397 KB | 8,8x |
| sohbet / arıza / teklif (YENİ) | 1280px | 250 KB | 14x |
| profil / avatar (YENİ) | 512px | 31 KB | 114x |

Veritabanına yazılan değer base64 olduğu için %33 daha büyük: ham hâlde fotoğraf başına ~4,66 MB, sohbet fotoğrafında 333 KB, avatarda 41 KB.

**Bu ölçümün dürüst sınırı:** kaynak, gerçek bir kamera fotoğrafı değil — gerçekçi entropide sentetik bir görüntü (düz renkli bir test görseli gerçek dışı iyi sıkışırdı). Ayrıca kodlayıcı tarayıcının \`canvas.toDataURL\` motoru, ölçüm ise PIL ile yapıldı; oranlar gösterge niteliğinde, ondalık hassasiyette değil. İlan yolu bu boruyu zaten aylardır kullanıyor ve üretimdeki ölçüm (fotoğraf başına ~224 KB) buradaki 397 KB ile aynı büyüklük düzeyinde.

## Görsel öznitelikleri: raporun kısmen yanlış olduğu yer

Rapor "22 \`<img>\` etiketine \`loading="lazy"\` + \`width\`/\`height\` ekle" diyordu. Uygulamada üçü de yeniden değerlendirildi:

**\`width\`/\`height\` GEREKSİZ.** İşleri düzen kaymasını (CLS) önlemek. Ama 35 etiketin 34'ünde kutu zaten Tailwind ile sabit (\`w-full h-full object-cover\`, \`w-12 h-12\`). Kutu sabitse öznitelik hiçbir şey değiştirmez, CSS ile çelişirse zarar verir. Kalan birinde (sohbet balonu) kutuyu üst öğe sınırlıyor. Doğru iş, öznitelik eklemek değil gerekmediğini ölçüp yazmaktı — test bu kararı koruyor: biri Tailwind sınıflarını kaldırırsa kırmızı yanıyor.

**\`loading="lazy"\` BUGÜN etkisiz.** Fotoğraflar \`data:\` URI olarak JSON'un içinde geliyor; sayfa yüklendiğinde baytlar ZATEN gelmiş, ertelenecek ağ isteği yok. Lazy ancak görsellerin kendi adresi olduğunda (Faz 4) işe yarar. Tamamlanmasının sebebi o güne hazır olmak — bugün için bir hız iddiası değil.

**BUGÜN işe yarayan \`decoding="async"\`.** Base64 gömülü bir fotoğrafın çözülmesi ana iş parçacığını meşgul ediyor; veri bellekte olduğu için lazy bunu çözemiyor. 35 etiketin hepsine eklendi — ilk taramada lazy'si olan 9 etiketin decoding'i YOKTU, yani "lazy ekledik" denilen yerlerde bugün işe yarayan öznitelik eksikti.

Lazy dağılımı ölçülerek ayrıldı: 22 liste/küçük görsel lazy, ilk ekran görselleri (ışık kutusunun ana fotoğrafı, ilan detayının ana görseli, tamirci kapak bandı, blog kapağı, başlık avatarları) kasıtlı olarak eager. **Lazy yükleme yanlış yerde iyileştirme değil gerilemedir:** kullanıcının bakmak için tıkladığı fotoğrafı geciktirir. Test her iki yönü de tutuyor.`,
      },
      {
        id: "faz-4-medya",
        title: "25.6 Faz 4: medya uçları — asıl mimari değişiklik",
        body: `## Sorun boyut değildi, ADRESSİZLİKTİ

Önceki fazlar fotoğrafları küçülttü. Ama asıl kısıt hiç küçülmedi: **kimlik doğrulamalı, dinamik bir JSON yanıtının içine gömülü bir görsel cache'lenemez.** Ne tarayıcı önbelleği, ne CDN, ne \`immutable\` — hiçbiri çalışmaz, çünkü görselin kendi adresi yoktur. "CDN ekleyelim" demek bu mimaride işe yaramaz: cache'lenecek ayrı bir kaynak yoktur.

Faz 4 o adresi yaratıyor: \`POST /api/media\` (yazma, kimlik doğrulamalı) ve \`GET /media/:name\` (okuma, herkese açık, bir yıl \`immutable\`).

## Ölçüm — 10 ilan × 6 fotoğraf (her biri 250 KB)

| | data: URI (bugün) | /media/ adresi |
|---|---|---|
| \`/api/listings\` yanıtı | **19,54 MB** | **11,5 KB** |
| yanıt süresi | 168 ms | 2 ms |
| ilan satırı | 2000 KB | 400 bayt |

**Bu sayının dürüst okunuşu:** 1744x olan şey JSON yanıtı, sayfanın TOPLAM ağırlığı değil. Fotoğraflar hâlâ indirilmek zorunda — ilk ziyarette yine ~15 MB görsel iniyor. Değişen dört şey var ve hepsi önemli:

1. **Çizimi bekleten şey artık 19,54 MB değil 11,5 KB.** JSON gelmeden hiçbir şey görünmüyordu; artık sayfa anında çiziliyor, fotoğraflar akarak geliyor.
2. **İkinci ziyarette fotoğraflar için ~0 bayt.** Bir yıl \`immutable\`, yani tarayıcı sormuyor bile.
3. **\`loading="lazy"\` artık gerçekten çalışıyor.** Faz 3'te eklendiğinde etkisizdi (veri JSON'un içinde gelmiş oluyordu); şimdi ekran dışındaki fotoğraflar HİÇ indirilmiyor.
4. **İkili veri, base64 değil** → aynı fotoğraf %25 daha küçük.

Ve veritabanı: ilan satırı 2000 KB'dan 400 bayta indi. 200.000 fotoğrafta tahmin edilen ~45 GB'lık tek SQLite dosyası artık oluşmuyor.

## İçerik karması dosya adı — üç sorunu birden çözüyor

Dosya adı \`<sha256'nın ilk 32 karakteri>.<uzantı>\`.

**1. Cache geçersizleştirme sorunu HİÇ oluşmuyor.** Ad içeriğin karması olduğu için içerik değişince ADRES de değişir. \`immutable\` ve bir yıl bu yüzden dürüst bir söz: o adreste duran baytlar asla değişmeyecek. Kullanıcı profil fotoğrafını değiştirdiğinde eski dosya cache'te kalsa bile kimse ona bakmaz — veritabanındaki adres artık yenisini gösteriyor. Sabit adlı bir dosyada aynı başlığı vermek, kullanıcının bir yıl eski fotoğrafı görmesi olurdu.

**2. Yol atlama (path traversal) YAPISAL OLARAK imkânsız.** Kullanıcının verdiği dosya adı hiç kullanılmıyor — ne kaydederken ne sunarken. \`../../etc/passwd\` diye bir ad üretilemez, çünkü ad kullanıcıdan gelmiyor. Bu, dosya adını temizlemeye (sanitize) çalışmaktan daha sağlam: temizleme atlanabilir, ÜRETME atlanamaz.

**3. Aynı dosya bir kez saklanıyor.** İki kullanıcı aynı görseli yüklerse karma aynı olur, dosya bir kez yazılır. Bedava tekilleştirme.

128 bit ayrıca TAHMİN EDİLEMEZ olmayı sağlıyor: adres sızmadıkça kimse rastgele deneyerek dosya bulamaz.

## İmza denetimi — etikete güvenmemek

MIME türü İSTEMCİDEN geliyor. \`data:image/png;base64,<aslında bir HTML dosyası>\` yazmak hiçbir şey engellemiyor. Uzantıyı ve \`Content-Type\`ı o yalana göre verirsek, dosya indirilip açıldığında içerik farklı yorumlanabilir. Bu yüzden baytların KENDİSİNE bakılıyor (magic bytes): iddia edilen tür gerçek imzayla uyuşmuyorsa reddediliyor. Test bunu gerçek dosyalarla sınıyor — "PNG diye etiketlenmiş JPEG" ve "JPEG diye etiketlenmiş HTML" ikisi de 400 alıyor.

Sunma tarafında \`Content-Type\` UZANTIDAN türetiliyor (dosyanın içinden ya da istekten değil), üstüne \`X-Content-Type-Options: nosniff\` ve yanıt bazında \`Content-Security-Policy: default-src 'none'; sandbox\`. SVG tabloda hiç yok — ne saklanabiliyor ne sunulabiliyor.

## KAPSAM DARALTILDI: yalnızca herkese açık görseller

Raporda bu ayrım yoktu; uygulamada ortaya çıktı. \`/media/...\` adresleri **kimlik doğrulaması olmadan** okunuyor — cache'lenebilir olmanın koşulu tam olarak bu. Dolayısıyla oraya yalnızca bugün ZATEN herkese açık olan görseller gidebilir:

| Görsel | Uca gidiyor? | Neden |
|---|---|---|
| ilan fotoğrafı + galeri | ✅ | anonim ziyaretçiye zaten gönderiliyor |
| tamirci kapak görseli | ✅ | aynı |
| profil / avatar / çalışan | ✅ | aynı |
| sohbet fotoğrafı | ❌ | yalnızca erişim denetimli JSON'da dönüyor |
| arıza fotoğrafı | ❌ | aynı |
| teklif fotoğrafı | ❌ | aynı |
| CV, doğrulama belgesi | ❌ | kişisel veri |

Özel görselleri tahmin edilemez ama herkese açık bir adrese taşımak bir **güvenlik gerilemesi** olurdu: adres bir kez sızarsa (referrer başlığı, tarayıcı geçmişi, sunucu günlüğü, ekran görüntüsü paylaşımı) kişisel veri kimlik doğrulaması olmadan okunur. Performans kaybı da yok — kazancın neredeyse tamamı zaten herkese açık görsellerde, çünkü büyük liste yanıtlarını şişiren ve CDN'in cache'leyebileceği tek küme onlar. Özel görseller istek başına tek kayıt dönen uçlarda.

Bu karar \`IMAGE_PRESETS\` tablosundaki \`hosted\` bayrağında, tek yerde duruyor — kodun içine dağılmış if'ler yerine okunabilir ve test edilebilir olsun diye. Biri ileride performans için sohbeti de hosted yaparsa test kırmızı yanıyor.

## Hiçbir koşulda bugünden kötü olamaz

Yükleme herhangi bir sebeple başarısız olursa (ağ yok, 401, 429, 500, eksik yanıt, bozuk adres) \`data:\` URI'nin KENDİSİ kaydediliyor. Yani en kötü durum bugünkü hâl. Kullanıcıya hata göstermiyoruz çünkü onun açısından bir şey bozulmadı — fotoğrafı yine kaydedildi, sadece daha az verimli biçimde. Sessiz kalınan tek şey bu; gerçek bir kayıp olsaydı söylerdik.

Aynı şekilde **mevcut veri hiç dokunulmadı.** Veritabanındaki tüm \`data:\` URI'ler olduğu gibi duruyor ve çalışıyor; \`<img src>\` hem \`data:\` hem \`http(s):\` kabul ettiği için okuma yolunda tek satır değişmedi. Testin bir bölümü sadece bunu ölçüyor: data URI ile ilan hâlâ oluşturulabiliyor mu, veritabanına birebir yazılıyor mu, okurken aynı değer dönüyor mu.

## Hız sınırı: kullanıcı başına, IP başına değil

Bunu test ortaya çıkardı. İlk hâlde sınır IP başınaydı — projedeki diğer sınırlarla tutarlı olsun diye. Test 6. istekte kilitlendi çünkü önceki adımlardaki yüklemeler aynı IP'den (127.0.0.1) gelmişti.

Bu bir test sorunu değil, gerçek kullanıcıların yaşayacağı sorunun aynısı: aynı ofis, aynı okul, aynı mobil operatör NAT'ı arkasındaki kullanıcılar tek kotayı paylaşır. Biri 15 fotoğraflı ilan yüklerken yanındaki masadaki kişi 429 alır.

Giriş ve OTP sınırlarında IP DOĞRU tutamak: saldırganın kimliği yok, elimizdeki tek şey IP. Ama yükleme **kimlik doğrulamalı** — kimin yüklediğini bildiğimiz halde IP'ye bakmak, elimizdeki daha iyi bilgiyi kullanmamak olurdu. Sınır kullanıcı başına dakikada 20'ye çevrildi (arayüz tek seferde en fazla 15 galeri fotoğrafı gönderiyor). IP tavanı ise çok hesap açıp kotayı çarpmaya karşı daha geniş bir ikinci katman olarak kaldı (dakikada 60); hesap açmanın kendi IP sınırı da var, katmanlar birbirini tamamlıyor.

## Yetim dosyalar: ölçülüyor, silinmiyor

Bir karma **yedi ayrı tablodan** referans alınabiliyor (ilan kapak, ilan galerisi, tamirci avatarı, kapak, blog, kariyer, çalışan). Yetim dosyaları silmek için hepsini taramak gerekir ve TEK bir atlanan referans, kullanıcının gördüğü kalıcı bir kırık görsel demektir.

**Ölçmek güvenli, silmek değil.** Bu yüzden yönetici istatistiklerine dosya sayısı ve klasör boyutu eklendi: klasör beklenmedik biçimde büyürse görünür oluyor ve silme kararı ölçüme bakılarak, elle veriliyor. Yetim dosyanın maliyeti diskte birkaç yüz KB; yanlış silmenin maliyeti veri kaybı.

## Yedekleme: veritabanı ve klasör BİRLİKTE

Medya klasörü varsayılan olarak veritabanı dosyasının yanında (\`FIXPERTO_MEDIA_DIR\` ile değiştirilebilir). İkisinin birlikte durması gerekiyor çünkü **veritabanı adresleri, klasör baytları tutuyor.** Biri yedeklenip diğeri atlanırsa sonuç tamamen kaybetmekten daha kötü olur: kırık görsellerle dolu ama "çalışıyor" görünen bir site.

## Bilinen ödünleşim: mutlak adres

Kaydedilen değer mutlak adres (\`http://host/media/...\`). Sebebi: ön yüz API'ye mutlak adresle bağlanıyor, göreli bir \`/media/...\` ön yüzün kendi kökenine çözülür ve 404 verir. Bedeli: alan adı değişirse eski adresler kırılır. Kabul edilebilir, çünkü düzeltmesi tek bir \`UPDATE ... REPLACE(...)\` — ve alternatifi (göreli yol saklamak) ham \`src={...}\` kullanan 14 çizim noktasının hepsine ön ek eklemeyi gerektirirdi; biri atlanırsa kırık görsel oluşur ve bu daha sinsi bir hata olurdu. \`PUBLIC_MEDIA_BASE\` verilirse (ör. CDN alan adı) o kullanılıyor — CDN'e geçiş artık tek bir ortam değişkeni.`,
      },
      {
        id: "faz-5-izleme",
        title: "25.7 Faz 5: e-posta kuyruğu ve basit izleme",
        body: `## E-posta istek yolundan çıktı

Kayıt ve giriş uçları \`await sendMail(...)\` yapıyordu. SMTP dış bir servis — bizim denetimimizde değil. Yavaşladığında kullanıcının **kayıt ve giriş yanıtı** o kadar bekliyordu.

**Ölçüm** (2 saniye gecikmeli SMTP taklidi): istek 2006 ms bekliyordu, kuyruğa alma ~5 ms. Kazanç kritik olan yerde: kayıt bir kez yapılır, **giriş her gün** yapılır.

**Neden Redis/BullMQ değil:** kuyruğa alınacak tek bir iş var — e-posta göndermek. Yeni bir servis, yeni bir bağımlılık ve ayakta tutulması gereken yeni bir altyapı, bu iş için karşılığı olmayan bir karmaşıklık. Süreç içi sıralı kuyruk 40 satır.

**Neden sıralı (tek seferde bir tane):** SMTP sağlayıcıları eşzamanlı bağlantıyı sınırlıyor. Bekleyen 50 e-postayı paralel göndermek sağlayıcının hepsini reddetmesine yol açabilir — "hızlandırmak" için yapılan şey teslimatı tamamen bozar.

**Sınırlı kuyruk (500).** Sınırsız bir dizi, SMTP takıldığında bellek sızıntısına dönüşür; aynı sınıf hata bu projede daha önce oturum ve hız sınırı haritalarında da düzeltildi. Sınıra gelindiğinde **en eskisi** atılıyor: en eski OTP muhtemelen zaten süresi dolmuş, en yenisi hâlâ işe yarar.

**Bir kez yeniden deneme.** SMTP hatalarının büyük kısmı geçici (bağlantı zaman aşımı, anlık hız sınırı). Sonsuz deneme yapmıyoruz: kalıcı bir hata (yanlış şifre, geçersiz alıcı) kuyruğu sonsuza kadar meşgul edip arkasındaki e-postaları bloke ederdi.

### Dürüst sınırlar

**Kuyruk süreç içinde.** Sunucu yeniden başlarsa bekleyen e-postalar kaybolur. Kabul edilebilir çünkü kuyruk tipik olarak boş ve bekleyen işin ömrü saniyeler — ama kabul edilebilir olması "yok" demek değil. Kalıcılık gerektiğinde doğru adım e-postaları bir tabloya yazıp oradan işlemek olur.

**\`mailSent\` alanının anlamı değişti.** Kaldırılmadı (API sözleşmesi bozulmasın) ama artık "gönderildi" değil "gerçek gönderim mümkün" demek, yani SMTP yapılandırılmış mı. Kuyruğa alınan bir işin sonucunu senkron bilmek zaten imkânsız. Bu alan ön yüzde hiçbir yerde okunmuyor (arandı, kullanım yok) — pratikte bir şey değişmiyor.

**Bir davranış değişikliği var ve bilinçli:** eskiden SMTP yapılandırılmış ama gönderim başarısız olduğunda, üretim dışı ortamlarda OTP yanıtın içinde dönüyordu. Artık dönmüyor. Bu kaybedilen bir kolaylık ama aynı zamanda kapatılan bir zayıflık — bir OTP'nin SMTP hıçkırığı yüzünden HTTP yanıtında görünmesi istenen bir şey değil. SMTP hiç yapılandırılmamışken \`devOtp\` hâlâ dönüyor, yani geliştirme ve test akışı aynen çalışıyor.

## "Atlandı" ile "başarısız" ayrı sayılıyor

Ölçüm yaparken çıkan bir hata. İlk hâlde SMTP yapılandırılmamışken her e-posta \`failed\` sayılıyor ve hata günlüğü basıyordu. Sonucu: geliştirmede sayaç sürekli artıyor, konsol hata mesajıyla doluyor.

**Sürekli kırmızı yanan bir ölçüm, kimsenin bakmadığı ölçümdür** — gerçek bir SMTP arızası o gürültünün içinde kaybolur. "Yapılandırılmamış" bilinen ve kasıtlı bir durum; ayrı sayılıyor.

## İzleme: \`GET /api/admin/metrics\`

Bu uygulamada hiçbir izleme yoktu, yani bir uç yavaşlarsa ancak kullanıcı şikâyet edince öğreniyorduk. Denetimin kendisi bunu gösterdi: sohbet listesinin veritabanındaki **tüm fotoğrafları** okuması aylardır doğruydu ve kimse fark etmemişti, çünkü bakacak bir sayı yoktu.

Toplananlar: istek sayısı, durum sınıfına göre kırılım (2xx/3xx/4xx/5xx), sunucu hata oranı, ortalama ve en yavaş süre, süre kovaları, uç başına özet, veritabanı boyutu, medya klasörü, bellek, e-posta kuyruğu.

**Neden Prometheus/OpenTelemetry değil:** ikisi de doğru araçlar ama bir toplama altyapısı gerektiriyor (scrape eden sunucu, saklama, panolar). Burada amaç gözlemlenebilirlik platformu değil, **sorunun varlığını görebilmek**. 100 satır, sıfır bağımlılık. Gerçek bir platform gerektiğinde bu sayılar oraya beslenir.

**Neden yönetici arkasında:** hata oranı, yavaş uçlar ve veritabanı boyutu hem işletme hem saldırı istihbaratıdır. "Şu uç yavaş ve 500 veriyor" bilgisi, nereye yükleneceğini arayan birine bedava ipucu olur. \`/api/health\` kasıtlı olarak yalın kaldı: yük dengeleyicinin sorduğu soru "ayakta mısın", başka bir şey değil. Test bunu da ölçüyor — sağlık ucunda \`requests\`, \`dbBytes\`, \`routes\` gibi alanların BULUNMADIĞINI doğruluyor.

### Üç tasarım kararı

**Süre kovaları, p95 değil.** Gerçek bir yüzdelik için bütün süreleri saklamak gerekir — sınırsız bellek. Ortalama tek başına yeterli değil: 1000 hızlı istek 10 çok yavaş isteği gizler. Altı kova (\`<5ms\` … \`>2s\`) sabit yer kaplayıp sorulan soruya cevap veriyor.

**4xx ayrı tutuluyor.** 404 ve 400 çoğu zaman istemci hatası, sunucu arızası değil. İkisini tek "hata oranına" katmak gerçek arızayı 404 gürültüsünün içinde gizlerdi. \`serverErrorRate\` yalnızca 5xx'e bakıyor.

**Uç kırılımı sınırlı sayıda anahtar.** Ham yol ile anahtarlamak \`/api/listings/1\`, \`/api/listings/2\`… diye sınırsız harita üretirdi. Yol kaynak adına indiriliyor ve harita 60'la sınırlı; dolduğunda yeni yol **eklenmiyor** (eskiyi atmak yerine), toplamlar yine doğru kalıyor.

## Test iki hatamı yakaladı

**1. Express yolu yeniden yazıyor.** Ölçüm \`res.on("finish")\` içinde \`req.path\` okuyordu. Express bir alt router'a girerken \`req.url\`i mount noktasına göre YENİDEN YAZIYOR: \`/api/listings/900001\` isteği \`makeCrudRouter\` içinde \`/900001\` oluyor ve yanıt o sırada bittiği için dinleyici kırpılmış yolu görüyordu. Sonuç: her kayıt kimliği ayrı bir anahtar — yani engellemek istediğim sınırsız harita büyümesinin ta kendisi. Test 40 farklı kimlikle 46 anahtar sayarak yakaladı. Yol artık ara katmanın BAŞINDA, \`originalUrl\`den alınıyor.

**2. "İlk iki segmenti al" medyada çöküyordu.** \`/media/<karma>.jpg\` iki segment ve ikincisi her dosyada farklı — her fotoğraf yeni bir anahtar. Üst sınır belleği korur ama kırılımı işe yaramaz yapardı (60 anahtarın 59'u tek fotoğraf). İkinci segment artık yalnızca kaynak adı gibi görünüyorsa tutuluyor: harf ve tire, nokta yok, tamamı rakam değil.

Testin bir bölümü de ölçümün kendisinin **sızıntı yapmadığını** doğruluyor: yanıtta dosya sistemi yolu, veritabanı dosya adı ya da medya klasörü yolu yok — boyut bilgisi işe yarar, yol bilgisi yaramaz.`,
      },
      {
        id: "faz-6-kod-bolme",
        title: "25.8 Faz 6: kod bölme — ve ölçemediğim şey",
        body: `## Önce dürüst sınır

**Bu ortamda ön yüz derlenemiyor.** \`vite build\` rollup'ın yerel ikilisini istiyor; kurulu olan darwin-arm64, çalıştığım makine linux-aarch64. esbuild için de aynı durum ve npm kayıt defterine erişim yok. Yani **paket boyutu ölçülemiyor.** "İlk paket şu kadar küçüldü" diyemem — o sayıyı üretecek araç çalışmıyor.

Aşağıdaki boyutlar \`node_modules\`'daki gerçek dağıtım dosyalarının boyutları, yani **bölünen kodun büyüklüğü**; paketleyicinin son çıktısı değil. Parçanın tarayıcıda ayrı bir dosya olarak indiği de doğrulanamıyor — bunun için gerçek bir tarayıcı gerekiyor.

Doğrulanabilenler: statik bağımlılığın gerçekten kalktığı (derlenmiş çıktı denetleniyor), dinamik import'un çözüldüğü ve PDF'in hâlâ üretildiği (işlev gerçekten çağrılıyor), Suspense sınırının var olduğu.

## jspdf ilk paketten çıktı

\`utils/analyticsReport.ts\` \`jspdf\` ve \`jspdf-autotable\`'ı statik içe alıyordu. Statik import demek, paketleyicinin onları ana pakete koyması demek — siteyi ilk açan **herkes**, hiç PDF indirmeyecek olsa bile o kodu indiriyordu. Oysa rapor yalnızca tamirci panelinin "Analiz" sekmesindeki bir düğmeyle üretiliyor.

| Dosya | Boyut | gzip |
|---|---|---|
| \`jspdf/dist/jspdf.es.min.js\` | 352 KB | ~116 KB |
| \`jspdf-autotable/dist/...min.js\` | 39 KB | ~12 KB |
| **Toplam** | **391 KB** | **~128 KB** |

Çözüm: \`import type\` (çalışma zamanında hiçbir şey getirmez, TypeScript siler) + işlevin içinde dinamik \`import()\`. İki modül \`Promise.all\` ile **paralel** yükleniyor; sırayla beklemek gecikmeyi iki katına çıkarırdı.

Bu bir bileşen değil, saf bir işlev — o yüzden \`React.lazy\` değil doğrudan \`import()\`. Suspense sınırına ihtiyaç duymadığı için hatalı kurulmuş bir sınır yüzünden beyaz ekran riski de yok.

## El kitabı ayrı parçada

\`HandbookPanel\` yönetici panelindeki bir sekme ve içeriğini bu dosyadan (\`data/handbook.ts\`, 174 KB) alıyor. Statik import demek, hiç yönetici olmayan ziyaretçinin de o 174 KB'ı indirmesi. \`React.lazy\` + \`Suspense\` ile parça yalnızca sekmeye girildiğinde iniyor. Bileşenin kendisi değişmedi.

## Bölmediklerim — ve neden

**Yönetici panelinin tamamı.** Ayrı bir bileşen DEĞİL, \`AppShell.tsx\`in (584 KB) içine gömülü. Onu ayırmak büyük bir refactor olur ve bu denetimin kuralı açık: çalışan yapıyı büyük değişikliklerle riske atma. El kitabı ise zaten ayrı bir bileşendi — sınırı çizmek için hiçbir şeyi taşımak gerekmedi. Aradaki fark bu.

**i18n (201 KB).** Her ekranda gerekiyor. Bölmek ilk çizimi geciktirirdi, hızlandırmazdı.

## İki hatam ve ikisinin de cevabı

**1. \`autoTable is not a function\`.** Dinamik \`import()\`te modül nesnesi elimize geliyor ve şekli ortama göre değişiyor: Node'un CJS köprüsünde işlev \`m.default.default\` içinde, paketleyicinin ESM çıktısında \`m.default\` doğrudan işlev. Bunu Node'da işlevi **gerçekten çağırarak** buldum. Dürüst olmak gerekirse bu tarayıcıda da olacağını kanıtladığım bir hata değil — orada \`.default\` muhtemelen çalışırdı. Ama üç satırla iki şekli de kapsamak, hangisinin doğru olduğunu varsaymaktan iyi; hiçbiri işlev değilse artık sessiz kalmıyor, açık hata veriyor.

**2. Testim işlevi gözlemleyemiyordu.** \`jsPDF.prototype.save\`i yamalayıp "PDF üretildi mi" diye bakmaya çalıştım. jsPDF her metodu (\`save\` dâhil) **örneğin kendi özelliği** olarak atıyor, prototipte hiçbiri yok — yani dışarıdan yamalamak imkânsız. Testim sessizce hiçbir şey yakalamadı ama "hata vermedi" diye yeşil yanabilirdi.

Çözüm testi zorlamak değil, **işlevi gözlemlenebilir yapmak** oldu: artık ne ürettiğini döndürüyor (dosya adı + sayfa sayısı). İkisi de zaten hesaplanmış değerler, ek maliyet yok, test-özel bir kanca da değil.

**Üçüncü olarak:** "sayfa sayısı ≥ 2" diye bir kontrol yazdım ve bu bir varsayımdı — küçük veri kümesi tek sayfaya sığıyor, test haklı olarak kırmızı yandı. Sayıyı düşürüp geçmek kolay olurdu ama o zaman test hiçbir şey kanıtlamazdı. Doğru kanıt veri miktarını artırıp sayfa sayısının arttığını görmek: autoTable hiç çalışmasaydı satır sayısının sayfa sayısına etkisi olmazdı.`,
      },
      {
        id: "randevu-sonuc-popup",
        title: "25.9 Randevu sonucu: ekran değil popup",
        body: `## Önce ayrı bir ekran vardı

Randevu kaydedilince uygulama \`screen === "confirmed"\` ile tamamen başka bir ekrana geçiyordu. Sorunu şuydu: sayfa değişiyor, kullanıcı nereden geldiğini kaybediyor ve o ekranda iki düğmeden başka hiçbir şey yok — tam bir çıkmaz sokak.

Artık sayfanın ortasında bir popup. Arkadaki sayfa yerinde kalıyor, sonuç hemen okunuyor.

## İki durum, iki ayrı cümle

Bu ayrım bir üslup tercihi değil:

| Otomatik onay | Rozet | Başlık | Açıklama |
|---|---|---|---|
| AÇIK | Onaylandı | Randevunuz Onaylandı! | Randevunuz **kesinleşti**. Tamircinin onayını beklemenize gerek yok. |
| KAPALI | Onay bekliyor | Randevu Talebiniz Gönderildi! | Talebiniz tamirciye **iletildi**. Onaylandığında bildirim alacaksınız. |

İkisini aynı cümleyle geçmek kullanıcıyı yanıltır: "onaylandı" sanıp tamircinin hiç kabul etmediği bir saate gelen, ya da onay bekleyip beklemediğini bilmeyen biri çıkar. Test iki metnin de var olduğunu, üç dilde çevrildiğini **ve** \`autoAccepted\` değerine göre gerçekten SEÇİLDİĞİNİ denetliyor — iki metni yazıp hep aynısını göstermek mümkün olurdu.

## Değerler sunucudan geliyor

Popup tamirci adı, araç, tarih ve saati gösteriyor. Bunlar sunucudan dönen kayıttan alınıyor, ekrandaki state'ten değil: popup açıldığında form ZATEN temizlenmiş oluyor (bu sıra bilinçli — istek başarısız olursa kullanıcı verilerini kaybetmesin diye temizlik \`await\`ten sonra yapılıyor).

Popup da ancak kayıt **başarılı** olduktan sonra açılıyor. Aksi hâlde kaydedilmemiş bir randevu için "onaylandı" göstermiş olurduk — bu sınıf hata bu projede daha önce bir kez yaşandı ve testte kayıt altında.

## Hiçbir çıkış yolu boşta bırakmıyor

Arkadaki sayfada form temizlenmiş durumda, yani popup'ı kapatıp orada bırakmak kullanıcıyı boş bir ekranda bırakmak olurdu. Üç yol da bir yere götürüyor: "Randevumu Görüntüle" ve arka plana tıklama aktif randevulara, ikinci düğme ana sayfaya. "Aktif" sekmesinin açıkça ayarlanması da eski bir hatanın karşılığı — bir kez "Geçmiş"e bakan kişi yeni randevusunu almasının ardından bu düğmeye basınca geçmiş listesine düşüyor ve randevusunu göremiyordu.

## Kaldırılan ekran geri bırakılmadı

\`screen === "confirmed"\` bloğu silindi. Ulaşılamayan bir ekranı "belki lazım olur" diye bırakmak, sonraki geliştiriciye yanlış bilgi veren ölü koddur; test artık o ekranın hem işaretçisinin hem kendisinin kalmadığını doğruluyor.`,
      },
      {
        id: "fiyat-piyasa-karsilastirma",
        title: "25.10 Fiyatın piyasadaki yeri — ve neden çoğu zaman görünmüyor",
        body: `## İstek ve ilk dürüst ölçüm

Randevu alırken tamircinin fiyatının diğerlerine göre nerede durduğu gösterilsin — "çok iyi / iyi / ortalama / yüksek".

**Bugünkü tohum verisinde bu satır hiç görünmüyor** ve bunu baştan yazmak gerekiyor. Sebep: 10 tamircide 17 farklı hizmet var; en yoğun iki hizmette (yağ değişimi, periyodik bakım) üç tamircinin sabit fiyatı var, ama karşılaştırılan tamirci havuzdan çıkarıldığı için geriye iki tamirci kalıyor — asgari örneklemin altında.

İlk ölçümümde "2 hizmette çıkar" yazmıştım ve **yanlıştı**: saydığım şey fiyat veren tamirci sayısıydı, oysa karşılaştırmada kişinin kendisi havuza girmiyor. Testi gerçek tohum verisiyle çalıştırınca fark ettim. Test artık bu sayıyı (0) yazılı tutuyor — ileride biri "neden hiç görünmüyor" diye sorduğunda cevap orada.

Eşiği 2'ye indirip özelliği "çalışır" göstermek mümkündü. Yapmadım: iki fiyatın "medyanı" ikisinin ortasıdır, hangisinin normal olduğunu söylemez. **İki tamircinin fiyatına bakıp "bu çok iyi" demek bir bilgi değil, uydurmadır.** Özellik platform büyüdükçe kendiliğinden anlamlı hâle geliyor.

## Medyan, "ortalama" değil

İstek "ortalama" diyordu ama aritmetik ortalama tek bir aykırı değere karşı savunmasız. Sayıyla:

| Fiyatlar | Ortalama | Medyan |
|---|---|---|
| 300, 300, 300, 5000 | **1.475₺** | **300₺** |

Ortalamayla karşılaştırırsak 300₺'lik bir fiyat "piyasanın belirgin altında" görünür — oysa piyasanın ortası hâlâ 300₺ ve o fiyat tam ortada. Arayüzde gösterilen sayı medyan ve adı "piyasa ortası"; kullanıcıya aritmetik ortalama diye sunulmuyor.

## Karşılaştırmanın YAPILMADIĞI durumlar

Testlerin ağırlık merkezi burada. Yanlış bir "çok iyi" etiketi kullanıcıyı yanlış tamirciye gönderir ve tamirciye de haksızlık eder; **hiç etiket göstermemek her zaman daha iyidir.**

- **Katalog anahtarı yok.** Tamircinin kendi yazdığı serbest metin hizmetlerde "aynı işi mi anlatıyor" sorusu cevaplanamaz — "Fren bakımı" ile "Fren balata değişimi" aynı şey olabilir de olmayabilir.
- **Fiyat değişken.** "Değişken" demek fiyat henüz belli değil demek. Oradaki sayıyı kesin fiyatlarla aynı havuza koymak iki tarafı da yanlış gösterir. Havuzdaki değişken fiyatlı tamirciler de örnekleme sayılmıyor.
- **Örneklem 3'ün altında.** Sayı yine döndürülüyor ki çağıran taraf isterse sebebini söyleyebilsin — sessizce kaybolmak yerine.
- **Tamircinin kendisi havuzda değil.** Aksi hâlde herkes kendi fiyatını da medyana katardı.

## Marka fiyatı tutarlı kullanılıyor

Tamirciler marka başına farklı fiyat verebiliyor (\`brandPrices\`). Havuzda kimi tamircinin marka fiyatını, kiminin taban fiyatını almak karşılaştırmayı anlamsız yapardı.

Kural: **her tamirci için "bu aracı getirsem bana ne yazar" değeri alınıyor** — marka fiyatı varsa o, yoksa taban fiyat. Marka zammı olmayan bir tamircinin taban fiyatı zaten o araç için geçerli fiyattır. Test bunu ölçüyor: BMW karşılaştırmasında marka fiyatı 900₺ olan iki tamirci ile marka zammı olmayan (300₺) bir tamirci aynı havuzda ve medyan 900₺ çıkıyor.

## Eşikler ve sınır yönü

| Medyana oran | Etiket |
|---|---|
| ≤ 0,80 | Piyasanın belirgin altında |
| 0,80 – 0,95 | Piyasanın altında |
| 0,95 – 1,05 | Piyasa ortalamasında |
| 1,05 – 1,25 | Piyasanın üstünde |
| > 1,25 | Piyasanın belirgin üstünde |

±%5 bandı bilerek "ortalama": 300₺ ile 310₺ arasındaki farkı "daha iyi" diye sunmak kullanıcıyı yanlış yönlendirir. O bantta renk de nötr ve ok da yok — olmayan bir farkı varmış gibi göstermemek için.

Sınır değerleri **alt banda** düşüyor (\`<=\`). İlk testimde "tam %25 üstü yüksek olmalı" diye varsaymıştım ve test haklı olarak kırıldı; kodun davranışı tutarlı ve kullanıcı lehine olan yön bu — sınırda olan bir fiyatı daha ağır etikete atmıyoruz.

## Metin fiyat hakkında, tamirci hakkında değil

"Bu tamirci çok iyi" demek karşılaştırmanın söyleyebileceğinden fazlasını iddia etmek olurdu: **ucuz olmak iyi tamirci olmak demek değil.** Söylenen tek şey fiyatın piyasa ortasına göre nerede durduğu. Bilgi balonu da bunu açıkça yazıyor.

Örneklem sayısı her zaman görünüyor ("3 tamircinin fiyatına göre"). Üç tamirciden çıkan bir karşılaştırmayı otuz tamirciden çıkmış gibi sunmak, kullanıcıya olduğundan fazla güven vermek olurdu.

## Nerede hesaplanıyor

İstemcide, saf bir işlevle (\`comparePriceToMarket\`). Yeni bir API ucu yok: tamirci listesi zaten tamamen indirilmiş durumda (mevcut mimari böyle) ve karşılaştırma o veriden çıkıyor. Saf işlev olması testte gerçekten çağrılabilmesini sağlıyor — 40'tan fazla kontrol doğrudan işlevi çalıştırıyor.`,
      },
      {
        id: "uydurma-teklif-kaldirildi",
        title: "25.11 Uydurma fiyat teklifleri — aynı hatanın ikinci kez çıkışı",
        body: `## Belirti

Kullanıcı bildirdi: "5 tamirciden teklif istedim, tamirci hesabına hiç girmediğim halde fiyat teklifi gelmiş görünüyor."

Haklıydı. Sebebi iki katmandaydı ve ikisi de ayrı ayrı düzeltildi.

## 1. katman: istemci fiyat UYDURUYORDU

\`submitQuoteRequest\` içinde, seçilen her tamirci için (kendi tamirci hesabı hariç) şu yapılıyordu:

\`\`\`
const variance = Math.round((basePrice * (0.85 + Math.random() * 0.3)) / 10) * 10;
status: "submitted", price: variance, etaDays: 1 + Math.floor(Math.random() * 3)
\`\`\`

Yani müşteri, **hiç kimsenin vermediği bir fiyatı** o tamircinin teklifi olarak görüyordu. Fiyat her istekte rastgele değiştiği için aynı tamirci farklı fiyatlar "veriyordu". Ve müşteri o teklifi **kabul edebiliyordu** — karşı tarafta o fiyatı kabul etmiş kimse yoktu.

Gerekçe olarak yorumda "backend'de gerçek bir tamirci tarafında yanıt akışı yok — demo" yazıyordu. Bu **artık doğru değildi:** gerçek akış eklenmişti (tamirci kendi oturumuyla \`PATCH /api/quote-offers/:id\` ile fiyat gönderiyor). Demo kısayolu, yerini alan gerçek özellik geldikten sonra da kodda kalmıştı.

## 2. katman: sunucu buna İZİN VERİYORDU

Asıl güvenlik sorunu buydu — istemciyi düzeltmek yeterli değil, çünkü uç doğrudan da çağrılabilir.

\`POST /api/quote-offers\` araç sahibinin **istediği tamirci adına, istediği fiyatla** \`submitted\` teklif oluşturmasına izin veriyordu. Tek kontrol "bu senin isteğin mi" idi; teklifin üzerindeki tamircinin o teklifi gerçekten verip vermediği hiç sorulmuyordu.

\`PATCH\` yolu doğru kilitlenmişti (fiyatı yalnızca o teklifin sahibi tamirci gönderebiliyor) ama **oluşturma yolu açıktı**: kilit kapıdaydı, pencere açıktı.

### Yeni kural

| Kim | Ne oluşturabilir |
|---|---|
| Tamirci | Kendi \`mechanicId\`siyle **fiyatlı** teklif (mechanicId istemciden değil oturumdan) |
| Araç sahibi | Yalnızca kendi isteğinde **fiyatsız** yer tutucu ("şu tamirciden teklif istedim" kaydı) |
| Yönetici | Fiyatlı teklif **oluşturamaz** — bir tamircinin adına fiyat yazmak yönetim işi değil, veri uydurmaktır |

Fiyat alanları başkası tarafından gönderilse bile 400 ile reddedilmiyor, **siliniyor**: eski istemciler bu alanları gönderiyordu ve isteği tamamen reddetmek teklif isteme akışını çalışmaz hâle getirirdi. Değeri atmak hem güvenli hem geriye dönük uyumlu. \`price\`, \`etaDays\` ve \`note\` birlikte temizleniyor — üçü de tamircinin cevabının parçası, biri yer tutucuya sızarsa müşteri verilmemiş bir söz görür.

## Bu, aynı sınıf hatanın İKİNCİ kez çıkışı

Birincisi sohbetteki **sahte otomatik yanıt**tı: araç sahibi mesaj yazdıktan 0,9 saniye sonra tamircinin ağzından uydurma bir cevap üretiliyor ve sunucuya kaydediliyordu.

İkisinin ortak yanı: "demo amaçlı" diye yazılmış olmaları ve yerini alan gerçek özellik geldikten sonra silinmemeleri. Orada uydurulan bir cümleydi; **burada para.**

Bu yüzden düzeltme tek başına yetmez, taramaya bağlandı (\`tests/listing-offers.test.mjs\`): ticari bir alana (\`price\`, \`etaDays\`, \`rating\`…) rastgele değer **atanamaz**, teklif yer tutucusu fiyatsız oluşmalı, sunucu bunu zorunlu kılmalı, ve sohbetteki ilk uydurma geri gelmemeli.

Test kuralını yazarken de kendi hatamı tekrarladım: ilk hâli "satırda hem \`Math.random\` hem ticari bir kelime varsa" diye bakıyordu ve hemen yanlış alarm verdi — ilan taslağı tek satırda hem \`px: 20 + Math.random() * 60\` (harita iğnesi konumu, tamamen kozmetik) hem \`offers: []\` içeriyor. Doğru ölçüt yakınlık değil **atama**: rastgele değer ticari bir alanın *değeri* mi oluyor? Kural buna çevrildi ve kozmetik rastgeleliğin korunduğu da ayrıca test ediliyor — yoksa yarın biri onu "düzeltmeye" kalkar.

## Veritabanındaki eski kayıtlar

**Önceden oluşmuş uydurma teklifler programatik olarak ayırt edilemiyor.** \`quote_offers\` tablosunda "bunu kim oluşturdu" bilgisi yok; uydurma bir teklif, gerçek bir tekliften veri olarak farksız görünüyor. Bu yüzden otomatik bir temizlik yazmadım — gerçek bir teklifi silme riski, eski test kayıtlarını elde silmenin zahmetinden ağır.

Test amaçlı oluşturulmuş teklif istekleri elle silinebilir; bundan sonra oluşacak kayıtlarda bu sorun yok.`,
      },
      {
        id: "tam-uygulama-denetimi",
        title: "25.12 Bağımsız tam uygulama denetimi — 24 bulgu",
        body: `## Yöntem: önce anla, sonra saldır

Bildirilmiş hata listesine bakmadan, uygulamanın tamamı bağımsız olarak denetlendi. Sıra: mimariyi ve izin modelini KODDAN çıkar → saldırgan gibi gerçek HTTP istekleri at → bulguları sınıflandır → düzelt → İKİNCİ KEZ tara.

Önemli ayrım: keşif aracı ile test aracı ayrı. \`tests/e2e/audit-probe.mjs\` **raporlar, iddia etmez** — "şunu denedim, sonuç şu" der ve bulgu listesi üretir. Test ise "şu doğru olmalı" der. Denetimin başında neyin kırık olduğu bilinmediği için ilki gerekliydi; bulgular düzeltildikten sonra kalıcı olanlar \`api7.e2e.mjs\`e iddia olarak taşındı (104 kontrol).

**İlk tur: 22 bulgu. Düzeltmelerden sonra ikinci tur: 2 (ikisi de kabul edilmiş ödünleşim).** Sonra iki bulgu daha çıktı (iş başvuruları, öne çıkarma süresi) → toplam 24.

## En ciddi bulgu: müşteri listesi herkese açıktı

\`GET /api/owners\` **oturumsuz** 200 dönüyordu ve her müşterinin adı, e-postası, telefonu ve adresini içeriyordu. Siteyi bilen herkes tek istekle tüm müşteri listesini indirebilirdi.

İlginç ayrıntı: tekil kayıt (\`/api/owners/1\`) DOĞRU biçimde 404 veriyordu. **Kapı kilitliydi, pencere açıktı** — ve bu desen bu denetimde üç kez çıktı (teklif oluşturma vs. PATCH, owners tekil vs. liste, offers dizisi).

Liste tamamen kapatılamadı: ön yüz açılışta (girişten önce) çekiyor ve ilandaki satıcının adı/şehri, sohbetteki karşı tarafın dili gibi meşru yerlerde kullanıyor — 401 döndürmek siteyi misafirlere kapatırdı. Doğru çözüm alanı daraltmak: iletişim bilgileri listeden çıktı, yönetici tam listeyi görmeye devam ediyor, kullanıcı kendi kaydını tekil uçtan tam alıyor.

## Yazılmış bir korumayı öldüren yazım hatası

\`ADMIN_ONLY_FIELDS\` içinde \`job_listings\` anahtarı **iki kez** tanımlıydı. JavaScript ikinciyi geçerli sayıp birinciyi sessizce eziyor:

\`\`\`
job_listings: ["applicants"],   ← bu satır hiç çalışmıyordu
...
job_listings: ["shareCount"],   ← yalnızca bu geçerliydi
\`\`\`

Yani gerekçesi yorumla belgelenmiş bir güvenlik kontrolü bir yazım hatasıyla ölmüştü. Ölçüldü: tamirci kendi ilanının başvuru listesini uydurma kayıtlarla değiştirebiliyordu.

## Randevu: dokuz alan, karşı tarafın kararları

Randevu satırı iki tarafın paylaştığı tek kayıt. Sahiplik kontrolü "bu satır senin mi" sorusunu doğru cevaplıyordu — ama randevuda asıl soru **"bu ALANI sen yazabilir misin"**. Müşteri kendi randevusunda şunları yazabiliyordu:

| Alan | Sonucu |
|---|---|
| \`status: "Tamamlandı"\` | yapılmamış işi tamamlanmış gösterme |
| \`servicePrice: 1\` | hizmet bedelini kendi belirleme |
| \`depositPaid: 99999\` | ödenmemiş kaporayı ödenmiş gösterme |
| \`depositRefunded\` | yapılmamış iadeyi yapılmış gösterme |
| \`noShow\` | gelen müşteriyi "gelmedi" işaretleme |
| \`autoAccepted\` | tamircinin onayını atlamış gösterme |
| \`warrantyEndDate\` | verilmemiş garantiyi uydurma |
| \`mechanicName\` | kaydın tamircisini değiştirme |
| \`ownerId\`/\`mechanicId\` | randevuyu başkasına devretme |

Hiçbiri sahiplik ihlali değil — hepsi kendi satırında. O yüzden sahiplik kontrolü bunları hiç görmedi.

Çözüm alan bazlı, **rol bazlı beyaz liste** (varsayılan RET) + durum makinesi. Beyaz liste seçildi çünkü kara listede yeni bir sütun varsayılan olarak AÇIK olur — bu hatanın tam olarak sebebi buydu.

İzinsiz alanlar sessizce düşürülmüyor, **403 ile reddediliyor**: sessizce düşürmek "kaydettim" yanılgısı üretir (kullanıcı değer girer, arayüz gösterir, sunucu yok sayar, yenilemede kaybolur).

**Zincir önemliydi:** tamamlanmış randevu, DOĞRULANMIŞ SERVİS GEÇMİŞİNİN ön koşulu. Yani müşteri randevusunu tamamlanmış yapıp araç satarken alıcıya "platformda gerçekleşmiş bakım" gösterebilirdi. O uç ayrıca "yalnızca işi yapan tamirci" kontrolü yapıyor ve saldırıyı orada da durdurdu — ama iki savunma hattının ikisi de gerekli.

## İki iş kuralı hatası: ayarlar kurguydu

**"Randevuları otomatik kabul et"** ayarı tamircinin ayarlar ekranında vardı ama yalnızca istemci state'indeydi (\`useState(true)\`). İki sonucu: sayfa yenilenince kayboluyordu, ve daha kötüsü randevu durumunu **müşterinin tarayıcısı** belirliyordu (orada varsayılan açık). Yani tamirci "randevularımı ben onaylayacağım" dediğinde ayarın **hiçbir etkisi yoktu**. Artık \`mechanics.autoAcceptBookings\` sütununda ve kararı sunucu veriyor.

**"7 gün öne çıkarma"** (49₺): \`featured\` jenerik PATCH'ten serbestçe yazılabiliyordu (ödeme adımını hiç görmeden) ve süreyi takip eden hiçbir şey yoktu — bir kez öne çıkan ilan **sonsuza kadar** öyle kalıyordu. Artık özel uç, \`featuredUntil\` ve periyodik süre temizliği var.

**Dürüst sınır:** bu uygulamada ödeme sağlayıcısı yok; arayüzdeki ödeme bir gösterim. Sunucu doğrulanacak bir ödeme bulamaz. Uç yapılabilecek en fazlasını yapıyor (yetki + süre + denetlenebilir kayıt); gerçek doğrulama entegrasyon geldiğinde oraya eklenir.

## Tamamen ölü bir özellik: iş başvuruları

Sunucu \`job.status !== "open"\` diye bakıyordu. Ama iş ilanı sözlüğünde "open" **yok**: veritabanı varsayılanı, ön yüzün gönderdiği değer, tohum verisi ve tip tanımı hepsi \`"active"\`. Yani her ilan doğduğu anda "başvuru almıyor" sayılıyordu — **sitedeki hiç kimse hiçbir iş ilanına başvuramıyordu.**

Üstelik hata mesajı yanıltıcıydı: "bu ilan artık başvuru almıyor" diyerek adaya ilanın kapandığını düşündürüyordu, oysa özellik kırıktı.

Düzeltmede AÇIK olanları saymak yerine **KAPALI olanları** sayıyorum. Sebebi: "hangi değerler açıktır" listesi eksik kalırsa sonuç yine sessizce her şeyi reddetmek olur (bu hatanın ta kendisi). Kapalı listesi eksik kalırsa en kötü sonuç kapanmış bir ilana başvuru gelmesi — kıyaslanamaz biçimde daha az zararlı.

## Yarış koşulu: aynı saate 10 randevu

10 eşzamanlı istek 10 kayıt üretti. Slot kontrolü yalnızca istemcideydi ve **istemci kontrolü kontrol değildir.** Artık tek bir işlem (transaction) içinde kontrol ediliyor; SQLite tek yazıcılı olduğu için eşzamanlı isteklerde de doğru. İptal edilen randevu slotu serbest bırakıyor — aksi halde bir kez iptal edilen saat sonsuza kadar kapanırdı.

## Diğer düzeltmeler

- **Satıcı, alıcıların tekliflerini uydurabiliyordu/silebiliyordu** (\`offers\` dizisinin tamamını PATCH ediyordu). Meşru iki işlem — "görüldü" ve "kabul/ret" — sunucuda tanımlı uçlara taşındı: sunucu mevcut diziyi okuyup yalnızca izin verilen alanı değiştiriyor, tutar ve alıcı bilgisi satıcının elinden geçmiyor.
- **Satıcı, yöneticinin kaldırdığı ilanı geri açabiliyordu** (\`adminRemoved: 0\`) — moderasyon kararını kararın muhatabı iptal ediyordu.
- **Kullanıcı kendi destek talebine "yönetici yanıtı" uydurabiliyor**, "iade edildi" işaretleyebiliyor ve talebi "çözüldü" yapabiliyordu.
- **İş başvurusu reddinde e-posta eşlemesi** kaldırıldı: sunucu başvuranın kimliğini zaten oturumdan yazıyor. Eski yol hem çalışması için tüm müşterilerin e-postasının açık olmasını gerektiriyordu hem de aday farklı e-posta yazdıysa sessizce başarısız oluyordu.

## Kendi düzeltmelerimin ürettiği iki regresyon

Bir güvenlik düzeltmesinin başka bir şeyi bozması bu işin en sık tuzağı; ikisi de test tarafından yakalandı:

1. **Randevu router'ında bilinmeyen sütun.** Ayrı router yazarken jenerik CRUD fabrikasının "tabloda olmayan alanı at" adımını tekrarlamayı atladım. Mevcut istemci \`service: "Bakım"\` gönderiyor ve öyle bir sütun yok → INSERT hatası → **500 ve randevu almak tamamen kırıktı.** Fabrikanın çözdüğü bir sorunu yeni dosyada yeniden üretmek, ayrı router yazmanın bilinen bedeli.
2. **Teklif yanıt sözlüğü.** Uca \`"declined"\` yazdım, oysa uygulamanın her yeri \`"rejected"\` kullanıyor. Kendi kelimemi dayatmak, reddedilen teklifin arşivlenmesini ve alıcının yeniden teklif verebilmesini sessizce bozardı.

Ayrıca güvenlik matrisinin "meşru sahip düzenleyebiliyor" kontrolü tablodan bağımsız \`{ status: "active" }\` gönderiyordu; randevulara durum makinesi eklendikten sonra bu geçerli bir düzenleme olmaktan çıktı ve haklı olarak kırıldı. Matris tabloya duyarlı hâle getirildi — tablodan bağımsız bir gövde, doğrulama sıkılaştıkça yanlış alarm üretir.

## Kabul edilmiş ödünleşimler (kalan riskler)

- **Tamirci telefonu herkese açık** — kasıtlı: müşteri arayacak. E-posta listeden çıktı (spam/oltalama listesi olurdu), telefon kaldı.
- ~~**\`favoriteIds\` owners listesinde kalıyor**~~ — **BU ÖDÜNLEŞİM İKİNCİ DENETİMDE KAPATILDI.** Gerekçe ("gizlemek sayacı bozardı") yeterli değildi: sayaç bir SAYI istiyordu, sunucu ise EŞLEŞMEYİ gönderiyordu. Sayım \`GET /api/listings/favorite-counts\`e taşındı. Bkz. 25.13.
- **Süresi geçmiş öne çıkarma okuma anında değil, 10 dakikalık süpürücüyle kapanıyor.** Okuma yollarının her birine kontrol eklemek, biri atlandığında sessizce yanlış davranan bir sistem demek.
- **Ödeme doğrulaması yok** — sağlayıcı yok.
- **Oturum jetonu localStorage'da** (XSS ödünleşimi, CSP ile azaltılmış).

> **BU LİSTEDE BİR YANLIŞ VARDI (ikinci denetimde bulundu).** Burada "**Şifre düz metin** (şemada belgeli)" yazıyordu. Bu artık DOĞRU DEĞİLDİ: gerçek oturum sistemi eklenirken şifreler bcrypt ile hash'lenmeye başladı ve \`backend/db/db.js\` her açılışta hash'siz kalanları göç ettiriyor (\`looksHashed\` kontrolü). Yani belge, ÇÖZÜLMÜŞ bir açığı hâlâ açık gibi gösteriyordu. Bu iki yönden de kötü: okuyan ya gereksiz paniğe kapılır ya da "belge eski" deyip diğer maddelere de güvenmez.`,
      },
      {
        id: "ikinci-adversarial-denetim",
        title: "25.13 İkinci (adversarial) denetim — önceki denetimin atladıkları",
        body: `## Neden ikinci bir denetim

Birinci denetim "PASS" ile kapanmıştı: 24 bulgu bulunmuş, düzeltilmiş, 2364 test geçiyordu. İkinci tur sondası yalnızca 2 şey döndürmüştü ve ikisi de "kabul edilmiş ödünleşim" olarak not edilmişti.

Bu ikinci denetimin kuralı şuydu: **birinci denetime, onun bulgularına, "düzeltildi" işaretlerine ve GEÇEN TESTLERİNE güvenme.** Amaç yeni bir tur atmak değil, **birincinin gözünden kaçanı bulmak**. Sonuç: **12 yeni bulgu** — biri CRITICAL, üçü HIGH.

En önemli mesaj şu: birinci denetim yanlış bir şey yapmadı; **yanlış yere baktı.** Düzelttiği her yolu tekrar kontrol etti, ama o kuralların KONMADIĞI komşu yolları kontrol etmedi.

## Kör nokta nerede olduğu ölçüldü, tahmin edilmedi

İlk iş, birinci denetimin hangi uçlara hiç dokunmadığını saymaktı: 135 ucun **73'ü** o denetimin test ve sonda dosyalarında hiç geçmiyordu. \`analytics.js\`, \`blog.js\`, \`careers.js\`, \`profileViews.js\`, \`shareEvents.js\`, \`translate.js\`, \`auth.js\` — yani kimlik sisteminin kendisi dâhil. On iki bulgunun onu tam olarak bu dosyalardan çıktı.

Uç listesi de bağımsız olarak yeniden türetildi (\`endpoints.mjs\`e güvenilmedi): her router değişkeni, her mount noktası, ve \`put\`/\`all\` gibi hiç kullanılmayan metotlar da tarandı. Üretici bu sefer temiz çıktı — bu, onu KONTROL ETTİĞİMİZ için söylenebilen bir şey.

## CRITICAL: silinen hesabın id'si bir sonraki kullanıcıya veriliyordu

\`owners.id\` sütunu \`INTEGER PRIMARY KEY\` — yani rowid'in takma adı — ve **AUTOINCREMENT yok**. SQLite'ta böyle bir tabloda yeni satırın id'si \`max(rowid) + 1\`'dir. En yüksek id'li kullanıcı silinince o id BOŞALIR.

\`delete-account\` da satırı gerçekten siliyordu. Ve bazı bağları koparmıyordu: \`support_tickets.fromId\`, \`listings.sellerId\`, \`mechanic_reviews.authorId\`.

İkisi birleşince şu oldu (**varsayım değil, ölçüldü**):

1. Kullanıcı hesabını sildi → id 9009 boşaldı.
2. Sonraki kaydolan kullanıcı da id 9009 aldı.
3. Sahiplik kontrolü \`row.fromId === actor.id\` olduğu için yeni kullanıcı, silinen kişinin kayıtlarının **meşru sahibi** oldu.
4. \`GET /api/tickets/:id\` → **200**, silinen kişinin kişisel şikâyet metni okundu.
5. \`PATCH /api/listings/:id {status:"active"}\` → **200**, yayından kaldırılmış ilan yeniden yayına alındı.

Hiçbir yetki kontrolü atlanmadı. Sistem tutarlı davrandı; yanlış olan **kimliğin kendisinin yeniden kullanılabilir olması**ydı.

**Düzeltme:** owner kolu artık tamirci koluyla aynı deseni izliyor — satır silinmiyor, yerinde anonimleştirilip \`status='deleted'\` işaretleniyor. id asla boşalmıyor, bağlar kopmuyor, ve kişiyi tanımlayan her alan (ad, e-posta, telefon, adres, fotoğraf, şifre, favoriler, kayıtlı aramalar) gerçekten yok ediliyor. Ayrıca \`support_tickets\` metni siliniyor, \`listings.sellerId\` ve \`mechanic_reviews.authorId\` bağları koparılıyor.

**Bu düzeltme iki TESTİ kırdı** — ve kırdığı için değerliydi: \`api.e2e.mjs\` ve \`api3.e2e.mjs\` "satır veritabanından SİLİNDİ" diye doğruluyordu. Yani **o testler açığın kendisini koruyordu.** İkisi de artık gerçek sözleşmeyi ölçüyor: satır duruyor mu, kişi gitti mi, eski şifreyle girilebiliyor mu, id yeniden veriliyor mu.

## HIGH: durum makinesi tek yazma yoluna konmuştu

Birinci denetim randevulara bir durum makinesi eklemişti ve iyi çalışıyordu:

\`\`\`
PATCH {status:"İptal Edildi"}  →  409  "Bu geçiş yapılamaz: Tamamlandı → İptal Edildi."
\`\`\`

Ama \`DELETE\` o router'da **hiç yoktu**. İstek arkadaki jenerik CRUD'a düşüyordu ve orada tek kontrol "bu satır senin mi" idi:

\`\`\`
DELETE (aynı randevu, aynı kullanıcı)  →  204,  KAYIT SİLİNDİ
\`\`\`

Yani müşteri, tamircinin tamamlanmış iş ve ciro kaydını tek taraflı yok edebiliyordu. "Gelmedi" damgalı randevu da silinebiliyordu — randevuya gelmeyen kullanıcı kendi sicilini temizliyordu. Üstelik tamamlanmış randevu, yorum yazma ve doğrulanmış servis geçmişi hakkının ön koşulu.

**Bu denetimin ana dersi bu:** bir kaydı koruyan kural TEK BİR yazma yoluna konursa, o kayda dokunan diğer yolların hepsi sessiz bir bypass olur. **Kural role değil, KAYDA ait olmalı.** Artık "Tamamlandı" ve "Gelmedi" durumundaki randevuyu iki taraftan hiçbiri silemiyor (yalnızca yönetici, moderasyon için).

## HIGH: aynı değişmez iki uçta farklı korunuyordu

\`POST /api/auth/change-email\` e-posta çakışmasını **iki tabloda da** kontrol ediyor ve gerekçesini açıkça yazıyor: *"giriş e-posta ile yapılıyor, çakışma olursa hangi hesaba gireceği belirsizleşir."*

\`POST /api/auth/register\` ise **yalnızca seçilen rolün tablosunu** kontrol ediyordu. Ölçüldü: bir araç sahibinin e-postasıyla tamirci hesabı açıldı, **201** döndü ve kurbanın gelen kutusuna "hesabınız oluşturuldu, şifreniz: ..." maili gitti.

Kural yazılıydı, bir uçta uygulanıyordu, diğerinde uygulanmıyordu.

## HIGH: sınırlayıcı yanlış şeyi sayıyordu

Giriş hız sınırlayıcısı yalnızca **başarısız** denemeleri sayıyor, başarıda \`reset(ip)\` çağırıyordu. Yani geçerli şifresi olan biri \`/login\`'i sınırsız çağırabiliyordu — ölçüldü: **40 istek, 40 kez 200, hiç engel yok.**

Her çağrının maliyeti BAŞKA kullanıcılara biniyordu: (1) her çağrı bir OTP maili kuyruğa atıyor, kuyruk sınırlı (500) ve PAYLAŞILIYOR → dolduğunda gerçekten giriş yapmaya çalışanların OTP'si hiç gitmiyor, yani tüm platformda "giriş yapılamıyor"; (2) her çağrı \`pendingLogins\`'e kayıt ekliyor, tavana ulaşınca **en eski** bekleyen giriş düşüyor → tam o anda kodunu giren meşru kullanıcı "giriş oturumu bulunamadı" alıyor.

**Denedim ve yanlıştı:** ilk düzeltmem \`reset\`'i bırakıp üstüne \`registerFailure\` eklemekti. Bu sayacı her başarıda 0'a çekip 1'e yazıyor, yani **sonsuza kadar 1'de kalıyordu** — düzeltme gibi görünen, hiçbir şeyi değiştirmeyen kod. Ölçmeden bıraksam "eklendi" diye rapor edilecekti. \`reset\` tamamen kaldırıldı.

**Ve bir yan bulgu:** giriş hız sınırını sınayan **hiçbir test yoktu.** Test altyapısı sınırı sabit 500'e ayarlıyordu ve yanındaki yorum "sınırın KENDİSİ ayrıca test ediliyor" diyordu. Kontrol edildi: edilmiyordu. Yani altyapı korumayı sessizce devre dışı bırakıyor ve bu "sınır çalışıyor" gibi görünüyordu. Sınır artık çağıran süreçten ezilebiliyor.

Bir hipotezim de **çürütüldü:** "başarılı giriş sayacı sıfırlıyorsa, arada bir kendi hesabına girerek kaba kuvvet sınırı süresiz bypass edilir" diye düşündüm. Ölçtüm: olmuyor, çünkü 429 kontrolü şifre doğrulamasından ÖNCE çalışıyor — kilitliyken doğru şifre de 429 alıyor. Raporda tutuluyor, çünkü **ölçülen bir "hayır" da bir sonuçtur.**

## Kapı kilitli, pencere açık — dördüncü ve beşinci kez

Birinci denetim bu deseni üç kez bulmuştu. İkincisi iki kez daha buldu:

- **Profil görüntülenme istatistikleri.** Parametresiz \`/stats\` (platform toplamı) admin'e kapatılmıştı, gerekçesi yazılıydı: *"rakipler dâhil herkes gerçek trafik ve dönüşüm verisini tek istekle çekebiliyordu."* Ama hedef bazlı yol (\`?targetType=mechanic&targetId=5\`) kimliksiz açıktı — yorumda "kullanıcıların kendi analiz ekranları için açık" yazıyordu ama kodda **"kendi" diye bir kontrol yoktu.** Üstelik \`/stats/bulk\` tek istekte 200 hedef alıyordu, yani toplu kapıyı kilitleyen düzeltmeyi **fiilen geri alıyordu.**
- **Dönüşüm damgası.** \`POST /api/profile-views/:id/convert\` kimlik ve sahiplik kontrolü olmadan herhangi bir satırı dönüşüm işaretliyordu, id de ardışık tamsayıydı. Tabloyu 1'den dolaşan bir betik platformdaki tüm dönüşüm oranlarını sahteleştirebilirdi. Artık görüntülemeyi kaydeden istemciye tek kullanımlık jeton veriliyor; id bilmek yetmiyor.

## Sessiz sızıntılar

- **Analitik olaylarında \`role\` istemciden geliyordu.** Girişsiz bir betik kendini "mechanic" ilan edip yönetici panelinin tüm rol kırılımını uydurabiliyordu — ölçüldü, 6 istekte 300 uydurma olay kabul edildi ve \`/overview\` bunları saydı. Artık rol oturumdan yazılıyor (girişsiz → "guest"). \`visitorId\` hâlâ doğrulanamıyor ve bunu saklamıyoruz; yapılabilen, hacmi sınırlamak ve doğrulanabilir alanları istemciden almamaktı.
- **Çeviri önbelleği çapraz kullanıcı oracle'ıydı.** Yanıt \`cached: true\` bayrağı döndürüyordu; önbellek sahipsiz ve anahtarı sadece (dil, dil, metin). Sohbet mesajları da bu yoldan çevriliyor. Yani tahmin edilen bir özel mesaj gönderilip **"bu cümle bu sitede yazıldı mı?"** sorusu kimliksiz cevaplanabiliyordu — ve önbellekteki çevirinin kendisi de dönüyordu. Bayrak istemcide hiçbir yerde okunmuyordu: **hiçbir işe yaramayan bir alan, gerçek bir yan kanal açıyordu.**
- **\`share-events\` ham SQL hata metni döndürüyordu:** "UNIQUE constraint failed: share_events.refCode" — tablo, sütun, kısıt. \`makeCrudRouter\`'ın açık politikası bunun tersi; bu dosya politikanın dışında kalmıştı. Aynı uçta \`sharedBy\` de istemciden geliyordu (atıf sahteciliği); artık oturumdan.
- **\`DELETE /api/owners/:id\` 500 veriyordu.** POST ve PATCH kısıt hatalarını özellikle 400'e çeviriyor ("kullanıcı hatası sunucu hatası gibi görünmemeli"); DELETE'te bu dönüşüm yoktu. Aracı olan her kullanıcı için 500 "Internal server error" — istemci "tekrar dene" diyor, tekrar denemek hiçbir zaman işe yaramıyor. Artık 409 ve mesaj doğru yolu söylüyor.
- **Sınırsız büyüyen iki tablo:** \`analytics_events\` ve \`translation_cache\` kimliksiz yazılabiliyor ve hiç temizlenmiyordu. İkisine de satır tavanı kondu. Tavan zaman bazlı değil satır bazlı: "90 günden eskiyi sil" saldırganın 90 günde ne kadar yazacağına sınır koymaz, oysa korunan kaynak disktir.

## Birinci denetimin düzeltmeleri yeniden saldırıya uğradı

Her düzeltme yedi yoldan tekrar denendi: ön yüz, doğrudan API, değiştirilmiş id, değiştirilmiş rol, değiştirilmiş gövde, farklı kullanıcı, eşzamanlı istek. **Tutanlar** (hepsi ölçüldü): rakibin teklif fiyatını değiştirme 403; tamircinin kendi teklifini kabul etmesi 403; ilgisiz kullanıcının kabul etmesi 403; ikinci kez kabul 409; **aynı talepte iki teklifin eşzamanlı kabulü → tam olarak biri kabul edildi**; randevusu olmayan kullanıcının yorum yazması 403; tamircinin kendine yorum yazması 403; alıcının kendi teklifini kabul etmesi 403; yabancı ilanı öne çıkarma 403; yabancı sohbeti okuma/yazma/silme 403; başvuru durumunu ilan sahibi olmayanın değiştirmesi 403; medya yol kaçışı 404; admin uçları kimliksiz 401; oturum jetonunun sorgu dizesinden kabulü 401; admin girişi 11 denemede kilitlendi.

Ve özellikle istenen kontrol: **reddedilen isteğin veritabanına dokunmadığı.** Yetkisiz alan içeren bir randevu PATCH'i 403 döndü ve satır **bit bit aynı kaldı** — kısmi mutasyon yok. Bu takımın kendi kuralı artık bu: bir yazma reddedildiyse durum kodu YETMEZ, veritabanı durumu da kontrol edilir. \`api8.e2e.mjs\`teki kontrollerin her reddedilen isteğinden sonra bir de satır okunuyor.

## Test aracı altıncı kez yanlış şeyi ölçtü

İki yeni statik kontrol kırmızı yandı, ama düzeltmeler doğruydu: \`cached: true\` ve \`loginLimiter.reset(ip)\` desenleri, **o satırların neden KALDIRILDIĞINI açıklayan yorumların içinde** bulundu.

Bir şeyi kaldırdığımızda neden kaldırdığımızı yazarken kaldırılan kodu alıntılamak zorundayız. Yani kaynak metninde "yok" arayan her kontrol, düzeltmenin belgelenmesi yüzünden kırılır — ve bu insanı **yorumları silmeye** teşvik eder. Kötü bir teşvik. \`tests/_harness.mjs\`e \`stripComments\` eklendi: statik yoklamalar artık yalnızca KODA bakıyor.

(O düzeltmeyi yaparken de bir hata yaptım: indeksleri ham metinden alıp temizlenmiş metni dilimledim, yani tamamen yanlış bir parçayı okudum. Dilimlemenin doğru yerden başladığı artık ayrı bir kontrolle doğrulanıyor.)

## Kapatılan "kabul edilmiş ödünleşim"

Birinci denetim \`favoriteIds\`'i listede bırakmıştı: *"sayaç buna dayanıyor, gizlemek sayacı bozardı."* Bağımsız olarak yeniden değerlendirildi ve kabul edilmedi:

- Sızan şey bir SAYI değil, **kişi↔ilan eşleşmesi**: hangi kullanıcının hangi araçları favorilediği. Aynı listede ad ve şehir de olduğu için bu doğrudan profillemeye açık.
- Özelliğin ihtiyacı olan şey bir sayı. Sayıyı istemciye **tüm listeyi vererek** hesaplatmak, ihtiyaçtan çok fazla veri dağıtmaktı.

Sayım \`GET /api/listings/favorite-counts\`e taşındı (SQLite \`json_each\` ile), alan toplu listeden çıktı. Özellik aynı, eşleşme gizli. **Ders: "ödünleşim" demek, alternatifi aradığımızı kanıtlamaz.**

## Hâlâ açık olanlar (dürüst sınırlar)

> **BU DÖRT MADDE 25.15'TE KAPATILDI.** Aşağıdaki hâlleri, kapatılmadan önceki durumu gösteriyor —
> ve biri (\`mechanics.email\`) benim yanlış bir teknik iddiamdı. Güncel durum için bkz. 25.15.

- ~~\`mechanics.email\` veritabanı düzeyinde UNIQUE **değil** — tablo yeniden kurulmadan kapatılamaz.~~ → **YANLIŞ İDDİA:** ALTER TABLE UNIQUE *kısıt* ekleyemez ama var olan sütuna UNIQUE *indeks* kurulabilir. Kuruldu (kısmi, \`lower(email)\` üzerinde).
- ~~\`analytics_events.visitorId\` doğrulanamaz.~~ → Doğrulanamayan şey istemcinin GÖNDERDİĞİ değerdi; sayım artık sunucuda IP karmasından türetiliyor.
- ~~Çeviri önbelleği özel metinlerin düz kopyasını tutuyor.~~ → Kapsam ayrımı eklendi: yalnızca herkese açık metin önbellekleniyor.
- ~~Tarayıcı/responsive/erişilebilirlik testi yapılamıyor.~~ → Tarayıcı gerektirenler için hâlâ doğru, ama koddan ölçülebilen 7 başlık artık ölçülüyor ve **gerçek bir hata buldu** (30 modal Escape ile kapanmıyordu).`,
      },
      {
        id: "iliski-denetimi",
        title: "25.14 İlişki denetimi — müşteri ↔ araç ↔ tamirci zinciri",
        body: `## Sorulan soru farklıydı

Önceki iki denetim "bu satıra kim dokunabilir" diye soruyordu. Bu denetim "bu satır DOĞRU İKİ KAYDI mı birleştiriyor" diye sordu. Fark önemli: yetkilendirme kusursuz olabilir ve sistem hâlâ yanlış veriyi birbirine bağlayabilir.

İlk iş ilişki modelini koddan çıkarmak oldu. 24 tablo, sahiplik/ilişki sütunları ve rol ayırt edicileri (\`sellerType\`, \`fromType\`, \`authorType\`) tarandı. Çıkan gerçek zincir şu:

\`\`\`
owners ──< vehicles ──< quote_requests ──< quote_offers
   │           │              │                 │
   │           │              └── (kabul) ──> istek kapanır
   │           └──< listings ──< offers[] / messages[] (JSON)
   └──< appointments ──> vehicle_history ──> ilanda "doğrulanmış geçmiş"
   └──< conversations ──> messages[] (JSON)
   └──< mechanic_reviews ──< review_helpful
   └──< support_tickets      taste_signals / profile_views / share_events
\`\`\`

Bu haritanın kendisi iki şeyi hemen gösterdi: **sipariş ve ödeme diye bir şey yok** (o yüzden "Orders/Payments PASS" demek yanlış olurdu — yoklar), ve **bildirim tablosu yok**.

## En ciddi bulgu: kural okumada var, yazmada yoktu

\`quotes.js\` içinde \`requestVisibleTo\` diye bir fonksiyon var ve doğru çalışıyor: bir tamirci ancak kendi id'si isteğin \`mechanicIds\` listesinde geçiyorsa o isteği görebiliyor. Ama **teklif oluşturma yolu o fonksiyonu hiç çağırmıyordu.** Ölçüldü:

\`\`\`
GET  /api/quote-requests/12   (Mechanic B)  → 403   "erişim yetkiniz yok"
POST /api/quote-offers {requestId:12, price:1, status:"submitted"}  → 201
\`\`\`

Yani davet edilmemiş bir tamirci isteği OKUYAMIYOR ama içine fiyat YAZABİLİYORDU. Müşteri, hiç seçmediği bir tamirciden fiyat teklifi görüyordu. İkinci ve daha sinsi zarar: yanıt kodları ayırt edilebiliyordu (404 = istek yok, 409 = var ama kapalı, 201 = var ve açık), yani bir tamirci **yazma yolunu kullanarak** başka müşterilerin isteklerini sayabiliyordu — okuma tarafındaki 403'ü dolaylı olarak boşa çıkaran bir numaralandırma kanalı.

Düzeltme, kuralı ikinci kez yazmak DEĞİL: yazma yolu artık aynı \`requestVisibleTo\` fonksiyonunu çağırıyor. Kural tek yerde duruyor, iki yolda da aynı.

## İkinci bulgu: yabancı anahtarlar hiç doğrulanmıyordu

Sahiplik kontrolleri "bu SATIR senin mi" sorusunu doğru cevaplıyordu. Ama bir satırın İÇİNDEKİ ilişki sütunları hiç kontrol edilmiyordu. Ölçülenler:

| Gönderilen | Sonuç (önce) |
|---|---|
| \`POST /api/quote-requests {vehicleId: B'nin aracı}\` | 201 — talep B'nin aracına bağlandı |
| \`POST /api/listings {vehicleId: B'nin aracı}\` | 201 — ilan B'nin aracına bağlandı |
| \`PATCH /api/vehicles/:id {listingId: B'nin ilanı}\` | 200 — araç B'nin ilanına bağlandı |

Bunlar sıradan veri değil. Uygulamanın her yerinde "bu ilanın aracı", "bu talebin aracı" diye okunuyorlar ve **doğrulanmış servis geçmişi zinciri** tam olarak bu bağlar üzerinden yürüyor. Yabancı bir kayda bağlanabiliyorsa iki farklı kişinin verisi tek iş akışında birleşiyor.

Düzeltme \`makeCrudRouter\`'a tablo bazlı bir **ilişki kuralı** olarak kondu (\`RELATION_RULES\`): bir yazma, ancak aktörün SAHİP OLDUĞU bir kayda işaret eden ilişki değeri taşıyabiliyor. Tanımlı olmayan tablo etkilenmiyor — yani mevcut davranış korunuyor. Sessizce düşürmek yerine 403: kullanıcı bağladığını sandığı aracın bağlanmadığını bilmeli.

## Üçüncü bulgu: randevu ↔ araç ilişkisi hiç YOKTU

\`appointments\` tablosunda aracı gösteren tek alan \`vehicle TEXT\` idi — yani **"VW Golf · 34ABC01" gibi bir metin.** Hangi gerçek araç kaydının servise girdiği veritabanında hiç yazmıyordu.

En somut bedeli şuydu: doğrulanmış servis geçmişi (\`vehicle_history\`) VIN'i randevudan çözemiyor, **randevu metninin içinde plaka arıyordu**:

\`\`\`js
const match = candidates.find((v) => v.plate && apptText.includes(v.plate));
\`\`\`

Plaka metne yazılmadıysa ya da biçimi farklıysa eşleşme sessizce başarısız oluyor ve uygulamanın en güçlü güven özelliği hiç oluşmuyordu. Aynı marka/modelden iki aracı olan kullanıcıda hangisinin servise girdiği de ayırt edilemiyordu.

\`vehicleId\` sütunu eklendi, sunucu dolduruyor ve aracın randevuyu açan kişiye ait olduğunu doğruluyor. VIN çözümü artık önce bu gerçek bağdan yapılıyor; metin eşleşmesi yalnızca eski kayıtlar için yedek yol olarak duruyor. Alan **zorunlu kılınmadı** — gönderilmezse eski davranış aynen sürüyor, yani mevcut istemci kırılmadı.

## Dördüncü bulgu: başkasının aracına servis geçmişi yazılabiliyordu

VIN'i tamircinin elle yazabilmesi kasıtlı ve doğru (aracı fiziksel olarak görüyor). Ama hiç kontrol edilmiyordu: bir tamirci, elindeki HERHANGİ bir tamamlanmış randevuyu kullanarak **başka birinin garajında kayıtlı bir VIN'e** servis kaydı yazabiliyordu. Kayıt \`ownerId = randevunun sahibi\` ile açıldığı için, gerçek araç sahibi kendi VIN'ini sorguladığında hiç yaptırmadığı bir işi "doğrulanmış" olarak görüyordu.

Yeni kural: VIN sistemde kayıtlı bir araca aitse, o araç randevunun sahibine ait olmalı. VIN hiç kayıtlı değilse yazılabiliyor — tamircinin gerçekten yaptığı işi kaydetmesinin önü kesilmiyor, yalnızca **başkasının kaydına yazmak** engelleniyor.

## Beşinci bulgu: iyimser yazmalar geri alınmıyordu

\`persist()\` yardımcısı 86 çağrı yerinde kullanılıyor ve deseni şuydu:

\`\`\`js
setFavoriteIds(next);                                   // ekran HEMEN güncellenir
persistMyPrefs({ favoriteIds: next }, "Favori kaydedilemedi");  // gönder ve unut
\`\`\`

İstek başarısız olduğunda yapılan tek şey uyarı toast'ı göstermekti; **yerel durum geri alınmıyordu.** Kullanıcı ekranda "favorilere eklendi" görmeye devam ediyor, sayfayı yenilediğinde favori yok. Bu, tam olarak bu denetimde aranan "frontend'de çalışıyor gibi görünen ama kalıcı olmayan" durum.

İlginç ayrıntı: **doğru desen uygulamada zaten vardı.** \`toggleReviewHelpful\` başarısızlıkta sayacı ve beğeni listesini eski hâline döndürüyor ve yorumunda "sayaç ekranda yanlış kalmasın" diyor. Ders bir yerde öğrenilmiş, kardeş çağrı yerlerine taşınmamıştı — bu üç denetimin en çok tekrarlayan bulgusu.

\`persist\` artık üçüncü bir argüman alıyor: başarısızlıkta çalışan geri alma. Argüman zorunlu değil (86 çağrıyı birden değiştirmek düzeltilenden çok hata üretir); iyimser olarak yerel durumu değiştiren yerlere eklendi — favoriler, favori tamirciler, VIN paylaşım tercihi. Yan etki de updater'ın DIŞINA taşındı: React bir güncelleyiciyi iki kez çağırabilir, içinde istek atmak isteğin iki kez gitmesi demekti.

## Sohbetteki kopya alanlar

\`conversations.mechanicName / mechanicImg / mechanicLang\` sohbet satırında tutulan kopyalar ve gövdeden olduğu gibi kaydediliyordu. Ölçüldü: \`mechanicName: "SAHTE AD"\` aynen kaydedildi. Tek başına ciddi değil ama bir kullanıcının KİMİNLE yazıştığını yanlış bilmesi demek — oltalama için yeterli bir zemin. Üç alan da artık kaynak satırdan okunuyor. (Aynı sınıf hata ikinci denetimde randevularda da vardı: \`mechanicName\` kopyası anonimleşmiyordu. Kural: kopya alanın değeri her zaman kaynaktan gelir.)

## Temiz çıkanlar — ve bunu nasıl biliyoruz

Çapraz erişim matrisi 4 kullanıcıyla (Customer A/B, Mechanic A/B) ve girişsiz ziyaretçiyle, 7 kayıt türü × GET/PATCH/DELETE olarak koşuldu. Sonuç tablo hâlinde:

\`\`\`
araç           CB: 403/403/403   MB: 403/403/403   girişsiz: 401/401/401
randevu        CB: 403/403/403   MB: 403/403/403   girişsiz: 401/401/401
sohbet         CB: 403/403/403   MB: 403/403/403   girişsiz: 401/401/401
teklif isteği  CB: 403/403/403   MB: 403/403/403   girişsiz: 401/401/401
destek talebi  CB: 404/404/404   MB: 404/404/404   girişsiz: 404/404/404
araç sahibi    CB: 200/403/403   MB: 200/403/403   girişsiz: 200/401/401
ilan           CB: 200/403/403   MB: 200/403/403   girişsiz: 200/401/401
\`\`\`

(Son iki satırdaki 200 kasıtlı: ilan ve satıcı adı herkese açık olmalı, ama kişisel alanlar listeden çıkarılmış — bkz. hydrate.js.)

Ayrıca **tutan** kurallar tek tek ölçüldü: mesaj göndereni oturumdan damgalanıyor ve yabancı sohbete yazamıyor (reddedilen mesaj diziye EKLENMİYOR); yorum yalnızca tamamlanmış randevusu olan müşteriden geliyor, ikinci yorum 409, yazarı dışında kimse (hakkındaki tamirci dahil) silemiyor; puan **sunucuda** hesaplanıyor ve tamirci kendi puanını yazamıyor; "faydalı" oyu kişi başına bir kez ve sayaç sayılıyor, tutulmuyor; favoriler veritabanında ve yabancı dokunamıyor; teklifi yalnızca isteğin sahibi kabul edebiliyor, ikinci kabul 409.

## Var olmayan özellikler — "PASS" demek yanlış olurdu

- **Sipariş ve ödeme YOK.** Ne tablo, ne uç. \`appointments.depositPaid\` diye bir sütun var ama hiçbir yazma yolu ona dokunamıyor (bilerek: ödeme sağlayıcısı yok, para alanını yazabilen taraf olmamalı). Yani "Payments: PASS" demek uydurma olurdu; doğru cevap "bu özellik yok".
- **Block/unblock YOK.** Şikâyet yolu \`support_tickets\`.
- **Realtime/WebSocket YOK.** Veri istek üzerine çekiliyor. Bu yüzden "yanlış kullanıcıya event gidiyor mu" sorusunun konusu yok.
- **Bildirim sunucuda YOK — bu gerçek bir sınır.** \`notifLog\` saf React state'i. Sonuçları dürüstçe: bildirimler sayfa yenilendiğinde kaybolur, ikinci cihazda görünmez, "okundu" durumu saklanmaz, okunmamış sayısı oturumlar arasında taşınmaz. Yani "yeni mesajınız var" bildirimi veritabanındaki mesajdan ÜRETİLMİYOR; o oturumda olan bir olaydan üretiliyor. Bunu yarım yamalak kurmak (ör. yalnızca yazma tarafı) daha kötü olurdu; kalıcı bildirim ayrı ve gerçek bir iş.

## Hâlâ açık olanlar

- **Araç silinince ona bağlı ilanın \`vehicleId\` bağı sahipsiz kalıyor.** Ölçüldü ve regresyon testinde açıkça yazılı (gizlemek yerine belgeledik). Veri sızıntısı değil — ilan satıcısına ait ve araç kaydı gitmiş olduğu için oradan bilgi çıkmıyor — ama tutarsız bir bağ.
- **Kabul edilen teklif ile oluşan randevu arasında kayıt YOK.** Müşteri teklifi kabul ediyor, sonra randevuyu ayrıca alıyor; "bu randevu şu teklifin sonucudur" bilgisi hiçbir yerde tutulmuyor. Zincirin bu halkası veritabanında kopuk.
- **VIN hâlâ bir beyandır.** Resmî tescil kaydına bağlanmadığı sürece doğrulanamaz; artık yalnızca "başkasının kaydına yazma" kapatıldı.
- Tarayıcı/responsive/erişilebilirlik testi bu ortamda yapılamıyor (önceki denetimlerle aynı sınır).

## Sonradan çıkan ve bu denetimden daha önemli olan hata: BAYAT SUNUCU

Bu değişiklikler senin makinende koşturulduğunda \`api8\` ilk satırında patladı:

\`\`\`
register(a8-a@example.com) → 409 {"error":"Bu e-posta adresiyle zaten bir hesap var."}
\`\`\`

İlk bakışta "test kullanıcısı çakışması" gibi görünüyor. Değildi. Sebep şuydu:

1. Çökmüş bir önceki koşudan kalan sunucu süreci portu dinlemeye devam ediyordu.
2. Harness yeni sunucuyu başlattı; yeni süreç \`EADDRINUSE\` ile öldü.
3. Ama hazır olma kontrolü \`GET /api/health\` yokluyordu ve **cevap geldi** — eski süreçten.
4. Harness "hazır" deyip devam etti. Veritabanı dosyasını silmesi hiçbir işe yaramadı, çünkü
   istekler eski sürece, onun eski veritabanına gidiyordu.

**Bunun en kötü tarafı testin patlaması değil.** Bayat sunucunun şeması ve verisi uyumlu olduğu
sürece testler GEÇEBİLİR de. Yani yeşil bir koşu, o an hiç çalıştırılmamış kodu doğruluyormuş gibi
görünebilirdi — bu takımın bütün anlamını sessizce boşa çıkaran bir hata. Bu oturumdaki bütün
denetimlerin dayanağı "ölçtüm" cümlesiydi; bu hata "neyi ölçtüm" sorusunu belirsiz bırakıyordu.

Düzeltme iki katmanlı:

- **Başlamadan önce port yoklanıyor.** Doluysa koşu, ne yapılacağını söyleyen bir hatayla duruyor
  (\`lsof -ti tcp:PORT | xargs kill -9\`) — sessizce devam etmiyor.
- **Sunucu kendi örnek kimliğini geri söylüyor.** Harness rastgele bir kimlik üretip env ile
  geçiyor; \`/api/health\` o kimliği döndürmedikçe sunucu "hazır" sayılmıyor. Böylece "bir sunucu
  yanıt veriyor" ile "BENİM sunucum yanıt veriyor" ayırt ediliyor. Üretimde bu değişken tanımlı
  olmadığı için alan \`null\` döner ve hiçbir şey değişmez.
- Ayrıca çocuk süreç açılmadan ölürse artık 20 saniye beklenmiyor: çıkış kodu ve sunucu günlüğü
  hemen gösteriliyor, yani sebep ("port kullanımda") görünür oluyor.

Senaryo kurulup **ölçüldü**: sahte bir "bayat sunucu" aynı porta bağlandığında harness artık
doğru hatayı veriyor ve testleri hiç başlatmıyor.

Ders, bu oturumun tekrar eden dersinin test altyapısındaki hâli: **bir cevap almak, doğru
kaynaktan cevap almak demek değil.**`,
      },
      {
        id: "kalan-riskler-kapatildi",
        title: "25.15 \"Kalan riskler\" listesinin kapatılması",
        body: `## Neden bu sayfa var

Üç denetimin sonunda hep aynı dört madde "dürüst sınırlar" başlığı altında duruyordu. Kullanıcı
haklı olarak "bunu da düzelt" dedi. Dördünü tek tek ele aldım ve **birinde kendi iddiam yanlış
çıktı**, ikisinde ise "doğal sınır" sandığım şey aslında yapmadığım bir ayrımdı.

## 1) \`mechanics.email\` UNIQUE değil — İDDİAM YANLIŞTI

Şöyle yazmıştım: *"sütun ALTER TABLE ile sonradan eklendiği için SQLite UNIQUE koyamıyor; tablo
yeniden kurulmadan kapatılamaz."*

Doğrusu: SQLite \`ALTER TABLE ... ADD COLUMN\` ile **UNIQUE KISIT** ekleyemez, ama var olan bir
sütun üzerine **UNIQUE INDEX** kurabilir. Kısıt ile indeks farklı şeyler; ben ikisini aynı
sanmışım. Üstelik bu dosyada örneği zaten vardı (\`idx_review_one_per_author\`). Yani engel teknik
değil, benim yanlış varsayımımdı — ve "dürüst sınır" diye üç denetim boyunca taşındı.

İndeks **kısmi** ve \`lower(email)\` üzerinde. İkisi de gerekli:

- \`WHERE email IS NOT NULL AND email != ''\` → eski/demo kayıtlarda e-posta boş olabiliyor. SQLite
  NULL'ları birbirinden farklı sayar ama **boş dizeyi saymaz**; bu koşul olmasa iki boş e-postalı
  tamirci indeksi ihlal eder ve uygulama hiç açılmazdı.
- \`lower(email)\` → uygulama karşılaştırmayı \`WHERE lower(email) = ?\` ile yapıyor. İndeks aynı
  ifadeyi kullanmazsa "Ali@x.com" veritabanı için farklı, uygulama için aynı olur — yani kural iki
  katmanda **çelişirdi**. Aynı hizalama \`owners.email\` için de eklendi (oradaki sütun kısıtı
  harf duyarlıydı).

Ölçüldü: uygulama katmanı atlanıp doğrudan veritabanına \`"A9-MA@EXAMPLE.COM"\` yazılmaya
çalışıldı — **reddedildi**. Mevcut veride çakışma varsa indeks kurulamaz; o durumda uygulama
çökmüyor ama çakışan adresler günlüğe yazılıyor. Veriyi kendiliğinden birleştirmek bu katmanın işi
değil: hangi hesabın gerçek olduğuna kod karar veremez.

## 2) \`visitorId\` doğrulanamaz — YANLIŞ SORU

"Doğrulanamaz" olan şey istemcinin **gönderdiği** değerdi. Ama sayımı ona dayandırmak zorunda
değildik; ben öyle varsaymışım.

Önce: \`visitorId: clip(r.visitorId)\`. Yönetici panelindeki bütün "kaç ziyaretçi" sayıları
\`COUNT(DISTINCT visitorId)\` ile hesaplanıyor (15+ yerde). Yani tek bir betik her olayda farklı bir
kimlik üretip istediği kadar "tekil ziyaretçi" uydurabiliyordu: 300 istek × 50 olay = **15.000
sahte ziyaretçi**, hiç kimlik gerekmeden.

Şimdi: değer sunucuda IP karmasından türetiliyor (\`hashIp\`, \`owners.signupIpHash\` ile aynı desen).
Ölçüldü: 20 uydurma kimlikle gönderilen 20 olay veritabanında **tek** ziyaretçiye indi.

**Dürüst bedeli:** aynı NAT/ofis/ev arkasındaki farklı kişiler tek ziyaretçi sayılıyor, yani sayı
artık **eksik** sayabiliyor. Bir güven metriğinde eksik saymak şişirilebilir olmaktan iyidir —
yanlış tarafa doğru hata yapıyoruz ve bunu biliyoruz. Ölçtüğümüz şey artık "kaç kişi" değil
**"kaç ağ noktası"**. Sütun adı değişmedi, o yüzden 15 sorgu olduğu gibi çalışmaya devam ediyor.

**Kalan sınır:** \`sessionId\` istemcinin değeriyle IP karmasının karışımı; aynı IP'den hız sınırı
kadar oturum uydurulabilir. Ama bir IP artık başka bir IP'nin oturumunu taklit edemiyor.

## 3) Çeviri önbelleği düz metin tutuyor — YAPMADIĞIM AYRIM

"Bir çeviri önbelleğinin doğası bu" demiştim. Doğru olan kısmı: çeviriyi önbelleklemek metnin bir
kopyasını tutmaktır. **Yanlış olan kısmı:** bundan "o zaman her metni önbelleklemek zorundayız"
sonucunu çıkarmam. Çevrilen metinler iki ayrı sınıfa ayrılıyor ve bu ayrımı hiç yapmamıştım:

- **Herkese açık** — ilan açıklaması, iş ilanı metni, yorum, tamircinin yorum yanıtı, ilandaki
  soru-cevap. Bunlar zaten girişsiz herkese görünüyor; paylaşılan önbellekte tutmanın ek gizlilik
  maliyeti **yok**, kazancı büyük.
- **Özel** — sohbet mesajları, randevu/teklif arıza açıklaması, iş başvurusu mesajı.

Artık \`scope: "public"\` gelen metinler önbellekten okunuyor ve önbelleğe yazılıyor; **diğer her
şey (kapsam verilmemiş dahil) ne yazılıyor ne okunuyor.** Bu, ikinci denetimde bulunan
"bu cümle bu sitede yazıldı mı" oracle'ını özel metin için tamamen kapatıyor — artık bakılacak bir
kayıt yok.

**Varsayılan "özel" (fail-closed)** bilinçli: yeni bir ekran kapsam vermeyi unutursa sonuç
"gizlilik sızdı" değil "önbellek kullanılmadı" olur. Kullanıcı deneyimi bozulmuyor: istemcinin
kendi localStorage önbelleği özel metinler için de çalışıyor, yani aynı sohbeti tekrar açan
kullanıcı çeviriyi yine anında görüyor.

## 4) Tarayıcı/erişilebilirlik testi yapılamıyor — DOĞRU AMA TAMAM DEĞİL

O satır doğruydu ama iki farklı şeyi aynı kefeye koyuyordu: gerçekten tarayıcı gerektirenler
(kontrast, odak sırası, ekran okuyucu çıktısı, 320px'te akış) ile **kaynak koddan ölçülebilenler**.
İkincisi hiç denenmemişti.

Denendi ve **gerçek bir hata çıktı:** bu dosyadaki **30 modalın hepsi** arka plana tıklayarak
kapanıyordu ama **hiçbiri Escape'i dinlemiyordu**. Fare kullanamayan biri açılan modalın içinde
kalıyordu. Utanç verici tarafı: el kitabının kendi kuralı bunu zaten yazıyor — *"Escape ile
kapanmalı; kullanıcıyı içeride hapsetmemeli"* — ve küçük bileşenler (PhotoLightbox, EmojiPicker,
ComboBox, WelcomeTour, ShareButton) bunu **doğru** yapıyor. Yine aynı desen: ders bir yerde
öğrenilmiş, kardeşlerine taşınmamış.

Düzeltme 30 ayrı düzenleme değil: arka planlara **salt ekleme** bir işaret (\`data-modal-backdrop\`)
konuldu ve tek bir Escape işleyicisi işaretlilerin **en üstündekini** tıklıyor. Böylece kapatma
mantığı tek yerde (modalın kendi \`onClick\`'i) kalıyor ve üst üste modalda yalnızca en üstteki
kapanıyor. Yeni modal eklendiğinde işareti koymayı **bir test zorluyor**.

Ayrıca: bir \`<img>\`de eksik \`alt\` bulundu ve 7 gerçek ikon düğmesine \`aria-label\` eklendi
(yeni i18n anahtarları, üç dilde).

### Ölçüm aracım iki kez yanlış şeyi ölçtü — ve bu önemli

İlk taramam **73 "etiketsiz input"** ve **62 "klavyeyle erişilemez div"** bildirdi. İkisi de büyük
ölçüde yanlış pozitifti: inputların bir kısmı gizli dosya seçicisi, div'lerin neredeyse tamamı
modal arka planı (WCAG bunların klavyeyle erişilebilir olmasını istemiyor; **modalın kapanabilmesini**
istiyor). Ham sayıya bakıp 135 "hata" bildirmek, gerçek bulguyu gürültünün içinde gizlerdi.

Sonra düğme kuralını yazarken **iki hata daha yaptım**: (1) gövdeyi \`src.indexOf(t.text)\` ile
arıyordum — aynı açılış etiketi dosyada iki kez geçince her zaman **ilk** kopyayı bulup başka bir
düğmenin gövdesini okuyordu; (2) "metin var mı" kuralı yalnızca harf arıyordu, oysa gövde \`{tm}\`
gibi bir **değişken** de olabilir ve o ekranda metin basar. İkisi birlikte 2 gerçek bulguyu 13
yanlış alarmın içine gömüyordu. Düzeltildi.

### Ne ÖLÇÜLMÜYOR (uydurmuyoruz)

Gerçek renk kontrastı, odak sırası ve odak tuzağı, ekran okuyucunun okuduğunun **anlamlı** olup
olmadığı, 320-375px'te gerçek akış, dokunma hedefi boyutu. Bunlar için tarayıcı tabanlı bir araç
(Playwright + axe-core) gerekiyor ve bu ortamda ön yüz derlenemediği için kurulamıyor. Kapatılan
boşluk: 7 başlık artık ölçülüyor ve bozulursa test kırmızı yanıyor (\`tests/a11y.test.mjs\`, 18
kontrol).`,
      },
      {
        id: "tek-geri-tusu",
        title: "25.16 Tek geri tuşu — üçüncü kez bildirilen hata",
        body: `## Kullanıcı bunu üç kez söyledi

Üçüncüsünde ekran görüntüsü geldi: üstte standart üst çubuğun geri oku, hemen altında kapak
görselinin üzerinde yüzen ikinci bir geri oku. İki tuş, iki farklı yer — biri listeye, biri panoya
gidiyordu. Kullanıcının sorusu haklıydı: hangisi nereye götürüyor?

**Utanç verici kısmı:** \`AppShell.tsx\` içinde şu yorum ZATEN yazılıydı —
*"TEK GERİ TUŞU (kullanıcı bildirdi: 'burada iki tane geri tuşu var')... Artık her sayfada olduğu
gibi TEK üst çubuk."* Yani sorun bir kez bulunmuş, **bulunduğu sayfada** düzeltilmiş ve kardeş
sayfalara hiç bakılmamış. Bu oturumun en çok tekrarlayan bulgusu, bu kez arayüz tarafında.

## Dört sayfa, üç farklı kusur

| Sayfa | Durum |
|---|---|
| Tamirci detayı | \`PageTopBar\` **+** kapakta yüzen ok → **ekran görüntüsündeki sayfa** |
| İlan detay sayfası | İki ayrı **yapışkan çubuk** üst üste (ikisi de \`top-0\`), ikisinde de geri |
| Araç sahibi sohbeti | \`PageTopBar\` **+** sohbet bandında ikinci geri |
| Araç sahibi profili | **Hiç üst çubuk yok** — ters tutarsızlık: logo bile görünmüyordu |
| Araç sahibi ayarları | **Üçüncü varyant**: logo bandın ortasında, geri solda yüzüyor |

Son ikisi "çift geri" değildi ama aynı işin üç ayrı görünümü demekti: kullanıcı her sayfada geri
okunu başka yerde arıyordu.

## Düzeltmeler

- **Tamirci detayı:** kapaktaki yüzen ok kaldırıldı. Favori ve paylaş kapakta KALDI — onlar
  görsele ait eylemler (Airbnb deseni) ve tek örnekleri o. Geri ise bir *gezinme* eylemi; yeri
  üst çubuk.
- **İlan sayfası:** sayfaya özel çubuk tamamen kaldırıldı. \`PageTopBar\` bunun için zaten bir
  \`right\` yuvası sunuyordu; favori ve paylaş oraya taşındı. Üst üste binen iki yapışkan katman
  da böylece bitti. Kaybedilen işlev yok.
- **Sohbet:** banttaki geri kaldırıldı; bant artık yalnızca karşı tarafın adını gösteriyor.
- **Profil ve ayarlar:** ikisi de standart \`PageTopBar\`a geçirildi. Artık beş sayfanın hepsi
  aynı: solda geri, ortada logo, sağda varsa eylemler.

## Bekçi test — ve kuralı bulmak için üç deneme

Aynı hatanın dördüncü kez çıkmaması için \`tests/back-button.test.mjs\` yazıldı. Ama doğru kuralı
bulmak üç deneme aldı ve üçünü de yazıyorum, çünkü ikisi **yanlış alarm** üretti:

1. **"Her ekran bloğunda tüm geri afordanslarını say."** Üç bulgu verdi, üçü de yanlıştı:
   \`detail\` bloğunda sayılan iki ok, iki AYRI tam ekran modalın kapatma okuydu (ikisi aynı anda
   asla görünmüyor); \`chat\` bloğu \`booking\` ekranını yuttu çünkü blok sınırı yakalanamadı;
   \`mechProfilePage\` dosya sonuna kadar uzayıp arkasındaki modalleri içine aldı. Ders: JSX'i
   statik okuyarak "aynı anda ekranda görünür mü" sorusu güvenilir biçimde cevaplanamıyor.
2. **"Üst çubuk varsa hiç yüzen ok olmasın."** Bu da tam ekran modallerin meşru tek oklarını
   bulguladı.
3. **Çalışan kural:** yüzen okun ÖNÜNDE en son ne geliyor — bir \`PageTopBar\` mı (ok bir SAYFAYA
   ait, yani çift geri) yoksa bir tam ekran modal kabı (\`fixed inset-0\`) mı (ok MODALA ait, tek).
   Bağlam belirlenebilir, tahmin yok.

Testin kendisi de iki kez yanlış şeyi ölçtü: "ikinci yapışkan çubuk kaldırıldı" kontrolü, o
çubuğun neden kaldırıldığını anlatan **kendi yorumundaki** \`sticky top-0 z-20\` metnine takıldı
(\`stripComments\` ile çözüldü) — ve yorumları silmek satır numaralarını kaydırdığı için bulgular
**yanlış satırda** gösteriliyordu. \`stripComments\` artık yorum yerine aynı sayıda satır sonu
bırakıyor, yani desen eşleşmesi için yorum yok ama adres doğru. Yanlış adres, insanı olmayan bir
hatayı aramaya gönderir.

**Bekçi kanıtlandı:** hata bilerek geri konuldu (tamirci detayına yüzen ok yeniden eklendi), test
iki kontrolde kırmızı yandı, hata geri alındı, yeşile döndü. Ayrıca araç "hiçbir şey görmediği
için 0 bulgu" durumuna düşmesin diye, modal bağlamındaki okları GÖRDÜĞÜNÜ ama doğru şekilde muaf
tuttuğunu da ölçen bir kontrol var.`,
      },
      {
        id: "teklif-on-secimi",
        title: "25.17 Teklif isteğinde ön seçim — ve eklerken çıkan tuzak",
        body: `## İstek

*"Ücretsiz teklif al tuşunu eğer tamircinin profilinden seçiyorsa o tamirci seçili olarak
görünsün."* Beklenti doğru: bir tamircinin sayfasındayken "teklif al" demek **bu** tamirciden
teklif almak demektir. Önceden modal tamamen boş açılıyordu ve kullanıcı, zaten sayfasında olduğu
tamirciyi listede yeniden aramak zorunda kalıyordu.

## Çözüm ve iki tasarım kararı

\`openQuoteModal(preselectMechanicId)\` — verilen tamirci **normal seçili listeye** yazılıyor.

- **Ayrı/kilitli bir alan DEĞİL.** Kullanıcı isterse onu kaldırabiliyor ve üstüne başka tamirciler
  ekleyebiliyor. "Şu tamirci sabit" gibi bir özel durum yaratmak, kullanıcının kararını kilitlemek
  olurdu — teklif isteme akışının tamamı "kimden isteyeceğini SEN seç" üzerine kurulu.
- **Limit kontrolü kopyalanmadı.** Ön seçim tek tamirci ve limitler (5 / premium 10) en az 1
  olduğu için ihlal mümkün değil; kural yalnızca kullanıcı ekleme yaptığında devreye giriyor
  (\`toggleQuoteMechanic\`). Aynı kontrolün iki kopyası zamanla birbirinden ayrılır.

## Eklerken ortaya çıkan gerçek tuzak

Ön seçimi yazdıktan sonra şunu farkettim: tamirci listesi önce **aramaya**, sonra **filtrelere**
göre eleniyor. Kullanıcının o an açık bir filtresi varsa (ör. "5 km'den yakın") ve profilinden
teklif istediği tamirci o filtreye uymuyorsa, sayaç **"1 seçili"** yazarken tamirci listede
**hiç görünmüyordu.** Kullanıcı ne seçtiğini göremez, kaldıramaz — sessiz ve kafa karıştırıcı.

Kural eklendi: **bir tamirci seçiliyse her zaman listede ve en üstte.** Bu ön seçime özel bir yama
değil — kullanıcı elle seçip sonra arama yazdığında da aynı sorun oluyordu. Sıralama seçili
*olmayanlar* arasında bozulmuyor: öne alma, kullanıcının seçtiği sıralama (mesafe/fiyat/puan)
uygulandıktan **sonra** yapılıyor.

\`useMemo\` bağımlılığına \`quoteSelectedMechIds\` eklendi. Unutulsa ön seçili tamirci ilk açılışta
listede görünmezdi — sessiz ve teşhisi zor bir hata.

## İki kez kendi kendimi düzelttim

- Koda ilk yazdığım gerekçe şuydu: *"\`closeOverlays()\` seçili tamirciyi temizlediği için id önce
  okunuyor."* **Kontrol ettim, yanlıştı** — o fonksiyon yalnızca harita katmanlarını kapatıyor.
  Id'yi yine önce okuyoruz ama gerekçesi dürüst olanı: çağrı sırası ileride değişirse ön seçim
  sessizce çalışmaz hâle gelir, bir satır maliyetle o risk kapanıyor. Yanlış bir gerekçe, doğru
  koddan daha zararlı olabilir — sonraki geliştirici ona dayanarak karar verir.
- Testte \`"1,3"\` bekledim, \`"1"\` geldi. Kodu değil **kendi beklentimi** düzeltmem gerekti: test
  verisindeki üçüncü tamircinin mesafesi 10 km, filtre 5 km — elenmesi doğru davranış.

## Test (\`tests/quote-preselect.test.mjs\`, 20 kontrol)

İki şey ayrı ayrı ölçülüyor, çünkü yalnızca birincisini ölçen bir test özelliği "çalışıyor"
gösterip kullanıcıyı kafası karışmış bırakabilirdi:

1. **Kablolama:** buton id'yi geçiyor, modal onu seçili listeye yazıyor, başka yerden açılınca ön
   seçim olmuyor (rastgele biri seçili gelmemeli).
2. **Davranış:** filtre/arama mantığı test içinde veriyle **gerçekten çalıştırılıyor** — filtreye
   uymayan seçili tamirci görünüyor mu, en üstte mi, kaldırılınca filtre yine geçerli mi,
   sıralama korunuyor mu.`,
      },

    ],
  },
];

/** Arama için düz liste: bölüm başlığı + sayfa başlığı + gövde. */
export const HANDBOOK_PAGES = HANDBOOK.flatMap((s) =>
  s.pages.map((p) => ({ sectionId: s.id, sectionTitle: s.title, ...p })),
);
