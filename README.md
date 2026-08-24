# Fixperto

Türkiye/Almanya odaklı, araç sahiplerini bağımsız tamircilerle buluşturan bir pazar yeri demosu — randevu, çoklu teklif, ikinci el araç ilanı, iş ilanı ve gizli admin paneli içerir.

Bu depo iki parçadan oluşur:

```
fixperto/
  backend/    Express + SQLite REST API
  frontend/   Vite + React (Tailwind) istemci
```

## Hızlı Başlangıç

```bash
# 1) Backend
cd backend
npm install
npm run dev          # http://localhost:4000

# 2) Frontend (yeni terminalde)
cd frontend
npm install
cp .env.example .env # gerekirse VITE_API_URL'i düzenleyin
npm run dev           # http://localhost:5173
```

Backend ilk çalıştığında `backend/db/fixperto.sqlite` dosyasını otomatik oluşturur ve demodaki örnek verilerle (tamirciler, araçlar, randevular, ilanlar, iş ilanları, destek talepleri) doldurur.

## Mimari notları

Bu proje, önceden tek dosyalık (`App.jsx`, ~5000 satır) bir React prototipinden gerçek bir frontend+backend projesine dönüştürüldü:

- **Backend**: Express + `better-sqlite3`. Her varlık (mechanics, owners, vehicles, appointments, listings, jobs, tickets) için standart REST uç noktaları (`GET/POST/PATCH/DELETE`) var, bkz. `backend/README.md`.
- **Frontend**: Sabit veriler (`data/constants.js`, `data/i18n.js`), saf yardımcı fonksiyonlar (`utils/helpers.js`) ve tekrar kullanılabilir küçük bileşenler (`components/`) ayrı dosyalara çıkarıldı. Ana `App.jsx` uygulama açılışında bu 7 çekirdek varlığı backend'den çekiyor (`useEffect` + `src/api/client.js`).
- Uygulamanın geri kalan (çok sayıda) etkileşim mantığı — randevu kabul/red, teklif pazarlığı, çoklu teklif isteme, bildirimler, admin panel değişiklik günlüğü vb. — hâlâ `App.jsx` içinde, istemci tarafında çalışıyor; bunlar orijinal demoda da aynı şekildeydi. Bunların tamamını sunucu tarafında kalıcı hale getirmek doğal bir sonraki adım.

## GitHub'a Push

Bu proje sizin bilgisayarınızda hazır; buradan push etmek için:

```bash
cd fixperto
git remote add origin <SENIN_GITHUB_REPO_URL'IN>
git branch -M main
git push -u origin main
```
