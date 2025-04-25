import type { ReactFlowInstance } from "@xyflow/react";
import type { DragEvent } from "react";

import type {
  ComponentSpec,
  GraphSpec,
  InputSpec,
  OutputSpec,
  TaskSpec,
} from "@/utils/componentSpec";
import {
  getUniqueInputName,
  getUniqueOutputName,
  getUniqueTaskName,
} from "@/utils/unique";

const onDropNode = (
  event: DragEvent,
  reactFlowInstance: ReactFlowInstance,
  componentSpec: ComponentSpec,
): ComponentSpec => {
  const newComponentSpec = { ...componentSpec };

  if (reactFlowInstance) {
    if (!("graph" in newComponentSpec.implementation)) {
      console.error("Implementation does not contain a graph.");
      return newComponentSpec;
    }
    const graphSpec = newComponentSpec.implementation.graph;

    const droppedData = event.dataTransfer.getData("application/reactflow");
    if (droppedData === "") {
      return newComponentSpec;
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

      newComponentSpec.implementation.graph = newGraphSpec;
    }

    if (nodeType === "input") {
      const inputId = getUniqueInputName(componentSpec);
      const inputSpec: InputSpec = {
        name: inputId,
        annotations: positionAnnotations,
      };
      const inputs = (componentSpec.inputs ?? []).concat([inputSpec]);

      newComponentSpec.inputs = inputs;
    }

    if (nodeType === "output") {
      const outputId = getUniqueOutputName(componentSpec);
      const outputSpec: OutputSpec = {
        name: outputId,
        annotations: positionAnnotations,
      };

      const outputs = (componentSpec.outputs ?? []).concat([outputSpec]);

      newComponentSpec.outputs = outputs;
    }
  }

  return newComponentSpec;
};

export default onDropNode;
