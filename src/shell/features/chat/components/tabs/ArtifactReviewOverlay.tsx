// local primitive — a freehand region selector drawn over a frozen artifact
// screenshot. The selection surface, rubber-band rect, and dimming mask are raw
// DOM with scoped classes (an allowed escape hatch, like the artifact iframe);
// the annotation panel uses Tangle UI primitives.
import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/typography";

import { ReviewAnnotationPanel } from "./ReviewAnnotationPanel";
import { clamp, cropRegion, normalizeRect, type Rect } from "./reviewGeometry";

interface ArtifactReviewOverlayProps {
  /** Frozen screenshot of the artifact, at capture resolution. */
  image: HTMLCanvasElement;
  /** Data URL of {@link image}, used for display. */
  imageUrl: string;
  /** True while the cropped image is being uploaded/sent. */
  submitting?: boolean;
  /** Receives the cropped region and the user's note. */
  onSubmit: (blob: Blob, note: string) => void;
  /** Dismisses the overlay without sending. */
  onCancel: () => void;
}

/** Ignore stray clicks: a real selection must exceed this size (CSS px). */
const MIN_SELECTION = 6;

export function ArtifactReviewOverlay({
  image,
  imageUrl,
  submitting = false,
  onSubmit,
  onCancel,
}: ArtifactReviewOverlayProps) {
  const [phase, setPhase] = useState<"selecting" | "annotating">("selecting");
  const [selection, setSelection] = useState<Rect | null>(null);
  const [note, setNote] = useState("");
  const surfaceRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // Escape always backs out of review mode.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  function pointAt(e: ReactPointerEvent): { x: number; y: number } {
    const box = surfaceRef.current?.getBoundingClientRect();
    if (!box) return { x: 0, y: 0 };
    return {
      x: clamp(e.clientX - box.left, 0, box.width),
      y: clamp(e.clientY - box.top, 0, box.height),
    };
  }

  function handlePointerDown(e: ReactPointerEvent) {
    if (phase !== "selecting") return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const start = pointAt(e);
    dragStartRef.current = start;
    setSelection({ x: start.x, y: start.y, w: 0, h: 0 });
  }

  function handlePointerMove(e: ReactPointerEvent) {
    const start = dragStartRef.current;
    if (!start) return;
    setSelection(normalizeRect(start, pointAt(e)));
  }

  function handlePointerUp(e: ReactPointerEvent) {
    const start = dragStartRef.current;
    if (!start) return;
    dragStartRef.current = null;
    const rect = normalizeRect(start, pointAt(e));
    if (rect.w < MIN_SELECTION || rect.h < MIN_SELECTION) {
      setSelection(null);
      return;
    }
    setSelection(rect);
    setPhase("annotating");
  }

  function reselect() {
    setSelection(null);
    setPhase("selecting");
  }

  async function handleSend() {
    const box = surfaceRef.current;
    if (!selection || submitting || !box) return;
    const blob = await cropRegion(image, box, selection);
    if (blob) onSubmit(blob, note);
  }

  return (
    <div
      ref={surfaceRef}
      role="application"
      aria-label="Select a region to review"
      className="absolute inset-0 z-20 overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <img
        src={imageUrl}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
      />

      {selection ? (
        <div
          className="pointer-events-none absolute border-2 border-primary"
          style={{
            left: selection.x,
            top: selection.y,
            width: selection.w,
            height: selection.h,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.45)",
          }}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-black/30" />
      )}

      {phase === "selecting" ? (
        <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
          <Box
            background="inverted"
            paddingInline="base"
            paddingBlock="xs"
            borderRadius="full"
            shadow="md"
          >
            <Text size="xs">Drag to select a region, then add a note</Text>
          </Box>
        </div>
      ) : null}

      {phase === "selecting" ? (
        <div className="absolute inset-0 cursor-crosshair" aria-hidden />
      ) : null}

      {phase === "annotating" && selection ? (
        <ReviewAnnotationPanel
          note={note}
          submitting={submitting}
          onNoteChange={setNote}
          onReselect={reselect}
          onCancel={onCancel}
          onSend={() => void handleSend()}
        />
      ) : null}
    </div>
  );
}
