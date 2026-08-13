// local primitive — renders agent markdown output, styling the raw markdown
// HTML elements (h1/ul/a/img/code/table/...). These are not Tangle UI
// primitives, so the scoped classNames here are an allowed escape hatch.
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { createContext, useContext } from "react";
import ReactMarkdown, {
  type Components,
  defaultUrlTransform,
  type ExtraProps,
} from "react-markdown";
import remarkGfm from "remark-gfm";

import { Icon } from "@/components/ui/icon";
import { InlineStack } from "@/components/ui/layout";
import { Link } from "@/components/ui/link";
import { Separator } from "@/components/ui/separator";
import { Heading, Paragraph, Text } from "@/components/ui/typography";
import { apiUrl } from "@/shell/lib/basePath";
import {
  artifactPath,
  isAbsoluteUrl,
  isArtifactsLink,
  isViewableArtifact,
  resolveUrl,
} from "@/shell/lib/markdown/artifact";
import { cn } from "@/shell/lib/utils";

import { CodeBlock } from "./CodeBlock";

/**
 * Matches a bundle-UI message token's language class, e.g.
 * `language-tangent-ui:pipeline-progress`. The plain `/language-(\w+)/` used
 * for normal code blocks cannot match this (the name has a hyphen and the class
 * a colon), so this prefix is checked first.
 */
const BUNDLE_UI_LANGUAGE = /language-tangent-ui:([a-z0-9][a-z0-9-]*)/;

/** Body-text size for flowing markdown content (paragraphs, list items, links). */
type MarkdownSize = "xs" | "sm" | "md";

/** Text tone applied to flowing body content (paragraphs, list items, headings). */
type MarkdownTone = "inherit" | "subdued";

interface MarkdownProps {
  children: string;
  className?: string;
  /**
   * Default text size for flowing body content (paragraphs, list items, inline
   * links). Structural elements (headings, tables, code) keep their own sizing.
   * @default "sm"
   */
  size?: MarkdownSize;
  /**
   * Text tone for flowing body content (paragraphs, list items, headings). Use
   * `"subdued"` to render muted text. Links, code, and tables keep their own
   * styling.
   * @default "inherit"
   */
  tone?: MarkdownTone;
  /**
   * Base URL (e.g. `/api/sessions/<id>/files`) used to resolve relative
   * artifact references in agent output. Relative `img`/`a` URLs are rewritten
   * to point at this session's file API; absolute and non-http schemes are
   * left untouched. When set, relative `a` links render as artifact chips.
   */
  artifactBaseUrl?: string;
  /**
   * The agent bundle this session was created from, if any. When set, fenced
   * `tangent-ui:<name>` blocks the agent emits render that bundle's sandboxed
   * message component instead of a code block. Absent outside a bundle session,
   * where such blocks fall back to a normal code block.
   */
  bundleId?: string;
  /**
   * Forwards a composed prompt from an interactive `tangent-ui:<name>` message
   * component to the chat, exactly as if the user had typed it. Omitted in
   * read-only contexts (e.g. sub-agent threads), where such components stay
   * inert.
   */
  onSendPrompt?: (text: string) => void;
  /**
   * Opens a browser-viewable "page" artifact (HTML, PDF, image, text) in an
   * in-app tab instead of a new browser window. When omitted, viewable artifact
   * links fall back to the same download chip as plain file artifacts.
   */
  onOpenArtifact?: (url: string, title: string) => void;
  /**
   * The set of currently pinned artifact paths (workspace-relative), used to
   * show whether an artifact chip is already pinned.
   */
  pinnedPaths?: Set<string>;
  /**
   * Toggles an artifact's pinned state from its chip, identified by its
   * workspace-relative path. When omitted, chips render without a pin control
   * (e.g. read-only contexts).
   */
  onTogglePinArtifact?: (path: string, title: string) => void;
  /**
   * The chat session id, combined with `messageId` to namespace a bundle
   * message component's persisted state. Omitted disables `host.getState`/
   * `setState` persistence for any `tangent-ui:<name>` blocks.
   */
  sessionId?: string;
  /**
   * The id of the message this markdown belongs to. Used (with `sessionId`) as
   * the stable state namespace for bundle message components.
   */
  messageId?: string;
  /**
   * Collapses the message this markdown belongs to. Forwarded to bundle message
   * components so they can request collapse via `host.execUICommand`.
   */
  onCollapse?: () => void;
}

