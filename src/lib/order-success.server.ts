import "@tanstack/react-start/server-only";

import { getSupabaseServerClient } from "@/integrations/supabase/server-client.server";
import { hashToken } from "@/lib/payment-proof.server";

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  created_at: string;
  delivery_type: string;
  total: number;
  phone: string | null;
};
export type OrderSuccessDto = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  date: string;
  deliveryType: string;
  total: number;
  phone: string | null;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    size: string | null;
    color: string | null;
  }[];
};

export async function getOrderSuccess(token: string): Promise<OrderSuccessDto> {
  const supabase = getSupabaseServerClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_status, created_at, delivery_type, total, phone")
    .eq("success_token_hash", await hashToken(token))
    .single();
  const orderRow = order as OrderRow | null;
  if (error || !orderRow) throw new Error("Order not found");
  const { data: items } = await supabase
    .from("order_items")
    .select("product_name, quantity, unit_price, size, color")
    .eq("order_id", orderRow.id);
  const itemRows = Array.isArray(items) ? (items as Record<string, unknown>[]) : [];
  return {
    orderNumber: orderRow.order_number,
    status: orderRow.status,
    paymentStatus: orderRow.payment_status,
    date: orderRow.created_at,
    deliveryType: orderRow.delivery_type,
    total: orderRow.total,
    phone: maskPhone(orderRow.phone as string | null),
    items: itemRows.map((item) => ({
      name: String(item.product_name),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      size: item.size == null ? null : String(item.size),
      color: item.color == null ? null : String(item.color),
    })),
  };
}

function maskPhone(phone: string | null) {
  if (!phone) return null;
  return `${"*".repeat(Math.max(phone.length - 3, 0))}${phone.slice(-3)}`;
}
