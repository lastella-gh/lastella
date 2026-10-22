import type { Tables } from "@/integrations/supabase/types";
import { productImageUrl } from "@/lib/product-images";

export type EmailOrder = Pick<
  Tables<"orders">,
  | "id"
  | "order_number"
  | "full_name"
  | "phone"
  | "address"
  | "city"
  | "country"
  | "delivery_type"
  | "subtotal"
  | "shipping"
  | "tax"
  | "total"
  | "payment_status"
  | "notes"
  | "created_at"
  | "updated_at"
>;
export type EmailOrderItem = Pick<
  Tables<"order_items">,
  "product_name" | "product_image" | "quantity" | "unit_price" | "size" | "color"
>;

const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char,
  );
const money = (amount: number) => `OMR ${Number(amount).toFixed(3)}`;

export function emailUrl(value: string | undefined | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

export function renderNewOrderAdminEmail({
  order,
  items,
  siteUrl,
}: {
  order: EmailOrder;
  items: EmailOrderItem[];
  siteUrl?: string;
}) {
  const proofReceived = order.payment_status === "proof_submitted";
  const copy = {
    title: "A new order has arrived",
    message: proofReceived
      ? "A customer has placed an order and submitted bank transfer proof. Open the admin panel to review the payment."
      : "A customer has placed an order. Review the order and payment in the admin panel.",
    label: "New order",
  };
  const base = emailUrl(siteUrl);
  const logo = base ? new URL("/email/lastella-logo.png", base).href : null;
  const actionUrl = base && new URL("/admin/orders", base).href;
  const actionLabel = "Review order";
  const delivery =
    order.delivery_type === "office"
      ? "Office Delivery"
      : order.delivery_type === "home"
        ? "Home Delivery"
        : "Delivery";
  const address = [order.address, order.city, order.country].filter(Boolean).join(", ");
  const date = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Muscat",
  }).format(new Date(order.created_at));
  const subject = `${copy.label} · ${order.order_number} | Lastella`;
  const rows = items
    .map((item) => {
      const originalImage = emailUrl(item.product_image);
      const image =
        originalImage && base
          ? new URL(productImageUrl(originalImage, 128), base).href
          : originalImage;
      const options = [item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`]
        .filter(Boolean)
        .join(" · ");
      return `<tr><td style="padding:18px 0;border-bottom:1px solid #eee5e9;vertical-align:top;width:76px">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(item.product_name)}" width="64" height="72" style="display:block;width:64px;height:72px;object-fit:cover;border-radius:10px;background:#faf2f5" />` : `<div style="width:64px;height:72px;border-radius:10px;background:#faf2f5"></div>`}</td><td style="padding:18px 12px 18px 0;border-bottom:1px solid #eee5e9;vertical-align:top;overflow-wrap:anywhere"><p style="margin:0 0 7px;font-size:15px;font-weight:600">${escapeHtml(item.product_name)}</p>${options ? `<p style="margin:0 0 7px;color:#75616b;font-size:12px">${escapeHtml(options)}</p>` : ""}<p style="margin:0;color:#75616b;font-size:12px">Qty ${item.quantity} · ${money(item.unit_price)} each</p></td><td style="padding:18px 0;border-bottom:1px solid #eee5e9;vertical-align:top;text-align:right;white-space:nowrap;font-size:13px;font-weight:600">${money((Math.round(item.unit_price * 1000) * item.quantity) / 1000)}</td></tr>`;
    })
    .join("");
  const totalRow = (label: string, amount: number) =>
    `<tr><td style="padding:6px 0;color:#75616b">${label}</td><td style="padding:6px 0;text-align:right;white-space:nowrap">${money(amount)}</td></tr>`;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><meta name="color-scheme" content="light" /><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#fbf5f7;color:#382b32;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;word-wrap:break-word;overflow-wrap:anywhere">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${escapeHtml(copy.label)}. Order ${escapeHtml(order.order_number)} · ${money(order.total)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf5f7"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;table-layout:fixed;background:#fff;border:1px solid #eee0e6;border-radius:18px;overflow:hidden">
