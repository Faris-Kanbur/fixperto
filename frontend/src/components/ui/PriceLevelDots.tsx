import { priceLevel } from "../../utils/helpers";

export function PriceLevelDots({ price }) {
  const lvl = priceLevel(price);
  return (
    <span className="whitespace-nowrap" title={`${price}₺`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= lvl ? "text-primary font-bold text-sm" : "text-fg-muted font-bold text-sm"}>€</span>
      ))}
    </span>
  );
}
