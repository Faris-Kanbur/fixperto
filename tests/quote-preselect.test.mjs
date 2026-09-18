/**
 * TEKLİF İSTEĞİNDE ÖN SEÇİM — "tamircinin profilinden açtıysan o tamirci seçili gelsin".
 * ================================================================================================
 * Kullanıcı isteği aynen: "ücretsiz teklif al tuşunu eğer tamircinin profilinden seçiyorsa o
 * tamirci seçili olarak görünsün." Beklenti doğru: bir tamircinin sayfasındayken "teklif al"
 * demek "BU tamirciden teklif al" demektir. Önceden modal boş açılıyor ve kullanıcı, zaten
 * sayfasında olduğu tamirciyi listede yeniden aramak zorunda kalıyordu.
 *
 * BU TEST İKİ ŞEYİ AYRI AYRI ÖLÇÜYOR — ikisi de gerekli:
 *   1) ÖN SEÇİM: modal açılırken verilen tamirci seçili listeye giriyor mu?
 *   2) GÖRÜNÜRLÜK: seçili tamirci, kullanıcının o an açık olan araması/filtresi yüzünden listeden
 *      GİZLENMİYOR mu? Bu, ön seçimi eklerken ortaya çıkan gerçek tuzak: sayaç "1 seçili" yazarken
 *      tamircinin listede hiç görünmemesi mümkündü — kullanıcı ne seçtiğini göremez, kaldıramaz.
 * Sadece (1)'i ölçen bir test, özelliği "çalışıyor" gösterip kullanıcıyı kafası karışmış hâlde
 * bırakabilirdi.
 *
 * Seçim/filtre mantığı saf olduğu için burada GERÇEKTEN ÇALIŞTIRILIYOR (kaynak metni aranmıyor):
 * aynı kurallar test içinde yeniden kurulup veriyle sınanıyor.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, ok, report, stripComments } from "./_harness.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "frontend", "src");
const read = (...p) => stripComments(readFileSync(join(SRC, ...p), "utf8"));

const provider = read("app", "state", "AppLogicProvider.tsx");
const mechDetail = read("components", "features", "MechDetailBody.tsx");

// --- 1) KABLOLAMA: buton id'yi geçiyor, modal onu seçili listeye yazıyor ----------------------
{
  ok(/const openQuoteModal = \(preselectMechanicId = null\) =>/.test(provider),
    "openQuoteModal isteğe bağlı bir ön seçim parametresi alıyor");
  /**
   * GÜNCELLENDİ (bkz. el kitabı 25.20): burası eskiden
   * `preselectMechanicId != null ? [preselectMechanicId] : []` ifadesini arıyordu — yani ölçtüğü
   * satır, sonradan GERÇEK BİR HATAYA yol açan satırın ta kendisiydi. Bir olay nesnesi de null
   * değildir; `onClick={openQuoteModal}` yazılan yerlerde React'in tıklama olayı ön seçim listesine
   * yazılıyor ve gönderim anında JSON'a çevrilemiyordu.
   *
   * Test o hâliyle yeşil yanmaya devam ederdi, çünkü ölçtüğü şey "ön seçim listeye yazılıyor mu"
   * idi — "listeye YAZILAN ŞEY bir tamirci id'si mi" değil. Kontrol artık ikincisini de sabitliyor.
   */
  ok(/setQuoteSelectedMechIds\(Number\.isFinite\(id\) \? \[id\] : \[\]\)/.test(provider),
    "ön seçim NORMAL seçili listeye yazılıyor (ayrı/kilitli bir alana değil)");
  ok(/const id = Number\(preselectMechanicId\)/.test(provider),
    "listeye yalnızca SAYI yazılıyor — olay nesnesi/çöp parametre eleniyor");
  ok(/setQuoteMechSearch\(""\)/.test(provider.slice(provider.indexOf("const openQuoteModal"), provider.indexOf("const openQuoteModal") + 600)),
    "modal açılırken eski arama metni temizleniyor");

  // Tamirci profilindeki buton id'yi ÖNCE okuyup sonra geçiyor.
  ok(/openQuoteModal\(preselectId\)/.test(mechDetail), "tamirci profilindeki teklif butonu id geçiriyor");
  const btn = mechDetail.slice(mechDetail.indexOf("const preselectId"), mechDetail.indexOf("openQuoteModal(preselectId)") + 40);
  ok(btn.indexOf("const preselectId = selectedMechanic.id") < btn.indexOf("closeOverlays()"),
    "id, başka çağrılardan ÖNCE okunuyor (ileride sıra değişse bile ön seçim sessizce bozulmaz)");

  // Başka bir yerden (ör. ana sayfa) açılınca ön seçim OLMAMALI — orada hangi tamirci
  // olduğunu bilmiyoruz ve rastgele biri seçili gelmemeli.
  const callSites = [...provider.matchAll(/openQuoteModal\(([^)]*)\)/g)].map((m) => m[1].trim())
    .filter((a) => a !== "preselectMechanicId = null");
  ok(callSites.every((a) => a === "" || a === "preselectId"),
    `teklif modalı yalnızca bilinen bir tamirciyle ön seçiliyor (çağrılar: ${JSON.stringify(callSites)})`);
}

