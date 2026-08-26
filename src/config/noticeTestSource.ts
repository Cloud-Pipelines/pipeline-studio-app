import { NOTICE_SOURCE_EVENT, type TangleNotice } from "@/config/notices";

export function installRawSource(source: unknown) {
  window.__TANGLE_NOTICE_SOURCE__ = source;
  window.dispatchEvent(new CustomEvent(NOTICE_SOURCE_EVENT));
}

export function installSource(notices: Partial<TangleNotice>[]) {
  installRawSource({
    version: 1,
    getSnapshot: () => notices,
    subscribe: () => () => {},
  });
}
