/**
 * BLOG BAŞLANGIÇ İÇERİĞİ — anahtar kelime odaklı.
 * -------------------------------------------------------------------------------------------
 * Her yazı, insanların Google'a GERÇEKTEN yazdığı bir soruyu hedefliyor. Başlıklar da o
 * arama kalıbına yakın kuruldu ("jant tamiri kaç para", "klima soğutmuyor", "motor arıza
 * ışığı yandı") — çünkü arama sonucunda tıklanan şey başlıktır.
 *
 * `relatedServiceKey` bu dosyanın asıl fikri: yazıyı SERVICE_CATALOG'daki bir hizmete
 * bağlıyor. Yazının içindeki ve sonundaki bağlantı, o hizmeti veren tamircilerin
 * FİLTRELENMİŞ listesini açıyor. Yani okuma niyetiyle gelen ziyaretçi tek tıkla arama
 * niyetine geçiyor — blog trafiğinin işe dönüştüğü yer tam olarak burası.
 *
 * Metinler bilinçli olarak fiyat vaadi vermiyor, aralık ve "değişir" diyor: fiyatlar
 * markaya, şehre ve hasara göre gerçekten değişiyor; kesin rakam yazmak hem yanıltıcı
 * olur hem de kısa sürede eskirdi.
 */
