import "@tanstack/react-start/server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function createSecretKeyFetch(secretKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (headers.get("Authorization") === `Bearer ${secretKey}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", secretKey);

    return fetch(input, { ...init, headers });
  };
}

let serverClient: ReturnType<typeof createClient<Database>> | undefined;

export function getSupabaseServerClient() {
  if (serverClient) return serverClient;

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error(
      "Missing server environment variables: SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SECRET_KEY",
    );
  }
  try {
    new URL(url);
  } catch {
    throw new Error(`Invalid Supabase server URL: ${JSON.stringify(url)}`);
  }

  serverClient = createClient<Database>(url, secretKey, {
    global: { fetch: createSecretKeyFetch(secretKey) },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return serverClient;
}
