import { useCallback, useRef } from "react";

import { Icon } from "@/components/ui/icon";

export const ResizeHandle = ({
  minWidth = 200,
  maxWidth = 600,
}: {
  minWidth?: number;
  maxWidth?: number;
}) => {
  const parentElementRef = useRef<HTMLElement | null>(null);
  const resizingRef = useRef<{ startX: number; startWidth: number } | null>(
    null,
  );

  const captureParentElement = useCallback((element: HTMLElement | null) => {
    parentElementRef.current = element?.parentElement ?? null;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current || !parentElementRef.current) return;

    // Calculate the delta from the initial position
    // Moving left (negative delta) should increase width
    // Moving right (positive delta) should decrease width
    const deltaX = e.clientX - resizingRef.current.startX;
    const newWidth = resizingRef.current.startWidth - deltaX;

    const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

    parentElementRef.current.style.width = `${constrainedWidth}px`;
  }, []);

  const handleMouseUp = useCallback(() => {
    resizingRef.current = null;

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!parentElementRef.current) return;

      resizingRef.current = {
        startX: e.clientX,
        startWidth: parentElementRef.current.offsetWidth,
      };

      // Add global event listeners for smooth tracking
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [handleMouseMove, handleMouseUp],
  );

  return (
    <div
      className="absolute left-0 top-0 w-1 h-full bg-border hover:bg-primary/20 cursor-col-resize transition-colors z-10"
      ref={captureParentElement}
      onMouseDown={handleMouseDown}
    >
      <Icon
        name="GripVertical"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-50 rounded-xs p-1 text-muted-foreground pointer-events-none"
      />
    </div>
  );
};
