import { formatDigits } from "@/lib/currency";
import type { Lang } from "@/lib/i18n";

export type VariantOptionKind = "color" | "size";

const arabicLabels: Record<VariantOptionKind, Record<string, string>> = {
  color: {
    beige: "بيج",
    black: "أسود",
    blue: "أزرق",
    bronze: "برونزي",
    brown: "بني",
    burgundy: "عنابي",
    camel: "جملي",
    champagne: "شامبانيا",
    clear: "شفاف",
    cream: "كريمي",
    gold: "ذهبي",
    golden: "ذهبي",
    gray: "رمادي",
    grey: "رمادي",
    green: "أخضر",
    maroon: "عنابي",
    "multi color": "متعدد الألوان",
    multicolor: "متعدد الألوان",
    navy: "كحلي",
    orange: "برتقالي",
    pink: "وردي",
    purple: "بنفسجي",
    red: "أحمر",
    rose: "وردي",
    "rose gold": "ذهبي وردي",
    silver: "فضي",
    white: "أبيض",
    yellow: "أصفر",
  },
  size: {
    "extra large": "كبير جدًا",
    "extra small": "صغير جدًا",
    free: "مقاس حر",
    "free size": "مقاس حر",
    large: "كبير",
    l: "كبير",
    m: "متوسط",
    medium: "متوسط",
    one: "مقاس واحد",
    "one size": "مقاس واحد",
    s: "صغير",
    small: "صغير",
    xl: "كبير جدًا",
    xs: "صغير جدًا",
    xxl: "كبير جدًا جدًا",
    xxs: "صغير جدًا جدًا",
  },
};

function normalizeOption(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

export function getKnownArabicVariantLabel(kind: VariantOptionKind, value: string) {
  const normalized = normalizeOption(value);
  if (!normalized) return undefined;
  if (kind === "size" && /^\d+(?:\.\d+)?$/.test(normalized)) {
    return formatDigits(value, "ar");
  }
  return arabicLabels[kind][normalized];
}

export function getVariantOptionLabel(
  value: string,
  language: Lang,
  kind: VariantOptionKind,
  arabicValue?: string | null,
) {
  if (language !== "ar") return value;
  const savedArabicValue = arabicValue?.trim();
  if (savedArabicValue) {
    return kind === "size" ? formatDigits(savedArabicValue, language) : savedArabicValue;
  }
  return getKnownArabicVariantLabel(kind, value) || value;
}
