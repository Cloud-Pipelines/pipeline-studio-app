import { cva, type VariantProps } from "class-variance-authority";
import type { AriaRole, PropsWithChildren } from "react";

import { cn } from "@/shell/lib/utils";

/**
 * CenteredScreen — Layer 3 semantic primitive.
 *
 * Full-viewport, vertically + horizontally centered column. Encodes the
 * recurring `flex min-h-svh flex-col items-center justify-center p-6` shell used
 * for hero, not-found, and error screens.
 */

const centeredScreenVariants = cva(
  "flex min-h-svh flex-col items-center justify-center p-6",
  {
    variants: {
      gap: {
        "4": "gap-4",
        "6": "gap-6",
      },
    },
    defaultVariants: {
      gap: "6",
    },
  },
);

type CenteredScreenVariantProps = VariantProps<typeof centeredScreenVariants>;

interface CenteredScreenProps {
  gap?: NonNullable<CenteredScreenVariantProps["gap"]>;
  role?: AriaRole;
}

export function CenteredScreen({
  gap = "6",
  role,
  children,
}: PropsWithChildren<CenteredScreenProps>) {
  return (
    <div role={role} className={cn(centeredScreenVariants({ gap }))}>
      {children}
    </div>
  );
}

CenteredScreen.displayName = "CenteredScreen";
