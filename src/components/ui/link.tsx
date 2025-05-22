import { DownloadIcon, ExternalLink } from "lucide-react";
import { type AnchorHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  external?: boolean;
  download?: boolean;
  iconClassName?: string;
}

function Link({
  external,
  children,
  className,
  download,
  iconClassName,
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
      {external && <ExternalLink className={cn("h-4", iconClassName)} />}
      {download && <DownloadIcon className={cn("h-4", iconClassName)} />}
    </a>
  );
}

export { Link };
