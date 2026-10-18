import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2, Gift, Home, Landmark } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { deliveryFeeBaisa, fromBaisa, toBaisa } from "@/lib/checkout";
import {
  discardPaymentProofUpload,
  preparePaymentProofUpload,
  submitCheckout,
} from "@/lib/checkout.functions";
import { formatNumber, formatNumericLabel, formatPrice } from "@/lib/currency";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useAllBoxProducts } from "@/lib/products";
import { useStoreSettings } from "@/lib/settings";
import { isCartItemPurchasable, useStore, type Product } from "@/lib/store";
import { getLocalizedProductName } from "@/lib/products";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout · Lastella" }] }),
  component: Checkout,
});

type DeliveryType = "home" | "office";

function Checkout() {
  const { lang, t } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, cartTotal, clearCart } = useStore();
  const { data: settings } = useStoreSettings();
  const { data: boxes = [] } = useAllBoxProducts();
  const [deliveryType, setDeliveryType] = useState<DeliveryType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [proof, setProof] = useState<{ intentId: string; claimToken: string; name: string } | null>(
    null,
  );
  const [proofState, setProofState] = useState("No payment proof selected");
  const shippingBaisa = deliveryType ? deliveryFeeBaisa(deliveryType) : 0;
  const total = fromBaisa(toBaisa(cartTotal) + shippingBaisa);
  const cartItemsNeedingOptions = cart.filter((item) => !isCartItemPurchasable(item));

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (cart.length === 0) return toast.error("Your cart is empty");
    if (cartItemsNeedingOptions.length > 0)
      return toast.error(
        lang === "ar"
          ? "اختاري خيارات المنتجات قبل إتمام الشراء"
          : "Choose product options before checkout",
      );
    if (!deliveryType) return toast.error("Select Home or Office Delivery");
    if (!proof) return toast.error("Upload your bank transfer proof first");
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      const order = await submitCheckout({
        data: {
          checkout: {
            email: String(form.get("email")),
            fullName: `${form.get("first_name")} ${form.get("last_name")}`.trim(),
            phone: String(form.get("phone")),
            address: String(form.get("address")),
            city: String(form.get("city")),
            country: String(form.get("country") || "Sultanate of Oman"),
            deliveryType,
            notes: String(form.get("notes") || ""),
            items: cart.map(({ product, qty, variantId, size, color }) => ({
              productId: product.id,
              quantity: qty,
              variantId: variantId ?? null,
              size: size ?? null,
              color: color ?? null,
            })),
          },
          payment: proof,
        },
      });
      toast.success(`Order ${order.order_number} placed successfully!`);
      clearCart();
      await navigate({ to: "/order-success/$token", params: { token: order.successToken } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-10 font-display text-4xl sm:text-5xl">
        {lang === "ar" ? "إتمام الشراء" : "Checkout"}
      </h1>
      <form className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1fr)_400px]" onSubmit={onSubmit}>
        <div className="min-w-0 space-y-8">
          <Section title={lang === "ar" ? "معلومات التواصل" : "Contact Information"}>
            <Input
              name="email"
              type="email"
              placeholder="Email address"
              defaultValue={user?.email ?? ""}
              required
            />
            <Input
              name="phone"
              placeholder={lang === "ar" ? "رقم الهاتف" : "Phone number"}
              required
            />
          </Section>

          <Section title={lang === "ar" ? "طريقة التوصيل" : "Delivery Method"}>
            <div className="grid gap-3 sm:grid-cols-2">
              <DeliveryCard
                type="home"
                selected={deliveryType}
                onSelect={setDeliveryType}
                Icon={Home}
                title="Home Delivery"
                subtitle="Residential address"
                price={2}
                language={lang}
              />
              <DeliveryCard
                type="office"
                selected={deliveryType}
                onSelect={setDeliveryType}
                Icon={Building2}
                title="Office Delivery"
                subtitle="Workplace address"
                price={1}
                language={lang}
              />
            </div>
          </Section>

          <Section
            title={lang === "ar" ? "عنوان التوصيل (سلطنة عُمان)" : "Delivery Address (Oman)"}
          >
            <div className="grid gap-3 sm:grid-cols-2">
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
              placeholder={
                deliveryType === "office"
                  ? "Company, building and street"
                  : "Street address and region"
              }
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="city" placeholder="City" required />
              <Input
                name="country"
                defaultValue="Sultanate of Oman"
                aria-label="Country"
                readOnly
              />
            </div>
            <textarea
              name="notes"
              placeholder="Gift or delivery notes (optional)"
              className="min-h-20 w-full resize-y rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none"
            />
          </Section>

          {boxes.length > 0 && (
            <BoxSuggestions title={t("checkout.jeweleryBoxes")} products={boxes} language={lang} />
          )}

          <Section title={lang === "ar" ? "طريقة الدفع" : "Payment Method"}>
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
              <div className="flex items-center gap-3">
                <Landmark className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-semibold">Bank Transfer</p>
                  <p className="text-xs text-muted-foreground">
                    Orders are processed after payment confirmation.
                  </p>
                </div>
              </div>
              <dl className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
                <BankDetail label="Bank" value={settings?.bank_name} />
                <BankDetail label="Account holder" value={settings?.bank_account_name} />
                <BankDetail
                  label="Account / IBAN"
                  value={settings?.bank_account_number}
                  className="break-words sm:col-span-2"
                />
              </dl>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                {settings?.bank_instructions}
              </p>
            </div>
          </Section>
          <Section title={lang === "ar" ? "إثبات التحويل" : "Payment Proof"}>
            <label className="block cursor-pointer overflow-hidden rounded-2xl border border-dashed border-primary/50 p-5 text-sm hover:bg-primary/5">
              <span className="font-medium">JPG, PNG or WEBP, maximum 5MB</span>
              <input
                className="mt-3 block w-full overflow-hidden text-ellipsis text-sm"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={async (event) => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = "";
                  if (!file) return;
                  if (
                    !(["image/jpeg", "image/png", "image/webp"] as string[]).includes(file.type) ||
                    file.size > 5 * 1024 * 1024
                  ) {
                    setProof(null);
                    setProofState("Invalid file. Choose a JPG, PNG or WEBP up to 5MB.");
                    return;
                  }
                  setProofState(`Preparing ${file.name}...`);
                  try {
                    if (proof) {
                      await discardPaymentProofUpload({
                        data: { intentId: proof.intentId, claimToken: proof.claimToken },
                      });
                      setProof(null);
                    }
                    const prepared = await preparePaymentProofUpload({
                      data: { filename: file.name, contentType: file.type, size: file.size },
                    });
                    const { error } = await supabase.storage
                      .from("payment-proofs")
                      .uploadToSignedUrl(prepared.path, prepared.token, file);
                    if (error) throw error;
                    setProof({
                      intentId: prepared.intentId,
                      claimToken: prepared.claimToken,
                      name: file.name,
                    });
                    setProofState(`${file.name} uploaded and ready to submit.`);
                  } catch {
                    setProof(null);
                    setProofState("Upload failed. Choose the file again to retry.");
                  }
                }}
              />
            </label>
            <p
              className="break-words text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              {proofState}
            </p>
          </Section>
        </div>

        <aside className="glass min-w-0 h-fit rounded-2xl p-6 lg:sticky lg:top-32">
          <h2 className="mb-6 font-display text-2xl">{lang === "ar" ? "ملخص" : "Summary"}</h2>
          <div className="max-h-64 space-y-3 overflow-auto pr-2">
            {cart.map(({ id, product, qty, size, color, variantId }) => (
              <div key={id} className="flex gap-3 text-sm">
                <img
                  src={product.image}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate">{getLocalizedProductName(product, lang)}</p>
                  <p className="text-xs text-muted-foreground">
                    ×{formatNumber(qty, lang)}
                    {size
                      ? ` | ${lang === "ar" ? product.variants.find((variant) => variant.id === variantId)?.size_ar || formatNumericLabel(size, lang) : size}`
                      : ""}
                    {color
                      ? ` | ${lang === "ar" ? product.variants.find((variant) => variant.id === variantId)?.color_ar || color : color}`
                      : ""}
                  </p>
                  {!isCartItemPurchasable({ id, product, qty, size, color, variantId }) && (
                    <Link
                      to="/product/$slug"
                      params={{ slug: product.slug }}
                      search={{ cartItemId: id }}
                      className="text-xs text-destructive underline"
                    >
                      {lang === "ar" ? "اختاري الخيارات من جديد" : "Select options again"}
                    </Link>
                  )}
                </div>
                <span className="whitespace-nowrap font-medium">
                  {formatPrice(product.price * qty, lang)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
            <SummaryRow
              label={lang === "ar" ? "المجموع الفرعي" : "Subtotal"}
              value={formatPrice(cartTotal, lang)}
            />
            <SummaryRow
              label={lang === "ar" ? "التوصيل" : "Delivery"}
              value={
                deliveryType
                  ? formatPrice(fromBaisa(shippingBaisa), lang)
                  : lang === "ar"
                    ? "اختاري طريقة التوصيل"
                    : "Select method"
              }
            />
            <SummaryRow
              label={lang === "ar" ? "الإجمالي" : "Total"}
              value={formatPrice(total, lang)}
              total
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !deliveryType || !proof || cartItemsNeedingOptions.length > 0}
            className="mt-6 w-full rounded-full bg-primary px-6 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-primary-foreground disabled:opacity-50"
          >
            {submitting ? "Placing..." : "Place Order"}
          </button>
          <Link
            to="/cart"
            className="mt-3 block text-center text-xs text-muted-foreground hover:text-primary"
          >
            ← Back to cart
          </Link>
        </aside>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0">
      <h2 className="mb-4 font-display text-xl">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none"
    />
  );
}

function DeliveryCard({
  type,
  selected,
  onSelect,
  Icon,
  title,
  subtitle,
  price,
  language,
}: {
  type: DeliveryType;
  selected: DeliveryType | null;
  onSelect: (type: DeliveryType) => void;
  Icon: typeof Home;
  title: string;
  subtitle: string;
  price: number;
  language: "en" | "ar";
}) {
  return (
    <label
      className={`flex min-w-0 cursor-pointer items-center gap-3 rounded-2xl border p-4 ${selected === type ? "border-primary bg-primary/5" : "border-border"}`}
    >
      <input
        type="radio"
        name="delivery_type"
        checked={selected === type}
        onChange={() => onSelect(type)}
        className="accent-primary"
      />
      <Icon className="h-5 w-5 text-primary" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </span>
      <span className="font-semibold">{formatPrice(price, language)}</span>
    </label>
  );
}

function BoxSuggestions({
  title,
  products,
  language,
}: {
  title: string;
  products: Product[];
  language: "en" | "ar";
}) {
  return (
    <Section title={title}>
      <div className="min-w-0 max-w-full overflow-hidden [contain:layout_paint]">
        <div dir="ltr" className="flex w-full max-w-full gap-4 overflow-x-auto pb-2">
          {products.map((product) => (
            <Link
              key={product.id}
              to="/product/$slug"
              params={{ slug: product.slug }}
              className="w-40 shrink-0 overflow-hidden rounded-2xl border border-border bg-background transition hover:border-primary"
            >
              <img
                src={product.image}
                alt={product.name.en}
                className="aspect-square w-full object-cover"
              />
              <div className="p-3">
                <p className="text-sm font-medium">{getLocalizedProductName(product, language)}</p>
                <p className="mt-1 text-xs text-primary">{formatPrice(product.price, language)}</p>
                {!product.available && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {language === "ar" ? "غير متوفر حاليًا" : "Currently unavailable"}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Gift className="h-4 w-4" />
        {language === "ar"
          ? "اختاري صندوقًا لعرض تفاصيله."
          : "Select a box to view its product page."}
      </p>
    </Section>
  );
}

function BankDetail({
  label,
  value,
  className = "",
}: {
  label: string;
  value?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-all font-medium">{value ?? "To be confirmed"}</dd>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  total,
}: {
  label: string;
  value: React.ReactNode;
  total?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${total ? "mt-2 border-t border-border pt-3 font-display text-lg" : ""}`}
    >
      <span className={total ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
