# Fixperto — Performans, Ölçeklenebilirlik, Medya ve Güvenlik Denetimi

**Bu bir ANALİZ raporudur. Hiçbir kod değiştirilmedi.** Ölçümler gerçek sunucu çalıştırılarak yapıldı;
tahmin edilen değerler "tahmin" olarak işaretlendi.

---

## A. MEVCUT MİMARİ

| Katman | Gerçekte ne var |
|---|---|
| Frontend | React 18 + Vite + Tailwind. **Tek paket, kod bölme yok.** 2,0 MB kaynak; en büyük iki dosya `AppShell.tsx` (584 KB) ve `AppLogicProvider.tsx` (434 KB). Bağımlılık: react, react-dom, lucide-react, jspdf. |
| Backend | Express 4 + better-sqlite3. Bağımlılık: express, cors, bcryptjs, nodemailer, better-sqlite3. **Sıkıştırma (gzip/br) middleware'i YOK.** |
| Veritabanı | Tek SQLite dosyası, WAL modu, foreign_keys açık. 20 tablo. |
| API | 128 uç. Jenerik CRUD fabrikası + 14 özel rota dosyası. |
| Kimlik | Kendi oturum katmanı: SHA-256 karmalı jeton, 7 gün TTL, SQLite `sessions` tablosu. Jeton `Authorization` başlığında (çerez yok). |
| Yetki | Kaynak başına `authScope` (sahiplik alanı), admin-only sütun listesi, hesap-kritik alan kilidi. |
| Dosya yükleme | **HTTP dosya yükleme yok.** Tarayıcıda `FileReader.readAsDataURL` → base64 `data:` URI → normal JSON alanı olarak `TEXT` sütununa yazılıyor. |
| Görsel depolama | **SQLite'ın içinde, base64 metin olarak.** Ayrı dosya sistemi / obje deposu / CDN yok. |
| Görsel servisi | Görseller API'nin JSON yanıtının İÇİNDE gömülü geliyor. Ayrı bir görsel URL'i yok. |
| Cache | **Hiçbir `Cache-Control` / `ETag` başlığı yok.** |
| CDN | Yok. |
| Sayfalama | `?limit`/`?offset` var (bu denetimde eklendi), varsayılan üst sınır 1000. **Frontend hiç kullanmıyor.** |
| Filtreleme / sıralama / arama | **Tamamı istemcide** (`useMemo`): tüm tablo indirilip tarayıcıda filtreleniyor. |
| Arka plan işleri | Yok. Kuyruk yok, worker yok. |
| Günlükleme | `console.log` / `console.error`. Yapılandırılmış günlük yok. |
| Hata yönetimi | Express hata katmanı + async sarmalayıcı + süreç düzeyi son savunma (bu denetimde eklendi). |
| İzleme | Yok. |

### İlk sayfa yüklemesi
Girişsiz **5**, girişten sonra **11** liste çağrısı yapılıyor
(`mechanics, listings, jobs, owners, broadcasts` + `vehicles, appointments, tickets, quoteRequests, quoteOffers, conversations`)
ve her biri **ilgili tablonun tamamını** çekiyor. `blog` ayrıca 3 farklı yerden çağrılıyor.

---

## B. BUGÜNKÜ PERFORMANS (gerçek ölçüm)

Gerçek sunucu + gerçek SQLite ile ölçüldü:

| Uç | Kayıt | Yanıt | Süre |
|---|---|---|---|
| `GET /api/mechanics` | 10 | 15,0 KB | 3 ms |
| `GET /api/listings` | 8 | 7,9 KB | 3 ms |
| `GET /api/blog` | 13 | 6,2 KB | 3 ms |
| `GET /api/jobs` | 3 | 1,9 KB | 1 ms |

**Bugün sistem gerçekten hızlı.** Sebebi mimari değil, veri azlığı: toplam yükün tamamı ~31 KB.

---

## C. GELECEKTEKİ DARBOĞAZLAR

### C.1 — Ölçülen: base64 görseller yanıtı patlatıyor

10 ilana, her birine 1 kapak + 5 galeri fotoğrafı ekledim
(**sıkıştırılmış** hâlleriyle, 250 KB/foto — yani iyimser senaryo):

