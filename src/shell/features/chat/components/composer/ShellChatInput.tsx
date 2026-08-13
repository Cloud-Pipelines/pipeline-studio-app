import { useEffect, useRef, useState } from "react";

import type {
  Attachment,
  MessageDelivery,
  SubagentStatus,
} from "@/shell/contracts";
import {
  clearDraft,
  readDraft,
  writeDraft,
} from "@/shell/features/chat/model/chatDraft";
import { uploadFiles } from "@/shell/features/sessions/api/sessionsApi";

import { ComposerShell } from "./ComposerShell";
import { KilledAgentNotice } from "./KilledAgentNotice";
import { QueuedFollowUps } from "./QueuedFollowUps";
import { RunControls } from "./RunControls";
import { StagedFiles } from "./StagedFiles";

/** A follow-up message held client-side while the agent is mid-run. */
interface QueuedMessage {
  id: string;
  content: string;
  attachments?: Attachment[];
}

interface ShellChatInputProps {
  sessionId: string;
  /**
   * The conversation/agent this composer targets (`"prime"` or a sub-agent id).
   * Scopes the persisted draft so each session+agent keeps its own unsent text.
   */
  agentId: string;
  /** Disables the whole composer (e.g. while the socket is disconnected). */
  disabled?: boolean;
  /**
   * Whether the target agent is mid-run. When busy, the composer stays usable
   * and surfaces Stop / Steer / Follow up controls above the input so the user
   * can nudge the agent without waiting for it to finish.
   */
  agentBusy?: boolean;
  /**
   * The target agent's lifecycle status. When `"killed"`, the composer is
   * replaced with a terminal notice instead of the input controls.
   */
  agentStatus?: SubagentStatus;
  /**
   * Removes the (killed) agent from the roster and closes its tab. Wired to the
   * "Remove from list" action shown in the killed-agent notice.
   */
  onRemove?: () => void;
  /** Aborts the agent's in-progress run. Required for the Stop control. */
  onAbort?: () => void;
  onSubmit: (
    content: string,
    options: { delivery: MessageDelivery; attachments?: Attachment[] },
  ) => void;
}

export function ShellChatInput({
  sessionId,
  agentId,
  disabled,
  agentBusy,
  agentStatus,
  onRemove,
  onAbort,
  onSubmit,
}: ShellChatInputProps) {
  // Drafts persist per session+agent so the unsent text survives navigation and
  // reloads. Seed from storage on mount; callers key this component by
  // session+agent, so it remounts (and re-seeds) when either changes.
  const [value, setValue] = useState(() => readDraft(sessionId, agentId));
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  // Follow-ups composed while the agent is busy wait here until the run ends
  // (auto-drained) or the user sends one immediately. They never become chat
  // bubbles until actually sent, so the transcript stays clean.
  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  // Tracks the previous busy state so we can detect the run-end transition and
  // flush the queue exactly once when the agent stops.
  const wasBusyRef = useRef(agentBusy);

  const busy = disabled || uploading;
  const canSubmit = !busy && (value.trim().length > 0 || files.length > 0);

  function handleValueChange(next: string) {
    setValue(next);
    writeDraft(sessionId, agentId, next);
  }

  function addFiles(picked: File[]) {
    if (picked.length) setFiles((prev) => [...prev, ...picked]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  // Uploads the staged files and returns their attachment refs. `undefined`
  // means nothing was staged; `null` signals an upload failure (callers abort).
  async function uploadStagedFiles(): Promise<Attachment[] | undefined | null> {
    if (files.length === 0) return undefined;
    setUploading(true);
    try {
      const attachments = await uploadFiles(sessionId, files);
      setUploading(false);
      return attachments;
    } catch (err) {
      console.error("[chat] file upload failed:", err);
      setUploading(false);
      return null;
    }
  }

  async function handleSubmit(delivery: MessageDelivery) {
    const trimmed = value.trim();
    if (busy || (!trimmed && files.length === 0)) return;

    const attachments = await uploadStagedFiles();
    if (attachments === null) return;

    setValue("");
    clearDraft(sessionId, agentId);
    setFiles([]);
    onSubmit(trimmed, { delivery, attachments });
  }

  // Adds the composed message to the client-side follow-up queue instead of
  // sending it, so nothing reaches the agent (or the transcript) until the run
  // ends or the user sends it immediately.
  async function enqueueFollowUp() {
    const trimmed = value.trim();
    if (busy || (!trimmed && files.length === 0)) return;

    const attachments = await uploadStagedFiles();
    if (attachments === null) return;

    setValue("");
    clearDraft(sessionId, agentId);
    setFiles([]);
    setQueue((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        content: trimmed,
        attachments: attachments ?? undefined,
      },
    ]);
  }

  // Jumps a queued item to the front: removes it and steers it into the live
  // run right away (a true mid-run nudge).
  function sendQueuedNow(id: string) {
    const item = queue.find((q) => q.id === id);
    if (!item) return;
    setQueue((prev) => prev.filter((q) => q.id !== id));
    onSubmit(item.content, {
      delivery: "steer",
      attachments: item.attachments,
    });
  }

  function discardQueued(id: string) {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  }

  // Flush the queue when the run ends: send every waiting follow-up in order as
  // a normal prompt (Pi queues any that land while it's still finishing up).
  useEffect(() => {
    const wasBusy = wasBusyRef.current;
    wasBusyRef.current = agentBusy;
    if (!wasBusy || agentBusy || queue.length === 0) return;

    const pending = queue;
    setQueue([]);
    for (const item of pending) {
      onSubmit(item.content, {
        delivery: "auto",
        attachments: item.attachments,
      });
    }
  }, [agentBusy, queue, onSubmit]);

  // While the agent is running, the primary action queues a follow-up; otherwise
  // it sends immediately. The Send button is hidden mid-run (see hideSend).
  function handlePrimarySubmit() {
    if (agentBusy) {
      void enqueueFollowUp();
      return;
    }
    void handleSubmit("auto");
  }

  // A killed agent can't take input, so swap the composer for a terminal notice.
  if (agentStatus === "killed") {
    return <KilledAgentNotice onRemove={onRemove} />;
  }

  return (
    <ComposerShell
      value={value}
      onValueChange={handleValueChange}
      onSubmit={handlePrimarySubmit}
      onAttach={addFiles}
      canSend={canSubmit}
      busy={busy}
      placeholder={agentBusy ? "Nudge the agent..." : "Message the session..."}
      hideSend={agentBusy}
    >
      <StagedFiles files={files} uploading={uploading} onRemove={removeFile} />
      <QueuedFollowUps
        items={queue}
        onSendNow={sendQueuedNow}
        onDiscard={discardQueued}
        disabled={busy}
      />
      {agentBusy ? (
        <RunControls
          canSubmit={canSubmit}
          onAbort={onAbort}
          onSteer={() => void handleSubmit("steer")}
          onFollowUp={() => void enqueueFollowUp()}
        />
      ) : null}
    </ComposerShell>
  );
}
