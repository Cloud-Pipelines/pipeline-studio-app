/**
 * @license
 * Copyright 2021 Alexey Volkov
 * SPDX-License-Identifier: Apache-2.0
 * @author         Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 * @copyright 2021 Alexey Volkov <alexey.volkov+oss@ark-kun.com>
 */

import { TooltipProvider } from "@/components/ui/tooltip";

import { type ArgumentInput, ArgumentInputField } from "./ArgumentInputField";

interface ArgumentsEditorProps {
  argumentData: ArgumentInput[];
  setArguments: (args: ArgumentInput[]) => void;
  disabled?: boolean;
}

export const ArgumentsEditor = ({
  argumentData,
  setArguments,
  disabled = false,
}: ArgumentsEditorProps) => {
  const handleInputChange = (value: ArgumentInput) => {
    setArguments(
      argumentData.map((arg) => (arg.key === value.key ? value : arg)),
    );
  };

  return (
    <TooltipProvider>
      <div className="h-auto w-[650px] flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-4">
        {argumentData.map((argument) => {
          return (
            <ArgumentInputField
              key={argument.key}
              argument={argument}
              setArgument={handleInputChange}
              disabled={disabled}
            />
          );
        })}
      </div>
    </TooltipProvider>
  );
};
