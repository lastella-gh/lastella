import "@tanstack/react-start/server-only";

import { requireAdmin } from "@/lib/server-auth.server";
import {
  ADMIN_USERS_PAGE_SIZE,
  adminUserListResultSchema,
  type AdminCreateUserInput,
  type AdminUserDetailsInput,
  type AdminUserListInput,
} from "@/lib/admin-users";

export async function loadAdminUsers(input: AdminUserListInput) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc("admin_list_users", {
    p_search: input.search,
    p_offset: input.page * ADMIN_USERS_PAGE_SIZE,
    p_limit: ADMIN_USERS_PAGE_SIZE,
  });
  if (error) throw new Error("Failed to load users. Please try again.");
  return adminUserListResultSchema.parse(data);
}

export async function createAdminUser(input: AdminCreateUserInput) {
  const { supabase, userId } = await requireAdmin();
  const { data, error } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName },
  });
  if (error) throw new Error(`Failed to create user: ${error.message}`);

  // Auth creates the profile and customer role through the signup trigger.
  // Complete phone/role setup before reporting success to the administrator.
  try {
    const { error: setupError } = await supabase.rpc("admin_update_user_details", {
      p_actor_id: userId,
      p_user_id: data.user.id,
      p_full_name: input.fullName,
      p_phone: input.phone,
      p_role: input.role,
    });
    if (setupError) throw setupError;
    return { id: data.user.id, setupComplete: true };
  } catch {
    // Only remove the account created by this request; never an existing user.
    let rolledBack = false;
    try {
      const { error: cleanupError } = await supabase.auth.admin.deleteUser(data.user.id);
      rolledBack = !cleanupError;
    } catch {
      // Return the kept account so it can be found and edited instead of retried.
    }
    if (rolledBack) {
      throw new Error(
        "Could not finish setting up the user. No account was kept. Please try again.",
      );
    }
    return { id: data.user.id, setupComplete: false };
  }
}

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
