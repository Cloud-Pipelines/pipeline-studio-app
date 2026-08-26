import type { ComponentProps, ReactNode } from "react";
import ReactMarkdown, {
  type Components,
  defaultUrlTransform,
} from "react-markdown";
import remarkGfm from "remark-gfm";

import { Link } from "@/components/ui/link";
import { Separator } from "@/components/ui/separator";
import { Heading, Paragraph, Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { toAbsoluteHttpUrl } from "@/utils/URL";

interface ElementProps {
  children?: ReactNode;
  className?: string;
}

export const INLINE_CODE_CLASS =
  "rounded bg-muted px-1 py-0.5 text-xs font-mono";

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

const HEADING_STYLES: Record<
  HeadingLevel,
  Omit<ComponentProps<typeof Heading>, "level" | "children">
> = {
  1: { size: "lg", weight: "bold", className: "mt-2 mb-1 block" },
  2: { size: "md", weight: "semibold", className: "mt-2 mb-1 block" },
  3: { size: "sm", weight: "semibold", className: "mt-2 mb-1 block" },
  4: {
    size: "sm",
    weight: "semibold",
    tone: "subdued",
    className: "mt-1 block",
  },
  5: {
    size: "xs",
    weight: "semibold",
    tone: "subdued",
    className: "mt-1 block",
  },
  6: {
    size: "xs",
    weight: "semibold",
    tone: "subdued",
    className: "mt-1 block",
  },
};

function renderHeading(level: HeadingLevel) {
  const MarkdownHeading = ({ children }: ElementProps) => (
    <Heading level={level} {...HEADING_STYLES[level]}>
      {children}
    </Heading>
  );

  return MarkdownHeading;
}

const baseComponents = {
  p: ({ children }: ElementProps) => (
    <Paragraph size="sm" className="my-1 leading-relaxed">
      {children}
    </Paragraph>
  ),
  a: ({ href, children }: ElementProps & { href?: string }) => {
    if (!href) return <>{children}</>;

    return (
      <Link
        href={href}
        size="sm"
        variant="primary"
        external={toAbsoluteHttpUrl(href) !== null}
      >
        {children}
      </Link>
    );
  },
  h1: renderHeading(1),
  h2: renderHeading(2),
  h3: renderHeading(3),
  h4: renderHeading(4),
  h5: renderHeading(5),
  h6: renderHeading(6),
  ul: ({ children, className }: ElementProps) => (
    <ul
      className={cn(
        "my-1",
        className?.includes("contains-task-list")
          ? "pl-0"
          : "list-disc pl-4 marker:text-muted-foreground",
      )}
    >
      {children}
    </ul>
  ),
  ol: ({ children }: ElementProps) => (
    <ol className="list-decimal pl-4 my-1 marker:text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children, className }: ElementProps) => (
    <li
      className={cn(
        "my-0.5 [&>input]:mr-1.5 [&>input]:align-middle",
        className?.includes("task-list-item") && "list-none",
      )}
    >
      {children}
    </li>
  ),
  blockquote: ({ children }: ElementProps) => (
    <blockquote className="border-l-2 border-muted-foreground/30 pl-3 my-1 italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  code: ({ children }: ElementProps) => (
    <code className={INLINE_CODE_CLASS}>{children}</code>
  ),
  pre: ({ children }: ElementProps) => (
    <pre className="my-2 overflow-x-auto [&>code]:block [&>code]:p-2">
      {children}
    </pre>
  ),
  table: ({ children }: ElementProps) => (
    <div className="my-2 overflow-x-auto rounded-md border">
      <table className="w-full text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }: ElementProps) => (
    <thead className="bg-muted/50">{children}</thead>
  ),
  tr: ({ children }: ElementProps) => (
    <tr className="border-b last:border-b-0">{children}</tr>
  ),
  th: ({ children }: ElementProps) => (
    <th className="px-2 py-1 text-left font-semibold">{children}</th>
  ),
  td: ({ children }: ElementProps) => (
    <td className="px-2 py-1 align-top">{children}</td>
  ),
  img: ({ alt, src }: { alt?: string; src?: string }) => (
    <img src={src} alt={alt} className="my-2 max-w-full rounded" />
  ),
  hr: () => <Separator className="my-2" />,
} satisfies Components;
const AltTextOnlyImage = ({ alt }: { alt?: string }) =>
  alt ? (
    <Text size="xs" tone="subdued">
      {alt}
    </Text>
  ) : null;

interface MarkdownProps {
  body: string;
  components?: Components;
  urlTransform?: (url: string) => string;
}

export const Markdown = ({
  body,
  components,
  urlTransform = defaultUrlTransform,
}: MarkdownProps) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{ ...baseComponents, ...components }}
    urlTransform={urlTransform}
  >
    {body}
  </ReactMarkdown>
);

export const UntrustedMarkdown = ({
  body,
  components,
}: Omit<MarkdownProps, "urlTransform">) => (
  <Markdown
    body={body}
    components={{ ...components, img: AltTextOnlyImage }}
    urlTransform={(url) => toAbsoluteHttpUrl(url) ?? ""}
  />
);
