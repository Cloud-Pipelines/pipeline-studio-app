import type {
  BindingSnapshot,
  NodeSnapshot,
} from "@/routes/v2/shared/nodes/types";

const CLIPBOARD_ENVELOPE_TYPE = "tangle-pipeline-nodes";

export interface ClipboardEnvelope {
  _type: typeof CLIPBOARD_ENVELOPE_TYPE;
  snapshots: NodeSnapshot[];
  bindings: BindingSnapshot[];
}

function isClipboardEnvelope(data: unknown): data is ClipboardEnvelope {
  return (
    typeof data === "object" &&
    data !== null &&
    "_type" in data &&
    (data as Record<string, unknown>)._type === CLIPBOARD_ENVELOPE_TYPE
  );
}

function parseEnvelope(text: string): ClipboardEnvelope | null {
  try {
    const parsed: unknown = JSON.parse(text);
    return isClipboardEnvelope(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export type SystemClipboardInfo =
  | { kind: "envelope"; envelope: ClipboardEnvelope }
  | { kind: "text"; text: string }
  | { kind: "empty" }
  | { kind: "unavailable" };

export async function readSystemClipboardInfo(): Promise<SystemClipboardInfo> {
  try {
    const text = await navigator.clipboard.readText();
    if (!text) return { kind: "empty" };
    const envelope = parseEnvelope(text);
    return envelope ? { kind: "envelope", envelope } : { kind: "text", text };
  } catch {
    return { kind: "unavailable" };
  }
}

export type ClipboardReadResult =
  | { kind: "envelope"; envelope: ClipboardEnvelope }
  | { kind: "no-nodes" }
  | { kind: "unavailable" };

/**
 * Reads the envelope out of a native `paste` event.
 *
 * Preferred over `readEnvelopeFromSystemClipboard`: `ClipboardEvent.clipboardData`
 * needs no clipboard-read permission, so it works in every browser without a
 * prompt. That is what makes pasting between tabs and instances viable —
 * `navigator.clipboard.readText()` is gated behind a permission in Chrome and
 * is not freely available to pages in Firefox.
 */
export function readEnvelopeFromPasteEvent(
  event: ClipboardEvent,
): ClipboardReadResult {
  if (!event.clipboardData) return { kind: "unavailable" };
  const text = event.clipboardData.getData("text/plain");
  const envelope = text ? parseEnvelope(text) : null;
  return envelope ? { kind: "envelope", envelope } : { kind: "no-nodes" };
}

export async function readEnvelopeFromSystemClipboard(): Promise<ClipboardReadResult> {
  try {
    const text = await navigator.clipboard.readText();
    const envelope = text ? parseEnvelope(text) : null;
    return envelope ? { kind: "envelope", envelope } : { kind: "no-nodes" };
  } catch {
    return { kind: "unavailable" };
  }
}

/** Rejects when the clipboard is unwritable, so callers can tell the user. */
export async function writeToSystemClipboard(
  snapshots: NodeSnapshot[],
  bindings: BindingSnapshot[],
): Promise<void> {
  const envelope: ClipboardEnvelope = {
    _type: CLIPBOARD_ENVELOPE_TYPE,
    snapshots,
    bindings,
  };
  await navigator.clipboard.writeText(JSON.stringify(envelope));
}
