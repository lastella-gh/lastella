import "@tanstack/react-start/server-only";

import { AwsClient } from "aws4fetch";
import { requireAdmin } from "@/lib/server-auth.server";

const MIME_EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

function hasImageSignature(bytes: Uint8Array, type: string) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png")
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (byte, index) => bytes[index] === byte,
    );
  const header = new TextDecoder().decode(bytes.subarray(0, 12));
  return header.startsWith("RIFF") && header.slice(8) === "WEBP";
}

export async function uploadProductImageToR2(file: FormDataEntryValue | null) {
  await requireAdmin();

  if (!(file instanceof File) || file.size === 0 || file.size > 5 * 1024 * 1024)
    throw new Error("Product image must be between 1 byte and 5 MB");
  if (!Object.hasOwn(MIME_EXTENSIONS, file.type))
    throw new Error("Product image must be JPEG, PNG, or WebP");

  const data = new Uint8Array(await file.arrayBuffer());
  if (!hasImageSignature(data, file.type)) throw new Error("Product image format is invalid");

  const { R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL } =
    process.env;
  if (!R2_ENDPOINT || !R2_BUCKET || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_PUBLIC_URL)
    throw new Error("Product image storage is unavailable");

  const endpoint = new URL(R2_ENDPOINT);
  const publicUrl = new URL(R2_PUBLIC_URL);
  if (
    endpoint.protocol !== "https:" ||
    !endpoint.hostname.endsWith(".r2.cloudflarestorage.com") ||
    publicUrl.protocol !== "https:" ||
    publicUrl.pathname !== "/" ||
    publicUrl.search ||
    publicUrl.hash ||
    publicUrl.username ||
    publicUrl.password
  )
    throw new Error("Product image storage is unavailable");

  const client = new AwsClient({
    service: "s3",
    region: "auto",
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  });
  const extension = MIME_EXTENSIONS[file.type as keyof typeof MIME_EXTENSIONS];
  const path = `products/${crypto.randomUUID()}.${extension}`;
  const response = await client.fetch(new URL(`/${R2_BUCKET}/${path}`, endpoint), {
    method: "PUT",
    body: data,
    headers: {
      "Content-Type": file.type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "If-None-Match": "*",
    },
    signal: AbortSignal.timeout(20_000),
  });
  await response.body?.cancel();
  if (!response.ok) {
    console.error("R2 product image upload failed", response.status);
    throw new Error("Product image upload failed");
  }
  return { url: new URL(path, publicUrl).href };
}
