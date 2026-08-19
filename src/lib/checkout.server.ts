import "@tanstack/react-start/server-only";

import { getRequestHeader } from "@tanstack/react-start/server";
import { getSupabaseServerClient } from "@/integrations/supabase/server-client.server";
import { deliveryFeeBaisa, fromBaisa, toBaisa, type CheckoutInput } from "@/lib/checkout";

type Product = {
  id: string;
  name_en: string;
  image: string;
  price: number;
  visible: boolean;
  available: boolean;
  variants: { id: string; size: string | null; color: string | null; available: boolean }[];
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
    .select(
      "id, name_en, image, price, visible, available, variants:product_variants(id, size, color, available)",
    )
    .in("id", productIds);
  if (error) throw new Error(`Unable to load products: ${error.message}`);
  if (data.length !== productIds.length) throw new Error("One or more products are unavailable");

  const products = new Map(data.map((product) => [product.id, product as Product]));
  let subtotalBaisa = 0;

  for (const [productId, quantity] of quantities) {
    const product = products.get(productId);
    if (!product?.visible || !product.available) {
      throw new Error(`Product is unavailable: ${product?.name_en ?? productId}`);
    }
    if (quantity > 100) throw new Error(`Invalid quantity for ${product.name_en}`);
    subtotalBaisa += toBaisa(product.price) * quantity;
  }

  const commitItems = validateAndBuildItems(input, products);
  const shippingBaisa = deliveryFeeBaisa(input.deliveryType);
  const totalBaisa = subtotalBaisa + shippingBaisa;

  const { data: order, error: commitError } = await supabase
    .rpc("commit_checkout_order_v2", {
      // Generated RPC argument types do not represent nullable PostgreSQL parameters.
      p_user_id: userId as string,
      p_email: input.email.toLowerCase(),
      p_full_name: input.fullName,
      p_phone: input.phone,
      p_address: input.address,
      p_city: input.city,
      p_postal_code: input.postalCode,
      p_country: input.country,
      p_delivery_type: input.deliveryType,
      p_notes: input.notes,
      p_subtotal: fromBaisa(subtotalBaisa),
      p_shipping: fromBaisa(shippingBaisa),
      p_total: fromBaisa(totalBaisa),
      p_items: commitItems,
    })
    .single();
  if (commitError) throw new Error(commitError.message);

  return order;
}

function validateAndBuildItems(input: CheckoutInput, products: Map<string, Product>) {
  const items = new Map<
    string,
    { product_id: string; variant_id: string | null; quantity: number; unit_price: number }
  >();

  for (const item of input.items) {
    const product = products.get(item.productId);
    if (!product) throw new Error("Product is unavailable");
    if (product.variants.length > 0) {
      const variant = product.variants.find(
        (candidate) =>
          candidate.id === item.variantId ||
          (!item.variantId && candidate.size === item.size && candidate.color === item.color),
      );
      if (!variant?.available) throw new Error(`Product option is unavailable: ${product.name_en}`);
    } else if (item.variantId) {
      throw new Error(`Invalid product option: ${product.name_en}`);
    }

    const resolvedVariantId =
      product.variants.length > 0
        ? (product.variants.find(
            (candidate) =>
              candidate.id === item.variantId ||
              (!item.variantId && candidate.size === item.size && candidate.color === item.color),
          )?.id ?? null)
        : null;
    const key = `${item.productId}\u0000${resolvedVariantId ?? ""}`;
    const existing = items.get(key);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      items.set(key, {
        product_id: item.productId,
        variant_id: resolvedVariantId,
        quantity: item.quantity,
        unit_price: product.price,
      });
    }
  }

  return [...items.values()];
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
