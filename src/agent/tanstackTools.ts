import { toolDefinition } from "@tanstack/ai";
import { z } from "zod";

import type { ArgumentType, ComponentReference } from "@/models/componentSpec";

import type { ToolBridgeApi } from "./toolBridgeApi";
import type { AgentComponentReferences, AgentContext } from "./types";

function json(value: unknown): string {
  return JSON.stringify(value);
}

const noInputSchema = z.object({});
const entityIdSchema = z.object({ entityId: z.string() });
const renameEntitySchema = z.object({
  entityId: z.string(),
  newName: z.string(),
});

export const getAgentContextDefinition = toolDefinition({
  name: "get_agent_context",
  description:
    "Get the current Tangle page context and recent pipeline runs available to the assistant.",
  inputSchema: noInputSchema,
});

const getPipelineStateDefinition = toolDefinition({
  name: "get_pipeline_state",
  description: "Get the currently open pipeline as JSON.",
  inputSchema: noInputSchema,
});

const searchComponentsDefinition = toolDefinition({
  name: "search_components",
  description:
    "Search the available Tangle component library by natural-language intent or keywords.",
  inputSchema: z.object({
    query: z.string(),
    limit: z.number().int().min(1).max(20).optional(),
  }),
});

const validatePipelineDefinition = toolDefinition({
  name: "validate_pipeline",
  description:
    "Validate the current pipeline for schema errors, missing inputs, orphaned bindings, and cycles.",
  inputSchema: noInputSchema,
});

const setPipelineNameDefinition = toolDefinition({
  name: "set_pipeline_name",
  description: "Set the pipeline name.",
  inputSchema: z.object({ name: z.string() }),
  needsApproval: true,
});

const setPipelineDescriptionDefinition = toolDefinition({
  name: "set_pipeline_description",
  description: "Set the pipeline description.",
  inputSchema: z.object({ description: z.string() }),
  needsApproval: true,
});

const addTaskDefinition = toolDefinition({
  name: "add_task",
  description:
    "Add a task using a component reference returned by search_components.",
  inputSchema: z.object({
    name: z.string(),
    componentRef: z.object({
      name: z.string(),
      url: z.string().optional(),
      spec: z.unknown().optional(),
    }),
  }),
  needsApproval: true,
});

const deleteTaskDefinition = toolDefinition({
  name: "delete_task",
  description: "Delete a task and its connections by entity id.",
  inputSchema: entityIdSchema,
  needsApproval: true,
});

const renameTaskDefinition = toolDefinition({
  name: "rename_task",
  description: "Rename a task by entity id.",
  inputSchema: renameEntitySchema,
  needsApproval: true,
});

const addInputDefinition = toolDefinition({
  name: "add_input",
  description: "Add a pipeline-level input.",
  inputSchema: z.object({
    name: z.string(),
    type: z.string().optional(),
    description: z.string().optional(),
    defaultValue: z.string().optional(),
    optional: z.boolean().optional(),
  }),
  needsApproval: true,
});

const deleteInputDefinition = toolDefinition({
  name: "delete_input",
  description: "Delete a pipeline input and its connections by entity id.",
  inputSchema: entityIdSchema,
  needsApproval: true,
});

const renameInputDefinition = toolDefinition({
  name: "rename_input",
  description: "Rename a pipeline input by entity id.",
  inputSchema: renameEntitySchema,
  needsApproval: true,
});

const addOutputDefinition = toolDefinition({
  name: "add_output",
  description: "Add a pipeline-level output.",
  inputSchema: z.object({
    name: z.string(),
    type: z.string().optional(),
    description: z.string().optional(),
  }),
  needsApproval: true,
});

const deleteOutputDefinition = toolDefinition({
  name: "delete_output",
  description: "Delete a pipeline output and its connections by entity id.",
  inputSchema: entityIdSchema,
  needsApproval: true,
});

