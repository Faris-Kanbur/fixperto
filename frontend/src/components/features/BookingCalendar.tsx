import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Sunrise, Sun, Moon, CalendarDays, Info } from "lucide-react";
import { useApp } from "../../app/state/AppLogicProvider";
import { monthGrid, slotPeriod } from "../../utils/helpers";
import { DAY_LABELS_BY_LANG, DAY_LABELS } from "../../data/constants";

/**
 * RANDEVU TAKVİMİ
 * ---------------------------------------------------------------------------------------------
 * ÖNCEKİ HÂLİ: yatay kayan 7 günlük bir şerit + düz bir saat ızgarası. İki gerçek sorunu vardı:
 *   1) Yalnızca 7 gün. Bir hafta sonrasına randevu almak mümkün değildi.
 *   2) Saatler tek bir yığın hâlindeydi. 08:30'dan 19:00'a kadar 21 düğme yan yana durunca göz
 *      hiçbir şey seçemiyordu.
 *
 * YENİ HÂLİ: ay görünümlü takvim + günün bölümlerine ayrılmış saatler (Doctolib/Booking akışı).
 * "Pro" görünmesi tek başına amaç değil; asıl kazanç, kişinin dükkânın hangi günler açık
 * olduğunu TAKVİM ÜZERİNDE görmesi ve ileri bir tarihe randevu alabilmesi.
 *
 * AYRI BİLEŞEN OLMASININ TEKNİK SEBEBİ: görünen ayı tutmak için useState gerekiyor; randevu
 * ekranı AppShell içinde koşullu çalışan bir fonksiyonun içinde render ediliyor ve orada hook
 * çağırmak React kurallarına aykırı olurdu.
 *
 * DÜRÜST SINIR: "dolu" bilgisi bu cihazın gördüğü randevu listesinden hesaplanıyor. Aynı saati
 * iki kişi aynı anda seçerse çakışmayı asıl engelleyecek yer backend'dir; orada henüz bir slot
 * kilidi yok.
 */

const LOCALES = { tr: "tr-TR", en: "en-GB", de: "de-DE" };
const MAX_DAYS_AHEAD = 90;

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sameDay = (a, b) => !!a && !!b && a.toDateString() === b.toDateString();

