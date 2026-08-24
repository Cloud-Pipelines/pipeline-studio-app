import { action, computed, makeObservable, observable } from "mobx";

import type { AgentContext } from "@/agent/types";

import { AgentThread } from "./agentThread";

export interface AiChatStoreConfig {
  getContext: () => AgentContext;
}

export class AiChatStore {
  @observable.shallow accessor threads: AgentThread[] = [];
  @observable accessor activeThreadId: string | null = null;

  constructor(private readonly config: AiChatStoreConfig) {
    makeObservable(this);
    this.newThread();
  }

  @computed get activeThread(): AgentThread | null {
    return this.threads.find((t) => t.threadId === this.activeThreadId) ?? null;
  }

  @action ensureActiveThread(): AgentThread {
    return this.activeThread ?? this.newThread();
  }

  @action newThread(): AgentThread {
    const previous = this.activeThread;
    if (previous) {
      previous.dispose();
      this.threads = this.threads.filter((t) => t !== previous);
    }

    const thread = new AgentThread({
      context: this.config.getContext(),
    });
    this.threads = [...this.threads, thread];
    this.activeThreadId = thread.threadId;
    return thread;
  }

  @action disposeAll() {
    for (const thread of this.threads) {
      thread.dispose();
    }
    this.threads = [];
    this.activeThreadId = null;
  }
}
