import { type MouseEvent, useEffect, useState } from "react";

import { InlineStack } from "@/components/ui/layout";
import { IconButton } from "@/components/ui/patterns/icon-button";
import { Truncating } from "@/components/ui/patterns/truncating";
import { Text } from "@/components/ui/typography";
import { cn } from "@/shell/lib/utils";

/**
 * CopyText — Layer 3 semantic primitive.
 *
 * Inline value with a click-to-copy affordance. The whole row copies on click;
 * a trailing copy button is revealed on hover (or pinned via `alwaysShowButton`)
 * and briefly swaps to a success checkmark after copying. Pass `displayValue`
 * to show a shortened label while still copying the full `value`.
 *
 *   <CopyText value={url} displayValue={truncateMiddle(url, 48)} font="mono" />
 *
 * Renders only phrasing content (spans + a button) so it is valid inside text
 * containers such as a `<dd>`.
 */

type CopyTextSize = "xs" | "sm" | "md" | "lg" | "xl";

interface CopyTextProps {
  /** The value written to the clipboard. */
  value: string;
  /** Optional label shown in place of `value` (e.g. a shortened URL). */
  displayValue?: string;
  /** Keep the copy button visible instead of revealing it on hover. */
  alwaysShowButton?: boolean;
  /** Truncate the displayed value to a single line with an ellipsis. */
  truncate?: boolean;
  /** Text size. Default: `md`. */
  size?: CopyTextSize;
  /** Font family for the value. Default: `default`. */
  font?: "default" | "mono";
}

export function CopyText({
  value,
  displayValue,
  alwaysShowButton = false,
  truncate = false,
  size = "md",
  font = "default",
}: CopyTextProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Clipboard access can be denied (e.g. insecure context); fail silently.
    }
  }

  function handleButtonClick(e: MouseEvent) {
    e.stopPropagation();
    void copy();
  }

  const label = (
    <Text
      size={size}
      font={font}
      tone={copied ? "success" : "inherit"}
      truncate={truncate}
    >
      {displayValue ?? value}
    </Text>
  );

  return (
    <span
      className="group inline-flex max-w-full cursor-pointer"
      onClick={() => void copy()}
      title={value}
    >
      <InlineStack as="span" gap="1" blockAlign="center" wrap="nowrap">
        {truncate ? (
          <Truncating as="span" grow="fill">
            {label}
          </Truncating>
        ) : (
          label
        )}
        <span
          className={cn(
            "shrink-0 transition-opacity duration-150 motion-reduce:transition-none",
            alwaysShowButton || copied
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 focus-within:opacity-100",
          )}
        >
          <IconButton
            icon={copied ? "Check" : "Copy"}
            size="xs"
            tone={copied ? "success" : "default"}
            aria-label={copied ? "Copied" : "Copy"}
            onClick={handleButtonClick}
          />
        </span>
      </InlineStack>
    </span>
  );
}

CopyText.displayName = "CopyText";
