import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Heart, Award } from "lucide-react";
import hero from "@/assets/hero-3.jpg";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About · Lastella Luxury Jewelry" },
      { name: "description", content: "The Lastella story — big-brand elegance at prices meant for everyday indulgence." },
      { property: "og:title", content: "The Lastella Story" },
      { property: "og:description", content: "Handcrafted luxury jewelry the world can afford." },
    ],
  }),
  component: About,
});

function About() {
  const { lang } = useI18n();
  return (
    <div>
      <section className="relative h-[60vh] min-h-[420px] overflow-hidden">
        <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 to-background/20" />
        <div className="relative mx-auto max-w-7xl px-4 h-full flex items-center">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.35em] text-primary font-medium mb-4">Lastella</p>
            <h1 className="font-display text-5xl sm:text-6xl leading-tight">{lang === "ar" ? "قصة لاستيلا" : "The Lastella story"}</h1>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 py-20 space-y-8 text-lg leading-relaxed text-foreground/80">
        <p>{lang === "ar" ? "وُلدت لاستيلا من فكرة بسيطة: الفخامة لا يجب أن تكون بعيدة المنال. كل قطعة تُصنع يدويًا بعناية فائقة، تجمع بين تصميم راقٍ وسعر يليق بالحياة اليومية." : "Lastella was born from a simple idea: luxury shouldn't be out of reach. Every piece is handcrafted with meticulous care — heritage-house design at a price meant for the everyday."}</p>
        <p>{lang === "ar" ? "نختار خاماتنا بعناية، ونعمل مع حرفيين مهرة، ونشحن مباشرة من الورشة إليك. النتيجة: مجوهرات فاخرة بأسعار عادلة." : "We select our materials carefully, work with master artisans, and ship direct from our atelier to you. The result: luxury jewelry at fair prices."}</p>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-24 grid md:grid-cols-3 gap-6">
        {[
          { Icon: Sparkles, title: lang === "ar" ? "الحرفية" : "Craft", text: lang === "ar" ? "صناعة يدوية دقيقة." : "Meticulous handcraft." },
          { Icon: Heart, title: lang === "ar" ? "الشغف" : "Passion", text: lang === "ar" ? "لكل قطعة قصة." : "Every piece tells a story." },
          { Icon: Award, title: lang === "ar" ? "الجودة" : "Quality", text: lang === "ar" ? "ضمان مدى الحياة." : "Lifetime guarantee." },
        ].map(({ Icon, title, text }, i) => (
          <div key={i} className="glass rounded-3xl p-8 text-center">
            <Icon className="mx-auto h-8 w-8 text-primary mb-4" />
            <h3 className="font-display text-2xl mb-2">{title}</h3>
            <p className="text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
