import { createServerFn } from "@tanstack/react-start";
import { uploadProductImageToR2 } from "@/lib/admin-product-images.server";

export const uploadProductImageFn = createServerFn({ method: "POST" })
  .validator((data: FormData) => {
    if (!(data instanceof FormData)) throw new Error("Image upload requires form data");
    return data;
  })
  .handler(({ data }) => uploadProductImageToR2(data.get("image")));
