import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { lc } from "../../utils/helpers";

/**
 * YAZARAK SÜZÜLEN SEÇİM KUTUSU (combobox)
 * ---------------------------------------------------------------------------------------------
 * NEDEN AÇILIR LİSTE (select) DEĞİL:
 * Marka listesi 25, model listesi kimi markada 12 satır. Klasik bir `select` içinde "Mercedes"i
 * bulmak için listeyi gözle taramak gerekiyor; klavyeyle yazarak arama tarayıcıya göre değişiyor
 * ve çoğu zaman yalnızca ilk harfe bakıyor. Burada kutuya yazdıkça liste süzülüyor.
 *
 * NEDEN SERBEST YAZMA DA AÇIK:
 * Ne marka ne model listesi her aracı kapsayabilir (Togg, BYD, ithal kasalar, ticari araçlar).
 * Listeyi zorunlu kılmak, listede olmayan aracın sahibini tamamen dışarıda bırakırdı. Bu yüzden
 * yazılan metin listede olmasa bile geçerli sayılıyor — liste bir kısıt değil, bir hızlandırıcı.
 *
 * ODAK NOTU: bu bileşen MODÜL DÜZEYİNDE tanımlı ve öyle kalmalı. Bir bileşenin içinde
 * tanımlansaydı her tuş vuruşunda yeni bir bileşen türü olur, React input'u söküp yeniden kurar
 * ve KULLANICI HER HARFTEN SONRA ODAĞI KAYBEDERDİ. (Bu hata bu projede gerçekten yaşandı;
 * tests/ui.test.mjs KURAL 8 bunu bekliyor.)
 */
export function ComboBox({
  value,
  onChange,
  options = [],
  placeholder = "",
  ariaLabel = "",
  compact = false,
  disabled = false,
  emptyHint = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options?: string[];
  placeholder?: string;
  ariaLabel?: string;
  compact?: boolean;
  disabled?: boolean;
  emptyHint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklayınca kapan. Kapanırken yazılan metne DOKUNMUYORUZ — listede olmayan bir değer
  // de geçerli, silmek kullanıcının yazdığını çöpe atmak olurdu.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const q = lc(value).trim();
  // Yazılan metin tam olarak bir seçeneğe eşitse süzme yapmıyoruz: kullanıcı "BMW"yi seçtikten
  // sonra listeyi tekrar açtığında yalnızca BMW'yi değil, tüm markaları görmeli (fikir değiştirebilir).
  const exact = options.some((o) => lc(o) === q);
  const filtered = !q || exact ? options : options.filter((o) => lc(o).includes(q));

  const commit = (v) => { onChange(v); setOpen(false); };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setHighlight((h) => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter" && open && filtered[highlight]) { e.preventDefault(); commit(filtered[highlight]); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  const box = compact
    ? "w-full pl-3 pr-8 py-2 rounded-lg border border-gray-200 text-xs bg-white"
    : "w-full pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm bg-white";

  return (
    <div className="relative" ref={boxRef}>
      <input
        value={value || ""}
        disabled={disabled}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlight(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
        className={`${box} focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 disabled:bg-gray-50 disabled:text-gray-400`}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel || placeholder}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:text-gray-200"
      >
        <ChevronDown size={15} className={open ? "rotate-180 transition" : "transition"} />
      </button>

      {open && !disabled && (
        <div role="listbox" className="absolute left-0 right-0 top-full mt-1 z-40 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-400">{emptyHint}</p>
          ) : filtered.map((o, i) => {
            const selected = lc(o) === q;
            return (
              <button
                key={o}
                type="button"
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => commit(o)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 transition
                  ${i === highlight ? "bg-rose-50 text-rose-700" : "text-gray-700 hover:bg-gray-50"}`}
              >
                <span className="truncate">{o}</span>
                {selected && <Check size={14} className="text-rose-500 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
