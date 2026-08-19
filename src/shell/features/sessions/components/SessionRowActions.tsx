import { type MouseEvent, type SyntheticEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { InlineStack } from "@/components/ui/layout";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Session } from "@/shell/contracts";
import {
  SessionDeleteConfirm,
  SessionRenameForm,
} from "@/shell/features/sessions/components/sessionActionForms";
import { useDeleteSession } from "@/shell/features/sessions/hooks/useDeleteSession";
import { useUpdateSession } from "@/shell/features/sessions/hooks/useUpdateSession";

interface SessionRowActionsProps {
  session: Session;
  /** Called after the session is deleted (e.g. to navigate away from it). */
  onDeleted?: (id: string) => void;
}

/**
 * Inline session actions for a table row: three labelled buttons (rename,
 * archive/unarchive, delete). Rename and delete open a small popover for input
 * or confirmation; archive toggles immediately. Clicks never bubble to the
 * row's open handler.
 */
export function SessionRowActions({
  session,
  onDeleted,
}: SessionRowActionsProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSession();

  const stop = (event: SyntheticEvent) => event.stopPropagation();

  const toggleArchive = (event: MouseEvent) => {
    event.stopPropagation();
    updateSession.mutate({
      id: session.id,
      input: { archived: !session.archived },
    });
  };

  const submitRename = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === session.name) {
      setRenameOpen(false);
      return;
    }
    updateSession.mutate(
      { id: session.id, input: { name: trimmed } },
      { onSuccess: () => setRenameOpen(false) },
    );
  };

  const confirmDelete = () => {
    deleteSession.mutate(session.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        onDeleted?.(session.id);
      },
    });
  };

  return (
    <InlineStack gap="1" blockAlign="center" wrap="nowrap">
      <Popover open={renameOpen} onOpenChange={setRenameOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="xs" tone="default" onClick={stop}>
            <Icon name="Pencil" size="xs" tone="subdued" />
            Rename
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="overflow-hidden p-1"
          align="end"
          onClick={stop}
          onKeyDown={stop}
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <SessionRenameForm
            initialName={session.name}
            pending={updateSession.isPending}
            onSubmit={submitRename}
            onCancel={() => setRenameOpen(false)}
          />
        </PopoverContent>
      </Popover>

      <Button variant="ghost" size="xs" onClick={toggleArchive}>
        <Icon
          name={session.archived ? "ArchiveRestore" : "Archive"}
          size="xs"
          tone="subdued"
        />
        {session.archived ? "Unarchive" : "Archive"}
      </Button>

      <Popover open={deleteOpen} onOpenChange={setDeleteOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="xs" tone="critical" onClick={stop}>
            <Icon name="Trash" size="xs" />
            Delete
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="overflow-hidden p-1"
          align="end"
          onClick={stop}
          onKeyDown={stop}
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <SessionDeleteConfirm
            pending={deleteSession.isPending}
            onConfirm={confirmDelete}
            onCancel={() => setDeleteOpen(false)}
          />
        </PopoverContent>
      </Popover>
    </InlineStack>
  );
}
