import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Twitter, Youtube, Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Logo } from "./Logo";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-24 border-t border-border bg-gradient-to-b from-background to-primary/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo className="h-14 mb-4" />
          <p className="text-sm text-muted-foreground leading-relaxed">{t("footer.aboutText")}</p>
          <div className="flex gap-3 mt-6">
            {[Instagram, Facebook, Twitter, Youtube].map((Icon, i) => (
              <a key={i} href="#" className="grid place-items-center h-9 w-9 rounded-full border border-border hover:border-primary hover:text-primary transition-all" aria-label="Social">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] mb-4">{t("footer.shop")}</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/shop" className="hover:text-primary">{t("cat.necklace")}</Link></li>
            <li><Link to="/shop" className="hover:text-primary">{t("cat.ring")}</Link></li>
            <li><Link to="/shop" className="hover:text-primary">{t("cat.earrings")}</Link></li>
            <li><Link to="/shop" className="hover:text-primary">{t("cat.bracelet")}</Link></li>
            <li><Link to="/shop" className="hover:text-primary">{t("cat.watch")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] mb-4">{t("footer.help")}</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/contact" className="hover:text-primary">{t("footer.contact")}</Link></li>
            <li><a href="#" className="hover:text-primary">{t("footer.shipping")}</a></li>
            <li><a href="#" className="hover:text-primary">{t("footer.returns")}</a></li>
            <li><a href="#" className="hover:text-primary">{t("footer.faq")}</a></li>
            <li><Link to="/about" className="hover:text-primary">{t("footer.about")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] mb-4">{t("section.newsletter.title")}</h4>
          <p className="text-sm text-muted-foreground mb-4">{t("section.newsletter.subtitle")}</p>
          <form className="flex glass rounded-full overflow-hidden p-1" onSubmit={(e) => e.preventDefault()}>
            <div className="flex items-center px-3 text-muted-foreground"><Mail className="h-4 w-4" /></div>
            <input type="email" placeholder={t("newsletter.placeholder")} className="flex-1 bg-transparent text-sm px-2 py-2 outline-none placeholder:text-muted-foreground/70" />
            <button className="rounded-full bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider px-4 hover:bg-rose-deep transition-colors">
              {t("newsletter.cta")}
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Lastella. {t("footer.rights")}</p>
          <p className="tracking-[0.3em] uppercase">{t("brand.tagline")}</p>
        </div>
      </div>
    </footer>
  );
}
