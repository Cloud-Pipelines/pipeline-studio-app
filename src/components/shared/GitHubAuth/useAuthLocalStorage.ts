import { useMemo } from "react";

import { getStorage } from "@/utils/typedStorage";

import type { GithubAuthStorage } from "./types";

export function useAuthLocalStorage() {
  const storage = getStorage<keyof GithubAuthStorage, GithubAuthStorage>();

  return useMemo(
    () => ({
      getToken: () => storage.getItem("githubToken"),
      setToken: (token: string) => storage.setItem("githubToken", token),

      getProfile: () => storage.getItem("githubProfile"),
      setProfile: (profile: GithubAuthStorage["githubProfile"]) =>
        storage.setItem("githubProfile", profile),

      clear: () => {
        storage.setItem("githubToken", undefined);
        storage.setItem("githubProfile", undefined);
      },

      /**
       * Subscribe to changes in the local storage
       * @param listener - callback from useSyncExternalStore
       * @returns A function to unsubscribe from the storage changes
       */
      subscribe: (listener: () => void) => {
        function handleStorageChange(event: StorageEvent) {
          if (event.key === "githubToken" || event.key === "githubProfile") {
            console.log("storage changed", event.key);
            listener();
          }
        }
        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
      },
    }),
    [storage],
  );
}
