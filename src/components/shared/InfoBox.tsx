import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface InfoBoxProps {
  title: string;
  className?: string;
  children: ReactNode;
  variant?: "info" | "error" | "warning" | "success";
}

const variantStyles: Record<
  NonNullable<InfoBoxProps["variant"]>,
  { container: string; title: string }
> = {
  info: {
    container: "border-blue-200 bg-blue-50",
    title: "text-blue-800",
  },
  error: {
    container: "border-red-200 bg-red-50",
    title: "text-red-800",
  },
  warning: {
    container: "border-yellow-200 bg-yellow-50",
    title: "text-yellow-800",
  },
  success: {
    container: "border-green-200 bg-green-50",
    title: "text-green-800",
  },
};

export const InfoBox = ({
  title,
  className,
  children,
  variant = "info",
}: InfoBoxProps) => {
  const styles = variantStyles[variant];
  return (
    <div className={`border rounded-md p-2 ${styles.container}`}>
      <div className={`text-sm font-semibold mb-1 ${styles.title}`}>
        {title}
      </div>
      <div className={cn("text-sm", className)}>{children}</div>
    </div>
  );
};
