import { useEffect } from "react";
import { ChevronRight, Calendar, Eye, BookOpen, Wrench, Search } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";
import { setPageMeta, isImgUrl, imgThumb, imgFallbackHandler } from "../../utils/helpers";
import { SiteFooter } from "./SiteFooter";
import { SERVICE_BY_KEY } from "../../data/constants";
import { PageTopBar } from "./BrandMark";

/**
 * BLOG — SEO içerik motoru.
 * ---------------------------------------------------------------------------------------------
 * Neden var: pazar yerleri organik trafiğin büyük kısmını "fren balatası ne zaman değişir" gibi
 * bilgi aramalarından alır. Bu aramalar doğrudan satın alma niyeti taşımaz ama kullanıcıyı siteye
 * getirir; içeriğin altındaki çağrı butonu onu aramaya bağlar. AutoScout24'ün "Magazin"i,
 * ATU'nun rehber sayfaları aynı işi yapıyor.
 *
 * Gövde metni bilinçli olarak HTML DEĞİL, düz metin + basit Markdown başlıkları olarak
 * işleniyor (aşağıdaki renderBody). Sebebi güvenlik: yönetici panelinden girilen içeriği
 * dangerouslySetInnerHTML ile basmak, panel ele geçirilirse her ziyaretçiye script çalıştırma
 * yolu açardı. Düz metin işlemede böyle bir risk yok.
 */

const fmtDate = (iso, lang) => {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "tr-TR", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return String(iso).slice(0, 10); }
};

/** Düz metin gövdeyi paragraf ve "## " başlıklarına çevirir. HTML enjeksiyonu mümkün değil. */
function renderBody(body) {
  const blocks = String(body || "").split(/\n{2,}/).filter((b) => b.trim());
  return blocks.map((block, i) => {
    const line = block.trim();
    if (line.startsWith("## ")) {
      return <h2 key={i} className="text-xl md:text-2xl font-bold text-fg mt-8 mb-3">{line.slice(3)}</h2>;
    }
    if (line.startsWith("# ")) {
      return <h2 key={i} className="text-2xl font-bold text-fg mt-8 mb-3">{line.slice(2)}</h2>;
    }
    return <p key={i} className="text-[15px] leading-relaxed text-fg-strong mb-4 whitespace-pre-line">{line}</p>;
  });
}

