import "@tanstack/react-start/server-only";

import { AwsClient } from "aws4fetch";

export const R2_PROOF_PREFIX = "r2/";

export function getPaymentProofR2() {
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_PAYMENT_BUCKET;
  const accessKeyId = process.env.R2_PAYMENT_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_PAYMENT_SECRET_ACCESS_KEY;
  if (!bucket && !accessKeyId && !secretAccessKey) return null;
  if (
    !endpoint ||
    !bucket ||
    !accessKeyId ||
    !secretAccessKey ||
    bucket === process.env.R2_BUCKET ||
    !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket)
  )
    throw new Error("Private payment proof storage is unavailable");
  const base = new URL(endpoint);
  if (base.protocol !== "https:" || !base.hostname.endsWith(".r2.cloudflarestorage.com"))
    throw new Error("Private payment proof storage is unavailable");

  const client = new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" });
  return {
    request(path: string, init: RequestInit) {
      return client.fetch(objectUrl(path), { ...init, signal: AbortSignal.timeout(20_000) });
    },
    async signRead(path: string) {
      const url = objectUrl(path);
      url.searchParams.set("X-Amz-Expires", "60");
      const request = await client.sign(url, { method: "GET", aws: { signQuery: true } });
      return request.url;
    },
  };

  function objectUrl(path: string) {
    const key = path.startsWith(R2_PROOF_PREFIX) ? path.slice(R2_PROOF_PREFIX.length) : path;
    if (!isPaymentProofKey(key)) throw new Error("Invalid payment proof path");
    return new URL(`/${bucket}/${key}`, base);
  }
}

export function isPaymentProofKey(key: string) {
  return /^proofs\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(key);
}

export function requirePaymentProofR2() {
  const r2 = getPaymentProofR2();
  if (!r2) throw new Error("Private payment proof storage is unavailable");
  return r2;
}
