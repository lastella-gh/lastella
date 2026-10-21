import "@tanstack/react-start/server-only";

import { requireAdmin } from "@/lib/server-auth.server";
import type { Enums } from "@/integrations/supabase/types";
import { sendOrderEmails } from "@/lib/order-email.server";

export type PaymentStatus =
  "awaiting_payment" | "proof_submitted" | "payment_verified" | "payment_rejected";

export type AdminOrder = {
  id: string;
  order_number: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string;
  city: string;
  postal_code: string | null;
  delivery_type: "home" | "office" | null;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: string;
  payment_method: string;
  payment_status: PaymentStatus;
  payment_proof_path: string | null;
  payment_proof_name: string | null;
  payment_proof_content_type: string | null;
  payment_proof_size: number | null;
  payment_reviewed_at: string | null;
  payment_reviewed_by: string | null;
  payment_rejection_reason: string | null;
  notes: string | null;
  created_at: string;
};

export type AdminOrderItem = {
  id: string;
  order_id: string;
  product_name: string;
  product_image: string | null;
  unit_price: number;
  quantity: number;
  size: string | null;
  color: string | null;
};

const orderColumns =
  "id, order_number, full_name, email, phone, address, city, postal_code, delivery_type, subtotal, shipping, tax, total, status, payment_method, payment_status, payment_proof_path, payment_proof_name, payment_proof_content_type, payment_proof_size, payment_reviewed_at, payment_reviewed_by, payment_rejection_reason, notes, created_at";
const allowedStatuses = new Set([
  "awaiting_payment",
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

export async function loadAdminOrders(status?: string) {
  const { supabase } = await requireAdmin();
  let query = supabase
    .from("orders")
    .select(orderColumns)
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status as Enums<"order_status">);
  const result = await query;
  const orders = result.data as AdminOrder[];
  const error = result.error;
  if (error) throw new Error(`Failed to load orders: ${error.message}`);

  const orderIds = orders.map((order) => order.id);
  if (orderIds.length === 0) return { orders, items: [] };

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("id, order_id, product_name, product_image, unit_price, quantity, size, color")
    .in("order_id", orderIds)
    .order("created_at");
  if (itemsError) throw new Error(`Failed to load order items: ${itemsError.message}`);

  return {
    orders,
    items: items as AdminOrderItem[],
  };
}

export async function getAdminPaymentProof(orderId: string) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("payment_proof_path")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load payment proof: ${error.message}`);
  const path = data?.payment_proof_path;
  if (!path) throw new Error("This order has no payment proof");

  const { data: signed, error: signedError } = await supabase.storage
    .from("payment-proofs")
    .createSignedUrl(path, 60);
  if (signedError || !signed?.signedUrl) {
    throw new Error(`Failed to create proof link: ${signedError?.message ?? "Unknown error"}`);
  }
  return { url: signed.signedUrl };
}

export async function reviewAdminPayment(
  orderId: string,
  decision: "payment_verified" | "payment_rejected",
  rejectionReason?: string,
) {
  const { supabase, userId } = await requireAdmin();
  const reason = rejectionReason?.trim() ?? "";
  if (decision === "payment_rejected" && !reason) {
    throw new Error("A rejection reason is required");
  }

  const { data: order, error: loadError } = await supabase
    .from("orders")
    .select("payment_proof_path, payment_status, payment_rejection_reason")
    .eq("id", orderId)
    .maybeSingle();
  if (loadError) throw new Error(`Failed to load order: ${loadError.message}`);
  if (!order) throw new Error("Order not found");

  const proofPath = order.payment_proof_path;
  if (!proofPath) throw new Error("This historical order has no payment proof to review");

  if (
    order.payment_status === decision &&
    (decision === "payment_verified" || order.payment_rejection_reason === reason)
  )
    return { success: true };

  const { data: updated, error } = await supabase
    .from("orders")
    .update({
      payment_status: decision,
      payment_rejection_reason: decision === "payment_rejected" ? reason : null,
      payment_reviewed_by: userId,
      payment_reviewed_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("payment_status", order.payment_status)
    .select("updated_at")
    .maybeSingle();
  if (error) throw new Error(`Failed to review payment: ${error.message}`);
  if (!updated) throw new Error("This payment has changed. Refresh the order and try again.");
  await sendOrderEmails(orderId, { event: decision, revision: updated.updated_at });
  return { success: true };
}

export async function updateAdminOrderStatus(orderId: string, status: string) {
  const { supabase } = await requireAdmin();
  if (!allowedStatuses.has(status)) throw new Error("Invalid order status");
  const { data: order, error: loadError } = await supabase
    .from("orders")
    .select("status, payment_status, payment_proof_path")
    .eq("id", orderId)
    .maybeSingle();
  if (loadError) throw new Error(`Failed to load order: ${loadError.message}`);
  if (!order) throw new Error("Order not found");

  if (order.status === status) return { success: true };

  if (
    status === "processing" &&
    order.payment_proof_path &&
    order.payment_status !== "payment_verified"
  ) {
    throw new Error("Payment must be verified before this order can be processed");
  }

  const { data: updated, error } = await supabase
    .from("orders")
    .update({ status: status as Enums<"order_status"> })
    .eq("id", orderId)
    .eq("status", order.status)
    .select("updated_at")
    .maybeSingle();
  if (error) throw new Error(`Failed to update order status: ${error.message}`);
  if (!updated) throw new Error("This order has changed. Refresh it and try again.");
  if (
    status === "processing" ||
    status === "shipped" ||
    status === "delivered" ||
    status === "cancelled"
  ) {
    await sendOrderEmails(orderId, { event: status, revision: updated.updated_at });
  }
  return { success: true };
}
