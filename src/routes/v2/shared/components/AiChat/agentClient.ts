import type { UIMessage } from "@tanstack/ai-client";
import { ChatClient } from "@tanstack/ai-client";

import type { RecentPipelineRun } from "@/agent/session";
import { runTanstackAgent } from "@/agent/tanstackAgent";
import { createAgentClientTools } from "@/agent/tanstackTools";
import type { ToolBridgeApi } from "@/agent/toolBridgeApi";
import type { AgentComponentReferences, AgentContext } from "@/agent/types";
import type { AiProviderConfig } from "@/types/aiProvider";

export type AgentApprovalDecision = "approved" | "rejected";

export interface AgentApproval {
  id: string;
  toolName: string;
  input: unknown;
  decision: AgentApprovalDecision | null;
  approve: () => void;
  reject: () => void;
}

interface AgentClientCallbacks {
  onMessagesChange: (messages: UIMessage[]) => void;
  onLoadingChange: (isLoading: boolean) => void;
  onApprovalsChange: (approvals: AgentApproval[], resuming: boolean) => void;
  onError: (error: Error) => void;
}

interface AskOptions {
  message: string;
  bridge: ToolBridgeApi;
  recentRuns?: RecentPipelineRun[];
  aiConfig: AiProviderConfig;
  callbacks: AgentClientCallbacks;
}

export class AgentClient {
  private client: ChatClient | null = null;
  private aiConfig: AiProviderConfig | null = null;
  private recentRuns: RecentPipelineRun[] = [];
  private readonly componentReferences: AgentComponentReferences = {};
  private readonly approvalDecisions = new Map<string, AgentApprovalDecision>();
  private callbacks: AgentClientCallbacks | null = null;

  constructor(
    private readonly threadId: string,
    private readonly context: AgentContext,
  ) {}

  private ensureClient(options: AskOptions): ChatClient {
    this.aiConfig = options.aiConfig;
    this.recentRuns = options.recentRuns ?? [];
    if (this.client) return this.client;

    const tools = createAgentClientTools({
      bridge: options.bridge,
      context: this.context,
      componentReferences: this.componentReferences,
    });

    this.client = new ChatClient({
      threadId: this.threadId,
      tools,
      fetcher: (input, { signal }) => {
        if (!this.aiConfig) {
          throw new Error("AI provider configuration is unavailable.");
        }
        const abortController = new AbortController();
        signal.addEventListener("abort", () => abortController.abort(), {
          once: true,
        });
        return runTanstackAgent({
          messages: input.messages,
          threadId: input.threadId,
          runId: input.runId,
          ...(input.parentRunId ? { parentRunId: input.parentRunId } : {}),
          ...(input.resume ? { resume: input.resume } : {}),
          aiConfig: this.aiConfig,
          context: this.context,
          recentRuns: this.recentRuns,
          abortController,
        });
      },
      onMessagesChange: (messages) =>
        this.callbacks?.onMessagesChange(messages),
      onLoadingChange: (isLoading) =>
        this.callbacks?.onLoadingChange(isLoading),
      onInterruptStateChange: ({ interrupts, resuming }) => {
        const activeApprovalIds = new Set(
          interrupts
            .filter((interrupt) => interrupt.kind === "tool-approval")
            .map((interrupt) => interrupt.id),
        );
        for (const approvalId of this.approvalDecisions.keys()) {
          if (!activeApprovalIds.has(approvalId)) {
            this.approvalDecisions.delete(approvalId);
          }
        }

        const approvals = interrupts.flatMap<AgentApproval>((interrupt) => {
          if (interrupt.kind !== "tool-approval") return [];
          return [
            {
              id: interrupt.id,
              toolName: interrupt.toolName,
              input: interrupt.originalArgs,
              decision: this.approvalDecisions.get(interrupt.id) ?? null,
              approve: () => {
                this.approvalDecisions.set(interrupt.id, "approved");
                interrupt.resolveInterrupt(true);
              },
              reject: () => {
                this.approvalDecisions.set(interrupt.id, "rejected");
                interrupt.resolveInterrupt(false);
              },
            },
          ];
        });
        this.callbacks?.onApprovalsChange(approvals, resuming);
      },
      onError: (error) => this.callbacks?.onError(error),
    });
    this.client.attach();
    return this.client;
  }

  async ask(options: AskOptions): Promise<void> {
    this.callbacks = options.callbacks;
    const client = this.ensureClient(options);
    this.aiConfig = options.aiConfig;
    this.recentRuns = options.recentRuns ?? [];
    await client.sendMessage(options.message);
  }

  stop(): void {
    this.client?.stop();
  }

  getComponentReferences(): AgentComponentReferences {
    return this.componentReferences;
  }

  terminate(): void {
    this.client?.dispose();
    this.client = null;
    this.callbacks = null;
  }
}