export function BlogListPage() {
  const { t, lang, blogPosts, openBlogPost, goToBrowse } = useApp();

  useEffect(() => {
    setPageMeta({ title: t("blogTitle"), description: t("blogSubtitle"), canonicalPath: "/blog" });
  }, [t, lang]);

  const [lead, ...rest] = blogPosts;

  return (
    <div className="w-full bg-background min-h-screen flex flex-col">
      <PageTopBar />
      <div className="h-20 md:h-28 bg-gradient-to-br from-blue-100 via-blue-50 to-gray-100" />
      <div className="max-w-7xl mx-auto px-5 md:px-8 relative z-10 w-full">
        <div className="relative bg-white border border-surface-elevated rounded-3xl shadow-sm -mt-10 md:-mt-12 p-5 md:p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-tint flex items-center justify-center flex-shrink-0 text-primary"><BookOpen size={22} /></div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-fg">{t("blogTitle")}</h1>
            <p className="text-sm text-fg-secondary mt-0.5">{t("blogSubtitle")}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 md:px-8 py-6 md:py-8 w-full flex-1">
        {blogPosts.length === 0 ? (
          <div className="bg-white border border-dashed border-border rounded-3xl text-center py-24">
            <BookOpen size={40} className="mx-auto text-fg-muted mb-3" />
            <p className="text-fg-muted text-sm">{t("blogEmpty")}</p>
          </div>
        ) : (
          <>
            {/* Öne çıkan yazı: en yeni olan geniş kartta — okuyucunun gözü ilk oraya gitsin. */}
            {lead && (
              <button onClick={() => openBlogPost(lead.slug)} className="w-full text-left bg-white border border-surface-elevated rounded-3xl shadow-sm hover:shadow-md transition overflow-hidden mb-6 grid grid-cols-1 md:grid-cols-2">
                {/* GÖRSEL ARKA PLANI NÖTR: burada pembe bir degrade vardı ve görselin kapatmadığı
                    her yerde (şeffaf PNG, farklı en-boy oranı, görsel yüklenemediğinde) kırmızımsı
                    bir zemin görünüyordu — hiçbir fotoğrafla uyuşmuyordu. Görsel varsa nötr gri,
                    yoksa (yer tutucu ikon) yumuşak gri. */}
                <div className={`h-52 md:h-full flex items-center justify-center ${isImgUrl(lead.coverPhoto) ? "bg-surface-elevated" : "bg-background"}`}>
                  {isImgUrl(lead.coverPhoto)
                    ? <img decoding="async" src={imgThumb(lead.coverPhoto, 900)} onError={imgFallbackHandler} alt={lead.title} className="w-full h-full object-cover" />
                    : <Wrench size={48} className="text-fg-muted" />}
                </div>
                <div className="p-6 md:p-8 flex flex-col justify-center">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(lead.tags || []).slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary-tint text-primary">{tag}</span>
                    ))}
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-fg mb-2">{lead.title}</h2>
                  <p className="text-sm text-fg-secondary leading-relaxed mb-4">{lead.excerpt}</p>
                  <span className="text-sm font-semibold text-primary flex items-center gap-1">{t("blogReadMore")} <ChevronRight size={15} /></span>
                </div>
              </button>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rest.map((p) => (
                <button key={p.id} onClick={() => openBlogPost(p.slug)} className="text-left bg-white border border-surface-elevated rounded-3xl shadow-sm hover:shadow-md hover:border-primary-subtle transition overflow-hidden flex flex-col">
                  <div className={`h-36 flex items-center justify-center flex-shrink-0 ${isImgUrl(p.coverPhoto) ? "bg-surface-elevated" : "bg-background"}`}>
                    {isImgUrl(p.coverPhoto)
                      ? <img loading="lazy" decoding="async" src={imgThumb(p.coverPhoto, 500)} onError={imgFallbackHandler} alt={p.title} className="w-full h-full object-cover" />
                      : <Wrench size={32} className="text-fg-muted" />}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-fg mb-2 leading-snug">{p.title}</h3>
                    <p className="text-sm text-fg-secondary leading-relaxed line-clamp-3 flex-1">{p.excerpt}</p>
                    <p className="text-[11px] text-fg-muted mt-3 flex items-center gap-1.5"><Calendar size={11} /> {fmtDate(p.publishedAt, lang)}</p>
                    {/* Hizmet rozeti: yazının hangi işe bağlı olduğunu listede de gösterir —
                        okuyucu daha yazıya girmeden aradığı konuyu tanıyabilsin. */}
                    {SERVICE_BY_KEY[p.relatedServiceKey] && (
                      <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary"><Wrench size={11} /> {SERVICE_BY_KEY[p.relatedServiceKey][lang] || SERVICE_BY_KEY[p.relatedServiceKey].tr}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* İçerikten aramaya köprü: blog trafiğinin işe dönüşmesini sağlayan yer. */}
        <div className="mt-10 bg-white border border-surface-elevated rounded-3xl shadow-sm p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-fg">{t("blogCtaTitle")}</h3>
            <p className="text-sm text-fg-secondary mt-1">{t("blogCtaBody")}</p>
          </div>
          <button onClick={() => goToBrowse("mechanics")} className="bg-primary text-white px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-primary-hover transition flex items-center gap-2 flex-shrink-0"><Search size={16} /> {t("findMechanic")}</button>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

export function BlogPostPage() {
  const { t, lang, blogPost, blogPosts, blogLoading, openBlog, openBlogPost, goToBrowse, openMechanicsForService } = useApp();

  // BLOG → FİLTRELENMİŞ USTA LİSTESİ
  // Yazının bağlı olduğu hizmet varsa, genel "tamirci ara" yerine O İŞİ YAPAN ustaların
  // filtrelenmiş listesini açan bir kart gösteriliyor. Okuma niyetiyle gelen ziyaretçinin
  // arama niyetine geçtiği yer burası — jantla ilgili yazıyı okuyan, tek tıkla jant
  // düzeltme yapan ustaları görüyor.
  const svc = blogPost?.relatedServiceKey ? SERVICE_BY_KEY[blogPost.relatedServiceKey] : null;
  const svcLabel = svc ? (svc[lang] || svc.tr) : null;
  // BİLEŞEN DEĞİL, JSX döndüren düz bir fonksiyon. Bileşen olarak tanımlansaydı her render'da
  // yeni bir tür üretir ve React alttaki ağacı söküp yeniden kurardı (bkz. AppShell'deki
  // aynı düzeltme). Kapanıştan svc/blogPost okuduğu için modül düzeyine de taşınamıyor.
  const serviceCta = (compact = false) => {
    if (!svc) return null;
    return (
      <div className={`bg-primary-tint border border-primary-tint rounded-2xl ${compact ? "p-4" : "p-5 md:p-6"} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <div className="min-w-0">
          <p className="font-bold text-fg flex items-center gap-2"><Wrench size={16} className="text-info" /> {t("blogServiceCtaTitle", { service: svcLabel })}</p>
          <p className="text-sm text-fg-secondary mt-0.5">{t("blogServiceCtaBody")}</p>
        </div>
        <button onClick={() => openMechanicsForService(blogPost.relatedServiceKey)} className="bg-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-hover transition flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
          {t("blogServiceCtaBtn")} <ChevronRight size={15} />
        </button>
      </div>
    );
  };

  useEffect(() => {
    if (!blogPost) return;
    setPageMeta({
      title: blogPost.title,
      description: blogPost.excerpt,
      image: blogPost.coverPhoto || undefined,
      canonicalPath: `/blog/${blogPost.slug}`,
      // Article şeması: arama motoruna başlık/tarih/yazar bilgisini makine-okur biçimde verir.
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: blogPost.title,
        description: blogPost.excerpt,
        datePublished: blogPost.publishedAt,
        author: { "@type": "Organization", name: blogPost.author || "Fixperto" },
        publisher: { "@type": "Organization", name: "Fixperto" },
      },
    });
  }, [blogPost]);

  const related = blogPosts.filter((p) => p.slug !== blogPost?.slug).slice(0, 3);

  return (
    <div className="w-full bg-background min-h-screen flex flex-col">
      <PageTopBar onBack={openBlog} right={<button onClick={openBlog} className="text-sm font-semibold text-fg-secondary hover:text-primary transition hidden sm:block">{t("blogBackToList")}</button>} />
      <div className="h-16 md:h-20 bg-gradient-to-br from-blue-100 via-blue-50 to-gray-100" />

      <div className="max-w-3xl mx-auto px-5 md:px-8 relative z-10 w-full flex-1">
        {blogLoading && !blogPost ? (
          <div className="relative bg-white border border-surface-elevated rounded-3xl shadow-sm -mt-8 p-8 space-y-3">
            <div className="h-6 bg-surface-elevated rounded-lg w-3/4 animate-pulse" />
            <div className="h-4 bg-surface-elevated rounded w-full animate-pulse" />
            <div className="h-4 bg-surface-elevated rounded w-5/6 animate-pulse" />
          </div>
        ) : !blogPost ? (
          <div className="relative bg-white border border-surface-elevated rounded-3xl shadow-sm -mt-8 text-center py-20">
            <BookOpen size={40} className="mx-auto text-fg-muted mb-3" />
            <p className="text-fg-muted text-sm mb-4">{t("blogNotFound")}</p>
            <button onClick={openBlog} className="text-primary font-semibold text-sm hover:underline">{t("blogBackToList")}</button>
          </div>
        ) : (
          <>
            <article className="relative bg-white border border-surface-elevated rounded-3xl shadow-sm -mt-8 p-6 md:p-10">
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(blogPost.tags || []).map((tag) => (
                  <span key={tag} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary-tint text-primary">{tag}</span>
                ))}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-fg leading-tight mb-3">{blogPost.title}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-muted mb-6 pb-6 border-b border-surface-elevated">
                <span>{blogPost.author}</span>
                <span className="flex items-center gap-1"><Calendar size={12} /> {fmtDate(blogPost.publishedAt, lang)}</span>
                {blogPost.views > 0 && <span className="flex items-center gap-1"><Eye size={12} /> {t("blogViewsLabel", { n: String(blogPost.views) })}</span>}
              </div>
              {isImgUrl(blogPost.coverPhoto) && (
                <img decoding="async" src={imgThumb(blogPost.coverPhoto, 1200)} onError={imgFallbackHandler} alt={blogPost.title} className="w-full h-56 md:h-72 object-cover rounded-2xl mb-6" />
              )}
              <p className="text-base text-fg-secondary leading-relaxed mb-6 font-medium">{blogPost.excerpt}</p>
              {/* Üstteki kart: okuyucu yazının tamamını okumadan da aradığı ustaya ulaşabilsin.
                  Arama sonucundan gelen çoğu ziyaretçi zaten cevabı biliyor, sadece usta arıyor. */}
              <div className="mb-8">{serviceCta(true)}</div>
              {renderBody(blogPost.body)}
              {/* Alttaki kart: yazıyı sonuna kadar okuyan için — asıl dönüşüm burada oluyor. */}
              <div className="mt-8">{serviceCta()}</div>
            </article>

            {!svc && <div className="mt-6 bg-white border border-surface-elevated rounded-3xl shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-fg">{t("blogCtaTitle")}</h3>
                <p className="text-sm text-fg-secondary mt-0.5">{t("blogCtaBody")}</p>
              </div>
              <button onClick={() => goToBrowse("mechanics")} className="bg-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-hover transition flex items-center gap-2 flex-shrink-0"><Search size={15} /> {t("findMechanic")}</button>
            </div>}

            {related.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-fg mb-4">{t("blogRelatedTitle")}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {related.map((p) => (
                    <button key={p.id} onClick={() => openBlogPost(p.slug)} className="text-left bg-white border border-surface-elevated rounded-2xl shadow-sm hover:shadow-md hover:border-primary-subtle transition p-4">
                      <h4 className="font-semibold text-fg text-sm leading-snug mb-1.5">{p.title}</h4>
                      <p className="text-xs text-fg-muted line-clamp-2">{p.excerpt}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="mt-12"><SiteFooter /></div>
    </div>
  );
}

/** Hakkımızda / Kariyer / Basın / SSS — alt bilgideki kurumsal bağlantıların indiği sade sayfa. */
export function AboutPage() {
  const { t, setShowNewTicketForm, aboutSection, setAboutSection } = useApp();
  useEffect(() => { setPageMeta({ title: t("aboutTitle"), description: t("aboutBody"), canonicalPath: "/hakkimizda" }); }, [t]);
  // Alt bilgideki "SSS" bağlantısı doğrudan SSS bölümüne kaydırıyor. Sayfanın en üstünde bırakıp
  // "aşağıda bir yerde" demek, vaat edilen içeriği bulamamakla aynı şey.
  useEffect(() => {
    if (aboutSection !== "faq") return;
    const raf = requestAnimationFrame(() => {
      document.getElementById("about-faq")?.scrollIntoView({ behavior: "smooth", block: "start" });
      setAboutSection(null);
    });
    return () => cancelAnimationFrame(raf);
  }, [aboutSection, setAboutSection]);
  const faqs = [1, 2, 3, 4, 5, 6].map((n) => ({ q: t(`faqQ${n}`), a: t(`faqA${n}`) }));
  return (
    <div className="w-full bg-background min-h-screen flex flex-col">
      <PageTopBar />
      <div className="h-20 md:h-24 bg-gradient-to-br from-blue-100 via-blue-50 to-gray-100" />
      <div className="max-w-3xl mx-auto px-5 md:px-8 relative z-10 w-full flex-1">
        <div className="relative bg-white border border-surface-elevated rounded-3xl shadow-sm -mt-10 p-6 md:p-8">
          <h1 className="text-2xl font-bold text-fg mb-3">{t("aboutTitle")}</h1>
          <p className="text-[15px] text-fg-secondary leading-relaxed">{t("aboutBody")}</p>
          <div className="mt-6 pt-6 border-t border-surface-elevated">
            <h2 className="font-bold text-fg mb-2">{t("aboutContactTitle")}</h2>
            <p className="text-sm text-fg-secondary mb-4">{t("aboutPageComingSoon")}</p>
            <button onClick={() => setShowNewTicketForm(true)} className="bg-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-hover transition">{t("footerContact")}</button>
          </div>
        </div>

        {/* ---- SSS: alt bilgideki "SSS" bağlantısının gerçek hedefi ---- */}
        <div id="about-faq" className="scroll-mt-20 bg-white border border-surface-elevated rounded-3xl shadow-sm p-6 md:p-8 mt-5">
          <h2 className="text-xl font-bold text-fg mb-4">{t("faqTitle")}</h2>
          <div className="divide-y divide-surface-elevated">
            {faqs.map((f, i) => (
              <details key={i} className="py-3 group">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-3 text-sm font-semibold text-fg-strong">
                  {f.q}
                  <ChevronRight size={15} className="text-fg-muted flex-shrink-0 transition group-open:rotate-90" />
                </summary>
                <p className="text-sm text-fg-secondary leading-relaxed mt-2">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-12"><SiteFooter /></div>
    </div>
  );
}
