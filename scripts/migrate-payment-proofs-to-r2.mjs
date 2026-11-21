import { AwsClient } from "aws4fetch";
import { createHash } from "node:crypto";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: { copy: { type: "boolean" }, "confirm-private": { type: "boolean" } },
});
const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Set ${name} before continuing`);
  return value;
};
const source = new URL(process.env.SUPABASE_URL || required("VITE_SUPABASE_URL")).origin;
const apiKey = required("SUPABASE_SECRET_KEY");
const headers = { apikey: apiKey };
if (!apiKey.startsWith("sb_secret_")) headers.Authorization = `Bearer ${apiKey}`;

async function checked(response, action) {
  if (response.ok) return response;
  await response.body?.cancel();
  throw new Error(`${action} failed with HTTP ${response.status}`);
}

const receipts = new Map();
for (let offset = 0; ; offset += 100) {
  const query = new URLSearchParams({
    select: "payment_proof_path,payment_proof_content_type,payment_proof_size",
    payment_proof_path: "like.proofs/*",
    order: "id",
    limit: "100",
    offset: String(offset),
  });
  const response = await checked(
    await fetch(`${source}/rest/v1/orders?${query}`, {
      headers,
      signal: AbortSignal.timeout(15_000),
    }),
    "Reading finalized payment proof references",
  );
  const rows = await response.json();
  for (const row of rows) {
    const {
      payment_proof_path: key,
      payment_proof_content_type: mime,
      payment_proof_size: size,
    } = row;
    if (
      !/^proofs\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(key) ||
      !["image/jpeg", "image/png", "image/webp"].includes(mime) ||
      !Number.isInteger(size) ||
      size < 1 ||
      size > 5 * 1024 * 1024
    )
      throw new Error(
        "A recorded payment proof has unexpected metadata. Review it before copying.",
      );
    const known = receipts.get(key);
    if (known && (known.mime !== mime || known.size !== size))
      throw new Error("Two order records disagree about a payment proof");
    receipts.set(key, { mime, size });
  }
  if (rows.length < 100) break;
}
console.log(`${receipts.size} finalized payment proof files`);

if (values.copy) {
  if (!values["confirm-private"])
    throw new Error(
      "Check that the R2 bucket has no public URL or custom domain, then pass --confirm-private",
    );
  const endpoint = new URL(required("R2_ENDPOINT"));
  const bucket = required("R2_PAYMENT_BUCKET");
  if (
    endpoint.protocol !== "https:" ||
    !endpoint.hostname.endsWith(".r2.cloudflarestorage.com") ||
    !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket) ||
    bucket === process.env.R2_BUCKET
  )
    throw new Error("Use a separate private R2 bucket for payment proofs");
  const client = new AwsClient({
    service: "s3",
    region: "auto",
    accessKeyId: required("R2_PAYMENT_ACCESS_KEY_ID"),
    secretAccessKey: required("R2_PAYMENT_SECRET_ACCESS_KEY"),
  });
  const hash = (data) => createHash("sha256").update(data).digest("hex");
  let verified = 0;
  for (const [key, { mime, size }] of receipts) {
    const sourceResponse = await checked(
      await fetch(`${source}/storage/v1/object/authenticated/payment-proofs/${key}`, {
        headers,
        signal: AbortSignal.timeout(30_000),
      }),
      "Downloading private Supabase receipt",
    );
    const bytes = Buffer.from(await sourceResponse.arrayBuffer());
    if (bytes.length !== size)
      throw new Error("Supabase receipt size differs from the order metadata");
    const destination = new URL(`/${bucket}/${key}`, endpoint);
    const request = (init = {}) =>
      client.fetch(destination, { ...init, signal: AbortSignal.timeout(35_000) });
    let object = await request();
    if (object.status === 404) {
      await object.body?.cancel();
      const uploaded = await request({
        method: "PUT",
        headers: {
          "Content-Type": mime,
          "Cache-Control": "private, no-store",
          "Content-MD5": createHash("md5").update(bytes).digest("base64"),
          "If-None-Match": "*",
        },
        body: bytes,
      });
      if (uploaded.status === 412) await uploaded.body?.cancel();
      else await (await checked(uploaded, "Uploading private R2 receipt")).body?.cancel();
      object = await request();
    }
    await checked(object, "Verifying private R2 receipt");
    if (
      object.headers.get("content-type") !== mime ||
      !object.headers.get("cache-control")?.includes("no-store") ||
      hash(Buffer.from(await object.arrayBuffer())) !== hash(bytes)
    )
      throw new Error("R2 receipt failed metadata or checksum verification");
    const unsigned = await fetch(destination, { signal: AbortSignal.timeout(15_000) });
    const authorizationRequired =
      unsigned.status === 400
        ? (await unsigned.text()).includes("<Message>Authorization</Message>")
        : [401, 403].includes(unsigned.status);
    if (unsigned.status !== 400) await unsigned.body?.cancel();
    if (!authorizationRequired)
      throw new Error(`Expected unsigned R2 read to be denied, got HTTP ${unsigned.status}`);
    console.log(`Verified ${++verified}/${receipts.size}`);
  }
  console.log("Private copy verified. No order rows or Supabase objects were modified.");
}
