import type { ArgumentType } from "@/utils/componentSpec";
import { getValue } from "@/utils/string";

/**
 * Formats display values for TaskNode input handles.
 * Shows connected nodes as "→ ComponentName.outputName" and regular values as formatted strings.
 */
export const getDisplayValue = (
  value: string | ArgumentType | undefined,
  graphSpec?: { tasks?: Record<string, any> },
) => {
  // Check if this is a connected node value
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

  // For non-connected values, use the original logic
  return getValue(value);
};
