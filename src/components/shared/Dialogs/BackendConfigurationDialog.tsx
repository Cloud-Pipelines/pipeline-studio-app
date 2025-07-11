import { DatabaseZap, RefreshCcw } from "lucide-react";
import { type ChangeEvent, useCallback, useState } from "react";

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
import { cn } from "@/lib/utils";
import { useBackend } from "@/providers/BackendProvider";

import { InfoBox } from "../InfoBox";

interface BackendConfigurationDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onClose?: () => void;
  onConfirm?: () => void;
}

const BackendConfigurationDialog = ({
  open,
  setOpen,
  onClose,
  onConfirm,
}: BackendConfigurationDialogProps) => {
  const { available, isConfiguredFromEnv, ping, toggleEnvConfig } =
    useBackend();

  const [backendUrl, setBackendUrl] = useState("");

  const hasEnvConfig = !!import.meta.env.VITE_BACKEND_API_URL;

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setBackendUrl(e.target.value);
  }, []);

  const handleInputBlur = useCallback(() => {
    // Handle backend URL change logic here, e.g., save to context or local storage
    if (backendUrl) {
      // Save the backend URL to context or local storage
      console.log("Backend URL set to:", backendUrl);
    }
  }, [backendUrl]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-2xl min-w-2xl overflow-hidden"
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
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                available ? "bg-green-500" : "bg-red-500",
              )}
            />
            <span className="font-light text-xs italic">
              {available ? "available" : "unavailable"}
            </span>
            <Button onClick={ping} size="icon" variant="ghost">
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
                    checked={isConfiguredFromEnv}
                    onCheckedChange={toggleEnvConfig}
                  />
                  Use the backend url configuration from the environment file.
                </div>
              </div>
            </>
          )}

          {!(isConfiguredFromEnv && hasEnvConfig) && (
            <>
              <hr />
              <InfoBox title="Manual Configuration">
                <span>
                  You can manually set the backend URL in the environment file
                  or use the provided input below.
                </span>
              </InfoBox>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Backend URL
                </label>
                <div className="flex">
                  <Input
                    type="text"
                    value={backendUrl}
                    placeholder="http://localhost:8000"
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                  />
                  <Button variant="secondary" className="ml-2" onClick={ping}>
                    <DatabaseZap className="h-4 w-4" />
                    Test
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setOpen(false);
              onClose?.();
            }}
          >
            Close
          </Button>
          <Button
            onClick={() => {
              setOpen(false);
              onConfirm?.();
            }}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BackendConfigurationDialog;
