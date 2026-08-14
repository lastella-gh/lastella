import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin, MessageCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact · Lastella" },
      { name: "description", content: "Reach the Lastella client care team." },
      { property: "og:title", content: "Contact Lastella" },
      { property: "og:description", content: "We're here to help — jewelry advice, orders, and after-sales support." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { lang } = useI18n();
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-14">
        <p className="text-xs uppercase tracking-[0.35em] text-primary font-medium mb-3">Client Care</p>
        <h1 className="font-display text-5xl sm:text-6xl">{lang === "ar" ? "تواصلي معنا" : "Get in touch"}</h1>
      </div>
      <div className="grid lg:grid-cols-2 gap-12">
        <form onSubmit={(e) => { e.preventDefault(); toast.success(lang === "ar" ? "شكرًا لتواصلك، سنرد قريبًا." : "Thanks — we'll be in touch shortly."); }} className="glass rounded-3xl p-8 space-y-4">
          <input className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary" placeholder={lang === "ar" ? "اسمك" : "Your name"} required />
          <input type="email" className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary" placeholder={lang === "ar" ? "البريد الإلكتروني" : "Email address"} required />
          <input className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary" placeholder={lang === "ar" ? "الموضوع" : "Subject"} />
          <textarea rows={5} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none" placeholder={lang === "ar" ? "رسالتك" : "Your message"} required />
          <button className="w-full rounded-full bg-primary text-primary-foreground px-6 py-4 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-rose-deep transition-all">
            {lang === "ar" ? "إرسال" : "Send Message"}
          </button>
        </form>

        <div className="space-y-6">
          {[
            { Icon: MapPin, title: lang === "ar" ? "الفرع الرئيسي" : "Flagship Store", text: "The Dubai Mall, Fashion Ave · Level 2" },
            { Icon: Phone, title: lang === "ar" ? "الهاتف" : "Phone", text: "+971 4 000 0000" },
            { Icon: Mail, title: "Email", text: "care@lastella.com" },
            { Icon: MessageCircle, title: "WhatsApp", text: "+971 50 000 0000" },
            { Icon: Clock, title: lang === "ar" ? "ساعات العمل" : "Hours", text: "Mon–Sun · 10:00–22:00" },
          ].map(({ Icon, title, text }, i) => (
            <div key={i} className="flex gap-4 items-start p-6 rounded-3xl border border-border hover:border-primary transition-all">
              <div className="grid place-items-center h-12 w-12 rounded-full bg-primary/10 text-primary shrink-0"><Icon className="h-5 w-5" /></div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">{title}</p>
                <p className="font-display text-lg">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
