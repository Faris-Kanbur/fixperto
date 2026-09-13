// ARAMA — regresyon: "Cannot read properties of null (reading 'toLowerCase')".
// Tamirci/araç/iş ilanı filtrelerinin üretimdeki mantığı, EKSİK ALANLI kayıtlarla.
// Üçü aynı `query` state'ini paylaşan ayrı useMemo'lar olduğu için tek bozuk kayıt üçünü de düşürür.
import { readFileSync } from "node:fs";
import { eq, noThrow, throws, report } from "./_harness.mjs";

const lc = (v) => String(v ?? "").toLocaleLowerCase("tr-TR");

const filterMechanics = (list, q0, loc, svc) => {
  const q = lc(q0).trim();
  if (q) list = list.filter(m => lc(m.name).includes(q) || lc(m.specialty).includes(q) || (m.brandsServiced || []).some(b => lc(b).includes(q)));
  if (loc.trim()) list = list.filter(m => lc(m.address).includes(lc(loc).trim()));
  if (svc.trim()) { const s = lc(svc).trim(); list = list.filter(m => (m.services || []).some(x => lc(x.name).includes(s)) || lc(m.specialty).includes(s)); }
  return list;
};
const filterListings = (list, q0, loc) => {
  const q = lc(q0).trim();
  list = list.filter(l => !l.adminRemoved && `${lc(l.brand)} ${lc(l.model)}`.includes(q));
  if (loc.trim()) list = list.filter(l => lc(l.city).includes(lc(loc).trim()));
  return list;
};
const filterJobs = (list, q0, loc) => {
  const q = lc(q0).trim();
  if (q) list = list.filter(j => lc(j.title).includes(q) || lc(j.mechanicName).includes(q) || (j.skills || []).some(s => lc(s).includes(q)));
  if (loc.trim()) list = list.filter(j => lc(j.location).includes(lc(loc).trim()));
  return list;
};

// Gerçekçi bozuk veri: kaydolmuş ama alanlarını doldurmamış hesaplar.
const MECHS = [
  { id: 1, name: "Usta Mehmet Oto Servis", specialty: "Genel Bakım", address: "Kadıköy / İstanbul", brandsServiced: ["BMW"], services: [{ name: "Yağ Değişimi" }] },
  { id: 2, name: "Faris", specialty: null, address: null, brandsServiced: null, services: null },
  { id: 3, name: null, specialty: undefined, address: "", brandsServiced: [null], services: [{ name: null }] },
];
const LISTINGS = [
  { id: 1, brand: "BMW", model: "320i", city: "İstanbul", adminRemoved: false },
  { id: 2, brand: null, model: null, city: null, adminRemoved: false },
];
const JOBS = [
  { id: 1, title: "Motor Ustası", mechanicName: "Usta Mehmet", skills: ["motor"], location: "İstanbul" },
  { id: 2, title: null, mechanicName: null, skills: null, location: null },
];

noThrow(() => filterMechanics(MECHS, "", "", "").length, "tamirci: boş sorgu", 3);
noThrow(() => filterMechanics(MECHS, "mehmet", "", "").map(m => m.id), "tamirci: isim", [1]);
noThrow(() => filterMechanics(MECHS, "bakım", "", "").map(m => m.id), "tamirci: uzmanlık", [1]);
noThrow(() => filterMechanics(MECHS, "bmw", "", "").map(m => m.id), "tamirci: marka", [1]);
noThrow(() => filterMechanics(MECHS, "", "istanbul", "").map(m => m.id), "tamirci: konum", [1]);
noThrow(() => filterMechanics(MECHS, "", "İSTANBUL", "").map(m => m.id), "tamirci: Türkçe büyük harf (İ)", [1]);
noThrow(() => filterMechanics(MECHS, "", "", "yağ").map(m => m.id), "tamirci: hizmet", [1]);
noThrow(() => filterMechanics(MECHS, "zzz", "", "").length, "tamirci: eşleşme yok", 0);

