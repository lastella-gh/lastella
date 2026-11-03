import { z } from "zod";
import type { Enums, Tables } from "@/integrations/supabase/types";

export type AdminUserProfile = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "phone" | "created_at"
> & {
  role: Enums<"app_role"> | undefined;
};

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
    password: z.string().min(8, "Use at least 8 characters").max(128, "Use at most 128 characters"),
    confirmPassword: z.string(),
  })
  .refine((input) => input.password === input.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type AdminUserDetailsInput = z.infer<typeof adminUserDetailsSchema>;
