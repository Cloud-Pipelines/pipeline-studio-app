import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BlockStack } from "@/components/ui/layout";
import { Toolbar } from "@/components/ui/patterns/toolbar";
import type { Attachment } from "@/shell/contracts";
import { uploadFiles } from "@/shell/features/sessions/api/sessionsApi";
import {
  isMarkdownArtifact,
  isPdfArtifact,
} from "@/shell/lib/markdown/artifact";

import { useViewportCapture } from "../../hooks/useViewportCapture";
import { ArtifactMarkdownContent } from "./ArtifactMarkdownContent";
import { ArtifactReviewOverlay } from "./ArtifactReviewOverlay";
import { IframeArtifactBody } from "./IframeArtifactBody";
import { PdfArtifactBody } from "./PdfArtifactBody";

interface ArtifactTabViewProps {
  /** Session that owns the artifact; review screenshots upload into it. */
  sessionId: string;
  /** Resolved artifact URL under the session file API. */
  url: string;
  /** Human-readable title (used for the iframe's accessible name). */
  title: string;
  /** Sends a prompt (with the review screenshot attached) to Prime. */
  onSendPrompt: (content: string, attachments?: Attachment[]) => void;
}

/** The frozen artifact screenshot the review overlay selects within. */
interface FrozenArtifact {
  canvas: HTMLCanvasElement;
  url: string;
}

/**
 * Viewer for an opened "page" artifact. The body is routed by artifact type to
 * a dedicated renderer: Markdown ({@link ArtifactMarkdownContent}), PDF
 * ({@link PdfArtifactBody}, an un-sandboxed `<object>`), or everything else
 * ({@link IframeArtifactBody}, a sandboxed iframe).
 *
 * A "Review" action captures the current tab, crops the shot to the viewer's
 * box, and hands it to {@link ArtifactReviewOverlay} so the user can select a
 * region and send it — with a note — to Prime as visual feedback.
 */
export function ArtifactTabView({
  sessionId,
  url,
  title,
  onSendPrompt,
}: ArtifactTabViewProps) {
  const { captureFrame } = useViewportCapture();
  const viewerRef = useRef<HTMLDivElement>(null);
  const [frozen, setFrozen] = useState<FrozenArtifact | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function toggleFullscreen() {
    void viewerRef.current?.requestFullscreen();
  }

  function renderArtifactBody() {
    switch (true) {
      case isMarkdownArtifact(url):
        return <ArtifactMarkdownContent sessionId={sessionId} url={url} />;
      case isPdfArtifact(url):
        return <PdfArtifactBody url={url} title={title} />;
      default:
        return (
          <IframeArtifactBody sessionId={sessionId} url={url} title={title} />
        );
    }
  }

  function openInNewTab() {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function startReview() {
    setCapturing(true);
    try {
      const frame = await captureFrame();
      const viewer = viewerRef.current;
      if (!frame || !viewer) return;

      // Map the viewer's on-screen box into the capture-resolution frame.
      const rect = viewer.getBoundingClientRect();
      const scaleX = frame.width / window.innerWidth;
      const scaleY = frame.height / window.innerHeight;
      const sx = clampToFrame(rect.left * scaleX, frame.width);
      const sy = clampToFrame(rect.top * scaleY, frame.height);
      const sw = Math.max(1, Math.round(rect.width * scaleX));
      const sh = Math.max(1, Math.round(rect.height * scaleY));

      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(frame.canvas, sx, sy, sw, sh, 0, 0, sw, sh);

      setFrozen({ canvas, url: canvas.toDataURL("image/png") });
    } finally {
      setCapturing(false);
    }
  }

  async function handleReviewSubmit(blob: Blob, note: string) {
    setSubmitting(true);
    try {
      const file = new File([blob], `artifact-review-${Date.now()}.png`, {
        type: "image/png",
      });
      const attachments = await uploadFiles(sessionId, [file]);
      const trimmed = note.trim();
      const content = trimmed
        ? `Review note on "${title}":\n\n${trimmed}`
        : `Review note on "${title}" (see attached screenshot).`;
      onSendPrompt(content, attachments);
      setFrozen(null);
    } catch (err) {
      console.error("[review] failed to send review:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BlockStack grow>
      <Toolbar chrome="light" align="end" aria-label="Artifact actions">
        <Button variant="toolbar" size="xs" onClick={toggleFullscreen}>
          <Icon name="Maximize" size="xs" />
          Fullscreen
        </Button>
        <Button variant="toolbar" size="xs" onClick={openInNewTab}>
          <Icon name="ExternalLink" size="xs" />
          Open in new tab
        </Button>
        <Button
          variant="toolbar"
          size="xs"
          onClick={() => void startReview()}
          disabled={capturing || submitting}
        >
          <Icon name="SquareDashedMousePointer" size="xs" />
          {capturing ? "Capturing..." : "Review"}
        </Button>
      </Toolbar>
      <div ref={viewerRef} className="relative flex min-h-0 w-full flex-1">
        {renderArtifactBody()}
        {frozen ? (
          <ArtifactReviewOverlay
            image={frozen.canvas}
            imageUrl={frozen.url}
            submitting={submitting}
            onSubmit={(blob, note) => void handleReviewSubmit(blob, note)}
            onCancel={() => setFrozen(null)}
          />
        ) : null}
      </div>
    </BlockStack>
  );
}

/** Rounds and clamps a source coordinate into the captured frame bounds. */
function clampToFrame(value: number, max: number): number {
  return Math.min(Math.max(0, Math.round(value)), max);
}
