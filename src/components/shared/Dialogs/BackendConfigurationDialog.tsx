import { AlertCircle, DatabaseZap, RefreshCcw } from "lucide-react";
import { type ChangeEvent, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useBackend } from "@/providers/BackendProvider";

import { InfoBox } from "../InfoBox";

interface BackendConfigurationDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const BackendConfigurationDialog = ({
  open,
  setOpen,
}: BackendConfigurationDialogProps) => {
  const {
    backendUrl,
    available,
    isConfiguredFromEnv,
    ping,
    setEnvConfig,
    setBackendUrl,
  } = useBackend();

  const [inputBackendUrl, setInputBackendUrl] = useState(
    isConfiguredFromEnv ? "" : backendUrl,
  );
  const [inputBackendTestResult, setInputBackendTestResult] = useState<
    boolean | null
  >(null);
  const [isEnvConfig, setIsEnvConfig] = useState(isConfiguredFromEnv);

  const hasEnvConfig = !!import.meta.env.VITE_BACKEND_API_URL;

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setInputBackendUrl(e.target.value);
    setInputBackendTestResult(null);
  }, []);

  const handleRefresh = useCallback(() => {
    ping({});
  }, [ping]);

  const handleTest = useCallback(async () => {
    const result = await ping({
      url: inputBackendUrl,
      notifyResult: true,
      saveAvailability: false,
    });
    setInputBackendTestResult(result);
  }, [inputBackendUrl, ping]);

  const handleConfirm = useCallback(() => {
    setEnvConfig(isEnvConfig);
    setBackendUrl(inputBackendUrl);
    setInputBackendTestResult(null);
    setOpen(false);
  }, [isEnvConfig, inputBackendUrl, setEnvConfig, setBackendUrl, setOpen]);

  const handleClose = useCallback(() => {
    setIsEnvConfig(isConfiguredFromEnv);
    setInputBackendUrl("");
    setInputBackendTestResult(null);
    setOpen(false);
  }, [isConfiguredFromEnv, setOpen]);

  useEffect(() => {
    setIsEnvConfig(isConfiguredFromEnv);
  }, [isConfiguredFromEnv, setIsEnvConfig]);

  useEffect(() => {
    setInputBackendUrl(isConfiguredFromEnv ? "" : backendUrl);
  }, [isConfiguredFromEnv, backendUrl, setInputBackendUrl]);

  const hasBackendConfigured =
    !!inputBackendUrl || (isEnvConfig && hasEnvConfig);
  const confirmButtonText = hasBackendConfigured
    ? "Confirm"
    : "Continue without backend";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="w-2xl overflow-hidden"
        aria-label="Configure backend"
      >
        <DialogHeader>
          <DialogTitle>
            <span>Configure Backend</span>
          </DialogTitle>
        </DialogHeader>

        <DialogDescription aria-label="Configure backend">
          <span>Attach the Oasis frontend to a valid backend.</span>
        </DialogDescription>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span>Backend status: </span>
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-2" tabIndex={-1}>
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    available ? "bg-green-500" : "bg-red-500",
                  )}
                />
                <span className="font-light text-xs italic">
                  {available ? "available" : "unavailable"}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {isConfiguredFromEnv && hasEnvConfig
                  ? "Configured from .env"
                  : backendUrl.length > 0
                    ? `Configured to ${backendUrl}`
                    : "No backend configured"}
              </TooltipContent>
            </Tooltip>
            <Button onClick={handleRefresh} size="icon" variant="ghost">
              <RefreshCcw />
            </Button>
          </div>

          {hasEnvConfig && (
            <>
              <hr />
              <div className="flex flex-col gap-2">
                <p className="font-semibold">Configure using .env</p>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={isEnvConfig}
                    onCheckedChange={setIsEnvConfig}
                  />
                  Use backend url configuration from environment file.
                </div>
              </div>
            </>
          )}

          {!(isEnvConfig && hasEnvConfig) && (
            <>
              <hr />
              <InfoBox title="Manual Configuration">
                <span>
                  You can set the backend URL in the environment file or use the
                  input below.
                </span>
              </InfoBox>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Backend URL
                </label>
                <div className="relative flex items-center">
                  <Input
                    type="text"
                    value={inputBackendUrl}
                    placeholder="http://localhost:8000"
                    onChange={handleInputChange}
                    className={inputBackendTestResult !== null ? "pr-10" : ""}
                  />
                  {inputBackendTestResult !== null && (
                    <Tooltip>
                      <TooltipTrigger
                        className={cn(
                          "absolute right-24 flex items-center h-full text-lg",
                          inputBackendTestResult
                            ? "text-green-500"
                            : "text-red-500",
                        )}
                      >
                        {inputBackendTestResult ? "✓" : "✗"}
                      </TooltipTrigger>
                      <TooltipContent>
                        {inputBackendTestResult
                          ? "Backend responded"
                          : "No response"}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <Button
                    variant="secondary"
                    className="ml-2"
                    onClick={handleTest}
                  >
                    <DatabaseZap className="h-4 w-4" />
                    Test
                  </Button>
                </div>
              </div>
              {!inputBackendUrl && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="inline-block text-red-500 h-4 w-4" />
                  <p className="text-red-500 text-sm">
                    No backend is configured. Certain features may not be
                    operable.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>{confirmButtonText}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BackendConfigurationDialog;
