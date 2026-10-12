import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useEffectEvent, useState } from "react";
import { Check, ChevronDown, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/currency";
import {
  getAdminPaymentProofFn,
  loadAdminOrdersFn,
  reviewAdminPaymentFn,
  updateAdminOrderStatusFn,
} from "@/lib/admin-orders.functions";
import type { AdminOrder, AdminOrderItem, PaymentStatus } from "@/lib/admin-orders.server";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

const STATUSES = [
  "awaiting_payment",
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
type Status = (typeof STATUSES)[number];

function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [items, setItems] = useState<Record<string, AdminOrderItem[]>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

  const refresh = useEffectEvent(async () => {
    setLoading(true);
    try {
      const result = await loadAdminOrdersFn({
        data: { status: filter === "all" ? undefined : filter },
      });
      setOrders(result.orders);
      setItems(
        result.items.reduce<Record<string, AdminOrderItem[]>>((grouped, item) => {
          (grouped[item.order_id] ??= []).push(item);
          return grouped;
        }, {}),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load orders");
    }
    setLoading(false);
  });

  useEffect(() => {
    void refresh();
    // Effect Events intentionally stay outside dependency arrays.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function updateStatus(id: string, status: Status) {
    setBusy(id);
    try {
      await updateAdminOrderStatusFn({ data: { orderId: id, status } });
      toast.success("Status updated");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setBusy(null);
    }
  }

  async function reviewPayment(orderId: string, decision: "payment_verified" | "payment_rejected") {
    setBusy(orderId);
    try {
      await reviewAdminPaymentFn({
        data: { orderId, decision, rejectionReason: rejectionReasons[orderId] },
      });
      toast.success(decision === "payment_verified" ? "Payment verified" : "Payment rejected");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to review payment");
    } finally {
      setBusy(null);
    }
  }

  async function viewProof(orderId: string) {
    setBusy(`proof-${orderId}`);
    try {
      const { url } = await getAdminPaymentProofFn({ data: { orderId } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to open payment proof");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="font-display text-3xl">Orders</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          aria-label="Filter orders by status"
          className="min-h-11 w-full min-w-0 rounded-full border border-border bg-background px-4 py-2 text-base sm:w-auto sm:text-sm"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No orders.</div>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((o) => {
              const isOpen = open === o.id;
              return (
                <div key={o.id}>
                  <button
                    onClick={() => {
                      const next = isOpen ? null : o.id;
                      setOpen(next);
                    }}
                    aria-expanded={isOpen}
                    className="flex w-full items-start gap-3 px-4 py-4 text-start transition hover:bg-secondary/30 sm:px-5"
                  >
                    <div className="grid min-w-0 flex-1 grid-cols-2 items-start gap-2 xl:grid-cols-5 xl:items-center xl:gap-3">
                      <div className="min-w-0 break-all font-medium">{o.order_number}</div>
                      <div className="col-span-2 min-w-0 break-words text-sm xl:col-span-1">
                        {o.full_name}
                      </div>
                      <div className="col-span-2 text-xs text-muted-foreground xl:col-span-1">
                        {new Date(o.created_at).toLocaleString()}
                      </div>
                      <div className="col-span-2 flex flex-wrap gap-1 xl:col-span-1">
                        <span className="capitalize inline-block rounded-full bg-primary/10 text-primary px-3 py-1 text-xs">
                          {o.status.replaceAll("_", " ")}
                        </span>
                        <PaymentBadge
                          status={o.payment_status}
                          hasProof={Boolean(o.payment_proof_path)}
                        />
                      </div>
                      <div className="col-start-2 row-start-1 text-end font-semibold xl:col-auto xl:row-auto">
                        {formatPrice(Number(o.total))}
                      </div>
                    </div>
                    <ChevronDown
                      className={`mt-1 h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="grid min-w-0 gap-6 border-t border-border bg-secondary/20 px-4 py-5 sm:px-5 xl:grid-cols-2">
                      <div className="min-w-0 space-y-2 break-words text-sm">
                        <h4 className="font-semibold uppercase tracking-wider text-xs text-muted-foreground mb-2">
                          Customer
                        </h4>
                        <p>{o.full_name}</p>
                        <p className="text-muted-foreground">{o.email}</p>
                        <p className="text-muted-foreground">{o.phone}</p>
                        <p className="text-muted-foreground">
                          {o.address}, {o.city}
                          {o.postal_code ? ` – ${o.postal_code}` : ""}
                        </p>

                        <p className="text-xs uppercase tracking-wider mt-3">
                          Payment: <span className="font-medium">{o.payment_method}</span>
                        </p>
                        <div className="mt-3 rounded-xl border border-border bg-background/60 p-3 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-wider">
                            <span>Payment review</span>
                            <PaymentBadge
                              status={o.payment_status}
                              hasProof={Boolean(o.payment_proof_path)}
                            />
                          </div>
                          {o.payment_proof_path ? (
                            <>
                              <button
                                type="button"
                                disabled={busy === `proof-${o.id}`}
                                onClick={() => void viewProof(o.id)}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-secondary disabled:opacity-50"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                {busy === `proof-${o.id}` ? "Opening..." : "View proof"}
                              </button>
                              {o.payment_status !== "payment_verified" && (
                                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                  <button
                                    type="button"
                                    disabled={busy === o.id}
                                    onClick={() => void reviewPayment(o.id, "payment_verified")}
                                    className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                                  >
                                    <Check className="h-3.5 w-3.5" /> Verify payment
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy === o.id}
                                    onClick={() => void reviewPayment(o.id, "payment_rejected")}
                                    className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg border border-destructive/40 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                                  >
                                    <X className="h-3.5 w-3.5" /> Reject payment
                                  </button>
                                </div>
                              )}
                              {o.payment_status !== "payment_verified" && (
                                <input
                                  value={rejectionReasons[o.id] ?? ""}
                                  onChange={(event) =>
                                    setRejectionReasons((current) => ({
                                      ...current,
                                      [o.id]: event.target.value,
                                    }))
                                  }
                                  aria-label="Payment rejection reason"
                                  placeholder="Reason required when rejecting"
                                  className="min-h-11 w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-base sm:text-sm"
                                />
                              )}
                              {o.payment_rejection_reason && (
                                <p className="text-xs text-destructive">
                                  {o.payment_rejection_reason}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              No proof submitted (historical order).
                            </p>
                          )}
                        </div>
                        <p className="text-xs uppercase tracking-wider">
                          Delivery:{" "}
                          <span className="font-medium">{o.delivery_type ?? "Legacy order"}</span>
                        </p>
                        {o.notes && (
                          <p className="text-xs italic text-muted-foreground mt-2">"{o.notes}"</p>
                        )}
                        <div className="mt-4">
                          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-1.5">
                            Update status
                          </label>
                          <select
                            value={o.status}
                            disabled={busy === o.id}
                            onChange={(e) => updateStatus(o.id, e.target.value as Status)}
                            aria-label="Update order status"
                            className="min-h-11 w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2 text-base sm:text-sm"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s.replaceAll("_", " ")}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold uppercase tracking-wider text-xs text-muted-foreground mb-3">
                          Items
                        </h4>
                        <div className="space-y-2">
                          {(items[o.id] ?? []).map((it) => (
                            <div
                              key={it.id}
                              className="grid grid-cols-[3rem_minmax(0,1fr)] items-start gap-x-3 gap-y-1 text-sm sm:grid-cols-[3rem_minmax(0,1fr)_auto]"
                            >
                              <div className="row-span-2 h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                                {it.product_image && (
                                  <img
                                    src={it.product_image}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="break-words">{it.product_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  ×{it.quantity} · {formatPrice(Number(it.unit_price))}
                                  {it.size ? ` · ${it.size}` : ""}
                                  {it.color ? ` · ${it.color}` : ""}
                                </p>
                              </div>
                              <span className="col-start-2 font-semibold sm:col-start-3 sm:row-start-1">
                                {formatPrice(Number(it.unit_price) * it.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-border mt-4 pt-3 space-y-1 text-sm">
                          <Row label="Subtotal" value={formatPrice(Number(o.subtotal))} />
                          <Row label="Delivery" value={formatPrice(Number(o.shipping))} />
                          {Number(o.tax) > 0 && (
                            <Row label="Historical tax" value={formatPrice(Number(o.tax))} />
                          )}
                          <Row label="Total" value={formatPrice(Number(o.total))} bold />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div
      className={`flex flex-wrap justify-between gap-x-3 gap-y-1 ${bold ? "font-display text-base pt-2 border-t border-border" : ""}`}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}

function PaymentBadge({ status, hasProof }: { status: PaymentStatus; hasProof: boolean }) {
  const label = !hasProof ? "No proof" : status.replace("payment_", "").replaceAll("_", " ");
  const color =
    status === "payment_verified"
      ? "bg-emerald-500/10 text-emerald-700"
      : status === "payment_rejected"
        ? "bg-destructive/10 text-destructive"
        : "bg-amber-500/10 text-amber-700";
  return (
    <span className={`capitalize inline-block rounded-full px-3 py-1 text-xs ${color}`}>
      {label}
    </span>
  );
}
