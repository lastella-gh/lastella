import "@tanstack/react-start/server-only";

import { getSupabaseServerClient } from "@/integrations/supabase/server-client.server";
import { emailUrl, renderOrderEmail, type OrderEmailEvent } from "@/lib/order-email-template";

let warnedAboutConfiguration = false;

// All callers run after a committed order change. Email failures must never undo that change.
export async function sendOrderEmails(
  orderId: string,
  {
    event = "order_received",
    revision,
    receiptToken,
  }: {
    event?: Exclude<OrderEmailEvent, "new_order">;
    revision?: string;
    receiptToken?: string;
  } = {},
): Promise<"disabled" | "logged" | "sent" | "failed"> {
  const isDevelopment = process.env.NODE_ENV === "development";
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.ORDER_EMAIL_FROM?.trim();
  if (!isDevelopment && (!key || !from)) {
    if (!warnedAboutConfiguration) {
      console.warn("Order emails disabled: configure RESEND_API_KEY and ORDER_EMAIL_FROM");
      warnedAboutConfiguration = true;
    }
    return "disabled";
  }

  try {
    const supabase = getSupabaseServerClient();
    // Use the immutable item snapshots and committed totals, never browser-supplied cart details.
    const { data: order, error } = await supabase
      .from("orders")
      .select(
        "id, order_number, full_name, email, phone, address, city, country, delivery_type, subtotal, shipping, tax, total, payment_status, payment_rejection_reason, notes, created_at, updated_at",
      )
      .eq("id", orderId)
      .single();
    if (error || !order) throw new Error("Unable to load email order");
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("product_name, product_image, quantity, unit_price, size, color")
      .eq("order_id", orderId)
      .order("created_at");
    if (itemsError || !items?.length) throw new Error("Unable to load email items");

    const siteUrl = emailUrl(process.env.ORDER_EMAIL_SITE_URL) ?? undefined;
    const receiptUrl =
      siteUrl && receiptToken
        ? new URL(`/order-success/${encodeURIComponent(receiptToken)}`, siteUrl).href
        : undefined;
    const admins = [
      ...new Set(
        (process.env.ORDER_ADMIN_EMAILS ?? "")
          .split(",")
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];
    const deliveries: { to: string | string[]; event: OrderEmailEvent }[] = [
      { to: order.email, event },
      ...(event === "order_received" && admins.length
        ? [{ to: admins, event: "new_order" as const }]
        : []),
    ];

    const results = await Promise.allSettled(
      deliveries.map(async (delivery) => {
        const email = renderOrderEmail({
          event: delivery.event,
          order,
          items,
          siteUrl,
          receiptUrl,
        });
        if (isDevelopment) {
          console.info("[Order email: development preview, not sent]", {
            orderId,
            event: delivery.event,
            from: from ?? "Lastella (development)",
            to: delivery.to,
            subject: email.subject,
            text: receiptUrl
              ? email.text.replaceAll(receiptUrl, "[private receipt link omitted]")
              : email.text,
          });
          return;
        }
        const idempotencyKey = `lastella/${orderId}/${delivery.event}/${event === "order_received" ? "created" : (revision ?? order.updated_at)}`;
        await sendEmail({ key: key!, from: from!, ...delivery, ...email, idempotencyKey });
      }),
    );
    if (results.some((result) => result.status === "rejected")) {
      throw new Error("One or more email deliveries failed after provider retries");
    }
    return isDevelopment ? "logged" : "sent";
  } catch (error) {
    // Do not include provider response bodies, recipient details, or receipt tokens in logs.
    console.error(
      `Order email failed: order=${orderId} event=${event}`,
      error instanceof Error ? error.message : "Unknown email error",
    );
    return "failed";
  }
}

async function sendEmail({
  key,
  from,
  to,
  event,
  subject,
  html,
  text,
  idempotencyKey,
}: {
  key: string;
  from: string;
  to: string | string[];
  event: OrderEmailEvent;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
}) {
  const body = JSON.stringify({
    from,
    to,
    subject,
    html,
    text,
    ...(process.env.ORDER_EMAIL_REPLY_TO?.trim()
      ? { reply_to: process.env.ORDER_EMAIL_REPLY_TO.trim() }
      : {}),
    tags: [{ name: "event", value: event }],
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    let retryAfter = 1_000;
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body,
        signal: AbortSignal.timeout(5_000),
      });
      if (response.ok) return;
      if (response.status !== 429 && response.status < 500) {
        throw new PermanentEmailError(`Email provider returned ${response.status}`);
      }
      if (attempt === 1) throw new Error(`Email provider returned ${response.status}`);
      const requestedDelay = Number(response.headers.get("retry-after"));
      if (Number.isFinite(requestedDelay) && requestedDelay > 0) {
        retryAfter = Math.min(requestedDelay * 1_000, 5_000);
      }
    } catch (error) {
      if (error instanceof PermanentEmailError) throw error;
      if (attempt === 1) throw new Error("Email provider unavailable after retries");
    }
    await new Promise((resolve) => setTimeout(resolve, retryAfter));
  }
}

class PermanentEmailError extends Error {}
