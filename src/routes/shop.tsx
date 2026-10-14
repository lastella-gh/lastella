import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { getLocalizedProductName, useAllBoxProducts, useProducts } from "@/lib/products";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/currency";
import { matchesProductSearch, shuffleProducts } from "@/lib/product-listing";
import { z } from "zod";

export const Route = createFileRoute("/shop")({
  validateSearch: z.object({
    category: z
      .enum(["necklace", "bracelet", "bangle", "anklet", "ring", "earrings", "pendant", "watch"])
      .optional(),
    collection: z.enum(["new-arrivals", "best-sellers", "brand-boxes"]).optional(),
  }),
  head: () => ({
    meta: [
      { title: "Shop · Lastella Luxury Jewelry" },
      {
        name: "description",
        content:
          "Explore Lastella's full collection of necklaces, rings, earrings, bracelets and watches.",
      },
      { property: "og:title", content: "Shop the Lastella Collection" },
      {
        property: "og:description",
        content: "Luxury jewelry at prices meant for everyday indulgence.",
      },
    ],
  }),
  component: Shop,
});

const cats = [
  "all",
  "necklace",
  "bracelet",
  "bangle",
  "anklet",
  "ring",
  "earrings",
  "pendant",
  "watch",
] as const;
const collections = ["brand-boxes", "best-sellers"] as const;
const sorts = ["random", "newest", "price-asc", "price-desc", "rating"] as const;

