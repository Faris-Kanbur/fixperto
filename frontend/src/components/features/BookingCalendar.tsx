import { useState, useMemo, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Check } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";
import { monthGrid, slotPeriod } from "../../utils/helpers";
import { DAY_LABELS_BY_LANG, DAY_LABELS } from "../../data/constants";

/**
 * RANDEVU TARİH & SAAT SEÇİCİ
 * ---------------------------------------------------------------------------------------------
 * TASARIM KARARI — NEDEN HAFTA ŞERİDİ, NEDEN AY IZGARASI DEĞİL:
 * Bir önceki sürüm kalıcı bir ay ızgarasıydı. Doğru çalışıyordu ama 6 satır kare hücre, formun
 * içinde ~500 piksel yer kaplıyordu; randevu ekranının geri kalanı (hizmet, araç, özet) ekrandan
 * itiliyordu. Oysa randevuların ezici çoğunluğu ÖNÜMÜZDEKİ BİRKAÇ GÜN için alınıyor.
 *
 * Bu yüzden: varsayılan görünüm TEK SATIR hafta şeridi (yaklaşık 90 piksel). Daha ileri bir
 * tarih gerekiyorsa "Takvim" düğmesi ay ızgarasını AÇILIR PANEL olarak getiriyor — 90 günlük
 * aralık duruyor ama yer kaplamıyor. Randevu ve otel sitelerinde yerleşmiş kalıp bu; bizim
 * eklediğimiz şey her günün altındaki BOŞ SAAT SAYISI: kişi hangi günün müsait olduğunu
 * takvime tıklamadan görüyor. Bir servis randevusunda asıl soru "hangi gün yer var" olduğu için
 * bu sayı, sadece açık/kapalı göstermekten daha faydalı.
 *
 * Saatler de üç bölüme AYRI BAŞLIKLAR hâlinde değil, tek sıra süzgeç + yoğun ızgara olarak
 * duruyor — aynı bilgi, üçte bir yükseklikte.
 *
 * DÜRÜST SINIR: "dolu" bilgisi bu cihazın gördüğü randevu listesinden hesaplanıyor. İki kişi
 * aynı anda aynı saati seçerse çakışmayı asıl engelleyecek yer backend'dir; orada henüz slot
 * kilidi yok.
 */

const LOCALES = { tr: "tr-TR", en: "en-GB", de: "de-DE" };
const MAX_DAYS_AHEAD = 90;

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sameDay = (a, b) => !!a && !!b && a.toDateString() === b.toDateString();
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** Haftanın başı = Pazartesi (TR/DE takvim alışkanlığı). */
const weekStartOf = (d) => addDays(startOfDay(d), -((d.getDay() + 6) % 7));

