import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getOrderSuccess } from "@/lib/order-success.server";

export const getOrderSuccessFn = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }))
  .handler(({ data }) => getOrderSuccess(data.token));
