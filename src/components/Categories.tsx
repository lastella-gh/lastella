import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import cn from "@/assets/cat-necklace.jpg";
import cb from "@/assets/cat-bracelet.jpg";
import cr from "@/assets/cat-ring.jpg";
import ce from "@/assets/cat-earrings.jpg";

export function Categories() {
  const { t } = useI18n();
  const cats = [
    { key: "cat.necklace", category: "necklace", img: cn },
    { key: "cat.bracelet", category: "bracelet", img: cb },
    { key: "cat.bangle", category: "bangle", img: cb },
    { key: "cat.handcuff", category: "handcuff", img: cb },
    { key: "cat.anklet", category: "anklet", img: cb },
    { key: "cat.ring", category: "ring", img: cr },
    { key: "cat.earrings", category: "earrings", img: ce },
  ] as const;
  return (
    <section
      aria-labelledby="categories-heading"
      className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
    >
      <div className="mb-9 text-center sm:mb-12">
        <p className="text-xs uppercase tracking-[0.35em] text-primary font-medium mb-3">
          {t("section.categories.eyebrow")}
        </p>
        <h2 id="categories-heading" className="font-display text-4xl sm:text-5xl">
          {t("section.categories.title")}
        </h2>
      </div>
      <ul className="flex flex-wrap items-start justify-center gap-x-4 gap-y-7 sm:gap-x-6 sm:gap-y-9 lg:flex-nowrap">
        {cats.map((c) => (
          <li
            key={c.key}
            className="w-[calc((100%_-_3rem)/4)] min-w-0 sm:w-[calc((100%_-_4.5rem)/4)] lg:w-auto lg:flex-1"
          >
            <Link
              to="/shop"
              search={{ category: c.category }}
              className="group flex min-w-0 flex-col items-center rounded-xl text-center focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-primary"
            >
              <div className="relative aspect-square w-full max-w-40 overflow-hidden rounded-full border border-primary/10 bg-secondary/30 transition-[transform,box-shadow,border-color] duration-300 group-hover:-translate-y-1 group-hover:border-primary/30 group-hover:shadow-soft motion-reduce:transform-none">
                <img
                  src={c.img}
                  alt=""
                  width={640}
                  height={640}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
                />
              </div>
              <span className="mt-3 max-w-full break-words font-display text-sm leading-snug transition-colors group-hover:text-primary sm:mt-4 sm:text-lg">
                {t(c.key)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
