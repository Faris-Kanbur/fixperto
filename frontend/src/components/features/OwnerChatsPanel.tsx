import { useRef } from "react";
import { MessageCircle, ChevronRight, ChevronLeft, Send, Image as ImageIcon, Calendar } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";
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
    t, conversations, activeConvoId, setActiveConvoId, activeConvo,
    chatInput, setChatInput, sendOwnerMessageWithReply, handleFileSelect,
    ownerLang, mechanicsList, setSelectedMechanicId, setScreen, setToast,
    setSelectedDate, setSelectedTime, setBookingService, setProblemDesc, setProblemPhotos,
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
          <div className="px-5 py-4 border-b border-surface-elevated flex items-center justify-between">
            <h3 className="font-bold text-fg text-sm">{t("chats")}</h3>
            <span className="text-xs text-fg-muted">{conversations.length}</span>
          </div>
          <div className="max-h-[62vh] overflow-y-auto divide-y divide-background">
            {conversations.map((c) => {
              const last = c.messages[c.messages.length - 1];
              const on = activeConvoId === c.id;
              return (
                <button key={c.id} onClick={() => setActiveConvoId(c.id)}
                  className={`w-full text-left px-5 py-4 transition flex items-center gap-3 ${on ? "bg-blue-50/70" : "hover:bg-background"}`}>
                  <div className="text-xl bg-primary-tint rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0">{c.mechanicImg}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-fg text-sm truncate">{c.mechanicName}</h4>
                    <p className="text-xs text-fg-muted truncate">{last ? last.text : t("noMessagesInChatYet")}</p>
                  </div>
                  <ChevronRight size={15} className={`flex-shrink-0 ${on ? "text-blue-400" : "text-fg-muted"}`} />
                </button>
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
              <div className="text-xl bg-primary-tint rounded-xl w-9 h-9 flex items-center justify-center flex-shrink-0">{convo.mechanicImg}</div>
              <span className="text-sm font-semibold text-fg truncate">{convo.mechanicName}</span>
              <button onClick={bookWithMechanic} className="ml-auto flex-shrink-0 text-xs font-semibold text-primary bg-primary-tint hover:bg-blue-100 px-3 py-1.5 rounded-full transition flex items-center gap-1.5">
                <Calendar size={13} /> {t("bookWithThisMechanic")}
              </button>
            </div>

            <div className="flex-1 px-5 py-5 overflow-y-auto max-h-[52vh] bg-gray-50/50">
              {convo.messages.map((m) => (<ChatBubble key={m.id} msg={m} viewerLang={ownerLang} mine={m.sender === "owner"} />))}
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
                  className="flex-1 px-4 py-2.5 rounded-full border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
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
