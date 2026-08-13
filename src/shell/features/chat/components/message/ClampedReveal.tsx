// local primitive — caps tall content behind a fading mask with a click-to-
// expand affordance. Styles a raw <div> via cva, so it is exempt from
// tangle-ui/no-classname-on-primitives.
import { cva } from "class-variance-authority";
import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BlockStack } from "@/components/ui/layout";

// Keep in sync with `max-h-24` (6rem) below; content taller than this collapses
// behind the fade.
const COLLAPSED_MAX_PX = 112;

const clampReveal = cva("", {
  variants: {
    clamped: {
      true: "max-h-28 cursor-pointer overflow-hidden [-webkit-mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)] [mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)]",
      false: "",
    },
  },
  defaultVariants: { clamped: false },
});

interface ClampedRevealProps {
  children: ReactNode;
}

export function ClampedReveal({ children }: ClampedRevealProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () =>
      setOverflowing(el.scrollHeight > COLLAPSED_MAX_PX + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const clamped = overflowing && !expanded;

  function expand() {
    setExpanded(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    expand();
  }

  return (
    <BlockStack gap="1" align="start">
      <div
        ref={contentRef}
        className={clampReveal({ clamped })}
        role={clamped ? "button" : undefined}
        tabIndex={clamped ? 0 : undefined}
        aria-expanded={clamped ? false : undefined}
        aria-label={clamped ? "Expand note" : undefined}
        onClick={clamped ? expand : undefined}
        onKeyDown={clamped ? handleKeyDown : undefined}
      >
        {children}
      </div>
      {overflowing && expanded && (
        <Button variant="ghost" size="xs" onClick={() => setExpanded(false)}>
          <Icon name="ChevronsDownUp" size="xs" />
          Show less
        </Button>
      )}
    </BlockStack>
  );
}
