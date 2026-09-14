/**
 * HIZ SINIRLAYICI — bellek içi, hiçbir bağımlılığı yok.
 * ================================================================================================
 * Veritabanına dokunmuyor; bu yüzden ayrı bir dosyada duruyor. Önceden auth.js içindeydi ve onu
 * test etmek isteyen her şey derlenmiş SQLite ikilisini de yüklemek zorunda kalıyordu — yani
 * bağımlılığı olmayan bir mantık, bağımlı bir dosyada durduğu için test edilemez hâldeydi.
 */
/**
 * HIZ SINIRLAYICI — ve haritasının SINIRSIZ BÜYÜMEMESİ.
 * ------------------------------------------------------------------------------------------------
 * DENETİMDE BULUNAN SORUN: `attempts` haritasından kayıt yalnızca (a) kilidi dolmuş bir anahtar
 * tekrar sorgulandığında ya da (b) reset çağrıldığında siliniyordu. Kilide ULAŞMAYAN ve bir daha
 * hiç sorulmayan anahtarlar sonsuza kadar kalıyordu. IPv6'da (ve sahte başlık denemelerinde)
 * anahtar çeşitliliği pratikte sınırsız olduğu için bu, kimlik doğrulaması gerektirmeyen ucuz bir
 * bellek tüketme yolu: her istekte yeni bir anahtar üret, harita büyüsün.
 *
 * İki katmanlı çözüm: (1) her yazmada süresi geçmiş kayıtlar seyreltiliyor, (2) sert bir üst sınır
 * var ve dolduğunda EN ESKİ kayıt düşüyor. En yeniyi atmak, saldırganın kendi izini silmesine
 * yardım etmek olurdu.
 */
const LIMITER_MAX_KEYS = 20_000;

export function makeRateLimiter({ maxAttempts, lockoutMs, windowMs = null }) {
  const attempts = new Map(); // key -> { count, lockedUntil, last }
  const staleAfter = Math.max(lockoutMs, windowMs || 0) * 2;
  const prune = () => {
    const now = Date.now();
    for (const [k, v] of attempts) {
      const expiredLock = v.lockedUntil && v.lockedUntil <= now;
      const stale = v.last && now - v.last > staleAfter;
      if (expiredLock || stale) attempts.delete(k);
    }
    // Hâlâ doluysa ekleme sırasına göre en eskileri at (Map sırayı korur).
    while (attempts.size >= LIMITER_MAX_KEYS) {
      const oldest = attempts.keys().next().value;
      if (oldest === undefined) break;
      attempts.delete(oldest);
    }
  };
  return {
    check(key) {
      const entry = attempts.get(key);
      if (!entry) return { blocked: false };
      if (entry.lockedUntil && entry.lockedUntil > Date.now()) return { blocked: true };
      if (entry.lockedUntil && entry.lockedUntil <= Date.now()) attempts.delete(key);
      return { blocked: false };
    },
    registerFailure(key) {
      if (attempts.size >= LIMITER_MAX_KEYS) prune();
      const entry = attempts.get(key) || { count: 0, lockedUntil: null, last: 0 };
      if (windowMs && entry.last && Date.now() - entry.last > windowMs) entry.count = 0;
      entry.count += 1;
      entry.last = Date.now();
      if (entry.count >= maxAttempts) entry.lockedUntil = Date.now() + lockoutMs;
      attempts.set(key, entry);
    },
    reset(key) {
      attempts.delete(key);
    },
  };
}