```
GET /api/listings   18 kayıt   14,67 MB   201 ms
ilan başına ortalama: 834 KB
```

Bu **iyimser** ölçüm. Aynı fotoğraflar sıkıştırılmadan (telefon kamerası 3 MB) gelirse 12 kat fazlası.

Doğrusal ölçekleme (tahmin, ölçülen 834 KB/ilan üzerinden):

| İlan sayısı | Tek `GET /api/listings` |
|---|---|
| 100 | ~81 MB |
| 1.000 | ~815 MB |
| 1.000 üst sınırla (mevcut kod) | ~815 MB — **sınır işe yaramıyor, çünkü sorun kayıt SAYISI değil kayıt BOYUTU** |

Her ziyaretçi, ana arama ekranını açtığında bunun tamamını indiriyor. Filtreleme istemcide olduğu için
"BMW ara" demek de tüm veriyi indirmek anlamına geliyor.

### C.2 — Ölçülen: veritabanı dosyası

60 fotoğrafla veritabanı **13,45 MB** oldu → fotoğraf başına ~224 KB depolama.

| Senaryo | Tahmini SQLite dosyası |
|---|---|
| 10.000 kullanıcı × 20 foto = 200.000 foto | **~45 GB tek dosya** |
| 100.000 kullanıcı × 20 foto = 2.000.000 foto | **~450 GB tek dosya** |

Bunun sonuçları:
- **Yedekleme:** her yedek tam dosya kopyası. 45 GB'lık dosyayı günlük yedeklemek pratik değil.
- **WAL:** yazma sırasında WAL dosyası büyüyor; büyük satır yazmaları checkpoint'i uzatıyor.
- **Bellek:** SQLite sayfa önbelleği metin sütunlarıyla dolup meta veri sorgularını yavaşlatıyor.
- **`SELECT *`:** jenerik CRUD fabrikası her zaman `SELECT *` yapıyor — yalnızca ilan başlığı gerekirken
  base64 fotoğraflar da okunuyor.

### C.3 — Ölçülen: sohbet satırı sınırı

Sohbet uçları doğrulama YAPIYOR (bu iyi): `MAX_MESSAGE_IMAGE_LEN = 6.000.000`,
`MAX_MESSAGES_PER_CONVERSATION = 2000`. Ama çarpımı:

**2000 × 6 MB = tek bir sohbet satırı yasal olarak 12 GB'a kadar büyüyebilir.**

Ve her yeni mesaj bu satırı **baştan okuyup baştan yazıyor** (okuma-değiştirme-yazma). 100 MB'lık bir
sohbette her "merhaba" mesajı 100 MB okuma + 100 MB yazma demek.

### C.4 — Jenerik CRUD'da hiç boyut sınırı YOK

`makeCrudRouter` TEXT sütunlarına yazarken boyut kontrolü yapmıyor. Tek sınır
`express.json({limit:"5mb"})`. Yani şu alanların her biri istek başına 5 MB'a kadar veri alabiliyor:

`listings.photo`, `listings.photos[]`, `mechanics.coverPhoto`, `mechanics.img`,
`owners.photo`, `appointments.issuePhotos[]`, `mechanics.verificationDocs[]`, `quote_requests.photos[]`

### C.5 — Sıkıştırma yok

`compression` middleware'i yok. JSON meta verisi 5–10 kat sıkışabilirdi.
**Ama dikkat:** base64 görsel verisi sıkışmaz (%0–5). Yani gzip, metin yükünü düşürür,
görsel problemini ÇÖZMEZ.

### C.6 — İstemci tarafı filtreleme

`filtered`, `filteredListings`, `filteredJobs` — hepsi `useMemo` ile tarayıcıda çalışıyor.
Sunucu tarafı filtreleme, indeksli arama ve sıralama YOK. 100.000 ilanda bu yaklaşım çalışmaz:
ne ağ, ne bellek, ne CPU yeter.

### C.7 — Kod bölme yok

Tek paket. `React.lazy` / dinamik `import()` hiç kullanılmıyor. Yönetici paneli, el kitabı (135 KB),
sözlük (202 KB), jspdf — hepsi ilk açılışta yükleniyor. Girişsiz bir ziyaretçi yönetici panelinin
kodunu da indiriyor.

