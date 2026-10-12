import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft, LayoutDashboard, Package, Settings, ShoppingBag, Tags } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · Lastella" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { location } = useRouterState();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/account" });
  }, [loading, user, navigate]);

  if (loading)
    return (
      <div className="px-4 py-16 text-center sm:py-24">
        <div className="inline-flex flex-col items-center gap-4 text-muted-foreground">
          <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-sm">Loading admin panel...</p>
        </div>
      </div>
    );
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-3xl">Access Denied</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your account does not have admin privileges.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold uppercase tracking-wider"
        >
          Go Home
        </Link>
      </div>
    );
  }

  const nav = [
    { to: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true },
    { to: "/admin/products", label: "Products", Icon: Package },
    { to: "/admin/brands", label: "Brands", Icon: Tags },
    { to: "/admin/orders", label: "Orders", Icon: ShoppingBag },
    { to: "/admin/settings", label: "Store Settings", Icon: Settings },
  ];

  return (
    <div dir="ltr" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-primary mb-1">Lastella</p>
          <h1 className="font-display text-3xl sm:text-4xl">Admin Panel</h1>
        </div>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to store
        </Link>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
        <aside className="glass h-fit min-w-0 rounded-2xl p-2 lg:sticky lg:top-28 lg:p-3">
          <nav
            aria-label="Admin navigation"
            className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1"
          >
            {nav.map(({ to, label, Icon, exact }) => {
              const active = exact ? location.pathname === to : location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${active ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
                >
                  <Icon className="h-4 w-4 shrink-0" /> <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
