import { useRef } from "react";
import { MessageCircle, ChevronRight, ChevronLeft, Send, Image as ImageIcon, Calendar, Trash2 } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";
import { MY_OWNER_ID } from "../../data/constants";
import { EmojiPicker } from "./EmojiPicker";
import { ChatBubble } from "./ChatBubble";

/**
 * ARAÇ SAHİBİ — MESAJLAR (iki panelli)
 * ---------------------------------------------------------------------------------------------
 * ÖNCEKİ HÂLİ: sohbetler kart ızgarasıydı; bir sohbete girmek AYRI BİR EKRANA (screen="chat")
 * götürüyordu. Sonuç: masaüstünde koca ekranın ortasında dar bir sohbet, listeye dönmek için
 * her seferinde geri tuşu, iki kişiyle yazışırken sürekli ileri-geri. Tamirci tarafı zaten
 * doğru deseni kullanıyordu (solda liste, sağda sohbet) — araç sahibi tarafı da aynı oldu.
 *
 * MOBİLDE davranış korunuyor: dar ekranda iki paneli yan yana koymak okunmaz olurdu, bu yüzden
 * sohbet seçilince liste gizleniyor ve üstte geri oku çıkıyor (tamirci tarafındaki ile aynı).
 *
 * Ayrı ekran (screen="chat") KALDIRILMADI: bildirimlerden ve tamirci profilinden doğrudan o
 * ekrana giden yollar var. Bu panel listeyle sohbeti birleştiriyor, o akışları bozmuyor.
 *
 * Modül düzeyinde tanımlı — bkz. tests/ui.test.mjs KURAL 8.
 */