export function BookingCalendar({ mechanic, selectedDate, onSelectDate, selectedTime, onSelectTime }) {
  const { t, lang, isDayOpenForMechanic, bookableSlots } = useApp();
  const locale = LOCALES[lang] || LOCALES.tr;
  const today = startOfDay(new Date());
  const lastBookable = addDays(today, MAX_DAYS_AHEAD);
  const dayLabels = DAY_LABELS_BY_LANG[lang] || DAY_LABELS;
  const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  const [weekStart, setWeekStart] = useState(() => weekStartOf(selectedDate || today));
  const [showMonth, setShowMonth] = useState(false);
  const [period, setPeriod] = useState("all");
  const monthRef = useRef(null);

  // Açılır takvim dışına tıklanınca kapansın — panel açık kalıp altındaki saatleri örtmesin.
  useEffect(() => {
    if (!showMonth) return;
    const onDown = (e) => { if (monthRef.current && !monthRef.current.contains(e.target)) setShowMonth(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showMonth]);

  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  // Her gün için boş saat sayısı. Şeridin altındaki küçük rakam bu — "hangi gün yer var"
  // sorusunun cevabını tıklamadan veriyor.
  // useMemo BİLEREK kullanılmadı: bookableSlots/isDayOpenForMechanic her render'da yeni birer
  // fonksiyon olduğu için bağımlılık dizisi hep değişir, yani ezberleme sahte olurdu. Hesap
  // zaten küçük (7 gün × saat listesi).
  const freeByDay = week.map((d) => {
    if (d < today || d > lastBookable || !isDayOpenForMechanic(mechanic, d)) return -1; // seçilemez
    return bookableSlots(mechanic, d).filter((s) => !s.taken && !s.past).length;
  });

  const canPrevWeek = weekStart > weekStartOf(today);
  const canNextWeek = addDays(weekStart, 7) <= lastBookable;

  const slots = selectedDate ? bookableSlots(mechanic, selectedDate) : [];
  const counts = {
    all: slots.filter((s) => !s.taken && !s.past).length,
    morning: slots.filter((s) => !s.taken && !s.past && slotPeriod(s.time) === "morning").length,
    afternoon: slots.filter((s) => !s.taken && !s.past && slotPeriod(s.time) === "afternoon").length,
    evening: slots.filter((s) => !s.taken && !s.past && slotPeriod(s.time) === "evening").length,
  };
  const shown = period === "all" ? slots : slots.filter((s) => slotPeriod(s.time) === period);

  const pickDay = (d) => { onSelectDate(d); onSelectTime(null); setPeriod("all"); };

  const rangeLabel = `${weekStart.toLocaleDateString(locale, { day: "numeric" })} – ${addDays(weekStart, 6).toLocaleDateString(locale, { day: "numeric", month: "short" })}`;

  const filters = [
    { key: "all", label: t("bookingAllSlots") },
    { key: "morning", label: t("bookingSlotsMorning") },
    { key: "afternoon", label: t("bookingSlotsAfternoon") },
    { key: "evening", label: t("bookingSlotsEvening") },
  ].filter((f) => f.key === "all" || counts[f.key] > 0);

  return (
    <div>
      {/* ---- ÜST SATIR: hafta gezinme + açılır ay takvimi ---- */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1">
          <button onClick={() => setWeekStart((w) => addDays(w, -7))} disabled={!canPrevWeek}
            aria-label={t("bookingPrevWeek")}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${canPrevWeek ? "text-gray-500 hover:bg-gray-100" : "text-gray-200 cursor-not-allowed"}`}>
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-gray-900 tabular-nums">{rangeLabel}</span>
          <button onClick={() => setWeekStart((w) => addDays(w, 7))} disabled={!canNextWeek}
            aria-label={t("bookingNextWeek")}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${canNextWeek ? "text-gray-500 hover:bg-gray-100" : "text-gray-200 cursor-not-allowed"}`}>
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="relative" ref={monthRef}>
          <button onClick={() => setShowMonth((v) => !v)}
            aria-expanded={showMonth}
            className={`flex items-center gap-1.5 px-3 h-8 rounded-lg border text-xs font-semibold transition ${showMonth ? "border-rose-300 text-rose-600 bg-rose-50" : "border-gray-200 text-gray-600 hover:border-rose-300 hover:text-rose-600"}`}>
            <CalendarDays size={14} /> {t("bookingOpenMonth")}
          </button>
          {showMonth && (
            <MonthPopover
              anchorDate={selectedDate || weekStart}
              today={today}
              lastBookable={lastBookable}
              locale={locale}
              dayLabels={dayLabels}
              dayKeys={dayKeys}
              selectedDate={selectedDate}
              isOpenDay={(d) => isDayOpenForMechanic(mechanic, d)}
              onPick={(d) => { pickDay(d); setWeekStart(weekStartOf(d)); setShowMonth(false); }}
              t={t}
            />
          )}
        </div>
      </div>

      {/* ---- HAFTA ŞERİDİ ---- */}
      <div className="grid grid-cols-7 gap-1.5">
        {week.map((d, i) => {
          const free = freeByDay[i];
          const disabled = free < 0;
          const isSel = sameDay(d, selectedDate);
          const isToday = sameDay(d, today);
          return (
            <button key={i} disabled={disabled} onClick={() => pickDay(d)} aria-pressed={isSel}
              aria-label={d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
              className={`py-2 rounded-xl border text-center transition
                ${isSel ? "bg-rose-600 border-rose-600 text-white shadow-sm"
                  : disabled ? "border-gray-100 text-gray-300 cursor-not-allowed"
                  : "border-gray-200 text-gray-700 hover:border-rose-400 hover:bg-rose-50/50"}
                ${isToday && !isSel && !disabled ? "ring-1 ring-inset ring-rose-200" : ""}`}>
              <span className={`block text-[10px] font-semibold uppercase tracking-wide ${isSel ? "text-rose-100" : "text-gray-400"}`}>
                {dayLabels[dayKeys[i]]}
              </span>
              <span className="block text-base font-bold leading-tight tabular-nums">{d.getDate()}</span>
              {/* Boş saat sayısı: bu şeridin asıl faydası. Kapalı/geçmiş günde çizgi. */}
              <span className={`block text-[10px] leading-tight ${isSel ? "text-rose-100" : free > 0 ? "text-emerald-600 font-semibold" : "text-gray-300"}`}>
                {disabled ? "—" : free > 0 ? free : t("bookingSlotTaken")}
              </span>
            </button>
          );
        })}
      </div>

      {/* ---- SAATLER ---- */}
      {!selectedDate ? (
        <p className="text-sm text-gray-400 mt-3">{t("bookingPickDayFirst")}</p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-gray-400 mt-3">{t("noSlotsForDay")}</p>
      ) : counts.all === 0 ? (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 mt-3">{t("bookingNoSlotsLeftToday")}</p>
      ) : (
        <div className="mt-3">
          {/* Günün bölümleri: üç ayrı başlık yerine tek satır süzgeç — aynı bilgi, üçte bir yer. */}
          {filters.length > 1 && (
            <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-0.5">
              {filters.map((f) => (
                <button key={f.key} onClick={() => setPeriod(f.key)}
                  className={`flex-shrink-0 px-2.5 h-7 rounded-full text-[11px] font-semibold border transition ${period === f.key ? "bg-gray-900 border-gray-900 text-white" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}>
                  {f.label} <span className={period === f.key ? "text-gray-300" : "text-gray-400"}>{counts[f.key]}</span>
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-4 sm:grid-cols-6 xl:grid-cols-8 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
            {shown.map((s) => {
              const disabled = s.taken || s.past;
              const isSel = selectedTime === s.time;
              return (
                <button key={s.time} disabled={disabled} onClick={() => onSelectTime(s.time)}
                  title={s.taken ? t("bookingSlotTaken") : s.past ? t("bookingSlotPast") : undefined}
                  className={`h-9 rounded-lg border text-[13px] font-semibold tabular-nums transition
                    ${isSel ? "bg-rose-600 border-rose-600 text-white shadow-sm"
                      : disabled ? "border-gray-100 text-gray-300 line-through cursor-not-allowed"
                      : "border-gray-200 text-gray-700 hover:border-rose-400 hover:text-rose-600"}`}>
                  {s.time}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Ay ızgarası — yalnızca "Takvim" düğmesiyle açılan panel. Kalıcı olarak yer kaplamıyor. */
function MonthPopover({ anchorDate, today, lastBookable, locale, dayLabels, dayKeys, selectedDate, isOpenDay, onPick, t }) {
  const [cursor, setCursor] = useState(() => new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1));
  const cells = useMemo(() => monthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const canPrev = cursor > new Date(today.getFullYear(), today.getMonth(), 1);
  const canNext = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1) <= lastBookable;

  return (
    <div className="absolute right-0 top-10 z-30 w-[266px] bg-white border border-gray-200 rounded-2xl shadow-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))} disabled={!canPrev}
          aria-label={t("bookingPrevMonth")}
          className={`w-7 h-7 rounded-lg flex items-center justify-center ${canPrev ? "text-gray-500 hover:bg-gray-100" : "text-gray-200 cursor-not-allowed"}`}>
          <ChevronLeft size={15} />
        </button>
        <p className="text-xs font-bold text-gray-900 capitalize">{cursor.toLocaleDateString(locale, { month: "long", year: "numeric" })}</p>
        <button onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))} disabled={!canNext}
          aria-label={t("bookingNextMonth")}
          className={`w-7 h-7 rounded-lg flex items-center justify-center ${canNext ? "text-gray-500 hover:bg-gray-100" : "text-gray-200 cursor-not-allowed"}`}>
          <ChevronRight size={15} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-0.5">
        {dayKeys.map((k) => (
          <div key={k} className="text-[9px] font-semibold text-gray-400 text-center uppercase">{(dayLabels[k] || "").slice(0, 2)}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const out = d < today || d > lastBookable;
          const disabled = out || !isOpenDay(d);
          const isSel = sameDay(d, selectedDate);
          return (
            <button key={i} disabled={disabled} onClick={() => onPick(d)}
              className={`h-8 rounded-lg text-xs font-semibold transition
                ${isSel ? "bg-rose-600 text-white" : disabled ? "text-gray-200 cursor-not-allowed" : "text-gray-700 hover:bg-rose-50 hover:text-rose-600"}`}>
              {d.getDate()}
            </button>
          );
        })}
      </div>
      {selectedDate && (
        <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
          <Check size={10} className="text-rose-500" /> {selectedDate.toLocaleDateString(locale, { day: "numeric", month: "long" })}
        </p>
      )}
    </div>
  );
}
