import { cva } from "class-variance-authority";
import {
  type AriaAttributes,
  forwardRef,
  type PropsWithChildren,
  type Ref,
} from "react";

import { cn } from "@/lib/utils";

type BlockStackAlign = "start" | "center" | "end" | "stretch";

type Gap = "0" | "1" | "2" | "3" | "4";

type StackElement = "div" | "span" | "li" | "ol" | "ul";

interface BlockStackProps extends AriaAttributes {
  /** HTML Element type
   * @default 'div'
   */
  as?: StackElement;
  /** Horizontal alignment of children */
  align?: BlockStackAlign;
  /** Horizontal alignment of children */
  inlineAlign?: InlineStackAlign;
  /** The spacing between elements.
   */
  gap?: Gap;
  /** Additional CSS classes */
  className?: string;
}

const blockStackVariants = cva("flex flex-col w-full", {
  variants: {
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    } as Record<BlockStackAlign, string>,
    inlineAlign: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      "space-around": "justify-around",
      "space-between": "justify-between",
      "space-evenly": "justify-evenly",
    } as Record<InlineStackAlign, string>,
    gap: {
      "0": "gap-0",
      "1": "gap-1",
      "2": "gap-2",
      "3": "gap-3",
      "4": "gap-4",
    } as Record<Gap, string>,
  },
});

export const BlockStack = forwardRef<
  HTMLElement,
  PropsWithChildren<BlockStackProps>
>((props, ref) => {
  const {
    as: Element = "div",
    className = "",
    align = "start",
    inlineAlign = "start",
    gap = "0",
    children,
    ...rest
  } = props;

  return (
    <Element
      className={cn(
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

type InlineStackAlign =
  | "start"
  | "center"
  | "end"
  | "space-around"
  | "space-between"
  | "space-evenly";

type BlockAlign = "start" | "center" | "end" | "baseline" | "stretch";

type Wrap = "wrap" | "nowrap";

const inlineStackVariants = cva("flex flex-row", {
  variants: {
    align: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      "space-around": "justify-around",
      "space-between": "justify-between",
      "space-evenly": "justify-evenly",
    } as Record<InlineStackAlign, string>,
    blockAlign: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      baseline: "items-baseline",
      stretch: "items-stretch",
    } as Record<BlockAlign, string>,
    gap: {
      "0": "gap-0",
      "1": "gap-1",
      "2": "gap-2",
      "3": "gap-3",
      "4": "gap-4",
    } as Record<Gap, string>,
    wrap: {
      wrap: "flex-wrap",
      nowrap: "flex-nowrap",
    } as Record<Wrap, string>,
  },
});

interface InlineStackProps extends AriaAttributes {
  /** HTML Element type
   * @default 'div'
   */
  as?: StackElement;
  /** Horizontal alignment of children */
  align?: InlineStackAlign;
  /** Vertical alignment of children */
  blockAlign?: BlockAlign;
  /** The spacing between elements.
   * gap='200'
   */
  gap?: Gap;
  /** Wrap stack elements to additional rows as needed on small screens
   * @default true
   */
  wrap?: Wrap;
  /** Additional CSS classes */
  className?: string;
}

export const InlineStack = forwardRef<
  HTMLElement,
  PropsWithChildren<InlineStackProps>
>((props, ref) => {
  const {
    as: Element = "div",
    align = "start",
    blockAlign = "start",
    gap = "0",
    wrap = "wrap",
    children,
    className = "",
    ...rest
  } = props;

  return (
    <Element
      className={cn(
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
