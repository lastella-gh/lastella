import "@tanstack/react-start/server-only";

import { getRequestHeader } from "@tanstack/react-start/server";
import { getSupabaseServerClient } from "@/integrations/supabase/server-client.server";
import { deliveryFeeBaisa, fromBaisa, toBaisa, type CheckoutInput } from "@/lib/checkout";
import { sendOrderEmails } from "@/lib/order-email.server";
import { deriveReceiptToken, hashToken, verifyPaymentProof } from "@/lib/payment-proof.server";

type Product = {
  id: string;
  name_en: string;
  image: string;
  price: number;
  visible: boolean;
  available: boolean;
  variants: { id: string; size: string | null; color: string | null; available: boolean }[];
};

export async function createCheckoutOrder(
  input: CheckoutInput,
  payment: { intentId: string; claimToken: string },
) {
  const supabase = getSupabaseServerClient();
  const userId = await getAuthenticatedUserId(supabase);
  await verifyPaymentProof(payment.intentId, payment.claimToken);
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
  if (error || data.length !== productIds.length)
    throw new Error("One or more products are unavailable");

  const products = new Map(data.map((product) => [product.id, product as Product]));
  let subtotalBaisa = 0;
  for (const [productId, quantity] of quantities) {
    const product = products.get(productId);
    if (!product?.visible || !product.available)
      throw new Error("One or more products are unavailable");
    if (quantity > 100) throw new Error("Invalid product quantity");
    subtotalBaisa += toBaisa(product.price) * quantity;
  }
  const commitItems = validateAndBuildItems(input, products);
  const shippingBaisa = deliveryFeeBaisa(input.deliveryType);
  const receiptToken = await deriveReceiptToken(payment.claimToken);
  const { data: order, error: commitError } = await supabase
    .rpc("commit_checkout_order_v3", {
      // Generated RPC types do not represent nullable PostgreSQL parameters.
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
      p_total: fromBaisa(subtotalBaisa + shippingBaisa),
      p_items: commitItems,
      p_payment_intent_id: payment.intentId,
      p_payment_claim_hash: await hashToken(payment.claimToken),
      p_success_token_hash: await hashToken(receiptToken),
    })
    .single();
  if (commitError || !order) throw new Error("We could not place your order. Please try again.");

  await sendOrderEmails({
    order,
    input,
    items: commitItems.map((item) => ({
      name: products.get(item.product_id)?.name_en ?? "Product",
      quantity: item.quantity,
      unitPrice: item.unit_price,
    })),
  });
  return { ...order, successToken: receiptToken };
}

export type CheckoutOrder = {
  id: string;
  order_number: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
};

function validateAndBuildItems(input: CheckoutInput, products: Map<string, Product>) {
  const items = new Map<
    string,
    { product_id: string; variant_id: string | null; quantity: number; unit_price: number }
  >();
  for (const item of input.items) {
    const product = products.get(item.productId);
    if (!product) throw new Error("One or more products are unavailable");
    const variant = product.variants.find((candidate) => candidate.id === item.variantId);
    if (product.variants.length > 0 && !variant?.available)
      throw new Error("Product option is unavailable");
    if (product.variants.length === 0 && item.variantId) throw new Error("Invalid product option");
    const variantId = variant?.id ?? null;
    const key = `${item.productId}\u0000${variantId ?? ""}`;
    const existing = items.get(key);
    if (existing) existing.quantity += item.quantity;
    else
      items.set(key, {
        product_id: item.productId,
        variant_id: variantId,
        quantity: item.quantity,
        unit_price: product.price,
      });
  }
  return [...items.values()];
}

async function getAuthenticatedUserId(supabase: ReturnType<typeof getSupabaseServerClient>) {
  const authorization = getRequestHeader("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const { data, error } = await supabase.auth.getClaims(authorization.slice(7));
  if (error || !data?.claims.sub) throw new Error("Invalid authentication session");
  return data.claims.sub;
}
