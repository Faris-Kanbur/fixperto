/**
 * YÜKLEME HAZIRLIĞI — GERÇEK KOD, SAHTE TARAYICI.
 * ================================================================================================
 * Bu takım utils/mediaUpload.ts'i GERÇEKTEN çalıştırıyor. Kaynak kodda desen aramıyor; işlevi
 * çağırıp ne DÖNDÜRDÜĞÜNE bakıyor. Bunun için dört tarayıcı API'si taklit ediliyor:
 * FileReader, Image, document.createElement("canvas") ve 2D bağlam.
 *
 * DÜRÜST SINIR — BURADA TEST EDİLMEYEN ŞEY:
 * Gerçek JPEG kodlaması. Sahte tuval, boyutla ORANTILI uzunlukta bir metin üretiyor; yani
 * "1600px'e küçültülünce veri azalıyor" ilişkisi korunuyor ama gerçek bir fotoğrafın gerçek
 * kalite kaybı ölçülmüyor. Ölçülen şey KARAR MANTIĞI: doğru boyut seçiliyor mu, saydam PNG
 * korunuyor mu, sonuç büyüdüyse orijinale dönülüyor mu, tavan aşılınca hata metni doğru mu,
 * görsel çözülemezse veri kaybediliyor mu. Gerçek sıkıştırma oranı ancak tarayıcıda ölçülebilir
 * ve ilan fotoğraflarında bu yol zaten aylardır üretimde.
 */
const ROOT = new URL("../../", import.meta.url).pathname;

let passed = 0;
const failures = [];
const ok = (v, name) => { if (v) passed++; else failures.push(name); };
/**
 * Kısalt: burada karşılaştırılan değerler data URI, yani on binlerce karakter. Ham hâlde basmak
 * hata çıktısını okunamaz hâle getiriyordu (ilk denemede 65 KB'lık tek satır). Bir testin
 * başarısızlık mesajı okunamıyorsa test yarım iş görür.
 */
const short = (v) => {
  const s = String(v);
  return s.length > 70 ? `${s.slice(0, 40)}…(${s.length} karakter)` : s;
};
const eq = (got, want, name) => ok(got === want, `${name} (beklenen: ${short(want)}, gelen: ${short(got)})`);

// ============================================================ SAHTE TARAYICI
/**
 * Sahte tuval: `toDataURL` boyutla orantılı veri üretiyor. Katsayılar gerçekçi seçildi —
 * JPEG q0.78 tipik olarak piksel başına ~0,25 bayt, PNG ise kayıpsız olduğu için ~3 kat fazla.
 * Amaç gerçek kodlayıcıyı taklit etmek değil, "küçültmek veriyi azaltır" ve "PNG daha büyüktür"
 * ilişkilerinin doğru yönde olmasını sağlamak.
 */
let lastCanvas = null;
function installFakeBrowser({ transparent = false, decodable = true, imageSize = [4000, 3000], taintCanvas = false } = {}) {
  const alpha = transparent ? 0 : 255;
  globalThis.document = {
    createElement: (tag) => {
      if (tag !== "canvas") return {};
      const canvas = {
        width: 0, height: 0,
        getContext: () => ({
          drawImage: () => { canvas.drawn = true; },
          getImageData: (x, y, w, h) => {
            if (taintCanvas) throw new Error("SecurityError: tainted canvas");
            const data = new Uint8ClampedArray(w * h * 4);
            for (let i = 3; i < data.length; i += 4) data[i] = alpha;
            return { data };
          },
        }),
        toDataURL: (type, q) => {
          const px = canvas.width * canvas.height;
          const perPx = type === "image/png" ? 0.75 : 0.25 * (q ?? 0.8);
          canvas.lastType = type;
          return `data:${type};base64,` + "A".repeat(Math.max(4, Math.round(px * perPx)));
        },
      };
      lastCanvas = canvas;
      return canvas;
    },
  };
  globalThis.Image = class {
    constructor() { this.width = imageSize[0]; this.height = imageSize[1]; }
    set src(_v) {
      // Tarayıcıda olduğu gibi eşzamansız.
      setTimeout(() => (decodable ? this.onload?.() : this.onerror?.()), 0);
    }
  };
  globalThis.FileReader = class {
    readAsDataURL(file) {
      setTimeout(() => {
        this.result = file.__dataUrl;
        this.onload?.();
      }, 0);
    }
  };
}

