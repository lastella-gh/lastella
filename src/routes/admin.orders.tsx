import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";

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

interface Order {
  id: string;
  order_number: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string;
  city: string;
  postal_code: string | null;
  delivery_type: "home" | "office" | null;
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
  size: string | null;
  color: string | null;
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
      let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("status", filter);
      const { data, error } = await query;
      if (error) throw error;
      setOrders(data);
    } catch (e) {
      toast.error("Failed to load orders");
    }
    setLoading(false);
  }

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      try {
        let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
        if (filter !== "all") query = query.eq("status", filter);
        const { data, error } = await query;
        if (error) throw error;
        setOrders(data);
      } catch {
        toast.error("Failed to load orders");
      }
      setLoading(false);
    }
    void loadOrders();
  }, [filter]);

  async function loadItems(orderId: string) {
    if (items[orderId]) return;
    try {
      const { data, error } = await supabase
        .from("order_items")
        .select("id, product_name, product_image, unit_price, quantity, size, color")
        .eq("order_id", orderId)
        .order("created_at");
      if (error) throw error;
      setItems((s) => ({ ...s, [orderId]: data }));
    } catch (e) {
      setItems((s) => ({ ...s, [orderId]: [] }));
    }
  }

  async function updateStatus(id: string, status: Status) {
    try {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
      toast.success("Status updated");
      await refresh();
    } catch (e) {
      toast.error("Failed to update status");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="font-display text-3xl">Orders</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="rounded-full border border-border bg-background px-4 py-2 text-sm"
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
                      if (next) loadItems(o.id);
                    }}
                    className="w-full text-start px-5 py-4 flex items-center gap-4 hover:bg-secondary/30 transition"
                  >
                    <div className="min-w-0 flex-1 grid sm:grid-cols-5 gap-3 items-center">
                      <div className="font-medium truncate">{o.order_number}</div>
                      <div className="text-sm truncate">{o.full_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleString()}
                      </div>
                      <div>
                        <span className="capitalize inline-block rounded-full bg-primary/10 text-primary px-3 py-1 text-xs">
                          {o.status.replaceAll("_", " ")}
                        </span>
                      </div>
                      <div className="text-end font-semibold">{formatPrice(Number(o.total))}</div>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 py-5 bg-secondary/20 border-t border-border grid lg:grid-cols-2 gap-6">
                      <div className="space-y-2 text-sm">
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
                            onChange={(e) => updateStatus(o.id, e.target.value as Status)}
                            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s.replaceAll("_", " ")}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold uppercase tracking-wider text-xs text-muted-foreground mb-3">
                          Items
                        </h4>
                        <div className="space-y-2">
                          {(items[o.id] ?? []).map((it) => (
                            <div key={it.id} className="flex items-center gap-3 text-sm">
                              <div className="h-12 w-12 rounded-lg bg-secondary overflow-hidden shrink-0">
                                {it.product_image && (
                                  <img
                                    src={it.product_image}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate">{it.product_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  ×{it.quantity} · {formatPrice(Number(it.unit_price))}
                                  {it.size ? ` · ${it.size}` : ""}
                                  {it.color ? ` · ${it.color}` : ""}
                                </p>
                              </div>
                              <span className="font-semibold">
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
      className={`flex justify-between ${bold ? "font-display text-base pt-2 border-t border-border" : ""}`}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}
