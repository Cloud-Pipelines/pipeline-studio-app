/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { useRef, useState } from "react";
import type { ArgumentType, TaskSpec } from "../componentSpec";
import ArgumentsEditor from "./ArgumentsEditor";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  type PaperProps,
} from "@mui/material";
import Draggable from "react-draggable";

function PaperComponent(props: PaperProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  return (
    <Draggable
      nodeRef={nodeRef as React.RefObject<HTMLDivElement>}
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} ref={nodeRef} />
    </Draggable>
  );
}

interface ArgumentsEditorDialogProps {
  taskSpec: TaskSpec;
  closeEditor?: () => void;
  setArguments?: (args: Record<string, ArgumentType>) => void;
}

const ArgumentsEditorDialog = ({
  taskSpec,
  closeEditor,
  setArguments,
}: ArgumentsEditorDialogProps) => {
  const [currentArguments, setCurrentArguments] = useState<
    Record<string, ArgumentType>
  >({ ...taskSpec.arguments });

  const componentSpec = taskSpec.componentRef.spec;
  if (componentSpec === undefined) {
    console.error(
      "ArgumentsEditor called with missing taskSpec.componentRef.spec",
      taskSpec,
    );
    return <></>;
  }

  const handleApply = () => {
    setArguments?.(currentArguments);
    closeEditor?.();
  };

  return (
    <Dialog
      open
      onClose={closeEditor}
      PaperComponent={PaperComponent}
      aria-labelledby="draggable-dialog-title"
      hideBackdrop={true}
      disableEnforceFocus={true}
      disableAutoFocus={true}
      disableScrollLock={true}
      className="absolute pointer-events-none"
      slotProps={{
        paper: {
          className: "pointer-events-auto shadow-md m-0",
        }
      }}
    >
      <DialogTitle className="cursor-move" id="draggable-dialog-title">
        Input arguments for {componentSpec.name}
      </DialogTitle>
      <DialogContent>
        <ArgumentsEditor
          componentSpec={componentSpec}
          componentArguments={currentArguments}
          setComponentArguments={setCurrentArguments}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={closeEditor}>Close</Button>
        <Button onClick={handleApply}>Apply</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ArgumentsEditorDialog;
