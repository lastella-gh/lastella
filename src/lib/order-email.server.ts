import "@tanstack/react-start/server-only";

import type { CheckoutInput } from "@/lib/checkout";
import type { CheckoutOrder } from "@/lib/checkout.server";

const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char,
  );

export async function sendOrderEmails({
  order,
  input,
  items,
}: {
  order: CheckoutOrder;
  input: CheckoutInput;
  items: { name: string; quantity: number; unitPrice: number }[];
}) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM;
  const admins =
    process.env.ORDER_ADMIN_EMAILS?.split(",")
      .map((email) => email.trim())
      .filter(Boolean) ?? [];
  if (!key || !from) return;
  const html = `<h1>Lastella order ${escapeHtml(order.order_number)}</h1><p>Thank you, ${escapeHtml(input.fullName)}.</p><p>Total: OMR ${escapeHtml(order.total.toFixed(3))}</p><p>Payment proof received and awaiting review.</p><ul>${items.map((item) => `<li>${escapeHtml(item.name)} × ${item.quantity} · OMR ${escapeHtml(item.unitPrice.toFixed(3))}</li>`).join("")}</ul>`;
  const send = async (to: string | string[], subject: string) => {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
  };
  const deliveries = [
    send(input.email, `Lastella order ${order.order_number}`),
    ...(admins.length ? [send(admins, `New Lastella order ${order.order_number}`)] : []),
  ];
  const results = await Promise.allSettled(deliveries);
  if (results.some((result) => result.status === "rejected")) {
    console.error(`One or more order emails failed for order ${order.id}`);
  }
}
