import type { Node } from "@xyflow/react";

import {
  calculateNodesBounds,
  calculateNodesCenter,
} from "@/components/shared/ReactFlow/FlowCanvas/utils/geometry";
import type {
  ArgumentType,
  ComponentSpec,
  GraphInputArgument,
  GraphSpec,
  InputSpec,
  OutputSpec,
  TaskOutputArgument,
  TaskSpec,
} from "@/utils/componentSpec";
import {
  isGraphImplementation,
  isGraphInputArgument,
  isTaskOutputArgument,
} from "@/utils/componentSpec";

// TODO: review and verify this AI-generated method
// TODO: input nodes in the subgraph should be spaced apart, not stacked on top of each other
// TODO: maintain layout of selected nodes within the subgraph
// TODO: what if a selected node (task, input or output) is not connected to anything else in the selection? Or is connected externally only? E.g. selecting a single input node
// TODO: remove AI comments once code has been reviewed and molded into human-understandable form
// TODO: handle scenario where a taskoutput is connected to multiple output nodes (some in and some out of the selection)

type IncomingConnection = GraphInputArgument | TaskOutputArgument;
type OutgoingConnection = TaskOutputArgument["taskOutput"];

export const createSubgraphFromNodes = (
  selectedNodes: Node[],
  currentComponentSpec: ComponentSpec,
): TaskSpec => {
  if (!isGraphImplementation(currentComponentSpec.implementation)) {
    throw new Error(
      "Current component spec does not have a graph implementation",
    );
  }

  const currentGraphSpec = currentComponentSpec.implementation.graph;

  // Extract task nodes and IO nodes from selection
  const taskNodes = selectedNodes.filter((node) => node.type === "task");
  const inputNodes = selectedNodes.filter((node) => node.type === "input");
  const outputNodes = selectedNodes.filter((node) => node.type === "output");

  // Get all task IDs in the selection
  const selectedTaskIds = new Set(
    taskNodes.map((node) => node.data.taskId as string),
  );
  const selectedInputNames = new Set(
    inputNodes.map((node) => node.data.label as string),
  );
  const selectedOutputNames = new Set(
    outputNodes.map((node) => node.data.label as string),
  );

  // Calculate bounds for layout normalization
  const bounds = calculateNodesBounds(selectedNodes);

  // Build the subgraph tasks
  const subgraphTasks: { [k: string]: TaskSpec } = {};
  const subgraphInputs: InputSpec[] = [];
  const subgraphOutputs: OutputSpec[] = [];
  const subgraphOutputValues: { [k: string]: TaskOutputArgument } = {};

  // Track connections that need to become inputs/outputs
  const incomingConnections = new Map<string, IncomingConnection>();
  const outgoingConnections = new Map<string, OutgoingConnection>();

  // Copy selected tasks to subgraph
  taskNodes.forEach((node) => {
    const taskId = node.data.taskId as string;
    const originalTask = currentGraphSpec.tasks[taskId];

    if (originalTask) {
      const normalizedPosition = {
        x: node.position.x - bounds.minX,
        y: node.position.y - bounds.minY,
      };

      const updatedArguments = processTaskInputConnections(
        originalTask,
        selectedTaskIds,
        selectedInputNames,
        incomingConnections,
      );

      processTaskOutputConnections(
        originalTask,
        taskId,
        selectedTaskIds,
        selectedOutputNames,
        currentGraphSpec,
        outgoingConnections,
      );

      const newTask: TaskSpec = {
        ...originalTask,
        arguments: updatedArguments,
        annotations: {
          ...originalTask.annotations,
          "editor.position": JSON.stringify(normalizedPosition),
        },
      };

      subgraphTasks[taskId] = newTask;
    }
  });

  // Convert input connections to subgraph inputs with calculated positions
  const inputNames = Array.from(incomingConnections.keys());
  const externalInputPositions = calculateExternalInputPositions(
    inputNames,
    bounds,
  );

  incomingConnections.forEach((input, inputName) => {
    const position = externalInputPositions[inputNames.indexOf(inputName)];

    const type = isTaskOutputArgument(input)
      ? input.taskOutput.type
      : input.graphInput.type;

    subgraphInputs.push({
      name: inputName,
      type,
      optional: false,
      annotations: {
        "editor.position": JSON.stringify(position),
      },
    });
  });

  // Convert output connections to subgraph outputs and output values with calculated positions
  const outputNames = Array.from(outgoingConnections.keys());
  const externalOutputPositions = calculateExternalOutputPositions(
    outputNames,
    bounds,
  );

  outgoingConnections.forEach((output, outputName) => {
    const position = externalOutputPositions[outputNames.indexOf(outputName)];

    subgraphOutputs.push({
      name: outputName,
      type: output.type,
      annotations: {
        "editor.position": JSON.stringify(position),
      },
    });

    subgraphOutputValues[outputName] = {
      taskOutput: output,
    };
  });

  // Create the subgraph component spec
  const subgraphSpec: ComponentSpec = {
    name: "Generated Subgraph",
    inputs: subgraphInputs,
    outputs: subgraphOutputs,
    implementation: {
      graph: {
        tasks: subgraphTasks,
        outputValues: subgraphOutputValues,
      },
    },
    metadata: {
      annotations: {
        sdk: "https://cloud-pipelines.net/pipeline-editor/",
        "editor.flow-direction": "left-to-right",
      },
    },
  };

  // Create the replacement task that represents the subgraph
  const subgraphPosition = calculateNodesCenter(selectedNodes);
  const replacementTask: TaskSpec = {
    componentRef: {
      spec: subgraphSpec,
      name: "Generated Subgraph",
    },
    annotations: {
      "editor.position": JSON.stringify(subgraphPosition),
    },
    arguments: {},
  };

  // Build arguments for the replacement task based on external inputs
  incomingConnections.forEach((originalSource, inputName) => {
    replacementTask.arguments![inputName] = originalSource;
  });

  return replacementTask;
};

