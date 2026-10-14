import type { Product } from "@/lib/store";

export function shuffleProducts<T>(products: readonly T[], seed: number): T[] {
  const shuffled = [...products];
  let state = seed >>> 0;

  function random() {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ـ/g, "")
    .toLowerCase();
}

export function matchesProductSearch(
  product: Product,
  query: string,
  arabicName = product.name.ar,
): boolean {
  const terms = normalizeSearch(query).trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const text = normalizeSearch(
    [product.name.en, arabicName, product.brand?.name, product.slug].filter(Boolean).join(" "),
  );
  return terms.every((term) => text.includes(term));
}
