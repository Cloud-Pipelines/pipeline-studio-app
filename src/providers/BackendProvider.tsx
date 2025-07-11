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

type BackendContextType = {
  available: boolean;
  backendUrl: string;
  isConfiguredFromEnv: boolean;
  ping: () => Promise<boolean>;
  setBackendUrl: (url: string) => void;
  resetBackendUrl: () => void;
  toggleEnvConfig: () => void;
};

const BackendContext = createContext<BackendContextType | undefined>(undefined);

export const BackendProvider = ({ children }: { children: ReactNode }) => {
  const notify = useToastNotification();

  const [backendUrl, setBackendUrl] = useState(() => {
    return (
      localStorage.getItem("backendUrl") ||
      import.meta.env.VITE_BACKEND_API_URL ||
      ""
    );
  });
  const [available, setAvailable] = useState(false);
  const [isConfiguredFromEnv, setIsConfiguredFromEnv] = useState(
    backendUrl === import.meta.env.VITE_BACKEND_API_URL,
  );

  const handleSetBackendUrl = useCallback((url: string) => {
    setBackendUrl(url);
    localStorage.setItem("backendUrl", url);
  }, []);

  const resetBackendUrl = useCallback(() => {
    setBackendUrl(import.meta.env.VITE_BACKEND_API_URL || "");
    localStorage.removeItem("backendUrl");
  }, []);

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

  const toggleEnvConfig = useCallback(() => {
    setIsConfiguredFromEnv((prev) => !prev);
    if (isConfiguredFromEnv) {
      resetBackendUrl();
    } else {
      handleSetBackendUrl(import.meta.env.VITE_BACKEND_API_URL || "");
    }
  }, [isConfiguredFromEnv, handleSetBackendUrl, resetBackendUrl]);

  useEffect(() => {
    ping(false);
  }, [backendUrl]);

  const contextValue = useMemo(
    () => ({
      available,
      backendUrl,
      isConfiguredFromEnv,
      ping,
      setBackendUrl: handleSetBackendUrl,
      resetBackendUrl,
      toggleEnvConfig,
    }),
    [
      available,
      backendUrl,
      isConfiguredFromEnv,
      ping,
      handleSetBackendUrl,
      resetBackendUrl,
      toggleEnvConfig,
    ],
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
