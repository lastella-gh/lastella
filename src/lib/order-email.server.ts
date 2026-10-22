import "@tanstack/react-start/server-only";

import { getSupabaseServerClient } from "@/integrations/supabase/server-client.server";
import { emailUrl, renderNewOrderAdminEmail } from "@/lib/order-email-template";

let warnedAboutConfiguration = false;

// Called only after checkout commits. Notification failures never undo an order.
export async function sendNewOrderAdminEmail(
  orderId: string,
): Promise<"disabled" | "logged" | "sent" | "failed"> {
  try {
    const supabase = getSupabaseServerClient();
    // Read the switch on every order so turning it off takes effect immediately.
    const { data: settings, error: settingsError } = await supabase
      .from("store_settings")
      .select("admin_order_emails_enabled")
      .eq("id", 1)
      .single();
    if (settingsError) throw new Error("Unable to load order notification settings");
    if (settings?.admin_order_emails_enabled !== true) return "disabled";

    const admins = [
      ...new Set(
        (process.env.ORDER_ADMIN_EMAILS ?? "")
          .split(",")
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];
    if (!admins.length) return "disabled";

    const isDevelopment = process.env.NODE_ENV === "development";
    const key = process.env.RESEND_API_KEY?.trim();
    const from = process.env.ORDER_EMAIL_FROM?.trim();
    if (!isDevelopment && (!key || !from)) {
      if (!warnedAboutConfiguration) {
        console.warn("Admin order emails disabled: configure RESEND_API_KEY and ORDER_EMAIL_FROM");
        warnedAboutConfiguration = true;
      }
      return "disabled";
    }

    // Render committed order/item snapshots, never browser-supplied cart details.
    const { data: order, error } = await supabase
      .from("orders")
      .select(
        "id, order_number, full_name, phone, address, city, country, delivery_type, subtotal, shipping, tax, total, payment_status, notes, created_at, updated_at",
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
    const email = renderNewOrderAdminEmail({ order, items, siteUrl });
    if (isDevelopment) {
      console.info("[Admin order email: development preview, not sent]", {
        orderId,
        from: from ?? "Lastella (development)",
        to: admins,
        subject: email.subject,
        text: email.text,
      });
      return "logged";
    }

    await sendEmail({
      key: key!,
      from: from!,
      to: admins,
      ...email,
      idempotencyKey: `lastella/${orderId}/new_order/created`,
    });
    return "sent";
  } catch (error) {
    // Provider bodies and private payment/receipt credentials must not enter logs.
    console.error(
      `Admin order email failed: order=${orderId}`,
      error instanceof Error ? error.message : "Unknown email error",
    );
    return "failed";
  }
}

async function sendEmail({
  key,
  from,
  to,
  subject,
  html,
  text,
  idempotencyKey,
}: {
  key: string;
  from: string;
  to: string | string[];
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
    tags: [{ name: "event", value: "new_order" }],
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
