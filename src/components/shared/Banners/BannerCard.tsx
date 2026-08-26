import { InfoBox } from "@/components/shared/InfoBox";
import { UntrustedMarkdown } from "@/components/shared/Markdown/Markdown";
import { BlockStack } from "@/components/ui/layout";
import { Link } from "@/components/ui/link";
import type { TangleBanner } from "@/config/banners";
import { cn } from "@/lib/utils";

interface BannerCardProps {
  banner: TangleBanner;
  clampBody?: boolean;
  onHide?: () => void;
  onDismiss?: () => void;
}

export const BannerCard = ({
  banner,
  clampBody = false,
  onHide,
  onDismiss,
}: BannerCardProps) => {
  const hasBody = banner.body.trim().length > 0;

  return (
    <InfoBox
      title={banner.title}
      variant={banner.variant}
      width="full"
      onDismiss={onHide ?? onDismiss}
      dismissIcon={onHide ? "EyeOff" : undefined}
      dismissLabel={onHide ? "Hide notice" : undefined}
    >
      <BlockStack gap="1">
        {hasBody && (
          <div
            className={cn(
              "text-pretty",
              clampBody && "max-h-32 overflow-y-auto",
            )}
            data-testid="banner-body"
          >
            <UntrustedMarkdown body={banner.body} />
          </div>
        )}
        {banner.action && (
          <Link
            href={banner.action.url}
            size="sm"
            variant="primary"
            external
            aria-label={
              banner.title
                ? `${banner.action.text}: ${banner.title}`
                : banner.action.text
            }
          >
            {banner.action.text}
          </Link>
        )}
      </BlockStack>
    </InfoBox>
  );
};
