import { useQuery } from "@tanstack/react-query";
import type { Product } from "./store";

function mapProduct(d: any): Product {
  return {
    id: d.id || d._id,
    slug: d.slug,
    name: { en: d.name_en, ar: d.name_ar ?? "" },
    category: d.category,
    price: Number(d.price),
    oldPrice: d.old_price ? Number(d.old_price) : undefined,
    image: d.image,
    rating: Number(d.rating || 0),
    reviews: Number(d.reviews || 0),
    badge: d.badge || undefined,
    stock: Number(d.stock || 0),
    description: d.description_en || undefined,
    images: d.images || [],
    sizes: d.sizes || [],
    colors: d.colors || [],
  };
}

export const FALLBACK_PRODUCTS: Product[] = [
  // 1. Necklaces
  {
    id: "demo-1",
    slug: "royal-rose-gold-necklace",
    name: { en: "Royal Rose Gold Diamond Necklace", ar: "قلادة الملكية من الذهب الوردي والألماس" },
    category: "necklace",
    price: 125,
    oldPrice: 150,
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
    stock: 15,
    badge: "bestseller",
    rating: 4.9,
    reviews: 28,
    description: "Handcrafted 18k rose gold necklace encrusted with ethically sourced brilliant-cut diamonds. Perfect for regal evening attire.",
    sizes: ["16 inch", "18 inch", "20 inch"],
    colors: ["Rose Gold", "Yellow Gold", "White Gold"],
    images: ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80"]
  },
  {
    id: "demo-2",
    slug: "floating-diamond-halo-necklace",
    name: { en: "Floating Diamond Halo Necklace", ar: "قلادة الألماس العائم والبهجة" },
    category: "necklace",
    price: 189,
    oldPrice: 220,
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80",
    stock: 10,
    badge: "new",
    rating: 5.0,
    reviews: 19,
    description: "Suspended brilliant diamond surrounded by micro-pave halo set in pure 18k white gold.",
    sizes: ["16 inch", "18 inch"],
    colors: ["White Gold", "Platinum"],
    images: ["https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80"]
  },
  {
    id: "demo-3",
    slug: "celestial-gold-choker",
    name: { en: "Celestial Hammered Gold Choker", ar: "طوق الذهب المطرّق السماوي" },
    category: "necklace",
    price: 98,
    image: "https://images.unsplash.com/photo-1611591475140-7e0258169fb6?auto=format&fit=crop&w=800&q=80",
    stock: 22,
    rating: 4.7,
    reviews: 12,
    description: "Modern artisanal 18k gold choker with textured hammered finish, reflecting warm light from every angle.",
    sizes: ["14-16 inch"],
    colors: ["Yellow Gold"],
    images: ["https://images.unsplash.com/photo-1611591475140-7e0258169fb6?auto=format&fit=crop&w=800&q=80"]
  },
  {
    id: "demo-4",
    slug: "imperial-ruby-necklace",
    name: { en: "Imperial Ruby & Diamond Statement Necklace", ar: "قلادة الياقوت الإمبراطوري الفاخرة" },
    category: "necklace",
    price: 380,
    oldPrice: 430,
    image: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80",
    stock: 4,
    badge: "bestseller",
    rating: 5.0,
    reviews: 35,
    description: "Showstopping necklace featuring deep Burmese rubies surrounded by marquise and round cut diamonds.",
    sizes: ["18 inch"],
    colors: ["Rose Gold", "White Gold"],
    images: ["https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80"]
  },

  // 2. Rings
  {
    id: "demo-5",
    slug: "sapphire-elegance-ring",
    name: { en: "Royal Blue Sapphire & Diamond Ring", ar: "خاتم الياقوت الأزرق الملكي والألماس" },
    category: "ring",
    price: 85,
    oldPrice: 99,
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80",
    stock: 8,
    badge: "new",
    rating: 5.0,
    reviews: 14,
    description: "Stunning oval Ceylon blue sapphire framed by halo pave diamonds set in 18k white gold.",
    sizes: ["US 6", "US 7", "US 8"],
    colors: ["White Gold", "Platinum"],
    images: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80"]
  },
  {
    id: "demo-6",
    slug: "solitaire-platinum-ring",
    name: { en: "Solitaire Platinum Diamond Ring", ar: "خاتم سوليتير من البلاتين والماس" },
    category: "ring",
    price: 180,
    oldPrice: 210,
    image: "https://images.unsplash.com/photo-1603561596112-0a132b757442?auto=format&fit=crop&w=800&q=80",
    stock: 6,
    badge: "bestseller",
    rating: 4.9,
    reviews: 42,
    description: "Classic 4-prong solitaire diamond ring crafted in pure 950 platinum with maximum light brilliance.",
    sizes: ["US 5", "US 6", "US 7"],
    colors: ["Platinum"],
    images: ["https://images.unsplash.com/photo-1603561596112-0a132b757442?auto=format&fit=crop&w=800&q=80"]
  },
  {
    id: "demo-7",
    slug: "emerald-cut-eternity-band",
    name: { en: "Emerald-Cut Diamond Eternity Band", ar: "خاتم الأبدية بالألماس المقطوع بالزمرد" },
    category: "ring",
    price: 165,
    oldPrice: 195,
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80",
    stock: 11,
    badge: "sale",
    rating: 4.8,
    reviews: 23,
    description: "Continuous row of emerald-cut diamonds seamlessly set in an 18k gold band.",
    sizes: ["US 6", "US 7"],
    colors: ["Yellow Gold"],
    images: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80"]
  },
  {
    id: "demo-8",
    slug: "rose-gold-twist-ring",
    name: { en: "Rose Gold Twist Diamond Ring", ar: "خاتم الذهب الوردي الملتوي بالألماس" },
    category: "ring",
    price: 59,
    image: "https://images.unsplash.com/photo-1603561596112-0a132b757442?auto=format&fit=crop&w=800&q=80",
    stock: 18,
    rating: 4.6,
    reviews: 17,
    description: "Dainty interwoven gold band set with shimmering diamond accents.",
    sizes: ["US 5", "US 6"],
    colors: ["Rose Gold"],
    images: ["https://images.unsplash.com/photo-1603561596112-0a132b757442?auto=format&fit=crop&w=800&q=80"]
  },

  // 3. Bracelets
  {
    id: "demo-9",
    slug: "emerald-heritage-bracelet",
    name: { en: "Emerald Heritage Tennis Bracelet", ar: "سوار التنس التراثي بالزمرد" },
    category: "bracelet",
    price: 210,
    oldPrice: 245,
    image: "https://images.unsplash.com/photo-1611591475140-7e0258169fb6?auto=format&fit=crop&w=800&q=80",
    stock: 5,
    badge: "sale",
    rating: 4.8,
    reviews: 9,
    description: "Vibrant Colombian emeralds flanked by micro-pave diamonds on an articulated 18k gold tennis line.",
    sizes: ["7 inch"],
    colors: ["Yellow Gold"],
    images: ["https://images.unsplash.com/photo-1611591475140-7e0258169fb6?auto=format&fit=crop&w=800&q=80"]
  },
  {
    id: "demo-10",
    slug: "gold-bangle-set",
    name: { en: "18K Gold Sculpted Bangle Set", ar: "طقم أساور مجدولة من الذهب عيار 18" },
    category: "bracelet",
    price: 145,
    oldPrice: 170,
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80",
    stock: 10,
    badge: "new",
    rating: 4.8,
    reviews: 16,
    description: "Set of three interlocking 18k solid gold bangles with polished mirror finish.",
    sizes: ["Small", "Medium"],
    colors: ["Yellow Gold", "Rose Gold"],
    images: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80"]
  },
  {
    id: "demo-11",
    slug: "classic-4ct-tennis-bracelet",
    name: { en: "Classic 4-Carat Diamond Tennis Bracelet", ar: "سوار التنس الألماسي الكلاسيكي سعة 4 قيراط" },
    category: "bracelet",
    price: 295,
    oldPrice: 340,
    image: "https://images.unsplash.com/photo-1611591475140-7e0258169fb6?auto=format&fit=crop&w=800&q=80",
    stock: 7,
    badge: "bestseller",
    rating: 5.0,
    reviews: 51,
    description: "Timeless 4ct round brilliant white diamonds set in flexible 18k white gold.",
    sizes: ["7 inch"],
    colors: ["White Gold"],
    images: ["https://images.unsplash.com/photo-1611591475140-7e0258169fb6?auto=format&fit=crop&w=800&q=80"]
  },
  {
    id: "demo-12",
    slug: "pearl-chain-bracelet",
    name: { en: "Baroque Pearl Chain Bracelet", ar: "سوار سلسالي باللؤلؤ الباروك" },
    category: "bracelet",
    price: 48,
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80",
    stock: 25,
    rating: 4.7,
    reviews: 13,
    description: "Lustrous organic baroque pearls on a chunky 18k gold paperclip chain link.",
    sizes: ["7 inch"],
    colors: ["Yellow Gold"],
    images: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80"]
  },

  // 4. Earrings
  {
    id: "demo-13",
    slug: "tahitian-pearl-drop-earrings",
    name: { en: "Tahitian Black Pearl Drop Earrings", ar: "أقراط لؤلؤ تاهيتي الأسود المتدلية" },
    category: "earrings",
    price: 64,
    oldPrice: 75,
    image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80",
    stock: 12,
    rating: 4.7,
    reviews: 19,
    description: "Rare iridescent Tahitian dark cultured pearls suspended from gold leverbacks.",
    sizes: ["Standard"],
    colors: ["Yellow Gold"],
    images: ["https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80"]
  },
  {
    id: "demo-14",
    slug: "floral-diamond-cluster-studs",
    name: { en: "Floral Diamond Cluster Studs", ar: "أقراط الماس عنقودية على شكل زهرة" },
    category: "earrings",
    price: 89,
    oldPrice: 105,
    image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80",
    stock: 14,
    badge: "bestseller",
    rating: 4.9,
    reviews: 38,
    description: "Brilliant diamond studs arranged in a blooming flower cluster motif in 18k white gold.",
    sizes: ["Standard"],
    colors: ["White Gold"],
    images: ["https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80"]
  },
  {
    id: "demo-15",
    slug: "sculpted-gold-huggie-hoops",
    name: { en: "Sculpted Gold Huggie Hoop Earrings", ar: "أقراط طوقية ذهبية مصقولة" },
    category: "earrings",
    price: 52,
    image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80",
    stock: 20,
    badge: "new",
    rating: 4.8,
    reviews: 11,
    description: "Sleek 18k gold huggie hoops with secure snap closure.",
    sizes: ["12mm"],
    colors: ["Yellow Gold"],
    images: ["https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80"]
  },
  {
    id: "demo-16",
    slug: "chandelier-emerald-earrings",
    name: { en: "Chandelier Emerald & Diamond Earrings", ar: "أقراط الثريا الفاخرة بالزمرد والماس" },
    category: "earrings",
    price: 240,
    oldPrice: 280,
    image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80",
    stock: 3,
    badge: "sale",
    rating: 5.0,
    reviews: 8,
    description: "Cascading chandelier drop earrings featuring pear-shaped emeralds and diamonds.",
    sizes: ["Standard"],
    colors: ["White Gold"],
    images: ["https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80"]
  },

  // 5. Watches
  {
    id: "demo-17",
    slug: "lastella-imperial-rose-gold-watch",
    name: { en: "Lastella Imperial Rose Gold Watch", ar: "ساعة لاستيلا الإمبراطورية من الذهب الوردي" },
    category: "watch",
    price: 340,
    oldPrice: 390,
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
    stock: 3,
    badge: "bestseller",
    rating: 5.0,
    reviews: 31,
    description: "Swiss automatic movement luxury timepiece with mother of pearl dial.",
    sizes: ["36mm"],
    colors: ["Rose Gold"],
    images: ["https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80"]
  },
  {
    id: "demo-18",
    slug: "royale-diamond-bezel-watch",
    name: { en: "Royale Diamond Bezel Steel Watch", ar: "ساعة رويال الفولاذية بمرصعة بالألماس" },
    category: "watch",
    price: 285,
    oldPrice: 320,
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
    stock: 6,
    badge: "new",
    rating: 4.9,
    reviews: 21,
    description: "Polished stainless steel case framed by 44 round diamonds.",
    sizes: ["38mm"],
    colors: ["Silver"],
    images: ["https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80"]
  },
  {
    id: "demo-19",
    slug: "midnight-ceramic-watch",
    name: { en: "Midnight Ceramic Skeleton Watch", ar: "ساعة منتصف الليل السيراميكية الهيكلية" },
    category: "watch",
    price: 410,
    oldPrice: 460,
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
    stock: 2,
    badge: "sale",
    rating: 5.0,
    reviews: 15,
    description: "High-tech matte black ceramic case with visible automatic movement gears.",
    sizes: ["41mm"],
    colors: ["Matte Black"],
    images: ["https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80"]
  },

  // 6. Pendants
  {
    id: "demo-20",
    slug: "vintage-ruby-heart-pendant",
    name: { en: "Vintage Diamond & Ruby Heart Pendant", ar: "قلادة القلب العتيقة بالألماس والياقوت" },
    category: "pendant",
    price: 52,
    image: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80",
    stock: 20,
    badge: "new",
    rating: 4.9,
    reviews: 7,
    description: "Intricately carved vintage heart pendant set with crimson rubies.",
    sizes: ["One Size"],
    colors: ["Rose Gold"],
    images: ["https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80"]
  },
  {
    id: "demo-21",
    slug: "arabic-calligraphy-pendant",
    name: { en: "Custom Arabic Calligraphy Gold Medallion", ar: "ميدالية الذهب بالخط العربي المخصص" },
    category: "pendant",
    price: 78,
    oldPrice: 92,
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
    stock: 15,
    badge: "bestseller",
    rating: 5.0,
    reviews: 44,
    description: "Ornate circular medallion laser-etched with intricate Arabic script.",
    sizes: ["Medium"],
    colors: ["Yellow Gold"],
    images: ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80"]
  },
  {
    id: "demo-22",
    slug: "emerald-teardrop-pendant",
    name: { en: "Pear-Cut Emerald Teardrop Pendant", ar: "قلادة قطرة الدمع بالزمرد الكمثري" },
    category: "pendant",
    price: 115,
    oldPrice: 135,
    image: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80",
    stock: 9,
    badge: "sale",
    rating: 4.8,
    reviews: 18,
    description: "Deep green pear-shaped emerald drop suspended from a diamond bail.",
    sizes: ["One Size"],
    colors: ["Yellow Gold"],
    images: ["https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80"]
  },

  // 7. Extra Items
  {
    id: "demo-23",
    slug: "monaco-diamond-pave-cuff",
    name: { en: "Monaco Diamond Pave Wide Cuff", ar: "سوار موناكو العريض بالألماس المرصوف" },
    category: "bracelet",
    price: 360,
    oldPrice: 410,
    image: "https://images.unsplash.com/photo-1611591475140-7e0258169fb6?auto=format&fit=crop&w=800&q=80",
    stock: 4,
    badge: "bestseller",
    rating: 5.0,
    reviews: 29,
    description: "Architectural 18k gold open cuff entirely pave-set with diamonds.",
    sizes: ["Medium"],
    colors: ["Rose Gold"],
    images: ["https://images.unsplash.com/photo-1611591475140-7e0258169fb6?auto=format&fit=crop&w=800&q=80"]
  },
  {
    id: "demo-24",
    slug: "infinity-diamond-pendant",
    name: { en: "Infinity Diamond Pendant Necklace", ar: "قلادة الألماس الأبدية المتقاطعة" },
    category: "necklace",
    price: 139,
    oldPrice: 160,
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
    stock: 14,
    badge: "new",
    rating: 4.9,
    reviews: 22,
    description: "Fluid infinity knot loop featuring gradient diamonds.",
    sizes: ["18 inch"],
    colors: ["White Gold"],
    images: ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80"]
  },
  {
    id: "demo-25",
    slug: "art-deco-emerald-ring",
    name: { en: "Art Deco Emerald & Baguette Diamond Ring", ar: "خاتم أرت ديكو الفاخر بالزمرد وألماس الباجيت" },
    category: "ring",
    price: 225,
    oldPrice: 260,
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80",
    stock: 5,
    badge: "new",
    rating: 5.0,
    reviews: 12,
    description: "1920s vintage geometric ring design featuring step-cut emerald.",
    sizes: ["US 6"],
    colors: ["Yellow Gold"],
    images: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80"]
  }
];

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        const url = typeof window !== "undefined" 
          ? "/api/products" 
          : `https://${process.env.VERCEL_URL || "localhost:3000"}/api/products`;
        
        const res = await fetch(url).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            return data.map(mapProduct) as Product[];
          }
        }
        return FALLBACK_PRODUCTS;
      } catch (e) {
        console.error("Error fetching products, using fallback:", e);
        return FALLBACK_PRODUCTS;
      }
    },
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      try {
        const url = typeof window !== "undefined"
          ? `/api/products?slug=${encodeURIComponent(slug)}`
          : `https://${process.env.VERCEL_URL || "localhost:3000"}/api/products?slug=${encodeURIComponent(slug)}`;
        
        const res = await fetch(url).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          const product = Array.isArray(data) ? data[0] : data;
          if (product) return mapProduct(product) as Product & { description?: string };
        }
        
        // Check fallback products if API product not found
        const fallback = FALLBACK_PRODUCTS.find((p) => p.slug === slug);
        return fallback || null;
      } catch (e) {
        console.error("Error fetching product:", e);
        const fallback = FALLBACK_PRODUCTS.find((p) => p.slug === slug);
        return fallback || null;
      }
    },
    enabled: !!slug,
    retry: 1,
  });
}
