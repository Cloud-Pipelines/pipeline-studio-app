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
import { API_URL } from "@/utils/constants";
import {
  getUseEnv,
  getUserBackendUrl,
  setUseEnv as setUseEnvInLocalStorage,
  setUserBackendUrl as setUserBackendUrlInLocalStorage,
} from "@/utils/localforage";
import { normalizeUrl } from "@/utils/URL";

type BackendContextType = {
  configured: boolean;
  available: boolean;
  backendUrl: string;
  isConfiguredFromEnv: boolean;
  setEnvConfig: (useEnv: boolean) => void;
  setBackendUrl: (url: string) => void;
  ping: (args: {
    url?: string;
    notifyResult?: boolean;
    saveAvailability?: boolean;
  }) => Promise<boolean>;
};

const BackendContext = createContext<BackendContextType | undefined>(undefined);

export const BackendProvider = ({ children }: { children: ReactNode }) => {
  const notify = useToastNotification();

  const backendUrlFromEnv = API_URL;

  const [userBackendUrl, setUserBackendUrl] = useState("");
  const [useEnv, setUseEnv] = useState(true);
  const [available, setAvailable] = useState(false);

  const backendUrl = useEnv ? backendUrlFromEnv : userBackendUrl;

  const configured = !!backendUrl.trim();

  const setBackendUrl = useCallback(async (url: string) => {
    const normalized = normalizeUrl(url);
    setUserBackendUrl(normalized);
    await setUserBackendUrlInLocalStorage(normalized);
  }, []);

  const setEnvConfig = useCallback(async (flag: boolean) => {
    await setUseEnvInLocalStorage(flag);
    setUseEnv(flag);
  }, []);

  const ping = useCallback(
    ({
      url = backendUrl,
      notifyResult = true,
      saveAvailability = true,
    }: {
      url?: string;
      notifyResult?: boolean;
      saveAvailability?: boolean;
    }) => {
      const normalizedUrl = normalizeUrl(url);
      if (!normalizedUrl) {
        if (notifyResult) notify("Backend is not configured", "error");
        if (saveAvailability) setAvailable(false);
        return Promise.resolve(false);
      }
      return fetch(`${normalizedUrl}/services/ping`)
        .then((res) => {
          if (notifyResult) {
            if (res.ok) notify("Backend available", "success");
            else notify(`Backend unavailable: ${res.statusText}`, "error");
          }
          if (saveAvailability) setAvailable(res.ok);
          return res.ok;
        })
        .catch(() => {
          if (notifyResult) notify("Backend unavailable", "error");
          if (saveAvailability) setAvailable(false);
          return false;
        });
    },
    [backendUrl],
  );

  useEffect(() => {
    ping({ notifyResult: false });
  }, [backendUrl]);

  useEffect(() => {
    const getSettings = async () => {
      const url = await getUserBackendUrl();
      setUserBackendUrl(url);

      const flag = await getUseEnv();
      setUseEnv(flag === true);
    };
    getSettings();
  }, []);

  const contextValue = useMemo(
    () => ({
      configured,
      available,
      backendUrl,
      isConfiguredFromEnv: useEnv,
      setEnvConfig,
      setBackendUrl,
      ping,
    }),
    [
      configured,
      available,
      backendUrl,
      useEnv,
      setEnvConfig,
      setBackendUrl,
      ping,
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
  if (!ctx) throw new Error("useBackend must be used within a BackendProvider");
  return ctx;
};