export function BookingCalendar({ mechanic, selectedDate, onSelectDate, selectedTime, onSelectTime }) {
  const { t, lang, isDayOpenForMechanic, bookableSlots } = useApp();
  const locale = LOCALES[lang] || LOCALES.tr;
  const today = startOfDay(new Date());
  const lastBookable = new Date(today.getFullYear(), today.getMonth(), today.getDate() + MAX_DAYS_AHEAD);

  // Görünen ay: seçili gün varsa onunla, yoksa bu ayla açılıyor.
  const [cursor, setCursor] = useState(() => {
    const base = selectedDate || today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const cells = useMemo(() => monthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const dayLabels = DAY_LABELS_BY_LANG[lang] || DAY_LABELS;
  const dayShort = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((k) => (dayLabels[k] || "").slice(0, 2));

  const canGoPrev = cursor > new Date(today.getFullYear(), today.getMonth(), 1);
  const canGoNext = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1) <= lastBookable;
  const shift = (n) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1));

  const dayState = (d) => {
    if (!d) return "empty";
    if (d < today || d > lastBookable) return "out";
    return isDayOpenForMechanic(mechanic, d) ? "open" : "closed";
  };

  const slots = useMemo(
    () => (selectedDate ? bookableSlots(mechanic, selectedDate) : []),
    [mechanic, selectedDate, bookableSlots]
  );
  const groups = [
    { key: "morning", label: t("bookingSlotsMorning"), icon: Sunrise },
    { key: "afternoon", label: t("bookingSlotsAfternoon"), icon: Sun },
    { key: "evening", label: t("bookingSlotsEvening"), icon: Moon },
  ].map((g) => ({ ...g, items: slots.filter((s) => slotPeriod(s.time) === g.key) }))
   .filter((g) => g.items.length > 0);

  const freeCount = slots.filter((s) => !s.taken && !s.past).length;

  return (
    <div>
      {/* ---- AY TAKVİMİ ---- */}
      <div className="border border-gray-200 rounded-2xl p-3 md:p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => shift(-1)}
            disabled={!canGoPrev}
            aria-label={t("bookingPrevMonth")}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${canGoPrev ? "text-gray-600 hover:bg-gray-100" : "text-gray-200 cursor-not-allowed"}`}
          ><ChevronLeft size={18} /></button>
          <p className="text-sm font-bold text-gray-900 capitalize">
            {cursor.toLocaleDateString(locale, { month: "long", year: "numeric" })}
          </p>
          <button
            onClick={() => shift(1)}
            disabled={!canGoNext}
            aria-label={t("bookingNextMonth")}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${canGoNext ? "text-gray-600 hover:bg-gray-100" : "text-gray-200 cursor-not-allowed"}`}
          ><ChevronRight size={18} /></button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayShort.map((d, i) => (
            <div key={i} className="text-[10px] font-semibold text-gray-400 text-center py-1 uppercase tracking-wide">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            const state = dayState(d);
            if (state === "empty") return <div key={i} />;
            const isSel = sameDay(d, selectedDate);
            const isToday = sameDay(d, today);
            const disabled = state !== "open";
            return (
              <button
                key={i}
                disabled={disabled}
                onClick={() => { onSelectDate(d); onSelectTime(null); }}
                aria-label={d.toLocaleDateString(locale, { day: "numeric", month: "long" })}
                aria-pressed={isSel}
                className={`relative aspect-square rounded-xl text-sm font-semibold transition flex items-center justify-center
                  ${isSel ? "bg-rose-600 text-white shadow-sm"
                    : disabled ? "text-gray-200 cursor-not-allowed"
                    : "text-gray-700 hover:bg-rose-50 hover:text-rose-600"}
                  ${isToday && !isSel ? "ring-1 ring-inset ring-rose-300" : ""}`}
              >
                {d.getDate()}
                {/* Açık günün altındaki nokta: kapalı günlerden bir bakışta ayırt edilsin. */}
                {!disabled && !isSel && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-rose-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---- SEÇİLEN GÜNÜN SAATLERİ ---- */}
      {!selectedDate ? (
        <p className="text-sm text-gray-400 mt-4 flex items-center gap-2">
          <CalendarDays size={15} className="text-gray-300" /> {t("bookingPickDayFirst")}
        </p>
      ) : (
        <div className="mt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <p className="text-sm font-bold text-gray-900 capitalize">
              {selectedDate.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
              {sameDay(selectedDate, today) && <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-rose-600 bg-rose-50 rounded px-1.5 py-0.5">{t("bookingTodayLabel")}</span>}
            </p>
            {freeCount > 0 && <p className="text-xs text-gray-400">{t("bookingSlotsAvailable", { n: String(freeCount) })}</p>}
          </div>

          {slots.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">{t("noSlotsForDay")}</p>
          ) : freeCount === 0 ? (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">{t("bookingNoSlotsLeftToday")}</p>
          ) : (
            <div className="space-y-4">
              {groups.map((g) => (
                <div key={g.key}>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5">
                    <g.icon size={12} className="text-rose-400" /> {g.label}
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 gap-2">
                    {g.items.map((s) => {
                      const disabled = s.taken || s.past;
                      const isSel = selectedTime === s.time;
                      return (
                        <button
                          key={s.time}
                          disabled={disabled}
                          onClick={() => onSelectTime(s.time)}
                          title={s.taken ? t("bookingSlotTaken") : s.past ? t("bookingSlotPast") : undefined}
                          className={`py-2.5 rounded-xl border text-sm font-semibold transition
                            ${isSel ? "bg-rose-600 border-rose-600 text-white shadow-sm"
                              : disabled ? "border-gray-100 text-gray-300 line-through cursor-not-allowed"
                              : "border-gray-200 text-gray-700 hover:border-rose-400 hover:text-rose-600"}`}
                        >{s.time}</button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-[11px] text-gray-400 mt-4 flex items-start gap-1.5">
            <Info size={12} className="flex-shrink-0 mt-0.5" /> {t("bookingHoursSourceNote")}
          </p>
        </div>
      )}
    </div>
  );
}
