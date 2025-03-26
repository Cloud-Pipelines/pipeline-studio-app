import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: number;
  className?: string;
}

const DEFAULT_SIZE = 20;

export function Spinner({ size = DEFAULT_SIZE, className }: SpinnerProps) {
  const strokeWidth = getStrokeWidth(size);

  return (
    <SpinnerIcon
      className={cn("animate-spin text-muted-foreground/50", className)}
      width={`${size}`}
      height={`${size}`}
      strokeWidth={`${strokeWidth}`}
    />
  );
}

function getStrokeWidth(size: number) {
  if (size <= DEFAULT_SIZE) {
    return (2 * size) / DEFAULT_SIZE;
  }
  if (size <= 2 * DEFAULT_SIZE) {
    return size / DEFAULT_SIZE;
  }
  if (size > 2 * DEFAULT_SIZE) {
    return size / (DEFAULT_SIZE * 2);
  }
}

type IconProps = SVGProps<SVGSVGElement>;

function SpinnerIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
