import { Link } from "@tanstack/react-router";
import { Heart, Search, ShoppingBag, User, Menu, X, Globe, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/currency";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Logo } from "./Logo";

export function Header() {
  const { t, lang, setLang } = useI18n();
  const { cartCount, wishlist } = useStore();
  const { isAdmin } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav = [
    { label: t("nav.newArrivals"), search: { collection: "new-arrivals" as const } },
    { label: t("nav.necklaces"), search: { category: "necklace" as const } },
    { label: t("nav.bracelets"), search: { category: "bracelet" as const } },
    { label: t("nav.bangles"), search: { category: "bangle" as const } },
    { label: t("nav.handcuffs"), search: { category: "handcuff" as const } },
    { label: t("nav.anklets"), search: { category: "anklet" as const } },
    { label: t("nav.rings"), search: { category: "ring" as const } },
    { label: t("nav.brandBoxes"), search: { collection: "brand-boxes" as const } },
    { label: t("nav.bestSelling"), search: { collection: "best-sellers" as const } },
  ];

  return (
    <header
      className={`sticky inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass shadow-[0_2px_20px_-8px_rgba(200,100,140,0.15)]"
          : "bg-background/40 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-8">
            <button
              className="shrink-0 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link to="/" className="flex min-w-0 items-center">
              <Logo className="h-10 max-w-full w-auto md:h-14" />
            </Link>
          </div>

          <nav className="no-scrollbar hidden items-center gap-3 overflow-x-auto lg:flex xl:gap-5">
            {nav.map((n) => (
              <Link
                key={n.label}
                to="/shop"
                search={n.search}
                className="group relative whitespace-nowrap text-xs font-medium tracking-wide text-foreground/80 transition-colors hover:text-primary xl:text-sm"
              >
                {n.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-primary transition-all group-hover:w-full" />
              </Link>
            ))}
          </nav>

          <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-all hover:border-primary/30 hover:bg-primary/5"
              aria-label="Toggle language"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{lang === "en" ? "AR" : "EN"}</span>
            </button>
            <button
              className="hidden p-2 transition-colors hover:text-primary sm:inline-flex"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden p-2 transition-colors hover:text-primary sm:inline-flex"
                aria-label="Admin"
              >
                <ShieldCheck className="h-5 w-5" />
              </Link>
            )}
            <Link
              to="/account"
              className="p-2 transition-colors hover:text-primary"
              aria-label="Account"
            >
              <User className="h-5 w-5" />
            </Link>
            <Link
              to="/wishlist"
              className="relative p-2 transition-colors hover:text-primary"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
              {wishlist.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                  {formatNumber(wishlist.length, lang)}
                </span>
              )}
            </Link>
            <Link
              to="/cart"
              className="relative p-2 transition-colors hover:text-primary"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                  {formatNumber(cartCount, lang)}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open &&
        createPortal(
          <div className="isolate fixed inset-0 z-[100] lg:hidden">
            <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
            <div className="absolute inset-y-0 start-0 z-10 w-72 bg-white p-6 shadow-2xl">
              <div className="mb-8 flex items-center justify-between">
                <Logo className="h-10" />
                <button onClick={() => setOpen(false)} aria-label="Close menu">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex flex-col gap-1">
                <Link
                  to="/"
                  onClick={() => setOpen(false)}
                  className="border-b border-border/60 px-2 py-3 text-base font-medium hover:text-primary"
                >
                  {t("nav.home")}
                </Link>
                {nav.map((n) => (
                  <Link
                    key={n.label}
                    to="/shop"
                    search={n.search}
                    onClick={() => setOpen(false)}
                    className="border-b border-border/60 px-2 py-3 text-base font-medium hover:text-primary"
                  >
                    {n.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