export function OwnerChatsPanel() {
  const {
    t, conversations, activeConvoId, setActiveConvoId, activeConvo, convoPeerDisplay,
    chatInput, setChatInput, sendOwnerMessageWithReply, handleFileSelect,
    ownerLang, setOwnerLang, mechanicsList, setSelectedMechanicId, setScreen, setToast,
    setSelectedDate, setSelectedTime, setBookingService, setProblemDesc, setProblemPhotos,
    chatSelectedIds, setChatSelectedIds, toggleChatSelect,
    chatSelecting: selecting, startChatSelecting: startSelecting, stopChatSelecting: stopSelecting,
    deleteConversationWithConfirm, bulkDeleteSelectedChats,
  } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const convo = activeConvo;
  const lastMsg = convo?.messages?.[convo.messages.length - 1];
  const rejected = !!lastMsg?.isRejectionNotice;

  const bookWithMechanic = () => {
    // Sohbet kendi tamirci bağlamını convo.mechanicId üzerinden tutuyor; randevu ekranı ise
    // selectedMechanicId okuyor. Burada eşitlemezsek YANLIŞ tamirciyle randevu açılırdı.
    const mech = mechanicsList.find((m) => m.id === convo.mechanicId);
    if (!mech) { setToast({ type: "info", text: t("mechanicNoLongerListed") }); return; }
    setSelectedMechanicId(mech.id);
    setSelectedDate(null); setSelectedTime(null); setBookingService(null);
    setProblemDesc(""); setProblemPhotos([]);
    setScreen("booking");
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-5 md:px-8 py-6 md:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 items-start">
        {/* SOL: sohbet listesi */}
        <div className={`bg-white border border-surface-elevated rounded-3xl shadow-sm overflow-hidden ${convo ? "hidden lg:block" : ""}`}>
          <div className="px-5 py-4 border-b border-surface-elevated">
            {/* SOHBET SİLME (kullanıcı isteği): tek tek (her satırdaki çöp kutusu), hepsi ya da bir
                kaçı birlikte (bu seçim modu — "Tümünü Seç" ile hepsi de kapsanmış olur, ayrı bir
                "hepsini sil" düğmesine gerek kalmadan). */}
            {selecting ? (
              <div className="flex items-center justify-between gap-2">
                <button onClick={stopSelecting} className="text-xs font-semibold text-fg-secondary hover:text-fg-strong flex-shrink-0">{t("cancel")}</button>
                <span className="text-xs text-fg-muted truncate">{t("chatSelectedCountLabel", { n: String(chatSelectedIds.length) })}</span>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button onClick={() => setChatSelectedIds(chatSelectedIds.length === conversations.length ? [] : conversations.map((c) => c.id))} className="text-xs font-semibold text-primary hover:underline">
                    {chatSelectedIds.length === conversations.length ? t("galleryClearSelectionBtn") : t("gallerySelectAllBtn")}
                  </button>
                  <button onClick={bulkDeleteSelectedChats} disabled={chatSelectedIds.length === 0} className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${chatSelectedIds.length === 0 ? "text-fg-muted cursor-not-allowed" : "text-error hover:bg-error-tint"}`}>
                    {t("galleryBulkDeleteBtn")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-fg text-sm">{t("chats")}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-fg-muted">{conversations.length}</span>
                  {conversations.length > 0 && (
                    <button onClick={startSelecting} className="text-xs font-semibold text-primary hover:underline">{t("selectChatsBtn")}</button>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="max-h-[62vh] overflow-y-auto divide-y divide-background">
            {conversations.map((c) => {
              const last = c.messages[c.messages.length - 1];
              const on = activeConvoId === c.id;
              // convoPeerDisplay: owner-owner sohbette c.mechanicName/mechanicImg sabit bir değer
              // taşır (bkz. tanımındaki not) — gerçek karşı taraf İZLEYENE göre hesaplanıyor.
              const peer = convoPeerDisplay(c);
              const checked = chatSelectedIds.includes(c.id);
              return (
                <div key={c.id} className={`w-full flex items-center gap-3 px-5 py-4 transition ${on && !selecting ? "bg-primary-tint/70" : "hover:bg-background"}`}>
                  {selecting && (
                    <input type="checkbox" checked={checked} onChange={() => toggleChatSelect(c.id)} aria-label={t("selectChatsBtn")} className="w-4 h-4 flex-shrink-0 accent-blue-600" />
                  )}
                  <button onClick={() => (selecting ? toggleChatSelect(c.id) : setActiveConvoId(c.id))} className="flex-1 min-w-0 flex items-center gap-3 text-left">
                    <div className="text-xl bg-primary-tint rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0">{peer.img}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-fg text-sm truncate">{peer.name}</h4>
                      <p className="text-xs text-fg-muted truncate">{last ? last.text : t("noMessagesInChatYet")}</p>
                    </div>
                  </button>
                  {!selecting && (
                    <button onClick={() => deleteConversationWithConfirm(c.id)} aria-label={t("deleteChatAria")} className="flex-shrink-0 text-fg-muted hover:text-error p-1.5 rounded-lg hover:bg-error-tint transition"><Trash2 size={14} /></button>
                  )}
                  {!selecting && <ChevronRight size={15} className={`flex-shrink-0 ${on ? "text-primary-subtle" : "text-fg-muted"}`} />}
                </div>
              );
            })}
            {conversations.length === 0 && (
              <div className="text-center py-16 px-5">
                <MessageCircle size={36} className="mx-auto text-fg-muted mb-3" />
                <p className="text-fg-muted text-sm">{t("noConvosYetNote")}</p>
              </div>
            )}
          </div>
        </div>

        {/* SAĞ: seçili sohbet */}
        <div className={`bg-white border border-surface-elevated rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[62vh] ${convo ? "" : "hidden lg:flex"}`}>
          {convo ? (<>
            <div className="px-5 py-4 border-b border-surface-elevated flex items-center gap-2.5">
              <button onClick={() => setActiveConvoId(null)} aria-label={t("back")} className="text-fg-muted hover:text-fg-strong lg:hidden"><ChevronLeft size={18} /></button>
              <div className="text-xl bg-primary-tint rounded-xl w-9 h-9 flex items-center justify-center flex-shrink-0">{convoPeerDisplay(convo).img}</div>
              <span className="text-sm font-semibold text-fg truncate">{convoPeerDisplay(convo).name}</span>
              <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                {/* Randevu alma yalnızca tamirci sohbetinde anlamlı — iki araç sahibi arası
                    sohbette (convo.mechanicId null, bkz. convo.peerOwnerId) bu buton hiç
                    gösterilmiyor. */}
                {convo.mechanicId != null && (
                <button onClick={bookWithMechanic} className="text-xs font-semibold text-primary bg-primary-tint hover:bg-blue-100 px-3 py-1.5 rounded-full transition flex items-center gap-1.5">
                  <Calendar size={13} /> {t("bookWithThisMechanic")}
                </button>
                )}
                {/* Kendi görüntüleme dilini sohbetin içindeyken değiştirebilme — eskiden ayrı
                    tek-sütunlu screen="chat" ekranındaydı (kaldırıldı, bkz. AppShell.tsx notu);
                    aynı erişilebilirlik düzeltmesiyle (focus:ring-focus) buraya taşındı. */}
                <select value={ownerLang} onChange={(e) => setOwnerLang(e.target.value)} className="bg-surface-elevated text-fg-strong text-xs rounded-lg px-2 py-1 border-none outline-none focus:ring-2 focus:ring-focus">
                  <option value="tr">🇹🇷 TR</option>
                  <option value="en">🇬🇧 EN</option>
                  <option value="de">🇩🇪 DE</option>
                </select>
                <button onClick={() => deleteConversationWithConfirm(convo.id)} aria-label={t("deleteChatAria")} className="w-8 h-8 flex items-center justify-center rounded-lg text-fg-muted hover:text-error hover:bg-error-tint transition"><Trash2 size={15} /></button>
              </div>
            </div>

            {/* mine: owner-owner sohbette satırın İKİ TARAFI da role="owner" damgalanıyor, yani
                sender tek başına "bu benim mi" sorusuna cevap veremiyor — gerçek gönderen kimliği
                (senderId) kullanılıyor. Tamirci sohbetinde davranış değişmiyor. */}
            <div className="flex-1 px-5 py-5 overflow-y-auto max-h-[52vh] bg-background/50">
              {convo.messages.map((m) => (<ChatBubble key={m.id} msg={m} viewerLang={ownerLang} mine={convo.peerOwnerId != null ? m.senderId === MY_OWNER_ID : m.sender === "owner"} />))}
            </div>

            {rejected ? (
              <div className="px-5 py-4 border-t border-surface-elevated">
                <div className="bg-surface-elevated text-fg-secondary text-xs text-center py-3 rounded-xl">{t("applicationRejectedNotice")}</div>
              </div>
            ) : (
              <div className="px-5 py-4 border-t border-surface-elevated flex items-center gap-2">
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                <button onClick={() => fileRef.current?.click()} aria-label={t("addPhotoAria")} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-elevated text-fg-secondary hover:bg-border transition flex-shrink-0"><ImageIcon size={18} /></button>
                {/* Emoji, yazılan metnin SONUNA ekleniyor ve kutu boş bile olsa çalışıyor.
                    İmleç konumuna eklemek daha "doğru" görünürdü ama ekranda klavyeyle emoji
                    seçen kişi zaten yazının sonundadır; karmaşıklığın karşılığı yok. */}
                <EmojiPicker onPick={(e) => setChatInput((v) => `${v || ""}${e}`)} />
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendOwnerMessageWithReply(chatInput); }}
                  placeholder={t("chatInputPlaceholder")}
                  className="flex-1 px-4 py-2.5 rounded-full border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-subtle" />
                <button onClick={() => sendOwnerMessageWithReply(chatInput)} aria-label={t("sendBtn")} className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover transition flex-shrink-0"><Send size={16} /></button>
              </div>
            )}
          </>) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-20">
              <MessageCircle size={40} className="text-fg-muted mb-3" />
              <p className="text-fg-muted text-sm">{t("selectConversationHint")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
