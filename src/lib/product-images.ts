export const PRODUCT_IMAGE_WIDTHS = [128, 256, 384, 640, 768, 1024, 1280] as const;
export type ProductImageWidth = (typeof PRODUCT_IMAGE_WIDTHS)[number];

export function productImageUrl(source: string, width: ProductImageWidth) {
  if (!import.meta.env.VITE_VERCEL_IMAGES) return source;
  try {
    const url = new URL(source);
    const storage = new URL(import.meta.env.VITE_SUPABASE_URL);
    if (
      url.origin !== storage.origin ||
      !url.pathname.startsWith("/storage/v1/object/public/product-images/")
    )
      return source;
    return `/_vercel/image?${new URLSearchParams({ url: source, w: String(width), q: "75" })}`;
  } catch {
    return source;
  }
}
