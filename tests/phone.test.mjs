// TELEFON NUMARASI — normalleştirme + gerçek numara planı denetimi.
//
// YAŞANAN İKİ HATA (kullanıcı bildirdi):
//   1) Kullanıcı "+" yazmazsa form numarayı reddediyordu. Kimse telefonunu "+90 532…" diye
//      yazmıyor; "0532…" yazıyor. Ülke kodunu kullanıcıya yazdırmak yerine biz ekliyoruz.
//   2) Denetim sadece "10 hane" diyordu; "+90 876 000 00 00" kabul ediliyordu. Türkiye'de 8 ile
//      başlayan abone numarası YOK — yani telefon numarası olmayan bir şey telefon numarası
//      diye kaydediliyordu ve o müşteriye kimse ulaşamıyordu.
//
// Bu takım, helpers.ts'teki GERÇEK fonksiyonu kaynaktan okuyup çalıştırır (kopya mantık değil) —
// böylece üretim kodu değişirse test de onunla birlikte değişmiş olur.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, ok, report } from "./_harness.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HELPERS = readFileSync(join(ROOT, "frontend/src/utils/helpers.ts"), "utf8");

// --- Gerçek kaynağı yükle ----------------------------------------------------------------------
const start = HELPERS.indexOf("const TR_MOBILE");
const endMarker = "export function validatePhone";
const end = HELPERS.indexOf("\n}\n", HELPERS.indexOf(endMarker)) + 3;
ok(start > 0 && end > start, "telefon bloğu helpers.ts içinde bulundu");
const src = HELPERS.slice(start, end).replace(/export function/g, "function");
const { normalizePhone, validatePhone } = new Function(`${src}; return { normalizePhone, validatePhone };`)();

// --- 1) "+" ZORUNLU DEĞİL: ülke kodunu biz ekliyoruz -------------------------------------------
const trForms = ["0532 123 45 67", "05321234567", "532 123 45 67", "+90 532 123 45 67",
  "+905321234567", "0090 532 123 45 67", "(0532) 123-45-67", "  0532 123 45 67  "];
for (const raw of trForms) {
  eq(normalizePhone(raw).e164, "+905321234567", `"${raw}" → +905321234567`);
}
// Ülke kodundan sonra tekrar yazılan ulusal sıfır da temizlenir.
eq(normalizePhone("+90 0532 123 45 67").e164, "+905321234567", "ülke kodundan sonraki 0 atılıyor");

const deForms = ["0151 23456789", "015123456789", "+49 151 23456789", "0049 151 23456789"];
for (const raw of deForms) {
  eq(normalizePhone(raw, "de").e164, "+4915123456789", `"${raw}" → +4915123456789`);
}

// --- 2) GERÇEK ÖN EK DENETİMİ: numara planına uymayanlar reddediliyor ---------------------------
// Kullanıcının bildirdiği asıl vaka:
eq(validatePhone("876 000 00 00").valid, false, "876 ile başlayan numara reddediliyor");
eq(validatePhone("+90 876 0000000").valid, false, "+90 876… reddediliyor");
eq(validatePhone("0500 123 45 67").valid, false, "500 bloğu kullanımda değil, reddediliyor");
eq(validatePhone("0900 123 45 67").valid, false, "9 ile başlayan numara abone numarası değil");
eq(validatePhone("0100 123 45 67").valid, false, "1 ile başlayan numara reddediliyor");
eq(validatePhone("0532 123 45 6").valid, false, "eksik haneli cep numarası reddediliyor");
eq(validatePhone("0532 123 45 678").valid, false, "fazla haneli cep numarası reddediliyor");
eq(validatePhone("123").valid, false, "çok kısa girdi reddediliyor");
eq(validatePhone("").valid, false, "boş girdi reddediliyor");
eq(validatePhone("abcdefghij").valid, false, "harf içeren girdi reddediliyor");
eq(validatePhone("+1 555 123 4567").valid, false, "desteklenmeyen ülke kodu reddediliyor");

// Geçerli TR numaraları — her operatör bloğundan örnek + sabit hatlar.
for (const good of ["0501 111 11 11", "0532 111 11 11", "0543 111 11 11", "0555 111 11 11",
  "0561 111 11 11", "0212 555 44 33", "0312 444 12 34", "0442 111 22 33"]) {
  eq(validatePhone(good).valid, true, `geçerli TR numarası kabul: ${good}`);
}

