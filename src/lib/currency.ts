export const CURRENCY = "OMR";
export const CURRENCY_SYMBOL = "OMR";

export function formatPrice(amount: number, lang: "en" | "ar" = "ar"): string {
  const num = Number(amount || 0);
  const formatted = num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
  return lang === "ar" ? `${formatted} ر.ع.` : `OMR ${formatted}`;
}
