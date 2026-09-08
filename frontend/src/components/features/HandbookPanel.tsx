import { useState, useMemo } from "react";
import { Search, BookOpen, ChevronRight, ChevronDown, FileText, X } from "lucide-react";
import { HANDBOOK, HANDBOOK_PAGES } from "../../data/handbook";
import { lc } from "../../utils/helpers";

/**
 * EL KİTABI PANELİ — yönetici panelindeki "belge alanı" (Confluence benzeri).
 * ---------------------------------------------------------------------------------------------
 * NEDEN VAR: bir davranış tuhaf göründüğünde ilk soru "bu bir hata mı, yoksa bilerek mi böyle
 * tasarlandı?" oluyor. Cevaplar kod yorumlarında dağınıktı. Burada bölüm → sayfa hiyerarşisinde,
 * aranabilir biçimde duruyor.
 *
 * DÜZEN: solda ağaç (bölümler açılıp kapanır, altlarında sayfalar), sağda içerik. Arama kutusu
 * hem başlıkta hem GÖVDEDE arar — bir kuralı hatırlamıyorken "2099" ya da "slot" yazıp bulabilmek
 * asıl kullanım biçimi.
 *
 * İçerik düz metin olarak işleniyor (HTML basılmıyor) — blog sayfasındaki aynı güvenlik kararı.
 *
 * Modül düzeyinde tanımlı — bkz. tests/ui.test.mjs KURAL 8.
 */

/** "## " ile başlayan satırlar alt başlık, kalanlar paragraf. HTML enjeksiyonu mümkün değil. */
function renderBody(body: string) {
  return String(body || "").split(/\n{2,}/).filter((b) => b.trim()).map((block, i) => {
    const line = block.trim();
    if (line.startsWith("## ")) {
      return <h3 key={i} className="text-sm font-bold text-gray-900 mt-6 mb-2 flex items-center gap-2">
        <span className="w-1 h-4 bg-rose-500 rounded-full flex-shrink-0" />{line.slice(3)}
      </h3>;
    }
    return <p key={i} className="text-[13px] leading-relaxed text-gray-600 mb-3 whitespace-pre-line">{line}</p>;
  });
}

export function HandbookPanel() {
  const [query, setQuery] = useState("");
  const [openSections, setOpenSections] = useState<string[]>([HANDBOOK[0].id]);
  const [activeId, setActiveId] = useState(HANDBOOK[0].pages[0].id);

  const q = lc(query).trim();
  const matches = useMemo(() => {
    if (!q) return null;
    return HANDBOOK_PAGES.filter((p) => lc(p.title).includes(q) || lc(p.body).includes(q) || lc(p.sectionTitle).includes(q));
  }, [q]);

  const active = HANDBOOK_PAGES.find((p) => p.id === activeId) || HANDBOOK_PAGES[0];
  const toggle = (id: string) => setOpenSections((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  const openPage = (page) => {
    setActiveId(page.id);
    setOpenSections((o) => (o.includes(page.sectionId) ? o : [...o, page.sectionId]));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start">
      {/* ---- SOL: arama + ağaç ---- */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden lg:sticky lg:top-4">
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="El kitabında ara…"
              aria-label="El kitabında ara"
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Aramayı temizle"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={13} /></button>
            )}
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-2">
          {matches ? (
            matches.length === 0 ? (
              <p className="text-xs text-gray-400 px-3 py-6 text-center">Eşleşme yok.</p>
            ) : (
              <>
                <p className="text-[10px] uppercase tracking-wide text-gray-400 px-3 py-2">{matches.length} sonuç</p>
                {matches.map((p) => (
                  <button key={p.id} onClick={() => { openPage(p); setQuery(""); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition">
                    <span className="block text-xs font-semibold text-gray-800">{p.title}</span>
                    <span className="block text-[10px] text-gray-400 truncate">{p.sectionTitle}</span>
                  </button>
                ))}
              </>
            )
          ) : (
            HANDBOOK.map((s) => {
              const open = openSections.includes(s.id);
              return (
                <div key={s.id} className="mb-0.5">
                  <button onClick={() => toggle(s.id)} aria-expanded={open}
                    className="w-full flex items-center gap-1.5 px-2 py-2 rounded-lg text-left hover:bg-gray-50 transition">
                    {open ? <ChevronDown size={13} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={13} className="text-gray-400 flex-shrink-0" />}
                    <span className="text-xs font-bold text-gray-800 min-w-0 truncate">{s.title}</span>
                  </button>
                  {open && (
                    <div className="ml-4 border-l border-gray-100 pl-2">
                      {s.pages.map((p) => {
                        const on = activeId === p.id;
                        return (
                          <button key={p.id} onClick={() => setActiveId(p.id)}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 ${on ? "bg-rose-50 text-rose-700 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
                            <FileText size={11} className="flex-shrink-0 opacity-60" />
                            <span className="min-w-0 truncate">{p.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ---- SAĞ: sayfa içeriği ---- */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-8 min-h-[60vh]">
        <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-1">
          <BookOpen size={12} /> {active.sectionTitle}
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-5">{active.title}</h2>
        <div className="max-w-3xl">{renderBody(active.body)}</div>
      </div>
    </div>
  );
}
