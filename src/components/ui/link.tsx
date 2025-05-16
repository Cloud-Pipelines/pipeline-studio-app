import { DownloadIcon, ExternalLink } from "lucide-react";
import { type AnchorHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  external?: boolean;
  download?: boolean;
}

function Link({
  external,
  children,
  className,
  download,
  ...props
}: LinkProps) {
  const target = external || download ? "_blank" : undefined;
  const rel = external || download ? "noopener noreferrer" : undefined;

  return (
    <a
      target={target}
      rel={rel}
      {...props}
      className={cn("items-center inline-flex", className)}
    >
      {children}
      {external && <ExternalLink className="h-4" />}
      {download && <DownloadIcon className="h-4" />}
    </a>
  );
}

export { Link };
