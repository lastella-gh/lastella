import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useProducts } from "@/lib/products";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist · Lastella" }, { name: "description", content: "Your Lastella wishlist." }] }),
  component: Wishlist,
});

function Wishlist() {
  const { wishlist } = useStore();
  const { lang } = useI18n();
  const { data: allProducts = [], isLoading } = useProducts();
  const items = allProducts.filter((p) => wishlist.includes(p.id));

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-display text-4xl sm:text-5xl mb-10">{lang === "ar" ? "المفضلة" : "Wishlist"}</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="animate-pulse flex flex-col gap-3">
              <div className="bg-secondary/50 aspect-[4/5] rounded-2xl w-full"></div>
              <div className="bg-secondary/50 h-4 w-3/4 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="mx-auto grid place-items-center h-24 w-24 rounded-full bg-primary/10 text-primary mb-6"><Heart className="h-10 w-10" /></div>
        <h1 className="font-display text-4xl">{lang === "ar" ? "مفضلتك فارغة" : "Your wishlist is empty"}</h1>
        <p className="mt-3 text-muted-foreground">{lang === "ar" ? "احفظي القطع التي تعجبك للرجوع إليها لاحقًا." : "Save pieces you love for later."}</p>
        <Link to="/shop" className="mt-8 inline-flex rounded-full bg-primary text-primary-foreground px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-rose-deep transition-all">
          {lang === "ar" ? "اكتشفي المجموعة" : "Discover Collection"}
        </Link>
      </div>
    );
  }
  
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-4xl sm:text-5xl mb-10">{lang === "ar" ? "المفضلة" : "Wishlist"}</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
