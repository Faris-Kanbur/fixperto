import { useEffect, useState } from "react";
import { Briefcase, MapPin, Clock, Mail, ChevronRight, Sparkles, Users, Wrench } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";
import { setPageMeta } from "../../utils/helpers";
import { SiteFooter } from "./SiteFooter";
import { PageTopBar } from "./BrandMark";

/**
 * KARİYER SAYFASI — Fixperto'nun kendi açık pozisyonları.
 * ---------------------------------------------------------------------------------------------
 * NEDEN AYRI: alt bilgideki "Kariyer" bağlantısı eskiden Hakkımızda sayfasına gidiyordu; olmayan
 * bir içeriği vaat ettiği için kaldırılmıştı. Şimdi gerçek bir sayfası var ve ilanlar yönetici
 * panelinden giriliyor — yani kod değiştirmeden ilan açılıp kapatılabiliyor.
 *
 * TAMİRCİ İŞ İLANLARINDAN FARKI: buradaki ilanların işvereni FİXPERTO. Tamircilerin açtığı
 * ilanlar ayrı bir listede (iş ilanları araması) duruyor ve karışmamaları önemli: iki ilan türü
 * farklı okuyucuya, farklı başvuru yoluna ve farklı yönetim ekranına sahip.
 *
 * BAŞVURU: ilan başına bir e-posta adresi. Site içi başvuru formu bilinçli olarak YOK — özgeçmiş
 * saklamak kişisel veri sorumluluğu doğurur ve bu ölçekte e-posta yeterli, dürüst bir çözüm.
 *
 * Açık pozisyon yoksa sayfa boş kalmıyor: ekip kültürü ve "her zaman açığız" mesajı gösteriliyor,
 * çünkü kariyer sayfasına giren kişi bir sonraki adımı arıyor.
 *
 * Modül düzeyinde tanımlı — bkz. tests/ui.test.mjs KURAL 8.
 */

const TYPE_KEYS = {
  full_time: "careerTypeFullTime",
  part_time: "careerTypePartTime",
  intern: "careerTypeIntern",
  remote: "careerTypeRemote",
};

export function CareersPage() {
  const { t, careerPosts } = useApp();
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    setPageMeta({ title: t("careersTitle"), description: t("careersSubtitle"), canonicalPath: "/kariyer" });
  }, [t]);

  const values = [
    { icon: Wrench, title: t("careerValue1Title"), body: t("careerValue1Body") },
    { icon: Users, title: t("careerValue2Title"), body: t("careerValue2Body") },
    { icon: Sparkles, title: t("careerValue3Title"), body: t("careerValue3Body") },
  ];

  return (
    <div className="w-full bg-gray-50 min-h-screen flex flex-col">
      <PageTopBar />

      {/* ---- Başlık bandı ---- */}
      <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-rose-800 text-white">
        <div className="max-w-5xl mx-auto px-5 md:px-8 py-12 md:py-16">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide bg-white/10 px-3 py-1.5 rounded-full mb-4">
            <Briefcase size={12} /> {t("careersBadge")}
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">{t("careersTitle")}</h1>
          <p className="text-white/80 text-sm md:text-base leading-relaxed max-w-2xl">{t("careersSubtitle")}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 md:px-8 py-8 md:py-10 w-full flex-1">
        {/* ---- Neden burada çalışılır ---- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {values.map((v) => (
            <div key={v.title} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 mb-3"><v.icon size={18} /></div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">{v.title}</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>

        {/* ---- Açık pozisyonlar ---- */}
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-900">{t("careersOpenRoles")}</h2>
          <span className="text-sm text-gray-400">{careerPosts.length}</span>
        </div>

        {careerPosts.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-3xl text-center py-16 px-6">
            <Briefcase size={36} className="mx-auto text-gray-200 mb-3" />
            <p className="font-semibold text-gray-700 mb-1">{t("careersNoRolesTitle")}</p>
            <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">{t("careersNoRolesBody")}</p>
            <a href="mailto:kariyer@fixperto.com" className="mt-5 inline-flex items-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-rose-700 transition">
              <Mail size={15} /> kariyer@fixperto.com
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {careerPosts.map((job) => {
              const open = openId === job.id;
              return (
                <div key={job.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                  <button onClick={() => setOpenId(open ? null : job.id)} aria-expanded={open}
                    className="w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-gray-50/70 transition">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900 text-[15px] truncate">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-gray-400">
                        {job.department && <span className="flex items-center gap-1"><Briefcase size={11} /> {job.department}</span>}
                        {job.location && <span className="flex items-center gap-1"><MapPin size={11} /> {job.location}</span>}
                        <span className="flex items-center gap-1"><Clock size={11} /> {t(TYPE_KEYS[job.employmentType] || "careerTypeFullTime")}</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className={`text-gray-300 flex-shrink-0 transition ${open ? "rotate-90" : ""}`} />
                  </button>
                  {open && (
                    <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                      {job.summary && <p className="text-sm text-gray-600 leading-relaxed mb-3">{job.summary}</p>}
                      {job.description && <p className="text-[13px] text-gray-500 leading-relaxed whitespace-pre-line">{job.description}</p>}
                      <a href={`mailto:${job.applyEmail || "kariyer@fixperto.com"}?subject=${encodeURIComponent(job.title)}`}
                        className="mt-4 inline-flex items-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-rose-700 transition">
                        <Mail size={15} /> {t("careersApplyBtn")}
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
