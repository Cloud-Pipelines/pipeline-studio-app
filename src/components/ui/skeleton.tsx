import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const skeletonVariants = cva("bg-accent animate-pulse rounded-md", {
  variants: {
    size: {
      sm: "h-4 w-24",
      lg: "h-4 w-32",
    },
  },
});

function Skeleton({
  className,
  size = "sm",
  ...props
}: React.ComponentProps<"div"> & { size?: "sm" | "lg" }) {
  return (
    <div
      data-slot="skeleton"
      className={cn(skeletonVariants({ size }), className)}
      {...props}
    />
  );
}

export { Skeleton };
