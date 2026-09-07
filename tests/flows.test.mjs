// UÇTAN UCA AKIŞLAR — kullanıcı yolculuklarının iş mantığı, sahte bir API üzerinde.
// Bu takım "düğme çalışıyor mu" değil, "akışın sonunda veri DOĞRU mu" sorusunu yanıtlıyor:
// randevu yaşam döngüsü, teklif alışverişi, rol duyarlı tercih kaydı, karşılaştırma listesi.
import { eq, ok, report } from "./_harness.mjs";

// ---- Sahte kalıcılık: hangi tabloya ne yazıldığını kaydeder -----------------------------------
const makeApi = () => { const w = []; return { w, update: (table, id, patch) => w.push({ table, id, patch }) }; };

// ---- 1) Randevu yaşam döngüsü ----------------------------------------------------------------
const AUTO = ["Onay Bekliyor", "Sırada", "Tamire Alındı", "Tamir Tamamlandı"];
const advance = (s) => AUTO[Math.min(AUTO.indexOf(s) + 1, AUTO.length - 1)];
eq(advance("Onay Bekliyor"), "Sırada", "randevu: onay → sırada");
eq(advance("Sırada"), "Tamire Alındı", "randevu: sırada → tamire alındı");
eq(advance("Tamire Alındı"), "Tamir Tamamlandı", "randevu: tamire alındı → tamamlandı");
eq(advance("Tamir Tamamlandı"), "Tamir Tamamlandı", "randevu: son durumda takılı kalmıyor");
// Reddedilen/gelmeyen randevu akışa geri dönmemeli
eq(["Reddedildi", "Gelmedi", "İptal Edildi"].every(s => !AUTO.includes(s)), true,
   "randevu: iptal/ret/gelmedi otomatik akışın dışında");

// ---- 2) Teklif akışı --------------------------------------------------------------------------
const respondOffer = (listing, offerId, status) => {
  const offers = listing.offers.map(o => o.id === offerId ? { ...o, status } : o);
  return { ...listing, offers, ...(status === "accepted" ? { status: "sold" } : {}) };
};
let L = { id: 7, status: "active", offers: [{ id: 1, status: "pending", amount: 100 }, { id: 2, status: "pending", amount: 90 }] };
let L2 = respondOffer(L, 2, "rejected");
eq(L2.status, "active", "teklif reddi ilanı satılmış yapmamalı");
eq(L2.offers.find(o => o.id === 1).status, "pending", "reddedilen teklif diğerini etkilememeli");
let L3 = respondOffer(L2, 1, "accepted");
eq(L3.status, "sold", "teklif kabulü ilanı satıldı yapmalı");
eq(L3.offers.map(o => o.status), ["accepted", "rejected"], "teklif durumları doğru");

// ---- 3) Rol duyarlı tercih kaydı (favori/kayıtlı arama/beğeni) --------------------------------
// Yaşanan hata: hepsi koşulsuz owners tablosuna yazıyordu; tamirci girişinde /api/owners/null'a
// gidip sessizce başarısız oluyordu — tamircide favori, kayıtlı arama, beğeni ÇALIŞMIYORDU.
const persistMyPrefs = (api, { ownerId, mechanicId }, patch) => {
  if (ownerId != null) return api.update("owners", ownerId, patch);
  if (mechanicId != null) return api.update("mechanics", mechanicId, patch);
};
let api = makeApi();
persistMyPrefs(api, { ownerId: 5, mechanicId: null }, { favoriteIds: [1] });
persistMyPrefs(api, { ownerId: null, mechanicId: 9 }, { favoriteMechanicIds: [3] });
persistMyPrefs(api, { ownerId: null, mechanicId: null }, { favoriteIds: [2] });   // misafir: yazma yok
eq(api.w.map(x => `${x.table}/${x.id}`), ["owners/5", "mechanics/9"], "tercih doğru tabloya yazılıyor, misafirde yazılmıyor");

// ---- 4) Favori aç/kapa + analitik olayı --------------------------------------------------------
// Yaşanan hata: favoriden ÇIKARMA da "favorite_added" olarak sayılıyordu.
const toggleFav = (ids, id, track) => { const adding = !ids.includes(id); if (adding) track.push(id); return adding ? [...ids, id] : ids.filter(x => x !== id); };
let ev = []; let favs = [];
favs = toggleFav(favs, 4, ev); favs = toggleFav(favs, 4, ev); favs = toggleFav(favs, 4, ev);
eq(favs, [4], "favori aç/kapa/aç doğru sonuçlanıyor");
eq(ev, [4, 4], "olay yalnızca EKLERKEN gönderiliyor (çıkarırken değil)");

// ---- 5) Karşılaştırma listesi kalıcılığı ------------------------------------------------------
// Yaşanan hata: sayfa yenilenince ya da detaydan geri dönünce seçim siliniyordu.
const pruneCompare = (ids, listings) => { const live = ids.filter(id => listings.some(l => l.id === id)); return live.length === ids.length ? ids : live; };
const listings = [{ id: 1 }, { id: 2 }];
const sel = [1, 2];
ok(pruneCompare(sel, listings) === sel, "liste değişmediyse AYNI dizi referansı dönmeli (sonsuz render döngüsü olmasın)");
eq(pruneCompare([1, 2, 99], listings), [1, 2], "silinmiş ilan karşılaştırmadan düşüyor");

// ---- 6) Çalışma saatleri: kapanış saati ve kapalı gün ------------------------------------------
const genSlots = (start, end) => { const out = []; let [h, m] = start.split(":").map(Number); const [eh, em] = end.split(":").map(Number);
  while (h * 60 + m < eh * 60 + em) { out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`); m += 30; if (m >= 60) { m = 0; h++; } } return out; };
eq(genSlots("09:00", "11:00"), ["09:00", "09:30", "10:00", "10:30"], "randevu slotları yarım saatlik ve kapanışı içermiyor");
const daySlots = (day) => day.open ? genSlots(day.start, day.end).filter(s => !day.closedSlots.includes(s)) : [];
eq(daySlots({ open: false, start: "09:00", end: "11:00", closedSlots: [] }), [], "kapalı gün slot vermiyor");
eq(daySlots({ open: true, start: "09:00", end: "11:00", closedSlots: ["09:30"] }), ["09:00", "10:00", "10:30"], "öğle arası slotu düşüyor");

report("akışlar");
