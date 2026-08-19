import { Icon } from "@/components/ui/icon";
import { InlineStack } from "@/components/ui/layout";
import { Pill } from "@/components/ui/patterns/pill";
import type { Attachment } from "@/shell/features/chat/model/types";
import { apiUrl } from "@/shell/lib/basePath";

interface MessageAttachmentsProps {
  sessionId: string;
  attachments: Attachment[];
}

/** Renders the message's attached files as links to the session file API. */
export function MessageAttachments({
  sessionId,
  attachments,
}: MessageAttachmentsProps) {
  return (
    <InlineStack gap="1" wrap="wrap">
      {attachments.map((attachment) => (
        <a
          key={attachment.path}
          href={apiUrl(`/api/sessions/${sessionId}/files/${attachment.path}`)}
          target="_blank"
          rel="noreferrer"
        >
          <Pill tone="subdued" hoverable title={attachment.name}>
            <Icon name="File" size="xs" />
            {attachment.name}
          </Pill>
        </a>
      ))}
    </InlineStack>
  );
}
