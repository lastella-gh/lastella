import { createServerFn } from "@tanstack/react-start";
import { adminUserDetailsSchema, adminUserPasswordSchema } from "@/lib/admin-users";
import { updateAdminUserDetails, updateAdminUserPassword } from "@/lib/admin-users.server";

export const updateAdminUserDetailsFn = createServerFn({ method: "POST" })
  .validator(adminUserDetailsSchema)
  .handler(({ data }) => updateAdminUserDetails(data));

export const updateAdminUserPasswordFn = createServerFn({ method: "POST" })
  .validator(adminUserPasswordSchema)
  .handler(({ data }) => updateAdminUserPassword(data.userId, data.password));
