import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  X,
  ZoomIn,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type MouseEvent, type TouchEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ProductCard } from "@/components/ProductCard";
import { formatNumber, formatPrice } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import {
  getLocalizedProductName,
  getPublicProductBySlug,
  useAllBoxProducts,
  useProducts,
} from "@/lib/products";
import { getCategoryRecommendations, shuffleProducts } from "@/lib/product-listing";
import { useStore } from "@/lib/store";
import { getVariantOptionLabel } from "@/lib/variant-labels";

type Point = { x: number; y: number };
type ImageGesture =
  | { type: "pinch"; distance: number; scale: number; focalPoint: Point }
  | { type: "drag"; start: Point; pan: Point }
  | { type: "swipe"; start: Point };

export const Route = createFileRoute("/product/$slug")({
  validateSearch: z.object({ cartItemId: z.string().optional() }),
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
  remountDeps: ({ params }) => params.slug,
  pendingMs: 150,
  pendingMinMs: 150,
  pendingComponent: ProductPending,
  component: ProductPage,
  notFoundComponent: ProductNotFound,
});

function ProductNotFound() {
  const { lang } = useI18n();
  return (
    <div className="p-20 text-center">
      {lang === "ar" ? "المنتج غير موجود." : "Product not found."}
    </div>
  );
}