### C.8 — Ağır işler istek içinde

- **bcrypt** kayıt/girişte istek içinde (kasıtlı ve doğru, ama CPU başına eşzamanlı giriş sayısını sınırlar).
- **E-posta gönderimi** `await sendMail(...)` ile istek içinde: SMTP yavaşsa kayıt/giriş yanıtı bekliyor.
  Bir yerde `await` olmadan çağrılıyor (`delete-account`), yani tutarsız.

### C.9 — İndeks durumu

Mevcut 5 indeks: `analytics_events` (3), `mechanic_reviews.mechanicId`, `taste_signals(userId,role)`.

Sorgu desenlerine göre indeksi OLMAYAN sık sütunlar:

| Sütun | Sorgu sayısı | Bugün | Ölçekte |
|---|---|---|---|
| `vehicle_history.vin` | 5 | tablo taraması | **VIN sorgulamada kritik** |
| `vehicles.ownerId`, `appointments.ownerId` | 6 | tablo taraması | liste sorgularında kritik |
| `share_events.refCode` | 4 | tablo taraması | orta |
| `quote_offers.requestId` | 5 | tablo taraması | orta |
| `listings.sellerId`, `listings.status` | 2 | tablo taraması | liste + filtreleme |
| `blog_posts.slug` | 2 | tablo taraması | düşük (13 kayıt) |
| `review_helpful(reviewId)` | 3 | **PK var** | ✓ |

`WHERE id = ?` (97 sorgu) zaten INTEGER PRIMARY KEY → indeksli. Sorun orada değil.

### C.10 — Cache ve CDN yok

Hiçbir yanıtta `Cache-Control` / `ETag` yok. **Ama asıl mesele şu:** görseller kimlik doğrulamalı,
dinamik bir JSON yanıtının içinde gömülü olduğu için **bugünkü mimariyle cache'lenmeleri
İMKÂNSIZ.** Ayrı bir URL'i olmayan bir görsel ne tarayıcı cache'ine, ne CDN'e, ne `immutable`
başlığına konabilir. Bu, mimarinin çekirdek kısıtı.

---

## D. GÜVENLİK RİSKLERİ (yükleme / depolama / API)

| # | Risk | Durum |
|---|---|---|
| D1 | **Sunucuda görsel doğrulaması HİÇ yok.** Magic byte, MIME, gerçek çözümleme, boyut kontrolü — hiçbiri. TEXT sütununa ne gelirse yazılıyor. `data:image/jpeg;base64,` öneki de kontrol edilmiyor. | **AÇIK** |
| D2 | **`data:image/svg+xml` kabul edilebiliyor.** SVG script taşıyabilir. `<img src>` içinde script çalışmaz ama `<a href>` / yeni sekmede açılırsa çalışır. `safeHref` data URI'lerde SVG'ye izin vermiyor (iyi), ama depolamada engel yok. | **AÇIK** |
| D3 | **Depolama tükenmesi (storage exhaustion).** Jenerik CRUD'da boyut sınırı yok; istek başına 5 MB, hız sınırı görsel yazma yollarında yok. Bir hesap betikle veritabanını şişirebilir. | **AÇIK** |
| D4 | **Sohbet satırı 12 GB'a kadar büyüyebilir** (2000 × 6 MB). | **AÇIK** |
| D5 | 8 yükleme yolundan **yalnızca 2'si** yeniden boyutlandırıyor (ilan kapak + galeri: 1600px / q0.78). Profil fotoğrafı, tamirci kapak fotoğrafı, sohbet fotoğrafı, arıza fotoğrafı, teklif fotoğrafı **ham** kaydediliyor. | **AÇIK** |
| D6 | Yeniden boyutlandırma **istemcide** yapılıyor → atlanabilir. Saldırgan doğrudan API'ye ham veri gönderir. Sunucu tarafı kontrol yok. | **AÇIK** |
| D7 | Sıkıştırma bombası: sunucu görseli hiç çözmediği için klasik "decompression bomb" CPU riski **yok** (iyi haber). Ama aynı sebeple boyut/çözünürlük de doğrulanamıyor. | Kısmen iyi |
| D8 | Dosya adı / yol riski: dosya adı hiç kullanılmıyor, dosya sistemi yazımı yok → path traversal, çifte uzantı, polyglot riskleri **yapısal olarak yok**. | ✓ Temiz |
| D9 | Yetkisiz dosya erişimi / IDOR: görseller kayıtların içinde olduğu için kaydın yetki kuralına tabi. Ayrı dosya URL'i olmadığından "tahmin edilebilir dosya adı" riski **yok**. | ✓ Temiz |
| D10 | Public/private ayrımı: `verificationDocs` bu denetimde gizlendi (yalnızca sahibi + admin). Diğer görseller kasıtlı olarak herkese açık. | ✓ Temiz |
| D11 | CDN cache poisoning / cache leakage: CDN olmadığı için **bugün risk yok**. CDN eklenirse kimlik doğrulamalı yanıtların cache'lenmemesi kritik olacak. | Gelecek riski |

