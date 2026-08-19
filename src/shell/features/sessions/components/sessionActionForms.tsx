import { type KeyboardEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Text } from "@/components/ui/typography";

interface SessionRenameFormProps {
  initialName: string;
  pending: boolean;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

/** Inline rename field used inside the session rename popover. */
export function SessionRenameForm({
  initialName,
  pending,
  onSubmit,
  onCancel,
}: SessionRenameFormProps) {
  const [value, setValue] = useState(initialName);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit(value);
    }
  };

  return (
    <BlockStack gap="2">
      {/* Raw input: a styled single-line field, exempt from
          tangle-ui/no-classname-on-primitives like SessionFilterInput. */}
      <input
        type="text"
        value={value}
        autoFocus
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Session name"
        className="placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-sm outline-none transition-[color,box-shadow] focus-visible:ring-[3px]"
      />
      <InlineStack gap="2" align="end">
        <Button variant="ghost" size="xs" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="default"
          size="xs"
          disabled={pending}
          onClick={() => onSubmit(value)}
        >
          {pending ? "Saving..." : "Save"}
        </Button>
      </InlineStack>
    </BlockStack>
  );
}

interface SessionDeleteConfirmProps {
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Inline delete confirmation used inside the session delete popover. */
export function SessionDeleteConfirm({
  pending,
  onConfirm,
  onCancel,
}: SessionDeleteConfirmProps) {
  return (
    <BlockStack gap="2">
      <Text size="sm">Delete this session? This can&apos;t be undone.</Text>
      <InlineStack gap="2" align="end">
        <Button variant="ghost" size="xs" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          size="xs"
          disabled={pending}
          onClick={onConfirm}
        >
          {pending ? "Deleting..." : "Delete"}
        </Button>
      </InlineStack>
    </BlockStack>
  );
}