<tr><td align="center" style="padding:28px 24px;border-top:5px solid #ef91b4;border-bottom:1px solid #f3e8ed">${logo ? `<img src="${escapeHtml(logo)}" width="190" alt="Lastella — Big Brand Small Price" style="display:block;width:190px;max-width:100%;height:auto" />` : `<p style="margin:0;color:#d66b96;font-family:Georgia,serif;font-size:42px">Lastella</p><p style="margin:4px 0 0;color:#75616b;font-size:10px;letter-spacing:2px">BIG BRAND SMALL PRICE</p>`}</td></tr>
<tr><td style="padding:28px 24px 12px"><p style="margin:0 0 12px;color:#a4456c;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">${escapeHtml(copy.label)}</p><h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:30px;line-height:1.2;font-weight:400">${escapeHtml(copy.title)}</h1><p style="margin:0 0 10px;font-size:14px;line-height:1.7">Customer: ${escapeHtml(order.full_name)}</p><p style="margin:0;font-size:14px;line-height:1.7;color:#75616b">${escapeHtml(copy.message)}</p></td></tr>
<tr><td style="padding:12px 24px"><div style="padding:14px 16px;background:#fbf5f7;border-radius:10px;font-size:12px;line-height:1.8"><strong>Order ${escapeHtml(order.order_number)}</strong><br />${escapeHtml(date)} · Bank transfer</div></td></tr>
<tr><td style="padding:6px 24px 18px"><h2 style="margin:12px 0 0;font-family:Georgia,serif;font-size:23px;font-weight:400">Order details</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed"><colgroup><col style="width:76px" /><col /><col style="width:91px" /></colgroup>${rows}</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;font-size:13px">${totalRow("Subtotal", order.subtotal)}${totalRow(escapeHtml(delivery), order.shipping)}${totalRow("Tax", order.tax)}<tr><td style="padding:14px 0 0;border-top:1px solid #eee5e9;font-weight:700;font-size:17px">Total</td><td style="padding:14px 0 0;border-top:1px solid #eee5e9;text-align:right;font-weight:700;font-size:17px;white-space:nowrap">${money(order.total)}</td></tr></table></td></tr>
<tr><td style="padding:8px 24px 22px"><div style="padding:18px;background:#fbf5f7;border-radius:12px;font-size:13px;line-height:1.8"><strong>${escapeHtml(delivery)}</strong><br />${escapeHtml(order.full_name)}<br />${escapeHtml(address)}${order.phone ? `<br />${escapeHtml(order.phone)}` : ""}</div>${order.notes ? `<p style="font-size:12px;line-height:1.7;color:#75616b"><strong>Order note:</strong> ${escapeHtml(order.notes)}</p>` : ""}</td></tr>
${actionUrl ? `<tr><td align="center" style="padding:0 24px 28px"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#a4456c" style="border-radius:24px"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:14px 28px;color:#fff;text-decoration:none;font-size:13px;font-weight:700">${actionLabel}</a></td></tr></table></td></tr>` : ""}
<tr><td align="center" style="padding:22px 24px;background:#fbf5f7;border-top:1px solid #eee0e6;font-size:12px;line-height:1.9;color:#75616b">Need a hand? <a href="https://wa.me/96875029949" style="color:#a4456c;text-decoration:underline">Chat with us on WhatsApp</a><br /><span dir="ltr">+968 7502 9949</span><br />Lastella · Big Brand Small Price<br />New-order notification for the Lastella admin team.</td></tr>
</table></td></tr></table></body></html>`;
  const text = [
    "LASTELLA · BIG BRAND SMALL PRICE",
    copy.title,
    `Customer: ${order.full_name}`,
    copy.message,
    `Order: ${order.order_number}`,
    `Date: ${date}`,
    "Payment: Bank transfer",
    "",
    ...items.map((item) =>
      [
        item.product_name,
        ...[item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`].filter(
          Boolean,
        ),
        `Qty ${item.quantity} × ${money(item.unit_price)} = ${money((Math.round(item.unit_price * 1000) * item.quantity) / 1000)}`,
      ].join(" · "),
    ),
    "",
    `Subtotal: ${money(order.subtotal)}`,
    `${delivery}: ${money(order.shipping)}`,
    `Tax: ${money(order.tax)}`,
    `Total: ${money(order.total)}`,
    "",
    delivery,
    order.full_name,
    address,
    order.phone,
    ...(order.notes ? [`Order note: ${order.notes}`] : []),
    ...(actionUrl ? [`${actionLabel}: ${actionUrl}`] : []),
    "",
    "Need help? WhatsApp +968 7502 9949",
    "https://wa.me/96875029949",
  ]
    .filter((line) => line != null)
    .join("\n");
  return { subject, html, text };
}
