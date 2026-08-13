// local primitive
import { type DragEvent, type PropsWithChildren, useState } from "react";

import { Text } from "@/components/ui/typography";
import { cn } from "@/shell/lib/utils";

interface FileDropZoneProps {
  /** Called with the files when a drop completes (ignored while disabled). */
  onFilesDropped: (files: File[]) => void;
  /** When true, drops are ignored and no highlight is shown. */
  disabled?: boolean;
}

/** True when the drag payload carries files (vs. text/links/etc.). */
function hasFiles(e: DragEvent<HTMLDivElement>): boolean {
  return Array.from(e.dataTransfer.types).includes("Files");
}

/**
 * Wraps the chat composer to accept dragged files. Tracks a drag-depth counter
 * so nested enter/leave events don't flicker the drag-over highlight.
 */
export function FileDropZone({
  onFilesDropped,
  disabled,
  children,
}: PropsWithChildren<FileDropZoneProps>) {
  const [dragDepth, setDragDepth] = useState(0);
  const isDragging = !disabled && dragDepth > 0;

  function handleDragEnter(e: DragEvent<HTMLDivElement>) {
    if (disabled || !hasFiles(e)) return;
    e.preventDefault();
    setDragDepth((depth) => depth + 1);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    if (disabled || !hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    if (disabled || !hasFiles(e)) return;
    e.preventDefault();
    setDragDepth((depth) => Math.max(0, depth - 1));
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    if (disabled || !hasFiles(e)) return;
    e.preventDefault();
    setDragDepth(0);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) onFilesDropped(dropped);
  }

  return (
    <div
      className="relative w-full"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-md border-2 border-dashed border-primary bg-background/80 transition-opacity",
          isDragging ? "opacity-100" : "opacity-0",
        )}
      >
        <Text tone="subdued" weight="medium">
          Drop files to attach
        </Text>
      </div>
    </div>
  );
}
