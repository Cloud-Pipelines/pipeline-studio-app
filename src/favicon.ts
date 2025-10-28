class FaviconManager {
  private defaultFavicon = "/favicon.ico";
  private statusIcons = {
    success: "/favicon-success.ico",
    failed: "/favicon-failed.ico",
    loading: "/favicon-loading.ico",
    paused: "/favicon-paused.ico",
  };

  updateFavicon(
    status: "success" | "failed" | "loading" | "paused" | "default",
  ) {
    const link =
      (document.querySelector("link[rel*='icon']") as HTMLLinkElement) ||
      document.createElement("link");

    link.type = "image/x-icon";
    link.rel = "shortcut icon";
    link.href =
      status === "default" ? this.defaultFavicon : this.statusIcons[status];

    if (!document.querySelector("link[rel*='icon']")) {
      document.getElementsByTagName("head")[0].appendChild(link);
    }
  }

  reset() {
    this.updateFavicon("default");
  }
}

export const faviconManager = new FaviconManager();
