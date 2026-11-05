import { z } from "zod";

export const ADMIN_USERS_PAGE_SIZE = 25;

export const adminUserListInputSchema = z.object({
  search: z.string().trim().max(254).default(""),
  page: z.number().int().min(0).max(1_000_000).default(0),
});

export const adminUserListResultSchema = z.object({
  users: z.array(
    z.object({
      id: z.string().uuid(),
      full_name: z.string().nullable(),
      phone: z.string().nullable(),
      email: z.string().nullable(),
      created_at: z.string(),
      role: z.enum(["admin", "customer"]).nullish(),
    }),
  ),
  count: z.number().int().nonnegative(),
});

export type AdminUserProfile = z.infer<typeof adminUserListResultSchema>["users"][number];

const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128, "Use at most 128 characters");

export const adminUserDetailsSchema = z.object({
  userId: z.string().uuid(),
  fullName: z
    .string()
    .trim()
    .min(1, "Enter a name")
    .max(200, "Name must be 200 characters or fewer"),
  phone: z.string().trim().max(40, "Phone must be 40 characters or fewer"),
  role: z.enum(["admin", "customer"]),
});

export const adminUserPasswordSchema = z
  .object({
    userId: z.string().uuid(),
    password: passwordSchema,
    confirmPassword: z.string().max(128),
  })
  .refine((input) => input.password === input.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const adminCreateUserSchema = adminUserDetailsSchema
  .omit({ userId: true })
  .extend({
    email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
    password: passwordSchema,
    confirmPassword: z.string().max(128),
  })
  .refine((input) => input.password === input.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type AdminUserDetailsInput = z.infer<typeof adminUserDetailsSchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type AdminUserListInput = z.infer<typeof adminUserListInputSchema>;
