import { z } from "zod";

export const checkoutItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(100),
  size: z.string().trim().min(1).max(100).nullable(),
  color: z.string().trim().min(1).max(100).nullable(),
});

export const checkoutSchema = z.object({
  email: z.string().trim().email().max(320),
  fullName: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(50),
  address: z.string().trim().min(1).max(500),
  city: z.string().trim().min(1).max(120),
  postalCode: z.string().trim().max(30),
  country: z.string().trim().min(1).max(120),
  paymentMethod: z.enum(["cod", "bank"]),
  notes: z.string().trim().max(1_000),
  needGiftBox: z.boolean(),
  items: z.array(checkoutItemSchema).min(1).max(50),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const SHIPPING_BAISA = 2_000;
export const FREE_SHIPPING_THRESHOLD_BAISA = 20_000;
export const VAT_RATE = 0.05;

export function fromBaisa(value: number): number {
  return value / 1_000;
}

export function toBaisa(value: number): number {
  return Math.round(value * 1_000);
}