const processTaskInputConnections = (
  taskSpec: TaskSpec,
  selectedTaskIds: Set<string>,
  selectedInputNames: Set<string>,
  incomingConnections: Map<string, IncomingConnection>,
): Record<string, ArgumentType> => {
  if (!taskSpec.arguments) return {};

  const updatedArguments: Record<string, ArgumentType> = {};

  Object.entries(taskSpec.arguments).forEach(([argName, argValue]) => {
    // Default case: retain existing argument
    updatedArguments[argName] = argValue;

    if (isTaskOutputArgument(argValue)) {
      // Connection from another task
      const type = argValue.taskOutput.type || "string";

      const isExternal = !selectedTaskIds.has(argValue.taskOutput.taskId);
      const inputName = argName;

      if (isExternal) {
        incomingConnections.set(inputName, argValue);

        updatedArguments[argName] = {
          graphInput: {
            inputName,
            type,
          },
        };
      }
    } else if (isGraphInputArgument(argValue)) {
      // Connection from graph input
      const inputNodeName = argValue.graphInput.inputName;
      const type = argValue.graphInput.type || "string";

      const isExternal = !selectedInputNames.has(inputNodeName);
      const inputName = isExternal ? argName : inputNodeName;

      incomingConnections.set(inputName, argValue);

      if (isExternal) {
        updatedArguments[argName] = {
          graphInput: {
            inputName,
            type,
          },
        };
      }
    }
  });

  return updatedArguments;
};

const processTaskOutputConnections = (
  taskSpec: TaskSpec,
  taskId: string,
  selectedTaskIds: Set<string>,
  selectedOutputNames: Set<string>,
  currentGraphSpec: GraphSpec,
  outgoingConnections: Map<string, OutgoingConnection>,
): void => {
  // Check if this task has outputs defined in its component spec
  const taskOutputs = taskSpec.componentRef?.spec?.outputs || [];

  taskOutputs.forEach((outputSpec) => {
    const outputName = outputSpec.name;

    // Check if this output is consumed by external (non-selected) tasks
    const isConsumedExternally = Object.entries(currentGraphSpec.tasks).some(
      ([externalTaskId, externalTask]: [string, TaskSpec]) => {
        if (selectedTaskIds.has(externalTaskId)) return false;
        if (!externalTask.arguments) return false;

        return Object.values(externalTask.arguments).some(
          (arg: ArgumentType) =>
            isTaskOutputArgument(arg) &&
            arg.taskOutput.taskId === taskId &&
            arg.taskOutput.outputName === outputName,
        );
      },
    );

    if (isConsumedExternally || !currentGraphSpec.outputValues) {
      outgoingConnections.set(outputName, {
        taskId,
        outputName,
        type: outputSpec.type || "string",
      });
      return;
    }

    // Check if this output feeds a selected output node
    const connectedGraphOutputs = Object.entries(
      currentGraphSpec.outputValues,
    ).filter(
      ([_, outputValue]: [string, TaskOutputArgument]) =>
        outputValue.taskOutput.taskId === taskId &&
        outputValue.taskOutput.outputName === outputName,
    );

    // If any of these graph outputs are selected, we use the name of the selected Output Node
    const selectedOutputNodes = connectedGraphOutputs.find(
      ([globalOutputName]) => selectedOutputNames.has(globalOutputName), // todo: what if one task output is connected to multiple graph outputs?
    );

    // If any of these graph outputs are external, we use the name of the task output
    const hasExternalGraphOutput = connectedGraphOutputs.some(
      ([globalOutputName]) => !selectedOutputNames.has(globalOutputName),
    );

    if (selectedOutputNodes || hasExternalGraphOutput) {
      const subgraphOutputName = selectedOutputNodes?.[0] || outputName;

      outgoingConnections.set(subgraphOutputName, {
        taskId,
        outputName,
        type: outputSpec.type || "string",
      });
    }
  });
};

// TODO: THESE METHODS TO BE REVIEWED & CONFIRMED
const calculateExternalInputPositions = (
  inputNames: string[],
  bounds: ReturnType<typeof calculateNodesBounds>,
) => {
  const positions: { x: number; y: number }[] = [];
  const leftMargin = -150; // Position inputs to the left of the content
  const spacing = 80; // Vertical spacing between inputs
  const startY = Math.max(
    0,
    bounds.height / 2 - ((inputNames.length - 1) * spacing) / 2,
  );

  inputNames.forEach((_, index) => {
    positions.push({
      x: leftMargin,
      y: startY + index * spacing,
    });
  });

  return positions;
};

const calculateExternalOutputPositions = (
  outputNames: string[],
  bounds: ReturnType<typeof calculateNodesBounds>,
) => {
  const positions: { x: number; y: number }[] = [];
  const rightMargin = bounds.width + 50; // Position outputs to the right of the content
  const spacing = 80; // Vertical spacing between outputs
  const startY = Math.max(
    0,
    bounds.height / 2 - ((outputNames.length - 1) * spacing) / 2,
  );

  outputNames.forEach((_, index) => {
    positions.push({
      x: rightMargin,
      y: startY + index * spacing,
    });
  });

  return positions;
};
