import { createFileRoute, Link } from "@tanstack/react-router";
import { getOrderSuccessFn } from "@/lib/order-success.functions";
import { formatPrice } from "@/lib/currency";
import { formatNumber } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/order-success/$token")({
  loader: ({ params }) => getOrderSuccessFn({ data: { token: params.token } }),
  head: () => ({
    meta: [
      { title: "Order received · Lastella" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OrderSuccess,
  errorComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl">Order not found</h1>
      <p className="mt-3 text-muted-foreground">
        This confirmation link is invalid or has expired.
      </p>
      <Link className="mt-8 inline-block text-primary underline" to="/shop">
        Continue shopping
      </Link>
    </div>
  ),
});

function OrderSuccess() {
  const order = Route.useLoaderData();
  const { lang } = useI18n();
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="glass rounded-3xl p-6 sm:p-10">
        <p className="text-sm uppercase tracking-[0.2em] text-primary">Thank you</p>
        <h1 className="mt-3 font-display text-4xl">Order received</h1>
        <p className="mt-2 text-muted-foreground">Order {order.orderNumber}</p>
        <div className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
          <Info label="Status" value={order.status} />
          <Info label="Payment" value={order.paymentStatus} />
          <Info label="Delivery" value={order.deliveryType} />
          <Info label="Total" value={formatPrice(order.total, lang)} />
        </div>
        <div className="mt-8 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">
            {lang === "ar" ? "رقم التواصل" : "Contact number"}: {order.phone ?? "—"}
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {order.items.map((item) => (
              <li className="flex justify-between gap-4" key={`${item.name}-${item.quantity}`}>
                <span>
                  {item.name} ×{formatNumber(item.quantity, lang)}
                </span>
                <span>{formatPrice(item.unitPrice, lang)}</span>
              </li>
            ))}
          </ul>
        </div>
        <Link
          className="mt-8 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          to="/shop"
        >
          Continue shopping
        </Link>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
