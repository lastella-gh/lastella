import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import h1 from "@/assets/hero-1.jpg";
import h2 from "@/assets/hero-2.jpg";
import h3 from "@/assets/hero-3.jpg";

export function Hero() {
  const { t, dir } = useI18n();
  const slides = [
    { img: h1, title: t("hero.title"), subtitle: t("hero.subtitle") },
    { img: h2, title: t("hero.slide2.title"), subtitle: t("hero.slide2.subtitle") },
    { img: h3, title: t("hero.slide3.title"), subtitle: t("hero.slide3.subtitle") },
  ];
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, [slides.length]);

  const go = (d: number) => setI((x) => (x + d + slides.length) % slides.length);

  return (
    <section className="relative h-[92vh] min-h-[620px] w-full overflow-hidden">
      {slides.map((s, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out ${idx === i ? "opacity-100" : "opacity-0"}`}
          aria-hidden={idx !== i}
        >
          <img src={s.img} alt="" className="h-full w-full object-cover" fetchPriority={idx === 0 ? "high" : "auto"} />
          <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/30 to-transparent" />
        </div>
      ))}

      <div className="relative mx-auto max-w-7xl h-full px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="max-w-xl">
          <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-primary font-medium mb-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
            {t("hero.eyebrow")}
          </p>
          <h1
            key={i}
            className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] text-foreground whitespace-pre-line animate-in fade-in slide-in-from-bottom-3 duration-1000"
          >
            {slides[i].title}
          </h1>
          <p className="mt-6 text-base sm:text-lg text-foreground/75 leading-relaxed max-w-md">
            {slides[i].subtitle}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              to="/shop"
              className="group inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] luxury-shadow hover:bg-rose-deep transition-all"
            >
              {t("hero.cta.shop")}
              <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${dir === "rtl" ? "rotate-180 group-hover:-translate-x-1 group-hover:translate-x-0" : ""}`} />
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center rounded-full glass px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-primary hover:text-primary-foreground transition-all"
            >
              {t("hero.cta.explore")}
            </Link>
          </div>
        </div>
      </div>

      {/* Nav arrows */}
      <div className="absolute inset-x-0 bottom-8 flex items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              className={`h-1 rounded-full transition-all ${idx === i ? "w-10 bg-primary" : "w-6 bg-foreground/30"}`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => go(-1)} className="grid place-items-center h-11 w-11 rounded-full glass hover:bg-primary hover:text-primary-foreground transition-all" aria-label="Previous">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={() => go(1)} className="grid place-items-center h-11 w-11 rounded-full glass hover:bg-primary hover:text-primary-foreground transition-all" aria-label="Next">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