const renameOutputDefinition = toolDefinition({
  name: "rename_output",
  description: "Rename a pipeline output by entity id.",
  inputSchema: renameEntitySchema,
  needsApproval: true,
});

const connectNodesDefinition = toolDefinition({
  name: "connect_nodes",
  description:
    "Connect an output port to an input port, replacing an existing target connection.",
  inputSchema: z.object({
    sourceEntityId: z.string(),
    sourcePortName: z.string(),
    targetEntityId: z.string(),
    targetPortName: z.string(),
  }),
  needsApproval: true,
});

const deleteEdgeDefinition = toolDefinition({
  name: "delete_edge",
  description: "Delete a pipeline connection by entity id.",
  inputSchema: entityIdSchema,
  needsApproval: true,
});

const setTaskArgumentDefinition = toolDefinition({
  name: "set_task_argument",
  description:
    "Set a task input to a literal or graph-input, task-output, or dynamic-data reference.",
  inputSchema: z.object({
    taskEntityId: z.string(),
    inputName: z.string(),
    value: z.unknown(),
  }),
  needsApproval: true,
});

const createSubgraphDefinition = toolDefinition({
  name: "create_subgraph",
  description: "Group two or more related tasks into a subgraph.",
  inputSchema: z.object({
    taskEntityIds: z.array(z.string()).min(2),
    subgraphName: z.string(),
  }),
  needsApproval: true,
});

const unpackSubgraphDefinition = toolDefinition({
  name: "unpack_subgraph",
  description: "Inline a subgraph task into its parent pipeline.",
  inputSchema: z.object({ taskEntityId: z.string() }),
  needsApproval: true,
});

const submitPipelineRunDefinition = toolDefinition({
  name: "submit_pipeline_run",
  description:
    "Submit the currently open pipeline. Use only when the user explicitly asks to run it.",
  inputSchema: noInputSchema,
  needsApproval: true,
});

const getRunStatusDefinition = toolDefinition({
  name: "get_run_status",
  description: "Get pipeline run metadata and execution status by run id.",
  inputSchema: z.object({ runId: z.string() }),
});

const debugPipelineRunDefinition = toolDefinition({
  name: "debug_pipeline_run",
  description:
    "Get a high-signal debug snapshot for a run, including failed child execution details and logs.",
  inputSchema: z.object({ runId: z.string() }),
});

export const editorAgentToolDefinitions = [
  getPipelineStateDefinition,
  searchComponentsDefinition,
  validatePipelineDefinition,
  setPipelineNameDefinition,
  setPipelineDescriptionDefinition,
  addTaskDefinition,
  deleteTaskDefinition,
  renameTaskDefinition,
  addInputDefinition,
  deleteInputDefinition,
  renameInputDefinition,
  addOutputDefinition,
  deleteOutputDefinition,
  renameOutputDefinition,
  connectNodesDefinition,
  deleteEdgeDefinition,
  setTaskArgumentDefinition,
  createSubgraphDefinition,
  unpackSubgraphDefinition,
  submitPipelineRunDefinition,
  getRunStatusDefinition,
  debugPipelineRunDefinition,
];

export const runViewAgentToolDefinitions = [
  getRunStatusDefinition,
  debugPipelineRunDefinition,
];

interface AgentToolDependencies {
  bridge: ToolBridgeApi;
  context: AgentContext;
  componentReferences: AgentComponentReferences;
}

