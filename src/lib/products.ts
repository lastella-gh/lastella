import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "@/lib/i18n";
import type { Product, ProductKind, ProductVariant } from "@/lib/store";

type ProductRow = Awaited<ReturnType<typeof loadProducts>>[number];

const PRODUCT_SELECT = `
  *,
  brand:brands!inner(id, name, slug, visible),
  variants:product_variants(id, size, color, size_ar, color_ar, available)
`;

async function loadProducts(kind?: ProductKind) {
  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("visible", true)
    .order("created_at", { ascending: false });
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export function mapProduct(row: ProductRow): Product {
  const variants = (row.variants ?? []) as ProductVariant[];
  return {
    id: row.id,
    slug: row.slug,
    name: { en: row.name_en, ar: row.name_ar ?? "" },
    category: row.category,
    kind: row.kind,
    brandId: row.brand_id,
    brand: row.brand,
    price: Number(row.price),
    oldPrice: row.old_price ? Number(row.old_price) : undefined,
    image: row.image,
    rating: Number(row.rating || 0),
    reviews: Number(row.reviews || 0),
    isNewArrival: row.is_new_arrival,
    isBestSeller: row.is_best_seller,
    badge:
      (row.badge as Product["badge"]) ??
      (row.is_new_arrival ? "new" : row.is_best_seller ? "bestseller" : undefined),
    available: row.available,
    visible: row.visible,
    description: row.description_en || undefined,
    descriptionAr: row.description_ar || undefined,
    images: row.images?.length ? row.images : [row.image],
    variants,
    sizes: [...new Set(variants.map((variant) => variant.size).filter(Boolean))] as string[],
    colors: [...new Set(variants.map((variant) => variant.color).filter(Boolean))] as string[],
  };
}

export function getLocalizedProductName(product: Product, language: Lang) {
  if (language === "en") return product.name.en;
  if (product.name.ar) return product.name.ar;
  if (product.kind === "ring_box") return "صندوق خاتم";
  if (product.kind === "general_box") return "صندوق هدايا";
  const categoryName: Record<NonNullable<Product["category"]>, string> = {
    necklace: "قلادة",
    bracelet: "سوار",
    bangle: "سوار مفتوح",
    anklet: "خلخال",
    ring: "خاتم",
    earrings: "أقراط",
    pendant: "دلاية",
    watch: "ساعة",
  };
  return product.category ? `قطعة من فئة ${categoryName[product.category]}` : "قطعة مجوهرات";
}

export function useProducts(kind: ProductKind = "jewelry") {
  return useQuery({
    queryKey: ["products", kind],
    queryFn: async () =>
      (await loadProducts(kind))
        .map(mapProduct)
        .filter((product) => product.brand?.visible !== false),
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });
}

export function useBoxProducts(kind: "ring_box" | "general_box") {
  return useProducts(kind);
}

export function useAllBoxProducts() {
  return useQuery({
    queryKey: ["products", "brand-boxes"],
    queryFn: async () => {
      const [ringBoxes, generalBoxes] = await Promise.all([
        loadProducts("ring_box"),
        loadProducts("general_box"),
      ]);
      return [...ringBoxes, ...generalBoxes]
        .map(mapProduct)
        .filter((product) => product.brand?.visible !== false);
    },
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => getPublicProductBySlug(slug),
    enabled: !!slug,
    retry: 1,
  });
}

export async function getPublicProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("visible", true)
    .maybeSingle();
  if (error) throw error;
  const product = data ? mapProduct(data) : null;
  return product && product.brand?.visible !== false ? product : null;
}
