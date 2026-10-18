import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Twitter, Youtube, Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/currency";
import { Logo } from "./Logo";
import { BusinessContactDetails } from "./BusinessContactDetails";

export function Footer() {
  const { t, lang } = useI18n();
  return (
    <footer className="mt-24 border-t border-border bg-gradient-to-b from-background to-primary/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid min-w-0 grid-cols-2 gap-x-8 gap-y-10 py-12 sm:gap-x-12 lg:grid-cols-[1.2fr_0.7fr_0.7fr_1.2fr] lg:py-16">
          <div className="col-span-2 min-w-0 lg:col-span-1">
            <Logo className="mb-4 h-14" />
            <p className="max-w-sm break-words text-sm leading-relaxed text-muted-foreground">
              {t("footer.aboutText")}
            </p>
            <div className="mt-6 flex gap-3">
              {[Instagram, Facebook, Twitter, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-full border border-border transition-all hover:border-primary hover:text-primary"
                  aria-label="Social"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <h2 className="mb-4 break-words text-sm font-semibold uppercase tracking-[0.2em]">
              {t("footer.shop")}
            </h2>
            <ul className="min-w-0 space-y-2.5 text-sm text-muted-foreground [overflow-wrap:anywhere]">
              <li>
                <Link to="/shop" search={{ category: "necklace" }} className="hover:text-primary">
                  {t("cat.necklace")}
                </Link>
              </li>
              <li>
                <Link to="/shop" search={{ category: "ring" }} className="hover:text-primary">
                  {t("cat.ring")}
                </Link>
              </li>
              <li>
                <Link to="/shop" search={{ category: "earrings" }} className="hover:text-primary">
                  {t("cat.earrings")}
                </Link>
              </li>
              <li>
                <Link to="/shop" search={{ category: "bracelet" }} className="hover:text-primary">
                  {t("cat.bracelet")}
                </Link>
              </li>
              <li>
                <Link to="/shop" search={{ category: "bangle" }} className="hover:text-primary">
                  {t("cat.bangle")}
                </Link>
              </li>
              <li>
                <Link to="/shop" search={{ category: "handcuff" }} className="hover:text-primary">
                  {t("cat.handcuff")}
                </Link>
              </li>
              <li>
                <Link to="/shop" search={{ category: "anklet" }} className="hover:text-primary">
                  {t("cat.anklet")}
                </Link>
              </li>
              <li>
                <Link to="/shop" search={{ category: "watch" }} className="hover:text-primary">
                  {t("cat.watch")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="min-w-0">
            <h2 className="mb-4 break-words text-sm font-semibold uppercase tracking-[0.2em]">
              {t("footer.help")}
            </h2>
            <ul className="min-w-0 space-y-2.5 text-sm text-muted-foreground [overflow-wrap:anywhere]">
              <li>
                <Link to="/contact" className="hover:text-primary">
                  {t("footer.contact")}
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  {t("footer.shipping")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  {t("footer.returns")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  {t("footer.faq")}
                </a>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary">
                  {t("footer.about")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-2 min-w-0 lg:col-span-1">
            <h2 className="mb-4 break-words text-sm font-semibold uppercase tracking-[0.2em]">
              {t("footer.contact")}
            </h2>
            <BusinessContactDetails compact className="sm:grid-cols-3 lg:grid-cols-1" />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5 border-t border-border/60 py-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <div className="min-w-0 lg:max-w-lg">
            <h2 className="mb-2 break-words font-display text-2xl">
              {t("section.newsletter.title")}
            </h2>
            <p className="break-words text-sm leading-relaxed text-muted-foreground">
              {t("section.newsletter.subtitle")}
            </p>
          </div>
          <form
            className="glass flex w-full min-w-0 overflow-hidden rounded-full p-1 sm:max-w-md lg:max-w-sm"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="flex shrink-0 items-center px-3 text-muted-foreground">
              <Mail className="h-4 w-4" />
            </div>
            <input
              type="email"
              aria-label={t("newsletter.placeholder")}
              placeholder={t("newsletter.placeholder")}
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground/70"
            />
            <button className="shrink-0 rounded-full bg-primary px-4 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-rose-deep">
              {t("newsletter.cta")}
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-center text-xs text-muted-foreground sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <p className="min-w-0 break-words">
            © {formatNumber(new Date().getFullYear(), lang)} Lastella. {t("footer.rights")}
          </p>
          <p className="min-w-0 break-words text-center uppercase tracking-[0.3em]">
            {t("brand.tagline")}
          </p>
        </div>
      </div>
    </footer>
  );
}
