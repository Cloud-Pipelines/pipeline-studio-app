import type { RefObject } from "react";
import { useEffect, useRef } from "react";

import {
  isPageBridgeMessage,
  type PageBridgeMessage,
  type PageCallbackResult,
} from "@/shell/contracts";
import { apiUrl } from "@/shell/lib/basePath";

interface UsePageBridgeOptions {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  sessionId: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Callback paths the bridge may fire — scoped to the current session. */
function callbackPathPattern(sessionId: string): RegExp {
  return new RegExp(
    `^/api/sessions/${escapeRegExp(sessionId)}/triggers/[\\w-]+/callback/[a-f0-9]+$`,
  );
}

function openExternalUrl(raw: string): void {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return;
  window.open(parsed.href, "_blank", "noopener,noreferrer");
}

async function fireCallback(
  message: Extract<PageBridgeMessage, { type: "tangent:callback" }>,
  sessionId: string,
  frame: HTMLIFrameElement,
): Promise<void> {
  if (!callbackPathPattern(sessionId).test(message.path)) return;

  const result: PageCallbackResult = {
    type: "tangent:callback:result",
    requestId: message.requestId,
    ok: false,
    status: 0,
  };
  try {
    const isJson = message.encoding === "json";
    const body = isJson
      ? JSON.stringify(message.body ?? {})
      : new URLSearchParams(message.body ?? {}).toString();
    const response = await fetch(apiUrl(message.path), {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "content-type": isJson
          ? "application/json"
          : "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body,
    });
    result.ok = response.ok;
    result.status = response.status;
  } catch {
    // Network/opaque failures keep the default ok=false, status=0 result.
  }
  frame.contentWindow?.postMessage(result, "*");
}

/**
 * Bridges a sandboxed page-preview iframe to its host. The iframe is opaque
 * origin (no `allow-same-origin`), so it can't read the host's base-prefix or
 * carry the deployment's credentials, and the kube-apiserver proxy rewrites
 * absolute paths baked into served HTML. The page therefore posts a
 * {@link PageBridgeMessage} and the host acts on its behalf: firing a
 * session-scoped trigger callback (URL built at runtime, credentials attached)
 * or opening an external link. Messages are accepted only from this iframe's
 * own window; the message origin is `"null"` and is never trusted.
 */
export function usePageBridge({
  iframeRef,
  sessionId,
}: UsePageBridgeOptions): void {
  const sessionIdRef = useRef(sessionId);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  });

  useEffect(() => {
    function handleMessage(event: MessageEvent): void {
      const frame = iframeRef.current;
      if (!frame || event.source !== frame.contentWindow) return;
      if (!isPageBridgeMessage(event.data)) return;

      const message = event.data;
      if (message.type === "tangent:openUrl") {
        openExternalUrl(message.url);
        return;
      }
      void fireCallback(message, sessionIdRef.current, frame);
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [iframeRef]);
}
