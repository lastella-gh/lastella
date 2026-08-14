import { MongoClient } from "mongodb";

const MONGODB_URI = "mongodb+srv://ikoteksolutions_db_user:xqO0gg9dM5cpIoL0@cluster0.fbfpsbf.mongodb.net/?retryWrites=true&w=majority";
const DB_NAME = "lastella";

const sampleProducts = [
  {
    slug: "royal-rose-gold-necklace",
    name_en: "Royal Rose Gold Diamond Necklace",
    name_ar: "قلادة الملكية من الذهب الوردي والألماس",
    category: "necklace",
    price: 1250,
    old_price: 1500,
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
    stock: 15,
    active: true,
    badge: "bestseller",
    rating: 4.9,
    reviews: 28,
    description_en: "Handcrafted 18k rose gold necklace encrusted with ethically sourced brilliant-cut diamonds. Perfect for regal evening attire.",
    sizes: ["16 inch", "18 inch", "20 inch"],
    colors: ["Rose Gold", "Yellow Gold", "White Gold"],
    images: [
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80"
    ],
    createdAt: new Date()
  },
  {
    slug: "sapphire-elegance-ring",
    name_en: "Royal Blue Sapphire & Diamond Ring",
    name_ar: "خاتم الياقوت الأزرق الملكي والألماس",
    category: "ring",
    price: 850,
    old_price: 990,
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80",
    stock: 8,
    active: true,
    badge: "new",
    rating: 5.0,
    reviews: 14,
    description_en: "Stunning oval Ceylon blue sapphire framed by halo pave diamonds set in 18k white gold.",
    sizes: ["US 6", "US 7", "US 8"],
    colors: ["White Gold", "Platinum"],
    images: [
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80"
    ],
    createdAt: new Date()
  },
  {
    slug: "emerald-heritage-bracelet",
    name_en: "Emerald Heritage Tennis Bracelet",
    name_ar: "سوار التنس التراثي بالزمرد",
    category: "bracelet",
    price: 2100,
    old_price: 2450,
    image: "https://images.unsplash.com/photo-1611591475140-7e0258169fb6?auto=format&fit=crop&w=800&q=80",
    stock: 5,
    active: true,
    badge: "sale",
    rating: 4.8,
    reviews: 9,
    description_en: "Vibrant Colombian emeralds flanked by micro-pave diamonds on an articulated 18k gold tennis line.",
    sizes: ["7 inch", "7.5 inch"],
    colors: ["Yellow Gold"],
    images: [
      "https://images.unsplash.com/photo-1611591475140-7e0258169fb6?auto=format&fit=crop&w=800&q=80"
    ],
    createdAt: new Date()
  },
  {
    slug: "pearl-drop-earrings",
    name_en: "Tahitian Black Pearl Drop Earrings",
    name_ar: "أقراط لؤلؤ تاهيتي الأسود المتدلية",
    category: "earrings",
    price: 640,
    old_price: 750,
    image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80",
    stock: 12,
    active: true,
    badge: "",
    rating: 4.7,
    reviews: 19,
    description_en: "Rare iridescent Tahitian dark cultured pearls suspended from diamond-adorned gold leverbacks.",
    sizes: ["Standard"],
    colors: ["Yellow Gold", "White Gold"],
    images: [
      "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80"
    ],
    createdAt: new Date()
  },
  {
    slug: "chopard-inspired-luxury-watch",
    name_en: "Lastella Imperial Rose Gold Watch",
    name_ar: "ساعة لاستيلا الإمبراطورية من الذهب الوردي",
    category: "watch",
    price: 3400,
    old_price: 3900,
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
    stock: 3,
    active: true,
    badge: "bestseller",
    rating: 5.0,
    reviews: 31,
    description_en: "Swiss automatic movement luxury timepiece featuring mother of pearl dial and genuine alligator leather strap.",
    sizes: ["36mm", "40mm"],
    colors: ["Rose Gold / Rose", "Silver / White"],
    images: [
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80"
    ],
    createdAt: new Date()
  },
  {
    slug: "vintage-pendant-locket",
    name_en: "Vintage Diamond & Ruby Heart Pendant",
    name_ar: "قلادة القلب العتيقة بالألماس والياقوت",
    category: "pendant",
    price: 520,
    old_price: null,
    image: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80",
    stock: 20,
    active: true,
    badge: "new",
    rating: 4.9,
    reviews: 7,
    description_en: "Intricately carved vintage heart pendant set with natural crimson rubies and accent round diamonds.",
    sizes: ["One Size"],
    colors: ["Rose Gold", "Yellow Gold"],
    images: [
      "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80"
    ],
    createdAt: new Date()
  },
  {
    slug: "solitaire-diamond-engagement-ring",
    name_en: "Solitaire Platinum Diamond Ring",
    name_ar: "خاتم ألماتي من البلاتين والماس",
    category: "ring",
    price: 1800,
    old_price: 2100,
    image: "https://images.unsplash.com/photo-1603561596112-0a132b757442?auto=format&fit=crop&w=800&q=80",
    stock: 6,
    active: true,
    badge: "bestseller",
    rating: 4.9,
    reviews: 42,
    description_en: "Classic 4-prong solitaire diamond ring crafted in pure 950 platinum with maximum light brilliance.",
    sizes: ["US 5", "US 6", "US 7"],
    colors: ["Platinum", "White Gold"],
    images: [
      "https://images.unsplash.com/photo-1603561596112-0a132b757442?auto=format&fit=crop&w=800&q=80"
    ],
    createdAt: new Date()
  },
  {
    slug: "luxury-gold-bangle-set",
    name_en: "18K Gold Sculpted Bangle Set",
    name_ar: "طقم أساور مجدولة من الذهب عيار 18",
    category: "bracelet",
    price: 1450,
    old_price: 1700,
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80",
    stock: 10,
    active: true,
    badge: "new",
    rating: 4.8,
    reviews: 16,
    description_en: "Set of three interlocking 18k solid gold bangles with polished mirror finish.",
    sizes: ["Small", "Medium", "Large"],
    colors: ["Yellow Gold", "Rose Gold"],
    images: [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80"
    ],
    createdAt: new Date()
  }
];

async function run() {
  const client = new MongoClient(MONGODB_URI, {
    tlsInsecure: true,
    serverSelectionTimeoutMS: 5000,
  });
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas!");
    const db = client.db(DB_NAME);
    
    // Clear old collections completely
    await db.collection("products").deleteMany({});
    await db.collection("orders").deleteMany({});
    await db.collection("order_items").deleteMany({});
    console.log("Cleared old products, orders, and order items.");

    const res = await db.collection("products").insertMany(sampleProducts);
    console.log(`SUCCESS: Cleaned database & inserted ${res.insertedCount} fresh demo products!`);
  } catch (e) {
    console.error("Error resetting database:", e);
  } finally {
    await client.close();
  }
}

run();
