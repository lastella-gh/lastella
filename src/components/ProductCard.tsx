import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Eye, ShoppingBag, Star } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useStore, type Product } from "@/lib/store";
import { formatNumber, formatPrice } from "@/lib/currency";
import { getLocalizedProductName } from "@/lib/products";
import { toast } from "sonner";

export function ProductCard({ product }: { product: Product }) {
  const { t, lang } = useI18n();
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const navigate = useNavigate();

  if (!product) return null;

  const wished = Array.isArray(wishlist) && wishlist.includes(product.id);
  const price = Number(product.price || 0);
  const oldPrice = product.oldPrice ? Number(product.oldPrice) : null;
  const discount =
    oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

  const nameText = getLocalizedProductName(product, lang);
  const requiresOptions = product.variants.length > 0;

  const ratingVal =
    typeof product.rating === "number" ? product.rating : Number(product.rating || 0);
  const reviewsVal =
    typeof product.reviews === "number" ? product.reviews : Number(product.reviews || 0);

  const badgeLabel =
    product.badge === "new"
      ? t("product.new")
      : product.badge === "sale"
        ? t("product.sale")
        : product.badge === "bestseller"
          ? t("product.bestseller")
          : null;

  return (
    <div className="group relative">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug || "" }}
        preload="intent"
        className="block"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-secondary">
          <img
            src={product.image || "/favicon.png"}
            alt={nameText}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {/* Badges */}
          <div className="absolute top-3 start-3 flex flex-col gap-1.5">
            {badgeLabel && (
              <span className="rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1">
                {badgeLabel}
              </span>
            )}
            {discount > 0 && (
              <span className="rounded-full bg-foreground text-background text-[10px] font-semibold px-2.5 py-1">
                -{formatNumber(discount, lang)}%
              </span>
            )}
            {!product.available && (
              <span className="rounded-full bg-foreground text-background text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1">
                {t("product.unavailable")}
              </span>
            )}
          </div>
          {/* Quick actions */}
          <div className="absolute top-3 end-3 flex flex-col gap-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleWishlist(product.id);
              }}
              className="grid place-items-center h-9 w-9 rounded-full glass hover:bg-primary hover:text-primary-foreground transition-all"
              aria-label={t("product.wishlist")}
            >
              <Heart className={`h-4 w-4 ${wished ? "fill-primary text-primary" : ""}`} />
            </button>
            <button
              onClick={(e) => e.preventDefault()}
              className="grid place-items-center h-9 w-9 rounded-full glass hover:bg-primary hover:text-primary-foreground transition-all"
              aria-label={t("product.quickView")}
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
          {/* Add to cart overlay */}
          <div className="absolute inset-x-3 bottom-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <button
              onClick={(e) => {
                e.preventDefault();
                if (!product.available) return;
                if (requiresOptions) {
                  void navigate({ to: "/product/$slug", params: { slug: product.slug } });
                  return;
                }
                if (!addToCart(product)) {
                  toast.error(t("product.optionUnavailable"));
                  return;
                }
                toast.success(`${nameText} ${lang === "ar" ? "أضيفت إلى السلة" : "added to cart"}`);
              }}
              disabled={!product.available}
              className="w-full glass-dark rounded-full py-2.5 text-xs font-semibold uppercase tracking-[0.15em] flex items-center justify-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              {!product.available
                ? t("product.unavailable")
                : requiresOptions
                  ? t("product.chooseOptions")
                  : t("product.addToCart")}
            </button>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Star className="h-3 w-3 fill-primary text-primary" />
            <span>
              {formatNumber(ratingVal, lang, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
            </span>
            <span>·</span>
            <span>{formatNumber(reviewsVal, lang)}</span>
          </div>
          <h3 className="font-display text-lg leading-snug text-foreground group-hover:text-primary transition-colors">
            {nameText}
          </h3>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-base font-semibold">{formatPrice(price, lang)}</span>
            {oldPrice && oldPrice > 0 && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(oldPrice, lang)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
