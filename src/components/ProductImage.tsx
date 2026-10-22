import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";
import { productImageUrl } from "@/lib/product-images";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet"> & {
  src: string;
  thumbnail?: boolean;
  original?: boolean;
  detail?: boolean;
};

export function ProductImage({
  src,
  thumbnail = false,
  original = false,
  detail = false,
  loading = "lazy",
  decoding = "async",
  onError,
  sizes,
  ...props
}: Props) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const useOriginal = original || failedSource === src;
  const displaySource = productImageUrl(src, thumbnail ? 128 : detail ? 768 : 384);
  const optimized = !useOriginal && displaySource !== src;
  const widths = thumbnail
    ? ([128, 256] as const)
    : detail
      ? ([384, 640, 768, 1024, 1280] as const)
      : ([256, 384, 640, 768] as const);
  useEffect(() => {
    // An optimizer failure can happen before React attaches handlers during hydration.
    if (optimized && imageRef.current?.complete && imageRef.current.naturalWidth === 0)
      setFailedSource(src);
  }, [src, optimized]);
  return (
    <img
      {...props}
      ref={imageRef}
      src={optimized ? displaySource : src}
      srcSet={
        optimized
          ? widths.map((width) => `${productImageUrl(src, width)} ${width}w`).join(", ")
          : undefined
      }
      sizes={
        optimized
          ? (sizes ??
            (thumbnail
              ? "80px"
              : detail
                ? "(min-width: 1024px) 560px, 100vw"
                : "(min-width: 1280px) 300px, (min-width: 640px) 33vw, 50vw"))
          : undefined
      }
      loading={loading}
      decoding={decoding}
      onError={(event) => {
        if (optimized) setFailedSource(src);
        else onError?.(event);
      }}
    />
  );
}
