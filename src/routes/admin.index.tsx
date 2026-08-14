import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package, ShoppingBag, DollarSign, Users, TrendingUp } from "lucide-react";
import { formatPrice } from "@/lib/currency";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

interface Stats {
  products: number;
  orders: number;
  revenue: number;
  pending: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  full_name: string;
  total: number;
  status: string;
  created_at: string;
}

function Dashboard() {
  const [stats, setStats] = useState<Stats>({ products: 0, orders: 0, revenue: 0, pending: 0 });
  const [recent, setRecent] = useState<RecentOrder[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [resP, resO] = await Promise.all([
          fetch("/api/products?all=true"),
          fetch("/api/orders?all=true"),
        ]);
        const products = await resP.json();
        const orders = await resO.json();

        const pList = Array.isArray(products) ? products : [];
        const oList = Array.isArray(orders) ? orders : [];

        setStats({
          products: pList.length,
          orders: oList.length,
          revenue: oList.reduce((s: number, x: any) => s + Number(x.total || 0), 0),
          pending: oList.filter((x: any) => x.status === "pending").length,
        });
        setRecent(oList.slice(0, 8));
      } catch (e) {
        console.error("Dashboard stats error", e);
      }
    })();
  }, []);

  const cards = [
    { label: "Products", value: stats.products, Icon: Package, tint: "bg-blue-500/10 text-blue-600" },
    { label: "Total Orders", value: stats.orders, Icon: ShoppingBag, tint: "bg-primary/10 text-primary" },
    { label: "Revenue", value: formatPrice(stats.revenue), Icon: DollarSign, tint: "bg-emerald-500/10 text-emerald-600" },
    { label: "Pending Orders", value: stats.pending, Icon: TrendingUp, tint: "bg-amber-500/10 text-amber-600" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, Icon, tint }) => (
          <div key={label} className="glass rounded-2xl p-5">
            <div className={`grid place-items-center h-10 w-10 rounded-xl ${tint} mb-4`}><Icon className="h-5 w-5" /></div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="font-display text-2xl mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-2xl mb-6">Recent Orders</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr><th className="text-start py-3">Order</th><th className="text-start">Customer</th><th className="text-start">Status</th><th className="text-start">Date</th><th className="text-end">Total</th></tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-b border-border/60">
                    <td className="py-3 font-medium">{o.order_number}</td>
                    <td>{o.full_name}</td>
                    <td><span className="capitalize inline-block rounded-full bg-primary/10 text-primary px-3 py-1 text-xs">{o.status}</span></td>
                    <td className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="text-end font-semibold">{formatPrice(Number(o.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
