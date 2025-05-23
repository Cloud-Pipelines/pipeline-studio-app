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

  const argumentInputs =
    componentSpec?.inputs?.map((input) => {
      /*
        * Some notes on the logic of the ArgumentInput:
        * [key] - This is used internally by React to keep track of the Input Component. Must be unique.
        * [value] - This is the value of the argument. It cannot be undefined due to React's rules around controlled components.
        * [initialValue] - This is the initial value of the argument when the Editor is opened. Immutable. It is used to determine if the argument has been changed during the current editing session.
        * [inputSpec] - These are some general constants for the argument. Immutable. It is used to display the argument name and type in the UI.
        * [isRemoved] - This is used to remove unwanted arguments from the Task Spec, as specified by the user. This is essentially used in place of an "undefined" input, since React requires an empty string for controlled components.

        * Note that "undefined" and "empty string" are treated differently in the task spec, but we can only use "empty string" in the UI due to React's rules around controlled components.
        * The difference is best seen in a required argument with a linked node:
        *   - The connection will disappear and the connection point turn red when the node is removed, since it is required. This is what the "Remove" button is for.
        *   - An empty string is a valid input and will result in the connection being severed, but the connection point will not turn red. This is what the "Reset to Default" button is for.
        *   - A severed connection cannot be reconnected in the argument editor once applied and must be redrawn on the graph.
      */

      const existingArgument = taskSpec.arguments?.[input.name];
      const initialValue = existingArgument ?? input.default;

      return {
        key: input.name,
        value: initialValue ?? "",
        initialValue: initialValue ?? "",
        inputSpec: input,
        isRemoved: initialValue === undefined,
      } as ArgumentInput;
    }) ?? [];

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
