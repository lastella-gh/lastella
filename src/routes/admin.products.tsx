import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Enums, Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { formatPrice } from "@/lib/currency";
import { useArabicTranslation } from "@/hooks/use-arabic-translation";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

type Brand = Tables<"brands">;
type ProductVariant = Tables<"product_variants">;
type Product = Tables<"products"> & {
  brand: Pick<Brand, "id" | "name" | "slug"> | null;
  variants: ProductVariant[];
};
type ProductKind = Enums<"product_kind">;
type ProductCategory = Enums<"product_category">;
type VariantDraft = Pick<ProductVariant, "id" | "size" | "color" | "available">;

const KINDS: { value: ProductKind; label: string }[] = [
  { value: "jewelry", label: "Jewelry" },
  { value: "ring_box", label: "Ring box" },
  { value: "general_box", label: "General box" },
];
const CATEGORIES: ProductCategory[] = [
  "necklace",
  "bracelet",
  "ring",
  "earrings",
  "pendant",
  "watch",
  "bangle",
  "anklet",
];

function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    const [productsResult, brandsResult] = await Promise.all([
      supabase
        .from("products")
        .select(
          "*, brand:brands(id, name, slug), variants:product_variants(id, product_id, size, color, available, created_at, updated_at)",
        )
        .order("created_at", { ascending: false }),
      supabase.from("brands").select("*").order("name"),
    ]);

    if (productsResult.error || brandsResult.error) {
      toast.error("Failed to load the product catalog");
    } else {
      setProducts(productsResult.data);
      setBrands(brandsResult.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function remove(product: Product) {
    if (!confirm(`Delete ${product.name_en}?`)) return;
    setDeletingId(product.id);
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    setDeletingId(null);

    if (error) {
      toast.error("Product could not be deleted");
      return;
    }
    const imagePaths = [
      ...new Set([product.image, ...product.images].map(bucketImagePath).filter(Boolean)),
    ] as string[];
    if (imagePaths.length > 0) {
      const { error: cleanupError } = await supabase.storage
        .from("product-images")
        .remove(imagePaths);
      if (cleanupError) toast.error("Product deleted, but some image files could not be removed");
    }
    toast.success("Product deleted");
    await refresh();
  }

  async function toggle(product: Product, field: "available" | "visible") {
    setToggling(`${product.id}:${field}`);
    const update: TablesUpdate<"products"> =
      field === "available" ? { available: !product.available } : { visible: !product.visible };
    const { error } = await supabase.from("products").update(update).eq("id", product.id);
    setToggling(null);

    if (error) {
      toast.error(`Failed to update ${field}`);
      return;
    }
    setProducts((current) =>
      current.map((item) => (item.id === product.id ? { ...item, [field]: !item[field] } : item)),
    );
  }

  const query = search.trim().toLowerCase();
  const filteredProducts = products.filter(
    (product) =>
      !query ||
      product.name_en.toLowerCase().includes(query) ||
      product.name_ar?.toLowerCase().includes(query) ||
      product.slug.toLowerCase().includes(query) ||
      product.brand?.name.toLowerCase().includes(query) ||
      product.kind.replace("_", " ").includes(query) ||
      product.category?.includes(query),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl">Products</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage your store catalog ({products.length} total)
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          disabled={brands.length === 0}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-all hover:bg-rose-deep disabled:cursor-not-allowed disabled:opacity-50"
          title={brands.length === 0 ? "Create a brand first" : undefined}
        >
          <Plus className="h-4 w-4" /> New Product
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, slug, brand, kind, or category..."
            className="w-full rounded-full border border-border bg-background/50 py-2.5 pl-10 pr-9 text-sm backdrop-blur transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {search && (
          <span className="text-xs text-muted-foreground">
            {filteredProducts.length} {filteredProducts.length === 1 ? "result" : "results"}
          </span>
        )}
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4 text-start">Product</th>
                  <th className="p-4 text-start">Brand</th>
                  <th className="p-4 text-start">Type</th>
                  <th className="p-4 text-start">Price</th>
                  <th className="p-4 text-start">Available</th>
                  <th className="p-4 text-start">Visible</th>
                  <th className="p-4 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-border/60 transition-colors hover:bg-secondary/30"
                  >
                    <td className="p-4">
                      <div className="flex min-w-56 items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border/40 bg-secondary">
                          <img src={product.image} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{product.name_en}</p>
                          {product.name_ar && (
                            <p className="truncate text-xs text-muted-foreground" dir="rtl">
                              {product.name_ar}
                            </p>
                          )}
                          <p className="truncate font-mono text-[11px] text-muted-foreground/70">
                            {product.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{product.brand?.name ?? "Unknown"}</td>
                    <td className="p-4 capitalize">
                      <p>{product.kind.replace("_", " ")}</p>
                      {product.category && (
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="font-medium">{formatPrice(Number(product.price))}</p>
                      {product.old_price != null && (
                        <p className="text-xs text-muted-foreground line-through">
                          {formatPrice(Number(product.old_price))}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <StatusToggle
                        checked={product.available}
                        disabled={toggling === `${product.id}:available`}
                        onClick={() => void toggle(product, "available")}
                        onLabel="Available"
                        offLabel="Unavailable"
                      />
                    </td>
                    <td className="p-4">
                      <StatusToggle
                        checked={product.visible}
                        disabled={toggling === `${product.id}:visible`}
                        onClick={() => void toggle(product, "visible")}
                        onLabel="Visible"
                        offLabel="Hidden"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditing(product)}
                          className="rounded-lg p-2 hover:bg-secondary"
                          aria-label={`Edit ${product.name_en}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => void remove(product)}
                          disabled={deletingId === product.id}
                          className="rounded-lg p-2 text-destructive hover:bg-destructive/10 disabled:opacity-50"
                          aria-label={`Delete ${product.name_en}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-muted-foreground">
                      {search ? `No products matching "${search}"` : "No products yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(creating || editing) && (
        <ProductForm
          initial={editing}
          brands={brands}
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

function ProductForm({
  initial,
  brands,
  onClose,
  onSaved,
}: {
  initial: Product | null;
  brands: Brand[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const nameTranslation = useArabicTranslation(initial?.name_en, initial?.name_ar ?? "");
  const descriptionTranslation = useArabicTranslation(
    initial?.description_en ?? "",
    initial?.description_ar ?? "",
  );
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(initial));
  const [kind, setKind] = useState<ProductKind>(initial?.kind ?? "jewelry");
  const [available, setAvailable] = useState(initial?.available ?? true);
  const [visible, setVisible] = useState(initial?.visible ?? true);
  const [variants, setVariants] = useState<VariantDraft[]>(initial?.variants ?? []);
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [mainPreview, setMainPreview] = useState(initial?.image ?? "");
  const [galleryUrls, setGalleryUrls] = useState(initial?.images ?? []);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [removedExistingPaths, setRemovedExistingPaths] = useState<string[]>([]);
  const [isNewArrival, setIsNewArrival] = useState(initial?.is_new_arrival ?? false);
  const [isBestSeller, setIsBestSeller] = useState(initial?.is_best_seller ?? false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Saving...");
  const [saveError, setSaveError] = useState<string | null>(null);
  const mainPreviewRef = useRef(mainPreview);
  const galleryPreviewsRef = useRef(galleryPreviews);

  useEffect(() => {
    return () => {
      revokeBlobUrl(mainPreviewRef.current);
      galleryPreviewsRef.current.forEach(revokeBlobUrl);
    };
  }, []);

  function updateName(value: string) {
    nameTranslation.updateEnglish(value);
    if (!slugEdited) setSlug(toSlug(value));
  }

  function chooseMainImage(file: File | undefined) {
    if (!file || !validateImage(file)) return;
    revokeBlobUrl(mainPreviewRef.current);
    const preview = URL.createObjectURL(file);
    mainPreviewRef.current = preview;
    setMainFile(file);
    setMainPreview(preview);
    if (initial?.image) markRemovedPath(initial.image);
  }

  function addGallery(files: File[]) {
    const validFiles = files.filter(validateImage);
    const existing = new Set(galleryFiles.map(fileIdentity));
    const added = validFiles.filter((file) => {
      const identity = fileIdentity(file);
      if (existing.has(identity)) return false;
      existing.add(identity);
      return true;
    });
    const previews = added.map((file) => URL.createObjectURL(file));
    galleryPreviewsRef.current = [...galleryPreviewsRef.current, ...previews];
    setGalleryPreviews(galleryPreviewsRef.current);
    setGalleryFiles((current) => [...current, ...added]);
  }

  function markRemovedPath(url: string) {
    const path = bucketImagePath(url);
    if (path)
      setRemovedExistingPaths((current) => (current.includes(path) ? current : [...current, path]));
  }

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...patch } : variant,
      ),
    );
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mainPreview) {
      toast.error("A main product image is required");
      return;
    }

    const cleanedVariants = variants.map((variant) => ({
      ...variant,
      size: variant.size?.trim() || null,
      color: variant.color?.trim() || null,
    }));
    if (kind === "jewelry") {
      if (cleanedVariants.some((variant) => !variant.size && !variant.color)) {
        toast.error("Each variant needs a size, a color, or both");
        return;
      }
      const optionKeys = cleanedVariants.map(variantKey);
      if (new Set(optionKeys).size !== optionKeys.length) {
        toast.error("Variant size and color combinations must be unique");
        return;
      }
    }

    const form = new FormData(event.currentTarget);
    const uploadedPaths: string[] = [];
    let productPersisted = false;
    let createdProductId: string | null = null;
    setSaving(true);
    setSaveStatus("Saving...");
    setSaveError(null);

    try {
      const normalizedSlug = slug.trim();
      let duplicateSlugQuery = supabase
        .from("products")
        .select("id")
        .eq("slug", normalizedSlug)
        .limit(1);
      if (initial) duplicateSlugQuery = duplicateSlugQuery.neq("id", initial.id);
      const { data: duplicateSlug, error: duplicateSlugError } = await duplicateSlugQuery;
      if (duplicateSlugError) throw duplicateSlugError;
      if (duplicateSlug.length > 0) {
        throw new ProductSaveError(
          "This slug is already used by another product. Choose a unique slug.",
        );
      }

      let image = initial?.image ?? "";
      if (mainFile) {
        setSaveStatus("Uploading main image...");
        const uploaded = await uploadImage(mainFile);
        image = uploaded.url;
        uploadedPaths.push(uploaded.path);
      }

      const uploadedGallery: string[] = [];
      for (const [index, file] of galleryFiles.entries()) {
        setSaveStatus(`Uploading images (${index + 1}/${galleryFiles.length})...`);
        const uploaded = await uploadImage(file);
        uploadedGallery.push(uploaded.url);
        uploadedPaths.push(uploaded.path);
      }

      const category =
        kind === "jewelry" ? (String(form.get("category")) as ProductCategory) : null;
      const payload: TablesInsert<"products"> = {
        brand_id: String(form.get("brand_id")),
        kind,
        category,
        slug: normalizedSlug,
        name_en: nameTranslation.english.trim(),
        name_ar: optionalText(form.get("name_ar")),
        price: Number(form.get("price")),
        old_price: optionalNumber(form.get("old_price")),
        badge: optionalText(form.get("badge")),
        description_en: optionalText(form.get("description_en")),
        description_ar: optionalText(form.get("description_ar")),
        display_color: optionalText(form.get("display_color")),
        image,
        images: [...galleryUrls, ...uploadedGallery],
        available,
        visible,
        is_new_arrival: isNewArrival,
        is_best_seller: isBestSeller,
      };

      let productId: string;
      if (initial) {
        const update: TablesUpdate<"products"> = payload;
        const { error } = await supabase.from("products").update(update).eq("id", initial.id);
        if (error) throw error;
        productId = initial.id;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        productId = data.id;
        createdProductId = data.id;
      }
      productPersisted = true;

      await replaceVariants(
        productId,
        kind === "jewelry" ? cleanedVariants : [],
        initial?.variants ?? [],
      );

      if (removedExistingPaths.length > 0) {
        const retainedPaths = new Set(
          [image, ...galleryUrls, ...uploadedGallery].map(bucketImagePath).filter(Boolean),
        );
        const paths = removedExistingPaths.filter((path) => !retainedPaths.has(path));
        if (paths.length > 0) await supabase.storage.from("product-images").remove(paths);
      }

      toast.success(initial ? "Product updated" : "Product created");
      onSaved();
    } catch (error) {
      if (createdProductId) {
        await supabase.from("products").delete().eq("id", createdProductId);
        productPersisted = false;
      }
      if (initial && productPersisted && uploadedPaths.length > 0) {
        await supabase
          .from("products")
          .update({ image: initial.image, images: initial.images })
          .eq("id", initial.id);
      }
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("product-images").remove(uploadedPaths);
      }
      console.error("Failed to save product", error);
      const message = productSaveError(error);
      setSaveError(message);
      toast.error(message);
    } finally {
      setSaving(false);
      setSaveStatus("Saving...");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <form
        onSubmit={save}
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-border/60 bg-background shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border/50 p-6">
          <div>
            <h3 className="font-display text-2xl">{initial ? "Edit Product" : "New Product"}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Product details, merchandising, and purchasable options
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-secondary/80"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {saveError && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {saveError}
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name (EN)">
              <input
                value={nameTranslation.english}
                onChange={(event) => updateName(event.target.value)}
                onBlur={() => void nameTranslation.translate()}
                required
                autoFocus
                className={inputClass}
              />
            </Field>
            <Field label="Name (AR)">
              <input
                name="name_ar"
                value={nameTranslation.arabic}
                onChange={(event) => nameTranslation.updateArabic(event.target.value)}
                dir="rtl"
                aria-busy={nameTranslation.status === "translating"}
                className={inputClass}
              />
              {nameTranslation.status !== "idle" && (
                <p className="mt-1.5 text-xs text-muted-foreground" role="status">
                  {nameTranslation.status === "translating"
                    ? "Translating product name..."
                    : "Automatic translation failed. Enter the Arabic name manually or blur the English name to retry."}
                </p>
              )}
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
              />
            </Field>
            <Field label="Brand">
              <select
                name="brand_id"
                defaultValue={initial?.brand_id ?? brands[0]?.id}
                required
                className={inputClass}
              >
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                    {brand.visible ? "" : " (hidden)"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Kind">
              <select
                value={kind}
                onChange={(event) => setKind(event.target.value as ProductKind)}
                className={inputClass}
              >
                {KINDS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            {kind === "jewelry" && (
              <Field label="Category">
                <select
                  name="category"
                  defaultValue={initial?.category ?? "necklace"}
                  required
                  className={inputClass}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Price (OMR)">
              <input
                name="price"
                type="number"
                min="0.001"
                step="0.001"
                defaultValue={Number(initial?.price ?? 1.1).toFixed(3)}
                required
                className={inputClass}
              />
            </Field>
            <Field label="Old price (OMR)">
              <input
                name="old_price"
                type="number"
                min="0.001"
                step="0.001"
                defaultValue={
                  initial?.old_price == null ? "" : Number(initial.old_price).toFixed(3)
                }
                placeholder="Optional"
                className={inputClass}
              />
            </Field>
            <Field label="Badge">
              <input
                name="badge"
                defaultValue={initial?.badge ?? ""}
                placeholder="Optional, e.g. new or sale"
                className={inputClass}
              />
            </Field>
            <Field label="Display color">
              <input
                name="display_color"
                defaultValue={initial?.display_color ?? ""}
                placeholder="Optional, e.g. Rose Gold"
                className={inputClass}
              />
            </Field>
            <div className="sm:col-span-2 grid gap-5 sm:grid-cols-2">
              <Field label="Description (EN)">
                <textarea
                  name="description_en"
                  value={descriptionTranslation.english}
                  onChange={(event) => descriptionTranslation.updateEnglish(event.target.value)}
                  onBlur={() => void descriptionTranslation.translate()}
                  rows={3}
                  className={inputClass}
                />
              </Field>
              <Field label="Description (AR)">
                <textarea
                  name="description_ar"
                  value={descriptionTranslation.arabic}
                  onChange={(event) => descriptionTranslation.updateArabic(event.target.value)}
                  rows={3}
                  dir="rtl"
                  aria-busy={descriptionTranslation.status === "translating"}
                  className={inputClass}
                />
                {descriptionTranslation.status !== "idle" && (
                  <p className="mt-1.5 text-xs text-muted-foreground" role="status">
                    {descriptionTranslation.status === "translating"
                      ? "Translating product description..."
                      : "Automatic translation failed. Enter the Arabic description manually or blur the English description to retry."}
                  </p>
                )}
              </Field>
            </div>

            <div className="sm:col-span-2 grid gap-5 lg:grid-cols-[1fr_2fr]">
              <Field label="Main image">
                <label className="group flex h-44 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-primary/20 bg-secondary/10 transition-colors hover:bg-secondary/30">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      event.currentTarget.value = "";
                      chooseMainImage(file);
                    }}
                    className="hidden"
                  />
                  {mainPreview ? (
                    <img src={mainPreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                      <ImagePlus className="h-7 w-7 text-primary" /> Upload main image
                    </span>
                  )}
                </label>
              </Field>
              <Field label="Gallery images">
                <div className="flex min-h-44 flex-wrap content-start gap-3 rounded-2xl border border-border/60 bg-secondary/10 p-3">
                  {galleryUrls.map((url) => (
                    <ImageThumbnail
                      key={url}
                      src={url}
                      onRemove={() => {
                        markRemovedPath(url);
                        setGalleryUrls((current) => current.filter((item) => item !== url));
                      }}
                    />
                  ))}
                  {galleryFiles.map((file, index) => (
                    <ImageThumbnail
                      key={fileIdentity(file)}
                      src={galleryPreviews[index]}
                      onRemove={() => {
                        revokeBlobUrl(galleryPreviewsRef.current[index]);
                        galleryPreviewsRef.current = galleryPreviewsRef.current.filter(
                          (_, itemIndex) => itemIndex !== index,
                        );
                        setGalleryPreviews(galleryPreviewsRef.current);
                        setGalleryFiles((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        );
                      }}
                    />
                  ))}
                  <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-primary/20 text-muted-foreground transition-colors hover:bg-secondary">
                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => {
                        const files = Array.from(event.currentTarget.files ?? []);
                        event.currentTarget.value = "";
                        addGallery(files);
                      }}
                      className="hidden"
                    />
                    <Plus className="h-6 w-6" />
                  </label>
                </div>
              </Field>
            </div>

            {kind === "jewelry" && (
              <div className="sm:col-span-2 rounded-2xl border border-border/60 bg-secondary/10 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-medium">Variants</h4>
                    <p className="text-xs text-muted-foreground">
                      Add each purchasable size and color combination.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setVariants((current) => [
                        ...current,
                        { id: crypto.randomUUID(), size: "", color: "", available: true },
                      ])
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-secondary"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add variant
                  </button>
                </div>
                <div className="space-y-2">
                  {variants.map((variant, index) => (
                    <div
                      key={variant.id}
                      className="grid items-center gap-2 rounded-xl border border-border/50 bg-background p-3 sm:grid-cols-[1fr_1fr_auto_auto]"
                    >
                      <input
                        value={variant.size ?? ""}
                        onChange={(event) => updateVariant(index, { size: event.target.value })}
                        placeholder="Size (optional)"
                        aria-label={`Variant ${index + 1} size`}
                        className={inputClass}
                      />
                      <input
                        value={variant.color ?? ""}
                        onChange={(event) => updateVariant(index, { color: event.target.value })}
                        placeholder="Color (optional)"
                        aria-label={`Variant ${index + 1} color`}
                        className={inputClass}
                      />
                      <label className="flex items-center gap-2 whitespace-nowrap px-2 text-sm">
                        <input
                          type="checkbox"
                          checked={variant.available}
                          onChange={(event) =>
                            updateVariant(index, { available: event.target.checked })
                          }
                          className="h-4 w-4 accent-primary"
                        />
                        Available
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setVariants((current) =>
                            current.filter((_, itemIndex) => itemIndex !== index),
                          )
                        }
                        className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                        aria-label={`Remove variant ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {variants.length === 0 && (
                    <p className="rounded-xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
                      No variants. Add one if this product has selectable options.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
              <CheckboxCard
                checked={available}
                onChange={setAvailable}
                title="Available"
                description="Customers can purchase this product."
              />
              <CheckboxCard
                checked={visible}
                onChange={setVisible}
                title="Visible"
                description="Show this product in the storefront."
              />
              <CheckboxCard
                checked={isNewArrival}
                onChange={setIsNewArrival}
                title="New Arrival"
                description="Feature this product as a new arrival."
              />
              <CheckboxCard
                checked={isBestSeller}
                onChange={setIsBestSeller}
                title="Best Seller"
                description="Feature this product as a best seller."
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-border/50 bg-secondary/10 p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border bg-background px-6 py-2.5 text-sm font-medium hover:bg-secondary/80"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            className="rounded-full bg-primary px-8 py-2.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground hover:bg-rose-deep disabled:opacity-60"
          >
            {saving ? saveStatus : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StatusToggle({
  checked,
  disabled,
  onClick,
  onLabel,
  offLabel,
}: {
  checked: boolean;
  disabled: boolean;
  onClick: () => void;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-3 py-1 text-xs font-medium disabled:opacity-50 ${
        checked ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
      }`}
    >
      {checked ? onLabel : offLabel}
    </button>
  );
}

function CheckboxCard({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/50 bg-secondary/10 p-4 hover:bg-secondary/20">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 accent-primary"
      />
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

function ImageThumbnail({ src, onRemove }: { src: string; onRemove: () => void }) {
  return (
    <div className="group relative h-24 w-24 overflow-hidden rounded-xl border border-border">
      <img src={src} alt="" className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-destructive opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        aria-label="Remove image"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

async function uploadImage(file: File) {
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
  const path = `products/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
  });
  if (error) throw error;
  const url = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  return { path, url };
}

async function replaceVariants(
  productId: string,
  desired: VariantDraft[],
  existing: ProductVariant[],
) {
  const existingById = new Map(existing.map((variant) => [variant.id, variant]));
  const existingByOptions = new Map(existing.map((variant) => [variantKey(variant), variant]));
  const retainedIds = new Set<string>();
  const rows: TablesInsert<"product_variants">[] = desired.map((variant) => {
    const matched = existingByOptions.get(variantKey(variant)) ?? existingById.get(variant.id);
    if (matched) retainedIds.add(matched.id);
    return {
      id: matched?.id ?? variant.id,
      product_id: productId,
      size: variant.size || null,
      color: variant.color || null,
      available: variant.available,
    };
  });

  if (rows.length > 0) {
    const { error } = await supabase.from("product_variants").upsert(rows);
    if (error) throw error;
  }

  const obsoleteIds = existing
    .filter((variant) => !retainedIds.has(variant.id))
    .map((variant) => variant.id);
  if (obsoleteIds.length > 0) {
    const { error } = await supabase.from("product_variants").delete().in("id", obsoleteIds);
    if (error) throw error;
  }
}

function variantKey(variant: Pick<VariantDraft, "size" | "color">) {
  return `${variant.size?.trim() ?? ""}\u0000${variant.color?.trim() ?? ""}`;
}

function validateImage(file: File) {
  if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
    toast.error(`${file.name} must be a PNG, JPG, or WEBP image`);
    return false;
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.error(`${file.name} is larger than 5MB`);
    return false;
  }
  return true;
}

function fileIdentity(file: File) {
  return `${file.name}\u0000${file.size}\u0000${file.lastModified}\u0000${file.type}`;
}

function revokeBlobUrl(url: string | undefined) {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

function bucketImagePath(url: string) {
  try {
    const parsed = new URL(url);
    const prefix = "/storage/v1/object/public/product-images/";
    if (!parsed.pathname.startsWith(prefix)) return null;
    const path = decodeURIComponent(parsed.pathname.slice(prefix.length));
    return path.startsWith("products/") && !path.includes("..") ? path : null;
  } catch {
    return null;
  }
}

function optionalText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim() || null;
}

function optionalNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? Number(text) : null;
}

class ProductSaveError extends Error {}

function productSaveError(error: unknown) {
  if (error instanceof ProductSaveError) return error.message;

  const details = errorDetails(error);
  const searchable = `${details.message} ${details.details} ${details.hint}`.toLowerCase();

  if (details.code === "23505") {
    if (searchable.includes("slug")) {
      return "This slug is already used by another product. Choose a unique slug.";
    }
    if (searchable.includes("product_variants_unique_options")) {
      return "Two variants have the same size and color. Each option combination must be unique.";
    }
    return "A product with these details already exists. Check the slug and product options.";
  }
  if (details.code === "23503") {
    return "The selected brand or related record no longer exists. Refresh the page and try again.";
  }
  if (details.code === "23514") {
    if (searchable.includes("slug")) {
      return "The slug may contain only lowercase letters, numbers, and hyphens.";
    }
    if (searchable.includes("price")) return "Enter a valid product price of zero or more.";
    return "Some product details are invalid. Check the product type, category, and price.";
  }
  if (details.code === "42501") {
    return "You do not have permission to save products. Sign in again with an admin account.";
  }
  if (details.code.startsWith("PGRST")) {
    return "The catalog service could not save this product. Refresh the page and try again.";
  }
  if (
    searchable.includes("failed to fetch") ||
    searchable.includes("network") ||
    searchable.includes("timeout")
  ) {
    return "The product could not be saved because the connection was interrupted. Check your connection and try again.";
  }
  if (searchable.includes("payload too large") || searchable.includes("maximum allowed size")) {
    return "One of the selected images is too large. Use images smaller than 5MB.";
  }
  if (searchable.includes("mime") || searchable.includes("content type")) {
    return "One of the selected images has an unsupported format. Use PNG, JPG, or WEBP.";
  }

  return "We couldn't save the product. Check the form and try again. If the problem continues, refresh the page.";
}

function errorDetails(error: unknown) {
  if (!error || typeof error !== "object") {
    return { code: "", message: String(error ?? ""), details: "", hint: "" };
  }

  const value = error as Record<string, unknown>;
  return {
    code: typeof value.code === "string" ? value.code : "",
    message:
      error instanceof Error
        ? error.message
        : typeof value.message === "string"
          ? value.message
          : "",
    details: typeof value.details === "string" ? value.details : "",
    hint: typeof value.hint === "string" ? value.hint : "",
  };
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
