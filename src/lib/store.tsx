import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ProductKind = "jewelry" | "ring_box" | "general_box";

export interface ProductVariant {
  id: string;
  size: string | null;
  color: string | null;
  size_ar?: string | null;
  color_ar?: string | null;
  available: boolean;
}

export type ProductCategory =
  | "necklace"
  | "bracelet"
  | "bangle"
  | "handcuff"
  | "anklet"
  | "ring"
  | "earrings"
  | "pendant"
  | "watch";

export interface Product {
  id: string;
  slug: string;
  name: { en: string; ar: string };
  category: ProductCategory | null;
  kind: ProductKind;
  brandId: string;
  brand: { id: string; name: string; slug: string; visible: boolean } | null;
  price: number;
  oldPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  badge?: "new" | "sale" | "bestseller";
  isNewArrival: boolean;
  isBestSeller: boolean;
  available: boolean;
  visible: boolean;
  description?: string;
  descriptionAr?: string;
  images: string[];
  sizes: string[];
  colors: string[];
  variants: ProductVariant[];
}

export interface CartItem {
  id: string;
  product: Product;
  qty: number;
  size?: string;
  color?: string;
  variantId?: string;
}

export function isCartItemPurchasable(item: CartItem) {
  return hasValidVariantSelection(item.product, item.size, item.color, item.variantId);
}

function hasValidVariantSelection(
  product: Product,
  size?: string,
  color?: string,
  variantId?: string,
) {
  if (!product.available) return false;
  if (!product.variants.length) return !variantId && !size && !color;
  const variant = product.variants.find((option) => option.id === variantId);
  return (
    Boolean(variant?.available) &&
    (variant?.size ?? undefined) === size &&
    (variant?.color ?? undefined) === color
  );
}

interface StoreCtx {
  cart: CartItem[];
  wishlist: string[];
  addToCart: (
    p: Product,
    qty?: number,
    size?: string,
    color?: string,
    variantId?: string,
  ) => boolean;
  updateCartItemOptions: (
    cartItemId: string,
    product: Product,
    size?: string,
    color?: string,
    variantId?: string,
  ) => boolean;
  removeFromCart: (cartItemId: string) => void;
  updateQty: (cartItemId: string, qty: number) => void;
  clearCart: () => void;
  toggleWishlist: (id: string) => void;
  cartCount: number;
  cartTotal: number;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    try {
      const c = localStorage.getItem("lastella-cart");
      const w = localStorage.getItem("lastella-wishlist");
      if (c) {
        const stored = JSON.parse(c) as CartItem[];
        setCart(
          stored.map((item) => ({
            ...item,
            product: {
              ...item.product,
              kind: item.product.kind ?? "jewelry",
              brandId: item.product.brandId ?? "",
              brand: item.product.brand ?? null,
              available: item.product.available ?? true,
              visible: item.product.visible ?? true,
              variants: item.product.variants ?? [],
            },
          })),
        );
      }
      if (w) setWishlist(JSON.parse(w));
    } catch {
      // Storage can be unavailable in privacy modes.
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("lastella-cart", JSON.stringify(cart));
    } catch {
      // Storage can be unavailable in privacy modes.
    }
  }, [cart]);
  useEffect(() => {
    try {
      localStorage.setItem("lastella-wishlist", JSON.stringify(wishlist));
    } catch {
      // Storage can be unavailable in privacy modes.
    }
  }, [wishlist]);

  const value = useMemo<StoreCtx>(
    () => ({
      cart,
      wishlist,
      addToCart: (p, qty = 1, size, color, variantId) => {
        if (!hasValidVariantSelection(p, size, color, variantId)) return false;

        setCart((c) => {
          const cartItemId = `${p.id}-${variantId ?? "no-variant"}`;
          const ex = c.find((i) => i.id === cartItemId);
          if (ex) return c.map((i) => (i.id === cartItemId ? { ...i, qty: i.qty + qty } : i));
          return [...c, { id: cartItemId, product: p, qty, size, color, variantId }];
        });
        return true;
      },
      updateCartItemOptions: (cartItemId, product, size, color, variantId) => {
        if (!hasValidVariantSelection(product, size, color, variantId)) return false;
        const existingItem = cart.find((item) => item.id === cartItemId);
        if (!existingItem) return false;
        const nextId = `${product.id}-${variantId ?? "no-variant"}`;
        const matchingItem = cart.find((item) => item.id === nextId && item.id !== cartItemId);
        setCart((items) => {
          if (matchingItem) {
            return items
              .filter((item) => item.id !== cartItemId)
              .map((item) =>
                item.id === nextId ? { ...item, qty: item.qty + existingItem.qty } : item,
              );
          }
          return items.map((item) =>
            item.id === cartItemId
              ? { ...item, id: nextId, product, size, color, variantId }
              : item,
          );
        });
        return true;
      },
      removeFromCart: (cartItemId) => setCart((c) => c.filter((i) => i.id !== cartItemId)),
      updateQty: (cartItemId, qty) =>
        setCart((c) =>
          qty <= 0
            ? c.filter((i) => i.id !== cartItemId)
            : c.map((i) => (i.id === cartItemId ? { ...i, qty } : i)),
        ),
      clearCart: () => setCart([]),
      toggleWishlist: (id) =>
        setWishlist((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id])),
      cartCount: cart.reduce((s, i) => s + i.qty, 0),
      cartTotal: cart.reduce((s, i) => s + i.qty * i.product.price, 0),
    }),
    [cart, wishlist],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore must be inside StoreProvider");
  return c;
}
