import { useState } from "react";

import { IconButton } from "@/components/ui/patterns/icon-button";

type CopiedFormat = "plain" | "markdown" | null;

interface CopyButtonProps {
  content: string;
}

export function CopyButton({ content }: CopyButtonProps) {
  const [copied, setCopied] = useState<CopiedFormat>(null);
  const disabled = !content.trim();

  async function copyText(text: string, format: Exclude<CopiedFormat, null>) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(format);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard access can be denied (e.g. insecure context); fail silently.
    }
  }

  return (
    <IconButton
      icon={copied === "markdown" ? "Check" : "Copy"}
      size="xs"
      variant="ghost"
      disabled={disabled}
      aria-label={copied === "markdown" ? "Copied" : "Copy as Markdown"}
      onClick={() => copyText(content, "markdown")}
    />
  );
}
