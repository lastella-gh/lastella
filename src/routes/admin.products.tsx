import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/currency";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

interface Row {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string | null;
  category: string;
  price: number;
  old_price: number | null;
  image: string;
  stock: number;
  active: boolean;
  badge: string | null;
  rating: number;
  reviews: number;
  description_en: string | null;
  images: string[];
  sizes: string[];
  colors: string[];
}

import { FALLBACK_PRODUCTS } from "@/lib/products";

const CATEGORIES = ["necklace", "bracelet", "ring", "earrings", "pendant", "watch"];
const BADGES = ["", "new", "sale", "bestseller"];

function AdminProducts() {
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/products?all=true").catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setRows(data);
          setLoading(false);
          return;
        }
      }
      const fallbackRows: Row[] = FALLBACK_PRODUCTS.map((p) => ({
        id: p.id,
        slug: p.slug,
        name_en: p.name.en,
        name_ar: p.name.ar,
        category: p.category,
        price: p.price,
        old_price: p.oldPrice,
        image: p.image,
        stock: p.stock,
        active: true,
        badge: p.badge || "",
        rating: p.rating,
        reviews: p.reviews,
        description_en: p.description,
        sizes: p.sizes,
        colors: p.colors,
        images: p.images,
      }));
      setRows(fallbackRows);
    } catch (e) {
      toast.error("Failed to load products");
    }
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function remove(id: string) {
    if (!confirm("Delete this product?")) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Deleted");
      refresh();
    } catch (e) {
      toast.error("Failed to delete product");
    }
  }

  async function toggleActive(row: Row) {
    try {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, active: !row.active }),
      });
      if (!res.ok) throw new Error("Update failed");
      refresh();
    } catch (e) {
      toast.error("Failed to update");
    }
  }

  const filteredRows = rows.filter((r) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase().trim();
    return (
      (r.name_en && r.name_en.toLowerCase().includes(query)) ||
      (r.name_ar && r.name_ar.toLowerCase().includes(query)) ||
      (r.slug && r.slug.toLowerCase().includes(query)) ||
      (r.category && r.category.toLowerCase().includes(query)) ||
      (r.badge && r.badge.toLowerCase().includes(query))
    );
  });

  async function seedDemoProducts() {
    if (!confirm("Add 25 curated luxury demo products to your database?")) return;
    setLoading(true);
    const demoItems = [
      { slug: "royal-rose-gold-necklace", name_en: "Royal Rose Gold Diamond Necklace", name_ar: "قلادة الملكية من الذهب الوردي والألماس", category: "necklace", price: 1250, old_price: 1500, image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80", stock: 15, badge: "bestseller", rating: 4.9, reviews: 28, description_en: "Handcrafted 18k rose gold necklace encrusted with ethically sourced brilliant-cut diamonds.", sizes: ["16 inch", "18 inch"], colors: ["Rose Gold", "Yellow Gold"] },
      { slug: "floating-diamond-halo-necklace", name_en: "Floating Diamond Halo Necklace", name_ar: "قلادة الألماس العائم والبهجة", category: "necklace", price: 1890, old_price: 2200, image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80", stock: 10, badge: "new", rating: 5.0, reviews: 19, description_en: "Suspended brilliant diamond surrounded by micro-pave halo set in pure 18k white gold.", sizes: ["16 inch", "18 inch"], colors: ["White Gold", "Platinum"] },
      { slug: "celestial-gold-choker", name_en: "Celestial Hammered Gold Choker", name_ar: "طوق الذهب المطرّق السماوي", category: "necklace", price: 980, old_price: null, image: "https://images.unsplash.com/photo-1611591475140-7e0258169fb6?auto=format&fit=crop&w=800&q=80", stock: 22, badge: "", rating: 4.7, reviews: 12, description_en: "Modern artisanal 18k gold choker with textured hammered finish.", sizes: ["14-16 inch"], colors: ["Yellow Gold"] },
      { slug: "imperial-ruby-necklace", name_en: "Imperial Ruby & Diamond Statement Necklace", name_ar: "قلادة الياقوت الإمبراطوري الفاخرة", category: "necklace", price: 3800, old_price: 4300, image: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80", stock: 4, badge: "bestseller", rating: 5.0, reviews: 35, description_en: "Showstopping necklace featuring deep Burmese rubies surrounded by diamonds.", sizes: ["18 inch"], colors: ["Rose Gold", "White Gold"] },
      { slug: "sapphire-elegance-ring", name_en: "Royal Blue Sapphire & Diamond Ring", name_ar: "خاتم الياقوت الأزرق الملكي والألماس", category: "ring", price: 850, old_price: 990, image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80", stock: 8, badge: "new", rating: 5.0, reviews: 14, description_en: "Stunning oval Ceylon blue sapphire framed by halo pave diamonds.", sizes: ["US 6", "US 7", "US 8"], colors: ["White Gold", "Platinum"] },
      { slug: "solitaire-platinum-ring", name_en: "Solitaire Platinum Diamond Ring", name_ar: "خاتم سوليتير من البلاتين والماس", category: "ring", price: 1800, old_price: 2100, image: "https://images.unsplash.com/photo-1603561596112-0a132b757442?auto=format&fit=crop&w=800&q=80", stock: 6, badge: "bestseller", rating: 4.9, reviews: 42, description_en: "Classic 4-prong solitaire diamond ring crafted in pure 950 platinum.", sizes: ["US 5", "US 6", "US 7"], colors: ["Platinum"] },
      { slug: "emerald-cut-eternity-band", name_en: "Emerald-Cut Diamond Eternity Band", name_ar: "خاتم الأبدية بالألماس المقطوع بالزمرد", category: "ring", price: 1650, old_price: 1950, image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80", stock: 11, badge: "sale", rating: 4.8, reviews: 23, description_en: "Continuous row of emerald-cut diamonds seamlessly set in an 18k gold band.", sizes: ["US 6", "US 7"], colors: ["Yellow Gold"] },
      { slug: "rose-gold-twist-ring", name_en: "Rose Gold Twist Diamond Ring", name_ar: "خاتم الذهب الوردي الملتوي بالألماس", category: "ring", price: 590, old_price: null, image: "https://images.unsplash.com/photo-1603561596112-0a132b757442?auto=format&fit=crop&w=800&q=80", stock: 18, badge: "", rating: 4.6, reviews: 17, description_en: "Dainty interwoven gold band set with shimmering diamond accents.", sizes: ["US 5", "US 6"], colors: ["Rose Gold"] },
      { slug: "emerald-heritage-bracelet", name_en: "Emerald Heritage Tennis Bracelet", name_ar: "سوار التنس التراثي بالزمرد", category: "bracelet", price: 2100, old_price: 2450, image: "https://images.unsplash.com/photo-1611591475140-7e0258169fb6?auto=format&fit=crop&w=800&q=80", stock: 5, badge: "sale", rating: 4.8, reviews: 9, description_en: "Vibrant Colombian emeralds flanked by micro-pave diamonds.", sizes: ["7 inch"], colors: ["Yellow Gold"] },
      { slug: "gold-bangle-set", name_en: "18K Gold Sculpted Bangle Set", name_ar: "طقم أساور مجدولة من الذهب عيار 18", category: "bracelet", price: 1450, old_price: 1700, image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80", stock: 10, badge: "new", rating: 4.8, reviews: 16, description_en: "Set of three interlocking 18k solid gold bangles.", sizes: ["Small", "Medium"], colors: ["Yellow Gold", "Rose Gold"] },
      { slug: "classic-4ct-tennis-bracelet", name_en: "Classic 4-Carat Diamond Tennis Bracelet", name_ar: "سوار التنس الألماسي الكلاسيكي سعة 4 قيراط", category: "bracelet", price: 2950, old_price: 3400, image: "https://images.unsplash.com/photo-1611591475140-7e0258169fb6?auto=format&fit=crop&w=800&q=80", stock: 7, badge: "bestseller", rating: 5.0, reviews: 51, description_en: "Timeless 4ct round brilliant white diamonds set in flexible 18k white gold.", sizes: ["7 inch"], colors: ["White Gold"] },
      { slug: "pearl-chain-bracelet", name_en: "Baroque Pearl Chain Bracelet", name_ar: "سوار سلسالي باللؤلؤ الباروك", category: "bracelet", price: 480, old_price: null, image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80", stock: 25, badge: "", rating: 4.7, reviews: 13, description_en: "Lustrous organic baroque pearls on a chunky 18k gold chain link.", sizes: ["7 inch"], colors: ["Yellow Gold"] },
      { slug: "tahitian-pearl-drop-earrings", name_en: "Tahitian Black Pearl Drop Earrings", name_ar: "أقراط لؤلؤ تاهيتي الأسود المتدلية", category: "earrings", price: 640, old_price: 750, image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80", stock: 12, badge: "", rating: 4.7, reviews: 19, description_en: "Rare iridescent Tahitian dark cultured pearls suspended from gold leverbacks.", sizes: ["Standard"], colors: ["Yellow Gold"] },
      { slug: "floral-diamond-cluster-studs", name_en: "Floral Diamond Cluster Studs", name_ar: "أقراط الماس عنقودية على شكل زهرة", category: "earrings", price: 890, old_price: 1050, image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80", stock: 14, badge: "bestseller", rating: 4.9, reviews: 38, description_en: "Brilliant diamond studs arranged in a blooming flower cluster motif.", sizes: ["Standard"], colors: ["White Gold"] },
      { slug: "sculpted-gold-huggie-hoops", name_en: "Sculpted Gold Huggie Hoop Earrings", name_ar: "أقراط طوقية ذهبية مصقولة", category: "earrings", price: 520, old_price: null, image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80", stock: 20, badge: "new", rating: 4.8, reviews: 11, description_en: "Sleek 18k gold huggie hoops with secure snap closure.", sizes: ["12mm"], colors: ["Yellow Gold"] },
      { slug: "chandelier-emerald-earrings", name_en: "Chandelier Emerald & Diamond Earrings", name_ar: "أقراط الثريا الفاخرة بالزمرد والماس", category: "earrings", price: 2400, old_price: 2800, image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80", stock: 3, badge: "sale", rating: 5.0, reviews: 8, description_en: "Cascading chandelier drop earrings featuring pear-shaped emeralds.", sizes: ["Standard"], colors: ["White Gold"] },
      { slug: "lastella-imperial-rose-gold-watch", name_en: "Lastella Imperial Rose Gold Watch", name_ar: "ساعة لاستيلا الإمبراطورية من الذهب الوردي", category: "watch", price: 3400, old_price: 3900, image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80", stock: 3, badge: "bestseller", rating: 5.0, reviews: 31, description_en: "Swiss automatic movement luxury timepiece with mother of pearl dial.", sizes: ["36mm"], colors: ["Rose Gold"] },
      { slug: "royale-diamond-bezel-watch", name_en: "Royale Diamond Bezel Steel Watch", name_ar: "ساعة رويال الفولاذية بمرصعة بالألماس", category: "watch", price: 2850, old_price: 3200, image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80", stock: 6, badge: "new", rating: 4.9, reviews: 21, description_en: "Polished stainless steel case framed by 44 round diamonds.", sizes: ["38mm"], colors: ["Silver"] },
      { slug: "midnight-ceramic-watch", name_en: "Midnight Ceramic Skeleton Watch", name_ar: "ساعة منتصف الليل السيراميكية الهيكلية", category: "watch", price: 4100, old_price: 4600, image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80", stock: 2, badge: "sale", rating: 5.0, reviews: 15, description_en: "High-tech matte black ceramic case with visible automatic movement gears.", sizes: ["41mm"], colors: ["Matte Black"] },
      { slug: "vintage-ruby-heart-pendant", name_en: "Vintage Diamond & Ruby Heart Pendant", name_ar: "قلادة القلب العتيقة بالألماس والياقوت", category: "pendant", price: 520, old_price: null, image: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80", stock: 20, badge: "new", rating: 4.9, reviews: 7, description_en: "Intricately carved vintage heart pendant set with crimson rubies.", sizes: ["One Size"], colors: ["Rose Gold"] },
      { slug: "arabic-calligraphy-pendant", name_en: "Custom Arabic Calligraphy Gold Medallion", name_ar: "ميدالية الذهب بالخط العربي المخصص", category: "pendant", price: 780, old_price: 920, image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80", stock: 15, badge: "bestseller", rating: 5.0, reviews: 44, description_en: "Ornate circular medallion laser-etched with intricate Arabic script.", sizes: ["Medium"], colors: ["Yellow Gold"] },
      { slug: "emerald-teardrop-pendant", name_en: "Pear-Cut Emerald Teardrop Pendant", name_ar: "قلادة قطرة الدمع بالزمرد الكمثري", category: "pendant", price: 1150, old_price: 1350, image: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80", stock: 9, badge: "sale", rating: 4.8, reviews: 18, description_en: "Deep green pear-shaped emerald drop suspended from a diamond bail.", sizes: ["One Size"], colors: ["Yellow Gold"] },
      { slug: "monaco-diamond-pave-cuff", name_en: "Monaco Diamond Pave Wide Cuff", name_ar: "سوار موناكو العريض بالألماس المرصوف", category: "bracelet", price: 3600, old_price: 4100, image: "https://images.unsplash.com/photo-1611591475140-7e0258169fb6?auto=format&fit=crop&w=800&q=80", stock: 4, badge: "bestseller", rating: 5.0, reviews: 29, description_en: "Architectural 18k gold open cuff entirely pave-set with diamonds.", sizes: ["Medium"], colors: ["Rose Gold"] },
      { slug: "infinity-diamond-pendant", name_en: "Infinity Diamond Pendant Necklace", name_ar: "قلادة الألماس الأبدية المتقاطعة", category: "necklace", price: 1390, old_price: 1600, image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80", stock: 14, badge: "new", rating: 4.9, reviews: 22, description_en: "Fluid infinity knot loop featuring gradient diamonds.", sizes: ["18 inch"], colors: ["White Gold"] },
      { slug: "art-deco-emerald-ring", name_en: "Art Deco Emerald & Baguette Diamond Ring", name_ar: "خاتم أرت ديكو الفاخر بالزمرد وألماس الباجيت", category: "ring", price: 2250, old_price: 2600, image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80", stock: 5, badge: "new", rating: 5.0, reviews: 12, description_en: "1920s vintage geometric ring design featuring step-cut emerald.", sizes: ["US 6"], colors: ["Yellow Gold"] }
    ];

    try {
      let count = 0;
      for (const item of demoItems) {
        await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...item, images: [item.image] }),
        }).catch(() => null);
        count++;
      }
      toast.success(`${count} Luxury Demo Products added to catalog!`);
      refresh();
    } catch (e) {
      toast.error("Failed to add demo products");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl">Products</h2>
          <p className="text-xs text-muted-foreground mt-1">Manage your store catalog ({rows.length} total)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={seedDemoProducts}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-xs font-semibold uppercase tracking-wider hover:bg-secondary transition-all"
          >
            + Add 25 Demo Products
          </button>
          <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold uppercase tracking-wider hover:bg-rose-deep transition-all">
            <Plus className="h-4 w-4" /> New Product
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name, slug, or category..."
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
            {filteredRows.length} {filteredRows.length === 1 ? "result" : "results"} found
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
                  <th className="text-start p-4">Product</th>
                  <th className="text-start">Category</th>
                  <th className="text-start">Price</th>
                  <th className="text-start">Stock</th>
                  <th className="text-start">Status</th>
                  <th className="text-end p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 hover:bg-secondary/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-secondary overflow-hidden shrink-0 border border-border/40">
                          {r.image && <img src={r.image} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{r.name_en}</p>
                          {r.name_ar && <p className="text-xs text-muted-foreground truncate" dir="rtl">{r.name_ar}</p>}
                          <p className="text-[11px] text-muted-foreground/70 font-mono">{r.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="capitalize">{r.category}</td>
                    <td>
                      <div className="font-medium">{formatPrice(Number(r.price))}</div>
                      {r.old_price && <div className="text-xs text-muted-foreground line-through">{formatPrice(Number(r.old_price))}</div>}
                    </td>
                    <td>{r.stock}</td>
                    <td>
                      <button onClick={() => toggleActive(r)} className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${r.active ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                        {r.active ? "Active" : "Hidden"}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditing(r)} className="p-2 rounded-lg hover:bg-secondary" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => remove(r.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-muted-foreground">
                      {search ? `No products matching "${search}"` : "No products yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(editing || creating) && (
        <ProductForm
          initial={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); refresh(); }}
        />
      )}
    </div>
  );
}

function ProductForm({ initial, onClose, onSaved }: { initial: Row | null; onClose: () => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(initial?.image ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>(initial?.images ?? []);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [nameEn, setNameEn] = useState(initial?.name_en ?? "");
  const [nameAr, setNameAr] = useState(initial?.name_ar ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [translating, setTranslating] = useState(false);

  async function translateToArabic(text: string) {
    if (!text.trim() || nameAr) return;
    // Auto-generate slug from English name
    if (!slug) {
      setSlug(text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
    setTranslating(true);
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ar`);
      const json = await res.json();
      if (json.responseStatus === 200 && json.responseData?.translatedText) {
        setNameAr(json.responseData.translatedText);
      }
    } catch (e) {
    } finally {
      setTranslating(false);
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image should be less than 5MB"); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (galleryPreviews.length + files.length > 5) { toast.error("Maximum 5 gallery images allowed"); return; }
    const newFiles = files.filter(f => {
      if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name} is too large (max 5MB)`); return false; }
      return true;
    });
    setGalleryFiles(prev => [...prev, ...newFiles]);
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => { if (ev.target?.result) setGalleryPreviews(prev => [...prev, ev.target!.result as string]); };
      reader.readAsDataURL(file);
    });
  };

  // Convert File to base64 for MongoDB storage
  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!imagePreview) { toast.error("Please upload a product image"); return; }
    setBusy(true);
    try {
      // Use base64 for main image
      let mainImageUrl = initial?.image ?? imagePreview;
      if (imageFile) {
        mainImageUrl = await fileToBase64(imageFile);
      }

      // Convert new gallery images to base64
      const existingUrls = galleryPreviews.filter(p => p.startsWith('data:') || p.startsWith('http'));
      const newGalleryBase64: string[] = [];
      for (const file of galleryFiles) {
        const b64 = await fileToBase64(file);
        newGalleryBase64.push(b64);
      }
      const allGalleryUrls = [...existingUrls.filter(p => !galleryFiles.some(f => f.name === p)), ...newGalleryBase64];

      const payload: any = {
        slug: String(fd.get("slug")).trim(),
        name_en: String(fd.get("name_en")).trim(),
        name_ar: String(fd.get("name_ar") || "").trim() || null,
        category: String(fd.get("category")),
        price: Number(fd.get("price")),
        old_price: fd.get("old_price") ? Number(fd.get("old_price")) : null,
        image: mainImageUrl,
        stock: Number(fd.get("stock") || 0),
        badge: (fd.get("badge") ? String(fd.get("badge")) : null) as string | null,
        description_en: String(fd.get("description_en") || "").trim() || null,
        active: fd.get("active") === "on",
        sizes: String(fd.get("sizes") || "").split(",").map(s => s.trim()).filter(Boolean),
        colors: String(fd.get("colors") || "").split(",").map(s => s.trim()).filter(Boolean),
        images: allGalleryUrls,
      };

      if (initial) {
        const res = await fetch("/api/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: initial.id, ...payload }),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Update failed"); }
        toast.success("Updated successfully");
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Save failed"); }
        toast.success("Created successfully");
      }
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      console.error(err);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm transition-all">
      <form onSubmit={onSubmit} className="bg-background rounded-3xl border border-border/60 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-background/80 backdrop-blur-md">
          <h3 className="font-display text-2xl bg-gradient-to-r from-primary to-rose-deep bg-clip-text text-transparent">
            {initial ? "Edit Product" : "New Product"}
          </h3>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-secondary/80 transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        
        <div className="p-6 grid sm:grid-cols-2 gap-5 overflow-y-auto">
          <Field label="Name (EN)">
            <div className="relative">
              <input
                name="name_en"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                onBlur={(e) => translateToArabic(e.target.value)}
                required
                placeholder="e.g. Rose Gold Necklace"
                className={inputCls}
              />
            </div>
          </Field>
          <Field label={translating ? "Name (AR) — Translating..." : "Name (AR) — Auto from EN"}>
            <div className="relative">
              <input
                name="name_ar"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder={translating ? "Translating..." : "Auto-translated or type manually"}
                dir="rtl"
                className={`${inputCls} ${translating ? 'opacity-50' : ''}`}
              />
              {translating && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="animate-spin h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                </div>
              )}
            </div>
          </Field>
          <Field label="Slug (Auto-generated)">
            <input
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              pattern="[a-z0-9-]+"
              placeholder="auto-filled from name"
              className={inputCls}
            />
          </Field>
          <Field label="Category">
            <select name="category" defaultValue={initial?.category ?? "necklace"} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Price (SAR)"><input name="price" type="number" step="0.01" min="0" defaultValue={initial?.price} required className={inputCls} /></Field>
          <Field label="Old Price (SAR)"><input name="old_price" type="number" step="0.01" min="0" defaultValue={initial?.old_price ?? ""} placeholder="Optional discount" className={inputCls} /></Field>
          <Field label="Stock (Quantity)"><input name="stock" type="number" min="0" defaultValue={initial?.stock ?? 0} className={inputCls} /></Field>
          <Field label="Badge (Highlight)">
            <select name="badge" defaultValue={initial?.badge ?? ""} className={inputCls}>
              {BADGES.map((b) => <option key={b} value={b}>{b || "— none —"}</option>)}
            </select>
          </Field>
          <Field label="Colors (Comma separated)"><input name="colors" defaultValue={initial?.colors?.join(", ")} placeholder="e.g. Gold, Silver" className={inputCls} /></Field>
          <Field label="Sizes (Comma separated)"><input name="sizes" defaultValue={initial?.sizes?.join(", ")} placeholder="e.g. S, M, L" className={inputCls} /></Field>
          
          <div className="sm:col-span-2 mt-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Product Image</label>
            <div className="relative border-2 border-dashed border-primary/20 rounded-2xl bg-secondary/10 hover:bg-secondary/30 transition-all group overflow-hidden">
              <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              {imagePreview ? (
                <div className="relative h-48 w-full flex items-center justify-center p-4">
                  <img src={imagePreview} alt="Preview" className="h-full w-auto object-contain rounded-lg shadow-sm" />
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 backdrop-blur-sm">
                    <p className="text-sm font-semibold flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground shadow-md">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>
                      Change Image
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1 shadow-sm group-hover:scale-110 transition-transform">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  </div>
                  <p className="text-sm font-semibold text-foreground/80">Click or drag image here</p>
                  <p className="text-xs opacity-70">PNG, JPG or WEBP (Max 2MB)</p>
                </div>
              )}
            </div>
          </div>

          <div className="sm:col-span-2 mt-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Gallery Images (Up to 5)</label>
            <div className="flex flex-wrap gap-3">
              {galleryPreviews.map((img, i) => (
                <div key={i} className="relative h-24 w-24 rounded-lg overflow-hidden border border-border group">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setGalleryPreviews(p => p.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 p-1 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-destructive"><X className="h-3 w-3" /></button>
                </div>
              ))}
              {galleryPreviews.length < 5 && (
                <label className="h-24 w-24 rounded-lg border-2 border-dashed border-primary/20 bg-secondary/10 hover:bg-secondary/30 flex items-center justify-center cursor-pointer transition-colors">
                  <input type="file" multiple accept="image/png, image/jpeg, image/webp" onChange={handleGalleryChange} className="hidden" />
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </label>
              )}
            </div>
          </div>
          
          
          <div className="sm:col-span-2"><Field label="Description (EN)"><textarea name="description_en" defaultValue={initial?.description_en ?? ""} rows={3} placeholder="Describe the product details and material..." className={inputCls} /></Field></div>
          <label className="sm:col-span-2 flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-secondary/10 cursor-pointer hover:bg-secondary/20 transition-colors">
            <input type="checkbox" name="active" defaultChecked={initial?.active ?? true} className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary" />
            <span className="text-sm font-medium">Active (visible in the shop)</span>
          </label>
        </div>
        
        <div className="p-5 border-t border-border/50 flex justify-end gap-3 bg-secondary/10 shrink-0">
          <button type="button" onClick={onClose} className="rounded-full bg-background border border-border px-6 py-2.5 text-sm font-medium hover:bg-secondary/80 transition-colors">Cancel</button>
          <button disabled={busy} className="rounded-full bg-primary text-primary-foreground px-8 py-2.5 text-sm font-semibold uppercase tracking-wider hover:bg-rose-deep shadow-md transition-all disabled:opacity-60 disabled:shadow-none flex items-center gap-2">
            {busy ? (
              <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Saving...</>
            ) : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
