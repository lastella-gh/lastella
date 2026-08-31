import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getAdminPaymentProof,
  loadAdminOrders,
  reviewAdminPayment,
  updateAdminOrderStatus,
} from "@/lib/admin-orders.server";

export const loadAdminOrdersFn = createServerFn({ method: "GET" })
  .validator(z.object({ status: z.string().optional() }))
  .handler(({ data }) => loadAdminOrders(data.status));

export const getAdminPaymentProofFn = createServerFn({ method: "POST" })
  .validator(z.object({ orderId: z.string().uuid() }))
  .handler(({ data }) => getAdminPaymentProof(data.orderId));

export const reviewAdminPaymentFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderId: z.string().uuid(),
      decision: z.enum(["payment_verified", "payment_rejected"]),
      rejectionReason: z.string().max(1000).optional(),
    }),
  )
  .handler(({ data }) => reviewAdminPayment(data.orderId, data.decision, data.rejectionReason));

export const updateAdminOrderStatusFn = createServerFn({ method: "POST" })
  .validator(z.object({ orderId: z.string().uuid(), status: z.string() }))
  .handler(({ data }) => updateAdminOrderStatus(data.orderId, data.status));
