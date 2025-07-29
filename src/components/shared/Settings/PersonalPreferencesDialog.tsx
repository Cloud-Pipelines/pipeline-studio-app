import { useCallback } from "react";

import { ExistingBetaFlags } from "@/betaFlags";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

import { useBetaFlagsReducer } from "./useBetaFlagReducer";

interface PersonalPreferencesDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function PersonalPreferencesDialog({
  open,
  setOpen,
}: PersonalPreferencesDialogProps) {
  const [betaFlags, dispatch] = useBetaFlagsReducer(ExistingBetaFlags);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="w-2xl overflow-hidden"
        aria-label="Personal Preferences"
      >
        <DialogHeader>
          <DialogTitle>
            <span>Personal Preferences</span>
          </DialogTitle>
        </DialogHeader>

        <DialogDescription aria-label="Personal Preferences">
          <span>Configure your personal preferences.</span>
        </DialogDescription>

        <div className="flex flex-col gap-4">
          <div className="p-4">
            <p className="font-semibold mb-2">Beta Features</p>
            {betaFlags.map((flag) => (
              <div key={flag.name} className="flex items-center gap-2">
                <Switch
                  checked={flag.enabled}
                  onCheckedChange={(checked) => {
                    dispatch({
                      type: "setFlag",
                      payload: { key: flag.key, enabled: checked },
                    });
                  }}
                />
                <div className="flex flex-col items-start">
                  <span>{flag.name}</span>
                  <p className="text-sm text-muted-foreground">
                    {flag.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={handleClose}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
