// local primitive — renders an HTML (or other page) artifact inside a
// sandboxed iframe. There is no Tangle iframe primitive, so the raw <iframe>
// element with scoped classes is an allowed escape hatch.

import { useRef } from "react";

import { usePageBridge } from "../../hooks/usePageBridge";

interface IframeArtifactBodyProps {
  /** Session that owns the artifact (scopes bridge callbacks). */
  sessionId: string;
  /** Resolved artifact URL under the session file API. */
  url: string;
  /** Human-readable title (used for the iframe's accessible name). */
  title: string;
}

/**
 * Sandboxed viewer for HTML (and other page) artifacts. Scripts are allowed so
 * interactive pages work, but `allow-same-origin` is intentionally omitted: the
 * frame runs in an opaque origin and cannot reach the app's cookies or APIs.
 * Relative page assets still resolve since they load against the document URL.
 *
 * `allow-popups-to-escape-sandbox` lets `target="_blank"` links open as a normal
 * top-level tab. The sandbox blocks the page from firing trigger callbacks
 * directly, so the server injects a bridge client into served HTML that posts
 * the callback to {@link usePageBridge}, which fires it with the app's
 * credentials on the page's behalf.
 */
export function IframeArtifactBody({
  sessionId,
  url,
  title,
}: IframeArtifactBodyProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  usePageBridge({ iframeRef, sessionId });

  return (
    <iframe
      ref={iframeRef}
      src={url}
      title={title}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
      className="absolute inset-0 h-full w-full border-0 bg-white"
    />
  );
}