/** Sahte dosya: tür, ad ve "okununca dönecek data URI" birlikte. */
const fakeFile = (type, name, dataUrlBytes) => ({
  type, name,
  __dataUrl: `data:${type};base64,` + "A".repeat(Math.round(dataUrlBytes * 4 / 3)),
});

const prepare = (mod, file, preset) => new Promise((res) => mod.prepareImageForUpload(file, preset, res));
const prepareDoc = (mod, file) => new Promise((res) => mod.prepareDocumentForUpload(file, res));

installFakeBrowser();
const mod = await import(ROOT + "frontend/src/utils/mediaUpload.ts");

// ============================================================ SUNUCUYLA TUTARLILIK
/**
 * BU TAKIMIN EN ÖNEMLİ BÖLÜMÜ.
 * İstemci tavanları ile sunucu tavanları AYRI dosyalarda yaşıyor. Ayrışırlarsa sonuç şu olur:
 * istemci dosyayı gönderir, sunucu reddeder, kullanıcı sebebini anlamadığı bir hata görür —
 * ya da tersi, istemci meşru bir dosyayı boşuna engeller. O yüzden iki dosya karşılaştırılıyor.
 */
const serverSrc = await import("node:fs").then((fs) =>
  fs.readFileSync(ROOT + "backend/utils/mediaValidation.js", "utf8"));
const serverLimit = (key) => {
  const m = serverSrc.match(new RegExp(`${key}:\\s*(\\d+)\\s*\\*\\s*1024\\s*\\*\\s*1024`));
  return m ? Number(m[1]) * 1024 * 1024 : null;
};
eq(mod.SERVER_LIMITS.image, serverLimit("single"), "istemci görsel tavanı = sunucu tavanı");
eq(mod.SERVER_LIMITS.avatar, serverLimit("avatar"), "istemci avatar tavanı = sunucu tavanı");
eq(mod.SERVER_LIMITS.document, serverLimit("document"), "istemci belge tavanı = sunucu tavanı");

// approxBytes iki tarafta aynı hesabı yapmalı; yoksa biri "2,1 MB" derken diğeri "1,9 MB" der.
ok(/length\s*\*\s*0\.75/.test(serverSrc), "sunucu approxBytes aynı formülü kullanıyor (uzunluk × 0,75)");
eq(mod.approxBytes("data:image/jpeg;base64," + "A".repeat(1000)), Math.floor(1023 * 0.75),
  "approxBytes istemcide de uzunluk × 0,75");

// Her ön ayarın tavanı bir sunucu tavanına eşit olmalı — uydurma bir sayı olmamalı.
for (const [name, p] of Object.entries(mod.IMAGE_PRESETS)) {
  ok(Object.values(mod.SERVER_LIMITS).includes(p.limit), `${name} ön ayarının tavanı sunucudan geliyor`);
  ok(p.maxDim >= 512 && p.maxDim <= 2048, `${name} hedef boyutu makul aralıkta (${p.maxDim}px)`);
  ok(p.quality >= 0.7 && p.quality <= 0.9, `${name} kalitesi makul aralıkta (${p.quality})`);
}
ok(mod.IMAGE_PRESETS.avatar.maxDim < mod.IMAGE_PRESETS.listing.maxDim,
  "avatar hedefi ilandan küçük (ekranda 40-120px gösteriliyor)");
ok(mod.IMAGE_PRESETS.avatar.limit < mod.IMAGE_PRESETS.listing.limit, "avatar tavanı ilandan dar");

