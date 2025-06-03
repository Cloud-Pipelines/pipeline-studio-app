/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { Copy, Trash } from "lucide-react";
import { useState } from "react";

import { DraggableDialog } from "@/components/shared/Dialogs";
import type { ArgumentInput } from "@/types/arguments";
import type { ArgumentType, TaskSpec } from "@/utils/componentSpec";

import { ArgumentsEditor } from "./ArgumentsEditor";
import { getArgumentInputs } from "./utils";

interface ArgumentsEditorDialogProps {
  initialPosition?: { x: number; y: number };
  taskSpec: TaskSpec;
  disabled?: boolean;
  closeEditor: () => void;
  setArguments?: (args: Record<string, ArgumentType>) => void;
  handleDelete: () => void;
  handleCopy: () => void;
}

const ArgumentsEditorDialog = ({
  taskSpec,
  closeEditor,
  setArguments,
  disabled = false,
  initialPosition,
  handleDelete,
  handleCopy,
}: ArgumentsEditorDialogProps) => {
  const componentSpec = taskSpec.componentRef.spec;

  const argumentInputs = getArgumentInputs(taskSpec);

  const [currentArguments, setCurrentArguments] =
    useState<ArgumentInput[]>(argumentInputs);

  if (componentSpec === undefined) {
    console.error(
      "ArgumentsEditor called with missing taskSpec.componentRef.spec",
      taskSpec,
    );
    return null;
  }

  const handleApply = () => {
    // Filter out arguments from the spec which the user has removed.
    const argumentValues = Object.fromEntries(
      currentArguments
        .filter(({ isRemoved }) => !isRemoved)
        .map(({ key, value }) => [key, value]),
    );

    setArguments?.(argumentValues);
    closeEditor();
  };

  return (
    <DraggableDialog
      id="arguments-dialog"
      title={componentSpec.name ?? "<component>"}
      description="Configure the component's input arguments."
      disabled={disabled}
      onClose={closeEditor}
      onConfirm={handleApply}
      position={initialPosition}
      secondaryActions={[
        {
          children: (
            <div className="flex items-center gap-2">
              <Trash />
              Delete
            </div>
          ),
          variant: "destructive",
          disabled,
          onClick: handleDelete,
        },
        {
          children: (
            <div className="flex items-center gap-2">
              <Copy />
              Copy
            </div>
          ),
          variant: "secondary",
          disabled,
          onClick: handleCopy,
        },
      ]}
    >
      <ArgumentsEditor
        argumentData={currentArguments}
        setArguments={setCurrentArguments}
        disabled={disabled}
      />
    </DraggableDialog>
  );
};

export default ArgumentsEditorDialog;
