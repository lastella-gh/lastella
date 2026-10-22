import { defineNitroConfig } from "nitro/config";
import vercelConfig from "./vercel.json";

export default defineNitroConfig({
  vercel: {
    config: {
      version: 3,
      // Also include the optimizer in Nitro's Build Output API configuration.
      images: {
        ...vercelConfig.images,
        formats: ["image/webp"],
        remotePatterns: vercelConfig.images.remotePatterns.map((pattern) => ({
          ...pattern,
          protocol: "https",
        })),
      },
    },
  },
});
