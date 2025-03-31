import type { MouseEvent } from "react";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm: (e?: MouseEvent) => void;
  onCancel: (e?: MouseEvent) => void;
}

export const ConfirmationDialog = ({
  isOpen,
  title,
  message = "Are you sure?",
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription>{message}</DialogDescription>
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel}>
            {cancelButtonText}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
