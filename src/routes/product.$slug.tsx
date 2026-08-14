import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { Heart, Minus, Plus, ShoppingBag, Shield, Truck, RotateCcw, Star, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useProducts, FALLBACK_PRODUCTS } from "@/lib/products";
import { useI18n } from "@/lib/i18n";
import { useStore, type Product } from "@/lib/store";
import { formatPrice } from "@/lib/currency";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    let product: (Product & { description?: string; images?: string[]; sizes?: string[]; colors?: string[] }) | null = null;

    try {
      const res = await fetch(`/api/products?slug=${encodeURIComponent(params.slug)}`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        const raw = Array.isArray(data) ? data[0] : data;
        if (raw) {
          product = {
            id: raw.id || raw._id,
            slug: raw.slug,
            name: { en: raw.name_en, ar: raw.name_ar ?? "" },
            category: raw.category,
            price: Number(raw.price),
            oldPrice: raw.old_price ? Number(raw.old_price) : undefined,
            image: raw.image,
            rating: Number(raw.rating || 0),
            reviews: Number(raw.reviews || 0),
            badge: raw.badge || undefined,
            stock: Number(raw.stock || 0),
            description: raw.description_en || undefined,
            images: raw.images?.length ? raw.images : [raw.image],
            sizes: raw.sizes || [],
            colors: raw.colors || []
          };
        }
      }
    } catch {}

    if (!product) {
      const fb = FALLBACK_PRODUCTS.find((p) => p.slug === params.slug);
      if (fb) {
        product = {
          ...fb,
          description: fb.description,
          images: fb.images?.length ? fb.images : [fb.image],
        };
      }
    }

    if (!product) throw notFound();

    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.product.name.en ?? "Product"} · Lastella` },
      { name: "description", content: `Discover the ${loaderData?.product.name.en} — a Lastella luxury piece.` },
      { property: "og:title", content: `${loaderData?.product.name.en} · Lastella` },
      { property: "og:description", content: "Big brand elegance. Small brand prices." },
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
  const [qty, setQty] = useState(1);
  const wished = wishlist.includes(product.id);
  
  const { data: allProducts = [] } = useProducts();
  const related = allProducts.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  const [selectedColor, setSelectedColor] = useState<string | undefined>(product.colors?.[0]);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(product.sizes?.[0]);
  const [activeImage, setActiveImage] = useState<string>(product.image);

  // Matching Ring Bundle State for Necklaces & Bracelets (Bangles)
  const isJewelrySet = product.category === "necklace" || product.category === "bracelet";
  const matchingRing = allProducts.find((p) => p.category === "ring") || FALLBACK_PRODUCTS.find((p) => p.category === "ring");
  const [includeMatchingRing, setIncludeMatchingRing] = useState(true);
  const [matchingRingSize, setMatchingRingSize] = useState<string>("US 7");

  const gallery = [product.image, ...(product.images || [])].filter(Boolean);

  const handleAddToCart = () => {
    addToCart(product, qty, selectedSize, selectedColor);
    if (isJewelrySet && includeMatchingRing && matchingRing) {
      addToCart(matchingRing, 1, matchingRingSize, selectedColor);
      toast.success(
        lang === "ar"
          ? `تمت إضافة ${product.name[lang] || product.name.en} والخاتم المطابق (مقاس: ${matchingRingSize}) للسلة!`
          : `Added ${product.name.en} and Matching Ring (Size: ${matchingRingSize}) to cart!`
      );
    } else {
      toast.success(`${product.name[lang] || product.name.en} added to cart`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <nav className="text-xs text-muted-foreground mb-8">
        <Link to="/" className="hover:text-primary">{t("nav.home")}</Link> / <Link to="/shop" className="hover:text-primary">{t("nav.shop")}</Link> / <span className="text-foreground">{product.name[lang]}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-3xl bg-secondary">
            <img src={activeImage} alt={product.name[lang]} className="h-full w-full object-cover transition-opacity duration-300" />
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-5 gap-3">
              {gallery.map((img, i) => (
                <div key={i} onClick={() => setActiveImage(img)} className={`aspect-square overflow-hidden rounded-xl bg-secondary ring-2 cursor-pointer transition-all ${activeImage === img ? 'ring-primary' : 'ring-transparent hover:ring-primary/50'}`}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-primary font-medium mb-3">{t(`cat.${product.category}` as never)}</p>
          <h1 className="font-display text-4xl sm:text-5xl leading-tight">{product.name[lang]}</h1>
          <div className="flex items-center gap-2 mt-4 text-sm">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.round(product.rating) ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
              ))}
            </div>
            <span className="text-muted-foreground">{product.rating} · {product.reviews} reviews</span>
          </div>

          <div className="mt-6 flex items-baseline gap-3 flex-wrap">
            <span className="font-display text-4xl">{formatPrice(product.price)}</span>
            {product.oldPrice && <span className="text-lg text-muted-foreground line-through">{formatPrice(product.oldPrice)}</span>}
          </div>

          <p className="mt-6 text-foreground/75 leading-relaxed">
            {product.description || "Handcrafted with 18k rose-gold plating and ethically-sourced stones. Each piece is finished with a signature Lastella hallmark and packaged in our velvet keepsake case."}
          </p>

          <div className="mt-8 space-y-4">
            {product.colors && product.colors.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-3">Color</p>
                <div className="flex gap-2 flex-wrap">
                  {product.colors.map((c) => (
                    <button key={c} onClick={() => setSelectedColor(c)} className={`rounded-full px-4 py-2 text-sm border transition-all ${selectedColor === c ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary"}`}>{c}</button>
                  ))}
                </div>
              </div>
            )}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-3">{product.category === "bracelet" ? (lang === "ar" ? "مقاس السوار:" : "Bangle Size:") : (lang === "ar" ? "مقاس القلادة:" : "Necklace Size:")}</p>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((s) => (
                    <button key={s} onClick={() => setSelectedSize(s)} className={`h-11 min-w-11 px-3 rounded-full text-sm border transition-all ${selectedSize === s ? "border-primary bg-primary/5 text-primary font-semibold" : "border-border hover:border-primary"}`}>{s}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Matching Ring Bundle Section for Necklaces and Bangles */}
          {isJewelrySet && matchingRing && (
            <div className="mt-8 p-5 rounded-3xl border border-primary/30 bg-primary/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-5 w-5 text-primary shrink-0 animate-pulse" />
                  <div>
                    <h4 className="font-semibold text-sm">
                      {lang === "ar" ? "طقم الخاتم المطابق الفاخر 💍" : "Matching Ring Set Option 💍"}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {lang === "ar" ? "أضيفي خاتماً مطابقاً بتصميم مميز واختاري مقاس الخاتم المستقل" : "Add a matching ring & select an independent ring size"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-background border border-border">
                <div className="flex items-center gap-3">
                  <img src={matchingRing.image} alt="" className="h-14 w-14 rounded-xl object-cover bg-secondary shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{matchingRing.name[lang] || matchingRing.name.en}</p>
                    <p className="text-xs text-primary font-semibold">{formatPrice(matchingRing.price)}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                    {lang === "ar" ? "مقاس الخاتم (مستقل):" : "Ring Size (Independent):"}
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {(matchingRing.sizes?.length ? matchingRing.sizes : ["US 6", "US 7", "US 8"]).map((rs) => (
                      <button
                        key={rs}
                        type="button"
                        onClick={() => setMatchingRingSize(rs)}
                        className={`px-3 py-1 text-xs rounded-lg border transition-all ${matchingRingSize === rs ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border hover:border-primary"}`}
                      >
                        {rs}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-3 text-xs font-semibold cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={includeMatchingRing}
                  onChange={(e) => setIncludeMatchingRing(e.target.checked)}
                  className="h-4 w-4 rounded accent-primary cursor-pointer"
                />
                <span>
                  {lang === "ar"
                    ? `أضيفي الخاتم المطابق بالطقم (+ ${formatPrice(matchingRing.price)})`
                    : `Include Matching Ring Bundle (+ ${formatPrice(matchingRing.price)})`}
                </span>
              </label>
            </div>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-border">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-3 hover:text-primary" aria-label="Decrease"><Minus className="h-4 w-4" /></button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="p-3 hover:text-primary" aria-label="Increase"><Plus className="h-4 w-4" /></button>
            </div>
            <button
              onClick={handleAddToCart}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] luxury-shadow hover:bg-rose-deep transition-all"
            >
              <ShoppingBag className="h-4 w-4" /> {t("product.addToCart")}
            </button>
            <button
              onClick={() => toggleWishlist(product.id)}
              className="grid place-items-center h-14 w-14 rounded-full border border-border hover:border-primary hover:text-primary transition-all"
              aria-label="Wishlist"
            >
              <Heart className={`h-5 w-5 ${wished ? "fill-primary text-primary" : ""}`} />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 text-xs">
            {[
              { Icon: Truck, label: t("common.free_shipping") },
              { Icon: Shield, label: t("common.lifetime") },
              { Icon: RotateCcw, label: t("common.returns") },
            ].map(({ Icon, label }, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-2 p-4 rounded-2xl bg-secondary/50">
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="font-display text-3xl mb-8">{lang === "ar" ? "قد يعجبك أيضًا" : "You may also love"}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