// ============================================================ KÜÇÜLTME GERÇEKTEN OLUYOR MU
{
  // 4000x3000 telefon fotoğrafı, 6 MB ham.
  const r = await prepare(mod, fakeFile("image/jpeg", "kamera.jpg", 6 * 1024 * 1024), "listing");
  ok(r.finalBytes < r.originalBytes, `ilan fotoğrafı küçüldü (${Math.round(r.originalBytes/1024)} KB → ${Math.round(r.finalBytes/1024)} KB)`);
  ok(!r.tooLarge, "küçültülmüş ilan fotoğrafı tavanın altında");
  eq(r.error, null, "geçerli fotoğrafta hata yok");
  eq(lastCanvas.width, 1600, "en uzun kenar 1600'e indirildi");
  eq(lastCanvas.height, 1200, "en-boy oranı korundu (4:3 → 1600x1200)");
  eq(lastCanvas.lastType, "image/jpeg", "saydamlık yoksa JPEG");
}
{
  // Aynı dosya avatar olarak: 512px hedefi çok daha küçük sonuç vermeli.
  const r = await prepare(mod, fakeFile("image/jpeg", "profil.jpg", 6 * 1024 * 1024), "avatar");
  eq(lastCanvas.width, 512, "avatar 512px'e indirildi");
  ok(!r.tooLarge, "avatar tavanın altında");
  const listing = await prepare(mod, fakeFile("image/jpeg", "a.jpg", 6 * 1024 * 1024), "listing");
  ok(r.finalBytes < listing.finalBytes, "avatar sonucu ilan sonucundan küçük");
}
{
  // Zaten küçük bir görsel: küçültme uygulanmamalı (büyütme YOK).
  installFakeBrowser({ imageSize: [300, 200] });
  const r = await prepare(mod, fakeFile("image/jpeg", "kucuk.jpg", 20 * 1024), "listing");
  eq(lastCanvas.width, 300, "300px'lik görsel 1600'e BÜYÜTÜLMÜYOR");
  installFakeBrowser();
}

// ============================================================ SAYDAM PNG KORUNUYOR MU
{
  installFakeBrowser({ transparent: true, imageSize: [800, 800] });
  const r = await prepare(mod, fakeFile("image/png", "logo.png", 400 * 1024), "cover");
  eq(lastCanvas.lastType, "image/png", "saydam PNG, PNG olarak kalıyor (arka planı siyaha boyanmıyor)");
  ok(r.dataUrl.startsWith("data:image/png"), "sonuç PNG");
}
{
  installFakeBrowser({ transparent: false, imageSize: [800, 800] });
  await prepare(mod, fakeFile("image/png", "opak.png", 400 * 1024), "cover");
  eq(lastCanvas.lastType, "image/jpeg", "saydam OLMAYAN PNG, JPEG'e çevriliyor (kazanç burada)");
}
{
  // Tuval "kirlenmişse" getImageData atar. Güvenli varsayım: saydamlık VAR (kayıpsız taraf).
  installFakeBrowser({ taintCanvas: true, imageSize: [800, 800] });
  await prepare(mod, fakeFile("image/png", "dis.png", 400 * 1024), "cover");
  eq(lastCanvas.lastType, "image/png", "getImageData hata verirse PNG'de kalınıyor (kayıpsız taraf seçiliyor)");
  installFakeBrowser();
}