export const BLOG_SEED_POSTS = [
  {
    slug: "jant-tamiri-kac-para-jant-duzeltme-rehberi",
    title: "Jant Tamiri Kaç Para? Çizik, Ezik ve Çatlak İçin Yol Haritası",
    excerpt: "Jant çizildi, kaldırıma vurdu ya da hava kaçırıyor. Hangi hasar tamir edilir, hangisi jantı çöpe atar? Fiyatı belirleyen şeyler ve tamirciye gitmeden önce bilmen gerekenler.",
    tags: ["jant", "lastik", "tamir"],
    relatedServiceKey: "rim_repair",
    body: `Kaldırıma sürttün, rögar kapağına girdin ya da jantın kenarı zamanla kavlamaya başladı. İlk soru hep aynı: tamir edilir mi, ne kadar tutar?

## Hangi hasar tamir edilir?

**Yüzeysel çizik ve sürtme izi.** En sık görülen hasar. Jantın yapısına dokunmaz, yalnızca yüzeydedir. Zımparalama, dolgu ve boya ile giderilir; elmas kesim yüzeyli jantlarda CNC tezgâhında yeniden işlenir.

**Hafif ezik (kaldırım darbesi).** Jant kenarının içe göçmesi. Pres veya kontrollü ısıtma ile düzeltilir. Bu, en yaygın "jant düzeltme" işidir.

**Balanssızlık / titreme.** Darbe sonrası jant hafifçe sekiz yapmış olabilir. Düzeltme sonrası mutlaka balans alınmalıdır.

## Hangi hasar tamir edilmez?

**Çatlak.** Özellikle alüminyum alaşımlı jantlarda kaynak yapılsa bile jant eski dayanımına dönmez. Yüksek hızda ilerleyen bir çatlak, lastiğin aniden boşalması demektir. Ciddi çatlakta doğru cevap değişimdir.

**Bijon deliği bölgesinde deformasyon.** Jantın tekerleğe tutunduğu yerdir; buradaki bozulma güvenlik sorunudur.

**Tekrar tekrar düzeltilmiş jant.** Metal her düzeltmede biraz yorulur. Aynı jant üçüncü kez düzeltiliyorsa maliyeti yeni jantla karşılaştırmak gerekir.

## Fiyatı ne belirler?

Tek bir rakam vermek doğru olmaz, çünkü fiyatı şunlar belirliyor:

- **Hasarın türü:** yalnızca çizik mi, ezik de var mı, boya gerekiyor mu.
- **Jantın yapısı:** çelik jant ile çok parçalı alaşım jant aynı işçilik değildir.
- **Yüzey tipi:** elmas kesim (diamond cut) jantlar CNC tezgâhı gerektirir, bu işçiliği pahalılaştırır.
- **Boyut:** 19–20 inç jantlar hem daha zor işlenir hem daha çok malzeme ister.
- **Marka:** premium modellerin jantları genelde daha kalın ve daha zor işlenen alaşımdır.

Bu yüzden telefonda alınan fiyat çoğu zaman yanıltıcıdır. Jantı gören usta gerçek fiyatı söyler.

## Tamirciye gitmeden önce

1. **Fotoğraf çek.** Hasarın yakın ve uzak açıdan iki fotoğrafı, çoğu ustaya ön fikir vermeye yeter.
2. **Lastiği boşaltma.** Hava kaçağı olup olmadığını usta tespit etsin.
3. **Dört jantı da göster.** Bir jantı boyatıp diğerlerinden farklı bırakmak, ilerde daha pahalıya patlar.
4. **Balans dahil mi diye sor.** Düzeltme sonrası balans alınmazsa titreme devam eder ve iş yarım kalır.

## Ne zaman ertelenmemeli?

Titreme, hava kaçağı ya da gözle görülür ezik varsa erteleme. Jant lastiği tutan parçadır; oradaki sorun doğrudan yol tutuşunu ve fren mesafesini etkiler.`,
  },
  {
    slug: "klima-sogutmuyor-nedenleri",
    title: "Araç Klimasi Soğutmuyor: 6 Neden ve Gaz Dolumu Ne Zaman Gerekir?",
    excerpt: "Klima üflüyor ama serinletmiyor mu? Her sorun gaz eksikliği değil. Önce nedenini anlayın, gereksiz gaz dolumuna para vermeyin.",
    tags: ["klima", "bakım", "yaz"],
    relatedServiceKey: "ac_service",
    body: `Klimanın soğutmaması ilk sıcak günde fark edilir ve akla gelen ilk çözüm "gaz doldurayım" olur. Oysa gaz eksikliği nedenlerden yalnızca biridir — üstelik gaz kendiliğinden bitmez, kaçak varsa biter.

## 1. Gerçekten gaz eksik olabilir

Klima gazı zamanla çok yavaş azalır (yılda küçük bir oran). Ama gaz aniden bitmişse bir kaçak vardır. Kaçağı bulmadan gaz doldurmak, parayı kısa sürede havaya vermektir. İyi bir servis önce kaçak testi yapar.

## 2. Polen filtresi tıkalı

En ucuz ve en sık atlanan neden. Hava akışı azaldığı için "soğutmuyor" hissi verir. Filtre kirliyse ayrıca kabinde küf kokusu olur.

## 3. Kompresör devreye girmiyor

Klimayı açtığında motor bölmesinden bir "klik" sesi gelmiyorsa kompresör kavraması çekmiyor olabilir. Sebebi elektriksel (sigorta, röle, basınç sensörü) ya da mekanik olabilir.

## 4. Kondenser kirli

Radyatörün önündeki ızgara benzeri parça. Böcek, yaprak ve çamurla tıkanırsa sistem ısıyı dışarı atamaz. Trafikte dururken soğutmayıp yolda soğutuyorsa bu güçlü bir ipucudur.

## 5. Kabin fanı zayıflamış

Fan kademeleri arasında fark azaldıysa ya da sadece son kademede üflüyorsa fan direnci arızalı olabilir.

## 6. Sistemde nem ve tıkanma

Uzun süre kullanılmayan klimalarda nem birikir, kurutucu doyar. Bu, hem soğutmayı düşürür hem kokuya yol açar.

## Gaz dolumu ne zaman mantıklı?

Kaçak testi yapıldıysa ve sistem sağlamsa. "Her yıl rutin gaz doldurmak" bir bakım kalemi değildir; sağlıklı bir klima yıllarca gaz istemez.

## Kokan klima ayrı bir konu

Serinletiyor ama kötü kokuyorsa sorun gazda değil, evaporatörde biriken küf ve bakteridedir. Bunun çözümü dezenfeksiyon ve polen filtresi değişimidir.

## Basit bir ön kontrol

Klimayı en soğuk kademede, iç hava sirkülasyonu açık şekilde çalıştır. Orta havalandırmadan gelen hava dış hava sıcaklığından belirgin biçimde serin değilse sisteme bakılmalıdır.`,
  },
  {
    slug: "motor-ariza-isigi-yandi-ne-yapmali",
    title: "Motor Arıza Işığı (Check Engine) Yandı: Ne Yapmalı, Yola Devam Edilir mi?",
    excerpt: "Sarı motor ikonu yandığında panik gereksiz ama görmezden gelmek pahalı. Işığın sabit mi yanıp sönen mi olduğu her şeyi değiştirir.",
    tags: ["motor", "arıza", "gösterge"],
    relatedServiceKey: "engine_diag",
    body: `Gösterge panelindeki sarı motor sembolü, aracın kendi kendini izleyen sisteminin (OBD) bir sapma yakaladığını söyler. Tek başına "motor bozuldu" demek değildir — ama "bir şeye bak" demektir.

## Önce şuna bak: sabit mi, yanıp sönüyor mu?

**Sabit yanıyor.** Genelde acil değildir. Aracı normal sürüşle servise götürebilirsin; ancak günlerce ertelemek arızayı büyütebilir.

**Yanıp sönüyor.** Bu ciddidir. Çoğunlukla yanmamış yakıtın egzoza gitmesi (tekleme) anlamına gelir ve katalitik konvertörü kalıcı biçimde tahrip edebilir — bu da en pahalı kalemlerden biridir. Güvenli bir yerde dur, aracı zorlamadan servise ulaştır.

## En sık karşılaşılan sebepler

- **Yakıt deposu kapağı gevşek.** Evet, gerçekten. Buhar kaçağı sistemi bunu arıza sayar. Kapağı sıkıca kapat, birkaç sürüş sonra ışık kendi sönebilir.
- **Oksijen (lambda) sensörü.** Yakıt tüketiminde artışla birlikte gelir.
- **Buji ve bobin.** Tekleme, titreme ve güç kaybı eşlik eder.
- **Hava akış sensörü kirli.** Rölantide düzensizlik yapar.
- **Katalitik konvertör.** Genelde ihmal edilmiş bir tekleme sorununun sonucudur.
- **EGR / turbo tarafı.** Dizellerde is birikmesiyle ilişkilidir.

## "Sildirdim, geçti" tuzağı

Arıza kodunu silmek ışığı söndürür ama sebebi ortadan kaldırmaz. Aynı koşullar oluştuğunda ışık geri gelir. Kod silmek bir tamir yöntemi değil, tamir sonrası son adımdır.

## Servise giderken işini kolaylaştır

- Işık ne zaman yandı, o sırada ne yapıyordun (soğuk çalıştırma, rampa, yüksek hız)?
- Yanında başka belirti var mı: güç kaybı, sarsıntı, koku, ses?
- Yakıt tüketimi değişti mi?

Bu üç cevap, arıza tespitinde ustanın yarı yolu almasını sağlar.

## Arıza tespiti neden ayrı bir iş?

Cihaza takıp kod okumak dakikalar sürer; asıl iş o kodun hangi parçayı işaret ettiğini doğrulamaktır. Aynı kod farklı araçlarda farklı nedenlere çıkabilir. Bu yüzden "kod okuma" ile "arıza tespiti" aynı şey değildir.`,
  },
  {
    slug: "direksiyon-titriyor-rot-balans",
    title: "Direksiyon Titriyor: Rot mu, Balans mı, Fren mi?",
    excerpt: "Titremenin hangi hızda ve hangi anda olduğu, sorunun nerede olduğunu söyler. Üç farklı titreme, üç farklı iş.",
    tags: ["rot balans", "süspansiyon", "lastik"],
    relatedServiceKey: "wheel_alignment",
    body: `Direksiyon titremesi tek bir arıza değil, bir belirtidir. Doğru yere bakmak için titremenin **ne zaman** olduğuna dikkat etmek gerekir.

## Belirli bir hızda titriyorsa (genelde 90–120 km/s)

Klasik **balans** sorunudur. Tekerlek dönerken ağırlık dağılımı eşit değildir. Balans ağırlığı düşmüş olabilir ya da lastik değişiminden sonra balans alınmamıştır. En ucuz ve en hızlı çözülen titremedir.

## Sadece fren yaparken titriyorsa

**Fren diski** çarpıklığına işaret eder. Disk yüzeyi ısınma-soğuma döngüleriyle deforme olmuştur. Balata değişimiyle birlikte diskin de değerlendirilmesi gerekir.

## Her hızda var ve araç yana çekiyorsa

**Rot ayarı (aks ayarı)** bozulmuş olabilir. Belirtileri: düz yolda direksiyonu bırakınca araç bir tarafa kayar, direksiyon simidi düz giderken eğri durur, lastikler tek taraftan aşınır.

## Rölantide, dururken titriyorsa

Bu direksiyon değil **motor takozu** kaynaklı olabilir. Vitesi boşa aldığında titreme azalıyorsa bu ihtimal güçlenir.

## Rot ayarı ne zaman yapılmalı?

- Lastik değişiminden sonra
- Süspansiyon parçası (rotil, salıncak, amortisör) değiştikten sonra
- Sert bir çukur veya kaldırım darbesinden sonra
- Lastiklerde düzensiz aşınma fark edildiğinde

Rutin bir takvimi yoktur; olayla tetiklenir.

## Neden ertelenmemeli?

Bozuk rot ayarı lastiği hızla ve düzensiz aşındırır. Birkaç bin kilometre içinde bir takım lastiği bitirmek, ayar bedelinin kat kat üzerindedir. Ayrıca yol tutuşu ve fren mesafesi olumsuz etkilenir.`,
  },
  {
    slug: "aku-bitti-mi-belirtileri-omru",
    title: "Akü Bitti mi? 5 Belirti ve Akü Ömrü Gerçekte Kaç Yıl?",
    excerpt: "Sabah çalışmayan araç her zaman akü demek değil. Aküyü değiştirmeden önce bakılması gerekenler ve ömrü kısaltan alışkanlıklar.",
    tags: ["akü", "elektrik", "kış"],
    relatedServiceKey: "battery",
    body: `Akü, aracın en sessiz sarf malzemesidir: yıllarca sorun çıkarmaz, sonra bir sabah hiç uyarmadan bırakır. Ama aslında uyarır — sadece belirtileri fark etmek gerekir.

## 5 belirti

1. **Marş yavaşladı.** Çalıştırırken motorun dönüşü ağırlaşmışsa en net işaret budur.
2. **Farlar rölantide sararıyor.** Gaz verince toparlıyorsa şarj sistemi zorlanıyordur.
3. **Uzun duruştan sonra çalışmıyor.** Birkaç gün duran araç çalışmıyorsa akü şarj tutmuyordur.
4. **Elektronikler tuhaflaştı.** Ekranın sıfırlanması, cam-kapı motorlarının yavaşlaması.
5. **Akü kutup başlarında beyaz-mavi tortu.** Bağlantı direnci artmıştır; bazen sadece temizlik bile işe yarar.

## Ömrü kaç yıl?

Genel aralık **3–5 yıl**dır, ama bu rakam kullanım biçimine göre ciddi biçimde değişir:

- **Kısa mesafe şehir içi kullanım ömrü kısaltır.** Akü, marşta harcadığını geri kazanamaz.
- **Aşırı sıcak, soğuktan daha yıpratıcıdır.** Sıcak elektrolit buharlaşmasını hızlandırır; soğuk ise zaten zayıflamış aküyü ele verir. Yani akü yazın yorulur, kışın bırakır.
- **Uzun süre çalıştırılmayan araç.** Duran araçta akü yavaşça boşalır ve derin deşarj kalıcı hasar bırakır.

## Aküyü değiştirmeden önce bakılacaklar

Sorun her zaman akü değildir:

- **Alternatör (şarj dinamosu)** şarj etmiyorsa yeni akü de kısa sürede biter.
- **Kaçak akım:** araç kapalıyken bir tüketici kapanmıyorsa akü gece boyunca boşalır.
- **Kutup başı gevşekliği veya oksit.**

İyi bir serviste akü değişimi öncesi hem akü hem şarj sistemi test edilir. Test yapılmadan yapılan değişim, aynı sorunun birkaç ay sonra tekrar etmesi anlamına gelebilir.

## Doğru akü hangisi?

Kapasite (Ah) ve marş akımı (CCA) değerleri araç üreticisinin belirlediği değerlerin altına düşmemeli. Start-stop sistemli araçlar özel tip (EFB/AGM) akü ister; normal akü takmak hem kısa ömürlü olur hem sistemi zorlar.`,
  },
  {
    slug: "triger-kayisi-ne-zaman-degisir",
    title: "Triger Kayışı Ne Zaman Değişir? Kopunca Ne Olur?",
    excerpt: "Triger, ertelenince en pahalıya patlayan bakımdır. Değişim aralığı, kopmanın sonucu ve set halinde değişimin neden şart olduğu.",
    tags: ["triger", "motor", "periyodik bakım"],
    relatedServiceKey: "timing_belt",
    body: `Triger kayışı, motorun üst ve alt kısmını senkronize eden parçadır. Görevi basit ama kritiktir: pistonlar ile supapların birbirine çarpmadan çalışmasını sağlar.

## Kopunca ne olur?

Çoğu modern motorda triger koptuğu anda supaplar pistonlarla çarpışır. Sonuç: silindir kapağı hasarı, eğilen supaplar, bazen piston ve motor bloğu hasarı. Yani birkaç bin liralık bir bakım kalemi, ertelendiğinde motorun tamamını riske atar.

Bu yüzden triger, "bozulunca değiştirilen" değil, **süre dolunca değiştirilen** bir parçadır.

## Değişim aralığı

Üretici kitapçığı esastır. Genel eğilim **60.000–120.000 km** ya da **4–6 yıl** aralığındadır; hangisi önce dolarsa o geçerlidir. Yılda az kilometre yapan araçlarda süre şartı öne çıkar — kayış kullanılmasa da yaşlanır, sertleşir ve çatlar.

## Neden "set" halinde değişir?

Triger seti genelde şunları içerir: kayış, gergi rulmanı, avare rulman ve çoğu motorda devirdaim (su pompası).

Sadece kayışı değiştirip rulmanları bırakmak yaygın bir yanlıştır. Rulman sıkışırsa kayış yine kopar ve aynı hasar oluşur — üstelik bu kez işçiliği ikinci kez ödemiş olursun. Devirdaim de aynı bölgede olduğu için, ayrı zamanda değiştirmek aynı işçiliği tekrar ödemek demektir.

## Zincirli motorlarda durum

Bazı motorlarda kayış yerine zincir vardır. Zincir genelde "motor ömrü boyunca" tasarlanır ama sonsuz değildir: gergi ve kızak plastikleri yıpranır. Soğuk çalıştırmada gelen tıkırtı sesi zincir gerginliğinin bozulduğunun tipik işaretidir.

## Servise giderken sor

- Set halinde mi değişiyor, hangi parçalar dahil?
- Devirdaim dahil mi?
- İşlem sonrası motor zamanlaması nasıl doğrulanıyor?

Bu üç soru, işin doğru yapılıp yapılmadığını anlamanın en pratik yoludur.`,
  },
  {
    slug: "arac-muayenesinden-gecmek-icin-kontrol-listesi",
    title: "Araç Muayenesinden Geçmek İçin Kontrol Listesi",
    excerpt: "Muayeneden kalmaların büyük kısmı basit ve ucuz sebeplerden. Randevudan önce yarım saatte yapabileceğin kontroller.",
    tags: ["muayene", "kontrol", "yasal"],
    relatedServiceKey: "pre_inspection",
    body: `Muayeneden kalmak çoğu zaman ciddi bir arızadan değil, önceden bakılsa dakikalar süren şeylerden kaynaklanır. Randevudan önceki yarım saat, ikinci kez sıraya girmekten çok daha ucuzdur.

## Aydınlatma

En sık kalma sebeplerinden biri. Tüm lambaları tek tek kontrol et: kısa ve uzun far, sinyaller, dörtlü, fren lambaları (üçüncü stop dahil), geri vites lambası, plaka lambası, sis farları.

Fren lambasını tek başına kontrol etmek zordur — birinden pedala basmasını iste ya da aracı bir cama yanaştır.

## Far ayarı

Yüksek ayarlı far karşıdan geleni kör eder ve muayenede takılır. Ampul değişiminden veya süspansiyon işleminden sonra far ayarı kayabilir.

## Lastikler

Diş derinliği yasal sınırın altına düşmemeli (Türkiye'de 1,6 mm). Yan duvarda çatlak, balon veya kesik olmamalı. Dört lastiğin de aynı ebatta olması gerekir.

## Fren ve süspansiyon

Fren dengesizliği ve süspansiyon boşluğu test cihazında ölçülür. Fren yaparken araç yana çekiyorsa ya da tümsekte "gıcırtı/tak" sesi geliyorsa muayeneden önce baktır.

## Egzoz emisyonu

Motor arıza ışığı yanıyorsa emisyon testinden kalma ihtimali yüksektir. Ayrıca egzozda delik/kaçak varsa hem ses hem ölçüm sorun çıkarır.

## Cam ve silecek

Ön camda sürücü görüş alanındaki çatlak kalma sebebidir. Silecek lastikleri silme performansını karşılamalı, cam suyu fıskiyeleri çalışmalı.

## Gösterge panelinde yanan uyarılar

Airbag, ABS ve motor arıza uyarıları muayenede doğrudan sorun yaratır.

## Evrak ve donanım

Ruhsat, zorunlu trafik sigortası, egzoz pulu; ayrıca reflektör, yangın söndürücü, ilk yardım çantası ve çekme halatı.

## Pratik yaklaşım

Muayene öncesi kontrol, bir ustanın 20–30 dakikada yaptığı bir iştir ve kalıp yeniden gitmekten hem ucuz hem hızlıdır. Özellikle aracı yeni aldıysan ya da uzun süredir bakımı yapılmadıysa bu adımı atlama.`,
  },
  {
    slug: "yag-degisimi-kac-kmde-yapilir",
    title: "Yağ Değişimi Kaç Km'de Yapılır? 10.000 mi, 15.000 mi?",
    excerpt: "Tek bir doğru rakam yok. Motor tipi, yağ sınıfı ve nasıl kullandığın aralığı değiştiriyor. Süre şartını atlamak en sık yapılan hata.",
    tags: ["yağ değişimi", "periyodik bakım", "motor"],
    relatedServiceKey: "oil_change",
    body: `"Kaç kilometrede bir yağ değişir?" sorusunun tek cevabı yok, çünkü aralığı üç şey birlikte belirliyor: motor, yağ ve kullanım biçimi.

## Genel aralıklar

- **Benzinli:** çoğunlukla 10.000–15.000 km
- **Dizel:** çoğunlukla 15.000–20.000 km
- **Süre şartı:** kilometre dolmasa bile genelde **12 ay**

Kesin rakam araç kitapçığında yazar; üreticinin verdiği aralık esastır.

## Süre şartı neden önemli?

En sık atlanan kural bu. Yılda 6.000 km yapan bir araçta "daha 15.000'e çok var" diye 3 yıl beklemek yanlıştır. Yağ yalnızca sürtünmeden değil, **zamanla ve yanma artıklarıyla** da bozulur: asitlenir, nem tutar, katık paketi tükenir.

## "Zorlu kullanım" seni de kapsıyor olabilir

Üreticiler kısa aralık öneren bir "zorlu kullanım" tanımı yapar ve çoğu sürücü farkında olmadan bu tanıma girer:

- Sürekli kısa mesafe (motorun tam ısınmadığı sürüşler)
- Yoğun dur-kalk trafiği
- Çok tozlu ortam
- Römork/karavan çekme
- Aşırı sıcak veya soğuk iklim

Bu koşullardaki bir araçta üst sınırı beklemek yerine aralığı kısaltmak mantıklıdır.

## Yağ sınıfı uydurulmaz

Motor, üreticinin belirlediği viskozite (ör. 5W-30) ve onay standardını ister. "Daha pahalı yağ daha iyidir" doğru değildir; **doğru** yağ iyidir. Yanlış sınıf yağ, özellikle partikül filtreli dizellerde filtreye zarar verebilir.

## Filtre her seferinde değişir

Yağ filtresi yağla birlikte değişir. Eski filtreyle yeni yağ, ilk günden kirlenmiş yağ demektir. Hava ve polen filtresi de aynı bakımda kontrol edilir.

## Değişimden sonra

Birkaç gün yağ seviyesini ve altında damlama olup olmadığını kontrol et. Sızıntı genelde tapa contası ya da filtre oturmasından kaynaklanır ve erken fark edilirse basit bir düzeltmedir.`,
  },
  {
    slug: "debriyaj-kaciriyor-belirtileri",
    title: "Debriyaj Kaçırıyor mu? Belirtileri ve Ömrünü Uzatan Alışkanlıklar",
    excerpt: "Devir yükseliyor ama araç hızlanmıyorsa debriyaj kaçırıyordur. Test etmenin basit yolu ve değişimde nelere dikkat etmeli.",
    tags: ["debriyaj", "şanzıman", "sürüş"],
    relatedServiceKey: "clutch",
    body: `Debriyaj, motorun gücünü şanzımana ileten sürtünme elemanıdır. Balata gibi bir sarf malzemesidir ve ömrü büyük ölçüde sürüş alışkanlığına bağlıdır.

## En net belirti: devir artıyor, hız artmıyor

Yokuşta ya da hızlanırken motor devri yükseliyor ama araç aynı oranda hızlanmıyorsa debriyaj kaçırıyordur.

## Basit test

Düz bir yerde el frenini çek, 3. vitese al ve debriyajı yavaşça bırakarak hafif gaz ver. Sağlam bir debriyajda motor boğulur ve stop eder. Motor çalışmaya devam ediyorsa balata kaçırıyordur.

Bu testi kısa tut — uzatmak debriyajı gereksiz yıpratır.

## Diğer belirtiler

- **Pedal kavrama noktasının yükselmesi:** debriyaj ancak pedalın en üstünde tutuyorsa balata incelmiştir.
- **Yanık kokusu:** özellikle rampada zorlandıktan sonra.
- **Titreme (kalkışta sarsıntı):** baskı balatasının düzgün tutmaması.
- **Vites geçmeme:** hidrolik/pedal mekanizması ya da baskı kaynaklı olabilir.
- **Debriyaja basınca gelen ses:** rulman aşınmasının tipik işareti.

## Ömrünü kısaltan alışkanlıklar

- **Ayağı debriyaj pedalında tutmak.** Sürekli hafif basınç, balatayı sürekli aşındırır.
- **Rampada debriyajla tutmak.** El freni için var; debriyaj için değil.
- **Vitesi boşa almadan trafik ışığında beklemek.**
- **Yüksek devirde ani kalkış.**

## Değişimde ne yapılır?

Debriyaj seti bir bütündür: balata, baskı ve rulman birlikte değişir. Şanzıman zaten indirileceği için, **volan yüzeyinin durumu** da aynı işlemde değerlendirilmelidir. Çift kütleli volanlı araçlarda volan ayrı ve pahalı bir kalemdir; ustaya baştan sormak sürpriz fatura riskini azaltır.

İşçilik yüksek olduğu için ikinci kez sökmek istemezsin — bu yüzden "sadece balatayı değiştirelim" teklifi genelde ekonomik değildir.`,
  },
  {
    slug: "kis-lastigi-ne-zaman-takilir",
    title: "Kış Lastiği Ne Zaman Takılır? 7 Derece Kuralı ve Diş Derinliği",
    excerpt: "Takvim değil sıcaklık belirler. 7 derece kuralı, diş derinliği sınırları ve lastik saklamanın doğru yolu.",
    tags: ["lastik", "kış", "güvenlik"],
    relatedServiceKey: "tire_change",
    body: `Kış lastiği kararını takvim değil sıcaklık verir. Yaygın kural şudur: ortalama hava sıcaklığı **7 °C'nin altına** düştüğünde yaz lastiğinin kauçuğu sertleşir ve yol tutuşu kar olmasa bile azalır.

## Neden 7 derece?

Yaz lastiği yüksek sıcaklıkta esnek kalacak şekilde tasarlanır. Soğukta sertleşir, temas yüzeyi azalır ve fren mesafesi uzar. Kış lastiği ise düşük sıcaklıkta yumuşak kalan bir karışım kullanır. Yani kış lastiği sadece kar için değil, **soğuk** için vardır.

## Diş derinliği

- **Yaz lastiği yasal alt sınır:** 1,6 mm
- **Kış lastiğinde etkili performans:** genelde 4 mm'nin altına düşünce belirgin biçimde azalır

Sınırda olmak "geçer" demektir, "güvenli" demek değildir. Islak zeminde su tahliyesi doğrudan diş derinliğine bağlıdır.

## Dördü birden

İki lastiği kış, iki lastiği yaz kullanmak dengesiz tutuş yaratır ve özellikle virajda tehlikelidir. Dördü de aynı tip olmalıdır.

## Lastik yaşı

Diş derinliği yeterli olsa bile kauçuk yaşlanır. Yan duvardaki DOT kodunun son dört hanesi üretim haftası ve yılını verir (ör. "3223" → 2023'ün 32. haftası). 5–6 yaşını geçmiş lastikler, az kullanılmış olsalar bile değerlendirilmelidir.

## Saklama

Sökülen lastikleri serin, kuru ve güneş görmeyen bir yerde sakla. Jantlı lastikler yatay istiflenebilir veya asılabilir; jantsız lastikler dik durmalı ve arada bir çevrilmelidir.

Yerin yoksa çoğu lastikçi "lastik oteli" hizmeti verir; bu, balkonda güneşte bekleyen lastikten hem daha güvenli hem yer açıcıdır.

## Değişimde balans

Lastik değişiminden sonra balans alınmalıdır. Alınmazsa belirli hızlarda direksiyon titremesi olur ve lastik düzensiz aşınır.`,
  },
  {
    slug: "dpf-partikul-filtresi-temizligi",
    title: "DPF (Partikül Filtresi) Dolu Uyarısı: Temizlik mi, Değişim mi?",
    excerpt: "Dizel araçlarda en pahalı sürprizlerden biri. Filtre neden dolar, şehir içi kullanım neden hızlandırır ve iptal etmek neden kötü fikir?",
    tags: ["dpf", "dizel", "egzoz"],
    relatedServiceKey: "dpf_clean",
    body: `Dizel partikül filtresi (DPF), egzozdaki kurumu tutan bir süzgeçtir. Zamanla dolar ve kendini temizler; bu işleme **rejenerasyon** denir.

## Rejenerasyon nasıl olur?

Araç, egzoz sıcaklığını yükselterek filtredeki kurumu yakar. Bunun için genelde belirli bir hızda, belirli bir süre kesintisiz sürüş gerekir. Sürekli kısa mesafe şehir içi kullanımda araç bu koşulu hiç yakalayamaz — filtre dolmaya devam eder.

Bu yüzden DPF sorunları en çok "şehirde kısa mesafe kullanılan dizel" araçlarda görülür.

## Uyarı geldiğinde ne yapmalı?

İlk uyarıda çoğu araç için önerilen şey, uygun ve güvenli bir yolda bir süre sabit hızda sürmektir; bu, rejenerasyonu tamamlamaya yeter. Uyarıyı görmezden gelip kısa sürüşlere devam etmek, filtreyi kendi kendini temizleyemeyeceği noktaya taşır.

## Temizlik mi, değişim mi?

- **Zorlu (forced) rejenerasyon:** serviste cihazla tetiklenen temizlik. Filtre henüz aşırı dolmadıysa çözüm olur.
- **Sökülüp yıkama:** filtre çıkarılıp özel makinede temizlenir. Orta seviyedeki tıkanmalarda etkilidir.
- **Değişim:** filtre yapısal olarak zarar gördüyse (erimiş/çatlamış hücreler) tek seçenektir ve pahalıdır.

## DPF iptali neden kötü fikir?

Kısa vadede ucuz görünür ama:

- Egzoz emisyon testinden geçemezsin, muayene sorunu olur.
- Yasal olarak sorunludur.
- Araç değerini düşürür; ekspertizde görülür.
- Yağa karışan kurum artar, motor ömrünü olumsuz etkiler.

## Filtreyi yoran şeyler

- Sık kısa mesafe kullanım
- Yanlış sınıf motor yağı (düşük küllü olmayan yağlar DPF'yi hızla doldurur)
- Çözülmemiş enjektör/turbo arızaları — bunlar aşırı kurum üretir

DPF sorununun altında çoğu zaman başka bir arıza yatar. Yalnızca filtreyi temizletip nedeni bırakmak, aynı yere birkaç ay sonra geri dönmek demektir.`,
  },
  {
    slug: "cam-catlagi-tamiri-mi-degisim-mi",
    title: "Ön Cam Çatlağı: Tamir mi Edilir, Değişmesi mi Gerekir?",
    excerpt: "Taş sıçradı, küçük bir yıldız oluştu. Hangi boyuta kadar tamir edilir, neden beklememek gerekir ve sürüş asistanı olan araçlarda ek adım nedir?",
    tags: ["cam", "kaporta", "güvenlik"],
    relatedServiceKey: "glass_repair",
    body: `Ön cama taş sıçraması yaygındır ve ilk andaki küçük iz genelde tamir edilebilir. Sorun, beklemekle büyümesidir.

## Tamir edilebilir mi?

Kabaca şu koşullar aranır:

- Hasar **sürücünün doğrudan görüş alanında değilse**
- Çapı yaklaşık **bir madeni para büyüklüğünü aşmıyorsa**
- Camın **kenarına yakın değilse** (kenar hasarı yayılmaya çok müsaittir)
- **Cam iç katmanına** ulaşmamışsa

Bu koşullar sağlanıyorsa reçine dolgu ile tamir edilir; işlem kısa sürer ve camın yapısal bütünlüğünü geri kazandırır.

## Neden beklememeli?

Küçük yıldız, sıcaklık değişimi ve yol titreşimiyle çizgi hâlinde uzar. Bir kez uzamaya başladıktan sonra tamir şansı biter, değişim zorunlu hale gelir. Özellikle:

- Soğuk sabahta cama sıcak su dökmek
- Klimayı doğrudan cama üflemek
- Sert çukurlardan geçmek

çatlağı hızla büyütür.

## Değişim gerekiyorsa

- **Orijinal veya eşdeğer cam** tercih edilmeli; kalınlık ve optik kalite fark yaratır.
- **Kurulama süresi** var: yapıştırıcının tutması için araç belirli bir süre bekletilmelidir. Ustaya "ne zaman kullanabilirim" diye sor.
- **Su testi** yapılmalı; sızdırma kontrolü işin parçasıdır.

## Sürüş asistanı olan araçlarda ek adım

Şeritte kalma, adaptif hız sabitleyici ve otomatik acil fren gibi sistemlerin kamerası çoğunlukla ön cama bakar. Cam değiştikten sonra bu kameranın **kalibrasyonu** yapılmalıdır.

Kalibrasyon yapılmazsa sistem yanlış çalışabilir — üstelik bu, gösterge panelinde uyarı vermeden gerçekleşebilir. Cam değişimi teklifi alırken kalibrasyonun dahil olup olmadığını mutlaka sor.`,
  },
  {
    slug: "tamirci-icin-musteri-bulma-rehberi",
    title: "Tamirciler İçin: Dijitalde Müşteri Bulmanın 6 Yolu",
    excerpt: "İşletmen iyi iş çıkarıyor ama yeni müşteri hep tanıdıktan geliyorsa, dijital görünürlükte eksik var demektir. Somut ve uygulanabilir adımlar.",
    tags: ["tamirci", "işletme", "dijital"],
    relatedServiceKey: null,
    body: `Servis işinde iş kalitesi tek başına yetmiyor: müşteri seni bulamıyorsa iyi iş çıkarman görünmez kalıyor. Aşağıdakiler pazarlama teorisi değil, doğrudan uygulanabilir adımlar.

## 1. Hizmet listeni eksiksiz gir

Müşteri "tamirci" diye değil, **"fren balata değişimi"**, **"klima gazı dolumu"**, **"jant düzeltme"** diye arıyor. Yaptığın işleri tek tek listelemezsen o aramalarda çıkmıyorsun. Bu, en az emek isteyen ve en çok etki eden adımdır.

## 2. Fiyatı görünür yap

Fiyat vermemek müşteriyi korumaz, rakibe yollar. Sabit fiyatlı verebildiğin işleri sabit fiyatlı işaretle; değişkenleri "ekspertiz sonrası" olarak bırak. Şeffaflık, telefonda geçen zamanı da azaltır.

## 3. Markaya göre fiyat farkını yaz

Aynı iş her araçta aynı sürmüyor. Premium bir modelde iki kat işçilik isteyen bir işe tek fiyat yazmak ya seni zarara sokar ya müşteriyi hayal kırıklığına uğratır. Marka bazlı fiyat girmek ikisini de önler.

## 4. Çalışma saatlerini doğru gir

"Şu an açık" filtresi çok kullanılır. Saatlerin eksikse o filtrede hiç görünmezsin. Öğle arası veya kapalı gün varsa bunu da işaretle — gelip kapalı bulan müşteri geri gelmez.

## 5. Yorum iste, yorumlara cevap ver

İş biter bitmez istenen yorum, bir hafta sonra istenenden çok daha yüksek oranda geliyor. Olumsuz yorumu silmeye çalışmak yerine altına sakin ve açıklayıcı bir cevap yazmak, yeni müşteride en çok güven oluşturan şeydir.

## 6. Profilini tamamla

Kapak fotoğrafı, ekip, adres, telefon, ödeme yöntemleri. Eksik profil, arama sonuçlarında dolu profilin arkasında kalır — çünkü müşteri de eksik bilgiye tıklamaz.

## Ölçmeden ilerleme olmaz

Kaç kişi profilini gördü, kaç kişi mesaj attı, kaç kişi randevu aldı? Bu üç sayı arasındaki düşüşün nerede olduğu, neyi düzeltmen gerektiğini söyler. Görüntülenme çoksa ama randevu azsa sorun görünürlükte değil, profilin ikna ediciliğindedir.`,
  },
];