function Shop() {
  const { t, lang } = useI18n();
  const search = Route.useSearch();
  const [brand, setBrand] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<(typeof sorts)[number]>("random");
  const [shuffleSeed, setShuffleSeed] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = Route.useNavigate();
  const cat = search.category ?? "all";
  const activeFilter = search.collection ?? cat;

  useEffect(() => {
    // Keep the initial server and client render identical, then seed this visit's order.
    setShuffleSeed(Math.floor(Math.random() * 4294967296));
  }, []);

  const { data: rawProducts, isLoading } = useProducts();
  const { data: rawBoxProducts, isLoading: isLoadingBoxes } = useAllBoxProducts();
  const sourceProducts = search.collection === "brand-boxes" ? rawBoxProducts : rawProducts;
  const isLoadingSource =
    (search.collection === "brand-boxes" ? isLoadingBoxes : isLoading) || shuffleSeed === null;
  const randomizedProducts = useMemo(
    () => shuffleProducts(sourceProducts ?? [], shuffleSeed ?? 0),
    [sourceProducts, shuffleSeed],
  );
  const brands = useMemo(() => {
    const products = sourceProducts ?? [];
    return [
      ...new Map(
        products
          .filter((product) => cat === "all" || product.category === cat)
          .filter((product) => product.brand?.visible)
          .map((product) => [product.brand!.slug, product.brand!]),
      ).values(),
    ].sort((a, b) => a.name.localeCompare(b.name));
  }, [sourceProducts, cat]);

  const filtered = useMemo(() => {
    const products = sort === "random" ? randomizedProducts : (sourceProducts ?? []);
    let list = products.filter(
      (p) =>
        p &&
        (cat === "all" || p.category === cat) &&
        (search.collection !== "new-arrivals" || p.isNewArrival) &&
        (search.collection !== "best-sellers" || p.isBestSeller) &&
        (search.collection !== "brand-boxes" ||
          p.kind === "ring_box" ||
          p.kind === "general_box") &&
        (brand === "all" || p.brand?.slug === brand) &&
        matchesProductSearch(p, query, getLocalizedProductName(p, "ar")),
    );
    if (sort === "price-asc") list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === "price-desc") list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sort === "rating") list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return list;
  }, [sourceProducts, randomizedProducts, search.collection, cat, brand, sort, query]);

  const catLabel = (c: string) =>
    c === "all" ? (lang === "ar" ? "الكل" : "All") : t(`cat.${c}` as never);
  const collectionLabel = (collection: (typeof collections)[number]) =>
    t(collection === "brand-boxes" ? "nav.brandBoxes" : "nav.bestSelling");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-[0.35em] text-primary font-medium mb-3">
          Lastella
        </p>
        <h1 className="font-display text-5xl sm:text-6xl">
          {lang === "ar" ? "المتجر" : "The Collection"}
        </h1>
      </div>

      <div className="mb-6 flex gap-3 lg:hidden">
        <select
          aria-label={lang === "ar" ? "تصفية المنتجات" : "Filter products"}
          value={activeFilter}
          onChange={(e) => {
            const value = e.target.value;
            void navigate({
              search: (current) => ({
                ...current,
                category:
                  value === "all" || collections.includes(value as (typeof collections)[number])
                    ? undefined
                    : (value as Exclude<(typeof cats)[number], "all">),
                collection: collections.includes(value as (typeof collections)[number])
                  ? (value as (typeof collections)[number])
                  : undefined,
              }),
            });
            setBrand("all");
          }}
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          {cats.map((c) => (
            <option key={c} value={c}>
              {catLabel(c)}
            </option>
          ))}
          {collections.map((collection) => (
            <option key={collection} value={collection}>
              {collectionLabel(collection)}
            </option>
          ))}
        </select>
        <select
          aria-label={lang === "ar" ? "تصفية العلامة التجارية" : "Filter by brand"}
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="all">{lang === "ar" ? "كل العلامات" : "All brands"}</option>
          {brands.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden space-y-8 lg:block">
          <div>
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] mb-4">
              <SlidersHorizontal className="h-3.5 w-3.5" /> {lang === "ar" ? "الفئة" : "Category"}
            </h3>
            <div className="flex flex-col gap-1.5">
              {cats.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    void navigate({
                      search: (current) => ({
                        ...current,
                        category: c === "all" ? undefined : c,
                        collection: undefined,
                      }),
                    });
                    setBrand("all");
                  }}
                  className={`text-start text-sm py-2 px-3 rounded-lg transition-all ${cat === c && !search.collection ? "bg-primary/10 text-primary font-medium" : "hover:bg-secondary text-foreground/80"}`}
                >
                  {catLabel(c)}
                </button>
              ))}
              {collections.map((collection) => (
                <button
                  key={collection}
                  onClick={() => {
                    void navigate({
                      search: (current) => ({
                        ...current,
                        category: undefined,
                        collection,
                      }),
                    });
                    setBrand("all");
                  }}
                  className={`text-start text-sm py-2 px-3 rounded-lg transition-all ${search.collection === collection ? "bg-primary/10 text-primary font-medium" : "hover:bg-secondary text-foreground/80"}`}
                >
                  {collectionLabel(collection)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] mb-4">
              {lang === "ar" ? "العلامة التجارية" : "Brand"}
            </h3>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setBrand("all")}
                className={`text-start text-sm py-2 px-3 rounded-lg ${brand === "all" ? "bg-primary/10 text-primary font-medium" : "hover:bg-secondary"}`}
              >
                {lang === "ar" ? "الكل" : "All"}
              </button>
              {brands.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setBrand(item.slug)}
                  className={`text-start text-sm py-2 px-3 rounded-lg ${brand === item.slug ? "bg-primary/10 text-primary font-medium" : "hover:bg-secondary"}`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div role="search" className="relative mb-5">
            <label htmlFor="shop-search" className="sr-only">
              {lang === "ar" ? "البحث عن المنتجات" : "Search products"}
            </label>
            <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchInputRef}
              id="shop-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                lang === "ar"
                  ? "ابحثي باسم المنتج أو العلامة التجارية..."
                  : "Search by product name or brand..."
              }
              className="min-h-12 w-full min-w-0 rounded-full border border-border bg-background py-3 pe-12 ps-12 text-base outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm [&::-webkit-search-cancel-button]:appearance-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  searchInputRef.current?.focus();
                }}
                aria-label={lang === "ar" ? "مسح البحث" : "Clear search"}
                className="absolute end-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p aria-live="polite" role="status" className="text-sm text-muted-foreground">
              {formatNumber(filtered.length, lang)} {lang === "ar" ? "قطعة" : "pieces"}
            </p>
            <select
              aria-label={lang === "ar" ? "ترتيب المنتجات" : "Sort products"}
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="min-h-11 max-w-full rounded-full border border-border bg-transparent px-4 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="random">{lang === "ar" ? "ترتيب عشوائي" : "Random order"}</option>
              <option value="newest">{lang === "ar" ? "الأحدث" : "Newest"}</option>
              <option value="price-asc">
                {lang === "ar" ? "السعر: الأقل" : "Price: Low to High"}
              </option>
              <option value="price-desc">
                {lang === "ar" ? "السعر: الأعلى" : "Price: High to Low"}
              </option>
              <option value="rating">{lang === "ar" ? "الأعلى تقييمًا" : "Highest Rated"}</option>
            </select>
          </div>

          {isLoadingSource ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse flex flex-col gap-3">
                  <div className="bg-secondary/50 aspect-[4/5] rounded-2xl w-full"></div>
                  <div className="bg-secondary/50 h-4 w-3/4 rounded-full"></div>
                  <div className="bg-secondary/50 h-4 w-1/4 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {!isLoadingSource && filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              {lang === "ar" ? "لم يتم العثور على منتجات." : "No products found."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
