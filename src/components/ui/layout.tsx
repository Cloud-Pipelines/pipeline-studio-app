import { cva, type VariantProps } from "class-variance-authority";
import {
  type AriaAttributes,
  forwardRef,
  type PropsWithChildren,
  type Ref,
} from "react";

import { cn } from "@/lib/utils";

type StackElement = "div" | "span" | "li" | "ol" | "ul" | "dl";

const blockStackVariants = cva("flex flex-col w-full", {
  variants: {
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    },
    inlineAlign: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      "space-around": "justify-around",
      "space-between": "justify-between",
      "space-evenly": "justify-evenly",
    },
    gap: {
      "0": "gap-0",
      "0.5": "gap-0.5",
      "1": "gap-1",
      "1.5": "gap-1.5",
      "2": "gap-2",
      "3": "gap-3",
      "4": "gap-4",
      "5": "gap-5",
      "6": "gap-6",
      "8": "gap-8",
    },
  },
});

interface BlockStackProps
  extends AriaAttributes, VariantProps<typeof blockStackVariants> {
  as?: StackElement;
  /** Fill the container and center content */
  fill?: boolean;
  /** Grow to fill the main axis of a flex parent and host a scroll region. */
  grow?: boolean;
  className?: string;
}

export const BlockStack = forwardRef<
  HTMLElement,
  PropsWithChildren<BlockStackProps>
>((props, ref) => {
  const {
    as: Element = "div",
    fill = false,
    grow = false,
    className = "",
    align = fill ? "center" : "start",
    inlineAlign = fill ? "center" : "start",
    gap = "0",
    children,
    ...rest
  } = props;

  return (
    <Element
      className={cn(
        { "h-full w-full": fill },
        { "min-h-0 min-w-0 flex-1": grow },
        blockStackVariants({ align, inlineAlign, gap }),
        className.split(" "),
      )}
      {...rest}
      ref={ref as Ref<any>}
    >
      {children}
    </Element>
  );
});

BlockStack.displayName = "BlockStack";

const inlineStackVariants = cva("flex flex-row", {
  variants: {
    align: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      "space-around": "justify-around",
      "space-between": "justify-between",
      "space-evenly": "justify-evenly",
    },
    blockAlign: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      baseline: "items-baseline",
      stretch: "items-stretch",
    },
    gap: {
      "0": "gap-0",
      "0.5": "gap-0.5",
      "1": "gap-1",
      "1.5": "gap-1.5",
      "2": "gap-2",
      "3": "gap-3",
      "4": "gap-4",
      "5": "gap-5",
      "6": "gap-6",
      "8": "gap-8",
    },
    wrap: {
      wrap: "flex-wrap",
      nowrap: "flex-nowrap",
    },
  },
});

interface InlineStackProps
  extends AriaAttributes, VariantProps<typeof inlineStackVariants> {
  as?: StackElement;
  /** Fill the container and center content */
  fill?: boolean;
  /** Grow to fill the main axis of a flex parent and host a scroll region. */
  grow?: boolean;
  className?: string;
}

export const InlineStack = forwardRef<
  HTMLElement,
  PropsWithChildren<InlineStackProps>
>((props, ref) => {
  const {
    as: Element = "div",
    fill = false,
    grow = false,
    align = fill ? "center" : "start",
    blockAlign = "center",
    gap = "0",
    wrap = "wrap",
    children,
    className = "",
    ...rest
  } = props;

  return (
    <Element
      className={cn(
        { "h-full w-full": fill },
        { "min-h-0 min-w-0 flex-1": grow },
        inlineStackVariants({ align, blockAlign, gap, wrap }),
        className,
      )}
      {...rest}
      ref={ref as Ref<any>}
    >
      {children}
    </Element>
  );
});

InlineStack.displayName = "InlineStack";
