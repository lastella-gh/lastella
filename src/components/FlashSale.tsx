import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import hero from "@/assets/hero-2.jpg";

export function FlashSale() {
  const { t } = useI18n();
  const [time, setTime] = useState({ h: 47, m: 59, s: 59 });
  useEffect(() => {
    const id = setInterval(() => {
      setTime((t) => {
        let { h, m, s } = t;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 47; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="relative overflow-hidden rounded-3xl luxury-shadow">
        <img src={hero} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/60 to-transparent" />
        <div className="relative px-8 sm:px-16 py-16 sm:py-24 max-w-2xl">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-primary font-medium mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            {t("section.flash.eyebrow")}
          </p>
          <h2 className="font-display text-4xl sm:text-6xl leading-[1.05]">{t("section.flash.title")}</h2>
          <div className="mt-8 flex items-center gap-3">
            {[time.h, time.m, time.s].map((n, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="glass rounded-2xl px-4 py-3 min-w-[68px] text-center">
                  <span className="font-display text-3xl sm:text-4xl tabular-nums">{pad(n)}</span>
                </div>
                <span className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {["Hours", "Mins", "Secs"][i]}
                </span>
              </div>
            ))}
          </div>
          <Link
            to="/shop"
            className="mt-10 inline-flex rounded-full bg-primary text-primary-foreground px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-rose-deep transition-all"
          >
            {t("section.flash.cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
