import { Star } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function Testimonials() {
  const { t, lang } = useI18n();
  const items = lang === "ar" ? [
    { name: "ليلى ك.", text: "قطع تفوق سعرها بكثير. تصميم أنيق وتنفيذ راقٍ." },
    { name: "نورة أ.", text: "أهديت زوجتي قلادة سوان، أذهلها الجمال والتغليف." },
    { name: "سارة م.", text: "لاستيلا أصبحت وجهتي المفضلة. جودة وأسلوب فاخر." },
  ] : [
    { name: "Leila K.", text: "The pieces feel far more expensive than they are. Beautifully designed and impeccably finished." },
    { name: "Noura A.", text: "Gifted my wife the Swan necklace — the packaging and craft floored her." },
    { name: "Sarah M.", text: "Lastella is my new go-to. Luxury quality without the luxury markup." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
      <h2 className="font-display text-4xl sm:text-5xl text-center mb-14">{t("section.testimonials.title")}</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {items.map((r, i) => (
          <div key={i} className="glass rounded-3xl p-8 hover:shadow-luxury transition-all duration-500">
            <div className="flex gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="h-4 w-4 fill-primary text-primary" />)}
            </div>
            <p className="font-display text-xl leading-relaxed text-foreground/85">"{r.text}"</p>
            <p className="mt-6 text-sm font-semibold tracking-wider uppercase text-primary">— {r.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
