// HİZMET FİYATLANDIRMA — marka bazlı fiyat + türetilen başlangıç fiyatı.
// ATU modeli: aynı iş markaya göre farklı tutabilir (kapı tamiri BMW'de 100, Toyota'da 50).
import { eq, report } from "./_harness.mjs";

const parsePriceNumber = (p) => parseInt(String(p || "").replace(/[^\d]/g, ""), 10) || 0;
const lc = (v) => String(v ?? "").toLocaleLowerCase("tr-TR");
const CAR_BRANDS_SAMPLE = ["BMW", "Toyota", "Mercedes-Benz", "Citroën", "Tofaş"];
// helpers.ts → brandPriceFor / canonicalBrand ile AYNI mantık.
const brandPriceFor = (service, brand) => {
  const bp = service?.brandPrices;
  if (!bp || !brand) return null;
  const has = (v) => v != null && String(v).trim() !== "";
  if (has(bp[brand])) return String(bp[brand]);
  const key = Object.keys(bp).find((k) => lc(k) === lc(brand));
  return key != null && has(bp[key]) ? String(bp[key]) : null;
};
const canonicalBrand = (value) => {
  const v = String(value ?? "").trim();
  if (!v) return "";
  return CAR_BRANDS_SAMPLE.find((b) => lc(b) === lc(v)) || v;
};
const servicePriceForBrand = (svc, brand) => {
  const o = brandPriceFor(svc, brand);
  return o != null ? o : String(svc?.price ?? "");
};
const startingPriceFromServices = (services) => {
  const nums = [];
  for (const s of services || []) for (const v of [s.price, ...Object.values(s.brandPrices || {})]) {
    const n = parsePriceNumber(v); if (n > 0) nums.push(n);
  }
  return nums.length ? Math.min(...nums) : null;
};
const setServiceBrandPrice = (list, i, brand, value) => list.map((s, k) => {
  if (k !== i) return s;
  const bp = { ...(s.brandPrices || {}) };
  if (String(value).trim() === "") delete bp[brand]; else bp[brand] = String(value).replace(/[^\d]/g, "");
  return { ...s, brandPrices: bp };
});
const mechanicStartingPrice = (m) => startingPriceFromServices(m?.services) ?? (Number(m?.price) || 0);

const door = { key: "body_repair", price: "80", fixed: true, brandPrices: { BMW: "100", Toyota: "50" } };
eq(servicePriceForBrand(door, "BMW"), "100", "BMW marka fiyatı");
eq(servicePriceForBrand(door, "Toyota"), "50", "Toyota marka fiyatı");
eq(servicePriceForBrand(door, "Fiat"), "80", "listede olmayan marka → varsayılan");
eq(servicePriceForBrand(door, null), "80", "marka seçilmemiş → varsayılan");
eq(servicePriceForBrand({ price: "300", brandPrices: { Opel: "" } }, "Opel"), "300", "boş override → varsayılan (0 gösterme)");

let l = [{ price: "300", brandPrices: { Opel: "250" } }];
l = setServiceBrandPrice(l, 0, "Opel", "");
eq(l[0].brandPrices, {}, "boşaltılan marka anahtarı siliniyor");
l = setServiceBrandPrice(l, 0, "BMW", "1.200 TL");
eq(l[0].brandPrices, { BMW: "1200" }, "girdi temizleniyor (sadece rakam)");

eq(startingPriceFromServices([door]), 50, "başlangıç fiyatı marka fiyatlarını da tarıyor");
eq(startingPriceFromServices([{ price: "900" }, { price: "300" }]), 300, "en düşük varsayılan fiyat");
eq(startingPriceFromServices([{ price: "" }, { price: "0" }]), null, "fiyatsız hizmet → null");
eq(startingPriceFromServices([]), null, "hiç hizmet yok → null");
eq(startingPriceFromServices([{ price: "350₺" }, { price: "600₺" }]), 350, "eski '350₺' biçimi okunuyor");
eq(mechanicStartingPrice({ services: [], price: 400 }), 400, "hizmet yoksa eski price korunuyor");
eq(mechanicStartingPrice({ services: [door], price: 400 }), 50, "hizmet varsa türetilen fiyat kazanıyor");

