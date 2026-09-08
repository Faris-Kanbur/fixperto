import { useEffect, useState } from "react";
import { Plus, Trash2, Eye, EyeOff, Save, Briefcase } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";
import { api } from "../../services/api/client";

/**
 * YÖNETİCİ — KARİYER İLANLARI.
 * ---------------------------------------------------------------------------------------------
 * Fixperto'nun kendi açık pozisyonları buradan açılıp kapatılıyor; kod değiştirmeye gerek yok.
 *
 * TASLAK VARSAYILAN: yeni ilan "taslak" olarak açılıyor. Yarım kalmış bir ilanın kazayla yayına
 * çıkması, boş bir ilan sayfasından daha kötü. Yayına almak ayrı ve bilinçli bir tıklama.
 *
 * SİLME ONAYSIZ DEĞİL: silme geri alınamaz olduğu için onay penceresinden geçiyor (uygulamanın
 * geri kalanında da aynı kural).
 *
 * Modül düzeyinde tanımlı — bkz. tests/ui.test.mjs KURAL 8.
 */
const EMPTY = {
  title: "", department: "", location: "", employmentType: "full_time",
  summary: "", description: "", applyEmail: "kariyer@fixperto.com", status: "draft",
};

export function AdminCareersPanel() {
  const { t, setToast, setConfirmDialog } = useApp();
  const [rows, setRows] = useState<any[]>([]);
  const [draft, setDraft] = useState<any>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    api.careers.adminList()
      .then(setRows)
      .catch((e) => setToast({ type: "info", text: `⚠️ ${e?.message || "Kariyer ilanları yüklenemedi."}` }));
  };
  useEffect(load, []);

  const save = async () => {
    if (!draft.title.trim()) { setToast({ type: "info", text: "⚠️ Başlık zorunlu." }); return; }
    setLoading(true);
    try {
      if (editingId) await api.careers.update(editingId, draft);
      else await api.careers.create(draft);
      setDraft(EMPTY); setEditingId(null); load();
      setToast({ type: "info", text: "✅ Kariyer ilanı kaydedildi." });
    } catch (e: any) {
      setToast({ type: "info", text: `⚠️ ${e?.message || "Kaydedilemedi."}` });
    } finally { setLoading(false); }
  };

  const togglePublish = async (row) => {
    try {
      await api.careers.update(row.id, { status: row.status === "published" ? "draft" : "published" });
      load();
    } catch (e: any) { setToast({ type: "info", text: `⚠️ ${e?.message || "Güncellenemedi."}` }); }
  };

  const remove = (row) => setConfirmDialog({
    title: "İlanı sil",
    body: `"${row.title}" kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
    confirmLabel: "Evet, sil",
    danger: true,
    onConfirm: async () => {
      try { await api.careers.remove(row.id); load(); setToast({ type: "info", text: "🗑️ İlan silindi." }); }
      catch (e: any) { setToast({ type: "info", text: `⚠️ ${e?.message || "Silinemedi."}` }); }
    },
  });

  const field = "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 items-start">
      {/* ---- Liste ---- */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2"><Briefcase size={15} className="text-rose-500" /> Kariyer ilanları</h3>
          <span className="text-xs text-gray-400">{rows.length}</span>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-14">Henüz ilan yok. Sağdaki formdan ekleyin.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {rows.map((r) => (
              <div key={r.id} className="px-5 py-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm truncate flex items-center gap-2">
                    {r.title}
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${r.status === "published" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                      {r.status === "published" ? "Yayında" : "Taslak"}
                    </span>
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">{[r.department, r.location].filter(Boolean).join(" · ") || "—"}</p>
                </div>
                <button onClick={() => togglePublish(r)} aria-label={r.status === "published" ? "Yayından kaldır" : "Yayına al"}
                  className="text-gray-400 hover:text-rose-600 p-2 -m-1">{r.status === "published" ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                <button onClick={() => { setDraft({ ...EMPTY, ...r }); setEditingId(r.id); }} aria-label="Düzenle"
                  className="text-gray-400 hover:text-gray-700 p-2 -m-1"><Save size={15} /></button>
                <button onClick={() => remove(r)} aria-label="Sil" className="text-red-400 hover:text-red-600 p-2 -m-1"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---- Form ---- */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-gray-900 text-sm">{editingId ? "İlanı düzenle" : "Yeni ilan"}</h3>
        <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Pozisyon başlığı" className={field} />
        <div className="grid grid-cols-2 gap-2">
          <input value={draft.department} onChange={(e) => setDraft({ ...draft, department: e.target.value })} placeholder="Birim" className={field} />
          <input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} placeholder="Konum" className={field} />
        </div>
        <select value={draft.employmentType} onChange={(e) => setDraft({ ...draft, employmentType: e.target.value })} className={field} aria-label="Çalışma şekli">
          <option value="full_time">{t("careerTypeFullTime")}</option>
          <option value="part_time">{t("careerTypePartTime")}</option>
          <option value="intern">{t("careerTypeIntern")}</option>
          <option value="remote">{t("careerTypeRemote")}</option>
        </select>
        <input value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} placeholder="Kısa özet" className={field} />
        <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="İlan metni" rows={6} className={`${field} resize-none`} />
        <input value={draft.applyEmail} onChange={(e) => setDraft({ ...draft, applyEmail: e.target.value })} placeholder="Başvuru e-postası" className={field} />
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input type="checkbox" checked={draft.status === "published"} onChange={(e) => setDraft({ ...draft, status: e.target.checked ? "published" : "draft" })} className="w-4 h-4 accent-rose-600" />
          Yayında
        </label>
        <div className="flex gap-2 pt-1">
          {editingId && (
            <button onClick={() => { setDraft(EMPTY); setEditingId(null); }} className="flex-1 border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm">Vazgeç</button>
          )}
          <button onClick={save} disabled={loading} className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-60 flex items-center justify-center gap-1.5">
            <Plus size={15} /> {editingId ? "Kaydet" : "Ekle"}
          </button>
        </div>
      </div>
    </div>
  );
}
