import { BANNER_SOURCE_EVENT } from "@/config/banners";

export function installRawSource(source: unknown) {
  window.__TANGLE_BANNER_SOURCE__ = source;
  window.dispatchEvent(new CustomEvent(BANNER_SOURCE_EVENT));
}
