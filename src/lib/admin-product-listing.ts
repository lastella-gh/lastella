import type { Enums, Tables } from "@/integrations/supabase/types";

type SearchableProduct = Pick<
  Tables<"products">,
  "name_en" | "name_ar" | "slug" | "kind" | "category" | "brand_id"
> & { brand: { name: string } | null };

export function getProductKindLabel(kind: Enums<"product_kind">) {
  return kind === "jewelry" ? "Jewelry" : "Jewelery Box";
}

export function filterAdminProducts<T extends SearchableProduct>(
  products: readonly T[],
  filters: { search: string; type: string; brandId: string },
): T[] {
  const query = filters.search.trim().toLowerCase();
  return products.filter(
    (product) =>
      (filters.type === "all" ||
        product.kind === filters.type ||
        (product.kind === "jewelry" && `category:${product.category}` === filters.type)) &&
      (filters.brandId === "all" || product.brand_id === filters.brandId) &&
      (!query ||
        [
          product.name_en,
          product.name_ar,
          product.slug,
          product.brand?.name,
          getProductKindLabel(product.kind),
          product.kind.replace("_", " "),
          product.category,
        ].some((value) => value?.toLowerCase().includes(query))),
  );
}
