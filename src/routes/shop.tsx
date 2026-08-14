import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/lib/products";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop · Lastella Luxury Jewelry" },
      { name: "description", content: "Explore Lastella's full collection of necklaces, rings, earrings, bracelets and watches." },
      { property: "og:title", content: "Shop the Lastella Collection" },
      { property: "og:description", content: "Luxury jewelry at prices meant for everyday indulgence." },
    ],
  }),
  component: Shop,
});

const cats = ["all", "necklace", "bracelet", "ring", "earrings", "pendant", "watch"] as const;
const sorts = ["newest", "price-asc", "price-desc", "rating"] as const;

function Shop() {
  const { t, lang } = useI18n();
  const [cat, setCat] = useState<(typeof cats)[number]>("all");
  const [sort, setSort] = useState<(typeof sorts)[number]>("newest");
  const [max, setMax] = useState(5000);
  
  const { data: rawProducts, isLoading } = useProducts();
  const products = Array.isArray(rawProducts) ? rawProducts : [];

  const filtered = useMemo(() => {
    let list = products.filter((p) => p && (cat === "all" || p.category === cat) && (p.price || 0) <= max);
    if (sort === "price-asc") list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === "price-desc") list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sort === "rating") list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return list;
  }, [products, cat, sort, max]);

  const catLabel = (c: string) => c === "all" ? (lang === "ar" ? "الكل" : "All") : t(`cat.${c === "necklace" ? "necklace" : c}` as never);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-[0.35em] text-primary font-medium mb-3">Lastella</p>
        <h1 className="font-display text-5xl sm:text-6xl">{lang === "ar" ? "المتجر" : "The Collection"}</h1>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-10">
        <aside className="space-y-8">
          <div>
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] mb-4">
              <SlidersHorizontal className="h-3.5 w-3.5" /> {lang === "ar" ? "الفئة" : "Category"}
            </h3>
            <div className="flex flex-col gap-1.5">
              {cats.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`text-start text-sm py-2 px-3 rounded-lg transition-all ${cat === c ? "bg-primary/10 text-primary font-medium" : "hover:bg-secondary text-foreground/80"}`}
                >
                  {catLabel(c)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] mb-4">{lang === "ar" ? "السعر" : "Price"}</h3>
            <input type="range" min={50} max={5000} step={50} value={max} onChange={(e) => setMax(Number(e.target.value))} className="w-full accent-primary" />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>SAR 50</span><span>SAR {max.toLocaleString()}</span>
            </div>
          </div>
        </aside>

        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">{filtered.length} {lang === "ar" ? "قطعة" : "pieces"}</p>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="text-sm rounded-full border border-border bg-transparent px-4 py-2 focus:outline-none focus:border-primary">
              <option value="newest">{lang === "ar" ? "الأحدث" : "Newest"}</option>
              <option value="price-asc">{lang === "ar" ? "السعر: الأقل" : "Price: Low to High"}</option>
              <option value="price-desc">{lang === "ar" ? "السعر: الأعلى" : "Price: High to Low"}</option>
              <option value="rating">{lang === "ar" ? "الأعلى تقييمًا" : "Highest Rated"}</option>
            </select>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="animate-pulse flex flex-col gap-3">
                  <div className="bg-secondary/50 aspect-[4/5] rounded-2xl w-full"></div>
                  <div className="bg-secondary/50 h-4 w-3/4 rounded-full"></div>
                  <div className="bg-secondary/50 h-4 w-1/4 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
          
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              {lang === "ar" ? "لم يتم العثور على منتجات." : "No products found."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
