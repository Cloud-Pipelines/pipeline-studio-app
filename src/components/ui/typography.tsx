import { cva } from "class-variance-authority";
import type { AriaAttributes, AriaRole, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type TextTone = "inherit" | "subdued" | "critical" | "inverted" | "info";
type TextWeight = "regular" | "semibold" | "bold";
type TextSize = "xs" | "sm" | "md" | "lg";
type TextElement =
  | "dt"
  | "dd"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "p"
  | "u"
  | "span"
  | "strong"
  | "legend";

const textVariants = cva("", {
  variants: {
    tone: {
      inherit: "text-foreground",
      subdued: "text-muted-foreground",
      critical: "text-destructive",
      inverted: "text-inverted",
      info: "text-foreground underline decoration-dotted",
    } as Record<TextTone, string>,
    size: {
      xs: "text-xs",
      sm: "text-sm",
      md: "text-md",
      lg: "text-lg",
    } as Record<TextSize, string>,
    weight: {
      regular: "font-regular",
      semibold: "font-semibold",
      bold: "font-bold",
    } as Record<TextWeight, string>,
  },
});

interface TextProps extends PropsWithChildren<AriaAttributes> {
  /**
   * The role of the text element.
   * @default 'text'
   */
  role?: AriaRole;

  /** HTML Element type
   * @default 'span'
   */
  as?: TextElement;
  /** Adjust tone of text
   * @default 'inherit'
   */
  tone?: TextTone;
  /** Font weight
   * @default 'regular'
   */
  size?: TextSize;
  /** Adjust the font size
   * @default 'bodyMd'
   */
  weight?: TextWeight;
}

/**
 * Text component. Wraps any text element and provides a set of default styles.
 * @param param0
 * @returns
 */
export function Text({
  as: Element = "span",
  tone = "inherit",
  size = "md",
  weight = "regular",
  children,
  ...rest
}: TextProps) {
  return (
    <Element className={cn(textVariants({ tone, size, weight }))} {...rest}>
      {children}
    </Element>
  );
}

Text.displayName = "Text";

/**
 * Paragraph component. Wraps the Text component and sets the element to 'p'.
 * @param param0
 * @returns
 */
export function Paragraph({ children, ...rest }: TextProps) {
  return (
    <Text as="p" {...rest}>
      {children}
    </Text>
  );
}

Paragraph.displayName = "Paragraph";

/**
 * Heading component. Wraps the Text component and sets the element to 'h1', 'h2', 'h3', 'h4', 'h5', or 'h6'.
 * @param param0
 * @returns
 */
export const Heading = ({
  children,
  level = 1,
}: PropsWithChildren<{ level: 1 | 2 | 3 | 4 | 5 | 6 }>) => {
  return (
    <Text
      as={`h${level}`}
      size="lg"
      weight="semibold"
      role="heading"
      aria-level={level}
    >
      {children}
    </Text>
  );
};

Heading.displayName = "Heading";
