import { createServerFn } from "@tanstack/react-start";
import { checkoutSchema } from "@/lib/checkout";
import { createCheckoutOrder } from "@/lib/checkout.server";

export const submitCheckout = createServerFn({ method: "POST" })
  .validator(checkoutSchema)
  .handler(({ data }) => createCheckoutOrder(data));
