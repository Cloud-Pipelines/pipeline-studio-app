import {
  type AgentLoopState,
  chat,
  combineStrategies,
  createModel,
  maxIterations,
  type RunAgentResumeItem,
  type StreamChunk,
} from "@tanstack/ai";
import type { UIMessage } from "@tanstack/ai-client";
import { openaiCompatible } from "@tanstack/ai-openai/compatible";

import type { AiProviderConfig } from "@/types/aiProvider";
import { isRecord } from "@/utils/typeGuards";

import type { RecentPipelineRun } from "./session";
import {
  editorAgentToolDefinitions,
  getAgentContextDefinition,
  runViewAgentToolDefinitions,
} from "./tanstackTools";
import type { AgentContext } from "./types";

const MAX_AGENT_ITERATIONS = 12;
const MAX_AGENT_TOOL_CALLS = 30;
const ENCRYPTED_REASONING_INCLUDE: Array<"reasoning.encrypted_content"> = [
  "reasoning.encrypted_content",
];
const NO_REASONING_EFFORT = "none";
const PROXY_DEFAULT_MODEL = "tangle-proxy-default";

export const BASE_INSTRUCTIONS = `You are Tangle's pipeline assistant. Help users understand, build, validate, run, and debug Tangle pipelines.

Use tools to inspect live state instead of guessing. Mutation and run-submission tools require explicit user approval. Before completing an editing task, validate the pipeline. Do not claim an operation succeeded until its tool result confirms success.

Every pipeline task, input, and output has a stable $id. Whenever you mention one of these entities, format it as [Entity Name](entity://$id) so the UI renders an interactive chip. Never format an entity name as code or bold text when its $id is available. Preserve entity links across follow-up responses.

After changing a pipeline, respond with a concise "## Changes made" list. Each changed task, input, or output must use its entity link. End with the latest validation result.`;

export function omitProxyDefaultModel(body: BodyInit | null | undefined) {
  if (typeof body !== "string") return body;

  const payload: unknown = JSON.parse(body);
  if (!isRecord(payload) || payload.model !== PROXY_DEFAULT_MODEL) return body;

  const { model: _model, ...providerPayload } = payload;
  return JSON.stringify(providerPayload);
}

function createProviderAdapter(config: AiProviderConfig) {
  const configuredModel = config.model.trim();
  const adapterModel = configuredModel || PROXY_DEFAULT_MODEL;
  const baseURL = config.apiBase.trim().replace(/\/+$/, "");
  const apiKey = config.apiKey.trim();

  if (!baseURL) {
    throw new Error(
      "Configure an API base URL in Settings → AI Configuration.",
    );
  }

  const provider = openaiCompatible({
    name: "configured-provider",
    baseURL,
    apiKey: apiKey || "proxy-auth-disabled",
    api: "responses",
    models: [createModel(adapterModel, { input: ["text"] })],
    dangerouslyAllowBrowser: true,
    ...(!apiKey || !configuredModel
      ? {
          fetch: (input: RequestInfo | URL, init?: RequestInit) => {
            const headers = new Headers(init?.headers);
            if (!apiKey) headers.delete("authorization");
            const body = configuredModel
              ? init?.body
              : omitProxyDefaultModel(init?.body);
            return fetch(input, { ...init, body, headers });
          },
        }
      : {}),
  });
  return provider(adapterModel);
}

export function getResponsesModelOptions(model: string) {
  const supportsNoReasoning = /^gpt-5\.(?:[1-9]|\d{2,})(?:-|$)/.test(model);
  return {
    include: [...ENCRYPTED_REASONING_INCLUDE],
    ...(supportsNoReasoning
      ? { reasoning: { effort: NO_REASONING_EFFORT } }
      : {}),
  };
}

function contextInstructions(
  context: AgentContext,
  recentRuns: RecentPipelineRun[],
): string {
  if (context.mode === "runView") {
    const subgraph = context.subgraphExecutionId
      ? ` The selected subgraph execution is ${context.subgraphExecutionId}.`
      : "";
    return `The user is viewing pipeline run ${context.runId}.${subgraph} This view is read-only.`;
  }

  return `The user is editing a pipeline. Recent runs: ${JSON.stringify(recentRuns)}.`;
}

function withinToolCallBudget(state: AgentLoopState): boolean {
  return state.toolCallCount < MAX_AGENT_TOOL_CALLS;
}

interface RunAgentParams {
  messages: UIMessage[];
  threadId: string;
  runId: string;
  parentRunId?: string;
  resume?: RunAgentResumeItem[];
  aiConfig: AiProviderConfig;
  context: AgentContext;
  recentRuns: RecentPipelineRun[];
  abortController: AbortController;
}

export function runTanstackAgent({
  messages,
  threadId,
  runId,
  parentRunId,
  resume,
  aiConfig,
  context,
  recentRuns,
  abortController,
}: RunAgentParams): AsyncIterable<StreamChunk> {
  const getAgentContext = getAgentContextDefinition.server(() => ({
    context,
    recentRuns,
  }));
  const tools =
    context.mode === "editor"
      ? [getAgentContext, ...editorAgentToolDefinitions]
      : [getAgentContext, ...runViewAgentToolDefinitions];

  return chat({
    adapter: createProviderAdapter(aiConfig),
    messages,
    systemPrompts: [
      BASE_INSTRUCTIONS,
      contextInstructions(context, recentRuns),
    ],
    tools,
    modelOptions: getResponsesModelOptions(aiConfig.model.trim()),
    threadId,
    runId,
    ...(parentRunId ? { parentRunId } : {}),
    ...(resume ? { resume } : {}),
    abortController,
    agentLoopStrategy: combineStrategies([
      maxIterations(MAX_AGENT_ITERATIONS),
      withinToolCallBudget,
    ]),
  });
}
