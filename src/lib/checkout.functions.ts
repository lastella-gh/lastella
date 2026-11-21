import { createServerFn } from "@tanstack/react-start";
import { checkoutSchema, paymentIntentSchema } from "@/lib/checkout";
import { createCheckoutOrder } from "@/lib/checkout.server";
import {
  discardPaymentProof,
  preparePaymentProof,
  uploadPaymentProofToR2,
} from "@/lib/payment-proof.server";
import { z } from "zod";

export const submitCheckout = createServerFn({ method: "POST" })
  .validator(
    z
      .object({
        checkout: checkoutSchema,
        payment: paymentIntentSchema.nullish(),
        checkoutToken: z.string().uuid().optional(),
      })
      .refine((data) => data.payment || data.checkoutToken, "Checkout token is required"),
  )
  .handler(({ data }) => createCheckoutOrder(data.checkout, data.payment, data.checkoutToken));

export const preparePaymentProofUpload = createServerFn({ method: "POST" })
  .validator(z.object({ filename: z.string(), contentType: z.string(), size: z.number() }))
  .handler(({ data }) => preparePaymentProof(data));

export const uploadPrivatePaymentProof = createServerFn({ method: "POST" })
  .validator((data: FormData) => {
    if (!(data instanceof FormData)) throw new Error("Payment proof upload requires form data");
    return data;
  })
  .handler(({ data }) => uploadPaymentProofToR2(data));

export const discardPaymentProofUpload = createServerFn({ method: "POST" })
  .validator(paymentIntentSchema)
  .handler(({ data }) => discardPaymentProof(data.intentId, data.claimToken));
