/**
 * Şifre biçim kontrolü — BİLEREK bağımsız, hiçbir şey import etmeyen küçük bir modül.
 *
 * NEDEN AYRI DOSYA: bu fonksiyon hem db.js (eski düz metin şifreleri tespit edip hash'lemek için)
 * hem de auth.js tarafından kullanılıyor. db.js'in auth.js'i import etmesi, auth.js oturumları
 * veritabanında tutmaya başlayınca DAİRESEL bir import yaratıyordu (db → auth → db); ESM böyle bir
 * döngüde modüllerden birini yarı kurulmuş hâlde verir ve `db` değişkeni undefined olarak okunur.
 * Ortak parçayı bağımsız bir dosyaya almak döngüyü tamamen ortadan kaldırıyor.
 */
export function looksHashed(value) {
  return typeof value === "string" && /^\$2[aby]\$/.test(value);
}
