import { readFile, readdir } from "node:fs/promises";
import { extname, resolve } from "node:path";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !secretKey) throw new Error("Missing Supabase environment variables");

const brands = [
  ["aigner", "Aigner"],
  ["apm-monaco", "APM Monaco"],
  ["bvlgari", "Bvlgari"],
  ["cartier", "Cartier"],
  ["chanel", "Chanel"],
  ["dior", "Dior"],
  ["hermes", "Hermès"],
  ["louis-vuitton", "Louis Vuitton"],
  ["messika", "Messika"],
  ["swarovski", "Swarovski"],
  ["valentino", "Valentino"],
  ["van-cleef-and-arpels", "Van Cleef & Arpels"],
];
const brandBySlug = new Map(brands.map((brand) => [brand[0], brand]));
const boxDirectory = resolve("boxes");
const files = (await readdir(boxDirectory)).filter((file) => extname(file) === ".jpeg").sort();
const photos = [];

for (const filename of files) {
  const match = filename.match(/^(.+)-(ring|general)-box-(\d+)\.jpeg$/);
  if (!match) throw new Error(`Unexpected box filename: ${filename}`);
  const [, brandSlug, boxType, photoNumber] = match;
  if (!brandBySlug.has(brandSlug)) throw new Error(`Unknown brand in ${filename}`);
  const kind = `${boxType}_box`;
  const objectPath = `boxes/${brandSlug}/${kind}/${filename}`;
  const upload = await fetch(
    `${supabaseUrl}/storage/v1/object/product-images/${encodeURI(objectPath)}`,
    {
      method: "POST",
      headers: {
        apikey: secretKey,
        "Content-Type": "image/jpeg",
        "x-upsert": "true",
      },
      body: await readFile(resolve(boxDirectory, filename)),
    },
  );
  if (!upload.ok)
    throw new Error(`Upload failed for ${filename}: ${upload.status} ${await upload.text()}`);
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${objectPath}`;
  photos.push({ brandSlug, boxType, photoNumber, publicUrl });
}

const brandResponse = await fetch(`${supabaseUrl}/rest/v1/brands?select=id,slug,name`, {
  headers: { apikey: secretKey },
});
if (!brandResponse.ok) throw new Error(`Unable to load brands: ${await brandResponse.text()}`);
const brandRows = await brandResponse.json();
const brandIds = new Map(brandRows.map((brand) => [brand.slug, brand.id]));

const productResponse = await fetch(
  `${supabaseUrl}/rest/v1/products?select=*&kind=eq.general_box`,
  { headers: { apikey: secretKey } },
);
if (!productResponse.ok)
  throw new Error(`Unable to load existing boxes: ${await productResponse.text()}`);
const existingBySlug = new Map(
  (await productResponse.json()).map((product) => [product.slug, product]),
);

const products = photos.map(({ brandSlug, boxType, photoNumber, publicUrl }) => {
  const [, brandName] = brandBySlug.get(brandSlug);
  // Keep established URLs for the first photo; additional photos get their own products.
  const originalSlug = `${brandSlug}-${boxType}-box`;
  const isFirstPhoto = Number(photoNumber) === 1;
  const slug = isFirstPhoto ? originalSlug : `${originalSlug}-${photoNumber}`;
  const existing = existingBySlug.get(slug);
  const original = existingBySlug.get(originalSlug);
  const savedFields = Object.fromEntries(
    Object.entries(existing ?? {}).filter(
      ([key]) => !["id", "created_at", "updated_at"].includes(key),
    ),
  );
  const nameSuffix = isFirstPhoto ? "" : ` ${photoNumber}`;
  const brandId = brandIds.get(brandSlug);
  if (!brandId) throw new Error(`Missing brand: ${brandSlug}`);
  return {
    slug,
    name_en: `${brandName} Jewelery Box${nameSuffix}`,
    name_ar: `${brandName} - صندوق مجوهرات${nameSuffix}`,
    description_en: `${brandName} branded jewelry packaging set.`,
    description_ar: null,
    category: null,
    kind: "general_box",
    brand_id: brandId,
    price: original?.price ?? 1.1,
    old_price: null,
    badge: null,
    display_color: null,
    rating: 0,
    reviews: 0,
    is_best_seller: false,
    is_new_arrival: false,
    available: original?.available ?? true,
    visible: original?.visible ?? true,
    active: false,
    stock: 0,
    sizes: [],
    colors: [],
    // Re-running the seed must preserve admin edits, including price and availability.
    ...savedFields,
    image: publicUrl,
    images: [publicUrl],
  };
});

const seed = await fetch(`${supabaseUrl}/rest/v1/products?on_conflict=slug`, {
  method: "POST",
  headers: {
    apikey: secretKey,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=representation",
  },
  body: JSON.stringify(products),
});
if (!seed.ok) throw new Error(`Product seed failed: ${seed.status} ${await seed.text()}`);
const seeded = await seed.json();
console.log(`Uploaded ${files.length} images and seeded ${seeded.length} box products.`);
