import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { VirtualizerHandle } from "virtua";

import type { ChatMessage } from "@/shell/features/chat/model/types";

// Distance (px) from the bottom within which we still consider the view
// "at the bottom". Generous enough to absorb sub-pixel rounding between
// virtua's measured sizes and the DOM after a programmatic scroll.
const PIN_THRESHOLD_PX = 32;

// After any real user scroll input we suppress auto-snapping for this long, so a
// re-measure or streaming-growth snap can't yank the view back down mid-gesture.
const SCROLL_QUIET_MS = 200;

interface UseChatScrollParams {
  messages: ChatMessage[];
  currentAuthorId: string;
  /** Number of virtualized rows (messages, collapsed groups, activity bubble). */
  rowCount: number;
}

interface UseChatScroll {
  containerRef: React.RefObject<HTMLDivElement | null>;
  virtualizerRef: React.RefObject<VirtualizerHandle | null>;
  /** Pass to `<Virtualizer onScroll>`. */
  onScroll: () => void;
  showJump: boolean;
  unreadCount: number;
  jumpToBottom: () => void;
}

function scrollToLastRow(handle: VirtualizerHandle | null, rowCount: number) {
  if (!handle || rowCount === 0) return;
  const lastIndex = rowCount - 1;
  const align =
    handle.getItemSize(lastIndex) > handle.viewportSize ? "start" : "end";
  handle.scrollToIndex(lastIndex, { align });
}

/**
 * Stick-to-bottom + unread-pill bookkeeping for the chat list.
 *
 * The tricky part with a virtualizer is that row sizes are measured
 * asynchronously after mount (and again as markdown/images/streaming deltas
 * render). During that settling the scroll offset briefly looks "not at the
 * bottom", so we must NOT treat every such offset as the user scrolling away —
 * otherwise we unpin, show the jump pill, and leave the list stranded.
 *
 * Instead we keep a `sticky` intent that only the user can clear, via real
 * scroll gestures (wheel / touch / pointer drag / keyboard). Any other drift
 * away from the bottom while sticky (measurement jumps, appended rows, content
 * growth) snaps straight back down. Everything is driven through virtua's
 * handle so we never read or write the DOM scroll position directly.
 */
export function useChatScroll({
  messages,
  currentAuthorId,
  rowCount,
}: UseChatScrollParams): UseChatScroll {
  const containerRef = useRef<HTMLDivElement>(null);
  const virtualizerRef = useRef<VirtualizerHandle>(null);

  // Whether we want the view glued to the bottom. Only a user gesture clears it.
  const stickyRef = useRef(true);
  // Set while a user scroll gesture is in flight, so `onScroll` can tell a real
  // scroll-away from virtua's own measurement/append driven offset changes.
  const userScrolledRef = useRef(false);
  // Timestamp (performance.now) of the most recent user scroll input. Auto-snap
  // backs off while this is fresh so it never fights a gesture in progress.
  const lastUserScrollAtRef = useRef(0);
  const prevLenRef = useRef(0);
  const didInitRef = useRef(false);

  const [showJump, setShowJump] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Latest row count kept in a ref so the scroll helpers stay stable and don't
  // need `rowCount` as a dependency.
  const rowCountRef = useRef(rowCount);
  useEffect(() => {
    rowCountRef.current = rowCount;
  });

  const scrollToBottom = () => {
    scrollToLastRow(virtualizerRef.current, rowCountRef.current);
  };

  // True once enough time has passed since the last user scroll input that an
  // auto-snap won't fight a gesture still in progress.
  const isScrollQuiet = () =>
    performance.now() - lastUserScrollAtRef.current > SCROLL_QUIET_MS;

  const onScroll = () => {
    const handle = virtualizerRef.current;
    if (!handle) return;

    const distanceFromBottom =
      handle.scrollSize - handle.scrollOffset - handle.viewportSize;
    const atBottom = distanceFromBottom <= PIN_THRESHOLD_PX;

    if (atBottom) {
      stickyRef.current = true;
      userScrolledRef.current = false;
      setShowJump(false);
      setUnreadCount(0);
      return;
    }

    if (userScrolledRef.current) {
      // A genuine scroll up: release the bottom and surface the jump pill.
      stickyRef.current = false;
      setShowJump(true);
    } else if (stickyRef.current && isScrollQuiet()) {
      // Drift from measurement/append while still pinned: snap back down, but
      // only once the user's last gesture has settled.
      scrollToBottom();
    }
  };

  const jumpToBottom = () => {
    stickyRef.current = true;
    userScrolledRef.current = false;
    setShowJump(false);
    setUnreadCount(0);
    scrollToBottom();
  };

  // First load snaps to the bottom before paint. virtua re-measures rows right
  // after, and the ResizeObserver below re-snaps while sticky, so this lands
  // even though the initial sizes are estimates.
  useLayoutEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    prevLenRef.current = messages.length;
    if (messages.length > 0) scrollToBottom();
  }, [messages.length]);

  // A count increase (new message, not a streaming delta) snaps own sends and
  // sticky views, else tallies the unread pill.
  useEffect(() => {
    const prevLen = prevLenRef.current;
    prevLenRef.current = messages.length;

    if (!didInitRef.current) return;
    if (messages.length <= prevLen) return;

    const lastMessage = messages[messages.length - 1];
    const isOwnSend = lastMessage?.author.id === currentAuthorId;

    if (isOwnSend || stickyRef.current) {
      stickyRef.current = true;
      userScrolledRef.current = false;
      setShowJump(false);
      setUnreadCount(0);
      scrollToBottom();
    } else {
      setUnreadCount((count) => count + (messages.length - prevLen));
      setShowJump(true);
    }
  }, [messages, currentAuthorId]);

  // Re-snap to the bottom whenever virtua's content resizes while sticky (row
  // measurement, streaming growth, a hidden tab becoming visible). We observe
  // virtua's own sized element — the scroll container's only child — and also
  // mark user scroll gestures here so `onScroll` can distinguish them.
  // Re-runs when the list flips between empty and populated so it tracks
  // whichever element virtua mounts.
  const hasRows = rowCount > 0;
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const markUserScroll = () => {
      userScrolledRef.current = true;
      lastUserScrollAtRef.current = performance.now();
    };
    const clearUserScroll = () => {
      userScrolledRef.current = false;
    };
    container.addEventListener("wheel", markUserScroll, { passive: true });
    container.addEventListener("touchmove", markUserScroll, { passive: true });
    container.addEventListener("keydown", markUserScroll);
    container.addEventListener("pointerdown", markUserScroll);
    container.addEventListener("pointerup", clearUserScroll);
    container.addEventListener("touchend", clearUserScroll);

    const inner = container.firstElementChild;
    const observer = new ResizeObserver(() => {
      if (stickyRef.current && isScrollQuiet()) {
        scrollToLastRow(virtualizerRef.current, rowCountRef.current);
      }
    });
    if (inner) observer.observe(inner);

    return () => {
      container.removeEventListener("wheel", markUserScroll);
      container.removeEventListener("touchmove", markUserScroll);
      container.removeEventListener("keydown", markUserScroll);
      container.removeEventListener("pointerdown", markUserScroll);
      container.removeEventListener("pointerup", clearUserScroll);
      container.removeEventListener("touchend", clearUserScroll);
      observer.disconnect();
    };
  }, [hasRows]);

  return {
    containerRef,
    virtualizerRef,
    onScroll,
    showJump,
    unreadCount,
    jumpToBottom,
  };
}
