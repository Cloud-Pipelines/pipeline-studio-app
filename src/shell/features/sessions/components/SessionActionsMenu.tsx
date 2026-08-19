import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BlockStack } from "@/components/ui/layout";
import { IconButton } from "@/components/ui/patterns/icon-button";
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

/** Which sub-view the actions popover currently shows. */
type View = "menu" | "rename" | "delete";

interface SessionActionsMenuProps {
  session: Session;
  /** Called after the session is deleted (e.g. to navigate away from it). */
  onDeleted?: (id: string) => void;
}

/**
 * Per-row actions for a session: rename, archive/unarchive, and delete. Rendered
 * as a single controlled popover that switches between a menu, an inline rename
 * form, and an inline delete confirmation — keeping all three in one anchored
 * surface without a separate dialog primitive.
 */
export function SessionActionsMenu({
  session,
  onDeleted,
}: SessionActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("menu");

  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSession();

  // Reset to the menu view whenever the popover (re)opens so a prior
  // rename/delete view never lingers.
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setView("menu");
  };

  const close = () => setOpen(false);

  const toggleArchive = () => {
    updateSession.mutate({
      id: session.id,
      input: { archived: !session.archived },
    });
    close();
  };

  const submitRename = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === session.name) {
      close();
      return;
    }
    updateSession.mutate(
      { id: session.id, input: { name: trimmed } },
      { onSuccess: close },
    );
  };

  const confirmDelete = () => {
    deleteSession.mutate(session.id, {
      onSuccess: () => {
        close();
        onDeleted?.(session.id);
      },
    });
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <IconButton
          icon="EllipsisVertical"
          aria-label={`Actions for ${session.name}`}
          onClick={(event) => event.stopPropagation()}
        />
      </PopoverTrigger>
      <PopoverContent
        className="overflow-hidden p-1"
        align="end"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        {view === "menu" ? (
          <MenuView
            archived={session.archived}
            onRename={() => setView("rename")}
            onToggleArchive={toggleArchive}
            onDelete={() => setView("delete")}
          />
        ) : null}
        {view === "rename" ? (
          <SessionRenameForm
            initialName={session.name}
            pending={updateSession.isPending}
            onSubmit={submitRename}
            onCancel={() => setView("menu")}
          />
        ) : null}
        {view === "delete" ? (
          <SessionDeleteConfirm
            pending={deleteSession.isPending}
            onConfirm={confirmDelete}
            onCancel={() => setView("menu")}
          />
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

interface MenuViewProps {
  archived: boolean;
  onRename: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
}

function MenuView({
  archived,
  onRename,
  onToggleArchive,
  onDelete,
}: MenuViewProps) {
  return (
    <BlockStack gap="1">
      <Button
        variant="ghost"
        size="sm"
        align="start"
        fullWidth
        onClick={onRename}
      >
        <Icon name="Pencil" size="xs" tone="subdued" />
        Rename
      </Button>
      <Button
        variant="ghost"
        size="sm"
        align="start"
        fullWidth
        onClick={onToggleArchive}
      >
        <Icon
          name={archived ? "ArchiveRestore" : "Archive"}
          size="xs"
          tone="subdued"
        />
        {archived ? "Unarchive" : "Archive"}
      </Button>
      <Button
        variant="ghost"
        tone="critical"
        size="sm"
        align="start"
        fullWidth
        onClick={onDelete}
      >
        <Icon name="Trash" size="xs" />
        Delete
      </Button>
    </BlockStack>
  );
}
