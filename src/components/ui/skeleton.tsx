import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const skeletonVariants = cva("bg-accent animate-pulse rounded-md", {
  variants: {
    size: {
      sm: "h-4 w-24",
      lg: "h-4 w-32",
      full: "h-4 w-full",
      half: "h-4 w-1/2",
    },
    shape: {
      square: "rounded-md",
      circle: "rounded-full",
      button: "rounded-md h-8",
    },
  },
});

function Skeleton({
  className,
  size = "sm",
  shape = "square",
  ...props
}: React.ComponentProps<"div"> & {
  size?: "sm" | "lg" | "full" | "half";
  shape?: "square" | "circle" | "button";
}) {
  return (
    <div
      data-slot="skeleton"
      className={cn(skeletonVariants({ size, shape }), className)}
      {...props}
    />
  );
}

export { Skeleton };