/**
 * Options for {@link buildComponents}. Mirrors the body-content and artifact
 * props on {@link MarkdownProps}, with `size`/`tone` resolved to concrete
 * defaults by the caller.
 */
interface MarkdownComponentsOptions {
  artifactBaseUrl?: string;
  size: MarkdownSize;
  tone: MarkdownTone;
  bundleId?: string;
  onSendPrompt?: (text: string) => void;
  onOpenArtifact?: (url: string, title: string) => void;
  pinnedPaths?: Set<string>;
  onTogglePinArtifact?: (path: string, title: string) => void;
  sessionId?: string;
  messageId?: string;
  onCollapse?: () => void;
}

/**
 * Supplies the active render options to the markdown element components below.
 *
 * The `components` map handed to `react-markdown` is a single, module-level
 * object of stable component types (see {@link MARKDOWN_COMPONENTS}). Keeping
 * those types referentially stable across renders is what stops `react-markdown`
 * from unmounting and remounting a node's subtree every time `Markdown`
 * re-renders — critical for `tangent-ui:` blocks, whose `BundleUiHost` would
 * otherwise tear down and reboot its Web Worker (visible as flicker) on every
 * chat message add/update. The per-render, possibly-changing options (callbacks,
 * `pinnedPaths`, ...) flow in through this context instead of being baked into
 * fresh closures, so the components stay current without changing identity.
 */
const MarkdownOptionsContext = createContext<MarkdownComponentsOptions | null>(
  null,
);

function useMarkdownOptions(): MarkdownComponentsOptions {
  const options = useContext(MarkdownOptionsContext);
  if (!options) {
    throw new Error(
      "Markdown element components must render within <MarkdownOptionsContext>",
    );
  }
  return options;
}

/** Resolves the heading text tone from the body content tone. */
function headingToneFor(tone: MarkdownTone): "subdued" | "heading" {
  return tone === "subdued" ? "subdued" : "heading";
}

const INLINE_CODE_CLASS =
  "rounded bg-message-code text-message-code-foreground px-1 py-0.5 text-xs font-mono break-words";

/**
 * Special link scheme that turns a markdown link into a chat action: clicking it
 * sends the payload to the chat via `onSendPrompt` instead of navigating.
 */
const PROMPT_SCHEME = "prompt://";

/** Returns the decoded prompt payload for a `prompt://` href, else undefined. */
function parsePromptHref(href: string | undefined): string | undefined {
  if (typeof href !== "string" || !href.startsWith(PROMPT_SCHEME))
    return undefined;
  const raw = href.slice(PROMPT_SCHEME.length);
  try {
    return decodeURIComponent(raw).trim() || undefined;
  } catch {
    return raw.trim() || undefined;
  }
}

/**
 * URL sanitizer for `react-markdown`. The default transform drops unknown
 * protocols (keeping only http/https/mailto/etc.), which would blank our
 * `prompt://` links before the `a` handler runs. Preserve those; defer to the
 * default for everything else.
 */
function urlTransform(url: string): string {
  return url.startsWith(PROMPT_SCHEME) ? url : defaultUrlTransform(url);
}

