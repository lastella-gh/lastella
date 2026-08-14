import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/currency";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

interface Order {
  id: string;
  order_number: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string;
  city: string;
  postal_code: string | null;
  need_gift_box?: boolean;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: Status;
  payment_method: string;
  notes: string | null;
  created_at: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  unit_price: number;
  quantity: number;
}

function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Record<string, OrderItem[]>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Status>("all");

  async function refresh() {
    setLoading(true);
    try {
      const url = filter !== "all" ? `/api/orders?status=${filter}` : "/api/orders?all=true";
      const res = await fetch(url).catch(() => null);
      let apiOrders: Order[] = [];
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) apiOrders = data;
      }

      let localOrders: any[] = [];
      try {
        const raw = localStorage.getItem("lastella-orders");
        if (raw) localOrders = JSON.parse(raw);
      } catch {}

      const combined = [...localOrders, ...apiOrders];
      const map = new Map<string, Order>();
      for (const o of combined) {
        if (o && o.order_number) {
          if (filter !== "all" && o.status !== filter) continue;
          map.set(o.order_number, o);
        }
      }
      setOrders(Array.from(map.values()));
    } catch (e) {
      toast.error("Failed to load orders");
    }
    setLoading(false);
  }

  useEffect(() => { refresh(); }, [filter]);

  async function loadItems(orderId: string) {
    if (items[orderId]) return;
    try {
      const res = await fetch(`/api/order-items?order_id=${orderId}`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setItems((s) => ({ ...s, [orderId]: data }));
          return;
        }
      }

      let localOrders: any[] = [];
      try {
        const raw = localStorage.getItem("lastella-orders");
        if (raw) localOrders = JSON.parse(raw);
      } catch {}
      const found = localOrders.find((o) => o.id === orderId || o.order_number === orderId);
      if (found && found.items) {
        setItems((s) => ({ ...s, [orderId]: found.items }));
        return;
      }
      setItems((s) => ({ ...s, [orderId]: [] }));
    } catch (e) {
      setItems((s) => ({ ...s, [orderId]: [] }));
    }
  }

  async function updateStatus(id: string, status: Status) {
    try {
      try {
        const localOrders = JSON.parse(localStorage.getItem("lastella-orders") || "[]");
        const idx = localOrders.findIndex((o: any) => o.id === id || o.order_number === id);
        if (idx !== -1) {
          localOrders[idx].status = status;
          localStorage.setItem("lastella-orders", JSON.stringify(localOrders));
        }
      } catch {}

      fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      }).catch(() => null);

      toast.success("Status updated");
      refresh();
    } catch (e) {
      toast.error("Failed to update status");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="font-display text-3xl">Orders</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="rounded-full border border-border bg-background px-4 py-2 text-sm">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
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
                    onClick={() => { const next = isOpen ? null : o.id; setOpen(next); if (next) loadItems(o.id); }}
                    className="w-full text-start px-5 py-4 flex items-center gap-4 hover:bg-secondary/30 transition"
                  >
                    <div className="min-w-0 flex-1 grid sm:grid-cols-5 gap-3 items-center">
                      <div className="font-medium truncate">{o.order_number}</div>
                      <div className="text-sm truncate">{o.full_name}</div>
                      <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                      <div><span className="capitalize inline-block rounded-full bg-primary/10 text-primary px-3 py-1 text-xs">{o.status}</span></div>
                      <div className="text-end font-semibold">{formatPrice(Number(o.total))}</div>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 py-5 bg-secondary/20 border-t border-border grid lg:grid-cols-2 gap-6">
                      <div className="space-y-2 text-sm">
                        <h4 className="font-semibold uppercase tracking-wider text-xs text-muted-foreground mb-2">Customer</h4>
                        <p>{o.full_name}</p>
                        <p className="text-muted-foreground">{o.email}</p>
                        <p className="text-muted-foreground">{o.phone}</p>
                        <p className="text-muted-foreground">{o.address}, {o.city}{o.postal_code ? ` – ${o.postal_code}` : ""}</p>
                        
                        {/* Customized Packaging Box Status */}
                        <div className="pt-2">
                          {o.need_gift_box ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 text-xs font-semibold border border-rose-500/20">
                              🎁 Needs Customized Box (صندوق تغليف مخصص)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-muted-foreground text-xs font-medium border border-border/40">
                              📦 Standard Packaging (تغليف عادي)
                            </span>
                          )}
                        </div>

                        <p className="text-xs uppercase tracking-wider mt-3">Payment: <span className="font-medium">{o.payment_method}</span></p>
                        {o.notes && <p className="text-xs italic text-muted-foreground mt-2">"{o.notes}"</p>}
                        <div className="mt-4">
                          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-1.5">Update status</label>
                          <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value as Status)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold uppercase tracking-wider text-xs text-muted-foreground mb-3">Items</h4>
                        <div className="space-y-2">
                          {(items[o.id] ?? []).map((it) => (
                            <div key={it.id} className="flex items-center gap-3 text-sm">
                              <div className="h-12 w-12 rounded-lg bg-secondary overflow-hidden shrink-0">
                                {it.product_image && <img src={it.product_image} alt="" className="h-full w-full object-cover" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate">{it.product_name}</p>
                                <p className="text-xs text-muted-foreground">×{it.quantity} · {formatPrice(Number(it.unit_price))}</p>
                              </div>
                              <span className="font-semibold">{formatPrice(Number(it.unit_price) * it.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-border mt-4 pt-3 space-y-1 text-sm">
                          <Row label="Subtotal" value={formatPrice(Number(o.subtotal))} />
                          <Row label="Shipping" value={Number(o.shipping) === 0 ? "Free" : formatPrice(Number(o.shipping))} />
                          <Row label="Tax" value={formatPrice(Number(o.tax))} />
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

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-display text-base pt-2 border-t border-border" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}
