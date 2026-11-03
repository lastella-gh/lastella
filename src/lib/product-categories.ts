export const PRODUCT_CATEGORIES = [
  "necklace",
  "bracelet",
  "bangle",
  "handcuff",
  "anklet",
  "ring",
  "earrings",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export function isProductCategory(value: unknown): value is ProductCategory {
  return PRODUCT_CATEGORIES.some((category) => category === value);
}
