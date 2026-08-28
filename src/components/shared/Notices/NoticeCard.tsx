import { InfoBox } from "@/components/shared/InfoBox";
import { UntrustedMarkdown } from "@/components/shared/Markdown/Markdown";
import { Button } from "@/components/ui/button";
import { BlockStack } from "@/components/ui/layout";
import { Link } from "@/components/ui/link";
import type { TangleNotice } from "@/config/notices";
import { cn } from "@/lib/utils";

interface NoticeCardProps {
  notice: TangleNotice;
  clampBody?: boolean;
  onHide?: () => void;
  onDismiss?: () => void;
}

export const NoticeCard = ({
  notice,
  clampBody = false,
  onHide,
  onDismiss,
}: NoticeCardProps) => {
  const hasBody = notice.body.trim().length > 0;

  return (
    <InfoBox
      title={notice.title}
      variant={notice.variant}
      width="full"
      onDismiss={onHide ?? onDismiss}
      dismissIcon={onHide ? "EyeOff" : undefined}
      dismissLabel={onHide ? "Hide notice" : undefined}
    >
      <BlockStack gap="2">
        {hasBody && (
          <div
            className={cn(
              "text-pretty",
              clampBody && "max-h-32 overflow-y-auto",
            )}
            data-testid="notice-body"
          >
            <UntrustedMarkdown body={notice.body} />
          </div>
        )}
        {notice.action && (
          <Button asChild size="sm">
            <Link
              href={notice.action.url}
              size="sm"
              variant="block"
              external
              aria-label={`${notice.action.text}: ${notice.title}`}
            >
              {notice.action.text}
            </Link>
          </Button>
        )}
      </BlockStack>
    </InfoBox>
  );
};
