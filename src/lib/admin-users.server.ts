import "@tanstack/react-start/server-only";

import { requireAdmin } from "@/lib/server-auth.server";
import type { AdminUserDetailsInput } from "@/lib/admin-users";

export async function updateAdminUserDetails(input: AdminUserDetailsInput) {
  const { supabase, userId } = await requireAdmin();
  const { error } = await supabase.rpc("admin_update_user_details", {
    p_actor_id: userId,
    p_user_id: input.userId,
    p_full_name: input.fullName,
    p_phone: input.phone,
    p_role: input.role,
  });
  if (error) throw new Error(`Failed to update user: ${error.message}`);
  return { success: true };
}

export async function updateAdminUserPassword(userId: string, password: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.auth.admin.updateUserById(userId, { password });
  if (error) throw new Error(`Failed to update password: ${error.message}`);
  return { success: true };
}
