import "@tanstack/react-start/server-only";

import { getRequestHeader } from "@tanstack/react-start/server";
import { getSupabaseServerClient } from "@/integrations/supabase/server-client.server";
import {
  FREE_SHIPPING_THRESHOLD_BAISA,
  SHIPPING_BAISA,
  VAT_RATE,
  fromBaisa,
  toBaisa,
  type CheckoutInput,
} from "@/lib/checkout";

type Product = {
  id: string;
  name_en: string;
  image: string;
  price: number;
  stock: number;
  active: boolean;
  sizes: string[];
  colors: string[];
};

export async function createCheckoutOrder(input: CheckoutInput) {
  const supabase = getSupabaseServerClient();
  const userId = await getAuthenticatedUserId(supabase);
  const quantities = new Map<string, number>();

  for (const item of input.items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }

  const productIds = [...quantities.keys()];
  const { data, error } = await supabase
    .from("products")
    .select("id, name_en, image, price, stock, active, sizes, colors")
    .in("id", productIds);
  if (error) throw new Error(`Unable to load products: ${error.message}`);
  if (data.length !== productIds.length) throw new Error("One or more products are unavailable");

  const products = new Map(data.map((product) => [product.id, product as Product]));
  let subtotalBaisa = 0;

  for (const [productId, quantity] of quantities) {
    const product = products.get(productId);
    if (!product?.active) throw new Error("One or more products are unavailable");
    if (quantity > 100 || quantity > product.stock) {
      throw new Error(`Insufficient stock for ${product.name_en}`);
    }
    subtotalBaisa += toBaisa(product.price) * quantity;
  }

  const commitItems = aggregateVariants(input, products);
  const shippingBaisa = subtotalBaisa > FREE_SHIPPING_THRESHOLD_BAISA ? 0 : SHIPPING_BAISA;
  const taxBaisa = Math.round(subtotalBaisa * VAT_RATE);
  const totalBaisa = subtotalBaisa + shippingBaisa + taxBaisa;

  const { data: order, error: commitError } = await supabase
    .rpc("commit_checkout_order", {
      // Generated RPC argument types do not represent nullable PostgreSQL parameters.
      p_user_id: userId as string,
      p_email: input.email.toLowerCase(),
      p_full_name: input.fullName,
      p_phone: input.phone,
      p_address: input.address,
      p_city: input.city,
      p_postal_code: input.postalCode,
      p_country: input.country,
      p_payment_method: input.paymentMethod,
      p_notes: input.notes,
      p_need_gift_box: input.needGiftBox,
      p_subtotal: fromBaisa(subtotalBaisa),
      p_shipping: fromBaisa(shippingBaisa),
      p_tax: fromBaisa(taxBaisa),
      p_total: fromBaisa(totalBaisa),
      p_items: commitItems,
    })
    .single();
  if (commitError) throw new Error(commitError.message);

  return order;
}

function aggregateVariants(input: CheckoutInput, products: Map<string, Product>) {
  const variants = new Map<
    string,
    {
      product_id: string;
      quantity: number;
      size: string | null;
      color: string | null;
      unit_price: number;
    }
  >();

  for (const item of input.items) {
    const product = products.get(item.productId);
    if (!product) throw new Error("Product is unavailable");
    validateVariant(product, item.size, item.color);

    const key = `${item.productId}\u0000${item.size ?? ""}\u0000${item.color ?? ""}`;
    const existing = variants.get(key);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      variants.set(key, {
        product_id: item.productId,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        unit_price: product.price,
      });
    }
  }

  return [...variants.values()];
}

function validateVariant(product: Product, size: string | null, color: string | null) {
  if (product.sizes.length > 0 && (!size || !product.sizes.includes(size))) {
    throw new Error(`Invalid size for ${product.name_en}`);
  }
  if (product.colors.length > 0 && (!color || !product.colors.includes(color))) {
    throw new Error(`Invalid color for ${product.name_en}`);
  }
}

async function getAuthenticatedUserId(
  supabase: ReturnType<typeof getSupabaseServerClient>,
): Promise<string | null> {
  const authorization = getRequestHeader("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice("Bearer ".length);
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims.sub) throw new Error("Invalid authentication session");
  return data.claims.sub;
}
