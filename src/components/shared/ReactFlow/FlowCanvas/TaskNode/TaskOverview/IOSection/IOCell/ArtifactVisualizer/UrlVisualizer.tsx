import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { BlockStack, InlineStack } from "@/components/ui/layout";
import { Link } from "@/components/ui/link";
import { Paragraph, Text } from "@/components/ui/typography";
import useToastNotification from "@/hooks/useToastNotification";
import { copyToClipboard } from "@/utils/string";
import { parseHttpUrl } from "@/utils/URL";

import { useArtifactFetch } from "./useArtifactFetch";

interface UrlValueProps {
  url: string;
  size?: "xs" | "sm";
}

export const UrlValue = ({ url, size = "sm" }: UrlValueProps) => {
  const notify = useToastNotification();

  const handleCopy = () => {
    copyToClipboard(url);
    notify("URL copied to clipboard", "success");
  };

  return (
    <InlineStack gap="1" blockAlign="center" wrap="nowrap" className="min-w-0">
      <Link
        href={url}
        external
        size={size}
        title={url}
        className="min-w-0"
        variant="primary"
      >
        <Text size={size} font="mono" className="min-w-0 truncate">
          {url}
        </Text>
      </Link>

      <Button
        size="xs"
        variant="ghost"
        onClick={handleCopy}
        aria-label="Copy URL"
      >
        <Icon name="Copy" size="xs" />
      </Button>
    </InlineStack>
  );
};

const UrlContent = ({ content }: { content: string }) => {
  const trimmed = content.trim();

  if (trimmed.length === 0) {
    return (
      <Paragraph tone="subdued" size="xs">
        No data
      </Paragraph>
    );
  }

  const url = parseHttpUrl(trimmed);

  if (!url) {
    return (
      <BlockStack gap="1">
        <Paragraph tone="subdued" size="xs">
          Not a valid URL
        </Paragraph>
        <Text size="sm" font="mono" className="break-all">
          {trimmed}
        </Text>
      </BlockStack>
    );
  }

  return <UrlValue url={url} />;
};

interface UrlVisualizerValueProps {
  value: string;
}

interface UrlVisualizerRemoteProps {
  signedUrl: string;
}

export const UrlVisualizerValue = ({ value }: UrlVisualizerValueProps) => (
  <UrlContent content={value} />
);

export const UrlVisualizerRemote = ({
  signedUrl,
}: UrlVisualizerRemoteProps) => {
  const content = useArtifactFetch("url", signedUrl, (r) => r.text());
  return <UrlContent content={content} />;
};
