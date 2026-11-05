import { createServerFn } from "@tanstack/react-start";
import {
  adminCreateUserSchema,
  adminUserDetailsSchema,
  adminUserListInputSchema,
  adminUserPasswordSchema,
} from "@/lib/admin-users";
import {
  createAdminUser,
  loadAdminUsers,
  updateAdminUserDetails,
  updateAdminUserPassword,
} from "@/lib/admin-users.server";

export const loadAdminUsersFn = createServerFn({ method: "POST" })
  .validator(adminUserListInputSchema)
  .handler(({ data }) => loadAdminUsers(data));

export const createAdminUserFn = createServerFn({ method: "POST" })
  .validator(adminCreateUserSchema)
  .handler(({ data }) => createAdminUser(data));

export const updateAdminUserDetailsFn = createServerFn({ method: "POST" })
  .validator(adminUserDetailsSchema)
  .handler(({ data }) => updateAdminUserDetails(data));

export const updateAdminUserPasswordFn = createServerFn({ method: "POST" })
  .validator(adminUserPasswordSchema)
  .handler(({ data }) => updateAdminUserPassword(data.userId, data.password));
