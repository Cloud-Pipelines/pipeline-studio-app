import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { ArgumentInput } from "@/types/arguments";

import { getInputValue, typeSpecToString } from "./utils";

export const ArgumentInputDialog = ({
  argument,
  placeholder,
  lastSubmittedValue,
  open,
  onCancel,
  onConfirm,
}: {
  argument: ArgumentInput;
  placeholder?: string;
  lastSubmittedValue?: string;
  open: boolean;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}) => {
  const [value, setValue] = useState("");

  const handleConfirm = useCallback(() => {
    onConfirm(value);
  }, [value, onConfirm]);

  const handleCancel = useCallback(() => {
    setValue(getArgumentDisplayValue(argument, lastSubmittedValue));
    onCancel();
  }, [argument, onCancel]);

  useEffect(() => {
    setValue(getArgumentDisplayValue(argument, lastSubmittedValue));
  }, [argument]);

  const setCursorToEnd = useCallback(
    (ref: HTMLTextAreaElement | null) => {
      if (ref && open) {
        ref.focus();
        ref.setSelectionRange(ref.value.length, ref.value.length);
      }
    },
    [open],
  );

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogTitle>
          {argument.key}{" "}
          <span className="text-muted-foreground text-xs font-normal ml-1">
            ({typeSpecToString(argument.inputSpec.type)}
            {!argument.inputSpec.optional ? "*" : ""})
          </span>
        </DialogTitle>
        <DialogDescription>
          {argument.inputSpec.description ||
            "Enter the value for this argument."}
        </DialogDescription>
        <Textarea
          ref={setCursorToEnd}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
        />
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

function getArgumentDisplayValue(
  argument: ArgumentInput,
  lastSubmittedValue?: string,
): string {
  if (argument.isRemoved) {
    return lastSubmittedValue || getInputValue(argument) || "";
  }
  return getInputValue(argument) || "";
}
