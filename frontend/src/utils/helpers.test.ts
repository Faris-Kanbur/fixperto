// Kritik iş mantığı (validasyon, fiyat ayrıştırma, mesafe hesabı) için minimal ama gerçek
// testler. node:test kullanıyoruz (npm install gerektirmez, tsx ile TS'i doğrudan çalıştırır) —
// bkz. package.json "test" script. Her fonksiyon için "mutlu yol" + en az bir sınır durumu.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseListingPrice,
  priceLevel,
  haversineDistanceKm,
  isValidDateStr,
  isValidEmail,
  validatePhone,
  parsePriceNumber,
  listingCurrency,
  initials,
  slugifyForEmail,
  isFixedPriceService,
} from "./helpers.ts";

test("parseListingPrice strips non-digits and parses", () => {
  assert.equal(parseListingPrice("410.000₺"), 410000);
  assert.equal(parseListingPrice(""), 0);
  assert.equal(parseListingPrice(null), 0);
});

test("priceLevel buckets price into 1-5", () => {
  assert.equal(priceLevel(0), 1);
  assert.equal(priceLevel(999999), 5);
});

test("haversineDistanceKm returns 0 for identical points", () => {
  assert.equal(haversineDistanceKm(41.0, 29.0, 41.0, 29.0), 0);
});

test("haversineDistanceKm returns a positive, plausible distance Istanbul->Ankara", () => {
  const km = haversineDistanceKm(41.0082, 28.9784, 39.9334, 32.8597);
  assert.ok(km > 300 && km < 500, `expected ~350km, got ${km}`);
});

test("isValidDateStr rejects invalid calendar dates (no silent rollover)", () => {
  assert.equal(isValidDateStr("2026-02-30"), false); // February has no 30th
  assert.equal(isValidDateStr("2026-02-15"), true);
  assert.equal(isValidDateStr(""), false);
});

test("isValidEmail", () => {
  assert.equal(isValidEmail("ali@example.com"), true);
  assert.equal(isValidEmail("not-an-email"), false);
  assert.equal(isValidEmail(""), false);
});

test("validatePhone accepts valid TR numbers, rejects malformed ones", () => {
  assert.equal(validatePhone("+905321234567").valid, true);
  assert.equal(validatePhone("+90532123").valid, false);
  assert.equal(validatePhone("").valid, false);
});

test("validatePhone accepts valid DE numbers", () => {
  assert.equal(validatePhone("+491512345678").valid, true);
});

test("parsePriceNumber / listingCurrency", () => {
  assert.equal(parsePriceNumber("365.000₺"), 365000);
  assert.equal(listingCurrency("120.000€"), "€");
  assert.equal(listingCurrency("120.000₺"), "₺");
});

test("initials derives up to 2 uppercase letters from a name", () => {
  assert.equal(initials("Ali Yıldız"), "AY");
  assert.equal(initials(""), "?");
});

test("slugifyForEmail converts Turkish characters to ASCII-safe slug", () => {
  assert.equal(slugifyForEmail("Güven Oto"), "guven.oto");
});

test("isFixedPriceService: variable-price keywords override fixed-price keywords", () => {
  assert.equal(isFixedPriceService("Yağ Değişimi"), true);
  assert.equal(isFixedPriceService("Arıza Tespiti"), false);
});
