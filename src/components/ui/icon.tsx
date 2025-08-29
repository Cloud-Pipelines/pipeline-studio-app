import { cva, type VariantProps } from "class-variance-authority";
import { icons } from "lucide-react";

import { cn } from "@/lib/utils";

const iconVariants = cva("", {
  variants: {
    size: {
      xs: "w-3 h-3",
      sm: "w-3.5 h-3.5",
      md: "w-4 h-4",
      fill: "w-full h-full",
    },
  },
});

interface IconProps extends VariantProps<typeof iconVariants> {
  name: keyof typeof icons;
  className?: string;
}

export const Icon = ({ name: icon, size = "md", className }: IconProps) => {
  const Icon = icons[icon];
  return <Icon className={cn(iconVariants({ size }), className)} />;
};
