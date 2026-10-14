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
const grouped = new Map();

for (const filename of files) {
  const match = filename.match(/^(.+)-(ring|general)-box-\d+\.jpeg$/);
  if (!match) throw new Error(`Unexpected box filename: ${filename}`);
  const [, brandSlug, boxType] = match;
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
  const key = `${brandSlug}:${kind}`;
  grouped.set(key, [...(grouped.get(key) ?? []), publicUrl]);
}

const brandResponse = await fetch(`${supabaseUrl}/rest/v1/brands?select=id,slug,name`, {
  headers: { apikey: secretKey },
});
if (!brandResponse.ok) throw new Error(`Unable to load brands: ${await brandResponse.text()}`);
const brandRows = await brandResponse.json();
const brandIds = new Map(brandRows.map((brand) => [brand.slug, brand.id]));

const products = [...grouped].map(([key, images]) => {
  const [brandSlug, kind] = key.split(":");
  const [, brandName] = brandBySlug.get(brandSlug);
  const isRing = kind === "ring_box";
  return {
    slug: `${brandSlug}-${isRing ? "ring-box" : "general-box"}`,
    name_en: `${brandName} ${isRing ? "Ring Box" : "General Gift Box"}`,
    name_ar: null,
    description_en: `${brandName} branded ${isRing ? "ring" : "general jewelry"} packaging set.`,
    category: null,
    kind,
    brand_id: brandIds.get(brandSlug),
    price: 1.1,
    old_price: null,
    image: images[0],
    images,
    badge: null,
    available: true,
    visible: true,
    active: false,
    stock: 0,
    sizes: [],
    colors: [],
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
