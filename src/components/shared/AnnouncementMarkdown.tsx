import type { ComponentProps, ReactNode } from "react";
import Markdown from "react-markdown";

import { Link } from "@/components/ui/link";
import { Paragraph } from "@/components/ui/typography";

const ALLOWED_ELEMENTS = [
  "p",
  "a",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "code",
  "br",
];

function isAbsoluteHttpUrl(value: string | undefined): value is string {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function MarkdownLink({ href, children }: ComponentProps<"a">) {
  if (!isAbsoluteHttpUrl(href)) return children;

  return (
    <Link href={href} size="sm" variant="primary" external>
      {children}
    </Link>
  );
}

const components = {
  p: ({ children }: { children?: ReactNode }) => (
    <Paragraph size="sm" className="my-1 leading-relaxed">
      {children}
    </Paragraph>
  ),
  a: MarkdownLink,
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="my-1 list-disc pl-4">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="my-1 list-decimal pl-4">{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => (
    <li className="my-0.5">{children}</li>
  ),
  code: ({ children }: { children?: ReactNode }) => (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
      {children}
    </code>
  ),
};

interface AnnouncementMarkdownProps {
  children: string;
}

export function AnnouncementMarkdown({ children }: AnnouncementMarkdownProps) {
  return (
    <Markdown
      allowedElements={ALLOWED_ELEMENTS}
      components={components}
      skipHtml
      unwrapDisallowed
    >
      {children}
    </Markdown>
  );
}
