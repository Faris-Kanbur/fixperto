// Basit, bağımlılıksız (kütüphanesiz) çubuk grafik — admin panelindeki büyüme trendlerini göstermek için.
export function MiniBarChart({ labels, values, colorClass, valueFormat = undefined }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-stretch gap-2 h-28">
      {values.map((v, i) => {
        const h = Math.max(6, Math.round((v / max) * 88));
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
            <span className="text-[9px] font-semibold text-fg-secondary">{valueFormat ? valueFormat(v) : v}</span>
            <div className={`w-full rounded-t-md ${colorClass || "bg-info"}`} style={{ height: `${h}px` }} />
            <span className="text-[9px] text-fg-muted mt-0.5">{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}
