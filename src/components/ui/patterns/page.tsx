import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type PropsWithChildren, type Ref } from "react";

import { cn } from "@/shell/lib/utils";

/**
 * Page — Layer 3 semantic primitive.
 *
 * Centered, max-width page column. Encodes the recurring
 * `mx-auto w-full max-w-2xl flex flex-col` shell with optional viewport
 * pinning and page padding.
 */

const pageVariants = cva("mx-auto flex w-full flex-col", {
  variants: {
    height: {
      auto: "min-h-svh",
      screen: "h-svh",
    },
    padded: {
      true: "p-6",
      false: "",
    },
  },
  defaultVariants: {
    height: "auto",
    padded: true,
  },
});

type PageVariantProps = VariantProps<typeof pageVariants>;

interface PageProps {
  /** "auto" grows with content (min-h-svh); "screen" pins to the viewport. */
  height?: NonNullable<PageVariantProps["height"]>;
  /** Apply page padding. @default true */
  padded?: boolean;
  as?: "div" | "main" | "section" | "article";
}

export const Page = forwardRef<HTMLElement, PropsWithChildren<PageProps>>(
  function Page(
    { height = "auto", padded = true, as: Element = "div", children },
    ref,
  ) {
    return (
      <Element
        ref={ref as Ref<any>}
        className={cn(pageVariants({ height, padded }))}
      >
        {children}
      </Element>
    );
  },
);

Page.displayName = "Page";
