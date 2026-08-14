import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/currency";
import { LogOut, Package, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Account · Lastella" }, { name: "description", content: "Sign in to your Lastella account." }] }),
  component: Account,
});

interface OrderRow {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
}

function Account() {
  const { lang } = useI18n();
  const { user, isAdmin, loading, signOut } = useAuth();
  if (loading) return <div className="p-24 text-center text-muted-foreground">Loading…</div>;
  return user ? <Dashboard signOut={signOut} isAdmin={isAdmin} email={user.email ?? ""} /> : <AuthForm lang={lang} />;
}

function Dashboard({ signOut, isAdmin, email }: { signOut: () => Promise<void>; isAdmin: boolean; email: string }) {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);

  useEffect(() => {
    async function loadUserOrders() {
      let apiOrders: OrderRow[] = [];
      try {
        const r = await fetch("/api/orders?all=true").catch(() => null);
        if (r && r.ok) {
          const data = await r.json();
          if (Array.isArray(data)) apiOrders = data;
        }
      } catch {}

      let localOrders: OrderRow[] = [];
      try {
        const raw = localStorage.getItem("lastella-orders");
        if (raw) localOrders = JSON.parse(raw);
      } catch {}

      const combined = [...localOrders, ...apiOrders];
      const map = new Map<string, OrderRow>();
      for (const o of combined) {
        if (o && o.order_number) map.set(o.order_number, o);
      }
      setOrders(Array.from(map.values()));
    }
    loadUserOrders();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="glass rounded-3xl p-8 mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-primary mb-2">Lastella</p>
            <h1 className="font-display text-3xl">{lang === "ar" ? "مرحبًا" : "Welcome back"}</h1>
            <p className="text-sm text-muted-foreground mt-1">{email}</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Link to="/admin" className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" /> Admin Panel
              </Link>
            )}
            <button onClick={async () => { await signOut(); navigate({ to: "/" }); toast.success("Signed out"); }} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs font-semibold uppercase tracking-wider hover:border-primary">
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-8">
        <h2 className="font-display text-2xl mb-6 flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> {lang === "ar" ? "طلباتي" : "My Orders"}</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">{lang === "ar" ? "لا توجد طلبات بعد." : "No orders yet."}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr><th className="text-start py-3">Order</th><th className="text-start">Date</th><th className="text-start">Status</th><th className="text-end">Total</th></tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-border/60">
                    <td className="py-3 font-medium">{o.order_number}</td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td><span className="capitalize inline-block rounded-full bg-primary/10 text-primary px-3 py-1 text-xs">{o.status}</span></td>
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

function AuthForm({ lang }: { lang: "en" | "ar" }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const { signIn } = useAuth();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    setBusy(true);
    try {
      if (tab === "register") {
        const full_name = String(fd.get("name"));
        // mock sign up and immediate login
        await signIn(email, full_name);
        toast.success("Account created and logged in successfully!");
      } else {
        // mock sign in
        await signIn(email);
        toast.success("Welcome back!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="glass rounded-3xl p-8">
        <h1 className="font-display text-3xl text-center mb-2">{lang === "ar" ? "حسابي" : "My Account"}</h1>
        <p className="text-center text-sm text-muted-foreground mb-6">{lang === "ar" ? "مرحبًا بك في دائرة لاستيلا" : "Welcome to the Lastella Circle"}</p>
        <div className="grid grid-cols-2 gap-2 p-1 rounded-full bg-secondary mb-6">
          <button type="button" onClick={() => setTab("login")} className={`py-2 rounded-full text-sm font-medium transition-all ${tab === "login" ? "bg-primary text-primary-foreground" : ""}`}>{lang === "ar" ? "تسجيل الدخول" : "Sign In"}</button>
          <button type="button" onClick={() => setTab("register")} className={`py-2 rounded-full text-sm font-medium transition-all ${tab === "register" ? "bg-primary text-primary-foreground" : ""}`}>{lang === "ar" ? "إنشاء حساب" : "Register"}</button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          {tab === "register" && <input name="name" placeholder={lang === "ar" ? "الاسم" : "Full name"} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary" required />}
          <input name="email" type="email" placeholder="Email" className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary" required />
          <input name="password" type="password" placeholder="Password (min 6 chars)" minLength={6} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary" required />
          <button disabled={busy} className="w-full rounded-full bg-primary text-primary-foreground px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.15em] hover:bg-rose-deep transition-all disabled:opacity-60">
            {busy ? "…" : tab === "login" ? (lang === "ar" ? "دخول" : "Sign In") : (lang === "ar" ? "إنشاء" : "Create Account")}
          </button>
        </form>
        <p className="text-center text-xs text-muted-foreground mt-4">
          {lang === "ar" ? "بالتسجيل، توافقين على الشروط." : "By continuing you agree to our terms."}
        </p>
      </div>
    </div>
  );
}
