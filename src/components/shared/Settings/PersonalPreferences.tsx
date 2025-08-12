import { Settings } from "lucide-react";
import { useState } from "react";

import TooltipButton from "../Buttons/TooltipButton";
import { PersonalPreferencesDialog } from "./PersonalPreferencesDialog";

export function PersonalPreferences() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TooltipButton
        tooltip="Personal Preferences"
        onClick={() => setOpen(true)}
      >
        <Settings className="h-4 w-4" />
      </TooltipButton>
      <PersonalPreferencesDialog open={open} setOpen={setOpen} />
    </>
  );
}
