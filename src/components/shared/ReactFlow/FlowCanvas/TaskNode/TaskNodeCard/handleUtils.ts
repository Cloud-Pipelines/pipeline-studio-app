import type { ArgumentType, GraphSpec } from "@/utils/componentSpec";
import { getValue } from "@/utils/string";

/**
 * Formats display values for TaskNode input handles.
 * Shows connected nodes as "→ ComponentName.outputName" and regular values as formatted strings.
 */
export const getDisplayValue = (
  value: string | ArgumentType | undefined,
  graphSpec?: GraphSpec,
) => {
  if (
    value &&
    typeof value === "object" &&
    value !== null &&
    "taskOutput" in value
  ) {
    const taskOutput = value.taskOutput as any;
    const taskId = taskOutput?.taskId;
    const outputName = taskOutput?.outputName;

    if (taskId && graphSpec?.tasks?.[taskId]) {
      const taskSpec = graphSpec.tasks[taskId];
      const componentName = taskSpec.componentRef?.spec?.name || taskId;
      return `→ ${componentName}${outputName ? `.${outputName}` : ""}`;
    }

    return `→ ${taskId}${outputName ? `.${outputName}` : ""}`;
  }

  if (value && typeof value === "object" && "graphInput" in value) {
    const inputName = value.graphInput?.inputName;

    return `→ ${inputName}`;
  }

  // For non-connected values, use the original logic
  return getValue(value);
};
