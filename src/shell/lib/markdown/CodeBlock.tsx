// local primitive — Prism-highlighted, read-only code block with a copy
// button. Renders raw <pre>/<button> elements, so the scoped Tailwind classes
// here are an allowed escape hatch (not Tangle UI primitives).
import { Highlight, themes } from "prism-react-renderer";
import { memo, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/shell/lib/utils";

interface CodeBlockProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  className?: string;
}

// Map common language aliases to Prism language identifiers.
const languageMap: Record<string, string> = {
  yaml: "yaml",
  yml: "yaml",
  javascript: "javascript",
  js: "javascript",
  typescript: "typescript",
  ts: "typescript",
  python: "python",
  py: "python",
  json: "json",
  bash: "bash",
  shell: "bash",
  sh: "bash",
};

/**
 * A lightweight read-only code block using Prism for syntax highlighting, with
 * a copy-to-clipboard button. Faster and lighter than a full editor when no
 * editing is needed.
 */
const CodeBlock = memo(function CodeBlock({
  code,
  language,
  showLineNumbers = false,
  className,
}: CodeBlockProps) {
  const prismLanguage = languageMap[language.toLowerCase()] ?? language;
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      // Revert the affordance after a short delay so it can be reused.
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied (e.g. insecure context); fail silently.
    }
  }

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Copied" : "Copy code"}
        className="absolute top-1.5 right-1.5 z-10 inline-flex items-center justify-center rounded-md border border-white/10 bg-white/10 p-1 text-white/70 opacity-0 transition hover:bg-white/20 hover:text-white focus-visible:opacity-100 group-hover:opacity-100"
      >
        <Icon name={copied ? "Check" : "Copy"} size="xs" />
      </button>
      <Highlight
        theme={themes.vsDark}
        code={code.trim()}
        language={prismLanguage}
      >
        {({
          className: prismClassName,
          style,
          tokens,
          getLineProps,
          getTokenProps,
        }) => (
          <pre
            className={cn(
              prismClassName,
              "h-full w-full overflow-auto m-0 p-3 text-sm font-mono",
              className,
            )}
            style={style}
          >
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line, key: i });
              return (
                <div
                  key={i}
                  {...lineProps}
                  className={cn(lineProps.className, "table-row")}
                >
                  {showLineNumbers && (
                    <span className="table-cell pr-4 text-right select-none opacity-50 text-xs">
                      {i + 1}
                    </span>
                  )}
                  <span className="table-cell">
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token, key })} />
                    ))}
                  </span>
                </div>
              );
            })}
          </pre>
        )}
      </Highlight>
    </div>
  );
});

export { CodeBlock };
