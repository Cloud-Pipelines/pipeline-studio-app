import type { DragEvent } from "react";
import type { ReactFlowInstance } from "@xyflow/react";
import type {
  ComponentSpec,
  GraphSpec,
  InputSpec,
  OutputSpec,
  TaskSpec,
} from "../componentSpec";

const makeNameUniqueByAddingIndex = (
  name: string,
  existingNames: Set<string>,
): string => {
  let finalName = name;
  let index = 1;
  while (existingNames.has(finalName)) {
    index++;
    finalName = name + " " + index.toString();
  }
  return finalName;
};

const getUniqueInputName = (
  componentSpec: ComponentSpec,
  name: string = "Input",
) => {
  return makeNameUniqueByAddingIndex(
    name,
    new Set(componentSpec.inputs?.map((inputSpec) => inputSpec.name)),
  );
};

const getUniqueOutputName = (
  componentSpec: ComponentSpec,
  name: string = "Output",
) => {
  return makeNameUniqueByAddingIndex(
    name,
    new Set(componentSpec.outputs?.map((outputSpec) => outputSpec.name)),
  );
};

const getUniqueTaskName = (graphSpec: GraphSpec, name: string = "Task") => {
  return makeNameUniqueByAddingIndex(
    name,
    new Set(Object.keys(graphSpec.tasks)),
  );
};

const onDropNode = (
  event: DragEvent,
  reactFlowInstance: ReactFlowInstance,
  componentSpec: ComponentSpec,
  setComponentSpec: (componentSpec: ComponentSpec) => void,
  graphSpec: GraphSpec,
) => {
  if (reactFlowInstance) {
    const droppedData = event.dataTransfer.getData("application/reactflow");
    if (droppedData === "") {
      return;
    }
    const droppedDataObject = JSON.parse(droppedData);
    const nodeType = Object.keys(droppedDataObject)[0];
    const nodeData = droppedDataObject[nodeType];

    let dragOffsetX = 0;
    let dragOffsetY = 0;
    const dragStartOffsetData = event.dataTransfer.getData("DragStart.offset");
    if (dragStartOffsetData !== "") {
      const dragStartOffset = JSON.parse(dragStartOffsetData);
      dragOffsetX = dragStartOffset.offsetX ?? 0;
      dragOffsetY = dragStartOffset.offsetY ?? 0;
    }

    // Node position. Offsets should be included in projection, so that they snap to the grid.
    // Otherwise the dropped nodes will be out of phase with the rest of the nodes even when snapping.
    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX - dragOffsetX,
      y: event.clientY - dragOffsetY,
    });

    const nodePosition = { x: position.x, y: position.y };
    const positionAnnotations = {
      "editor.position": JSON.stringify(nodePosition),
    };
    if (nodeType === "task") {
      const taskSpec = nodeData as TaskSpec;
      const mergedAnnotations = {
        ...taskSpec.annotations,
        ...positionAnnotations,
      };
      taskSpec.annotations = mergedAnnotations;
      const taskSpecWithAnnotation: TaskSpec = {
        ...taskSpec,
        annotations: mergedAnnotations,
      };
      const taskId = getUniqueTaskName(
        graphSpec,
        taskSpec.componentRef.spec?.name ?? "Task",
      );
      const newGraphSpec: GraphSpec = {
        ...graphSpec,
        tasks: {
          ...graphSpec.tasks,
          [taskId]: taskSpecWithAnnotation,
        },
      };
      setComponentSpec({
        ...componentSpec,
        implementation: { graph: newGraphSpec },
      });
    }

    if (nodeType === "input") {
      const inputId = getUniqueInputName(componentSpec);
      const inputSpec: InputSpec = {
        name: inputId,
        annotations: positionAnnotations,
      };
      const inputs = (componentSpec.inputs ?? []).concat([inputSpec]);
      setComponentSpec({ ...componentSpec, inputs: inputs });
    }

    if (nodeType === "output") {
      const outputId = getUniqueOutputName(componentSpec);
      const outputSpec: OutputSpec = {
        name: outputId,
        annotations: positionAnnotations,
      };

      const outputs = (componentSpec.outputs ?? []).concat([outputSpec]);

      setComponentSpec({ ...componentSpec, outputs: outputs });
    }
  }
};

export default onDropNode;
