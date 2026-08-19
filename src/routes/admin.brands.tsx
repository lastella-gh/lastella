import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/brands")({
  component: AdminBrands,
});

type Brand = Tables<"brands">;

function AdminBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase.from("brands").select("*").order("name");

    if (error) {
      toast.error("Failed to load brands");
    } else {
      setBrands(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function remove(brand: Brand) {
    if (!confirm(`Delete ${brand.name}?`)) return;

    setDeletingId(brand.id);
    const { error } = await supabase.from("brands").delete().eq("id", brand.id);
    setDeletingId(null);

    if (error) {
      toast.error(
        error.code === "23503"
          ? "This brand is used by one or more products and cannot be deleted."
          : "Brand could not be deleted. Please try again.",
      );
      return;
    }

    toast.success("Brand deleted");
    await refresh();
  }

  const query = search.trim().toLowerCase();
  const filteredBrands = brands.filter(
    (brand) =>
      !query ||
      brand.name.toLowerCase().includes(query) ||
      brand.slug.toLowerCase().includes(query),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl">Brands</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Manage product brands ({brands.length} total)
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold uppercase tracking-wider hover:bg-rose-deep transition-all"
        >
          <Plus className="h-4 w-4" /> New Brand
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search brands by name or slug..."
            className="w-full rounded-full border border-border bg-background/50 backdrop-blur pl-10 pr-9 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {search && (
          <span className="text-xs text-muted-foreground">
            {filteredBrands.length} {filteredBrands.length === 1 ? "result" : "results"} found
          </span>
        )}
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-start p-4">Name</th>
                  <th className="text-start p-4">Slug</th>
                  <th className="text-start p-4">Status</th>
                  <th className="text-end p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBrands.map((brand) => (
                  <tr
                    key={brand.id}
                    className="border-b border-border/60 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="p-4 font-medium">{brand.name}</td>
                    <td className="p-4 text-xs text-muted-foreground font-mono">{brand.slug}</td>
                    <td className="p-4">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${brand.visible ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}
                      >
                        {brand.visible ? "Visible" : "Hidden"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditing(brand)}
                          className="p-2 rounded-lg hover:bg-secondary"
                          aria-label={`Edit ${brand.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => void remove(brand)}
                          disabled={deletingId === brand.id}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-destructive disabled:opacity-50"
                          aria-label={`Delete ${brand.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBrands.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-muted-foreground">
                      {search ? `No brands matching "${search}"` : "No brands yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(creating || editing) && (
        <BrandForm
          initial={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            void refresh();
          }}
        />
      )}
    </div>
  );
}

function BrandForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Brand | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(initial));
  const [visible, setVisible] = useState(initial?.visible ?? true);
  const [saving, setSaving] = useState(false);

  function updateName(value: string) {
    setName(value);
    if (!slugEdited) setSlug(toSlug(value));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const payload = { name: name.trim(), slug: slug.trim(), visible };
    const { error } = initial
      ? await supabase.from("brands").update(payload).eq("id", initial.id)
      : await supabase.from("brands").insert(payload);

    setSaving(false);
    if (error) {
      toast.error(
        error.code === "23505"
          ? "A brand with this name or slug already exists."
          : "Failed to save brand.",
      );
      return;
    }

    toast.success(initial ? "Brand updated" : "Brand created");
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
      <form
        onSubmit={save}
        className="bg-background rounded-3xl border border-border/60 shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <h3 className="font-display text-2xl">{initial ? "Edit Brand" : "New Brand"}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary/80"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <Field label="Name">
            <input
              value={name}
              onChange={(event) => updateName(event.target.value)}
              required
              autoFocus
              className={inputClass}
              placeholder="e.g. Lastella"
            />
          </Field>
          <Field label="Slug">
            <input
              value={slug}
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(toSlug(event.target.value));
              }}
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              className={inputClass}
              placeholder="e.g. lastella"
            />
          </Field>
          <label className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-secondary/10 cursor-pointer hover:bg-secondary/20">
            <input
              type="checkbox"
              checked={visible}
              onChange={(event) => setVisible(event.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-sm font-medium">Visible in the store</span>
          </label>
        </div>

        <div className="p-5 border-t border-border/50 flex justify-end gap-3 bg-secondary/10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-background border border-border px-6 py-2.5 text-sm font-medium hover:bg-secondary/80"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            className="rounded-full bg-primary text-primary-foreground px-8 py-2.5 text-sm font-semibold uppercase tracking-wider hover:bg-rose-deep disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Brand"}
          </button>
        </div>
      </form>
    </div>
  );
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
