import { cva } from "class-variance-authority";
import { icons } from "lucide-react";

import { cn } from "@/lib/utils";

const iconVariants = cva("", {
  variants: {
    size: {
      sm: "w-3.5 h-3.5",
      md: "w-4 h-4",
    },
  },
});

export const Icon = ({
  kind: icon,
  size = "md",
  className,
}: {
  kind: keyof typeof icons;
  size?: "sm" | "md";
  className?: string;
}) => {
  const Icon = icons[icon];
  return <Icon className={cn(iconVariants({ size }), className)} />;
};
