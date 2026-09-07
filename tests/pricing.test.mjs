// HİZMET FİYATLANDIRMA — marka bazlı fiyat + türetilen başlangıç fiyatı.
// ATU modeli: aynı iş markaya göre farklı tutabilir (kapı tamiri BMW'de 100, Toyota'da 50).
import { eq, report } from "./_harness.mjs";

const parsePriceNumber = (p) => parseInt(String(p || "").replace(/[^\d]/g, ""), 10) || 0;
const servicePriceForBrand = (svc, brand) => {
  const o = brand ? svc?.brandPrices?.[brand] : null;
  return (o != null && String(o).trim() !== "") ? String(o) : String(svc?.price ?? "");
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

report("fiyatlandırma");
