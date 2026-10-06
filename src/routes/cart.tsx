import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { isCartItemPurchasable, useStore } from "@/lib/store";
import { formatNumber, formatNumericLabel, formatPrice } from "@/lib/currency";
import { getLocalizedProductName } from "@/lib/products";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Shopping Cart · Lastella" },
      { name: "description", content: "Your Lastella cart." },
    ],
  }),
  component: Cart,
});

function Cart() {
  const { t, lang } = useI18n();
  const { cart, updateQty, removeFromCart, cartTotal } = useStore();
  const itemsNeedingOptions = cart.filter((item) => !isCartItemPurchasable(item));

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="mx-auto grid place-items-center h-24 w-24 rounded-full bg-primary/10 text-primary mb-6">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <h1 className="font-display text-4xl">
          {lang === "ar" ? "سلتك فارغة" : "Your cart is empty"}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {lang === "ar"
            ? "اكتشفي مجموعتنا وابدئي التسوق."
            : "Discover the collection and start shopping."}
        </p>
        <Link
          to="/shop"
          className="mt-8 inline-flex rounded-full bg-primary text-primary-foreground px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-rose-deep transition-all"
        >
          {t("hero.cta.shop")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-4xl sm:text-5xl mb-10">
        {lang === "ar" ? "سلة التسوق" : "Shopping Cart"}
      </h1>
      <div className="grid lg:grid-cols-[1fr_360px] gap-10">
        <div className="space-y-4">
          {cart.map(({ id, product, qty, size, color }) => (
            <div key={id} className="glass rounded-2xl p-4 flex gap-4">
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-xl overflow-hidden bg-secondary shrink-0">
                <img src={product.image} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <Link
                    to="/product/$slug"
                    params={{ slug: product.slug }}
                    className="font-display text-xl sm:text-2xl hover:text-primary transition-colors"
                  >
                    {getLocalizedProductName(product, lang)}
                  </Link>
                  <div className="text-sm text-muted-foreground mt-1 flex gap-3">
                    {size && (
                      <span>
                        {t("product.size")}:{" "}
                        {lang === "ar"
                          ? product.variants.find((variant) => variant.size === size)?.size_ar ||
                            formatNumericLabel(size, lang)
                          : size}
                      </span>
                    )}
                    {color && (
                      <span>
                        {t("product.color")}:{" "}
                        {lang === "ar"
                          ? product.variants.find((variant) => variant.color === color)?.color_ar ||
                            color
                          : color}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center rounded-full border border-border">
                    <button
                      onClick={() => updateQty(id, qty - 1)}
                      className="p-2 hover:text-primary"
                      aria-label="Decrease"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm">{formatNumber(qty, lang)}</span>
                    <button
                      onClick={() => updateQty(id, qty + 1)}
                      className="p-2 hover:text-primary"
                      aria-label="Increase"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">{formatPrice(product.price * qty, lang)}</span>
                    <button
                      onClick={() => removeFromCart(id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="glass rounded-2xl p-6 h-fit sticky top-32">
          <h2 className="font-display text-2xl mb-6">
            {lang === "ar" ? "ملخص الطلب" : "Order Summary"}
          </h2>
          <div className="space-y-3 text-sm">
            <Row
              label={lang === "ar" ? "المجموع الفرعي" : "Subtotal"}
              value={formatPrice(cartTotal, lang)}
            />
            <Row
              label={lang === "ar" ? "التوصيل" : "Delivery"}
              value={lang === "ar" ? "يحدد عند الدفع" : "Selected at checkout"}
            />
            <div className="border-t border-border pt-3 mt-4">
              <Row
                large
                label={lang === "ar" ? "المجموع الفرعي" : "Subtotal"}
                value={formatPrice(cartTotal, lang)}
              />
            </div>
          </div>
          {itemsNeedingOptions.length > 0 && (
            <div className="mt-4 space-y-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
              <p>{t("cart.optionRequired")}</p>
              {itemsNeedingOptions.map((item) => (
                <Link
                  key={item.id}
                  to="/product/$slug"
                  params={{ slug: item.product.slug }}
                  search={{ cartItemId: item.id }}
                  className="block underline"
                >
                  {getLocalizedProductName(item.product, lang)}
                </Link>
              ))}
            </div>
          )}
          <Link
            to="/checkout"
            aria-disabled={itemsNeedingOptions.length > 0}
            onClick={(event) => {
              if (itemsNeedingOptions.length > 0) event.preventDefault();
            }}
            className={`mt-6 w-full inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-6 py-4 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-rose-deep transition-all ${itemsNeedingOptions.length > 0 ? "pointer-events-none opacity-50" : ""}`}
          >
            {lang === "ar" ? "إتمام الشراء" : "Proceed to Checkout"}
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, large }: { label: string; value: React.ReactNode; large?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={large ? "font-display text-lg" : "text-muted-foreground"}>{label}</span>
      <span className={large ? "font-display text-xl" : "font-medium"}>{value}</span>
    </div>
  );
}
