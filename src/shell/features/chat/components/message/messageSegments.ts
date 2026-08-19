import type { ChatMessage as ChatMessageType } from "@/shell/features/chat/model/types";

// A visible message renders normally; a run of one or more consecutive
// collapsed messages is grouped so it can render as a single hidden affordance.
export type RenderSegment =
  | { kind: "visible"; message: ChatMessageType }
  | { kind: "collapsed"; messages: ChatMessageType[] };

/** Groups consecutive collapsed messages into runs, preserving order. */
export function buildSegments(
  messages: ChatMessageType[],
  isCollapsed: (message: ChatMessageType) => boolean,
): RenderSegment[] {
  const segments: RenderSegment[] = [];
  let run: ChatMessageType[] = [];

  const flushRun = () => {
    if (run.length === 0) return;
    segments.push({ kind: "collapsed", messages: run });
    run = [];
  };

  for (const message of messages) {
    if (isCollapsed(message)) {
      run.push(message);
      continue;
    }
    flushRun();
    segments.push({ kind: "visible", message });
  }
  flushRun();

  return segments;
}