/** Derives a short tab title from the link text, falling back to the filename. */
function artifactLabel(children: ReactNode, url: string): string {
  if (typeof children === "string" && children.trim()) return children.trim();
  const path = url.split(/[?#]/, 1)[0];
  const filename = path.split("/").pop() ?? url;
  try {
    return decodeURIComponent(filename);
  } catch {
    return filename;
  }
}

/**
 * Artifact chip — a recognizable, padded pill-style reference for artifact
 * output. The main action opens the artifact in an in-app tab (`onOpen`) or
 * links to it for download. When `onTogglePin` is set, an adjacent pin toggle
 * lets the user keep the artifact in the sidebar's quick-access list. Raw
 * `<span>`/`<a>`/`<button>`, so scoped classes are fine.
 */
const ARTIFACT_CHIP_CLASS =
  "inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 align-middle text-xs font-medium text-foreground";
const ARTIFACT_ACTION_CLASS =
  "inline-flex min-w-0 items-center gap-1 text-foreground no-underline transition hover:opacity-70";
const ARTIFACT_PIN_CLASS =
  "inline-flex shrink-0 items-center transition hover:opacity-70";

interface ArtifactChipProps {
  href?: string;
  title?: string;
  children?: ReactNode;
  onOpen?: () => void;
  pinned?: boolean;
  onTogglePin?: () => void;
}

function ArtifactChip({
  href,
  title,
  children,
  onOpen,
  pinned,
  onTogglePin,
}: ArtifactChipProps) {
  const action = onOpen ? (
    <button
      type="button"
      title={title}
      onClick={onOpen}
      className={ARTIFACT_ACTION_CLASS}
    >
      <Icon name="FileText" size="xs" tone="subdued" />
      <span className="truncate">{children}</span>
    </button>
  ) : (
    <a
      href={href}
      title={title}
      target="_blank"
      rel="noreferrer"
      className={ARTIFACT_ACTION_CLASS}
    >
      <Icon name="Paperclip" size="xs" tone="subdued" />
      <span className="truncate">{children}</span>
    </a>
  );

  return (
    <span className={ARTIFACT_CHIP_CLASS}>
      {action}
      {onTogglePin ? (
        <button
          type="button"
          title={pinned ? "Unpin from sidebar" : "Pin to sidebar"}
          aria-label={pinned ? "Unpin artifact" : "Pin artifact"}
          aria-pressed={pinned}
          onClick={onTogglePin}
          className={ARTIFACT_PIN_CLASS}
        >
          <Icon
            name={pinned ? "PinOff" : "Pin"}
            size="xs"
            tone={pinned ? "accent" : "subdued"}
          />
        </button>
      ) : null}
    </span>
  );
}

/**
 * Prompt action link — a `prompt://` markdown link that sends its payload to
 * the chat instead of navigating. Styled distinctly from regular links (dashed
 * underline + leading prompt icon). Raw `<button>`, so scoped classes are fine.
 * In read-only contexts (no `onSend`) it renders as inert text.
 */
const PROMPT_LINK_CLASS =
  "inline cursor-pointer text-primary underline decoration-dashed underline-offset-2 hover:decoration-solid";

interface PromptLinkProps {
  prompt: string;
  children?: ReactNode;
  onSend?: (text: string) => void;
  size: MarkdownSize;
}

function PromptLink({ prompt, children, onSend, size }: PromptLinkProps) {
  if (!onSend) {
    return (
      <Text as="span" size={size}>
        {children}
      </Text>
    );
  }

  return (
    <button
      type="button"
      title="Send as prompt"
      onClick={() => onSend(prompt)}
      className={PROMPT_LINK_CLASS}
    >
      <InlineStack gap="1" wrap="nowrap" grow>
        <Icon name="Sparkles" size="xs" tone="subdued" />
        {children}
      </InlineStack>
    </button>
  );
}

/**
 * Placeholder for an agent-emitted `tangent-ui:<name>` block. Upstream these
 * render as sandboxed interactive components loaded from the session's agent
 * bundle; that runtime is not part of this build, so the block is named rather
 * than rendered. The `bundleId`/`messageId`/`onCollapse` markdown options stay
 * wired through so restoring the host is a local change here.
 */
function BundleUiMessage({ name }: { name: string }) {
  return (
    <Text size="xs" tone="subdued" italic>
      Interactive component `{name}` is not available in this build.
    </Text>
  );
}

// Props each element component receives: the intrinsic element's attributes
// plus react-markdown's `node` (enabled via `passNode`). Dynamic render options
// come from context, not props, so these component types stay referentially
// stable (see {@link MarkdownOptionsContext}).
type HeadingProps = ComponentPropsWithoutRef<"h1"> & ExtraProps;
type ParagraphProps = ComponentPropsWithoutRef<"p"> & ExtraProps;
type ListItemProps = ComponentPropsWithoutRef<"li"> & ExtraProps;
type AnchorProps = ComponentPropsWithoutRef<"a"> & ExtraProps;
type ImageProps = ComponentPropsWithoutRef<"img"> & ExtraProps;
type CodeProps = ComponentPropsWithoutRef<"code"> & ExtraProps;

function MdHeading1({ children }: HeadingProps) {
  const { tone } = useMarkdownOptions();
  return (
    <Heading level={1} size="sm" weight="bold" tone={headingToneFor(tone)}>
      {children}
    </Heading>
  );
}

function MdHeading2({ children }: HeadingProps) {
  const { tone } = useMarkdownOptions();
  return (
    <Heading level={2} size="sm" weight="bold" tone={headingToneFor(tone)}>
      {children}
    </Heading>
  );
}

function MdHeading3({ children }: HeadingProps) {
  const { tone } = useMarkdownOptions();
  return (
    <Heading level={3} size="sm" weight="semibold" tone={headingToneFor(tone)}>
      {children}
    </Heading>
  );
}

function MdHeading4({ children }: HeadingProps) {
  const { tone } = useMarkdownOptions();
  return (
    <Heading level={4} size="sm" weight="semibold" tone={headingToneFor(tone)}>
      {children}
    </Heading>
  );
}

function MdParagraph({ children }: ParagraphProps) {
  const { size, tone } = useMarkdownOptions();
  return (
    <Paragraph size={size} leading="relaxed" tone={tone}>
      {children}
    </Paragraph>
  );
}

function MdListItem({ children }: ListItemProps) {
  const { size, tone } = useMarkdownOptions();
  return (
    <li className="my-0.5">
      <Text as="span" size={size} leading="relaxed" tone={tone}>
        {children}
      </Text>
    </li>
  );
}

function MdAnchor({ href, title, children }: AnchorProps) {
  const {
    artifactBaseUrl,
    size,
    onSendPrompt,
    onOpenArtifact,
    pinnedPaths,
    onTogglePinArtifact,
    sessionId,
  } = useMarkdownOptions();

  if (typeof href === "string" && href.startsWith(PROMPT_SCHEME)) {
    const promptText = parsePromptHref(href);
    const text =
      promptText ?? (typeof children === "string" ? children.trim() : "");
    return (
      <PromptLink prompt={text} onSend={onSendPrompt} size={size}>
        {children}
      </PromptLink>
    );
  }

  const isArtifact =
    artifactBaseUrl != null && typeof href === "string" && !isAbsoluteUrl(href);

  if (isArtifact) {
    const resolved = resolveUrl(href, artifactBaseUrl) ?? href;
    const openable = onOpenArtifact != null && isViewableArtifact(href);
    // The workspace-relative path is the stable identity used for pinning.
    const path = artifactPath(href);
    const label = artifactLabel(children, resolved);
    return (
      <ArtifactChip
        href={resolved}
        title={title}
        onOpen={openable ? () => onOpenArtifact(resolved, label) : undefined}
        pinned={pinnedPaths?.has(path)}
        onTogglePin={
          onTogglePinArtifact
            ? () => onTogglePinArtifact(path, label)
            : undefined
        }
      >
        {children}
      </ArtifactChip>
    );
  }

  const safetyBase =
    artifactBaseUrl ??
    (sessionId ? apiUrl(`/api/sessions/${sessionId}/files`) : undefined);
  const fixedHref =
    safetyBase != null && typeof href === "string" && isArtifactsLink(href)
      ? (resolveUrl(href, safetyBase) ?? href)
      : href;

  return (
    <Link href={fixedHref} title={title} variant="primary" size={size} external>
      {children}
    </Link>
  );
}

function MdImage({ src, alt, title }: ImageProps) {
  const { artifactBaseUrl } = useMarkdownOptions();
  return (
    <img
      src={
        artifactBaseUrl && typeof src === "string"
          ? resolveUrl(src, artifactBaseUrl)
          : src
      }
      alt={alt}
      title={title}
      className="max-w-full rounded border"
    />
  );
}

function MdCode({ className, children }: CodeProps) {
  const { bundleId } = useMarkdownOptions();

  // Bundle-UI message token: named as unavailable rather than rendered as a
  // code block, so a session created from a bundle doesn't spill raw JSON.
  const bundleMatch = bundleId ? className?.match(BUNDLE_UI_LANGUAGE) : null;
  if (bundleMatch) {
    return <BundleUiMessage name={bundleMatch[1]} />;
  }

  const match = className?.match(/language-(\w+)/);

  if (match) {
    const code = String(children).replace(/\n$/, "");
    return (
      <CodeBlock
        code={code}
        language={match[1]}
        showLineNumbers={false}
        className="my-1 h-auto max-h-64 rounded-md text-xs"
      />
    );
  }

  return <code className={INLINE_CODE_CLASS}>{children}</code>;
}

/**
 * Tag-to-component map handed to `react-markdown`. Defined once at module scope
 * so every component type is referentially stable across `Markdown` renders;
 * `react-markdown` reconciles each node's subtree in place instead of
 * unmounting and remounting it (which would reboot `BundleUiHost`'s worker).
 * Dynamic render options reach these components through {@link
 * MarkdownOptionsContext}.
 */
const MARKDOWN_COMPONENTS: Components = {
  h1: MdHeading1,
  h2: MdHeading2,
  h3: MdHeading3,
  h4: MdHeading4,
  p: MdParagraph,
  ul: ({ children }) => <ul className="my-1 list-disc pl-4">{children}</ul>,
  ol: ({ children }) => <ol className="my-1 list-decimal pl-4">{children}</ol>,
  li: MdListItem,
  blockquote: ({ children }) => (
    <blockquote className="my-2 rounded-sm border-l-4 border-message-quote-border bg-message-table-header py-1 pl-3">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto rounded-md border border-message-table-border">
      <table className="w-full text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-message-table-header">{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b last:border-b-0">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-2 py-1 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="px-2 py-1">{children}</td>,
  hr: () => <Separator />,
  a: MdAnchor,
  img: MdImage,
  code: MdCode,
  // Fenced code blocks are rendered by the `code` handler above; the `pre`
  // wrapper is flattened so it does not add an extra <pre> around CodeBlock.
  pre: ({ children }) => <>{children}</>,
};

export function Markdown({
  children,
  className,
  size = "sm",
  tone = "inherit",
  artifactBaseUrl,
  bundleId,
  onSendPrompt,
  onOpenArtifact,
  pinnedPaths,
  onTogglePinArtifact,
  sessionId,
  messageId,
  onCollapse,
}: MarkdownProps) {
  const options: MarkdownComponentsOptions = {
    artifactBaseUrl,
    size,
    tone,
    bundleId,
    onSendPrompt,
    onOpenArtifact,
    pinnedPaths,
    onTogglePinArtifact,
    sessionId,
    messageId,
    onCollapse,
  };

  return (
    <div className={cn("w-full min-w-0 space-y-2", className)}>
      <MarkdownOptionsContext.Provider value={options}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          urlTransform={urlTransform}
          components={MARKDOWN_COMPONENTS}
        >
          {children}
        </ReactMarkdown>
      </MarkdownOptionsContext.Provider>
    </div>
  );
}
