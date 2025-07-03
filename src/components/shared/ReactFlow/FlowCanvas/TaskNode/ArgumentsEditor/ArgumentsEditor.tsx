/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import type { ArgumentInput } from "@/types/arguments";
import type { ArgumentType, TaskSpec } from "@/utils/componentSpec";

import { ArgumentInputField } from "./ArgumentInputField";
import { getArgumentInputs } from "./utils";

interface ArgumentsEditorProps {
  taskSpec: TaskSpec;
  setArguments: (args: Record<string, ArgumentType>) => void;
  disabled?: boolean;
}

export const ArgumentsEditor = ({
  taskSpec,
  setArguments,
  disabled = false,
}: ArgumentsEditorProps) => {
  const argumentInputs = getArgumentInputs(taskSpec);

  const handleArgumentSave = (argument: ArgumentInput) => {
    const argumentValues = {
      ...Object.fromEntries(
        argumentInputs
          .filter(({ isRemoved }) => !isRemoved)
          .map(({ key, value }) => [key, value]),
      ),
    };

    if (argument.isRemoved) {
      delete argumentValues[argument.key];
    } else {
      argumentValues[argument.key] = argument.value;
    }

    setArguments(argumentValues);
  };

  return (
    <div className="h-auto flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-4">
      {argumentInputs.map((argument) => (
        <ArgumentInputField
          key={argument.key}
          argument={argument}
          onSave={handleArgumentSave}
          disabled={disabled}
        />
      ))}
    </div>
  );
};
