import { NOTICE_SOURCE_EVENT } from "@/config/notices";

export function installRawSource(source: unknown) {
  window.__TANGLE_NOTICE_SOURCE__ = source;
  window.dispatchEvent(new CustomEvent(NOTICE_SOURCE_EVENT));
}
