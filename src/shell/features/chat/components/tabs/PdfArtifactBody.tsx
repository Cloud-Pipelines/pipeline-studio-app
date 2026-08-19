// local primitive — renders a PDF "page" artifact via a raw <object>. There is
// no Tangle primitive for embedded documents, so the element with scoped
// classes is an allowed escape hatch.
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

interface PdfArtifactBodyProps {
  /** Resolved artifact URL under the session file API. */
  url: string;
  /** Human-readable title (used for the object's accessible name). */
  title: string;
}

/**
 * Renders a PDF artifact. Chrome renders PDFs with a plugin, which sandboxed
 * iframes disable regardless of `allow-same-origin`, so we use <object> (the
 * browser's own isolated PDF viewer). `type="application/pdf"` prevents the
 * file being sniffed/executed as HTML. The fallback opens the PDF in a new tab
 * if the viewer cannot render it.
 */
export function PdfArtifactBody({ url, title }: PdfArtifactBodyProps) {
  return (
    <object
      data={url}
      type="application/pdf"
      aria-label={title}
      className="absolute inset-0 h-full w-full border-0 bg-white"
    >
      <Button
        variant="toolbar"
        size="xs"
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      >
        <Icon name="ExternalLink" size="xs" />
        Open PDF
      </Button>
    </object>
  );
}
