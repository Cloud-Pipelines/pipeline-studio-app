import { useState } from "react";

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
import { Label } from "@/components/ui/label";

export type DuplicateAction = "replace" | "rename" | "keep-both" | "cancel";

interface ComponentDuplicateDialogProps {
  isOpen: boolean;
  componentName: string;
  onAction: (action: DuplicateAction, newName?: string) => void;
}

const ComponentDuplicateDialog = ({
  isOpen,
  componentName,
  onAction,
}: ComponentDuplicateDialogProps) => {
  const [newName, setNewName] = useState(componentName);
  const [showRenameInput, setShowRenameInput] = useState(false);

  const handleAction = (action: DuplicateAction) => {
    if (action === "rename") {
      setShowRenameInput(true);
      return;
    }
    onAction(action);
  };

  const handleRenameSubmit = () => {
    if (newName.trim()) {
      onAction("rename", newName.trim());
    }
  };

  const handleClose = () => {
    setShowRenameInput(false);
    setNewName(componentName);
    onAction("cancel");
  };

  const isRenameDisabled = !newName.trim() || newName === componentName;

    return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Component Already Exists</DialogTitle>
          <DialogDescription>
            A different component with the name &quot;{componentName}&quot; already exists.
            Choose how to resolve this conflict:
          </DialogDescription>
        </DialogHeader>

        {showRenameInput && (
          <div className="space-y-2">
            <Label htmlFor="new-name">New component name:</Label>
            <Input
              id="new-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name"
              autoFocus
            />
          </div>
        )}

        <DialogFooter className="flex flex-col gap-2">
          {!showRenameInput ? (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="destructive"
                onClick={() => handleAction("replace")}
              >
                Replace Existing
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleAction("rename")}
              >
                Rename New
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAction("keep-both")}
              >
                Keep Both (Versioned)
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleAction("cancel")}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowRenameInput(false)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleRenameSubmit}
                disabled={isRenameDisabled}
                className="flex-1"
              >
                Rename and Import
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ComponentDuplicateDialog;