// ============================================================ HİÇBİR ŞEY SESSİZCE BOZULMUYOR
{
  // Çözülemeyen dosya (bazı tarayıcılarda HEIC, ya da SVG): ham veri dönmeli, KAYBOLMAMALI.
  installFakeBrowser({ decodable: false });
  const file = fakeFile("image/heic", "iphone.heic", 300 * 1024);
  const r = await prepare(mod, file, "listing");
  eq(r.dataUrl, file.__dataUrl, "çözülemeyen görselde ham veri korunuyor (kullanıcının dosyası kaybolmuyor)");
  eq(r.error, null, "çözülemeyen ama küçük dosyada hata yok");
  installFakeBrowser();
}
{
  /**
   * Sıkıştırma dosyayı BÜYÜTÜRSE orijinal dönmeli.
   * Gerçek örnek: 2000x2000 ama düz renk/az detaylı bir PNG diskte 1 KB olabilir; onu 512px'e
   * indirip JPEG'e çevirmek onlarca KB üretir. "İyileştirme" adı altında dosyayı büyütmek kabul
   * edilemez, o yüzden kod sonucu orijinalle karşılaştırıyor.
   */
  installFakeBrowser({ imageSize: [2000, 2000] });
  const file = fakeFile("image/png", "duz-renk.png", 1024);
  const r = await prepare(mod, file, "avatar");
  eq(r.dataUrl, file.__dataUrl, "sıkıştırma büyütüyorsa orijinal korunuyor");
  installFakeBrowser();
}
{
  // FileReader hata verirse kullanıcı sebebini görmeli, sessiz başarısızlık olmamalı.
  const prev = globalThis.FileReader;
  globalThis.FileReader = class { readAsDataURL() { setTimeout(() => this.onerror?.(), 0); } };
  const r = await prepare(mod, fakeFile("image/jpeg", "bozuk.jpg", 100), "listing");
  ok(typeof r.error === "string" && r.error.length > 0, "okuma hatasında kullanıcıya mesaj var");
  globalThis.FileReader = prev;
}

// ============================================================ TAVAN AŞILINCA NE OLUYOR
{
  // Çözülemeyen ÇOK BÜYÜK dosya: küçültülemediği için tavanı aşıyor → net hata.
  installFakeBrowser({ decodable: false });
  const r = await prepare(mod, fakeFile("image/heic", "dev.heic", 5 * 1024 * 1024), "listing");
  ok(r.tooLarge, "küçültülemeyen 5 MB dosya tavanı aşıyor olarak işaretlendi");
  ok(/MB/.test(r.error || ""), "hata mesajı BOYUTU söylüyor");
  ok(/(En fazla|en fazla)/.test(r.error || ""), "hata mesajı SINIRI da söylüyor");
  ok(/(küçük|seçin)/.test(r.error || ""), "hata mesajı NE YAPILACAĞINI söylüyor");
  installFakeBrowser();
}

// ============================================================ BELGE (CV) YOLU
{
  const r = await prepareDoc(mod, fakeFile("application/pdf", "cv.pdf", 800 * 1024));
  ok(r.dataUrl.startsWith("data:application/pdf"), "CV kalıcı data URI olarak hazırlanıyor (blob: DEĞİL)");
  eq(r.name, "cv.pdf", "dosya adı korunuyor");
  ok(!r.tooLarge, "800 KB CV kabul ediliyor");
  eq(r.error, null, "geçerli CV'de hata yok");
}
{
  const r = await prepareDoc(mod, fakeFile("application/pdf", "buyuk.pdf", 6 * 1024 * 1024));
  ok(r.tooLarge, "6 MB CV reddediliyor (sunucu tavanı 4 MB)");
  ok(/MB/.test(r.error || ""), "CV hatası boyutu söylüyor");
}
{
  // PDF'e tuval UYGULANMAMALI — yeniden kodlamak dosyayı bozar.
  lastCanvas = null;
  await prepareDoc(mod, fakeFile("application/pdf", "cv.pdf", 100 * 1024));
  eq(lastCanvas, null, "belge yolunda tuval hiç kullanılmıyor (PDF yeniden kodlanmıyor)");
}

