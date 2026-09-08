import { useRef } from "react";
import { MessageCircle, ChevronRight, ChevronLeft, Send, Image as ImageIcon, Calendar } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";
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
        <div className={`bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden ${convo ? "hidden lg:block" : ""}`}>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">{t("chats")}</h3>
            <span className="text-xs text-gray-400">{conversations.length}</span>
          </div>
          <div className="max-h-[62vh] overflow-y-auto divide-y divide-gray-50">
            {conversations.map((c) => {
              const last = c.messages[c.messages.length - 1];
              const on = activeConvoId === c.id;
              return (
                <button key={c.id} onClick={() => setActiveConvoId(c.id)}
                  className={`w-full text-left px-5 py-4 transition flex items-center gap-3 ${on ? "bg-rose-50/70" : "hover:bg-gray-50"}`}>
                  <div className="text-xl bg-rose-50 rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0">{c.mechanicImg}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm truncate">{c.mechanicName}</h4>
                    <p className="text-xs text-gray-400 truncate">{last ? last.text : t("noMessagesInChatYet")}</p>
                  </div>
                  <ChevronRight size={15} className={`flex-shrink-0 ${on ? "text-rose-400" : "text-gray-300"}`} />
                </button>
              );
            })}
            {conversations.length === 0 && (
              <div className="text-center py-16 px-5">
                <MessageCircle size={36} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">{t("noConvosYetNote")}</p>
              </div>
            )}
          </div>
        </div>

        {/* SAĞ: seçili sohbet */}
        <div className={`bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[62vh] ${convo ? "" : "hidden lg:flex"}`}>
          {convo ? (<>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
              <button onClick={() => setActiveConvoId(null)} aria-label={t("back")} className="text-gray-400 hover:text-gray-700 lg:hidden"><ChevronLeft size={18} /></button>
              <div className="text-xl bg-rose-50 rounded-xl w-9 h-9 flex items-center justify-center flex-shrink-0">{convo.mechanicImg}</div>
              <span className="text-sm font-semibold text-gray-900 truncate">{convo.mechanicName}</span>
              <button onClick={bookWithMechanic} className="ml-auto flex-shrink-0 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-full transition flex items-center gap-1.5">
                <Calendar size={13} /> {t("bookWithThisMechanic")}
              </button>
            </div>

            <div className="flex-1 px-5 py-5 overflow-y-auto max-h-[52vh] bg-gray-50/50">
              {convo.messages.map((m) => (<ChatBubble key={m.id} msg={m} viewerLang={ownerLang} mine={m.sender === "owner"} />))}
            </div>

            {rejected ? (
              <div className="px-5 py-4 border-t border-gray-100">
                <div className="bg-gray-100 text-gray-500 text-xs text-center py-3 rounded-xl">{t("applicationRejectedNotice")}</div>
              </div>
            ) : (
              <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-2">
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                <button onClick={() => fileRef.current?.click()} aria-label={t("addPhotoAria")} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition flex-shrink-0"><ImageIcon size={18} /></button>
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendOwnerMessageWithReply(chatInput); }}
                  placeholder={t("chatInputPlaceholder")}
                  className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200" />
                <button onClick={() => sendOwnerMessageWithReply(chatInput)} aria-label={t("sendBtn")} className="w-10 h-10 flex items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700 transition flex-shrink-0"><Send size={16} /></button>
              </div>
            )}
          </>) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-20">
              <MessageCircle size={40} className="text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm">{t("selectConversationHint")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
