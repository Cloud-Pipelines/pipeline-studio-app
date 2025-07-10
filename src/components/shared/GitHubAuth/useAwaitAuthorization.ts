import { useCallback, useMemo, useRef, useSyncExternalStore } from "react";

import useToastNotification from "@/hooks/useToastNotification";

import { isAuthorizationRequired } from "./helpers";
import { useAuthLocalStorage } from "./useAuthLocalStorage";
import { useGitHubAuthPopup } from "./useGitHubAuthPopup";

function createControlledPromise() {
  let resolve: (value: unknown) => void = () => {};
  let reject: (reason?: unknown) => void = () => {};

  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve,
    reject,
  };
}

export function useAwaitAuthorization() {
  const notify = useToastNotification();
  const promiseRef = useRef<ReturnType<typeof createControlledPromise>>(
    createControlledPromise(),
  );

  const authStorage = useAuthLocalStorage();

  const token = useSyncExternalStore(
    authStorage.subscribe,
    authStorage.getToken,
  );

  const isAuthorized = useMemo(
    () => !isAuthorizationRequired() || !!token,
    [token],
  );

  const { openPopup, isLoading, isPopupOpen, closePopup, bringPopupToFront } =
    useGitHubAuthPopup({
      onSuccess: (response) => {
        notify(`GitHub authentication successful!`, "success");

        authStorage.setToken(`${response.tokenType} ${response.token}`);
        authStorage.setProfile({
          login: response.userData.login,
          avatar_url: response.userData.avatar_url,
        });

        promiseRef.current.resolve(true);
      },
      onError: (error) => {
        notify(`GitHub authentication error: ${error}`, "error");
        authStorage.clear();

        promiseRef.current.reject(new Error(`Authorization failed: ${error}`));
      },
      onClose: () => {
        if (authStorage.getToken()) {
          promiseRef.current.resolve(true);
        } else {
          promiseRef.current.reject(new Error("Authorization required"));
        }
      },
    });

  const awaitAuthorization = useCallback(() => {
    promiseRef.current = createControlledPromise();
    openPopup();
    return promiseRef.current.promise;
  }, [openPopup]);

  return useMemo(
    () => ({
      isAuthorized,
      awaitAuthorization,
      isLoading,
      isPopupOpen,
      closePopup,
      bringPopupToFront,
    }),
    [
      awaitAuthorization,
      isAuthorized,
      isLoading,
      isPopupOpen,
      closePopup,
      bringPopupToFront,
    ],
  );
}
