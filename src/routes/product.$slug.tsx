import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  Heart,
  Minus,
  Plus,
  RotateCcw,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ProductCard } from "@/components/ProductCard";
import { formatPrice } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import { getPublicProductBySlug, useProducts } from "@/lib/products";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const product = await getPublicProductBySlug(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.product.name.en ?? "Product"} · Lastella` },
      { name: "description", content: loaderData?.product.description ?? "Discover Lastella." },
      { property: "og:image", content: loaderData?.product.image },
    ],
  }),
  component: ProductPage,
  notFoundComponent: () => <div className="p-20 text-center">Product not found.</div>,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { t, lang } = useI18n();
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const firstAvailableVariant = product.variants.find((variant) => variant.available);
  const [qty, setQty] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    firstAvailableVariant?.color ?? product.colors[0],
  );
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    firstAvailableVariant?.size ?? product.sizes[0],
  );
  const [activeImage, setActiveImage] = useState(product.image);
  const { data: jewelry = [] } = useProducts();

  const selectedVariant = product.variants.find(
    (variant) =>
      (variant.color ?? undefined) === selectedColor &&
      (variant.size ?? undefined) === selectedSize,
  );
  const purchasable =
    product.available && (product.variants.length === 0 || Boolean(selectedVariant?.available));
  const matchingRings =
    product.kind === "jewelry" && product.category !== "ring" && selectedColor
      ? jewelry
          .filter(
            (candidate) =>
              candidate.category === "ring" &&
              candidate.available &&
              candidate.variants.some(
                (variant) => variant.available && variant.color === selectedColor,
              ),
          )
          .slice(0, 4)
      : [];
  const related = jewelry
    .filter((candidate) => candidate.category === product.category && candidate.id !== product.id)
    .slice(0, 4);
  const gallery = [...new Set([product.image, ...product.images])];

  function addCurrentProduct() {
    if (!purchasable) {
      toast.error("This product option is unavailable");
      return;
    }
    addToCart(product, qty, selectedSize, selectedColor, selectedVariant?.id);
    toast.success(`${product.name[lang] || product.name.en} added to cart`);
  }

  const categoryLabel =
    product.kind === "ring_box"
      ? lang === "ar"
        ? "صندوق خاتم"
        : "Ring Box"
      : product.kind === "general_box"
        ? lang === "ar"
          ? "صندوق هدايا"
          : "General Gift Box"
        : product.category
          ? t(`cat.${product.category}` as never)
          : "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-8 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary">
          {t("nav.home")}
        </Link>{" "}
        /{" "}
        <Link to="/shop" className="hover:text-primary">
          {t("nav.shop")}
        </Link>{" "}
        / <span className="text-foreground">{product.name[lang] || product.name.en}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-3xl bg-secondary">
            <img
              src={activeImage}
              alt={product.name[lang] || product.name.en}
              className="h-full w-full object-cover"
            />
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-5 gap-3">
              {gallery.map((image) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveImage(image)}
                  className={`aspect-square overflow-hidden rounded-xl ring-2 ${activeImage === image ? "ring-primary" : "ring-transparent hover:ring-primary/50"}`}
                >
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-primary">
            {product.brand?.name} · {categoryLabel}
          </p>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">
            {product.name[lang] || product.name.en}
          </h1>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={`h-4 w-4 ${index < Math.round(product.rating) ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
                />
              ))}
            </div>
            <span className="text-muted-foreground">
              {product.rating} · {product.reviews} reviews
            </span>
          </div>
          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-4xl">{formatPrice(product.price)}</span>
            {product.oldPrice && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(product.oldPrice)}
              </span>
            )}
          </div>
          {!product.available && (
            <p className="mt-4 inline-flex rounded-full bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive">
              Currently unavailable
            </p>
          )}
          <p className="mt-6 leading-relaxed text-foreground/75">
            {product.description ??
              "Beautifully presented and selected for the Lastella collection."}
          </p>

          <div className="mt-8 space-y-5">
            {product.colors.length > 0 && (
              <OptionGroup
                label="Color"
                options={product.colors}
                selected={selectedColor}
                onSelect={setSelectedColor}
              />
            )}
            {product.sizes.length > 0 && (
              <OptionGroup
                label={product.category === "ring" ? "Ring Size" : "Size"}
                options={product.sizes}
                selected={selectedSize}
                onSelect={setSelectedSize}
              />
            )}
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-border">
              <button
                type="button"
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="p-3"
                aria-label="Decrease"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button
                type="button"
                onClick={() => setQty(qty + 1)}
                className="p-3"
                aria-label="Increase"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={addCurrentProduct}
              disabled={!purchasable}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingBag className="h-4 w-4" />{" "}
              {purchasable ? t("product.addToCart") : "Unavailable"}
            </button>
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              className="grid h-14 w-14 place-items-center rounded-full border border-border"
              aria-label="Wishlist"
            >
              <Heart
                className={`h-5 w-5 ${wishlist.includes(product.id) ? "fill-primary text-primary" : ""}`}
              />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 text-xs">
            <Feature Icon={Truck} label="Delivery across Oman" />
            <Feature Icon={Shield} label={t("common.lifetime")} />
            <Feature Icon={RotateCcw} label={t("common.returns")} />
          </div>
        </div>
      </div>

      {matchingRings.length > 0 && (
        <section className="mt-20 rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-display text-3xl">Rings in {selectedColor}</h2>
          </div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {matchingRings.map((ring) => (
              <ProductCard key={ring.id} product={ring} />
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-8 font-display text-3xl">
            {lang === "ar" ? "قد يعجبك أيضًا" : "You may also love"}
          </h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function OptionGroup({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected?: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={`rounded-full border px-4 py-2 text-sm ${selected === option ? "border-primary bg-primary/5 text-primary" : "border-border"}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function Feature({ Icon, label }: { Icon: typeof Truck; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-secondary/50 p-4 text-center">
      <Icon className="h-5 w-5 text-primary" />
      <span className="leading-tight text-muted-foreground">{label}</span>
    </div>
  );
}