// --- MARKA EŞLEŞMESİ: elle yazılmış eski araç kayıtları da doğru fiyatı görmeli --------------
// GERÇEK HATA: marka seçici gelmeden önce araç sahibi markayı elle yazıyordu. "bmw" yazan kişi
// tamircinin "BMW" anahtarıyla eşleşmiyor, kendi markasının fiyatı yerine varsayılanı görüyordu.
// Aşağıdaki testler bu düzeltmeyi kilitliyor — eski kayıtlar için de geçerli olmalı.
eq(servicePriceForBrand(door, "bmw"), "100", "küçük harf 'bmw' → BMW fiyatı");
eq(servicePriceForBrand(door, "  BMW  "), "80", "boşluklu ham metin normalize EDİLMEDEN eşleşmez (kayıt anında temizleniyor)");
eq(servicePriceForBrand(door, canonicalBrand("  bmw ")), "100", "kayıt anında normalize edilen marka eşleşiyor");
eq(canonicalBrand("mercedes-benz"), "Mercedes-Benz", "listedeki resmi yazıma çevriliyor");
eq(canonicalBrand("citroën"), "Citroën", "aksanlı marka adı korunuyor");
eq(canonicalBrand("TOFAŞ"), "Tofaş", "tr-TR büyük/küçük harf (İ/ı) doğru");
eq(canonicalBrand("Togg"), "Togg", "listede olmayan marka aynen kalıyor (seçim zorunlu değil)");
eq(canonicalBrand(""), "", "boş marka boş kalıyor");
eq(canonicalBrand(null), "", "null marka çökmüyor");
eq(brandPriceFor({ price: "300" }, "BMW"), null, "marka fiyatı yoksa null (varsayılana düşer)");
eq(brandPriceFor(door, null), null, "marka seçilmemişse null");
// Eski (hatalı) davranışın gerçekten hatalı olduğunu kanıtla: düz nesne erişimi eşleşmiyordu.
eq(door.brandPrices["bmw"], undefined, "kanıt: düz anahtar erişimi 'bmw' ile eşleşmiyordu");

// --- SEÇİLİ HİZMET, ARAÇ DEĞİŞİNCE TAZELENİR ------------------------------------------------
// Yakalanan hata: hizmet seçilince fiyatı anlık kopya olarak saklanıyor. Kişi önce hizmeti seçip
// sonra aracını değiştirince liste yeni markaya göre güncelleniyor ama ÖZET KARTI eski fiyatta
// kalıyordu. Aşağıdaki model AppLogicProvider'daki tazeleme etkisinin aynısı.
const refreshSelected = (selected, options) => {
  if (!selected || selected.other) return selected;
  const fresh = options.find((s) => s.name === selected.name);
  if (!fresh || fresh.price === selected.price) return selected;
  return { ...selected, price: fresh.price, fixed: fresh.fixed };
};
const bmwList = [{ name: "Kaporta", price: "100₺", fixed: true }];
const toyotaList = [{ name: "Kaporta", price: "50₺", fixed: true }];
const picked = { name: "Kaporta", price: "100₺", other: false, fixed: true };
eq(refreshSelected(picked, toyotaList).price, "50₺", "araç değişince seçili hizmetin fiyatı tazeleniyor");
eq(refreshSelected(picked, bmwList), picked, "fiyat aynıysa nesne değişmiyor (sonsuz döngü olmaz)");
eq(refreshSelected(refreshSelected(picked, toyotaList), toyotaList).price, "50₺", "tazeleme tekrarlanabilir (kararlı)");
eq(refreshSelected(picked, []), picked, "liste arama ile filtrelenmişse dokunulmuyor");
eq(refreshSelected({ name: "Diğer", price: null, other: true }, toyotaList).price, null, "'Diğer' seçimi fiyatsız kalıyor");
eq(refreshSelected(null, toyotaList), null, "hiç seçim yoksa çökmüyor");

report("fiyatlandırma");
