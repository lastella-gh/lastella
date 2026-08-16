import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Banknote, Gift, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/currency";
import {
  FREE_SHIPPING_THRESHOLD_BAISA,
  SHIPPING_BAISA,
  VAT_RATE,
  fromBaisa,
  toBaisa,
} from "@/lib/checkout";
import { submitCheckout } from "@/lib/checkout.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout · Lastella" },
      { name: "description", content: "Complete your Lastella order." },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, cartTotal, clearCart } = useStore();
  const subtotalBaisa = toBaisa(cartTotal);
  const shippingBaisa = subtotalBaisa > FREE_SHIPPING_THRESHOLD_BAISA ? 0 : SHIPPING_BAISA;
  const taxBaisa = Math.round(subtotalBaisa * VAT_RATE);
  const shipping = fromBaisa(shippingBaisa);
  const tax = fromBaisa(taxBaisa);
  const grand = fromBaisa(subtotalBaisa + shippingBaisa + taxBaisa);
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<"cod" | "bank">("cod");
  const [needBox, setNeedBox] = useState<"yes" | "no">("yes");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);

    try {
      const order = await submitCheckout({
        data: {
          email: String(fd.get("email")),
          fullName: `${fd.get("first_name")} ${fd.get("last_name")}`.trim(),
          phone: String(fd.get("phone")),
          address: String(fd.get("address")),
          city: String(fd.get("city")),
          postalCode: String(fd.get("postal_code") || ""),
          country: String(fd.get("country") || "Sultanate of Oman"),
          needGiftBox: needBox === "yes",
          paymentMethod: payment,
          notes: String(fd.get("notes") || ""),
          items: cart.map(({ product, qty, size, color }) => ({
            productId: product.id,
            quantity: qty,
            size: size ?? null,
            color: color ?? null,
          })),
        },
      });
      if (!order) throw new Error("The order could not be created");

      toast.success(`Order ${order.order_number} placed successfully!`);
      clearCart();
      await navigate({ to: user ? "/account" : "/shop" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to place order";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-4xl sm:text-5xl mb-10">
        {lang === "ar" ? "إتمام الشراء" : "Checkout"}
      </h1>
      <form className="grid lg:grid-cols-[1fr_400px] gap-10" onSubmit={onSubmit}>
        <div className="space-y-8">
          <Section title={lang === "ar" ? "معلومات التواصل" : "Contact Information"}>
            <Input
              name="email"
              placeholder="Email address"
              type="email"
              defaultValue={user?.email ?? ""}
              required
            />
            <Input
              name="phone"
              placeholder={
                lang === "ar"
                  ? "رقم الهاتف (مثال: +968 9X XXX XXX)"
                  : "Phone number (e.g. +968 9X XXX XXX)"
              }
              required
            />
          </Section>

          <Section title={lang === "ar" ? "عنوان الشحن (سلطنة عُمان)" : "Shipping Address (Oman)"}>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input
                name="first_name"
                placeholder={lang === "ar" ? "الاسم الأول" : "First name"}
                required
              />
              <Input
                name="last_name"
                placeholder={lang === "ar" ? "الاسم الأخير" : "Last name"}
                required
              />
            </div>
            <Input
              name="address"
              placeholder={lang === "ar" ? "العنوان والمنطقة" : "Street address & region"}
              required
            />
            <div className="grid sm:grid-cols-3 gap-3">
              <Input
                name="city"
                placeholder={
                  lang === "ar" ? "المدينة (مسقط، صلالة، صحار...)" : "City (Muscat, Salalah...)"
                }
                required
              />
              <Input
                name="postal_code"
                placeholder={lang === "ar" ? "الرمز البريدي" : "Postal code"}
              />
              <Input
                name="country"
                placeholder="Country"
                defaultValue={lang === "ar" ? "سلطنة عُمان" : "Sultanate of Oman"}
                readOnly
              />
            </div>
            <textarea
              name="notes"
              placeholder={
                lang === "ar"
                  ? "ملاحظات الإهداء أو الشحن (اختياري)"
                  : "Gift or shipping notes (optional)"
              }
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors min-h-[80px]"
            />
          </Section>

          {/* Customized Packaging Box Selection */}
          <Section
            title={
              lang === "ar" ? "خيارات التغليف (صندوق مخصص)" : "Customized Packaging Box Option"
            }
          >
            <div className="glass rounded-2xl p-5 border border-primary/30 bg-primary/5 space-y-4">
              <div className="flex items-center gap-3">
                <Gift className="h-6 w-6 text-primary shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm">
                    {lang === "ar"
                      ? "هل تحتاج لإضافة صندوق التغليف المخصص؟"
                      : "Do you need a Customized Luxury Packaging Box?"}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {lang === "ar"
                      ? "اختر خيار التغليف المخصص المناسب لطلبك"
                      : "Select customized packaging option for your order"}
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                <label
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${needBox === "yes" ? "border-primary bg-primary/10 font-medium" : "border-border hover:bg-secondary/40"}`}
                >
                  <input
                    type="radio"
                    name="gift_box"
                    checked={needBox === "yes"}
                    onChange={() => setNeedBox("yes")}
                    className="accent-primary"
                  />
                  <div className="text-xs">
                    <span className="block font-semibold">
                      {lang === "ar"
                        ? "نعم، أريد صندوق التغليف المخصص 🎁"
                        : "Yes, Customized Luxury Box 🎁"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {lang === "ar"
                        ? "صندوق مخملي فاخر مخصص من لاستيلا"
                        : "Customized velvet Lastella box"}
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${needBox === "no" ? "border-primary bg-primary/10 font-medium" : "border-border hover:bg-secondary/40"}`}
                >
                  <input
                    type="radio"
                    name="gift_box"
                    checked={needBox === "no"}
                    onChange={() => setNeedBox("no")}
                    className="accent-primary"
                  />
                  <div className="text-xs">
                    <span className="block font-semibold">
                      {lang === "ar" ? "لا، تغليف بريدي عادي 📦" : "No, Standard Packaging 📦"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {lang === "ar" ? "كيس بريدي واقي كلاسيكي" : "Standard eco pouch"}
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </Section>
          <Section title={lang === "ar" ? "طريقة الدفع" : "Payment Method"}>
            {[
              {
                id: "cod",
                Icon: Banknote,
                label: lang === "ar" ? "الدفع عند الاستلام" : "Cash on Delivery",
              },
              { id: "bank", Icon: Truck, label: lang === "ar" ? "تحويل بنكي" : "Bank Transfer" },
            ].map(({ id, Icon, label }) => (
              <label
                key={id}
                className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${payment === id ? "border-primary bg-primary/5" : "border-border hover:border-primary"}`}
              >
                <input
                  type="radio"
                  name="pay"
                  checked={payment === id}
                  onChange={() => setPayment(id as "cod" | "bank")}
                  className="accent-primary"
                />
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </Section>
        </div>

        <aside className="glass rounded-2xl p-6 h-fit sticky top-32">
          <h2 className="font-display text-2xl mb-6">{lang === "ar" ? "ملخص" : "Summary"}</h2>
          <div className="space-y-3 max-h-64 overflow-auto pr-2">
            {cart.map(({ id, product, qty, size, color }) => (
              <div key={id} className="flex gap-3 text-sm">
                <div className="h-14 w-14 rounded-lg overflow-hidden bg-secondary shrink-0">
                  <img src={product.image} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate">{product.name[lang]}</p>
                  <p className="text-muted-foreground text-xs">
                    ×{qty}
                    {size ? ` | ${size}` : ""}
                    {color ? ` | ${color}` : ""}
                  </p>
                </div>
                <span className="font-medium whitespace-nowrap">
                  {formatPrice(product.price * qty)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-6 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between font-display text-lg pt-3 border-t border-border mt-2">
              <span>Total</span>
              <span>{formatPrice(grand)}</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-full bg-primary text-primary-foreground px-6 py-4 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-rose-deep transition-all disabled:opacity-60"
          >
            {submitting
              ? lang === "ar"
                ? "جاري..."
                : "Placing..."
              : lang === "ar"
                ? "تأكيد الطلب"
                : "Place Order"}
          </button>
          <Link
            to="/cart"
            className="mt-3 block text-center text-xs text-muted-foreground hover:text-primary"
          >
            ← {lang === "ar" ? "الرجوع للسلة" : "Back to cart"}
          </Link>
        </aside>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-display text-xl mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
    />
  );
}
