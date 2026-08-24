import type { UIMessage } from "@tanstack/ai-client";
import { action, makeObservable, observable, runInAction } from "mobx";

import type { RecentPipelineRun } from "@/agent/session";
import type { ToolBridgeApi } from "@/agent/toolBridgeApi";
import type { AgentContext } from "@/agent/types";
import { reportError } from "@/services/errorManagement/bugsnag";
import type { AiProviderConfig } from "@/types/aiProvider";
import { getErrorMessage } from "@/utils/string";

import { type AgentApproval, AgentClient } from "./agentClient";
import type { ChatMessage } from "./types";

function generateThreadId(): string {
  return `thread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function messageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.content)
    .join("");
}

function thinkingText(messages: UIMessage[]): string | null {
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role !== "assistant") return null;
  const content = lastMessage.parts
    .filter((part) => part.type === "thinking")
    .map((part) => part.content)
    .join("");
  return content || null;
}

function toChatMessages(
  messages: UIMessage[],
  componentReferences: Record<string, { name: string; yamlText: string }>,
): ChatMessage[] {
  return messages.flatMap<ChatMessage>((message, index) => {
    const content = messageText(message);
    if (!content) return [];
    if (message.role === "user") {
      return [{ id: message.id, role: "user", content }];
    }
    const precedingPrompt = [...messages]
      .slice(0, index)
      .reverse()
      .find((candidate) => candidate.role === "user");
    return [
      {
        id: message.id,
        role: "assistant",
        content,
        prompt: precedingPrompt ? messageText(precedingPrompt) : "",
        ...(Object.keys(componentReferences).length > 0
          ? { componentReferences: { ...componentReferences } }
          : {}),
      },
    ];
  });
}

function formatAssistantError(error: unknown): string {
  const message = getErrorMessage(error);
  if (
    /\brs_[a-zA-Z0-9]+\b/.test(message) ||
    /required ['"]reasoning['"] item/i.test(message) ||
    /Item with id .* not found/i.test(message)
  ) {
    return "I ran into a model conversation-state error while processing that request. Please try again in this chat, or start a new chat if it keeps happening.";
  }
  return `I couldn't complete that request: ${message}`;
}

interface SendMessageOptions {
  bridge: ToolBridgeApi;
  aiConfig: AiProviderConfig;
  recentRuns?: RecentPipelineRun[];
}

export interface AgentThreadConfig {
  context: AgentContext;
}

export class AgentThread {
  readonly threadId: string;

  @observable.shallow accessor messages: ChatMessage[] = [];
  @observable.shallow accessor approvals: AgentApproval[] = [];
  @observable accessor thinkingText: string | null = null;
  @observable accessor isPending = false;
  @observable accessor isResuming = false;

  private readonly client: AgentClient;

  constructor(config: AgentThreadConfig, threadId?: string) {
    makeObservable(this);
    this.threadId = threadId ?? generateThreadId();
    this.client = new AgentClient(this.threadId, config.context);
  }

  abort() {
    this.client.stop();
  }

  async sendMessage(prompt: string, options: SendMessageOptions) {
    let errorHandled = false;
    const handleError = (error: unknown) => {
      if (errorHandled) return;
      errorHandled = true;
      reportError(error, { feature: "ai-assistant" });
      runInAction(() => {
        this.messages = [
          ...this.messages,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: formatAssistantError(error),
            prompt,
          },
        ];
        this.isPending = false;
        this.thinkingText = null;
      });
    };

    runInAction(() => {
      this.messages = [
        ...this.messages,
        {
          id: `user-${Date.now()}`,
          role: "user",
          content: prompt,
        },
      ];
      this.isPending = true;
    });

    try {
      await this.client.ask({
        message: prompt,
        bridge: options.bridge,
        aiConfig: options.aiConfig,
        ...(options.recentRuns ? { recentRuns: options.recentRuns } : {}),
        callbacks: {
          onMessagesChange: (messages) => {
            runInAction(() => {
              this.messages = toChatMessages(
                messages,
                this.client.getComponentReferences(),
              );
              this.thinkingText = thinkingText(messages);
            });
          },
          onLoadingChange: (isLoading) => {
            runInAction(() => {
              this.isPending = isLoading;
              if (!isLoading) this.thinkingText = null;
            });
          },
          onApprovalsChange: (approvals, isResuming) => {
            runInAction(() => {
              this.approvals = approvals;
              this.isResuming = isResuming;
            });
          },
          onError: handleError,
        },
      });
    } catch (error) {
      handleError(error);
    }
  }

  @action dispose() {
    this.client.terminate();
    this.approvals = [];
  }
}