**Not:** bu denetimin önceki turlarında kapatılan açıklar (sahte X-Forwarded-For, düz metin şifre
günlüğü, oturum süresi kontrolü, signupIpHash sızıntısı, CORS 500'ü, CSP eksikliği) bu raporun
kapsamı dışında — hepsi düzeltildi ve testlerle korunuyor.

---

## E. ÖNERİLEN MİMARİ (en az değişiklikle)

### E.1 Görsel mimarisi — kademeli geçiş

Mevcut base64-in-DB yaklaşımını **kaldırmadan**, yanına yeni bir yol açmak:

```
KULLANICI YÜKLEMESİ
   ↓  (istemcide yeniden boyutlandırma — MEVCUT, korunuyor)
POST /api/media           ← YENİ uç
   ↓  SUNUCU TARAFI DOĞRULAMA (magic byte + boyut + tür)
   ↓  içerik karması (SHA-256) hesapla → dosya adı = karma
DOSYA SİSTEMİ  backend/media/ab/cd/<karma>.jpg
   ↓  (kayda base64 değil, /media/<karma>.jpg YOLU yazılıyor)
GET /media/<karma>.jpg    ← YENİ uç, Cache-Control: immutable, 1 yıl
   ↓
(ileride) CDN  →  KULLANICI
```

**Neden dosya sistemi, obje deposu değil:** mevcut sistem tek sunucuda çalışıyor, SQLite kullanıyor
ve ek bir bulut hesabı/maliyeti yok. Dosya sistemi sıfır ek bağımlılık, sıfır ek maliyet ve
"database'e binary koymama" hedefini tamamen karşılıyor. Obje deposu (S3/R2) doğru adım ama
**ikinci** adım: çok sunucuya geçildiğinde ya da 100 GB'ı aştığında. O zamana kadar dosya yolu
soyutlaması aynı kalacağı için geçiş tek bir modül değişikliği olur.

**Neden içerik karması dosya adı:**
- Aynı fotoğraf iki kez yüklenirse tek kopya (tekilleştirme).
- İçerik değişince URL değişir → cache invalidation SORUNU HİÇ OLUŞMAZ. Kullanıcı profil
  fotoğrafını değiştirince yeni URL gelir, eskisi cache'te kalsa bile kimse ona bakmaz.
- `immutable` başlığı güvenle verilebilir.
- Kullanıcının verdiği dosya adı hiç kullanılmaz → path traversal / çifte uzantı yapısal olarak imkânsız.

**Geriye dönük uyumluluk:** mevcut base64 değerler OLDUĞU GİBİ çalışmaya devam eder. `<img src>`
hem `data:` hem `/media/...` kabul ediyor. Yani **mevcut fotoğrafların hiçbiri bozulmaz, silinmez,
taşınmak zorunda değil.** Eski kayıtlar istenirse sonradan, arka planda, tek tek taşınır.

### E.2 Boyut varyantları

Yükleme anında 3 varyant üretmek (sunucuda, `sharp` gibi bir kütüphane olmadan **yapılamaz**):

- **Seçenek 1 (sıfır bağımlılık):** istemcide üretmeye devam et — bugün ilan fotoğraflarında
  olduğu gibi — ama kart boyutu için 400px, detay için 1600px olmak üzere **iki** varyant üret.
  Sunucu ikisini de kaydeder ve doğrular. Sunucuda görsel işleme yok → CPU riski yok, bağımlılık yok.
- **Seçenek 2:** `sharp` ekle ve sunucuda üret. Daha sağlam (istemci atlanamaz) ama yeni bir native
  bağımlılık, CPU yükü ve sıkıştırma bombası riski gelir.

**Önerim: Seçenek 1.** Sebebi: mevcut mimariye tam uyuyor, sıfır maliyet, sıfır yeni saldırı yüzeyi.
Sunucu yine de boyutu doğruluyor (çok büyükse reddediyor), yani istemciyi atlayan biri sınırı geçemiyor.

### E.3 Format
Mevcut `canvas.toDataURL("image/jpeg", 0.78)` iyi ve her tarayıcıda çalışıyor.
WebP'e geçmek %25-30 kazanç sağlar ve `canvas.toDataURL("image/webp")` Safari 14+'da çalışıyor.
**Ama:** destek denetimi gerektirir ve kazanç, base64→dosya geçişinin yanında küçük.
**P2 olarak sonraya.** AVIF tarayıcıda üretilemiyor, sunucu tarafı işleme gerektirir → şimdilik gerekli değil.

### E.4 Sayfalama
Backend hazır (`?limit`/`?offset` + `X-Total-Count`). Eksik olan frontend'in kullanması ve
filtrelemenin sunucuya taşınması. Bu **büyük** bir değişiklik: mevcut istemci-taraflı filtreleme
35+ filtreyi kapsıyor ve arama ekranının tamamı buna dayanıyor.
**Önerim: şimdi YAPMA.** Çünkü görsel sorunu çözülünce ilan başına yük 834 KB'dan ~2 KB'a
düşecek ve 1000 kayıt sınırıyla birlikte 10.000+ ilana kadar mevcut yaklaşım çalışmaya devam eder.
Bu, gerçekten gerektiğinde yapılacak bir iş.

---

## F / G / H — ÖNERİLER: ÖNCELİK, RİSK, FAYDA

| # | Öneri | Öncelik | Risk | Beklenen fayda |
|---|---|---|---|---|
| 1 | **Sunucu tarafı görsel boyut + tür doğrulaması** (jenerik CRUD dâhil): `data:image/(jpeg\|png\|webp\|gif)` allowlist, alan başına boyut tavanı, SVG reddi | **P0** | **Düşük** — yalnızca reddetme ekliyor, mevcut geçerli veriye dokunmuyor | Depolama tükenmesi kapanır, SVG riski kapanır, DB büyümesi sınırlanır |
| 2 | **Sohbet satırı tavanı**: mesaj başına görsel 6 MB → 1,5 MB; sohbet başına toplam BOYUT tavanı (satır 12 GB'a çıkamaz) | **P0** | **Düşük** | En büyük tek satır riski kapanır |
| 3 | **Yanıt sıkıştırması** (`compression` middleware) | **P0** | **Düşük** | JSON meta verisinde 5-10x bant genişliği kazancı. Görselleri etkilemez. |
| 4 | **Eksik indeksler**: `vehicle_history.vin`, `vehicles.ownerId`, `appointments.ownerId`, `share_events.refCode`, `quote_offers.requestId`, `listings(status, sellerId)` | **P1** | **Düşük** | VIN sorgulama ve liste sorguları tablo taramasından kurtulur. Yazma maliyeti: 6 indeks × küçük tablolar = ihmal edilebilir. |
| 5 | **Medya uçları** (`POST /api/media`, `GET /media/:hash`) + içerik karması dosya adı + `immutable` cache | **P1** | **Orta** — yeni uç, yeni dosya sistemi yazımı. Eski veri bozulmaz. | Görseller DB'den çıkar, cache'lenebilir, CDN'e hazır olur. **Asıl kazanç bu.** |
| 6 | **Kalan 6 yükleme yolunu istemcide yeniden boyutlandırmaya geçir** (profil, kapak, sohbet, arıza, teklif fotoğrafı) | **P1** | **Düşük** — mevcut `readImageAsCompressedDataUrl` yeniden kullanılıyor | Yüklenen veri ~12x küçülür |
| 7 | **Kalan 22 `<img>` etiketine `loading="lazy"` + `width`/`height`** (35'ten 13'ü zaten lazy) | **P1** | **Düşük** | Görünüm dışı görseller indirilmez; düzen kayması (CLS) azalır. Hero görselleri lazy YAPILMAZ. |
| 8 | **E-posta gönderimini istek dışına al** ("ateşle ve unut" + hata günlüğü) | **P2** | **Düşük** | SMTP yavaşlığı kayıt/giriş yanıtını bekletmez |
| 9 | **Kod bölme**: yönetici paneli, el kitabı, jspdf ayrı parçalara | **P2** | **Orta** — `React.lazy` + Suspense; yanlış yapılırsa beyaz ekran | İlk paket belirgin küçülür (girişsiz ziyaretçi admin kodunu indirmez) |
| 10 | **Sunucu tarafı filtreleme + sayfalama** (frontend'in `?limit` kullanması) | **P3** | **Yüksek** — arama ekranının tamamı buna dayanıyor | 10.000+ ilanda gerekli olacak. **Şimdi gereksiz.** |
| 11 | **CDN** | **P3** | Düşük (yapılandırma) | Medya uçları hazır olduktan SONRA anlamlı. Öncesinde cache'lenecek bir şey yok. |
| 12 | **Obje deposu (S3/R2)** | **P3** | Orta | Çok sunucuya geçince ya da 100 GB'ı aşınca. Şimdi gereksiz maliyet. |
| 13 | **Kuyruk / arka plan worker** | **Gereksiz** | — | Sunucuda görsel işleme olmadığı için kuyruğa alınacak ağır iş yok. Eklemek gereksiz karmaşıklık. |
| 14 | **Basit izleme**: istek süresi + hata oranı + DB dosya boyutu + medya klasörü boyutu, `/api/health`'e ek alanlar | **P2** | **Düşük** | Yavaşlama fark edilir hâle gelir. Ücretsiz. |

---

## I. DEĞİŞMESİ GEREKEN DOSYALAR

**P0 (hemen):**
- `backend/utils/mediaValidation.js` — YENİ (data URI doğrulama, tek kaynak)
- `backend/routes/makeCrudRouter.js` — doğrulamayı gövde süzgecine bağla
- `backend/routes/conversations.js` — görsel tavanı + sohbet toplam boyut tavanı
- `backend/server.js` — `compression` middleware
- `backend/package.json` — `compression` bağımlılığı

**P1:**
- `backend/db/db.js` — 6 indeks
- `backend/routes/media.js` — YENİ
- `backend/server.js` — medya rotası + statik servis + cache başlıkları
- `frontend/src/app/state/AppLogicProvider.tsx` — 6 yükleme yolu `readImageAsCompressedDataUrl`'e
- `frontend/src/services/api/client.ts` — `api.media.upload`
- `frontend/src/components/features/*.tsx` — `loading="lazy"` + boyut öznitelikleri

**P2:**
- `backend/routes/auth.js` — e-posta gönderimini istek dışına
- `frontend/src/app/AppShell.tsx` — `React.lazy` sınırları

## J. DOKUNULMAMASI GEREKEN DOSYALAR

- `backend/utils/auth.js`, `backend/utils/clientIp.js`, `backend/utils/rateLimiter.js` — kimlik ve
  IP katmanı bu denetimde yeni sertleştirildi, testlerle korunuyor. Performans için dokunulmayacak.
- `backend/db/hydrate.js` — hassas alan süzgeci. Bir alanı "performans için" çıkarmak gizlilik
  regresyonu olur.
- Mevcut şema sütunlarının hiçbiri **silinmeyecek / yeniden adlandırılmayacak**. Yeni yol eski
  sütunların YANINA eklenecek.
- `frontend/src/data/i18n.ts`, `handbook.ts` — yalnızca içerik.
- Tüm `tests/` — davranış değişmediyse test de değişmemeli. Test değiştirmek zorunda kalmak,
  davranışı değiştirdiğimin işaretidir.

---

## FAZ PLANI

| Faz | İçerik | Neden bu sırada |
|---|---|---|
| **1** | P0 güvenlik + sıkıştırma (öneri 1, 2, 3) | Sıfır risk, mevcut davranışı hiç değiştirmiyor, en büyük güvenlik açığını kapatıyor |
| **2** | İndeksler (4) | Sıfır risk, ölçülebilir kazanç |
| **3** | İstemci yeniden boyutlandırma yayılımı + lazy loading (6, 7) | Düşük risk, yüklenen veriyi hemen 12x düşürüyor |
| **4** | Medya uçları + içerik karması + immutable cache (5) | Asıl mimari kazanç. Eski veri bozulmadan, paralel yol olarak |
| **5** | İzleme (14) + e-posta (8) | Sonraki adımların etkisini ölçebilmek için |
| **6** | Kod bölme (9) | İyi ama acil değil |
| **Sonra** | CDN, obje deposu, sunucu filtreleme | Gerçekten gerektiğinde. Ölçmeden yapılmayacak. |

**Her fazdan sonra:** `node tests/run.mjs` (şu an 1624 test) + ölçüm tekrarı + geri alma noktası (git commit).

---

## 20 SORUYA KISA CEVAPLAR

1. **En büyük 10 risk:** base64-in-DB (ölçüldü: 834 KB/ilan) · sunucuda görsel doğrulaması yok ·
   sohbet satırı 12 GB'a çıkabiliyor · jenerik CRUD'da boyut sınırı yok · sıkıştırma yok ·
   istemci-taraflı filtreleme · kod bölme yok · 6 eksik indeks · cache/CDN imkânsız (mimari) ·
   izleme yok
2. **Kullanıcı artınca:** 11 liste çağrısı × tam tablo; bcrypt CPU sınırı; SQLite tek yazıcı
3. **Fotoğraf artınca:** 200.000 fotoğrafta ~45 GB tek SQLite dosyası (yedekleme pratik değil);
   yanıtlar yüzlerce MB
4. **Yükleme güvenliği:** D1–D6 açık (doğrulama yok, SVG, depolama tükenmesi, istemci atlanabilir)
5. **En önemli 10 optimizasyon:** F/G/H tablosundaki 1–9
6. **Hemen:** 1, 2, 3 (P0) — sonra 4
7. **Sonra:** 5, 6, 7 → 8, 9, 14
8. **Şu anda gereksiz:** kuyruk/worker, obje deposu, CDN, sunucu-taraflı filtreleme, AVIF
9. **Tahmini kazanç:** sıkıştırma ile JSON'da 5-10x; yeniden boyutlandırma yayılımıyla yüklemede
   ~12x; medya uçlarıyla ilan başına 834 KB → ~2 KB (görseller ayrı, cache'li)
10. **Maliyet:** Faz 1-5 **sıfır ek altyapı maliyeti**. CDN ve obje deposu sonraya bırakıldı.
11. **Dosyalar:** bölüm I
12. **DB değişikliği:** yalnızca 6 `CREATE INDEX`. **Sütun silme/yeniden adlandırma YOK.**
13. **API değişikliği:** yalnızca EKLEME (`POST /api/media`, `GET /media/:hash`).
    Mevcut sözleşmeler bozulmuyor.
14. **CDN gerekli mi?** Şimdi değil — cache'lenecek ayrı bir görsel URL'i yok. Faz 4'ten sonra anlamlı.
15. **Obje deposu gerekli mi?** Şimdi değil. Çok sunucu ya da 100 GB'da.
16. **Görsel işleme gerekli mi?** Sunucuda **hayır** (istemci yeterli ve daha güvenli).
    Sunucu yalnızca DOĞRULAYACAK.
17. **Kuyruk gerekli mi?** Hayır — kuyruğa alınacak ağır iş yok.
18. **Hız sınırı gerekli mi?** Var, ama **görsel yazma yollarında yok** → Faz 1'de eklenmeli.
19. **İzleme gerekli mi?** Evet, ama basit ve ücretsiz olanı (Faz 5).
20. **Kalan riskler:** tarayıcıda gözle test edilmeyen düzen konuları; SQLite'ın tek yazıcı sınırı
    (yüksek eşzamanlı yazmada Postgres gerekecek — ama bu bugünün sorunu değil, ölçülmeden
    yapılmamalı).
