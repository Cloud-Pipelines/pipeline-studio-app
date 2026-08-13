import {
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  type ReactNode,
  useRef,
} from "react";

import { Box } from "@/components/ui/box";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { IconButton } from "@/components/ui/patterns/icon-button";
import { Textarea } from "@/components/ui/textarea";

import { FileDropZone } from "./FileDropZone";

// Pasted blobs are often named generically, so derive a unique, readable name
// from the MIME subtype to disambiguate the staged-file pills.
function extractPastedImages(e: ClipboardEvent): File[] {
  const images: File[] = [];
  for (const item of Array.from(e.clipboardData.items)) {
    if (!item.type.startsWith("image/")) continue;
    const blob = item.getAsFile();
    if (!blob) continue;
    const ext = blob.type.split("/")[1] || "png";
    images.push(
      new File([blob], `pasted-${Date.now()}.${ext}`, { type: blob.type }),
    );
  }
  return images;
}

interface ComposerShellProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  onAttach: (files: File[]) => void;
  canSend: boolean;
  busy?: boolean;
  placeholder?: string;
  hideSend?: boolean;
  children?: ReactNode;
}

export function ComposerShell({
  value,
  onValueChange,
  onSubmit,
  onAttach,
  canSend,
  busy,
  placeholder = "Message the session...",
  hideSend,
  children,
}: ComposerShellProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFilesPicked(e: ChangeEvent<HTMLInputElement>) {
    onAttach(e.target.files ? Array.from(e.target.files) : []);
    e.target.value = "";
  }

  function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    if (busy) return;
    const images = extractPastedImages(e);
    if (images.length === 0) return;
    e.preventDefault();
    onAttach(images);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <FileDropZone onFilesDropped={onAttach} disabled={busy}>
      <Box borderBlockStart="sm" padding="sm" inlineSize="full">
        <BlockStack gap="2">
          {children}
          <InlineStack gap="2" blockAlign="start" wrap="nowrap" fill>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={handleFilesPicked}
            />
            <IconButton
              icon="Paperclip"
              variant="outline"
              size="lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              aria-label="Attach files"
            />
            <Textarea
              autoGrow
              rows={2}
              placeholder={placeholder}
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              disabled={busy}
            />
            {hideSend ? null : (
              <IconButton
                icon="Send"
                variant="outline"
                size="lg"
                onClick={onSubmit}
                disabled={!canSend}
                aria-label="Send message"
              />
            )}
          </InlineStack>
        </BlockStack>
      </Box>
    </FileDropZone>
  );
}