export function createAgentClientTools({
  bridge,
  context,
  componentReferences,
}: AgentToolDependencies) {
  const getPipelineState = getPipelineStateDefinition.client(async () =>
    json(await bridge.getPipelineState()),
  );
  const searchComponents = searchComponentsDefinition.client(
    async ({ query, limit }) => {
      const result = await bridge.searchComponents({ query, limit });
      for (const component of result.results) {
        if (component.yamlText) {
          componentReferences[component.id] = {
            name: component.name,
            yamlText: component.yamlText,
          };
        }
      }
      return json({
        ...result,
        results: result.results.map(
          ({ yamlText: _yamlText, ...component }) => ({
            ...component,
            componentLink: `[${component.name}](component://${component.id})`,
          }),
        ),
      });
    },
  );
  const validatePipeline = validatePipelineDefinition.client(async () =>
    json(await bridge.validatePipeline()),
  );
  const setPipelineName = setPipelineNameDefinition.client(async ({ name }) =>
    json(await bridge.setPipelineName(name)),
  );
  const setPipelineDescription = setPipelineDescriptionDefinition.client(
    async ({ description }) =>
      json(await bridge.setPipelineDescription(description)),
  );
  const addTask = addTaskDefinition.client(async ({ name, componentRef }) =>
    json(
      await bridge.addTask({
        name,
        componentRef: componentRef as ComponentReference,
      }),
    ),
  );
  const deleteTask = deleteTaskDefinition.client(async ({ entityId }) =>
    json(await bridge.deleteTask(entityId)),
  );
  const renameTask = renameTaskDefinition.client(
    async ({ entityId, newName }) =>
      json(await bridge.renameTask(entityId, newName)),
  );
  const addInput = addInputDefinition.client(async (input) =>
    json(await bridge.addInput(input)),
  );
  const deleteInput = deleteInputDefinition.client(async ({ entityId }) =>
    json(await bridge.deleteInput(entityId)),
  );
  const renameInput = renameInputDefinition.client(
    async ({ entityId, newName }) =>
      json(await bridge.renameInput(entityId, newName)),
  );
  const addOutput = addOutputDefinition.client(async (output) =>
    json(await bridge.addOutput(output)),
  );
  const deleteOutput = deleteOutputDefinition.client(async ({ entityId }) =>
    json(await bridge.deleteOutput(entityId)),
  );
  const renameOutput = renameOutputDefinition.client(
    async ({ entityId, newName }) =>
      json(await bridge.renameOutput(entityId, newName)),
  );
  const connectNodes = connectNodesDefinition.client(async (connection) =>
    json(await bridge.connectNodes(connection)),
  );
  const deleteEdge = deleteEdgeDefinition.client(async ({ entityId }) =>
    json(await bridge.deleteEdge(entityId)),
  );
  const setTaskArgument = setTaskArgumentDefinition.client(
    async ({ taskEntityId, inputName, value }) =>
      json(
        await bridge.setTaskArgument(
          taskEntityId,
          inputName,
          value as ArgumentType,
        ),
      ),
  );
  const createSubgraph = createSubgraphDefinition.client(
    async ({ taskEntityIds, subgraphName }) =>
      json(await bridge.createSubgraph(taskEntityIds, subgraphName)),
  );
  const unpackSubgraph = unpackSubgraphDefinition.client(
    async ({ taskEntityId }) => json(await bridge.unpackSubgraph(taskEntityId)),
  );
  const submitPipelineRun = submitPipelineRunDefinition.client(async () =>
    json(await bridge.submitPipelineRun()),
  );
  const getRunStatus = getRunStatusDefinition.client(async ({ runId }) =>
    json(await bridge.getRunDetails(runId)),
  );
  const debugPipelineRun = debugPipelineRunDefinition.client(
    async ({ runId }) => json(await bridge.debugPipelineRun(runId)),
  );

  if (context.mode === "runView") {
    return [getRunStatus, debugPipelineRun];
  }

  return [
    getPipelineState,
    searchComponents,
    validatePipeline,
    setPipelineName,
    setPipelineDescription,
    addTask,
    deleteTask,
    renameTask,
    addInput,
    deleteInput,
    renameInput,
    addOutput,
    deleteOutput,
    renameOutput,
    connectNodes,
    deleteEdge,
    setTaskArgument,
    createSubgraph,
    unpackSubgraph,
    submitPipelineRun,
    getRunStatus,
    debugPipelineRun,
  ];
}
