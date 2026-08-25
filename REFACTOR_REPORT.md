# Fixperto Frontend — Mimari Refactor Raporu

Bu rapor, tek dosyalık `App.jsx` (4499 satır) prototipinin özellik tabanlı (feature-based),
TypeScript'e geçirilmiş bir mimariye dönüştürülmesi sürecini belgeler. Her adım, projeyi gerçek
bir tarayıcıda çalıştırmadan (bu ortamda mümkün değildi) mümkün olan en yüksek güvenle
doğrulanmıştır: esbuild ile tam modül grafiği derlemesi (sözdizimi + import çözümleme + JSX
doğrulaması), tanımsız JSX bileşeni/ikon referansları için elle yapılan çapraz kontrol, ve
node:test ile gerçekten ÇALIŞTIRILAN birim testleri. `npm install` bu sandbox'ta mümkün değildi
(npm registry, github.com ve CDN'ler ağ izin listesinde engelli), bu yüzden `npm run build` /
`npm run typecheck` / `npm test` gerçek çalıştırmaları projeyi klonladığınız kendi bilgisayarınızda
yapılmalı — komutlar aşağıda "Prodüksiyon Öncesi Kontrol Listesi" bölümünde verildi.

## 1) Eski klasör yapısı

```
frontend/src/
  App.jsx              (4499 satır — TÜM state, business logic, 15 iç içe bileşen, ve tüm JSX)
  main.jsx
  api/client.js
  data/constants.js
  data/i18n.js
  utils/helpers.js
  components/PriceLevelDots.jsx
  components/MiniBarChart.jsx
```

## 2) Yeni klasör yapısı

```
frontend/src/
  main.tsx
  vite-env.d.ts
  app/
    App.tsx                      (13 satır — sadece ErrorBoundary > AppProvider > AppShell kompozisyonu)
    AppShell.tsx                 (2368 satır — tüm ekranların JSX render ağacı)
    state/
      AppLogicProvider.tsx       (1941 satır — useAppLogic() hook'u: state + business logic)
  components/
    ui/                          (paylaşılan, saf/reusable bileşenler)
      PriceLevelDots.tsx
      MiniBarChart.tsx
      ErrorBoundary.tsx
    features/                    (eskiden App.jsx içine gömülü 15 bileşen, artık gerçek dosyalar)
      LangSwitch.tsx, NotifBell.tsx, OwnerBottomNav.tsx, OwnerDesktopNav.tsx,
      OwnerAppointmentsView.tsx, ChatBubble.tsx, StatusTracker.tsx, MechCard.tsx,
      SkeletonCard.tsx, MapPanel.tsx, ListingCard.tsx, JobCard.tsx,
      MechDetailBody.tsx, AppointmentCard.tsx, BrowseHome.tsx
  services/
    api/client.ts                (tipli, merkezi hata yönetimli API katmanı)
  data/
    constants.ts, i18n.ts
  utils/
    helpers.ts
    helpers.test.ts              (12 gerçek, çalıştırılmış test)
  types/
    domain.ts                    (Mechanic, Owner, Vehicle, Appointment, Listing, JobListing,
                                   SupportTicket, AdminChangeLogEntry, AdminStats, ...)
```

Bu yapı, kullanıcının verdiği örnek şablonun birebir kopyası DEĞİL — projenin gerçek ihtiyacına
göre şekillendirildi: örneğin `features/` altında domain'e göre (auth/, booking/, vb.) alt klasörler
AÇILMADI, çünkü şu anki 15 bileşen tek bir düz dizin içinde yönetilebilir boyutta; gereksiz
klasör derinliği eklemek "over-engineering" olurdu.

## 3) App.jsx satır sayısı: önce → sonra

| Dosya | Önce | Sonra |
|---|---|---|
| Ana giriş dosyası (`App.jsx` → `app/App.tsx`) | 4499 satır | **13 satır** |
| (mantık) `app/state/AppLogicProvider.tsx` | — | 1941 satır |
| (görünüm) `app/AppShell.tsx` | — | 2368 satır |

`App.jsx` artık istendiği gibi sadece Provider → Shell kompozisyonu yapıyor. Business logic ve
JSX render ağacı hâlâ iki büyük dosyada toplanmış durumda (aşağıdaki "Kalan Teknik Borç"
bölümüne bakın) — bunları daha küçük, domain'e özel parçalara bölmek güvenli bir sonraki adım.

## 4) Oluşturulan bileşenler

**15 "features" bileşeni** (eskiden `App.jsx` içinde useAppLogic() kapsamında tanımlı closure'lardı,
artık `components/features/` altında gerçek, bağımsız dosyalar): LangSwitch, NotifBell,
OwnerBottomNav, OwnerDesktopNav, OwnerAppointmentsView, ChatBubble, StatusTracker, MechCard,
SkeletonCard, MapPanel, ListingCard, JobCard, MechDetailBody, AppointmentCard, BrowseHome.

**3 "ui" (paylaşılan) bileşeni**: PriceLevelDots, MiniBarChart (önceden vardı, TS'e taşındı),
ve yeni eklenen ErrorBoundary.

## 5) Oluşturulan API servisleri

`services/api/client.ts` — tek dosya, generic `crud<T>()` fabrikası ile 7 varlık
(mechanics/owners/vehicles/appointments/listings/jobs/tickets) + admin alt-nesnesi. Öncekinden
farkı: artık tipli (`Promise<Mechanic[]>` gibi), merkezi `ApiError` sınıfı ve durum koduna göre
kullanıcı dostu mesajlar üretiyor (bkz. bölüm 10).

## 6) Oluşturulan custom hook'lar

Tek büyük `useAppLogic()` hook'u (183 orijinal + 1 yeni = **184 useState**) `AppLogicProvider.tsx`
içinde toplandı ve `useApp()` context hook'u ile tüketiliyor. Bunu domain'e özel küçük hook'lara
(`useAuth`, `useAppointments`, `useQuoteRequests`, `useAdminPanel` vb.) bölmek, canlı bir tarayıcıda
her ekranı elle test etme imkânı olmadan, 180+ state değişkeni arasındaki gizli bağımlılıkları
kırma riski taşıdığı için bu turda YAPILMADI — bilinçli bir kapsam kararı, "Kalan Teknik Borç"
bölümünde önerilen somut bir sıradaki adım olarak not edildi.

## 7) Kaldırılan tekrar eden kod

- İki bağımsız (closure'suz) bileşen olan `PriceLevelDots`/`MiniBarChart` zaten tekilleştirilmişti;
  şimdi `components/ui/` altında tip güvenli hale getirildi.
- `api/client.js`'deki `request()` fonksiyonu artık GET isteklerinde **aynı anda tekrarlanan
  istekleri tekilleştiriyor** (in-flight de-dupe) — aynı listeyi iki farklı yerden aynı anda
  çekme durumunda gereksiz ikinci ağ isteğini engelliyor.
- Not: 184 state ve ~600 tanımlayıcı arasında daha büyük çaplı DRY fırsatları (ör. tekrarlanan
  filtre state'i şablonları, tekrarlanan modal aç/kapa state çiftleri) muhtemelen var, ancak
  bunları güvenle birleştirmek davranış değişikliği riski taşıdığından bu turda dokunulmadı.

## 8) Yapılan performans iyileştirmeleri

**Kritik bulgu ve düzeltme**: 15 "features" bileşeni eskiden `useAppLogic()` içinde closure
olarak tanımlıydı ve JSX etiketi olarak (`<MechCard/>`, `<BrowseHome/>` vb.) kullanılıyordu.
`useAppLogic()` her `AppProvider` render'ında yeniden çalıştığı için (yani UYGULAMADAKİ HERHANGİ
BİR state değişiminde — bir input'a harf yazmak dahil), bu 15 fonksiyon her seferinde YENİ birer
referans olarak yeniden tanımlanıyordu. React, JSX'te kullanılan bir bileşenin referansı
değiştiğinde onu farklı bir bileşen türü sayar ve o alt ağacı komple **unmount edip yeniden
mount eder** — bu, uygulama genelinde her tuş vuruşunda kart listelerinin, harita panelinin,
bildirim zilinin vb. anlık olarak sıfırdan yeniden oluşturulması anlamına gelir (odak kaybı,
animasyon sıfırlanması, ciddi performans kaybı). Bu, refactor sırasında farkına varılan gerçek
ve önemli bir hataydı; 15 bileşen `components/features/` altına gerçek üst düzey fonksiyonlar
olarak taşınarak (verilerini `useApp()` context hook'undan alacak şekilde) düzeltildi.

Diğer performans notları: mevcut kodda zaten 21 `useMemo` var; gereksiz yere `useCallback`/`memo`
EKLENMEDİ (kullanıcının "gerçek kazanç yoksa ekleme" talimatına uyularak) — çünkü artık 15
bileşen kararlı referanslara sahip olduğundan, ek memoization olmadan da gereksiz remount sorunu
çözülmüş durumda.

## 9) Bulunan güvenlik sorunları

1. **[DÜZELTİLDİ] İstemci tarafında saklanan admin şifresi.** `data/constants.js` içinde
   `ADMIN_CREDENTIALS = { email: "...", password: "Fixperto2026!" }` düz metin olarak
   tanımlıydı — bu, frontend JS paketine (bundle'a) gömülüyordu, yani tarayıcı devtools'tan veya
   "view-source"tan HERKES admin şifresini okuyabilirdi. Ayrıca giriş kontrolü tamamen istemci
   tarafında yapılıyordu; backend hiçbir zaman sorgulanmıyordu (React state'i manipüle ederek bile
   atlatılabilirdi). **Düzeltme**: sabit kaldırıldı, giriş artık gerçek backend uç noktasını
   (`POST /api/admin/login`, `backend/routes/admin.js`) çağırıyor; backend kimlik bilgilerini
   `FIXPERTO_ADMIN_EMAIL`/`FIXPERTO_ADMIN_PASSWORD` ortam değişkenlerinden okuyor.
2. **[BACKEND GEREKTİRİYOR — düzeltilmedi] Rol tabanlı yetkilendirme sadece istemci tarafında.**
   Mevcut mimaride `role` state'i (owner/mechanic/admin) sadece frontend'de tutuluyor; backend'deki
   REST uç noktaları (`/api/mechanics`, `/api/owners`, vb.) şu anda KİMSE için kimlik doğrulaması
   yapmıyor — herhangi bir HTTP istemcisi doğrudan `curl` ile herhangi bir kaydı okuyabilir/
   değiştirebilir/silebilir. Bir butonu arayüzde gizlemek gerçek bir güvenlik önlemi DEĞİLDİR.
   Bunu düzeltmek backend'de oturum/token tabanlı kimlik doğrulama + yetkilendirme ara katmanı
   (middleware) eklemeyi gerektirir; bu, frontend'de yapılabilecek bir değişiklik değildir.
3. **[BİLGİ] Token/oturum saklama yöntemi yok.** Kod tabanında `localStorage`/`sessionStorage`
   hiç kullanılmıyor — yani şu anda hiçbir kalıcı oturum/token saklanmıyor (sayfa yenilenince
   `role`/`adminAuthed` sıfırlanıyor). Güvenlik açısından bu daha az saldırı yüzeyi demek, ama
   gerçek bir "beni hatırla" / oturum devamlılığı istenirse, token'ı XSS'e karşı en güvenli şekilde
   (HttpOnly cookie, backend tarafında set edilen) saklamak gerekir — `localStorage`'a JWT
   koymaktan kaçınılmalı.
3. **[İYİ HABER] `dangerouslySetInnerHTML` kullanımı yok**, kod tabanında hiçbir yerde
   bulunamadı — XSS'e karşı bu açıdan risk yok.
4. **[İYİ HABER] Hardcoded API anahtarı/secret bulunamadı** (grep ile arandı, `ADMIN_CREDENTIALS`
   dışında hiçbir sonuç çıkmadı — o da yukarıda düzeltildi).
5. **Backend tarafı**: `backend/db/seed.js`'deki örnek `OWNERS` verisinde her sahibin `password:
   "demo1234"` alanı düz metin olarak duruyor ve `/api/owners` uç noktası bu alanı FİLTRESİZ
   döndürüyor (yani frontend, `owner.password`'u API yanıtında görebiliyor). Bu bir demo/mock veri
   seti olsa da, gerçek bir üretim ortamına taşınırken şifrelerin backend'de hash'lenmesi
   (bcrypt/argon2) ve API yanıtlarından kesinlikle çıkarılması gerekir — bu frontend'in
   düzeltebileceği bir şey değil, backend şemasında ele alınmalı.

## 10) Düzeltilen erişilebilirlik (accessibility) sorunları

- **13/13 `<img>` etiketine `alt` metni eklendi** (profil fotoğrafı, kapak fotoğrafı, ilan
  fotoğrafı, personel fotoğrafı, sorun/teklif fotoğrafları, araç fotoğrafı) — görsel tasarımda
  hiçbir değişiklik yapılmadan.
- **44 adet `<div onClick>` kullanımı incelendi** — ilk bakışta "buton yerine div kullanılmış"
  gibi görünse de, tek tek kontrol edildiğinde HEPSİNİN modal arka planı (backdrop) tıklanınca
  kapatma deseni olduğu ve her modalın zaten klavye ile erişilebilir gerçek bir `<button>` (X
  kapatma butonu) içerdiği görüldü — yani bu 44 kullanımın **gerçek bir erişilebilirlik ihlali
  olmadığı** doğrulandı (yanlış pozitif). Küçük, gerçek bir iyileştirme fırsatı: hiçbir modalda
  Escape tuşu ile kapatma desteği yok; bu düşük riskli, önerilen bir sonraki adım (aşağıya bakın).
- Form input'larının büyük çoğunluğunda zaten `placeholder` var ama görünür `<label>` eksik —
  bu, ekran okuyucu kullanıcıları için bir sorun; kapsamı geniş olduğu için (onlarca form alanı)
  bu turda toplu düzeltilmedi, ancak somut bir takip maddesi olarak not edildi.

## 11) Kaldırılan/eklenen bağımlılıklar

- **Kaldırılan**: yok (mevcut 3 frontend bağımlılığı — react, react-dom, lucide-react — hepsi
  aktif kullanılıyor; backend'in 3 bağımlılığı — express, better-sqlite3, cors — hepsi aktif).
- **Eklenen (devDependencies)**: `typescript`, `@types/react`, `@types/react-dom`, `tsx`
  (TypeScript geçişi ve test çalıştırma için gerekli, minimum sette tutuldu).

## 12) Test durumu

12 gerçek birim testi yazıldı VE bu ortamda gerçekten ÇALIŞTIRILDI (`tsx --test
src/utils/helpers.test.ts`) — **12/12 başarılı**. Kapsanan alanlar: fiyat ayrıştırma
(`parseListingPrice`, `parsePriceNumber`), fiyat seviyesi hesaplama (`priceLevel`), coğrafi mesafe
(`haversineDistanceKm`), tarih doğrulama (geçersiz takvim tarihlerini reddetme dahil), e-posta/
telefon doğrulama (TR/DE), para birimi tespiti, isim baş harfleri, e-posta için Türkçe karakter
dönüştürme, ve sabit/değişken fiyat servis sınıflandırması. `npm test` komutu `package.json`'a
eklendi. Bileşen (component) testleri veya entegrasyon testleri YAZILMADI — bunlar gerçek bir
React Testing Library + jsdom kurulumu (npm install gerektirir, bu sandbox'ta mümkün değildi)
gerektirir; bu, "Prodüksiyon Öncesi Kontrol Listesi"nde bir sonraki adım olarak listelendi.

## 13) Build sonucu

`npm run build` (Vite) bu sandbox'ta ÇALIŞTIRILAMADI (npm registry ağ erişimi engelli). Bunun
yerine, tüm modül grafiği esbuild ile bağımsız olarak derlendi (sözdizimi + import çözümleme +
JSX doğrulaması içerir, ama TypeScript TİP kontrolü içermez):

- Geliştirme modu bundle: **886.3kb**, 0 hata.
- Minify edilmiş (prodüksiyon benzeri) bundle: **604.4kb**, 0 hata.
- 184 `useState` çağrısı korundu (183 orijinal + 1 yeni `adminLoginLoading`).
- Tüm 15 çıkarılan bileşen + AppShell.tsx için eksik `lucide-react` ikon importları ve
  `PriceLevelDots`/`MiniBarChart` importları elle tarandı ve düzeltildi (esbuild bu tür
  "tanımsız JSX bileşeni" hatalarını YAKALAMAZ — bu kontrol elle, dosya dosya yapıldı).

**Gerçek `npm run build` / `npm run typecheck` / `npm test` komutlarını kendi bilgisayarınızda
çalıştırmanız gerekiyor** — aşağıdaki kontrol listesine bakın.

## 14) Kalan teknik borç

1. **`AppShell.tsx` (2368 satır) ve `AppLogicProvider.tsx` (1941 satır) hâlâ büyük.** Sıradaki
   güvenli adım: aynı "useApp() ile besleme" desenini (bu turda 15 bileşen için kanıtlandı) her
   ekran (`~15 screen` değeri) için tekrarlayıp `components/pages/` altına taşımak.
2. **TypeScript geçişi yüzeysel.** `tsconfig.json` bilinçli olarak `strict: false` ile
   başlatıldı ve `AppLogicProvider.tsx` içindeki 184 `useState` hâlâ örtük `any` tipinde.
   `types/domain.ts`'deki tipler şu an sadece `services/api/client.ts`'de kullanılıyor. Bir
   sonraki adım: state tanımlarına kademeli olarak (`useState<Mechanic[]>([])` gibi) tip
   eklemek — canlı QA olmadan hepsini tek seferde yapmak riskli olurdu.
3. **Route/gezinme mimarisi değiştirilmedi.** Uygulama hâlâ kendi yazdığı `screen` string
   state makinesini kullanıyor (React Router YOK). `react-router-dom` eklemek bu sandbox'ta
   `npm install` yapılamadığından test edilemezdi; ekranlar arası ~15 farklı `setScreen(...)`
   çağrısını gerçek route'lara çevirmek, canlı tarayıcı testi olmadan uygulamanın TÜM gezinme
   akışını kırma riski taşıyan, bilinçli olarak ERTELENEN en yüksek riskli madde.
4. **Rol tabanlı erişim kontrolü (RBAC) sadece istemci tarafında** — bkz. bölüm 9, madde 2.
   Gerçek güvenlik için backend'de kimlik doğrulama/yetkilendirme eklenmesi gerekiyor.
5. **Form label'ları eksik** — bkz. bölüm 10.
6. **Modal'larda Escape tuşu ile kapatma yok** — küçük ama gerçek bir UX/erişilebilirlik iyileştirmesi.
7. **`components/features/*.tsx` dosyalarının her biri, `useApp()`'tan TÜM ~588 tanımlayıcıyı
   destructure ediyor** (sadece ihtiyaç duyduklarını değil) — bu, "canlı tarayıcı testi olmadan
   yanlışlıkla bir değişkeni unutma" riskini sıfırlamak için bilinçli bir güvenlik/hız tercihiydi.
   Prodüksiyon bundle'ında minifier ölü kodu büyük ölçüde temizliyor (604kb), ama yine de her
   bileşenin gerçekte kullandığı alanlara daraltılması önerilir (daha iyi kod okunabilirliği +
   daha küçük gerçek geliştirme deneyimi, prod bundle boyutuna etkisi sınırlı).
8. **Component/entegrasyon testleri yok** — sadece saf yardımcı fonksiyonlar test edildi.
9. **Backend'de kimlik doğrulama middleware'i yok** — bkz. bölüm 9, madde 2.
10. **Tüm CRUD yazma işlemleri artık backend'e kalıcı hale getiriliyor** (bu turda tamamlandı):
    `AppLogicProvider.tsx` içine eklenen `persist(promise, failMessage)` yardımcı fonksiyonu,
    mevcut senkron/optimistic UI davranışını DEĞİŞTİRMEDEN (state güncellemesi anında kalır),
    arka planda gerçek bir `api.X.create/update/remove` çağrısı yapıp başarısız olursa toast ile
    uyarıyor. Create akışları (araç, randevu, ilan, iş ilanı, destek talebi, teklif isteği/teklifi)
    `async`'e çevrildi ve backend'in döndürdüğü gerçek `id` kullanılıyor (istemci tarafı geçici
    `Date.now()`/sayaç id'leri yalnızca backend yanıtı gelene kadar iyimser görüntüleme için
    kullanılıyor). Çoklu tamirci fiyat teklifi özelliği için `quote_requests`/`quote_offers`
    tabloları + route'ları sıfırdan eklendi (`backend/db/db.js`, `backend/server.js`).
    **Bilinçli olarak kapsam dışı bırakılanlar:** bildirim kaydı (`notifLog`) ve sohbet mesajları
    (`conversations`) hâlâ yalnızca istemci tarafında — bunlar için backend'de tablo/route yok;
    admin değişiklik geçmişi (`admin_change_log`) YAZILIYOR (audit amaçlı) ama sayfa açılışında
    geri OKUNMUYOR, çünkü backend'in genel `action/entityType/before/after` şeması, admin panelin
    "Geçmiş" ekranının beklediği zengin şekilden (`targetType/field/oldValue/newValue/reverted`)
    farklı — bunları uzlaştırmak (reconcile) ayrı, canlı QA gerektiren bir sonraki adım;
    `mechanicOverride` alanları (admin panelinden tamirciye atanan email/phone/status) da
    `mechanics` şemasında karşılığı olmadığından demo amaçlı istemci-tarafı katman olarak kaldı.

## 15) Prodüksiyon öncesi kontrol listesi

Kendi bilgisayarınızda (bu sandbox'ta npm erişimi olmadığı için) çalıştırmanız gerekenler:

```bash
cd frontend
npm install
npm run typecheck   # gerçek TypeScript tip hatalarını gösterir (bu sandbox'ta çalıştırılamadı)
npm test            # 12 gerçek testi tekrar çalıştırır
npm run build       # gerçek Vite/Rollup prodüksiyon derlemesi + gerçek bundle boyutu
npm run dev         # tarayıcıda GERÇEK QA yapın — özellikle:
                     #  - Her 15 ekranı gezin (owner/mechanic/admin akışları)
                     #  - Form input'larına yazarken odak kaybı olmadığını doğrulayın
                     #    (remount hatası düzeltmesinin gerçek doğrulaması budur)
                     #  - Admin girişini test edin (artık backend'i çağırıyor —
                     #    backend/.env'de FIXPERTO_ADMIN_EMAIL/PASSWORD ayarlı olmalı,
                     #    yoksa varsayılan admin@fixperto.com / Fixperto2026! kullanılır)
```

Ayrıca:
- `backend/.env` dosyasını `backend/.env.example`'dan oluşturun.
- `frontend/.env` dosyasını `frontend/.env.example`'dan oluşturun (gerekirse `VITE_API_URL`'i
  güncelleyin).
- Prodüksiyona çıkmadan önce bölüm 14'teki maddeleri (özellikle RBAC ve form label'ları)
  önceliklendirin.