noThrow(() => filterListings(LISTINGS, "", "").length, "araç: boş sorgu", 2);
noThrow(() => filterListings(LISTINGS, "bmw", "").map(l => l.id), "araç: marka", [1]);
noThrow(() => filterListings(LISTINGS, "null", "").length, "araç: 'null' araması sonuç vermemeli", 0);
noThrow(() => filterListings(LISTINGS, "", "istanbul").map(l => l.id), "araç: şehir", [1]);

noThrow(() => filterJobs(JOBS, "", "").length, "ilan: boş sorgu", 2);
noThrow(() => filterJobs(JOBS, "motor", "").map(j => j.id), "ilan: başlık", [1]);
noThrow(() => filterJobs(JOBS, "", "istanbul").map(j => j.id), "ilan: konum", [1]);

// Testin hatayı gerçekten temsil ettiğinin kanıtı: eski (korumasız) kod bu veriyle çöküyor.
throws(() => MECHS.filter(m => m.name.toLowerCase().includes("x") || m.specialty.toLowerCase().includes("x")),
       "eski korumasız kod bu veriyle çökmeli");

/**
 * KAYITLI ARAMA DÜZENLEME — "görülenler" listesi ne zaman yeniden hesaplanmalı?
 * ------------------------------------------------------------------------------------------------
 * Bu kural, kullanıcının aramayı silip baştan kurma alışkanlığının GERÇEK sebebiydi: kriterleri
 * değiştirmenin bir yolu yoktu, silip yeniden kurunca da "hangi ilanları zaten gördü" bilgisi
 * sıfırlanıyor ve bir sonraki açılışta eski ilanların hepsi "yeni eşleşme" diye bildiriliyordu.
 * Şimdi düzenleme var; ama yeniden hesaplama SADECE kriter değiştiğinde yapılmalı — sırf adı
 * düzelten kişi de aynı bildirim seline maruz kalmamalı.
 */
const criteriaOf = (x) => JSON.stringify([x.query, x.locationQuery, x.serviceQuery, x.filters]);
const shouldRecompute = (before, after) => criteriaOf(before) !== criteriaOf(after);
const BASE_SEARCH = { name: "Ucuz BMW", query: "BMW", locationQuery: "", serviceQuery: "", filters: { maxPrice: "500000" } };
eq(shouldRecompute(BASE_SEARCH, { ...BASE_SEARCH, name: "Uygun BMW" }), false,
   "yalnızca ad değişince 'görülenler' yeniden hesaplanmıyor (bildirim seli olmasın)");
eq(shouldRecompute(BASE_SEARCH, { ...BASE_SEARCH, filters: { maxPrice: "700000" } }), true,
   "filtre değişince yeniden hesaplanıyor");
eq(shouldRecompute(BASE_SEARCH, { ...BASE_SEARCH, query: "Audi" }), true, "arama metni değişince yeniden hesaplanıyor");
eq(shouldRecompute(BASE_SEARCH, { ...BASE_SEARCH, locationQuery: "İzmir" }), true, "konum değişince yeniden hesaplanıyor");
eq(shouldRecompute(BASE_SEARCH, { ...BASE_SEARCH }), false, "hiçbir şey değişmediyse dokunulmuyor");

// Kuralın KODDA da böyle olduğunu doğrula: yukarıdaki tablo doğru ama uygulanmıyorsa değersiz.
const providerSrc = readFileSync(new URL("../frontend/src/app/state/AppLogicProvider.tsx", import.meta.url), "utf8");
const editFn = providerSrc.slice(providerSrc.indexOf("const saveSavedSearchEdits"), providerSrc.indexOf("const removeSavedSearch"));
eq(/criteriaChanged/.test(editFn) && /if \(criteriaChanged\)[\s\S]{0,160}seenListingIds/.test(editFn), true,
   "kod da 'görülenler'i yalnızca kriter değişince yeniden hesaplıyor");
eq(/setEditingSavedSearchId\(null\)/.test(editFn), true, "kaydettikten sonra pencere kapanıyor");

report("arama");
