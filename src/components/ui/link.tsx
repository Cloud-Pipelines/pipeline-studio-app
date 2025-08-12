import { cva } from "class-variance-authority";
import { DownloadIcon, ExternalLink } from "lucide-react";
import { type AnchorHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const linkVariants = cva("items-center inline-flex cursor-pointer", {
  variants: {
    variant: {
      default: "text-primary",
      link: "text-primary hover:underline",
      disabled: "text-muted-foreground cursor-not-allowed pointer-events-none",
    },
    size: {
      default: "",
      sm: "text-sm",
      lg: "text-lg",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  external?: boolean;
  download?: boolean;
  iconClassName?: string;
  variant?: "default" | "link" | "disabled";
  size?: "default" | "sm" | "lg";
}

function Link({
  external,
  children,
  className,
  download,
  iconClassName,
  variant,
  size,
  ...props
}: LinkProps) {
  const target = external || download ? "_blank" : undefined;
  const rel = external || download ? "noopener noreferrer" : undefined;

  return (
    <a
      target={target}
      rel={rel}
      {...props}
      className={cn(linkVariants({ variant, size }), className)}
    >
      {children}
      {external && <ExternalLink className={cn("h-4", iconClassName)} />}
      {download && <DownloadIcon className={cn("h-4", iconClassName)} />}
    </a>
  );
}

export { Link };
