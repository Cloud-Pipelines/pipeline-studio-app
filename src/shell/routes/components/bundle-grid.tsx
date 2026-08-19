import { cva, type VariantProps } from "class-variance-authority";
import type { ImgHTMLAttributes } from "react";

const bundleIconCva = cva("rounded-md object-contain", {
  variants: {
    size: {
      xs: "h-4 w-4",
      sm: "h-6 w-6",
      md: "h-10 w-10",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

/** Square thumbnail rendering an agent bundle's preview SVG. */
export function BundleIconImage({
  src,
  alt,
  size,
  ...props
}: VariantProps<typeof bundleIconCva> & ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img src={src} alt={alt} className={bundleIconCva({ size })} {...props} />
  );
}
