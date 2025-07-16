import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import useToastNotification from "@/hooks/useToastNotification";
import { getBackendUrlFromEnv } from "@/utils/URL";

type BackendContextType = {
  available: boolean;
  backendUrl: string;
  ping: () => Promise<boolean>;
  setBackendUrl: (url: string) => void;
  resetBackendUrl: () => void;
};

const BackendContext = createContext<BackendContextType | undefined>(undefined);

export const BackendProvider = ({ children }: { children: ReactNode }) => {
  const notify = useToastNotification();

  const backendUrlFromEnv = useMemo(() => getBackendUrlFromEnv(), []);
  const backendUrlFromLocalStorage = useMemo(
    () => localStorage.getItem("backendUrl"),
    [],
  );

  const [backendUrl, setBackendUrl] = useState(
    backendUrlFromLocalStorage ?? backendUrlFromEnv,
  );
  const [available, setAvailable] = useState(false);

  const handleSetBackendUrl = useCallback((url: string) => {
    setBackendUrl(url);
    localStorage.setItem("backendUrl", url);
  }, []);

  const resetBackendUrl = useCallback(() => {
    setBackendUrl(backendUrlFromEnv);
    localStorage.removeItem("backendUrl");
  }, [backendUrlFromEnv]);

  const ping = useCallback(
    (notification = true) => {
      if (!backendUrl) {
        if (notification) {
          notify("Backend is not configured", "error");
        }
        setAvailable(false);
        return Promise.resolve(false);
      }
      return fetch(`${backendUrl}/services/ping`)
        .then((res) => {
          if (notification) {
            if (res.ok) {
              notify("Backend available", "success");
            } else {
              notify(`Backend unavailable: ${res.statusText}`, "error");
            }
          }
          setAvailable(res.ok);
          return res.ok;
        })
        .catch(() => {
          if (notification) {
            notify("Backend unavailable", "error");
          }
          setAvailable(false);
          return false;
        });
    },
    [backendUrl],
  );

  useEffect(() => {
    ping(false);
  }, [backendUrl]);

  const contextValue = useMemo(
    () => ({
      available,
      backendUrl,
      ping,
      setBackendUrl: handleSetBackendUrl,
      resetBackendUrl,
    }),
    [available, backendUrl, ping, handleSetBackendUrl, resetBackendUrl],
  );

  return (
    <BackendContext.Provider value={contextValue}>
      {children}
    </BackendContext.Provider>
  );
};

export const useBackend = () => {
  const ctx = useContext(BackendContext);
  if (!ctx)
    throw new Error(
      "useBackend must be used within a ComponentLibraryProvider",
    );
  return ctx;
};
