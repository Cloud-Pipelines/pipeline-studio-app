export const env = {
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  defaultSessionBundleId:
    import.meta.env.VITE_DEFAULT_SESSION_BUNDLE_ID ?? "tangle-oss",
} as const;
