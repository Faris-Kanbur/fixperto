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
- Tüm yazma işlemleri (kayıt/giriş, araç ekleme, randevu alma/durum değiştirme, ilan/iş ilanı verme, teklif verme/kabul etme, yorum yazma/silme, destek talebi açma, admin panel düzenlemeleri) artık gerçekten backend'e (SQLite) kalıcı hale getiriliyor — bkz. `frontend/src/app/state/AppLogicProvider.tsx` içindeki `persist()` yardımcı fonksiyonu ve her ilgili handler. Çoklu tamirci fiyat teklifi (quote request/offer) özelliği için de `quote_requests`/`quote_offers` tabloları eklendi. Bildirimler (`notifLog`) ve sohbet mesajları (`conversations`) hâlâ yalnızca istemci tarafında — bunlar için ayrı tablo/route yok (bilinçli kapsam dışı, bkz. REFACTOR_REPORT.md).

## GitHub'a Push

Bu proje sizin bilgisayarınızda hazır; buradan push etmek için:

```bash
cd fixperto
git remote add origin <SENIN_GITHUB_REPO_URL'IN>
git branch -M main
git push -u origin main
```
