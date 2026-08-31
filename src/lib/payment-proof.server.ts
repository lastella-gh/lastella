import "@tanstack/react-start/server-only";

import { getSupabaseServerClient } from "@/integrations/supabase/server-client.server";
import { paymentProofSchema } from "@/lib/checkout";

type PaymentIntentRow = {
  id: string;
  object_path: string;
  expires_at: string;
  expected_size: number;
  declared_mime: string;
  consumed_at: string | null;
};

export function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

export async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Buffer.from(digest).toString("hex");
}

export async function deriveReceiptToken(claimToken: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`lastella-order-receipt:${claimToken}`),
  );
  return Buffer.from(digest).toString("base64url");
}

export async function preparePaymentProof(input: unknown) {
  const metadata = paymentProofSchema.parse(input);
  const claimToken = randomToken();
  const supabase = getSupabaseServerClient();
  await cleanupExpiredPaymentProofs(supabase);
  const { data: intent, error } = await supabase
    .from("payment_upload_intents")
    .insert({
      claim_token_hash: await hashToken(claimToken),
      original_filename: metadata.filename,
      declared_mime: metadata.contentType,
      expected_size: metadata.size,
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    })
    .select("id, object_path")
    .single();
  if (error || !intent) throw new Error("Unable to prepare payment proof");
  let signed: { token: string } | null = null;
  let signedError: { message: string } | null = null;
  try {
    const result = await supabase.storage
      .from("payment-proofs")
      .createSignedUploadUrl(intent.object_path);
    signed = result.data;
    signedError = result.error;
  } catch {
    signedError = { message: "signed upload creation failed" };
  }
  if (signedError || !signed) {
    await supabase.from("payment_upload_intents").delete().eq("id", intent.id);
    throw new Error("Unable to prepare payment proof");
  }
  return {
    intentId: intent.id,
    claimToken,
    path: intent.object_path,
    token: signed.token,
  };
}

export async function verifyPaymentProof(intentId: string, claimToken: string) {
  const supabase = getSupabaseServerClient();
  const { data: intent, error } = await supabase
    .from("payment_upload_intents")
    .select("*")
    .eq("id", intentId)
    .eq("claim_token_hash", await hashToken(claimToken))
    .single();
  const paymentIntent = intent as PaymentIntentRow | null;
  if (error || !paymentIntent) throw new Error("Payment proof is invalid or expired");
  if (paymentIntent.consumed_at) return paymentIntent;
  if (new Date(paymentIntent.expires_at).getTime() <= Date.now()) {
    await supabase.storage.from("payment-proofs").remove([paymentIntent.object_path]);
    await supabase.from("payment_upload_intents").delete().eq("id", paymentIntent.id);
    throw new Error("Payment proof is invalid or expired");
  }
  const invalidate = async () => {
    await supabase.storage.from("payment-proofs").remove([paymentIntent.object_path]);
    await supabase.from("payment_upload_intents").delete().eq("id", paymentIntent.id);
  };
  const { data: file, error: downloadError } = await supabase.storage
    .from("payment-proofs")
    .download(paymentIntent.object_path);
  if (downloadError || !file || file.size !== paymentIntent.expected_size) {
    await invalidate();
    throw new Error("Payment proof could not be verified");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const valid =
    paymentIntent.declared_mime === "image/jpeg"
      ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : paymentIntent.declared_mime === "image/png"
        ? bytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10"
        : new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
          new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  if (!valid) {
    await invalidate();
    throw new Error("Payment proof could not be verified");
  }
  return paymentIntent;
}

export async function discardPaymentProof(intentId: string, claimToken: string) {
  const supabase = getSupabaseServerClient();
  const { data: intent } = await supabase
    .from("payment_upload_intents")
    .select("id, object_path")
    .eq("id", intentId)
    .eq("claim_token_hash", await hashToken(claimToken))
    .is("consumed_at", null)
    .single();
  if (!intent) return;
  await supabase.storage.from("payment-proofs").remove([intent.object_path]);
  await supabase.from("payment_upload_intents").delete().eq("id", intent.id);
}

async function cleanupExpiredPaymentProofs(supabase: ReturnType<typeof getSupabaseServerClient>) {
  const { data: expired } = await supabase
    .from("payment_upload_intents")
    .select("id, object_path")
    .is("consumed_at", null)
    .lt("expires_at", new Date().toISOString())
    .limit(20);
  if (!expired?.length) return;
  await supabase.storage.from("payment-proofs").remove(expired.map((intent) => intent.object_path));
  await supabase
    .from("payment_upload_intents")
    .delete()
    .in(
      "id",
      expired.map((intent) => intent.id),
    );
}
