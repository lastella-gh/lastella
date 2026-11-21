import { AwsClient } from "aws4fetch";
import { createHash } from "node:crypto";
import { setDefaultResultOrder } from "node:dns";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { setDefaultAutoSelectFamily } from "node:net";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    backup: { type: "string" },
    copy: { type: "boolean" },
    snapshot: { type: "boolean" },
    report: { type: "string" },
  },
});
const sourceBucket = "product-images";
setDefaultResultOrder("ipv4first");
setDefaultAutoSelectFamily(false);
const hash = (data) => createHash("sha256").update(data).digest("hex");
const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Set ${name} before continuing`);
  return value;
};

const source = new URL(process.env.SUPABASE_URL || required("VITE_SUPABASE_URL")).origin;

function encodeKey(key) {
  const parts = key.split("/");
  if (parts.some((part) => !part || part === "." || part === ".."))
    throw new Error(`Invalid object key: ${key}`);
  return parts.map(encodeURIComponent).join("/");
}

async function checked(response, operation) {
  if (response.ok) return response;
  await response.body?.cancel();
  throw new Error(`${operation} failed with HTTP ${response.status}`);
}

async function requestWithRetry(send) {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await send();
      if (attempt === 3 || (response.status < 500 && response.status !== 429)) return response;
      await response.body?.cancel();
    } catch (error) {
      if (attempt === 3)
        throw new Error(`Network request failed (${error.cause?.code ?? error.name})`);
    }
    await delay(300 * (attempt + 1) + Math.random() * 300);
  }
}

async function getLiveObjects() {
  const apiKey = required("SUPABASE_SECRET_KEY");
  const headers = { apikey: apiKey, "Content-Type": "application/json" };
  if (!apiKey.startsWith("sb_secret_")) headers.Authorization = `Bearer ${apiKey}`;
  const objects = [];
  const prefixes = [""];
  for (const prefix of prefixes) {
    for (let offset = 0; ; offset += 100) {
      const response = await checked(
        await requestWithRetry(() =>
          fetch(`${source}/storage/v1/object/list/${sourceBucket}`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              prefix,
              limit: 100,
              offset,
              sortBy: { column: "name", order: "asc" },
            }),
            signal: AbortSignal.timeout(20_000),
          }),
        ),
        "Listing Supabase product images",
      );
      const entries = await response.json();
      for (const entry of entries) {
        const key = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (!entry.id) {
          prefixes.push(key);
          continue;
        }
        const size = Number(entry.metadata?.size);
        if (!Number.isSafeInteger(size) || size <= 0)
          throw new Error(`Invalid source size: ${key}`);
        objects.push({
          key,
          size,
          id: entry.id,
          updatedAt: entry.updated_at,
          etag: entry.metadata?.eTag,
          get: async () => {
            const response = await checked(
              await requestWithRetry(() =>
                fetch(`${source}/storage/v1/object/public/${sourceBucket}/${encodeKey(key)}`, {
                  cache: "no-store",
                  signal: AbortSignal.timeout(30_000),
                }),
              ),
              `Downloading ${key}`,
            );
            return {
              bytes: Buffer.from(await response.arrayBuffer()),
              mime: response.headers.get("content-type"),
              cache: response.headers.get("cache-control"),
            };
          },
        });
      }
      if (entries.length < 100) break;
    }
  }
  return objects;
}

async function getBackupObjects(directory) {
  const read = (name) => readFile(resolve(directory, name), "utf8");
  const inventory = JSON.parse(await read("target-final.json"));
  const verified = (await read("verified.jsonl"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  const metadata = new Map(
    inventory.objects
      .filter((item) => item.bucket === sourceBucket)
      .map((item) => [item.name, item]),
  );
  return verified
    .filter((item) => item.bucket === sourceBucket)
    .map((item) => ({
      key: item.name,
      size: item.bytes,
      id: metadata.get(item.name)?.id,
      updatedAt: metadata.get(item.name)?.updated_at,
      etag: metadata.get(item.name)?.metadata?.eTag,
      get: async () => {
        const tag = hash(`${sourceBucket}/${item.name}`);
        const bytes = await readFile(resolve(directory, "objects", tag));
        if (hash(bytes) !== item.sha256) throw new Error(`Backup checksum mismatch: ${item.name}`);
        const entry = metadata.get(item.name)?.metadata;
        return { bytes, mime: entry?.mimetype, cache: entry?.cacheControl };
      },
    }));
}

const backup = values.backup ? await getBackupObjects(resolve(values.backup)) : [];
if (values.snapshot && backup.length === 0) throw new Error("Pass --backup to use --snapshot");
const objects = values.snapshot ? backup : await getLiveObjects();
if (objects.length === 0 || new Set(objects.map((object) => object.key)).size !== objects.length)
  throw new Error("Expected a non-empty source inventory with unique keys");
for (const { key } of objects) encodeKey(key);
console.log(
  `${objects.length} product media objects, ${objects.reduce((bytes, object) => bytes + object.size, 0)} bytes (${values.snapshot ? "backup snapshot" : "live inventory"})`,
);
const backupByKey = new Map(backup.map((item) => [item.key, item]));
const currentBackupObjects = new Map();
if (!values.snapshot && backup.length > 0) {
  for (const object of objects) {
    const saved = backupByKey.get(object.key);
    if (
      saved?.etag &&
      saved.etag === object.etag &&
      saved.id === object.id &&
      saved.updatedAt === object.updatedAt &&
      saved.size === object.size
    )
      currentBackupObjects.set(object.key, saved);
  }
  console.log(`${currentBackupObjects.size} live objects match the verified backup metadata`);
}

if (values.copy) {
  if (!values.report) throw new Error("Pass --report with a new private report directory");
  const reportDir = resolve(values.report);
  const endpoint = new URL(required("R2_ENDPOINT"));
  const bucket = required("R2_BUCKET");
  if (endpoint.protocol !== "https:" || !endpoint.hostname.endsWith(".r2.cloudflarestorage.com"))
    throw new Error("R2_ENDPOINT must be a Cloudflare S3 API endpoint");
  const client = new AwsClient({
    service: "s3",
    region: "auto",
    accessKeyId: required("R2_ACCESS_KEY_ID"),
    secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
    retries: 0,
  });
  const publicUrl = process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL) : null;
  if (publicUrl && (publicUrl.protocol !== "https:" || publicUrl.href !== `${publicUrl.origin}/`))
    throw new Error("R2_PUBLIC_URL must be a public HTTPS origin");

  await mkdir(reportDir, { mode: 0o700 });
  async function copyObject(object) {
    const { bytes, mime, cache } = await (currentBackupObjects.get(object.key) ?? object).get();
    if (bytes.length !== object.size) throw new Error(`Source size changed: ${object.key}`);
    if (!mime || !/^(image|video)\//i.test(mime))
      throw new Error(`Unexpected media type for ${object.key}: ${mime}`);

    const key = encodeKey(object.key);
    const target = new URL(`/${encodeURIComponent(bucket)}/${key}`, endpoint);
    const request = (init = {}) =>
      requestWithRetry(() =>
        client.fetch(target, { ...init, signal: AbortSignal.timeout(45_000) }),
      );
    const md5 = createHash("md5").update(bytes).digest();
    let result = await request({ method: "HEAD" });
    if (result.status === 404) {
      await result.body?.cancel();
      const put = await request({
        method: "PUT",
        body: bytes,
        headers: {
          "Content-Type": mime,
          "Cache-Control": cache || "public, max-age=31536000",
          "Content-MD5": md5.toString("base64"),
          "If-None-Match": "*",
        },
      });
      if (put.status === 412) await put.body?.cancel();
      else await (await checked(put, `Uploading ${object.key}`)).body?.cancel();
      result = await request({ method: "HEAD" });
    }
    await checked(result, `Verifying ${object.key}`);
    const sha256 = hash(bytes);
    if (
      Number(result.headers.get("content-length")) !== bytes.length ||
      result.headers.get("etag") !== `"${md5.toString("hex")}"`
    ) {
      const download = await checked(await request(), `Downloading R2 copy of ${object.key}`);
      if (hash(Buffer.from(await download.arrayBuffer())) !== sha256)
        throw new Error(`R2 checksum differs for ${object.key}. Existing object was preserved.`);
    }
    if (result.headers.get("content-type") !== mime)
      throw new Error(`R2 content type differs for ${object.key}`);
    return {
      source: `${source}/storage/v1/object/public/${sourceBucket}/${key}`,
      target: publicUrl ? new URL(key, publicUrl).href : null,
      key: object.key,
      sha256,
    };
  }
  const results = [];
  const failed = [];
  let next = 0;
  async function worker() {
    while (next < objects.length) {
      const object = objects[next++];
      try {
        results.push(await copyObject(object));
      } catch (error) {
        failed.push({ key: object.key, error: String(error) });
        console.error(`Could not verify ${object.key}: ${String(error)}`);
      }
      const processed = results.length + failed.length;
      if (processed % 40 === 0 || processed === objects.length)
        console.log(`Verified ${results.length}/${objects.length} (${failed.length} failed)`);
    }
  }
  await Promise.all(Array.from({ length: 12 }, worker));
  await writeFile(resolve(reportDir, "verified.json"), JSON.stringify(results, null, 2), {
    mode: 0o600,
  });
  if (failed.length > 0) {
    await writeFile(resolve(reportDir, "failed.json"), JSON.stringify(failed, null, 2), {
      mode: 0o600,
    });
    throw new Error(
      `${failed.length} images could not be verified. See the private failure report.`,
    );
  }

  if (values.snapshot || !publicUrl) {
    console.log(
      "Verified copy only. Run from the live source with a production R2 URL to prepare cutover.",
    );
  } else {
    const inventoryHash = (list) =>
      hash(
        list
          .map(({ key, id, size, updatedAt, etag }) =>
            JSON.stringify([key, id, size, updatedAt, etag]),
          )
          .sort()
          .join("\n"),
      );
    if (inventoryHash(objects) !== inventoryHash(await getLiveObjects()))
      throw new Error(
        "Supabase inventory changed during transfer. Rerun before preparing cutover.",
      );
    for (const row of [results[0], results[Math.floor(results.length / 2)], results.at(-1)]) {
      const response = await checked(
        await fetch(row.target, { signal: AbortSignal.timeout(15_000) }),
        `Public R2 check for ${row.key}`,
      );
      if (hash(Buffer.from(await response.arrayBuffer())) !== row.sha256)
        throw new Error(`The public media URL returned different bytes for ${row.key}`);
    }
    const sql = (
      await readFile(new URL("./product-media-cutover.sql", import.meta.url), "utf8")
    ).replace("/* VERIFIED_URL_PAIRS */", () =>
      results
        .map(({ source, target }) => {
          const quote = (url) => `'${url.replaceAll("'", "''")}'`;
          return `(${quote(source)}, ${quote(target)})`;
        })
        .join(",\n"),
    );
    await writeFile(resolve(reportDir, "cutover.sql"), sql, { mode: 0o600 });
    console.log("Prepared cutover.sql for review. No database changes were applied.");
  }
}