// Almanya: cep 15x/16x/17x geçerli, servis numaraları (0180, 0900, 0137) değil.
for (const good of ["0151 23456789", "0160 1234567", "0172 1234567", "030 123456"]) {
  eq(validatePhone(good, "de").valid, true, `geçerli DE numarası kabul: ${good}`);
}
for (const bad of ["0180 1234567", "0137 123456", "0110 123456", "01 23"]) {
  eq(validatePhone(bad, "de").valid, false, `geçersiz DE numarası reddediliyor: ${bad}`);
}

// --- 3) Ülke tahmini --------------------------------------------------------------------------
// Türkiye cep numarası (5 ile başlayan 10 hane) ülke tahmininden BAĞIMSIZ olarak tanınır:
// Almanya'daki bir kullanıcı Türk numarasını "0532…" diye yazdığında da doğru sonuç çıkmalı.
eq(normalizePhone("0532 123 45 67", "de").e164, "+905321234567", "TR cep numarası DE varsayımında da tanınıyor");
eq(normalizePhone("030 123456", "de").country, "de", "DE sabit hattı DE varsayımıyla çözülüyor");

// --- 4) Geçerli numara +E.164 olarak DÖNÜYOR ---------------------------------------------------
// Aynı numaranın veritabanında iki biçimde durması, "bu iki kayıt aynı kişi mi" sorusunu
// cevaplanamaz hale getirirdi; bu yüzden kaydedilecek değer normalize edilmiş olan.
eq(validatePhone("0532 123 45 67").normalized, "+905321234567", "geçerli numara normalized alanıyla dönüyor");
ok(validatePhone("0532 123 45 67").country === "tr", "ülke bilgisi dönüyor");
ok(typeof validatePhone("876 000 00 00").message === "string", "hatalı numarada açıklayıcı mesaj var");

// --- 5) Kaynak kodda gerçekten bağlı mı --------------------------------------------------------
const provider = readFileSync(join(ROOT, "frontend/src/app/state/AppLogicProvider.tsx"), "utf8");
const shell = readFileSync(join(ROOT, "frontend/src/app/AppShell.tsx"), "utf8");

ok(/const checkPhone = \(raw\) => validatePhone\(raw, phoneCountry\)/.test(provider), "tek merkez: checkPhone tanımlı");
ok(/const phoneCheck = checkPhone\(form\.phone\)/.test(provider), "kayıt formu telefonu denetliyor");
ok(/phone: phoneCheck\.normalized/.test(provider), "kayıtta normalize edilmiş numara gönderiliyor");
ok(/const jobApplyPhoneCheck = checkPhone\(/.test(provider), "iş başvurusu telefonu denetliyor");
ok(/jobApplyPhoneCheck\.normalized/.test(provider), "başvuruda normalize edilmiş numara saklanıyor");
ok(/normalizePhoneField/.test(provider), "alan odağı kaybettiğinde normalleştirme var");

// Telefon girilen HER alan normalleştirmeden geçmeli — biri unutulursa ham metin kaydedilir.
// Etiketin tamamını alıyoruz: JSX içinde süslü parantezler iç içe geçtiği için basit bir
// "ilk } işaretine kadar" eşlemesi etiketi ortadan keser ve test yanlış sonuç verir.
const phoneInputs = [];
for (const m of shell.matchAll(/<input value=\{[^}]*[Pp]hone/g)) {
  const close = shell.indexOf("/>", m.index);
  phoneInputs.push(shell.slice(m.index, close + 2));
}
ok(phoneInputs.length >= 3, "telefon girişi olan alanlar bulundu");
const withoutBlur = phoneInputs.filter((tag) => !tag.includes("normalizePhoneField"));
eq(withoutBlur.length, 0, "her telefon alanı normalizePhoneField'den geçiyor");

// Eski yüzeysel kural geri gelmemeli.
eq(/\^\\\+90\\d\{10\}\$/.test(HELPERS), false, "eski 'sadece 10 hane' kuralı kaldırıldı");

// --- 6) ANLAMSIZ METİN (5. madde): kaldırılan ön ödeme özelliği anlatılmıyor --------------------
const i18n = readFileSync(join(ROOT, "frontend/src/data/i18n.ts"), "utf8");
const hintLine = i18n.split("\n").find((l) => l.trim().startsWith("servicesFixedPriceHint:")) || "";
ok(hintLine.length > 0, "sabit fiyat açıklaması i18n'de duruyor");
eq(/önceden ödeme|pre-payment|Vorauszahlung/i.test(hintLine), false, "kaldırılan ön ödeme özelliğinden söz edilmiyor");
ok(/serviste|at your shop|in der Werkstatt/i.test(hintLine), "ödemenin serviste alındığı yazıyor");
for (const lang of ["tr:", "en:", "de:"]) ok(hintLine.includes(lang), `sabit fiyat açıklaması ${lang} dilinde var`);

report("telefon");
