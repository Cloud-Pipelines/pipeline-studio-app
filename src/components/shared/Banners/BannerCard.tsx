import { InfoBox } from "@/components/shared/InfoBox";
import { UntrustedMarkdown } from "@/components/shared/Markdown/Markdown";
import { BlockStack } from "@/components/ui/layout";
import { Link } from "@/components/ui/link";
import type { TangleBanner } from "@/config/banners";

interface BannerCardProps {
  banner: TangleBanner;
  bodyClassName?: string;
  onDismiss?: () => void;
}

export const BannerCard = ({
  banner,
  bodyClassName,
  onDismiss,
}: BannerCardProps) => {
  const hasBody = banner.body.trim().length > 0;

  return (
    <InfoBox
      title={banner.title}
      variant={banner.variant}
      width="full"
      onDismiss={onDismiss}
    >
      <BlockStack gap="1">
        {hasBody && (
          <div className={bodyClassName}>
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
