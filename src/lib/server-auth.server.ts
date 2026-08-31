import "@tanstack/react-start/server-only";

import { getRequestHeader } from "@tanstack/react-start/server";
import { getSupabaseServerClient } from "@/integrations/supabase/server-client.server";

export async function requireAdmin() {
  const authorization = getRequestHeader("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Authentication is required");
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) throw new Error("Authentication is required");

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims(token);
  const userId = data?.claims?.sub;
  if (error || typeof userId !== "string") {
    throw new Error("Invalid authentication session");
  }

  const { data: role, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (roleError || role?.role !== "admin") {
    throw new Error("Administrator access is required");
  }

  return { supabase, userId };
}
