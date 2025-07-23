import { useCallback, useEffect, useRef, useState } from "react";

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
  open,
  onCancel,
  onConfirm,
}: {
  argument: ArgumentInput;
  placeholder?: string;
  open: boolean;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [value, setValue] = useState(getInputValue(argument) || "");

  const handleConfirm = useCallback(() => {
    onConfirm(value);
  }, [value, onConfirm]);

  const handleCancel = useCallback(() => {
    setValue(getInputValue(argument) || "");
    onCancel();
  }, [argument.value, onCancel]);

  useEffect(() => {
    setValue(getInputValue(argument) || "");
  }, [argument]);

  useEffect(() => {
    if (open) {
      const focusTextarea = () => {
        if (textareaRef.current) {
          const textarea = textareaRef.current;
          textarea.focus();
          const length = textarea.value.length;
          textarea.setSelectionRange(length, length);
        } else {
          requestAnimationFrame(focusTextarea);
        }
      };

      requestAnimationFrame(focusTextarea);
    }
  }, [open]);

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
          ref={textareaRef}
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
