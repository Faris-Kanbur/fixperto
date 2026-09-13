import { useEffect } from "react";
import { Sparkles, Info } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";
import { ListingCard } from "./ListingCard";

/**
 * "SENİN İÇİN" — önerilen ilanlar.
 * ------------------------------------------------------------------------------------------------
 * TASARIM KARARI: her kartın altında NEDEN önerildiği yazıyor. Netflix'in "X izlediğin için"
 * satırıyla aynı fikir, ama burada iki ayrı sebebi de var:
 *   - Kullanışlılık: gerekçesi olmayan öneri, kullanıcıya rastgele görünür ve güven kazanmaz.
 *   - Şeffaflık: kişiselleştirmenin neye dayandığını göstermeden "verini işliyoruz" demek,
 *     rızayı biçimsel bir onay kutusuna indirger. Kullanıcı burada profilinin sonucunu GÖRÜYOR.
 *
 * İzin yokken bölüm KAYBOLMUYOR: kişisel olmayan öneriler (bu ilana bakanlar / çok bakılanlar)
 * gösteriliyor ve etiketi dürüstçe "popüler" oluyor. Kişiselleştirmeyi reddeden kullanıcıyı
 * boş ekranla cezalandırmak, rızayı gönüllü olmaktan çıkarır.
 */
export function RecommendedListings({ seedIds = [], limit = 4 }: { seedIds?: (number | string)[]; limit?: number }) {
  const { t, recommendations, loadRecommendations, openOwnerSettingsForRecs } = useApp();

  useEffect(() => { loadRecommendations?.({ seedIds, limit }); }, [seedIds.join(","), limit]);

  if (!recommendations || recommendations.loading) return null;
  if (!recommendations.listings?.length) return null;

  const reasonText = (r) => {
    if (!r) return null;
    if (r.type === "taste") return t("recReasonTaste", { value: String(r.value) });
    if (r.type === "coViewed") return t("recReasonCoViewed");
    return t("recReasonPopular");
  };

  return (
    <section className="mb-6" aria-label={t("recommendedTitle")}>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
          <Sparkles size={16} className="text-rose-500" /> {t("recommendedTitle")}
        </h2>
        {/* İzin kapalıyken bunu SÖYLÜYORUZ. Kullanıcı önerilerin neden genel olduğunu bilmeli ve
            isterse tek tıkla açabilmeli — ayarların derinine gömmek "rıza aldık" demek olmaz. */}
        {!recommendations.consent && (
          <button onClick={openOwnerSettingsForRecs}
            className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-rose-600 transition">
            <Info size={12} /> {t("recNotPersonalizedCta")}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {recommendations.listings.map((l) => (
          <div key={l.id}>
            <ListingCard l={l} />
            <p className="text-[11px] text-gray-400 mt-1.5 px-1 leading-snug">{reasonText(l.recommendReason)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default RecommendedListings;