function ProductPending() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 h-4 w-48 rounded-full bg-secondary" />
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="aspect-square rounded-3xl bg-secondary" />
        <div className="space-y-5 pt-4">
          <div className="h-3 w-36 rounded-full bg-secondary" />
          <div className="h-12 w-3/4 rounded-2xl bg-secondary" />
          <div className="h-9 w-40 rounded-xl bg-secondary" />
          <div className="h-24 rounded-2xl bg-secondary" />
        </div>
      </div>
    </div>
  );
}

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { cartItemId } = Route.useSearch();
  const { t, lang } = useI18n();
  const { addToCart, updateCartItemOptions, toggleWishlist, wishlist } = useStore();
  const productName = getLocalizedProductName(product, lang);
  const [qty, setQty] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [activeImage, setActiveImage] = useState(product.image);
  const [imageOpen, setImageOpen] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [viewerScale, setViewerScale] = useState(1);
  const [viewerPan, setViewerPan] = useState<Point>({ x: 0, y: 0 });
  const imageViewerRef = useRef<HTMLDivElement>(null);
  const viewerImageRef = useRef<HTMLImageElement>(null);
  const imageGestureRef = useRef<ImageGesture | null>(null);
  const { data: jewelry = [] } = useProducts();
  const { data: boxes = [] } = useAllBoxProducts(product.kind !== "jewelry");
  const [recommendationSeed, setRecommendationSeed] = useState<number | null>(null);

  useEffect(() => {
    setRecommendationSeed(Math.floor(Math.random() * 4294967296));
  }, []);

  const related = useMemo(
    () =>
      recommendationSeed === null
        ? []
        : getCategoryRecommendations(
            product.kind === "jewelry" ? jewelry : boxes,
            product,
            recommendationSeed,
          ),
    [jewelry, boxes, product, recommendationSeed],
  );
  const matchingRings = useMemo(
    () =>
      product.kind === "jewelry" &&
      product.category !== "ring" &&
      (product.category === "bangle" || selectedColor) &&
      recommendationSeed !== null
        ? shuffleProducts(
            jewelry.filter(
              (candidate) =>
                candidate.category === "ring" &&
                candidate.available &&
                (product.category === "bangle" ||
                  candidate.variants.some(
                    (variant) => variant.available && variant.color === selectedColor,
                  )),
            ),
            recommendationSeed,
          ).slice(0, 4)
        : [],
    [jewelry, product.kind, product.category, selectedColor, recommendationSeed],
  );

  useEffect(() => {
    if (!imageOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setImageOpen(false);
        setViewerScale(1);
        setViewerPan({ x: 0, y: 0 });
        imageGestureRef.current = null;
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [imageOpen]);

  const matchingVariants = product.variants.filter(
    (variant) =>
      (variant.color === null || variant.color === selectedColor) &&
      (variant.size === null || variant.size === selectedSize) &&
      (selectedColor === undefined || variant.color === selectedColor) &&
      (selectedSize === undefined || variant.size === selectedSize),
  );
  const selectedVariant = matchingVariants.length === 1 ? matchingVariants[0] : undefined;
  const selectionComplete =
    Boolean(selectedVariant) ||
    (product.colors.length > 0 &&
      product.sizes.length > 0 &&
      selectedColor !== undefined &&
      selectedSize !== undefined);
  const purchasable =
    product.available &&
    (product.variants.length === 0 || (selectionComplete && Boolean(selectedVariant?.available)));
  const gallery = [...new Set([product.image, ...product.images])];
  const activeImageIndex = Math.max(0, gallery.indexOf(activeImage));

  function resetViewerZoom() {
    setViewerScale(1);
    setViewerPan({ x: 0, y: 0 });
    imageGestureRef.current = null;
  }

  function openImageViewer() {
    resetViewerZoom();
    setImageOpen(true);
  }

  function closeImageViewer() {
    setImageOpen(false);
    resetViewerZoom();
  }

  function selectGalleryImage(index: number) {
    if (gallery.length === 0) return;
    const wrappedIndex = (index + gallery.length) % gallery.length;
    setActiveImage(gallery[wrappedIndex]);
    resetViewerZoom();
  }

  function shiftGallery(offset: number) {
    selectGalleryImage(activeImageIndex + offset);
  }

  function clampViewerPan(x: number, y: number, scale: number) {
    if (scale <= 1 || !imageViewerRef.current) return { x: 0, y: 0 };
    const width = viewerImageRef.current?.clientWidth || imageViewerRef.current.clientWidth;
    const height = viewerImageRef.current?.clientHeight || imageViewerRef.current.clientHeight;
    const maxX = (width * (scale - 1)) / 2;
    const maxY = (height * (scale - 1)) / 2;
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  }

  function handleViewerTouchStart(event: TouchEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.touches.length >= 2) {
      const first = event.touches[0];
      const second = event.touches[1];
      const midpointX = (first.clientX + second.clientX) / 2 - bounds.left - bounds.width / 2;
      const midpointY = (first.clientY + second.clientY) / 2 - bounds.top - bounds.height / 2;
      imageGestureRef.current = {
        type: "pinch",
        distance: Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY),
        scale: viewerScale,
        focalPoint: {
          x: (midpointX - viewerPan.x) / viewerScale,
          y: (midpointY - viewerPan.y) / viewerScale,
        },
      };
      return;
    }

    const touch = event.touches[0];
    if (!touch) return;
    const start = { x: touch.clientX, y: touch.clientY };
    imageGestureRef.current =
      viewerScale > 1.01 ? { type: "drag", start, pan: viewerPan } : { type: "swipe", start };
  }

  function handleViewerTouchMove(event: TouchEvent<HTMLDivElement>) {
    const gesture = imageGestureRef.current;
    if (!gesture) return;

    if (event.touches.length >= 2 && gesture.type === "pinch") {
      event.preventDefault();
      const first = event.touches[0];
      const second = event.touches[1];
      const distance = Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
      const scale = Math.min(4, Math.max(1, gesture.scale * (distance / gesture.distance)));
      const bounds = event.currentTarget.getBoundingClientRect();
      const midpointX = (first.clientX + second.clientX) / 2 - bounds.left - bounds.width / 2;
      const midpointY = (first.clientY + second.clientY) / 2 - bounds.top - bounds.height / 2;
      setViewerScale(scale);
      setViewerPan(
        clampViewerPan(
          midpointX - gesture.focalPoint.x * scale,
          midpointY - gesture.focalPoint.y * scale,
          scale,
        ),
      );
      return;
    }

    if (event.touches.length === 1 && gesture.type === "drag") {
      event.preventDefault();
      const touch = event.touches[0];
      setViewerPan(
        clampViewerPan(
          gesture.pan.x + touch.clientX - gesture.start.x,
          gesture.pan.y + touch.clientY - gesture.start.y,
          viewerScale,
        ),
      );
    }
  }

  function handleViewerTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const start = { x: touch.clientX, y: touch.clientY };
      imageGestureRef.current =
        viewerScale > 1.01 ? { type: "drag", start, pan: viewerPan } : { type: "swipe", start };
      return;
    }

    const gesture = imageGestureRef.current;
    if (event.touches.length === 0 && gesture?.type === "swipe") {
      const touch = event.changedTouches[0];
      const deltaX = touch ? touch.clientX - gesture.start.x : 0;
      if (Math.abs(deltaX) > 48) shiftGallery(deltaX < 0 ? 1 : -1);
    }
    imageGestureRef.current = null;
  }

  function toggleViewerZoom() {
    if (viewerScale > 1.01) {
      resetViewerZoom();
      return;
    }
    setViewerScale(2.25);
    setViewerPan({ x: 0, y: 0 });
  }

  function addCurrentProduct() {
    if (!purchasable) {
      toast.error(
        !product.available
          ? t("product.unavailable")
          : !selectionComplete
            ? t("product.selectOptions")
            : t("product.optionUnavailable"),
      );
      return;
    }
    const added = cartItemId
      ? updateCartItemOptions(cartItemId, product, selectedSize, selectedColor, selectedVariant?.id)
      : addToCart(product, qty, selectedSize, selectedColor, selectedVariant?.id);
    if (!added) {
      toast.error(t("product.optionUnavailable"));
      return;
    }
    toast.success(
      cartItemId
        ? t("product.updateCartItem")
        : `${productName} ${lang === "ar" ? "أضيفت إلى السلة" : "added to cart"}`,
    );
  }

  function updateZoomPosition(event: MouseEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setZoomPosition({
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100,
    });
  }

  const categoryLabel =
    product.kind !== "jewelry"
      ? t("product.jeweleryBox")
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
        / <span className="text-foreground">{productName}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-4">
          <button
            type="button"
            onClick={openImageViewer}
            className="relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-3xl bg-secondary lg:hidden"
            aria-label={lang === "ar" ? "تكبير صورة المنتج" : "Enlarge product image"}
          >
            <img src={activeImage} alt={productName} className="h-full w-full object-cover" />
            <span className="absolute start-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur">
              <ZoomIn className="h-5 w-5" />
            </span>
          </button>
          <div
            onMouseEnter={() => setImageZoomed(true)}
            onMouseMove={updateZoomPosition}
            onMouseLeave={() => setImageZoomed(false)}
            className="hidden aspect-square cursor-crosshair overflow-hidden rounded-3xl bg-secondary lg:block"
            aria-label={lang === "ar" ? "مرر المؤشر لتكبير الصورة" : "Hover to zoom product image"}
          >
            <img
              src={activeImage}
              alt={productName}
              className="h-full w-full object-cover transition-transform duration-150 ease-out"
              style={{
                transform: imageZoomed ? "scale(2.35)" : "scale(1)",
                transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
              }}
            />
          </div>
          {gallery.length > 1 && (
            <>
              <div className="flex items-center justify-center gap-6 lg:hidden" dir="ltr">
                <button
                  type="button"
                  onClick={() => shiftGallery(-1)}
                  className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label={lang === "ar" ? "الصورة السابقة" : "Previous image"}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="min-w-12 text-center text-sm text-muted-foreground">
                  {formatNumber(activeImageIndex + 1, lang)} / {formatNumber(gallery.length, lang)}
                </span>
                <button
                  type="button"
                  onClick={() => shiftGallery(1)}
                  className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label={lang === "ar" ? "الصورة التالية" : "Next image"}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div className="hidden grid-cols-5 gap-3 lg:grid">
                {gallery.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => selectGalleryImage(index)}
                    className={`aspect-square overflow-hidden rounded-xl ring-2 ${activeImage === image ? "ring-primary" : "ring-transparent hover:ring-primary/50"}`}
                  >
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-primary">
            {product.brand?.name} · {categoryLabel}
          </p>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">{productName}</h1>
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
              {formatNumber(product.rating, lang, { maximumFractionDigits: 1 })} ·{" "}
              {formatNumber(product.reviews, lang)} {t("product.reviews")}
            </span>
          </div>
          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-4xl">{formatPrice(product.price, lang)}</span>
            {product.oldPrice && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(product.oldPrice, lang)}
              </span>
            )}
          </div>
          {!product.available && (
            <p className="mt-4 inline-flex rounded-full bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive">
              {t("product.unavailable")}
            </p>
          )}
          <p className="mt-6 leading-relaxed text-foreground/75">
            {lang === "ar"
              ? product.descriptionAr || "قطعة مختارة بعناية لتضيف لمسة من الأناقة إلى مجموعتك."
              : product.description ||
                "Beautifully presented and selected for the Lastella collection."}
          </p>

          <div className="mt-8 space-y-5">
            {product.sizes.length > 0 && (
              <OptionGroup
                label={product.category === "ring" ? t("product.ringSize") : t("product.size")}
                options={product.sizes}
                selected={selectedSize}
                onSelect={setSelectedSize}
                language={lang}
                arabicLabel={(option) =>
                  getVariantOptionLabel(
                    option,
                    lang,
                    "size",
                    product.variants.find(
                      (variant) => variant.size === option && variant.size_ar?.trim(),
                    )?.size_ar,
                  )
                }
              />
            )}
            {product.colors.length > 0 && (
              <OptionGroup
                label={t("product.color")}
                options={product.colors}
                selected={selectedColor}
                onSelect={setSelectedColor}
                language={lang}
                arabicLabel={(option) =>
                  getVariantOptionLabel(
                    option,
                    lang,
                    "color",
                    product.variants.find(
                      (variant) => variant.color === option && variant.color_ar?.trim(),
                    )?.color_ar,
                  )
                }
              />
            )}
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-border">
              <button
                type="button"
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="p-3"
                aria-label={t("product.decrease")}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-semibold">{formatNumber(qty, lang)}</span>
              <button
                type="button"
                onClick={() => setQty(qty + 1)}
                className="p-3"
                aria-label={t("product.increase")}
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
              {purchasable
                ? cartItemId
                  ? t("product.updateCartItem")
                  : t("product.addToCart")
                : !product.available
                  ? t("product.unavailable")
                  : selectionComplete
                    ? t("product.optionUnavailable")
                    : t("product.selectOptions")}
            </button>
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              className="grid h-14 w-14 place-items-center rounded-full border border-border"
              aria-label={t("product.wishlist")}
            >
              <Heart
                className={`h-5 w-5 ${wishlist.includes(product.id) ? "fill-primary text-primary" : ""}`}
              />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 text-xs">
            <Feature Icon={Truck} label={t("product.deliveryOman")} />
            <Feature Icon={Shield} label={t("common.lifetime")} />
            <Feature Icon={RotateCcw} label={t("common.returns")} />
          </div>
        </div>
      </div>

      {matchingRings.length > 0 && (
        <section className="mt-20 rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-display text-3xl">
              {product.category === "bangle" ? (
                t("product.pairWithRings")
              ) : (
                <>
                  {t("product.ringsIn")}{" "}
                  {lang === "ar"
                    ? product.variants.find((variant) => variant.color === selectedColor)
                        ?.color_ar || selectedColor
                    : selectedColor}
                </>
              )}
            </h2>
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

      {imageOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lang === "ar" ? "صورة المنتج المكبرة" : "Enlarged product image"}
          className="fixed inset-0 z-[100] bg-black/95 lg:hidden"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeImageViewer();
          }}
        >
          <button
            type="button"
            onClick={closeImageViewer}
            className="absolute right-4 top-4 z-[110] grid h-11 w-11 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
            aria-label={lang === "ar" ? "إغلاق الصورة" : "Close image"}
          >
            <X className="h-6 w-6" />
          </button>
          <div
            ref={imageViewerRef}
            className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden p-3 sm:p-6"
            style={{ touchAction: "none" }}
            onTouchStart={handleViewerTouchStart}
            onTouchMove={handleViewerTouchMove}
            onTouchEnd={handleViewerTouchEnd}
            onTouchCancel={() => {
              imageGestureRef.current = null;
            }}
          >
            <img
              ref={viewerImageRef}
              src={activeImage}
              alt={productName}
              draggable={false}
              className="max-h-full max-w-full select-none object-contain will-change-transform"
              style={{
                transform: `translate3d(${viewerPan.x}px, ${viewerPan.y}px, 0) scale(${viewerScale})`,
                transformOrigin: "center center",
              }}
              onClick={(event) => event.stopPropagation()}
              onDoubleClick={toggleViewerZoom}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function OptionGroup({
  label,
  options,
  selected,
  onSelect,
  language,
  arabicLabel,
}: {
  label: string;
  options: string[];
  selected?: string;
  onSelect: (value: string | undefined) => void;
  language: "en" | "ar";
  arabicLabel: (value: string) => string;
}) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(selected === option ? undefined : option)}
            aria-pressed={selected === option}
            className={`rounded-full border px-4 py-2 text-sm ${selected === option ? "border-primary bg-primary/5 text-primary" : "border-border"}`}
          >
            {language === "ar" ? arabicLabel(option) : option}
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
