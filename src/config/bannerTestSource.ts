import {
  BANNER_SOURCE_EVENT,
  type TangleBanner,
  type TangleBannerSource,
} from "@/config/banners";

export function installRawSource(source: unknown) {
  window.__TANGLE_BANNER_SOURCE__ = source as TangleBannerSource;
  window.dispatchEvent(new CustomEvent(BANNER_SOURCE_EVENT));
}

export function installSource(banners: Partial<TangleBanner>[]) {
  installRawSource({
    version: 1,
    getSnapshot: () => banners,
    subscribe: () => () => {},
  });
}
