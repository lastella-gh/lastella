import { Link } from "@tanstack/react-router";
import { Heart, Search, ShoppingBag, User, Menu, X, Globe, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
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
    { to: "/", label: t("nav.home") },
    { to: "/shop", label: t("nav.shop") },
    { to: "/shop", label: t("nav.categories") },
    { to: "/shop", label: t("nav.offers") },
    { to: "/about", label: t("nav.about") },
    { to: "/contact", label: t("nav.contact") },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "glass shadow-[0_2px_20px_-8px_rgba(200,100,140,0.15)]" : "bg-background/40 backdrop-blur-md"
      }`}
    >

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          <div className="flex items-center gap-3 lg:gap-8 min-w-0">
            <button className="lg:hidden shrink-0" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-6 w-6" />
            </button>
            <Link to="/" className="flex items-center shrink-0">
              <Logo className="h-12 md:h-14 w-auto" />
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-8">
            {nav.map((n, i) => (
              <Link
                key={i}
                to={n.to}
                className="text-sm font-medium tracking-wide text-foreground/80 hover:text-primary transition-colors relative group"
              >
                {n.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-primary transition-all group-hover:w-full" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-primary/5 hover:border-primary/30 transition-all"
              aria-label="Toggle language"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{lang === "en" ? "AR" : "EN"}</span>
            </button>
            <button className="hidden sm:inline-flex p-2 hover:text-primary transition-colors" aria-label="Search">
              <Search className="h-5 w-5" />
            </button>
            {isAdmin && (
              <Link to="/admin" className="hidden sm:inline-flex p-2 hover:text-primary transition-colors" aria-label="Admin">
                <ShieldCheck className="h-5 w-5" />
              </Link>
            )}
            <Link to="/account" className="p-2 hover:text-primary transition-colors" aria-label="Account">
              <User className="h-5 w-5" />
            </Link>
            <Link to="/wishlist" className="relative p-2 hover:text-primary transition-colors" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link to="/cart" className="relative p-2 hover:text-primary transition-colors" aria-label="Cart">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 start-0 w-72 bg-background p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <Logo className="h-10" />
              <button onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-6 w-6" /></button>
            </div>
            <nav className="flex flex-col gap-1">
              {nav.map((n, i) => (
                <Link
                  key={i}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="py-3 px-2 text-base font-medium border-b border-border/60 hover:text-primary"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
