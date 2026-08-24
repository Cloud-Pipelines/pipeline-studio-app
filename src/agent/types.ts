export type AgentContext =
  | { mode: "editor" }
  | { mode: "runView"; runId: string; subgraphExecutionId?: string };

export type AgentComponentReferences = Record<
  string,
  { name: string; yamlText: string }
>;

export interface AgentResponse {
  answer: string;
  threadId: string;
  componentReferences: AgentComponentReferences;
}

export type StatusCallback = (status: { text: string }) => void;
