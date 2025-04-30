import { ExternalLink } from "lucide-react";
import { type AnchorHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  external?: boolean;
}

function Link({ external, children, className, ...props }: LinkProps) {
  return (
    <a
      {...props}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn("items-center inline-flex", className)}
    >
      {children}
      {external && <ExternalLink className="h-4" />}
    </a>
  );
}

export { Link };