// ============================================================ FAZ 4: HANGİ GÖRSEL ADRESE GİDİYOR
/**
 * BU BÖLÜM BİR GİZLİLİK KARARINI KORUYOR, PERFORMANS AYARINI DEĞİL.
 * `/media/...` adresleri KİMLİK DOĞRULAMASI OLMADAN okunuyor — cache'lenebilir olmanın koşulu bu.
 * Dolayısıyla oraya yalnızca bugün ZATEN herkese açık görseller gidebilir. Sohbet, arıza ve
 * teklif fotoğrafı bugün yalnızca erişim denetimli JSON içinde dönüyor; onları tahmin edilemez
 * ama herkese açık bir adrese taşımak güvenlik gerilemesi olurdu (adres sızarsa kişisel veri
 * kimlik doğrulaması olmadan okunur).
 *
 * Bu testler "hosted bayrağı doğru mu" diye soruyor. Biri ileride performans için chat'i de
 * hosted yaparsa burada kırmızı yanacak — ve sebebini okuyacak.
 */
{
  const PUBLIC = ["listing", "cover", "avatar"];
  const PRIVATE = ["chat", "issue", "quote"];
  for (const p of PUBLIC) ok(mod.IMAGE_PRESETS[p].hosted === true, `${p} herkese açık → medya ucuna gidiyor`);
  for (const p of PRIVATE) {
    ok(mod.IMAGE_PRESETS[p].hosted === false,
      `${p} ÖZEL → data: URI olarak kalıyor (herkese açık adrese taşımak güvenlik gerilemesi olurdu)`);
  }
  // Tüm ön ayarlar karar vermiş olmalı: eksik bayrak "undefined" olur ve sessizce özel sayılırdı.
  for (const [name, spec] of Object.entries(mod.IMAGE_PRESETS)) {
    ok(typeof spec.hosted === "boolean", `${name} için hosted kararı açıkça verilmiş`);
    ok(spec.kind === "image" || spec.kind === "avatar", `${name} sunucu tavanı türü belirli (${spec.kind})`);
  }
  ok(mod.IMAGE_PRESETS.avatar.kind === "avatar", "avatar, sunucuda AVATAR tavanıyla (1 MB) doğrulanıyor");
}

// ============================================================ FAZ 4: YÜKLEME BAŞARISIZ OLURSA
/**
 * EN ÖNEMLİ FAZ 4 GÜVENCESİ: bu değişiklik hiçbir koşulda mevcut çalışan davranıştan KÖTÜ bir
 * sonuç üretemez. Yükleme başarısız olursa data URI'nin kendisi dönüyor — yani en kötü durum
 * bugünkü hâl. Aşağıdaki senaryolar tek tek ölçülüyor.
 */
{
  const img = "data:image/jpeg;base64," + "A".repeat(4000);
  const okUploader = async () => ({ url: "http://localhost:4000/media/" + "a".repeat(32) + ".jpg" });

  eq(await mod.hostPreparedImage(img, "listing", okUploader), "http://localhost:4000/media/" + "a".repeat(32) + ".jpg",
    "başarılı yüklemede ADRES kaydediliyor");
  eq(await mod.hostPreparedImage(img, "chat", okUploader), img,
    "özel ön ayarda uç HİÇ çağrılmıyor, data URI kalıyor");

  // Uç çağrılmadığını gerçekten doğrula: sayaçla.
  let calls = 0;
  const counting = async () => { calls++; return { url: "http://x/media/" + "a".repeat(32) + ".jpg" }; };
  await mod.hostPreparedImage(img, "issue", counting);
  eq(calls, 0, "arıza fotoğrafı için medya ucuna istek GİTMİYOR");
  await mod.hostPreparedImage(img, "cover", counting);
  eq(calls, 1, "kapak fotoğrafı için medya ucuna istek gidiyor");

  // Başarısızlık biçimleri
  const failures_ = [
    ["ağ hatası / 500", async () => { throw new Error("network"); }],
    ["401 (oturum düşmüş)", async () => { throw Object.assign(new Error("401"), { status: 401 }); }],
    ["429 (hız sınırı)", async () => { throw new Error("429"); }],
    ["boş yanıt", async () => ({})],
    ["url yerine null", async () => ({ url: null })],
    ["adres değil, metin", async () => ({ url: "coplu-bir-deger" })],
    ["göreli yol (yanlış biçim)", async () => ({ url: "/media/abc.jpg" })],
  ];
  for (const [label, uploader] of failures_) {
    eq(await mod.hostPreparedImage(img, "listing", uploader), img, `${label} → data URI'ye geri dönüyor (veri kaybı yok)`);
  }

  // data: olmayan değerler dokunulmadan geçiyor: emoji, https adresi, boş.
  eq(await mod.hostPreparedImage("🔧", "avatar", counting), "🔧", "emoji yüklemeye çalışılmıyor");
  eq(await mod.hostPreparedImage("https://ornek.test/a.jpg", "listing", counting), "https://ornek.test/a.jpg",
    "zaten adres olan değer yeniden yüklenmiyor");
  eq(await mod.hostPreparedImage("", "listing", counting), "", "boş değer dokunulmadan geçiyor");
}

