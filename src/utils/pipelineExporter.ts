import type { ArgumentType } from "../componentSpec";

interface TaskSpec {
  componentRef: {
    url: string;
  };
  annotations?: {
    "editor.position": string;
  };
  arguments?: { [k: string]: ArgumentType };
}

interface TaskNode {
  id: string;
  type: "task";
  position: { x: number; y: number };
  data: {
    taskSpec: TaskSpec;
    taskId: string;
  };
}

interface TaskEdge {
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
}

export const convertFlowToPipeline = (nodes: TaskNode[], edges: TaskEdge[]) => {


  console.log("nodes", nodes);
  console.log("edges", edges);

  const transformedObject = nodes.reduce<Record<string, TaskSpec>>((acc, node) => {
    if (node.data.taskId) {
      acc[node.data.taskId] = {
        componentRef: {
          url: node.data.taskSpec.componentRef.url
        },
        annotations: node.data.taskSpec.annotations,
        arguments: {}
      };

      const nodeEdges = edges.filter(edge => edge.target === node.data.taskId);

      if (nodeEdges.length > 0) {
        acc[node.data.taskId].arguments = {
          ...node.data.taskSpec.arguments,
          ...nodeEdges.reduce((edgeArgs, edge) => ({
            ...edgeArgs,
            [edge.targetHandle]: {
              taskOutput: {
                taskId: edge.source,
                outputName: edge.sourceHandle
              }
            }
          }), {})
        };
      } else if (node.data.taskSpec.arguments) {
        acc[node.data.taskId].arguments = node.data.taskSpec.arguments;
      }
    }
    return acc;
  }, {});


  return {
    name: "Vertex AI AutoML Tables pipeline",
    metadata: {
      annotations: {
        sdk: "https://cloud-pipelines.net/pipeline-editor/",
      },
    },
    inputs: [],
    implementation: {
      graph: {
        tasks: transformedObject,
        outputValues: {},
      },

    },
  };
};
