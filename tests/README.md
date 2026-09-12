# Testler

```bash
node tests/run.mjs
```

Her değişiklikten sonra çalıştırılır. Her şey yolundaysa **tek satır** yazar; bir şey bozulursa
yalnızca bozulanın ayrıntısını basar. Amaç: düzenli koşabilmek ama çıktıyla boğulmamak.

| Takım | Ne yakalar |
|---|---|
| `search` | Arama filtrelerinin eksik alanlı (NULL) kayıtlarda çökmemesi |
| `pricing` | Marka bazlı hizmet fiyatı ve türetilen başlangıç fiyatı |
| `navigation` | Tarayıcı geri/ileri: sekmeler, sohbet, "geri sonra yeni dal" |
| `flows` | Uçtan uca iş mantığı: randevu döngüsü, teklif, rol duyarlı kayıt, saatler |
| `i18n` | Eksik/çift anahtar, eksik dil, `{yer tutucu}` uyumsuzluğu |
| `ui` | Katman (z-index) sırası, banda binen kart, ikon düğmelerde erişilebilir ad |
| `null-güvenliği` | Veri alanlarında korumasız `.toLowerCase()`/`.trim()` vb. |
| `blog` | Slug üretimi/benzersizleştirme, taslak görünürlüğü, yayın tarihi, etiketler |
| `randevu takvimi` | Çalışma saatleri metninden slot üretimi, geçmiş/dolu saatler, ay ızgarası |
| `araç formu` | Marka/model listesi bütünlüğü, yazarak süzme, marka→model temizleme, araç ekleme kapısı |
| `güvenlik` | Kullanıcı adreslerinin denetimi (safeHref), güvenlik başlıkları, oturum özeti, CORS, admin uçları |
| `doğrulama` | Alanların MANTIK denetimi: tarih aralıkları, km/yıl/güç/kapı sınırları, kuralların forma bağlı olması |
| `el kitabı` | Belge yapısı, zorunlu konular, bilinen sınırların yazılmış olması ve KAPSAM: her bileşenin el kitabında geçmesi |
| `alt bilgi bağlantıları` | Footer hedefleri anlamlı mı, eylem bağlantıları eylemi yapıyor mu, kaydırma sıfırlanıyor mu |
| `kariyer` | Kariyer ilanlarının yetkisi, taslak/yayın ayrımı, tamirci ilanlarından ayrılığı |
| `telefon` | Numara normalleştirme (+ yoksa biz ekleriz) ve gerçek TR/DE numara planı denetimi; her telefon alanının aynı merkezden geçmesi |
| `hizmet fiyatı` | Sabit/Değişken seçimi (Değişken her zaman serbest), fiyatsız hizmetin randevuda görünmesi, "?" bilgi baloncukları |

Ayrıca `tsc --noEmit` ve her backend dosyası için `node --check` çalışır.

## Yeni test eklemek
`tests/x.test.mjs` oluştur, `_harness.mjs`'ten `eq/ok/noThrow/throws/report` kullan.
Koşucu klasörü kendi tarar; listeye eklemeye gerek yok.

## Neden bu testler?
Her kural bu projede **gerçekten yaşanmış** bir hatadan doğdu — amaç aynı hatanın sessizce
geri gelmemesi. Testler tarayıcı açmadan çalışır (bu ortamda tarayıcı yok), bu yüzden UI
kuralları gerçek kaynak dosyalar üzerinde statik olarak denetlenir.