// ============================================================ DİZİ TAVANI (FAZ 3'ÜN YAN ETKİSİ)
/**
 * Arıza ve teklif fotoğraflarında hiç sayı sınırı yoktu ve GEREKMİYORDU: eski kod `blob:`
 * bağlantısı saklıyordu, her fotoğraf ~50 bayttı. Fotoğrafları gerçekten saklamaya başlayınca
 * her biri ~330 KB oldu. Sınır konmasaydı düzeltme yeni bir hata doğururdu.
 */
{
  const img300 = "data:image/jpeg;base64," + "A".repeat(Math.round(300 * 1024 * 4 / 3));
  eq(mod.canAppendImage([], img300), null, "boş listeye ekleme serbest");
  eq(mod.canAppendImage(Array(5).fill(img300), img300), null, "5 fotoğraf varken 6.'sı ekleniyor");
  ok(mod.canAppendImage(Array(mod.ARRAY_LIMITS.count).fill(img300), img300) !== null,
    `${mod.ARRAY_LIMITS.count} fotoğraftan sonra sayı sınırı devreye giriyor`);
  ok(/fotoğraf/.test(mod.canAppendImage(Array(mod.ARRAY_LIMITS.count).fill(img300), img300) || ""),
    "sayı sınırı mesajı anlaşılır");
  // Toplam boyut sınırı: 6 × 2 MB sayı sınırına takılmaz ama toplam tavanı aşar.
  const img2mb = "data:image/jpeg;base64," + "A".repeat(Math.round(2 * 1024 * 1024 * 4 / 3));
  const err = mod.canAppendImage(Array(6).fill(img2mb), img2mb);
  ok(err !== null, "sayı sınırının altında kalsa da TOPLAM boyut tavanı yakalanıyor");
  ok(/MB/.test(err || ""), "toplam boyut mesajı MB veriyor");
  // Arayüz sınırı sunucu sınırını AŞMAMALI; aşarsa kullanıcı sunucudan 400 alır.
  const srvCount = Number((serverSrc.match(/arrayCount:\s*(\d+)/) || [])[1]);
  const srvTotal = Number((serverSrc.match(/arrayTotal:\s*(\d+)\s*\*\s*1024\s*\*\s*1024/) || [])[1]) * 1024 * 1024;
  ok(mod.ARRAY_LIMITS.count <= srvCount, `arayüz sayı sınırı (${mod.ARRAY_LIMITS.count}) sunucuyu (${srvCount}) aşmıyor`);
  eq(mod.ARRAY_LIMITS.total, srvTotal, "arayüz toplam tavanı = sunucu toplam tavanı");
}

// ============================================================ KAYNAK KODU: ESKİ YOLLAR KALMADI
/**
 * Yukarıdaki testler işlevin doğru çalıştığını gösteriyor; bu bölüm ise uygulamanın onu GERÇEKTEN
 * kullandığını denetliyor. İkisi ayrı sorular: mükemmel bir yardımcı yazıp çağırmayı unutmak
 * mümkün, ve ilk hâlde tam olarak bu olmuş (sıkıştırmalı yol vardı, 8 yoldan 2'sinde kullanılıyordu).
 */
