import { useState } from "react";

import type {
  ArgumentInput,
  ArgumentType,
  TaskSpec,
} from "../../componentSpec";
import { ArgumentsEditor } from "../ArgumentsEditor";
import { Button } from "../ui/button";

interface ArgumentsSectionProps {
  taskSpec: TaskSpec;
  setArguments?: (args: Record<string, ArgumentType>) => void;
  disabled?: boolean;
}

const ArgumentsSection = ({
  taskSpec,
  setArguments,
  disabled = false,
}: ArgumentsSectionProps) => {
  const componentSpec = taskSpec.componentRef.spec;

  const argumentInputs =
    componentSpec?.inputs?.map((input) => {
      const existingArgument = taskSpec.arguments?.[input.name];

      return {
        key: input.name,
        value: existingArgument ?? "",
        initialValue: existingArgument,
        inputSpec: input,
        isRemoved: existingArgument === undefined,
        linkedNode: !!(
          existingArgument &&
          typeof existingArgument === "object" &&
          "taskOutput" in existingArgument &&
          existingArgument.taskOutput
        ),
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
    const argumentValues = Object.fromEntries(
      currentArguments
        .filter(({ isRemoved }) => !isRemoved)
        .map(({ key, value }) => [key, value]),
    );

    setArguments?.(argumentValues);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <ArgumentsEditor
        argumentData={currentArguments}
        setArguments={setCurrentArguments}
        disabled={disabled}
      />
      <div className="flex justify-end gap-2 p-4">
        <Button onClick={handleApply} disabled={disabled}>
          Apply
        </Button>
        <Button onClick={() => {}} disabled={disabled} variant="secondary">
          Reset all
        </Button>
      </div>
    </div>
  );
};

export default ArgumentsSection;
