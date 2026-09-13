/**
 * ASENKRON ROTA SARMALAYICISI — "bir kullanıcı hesabını silince sunucu çöküyordu".
 * ================================================================================================
 * Express 4, `async` bir rota işleyicisinin REDDEDİLEN sözünü (rejected promise) yakalamaz. Böyle
 * bir hata Express'in hata ara katmanına HİÇ ulaşmaz; Node'un "unhandledRejection" yoluna düşer ve
 * Node 22 varsayılanında SÜREÇ SONLANIR.
 *
 * Bunun pratikte ne demek olduğu, bu denetimde somut olarak görüldü: "hesabımı sil" akışında bir
 * yabancı anahtar hatası oluştu ve TÜM BACKEND kapandı. Yani giriş yapmış herhangi bir kullanıcı,
 * kendi hesabını silmeye çalışarak siteyi HERKES için düşürebiliyordu. Tek bir kullanıcının
 * yaptığı bir işlemin tüm hizmeti durdurabilmesi, hatanın kendisinden daha büyük bir sorundur.
 *
 * Bu sarmalayıcı reddi yakalayıp `next(err)` ile Express'e veriyor: kullanıcı 500 alır, sunucu
 * ayakta kalır, hata sunucu günlüğüne düşer. Senkron işleyicileri sarmaya gerek yok (Express
 * onları zaten yakalıyor) ama sarmak da zarar vermez.
 */
export const asyncRoute = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};
export default asyncRoute;