const fs = await import("node:fs");
const provider = fs.readFileSync(ROOT + "frontend/src/app/state/AppLogicProvider.tsx", "utf8");
// Yorum satırlarını çıkar: eski hatayı ANLATAN yorumlar hatanın kendisi sanılmasın.
const code = provider.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

ok(!/createObjectURL\((\s*)file(\s*)\)/.test(code),
  "hiçbir yükleme yolunda URL.createObjectURL(file) kalmadı (blob: sunucuya kaydedilemez)");
ok(/createObjectURL\(blob\)/.test(code),
  "indirme/dışa aktarma yollarındaki createObjectURL(blob) KORUNDU (orada doğru kullanım)");
ok(!/reader\.readAsDataURL/.test(code), "ham readAsDataURL çağrısı kalmadı, hepsi ortak modülden");
ok(!/readFileAsDataUrl/.test(code), "sıkıştırmasız readFileAsDataUrl yardımcısı kaldırıldı");

for (const handler of ["addProblemPhoto", "addQuotePhoto", "handleFileSelect", "handleCvSelect",
  "sellPhotoUpload", "sellPhotosUpload", "uploadCoverPhoto", "staffAvatarUpload", "ownerPhotoUpload"]) {
  // 2500 karakter: en uzun işleyici (sellPhotosUpload, çoklu dosya + sayı sınırı) ~1600 karakter.
  // İlk denemede 700'dü ve o işleyici hiç bulunamadı — yani test sessizce onu ATLIYORDU.
  const body = code.match(new RegExp(`const ${handler} = [\\s\\S]{0,2500}?(?=\\n  const |\\n  /\\*)`));
  ok(!!body, `${handler} bulundu`);
  ok(/prepareImageForUpload|prepareDocumentForUpload|uploadPreparedImage/.test(body?.[0] || ""),
    `${handler} hazırlık yolundan geçiyor`);
}

// Ön ayar eşleşmeleri: her yolun hedefi kullanım yeriyle uyumlu olmalı.
const presetOf = (handler) => {
  const m = code.match(new RegExp(`const ${handler} = [\\s\\S]{0,500}?"(listing|cover|chat|issue|quote|avatar)"`));
  return m?.[1] || null;
};
eq(presetOf("addProblemPhoto"), "issue", "arıza fotoğrafı 'issue' ön ayarını kullanıyor");
eq(presetOf("addQuotePhoto"), "quote", "teklif fotoğrafı 'quote' ön ayarını kullanıyor");
eq(presetOf("handleFileSelect"), "chat", "sohbet fotoğrafı 'chat' ön ayarını kullanıyor");
eq(presetOf("sellPhotoUpload"), "listing", "ilan kapak fotoğrafı 'listing'");
eq(presetOf("uploadCoverPhoto"), "cover", "tamirci kapak fotoğrafı 'cover'");
eq(presetOf("staffAvatarUpload"), "avatar", "çalışan avatarı 'avatar'");
eq(presetOf("ownerPhotoUpload"), "avatar", "profil fotoğrafı 'avatar'");

// Hata mesajı KULLANICIYA gösteriliyor mu — sessizce yutuluyorsa tavan bir kullanıcı hatasına dönüşür.
const errorShown = (code.match(/if \(error\) \{ setToast/g) || []).length
  + (code.match(/if \(error\) \{ setToast\(\{ type: "error", text: `⚠️ \$\{file\.name\}/g) || []).length;
ok(errorShown >= 5, `tavan hatası kullanıcıya gösteriliyor (${errorShown} yolda)`);

if (failures.length === 0) {
  console.log(`OK yükleme hazırlığı (${passed})`);
  process.exit(0);
}
console.log(`BAŞARISIZ yükleme hazırlığı — ${failures.length}/${passed + failures.length}`);
for (const f of failures) console.log("  ✗ " + f);
process.exit(1);
