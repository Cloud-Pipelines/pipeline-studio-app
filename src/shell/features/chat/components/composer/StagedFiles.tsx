import { Icon } from "@/components/ui/icon";
import { InlineStack } from "@/components/ui/layout";
import { IconButton } from "@/components/ui/patterns/icon-button";
import { Pill } from "@/components/ui/patterns/pill";

interface StagedFilesProps {
  /** Files staged for upload, shown as removable pills. */
  files: File[];
  /** Disables removal while an upload is in flight. */
  uploading: boolean;
  /** Removes the staged file at the given index. */
  onRemove: (index: number) => void;
}

/** Removable pills for the files staged in the composer before sending. */
export function StagedFiles({ files, uploading, onRemove }: StagedFilesProps) {
  if (files.length === 0) return null;
  return (
    <InlineStack gap="1" wrap="wrap">
      {files.map((file, index) => (
        <Pill key={`${file.name}-${index}`} tone="subdued">
          <Icon name="File" size="xs" />
          {file.name}
          <IconButton
            icon="X"
            size="xs"
            variant="ghost"
            onClick={() => onRemove(index)}
            disabled={uploading}
            aria-label={`Remove ${file.name}`}
          />
        </Pill>
      ))}
    </InlineStack>
  );
}
