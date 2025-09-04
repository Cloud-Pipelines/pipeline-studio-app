import type { ArgumentType, TaskSpec } from "@/utils/componentSpec";

import { ArgumentsEditor } from "../ArgumentsEditor";

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
  return (
    <div className="flex-1 overflow-y-auto py-2">
      <p className="text-sm text-muted-foreground mb-3">
        Configure the arguments for this task node.
      </p>
      <ArgumentsEditor
        taskSpec={taskSpec}
        setArguments={setArguments}
        disabled={disabled}
      />
    </div>
  );
};

export default ArgumentsSection;