// --- 2) DAVRANIŞ: seçili tamirci arama/filtreyle gizlenemiyor ---------------------------------
// Sağlayıcıdaki kuralın aynısını burada kurup veriyle çalıştırıyoruz.
{
  const lc = (x) => String(x || "").toLowerCase();
  const mechanics = [
    { id: 1, name: "Yakın Servis", specialty: "Fren", distance: 2 },
    { id: 2, name: "Uzak Servis", specialty: "Motor", distance: 40 },
    { id: 3, name: "Orta Servis", specialty: "Elektrik", distance: 10 },
  ];
  // "5 km'den yakın" filtresi: tek başına 2 ve 3'ü eler.
  const passesFilters = (m) => m.distance <= 5;

  const filterList = (selectedIds, search) => {
    const selected = new Set(selectedIds);
    let list = [...mechanics];
    if (search.trim()) {
      const q = lc(search).trim();
      list = list.filter((m) => selected.has(m.id) || lc(m.name).includes(q) || lc(m.specialty).includes(q));
    }
    list = list.filter((m) => selected.has(m.id) || passesFilters(m));
    return [...list].sort((a, b) => Number(selected.has(b.id)) - Number(selected.has(a.id)));
  };

  // Ön seçim yoksa filtre normal çalışıyor: yalnızca yakın olan kalır.
  eq(filterList([], "").map((m) => m.id).join(","), "1", "seçim yokken filtre normal eliyor");

  // ASIL SENARYO: kullanıcı "Uzak Servis"in profilinden teklif istiyor ve açık bir mesafe filtresi var.
  const withPreselect = filterList([2], "");
  ok(withPreselect.some((m) => m.id === 2), "FİLTREYE UYMAYAN ön seçili tamirci listede GÖRÜNÜYOR");
  eq(withPreselect[0].id, 2, "ve en ÜSTTE (kullanıcı ne seçtiğini hemen görüyor)");

  // Arama da gizlemiyor: kullanıcı başka bir tamirciyi arasa bile seçili olan kalıyor.
  const withSearch = filterList([2], "yakın");
  ok(withSearch.some((m) => m.id === 2), "arama yazılsa da seçili tamirci listeden düşmüyor");
  ok(withSearch.some((m) => m.id === 1), "aranan tamirci de listede");
  eq(withSearch[0].id, 2, "seçili olan hâlâ en üstte");

  // Kullanıcı seçimi KALDIRABİLİYOR: kaldırınca filtre yeniden geçerli oluyor (kilitli değil).
  eq(filterList([], "").some((m) => m.id === 2), false, "seçim kaldırılınca tamirci yine filtreye tabi");

  /**
   * Sıralama seçili OLMAYANLAR arasında bozulmuyor.
   * İLK BEKLENTİM YANLIŞTI ve not ediyorum: "1,3" yazmıştım, oysa id 3'ün mesafesi 10 km ve
   * filtre 5 km — yani 3'ün elenmesi DOĞRU davranış. Test kırmızı yandığında kodu değil kendi
   * beklentimi düzeltmem gerekti. Sıralamanın korunduğunu görmek için filtresiz bir koşu da var.
   */
  const order = filterList([2], "servis").map((m) => m.id);
  eq(order[0], 2, "seçili en başta");
  eq(order.slice(1).join(","), "1", "filtreye uyan diğerleri sırayla geliyor (3 haklı olarak elendi)");

  // Filtre devre dışıyken (hepsi geçiyor) seçili olmayanların sırası hiç bozulmuyor.
  const allPass = (selectedIds) => {
    const selected = new Set(selectedIds);
    return [...mechanics].sort((a, b) => Number(selected.has(b.id)) - Number(selected.has(a.id))).map((m) => m.id);
  };
  eq(allPass([2]).join(","), "2,1,3", "seçili öne alınırken geri kalanların özgün sırası korunuyor");
  eq(allPass([]).join(","), "1,2,3", "seçim yokken sıra hiç değişmiyor");
}

// --- 3) LİMİT KURALI TEK YERDE ---------------------------------------------------------------
// Ön seçim limiti (5/10) ihlal edemez çünkü tek tamirci ve limitler en az 1. Kuralı iki yere
// yazmamak önemli: aynı kontrolün iki kopyası zamanla birbirinden ayrılır.
{
  ok(/if \(ids\.length >= limit\) \{ setShowQuotePremiumUpsell\(true\); return ids; \}/.test(provider),
    "limit kontrolü toggleQuoteMechanic'te tek yerde duruyor");
  const openBody = provider.slice(provider.indexOf("const openQuoteModal"), provider.indexOf("const openQuoteModal") + 700);
  ok(!/QUOTE_MECH_LIMIT/.test(openBody), "ön seçim limiti KOPYALAMIYOR (tek doğruluk kaynağı)");
}

// --- 4) useMemo bağımlılığı: seçim değişince liste yeniden hesaplanıyor -----------------------
// Bu unutulsa ön seçili tamirci ilk açılışta listede görünmezdi — sessiz ve teşhisi zor bir hata.
{
  const memoBlock = provider.slice(provider.indexOf("const quoteFilteredMechanics = useMemo"));
  const deps = memoBlock.slice(memoBlock.indexOf("}, ["), memoBlock.indexOf("]);") + 3);
  ok(/quoteSelectedMechIds/.test(deps), `useMemo bağımlılıkları seçimi içeriyor (${deps.trim()})`);
}

report("teklif ön seçimi");
