import { Database } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useBackend } from "@/providers/BackendProvider";

import BackendConfigurationDialog from "./Dialogs/BackendConfigurationDialog";

const BackendStatus = () => {
  const { available, backendUrl } = useBackend();

  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const hideBackendUrl = backendUrl === import.meta.env.VITE_BACKEND_API_URL;
  const backendAvailableString = hideBackendUrl
    ? "Backend available"
    : `Connected to ${backendUrl}`;

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleOpen}
            className="bg-none hover:opacity-80"
            size="icon"
          >
            <div className="relative">
              <Database className="h-4 w-4 text-white flex-shrink-0" />
              <span
                className={cn(
                  "absolute -bottom-0.25 -right-0.25 w-2 h-2 rounded-full border-1 border-slate-900",
                  available ? "bg-green-500" : "bg-red-500",
                )}
              />
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {available ? backendAvailableString : "Backend unavailable"}
        </TooltipContent>
      </Tooltip>

      <BackendConfigurationDialog open={open} setOpen={setOpen} />
    </>
  );
};

export default BackendStatus;
