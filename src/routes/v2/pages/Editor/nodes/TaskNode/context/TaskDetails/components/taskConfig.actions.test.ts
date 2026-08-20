import { describe, expect, it } from "vitest";

import { Binding, ComponentSpec, Task } from "@/models/componentSpec";
import type { UndoGroupable } from "@/routes/v2/shared/nodes/types";
import { IS_ENABLED_PORT_NAME } from "@/utils/conditionalExecution";

import { setConditionalExecution } from "./taskConfig.actions";

const undo: UndoGroupable = {
  withGroup: <T>(_label: string, action: () => T) => action(),
};

function createSpec() {
  const task = new Task({
    $id: "task-1",
    name: "Task",
    componentRef: {},
  });
  const spec = new ComponentSpec({
    $id: "spec-1",
    name: "Pipeline",
    tasks: [task],
  });
  return { spec, task };
}

describe("setConditionalExecution", () => {
  it("sets an executable placeholder when enabled", () => {
    const { spec, task } = createSpec();

    setConditionalExecution(undo, spec, task, true);

    expect(task.isEnabled).toBe("true");
  });

  it("clears the condition and its binding when disabled", () => {
    const { spec, task } = createSpec();
    task.setIsEnabled("true");
    spec.addBinding(
      new Binding({
        $id: "binding-1",
        sourceEntityId: "source-1",
        sourcePortName: "result",
        targetEntityId: task.$id,
        targetPortName: IS_ENABLED_PORT_NAME,
      }),
    );

    setConditionalExecution(undo, spec, task, false);

    expect(task.isEnabled).toBeUndefined();
    expect(spec.bindings).toHaveLength(0);
  });
});
