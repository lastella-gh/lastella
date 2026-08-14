import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import cn from "@/assets/cat-necklace.jpg";
import cb from "@/assets/cat-bracelet.jpg";
import cr from "@/assets/cat-ring.jpg";
import ce from "@/assets/cat-earrings.jpg";
import cp from "@/assets/cat-pendant.jpg";
import cw from "@/assets/cat-watch.jpg";
import cg from "@/assets/cat-giftset.jpg";

export function Categories() {
  const { t } = useI18n();
  const cats = [
    { key: "cat.necklace", img: cn },
    { key: "cat.bracelet", img: cb },
    { key: "cat.ring", img: cr },
    { key: "cat.earrings", img: ce },
    { key: "cat.pendant", img: cp },
    { key: "cat.watch", img: cw },
    { key: "cat.giftset", img: cg },
  ] as const;
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-12">
        <p className="text-xs uppercase tracking-[0.35em] text-primary font-medium mb-3">{t("section.categories.eyebrow")}</p>
        <h2 className="font-display text-4xl sm:text-5xl">{t("section.categories.title")}</h2>
      </div>
      <div className="flex gap-4 sm:gap-6 lg:gap-8 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 lg:justify-center lg:flex-wrap lg:overflow-visible">
        {cats.map((c) => (
          <Link key={c.key} to="/shop" className="group snap-center shrink-0 flex flex-col items-center text-center">
            <div className="relative overflow-hidden rounded-full h-32 w-32 sm:h-40 sm:w-40 lg:h-44 lg:w-44 bg-secondary ring-1 ring-border transition-all group-hover:ring-primary group-hover:ring-4 group-hover:ring-offset-4 group-hover:ring-offset-background">
              <img src={c.img} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent" />
            </div>
            <p className="mt-4 font-display text-lg group-hover:text-primary transition-colors">{t(c.key as never)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
