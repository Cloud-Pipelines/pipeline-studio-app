import { AlertCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { ArgumentInput } from "@/types/arguments";
import type { ArgumentType, TaskSpec } from "@/utils/componentSpec";

import { ArgumentsEditor } from "../ArgumentsEditor";
import { getArgumentInputs } from "./utils";

interface ArgumentsSectionProps {
  taskSpec: TaskSpec;
  setArguments: (args: Record<string, ArgumentType>) => void;
  disabled?: boolean;
}

const ArgumentsSection = ({
  taskSpec,
  setArguments,
  disabled = false,
}: ArgumentsSectionProps) => {
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
    const argumentValues = Object.fromEntries(
      currentArguments
        .filter(({ isRemoved }) => !isRemoved)
        .map(({ key, value }) => [key, value]),
    );

    setArguments(argumentValues);
  };

  const dirty =
    JSON.stringify(currentArguments) !== JSON.stringify(argumentInputs);

  return (
    <div className="flex-1 overflow-y-auto p-2">
      <ArgumentsEditor
        argumentData={currentArguments}
        setArguments={setCurrentArguments}
        disabled={disabled}
      />
      <div className="flex justify-end gap-4 p-4 items-center">
        {dirty && (
          <div className="text-sm text-warning flex gap-1 items-center">
            <AlertCircle height={16} /> Unsaved changes
          </div>
        )}
        <Button onClick={handleApply} disabled={disabled}>
          Apply
        </Button>
      </div>
    </div>
  );
};

export default ArgumentsSection;
